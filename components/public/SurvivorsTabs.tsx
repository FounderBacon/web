"use client"

import { useState } from "react"
import { SurvivorLeadsView } from "@/components/public/SurvivorLeadsView"
import { SurvivorsView } from "@/components/public/SurvivorsView"
import type { Locale } from "@/lib/i18n"

type Tab = "leads" | "workers"

interface SurvivorsTabsProps {
  locale: Locale
}

export function SurvivorsTabs({ locale }: SurvivorsTabsProps) {
  const [tab, setTab] = useState<Tab>("leads")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 border-b border-border/50">
        <TabButton active={tab === "leads"} onClick={() => setTab("leads")}>
          Leads
        </TabButton>
        <TabButton active={tab === "workers"} onClick={() => setTab("workers")}>
          Workers
        </TabButton>
      </div>

      {tab === "leads" ? <SurvivorLeadsView locale={locale} /> : <SurvivorsView locale={locale} />}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px border-b-2 px-4 py-2.5 font-burbank text-sm uppercase tracking-wider transition-colors ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}
