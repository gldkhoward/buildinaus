"use client"

import { useSyncExternalStore } from "react"

/**
 * Client-side registry of intake runs the user has fired.
 *
 * Backed by localStorage so it survives reloads and syncs across tabs (the
 * `storage` event fires in *other* tabs when one tab writes). Each "Run agent"
 * click in the command bar appends a bubble; the IntakeBubbles header UI
 * subscribes to render them.
 *
 * Bubbles are advisory UI state, not authoritative. When the intake API
 * gains a status endpoint, IntakeBubbles will reconcile against it; until
 * then, an idle sweep auto-completes anything older than RUN_TIMEOUT_MS so
 * "running" bubbles don't pile up forever.
 */

const STORAGE_KEY = "buildinaus.intake.bubbles.v1"
const RUN_TIMEOUT_MS = 5 * 60_000 // 5 minutes
const MAX_BUBBLES = 25

export type IntakeBubbleStatus = "running" | "completed" | "errored"

export interface IntakeBubble {
  id: string
  input: string
  status: IntakeBubbleStatus
  startedAt: number
  finishedAt?: number
  resourceLabel?: string
  redirectUrl?: string
}

/* ── Storage IO ────────────────────────────────────────────────────────── */

function readStorage(): IntakeBubble[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as IntakeBubble[]) : []
  } catch {
    return []
  }
}

function writeStorage(next: IntakeBubble[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full / disabled — non-fatal, in-memory state still updates.
  }
}

/* ── External store wired to useSyncExternalStore ──────────────────────── */

let cache: IntakeBubble[] = []
let bootstrapped = false
const listeners = new Set<() => void>()

function ensureBootstrap() {
  if (bootstrapped) return
  cache = readStorage()
  bootstrapped = true
}

function emit(next: IntakeBubble[]) {
  cache = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  ensureBootstrap()
  listeners.add(listener)

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    cache = readStorage()
    listener()
  }
  window.addEventListener("storage", onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot(): IntakeBubble[] {
  ensureBootstrap()
  return cache
}

function getServerSnapshot(): IntakeBubble[] {
  return EMPTY
}
const EMPTY: IntakeBubble[] = []

/**
 * Render hook. SSR-safe — returns [] on the server, hydrates from
 * localStorage on the client without flashing.
 */
export function useIntakeBubbles(): IntakeBubble[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/* ── Mutators ──────────────────────────────────────────────────────────── */

export function addIntakeBubble(
  bubble: Omit<IntakeBubble, "startedAt" | "status"> & {
    status?: IntakeBubbleStatus
  },
): IntakeBubble {
  ensureBootstrap()
  const row: IntakeBubble = {
    status: "running",
    startedAt: Date.now(),
    ...bubble,
  }
  const next = [row, ...cache.filter((b) => b.id !== row.id)].slice(
    0,
    MAX_BUBBLES,
  )
  writeStorage(next)
  emit(next)
  return row
}

export function updateIntakeBubble(
  id: string,
  patch: Partial<IntakeBubble>,
): void {
  ensureBootstrap()
  const next = cache.map((b) => (b.id === id ? { ...b, ...patch } : b))
  writeStorage(next)
  emit(next)
}

export function removeIntakeBubble(id: string): void {
  ensureBootstrap()
  const next = cache.filter((b) => b.id !== id)
  writeStorage(next)
  emit(next)
}

export function clearCompletedBubbles(): void {
  ensureBootstrap()
  const next = cache.filter((b) => b.status === "running")
  writeStorage(next)
  emit(next)
}

/* ── Idle sweep — auto-completes stale "running" bubbles ────────────────
 * Without this, a tab that opens an intake and is then closed leaves a
 * bubble in "running" forever. We sweep on every snapshot read.
 */
function sweepStale(now = Date.now()): IntakeBubble[] | null {
  ensureBootstrap()
  let changed = false
  const next = cache.map((b) => {
    if (b.status !== "running") return b
    if (now - b.startedAt < RUN_TIMEOUT_MS) return b
    changed = true
    return { ...b, status: "completed" as const, finishedAt: now }
  })
  if (!changed) return null
  writeStorage(next)
  emit(next)
  return next
}

if (typeof window !== "undefined") {
  // Sweep periodically while the tab is open.
  setInterval(() => sweepStale(), 30_000)
}
