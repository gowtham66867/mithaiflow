import { randomUUID,createHash } from 'node:crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { policy, type Policy } from './flags';
export class BusinessError extends Error {constructor(public code:string,message:string,public status=409){super(message);} }
export const quoteInput=z.object({productId:z.enum(['kaju-katli','motichoor-laddu','mysore-pak']),grams:z.number().int().min(100).max(10000).refine(x=>x%50===0,'Choose a multiple of 50 g.'),slotId:z.string().min(1).max(80),language:z.enum(['hi-IN','en-IN']).default('en-IN')});
export const confirmInput=z.object({quoteId:z.string().uuid(),key:z.string().uuid(),customerName:z.string().trim().min(1,'Please enter your name.').max(60)});
export async function makeQuote(input:z.infer<typeof quoteInput>,sessionId:string){
  const p=await policy(sessionId);
  if(!p.accepting)throw new BusinessError('PAUSED','The shop has paused new preorders. Existing orders are safe.',503);
  const [product,slot]=await Promise.all([db.product.findUnique({where:{id:input.productId}}),db.slot.findUnique({where:{id:input.slotId}})]);
  if(!product||!slot)throw new BusinessError('NOT_FOUND','Please choose a product and pickup slot.',422);
  if(new Date(slot.pickupAt).getTime()<Date.now()+30*60000)throw new BusinessError('TOO_SOON','Please choose a pickup at least 30 minutes from now.');
  if(product.stockGrams-product.reservedGrams<input.grams)throw new BusinessError('STOCK',`Only ${product.stockGrams-product.reservedGrams} g of ${product.name} is available. Please review your quantity.`);
  if(slot.used>=Math.min(slot.capacity,p.slotLimit))throw new BusinessError('SLOT','This pickup slot is full. Please choose another time.');
  return db.quote.create({data:{id:randomUUID(),sessionId,...input,totalPaise:Math.round(product.pricePerKg*input.grams/1000),policy:JSON.stringify(p),expiresAt:new Date(Date.now()+5*60000)}});
}
type Tx=Prisma.TransactionClient;
async function transaction<T>(fn:(tx:Tx)=>Promise<T>):Promise<T>{
  for(let i=0;i<5;i++)try{return await db.$transaction(fn,{maxWait:10000,timeout:10000});}catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError && ['P2034','P1008','P2028'].includes(e.code)&&i<4){await new Promise(r=>setTimeout(r,30*(i+1)));continue;}throw e;}throw new Error('Transaction unavailable');
}
export async function confirm(input:z.infer<typeof confirmInput>,sessionId:string,providedPolicy?:Policy){
  const p=providedPolicy||await policy(sessionId);
  const fp=createHash('sha256').update(JSON.stringify([input.quoteId,input.customerName,sessionId])).digest('hex');
  return transaction(async tx=>{
    // Take the SQLite write lock before reading state. All writers use this same lock order.
    await tx.$executeRaw`UPDATE Setting SET value=value WHERE key='accepting_orders'`;
    const replay=await tx.operation.findUnique({where:{id:input.key}});
    if(replay){if(replay.fingerprint!==fp)throw new BusinessError('KEY_REUSED','This request key belongs to a different order.');return JSON.parse(replay.result);}
    const q=await tx.quote.findUnique({where:{id:input.quoteId}});
    if(!q || q.sessionId!==sessionId)throw new BusinessError('QUOTE','This review has expired. Please review your order again.',404);
    const existing=await tx.order.findUnique({where:{quoteId:q.id}});if(existing)return existing;
    if(!p.accepting)throw new BusinessError('PAUSED','New preorders are paused. Existing receipts remain available.',503);
    const failure=await tx.setting.findUnique({where:{key:'checkout_failure'}});if(failure?.value==='true')throw new BusinessError('DEMO_FAILURE','Checkout is temporarily unavailable. Your stock has not been reserved. Please retry after recovery.',503);
    if(q.expiresAt.getTime()<=Date.now())throw new BusinessError('EXPIRED','Your review expired. Please check availability again.');
    if(JSON.parse(q.policy).hash!==p.hash)throw new BusinessError('TERMS_CHANGED','Pickup rules changed. Please review the latest terms before confirming.');
    const product=await tx.product.findUniqueOrThrow({where:{id:q.productId}}); const slot=await tx.slot.findUniqueOrThrow({where:{id:q.slotId}});
    const total=Math.round(product.pricePerKg*q.grams/1000);
    if(total!==q.totalPaise)throw new BusinessError('PRICE_CHANGED','The price changed. Please review a fresh quote.');
    if(new Date(slot.pickupAt).getTime()<Date.now()+30*60000)throw new BusinessError('TOO_SOON','This pickup is now too soon. Please choose a later slot.');
    const n=await tx.$executeRaw`UPDATE Product SET reservedGrams=reservedGrams+${q.grams} WHERE id=${q.productId} AND stockGrams-reservedGrams>=${q.grams}`;
    if(n!==1)throw new BusinessError('STOCK','That stock was just sold. Nothing was reserved. Please choose a smaller quantity or another sweet.');
    const s=await tx.$executeRaw`UPDATE Slot SET used=used+1 WHERE id=${q.slotId} AND used<capacity AND used<${p.slotLimit}`;
    if(s!==1)throw new BusinessError('SLOT','That pickup just filled up. Nothing was reserved. Please choose another time.');
    const o=await tx.order.create({data:{id:randomUUID(),shopId:q.shopId,quoteId:q.id,sessionId,customerName:input.customerName,productId:q.productId,productName:product.name,grams:q.grams,slotId:q.slotId,pickupAt:slot.pickupAt,totalPaise:total,policy:q.policy,language:q.language}});
    await tx.movement.create({data:{id:randomUUID(),shopId:q.shopId,productId:q.productId,kind:'RESERVED',grams:q.grams,orderId:o.id,reason:'Customer confirmed preorder'}});
    await tx.outbox.create({data:{id:randomUUID(),orderId:o.id,kind:'CONFIRMED'}});
    await tx.operation.create({data:{id:input.key,fingerprint:fp,result:JSON.stringify(o)}});return o;
  });
}
export async function counterSale(productId:string,grams:number,key:string){return transaction(async tx=>{
  await tx.$executeRaw`UPDATE Setting SET value=value WHERE key='accepting_orders'`;
  const fingerprint=`counter:${productId}:${grams}`;const replay=await tx.operation.findUnique({where:{id:key}});
  if(replay){if(replay.fingerprint!==fingerprint)throw new BusinessError('KEY_REUSED','Request key already used.');return JSON.parse(replay.result);}
  const n=await tx.$executeRaw`UPDATE Product SET stockGrams=stockGrams-${grams} WHERE id=${productId} AND stockGrams-reservedGrams>=${grams}`;
  if(n!==1)throw new BusinessError('STOCK','Not enough unreserved stock. Existing customer orders remain protected.');
  const product=await tx.product.findUniqueOrThrow({where:{id:productId}});
  const movement=await tx.movement.create({data:{id:randomUUID(),shopId:product.shopId,productId,grams,kind:'COUNTER_SALE',reason:'Recorded walk-in sale'}});
  await tx.operation.create({data:{id:key,fingerprint,result:JSON.stringify(movement)}});return movement;
});}
export async function updateOrder(id:string,status:'READY'|'COLLECTED'|'CANCELLED') {return transaction(async tx=>{
  await tx.$executeRaw`UPDATE Setting SET value=value WHERE key='accepting_orders'`;
  const o=await tx.order.findUniqueOrThrow({where:{id}});if(o.status===status)return o;
  if(status==='READY'&&o.status==='CONFIRMED')await tx.outbox.upsert({where:{orderId_kind:{orderId:id,kind:'READY'}},update:{},create:{id:randomUUID(),orderId:id,kind:'READY'}});
  else if(status==='COLLECTED'&&o.status==='READY')await tx.$executeRaw`UPDATE Product SET stockGrams=stockGrams-${o.grams},reservedGrams=reservedGrams-${o.grams} WHERE id=${o.productId}`;
  else if(status==='CANCELLED'&&o.status==='CONFIRMED'){await tx.product.update({where:{id:o.productId},data:{reservedGrams:{decrement:o.grams}}});await tx.slot.update({where:{id:o.slotId},data:{used:{decrement:1}}});}
  else throw new BusinessError('STATUS','This status change is not available. Packed orders need an owner stock decision.');
  await tx.movement.create({data:{id:randomUUID(),productId:o.productId,orderId:id,grams:o.grams,kind:status,reason:`Staff marked order ${status.toLowerCase()}`}});
  return tx.order.update({where:{id},data:{status}});
});}
