import { useState, useEffect, useRef } from 'react'
import { getChildren, createRecord, getGoal, getTodayGoalType } from '../lib/api'
import PhotoUploader from '../components/PhotoUploader'

const SUBJECTS = ['国語', '数学', '理科', '社会', '英語', '音楽', '図工・美術', '体育', 'その他']
const STUDY_TYPES = ['宿題', '復習', '予習']

// 今日の日付をフォーマット
const formatToday = () => {
  const today = new Date()
  const month = today.getMonth() + 1
  const date = today.getDate()
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const day = days[today.getDay()]
  return `${month}月${date}日（${day}）`
}

export default function ChildView({ showToast, triggerConfetti }) {
  const [children,  setChildren]  = useState([])
  const [childId,   setChildId]   = useState('')
  const [subject,   setSubject]   = useState('')
  const [studyType, setStudyType] = useState('')
  const [content,   setContent]   = useState('')
  const [memo,      setMemo]      = useState('')
  const [startTime, setStart]     = useState('')
  const [endTime,   setEnd]       = useState('')
  const [previews,  setPreviews]  = useState([])  // { url, file }[]
  const [saving,    setSaving]    = useState(false)

  // タイマー
  const [timerSec,  setTimerSec]  = useState(0)
  const [running,   setRunning]   = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    getChildren().then(setChildren).catch(() => {})
    const now = new Date()
    setStart(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
  }, [])

  // タイマー制御
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const toggleTimer = () => {
    if (!running) {
      if (timerSec === 0) {
        const now = new Date()
        setStart(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
      }
      setRunning(true)
    } else {
      setRunning(false)
      const now = new Date()
      setEnd(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    }
  }

  const resetTimer = () => {
    setRunning(false)
    setTimerSec(0)
  }

  const mm = String(Math.floor(timerSec / 60)).padStart(2, '0')
  const ss = String(timerSec % 60).padStart(2, '0')

  // 写真
  const handleAddPhotos = (files) => {
    const newPreviews = files.map(f => ({ url: URL.createObjectURL(f), file: f }))
    setPreviews(prev => [...prev, ...newPreviews])
  }
  const handleRemovePhoto = (i) => {
    setPreviews(prev => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, idx) => idx !== i) })
  }

  // 保存
  const handleSave = async () => {
    if (!childId)  return showToast('子どもを選んでください')
    if (!subject)  return showToast('教科を選択してください')
    if (!studyType) return showToast('宿題・復習・予習を選択してください')
    if (!content.trim()) return showToast('内容を入力してください')

    setSaving(true)
    try {
      const durationMin = timerSec > 0
        ? Math.round(timerSec / 60)
        : (startTime && endTime ? calcDiff(startTime, endTime) : 0)

      await createRecord({
        childId, subject, studyType, content: content.trim(),
        memo: memo.trim(), startTime, endTime, durationMin,
        files: previews.map(p => p.file),
      })

      // リセット
      setSubject(''); setStudyType(''); setContent(''); setMemo('')
      previews.forEach(p => URL.revokeObjectURL(p.url))
      setPreviews([])
      resetTimer()
      const now = new Date()
      setStart(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
      setEnd('')
      showToast('記録を保存しました！')
      triggerConfetti?.()
    } catch {
      showToast('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* 今日の日付と目標 */}
      <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{formatToday()}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          きょうの目標：{getGoal()}分（{getTodayGoalType().label}）
        </div>
      </div>

      {/* 子ども選択 */}
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>だれの記録？</label>
          <select value={childId} onChange={e => setChildId(e.target.value)}>
            <option value="">選択してください</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* 教科・内容 */}
      <div className="card">
        <div className="row2">
          <div className="field">
            <label>教科</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">選択</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>種類</label>
            <select value={studyType} onChange={e => setStudyType(e.target.value)}>
              <option value="">選択</option>
              {STUDY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>やったこと</label>
          <input type="text" placeholder="例：かけ算の練習、漢字ドリル20ページ"
            value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>ひとことメモ（任意）</label>
          <textarea placeholder="例：むずかしかったけどできた！" value={memo}
            onChange={e => setMemo(e.target.value)} style={{ minHeight: 60 }} />
        </div>
      </div>

      {/* タイマー */}
      <div className="card">
        <div className="timer-wrap">
          <div className="timer-num">{mm}:{ss}</div>
          <div className="timer-status">
            {running ? '計測中...' : timerSec > 0 ? '一時停止中' : 'タイマーで時間を計れます'}
          </div>
        </div>
        <div className="timer-btns">
          <button className="btn btn-block" onClick={toggleTimer}>
            {running ? '⏸ 一時停止' : timerSec > 0 ? '▶ 再開' : '▶ スタート'}
          </button>
          {timerSec > 0 && (
            <button className="btn" style={{ flexShrink: 0 }} onClick={resetTimer}>リセット</button>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            または時刻を手入力
          </label>
          <div className="row2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>開始時刻</label>
              <input type="time" value={startTime} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>終了時刻</label>
              <input type="time" value={endTime} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* 写真 */}
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>写真を追加（任意）</label>
          <PhotoUploader previews={previews} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            ※写真は1ヶ月後に自動削除されます
          </p>
        </div>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 4 }}
        disabled={saving} onClick={handleSave}>
        {saving ? '保存中...' : '記録を保存する'}
      </button>
    </>
  )
}

function calcDiff(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60
  return diff
}
