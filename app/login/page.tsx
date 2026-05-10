import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { getCurrentSessionUserId } from "@/lib/auth/session"

export default async function LoginPage() {
  const userId = await getCurrentSessionUserId()
  if (userId) {
    const user = await getAuthenticatedUserById(userId)
    if (user?.roles.includes("admin")) redirect("/admin")
    if (user?.roles.includes("exhibitor")) redirect("/partner")
    redirect("/seller")
  }

  return <LoginForm />
}
