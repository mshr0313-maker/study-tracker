// supabase/functions/cleanup-photos/index.ts
// デプロイ: supabase functions deploy cleanup-photos
// スケジュール: Supabase ダッシュボード → Edge Functions → cleanup-photos → Cron: 0 2 * * *（毎日2時）

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  // 1ヶ月以上前に作られた、まだ削除されていない写真を取得
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, path')
    .is('deleted_at', null)
    .lt('created_at', oneMonthAgo.toISOString())

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  if (!photos || photos.length === 0)
    return new Response(JSON.stringify({ deleted: 0 }), { status: 200 })

  // Storage からファイル削除
  const paths = photos.map(p => p.path).filter(Boolean)
  if (paths.length > 0) {
    await supabase.storage.from('study-photos').remove(paths)
  }

  // DB の path を null に、deleted_at を記録
  const ids = photos.map(p => p.id)
  await supabase
    .from('photos')
    .update({ path: null, deleted_at: new Date().toISOString() })
    .in('id', ids)

  console.log(`Deleted ${ids.length} photos`)
  return new Response(JSON.stringify({ deleted: ids.length }), { status: 200 })
})
