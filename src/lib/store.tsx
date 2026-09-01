"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AP_ASSETS, ASSETS } from "./data";
import { pipelineFor } from "./pipeline";
import type {
  ActionMode,
  Asset,
  Job,
  JobEvent,
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
  submitJob: (assetIds: string[], extras?: Asset[]) => void;
  localAssets: Asset[];
  addLocalFiles: (files: File[]) => void;
  apQuery: string;
  setApQuery: (q: string) => void;
  apPage: number;
  setApPage: (p: number) => void;
  getAsset: (id: string) => Asset | undefined;
  allAssets: Asset[];
};

const Ctx = createContext<Store | null>(null);
const SESSION_KEY = "qb1-session";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [view, setView] = useState<ViewId>("photoshelter");
  const [folderId, setFolderId] = useState("hs-2025");
  const [showHeadshotBadges, setShowHeadshotBadges] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ActionMode>("process");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [apQuery, setApQuery] = useState("");
  const [apPage, setApPage] = useState(1);
  const localUrls = useRef<Map<string, string>>(new Map());
  const jobTimers = useRef<number[]>([]);

  const allAssets = useMemo(
    () => [...ASSETS, ...AP_ASSETS, ...localAssets],
    [localAssets],
  );

  const getAsset = useCallback(
    (id: string) => allAssets.find((a) => a.id === id),
    [allAssets],
  );

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
    (assetIds: string[], extras: Asset[] = []) => {
      if (!session || assetIds.length === 0) return;
      const catalog = [...allAssets, ...extras];
      const assets = assetIds
        .map((id) => catalog.find((a) => a.id === id))
        .filter((a): a is Asset => Boolean(a));
      const id = `job-${Date.now()}`;
      const createdAt = Date.now();
      const first: JobEvent = {
        at: createdAt,
        status: "queued",
        message: `Database record created · status queued`,
      };
      const job: Job = {
        id,
        createdAt,
        mode,
        status: "queued",
        assetIds,
        events: [first],
        submittedBy: session.name,
        office: session.office,
      };
      setJobs((cur) => [job, ...cur]);
      setView("jobs");

      const steps = pipelineFor(assets, mode);
      let delay = 0;
      steps.forEach((step, i) => {
        delay += step.ms;
        const handle = window.setTimeout(() => {
          setJobs((cur) =>
            cur.map((j) => {
              if (j.id !== id) return j;
              const event: JobEvent = {
                at: Date.now(),
                status: step.status,
                message: step.message(
                  assets.length,
                  assets.map((a) => a.kind),
                ),
              };
              return {
                ...j,
                status: step.status,
                events: [...j.events, event],
              };
            }),
          );
        }, delay);
        jobTimers.current[i] = handle;
      });
    },
    [allAssets, mode, session],
  );

  const addLocalFiles = useCallback((files: File[]) => {
    const added: Asset[] = files.map((file, i) => {
      const id = `local-${Date.now()}-${i}`;
      const url = URL.createObjectURL(file);
      localUrls.current.set(id, url);
      const movie = /\.(mp4|mov|m4v|webm)$/i.test(file.name);
      return {
        id,
        name: file.name,
        kind: movie ? "movie" : "action",
        source: "local",
        year: new Date().getFullYear(),
        folderId: "local",
        width: 1920,
        height: 1080,
        bytes: file.size,
      };
    });
    setLocalAssets((cur) => [...added, ...cur]);
    setSelectedIds(added.map((a) => a.id));
  }, []);

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
      queueIds,
      selectMany,
      selectOnly,
      selectedIds,
      session,
      showHeadshotBadges,
      submitJob,
      toggleSelected,
      view,
      removeFromQueue,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
