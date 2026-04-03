import { api } from "./client"
import { setToken, removeToken } from "@/lib/auth"

interface User {
  id: string
  email: string
  name: string
}

interface CallbackResponse {
  token: string
  user: User
}

export function getLoginUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/login`
}

export async function handleCallback(code: string): Promise<CallbackResponse> {
  const data = await api.get<CallbackResponse>(`/callback?code=${encodeURIComponent(code)}`, { skipAuth: true })
  setToken(data.token)
  return data
}

export async function getMe(): Promise<User> {
  return api.get<User>("/me")
}

export function logout() {
  removeToken()
}
