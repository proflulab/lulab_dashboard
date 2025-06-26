import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Member, DepartmentNode } from '@/types/member'
import { OrganizationService } from '@/services/organization.service'
import { MemberService } from '@/services/member.service'
import { DepartmentService } from '@/services/department.service'
import { departmentService } from '@/lib/services/department.service'

// 默认组织架构数据
const defaultDepartmentNodeData: DepartmentNode = {
  id: 'company-root',
  name: '加载中...',
  memberCount: 0,
  type: 'company',
  isExpanded: true,
  children: []
}

interface OrganizationState {
  // 组织架构相关状态
  orgData: DepartmentNode
  selectedNodeId: string
  loading: boolean

  // 成员相关状态
  members: Member[]

  // UI 相关状态
  isOrgPanelCollapsed: boolean

  // 侧边栏状态
  isSidebarOpen: boolean
  selectedMemberDetail: Member | null

  // 部门编辑侧边栏状态
  isDepartmentSidebarOpen: boolean
  selectedDepartmentDetail: DepartmentNode | null

  // 添加子部门状态
  isAddChildDepartmentOpen: boolean
  addChildParentNodeId: string
  addChildParentNodeName: string
}

interface OrganizationActions {
  // 数据加载
  loadInitialData: () => Promise<void>

  // 获取当前选中节点名称
  getSelectedNodeName: () => string

  // 组织架构操作
  toggleNode: (nodeId: string) => void
  selectNode: (nodeId: string) => Promise<void>

  // UI 操作
  setOrgPanelCollapsed: (collapsed: boolean) => void

  // 侧边栏操作
  openMemberDetail: (member: Member) => void
  closeSidebar: () => void

  // 部门编辑侧边栏操作
  closeDepartmentSidebar: () => void

  // 部门管理操作
  handleMoreAction: (nodeId: string, action: string) => Promise<void>

  // 添加子部门操作
  openAddChildDepartment: (parentNodeId: string, parentNodeName: string) => void
  closeAddChildDepartment: () => void
}

type OrganizationStore = OrganizationState & OrganizationActions

export const useOrganizationStore = create<OrganizationStore>()(devtools(
  (set, get) => ({
    // 初始状态
    orgData: defaultDepartmentNodeData,
    selectedNodeId: 'company-root',
    loading: true,
    members: [],
    isOrgPanelCollapsed: false,
    isSidebarOpen: false,
    selectedMemberDetail: null,
    isDepartmentSidebarOpen: false,
    selectedDepartmentDetail: null,
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
          set({
            orgData: rootOrg,
            selectedNodeId: rootOrg.id
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

    // 组织架构操作
    toggleNode: (nodeId: string) => {
      const { orgData } = get()

      const updateNode = (node: DepartmentNode): DepartmentNode => {
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

    // 获取成员数据
    selectNode: async (nodeId: string) => {
      set({ selectedNodeId: nodeId })

      // 判断是否为根节点（公司节点）
      const { orgData } = get()
      const isRootNode = nodeId === orgData.id

      try {
        if (isRootNode) {
          // 如果是根节点，获取所有组织成员
          const allMembers = await MemberService.fetchOrganizationMembers()
          set({ members: allMembers })
        } else {
          // 如果是部门节点，获取该部门的成员数据
          const departmentMembers = await MemberService.fetchDepartmentMembers(nodeId)
          set({ members: departmentMembers })
        }
      } catch (error) {
        console.error('Error loading members:', error)
        // 如果获取失败，则获取所有成员作为备选
        try {
          const allMembers = await MemberService.fetchOrganizationMembers()
          set({ members: allMembers })
        } catch (fallbackError) {
          console.error('Error loading organization members:', fallbackError)
        }
      }
    },

    // UI 操作
    setOrgPanelCollapsed: (collapsed: boolean) => {
      set({ isOrgPanelCollapsed: collapsed })
    },

    // 成员管理侧边栏操作
    openMemberDetail: (member: Member) => {
      set({ selectedMemberDetail: member, isSidebarOpen: true })
    },

    // 部门编辑侧边栏操作
    closeDepartmentSidebar: () => {
      set({ isDepartmentSidebarOpen: false, selectedDepartmentDetail: null })
    },

    closeSidebar: () => {
      set({ isSidebarOpen: false, selectedMemberDetail: null })
    },



    // 部门管理操作，编辑、添加子部门、上移、下移、删除
    handleMoreAction: async (nodeId: string, action: string) => {
      console.log(`Action '${action}' clicked for node:`, nodeId)

      try {
        switch (action) {
          case 'edit':
            try {
              const departmentDetail = await DepartmentService.getDepartmentDetail(nodeId)
              set({ selectedDepartmentDetail: departmentDetail, isDepartmentSidebarOpen: true })
            } catch (error) {
              // 如果API调用失败，使用当前节点数据
              const { orgData } = get()
              const findNodeInTree = (node: DepartmentNode, targetId: string): DepartmentNode | null => {
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
                set({ selectedDepartmentDetail: selectedNode, isDepartmentSidebarOpen: true })
              }
            }
            break
          case 'addChild':
            // 找到父节点信息
            const { orgData } = get()
            const findNodeInTree = (node: DepartmentNode, targetId: string): DepartmentNode | null => {
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
              set({
                isAddChildDepartmentOpen: true,
                addChildParentNodeId: nodeId,
                addChildParentNodeName: parentNode.name
              })
            }
            break
          case 'moveUp':
            console.log('上移部门')
            break
          case 'delete':
            if (!confirm('确定要删除这个部门吗？此操作不可撤销。')) return
            try {
              await departmentService.deleteDepartment(nodeId)
              await get().loadInitialData()
            } catch (error) {
              console.error('Error deleting department:', error)
            }
            break
          default:
            break
        }
      } catch (error) {
        console.error(`Error handling action '${action}' for node ${nodeId}:`, error)
      }
    },

    // 添加部门操作
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

      const findNodeInTree = (node: DepartmentNode, targetId: string): DepartmentNode | null => {
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
    name: 'org-management-store'
  }
))