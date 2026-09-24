'use client'

import { createContext, useContext, useMemo, useState } from 'react'

export type RequestStatus = 'Pending' | 'Accepted' | 'Declined'
export type RequestRecord = {
  id: string
  client: string
  title: string
  category: string
  price: string
  amount: number
  deadline: string
  initials: string
  color: string
  status: RequestStatus
  description: string
}

const seedRequests: RequestRecord[] = [
  { id: 'maya-reel', client: 'Maya Iyer', title: 'Product launch reel', category: 'Video Editing', price: '₹1,500', amount: 1500, deadline: '04 Oct', initials: 'MI', color: 'bg-[#f2e2c7]', status: 'Pending', description: 'A polished launch reel for a new product campaign, with a playful pace and clean captions.' },
  { id: 'vikram-podcast', client: 'Vikram Singh', title: 'Podcast video edit', category: 'Video Editing', price: '₹2,800', amount: 2800, deadline: '08 Oct', initials: 'VS', color: 'bg-[#dbe7f5]', status: 'Accepted', description: 'Edit a long-form podcast episode into a crisp video with social-ready cutdowns.' },
  { id: 'rohan-teaser', client: 'Rohan Mehta', title: 'Brand teaser', category: 'Motion Design', price: '₹2,200', amount: 2200, deadline: '12 Oct', initials: 'RM', color: 'bg-[#e6ddf3]', status: 'Declined', description: 'A short, atmospheric teaser introducing the brand identity across social channels.' },
]

type RequestState = {
  requests: RequestRecord[]
  pendingRequestCount: number
  updateRequest: (id: string, status: Exclude<RequestStatus, 'Pending'>) => void
}

const RequestStateContext = createContext<RequestState | null>(null)

export function RequestStateProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState(seedRequests)
  const value = useMemo(() => ({
    requests,
    pendingRequestCount: requests.filter((request) => request.status === 'Pending').length,
    updateRequest: (id: string, status: Exclude<RequestStatus, 'Pending'>) => setRequests((current) => current.map((request) => request.id === id && request.status === 'Pending' ? { ...request, status } : request)),
  }), [requests])
  return <RequestStateContext.Provider value={value}>{children}</RequestStateContext.Provider>
}

export function useRequestState() {
  const context = useContext(RequestStateContext)
  if (!context) throw new Error('useRequestState must be used inside RequestStateProvider')
  return context
}

export { seedRequests }
