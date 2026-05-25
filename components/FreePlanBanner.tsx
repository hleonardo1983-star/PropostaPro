"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Status = "ok" | "warning" | "critical" | "expired";

interface BannerData {
  daysLeft: number;
  expiryDate: string;
  status: Status;
}

export function FreePlanBanner() {
  const router = useRouter();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      if (!tenant || tenant.plan !== "starter") return;

      const expiresAt = tenant.plan_expires_at
        ? new Date(tenant.plan_expires_at)
        : (() => {
            const d = new Date(tenant.created_at);
            d.setDate(d.getDate() + 14);
            return d;
          })();

      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));
      const status: Status =
        daysLeft === 0 ? "expired" :
        daysLeft <= 2  ? "critical" :
        daysLeft <= 5  ? "warning"  : "ok";

      setBanner({
        daysLeft,
        status,
        expiryDate: expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
      });
    }
    load();
  }, []);

  if (!banner || dismissed) return null;

  const { daysLeft, expiryDate, status } = banner;

  const styles = {
    ok:       { bar: "bg-indigo-600", bg: "bg-indigo-600", progress: "bg-white/40", text: "text-white", btn: "bg-white text-indigo-700 hover:bg-indigo-50" },
    warning:  { bar: "bg-amber-500",  bg: "bg-amber-500",  progress: "bg-white/40", text: "text-white", btn: "bg-white text-amber-700 hover:bg-amber-50" },
    critical: { bar: "bg-red-600",    bg: "bg-red-600",    progress: "bg-white/40", text: "text-white", btn: "bg-white text-red-700 hover:bg-red-50" },
    expired:  { bar: "bg-gray-700",   bg: "bg-gray-700",   progress: "bg-white/20", text: "text-white", btn: "bg-white text-gray-800 hover:bg-gray-100" },
  }[status];

  const icon    = { ok: "⏳", warning: "⚠️", critical: "🔴", expired: "🔒" }[status];
  const message =
    status === "expired" ? "Seu período gratuito expirou. Faça upgrade para continuar." :
    daysLeft === 1       ? `Plano free termina amanhã (${expiryDate}). Não perca o acesso!` :
                           `Plano free ativo — expira em ${daysLeft} dias (${expiryDate}).`;

  const consumed = Math.min(100, ((14 - daysLeft) / 14) * 100);

  return (
    <div className={`w-full ${styles.bg}`}>
      <div className={`mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 ${styles.text}`}>
        {/* ícone */}
        <span className="shrink-0 text-sm">{icon}</span>

        {/* mensagem */}
        <p className="flex-1 text-sm font-medium">{message}</p>

        {/* botão */}
        <button
          onClick={() => router.push("/planos")}
          className={`shrink-0 rounded-full px-4 py-1 text-xs font-bold shadow transition ${styles.btn}`}
        >
          Ver planos →
        </button>

        {/* fechar */}
        {status !== "expired" && (
          <button
            onClick={() => setDismissed(true)}
            aria-label="Fechar"
            className="shrink-0 opacity-60 hover:opacity-100 transition text-white text-sm ml-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* barra de progresso */}
      {status !== "expired" && (
        <div className={`h-0.5 w-full ${styles.progress}`}>
          <div
            className="h-0.5 bg-white/80 transition-all duration-700"
            style={{ width: `${consumed}%` }}
          />
        </div>
      )}
    </div>
  );
}
