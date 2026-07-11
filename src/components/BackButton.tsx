import { useNavigate } from 'react-router-dom'

export default function BackButton({ to, label = '返回' }: { to?: string; label?: string }) {
  const navigate = useNavigate()
  return (
    <button className="back-btn" onClick={() => (to ? navigate(to) : navigate(-1))}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}
