import { useState } from 'react'
import { getPhotoUrl, addComment, deleteComment, deleteRecord } from '../lib/api'

const SUBJECT_BADGE = {
  '国語': 'badge-coral', '算数・数学': 'badge-blue', '理科': 'badge-green',
  '社会': 'badge-amber', '英語': 'badge-purple', '音楽': 'badge-pink', 'その他': 'badge-gray',
}
const AVATAR_COLORS = [
  ['#e8eefb','#2a5abf'], ['#e5f4ec','#1e6e45'], ['#fdeee8','#9e3d1a'],
  ['#fdf0d5','#8a5800'], ['#f0eeff','#5033b0'],
]

export default function RecordCard({ record, childIndex, onDeleted, showToast }) {
  const [comments, setComments]     = useState(record.comments || [])
  const [commentAuthor, setAuthor]  = useState('パパ')
  const [commentBody,   setBody]    = useState('')
  const [submitting,    setSubmit]  = useState(false)
  const [deleting,      setDeleting]= useState(false)
  const [showComment,   setShowCmt] = useState(false)

  const d    = new Date(record.recorded_at)
  const date = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  const [bg, fg] = AVATAR_COLORS[childIndex % AVATAR_COLORS.length]

  const handleAddComment = async () => {
    if (!commentAuthor.trim() || !commentBody.trim()) return
    setSubmit(true)
    try {
      const c = await addComment(record.id, commentAuthor.trim(), commentBody.trim())
      setComments(prev => [...prev, c])
      setBody('')
      showToast('コメントを追加しました')
    } catch { showToast('エラーが発生しました') }
    finally { setSubmit(false) }
  }

  const handleDelComment = async (id) => {
    await deleteComment(id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const handleDelRecord = async () => {
    const pw = window.prompt('削除するにはパスワードを入力してください')
    if (pw === null) return
    if (pw !== '1014') {
      showToast('パスワードが違います')
      return
    }
    setDeleting(true)
    try {
      await deleteRecord(record.id)
      onDeleted(record.id)
      showToast('記録を削除しました')
    } catch { showToast('削除に失敗しました'); setDeleting(false) }
  }

  const photos = record.photos || []

  return (
    <div className="record-item">
      <div className="record-header">
        <div className="avatar" style={{ background: bg, color: fg }}>
          {record.children?.name?.slice(0,1) || '?'}
        </div>
        <span className="record-name">{record.children?.name}</span>
        <span className={`badge ${SUBJECT_BADGE[record.subject] || 'badge-gray'}`}>{record.subject}</span>
        {record.study_type && <span className="badge badge-gray">{record.study_type}</span>}
        <span className="record-date">{date}</span>
      </div>

      <div className="record-content">{record.content}</div>

      {record.duration_min > 0 && (
        <div className="record-time">
          {record.duration_min}分
          {record.start_time && record.end_time && ` (${record.start_time}〜${record.end_time})`}
        </div>
      )}

      {record.memo && <div className="record-memo">"{record.memo}"</div>}

      {/* 写真 */}
      {photos.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {photos.some(p => p.deleted_at) && (
            <div className="photo-deleted">
              <span>🗑</span>写真は削除されました（1ヶ月経過）
            </div>
          )}
          <div className="photo-grid" style={{ marginTop: photos.some(p => !p.deleted_at) ? 8 : 0 }}>
            {photos.filter(p => !p.deleted_at && p.path).map(p => (
              <div key={p.id} className="photo-thumb">
                <img src={getPhotoUrl(p.path)} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コメント */}
      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="comment-author">{c.author}</span>
                <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => handleDelComment(c.id)}>削除</button>
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* コメント追加 */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => setShowCmt(v => !v)}>
          {showComment ? 'とじる' : '💬 コメントする'}
        </button>
        <button className="btn btn-sm btn-danger" disabled={deleting} onClick={handleDelRecord}>
          {deleting ? '削除中...' : '🗑 記録を削除'}
        </button>
      </div>

      {showComment && (
        <div className="comment-form" style={{ marginTop: 8 }}>
          <select value={commentAuthor} onChange={e => setAuthor(e.target.value)} style={{ width: 130, flexShrink: 0 }}>
            <option value="パパ">パパ</option>
            <option value="お母さん">お母さん</option>
            <option value="おばあちゃん">おばあちゃん</option>
          </select>
          <input type="text" placeholder="コメントを入力..." value={commentBody}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
          <button className="btn btn-primary btn-sm" disabled={submitting} onClick={handleAddComment}>
            送信
          </button>
        </div>
      )}
    </div>
  )
}
