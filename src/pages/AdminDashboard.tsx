import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  Car, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  LogOut,
  UserPlus,
  UserMinus,
  Eye,
  Settings,
  BarChart3,
  Search,
  Filter,
  Calendar,
  Plus,
  Moon,
  Sun,
  SortAsc,
  SortDesc,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  User,
  Volume2,
  VolumeX,
  Download,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminAPI } from "@/lib/admin-api";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useSounds } from "@/hooks/useSounds";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminStats {
  totalUsers: number;
  totalCars: number;
  totalRevenue: number;
  totalExpenses: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialSubscriptions?: number;
  suspendedSubscriptions?: number;
  expiringThisMonth?: number;
  expiredThisMonth?: number;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  subscription_expires_at: string;
  subscription_status: 'active' | 'trial' | 'expired' | 'suspended';
  subscription_plan: string;
  cars?: any[];
  summary?: {
    totalCars: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

interface FilterOptions {
  status: string;
  plan: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  expirationFilter: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings: soundSettings, toggleSounds, playSound } = useSounds();
  const isMobile = useIsMobile();
  
  // Core states
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // UI states
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('admin-theme');
      return savedTheme ? savedTheme === 'dark' : true; // Default to dark
    }
    return true; // Default to dark
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    plan: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    expirationFilter: 'all'
  });
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('admin-theme');
      if (savedTheme === 'dark' || !savedTheme) { // Default to dark if no saved theme
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Apply dark mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('admin-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('admin-theme', 'light');
      }
    }
  }, [darkMode]);

  // Filter and search users
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.company_name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.subscription_status === filters.status);
    }

    // Apply plan filter
    if (filters.plan !== 'all') {
      filtered = filtered.filter(user => user.subscription_plan === filters.plan);
    }

    // Apply expiration filter
    if (filters.expirationFilter !== 'all') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(user => {
        if (!user.subscription_expires_at) return filters.expirationFilter === 'no-expiration';
        
        const expirationDate = new Date(user.subscription_expires_at);
        
        switch (filters.expirationFilter) {
          case 'expired':
            return expirationDate < now;
          case 'expiring-soon':
            return expirationDate >= now && expirationDate <= thirtyDaysFromNow;
          case 'active':
            return expirationDate > thirtyDaysFromNow;
          case 'no-expiration':
            return false;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.full_name?.toLowerCase() || '';
          bValue = b.full_name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'created':
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
        case 'expiration':
          aValue = a.subscription_expires_at ? new Date(a.subscription_expires_at) : new Date('2099-12-31');
          bValue = b.subscription_expires_at ? new Date(b.subscription_expires_at) : new Date('2099-12-31');
          break;
        case 'status':
          aValue = a.subscription_status || '';
          bValue = b.subscription_status || '';
          break;
        default:
          aValue = a.full_name?.toLowerCase() || '';
          bValue = b.full_name?.toLowerCase() || '';
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchQuery, filters]);

  // Verify admin status on component mount
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!session?.access_token) {
        navigate('/admin-login');
        return;
      }

      try {
        // Add retry logic for admin verification
        let retries = 3;
        let data;
        
        while (retries > 0) {
          try {
            data = await AdminAPI.verifyAdmin();
            break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!data?.isAdmin) {
          throw new Error('Not an admin');
        }

        setIsAdmin(true);
        await loadDashboardData();
      } catch (error) {
        console.error('Admin verification failed:', error);
        setError('Acesso negado. Você não tem permissões de administrador.');
        setTimeout(() => {
          navigate('/admin-login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAccess();
  }, [session, navigate, signOut]);

  const loadDashboardData = async () => {
    try {
      // Load admin statistics
      await Promise.all([
        loadStats(),
        loadAdminUsers(),
        loadAuditLogs(),
        loadAllUsers()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Erro ao carregar dados do painel');
    }
  };

  const loadStats = async () => {
    try {
      const response = await AdminAPI.getSystemStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await AdminAPI.getAdminUsers();
      if (response.success && response.data) {
        setAdminUsers(response.data);
      } else {
        throw new Error(response.error || 'Failed to load admin users');
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await AdminAPI.getAuditLogs(50);
      if (response.success && response.data) {
        setAuditLogs(response.data);
      } else {
        throw new Error(response.error || 'Failed to load audit logs');
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await AdminAPI.getAllUsers(1, 1000); // Load all users for filtering
      if (response.success && response.data) {
        setUsers(response.data.users);
      } else {
        throw new Error(response.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // User management functions
  const handleViewUser = async (user: User) => {
    setLoading(true);
    try {
      const response = await AdminAPI.getUserDetails(user.id);
      if (response.success && response.data) {
        setSelectedUser(response.data);
        setShowUserDetails(true);
      } else {
        toast.error(response.error || 'Erro ao carregar detalhes');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      company_name: user.company_name,
      subscription_status: user.subscription_status,
      subscription_plan: user.subscription_plan,
      subscription_expires_at: user.subscription_expires_at?.split('T')[0] || ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const updateData = { ...editForm };
      
      if (!updateData.subscription_expires_at || updateData.subscription_expires_at.trim() === '') {
        delete updateData.subscription_expires_at;
      } else {
        updateData.subscription_expires_at = new Date(updateData.subscription_expires_at + 'T23:59:59.999Z').toISOString();
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await AdminAPI.updateUser(selectedUser.id, updateData);
      if (response.success) {
        toast.success('Usuário atualizado com sucesso!');
        setShowEditUser(false);
        await loadAllUsers();
      } else {
        toast.error(response.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, deleteAllData: boolean = false) => {
    if (!confirm(`Tem certeza que deseja ${deleteAllData ? 'excluir permanentemente este usuário? Esta ação não pode ser desfeita e removerá todos os dados do usuário, incluindo a conta de autenticação' : 'desativar'} este usuário?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await AdminAPI.deleteUser(userId, deleteAllData);
      if (response.success) {
        toast.success(deleteAllData ? 'Usuário excluído permanentemente!' : 'Usuário desativado!');
        
        // Force update the users list
        if (deleteAllData) {
          // Remove from local state immediately for permanent deletion
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
          setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        } else {
          // Update status for deactivation
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === userId 
              ? { ...user, subscription_status: 'suspended' }
              : user
          ));
          setFilteredUsers(prevUsers => prevUsers.map(user => 
            user.id === userId 
              ? { ...user, subscription_status: 'suspended' }
              : user
          ));
        }
        
        // Also reload from server to ensure consistency
        await loadAllUsers();
        
        // Close any open dialogs
        setShowUserDetails(false);
        setShowEditUser(false);
      } else {
        toast.error(response.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (email: string) => {
    setLoading(true);
    try {
      const response = await AdminAPI.addAdmin(email);
      if (response.success) {
        toast.success('Administrador adicionado com sucesso!');
        setShowAddAdmin(false);
        await loadAdminUsers();
      } else {
        toast.error(response.error || 'Erro ao adicionar administrador');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Erro ao adicionar administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOneMonth = async (user: User) => {
    setLoading(true);
    try {
      let newExpiration: Date;
      const now = new Date();
      
      if (user.subscription_expires_at) {
        const currentExpiration = new Date(user.subscription_expires_at);
        
        // Se a assinatura ainda está ativa (data de expiração é futura)
        if (currentExpiration > now) {
          // Adiciona 30 dias à data de expiração atual
          newExpiration = new Date(currentExpiration);
          newExpiration.setDate(newExpiration.getDate() + 30);
        } else {
          // Se a assinatura já expirou, adiciona 30 dias a partir de hoje
          newExpiration = new Date(now);
          newExpiration.setDate(newExpiration.getDate() + 30);
        }
      } else {
        // Se não tem data de expiração, define para 30 dias a partir de hoje
        newExpiration = new Date(now);
        newExpiration.setDate(newExpiration.getDate() + 30);
      }

      const response = await AdminAPI.updateUser(user.id, {
        subscription_expires_at: newExpiration.toISOString(),
        subscription_status: 'active'
      });
      
      if (response.success) {
        toast.success('Adicionado +30 dias com sucesso!');
        await loadAllUsers();
        // Fechar dialogs se estiverem abertos
        setShowUserDetails(false);
        setShowEditUser(false);
      } else {
        toast.error(response.error || 'Erro ao adicionar tempo');
      }
    } catch (error) {
      console.error('Error adding month:', error);
      toast.error('Erro ao adicionar tempo');
    } finally {
      setLoading(false);
    }
  };

  // Sound and theme handlers
  const handleSoundToggle = () => {
    const wasEnabled = soundSettings.enabled;
    
    // Se estava desabilitado e vai ser habilitado, toca um som de confirmação
    if (!wasEnabled) {
      // Primeiro ativa os sons
      toggleSounds();
      // Depois toca o som de confirmação usando requestAnimationFrame para garantir que o estado foi atualizado
      requestAnimationFrame(() => {
        playSound('success');
      });
    } else {
      // Se estava habilitado, apenas desativa
      toggleSounds();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate('/admin/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error("Erro ao sair da conta");
    }
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Indefinido
        </Badge>
      );
    }

    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle },
      trial: { label: 'Trial', variant: 'secondary' as const, icon: Clock },
      expired: { label: 'Expirado', variant: 'destructive' as const, icon: XCircle },
      suspended: { label: 'Suspenso', variant: 'outline' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: AlertCircle 
    };
    
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isExpiringThisMonth = (dateString: string) => {
    if (!dateString) return false;
    const expirationDate = new Date(dateString);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expirationDate >= now && expirationDate <= thirtyDaysFromNow;
  };

  const isExpired = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/admin-login')} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Modern Header */}
        <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      <span className="sm:hidden">Painel</span>
                      <span className="hidden sm:inline">Painel Administrativo</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Auto Gestor Fleet Manager</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme Toggle - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Moon className="h-4 w-4" />
                </div>

                <Badge variant="secondary" className="gap-1 hidden sm:flex">
                  <Shield className="w-3 h-3" />
                  {user?.email}
                </Badge>
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative flex items-center gap-2 h-10 px-2 rounded-full hover:bg-accent">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt={user?.user_metadata?.full_name || user?.email} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {(user?.user_metadata?.full_name || user?.email || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 max-w-[calc(100vw-2rem)] mx-4 sm:mx-8" 
                    align={isMobile ? "center" : "end"}
                    side="bottom" 
                    sideOffset={8}
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-3 p-2">
                        {/* User Info Header */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt={user?.user_metadata?.full_name || user?.email} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                              {(user?.user_metadata?.full_name || user?.email || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        
                        {/* Admin Status */}
                        <div className="flex items-center justify-between p-2 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                              Administrador
                            </span>
                          </div>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Acesso Total
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    {/* User Screen Option */}
                    <DropdownMenuItem 
                      onClick={() => navigate('/')}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Tela de Usuário</span>
                    </DropdownMenuItem>
                    
                    {/* Settings Option */}
                    <DropdownMenuItem 
                      onClick={() => setShowSettings(true)}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Logout Option */}
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair da conta</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>{stats?.activeSubscriptions || 0} ativos</span>
                  <span>•</span>
                  <span>{stats?.expiredSubscriptions || 0} expirados</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Carros</CardTitle>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCars || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastrados no sistema
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as receitas registradas
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as despesas registradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-5 h-auto p-1">
                <TabsTrigger value="overview" className="flex items-center gap-2 py-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 py-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex items-center gap-2 py-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admins</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2 py-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Auditoria</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  onClick={loadDashboardData}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Status das Assinaturas
                    </CardTitle>
                    <CardDescription>
                      Distribuição dos usuários por status de assinatura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Ativas</span>
                        </div>
                        <Badge variant="default">{stats?.activeSubscriptions || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Trial</span>
                        </div>
                        <Badge variant="secondary">{stats?.trialSubscriptions || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Expiradas</span>
                        </div>
                        <Badge variant="destructive">{stats?.expiredSubscriptions || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">Suspensas</span>
                        </div>
                        <Badge variant="outline">{stats?.suspendedSubscriptions || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                    <CardDescription>
                      Análise financeira do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <span className="font-medium">Receita Total</span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(stats?.totalRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <span className="font-medium">Despesas Totais</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(stats?.totalExpenses || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                        <span className="font-medium">Lucro Líquido</span>
                        <span className={`font-bold ${((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                        <span className="font-medium">Média por Carro</span>
                        <span className="font-medium">
                          {formatCurrency(stats?.totalCars ? (((stats.totalRevenue || 0) - (stats.totalExpenses || 0)) / stats.totalCars) : 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Gerenciamento de Usuários
                        <Badge variant="outline">{filteredUsers.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Visualize, edite e gerencie todos os usuários do sistema
                      </CardDescription>
                    </div>
                    
                    <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Shield className="h-4 w-4" />
                          Adicionar Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Administrador</DialogTitle>
                          <DialogDescription>
                            Digite o email do usuário que será promovido a administrador.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="admin-email">Email</Label>
                            <Input
                              id="admin-email"
                              placeholder="usuario@exemplo.com"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const email = (e.target as HTMLInputElement).value;
                                  if (email) handleAddAdmin(email);
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={() => {
                              const input = document.getElementById('admin-email') as HTMLInputElement;
                              if (input?.value) handleAddAdmin(input.value);
                            }}>
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search and Filters */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nome, email, telefone ou empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.plan} onValueChange={(value) => setFilters({...filters, plan: value})}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Planos</SelectItem>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.expirationFilter} onValueChange={(value) => setFilters({...filters, expirationFilter: value})}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Expiração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="expired">Expiradas</SelectItem>
                          <SelectItem value="expiring-soon">Vencendo em 30 dias</SelectItem>
                          <SelectItem value="active">Ativas (&gt;30 dias)</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nome</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="created">Data de Criação</SelectItem>
                          <SelectItem value="expiration">Data de Expiração</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        onClick={() => setFilters({...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'})}
                        className="gap-1 text-xs sm:text-sm px-2 sm:px-4"
                        size="sm"
                      >
                        {filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" /> : <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />}
                        <span className="hidden sm:inline">{filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando usuários...</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">Nenhum usuário encontrado</p>
                        <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col space-y-4">
                              {/* Header com nome e status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 sm:p-3 rounded-full bg-primary/10 flex-shrink-0">
                                    <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-base sm:text-lg truncate">{user.full_name || 'Nome não informado'}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      {getStatusBadge(user.subscription_status)}
                                      {user.subscription_plan && (
                                        <Badge variant="outline" className="text-xs">{user.subscription_plan}</Badge>
                                      )}
                                      {user.cars && (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                          <Car className="h-3 w-3" />
                                          {user.cars.length}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Botão +1 Mês destacado */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAddOneMonth(user)}
                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                                    disabled={loading}
                                  >
                                    <Plus className="h-4 w-4" />
                                    +1 Mês
                                  </Button>
                                </div>
                              </div>

                              {/* Informações de contato */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{user.email || 'Email não informado'}</span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{user.phone}</span>
                                  </div>
                                )}
                                {user.company_name && (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Building className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{user.company_name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Informações de assinatura */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                                <div className="flex flex-col gap-1">
                                  {user.subscription_expires_at ? (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-3 w-3 flex-shrink-0" />
                                      <span className={`font-medium ${
                                        isExpired(user.subscription_expires_at) 
                                          ? 'text-red-600' 
                                          : isExpiringThisMonth(user.subscription_expires_at) 
                                            ? 'text-yellow-600' 
                                            : 'text-green-600'
                                      }`}>
                                        {isExpired(user.subscription_expires_at) && '🔴 EXPIRADA - '}
                                        {!isExpired(user.subscription_expires_at) && isExpiringThisMonth(user.subscription_expires_at) && '🟡 VENCE EM BREVE - '}
                                        {!isExpired(user.subscription_expires_at) && !isExpiringThisMonth(user.subscription_expires_at) && '🟢 ATIVA - '}
                                        {formatDate(user.subscription_expires_at)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Sem data de expiração</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    Criado em: {formatDate(user.created_at)}
                                  </div>
                                </div>
                                
                                {/* Botões de ação */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewUser(user)}
                                    className="gap-1 text-xs"
                                    disabled={loading}
                                  >
                                    <Eye className="h-3 w-3" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="gap-1 text-xs"
                                    disabled={loading}
                                  >
                                    <Edit className="h-3 w-3" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, true)}
                                    className="gap-1 text-xs"
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Administradores do Sistema
                    <Badge variant="outline">{adminUsers.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Gerencie os usuários com acesso administrativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminUsers.map((admin) => (
                      <Card key={admin.id} className="hover:shadow-sm transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Shield className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{admin.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  Adicionado em {formatDate(admin.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={admin.is_active ? "default" : "secondary"} className="gap-1">
                                {admin.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {admin.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              {admin.user_id === user?.id && (
                                <Badge variant="outline">Você</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {adminUsers.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">Nenhum administrador encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Logs de Auditoria
                    <Badge variant="outline">{auditLogs.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Histórico das ações administrativas realizadas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <Card key={log.id} className="hover:shadow-sm transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{log.action}</p>
                              <p className="text-sm text-muted-foreground">
                                {log.resource_type && `${log.resource_type}${log.resource_id ? ` (${log.resource_id})` : ''}`}
                              </p>
                            </div>
                            <div className="text-right text-muted-foreground">
                              <p className="text-sm">{formatDate(log.created_at)}</p>
                              <p className="text-xs">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">Nenhum log de auditoria encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configurações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Configurações avançadas e ferramentas administrativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Segurança:</strong> Todas as ações administrativas são registradas e auditadas. 
                        O acesso é verificado server-side a cada operação.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="justify-start h-auto p-4 hover:shadow-md transition-all duration-300"
                        onClick={loadDashboardData}
                        disabled={loading}
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <p className="font-medium">Atualizar Estatísticas</p>
                          </div>
                          <p className="text-sm text-muted-foreground">Recalcular métricas do sistema</p>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="justify-start h-auto p-4 hover:shadow-md transition-all duration-300"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Download className="h-4 w-4" />
                            <p className="font-medium">Backup de Dados</p>
                          </div>
                          <p className="text-sm text-muted-foreground">Gerar backup do banco de dados</p>
                        </div>
                      </Button>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Preferências de Interface</h4>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">Modo Escuro</p>
                          <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <Switch
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Moon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* User Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserIcon className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                        <p className="font-medium text-sm break-words">{selectedUser.full_name || 'Não informado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium text-sm break-all">{selectedUser.email || 'Não informado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                        <p className="font-medium text-sm">{selectedUser.phone || 'Não informado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                        <p className="font-medium text-sm break-words">{selectedUser.company_name || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Status da Assinatura</Label>
                        <div>{getStatusBadge(selectedUser.subscription_status)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Plano</Label>
                        <p className="font-medium text-sm">{selectedUser.subscription_plan || 'Não definido'}</p>
                      </div>
                      {selectedUser.subscription_expires_at && (
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Data de Expiração</Label>
                          <p className={`font-medium text-sm ${
                            isExpired(selectedUser.subscription_expires_at) 
                              ? 'text-red-600' 
                              : isExpiringThisMonth(selectedUser.subscription_expires_at) 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                          }`}>
                            {isExpired(selectedUser.subscription_expires_at) && '🔴 EXPIRADA - '}
                            {!isExpired(selectedUser.subscription_expires_at) && isExpiringThisMonth(selectedUser.subscription_expires_at) && '🟡 VENCE EM BREVE - '}
                            {!isExpired(selectedUser.subscription_expires_at) && !isExpiringThisMonth(selectedUser.subscription_expires_at) && '🟢 ATIVA - '}
                            {formatDate(selectedUser.subscription_expires_at)}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                        <p className="font-medium text-sm">{formatDate(selectedUser.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                {selectedUser.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Resumo Financeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedUser.summary.totalCars}
                        </div>
                        <div className="text-sm text-muted-foreground">Carros</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedUser.summary.totalRevenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">Receitas</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(selectedUser.summary.totalExpenses)}
                        </div>
                        <div className="text-sm text-muted-foreground">Despesas</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                        <div className={`text-2xl font-bold ${selectedUser.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedUser.summary.netProfit)}
                        </div>
                        <div className="text-sm text-muted-foreground">Lucro Líquido</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cars */}
                {selectedUser.cars && selectedUser.cars.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Veículos ({selectedUser.cars.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.cars.map((car: any) => (
                          <Card key={car.id} className="hover:shadow-sm transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{car.name}</h4>
                                <Badge variant={car.status === 'active' ? 'default' : 'secondary'}>
                                  {car.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <Label>Placa</Label>
                                  <p>{car.plate}</p>
                                </div>
                                <div>
                                  <Label>Quilometragem</Label>
                                  <p>{car.mileage?.toLocaleString()} km</p>
                                </div>
                                {car.drivers && car.drivers.length > 0 && (
                                  <div className="col-span-2">
                                    <Label>Motoristas</Label>
                                    <div className="space-y-1">
                                      {car.drivers.map((driver: any) => (
                                        <div key={driver.id} className="text-sm p-2 rounded bg-muted">
                                          {driver.name} - {driver.phone} - {driver.cpf}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company" className="text-sm font-medium">Empresa</Label>
                  <Input
                    id="edit-company"
                    value={editForm.company_name || ''}
                    onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-sm font-medium">Status da Assinatura</Label>
                  <Select
                    value={editForm.subscription_status || ''}
                    onValueChange={(value) => setEditForm({...editForm, subscription_status: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan" className="text-sm font-medium">Plano</Label>
                  <Select
                    value={editForm.subscription_plan || ''}
                    onValueChange={(value) => setEditForm({...editForm, subscription_plan: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-expires" className="text-sm font-medium">Data de Expiração</Label>
                  <Input
                    id="edit-expires"
                    type="date"
                    value={editForm.subscription_expires_at || ''}
                    onChange={(e) => setEditForm({...editForm, subscription_expires_at: e.target.value})}
                    className="w-full"
                  />
                  {selectedUser && (
                    <div className="pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAddOneMonth(selectedUser)}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                        +30 Dias
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Tema */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tema da Aplicação</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Claro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Escuro</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sons de Interação */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Efeitos Sonoros</Label>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {soundSettings.enabled ? (
                      <Volume2 className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">
                      Som ao clicar
                    </span>
                  </div>
                  <Switch
                    checked={soundSettings.enabled}
                    onCheckedChange={handleSoundToggle}
                    className="flex-shrink-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ative sons suaves de feedback para cliques e sucessos.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;