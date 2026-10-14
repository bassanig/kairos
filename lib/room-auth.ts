import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { rooms } from '../db/schema';
import { getChatGPTUser } from '../app/chatgpt-auth';
export const cookieName='__Host-kairos_room';
export const validRoomCode=(code:string)=>code.length>=1&&code.length<=128&&!/[\u0000-\u001f\u007f]/.test(code);
export const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export const json=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
export async function access(req:Request){
 const bearer=req.headers.get('authorization');
 if(bearer){const token=bearer.match(/^Bearer (kairos_ai_[a-f0-9]{48})$/)?.[1];if(!token)return null;const [room]=await getDb().select().from(rooms).where(eq(rooms.apiHash,await hash(token)));return room?{owner:room.owner,admin:false}:null;}
 const encoded=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 let code='';try{code=decodeURIComponent(encoded||'')}catch{return null;}
 if(code&&validRoomCode(code)){const [room]=await getDb().select().from(rooms).where(eq(rooms.passwordHash,await hash(code)));if(room)return {owner:room.owner,admin:room.owner.startsWith('code:')};}
 const user=await getChatGPTUser();return user?{owner:user.userId,admin:true}:null;
}
