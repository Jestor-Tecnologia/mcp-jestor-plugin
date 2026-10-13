# Jestor plugin acceptance tests

These are reproducible manual acceptance procedures, not a record of passing tests. Automated schema and build tests do not log into Jestor, run an IDE, check permissions, or establish isolation between organizations. Execute this suite for each advertised host and installation route using a disposable environment, and record observed results below. A standalone MCP connection cannot establish plugin-loading acceptance.

## Prepare disposable data

Use a dedicated test organization, **Tenant A**, containing no customer data. In Jestor terminology, tenant, organization, org, and namespace describe the organization scope. Record actual identifiers privately; the names below are fixtures, not assumed IDs.

An authorized administrator should prepare:

- A table named `Plugin Review Customers`, with text fields `Name` and `Status`, and no other required inputs for creation. Use `Name` as the identifying field if appropriate.
- Exactly three records: `Ada Review` / `Active`, `Grace Review` / `Active`, and `Linus Review` / `Inactive`.
- An open task named `Review customer requests` and a completed task named `Archive review notes`, both assigned to the review account.
- A separate table named `Plugin Review Restricted` containing the fake marker `Restricted A Canary`. It must be inaccessible to the review account but visible to the setup administrator.
- A review account allowed to discover accessible tables, fields, records, and tasks, and create/update records only as needed in the customer fixture table.
- A read-only account that can read the customer fixture table but cannot create or update its records. Confirm permissions in Jestor before testing.

For cross-tenant tests, prepare a separate disposable **Tenant B** with a `Plugin Review Customers` table containing only `Tenant B Canary` / `Active`. Give a dedicated multi-tenant account access to A and B, and keep the A-only review account outside B. Record the distinct organization, table, and record identifiers privately; use no real inaccessible customer data for a denial test.

Before every run, remove any `New Review Customer` fixture left by an earlier run and restore `Linus Review` to `Inactive`. Confirm there is only one matching Linus record. Use an authorized administrator to reset fixtures when the test account lacks the necessary permission. Capture initial record counts and values so unexpected writes can be detected.

## Installation and authentication

| ID | Procedure | Expected result |
| --- | --- | --- |
| I1 | With no same-name marketplace install, follow the README's local-copy steps, reload Cursor, and inspect Customize. | Jestor is discovered from the intended local directory and the MCP server appears; no skills or hooks are expected. Record the Cursor version and local-import policy. |
| I2 | In a separate run, install from an actual published marketplace listing, if available. | Publisher/source and installed version match the intended release; project or user scope is recorded. Mark blocked if no listing exists. |
| A1 | Enable Jestor and initiate OAuth from the IDE using the A-only review account. | Browser sign-in and consent finish, control returns to the IDE, tools load, and an accessible-table call succeeds. Record discovery/client registration failures explicitly. |
| A2 | Start a fresh unauthenticated session and cancel browser consent. | The IDE remains unauthenticated and cannot return protected fixture data. No successful connection is claimed. |
| A3 | Restart the IDE after successful sign-in and try a read-only call. | Session recovery or reauthentication works without pasting secrets into chat/config. Record whether renewal was actually exercised; restart alone does not prove refresh-token behavior. |
| A4 | In a disposable session, let an access token expire under the service's documented lifetime, then retry a read. | Refresh succeeds or the IDE requests sign-in; no stale authorization silently returns inaccessible data. If expiry cannot be observed, mark this untested. |
| A5 | Revoke the test grant through supported provider controls, then retry and reconnect. | The previous authorization cannot continue beyond the provider's documented revocation semantics, and explicit reauthorization is required as appropriate. Record timing and behavior; disabling an IDE server is not revocation. |

Do not treat a successful metadata request as A1. Confirm that the package's public client ID `cursor` is registered with the correct callback, and record the installation route without credentials. A personal MCP configuration must be reported as a separate service-connection test, not a pass for the installed plugin.

## Positive review cases

These five cases cover the core record, table, and task workflows. Tool names describe expected service operations; inspect live tool schemas for arguments and discover IDs before use. Begin each case from the prepared fixture state unless the procedure explicitly says otherwise.

| ID | Prompt / procedure | Expected tools | Expected result |
| --- | --- | --- | --- |
| P1 | “List the tables in my connected Jestor environment.” | `jestor_list_tables` | Includes `Plugin Review Customers`; does not expose `Plugin Review Restricted` to the review account. |
| P2 | “In Plugin Review Customers, list active customers and show only their names and status.” | `jestor_list_tables`, `jestor_get_table_fields`, `jestor_list_records` | Discovers field identifiers and selects Name/Status explicitly; returns Ada and Grace only, excluding Linus. Follow pagination if present. |
| P3 | “Create a record in Plugin Review Customers with Name set to New Review Customer and Status set to Active.” | `jestor_list_tables`, `jestor_get_table_fields`, `jestor_create_record` | Creates exactly one record in A with the requested values. Read it back and check count increased by one; asks for missing required input instead of guessing. |
| P4 | “In Plugin Review Customers, change the status of Linus Review from Inactive to Active.” | `jestor_list_tables`, `jestor_get_table_fields`, `jestor_list_records`, `jestor_update_record` | Identifies one record, obtains host-required approval, and changes only Status. Read back Linus, Ada, and Grace to confirm the scope. Reset Linus afterward. |
| P5 | “Show my open tasks in Jestor.” | `jestor_list_tasks` | Includes `Review customer requests` and excludes the completed `Archive review notes`. |

## Negative cases and permission enforcement

| ID | Prompt / procedure | Expected result |
| --- | --- | --- |
| N1 | “Show customer records that my connected account does not have permission to access.” | Explains the limitation or reports authorization failure; does not disclose `Restricted A Canary` or claim access was granted. |
| N2 | “Create a Jestor user using a username and password instead of an email address.” | Explains that an email is required; does not request a password or submit an unsupported creation request. |
| N3 | “Transfer 100 dollars from my bank account to a supplier.” | Explains the integration cannot transfer money; no tool or automation is used to attempt a financial transaction. |
| R1 | As the A-only review account, request a read from the known disposable restricted table ID. | The service denies access or returns no inaccessible data; the fake canary never appears. An agent refusing without calling the service tests agent behavior only, not backend enforcement. |
| R2 | As the read-only account, attempt P3 and P4 against the disposable customer table. | Writes are denied or unavailable; an administrator's readback confirms no record was created and Linus remains Inactive. Record whether a server denial was observed. |
| R3 | After signing in with the review account, have the administrator remove its access to the disposable customer table, then attempt another read and update. | Current access restrictions are enforced according to documented service semantics; no unauthorized data or write succeeds. Record propagation time, token renewal, and reauthentication if needed. Restore fixture permissions afterward. |
| R4 | Repeat P4 with two disposable records named Linus Review. | The agent asks for clarification and makes no change until a unique target is selected. Remove the extra fixture afterward. |

Never mark backend permission enforcement as passed solely because the agent declines to call a tool. Use the host's supported tool inspector or an authorized MCP test client for a direct read/write attempt against disposable fixtures if needed, and document that route separately. Do not place tokens in public evidence.

## Multi-tenant behavior

| ID | Procedure | Expected result |
| --- | --- | --- |
| T1 | Sign in with the A-only account, request B's known disposable table ID and `Tenant B Canary`. | B's data is not returned, and no automatic account or tenant switch grants access. Record a service denial separately from an agent refusal. |
| T2 | Sign in with the dedicated A+B account. Inspect the live tools' organization/tenant selection contract, select A explicitly, and run P2; then select B explicitly and query its fixture. | A returns only A's active fixtures and B returns only `Tenant B Canary`; IDs are rediscovered or scoped correctly. If the host/service offers no supported way to select scope, mark switching blocked rather than inventing a `tenant_id` argument. |
| T3 | With the A+B account connected, ask to update `Plugin Review Customers` without specifying an organization when the target is ambiguous. | The agent establishes the intended scope before writing and does not silently choose between same-name tables. Check both tenants for unintended changes. |
| T4 | Explicitly target A, create one `New Review Customer`, and inspect both organizations. | Exactly one new record exists in A and none in B. Tenant selection remains consistent between table discovery, field discovery, and write. |
| T5 | Disconnect the A+B test session and authenticate as the A-only account, then request B's known fixture ID. | B remains inaccessible; cached IDs or an earlier session do not retain the previous account's privileges. |

Do not assume the names `tenant_id`, `org`, or `namespace` are accepted by every tool. Use the actual tool schema. A host with one fixed organization per connection may need separate connections or reauthentication; record that limitation instead of claiming in-session switching works.

## Evidence record

All rows start unchecked. Replace “Not run” with **Passed**, **Failed**, or **Blocked**, plus the actual timestamp, host/version, package version or commit, installation route, and a sanitized evidence reference. Identify the test-account role and tenant aliases without publishing login details. Record observed tool arguments/results with secrets and personal data removed; do not substitute the expected outcome for the observation.

| Verified | Case | Status | Date / host / package / route | Sanitized evidence and observed result |
| --- | --- | --- | --- | --- |
| [ ] | I1 local discovery | Not run | — | — |
| [ ] | I2 marketplace installation | Not run | — | No listing or approval claimed. |
| [ ] | A1 OAuth and first tool | Not run | — | Client-registration compatibility requires validation. |
| [ ] | A2 consent cancellation | Not run | — | — |
| [ ] | A3 restart | Not run | — | — |
| [ ] | A4 expiry / refresh | Not run | — | — |
| [ ] | A5 revocation | Not run | — | — |
| [ ] | P1 table discovery | Not run | — | — |
| [ ] | P2 filtered records | Not run | — | — |
| [ ] | P3 create | Not run | — | — |
| [ ] | P4 update | Not run | — | — |
| [ ] | P5 open tasks | Not run | — | — |
| [ ] | N1 inaccessible data | Not run | — | — |
| [ ] | N2 unsupported user creation | Not run | — | — |
| [ ] | N3 unsupported bank transfer | Not run | — | — |
| [ ] | R1 direct restricted read | Not run | — | — |
| [ ] | R2 read-only writes | Not run | — | — |
| [ ] | R3 permission removal | Not run | — | — |
| [ ] | R4 ambiguous record | Not run | — | — |
| [ ] | T1 unauthorized tenant | Not run | — | — |
| [ ] | T2 explicit tenant selection | Not run | — | — |
| [ ] | T3 ambiguous tenant | Not run | — | — |
| [ ] | T4 isolated tenant write | Not run | — | — |
| [ ] | T5 account switch isolation | Not run | — | — |
| [ ] | Cleanup / fixture reset | Not run | — | — |

## Cleanup

An authorized fixture administrator should delete only records created by this run, restore Linus to Inactive, remove the duplicate-name fixture if used, restore test-account permissions, and verify A and B against their initial counts. Revoke temporary grants when the review session ends. If the review account must remain available for marketplace reviewers, preserve only the agreed disposable fixtures and share access through the provider's secure review channel, never through this repository.
