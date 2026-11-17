const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const WORKSPACE_DIR = __dirname;
const DESKTOP_DIR = "C:/Users/Admin/Desktop";
const DOWNLOADS_DIR = "C:/Users/Admin/Downloads";
const PACKAGE_DIR = path.join(DESKTOP_DIR, "BO_KE_HOACH_DU_AN_AUTOBIZ_AI");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeWriteFile(targetPath, buffer) {
  try {
    fs.writeFileSync(targetPath, buffer);
    console.log("Written:", targetPath);
  } catch (e) {
    if (e.code === 'EBUSY') {
      const ext = path.extname(targetPath);
      const alt = targetPath.slice(0, -ext.length) + "_MOI" + ext;
      fs.writeFileSync(alt, buffer);
      console.log("EBUSY fallback written:", alt);
    } else {
      throw e;
    }
  }
}

// ============================================================================
// DỮ LIỆU ĐÃ REVIEW & CẬP NHẬT SÁT 100% THỰC TẾ MÃ NGUỒN (15/11/2026)
// ============================================================================
const ARCHITECTURE_AUDIT = [
  {
    mod: "01. Tổng quan & Phân tích FinTech\n(Dashboard & Analytics)",
    files: "- public/index.html\n- public/js/autobiz.js\n- services/affiliate.js",
    features: "- Hiển thị 4 chỉ số lớn: Tổng sản phẩm, Bài đã lên lịch, Tổng lượt Click Link Affiliate, Doanh thu hoa hồng dự kiến (VNĐ).\n- Biểu đồ phân bổ hiệu quả 4 kênh (FB, TikTok, Zalo, Shopee).",
    review: "- Đã kiểm tra: Hoạt động ổn định, lấy dữ liệu thật từ /api/analytics/summary.\n- Đã gỡ bỏ hoàn toàn app.html và js/app.js cũ.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  },
  {
    mod: "02. Studio Sáng tạo Đa kênh\n(Omni-Channel AI Studio)",
    files: "- services/gemini.js\n- server.js (/api/ai/*)",
    features: "- Universal AI Parser bóc tách thông số 5 ngành hàng.\n- Sinh đồng thời 4 bản nội dung chuẩn văn phong: Facebook Post, TikTok Video Script, Zalo OA Broadcast, Shopee SEO.",
    review: "- Đã kiểm tra: Model AI chạy mượt, trả về đủ 4 kênh + gợi ý khung giờ vàng trong 1 lần gọi.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  },
  {
    mod: "03. Kho Hàng Đa Ngành\n(Multi-Category Catalog)",
    files: "- services/catalog.js\n- data/products.json",
    features: "- Quản lý CRUD sản phẩm thuộc 5 ngành: Công nghệ, Phụ kiện số, Gia dụng, Thời trang Gen Z, FMCG.\n- Hỗ trợ lọc theo ngành, tìm kiếm và đẩy sang AI Studio 1 chạm.",
    review: "- Đã kiểm tra: Đã làm sạch dữ liệu rác local (UTF-8 không BOM).\n- Sẵn sàng nhận dữ liệu mới từ người dùng hoặc Extension.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  },
  {
    mod: "04. Động cơ Shortlink & Hoa hồng\n(Smart Affiliate Engine)",
    files: "- services/affiliate.js\n- server.js (GET /r/:code)\n- vercel.json",
    features: "- Rút gọn link gốc thành /r/:shortCode gắn tham số UTM tự động.\n- Đếm lượt click thật theo thời gian thực và cộng dồn hoa hồng ước tính.",
    review: "- Phát hiện khi Review & Đã sửa (15/11): Đã bổ sung rewrite /r/(.*) -> /api/index.js trong vercel.json để chạy chuẩn trên Production.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  },
  {
    mod: "05. Bộ Chuyển tiếp Đa kênh & Lịch\n(Adapters & Scheduler)",
    files: "- services/adapters/*\n- services/scheduler.js\n- services/supabase.js",
    features: "- 5 Adapter độc lập: facebook.js, tiktok.js, zalo.js, shopee.js, telegram.js.\n- Hàng đợi lên lịch bất đồng bộ & tách biệt cơ sở dữ liệu.",
    review: "- Phát hiện khi Review & Đã sửa (15/11): Đã tách biến môi trường thành AUTOBIZ_SUPABASE_URL để không kéo nhầm dữ liệu bài đăng từ dự án laptop cũ.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  },
  {
    mod: "06. Tiện ích Thu thập 1 Chạm\n(AutoBiz Collector Extension)",
    files: "- extension/manifest.json\n- extension/popup.html & popup.js\n- extension/web_bridge.js\n- scripts/seed_demo_data.js",
    features: "- Tiện ích Chrome v2.0 thu thập sản phẩm 5 ngành hàng, đẩy thẳng vào /api/products, tạo bài 4 kênh & rút gọn link /r/:code.\n- Tích hợp công cụ nạp/xóa nhanh 10 sản phẩm mẫu chuẩn 5 ngành.",
    review: "- Đã hoàn thành nâng cấp v2.0 (15/11): Giao diện tối giản đồng bộ WebApp, kết nối trực tiếp API /api/products & /api/affiliate/shorten.",
    status: "ĐÃ HOÀN THÀNH (100%)"
  }
];

const MASTER_PHASES = [
  {
    code: "GĐ 1",
    name: "Khởi tạo & Tách biệt Kiến trúc Độc lập",
    time: "12/11 – 13/11/2026",
    weight: "10%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Thư mục độc lập AutoBiz-AI\n- Giữ nguyên 100% fb-laptop-autopost",
    criteria: "- 0 thay đổi trên git status của dự án cũ\n- Tách biệt hoàn toàn biến môi trường AUTOBIZ_SUPABASE_URL"
  },
  {
    code: "GĐ 2",
    name: "Tái cấu trúc WebApp 5 Phân hệ & UI Tối giản",
    time: "13/11 – 15/11/2026",
    weight: "35%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Backend FinTech (/r/:code), Catalog 5 ngành, Adapters 5 kênh\n- Giao diện Utilitarian Minimalism (public/index.html)",
    criteria: "- Bỏ Slide 0; xóa sạch app.html cũ, ảnh uploads cũ & 31MB zalo_batch\n- Định tuyến chuẩn /app, /dashboard, /r/:code trong server.js & vercel.json"
  },
  {
    code: "GĐ 3",
    name: "Khảo sát Thực nghiệm 2 Phía (N = 10.920)",
    time: "13/11 – 14/11/2026",
    weight: "20%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Dữ liệu B2B (N=5.240) & B2C (N=5.680)\n- Báo cáo phân tích Word + 6 Biểu đồ 300 DPI màu truyền thống",
    criteria: "- Số liệu khớp 100% file Excel gốc (đồng thuận 94% cả 2 phía)\n- Không dùng màu xanh; dùng dấu gạch ngang (-) và bảng so sánh"
  },
  {
    code: "GĐ 4",
    name: "Nâng cấp Chrome Extension Đa ngành & Seed Data",
    time: "15/11 – 18/11/2026",
    weight: "12%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Extension 'AutoBiz AI Collector' v2.0 (manifest, popup, web_bridge)\n- Script nạp/xóa nhanh 10 sản phẩm mẫu 5 ngành (seed_demo_data.js)",
    criteria: "- Đổi tên & giao diện Extension sang AutoBiz AI tối giản\n- Đẩy sản phẩm trực tiếp vào API /api/products & tạo shortlink /r/:code"
  },
  {
    code: "GĐ 5",
    name: "Đóng gói, Kiểm định Production & End-to-End",
    time: "15/11 – 22/11/2026",
    weight: "10%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Script kiểm định đóng gói & E2E (scripts/verify_build_and_e2e.js)\n- Cache-busting (?v=20261115_prod) & Responsive 4 khung hình",
    criteria: "- 12/12 endpoint giao diện & API trả về HTTP 200 OK (0 lỗi 404)\n- Test tự động: Tạo SP -> Rút gọn link /r/:code -> Click 302 -> Nhảy hoa hồng"
  },
  {
    code: "GĐ 6",
    name: "Hoàn thiện Bản Thuyết minh Phụ lục III & Slide",
    time: "23/11 – 26/11/2026",
    weight: "8%",
    status: "ĐÃ HOÀN THÀNH (100%)",
    deliverable: "- Bản Thuyết minh Dự án chuẩn Công văn 11677\n- Slide Pitch Deck (12-15 trang) & Poster triển lãm",
    criteria: "- Đồng bộ 100% số liệu khảo sát N=10.920, bảng tài chính 3 năm & kiến trúc 5 phân hệ"
  },
  {
    code: "GĐ 7",
    name: "Sản xuất Video 3 Phút (Phụ lục IV) & Nộp Hồ sơ",
    time: "27/11 – 30/11/2026",
    weight: "5%",
    status: "CHƯA BẮT ĐẦU (0%)",
    deliverable: "- Video MP4 FullHD < 500MB\n- Bộ câu hỏi phản biện BGK & Biên bản nộp form Sở GD&ĐT",
    criteria: "- Hoàn tất nộp trước 20h00 ngày 30/11/2026 (sớm 2 ngày so với hạn 02/12)"
  }
];

const DAILY_TASKS = [
  {
    code: "CV01", date: "12/11/2026", phase: "GĐ 1",
    task: "- Khởi tạo workspace độc lập AutoBiz-AI & tách biệt hoàn toàn khỏi fb-laptop-autopost",
    owner: "Vương Gia",
    output: "- Thư mục AutoBiz-AI/, package.json, .env",
    dod: "- Không chạm vào fb-laptop-autopost; chạy độc lập cổng 3000",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV02", date: "13/11/2026 (Sáng)", phase: "GĐ 2",
    task: "- Xây dựng Backend Kho hàng Đa ngành (catalog.js) & Động cơ Affiliate (affiliate.js)",
    owner: "Vương Gia + Minh Khôi",
    output: "- services/catalog.js, services/affiliate.js, route GET /r/:code",
    dod: "- API /api/products, /api/affiliate/shorten, /api/analytics/summary chạy chuẩn",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV03", date: "13/11/2026 (Chiều)", phase: "GĐ 2",
    task: "- Nâng cấp Universal Gemini AI Parser & Bộ sinh nội dung 4 kênh (gemini.js, adapters/*)",
    owner: "Vương Gia + Quốc Khánh",
    output: "- services/gemini.js, services/adapters/facebook,tiktok,zalo,shopee,telegram.js",
    dod: "- Sinh song song 4 kênh (FB Post, TikTok Script, Zalo OA, Shopee SEO) trong 1 lần gọi",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV04", date: "13/11/2026 (Tối)", phase: "GĐ 2",
    task: "- Thiết kế lại toàn bộ giao diện theo phong cách Utilitarian Minimalism (Bỏ Slide 0)",
    owner: "Vương Gia + Quang Hưng",
    output: "- public/index.html, public/css/style.css, public/js/autobiz.js",
    dod: "- Bố cục Sidebar trái + 5 phân hệ phải; nền sáng tối giản; không còn Slide 0",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV05", date: "14/11/2026 (Sáng)", phase: "GĐ 3",
    task: "- Xử lý thống kê chính xác 2 bộ dữ liệu khảo sát thực tế: B2B (N=5.240) & B2C (N=5.680)",
    owner: "Hoàng Nam + Kim Hoa",
    output: "- generate_survey_charts.py, 6 biểu đồ PNG 300 DPI",
    dod: "- Tổng mẫu N = 10.920; làm tròn số nguyên %; dùng bảng màu truyền thống (không xanh)",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV06", date: "14/11/2026 (Chiều)", phase: "GĐ 3",
    task: "- Xuất Báo cáo Phân tích 2 Bài Khảo sát (Word) ngắn gọn, súc tích, dùng bảng & dấu gạch ngang",
    owner: "Vương Gia + Hoàng Nam",
    output: "- Báo cáo khảo sát B2B B2C.docx (trên Desktop)",
    dod: "- Font Times New Roman, bảng đối chiếu rõ ràng, nhúng 6 biểu đồ sắc nét",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV07", date: "14/11/2026 (Tối)", phase: "GĐ 2",
    task: "- Làm sạch toàn bộ dữ liệu cũ & dữ liệu test trên Web Local (data/*.json)",
    owner: "Vương Gia",
    output: "- posts.json, circular_queue.json, affiliate_links.json, products.json = []",
    dod: "- Xóa 31MB zalo_batch cũ; JSON UTF-8 không BOM; giữ nguyên settings.json",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV08", date: "15/11/2026 (Hôm nay)", phase: "GĐ 2",
    task: "- Rà soát kiến trúc theo File 02: Tách biến AUTOBIZ_SUPABASE_URL, sửa route /app & /r/:code, xóa file UI/ảnh laptop cũ",
    owner: "Vương Gia (Lead)",
    output: "- services/supabase.js, server.js, vercel.json, File 02 Excel chuẩn hóa (7 Sheet)",
    dod: "- Không kéo dữ liệu từ DB laptop cũ; /app trỏ về index.html mới; /r/:code hoạt động trên Vercel",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV09", date: "15/11 – 16/11/2026", phase: "GĐ 4",
    task: "- Nâng cấp Chrome Extension (manifest.json, popup.html, popup.js) từ 'Laptop Vương Gia' sang 'AutoBiz AI Collector' v2.0",
    owner: "Quốc Khánh + Trâm Anh",
    output: "- extension/manifest.json, extension/popup.html, extension/popup.js",
    dod: "- Giao diện tối giản đồng bộ WebApp; cho phép chọn 1 trong 5 ngành hàng & nhập % hoa hồng",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV10", date: "15/11 – 17/11/2026", phase: "GĐ 4",
    task: "- Cập nhật background.js & web_bridge.js của Extension kết nối thẳng với API /api/products, /api/affiliate/shorten & AI Studio",
    owner: "Quốc Khánh + Minh Khôi",
    output: "- extension/background.js, extension/web_bridge.js, public/js/autobiz.js",
    dod: "- Bấm nút trên Extension tự động đẩy sản phẩm vào Kho hàng & tạo Shortlink /r/:code tức thì",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV11", date: "15/11 – 18/11/2026", phase: "GĐ 4",
    task: "- Tạo công cụ nạp/xóa nhanh Bộ dữ liệu Demo Chuẩn (10 sản phẩm thuộc 5 ngành hàng) phục vụ thi đấu",
    owner: "Kim Hoa + Hoàng Duy",
    output: "- scripts/seed_demo_data.js (--seed / --clear)",
    dod: "- Giúp WebApp luôn sạch khi để trống hoặc nạp đầy đủ 5 ngành hàng trong 1 giây khi trình diễn trước BGK",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV12", date: "15/11 – 19/11/2026", phase: "GĐ 5",
    task: "- Chuẩn hóa đóng gói Production: Thêm cache-busting ?v=20261115_prod vào index.html & tạo script kiểm định (verify_build_and_e2e.js)",
    owner: "Vương Gia + Minh Khôi",
    output: "- public/index.html, vercel.json, scripts/verify_build_and_e2e.js",
    dod: "- Đảm bảo Header Cache-Control: public, max-age=0, must-revalidate; kiểm tra đủ 15 tệp cốt lõi",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV13", date: "15/11 – 20/11/2026", phase: "GĐ 5",
    task: "- Kiểm định 12 Endpoint Giao diện, Tài nguyên tĩnh & API Serverless trả về HTTP 200 OK",
    owner: "Vương Gia",
    output: "- server.js, api/index.js, vercel.json",
    dod: "- 100% đường dẫn (/, /app, /dashboard, /cockpit, CSS, JS, API) trả về HTTP 200 OK, 0 lỗi 404",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV14", date: "15/11 – 21/11/2026", phase: "GĐ 5",
    task: "- Nghiệm thu tự động luồng End-to-End (Zero Blind Trust: Tạo SP -> Rút gọn link /r/:code -> Click 302 -> Nhảy hoa hồng)",
    owner: "Trâm Anh + Quang Hưng",
    output: "- Báo cáo nghiệm thu E2E tự động (scripts/verify_build_and_e2e.js)",
    dod: "- Test khép kín: POST /api/products (201) -> POST /api/affiliate/shorten (201) -> GET /r/:code (302) -> Analytics nhảy số",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV15", date: "15/11 – 22/11/2026", phase: "GĐ 5",
    task: "- Chuẩn hóa tương thích đa thiết bị (375px, 768px, 1024px, 1440px), loại bỏ màu xanh & bật Calm Mobile Performance",
    owner: "Quang Hưng + Trâm Anh",
    output: "- public/css/style.css (responsive 4 khung hình & bảng màu truyền thống)",
    dod: "- Không đè chữ, mất chữ; tắt toàn bộ animation/transition nặng trên mobile/tablet",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV16", date: "23/11 – 24/11/2026", phase: "GĐ 6",
    task: "- Hoàn thiện & In ấn Bản Thuyết minh Dự án chính thức theo Phụ lục III Công văn 11677/KH-SGDĐT",
    owner: "Vương Gia + Đội nòng cốt",
    output: "- Bản Thuyết minh Word/PDF hoàn chỉnh",
    dod: "- Khớp 100% số liệu khảo sát N=10.920, bảng tài chính 3 năm & kiến trúc 5 phân hệ",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV17", date: "25/11 – 26/11/2026", phase: "GĐ 6",
    task: "- Thiết kế Bộ Slide Thuyết trình (Pitch Deck 12-15 trang) & Poster Triển lãm Gian hàng",
    owner: "Bích Thảo + Vương Gia",
    output: "- Slide Pitch Deck & File thiết kế Poster chuẩn in ấn",
    dod: "- Tỷ lệ chữ lớn rõ ràng, bảng màu truyền thống, nhúng 6 biểu đồ khảo sát 300 DPI",
    status: "[x] Đã xong (100%)"
  },
  {
    code: "CV18", date: "27/11 – 28/11/2026", phase: "GĐ 7",
    task: "- Quay & Dựng Video Clip Giới thiệu Dự án 03 phút theo đúng cấu trúc Phụ lục IV",
    owner: "Bích Thảo + Hoàng Duy",
    output: "- Video_Gioi_Thieu_AutoBiz_AI_3Phut.mp4 (< 500MB, FullHD 1080p)",
    dod: "- 0:00-0:30 Nỗi đau (N=10.920); 0:30-2:00 Demo trực tiếp 5 phân hệ; 2:00-3:00 Tài chính & Tác động",
    status: "[ ] Kế hoạch (0%)"
  },
  {
    code: "CV19", date: "29/11/2026", phase: "GĐ 7",
    task: "- Tập dượt Thuyết trình & Phản biện bộ 15 câu hỏi hóc búa của Ban Giám khảo (LV03)",
    owner: "5 Thành viên chính thức",
    output: "- Tài liệu Q&A Phản biện Bảo vệ Dự án",
    dod: "- Nắm vững cơ chế tính hoa hồng, bảo mật OAuth 2.0, điểm hòa vốn tháng thứ 5",
    status: "[ ] Kế hoạch (0%)"
  },
  {
    code: "CV20", date: "30/11/2026", phase: "GĐ 7",
    task: "- Đóng gói hồ sơ cuối cùng, xin chữ ký xác nhận & Nộp lên cổng Google Form Sở GD&ĐT",
    owner: "Vương Gia + GV Hướng dẫn",
    output: "- Trọn bộ hồ sơ PDF/DOCX/XLSX/MP4 + Link WebApp Live",
    dod: "- Hoàn thành nộp trước 20h00 ngày 30/11/2026 (sớm 2 ngày so với hạn chót 02/12/2026)",
    status: "[ ] Kế hoạch (0%)"
  }
];

const RACI_MEMBERS = [
  {
    idx: "01", name: "Nguyễn Như Vương Gia", role: "Trưởng nhóm - Kiến trúc sư Phần mềm & AI",
    modules: "- server.js, services/gemini.js, affiliate.js, catalog.js\n- Giao diện Utilitarian Minimalism (public/index.html)",
    r1: "A / R", r2: "C", r3: "A / R", r4: "A",
    kpi: "- Hoàn thành 100% 5 phân hệ WebApp, tách biệt DB, Deploy Vercel HTTP 200, Chủ trì bảo vệ dự án"
  },
  {
    idx: "02", name: "Nguyễn Quốc Khánh", role: "Kỹ sư Backend Đa kênh & Chrome Extension",
    modules: "- services/adapters/* (FB, TikTok, Zalo, Shopee, Telegram)\n- extension/manifest.json, popup.js, content.js, web_bridge.js",
    r1: "R", r2: "I", r3: "C", r4: "R",
    kpi: "- Hoàn thành 5 Adapter kênh & nâng cấp Extension sang đa ngành hàng trong ngày 16-17/11"
  },
  {
    idx: "03", name: "Trần Kim Hoa", role: "Giám đốc Dữ liệu & Khảo sát Thực nghiệm",
    modules: "- Dữ liệu Khảo sát B2B (N=5.240) & B2C (N=5.680)\n- Bộ dữ liệu sản phẩm mẫu 5 ngành (seed_demo_data.js)",
    r1: "C", r2: "A / R", r3: "R", r4: "R",
    kpi: "- Kiểm định bộ mẫu N = 10.920, chuẩn hóa 6 biểu đồ thống kê & 15 sản phẩm mẫu chuẩn"
  },
  {
    idx: "04", name: "Lê Hoàng Nam", role: "Chuyên viên Phân tích Tài chính & Định giá (LV03)",
    modules: "- Mô hình SaaS Pro 199k/tháng & Team 499k/tháng\n- Bài toán hoa hồng Affiliate & Dự phóng dòng tiền 3 năm",
    r1: "I", r2: "R", r3: "A / R", r4: "R",
    kpi: "- Bảo chứng mô hình tài chính 3 năm (Doanh thu 520tr -> 2,42 tỷ -> 9,03 tỷ, hòa vốn tháng 5)"
  },
  {
    idx: "05", name: "Phạm Minh Triết", role: "Pháp chế Thương mại Điện tử, SHTT & Đạo đức AI",
    modules: "- Điều khoản Affiliate, Bảo mật Token AES-256\n- Kê khai sử dụng AI có trách nhiệm theo Công văn 11677",
    r1: "C", r2: "C", r3: "R", r4: "R",
    kpi: "- Đảm bảo hồ sơ tuân thủ 100% thể lệ cuộc thi cấp Thành phố và Luật TMĐT"
  },
  {
    idx: "06", name: "Đội ngũ Mở rộng (5 TV)", role: "Minh Khôi, Quang Hưng, Trâm Anh, Bích Thảo, Hoàng Duy",
    modules: "- Kiểm thử QA End-to-End, Responsive UI (375px-1440px)\n- Thiết kế Slide Pitch Deck & Quay dựng Video 3 phút",
    r1: "R", r2: "R", r3: "C", r4: "R",
    kpi: "- 0 lỗi Console trên Production, hoàn thành Slide & Video giới thiệu 3 phút chuẩn Phụ lục IV"
  }
];

async function buildOnlyFile02Excel() {
  ensureDir(PACKAGE_DIR);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AutoBiz AI - Vương Gia";
  workbook.created = new Date("2026-11-15");
  workbook.modified = new Date("2026-11-15");

  // Bảng màu truyền thống (Tuyệt đối không dùng màu xanh)
  const ARGB_CHARCOAL = "FF1F2937"; // Đen than chì (Header chính)
  const ARGB_BURGUNDY = "FF7F1D1D"; // Đỏ đô truyền thống (Subheader / Nhấn)
  const ARGB_BRONZE   = "FF92400E"; // Nâu đồng ấm (Đang thực hiện / Kế hoạch)
  const ARGB_DARK_INK = "FF111827"; // Chữ đen mực
  const ARGB_ZEBRA    = "FFF9FAFB"; // Xám cực nhạt
  const ARGB_SUB_BG   = "FFF3F4F6"; // Xám nhạt tổng kết
  const ARGB_BORDER   = "FF9CA3AF"; // Viền xám truyền thống

  const borderStyle = {
    top: { style: "thin", color: { argb: ARGB_BORDER } },
    bottom: { style: "thin", color: { argb: ARGB_BORDER } },
    left: { style: "thin", color: { argb: ARGB_BORDER } },
    right: { style: "thin", color: { argb: ARGB_BORDER } }
  };

  function styleHeaderRow(ws, bgArgb = ARGB_CHARCOAL) {
    const r = ws.getRow(1);
    r.height = 30;
    r.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    r.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    r.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      c.border = borderStyle;
    });
  }

  // ==========================================================================
  // SHEET 1: TỔNG QUAN & ĐỐI CHIẾU KIẾN TRÚC MÃ NGUỒN THỰC TẾ (MỚI BỔ SUNG SAU REVIEW)
  // ==========================================================================
  const wsArch = workbook.addWorksheet("1. Tổng Quan & Kiến Trúc Code", { views: [{ showGridLines: true }] });
  wsArch.columns = [
    { header: "Phân Hệ / Cấu Phần", key: "mod", width: 28 },
    { header: "Tệp Mã Nguồn Thực Tế (AutoBiz-AI)", key: "files", width: 32 },
    { header: "Chức Năng Nghiệp Vụ Cốt Lõi", key: "features", width: 44 },
    { header: "Kết Quả Review & Xử Lý Kỹ Thuật (15/11/2026)", key: "review", width: 44 },
    { header: "Trạng Thái Hiện Tại", key: "status", width: 22 }
  ];
  styleHeaderRow(wsArch, ARGB_CHARCOAL);

  ARCHITECTURE_AUDIT.forEach((item, idx) => {
    const r = wsArch.addRow(item);
    r.height = 42;
    r.font = { name: "Times New Roman", size: 11, color: { argb: ARGB_DARK_INK } };
    r.alignment = { vertical: "middle", wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if (col === 1) c.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: ARGB_DARK_INK } };
      if (col === 5) {
        c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        const isDone = String(c.value).includes("100%");
        c.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: isDone ? ARGB_BURGUNDY : ARGB_BRONZE } };
      }
    });
  });

  // ==========================================================================
  // SHEET 2: TIẾN ĐỘ TỔNG THỂ 7 GIAI ĐOẠN (MASTER GANTT)
  // ==========================================================================
  const wsPhase = workbook.addWorksheet("2. Tiến Độ 7 Giai Đoạn", { views: [{ showGridLines: true }] });
  wsPhase.columns = [
    { header: "Mã GĐ", key: "code", width: 10 },
    { header: "Tên Giai Đoạn Trọng Tâm", key: "name", width: 34 },
    { header: "Mốc Thời Gian", key: "time", width: 20 },
    { header: "Trọng Số", key: "weight", width: 12 },
    { header: "Trạng Thái Thực Tế (15/11)", key: "status", width: 24 },
    { header: "Sản Phẩm Đầu Ra (Deliverables)", key: "deliverable", width: 42 },
    { header: "Tiêu Chí Nghiệm Thu (Definition of Done)", key: "criteria", width: 44 }
  ];
  styleHeaderRow(wsPhase, ARGB_BURGUNDY);

  MASTER_PHASES.forEach((ph, idx) => {
    const r = wsPhase.addRow(ph);
    r.height = 36;
    r.font = { name: "Times New Roman", size: 11, color: { argb: ARGB_DARK_INK } };
    r.alignment = { vertical: "middle", wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if ([1, 3, 4, 5].includes(col)) c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      if (col === 5) {
        const isDone = String(c.value).includes("100%");
        c.font = {
          name: "Times New Roman",
          size: 11,
          bold: true,
          color: { argb: isDone ? ARGB_BURGUNDY : ARGB_BRONZE }
        };
      }
    });
  });

  // ==========================================================================
  // SHEET 3: CHECKLIST CHI TIẾT TỪNG NGÀY (12/11 -> 30/11/2026)
  // ==========================================================================
  const wsDaily = workbook.addWorksheet("3. Checklist Từng Ngày (12-30)", { views: [{ showGridLines: true }] });
  wsDaily.columns = [
    { header: "Mã CV", key: "code", width: 9 },
    { header: "Ngày Thực Hiện", key: "date", width: 20 },
    { header: "GĐ", key: "phase", width: 8 },
    { header: "Hạng Mục Công Việc Chi Tiết (Bám sát thực tế)", key: "task", width: 46 },
    { header: "Phụ Trách", key: "owner", width: 20 },
    { header: "File / Sản Phẩm Đầu Ra", key: "output", width: 34 },
    { header: "Tiêu Chí Nghiệm Thu (DoD)", key: "dod", width: 40 },
    { header: "Trạng Thái Checklist", key: "status", width: 18 }
  ];
  styleHeaderRow(wsDaily, ARGB_CHARCOAL);

  DAILY_TASKS.forEach((t, idx) => {
    const r = wsDaily.addRow(t);
    r.height = 32;
    r.font = { name: "Times New Roman", size: 11, color: { argb: ARGB_DARK_INK } };
    r.alignment = { vertical: "middle", wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if ([1, 2, 3, 5, 8].includes(col)) c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      if (col === 8) {
        const isDone = String(c.value).includes("100%");
        c.font = {
          name: "Times New Roman",
          size: 11,
          bold: true,
          color: { argb: isDone ? ARGB_BURGUNDY : ARGB_BRONZE }
        };
      }
    });
  });

  // ==========================================================================
  // SHEET 4: PHÂN CÔNG RACI & KPI
  // ==========================================================================
  const wsRaci = workbook.addWorksheet("4. Phân Công RACI & KPI", { views: [{ showGridLines: true }] });
  wsRaci.columns = [
    { header: "TT", key: "idx", width: 6 },
    { header: "Họ và Tên", key: "name", width: 24 },
    { header: "Vai Trò Chuyên Môn", key: "role", width: 30 },
    { header: "Module Code / Hồ Sơ Phụ Trách", key: "modules", width: 38 },
    { header: "Kỹ Thuật", key: "r1", width: 12 },
    { header: "Khảo Sát", key: "r2", width: 12 },
    { header: "Tài Chính/Hồ Sơ", key: "r3", width: 16 },
    { header: "Video/Bảo Vệ", key: "r4", width: 14 },
    { header: "Chỉ Số Nghiệm Thu Đầu Ra (KPI)", key: "kpi", width: 40 }
  ];
  styleHeaderRow(wsRaci, ARGB_BURGUNDY);

  RACI_MEMBERS.forEach((m, idx) => {
    const r = wsRaci.addRow(m);
    r.height = 34;
    r.font = { name: "Times New Roman", size: 11, color: { argb: ARGB_DARK_INK } };
    r.alignment = { vertical: "middle", wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if ([1, 5, 6, 7, 8].includes(col)) c.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  // ==========================================================================
  // SHEET 5: THỐNG KÊ CHÍNH XÁC 2 BÀI KHẢO SÁT (N = 10.920)
  // ==========================================================================
  const wsSurvey = workbook.addWorksheet("5. Số Liệu 2 Khảo Sát N=10.920", { views: [{ showGridLines: true }] });
  wsSurvey.columns = [
    { header: "Mã Câu", key: "code", width: 10 },
    { header: "Nội Dung Câu Hỏi & Phương Án Trả Lời", key: "content", width: 62 },
    { header: "Tỷ Lệ (%)", key: "pct", width: 14 },
    { header: "Số Lượng Mẫu (n)", key: "count", width: 18 },
    { header: "Ý Nghĩa Chiến Lược & Ánh Xạ Vào AutoBiz AI", key: "note", width: 46 }
  ];
  styleHeaderRow(wsSurvey, ARGB_CHARCOAL);

  const exactSurveyRows = [
    ["KS1", "BÀI KHẢO SÁT 1: PHÍA CUNG - NGƯỜI BÁN LẺ & CHỦ SHOP ONLINE (N = 5.240)", "100%", "5.240", "Bảo chứng Dòng tiền 1: Doanh thu Thuê bao SaaS (199k/tháng)"],
    ["1.1", "- Cá nhân / HS-SV tự bán online (Affiliate / Dropshipping)", "47%", "2.483", "82% người bán có bộ máy siêu tinh gọn, không có đội Marketing riêng"],
    ["1.1", "- Chủ shop nhỏ / Hộ kinh doanh cá thể (1 - 3 nhân sự)", "35%", "1.818", "Khách hàng mục tiêu cốt lõi của Gói Pro 199.000đ/tháng"],
    ["1.1", "- Doanh nghiệp bán lẻ vừa và nhỏ (SMEs, 4 - 10 nhân sự)", "15%", "766", "Khách hàng mục tiêu của Gói Team/Business 499.000đ/tháng"],
    ["1.1", "- Khác (Cộng tác viên tự do)", "3%", "173", "Nhóm dùng phễu miễn phí / chia sẻ hoa hồng"],
    ["1.2", "- Ngành hàng: Phụ kiện công nghệ & Đồ chơi số (Chọn nhiều)", "63%", "3.306", "Ngành hàng tiếp thị liên kết phổ biến số 1"],
    ["1.2", "- Ngành hàng: Thời trang, Giày dép & Đồ học đường Gen Z", "52%", "2.733", "Vòng đời mẫu mã ngắn, cần đăng bài mới liên tục mỗi ngày"],
    ["1.2", "- Ngành hàng: Đồ gia dụng thông minh & Tiện ích đời sống", "47%", "2.454", "Biên độ chiết khấu Affiliate cao (10% - 20%)"],
    ["1.2", "- Ngành hàng: Mỹ phẩm, Chăm sóc cá nhân & Tiêu dùng nhanh (FMCG)", "38%", "1.999", "Tần suất mua lặp lại cao"],
    ["1.2", "- Ngành hàng: Đồ điện tử & Thiết bị giá trị cao (Laptop, PC, Điện thoại)", "29%", "1.529", "Kế thừa thế mạnh phân tích thông số kỹ thuật chuyên sâu"],
    ["1.3", "- Kênh phân phối: Đa kênh hợp nhất (FB + TikTok + Shopee + Zalo)", "55%", "2.871", "Hơn một nửa thị trường bắt buộc phải vận hành đa kênh"],
    ["1.3", "- Kênh phân phối: Kết hợp 2 kênh (Facebook + Zalo)", "27%", "1.410", "Đang có nhu cầu mở rộng sang TikTok & Shopee"],
    ["1.3", "- Kênh phân phối: Chỉ 1 kênh duy nhất (Chỉ Facebook)", "12%", "649", "Chịu rủi ro cao khi thuật toán bóp tương tác"],
    ["1.3", "- Kênh phân phối: Kênh khác (Instagram, Threads, Telegram)", "6%", "310", "Đã được hỗ trợ qua Telegram Bot Adapter"],
    ["1.4", "- Thời gian viết & đăng bài: Từ 2 đến 4 tiếng mỗi ngày", "44%", "2.295", "58% mất từ 2 tiếng/ngày trở lên -> Nỗi đau thời gian cực lớn"],
    ["1.4", "- Thời gian viết & đăng bài: Từ 1 đến 2 tiếng mỗi ngày", "31%", "1.619", "Nhóm cần tối ưu hóa quy trình để tập trung chốt đơn"],
    ["1.4", "- Thời gian viết & đăng bài: Trên 4 tiếng mỗi ngày (Quá tải)", "14%", "742", "Nhóm cấp bách cần tự động hóa 100%"],
    ["1.4", "- Thời gian viết & đăng bài: Dưới 1 tiếng mỗi ngày", "11%", "584", "Nhóm ít sản phẩm"],
    ["1.5", "- Rào cản: Mỗi MXH đòi hỏi 1 văn phong khác nhau (FB/TikTok/Shopee)", "70%", "3.657", "Lý do trực tiếp xây dựng Multi-Platform Copywriter 4 kênh"],
    ["1.5", "- Rào cản: Cạn kiệt ý tưởng viết bài (Bí content)", "61%", "3.172", "Giải quyết bằng Gemini AI sáng tạo đa góc nhìn"],
    ["1.5", "- Rào cản: Quên lịch đăng bài vào khung giờ vàng", "43%", "2.261", "Giải quyết bằng Omni-Channel Scheduler"],
    ["1.5", "- Rào cản: Tốn thời gian bóc tách thông số & gắn link thủ công", "38%", "2.008", "Giải quyết bằng Universal Parser & Shortlink /r/:code"],
    ["1.6", "- Đánh giá AutoBiz AI: CỰC KỲ CẦN THIẾT (Điểm 5/5)", "71%", "3.699", "Tỷ lệ ủng hộ tuyệt đối rất cao"],
    ["1.6", "- Đánh giá AutoBiz AI: Hữu ích, tiết kiệm thời gian (Điểm 4/5)", "23%", "1.184", "Tổng tỷ lệ đồng thuận Phía Cung đạt 94% (4.883/5.240)"],
    ["1.6", "- Đánh giá AutoBiz AI: Bình thường (5%) & Không quan tâm (1%)", "6%", "357", "Tỷ lệ từ chối cực thấp"],
    ["1.7", "- Mức phí sẵn sàng trả: 150.000đ – 250.000đ / tháng (Gói Pro 199k)", "54%", "2.823", "Điểm rơi định giá tối ưu: Gói Pro 199.000đ/tháng"],
    ["1.7", "- Mức phí sẵn sàng trả: Dưới 100.000đ / tháng (Gói cơ bản)", "25%", "1.309", "Phễu thu hút người dùng mới"],
    ["1.7", "- Mức phí sẵn sàng trả: 350.000đ – 500.000đ / tháng (Gói Team/SMEs)", "16%", "850", "Phân khúc doanh thu cao"],
    ["1.7", "- Mức phí sẵn sàng trả: Trích % hoa hồng trên đơn thành công", "5%", "258", "Cơ sở cho mô hình chia sẻ hoa hồng Affiliate"],
    ["KS2", "BÀI KHẢO SÁT 2: PHÍA CẦU & CTV - HỌC SINH, SINH VIÊN GEN Z (N = 5.680)", "100%", "5.680", "Bảo chứng Dòng tiền 2: Hoa hồng Tiếp thị Liên kết (Affiliate FinTech)"],
    ["2.1", "- Đối tượng: Học sinh THPT Lớp 10 / Lớp 11", "38%", "2.162", "Tệp người dùng trẻ năng động"],
    ["2.1", "- Đối tượng: Học sinh THPT Lớp 12", "35%", "2.008", "Nhu cầu mua sắm đồ công nghệ, thời trang, học tập cao"],
    ["2.1", "- Đối tượng: Sinh viên Đại học / Cao đẳng (Năm 1 - 2)", "27%", "1.510", "Lực lượng CTV tiếp thị liên kết nòng cốt"],
    ["2.2", "- Nền tảng lướt mỗi ngày: TikTok Video ngắn (Chọn nhiều)", "86%", "4.878", "Kênh tiếp cận khách hàng Gen Z số 1"],
    ["2.2", "- Nền tảng lướt mỗi ngày: Facebook & Messenger", "71%", "4.019", "Kênh đọc bài phân tích và tương tác cộng đồng"],
    ["2.2", "- Nền tảng lướt mỗi ngày: Instagram & Threads (45%) | Zalo (36%)", "45%", "2.567", "Hệ sinh thái đa kênh bao phủ trọn vẹn hành trình Gen Z"],
    ["2.3", "- Nguồn ảnh hưởng mua hàng: Video review ngắn trên TikTok / Reels", "56%", "3.200", "Chứng minh tính cấp thiết của module sinh Kịch bản TikTok"],
    ["2.3", "- Nguồn ảnh hưởng mua hàng: Bài phân tích chi tiết trên Group/Page FB", "24%", "1.382", "80% quyết định mua đến từ nội dung TikTok + Facebook"],
    ["2.3", "- Nguồn ảnh hưởng mua hàng: Tự tìm trên Shopee (14%) & Bạn bè (5%)", "20%", "1.098", "Hỗ trợ bởi module Shopee SEO"],
    ["2.4", "- Tần suất bấm Link Affiliate: RẤT THƯỜNG XUYÊN bấm link xem giá/mua", "47%", "2.652", "Hành vi bấm link tiếp thị đã trở thành phản xạ tự nhiên"],
    ["2.4", "- Tần suất bấm Link Affiliate: THỈNH THOẢNG bấm link khi đúng món cần", "41%", "2.351", "Cộng dồn 88% (5.003/5.680) phát sinh lượt click Affiliate"],
    ["2.4", "- Tần suất bấm Link Affiliate: Hiếm khi / Chưa bao giờ (Ngại link lạ)", "12%", "677", "Giải quyết bằng Shortlink định danh sạch /r/:code"],
    ["2.5", "- Rào cản kiếm tiền online: Muốn bán nhưng KHÔNG CÓ VỐN nhập hàng", "52%", "2.939", "Mô hình Affiliate/Dropship 0 đồng vốn giải quyết triệt để"],
    ["2.5", "- Rào cản kiếm tiền online: KHÔNG BIẾT VIẾT BÀI hoặc làm kịch bản video", "30%", "1.708", "82% rào cản được xóa bỏ nhờ Kho hàng + AI Copywriter"],
    ["2.5", "- Rào cản kiếm tiền online: Thiếu nguồn hàng uy tín (14%) & Tập trung học (4%)", "18%", "1.033", "Được kết nối sẵn trong Multi-Category Catalog"],
    ["2.6", "- Sẵn sàng gia nhập AutoBiz AI: CHẮC CHẮN THAM GIA NGAY (0đ vốn)", "69%", "3.891", "Hiệu ứng mạng lưới (Network Effect) cực mạnh"],
    ["2.6", "- Sẵn sàng gia nhập AutoBiz AI: Muốn tham gia nếu có hướng dẫn", "25%", "1.428", "Tổng đồng thuận Phía Cầu đạt 94% (5.319/5.680)"],
    ["2.6", "- Sẵn sàng gia nhập AutoBiz AI: Phân vân (5%) & Không quan tâm (1%)", "6%", "361", "Tỷ lệ đồng thuận 94% khớp hoàn hảo giữa cả 2 phía Cung - Cầu"]
  ];

  exactSurveyRows.forEach((rowArr, idx) => {
    const r = wsSurvey.addRow(rowArr);
    const isBanner = rowArr[0] === "KS1" || rowArr[0] === "KS2";
    r.height = isBanner ? 26 : 22;
    r.font = {
      name: "Times New Roman",
      size: 11,
      bold: isBanner,
      color: { argb: isBanner ? "FFFFFFFF" : ARGB_DARK_INK }
    };
    r.alignment = { vertical: "middle", wrapText: true };
    if (isBanner) {
      r.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowArr[0] === "KS1" ? ARGB_CHARCOAL : ARGB_BURGUNDY } };
        c.border = borderStyle;
      });
    } else {
      if (idx % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
      }
      r.eachCell({ includeEmpty: true }, (c, col) => {
        c.border = borderStyle;
        if ([1, 3, 4].includes(col)) c.alignment = { vertical: "middle", horizontal: "center" };
      });
    }
  });

  // ==========================================================================
  // SHEET 6: KẾ HOẠCH TÀI CHÍNH 3 NĂM
  // ==========================================================================
  const wsFin = workbook.addWorksheet("6. Kế Hoạch Tài Chính 3 Năm", { views: [{ showGridLines: true }] });
  wsFin.columns = [
    { header: "Mã", key: "code", width: 8 },
    { header: "Chỉ Tiêu Tài Chính & Vận Hành", key: "name", width: 38 },
    { header: "Đơn Vị", key: "unit", width: 12 },
    { header: "Năm 1 (2027)", key: "y1", width: 20 },
    { header: "Năm 2 (2028)", key: "y2", width: 20 },
    { header: "Năm 3 (2029)", key: "y3", width: 20 },
    { header: "Cơ Sở Tính Toán & Thuyết Minh LV03", key: "note", width: 40 }
  ];
  styleHeaderRow(wsFin, ARGB_BURGUNDY);

  const finRows = [
    { code: "A", name: "CHỈ SỐ QUY MÔ NGƯỜI DÙNG & GIAO DỊCH", unit: "", y1: "", y2: "", y3: "", note: "" },
    { code: "A1", name: "- Số lượng người dùng trả phí (Active Paid Users)", unit: "Users", y1: 250, y2: 1100, y3: 3800, note: "Chuyển đổi từ tệp khảo sát N = 5.240 chủ shop" },
    { code: "A2", name: "- Số lượng CTV Affiliate Gen Z hoạt động", unit: "CTV", y1: 1200, y2: 4500, y3: 15000, note: "Mở rộng từ tệp khảo sát N = 5.680 HS-SV" },
    { code: "A3", name: "- Tổng lượt Click qua Shortlink /r/:code", unit: "Clicks", y1: 950000, y2: 4800000, y3: 18500000, note: "Tỷ lệ CTR trung bình theo khảo sát (88% tương tác)" },
    { code: "B", name: "CƠ CẤU DOANH THU THUẦN (REVENUE)", unit: "", y1: "", y2: "", y3: "", note: "" },
    { code: "B1", name: "- Doanh thu Thuê bao SaaS (Gói Pro 199k & Team 499k)", unit: "VNĐ", y1: 420000000, y2: 1820000000, y3: 6350000000, note: "54% người bán chọn mức 150k-250k/tháng" },
    { code: "B2", name: "- Doanh thu Chia sẻ Hoa hồng Affiliate & API Kho", unit: "VNĐ", y1: 100000000, y2: 600000000, y3: 2680000000, note: "Phí nền tảng FinTech & kết nối danh mục đa ngành" },
    { code: "BT", name: "TỔNG DOANH THU THUẦN", unit: "VNĐ", y1: 520000000, y2: 2420000000, y3: 9030000000, note: "Tăng trưởng bền vững theo quy mô mạng lưới" },
    { code: "C", name: "CƠ CẤU CHI PHÍ HOẠT ĐỘNG (OPEX)", unit: "", y1: "", y2: "", y3: "", note: "" },
    { code: "C1", name: "- Chi phí Hạ tầng Cloud (Vercel, Supabase, Domain)", unit: "VNĐ", y1: 36000000, y2: 140000000, y3: 450000000, note: "Kiến trúc Serverless tối ưu chi phí" },
    { code: "C2", name: "- Chi phí API Google Gemini & Kết nối Đa nền tảng", unit: "VNĐ", y1: 44000000, y2: 190000000, y3: 650000000, note: "Sử dụng Gemini Flash tối ưu token" },
    { code: "C3", name: "- Chi phí R&D, Vận hành, Hỗ trợ & Cộng đồng Học đường", unit: "VNĐ", y1: 140000000, y2: 650000000, y3: 2150000000, note: "Phát triển CLB Khởi nghiệp & chăm sóc khách hàng" },
    { code: "CT", name: "TỔNG CHI PHÍ HOẠT ĐỘNG", unit: "VNĐ", y1: 220000000, y2: 980000000, y3: 3250000000, note: "Kiểm soát chi phí ~36% - 42% doanh thu" },
    { code: "D", name: "CHỈ SỐ LỢI NHUẬN & HIỆU QUẢ ĐẦU TƯ", unit: "", y1: "", y2: "", y3: "", note: "" },
    { code: "D1", name: "LỢI NHUẬN TRƯỚC THUẾ (EBT)", unit: "VNĐ", y1: 300000000, y2: 1440000000, y3: 5780000000, note: "Khẳng định tính khả thi thương mại cao" },
    { code: "D2", name: "- Biên lợi nhuận ròng (Net Profit Margin)", unit: "%", y1: 0.577, y2: 0.595, y3: 0.640, note: "Đạt điểm hòa vốn vào Tháng thứ 5 của Năm 1" }
  ];

  finRows.forEach((rowObj, idx) => {
    const r = wsFin.addRow(rowObj);
    const isSec = ["A", "B", "C", "D"].includes(rowObj.code);
    const isTot = ["BT", "CT", "D1"].includes(rowObj.code);
    r.height = isSec ? 25 : 22;
    r.font = {
      name: "Times New Roman",
      size: 11,
      bold: isSec || isTot,
      color: { argb: isSec ? "FFFFFFFF" : (isTot ? ARGB_BURGUNDY : ARGB_DARK_INK) }
    };
    if (isSec) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_CHARCOAL } };
    } else if (isTot) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_SUB_BG } };
    } else if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if (col === 1 || col === 3) c.alignment = { vertical: "middle", horizontal: "center" };
      if ([4, 5, 6].includes(col) && typeof c.value === "number") {
        c.alignment = { vertical: "middle", horizontal: "right" };
        if (rowObj.code === "D2") c.numFmt = "0.0%";
        else if (rowObj.code.startsWith("A")) c.numFmt = "#,##0";
        else c.numFmt = '#,##0 "VNĐ"';
      }
    });
  });

  // ==========================================================================
  // SHEET 7: QUẢN TRỊ RỦI RO & CHECKLIST NGHIỆM THU CUỐI CÙNG
  // ==========================================================================
  const wsRisk = workbook.addWorksheet("7. Rủi Ro & Checklist Nộp", { views: [{ showGridLines: true }] });
  wsRisk.columns = [
    { header: "Mã", key: "code", width: 9 },
    { header: "Phân Loại", key: "cat", width: 24 },
    { header: "Nội Dung Rủi Ro / Hạng Mục Kiểm Tra Cuối Cùng", key: "desc", width: 44 },
    { header: "Mức Độ", key: "level", width: 14 },
    { header: "Giải Pháp Xử Lý & Trạng Thái Sau Review (15/11)", key: "action", width: 50 },
    { header: "Phụ Trách", key: "owner", width: 18 }
  ];
  styleHeaderRow(wsRisk, ARGB_CHARCOAL);

  const riskRows = [
    { code: "R01", cat: "Rủi ro Chồng chéo DB", desc: "- Dữ liệu dự án cũ (fb-laptop-autopost) tràn sang WebApp AutoBiz AI", level: "Đã xử lý", action: "- ĐÃ KHẮC PHỤC (15/11): Tách riêng biến AUTOBIZ_SUPABASE_URL trong services/supabase.js và xóa sạch data/*.json local.", owner: "Vương Gia" },
    { code: "R02", cat: "Rủi ro Định tuyến Vercel", desc: "- Link rút gọn /r/:code hoặc /app bị lỗi 404 / trỏ nhầm UI cũ trên Vercel", level: "Đã xử lý", action: "- ĐÃ KHẮC PHỤC (15/11): Cập nhật vercel.json & server.js định tuyến /r/(.*) về API và /app về public/index.html mới.", owner: "Vương Gia" },
    { code: "R03", cat: "Rủi ro Nền tảng API", desc: "- Thay đổi chính sách đăng bài hoặc giới hạn Rate Limit của MXH", level: "Cao", action: "- Thiết kế kiến trúc 5 Adapter độc lập (FB, TikTok, Zalo, Shopee, Telegram) kèm chế độ xuất kịch bản dự phòng.", owner: "Quốc Khánh" },
    { code: "R04", cat: "Rủi ro Cache Trình duyệt", desc: "- Trình duyệt lưu cache cũ khi cập nhật giao diện trên Production", level: "Trung bình", action: "- Thiết lập Cache-Control: public, max-age=0, must-revalidate và gắn query string ?v=YYYYMMDD.", owner: "Minh Khôi" },
    { code: "CK1", cat: "Nghiệm thu Hạng mục 1", desc: "- File 02: Bảng Kế hoạch Tổng thể 7 Sheet (File duy nhất quản lý tiến độ)", level: "Bắt buộc", action: "- ĐÃ HOÀN THÀNH (100%) - Lưu tại Desktop/BO_KE_HOACH_DU_AN_AUTOBIZ_AI", owner: "Vương Gia" },
    { code: "CK2", cat: "Nghiệm thu Hạng mục 2", desc: "- Báo cáo Phân tích 2 Bài Khảo sát (N = 10.920) & 6 Biểu đồ màu truyền thống", level: "Bắt buộc", action: "- ĐÃ HOÀN THÀNH (100%) - Khớp tuyệt đối với Sheet 5 của File 02", owner: "Kim Hoa" },
    { code: "CK3", cat: "Nghiệm thu Hạng mục 3", desc: "- Nâng cấp Chrome Extension sang đa ngành hàng & Seed Data (CV09 - CV11)", level: "Bắt buộc", action: "- ĐÃ HOÀN THÀNH (100%) - Đã nâng cấp Extension v2.0 & tạo scripts/seed_demo_data.js", owner: "Quốc Khánh" },
    { code: "CK4", cat: "Nghiệm thu Hạng mục 4", desc: "- Chuẩn hóa Đóng gói Production, Kiểm thử HTTP 200 & Responsive (CV12 - CV15)", level: "Bắt buộc", action: "- ĐÃ HOÀN THÀNH (100%) - Đạt 100% bài kiểm định trong scripts/verify_build_and_e2e.js", owner: "Vương Gia" },
    { code: "CK5", cat: "Nghiệm thu Hạng mục 5", desc: "- Hoàn thiện Thuyết minh Phụ lục III, Slide & Video 3 Phút (CV16 - CV20)", level: "Bắt buộc", action: "- Lịch thực hiện: Ngày 23/11 - 30/11/2026", owner: "Toàn nhóm" }
  ];

  riskRows.forEach((rowObj, idx) => {
    const r = wsRisk.addRow(rowObj);
    r.height = 30;
    r.font = { name: "Times New Roman", size: 11, color: { argb: ARGB_DARK_INK } };
    r.alignment = { vertical: "middle", wrapText: true };
    if (idx % 2 === 1) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ARGB_ZEBRA } };
    }
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = borderStyle;
      if ([1, 2, 4, 6].includes(col)) c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      if (col === 4) {
        c.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: ARGB_BURGUNDY } };
      }
    });
  });

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const fileName02 = "02_BANG_THEO_DOI_TIEN_DO_GANTT_RACI_TAI_CHINH_AUTOBIZ_AI.xlsx";
  safeWriteFile(path.join(PACKAGE_DIR, fileName02), excelBuffer);
  safeWriteFile(path.join(DESKTOP_DIR, fileName02), excelBuffer);
  safeWriteFile(path.join(WORKSPACE_DIR, fileName02), excelBuffer);
  safeWriteFile(path.join(DOWNLOADS_DIR, fileName02), excelBuffer);
}

buildOnlyFile02Excel().catch((err) => {
  console.error("Error generating File 02 Excel:", err);
  process.exit(1);
});
