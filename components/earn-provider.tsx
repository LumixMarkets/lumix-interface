"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useWallet } from "./wallet-provider";
import { createEarnDemoProcessor, type EarnDraft, type EarnResult, type EarnSort } from "./earn-model";
import { createEarnSession, restoreEarnSession, serializeEarnSession, type EarnSession } from "./earn-detail-model";

type ListView = { tab: "all" | "mine"; sort: EarnSort; direction: "asc" | "desc" };
type EarnContextValue = EarnSession & {
  loading: boolean; pending: boolean; announcement: string;
  listView: ListView; setListView: (next: ListView) => void;
  submit: (draft: EarnDraft) => Promise<EarnResult>;
};
const EarnContext = createContext<EarnContextValue | null>(null);
const storageKey = "lumix-earn-demo-v1";

export function EarnProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const connectedRef = useRef(wallet.isAuthenticated);
  useEffect(() => { connectedRef.current = wallet.isAuthenticated; }, [wallet.isAuthenticated]);
  const [session, setSession] = useState(createEarnSession);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [listView, setListView] = useState<ListView>({ tab: "all", sort: "deposits", direction: "desc" });
  const processorRef = useRef<ReturnType<typeof createEarnDemoProcessor> | null>(null);
  const sessionRef = useRef(session);
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    let restored = createEarnSession();
    try { restored = restoreEarnSession(window.sessionStorage.getItem(storageKey)); } catch { /* Session storage is optional. */ }
    sessionRef.current = restored;
    // Recheck connection before completing a delayed action.
    processorRef.current = createEarnDemoProcessor(restored.state, () => new Promise<void>((resolve, reject) => {
      window.setTimeout(() => connectedRef.current ? resolve() : reject(new Error("Disconnected")), 700);
    }));
    const timer = window.setTimeout(() => { setSession(restored); setLoading(false); }, 700);
    return () => { activeRef.current = false; window.clearTimeout(timer); };
  }, []);

  const submit = useCallback(async (draft: EarnDraft): Promise<EarnResult> => {
    if (!connectedRef.current) return { ok: false, message: "Connect your wallet to manage your position." };
    const processor = processorRef.current;
    if (!processor) return { ok: false, message: "Pools are loading. Try again in a moment." };
    if (processor.isPending()) return { ok: false, message: "An action is processing. Wait for it to finish." };
    setPending(true);
    setAnnouncement("");
    const result = await processor.submit(draft);
    if (result.ok) {
      const next = { state: result.state, actions: [...sessionRef.current.actions, result.action] };
      sessionRef.current = next;
      try { window.sessionStorage.setItem(storageKey, serializeEarnSession(next)); } catch { /* In-memory state still works. */ }
      if (activeRef.current) { setSession(next); setAnnouncement(result.message); }
    }
    if (activeRef.current) setPending(false);
    return result;
  }, []);

  return <EarnContext.Provider value={{ ...session, loading, pending, announcement, listView, setListView, submit }}>{children}</EarnContext.Provider>;
}

export function useEarn() {
  const context = useContext(EarnContext);
  if (!context) throw new Error("Earn components must be inside EarnProvider.");
  return context;
}
