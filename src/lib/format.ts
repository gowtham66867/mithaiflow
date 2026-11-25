export const rupees = (paise: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:paise%100?2:0}).format(paise/100);
export const weight = (grams: number) => grams >= 1000 ? `${grams/1000} kg` : `${grams} g`;
export const pickup = (iso: string) => new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso));
export function tomorrow() { const key = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); const d = new Date(`${key}T12:00:00+05:30`); d.setUTCDate(d.getUTCDate()+1); return d.toISOString().slice(0,10); }
