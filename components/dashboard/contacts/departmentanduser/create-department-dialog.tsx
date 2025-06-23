'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useOrganizationStore } from '@/stores/organization-store'

export function CreateDepartmentDialog() {
    const {
        isCreateDepartmentOpen,
        newDepartmentName,
        newDepartmentDescription,
        isCreatingDepartment,
        setCreateDepartmentOpen,
        setNewDepartmentName,
        setNewDepartmentDescription,
        createDepartment,
        closeCreateDepartment,
    } = useOrganizationStore()

    return (
        <div className="mt-4 pt-4 border-t">
            <Dialog open={isCreateDepartmentOpen} onOpenChange={setCreateDepartmentOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-center text-sm text-gray-600 hover:text-gray-900">
                        <Plus className="h-4 w-4 mr-2" />
                        新建部门
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>新建部门</DialogTitle>
                        <DialogDescription>
                            在当前组织架构下创建新的部门。请填写部门基本信息。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-name" className="text-right">
                                部门名称 *
                            </Label>
                            <Input
                                id="department-name"
                                value={newDepartmentName}
                                onChange={(e) => setNewDepartmentName(e.target.value)}
                                placeholder="请输入部门名称"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-description" className="text-right">
                                部门描述
                            </Label>
                            <Input
                                id="department-description"
                                value={newDepartmentDescription}
                                onChange={(e) => setNewDepartmentDescription(e.target.value)}
                                placeholder="请输入部门描述（可选）"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeCreateDepartment}
                            disabled={isCreatingDepartment}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            onClick={createDepartment}
                            disabled={!newDepartmentName.trim() || isCreatingDepartment}
                        >
                            {isCreatingDepartment ? "创建中..." : "确认"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}