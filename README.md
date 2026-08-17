# autostand landing page

The public marketing site for [autostand](https://github.com/MAECLY/autostand).
One page, prerendered to static HTML at build time. No analytics, no
third-party scripts, no forms, no cookies.

It lives in its own repo because it ships to a different place than the product:
autostand is a desktop binary, this is a website. What the two share is the
design system, which is consumed as a package so the surfaces cannot drift apart
visually.

| Repo | What it is |
|---|---|
| `MAECLY/autostand` | the Tauri desktop app — the thing this page describes |
| `MAECLY/autostand-ui` | `@autostand/ui`, the design system (**private**) |
| `MAECLY/autostand-landing-page` | this repo — deploys to `autostand.maecly.com` |

## Stack

| Piece | What it is |
|---|---|
| Next.js 15, App Router | every route is statically prerendered (`○ Static` in the build output), and `output: "export"` writes the finished HTML to `out/` — there is no server build, so `next start` does not apply |
| React 19 | server components by default; only two components are client components |
| TypeScript strict | plus `noUnusedLocals` / `noUnusedParameters` |
| Tailwind v4 via `@tailwindcss/postcss` | no `tailwind.config.js`; the theme is the `@theme` block inside `@autostand/ui` |
| `@autostand/ui` | tokens, stylesheet, base components and icons |

## Commands

```bash
pnpm install     # see "The private dependency" below before the first run
pnpm dev         # next dev      — http://localhost:3000
pnpm build       # next build    — exports the finished site into out/
pnpm start       # serve out/ on http://localhost:3000 (scripts/serve-static.mjs)
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm test:e2e    # playwright
```

## The private dependency

`@autostand/ui` is declared in `package.json` as a git dependency:

```json
"@autostand/ui": "github:MAECLY/autostand-ui#main"
```

`MAECLY/autostand-ui` is a **private** repo, so `pnpm install` only works for
someone git can authenticate as. Locally that is normally your SSH key —
`pnpm-lock.yaml` pins the resolved URL as
`git+ssh://git@github.com/MAECLY/autostand-ui.git#<commit>`, and pnpm hands that
URL straight to `git`. If `ssh -T git@github.com` greets you by name, install
will work. If it fails, so will install, with a `Permission denied (publickey)`
that does not mention which dependency caused it.

The package ships TypeScript source rather than a build, so `next.config.ts`
lists it in `transpilePackages` and Next compiles it like first-party code. That
also means Tailwind cannot see its classes by default, which is why
`src/app/globals.css` carries two `@source` lines pointing into
`node_modules/@autostand/ui`. Delete those and every class only the design
system uses drops out of the CSS.

## Where the styling comes from

Nothing about the look of this site is defined here.

```
@autostand/ui  tokens + fonts + the @theme mapping + base components
  └── src/app/globals.css   imports it, adds --text-hero and .hero-gradient
        └── src/app/layout.tsx   imports that
```

- **Never hardcode a colour, radius, shadow or font.** Use the mapped utilities
  (`bg-surface`, `text-muted-foreground`, `border-border`, `rounded-lg`,
  `shadow-md`, `font-mono`, …). A raw hex here is a drift bug, not a style choice.
- **Dark mode is the `.dark` class on `<html>`**, stamped before first paint by
  the inline script in `layout.tsx` and toggled by `src/components/ThemeToggle.tsx`
  (persisted under the `autostand-theme` localStorage key). The tokens flip
  themselves, so a `dark:` variant is almost never needed.
- **Base components come from the package**, imported by subpath —
  `@autostand/ui/components/button`, `@autostand/ui/icons`,
  `@autostand/ui/lib/utils`. Never by relative path, and never copied in.
- `--text-hero` and `.hero-gradient` are deliberately site-local: nothing in the
  product renders type that large or paints that gradient outside onboarding.

Path alias: `@/` → `src/`.

## Client components, and why there are only two

App Router components are server components unless they say otherwise, and only
a `"use client"` boundary ships JavaScript. Each one has to earn its place:

| Component | Why |
|---|---|
| `Navbar` (which contains `ThemeToggle`) | owns the mobile menu's open state, and the toggle has to agree with the class the pre-paint script already stamped on `<html>` |
| `Faq` | Radix Accordion — a panel that cannot open is worse than no panel |

Everything else — hero, mockup, features, pipeline, audit demo, footer — is a
server component and ships nothing. `page.js`'s client reference manifest lists
exactly two entries; if a third appears, something grew a boundary by accident.

## Structure

```
public/brand/          logos + the OG image, served from the site root (/brand/…)
src/app/layout.tsx     <html>, metadata/OG tags, pre-paint theme script
src/app/page.tsx       the whole page: composition only, no styling of its own
src/app/globals.css    imports @autostand/ui, adds --text-hero + .hero-gradient
src/app/sitemap.ts     one entry, because there is one route
src/app/robots.ts      allow-all + a pointer to the sitemap
src/components/        one file per section
```

`page.tsx` is deliberately thin. Each section owns its own container and vertical
rhythm, so `<main>` carries no width or padding classes — adding them double-pads
every section.

There is **no base path**. An earlier version of this site was served from
`https://maecly.github.io/autostand/`; this one is served at the domain root, so
every asset is referenced as `/brand/…` and any surviving `/autostand/` prefix or
`BASE_URL` handling is a bug, not configuration.

## Deploying to Vercel

Target: **https://autostand.maecly.com**. The build is `next build`; every route
comes out static, so there is no server runtime to configure and no environment
variable the *application* reads at runtime.

One thing is not automatic, and it is the thing that breaks a fresh Vercel
project.

### 1. The build has to be able to fetch a private repo

Vercel's GitHub integration authorises the build to clone **this** repo. It does
not grant the build any access to `MAECLY/autostand-ui`, so `pnpm install` fails
partway through with an SSH or credentials error. That is the whole problem;
everything below is the fix.

**a. Create a token with read access to the UI repo.** A GitHub personal access
token works: fine-grained, scoped to `MAECLY/autostand-ui`, with **Contents:
Read-only** (a classic token with the `repo` scope also works, but grants far
more). It only ever needs to read.

**b. Expose it to the build as `UI_REPO_TOKEN`.** Add it as an environment
variable on the Vercel project for every environment you build (Production and
Preview at least). Vercel makes project environment variables available to the
build, install command included — which is what the next step depends on. Do not
commit it, and do not `echo` it in a build step; build logs are readable by
anyone with project access.

**c. `vercel.json` does the rest.** It overrides the install command to teach git
to answer for `github.com` with that token before pnpm asks for the dependency:

```sh
git config --global url."https://x-access-token:$UI_REPO_TOKEN@github.com/".insteadOf "ssh://git@github.com/"
git config --global --add url."…".insteadOf "git@github.com:"
git config --global --add url."…".insteadOf "https://github.com/"
pnpm install --frozen-lockfile
```

All three rewrites matter, and the **ssh one is the one that actually fires
today**: `pnpm-lock.yaml` pins the dependency to
`git+ssh://git@github.com/MAECLY/autostand-ui.git`, and a rewrite registered only
for `https://github.com/` leaves an `ssh://` URL untouched — git goes looking for
a key that does not exist on a build machine and the install dies. The other two
entries cover the scp-style form and the case where someone re-resolves the
lockfile over HTTPS.

The command fails loudly with a readable message when `UI_REPO_TOKEN` is missing,
because the error git produces on its own names neither the token nor the
dependency.

The token is written into the build container's `~/.gitconfig`, which is thrown
away with the container. Rotate it like any other credential; when you do, update
it in Vercel and in the repo's `UI_REPO_TOKEN` Actions secret — CI (see
`.github/workflows/ci.yml`) needs the same token for the same reason.

### 2. The domain

`autostand.maecly.com` is a subdomain, so it needs one record in the `maecly.com`
DNS zone: a **CNAME** for the `autostand` label pointing at the target Vercel
gives you when the domain is added to the project. Use the value Vercel prints —
it is the authoritative one, and it is the only way to be sure whether the
project wants a CNAME or the apex-style A record.

Once the record resolves, Vercel issues the TLS certificate itself; nothing in
this repo needs to know the domain except the three places that hardcode the
origin, which must agree:

- `metadataBase` in `src/app/layout.tsx` (canonical + OG image URLs)
- `SITE_URL` in `src/app/sitemap.ts`
- `SITE_URL` in `src/app/robots.ts`

They are literals rather than an environment variable on purpose: the values are
baked into HTML and XML at build time, and a missing env var would silently
publish `undefined` in a canonical URL instead of failing the build.

### 3. What must be true for a deploy to be correct

- `pnpm install` completes, which means `UI_REPO_TOKEN` is set and still valid.
- `pnpm build` reports every route as `○ (Static)`.
- The built HTML references assets as `/brand/…` and `/_next/…` — never
  `/autostand/…`.
- `https://autostand.maecly.com/robots.txt` and `/sitemap.xml` both resolve and
  name that origin, not a `vercel.app` preview host.

## Editing the copy

Every claim on this page has to be true of autostand as it exists today. There is
no released binary, no pricing, no account, no telemetry and no user count — so
the site has no download link, no pricing section, no testimonials and no
metrics. The CTA points at the GitHub repo and says plainly that the binary is
not published yet. Voice rules live in `docs/design-system/02-brand.md` in the
autostand repo: short sentences, active voice, technical, no marketing language.

The footer's "MIT license" link points at the `## License` section of the
autostand README, which is where that claim is stated. Neither repo carries a
`LICENSE` file yet; adding one to autostand is the fix, not changing the copy.
