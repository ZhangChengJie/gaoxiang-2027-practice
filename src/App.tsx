import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import UpdatePrompt from './components/UpdatePrompt'
import Home from './pages/Home'
import Chapter from './pages/Chapter'
import SpecialTests from './pages/SpecialTests'
import TestSession from './pages/TestSession'
import WrongBook from './pages/WrongBook'
import Essay from './pages/Essay'
import CaseAnalysis from './pages/CaseAnalysis'
import MockExam from './pages/MockExam'
import Today from './pages/Today'
import DomainPractice from './pages/DomainPractice'
import './styles/wechat.css'

export default function App() {
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
          <Route path="/case" element={<CaseAnalysis />} />
          <Route path="/mock" element={<MockExam />} />
          <Route path="/today" element={<Today />} />
          <Route path="/domain" element={<DomainPractice />} />
          <Route path="/domain/:key" element={<DomainPractice />} />
        </Routes>
        <UpdatePrompt />
        <TabBar />
      </div>
    </BrowserRouter>
  )
}
