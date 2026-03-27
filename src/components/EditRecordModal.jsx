import { useState } from 'react'

const SUBJECTS = ['国語', '算数・数学', '理科', '社会', '英語', 'その他']

export default function EditRecordModal({ record, onClose, onSave }) {
  const [subject, setSubject] = useState(record.subject || '')
  const [content, setContent] = useState(record.content || '')
  const [memo, setMemo] = useState(record.memo || '')
  const [startTime, setStartTime] = useState(record.start_time || '')
  const [endTime, setEndTime] = useState(record.end_time || '')
  const [durationMin, setDurationMin] = useState(record.duration_min || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!subject || !content) {
      alert('科目と内容は必須です')
      return
    }
    setSaving(true)
    try {
      await onSave({
        subject,
        content,
        memo,
        startTime,
        endTime,
        durationMin: parseInt(durationMin) || 0,
      })
      onClose()
    } catch (err) {
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>記録を編集</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: 0,
            lineHeight: 1,
          }}>×</button>
        </div>

        <div className="field">
          <label>科目 *</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">選択してください</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <label>内容 *</label>
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="例: かけ算の練習"
          />
        </div>

        <div className="field">
          <label>メモ</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            rows={3}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="field">
            <label>開始時刻</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label>終了時刻</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>学習時間（分）</label>
          <input
            type="number"
            value={durationMin}
            onChange={e => setDurationMin(e.target.value)}
            min="0"
            placeholder="例: 30"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving} style={{ flex: 1 }}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
