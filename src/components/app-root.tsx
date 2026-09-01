"use client";

import { LoginScreen } from "@/components/login-screen";
import { Qb1Shell } from "@/components/qb1-shell";
import { StoreProvider, useStore } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";

function Gate() {
  const { session } = useStore();
  if (!session) return <LoginScreen />;
  return <Qb1Shell />;
}

export function AppRoot() {
  return (
    <StoreProvider>
      <TooltipProvider>
        <Gate />
      </TooltipProvider>
    </StoreProvider>
  );
}
