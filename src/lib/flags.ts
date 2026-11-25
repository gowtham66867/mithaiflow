import { createHash } from 'node:crypto';
import { db } from './db';
export type Policy={ accepting:boolean; slotLimit:number; voice:boolean; source:'LIVE'|'SAMPLE'|'UNAVAILABLE'; fetchedAt:string; hash:string };
let sdk: import('flagsmith-nodejs').Flagsmith | undefined;
const cache=new Map<string,{until:number,policy:Policy}>();
export const sampleMode=()=>process.env.DEMO_MODE==='true';
export async function policy(identity='guest'):Promise<Policy>{
  const cached=cache.get(identity); if(cached && cached.until>Date.now())return cached.policy;
  let p:Omit<Policy,'hash'>;
  if(process.env.FLAGSMITH_ENVIRONMENT_KEY){
    try{
      const {Flagsmith}=await import('flagsmith-nodejs');
      sdk ||= new Flagsmith({environmentKey:process.env.FLAGSMITH_ENVIRONMENT_KEY,requestTimeoutSeconds:5});
      const regular=await db.order.count({where:{sessionId:identity,shopId:'annapurna',status:{in:['CONFIRMED','READY','COLLECTED']}}})>0;
      const flags=await sdk.getIdentityFlags(`customer:${identity}`,{customer_type:regular?'regular':'new'});
      const limit=Number(flags.getFeatureValue('pickup_slot_order_limit'));
      if(!Number.isInteger(limit)||limit<1||limit>100) throw new Error('Invalid slot policy');
      p={accepting:flags.isFeatureEnabled('accepting_orders'),slotLimit:limit,voice:flags.isFeatureEnabled('voice_ordering_enabled'),source:'LIVE',fetchedAt:new Date().toISOString()};
    }catch{p={accepting:false,slotLimit:0,voice:false,source:'UNAVAILABLE',fetchedAt:new Date().toISOString()};}
  }else if(sampleMode()){
    const rows=await db.setting.findMany(); const v=Object.fromEntries(rows.map(r=>[r.key,r.value]));
    p={accepting:v.accepting_orders!=='false',slotLimit:Number(v.pickup_slot_order_limit||8),voice:v.voice_ordering_enabled!=='false',source:'SAMPLE',fetchedAt:new Date().toISOString()};
  }else p={accepting:false,slotLimit:0,voice:false,source:'UNAVAILABLE',fetchedAt:new Date().toISOString()};
  const result={...p,hash:createHash('sha256').update(JSON.stringify([p.accepting,p.slotLimit])).digest('hex').slice(0,16)};
  cache.set(identity,{until:Date.now()+(p.source==='LIVE'?10000:1000),policy:result});return result;
}
export function clearPolicy(){cache.clear();}
