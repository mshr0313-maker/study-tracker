# 学習記録アプリ 引継書

## アプリ概要

「りんちゃんとゆいちゃんの学習の記録」- 子どもの学習を記録し、家族で共有するためのWebアプリ

## 技術スタック

- **フロントエンド**: React 18 + Vite
- **UI**: カスタムCSS（コンポーネントライブラリ不使用）
- **グラフ**: Chart.js (react-chartjs-2)
- **バックエンド**: 現在はモックモード（Supabase対応済み）
- **データ保存**: localStorage（モック時）/ Supabase（本番時）

## ファイル構成

```
src/
├── App.jsx                 # メインアプリ（ログイン・タブ切り替え）
├── main.jsx               # エントリーポイント
├── index.css              # 全体スタイル
├── components/
│   ├── Confetti.jsx       # 紙吹雪アニメーション
│   ├── NotificationSettings.jsx  # 通知設定
│   ├── PhotoUploader.jsx  # 写真アップロード
│   ├── RecordCard.jsx     # 記録カード表示
│   ├── Toast.jsx          # トースト通知
│   └── VacationSettings.jsx  # 長期休み設定
├── pages/
│   ├── ChildView.jsx      # 子ども画面（記録入力）
│   └── ParentView.jsx     # 保護者画面（統計・一覧）
└── lib/
    ├── api.js             # API（モック/Supabase両対応）
    ├── compress.js        # 画像圧縮
    └── supabase.js        # Supabase接続
```

## 主要機能

### 1. ログイン
- パスワード: `0311`
- シンプルなフロント認証（本番ではSupabase Authを推奨）

### 2. 子ども画面
- 子ども選択（りんこ/ゆいこ固定）
- 今日の日付と目標時間を表示
- 教科選択（国語、数学、理科、社会、英語、音楽、図工・美術、体育、その他）
- 種類選択（宿題、復習、予習）
- 学習内容とメモ入力
- タイマー機能
- 写真アップロード
- 保存時に紙吹雪アニメーション

### 3. 保護者画面（がんばった記録）
- 子どもフィルター（りんこ/ゆいこ/すべて）
- 連続記録バッジ表示
- 1日の目標と達成率（プログレスバー）
- 統計カード（今日/今週/今月/合計）
- 曜日別グラフ（4週分切り替え可能）
- 科目別円グラフ（合計・1日平均表示）
- 種類別円グラフ（宿題/復習/予習）
- 月別記録一覧
- 通知設定
- 長期休み設定

### 4. 目標時間の自動設定
| 期間 | 目標時間 |
|------|----------|
| 平日 | 90分 |
| 土日 | 120分 |
| 長期休み | 180分 |

長期休みの期間（デフォルト）:
- 春休み: 3/25〜4/7
- 夏休み: 7/20〜8/31
- 冬休み: 12/25〜1/7

### 5. 記録削除
- パスワード: `1014`
- 削除時にパスワード入力を要求

### 6. コメント機能
- コメント投稿者: パパ/お母さん/おばあちゃん（選択式）

## 本番デプロイ時の対応

### 1. Supabaseの設定

1. Supabaseプロジェクトを作成
2. `.env.local`にURLとキーを設定:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

3. `src/lib/api.js`のモックモードをオフに:
```javascript
const MOCK_MODE = false  // true → false に変更
```

### 2. データベーススキーマ

`supabase_schema.sql`を実行してテーブルを作成:
- children（子ども）
- records（記録）
- photos（写真）
- comments（コメント）

### 3. ストレージ設定

Supabaseで`study-photos`バケットを作成（公開設定）

### 4. Push通知（オプション）

現在の通知はブラウザ通知（ブラウザ起動中のみ）。
本格的なPush通知を実装する場合:
1. VAPID鍵の生成
2. Service Workerの設定
3. Supabase Edge Functionで通知送信

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 注意事項

- 現在のテストデータは`api.js`の`generateTestData()`で生成される過去4週間分のランダムデータ
- localStorage使用のため、ブラウザのキャッシュクリアでデータが消える
- 本番環境ではSupabaseに切り替えることでデータが永続化される

## 今後の拡張案（未実装）

- PWA対応（ホーム画面追加）
- サーバーサイドPush通知
- CSVエクスポート
- 写真の拡大表示
- 認証強化（Supabase Auth）
