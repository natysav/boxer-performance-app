import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard({ profile, onLogout }) {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    initDashboard()
  }, [])

  async function initDashboard() {
    // For boxers, auto-link any assessments matching their email
    if (profile.role === 'boxer') {
      await supabase.rpc('link_boxer_by_email', {
        user_id: profile.id,
        user_email: profile.email
      })
    }
    await loadAssessments()
  }

  async function loadAssessments() {
    const column = profile.role === 'coach' ? 'coach_id' : 'boxer_id'
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq(column, profile.id)
      .order('created_at', { ascending: false })

    if (error || !data) {
      setAssessments([])
      setLoading(false)
      return
    }

    // For coach assessments, load boxer profile names
    if (profile.role === 'coach') {
      const boxerIds = data.filter(a => a.boxer_id).map(a => a.boxer_id)
      if (boxerIds.length > 0) {
        const { data: boxerProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', boxerIds)
        const nameMap = {}
        boxerProfiles?.forEach(p => nameMap[p.id] = p.full_name)
        data.forEach(a => { a._boxer_name = nameMap[a.boxer_id] || a.boxer_email })
      } else {
        data.forEach(a => { a._boxer_name = a.boxer_email })
      }
    }

    // For boxer assessments, load coach names
    if (profile.role === 'boxer') {
      const coachIds = [...new Set(data.map(a => a.coach_id))]
      const { data: coachProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', coachIds)
      const nameMap = {}
      coachProfiles?.forEach(p => nameMap[p.id] = p.full_name)
      data.forEach(a => { a._coach_name = nameMap[a.coach_id] || 'Coach' })
    }

    setAssessments(data)
    setLoading(false)
  }

  async function createInvite(e) {
    e.preventDefault()
    setInviteError('')
    setInviteLoading(true)

    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          coach_id: profile.id,
          boxer_email: inviteEmail,
          status: 'invited'
        })
        .select()
        .single()

      if (error) throw error

      const link = `${window.location.origin}/invite/${data.invite_token}`
      setInviteLink(link)
      loadAssessments()
    } catch (err) {
      setInviteError(err.message)
    }
    setInviteLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
  }

  function statusLabel(s) {
    if (s === 'invited') return 'Awaiting Boxer'
    if (s === 'boxer_done') return 'Boxer Complete'
    if (s === 'complete') return 'Complete'
    return s
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const isCoach = profile.role === 'coach'

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div className="logo">Performance Profile</div>
        <div className="user-info">
          <span className="user-name">{profile.full_name}</span>
          <span className={`role-badge ${profile.role}`}>{profile.role}</span>
          <button className="btn-ghost" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          {isCoach ? 'Your Assessments' : 'My Assessments'}
        </h2>
        {isCoach && (
          <button className="btn btn-primary" onClick={() => { setShowInvite(true); setInviteLink(''); setInviteEmail(''); setInviteError('') }}>
            + New Assessment
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div> Loading...</div>
      ) : assessments.length === 0 ? (
        <div className="empty-state card">
          <h3>{isCoach ? 'No assessments yet' : 'No assessments assigned'}</h3>
          <p>{isCoach
            ? 'Send your first invite to a boxer to get started.'
            : 'Your coach will send you an invite link to complete your self-assessment.'
          }</p>
          {isCoach && (
            <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
              Send First Invite
            </button>
          )}
        </div>
      ) : (
        <div className="assessment-list">
          {assessments.map(a => (
            <div
              key={a.id}
              className="assessment-card"
              onClick={() => {
                if (isCoach && a.status === 'invited') return
                navigate(`/assessment/${a.id}`)
              }}
              style={{ cursor: (isCoach && a.status === 'invited') ? 'default' : 'pointer' }}
            >
              <div className="assessment-info">
                <h3>{isCoach ? a._boxer_name : `Coach: ${a._coach_name}`}</h3>
                <div className="assessment-meta">
                  <span>{formatDate(a.created_at)}</span>
                  <span className={`status-tag status-${a.status}`}>{statusLabel(a.status)}</span>
                </div>
              </div>
              <div>
                {isCoach && a.status === 'invited' && (
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = `${window.location.origin}/invite/${a.invite_token}`
                      navigator.clipboard.writeText(link)
                    }}
                  >
                    Copy Invite Link
                  </button>
                )}
                {isCoach && a.status === 'boxer_done' && (
                  <button className="btn btn-small btn-coach" onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${a.id}`) }}>
                    Do Your Assessment
                  </button>
                )}
                {a.status === 'complete' && (
                  <button className="btn btn-small btn-secondary" onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${a.id}`) }}>
                    View Results
                  </button>
                )}
                {!isCoach && a.status === 'invited' && (
                  <button className="btn btn-small btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${a.id}`) }}>
                    Start Assessment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Assessment</h2>

            {!inviteLink ? (
              <form onSubmit={createInvite}>
                {inviteError && <div className="error-msg">{inviteError}</div>}
                <div className="form-group">
                  <label className="form-label">Boxer's Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="boxer@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                  We'll generate a link you can send to your boxer. They'll create an account (if needed) and complete their self-assessment.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" disabled={inviteLoading}>
                    {inviteLoading ? 'Creating...' : 'Create Invite'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="success-msg">Invite created! Share this link with your boxer:</div>
                <div className="invite-link-box">
                  <input
                    className="input"
                    value={inviteLink}
                    readOnly
                    onClick={e => e.target.select()}
                  />
                  <button className="btn btn-small btn-primary copy-btn" onClick={copyLink}>
                    Copy
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 12 }}>
                  Send this link to your boxer via text, email, or WhatsApp. They'll be prompted to sign up and complete their self-assessment.
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 16 }}
                  onClick={() => setShowInvite(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
