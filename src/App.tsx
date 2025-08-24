import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import "@/lib/security-middleware-simple"; // Inicializar middleware automaticamente
import Index from "./pages/Index";
import CarDetail from "./pages/CarDetail";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
          return false;
        }
        return failureCount < 2; // Reduced retries for faster failures
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry delays
      staleTime: 30 * 1000, // 30 seconds - balance between freshness and performance
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always', // Always refetch on mount for fresh data
      networkMode: 'online', // Changed from offlineFirst for better performance
      // Add timeout for queries
      meta: {
        timeout: 10000, // 10 second timeout for queries
      },
    },
    mutations: {
      retry: 1, // Reduced retries for mutations
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000), // Faster retry delays
      networkMode: 'online',
      // Add timeout for mutations
      meta: {
        timeout: 15000, // 15 second timeout for mutations
      },
    },
  },
});

const AppContent = () => {
  // Inicializa o tema
  useTheme();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectionStatus />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/car/:id" element={
                <ProtectedRoute>
                  <CarDetail />
                </ProtectedRoute>
              } />
              {/* Admin Routes - Public access for login, protected for dashboard */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/painel-admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const App = () => <AppContent />;

export default App;
