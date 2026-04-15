import type { Metadata } from "next";
import Link from "next/link";
import { SectionContainer } from "@/components/public/SectionContainer";
import { FadeInSection } from "@/components/public/FadeInSection";
import { HomeWeaponPreview } from "@/components/public/HomeWeaponPreview";
import { HomeCategoryCarousel } from "@/components/public/HomeCategoryCarousel";
import { LandingPage } from "@/components/public/LandingPage";
import { FbcnLogo } from "@/components/svg/FbcnLogo";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { isBeforeLaunch } from "@/lib/landing";

export const metadata: Metadata = {
  title: "FounderBacon — Free REST API for Fortnite: Save the World",
  description: "The first free, open REST API for Fortnite: Save the World. Weapons, traps, heroes, stats, perks, crafting — all in one place, free forever.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FounderBacon",
  url: "https://founderbacon.com",
  description: "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// ── Homepage ───────────────────────────────────────────────────
function HomePage({ dict, locale }: { dict: Awaited<ReturnType<typeof getDictionary>>; locale: Locale }) {
  return (
    <div className="bg-background text-foreground">
      {/* ================================================================
          HERO
          ================================================================ */}
      <SectionContainer fullScreen className="relative flex flex-col items-center justify-center overflow-hidden -mt-16">
        <FbcnLogo className="pointer-events-none absolute z-0 size-56 opacity-[0.03] md:size-125" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-4">
          <FadeInSection>
            <h1 className="m-0 text-center font-burbank text-6xl uppercase leading-[0.85] tracking-tight text-foreground md:text-[10rem]">
              {dict.home.heroTitle1}
              <br />
              <span className="text-muted-foreground">{dict.home.heroTitle2}</span>
            </h1>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <p className="max-w-xl text-center text-base font-light leading-relaxed text-muted-foreground whitespace-pre-line md:text-xl">{dict.home.heroDescription}</p>
          </FadeInSection>

          {/* Stat pills */}
          <FadeInSection delay={0.25} className="flex flex-wrap justify-center gap-2">
            {[
              { value: "1,200+", label: "weapons", color: "bg-legendary" },
              { value: "40+", label: "stats", color: "bg-rare" },
              { value: "FREE", label: "forever", color: "bg-uncommon" },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-2.5 border border-border/50 bg-card/40 px-4 py-2.5 backdrop-blur-sm">
                <span className={`size-2 rounded-full ${pill.color}`} />
                <span className="text-sm font-semibold text-foreground">{pill.value}</span>
                <span className="text-sm text-muted-foreground">{pill.label}</span>
              </div>
            ))}
          </FadeInSection>

          {/* CTAs */}
          <FadeInSection delay={0.35} className="flex flex-col gap-3 w-full items-center sm:flex-row sm:w-auto sm:gap-4">
            <Link href={`/${locale}/search/weapons`} className="w-full text-center bg-primary px-10 py-4 transition-all hover:bg-primary/80 sm:w-auto">
              <span className="-mb-1 block text-lg font-semibold uppercase text-primary-foreground md:text-xl">{dict.home.ctaWeapons}</span>
            </Link>
            <Link href={`/${locale}`} className="group w-full text-center border-2 border-primary/60 px-10 py-3.5 transition-all hover:border-primary hover:bg-primary/10 sm:w-auto">
              <span className="-mb-1 block text-lg font-semibold uppercase text-muted-foreground group-hover:text-foreground md:text-xl">{dict.home.ctaDocs}</span>
            </Link>
          </FadeInSection>
        </div>
      </SectionContainer>

      {/* ================================================================
          FEATURE 1 — DATABASE
          ================================================================ */}
      <section className="relative overflow-hidden py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-20 md:px-10">
          <FadeInSection className="flex flex-col gap-6">
            <div>
              <span className="font-burbank text-6xl text-legendary/20 md:text-8xl">01</span>
              <h2 className="-mt-4 font-burbank text-4xl uppercase text-foreground md:-mt-6 md:text-6xl">{dict.home.featureWeaponTitle}</h2>
              <p className="mt-2 text-lg text-muted-foreground md:text-xl">{dict.home.featureWeaponSubtitle}</p>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{dict.home.featureWeaponDesc}</p>
            <div className="flex flex-wrap gap-3">
              {dict.home.featureWeaponStats.map((stat) => (
                <span key={stat} className="border border-legendary/20 bg-legendary/5 px-3 py-1.5 text-sm font-medium text-legendary">
                  {stat}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.15} className="flex justify-center">
            <HomeCategoryCarousel />
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          FEATURE 2 — PERK BUILDER
          ================================================================ */}
      <section className="relative overflow-hidden py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-[3fr_2fr] md:gap-16 md:px-10">
          <FadeInSection className="order-2 md:order-1">
            <div className="relative">
              <div className="relative flex w-full flex-col overflow-hidden border border-border/50">
                {/* Header arme */}
                <div className="relative bg-card px-6 py-5">
                  <div className="absolute inset-0 bg-linear-to-r from-mythic/5 to-transparent" />
                  <div className="relative flex items-center gap-5">
                    <div className="flex size-16 shrink-0 items-center justify-center border-2 border-mythic/40 bg-background">
                      <span className="font-burbank text-3xl text-mythic">N</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-burbank text-2xl uppercase leading-none text-foreground md:text-3xl">Nocturno</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm font-semibold text-mythic">Mythic</span>
                        <span className="h-3 w-px bg-border" />
                        <span className="text-sm text-muted-foreground">Assault Rifle</span>
                        <span className="h-3 w-px bg-border" />
                        <span className="text-sm text-rare">Energy</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perks */}
                <div className="divide-y divide-border/50 border-t border-border/50 bg-background">
                  {[
                    { slot: 1, name: "Crit Rating", desc: "+28% Critical Rating", value: "+28%", accent: "border-l-epic" },
                    { slot: 2, name: "Crit Damage", desc: "+135% Crit Damage", value: "+135%", accent: "border-l-epic" },
                    { slot: 3, name: "Energy", desc: "Energy and +20% Damage", value: "+20%", accent: "border-l-rare" },
                    { slot: 4, name: "Dmg to Mist Monsters", desc: "+44% Damage to Mist", value: "+44%", accent: "border-l-legendary" },
                    { slot: 5, name: "Affliction Damage", desc: "Affliction ticks for 6s", value: "6th", accent: "border-l-mythic" },
                  ].map((p) => (
                    <div key={p.slot} className={`flex items-center gap-4 border-l-2 px-5 py-3.5 ${p.accent}`}>
                      <span className="flex size-8 shrink-0 items-center justify-center bg-muted text-sm font-bold tabular-nums text-muted-foreground">{p.slot}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <span className="shrink-0 text-base font-bold text-uncommon">{p.value}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="border-t border-border/50 bg-card">
                  <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Average DPS</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-burbank text-4xl text-foreground md:text-5xl">12,847</span>
                        <span className="text-lg font-bold text-uncommon">+3,204</span>
                      </div>
                    </div>
                    <div className="hidden w-28 flex-col gap-1 sm:flex">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Base</span>
                        <span>Modded</span>
                      </div>
                      <div className="relative h-2 overflow-hidden bg-muted">
                        <div className="absolute inset-y-0 left-0 w-[60%] bg-muted-foreground/40" />
                        <div className="absolute inset-y-0 left-[60%] w-[40%] bg-linear-to-r from-uncommon/80 to-uncommon" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border/50 sm:grid-cols-4">
                    {[
                      { label: "Damage", value: "89.2", delta: "+12.4" },
                      { label: "Crit %", value: "43%", delta: "+18%" },
                      { label: "Crit DMG", value: "x3.35", delta: "+1.35" },
                      { label: "Fire Rate", value: "12.0", delta: null },
                    ].map((s, i) => (
                      <div key={s.label} className={`flex flex-col px-4 py-3.5 ${i >= 2 ? "border-t border-border/50 sm:border-t-0" : ""}`}>
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className="font-burbank text-xl text-foreground">{s.value}</span>
                        {s.delta && <span className="text-xs font-semibold text-uncommon">{s.delta}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.15} className="order-1 flex flex-col gap-6 md:order-2">
            <div>
              <span className="font-burbank text-6xl text-epic/20 md:text-8xl">02</span>
              <h2 className="-mt-4 font-burbank text-4xl uppercase text-foreground md:-mt-6 md:text-6xl">{dict.home.featurePerkTitle}</h2>
              <p className="mt-2 text-lg text-muted-foreground md:text-xl">{dict.home.featurePerkSubtitle}</p>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{dict.home.featurePerkDesc}</p>
            <div className="flex flex-wrap gap-3">
              {dict.home.featurePerkStats.map((stat) => (
                <span key={stat} className="border border-epic/20 bg-epic/5 px-3 py-1.5 text-sm font-medium text-epic">
                  {stat}
                </span>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          FEATURE 3 — REST API
          ================================================================ */}
      <section className="relative overflow-hidden py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-20 md:px-10">
          <FadeInSection className="flex flex-col gap-6">
            <div>
              <span className="font-burbank text-6xl text-rare/20 md:text-8xl">03</span>
              <h2 className="-mt-4 font-burbank text-4xl uppercase text-foreground md:-mt-6 md:text-6xl">{dict.home.featureApiTitle}</h2>
              <p className="mt-2 text-lg text-muted-foreground md:text-xl">{dict.home.featureApiSubtitle}</p>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{dict.home.featureApiDesc}</p>
            <div className="flex flex-wrap gap-3">
              {dict.home.featureApiStats.map((stat) => (
                <span key={stat} className="border border-rare/20 bg-rare/5 px-3 py-1.5 text-sm font-medium text-rare">
                  {stat}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.15} className="flex justify-center">
            <div className="w-full max-w-lg overflow-hidden border border-border/50 bg-[#1e1e2e] font-mono text-sm">
              {/* Barre de titre terminal */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#181825] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[#f38ba8]" />
                  <span className="size-3 rounded-full bg-[#f9e2af]" />
                  <span className="size-3 rounded-full bg-[#a6e3a1]" />
                </div>
                <span className="text-xs text-white/40">bash — api.founderbacon.com</span>
                <div className="w-14" />
              </div>

              {/* Commande curl */}
              <div className="border-b border-white/10 px-4 py-3">
                <span className="text-[#a6e3a1]">$</span>
                <span className="text-white/90"> curl </span>
                <span className="text-[#f9e2af]">https://api.founderbacon.com/v1/weapons/ranged/nocturno</span>
              </div>

              {/* Response JSON avec scroll */}
              <div className="max-h-80 overflow-y-auto px-4 py-3 leading-6">
                <pre className="text-white/70">{`{`}</pre>
                <pre>  <span className="text-[#89b4fa]">&quot;name&quot;</span><span className="text-white/40">:</span> <span className="text-[#a6e3a1]">&quot;Nocturno&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;type&quot;</span><span className="text-white/40">:</span> <span className="text-[#a6e3a1]">&quot;ranged&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;category&quot;</span><span className="text-white/40">:</span> <span className="text-[#a6e3a1]">&quot;assault&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;rarity&quot;</span><span className="text-white/40">:</span> <span className="text-[#cba6f7]">&quot;mythic&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;element&quot;</span><span className="text-white/40">:</span> <span className="text-[#89dceb]">&quot;energy&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;ammoType&quot;</span><span className="text-white/40">:</span> <span className="text-[#a6e3a1]">&quot;light&quot;</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;isFounders&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">true</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;maxTier&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">5</span><span className="text-white/40">,</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;perkSlots&quot;</span><span className="text-white/40">: [</span></pre>
                <pre>    <span className="text-white/40">{`{`}</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;slot&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">1</span><span className="text-white/40">,</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;unlockLevel&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">1</span><span className="text-white/40">,</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;isRespeccable&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">true</span><span className="text-white/40">,</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;availablePerks&quot;</span><span className="text-white/40">:</span> <span className="text-white/40">[</span><span className="text-white/30">...</span><span className="text-white/40">]</span></pre>
                <pre>    <span className="text-white/40">{`}`},</span></pre>
                <pre>    <span className="text-white/40">{`{`}</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;slot&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">2</span><span className="text-white/40">,</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;unlockLevel&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">5</span></pre>
                <pre>    <span className="text-white/40">{`}`},</span></pre>
                <pre>    <span className="text-white/30">{`// ... 4 more slots`}</span></pre>
                <pre>  <span className="text-white/40">],</span></pre>
                <pre>  <span className="text-[#89b4fa]">&quot;tiers&quot;</span><span className="text-white/40">: {`{`}</span></pre>
                <pre>    <span className="text-[#89b4fa]">&quot;1&quot;</span><span className="text-white/40">: {`{`}</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;displayTier&quot;</span><span className="text-white/40">:</span> <span className="text-[#a6e3a1]">&quot;copper&quot;</span><span className="text-white/40">,</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;stats&quot;</span><span className="text-white/40">: {`{`}</span></pre>
                <pre>        <span className="text-[#89b4fa]">&quot;damage&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">23.0</span><span className="text-white/40">,</span></pre>
                <pre>        <span className="text-[#89b4fa]">&quot;dps&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">276.0</span><span className="text-white/40">,</span></pre>
                <pre>        <span className="text-[#89b4fa]">&quot;critChance&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">0.10</span><span className="text-white/40">,</span></pre>
                <pre>        <span className="text-[#89b4fa]">&quot;critMultiplier&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">1.50</span><span className="text-white/40">,</span></pre>
                <pre>        <span className="text-[#89b4fa]">&quot;firingRate&quot;</span><span className="text-white/40">:</span> <span className="text-[#fab387]">12.0</span></pre>
                <pre>      <span className="text-white/40">{`}`},</span></pre>
                <pre>      <span className="text-[#89b4fa]">&quot;crafting&quot;</span><span className="text-white/40">:</span> <span className="text-white/40">[</span><span className="text-white/30">...</span><span className="text-white/40">]</span></pre>
                <pre>    <span className="text-white/40">{`}`}</span></pre>
                <pre>  <span className="text-white/40">{`}`}</span></pre>
                <pre className="text-white/70">{`}`}</pre>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between border-t border-white/10 bg-[#181825] px-4 py-1.5 text-xs text-white/30">
                <span>200 OK</span>
                <span>application/json</span>
                <span>42ms</span>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          WEAPON PREVIEW
          ================================================================ */}
      <section className="relative py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <FadeInSection className="mb-14 flex flex-col items-center text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{dict.home.arsenalTitle}</p>
            <h2 className="mt-2 max-w-3xl font-burbank text-4xl uppercase text-foreground md:text-7xl">{dict.home.arsenalSubtitle}</h2>
          </FadeInSection>

          <FadeInSection>
            <HomeWeaponPreview locale={locale as Locale} dict={dict} />
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <section className="relative py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <FadeInSection className="mb-14">
            <h2 className="font-burbank text-4xl uppercase text-foreground md:text-6xl">{dict.home.faqTitle}</h2>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <Accordion type="multiple" className="w-full">
              {dict.home.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline md:text-lg">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          SUGGESTIONS
          ================================================================ */}
      <section className="relative py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <FadeInSection className="flex flex-col items-center gap-6 text-center">
            <h2 className="font-burbank text-4xl uppercase text-foreground md:text-6xl">{dict.home.suggestTitle}</h2>
            <p className="max-w-lg text-base text-muted-foreground md:text-lg">{dict.home.suggestSubtitle}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://discord.gg/founderbacon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-border/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                {dict.home.suggestDiscord}
              </a>
              <a href="https://github.com/FounderBacon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-border/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                {dict.home.suggestGithub}
              </a>
              <a href="https://x.com/FounderBacon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-border/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                {dict.home.suggestTwitter}
              </a>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================
          CTA FINAL
          ================================================================ */}
      <section className="relative overflow-hidden py-28 md:py-44">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-linear-to-r from-transparent via-border/50 to-transparent" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center">
          <FadeInSection>
            <h2 className="font-burbank text-5xl uppercase text-foreground md:text-8xl">{dict.home.ctaFinalTitle}</h2>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">{dict.home.ctaFinalSubtitle}</p>
          </FadeInSection>

          <FadeInSection delay={0.15} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href={`/${locale}/search/weapons`} className="bg-primary px-10 py-4 transition-all hover:bg-primary/80">
              <span className="-mb-1 block text-xl font-semibold uppercase text-primary-foreground">{dict.home.ctaFinalButton}</span>
            </Link>
            <Link href={`/${locale}`} className="group border-2 border-primary/60 px-10 py-3.5 transition-all hover:border-primary hover:bg-primary/10">
              <span className="-mb-1 block text-xl font-semibold uppercase text-muted-foreground group-hover:text-foreground">{dict.home.ctaDocs}</span>
            </Link>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const dict = await getDictionary(locale);

  // Avant la date de launch : on affiche la landing avec le countdown.
  // Le countdown atteint 0 -> LandingPage fait un router.refresh() -> serveur re-evalue -> HomePage.
  if (isBeforeLaunch()) {
    return (
      <LandingPage
        title={dict.home.title}
        subtitle={dict.home.subtitle}
        countdown={dict.home.countdown}
      />
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage dict={dict} locale={locale} />
    </>
  );
}
