import { useRef } from 'react'

export default function PhotoUploader({ previews, onAdd, onRemove }) {
  const fileRef   = useRef()
  const cameraRef = useRef()

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onAdd(files)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {/* カメラ撮影 */}
        <button type="button" className="btn btn-sm" style={{ flex: 1 }}
          onClick={() => cameraRef.current.click()}>
          📷 カメラで撮る
        </button>
        {/* ファイル選択 */}
        <button type="button" className="btn btn-sm" style={{ flex: 1 }}
          onClick={() => fileRef.current.click()}>
          🖼 画像を選ぶ
        </button>
      </div>

      {/* hidden inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleFiles} />
      <input ref={fileRef} type="file" accept="image/*" multiple
        style={{ display: 'none' }} onChange={handleFiles} />

      {/* プレビュー */}
      {previews.length > 0 && (
        <div className="photo-grid">
          {previews.map((p, i) => (
            <div key={i} className="photo-thumb">
              <img src={p.url} alt="" />
              <button className="del-btn" type="button" onClick={() => onRemove(i)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
