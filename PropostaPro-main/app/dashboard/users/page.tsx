'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMaster, setIsMaster] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [plan, setPlan] = useState('free')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmSuspend, setConfirmSuspend] = useState<any>(null)
  const supabase = createClient()

  const planLimits: Record<string, number> = {
    free: 1, starter: 1, professional: 3, business: 999
  }

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, is_master, tenants(plan)')
      .eq('id', user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)
    setIsMaster(profile.is_master || false)
    setPlan((profile.tenants as any)?.plan || 'free')
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_master, is_suspended, created_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at')
    setUsers(allUsers || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function suspendUser(userId: string) {
    await supabase.from('profiles').update({ is_suspended: true }).eq('id', userId)
    setConfirmSuspend(null)
    load()
  }

  async function reactivateUser(userId: string) {
    const limit = planLimits[plan] || 1
    const activeCount = users.filter(u => !u.is_suspended).length
    if (activeCount >= limit) {
      setMsg(`Limite de ${limit} usuário(s) atingido no plano atual. Faça upgrade para reativar.`)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    await supabase.from('profiles').update({ is_suspended: false }).eq('id', userId)
    load()
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    const limit = planLimits[plan] || 1
    const activeCount = users.filter(u => !u.is_suspended).length
    if (activeCount >= limit) {
      setMsg(`Limite de ${limit} usuário(s) atingido no plano ${plan}. Faça upgrade para convidar mais.`)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    setInviting(true)
    const { error } = await supabase.from('user_invites').insert({
      tenant_id: tenantId,
      email: inviteEmail.trim(),
      invited_by: currentUserId,
    })
    if (error) {
      setMsg('Erro ao enviar convite.')
    } else {
      setMsg(`Convite enviado para ${inviteEmail}!`)
      setInviteEmail('')
    }
    setInviting(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const activeUsers = users.filter(u => !u.is_suspended).length
  const limit = planLimits[plan] || 1
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10,
    border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.875rem',
    outline: 'none', background: 'white', fontFamily: font, color: '#0d1117',
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  if (!isMaster) return (
    <div style={{ fontFamily: font, textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
      <h2 style={{ fontWeight: 800, color: '#0d1117', marginBottom: '0.5rem' }}>Acesso restrito</h2>
      <p style={{ color: '#6b7280' }}>Apenas o usuário master pode gerenciar usuários.</p>
    </div>
  )

  return (
    <div style={{ fontFamily: font }}>
      {/* Modal confirmação suspender */}
      {confirmSuspend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(200,81,26,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>⚠️</div>
            <h3 style={{ fontFamily: font, fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0d1117' }}>Suspender usuário?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              <strong>{confirmSuspend.full_name}</strong> perderá o acesso ao sistema. Os dados serão preservados e o usuário poderá ser reativado a qualquer momento.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmSuspend(null)} style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: font }}>Cancelar</button>
              <button onClick={() => suspendUser(confirmSuspend.id)} style={{ background: '#c8511a', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, fontFamily: font }}>Suspender</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Usuários</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>
          {activeUsers} de {limit === 999 ? 'ilimitados' : limit} usuário(s) ativo(s) no plano {plan}
        </p>
      </div>

      {/* Barra de uso */}
      {limit < 999 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Usuários ativos</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: activeUsers >= limit ? '#c8511a' : '#0d1117' }}>{activeUsers} / {limit}</span>
          </div>
          <div style={{ height: 8, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (activeUsers / limit) * 100)}%`, background: activeUsers >= limit ? '#c8511a' : '#059669', borderRadius: 100, transition: 'width 0.5s' }}></div>
          </div>
          {activeUsers >= limit && (
            <p style={{ fontSize: '0.78rem', color: '#c8511a', marginTop: '0.4rem', fontWeight: 500 }}>
              ⚠️ Limite atingido. <a href="/dashboard/plans" style={{ color: '#c8511a', fontWeight: 700 }}>Faça upgrade</a> para adicionar mais usuários.
            </p>
          )}
        </div>
      )}

      {/* Convidar usuário */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#0d1117' }}>Convidar usuário</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendInvite()}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="email@usuario.com"
            type="email"
            disabled={activeUsers >= limit}
          />
          <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim() || activeUsers >= limit}
            style={{ background: activeUsers >= limit ? '#d1d5db' : '#0d1117', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: activeUsers >= limit ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, fontFamily: font, whiteSpace: 'nowrap', opacity: inviting ? 0.7 : 1 }}>
            {inviting ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
        {msg && (
          <p style={{ fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 600, color: msg.includes('Erro') || msg.includes('Limite') ? '#c8511a' : '#065f46' }}>
            {msg.includes('Erro') || msg.includes('Limite') ? '⚠️ ' : '✓ '}{msg}
          </p>
        )}
      </div>

      {/* Lista de usuários */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
              {['Usuário', 'Função', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.04)', opacity: u.is_suspended ? 0.6 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.is_master ? '#c8511a' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: u.is_master ? 'white' : '#6b7280', flexShrink: 0 }}>
                      {(u.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d1117' }}>{u.full_name || 'Sem nome'}</p>
                      {u.id === currentUserId && <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>você</p>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  {u.is_master
                    ? <span style={{ background: 'rgba(200,81,26,0.1)', color: '#c8511a', padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>Master</span>
                    : <span style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280', padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>Usuário</span>
                  }
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  {u.is_suspended
                    ? <span style={{ background: 'rgba(153,27,27,0.1)', color: '#991b1b', padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>Suspenso</span>
                    : <span style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>Ativo</span>
                  }
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  {u.id !== currentUserId && !u.is_master && (
                    u.is_suspended
                      ? <button onClick={() => reactivateUser(u.id)} style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', border: 'none', padding: '0.35rem 0.85rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: font }}>Reativar</button>
                      : <button onClick={() => setConfirmSuspend(u)} style={{ background: 'transparent', border: '1px solid rgba(13,17,23,0.12)', color: '#9ca3af', padding: '0.35rem 0.85rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: font }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(13,17,23,0.12)' }}>
                          Suspender
                        </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
