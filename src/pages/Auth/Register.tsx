import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Employee' | 'IT Personnel'>('Employee')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [showDepartmentList, setShowDepartmentList] = useState(false)
  const departments = [
    'Office of the City Accountant',
    'Office of the City Administrator',
    'Office of the City Assessor',
    'Office of the City Budget Officer',
    'Office of the City Civil Registrar',
    'Office of the City Disaster Risk Reduction & Management Officer',
    'Office of the City Engineer',
    'Office of the City Environment & Natural Resources Officer',
    'Office of the City General Services Officer',
    'Office of the City Health Officer',
    'Office of the City Legal Officer',
    'Office of the City Market Administrator',
    'Office of the City Mayor',
    'Office of the City Planning & Development Coordinator',
    'Office of the City Prosecutor',
    'Office of the City Social Welfare and Development Officer',
    'Office of the City Treasurer',
    'Office of the City Veterinarian',
    'Colegio ng Lungsod ng Batangas',
    'Office of the City Human Resource Management Officer',
    'Office of the City Internal Audit Service',
    'Office of the City Agriculturist',
    'Office of the Sangguniang Panlungsod',
    'City Local Government Operation Officer VI – DILG',
    'Chief of Police, City PNP Office',
    'City Fire Marshal',
    'City Schools Division Superintendent – DepEd',
    'City Warden',
    'City Wardress',
    'COMELEC Election Officer IV',
    'MTCC Judge Branch I',
    'MTCC Judge Branch II',
    'State Auditor IV – Commission on Audit',
    "City Mayor's Division",
    "Mayor's Action Center",
    'Business Permits & Licensing Office',
    'Discipline, Safety & Security Office',
    'City Tourism Office',
    'Information Technology Services Division',
    'Local Economic Development & Investment Promotion Office',
    'Office of the Senior Citizen Affairs',
    'Public Affairs and Assistance Division',
    'Public Library and Information Center',
    'Public Employment Services Office',
    'Public Information Office',
    'Transportation Development and Regulatory Office',
    ]
    const filteredDepartments = departments.filter((dept) =>
        dept.toLowerCase().includes(departmentSearch.toLowerCase())
)
    const handleDepartmentChange = (value: string) => {
        setDepartment(value)
        setDepartmentSearch(value)

        if (value === 'Information Technology Services Division') {
            setRole('IT Personnel')
        } else {
            setRole('Employee')
        }

        setShowDepartmentList(false)
        }
  

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (
      !fullName.trim() ||
      !employeeId.trim() ||
      !department.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage('Please complete all required fields.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

    if (!strongPassword.test(password)) {
      setErrorMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      )
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch('http://localhost/BatangAI/api/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          employeeId: employeeId.trim(),
          department: department.trim(),
          email: email.trim(),
          role,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Registration failed.')
        return
      }

      setSuccessMessage('Registration successful! Redirecting to login...')

      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch {
      setErrorMessage(
        'Unable to connect to the server. Please make sure XAMPP is running.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <header className="register-heading">
          <img
            className="register-logo"
            src={logo}
            alt="Batangas City seal"
          />

          <h1>
            Batang<span>AI</span>
          </h1>

          <p>
            Create your account for the AI-Integrated Network Incident
            Reporting and Troubleshooting Support System
          </p>
        </header>

        <form className="register-form" onSubmit={handleRegister}>

          <div className="register-row">
            <div className="register-field">
              <label htmlFor="fullName"> Full Name <span className="required">*</span></label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="employeeId"> Employee ID <span className="required">*</span></label>
              <input
                id="employeeId"
                type="text"
                placeholder="e.g. EMP-001"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="register-row">
            <div className="register-field">
                <label htmlFor="department"> Department / Office <span className="required">*</span></label>
                <div className="department-search-wrapper">
                    <input
                        id="department"
                        type="text"
                        placeholder="Search department or office"
                        value={departmentSearch}
                        onChange={(event) => {
                        setDepartmentSearch(event.target.value)
                        setShowDepartmentList(true)

                        if (event.target.value !== department) {
                            setDepartment('')
                            setRole('Employee')
                        }
                        }}
                        onFocus={() => setShowDepartmentList(true)}
                        autoComplete="off"
                        required
                    />

                    {showDepartmentList && (
                        <div className="department-dropdown">
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                            <button
                                key={dept}
                                type="button"
                                className="department-option"
                                onClick={() => handleDepartmentChange(dept)}
                            >
                                {dept}
                            </button>
                            ))
                        ) : (
                            <div className="department-no-result">
                                No department or office found.
                            </div>
                        )}
                        </div>
                    )}
                </div>
            </div>

            <div className="register-field">
                <label htmlFor="role">Account Type</label>

                <input
                    id="role"
                    type="text"
                    value={role}
                    readOnly
                    aria-readonly="true"
                    />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="email"> Email Address <span className="required">*</span></label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="password"> Password <span className="required">*</span></label>

            <div className="register-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="password-hint"> Must be at least 8 characters with uppercase, lowercase, number, and special character.</p>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword"> Confirm Password <span className="required">*</span></label>

            <div className="register-password-wrap">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="register-error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="register-success" role="status">
              {successMessage}
            </p>
          )}

          <button
            className="register-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-login">
          Already have an account? <Link to="/">Login</Link>
        </div>

        <footer className="register-footer">
          Authorized personnel only
        </footer>
      </section>
    </main>
  )
}

export default Register