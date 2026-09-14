import { listLocalAssets } from "@/server/providers/source-local";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listLocalAssets());
}
