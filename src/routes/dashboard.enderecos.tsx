import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/enderecos")({
  head: () => ({ meta: [{ title: "Endereços — Maré Nobre" }] }),
  component: Enderecos,
});

type Endereco = {
  id: string;
  rotulo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

const emptyForm = {
  rotulo: "Casa", cep: "", logradouro: "", numero: "",
  complemento: "", bairro: "", cidade: "", estado: "",
};

function Enderecos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Endereco[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("enderecos")
      .select("*")
      .eq("cliente_id", user.id)
      .order("principal", { ascending: false })
      .order("created_at", { ascending: false });
    setItems((data as Endereco[] | null) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function salvar() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("enderecos").insert({
      cliente_id: user.id,
      ...form,
      principal: items.length === 0,
    });
    setSaving(false);
    if (error) {
      toast.error("Não conseguimos salvar o endereço. Confira os dados e tente novamente.");
      return;
    }
    toast.success("Endereço adicionado com sucesso.");
    setForm(emptyForm);
    setOpen(false);
    load();
  }

  async function remover(id: string) {
    if (!confirm("Remover este endereço?")) return;
    const { error } = await supabase.from("enderecos").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover.");
      return;
    }
    toast.success("Endereço removido.");
    load();
  }

  async function tornarPrincipal(id: string) {
    if (!user) return;
    const { error: e1 } = await supabase.from("enderecos").update({ principal: false }).eq("cliente_id", user.id);
    const { error: e2 } = await supabase.from("enderecos").update({ principal: true }).eq("id", id);
    if (e1 || e2) {
      toast.error("Não foi possível definir como principal.");
      load();
      return;
    }
    toast.success("Endereço principal atualizado.");
    load();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading title="Endereços" subtitle="Gerencie os endereços onde você recebe atendimento." />
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2DD4BF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Novo endereço
        </button>
      </div>

      {open && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-base font-bold text-[#0A1A2F]">Novo endereço</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Rótulo" value={form.rotulo} onChange={(v) => setForm({ ...form, rotulo: v })} />
            <Input label="CEP" value={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
            <Input label="Logradouro" value={form.logradouro} onChange={(v) => setForm({ ...form, logradouro: v })} className="sm:col-span-2" />
            <Input label="Número" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
            <Input label="Complemento" value={form.complemento} onChange={(v) => setForm({ ...form, complemento: v })} />
            <Input label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
            <Input label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
            <Input label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={saving || !form.cep || !form.logradouro || !form.numero || !form.bairro || !form.cidade || !form.estado}
              className="flex items-center gap-2 rounded-lg bg-[#0A1A2F] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-125 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <MapPin className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#0A1A2F]">Você ainda não tem endereços</p>
          <p className="mt-1 text-xs text-slate-500">Adicione um endereço para agilizar seus agendamentos.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((e) => (
            <div key={e.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0A1A2F]">{e.rotulo}</p>
                    {e.principal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0A9E8A]">
                        <Star className="h-3 w-3 fill-current" /> Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {e.logradouro}, {e.numero}
                    {e.complemento && ` — ${e.complemento}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.bairro} · {e.cidade}/{e.estado} · CEP {e.cep}
                  </p>
                </div>
                <button onClick={() => remover(e.id)} aria-label="Remover" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!e.principal && (
                <button
                  onClick={() => tornarPrincipal(e.id)}
                  className="mt-4 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-[#0A1A2F] hover:bg-slate-200"
                >
                  Tornar principal
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Input({
  label, value, onChange, className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0A1A2F] outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20"
      />
    </label>
  );
}
