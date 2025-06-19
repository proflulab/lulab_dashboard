"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Users, Clock, Star } from "lucide-react"

type CourseStatus = "active" | "draft" | "completed"

interface Course {
  id: number
  title: string
  description: string
  instructor: string
  students: number
  duration: string
  price: number
  status: CourseStatus
  rating: number
  category: string
  thumbnail: string
  createdAt: string
}

// 模拟课程数据
const courses: Course[] = [
  {
    id: 1,
    title: "React 基础入门",
    description: "从零开始学习 React 框架，掌握现代前端开发技能",
    instructor: "张老师",
    students: 45,
    duration: "8周",
    price: 299,
    status: "active",
    rating: 4.8,
    category: "前端开发",
    thumbnail: "",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Python 数据分析",
    description: "使用 Python 进行数据分析和可视化，适合初学者",
    instructor: "李老师",
    students: 32,
    duration: "10周",
    price: 399,
    status: "active",
    rating: 4.6,
    category: "数据科学",
    thumbnail: "",
    createdAt: "2024-02-01",
  },
  {
    id: 3,
    title: "UI/UX 设计基础",
    description: "学习用户界面和用户体验设计的基本原理和实践",
    instructor: "王老师",
    students: 28,
    duration: "6周",
    price: 199,
    status: "draft",
    rating: 4.9,
    category: "设计",
    thumbnail: "",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    title: "Node.js 后端开发",
    description: "掌握 Node.js 后端开发技术，构建完整的 Web 应用",
    instructor: "赵老师",
    students: 38,
    duration: "12周",
    price: 499,
    status: "active",
    rating: 4.7,
    category: "后端开发",
    thumbnail: "",
    createdAt: "2024-02-20",
  },
]

const statusMap: Record<CourseStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "进行中", variant: "default" },
  draft: { label: "草稿", variant: "secondary" },
  completed: { label: "已完成", variant: "outline" },
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || course.status === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">课程管理</h1>
          <p className="text-muted-foreground">
            管理和查看所有课程信息
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建课程
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部课程</TabsTrigger>
          <TabsTrigger value="active">进行中</TabsTrigger>
          <TabsTrigger value="draft">草稿</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>课程列表</CardTitle>
                  <CardDescription>
                    共 {filteredCourses.length} 门课程
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索课程..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant={statusMap[course.status].variant}>
                          {statusMap[course.status].label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑课程
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除课程
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">讲师</span>
                        <span className="font-medium">{course.instructor}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">分类</span>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{course.students}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{course.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold text-green-600">
                          ¥{course.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          创建于 {course.createdAt}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCourses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">没有找到匹配的课程</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}