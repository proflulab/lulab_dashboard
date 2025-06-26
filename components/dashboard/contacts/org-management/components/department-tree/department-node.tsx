import React from 'react'
import { Network, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DepartmentNode } from '@/types/member'
import { useOrganizationStore } from '@/stores/org-management-store'

interface OrganizationNodeComponentProps {
    node: DepartmentNode
    level?: number
}

export function DepartmentNodeComponent({
    node,
    level = 0
}: OrganizationNodeComponentProps) {
    const { selectedNodeId, toggleNode, selectNode, handleMoreAction } = useOrganizationStore()

    const getNodeIcon = (type: string, isSelected: boolean, text: string) => {
        switch (type) {
            case 'company':
                return (
                    <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden">
                        {node.logo ? (
                            <Image
                                src={node.logo}
                                alt={text}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-red-500 flex items-center justify-center text-sm font-medium text-gray-50">
                                {node.name.charAt(0)}
                            </div>
                        )}
                    </div>
                )
            default:
                return <Network className={`h-4 w-4 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
        }
    }

    const isSelected = selectedNodeId === node.id

    return (
        <div>
            <div
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer
                    ${isSelected ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
                    }`}
                style={{ marginLeft: `${level * 16}px` }}
                onClick={async (e) => {
                    e.stopPropagation()
                    await selectNode(node.id)
                    if (node.children && e.detail === 2) { // 双击展开/收起
                        toggleNode(node.id)
                    }
                }}
            >
                {getNodeIcon(node.type, isSelected, node.name)}
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate
                    ${isSelected ? 'text-red-700' : 'text-gray-900'
                        }`}>
                        {node.name}
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    {node.children && (
                        <div
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleNode(node.id)
                            }}
                        >
                            {node.isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                            ) : (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                            )}
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <MoreHorizontal
                                className={`h-4 w-4 cursor-pointer hover:text-gray-600 ${isSelected ? 'text-red-600' : 'text-gray-400'}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-24">
                            {node.type !== 'company' && (
                                <DropdownMenuItem onClick={() => handleMoreAction(node.id, 'edit')}>
                                    编辑部门
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleMoreAction(node.id, 'addChild')}>
                                添加子部门
                            </DropdownMenuItem>
                            {node.type !== 'company' && (<DropdownMenuItem
                                onClick={() => handleMoreAction(node.id, 'delete')}
                                className="text-red-600 focus:text-red-600"
                            >
                                删除
                            </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* 递归渲染子节点 */}
            {node.isExpanded && node.children && (
                <div className="space-y-1">
                    {node.children.map((child) => (
                        <DepartmentNodeComponent
                            key={child.id}
                            node={child}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}