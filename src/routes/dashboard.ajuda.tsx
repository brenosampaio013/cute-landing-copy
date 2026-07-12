import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, Phone, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";

export const Route = createFileRoute("/dashboard/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda — Maré Nobre" }] }),
  component: Ajuda,
});

const faqs = [
  {
    q: "Como faço para agendar um serviço?",
    a: "Acesse a seção Serviços, escolha o serviço desejado, selecione data e horário, confirme o endereço e finalize o pagamento.",
  },
  {
    q: "Posso reagendar ou cancelar um agendamento?",
    a: "Sim. Até 12 horas antes do horário marcado você pode reagendar ou cancelar sem custo pela tela de Agendamentos.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos cartão de crédito, débito e Pix. O pagamento é processado com segurança no momento da confirmação.",
  },
  {
    q: "Os profissionais são verificados?",
    a: "Todos os profissionais passam por verificação de documentos, entrevista e treinamento antes de atender.",
  },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-[#0A1A2F]">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
          {a}
        </div>
      )}
    </div>
  );
}

function Ajuda() {
  return (
    <>
      <PageHeading
        title="Central de ajuda"
        subtitle="Consulte as dúvidas frequentes ou fale direto com a equipe — a gente responde rápido."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: MessageCircle, label: "Chat ao vivo", value: "Seg a Sáb · 8h — 20h" },
          { icon: Mail, label: "E-mail", value: "atendimentomarenobre@gmail.com" },
          { icon: Phone, label: "Telefone", value: "(13) 99806-8265" },
        ].map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2DD4BF]/10 text-[#0A1A2F]">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {c.label}
              </p>
              <p className="text-sm font-semibold text-[#0A1A2F]">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h3
          className="text-lg text-[#0A1A2F]"
          style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
        >
          Perguntas frequentes
        </h3>
        <div className="mt-4 grid gap-3">
          {faqs.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
    </>
  );
}
