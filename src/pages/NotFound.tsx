import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-full-height items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
          <Button onClick={() => navigate("/")} className="btn-modern">
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
