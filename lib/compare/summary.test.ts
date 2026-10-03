import { describe, expect, it } from "vitest"
import type { Perk, PerkSlot } from "@/lib/types/shared"
import { perkSummary, resolvePerks } from "./summary"

const perk = (perkId: string, name: string): Perk => ({
  _id: perkId, perkId, name, description: "", rarity: "epic", type: "t", category: "c",
})

describe("perkSummary", () => {
  it("returns null without perks", () => {
    expect(perkSummary([])).toBeNull()
  })

  it("names up to two perks, then falls back to a count", () => {
    expect(perkSummary([perk("a", "Alpha")])).toBe("Alpha")
    expect(perkSummary([perk("a", "Alpha"), perk("b", "Beta")])).toBe("Alpha + Beta")
    expect(perkSummary([perk("a", "A"), perk("b", "B"), perk("c", "C")])).toBe("3 perks")
  })

  it("uses the provided count label", () => {
    expect(perkSummary([perk("a", "A"), perk("b", "B"), perk("c", "C")], (n) => `${n} atouts`)).toBe("3 atouts")
  })
})

describe("resolvePerks", () => {
  const slots = [
    { slot: 0, availablePerks: [perk("a", "Alpha"), perk("b", "Beta")] },
    { slot: 1, availablePerks: [perk("c", "Gamma")] },
  ] as unknown as PerkSlot[]

  it("resolves positional ids and skips empty or unknown ones", () => {
    expect(resolvePerks(slots, ["b", "c"]).map((p) => p.perkId)).toEqual(["b", "c"])
    expect(resolvePerks(slots, ["", "c"]).map((p) => p.perkId)).toEqual(["c"])
    expect(resolvePerks(slots, ["zzz"])).toEqual([])
  })

  it("returns nothing when slots or ids are missing", () => {
    expect(resolvePerks(undefined, ["a"])).toEqual([])
    expect(resolvePerks(slots, undefined)).toEqual([])
  })
})
