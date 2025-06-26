'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizationStore } from '@/stores/org-management-store'
import { MemberService } from '@/services/member.service'

interface AddUserDialogProps {
    isOpen: boolean
    onClose: () => void
    departmentId?: string
    departmentName?: string
}

export function AddUserDialog({
    isOpen,
    onClose,
    departmentId,
    departmentName
}: AddUserDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+86',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        position: '',
        gender: 'PREFER_NOT_TO_SAY' as 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY',
        department: departmentName || '',
        bio: '',
        address: '',
        city: '',
        country: '中国'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { loadInitialData } = useOrganizationStore()

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async () => {
        // 基本验证
        if (!formData.name.trim()) {
            alert('请输入姓名')
            return
        }
        if (!formData.email.trim()) {
            alert('请输入邮箱')
            return
        }
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('两次输入的密码不一致')
            return
        }

        setIsSubmitting(true)
        try {
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || undefined,
                countryCode: formData.phone.trim() ? formData.countryCode : undefined,
                password: formData.password.trim() || undefined,
                firstName: formData.firstName.trim() || undefined,
                lastName: formData.lastName.trim() || undefined,
                gender: formData.gender,
                bio: formData.bio.trim() || undefined,
                address: formData.address.trim() || undefined,
                city: formData.city.trim() || undefined,
                country: formData.country.trim() || undefined,
                active: true
            }

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || '创建用户失败')
            }

            // 重新加载组织架构数据
            await loadInitialData()

            // 重置表单并关闭对话框
            handleClose()

            alert('用户创建成功！')
        } catch (error) {
            console.error('Error creating user:', error)
            alert(error instanceof Error ? error.message : '创建用户失败，请重试')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            countryCode: '+86',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            position: '',
            gender: 'PREFER_NOT_TO_SAY',
            department: departmentName || '',
            bio: '',
            address: '',
            city: '',
            country: '中国'
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>添加新用户</DialogTitle>
                    <DialogDescription>
                        {departmentName ? `向「${departmentName}」添加新成员` : '创建新用户账号'}。请填写用户详细信息。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">基本信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-name" className="text-right">
                                姓名 *
                            </Label>
                            <Input
                                id="user-name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="请输入姓名"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-email" className="text-right">
                                邮箱 *
                            </Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="请输入邮箱地址"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-phone" className="text-right">
                                手机号码
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Select
                                    value={formData.countryCode}
                                    onValueChange={(value) => handleInputChange('countryCode', value)}
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="+86">+86</SelectItem>
                                        <SelectItem value="+1">+1</SelectItem>
                                        <SelectItem value="+44">+44</SelectItem>
                                        <SelectItem value="+81">+81</SelectItem>
                                        <SelectItem value="+82">+82</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="user-phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="请输入手机号码（可选）"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-gender" className="text-right">
                                性别
                            </Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY') => handleInputChange('gender', value)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="选择性别" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">男</SelectItem>
                                    <SelectItem value="FEMALE">女</SelectItem>
                                    <SelectItem value="OTHER">其他</SelectItem>
                                    <SelectItem value="PREFER_NOT_TO_SAY">不愿透露</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {departmentName && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="user-department" className="text-right">
                                    所属部门
                                </Label>
                                <Input
                                    id="user-department"
                                    value={formData.department}
                                    disabled
                                    className="col-span-3 bg-gray-50"
                                />
                            </div>
                        )}
                    </div>

                    {/* 账号信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">账号信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-password" className="text-right">
                                密码
                            </Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="请输入密码（可选，不设置则用户首次登录时设置）"
                                className="col-span-3"
                            />
                        </div>

                        {formData.password && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="confirm-password" className="text-right">
                                    确认密码
                                </Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    placeholder="请再次输入密码"
                                    className="col-span-3"
                                />
                            </div>
                        )}
                    </div>

                    {/* 详细信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">详细信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="first-name" className="text-right">
                                名
                            </Label>
                            <Input
                                id="first-name"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="请输入名（可选）"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="last-name" className="text-right">
                                姓
                            </Label>
                            <Input
                                id="last-name"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="请输入姓（可选）"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="user-bio" className="text-right pt-2">
                                个人简介
                            </Label>
                            <textarea
                                id="user-bio"
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="请输入个人简介（可选）"
                                className="col-span-3 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-address" className="text-right">
                                地址
                            </Label>
                            <Input
                                id="user-address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="请输入地址（可选）"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-city" className="text-right">
                                城市
                            </Label>
                            <Input
                                id="user-city"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="请输入城市（可选）"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user-country" className="text-right">
                                国家
                            </Label>
                            <Input
                                id="user-country"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                placeholder="请输入国家（可选）"
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    {/* 权限信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">权限信息</h3>
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            {departmentName
                                ? `用户将被添加到「${departmentName}」部门，并继承该部门的默认权限设置。创建后可在用户详情中进行权限调整。`
                                : '用户创建后可在用户管理中分配角色和权限。'
                            }
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '创建中...' : '创建用户'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}