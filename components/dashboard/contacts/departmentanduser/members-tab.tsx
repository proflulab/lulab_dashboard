import React, { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Users, Building2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MemberDetailSidebar } from "@/components/members/member-detail-sidebar"
import { OrganizationPanel } from './organization-panel'
import { useOrganizationStore } from '@/stores/organization-store'



export function MembersTab() {
  // 使用 Zustand store
  const {
    // 状态
    orgData,
    loading,
    members,
    selectedMembers,
    isAllSelected,
    searchTerm,
    selectedDepartment,
    departmentFilters,
    isOrgPanelCollapsed,
    isSidebarOpen,
    selectedMemberDetail,
    // 操作
    loadInitialData,
    selectAllMembers,
    selectMember,
    setSearchTerm,
    setSelectedDepartment,
    setOrgPanelCollapsed,
    openMemberDetail,
    closeSidebar,
    getSelectedNodeName
  } = useOrganizationStore()

  // 初始化数据加载
  useEffect(() => {
    loadInitialData()
  }, [])

  // 计算过滤后的成员列表
  const filteredMembers = members.filter(
    (member) =>
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedDepartment === "all" || member.department.includes(selectedDepartment))
  )

  // 事件处理函数
  const handleSelectAll = (checked: boolean) => {
    selectAllMembers(checked, filteredMembers)
  }

  const handleSelectMember = (memberId: number, checked: boolean) => {
    selectMember(memberId, checked, filteredMembers)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        {/* 左侧组织架构 */}
        <OrganizationPanel />

        {/* 右侧成员列表 */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {!isOrgPanelCollapsed && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOrgPanelCollapsed(true)}
                            className="p-1 h-8 w-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>收起组织架构</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isOrgPanelCollapsed && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOrgPanelCollapsed(false)}
                            className="p-0.5 h-6 w-6 flex-shrink-0"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>展开组织架构</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div>
                    <CardTitle className="flex items-center justify-between">
                      {getSelectedNodeName()}
                      <span className="text-sm font-normal text-muted-foreground">
                        &nbsp;{loading ? '加载中...' : `总人数 ${filteredMembers.length}`}
                      </span>
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="筛选部门" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedMembers.size === 0}
                  >
                    批量操作 {selectedMembers.size > 0 && `(${selectedMembers.size})`}
                  </Button>
                  <Button variant="outline" size="sm">
                    导入/导出
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="全选"
                        />
                      </TableHead>
                      <TableHead>
                        姓名
                        {selectedMembers.size > 0 && (
                          <span className="ml-2 text-blue-600">
                            已选 {selectedMembers.size} 个
                          </span>
                        )}
                      </TableHead>
                      <TableHead>账号状态</TableHead>
                      <TableHead>手机号码</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>企业邮箱</TableHead>
                      <TableHead className="px-3">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.has(member.id)}
                            onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
                            aria-label={`选择 ${member.name}`}
                          />
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-600">{member.accountStatus}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.countryCode && member.phone ?
                            `${member.countryCode} ${member.phone}` :
                            member.phone || '未设置'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{member.department}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.email === "syang@lulab.cn" ? (
                            <span className="text-sm">{member.email}</span>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              未设置
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 用户详情侧边栏 */}
      <MemberDetailSidebar
        isOpen={isSidebarOpen}
        member={selectedMemberDetail}
        onClose={closeSidebar}
      />
    </div>
  )
}