import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  User, 
  Car, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  Building,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Shield,
  AlertTriangle
} from "lucide-react";
import { AdminAPI } from "@/lib/admin-api";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  subscription_expires_at: string;
  subscription_status: string;
  subscription_plan: string;
  cars?: any[];
  summary?: {
    totalCars: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load all users on component mount
  useEffect(() => {
    loadAllUsers();
  }, [currentPage]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const response = await AdminAPI.getAllUsers(currentPage, 20);
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        toast.error(response.error || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAllUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await AdminAPI.searchUsers(searchQuery);
      if (response.success && response.data) {
        setUsers(response.data);
        setCurrentPage(1);
        setTotalPages(1);
      } else {
        toast.error(response.error || 'Erro na busca');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Erro na busca');
    } finally {
      setLoading(false);
    }
  };

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
      // Preparar os dados para atualização, removendo campos vazios e tratando datas
      const updateData = { ...editForm };
      
      // Se a data de expiração estiver vazia, remover do objeto ou definir como null
      if (!updateData.subscription_expires_at || updateData.subscription_expires_at.trim() === '') {
        delete updateData.subscription_expires_at;
      } else {
        // Converter para formato ISO se houver data
        updateData.subscription_expires_at = new Date(updateData.subscription_expires_at + 'T23:59:59.999Z').toISOString();
      }

      // Remover campos vazios
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await AdminAPI.updateUser(selectedUser.id, updateData);
      if (response.success) {
        toast.success('Usuário atualizado com sucesso!');
        setShowEditUser(false);
        loadAllUsers();
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
    if (!confirm(`Tem certeza que deseja ${deleteAllData ? 'excluir permanentemente' : 'desativar'} este usuário?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await AdminAPI.deleteUser(userId, deleteAllData);
      if (response.success) {
        toast.success(deleteAllData ? 'Usuário excluído permanentemente!' : 'Usuário desativado!');
        loadAllUsers();
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      trial: { label: 'Trial', variant: 'secondary' as const },
      expired: { label: 'Expirado', variant: 'destructive' as const },
      suspended: { label: 'Suspenso', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Buscar por nome, email, telefone, CPF ou placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
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

      {/* Users List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                        {user.company_name && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {user.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {getStatusBadge(user.subscription_status)}
                      <div className="text-sm text-muted-foreground mt-1">
                        {user.cars?.length || 0} carros
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, false)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-medium">{selectedUser.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <p className="font-medium">{selectedUser.company_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label>Status da Assinatura</Label>
                    {getStatusBadge(selectedUser.subscription_status)}
                  </div>
                  <div>
                    <Label>Plano</Label>
                    <p className="font-medium">{selectedUser.subscription_plan || 'Não definido'}</p>
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
                  <CardContent className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedUser.summary.totalCars}
                      </div>
                      <div className="text-sm text-muted-foreground">Carros</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedUser.summary.totalRevenue)}
                      </div>
                      <div className="text-sm text-muted-foreground">Receitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedUser.summary.totalExpenses)}
                      </div>
                      <div className="text-sm text-muted-foreground">Despesas</div>
                    </div>
                    <div className="text-center">
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
                    <div className="space-y-4">
                      {selectedUser.cars.map((car: any) => (
                        <div key={car.id} className="border rounded-lg p-4">
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
                                    <div key={driver.id} className="text-sm">
                                      {driver.name} - {driver.phone} - {driver.cpf}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={editForm.company_name || ''}
                onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status da Assinatura</Label>
              <Select
                value={editForm.subscription_status || ''}
                onValueChange={(value) => setEditForm({...editForm, subscription_status: value})}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="edit-plan">Plano</Label>
              <Select
                value={editForm.subscription_plan || ''}
                onValueChange={(value) => setEditForm({...editForm, subscription_plan: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-expires">Data de Expiração</Label>
              <Input
                id="edit-expires"
                type="date"
                value={editForm.subscription_expires_at || ''}
                onChange={(e) => setEditForm({...editForm, subscription_expires_at: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={loading}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;