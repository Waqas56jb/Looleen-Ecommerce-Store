import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft shadow-card',
  accent: 'bg-rose text-white hover:bg-rose-dark shadow-card',
  secondary: 'bg-mist text-ink hover:bg-blush/70 border border-line',
  outline: 'border border-line bg-surface text-ink hover:bg-mist hover:border-ink/25',
  ghost: 'text-ink hover:bg-mist',
  danger: 'bg-error text-white hover:bg-[#8f3a3a] shadow-card',
  link: 'h-auto! px-0! text-rose underline-offset-4 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, cn(fullWidth && 'w-full', className))} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'xs' | 'sm' | 'md'
  variant?: 'ghost' | 'outline' | 'danger'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, size = 'md', variant = 'ghost', className, children, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-40 [&>svg]:size-4',
        size === 'xs' && 'size-7',
        size === 'sm' && 'size-8',
        size === 'md' && 'size-9',
        variant === 'ghost' && 'text-muted hover:bg-mist hover:text-ink',
        variant === 'outline' && 'border border-line bg-surface text-ink hover:bg-mist',
        variant === 'danger' && 'text-error hover:bg-error-soft',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
