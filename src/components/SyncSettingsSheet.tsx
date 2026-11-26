import { useEffect } from 'react'
import CloudSync from './CloudSync'
import DataBackup from './DataBackup'

type SyncSettingsSheetProps = {
  open: boolean
  onClose: () => void
  onCodeChange: (code: string) => void
}

export default function SyncSettingsSheet({ open, onClose, onCodeChange }: SyncSettingsSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      onClick={onClose}
    >
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id="sheet-title" className="sheet-title">同步与数据</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="sheet-body">
          <CloudSync onCodeChange={onCodeChange} />
          <DataBackup />
          <p className="app-version sheet-version">版本 {__APP_VERSION__}</p>
        </div>
      </div>
    </div>
  )
}
