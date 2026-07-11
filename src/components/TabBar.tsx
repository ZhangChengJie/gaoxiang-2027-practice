import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/case', label: '案例', icon: '📋' },
  { path: '/specials', label: '专项', icon: '📝' },
  { path: '/wrong', label: '错题本', icon: '📕' },
  { path: '/essay', label: '论文', icon: '✍️' },
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = location.pathname

  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`tabbar-item ${active === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tabbar-icon">{tab.icon}</span>
          <span className="tabbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
