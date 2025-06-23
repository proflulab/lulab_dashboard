import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Member, OrganizationNode } from '@/types/member'
import { OrganizationService } from '@/services/organization.service'
import { MemberService } from '@/services/member.service'

// 默认组织架构数据
const defaultOrganizationData: OrganizationNode = {
  id: 'company-root',
  name: '加载中...',
  memberCount: 0,
  type: 'company',
  isExpanded: true,
  children: []
}

// 从组织架构数据生成部门筛选器
const generateDepartmentFilters = (orgNode: OrganizationNode): Array<{ value: string, label: string }> => {
  const filters = [{ value: "all", label: "全部部门" }]

  const addNodeToFilters = (node: OrganizationNode) => {
    if (node.type === 'department' || node.type === 'team') {
      filters.push({ value: node.name, label: node.name })
    }

    if (node.children) {
      node.children.forEach(child => addNodeToFilters(child))
    }
  }

  addNodeToFilters(orgNode)
  return filters
}

interface OrganizationState {
  // 组织架构相关状态
  orgData: OrganizationNode
  selectedNodeId: string
  loading: boolean

  // 成员相关状态
  members: Member[]
  selectedMembers: Set<number>
  isAllSelected: boolean

  // UI 相关状态
  searchTerm: string
  selectedDepartment: string
  departmentFilters: Array<{ value: string, label: string }>
  isOrgPanelCollapsed: boolean

  // 侧边栏状态
  isSidebarOpen: boolean
  selectedMemberDetail: Member | null

  // 部门编辑侧边栏状态
  isDepartmentSidebarOpen: boolean
  selectedDepartmentDetail: OrganizationNode | null

  // 新建部门状态
  isCreateDepartmentOpen: boolean
  newDepartmentName: string
  newDepartmentDescription: string
  isCreatingDepartment: boolean

  // 添加子部门状态
  isAddChildDepartmentOpen: boolean
  addChildParentNodeId: string
  addChildParentNodeName: string
}

interface OrganizationActions {
  // 数据加载
  loadInitialData: () => Promise<void>
  loadMembersForNode: (nodeId: string) => Promise<void>

  // 获取当前选中节点名称
  getSelectedNodeName: () => string

  // 组织架构操作
  toggleNode: (nodeId: string) => void
  selectNode: (nodeId: string) => void

  // 成员选择操作
  selectAllMembers: (checked: boolean, filteredMembers: Member[]) => void
  selectMember: (memberId: number, checked: boolean, filteredMembers: Member[]) => void
  resetSelection: () => void

  // UI 操作
  setSearchTerm: (term: string) => void
  setSelectedDepartment: (department: string) => void
  toggleOrgPanel: () => void
  setOrgPanelCollapsed: (collapsed: boolean) => void

  // 侧边栏操作
  openMemberDetail: (member: Member) => void
  closeSidebar: () => void

  // 部门编辑侧边栏操作
  openDepartmentDetail: (department: OrganizationNode) => void
  closeDepartmentSidebar: () => void

  // 部门管理操作
  openCreateDepartment: () => void
  closeCreateDepartment: () => void
  setCreateDepartmentOpen: (open: boolean) => void
  setNewDepartmentName: (name: string) => void
  setNewDepartmentDescription: (description: string) => void
  createDepartment: () => Promise<void>
  deleteDepartment: (nodeId: string) => Promise<void>
  handleMoreAction: (nodeId: string, action: string) => Promise<void>

  // 添加子部门操作
  openAddChildDepartment: (parentNodeId: string, parentNodeName: string) => void
  closeAddChildDepartment: () => void
}

type OrganizationStore = OrganizationState & OrganizationActions

export const useOrganizationStore = create<OrganizationStore>()(devtools(
  (set, get) => ({
    // 初始状态
    orgData: defaultOrganizationData,
    selectedNodeId: 'company-root',
    loading: true,
    members: [],
    selectedMembers: new Set(),
    isAllSelected: false,
    searchTerm: '',
    selectedDepartment: 'all',
    departmentFilters: [{ value: "all", label: "全部部门" }],
    isOrgPanelCollapsed: false,
    isSidebarOpen: false,
    selectedMemberDetail: null,
    isDepartmentSidebarOpen: false,
    selectedDepartmentDetail: null,
    isCreateDepartmentOpen: false,
    newDepartmentName: '',
    newDepartmentDescription: '',
    isCreatingDepartment: false,
    isAddChildDepartmentOpen: false,
    addChildParentNodeId: '',
    addChildParentNodeName: '',

    // 数据加载
    loadInitialData: async () => {
      set({ loading: true })
      try {
        // 获取组织架构数据
        const orgTree = await OrganizationService.fetchOrganizationTree()
        if (orgTree.length > 0) {
          const rootOrg = orgTree[0]
          const filters = generateDepartmentFilters(rootOrg)

          set({
            orgData: rootOrg,
            selectedNodeId: rootOrg.id,
            departmentFilters: filters
          })
        }

        // 获取所有成员数据
        const allMembers = await MemberService.fetchOrganizationMembers()
        set({ members: allMembers })
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        set({ loading: false })
      }
    },

    loadMembersForNode: async (nodeId: string) => {
      const { orgData } = get()

      if (!nodeId) {
        const allMembers = await MemberService.fetchOrganizationMembers()
        set({ members: allMembers })
        return
      }

      try {
        let nodeMembers: Member[] = []

        // 查找节点
        const findNodeInTree = (node: OrganizationNode, targetId: string): OrganizationNode | null => {
          if (node.id === targetId) return node
          if (node.children) {
            for (const child of node.children) {
              const found = findNodeInTree(child, targetId)
              if (found) return found
            }
          }
          return null
        }

        const selectedNode = findNodeInTree(orgData, nodeId)

        if (selectedNode) {
          if (selectedNode.type === 'company') {
            nodeMembers = await MemberService.fetchOrganizationMembers(nodeId)
          } else if (selectedNode.type === 'department' || selectedNode.type === 'team') {
            nodeMembers = await MemberService.fetchDepartmentMembers(nodeId)
          }
        } else {
          nodeMembers = await MemberService.fetchOrganizationMembers(nodeId)
        }

        set({ members: nodeMembers })
      } catch (error) {
        console.error('Error loading members for node:', error)
      }
    },

    // 组织架构操作
    toggleNode: (nodeId: string) => {
      const { orgData } = get()

      const updateNode = (node: OrganizationNode): OrganizationNode => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded }
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode)
          }
        }
        return node
      }

      set({ orgData: updateNode(orgData) })
    },

    selectNode: (nodeId: string) => {
      set({
        selectedNodeId: nodeId,
        selectedMembers: new Set(),
        isAllSelected: false
      })

      // 加载对应节点的成员
      get().loadMembersForNode(nodeId)
    },

    // 成员选择操作
    selectAllMembers: (checked: boolean, filteredMembers: Member[]) => {
      if (checked) {
        const allMemberIds = new Set(filteredMembers.map(member => member.id))
        set({ selectedMembers: allMemberIds, isAllSelected: true })
      } else {
        set({ selectedMembers: new Set(), isAllSelected: false })
      }
    },

    selectMember: (memberId: number, checked: boolean, filteredMembers: Member[]) => {
      const { selectedMembers } = get()
      const newSelectedMembers = new Set(selectedMembers)

      if (checked) {
        newSelectedMembers.add(memberId)
      } else {
        newSelectedMembers.delete(memberId)
      }

      const allSelected = filteredMembers.every(member => newSelectedMembers.has(member.id))

      set({
        selectedMembers: newSelectedMembers,
        isAllSelected: allSelected
      })
    },

    resetSelection: () => {
      set({ selectedMembers: new Set(), isAllSelected: false })
    },

    // UI 操作
    setSearchTerm: (term: string) => {
      set({ searchTerm: term })
      get().resetSelection()
    },

    setSelectedDepartment: (department: string) => {
      set({ selectedDepartment: department })
      get().resetSelection()
    },

    toggleOrgPanel: () => {
      const { isOrgPanelCollapsed } = get()
      set({ isOrgPanelCollapsed: !isOrgPanelCollapsed })
    },

    setOrgPanelCollapsed: (collapsed: boolean) => {
      set({ isOrgPanelCollapsed: collapsed })
    },

    // 侧边栏操作
    openMemberDetail: (member: Member) => {
      set({ selectedMemberDetail: member, isSidebarOpen: true })
    },

    closeSidebar: () => {
      set({ isSidebarOpen: false, selectedMemberDetail: null })
    },

    // 部门编辑侧边栏操作
    openDepartmentDetail: (department: OrganizationNode) => {
      set({ selectedDepartmentDetail: department, isDepartmentSidebarOpen: true })
    },

    closeDepartmentSidebar: () => {
      set({ isDepartmentSidebarOpen: false, selectedDepartmentDetail: null })
    },

    // 部门管理操作
    openCreateDepartment: () => {
      set({ isCreateDepartmentOpen: true })
    },

    closeCreateDepartment: () => {
      set({
        isCreateDepartmentOpen: false,
        newDepartmentName: '',
        newDepartmentDescription: ''
      })
    },

    setCreateDepartmentOpen: (open: boolean) => {
      if (open) {
        set({ isCreateDepartmentOpen: true })
      } else {
        get().closeCreateDepartment()
      }
    },

    setNewDepartmentName: (name: string) => {
      set({ newDepartmentName: name })
    },

    setNewDepartmentDescription: (description: string) => {
      set({ newDepartmentDescription: description })
    },

    createDepartment: async () => {
      const { newDepartmentName, newDepartmentDescription, selectedNodeId } = get()

      if (!newDepartmentName.trim()) return

      set({ isCreatingDepartment: true })
      try {
        await OrganizationService.createDepartment({
          name: newDepartmentName.trim(),
          description: newDepartmentDescription.trim(),
          parentId: selectedNodeId,
        })

        // 重新加载数据
        await get().loadInitialData()

        // 关闭弹窗
        get().closeCreateDepartment()
      } catch (error) {
        console.error('Error creating department:', error)
      } finally {
        set({ isCreatingDepartment: false })
      }
    },

    deleteDepartment: async (nodeId: string) => {
      if (!confirm('确定要删除这个部门吗？此操作不可撤销。')) return

      try {
        await OrganizationService.deleteDepartment(nodeId)
        await get().loadInitialData()
      } catch (error) {
        console.error('Error deleting department:', error)
      }
    },

    handleMoreAction: async (nodeId: string, action: string) => {
      console.log(`Action '${action}' clicked for node:`, nodeId)

      try {
        switch (action) {
          case 'export':
            console.log('导出无岗位成员')
            break
          case 'edit':
            try {
              const departmentDetail = await OrganizationService.getDepartmentDetail(nodeId)
              get().openDepartmentDetail(departmentDetail)
            } catch (error) {
              // 如果API调用失败，使用当前节点数据
              const { orgData } = get()
              const findNodeInTree = (node: OrganizationNode, targetId: string): OrganizationNode | null => {
                if (node.id === targetId) return node
                if (node.children) {
                  for (const child of node.children) {
                    const found = findNodeInTree(child, targetId)
                    if (found) return found
                  }
                }
                return null
              }
              const selectedNode = findNodeInTree(orgData, nodeId)
              if (selectedNode) {
                get().openDepartmentDetail(selectedNode)
              }
            }
            break
          case 'addChild':
            // 找到父节点信息
            const { orgData } = get()
            const findNodeInTree = (node: OrganizationNode, targetId: string): OrganizationNode | null => {
              if (node.id === targetId) return node
              if (node.children) {
                for (const child of node.children) {
                  const found = findNodeInTree(child, targetId)
                  if (found) return found
                }
              }
              return null
            }
            const parentNode = findNodeInTree(orgData, nodeId)
            if (parentNode) {
              get().openAddChildDepartment(nodeId, parentNode.name)
            }
            break
          case 'moveUp':
            console.log('上移部门')
            break
          case 'delete':
            await get().deleteDepartment(nodeId)
            break
          default:
            break
        }
      } catch (error) {
        console.error(`Error handling action '${action}' for node ${nodeId}:`, error)
      }
    },

    // 添加子部门操作
    openAddChildDepartment: (parentNodeId: string, parentNodeName: string) => {
      set({
        isAddChildDepartmentOpen: true,
        addChildParentNodeId: parentNodeId,
        addChildParentNodeName: parentNodeName
      })
    },

    closeAddChildDepartment: () => {
      set({
        isAddChildDepartmentOpen: false,
        addChildParentNodeId: '',
        addChildParentNodeName: ''
      })
    },

    // 获取当前选中节点名称
    getSelectedNodeName: () => {
      const { orgData, selectedNodeId } = get()

      const findNodeInTree = (node: OrganizationNode, targetId: string): OrganizationNode | null => {
        if (node.id === targetId) return node
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeInTree(child, targetId)
            if (found) return found
          }
        }
        return null
      }

      const selectedNode = findNodeInTree(orgData, selectedNodeId)
      return selectedNode ? selectedNode.name : orgData.name
    }
  }),
  {
    name: 'organization-store'
  }
))