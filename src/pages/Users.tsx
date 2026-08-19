import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore, PERMISSION_KEYS } from '../context/StoreContext'
import DataTable from '../components/DataTable'
import { Plus, Edit, Trash2, X } from 'lucide-react'

export default function UsersPage() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { users, roles, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole } = useStore()
  
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')
  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleId: '', isActive: true })
  const [roleForm, setRoleForm] = useState({ name: '', nameAr: '', permissions: [] as string[] })

  // ============ إدارة المستخدمين ============
  const handleUserSubmit = () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.roleId) return
    if (editingUser) {
      updateUser({ id: editingUser, ...userForm, createdAt: users.find(u => u.id === editingUser)?.createdAt || new Date().toISOString() })
      setEditingUser(null)
    } else {
      addUser(userForm)
    }
    setUserForm({ name: '', email: '', password: '', roleId: '', isActive: true })
    setShowAdd(false)
  }

  const handleUserEdit = (id: string) => {
    const user = users.find(u => u.id === id)
    if (user) {
      setUserForm({ name: user.name, email: user.email, password: user.password, roleId: user.roleId, isActive: user.isActive })
      setEditingUser(id)
      setShowAdd(true)
    }
  }

  // ============ إدارة الأدوار ============
  const handleRoleSubmit = () => {
    if (!roleForm.name || !roleForm.nameAr) return
    if (editingRole) {
      updateRole({ id: editingRole, ...roleForm, createdAt: roles.find(r => r.id === editingRole)?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() })
      setEditingRole(null)
    } else {
      addRole(roleForm)
    }
    setRoleForm({ name: '', nameAr: '', permissions: [] })
    setShowAdd(false)
  }

  const handleRoleEdit = (id: string) => {
    const role = roles.find(r => r.id === id)
    if (role) {
      setRoleForm({ name: role.name, nameAr: role.nameAr, permissions: role.permissions })
      setEditingRole(id)
      setShowAdd(true)
    }
  }

  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    return role ? (isRTL ? role.nameAr : role.name) : '-'
  }

  // أعمدة المستخدمين
  const userColumns = [
    { key: 'name', label: 'User', labelAr: 'المستخدم' },
    { key: 'email', label: 'Email', labelAr: 'البريد' },
    { key: 'role', label: 'Role', labelAr: 'الدور' },
    { key: 'status', label: 'Status', labelAr: 'الحالة' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderUserCell = (user: any, column: any) => {
    switch (column.key) {
      case 'name': return <span className="font-medium">{user.name}</span>
      case 'email': return <span className="text-sm text-gray-600" dir="ltr">{user.email}</span>
      case 'role': return <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{getRoleName(user.roleId)}</span>
      case 'status': return <span className={user.isActive ? 'text-green-600' : 'text-gray-400'}>{user.isActive ? 'نشط' : 'غير نشط'}</span>
      case 'actions': return (
        <div className="flex gap-1">
          <button onClick={() => handleUserEdit(user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
          <button onClick={() => deleteUser(user.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      )
      default: return null
    }
  }

  // أعمدة الأدوار
  const roleColumns = [
    { key: 'name', label: 'Role', labelAr: 'الدور' },
    { key: 'permissions', label: 'Permissions', labelAr: 'الصلاحيات' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderRoleCell = (role: any, column: any) => {
    switch (column.key) {
      case 'name': return <span className="font-medium">{isRTL ? role.nameAr : role.name}</span>
      case 'permissions': return <span className="text-xs">{role.permissions.length} صلاحية</span>
      case 'actions': return (
        <div className="flex gap-1">
          <button onClick={() => handleRoleEdit(role.id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
          <button onClick={() => deleteRole(role.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      )
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'المستخدمين والأدوار' : 'Users & Roles'}</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" />
          {activeTab === 'users' ? (isRTL ? 'إضافة مستخدم' : 'Add User') : (isRTL ? 'إضافة دور' : 'Add Role')}
        </button>
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm">
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 rounded-xl text-sm font-medium ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-500'}`}>
          {isRTL ? 'المستخدمين' : 'Users'}
        </button>
        <button onClick={() => setActiveTab('roles')} className={`flex-1 py-3 rounded-xl text-sm font-medium ${activeTab === 'roles' ? 'bg-primary text-white' : 'text-gray-500'}`}>
          {isRTL ? 'الأدوار' : 'Roles'}
        </button>
      </div>

      {activeTab === 'users' ? (
        <DataTable columns={userColumns} data={users} renderCell={renderUserCell} emptyMessage="No users" emptyMessageAr="لا يوجد مستخدمين" />
      ) : (
        <DataTable columns={roleColumns} data={roles} renderCell={renderRoleCell} emptyMessage="No roles" emptyMessageAr="لا توجد أدوار" />
      )}

      {/* نافذة إضافة/تعديل */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {activeTab === 'users' ? (editingUser ? (isRTL ? 'تعديل مستخدم' : 'Edit User') : (isRTL ? 'إضافة مستخدم' : 'Add User'))
                  : (editingRole ? (isRTL ? 'تعديل دور' : 'Edit Role') : (isRTL ? 'إضافة دور' : 'Add Role'))}
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {activeTab === 'users' ? (
              <>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'الاسم' : 'Name'}</label>
                  <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'كلمة المرور' : 'Password'}</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'الدور' : 'Role'}</label>
                  <select value={userForm.roleId} onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none">
                    <option value="">{isRTL ? 'اختر الدور' : 'Select role'}</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{isRTL ? role.nameAr : role.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">{isRTL ? 'نشط' : 'Active'}</span>
                </label>
                <button onClick={handleUserSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">{isRTL ? 'حفظ' : 'Save'}</button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'اسم الدور (عربي)' : 'Role Name (Arabic)'}</label>
                  <input type="text" value={roleForm.nameAr} onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1">{isRTL ? 'اسم الدور (إنجليزي)' : 'Role Name (English)'}</label>
                  <input type="text" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{isRTL ? 'الصلاحيات' : 'Permissions'}</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {PERMISSION_KEYS.map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="w-4 h-4"
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handleRoleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">{isRTL ? 'حفظ' : 'Save'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}