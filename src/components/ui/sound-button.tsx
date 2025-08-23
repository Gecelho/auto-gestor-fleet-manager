import * as React from "react"
import { Button, ButtonProps } from "./button"
import { useSoundEffects } from "@/hooks/useSoundEffects"

export interface SoundButtonProps extends ButtonProps {
  soundType?: 'click' | 'success' | 'error' | 'hover'
  onSoundClick?: () => void
}

const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ soundType = 'click', onSoundClick, onClick, ...props }, ref) => {
    const { playSound } = useSoundEffects()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Toca o som
      playSound(soundType)
      
      // Executa o callback de som personalizado se fornecido
      onSoundClick?.()
      
      // Executa o onClick original se fornecido
      onClick?.(event)
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
SoundButton.displayName = "SoundButton"

export { SoundButton }