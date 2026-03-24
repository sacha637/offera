Offera est une application web moderne pour offres, réductions et cashback.

## Getting Started

### Installation

```bash
npm install
```

### Variables d'environnement

Copiez `.env.example` en `.env.local` et complétez les clés Firebase.

### Lancer le serveur de développement

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase

- Règles Firestore: `firebase/firestore.rules`
- Règles Storage: `firebase/storage.rules`
- Données de seed: `firebase/seed.json`

## Déploiement (o2switch)

1. Générer le build: `npm run build`
2. Déployer le dossier `.next` et `public`
3. Configurer les variables d'environnement sur l'hébergement

## Notes

- Navigation mobile via bottom nav
- Thème sombre/clair géré par `next-themes`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
