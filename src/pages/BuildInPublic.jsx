import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import './BuildInPublic.css'

const milestones = [
  { number: '01', title: 'Ideas in progress', detail: 'What we are exploring and why it matters.' },
  { number: '02', title: 'Work in the open', detail: 'Small updates from the people building it.' },
  { number: '03', title: 'Lessons learned', detail: 'Honest notes on what worked and what did not.' },
]

export default function BuildInPublic() {
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
            <div className="build-public-status"><span /> Coming soon</div>
            <p className="build-public-eyebrow">Binary Minds · Open process</p>
            <h1>Build in <span>Public.</span></h1>
            <p className="build-public-intro">
              We are making room to share the work behind the work: ideas taking shape,
              experiments, and the lessons we pick up along the way.
            </p>
            <div className="build-public-actions">
              <Link to="/minds" className="build-public-primary">Meet the Minds</Link>
              <Link to="/events" className="build-public-secondary">Explore our events <span aria-hidden="true">↗</span></Link>
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
              <span>IN DEVELOPMENT</span>
              <strong>A clearer look at how ideas become things.</strong>
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
      </main>
    </PageTransition>
  )
}
