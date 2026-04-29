import { computed } from 'vue'

import { authClient } from '../utils/auth-client'

type AuthRole = 'student' | 'teacher'
type AuthError = { message?: string }
type SocialSignIn = (payload: { provider: 'google', callbackURL?: string }) => Promise<{
  data: unknown
  error: AuthError | null
}>

export function useAuth() {
  const session = authClient.useSession()
  const user = computed(() => session.value?.data?.user)
  const loading = computed(() => session.value?.isPending ?? false)
  const error = computed(() => session.value?.error?.message ?? '')
  const isAuthenticated = computed(() => !!user.value)
  const isTeacher = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'teacher')
  const isStudent = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'student')

  async function login(email: string, password: string) {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message)
    await navigateTo('/')
    return data
  }

  async function register(email: string, password: string, name: string, _role: AuthRole = 'student') {
    const { data, error } = await authClient.signUp.email({ email, password, name })
    if (error) throw new Error(error.message)
    await navigateTo('/')
    return data
  }

  async function signInWithGoogle() {
    const signIn = authClient.signIn as typeof authClient.signIn & { social?: SocialSignIn }

    if (!signIn.social) {
      throw new Error('Google sign-in is not available')
    }

    const { data, error } = await signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
    if (error) throw new Error(error.message)
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
    login,
    register,
    signInWithGoogle,
    logout,
  }
}
