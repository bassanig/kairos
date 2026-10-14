import { access,json,sameOrigin } from '../../../lib/room-auth';
import { getDb } from '../../../db';
import { planners } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { valid } from '../../../lib/planner';
const schema=z.object({start:z.number().int().min(0).max(1439),rows:z.array(z.number().int().min(5).max(240)).min(1).max(288),columns:z.array(z.object({id:z.string().max(80),label:z.string().max(80),kind:z.enum(['day','time']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()})).min(1).max(100),tasks:z.array(z.object({id:z.string().max(80),series:z.string().max(80),column:z.string().max(80),row:z.number().int().min(0),span:z.number().int().min(1),title:z.string().min(1).max(150),description:z.string().max(5000),color:z.enum(['blue','violet','pink','amber','green','cyan','slate','coral']),done:z.boolean()})).max(10000)}).refine(p=>p.start+p.rows.reduce((a,b)=>a+b,0)<=1440&&valid(p)&&new Set(p.tasks.map(t=>t.id)).size===p.tasks.length&&new Set(p.columns.map(c=>c.id)).size===p.columns.length);
export async function GET(req:Request){const user=await access(req);if(!user?.owner)return json({error:'Faça login para acessar sua agenda.'},401);const [row]=await getDb().select().from(planners).where(eq(planners.owner,user.owner));return json({state:row?JSON.parse(row.payload):null,revision:row?.revision??0});}
export async function PUT(req: Request) {
  if(!sameOrigin(req))return json({error:"Origem inválida."},403);
  const user = await access(req);
  if (!user?.owner) return json({ error: 'Faça login para salvar.' },401);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: 'Dados inválidos.' },400); }
  const parsed = z.object({ state: schema, revision: z.number().int().min(0) }).safeParse(raw);
  if (!parsed.success) return json({ error: 'Grade inválida.' },400);
  const { state, revision } = parsed.data;
  const db = getDb();
  await db.insert(planners).values({ owner: user.owner, payload: JSON.stringify(state), revision: 0 }).onConflictDoNothing();
  const changed = await db.update(planners).set({ payload: JSON.stringify(state), revision: revision + 1 })
    .where(and(eq(planners.owner, user.owner), eq(planners.revision, revision)))
    .returning({ revision: planners.revision });
  if (!changed.length) return json({ error: 'A agenda mudou em outra aba. Recarregue antes de editar.' },409);
  return json(changed[0]);
}
