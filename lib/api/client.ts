import axios, { AxiosError } from "axios"
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"
import { getToken } from "@/lib/auth"

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean
  }
}

const isServer = typeof window === "undefined"

const instance = axios.create({
  baseURL: (isServer ? process.env.API_URL_INTERNAL : undefined)
    ?? process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
    ...(isServer ? { "User-Agent": "founderbacon-web-ssr/1.0" } : {}),
  },
})

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class FeatureDisabledError extends ApiError {
  constructor(public feature: string) {
    super(503, `Feature '${feature}' is currently disabled`)
    this.name = "FeatureDisabledError"
  }
}

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status ?? 500
    const data = error.response?.data

    if (status === 503 && data?.error) {
      const match = data.error.match(/Feature '(.+)' is currently disabled/)
      if (match) {
        // Resync les flags cote client
        if (typeof window !== "undefined") {
          import("@/lib/features-client").then(({ triggerFeaturesRefresh }) => triggerFeaturesRefresh())
        }
        throw new FeatureDisabledError(match[1])
      }
    }

    const message = data?.message ?? data?.error ?? error.message
    throw new ApiError(status, message)
  },
)

export const api = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return instance.get<T>(url, config).then((r) => r.data)
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return instance.post<T>(url, data, config).then((r) => r.data)
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return instance.put<T>(url, data, config).then((r) => r.data)
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return instance.patch<T>(url, data, config).then((r) => r.data)
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return instance.delete<T>(url, config).then((r) => r.data)
  },
}
