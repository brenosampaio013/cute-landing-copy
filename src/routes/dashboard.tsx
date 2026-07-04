import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, type ComponentType, type SVGProps } from "react";
import {
  Home,
  Calendar,
  LayoutGrid,
  Users,
  Star,
  Wallet,
  MapPin,
  User,
  HelpCircle,
  LogOut,
  Bell,
  Leaf,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Maré Nobre" },
      {
        name: "description",
        content:
          "Área do cliente: agende serviços, acompanhe pagamentos e avalie profissionais.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  icon: IconType;
  to?: string;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", icon: Home, to: "/dashboard", exact: true },
  { label: "Agendamentos", icon: Calendar, to: "/dashboard/agendamentos" },
  { label: "Serviços", icon: LayoutGrid, to: "/dashboard/servicos" },
  { label: "Profissionais", icon: Users },
  { label: "Avaliações", icon: Star },
  { label: "Pagamentos", icon: Wallet, to: "/dashboard/pagamentos" },
  { label: "Endereços", icon: MapPin },
  { label: "Perfil", icon: User, to: "/dashboard/perfil" },
  { label: "Ajuda", icon: HelpCircle, to: "/dashboard/ajuda" },
];

function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A1A2F] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 text-white">
          <Leaf className="h-5 w-5 text-[#2DD4BF]" />
          <span className="font-display text-lg">Maré Nobre</span>
        </div>
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="text-white"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-y-0 left-0 z-40 w-[280px] flex-shrink-0 bg-[#0A1A2F] text-white lg:sticky lg:top-0 lg:block lg:h-screen`}
        >
          <div className="flex h-full flex-col">
            {/* Brand */}
            <div className="border-b border-white/5 px-7 pb-6 pt-8">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[#2DD4BF]" />
                <span
                  className="text-2xl text-white"
                  style={{
                    fontFamily: "var(--font-serif-bold)",
                    fontWeight: 700,
                  }}
                >
                  MARÉ NOBRE
                </span>
              </div>
              <p className="mt-1 pl-7 text-[10px] font-medium tracking-[0.18em] text-white/50">
                SOLUÇÕES PARA O SEU LAR
              </p>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
              {NAV.map((item) => {
                const inactive =
                  "text-white/70 hover:bg-white/5 hover:text-white";
                const active =
                  "bg-[#2DD4BF]/15 text-white ring-1 ring-inset ring-[#2DD4BF]/30";
                const base =
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition";

                if (!item.to) {
                  return (
                    <a
                      key={item.label}
                      href="#"
                      className={`${base} ${inactive}`}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.exact ?? false }}
                    className={`${base} ${inactive}`}
                    activeProps={{ className: `${base} ${active}` }}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/5 px-4 py-4">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sair
              </a>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {/* Top-right user bar */}
          <div className="mb-6 flex items-center justify-end gap-4">
            <button
              aria-label="Notificações"
              className="relative rounded-full bg-white p-2.5 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-[#0A1A2F]"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#2DD4BF]" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="https://i.pravatar.cc/80?img=47"
                alt="Juliana Silva"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
              />
              <span className="hidden text-sm font-semibold text-[#0A1A2F] sm:inline">
                Juliana Silva
              </span>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

