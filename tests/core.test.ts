import 'dotenv/config';
import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db} from '../src/lib/db';
import {seed} from '../src/lib/seed';
import {makeQuote,confirm,counterSale,quoteInput} from '../src/lib/orders';
import {clearPolicy} from '../src/lib/flags';
beforeEach(async()=>{assert.match(process.env.DATABASE_URL||'',/core-test\.db$/,'Tests must use isolated test database.');await db.$transaction([db.outbox.deleteMany(),db.operation.deleteMany(),db.order.deleteMany(),db.quote.deleteMany(),db.movement.deleteMany(),db.product.deleteMany(),db.slot.deleteMany(),db.setting.deleteMany(),db.incident.deleteMany()]);await seed();clearPolicy();});
after(()=>db.$disconnect());
async function quote(grams=1000,session='test'){const slot=await db.slot.findFirstOrThrow();return makeQuote({productId:'kaju-katli',grams,slotId:slot.id,language:'en-IN'},session);}
test('Concurrent last-stock requests and cross-channel sales create exactly one commitment',async()=>{
  for(let round=0;round<12;round++){
    await db.product.update({where:{id:'kaju-katli'},data:{stockGrams:1000,reservedGrams:0}});await db.slot.updateMany({data:{used:0}});
    const a=await quote(1000,`a-${round}`);const b=await quote(1000,`b-${round}`);
    const results=await Promise.allSettled([confirm({quoteId:a.id,key:randomUUID(),customerName:'A'},`a-${round}`),round%2?counterSale('kaju-katli',1000,randomUUID()):confirm({quoteId:b.id,key:randomUUID(),customerName:'B'},`b-${round}`)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const p=await db.product.findUniqueOrThrow({where:{id:'kaju-katli'}});assert.equal(p.stockGrams-p.reservedGrams,0);
  }
});
test('Idempotency and unique quotes preserve one order across repeated confirmations',async()=>{const q=await quote();const input={quoteId:q.id,key:randomUUID(),customerName:'Asha'};const a=await confirm(input,'test');const b=await confirm(input,'test');const c=await confirm({...input,key:randomUUID()},'test');assert.equal(a.id,b.id);assert.equal(a.id,c.id);assert.equal(await db.order.count(),1);assert.equal(await db.outbox.count(),1);await assert.rejects(()=>confirm({...input,customerName:'Different'},'test'),/different order/);});
test('Price is calculated from server catalogue and client totals are ignored',async()=>{const slot=await db.slot.findFirstOrThrow();const input=quoteInput.parse({productId:'kaju-katli',grams:500,slotId:slot.id,language:'en-IN',totalPaise:1});const q=await makeQuote(input,'test');assert.equal(q.totalPaise,60000);const o=await confirm({quoteId:q.id,key:randomUUID(),customerName:'Asha'},'test');assert.equal(o.totalPaise,60000);});
test('Paused ordering blocks new confirmation while existing receipts remain available',async()=>{const q=await quote(500);const o=await confirm({quoteId:q.id,key:randomUUID(),customerName:'Asha'},'test');const fresh=await quote(500);await db.setting.update({where:{key:'accepting_orders'},data:{value:'false'}});clearPolicy();await assert.rejects(()=>confirm({quoteId:fresh.id,key:randomUUID(),customerName:'Ben'},'test'),/paused/);assert.equal((await db.order.findUniqueOrThrow({where:{id:o.id}})).totalPaise,60000);});
