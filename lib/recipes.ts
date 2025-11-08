import { supabase } from './supabase'
import type { Recipe, RecipeInput } from './supabase'

export async function getRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('レシピ取得エラー:', error)
    return []
  }

  return data || []
}

export async function createRecipe(userId: string, recipe: RecipeInput): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert([{ ...recipe, user_id: userId }])
    .select()
    .single()

  if (error) {
    console.error('レシピ作成エラー:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('Attempted to insert:', { ...recipe, user_id: userId })
    return null
  }

  return data
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('レシピ削除エラー:', error)
    return false
  }

  return true
}

export async function updateRecipe(id: string, updates: Partial<RecipeInput>): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('レシピ更新エラー:', error)
    return null
  }

  return data
}

export async function updateRecipeOrder(recipeIds: string[]): Promise<boolean> {
  // Update display_order for each recipe
  const updates = recipeIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }))

  const { error } = await supabase
    .from('recipes')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    console.error('レシピ順序の更新エラー:', error)
    return false
  }

  return true
}
