import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";

export function ThemeDemo() {
  const { theme } = useTheme();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="gradient-text">
          Demonstração do Sistema de Tema
        </CardTitle>
        <CardDescription>
          Tema atual: <Badge variant="outline">{theme === 'dark' ? 'Escuro' : 'Claro'}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Texto de alta visibilidade */}
        <div>
          <h3 className="text-lg font-semibold high-contrast-text mb-2">
            Texto de Alta Visibilidade
          </h3>
          <p className="text-muted-foreground">
            Este texto secundário mantém boa legibilidade em ambos os temas.
          </p>
        </div>

        {/* Botões com diferentes variantes */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Botões</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Padrão</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="success">Sucesso</Button>
            <Button variant="danger">Perigo</Button>
            <Button variant="warning">Aviso</Button>
            <Button variant="info">Info</Button>
          </div>
        </div>

        {/* Badges para status */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Status</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>Padrão</Badge>
            <Badge variant="secondary">Secundário</Badge>
            <Badge variant="outline">Contorno</Badge>
            <Badge variant="destructive">Destrutivo</Badge>
          </div>
        </div>

        {/* Informações sobre acessibilidade */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Recursos de Acessibilidade</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Alto contraste entre texto e fundo</li>
            <li>• Cores vibrantes no modo escuro para melhor visibilidade</li>
            <li>• Bordas mais visíveis para definir elementos</li>
            <li>• Transições suaves entre temas</li>
            <li>• Foco visual aprimorado para navegação por teclado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}