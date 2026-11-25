import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { isOwner,equal,sessionToken,customerSession,sameOrigin,recoveryAuth,rateLimit } from '@/lib/auth';
import { policy,clearPolicy,sampleMode } from '@/lib/flags';
import { BusinessError,quoteInput,confirmInput,makeQuote,confirm,counterSale,updateOrder } from '@/lib/orders';
import { interpret,transcribe,speakOrder } from '@/lib/sarvam';
import { health,triggerIncident,recover,drainNotices } from '@/lib/ops';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function handle(req:NextRequest){try{
  const path=req.nextUrl.pathname.replace('/api/',''); const method=req.method;
  if(method!=='GET'&&!sameOrigin(req))return json({error:'Origin not allowed.'},403);
  if(path==='health')return json(await health());
  if(path==='recover'&&method==='POST'){if(!recoveryAuth(req))return json({error:'Unauthorised.'},401);const b=z.object({incidentId:z.string().uuid(),workflowRef:z.string().min(1).max(200)}).parse(await req.json());return json(await recover(b.incidentId,b.workflowRef));}
  if(path==='login'&&method==='POST'){rateLimit(req,'login',8);const b=z.object({password:z.string().max(200)}).parse(await req.json());if(!process.env.SHOP_PASSWORD||!equal(b.password,process.env.SHOP_PASSWORD))return json({error:'That shop password is incorrect.'},401);const res=json({ok:true});res.cookies.set('mithai-owner',sessionToken(),{httpOnly:true,sameSite:'strict',secure:process.env.APP_BASE_URL?.startsWith('https://'),path:'/',maxAge:28800});return res;}
  if(path==='logout'&&method==='POST'){const res=json({ok:true});res.cookies.delete('mithai-owner');return res;}
  if(path.startsWith('shop/')){
    if(!await isOwner())return json({error:'Sign in to the shop desk.'},401);
    if(path==='shop/state'&&method==='GET'){await drainNotices();const [products,slots,orders,movements,incidents,p,h]=await Promise.all([db.product.findMany({where:{shopId:'annapurna'}}),db.slot.findMany({where:{shopId:'annapurna'},orderBy:{pickupAt:'asc'}}),db.order.findMany({where:{shopId:'annapurna'},orderBy:{createdAt:'desc'},take:100}),db.movement.findMany({where:{shopId:'annapurna'},orderBy:{createdAt:'desc'},take:20}),db.incident.findMany({orderBy:{openedAt:'desc'},take:10}),policy('owner'),health()]);return json({products,slots,orders,movements,incidents,policy:p,health:h,demo:sampleMode(),sarvam:!!process.env.SARVAM_API_KEY,nudgebee:!!process.env.NUDGEBEE_EVENT_WEBHOOK_URL});}
    if(method!=='POST')return json({error:'Not found.'},404);
    if(path==='shop/counter'){const b=z.object({productId:z.string().min(1).max(80),grams:z.number().int().min(50).max(10000),key:z.string().uuid()}).parse(await req.json());return json(await counterSale(b.productId,b.grams,b.key));}
    if(path==='shop/status'){const b=z.object({id:z.string().uuid(),status:z.enum(['READY','COLLECTED','CANCELLED'])}).parse(await req.json());return json(await updateOrder(b.id,b.status));}
    if(path==='shop/settings'){if(!sampleMode()||process.env.FLAGSMITH_ENVIRONMENT_KEY)return json({error:'Change the live controls in your Flagsmith dashboard.'},409);const b=z.object({key:z.enum(['accepting_orders','voice_ordering_enabled','pickup_slot_order_limit']),value:z.string().max(5)}).parse(await req.json());if(b.key==='pickup_slot_order_limit'?!/^(?:[1-9]|[1-9]\d|100)$/.test(b.value):!['true','false'].includes(b.value))return json({error:'Invalid setting.'},422);await db.setting.update({where:{key:b.key},data:{value:b.value}});clearPolicy();return json({ok:true});}
    if(path==='shop/incident'){if(!sampleMode())return json({error:'Demo controls are disabled.'},403);return json(await triggerIncident());}
    if(path==='shop/rehearse-recovery'){if(!sampleMode())return json({error:'Rehearsal disabled.'},403);const b=z.object({incidentId:z.string().uuid()}).parse(await req.json());return json(await recover(b.incidentId,'LOCAL REHEARSAL — not NudgeBee approval'));}
    if(path==='shop/race'){if(!sampleMode())return json({error:'Demo controls are disabled.'},403);return json(await race());}
  }
  if(path==='catalog'&&method==='GET'){const session=await customerSession();const [products,slots,p]=await Promise.all([db.product.findMany({where:{shopId:'annapurna'}}),db.slot.findMany({where:{shopId:'annapurna',pickupAt:{gte:new Date().toISOString().slice(0,10)}},orderBy:{pickupAt:'asc'}}),policy(session)]);return json({products,slots:slots.filter(s=>new Date(s.pickupAt).getTime()>Date.now()+30*60000),policy:p,sample:sampleMode(),sarvam:!!process.env.SARVAM_API_KEY});}
  if(path.startsWith('receipt/')&&method==='GET'){const id=path.split('/')[1];const o=await db.order.findUnique({where:{id}});if(!o)return json({error:'Receipt not found.'},404);await drainNotices();const notices=await db.outbox.findMany({where:{orderId:id,delivered:true}});return json({order:{id:o.id,productName:o.productName,grams:o.grams,totalPaise:o.totalPaise,pickupAt:o.pickupAt,status:o.status,language:o.language},notices:notices.map(n=>({kind:n.kind,at:n.deliveredAt}))});}
  if(path==='quote'&&method==='POST'){rateLimit(req,'quote');const session=await customerSession();return json(await makeQuote(quoteInput.parse(await req.json()),session));}
  if(path==='confirm'&&method==='POST'){rateLimit(req,'confirm');const session=await customerSession();const o=await confirm(confirmInput.parse(await req.json()),session);return json(o);}
  if(path==='interpret'&&method==='POST'){rateLimit(req,'ai',12);const b=z.object({text:z.string().trim().min(1).max(1200)}).parse(await req.json());return json(await interpret(b.text));}
  if(path==='transcribe'&&method==='POST'){rateLimit(req,'voice',8);const session=await customerSession();if(!(await policy(session)).voice)return json({error:'Voice is paused. Please type or use the menu.'},503);const fd=await req.formData();const file=fd.get('file');if(!(file instanceof File)||file.size>2_000_000||file.size<100)return json({error:'Please record a short clip under 25 seconds (maximum 2 MB).'},422);if(!/^(audio\/|video\/webm)/.test(file.type))return json({error:'Unsupported recording format.'},422);return json(await transcribe(file));}
  if(path==='speak'&&method==='POST'){rateLimit(req,'tts',10);const b=z.object({id:z.string().uuid()}).parse(await req.json());const o=await db.order.findUnique({where:{id:b.id}});if(!o)return json({error:'Order not found.'},404);return json(await speakOrder(o));}
  return json({error:'Not found.'},404);
}catch(e){if(e instanceof BusinessError)return json({error:e.message,code:e.code},e.status);if(e instanceof z.ZodError)return json({error:e.issues[0]?.message||'Please check your details.'},422);console.error('Request failed:',e instanceof Error?e.name:'Unknown error');return json({error:e instanceof Error&&!/prisma|database|SQL|transaction/i.test(e.message)?e.message:'Something went wrong. Please retry using the same confirmation.'},503);}}
async function race(){
  const run=randomUUID();const productId=`race-${run}`,slotId=`race-${run}`,session=`race-${run}`;const date=new Date(Date.now()+86400000).toISOString();const p=await policy(session);const labPolicy={...p,accepting:true,slotLimit:1};
  await db.product.create({data:{id:productId,shopId:'race-lab',name:'Isolated last-kilo test',hindi:'',description:'Isolated sample inventory',pricePerKg:120000,stockGrams:1000,initialGrams:1000,color:'ivory'}});
  await db.slot.create({data:{id:slotId,shopId:'race-lab',pickupAt:date,capacity:1}});
  const q=await db.quote.create({data:{id:randomUUID(),shopId:'race-lab',sessionId:session,productId,grams:1000,slotId,totalPaise:120000,language:'en-IN',policy:JSON.stringify(labPolicy),expiresAt:new Date(Date.now()+300000)}});
  const start=Date.now();const outcomes=await Promise.allSettled([confirm({quoteId:q.id,key:randomUUID(),customerName:'Race customer'},session,labPolicy),counterSale(productId,1000,randomUUID())]);
  const product=await db.product.findUniqueOrThrow({where:{id:productId}});return {runId:run,durationMs:Date.now()-start,results:outcomes.map((o,i)=>({channel:i===0?'Voice preorder':'Counter sale',accepted:o.status==='fulfilled',detail:o.status==='fulfilled'?'Committed 1 kg':(o.reason as Error).message})),availableGrams:product.stockGrams-product.reservedGrams,passed:outcomes.filter(o=>o.status==='fulfilled').length===1&&product.stockGrams-product.reservedGrams===0};
}
export const GET=handle;
export const POST=handle;
