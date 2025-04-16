import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { RoleProvider } from './RoleContext'
import { ChatProvider } from './ChatContext'

interface AppProviderProps {
  children: ReactNode
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <RoleProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </RoleProvider>
    </AuthProvider>
  )
} 