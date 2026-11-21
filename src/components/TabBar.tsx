import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'

type TabDef = {
  path: string
  label: string
  match: (pathname: string) => boolean
  icon: (active: boolean) => ReactNode
}

const tabs: TabDef[] = [
  {
    path: '/',
    label: '首页',
    match: (p) => p === '/',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.8 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    path: '/case',
    label: '案例',
    match: (p) => p.startsWith('/case'),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.14 : 0} />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    path: '/specials',
    label: '专项',
    match: (p) => p.startsWith('/specials') || p === '/domain',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.14 : 0} />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/wrong',
    label: '错题本',
    match: (p) => p.startsWith('/wrong'),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v19H7.5A2.5 2.5 0 0 1 5 18.5v-14z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.14 : 0} />
        <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" />
        <path d="M10 7.5l4 4m0-4l-4 4" />
      </svg>
    ),
  },
  {
    path: '/essay',
    label: '论文',
    match: (p) => p.startsWith('/essay'),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.14 : 0} />
      </svg>
    ),
  },
]

function isImmersiveRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/chapter/')
    || pathname.startsWith('/test/')
    || pathname.startsWith('/today')
    || pathname.startsWith('/mock')
    || /^\/domain\/.+/.test(pathname)
  )
}

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalStats } = useProgress()
  const pathname = location.pathname

  if (isImmersiveRoute(pathname)) return null

  return (
    <nav className="tabbar" aria-label="主导航">
      {tabs.map((tab) => {
        const isActive = tab.match(pathname)
        const showBadge = tab.path === '/wrong' && totalStats.dueCount > 0
        return (
          <button
            key={tab.path}
            type="button"
            className={`tabbar-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
          >
            <span className="tabbar-icon-wrap">
              <span className="tabbar-icon">{tab.icon(isActive)}</span>
              {showBadge && (
                <span className="tabbar-badge" aria-label={`${totalStats.dueCount} 道到期错题`}>
                  {totalStats.dueCount > 99 ? '99+' : totalStats.dueCount}
                </span>
              )}
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
