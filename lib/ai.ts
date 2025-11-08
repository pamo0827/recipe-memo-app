import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const systemPrompt = `あなたはウェブページやテキストからレシピ情報を抽出するアシスタントです。
与えられたテキストからレシピの情報を抽出し、以下のJSON形式で返してください：
{
  "name": "レシピ名",
  "ingredients": "材料リスト（改行区切り）",
  "instructions": "作り方（改行区切り）"
}

もしレシピが見つからない、または抽出に失敗した場合は、{"error": "見つかりませんでした"} という形式のJSONを返してください。`

async function extractWithOpenAI(apiKey: string, text: string) {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `以下のテキストからレシピ情報を抽出してください：\n\n${text}` }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  })
  return completion.choices[0].message.content
}

async function extractWithGemini(apiKey: string, text: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })
  const result = await model.generateContent(`以下のテキストからレシピ情報を抽出してください：\n\n${text}`)
  const response = await result.response
  // Gemini may return the JSON wrapped in markdown, so we clean it
  return response.text().replace(/```json\n?/, '').replace(/```$/, '')
}

export async function extractRecipeFromText(text: string, provider: 'openai' | 'gemini', apiKey: string) {
  if (!text) {
    throw new Error('Input text is empty.')
  }

  let result: string | null = null
  try {
    if (provider === 'openai') {
      result = await extractWithOpenAI(apiKey, text)
    } else {
      result = await extractWithGemini(apiKey, text)
    }

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const recipe = JSON.parse(result)

    if (recipe.error || !recipe.name || !recipe.ingredients || !recipe.instructions) {
      throw new Error('No valid recipe found in the text.')
    }

    return recipe
  } catch (error) {
    console.error(`Error during recipe extraction with ${provider}:`, error)
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`)
    }
    throw new Error('Failed to extract recipe from text.')
  }
}
