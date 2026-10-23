import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { InteractiveGridPattern } from '../components/InteractiveGridPattern'
import FuzzyText from '../components/FuzzyText'

export default function NotFound() {
  return (
    <PageTransition className="page not-found-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: '-30% 0',
          height: '200%',
          width: '100%',
          transform: 'skewY(-6deg)',
          WebkitMaskImage: 'radial-gradient(500px circle at center, white, transparent)',
          maskImage: 'radial-gradient(500px circle at center, white, transparent)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <InteractiveGridPattern width={40} height={40} className="grid-bg" />
      </div>

      <div
        className="not-found-container"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '6rem 2rem 4rem',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.6}
            enableHover={true}
            fontSize="clamp(5rem, 18vw, 12rem)"
            fontWeight={900}
            fontFamily="'Space Grotesk', sans-serif"
            gradient={['#38bdf8', '#a78bfa', '#f472b6']}
            clickEffect={true}
            glitchMode={true}
            glitchInterval={3000}
            glitchDuration={200}
            fuzzRange={35}
          >
            404
          </FuzzyText>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              color: '#ffffff',
              marginTop: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Lost in Binary Space
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              color: 'var(--muted)',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
              maxWidth: '480px',
              marginTop: '0.75rem',
              lineHeight: 1.6,
            }}
          >
            The memory address you are looking for has been dereferenced or moved to another dimension.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ marginTop: '2.5rem' }}
          >
            <Link
              to="/"
              className="btn-primary interactive cursor-target"
              style={{ background: '#ffffff', color: '#000000', borderRadius: '6px' }}
            >
              Back to Home
            </Link>
            <Link
              to="/minds"
              className="btn-secondary interactive cursor-target"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              Explore Minds
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
