/**
 * IncidentChat — watch the agent work an incident, and talk to it.
 *
 * The dispatch heartbeat spawns one chat slot per incident and starts the
 * investigation inside it. Without this panel that conversation is invisible from
 * the board: you can see an incident sitting in `investigating` but not what the
 * agent has actually found, and you cannot answer it when it asks. This mounts
 * the host's real chat renderer (the SDK's `ChatEmbed`) against that slot, so
 * tool activity, streaming, and markdown all render exactly as they do in the
 * main chat.
 *
 * `ChatEmbed` reads `useAppApi()`, and the host page (AppHost) mounts that
 * permission-scoped layer above this bundle from the manifest's grants:
 * `/api/chat*` is what the embed polls and posts; `/api/approvals*` is what the
 * Approve/Trust buttons on a tool card call — omit it and those buttons fail with
 * no visible error. Both are declared in `app.json`.
 *
 * The slot key must match what the dispatch SOP names, or the panel renders an
 * empty conversation next to a live one.
 */
import { ChatEmbed } from '@kirocrew/app-sdk'
import { i18nT } from './i18n'

/**
 * The panel's fixed box height and the composer's auto-grow cap, together.
 *
 * The embed's composer grows with the draft up to a cap; its shared default
 * (240px) is sized for a full-height page. In this 420px box that cap lets a
 * long draft claim more than half the panel and squeezes the transcript to a
 * few lines -- the agent's findings scroll out of view exactly when the user is
 * writing a long answer. The cap is therefore a proportion of the box (~38%),
 * which keeps at least ~240px of transcript at the maxed-out draft. Both live
 * here, and the box reads its height from the constant, so the box cannot be
 * resized without the cap being reconsidered beside it.
 */
export const INCIDENT_CHAT_BOX_HEIGHT_PX = 420
export const INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX = 160

/** Slot key convention shared with the dispatch SOP: one slot per incident. */
export function incidentSlotKey(incidentId: string): string {
  return `ops-mission-control-${incidentId}`
}

export default function IncidentChat({
  incidentId,
  title,
}: {
  incidentId: string
  title?: string
}) {
  return (
    // Fixed-height flex column, and `min-h-0` on the growing child.
    //
    // ChatEmbed scrolls via `h-full` + an inner `flex-1 overflow-y-auto`, so it
    // only scrolls when an ANCESTOR bounds its height. Nesting it under an
    // auto-height div breaks that chain: the transcript grows without limit, the
    // input row is pushed off the bottom of the incident row, and a long
    // investigation becomes unreadable AND unanswerable. `min-h-0` is required
    // too — a flex child's default `min-height: auto` refuses to shrink below its
    // content, which silently defeats the overflow.
    <div
      className="mt-2 border-t border-border pt-2 flex flex-col"
      style={{ height: INCIDENT_CHAT_BOX_HEIGHT_PX }}
    >
      <p className="text-[12px] text-muted mb-2 shrink-0">
        {i18nT('apps.opsMissionControl.incidentChat.live_investigation_header', {
          incident: incidentId,
          title: title ? ` — ${title}` : '',
        })}
      </p>
      <div className="flex-1 min-h-0">
        <ChatEmbed
          slotKey={incidentSlotKey(incidentId)}
          placeholder={i18nT('apps.opsMissionControl.incidentChat.ask_about_incident', { incidentId })}
          composerMaxHeight={INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX}
        />
      </div>
    </div>
  )
}
