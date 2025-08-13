import { useState, useEffect, useCallback } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'hover';

interface SoundSettings {
  enabled: boolean;
  volume: number;
}

// URLs dos sons usando Web Audio API ou sons do sistema
const SOUND_URLS = {
  click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE=',
  success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE=',
  error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE=',
  hover: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE='
};

// Função para criar sons sintéticos usando Web Audio API
const createSyntheticSound = (type: SoundType, volume: number = 0.15): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Configurações diferentes para cada tipo de som
    switch (type) {
      case 'click':
        // Som de click muito suave - como um "pop" discreto
        const clickOsc = audioContext.createOscillator();
        const clickGain = audioContext.createGain();
        const clickFilter = audioContext.createBiquadFilter();
        
        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(audioContext.destination);
        
        // Filtro passa-baixa para suavizar
        clickFilter.type = 'lowpass';
        clickFilter.frequency.setValueAtTime(2000, audioContext.currentTime);
        
        clickOsc.frequency.setValueAtTime(1200, audioContext.currentTime);
        clickOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.03);
        clickGain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);
        clickOsc.type = 'sine';
        
        clickOsc.start(audioContext.currentTime);
        clickOsc.stop(audioContext.currentTime + 0.03);
        break;
      
      case 'success':
        // Som de sucesso - duas notas ascendentes muito suaves
        const createSuccessNote = (freq: number, startTime: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioContext.destination);
          
          // Filtro para suavizar
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, audioContext.currentTime + startTime);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);
          gain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(volume * 0.4, audioContext.currentTime + startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          osc.type = 'sine';
          
          osc.start(audioContext.currentTime + startTime);
          osc.stop(audioContext.currentTime + startTime + duration);
        };
        
        createSuccessNote(440, 0, 0.08);    // A4 - mais grave
        createSuccessNote(554, 0.06, 0.1);  // C#5 - intervalo mais suave
        break;
      
      case 'error':
        // Som de erro - nota descendente mais grave
        const errorOsc = audioContext.createOscillator();
        const errorGain = audioContext.createGain();
        
        errorOsc.connect(errorGain);
        errorGain.connect(audioContext.destination);
        
        errorOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        errorOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        errorGain.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
        errorGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        errorOsc.type = 'sine';
        
        errorOsc.start(audioContext.currentTime);
        errorOsc.stop(audioContext.currentTime + 0.15);
        break;
      
      case 'hover':
        // Som de hover extremamente sutil - quase imperceptível
        const hoverOsc = audioContext.createOscillator();
        const hoverGain = audioContext.createGain();
        const hoverFilter = audioContext.createBiquadFilter();
        
        hoverOsc.connect(hoverFilter);
        hoverFilter.connect(hoverGain);
        hoverGain.connect(audioContext.destination);
        
        // Filtro para tornar ainda mais suave
        hoverFilter.type = 'lowpass';
        hoverFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
        
        hoverOsc.frequency.setValueAtTime(900, audioContext.currentTime);
        hoverGain.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
        hoverGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02);
        hoverOsc.type = 'sine';
        
        hoverOsc.start(audioContext.currentTime);
        hoverOsc.stop(audioContext.currentTime + 0.02);
        break;
    }
  } catch (error) {
    console.warn('Web Audio API não suportada:', error);
  }
};

export function useSounds() {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    const saved = localStorage.getItem('autogestor-sound-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return { enabled: false, volume: 0.15 }; // Desabilitado por padrão
  });

  useEffect(() => {
    localStorage.setItem('autogestor-sound-settings', JSON.stringify(settings));
  }, [settings]);

  const playSound = useCallback((type: SoundType) => {
    if (!settings.enabled) return;

    // Usar Web Audio API para sons sintéticos
    createSyntheticSound(type, settings.volume);
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleSounds = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  return {
    settings,
    playSound,
    updateSettings,
    toggleSounds,
    setVolume
  };
}