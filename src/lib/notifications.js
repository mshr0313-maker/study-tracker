// ブラウザ通知の許可をリクエスト
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('このブラウザは通知をサポートしていません')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 通知を表示
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      ...options
    })

    // 通知をクリックしたらアプリを開く
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }
}

// 記録追加の通知
export const notifyNewRecord = (childName, subject, content) => {
  showNotification('📚 新しい学習記録', {
    body: `${childName}さんが${subject}を記録しました\n${content}`,
    tag: 'new-record'
  })
}

// コメント追加の通知
export const notifyNewComment = (childName, author, comment) => {
  showNotification('💬 新しいコメント', {
    body: `${childName}さんの記録に${author}がコメントしました\n${comment}`,
    tag: 'new-comment'
  })
}
