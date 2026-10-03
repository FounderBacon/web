import type { CSSProperties } from "react"

/**
 * Grille partagee par toutes les surfaces du comparateur (en-tete de colonnes,
 * tableau de stats, modal rapide).
 *
 * Deux formes coexistent, choisies en CSS et non en JS — un layout decide par
 * `window.innerWidth` differerait entre le rendu serveur et le premier rendu
 * client, ce que React signale comme une erreur d'hydratation :
 *
 *  - sous `md` : les valeurs occupent toute la largeur en N colonnes egales,
 *    le libelle de la stat passe au-dessus. C'est ce qui supprime le scroll
 *    horizontal — et avec lui le fait que le libelle sortait de l'ecran,
 *    laissant des chiffres qu'on ne pouvait plus rattacher a une stat.
 *  - a partir de `md` : une colonne de libelles suivie des N colonnes de valeurs.
 *
 * Les deux templates voyagent en variables CSS pour rester applicables depuis
 * une classe utilitaire responsive : une valeur inline ne peut pas, elle, etre
 * conditionnee a un breakpoint.
 */
export function compareGridVars(columnCount: number, labelMinWidth = 132): CSSProperties {
  return {
    // La colonne des libelles est bornee en haut : laissee proportionnelle,
    // elle absorbait l'espace gagne en s'elargissant jusqu'a doubler la
    // largeur du plus long libelle, au detriment des valeurs comparees.
    "--cmp-row": `minmax(${labelMinWidth}px,${labelMinWidth + 90}px) repeat(${columnCount},minmax(0,1fr))`,
    "--cmp-values": `repeat(${columnCount},minmax(0,1fr))`,
  } as CSSProperties
}

// Ligne complete (libelle + valeurs) a partir de md.
export const CMP_ROW = "md:grid md:[grid-template-columns:var(--cmp-row)]"

// Conteneur des valeurs : grille autonome sur mobile, transparent des md pour
// que les cellules redeviennent enfants directs de la ligne.
export const CMP_VALUES = "grid [grid-template-columns:var(--cmp-values)] md:contents"

// Decalage du sticky sous la navbar. Hauteurs mesurees : la navbar grandit a
// md (logo size-7 -> size-9). Un decalage trop grand laisse passer une bande
// de lignes de stats entre la navbar et l'en-tete colle.
export const CMP_STICKY_TOP = "top-[68px] md:top-[74px]"
