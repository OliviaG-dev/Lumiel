import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerSolid'

export type ButtonSizeOption = 'md' | 'sm'

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function lumielButtonClassName(opts: {
  variant?: ButtonVariant
  size?: ButtonSizeOption
  pill?: boolean
  block?: boolean
  grow?: boolean
  className?: string
}) {
  const { variant, size = 'md', pill, block, grow, className } = opts
  const variantClass =
    variant === 'dangerSolid'
      ? 'lumiel-btn--danger-solid'
      : variant
        ? `lumiel-btn--${variant}`
        : ''
  return cn(
    'lumiel-btn',
    variantClass,
    size === 'sm' && 'lumiel-btn--sm',
    pill && 'lumiel-btn--pill',
    block && 'lumiel-btn--block',
    grow && 'lumiel-btn--grow',
    className,
  )
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSizeOption
  pill?: boolean
  block?: boolean
  grow?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = 'md', pill, block, grow, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={lumielButtonClassName({ variant, size, pill, block, grow, className })}
      {...props}
    />
  )
})

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSizeOption
  pill?: boolean
  block?: boolean
  grow?: boolean
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, size = 'md', pill, block, grow, className, ...props },
  ref,
) {
  return (
    <Link
      ref={ref}
      className={lumielButtonClassName({ variant, size, pill, block, grow, className })}
      {...props}
    />
  )
})
