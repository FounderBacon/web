## 1. Introduction

FounderBacon ("nous", "notre") exploite le site founderbacon.com et l'API FounderBacon a l'adresse api.founderbacon.com. Cette Politique de Confidentialite explique comment nous collectons, utilisons et protegeons vos informations lorsque vous utilisez nos services.

## 2. Informations collectees

**Utilisation de l'API publique (sans compte) :**

- Nous ne collectons aucune information personnelle des utilisateurs de notre API publique.
- Nous pouvons enregistrer les adresses IP et les metadonnees des requetes a des fins de limitation de debit et de prevention des abus.
- Aucune cle API n'est requise pour utiliser nos points d'acces publics.

**Creation de compte (Connexion avec Epic Games) :**

- Lorsque vous vous connectez via Epic Games OAuth, nous recevons votre nom d'affichage Epic Games et votre identifiant de compte.
- Epic Games ne partage pas votre adresse e-mail avec nous.
- Nous stockons votre nom d'affichage, votre identifiant de compte et la date de creation de votre compte pour fournir nos services (builds, favoris, etc.).

**Soumissions de feedback :**

Lorsque vous envoyez un retour via la page /feedback, nous collectons :

- Le sujet, le message, et une note optionnelle (1 a 5).
- Un pseudo et une adresse e-mail de contact, uniquement si vous les renseignez. Si vous etes connecte via Epic Games, votre nom d'affichage Epic est utilise par defaut.
- Jusqu'a quatre images (captures d'ecran) que vous choisissez de joindre.
- L'URL de la page d'ou vous avez soumis le retour, le contexte de la ressource concernee (parametre `scope`), votre user agent et votre langue, attaches automatiquement pour nous aider a reproduire les bugs.
- Une version hachee de votre adresse IP, utilisee uniquement pour la limitation de debit (5 soumissions par heure par IP). Aucune adresse IP brute n'est stockee.

Le contenu des feedbacks n'est pas public. Il est lu uniquement par l'equipe FounderBacon pour le triage et l'amelioration du service.

**Analyse d'usage :**

Nous collectons des evenements d'usage anonymes et agreges pour comprendre quels contenus sont populaires et prioriser les ameliorations. Ces evenements incluent :

- Les vues d'items (`weapon.viewed`, `trap.viewed`, `hero.viewed`, `survivor.viewed`, etc.).
- Les calculs de stats quand vous utilisez les outils de build (`weapon.calculated`, `trap.calculated`).

Ces evenements contiennent uniquement le type d'action et le slug de l'item concerne. Ils ne contiennent aucune information personnelle, aucun identifiant de compte, ni jeton de session.

## 3. Utilisation de vos informations

Nous utilisons les informations collectees pour :

- Fournir et maintenir nos services
- Associer vos builds et favoris sauvegardes a votre compte
- Afficher votre nom d'affichage Epic Games sur les builds partages
- Lire et repondre aux feedbacks que vous soumettez
- Agreger des donnees d'usage anonymes pour ameliorer les fonctionnalites et prioriser les nouveaux contenus
- Surveiller et prevenir les abus de notre API et du formulaire de feedback
- Ameliorer nos services

## 4. Partage des donnees

Nous ne vendons, n'echangeons ni ne louons vos informations personnelles a des tiers. Nous pouvons partager des informations uniquement dans les cas suivants :

- Lorsque la loi ou une procedure judiciaire l'exige
- Pour proteger nos droits et notre securite
- Avec votre consentement explicite

## 5. Stockage des donnees et infrastructure

- Vos donnees de compte, vos feedbacks et les evenements d'usage sont stockes sur les serveurs MongoDB Atlas, avec des connexions chiffrees et une authentification securisee.
- Les ressources statiques (icones, images, captures) sont servies depuis notre CDN a cdn.founderbacon.com.
- Le site lui-meme est heberge sur Vercel, qui peut collecter des metadonnees basiques de requete (IP, user agent, horodatages) dans ses journaux serveur pour des raisons operationnelles. Voir vercel.com/legal/privacy-policy.

## 6. Vos droits

Vous pouvez :

- Demander l'acces aux donnees que nous stockons a votre sujet
- Demander la suppression de votre compte et de toutes les donnees associees
- Demander la suppression des feedbacks que vous avez soumis, s'ils peuvent etre identifies (fournissez l'ID de soumission ou l'email de contact utilise)
- Retirer votre consentement a tout moment en supprimant votre compte

Pour exercer ces droits, contactez-nous a [contact@founderbacon.com](mailto:contact@founderbacon.com).

## 7. Cookies et stockage local

**Cookies :** nous utilisons un cookie d'authentification minimal (jeton de session JWT) uniquement lorsque vous etes connecte. Nous n'utilisons pas de cookies de suivi, de cookies analytiques ni de cookies publicitaires tiers.

**Stockage local du navigateur :** nous utilisons le stockage local de votre navigateur pour conserver des donnees cote client non utilisees pour du suivi, notamment :

- Votre loadout de heros sauvegarde (commander, support, team perks, offensif F.O.R.T.).
- Vos preferences UI comme l'etat ferme du bandeau d'environnement staging.

Ces donnees de stockage local ne quittent jamais votre appareil et ne sont jamais transmises a nos serveurs.

## 8. Liens externes et services tiers

Notre site inclut des liens vers des plateformes tierces (Discord, X/Twitter, GitHub, Epic Games). Lorsque vous suivez ces liens, la politique de confidentialite du tiers s'applique. Nous ne sommes pas responsables du contenu ni des pratiques de confidentialite des sites externes.

## 9. Protection des mineurs

Nos services ne s'adressent pas aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles aupres d'enfants de moins de 13 ans. Si vous pensez que nous avons collecte de telles informations, veuillez nous contacter immediatement.

## 10. Modifications de cette politique

Nous pouvons mettre a jour cette Politique de Confidentialite de temps a autre. Nous informerons les utilisateurs des changements importants en publiant un avis sur notre site. Votre utilisation continue de nos services apres les modifications vaut acceptation de la politique mise a jour.

## 11. Nous contacter

Si vous avez des questions concernant cette Politique de Confidentialite, contactez-nous a [contact@founderbacon.com](mailto:contact@founderbacon.com).
