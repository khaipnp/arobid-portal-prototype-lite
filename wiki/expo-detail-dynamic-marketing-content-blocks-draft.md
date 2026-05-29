# Draft: Dynamic Marketing Content Blocks cho Expo Detail

## 1. Tóm tắt phạm vi

Tạo một story mới cho việc biến các content section đang hard-code trên Expo Detail thành các section có nguồn dữ liệu rõ ràng theo từng Expo.

Phạm vi draft này tập trung vào 3 block:

1. `Who should join?`
2. `Exhibited Categories`
3. `Giá trị đặc quyền từng đối tượng`

Admin hoặc Expo Owner có thể tùy chỉnh 2 Marketing blocks trong tab `Marketing` của phần tạo/thiết lập Expo:

- Admin cấu hình trong Create/Edit Expo flow của Admin Portal.
- Expo Owner cấu hình trong màn hình thiết lập Expo được gán cho mình.
- Expo Detail public page render `Who should join?` và `Giá trị đặc quyền từng đối tượng` từ Marketing content/default template.
- Expo Detail public page render `Exhibited Categories` từ Expo `Categories` mà user đã chọn trong phần setup Expo; section này không nằm trong tab `Marketing` và không cho phép chỉnh nội dung riêng.

Draft này không thay đổi ngay các story thật. Sau khi Product approve, cần tạo story mới và cập nhật nhẹ các story liên quan trong `TradeXpo / Expo Detail` và `TradeXpo / Expo Management`.

## 2. Tài liệu đã kiểm tra

- `DOMAIN_KNOWLEDGE_MEMORY.md`
- `Template/USER_STORY_TEMPLATE.md`
- `Module/TradeXpo/Expo Detail/EPIC Overview.md`
- `Module/TradeXpo/Expo Detail/[US-01][TX] Expo Detail Layout Foundation.md`
- `Module/TradeXpo/Expo Detail/[US-02][TX] Expo Identity Content (Cover, Thumbnail, Introduction, Industry).md`
- `Module/TradeXpo/Expo Management/[US-01][TX] Create Expo (Admin Portal).md`
- `Module/TradeXpo/Expo Management/[US-03][TX] Expo Hero Banner Media Upload.md`
- `Module/Core/Localization/[US-02][CORE] Multilingual Translation Service.md`
- `Module/Core/Partner Portal/[US-21][CORE] View Assigned Expos and Programs.md`
- `Module/Core/Partner Portal/[US-22][CORE] Open Assigned Expo or Program Operational View.md`

## 3. Câu trả lời đã làm rõ

| # | Câu hỏi | Câu trả lời đã chốt |
|---|---|---|
| 01 | Có nên tạo story/draft mới cho các dynamic content section này không? | Có. Tạo một story/draft mới thay vì chèn trực tiếp vào các story hiện có. |
| 02 | Các block content được cấu hình ở đâu? | `Who should join?` và `Audience Benefits` được cấu hình trong tab `Marketing` của phần tạo/thiết lập Expo. |
| 03 | Ai có thể tùy chỉnh các block này? | Admin trong Create/Edit Expo và Expo Owner trong màn hình thiết lập Expo được gán. |
| 04 | Các block nào thuộc phạm vi đầu tiên? | `Who should join?`, `Exhibited Categories`, và `Giá trị đặc quyền từng đối tượng`. |
| 05 | Label block 1 nên dùng gì? | Đổi từ `Who should attend?` thành `Who should join?`. |
| 06 | Expo Owner sửa Marketing content có được publish ngay không? | Không. Expo Owner sửa nội dung và submit review; Arobid Admin phải review/approve trước khi public content được cập nhật. |
| 07 | `Exhibited Categories` lấy từ nguồn nào? | Lấy từ Expo `Categories` mà user chọn trong setup Expo. Block này không hiển thị trong tab `Marketing` và nội dung không được phép thay đổi riêng. |
| 08 | Khi block chưa có content thì fallback thế nào? | `Who should join?` và `Audience Benefits` dùng default template nếu chưa có content. `Exhibited Categories` không dùng default template riêng vì lấy từ Expo `Categories`. |
| 09 | `Audience Benefits` có cho user cấu hình CTA không? | Không. Không hiển thị `benefit_cards.cta_label` và `benefit_cards.cta_target` trong tab `Marketing` vì user vận hành nội dung không biết route/action nội bộ của hệ thống. |

## 4. Các đầu mục đã giải quyết

- 3 section trong ảnh được xác định là dynamic sections của Expo Detail, không phải static UI copy.
- Phạm vi nên tạo story mới để tránh làm lớn các story foundation/identity hiện có.
- Nội dung của `Who should join?` và `Audience Benefits` được cấu hình theo từng Expo, không hard-code trong frontend.
- Tab `Marketing` là surface cấu hình cho 2 block này.
- Admin và Expo Owner đều là actor cần xem xét trong workflow cấu hình.
- Expo Detail public page chỉ render dữ liệu đã được lưu cho Expo, không phải nơi nguồn quản trị content.
- Expo Owner không publish trực tiếp Marketing content; thay đổi của Expo Owner đi qua luồng submit review để Arobid Admin duyệt.
- `Exhibited Categories` không phải danh sách category tự do và không thuộc tab `Marketing`; source phải lấy từ Expo `Categories`.
- `Who should join?` và `Audience Benefits` có default template fallback khi chưa có content riêng của Expo.
- `Exhibited Categories` không cần default template content vì dữ liệu hiển thị được khởi tạo/tạo card từ Expo `Categories`.
- `Audience Benefits` không cho user cấu hình CTA label/target; block này chỉ quản lý nội dung benefit, icon, featured state, và thứ tự hiển thị.

## 5. Các đầu mục còn lại

| # | Open Item | Khuyến nghị mặc định |
|---|---|---|
| OI-01 | Expo Owner setup surface nằm trong Partner Portal hay một route Expo setup riêng? | Current repo chưa mô tả chi tiết Expo Owner content-edit surface. Khuyến nghị story mới ghi dependency với Partner Portal/Expo setup và để Engineering map route theo kiến trúc hiện có. |
| OI-02 | Có cần giới hạn số card/items mỗi block trong MVP không? | Khuyến nghị có validation để giữ layout ổn định: audience cards 1-6, benefit cards 1-6/card. `Exhibited Categories` lấy theo Expo `Categories`, nên giới hạn hiển thị thuộc rule layout của Expo Detail chứ không phải Marketing tab. Con số cuối cùng cần Product/Design chốt. |

## 6. Quy tắc nghiệp vụ đề xuất

### 6.1. Marketing tab

- System hiển thị tab `Marketing` trong Create/Edit Expo của Admin Portal.
- System hiển thị tab hoặc section `Marketing` trong màn hình thiết lập Expo của Expo Owner nếu Expo Owner có quyền cấu hình content cho Expo được gán.
- Admin có thể lưu/publish Marketing content trong phạm vi Create/Edit Expo theo quyền quản trị hiện có.
- Expo Owner chỉ có thể lưu thay đổi dưới dạng draft/submitted review; nội dung public chỉ cập nhật sau khi Arobid Admin approve.
- Trong thời gian submitted review, public Expo Detail tiếp tục hiển thị phiên bản Marketing content đang published gần nhất.
- Tab `Marketing` gồm 2 configurable blocks:
  - `Who should join?`
  - `Audience Benefits` / `Giá trị đặc quyền từng đối tượng`
- Mỗi block có:
  - enable/disable flag.
  - section title.
  - optional subtitle/description.
  - danh sách item/card có `display_order`.
  - trạng thái validation riêng để tránh làm hỏng layout Expo Detail.
- Nếu `Who should join?` hoặc `Audience Benefits` chưa có content riêng của Expo, system dùng default template của block đó.
- `Exhibited Categories` không hiển thị trong tab `Marketing`, không cho chỉnh nội dung riêng, và không dùng default template riêng; system hiển thị section này từ Expo `Categories`.
- System không render block trên Expo Detail nếu block bị disable hoặc không có nguồn dữ liệu hợp lệ.

### 6.2. Block 1: Who should join?

Block này giới thiệu các nhóm đối tượng nên tham gia Expo.

Dữ liệu đề xuất:

| Field | Required | Ghi chú |
|---|---|---|
| `section_title` | Yes | Default label đề xuất: `Who should join?`. |
| `audience_cards[]` | Yes | Danh sách nhóm đối tượng. |
| `audience_cards.display_order` | Yes | Điều khiển thứ tự hiển thị. |
| `audience_cards.title` | Yes | Ví dụ: `The Buyers`, `The Suppliers`, `The Partners`. |
| `audience_cards.description` | Yes | Mô tả ngắn về giá trị cho nhóm đối tượng. |
| `audience_cards.tags[]` | No | Ví dụ: `Retailers`, `Distributors`, `Architects`. |

Quy tắc:

- Nếu Expo chưa có custom content cho block này, system dùng default template `Who should join?`.
- System render audience cards theo `display_order`.
- Nếu title hoặc description của một card thiếu, system không cho save card đó hoặc đánh dấu validation error.
- Tags là optional; card vẫn render được nếu không có tags.
- UI number index `01`, `02`, `03` nên được sinh từ thứ tự hiển thị, không cần Admin nhập tay.

### 6.3. Block 2: Exhibited Categories

Block này giới thiệu các ngành/danh mục sản phẩm nổi bật của Expo.

Block này không thuộc tab `Marketing`. Nội dung lấy từ Expo `Categories` mà user đã chọn trong phần setup Expo.

Dữ liệu nguồn đề xuất:

| Field | Required | Ghi chú |
|---|---|---|
| Expo `Categories` | Yes | Categories đã được user chọn trong Create/Edit Expo hoặc setup Expo. |
| Category name | Yes | Tên category lấy từ taxonomy/category master data. |
| Category hierarchy/path | No | Hiển thị nếu UX cần phân biệt category cấp 1/2/3. |
| Category display order | No | Theo thứ tự user chọn hoặc thứ tự taxonomy; nếu không có order riêng thì dùng thứ tự stable của category source. |

Quy tắc:

- `Exhibited Categories` lấy source từ Expo `Categories`; system không cho tạo category card ngoài danh sách category của Expo.
- `Exhibited Categories` không hiển thị trong tab `Marketing`.
- Admin/Expo Owner không được chỉnh title, image, ribbon, metric label, CTA, hoặc copy riêng cho `Exhibited Categories` trong Marketing tab.
- Khi user thay đổi Expo `Categories`, public `Exhibited Categories` phải phản ánh danh sách category mới theo rule render của Expo Detail.
- Nếu Expo không có category hợp lệ, system hide `Exhibited Categories` gracefully hoặc hiển thị unavailable state theo rule thiết kế.
- Nếu cần ảnh/category visual, system chỉ lấy từ category master data hoặc design fallback; user không upload/chỉnh ảnh riêng trong Marketing tab.

### 6.4. Block 3: Giá trị đặc quyền từng đối tượng

Block này trình bày lợi ích/privilege cho từng nhóm đối tượng như Buyers, Sellers, Partners.

Dữ liệu đề xuất:

| Field | Required | Ghi chú |
|---|---|---|
| `section_title` | Yes | Ví dụ: `Giá trị đặc quyền từng đối tượng`. |
| `section_subtitle` | No | Mô tả ngắn về giá trị tổng quan. |
| `benefit_cards[]` | Yes | Danh sách card theo đối tượng. |
| `benefit_cards.audience_name` | Yes | Ví dụ: `Dành cho Buyers`, `Dành cho Sellers`, `Dành cho Partners`. |
| `benefit_cards.icon` | No | Icon từ design system hoặc icon key. |
| `benefit_cards.benefit_items[]` | Yes | Danh sách bullet benefits. |
| `benefit_cards.is_featured` | No | Đánh dấu card nổi bật, ví dụ Sellers card ở giữa. |
| `benefit_cards.display_order` | Yes | Thứ tự hiển thị. |

Quy tắc:

- Nếu Expo chưa có custom content cho block này, system dùng default template `Audience Benefits`.
- System render benefit cards theo `display_order`.
- Chỉ nên có tối đa một card `is_featured = true` trong cùng block để tránh layout bị nhiều card nổi bật.
- Tab `Marketing` không hiển thị field `cta_label` hoặc `cta_target` cho benefit cards.
- Admin/Expo Owner không phải chọn route/action cho benefit cards.
- Nếu sau này Product muốn có CTA trong benefit cards, CTA phải là system-defined action hoặc story riêng do Product/Engineering map route, không phải input tự do trong Marketing tab.

### 6.5. Localization và content version

- Các Marketing block là TradeXpo Expo Detail content, nên cần dùng Core Localization flow cho supported display languages `en` và `vi`.
- User-entered source content cần lưu original language và `content_version`.
- Khi source content thay đổi, translations/cache cũ không được reuse cho version mới nếu không hợp lệ.
- Nếu translation chưa sẵn sàng, Expo Detail fallback theo rule Core Localization hiện có.
- Static UI labels của editor/tab không thuộc scope của story này; static label localization thuộc Localization/UI scope riêng.

### 6.6. Public render behavior

- Expo Detail load content source theo `expo_id`/`expo_slug`: Marketing content/default template cho `Who should join?` và `Audience Benefits`, Expo `Categories` cho `Exhibited Categories`.
- System render các block theo thứ tự Product/Design chốt trong Expo Detail layout.
- Nếu block disabled hoặc không có data hợp lệ, system hide block gracefully và không để khoảng trắng gây vỡ layout.
- Với `Who should join?` và `Audience Benefits`, thiếu custom content không được coi là empty state nếu default template khả dụng; system render default template.
- Với `Exhibited Categories`, block render từ Expo `Categories`; nếu vì dữ liệu bất thường mà Expo không có categories, system hide block hoặc báo unavailable state theo rule thiết kế, không dùng default category giả và không lấy content từ tab `Marketing`.
- Public page không cho Visitor edit content.
- Marketing content không thay đổi rule CTA hiện có về `Join as Exhibitor`, `Virtual Lobby`, booth booking, payment, hay registration window.

## 7. UX / Process đề xuất

### User Flow 1: Admin cấu hình Marketing khi tạo Expo

**Given:** Admin đang ở Create Expo form.

1. Admin nhập General Info, schedule, owner, category, và các field Expo setup khác.
2. Admin mở tab `Marketing`.
3. System hiển thị 2 block cấu hình: `Who should join?` và `Giá trị đặc quyền từng đối tượng`.
4. Admin nhập title, subtitle, cards/items, media nếu cần.
5. System không hiển thị `Exhibited Categories` trong tab `Marketing`.
6. Admin xem validation inline cho field thiếu/sai.
7. Admin save/submit Expo.
8. System lưu Marketing content gắn với Expo.
9. Expo Detail render `Who should join?` và `Giá trị đặc quyền từng đối tượng` từ Marketing content/default template; `Exhibited Categories` render từ Expo `Categories`.

### User Flow 2: Admin edit Marketing content cho Expo đã có

**Given:** Admin đang ở Edit Expo form của một Expo đã tồn tại.

1. Admin mở tab `Marketing`.
2. System load Marketing content hiện tại của Expo.
3. Admin sửa thứ tự card, text, image, icon, hoặc featured state.
4. Admin save.
5. System cập nhật content version và làm mới public Expo Detail theo rule publish/status đã chốt.

### User Flow 3: Expo Owner cấu hình Marketing cho Expo được gán

**Given:** Expo Owner có quyền cấu hình content cho Expo được gán.

1. Expo Owner mở màn hình thiết lập/quản lý Expo.
2. System validate Expo Owner chỉ được truy cập Expo trong assigned scope.
3. Expo Owner mở tab `Marketing`.
4. System hiển thị các block Marketing có thể edit.
5. Expo Owner nhập/sửa nội dung.
6. Expo Owner submit review.
7. System lưu thay đổi ở trạng thái submitted review.
8. Arobid Admin review và approve/reject.
9. Nếu approve, system cập nhật published Marketing content cho Expo Detail.
10. Nếu reject, Expo Owner thấy trạng thái bị reject và có thể chỉnh sửa rồi submit lại.
11. System không cho Expo Owner sửa các platform-owned setting ngoài scope Marketing nếu không có quyền.

### User Flow 4: Visitor xem dynamic content trên Expo Detail

**Given:** Visitor mở public Expo Detail.

1. System load Expo Detail payload.
2. System load content source hợp lệ của Expo.
3. System render `Who should join?` từ custom content của Expo; nếu chưa có custom content, system render default template.
4. System render `Exhibited Categories` từ Expo `Categories`.
5. System render `Giá trị đặc quyền từng đối tượng` từ custom content của Expo; nếu chưa có custom content, system render default template.
6. System hide block bị disable, empty, hoặc invalid mà không làm hỏng layout.
7. Draft này không định nghĩa CTA cấu hình bởi user trong `Audience Benefits`.

## 8. Acceptance Criteria đề xuất

| # | Given | When | Then |
|---|---|---|---|
| AC-01 | Admin mở Create/Edit Expo | Form render | System hiển thị tab `Marketing` để cấu hình các Marketing content blocks được phép chỉnh |
| AC-02 | Admin mở tab `Marketing` | Tab render | System chỉ hiển thị 2 block cấu hình: `Who should join?` và `Giá trị đặc quyền từng đối tượng`; `Exhibited Categories` không xuất hiện trong tab này |
| AC-03 | Admin nhập dữ liệu hợp lệ cho `Who should join?` | Admin save Expo | System lưu audience cards với title, description, tags, và display order |
| AC-04 | Admin nhập audience card thiếu title hoặc description | Admin save | System hiển thị validation error và không lưu card invalid |
| AC-05 | User chọn Expo `Categories` trong phần setup Expo | Expo Detail render | System hiển thị `Exhibited Categories` từ các categories đã chọn |
| AC-06 | User mở tab `Marketing` | Tab render | System không cho chỉnh title, image, ribbon, metric label, CTA, hoặc copy riêng của `Exhibited Categories` |
| AC-07 | Category source không có image/visual | Expo Detail render | System dùng category master data/design fallback hoặc ẩn media area theo thiết kế, không hiện broken image và không cho upload ảnh riêng trong Marketing tab |
| AC-08 | Admin cấu hình `Giá trị đặc quyền từng đối tượng` | Expo Detail render | System hiển thị benefit cards và benefit items theo display order |
| AC-09 | User mở editor của `Audience Benefits` | Tab `Marketing` render | System không hiển thị field `benefit_cards.cta_label` hoặc `benefit_cards.cta_target` |
| AC-10 | Nhiều benefit cards được đánh dấu featured | Admin save | System chỉ cho phép tối đa một featured card hoặc báo validation error |
| AC-11 | Một Marketing block bị disable | Expo Detail render | System không hiển thị block đó và không để broken spacing |
| AC-12 | `Who should join?` chưa có custom content của Expo | Expo Detail render | System hiển thị default template của `Who should join?` |
| AC-13 | `Audience Benefits` chưa có custom content của Expo | Expo Detail render | System hiển thị default template của `Audience Benefits` |
| AC-14 | `Exhibited Categories` chưa có custom Marketing content | Expo Detail render | System hiển thị categories từ Expo `Categories`, không dùng default category template riêng và không cần Marketing content |
| AC-15 | Một Marketing block không có nguồn dữ liệu hợp lệ và không có default/template rule hợp lệ | Expo Detail render | System hide block gracefully |
| AC-16 | Visitor mở Expo Detail | Content/source data tồn tại | System render content theo rule đã chốt: Marketing content/default template cho block 1 và 3, Expo `Categories` cho `Exhibited Categories` |
| AC-17 | Visitor xem `Audience Benefits` | Section render | System hiển thị benefit content mà không phụ thuộc vào CTA label/target do user cấu hình |
| AC-18 | Expo Owner mở setup của Expo được gán | Expo Owner có quyền content setup | System cho phép truy cập tab `Marketing` trong assigned scope |
| AC-19 | Expo Owner submit Marketing content thay đổi | Submit review thành công | System lưu thay đổi ở trạng thái submitted review và không publish trực tiếp ra Expo Detail |
| AC-20 | Admin approve Marketing content do Expo Owner submit | Approval thành công | System publish phiên bản Marketing content đã được duyệt ra Expo Detail |
| AC-21 | Admin reject Marketing content do Expo Owner submit | Rejection thành công | System giữ phiên bản public hiện tại và cho Expo Owner chỉnh sửa/submitted lại |
| AC-22 | Expo Owner yêu cầu sửa Marketing content của Expo không được gán | Request được gửi | System chặn truy cập và không trả content/edit capability |
| AC-23 | Marketing source content thay đổi | Content được save/publish | System tăng content version và áp dụng Core Localization rule cho bản dịch hiển thị |
| AC-24 | Translation chưa sẵn sàng | Visitor mở Expo Detail | System fallback theo Core Localization rule và không block page rendering |

## 9. File bị ảnh hưởng sau khi approve

Đề xuất sau khi draft được approve:

- Tạo mới `Module/TradeXpo/Expo Detail/[US-14][TX] Dynamic Marketing Content Blocks for Expo Detail.md` hoặc ticket ID tiếp theo nếu numbering thay đổi.
- Cập nhật `Module/TradeXpo/Expo Detail/EPIC Overview.md`:
  - thêm business value cho dynamic marketing content.
  - thêm các block mới vào input/process/layout.
  - thêm story mới vào Story Decomposition.
- Cập nhật `Module/TradeXpo/Expo Detail/[US-01][TX] Expo Detail Layout Foundation.md`:
  - thêm các dynamic sections vào section order nếu Product/Design chốt vị trí.
  - làm rõ block nào optional/hide gracefully.
- Cập nhật `Module/TradeXpo/Expo Management/[US-01][TX] Create Expo (Admin Portal).md` hoặc tạo story enhance riêng cho `Marketing` tab trong Create/Edit Expo.
- Nếu Expo Owner setup nằm trong Partner Portal, cập nhật/tách story liên quan Partner Portal assigned Expo setup để mở content-edit scope.
- Cập nhật `DOMAIN_KNOWLEDGE_MEMORY.md` sau khi refinement thật được approve và áp dụng.

## 10. Rủi ro / giả định

- Current Expo Detail docs chưa có 3 dynamic sections này; story mới cần đồng bộ EPIC và Layout Foundation để tránh frontend tiếp tục hard-code.
- Current Partner Portal docs nghiêng về assigned scope/operational view, chưa mô tả đầy đủ Expo Owner content setup. Nếu cho Expo Owner edit Marketing content, cần làm rõ access, route, và publish/review lifecycle.
- `Exhibited Categories` phụ thuộc vào chất lượng Expo `Categories`; nếu category master data thiếu tên/visual, UI cần fallback thiết kế nhưng không được mở quyền chỉnh riêng trong Marketing tab.
- Default template chỉ áp dụng cho `Who should join?` và `Audience Benefits`; template copy cần đủ trung tính hoặc theo Expo template/industry để tránh hiển thị sai đối tượng.
- Draft này không cho cấu hình CTA trong `Audience Benefits`; nếu sau này cần CTA, cần story riêng để Product/Engineering sở hữu route/action thay vì để user nhập.
- Multilingual content cần canh với Core Localization; nếu không, Expo Detail có thể hiện block mới chỉ bằng một ngôn ngữ trong khi các content khác có fallback.
