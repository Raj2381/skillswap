import { BookingPage } from '@/components/marketplace'
export default async function Page({params}:{params:Promise<{serviceId:string}>}){const {serviceId}=await params;return <BookingPage serviceId={serviceId}/>} 
