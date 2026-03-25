import { useState } from 'react'
import { getVacations, setVacations } from '../lib/api'

export default function VacationSettings({ showToast }) {
  const [expanded, setExpanded] = useState(false)
  const [vacations, setLocalVacations] = useState(getVacations)

  const handleChange = (index, field, value) => {
    const updated = [...vacations]
    updated[index] = { ...updated[index], [field]: value }
    setLocalVacations(updated)
    setVacations(updated)
  }

  const formatDate = (mmdd) => {
    const [m, d] = mmdd.split('-')
    return `${parseInt(m)}/${parseInt(d)}`
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 14, fontWeight: 700 }}>長期休み設定</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {!expanded && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          {vacations.map(v => `${v.name}: ${formatDate(v.start)}〜${formatDate(v.end)}`).join('、')}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            平日: 90分、土日: 120分、長期休み: 180分
          </p>
          {vacations.map((v, i) => (
            <div key={v.name} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{v.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={v.start}
                  onChange={e => handleChange(i, 'start', e.target.value)}
                  placeholder="MM-DD"
                  style={{ width: 80, fontSize: 13, padding: '6px 8px' }}
                />
                <span style={{ color: 'var(--muted)' }}>〜</span>
                <input
                  type="text"
                  value={v.end}
                  onChange={e => handleChange(i, 'end', e.target.value)}
                  placeholder="MM-DD"
                  style={{ width: 80, fontSize: 13, padding: '6px 8px' }}
                />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            ※ 形式: MM-DD（例: 07-20）
          </p>
        </div>
      )}
    </div>
  )
}
