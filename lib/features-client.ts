"use client"

import { useEffect, useState, useCallback } from "react"
import type { FeatureFlags } from "./features"

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030").replace(/\/$/, "")
const POLL_INTERVAL_MS = 60_000

async function fetchClient(): Promise<FeatureFlags> {
  try {
    const res = await fetch(`${API_URL}/v1/features`)
    if (!res.ok) return {}
    return (await res.json()) as FeatureFlags
  } catch {
    return {}
  }
}

// Listeners pour forcer un refetch depuis l'exterieur (ex: 503 dans le client API)
type RefreshListener = () => void
const listeners = new Set<RefreshListener>()

export function onFeaturesRefresh(cb: RefreshListener) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function triggerFeaturesRefresh() {
  for (const cb of listeners) cb()
}

export function useFeaturesPoll(initial: FeatureFlags): FeatureFlags {
  const [features, setFeatures] = useState(initial)

  const refresh = useCallback(async () => {
    const fresh = await fetchClient()
    setFeatures(fresh)
  }, [])

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    const unsub = onFeaturesRefresh(refresh)
    return () => { clearInterval(interval); unsub() }
  }, [refresh])

  return features
}
