import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
const localSecret = randomBytes(32).toString('hex');
const secret = () => process.env.SESSION_SECRET || localSecret;
export function equal(a:string,b:string) { const x=Buffer.from(a),y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); }
export function sessionToken() { const exp=String(Date.now()+8*3600_000); return `${exp}.${createHmac('sha256',secret()).update(exp).digest('hex')}`; }
export async function isOwner() { const raw=(await cookies()).get('mithai-owner')?.value||''; const [exp,sig]=raw.split('.'); return !!exp && Number(exp)>Date.now() && !!sig && equal(sig,createHmac('sha256',secret()).update(exp).digest('hex')); }
export function sameOrigin(req:Request) { const origin=req.headers.get('origin'); if(!origin)return true; try { return origin===new URL(req.url).origin || origin===process.env.APP_BASE_URL || new URL(origin).host===req.headers.get('host'); } catch { return false; } }
export function recoveryAuth(req:Request) { const expected=process.env.MITHAIFLOW_RECOVERY_TOKEN; return !!expected && equal(req.headers.get('authorization')||'',`Bearer ${expected}`); }
export async function customerSession() { const jar=await cookies(); let id=jar.get('mithai-customer')?.value; if(!id || !/^[a-f0-9]{48}$/.test(id)){id=randomBytes(24).toString('hex'); jar.set('mithai-customer',id,{httpOnly:true,sameSite:'lax',secure:process.env.APP_BASE_URL?.startsWith('https://'),maxAge:86400*7,path:'/'});} return id; }
const attempts=new Map<string,{n:number,until:number}>();
export function rateLimit(req:Request,bucket:string,max=30){const key=`${bucket}:${req.headers.get('x-forwarded-for')?.split(',')[0]||'local'}`; const now=Date.now(); const a=attempts.get(key); if(a && a.until>now){if(a.n>=max)throw new Error('Too many requests. Please wait a minute.');a.n++;}else attempts.set(key,{n:1,until:now+60000}); if(attempts.size>2000) for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);}
