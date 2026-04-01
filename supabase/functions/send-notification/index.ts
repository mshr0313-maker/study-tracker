import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFICATION_EMAIL = 'mshr0313@gmail.com'

serve(async (req) => {
  try {
    const { type, data } = await req.json()

    let subject = ''
    let html = ''

    if (type === 'record') {
      subject = `📚 ${data.child_name}さんが学習を記録しました`
      html = `
        <h2>新しい学習記録</h2>
        <p><strong>名前:</strong> ${data.child_name}</p>
        <p><strong>科目:</strong> ${data.subject}</p>
        <p><strong>種類:</strong> ${data.study_type}</p>
        <p><strong>内容:</strong> ${data.content}</p>
        <p><strong>時間:</strong> ${data.duration_min}分</p>
        ${data.memo ? `<p><strong>メモ:</strong> ${data.memo}</p>` : ''}
        <br>
        <a href="https://study-tracker-bice-rho.vercel.app/">記録を見る</a>
      `
    } else if (type === 'comment') {
      subject = `💬 ${data.record_subject}の記録にコメントがつきました`
      html = `
        <h2>新しいコメント</h2>
        <p><strong>記録:</strong> ${data.child_name}さんの${data.record_subject}</p>
        <p><strong>コメント者:</strong> ${data.author}</p>
        <p><strong>コメント:</strong> ${data.body}</p>
        <br>
        <a href="https://study-tracker-bice-rho.vercel.app/">記録を見る</a>
      `
    }

    // Resend APIでメール送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Study Tracker <onboarding@resend.dev>',
        to: [NOTIFICATION_EMAIL],
        subject: subject,
        html: html
      })
    })

    const result = await res.json()

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
