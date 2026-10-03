import { describe, expect, it } from "vitest"
import { COMPARE_EDIT_PARAM, compareEditHref, readEditInit } from "./editLink"
import { sameBuild } from "./store"
import type { CompareSlotInit } from "./useCompareSlot"

const ref = { type: "ranged", slug: "boom-stick" } as const

function query(href: string): URLSearchParams {
  return new URLSearchParams(href.split("?")[1])
}

// Ce que la fiche d'arme recoit : les parametres du lien, a plat.
function paramsOf(href: string): Record<string, string> {
  return Object.fromEntries(query(href).entries())
}

describe("compareEditHref", () => {
  it("points at the weapon page and flags edit mode", () => {
    const href = compareEditHref("fr", ref, {})
    expect(href.startsWith("/fr/weapons/ranged/boom-stick?")).toBe(true)
    expect(query(href).has(COMPARE_EDIT_PARAM)).toBe(true)
  })

  it("encodes the build with the same keys as the share URL", () => {
    const q = query(
      compareEditHref("en", ref, { tier: "5", material: "crystal", level: 60, offensive: 12, perkIds: ["pa", "", "pc"] }),
    )
    expect(q.get("t")).toBe("5")
    expect(q.get("m")).toBe("crystal")
    expect(q.get("l")).toBe("60")
    expect(q.get("o")).toBe("12")
    expect(q.get("p0")).toBe("pa")
    expect(q.get("p1")).toBeNull()
    expect(q.get("p2")).toBe("pc")
  })

  it("always carries the offensive, even at zero", () => {
    // Absente, la fiche reprendrait l'offensive du loadout et modifierait la colonne.
    expect(query(compareEditHref("en", ref, { tier: "1" })).get("o")).toBe("0")
  })

  it("encodes the column's hero loadout without colliding with the page's own loadout params", () => {
    const q = query(
      compareEditHref("en", ref, { hero: { name: "Wall", commanderPerkId: "cmd", supportPerkIds: ["b", "a"], teamPerkIds: ["t"] } }),
    )
    // La fiche lit hc / hs1..5 / htp comme un loadout de slugs de heros.
    expect(q.has("hc")).toBe(false)
    expect(q.has("htp")).toBe(false)
    expect([...q.keys()].some((k) => /^hs\d$/.test(k))).toBe(false)
    expect(q.get("hcx")).toBe("cmd")
    expect(q.get("hsx")).toBe("a,b")
  })

  it("omits a zero level", () => {
    expect(query(compareEditHref("en", ref, { tier: "1", level: 0 })).has("l")).toBe(false)
  })
})

describe("readEditInit", () => {
  it("round-trips the build so the column can be found again", () => {
    const builds: CompareSlotInit[] = [
      {},
      { tier: "3" },
      { tier: "5", material: "crystal", level: 60, offensive: 12, perkIds: ["pa", "", "pc"] },
      { tier: "2", perkIds: ["", "pb"] },
      { tier: "3", hero: { name: "Wall", commanderPerkId: "cmd", supportPerkIds: ["a", "b"], teamPerkIds: ["t"] } },
    ]
    for (const init of builds) {
      expect(sameBuild(readEditInit(paramsOf(compareEditHref("en", ref, init))), init)).toBe(true)
    }
  })

  it("ignores unrelated params and invalid values", () => {
    expect(readEditInit({ t: "4", m: "plasma", l: "abc", hc: "hero", [COMPARE_EDIT_PARAM]: "1" })).toEqual({ tier: "4" })
  })
})
