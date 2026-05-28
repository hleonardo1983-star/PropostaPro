// Cache simples em memória para evitar queries repetidas
let tenantCache: { tenantId: string; plan: string; isMaster: boolean } | null = null
let tenantCacheTime = 0
const TENANT_TTL = 60000 // 1 minuto

export function clearTenantCache() {
  tenantCache = null
  tenantCacheTime = 0
}

export async function getTenantData(supabase: any) {
  if (tenantCache && Date.now() - tenantCacheTime < TENANT_TTL) {
    return tenantCache
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, is_master, tenants(plan)')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  tenantCache = {
    tenantId: profile.tenant_id,
    plan: (profile.tenants as any)?.plan || 'free',
    isMaster: profile.is_master || false,
  }
  tenantCacheTime = Date.now()
  return tenantCache
}
