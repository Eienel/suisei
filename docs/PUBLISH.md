# Publishing to npm

Two packages, both scoped under `@suisei`, both publish-ready.

## One-time setup (you do this in a browser)

1. **Create the `suisei` npm organization.** Scoped packages need their
   scope to exist first. Go to <https://www.npmjs.com/org/create>, name it
   `suisei` (lowercase), free plan. Takes 30 seconds.
2. **Make sure 2FA is set up the way you want it.** If you have 2FA on,
   `npm publish` will prompt for an OTP each time. That's fine — just have
   your authenticator open.

## Per-release checklist

From your local clone, in PowerShell (Windows) or any shell:

```bash
cd <repo>/packages/mcp

# 1. pull latest + clean build
git pull origin claude/v1-sui-ai
npm install
npm run build

# 2. sanity check the tarball before sending it to the world
npm pack --dry-run        # confirm version, file list, total size

# 3. log in once per machine
npm login                 # opens browser, finishes in shell

# 4. publish (will prompt for OTP if 2FA is on)
npm publish

# 5. repeat for the signer package
cd ../agent-signer
npm install
npm run build
npm pack --dry-run
npm publish
```

That's it — within a minute the world can:

```bash
npx -y @suisei/mcp        # spin up the MCP server
npm install -g @suisei/agent-signer  # install the Tier-1 signer
```

## Verify it landed

```bash
npm view @suisei/mcp
npm view @suisei/agent-signer
```

## Bumping versions for the next release

The packages are at `0.1.0` today. Use `npm version` from inside each
package directory — it updates `package.json` and creates a commit + tag:

- `npm version patch` → `0.1.1` (bug fix)
- `npm version minor` → `0.2.0` (new tools, no breaking changes)
- `npm version major` → `1.0.0` (breaking changes; not yet)

Then `git push --follow-tags` and `npm publish` again.

## Common pitfalls

- **"402 Payment Required" / "scope not found"** — the `suisei` org doesn't
  exist on npm yet. Step 1 of one-time setup.
- **"403 Forbidden"** — you're not a member of the `suisei` org, or
  `publishConfig.access` isn't `public`. Both are already set in
  `package.json`; the cause is org membership.
- **"You must sign up for private packages"** — same as above; the
  `access: "public"` line in `publishConfig` is what fixes this for
  scoped packages on the free plan.
- **`agent-signer` install warns about peer deps** — fine. It only depends
  on `@mysten/sui`, which has no peers.
