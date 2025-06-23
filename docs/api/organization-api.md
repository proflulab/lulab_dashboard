# 组织架构 API 接口文档

本文档描述了组织架构相关的 API 接口，用于获取组织、部门和成员数据。

## 接口概览

### 组织相关接口

1. **GET /api/organization** - 获取用户组织信息或组织列表
2. **GET /api/organization/tree** - 获取组织架构树
3. **GET /api/organization/[organizationId]/members** - 获取组织成员列表

### 部门相关接口

4. **GET /api/departments** - 获取部门列表
5. **GET /api/departments/[departmentId]/members** - 获取部门成员列表

## 详细接口说明

### 1. 获取组织信息

**接口地址：** `GET /api/organization`

**查询参数：**
- `list` (可选): 设置为 `true` 时返回所有组织列表

**响应示例：**

```json
// 获取用户组织信息 (不带 list 参数)
{
  "success": true,
  "data": {
    "id": "org-123",
    "name": "LULAB",
    "code": "LULAB",
    "description": "默认组织"
  }
}

// 获取组织列表 (list=true)
{
  "success": true,
  "data": [
    {
      "id": "org-123",
      "name": "LULAB",
      "code": "LULAB",
      "description": "默认组织",
      "memberCount": 25,
      "departmentCount": 5
    }
  ]
}
```

### 2. 获取组织架构树

**接口地址：** `GET /api/organization/tree`

**查询参数：**
- `organizationId` (可选): 指定组织ID
- `type` (可选): 'full' | 'departments'，默认为 'full'

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "org-123",
    "name": "LULAB",
    "memberCount": 25,
    "type": "company",
    "isExpanded": true,
    "children": [
      {
        "id": "dept-456",
        "name": "技术部",
        "memberCount": 15,
        "type": "department",
        "isExpanded": false,
        "children": [
          {
            "id": "dept-789",
            "name": "前端组",
            "memberCount": 8,
            "type": "team",
            "isExpanded": false,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 3. 获取组织成员列表

**接口地址：** `GET /api/organization/[organizationId]/members`

**查询参数：**
- `departmentId` (可选): 筛选指定部门的成员
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 50
- `search` (可选): 搜索关键词（姓名、邮箱、手机号）

**响应示例：**

```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org-123",
      "name": "LULAB",
      "code": "LULAB",
      "description": "默认组织"
    },
    "members": [
      {
        "id": "user-123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "countryCode": "+86",
        "avatar": "",
        "department": "技术部",
        "departmentId": "dept-456",
        "organization": "LULAB",
        "organizationId": "org-123",
        "roles": [
          {
            "id": "role-123",
            "name": "开发工程师",
            "code": "developer"
          }
        ],
        "status": "active",
        "accountStatus": "正常",
        "position": "开发工程师",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "allDepartments": [
          {
            "id": "dept-456",
            "name": "技术部",
            "code": "tech"
          }
        ]
      }
    ],
    "departmentStats": [
      {
        "id": "dept-456",
        "name": "技术部",
        "memberCount": 15
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    },
    "filters": {
      "departmentId": null,
      "search": ""
    }
  }
}
```

### 4. 获取部门列表

**接口地址：** `GET /api/departments`

**查询参数：**
- `organizationId` (可选): 指定组织ID
- `flat` (可选): 设置为 `true` 时返回平铺列表，否则返回树形结构

**响应示例：**

```json
// 树形结构 (默认)
{
  "success": true,
  "data": [
    {
      "id": "dept-456",
      "name": "技术部",
      "memberCount": 15,
      "type": "department",
      "isExpanded": false,
      "children": [
        {
          "id": "dept-789",
          "name": "前端组",
          "memberCount": 8,
          "type": "team",
          "isExpanded": false,
          "children": []
        }
      ]
    }
  ]
}

// 平铺列表 (flat=true)
{
  "success": true,
  "data": [
    {
      "id": "dept-456",
      "name": "技术部",
      "code": "tech",
      "description": "技术研发部门",
      "organizationId": "org-123",
      "parentId": null,
      "level": 1,
      "memberCount": 15
    },
    {
      "id": "dept-789",
      "name": "前端组",
      "code": "frontend",
      "description": "前端开发组",
      "organizationId": "org-123",
      "parentId": "dept-456",
      "level": 2,
      "memberCount": 8
    }
  ]
}
```

### 5. 获取部门成员列表

**接口地址：** `GET /api/departments/[departmentId]/members`

**查询参数：**
- `includeSubDepartments` (可选): 设置为 `true` 时包含子部门成员

**响应示例：**

```json
{
  "success": true,
  "data": {
    "department": {
      "id": "dept-456",
      "name": "技术部",
      "code": "tech",
      "description": "技术研发部门",
      "organizationId": "org-123",
      "organizationName": "LULAB",
      "parentId": null,
      "parentName": null,
      "level": 1
    },
    "members": [
      {
        "id": "user-123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "countryCode": "+86",
        "avatar": "",
        "department": "技术部",
        "departmentId": "dept-456",
        "organization": "LULAB",
        "organizationId": "org-123",
        "roles": [
          {
            "id": "role-123",
            "name": "开发工程师",
            "code": "developer"
          }
        ],
        "status": "active",
        "accountStatus": "正常",
        "position": "开发工程师",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "includeSubDepartments": false,
    "totalMembers": 15
  },
  "metadata": {
    "departmentIds": ["dept-456"],
    "generatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 数据类型定义

### OrganizationNode

```typescript
interface OrganizationNode {
  id: string
  name: string
  memberCount: number
  type: 'company' | 'department' | 'team'
  children: OrganizationNode[]
  isExpanded: boolean
}
```

### Member

```typescript
interface Member {
  id: string
  name: string
  email: string
  phone: string
  countryCode: string
  avatar: string
  department: string
  departmentId: string | null
  organization: string
  organizationId: string
  roles: Role[]
  status: 'active' | 'inactive'
  accountStatus: string
  position: string
  createdAt: string
  updatedAt: string
}
```

### Role

```typescript
interface Role {
  id: string
  name: string
  code: string
}
```

## 错误处理

所有接口都会返回统一的错误格式：

```json
{
  "error": "错误信息"
}
```

常见的 HTTP 状态码：
- `200` - 成功
- `401` - 未授权访问
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

## 权限要求

所有接口都需要用户登录，并且需要相应的权限：
- 查看组织信息：需要 `organizations.view` 权限
- 查看用户信息：需要 `users.view` 权限

## 使用示例

### 前端调用示例

```typescript
// 获取组织架构树
const getOrganizationTree = async (organizationId?: string) => {
  const params = new URLSearchParams()
  if (organizationId) {
    params.append('organizationId', organizationId)
  }
  
  const response = await fetch(`/api/organization/tree?${params}`)
  const data = await response.json()
  return data
}

// 获取部门成员
const getDepartmentMembers = async (departmentId: string, includeSubDepartments = false) => {
  const params = new URLSearchParams()
  if (includeSubDepartments) {
    params.append('includeSubDepartments', 'true')
  }
  
  const response = await fetch(`/api/departments/${departmentId}/members?${params}`)
  const data = await response.json()
  return data
}

// 搜索组织成员
const searchOrganizationMembers = async (organizationId: string, search: string) => {
  const params = new URLSearchParams({
    search,
    page: '1',
    limit: '20'
  })
  
  const response = await fetch(`/api/organization/${organizationId}/members?${params}`)
  const data = await response.json()
  return data
}
```

这些接口提供了完整的组织架构数据获取功能，可以满足前端页面 `/app/dashboard/contacts/departmentanduser/page.tsx` 中组织架构展示的需求。