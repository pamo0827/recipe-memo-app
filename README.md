# Cook-Book

AIによるシンプルな料理レシピ管理アプリ。あらゆるサイトや料理本、手書きのメモからレシピを簡単に取り込み、統一されたフォーマットで管理できます。

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## （とりあえずの）デプロイ先

https://recipe-database-cooki-git-303e59-yoshi0827101328-9306s-projects.vercel.app/

## 主な機能

- **AIによるレシピ自動抽出**:
  - **URLから**: レシピサイトのURLを貼り付けるだけで、材料や手順をAIが自動で解析・整形して保存します。
  - **画像から**: 料理本や手書きのメモを写真に撮るだけで、AIが文字を認識してレシピをデータ化します。
- **直感的なUI**: ドラッグ＆ドロップでレシピの表示順を自由に変更できます。
- **ユーザーランキング**: レシピ登録数に基づいたユーザーランキングを表示します。
- **柔軟な設定**: ニックネームやパスワードをいつでも変更できます。

---

## 技術スタック

- **フレームワーク**: Next.js (App Router), React
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **バックエンド**: Supabase (Auth, Postgres, Database Functions)
- **AI**: Google Gemini / OpenAI (ユーザーがAPIキーを設定して選択可能)

## テストユーザー

すぐにアプリを試せるテストユーザーを用意しています。

- **Email**: `test@mail.com`
- **Password**: `weqho8-vIkkew-sojbas`

ランディングページの「テストユーザーでログイン」リンクから、情報が自動入力された状態でログインできます。