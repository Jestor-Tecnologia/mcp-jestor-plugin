# Local validation contracts

These schemas are authored for this repository, **not official Cursor schemas**.
They deliberately validate only this package's small supported configuration.
Ajv validates them using JSON Schema Draft 2020-12, entirely offline.

The field choices follow Cursor documentation consulted on 2026-10-13:

- [Building plugins](https://cursor.com/docs/plugins/building): native Cursor
  manifest at `.cursor-plugin/plugin.json`, metadata fields, repository-relative
  `logo`, and discovery of root `mcp.json`.
- [MCP static OAuth](https://cursor.com/docs/context/mcp): remote server `url`
  with `auth.CLIENT_ID`; public clients do not require `CLIENT_SECRET`.

The local contract additionally pins the Jestor gateway and public client ID,
rejects credential headers and client secrets, and limits the package to one
server. It is intentionally stricter than the full Cursor format. Update the
schemas and focused tests when deliberately changing these package choices.

The official [Agent Plugins 1.0.0 schemas](https://agent-plugins.org/schemas)
were also consulted. Their portable MCP schema does not permit Cursor's `auth`
property. Consequently this native Cursor package does not claim Agent Plugins
schema conformance and does not vendor those unused schemas.

Validation establishes configuration shape and package integrity. It cannot
prove production client registration, OAuth login, MCP initialization, or
Cursor marketplace acceptance; those require external verification.
