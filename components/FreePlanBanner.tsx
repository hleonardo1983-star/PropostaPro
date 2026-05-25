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
        daysLeft === 0 ? "expired"  :
        daysLeft <= 2  ? "critical" :
        daysLeft <= 5  ? "warning"  : "ok";

      setBanner({
        daysLeft,
        status,
        expiryDate: expiresAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
        }),
      });
    }
    load();
  }, []);

  if (!banner || dismissed) return null;

  const { daysLeft, expiryDate, status } = banner;

  const bg = {
    ok:       "bg-indigo-600",
    warning:  "bg-amber-500",
    critical: "bg-red-600",
    expired:  "bg-gray-800",
  }[status];

  const icon = {
    ok:       "⏳",
    warning:  "⚠️",
    critical: "🔴",
    expired:  "🔒",
  }[status];

  const message =
    status === "expired" ? "Seu período gratuito expirou. Faça upgrade para continuar." :
    daysLeft === 1       ? `Plano free termina amanhã (${expiryDate}).` :
                           `Plano free expira em ${daysLeft} dias — ${expiryDate}.`;

  return (
    <>
      {/* Espaçador para não sobrepor o conteúdo */}
      <div className="h-10" />

      {/* Banner fixo no topo, acima de tudo */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] ${bg} text-white`}
        style={{ height: "40px" }}
      >
        <div className="flex h-full items-center justify-center gap-3 px-4">
          <span className="text-sm">{icon}</span>

          <p className="text-sm font-medium">{message}</p>

          <button
            onClick={() => router.push("/planos")}
            className="rounded-full bg-white px-4 py-0.5 text-xs font-bold text-gray-800 hover:bg-gray-100 transition"
          >
            Ver planos →
          </button>

          {status !== "expired" && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Fechar"
              className="absolute right-4 opacity-60 hover:opacity-100 transition text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </>
  );
}
