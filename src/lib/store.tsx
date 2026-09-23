"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { AP_ASSETS, ASSETS } from "./data";
import type {
  ActionMode,
  Asset,
  Job,
  Session,
  ViewId,
} from "./types";

type Store = {
  session: Session | null;
  login: (session: Session) => void;
  logout: () => void;
  view: ViewId;
  setView: (view: ViewId) => void;
  folderId: string;
  setFolderId: (id: string) => void;
  showHeadshotBadges: boolean;
  setShowHeadshotBadges: (v: boolean) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  selectOnly: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  queueIds: string[];
  addToQueue: (ids: string[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  mode: ActionMode;
  setMode: (mode: ActionMode) => void;
  jobs: Job[];
  submitJob: (assetIds: string[]) => Promise<void>;
  operatorName: string;
  setOperatorName: (name: string) => void;
  localAssets: Asset[];
  addLocalFiles: (files: File[]) => Promise<void>;
  apQuery: string;
  setApQuery: (q: string) => void;
  apPage: number;
  setApPage: (p: number) => void;
  getAsset: (id: string) => Asset | undefined;
  allAssets: Asset[];
  processedRevision: (assetId: string) => number | null;
};

const Ctx = createContext<Store | null>(null);
const SESSION_KEY = "qb1-session";
const OPERATOR_KEY = "qb1-operator";

function loadOperator() {
  if (typeof window === "undefined") return "Local operator";
  return localStorage.getItem(OPERATOR_KEY)?.trim() || "Local operator";
}

async function readError(res: Response) {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* response was not JSON */
  }
  return text || res.statusText;
}

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function upsertJob(list: Job[], job: Job) {
  return [job, ...list.filter((j) => j.id !== job.id)].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [view, setView] = useState<ViewId>("upload");
  const [operatorName, setOperatorNameState] = useState(loadOperator);
  const [folderId, setFolderId] = useState("hs-2025");
  const [showHeadshotBadges, setShowHeadshotBadges] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ActionMode>("process");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [apQuery, setApQuery] = useState("");
  const [apPage, setApPage] = useState(1);
  const sources = useRef(new Map<string, EventSource>());

  const allAssets = useMemo(
    () => [...ASSETS, ...AP_ASSETS, ...localAssets],
    [localAssets],
  );

  const getAsset = useCallback(
    (id: string) => allAssets.find((a) => a.id === id),
    [allAssets],
  );

  const watchJob = useCallback((id: string) => {
    if (sources.current.has(id)) return;
    const es = new EventSource(`/api/jobs/${id}/events`);
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as { job: Job };
      setJobs((cur) => upsertJob(cur, data.job));
      if (data.job.status === "complete" || data.job.status === "failed") {
        es.close();
        sources.current.delete(id);
      }
    };
    sources.current.set(id, es);
  }, []);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((list: Job[]) => {
        setJobs(list);
        list
          .filter((j) => j.status !== "complete" && j.status !== "failed")
          .forEach((j) => watchJob(j.id));
      })
      .catch(() => undefined);
    fetch("/api/assets/local")
      .then((r) => r.json())
      .then((list: Asset[]) => setLocalAssets(list))
      .catch(() => undefined);
    const map = sources.current;
    return () => {
      for (const es of map.values()) es.close();
      map.clear();
    };
  }, [watchJob]);

  const jobInFlight = jobs.some((job) => job.status !== "complete" && job.status !== "failed");
  useEffect(() => {
    if (!jobInFlight) return;
    const timer = setInterval(() => {
      fetch("/api/jobs")
        .then((r) => r.json())
        .then((list: Job[]) => {
          setJobs(list);
          list
            .filter((job) => job.status !== "complete" && job.status !== "failed")
            .forEach((job) => watchJob(job.id));
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(timer);
  }, [jobInFlight, watchJob]);

  const setOperatorName = useCallback((name: string) => {
    localStorage.setItem(OPERATOR_KEY, name);
    setOperatorNameState(name);
  }, []);

  const login = useCallback((next: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }, []);

  const selectOnly = useCallback((id: string) => {
    setSelectedIds([id]);
  }, []);

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const addToQueue = useCallback((ids: string[]) => {
    setQueueIds((cur) => [...new Set([...cur, ...ids])]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueueIds((cur) => cur.filter((x) => x !== id));
  }, []);

  const clearQueue = useCallback(() => setQueueIds([]), []);

  const submitJob = useCallback(
    async (assetIds: string[]) => {
      if (assetIds.length === 0) return;
      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            assetIds,
            mode,
            submittedBy: operatorName.trim() || "Local operator",
            office: "Local",
          }),
        });
        if (!res.ok) throw new Error(await readError(res));
        const job = (await res.json()) as Job;
        setJobs((cur) => upsertJob(cur, job));
        watchJob(job.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start job");
      }
    },
    [mode, operatorName, watchJob],
  );

  const addLocalFiles = useCallback(async (files: File[]) => {
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await readError(res));
      const added = (await res.json()) as Asset[];
      setLocalAssets((cur) => [...added, ...cur.filter((asset) => !added.some((item) => item.id === asset.id))]);
      setSelectedIds(added.map((a) => a.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }, []);

  const processedRevision = useCallback(
    (assetId: string) => {
      const hit = jobs.find(
        (j) =>
          j.status === "complete" &&
          j.mode === "process" &&
          j.outputs.some((o) => o.assetId === assetId && o.processedKey),
      );
      return hit ? hit.createdAt : null;
    },
    [jobs],
  );

  const value = useMemo<Store>(
    () => ({
      session,
      login,
      logout,
      view,
      setView,
      folderId,
      setFolderId,
      showHeadshotBadges,
      setShowHeadshotBadges,
      selectedIds,
      toggleSelected,
      selectOnly,
      selectMany,
      clearSelection,
      queueIds,
      addToQueue,
      removeFromQueue,
      clearQueue,
      mode,
      setMode,
      jobs,
      submitJob,
      operatorName,
      setOperatorName,
      localAssets,
      addLocalFiles,
      apQuery,
      setApQuery: (q) => {
        setApQuery(q);
        setApPage(1);
      },
      apPage,
      setApPage,
      getAsset,
      allAssets,
      processedRevision,
    }),
    [
      addLocalFiles,
      addToQueue,
      allAssets,
      apPage,
      apQuery,
      clearQueue,
      clearSelection,
      folderId,
      getAsset,
      jobs,
      localAssets,
      login,
      logout,
      mode,
      operatorName,
      processedRevision,
      queueIds,
      removeFromQueue,
      selectMany,
      selectOnly,
      selectedIds,
      setOperatorName,
      session,
      showHeadshotBadges,
      submitJob,
      toggleSelected,
      view,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
