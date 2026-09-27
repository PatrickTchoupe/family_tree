# Arbre familial

Une application d'arbre généalogique en React, Vite et TypeScript strict, avec une API Node.js/Express, PostgreSQL et Prisma. Elle distingue un compte applicatif `User` d'une personne généalogique `Person`.

## Lancer le projet

Node.js 20.19+ ou 22.12+ est recommandé.

```bash
npm install
npm run dev
```

Ouvrez l'adresse indiquée par Vite (habituellement `http://localhost:5173`). Pour produire une version statique :

```bash
npm run build
npm run preview
```

## Démarrer toute la stack avec Docker

Docker et Docker Compose sont requis :

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

L'interface est disponible sur `http://localhost:8080`, l'API sur `http://localhost:4000` et PostgreSQL sur `localhost:5432`. Le backend exécute automatiquement les migrations Prisma au démarrage.

Pour le développement séparé :

```bash
npm install
npm run dev                 # frontend sur 5173
cd backend && npm install
npm run prisma:generate
npm run dev                 # API sur 4000
```

## Fonctionnement

- Cliquez sur « Ajouter une personne », remplissez les champs obligatoires, puis choisissez les parents ou le conjoint parmi les personnes déjà enregistrées.
- Cliquez sur une carte de l'arbre pour modifier la fiche ou supprimer une personne.
- Les liens parent-enfant et les couples sont dessinés en SVG, sans bibliothèque de visualisation.
- L'arbre utilise une disposition automatique qui regroupe les couples et réserve un espacement entre les branches pour limiter les chevauchements. Dans la vue, faites glisser pour déplacer l'arbre et utilisez la molette ou les boutons de zoom.
- La barre de recherche met en évidence les personnes correspondantes. Le bouton soleil/lune active le thème clair ou sombre et mémorise le choix sur l'appareil.
- Sans connexion, les données restent compatibles avec le `localStorage` (`arbre-familial:v1`). Après connexion, le premier arbre local est envoyé automatiquement au backend une seule fois, puis les modifications sont synchronisées avec PostgreSQL. Le compte est un `User`; les membres de la famille restent des `Person` liées à un `FamilyTree`.
- La suppression retire aussi les références à cette personne dans les autres fiches. Les cycles de parenté et l'attribution d'un même conjoint à deux personnes sont bloqués.
- Les personnes peuvent maintenant avoir plusieurs conjoint·es, ce qui permet de représenter les familles recomposées et les demi-frères/sœurs via des parents partagés différemment.
- Chaque fiche accepte un lieu de naissance ou de décès, une profession, des notes et des événements datés. Un clic sur une carte ouvre la fiche détaillée et sa chronologie de vie ; la modification se fait depuis cette vue.
- Les exports disponibles sont JSON, GEDCOM 5.5.1 de base, PNG et PDF via la boîte d'impression du navigateur. Les imports acceptent les fichiers JSON exportés par l'application ainsi que les fichiers `.ged` / `.gedcom`.

## Organisation

```text
src/
  components/  # cartes, arbre et formulaire
  hooks/       # état et sauvegarde locale
  types/       # modèles Person et Relation
  utils/       # validation, relations et disposition des générations
backend/
  src/         # serveur Express, authentification et routes REST
  prisma/      # schéma PostgreSQL et migrations
docker-compose.yml
```

## API REST

Toutes les routes sous `/api/trees` nécessitent `Authorization: Bearer <JWT>`.

### Authentification

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Crée un compte email/mot de passe et retourne un JWT. |
| `POST` | `/api/auth/login` | Connecte un compte local et retourne un JWT. |
| `GET` | `/api/auth/me` | Retourne l'utilisateur courant. |
| `POST` | `/api/auth/oauth/google` | Vérifie un `idToken` Google avec `GOOGLE_CLIENT_ID`. |
| `POST` | `/api/auth/oauth/apple` | Vérifie un `idToken` Apple avec `APPLE_CLIENT_ID`. |

### Arbres et données

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/trees` | Liste les arbres de l'utilisateur connecté. |
| `POST` | `/api/trees` | Crée un arbre (`{ "name": "..." }`). |
| `GET` | `/api/trees/:treeId` | Retourne un arbre avec personnes, événements et relations. |
| `PATCH` | `/api/trees/:treeId` | Renomme un arbre. |
| `DELETE` | `/api/trees/:treeId` | Supprime l'arbre et ses données. |
| `GET` | `/api/trees/:treeId/people` | Liste les personnes généalogiques. |
| `POST` | `/api/trees/:treeId/people` | Ajoute une personne. |
| `PATCH` | `/api/trees/:treeId/people/:personId` | Modifie une personne. |
| `DELETE` | `/api/trees/:treeId/people/:personId` | Supprime une personne. |
| `GET` | `/api/trees/:treeId/relations` | Liste les relations `FATHER`, `MOTHER`, `SPOUSE`. |
| `POST` | `/api/trees/:treeId/relations` | Ajoute une relation (`fromId`, `toId`, `type`). |
| `PATCH` | `/api/trees/:treeId/relations/:relationId` | Modifie une relation. |
| `DELETE` | `/api/trees/:treeId/relations/:relationId` | Supprime une relation. |
| `POST` | `/api/trees/:treeId/import-local` | Importe le snapshot local initial (`{ "people": [...] }`). |
| `PUT` | `/api/trees/:treeId/snapshot` | Synchronise l'arbre local complet après modification. |

Google et Apple nécessitent leurs identifiants OAuth dans l'environnement backend. Les mots de passe locaux sont hachés avec bcrypt et les JWT sont signés avec `JWT_SECRET`.
