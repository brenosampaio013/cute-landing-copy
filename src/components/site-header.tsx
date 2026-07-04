import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import logo from "@/assets/logo.png";

const navLinks: { label: string; to: string; exact?: boolean }[] = [
  { label: "Início", to: "/", exact: true },
  { label: "Serviços", to: "/servicos" },
  { label: "Como funciona", to: "/como-funciona" },
  { label: "Profissionais", to: "/profissionais" },
  { label: "Avaliações", to: "/avaliacoes" },
  { label: "Contato", to: "/contato" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const base =
    "text-sm font-medium transition text-white/85 hover:text-white";
  const active = "text-[#2DD4BF] hover:text-[#2DD4BF]";

  return (
    <header
      className={
        transparent
          ? "relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5"
          : "sticky top-0 z-30 border-b border-white/5 text-white"
      }
      style={
        transparent
          ? undefined
          : { background: "linear-gradient(160deg, #00132a 0%, #001a36 55%, #022543 100%)" }
      }
    >
      <div
        className={
          transparent
            ? "contents"
            : "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4"
        }
      >
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={logo}
            alt="Maré Nobre"
            className="h-14 w-auto sm:h-[60px]"
          />
        </Link>

        <nav className="hidden flex-1 justify-center gap-5 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact ?? false }}
              className={base}
              activeProps={{ className: active }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-md bg-brand-teal-deep px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
          >
            Cadastrar
          </Link>
          <button className="lg:hidden text-white" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
