# 教師課程預約系統 - 實作計畫總覽

> **對於代理工作者：** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 按任務逐步實施此計畫。

**目標：** 建立一個完整的 Nuxt 全端應用，讓教師管理課程行事曆，學生可以查看空閒時間並發送預約請求，教師可以審核並確認預約。

**技術堆棧：**
- Nuxt 4 (全端 SSR 框架)
- Vue 3 Composition API
- @nuxt/ui (組件庫)
- Tailwind CSS 4
- TypeScript
- PostgreSQL (資料庫)
- Drizzle ORM (資料庫操作)
- Better-Auth (認證：Google OAuth + 密碼登錄)
- Vitest (單元測試)
- TDD (測試驅動開發)

---

## 項目架構概述

### 資料庫層
```
Users (用戶表)
├── id, email, name, role (teacher/student)
├── password_hash, google_id
├── created_at, updated_at

CalendarEvents (行事曆事件)
├── id, teacher_id, title, description
├── start_time, end_time, is_available
├── created_at, updated_at

BookingRequests (預約請求)
├── id, student_id, teacher_id, calendar_event_id
├── status (pending/approved/rejected)
├── requested_at, responded_at

Bookings (確認預約)
├── id, student_id, teacher_id, calendar_event_id
├── booking_date, created_at
```

### API 端點
```
認證相關：
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google (Google OAuth)
- POST /api/auth/logout

行事曆管理（教師）：
- GET /api/calendar (獲取自己的行事曆)
- POST /api/calendar (新增事件)
- PUT /api/calendar/:id (編輯事件)
- DELETE /api/calendar/:id (刪除事件)

預約系統：
- GET /api/bookings/available (獲取教師可用時間)
- POST /api/bookings/request (學生提交請求)
- GET /api/bookings/requests (教師查看請求)
- PUT /api/bookings/requests/:id (教師審核請求)

用戶管理：
- GET /api/users/profile (獲取個人資料)
- PUT /api/users/profile (更新個人資料)
```

### 前端頁面結構
```
登錄/註冊
├── /auth/login (登錄頁面)
├── /auth/register (註冊頁面)

儀表板
├── / (根據角色重定向)

教師端
├── /teacher/dashboard (教師首頁)
├── /teacher/calendar (行事曆管理)
├── /teacher/requests (預約請求審核)
├── /teacher/bookings (已確認預約)

學生端
├── /student/dashboard (學生首頁)
├── /student/teachers (教師列表)
├── /student/teachers/:id (教師詳情 + 預約)
├── /student/my-bookings (我的預約)
```

---

## 三階段實施計畫

### 🔐 第一階段：認證系統 + 資料庫架構
**目標：** 建立完整的認證系統和資料庫基礎

**核心任務：**
- 設定 PostgreSQL 資料庫連接
- 配置 Better-Auth (Google OAuth + 密碼登錄)
- 建立用戶資料庫表
- 建立認證 API 端點
- 建立認證前端界面（登錄/註冊）
- 實現路由守衛（認證保護）

**預期產出：** 用戶可以通過 Google 或密碼註冊/登錄，系統能正確識別用戶身份和角色。

---

### 📅 第二階段：行事曆管理系統
**目標：** 實現教師行事曆的完整 CRUD 操作

**核心任務：**
- 建立 CalendarEvents 資料庫表
- 建立行事曆 API 端點 (CRUD)
- 建立教師端行事曆 UI 組件
- 實現行事曆視圖（月視圖/週視圖）
- 實現新增/編輯/刪除事件功能
- 實現可用性標記（標記為可預約時段）

**預期產出：** 教師可以完全管理自己的課程時間表，學生可以查看教師的可用時間。

---

### 📋 第三階段：預約系統 + 實時更新
**目標：** 完整的預約請求和審核流程，以及實時通知

**核心任務：**
- 建立 BookingRequests 和 Bookings 資料庫表
- 建立預約 API 端點（請求、審核、取消）
- 建立學生端預約 UI（選擇時間、發送請求）
- 建立教師端審核 UI（查看、接受/拒絕請求）
- 實現實時更新（WebSocket 或 Nitro 伺服器事件）
- 實現預約通知系統

**預期產出：** 完整的預約流程，所有用戶實時看到行事曆更新。

---

## 開發工作流

### 每個階段遵循：
1. **編寫測試** - 為新功能寫失敗的測試
2. **運行測試** - 驗證測試失敗
3. **實現功能** - 寫最小必要的程式碼
4. **驗證測試** - 測試通過
5. **提交代碼** - 定期小提交

### 測試範圍
- **單元測試**：API 邏輯、資料庫查詢、工具函數
- **集成測試**：API 端點、認證流程、預約流程
- **UI 測試**（輕量）：關鍵用戶流程（非 e2e）

---

## 檔案結構（最終狀態）

```
teacher-schedule/
├── app/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── GoogleButton.vue
│   │   ├── calendar/
│   │   │   ├── CalendarView.vue
│   │   │   ├── EventForm.vue
│   │   │   └── EventCard.vue
│   │   ├── bookings/
│   │   │   ├── BookingRequestCard.vue
│   │   │   ├── BookingList.vue
│   │   │   └── BookingForm.vue
│   │   └── common/
│   │       ├── Navigation.vue
│   │       └── UserMenu.vue
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.vue
│   │   │   └── register.vue
│   │   ├── teacher/
│   │   │   ├── dashboard.vue
│   │   │   ├── calendar.vue
│   │   │   ├── requests.vue
│   │   │   └── bookings.vue
│   │   ├── student/
│   │   │   ├── dashboard.vue
│   │   │   ├── teachers.vue
│   │   │   ├── teachers/[id].vue
│   │   │   └── my-bookings.vue
│   │   └── index.vue
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useCalendar.ts
│   │   └── useBookings.ts
│   ├── app.vue
│   └── assets/css/main.css
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.post.ts
│   │   │   ├── login.post.ts
│   │   │   ├── google.post.ts
│   │   │   └── logout.post.ts
│   │   ├── calendar/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   └── bookings/
│   │       ├── available.get.ts
│   │       ├── request.post.ts
│   │       ├── requests.get.ts
│   │       ├── requests/[id].put.ts
│   │       └── cancel.delete.ts
│   ├── db/
│   │   ├── schema.ts (Drizzle 資料庫結構)
│   │   ├── index.ts (資料庫連接)
│   │   └── queries/
│   │       ├── users.ts
│   │       ├── calendar.ts
│   │       └── bookings.ts
│   └── utils/
│       ├── auth.ts
│       └── validation.ts
├── tests/
│   ├── unit/
│   │   ├── auth/
│   │   ├── calendar/
│   │   └── bookings/
│   └── integration/
│       ├── auth.test.ts
│       ├── calendar.test.ts
│       └── bookings.test.ts
├── nuxt.config.ts
├── tsconfig.json
└── package.json
```

---

## 下一步

現在準備詳細展開 **第一階段：認證系統 + 資料庫架構** 的具體任務。

點擊下方選項繼續：
- [展開第一階段詳細計畫](#第一階段詳細計畫)
- 或告訴我是否需要調整任何架構決策
