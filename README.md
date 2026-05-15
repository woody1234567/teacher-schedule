# 老師排課系統 (Teacher Schedule System)

這是一個基於 Nuxt 4 與 Vue 3 所打造的全端 (Full-stack) 應用程式，旨在提供教師進行線上排課、行事曆管理及學生預約等功能。

## 🏗️ 專案架構 (Project Architecture)

本專案採用全端 Nuxt 架構，前端與後端緊密整合，並搭配現代化的工具鏈：

### 核心技術棧
*   **全端框架**: [Nuxt 4](https://nuxt.com/) (基於 Vue 3 Composition API 與 `<script setup>`)
*   **UI 組件庫**: [@nuxt/ui v4](https://ui.nuxt.com/) (搭配 Tailwind CSS 提供高度客製化與無障礙設計)
*   **後端引擎**: Nitro (處理 API 路由與伺服器端渲染)
*   **身分驗證**: [Better Auth](https://better-auth.com/) (處理信箱/密碼登入、Session 狀態及安全策略)
*   **資料庫**: PostgreSQL
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (型別安全的資料庫操作與遷移)
*   **套件管理**: pnpm
*   **單元/整合測試**: Vitest

### 📂 目錄結構
*   `app/` - **前端程式碼**
    *   `pages/`: 頁面路由 (例如 `/teacher/calendar` 或 `/student/teachers/[id]`)
    *   `components/`: Vue 共用組件 (例如 `EventCard.vue`, `EventForm.vue`)
    *   `layouts/`: 全域版面配置
    *   `composables/`: 可重用的組合式函數 (如 `useCalendar.ts`)
    *   `utils/`: 前端輔助函數
    *   `assets/css/`: 全域樣式 (如 `main.css`)
*   `server/` - **後端程式碼**
    *   `api/`: 後端 API 路由 (如 `/api/calendar`)
    *   `db/`: Drizzle ORM Schema、資料庫連線與遷移檔
    *   `utils/`: 後端輔助函數 (如 `better-auth.ts` 設定)
*   `tests/` - **測試程式碼**
    *   `unit/`: 獨立的單元測試
    *   `integration/`: 需連接資料庫或測試完整流程的整合測試
*   `docs/superpowers/` - 專案規劃與開發日誌

---

## 🛠️ 本地開發 (Local Development)

1.  **安裝依賴套件**:
    ```bash
    pnpm install
    ```
2.  **環境變數設定**:
    複製 `.env.example` 為 `.env`，並填入必要的變數 (如 `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)。
    ```bash
    cp .env.example .env
    ```
3.  **啟動本地資料庫**:
    透過專案內的 `docker-compose.yml` 快速啟動 PostgreSQL 服務：
    ```bash
    docker compose up -d
    ```
4.  **執行資料庫遷移**:
    套用 Drizzle 遷移檔至本地資料庫：
    ```bash
    pnpm db:migrate
    ```
5.  **啟動開發伺服器**:
    ```bash
    pnpm dev
    ```
    現在你可以前往 `http://localhost:3000` 預覽應用程式。

---

## ☁️ 雲端 Docker 部署 (Cloud Deployment via Docker)

在雲端環境中，建議透過 Docker 容器化部署以確保環境一致性。專案中已提供了 `Dockerfile` 和 `docker-compose.prod.yml` 檔案。

### 部署步驟

登入您的雲端伺服器 (VPS 或雲端主機)，並遵循以下步驟：

1.  **拉取程式碼**：從 Git 儲存庫拉取最新程式碼至伺服器。
2.  **設定正式環境變數**：
    複製一份 `.env` 供正式環境使用，並將 `docker-compose.prod.yml` 中所需的環境變數 (如資料庫密碼、`BETTER_AUTH_SECRET` 及網域) 替換為真實的生產環境配置。
3.  **建置與啟動服務**：
    透過 Docker Compose 同時啟動 Web 應用與 PostgreSQL 資料庫容器：
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```
4.  **執行資料庫遷移 (Production)**：
    應用程式啟動前或啟動後，需針對正式資料庫執行資料庫遷移。可於本機連線至雲端資料庫執行，或是進入容器內執行遷移指令：
    ```bash
    # 範例：使用 npx 執行 Drizzle migration
    npx drizzle-kit push
    ```
5.  **設定反向代理 (推薦)**：
    在正式上線時，建議使用 Nginx, Caddy 或是 Traefik 作為反向代理，將伺服器的 80/443 port 轉發至內部 Docker 容器的 3000 port，並為網站網域 (如 `https://your-domain.com`) 配置 SSL 憑證。
