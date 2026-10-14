export type Column = { id: string; label: string; kind: 'day' | 'time'; date?: string };
export type Task = { id: string; series: string; column: string; row: number; span: number; title: string; description: string; color: string; done: boolean };
export type Planner = { start: number; rows: number[]; columns: Column[]; tasks: Task[] };
export const colors = ['blue','violet','pink','amber','green','cyan','slate','coral'];
export const uid = () => crypto.randomUUID();
export function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function monday(key = dateKey(new Date())) { const d = new Date(key+'T12:00:00'); d.setDate(d.getDate()-(d.getDay()+6)%7); return dateKey(d); }
export function addDays(key: string, n: number) { const d=new Date(key+'T12:00:00'); d.setDate(d.getDate()+n); return dateKey(d); }
export function initial(start = monday()): Planner { return { start: 420, rows: Array(28).fill(30), columns: [{id:uid(),kind:'time',label:'Horário'},...Array.from({length:14},(_,i)=>({id:uid(),kind:'day' as const,label:['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][i%7],date:addDays(start,i)}))],tasks:[] }; }
export function clock(n: number) { return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
export function timeAt(p: Planner,row:number) {return p.start+p.rows.slice(0,row).reduce((a,b)=>a+b,0);}
export function valid(p: Planner) { return p.tasks.every((a,i)=>a.row>=0&&a.span>=1&&a.row+a.span<=p.rows.length&&p.columns.some(c=>c.id===a.column&&c.kind==='day')&&!p.tasks.slice(i+1).some(b=>a.column===b.column&&a.row<b.row+b.span&&b.row<a.row+a.span)); }
export function move(p: Planner,id:string,column:string,row:number): Planner | null { const a=p.tasks.find(t=>t.id===id); if(!a)return null; const b=p.tasks.find(t=>t.id!==id&&t.column===column&&row>=t.row&&row<t.row+t.span); const tasks=p.tasks.map(t=>t.id===id?{...t,column,row:b?b.row:row}:b&&t.id===b.id?{...t,column:a.column,row:a.row}:t); const next={...p,tasks};return valid(next)?next:null; }
export function replicate(before: Planner, after: Planner): Planner | null {
 let tasks=[...after.tasks];
 for(const old of before.tasks){const now=after.tasks.find(t=>t.id===old.id);if(now&&JSON.stringify({...old,done:false})===JSON.stringify({...now,done:false}))continue;
 const col=before.columns.find(c=>c.id===old.column);if(!col?.date)continue;
 const targetOld=after.columns.find(c=>c.date===addDays(col.date!,7)&&c.kind==='day');
 const counterpart=tasks.find(t=>t.series===old.series&&t.column===targetOld?.id);
 if(!now){if(counterpart)tasks=tasks.filter(t=>t.id!==counterpart.id);continue;}
 const newCol=after.columns.find(c=>c.id===now.column);const target=after.columns.find(c=>newCol?.date&&c.date===addDays(newCol.date,7)&&c.kind==='day');if(!target)continue;
 if(counterpart)tasks=tasks.map(t=>t.id===counterpart.id?{...now,id:t.id,column:target.id,done:t.done}:t);else tasks.push({...now,id:uid(),column:target.id,done:false});
 }
 for(const t of after.tasks.filter(t=>!before.tasks.some(b=>b.id===t.id))){const col=after.columns.find(c=>c.id===t.column);const target=after.columns.find(c=>col?.date&&c.date===addDays(col.date,7)&&c.kind==='day');if(target&&!tasks.some(x=>x.series===t.series&&x.column===target.id))tasks.push({...t,id:uid(),column:target.id,done:false});}
 const result={...after,tasks};return valid(result)?result:null;
}
