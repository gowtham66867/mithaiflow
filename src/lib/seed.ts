import { db } from './db';
import { tomorrow } from './format';
export async function seed() {
  const products = [
    {id:'kaju-katli',name:'Kaju Katli',hindi:'काजू कतली',description:'Cashew-rich diamonds, finished with silver leaf.',pricePerKg:120000,stockGrams:1000,initialGrams:1000,color:'ivory'},
    {id:'motichoor-laddu',name:'Motichoor Laddu',hindi:'मोतीचूर लड्डू',description:'Tiny pearls of boondi. Big festive energy.',pricePerKg:68000,stockGrams:8000,initialGrams:8000,color:'orange'},
    {id:'mysore-pak',name:'Mysore Pak',hindi:'मैसूर पाक',description:'Golden, buttery, and made for sharing.',pricePerKg:88000,stockGrams:6000,initialGrams:6000,color:'gold'},
  ];
  for (const p of products) await db.product.upsert({where:{id:p.id},update:{},create:p});
  const date=tomorrow();
  for(const h of ['17:00','17:30','18:00','18:30','19:00','19:30']) {
    const pickupAt=`${date}T${h}:00+05:30`;
    await db.slot.upsert({where:{id:`${date}-${h}`},update:{},create:{id:`${date}-${h}`,pickupAt}});
  }
  for(const [key,value] of Object.entries({accepting_orders:'true',pickup_slot_order_limit:'8',voice_ordering_enabled:'true',checkout_failure:'false',worker_paused:'false'})) await db.setting.upsert({where:{key},update:{},create:{key,value}});
}
