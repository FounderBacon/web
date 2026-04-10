import { api } from "./client"
import { setToken, removeToken } from "@/lib/auth"

interface User {
  epicId: string
  displayName: string
  role: string
}

interface CallbackResponse {
  token: string
  user: User
}

export function getLoginUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/v1/epic/auth/login`
}

export async function handleCallback(code: string): Promise<CallbackResponse> {
  const data = await api.get<CallbackResponse>(`/v1/epic/auth/callback?code=${encodeURIComponent(code)}`, { skipAuth: true })
  setToken(data.token)
  return data
}

export async function getMe(): Promise<User> {
  return api.get<User>("/me")
}

export function logout() {
  removeToken()
}
