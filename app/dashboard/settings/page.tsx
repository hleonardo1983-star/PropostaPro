'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [profile, setProfile] = useState({ full_name: '', role: '' })
  const [company, setCompany] = useState({ name: '', primary_color: '#c8511a' })
  const [tenantId, setTenantId] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [msgProfile, setMsgProfile] = useState('')
  const [msgCompany, setMsgCompany] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, tenant_id, tenants(name, primary_color)')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile({ full_name: data.full_name || '', role: data.role || '' })
        setTenantId(data.tenant_id)
        setCompany({
          name: (data.tenants as any)?.name || '',
          primary_color: (data.tenants as any)?.primary_color || '#c8511a',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true); setMsgProfile('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', userId)
    setSavingProfile(false)
    setMsgProfile(error ? 'Erro ao salvar.' : 'Salvo com sucesso!')
    setTimeout(() => setMsgProfile(''), 3000)
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault()
    setSavingCompany(true); setMsgCompany('')
    const { error } = await supabase
      .from('tenants')
      .update({ name: company.name, primary_color: company.primary_color })
      .eq('id', tenantId)
    setSavingCompany(false)
    setMsgCompany(error ? 'Erro ao salvar.' : 'Salvo com sucesso!')
    setTimeout(() => setMsgCompany(''), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 10,
    border: '1.5px solid rgba(17,24,39,0.15)', fontSize: '0.925rem',
    outline: 'none', background: 'white', fontFamily: 'inherit', color: '#111827',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem', fontWeight: 600, display: 'block',
    marginBottom: '0.4rem', color: '#374151',
  }
  const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 16,
    border: '1px solid rgba(17,24,39,0.08)',
    padding: '2rem', marginBottom: '1.5rem',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280' }}>
      Carregando...
    </div>
  )

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
          Configurações
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Edite seus dados pessoais e da empresa</p>
      </div>

      {/* Dados pessoais */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 Dados pessoais
        </h2>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nome completo</label>
            <input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              style={inputStyle} placeholder="Seu nome" required
            />
          </div>
          <div>
            <label style={labelStyle}>Função</label>
            <input value={profile.role} style={{ ...inputStyle, background: '#f9fafb', color: '#9ca3af' }} disabled />
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.35rem' }}>A função não pode ser alterada</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {msgProfile && (
              <span style={{ fontSize: '0.85rem', color: msgProfile.includes('Erro') ? '#c8511a' : '#059669', fontWeight: 500 }}>
                {msgProfile.includes('Erro') ? '✕ ' : '✓ '}{msgProfile}
              </span>
            )}
            <button type="submit" disabled={savingProfile} style={{ marginLeft: 'auto', background: '#111827', color: 'white', padding: '0.65rem 1.5rem', borderRadius: 100, border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: savingProfile ? 0.7 : 1 }}>
              {savingProfile ? 'Salvando...' : 'Salvar dados'}
            </button>
          </div>
        </form>
      </div>

      {/* Dados da empresa */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏢 Dados da empresa
        </h2>
        <form onSubmit={saveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nome da empresa</label>
            <input
              value={company.name}
              onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
              style={inputStyle} placeholder="Nome da empresa" required
            />
          </div>
          <div>
            <label style={labelStyle}>Cor principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="color"
                value={company.primary_color}
                onChange={e => setCompany(c => ({ ...c, primary_color: e.target.value }))}
                style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px solid rgba(17,24,39,0.15)', cursor: 'pointer', padding: 2, background: 'white' }}
              />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{company.primary_color}</p>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Cor usada nos botões e destaques</p>
              </div>
              <div style={{ marginLeft: 'auto', width: 80, height: 36, borderRadius: 100, background: company.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>Preview</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {msgCompany && (
              <span style={{ fontSize: '0.85rem', color: msgCompany.includes('Erro') ? '#c8511a' : '#059669', fontWeight: 500 }}>
                {msgCompany.includes('Erro') ? '✕ ' : '✓ '}{msgCompany}
              </span>
            )}
            <button type="submit" disabled={savingCompany} style={{ marginLeft: 'auto', background: '#111827', color: 'white', padding: '0.65rem 1.5rem', borderRadius: 100, border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: savingCompany ? 0.7 : 1 }}>
              {savingCompany ? 'Salvando...' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔑 Segurança
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Para alterar sua senha, enviaremos um link para o seu e-mail.</p>
        <ChangePassword supabase={supabase} />
      </div>
    </div>
  )
}

function ChangePassword({ supabase }: { supabase: any }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendReset() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email)
    }
    setSent(true)
    setLoading(false)
  }

  return sent ? (
    <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 10, padding: '0.85rem 1rem', color: '#065f46', fontSize: '0.875rem', fontWeight: 500 }}>
      ✓ Link enviado para o seu e-mail!
    </div>
  ) : (
    <button onClick={sendReset} disabled={loading} style={{ background: 'transparent', border: '1.5px solid rgba(17,24,39,0.15)', color: '#111827', padding: '0.65rem 1.5rem', borderRadius: 100, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
      {loading ? 'Enviando...' : '📧 Enviar link de redefinição'}
    </button>
  )
}
