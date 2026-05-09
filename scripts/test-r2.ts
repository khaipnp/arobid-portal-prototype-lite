import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "../lib/platform/r2";

async function testConnection() {
  console.log("🚀 Đang kiểm tra kết nối tới Cloudflare R2...");

  try {
    // 1. Thử upload một tệp nhỏ
    const testKey = `test-connection-${Date.now()}.txt`;
    console.log(`- Đang thử upload tệp: ${testKey}`);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: testKey,
        Body: "Hello Cloudflare R2 from Gemini CLI!",
        ContentType: "text/plain",
      })
    );
    console.log("✅ Upload thành công!");

    // 2. Thử liệt kê các tệp trong bucket
    console.log(`- Đang liệt kê danh sách tệp trong bucket: ${R2_BUCKET_NAME}`);
    const listResponse = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        MaxKeys: 5,
      })
    );

    console.log("✅ Danh sách tệp (tối đa 5):");
    listResponse.Contents?.forEach((item) => {
      console.log(`  • ${item.Key} (${item.Size} bytes)`);
    });

    console.log("\n✨ Kết nối Cloudflare R2 hoạt động hoàn hảo!");
  } catch (error) {
    console.error("\n❌ Lỗi kết nối R2:");
    console.error(error);
    process.exit(1);
  }
}

testConnection();
