import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { eventsData } from '../lib/events'
import eventSpecificData from '../lib/eventSpecificData.json'
import { 
  FaCalendarAlt, 
  FaTrophy, 
  FaLightbulb, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaTools,
  FaBookOpen,
  FaPaperPlane,
  FaExternalLinkAlt,
  FaLock,
  FaAward,
  FaUserFriends
} from 'react-icons/fa'
import MagicRings from '../components/MagicRings'
import IdeathonSubmissionModal from '../components/IdeathonSubmissionModal'
import DeadlineMeter from '../components/DeadlineMeter'
import ResultsSection from '../components/ResultsSection'
import { ideathonResults } from '../lib/resultsData'
import './Events.css'

const sectionStyles = [
  {
    gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
    color: '#0ea5e9',
    icon: <FaInfoCircle size={24} />
  },
  {
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#6366f1',
    icon: <FaCalendarAlt size={24} />
  },
  {
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    color: '#10b981',
    icon: <FaTrophy size={24} />
  },
  {
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#f59e0b',
    icon: <FaLightbulb size={24} />
  },
  {
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    color: '#e11d48',
    icon: <FaTools size={24} />
  }
]

const getExternalLink = (url) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

const getEventStatus = (event) => {
  if (event.endDate && new Date(event.endDate).getTime() < Date.now()) return 'Completed'
  return event.status || 'Upcoming'
}

export default function Events() {
  const [events, setEvents] = useState(eventsData)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeView, setActiveView] = useState('details') // 'details' | 'problems'
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/public/content?type=siteEvent')
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (!active || !result?.managed) return
        setEvents((result.documents || []).map(event => ({
          ...event,
          id: event.id || event.slug?.current || event._id,
          image: typeof event.image === 'string' ? event.image : '',
          details: Array.isArray(event.details) ? event.details : [],
        })))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const problemStatements = selectedEvent?.problemStatements || eventSpecificData[selectedEvent?.id] || []

  return (
    <PageTransition className="page events-page">
      <div className="events-container">
        <AnimatePresence mode="wait">
          {!selectedEvent ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="events-grid"
            >
              <h1 className="events-title">
                Our <span className="cs-gradient">Events</span>
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
                {events.map((event) => (
                  <motion.div
                    layoutId={`card-container-${event.id}`}
                    key={event.id}
                    className="event-card-preview"
                    onClick={() => { setSelectedEvent(event); setActiveView('details'); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div layoutId={`card-header-${event.id}`} className="event-header-info">
                      <span className="event-type">{event.type}</span>
                    <span className="event-status">{getEventStatus(event)}</span>
                    </motion.div>
                    <motion.img 
                      layoutId={`card-image-${event.id}`} 
                      src={event.image} 
                      alt={event.title} 
                      className="event-img" 
                    />
                    <motion.h2 layoutId={`card-title-${event.id}`} className="event-preview-title">
                      {event.title}
                    </motion.h2>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="event-detail-view"
              style={{ position: 'relative' }}
            >
              {/* MagicRings Canvas Background Effect on Card Click */}
              <div 
                className="magic-rings-wrapper"
                style={{
                  position: 'absolute',
                  inset: '-40px -60px',
                  zIndex: 0,
                  pointerEvents: 'none',
                  opacity: 0.65,
                  overflow: 'hidden'
                }}
              >
                <MagicRings
                  color="#38bdf8"
                  colorTwo="#a78bfa"
                  ringCount={6}
                  speed={1}
                  attenuation={9}
                  lineThickness={2}
                  baseRadius={0.28}
                  radiusStep={0.11}
                  scaleRate={0.12}
                  opacity={0.8}
                  blur={0}
                  noiseAmount={0.08}
                  rotation={0}
                  ringGap={1.5}
                  fadeIn={0.7}
                  fadeOut={0.5}
                  followMouse={true}
                  mouseInfluence={0.15}
                  hoverScale={1.15}
                  parallax={0.04}
                  clickBurst={true}
                />
              </div>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="back-btn"
                onClick={() => {
                  if (activeView !== 'details') setActiveView('details');
                  else setSelectedEvent(null);
                }}
              >
                &larr; {activeView !== 'details' ? "Back to Details" : "Back to Events"}
              </motion.button>

              <AnimatePresence mode="wait">
                {activeView === 'results' ? (
                  <motion.div
                    key="results-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%' }}
                  >
                    <ResultsSection eventId={selectedEvent.id} />
                  </motion.div>
                ) : (
                  <motion.div key="details-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="event-detail-layout">
                    {/* Left side: Card */}
                    <motion.div layoutId={`card-container-${selectedEvent.id}`} className="event-left-card">
                      <motion.div layoutId={`card-header-${selectedEvent.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="card-type">{selectedEvent.type}</span>
                        <span className="card-status" style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>{getEventStatus(selectedEvent)}</span>
                      </motion.div>
                      <motion.img
                        layoutId={`card-image-${selectedEvent.id}`}
                        src={selectedEvent.image}
                        alt={selectedEvent.title}
                        className="card-img"
                      />
                      <motion.h2 layoutId={`card-title-${selectedEvent.id}`} className="card-title">
                        {selectedEvent.title}
                      </motion.h2>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="card-footer"
                      >
                        {selectedEvent.id === 'ideathon' ? (
                          <button 
                            onClick={() => {
                              setActiveView('results');
                              setTimeout(() => {
                                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                              }, 50);
                            }}
                            className="register-glow-btn"
                            style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                          >
                            <FaTrophy size={14} /> VIEW RESULTS &rarr;
                          </button>
                        ) : selectedEvent.endDate && new Date() < new Date(selectedEvent.endDate) ? (
                          <a href={getExternalLink(selectedEvent.registrationLink)} className="register-glow-btn" target="_blank" rel="noopener noreferrer">
                            REGISTER NOW
                          </a>
                        ) : (
                          <span>{selectedEvent.footerText}</span>
                        )}
                      </motion.div>
                    </motion.div>

                    {/* Right side: Details / Views */}
                    <div className="event-right-details">
                      <AnimatePresence mode="wait">
                        {activeView === 'problems' ? (
                      <motion.div
                        key="problems-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
                      >
                        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem', fontWeight: 800 }}>
                          Problem Statements
                        </h2>
                        {problemStatements.map((point, i) => {
                          const splitIndex = point.text.indexOf(':');
                          const hasBoldPrefix = splitIndex !== -1;
                          
                          return (
                            <div className="problem-statement-card" key={i} style={{
                              background: '#fdfdfd',
                              borderLeft: '4px solid #f59e0b',
                              padding: '1.5rem',
                              borderRadius: '12px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                            }}>
                              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: '#334155', fontWeight: 500 }}>
                                {hasBoldPrefix ? (
                                  <>
                                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.4rem', fontSize: '1.1rem' }}>
                                      {point.text.substring(0, splitIndex + 1)}
                                    </strong>
                                    {point.text.substring(splitIndex + 1)}
                                  </>
                                ) : (
                                  point.text
                                )}
                              </p>
                              {point.url && (
                                <a href={getExternalLink(point.url.link)} target="_blank" rel="noopener noreferrer" className="register-glow-btn" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                                  {point.url.name} &rarr;
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="details-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
                      >
                        {selectedEvent.details.map((detail, idx) => {
                          const style = sectionStyles[idx % sectionStyles.length];
                          const ruleLink = detail.ruleBookLink || (detail.tag === 'INFO' ? selectedEvent.ruleBookLink : null);
                          const subLink = detail.submissionLink || (detail.tag === 'PRESENTATION' ? selectedEvent.submissionLink : null);

                          return (
                          <motion.div
                            key={idx}
                            className="new-detail-card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
                          >
                            <div className="ndc-left-flap" style={{ background: style.gradient }}>
                              <div className="ndc-icon-box" style={{ color: style.color }}>
                                {style.icon}
                              </div>
                            </div>
                            
                            <div className="ndc-right-content">
                              <div className="ndc-dots" />
                              <div className="ndc-watermark" style={{ color: style.color }}>
                                0{idx + 1}
                              </div>

                              <div className="ndc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                  <div className="ndc-tag" style={{ color: style.color }}>
                                    <span className="ndc-tag-dot" style={{ backgroundColor: style.color }}></span>
                                    {detail.tag}
                                  </div>
                                  <h3 className="ndc-title">{detail.sectionTitle}</h3>
                                  <div className="ndc-divider" style={{ backgroundColor: style.color }}></div>
                                </div>

                                {/* Top Right Deadline Meter in Presentation block */}
                                {(detail.isSubmissionSection || detail.tag === 'PRESENTATION') && selectedEvent?.endDate && (
                                  <DeadlineMeter 
                                    endDate={selectedEvent.endDate} 
                                    startDate={selectedEvent.startDate}
                                  />
                                )}
                              </div>

                              <div className="ndc-list">
                                {detail.content.map((item, i) => {
                                  const splitIndex = item.indexOf(':');
                                  const hasBoldPrefix = detail.tag === 'CHALLENGES' && splitIndex !== -1;
                                  
                                  return (
                                  <div className="ndc-list-item" key={`orig-${i}`}>
                                    <div className="ndc-bullet-icon" style={{ color: style.color }}>
                                      {detail.tag === 'PRIZE' ? <FaCheckCircle size={14} /> : (detail.tag === 'PRESENTATION' ? <FaCalendarAlt size={14} /> : (detail.tag === 'INFO' ? <FaInfoCircle size={14} /> : (detail.tag === 'TOOLS' ? <FaTools size={14} /> : <span className="ndc-simple-dot" style={{ backgroundColor: style.color }}></span>)))}
                                    </div>
                                    <div>
                                      <p>
                                        {hasBoldPrefix ? (
                                          <>
                                            <strong>{item.substring(0, splitIndex + 1)}</strong>
                                            {item.substring(splitIndex + 1)}
                                          </>
                                        ) : (
                                          item
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  )
                                })}
                              </div>
                              
                              {/* Card Action Buttons aligned with card theme */}
                              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                {/* RuleBook button on Card 01 (Info) */}
                                {ruleLink && (
                                  <a 
                                    href={getExternalLink(ruleLink)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="card-action-btn" 
                                    style={{ 
                                      padding: '0.55rem 1.3rem', 
                                      fontSize: '0.82rem', 
                                      fontWeight: 800,
                                      background: style.gradient, 
                                      boxShadow: `0 4px 15px ${style.color}50`,
                                      border: 'none',
                                      borderRadius: '999px',
                                      color: '#fff',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      letterSpacing: '0.05em',
                                      textTransform: 'uppercase',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <FaBookOpen size={13} /> RuleBook &rarr;
                                  </a>
                                )}

                                {/* Submit Idea button on Card 02 (Presentation) */}
                                {(detail.isSubmissionSection || detail.tag === 'PRESENTATION') && (
                                  selectedEvent?.endDate && new Date() > new Date(selectedEvent.endDate) ? (
                                    <button 
                                      disabled
                                      className="card-action-btn" 
                                      style={{ 
                                        padding: '0.55rem 1.3rem', 
                                        fontSize: '0.82rem', 
                                        fontWeight: 800,
                                        background: '#475569', 
                                        boxShadow: 'none',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '999px',
                                        color: '#cbd5e1',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        cursor: 'not-allowed',
                                        opacity: 0.75
                                      }}
                                    >
                                      <FaLock size={13} /> Submission Closed
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => setIsSubmissionModalOpen(true)}
                                      className="card-action-btn" 
                                      style={{ 
                                        padding: '0.55rem 1.3rem', 
                                        fontSize: '0.82rem', 
                                        fontWeight: 800,
                                        background: style.gradient, 
                                        boxShadow: `0 4px 15px ${style.color}50`,
                                        border: 'none',
                                        borderRadius: '999px',
                                        color: '#fff',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FaPaperPlane size={13} /> Submit Idea &rarr;
                                    </button>
                                  )
                                )}


                                {/* Problem Statements button on Card 04 (Challenges) */}
                                {detail.tag === 'CHALLENGES' && detail.documentLink && problemStatements.length > 0 && (
                                  <button 
                                    onClick={() => setActiveView('problems')}
                                    className="card-action-btn" 
                                    style={{ 
                                      padding: '0.55rem 1.3rem', 
                                      fontSize: '0.82rem', 
                                      fontWeight: 800,
                                      background: style.gradient, 
                                      boxShadow: `0 4px 15px ${style.color}50`,
                                      border: 'none',
                                      borderRadius: '999px',
                                      color: '#fff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      letterSpacing: '0.05em',
                                      textTransform: 'uppercase',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View Problem Statements &rarr;
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )})}

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>
</div>

      {/* Ideathon Submission Modal Popup */}
      <IdeathonSubmissionModal 
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        isDeadlinePassed={selectedEvent?.endDate ? new Date() > new Date(selectedEvent.endDate) : false}
      />
    </PageTransition>
  )
}
