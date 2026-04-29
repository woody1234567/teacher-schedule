# 工作紀錄：Task 3 - 建立密碼工具函數和測試

**完成日期：** 2026-04-29  
**狀態：** ✅ 完成  
**耗時：** 約 10 分鐘

---

## 執行過程中遇到的問題

### 1. argon2 native 模組需要 build scripts 批准

**問題描述：**  
pnpm 10 的安全機制預設不允許 native 模組執行 build scripts。安裝 argon2 後出現警告：
```
Ignored build scripts: argon2@0.44.0
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```
由於 `pnpm approve-builds` 是互動式指令，無法在非互動環境中執行。

**解決方法：**  
在 `package.json` 中添加 `pnpm.onlyBuiltDependencies` 設定，允許特定套件執行 build scripts，再重新 `pnpm install` 觸發編譯：

```json
"pnpm": {
  "onlyBuiltDependencies": ["argon2", "@parcel/watcher", "esbuild", "vue-demi"]
}
```

argon2 成功完成 native 編譯（gyp info ok）。

**結果：** ✅ 已解決

---

### 2. Vitest 路徑別名 `~` 指向錯誤目錄

**問題描述：**  
`vitest.config.ts` 中的路徑別名 `~` 原本指向 `./app` 目錄（Nuxt 前端應用根目錄），但測試中 import 的是 `~/server/utils/auth`，而 `server/` 在專案根目錄，不在 `app/` 下。

**解決方法：**  
將 `vitest.config.ts` 的 alias 改為指向專案根目錄：

```typescript
// 修改前
'~': fileURLToPath(new URL('./app', import.meta.url))

// 修改後
'~': fileURLToPath(new URL('.', import.meta.url))
```

**影響評估：** 此修改不影響現有 DB 測試（路徑 `server/db` 不依賴 alias），經驗證 2 個 DB 測試仍然通過。

**結果：** ✅ 已解決

---

## 所使用的解決方法

### 1. TDD 流程（先測試後實現）
按照計畫的 TDD 流程：先建立 4 個測試（預期失敗），再實現函數使測試通過。

### 2. Argon2id 密碼雜湊配置
選用業界推薦的 Argon2id 模式（type: 2），配置：
- `memoryCost: 19456`（19 MiB，OWASP 建議的最低值）
- `timeCost: 2`（迭代次數）
- `parallelism: 1`（並行因子）

此配置在安全性（抵抗暴力破解）和效能（<1秒回應）之間取得平衡。

### 3. 驗證函數設計
除核心密碼工具外，也提供可重用的驗證函數：
- `validateEmail`：格式驗證
- `validatePassword`：長度、大寫字母、數字要求
- `validateName`：非空和長度限制

返回 `ValidationError[]` 類型，統一錯誤格式，方便 API 層使用。

---

## 獲得的成果

### ✅ 測試通過（4/4）
```
Test Files  1 passed (1)
Tests       4 passed (4)
Duration    429ms
```

測試項目：
1. ✅ should hash a password
2. ✅ should verify correct password
3. ✅ should reject incorrect password
4. ✅ should generate different hashes for same password（驗證 salt 機制正常）

### ✅ 已創建的文件
- `server/utils/auth.ts` - 密碼工具函數（hashPassword、verifyPassword、generateSessionToken、validateEmail、validatePassword、validateName）
- `tests/unit/auth/password.test.ts` - 4 個 TDD 測試

### ✅ 已更新的文件
- `package.json` - 添加 argon2 依賴和 pnpm.onlyBuiltDependencies 配置
- `vitest.config.ts` - 修正 `~` 路徑別名指向專案根目錄

### ✅ Git 提交
```
commit 9a2622c
Message: feat: implement password hashing utilities with Argon2 and TDD tests
```

---

## 檢查清單
- [x] 建立 TDD 測試（先於實現）
- [x] 安裝並編譯 argon2 native 模組
- [x] 實現 hashPassword（Argon2id）
- [x] 實現 verifyPassword
- [x] 實現 generateSessionToken（crypto random）
- [x] 實現驗證函數（validateEmail、validatePassword、validateName）
- [x] 修正 Vitest 路徑別名
- [x] 4 個密碼測試全部通過
- [x] 確認原有 DB 測試（2個）仍然通過
- [x] 提交所有更改到 git
- [x] 建立工作紀錄
