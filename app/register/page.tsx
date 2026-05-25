'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const slug = form.company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')
      const { error: fnError } = await supabase.rpc('create_tenant_and_profile', {
        p_user_id: authData.user.id,
        p_full_name: form.name,
        p_company_name: form.company,
        p_slug: slug,
      })
      if (fnError) throw fnError
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.95rem', outline: 'none', background: 'white', fontFamily: font }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', padding: '2rem', fontFamily: font }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '3rem', width: '100%', maxWidth: 440, border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 20px 60px rgba(13,17,23,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', textDecoration: 'none', letterSpacing: '-0.03em', fontFamily: font }}>
            Proposta<span style={{ color: '#2563eb' }}>Pro</span>
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>Crie sua conta grátis</p>
        </div>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Seu nome', key: 'name', type: 'text', placeholder: 'João Silva' },
            { label: 'Nome da empresa', key: 'company', type: 'text', placeholder: 'Minha Empresa' },
            { label: 'E-mail', key: 'email', type: 'email', placeholder: 'voce@empresa.com' },
            { label: 'Senha', key: 'password', type: 'password', placeholder: 'Mínimo 8 caracteres' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={set(f.key)} required style={inputStyle} placeholder={f.placeholder} minLength={f.key === 'password' ? 8 : undefined} />
            </div>
          ))}
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#2563eb', color: 'white', padding: '0.9rem', borderRadius: 100, border: 'none', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem', fontFamily: font }}>
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Já tem conta? <Link href="/login" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
