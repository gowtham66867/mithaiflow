import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'MithaiFlow — Every sweet promise, kept.',description:'Speak your festive order. Reserve real stock. Skip the pickup rush.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
