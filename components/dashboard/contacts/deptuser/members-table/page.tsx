"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DataTable } from "./data-table"
import { memberColumns } from "./columns"
import { useOrganizationStore } from "@/stores/organization-store"

export function MembersPage() {
    const {
        // 状态
        members,
    } = useOrganizationStore()

    return (
        <DataTable columns={memberColumns} data={members} />
    )
}