/**
 * The host's scoped HTTP client.
 *
 * `useAppApi()` is a hook, but the page reaches the API from query functions,
 * mutations and timers as well as from render, through the `opsApi` object. The
 * root component therefore binds the client it got from the host once
 * (`bindAppApi`), and every request reads it back here. One page mounts one
 * bundle, so there is exactly one binding.
 */
import type { AppApi } from '@kirocrew/app-sdk'

let bound: AppApi | null = null

/** Called by the page root with `useAppApi()`. */
export function bindAppApi(api: AppApi): void {
  bound = api
}

export function currentAppApi(): AppApi {
  if (!bound) throw new Error('ops-mission-control: the host API is not bound yet')
  return bound
}
