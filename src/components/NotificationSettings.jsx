import { useState, useEffect } from 'react'

const STORAGE_KEY = 'study-tracker-notification'

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('18:00')
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    // 保存された設定を読み込み
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { enabled, time } = JSON.parse(saved)
      setEnabled(enabled)
      setTime(time)
    }
    // 通知権限の確認
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知に対応していません')
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      setEnabled(true)
      saveSettings(true, time)
      scheduleNotification(time)
    }
  }

  const saveSettings = (newEnabled, newTime) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: newEnabled, time: newTime }))
  }

  const handleToggle = () => {
    if (!enabled && permission !== 'granted') {
      requestPermission()
    } else {
      const newEnabled = !enabled
      setEnabled(newEnabled)
      saveSettings(newEnabled, time)
      if (newEnabled) {
        scheduleNotification(time)
      }
    }
  }

  const handleTimeChange = (e) => {
    const newTime = e.target.value
    setTime(newTime)
    saveSettings(enabled, newTime)
    if (enabled) {
      scheduleNotification(newTime)
    }
  }

  const scheduleNotification = (notifyTime) => {
    // 既存のタイマーをクリア
    if (window.notificationTimer) {
      clearTimeout(window.notificationTimer)
    }

    const [hours, minutes] = notifyTime.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)

    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    const delay = target - now
    window.notificationTimer = setTimeout(() => {
      showNotification()
      // 翌日も通知
      scheduleNotification(notifyTime)
    }, delay)
  }

  const showNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('学習きろく', {
        body: '今日の学習は記録しましたか？がんばりを記録しよう！',
        icon: '/icon-192.png',
        tag: 'study-reminder',
      })
    }
  }

  const testNotification = () => {
    if (permission !== 'granted') {
      requestPermission()
    } else {
      showNotification()
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>リマインダー通知</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>通知を受け取る</span>
        <button
          className={`btn btn-sm ${enabled ? 'btn-primary' : ''}`}
          onClick={handleToggle}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {enabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>通知時刻：</span>
          <input
            type="time"
            value={time}
            onChange={handleTimeChange}
            style={{ fontSize: 14, padding: '4px 8px', flex: 1 }}
          />
          <button className="btn btn-sm" onClick={testNotification}>
            テスト
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
          通知がブロックされています。ブラウザの設定から許可してください。
        </p>
      )}
    </div>
  )
}
