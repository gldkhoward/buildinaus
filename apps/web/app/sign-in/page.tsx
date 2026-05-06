"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { safeNextPath } from "@/lib/auth/next-path"

type Step = "email" | "code"

export default function SignInPage() {
  // useSearchParams() requires its consumer to live inside a Suspense
  // boundary so the page can prerender under Cache Components.
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNextPath(params.get("next"))
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function sendCode(targetEmail: string) {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: targetEmail,
      type: "sign-in",
    })
    if (error) throw new Error(error.message ?? "Could not send code")
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)
    try {
      await sendCode(email)
      setStep("code")
      setInfo(`We sent a code to ${email}. It expires in 15 minutes.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPending(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp: code })
      if (error) throw new Error(error.message ?? "Invalid code")
      router.push(next ?? "/me")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPending(false)
    }
  }

  async function handleResend() {
    setError(null)
    setInfo(null)
    setPending(true)
    try {
      await sendCode(email)
      setInfo("New code sent.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          {step === "email"
            ? "Enter your email and we'll send you a one-time code."
            : "Enter the 6-digit code we sent to your inbox."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendCode} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !email}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send code"}
          </button>
          <p className="text-xs text-muted-foreground">
            New to BuildinAus?{" "}
            <Link
              href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Verification code</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              required
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.4em] shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
            />
          </label>
          <button
            type="submit"
            disabled={pending || code.length < 4}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Verify and sign in"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setCode("")
                setError(null)
                setInfo(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={pending}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      {info && !error && (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          {info}
        </p>
      )}
    </main>
  )
}

/** Static fallback while the client form mounts. Same dimensions, no inputs. */
function SignInShell() {
  return (
    <main
      aria-busy
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a one-time code.
        </p>
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-10 animate-pulse rounded-md bg-muted/40" />
        <div className="h-10 animate-pulse rounded-md bg-muted/40" />
      </div>
    </main>
  )
}
