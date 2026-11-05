/**
 * IncidentChat — the live investigation panel on an ops incident row.
 *
 * The embed is the host's `ChatEmbed`, under the permission-scoped layer AppHost
 * mounts above the bundle from the manifest's grants. What this component owns is
 * asserted here: the slot it binds, the placeholder, the composer cap against the
 * fixed box, the header copy, and that the manifest grants BOTH `/api/chat*` (what
 * the embed polls and posts) and `/api/approvals*` (what a tool card's Approve
 * button calls — omit it and the button fails silently). ChatEmbed itself is
 * replaced by a probe that records its props, so no polling happens.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { i18nT } from '../src/i18n'
import IncidentChat, {
  INCIDENT_CHAT_BOX_HEIGHT_PX,
  INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX,
  incidentSlotKey,
} from '../src/IncidentChat'

const probeProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@kirocrew/app-sdk', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>()
  function ZzqChatEmbedProbe(props: Record<string, unknown>) {
    probeProps.current = props
    return <div data-testid="zzq-embed" />
  }
  return { ...mod, ChatEmbed: ZzqChatEmbedProbe }
})

const MANIFEST = JSON.parse(readFileSync(resolve(__dirname, '../../app.json'), 'utf-8')) as {
  name: string
  permissions: { api: string[]; events: string[] }
}

describe('incidentSlotKey', () => {
  it('namespaces the slot per incident', () => {
    expect(incidentSlotKey('zzq-42')).toBe('ops-mission-control-zzq-42')
  })
})

describe('IncidentChat', () => {
  it('mounts the embed against the incident slot with an ask placeholder', () => {
    render(<IncidentChat incidentId="zzq-42" />)
    expect(screen.getByTestId('zzq-embed')).toBeInTheDocument()
    expect(probeProps.current.slotKey).toBe('ops-mission-control-zzq-42')
    expect(probeProps.current.placeholder).toBe(
      i18nT('apps.opsMissionControl.incidentChat.ask_about_incident', { incidentId: 'zzq-42' }),
    )
  })

  it('caps the composer below the shared default so the transcript keeps most of the box', () => {
    // The panel is a fixed-height box. Left at the embed's shared 240px cap, a
    // long draft would claim more than half of it and squeeze the agent's
    // findings to a few lines. The cap is a proportion of the box and the box
    // reads its height from the same module, so neither can move alone.
    render(<IncidentChat incidentId="zzq-42" />)
    expect(probeProps.current.composerMaxHeight).toBe(INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX)
    expect(INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX).toBeLessThan(240)
    // At the maxed-out draft, at least ~240px of the box is still transcript.
    expect(INCIDENT_CHAT_BOX_HEIGHT_PX - INCIDENT_CHAT_COMPOSER_MAX_HEIGHT_PX).toBeGreaterThanOrEqual(240)
    const box = screen.getByTestId('zzq-embed').parentElement?.parentElement as HTMLElement
    expect(box.style.height).toBe(`${INCIDENT_CHAT_BOX_HEIGHT_PX}px`)
  })

  it('is granted the chat AND approvals APIs the embed calls, by the manifest', () => {
    expect(MANIFEST.permissions.api).toEqual(
      expect.arrayContaining([
        '/api/chat',
        '/api/chat/*',
        '/api/approvals',
        '/api/approvals/*',
        `/api/apps/${MANIFEST.name}`,
        `/api/apps/${MANIFEST.name}/*`,
      ]),
    )
    expect(MANIFEST.permissions.events).toEqual(['slots', 'notification'])
  })

  it('appends the incident title to the header when one is known', () => {
    render(<IncidentChat incidentId="zzq-42" title="zzq disk pressure" />)
    expect(
      screen.getByText(
        i18nT('apps.opsMissionControl.incidentChat.live_investigation_header', {
          incident: 'zzq-42',
          title: ' — zzq disk pressure',
        }),
      ),
    ).toBeInTheDocument()
  })

  it('renders the header without a title suffix when none is known', () => {
    render(<IncidentChat incidentId="zzq-42" />)
    expect(
      screen.getByText(
        i18nT('apps.opsMissionControl.incidentChat.live_investigation_header', {
          incident: 'zzq-42',
          title: '',
        }),
      ),
    ).toBeInTheDocument()
  })

  it('mounts and unmounts cleanly', () => {
    const { unmount } = render(<IncidentChat incidentId="zzq-42" />)
    expect(() => unmount()).not.toThrow()
  })
})
