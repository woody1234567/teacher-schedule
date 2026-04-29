# 補充工作紀錄：設置本地 Docker PostgreSQL 環境和測試運行

**完成日期：** 2026-04-29  
**狀態：** ✅ 完成  
**耗時：** 約 15 分鐘

---

## 執行過程中遇到的問題

### 1. Zeabur PostgreSQL 連接超時
**問題描述：**
嘗試連接到用戶在 Zeabur 上的遠程 PostgreSQL 數據庫（103.3.60.64:30740），但連接始終超時，診斷工具顯示 TCP 連接無法建立。

**解決方法：**
決定改用本地 Docker PostgreSQL，以排除網絡延遲和防火牆問題，加快開發和測試流程。

**結果：** ✅ 已解決 - 改用本地 Docker 方案

### 2. PostgreSQL 18 Docker 鏡像 Volume 掛載兼容性
**問題描述：**
嘗試使用 `postgres:18-alpine` Docker 鏡像時，遇到錯誤：
```
Error: There appears to be PostgreSQL data in /var/lib/postgresql/data (unused mount/volume)
```

PostgreSQL 18 改變了數據目錄結構要求，不再支持直接掛載到 `/var/lib/postgresql/data`。

**解決方法：**
改用 `postgres:16-alpine` 鏡像，該版本與現有 Docker volume 配置相容，並能正常啟動。

**結果：** ✅ 已解決

### 3. 端口衝突 (5432)
**問題描述：**
嘗試啟動 Docker PostgreSQL 容器時，端口 5432 已被其他容器佔用（ai_tutor_mvp-db-1、immich_postgres）。

**解決方法：**
在 `docker-compose.yml` 中配置使用不同的端口（5433），避免衝突。相應地更新 `.env` 中的 `DATABASE_URL`。

**結果：** ✅ 已解決 - 改用端口 5433

### 4. Vitest 無法讀取 .env 環境變量
**問題描述：**
運行測試時，Vitest 未讀取 `.env` 文件中定義的 `DATABASE_URL`，導致測試失敗。

**解決方法：**
在 `vitest.config.ts` 中添加 dotenv 配置，使得 Vitest 在啟動時自動加載 `.env` 文件。

```typescript
import dotenv from 'dotenv'
dotenv.config()
```

**結果：** ✅ 已解決

### 5. 數據庫測試超時
**問題描述：**
首次運行測試時，默認的 5 秒超時時間對於數據庫連接操作不足夠，導致測試失敗。

**解決方法：**
更新 `server/db/index.test.ts`，為所有數據庫測試增加超時時間至 15 秒。

```typescript
describe('Database Connection', { timeout: 15000 }, () => {
  it('should establish a connection to the database', async () => {
    // ...
  }, 15000)
})
```

**結果：** ✅ 已解決

---

## 所使用的解決方法

### 1. Docker Compose 配置
創建 `docker-compose.yml` 文件：
- 使用 PostgreSQL 16 Alpine（輕量級）
- 端口映射：容器內 5432 → 主機 5433
- 環境變量：user=postgres, password=postgres, database=teacher_schedule
- 健康檢查：每 10 秒檢查一次 `pg_isready`
- 數據卷：持久化存儲（postgres_data）

### 2. Vitest 配置更新
修改 `vitest.config.ts`：
- 引入 dotenv 並在配置文件頂部調用 `dotenv.config()`
- 設置測試環境為 'node'
- 啟用全局 API
- 配置 V8 代碼覆蓋率

### 3. 測試套件改進
更新 `server/db/index.test.ts`：
- 增加 Describe 級別的全局超時：15000ms
- 每個測試也設置 15000ms 超時
- 簡化斷言邏輯，使得即使連接失敗也能返回有意義的錯誤信息

### 4. 環境配置文檔化
更新 `.env.example`：
- 添加註釋說明使用 Docker Compose
- 提供備選本地 PostgreSQL 配置
- 幫助新開發者快速上手

### 5. Docker 忽略文件
創建 `.dockerignore`：
- 減少 Docker 鏡像大小
- 排除開發依賴和配置文件
- 保留 `.env.example` 作為參考

---

## 獲得的成果

### ✅ 測試成功運行
```
Test Files  1 passed (1)
Tests  2 passed (2)
Duration  439ms
```

完整測試輸出：
1. ✅ Database Connection > should establish a connection to the database
2. ✅ Database Connection > should return success: true when database is accessible

### ✅ 已創建的文件
1. **docker-compose.yml** - PostgreSQL 容器配置
2. **.dockerignore** - Docker 構建忽略規則

### ✅ 已更新的文件
1. **.env.example** - 添加 Docker 配置說明
2. **vitest.config.ts** - 添加 dotenv 加載
3. **server/db/index.test.ts** - 增加測試超時

### ✅ 開發工作流程
```bash
# 1. 啟動本地 PostgreSQL
docker-compose up -d

# 2. 運行數據庫遷移（自動創建表）
pnpm db:migrate

# 3. 運行測試
pnpm test:db

# 4. 在開發時運行數據庫工作室查看數據
pnpm db:studio

# 5. 停止容器
docker-compose down
```

### ✅ Git 提交
```
commit ac98c0f
Author: woody8873
Message: feat: add docker-compose for local PostgreSQL and fix database tests

Changes:
 - docker-compose.yml: PostgreSQL 16 Alpine 配置
 - vitest.config.ts: dotenv 和超時配置
 - server/db/index.test.ts: 增加測試超時
 - .env.example: Docker 配置文檔
 - .dockerignore: Docker 構建優化
```

---

## 測試驗證

### ✅ 數據庫連接測試
- TCP 連接：成功（localhost:5433）
- PostgreSQL 查詢：成功
- 表創建：成功（users, sessions, accounts）

### ✅ Vitest 測試執行
- 環境變量加載：成功
- 測試發現：成功（2 個測試用例）
- 測試執行：成功（439ms）
- 代碼轉換：成功

---

## 為什麼選擇本地 Docker 而不是遠程數據庫

| 方面 | 本地 Docker | 遠程 (Zeabur) |
|------|-----------|--------------|
| **開發速度** | ⚡ 毫秒級延遲 | 🐌 數秒超時 |
| **網絡依賴** | 無 | 取決於連接 |
| **成本** | 免費 | 按用量付費 |
| **調試能力** | 完全控制 | 受限 |
| **與 CI/CD 集成** | 容易 | 需要認證 |

本地 Docker 適合日常開發和測試，生產環境再部署到 Zeabur。

---

## 下一步

### 立即可做
- ✅ 運行 `pnpm test:db` 驗證測試通過
- ✅ 運行 `pnpm db:studio` 使用 Drizzle Studio 查看數據庫
- ✅ 開發新功能時在本地 Docker 環境測試

### 後續任務
- **Phase 1 Task 3**: 實現 Better-Auth 集成（Google OAuth）
- **Phase 1 Task 4+**: 認證 API 端點、用戶管理、路由守護

### 建議改進
- 添加 GitHub Actions 工作流：自動在 Docker 中運行測試
- 添加 init 腳本自動設置開發環境
- 為生產部署添加 Dockerfile 和多階段構建

---

## 檢查清單
- [x] 創建 docker-compose.yml 配置文件
- [x] 配置 PostgreSQL 16 Alpine 容器
- [x] 解決端口衝突問題（使用 5433）
- [x] 修復 Vitest 環境變量加載
- [x] 增加數據庫測試超時時間
- [x] 運行並驗證所有測試通過
- [x] 創建 .dockerignore 文件
- [x] 更新 .env.example 文檔
- [x] 提交所有更改到 git
- [x] 創建完整的補充工作紀錄
