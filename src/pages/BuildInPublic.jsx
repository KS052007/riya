import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import './BuildInPublic.css'

const CHUNK_BYTES = 512 * 1024
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_FILES = new Set(['pdf', 'doc', 'docx'])

const EMPTY_FORM = {
  fullName: '',
  studentEmail: '',
  githubProfile: '',
  linkedinProfile: '',
  motivation: '',
  contributionIdea: '',
  website: '',
}

function fileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsDataURL(file)
  })
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.')
  return result
}

function driveImageSource(shareUrl) {
  if (!shareUrl) return ''
  try {
    const url = new URL(shareUrl)
    const fileId = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id')
    return url.hostname === 'drive.google.com' && fileId ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}` : ''
  } catch {
    return ''
  }
}

export default function BuildInPublic() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const fileInputRef = useRef(null)
  const joinButtonRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [formState, setFormState] = useState({ busy: false, error: '', success: false })

  useEffect(() => {
    let active = true
    fetch('/api/public/build-in-public')
      .then(async response => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Projects are temporarily unavailable.')
        return result
      })
      .then(result => { if (active) setProjects(result.projects || []) })
      .catch(error => { if (active) setProjectsError(error.message) })
      .finally(() => { if (active) setProjectsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isFormOpen) return undefined
    const onKeyDown = event => { if (event.key === 'Escape' && !formState.busy) closeForm() }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('build-modal-open')
    document.body.classList.add('contribution-modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('build-modal-open')
      document.body.classList.remove('contribution-modal-open')
    }
  }, [isFormOpen, formState.busy])

  function closeForm() {
    if (formState.busy) return
    setIsFormOpen(false)
    setFormState({ busy: false, error: '', success: false })
    window.requestAnimationFrame(() => joinButtonRef.current?.focus())
  }

  function openForm(project, trigger) {
    setSelectedProject(project)
    joinButtonRef.current = trigger
    setIsFormOpen(true)
    setFormState({ busy: false, error: '', success: false })
  }

  function chooseFile(nextFile) {
    setFormState(state => ({ ...state, error: '' }))
    if (!nextFile) return setFile(null)
    const extension = nextFile.name.split('.').pop().toLowerCase()
    if (!ALLOWED_FILES.has(extension)) { setFile(null); return setFormState(state => ({ ...state, error: 'Choose a PDF, DOC, or DOCX file.' })) }
    if (nextFile.size < 1 || nextFile.size > MAX_FILE_BYTES) { setFile(null); return setFormState(state => ({ ...state, error: 'The attachment must be a non-empty file up to 5 MB.' })) }
    setFile(nextFile)
  }

  async function submitApplication(event) {
    event.preventDefault()
    setFormState({ busy: true, error: '', success: false })
    try {
      let uploadId = ''
      if (file) {
        const upload = await postJson('/api/public/build-in-public-attachment', {
          action: 'init', fileName: file.name, size: file.size,
        })
        uploadId = upload.uploadId
        for (let index = 0; index < upload.totalChunks; index += 1) {
          const start = index * CHUNK_BYTES
          const chunk = await fileAsBase64(file.slice(start, Math.min(start + CHUNK_BYTES, file.size)))
          await postJson('/api/public/build-in-public-attachment', { action: 'chunk', uploadId, index, data: chunk })
        }
      }
      await postJson('/api/public/build-in-public', { ...form, projectId: selectedProject.id, uploadId })
      setFormState({ busy: false, error: '', success: true })
      setForm(EMPTY_FORM)
      setFile(null)
    } catch (error) {
      setFormState({ busy: false, error: error.message, success: false })
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
          <motion.div className="build-public-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <div className="build-public-status"><span /> Open collaboration</div>
            <p className="build-public-eyebrow">Binary Minds · Build in Public</p>
            <h1>Build in <span>Public.</span></h1>
            <p className="build-public-intro">Follow the ideas taking shape inside Binary Minds, meet the people behind them, and find a project you can help move forward.</p>
            <div className="build-public-actions">
              <a className="build-public-primary" href="#open-projects">Explore open projects</a>
              <a href="#contribution-guidelines" className="build-public-secondary">How to contribute <span aria-hidden="true">↓</span></a>
            </div>
          </motion.div>

          <motion.aside className="build-public-preview" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}>
            <div className="build-preview-top"><span>OPEN COLLABORATION</span><span>PROJECT / 001</span></div>
            <div className="build-preview-orbit" aria-hidden="true">
              <div className="build-orbit-ring build-orbit-ring-one" />
              <div className="build-orbit-ring build-orbit-ring-two" />
              <div className="build-orbit-core"><img src="/binary-minds-logo.jpg" alt="" /></div>
              <i className="build-orbit-point build-orbit-point-one" />
              <i className="build-orbit-point build-orbit-point-two" />
            </div>
            <div className="build-preview-caption"><span>NOW SEEKING CONTRIBUTORS</span><strong>Build useful, transparent AI agents with us.</strong></div>
            <div className="build-preview-progress"><span /></div>
          </motion.aside>
        </section>

        <section id="open-projects" className="build-open-projects" aria-labelledby="build-public-project-title">
          <div className="build-projects-heading"><div><p className="build-public-eyebrow">Build with the community</p><h2 id="build-public-project-title">Open projects</h2></div><span>Ideas published by Binary Minds admins</span></div>
          {projectsLoading ? <p className="build-feed-empty">Loading open projects…</p> : projectsError ? <p className="build-feed-error" role="alert">{projectsError}</p> : projects.length ? <div className="build-open-project-grid">
            {projects.map((project, index) => <article className="build-public-project-card" key={project.id}>
              <div className={`build-project-visual ${project.imageDriveUrl ? 'has-project-image' : ''}`} aria-hidden="true">{driveImageSource(project.imageDriveUrl) ? <img className="build-project-cover" src={driveImageSource(project.imageDriveUrl)} alt="" loading="lazy" /> : <><div className="agent-node agent-node-main">{String(index + 1).padStart(2, '0')}</div><div className="agent-node agent-node-one">IDEA</div><div className="agent-node agent-node-two">BUILD</div><div className="agent-node agent-node-three">SHARE</div><span className="agent-line agent-line-one" /><span className="agent-line agent-line-two" /><span className="agent-line agent-line-three" /></>}</div>
              <div className="build-project-info"><div className="build-project-label"><span>Seeking contributors</span><span>Open project</span></div><h3>{project.title}</h3><p>{project.summary}</p>
                {project.tags?.length > 0 && <div className="build-project-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
                <div className="build-project-footer"><p>{project.guidelines}</p><div className="build-project-actions">{project.repositoryUrl && <a className="build-repository-link" href={project.repositoryUrl} target="_blank" rel="noreferrer">View repository</a>}<button type="button" className="build-join-button" onClick={event => openForm(project, event.currentTarget)}>Join Now</button></div></div>
              </div>
            </article>)}
          </div> : <div className="build-feed-empty">No projects are open for contributions right now. Check back soon.</div>}
        </section>

        <section id="contribution-guidelines" className="build-public-guidelines">
          <p className="build-public-eyebrow">Contribution guidelines</p>
          <h2>Bring your skills. Shape the direction.</h2>
          <p className="build-guidelines-description">Each project has its own contribution guidelines. Choose an open project above to read its details and send a request.</p>
        </section>
      </main>

      {isFormOpen && <div className="contribution-overlay" data-lenis-prevent onMouseDown={event => { if (event.target === event.currentTarget) closeForm() }}>
        <section className="contribution-modal" role="dialog" aria-modal="true" aria-labelledby="contribution-title">
          <header className="contribution-modal-header"><div><span>Contribution Request</span><h2 id="contribution-title">Contribute to <strong>Binary Minds</strong></h2><p>{selectedProject?.title} · Share your skills, ideas and experience with our developer community.</p><i /></div><button type="button" className="contribution-close" onClick={closeForm} aria-label="Close contribution form">×</button></header>
          <div className="contribution-modal-layout">
          {formState.success ? <div className="contribution-success"><div className="contribution-success-mark">✓</div><h3>Request received</h3><p>Your contribution request is now in the review queue. A Binary Minds admin will contact you at the student email you provided.</p><button className="build-join-button" onClick={closeForm}>Done</button></div> : <form className="contribution-form" onSubmit={submitApplication}>
            <div className="contribution-fields-scroll" data-lenis-prevent><div className="contribution-fields-grid">
              <label><span>Full Name <b>*</b></span><input name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" maxLength={100} autoFocus required /></label>
              <label><span>Student Email <b>*</b></span><input name="studentEmail" type="email" value={form.studentEmail} onChange={updateField} autoComplete="email" placeholder="student@iitmbs.ac.in" maxLength={160} required /></label>
              <label><span>GitHub ID / Profile <b>*</b></span><input name="githubProfile" type="text" inputMode="url" value={form.githubProfile} onChange={updateField} placeholder="Username or github.com/username" maxLength={300} autoComplete="off" required /></label>
              <label><span>LinkedIn ID / Profile <b>*</b></span><input name="linkedinProfile" type="text" inputMode="url" value={form.linkedinProfile} onChange={updateField} placeholder="LinkedIn ID or linkedin.com/in/username" maxLength={300} autoComplete="off" required /></label>
              <label className="contribution-field-wide"><span>Why do you want to contribute? <b>*</b></span><textarea name="motivation" value={form.motivation} onChange={updateField} rows={4} maxLength={2000} minLength={20} placeholder="Share your motivation, experience, or what draws you to this project…" required /></label>
              <label className="contribution-field-wide"><span>Your idea for improving or contributing to the project <b>*</b></span><textarea name="contributionIdea" value={form.contributionIdea} onChange={updateField} rows={4} maxLength={2000} minLength={20} placeholder="Describe the feature, improvement, or area you would like to work on…" required /></label>
              <div className="contribution-attachment-field">
                <span className="contribution-field-label">Optional Attachment (PDF / DOC / DOCX)</span>
                <div className={`contribution-dropzone ${dragActive ? 'active' : ''}`} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click() }} onClick={() => fileInputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragActive(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { event.preventDefault(); setDragActive(false) }} onDrop={event => { event.preventDefault(); setDragActive(false); chooseFile(event.dataTransfer.files?.[0]) }}>
                <span>{file ? file.name : 'Choose a file or drop it here'}</span><small>PDF or Word document, up to 5 MB</small>
                <input ref={fileInputRef} type="file" hidden accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onClick={event => event.stopPropagation()} onChange={event => chooseFile(event.target.files?.[0])} />
                </div>
                {file && <button type="button" className="contribution-remove-file" onClick={() => { chooseFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>Remove file</button>}
              </div>
              <label className="contribution-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={updateField} /></label>
            </div>
            {formState.error && <p className="contribution-error" role="alert">{formState.error}</p>}
            </div><footer className="contribution-form-actions"><p>Your details are shared only with the Binary Minds review team.</p><div><button type="button" className="contribution-cancel" onClick={closeForm} disabled={formState.busy}>Cancel</button><button type="submit" className="build-join-button" disabled={formState.busy}>{formState.busy ? 'Submitting request…' : 'Submit Request'}</button></div></footer>
          </form>}
            <aside className="contribution-side-panel">
              <section className="contribution-guidelines-panel"><span className="contribution-side-eyebrow">Contribution guidelines</span><p>{selectedProject?.guidelines}</p>{selectedProject?.tags?.length > 0 && <><span className="contribution-side-eyebrow contribution-looking-for">Looking for</span><div className="contribution-side-tags">{selectedProject.tags.map(tag => <span key={tag}>{tag}</span>)}</div></>}</section>
              <div className={`contribution-side-visual ${selectedProject?.imageDriveUrl ? 'has-image' : ''}`}>
                {driveImageSource(selectedProject?.imageDriveUrl) ? <img src={driveImageSource(selectedProject.imageDriveUrl)} alt="" /> : <><img src="/binary-minds-logo.jpg" alt="" /><span>Build<br />Together</span></>}
              </div>
            </aside>
          </div>
        </section>
      </div>}
    </PageTransition>
  )
}
