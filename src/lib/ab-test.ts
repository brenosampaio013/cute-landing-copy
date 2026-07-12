import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight A/B testing utility.
 *
 * - Assignment is stable per browser via localStorage.
 * - Impressions are logged once per (experiment, mount).
 * - Conversions are logged on demand via the returned `trackConversion`.
 * - Falls back gracefully when the user is anonymous — we still assign a
 *   `session_key` so the funnel can be reconstructed later.
 *
 * NOTE: this is intentionally client-side and best-effort. Any critical
 * business rule must remain server-authoritative.
 */

const STORAGE_KEY = "mn.ab.assignments.v1";
const SESSION_KEY_STORAGE = "mn.ab.session";

type Assignments = Record<string, string>;

function readAssignments(): Assignments {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Assignments) : {};
  } catch {
    return {};
  }
}

function writeAssignments(a: Assignments) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function getSessionKey(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return "anon";
  }
}

export function assignVariant<V extends string>(experiment: string, variants: readonly V[]): V {
  if (variants.length === 0) throw new Error("assignVariant requires at least one variant");
  const store = readAssignments();
  const cached = store[experiment];
  if (cached && (variants as readonly string[]).includes(cached)) return cached as V;
  const picked = variants[Math.floor(Math.random() * variants.length)];
  store[experiment] = picked;
  writeAssignments(store);
  return picked;
}

async function logEvent(params: {
  experiment: string;
  variant: string;
  event: "impression" | "conversion";
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    await supabase.from("ab_events").insert({
      experiment: params.experiment,
      variant: params.variant,
      event: params.event,
      user_id: userRes.user?.id ?? null,
      session_key: getSessionKey(),
      metadata: params.metadata ?? {},
    });
  } catch {
    /* logging is best-effort — never break the UI */
  }
}

export type AbTest<V extends string> = {
  variant: V;
  trackConversion: (metadata?: Record<string, unknown>) => void;
};

/**
 * useAbTest — assigns a variant, logs a single impression per mount, and
 * returns a `trackConversion` callback for the CTA.
 */
export function useAbTest<V extends string>(
  experiment: string,
  variants: readonly V[],
  options: { impressionMetadata?: Record<string, unknown>; enabled?: boolean } = {},
): AbTest<V> {
  const { impressionMetadata, enabled = true } = options;
  const variant = useMemo(() => assignVariant(experiment, variants), [experiment, variants]);
  const impressionLogged = useRef(false);

  useEffect(() => {
    if (!enabled || impressionLogged.current) return;
    impressionLogged.current = true;
    void logEvent({ experiment, variant, event: "impression", metadata: impressionMetadata });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, experiment, variant]);

  return {
    variant,
    trackConversion: (metadata) =>
      void logEvent({ experiment, variant, event: "conversion", metadata }),
  };
}
