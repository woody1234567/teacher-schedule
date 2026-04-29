## Task 1: 安裝依賴和配置環境

### 檔案：
- Modify: `package.json`
- Modify: `nuxt.config.ts`
- Create: `.env.example`

- [ ] **Step 1: 安裝必要的 npm 套件**

執行命令：
```bash
pnpm add better-auth drizzle-orm postgres dotenv
pnpm add -D drizzle-kit @types/node
```

驗證安裝完成後，執行 `pnpm list | grep -E "better-auth|drizzle-orm|postgres"`

- [ ] **Step 2: 更新 package.json 添加資料庫遷移腳本**

修改 `package.json` 的 `scripts` 部分：

```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "db:migrate": "drizzle-kit migrate --config drizzle.config.ts",
    "db:studio": "drizzle-kit studio --config drizzle.config.ts"
  }
}
```

- [ ] **Step 3: 建立環境變量配置文件**

建立 `.env.example`：

```env
# PostgreSQL 連接
DATABASE_URL=postgresql://user:password@localhost:5432/teacher_schedule

# Better-Auth 配置
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (可選，第一階段可留空)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Node 環境
NODE_ENV=development
```

- [ ] **Step 4: 建立本地 .env 文件**

複製 `.env.example` 為 `.env` 並填入本地配置：

```bash
cp .env.example .env
```

編輯 `.env`：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teacher_schedule
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NODE_ENV=development
```

- [ ] **Step 5: 配置 nuxt.config.ts**

修改 `nuxt.config.ts` 以支援環境變量和服務器路由：

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  
  // 環境變量配置
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  
  // Nuxt Server 配置
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
      },
    },
  },
})
```

- [ ] **Step 6: 建立 drizzle.config.ts**

在專案根目錄建立 `drizzle.config.ts`：

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/teacher_schedule',
  },
} satisfies Config
```

- [ ] **Step 7: 提交**

```bash
git add package.json nuxt.config.ts .env.example drizzle.config.ts
git commit -m "chore: setup database and auth dependencies"
```

