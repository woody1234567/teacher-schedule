## Task 8: 建立認證前端組件和頁面

### 檔案：
- Create: `app/components/auth/LoginForm.vue`
- Create: `app/components/auth/RegisterForm.vue`
- Create: `app/components/auth/GoogleButton.vue`
- Create: `app/pages/auth/login.vue`
- Create: `app/pages/auth/register.vue`
- Create: `app/composables/useAuth.ts`

- [ ] **Step 1: 建立認證組合函數**

建立 `app/composables/useAuth.ts`：

```typescript
import { ref, computed } from 'vue'

export const useAuth = () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!user)
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  const register = async (email: string, name: string, password: string, role: string = 'student') => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, name, password, role },
      })
      
      user.value = response.user
      return response.user
    } catch (err: any) {
      error.value = err.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      
      user.value = response.user
      return response.user
    } catch (err: any) {
      error.value = err.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = ''
    
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      user.value = null
      navigateTo('/auth/login')
    } catch (err: any) {
      error.value = err.data?.message || 'Logout failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getMe = async () => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await $fetch('/api/auth/me')
      user.value = response.user
      return response.user
    } catch (err: any) {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isTeacher,
    isStudent,
    register,
    login,
    logout,
    getMe,
  }
}
```

- [ ] **Step 2: 建立登錄表單組件**

建立 `app/components/auth/LoginForm.vue`：

```vue
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        v-model="email"
        id="email"
        type="email"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="your@email.com"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Password</label>
      <input
        v-model="password"
        id="password"
        type="password"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="At least 8 characters"
      />
    </div>

    <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
    >
      {{ loading ? 'Logging in...' : 'Login' }}
    </button>

    <p class="text-center text-sm">
      Don't have an account?
      <NuxtLink to="/auth/register" class="text-blue-600 hover:underline">
        Register here
      </NuxtLink>
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const { login, loading, error } = useAuth()

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err) {
    // Error is handled by composable
  }
}
</script>
```

- [ ] **Step 3: 建立註冊表單組件**

建立 `app/components/auth/RegisterForm.vue`：

```vue
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        v-model="email"
        id="email"
        type="email"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="your@email.com"
      />
    </div>

    <div>
      <label for="name" class="block text-sm font-medium mb-1">Full Name</label>
      <input
        v-model="name"
        id="name"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="John Doe"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Password</label>
      <input
        v-model="password"
        id="password"
        type="password"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Min 8 chars, 1 uppercase, 1 number"
      />
    </div>

    <div>
      <label for="role" class="block text-sm font-medium mb-1">I am a</label>
      <select
        v-model="role"
        id="role"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
    </div>

    <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
    >
      {{ loading ? 'Registering...' : 'Register' }}
    </button>

    <p class="text-center text-sm">
      Already have an account?
      <NuxtLink to="/auth/login" class="text-blue-600 hover:underline">
        Login here
      </NuxtLink>
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const { register, loading, error } = useAuth()

const email = ref('')
const name = ref('')
const password = ref('')
const role = ref('student')

const handleSubmit = async () => {
  try {
    await register(email.value, name.value, password.value, role.value)
    router.push('/')
  } catch (err) {
    // Error is handled by composable
  }
}
</script>
```

- [ ] **Step 4: 建立登錄和註冊頁面**

建立 `app/pages/auth/login.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>
```

建立 `app/pages/auth/register.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Register</h1>
      <RegisterForm />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>
```

- [ ] **Step 5: 建立空白佈局（for auth pages）**

建立 `app/layouts/blank.vue`：

```vue
<template>
  <slot />
</template>
```

- [ ] **Step 6: 提交**

```bash
git add app/components/auth/ app/pages/auth/ app/composables/useAuth.ts app/layouts/blank.vue
git commit -m "feat: add authentication UI components and pages"
```

