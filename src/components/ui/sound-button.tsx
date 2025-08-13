import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface SoundButtonProps extends ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disableSound?: boolean;
}

export const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onClick, disableSound = false, ...props }, ref) => {
    const { clickSound } = useSoundEffects();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableSound) {
        clickSound();
      }
      onClick?.(event);
    };

    return <Button ref={ref} onClick={handleClick} {...props} />;
  }
);

SoundButton.displayName = "SoundButton";