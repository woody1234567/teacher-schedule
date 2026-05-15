import type { RouteLocationNormalized } from 'vue-router'
import { authClient } from '../utils/auth-client'

type AuthRole = 'student' | 'teacher' | 'admin' | 'visitor'
type AuthRouteMeta = RouteLocationNormalized['meta'] & {
  auth?: false
  role?: AuthRole | AuthRole[]
}
type AuthSession = {
  user?: {
    role?: AuthRole | null
  } | null
} | null

const routeRoleMap: Record<string, AuthRole> = {
  '/admin': 'admin',
  '/student': 'student',
  '/teacher': 'teacher',
}

function getRoleLandingPath(role?: AuthRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  if (role === 'student') return '/student'
  if (role === 'visitor') return '/visitor/role_pick'
  return '/'
}

function getRouteRoles(to: RouteLocationNormalized) {
  const meta = to.meta as AuthRouteMeta
  const metaRoles = meta.role

  if (Array.isArray(metaRoles)) {
    return metaRoles
  }

  if (metaRoles) {
    return [metaRoles]
  }

  const matchedRoute = Object.entries(routeRoleMap)
    .find(([path]) => to.path === path || to.path.startsWith(`${path}/`))

  return matchedRoute ? [matchedRoute[1]] : []
}

async function getSession() {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) as HeadersInit : undefined

  try {
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers,
      },
    })

    return session as AuthSession
  } catch {
    return null
  }
}

export async function authMiddlewareHandler(to: RouteLocationNormalized) {
  const meta = to.meta as AuthRouteMeta

  if (meta.auth === false && !to.path.startsWith('/auth')) {
    return
  }

  const session = await getSession()

  if (meta.auth === false) {
    if (session && to.path.startsWith('/auth')) {
      return navigateTo(getRoleLandingPath(session.user?.role), { replace: true })
    }
    return
  }

  if (!session) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Visitors are only allowed on the role-pick page
  if (session.user?.role === 'visitor' && to.path !== '/visitor/role_pick') {
    return navigateTo('/visitor/role_pick', { replace: true })
  }

  const routeRoles = getRouteRoles(to)

  if (routeRoles.length > 0 && !routeRoles.includes(session.user?.role as AuthRole)) {
    return navigateTo(getRoleLandingPath(session.user?.role), { replace: true })
  }
}

export default defineNuxtRouteMiddleware(authMiddlewareHandler)
