import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const SITE = {
  name: import.meta.env.VITE_SITE_NAME || 'Binary Minds',
  logoPath: import.meta.env.VITE_SITE_LOGO || '/logo.png',
}

export default function Navbar() {
  const location = useLocation()
  const [imgError, setImgError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/minds', label: 'Minds' },
    { to: '/events', label: 'Events' },
    { to: '/build-in-public', label: 'Build in Public' },
  ]

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, x: "-50%" }}
      animate={{ y: 0, x: "-50%" }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar-container">
        <div className="nav-logo">
          <a href="https://kaziranga.iitmbs.org/" target="_blank" rel="noopener noreferrer" className="cursor-target" style={{ display: 'flex', alignItems: 'center' }}>
            {!imgError ? (
              <img
                src={SITE.logoPath}
                alt={`${SITE.name} logo`}
                className="nav-logo-img"
                onError={() => setImgError(true)}
                style={{ borderRadius: '0', border: 'none', background: 'transparent', objectFit: 'contain', boxShadow: 'none' }}
              />
            ) : (
              <div className="nav-logo-icon">BM</div>
            )}
          </a>
          <div className="nav-divider" style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 0.25rem' }} />
          <Link to="/" className="cursor-target" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <span className="nav-logo-text">{SITE.name}</span>
          </Link>
        </div>

        <div className="nav-links desktop-only">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link cursor-target${location.pathname === item.to ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          <motion.button
            className="nav-join-btn cursor-target"
            onClick={() => window.open('https://forms.gle/9o3EBp7mH5Hq6BpGA', '_blank')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#fff',
              border: 'none',
              color: '#000',
              fontWeight: '600',
              padding: '0.6rem 1.5rem',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              boxShadow: '0 4px 14px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="nav-join-text">Join Now</span>
          </motion.button>
        </div>

        <button className="mobile-menu-btn cursor-target" onClick={() => setIsOpen(!isOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link ${location.pathname === item.to ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                className="mobile-join-btn cursor-target"
                onClick={() => {
                  setIsOpen(false);
                  window.open('https://forms.gle/9o3EBp7mH5Hq6BpGA', '_blank');
                }}
                style={{
                  background: '#fff',
                  border: 'none',
                  color: '#000',
                  fontWeight: '600',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  width: '100%'
                }}
              >
                Join Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
