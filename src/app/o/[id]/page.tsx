import Tracking from '@/components/Tracking';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Tracking id={id}/>}
