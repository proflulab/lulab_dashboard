"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Member } from "@/types/member"
import { useOrganizationStore } from "@/stores/organization-store"

export const memberColumns: ColumnDef<Member>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="全选"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label={`选择 ${row.original.name}`}
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "姓名",
        cell: ({ row }) => {
            const member = row.original
            return (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-orange-500 text-white">
                            {member.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{member.name}</div>
                    </div>
                </div>
            )
        },
        enableHiding: false,
    },
    {
        accessorKey: "accountStatus",
        header: "账号状态",
        cell: ({ row }) => {
            const member = row.original
            return (
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600">{member.accountStatus}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "phone",
        header: "手机号码",
        cell: ({ row }) => {
            const member = row.original
            return (
                <div>
                    {member.countryCode && member.phone
                        ? `${member.countryCode} ${member.phone}`
                        : member.phone || '未设置'
                    }
                </div>
            )
        },
    },
    {
        accessorKey: "department",
        header: "部门",
        cell: ({ row }) => {
            const member = row.original
            return (
                <div className="text-sm">
                    <div>{member.department}</div>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => {
            const member = row.original
            return (
                <div>
                    {member.email ? (
                        <span className="text-sm">{member.email}</span>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            未设置
                        </Badge>
                    )}
                </div>
            )
        },
    },
    {
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
            const member = row.original
            const { openMemberDetail } = useOrganizationStore()

            return (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-1 text-blue-600"
                        onClick={() => openMemberDetail(member)}
                    >
                        详情
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
