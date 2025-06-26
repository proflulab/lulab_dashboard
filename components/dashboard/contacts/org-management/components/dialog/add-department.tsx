'use client'

import { useState, useEffect } from 'react'
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
import { OrganizationService } from '@/services/organization.service'
import { DepartmentNode } from '@/types/member'

export function AddChildDepartmentDialog() {
    const { isAddChildDepartmentOpen, addChildParentNodeId, closeAddChildDepartment, loadInitialData, orgData } = useOrganizationStore()
    // TODO: 使用父节点名称显示在表单中
    // const addChildParentNodeName = useOrganizationStore(state => state.addChildParentNodeName)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentDepartment: addChildParentNodeId,
        responsiblePerson: '',
        departmentType: 'department' as 'department' | 'team',
        departmentCode: '',
        contactInfo: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string, name: string, level: number }>>([])

    // 当父部门ID变化时，更新表单数据
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            parentDepartment: addChildParentNodeId
        }))
    }, [addChildParentNodeId])

    // 构建部门选项列表
    useEffect(() => {
        const buildDepartmentOptions = (node: DepartmentNode, level: number = 0): Array<{ id: string, name: string, level: number }> => {
            const options: Array<{ id: string, name: string, level: number }> = []

            // 添加当前节点（排除根节点）
            if (node.type !== 'company') {
                options.push({
                    id: node.id,
                    name: node.name,
                    level
                })
            }

            // 递归添加子节点
            if (node.children) {
                node.children.forEach(child => {
                    options.push(...buildDepartmentOptions(child, level + 1))
                })
            }

            return options
        }

        if (orgData) {
            const options = buildDepartmentOptions(orgData)
            setDepartmentOptions(options)
        }
    }, [orgData])

    // 根据部门ID获取部门名称
    const getDepartmentNameById = (departmentId: string): string => {
        const findDepartment = (node: DepartmentNode): string | null => {
            if (node.id === departmentId) {
                return node.name
            }
            if (node.children) {
                for (const child of node.children) {
                    const found = findDepartment(child)
                    if (found) return found
                }
            }
            return null
        }

        if (orgData) {
            return findDepartment(orgData) || '未知部门'
        }
        return '未知部门'
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('请输入部门名称')
            return
        }

        setIsSubmitting(true)
        try {
            await OrganizationService.createDepartment({
                name: formData.name.trim(),
                description: formData.description.trim(),
                parentId: formData.parentDepartment,
                type: formData.departmentType,
                code: formData.departmentCode.trim(),
                responsiblePerson: formData.responsiblePerson.trim(),
                contactInfo: formData.contactInfo.trim()
            })

            // 重新加载组织架构数据
            await loadInitialData()

            // 重置表单并关闭对话框
            handleClose()

            alert('子部门创建成功！')
        } catch (error) {
            console.error('Error creating child department:', error)
            alert('创建子部门失败，请重试')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            parentDepartment: addChildParentNodeId,
            responsiblePerson: '',
            departmentType: 'department',
            departmentCode: '',
            contactInfo: ''
        })
        closeAddChildDepartment()
    }

    return (
        <Dialog open={isAddChildDepartmentOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>新建部门</DialogTitle>
                    <DialogDescription>
                        在「{formData.parentDepartment ? getDepartmentNameById(formData.parentDepartment) : '请选择上级部门'}」下创建新的子部门。请填写部门详细信息。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">基本信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-name" className="text-right">
                                部门名称
                            </Label>
                            <Input
                                id="department-name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="请输入部门名称"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="parent-department" className="text-right">
                                上级部门
                            </Label>
                            <Select
                                value={formData.parentDepartment}
                                onValueChange={(value) => handleInputChange('parentDepartment', value)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="请选择上级部门" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departmentOptions.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            <span style={{ paddingLeft: `${dept.level * 16}px` }}>
                                                {dept.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-code" className="text-right">
                                部门ID
                            </Label>
                            <Input
                                id="department-code"
                                value={formData.departmentCode}
                                onChange={(e) => handleInputChange('departmentCode', e.target.value)}
                                placeholder="请输入部门编码（可选）"
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">详细信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="responsible-person" className="text-right">
                                部门负责人
                            </Label>
                            <Input
                                id="responsible-person"
                                value={formData.responsiblePerson}
                                onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                                placeholder="请输入负责人姓名（可选）"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="department-description" className="text-right pt-2">
                                部门描述
                            </Label>
                            <textarea
                                id="department-description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="请输入部门职责描述（可选）"
                                className="col-span-3 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>

                    </div>

                    {/* 部门权限信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">部门权限信息</h3>
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            部门权限将继承上级部门「{formData.parentDepartment ? getDepartmentNameById(formData.parentDepartment) : '所选部门'}」的权限设置，创建后可在部门详情中进行调整。
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!formData.name.trim() || isSubmitting}
                    >
                        {isSubmitting ? "创建中..." : "确认"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}