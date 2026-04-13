import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES, ALL_SKILLS } from '../lib/skills'
import RadarChart from '../components/RadarChart'

export default function AssessmentPage({ profile, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [boxerRatings, setBoxerRatings] = useState({})
  const [coachRatings, setCoachRatings] = useState({})
  const [otherName, setOtherName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isCoach = profile.role === 'coach'
  const isComplete = assessment?.status === 'complete'
  const isBoxerPhase = !isCoach && assessment?.status === 'invited'
  const isCoachPhase = isCoach && assessment?.status === 'boxer_done'

  useEffect(() => {
    loadAssessment()
  }, [id])

  async function loadAssessment() {
    const { data: assess } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single()

    if (!assess) { navigate('/'); return }
    setAssessment(assess)

    // Load the other person's name
    const otherId = isCoach ? assess.boxer_id : assess.coach_id
    if (otherId) {
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherId)
        .single()
      setOtherName(otherProfile?.full_name || '')
    }

    // Load existing ratings
    const { data: ratings } = await supabase
      .from('ratings')
      .select('*')
      .eq('assessment_id', id)

    const br = {}, cr = {}
    ALL_SKILLS.forEach(s => { br[s] = 0; cr[s] = 0 })
    ratings?.forEach(r => {
      br[r.skill] = r.boxer_score || 0
      cr[r.skill] = r.coach_score || 0
    })
    setBoxerRatings(br)
    setCoachRatings(cr)
    setLoading(false)
  }

  function setRating(skill, value, who) {
    if (who === 'boxer') {
      setBoxerRatings(prev => ({ ...prev, [skill]: prev[skill] === value ? 0 : value }))
    } else {
      setCoachRatings(prev => ({ ...prev, [skill]: prev[skill] === value ? 0 : value }))
    }
    setSaved(false)
  }

  async function saveRatings(submit = false) {
    setSaving(true)

    // Delete existing ratings and re-insert
    await supabase.from('ratings').delete().eq('assessment_id', id)

    const rows = ALL_SKILLS.map(skill => ({
      assessment_id: id,
      skill,
      boxer_score: boxerRatings[skill] || 0,
      coach_score: coachRatings[skill] || 0
    }))

    await supabase.from('ratings').insert(rows)

    if (submit) {
      const updates = {}
      if (!isCoach) {
        updates.status = 'boxer_done'
        updates.boxer_completed_at = new Date().toISOString()
      } else {
        updates.status = 'complete'
        updates.coach_completed_at = new Date().toISOString()
      }
      await supabase.from('assessments').update(updates).eq('id', id)
      navigate('/')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  function avg(ratings) {
    const vals = Object.values(ratings).filter(v => v > 0)
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : '0.0'
  }

  // Can this user edit?
  const canEditBoxer = !isCoach && (assessment?.status === 'invited')
  const canEditCoach = isCoach && (assessment?.status === 'boxer_done')

  if (loading) {
    return <div className="loading" style={{ minHeight: '100vh' }}><div className="spinner"></div> Loading...</div>
  }

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

      <button className="back-link" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>
            {isCoach ? `Assessment: ${otherName}` : `Self-Assessment`}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
            {isCoach ? (isCoachPhase ? 'Rate this boxer\'s skills' : isComplete ? 'Completed assessment' : 'Waiting for boxer') :
              (canEditBoxer ? 'Rate yourself on each skill from 1 to 5' : isComplete ? 'Completed assessment' : 'Submitted — waiting for coach')}
          </p>
        </div>
        <span className={`status-tag status-${assessment.status}`} style={{ fontSize: '0.75rem' }}>
          {assessment.status === 'invited' ? 'Boxer Phase' : assessment.status === 'boxer_done' ? 'Coach Phase' : 'Complete'}
        </span>
      </div>

      <div className="assessment-layout">
        {/* Skills panel */}
        <div className="skills-panel">
          {Object.entries(CATEGORIES).map(([cat, skills], ci) => (
            <div key={cat}>
              <div className="category-title" style={ci > 0 ? { marginTop: 14 } : {}}>
                {cat}
              </div>
              {(isComplete || isCoachPhase) && (
                <div className="skill-header">
                  <div className="col-label coach-col">Coach</div>
                  <div></div>
                  <div className="col-label boxer-col">Boxer</div>
                </div>
              )}
              {skills.map(skill => (
                <div key={skill} className="skill-row">
                  {/* Coach dots - only show when both sides visible */}
                  {(isComplete || isCoachPhase) && (
                    <div className="rating-dots reversed">
                      {[1,2,3,4,5].map(i => (
                        <button
                          key={i}
                          className={`dot coach-dot ${coachRatings[skill] >= i ? 'active' : ''} ${!canEditCoach ? 'disabled' : ''}`}
                          onClick={() => canEditCoach && setRating(skill, i, 'coach')}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="skill-label">{skill}</div>

                  {/* Boxer dots */}
                  <div className="rating-dots">
                    {[1,2,3,4,5].map(i => (
                      <button
                        key={i}
                        className={`dot boxer-dot ${boxerRatings[skill] >= i ? 'active' : ''} ${!canEditBoxer ? 'disabled' : ''}`}
                        onClick={() => canEditBoxer && setRating(skill, i, 'boxer')}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Chart panel */}
        <div className="chart-panel">
          <div className="avg-badges">
            {(isComplete || isCoachPhase) && (
              <div className="avg-badge coach">
                <div className="number">{avg(coachRatings)}</div>
                <div className="label">Coach</div>
              </div>
            )}
            <div className="avg-badge boxer">
              <div className="number">{avg(boxerRatings)}</div>
              <div className="label">Boxer</div>
            </div>
          </div>

          <RadarChart boxerRatings={boxerRatings} coachRatings={(isComplete || isCoachPhase) ? coachRatings : {}} />

          <div className="legend">
            {(isComplete || isCoachPhase) && (
              <div className="legend-item">
                <div className="legend-swatch" style={{ background: 'var(--coach)' }}></div> Coach
              </div>
            )}
            <div className="legend-item">
              <div className="legend-swatch" style={{ background: 'var(--accent)' }}></div> Boxer
            </div>
          </div>

          {/* Action buttons */}
          {(canEditBoxer || canEditCoach) && (
            <div className="assessment-actions">
              <button className="btn btn-secondary" onClick={() => saveRatings(false)} disabled={saving}>
                {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Draft'}
              </button>
              <button className="btn btn-primary" onClick={() => {
                if (confirm('Submit your assessment? You won\'t be able to edit after submitting.')) {
                  saveRatings(true)
                }
              }} disabled={saving}>
                Submit Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
