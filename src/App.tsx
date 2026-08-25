import { useEffect } from 'react'
import AppRouter from './routes/AppRouter'
import { getAuthSession, getDefaultProfileAvatar } from './auth'
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

function App() {
  useEffect(() => {
    const avatar = localStorage.getItem(`batangai-avatar-${getAuthSession()?.username ?? 'guest'}`) || getDefaultProfileAvatar()
    document.documentElement.style.setProperty('--saved-profile-avatar', `url("${avatar}")`)
    document.documentElement.classList.add('has-profile-avatar')
  }, [])

  useEffect(() => {
    const goHome = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.sidebar-brand')) return
      const role = getAuthSession()?.role
      const home = role === 'Administrator' ? '/admin' : role === 'Secretary' ? '/secretary' : role === 'IT Personnel' ? '/it' : '/employee'
      window.location.assign(home)
    }
    document.addEventListener('click', goHome)
    return () => document.removeEventListener('click', goHome)
  }, [])
  return <AppRouter />
}

export default App
