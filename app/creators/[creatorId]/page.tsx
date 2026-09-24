import { CreatorProfilePage } from '@/components/marketplace'
export default async function Page({params}:{params:Promise<{creatorId:string}>}){const {creatorId}=await params;return <CreatorProfilePage id={creatorId}/>} 
