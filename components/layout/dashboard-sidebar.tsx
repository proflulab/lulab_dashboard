"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  // GraduationCap, // 暂时不需要
  Settings,
  BarChart,
  // ShoppingCart, // 暂时不需要
  ChevronRight,
  // Shield, // 暂时不需要
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuGuard } from "@/components/auth/permission-guard"
// import { useSession } from 'next-auth/react' // 暂时不需要

const menuItems = [
  {
    title: "概览",
    groupIcon: LayoutDashboard,
    permission: "dashboard.view",
    items: [
      {
        title: "仪表板",
        url: "/dashboard",
        permission: "dashboard.view",
      }
    ],
  },
  // {
  //   title: "用户管理",
  //   groupIcon: Users,
  //   permission: "users.view",
  //   items: [
  //     {
  //       title: "会员管理",
  //       url: "/dashboard/students",
  //       permission: "users.view",
  //     },
  //     {
  //       title: "教师管理",
  //       url: "/dashboard/teachers",
  //       permission: "users.view",
  //     },
  //   ],
  // },
  // {
  //   title: "业务管理",
  //   groupIcon: BookOpen,
  //   permission: "orders.view",
  //   items: [
  //     {
  //       title: "课程管理",
  //       url: "/dashboard/courses",
  //       permission: "products.view",
  //     },
  //     {
  //       title: "报名管理",
  //       url: "/dashboard/orders2",
  //       permission: "orders.view",
  //     },
  //   ],
  // },
  // {
  //   title: "财务管理",
  //   groupIcon: BarChart,
  //   permission: "finance.view",
  //   items: [
  //     {
  //       title: "财务总览",
  //       url: "/dashboard/finance",
  //       permission: "finance.view",
  //     },
  //     {
  //       title: "分帐编辑",
  //       url: "/dashboard/invoices",
  //       permission: "finance.manage",
  //     },
  //   ],
  // },
  {
    title: "系统",
    groupIcon: Settings,
    permission: "system.settings",
    items: [
      // {
      //   title: "系统设置",
      //   url: "/dashboard/settings",
      //   permission: "system.settings",
      // },
      {
        title: "权限管理",
        url: "/dashboard/permissions",
        permission: "permissions.view",
      },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  // const { data: _session } = useSession() // 暂时不需要
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  // 过滤有权限的菜单项
  const filterMenuItems = (items: typeof menuItems) => {
    return items.filter(group => {
      // 过滤组内的子项
      const filteredItems = group.items.filter(item => item.permission)
      return filteredItems.length > 0 || !group.permission
    })
  }

  const visibleMenuItems = filterMenuItems(menuItems)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4 group-data-[collapsible=icon]:px-2 h-16">
        <div className="flex items-center space-x-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:space-x-0 h-full">
          <div className="w-8 h-8 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm group-data-[collapsible=icon]:text-xs">L</span>
          </div>
          <div className="transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden">
            <h2 className="text-lg font-semibold whitespace-nowrap">陆向谦实验室</h2>
            <p className="text-xs text-muted-foreground whitespace-nowrap">管理系统</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((group) => {
                const isOpen = isClient ? openGroups.includes(group.title) : false
                const hasSubItems = group.items.length > 1

                // 如果只有一个子项，直接显示为一级菜单
                if (!hasSubItems) {
                  const item = group.items[0]
                  const Icon = group.groupIcon
                  const isActive = pathname === item.url

                  return (
                    <MenuGuard key={group.title} permission={item.permission || 'dashboard.view'}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.url}>
                            <Icon className="h-4 w-4" />
                            <span className="transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden whitespace-nowrap">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </MenuGuard>
                  )
                }

                // 有多个子项的显示为可折叠的二级菜单
                // 在折叠状态下使用下拉菜单，展开状态下使用可折叠菜单
                if (state === "collapsed") {
                  return (
                    <MenuGuard key={group.title} permission={group.permission || 'dashboard.view'}>
                      <SidebarMenuItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={group.title}>
                              {group.groupIcon && <group.groupIcon className="h-4 w-4" />}
                              <span className="transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden whitespace-nowrap">{group.title}</span>
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            {group.items.map((item) => {
                              const isActive = pathname === item.url

                              return (
                                <MenuGuard key={item.title} permission={item.permission || 'dashboard.view'}>
                                  <DropdownMenuItem asChild>
                                    <Link href={item.url} className={`flex items-center ${isActive ? 'bg-accent' : ''}`}>
                                      <span>{item.title}</span>
                                    </Link>
                                  </DropdownMenuItem>
                                </MenuGuard>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    </MenuGuard>
                  )
                }

                return (
                  <MenuGuard key={group.title} permission={group.permission || 'dashboard.view'}>
                    <Collapsible open={isOpen} onOpenChange={isClient ? () => toggleGroup(group.title) : undefined}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={group.title}>
                            {group.groupIcon && <group.groupIcon className="h-4 w-4" />}
                            <span className="transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden whitespace-nowrap">{group.title}</span>
                            <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''
                              }`} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.items.map((item) => {
                              const isActive = pathname === item.url

                              return (
                                <MenuGuard key={item.title} permission={item.permission || 'dashboard.view'}>
                                  <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive}>
                                      <Link href={item.url}>
                                        <span className="transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden whitespace-nowrap">{item.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                </MenuGuard>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </MenuGuard>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}