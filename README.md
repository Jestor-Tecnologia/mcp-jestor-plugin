# Jestor Plugin for Cursor

Connect Cursor to your Jestor account to work with business data and workflows. This plugin connects to Jestor's hosted Model Context Protocol (MCP) service at `https://mcp.jestor.com/v1/gateway` using Streamable HTTP.

The package uses Cursor's native format: `.cursor-plugin/plugin.json`, a root `mcp.json`, and a Jestor icon. It includes no skills, hooks, local server, or custom user interface. Tools are discovered from the service after connection; available operations depend on your Jestor access and the tools exposed by the service. This is not a portable Agent Plugins package; other hosts need their own MCP and OAuth configuration and acceptance tests.

**Publication status:** no marketplace listing or approval is claimed. Local installation and OAuth acceptance must be verified in Cursor before release, including production registration of the configured OAuth client ID `cursor`. An open-source license has not yet been selected; license selection is a prerequisite for Cursor marketplace submission.

## What you can do

- Find, filter, create, and update records.
- Inspect and manage tables and fields.
- Find and manage tasks.
- Manage users and permissions when authorized.
- Configure automations and maintain Python functions when authorized.
- Inspect account usage.

Writes affect your connected Jestor environment. Updates can overwrite values, access changes can revoke permissions, and enabled automations can affect data or external services. Identify the intended organization and records before requesting changes. User creation requires an email address; this integration does not accept user passwords or provide bank transfers.

## Requirements

- An existing [Jestor account](https://jestor.com/) with access to the intended organization and permissions for the requested operations. Installation does not create an account or grant access. Ask your Jestor administrator or support about account eligibility and plan requirements.
- A current Cursor version supporting plugins and remote MCP with static OAuth client configuration. Other IDEs are not covered by this package's installation procedure.
- A browser for Jestor sign-in and network access to the MCP service and the authentication endpoints it advertises.
- A working Jestor OAuth registration for client ID `cursor` and the applicable Cursor callback. This is a service-side prerequisite for maintainers to verify, not a secret users need to supply.
- Permission under your organization's IDE policies to install the plugin and connect to the remote service. Local plugin imports and MCP allowlists are separate controls.

Using the hosted connection requires no local Node.js, pnpm, API key, or server process. Maintainers need Node.js 24 and pnpm 10 for the repository checks and build.

## Install in Cursor

### From the marketplace, when published

Once Jestor is listed in the [Cursor Marketplace](https://cursor.com/marketplace), open **Customize** in Cursor's sidebar, find the Jestor plugin, verify its publisher and source, select **Install**, and choose a project or user scope. Then complete the OAuth steps below. Until a listing exists, use a trusted source checkout for local evaluation; there is no release download URL documented here.

### From a local checkout

These steps follow Cursor's official [Test plugins locally](https://cursor.com/docs/plugins#test-plugins-locally) instructions. They describe the supported procedure; a completed Jestor installation test is tracked separately in the [smoke-test evidence table](docs/smoke-tests.md#evidence-record).

1. Obtain a trusted copy of this repository and open a terminal at its root, where `.cursor-plugin/plugin.json` and `mcp.json` are located. Enable hidden-file display if using a file manager so `.cursor-plugin` is included.
2. Copy the plugin files into a real directory at `~/.cursor/plugins/local/jestor`. For macOS or Linux, the following commands assume a fresh destination; if one already exists, back up or move the previous copy first.

   ```sh
   mkdir -p "$HOME/.cursor/plugins/local/jestor/.cursor-plugin"
   mkdir -p "$HOME/.cursor/plugins/local/jestor/assets"
   cp .cursor-plugin/plugin.json "$HOME/.cursor/plugins/local/jestor/.cursor-plugin/"
   cp mcp.json "$HOME/.cursor/plugins/local/jestor/"
   cp assets/jestor-icon.svg "$HOME/.cursor/plugins/local/jestor/assets/"
   ```

   On Windows, copy the same files under `.cursor/plugins/local/jestor` in your user home directory. The final layout must be:

   ```text
   ~/.cursor/plugins/local/jestor/
   ├── .cursor-plugin/
   │   └── plugin.json
   ├── mcp.json
   └── assets/
       └── jestor-icon.svg
   ```

3. Restart Cursor or run **Developer: Reload Window** from the Command Palette.
4. Open **Customize**, confirm the Jestor MCP server is present, and enable it if needed. No Jestor skills or hooks are expected.
5. Complete sign-in and try a read-only request such as “List the tables in my connected Jestor environment.”

Do not symlink this directory to a checkout elsewhere on disk: Cursor skips symlinks whose targets are outside `~/.cursor/plugins/local`. After changing package files, copy the updated files again and reload. An installed marketplace plugin with the same name takes precedence over the local copy.

On Teams and Enterprise, an administrator may need to enable **Allow Local Plugin Imports** under **Dashboard → Settings → Security & Identity → Marketplace and Plugins**; Cursor documents this as off by default on Enterprise. A policy restriction must be resolved through your administrator.

### Optional: connect only the MCP server

For a Cursor MCP connection without plugin installation, merge this entry into your project's `.cursor/mcp.json` or your user-level `~/.cursor/mcp.json`, preserving existing servers:

```json
{
  "mcpServers": {
    "jestor": {
      "url": "https://mcp.jestor.com/v1/gateway",
      "auth": {
        "CLIENT_ID": "cursor"
      }
    }
  }
}
```

Cursor infers the remote transport from the URL in its configuration format. `CLIENT_ID` is a public OAuth client identifier, not a password or access token; it must match a client registered with Jestor. This alternative tests the service connection, not plugin discovery or marketplace installation. Avoid configuring both routes at once because duplicate server entries can make authentication and tool selection confusing. Organization MCP policies still apply.

## Sign in with OAuth

1. Enable Jestor in **Customize** and use the authentication/connect action Cursor presents for the server. Exact button labels can vary by Cursor version.
2. Complete Jestor sign-in in the browser and review the requested access. If organization selection is offered, choose the environment you intend to use.
3. Return to Cursor after authorization. Check that the server connects and tools become available.
4. Ask for accessible tables and verify the connected environment before requesting writes.

The intended flow uses Cursor's OAuth support with public client ID `cursor`. This package contains no password, access token, authorization header, client secret, or tenant-specific URL. Do not paste passwords or access tokens into chat or the repository. Successful browser login alone is insufficient: a read-only tool call must also succeed. If authentication discovery, client registration, consent, or return to Cursor fails, use the troubleshooting steps and report the failure; do not invent OAuth settings to bypass it.

For client registration requirements and the recorded discovery checks, see the [maintainer OAuth checks](docs/maintaining.md#oauth-prerequisites).

To stop using the connection, disable the server in **Customize**. Disabling or uninstalling a plugin does not prove that an OAuth grant was revoked. To revoke access, use Jestor's supported account controls or contact support, then verify that the previous authorization no longer works.

## Example requests

Start with reads:

> List the tables in my connected Jestor environment.
>
> In Customers, find active customers and show only their names and status.
>
> Show my open tasks in Jestor.

For changes, name a specific target and use disposable data while evaluating:

> In Plugin Review Customers, create one record with Name “New Review Customer” and Status “Active”.
>
> In Plugin Review Customers, change Linus Review's Status from Inactive to Active. Ask me to clarify if more than one record matches.
>
> Help me create a table to track customer requests. Show the proposed fields before creating it.

The agent should discover actual table and field identifiers rather than guess them. Cursor may request approval for tool calls depending on its run mode and your organization's policy; inspect the proposed arguments before approving changes. See [reproducible smoke tests](docs/smoke-tests.md) for fixture setup, permissions, expected results, and cleanup.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Plugin does not appear | Check the copied directory layout, including hidden `.cursor-plugin/plugin.json`, local-import policy, and reload Cursor. Replace any symlink to an external checkout with real files. Check whether a marketplace copy with the same name takes precedence. |
| Plugin appears but tools do not | Enable the MCP server in Customize, finish authentication, and check the MCP URL allowlist and network access. This package has no skills to activate. |
| Login loops, unknown client, callback fails, or tools remain unauthenticated | Read **Output → MCP Logs** for the failing step. Verify browser sign-in; ask maintainers to confirm the `cursor` client and exact callback registration. Do not add a client secret or guess scopes. |
| HTTP 401 or 403 | Check whether this was an unauthenticated request, OAuth failure, policy denial, or a tool permission error. A status alone does not identify the cause; inspect the failing step in MCP Logs. |
| Some tables or records are missing | Verify the connected organization, account permissions, requested filter, and pagination. Ask the administrator to review access; do not switch to privileged credentials to bypass a restriction. |
| A write fails or times out | Inspect the tool error and read the target record back before retrying; the change may already have happened. Check required fields, identifiers, and write permission. |
| Duplicate tools or unexpected account | Check for simultaneous plugin, project, and user MCP configurations. Disable the unintended entry, reconnect the intended one, and verify its environment with a read-only call. |

Open Cursor's **Output** panel and select **MCP Logs** to inspect initialization and tool errors. A useful support report includes the plugin version, Cursor version, operating system, timestamp with timezone, installation route, failing step, and a redacted error or request identifier. Exclude credentials, cookies, authorization headers, and customer records.

## Support, privacy, and terms

- [Jestor support](https://docs.jestor.com/docs/support)
- [Jestor privacy policy](https://jestor.com/privacy/)
- [Jestor terms of service](https://blog.jestor.com/terms-of-service-jestor-02-21-2024/)

Tool arguments are sent to Jestor's hosted MCP service. Returned data is provided to the connected AI host and may enter its conversation context; the host's own privacy and account settings also apply. These links identify Jestor's published policies, but do not establish MCP-specific retention, residency, or contractual coverage. Maintainers must confirm that coverage before submission. License selection for this repository is pending; the linked service terms do not grant an open-source license to the package.

For package validation, build instructions, and release prerequisites, see the [maintainer guide](docs/maintaining.md). For the official integration behavior, see [Cursor plugins](https://cursor.com/docs/plugins), [plugin building/reference](https://cursor.com/docs/plugins/building), and [MCP configuration](https://cursor.com/docs/context/mcp).
