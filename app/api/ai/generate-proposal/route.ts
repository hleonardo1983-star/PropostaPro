import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Funcionalidade de IA temporariamente desativada.' }, { status: 503 })
}
