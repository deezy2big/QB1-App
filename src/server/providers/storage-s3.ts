import { ProviderNotConfiguredError, hasEnv } from "./not-configured";
import type { StorageProvider } from "./types";

/** S3 adapter. Implement put/get with @aws-sdk/client-s3 when AWS_ACCESS_KEY_ID and QB1_S3_BUCKET are set. */
export class S3Storage implements StorageProvider {
  id = "s3" as const;

  async put(key: string, bytes: Buffer) {
    void key;
    void bytes;
    this.ensure();
  }

  async get(key: string): Promise<Buffer> {
    void key;
    this.ensure();
    return Buffer.alloc(0);
  }

  async exists(key: string) {
    void key;
    this.ensure();
    return false;
  }

  private ensure(): never {
    if (!hasEnv("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "QB1_S3_BUCKET")) {
      throw new ProviderNotConfiguredError("AWS S3", [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION",
        "QB1_S3_BUCKET",
      ]);
    }
    throw new Error(
      "S3 storage is selected and credentials are present, but the AWS client is not wired yet. Keep QB1_STORAGE=local until that lands.",
    );
  }
}
