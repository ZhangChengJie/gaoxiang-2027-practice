import { useRef, useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { exportProgress, importProgress } from '../lib/storage'
import { usePractice } from '../hooks/usePractice'
import { normalizePractice } from '../lib/practiceStore'

export default function DataBackup() {
  const { progress, replaceProgress } = useProgress()
  const { records, setRecords } = usePractice()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const handleExport = () => {
    const now = Date.now()
    // 案例/提纲练习记录随进度一起导出
    const payload = { ...JSON.parse(exportProgress(progress, now)), practice: records }
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `高项练习进度-${new Date(now).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('已导出。换设备或清理浏览器前，把这个文件保存好。')
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const next = importProgress(text, Date.now())
      const practice = (JSON.parse(text) as { practice?: unknown }).practice
      const count = Object.keys(next.answered).length
      if (!window.confirm(`导入后会覆盖本机进度（文件中已答 ${count} 题、错题 ${Object.keys(next.wrong).length} 题），确定？`)) return
      replaceProgress(next)
      if (practice !== undefined) setRecords(normalizePractice(practice))
      setMessage(`已导入：已答 ${count} 题。`)
    } catch (e) {
      setMessage(`导入失败：${e instanceof Error ? e.message : '无法读取文件'}`)
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <section className="home-section" aria-labelledby="backup-title">
      <h2 className="section-title" id="backup-title">进度备份</h2>
      <p className="backup-hint">进度只保存在当前浏览器里，换手机或清缓存前请先导出。</p>
      <div className="wrong-actions">
        <button className="action-btn" onClick={handleExport}>
          导出进度
        </button>
        <button className="action-btn" onClick={() => fileInput.current?.click()}>
          导入进度
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
          }}
        />
      </div>
      {message && (
        <p className="backup-hint" role="status">
          {message}
        </p>
      )}
    </section>
  )
}
