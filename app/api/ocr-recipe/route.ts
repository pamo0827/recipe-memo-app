import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractRecipeFromText } from '@/lib/ai'
import { getContentText } from '@/lib/content'
import { createRecipe } from '@/lib/recipes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function analyzeFileWithGemini(apiKey: string, fileBuffer: Buffer, mimeType: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
    You are an intelligent document analysis assistant. Your task is to analyze the provided file (image or PDF) and determine its content type.

    1.  **First, classify the content.** Is it:
        a) A single, direct recipe.
        b) A list of URLs pointing to recipe websites.
        c) Neither of the above.

    2.  **Based on the classification, format your response as a single, valid JSON object with NO other text or markdown.**

    *   **If it's a single recipe (a):**
        Return a JSON object with \`"type": "recipe"\` and a \`"data"\` object containing the extracted recipe details.
        Example:
        {
          "type": "recipe",
          "data": {
            "name": "チョコレートチップクッキー",
            "ingredients": "薄力粉: 200g\\nバター: 100g...",
            "instructions": "1. バターと砂糖を混ぜます。..."
          }
        }

    *   **If it's a list of URLs (b):**
        Return a JSON object with \`"type": "url_list"\` and a \`"data"\` array containing all the extracted URLs as strings.
        Example:
        {
          "type": "url_list",
          "data": [
            "https://cookpad.com/recipe/12345",
            "https://www.kyounoryouri.jp/recipe/6789.html"
          ]
        }

    *   **If it's neither (c):**
        Return a JSON object with \`"type": "unknown"\`.
        Example:
        {
          "type": "unknown",
          "data": null
        }
  `

  const filePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  }

  try {
    const result = await model.generateContent([prompt, filePart])
    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error with Gemini API during file analysis:', error)
    throw new Error('Failed to analyze file with Gemini.')
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: userSettings, error: userError } = await supabase
    .from('user_settings')
    .select('ai_provider, openai_api_key, gemini_api_key')
    .eq('user_id', userId)
    .single()

  if (userError || !userSettings) {
    return NextResponse.json({ error: 'User settings not found.' }, { status: 404 })
  }

  const { ai_provider, openai_api_key, gemini_api_key } = userSettings
  const apiKey = ai_provider === 'gemini' ? gemini_api_key : openai_api_key

  if (!apiKey) {
    return NextResponse.json({ error: 'AI provider API key is not configured.' }, { status: 400 })
  }

  // For now, the advanced PDF/URL list logic is only implemented for Gemini
  if (ai_provider !== 'gemini') {
    return NextResponse.json({ error: 'File analysis is currently only supported for Gemini. Please select Gemini in settings.' }, { status: 501 })
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const analysisResult = await analyzeFileWithGemini(apiKey, fileBuffer, file.type)

    switch (analysisResult.type) {
      case 'recipe':
        return NextResponse.json(analysisResult)

      case 'url_list':
        const urls = analysisResult.data as string[]
        let successCount = 0
        let errorCount = 0

        for (const url of urls) {
          try {
            const text = await getContentText(url)
            const recipeData = await extractRecipeFromText(text, ai_provider, apiKey)
            await createRecipe(userId, {
              name: recipeData.name,
              ingredients: recipeData.ingredients,
              instructions: recipeData.instructions,
              source_url: url,
            })
            successCount++
          } catch (e) {
            console.error(`Failed to process URL ${url}:`, e)
            errorCount++
          }
        }
        return NextResponse.json({
          type: 'summary',
          data: {
            message: `処理が完了しました。${urls.length}件中、${successCount}件のレシピを追加しました。`,
          },
        })

      case 'unknown':
      default:
        return NextResponse.json({ error: 'The uploaded file does not appear to be a recipe or a list of recipe URLs.' }, { status: 400 })
    }
  } catch (error) {
    console.error('OCR Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 })
  }
}
