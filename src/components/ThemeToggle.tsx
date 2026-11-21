import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const themeNames: Record<Theme, string> = { light: '浅色', dark: '深色', system: '跟随系统' }
const themeIcons: Record<Theme, string> = { light: '☀️', dark: '🌙', system: '🌓' }
const nextThemes: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

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
    <button type="button" className="theme-toggle" onClick={handleToggle} aria-label={label} title={label}>
      <span aria-hidden="true">{themeIcons[theme]}</span>
    </button>
  )
}
