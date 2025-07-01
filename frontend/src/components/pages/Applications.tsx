// File: src/pages/Applications.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import { CardView } from '../Applications/CardView'
import { Application } from '../Applications/CardItem'


const Applications = (props: { path?: string }) => {
//   const [applications, setApplications] = useState<Application[]>([])
  useEffect(() => {
    fetchGroups().catch((error) => {
      console.error('Failed to fetch applications:', error)
    })
  }, [])
  const [apps, setApps] = useState<Application[]>([])
  const fetchGroups = async () => {
    const token = localStorage.getItem('jwt')

    const res = await fetch('http://localhost:3001/api/apps/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    setApps(data)
    console.log('Fetched applications:', data)
  }
  return( 
  <div>
      <h2>Applications</h2>
        <CardView application={apps}/>
  </div>
  )

}
export default Applications
