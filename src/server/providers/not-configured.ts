export class ProviderNotConfiguredError extends Error {
  constructor(name: string, envVars: string[]) {
    super(
      `${name} is not configured. Add ${envVars.join(", ")} to .env.local, then set the matching QB1_* provider flag. Local adapters stay on until then.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ProviderNotConfiguredError(name, [name]);
  }
  return value;
}

export function hasEnv(...names: string[]) {
  return names.every((n) => Boolean(process.env[n]?.trim()));
}
