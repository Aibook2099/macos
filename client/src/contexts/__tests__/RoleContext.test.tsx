import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleProvider, useRole } from '../RoleContext'
import { act } from 'react-dom/test-utils'

describe('RoleContext', () => {
  const TestComponent = () => {
    const { selectedRole, setSelectedRole } = useRole()
    return (
      <div>
        <div data-testid="role">{selectedRole}</div>
        <button onClick={() => setSelectedRole('assistant')}>Change Role</button>
      </div>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide default role', () => {
    render(
      <RoleProvider>
        <TestComponent />
      </RoleProvider>
    )

    expect(screen.getByTestId('role')).toHaveTextContent('user')
  })

  it('should allow changing role', () => {
    render(
      <RoleProvider>
        <TestComponent />
      </RoleProvider>
    )

    act(() => {
      screen.getByText('Change Role').click()
    })

    expect(screen.getByTestId('role')).toHaveTextContent('assistant')
  })
}) 