**Partner Portal & Dashboard của Arobid**, 

Mục tiêu của kiến trúc:

* **Lean cho hệ thống Arobid** (1 portal – nhiều loại partner)

* **Phân quyền rõ trong tổ chức partner**

* **Kiểm soát dòng tiền trên nền tảng**

* **Cho phép partner chủ động vận hành chương trình**

* **Tránh spam / xung đột / rủi ro tài chính**

**Partner Portal cho phép:**

* partner tổ chức chương trình xúc tiến

* phân phối booth

* hỗ trợ doanh nghiệp

* bán dịch vụ của Partner hoặc “Partner x Arobid bundle”

* theo dõi giao thương

Đồng thời vẫn giữ:

* **dữ liệu tập trung trong SSOT**  
* **AI learning từ DealContext**  
* **Quản lý dòng tiền minh bạch**

---

# **I. Nguyên tắc thiết kế Partner Portal**

## **1\. One Portal – Multi Partner Model**

Tất cả partner dùng **một portal duy nhất**, nhưng module hiển thị theo loại partner.

| Partner type | Vai trò |
| ----- | ----- |
| Strategic partner | hiệp hội, cơ quan nhà nước |
| Expo partner | co-host hoặc turnkey expo |
| Distribution partner | bán booth |
| Alliance partner | cung cấp dịch vụ |
| Government program partner | triển khai chương trình hỗ trợ DN |

---

## **2\. Lean Architecture**

Partner Portal **không tạo dữ liệu giao thương riêng**.

Chỉ đọc / tương tác với SSOT.

| Entity | Thuộc hệ thống |
| ----- | ----- |
| Enterprise | B2B Core |
| Products | Supplier SSOT |
| RFQ | DealContext |
| Deals | DealContext |
| Expo | TradeXpo Engine |

Portal chỉ quản lý \+ CTA phù hợp

PartnerProfile  
PartnerRole  
PartnerQuota  
TradeCreditWallet (của Partner)  
BundleServices  
PartnerRevenue  
PartnerCampaign  
---

## **3\. Các nguyên tắc kiểm soát**

| Nguyên tắc | Mục tiêu |
| ----- | ----- |
| Context-based interaction | tránh spam |
| Platform payment control | kiểm soát dòng tiền |
| Partner revenue transparency | partner thấy doanh thu |
| Role-based permissions | bảo mật |
| Quota tracking | tránh gian lận |

---

# **II. Roles trong tổ chức Partner**

## **Role Matrix**

| Role | Overview | Expo | Members | Bundles | Finance | Chat | Reports |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Partner Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Partner Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Program Manager | ✓ | ✓ | ✓ | ✓ | – | ✓ | ✓ |
| Business Manager | ✓ | – | ✓ | ✓ | – | ✓ | ✓ |
| Operations | – | ✓ | ✓ | – | – | ✓ | ✓ |
| Finance | – | – | – | – | ✓ | – | ✓ |
| Viewer | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ |

Arobid vẫn giữ **Super Admin toàn hệ thống**.

---

# **III. Navigation Structure của Partner Portal**

Partner Portal gồm **8 tab chính**.

Partner Portal  
│  
├ Overview  
├ Expo Programs  
├ Enterprises & Members  
├ Quota & TradeCredits  
├ Service Bundles  
├ Communications  
├ Finance & Settlement  
└ Analytics & Reports  
---

# **IV. TAB 1 — Partner Overview (Command Center)**

Trang tổng quan cho lãnh đạo partner.

### **KPI hiển thị \- cộng dồn từ các Expos/ theo thời gian, có thể filter theo time**

| KPI | Ý nghĩa |
| ----- | ----- |
| Enterprises activated | Expo participation |
| Expo booths used | Enterprise activity |
| TradeCredits allocated | Credits usage |
| RFQ generated | Number (hiệu quả giao thương)  |
| Deal contexts | Number (hiệu quả giao thương) |
| Bundle sales | Bundle adoption |
| Partner revenue | Revenue summary |

---

# **V. TAB 2 — Expo Programs**

Quản lý toàn bộ expo mà partner tham gia. Xem danh sách Expo \-\> chọn Expo. Trường hợp Turnkey, Arobid nhận thanh toán từ partner sau đó khởi tạo turnkey expo theo yêu cầu \-\> xuất hiện trên danh sách Expo

## **1\. Expo participation**

| Chế độ | Quyền |
| ----- | ----- |
| Co-host | mời DN |
| Turnkey | tạo expo theo template |
| Bulk booking | phân phối booth |

---

## **2\. Turnkey Expo Flow**

Partner  
↓  
Create Expo page  
↓  
Setup content  
↓  
Invite enterprises  
↓  
Run expo  
---

## **3\. Co-host Expo Flow**

Arobid creates expo \-\> tạo Code  
↓  
Partner invites enterprises theo Code hoặc Link  
↓  
DN tham gia expo  
---

## **4\. Bulk Booth Distribution**

Partner buys booth quota  
↓  
Allocate to enterprises  
↓  
DN activate booth  
---

# **VI. TAB 3 — Enterprises & Members**

Quản lý doanh nghiệp trong cộng đồng partner.

| Chức năng |
| ----- |
| Enterprise directory |
| Activation tracking |
| Expo participation |
| Trade signals |
| RFQ generated |

---

## **Enterprise Activation Funnel ((trong SSOT)**

Invited  
↓  
Registered  
↓  
Profile completed  
↓  
Expo activated  
↓  
RFQ generated  
---

# **VII. TAB 4 — Quota & TradeCredits**

Đây là module quan trọng nhất với partner nhà nước.

---

# **1\. Booth Quota Management**

Quota gồm:

| Type |
| ----- |
| Booth credits |
| Expo program quota |
| Bulk booth inventory |

---

## **Trạng thái quota**

| Status |
| ----- |
| Available |
| Allocated |
| Consumed |

---

# **2\. Invite Code Engine**

Flow:

Partner creates campaign  
↓  
System generates invite code (được set value của Code)  
↓  
Partner shares code  
↓  
DN register expo  
↓  
Quota deducted  
---

# **3\. TradeCredit System**

TradeCredit dùng để:

| Use |
| ----- |
| Expo booth |
| BFM |
| Alliance services |
| Market data  report |
| Arobid Services |

---

## **TradeCredit Flow**

Partner buys credits  
↓  
Credits vào wallet  
↓  
Partner allocate to enterprises  
↓  
Enterprise uses credits  
---

# **4\. Government Program Flow**

Ví dụ ISC / CSED.

Government partner  
↓  
Buy TradeCredits  
↓  
Create expo program  
↓  
Allocate credits to SMEs  
↓  
SMEs join expo

Điều này phù hợp với chương trình xúc tiến thương mại số .

---

# **VIII. TAB 5 — Service Bundles**

Module cho Alliance Partners.

Bundle gồm:

| Component |
| ----- |
| Partner service |
| Arobid service |

---

## **Bundle Creation Flow**

Partner defines service  
↓  
Select Arobid services  
↓  
Create bundle  
↓  
Set pricing  
↓  
Publish bundle  
---

## **Bundle Pricing**

Bundle price  
\=  
Partner service  
\+ Arobid service  
\- discount  
---

## **Revenue Share**

| Revenue |
| ----- |
| Partner share |
| Arobid share |

---

# **IX. TAB 6 — Communications**

Bao gồm **Partner Message Hub**.

Chat phải gắn context.

| Chat type |
| ----- |
| Service inquiry |
| Bundle purchase |
| Deal support |

---

## **Chat Entry Points**

| Entry |
| ----- |
| Partner page |
| Bundle page |
| DealContext |
| Expo |

---

## **Chat Trigger**

Partner chỉ được chat khi:

| Trigger |
| ----- |
| Bundle interest |
| Service request |
| DealContext |
| Expo participation |

---

## **Chat Flow**

Enterprise asks service  
↓  
Partner chat  
↓  
Bundle purchase  
↓  
Service execution  
---

# **X. TAB 7 — Finance & Settlement**

Hệ thống phải kiểm soát dòng tiền.

---

# **1\. Payment Models**

## **Model 1 — Wholesale Partner**

Partner buys quota  
↓  
Partner sells to enterprises  
↓  
Partner collects payment

Arobid không thu tiền DN.

---

## **Model 2 — Platform Billing**

Enterprise pays Arobid  
↓  
Revenue recorded  
↓  
Partner commission  
---

# **2\. Bundle Payment Flow**

Enterprise purchase bundle  
↓  
Payment to Arobid  
↓  
Revenue split  
↓  
Partner settlement  
---

## **Settlement Cycle**

| Cycle |
| ----- |
| Monthly settlement |

---

# **XI. TAB 8 — Analytics & Reports**

Dashboard phục vụ:

* partner

* government programs

---

## **Metrics**

| Metric |
| ----- |
| Enterprises supported |
| Expo participation |
| RFQ generated |
| Meetings |
| Deal contexts |
| Trade value estimate |

---

## **Automated Reports**

| Report |
| ----- |
| Expo overview |
| Trade activity |
| Industry insight |
| Buyer leads |

# **XII. Security & Risk Control**

| Risk | Control |
| ----- | ----- |
| Spam messaging | trigger chat |
| Fraud quota | quota tracking |
| Financial disputes | settlement logs |
| Data leak | role access |

---

# **XIII. Flywheel của Partner Ecosystem**

Partner Portal đóng vai trò **scale ecosystem**.

Partner  
↓  
Enterprises  
↓  
Expo participation  
↓  
RFQ  
↓  
DealContext  
↓  
Alliance services  
↓  
Deal success  
