'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('test_user') === 'true') {
      setEmail('test@mail.com')
      setPassword('weqho8-vIkkew-sojbas')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('ログイン開始:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('ログイン結果:', { data, error })

      if (error) {
        setError(error.message)
      } else {
        console.log('ログイン成功、リダイレクト中')
        router.push('/')
      }
    } catch (err) {
      console.error('ログインエラー:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('新規登録開始:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      })

      console.log('新規登録結果:', { data, error })

      if (error) {
        setError(error.message)
      } else if (data.user && !data.session) {
        setError('確認メールを送信しました。メールを確認してください。')
      } else if (data.user) {
        // ユーザー設定にニックネームを保存
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert([
            {
              user_id: data.user.id,
              nickname: nickname || null,
              ai_provider: 'gemini',
            }
          ])

        if (settingsError) {
          console.error('設定保存エラー:', settingsError)
        }

        console.log('登録成功、リダイレクト中')
        router.push('/')
      }
    } catch (err) {
      console.error('新規登録エラー:', err)
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cook-Book</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{isSignupMode ? '新規登録' : 'ログイン'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={isSignupMode ? handleSignup : handleLogin}>
              <div className="space-y-4">
                {isSignupMode && (
                  <div className="space-y-2">
                    <Label htmlFor="nickname">ニックネーム</Label>
                    <Input
                      id="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="山田太郎"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? '処理中...' : (isSignupMode ? '登録' : 'ログイン')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsSignupMode(!isSignupMode)
                    setError('')
                  }}
                  disabled={loading}
                  className="w-full"
                >
                  {isSignupMode ? 'ログインに戻る' : '新規登録はこちら'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LoginComponent />
    </Suspense>
  )
}