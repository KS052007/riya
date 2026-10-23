import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import './BuildInPublic.css'

const milestones = [
  { number: '01', title: 'Ideas in progress', detail: 'What we are exploring and why it matters.' },
  { number: '02', title: 'Work in the open', detail: 'Small updates from the people building it.' },
  { number: '03', title: 'Lessons learned', detail: 'Honest notes on what worked and what did not.' },
]

export default function BuildInPublic() {
  const [submissions, setSubmissions] = useState([])
  const [form, setForm] = useState({ name: '', email: '', title: '', summary: '', sourceType: 'github', sourceUrl: '', imageUrl: '', website: '' })
  const [formState, setFormState] = useState({ busy: false, error: '', success: '' })

  useEffect(() => {
    fetch('/api/public/build-in-public').then(response => response.ok ? response.json() : Promise.reject())
      .then(result => setSubmissions(result.submissions || []))
      .catch(() => setSubmissions([]))
  }, [])

  async function submitProject(event) {
    event.preventDefault()
    setFormState({ busy: true, error: '', success: '' })
    try {
      const response = await fetch('/api/public/build-in-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Submission failed. Please try again.')
      setForm({ name: '', email: '', title: '', summary: '', sourceType: 'github', sourceUrl: '', imageUrl: '', website: '' })
      setFormState({ busy: false, error: '', success: 'Thanks. Your project is now waiting for admin review.' })
    } catch (error) {
      setFormState({ busy: false, error: error.message, success: '' })
    }
  }

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <PageTransition>
      <main className="build-public-page">
        <div className="build-public-glow" aria-hidden="true" />
        <section className="build-public-hero">
          <motion.div
            className="build-public-copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="build-public-status"><span /> Submissions open</div>
            <p className="build-public-eyebrow">Binary Minds · Open process</p>
            <h1>Build in <span>Public.</span></h1>
            <p className="build-public-intro">
              A place for the work behind the work: ideas taking shape, experiments,
              and community projects shared before they feel finished.
            </p>
            <div className="build-public-actions">
              <a href="#share-project" className="build-public-primary">Share a project</a>
              <a href="#community-projects" className="build-public-secondary">Explore community work <span aria-hidden="true">↓</span></a>
            </div>
          </motion.div>

          <motion.aside
            className="build-public-preview"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            aria-label="What is coming to Build in Public"
          >
            <div className="build-preview-top"><span>FIELD NOTES</span><span>FIELD NOTE / 001</span></div>
            <div className="build-preview-orbit" aria-hidden="true">
              <div className="build-orbit-ring build-orbit-ring-one" />
              <div className="build-orbit-ring build-orbit-ring-two" />
              <div className="build-orbit-core"><img src="/binary-minds-logo.jpg" alt="Binary Minds logo" /></div>
              <i className="build-orbit-point build-orbit-point-one" />
              <i className="build-orbit-point build-orbit-point-two" />
            </div>
            <div className="build-preview-caption">
              <span>COMMUNITY PROJECTS</span>
              <strong>Ideas, experiments, and open work from our community.</strong>
            </div>
            <div className="build-preview-progress"><span /></div>
          </motion.aside>
        </section>

        <section className="build-public-roadmap" aria-labelledby="build-public-roadmap-title">
          <div className="build-roadmap-heading">
            <p className="build-public-eyebrow">The next chapter</p>
            <h2 id="build-public-roadmap-title">More than a finished product.</h2>
          </div>
          <div className="build-roadmap-list">
            {milestones.map((milestone) => (
              <article className="build-roadmap-item" key={milestone.number}>
                <span className="build-roadmap-number">{milestone.number}</span>
                <div><h3>{milestone.title}</h3><p>{milestone.detail}</p></div>
                <span className="build-roadmap-mark" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="build-public-community" aria-labelledby="build-public-community-title">
          <div className="build-community-heading">
            <p className="build-public-eyebrow">Made by the community</p>
            <h2 id="build-public-community-title">Show us what you’re building.</h2>
            <p>Share a project, experiment, or open-source contribution. A Binary Minds admin reviews every submission before it appears here.</p>
          </div>
          <form id="share-project" className="build-public-form" onSubmit={submitProject}>
            <div className="build-form-grid">
              <label>Your name<input name="name" value={form.name} onChange={updateField} maxLength={100} required /></label>
              <label>Email<input name="email" type="email" value={form.email} onChange={updateField} maxLength={160} required /></label>
              <label className="build-form-wide">Project title<input name="title" value={form.title} onChange={updateField} maxLength={120} required /></label>
              <label className="build-form-wide">What are you building?<textarea name="summary" value={form.summary} onChange={updateField} minLength={20} maxLength={1200} rows={4} required /></label>
              <label>Project source<select name="sourceType" value={form.sourceType} onChange={updateField}><option value="github">GitHub repository</option><option value="drive">Google Drive</option><option value="other">Other project link</option></select></label>
              <label>Source link<input name="sourceUrl" type="url" placeholder="https://…" value={form.sourceUrl} onChange={updateField} required /></label>
              <label className="build-form-wide">Preview image link <span>(optional; use a public GitHub or Drive image URL)</span><input name="imageUrl" type="url" placeholder="https://…" value={form.imageUrl} onChange={updateField} /></label>
              <label className="build-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={updateField} /></label>
            </div>
            {formState.error && <p className="build-form-error" role="alert">{formState.error}</p>}
            {formState.success && <p className="build-form-success" role="status">{formState.success}</p>}
            <button className="build-public-primary" disabled={formState.busy}>{formState.busy ? 'Sending for review…' : 'Submit for review'}</button>
            <p className="build-form-note">Your email is only used if an admin needs to follow up. It won’t appear publicly.</p>
          </form>
        </section>

        <section id="community-projects" className="build-public-feed" aria-labelledby="build-public-feed-title">
          <div className="build-roadmap-heading"><p className="build-public-eyebrow">Approved projects</p><h2 id="build-public-feed-title">Community work, out in the open.</h2></div>
          {submissions.length ? <div className="build-project-grid">{submissions.map(item => (
            <article className="build-project-card" key={item.id}>
              {item.imageUrl && <a className="build-project-image" href={item.sourceUrl} target="_blank" rel="noreferrer"><img src={item.imageUrl} alt="" loading="lazy" /></a>}
              <div className="build-project-body"><span>{item.sourceType === 'drive' ? 'Google Drive' : item.sourceType === 'github' ? 'GitHub' : 'Community project'} · {item.name}</span><h3>{item.title}</h3><p>{item.summary}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">View project <span aria-hidden="true">↗</span></a></div>
            </article>
          ))}</div> : <p className="build-feed-empty">The first community projects will appear here after review.</p>}
        </section>
      </main>
    </PageTransition>
  )
}
