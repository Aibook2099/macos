import { createContext, useContext, useState } from 'react'

interface RoleContextType {
  selectedRole: string | null
  setSelectedRole: (role: string | null) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [selectedRole, setSelectedRole] = useState<string | null>('user')
  return (
    <RoleContext.Provider value={{ selectedRole, setSelectedRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
} 