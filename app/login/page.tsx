import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { getCurrentSessionUserId } from "@/lib/auth/session"

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const userId = await getCurrentSessionUserId()
  if (userId) {
    if (callbackUrl) redirect(callbackUrl)
    const user = await getAuthenticatedUserById(userId)
    if (user?.roles.includes("sys_admin") || user?.roles.includes("admin")) {
      redirect("/admin")
    }
    if (user?.roles.includes("partner")) redirect("/partner")
    redirect("/seller")
  }

  return <LoginForm />
}
