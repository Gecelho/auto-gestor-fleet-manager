import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/database";

export const useUser = () => {
  const { user: authUser } = useAuth();
  
  return useQuery({
    queryKey: ["user", authUser?.id],
    queryFn: async (): Promise<User | null> => {
      if (!authUser?.id) return null;
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        // If user doesn't exist in users table, the trigger should have created it
        // But let's check if we need to create it manually
        if (error.code === 'PGRST116') { // No rows returned
          // User not found - log removido
          return null;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!authUser?.id,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (userData: Partial<Omit<User, "id" | "created_at" | "updated_at">>) => {
      // Iniciando atualização - logs removidos
      
      if (!authUser?.id) {
        console.error('❌ useUpdateUser: Usuário não autenticado');
        throw new Error("User not authenticated");
      }
      
      // Executando query - log removido
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", authUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ useUpdateUser: Erro na query:', error);
        throw error;
      }
      
      // Dados atualizados com sucesso - log removido
      return data;
    },
    onSuccess: (data) => {
      // onSuccess - log removido
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Suas informações foram salvas.",
      });
      console.log('✅ useUpdateUser: Toast de sucesso exibido');
    },
    onError: (error) => {
      console.error('💥 useUpdateUser: onError chamado', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error updating user:", error);
    },
  });
};

// Hook to manually create user profile if needed
export const useCreateUserProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!authUser?.id || !authUser?.email) {
        throw new Error("User not authenticated");
      }
      
      const userData = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || 
                  authUser.user_metadata?.name || 
                  authUser.email.split('@')[0],
      };

      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Perfil criado com sucesso!",
        description: "Bem-vindo ao AutoGestor!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar perfil",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error creating user profile:", error);
    },
  });
};