'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ButtonGuard } from '@/components/auth/permission-guard'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  MoreHorizontal,
  UserCog,
  Shield,
  Hash,
  ArrowRightLeft
} from 'lucide-react'
import { COUNTRY_CODES, POPULAR_COUNTRY_CODES } from '@/lib/country-codes'

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

interface UserManagementProps {
  canManage: boolean
  searchTerm: string
}

/**
 * 用户管理组件
 */
export function UserManagement({ canManage, searchTerm }: UserManagementProps) {
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
    active: true,
    firstName: '',
    lastName: '',
    bio: ''
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

  // 邀请用户
  const handleCreateUser = async () => {
    // 表单验证
    if (!formData.email.trim()) {
      toast.error('邮箱不能为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('邀请邮件已发送到用户邮箱')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', countryCode: '+86', active: true, firstName: '', lastName: '', bio: '' })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || '发送邀请失败')
      }
    } catch (error) {
      console.error('发送邀请失败:', error)
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

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('用户信息更新成功')
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
      active: user.active,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      bio: user.profile?.bio || ''
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
                  邀请用户
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
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? '活跃' : '禁用'}
                    </Badge>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openViewDialog(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        {canManage && (
                          <ButtonGuard permission="users.edit">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑用户
                            </DropdownMenuItem>
                          </ButtonGuard>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.active)}>
                          {user.active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              禁用账号
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              启用账号
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          变更部门
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          操作离职
                        </DropdownMenuItem>
                        {canManage && (
                          <ButtonGuard permission="users.delete">
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              重置登录密码
                            </DropdownMenuItem>
                          </ButtonGuard>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>邀请新用户</DialogTitle>
            <DialogDescription>
              填写用户信息并发送邀请邮件，用户将通过邮件设置密码并激活账户
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">基本信息</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    显示姓名
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入显示姓名"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    名
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入名"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    姓
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入姓"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bio" className="text-right">
                    个人简介
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="col-span-3 min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                    placeholder="请输入个人简介"
                    rows={3}
                  />
                </div>

              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">联系信息</h4>
              <div className="grid gap-4">
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
                        {/* 常用国家代码 */}
                        {POPULAR_COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code} {country.name}
                          </SelectItem>
                        ))}
                        <Separator className="my-2" />
                        {/* 所有国家代码 */}
                        {COUNTRY_CODES.filter(country =>
                          !POPULAR_COUNTRY_CODES.some(popular => popular.code === country.code)
                        ).map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code} {country.name}
                          </SelectItem>
                        ))}
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
              </div>
            </div>

            {/* 账户设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">账户设置</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    账户状态
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: !!checked })}
                    />
                    <Label htmlFor="active">邀请后立即激活账户</Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div></div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    用户将收到邮件邀请，通过邮件链接设置密码并完成注册
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUser}>
              发送邀请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">基本信息</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    显示姓名
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入显示姓名"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-firstName" className="text-right">
                    名
                  </Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入名"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-lastName" className="text-right">
                    姓
                  </Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入姓"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-bio" className="text-right">
                    个人简介
                  </Label>
                  <textarea
                    id="edit-bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="col-span-3 min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                    placeholder="请输入个人简介"
                    rows={3}
                  />
                </div>

              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">联系信息</h4>
              <div className="grid gap-4">
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
                        {/* 常用国家代码 */}
                        {POPULAR_COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code} {country.name}
                          </SelectItem>
                        ))}
                        <Separator className="my-2" />
                        {/* 所有国家代码 */}
                        {COUNTRY_CODES.filter(country =>
                          !POPULAR_COUNTRY_CODES.some(popular => popular.code === country.code)
                        ).map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code} {country.name}
                          </SelectItem>
                        ))}
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
              </div>
            </div>

            {/* 安全设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">安全设置</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    密码重置
                  </Label>
                  <div className="col-span-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/users/${selectedUser?.id}/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          })
                          if (response.ok) {
                            toast.success('密码重置邮件已发送')
                          } else {
                            const error = await response.json()
                            toast.error(error.message || '发送重置邮件失败')
                          }
                        } catch (error) {
                          console.error('发送重置邮件失败:', error)
                          toast.error('网络错误，请稍后重试')
                        }
                      }}
                    >
                      发送重置邮件
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      用户将收到邮件并可重新设置密码
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-active" className="text-right">
                    账户状态
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
                    <Label className="text-xs text-muted-foreground">显示姓名</Label>
                    <p className="text-sm">{selectedUser.profile?.name || '未设置'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">姓</Label>
                    <p className="text-sm">{selectedUser.profile?.lastName || '未设置'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">名</Label>
                    <p className="text-sm">{selectedUser.profile?.firstName || '未设置'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">状态</Label>
                    <Badge variant={selectedUser.active ? 'default' : 'destructive'}>
                      {selectedUser.active ? '活跃' : '禁用'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">个人简介</Label>
                    <p className="text-sm mt-1">{selectedUser.profile?.bio || '未设置'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">头像</Label>
                    <div className="flex items-center space-x-3 mt-1">
                      {selectedUser.profile?.avatar ? (
                        <Image
                          src={selectedUser.profile.avatar}
                          alt="用户头像"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.profile?.avatar || '未设置头像'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">联系信息</h4>
                <div className="grid grid-cols-2 gap-4">
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