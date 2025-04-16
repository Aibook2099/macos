import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test User')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks
    localStorage.clear()
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('should initialize with no user and not authenticated', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: '2024-01-01',
      subscription: 'free' as const,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: mockUser,
        token: 'test-token',
      }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Click login button
    act(() => {
      screen.getByText('Login').click()
    })

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    // Check if token was stored
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
  })

  it('should handle login error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Login failed' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Click login button
    act(() => {
      screen.getByText('Login').click()
    })

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: '2024-01-01',
      subscription: 'free' as const,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: mockUser,
        token: 'test-token',
      }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Click register button
    act(() => {
      screen.getByText('Register').click()
    })

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    // Check if token was stored
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
  })

  it('should handle registration error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Registration failed' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Click register button
    act(() => {
      screen.getByText('Register').click()
    })

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: '2024-01-01',
      subscription: 'free' as const,
    }

    // First login
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: mockUser,
        token: 'test-token',
      }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Login
    act(() => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    // Mock logout response
    mockFetch.mockResolvedValueOnce({
      ok: true,
    })

    // Logout
    act(() => {
      screen.getByText('Logout').click()
    })

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    // Check if token was removed
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
  })
}) 