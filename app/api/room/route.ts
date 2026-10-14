import { eq } from 'drizzle-orm';
import { getDb } from '../../../db';
import { rooms } from '../../../db/schema';
import { getChatGPTUser } from '../../chatgpt-auth';
import { access,cookieName,hash,json,sameOrigin,secret,validRoomCode } from '../../../lib/room-auth';
export async function GET(req:Request){const a=await access(req);if(!a)return json({authenticated:false});const [r]=await getDb().select({owner:rooms.owner}).from(rooms).where(eq(rooms.owner,a.owner));const u=await getChatGPTUser();return json({authenticated:true,admin:a.admin||u?.userId===a.owner,hasRoom:!!r,codeRoom:a.owner.startsWith('code:')});}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Origem inválida.'},403);
 let body:{action?:string;password?:string};try{const raw=await req.json();if(!raw||typeof raw!=="object")throw Error();body=raw as typeof body}catch{return json({error:'Dados inválidos.'},400)}
 if(body.action==='join'){
  const code=typeof body.password==='string'?body.password.trim():'';
  if(!validRoomCode(code))return json({error:'Informe um código de 1 a 128 caracteres, sem caracteres de controle.'},400);
  const db=getDb(),passwordHash=await hash(code);
  const [room]=await db.select().from(rooms).where(eq(rooms.passwordHash,passwordHash));
  if(!room)await db.insert(rooms).values({owner:'code:'+passwordHash,passwordHash}).onConflictDoNothing();
  return json({ok:true},200,{'Set-Cookie':`${cookieName}=${encodeURIComponent(code)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`});
 }
 if(body.action==='leave')return json({ok:true},200,{'Set-Cookie':`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
 const selected=await access(req);
 if(selected?.admin&&selected.owner.startsWith('code:')){
  const db=getDb();
  if(body.action==='token'){const token='kairos_ai_'+secret();await db.update(rooms).set({apiHash:await hash(token)}).where(eq(rooms.owner,selected.owner));return json({token});}
  if(body.action==='revoke'){await db.update(rooms).set({apiHash:null}).where(eq(rooms.owner,selected.owner));return json({ok:true});}
  return json({error:'Para abrir outra sala, use outro código na tela de acesso.'},400);
 }
 const user=await getChatGPTUser();if(!user)return json({error:'Entre como proprietário para administrar sua sala.'},401);
 const db=getDb();const [room]=await db.select().from(rooms).where(eq(rooms.owner,user.userId));
 if(body.action==='create'){
  if(room)return json({error:'Você já tem uma sala. Use renovar senha.'},409);
  const password=secret();await db.insert(rooms).values({owner:user.userId,passwordHash:await hash(password)});return json({password});
 }
 if(!room)return json({error:'Crie a sala primeiro.'},400);
 if(body.action==='password'){const password=secret();await db.update(rooms).set({passwordHash:await hash(password)}).where(eq(rooms.owner,user.userId));return json({password});}
 if(body.action==='token'){const token='kairos_ai_'+secret();await db.update(rooms).set({apiHash:await hash(token)}).where(eq(rooms.owner,user.userId));return json({token});}
 if(body.action==='revoke'){await db.update(rooms).set({apiHash:null}).where(eq(rooms.owner,user.userId));return json({ok:true});}
 return json({error:'Ação inválida.'},400);
}
