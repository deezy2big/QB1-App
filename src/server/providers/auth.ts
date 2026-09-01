import { ProviderNotConfiguredError, hasEnv } from "./not-configured";
import type { AuthProvider } from "./types";

export class LocalAuth implements AuthProvider {
  id = "local" as const;

  async verify(token: string) {
    if (!token.includes("@nfl.com")) {
      throw new Error("QB1 is gated to NFL Okta accounts (@nfl.com).");
    }
    const local = token.split("@")[0];
    const name = local
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { email: token, name };
  }
}

export class OktaAuth implements AuthProvider {
  id = "okta" as const;

  async verify(): Promise<{ email: string; name: string }> {
    if (!hasEnv("OKTA_ISSUER", "OKTA_CLIENT_ID")) {
      throw new ProviderNotConfiguredError("Okta", [
        "OKTA_ISSUER",
        "OKTA_CLIENT_ID",
        "OKTA_CLIENT_SECRET",
      ]);
    }
    throw new Error(
      "Okta is selected and issuer/client id are present, but JWT verification is not wired yet. Keep QB1_AUTH=local until that lands.",
    );
  }
}
