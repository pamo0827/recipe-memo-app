'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link' // next/link をインポート
import { Link as LinkIcon, Camera, Edit, Crown } from 'lucide-react' // Linkアイコンをエイリアス付きでインポート
import type { Ranking } from './page'

type LandingPageClientProps = {
  rankingData: Ranking[]
}

export default function LandingPageClient({
  rankingData,
}: LandingPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push('/recipes')
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-orange-50">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const getCrownColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'
    if (rank === 1) return 'text-gray-400'
    if (rank === 2) return 'text-yellow-600'
    return 'text-gray-300'
  }

  return (
    <div className="flex min-h-screen flex-col bg-orange-50">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 py-12 pt-20 text-center sm:py-20">
          <h1 className="inline-block border-b-4 border-orange-400 pb-6 text-4xl font-bold tracking-normal text-stone-800 sm:text-5xl">
            Cook-Book
          </h1>
          <p className="mt-12 text-lg text-gray-700">
            AIによるシンプルな料理レシピ管理アプリ
          </p>
          <Button
            size="lg"
            className="mt-16 h-auto px-10 py-4 text-lg"
            onClick={() => router.push('/login')}
          >
            無料で始める
          </Button>
          <div className="mt-8 max-w-xl text-center">
            <p className="text-sm text-gray-600">
              お試しで利用する場合:{' '}
              <Link
                href="/login?test_user=true"
                className="font-semibold text-orange-600 underline hover:text-orange-700"
              >
                テストユーザーでログイン
              </Link>
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="text-center text-3xl font-bold text-gray-800">
              主な機能
            </h2>
            <div className="mt-12 space-y-10">
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <LinkIcon className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">どんなサイトでも、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    レシピサイトのURLを貼るだけで、材料や手順を自動で抽出します。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Camera className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">どんな本でも、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    料理本やメモの写真の文章やURLを解析します。
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Edit className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-semibold">自分なりに、まとめる。</h3>
                  <p className="mt-2 text-base text-gray-600">
                    取り込んだレシピは、いつでも自由に見やすく編集できます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ranking Section */}
        {rankingData && rankingData.length > 0 && (
          <section className="px-6 py-12 sm:py-20">
            <div className="mx-auto max-w-xl">
              <h2 className="text-center text-3xl font-bold text-gray-800">
                ユーザーランキング
              </h2>
              <div className="mt-12 space-y-4">
                {rankingData.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex w-10 flex-shrink-0 items-center justify-center">
                      <Crown
                        className={`h-7 w-7 ${getCrownColor(index)}`}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-bold text-gray-800">
                        {user.nickname}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {user.recipe_count}
                      </p>
                      <p className="text-xs text-gray-500">レシピ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4">
        <div className="mx-auto max-w-xl px-6 text-center text-sm text-gray-500">
          <p>© 2025 Cook-Book. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}