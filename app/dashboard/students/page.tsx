"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"

type StudentStatus = "active" | "inactive" | "pending"

interface Student {
  id: number
  name: string
  email: string
  phone: string
  status: StudentStatus
  enrollDate: string
  courses: number
  avatar: string
}

// 模拟学员数据
const students: Student[] = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    phone: "13800138001",
    status: "active",
    enrollDate: "2024-01-15",
    courses: 3,
    avatar: "",
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@example.com",
    phone: "13800138002",
    status: "inactive",
    enrollDate: "2024-02-20",
    courses: 1,
    avatar: "",
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    phone: "13800138003",
    status: "active",
    enrollDate: "2024-03-10",
    courses: 5,
    avatar: "",
  },
  {
    id: 4,
    name: "赵六",
    email: "zhaoliu@example.com",
    phone: "13800138004",
    status: "pending",
    enrollDate: "2024-03-25",
    courses: 0,
    avatar: "",
  },
]

const statusMap: Record<StudentStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "活跃", variant: "default" },
  inactive: { label: "非活跃", variant: "secondary" },
  pending: { label: "待审核", variant: "outline" },
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">学员管理</h1>
          <p className="text-muted-foreground">
            管理和查看所有学员信息
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加学员
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>学员列表</CardTitle>
          <CardDescription>
            共 {students.length} 名学员
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索学员..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>注册日期</TableHead>
                  <TableHead>课程数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{student.email}</div>
                        <div className="text-muted-foreground">{student.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[student.status].variant}>
                        {statusMap[student.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.enrollDate}</TableCell>
                    <TableCell>{student.courses}</TableCell>
                    <TableCell className="text-right">
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
  )
}