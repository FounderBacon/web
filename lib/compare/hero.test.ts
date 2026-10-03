import { describe, expect, it } from "vitest"
import type { CalculatedStats } from "@/lib/types/calculate"
import { effectiveHeroPayload, heroFromParams, heroToParams, normalizeHero, sameHero, withHeroGain } from "./hero"

describe("normalizeHero / sameHero", () => {
  it("treats an empty loadout as no loadout", () => {
    expect(normalizeHero({ supportPerkIds: [], teamPerkIds: [] })).toBeUndefined()
    expect(sameHero(undefined, { supportPerkIds: ["", ""], teamPerkIds: [] })).toBe(true)
  })

  it("ignores perk order and the display name", () => {
    const a = { name: "A", commanderPerkId: "c", supportPerkIds: ["x", "y"], teamPerkIds: ["t"] }
    const b = { name: "B", commanderPerkId: "c", supportPerkIds: ["y", "x"], teamPerkIds: ["t"] }
    expect(sameHero(a, b)).toBe(true)
  })

  it("tells two different loadouts apart", () => {
    const a = { commanderPerkId: "c", supportPerkIds: ["x"], teamPerkIds: [] }
    expect(sameHero(a, { ...a, commanderPerkId: "d" })).toBe(false)
    expect(sameHero(a, undefined)).toBe(false)
  })
})

describe("effectiveHeroPayload", () => {
  const fallback = { supportPerkIds: ["g"], teamPerkIds: [] }
  it("uses the column's loadout over the user's", () => {
    expect(effectiveHeroPayload({ commanderPerkId: "c", supportPerkIds: [], teamPerkIds: [] }, fallback)).toEqual({
      commanderPerkId: "c",
      supportPerkIds: [],
      teamPerkIds: [],
    })
  })

  it("falls back to the user's loadout", () => {
    expect(effectiveHeroPayload(undefined, fallback)).toBe(fallback)
    expect(effectiveHeroPayload(undefined, undefined)).toBeUndefined()
  })
})

describe("URL round trip", () => {
  it("round-trips a loadout through its params", () => {
    const hero = { name: "Wall", commanderPerkId: "c", supportPerkIds: ["a", "b"], teamPerkIds: ["t"] }
    const params = heroToParams(hero, "b")
    expect(Object.keys(params).sort()).toEqual(["hcb", "hnb", "hsb", "htb"])
    expect(sameHero(heroFromParams((n) => params[n], "b"), hero)).toBe(true)
    expect(heroFromParams((n) => params[n], "b")?.name).toBe("Wall")
  })

  it("writes nothing for no loadout", () => {
    expect(heroToParams(undefined, "a")).toEqual({})
  })
})

describe("withHeroGain", () => {
  const stats = (avgDps: number) => ({ avgDps }) as CalculatedStats

  it("measures the DPS the loadout adds, absolute and relative", () => {
    const result = withHeroGain(stats(150), stats(100)) as CalculatedStats & { heroDpsGain: number; heroDpsGainPercent: number }
    expect(result.heroDpsGain).toBe(50)
    expect(result.heroDpsGainPercent).toBe(50)
  })

  it("reports zero when no hero perk applies to the weapon", () => {
    const result = withHeroGain(stats(100), stats(100)) as CalculatedStats & { heroDpsGain: number }
    expect(result.heroDpsGain).toBe(0)
  })

  it("has no percentage on a zero base", () => {
    const result = withHeroGain(stats(10), stats(0)) as CalculatedStats & { heroDpsGainPercent?: number }
    expect(result.heroDpsGainPercent).toBeUndefined()
  })

  it("leaves stats untouched without a baseline", () => {
    const s = stats(100)
    expect(withHeroGain(s, null)).toBe(s)
    expect(withHeroGain(null, s)).toBeNull()
  })
})
