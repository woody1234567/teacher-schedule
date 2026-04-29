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

  // 處理 better-auth 依賴預熱
  vite: {
    optimizeDeps: {
      include: [
        'better-auth/vue',
      ]
    }
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
