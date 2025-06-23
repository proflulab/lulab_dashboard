/**
 * 成员和组织架构相关的工具函数
 */
import { Member, MemberStatus, AccountStatus, OrganizationNode } from '@/types/member'

/**
 * 成员状态相关工具函数
 */
export const MemberUtils = {
  /**
   * 获取成员状态的显示文本
   */
  getStatusText(status: MemberStatus): string {
    const statusMap: Record<MemberStatus, string> = {
      active: '正常',
      inactive: '停用',
      pending: '待激活',
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取成员状态的样式类名
   */
  getStatusVariant(status: MemberStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<MemberStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'destructive',
      pending: 'secondary',
    }
    return variantMap[status] || 'outline'
  },

  /**
   * 获取账号状态的样式类名
   */
  getAccountStatusVariant(status: AccountStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<AccountStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '正常': 'default',
      '未设置': 'secondary',
    }
    return variantMap[status] || 'outline'
  },

  /**
   * 格式化手机号显示
   */
  formatPhoneNumber(countryCode: string, phone: string): string {
    if (!phone) return '-'
    return `${countryCode} ${phone}`
  },

  /**
   * 获取成员头像的备用文本
   */
  getAvatarFallback(name: string): string {
    return name.slice(0, 2).toUpperCase()
  },

  /**
   * 验证邮箱格式
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * 验证手机号格式（简单验证）
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\d{10,15}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
  },

  /**
   * 过滤成员列表
   */
  filterMembers(
    members: Member[],
    filters: {
      searchTerm?: string
      department?: string
      status?: MemberStatus
      accountStatus?: AccountStatus
    }
  ): Member[] {
    const { searchTerm, department, status, accountStatus } = filters

    return members.filter(member => {
      // 搜索词过滤
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          member.name.toLowerCase().includes(term) ||
          member.phone.includes(term) ||
          member.email.toLowerCase().includes(term) ||
          member.department.toLowerCase().includes(term) ||
          member.position.toLowerCase().includes(term)

        if (!matchesSearch) return false
      }

      // 部门过滤
      if (department && department !== 'all' && member.department !== department) {
        return false
      }

      // 状态过滤
      if (status && member.status !== status) {
        return false
      }

      // 账号状态过滤
      if (accountStatus && member.accountStatus !== accountStatus) {
        return false
      }

      return true
    })
  },

  /**
   * 排序成员列表
   */
  sortMembers(
    members: Member[],
    sortBy: keyof Member,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Member[] {
    return [...members].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue)
        return sortOrder === 'asc' ? result : -result
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue
        return sortOrder === 'asc' ? result : -result
      }

      return 0
    })
  },

  /**
   * 导出成员数据为CSV格式
   */
  exportToCsv(members: Member[]): string {
    const headers = ['姓名', '手机号', '邮箱', '部门', '职位', '状态', '账号状态']
    const rows = members.map(member => [
      member.name,
      this.formatPhoneNumber(member.countryCode, member.phone),
      member.email,
      member.department,
      member.position,
      this.getStatusText(member.status),
      member.accountStatus,
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  },
}

/**
 * 组织架构相关工具函数
 */
export const OrganizationUtils = {
  /**
   * 扁平化组织架构树
   */
  flattenTree(nodes: OrganizationNode[]): OrganizationNode[] {
    const result: OrganizationNode[] = []

    const traverse = (nodeList: OrganizationNode[]) => {
      nodeList.forEach(node => {
        result.push(node)
        if (node.children) {
          traverse(node.children)
        }
      })
    }

    traverse(nodes)
    return result
  },

  /**
   * 查找节点路径
   */
  findNodePath(nodes: OrganizationNode[], targetId: string): OrganizationNode[] {
    const path: OrganizationNode[] = []

    const findPath = (nodeList: OrganizationNode[]): boolean => {
      for (const node of nodeList) {
        path.push(node)
        if (node.id === targetId) {
          return true
        }
        if (node.children && findPath(node.children)) {
          return true
        }
        path.pop()
      }
      return false
    }

    findPath(nodes)
    return path
  },

  /**
   * 查找特定节点
   */
  findNode(nodes: OrganizationNode[], nodeId: string): OrganizationNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node
      }
      if (node.children) {
        const found = this.findNode(node.children, nodeId)
        if (found) return found
      }
    }
    return null
  },

  /**
   * 获取所有部门选项
   */
  getDepartmentOptions(nodes: OrganizationNode[]): Array<{ value: string; label: string }> {
    const options: Array<{ value: string; label: string }> = [
      { value: 'all', label: '全部部门' }
    ]

    const traverse = (nodeList: OrganizationNode[], prefix = '') => {
      nodeList.forEach(node => {
        if (node.type === 'department' || node.type === 'team') {
          const label = prefix ? `${prefix} / ${node.name}` : node.name
          options.push({
            value: node.name,
            label,
          })
        }
        if (node.children) {
          const newPrefix = prefix ? `${prefix} / ${node.name}` : node.name
          traverse(node.children, newPrefix)
        }
      })
    }

    traverse(nodes)
    return options
  },

  /**
   * 计算节点的总成员数（包括子节点）
   */
  getTotalMemberCount(node: OrganizationNode): number {
    let total = node.memberCount
    if (node.children) {
      total += node.children.reduce((sum, child) => sum + this.getTotalMemberCount(child), 0)
    }
    return total
  },

  /**
   * 获取节点层级
   */
  getNodeLevel(nodes: OrganizationNode[], targetId: string): number {
    const path = this.findNodePath(nodes, targetId)
    return path.length - 1
  },

  /**
   * 验证节点名称是否唯一
   */
  isNodeNameUnique(nodes: OrganizationNode[], name: string, excludeId?: string): boolean {
    const flatNodes = this.flattenTree(nodes)
    return !flatNodes.some(node =>
      node.name === name && node.id !== excludeId
    )
  },

  /**
   * 获取节点的所有子节点ID
   */
  getChildNodeIds(node: OrganizationNode): string[] {
    const ids: string[] = []

    const traverse = (currentNode: OrganizationNode) => {
      if (currentNode.children) {
        currentNode.children.forEach(child => {
          ids.push(child.id)
          traverse(child)
        })
      }
    }

    traverse(node)
    return ids
  },
}

/**
 * 通用工具函数
 */
export const CommonUtils = {
  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  /**
   * 生成唯一ID
   */
  generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  },

  /**
   * 深拷贝对象
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T
    }

    if (typeof obj === 'object') {
      const clonedObj = {} as T
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }

    return obj
  },
}