"use client";

import { Qb1Shell } from "@/components/qb1-shell";
import { StoreProvider } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function AppRoot() {
  return (
    <StoreProvider>
      <TooltipProvider>
        <Qb1Shell />
        <Toaster theme="dark" position="bottom-right" />
      </TooltipProvider>
    </StoreProvider>
  );
}
