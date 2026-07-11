import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { migrateLegacyProgress } from './lib/storage'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import Chapter from './pages/Chapter'
import SpecialTests from './pages/SpecialTests'
import TestSession from './pages/TestSession'
import WrongBook from './pages/WrongBook'
import Essay from './pages/Essay'
import './styles/wechat.css'

export default function App() {
  useEffect(() => {
    migrateLegacyProgress()
  }, [])

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapter/:key" element={<Chapter />} />
          <Route path="/specials" element={<SpecialTests />} />
          <Route path="/test/:type" element={<TestSession />} />
          <Route path="/wrong" element={<WrongBook />} />
          <Route path="/essay" element={<Essay />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}
