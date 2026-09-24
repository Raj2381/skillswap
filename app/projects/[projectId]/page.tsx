import { ProjectDetailPage } from '@/components/marketplace'
export default async function Page({params}:{params:Promise<{projectId:string}>}){const {projectId}=await params;return <ProjectDetailPage id={projectId}/>} 
