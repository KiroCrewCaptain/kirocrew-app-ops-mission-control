# Porting notes: built-in → external app

This repository was ported from Kiro Crew's built-in Ops Mission Control at
KiroCrew `main` `55439d8770`:

- the backend, `src/kiro_crew/apps/builtins/ops_mission_control/` (`app.json`,
  every module under `backend/`, and the 38 test modules and two helpers under
  its `tests/`);
- the skill and its six SOPs, `src/kiro_crew/builtin_skills/ops-mission-control/`;
- the dashboard page, `website/src/apps/ops-mission-control/` (`api.ts`,
  `OpsMissionControlPage.tsx`, `SignalsPanel.tsx`, `HandoverPanel.tsx`,
  `SettingsPanel.tsx`, `IncidentChat.tsx` and their five co-located tests), the
  four page tests under `website/src/test/` (`opsMissionControl.test.ts`,
  `OpsMissionControlPageCoverage.test.tsx`,
  `OpsMissionControlSettings.coverage.test.tsx`, `OpsSignalsPanelCoverage.test.tsx`)
  and the browser spec `website/playwright/ops-mission-control.spec.ts`;
- the `apps.opsMissionControl.*` strings of `website/src/i18n/locales/*.json`
  (all 12 dashboard locales);
- the store art, `website/public/app-assets/ops-mission-control/`;
- the app's own core tests, `test/test_omc_ledger_sync_coverage.py` and
  `test/test_ops_mission_control_sop_facts.py`;
- the module spec, `docs/system-specs/modules/ops-mission-control.md`, now
  `docs/spec.md` (as on KiroCrew `main` `6d07df11cf`, unchanged: it records the
  built-in's design, and the paths it names are the built-in's).

The wheel copy's changes since, up to KiroCrew `main` `6d07df11cf`, are ported (see
[Synced with the wheel copy](#synced-with-the-wheel-copy)), and the pinned test
dependency is that commit. Paths with a line number below refer to `55439d8770`. A **gap** is something
the built-in gets from Kiro Crew that an external app has no public way to get
yet; closing one is a Kiro Crew change (a generic, app-agnostic App Kit seam),
never a change here, and no Kiro Crew API was invented for this port.

## What carried over unchanged

- `app.json` `name` (`ops-mission-control`), `version` (`0.1.0`), `author`,
  `permissions` (the app API, `/api/chat*`, `/api/approvals*`, the `slots` and
  `notification` events, `network`, `storage`, `cron`, and the six MCP tools),
  `notifications` (the three channels), `dependencies`, `platform`,
  `defaultEnabled: false`, and every display field. `tests/test_manifest_contract.py`
  compares them with the built-in's manifest (`tests/fixtures/builtin-app.json`),
  because adoption refuses a manifest that widens a grant or forces the app off.
- The four crons: names, schedules, `enabled`, `silent` and
  `persistent_session` are the built-in's. Each prompt differs only in where it
  finds its SOP (below).
- The whole domain: the incident store and its legal transitions, the knowledge
  ledger and its git sync, the vector projection of the ledger, rotation and the
  tier map, the autonomy gate and the propose/decide loop, the eight provider
  adapters and the companion registry, the Slack and local-notification sinks,
  the handover digest. Every module is the built-in's file with its imports
  changed and the few call sites below.
- Every route's method, path, validation, status codes and response shape. The
  registry serves the paths under `/api/apps/ops-mission-control`, the
  built-in's URLs, so the SOPs, the crons and the core MCP tool reach the same
  routes.
- Where data lives: incidents, the ledger, the vector-index cursor and the
  non-secret config under `<data home>/apps/ops-mission-control/data/` (the
  built-in's `app_data_dir`, and the directory adoption keeps); the provider
  secrets in `<data home>/ops_mission_control_secrets.json` and the autonomy
  ceiling in `<data home>/ops_mission_control_policy.json`, at the same names, so
  Kiro Crew's existing masks still cover them (gap 1).
- The skill and SOPs, byte for byte except the SOP path in each cron prompt.
- The page's markup, class strings and behaviour (`ui/src/`), and its strings in
  all 12 dashboard locales.

## What changed, and why

| Built-in | Here | Why |
|---|---|---|
| `"backend": {"routes": "backend.routes:register_routes"}` (`app.json:121-123`) | `"backend": {"hooks": {"routes": "backend.routes:register_routes"}}` | Top-level `backend.routes` is read only by the built-in boot loop (`BUILTIN_NAMES`). An installed app's routes go through the gateway's `RouteRegistry`. |
| `register_routes(app)` adding 25 absolute routes to `app.router` (`backend/routes.py:399-436`) | `register_routes(ctx) -> list[Route]` over `routes.ROUTE_TABLE`, handlers `(request, ctx)` | The `hooks.routes` contract. `Route` is the app's own frozen dataclass (`backend/_host.py`), accepted structurally from App Kit level 1. Each record calls `routes.<handler>` looked up by name per call, so a patch on `routes` still reaches the served route. The warm-up of the provider registry stays in `register_routes`. |
| `_require_enabled` on every route (`backend/routes.py:173-188`, private `apps.manager.is_app_enabled`) | Removed | The registry serves an app's records only while it is enabled, so a disabled app answers 404. The `app_disabled` 403 is gone. |
| GET routes answered HEAD too (aiohttp's `add_get`) | GET only | The registry dispatches the method a record names. Nothing sends HEAD. |
| `require_owner_dashboard_request(request, "ops_mission_control.<op>")` (`http_routes/configuration.py:38`, `:126`, `:289`, `:729`, `:800`) | `ctx.require_owner(request, "<op>")` (`_host.require_owner`) | The level-1 owner gate. The host prefixes the app's own name, so a denial is audited as `ops-mission-control.put_secret` (was `ops_mission_control.put_secret`). A gateway without the seam refuses every dashboard caller of the four owner-only writes, the owner included. |
| `sel().log_api_access(caller=..., operation=..., ...)` (14 call sites: `secrets.py:49`, `dispatch.py:64`, `rotation.py:47`, `ledger_sync.py:61`, `ledger_index.py:48`, `companion.py:67`, `routes.py:158`) | `ctx.audit.record(operation, outcome, resources=, error=)` through the same call shape (`_host.sel`) | The level-0 audit seam. Rows now read caller `app:ops-mission-control` and operation `ops-mission-control.<verb>`; the built-in wrote `core:ops-mission-control` / `ops-mission-control` and a bare verb. No audit seam is a logged warning. |
| `platform.context.redact_via_context` (`routes.py:157`, `store.py:128`, `slack_out.py:76`, `notify_out.py:229`, `registry.py:420`, `dispatch.py:999`, `providers/github_issues.py:41`) | `ctx.scrub.outbound(text).text` (`_host.redact_via_context`), still followed by the app's own `redact_tokens` | The level-0 scrub seam: the baseline credential and URL passes, then the same active-policy pass the built-in called. It removes at least what the built-in removed. No scrubber, or one that returns no text: every non-empty string becomes `[REDACTED]`. A host whose companion failed to compose still raises, so nothing is published. |
| `embeddings.make_sync_embed_fn()` bound as the vector store's `embed_fn` (`dispatch.py:238-253`) | `ctx.embed.embed_sync` (`_host.embed_fn`) | The level-1 embed seam, the same shared embedder the host's memory uses. No seam: the store has no embedder and recall stays on fingerprints and keywords, the built-in's documented fallback. The deadline and priority the built-in set around the query embed are still set (gap 9). |
| `apps.manager.app_data_dir(APP_NAME)` (`store.py:61`, `ledger.py:46`, `ledger_index.py:46`, `providers/__init__.py:22`) | `ctx.data_dir` (`_host.app_data_dir`), created owner-only | The same directory (`<data home>/apps/<name>/data`). Before a context is bound (only in a test), the host's own helper; neither: refused. |
| `apps.manager.get_app_manifest(APP_NAME)` for the notification channels (`notify_out.py:77`, `:156`) | This copy's own `app.json` (`_host.own_manifest`) | The installed tree is the manifest the gateway parsed. An omitted `defaultPriority` reads as the parser's own default, `"default"` (`tests/test_notify_out.py` checks against the host parser). |
| Notification deep link `/ops-mission-control` (`notify_out.py:101`) | `/apps/ops-mission-control` | The installed page's AppHost route. The built-in route exists only for the compiled page (or, after adoption, as the pin's legacy nav alias). |
| `imessage.plaintext._grapheme_boundary` (private, `notify_out.py:78`) | `backend/_text.py`, the same function | Pure: it only picks where a clip may cut. |
| SOPs under `builtin_skills/` and cron prompts naming `~/.kiro/crew/skills/ops-mission-control/sops/` (`app.json:90-114`) | `skills/ops-mission-control/` in this tree, `"skills": ["skills/ops-mission-control"]`, prompts naming `~/.kiro/crew/skills/ops-mission-control/ops-mission-control/sops/` | An installed app's skill is linked on enable under the app's namespace, `skills/<app>/<skill>`; the flat `skills/<skill>` link is skipped because the skill has the app's own name. `tests/test_config_routes.py::TestSkillDelivery` resolves every prompt's path. |
| Absolute self-imports `kiro_crew.apps.builtins.ops_mission_control.backend.*` | Relative imports | Hook files load into a synthetic package named after the app; `tests/test_manifest_contract.py` loads the hook through the gateway's own module loader. |
| Logger `kiro_crew.apps.builtins.ops_mission_control.backend.routes` for the HTTP surface (`http_routes/_shared.py:24`) | `<package>.routes` | The module's own package. An operator filter on the old name needs the new one. |
| `iconUrl` / `heroImage*` as `/app-assets/...` SVGs, `screenshots` an `/app-assets` PNG (`app.json:134-140`) | `iconPath` / `heroImage` / `heroImageDark` / `screenshots` as repo-relative PNGs under `assets/` | A registry app's art is repo-relative, and the catalog refuses SVG for a non-builtin source. The PNGs were rendered from the built-in SVGs (kept beside them): the icon at 512×512 on an opaque tile with `--ico-a` / `--ico-b` resolved to fixed colours, the heroes at 1200×675. |
| `ui.pages` `[{"route": "/ops-mission-control", "label": "Mission Control", "icon": "Radio"}]`, page compiled into the dashboard (`app.json:125-131`, `website/src/apps/builtinRegistry.ts:71`) | `ui.entry: "dist/index.mjs"` (committed ESM bundle built from `ui/src/`), `ui.pages` `[{"route": "/apps/ops-mission-control", "label": "Mission Control"}]` | An installed app ships its page as a bundle AppHost loads. The legacy route and glyph of an adopted record come from Kiro Crew's adoption pin, never from this manifest. |
| App Store copy keys in the dashboard catalogs (`website/src/components/appstore/appManifest.ts:304-318`) | `l10n` block in `app.json` for the 11 non-English locales | The listing copy travels with the app. It is the `apps.opsMissionControl.manifest` subtree of `ui/i18n/<locale>.json`, kept equal by a test. |
| No `license`, no `minKiroCrewVersion` | `"license": "Apache-2.0"`, `"minKiroCrewVersion": "0.13.0"` | The repository's licence. 0.13.0 is the first release line with App Kit level 1 (structural route records, `ctx.require_owner`, `ctx.embed`, `APP_SDK_LEVEL = 1`); a 0.12 route registry skips every record that is not its own `AppRoute`, so every route would answer 404 there. |
| The core MCP tool `ops_mission_control_api` (`mcp_tools/apps.py:117-146`, `:660-707`), its allowlist and query rule (`validation_parts/app_schemas.py:38-90`) and its channel deny of `POST /rotation/arm` (`channel.py:126-145`, enforced in `mcp_core_parts/governance.py`) | `app.json` `agentTools` declares the same tool (name, title, description, argument names, enums, `maxLength` 512 and 32,768, `maxResultChars` 60,000), and `POST /agent-tools` (`backend/http_routes/agent_tool.py`) serves it: the allowlist, the query rule, GET-only query and POST-only body, the JSON-object body walked through the host's hidden-character sanitizer then the redaction pass (`routes._scrub_inbound`), the hold of `POST /rotation/arm` for a caller whose forwarded `X-Session-Key` is a `channel:` key (403 `channel_agent_refused`, audited), then the route's own served handler over an `AgentCall` view of the request | App Kit seam level 2 (KiroCrew #32660). Until Kiro Crew drops its rows, its core tool keeps the name and serves every call (a declared name a core tool has is never the app's), so nothing changes for an agent; `tests/test_agent_tool_route.py` pins parity with the core tool on the pinned Kiro Crew and drives a validated call through the host's own `/api/app-tools/call` handler and `RouteRegistry`. See gap 2 for what Kiro Crew still has to change |
| A refused host function surfaced as aiohttp's 500 | `503 {"code": "host_unsupported"}` from the record adapter | A route that reaches a missing host function is refused by its stand-in before any write; the page and the agent can tell that from a crash. |

## Host functions with no App Kit seam: resolved from the gateway, fail closed

Nothing in `backend/` but `_host.py` names `kiro_crew`, and `_host.py` has no
`import kiro_crew` statement: each name in `_host.HOST_FUNCTIONS` is resolved
through `importlib` when the hook module loads (the vector-store names at call
time), each with a stand-in for a gateway that lacks it, and **every stand-in
refuses**. `tests/test_no_host_imports.py` pins the table and checks every
name exists on the pinned Kiro Crew; `tests/test_host_stand_ins.py` takes each
one away. `register_routes` reports any missing name through `ctx.health`.

| Name | Built-in use | Without it | Seam Kiro Crew needs |
|---|---|---|---|
| `kiro_crew.config.loader.config_dir`, `kiro_crew.hidden_leaf_staging.publish_through_auth_store_staging` | the keystone provider-secret store and the autonomy ceiling (`secrets.py:47-48`, `policy_store.py:34-35`) | no secret is read or written and no ceiling is read: those routes answer 503 `host_unsupported` | an app-scoped keystone store on the context: write-only through the owner gate, readable only by the app's in-gateway code, hidden (secrets) or read-only (ceiling) to every agent sandbox, declared by the manifest rather than named in core (gap 1) |
| `kiro_crew.sandbox.{SandboxUnavailableError, create_subprocess_limited, sandboxed_spawn_argv, sandboxed_spawn_argv_async, run_limited}` | every `git` child of the ledger sync, the `gh` CLI of the GitHub Issues adapter and the schedule-file login probe (`ledger_sync.py:55-60`, `providers/github_issues.py:43`, `providers/schedule_file.py:59`) | no subprocess: the stand-ins raise the class the app already catches, so sync reports itself unavailable and the adapter is not configured | an app-scoped sandboxed subprocess on the context (`ctx.subprocess.spawn(argv, env=..., mode=...)`) |
| `kiro_crew.platform_compat.{acquire_lock, release_lock, file_lock, open_create_or_existing, chmod_safe, kill_and_reap}` | the cross-process locks and owner-only creates of every store (`store.py:33`, `ledger.py:38`, `secrets.py:45`, `policy_store.py:32`, `providers/__init__.py:20`), the `gh` child reaper (`providers/github_issues.py:42`) | no locked write and no child | none beyond a stable name: the App Kit already names `platform_compat` as the module apps route platform decisions through; listed so the table is complete |
| `kiro_crew.atomic_write.atomic_write`, `kiro_crew.owner_only_files.{ensure_directory, owner_only_opener_for}` | every store write and the owner-only data directory (`store.py:62`, `ledger.py:47-48`, `ledger_index.py:47`, `providers/__init__.py:23`) | no write | a public file helper in the SDK (atomic owner-only publish, owner-only directory) |
| `kiro_crew.security.iter_credential_matches` | the credential scan of the ledger before a push to the team remote (`ledger_sync.py:641`; the built-in moved from `get_credential_patterns` to this linear scan in KiroCrew #31445) | no push | a findings call on the scrub seam (`ctx.scrub.findings(text)`: what would be removed, without the text) |
| `kiro_crew.validation.sanitize_json_values` | the hidden-character pass over the decoded `body_json` of an agent tool call, before the redaction pass (the core tool's `mcp_tools/apps.py:685`) | an agent call with a body answers 503 `host_unsupported`; nothing is dispatched | the hidden-character sanitizer on the scrub seam (`ctx.scrub.sanitize(value)`) |
| `kiro_crew.webhook_sources.source_refusal` and `SOURCE_OPS_MISSION_CONTROL` | the `webhooks` governance scope asked before a signed delivery is verified (`providers/webhook.py:43`, `:349`) | every delivery is refused ("webhooks governance unavailable ... (fail-closed)"); the source id is now the app's own name, the same string | a generic per-app webhook source in the governance scope, keyed on the app's name instead of a core constant (gap 4) |
| `kiro_crew.platform.admission.{evaluate_admission, load_admission_policy, seed_default_policy}` | signed admission of a provider companion package (`companion.py:62-66`) | no companion is loaded | admission of an app's own entry-point group on the context |
| `kiro_crew.apps.manager.is_app_enabled` | the notification push gate (`notify_out.py:77`, `:292`) | no notification | none once every push comes from a served route (they all do here); an `enabled` read on the context otherwise |
| `kiro_crew.notifications.bus.{NotificationPayload, NotificationValidationError}` | the in-process push onto the local notification bus (`notify_out.py:79`) | no notification | an app-scoped notification producer on the context over the manifest's declared channels (gap 3) |
| `kiro_crew.cron.CronStoreUnreadable` | the refusal a broken cron store raises during a rotation arm (`http_routes/configuration.py:37`) | never raised (no cron service is reached without the gateway state) | part of the cron seam in gap 3 |
| `kiro_crew.vector_memory.VectorMemoryStore`, `kiro_crew.config.loader.KiroCrewConfig`, `kiro_crew.config.memory_sections.memory_writes_off_key`, `kiro_crew.embeddings.{PRIORITY_INTERACTIVE, EmbeddingWork, embedding_work}` | the ledger's projection into the host's memory store and semantic recall at dispatch (`dispatch.py:237-244`, `routes.py:235-237`) | no semantic recall and no indexing; fingerprint matches and hygiene run as before (the built-in's documented "no store" state) | an app-scoped vector index on the context (gap 9) |

## The gateway's dashboard state, read as the built-in read it

These come off `request.app["state"]` (the gateway's own application, which
the registry hands every route), each feature-detected where it is read, as in
the built-in. None is an App Kit seam (gap 3).

| State | Built-in use | Without it |
|---|---|---|
| `state.get_slot` | an incident's live slot status on the board (`http_routes/board.py:74-75`), and the Slack thread link (`slack_out.py:370`) | the board shows no slot state; no reply link |
| `state.slack_client` | posting and updating the incident board in Slack over the connection Kiro Crew already has (`slack_out.py:147`, `http_routes/_shared.py:148`) | Settings says Slack is unavailable; nothing is posted |
| `state.link_slack` | registering an incident's Slack thread with the session map, so a reply steers the investigation (`slack_out.py:365`, `http_routes/lifecycle.py:133-141`) | `slack_thread_replyable: false`, as the route already reports |
| `state.notification_bus`, `state.notification_rate_limiter` | the local notification channels (`notify_out.py:140`, `:334`) | `notify` status says no bus; nothing is pushed |
| `state.crons` | `POST /rotation/arm` arms and disarms this app's crons (`http_routes/configuration.py:843-844`) | 503 `cron_service_unavailable`, as before |

## Remaining gaps

1. **Core names the app's two secret files.** The provider secrets and the
   autonomy ceiling stay at `ops_mission_control_secrets.json` and
   `ops_mission_control_policy.json` because Kiro Crew's sandbox and sensitive
   path floor name exactly those leaves (`sandbox_leaves.py:407-408`,
   `security/paths_lists.py:605`, `:619`, `:837`, `:864`, `:952`, `:1041`,
   `sandbox_aliases.py:122`, `:149`, `security_posture.py:1206`, `:1282-1283`,
   `security_posture_sinks_delivery.py:25`, `:614-680`, `aws_consent.py:30`).
   That is what keeps a token unreadable to the agent and the ceiling unwritable
   by it. Moving them would drop that protection, so they must not move until
   the store in the first row of the table above exists; removing those rows
   from core first would expose them. The secret half has a seam in review:
   `credentialMasks` (KiroCrew #32652, App Kit level 3, not merged) masks files
   under the app's own `data/` only, so the store must first move to
   `apps/ops-mission-control/data/` with a migration that keeps every token
   (KiroCrew #32681, which moves the wheel copy and keeps the root name masked as a
   retired leaf). This copy must then read the same new path, carry the same
   migration for a record adopted from an older wheel, and declare
   `"credentialMasks": ["secrets.json"]`; until #32652 merges none of that can be
   written against a real host. The policy ceiling is a READONLY leaf (the agent
   may read it, never write it), which a mask does not express, so it needs its
   own seam.
2. **The agent's API tool is still core's.** This copy declares
   `ops_mission_control_api` in `agentTools` and serves it at `POST /agent-tools`
   with the allowlist and the channel-agent hold, but Kiro Crew still ships the core
   tool (`mcp_tools/apps.py` `TOOL_APPS`, descriptor and handler;
   `validation_parts/app_schemas.py`; `validation.py`;
   `validation_parts/server_registries.py`; the internal path table
   `dashboard/server_internal_paths.py`; `channel.py`
   `CHANNEL_AGENT_BLOCKED_DISPATCH_OPERATION`), and the core name wins, so every call
   is still the core's. Dropping those rows is a Kiro Crew change that needs:
   - **the wheel copy on the same seam first.** Existing users run the built-in until
     their record is adopted, so the wheel `app.json` must declare the same block and
     the wheel backend must serve `POST /agent-tools` before the core tool goes.
     `/api/app-tools/call` reaches an in-gateway app only through `RouteRegistry`, and
     the wheel copy mounts its routes on the gateway router directly
     (`"backend": {"routes": ...}`), so the wheel copy must move to `hooks.routes` (or
     the seam must reach a built-in's router routes). E9 is not in the way: `agentTools`
     is not a permission, and this copy's `permissions` equal the wheel's.
   - **listing an adopted app's tools.** `apps/app_agent_tools.py` lists only a
     first-party app, read from its SHIPPED `app.json`, and after adoption the wheel
     copy is released (`execution.shipped_builtin_app_root` returns `None`), so an
     adopted record lists nothing: the SOPs and crons would lose their only API path.
     Kiro Crew needs a decision (app-kit-platform.md section 30.1 calls it a
     maintainer's) on listing an adopted former built-in's declared tools, for example
     from the tree at its adoption pin, or behind a per-call approval.
   - **a verified caller on the forwarded call.** The channel-agent hold here reads the
     `X-Session-Key` the gateway's MCP client sends (the lenient resolver), while core's
     deny reads the strict resolver (`require_strict_session_key`). A channel agent's
     key is injected by the gateway, so both refuse it, and an unresolvable caller is
     let through by both; but the header is not a documented App Kit contract. Before `channel.py` drops its
     row, `/api/app-tools/call` should hand the app a gateway-verified caller kind (or
     the manifest should be able to declare a per-operation channel-agent deny).
   - the tool's title row in `data/mcp_tool_titles.json` stays until the app leaves
     (a remote session's whole-server grant is expanded from it).
3. **Dashboard internals.** The five state objects above (chat slot status, the
   Slack client and session linker, the notification bus and limiter, the cron
   service with its unreadable-store refusal) have no seam. Generic seams would
   be: a read-only status of the app's own slots, a host Slack connection client
   scoped to the app with a thread-to-slot link, an app notification producer
   over its declared channels, and `ctx.cron` with an async listing of the app's
   own jobs and the store-unreadable refusal (its current synchronous listing
   refuses on the event loop and has no such refusal).
4. **Webhook source.** `webhook_sources.py:10`, `:32` and the governance catalog
   (`platform/governance_parts/catalog.py:183`) name this app as a source. The
   source id is the app's name, so a generic rule keyed on the app name keeps
   every existing policy working.
5. **Adoption is refused while core names the app.** `builtin_adoption_checks.core_named_apps()`
   collects `TOOL_APPS` and `webhook_sources`, and `pinned_tree_refusal` answers
   `pinned_feature_unsupported` for any app in it. Gaps 2 and 4 must close before an
   adoption pin for this app can apply.
6. **The skill ships twice while the built-in does.** Kiro Crew copies
   `builtin_skills/ops-mission-control/` into the data home at every start
   (`apps/bridges_skills.py:72`, `:176`); this copy links its own at
   `skills/ops-mission-control/ops-mission-control/`. The release that adopts
   this app must stop shipping the core copy.
7. **Execution trust.** A built-in's in-gateway Python is exempt from the
   third-party execution gate; this copy's hooks load only when the operator
   trusts it. Adoption writes that grant for an existing user's record.
8. **Audit attribution.** Rows move from caller `core:ops-mission-control` to
   `app:ops-mission-control` and their operation gains the app prefix
   (`ops-mission-control.secret_put`). A SEL query or alert keyed on the old
   caller needs the new one.
9. **Vector index.** The ledger's semantic recall writes into the host's memory
   store through `VectorMemoryStore`, a private class. The embedder is the
   level-1 `ctx.embed`, but the store, its write gate and the deadline-bounded
   query embed are private; an app-scoped vector index seam would remove them.
10. **Styles.** The page keeps the built-in's Tailwind utility class strings and
    reads the dashboard's CSS custom properties. They render because the
    dashboard's stylesheet carries them while the compiled built-in ships.
11. **Store listing localization.** The catalog's publish step does not carry
    `l10n` yet, so a store row that is not installed shows English.
12. **Sidebar icon on a fresh install.** The `Radio` glyph and the
    `/ops-mission-control` route are shown only for an adopted record (from Kiro
    Crew's pin). A fresh install lives at `/apps/ops-mission-control` with the
    `iconPath` image.
13. **Built-in-only references left in core.** Beyond gaps 1, 2, 4 and 6:
    `apps/builtins/__init__.py:15` (`BUILTIN_NAMES`),
    `website/src/apps/builtinRegistry.ts:71`, `website/src/shell/nav/navRow.tsx:286`,
    `website/src/components/appstore/appManifest.ts:304`, the
    `apps.opsMissionControl.*` catalog keys, `setup.cfg:582-583`, `:627-628`,
    `scripts/docs_lint.py:309-367`, `builtin_skills/security-conductor/golden-paths.json:406`, `:413`,
    `metrics/feature_usage.py:207`, `vector_memory_runtime/write_outcomes.py:63`,
    `git_tmp_packs.py:16`, `docs/apps.md:83`, `docs/skills.md:53` and the spec
    `docs/system-specs/modules/ops-mission-control.md`. They go when the
    built-in does.

## UI

The page is `ui/src/`, ported from `website/src/apps/ops-mission-control/`
with the same markup, class strings and behaviour. `npm run build` in `ui/`
writes the committed `ui/dist/index.mjs`; CI rebuilds it and fails on a
difference. Every request goes through the host's scoped client
(`useAppApi().raw`, bound once by the page root), so a path outside
`permissions.api` is refused in the browser; the backend's `error` sentence and
`code` are read back out of the client's refusal, as the dashboard's `fetch`
gave the built-in page. Strings are `t()` over `ui/i18n/<locale>.json` for all
12 dashboard locales, under the dashboard's own key paths
(`apps.opsMissionControl.*`), plural forms by `Intl.PluralRules`.

| Built-in | Here |
|---|---|
| plain same-origin `fetch` to `/api/apps/ops-mission-control/*` (`api.ts:1091`) | `ui/src/api.ts` over the scoped client (`ui/src/appApi.ts`) |
| `IncidentChat` mounting its own `AppScopedApiProvider` around `app-sdk/ChatEmbed` (`IncidentChat.tsx:26-27`) | `ChatEmbed` from `@kirocrew/app-sdk`, under the scoped layer AppHost mounts from the manifest's grants |
| `components/ui` (`Badge`, `Btn`, `Card`, `CardTitle`, `EmptyState`, `PageHeader`, `StatCard`, `Input`, `SendBtn`, `Toggle`), `components/SegmentedControl`, `components/ErrorNotice` | the same components from `@kirocrew/app-sdk/ui` |
| `components/SimpleSelect` | `Select` from `@kirocrew/app-sdk/ui`, feature-detected (`ui/src/hostSdk.ts`; a native `<select>` on an older host) |
| `hooks/useImeGuard` | `useImeGuard` from `@kirocrew/app-sdk` |
| `i18n/format.{fmtUnit, fmtDateFields}` | `ui/src/format.ts`, over the SDK's `fmtNumber` and `activeLocale` |
| `lib/safeUrl.safeHttpUrl` | `ui/src/safeUrl.ts`, copied |
| `utils/clipboard.copyToClipboard` | `ui/src/clipboard.ts`: the async clipboard API, else `execCommand('copy')`; it drops the dashboard's embedded-pane relay |
| `lib/basePath.withBase` for the embed's navigation, later `utils/errorReport.hardNavigate` (KiroCrew #31314, an exit from an app pop-out goes to the main window) | the host's own navigation (AppHost's provider); in an app pop-out the frame's pinned navigator (`pages/AppPopoutFrame.tsx`) forwards an exit to the main window, so the fix is the host's |
| `i18n/t.i18nT` with keys in the dashboard's catalogs | `ui/src/i18n.ts` over the app's own catalogs |

## Tests

| Built-in test | Here | Change |
|---|---|---|
| the 38 modules and two helpers of the built-in's `tests/` | `tests/`, same names | Module paths are `backend.*`. `tests/conftest.py` pins the data home, the workspace and git's global config, and binds a context with the host's real `ScrubSDK`, `AuditSDK` and `EmbedSDK` and its real owner gate; `tests/harness.py` serves `register_routes(ctx)` the way the registry does. Kiro Crew (one pinned public commit) is a test dependency, so the sandbox, the keystone staging, the cron service, the notification bus and the vector store are the real ones. The `_require_enabled` cases (`test_routes.py::TestEnabledGate`, the composition contract's `TestTheEnableGateAnswersFirst` and its `is_app_enabled` seam row) became `TestRegistrationIsTheHooksRoutesContract`; the frozen route table lost its `HEAD` twins; the packaging cases (`setup.cfg` globs, `BUILTIN_NAMES`, `builtinRegistry.ts`) became checks on this tree; the skill and spec paths point here; two log captures name the app's `backend` logger; the notification deep link is the AppHost route. |
| `test/test_omc_ledger_sync_coverage.py`, `test/test_ops_mission_control_sop_facts.py` | `tests/`, same names | Paths point at this tree. |
| `website` tests (9 files) | `ui/tests/`, same names | Run by vitest with SDK stand-ins (`ui/tests/stubs/`) carrying the host components' roles and test ids; no Redux store or router. The tab switch clicks the segment radio (the stand-in does not collapse to a dropdown), the source picker sets the native `<select>`'s value, a language switch goes through the SDK stand-in, and the IncidentChat cases that tested the dashboard's own scoped provider (its navigate and notify defaults) became a check that the manifest grants the embed's APIs. |
| `website/playwright/ops-mission-control.spec.ts` | `ui/e2e/ops-mission-control.spec.ts` | The page is `/apps/ops-mission-control` and the record is not a built-in. Runs against a live, isolated gateway with this repository installed (`npm run e2e`); CI does not boot one. |
| `test_webhook_governance.py`, `test_notify_clip.py`, `test_github_issues_stderr_excerpts.py`, `test_masked_leaf_staged_publish.py` (carved out of core tests into the built-in's `tests/` by KiroCrew #30061) | `tests/`, same names | Module paths are `backend.*`; the staged-publish case covers this app's two leaves only. |
| `website/src/test/bootRequests.test.ts`'s Ops Mission Control row (moved to `settingsStaleTime.test.ts` by #30061) | `ui/tests/settingsStaleTime.test.ts` | Reads `ui/src/SettingsPanel.tsx`. |
| (none) | `tests/test_agent_tool_route.py` | The `agentTools` declaration parses on the host and matches the core tool (description, arguments, enums, allowlist, query rule, body cap, title, result cap, channel hold); every refusal lands before a handler; every allowed call answers as its direct route; the body is sanitized and redacted; a channel agent cannot arm the rotation and keeps the reads; a validated call reaches the route through the host's `/api/app-tools/call` and `RouteRegistry`. |
| (none) | `tests/test_no_host_imports.py`, `tests/test_host_stand_ins.py`, `tests/test_manifest_contract.py` | The pinned host table and that each name exists on the pinned Kiro Crew; every stand-in and seam failing closed; manifest parity with the built-in, the bundle's imports, the hook loading through the gateway's module loader, no hardcoded model id, an adoptable tree. |

Core tests that use `ops-mission-control` only as a sample app name, slot key
or table row (governance, the MCP tool's own coverage, sandbox masks, internal
paths, channel tools and the other rows of gap 13) stay in Kiro Crew and
follow the gaps above.

## Synced with the wheel copy

Every change to the built-in since `55439d8770`, up to KiroCrew `main` `6d07df11cf`:

| KiroCrew | Built-in change | Here |
|---|---|---|
| #31445 | the pre-push ledger scan uses `security.iter_credential_matches` (linear on a long line) instead of the raw patterns | `backend/ledger_sync.py` through `_host.iter_credential_matches`; the coverage and git tests carry the change and the new linear-scan case |
| #32049 | Refresh (Handover) and Poll now (Signals) use `aria-disabled` plus a guard, so a keyboard user keeps focus | `ui/src/HandoverPanel.tsx`, `ui/src/SignalsPanel.tsx`, the two focus cases |
| #31314 | an incident chat exit in an app pop-out goes to the main window | the host's (UI table above) |
| #30061 | core tests that pinned the app moved into its `tests/` | ported (Tests table) |
| #31715, #32660 | spec wording about the core tool | `docs/spec.md` is the spec at `6d07df11cf` |

## What Kiro Crew keeps doing

The release that adds adoption still ships the built-in. A user's built-in
record moves onto this repository at the commit Kiro Crew pins; a record that
cannot move keeps running the built-in copy, unchanged. For this app the pin
waits on gaps 2 and 4 (gap 5), and the core copy of the skill must stop
shipping in that release (gap 6).

## Release handoff: one commit for both pins

The adoption pin and the catalog row must name the same commit, and that
commit must be the ported tree.

1. Call the full 40-hex SHA of this repository's `main` `C`
   (`git rev-parse HEAD`).
2. In the Kiro Crew release PR that adds adoption, once gaps 2 and 4 are
   closed, run `python3 scripts/adoption_pin.py compute <this URL> C` and add
   the row it prints to `src/kiro_crew/apps/adoption-pins.json`; then
   `python3 scripts/adoption_pin.py verify`.
3. The KiroCrewApps row for `ops-mission-control` switches to `"type": "git"`,
   this URL, `"ref": "C"`. Never a branch name or a placeholder.
4. Check that both files name the same `C`, and that GitHub serves it: in a
   fresh clone, `git fetch origin C` succeeds and `git cat-file -t C` prints
   `commit`.
5. The catalog PR stays a draft, labelled hold-for-release, until the Kiro Crew
   release that ships adoption and the App Kit level-1 seams is published.
