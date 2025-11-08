import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractRecipeFromText } from '@/lib/ai'
import { getContentText } from '@/lib/content'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// --- API Route Handler ---

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json()

    if (!url || !userId) {
      return NextResponse.json({ error: 'URL and User ID are required' }, { status: 400 })
    }

    // Get user's settings from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('openai_api_key, gemini_api_key, ai_provider')
      .eq('user_id', userId)
      .maybeSingle()

    const provider = settings?.ai_provider || 'openai'
    const apiKey = provider === 'openai'
      ? settings?.openai_api_key
      : settings?.gemini_api_key

    if (!apiKey) {
      const keyName = provider === 'openai' ? 'OpenAI' : 'Gemini'
      return NextResponse.json({ error: `${keyName} APIキーが設定されていません。設定ページでAPIキーを登録してください。` }, { status: 400 })
    }

    // Get content text from URL
    const text = await getContentText(url)
    if (!text) {
      return NextResponse.json({ error: 'Could not retrieve content from the URL.' }, { status: 404 })
    }

    // Extract recipe using the centralized AI function
    const recipe = await extractRecipeFromText(text, provider, apiKey)

    return NextResponse.json(recipe)

  } catch (error) {
    console.error('Recipe scraping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
