import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {openSync,closeSync} from 'node:fs';
const file=resolve('prisma/core-test.db');closeSync(openSync(file,'a'));
const env={...process.env,DATABASE_URL:`file:${file}`,DEMO_MODE:'true',FLAGSMITH_ENVIRONMENT_KEY:''};
execFileSync('npx',['prisma','migrate','deploy'],{env,stdio:'inherit'});
execFileSync('npx',['tsx','--test','tests/core.test.ts'],{env,stdio:'inherit'});
