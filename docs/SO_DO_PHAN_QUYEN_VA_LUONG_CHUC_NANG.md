# Sơ Đồ Trực Quan: Phân Quyền 3 Cấp, Ma Trận Quyền Hạn & Luồng Liên Kết Chức Năng

Tài liệu này trực quan hóa toàn bộ cấu trúc phân quyền và cách 6 phân hệ trong **AutoBiz AI** liên kết dữ liệu với nhau theo thời gian thực trên nền tảng **Supabase Postgres**.

---

## 1. Cây Phân Cấp 3 Quyền & Phạm Vi Cô Lập Dữ Liệu (RBAC & Multi-Tenant)

```mermaid
flowchart TD
    Root["Hệ Thống AutoBiz AI<br/>(Supabase Postgres + RLS)"]

    Root --> R1["CẤP 1: ADMIN TỔNG (superadmin)<br/>Đường dẫn ẩn: /admin"]
    Root --> R2["CẤP 2: CHỦ SHOP (shop_owner)<br/>Đăng ký từ / hoặc do Admin cấp"]
    Root --> R3["CẤP 3: CTV / KOC (ctv)<br/>Tự đăng ký hoặc do Shop/Admin cấp"]

    R1 --> D1["Phạm vi dữ liệu:<br/>TOÀN HỆ THỐNG (100% Users, SP, Link, Đơn)"]

    R2 --> R2A["Chủ Shop Có CTV<br/>(persona: shop_with_affiliates)"]
    R2 --> R2B["Chủ Shop Tự Bán<br/>(persona: shop_solo)"]

    R2A --> D2A["Dữ liệu riêng Shop + Đội CTV<br/>Mở bảng chia hoa hồng & Quản lý CTV"]
    R2B --> D2B["Chỉ dữ liệu riêng của Shop<br/>Ẩn bảng CTV & Quản lý Tài khoản"]

    R3 --> R3A["KOC / Affiliate Sàn Độc Lập<br/>(persona: independent_affiliate)"]
    R3 --> R3B["CTV Thuộc Shop<br/>(VD: ctv01_minh)"]

    R3A --> D3A["Chỉ thấy SP/Link cá nhân tự tạo<br/>Được phép tự thêm/xóa Link Shopee/TikTok"]
    R3B --> D3B["Xem kho hàng của Shop (chỉ đọc)<br/>Chỉ thấy click & hoa hồng theo sub_id riêng"]
```

---

## 2. Ma Trận Liên Kết Quyền Hạn Với 6 Phân Hệ Chức Năng

```mermaid
flowchart LR
    subgraph Roles["3 Cấp Phân Quyền (5 Chế Độ)"]
        SA["Admin Tổng<br/>(superadmin)"]
        SC["Chủ Shop<br/>(Có CTV)"]
        SS["Chủ Shop<br/>(Tự bán)"]
        KOC["KOC / Affiliate<br/>(Độc lập)"]
        CTV["CTV Thuộc Shop<br/>(sub_id khóa)"]
    end

    subgraph Modules["6 Phân Hệ Chức Năng Trong App"]
        M1["1. Tổng quan & FinTech<br/>(Click, GMV, Biểu đồ 5 kênh)"]
        M1B["1b. Bảng Hoa Hồng CTV<br/>& Chốt đơn thủ công"]
        M2["2. Studio Đa Kênh<br/>(AI 5 nền tảng + /r/:code)"]
        M3["3. Kho Hàng / Link SP<br/>(Thêm / Sửa / Xóa)"]
        M4["4. Hàng Đợi & Lịch Phát<br/>(Đăng ngay / Lên lịch)"]
        M5A["5a. Cài Đặt Cá Nhân<br/>(Token 5 MXH + AI + Lịch)"]
        M5B["5b. Cài Đặt Webhook<br/>& Bảo trì dữ liệu"]
        M6["6. Quản Lý Tài Khoản<br/>(Cấp / Đổi quyền / Khóa)"]
    end

    SA -->|"Toàn hệ thống"| M1
    SA -->|"Toàn quyền"| M1B
    SA -->|"Toàn quyền"| M2
    SA -->|"Mọi SP"| M3
    SA -->|"Mọi bài"| M4
    SA -->|"Cấu hình tổng"| M5A
    SA -->|"Toàn quyền"| M5B
    SA -->|"Cấp cả 3 vai trò"| M6

    SC -->|"Shop + CTV"| M1
    SC -->|"Duyệt & chia"| M1B
    SC -->|"Toàn quyền"| M2
    SC -->|"SP của Shop"| M3
    SC -->|"Bài của Shop"| M4
    SC -->|"Token riêng"| M5A
    SC -->|"Webhook Shop"| M5B
    SC -->|"Chỉ tạo/sửa CTV"| M6

    SS -->|"Chỉ doanh thu Shop"| M1
    SS -->|"Toàn quyền"| M2
    SS -->|"SP của Shop"| M3
    SS -->|"Bài của Shop"| M4
    SS -->|"Token riêng"| M5A
    SS -->|"Webhook Shop"| M5B

    KOC -->|"Chỉ số cá nhân"| M1
    KOC -->|"Khóa sub_id"| M2
    KOC -->|"SP/Link cá nhân"| M3
    KOC -->|"Bài cá nhân"| M4
    KOC -->|"Token riêng"| M5A

    CTV -->|"Chỉ theo sub_id"| M1
    CTV -->|"Khóa sub_id"| M2
    CTV -.->|"Chỉ xem & nạp vào Studio"| M3
    CTV -->|"Bài cá nhân"| M4
    CTV -->|"Token riêng"| M5A
```

> [!TIP]
> **Quy ước mũi tên trong sơ đồ:**
> - **Mũi tên liền (`-->`)**: Có quyền truy cập & thao tác (tạo/sửa/xóa trong phạm vi dữ liệu cho phép).
> - **Mũi tên đứt (`-.->`)**: Chỉ có quyền **xem & nạp dữ liệu sang Studio** (không được thêm/sửa/xóa).
> - **Không có mũi tên nối**: Phân hệ/bảng đó được **ẩn tự động trên giao diện** và **chặn HTTP 403 ở Backend**.

---

## 3. Luồng Liên Kết Dữ Liệu Giữa Các Chức Năng (End-to-End Flow)

Sơ đồ dưới đây cho thấy dữ liệu chảy xuyên suốt từ lúc cài đặt Token cho đến khi sinh bài AI, phát sóng đa kênh, đếm click và chốt hoa hồng:

```mermaid
flowchart TD
    Step0["CÀI ĐẶT & KẾT NỐI KÊNH (Tab 1, 2, 3)<br/>Lưu Token FB, Instagram, TikTok, Zalo, Shopee, Telegram<br/>+ Gemini Key + Giọng văn AI + Giãn cách lịch đăng"]

    Step1["KHO HÀNG / LINK AFFILIATE CÁ NHÂN<br/>Chủ shop thêm SP kho HOẶC KOC dán Link Shopee/TikTok"]

    Step2["STUDIO ĐA KÊNH<br/>1. Nạp SP từ Kho hoặc nhập tay<br/>2. AI Gemini lọc từ cấm & sinh 5 bài (FB, IG, TikTok, Zalo, Shopee)<br/>3. Rút gọn Link gốc -> /r/:code (gắn UTM + sub_id)"]

    Step3A["PHÂN PHỐI NGAY (Live Dispatch)<br/>Gọi Adapter API đẩy trực tiếp:<br/>Facebook Graph | Instagram Graph | TikTok | Zalo | Shopee"]

    Step3B["HÀNG ĐỢI & LỊCH PHÁT<br/>Xếp lịch tự động theo khung giờ vàng<br/>Hỗ trợ Đăng ngay hoặc Xóa bài"]

    Step4["KHÁCH HÀNG BẤM LINK /r/:code<br/>1. Bộ lọc chống Bot/Spam kiểm tra IP & User-Agent<br/>2. Ghi nhận +1 Click thật vào Supabase<br/>3. Chuyển hướng 302 tới trang mua hàng"]

    Step5["CHỐT ĐƠN HÀNG<br/>- Tự động qua Webhook (Pancake/Sapo/Shopee) chống trùng orderId<br/>- Hoặc Chủ shop bấm Chốt đơn thủ công"]

    Step6["TỔNG QUAN & FINTECH<br/>Cập nhật Realtime:<br/>Click UTM -> CVR -> GMV -> Hoa hồng CTV -> Thực thu Chủ Shop<br/>& Biểu đồ 5 nền tảng"]

    Step0 -->|"Cung cấp Token, Giọng AI & Lịch"| Step2
    Step0 -->|"Cung cấp API Token để đăng bài"| Step3A
    Step1 -->|"Nút Nạp vào Studio (1 chạm)"| Step2
    Step2 -->|"Bấm Phân phối Đa Kênh Ngay"| Step3A
    Step2 -->|"Bấm Lên lịch phát"| Step3B
    Step3B -->|"Đến giờ / Bấm Đăng ngay"| Step3A
    Step3A -->|"Bài đăng kèm link /r/:code"| Step4
    Step4 -->|"Cập nhật lượt Click & Ước tính"| Step6
    Step4 -->|"Khách đặt mua thành công"| Step5
    Step5 -->|"Cộng Doanh thu thực & Hoa hồng"| Step6
```

---

## 4. Chuỗi Tương Tác Thực Tế Giữa Chủ Shop, CTV & Hệ Thống (Sequence)

```mermaid
sequenceDiagram
    actor Shop as Chủ Shop (shop_owner)
    actor CTV as CTV / KOC (ctv)
    participant App as AutoBiz AI (Express + AI)
    participant DB as Supabase Postgres
    actor Buyer as Khách Mua Hàng
    participant POS as POS / Sàn TMĐT (Webhook)

    Shop->>App: 1. Thêm sản phẩm + % Hoa hồng vào Kho Hàng
    App->>DB: Lưu sản phẩm (gắn owner = shop)

    CTV->>App: 2. Đăng nhập -> Nạp SP vào Studio (hoặc tự dán link Shopee)
    App->>App: 3. AI sinh 5 bài (FB, IG, TikTok, Zalo, Shopee) + Tạo /r/CODE (khóa sub_id)
    App->>DB: Lưu shortlink /r/CODE (gắn sub_id & owner)
    CTV->>App: 4. Phân phối ngay hoặc Lên lịch phát bằng Token MXH cá nhân

    Buyer->>App: 5. Bấm link /r/CODE từ Facebook / Instagram / TikTok
    App->>App: Kiểm tra chống Bot/Spam
    App->>DB: Ghi +1 Click thật & tính hoa hồng ước tính
    App-->>Buyer: Chuyển hướng 302 tới trang sản phẩm

    Buyer->>POS: 6. Thanh toán & nhận hàng thành công
    POS->>App: 7. POST /api/webhooks/order (orderId, shortCode/subId, status: completed)
    App->>DB: Kiểm tra chống trùng orderId -> Chốt doanh thu & hoa hồng

    Shop->>App: 8. Xem Tổng quan -> Thấy GMV, Hoa hồng phải trả & Thực thu Shop
    CTV->>App: 9. Xem Tổng quan -> Thấy Click & Hoa hồng thực chốt của riêng mình
```
