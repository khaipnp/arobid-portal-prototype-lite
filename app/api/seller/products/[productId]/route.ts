import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import {
  deleteCompanyProduct,
  getProductById
} from "@/lib/tradexpo/db/products"

type Props = {
  params: Promise<{ productId: string }>
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const userId = await requireApiUserId()
    const user = await getAuthenticatedUserById(userId)
    const { productId } = await params

    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    if (product.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "You do not have permission to delete this product." },
        { status: 403 }
      )
    }

    await deleteCompanyProduct(productId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error deleting company product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const userId = await requireApiUserId()
    const user = await getAuthenticatedUserById(userId)
    const { productId } = await params

    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    if (product.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized access to product." },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: product })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
