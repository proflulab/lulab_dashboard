"use client"

import React, { useState } from "react"
import { Users, Building2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartmentsTab } from "@/components/dashboard/contacts/deptuser/departments-tab"
import { ArchivedTab } from "@/components/dashboard/contacts/deptuser/archived-tab"
import { MembersTab } from "@/components/dashboard/contacts/deptuser/members-tab"

export default function DepartmentAndUserPage() {
  const [activeTab, setActiveTab] = useState("members")

  return (
    <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>成员</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>部门</span>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center space-x-2">
            <span>已离职成员</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="archived">
          <ArchivedTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}