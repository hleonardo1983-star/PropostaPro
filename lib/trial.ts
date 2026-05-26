import { createClient } from '@/lib/supabase/client'

/**
 * Verifica se o trial de 14 dias expirou para o tenant do usuário logado.
 * Retorna true se o plano for 'free' e a conta tiver mais de 14 dias.
 */
export async function checkTrialExpired(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenants(plan, created_at)')
    .eq('id', user.id)
    .single()
  if (!profile) return false
  const tenant = profile.tenants as any
  const plan = tenant?.plan || 'free'
  if (plan !== 'free') return false
  const created = new Date(tenant?.created_at || user.created_at)
  const trialEnd = new Date(created.getTime() + 14 * 86400000)
  return Date.now() > trialEnd.getTime()
}
