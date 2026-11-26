import { useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

const themeNames: Record<Theme, string> = { light: '浅色', dark: '深色', system: '跟随系统' }
const nextThemes: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

const themeIcons: Record<Theme, ReactNode> = {
  light: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  dark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
    </svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
    </svg>
  ),
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('gaoxiang-theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // 存储不可用时，沿用当前页面的主题。
  }
  const current = document.documentElement.dataset.theme
  return current === 'light' || current === 'dark' ? current : 'system'
}

function syncThemeColor(theme: Theme) {
  const isDark =
    theme === 'dark'
    || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? '#121212' : '#f5f5f5')
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const next = nextThemes[theme]
  const label = `当前主题：${themeNames[theme]}，切换为${themeNames[next]}`

  useEffect(() => {
    syncThemeColor(theme)
    if (theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => syncThemeColor('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const handleToggle = () => {
    if (next === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.dataset.theme = next
    }
    setTheme(next)
    try {
      localStorage.setItem('gaoxiang-theme', next)
    } catch {
      // 存储不可用时，仍允许本次访问切换主题。
    }
  }

  return (
    <button type="button" className="header-icon-btn" onClick={handleToggle} aria-label={label} title={label}>
      <span className="header-icon-svg" aria-hidden="true">{themeIcons[theme]}</span>
    </button>
  )
}
