"use client"

import { SearchIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data"
import { FloatingChat } from "../chat/floating-chat"
import { ExhibitorCard } from "./exhibitor-card"

type Props = {
  expoName: string
  initialExhibitors: ExpoDetailExhibitor[]
  isAuthenticated?: boolean
}

type ChatProductContext = {
  image: string
  label: string
} | null

export function ExhibitorsSection({
  expoName,
  initialExhibitors,
  isAuthenticated = false
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [items, setItems] = useState(initialExhibitors)
  const [activeChatExhibitor, setActiveChatExhibitor] =
    useState<ExpoDetailExhibitor | null>(null)
  const [activeChatProduct, setActiveChatProduct] =
    useState<ChatProductContext>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickLoginData, setQuickLoginData] = useState({
    fullName: "",
    email: ""
  })

  const handleChatClick = (
    exhibitor: ExpoDetailExhibitor,
    product?: ChatProductContext
  ) => {
    if (!isAuthenticated) {
      setQuickLoginData({ fullName: "", email: "" })
      setShowAuthDialog(true)
      return
    }
    setActiveChatExhibitor(exhibitor)
    setActiveChatProduct(product ?? null)
  }

  const handleQuickLogin = async () => {
    if (!quickLoginData.fullName || !quickLoginData.email) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/quick-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickLoginData)
      })

      if (res.ok) {
        setShowAuthDialog(false)
        router.refresh()
        toast.success("Login successful!")
      } else {
        const payload = await res.json()
        toast.error(payload.error || "Failed to process quick login")
      }
    } catch (_err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = useMemo(() => {
    return Array.from(new Set(initialExhibitors.map((x) => x.category))).sort()
  }, [initialExhibitors])

  const sortedItems = useMemo(() => {
    const tierPriority: Record<string, number> = {
      Premium: 1,
      Professional: 2,
      Basic: 3
    }

    return [...items].sort(
      (a, b) =>
        (tierPriority[a.boothTier] ?? Number.MAX_SAFE_INTEGER) -
          (tierPriority[b.boothTier] ?? Number.MAX_SAFE_INTEGER) ||
        a.company.localeCompare(b.company)
    )
  }, [items])

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams({ expoName })
    if (search.trim()) query.set("search", search.trim())
    if (category !== "all") query.set("category", category)

    fetch(`/api/tradexpo/exhibitors?${query.toString()}`, {
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((payload: { data?: ExpoDetailExhibitor[] }) => {
        setItems(payload.data ?? [])
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [expoName, search, category])

  return (
    <section className="bg-muted px-4 py-16">
      <div className="container mx-auto">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-[32px] leading-10">Exhibitors</h2>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <InputGroup className="rounded-full bg-white">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by exhibitor name..."
              />
            </InputGroup>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full rounded-full bg-white text-sm md:w-44">
                <SelectValue placeholder="All category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All category</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              asChild
              className="rounded-full bg-legend text-sm hover:bg-legend-600"
            >
              <Link href="#booths">Join as Exhibitor</Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sortedItems.map((exhibitor) => (
            <ExhibitorCard
              key={exhibitor.id}
              exhibitor={exhibitor}
              onChatClick={(product) => handleChatClick(exhibitor, product)}
            />
          ))}
        </div>
      </div>

      {activeChatExhibitor && (
        <FloatingChat
          exhibitor={activeChatExhibitor}
          selectedProduct={activeChatProduct}
          onClose={() => {
            setActiveChatExhibitor(null)
            setActiveChatProduct(null)
          }}
        />
      )}

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Quick Login</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your details to register as a buyer and start chatting with
              exhibitors instantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={quickLoginData.fullName}
                onChange={(e) =>
                  setQuickLoginData((prev) => ({
                    ...prev,
                    fullName: e.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={quickLoginData.email}
                onChange={(e) =>
                  setQuickLoginData((prev) => ({
                    ...prev,
                    email: e.target.value
                  }))
                }
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <Button
              className="bg-legend text-white hover:bg-legend-600"
              disabled={isSubmitting}
              onClick={handleQuickLogin}
            >
              {isSubmitting ? "Processing..." : "Continue to Chat"}
            </Button>
          </AlertDialogFooter>
          <div className="mt-2 text-center text-xs">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-legend hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
