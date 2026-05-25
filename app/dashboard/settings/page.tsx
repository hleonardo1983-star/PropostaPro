'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function SettingsPage() {
  const [profile, setProfile] = useState({ full_name: '', role: '' })
  const [company, setCompany] = useState({ name: '', primary_color: '#2563eb', logo_url: '' })
  const [tenantId, setTenantId] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [msgProfile, setMsgProfile] = useState('')
  const [msgCompany, setMsgCompany] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('full_name, role, tenant_id, tenants(name, primary_color, logo_url)').eq('id', user.id).single()
      if (data) {
        setProfile({ full_name: data.full_name || '', role: data.role || '' })
        setTenantId(data.tenant_id)
        setCompany({ name: (data.tenants as any)?.name || '', primary_color: (data.tenants as any)?.primary_color || '#2563eb', logo_url: (data.tenants as any)?.logo_url || '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function uploadLogo(file: File) {
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${tenantId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
      const urlWithCache = `${publicUrl}?t=${Date.now()}`
      await supabase.from('tenants').update({ logo_url: urlWithCache }).eq('id', tenantId)
      setCompany(c => ({ ...c, logo_url: urlWithCache }))
      setMsgCompany('Logo atualizada com sucesso!')
      setTimeout(() => setMsgCompany(''), 3000)
    } catch (err: any) { setMsgCompany(`Erro: ${err.message}`) }
    setUploadingLogo(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProfile(true); setMsgProfile('')
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name }).eq('id', userId)
    setSavingProfile(false)
    setMsgProfile(error ? 'Erro ao salvar.' : 'Salvo com sucesso!')
    setTimeout(() => setMsgProfile(''), 3000)
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault(); setSavingCompany(true); setMsgCompany('')
    const { error } = await supabase.from('tenants').update({ name: company.name, primary_color: company.primary_color }).eq('id', tenantId)
    setSavingCompany(false)
    setMsgCompany(error ? 'Erro ao salvar.' : 'Salvo com sucesso!')
    setTimeout(() => setMsgCompany(''), 3000)
  }

  async function removeLogo() {
    await supabase.from('tenants').update({ logo_url: null }).eq('id', tenantId)
    setCompany(c => ({ ...c, logo_url: '' }))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(17,24,39,0.15)', fontSize: '0.925rem', outline: 'none', background: 'white', fontFamily: font, color: '#0d1117' }
  const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }
  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  return (
    <div style={{ maxWidth: 600, fontFamily: font }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: font, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Configurações</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Edite seus dados pessoais e da empresa</p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>👤 Dados pessoais</h2>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nome completo</label>
            <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} style={inputStyle} placeholder="Seu nome" required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {msgProfile && <span style={{ fontSize: '0.85rem', color: msgProfile.includes('Erro') ? '#dc2626' : '#059669', fontWeight: 600 }}>{msgProfile.includes('Erro') ? '✕ ' : '✓ '}{msgProfile}</span>}
            <button type="submit" disabled={savingProfile} style={{ marginLeft: 'auto', background: '#0d1117', color: 'white', padding: '0.65rem 1.5rem', borderRadius: 100, border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: font, opacity: savingProfile ? 0.7 : 1 }}>
              {savingProfile ? 'Salvando...' : 'Salvar dados'}
            </button>
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>🏢 Dados da empresa</h2>
        <form onSubmit={saveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Logo da empresa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {company.logo_url ? (
                <div style={{ position: 'relative' }}>
                  <img src={company.logo_url} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 12, border: '1.5px solid rgba(13,17,23,0.1)', background: '#f9fafb', padding: 8 }} />
                  <button type="button" onClick={removeLogo} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : (
                <div style={{ width: 80, height: 80, border: '2px dashed rgba(13,17,23,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#9ca3af', fontSize: '1.75rem' }}>🏢</div>
              )}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]) }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo} style={{ background: '#0d1117', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: font, opacity: uploadingLogo ? 0.7 : 1, display: 'block', marginBottom: '0.4rem' }}>
                  {uploadingLogo ? 'Enviando...' : company.logo_url ? 'Trocar logo' : 'Fazer upload'}
                </button>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PNG, JPG ou SVG. Máx 2MB.</p>
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nome da empresa</label>
            <input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Cor principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="color" value={company.primary_color} onChange={e => setCompany(c => ({ ...c, primary_color: e.target.value }))} style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', cursor: 'pointer', padding: 2, background: 'white' }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{company.primary_color}</p>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Cor dos botões e destaques</p>
              </div>
              <div style={{ marginLeft: 'auto', width: 80, height: 36, borderRadius: 100, background: company.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>Preview</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {msgCompany && <span style={{ fontSize: '0.85rem', color: msgCompany.includes('Erro') ? '#dc2626' : '#059669', fontWeight: 600 }}>{msgCompany.includes('Erro') ? '✕ ' : '✓ '}{msgCompany}</span>}
            <button type="submit" disabled={savingCompany} style={{ marginLeft: 'auto', background: '#0d1117', color: 'white', padding: '0.65rem 1.5rem', borderRadius: 100, border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: font, opacity: savingCompany ? 0.7 : 1 }}>
              {savingCompany ? 'Salvando...' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>🔑 Segurança</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Para alterar sua senha, enviaremos um link para o seu e-mail.</p>
        <ChangePassword supabase={supabase} font={font} />
      </div>
    </div>
  )
}

function ChangePassword({ supabase, font }: { supabase: any; font: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  async function sendReset() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) await supabase.auth.resetPasswordForEmail(user.email)
    setSent(true); setLoading(false)
  }
  return sent ? (
    <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 10, padding: '0.85rem 1rem', color: '#065f46', fontSize: '0.875rem', fontWeight: 600 }}>✓ Link enviado para o seu e-mail!</div>
  ) : (
    <button onClick={sendReset} disabled={loading} style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', color: '#0d1117', padding: '0.65rem 1.5rem', borderRadius: 100, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: font }}>
      {loading ? 'Enviando...' : '📧 Enviar link de redefinição'}
    </button>
  )
}
