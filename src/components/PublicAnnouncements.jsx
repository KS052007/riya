import { useEffect, useState } from 'react'

export default function PublicAnnouncements() {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    let active = true
    fetch('/api/public/content?type=siteAnnouncement')
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (!active) return
        const now = Date.now()
        setAnnouncements((result?.documents || []).filter(item => {
          const starts = item.startsAt ? new Date(item.startsAt).getTime() : 0
          const ends = item.endsAt ? new Date(item.endsAt).getTime() : Infinity
          return starts <= now && ends >= now
        }))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!announcements.length) return null
  return (
    <aside aria-label="Announcements" className="public-announcements">
      {announcements.map(item => (
        <div key={item._id} className="public-announcement">
          <strong>{item.title}</strong>
          {item.body && <span>{item.body}</span>}
        </div>
      ))}
    </aside>
  )
}
