export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

// ✅ FIX: ip agora é opcional — a página pública não tem acesso ao IP real
// (o IP capturado era "web-client", um placeholder sem valor)
export function generateSignatureHash(data: {
  name: string
  timestamp: string
  proposalId: string
  ip?: string
}): string {
  const str = `${data.name}|${data.ip ?? 'web'}|${data.timestamp}|${data.proposalId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() + '-' + Date.now().toString(16).toUpperCase()
}
