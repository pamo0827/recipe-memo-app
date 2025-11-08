'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserSettings, upsertUserSettings } from '@/lib/user-settings'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AiProvider = 'openai' | 'gemini'

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // State for each form
  const [nickname, setNickname] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [aiProvider, setAiProvider] = useState<AiProvider>('openai')
  const [apiKeysSaving, setApiKeysSaving] = useState(false)
  const [apiKeysMessage, setApiKeysMessage] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      loadSettings(user.id)
    }
    checkUser()
  }, [router])

  const loadSettings = async (uid: string) => {
    setLoading(true)
    const settings = await getUserSettings(uid)
    if (settings) {
      setNickname(settings.nickname || '')
      setOpenaiApiKey(settings.openai_api_key || '')
      setGeminiApiKey(settings.gemini_api_key || '')
      setAiProvider(settings.ai_provider || 'openai')
    }
    setLoading(false)
  }

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setNicknameSaving(true)
    setNicknameMessage('')
    const success = await upsertUserSettings(userId, { nickname })
    if (success) {
      setNicknameMessage('ニックネームを更新しました')
    } else {
      setNicknameMessage('更新に失敗しました')
    }
    setTimeout(() => setNicknameMessage(''), 3000)
    setNicknameSaving(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage('')

    if (newPassword.length < 6) {
      setPasswordMessage('パスワードは6文字以上で入力してください。')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('新しいパスワードが一致しません。')
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMessage(`エラー: ${error.message}`)
    } else {
      setPasswordMessage('パスワードを更新しました。')
      setNewPassword('')
      setConfirmPassword('')
    }
    setTimeout(() => setPasswordMessage(''), 3000)
    setPasswordSaving(false)
  }

  const handleApiKeysSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setApiKeysSaving(true)
    setApiKeysMessage('')
    const success = await upsertUserSettings(userId, {
      openai_api_key: openaiApiKey,
      gemini_api_key: geminiApiKey,
      ai_provider: aiProvider,
    })
    if (success) {
      setApiKeysMessage('APIキー設定を保存しました')
    } else {
      setApiKeysMessage('保存に失敗しました')
    }
    setTimeout(() => setApiKeysMessage(''), 3000)
    setApiKeysSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold mb-8">設定</h1>

        <div className="space-y-12">
          {/* Nickname Form */}
          <form onSubmit={handleUpdateNickname} className="space-y-6 pb-8 border-b">
            <h2 className="text-lg font-semibold">プロフィール</h2>
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="表示名"
              />
            </div>
            {nicknameMessage && <p className="text-sm text-green-600">{nicknameMessage}</p>}
            <Button type="submit" disabled={nicknameSaving}>
              {nicknameSaving ? '保存中...' : 'ニックネームを保存'}
            </Button>
          </form>

          {/* Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-6 pb-8 border-b">
            <h2 className="text-lg font-semibold">パスワード変更</h2>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6文字以上"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
              />
            </div>
            {passwordMessage && <p className={`text-sm ${passwordMessage.includes('エラー') ? 'text-red-600' : 'text-green-600'}`}>{passwordMessage}</p>}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? '更新中...' : 'パスワードを更新'}
            </Button>
          </form>

          {/* API Keys Form */}
          <form onSubmit={handleApiKeysSave} className="space-y-6">
            <h2 className="text-lg font-semibold">AI設定</h2>
            <div className="space-y-2">
              <Label htmlFor="ai-provider">AIプロバイダー</Label>
              <Select value={aiProvider} onValueChange={(value: AiProvider) => setAiProvider(value)}>
                <SelectTrigger id="ai-provider"><SelectValue placeholder="使用するAIを選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {aiProvider === 'openai' && (
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI APIキー</Label>
                <Input id="openaiApiKey" type="password" value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)} placeholder="sk-proj-..." />
                <p className="text-xs text-gray-500"><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a> から取得</p>
              </div>
            )}
            {aiProvider === 'gemini' && (
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Gemini APIキー</Label>
                <Input id="geminiApiKey" type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIzaSy..." />
                <p className="text-xs text-gray-500"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> から取得</p>
              </div>
            )}
            {apiKeysMessage && <p className="text-sm text-green-600">{apiKeysMessage}</p>}
            <Button type="submit" disabled={apiKeysSaving}>
              {apiKeysSaving ? '保存中...' : 'APIキーを保存'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}