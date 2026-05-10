"use client"

import { EyeIcon, LockKeyholeIcon, MailIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const FIGMA_EXPO_BACKGROUND = "/auth/login-background.png"

type DemoLoginRole = "admin" | "partner" | "seller" | "buyer"

const DEMO_ACCOUNTS: {
  role: DemoLoginRole
  label: string
  email: string
  password: string
}[] = [
  {
    role: "admin",
    label: "Admin",
    email: "khaipham@arobid.com",
    password: "Admin@Arobid123"
  },
  {
    role: "partner",
    label: "Partner",
    email: "partner.demo@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    role: "seller",
    label: "Seller",
    email: "seller.demo@arobid.com",
    password: "Seller@Arobid123"
  },
  {
    role: "buyer",
    label: "Buyer",
    email: "buyer.demo@arobid.com",
    password: "Buyer@Arobid123"
  }
]

type LoginResponse = {
  error?: string
  redirectPath?: string
}

function LoginTextField({
  id,
  label,
  type,
  value,
  placeholder,
  autoComplete,
  icon,
  action,
  trailing,
  onChange
}: {
  id: string
  label: string
  type: string
  value: string
  placeholder: string
  autoComplete: string
  icon: React.ReactNode
  action?: React.ReactNode
  trailing?: React.ReactNode
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="font-medium text-[#000933] text-xs leading-5"
        >
          {label}
        </Label>
        {action}
      </div>
      <div className="flex h-12 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 text-muted-foreground">
        <span className="grid size-5 place-items-center text-[#64748b]">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="h-full border-0 bg-transparent px-0 text-[#000933] text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        />
        {trailing}
      </div>
    </div>
  )
}

function TermsRow() {
  return (
    <label className="flex items-center gap-2 text-muted-foreground text-xs">
      <span className="grid size-4 shrink-0 place-items-center rounded-[3px] border border-[#e5e7eb] bg-white" />
      <span>
        By clicking, I accept with{" "}
        <span className="font-medium text-legend underline">
          Terms and Conditions
        </span>
      </span>
    </label>
  )
}

function DemoAccountPicker({
  disabled,
  onSelect
}: {
  disabled: boolean
  onSelect: (role: DemoLoginRole) => void
}) {
  return (
    <div className="space-y-2">
      <p className="select-none font-medium text-foreground">Demo accounts</p>
      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(account.role)}
            className="cursor-pointer rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-left transition hover:border-legend hover:bg-legend-50 disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="block font-medium text-foreground text-sm">
              {account.label}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              {account.email}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LoginPanel() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function navigateFromResponse(response: Response) {
    const payload = (await response
      .json()
      .catch(() => null)) as LoginResponse | null

    if (!response.ok) {
      setError(payload?.error ?? "Sign-in failed.")
      return
    }

    router.replace(payload?.redirectPath ?? "/seller")
    router.refresh()
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      await navigateFromResponse(response)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loginAsDemoRole(role: DemoLoginRole) {
    setError("")
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/login/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role })
      })
      await navigateFromResponse(response)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-lg rounded-[20px] bg-white px-6 py-8 shadow-[0_0_10px_rgba(0,55,67,0.1)] backdrop-blur md:px-10 md:py-14">
      <div className="space-y-2">
        <h1 className="font-semibold text-4xl text-foreground leading-10">
          Welcome to <span className="text-legend">Arobid</span>
        </h1>
        <p className="text-muted-foreground text-sm leading-5">
          Sign in your enterprise account
        </p>
      </div>

      <form className="mt-10 space-y-6" onSubmit={onSubmit}>
        <LoginTextField
          id="email"
          label="Email Address"
          type="email"
          value={email}
          placeholder="Enter your email"
          autoComplete="email"
          icon={<MailIcon className="size-4" />}
          onChange={setEmail}
        />
        <LoginTextField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={<LockKeyholeIcon className="size-4" />}
          action={
            <button
              type="button"
              className="font-medium text-legend text-xs leading-5"
            >
              Forgot password
            </button>
          }
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              className="grid size-6 shrink-0 place-items-center text-[#64748b]"
            >
              <EyeIcon className="size-4" />
            </button>
          }
          onChange={setPassword}
        />

        <TermsRow />

        {error ? <p className="text-red-600 text-sm">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-legend hover:bg-legend-600"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm">
        <span className="select-none font-medium text-muted-foreground">
          Don&apos;t have an account?
        </span>
        <Link href="/login" className="font-medium text-legend">
          Sign up
        </Link>
      </div>

      <div className="mt-6 border-[#e5e7eb] border-t pt-5">
        <DemoAccountPicker
          disabled={isSubmitting}
          onSelect={(role) => void loginAsDemoRole(role)}
        />
      </div>
    </section>
  )
}

export function LoginForm({ className }: { className?: string }) {
  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden bg-white [font-family:var(--font-tight)]",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${FIGMA_EXPO_BACKGROUND})` }}
      />
      <div className="absolute inset-0 bg-[#022582]/90" />
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 md:justify-end md:px-[12vw]">
        <LoginPanel />
      </div>
    </main>
  )
}
