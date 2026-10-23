import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import './BuildInPublic.css'

const PROJECT_NAME = 'Binary Minds Open AI Agent Framework'
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

export default function BuildInPublic() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [formState, setFormState] = useState({ busy: false, error: '', success: false })

  useEffect(() => {
    if (!isFormOpen) return undefined
    const onKeyDown = event => { if (event.key === 'Escape' && !formState.busy) setIsFormOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('build-modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('build-modal-open')
    }
  }, [isFormOpen, formState.busy])

  function closeForm() {
    if (formState.busy) return
    setIsFormOpen(false)
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
      await postJson('/api/public/build-in-public', { ...form, uploadId })
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
              <button type="button" className="build-public-primary" onClick={() => { setIsFormOpen(true); setFormState({ busy: false, error: '', success: false }) }}>Explore open projects</button>
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

        <section className="build-public-projects" aria-labelledby="build-public-project-title">
          <div className="build-project-visual" aria-hidden="true"><div className="agent-node agent-node-main">BM</div><div className="agent-node agent-node-one">LLM</div><div className="agent-node agent-node-two">TOOLS</div><div className="agent-node agent-node-three">UI</div><span className="agent-line agent-line-one" /><span className="agent-line agent-line-two" /><span className="agent-line agent-line-three" /></div>
          <div className="build-project-info">
            <div className="build-project-label"><span>Seeking contributors</span><span>Open source</span></div>
            <h2 id="build-public-project-title">{PROJECT_NAME}</h2>
            <p>An open-source framework for building and inspecting multi-agent AI workflows, with a visual debugger for understanding how agents reason and collaborate.</p>
            <div className="build-project-tags"><span>AI / ML</span><span>Python</span><span>LLMs</span><span>React</span><span>Agent tooling</span></div>
            <div className="build-project-footer"><p>Looking for Python developers with LLM and prompt engineering experience, plus React contributors for visual agent debuggers.</p><button className="build-join-button" onClick={() => { setIsFormOpen(true); setFormState({ busy: false, error: '', success: false }) }}>Join Now</button></div>
          </div>
        </section>

        <section id="contribution-guidelines" className="build-public-guidelines">
          <p className="build-public-eyebrow">Contribution guidelines</p>
          <h2>Bring your skills. Shape the direction.</h2>
          <div className="build-guideline-grid">
            <article><span>01</span><h3>Python and LLMs</h3><p>Help build agent workflows, integrations, and reliable evaluation tools.</p></article>
            <article><span>02</span><h3>Prompt engineering</h3><p>Design prompts and patterns that make multi-agent behavior clearer and more useful.</p></article>
            <article><span>03</span><h3>React visual debugger</h3><p>Build interfaces that help people see what agents are doing and why.</p></article>
          </div>
          <button className="build-guidelines-join" onClick={() => { setIsFormOpen(true); setFormState({ busy: false, error: '', success: false }) }}>Send a contribution request</button>
        </section>
      </main>

      {isFormOpen && <div className="contribution-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeForm() }}>
        <section className="contribution-modal" role="dialog" aria-modal="true" aria-labelledby="contribution-title">
          <header className="contribution-modal-header"><div><span>Contribution Request</span><h2 id="contribution-title">{PROJECT_NAME}</h2></div><button type="button" className="contribution-close" onClick={closeForm} aria-label="Close contribution form">×</button></header>
          {formState.success ? <div className="contribution-success"><div className="contribution-success-mark">✓</div><h3>Request received</h3><p>Your contribution request is now in the review queue. A Binary Minds admin will contact you at the student email you provided.</p><button className="build-join-button" onClick={closeForm}>Done</button></div> : <form className="contribution-form" onSubmit={submitApplication}>
            <div className="contribution-guideline-callout"><strong>Contribution Guidelines:</strong><p>Looking for Python developers with experience in LLMs, prompt engineering, and React frontend contributors for visual agent debuggers.</p></div>
            <div className="contribution-fields-grid">
              <label>Full Name <b>*</b><input name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" maxLength={100} required /></label>
              <label>Student Email <b>*</b><input name="studentEmail" type="email" value={form.studentEmail} onChange={updateField} autoComplete="email" placeholder="student@iitmbs.ac.in" maxLength={160} required /></label>
              <label>GitHub ID / Profile <b>*</b><input name="githubProfile" type="url" value={form.githubProfile} onChange={updateField} placeholder="https://github.com/username" maxLength={300} required /></label>
              <label>LinkedIn ID / Profile <b>*</b><input name="linkedinProfile" type="url" value={form.linkedinProfile} onChange={updateField} placeholder="https://linkedin.com/in/username" maxLength={300} required /></label>
              <label className="contribution-field-wide">Why do you want to contribute? <b>*</b><textarea name="motivation" value={form.motivation} onChange={updateField} rows={3} maxLength={2000} minLength={20} placeholder="Share your motivation, experience, or what draws you to this project…" required /></label>
              <label className="contribution-field-wide">Your idea for improving or contributing to the project <b>*</b><textarea name="contributionIdea" value={form.contributionIdea} onChange={updateField} rows={3} maxLength={2000} minLength={20} placeholder="Describe the feature, improvement, or area you would like to work on…" required /></label>
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
            <footer className="contribution-form-actions"><button type="button" className="contribution-cancel" onClick={closeForm} disabled={formState.busy}>Cancel</button><button type="submit" className="build-join-button" disabled={formState.busy}>{formState.busy ? 'Submitting request…' : 'Submit Contribution Request'}</button></footer>
          </form>}
        </section>
      </div>}
    </PageTransition>
  )
}
