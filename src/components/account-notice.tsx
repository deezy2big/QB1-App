const COPY = {
  photoshelter: {
    kicker: "PhotoShelter Ingest",
    title: "PhotoShelter is not connected",
    body: "This build does not browse a library and does not use an existing PhotoShelter account. Connect our own account in a later phase.",
  },
  ap: {
    kicker: "Associated Press Ingest",
    title: "Associated Press is not connected",
    body: "This build does not search a wire and does not use an existing Associated Press account. Connect our own account in a later phase.",
  },
  analytics: {
    kicker: "Analytics",
    title: "No dashboard yet",
    body: "The image processing dashboard is not part of this phase. When it is built from our own jobs, every count starts at zero.",
  },
} as const;

export function AccountNotice({ kind }: { kind: keyof typeof COPY }) {
  const copy = COPY[kind];
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-8 py-16">
      <div className="max-w-md">
        <p className="text-[11px] tracking-[0.18em] text-white/40 uppercase">{copy.kicker}</p>
        <h2 className="mt-3 text-xl font-medium text-white">{copy.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{copy.body}</p>
      </div>
    </div>
  );
}
