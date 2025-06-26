/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-24 02:06:50
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-25 11:33:36
 * @FilePath: /lulab_dashboard/components/dashboard/contacts/deptuser/members-table/page.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

"use client"

import React from "react"
import { DataTable } from "./data-table"
import { memberColumns } from "./columns"
import { useOrganizationStore } from "@/stores/org-management-store"

export function MembersPage() {
    const {
        // 状态
        members,
    } = useOrganizationStore()

    return (
        <DataTable columns={memberColumns} data={members} />
    )
}