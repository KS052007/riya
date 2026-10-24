import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeExternalUrl } from '../lib/buildInPublic'
import DocumentForm from './admin/DocumentForm'
import {
  Chips, Combo, Confirm, Counter, Empty, Field, OptionCards, Pill, PublishRail, Search, Section,
  Segmented, StatusDot, TextArea, TextInput, Toasts,
} from './admin/fields'
import {
  ADMIN_ROLES, FORMS, PROJECT_CATEGORIES, PROJECT_DIFFICULTIES, PROJECT_VISIBILITY, PUBLICATION_STAGES,
  TAG_SUGGESTIONS, blankDocument, listRequiredGaps,
} from './admin/schema'
import './AdminPortal.css'

const CONTENT_TYPES = ['siteEvent', 'siteResult', 'siteAnnouncement']

// Mirrors api/admin/content.js so the interface never offers an action the server
// will refuse.
const VIEWERS = {
  siteEvent: ['super_admin', 'event_organizer', 'read_only'],
  siteResult: ['super_admin', 'event_organizer', 'read_only'],
  siteAnnouncement: ['super_admin', 'content_editor', 'event_organizer', 'read_only'],
}
const EDITORS = {
  siteEvent: ['super_admin', 'event_organizer'],
  siteResult: ['super_admin', 'event_organizer'],
  siteAnnouncement: ['super_admin', 'content_editor', 'event_organizer'],
}

const EMPTY_PROJECT = {
  title: '', summary: '', guidelines: '', tags: [], category: '', difficulty: '',
  authorName: '', authorRole: '', authorAvatarUrl: '', repositoryUrl: '', imageDriveUrl: '', status: 'draft',
}

function canView(role, type) { return (VIEWERS[type] || []).includes(role) }
function canEdit(role, type) { return (EDITORS[type] || []).includes(role) }
function canPublish(role) { return role === 'super_admin' || role === 'event_organizer' }

function stageTone(value) {
  return PUBLICATION_STAGES.find(stage => stage.value === value)?.tone || 'off'
}

function countChanges(before, after) {
  if (!before) return 1
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  let changed = 0
  for (const key of keys) {
    if (key.startsWith('_') && key !== '_type') continue
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) changed += 1
  }
  return changed
}

function article(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

function describe(list) {
  if (list.length === 1) return list[0]
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
  return payload
}

export default function AdminPortal() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [view, setView] = useState('build-in-public')
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState([])

  const [documents, setDocuments] = useState([])
  const [eventIds, setEventIds] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [original, setOriginal] = useState(null)
  const [draft, setDraft] = useState(null)
  const [rawMode, setRawMode] = useState(false)
  const [rawText, setRawText] = useState('')
  const [rawError, setRawError] = useState('')
  const [docQuery, setDocQuery] = useState('')

  const [submissions, setSubmissions] = useState([])
  const [projects, setProjects] = useState([])
  const [bipSection, setBipSection] = useState('projects')
  const [projectDraft, setProjectDraft] = useState(EMPTY_PROJECT)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectQuery, setProjectQuery] = useState('')
  const [requestFilter, setRequestFilter] = useState('pending')
  const [openRequest, setOpenRequest] = useState(null)

  const [adminUsers, setAdminUsers] = useState([])
  const [newAccount, setNewAccount] = useState({ username: '', role: 'content_editor', password: '' })
  const [auditEntries, setAuditEntries] = useState([])
  const [auditQuery, setAuditQuery] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const toastTimers = useRef(new Map())

  const say = useCallback((message, tone = 'go') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(list => [...list.slice(-2), { id, message, tone }])
    const timer = window.setTimeout(() => {
      setToasts(list => list.filter(toast => toast.id !== id))
      toastTimers.current.delete(id)
    }, tone === 'stop' ? 9000 : 4500)
    toastTimers.current.set(id, timer)
  }, [])

  const dismiss = useCallback(id => {
    window.clearTimeout(toastTimers.current.get(id))
    toastTimers.current.delete(id)
    setToasts(list => list.filter(toast => toast.id !== id))
  }, [])

  useEffect(() => () => {
    toastTimers.current.forEach(timer => window.clearTimeout(timer))
    toastTimers.current.clear()
  }, [])

  const form = CONTENT_TYPES.includes(view) ? FORMS[view] : null
  const readOnly = Boolean(form) && !canEdit(user?.role, view)
  const dirty = Boolean(draft) && (!original || JSON.stringify(original) !== JSON.stringify(draft))
  const changeCount = draft ? countChanges(original, draft) : 0
  const gaps = form && draft ? listRequiredGaps(form, draft) : []

  const clearEditor = useCallback(() => {
    setSelectedId(null)
    setOriginal(null)
    setDraft(null)
    setRawMode(false)
    setRawError('')
  }, [])

  const loadDocuments = useCallback(async type => {
    setBusy(true)
    try {
      const result = await request(`/api/admin/content?type=${encodeURIComponent(type)}`)
      setDocuments(result.documents || [])
    } catch (reason) {
      setDocuments([])
      say(reason.message, 'stop')
    } finally {
      setBusy(false)
    }
  }, [say])

  useEffect(() => {
    request('/api/auth/session')
      .then(result => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  // Land every role on a view it is actually allowed to open.
  useEffect(() => {
    if (!user) return
    const allowed = view === 'build-in-public' || view === 'accounts' || view === 'audit'
      ? user.role === 'super_admin'
      : canView(user.role, view)
    if (!allowed) {
      setView(user.role === 'super_admin' ? 'build-in-public' : user.role === 'content_editor' ? 'siteAnnouncement' : 'siteEvent')
    }
  }, [user, view])

  useEffect(() => {
    if (!user) return
    clearEditor()
    setDocQuery('')

    if (view === 'build-in-public') {
      if (user.role !== 'super_admin') return
      setBusy(true)
      Promise.all([request('/api/admin/build-in-public'), request('/api/admin/build-in-public-projects')])
        .then(([applications, projectResult]) => {
          setSubmissions(applications.submissions || [])
          setProjects(projectResult.projects || [])
        })
        .catch(reason => { setSubmissions([]); setProjects([]); say(reason.message, 'stop') })
        .finally(() => setBusy(false))
      return
    }
    if (view === 'accounts') {
      if (user.role !== 'super_admin') return
      setBusy(true)
      request('/api/admin/users')
        .then(result => setAdminUsers(result.users || []))
        .catch(reason => { setAdminUsers([]); say(reason.message, 'stop') })
        .finally(() => setBusy(false))
      return
    }
    if (view === 'audit') {
      if (user.role !== 'super_admin') return
      setBusy(true)
      request('/api/admin/audit')
        .then(result => setAuditEntries(result.entries || []))
        .catch(reason => { setAuditEntries([]); say(reason.message, 'stop') })
        .finally(() => setBusy(false))
      return
    }
    if (CONTENT_TYPES.includes(view)) loadDocuments(view)
  }, [user, view, loadDocuments, clearEditor, say])

  // Results pick their event from a list rather than a typed id.
  useEffect(() => {
    if (view !== 'siteResult' || !user) return
    request('/api/admin/content?type=siteEvent')
      .then(result => setEventIds((result.documents || []).map(doc => doc.eventId || doc.slug?.current || doc._id).filter(Boolean)))
      .catch(() => setEventIds([]))
  }, [view, user])

  // Warn before losing unsaved work to a tab close.
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(event) { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        if (!dirty || readOnly || !draft) return
        event.preventDefault()
        saveDocument()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setLoginError('')
    try {
      const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      setUser(result.user)
      setPassword('')
    } catch (reason) {
      setLoginError(reason.message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    try { await request('/api/auth/logout', { method: 'POST', body: '{}' }) }
    finally {
      setUser(null)
      setView('build-in-public')
      setDocuments([])
      clearEditor()
      navigate('/kazi_binary_admins', { replace: true })
    }
  }

  function openDocument(doc) {
    if (dirty && !window.confirm('Leave this document? Your unsaved changes will be lost.')) return
    setSelectedId(doc._id)
    setOriginal(doc)
    setDraft(doc)
    setRawMode(false)
    setRawError('')
  }

  function startNew() {
    if (dirty && !window.confirm('Leave this document? Your unsaved changes will be lost.')) return
    setSelectedId(null)
    setOriginal(null)
    setDraft(blankDocument(view))
    setRawMode(false)
    setRawError('')
  }

  function updateDraft(next) {
    setDraft(next)
    if (rawMode) setRawText(JSON.stringify(next, null, 2))
  }

  function toggleRaw() {
    if (!rawMode) setRawText(JSON.stringify(draft, null, 2))
    setRawError('')
    setRawMode(mode => !mode)
  }

  function onRawChange(text) {
    setRawText(text)
    try {
      const parsed = JSON.parse(text)
      setDraft(parsed)
      setRawError('')
    } catch {
      setRawError('Not valid JSON yet, so the form is still showing the last good version.')
    }
  }

  async function saveDocument(event) {
    event?.preventDefault()
    if (!draft || readOnly) return
    if (rawError) { say('Fix the JSON before saving.', 'stop'); return }
    const missing = listRequiredGaps(form, draft)
    if (missing.length) { say(`Add ${describe(missing)} before saving.`, 'stop'); return }
    if (draft.publicationStatus === 'published' && !canPublish(user.role)) {
      say('Your role cannot publish. Save it in review and ask an organizer to publish.', 'stop')
      return
    }

    setBusy(true)
    try {
      const isUpdate = Boolean(selectedId)
      const path = `/api/admin/content?type=${encodeURIComponent(view)}${isUpdate ? `&id=${encodeURIComponent(selectedId)}` : ''}`
      const result = await request(path, { method: isUpdate ? 'PUT' : 'POST', body: JSON.stringify(draft) })
      const saved = result.document
      say(isUpdate ? `${form.label} saved.` : `${form.label} created as a draft.`)
      await loadDocuments(view)
      if (saved?._id) {
        setSelectedId(saved._id)
        setOriginal(saved)
        setDraft(saved)
        if (rawMode) setRawText(JSON.stringify(saved, null, 2))
      }
    } catch (reason) {
      say(reason.message, 'stop')
    } finally {
      setBusy(false)
    }
  }

  async function deleteDocument() {
    if (!selectedId) return
    setBusy(true)
    try {
      await request(`/api/admin/content?type=${encodeURIComponent(view)}&id=${encodeURIComponent(selectedId)}`, { method: 'DELETE' })
      say(`${form.label} deleted.`)
      clearEditor()
      await loadDocuments(view)
    } catch (reason) {
      say(reason.message, 'stop')
    } finally {
      setBusy(false)
    }
  }

  async function refreshProjects() {
    try { setProjects((await request('/api/admin/build-in-public-projects')).projects || []) }
    catch (reason) { say(reason.message, 'stop') }
  }

  async function refreshSubmissions() {
    setBusy(true)
    try { setSubmissions((await request('/api/admin/build-in-public')).submissions || []) }
    catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  function beginProjectEdit(project = null) {
    setEditingProjectId(project?.id || null)
    setProjectDraft(project
      ? { ...EMPTY_PROJECT, ...project, tags: Array.isArray(project.tags) ? project.tags : [] }
      : { ...EMPTY_PROJECT })
  }

  async function saveProject(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await request('/api/admin/build-in-public-projects', {
        method: editingProjectId ? 'PUT' : 'POST',
        body: JSON.stringify(editingProjectId ? { ...projectDraft, id: editingProjectId } : projectDraft),
      })
      await refreshProjects()
      say(editingProjectId ? 'Project saved.' : 'Project created.')
      beginProjectEdit()
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  async function deleteProject(project) {
    setBusy(true)
    try {
      await request('/api/admin/build-in-public-projects', { method: 'DELETE', body: JSON.stringify({ id: project.id }) })
      await refreshProjects()
      if (editingProjectId === project.id) beginProjectEdit()
      say('Project deleted.')
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  async function downloadAttachment(application) {
    if (!application.attachment) return
    setBusy(true)
    try {
      const parts = []
      for (let index = 0; index < application.attachment.totalChunks; index += 1) {
        const result = await request(`/api/admin/build-in-public-attachment?id=${encodeURIComponent(application.id)}&chunk=${index}`)
        const decoded = atob(result.data)
        const bytes = new Uint8Array(decoded.length)
        for (let offset = 0; offset < decoded.length; offset += 1) bytes[offset] = decoded.charCodeAt(offset)
        parts.push(bytes)
      }
      const blob = new Blob(parts, { type: application.attachment.mimeType })
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = application.attachment.fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  async function reviewSubmission(id, status) {
    setBusy(true)
    try {
      const result = await request('/api/admin/build-in-public', { method: 'PATCH', body: JSON.stringify({ id, status }) })
      await refreshSubmissions()
      if (status === 'accepted' && !result.notification?.sent) {
        say(`Accepted, but the email did not go out. ${result.notification?.message || 'Check the email setup and retry.'}`, 'stop')
      } else if (status === 'accepted') {
        say(result.notification?.alreadySent ? 'Accepted. The email had already gone out.' : 'Accepted and email sent.')
      } else {
        say(`Request ${status}.`)
      }
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  async function addAdminUser(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await request('/api/admin/users', { method: 'POST', body: JSON.stringify(newAccount) })
      setNewAccount({ username: '', role: 'content_editor', password: '' })
      setAdminUsers((await request('/api/admin/users')).users || [])
      say('Account added. Share the password with them securely.')
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  async function removeAdminUser(name) {
    setBusy(true)
    try {
      await request('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ username: name }) })
      setAdminUsers((await request('/api/admin/users')).users || [])
      say(`${name} no longer has access.`)
    } catch (reason) { say(reason.message, 'stop') }
    finally { setBusy(false) }
  }

  const visibleDocuments = useMemo(() => {
    const needle = docQuery.trim().toLowerCase()
    if (!needle) return documents
    return documents.filter(doc => `${doc.title || ''} ${doc._id} ${doc.publicationStatus || ''}`.toLowerCase().includes(needle))
  }, [documents, docQuery])

  const visibleProjects = useMemo(() => {
    const needle = projectQuery.trim().toLowerCase()
    if (!needle) return projects
    return projects.filter(project => `${project.title} ${project.summary} ${(project.tags || []).join(' ')}`.toLowerCase().includes(needle))
  }, [projects, projectQuery])

  const requestCounts = useMemo(() => submissions.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1
    return counts
  }, {}), [submissions])

  const visibleRequests = useMemo(() => (
    requestFilter === 'all' ? submissions : submissions.filter(item => item.status === requestFilter)
  ), [submissions, requestFilter])

  const visibleAudit = useMemo(() => {
    const needle = auditQuery.trim().toLowerCase()
    if (!needle) return auditEntries
    return auditEntries.filter(entry => `${entry.action} ${entry.actor} ${entry.role} ${entry.contentType || ''} ${entry.documentId || ''}`.toLowerCase().includes(needle))
  }, [auditEntries, auditQuery])

  if (!authChecked) {
    return <main className="admin-boot"><span className="admin-spinner" />Checking your session</main>
  }

  if (!user) {
    return (
      <main className="admin-gate">
        <section className="admin-gate-card" aria-labelledby="admin-gate-title">
          <a className="admin-brand" href="/"><img src="/binary-minds-logo.jpg" alt="" /><span>Binary Minds</span></a>
          <p className="admin-kicker">Backstage</p>
          <h1 id="admin-gate-title">Sign in to the workspace</h1>
          <p className="admin-lede">Events, results, announcements and Build in Public live here.</p>
          {loginError && <div className="admin-alert" role="alert">{loginError}</div>}
          <form onSubmit={signIn} className="admin-gate-form">
            <Field label="Username" htmlFor="admin-user">
              <TextInput id="admin-user" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="admin-pass">
              <TextInput id="admin-pass" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
            </Field>
            <button className="aprimary" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
          </form>
          <a className="admin-gate-back" href="/">Back to the public site</a>
        </section>
      </main>
    )
  }

  const navGroups = [
    {
      title: 'Community',
      items: [{ key: 'build-in-public', label: 'Build in Public', badge: requestCounts.pending, show: user.role === 'super_admin' }],
    },
    {
      title: 'Content',
      items: CONTENT_TYPES.map(type => ({ key: type, label: FORMS[type].plural, show: canView(user.role, type) })),
    },
    {
      title: 'Workspace',
      items: [
        { key: 'accounts', label: 'Access', show: user.role === 'super_admin' },
        { key: 'audit', label: 'Activity log', show: user.role === 'super_admin' },
      ],
    },
  ]

  const headings = {
    'build-in-public': { kicker: 'Super Admin only', title: 'Build in Public' },
    accounts: { kicker: 'Super Admin only', title: 'Access' },
    audit: { kicker: 'Super Admin only', title: 'Activity log' },
  }
  const heading = headings[view] || { kicker: readOnly ? 'View only' : 'Content', title: form?.plural }

  return (
    <main className="admin-shell">
      <a className="admin-skip" href="#admin-work">Skip to content</a>

      <aside className="admin-rail">
        <a className="admin-brand" href="/"><img src="/binary-minds-logo.jpg" alt="" /><span>Binary Minds</span></a>
        <nav className="admin-nav" aria-label="Sections">
          {navGroups.map(group => {
            const items = group.items.filter(item => item.show)
            if (!items.length) return null
            return (
              <div className="admin-nav-group" key={group.title}>
                <p className="admin-nav-title">{group.title}</p>
                {items.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className={`admin-nav-item${view === item.key ? ' is-on' : ''}`}
                    aria-current={view === item.key ? 'page' : undefined}
                    onClick={() => setView(item.key)}
                  >
                    <span>{item.label}</span>
                    {item.badge > 0 && <span className="admin-nav-badge">{item.badge}</span>}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="admin-whoami">
          <span className="admin-whoami-name">{user.username}</span>
          <span className="admin-whoami-role">{user.role.replaceAll('_', ' ')}</span>
          <button type="button" className="admin-signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <div className="admin-work" id="admin-work">
        <header className="admin-top">
          <div>
            <p className="admin-kicker">{heading.kicker}</p>
            <h1>{heading.title}</h1>
          </div>
          <div className="admin-top-actions">
            {view === 'build-in-public' && (
              <button type="button" className="asecondary" disabled={busy} onClick={bipSection === 'projects' ? refreshProjects : refreshSubmissions}>Refresh</button>
            )}
            {view === 'audit' && (
              <button type="button" className="asecondary" disabled={busy} onClick={() => request('/api/admin/audit').then(result => setAuditEntries(result.entries || [])).catch(reason => say(reason.message, 'stop'))}>Refresh</button>
            )}
            {form && !readOnly && <button type="button" className="aprimary" onClick={startNew}>New {form.label.toLowerCase()}</button>}
          </div>
        </header>

        {form && (
          <div className="admin-split">
            <section className="admin-finder" aria-label={`${form.plural} list`}>
              <Search value={docQuery} onChange={setDocQuery} placeholder={`Find ${form.plural.toLowerCase()}`} count={visibleDocuments.length} />
              <div className="admin-finder-list">
                {busy && !documents.length ? <p className="admin-quiet">Loading</p>
                  : visibleDocuments.length ? visibleDocuments.map(doc => (
                    <button
                      key={doc._id}
                      type="button"
                      className={`admin-finder-row${selectedId === doc._id ? ' is-on' : ''}`}
                      onClick={() => openDocument(doc)}
                    >
                      <StatusDot tone={stageTone(doc.publicationStatus)} title={doc.publicationStatus || 'No stage'} />
                      <span className="admin-finder-text">
                        <strong>{doc.title || 'Untitled'}</strong>
                        <code>{doc.publicationStatus || 'no stage'}</code>
                      </span>
                    </button>
                  ))
                    : <p className="admin-quiet">{docQuery ? 'Nothing matches that.' : `No ${form.plural.toLowerCase()} yet.`}</p>}
              </div>
            </section>

            <section className="admin-editor" aria-label={`${form.label} editor`}>
              {!draft ? (
                <Empty title={`Pick ${article(form.label)} ${form.label.toLowerCase()} to edit`} action={!readOnly && <button type="button" className="aprimary" onClick={startNew}>New {form.label.toLowerCase()}</button>}>
                  {form.blurb}
                </Empty>
              ) : (
                <form onSubmit={saveDocument} className="admin-editor-form">
                  <div className="admin-editor-top">
                    <div className="admin-editor-id">
                      <h2>{draft.title || `New ${form.label.toLowerCase()}`}</h2>
                      {selectedId ? <code>{selectedId}</code> : <Pill tone="hold">Not saved yet</Pill>}
                    </div>
                    <div className="admin-editor-tools">
                      <button type="button" className={`atoggle${rawMode ? ' is-on' : ''}`} onClick={toggleRaw} aria-pressed={rawMode}>Raw JSON</button>
                      {selectedId && user.role === 'super_admin' && (
                        <Confirm onConfirm={deleteDocument} disabled={busy} confirmLabel={`Yes, delete this ${form.label.toLowerCase()}`}>Delete</Confirm>
                      )}
                    </div>
                  </div>

                  <PublishRail
                    value={draft.publicationStatus || 'draft'}
                    stages={PUBLICATION_STAGES}
                    readOnly={readOnly}
                    locked={canPublish(user.role) ? [] : ['published']}
                    lockedNote="You can take this to review. An organizer publishes it."
                    onChange={stage => updateDraft({ ...draft, publicationStatus: stage })}
                  />

                  {readOnly && <p className="admin-note">Your role can read this but not change it.</p>}

                  {rawMode ? (
                    <div className="admin-raw">
                      <TextArea rows={22} spellCheck="false" value={rawText} onChange={event => onRawChange(event.target.value)} readOnly={readOnly} />
                      {rawError && <p className="admin-raw-error">{rawError}</p>}
                    </div>
                  ) : (
                    <DocumentForm
                      form={form}
                      document={draft}
                      onChange={updateDraft}
                      sources={{ events: eventIds }}
                      readOnly={readOnly}
                    />
                  )}

                  {!readOnly && (
                    <div className={`admin-savebar${dirty ? ' is-live' : ''}`}>
                      <span className="admin-savebar-state">
                        {dirty ? `${changeCount} unsaved ${changeCount === 1 ? 'change' : 'changes'}` : 'Everything saved'}
                        {gaps.length > 0 && <em>Still needs {describe(gaps)}</em>}
                      </span>
                      <div className="admin-savebar-actions">
                        {dirty && original && <button type="button" className="asecondary" onClick={() => updateDraft(original)}>Discard</button>}
                        <button className="aprimary" disabled={busy || !dirty || gaps.length > 0}>
                          {busy ? 'Saving' : selectedId ? 'Save changes' : `Create ${form.label.toLowerCase()}`}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </section>
          </div>
        )}

        {view === 'build-in-public' && (
          <>
            <nav className="admin-tabs" aria-label="Build in Public sections">
              <button type="button" className={bipSection === 'projects' ? 'is-on' : ''} onClick={() => setBipSection('projects')}>
                Projects <span>{projects.length}</span>
              </button>
              <button type="button" className={bipSection === 'applications' ? 'is-on' : ''} onClick={() => setBipSection('applications')}>
                Contribution requests {requestCounts.pending > 0 && <span className="is-live">{requestCounts.pending}</span>}
              </button>
            </nav>

            {bipSection === 'projects' ? (
              <div className="admin-split">
                <section className="admin-finder" aria-label="Projects list">
                  <Search value={projectQuery} onChange={setProjectQuery} placeholder="Find projects" count={visibleProjects.length} />
                  <div className="admin-finder-list">
                    {busy && !projects.length ? <p className="admin-quiet">Loading</p>
                      : visibleProjects.length ? visibleProjects.map(project => (
                        <div key={project.id} className={`admin-project-row${editingProjectId === project.id ? ' is-on' : ''}`}>
                          <button type="button" className="admin-project-open" onClick={() => beginProjectEdit(project)}>
                            <StatusDot tone={PROJECT_VISIBILITY.find(stage => stage.value === project.status)?.tone || 'off'} title={project.status} />
                            <span className="admin-finder-text">
                              <strong>{project.title}</strong>
                              <code>{project.status}{project.difficulty ? ` · ${project.difficulty}` : ''}</code>
                            </span>
                          </button>
                          <Confirm onConfirm={() => deleteProject(project)} disabled={busy} confirmLabel="Yes, delete">Delete</Confirm>
                        </div>
                      ))
                        : <p className="admin-quiet">{projectQuery ? 'Nothing matches that.' : 'No projects yet.'}</p>}
                  </div>
                  <button type="button" className="asecondary admin-finder-add" onClick={() => beginProjectEdit()}>New project</button>
                </section>

                <section className="admin-editor" aria-label="Project editor">
                  <form className="admin-editor-form" onSubmit={saveProject}>
                    <div className="admin-editor-top">
                      <div className="admin-editor-id">
                        <h2>{projectDraft.title || (editingProjectId ? 'Edit project' : 'New project')}</h2>
                        {editingProjectId ? <code>{editingProjectId}</code> : <Pill tone="hold">Not saved yet</Pill>}
                      </div>
                    </div>

                    <PublishRail
                      value={projectDraft.status}
                      stages={PROJECT_VISIBILITY}
                      onChange={stage => setProjectDraft({ ...projectDraft, status: stage })}
                    />

                    <div className="aform">
                      <Section title="Project" defaultOpen>
                        <div className="afield-grid">
                          <Field label="Project name" required htmlFor="bip-title" wide>
                            <TextInput id="bip-title" value={projectDraft.title} maxLength={140} required onChange={event => setProjectDraft({ ...projectDraft, title: event.target.value })} />
                            <Counter value={projectDraft.title} max={140} />
                          </Field>
                          <Field label="What it is" required htmlFor="bip-summary" wide hint="Shown on the public card. Two or three sentences.">
                            <TextArea id="bip-summary" rows={4} maxLength={1200} required value={projectDraft.summary} onChange={event => setProjectDraft({ ...projectDraft, summary: event.target.value })} />
                            <Counter value={projectDraft.summary} max={1200} />
                          </Field>
                          <Field label="How to contribute" required htmlFor="bip-guidelines" wide hint="Shown with the project and inside its request form.">
                            <TextArea id="bip-guidelines" rows={4} maxLength={1200} required value={projectDraft.guidelines} onChange={event => setProjectDraft({ ...projectDraft, guidelines: event.target.value })} />
                            <Counter value={projectDraft.guidelines} max={1200} />
                          </Field>
                        </div>
                      </Section>

                      <Section title="How it is listed" defaultOpen>
                        <div className="afield-grid">
                          <Field label="Track" htmlFor="bip-category" hint="Groups the project on the public ledger.">
                            <Combo id="bip-category" value={projectDraft.category} options={PROJECT_CATEGORIES} placeholder="Pick or type a track" onChange={next => setProjectDraft({ ...projectDraft, category: next })} />
                          </Field>
                          <Field label="Difficulty">
                            <Segmented name="Difficulty" value={projectDraft.difficulty} options={PROJECT_DIFFICULTIES} onChange={next => setProjectDraft({ ...projectDraft, difficulty: next === projectDraft.difficulty ? '' : next })} />
                          </Field>
                          <Field label="Tags" htmlFor="bip-tags" wide hint="Press Enter after each tag, or tap a suggestion.">
                            <Chips id="bip-tags" value={projectDraft.tags} suggestions={TAG_SUGGESTIONS} placeholder="Type a tag and press Enter" onChange={next => setProjectDraft({ ...projectDraft, tags: next })} />
                          </Field>
                        </div>
                      </Section>

                      <Section title="Owner">
                        <div className="afield-grid">
                          <Field label="Owner name" htmlFor="bip-owner" hint="Shown as the project byline.">
                            <TextInput id="bip-owner" value={projectDraft.authorName} maxLength={80} placeholder="Binary Minds Core" onChange={event => setProjectDraft({ ...projectDraft, authorName: event.target.value })} />
                          </Field>
                          <Field label="Owner role" htmlFor="bip-owner-role">
                            <TextInput id="bip-owner-role" value={projectDraft.authorRole} maxLength={80} placeholder="Maintainers" onChange={event => setProjectDraft({ ...projectDraft, authorRole: event.target.value })} />
                          </Field>
                          <Field label="Owner avatar" htmlFor="bip-avatar" wide hint="Google Drive image set to anyone with the link can view.">
                            <TextInput id="bip-avatar" type="url" value={projectDraft.authorAvatarUrl} placeholder="https://drive.google.com/file/d/" onChange={event => setProjectDraft({ ...projectDraft, authorAvatarUrl: event.target.value })} />
                          </Field>
                        </div>
                      </Section>

                      <Section title="Links">
                        <div className="afield-grid">
                          <Field label="Repository" htmlFor="bip-repo" wide hint="Full https:// link to the code.">
                            <TextInput id="bip-repo" type="url" value={projectDraft.repositoryUrl} placeholder="https://github.com/organization/project" onChange={event => setProjectDraft({ ...projectDraft, repositoryUrl: event.target.value })} />
                          </Field>
                          <Field label="Cover image" htmlFor="bip-image" wide hint="Google Drive image set to anyone with the link can view.">
                            <TextInput id="bip-image" type="url" value={projectDraft.imageDriveUrl} placeholder="https://drive.google.com/file/d/" onChange={event => setProjectDraft({ ...projectDraft, imageDriveUrl: event.target.value })} />
                          </Field>
                        </div>
                      </Section>
                    </div>

                    <div className="admin-savebar is-live">
                      <span className="admin-savebar-state">{editingProjectId ? 'Editing an existing project' : 'This will be created as a draft'}</span>
                      <div className="admin-savebar-actions">
                        <button type="button" className="asecondary" onClick={() => beginProjectEdit()}>Clear</button>
                        <button className="aprimary" disabled={busy}>{busy ? 'Saving' : editingProjectId ? 'Save project' : 'Create project'}</button>
                      </div>
                    </div>
                  </form>
                </section>
              </div>
            ) : (
              <section className="admin-queue">
                <div className="admin-queue-filters" role="group" aria-label="Filter requests">
                  {[
                    { key: 'pending', label: 'Waiting' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'rejected', label: 'Rejected' },
                    { key: 'all', label: 'All' },
                  ].map(option => (
                    <button
                      key={option.key}
                      type="button"
                      className={requestFilter === option.key ? 'is-on' : ''}
                      onClick={() => setRequestFilter(option.key)}
                    >
                      {option.label}
                      <span>{option.key === 'all' ? submissions.length : requestCounts[option.key] || 0}</span>
                    </button>
                  ))}
                </div>

                {busy && !submissions.length ? <p className="admin-quiet">Loading</p>
                  : visibleRequests.length ? visibleRequests.map(submission => {
                    const expanded = openRequest === submission.id
                    const github = safeExternalUrl(submission.githubProfile)
                    const linkedin = safeExternalUrl(submission.linkedinProfile)
                    return (
                      <article className="admin-request" key={submission.id}>
                        <header>
                          <div className="admin-request-who">
                            <Pill tone={submission.status === 'accepted' ? 'go' : submission.status === 'rejected' ? 'stop' : 'hold'}>{submission.status}</Pill>
                            <h2>{submission.fullName}</h2>
                            <code>{new Date(submission.createdAt).toLocaleDateString()}</code>
                          </div>
                          <p className="admin-request-for">
                            wants to work on <strong>{submission.project || 'Binary Minds Open AI Agent Framework'}</strong>
                          </p>
                          <p className="admin-request-contact">
                            <a href={`mailto:${submission.studentEmail}`}>{submission.studentEmail}</a>
                            {github && <a href={github} target="_blank" rel="noopener noreferrer">GitHub</a>}
                            {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                          </p>
                        </header>

                        {submission.status === 'accepted' && (
                          <p className={`admin-request-email ${submission.emailNotificationStatus === 'sent' ? 'is-sent' : 'is-failed'}`}>
                            {submission.emailNotificationStatus === 'sent'
                              ? 'Acceptance email sent.'
                              : submission.emailNotificationStatus === 'failed'
                                ? `Acceptance email failed. ${submission.emailNotificationError || 'Check the email setup and retry.'}`
                                : 'Acceptance email has not gone out yet.'}
                          </p>
                        )}

                        <button type="button" className="admin-request-more" aria-expanded={expanded} onClick={() => setOpenRequest(expanded ? null : submission.id)}>
                          {expanded ? 'Hide what they wrote' : 'Read what they wrote'}
                        </button>

                        {expanded && (
                          <div className="admin-request-body">
                            <h3>Why they want to contribute</h3>
                            <p>{submission.motivation}</p>
                            <h3>What they would build</h3>
                            <p>{submission.contributionIdea}</p>
                            {submission.attachment && (
                              <button type="button" className="asecondary" disabled={busy} onClick={() => downloadAttachment(submission)}>
                                Download {submission.attachment.fileName} ({(submission.attachment.size / 1024 / 1024).toFixed(1)} MB)
                              </button>
                            )}
                          </div>
                        )}

                        <footer className="admin-request-actions">
                          {submission.status !== 'accepted' && (
                            <button type="button" className="aprimary" disabled={busy} onClick={() => reviewSubmission(submission.id, 'accepted')}>Accept and email them</button>
                          )}
                          {submission.status === 'accepted' && submission.emailNotificationStatus !== 'sent' && (
                            <button type="button" className="asecondary" disabled={busy} onClick={() => reviewSubmission(submission.id, 'accepted')}>Retry the email</button>
                          )}
                          {submission.status !== 'rejected' && (
                            <Confirm onConfirm={() => reviewSubmission(submission.id, 'rejected')} disabled={busy} confirmLabel="Yes, reject">Reject</Confirm>
                          )}
                        </footer>
                      </article>
                    )
                  })
                    : <Empty title={requestFilter === 'pending' ? 'Nothing waiting on you' : 'Nothing here'}>
                      {requestFilter === 'pending' ? 'New contribution requests will show up here.' : 'Try another filter.'}
                    </Empty>}
              </section>
            )}
          </>
        )}

        {view === 'accounts' && (
          <div className="admin-split">
            <section className="admin-finder" aria-label="Accounts">
              <p className="admin-finder-head">{adminUsers.length} with access</p>
              <div className="admin-finder-list">
                {busy && !adminUsers.length ? <p className="admin-quiet">Loading</p> : adminUsers.map(account => (
                  <div className="admin-account" key={account.username}>
                    <span className="admin-finder-text">
                      <strong>{account.username}</strong>
                      <code>{account.role.replaceAll('_', ' ')} · {account.managed ? 'added here' : 'server account'}</code>
                    </span>
                    {account.managed && (
                      <Confirm onConfirm={() => removeAdminUser(account.username)} disabled={busy} confirmLabel="Yes, remove">Remove</Confirm>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-editor" aria-label="Add access">
              <form className="admin-editor-form" onSubmit={addAdminUser}>
                <div className="admin-editor-top">
                  <div className="admin-editor-id"><h2>Give someone access</h2></div>
                </div>
                <div className="aform">
                  <Section title="Account" defaultOpen>
                    <div className="afield-grid">
                      <Field label="Email or username" required htmlFor="acc-name" wide>
                        <TextInput id="acc-name" autoComplete="off" value={newAccount.username} required onChange={event => setNewAccount({ ...newAccount, username: event.target.value })} />
                      </Field>
                      <Field label="Initial password" required htmlFor="acc-pass" wide hint="At least 14 characters. Share it with them securely.">
                        <TextInput id="acc-pass" type="password" autoComplete="new-password" minLength={14} value={newAccount.password} required onChange={event => setNewAccount({ ...newAccount, password: event.target.value })} />
                      </Field>
                    </div>
                  </Section>
                  <Section title="What they can do" defaultOpen>
                    <OptionCards name="Role" value={newAccount.role} options={ADMIN_ROLES} onChange={role => setNewAccount({ ...newAccount, role })} />
                  </Section>
                </div>
                <div className="admin-savebar is-live">
                  <span className="admin-savebar-state">Only a Super Admin can add accounts.</span>
                  <div className="admin-savebar-actions">
                    <button className="aprimary" disabled={busy}>{busy ? 'Adding' : 'Add account'}</button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}

        {view === 'audit' && (
          <section className="admin-log">
            <Search value={auditQuery} onChange={setAuditQuery} placeholder="Find an action or person" count={visibleAudit.length} />
            {busy && !auditEntries.length ? <p className="admin-quiet">Loading</p>
              : visibleAudit.length ? (
                <ol className="admin-log-list">
                  {visibleAudit.map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <code className="admin-log-action">{entry.action}</code>
                      <span className="admin-log-actor">{entry.actor}<small>{entry.role?.replaceAll('_', ' ')}</small></span>
                      <code className="admin-log-target">{entry.contentType ? `${entry.contentType}${entry.documentId ? ` · ${entry.documentId}` : ''}` : 'authentication'}</code>
                      <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
                    </li>
                  ))}
                </ol>
              ) : <p className="admin-quiet">{auditQuery ? 'Nothing matches that.' : 'No activity recorded yet.'}</p>}
          </section>
        )}
      </div>

      <Toasts items={toasts} onDismiss={dismiss} />
    </main>
  )
}
