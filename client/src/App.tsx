import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from '@/components/Layout'

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'))
const Chat = lazy(() => import('@/pages/Chat'))
const Profile = lazy(() => import('@/pages/Profile'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
