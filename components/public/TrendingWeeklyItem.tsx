"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { DecoFrame } from "@/components/svg/DecoFrame";
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/ui/icons/arrow-right";
import type { PopularGlobalItem } from "@/lib/api/stats";
import { entityIcon } from "@/lib/cdn";

interface TrendingWeeklyItemProps {
  item: PopularGlobalItem;
  href: string | null;
  bgClass: string;
  colorClass: string;
  subtype: string;
}

export function TrendingWeeklyItem({ item, href, bgClass, colorClass, subtype }: TrendingWeeklyItemProps) {
  const iconRef = useRef<ArrowRightIconHandle>(null);

  const inner = (
    <div className={`relative flex items-center gap-3 ${bgClass} px-4 py-2 ${colorClass} backdrop-blur-sm transition-colors`} onMouseEnter={() => iconRef.current?.startAnimation()} onMouseLeave={() => iconRef.current?.stopAnimation()}>
      <DecoFrame className="pointer-events-none absolute" />
      <Image src={entityIcon(item.entityType, item.icon)} alt="" width={56} height={56} className="relative size-14 shrink-0" />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold text-primary-foreground">{item.name}</span>
        <span className="text-xs capitalize text-muted-foreground">{subtype}</span>
      </div>
      <ArrowRightIcon ref={iconRef} className="relative shrink-0 text-primary-foreground" size={20} />
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
