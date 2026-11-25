import 'dotenv/config';
const base=process.env.APP_BASE_URL?.replace(/\/$/,'');
if(!base||!base.startsWith('https://'))throw new Error('Set APP_BASE_URL to your public HTTPS tunnel origin.');
const h=await fetch(`${base}/api/health`,{signal:AbortSignal.timeout(15000)});if(!h.ok)throw new Error(`Public health returned ${h.status}`);const data=await h.json();if(!['healthy','degraded'].includes(data.status))throw new Error('Public health did not return a valid MithaiFlow response.');console.log(`Public health reachable: ${data.status}`);
const denied=await fetch(`${base}/api/recover`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({incidentId:'00000000-0000-4000-8000-000000000000'}),signal:AbortSignal.timeout(15000)});if(denied.status!==401)throw new Error(`Expected unauthenticated recovery to return 401, received ${denied.status}`);console.log('Recovery endpoint reachable and protected (401 without bearer token). No recovery action was taken.');
