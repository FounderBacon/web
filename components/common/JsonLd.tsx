// Composant server pour injecter du JSON-LD dans le <head> via le body
// (Next.js le hoist automatiquement). Echappe les caracteres dangereux pour
// que le JSON ne casse pas le parsing HTML.
//
// Accepte un objet ou un tableau d'objets schema.org. Plusieurs schemas
// peuvent etre regroupes dans un seul script via "@graph".

interface JsonLdProps {
  data: object | object[]
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- json deja escape ci-dessus
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
