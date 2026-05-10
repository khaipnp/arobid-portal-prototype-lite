import { randomUUID } from "node:crypto"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextResponse } from "next/server"
import { R2_BUCKET_NAME, r2Client } from "@/lib/platform/r2"

/**
 * POST /api/platform/upload
 * Yêu cầu tạo Presigned URL để client upload trực tiếp lên R2.
 */
export async function POST(req: Request) {
  try {
    const { fileName, contentType, kind } = await req.json()

    if (!fileName || !contentType || !kind) {
      return NextResponse.json(
        { error: "Missing required fields (fileName, contentType, kind)" },
        { status: 400 }
      )
    }

    // Tạo một key duy nhất cho file trên R2
    const fileId = randomUUID()
    const extension = fileName.split(".").pop()
    const key = `${kind}/${fileId}${extension ? `.${extension}` : ""}`

    // Tạo Presigned URL (hiệu lực trong 3600 giây)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

    // Trả về thông tin để client upload và link truy cập dự kiến
    // Lưu ý: fileUrl này cần được cập nhật sau khi upload thành công hoặc dùng Public Domain của R2
    const fileUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      assetId: fileId
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
