import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AcceptInvite({ session, profile }) {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    handleInvite()
  }, [session, profile])

  async function handleInvite() {
    // If not logged in, redirect to auth with return URL
    if (!session) {
      navigate(`/auth?redirect=/invite/${token}`)
      return
    }

    if (!profile) return // still loading profile

    try {
      // Find the assessment by token
      const { data: assessment, error: fetchErr } = await supabase
        .from('assessments')
        .select('*')
        .eq('invite_token', token)
        .single()

      if (fetchErr || !assessment) {
        setError('This invite link is invalid or has expired.')
        setStatus('error')
        return
      }

      // Check if already linked
      if (assessment.boxer_id === profile.id) {
        navigate(`/assessment/${assessment.id}`)
        return
      }

      // Check if someone else already accepted
      if (assessment.boxer_id && assessment.boxer_id !== profile.id) {
        setError('This invite has already been accepted by another boxer.')
        setStatus('error')
        return
      }

      // Link this boxer to the assessment
      const { error: updateErr } = await supabase
        .from('assessments')
        .update({ boxer_id: profile.id })
        .eq('id', assessment.id)

      if (updateErr) throw updateErr

      navigate(`/assessment/${assessment.id}`)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title">Invite Error</h1>
          <div className="error-msg">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="spinner"></div> Accepting invite...
    </div>
  )
}
