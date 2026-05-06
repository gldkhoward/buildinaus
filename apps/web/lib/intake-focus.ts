"use client"

const EVENT = "buildinaus:focus-command-bar"

export function focusCommandBar(prefill?: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<FocusCommandBarDetail>(EVENT, {
      detail: { prefill: prefill ?? "" },
    }),
  )
}

export function onFocusCommandBar(
  handler: (detail: FocusCommandBarDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<FocusCommandBarDetail>).detail ?? {
      prefill: "",
    }
    handler(detail)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

export interface FocusCommandBarDetail {
  prefill: string
}
