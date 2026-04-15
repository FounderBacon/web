const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030").replace(/\/$/, "")

export type FeatureFlags = Record<string, boolean>

export async function fetchFeatures(): Promise<FeatureFlags> {
  try {
    const res = await fetch(`${API_URL}/v1/features`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return {}
    return (await res.json()) as FeatureFlags
  } catch {
    return {}
  }
}

export function isFeatureOn(features: FeatureFlags, key: string): boolean {
  return features[key] === true
}
