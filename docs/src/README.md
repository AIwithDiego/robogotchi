# Image sources

`cover.html` is the README cover and the social preview. Render it at 1280×640 with any headless browser, for example:

```sh
npx playwright screenshot --viewport-size=1280,640 --device-scale-factor=2 docs/src/cover.html docs/assets/cover.png
```

`how-it-works.svg` in `docs/` is hand-written; edit it as text.
