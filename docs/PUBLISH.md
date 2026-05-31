# Publishing to npm

Two packages, both scoped under `@suisei-mcp`, both publish-ready:

- `@suisei-mcp/mcp` (in `packages/mcp`)
- `@suisei-mcp/agent-signer` (in `packages/agent-signer`)

## Current state

| Package | Live on npm | In this repo |
|---|---|---|
| `@suisei-mcp/mcp` | 0.1.0 | 0.1.2 |
| `@suisei-mcp/agent-signer` | 0.1.0 | 0.1.2 |

The repo is ahead at 0.1.2, but **0.1.2 changes only metadata** - repo
URLs (now `eienel/suisei`), descriptions, and docs/comment typography.
There are no new or changed tools since 0.1.0. Publishing 0.1.2 keeps
npm honest with the source; it is not a feature release.

## One-time setup (in a browser, once per account)

1. **The `@suisei-mcp` org must exist on npm.** It does (0.1.0 is already
   published under it). If you are publishing from a new account, make
   sure that account is a member of the `suisei-mcp` org with publish
   rights.
2. **2FA:** if enabled, `npm publish` prompts for an OTP each time. Have
   your authenticator ready.

## Manual release (local, from your machine)

Publishing needs your npm login and OTP, so it is a local step - it
cannot run from CI without a token (see the optional CI path below).

```bash
# from your clone, on main with the version you intend to ship
git checkout main
git pull origin main

# --- @suisei-mcp/mcp ---
cd packages/mcp
npm install
npm run build
npm pack --dry-run          # confirm version 0.1.2 and the file list
npm login                   # once per machine; opens browser
npm publish                 # prompts for OTP if 2FA is on

# --- @suisei-mcp/agent-signer ---
cd ../agent-signer
npm install
npm run build
npm pack --dry-run
npm publish
```

Within a minute the world can:

```bash
npx -y @suisei-mcp/mcp                     # spin up the MCP server
npm install -g @suisei-mcp/agent-signer    # install the Tier-1 signer
```

## Verify it landed

```bash
npm view @suisei-mcp/mcp version           # expect 0.1.2
npm view @suisei-mcp/agent-signer version  # expect 0.1.2
```

## Bumping versions for the next release

Both packages are at 0.1.2. Use `npm version` from inside each package
directory - it updates `package.json` and creates a commit + tag:

- `npm version patch` -> 0.1.3 (bug fix)
- `npm version minor` -> 0.2.0 (new tools, no breaking changes)
- `npm version major` -> 1.0.0 (breaking changes; not yet)

Then `git push --follow-tags` and publish again. Keep the two packages on
the same version unless there is a reason not to.

## Optional: tag-driven CI for `@suisei-mcp/mcp`

`.github/workflows/publish-mcp.yml` publishes `@suisei-mcp/mcp` with npm
provenance when a tag matching `mcp-v*` is pushed - but only if the
`NPM_TOKEN` repo secret is set (an npm automation token with publish
rights on the `@suisei-mcp` scope).

```bash
# only after package.json is at the version you are tagging
git tag mcp-v0.1.2
git push origin mcp-v0.1.2
```

The workflow checks that `package.json`'s version matches the tag before
publishing, so the tag and the file must agree. There is no CI workflow
for `agent-signer` - publish it manually as above. You can also trigger
the workflow manually (`workflow_dispatch`) with `dry_run: true` to pack
without publishing.

## Common pitfalls

- **"403 Forbidden"** - the publishing account is not a member of the
  `suisei-mcp` org, or `publishConfig.access` is not `public`. The
  `access: "public"` line is already in both `package.json` files; the
  usual cause is org membership.
- **"You cannot publish over the previously published versions: 0.1.2"**
  - that version is already live. Bump with `npm version patch` first.
- **"You must sign up for private packages"** - the `access: "public"`
  line in `publishConfig` fixes this for scoped packages on the free plan.
- **`agent-signer` peer-dep warnings** - harmless. It only depends on
  `@mysten/sui`, which has no peers.
