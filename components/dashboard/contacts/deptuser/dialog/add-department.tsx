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
import { useOrganizationStore } from '@/stores/organization-store'
import { OrganizationService } from '@/services/organization.service'

interface AddChildDepartmentDialogProps {
    isOpen: boolean
    onClose: () => void
    parentNodeId: string
    parentNodeName: string
}

export function AddChildDepartmentDialog({
    isOpen,
    onClose,
    parentNodeId,
    parentNodeName
}: AddChildDepartmentDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentDepartment: parentNodeName,
        responsiblePerson: '',
        departmentType: 'department' as 'department' | 'team',
        departmentCode: '',
        contactInfo: ''
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
        if (!formData.name.trim()) {
            alert('请输入部门名称')
            return
        }

        setIsSubmitting(true)
        try {
            await OrganizationService.createDepartment({
                name: formData.name.trim(),
                description: formData.description.trim(),
                parentId: parentNodeId,
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
            parentDepartment: parentNodeName,
            responsiblePerson: '',
            departmentType: 'department',
            departmentCode: '',
            contactInfo: ''
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>新建子部门</DialogTitle>
                    <DialogDescription>
                        在「{parentNodeName}」下创建新的子部门。请填写部门详细信息。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">基本信息</h3>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-name" className="text-right">
                                部门名称 *
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
                            <Input
                                id="parent-department"
                                value={formData.parentDepartment}
                                disabled
                                className="col-span-3 bg-gray-50"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-type" className="text-right">
                                部门类型
                            </Label>
                            <Select
                                value={formData.departmentType}
                                onValueChange={(value: 'department' | 'team') => handleInputChange('departmentType', value)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="选择部门类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="department">部门</SelectItem>
                                    <SelectItem value="team">团队</SelectItem>
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contact-info" className="text-right">
                                联系方式
                            </Label>
                            <Input
                                id="contact-info"
                                value={formData.contactInfo}
                                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                                placeholder="请输入联系方式（可选）"
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    {/* 部门权限信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">部门权限信息</h3>
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            部门权限将继承上级部门「{parentNodeName}」的权限设置，创建后可在部门详情中进行调整。
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