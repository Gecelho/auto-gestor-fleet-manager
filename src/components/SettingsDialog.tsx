import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSounds } from "@/hooks/useSounds";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings: soundSettings, toggleSounds, setVolume, playSound } = useSounds();
  const { clickSound } = useSoundEffects();

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
  ];

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) clickSound(); // Som ao abrir configurações
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 w-9 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-6 py-4">
            {/* Tema */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tema da Aplicação</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um tema" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escolha entre tema claro ou escuro para a aplicação.
              </p>
            </div>

            {/* Sons de Interação */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Sons de Interação</Label>
              
              {/* Toggle de Sons */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {soundSettings.enabled ? (
                    <Volume2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">Ativar sons</span>
                </div>
                <Switch
                  checked={soundSettings.enabled}
                  onCheckedChange={toggleSounds}
                  className="flex-shrink-0"
                />
              </div>

              {/* Controle de Volume */}
              {soundSettings.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Volume</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(soundSettings.volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[soundSettings.volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => playSound('click')}
                      className="text-xs flex-1 sm:flex-none"
                    >
                      Testar Click
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => playSound('success')}
                      className="text-xs flex-1 sm:flex-none"
                    >
                      Testar Sucesso
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Ative sons suaves de feedback para cliques, sucessos e outras interações. 
                Os sons são discretos e podem ser ajustados no volume.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center sm:justify-end pt-4 border-t flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => {
              clickSound(); // Som ao fechar
              setOpen(false);
            }}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}