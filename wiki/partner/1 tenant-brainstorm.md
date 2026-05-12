**1. Hiện trạng 3 cổng chính**

- `Admin Portal`
  - Dành cho Admin Arobid quản trị hệ thống
- `Partner Portal`
  - Hiện tại đang được hiểu là cổng cho `Expo Owner`
  - `Expo Owner` là user Buyer/Seller được Arobid gán ít nhất 1 Expo
- `User Workspace`
  - Dành cho Buyer và Seller làm việc với các tác vụ cá nhân/nghiệp vụ của họ

**2. Vấn đề mới phát sinh**

- Business đang có thêm khái niệm `tenant`
- Mong muốn các tenant cũng truy cập vào `Partner Portal`
- Điều này làm cho định nghĩa cũ “Partner Portal = cổng cho Expo Owner” trở nên quá hẹp

**3. Hướng mô hình được chọn**
Chúng ta thống nhất đi theo hướng:

- `Partner Portal` nên trở thành **cổng vận hành dành cho partner organizations**
- Không chỉ dành cho Expo Owner nữa

Các loại hợp tác chính gồm:

1. `Co-host`
2. `Turnkey`
3. `Tenant`

**4. Cách hiểu 3 loại hợp tác**

- `Co-host`
  - Gần với mô hình `Expo Owner` hiện tại
  - Arobid tạo Expo rồi gán cho partner
  - Partner vận hành Expo đó trong Partner Portal

- `Turnkey`
  - Cũng do Arobid tạo Expo rồi gán
  - Partner có quyền sâu hơn Co-host
  - Có thể cấu hình nhiều khía cạnh vận hành hơn trong Expo

- `Tenant`
  - Là mô hình hợp tác cao nhất
  - Có thể có giao diện/không gian tenant riêng và mức cấu hình sâu hơn
  - Nhưng **việc tạo Expo và publish Expo vẫn do Arobid thực hiện**
  - Tenant chỉ vận hành và cấu hình trên các Expo được Arobid gán

**5. Quyết định kiến trúc khái niệm**
Ta tách rõ:

- `Partner model`
  - `Co-host | Turnkey | Tenant`

- `Partner organization`
  - Đơn vị hợp tác với Arobid

- `Partner account`
  - Tài khoản truy cập Partner Portal

- `Assigned Expo`
  - Expo do Arobid tạo và gán cho partner organization

- `Partner Portal permissions`
  - Được quyết định theo:
    - loại hợp tác
    - Expo được gán
    - sau này là vai trò của từng user trong tổ chức

**6. Giai đoạn đầu và tương lai của Tenant**

- Phase đầu:
  - Mỗi tenant chỉ cần **1 tài khoản đại diện** để truy cập và vận hành
- Tương lai:
  - Tenant chắc chắn sẽ có **nhiều user nội bộ**
  - Có **phân quyền trong Partner Portal**

Vì vậy:

- Không nên thiết kế dữ liệu/ownership gắn trực tiếp vào 1 user cá nhân
- Nên coi `Tenant` là **organization**
- Account hiện tại chỉ là **primary representative account**

**7. Vị trí của `Expo Owner` sau khi mở rộng mô hình**

- `Expo Owner` không nên tiếp tục là định nghĩa trung tâm của Partner Portal
- Nó nên được hấp thụ vào mô hình `Co-host`
- Có thể xem `Expo Owner` là:
  - một role/capability theo Expo
  - hoặc một profile vận hành tương ứng với partner kiểu Co-host

**8. Kết luận định hướng**
Mô hình tổng thể nên là:

- `Admin Portal`
  - Internal control plane của Arobid

- `Partner Portal`
  - External operating portal cho `Co-host`, `Turnkey`, `Tenant`

- `User Workspace`
  - Không gian làm việc cá nhân của Buyer/Seller
