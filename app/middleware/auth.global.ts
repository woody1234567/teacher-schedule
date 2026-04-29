import type { RouteLocationNormalized } from 'vue-router'
import { authClient } from '../utils/auth-client'

export async function authMiddlewareHandler(to: RouteLocationNormalized) {
  const { data: session } = await authClient.getSession()

  if (to.meta.auth === false) {
    if (session && to.path.startsWith('/auth')) {
      return navigateTo('/', { replace: true })
    }
    return
  }

  if (!session) {
    return navigateTo('/auth/login', { replace: true })
  }
}

export default defineNuxtRouteMiddleware(authMiddlewareHandler)
