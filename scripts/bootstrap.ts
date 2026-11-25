import { existsSync,readFileSync,writeFileSync,openSync,closeSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
if(!existsSync('.env')){let s=readFileSync('.env.example','utf8');for(const k of ['SHOP_PASSWORD','SESSION_SECRET','MITHAIFLOW_RECOVERY_TOKEN'])s=s.replace(`${k}=`,`${k}=${randomBytes(24).toString('hex')}`);writeFileSync('.env',s,{mode:0o600});console.log('Created private .env. Find your shop password there.');}
dotenv.config({quiet:true});
if(!process.env.DATABASE_URL?.startsWith('file:'))throw new Error('This demo uses SQLite. Set DATABASE_URL=file:./mithai.db');
const dbPath=process.env.DATABASE_URL.slice(5);const target=dbPath.startsWith('/')?dbPath:`prisma/${dbPath}`;if(!existsSync(target))closeSync(openSync(target,'a'));
const bin=process.platform==='win32'?'npx.cmd':'npx';
execFileSync(bin,['prisma','generate'],{stdio:'inherit'});
execFileSync(bin,['prisma','migrate','deploy'],{stdio:'inherit'});
execFileSync(bin,['tsx','scripts/setup.ts'],{stdio:'inherit'});
console.log('MithaiFlow is ready. Run npm run dev, then open http://localhost:3000');
