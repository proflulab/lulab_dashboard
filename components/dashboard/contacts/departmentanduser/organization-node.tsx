import React from 'react'
import { Users, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OrganizationNode } from '@/types/member'

interface OrganizationNodeComponentProps {
    node: OrganizationNode
    level?: number
    onToggle: (nodeId: string) => void
    selectedNodeId?: string
    onSelect: (nodeId: string) => void
    onMoreClick?: (nodeId: string, action: string) => void | Promise<void>
}

export function OrganizationNodeComponent({
    node,
    level = 0,
    onToggle,
    selectedNodeId,
    onSelect,
    onMoreClick
}: OrganizationNodeComponentProps) {
    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'company':
                return (
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">Lu</span>
                    </div>
                )
            case 'department':
            case 'team':
                return <Users className="h-4 w-4 text-gray-500" />
            default:
                return <Users className="h-4 w-4 text-gray-500" />
        }
    }

    const isSelected = selectedNodeId === node.id

    const getNodeStyle = (type: string, isSelected: boolean) => {
        if (isSelected) {
            return 'bg-red-50 border border-red-200'
        }
        return 'hover:bg-gray-50'
    }

    const getTextStyle = (type: string, isSelected: boolean) => {
        if (isSelected) {
            return 'text-red-700'
        }
        return 'text-gray-900'
    }

    return (
        <div>
            <div
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${getNodeStyle(node.type, isSelected)}`}
                style={{ marginLeft: `${level * 16}px` }}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(node.id)
                    if (node.children && e.detail === 2) { // 双击展开/收起
                        onToggle(node.id)
                    }
                }}
            >
                {getNodeIcon(node.type)}
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${getTextStyle(node.type, isSelected)}`}>
                        {node.name}
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    {node.children && (
                        <div
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggle(node.id)
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
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onMoreClick?.(node.id, 'edit')}>
                                编辑部门
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoreClick?.(node.id, 'addChild')}>
                                添加子部门
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoreClick?.(node.id, 'moveUp')}>
                                上移
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onMoreClick?.(node.id, 'delete')}
                                className="text-red-600 focus:text-red-600"
                            >
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* 递归渲染子节点 */}
            {node.isExpanded && node.children && (
                <div className="space-y-1">
                    {node.children.map((child) => (
                        <OrganizationNodeComponent
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onToggle={onToggle}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                            onMoreClick={onMoreClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}