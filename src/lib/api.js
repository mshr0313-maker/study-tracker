// ローカルモック版 API（Supabase不要）
// 本番環境では元のコードに戻してください

const MOCK_MODE = false

// ── モックデータ（メモリ内） ─────────────────────────────────
const mockChildren = [
  { id: '1', name: 'りんこ' },
  { id: '2', name: 'ゆいこ' },
]

// テスト用データ生成
const generateTestData = () => {
  const records = []
  const subjects = ['国語', '算数・数学', '理科', '社会', '英語']
  const studyTypes = ['宿題', '復習', '予習']
  const contents = {
    '国語': ['漢字ドリル', '音読', '読書感想文', '作文'],
    '算数・数学': ['かけ算の練習', '分数の計算', 'ドリル', '文章題'],
    '理科': ['実験レポート', '教科書まとめ', '問題集'],
    '社会': ['地図の勉強', '歴史まとめ', '教科書読み'],
    '英語': ['単語練習', '英文法', 'リスニング'],
  }
  let id = 1

  // 過去4週間分のデータを生成
  for (let day = 0; day < 28; day++) {
    const date = new Date()
    date.setDate(date.getDate() - day)

    // 各日に1〜3件のランダムな記録
    const recordCount = Math.floor(Math.random() * 3) + 1
    for (let r = 0; r < recordCount; r++) {
      const childId = Math.random() > 0.5 ? '1' : '2'
      const subject = subjects[Math.floor(Math.random() * subjects.length)]
      const content = contents[subject][Math.floor(Math.random() * contents[subject].length)]
      const studyType = studyTypes[Math.floor(Math.random() * studyTypes.length)]
      const duration = [15, 20, 30, 45, 60][Math.floor(Math.random() * 5)]

      records.push({
        id: String(id++),
        child_id: childId,
        subject,
        study_type: studyType,
        content,
        memo: day === 0 ? 'がんばった！' : '',
        start_time: '09:00',
        end_time: '09:30',
        duration_min: duration,
        recorded_at: date.toISOString(),
        children: { name: childId === '1' ? 'りんこ' : 'ゆいこ' },
        photos: [],
        comments: [],
      })
    }
  }
  return records
}

let mockRecords = generateTestData()

let nextId = 100

// ── 目標・スタンプデータ ─────────────────────────────────
const STORAGE_KEY_STAMPS = 'study-tracker-stamps'

const loadFromStorage = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultVal
  } catch { return defaultVal }
}
const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// 目標設定
const STORAGE_KEY_VACATIONS = 'study-tracker-vacations'

// デフォルト目標時間（分）
const DEFAULT_GOALS = {
  weekday: 90,      // 平日
  weekend: 120,     // 土日
  vacation: 180,    // 長期休み
}

// 長期休み期間（年をまたぐ場合は年も指定）
let mockVacations = loadFromStorage(STORAGE_KEY_VACATIONS, [
  // 春休み（3月下旬〜4月上旬）
  { name: '春休み', start: '03-25', end: '04-07' },
  // 夏休み（7月下旬〜8月末）
  { name: '夏休み', start: '07-20', end: '08-31' },
  // 冬休み（12月下旬〜1月上旬）
  { name: '冬休み', start: '12-25', end: '01-07' },
])

// スタンプ（日付ごとに記録があるかどうか）
let mockStamps = loadFromStorage(STORAGE_KEY_STAMPS, {})

// ── 本番用インポート（モック時は使わない） ────────────────────
let supabase, compressImage
if (!MOCK_MODE) {
  import('./supabase').then(m => supabase = m.supabase)
  import('./compress').then(m => compressImage = m.compressImage)
}

const BUCKET = 'study-photos'

// ── 子ども ──────────────────────────────────────────────
export const getChildren = async () => {
  if (MOCK_MODE) {
    return [...mockChildren]
  }
  const { data, error } = await supabase.from('children').select('*').order('name')
  if (error) throw error
  return data
}

export const addChild = async (name) => {
  if (MOCK_MODE) {
    if (mockChildren.some(c => c.name === name)) {
      throw new Error('unique constraint')
    }
    const c = { id: String(nextId++), name }
    mockChildren.push(c)
    return c
  }
  const { data, error } = await supabase.from('children').insert({ name }).select().single()
  if (error) throw error
  return data
}

export const deleteChild = async (id) => {
  if (MOCK_MODE) {
    const idx = mockChildren.findIndex(c => c.id === id)
    if (idx !== -1) mockChildren.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('children').delete().eq('id', id)
  if (error) throw error
}

// ── 記録 ────────────────────────────────────────────────
export const getRecords = async ({ childId, subject } = {}) => {
  if (MOCK_MODE) {
    let records = [...mockRecords]
    if (childId) records = records.filter(r => r.child_id === childId)
    if (subject) records = records.filter(r => r.subject === subject)
    return records.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
  }
  let q = supabase
    .from('records')
    .select('*, children(name), photos(*), comments(*)')
    .order('recorded_at', { ascending: false })
  if (childId) q = q.eq('child_id', childId)
  if (subject) q = q.eq('subject', subject)
  const { data, error } = await q
  if (error) throw error
  return data
}

export const getStats = async (childId) => {
  if (MOCK_MODE) {
    let all = [...mockRecords]
    if (childId) all = all.filter(r => r.child_id === childId)

    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate()-6); weekStart.setHours(0,0,0,0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)

    const todayMin = all.filter(r => new Date(r.recorded_at) >= todayStart).reduce((s,r) => s+(r.duration_min||0), 0)
    const weekMin  = all.filter(r => new Date(r.recorded_at) >= weekStart).reduce((s,r) => s+(r.duration_min||0), 0)
    const monthMin = all.filter(r => new Date(r.recorded_at) >= monthStart).reduce((s,r) => s+(r.duration_min||0), 0)

    // 週の曜日別
    const byDayWeek = Array(7).fill(0)
    all.filter(r => new Date(r.recorded_at) >= weekStart)
       .forEach(r => { byDayWeek[new Date(r.recorded_at).getDay()] += r.duration_min||0 })

    // 月の曜日別
    const byDayMonth = Array(7).fill(0)
    all.filter(r => new Date(r.recorded_at) >= monthStart)
       .forEach(r => { byDayMonth[new Date(r.recorded_at).getDay()] += r.duration_min||0 })

    // 週の科目別
    const subMapWeek = {}
    all.filter(r => new Date(r.recorded_at) >= weekStart).forEach(r => {
      if (!subMapWeek[r.subject]) subMapWeek[r.subject] = { total: 0, cnt: 0 }
      subMapWeek[r.subject].total += r.duration_min||0
      subMapWeek[r.subject].cnt  += 1
    })
    const bySubjectWeek = Object.entries(subMapWeek)
      .map(([subject, v]) => ({ subject, ...v }))
      .sort((a,b) => b.total - a.total)

    // 月の科目別
    const subMapMonth = {}
    all.filter(r => new Date(r.recorded_at) >= monthStart).forEach(r => {
      if (!subMapMonth[r.subject]) subMapMonth[r.subject] = { total: 0, cnt: 0 }
      subMapMonth[r.subject].total += r.duration_min||0
      subMapMonth[r.subject].cnt  += 1
    })
    const bySubjectMonth = Object.entries(subMapMonth)
      .map(([subject, v]) => ({ subject, ...v }))
      .sort((a,b) => b.total - a.total)

    // 月の種類別
    const typeMapMonth = {}
    all.filter(r => new Date(r.recorded_at) >= monthStart).forEach(r => {
      const t = r.study_type || 'その他'
      if (!typeMapMonth[t]) typeMapMonth[t] = { total: 0, cnt: 0 }
      typeMapMonth[t].total += r.duration_min||0
      typeMapMonth[t].cnt  += 1
    })
    const byTypeMonth = Object.entries(typeMapMonth)
      .map(([studyType, v]) => ({ studyType, ...v }))
      .sort((a,b) => b.total - a.total)

    // 4週分の曜日別データ
    const byWeeks = []
    for (let w = 0; w < 4; w++) {
      const wkEnd = new Date(); wkEnd.setDate(wkEnd.getDate() - (w * 7)); wkEnd.setHours(23,59,59,999)
      const wkStart = new Date(); wkStart.setDate(wkStart.getDate() - 6 - (w * 7)); wkStart.setHours(0,0,0,0)
      const byDay = Array(7).fill(0)
      const subMap = {}
      const typeMap = {}
      all.filter(r => {
        const d = new Date(r.recorded_at)
        return d >= wkStart && d <= wkEnd
      }).forEach(r => {
        byDay[new Date(r.recorded_at).getDay()] += r.duration_min||0
        if (!subMap[r.subject]) subMap[r.subject] = { total: 0, cnt: 0 }
        subMap[r.subject].total += r.duration_min||0
        subMap[r.subject].cnt += 1
        const t = r.study_type || 'その他'
        if (!typeMap[t]) typeMap[t] = { total: 0, cnt: 0 }
        typeMap[t].total += r.duration_min||0
        typeMap[t].cnt += 1
      })
      const bySubject = Object.entries(subMap).map(([subject, v]) => ({ subject, ...v })).sort((a,b) => b.total - a.total)
      const byType = Object.entries(typeMap).map(([studyType, v]) => ({ studyType, ...v })).sort((a,b) => b.total - a.total)
      byWeeks.push({ byDay, bySubject, byType, start: wkStart, end: wkEnd })
    }

    return { todayMin, weekMin, monthMin, byDayWeek, byDayMonth, bySubjectWeek, bySubjectMonth, byTypeMonth, byWeeks, total: all.length }
  }

  let q = supabase.from('records').select('duration_min, recorded_at, subject')
  if (childId) q = q.eq('child_id', childId)
  const { data: all, error } = await q
  if (error) throw error

  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const weekStart  = new Date(); weekStart.setDate(weekStart.getDate()-6); weekStart.setHours(0,0,0,0)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)

  const todayMin = all.filter(r => new Date(r.recorded_at) >= todayStart).reduce((s,r) => s+(r.duration_min||0), 0)
  const weekMin  = all.filter(r => new Date(r.recorded_at) >= weekStart).reduce((s,r) => s+(r.duration_min||0), 0)
  const monthMin = all.filter(r => new Date(r.recorded_at) >= monthStart).reduce((s,r) => s+(r.duration_min||0), 0)

  // 週の曜日別
  const byDayWeek = Array(7).fill(0)
  all.filter(r => new Date(r.recorded_at) >= weekStart)
     .forEach(r => { byDayWeek[new Date(r.recorded_at).getDay()] += r.duration_min||0 })

  // 月の曜日別
  const byDayMonth = Array(7).fill(0)
  all.filter(r => new Date(r.recorded_at) >= monthStart)
     .forEach(r => { byDayMonth[new Date(r.recorded_at).getDay()] += r.duration_min||0 })

  // 週の科目別
  const subMapWeek = {}
  all.filter(r => new Date(r.recorded_at) >= weekStart).forEach(r => {
    if (!subMapWeek[r.subject]) subMapWeek[r.subject] = { total: 0, cnt: 0 }
    subMapWeek[r.subject].total += r.duration_min||0
    subMapWeek[r.subject].cnt  += 1
  })
  const bySubjectWeek = Object.entries(subMapWeek)
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a,b) => b.total - a.total)

  // 月の科目別
  const subMapMonth = {}
  all.filter(r => new Date(r.recorded_at) >= monthStart).forEach(r => {
    if (!subMapMonth[r.subject]) subMapMonth[r.subject] = { total: 0, cnt: 0 }
    subMapMonth[r.subject].total += r.duration_min||0
    subMapMonth[r.subject].cnt  += 1
  })
  const bySubjectMonth = Object.entries(subMapMonth)
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a,b) => b.total - a.total)

  // 4週分の曜日別データ
  const byWeeks = []
  for (let w = 0; w < 4; w++) {
    const wkEnd = new Date(); wkEnd.setDate(wkEnd.getDate() - (w * 7)); wkEnd.setHours(23,59,59,999)
    const wkStart = new Date(); wkStart.setDate(wkStart.getDate() - 6 - (w * 7)); wkStart.setHours(0,0,0,0)
    const byDay = Array(7).fill(0)
    const subMap = {}
    all.filter(r => {
      const d = new Date(r.recorded_at)
      return d >= wkStart && d <= wkEnd
    }).forEach(r => {
      byDay[new Date(r.recorded_at).getDay()] += r.duration_min||0
      if (!subMap[r.subject]) subMap[r.subject] = { total: 0, cnt: 0 }
      subMap[r.subject].total += r.duration_min||0
      subMap[r.subject].cnt += 1
    })
    const bySubject = Object.entries(subMap).map(([subject, v]) => ({ subject, ...v })).sort((a,b) => b.total - a.total)
    byWeeks.push({ byDay, bySubject, start: wkStart, end: wkEnd })
  }

  return { todayMin, weekMin, monthMin, byDayWeek, byDayMonth, bySubjectWeek, bySubjectMonth, byWeeks, total: all.length }
}

export const createRecord = async ({ childId, subject, studyType, content, memo, startTime, endTime, durationMin, files }) => {
  if (MOCK_MODE) {
    const child = mockChildren.find(c => c.id === childId)
    const record = {
      id: String(nextId++),
      child_id: childId,
      subject,
      study_type: studyType || null,
      content,
      memo: memo || null,
      start_time: startTime || null,
      end_time: endTime || null,
      duration_min: durationMin || 0,
      recorded_at: new Date().toISOString(),
      children: { name: child?.name || '不明' },
      photos: [],
      comments: [],
    }
    // 写真をモック（ローカルURL）
    if (files && files.length > 0) {
      record.photos = files.map((f) => ({
        id: String(nextId++),
        path: null,
        url: URL.createObjectURL(f),
      }))
    }
    mockRecords.unshift(record)
    // スタンプを自動付与
    addStamp(childId)
    return record
  }

  const { data: record, error } = await supabase
    .from('records')
    .insert({ child_id: childId, subject, content, memo: memo||null, start_time: startTime||null, end_time: endTime||null, duration_min: durationMin||0 })
    .select().single()
  if (error) throw error

  if (files && files.length > 0) await uploadPhotos(record.id, files)
  return record
}

export const updateRecord = async (id, { subject, studyType, content, memo, startTime, endTime, durationMin }) => {
  if (MOCK_MODE) {
    const record = mockRecords.find(r => r.id === id)
    if (record) {
      if (subject !== undefined) record.subject = subject
      if (studyType !== undefined) record.study_type = studyType
      if (content !== undefined) record.content = content
      if (memo !== undefined) record.memo = memo
      if (startTime !== undefined) record.start_time = startTime
      if (endTime !== undefined) record.end_time = endTime
      if (durationMin !== undefined) record.duration_min = durationMin
    }
    return record
  }
  const updates = {}
  if (subject !== undefined) updates.subject = subject
  if (studyType !== undefined) updates.study_type = studyType || null
  if (content !== undefined) updates.content = content
  if (memo !== undefined) updates.memo = memo || null
  if (startTime !== undefined) updates.start_time = startTime || null
  if (endTime !== undefined) updates.end_time = endTime || null
  if (durationMin !== undefined) updates.duration_min = durationMin || 0

  const { data, error } = await supabase.from('records').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteRecord = async (id) => {
  if (MOCK_MODE) {
    mockRecords = mockRecords.filter(r => r.id !== id)
    return
  }
  const { data: photos } = await supabase.from('photos').select('path').eq('record_id', id).not('path', 'is', null)
  if (photos?.length) await supabase.storage.from(BUCKET).remove(photos.map(p => p.path))
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}

// ── 写真 ────────────────────────────────────────────────
export const uploadPhotos = async (recordId, files) => {
  if (MOCK_MODE) return
  for (const file of files) {
    const compressed = await compressImage(file)
    const path = `${recordId}/${Date.now()}_${compressed.name}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, compressed)
    if (upErr) throw upErr
    await supabase.from('photos').insert({ record_id: recordId, path })
  }
}

export const getPhotoUrl = (path) => {
  if (MOCK_MODE) return path // モック時はそのまま返す
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export const deletePhoto = async (photoId, path) => {
  if (MOCK_MODE) return
  if (path) await supabase.storage.from(BUCKET).remove([path])
  await supabase.from('photos').delete().eq('id', photoId)
}

// ── コメント ────────────────────────────────────────────
export const addComment = async (recordId, author, body) => {
  if (MOCK_MODE) {
    const comment = {
      id: String(nextId++),
      record_id: recordId,
      author,
      body,
      created_at: new Date().toISOString(),
    }
    const record = mockRecords.find(r => r.id === recordId)
    if (record) record.comments.push(comment)
    return comment
  }
  const { data, error } = await supabase
    .from('comments').insert({ record_id: recordId, author, body }).select().single()
  if (error) throw error
  return data
}

export const deleteComment = async (id) => {
  if (MOCK_MODE) {
    mockRecords.forEach(r => {
      r.comments = r.comments.filter(c => c.id !== id)
    })
    return
  }
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

// ── 目標設定 ────────────────────────────────────────────

// 今日が長期休みかどうか判定
const isVacationDay = (date = new Date()) => {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  for (const v of mockVacations) {
    // 年をまたぐ休み（冬休み）の処理
    if (v.start > v.end) {
      if (mmdd >= v.start || mmdd <= v.end) return v.name
    } else {
      if (mmdd >= v.start && mmdd <= v.end) return v.name
    }
  }
  return null
}

// 今日の目標タイプを取得
export const getTodayGoalType = () => {
  const today = new Date()
  const vacation = isVacationDay(today)
  if (vacation) return { type: 'vacation', label: vacation }

  const day = today.getDay()
  if (day === 0 || day === 6) return { type: 'weekend', label: '土日' }

  return { type: 'weekday', label: '平日' }
}

// 今日の目標時間を取得
export const getGoal = () => {
  const { type } = getTodayGoalType()
  return DEFAULT_GOALS[type]
}

// 長期休み設定を取得
export const getVacations = () => {
  return [...mockVacations]
}

// 長期休み設定を更新
export const setVacations = (vacations) => {
  mockVacations = vacations
  saveToStorage(STORAGE_KEY_VACATIONS, mockVacations)
}

// ── スタンプ・連続記録 ────────────────────────────────────
const getDateKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export const addStamp = (childId) => {
  const dateKey = getDateKey()
  if (!mockStamps[childId]) mockStamps[childId] = {}
  mockStamps[childId][dateKey] = true
  saveToStorage(STORAGE_KEY_STAMPS, mockStamps)
}

export const getStamps = (childId) => {
  return mockStamps[childId] || {}
}

export const getStreak = (childId) => {
  const stamps = mockStamps[childId] || {}
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = getDateKey(d)
    if (stamps[key]) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export const getWeeklyStamps = (childId) => {
  const stamps = mockStamps[childId] || {}
  const result = []
  const today = new Date()

  // 今週の月曜日を取得
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 日曜は6日前が月曜
  const monday = new Date(today)
  monday.setDate(today.getDate() - diffToMonday)

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = getDateKey(d)
    result.push({
      date: key,
      day: ['日','月','火','水','木','金','土'][d.getDay()],
      earned: !!stamps[key]
    })
  }
  return result
}
