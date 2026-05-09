import { Fragment, type ReactNode } from "react"

// Mapping tag -> className applique au span genere.
// Etendre cette table pour ajouter de nouveaux styles inline.
const TAG_CLASSES: Record<string, string> = {
  // Graisses (du plus fin au plus epais)
  thin: "font-thin",
  extralight: "font-extralight",
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  bold: "font-semibold",
  bolder: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
  // Styles
  italic: "italic",
  underline: "underline underline-offset-4",
  // Couleurs
  primary: "text-primary",
  muted: "text-muted-foreground",
}

interface ParseOptions {
  vars?: Record<string, string | number>
}

// Trouve l'index du '}' qui ferme le '{' a `start`, en gerant l'imbrication.
// Retourne -1 si pas de fermeture trouvee.
function findClosingBrace(text: string, start: number): number {
  let depth = 1
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function classNameFromTag(rawTag: string): string {
  return rawTag
    .split("+")
    .map((t) => TAG_CLASSES[t])
    .filter(Boolean)
    .join(" ")
}

// Parse recursif gerant :
//  - {tag:contenu} ou {tag1+tag2:contenu} -> wrap dans un span style
//  - {varName} -> remplace par options.vars[varName]
//  - imbrication des tags et variables dans le contenu d'un tag
function parse(text: string, options: ParseOptions, keyRef: { v: number }): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ""
  let i = 0

  const flush = () => {
    if (buffer) {
      nodes.push(buffer)
      buffer = ""
    }
  }

  while (i < text.length) {
    if (text[i] !== "{") {
      buffer += text[i]
      i++
      continue
    }

    const close = findClosingBrace(text, i)
    if (close === -1) {
      // Accolade non fermee : on traite comme du texte brut.
      buffer += text[i]
      i++
      continue
    }

    const inner = text.slice(i + 1, close)
    const colonIdx = inner.indexOf(":")

    // {tag:contenu}
    if (colonIdx > 0 && /^[\w+]+$/.test(inner.slice(0, colonIdx))) {
      flush()
      const rawTag = inner.slice(0, colonIdx)
      const content = inner.slice(colonIdx + 1).replace(/^\s/, "")
      const className = classNameFromTag(rawTag)
      const children = parse(content, options, keyRef)
      const key = keyRef.v++
      nodes.push(
        className ? (
          <span key={key} className={className}>
            {children}
          </span>
        ) : (
          <Fragment key={key}>{children}</Fragment>
        ),
      )
      i = close + 1
      continue
    }

    // {varName}
    if (/^\w+$/.test(inner)) {
      flush()
      const value = options.vars?.[inner]
      nodes.push(value !== undefined ? String(value) : `{${inner}}`)
      i = close + 1
      continue
    }

    // Format non reconnu : on garde tel quel.
    buffer += text.slice(i, close + 1)
    i = close + 1
  }

  flush()
  return nodes
}

interface I18nTextProps {
  text: string
  vars?: Record<string, string | number>
}

export function I18nText({ text, vars }: I18nTextProps): ReactNode {
  return <>{parse(text, { vars }, { v: 0 })}</>
}
