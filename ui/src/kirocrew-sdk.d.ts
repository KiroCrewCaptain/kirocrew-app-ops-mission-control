/**
 * Types for the two host modules this bundle imports. They are not on npm: the
 * dashboard's import map serves them at runtime (`/vendor/*.mjs`), so only the
 * names this app uses are declared, with the shapes the App Kit documents.
 * Component props are declared as loosely as the call sites need: the host owns
 * the components, and a prop it does not know is ignored at runtime.
 *
 * A name a host added at App Kit level 1 is typed `| undefined` here. That keeps
 * every use of it behind the feature check in `hostSdk.ts`: an older host's
 * module has no such export, and a NAMED import of a missing export fails the
 * whole bundle at link time, so those names are read off a namespace import.
 * Every other name here is on a 0.12 host too, so it is named-imported where used.
 */

declare module '@kirocrew/app-sdk' {
  import type { ComponentType } from 'react'

  export interface AppApi {
    raw(path: string, init?: RequestInit): Promise<Response>
    request<T = unknown>(path: string, init?: RequestInit): Promise<T>
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>
    post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>
    put<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>
    del<T = unknown>(path: string, init?: RequestInit): Promise<T>
  }

  /** A scoped non-2xx: `body` is the raw response text. */
  export interface AppApiError extends Error {
    readonly status: number
    readonly body: string
  }

  export interface ImeGuard {
    /** Spread onto a text control so the guard tracks IME composition on it. */
    bindComposition<E extends HTMLElement = HTMLInputElement>(opts?: {
      onFocus?: () => void
      onBlur?: () => void
    }): Pick<
      import('react').HTMLAttributes<E>,
      'onCompositionStart' | 'onCompositionEnd' | 'onFocus' | 'onBlur'
    >
    /** In an Enter branch: true when this keypress is the user's Enter, not an IME's. */
    claimEnter(e: import('react').KeyboardEvent): boolean
    /** Spread onto an input: Enter calls `onEnter` unless an IME composition owns the key. */
    bindEnter<E extends HTMLElement = HTMLInputElement>(opts: {
      onEnter?: () => void
      onEscape?: () => void
      onBlur?: () => void
    }): Pick<
      import('react').HTMLAttributes<E>,
      'onKeyDown' | 'onCompositionStart' | 'onCompositionEnd' | 'onFocus' | 'onBlur'
    >
  }

  export type NumberOptions = Omit<Intl.NumberFormatOptions, 'localeMatcher'>

  export interface ChatEmbedProps {
    slotKey: string
    placeholder?: string
    composerMaxHeight?: number
  }

  export function useAppApi(): AppApi
  export function useImeGuard(): ImeGuard
  export function useLanguageGeneration(): number
  export function activeLocale(): string
  export function fmtNumber(value: number, options?: NumberOptions): string
  /** The host's chat transcript and composer, bound to one chat slot. */
  export const ChatEmbed: ComponentType<ChatEmbedProps>
}

declare module '@kirocrew/app-sdk/ui' {
  import type {
    ButtonHTMLAttributes,
    ComponentType,
    ForwardRefExoticComponent,
    HTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
    RefAttributes,
  } from 'react'

  type Loose = { className?: string; children?: ReactNode; [prop: string]: unknown }

  export const Btn: ForwardRefExoticComponent<
    ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; primary?: boolean } & RefAttributes<HTMLButtonElement>
  >
  export const SendBtn: ForwardRefExoticComponent<
    ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>
  >
  export const Input: ForwardRefExoticComponent<
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >
  export const Badge: ComponentType<
    { variant: 'ok' | 'err' | 'warn' | 'aim' | 'muted'; children: ReactNode } & Omit<
      HTMLAttributes<HTMLSpanElement>,
      'children' | 'dangerouslySetInnerHTML'
    >
  >
  export const Card: ComponentType<HTMLAttributes<HTMLDivElement> & Loose>
  export const CardTitle: ComponentType<Loose>
  export const StatCard: ComponentType<Loose>
  export const EmptyState: ComponentType<{
    icon: ReactNode
    title: string
    subtitle?: string
    action?: ReactNode
  } & Loose>
  export const PageHeader: ComponentType<{ title: ReactNode; subtitle?: string; actions?: ReactNode } & Loose>
  export const ErrorNotice: ComponentType<{
    message?: string | null
    className?: string
    title?: string
    onDismiss?: () => void
    askAgent?: boolean
    variant?: 'block' | 'inline'
  } & Loose>
  export const Toggle: ComponentType<{
    checked: boolean
    onChange: (v: boolean) => void
    disabled?: boolean
    label?: string
    describedBy?: string
    tone?: 'accent' | 'muted'
  }>

  export interface Segment<T extends string = string> {
    key: T
    label: string
    icon?: ReactNode
    count?: number
    tooltip?: string
    disabled?: boolean
  }
  export function SegmentedControl<T extends string = string>(props: {
    segments: Segment<T>[]
    value: T
    onChange: (value: T) => void
    layoutId?: string
    ariaLabel?: string
    ariaDescribedBy?: string
    wrap?: boolean
    collapse?: boolean
    compact?: boolean
    iconOnly?: boolean
  }): JSX.Element

  export interface SelectProps {
    options: string[]
    optionLabels?: string[]
    value: string
    onChange: (value: string) => void
    clearLabel?: string
    disabled?: boolean
    'aria-label'?: string
    title?: string
    className?: string
  }

  // Level 1 (read through hostSdk.ts only).
  export const Select: ComponentType<SelectProps> | undefined
}
