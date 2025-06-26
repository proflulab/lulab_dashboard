import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  /** 加载文本，默认为"加载中..." */
  text?: string
  /** 是否显示骨架屏而不是文本 */
  skeleton?: boolean
  /** 骨架屏的行数，仅在skeleton=true时有效 */
  skeletonLines?: number
  /** 自定义样式类名 */
  className?: string
  /** 容器的padding，默认为p-4 */
  padding?: string
}

export function LoadingState({
  text = '加载中...',
  skeleton = false,
  skeletonLines = 3,
  className,
  padding = 'p-4'
}: LoadingStateProps) {
  if (skeleton) {
    return (
      <div className={cn('space-y-2', padding, className)}>
        {Array.from({ length: skeletonLines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', padding, className)}>
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>
  )
}