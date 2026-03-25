import { useState, useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js'
import { getChildren, getRecords, getStats, getGoal, getTodayGoalType, getVacations, setVacations, getStreak } from '../lib/api'
import RecordCard from '../components/RecordCard'
import NotificationSettings from '../components/NotificationSettings'
import VacationSettings from '../components/VacationSettings'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const DOW = ['日', '月', '火', '水', '木', '金', '土']
const SUBJECT_COLORS = ['#4a7cf0','#2a8a5a','#d85a30','#c47d00','#7c4af0','#d45a9e','#888880']

export default function ParentView({ showToast }) {
  const [children,  setChildren]  = useState([])
  const [records,   setRecords]   = useState([])
  const [stats,     setStats]     = useState(null)
  const [filterChild, setFilter]  = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [chartPeriod, setChartPeriod] = useState('week') // 'week' or 'month'
  const [weekOffset, setWeekOffset] = useState(0) // 0=今週, 1=先週, 2=2週前, 3=3週前
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const load = async (childId) => {
    setLoading(true)
    try {
      const [recs, st, ch] = await Promise.all([
        getRecords(childId !== 'all' ? { childId } : {}),
        getStats(childId !== 'all' ? childId : undefined),
        getChildren(),
      ])
      setRecords(recs)
      setStats(st)
      setChildren(ch)
    } catch { showToast('読み込みに失敗しました') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(filterChild) }, [filterChild])

  const handleFilter = (id) => setFilter(id)
  const handleDeleted = (id) => setRecords(prev => prev.filter(r => r.id !== id))

  // 月でフィルタリングした記録
  const filteredRecords = records.filter(r => {
    const d = new Date(r.recorded_at)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return ym === viewMonth
  })

  // 月の選択肢を生成（記録がある月のみ）
  const availableMonths = [...new Set(records.map(r => {
    const d = new Date(r.recorded_at)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))].sort().reverse()

  // 現在の月が選択肢にない場合は追加
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (!availableMonths.includes(currentMonth)) {
    availableMonths.unshift(currentMonth)
  }

  // 子どものインデックスを名前から取得
  const childIndexMap = {}
  children.forEach((c, i) => { childIndexMap[c.id] = i })

  // 週または月のデータを取得
  const getWeekData = () => {
    if (chartPeriod === 'month') {
      return { byDay: stats?.byDayMonth, bySubject: stats?.bySubjectMonth, byType: stats?.byTypeMonth }
    }
    const weekData = stats?.byWeeks?.[weekOffset]
    return { byDay: weekData?.byDay, bySubject: weekData?.bySubject, byType: weekData?.byType }
  }
  const { byDay, bySubject, byType } = getWeekData()

  // 週の期間ラベル
  const getWeekLabel = (offset) => {
    if (offset === 0) return '今週'
    if (offset === 1) return '先週'
    return `${offset + 1}週前`
  }

  const barData = stats && byDay ? {
    labels: DOW,
    datasets: [{
      label: '学習時間（分）',
      data: byDay,
      backgroundColor: '#4a7cf0',
      borderRadius: 6,
    }],
  } : null

  const doughnutData = bySubject?.length ? {
    labels: bySubject.map(s => s.subject),
    datasets: [{
      data: bySubject.map(s => s.total || s.cnt),
      backgroundColor: SUBJECT_COLORS,
      borderWidth: 0,
    }],
  } : null

  const TYPE_COLORS = ['#4a7cf0', '#2a8a5a', '#d85a30', '#888880']
  const typeChartData = byType?.length ? {
    labels: byType.map(t => t.studyType),
    datasets: [{
      data: byType.map(t => t.total || t.cnt),
      backgroundColor: TYPE_COLORS,
      borderWidth: 0,
    }],
  } : null

  const formatMonth = (ym) => {
    const [y, m] = ym.split('-')
    return `${y}年${parseInt(m)}月`
  }

  return (
    <>
      {/* フィルター */}
      <div className="chips">
        {children.map(c => (
          <button key={c.id} className={`chip${filterChild === c.id ? ' active' : ''}`}
            onClick={() => handleFilter(c.id)}>{c.name}</button>
        ))}
        <button className={`chip${filterChild === 'all' ? ' active' : ''}`}
          onClick={() => handleFilter('all')}>すべて</button>
      </div>

      {/* 連続記録・目標達成 */}
      {filterChild !== 'all' && (
        <>
          {/* 連続記録バッジ */}
          {getStreak(filterChild) > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span className="streak-badge">
                🔥 {getStreak(filterChild)}日連続で記録中！
              </span>
            </div>
          )}

          {/* 目標設定カード */}
          <div className="card goal-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>1日の目標</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {getTodayGoalType().label}：{getGoal()}分
              </span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>
              {stats?.todayMin || 0}分 / {getGoal()}分
              {stats?.todayMin >= getGoal() && <span style={{ marginLeft: 8 }}>🎉 達成！</span>}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, ((stats?.todayMin || 0) / getGoal()) * 100)}%` }}
              />
            </div>
          </div>

        </>
      )}

      {/* 統計カード */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-val">{stats.todayMin}<span style={{ fontSize: 13 }}>分</span></div>
            <div className="stat-lbl">今日</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.weekMin}<span style={{ fontSize: 13 }}>分</span></div>
            <div className="stat-lbl">今週</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.monthMin}<span style={{ fontSize: 13 }}>分</span></div>
            <div className="stat-lbl">今月</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.total}<span style={{ fontSize: 13 }}>件</span></div>
            <div className="stat-lbl">合計</div>
          </div>
        </div>
      )}

      {/* 期間切り替えタブ */}
      <div className="chips" style={{ marginBottom: 8 }}>
        {[0, 1, 2, 3].map(w => (
          <button
            key={w}
            className={`chip${chartPeriod === 'week' && weekOffset === w ? ' active' : ''}`}
            onClick={() => { setChartPeriod('week'); setWeekOffset(w) }}
          >
            {getWeekLabel(w)}
          </button>
        ))}
        <button className={`chip${chartPeriod === 'month' ? ' active' : ''}`}
          onClick={() => setChartPeriod('month')}>今月</button>
      </div>

      {/* 曜日別グラフ */}
      {barData && (
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>
            {chartPeriod === 'week' ? `${getWeekLabel(weekOffset)}（曜日別）` : '今月（曜日別）'}
          </p>
          <div style={{ position: 'relative', height: 180 }}>
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                y: { grid: { color: '#f0eeea' }, ticks: { font: { size: 11 }, stepSize: 30 }, beginAtZero: true },
              },
            }} />
          </div>
        </div>
      )}

      {/* 科目別グラフ */}
      {doughnutData && (() => {
        const totalMin = bySubject.reduce((sum, s) => sum + (s.total || 0), 0)
        const days = chartPeriod === 'month' ? new Date().getDate() : 7
        const avgMin = Math.round(totalMin / days)
        return (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>
                科目別（{chartPeriod === 'week' ? getWeekLabel(weekOffset) : '今月'}）
              </p>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                合計 {totalMin}分 / 1日平均 {avgMin}分
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                <Doughnut data={doughnutData} options={{
                  responsive: false, cutout: '65%',
                  plugins: { legend: { display: false } },
                }} width={140} height={140} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bySubject.map((s, i) => (
                  <div key={s.subject} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: SUBJECT_COLORS[i % SUBJECT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{s.subject}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                      {s.total > 0 ? `${s.total}分` : `${s.cnt}件`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 種類別グラフ */}
      {typeChartData && (() => {
        const totalMin = byType.reduce((sum, t) => sum + (t.total || 0), 0)
        const days = chartPeriod === 'month' ? new Date().getDate() : 7
        const avgMin = Math.round(totalMin / days)
        return (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>
                種類別（{chartPeriod === 'week' ? getWeekLabel(weekOffset) : '今月'}）
              </p>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                合計 {totalMin}分 / 1日平均 {avgMin}分
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                <Doughnut data={typeChartData} options={{
                  responsive: false, cutout: '65%',
                  plugins: { legend: { display: false } },
                }} width={140} height={140} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byType.map((t, i) => (
                  <div key={t.studyType} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[i % TYPE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{t.studyType}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                      {t.total > 0 ? `${t.total}分` : `${t.cnt}件`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 記録一覧 */}
      <div className="card">
        {/* 月切り替え */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap' }}>きろく</p>
          <select
            value={viewMonth}
            onChange={e => setViewMonth(e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            {availableMonths.map(ym => (
              <option key={ym} value={ym}>{formatMonth(ym)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📚</div>
            <div>{formatMonth(viewMonth)}の記録がありません</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>子ども画面から記録してみましょう</div>
          </div>
        ) : (
          filteredRecords.map(r => (
            <RecordCard
              key={r.id}
              record={r}
              childIndex={childIndexMap[r.child_id] ?? 0}
              onDeleted={handleDeleted}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* 通知設定 */}
      <NotificationSettings />

      {/* 長期休み設定 */}
      <VacationSettings showToast={showToast} />
    </>
  )
}
