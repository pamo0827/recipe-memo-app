import { supabase } from '@/lib/supabase' // シンプルなクライアントをインポート
import LandingPageClient from './landing-page-client'

// ランキングデータの型定義
export type Ranking = {
  nickname: string
  recipe_count: number
}

async function getRankingData() {
  // SupabaseのRPC（Remote Procedure Call）を使ってランキング取得関数を呼び出す
  const { data, error } = await supabase.rpc('get_recipe_ranking')

  if (error) {
    console.error('ランキングデータ取得エラー:', error)
    // エラーが発生してもページがクラッシュしないように空の配列を返す
    return []
  }

  // RPCからのデータは型がanyになるため、必要に応じて型付けする
  return (data as Ranking[]) || []
}

export default async function Page() {
  let rankingData: Ranking[] = []
  try {
    rankingData = await getRankingData()
  } catch (e) {
    console.error('ランキングデータ取得プロセスで予期せぬエラー:', e)
  }

  return <LandingPageClient rankingData={rankingData} />
}