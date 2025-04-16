import { useState } from 'react'
import styles from './Profile.module.css'

interface UserPreferences {
  theme: 'light' | 'dark'
  notifications: boolean
  language: string
}

export default function Profile() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    notifications: true,
    language: 'en'
  })

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setPreferences(prev => ({ ...prev, theme }))
  }

  const handleNotificationsChange = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, notifications: enabled }))
  }

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPreferences(prev => ({ ...prev, language: event.target.value }))
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profile Settings</h1>
      
      <section className={styles.section}>
        <h2>Theme</h2>
        <div className={styles.themeButtons}>
          <button
            className={`${styles.themeButton} ${preferences.theme === 'light' ? styles.active : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            Light
          </button>
          <button
            className={`${styles.themeButton} ${preferences.theme === 'dark' ? styles.active : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            Dark
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Notifications</h2>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={(e) => handleNotificationsChange(e.target.checked)}
          />
          <span className={styles.slider}></span>
        </label>
      </section>

      <section className={styles.section}>
        <h2>Language</h2>
        <select
          className={styles.select}
          value={preferences.language}
          onChange={handleLanguageChange}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
        </select>
      </section>

      <section className={styles.section}>
        <h2>Account Information</h2>
        <div className={styles.info}>
          <p><strong>Email:</strong> user@example.com</p>
          <p><strong>Member Since:</strong> January 1, 2024</p>
          <p><strong>Subscription:</strong> Premium</p>
        </div>
      </section>
    </div>
  )
} 