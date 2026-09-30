import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-[var(--app-card-border)] bg-[var(--app-root-bg)] p-0.5 shadow-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--app-menu-active-bg)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--app-menu-active-bg)] data-[state=checked]:bg-[var(--app-menu-active-bg)] data-[state=unchecked]:bg-[var(--app-root-bg)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-[var(--app-card-bg)] shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-[var(--app-menu-active-fg)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
