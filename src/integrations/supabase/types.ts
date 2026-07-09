export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          perfil: string
          permissoes: Json
          status: string
          telefone: string | null
          ultimo_acesso: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          perfil?: string
          permissoes?: Json
          status?: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          perfil?: string
          permissoes?: Json
          status?: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          desconto: number
          endereco: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          preco: number | null
          profissional_id: string | null
          servico: string
          status: Database["public"]["Enums"]["booking_status"]
          total: number | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data: string
          desconto?: number
          endereco?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          preco?: number | null
          profissional_id?: string | null
          servico: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          desconto?: number
          endereco?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          preco?: number | null
          profissional_id?: string | null
          servico?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          agendamento_id: string
          cliente_id: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          profissional_id: string | null
        }
        Insert: {
          agendamento_id: string
          cliente_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          profissional_id?: string | null
        }
        Update: {
          agendamento_id?: string
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          profissional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          created_at: string
          id: string
          nao_lidas_admin: number
          nao_lidas_usuario: number
          ultima_mensagem: string | null
          ultima_mensagem_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nao_lidas_admin?: number
          nao_lidas_usuario?: number
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nao_lidas_admin?: number
          nao_lidas_usuario?: number
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cupom_usos: {
        Row: {
          agendamento_id: string | null
          cliente_id: string | null
          created_at: string
          cupom_id: string
          id: string
          valor_desconto: number
          valor_pedido: number
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id?: string | null
          created_at?: string
          cupom_id: string
          id?: string
          valor_desconto?: number
          valor_pedido?: number
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string | null
          created_at?: string
          cupom_id?: string
          id?: string
          valor_desconto?: number
          valor_pedido?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupom_usos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupom_usos_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          aplicavel: Database["public"]["Enums"]["cupom_aplicavel"]
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          desconto_max: number | null
          descricao: string
          fim: string
          id: string
          inicio: string
          limite_por_cliente: number
          limite_total: number
          min_pedido: number | null
          servicos: string[]
          tipo: Database["public"]["Enums"]["cupom_tipo"]
          updated_at: string
          valor: number
        }
        Insert: {
          aplicavel?: Database["public"]["Enums"]["cupom_aplicavel"]
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          desconto_max?: number | null
          descricao?: string
          fim: string
          id?: string
          inicio?: string
          limite_por_cliente?: number
          limite_total?: number
          min_pedido?: number | null
          servicos?: string[]
          tipo?: Database["public"]["Enums"]["cupom_tipo"]
          updated_at?: string
          valor?: number
        }
        Update: {
          aplicavel?: Database["public"]["Enums"]["cupom_aplicavel"]
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          desconto_max?: number | null
          descricao?: string
          fim?: string
          id?: string
          inicio?: string
          limite_por_cliente?: number
          limite_total?: number
          min_pedido?: number | null
          servicos?: string[]
          tipo?: Database["public"]["Enums"]["cupom_tipo"]
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          cliente_id: string
          complemento: string | null
          created_at: string
          estado: string
          id: string
          logradouro: string
          numero: string
          principal: boolean
          rotulo: string
          updated_at: string
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          cliente_id: string
          complemento?: string | null
          created_at?: string
          estado: string
          id?: string
          logradouro: string
          numero: string
          principal?: boolean
          rotulo?: string
          updated_at?: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          cliente_id?: string
          complemento?: string | null
          created_at?: string
          estado?: string
          id?: string
          logradouro?: string
          numero?: string
          principal?: boolean
          rotulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          anexo_url: string | null
          autor_id: string
          autor_tipo: Database["public"]["Enums"]["autor_mensagem"]
          conteudo: string
          conversa_id: string
          created_at: string
          id: string
          lida: boolean
        }
        Insert: {
          anexo_url?: string | null
          autor_id: string
          autor_tipo: Database["public"]["Enums"]["autor_mensagem"]
          conteudo: string
          conversa_id: string
          created_at?: string
          id?: string
          lida?: boolean
        }
        Update: {
          anexo_url?: string | null
          autor_id?: string
          autor_tipo?: Database["public"]["Enums"]["autor_mensagem"]
          conteudo?: string
          conversa_id?: string
          created_at?: string
          id?: string
          lida?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          metodo: string | null
          status: Database["public"]["Enums"]["payment_status"]
          valor: number
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          metodo?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          valor: number
        }
        Update: {
          agendamento_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          metodo?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          last_seen: string | null
          nome: string | null
          telefone: string | null
          tipo_usuario: Database["public"]["Enums"]["user_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id: string
          last_seen?: string | null
          nome?: string | null
          telefone?: string | null
          tipo_usuario?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          last_seen?: string | null
          nome?: string | null
          telefone?: string | null
          tipo_usuario?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitantes: {
        Row: {
          first_seen: string
          last_seen: string
          path: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          first_seen?: string
          last_seen?: string
          path?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          first_seen?: string
          last_seen?: string
          path?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_agendamento_conflito: {
        Args: {
          p_data: string
          p_fim: string
          p_ignorar?: string
          p_inicio: string
          p_profissional: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validar_cupom: {
        Args: {
          p_cliente_id?: string
          p_codigo: string
          p_valor_pedido: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      autor_mensagem: "admin" | "usuario"
      booking_status: "confirmado" | "concluido" | "cancelado" | "pendente"
      cupom_aplicavel: "todos" | "especificos" | "primeira"
      cupom_tipo: "percentual" | "fixo" | "frete"
      payment_status: "pago" | "pendente" | "estornado"
      user_type: "cliente" | "profissional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      autor_mensagem: ["admin", "usuario"],
      booking_status: ["confirmado", "concluido", "cancelado", "pendente"],
      cupom_aplicavel: ["todos", "especificos", "primeira"],
      cupom_tipo: ["percentual", "fixo", "frete"],
      payment_status: ["pago", "pendente", "estornado"],
      user_type: ["cliente", "profissional"],
    },
  },
} as const
