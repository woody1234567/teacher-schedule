## Task 9: 建立認證中間件和路由守衛

### 檔案：
- Create: `app/middleware/auth.ts`
- Modify: `app/pages/index.vue` (添加重定向邏輯)

- [ ] **Step 1: 建立認證中間件**

建立 `app/middleware/auth.ts`：

```typescript
export default defineRouteMiddleware(async (to, from) => {
  const { user, getMe } = useAuth()

  // 如果用戶未加載，嘗試從伺服器獲取
  if (!user.value) {
    await getMe().catch(() => {
      // 未認證
    })
  }

  // 如果訪問受保護路由但未認證，重定向到登錄
  const protectedRoutes = ['/teacher', '/student']
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

  if (isProtectedRoute && !user.value) {
    return navigateTo('/auth/login')
  }

  // 防止已認證用戶訪問認證頁面
  if (user.value && to.path.startsWith('/auth')) {
    return navigateTo('/')
  }
})
```

- [ ] **Step 2: 建立根頁面重定向邏輯**

修改或建立 `app/pages/index.vue`：

```vue
<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <p>Loading...</p>
  </div>
  <div v-else class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-bold">Teacher Schedule</h1>
          <div v-if="user" class="flex items-center gap-4">
            <span>{{ user.name }}</span>
            <button @click="handleLogout" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="user" class="text-center">
        <h2 class="text-3xl font-bold mb-4">Welcome, {{ user.name }}!</h2>
        <p class="text-gray-600 mb-8">You are logged in as a {{ user.role }}</p>
        
        <div v-if="user.role === 'teacher'" class="space-y-4">
          <NuxtLink 
            to="/teacher/calendar" 
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Calendar
          </NuxtLink>
          <NuxtLink 
            to="/teacher/requests" 
            class="inline-block ml-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View Booking Requests
          </NuxtLink>
        </div>

        <div v-if="user.role === 'student'" class="space-y-4">
          <NuxtLink 
            to="/student/teachers" 
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Teachers
          </NuxtLink>
          <NuxtLink 
            to="/student/my-bookings" 
            class="inline-block ml-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            My Bookings
          </NuxtLink>
        </div>
      </div>

      <div v-else class="text-center">
        <h2 class="text-3xl font-bold mb-4">Welcome to Teacher Schedule</h2>
        <p class="text-gray-600 mb-8">Please login or register to continue</p>
        
        <div class="space-x-4">
          <NuxtLink 
            to="/auth/login" 
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </NuxtLink>
          <NuxtLink 
            to="/auth/register" 
            class="inline-block px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Register
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { user, getMe, logout, loading } = useAuth()

onMounted(async () => {
  await getMe()
})

const handleLogout = async () => {
  await logout()
}
</script>
```

- [ ] **Step 3: 在根頁面應用中間件**

編輯 `app/pages/index.vue` 添加頁面元數據：

```typescript
definePageMeta({
  middleware: 'auth',
})
```

- [ ] **Step 4: 提交**

```bash
git add app/middleware/auth.ts app/pages/index.vue
git commit -m "feat: add authentication middleware and route guards"
```

