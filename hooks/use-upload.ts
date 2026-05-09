import { useState } from "react"
import { toast } from "sonner"

export type UploadKind = "thumbnail" | "avatar" | "glb" | "image"

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadFile = async (file: File, kind: UploadKind) => {
    setIsUploading(true)
    setProgress(0)

    try {
      // 1. Lấy Presigned URL từ API
      const presignedRes = await fetch("/api/platform/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          kind,
        }),
      })

      if (!presignedRes.ok) throw new Error("Failed to get upload URL")

      const { uploadUrl, fileUrl, assetId } = await presignedRes.json()

      // 2. Upload trực tiếp lên R2
      // Lưu ý: R2 Presigned URL yêu cầu phương thức PUT
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadRes.ok) throw new Error("Failed to upload to R2")

      // 3. Lưu metadata vào Neon DB
      const assetRes = await fetch("/api/platform/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          fileName: file.name,
          fileUrl,
          kind,
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          },
        }),
      })

      if (!assetRes.ok) throw new Error("Failed to save asset metadata")

      toast.success("Upload successful")
      return { assetId, fileUrl }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Upload failed")
      return null
    } finally {
      setIsUploading(false)
      setProgress(100)
    }
  }

  return { uploadFile, isUploading, progress }
}
