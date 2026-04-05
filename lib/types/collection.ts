export interface IAmmoType {
  _id: string
  label: string
  icon: string
  gameAsset: string
}

export interface ICategory {
  _id: string
  label: string
  type: "ranged" | "melee"
  gameTag: string
}

export interface IDisplayTier {
  _id: string
  label: string
  tier: number
  material: "ore" | "crystal" | null
  gameEnum: string
}

export interface IElement {
  _id: string
  label: string
  color: string
  icon: string
  strongVs?: string
  weakVs?: string
}

export interface IRarity {
  _id: string
  label: string
  order: number
  color: string
  gameEnum: string
}

export interface IWeaponSet {
  _id: string
  label: string
  gameTag: string
}

export type CollectionName = "ammo-types" | "categories" | "display-tiers" | "elements" | "rarities" | "weapon-sets"
