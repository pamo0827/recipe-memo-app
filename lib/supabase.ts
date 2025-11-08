import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Recipe = {
  id: string
  user_id: string
  name: string
  description?: string
  ingredients: string
  instructions: string
  source_url?: string
  display_order?: number
  created_at: string
  updated_at: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'user_id'>

export type UserSettings = {
  id: string
  user_id: string
  nickname: string | null
  openai_api_key: string | null
  gemini_api_key: string | null
  ai_provider: 'openai' | 'gemini'
  gemini_model_name: string | null
  created_at: string
  updated_at: string
}
