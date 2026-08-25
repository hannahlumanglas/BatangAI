import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { signIn } from '../../auth'
import './Login.css'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setErrorMessage('Invalid username or password.')
      return
    }

    const session = signIn(username.trim(), password)
    if (!session) {
      setErrorMessage('Invalid username or password.')
      return
    }

    setErrorMessage('')
    navigate(session.role === 'Administrator' ? '/admin' : session.role === 'Secretary' ? '/secretary/incidents' : session.role === 'IT Personnel' ? '/it/incidents' : '/employee/report-incident')
  }

  return (
    <main className="login-page">
      <section className="system-copy" aria-labelledby="system-title">
        <div className="system-accent" aria-hidden="true" />
        <h1 id="system-title">
          Batang<span>AI</span>
        </h1>
        <p className="system-subtitle">
          AI-Integrated Network Incident Reporting and Troubleshooting Support
          System
        </p>
        <p className="system-promise">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 6v5c0 5.15-3.42 8.57-8 10-4.58-1.43-8-4.85-8-10V6l8-3Z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
          </svg>
          <span>Empowering Batangas City through<br />Smart IT Solutions</span>
        </p>
      </section>

      <section className="login-card" aria-labelledby="login-heading">
        <header className="login-heading">
          <img className="login-logo" src={logo} alt="Batangas City seal" />
          <h2 id="login-heading">
            Batang<span>AI</span>
          </h2>
          <p>
            AI-Integrated Network Incident Reporting and Troubleshooting Support
            System
          </p>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="3.25" />
                <path d="M5.5 19c.6-3.3 3.04-5 6.5-5s5.9 1.7 6.5 5" />
              </svg>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap password-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
                <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                <path d="M12 14v2" />
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="#forgot-password">Forgot password?</a>
          </div>

          <button className="login-button" type="submit">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6.5" y="10.5" width="11" height="9" rx="1.4" />
              <path d="M9 10.5v-2a3 3 0 0 1 6 0v2M12 14v2" />
            </svg>
            Login
          </button>
          {errorMessage && (
            <p
              role="alert"
              aria-live="assertive"
              style={{ color: '#c62f2f', fontSize: '13px', margin: '-7px 0 0' }}
            >
              {errorMessage}
            </p>
          )}
        </form>

        <footer className="login-footer">
          <span />
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 19 6v5c0 4.4-2.8 7.45-7 9-4.2-1.55-7-4.6-7-9V6l7-3Z" />
              <path d="m8.7 12 2.05 2.05 4.55-4.65" />
            </svg>
            Authorized personnel only
          </p>
          <span />
        </footer>
      </section>
    </main>
  )
}

export default Login
