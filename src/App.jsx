import { useState, useCallback } from 'react'
import ChildView from './pages/ChildView'
import ParentView from './pages/ParentView'
import Toast from './components/Toast'
import Confetti from './components/Confetti'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('child')
  const [tabKey, setTabKey] = useState(0)
  const [toast, setToast] = useState('')
  const [confetti, setConfetti] = useState(0)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  const triggerConfetti = useCallback(() => {
    setConfetti(c => c + 1)
  }, [])

  const handleLogin = () => {
    if (password === '0311') {
      setLoggedIn(true)
      setError('')
    } else {
      setError('パスワードが違います')
    }
  }

  if (!loggedIn) {
    return (
      <div className="shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>
            りんちゃんとゆいちゃんの<br />学習の記録
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>がんばりを記録しよう</p>
        </div>
        <div className="card" style={{ maxWidth: 320, margin: '0 auto', width: '100%' }}>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="パスワードを入力"
              style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
            />
          </div>
          {error && <p style={{ color: '#d85a30', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
          <button className="btn btn-primary btn-block" onClick={handleLogin}>
            ログイン
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>学習きろく</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>勉強した内容を記録して家族で共有</p>
      </div>

      <nav className="nav">
        <button className={`nav-btn${tab === 'child' ? ' active' : ''}`} onClick={() => { setTab('child'); setTabKey(k => k + 1) }}>
          子ども画面
        </button>
        <button className={`nav-btn${tab === 'parent' ? ' active' : ''}`} onClick={() => { setTab('parent'); setTabKey(k => k + 1) }}>
          がんばった記録
        </button>
      </nav>

      <div className="tab-content" key={tabKey}>
        {tab === 'child'
          ? <ChildView showToast={showToast} triggerConfetti={triggerConfetti} />
          : <ParentView showToast={showToast} />
        }
      </div>

      <Confetti trigger={confetti} />
      <Toast message={toast} />
    </div>
  )
}
