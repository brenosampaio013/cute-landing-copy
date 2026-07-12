import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Maré Nobre" }] }),
  component: Perfil,
});

function Perfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, email, telefone, foto_url, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setNome(data.nome ?? "");
        setEmail(data.email ?? user.email ?? "");
        setTelefone(data.telefone ?? "");
        setFotoUrl(data.foto_url ?? null);
        setCreatedAt(data.created_at ?? null);
      } else {
        setEmail(user.email ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMsg(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      setMsg({ type: "err", text: "Não conseguimos enviar a foto. Tente uma imagem menor ou em outro formato." });
      return;
    }
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    await supabase.from("profiles").update({ foto_url: url }).eq("id", user.id);
    setFotoUrl(url);
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Foto atualizada.");
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ nome, telefone })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Erro ao salvar. Tente novamente." });
      toast.error("Erro ao salvar perfil.");
    } else {
      setMsg({ type: "ok", text: "Perfil atualizado com sucesso." });
      toast.success("Perfil atualizado.");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const initial = (nome || email || "C").charAt(0).toUpperCase();
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "—";

  return (
    <>
      <PageHeading title="Meu perfil" subtitle="Mantenha seus dados atualizados para agendar em segundos e receber avisos importantes." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={nome}
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#2DD4BF]/20"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#2DD4BF] text-3xl font-bold text-white ring-4 ring-[#2DD4BF]/20">
              {initial}
            </div>
          )}
          <h3 className="mt-4 text-lg font-bold text-[#0A1A2F]">{nome || "Sem nome"}</h3>
          <p className="text-sm text-slate-500">Cliente desde {memberSince}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-[#0A1A2F] transition hover:bg-slate-200 disabled:opacity-50"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Enviando..." : "Trocar foto"}
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Dados pessoais
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" value={nome} onChange={setNome} />
            <Field label="E-mail" value={email} onChange={() => {}} disabled type="email" />
            <Field label="Telefone" value={telefone} onChange={setTelefone} />
          </div>
          {msg && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm ring-1 ${
                msg.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                  : "bg-red-50 text-red-600 ring-red-100"
              }`}
            >
              {msg.text}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#0A1A2F] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-125 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A1A2F] shadow-sm outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}
