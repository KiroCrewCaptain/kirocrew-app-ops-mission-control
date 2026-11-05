/**
 * The two dashboard formatters the page uses that the App Kit SDK does not export,
 * restated over the SDK's own `fmtNumber` and `activeLocale` so they render in the
 * host's active language, exactly as the built-in's `i18n/format` helpers did.
 */
import { activeLocale, fmtNumber, type NumberOptions } from '@kirocrew/app-sdk'

export type FormatUnit = 'second' | 'minute' | 'hour' | 'day'

/** A quantity with a narrow unit (`5s`, `3 h`); never broken between number and unit. */
export function fmtUnit(value: number, unit: FormatUnit, options?: NumberOptions): string {
  if (!Number.isFinite(value)) return '—'
  return fmtNumber(value, { style: 'unit', unit, unitDisplay: 'narrow', ...options }).replace(/ /g, '\u00A0')
}

export type DateFieldOptions = Omit<Intl.DateTimeFormatOptions, 'dateStyle' | 'timeStyle'>

/** Below this a number is epoch SECONDS, as the dashboard's `toDate` reads it. */
const SECONDS_CEILING = 1e11

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    const d = new Date(value < SECONDS_CEILING ? value * 1000 : value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** A date rendered from explicit fields (`{ hour: '2-digit', minute: '2-digit' }`). */
export function fmtDateFields(value: Date | string | number | null | undefined, options: DateFieldOptions): string {
  const d = toDate(value)
  if (!d) return '—'
  let locale = 'en'
  try {
    locale = activeLocale() || 'en'
  } catch {
    // An older host without the locale reader formats in English.
  }
  return new Intl.DateTimeFormat(locale, { localeMatcher: 'lookup', ...options }).format(d)
}
