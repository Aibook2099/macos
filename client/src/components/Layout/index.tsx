import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
} 