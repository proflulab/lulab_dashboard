/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:02:02
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-18 14:56:00
 * @FilePath: /lulab_dashboard/hooks/use-mobile.ts
 * @Description: A custom React hook for detecting mobile devices based on screen width breakpoint
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // 使用false作为初始值，避免undefined导致的UI闪烁
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // 检查是否在浏览器环境
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }

      // 立即设置初始值
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

      // 添加事件监听器
      mql.addEventListener("change", onChange)

      // 清理函数
      return () => mql.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}
