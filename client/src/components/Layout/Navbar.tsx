import { NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        AI Personality
      </div>
      <div className={styles.links}>
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            isActive ? styles.activeLink : styles.link
          }
        >
          Home
        </NavLink>
        <NavLink 
          to="/chat" 
          className={({ isActive }) => 
            isActive ? styles.activeLink : styles.link
          }
        >
          Chat
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            isActive ? styles.activeLink : styles.link
          }
        >
          Profile
        </NavLink>
      </div>
    </nav>
  )
} 