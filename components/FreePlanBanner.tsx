"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function FreePlanBanner() {
  const router = useRouter();
  const [state, setState] = useState<{
    show: boolean;
    daysLeft: number;
    expiryDate: string;
  } | null>(null);
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
        .select("plan, trial_started_at")
        .eq("id", user.id)
        .single();

      const isFreePlan = !profile?.plan || profile.plan === "free";
      if (!isFreePlan) return;

      const startDate = new Date(profile?.trial_started_at ?? user.created_at);
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + 14);

      const diffMs = expiresAt.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));

      setState({
        show: true,
        daysLeft,
        expiryDate: expiresAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
        }),
      });
    }
    load();
  }, []);

  if (!state?.show || dismissed) return null;

  const { daysLeft, expiryDate } = state;

  const isExpired  = daysLeft === 0;
  const isCritical = daysLeft <= 2;
  const isWarning  = daysLeft <= 5;

  const colors = isExpired
    ? "bg-gray-100 border-gray-300 text-gray-800"
    : isCritical
    ? "bg-red-50 border-red-300 text-red-900"
    : isWarning
    ? "bg-amber-50 border-amber-300 text-amber-900"
    : "bg-blue-50 border-blue-200 text-blue-900";

  const btnColors = isExpired || isCritical
    ? "bg-red-600 hover:bg-red-700 text-white"
    : isWarning
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const message = isExpired
    ? "Seu período gratuito expirou. Faça upgrade para continuar."
    : daysLeft === 1
    ? `Seu plano free termina amanhã (${expiryDate}). Não perca o acesso!`
    : `Seu plano free termina em ${daysLeft} dias — ${expiryDate}.`;

  const consumed = Math.min(100, ((14 - daysLeft) / 14) * 100);

  return (
    <div className={`w-full border-b ${colors}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <p className="flex-1 truncate text-sm font-medium">
          {isExpired ? "🔒" : isCritical ? "🔴" : isWarning ? "⚠️" : "⏳"}{" "}
          {message}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => router.push("/planos")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${btnColors}`}
          >
            Ver planos
          </button>

          {!isExpired && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Fechar"
              className="rounded p-1 opacity-40 hover:opacity-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!isExpired && (
        <div className="h-0.5 w-full bg-black/10">
          <div
            className={`h-0.5 transition-all ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"}`}
            style={{ width: `${consumed}%` }}
          />
        </div>
      )}
    </div>
  );
}
