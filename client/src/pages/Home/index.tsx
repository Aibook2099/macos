import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Welcome to AI Personality Simulation
        </h1>
        <p className={styles.subtitle}>
          Experience unique conversations with AI personalities crafted just for you
        </p>
        <Link to="/chat" className={styles.cta}>
          Start Chatting
        </Link>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className={styles.grid}>
          <div className={styles.feature}>
            <h3>Unique Personalities</h3>
            <p>Each AI has its own character, background, and conversation style</p>
          </div>
          <div className={styles.feature}>
            <h3>Natural Conversations</h3>
            <p>Engage in fluid, context-aware dialogues that feel natural</p>
          </div>
          <div className={styles.feature}>
            <h3>Customization</h3>
            <p>Create and customize AI personalities to match your preferences</p>
          </div>
          <div className={styles.feature}>
            <h3>Memory & Learning</h3>
            <p>AIs remember past conversations and adapt to your interaction style</p>
          </div>
        </div>
      </section>
    </div>
  )
} 