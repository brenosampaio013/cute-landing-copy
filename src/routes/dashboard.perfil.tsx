import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "./dashboard";

export const Route = createFileRoute("/dashboard/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Maré Nobre" }] }),
  component: Perfil,
});

function Field({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A1A2F] shadow-sm outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20"
      />
    </label>
  );
}

function Perfil() {
  return (
    <>
      <PageHeading
        title="Perfil"
        subtitle="Atualize seus dados pessoais e de contato."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <img
            src="https://i.pravatar.cc/160?img=47"
            alt="Juliana Silva"
            className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#2DD4BF]/20"
          />
          <h3 className="mt-4 text-lg font-bold text-[#0A1A2F]">
            Juliana Silva
          </h3>
          <p className="text-sm text-slate-500">Cliente desde Mar 2025</p>
          <button className="mt-5 w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-[#0A1A2F] transition hover:bg-slate-200">
            Trocar foto
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
            <Field label="Nome completo" defaultValue="Juliana Silva" />
            <Field label="CPF" defaultValue="123.456.789-00" />
            <Field
              label="E-mail"
              type="email"
              defaultValue="juliana@email.com"
            />
            <Field label="Telefone" defaultValue="(11) 98765-4321" />
            <Field label="Data de nascimento" type="date" defaultValue="1990-04-12" />
            <Field label="Cidade" defaultValue="São Paulo, SP" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0A1A2F] hover:bg-slate-50">
              Cancelar
            </button>
            <button className="rounded-lg bg-[#0A1A2F] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-125">
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
