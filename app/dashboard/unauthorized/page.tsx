import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            访问被拒绝
          </CardTitle>
          <CardDescription className="text-gray-600">
            您没有权限访问此页面
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              抱歉，您当前的权限级别不足以访问所请求的资源。如果您认为这是一个错误，请联系系统管理员。
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回上一页
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>需要帮助？</p>
            <p className="mt-1">
              请联系管理员或查看
              <Link href="/dashboard/permissions" className="text-blue-600 hover:underline ml-1">
                权限设置
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}