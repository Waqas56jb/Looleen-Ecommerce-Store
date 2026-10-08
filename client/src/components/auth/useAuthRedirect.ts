import { useSearchParams } from 'react-router-dom'

/** Safe post-auth destination from `?redirect=` (internal paths only), else /account */
export function useAuthRedirect(fallback = '/account'): string {
  const [params] = useSearchParams()
  const r = params.get('redirect')
  return r && r.startsWith('/') && !r.startsWith('//') ? r : fallback
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name
