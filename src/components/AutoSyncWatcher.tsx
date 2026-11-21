import { useEffect, useRef } from 'react'
import { useProgress } from '../hooks/useProgress'
import { usePractice } from '../hooks/usePractice'
import { getSyncCode, performSync } from '../lib/syncClient'

const MIN_INTERVAL_MS = 30_000
const DEBOUNCE_MS = 5_000

/**
 * 已绑定同步口令时：启动时、切回前台时、联网恢复时以及答题后防抖 5 秒自动静默双向同步。
 */
export default function AutoSyncWatcher() {
  const { progress, replaceProgress } = useProgress()
  const { records, setRecords } = usePractice()
  const syncingRef = useRef(false)
  const applyingRemoteRef = useRef(false)
  const lastRunRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)

  const triggerSync = (force: boolean) => {
    const code = getSyncCode()
    if (!code || syncingRef.current) return
    if (!force && Date.now() - lastRunRef.current < MIN_INTERVAL_MS) return
    syncingRef.current = true
    lastRunRef.current = Date.now()
    void performSync(code, {
      applyProgress: (p) => {
        applyingRemoteRef.current = true
        replaceProgress(p)
        window.setTimeout(() => { applyingRemoteRef.current = false }, 200)
      },
      applyPractice: (r) => {
        applyingRemoteRef.current = true
        setRecords(r)
        window.setTimeout(() => { applyingRemoteRef.current = false }, 200)
      },
    })
      .catch(() => {
        // 离线或网络波动时静默失败，本地数据不受影响
      })
      .finally(() => {
        syncingRef.current = false
      })
  }

  // 启动、切回前台、恢复联网时同步
  useEffect(() => {
    if (!import.meta.env.PROD) return
    triggerSync(true)
    const onVisible = () => {
      if (document.visibilityState === 'visible') triggerSync(false)
    }
    const onOnline = () => triggerSync(true)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 本地答题或练习记录变动后 5 秒防抖自动同步
  useEffect(() => {
    if (!import.meta.env.PROD || applyingRemoteRef.current || !getSyncCode()) return
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => triggerSync(true), DEBOUNCE_MS)
    return () => window.clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, records])

  return null
}
