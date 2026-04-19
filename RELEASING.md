# Releasing

## First-time setup (one time only)

### 1. Create a VS Code Marketplace publisher

1. Sign in to https://marketplace.visualstudio.com/manage with a Microsoft account
2. Click "New Publisher"
3. Use publisher ID `trimud` (must match `"publisher"` in `packages/vscode/package.json`)

### 2. Create a Personal Access Token

1. Go to https://dev.azure.com/{your-org}/_usersSettings/tokens
2. Click "New Token"
3. Set scope to: **Marketplace → Manage**
4. Set expiration to 1 year (max)
5. Copy the token

### 3. Add the PAT as a GitHub secret

1. Go to https://github.com/Trimud/otel-log-beautifier/settings/secrets/actions
2. Click "New repository secret"
3. Name: `VSCE_PAT`
4. Value: paste the token
5. Save

## Cutting a release

### Option A: Dispatch the Release workflow (recommended)

1. Go to https://github.com/Trimud/otel-log-beautifier/actions/workflows/release.yml
2. Click **Run workflow**
3. Enter the `version` (e.g. `0.2.1` or `0.3.0-beta.1` — no leading `v`)
4. Leave `dry_run` unchecked for a real release; check it to build vsix artifacts only

The workflow:
- Validates the version is valid semver
- Builds vsix for 6 platforms (darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64, win32-arm64) with the new version baked in
- Publishes each vsix to the VS Code Marketplace (skipped for pre-release versions containing `-`)
- Bumps `version` in the three `package.json` files + `package-lock.json`, commits `chore: release vX.Y.Z`, tags `vX.Y.Z`, pushes both to `main`
- Creates a GitHub Release on the new tag with all vsix files attached

The commit and tag are only created after a successful build and marketplace publish — failed runs leave no trace in git history.

> **Note:** if `main` is protected, the default `GITHUB_TOKEN` may not be able to push. Either allow the `github-actions[bot]` to bypass protection, or swap the push steps to use a PAT.

### Option B: Publish manually from your machine

```bash
# After merging changes to main
npm run package:all  # Builds all 6 platform vsix files

# Authenticate with vsce (one time)
npx @vscode/vsce login trimud
# Paste your PAT when prompted

# Publish each vsix
for vsix in packages/vscode/*.vsix; do
  npx @vscode/vsce publish --packagePath "$vsix"
done
```

## Version bumping

Use [SemVer](https://semver.org):

- **Patch** (`v0.1.1`): bug fixes, no new features, no breaking changes
- **Minor** (`v0.2.0`): new features, backwards compatible
- **Major** (`v1.0.0`): breaking changes

The three `package.json` files must all have the same version.

## After publishing

Wait 5-10 minutes for the marketplace to process the extension. Verify:

1. Visit https://marketplace.visualstudio.com/items?itemName=trimud.otel-log-beautifier
2. Check the version number matches
3. Install from VS Code: Extensions tab → search "OTel Log Beautifier"
4. Test in a fresh VS Code window

## Troubleshooting

### "PAT invalid" error

Your PAT expired or doesn't have Marketplace → Manage scope. Regenerate and update the `VSCE_PAT` secret.

### "Publisher doesn't exist"

Check that `packages/vscode/package.json` has the correct `"publisher"` field and that you created the publisher with that exact ID.

### CI build fails on `ubuntu-24.04-arm` or `windows-11-arm`

These are newer runner types. If GitHub Actions removes them or they become paid-only, drop those targets from the matrix in `.github/workflows/release.yml`.

### Marketplace rejects the vsix

Common causes:
- Missing LICENSE file
- Icon size not 128×128
- README has relative image URLs (marketplace doesn't resolve them — use full GitHub raw URLs)
