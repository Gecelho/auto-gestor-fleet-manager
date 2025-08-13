import React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface SoundTabsTriggerProps extends React.ComponentProps<typeof TabsTrigger> {
  disableSound?: boolean;
}

export const SoundTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  SoundTabsTriggerProps
>(({ onClick, disableSound = false, ...props }, ref) => {
  const { clickSound } = useSoundEffects();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disableSound) {
      clickSound();
    }
    onClick?.(event);
  };

  return <TabsTrigger ref={ref} onClick={handleClick} {...props} />;
});

SoundTabsTrigger.displayName = "SoundTabsTrigger";