import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DepartmentsTab() {
  return (
    <div className="space-y-4">
      {/* TODO: 待代发 - 部门管理功能 */}
      <Card>
        <CardHeader>
          <CardTitle>部门管理</CardTitle>
          <CardDescription>
            管理组织部门结构 - 待开发
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>部门管理功能正在开发中，敬请期待...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}