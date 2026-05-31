# suisei-web

The landing page and showcase for the Suisei MCP toolkit.

This is a consumer of the published package, exactly like any other user:
it depends on `@suisei-mcp/mcp` from npm, not on the local workspace.

## Develop

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## What it serves

- `/` the static landing page (hero, security thesis, tool directory,
  showcase gallery, footer).
- `/api/mcp` the remote MCP endpoint over Streamable HTTP, so the toolkit
  can be added to Claude on web and mobile as a Custom Connector. Set
  `SUISEI_MCP_TOKEN` in the environment to require
  `Authorization: Bearer <token>`.

## Showcase

The gallery reads `public/showcase.json`. Adding a project is a one-line
edit there, or a submission through the GitHub issue form
(`.github/ISSUE_TEMPLATE/showcase-submission.yml`).

## Design constraints

Light theme, one solid blue accent (no gradients except the paper grain),
Apple system UI font with mono for code, Phosphor icons at one weight, no
em-dashes, no italics, no emojis. Motion is transform/opacity only, gated
on `prefers-reduced-motion`, isolated in client leaf components.
