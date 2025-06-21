# 陆向谦实验室管理系统

这是一个基于 Next.js 14 构建的现代化实验室管理系统，使用 Supabase (PostgreSQL) 作为数据库，支持学生、教师和课程的全面管理。

## 🚀 功能特性

### 核心功能
- **用户认证**: 基于 Auth.js 的安全认证系统
- **角色管理**: 支持管理员、教师、学生三种角色
- **学生管理**: 学生信息的增删改查，课程注册管理
- **教师管理**: 教师资料管理，课程分配
- **课程管理**: 课程创建、编辑、状态管理
- **数据统计**: 实时的仪表板数据展示
- **响应式设计**: 适配桌面和移动设备

### 技术栈
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **UI 组件**: Tailwind CSS, Shadcn/ui, Lucide Icons
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **认证**: Auth.js (NextAuth.js)
- **包管理**: pnpm

## 📦 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd lulab_dashboard
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量。

### 4. 数据库设置

详细的数据库设置步骤请参考 [DATABASE_SETUP.md](./DATABASE_SETUP.md)。

简要步骤：
1. 创建 Supabase 项目
2. 配置环境变量
3. 推送数据库架构
4. 填充示例数据

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送架构到数据库
pnpm db:push

# 填充示例数据
pnpm db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🗂️ 项目结构

```
lulab_dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── dashboard/         # 仪表板页面
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── layout/           # 布局组件
│   └── dashboard/        # 仪表板组件
├── lib/                   # 工具库
│   ├── db.ts             # 数据库服务
│   ├── prisma.ts         # Prisma 客户端
│   └── supabase.ts       # Supabase 客户端
├── prisma/               # 数据库相关
│   ├── schema.prisma     # 数据库架构
│   └── seed.ts           # 种子数据
└── auth.config.ts        # 认证配置
```

## 🛠️ 可用命令

### 开发命令
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
```

### 数据库命令
```bash
pnpm db:generate  # 生成 Prisma 客户端
pnpm db:push      # 推送架构到数据库
pnpm db:migrate   # 创建并运行迁移
pnpm db:seed      # 填充示例数据
pnpm db:studio    # 打开 Prisma Studio
pnpm db:reset     # 重置数据库
```

## 🔐 默认账户

系统会自动创建一个管理员账户：
- **邮箱**: admin@lulab.com
- **密码**: admin123

## 📱 功能模块

### 仪表板
- 实时统计数据展示
- 最近活动记录
- 数据可视化图表

### 学生管理
- 学生信息的完整 CRUD 操作
- 课程注册状态管理
- 学习进度跟踪

### 教师管理
- 教师资料管理
- 课程分配和管理
- 教学评价系统

### 课程管理
- 课程创建和编辑
- 课程状态管理（草稿/活跃/已完成）
- 学生注册管理

## 🚀 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

确保在生产环境中设置以下环境变量：
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 📄 许可证

MIT License
