"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, type ReactNode } from "react"

interface CardRevealModalProps {
  open: boolean
  onClose: () => void
  // Element principal (zoom de la source vers le centre via layoutId si fourni)
  main: ReactNode
  // Si fourni, le modal anime depuis l'element source ayant le meme layoutId
  mainLayoutId?: string
  // Variantes secondaires (apparaissent en stagger autour du main)
  secondary?: ReactNode
  // Hint texte en bas (defaut "Tap outside to close")
  closeHint?: string
  // Appele quand l'exit anim du modal est completement finie. Utile pour
  // re-monter l'element source avec layoutId sans glitch double.
  onExitComplete?: () => void
}

// Modal "card reveal" : overlay sombre, element central qui zoom depuis sa
// source via layoutId, et zone secondaire qui apparait en stagger autour.
// Reusable pour fan-out raretes, abilities, perks, etc.
//
// Pour l'animation source -> centre :
// - Le parent rend un motion.* avec layoutId={mainLayoutId} a sa place
// - Pendant que open=true OU exit en cours, le parent doit demonter ce motion.*
//   et le remplacer par un placeholder invisible (sinon double layoutId glitch)
// - Le parent re-monte l'original dans le callback onExitComplete
export function CardRevealModal({
  open,
  onClose,
  main,
  mainLayoutId,
  secondary,
  closeHint = "Tap outside to close",
  onExitComplete,
}: CardRevealModalProps) {
  // Esc + lock body scroll quand ouvert
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <motion.div
          key="card-reveal-overlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/75 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Main : scale + opacity simple. Grossit depuis 0.3 (sensation "viens vers nous")
              vers 1 a l'open, et redescend a 0.3 + fade a l'exit (true mirror).
              Le mainLayoutId est garde optionnellement pour les cas ou un parent
              veut tenter un shared layout, mais pas requis pour la base anim. */}
          <motion.div
            layoutId={mainLayoutId}
            className="cursor-default"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {main}
          </motion.div>

          {/* Secondary : stagger apres le main. AnimatePresence dedie pour pouvoir
              exit avant le main au close (pattern "reverse de l'open") : le parent
              peut conditionner `secondary` a null pour declencher l'exit en premier */}
          <AnimatePresence>
            {secondary && (
              <motion.div
                key="card-reveal-secondary"
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: { transition: { delayChildren: 0.25, staggerChildren: 0.07 } },
                  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {secondary}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            className="text-[11px] uppercase tracking-widest text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {closeHint}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Variants helper a appliquer sur les enfants de `secondary` pour le stagger
export const CARD_REVEAL_ITEM_VARIANTS = {
  closed: { opacity: 0, scale: 0.3, y: -15 },
  open: { opacity: 1, scale: 1, y: 0 },
}

export const CARD_REVEAL_ITEM_TRANSITION = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
}
