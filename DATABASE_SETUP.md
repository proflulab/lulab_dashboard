# 数据库设置指南

本项目使用 Supabase (PostgreSQL) 作为数据库。请按照以下步骤设置数据库：

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 等待项目初始化完成

## 2. 获取数据库连接信息

在 Supabase 项目仪表板中：

1. 进入 **Settings** → **Database**
2. 找到 **Connection string** 部分
3. 复制 **URI** 格式的连接字符串

## 3. 获取 API 密钥

在 Supabase 项目仪表板中：

1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**
   - **anon public** 密钥
   - **service_role** 密钥（保密）

## 4. 配置环境变量

编辑 `.env.local` 文件，替换以下变量：

```env
# 数据库连接 URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

## 5. 推送数据库架构

配置完成后，运行以下命令创建数据库表：

```bash
# 推送 Prisma 架构到数据库
pnpm db:push

# 填充示例数据
pnpm db:seed
```

## 6. 验证设置

运行开发服务器并访问仪表板：

```bash
pnpm dev
```

访问 `http://localhost:3000/dashboard` 查看数据是否正确显示。

## 可用的数据库命令

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送架构到数据库（开发环境）
pnpm db:push

# 创建并运行迁移（生产环境）
pnpm db:migrate

# 填充示例数据
pnpm db:seed

# 打开 Prisma Studio（数据库管理界面）
pnpm db:studio

# 重置数据库
pnpm db:reset
```

## 故障排除

### 连接错误
- 确保数据库 URL 正确
- 检查密码是否包含特殊字符（需要 URL 编码）
- 确认 Supabase 项目状态为活跃

### 权限错误
- 确保使用正确的 service_role 密钥
- 检查 Supabase 项目的 RLS（行级安全）设置

### 架构错误
- 运行 `pnpm db:generate` 重新生成客户端
- 检查 `prisma/schema.prisma` 文件语法

## 生产环境部署

在生产环境中：

1. 使用 `pnpm db:migrate` 而不是 `pnpm db:push`
2. 确保环境变量在部署平台中正确设置
3. 不要在生产环境中运行 `pnpm db:seed`