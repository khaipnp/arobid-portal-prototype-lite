import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import {
  getProductById,
  listCompanyProducts,
  upsertCompanyProduct
} from "@/lib/tradexpo/db/products"

export async function GET() {
  try {
    const userId = await requireApiUserId()
    const user = await getAuthenticatedUserById(userId)

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "User is not associated with a company." },
        { status: 400 }
      )
    }

    const products = await listCompanyProducts(user.companyId)
    return NextResponse.json({ data: products })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error fetching company products:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireApiUserId()
    const user = await getAuthenticatedUserById(userId)

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "User is not authorized to manage products." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Ownership check for updates
    if (body.id) {
      const existingProduct = await getProductById(body.id)
      if (existingProduct && existingProduct.companyId !== user.companyId) {
        return NextResponse.json(
          { error: "Unauthorized to update this product." },
          { status: 403 }
        )
      }
    }

    const productData = {
      ...body,
      companyId: user.companyId
    }

    const productId = await upsertCompanyProduct(productData)
    return NextResponse.json({ ok: true, id: productId })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error saving company product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
