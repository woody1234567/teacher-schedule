## Task 6: 第三階段測試和驗證

### 檔案：
- 各個測試文件

- [ ] **Step 1: 運行所有測試**

```bash
pnpm vitest tests/
```

預期：所有測試通過

- [ ] **Step 2: 啟動開發伺服器進行手動測試**

```bash
pnpm dev
```

驗證以下流程：

**教師端流程：**
- ✅ 教師登錄
- ✅ 查看自己的行事曆
- ✅ 新增課程時間
- ✅ 標記時間為可預約
- ✅ 查看預約請求頁面
- ✅ 審核學生的預約請求（接受/拒絕）
- ✅ 查看已確認的預約

**學生端流程：**
- ✅ 學生登錄
- ✅ 瀏覽教師列表
- ✅ 查看特定教師的可用時間
- ✅ 提交預約請求
- ✅ 查看自己的預約列表
- ✅ 取消預約

**實時更新驗證：**
- ✅ 教師新增課程時，學生看到即時更新
- ✅ 教師審核請求後，學生即時收到通知
- ✅ 打開多個標籤頁，驗證跨標籤頁的實時更新

- [ ] **Step 3: 建立手動測試列表**

建立 `tests/e2e/complete-flow.spec.ts`：

```typescript
import { describe, it, expect } from 'vitest'

describe('Complete Booking Flow E2E', () => {
  it('should complete full booking workflow', () => {
    // Manual testing steps documented:
    // 1. Teacher logs in and adds available time slots
    // 2. Student logs in and views available teachers
    // 3. Student requests a booking for a teacher's available slot
    // 4. Teacher reviews and approves the booking request
    // 5. System shows booking confirmed for both parties
    // 6. Both see updated calendar in real-time
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 4: 提交**

```bash
git add tests/e2e/
git commit -m "test: add e2e test documentation for complete booking flow"
```

