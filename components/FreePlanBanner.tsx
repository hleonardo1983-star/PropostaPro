"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function FreePlanBanner() {
  const router = useRouter();
  const [data, setData] = useState<{ daysLeft: number; expiryDate: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca o tenant pelo profile do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan, created_at, plan_expires_at")
        .eq("id", profile.tenant_id)
        .single();

      // Só exibe para plano starter (free)
      if (!tenant || tenant.plan !== "starter") return;

      // Usa plan_expires_at se existir, senão created_at + 14 dias
      const expiresAt = tenant.plan_expires_at
        ? new Date(tenant.plan_expires_at)
        : (() => {
            const d = new Date(tenant.created_at);
            d.setDate(d.getDate() + 14);
            return d;
          })();

      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

      setData({
        daysLeft,
        expiryDate: expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
      });
    }
    load();
  }, []);

  if (!data || dismissed) return null;

  const { daysLeft, expiryDate } = data;
  const isExpired  = daysLeft === 0;
  const isCritical = daysLeft <= 2;
  const isWarning  = daysLeft <= 5;

  const wrap = isExpired  ? "bg-gray-100 border-gray-300 text-gray-800"
             : isCritical ? "bg-red-50 border-red-300 text-red-900"
             : isWarning  ? "bg-amber-50 border-amber-300 text-amber-900"
             :              "bg-blue-50 border-blue-200 text-blue-900";

  const btn  = isExpired || isCritical ? "bg-red-600 hover:bg-red-700 text-white"
             : isWarning               ? "bg-amber-500 hover:bg-amber-600 text-white"
             :                           "bg-blue-600 hover:bg-blue-700 text-white";

  const icon = isExpired ? "🔒" : isCritical ? "🔴" : isWarning ? "⚠️" : "⏳";

  const message = isExpired
    ? "Seu período gratuito expirou. Faça upgrade para continuar usando."
    : daysLeft === 1
    ? `Seu plano free termina amanhã (${expiryDate}). Não perca o acesso!`
    : `Seu plano free termina em ${daysLeft} dias — ${expiryDate}.`;

  return (
    <div className={`w-full border-b ${wrap}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <p className="flex-1 truncate text-sm font-medium">
          {icon} {message}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => router.push("/planos")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${btn}`}
          >
            Ver planos
          </button>
          {!isExpired && (
            <button onClick={() => setDismissed(true)} aria-label="Fechar" className="rounded p-1 opacity-40 hover:opacity-100 transition">
              ✕
            </button>
          )}
        </div>
      </div>
      {!isExpired && (
        <div className="h-0.5 w-full bg-black/10">
          <div
            className={`h-0.5 transition-all ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(100, ((14 - daysLeft) / 14) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
