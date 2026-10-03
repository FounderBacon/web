import { beforeEach, describe, expect, it } from "vitest"
import { MAX_COMPARE, sameBuild, sameEntry, useCompare, type CompareEntry } from "./store"

const entry = (slug: string, init: CompareEntry["init"] = {}): CompareEntry => ({
  ref: { type: "ranged", slug },
  init,
})

beforeEach(() => useCompare.setState({ entries: [] }))

describe("sameBuild", () => {
  it("treats missing fields as their defaults", () => {
    expect(sameBuild({}, { tier: undefined, level: 0, offensive: 0, perkIds: [] })).toBe(true)
  })

  it("distinguishes tier, material, level and offensive", () => {
    expect(sameBuild({ tier: "3" }, { tier: "4" })).toBe(false)
    expect(sameBuild({ material: "ore" }, { material: "crystal" })).toBe(false)
    expect(sameBuild({ level: 10 }, { level: 11 })).toBe(false)
    expect(sameBuild({ offensive: 5 }, { offensive: 6 })).toBe(false)
  })

  it("ignores empty trailing perk slots", () => {
    // Un perk choisi puis retire laisse un slot vide en queue.
    expect(sameBuild({ perkIds: ["a", ""] }, { perkIds: ["a"] })).toBe(true)
    expect(sameBuild({ perkIds: ["", ""] }, {})).toBe(true)
    expect(sameBuild({ perkIds: ["", "a"] }, { perkIds: ["a"] })).toBe(false)
  })

  it("treats perk order as part of the identity", () => {
    expect(sameBuild({ perkIds: ["a", "b"] }, { perkIds: ["b", "a"] })).toBe(false)
    expect(sameBuild({ perkIds: ["a", ""] }, { perkIds: ["a", ""] })).toBe(true)
  })
})

describe("sameEntry", () => {
  it("needs both the weapon and the build to match", () => {
    expect(sameEntry(entry("x"), entry("x"))).toBe(true)
    expect(sameEntry(entry("x"), entry("y"))).toBe(false)
    expect(sameEntry(entry("x", { tier: "3" }), entry("x", { tier: "4" }))).toBe(false)
  })
})

describe("add", () => {
  it("allows the same weapon twice with different builds", () => {
    useCompare.getState().add(entry("x", { tier: "3" }))
    useCompare.getState().add(entry("x", { tier: "4" }))
    expect(useCompare.getState().entries).toHaveLength(2)
  })

  it("refreshes an identical build instead of duplicating it", () => {
    useCompare.getState().add({ ...entry("x"), name: "Old" })
    useCompare.getState().add({ ...entry("x"), name: "New" })
    const { entries } = useCompare.getState()
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe("New")
  })

  it("stops accepting weapons at the cap", () => {
    for (let i = 0; i < MAX_COMPARE + 2; i++) useCompare.getState().add(entry(`w${i}`))
    expect(useCompare.getState().entries).toHaveLength(MAX_COMPARE)
  })
})

describe("setAt / removeAt", () => {
  it("replaces an entry in place, even when the comparison is full", () => {
    for (let i = 0; i < MAX_COMPARE; i++) useCompare.getState().add(entry(`w${i}`))
    useCompare.getState().setAt(1, entry("w1", { tier: "5" }))
    const { entries } = useCompare.getState()
    expect(entries).toHaveLength(MAX_COMPARE)
    expect(entries[1].init.tier).toBe("5")
  })

  it("removes by index and compacts", () => {
    useCompare.getState().add(entry("a"))
    useCompare.getState().add(entry("b"))
    useCompare.getState().add(entry("c"))
    useCompare.getState().removeAt(1)
    expect(useCompare.getState().entries.map((e) => e.ref.slug)).toEqual(["a", "c"])
  })

  it("setAt with null removes the entry", () => {
    useCompare.getState().add(entry("a"))
    useCompare.getState().setAt(0, null)
    expect(useCompare.getState().entries).toEqual([])
  })
})
