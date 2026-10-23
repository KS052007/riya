import { forwardRef } from 'react'
import { motion } from 'framer-motion'

// Smooth ease for the circular wipe
const smoothEase = [0.65, 0, 0.35, 1]

const overlayVariants = {
  initial: { 
    clipPath: 'circle(150% at 50% 50%)' 
  },
  animate: { 
    clipPath: 'circle(0% at 50% 50%)', 
    transition: { duration: 0.8, delay: 0.1, ease: smoothEase } 
  },
  exit: { 
    clipPath: 'circle(150% at 50% 50%)', 
    transition: { duration: 0.8, ease: smoothEase } 
  }
}

const contentVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.6, delay: 0.4, ease: smoothEase } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { duration: 0.6, ease: smoothEase } 
  }
}

const PageTransition = forwardRef(({ children, className, style }, ref) => {
  return (
    <>
      <motion.main
        ref={ref}
        className={className}
        style={style}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={contentVariants}
      >
        {children}
      </motion.main>

      {/* Smooth Gradient Overlay */}
      <motion.div
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #1e0b2d 0%, #0f172a 50%, #061e2a 100%)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      />
    </>
  )
})

PageTransition.displayName = 'PageTransition'
export default PageTransition
