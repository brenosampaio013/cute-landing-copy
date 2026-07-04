import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: Cadastro,
});

function Cadastro() {
  return (
    <SitePage title="Criar conta" subtitle="Cadastre-se e agende seu primeiro serviço em minutos.">
      <form className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        {[
          { label: "Nome completo", type: "text" },
          { label: "E-mail", type: "email" },
          { label: "Telefone", type: "tel" },
          { label: "Senha", type: "password" },
        ].map((f) => (
          <label key={f.label} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</span>
            <input type={f.type} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
        ))}
        <button type="button" className="w-full rounded-lg bg-[#2DD4BF] px-4 py-3 text-sm font-semibold text-white hover:brightness-110">Criar conta</button>
        <p className="text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-[#2DD4BF] hover:underline">Entrar</Link>
        </p>
      </form>
    </SitePage>
  );
}
