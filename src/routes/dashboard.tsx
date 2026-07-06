import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
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
  MessageSquare,
  LogOut,
  Bell,
  Leaf,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/queries/use-profile";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { useLogout } from "@/hooks/use-logout";
import { FullPageLoader } from "@/components/full-page-loader";
import { useUnreadTotalWithSound } from "@/hooks/queries/use-mensagens";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

type IconType = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { label: string; icon: IconType; to?: string; exact?: boolean };

const NAV: NavItem[] = [
  { label: "Dashboard", icon: Home, to: "/dashboard", exact: true },
  { label: "Agendamentos", icon: Calendar, to: "/dashboard/agendamentos" },
  { label: "Serviços", icon: LayoutGrid, to: "/dashboard/servicos" },
  { label: "Profissionais", icon: Users, to: "/dashboard/profissionais" },
  { label: "Avaliações", icon: Star, to: "/dashboard/avaliacoes" },
  { label: "Pagamentos", icon: Wallet, to: "/dashboard/pagamentos" },
  { label: "Endereços", icon: MapPin, to: "/dashboard/enderecos" },
  { label: "Perfil", icon: User, to: "/dashboard/perfil" },
  { label: "Mensagens", icon: MessageSquare, to: "/dashboard/mensagens" },
  { label: "Ajuda", icon: HelpCircle, to: "/dashboard/ajuda" },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, displayName, initial } = useProfile();
  const isAdmin = useIsAdmin(user);
  const handleLogout = useLogout("/");
  const [open, setOpen] = useState(false);
  const unread = useUnreadTotalWithSound("usuario", !!user, user);

  const nav: NavItem[] = isAdmin
    ? [...NAV, { label: "Painel Admin", icon: Shield, to: "/admin" }]
    : NAV;

  // Client-side auth guard
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user || isAdmin === null) {
    return <FullPageLoader />;
  }


  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A1A2F] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 text-white">
          <Leaf className="h-5 w-5 text-[#2DD4BF]" />
          <span className="font-display text-lg">Maré Nobre</span>
        </div>
        <button aria-label="Abrir menu" onClick={() => setOpen((v) => !v)} className="text-white">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="lg:flex">
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-y-0 left-0 z-40 w-[280px] flex-shrink-0 bg-[#0A1A2F] text-white lg:sticky lg:top-0 lg:block lg:h-screen`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/5 px-7 pb-6 pt-8">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[#2DD4BF]" />
                <span
                  className="text-2xl text-white"
                  style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
                >
                  MARÉ NOBRE
                </span>
              </div>
              <p className="mt-1 pl-7 text-[10px] font-medium tracking-[0.18em] text-white/50">
                SOLUÇÕES PARA O SEU LAR
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
              {nav.map((item) => {
                const inactive = "text-white/70 hover:bg-white/5 hover:text-white";
                const active = "bg-[#2DD4BF]/15 text-white ring-1 ring-inset ring-[#2DD4BF]/30";
                const base = "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition";
                const badge = item.label === "Mensagens" ? unread : 0;
                const content = (
                  <>
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </>
                );

                if (!item.to) {
                  return (
                    <a key={item.label} href="#" className={`${base} ${inactive}`}>
                      {content}
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
                    {content}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/5 px-4 py-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center justify-end gap-4">
            <button
              aria-label="Notificações"
              className="relative rounded-full bg-white p-2.5 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-[#0A1A2F]"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#2DD4BF]" />
            </button>
            <div className="flex items-center gap-3">
              {profile?.foto_url ? (
                <img
                  src={profile.foto_url}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4BF] font-semibold text-white ring-2 ring-white">
                  {initial}
                </div>
              )}
              <span className="hidden text-sm font-semibold text-[#0A1A2F] sm:inline">
                {displayName}
              </span>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
