import { describe, expect, it } from "vitest"
import type { CompareGroupResult, StatDelta } from "./stats"
import { buildVerdict } from "./verdict"

function row(key: string, values: (number | null)[]): StatDelta {
  return { key, label: key, suffix: "", values, bestIndex: null, percentFromFirst: values.map(() => null) }
}

describe("buildVerdict", () => {
  it("weights categories equally, not rows", () => {
    // Column 0 wins four correlated damage rows, column 1 wins the lone handling row.
    const groups: CompareGroupResult[] = [
      { label: "Damage", rows: [row("damage", [10, 5]), row("dps", [10, 5]), row("avgDps", [10, 5]), row("critDps", [10, 5])] },
      { label: "Handling", rows: [row("firingRate", [1, 9])] },
    ]
    const { columns, leaderByGroup } = buildVerdict(groups, 2)
    expect(leaderByGroup).toEqual({ Damage: 0, Handling: 1 })
    expect(columns[0].score).toBe(columns[1].score)
  })

  it("declares no leader on a tie", () => {
    const groups: CompareGroupResult[] = [{ label: "Damage", rows: [row("damage", [7, 7])] }]
    const { leaderByGroup, decidedGroups } = buildVerdict(groups, 2)
    expect(leaderByGroup.Damage).toBeNull()
    expect(decidedGroups).toBe(0)
  })

  it("does not score a column that carries no comparable row of a category", () => {
    // Only column 0 has the stat: nothing was compared, so nobody leads.
    const groups: CompareGroupResult[] = [{ label: "Ranged", rows: [row("clipSize", [30, null])] }]
    const { columns, leaderByGroup } = buildVerdict(groups, 2)
    expect(leaderByGroup.Ranged).toBeNull()
    expect(columns.every((c) => c.score === null)).toBe(true)
  })

  it("treats lower-is-better stats as inverted", () => {
    const higher: CompareGroupResult[] = [{ label: "G", rows: [row("damage", [3, 2])] }]
    const lower: CompareGroupResult[] = [{ label: "G", rows: [row("swingTime", [3, 2])] }]
    expect(buildVerdict(higher, 2).leaderByGroup.G).toBe(0)
    expect(buildVerdict(lower, 2).leaderByGroup.G).toBe(1)
  })

  it("lists the categories each column leads", () => {
    const groups: CompareGroupResult[] = [
      { label: "A", rows: [row("damage", [9, 1])] },
      { label: "B", rows: [row("firingRate", [9, 1])] },
      { label: "C", rows: [row("clipSize", [1, 9])] },
    ]
    const { columns } = buildVerdict(groups, 2)
    expect(columns[0].leads).toEqual(["A", "B"])
    expect(columns[1].leads).toEqual(["C"])
  })
})
