import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Kairos — tempo para o que importa',description:'Uma agenda flexível: organize, mova e estenda suas tarefas.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
