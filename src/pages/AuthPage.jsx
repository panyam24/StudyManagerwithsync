import { useState } from 'react'
import { useAuthStore } from '../store'

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
)

const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
  borderRadius: '8px', padding: '10px 12px', fontFamily: 'DM Sans', fontSize: '14px',
  outline: 'none', transition: 'border-color 0.2s', width: '100%',
}

function PasswordInput({ value, onChange, placeholder = '••••••••', label, minLength = 6 }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          minLength={minLength}
          style={{ ...inputStyle, paddingRight: '40px' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', padding: '2px' }}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

function StrengthBar({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#f97066', '#f5a524', '#60a5fa', '#34d8a2']
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= score - 1 ? colors[score - 1] : 'var(--border)', transition: 'background 0.2s' }} />
        ))}
      </div>
      {password.length > 0 && (
        <div style={{ fontSize: '11px', color: colors[score - 1] || 'var(--text2)' }}>
          {score > 0 ? labels[score - 1] : 'Too short'}
        </div>
      )}
    </div>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', token: '', newPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('') // shown in UI (simulated email)
  const { login, register, requestPasswordReset, resetPassword } = useAuthStore()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetState = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
    setResetToken('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))

    if (mode === 'login') {
      const res = await login(form.email, form.password)
      if (!res.ok) setError(res.error)

    } else if (mode === 'register') {
      if (!form.name.trim()) { setError('Name is required'); setLoading(false); return }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
      const res = await register(form.name.trim(), form.email, form.password)
      if (!res.ok) setError(res.error)

    } else if (mode === 'forgot') {
      const res = await requestPasswordReset(form.email)
      if (!res.ok) {
        setError(res.error)
      } else {
        setResetToken(res.token)
        setSuccess('Reset token generated. In a real app this would be emailed to you.')
      }

    } else if (mode === 'reset') {
      const res = await resetPassword(form.email, form.token, form.newPassword)
      if (!res.ok) {
        setError(res.error)
      } else {
        setSuccess('Password reset! You can now sign in.')
        setTimeout(() => resetState('login'), 1500)
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(249,112,102,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', fontFamily: 'Syne', color: 'white' }}>S</div>
            <span style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: '800', color: 'var(--text)' }}>StudySync</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '14px', margin: 0 }}>Your all-in-one academic planner</p>
        </div>

        <div className="card" style={{ borderRadius: '16px' }}>
          {/* Tabs (only for login/register) */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => resetState(m)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? 'white' : 'var(--text2)' }}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          {/* Forgot / Reset header */}
          {(mode === 'forgot' || mode === 'reset') && (
            <div style={{ marginBottom: '24px' }}>
              <button onClick={() => resetState('login')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', padding: 0 }}>
                ← Back to Sign In
              </button>
              <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', color: 'var(--text)', margin: '0 0 4px' }}>
                {mode === 'forgot' ? 'Reset Password' : 'Enter New Password'}
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '13px', margin: 0 }}>
                {mode === 'forgot' ? 'Enter your email to get a reset token.' : 'Enter the token and your new password.'}
              </p>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Register: name */}
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Alex Johnson" required style={inputStyle} />
              </div>
            )}

            {/* Email */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={inputStyle} />
              </div>
            )}

            {/* Reset: email + token */}
            {mode === 'reset' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Reset Token</label>
                  <input value={form.token} onChange={e => set('token', e.target.value)} placeholder="XXXXXX" required style={{ ...inputStyle, letterSpacing: '0.15em', textTransform: 'uppercase' }} />
                </div>
                <PasswordInput value={form.newPassword} onChange={e => set('newPassword', e.target.value)} label="New Password" />
                {form.newPassword && <StrengthBar password={form.newPassword} />}
              </>
            )}

            {/* Login: password */}
            {mode === 'login' && (
              <PasswordInput value={form.password} onChange={e => set('password', e.target.value)} label="Password" />
            )}

            {/* Register: password + confirm */}
            {mode === 'register' && (
              <>
                <PasswordInput value={form.password} onChange={e => set('password', e.target.value)} label="Password" />
                {form.password && <StrengthBar password={form.password} />}
                <PasswordInput value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} label="Confirm Password" />
              </>
            )}

            {/* Simulated token display */}
            {resetToken && (
              <div style={{ background: 'rgba(52,216,162,0.1)', border: '1px solid rgba(52,216,162,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px' }}>
                <div style={{ color: 'var(--accent3)', fontWeight: '600', marginBottom: '4px' }}>Your reset token (simulated):</div>
                <div style={{ fontFamily: 'monospace', fontSize: '20px', letterSpacing: '0.2em', color: 'var(--text)', fontWeight: '700' }}>{resetToken}</div>
                <div style={{ color: 'var(--text2)', fontSize: '11px', marginTop: '6px' }}>Valid for 15 minutes. Use this on the "Enter New Password" step.</div>
                <button type="button" onClick={() => resetState('reset')} style={{ marginTop: '10px', background: 'var(--accent3)', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '600' }}>
                  Continue →
                </button>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(249,112,102,0.1)', border: '1px solid rgba(249,112,102,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--accent2)' }}>
                {error}
              </div>
            )}

            {success && !resetToken && (
              <div style={{ background: 'rgba(52,216,162,0.1)', border: '1px solid rgba(52,216,162,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--accent3)' }}>
                {success}
              </div>
            )}

            {mode !== 'forgot' || !resetToken ? (
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
                {loading ? 'Please wait…' : {
                  login: 'Sign In',
                  register: 'Create Account',
                  forgot: 'Send Reset Token',
                  reset: 'Reset Password',
                }[mode]}
              </button>
            ) : null}
          </form>

          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button onClick={() => resetState('register')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '500' }}>
                Create an account
              </button>
              <button onClick={() => resetState('forgot')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px' }}>
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
