import { describe, it, expect } from "vitest";
import {
  PRINCIPAL,
  GERENCIAMENTO,
  SIDEBAR_SECTIONS,
  SIDEBAR_HELP_TITLE,
  SIDEBAR_HELP_SUBTITLE,
} from "./admin-shell";

/**
 * Guarda contra corrupção de textos da sidebar (bugs de tradução automática,
 * autocorreção, ou edições acidentais). Qualquer alteração de capitalização
 * ou conteúdo dos labels quebrará este teste.
 */
describe("AdminShell — labels da sidebar", () => {
  it("PRINCIPAL: labels exatos, na ordem correta", () => {
    expect(PRINCIPAL.map((i) => [i.key, i.label])).toEqual([
      ["dashboard", "Dashboard"],
      ["agendamentos", "Agendamentos"],
      ["servicos", "Serviços"],
      ["profissionais", "Profissionais"],
      ["clientes", "Clientes"],
      ["pagamentos", "Pagamentos"],
      ["avaliacoes", "Avaliações"],
      ["mensagens", "Mensagens"],
      ["cupons", "Cupons"],
      ["relatorios", "Relatórios"],
    ]);
  });

  it("GERENCIAMENTO: labels exatos, na ordem correta", () => {
    expect(GERENCIAMENTO.map((i) => [i.key, i.label])).toEqual([
      ["usuarios", "Usuários"],
      ["categorias", "Categorias"],
      ["configuracoes", "Configurações"],
      ["notificacoes", "Notificações"],
      ["logs", "Logs do sistema"],
    ]);
  });

  it("Títulos das seções em CAIXA ALTA", () => {
    expect(SIDEBAR_SECTIONS.PRINCIPAL).toBe("PRINCIPAL");
    expect(SIDEBAR_SECTIONS.GERENCIAMENTO).toBe("GERENCIAMENTO");
  });

  it("Card de ajuda com textos exatos", () => {
    expect(SIDEBAR_HELP_TITLE).toBe("Precisa de ajuda?");
    expect(SIDEBAR_HELP_SUBTITLE).toBe("Central de ajuda");
  });

  it("Todos os labels seguem 'Primeira Letra Maiúscula'", () => {
    const all = [...PRINCIPAL, ...GERENCIAMENTO];
    for (const item of all) {
      expect(item.label.charAt(0)).toBe(item.label.charAt(0).toUpperCase());
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});
