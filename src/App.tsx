import { useMemo, useState } from 'react'
import { chapters, essays, performanceQuestions, type Question } from './data/content'
import { loadProgress, saveProgress, type Progress } from './lib/storage'
import './App.css'

type View = 'home' | 'chapter' | 'wrong' | 'topics' | 'essay'
export default function App() {
  const [view, setView] = useState<View>('home'); const [active, setActive] = useState(chapters[0].key)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const current = chapters.find((x) => x.key === active) ?? chapters[0]
  const all = useMemo(() => [...chapters.flatMap((x) => x.questions), ...performanceQuestions], [])
  const update = (q: Question, right: boolean) => setProgress((old) => { const wrong = right ? old.wrong.filter((id) => id !== q.id) : [...new Set([...old.wrong, q.id])]; const next = { answered: { ...old.answered, [q.id]: true }, wrong }; saveProgress(next); return next })
  return <main className="app"><header><button className="brand" onClick={() => setView('home')}>高项 · 二轮练习</button><nav>{[['home','首页'],['topics','专题训练'],['wrong',`错题本 ${progress.wrong.length}`],['essay','论文范围']].map(([v, l]) => <button key={v} onClick={() => setView(v as View)}>{l}</button>)}</nav></header>
    {view === 'home' && <section><div className="hero"><p>2027 信息系统项目管理师</p><h1>只做能提分的练习</h1><p>600 道章节题 · 八大绩效域 40 题 · 错题本只存本机</p><button onClick={() => setView('topics')}>进入专题训练</button></div><h2>章节学习</h2><div className="cards">{chapters.map((c) => <button className="card" key={c.key} onClick={() => {setActive(c.key);setView('chapter')}}><b>{c.title}</b><span>{c.questions.length} 题 · 已完成 {c.questions.filter(q=>progress.answered[q.id]).length}</span></button>)}</div></section>}
    {view === 'chapter' && <section><Back onClick={() => setView('home')} /><h1>{current.title}</h1><p>完成后立即查看解析；答错自动进入错题本。</p><Quiz questions={current.questions} onAnswer={update} /></section>}
    {view === 'topics' && <section><Back onClick={() => setView('home')} /><h1>专题训练</h1><div className="cards"><button className="card accent" onClick={() => {setActive('05-绩效域高级管理法规');setView('chapter')}}><b>八大绩效域 · 章节强化</b><span>核心概念、敏捷/混合、治理与法规</span></button><button className="card accent" onClick={() => setView('chapter')}><b>计算、案例、ITTO</b><span>在对应章节中选择训练</span></button></div><h2>八大绩效域专项（40题）</h2><Quiz questions={performanceQuestions} onAnswer={update}/></section>}
    {view === 'wrong' && <section><Back onClick={() => setView('home')} /><h1>错题本</h1>{progress.wrong.length ? <Quiz questions={all.filter(q=>progress.wrong.includes(q.id))} onAnswer={update} /> : <p className="empty">暂无错题。答错的题会自动出现在这里。</p>}</section>}
    {view === 'essay' && <section><Back onClick={() => setView('home')} /><h1>每章论文范围</h1><div className="essayGrid">{essays.map(e=><article key={e.chapter}><h2>{e.title}</h2><p>{e.scope}</p><ul>{e.points.map(p=><li key={p}>{p}</li>)}</ul></article>)}</div></section>}
  </main>
}
function Back({onClick}:{onClick:()=>void}) { return <button className="back" onClick={onClick}>← 返回</button> }
function Quiz({questions,onAnswer}:{questions:Question[];onAnswer:(q:Question,right:boolean)=>void}) { const [index,setIndex]=useState(0); const [selected,setSelected]=useState<number|null>(null); const q=questions[index % questions.length]; if(!q)return null; const choose=(i:number)=>{if(selected!==null)return;setSelected(i);onAnswer(q,i===q.answer)}; return <article className="quiz"><small>{q.chapter} · {index+1}/{questions.length}</small><h2>{q.text}</h2>{q.options.map((o,i)=><button className={selected===null?'option': i===q.answer?'option right':'option wrong'} key={o} onClick={()=>choose(i)}>{'ABCD'[i]}. {o}</button>)}{selected!==null&&<><p className="explain"><b>{selected===q.answer?'回答正确。':'答案：'+ 'ABCD'[q.answer]+'。'}</b> {q.explanation}</p><button className="next" onClick={()=>{setSelected(null);setIndex(index+1)}}>下一题</button></>}</article> }
