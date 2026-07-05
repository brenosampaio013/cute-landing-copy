import { Link } from "@tanstack/react-router";
import {
  Waves,
  LayoutDashboard,
  Calendar,
  LayoutGrid,
  Users,
  UserCircle,
  CreditCard,
  Star,
  MessageSquare,
  Ticket,
  FileBarChart,
  UserCog,
  Tag,
  Settings,
  Bell,
  ScrollText,
  HelpCircle,
  Search,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/queries/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadTotalWithSound } from "@/hooks/queries/use-mensagens";

export const NAVY = "#0A1128";
export const NAVY_2 = "#0D1B3D";
export const TEAL = "#0FA98A";
export const TEAL_SOFT = "rgba(15,169,138,0.15)";

type NavKey =
  | "dashboard"
  | "agendamentos"
  | "servicos"
  | "profissionais"
  | "clientes"
  | "pagamentos"
  | "avaliacoes"
  | "mensagens"
  | "cupons"
  | "relatorios"
  | "usuarios"
  | "categorias"
  | "configuracoes"
  | "notificacoes"
  | "logs";

type NavItem = { key: NavKey; label: string; icon: LucideIcon; to?: string };

export const PRINCIPAL: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { key: "agendamentos", label: "Agendamentos", icon: Calendar, to: "/admin/agendamentos" },
  { key: "servicos", label: "Serviços", icon: LayoutGrid, to: "/admin/servicos" },
  { key: "profissionais", label: "Profissionais", icon: Users, to: "/admin/profissionais" },
  { key: "clientes", label: "Clientes", icon: UserCircle, to: "/admin/clientes" },
  { key: "pagamentos", label: "Pagamentos", icon: CreditCard, to: "/admin/pagamentos" },
  { key: "avaliacoes", label: "Avaliações", icon: Star, to: "/admin/avaliacoes" },
  { key: "mensagens", label: "Mensagens", icon: MessageSquare, to: "/admin/mensagens" },
  { key: "cupons", label: "Cupons", icon: Ticket, to: "/admin/cupons" },
  { key: "relatorios", label: "Relatórios", icon: FileBarChart, to: "/admin/relatorios" },
];

export const GERENCIAMENTO: NavItem[] = [
  { key: "usuarios", label: "Usuários", icon: UserCog, to: "/admin/usuarios" },
  { key: "categorias", label: "Categorias", icon: Tag, to: "/admin/categorias" },
  { key: "configuracoes", label: "Configurações", icon: Settings, to: "/admin/configuracoes" },
  { key: "notificacoes", label: "Notificações", icon: Bell, to: "/admin/notificacoes" },
  { key: "logs", label: "Logs do sistema", icon: ScrollText, to: "/admin/logs" },
];

export const SIDEBAR_SECTIONS = { PRINCIPAL: "PRINCIPAL", GERENCIAMENTO: "GERENCIAMENTO" } as const;
export const SIDEBAR_HELP_TITLE = "Precisa de ajuda?";
export const SIDEBAR_HELP_SUBTITLE = "Central de ajuda";

export function AdminShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: NavKey;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { displayName, initial } = useProfile();
  const { user } = useAuth();
  const unread = useUnreadTotalWithSound("admin", !!user, user);
  const badges: Partial<Record<NavKey, number>> = { mensagens: unread };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA] text-slate-800">
      <aside
        className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col text-white lg:flex"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 100%)` }}
      >
        <div className="px-6 pb-6 pt-7">
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6" style={{ color: TEAL }} />
            <span className="text-lg font-bold tracking-wide">MARÉ NOBRE</span>
          </div>
          <p className="mt-1 text-[10px] font-medium tracking-[0.14em] text-white/45">
            SOLUÇÕES PARA O SEU LAR
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarSection title="PRINCIPAL" items={PRINCIPAL} active={active} badges={badges} />
          <SidebarSection title="GERENCIAMENTO" items={GERENCIAMENTO} active={active} className="mt-6" />
        </nav>

        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: TEAL_SOFT, color: TEAL }}>
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Precisa de ajuda?</p>
              <p className="truncate text-[11px] text-white/60">Central de ajuda</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1128]">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {subtitle ?? `Bem-vindo(a) de volta, ${displayName?.split(" ")[0] ?? "Admin"}! 👋`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Buscar..."
                className="h-10 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/20"
                style={{ ["--brand" as string]: TEAL }}
              />
            </div>
            <button className="relative rounded-full bg-white p-2.5 text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-[#0A1128]">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>
                {initial}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#0A1128]">Admin</p>
                <p className="text-[10px] text-slate-500">Administrador</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

function SidebarSection({
  title, items, active, className = "", badges,
}: { title: string; items: NavItem[]; active: NavKey; className?: string; badges?: Partial<Record<NavKey, number>> }) {
  return (
    <div className={className}>
      <p className="mb-2 px-4 text-[10px] font-semibold tracking-[0.16em] text-white/40">{title}</p>
      <ul className="space-y-0.5">
        {items.map((it) => {
          const isActive = it.key === active;
          const badge = badges?.[it.key] ?? 0;
          const cls = `flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            isActive ? "text-white shadow-inner" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
          }`;
          const style = isActive ? { background: TEAL_SOFT, boxShadow: `inset 0 0 0 1px ${TEAL}55` } : undefined;
          const inner = (
            <>
              <it.icon className="h-[18px] w-[18px]" style={isActive ? { color: TEAL } : undefined} />
              <span className="flex-1">{it.label}</span>
              {badge > 0 && (
                <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </>
          );
          return (
            <li key={it.key}>
              {it.to ? (
                <Link to={it.to} className={cls} style={style}>{inner}</Link>
              ) : (
                <button type="button" className={`${cls} text-left`} style={style} disabled>{inner}</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export const statusBadge: Record<string, string> = {
  Confirmado: "bg-emerald-100 text-emerald-700",
  Concluído: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Cancelado: "bg-rose-100 text-rose-700",
};
export const pagamentoBadge: Record<string, string> = {
  Pago: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Estornado: "bg-rose-100 text-rose-700",
};
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
