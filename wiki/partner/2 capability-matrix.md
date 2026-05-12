| Nhóm năng lực                                 | Co-host                              | Turnkey                                                               | Tenant                                                                       |
| --------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Mô hình hợp tác**                           | Đồng tổ chức Expo cùng Arobid        | Arobid triển khai gần như trọn gói, partner tham gia vận hành sâu hơn | Đối tác có một không gian vận hành mang tính riêng biệt trên nền tảng Arobid |
| **Ai tạo Expo**                               | Arobid                               | Arobid                                                                | Arobid                                                                       |
| **Ai publish Expo**                           | Arobid                               | Arobid                                                                | Arobid                                                                       |
| **Expo được gán cho partner**                 | Có                                   | Có                                                                    | Có                                                                           |
| **Phạm vi truy cập Partner Portal**           | Theo các Expo được gán               | Theo các Expo được gán                                                | Theo tenant và các Expo được gán                                             |
| **Dashboard vận hành Expo**                   | Có                                   | Có                                                                    | Có                                                                           |
| **Theo dõi hiệu quả Expo**                    | Cơ bản                               | Nâng cao hơn                                                          | Nâng cao + góc nhìn tenant tổng hợp                                          |
| **Quản lý nội dung Expo**                     | Giới hạn                             | Rộng hơn                                                              | Rộng hơn, có thể gắn với định dạng tenant                                    |
| **Quản lý exhibitor/participant operations**  | Có ở mức vận hành                    | Có, chi tiết hơn                                                      | Có, chi tiết hơn và có thể tiêu chuẩn hóa theo tenant                        |
| **Quản lý booth / floor / operational setup** | Chủ yếu theo cấu hình Arobid đã dựng | Có thể can thiệp sâu hơn trong giới hạn cho phép                      | Có thể dùng preset hoặc cấu hình mang tính tenant                            |
| **Tuỳ chỉnh giao diện Expo**                  | Rất ít hoặc không có                 | Có ở mức Expo                                                         | Có ở mức tenant và áp dụng xuống Expo                                        |
| **Branding riêng**                            | Không hoặc rất hạn chế               | Có thể theo từng Expo                                                 | Có tenant branding rõ ràng                                                   |
| **Cấu hình business rule**                    | Hạn chế                              | Mở rộng hơn                                                           | Sâu nhất trong 3 mô hình                                                     |
| **Tenant-level settings**                     | Không                                | Không hoặc rất ít                                                     | Có                                                                           |
| **Không gian nhận diện riêng**                | Không                                | Không hoàn chỉnh                                                      | Có                                                                           |
| **Multi-user nội bộ**                         | Chưa cần định nghĩa                  | Có thể phát sinh về sau                                               | Chắc chắn có trong roadmap                                                   |
| **Phase 1 account model**                     | 1 account đại diện partner           | 1 account đại diện partner                                            | 1 primary tenant account                                                     |
| **RBAC nội bộ trong Partner Portal**          | Tương lai nếu cần                    | Tương lai nếu cần                                                     | Có trong roadmap rõ ràng                                                     |
| **Độ tự chủ vận hành**                        | Thấp đến trung bình                  | Trung bình đến cao                                                    | Cao nhất nhưng vẫn dưới control plane của Arobid                             |
| **Mức độ “sản phẩm hóa” cho đối tác**         | Gói hợp tác theo từng Expo           | Gói triển khai sâu theo dự án                                         | Mô hình nền tảng đối tác dài hạn                                             |

Tôi sẽ diễn giải ranh giới business giữa 3 cấp như sau:

**1. Co-host**

- Phù hợp với đối tác cùng Arobid tổ chức một Expo cụ thể
- Họ cần quyền để theo dõi, phối hợp và vận hành Expo đã được giao
- Nhưng Arobid vẫn giữ phần lớn quyền cấu hình lõi

**2. Turnkey**

- Phù hợp với đối tác muốn Arobid triển khai gần như trọn gói nhưng vẫn cần khả năng kiểm soát vận hành sâu hơn
- Họ không chỉ “xem và phối hợp”, mà có thể “điều hành nhiều lớp hoạt động” trong Expo
- Đây là mô hình dịch vụ cao cấp hơn Co-host

**3. Tenant**

- Phù hợp với đối tác chiến lược hoặc tổ chức có nhu cầu sử dụng Arobid như một không gian vận hành riêng
- Họ có bản sắc, cấu hình và mô hình quản trị riêng
- Nhưng vẫn không trở thành Admin Arobid, và vẫn không tự tạo/publish Expo ở giai đoạn hiện tại

Nếu muốn gom lại thành một câu ngắn:

- `Co-host` = **partner vận hành Expo được giao**
- `Turnkey` = **partner vận hành Expo với mức cấu hình sâu hơn**
- `Tenant` = **partner có không gian vận hành riêng trên Arobid**

Tôi cũng đề xuất một cách đặt tầng rất dễ hiểu cho business:

| Tầng                            | Ý nghĩa |
| ------------------------------- | ------- |
| `Expo Partnership`              | Co-host |
| `Managed Expo Solution`         | Turnkey |
| `Partner Operating Environment` | Tenant  |

Bản matrix này đủ để làm nền cho bước tiếp theo: bóc tiếp thành các **nhóm capability cụ thể** như:

- Dashboard & analytics
- Expo content management
- Branding & experience
- Operational configuration
- Commercial settings
- User & access management

Từ đó ta mới xác định chính xác:

- cái gì chỉ Turnkey có
- cái gì chỉ Tenant có
- cái gì Co-host cũng được dùng.
