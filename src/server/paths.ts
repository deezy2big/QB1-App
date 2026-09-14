import path from "node:path";

export function dataDir() {
  const override = process.env.QB1_DATA_DIR?.trim();
  return override ? path.resolve(override) : path.join(process.cwd(), ".data");
}

export function dataPath(...parts: string[]) {
  return path.join(dataDir(), ...parts);
}
