
'use client'

/*
 * 权限管理页面
 * 用于管理用户权限、角色和组织结构
 */
import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PermissionGuard, ButtonGuard } from '@/components/auth/permission-guard'
import { usePermission, useUserPermissions } from '@/hooks/use-permission'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

/**
 * 权限管理主页面
 */

export default function PermissionsPage() {
  const { loading } = useUserPermissions()
  const { hasPermission: canManagePermissions } = usePermission('permissions.manage')
  const { hasPermission: canManageUsers } = usePermission('users.manage')
  const { hasPermission: canManageRoles } = usePermission('roles.manage')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('users')

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="permissions.view"
      fallback={
        <Alert variant="destructive" className="m-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            您没有权限访问权限管理页面
          </AlertDescription>
        </Alert>
      }
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* 主要内容区域 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="roles">角色管理</TabsTrigger>
            <TabsTrigger value="permissions">权限管理</TabsTrigger>
            <TabsTrigger value="organizations">组织管理</TabsTrigger>
          </TabsList>

          {/* 用户管理 */}
          <TabsContent value="users" className="space-y-4">
            <UserManagement
              canManage={canManageUsers}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 角色管理 */}
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement
              canManage={canManageRoles}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 权限管理 */}
          <TabsContent value="permissions" className="space-y-4">
            <PermissionManagement
              canManage={canManagePermissions}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 组织管理 */}
          <TabsContent value="organizations" className="space-y-4">
            <OrganizationManagement
              canManage={canManagePermissions}
              searchTerm={searchTerm}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}

// 用户数据类型定义
interface User {
  id: string
  email: string
  phone?: string
  countryCode?: string
  active: boolean
  emailVerifiedAt?: Date
  phoneVerifiedAt?: Date
  createdAt: Date
  updatedAt: Date
  profile?: {
    name?: string
    avatar?: string
    bio?: string
    firstName?: string
    lastName?: string
  }
  roles: {
    role: {
      id: string
      name: string
      code: string
      type: string
      level: number
    }
  }[]
  organizations: {
    organization: {
      id: string
      name: string
      code: string
    }
  }[]
  departments: {
    department: {
      id: string
      name: string
      code: string
    }
  }[]
}

/**
 * 用户管理组件
 */
function UserManagement({ canManage, searchTerm }: { canManage: boolean; searchTerm: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+86',
    password: '',
    active: true
  })

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data.users) ? data.users : [])
      } else {
        // API 请求失败，设置为空数组
        setUsers([])
        console.error('获取用户列表失败:', response.status, response.statusText)
        toast.error('获取用户列表失败')
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
      // 确保在错误情况下也设置为空数组
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 过滤用户
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone?.includes(searchTerm) || false)
    )
  }, [users, searchTerm])

  // 创建用户
  const handleCreateUser = async () => {
    // 表单验证
    if (!formData.email.trim()) {
      toast.error('邮箱不能为空')
      return
    }
    if (!formData.password.trim()) {
      toast.error('密码不能为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    if (formData.password.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('用户创建成功')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', countryCode: '+86', password: '', active: true })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || '创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      toast.error('网络错误，请稍后重试')
    }
  }

  // 更新用户
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    // 表单验证
    if (!formData.email.trim()) {
      toast.error('邮箱不能为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('用户更新成功')
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || '更新用户失败')
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      toast.error('网络错误，请稍后重试')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('用户删除成功')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || '删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      toast.error('删除用户失败')
    }
  }

  // 切换用户状态
  const handleToggleUserStatus = async (userId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active })
      })

      if (response.ok) {
        toast.success(`用户已${active ? '禁用' : '启用'}`)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || '操作失败')
      }
    } catch (error) {
      console.error('切换用户状态失败:', error)
      toast.error('操作失败')
    }
  }

  // 打开编辑对话框
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.profile?.name || '',
      email: user.email,
      phone: user.phone || '',
      countryCode: user.countryCode || '+86',
      password: '',
      active: user.active
    })
    setIsEditDialogOpen(true)
  }

  // 打开查看对话框
  const openViewDialog = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>管理系统用户和其权限分配</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户管理</CardTitle>
              <CardDescription>管理系统用户和其权限分配</CardDescription>
            </div>
            {canManage && (
              <ButtonGuard permission="users.create">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加用户
                </Button>
              </ButtonGuard>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>组织</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {user.profile?.avatar ? (
                        <Image src={user.profile.avatar} alt={user.profile?.name || '用户头像'} width={32} height={32} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span>{user.profile?.name || '未设置'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                      {user.emailVerifiedAt && (
                        <Badge variant="outline" className="text-xs">已验证</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{user.countryCode} {user.phone}</span>
                        {user.phoneVerifiedAt && (
                          <Badge variant="outline" className="text-xs">已验证</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">未设置</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((userRole) => (
                        <Badge
                          key={userRole.role.id}
                          variant={userRole.role.level <= 2 ? 'default' : 'secondary'}
                        >
                          {userRole.role.name}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-gray-400">无角色</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.organizations.map((userOrg) => (
                        <Badge key={userOrg.organization.id} variant="outline">
                          {userOrg.organization.name}
                        </Badge>
                      ))}
                      {user.organizations.length === 0 && (
                        <span className="text-gray-400">无组织</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.active ? 'default' : 'destructive'}>
                        {user.active ? '活跃' : '禁用'}
                      </Badge>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, user.active)}
                        >
                          {user.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <ButtonGuard permission="users.edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ButtonGuard>
                      )}
                      {canManage && (
                        <ButtonGuard permission="users.delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ButtonGuard>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '没有找到匹配的用户' : '暂无用户数据'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建用户对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>
              创建新的系统用户账户
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                姓名
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="请输入姓名"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱 *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="请输入邮箱地址"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                手机号
              </Label>
              <div className="col-span-3 flex space-x-2">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+86">+86</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                密码 *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                placeholder="请输入密码"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                状态
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: !!checked })}
                />
                <Label htmlFor="active">启用账户</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUser}>
              创建用户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                姓名
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="请输入姓名"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                邮箱 *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="请输入邮箱地址"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                手机号
              </Label>
              <div className="col-span-3 flex space-x-2">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+86">+86</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                新密码
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                placeholder="留空则不修改密码"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right">
                状态
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: !!checked })}
                />
                <Label htmlFor="edit-active">启用账户</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateUser}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看用户详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>
              查看用户的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">姓名</Label>
                    <p className="text-sm">{selectedUser.profile?.name || '未设置'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">邮箱</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">手机号</Label>
                    <p className="text-sm">
                      {selectedUser.phone ? `${selectedUser.countryCode} ${selectedUser.phone}` : '未设置'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">状态</Label>
                    <Badge variant={selectedUser.active ? 'default' : 'destructive'}>
                      {selectedUser.active ? '活跃' : '禁用'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 角色信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">角色信息</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.map((userRole) => (
                    <Badge key={userRole.role.id} variant="outline">
                      {userRole.role.name} (级别: {userRole.role.level})
                    </Badge>
                  ))}
                  {selectedUser.roles.length === 0 && (
                    <p className="text-sm text-muted-foreground">未分配角色</p>
                  )}
                </div>
              </div>

              {/* 组织信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">组织信息</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">所属组织</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.organizations.map((userOrg) => (
                        <Badge key={userOrg.organization.id} variant="outline">
                          {userOrg.organization.name}
                        </Badge>
                      ))}
                      {selectedUser.organizations.length === 0 && (
                        <p className="text-sm text-muted-foreground">未分配组织</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">所属部门</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.departments.map((userDept) => (
                        <Badge key={userDept.department.id} variant="outline">
                          {userDept.department.name}
                        </Badge>
                      ))}
                      {selectedUser.departments.length === 0 && (
                        <p className="text-sm text-muted-foreground">未分配部门</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">时间信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">创建时间</Label>
                    <p className="text-sm">
                      {new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">更新时间</Label>
                    <p className="text-sm">
                      {new Date(selectedUser.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">邮箱验证时间</Label>
                    <p className="text-sm">
                      {selectedUser.emailVerifiedAt
                        ? new Date(selectedUser.emailVerifiedAt).toLocaleString('zh-CN')
                        : '未验证'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">手机验证时间</Label>
                    <p className="text-sm">
                      {selectedUser.phoneVerifiedAt
                        ? new Date(selectedUser.phoneVerifiedAt).toLocaleString('zh-CN')
                        : '未验证'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 角色管理组件
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RoleManagement({ canManage: _canManage, searchTerm: _searchTerm }: { canManage: boolean; searchTerm: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>角色管理</CardTitle>
            <CardDescription>管理系统角色和权限分配</CardDescription>
          </div>
          <ButtonGuard permission="roles.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加角色
            </Button>
          </ButtonGuard>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          角色管理功能开发中...
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 权限管理组件
 */
function PermissionManagement({ canManage: _canManage, searchTerm: _searchTerm }: { canManage: boolean; searchTerm: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>权限管理</CardTitle>
            <CardDescription>管理系统权限和访问控制</CardDescription>
          </div>
          <ButtonGuard permission="permissions.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加权限
            </Button>
          </ButtonGuard>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          权限管理功能开发中...
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 组织管理组件
 */
function OrganizationManagement({ canManage: _canManage, searchTerm: _searchTerm }: { canManage: boolean; searchTerm: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>组织管理</CardTitle>
            <CardDescription>管理组织结构和部门设置</CardDescription>
          </div>
          <ButtonGuard permission="organizations.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加组织
            </Button>
          </ButtonGuard>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          组织管理功能开发中...
        </div>
      </CardContent>
    </Card>
  )
}