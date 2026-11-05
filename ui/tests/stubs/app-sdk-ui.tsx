/**
 * A light stand-in for the host's `@kirocrew/app-sdk/ui`, at App Kit level 1:
 * plain elements with the roles and labels the host components render, so a
 * test can find them the way a user would.
 */

import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import type { SelectProps } from '@kirocrew/app-sdk/ui'

type Loose = { className?: string; children?: ReactNode; [prop: string]: unknown }

export const Btn = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; primary?: boolean }
>(function Btn({ danger: _danger, primary: _primary, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} {...rest} />
})

export const SendBtn = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function SendBtn({ type = 'button', ...rest }, ref) {
    return <button ref={ref} type={type} {...rest} />
  },
)

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return <input ref={ref} {...props} />
  },
)

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest}>{children}</div>
}

export function CardTitle({ children }: Loose) {
  return <h2>{children}</h2>
}

export function ContentSkeleton() {
  return <div role="status" aria-busy="true" />
}

/** The host's stat card, with the host's own test ids. */
export function StatCard({ label, value }: Loose) {
  return (
    <div data-testid="stat-card">
      <div data-testid="stat-card-label">{label as ReactNode}</div>
      <div data-testid="stat-card-value">{(value as ReactNode) ?? '—'}</div>
    </div>
  )
}

/** The host's empty state, with the host's own test ids (`testId`, default `empty-state`). */
export function EmptyState({ title, subtitle, action, testId = 'empty-state' }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId}>
      <div data-testid={`${testId}-title`}>{title}</div>
      {subtitle ? <div data-testid={`${testId}-subtitle`}>{subtitle}</div> : null}
      {action ? <div data-testid={`${testId}-action`}>{action}</div> : null}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: string; actions?: ReactNode }) {
  return (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  )
}

export function Clickable({ children, onClick, className, ...rest }: HTMLAttributes<HTMLElement> & Loose) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={onClick}
      onKeyDown={e => {
        // The host's Clickable activates on Enter and Space, like a button.
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ;(onClick as ((ev: unknown) => void) | undefined)?.(e)
        }
      }}
      {...(rest as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  )
}

export function InfoTip({ text }: { text: string }) {
  return <span title={text}>ⓘ</span>
}

export function ErrorNotice({ message, title, onDismiss }: { message?: string | null; title?: string; onDismiss?: () => void }) {
  if (!message) return null
  return (
    <div role="alert">
      {title ? <strong>{title}</strong> : null}
      {message}
      {onDismiss ? <button type="button" onClick={onDismiss}>Dismiss</button> : null}
    </div>
  )
}

export function Modal({ open, onClose, title, footer, children }: { open: boolean; onClose: () => void; title?: ReactNode; footer?: ReactNode; children?: ReactNode }) {
  // The host's dialog closes on an Escape anywhere in the window; so does this stand-in.
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
      <h2>{title}</h2>
      {children}
      {footer}
    </div>
  )
}

/** Stands in for the host's themed dropdown; marked so a test can tell it from the fallback. */
export function Select({ options, optionLabels, value, onChange, clearLabel, disabled, 'aria-label': ariaLabel }: SelectProps) {
  return (
    <select data-host-select="" aria-label={ariaLabel} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {clearLabel !== undefined || !options.includes(value) ? <option value="">{clearLabel ?? ''}</option> : null}
      {options.map((o, i) => (
        <option key={o} value={o}>
          {optionLabels?.[i] ?? o}
        </option>
      ))}
    </select>
  )
}

export const guideCaution = { 'data-guide-caution': '' } as const

/** Stands in for the host's Markdown view: the source text, so a test can read it. */
export function MarkdownRenderer({ content }: { content: string }) {
  return <div data-markdown="">{content}</div>
}

export function Badge({ children, variant: _variant, ...rest }: { variant: string; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest}>{children}</span>
}

/** The host's switch: `role="switch"` named by `label`, toggled by click or Space/Enter. */
export function Toggle({ checked, onChange, disabled, label, describedBy }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string; describedBy?: string }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={label}
      aria-describedby={describedBy}
      tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) onChange(!checked) }}
      onKeyDown={e => { if (!disabled && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onChange(!checked) } }}
    />
  )
}

/** The host's segmented control: a radio group, one `role="radio"` per segment. */
export function SegmentedControl<T extends string = string>({ segments, value, onChange, ariaLabel }: { segments: { key: T; label: string; count?: number; disabled?: boolean; tooltip?: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; ariaLabel?: string; [prop: string]: unknown }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      {segments.map(s => (
        <button
          key={s.key}
          type="button"
          role="radio"
          aria-checked={s.key === value}
          aria-disabled={s.disabled || undefined}
          title={s.tooltip}
          onClick={() => { if (!s.disabled) onChange(s.key) }}
        >
          {s.icon}
          {s.label}
          {s.count !== undefined ? <span>{s.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
