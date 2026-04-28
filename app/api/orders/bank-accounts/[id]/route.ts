import { NextResponse } from "next/server"

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params
  await request.json().catch(() => null)
  return NextResponse.json(
    {
      error: `Bank account management is disabled for ${id}. Prototype is VNPay-only.`,
    },
    { status: 410 },
  )
}

export async function DELETE(_: Request, { params }: Props) {
  const { id } = await params
  return NextResponse.json(
    {
      error: `Bank account deletion is disabled for ${id}. Prototype is VNPay-only.`,
    },
    { status: 410 },
  )
}
