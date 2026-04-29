import { authClient } from '../utils/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  async function login(email: string, password: string) {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message)
    await navigateTo('/')
    return data
  }

  async function register(email: string, password: string, name: string) {
    const { data, error } = await authClient.signUp.email({ email, password, name })
    if (error) throw new Error(error.message)
    await navigateTo('/')
    return data
  }

  async function logout() {
    const { error } = await authClient.signOut()
    if (error) throw new Error(error.message)
    await navigateTo('/auth/login')
  }

  return { session, login, register, logout }
}
