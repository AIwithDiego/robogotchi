# Changelog

## Unreleased (v2.1.0)
- README rewritten as a case study: the challenge, the build, what went wrong and what I learned.
- New proof in `docs/assets/`: a real recording of the 60-second demo, screenshots and a cover; `docs/how-it-works.svg`.
- CI now runs the Playwright browser suite (Chromium desktop and mobile, Firefox, WebKit) next to lint, unit tests, build and gitleaks.
- Fixed the offline-death browser test, which broke when the "Raise another robot" dialog arrived and went unnoticed because CI didn't run browser tests.
- Contributing guide, issue and pull request templates.

## v2.0.0 · 23 September 2026
- First public release: a browser virtual pet you raise over three real days, with three arcade games, 24 lessons, six rooms, customization and a memory album.
- Strict security headers, self-hosted fonts, validated save import, and CI with lint, unit tests, build and a full-history gitleaks scan.
