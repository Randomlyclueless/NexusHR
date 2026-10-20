
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  BriefcaseBusiness,
  Wallet,
  TrendingUp,
  BrainCircuit,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

import Dashboard from './pages/dashboard/Dashboard.jsx'
import Attendance from './pages/attendance/Attendance.jsx'
import Employees from './pages/employees/Employees.jsx'
import Leave from './pages/leave/Leave.jsx'
import Payroll from './pages/payroll/Payroll.jsx'
import Performance from './pages/performance/Performance.jsx'
import Recruitment from './pages/recruitment/Recruitment.jsx'
import AIInsights from './pages/AIInsights.jsx'
import { useAuth } from './context/AuthContext.jsx'
import './App.css'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Employees', icon: Users },
  { label: 'Attendance', icon: CalendarDays },
  { label: 'Leave Management', icon: ClipboardList },
  { label: 'Recruitment', icon: BriefcaseBusiness },
  { label: 'Payroll', icon: Wallet },
  { label: 'Performance', icon: TrendingUp },
  { label: 'AI Workforce Insights', icon: BrainCircuit },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  const navigate = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard onNavigate={navigate} />
      case 'Employees':
        return <Employees />
      case 'Attendance':
        return <Attendance />
      case 'Leave Management':
        return <Leave />
      case 'Recruitment':
        return <Recruitment />
      case 'Payroll':
        return <Payroll />
      case 'Performance':
        return <Performance />
      case 'AI Workforce Insights':
        return <AIInsights />
      default:
        return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="nexus-app">
      <aside className={`nexus-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="nexus-brand">
          <div className="nexus-brand-mark">N</div>

          <div className="nexus-brand-text">
            <strong>NexusHR</strong>
            <span>PEOPLE MANAGEMENT</span>
          </div>

          <button
            className="nexus-mobile-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="nexus-nav-label">WORKSPACE</div>

        <nav className="nexus-navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={`nexus-nav-item ${
  activePage === label ? 'active' : ''
}`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="nexus-sidebar-footer">
          <span className="nexus-status-dot" />
          <span>HR Management System</span>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="nexus-sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="nexus-main">
        <header className="nexus-topbar">
          <button
            type="button"
            className="nexus-menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="nexus-topbar-title">
            <span>Workspace</span>
            <strong>{activePage}</strong>
          </div>

          <div className="nexus-topbar-account">
            <div className="nexus-account-avatar">
              {(user?.email || 'HR').slice(0, 2).toUpperCase()}
            </div>

            <div className="nexus-account-details">
              <strong>{user?.email || 'HR Workspace'}</strong>
              <span>
                {user?.role?.replace('HR_', '').replace('_', ' ') ||
                  'NexusHR'}
              </span>
            </div>

            <button
              type="button"
              className="nexus-logout-button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="nexus-page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
