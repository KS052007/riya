import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Extracts heading blocks from Sanity Portable Text body data.
 * Returns an array of { key, text, style } for h1, h2, h3 blocks.
 */
function extractHeadings(body) {
  if (!body || !Array.isArray(body)) return []
  return body
    .filter(block => block._type === 'block' && ['h1', 'h2'].includes(block.style))
    .map(block => ({
      key: block._key,
      text: block.children?.map(c => c.text).join('') || '',
      style: block.style,
    }))
}

export default function MindMinimap({ body }) {
  const headings = extractHeadings(body)
  const [activeId, setActiveId] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const observerRef = useRef(null)
  const popoverRef = useRef(null)

  // Observe heading elements to highlight the active one
  useEffect(() => {
    if (headings.length === 0) return

    const handleIntersect = (entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length > 0) {
        setActiveId(visible[0].target.id)
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0.1,
    })

    headings.forEach(h => {
      const el = document.getElementById(`heading-${h.key}`)
      if (el) observerRef.current.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [headings])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsExpanded(false)
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded])

  const handleClick = useCallback((key) => {
    const el = document.getElementById(`heading-${key}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsExpanded(false)
    }
  }, [])

  if (headings.length === 0) return null

  return (
    <div className="mind-minimap" ref={popoverRef}>
      {/* Dashes trigger */}
      <div 
        className="mind-minimap-trigger cursor-target" 
        onClick={() => setIsExpanded(!isExpanded)}
        title="Table of Contents"
      >
        <div className="mind-minimap-dash" />
        <div className="mind-minimap-dash" />
        <div className="mind-minimap-dash" />
        <div className="mind-minimap-dash" />
        <div className="mind-minimap-dash" />
        <div className="mind-minimap-dash" />
      </div>

      {/* Expanded Popover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mind-minimap-popover"
            data-lenis-prevent="true"
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mind-minimap-popover-header">
              CONTENTS
            </div>
            <div className="mind-minimap-popover-list">
              {headings.map((h, i) => {
                const isActive = activeId === `heading-${h.key}`
                return (
                  <div
                    key={h.key}
                    className={`mind-minimap-popover-item ${h.style} ${isActive ? 'active' : ''}`}
                    onClick={() => handleClick(h.key)}
                  >
                    {h.text}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
