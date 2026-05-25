# PropostaFácil 🚀

SaaS para criação e envio de orçamentos/propostas com assinatura digital e geração automática de contas a receber.

## Stack
- **Next.js 16** (App Router)
- **Supabase** (Auth, Postgres, RLS)
- **Vercel** (deploy)
- **Resend** (e-mail, 3.000/mês grátis)

## Custo total: R$ 0/mês no MVP

## Setup rápido

### 1. Clone e instale
```bash
git clone https://github.com/seu-usuario/propostafacil
cd propostafacil
npm install
```

### 2. Configure o Supabase
1. Crie um projeto em https://supabase.com (gratuito)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/001_initial.sql`
3. Copie as chaves em **Settings > API**

### 3. Configure o Resend
1. Crie conta em https://resend.com (gratuito)
2. Gere uma API key

### 4. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas chaves
```

### 5. Rode localmente
```bash
npm run dev
```
Acesse http://localhost:3000

## Deploy no Vercel

1. Push para o GitHub
2. Importe no Vercel: https://vercel.com/new
3. Configure as variáveis de ambiente no painel Vercel
4. Deploy automático! ✅

## Fluxo do sistema

```
Criar proposta → Enviar (WhatsApp/Email) → Cliente assina → Conta a receber gerada
```

## Variáveis de ambiente
Veja `.env.example` para todas as variáveis necessárias.
