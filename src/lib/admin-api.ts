import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://sgkipojbdrvnrqfddeab.supabase.co';

/**
 * Utilitário para chamadas das Edge Functions administrativas
 */
export class AdminAPI {
  private static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private static async makeRequest(endpoint: string, data?: any): Promise<any> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Verifica se o usuário atual é administrador
   */
  static async verifyAdmin(): Promise<{
    isAdmin: boolean;
    email?: string;
    userId?: string;
    error?: string;
  }> {
    return this.makeRequest('verify-admin');
  }

  /**
   * Obtém estatísticas do sistema
   */
  static async getSystemStats(): Promise<{
    success: boolean;
    data?: {
      totalUsers: number;
      totalCars: number;
      totalRevenue: number;
      totalExpenses: number;
      activeSubscriptions: number;
      expiredSubscriptions: number;
    };
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'get_stats'
    });
  }

  /**
   * Obtém lista de usuários administradores
   */
  static async getAdminUsers(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'get_admin_users'
    });
  }

  /**
   * Obtém logs de auditoria
   */
  static async getAuditLogs(limit: number = 50): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'get_audit_logs',
      data: { limit }
    });
  }

  /**
   * Adiciona um novo administrador
   */
  static async addAdmin(email: string, userId?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'add_admin',
      data: { email, userId }
    });
  }

  /**
   * Remove um administrador
   */
  static async removeAdmin(userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'remove_admin',
      data: { userId }
    });
  }

  /**
   * Atualiza assinatura de um usuário
   */
  static async updateUserSubscription(
    userId: string,
    status: string,
    plan: string,
    expiresAt?: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'update_subscription',
      data: { userId, status, plan, expiresAt }
    });
  }

  /**
   * Busca usuários por nome, email, telefone, CPF ou placa
   */
  static async searchUsers(query: string, limit: number = 50): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'search_users',
      data: { query, limit }
    });
  }

  /**
   * Obtém detalhes completos de um usuário
   */
  static async getUserDetails(userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'get_user_details',
      data: { userId }
    });
  }

  /**
   * Atualiza dados de um usuário
   */
  static async updateUser(userId: string, updates: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'update_user',
      data: { userId, updates }
    });
  }

  /**
   * Exclui ou desativa um usuário
   */
  static async deleteUser(userId: string, deleteAllData: boolean = false): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'delete_user',
      data: { userId, deleteAllData }
    });
  }

  /**
   * Obtém lista paginada de todos os usuários
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    success: boolean;
    data?: {
      users: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    return this.makeRequest('admin-operations', {
      operation: 'get_all_users',
      data: { page, limit, sortBy, sortOrder }
    });
  }
}