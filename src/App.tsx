import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import UpdatePrompt from './components/UpdatePrompt'
import Home from './pages/Home'
import './styles/wechat.css'

const Chapter = lazy(() => import('./pages/Chapter'))
const SpecialTests = lazy(() => import('./pages/SpecialTests'))
const TestSession = lazy(() => import('./pages/TestSession'))
const WrongBook = lazy(() => import('./pages/WrongBook'))
const Essay = lazy(() => import('./pages/Essay'))
const CaseAnalysis = lazy(() => import('./pages/CaseAnalysis'))
const MockExam = lazy(() => import('./pages/MockExam'))
const Today = lazy(() => import('./pages/Today'))
const DomainPractice = lazy(() => import('./pages/DomainPractice'))
const CheatSheet = lazy(() => import('./pages/CheatSheet'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Suspense fallback={<div className="page empty-state">加载中…</div>}>
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
            <Route path="/cheatsheet" element={<CheatSheet />} />
          </Routes>
        </Suspense>
        <UpdatePrompt />
        <TabBar />
      </div>
    </BrowserRouter>
  )
}
