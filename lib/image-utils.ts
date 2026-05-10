/**
 * Trả về URL ảnh từ R2 nếu có, hoặc fallback về picsum.photos nếu không có URL.
 *
 * @param url - URL ảnh thực tế (từ DB)
 * @param seed - Seed cho picsum.photos nếu dùng fallback
 * @param width - Chiều rộng ảnh fallback
 * @param height - Chiều cao ảnh fallback
 * @returns
 */
export function getAssetUrl(
  url?: string | null,
  seed?: string,
  width = 640,
  height = 360
) {
  // Nếu đã có URL và không phải là picsum (tức là link R2 hoặc link thật)
  if (url && url.trim().length > 0 && !url.includes("picsum.photos")) {
    return url
  }

  // Nếu URL chính là picsum, giữ nguyên nó để tránh thay đổi seed ngẫu nhiên
  if (url && url.includes("picsum.photos")) {
    return url
  }

  // Fallback về picsum với seed cố định hoặc ngẫu nhiên
  const s = seed || Math.random().toString(36).slice(2)
  return `https://picsum.photos/seed/${encodeURIComponent(s)}/${width}/${height}`
}
