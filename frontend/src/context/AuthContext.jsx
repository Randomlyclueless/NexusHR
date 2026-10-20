
import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('nexushr_token')
    const email = sessionStorage.getItem('nexushr_email')
    const role = sessionStorage.getItem('nexushr_role')

    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      return { email, role }
    }

    return null
  })

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { token, email: accountEmail, role } = response.data

    sessionStorage.setItem('nexushr_token', token)
    sessionStorage.setItem('nexushr_email', accountEmail)
    sessionStorage.setItem('nexushr_role', role)

    api.defaults.headers.common.Authorization = `Bearer ${token}`
    setUser({ email: accountEmail, role })
  }

  function logout() {
    sessionStorage.removeItem('nexushr_token')
    sessionStorage.removeItem('nexushr_email')
    sessionStorage.removeItem('nexushr_role')

    delete api.defaults.headers.common.Authorization
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
