import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Search, MoreVertical, Pencil, KeyRound, Trash2, Power, Users as UsersIcon,
  ShieldCheck, UserCog, Clock3, Mail, Phone, X, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, NAVY, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useAdminUsuarios, useUpsertAdminUsuario, useToggleAdminUsuario, useDeleteAdminUsuario,
  type AdminUsuario, type Perfil, type StatusU, type Modulo, type Nivel, type Permissoes,
} from "@/hooks/queries/use-admin-usuarios";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: UsuariosPage,
});

type Usuario = AdminUsuario;

const PERFIL_LABEL: Record<Perfil, string> = {
  administrador: "Administrador", gerente: "Gerente", suporte: "Suporte",
  financeiro: "Financeiro", operador: "Operador",
};
const PERFIL_BADGE: Record<Perfil, string> = {
  administrador: "bg-violet-100 text-violet-700 ring-violet-200",
  gerente: "bg-blue-100 text-blue-700 ring-blue-200",
  suporte: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  financeiro: "bg-orange-100 text-orange-700 ring-orange-200",
  operador: "bg-slate-100 text-slate-700 ring-slate-200",
};
const STATUS_BADGE: Record<StatusU, string> = {
  ativo: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  inativo: "bg-slate-100 text-slate-600 ring-slate-200",
  pendente: "bg-amber-100 text-amber-700 ring-amber-200",
};
const STATUS_LABEL: Record<StatusU, string> = { ativo: "Ativo", inativo: "Inativo", pendente: "Pendente" };
const MODULOS: { id: Modulo; label: string }[] = [
  { id: "agendamentos", label: "Agendamentos" }, { id: "servicos", label: "Serviços" },
  { id: "profissionais", label: "Profissionais" }, { id: "clientes", label: "Clientes" },
  { id: "pagamentos", label: "Pagamentos" }, { id: "cupons", label: "Cupons" },
  { id: "relatorios", label: "Relatórios" }, { id: "configuracoes", label: "Configurações" },
];

const PERM_PADRAO: Record<Perfil, Permissoes> = {
  administrador: Object.fromEntries(MODULOS.map((m) => [m.id, "editar"])) as Permissoes,
  gerente: { agendamentos: "editar", servicos: "editar", profissionais: "editar", clientes: "editar", pagamentos: "visualizar", cupons: "editar", relatorios: "visualizar", configuracoes: "nenhum" },
  suporte: { agendamentos: "visualizar", servicos: "visualizar", profissionais: "visualizar", clientes: "editar", pagamentos: "nenhum", cupons: "nenhum", relatorios: "nenhum", configuracoes: "nenhum" },
  financeiro: { agendamentos: "visualizar", servicos: "nenhum", profissionais: "nenhum", clientes: "visualizar", pagamentos: "editar", cupons: "visualizar", relatorios: "visualizar", configuracoes: "nenhum" },
  operador: { agendamentos: "editar", servicos: "visualizar", profissionais: "visualizar", clientes: "visualizar", pagamentos: "nenhum", cupons: "nenhum", relatorios: "nenhum", configuracoes: "nenhum" },
};

const PERFIL_DESC: Record<Perfil, string> = {
  administrador: "Acesso total ao sistema, incluindo configurações e gestão de usuários.",
  gerente: "Gerencia operação diária: agendamentos, serviços, clientes e profissionais.",
  suporte: "Atende clientes e ajusta cadastros; sem acesso financeiro.",
  financeiro: "Foca em pagamentos, cupons e relatórios financeiros.",
  operador: "Executa e atualiza agendamentos do dia a dia.",
};

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
const fmtDateTime = (iso: string | null) => iso ? format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

function UsuariosPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const { data: lista = [], isLoading } = useAdminUsuarios();
  const upsert = useUpsertAdminUsuario();
  const toggle = useToggleAdminUsuario();
  const remove = useDeleteAdminUsuario();

  const [busca, setBusca] = useState("");
  const [perfilF, setPerfilF] = useState<"todos" | Perfil>("todos");
  const [statusF, setStatusF] = useState<"todos" | StatusU>("todos");

  const [editando, setEditando] = useState<Usuario | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);
  const [perfisAberto, setPerfisAberto] = useState(false);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((u) => {
      if (perfilF !== "todos" && u.perfil !== perfilF) return false;
      if (statusF !== "todos" && u.status !== statusF) return false;
      if (q && !(u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [lista, busca, perfilF, statusF]);

  const kpis = useMemo(() => ({
    total: lista.length,
    ativos: lista.filter((u) => u.status === "ativo").length,
    admins: lista.filter((u) => u.perfil === "administrador").length,
    pendentes: lista.filter((u) => u.status === "pendente").length,
  }), [lista]);

  if (loading || isAdmin === null) return <FullPageLoader />;
  if (!user || !isAdmin) return null;

  const abrirNovo = () => { setEditando(null); setModalAberto(true); };
  const abrirEdicao = (u: Usuario) => { setEditando(u); setModalAberto(true); };

  const salvarUsuario = async (u: Usuario, enviarConvite: boolean) => {
    try {
      await upsert.mutateAsync({
        id: editando ? u.id : undefined,
        nome: u.nome, email: u.email, telefone: u.telefone,
        perfil: u.perfil, status: u.status, permissoes: u.permissoes,
      });
      setModalAberto(false);
      toast.success(editando ? "Usuário atualizado" : `Usuário criado${enviarConvite ? " — convite enviado por e-mail" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const toggleAtivo = async (u: Usuario) => {
    try {
      await toggle.mutateAsync(u);
      toast.success(u.status === "ativo" ? "Usuário desativado" : "Usuário ativado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar");
    }
  };
  const redefinirSenha = async (u: Usuario) => {
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(`Não foi possível enviar o link para ${u.email}.`);
      return;
    }
    toast.success(`Link de redefinição enviado para ${u.email}.`);
  };
  const excluir = async (u: Usuario) => {
    try {
      await remove.mutateAsync(u.id);
      setExcluindo(null);
      toast.success("Acesso removido da plataforma.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  return (
    <AdminShell
      active="usuarios"
      title="Usuários"
      subtitle="Controle acessos, perfis e permissões do time no painel administrativo."
      actions={
        <Button onClick={abrirNovo} className="h-10 gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total de usuários" value={kpis.total} icon={<UsersIcon className="h-5 w-5" />} tint="slate" />
        <KpiCard label="Usuários ativos" value={kpis.ativos} icon={<Power className="h-5 w-5" />} tint="emerald" />
        <KpiCard label="Administradores" value={kpis.admins} icon={<ShieldCheck className="h-5 w-5" />} tint="violet" />
        <KpiCard label="Pendentes de ativação" value={kpis.pendentes} icon={<Clock3 className="h-5 w-5" />} tint="amber" highlight={kpis.pendentes > 0} />
      </div>

      <Panel className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="h-10 pl-9" />
          </div>
          <Select value={perfilF} onValueChange={(v) => setPerfilF(v as typeof perfilF)}>
            <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os perfis</SelectItem>
              {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => <SelectItem key={p} value={p}>{PERFIL_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={(v) => setStatusF(v as typeof statusF)}>
            <SelectTrigger className="h-10 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABEL) as StatusU[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <Panel className="mt-6 !p-0">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Perfil</th>
                <th className="px-5 py-3">Último acesso</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">{initials(u.nome)}</AvatarFallback></Avatar>
                      <span className="font-medium text-[#0A1128]">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3"><Badge className={PERFIL_BADGE[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge></td>
                  <td className="px-5 py-3 text-slate-600">{fmtDateTime(u.ultimo_acesso)}</td>
                  <td className="px-5 py-3"><Badge className={STATUS_BADGE[u.status]}>{STATUS_LABEL[u.status]}</Badge></td>
                  <td className="px-5 py-3 text-slate-600">{fmtDate(u.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetalhe(u)}><Eye className="h-4 w-4" /></Button>
                      <RowMenu u={u} onEdit={() => abrirEdicao(u)} onReset={() => redefinirSenha(u)} onToggle={() => toggleAtivo(u)} onDelete={() => setExcluindo(u)} />
                    </div>
                  </td>
                </tr>
              ))}
              {!filtrada.length && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                  {isLoading ? "Carregando..." : "Nenhum usuário encontrado."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {filtrada.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">{initials(u.nome)}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-semibold text-[#0A1128]">{u.nome}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <RowMenu u={u} onEdit={() => abrirEdicao(u)} onReset={() => redefinirSenha(u)} onToggle={() => toggleAtivo(u)} onDelete={() => setExcluindo(u)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={PERFIL_BADGE[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge>
                <Badge className={STATUS_BADGE[u.status]}>{STATUS_LABEL[u.status]}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">Último acesso: {fmtDateTime(u.ultimo_acesso)}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setDetalhe(u)}>Ver detalhes</Button>
            </div>
          ))}
          {!filtrada.length && (
            <p className="py-10 text-center text-sm text-slate-500">
              {isLoading ? "Carregando..." : "Nenhum usuário encontrado."}
            </p>
          )}
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0A1128]">Perfis de acesso</h3>
            <p className="text-xs text-slate-500">Perfis padrão e suas descrições.</p>
          </div>
          <Button variant="outline" onClick={() => setPerfisAberto(true)} className="gap-2"><UserCog className="h-4 w-4" /> Gerenciar perfis</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Perfil</th>
                <th className="py-2 pr-4">Descrição</th>
                <th className="py-2 pr-4">Usuários</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => (
                <tr key={p} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4"><Badge className={PERFIL_BADGE[p]}>{PERFIL_LABEL[p]}</Badge></td>
                  <td className="py-3 pr-4 text-slate-600">{PERFIL_DESC[p]}</td>
                  <td className="py-3 pr-4 text-slate-700">{lista.filter((u) => u.perfil === p).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <UsuarioDialog
        open={modalAberto}
        onOpenChange={setModalAberto}
        editando={editando}
        onSalvar={salvarUsuario}
      />

      <DetalheDrawer u={detalhe} onOpenChange={(o) => !o && setDetalhe(null)} onEdit={(u) => { setDetalhe(null); abrirEdicao(u); }} onReset={redefinirSenha} onToggle={toggleAtivo} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o acesso de <strong>{excluindo?.nome}</strong>? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => excluindo && excluir(excluindo)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={perfisAberto} onOpenChange={setPerfisAberto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar perfis</DialogTitle>
            <DialogDescription>Permissões padrão aplicadas ao criar um novo usuário.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Módulo</th>
                  {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => <th key={p} className="px-3 py-2">{PERFIL_LABEL[p]}</th>)}
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{m.label}</td>
                    {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => (
                      <td key={p} className="px-3 py-2"><NivelPill nivel={PERM_PADRAO[p][m.id]} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerfisAberto(false)}>Fechar</Button>
            <Button style={{ background: TEAL }} className="text-white hover:opacity-90" onClick={() => { setPerfisAberto(false); toast.success("Perfis de acesso atualizados."); }}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function KpiCard({ label, value, icon, tint, highlight }: { label: string; value: number; icon: React.ReactNode; tint: "slate" | "emerald" | "violet" | "amber"; highlight?: boolean }) {
  const tintMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <Panel className={cn("!p-5", highlight && "ring-2 ring-amber-300")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tintMap[tint])}>{icon}</div>
      </div>
    </Panel>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", className)}>{children}</span>;
}

function NivelPill({ nivel }: { nivel: Nivel }) {
  const map: Record<Nivel, string> = {
    editar: "bg-emerald-100 text-emerald-700",
    visualizar: "bg-blue-100 text-blue-700",
    nenhum: "bg-slate-100 text-slate-500",
  };
  const label: Record<Nivel, string> = { editar: "Editar", visualizar: "Visualizar", nenhum: "—" };
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", map[nivel])}>{label[nivel]}</span>;
}

function RowMenu({ u, onEdit, onReset, onToggle, onDelete }: { u: Usuario; onEdit: () => void; onReset: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onReset}><KeyRound className="mr-2 h-4 w-4" /> Redefinir senha</DropdownMenuItem>
        <DropdownMenuItem onClick={onToggle}><Power className="mr-2 h-4 w-4" /> {u.status === "ativo" ? "Desativar" : "Ativar"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-rose-600 focus:text-rose-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UsuarioDialog({ open, onOpenChange, editando, onSalvar }: {
  open: boolean; onOpenChange: (o: boolean) => void; editando: Usuario | null;
  onSalvar: (u: Usuario, enviarConvite: boolean) => void;
}) {
  const [form, setForm] = useState<Usuario>(() => vazio());
  const [convite, setConvite] = useState(true);

  useMemoReset(open, () => {
    setForm(editando ? { ...editando, permissoes: { ...editando.permissoes } } : vazio());
    setConvite(!editando);
  });

  const set = <K extends keyof Usuario>(k: K, v: Usuario[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setPerm = (m: Modulo, n: Nivel) => setForm((f) => ({ ...f, permissoes: { ...f.permissoes, [m]: n } }));

  const submit = () => {
    if (!form.nome.trim() || !form.email.trim()) { toast.error("Informe nome e e-mail para continuar."); return; }
    onSalvar(form, convite);
  };

  const aplicarPadrao = (p: Perfil) => setForm((f) => ({ ...f, perfil: p, permissoes: { ...PERM_PADRAO[p] } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>Preencha os dados e defina o nível de acesso.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Nome completo</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Ana Beatriz Costa" /></div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="usuario@marenobre.com.br" /></div>
          <div><Label>Telefone (opcional)</Label><Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} placeholder="(21) 99000-0000" /></div>
          <div>
            <Label>Perfil / Função</Label>
            <Select value={form.perfil} onValueChange={(v) => aplicarPadrao(v as Perfil)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => <SelectItem key={p} value={p}>{PERFIL_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div><p className="text-sm font-medium">Usuário ativo</p><p className="text-xs text-slate-500">Permite acesso ao painel</p></div>
              <Switch checked={form.status === "ativo"} onCheckedChange={(v) => set("status", v ? "ativo" : "inativo")} />
            </div>
          </div>
        </div>

        <div className="mt-2">
          <p className="mb-2 text-sm font-semibold text-[#0A1128]">Permissões por módulo</p>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-2">Módulo</th><th className="px-3 py-2">Nenhum</th><th className="px-3 py-2">Visualizar</th><th className="px-3 py-2">Editar</th></tr>
              </thead>
              <tbody>
                {MODULOS.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{m.label}</td>
                    {(["nenhum", "visualizar", "editar"] as Nivel[]).map((n) => (
                      <td key={n} className="px-3 py-2">
                        <input type="radio" name={`perm-${m.id}`} checked={form.permissoes[m.id] === n} onChange={() => setPerm(m.id, n)} className="h-4 w-4 accent-[#0FA98A]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!editando && (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={convite} onCheckedChange={(v) => setConvite(!!v)} /> Enviar convite por e-mail em vez de definir senha manualmente
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} style={{ background: TEAL }} className="text-white hover:opacity-90">Salvar usuário</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetalheDrawer({ u, onOpenChange, onEdit, onReset, onToggle }: {
  u: Usuario | null; onOpenChange: (o: boolean) => void;
  onEdit: (u: Usuario) => void; onReset: (u: Usuario) => void; onToggle: (u: Usuario) => void;
}) {
  return (
    <Sheet open={!!u} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {u && (
          <>
            <SheetHeader>
              <SheetTitle>Detalhes do usuário</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex items-center gap-4">
              <Avatar className="h-14 w-14"><AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">{initials(u.nome)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-[#0A1128]">{u.nome}</p>
                <p className="truncate text-sm text-slate-500">{u.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className={PERFIL_BADGE[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge>
                  <Badge className={STATUS_BADGE[u.status]}>{STATUS_LABEL[u.status]}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={u.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={u.telefone ?? "—"} />
              <InfoRow icon={<Clock3 className="h-4 w-4" />} label="Último acesso" value={fmtDateTime(u.ultimo_acesso)} />
              <InfoRow icon={<Clock3 className="h-4 w-4" />} label="Criado em" value={fmtDate(u.created_at)} />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-[#0A1128]">Permissões</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr><th className="px-3 py-2">Módulo</th><th className="px-3 py-2">Nível</th></tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((m) => (
                      <tr key={m.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{m.label}</td>
                        <td className="px-3 py-2"><NivelPill nivel={u.permissoes[m.id] ?? "nenhum"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => onEdit(u)} style={{ background: NAVY }} className="text-white hover:opacity-90"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
              <Button variant="outline" onClick={() => onReset(u)}><KeyRound className="mr-2 h-4 w-4" /> Redefinir senha</Button>
              <Button variant="outline" onClick={() => onToggle(u)}><Power className="mr-2 h-4 w-4" /> {u.status === "ativo" ? "Desativar" : "Ativar"}</Button>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{icon}{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function vazio(): Usuario {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), user_id: null, nome: "", email: "", telefone: "",
    perfil: "operador", status: "pendente",
    permissoes: { ...PERM_PADRAO.operador },
    ultimo_acesso: null, created_at: now, updated_at: now,
  };
}

function useMemoReset(dep: boolean, fn: () => void) {
  const [prev, setPrev] = useState(dep);
  if (prev !== dep) { setPrev(dep); if (dep) fn(); }
}
