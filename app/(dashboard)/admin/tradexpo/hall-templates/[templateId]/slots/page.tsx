import { redirect } from "next/navigation"

export default async function HallTemplateSlotsPage({
  params
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  redirect(`/admin/tradexpo/hall-templates/${templateId}`)
}
