import { useEffect } from 'react'
import AppRouter from './routes/AppRouter'
import {
  getAuthSession,
  getCurrentUserProfilePhoto,
} from './auth'
import './styles/SystemRefresh.css'
import './styles/AdminDashboardSystem.css'
import './styles/AdminSidebarFit.css'
import './styles/AdminReferenceFit.css'
import './styles/AllIncidentsDashboardMatch.css'
import './styles/AllIncidentsReset.css'
import './styles/AllIncidentsSidebarMatch.css'
import './styles/NoBold.css'
import './styles/StandardSizing.css'
import './styles/PremiumSystem.css'
import './styles/UiAuditFixes.css'

function App() {
  useEffect(() => {
    const syncProfileAvatar = () => {
      const avatar = getCurrentUserProfilePhoto()
      document.documentElement.style.setProperty(
        '--saved-profile-avatar',
        `url("${avatar}")`,
      )
    }

    syncProfileAvatar()
    document.documentElement.classList.add('has-profile-avatar')
    window.addEventListener(
      'batangai-auth-updated',
      syncProfileAvatar,
    )

    return () => {
      window.removeEventListener(
        'batangai-auth-updated',
        syncProfileAvatar,
      )
    }
  }, [])

  useEffect(() => {
    const goHome = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.sidebar-brand')) return
      const role = getAuthSession()?.user.role
      const home = role === 'Administrator' ? '/admin' : role === 'Secretary' ? '/secretary' : role === 'IT Personnel' ? '/it' : '/employee'
      window.location.assign(home)
    }
    document.addEventListener('click', goHome)
    return () => document.removeEventListener('click', goHome)
  }, [])

  useEffect(() => {
    const showKeyboardFocus = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    }
    const hidePointerFocus = () => {
      document.body.classList.remove('keyboard-navigation')
    }

    window.addEventListener('keydown', showKeyboardFocus)
    window.addEventListener('pointerdown', hidePointerFocus)

    return () => {
      window.removeEventListener('keydown', showKeyboardFocus)
      window.removeEventListener('pointerdown', hidePointerFocus)
    }
  }, [])
  return <AppRouter />
}

export default App
