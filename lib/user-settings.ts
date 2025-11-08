import { supabase } from './supabase'
import type { UserSettings } from './supabase'

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  console.log('Fetching settings for user:', userId)

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('getUserSettings result:', { data, error })

  if (error) {
    console.error('Settings fetch error:', error)
    return null
  }

  return data
}

export async function upsertUserSettings(
  userId: string,
  settings: {
    openai_api_key?: string | null
    gemini_api_key?: string | null
    ai_provider?: 'openai' | 'gemini'
  }
): Promise<boolean> {
  console.log('Upserting settings for user:', userId, 'with settings:', settings)

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        ...settings,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()

  console.log('upsertUserSettings result:', { data, error })

  if (error) {
    console.error('Settings upsert error:', error)
    return false
  }

  return true
}
