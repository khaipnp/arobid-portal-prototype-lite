import { NextResponse } from "next/server"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function PUT(request: Request, { params }: Props) {
  const { expoId } = await params
  await request.json().catch(() => null)
  return NextResponse.json(
    {
      error: `Per-expo payment configuration is disabled for ${expoId}. Prototype is VNPay-only.`,
    },
    { status: 410 },
  )
}

export async function DELETE(_: Request, { params }: Props) {
  const { expoId } = await params
  return NextResponse.json(
    {
      error: `Per-expo payment configuration reset is disabled for ${expoId}. Prototype is VNPay-only.`,
    },
    { status: 410 },
  )
}
