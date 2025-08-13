import { useCallback } from 'react';
import { useSounds } from './useSounds';

/**
 * Hook simplificado para adicionar sons a elementos interativos
 * Retorna handlers prontos para usar em onClick, onMouseEnter, etc.
 */
export function useSoundEffects() {
  const { playSound } = useSounds();

  const handleClick = useCallback((callback?: () => void) => {
    return () => {
      playSound('click');
      callback?.();
    };
  }, [playSound]);

  const handleSuccess = useCallback((callback?: () => void) => {
    return () => {
      playSound('success');
      callback?.();
    };
  }, [playSound]);

  const handleError = useCallback((callback?: () => void) => {
    return () => {
      playSound('error');
      callback?.();
    };
  }, [playSound]);

  const handleHover = useCallback((callback?: () => void) => {
    return () => {
      playSound('hover');
      callback?.();
    };
  }, [playSound]);

  // Handlers diretos para usar em eventos
  const clickSound = useCallback(() => playSound('click'), [playSound]);
  const successSound = useCallback(() => playSound('success'), [playSound]);
  const errorSound = useCallback(() => playSound('error'), [playSound]);
  const hoverSound = useCallback(() => playSound('hover'), [playSound]);

  return {
    // Handlers que combinam som + callback
    handleClick,
    handleSuccess,
    handleError,
    handleHover,
    
    // Handlers diretos
    clickSound,
    successSound,
    errorSound,
    hoverSound,
    
    // Função direta para casos específicos
    playSound
  };
}