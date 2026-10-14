import { useEffect, useState } from 'react'

const CHECK_INTERVAL_MS = 30 * 60 * 1000

/**
 * 已安装到桌面的 PWA 常从后台直接切回，不会重新加载页面。
 * 这里在回到前台和定时检查 sw.js；新版本接管后提示用户点击刷新，不自动刷新以免打断答题。
 */
export default function UpdatePrompt() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker
    // 首次安装（原来没有控制者）也会触发 controllerchange，只有从旧版本换到新版本才提示
    let controlled = Boolean(sw.controller)
    const onControllerChange = () => {
      if (controlled) setReady(true)
      controlled = true
    }
    sw.addEventListener('controllerchange', onControllerChange)
    let registration: ServiceWorkerRegistration | undefined
    sw.register('/sw.js', { scope: '/' }).then((r) => (registration = r), () => {})

    const check = () => {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => {})
    }
    const timer = window.setInterval(check, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('online', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('online', check)
      sw.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  if (!ready) return null
  return (
    <div className="update-prompt" role="status">
      <span>新版本已就绪</span>
      <button type="button" className="action-btn primary" onClick={() => window.location.reload()}>
        点击更新
      </button>
      <button type="button" className="update-later" onClick={() => setReady(false)} aria-label="稍后更新">
        稍后
      </button>
    </div>
  )
}
