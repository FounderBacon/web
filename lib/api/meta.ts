import { api } from "./client"

export interface BaconVersion {
  latestChangelog: string | null
  latestRelease: string | null
  currentRoadmap: string | null
  nextRoadmap: string | null
}

export async function fetchBaconVersion(): Promise<BaconVersion> {
  return api.get<BaconVersion>("/v1/bacon/version", { skipAuth: true })
}
