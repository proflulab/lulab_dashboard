import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft, ChevronRight, Edit2, Save, X as XIcon } from "lucide-react"
import { Member } from "@/types/member"

interface MemberDetailSidebarProps {
  isOpen: boolean
  member: Member | null
  onClose: () => void
}

export function MemberDetailSidebar({ isOpen, member, onClose }: MemberDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isEditing, setIsEditing] = useState(false)
  const [editedMember, setEditedMember] = useState<Member | null>(null)

  // 当member变化时，重置编辑状态
  React.useEffect(() => {
    if (member) {
      setEditedMember({ ...member })
      setIsEditing(false)
    }
  }, [member])

  const getButtonText = () => {
    if (isEditing) {
      return "保存更改"
    }
    switch (activeTab) {
      case "basic":
        return "编辑基本信息"
      case "work":
        return "编辑工作信息"
      case "login":
        return "编辑登录方式"
      case "seat":
        return "编辑席位信息"
      case "other":
        return "编辑其他信息"
      default:
        return "编辑基本信息"
    }
  }

  const handleEdit = () => {
    if (isEditing) {
      // 保存更改
      console.log('保存更改:', editedMember)
      // 这里可以调用API保存数据
      setIsEditing(false)
    } else {
      // 开始编辑
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    if (member) {
      setEditedMember({ ...member })
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    if (editedMember) {
      setEditedMember({
        ...editedMember,
        [field]: value
      } as Member)
    }
  }

  if (!isOpen || !member) {
    return null
  }

  return (
    <div className="fixed top-0 right-0 z-50 h-full">
      {/* 侧边栏内容 */}
      <div className="w-[380px] bg-white shadow-xl h-full flex flex-col border-l border-gray-200">
        {/* 侧边栏头部 - 固定 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">成员详情</h2>
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
          {/* 用户头像和基本信息 */}
          <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-lg bg-green-500 text-white">
                  {member.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                      正常
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
                        变更部门
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        操作离职
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        暂停账号
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        转移资源
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        重置登录密码
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* 标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50 rounded-none border-b">
              <TabsTrigger value="basic" className="text-xs">基本信息</TabsTrigger>
              <TabsTrigger value="work" className="text-xs">工作信息</TabsTrigger>
              <TabsTrigger value="login" className="text-xs">登录方式</TabsTrigger>
              <TabsTrigger value="seat" className="text-xs">席位信息</TabsTrigger>
              <TabsTrigger value="other" className="text-xs">其他</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">姓名</label>
                    {isEditing ? (
                      <Input
                        value={editedMember?.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{member.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">职位</label>
                    {isEditing ? (
                      <Input
                        value={editedMember?.position || ''}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        placeholder="请输入职位"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{member.position || '--'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">用户 ID</label>
                    <p className="mt-1 text-sm">5g498a7d</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">手机号码</label>
                    {isEditing ? (
                      <div className="mt-1 flex space-x-2">
                        <Input
                          value={editedMember?.countryCode || ''}
                          onChange={(e) => handleInputChange('countryCode', e.target.value)}
                          placeholder="+86"
                          className="w-20"
                        />
                        <Input
                          value={editedMember?.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="请输入手机号码"
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-sm">{member.countryCode} {member.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">邮箱</label>
                    {isEditing ? (
                      <Input
                        value={editedMember?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="请输入邮箱"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{member.email || '--'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">部门</label>
                    {isEditing ? (
                      <Input
                        value={editedMember?.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="请输入部门"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{member.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">账号状态</label>
                    <p className="mt-1 text-sm">{member.accountStatus}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">成员状态</label>
                    <p className="mt-1 text-sm">
                      <Badge
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                        className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {member.status === 'active' ? '正常' : member.status === 'inactive' ? '停用' : '待激活'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="work" className="mt-0">
                <div className="text-center text-gray-500 py-8">
                  工作信息内容
                </div>
              </TabsContent>

              <TabsContent value="login" className="mt-0">
                <div className="text-center text-gray-500 py-8">
                  登录方式内容
                </div>
              </TabsContent>

              <TabsContent value="seat" className="mt-0">
                <div className="text-center text-gray-500 py-8">
                  席位信息内容
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