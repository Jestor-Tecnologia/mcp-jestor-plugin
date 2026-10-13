# Maintainer validation and submission

The root package targets Cursor's native plugin format. Its MCP connection uses public OAuth client ID `cursor` so that Cursor does not have to infer dynamic client registration. This identifier must exist in the production identity service with the applicable callbacks; configuration alone cannot establish that it does.

This guide describes local checks and external release prerequisites. None of the repository validation or build commands publishes, deploys, changes repository visibility, or registers an OAuth client.

## Package contract

| File | Purpose |
| --- | --- |
| `.cursor-plugin/plugin.json` | Cursor plugin identity and public metadata. |
| `mcp.json` | Remote Jestor MCP connection and static public OAuth client ID. |
| `assets/jestor-icon.svg` | Bundled Jestor icon referenced by the native manifest. |
| `README.md` | User installation, authentication, usage, and support. |
| `docs/maintaining.md` | Validation and publication prerequisites. |
| `docs/smoke-tests.md` | Disposable fixtures, acceptance procedures, and evidence template. |

Cursor's native manifest and the portable Agent Plugins manifest are different schemas. A native plugin uses `.cursor-plugin/plugin.json`; a portable Agent Plugin uses root `plugin.json` and its standard schema. Native Cursor fields such as `logo` and MCP `auth.CLIENT_ID` must not be assumed valid in the portable schema. The native package retains the icon without claiming portable-format compliance. There are no bundled skills, hooks, rules, or server implementation; the live service supplies tool schemas.

Keep `https://mcp.jestor.com/v1/gateway` as the remote endpoint. Do not add passwords, bearer tokens, cookies, client secrets, private account identifiers, or credentials for reviewers to manifests, documentation, fixtures, or artifacts. The public client ID `cursor` is not a secret. Do not copy scopes from another service: the Jestor gateway's authorization contract must determine any scope configuration.

## Local validation and build

Use Node.js 24 and pnpm 10. Confirm versions before running commands; a different globally installed pnpm may not match the version pinned in `package.json`. If Corepack is installed, `corepack pnpm` can invoke that pinned version.

From the repository root:

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm validate
pnpm test
pnpm build
```

The build replaces `dist/jestor` with a distributable directory containing the six files in the package contract above; it does not generate a ZIP. Inspect that file list before copying it or sharing it. Retain hidden `.cursor-plugin` files when copying. The README's local-install commands also work from a built package directory containing the same plugin files. Do not treat `pnpm build` as an npm publication or marketplace submission command.

Validation uses locally authored JSON schemas for this package's subset of Cursor configuration, not an official Cursor schema. Tests check metadata, matching versions, endpoint/client configuration, rejected secrets and unsupported fields, required files, symlink restrictions, conflicting root manifests, and a build that copies only allowed files while preserving their bytes. Inspect the test output for the exact coverage at the revision being released. None of these checks executes a review prompt against Jestor or substitutes for Cursor's parser and marketplace review.

Record separate results for each validation layer:

| Layer | What passing establishes | What it does not establish |
| --- | --- | --- |
| `pnpm validate` | The files satisfy this repository's configured validation rules. | IDE discovery, live tool contracts, OAuth, legal coverage, or marketplace acceptance. |
| `pnpm test` | Automated package and negative-fixture tests pass for this revision. | That any manual review prompt or permission test was executed. |
| `pnpm build` | The distributable can be generated under the build's inclusion rules. | Successful local import, sign-in, or publishing. |
| Public HTTP discovery | The observed endpoint returns the recorded challenge or metadata. | A registered client, consent, token exchange, refresh, or authorized tool calls. |
| IDE smoke tests | The recorded host, route, account role, and scenarios behaved as observed. | Untested hosts, tenants, account roles, or marketplace approval. |
| Marketplace review | The marketplace's actual review decision. | Any approval before that decision is received. |

After modifying metadata or documentation, re-run the checks and inspect the generated package for stale names, broken links, secrets, missing files, or inconsistent version numbers. The package version is separate from the hosted service's version. Changes in live tools can require renewed smoke tests even when the package files do not change.

## OAuth prerequisites

Cursor documents [static OAuth configuration](https://cursor.com/docs/context/mcp#static-oauth-for-remote-servers) for providers using fixed client IDs. The native package sets `auth.CLIENT_ID` to `cursor`; it includes no client secret or invented scopes.

Before claiming authentication works, the service owner must verify:

- The `cursor` public client is registered and enabled for the intended Jestor MCP resource and authorization flow in production.
- The exact callback for the tested surface is allowed. Cursor documents `http://localhost:8787/callback` for desktop and `https://www.cursor.com/agents/mcp/oauth/callback` for web/Agents. Registering a callback and testing one surface does not establish support for the other.
- Authorization code flow with PKCE works, consent reflects the intended account and organization, and the resulting token authorizes the gateway.
- The chosen account's permissions and tenant context are enforced for reads and writes.
- Refresh, cancellation, account switching, permission changes, and revocation behave as documented and are recorded in the [smoke-test evidence](smoke-tests.md#evidence-record).

This repository does not register clients or change production identity configuration. If any prerequisite fails, record the exact failing stage and ask the service owner to resolve it through its operational process. Do not add production changes to a documentation or packaging test.

### Read-only observations on October 13, 2026

| Request | Observed result | Scope of evidence |
| --- | --- | --- |
| GET `https://mcp.jestor.com/.well-known/oauth-protected-resource/v1/gateway` | Public JSON names resource `https://mcp.jestor.com/v1/gateway`, authorization server `https://id.jestor.com`, and bearer method `header`. | Resource discovery only. |
| GET `https://id.jestor.com/.well-known/oauth-authorization-server` | Public JSON advertises authorization code, refresh tokens, S256 PKCE, public-client token authentication (`none`), and CIMD support; no `registration_endpoint` was present. | Advertised protocol capabilities only; does not prove the `cursor` registration or CIMD trust for Cursor. |
| Unauthenticated POST `{}` to the gateway | HTTP 401 with a Bearer `WWW-Authenticate` challenge pointing to the protected-resource metadata URL. | Authentication challenge only; no authorized operation was executed. |

Earlier endpoint probes returned HTTP 403. Subsequent metadata discovery and the authentication challenge above succeeded, so the earlier status must not be reported as the service's current universal response or as a diagnosed root cause. No sign-in, token exchange, IDE installation, refresh, or tool-execution success is implied by these observations.

To recheck the public discovery documents without credentials:

```sh
curl --fail --show-error --silent \
  https://mcp.jestor.com/.well-known/oauth-protected-resource/v1/gateway
curl --fail --show-error --silent \
  https://id.jestor.com/.well-known/oauth-authorization-server
```

Record the actual date, status, and advertised fields. Do not probe authorization or token endpoints with fabricated credentials, and do not treat a GET on the gateway as a complete MCP handshake.

## Manual acceptance

Follow the [smoke-test guide](smoke-tests.md) using disposable data. Keep installation, OAuth, positive tool cases, negative cases, backend permission enforcement, and multi-tenant behavior as separate evidence rows. Confirm actual tool responses and read back mutations; a plausible assistant answer is not proof that a tool ran successfully.

Use the [official local installation workflow](https://cursor.com/docs/plugins#test-plugins-locally): copy real files under `~/.cursor/plugins/local/jestor`, reload Cursor, and inspect Customize. Symlinks to an external checkout are ignored. Check local-import policy and same-name marketplace precedence before diagnosing package discovery. This workflow was verified against Cursor's documentation; executing it with this package in Cursor remains an external acceptance step.

## Submission checklist

Keep these items unchecked until the person responsible supplies evidence. The package is not ready for a marketplace approval claim while required items remain pending.

- [ ] Select an open-source license with the repository owner's authorization and add the corresponding license text/metadata. Cursor says marketplace plugins must be open source; no license grant has been selected by this documentation. Third-party license notices do not license the entire repository.
- [ ] Confirm publisher identity, ownership of the Jestor name/icon, support contact, and category. Verify all public URLs, including privacy and terms, and confirm that their coverage includes the MCP/OAuth data flows.
- [ ] Review the final native manifest, icon path, endpoint, and client ID against the current [Cursor plugin reference](https://cursor.com/docs/plugins/building). Keep all package-relative paths valid and exclude unrelated/private files.
- [ ] Run `pnpm validate`, `pnpm test`, and `pnpm build` on the exact candidate revision with the documented runtime versions; retain the result and artifact file list.
- [ ] Verify production client registration and callbacks, then complete local installation and OAuth smoke tests in the supported Cursor version.
- [ ] Execute the positive and negative cases, read-only/write-denial cases, permission changes, and cross-tenant tests. Fill in observed results and sanitized evidence; record any unsupported behavior.
- [ ] Prepare any demonstration or reviewer access requested by the actual submission form using disposable accounts and data. Share credentials only through the marketplace's secure channel, never the public repository.
- [ ] Obtain authorization to publish source and make the repository public. Cursor's [submission instructions](https://cursor.com/docs/plugins/building#submitting-a-plugin) require a public Git repository; creating local files does not satisfy this prerequisite.
- [ ] Submit the real repository URL at [Cursor's plugin submission page](https://cursor.com/marketplace/publish). Review the current form requirements; this guide does not assert that a submission has been made.
- [ ] Resolve marketplace review feedback and wait for an actual approval/listing. Only then add the verified listing/install URL and publication status to the README.
- [ ] Re-run marketplace installation and authentication against the published version, and retain a repeatable update/review process.

No commit, push, pull request, repository visibility change, submission, or publication is performed by these instructions automatically. Maintainers must carry out external steps with the appropriate authorization. No OpenAI-specific submission metadata or review workflow should be assumed to apply to Cursor's marketplace.

## Official references

Consulted October 13, 2026:

- [Cursor plugins: formats, installation, policies, and open-source requirement](https://cursor.com/docs/plugins)
- [Cursor plugin building/reference and submission checklist](https://cursor.com/docs/plugins/building)
- [Cursor MCP: remote servers, static OAuth, configuration locations, and logs](https://cursor.com/docs/context/mcp)
- [Cursor marketplace submission](https://cursor.com/marketplace/publish)

The general plugin reference also describes Cursor-specific rules, agents, commands, hooks, and variables. Their presence in that reference does not mean this package includes them.
