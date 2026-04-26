"use client";

import { useRef } from "react";
import { ArrowUpRightIcon, type ArrowUpRightIconHandle } from "@/components/ui/icons/arrow-up-right";

interface SocialLinkProps {
  href: string;
  label: string;
}

export function SocialLink({ href, label }: SocialLinkProps) {
  const iconRef = useRef<ArrowUpRightIconHandle>(null);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="flex items-center gap-2 border border-king-700/50 bg-king-800/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-king-800/80 hover:text-primary-foreground"
    >
      {label}
      <ArrowUpRightIcon ref={iconRef} size={14} className="shrink-0" />
    </a>
  );
}
