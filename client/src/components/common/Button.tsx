import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost' | 'light' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide whitespace-nowrap select-none transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-rose text-white hover:bg-rose-dark shadow-[0_8px_20px_-10px_rgb(183_110_121/0.8)]',
  dark: 'bg-ink text-ivory hover:bg-ink-soft',
  outline: 'border border-ink/80 text-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink hover:bg-blush/60',
  light: 'bg-white/95 text-ink hover:bg-white backdrop-blur',
  link: 'h-auto! px-0! text-ink underline-offset-4 hover:text-rose underline',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-[15px]',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, cn(fullWidth && 'w-full', className))}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', fullWidth, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, cn(fullWidth && 'w-full', className))} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'solid' | 'outline'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-40',
        size === 'sm' && 'size-9',
        size === 'md' && 'size-11',
        size === 'lg' && 'size-12',
        variant === 'ghost' && 'text-ink hover:bg-blush/70',
        variant === 'solid' && 'bg-white text-ink shadow-soft hover:bg-ivory',
        variant === 'outline' && 'border border-line text-ink hover:border-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
