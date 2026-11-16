# Contributing

Thanks for taking a look. Robogotchi is a small game, so small changes are the best kind.

- **Bugs and ideas:** open an issue with the template. For a bug, the browser and a save export (Settings, then Export) help most.
- **Pull requests:** small and focused. Say what changed and why, and how you tested it.
- **Before opening one:** run `npm run lint`, `npm test` and `npm run build`. If you touched the UI, run `npm run test:e2e` too (it needs `npx playwright install chromium firefox webkit` once). CI runs all of them.
- **Game balance:** timings and rates live in `src/game/config.ts`. Change them there, and update the tests that pin them.
- **No new runtime services.** No analytics, CDNs, accounts or AI calls at runtime. The Content-Security-Policy in `vercel.json` will block them anyway.
- **Security issues:** never in public. See [SECURITY.md](SECURITY.md).

I answer issues within a few days.
