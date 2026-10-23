import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaCrown, FaTrophy, FaUserFriends, FaUser, FaLightbulb, FaAward } from 'react-icons/fa'
import './ResultsSection.css'

export default function ResultsSection({ eventId = "ideathon" }) {
  const [eventResults, setEventResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/public/content?type=siteResult')
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (!active) return
        const record = result?.documents?.find(item => item.eventId === eventId)
        setEventResults(record || null)
      })
      .catch(() => setEventResults(null))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [eventId])

  if (loading) return <section id="results" className="ideathon-results-hero"><div className="results-main-container"><p>Loading verified results…</p></div></section>
  if (!eventResults) return <section id="results" className="ideathon-results-hero"><div className="results-main-container"><h2>Results are not published yet</h2><p>Check back when the event organizers publish verified results.</p></div></section>
  const { 
    eyebrow = "IDEATHON 2026", 
    title = "Winners & Results", 
    top3 = [], 
    honorableMentions = [] 
  } = eventResults

  const firstPlace = top3?.find(item => item?.rank === 1) || top3[0] || {}
  const secondPlace = top3?.find(item => item?.rank === 2) || top3[1] || {}
  const thirdPlace = top3?.find(item => item?.rank === 3) || top3[2] || {}

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const plateVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 75,
        damping: 15
      }
    }
  }

  const getFirstName = (name) => {
    if (!name) return ""
    return name.trim().split(' ')[0]
  }

  return (
    <section id="results" className="ideathon-results-hero">
      <div className="results-main-container">
        {/* Section Header */}
        <motion.div 
          className="results-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="results-eyebrow-pill">
            <FaTrophy className="eyebrow-icon" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="results-hero-title">{title}</h2>
        </motion.div>

        {/* DESKTOP 3D NEON OVAL PODIUM STAGE (PC VIEW ONLY) */}
        <motion.div 
          className="podium-hero-stage desktop-podium-stage"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* 2ND PLACE (LEFT) */}
          <motion.div className="podium-plate-wrapper plate-2nd" variants={plateVariants}>
            <div className="plate-card-content">
              <div className="rank-badge rank-badge-2nd">
                <span className="rank-emoji">{secondPlace?.badgeIcon || "🥈"}</span>
                <span className="rank-text">{secondPlace?.rankTitle || "2nd Place"}</span>
              </div>
              <h3 className="plate-team-name">{secondPlace?.teamName || "To Be Announced"}</h3>
              {secondPlace?.projectTitle && (
                <p className="plate-project-title">
                  <FaLightbulb className="icon-bulb" />
                  {secondPlace.projectTitle}
                </p>
              )}
              {secondPlace?.description && (
                <p className="plate-desc">{secondPlace.description}</p>
              )}
              {Array.isArray(secondPlace?.members) && secondPlace.members.length > 0 && (
                <p className="plate-members">{secondPlace.members.join(" • ")}</p>
              )}
            </div>
            <div className="glowing-oval-plate">
              <div className="oval-glow-ring top-rim" />
              <div className="oval-glass-surface" />
              <div className="oval-glow-ring bottom-rim" />
              <div className="oval-ground-bloom" />
            </div>
          </motion.div>

          {/* 1ST PLACE (CENTER WINNER - ELEVATED) */}
          <motion.div className="podium-plate-wrapper plate-1st" variants={plateVariants}>
            <div className="plate-card-content content-1st">
              <div className="crown-header">
                <FaCrown size={20} className="gold-crown-icon" />
              </div>
              <div className="rank-badge rank-badge-1st">
                <span className="rank-emoji">{firstPlace?.badgeIcon || "🥇"}</span>
                <span className="rank-text">{firstPlace?.rankTitle || "1st Place"}</span>
              </div>
              <h3 className="plate-team-name name-1st">{firstPlace?.teamName || "To Be Announced"}</h3>
              {firstPlace?.projectTitle && (
                <p className="plate-project-title title-1st">
                  <FaLightbulb className="icon-bulb gold-bulb" />
                  {firstPlace.projectTitle}
                </p>
              )}
              {firstPlace?.description && (
                <p className="plate-desc-1st">{firstPlace.description}</p>
              )}
              {Array.isArray(firstPlace?.members) && firstPlace.members.length > 0 && (
                <p className="plate-members members-1st">{firstPlace.members.join(" • ")}</p>
              )}
            </div>
            <div className="glowing-oval-plate plate-large">
              <div className="oval-glow-ring top-rim rim-gold" />
              <div className="oval-glass-surface surface-1st" />
              <div className="oval-glow-ring bottom-rim rim-gold" />
              <div className="oval-ground-bloom bloom-gold" />
            </div>
          </motion.div>

          {/* 3RD PLACE (RIGHT) */}
          <motion.div className="podium-plate-wrapper plate-3rd" variants={plateVariants}>
            <div className="plate-card-content">
              <div className="rank-badge rank-badge-3rd">
                <span className="rank-emoji">{thirdPlace?.badgeIcon || "🥉"}</span>
                <span className="rank-text">{thirdPlace?.rankTitle || "3rd Place"}</span>
              </div>
              <h3 className="plate-team-name">{thirdPlace?.teamName || "To Be Announced"}</h3>
              {thirdPlace?.projectTitle && (
                <p className="plate-project-title">
                  <FaLightbulb className="icon-bulb" />
                  {thirdPlace.projectTitle}
                </p>
              )}
              {thirdPlace?.description && (
                <p className="plate-desc">{thirdPlace.description}</p>
              )}
              {Array.isArray(thirdPlace?.members) && thirdPlace.members.length > 0 && (
                <p className="plate-members">{thirdPlace.members.join(" • ")}</p>
              )}
            </div>
            <div className="glowing-oval-plate">
              <div className="oval-glow-ring top-rim" />
              <div className="oval-glass-surface" />
              <div className="oval-glow-ring bottom-rim" />
              <div className="oval-ground-bloom" />
            </div>
          </motion.div>
        </motion.div>

        {/* DESKTOP HONORABLE MENTIONS (PC VIEW ONLY) */}
        {Array.isArray(honorableMentions) && honorableMentions.length > 0 && (
          <motion.div 
            className="honorable-section desktop-honorable-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="hm-header">
              <FaAward className="hm-award-icon" />
              <h3 className="hm-heading">Honorable Mentions</h3>
            </div>

            <div className="hm-grid-layout">
              {honorableMentions.map((hm, idx) => {
                if (!hm) return null
                return (
                  <motion.div 
                    key={hm.id || `hm-${idx}`}
                    className="hm-simple-card"
                    whileHover={{ y: -4, borderColor: "rgba(168, 85, 247, 0.4)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="hm-card-top">
                      <FaUserFriends className="hm-team-icon" />
                      <h4 className="hm-team-name">{hm.teamName || "Team"}</h4>
                    </div>
                    {hm.projectTitle && <p className="hm-project-name">{hm.projectTitle}</p>}
                    {hm.description && <p className="hm-desc">{hm.description}</p>}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* MOBILE LEADERBOARD PODIUM (MATCHING ATTACHED REFERENCE IMAGE - MOBILE VIEW ONLY) */}
        <div className="mobile-leaderboard-container">
          {/* Top 3-Pillar Podium Graphic */}
          <div className="mobile-podium-pillars">
            {/* 2nd Place Pillar */}
            <div className="mobile-pillar-item pillar-2nd">
              <div className="pillar-avatar-circle circle-2nd">
                <FaUser className="avatar-icon" />
                <span className="avatar-rank-sub">2</span>
              </div>
              <span className="pillar-team-label">{getFirstName(secondPlace?.teamName) || "TBA"}</span>
              <div className="pillar-block block-2nd">
                <span className="pillar-num">2</span>
              </div>
            </div>

            {/* 1st Place Pillar (Center - Tallest with Crown) */}
            <div className="mobile-pillar-item pillar-1st">
              <div className="crown-above-avatar">
                <FaCrown size={22} color="#fbbf24" />
              </div>
              <div className="pillar-avatar-circle circle-1st">
                <FaUser className="avatar-icon gold-avatar" />
                <span className="avatar-rank-sub gold-sub">1</span>
              </div>
              <span className="pillar-team-label team-gold">{getFirstName(firstPlace?.teamName) || "TBA"}</span>
              <div className="pillar-block block-1st">
                <span className="pillar-num">1</span>
              </div>
            </div>

            {/* 3rd Place Pillar */}
            <div className="mobile-pillar-item pillar-3rd">
              <div className="pillar-avatar-circle circle-3rd">
                <FaUser className="avatar-icon" />
                <span className="avatar-rank-sub">3</span>
              </div>
              <span className="pillar-team-label">{getFirstName(thirdPlace?.teamName) || "TBA"}</span>
              <div className="pillar-block block-3rd">
                <span className="pillar-num">3</span>
              </div>
            </div>
          </div>

          {/* Rounded Leaderboard List Container (Honorable Mentions Only) */}
          {Array.isArray(honorableMentions) && honorableMentions.length > 0 && (
            <div className="mobile-leaderboard-card">
              <div className="leaderboard-handle-bar" />
              <div className="mobile-hm-card-title">
                <FaAward className="hm-award-icon" />
                <span>Honorable Mentions</span>
              </div>
              
              {/* Honorable Mentions Rows Only */}
              {honorableMentions.map((hm, idx) => {
                if (!hm) return null
                return (
                  <div key={hm.id || `hm-${idx}`} className="leaderboard-row row-hm">
                    <div className="row-left">
                      <div className="row-avatar-small hm-avatar">
                        <FaUser size={14} />
                      </div>
                      <div className="row-text">
                        <span className="row-team-name">{hm.teamName || "Team"}</span>
                        {hm.projectTitle && <span className="row-project-title">{hm.projectTitle}</span>}
                        {hm.description && <span className="row-desc">{hm.description}</span>}
                      </div>
                    </div>
                    <span className="row-hm-tag">{hm.tag || "Honorable"}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
