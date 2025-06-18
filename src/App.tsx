import { useEffect } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { UserProfile } from './components/auth/UserProfile'
import { initializeApp } from './utils/initializeApp'

function App() {
  useEffect(() => {
    // Initialize app configuration on startup
    initializeApp().catch(error => {
      console.error('Failed to initialize app:', error)
    })
  }, [])

  return (
    <AuthProvider>
      <div className="app">
        <ProtectedRoute>
          <div className="app-header">
            <h1>FAMAPP</h1>
            <UserProfile />
          </div>
          <main className="app-main">
            <p>Family Organizer - Coming Soon</p>
            <p>To-Do, Calendar, and Groceries modules will be available soon!</p>
          </main>
        </ProtectedRoute>
      </div>
    </AuthProvider>
  )
}

export default App