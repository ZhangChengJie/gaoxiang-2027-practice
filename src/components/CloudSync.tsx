import { useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { usePractice } from '../hooks/usePractice'
import {
  CODE_PATTERN,
  generateSyncCode,
  getLastSyncAt,
  getSyncCode,
  performSync,
  setSyncCode,
} from '../lib/syncClient'

function formatSyncTime(ts: number): string {
  if (!ts) return '尚未同步'
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '刚刚同步'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  return new Date(ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CloudSync() {
  const { replaceProgress } = useProgress()
  const { setRecords } = usePractice()
  const [boundCode, setBoundCode] = useState(getSyncCode)
  const [inputCode, setInputCode] = useState(getSyncCode)
  const [lastSyncAt, setLastSyncAt] = useState(getLastSyncAt)
  const [syncing, setSyncing] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const runSync = async (code: string) => {
    setSyncing(true)
    setStatus(null)
    try {
      const res = await performSync(code, {
        applyProgress: replaceProgress,
        applyPractice: setRecords,
      })
      const saved = setSyncCode(code)
      setBoundCode(saved)
      setInputCode(saved)
      setLastSyncAt(res.updatedAt)
      setStatus({
        kind: 'ok',
        text: res.pulledRemote
          ? `已双向合并同步（共已答 ${res.mergedAnswered} 题、错题 ${res.mergedWrong} 题）`
          : `已上传至云端（共已答 ${res.mergedAnswered} 题），在另一台手机输入同一口令即可同步`,
      })
    } catch (e) {
      setStatus({ kind: 'err', text: e instanceof Error ? e.message : '同步失败，请稍后重试' })
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerate = () => {
    const code = generateSyncCode()
    setInputCode(code)
    setShowCode(true)
    void runSync(code)
  }

  const handleBind = () => {
    const trimmed = inputCode.trim().toLowerCase()
    if (!CODE_PATTERN.test(trimmed)) {
      setStatus({ kind: 'err', text: '口令需为 6–32 位字母、数字、短横线或下划线' })
      return
    }
    void runSync(trimmed)
  }

  const handleCopy = async () => {
    if (!boundCode) return
    try {
      await navigator.clipboard.writeText(boundCode)
      setStatus({ kind: 'ok', text: `已复制口令 ${boundCode}，粘贴到另一台手机即可同步` })
    } catch {
      setStatus({ kind: 'ok', text: `同步口令：${boundCode}` })
    }
  }

  const handleUnbind = () => {
    if (!window.confirm('解绑后仅停止本机云同步，不会删除本地进度，确定解绑？')) return
    setSyncCode('')
    setBoundCode('')
    setInputCode('')
    setStatus(null)
  }

  return (
    <section className="sync-card" aria-labelledby="sync-title">
      <div className="sync-head">
        <div>
          <h2 id="sync-title" className="sync-title">☁️ 多设备云同步</h2>
          <p className="sync-sub">
            {boundCode
              ? `已绑定 · ${formatSyncTime(lastSyncAt)} · 切回前台与答题后自动双向合并`
              : '工作手机 / 生活手机输入同一口令，进度、错题、案例与项目档案自动无损合并'}
          </p>
        </div>
      </div>

      {!boundCode ? (
        <div className="sync-setup">
          <div className="sync-input-row">
            <input
              type="text"
              className="directory-search-input sync-input"
              placeholder="输入 6–32 位同步口令（如 gx-xxxx-xxxx）"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              disabled={syncing}
              aria-label="同步口令"
            />
            <button type="button" className="action-btn primary sync-btn" disabled={syncing} onClick={handleBind}>
              {syncing ? '同步中…' : '绑定同步'}
            </button>
          </div>
          <div className="sync-quick-row">
            <button type="button" className="chip" disabled={syncing} onClick={handleGenerate}>
              ✨ 首次使用：一键生成新口令并上传
            </button>
          </div>
        </div>
      ) : (
        <div className="sync-bound">
          <div className="sync-code-bar">
            <span className="sync-code-text">
              口令：<code>{showCode ? boundCode : `${boundCode.slice(0, 4)}••••${boundCode.slice(-2)}`}</code>
            </span>
            <div className="sync-code-actions">
              <button type="button" className="chip quiz-tool-chip" onClick={() => setShowCode((v) => !v)}>
                {showCode ? '隐藏' : '显示'}
              </button>
              <button type="button" className="chip quiz-tool-chip" onClick={() => void handleCopy()}>
                复制
              </button>
            </div>
          </div>
          <div className="wrong-actions">
            <button type="button" className="action-btn primary" disabled={syncing} onClick={() => void runSync(boundCode)}>
              {syncing ? '同步中…' : '立即双向同步'}
            </button>
            <button type="button" className="action-btn" disabled={syncing} onClick={handleUnbind}>
              解绑口令
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className={`sync-status ${status.kind === 'err' ? 'err' : 'ok'}`} role="status">
          {status.text}
        </p>
      )}
    </section>
  )
}
