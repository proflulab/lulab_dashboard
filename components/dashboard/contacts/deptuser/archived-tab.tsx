import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ArchivedTab() {
  return (
    <div className="space-y-4">
      {/* TODO: 待开发 - 已离职成员功能 */}
      <Card>
        <CardHeader>
          <CardTitle>已离职成员</CardTitle>
          <CardDescription>
            查看已离职的成员信息 - 待开发
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>已离职成员功能正在开发中，敬请期待...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}