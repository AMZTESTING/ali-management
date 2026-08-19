import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Plus, Edit, Trash2, X, Package, AlertTriangle, Link2, Unlink } from 'lucide-react'

export default function Ingredients() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { 
    ingredients, 
    products, 
    units, 
    suppliers, 
    recipes,
    addIngredient, 
    updateIngredient, 
    deleteIngredient,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState<number | null>(null)
  
  // ✅ cost أصبح string للحفاظ على الأصفار
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    unit: 'g',
    quantity: 0,
    minimumStock: 0,
    cost: '',
    supplierId: '',
  })

  const [recipeForm, setRecipeForm] = useState<{ ingredientId: string; quantity: number }[]>([])

  const handleSubmit = () => {
    if (!formData.name || !formData.nameAr) return
    
    const costNumber = parseFloat(formData.cost) || 0
    
    if (editingIngredient) {
      const existing = ingredients.find(i => i.id === editingIngredient)
      if (existing) {
        updateIngredient({ ...existing, ...formData, cost: costNumber })
      }
      setEditingIngredient(null)
    } else {
      addIngredient({ ...formData, cost: costNumber })
    }
    
    setFormData({ name: '', nameAr: '', unit: 'g', quantity: 0, minimumStock: 0, cost: '', supplierId: '' })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const ing = ingredients.find(i => i.id === id)
    if (ing) {
      setFormData({
        name: ing.name,
        nameAr: ing.nameAr,
        unit: ing.unit,
        quantity: ing.quantity,
        minimumStock: ing.minimumStock,
        cost: ing.cost.toString(), // ✅ تحويل الرقم إلى نص
        supplierId: ing.supplierId,
      })
      setEditingIngredient(id)
      setShowAdd(true)
    }
  }

  const openRecipeModal = (productId: number) => {
    const existingRecipe = recipes.find(r => r.productId === productId)
    if (existingRecipe) {
      setRecipeForm(existingRecipe.ingredients)
    } else {
      setRecipeForm([])
    }
    setShowRecipeModal(productId)
  }

  const addIngredientToRecipe = () => {
    setRecipeForm(prev => [...prev, { ingredientId: '', quantity: 0 }])
  }

  const updateRecipeIngredient = (index: number, field: string, value: string | number) => {
    setRecipeForm(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeRecipeIngredient = (index: number) => {
    setRecipeForm(prev => prev.filter((_, i) => i !== index))
  }

  const saveRecipe = () => {
    if (!showRecipeModal) return
    
    const validIngredients = recipeForm.filter(ri => ri.ingredientId && ri.quantity > 0)
    
    const existingRecipe = recipes.find(r => r.productId === showRecipeModal)
    if (existingRecipe) {
      updateRecipe({ productId: showRecipeModal, ingredients: validIngredients })
    } else {
      addRecipe({ productId: showRecipeModal, ingredients: validIngredients })
    }
    
    setShowRecipeModal(null)
  }

  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    return unit ? (isRTL ? unit.nameAr : unit.name) : unitId
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier ? supplier.name : '-'
  }

  const getProductWithRecipe = (productId: number) => {
    const product = products.find(p => p.id === productId)
    return product ? (isRTL ? product.nameAr : product.name) : ''
  }

  const isLowStock = (ing: typeof ingredients[0]) => {
    return ing.quantity <= ing.minimumStock
  }

  const columns = [
    { key: 'name', label: 'Ingredient', labelAr: 'المكون' },
    { key: 'quantity', label: 'Quantity', labelAr: 'الكمية' },
    { key: 'minStock', label: 'Min Stock', labelAr: 'الحد الأدنى' },
    { key: 'cost', label: 'Cost', labelAr: 'التكلفة' },
    { key: 'supplier', label: 'Supplier', labelAr: 'المورد' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (ing: any, column: any) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{isRTL ? ing.nameAr : ing.name}</p>
              <p className="text-xs text-gray-400">{getUnitName(ing.unit)}</p>
            </div>
          </div>
        )
      case 'quantity':
        return (
          <span className={`font-semibold ${isLowStock(ing) ? 'text-red-500' : 'text-green-600'}`}>
            {ing.quantity.toLocaleString()} {getUnitName(ing.unit)}
          </span>
        )
      case 'minStock':
        return <span className="text-sm text-gray-500">{ing.minimumStock} {getUnitName(ing.unit)}</span>
      case 'cost':
        // ✅ عرض التكلفة بثلاث خانات عشرية
        return <span className="text-sm">{ing.cost.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
      case 'supplier':
        return <span className="text-sm">{getSupplierName(ing.supplierId)}</span>
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleEdit(ing.id)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => deleteIngredient(ing.id)} className="p-2 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'المكونات' : 'Ingredients'}</h1>
        <button onClick={() => { setShowAdd(true); setEditingIngredient(null); setFormData({ name: '', nameAr: '', unit: 'g', quantity: 0, minimumStock: 0, cost: '', supplierId: '' }) }} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة مكون' : 'Add Ingredient'}
        </button>
      </div>

      {ingredients.filter(i => isLowStock(i)).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{isRTL ? 'تنبيه: مكونات منخفضة المخزون' : 'Warning: Low stock ingredients'}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {ingredients.filter(i => isLowStock(i)).map(ing => (
              <span key={ing.id} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                {isRTL ? ing.nameAr : ing.name}: {ing.quantity} {getUnitName(ing.unit)}
              </span>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={ingredients}
        renderCell={renderCell}
        emptyMessage="No ingredients found"
        emptyMessageAr="لا توجد مكونات"
      />

      {/* وصفات المنتجات */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-accent" />
          {isRTL ? 'وصفات المنتجات (المكونات)' : 'Product Recipes'}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.filter(p => p.productType === 'recipe').map(product => {
            const recipe = recipes.find(r => r.productId === product.id)
            return (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">{isRTL ? product.nameAr : product.name}</p>
                  {recipe ? (
                    <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full">{isRTL ? 'مربوط' : 'Linked'}</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{isRTL ? 'غير مربوط' : 'Not Linked'}</span>
                  )}
                </div>
                
                {recipe && recipe.ingredients.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {recipe.ingredients.map((ri, i) => {
                      const ing = ingredients.find(x => x.id === ri.ingredientId)
                      return (
                        <div key={i} className="text-xs text-gray-500 flex justify-between">
                          <span>{ing ? (isRTL ? ing.nameAr : ing.name) : ri.ingredientId}</span>
                          <span>{ri.quantity} {ing ? getUnitName(ing.unit) : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => openRecipeModal(product.id)} className="flex-1 py-2 bg-primary/5 text-primary rounded-lg text-sm hover:bg-primary/10 flex items-center justify-center gap-1">
                    <Link2 className="w-4 h-4" />
                    {recipe ? (isRTL ? 'تعديل الوصفة' : 'Edit Recipe') : (isRTL ? 'إضافة وصفة' : 'Add Recipe')}
                  </button>
                  {recipe && (
                    <button onClick={() => deleteRecipe(product.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                      <Unlink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* نافذة إضافة/تعديل مكون */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingIngredient ? (isRTL ? 'تعديل' : 'Edit') : (isRTL ? 'إضافة' : 'Add')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'الوحدة الأساسية' : 'Base Unit'}</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none">
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{isRTL ? unit.nameAr : unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'المورد' : 'Supplier'}</label>
                <select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none">
                  <option value="">{isRTL ? 'اختر المورد' : 'Select supplier'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'الكمية الحالية' : 'Current Quantity'}</label>
                <input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'الحد الأدنى' : 'Min Stock'}</label>
                <input type="number" min="0" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'التكلفة (لكل وحدة أساسية)' : 'Cost (per base unit)'}</label>
              {/* ✅ حقل نصي للحفاظ على الأصفار */}
              <input 
                type="text" 
                inputMode="decimal" 
                value={formData.cost} 
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })} 
                className="w-full px-3 py-2 border rounded-xl outline-none" 
                placeholder="0.000"
              />
            </div>

            <button onClick={handleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">
              {isRTL ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* نافذة الوصفة */}
      {showRecipeModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {isRTL ? 'وصفة' : 'Recipe'}: {getProductWithRecipe(showRecipeModal)}
              </h3>
              <button onClick={() => setShowRecipeModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {recipeForm.map((ri, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={ri.ingredientId}
                    onChange={(e) => updateRecipeIngredient(index, 'ingredientId', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg outline-none text-sm"
                  >
                    <option value="">{isRTL ? 'اختر المكون' : 'Select ingredient'}</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{isRTL ? ing.nameAr : ing.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={ri.quantity}
                    onChange={(e) => updateRecipeIngredient(index, 'quantity', Number(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-lg outline-none text-sm"
                    placeholder={isRTL ? 'كمية' : 'Qty'}
                  />
                  <button onClick={() => removeRecipeIngredient(index)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addIngredientToRecipe} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-accent hover:text-accent">
              + {isRTL ? 'إضافة مكون' : 'Add Ingredient'}
            </button>

            <button onClick={saveRecipe} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">
              {isRTL ? 'حفظ الوصفة' : 'Save Recipe'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}