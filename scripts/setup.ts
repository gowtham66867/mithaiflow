import 'dotenv/config';
import { seed } from '../src/lib/seed';
import { db } from '../src/lib/db';
seed().then(()=>console.log('Sample shop and tomorrow’s slots are ready.')).finally(()=>db.$disconnect());
