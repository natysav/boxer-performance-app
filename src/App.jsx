import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AssessmentPage from './pages/AssessmentPage'
import AcceptInvite from './pages/AcceptInvite'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div> Loading...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/invite/:token" element={
        <AcceptInvite session={session} profile={profile} />
      } />
      <Route path="/auth" element={
        session ? <Navigate to="/" /> : <AuthPage />
      } />
      <Route path="/assessment/:id" element={
        session && profile
          ? <AssessmentPage profile={profile} onLogout={handleLogout} />
          : <Navigate to="/auth" />
      } />
      <Route path="/" element={
        session && profile
          ? <Dashboard profile={profile} onLogout={handleLogout} />
          : <Navigate to="/auth" />
      } />
    </Routes>
  )
}
