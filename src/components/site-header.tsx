import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/use-auth";

const navLinks: { label: string; to: string; exact?: boolean }[] = [
  { label: "Início", to: "/", exact: true },
  { label: "Serviços", to: "/servicos" },
  { label: "Como funciona", to: "/como-funciona" },
  
  { label: "Avaliações", to: "/avaliacoes" },
  { label: "Contato", to: "/contato" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  // On the homepage the header floats over the hero and becomes glassy on scroll.
  // On other pages it uses the solid navy gradient and stays sticky.
  const linkBase =
    "group relative text-sm font-medium text-white/80 transition-colors hover:text-white";
  const linkActive = "text-white";

  return (
    <header
      className={
        transparent
          ? `fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
              scrolled
                ? "border-b border-white/10 bg-[#00132a]/85 backdrop-blur-xl shadow-lg shadow-black/20"
                : "bg-transparent"
            }`
          : "sticky top-0 z-30 border-b border-white/5 text-white"
      }
      style={
        transparent
          ? undefined
          : { background: "var(--gradient-hero)" }
      }
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={logo}
            alt="Maré Nobre"
            className="h-12 w-auto sm:h-[56px]"
          />
        </Link>

        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact ?? false }}
              className={`${linkBase} px-3 py-2`}
              activeProps={{ className: `${linkBase} ${linkActive} px-3 py-2` }}
            >
              {l.label}
              <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-[#2DD4BF] transition-transform duration-300 group-hover:scale-x-100 group-[.text-white]:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? null : user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Meu painel</span>
              <span className="sm:hidden">Painel</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/60 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
              >
                Cadastrar
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-1 rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden">
          <div
            className="border-t border-white/10 px-6 py-4"
            style={{ background: "#00132a" }}
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: l.exact ?? false }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  activeProps={{
                    className:
                      "rounded-lg px-3 py-2.5 text-sm font-medium text-[#2DD4BF] bg-white/5",
                  }}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg bg-[#2DD4BF] px-3 py-2.5 text-center text-sm font-semibold text-white sm:hidden"
                >
                  Meu painel
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg border border-white/25 px-3 py-2.5 text-center text-sm font-medium text-white sm:hidden"
                >
                  Entrar
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
