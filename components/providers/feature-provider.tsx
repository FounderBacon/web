"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useFeaturesPoll } from "@/lib/features-client"
import type { FeatureFlags } from "@/lib/features"

const FeatureContext = createContext<FeatureFlags>({})

export function FeatureProvider({ initial, children }: { initial: FeatureFlags; children: ReactNode }) {
  const features = useFeaturesPoll(initial)
  return <FeatureContext.Provider value={features}>{children}</FeatureContext.Provider>
}

export function useFeature(key: string): boolean {
  const features = useContext(FeatureContext)
  return features[key] === true
}

export function useFeatures(): FeatureFlags {
  return useContext(FeatureContext)
}
