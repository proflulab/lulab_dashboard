import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft, ChevronRight, Edit2, Save, X as XIcon, Users } from "lucide-react"
import { OrganizationNode } from "@/types/member"

interface DepartmentDetailSidebarProps {
    isOpen: boolean
    department: OrganizationNode | null
    onClose: () => void
}

export function DepartmentDetailSidebar({ isOpen, department, onClose }: DepartmentDetailSidebarProps) {
    const [activeTab, setActiveTab] = useState("basic")
    const [isEditing, setIsEditing] = useState(false)
    const [editedDepartment, setEditedDepartment] = useState<OrganizationNode | null>(null)

    // 当department变化时，重置编辑状态
    React.useEffect(() => {
        if (department) {
            setEditedDepartment({ ...department })
            setIsEditing(false)
        }
    }, [department])

    const getButtonText = () => {
        if (isEditing) {
            return "保存更改"
        }
        switch (activeTab) {
            case "basic":
                return "编辑基本信息"
            case "members":
                return "编辑成员信息"
            case "permissions":
                return "编辑权限设置"
            case "other":
                return "编辑其他信息"
            default:
                return "编辑基本信息"
        }
    }

    const handleEdit = () => {
        if (isEditing) {
            // 保存更改
            console.log('保存更改:', editedDepartment)
            // 这里可以调用API保存数据
            setIsEditing(false)
        } else {
            // 开始编辑
            setIsEditing(true)
        }
    }

    const handleCancel = () => {
        if (department) {
            setEditedDepartment({ ...department })
        }
        setIsEditing(false)
    }

    const handleInputChange = (field: string, value: string | number) => {
        if (editedDepartment) {
            setEditedDepartment({
                ...editedDepartment,
                [field]: value
            } as OrganizationNode)
        }
    }

    const getDepartmentIcon = (type: string) => {
        switch (type) {
            case 'company':
                return (
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg font-bold">Lu</span>
                    </div>
                )
            case 'department':
            case 'team':
                return (
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                )
            default:
                return (
                    <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                )
        }
    }

    const getTypeDisplayName = (type: string) => {
        switch (type) {
            case 'company':
                return '公司'
            case 'department':
                return '部门'
            case 'team':
                return '团队'
            default:
                return '组织'
        }
    }

    if (!isOpen || !department) {
        return null
    }

    return (
        <div className="fixed top-0 right-0 z-50 h-full">
            {/* 侧边栏内容 */}
            <div className="w-[380px] bg-white shadow-xl h-full flex flex-col border-l border-gray-200">
                {/* 侧边栏头部 - 固定 */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold">部门详情</h2>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span>上一个</span>
                            <span>下一个</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* 可滚动内容区域 */}
                <div className="flex-1 overflow-y-auto">
                    {/* 部门图标和基本信息 */}
                    <div className="p-6 border-b flex-shrink-0">
                        <div className="flex items-center space-x-4">
                            {getDepartmentIcon(department.type)}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-xl font-semibold">{department.name}</h3>
                                        <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                                            {getTypeDisplayName(department.type)}
                                        </Badge>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">
                                                更多操作
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem>
                                                添加子部门
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                移动部门
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                合并部门
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                导出成员
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                删除部门
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="mt-1 text-sm text-gray-500">
                                    {department.memberCount} 名成员
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 标签页 */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none border-b">
                            <TabsTrigger value="basic" className="text-xs">基本信息</TabsTrigger>
                            <TabsTrigger value="members" className="text-xs">成员管理</TabsTrigger>
                            <TabsTrigger value="permissions" className="text-xs">权限设置</TabsTrigger>
                            <TabsTrigger value="other" className="text-xs">其他</TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <TabsContent value="basic" className="mt-0 space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">部门名称</label>
                                        {isEditing ? (
                                            <Input
                                                value={editedDepartment?.name || ''}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm">{department.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">部门类型</label>
                                        <p className="mt-1 text-sm">{getTypeDisplayName(department.type)}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">部门 ID</label>
                                        <p className="mt-1 text-sm">{department.id}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">成员数量</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={editedDepartment?.memberCount || 0}
                                                onChange={(e) => handleInputChange('memberCount', parseInt(e.target.value) || 0)}
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm">{department.memberCount} 名成员</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">上级部门</label>
                                        <p className="mt-1 text-sm">实验室产品&技术部</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">部门负责人</label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <span className="text-sm">请选择</span>
                                            <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">
                                                选择负责人
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">创建时间</label>
                                        <p className="mt-1 text-sm">2024-01-15 10:30:00</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">部门状态</label>
                                        <p className="mt-1 text-sm">
                                            <Badge
                                                variant="default"
                                                className="bg-green-100 text-green-800"
                                            >
                                                正常
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="members" className="mt-0">
                                <div className="text-center text-gray-500 py-8">
                                    成员管理内容
                                </div>
                            </TabsContent>

                            <TabsContent value="permissions" className="mt-0">
                                <div className="text-center text-gray-500 py-8">
                                    权限设置内容
                                </div>
                            </TabsContent>

                            <TabsContent value="other" className="mt-0">
                                <div className="text-center text-gray-500 py-8">
                                    其他信息内容
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* 底部操作按钮 - 固定 */}
                <div className="p-6 border-t bg-gray-50 flex-shrink-0">
                    {isEditing ? (
                        <div className="flex space-x-3">
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                <XIcon className="h-4 w-4 mr-2" />
                                取消
                            </Button>
                            <Button
                                className="flex-1"
                                variant="default"
                                onClick={handleEdit}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {getButtonText()}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            variant="default"
                            onClick={handleEdit}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {getButtonText()}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}