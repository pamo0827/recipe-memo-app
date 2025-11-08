'use client'

import { useEffect, useState, useMemo, ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { getRecipes, createRecipe, deleteRecipe, updateRecipe, updateRecipeOrder } from '@/lib/recipes'
import type { Recipe } from '@/lib/supabase'
import { LogOut, Trash2, Settings, Search, Upload, Plus, GripVertical, CheckSquare, Square, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const supportedSites = [
  { name: 'Cookpad', url: 'https://cookpad.com/jp/', favicon: 'https://www.google.com/s2/favicons?domain=cookpad.com&sz=64' },
  { name: 'バズレシピ.com', url: 'https://bazurecipe.com/', favicon: 'https://www.google.com/s2/favicons?domain=bazurecipe.com&sz=64' },
  { name: 'クラシル', url: 'https://www.kurashiru.com/', favicon: 'https://www.google.com/s2/favicons?domain=www.kurashiru.com&sz=64' },
  { name: 'DELISH KITCHEN', url: 'https://delishkitchen.tv/', favicon: 'https://www.google.com/s2/favicons?domain=delishkitchen.tv&sz=64' },
  { name: '白ごはん.com', url: 'https://www.sirogohan.com/', favicon: 'https://www.google.com/s2/favicons?domain=sirogohan.com&sz=64' },
  { name: 'Nadia', url: 'https://oceans-nadia.com/', favicon: 'https://www.google.com/s2/favicons?domain=oceans-nadia.com&sz=64' },
  { name: 'AJINOMOTO PARK', url: 'https://park.ajinomoto.co.jp/', favicon: 'https://www.google.com/s2/favicons?domain=park.ajinomoto.co.jp&sz=64' },
  { name: 'みんなのきょうの料理', url: 'https://www.kyounoryouri.jp/', favicon: 'https://www.google.com/s2/favicons?domain=kyounoryouri.jp&sz=64' },
  { name: '楽天レシピ', url: 'https://recipe.rakuten.co.jp/', favicon: 'https://www.google.com/s2/favicons?domain=recipe.rakuten.co.jp&sz=64' },
  { name: 'YouTube', url: 'https://www.youtube.com/', favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64', note: '※概要欄にレシピがある場合のみ' }
];

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

type CategoryHeader = {
  id: string
  type: 'category'
  name: string
}

type RecipeItem = Recipe & {
  type: 'recipe'
}

type ListItem = CategoryHeader | RecipeItem

function SortableCategoryHeader({ category, onDelete, onEdit }: { category: CategoryHeader; onDelete: (id: string) => void; onEdit: (id: string, newName: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(category.id, editName.trim())
      setIsEditing(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg px-3 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-amber-600" />
        </div>
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') {
                setEditName(category.name)
                setIsEditing(false)
              }
            }}
            className="fluid-text-sm font-bold text-amber-900 bg-white border-amber-300 h-7"
            autoFocus
          />
        ) : (
          <h2
            className="fluid-text-sm font-bold text-amber-900 cursor-pointer hover:text-amber-700"
            onClick={() => setIsEditing(true)}
          >
            {category.name}
          </h2>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6" title="カテゴリーを削除">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

function SortableRecipeItem({
  recipe,
  faviconUrl,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onUpdateRecipe
}: {
  recipe: Recipe;
  faviconUrl: string | null;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateRecipe: (id: string, updates: Partial<Recipe>) => void;
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingUrl, setEditingUrl] = useState(false)
  const [editingIngredients, setEditingIngredients] = useState(false)
  const [editingInstructions, setEditingInstructions] = useState(false)
  const [tempName, setTempName] = useState(recipe.name)
  const [tempUrl, setTempUrl] = useState(recipe.source_url || '')
  const [tempIngredients, setTempIngredients] = useState(recipe.ingredients)
  const [tempInstructions, setTempInstructions] = useState(recipe.instructions)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: recipe.id, disabled: isSelectionMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveName = () => {
    if (tempName !== recipe.name && tempName.trim()) {
      onUpdateRecipe(recipe.id, { name: tempName })
    }
    setEditingName(false)
  }

  const handleSaveUrl = () => {
    if (tempUrl !== recipe.source_url) {
      onUpdateRecipe(recipe.id, { source_url: tempUrl || undefined })
    }
    setEditingUrl(false)
  }

  const handleSaveIngredients = () => {
    if (tempIngredients !== recipe.ingredients && tempIngredients.trim()) {
      onUpdateRecipe(recipe.id, { ingredients: tempIngredients })
    }
    setEditingIngredients(false)
  }

  const handleSaveInstructions = () => {
    if (tempInstructions !== recipe.instructions && tempInstructions.trim()) {
      onUpdateRecipe(recipe.id, { instructions: tempInstructions })
    }
    setEditingInstructions(false)
  }

  return (
    <AccordionItem ref={setNodeRef} style={style} key={recipe.id} value={`item-${recipe.id}`} className={`border rounded-lg shadow-sm transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:shadow-md'}`}>
      <div className="flex items-center justify-between pr-2">
        <div className="flex items-center flex-1">
          {isSelectionMode ? (
            <div className="px-3 py-4 cursor-pointer" onClick={() => onToggleSelect(recipe.id)}>
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-amber-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </div>
          ) : (
            <div {...attributes} {...listeners} className="px-3 py-4 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <AccordionTrigger className="flex-1 pr-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {faviconUrl && (
                <img src={faviconUrl} alt="" className="h-6 w-6 rounded flex-shrink-0" />
              )}
              {editingName ? (
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setTempName(recipe.name)
                      setEditingName(false)
                    }
                  }}
                  autoFocus
                  className="fluid-text-base font-semibold bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="fluid-text-base font-semibold text-left truncate line-clamp-1 cursor-text"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingName(true)
                  }}
                >
                  {recipe.name}
                </span>
              )}
            </div>
          </AccordionTrigger>
        </div>
      </div>
      <AccordionContent className="px-6 pt-0 pb-6">
        <div className="space-y-6">
          {(recipe.source_url || editingUrl) && (
            editingUrl ? (
              <Input
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                onBlur={handleSaveUrl}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUrl()
                  if (e.key === 'Escape') {
                    setTempUrl(recipe.source_url || '')
                    setEditingUrl(false)
                  }
                }}
                autoFocus
                className="text-sm bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="URL"
              />
            ) : (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline bg-gray-100 px-3 py-1.5 rounded-md transition-colors break-all cursor-text"
                onDoubleClick={(e) => {
                  e.preventDefault()
                  setEditingUrl(true)
                }}
              >
                {recipe.source_url}
              </a>
            )
          )}
          <div className="space-y-6">
            <div className="border-l-4 border-yellow-500 pl-5 py-1">
              <h3 className="font-semibold text-gray-900 text-base mb-2">材料</h3>
              {editingIngredients ? (
                <Textarea
                  value={tempIngredients}
                  onChange={(e) => setTempIngredients(e.target.value)}
                  onBlur={handleSaveIngredients}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTempIngredients(recipe.ingredients)
                      setEditingIngredients(false)
                    }
                  }}
                  autoFocus
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[100px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              ) : (
                <p
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed cursor-text"
                  onDoubleClick={() => setEditingIngredients(true)}
                >
                  {recipe.ingredients}
                </p>
              )}
            </div>
            <div className="border-l-4 border-amber-500 pl-5 py-1">
              <h3 className="font-semibold text-gray-900 text-base mb-2">作り方</h3>
              {editingInstructions ? (
                <Textarea
                  value={tempInstructions}
                  onChange={(e) => setTempInstructions(e.target.value)}
                  onBlur={handleSaveInstructions}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTempInstructions(recipe.instructions)
                      setEditingInstructions(false)
                    }
                  }}
                  autoFocus
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[150px] bg-white border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              ) : (
                <p
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed cursor-text"
                  onDoubleClick={() => setEditingInstructions(true)}
                >
                  {recipe.instructions}
                </p>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<CategoryHeader[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [recipeUrl, setRecipeUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [isSearchVisible, setSearchVisible] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load categories from localStorage
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`categories_${userId}`)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setCategories(data.categories || [])
        } catch (e) {
          console.error('Failed to parse categories:', e)
        }
      }
    }
  }, [userId])

  // Save categories to localStorage
  useEffect(() => {
    if (userId && categories.length > 0) {
      localStorage.setItem(`categories_${userId}`, JSON.stringify({
        categories,
      }))
    }
  }, [categories, userId])

  // Rebuild listItems when recipes or categories change
  useEffect(() => {
    const stored = localStorage.getItem(`listOrder_${userId}`)
    let order: string[] = []

    if (stored) {
      try {
        order = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse list order:', e)
      }
    }

    // Create a map of all items
    const itemsMap = new Map<string, ListItem>()
    categories.forEach(cat => itemsMap.set(cat.id, cat))
    recipes.forEach(recipe => itemsMap.set(recipe.id, { ...recipe, type: 'recipe' }))

    // Build list based on saved order
    const orderedItems: ListItem[] = []
    order.forEach(id => {
      const item = itemsMap.get(id)
      if (item) {
        orderedItems.push(item)
        itemsMap.delete(id)
      }
    })

    // Add remaining items (new recipes/categories)
    itemsMap.forEach(item => orderedItems.push(item))

    setListItems(orderedItems)
  }, [recipes, categories, userId])

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }
    setUserId(user.id)

    // ニックネームを取得
    const { data: settings } = await supabase
      .from('user_settings')
      .select('nickname')
      .eq('user_id', user.id)
      .single()

    if (settings?.nickname) {
      setNickname(settings.nickname)
    }

    loadRecipes(user.id)
  }

  const loadRecipes = async (uid: string) => {
    setLoading(true)
    const data = await getRecipes(uid)
    setRecipes(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleUpdateRecipe = async (id: string, updates: Partial<Recipe>) => {
    const updatedRecipe = await updateRecipe(id, updates)
    if (updatedRecipe) {
      setRecipes(recipes.map(r => r.id === id ? updatedRecipe : r))
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = listItems.findIndex((item) => item.id === active.id)
    const newIndex = listItems.findIndex((item) => item.id === over.id)

    const newListItems = arrayMove(listItems, oldIndex, newIndex)
    setListItems(newListItems)

    // Save the new order to localStorage
    if (userId) {
      localStorage.setItem(`listOrder_${userId}`, JSON.stringify(newListItems.map(item => item.id)))
    }

    // Update recipe order in database
    const recipeIds = newListItems.filter(item => item.type === 'recipe').map(item => item.id)
    await updateRecipeOrder(recipeIds)
  }

  const handleAddCategory = () => {
    const newCategory: CategoryHeader = {
      id: `category_${Date.now()}`,
      type: 'category',
      name: '新しいカテゴリー',
    }
    setCategories([...categories, newCategory])
    setListItems([...listItems, newCategory])
  }

  const handleDeleteCategory = (id: string) => {
    if (confirm('このカテゴリーを削除しますか？')) {
      setCategories(categories.filter(c => c.id !== id))
      setListItems(listItems.filter(item => item.id !== id))
    }
  }

  const handleEditCategory = (id: string, newName: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name: newName } : c))
    setListItems(listItems.map(item =>
      item.type === 'category' && item.id === id ? { ...item, name: newName } : item
    ))
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      setSelectedIds(new Set())
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const recipeIds = listItems.filter(item => item.type === 'recipe').map(item => item.id)
    setSelectedIds(new Set(recipeIds))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size}件のレシピを削除しますか？`)) return

    const deletePromises = Array.from(selectedIds).map(id => deleteRecipe(id))
    await Promise.all(deletePromises)

    setRecipes(recipes.filter(r => !selectedIds.has(r.id)))
    setListItems(listItems.filter(item => !selectedIds.has(item.id)))
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  const handleAddFromUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipeUrl || !userId) return
    setIsScraping(true)
    setScrapeError('')
    try {
      const response = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recipeUrl, userId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        setScrapeError(errorData.error || 'レシピの取得に失敗しました')
        return
      }
      const data = await response.json()
      const recipe = await createRecipe(userId, {
        name: data.name,
        ingredients: data.ingredients,
        instructions: data.instructions,
        source_url: recipeUrl,
      })
      if (recipe) {
        setRecipes([recipe, ...recipes])
        setRecipeUrl('')
        setAddDialogOpen(false)
      }
    } catch (error) {
      console.error('Scrape error:', error)
      setScrapeError('レシピの取得に失敗しました')
    } finally {
      setIsScraping(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setUploadError('')
      setUploadSuccess('')
    }
  }

  const handleAddFromFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !userId) return

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('userId', userId)

    try {
      const response = await fetch('/api/ocr-recipe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        setUploadError(errorData.error || 'レシピの解析に失敗しました')
        return
      }

      const result = await response.json()

      if (result.type === 'recipe') {
        const recipe = await createRecipe(userId, {
          name: result.data.name || '名称未設定のレシピ',
          ingredients: result.data.ingredients,
          instructions: result.data.instructions,
          source_url: `file://${selectedFile.name}`,
        })
        if (recipe) {
          setRecipes([recipe, ...recipes])
          setUploadSuccess('1件のレシピを追加しました。')
        }
      } else if (result.type === 'summary') {
        setUploadSuccess(result.data.message)
        await loadRecipes(userId) // Refresh the list
      } else {
        throw new Error('Invalid response type from server.')
      }

      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload-dialog') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      setAddDialogOpen(false)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('レシピの解析中にエラーが発生しました。')
    } finally {
      setIsUploading(false)
    }
  }

  const filteredListItems = useMemo(() => {
    if (!searchTerm) return listItems
    const lowercasedTerm = searchTerm.toLowerCase()
    return listItems.filter(item => {
      if (item.type === 'category') {
        return item.name.toLowerCase().includes(lowercasedTerm)
      } else {
        return item.name.toLowerCase().includes(lowercasedTerm) ||
          item.ingredients.toLowerCase().includes(lowercasedTerm) ||
          (item.description && item.description.toLowerCase().includes(lowercasedTerm))
      }
    })
  }, [listItems, searchTerm])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">読み込み中...</div></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
          <div>
            {nickname && <p className="fluid-text-lg font-bold">{nickname}さん</p>}
          </div>
          <div className="flex items-center gap-2">
            {!isSelectionMode && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setSearchVisible(!isSearchVisible)} title="検索" className="hover:bg-gray-50"><Search className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleSelectionMode} title="削除" className="hover:bg-gray-50"><Trash2 className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} title="設定" className="hover:bg-gray-50"><Settings className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="ログアウト" className="hover:bg-gray-50"><LogOut className="h-5 w-5" /></Button>
              </>
            )}
          </div>
        </div>

        {isSelectionMode && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="fluid-text-sm font-medium text-amber-900">{selectedIds.size}件選択中</span>
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-8">全選択</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="h-8">選択解除</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={selectedIds.size === 0} className="h-8">
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="h-8">
                <X className="h-4 w-4 mr-1" />
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {isSearchVisible && (
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input type="text" placeholder="レシピ名や材料で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 text-base" />
            </div>
          </div>
        )}

        {filteredListItems.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="text-center py-20">
              <p className="text-gray-500 fluid-text-lg mb-2 font-medium">{searchTerm ? '一致するレシピがありません' : 'レシピがありません'}</p>
              <p className="text-gray-400 fluid-text-sm">{searchTerm ? '検索ワードを変えてみてください' : '右下の「＋」ボタンから追加してみましょう'}</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredListItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredListItems.map((item) => {
                  if (item.type === 'category') {
                    return (
                      <SortableCategoryHeader
                        key={item.id}
                        category={item}
                        onDelete={handleDeleteCategory}
                        onEdit={handleEditCategory}
                      />
                    )
                  } else {
                    const faviconUrl = item.source_url ? getFaviconUrl(item.source_url) : null
                    return (
                      <SortableRecipeItem
                        key={item.id}
                        recipe={item}
                        faviconUrl={faviconUrl}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleItemSelection}
                        onUpdateRecipe={handleUpdateRecipe}
                      />
                    )
                  }
                })}
              </Accordion>
            </SortableContext>
            <DragOverlay>
              {activeId ? (() => {
                const item = listItems.find(i => i.id === activeId)
                if (!item) return null
                if (item.type === 'category') {
                  return (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="h-4 w-4 text-amber-600" />
                        <h2 className="fluid-text-sm font-bold text-amber-900">{item.name}</h2>
                      </div>
                    </div>
                  )
                } else {
                  const faviconUrl = item.source_url ? getFaviconUrl(item.source_url) : null
                  return (
                    <div className="border border-gray-200 rounded-lg shadow-lg bg-white">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center flex-1">
                          <div className="px-3 py-4">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 pr-6 py-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {faviconUrl && (
                                <img src={faviconUrl} alt="" className="h-6 w-6 rounded flex-shrink-0" />
                              )}
                              <span className="fluid-text-base font-semibold text-left truncate line-clamp-1">{item.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* メニューボタン */}
      <div className={`fixed bottom-24 right-6 flex flex-col gap-3 z-40 transition-all duration-300 ease-in-out ${
        isMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <Button
          variant="default"
          className="h-12 px-6 shadow-lg rounded-full transition-transform duration-200 hover:scale-105"
          onClick={() => {
            setMenuOpen(false)
            handleAddCategory()
          }}
        >
          カテゴリーを追加
        </Button>
        <Button
          variant="default"
          className="h-12 px-6 shadow-lg rounded-full transition-transform duration-200 hover:scale-105"
          onClick={() => {
            setMenuOpen(false)
            setAddDialogOpen(true)
          }}
        >
          レシピを追加
        </Button>
      </div>

      {/* 右下の＋ボタン */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg z-50 transition-transform duration-300 hover:scale-110"
        aria-label="メニューを開く"
        onClick={() => setMenuOpen(!isMenuOpen)}
      >
        <Plus className={`h-8 w-8 transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-center">レシピの追加</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="url" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URLから追加</TabsTrigger>
              <TabsTrigger value="file">写真から追加</TabsTrigger>
            </TabsList>
            <TabsContent value="url">
              <Card className="border-none shadow-none">
                <CardContent className="pt-6">
                  <form onSubmit={handleAddFromUrl} className="space-y-4">
                    <div className="space-y-2">
                      <Input id="url-input" type="url" value={recipeUrl} onChange={(e) => setRecipeUrl(e.target.value)} placeholder="https://cookpad.com/recipe/..." required disabled={isScraping} className="text-base h-11" />
                    </div>
                    {scrapeError && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{scrapeError}</div>}
                    <Button type="submit" disabled={isScraping || !recipeUrl} className="w-full h-11">{isScraping ? '解析中...' : 'レシピを解析'}</Button>
                  </form>
                  <div className="mt-6">
                    <h2 className="text-xs font-semibold text-gray-500 mb-3 text-center">動作確認済みサイト</h2>
                    <div className="flex justify-center items-center gap-x-5 gap-y-3 flex-wrap">
                      {supportedSites.map((site) => (
                        <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                          <img src={site.favicon} alt={`${site.name} favicon`} className="h-4 w-4 rounded-full" />
                          <span className="text-xs font-medium group-hover:underline">{site.name}</span>
                          {site.note && <span className="text-xs text-gray-400">{site.note}</span>}
                        </a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="file">
              <Card className="border-none shadow-none">
                <CardContent className="pt-6">
                  <form onSubmit={handleAddFromFile} className="space-y-4">
                    <div className="space-y-2">
                      <Input id="file-upload-dialog" type="file" onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" required disabled={isUploading} />
                    </div>
                    {uploadError && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{uploadError}</div>}
                    {uploadSuccess && <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg">{uploadSuccess}</div>}
                    <Button type="submit" disabled={isUploading || !selectedFile} className="w-full h-11"><Upload className="mr-2 h-4 w-4" />{isUploading ? '解析中...' : 'レシピを解析'}</Button>
                  </form>
                  <div className="text-xs text-gray-500 text-center mt-6">
                    <p>レシピが記載された画像をアップロードすれば、</p>
                    <p>文字やURLを解析して自動で追加します。</p>
                    <p className="mt-1">対応形式：JPEG、PNG、PDF</p>
                    <p className="mt-1 text-amber-600">※Gemini APIキー限定機能</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
