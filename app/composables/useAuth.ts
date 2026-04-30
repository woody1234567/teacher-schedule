import { computed } from 'vue'

import { authClient } from '../utils/auth-client'

type AuthRole = 'student' | 'teacher' | 'admin'
type RegistrationRole = Exclude<AuthRole, 'admin'>
type AuthError = { message?: string }
type AuthResponseData = {
  user?: {
    role?: AuthRole | null
  } | null
} | null | undefined
type SocialSignIn = (payload: { provider: 'google', callbackURL?: string }) => Promise<{
  data: unknown
  error: AuthError | null
}>

function isAuthRole(role: unknown): role is AuthRole {
  return role === 'student' || role === 'teacher' || role === 'admin'
}

export function getRoleLandingPath(role: AuthRole | null | undefined) {
  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'teacher') {
    return '/teacher'
  }

  if (role === 'student') {
    return '/student'
  }

  return '/'
}

function getRoleFromAuthData(data: unknown) {
  const role = (data as AuthResponseData)?.user?.role
  return isAuthRole(role) ? role : null
}

export function useAuth() {
  const session = authClient.useSession()
  const user = computed(() => session.value?.data?.user)
  const loading = computed(() => session.value?.isPending ?? false)
  const error = computed(() => session.value?.error?.message ?? '')
  const isAuthenticated = computed(() => !!user.value)
  const isTeacher = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'teacher')
  const isStudent = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'student')
  const isAdmin = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'admin')

  async function getSessionRole() {
    try {
      const { data } = await authClient.getSession()
      const role = (data?.user as { role?: unknown } | undefined)?.role
      return isAuthRole(role) ? role : null
    } catch {
      return null
    }
  }

  async function navigateToRoleHome(data: unknown) {
    const role = getRoleFromAuthData(data) ?? await getSessionRole()
    await navigateTo(getRoleLandingPath(role))
  }

  async function login(email: string, password: string) {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message)
    await navigateToRoleHome(data)
    return data
  }

  async function register(email: string, password: string, name: string, role: RegistrationRole = 'student') {
    const selectedRole = role === 'teacher' ? 'teacher' : 'student'
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      role: selectedRole,
    })
    if (error) throw new Error(error.message)
    await navigateToRoleHome(data)
    return data
  }

  async function signInWithGoogle(callbackURL = '/') {
    const signIn = authClient.signIn as typeof authClient.signIn & { social?: SocialSignIn }

    if (!signIn.social) {
      throw new Error('Google sign-in is not available')
    }

    const { data, error } = await signIn.social({
      provider: 'google',
      callbackURL,
    })
    if (error) throw new Error(error.message || 'Google sign-in failed')
    return data
  }

  async function logout() {
    const { error } = await authClient.signOut()
    if (error) throw new Error(error.message)
    await navigateTo('/auth/login')
  }

  return {
    session,
    user,
    loading,
    error,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    login,
    register,
    signInWithGoogle,
    logout,
  }
}
