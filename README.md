# 学習きろく

子どもの学習を記録して家族で共有するWebアプリ

## 技術スタック

- **フロントエンド**: React + Vite
- **バックエンド/DB**: Supabase（PostgreSQL）
- **画像保存**: Supabase Storage
- **画像自動削除**: Supabase Edge Function（毎日実行）

---

## ローカル起動手順

### 1. Supabase プロジェクト作成

1. https://supabase.com にアクセスしてプロジェクト作成
2. ダッシュボード → **SQL Editor** を開く
3. `supabase_schema.sql` の内容を貼り付けて実行

### 2. 環境変数を設定

`.env.local` を編集して Supabase の値を入力：

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

値は Supabase ダッシュボード → **Settings → API** から確認できます。

### 3. 依存パッケージをインストールして起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

---

## 写真の自動削除（Edge Function）

写真は1ヶ月後に自動削除されます。削除後は「写真は削除されました」と表示されます。

### デプロイ手順（Vercel にデプロイ後に設定）

```bash
# Supabase CLI をインストール
npm install -g supabase

# ログイン
supabase login

# Edge Function をデプロイ
supabase functions deploy cleanup-photos --project-ref <your-project-ref>
```

Supabase ダッシュボード → **Edge Functions → cleanup-photos → Schedules** で
Cron を設定します：

```
0 2 * * *
```
（毎日午前2時に実行）

---

## デプロイ（Vercel）

```bash
npm run build
```

ビルド後、Vercel にデプロイ：
1. GitHub にプッシュ
2. Vercel でリポジトリをインポート
3. 環境変数（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）を設定
4. デプロイ完了
