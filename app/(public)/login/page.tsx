"use client"

import { getLoginUrl } from "@/lib/api"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-xl border border-border bg-card p-8">
        <img src="/svg/fbcn_logo.svg" alt="FounderBacon" className="size-16" />
        <h1 className="font-[family-name:var(--font-heading)] text-2xl text-card-foreground">
          Se connecter
        </h1>
        <a
          href={getLoginUrl()}
          className="flex w-full items-center justify-center gap-3 rounded-md bg-[#2F2D2E] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3D3B3C]"
        >
          <EpicGamesIcon />
          Continuer avec Epic Games
        </a>
      </div>
    </div>
  )
}

function EpicGamesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V18.44c0 .303.02.58.063.844.044.263.134.501.27.714.137.213.323.393.559.545.236.152.543.263.921.339l8.204 1.702a7.7 7.7 0 0 0 1.282.128c.193 0 .42-.013.685-.042a4.67 4.67 0 0 0 .785-.17l7.29-2.07c.376-.107.667-.249.873-.424.206-.176.355-.373.445-.593.09-.22.14-.454.148-.704.008-.25.012-.505.012-.765V4.478c0-1.14-.283-1.955-.853-2.448C21.774 1.538 20.763 1.2 19.308.96L5.248.063C4.58.022 4.019 0 3.537 0Zm3.23 4.725h1.604v10.639H6.766V4.725Zm3.16 0h4.489c.975 0 1.654.275 2.028.822.375.548.562 1.264.562 2.145v1.633c0 .756-.13 1.346-.394 1.77-.263.424-.69.685-1.282.785l1.86 4.484h-1.676l-1.676-4.3h-2.308v4.3H9.927V4.725Zm1.604 1.465v3.626h2.608c.369 0 .638-.126.808-.381.17-.256.254-.614.254-1.074V7.62c0-.535-.076-.913-.232-1.134-.156-.22-.443-.296-.863-.296h-2.575Z" />
    </svg>
  )
}
