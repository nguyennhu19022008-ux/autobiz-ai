/**
 * generate_minhchung_word.js
 * Xuất Hồ sơ Minh chứng Dự án chuẩn Công văn 11677/KH-SGDĐT (Đồng bộ v1.1 + Supabase + Dual Theme + QA 71/71)
 * Tên tệp: THPTNguyenDu_LV03_DA01_Minhchung.docx
 * - Nhúng đầy đủ 6 biểu đồ khảo sát thực nghiệm 300 DPI (N = 10.920)
 * - Nhúng bộ ảnh chụp thực tế giao diện mới Minimalist FinTech (Dark & Light Mode)
 * - Bảng tổng hợp 71/71 kiểm thử tự động (Local + Production Live) & Benchmark 452 CTV (5ms)
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun
} = require('docx');

const COLOR_INK = "111827";
const COLOR_BURGUNDY = "7F1D1D";
const COLOR_MUTED = "4B5563";
const COLOR_BORDER = "9CA3AF";
const COLOR_BG = "F3F4F6";
const SCREENSHOTS_DIR = 'C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI\\ảnh minh họa';

function p(text, opts = {}) {
  const { bold = false, italic = false, size = 25, align = AlignmentType.LEFT, spaceAfter = 90, color = COLOR_INK } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 310 },
    children: [new TextRun({ text, bold, italic, size, font: "Times New Roman", color })]
  });
}

function dash(text, boldPrefix = "") {
  const children = [new TextRun({ text: "- ", bold: true, size: 25, font: "Times New Roman", color: COLOR_BURGUNDY })];
  if (boldPrefix) children.push(new TextRun({ text: boldPrefix + " ", bold: true, size: 25, font: "Times New Roman", color: COLOR_INK }));
  children.push(new TextRun({ text, size: 25, font: "Times New Roman", color: COLOR_INK }));
  return new Paragraph({ spacing: { after: 75, line: 300 }, indent: { left: 240 }, children });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 110 },
    border: { bottom: { color: COLOR_BURGUNDY, space: 4, style: BorderStyle.SINGLE, size: 8 } },
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_BURGUNDY })]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: isHeader ? { type: ShadingType.SOLID, color: COLOR_BG } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    children: String(text).split('\n').map((line) => new Paragraph({
      alignment: align,
      spacing: { after: 35, before: 35, line: 270 },
      children: [new TextRun({ text: line, bold: isHeader, size: isHeader ? 22 : 21, font: "Times New Roman", color: isHeader ? COLOR_BURGUNDY : COLOR_INK })]
    }))
  });
}

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, true, colWidths[i], AlignmentType.CENTER)) }),
      ...rows.map((r) => new TableRow({ children: r.map((v, i) => cell(v, false, colWidths[i], i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT)) }))
    ]
  });
}

function embedImage(fullPath, caption, width = 560, height = 220) {
  if (!fs.existsSync(fullPath)) {
    return [p(`[Thiếu hình ảnh: ${path.basename(fullPath)}]`, { italic: true, color: COLOR_MUTED })];
  }
  const imgBuf = fs.readFileSync(fullPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: imgBuf,
          transformation: { width, height }
        })
      ]
    }),
    p(caption, { italic: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 140, color: COLOR_MUTED })
  ];
}

function embedChart(filename, caption) {
  return embedImage(path.join(__dirname, 'charts', filename), caption, 560, 220);
}

function embedUiShot(filename, caption) {
  const fullPath = path.join(SCREENSHOTS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return [p(`[Thiếu hình ảnh: ${filename}]`, { italic: true, color: COLOR_MUTED })];
  }
  const imgBuf = fs.readFileSync(fullPath);
  const origW = imgBuf.readUInt32BE(16) || 1440;
  const origH = imgBuf.readUInt32BE(20) || 900;
  const maxW = 500;
  const maxH = 420;
  const scale = Math.min(maxW / origW, maxH / origH);
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);
  return embedImage(fullPath, caption, w, h);
}

async function main() {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 1000 } } },
      children: [
        p("TRƯỜNG THPT NGUYỄN DU (XÃ NGÃI GIAO) — PHỤ LỤC MINH CHỨNG (CÔNG VĂN 11677)", {
          bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 40, color: COLOR_MUTED
        }),
        p("HỒ SƠ MINH CHỨNG THỰC NGHIỆM, KIỂM THỬ & VẬN HÀNH SẢN PHẨM", {
          bold: true, size: 32, align: AlignmentType.CENTER, spaceAfter: 60, color: COLOR_BURGUNDY
        }),
        p("Dự án: AutoBiz AI (LV03 - DA01) | Đội thi: Nguyễn Như Vương Gia & Nguyễn Khang Thịnh | GVHD: Đỗ Xuân Hưng", {
          bold: true, italic: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 180, color: COLOR_INK
        }),

        h1("1. MINH CHỨNG HỆ THỐNG ĐANG VẬN HÀNH TRỰC TUYẾN (LIVE V1.1)"),
        makeTable(
          ["STT", "Thành phần Minh chứng", "Đường dẫn / Định danh Trực tiếp", "Trạng thái Xác thực"],
          [
            ["01", "WebApp 6 Phân hệ (Dual Theme Sáng/Tối)", "https://autobiz-ai-seven.vercel.app", "- HTTP 200 OK, 0 lỗi Console, Minimalist FinTech UI, Skeleton Shimmer & 5 kênh (FB, Instagram, TikTok, Zalo, Shopee)."],
            ["02", "Cơ sở dữ liệu Đám mây (Multi-Tenant)", "Supabase Postgres (Singapore) — /api/db/status", "- Kết nối trực tuyến (connected: true), cô lập dữ liệu 100% giữa Chủ shop, CTV & KOC độc lập."],
            ["03", "Trang Link Bio Công khai & Link Mời CTV", "/u/:username & /join/:shopCode", "- Tự động xuất bản trang mua hàng gắn tracking /r/:code và link tuyển CTV tự động gán shopOwner."],
            ["04", "Động cơ Tài chính Thực & VietQR Napas", "/api/orders/import, /ab-track.js, /api/payouts", "- Chế độ Click không mua = 0đ, đối soát đơn thật Webhook/CSV chống trùng orderId & sinh mã VietQR tự động."],
            ["05", "Bộ Slide Thuyết trình (Trang 0 + 12 Trang)", "https://autobiz-ai-seven.vercel.app/slides", "- HTTP 200 OK, tích hợp Trang bản quyền VUONGGIA & 6 biểu đồ khảo sát 300 DPI."],
            ["06", "Kho Mã nguồn & Fanpage Thử nghiệm Thật", "github.com/nguyennhu19022008-ux/autobiz-ai\nFanpage Laptop Vương Gia (ID: 1154184381110692)", "- Nhánh main, bảo mật scrypt + Rate Limit 429; kết nối Meta Graph API v21.0 & Chrome Extension v2.0."]
          ],
          [7, 25, 34, 34]
        ),

        h1("2. MINH CHỨNG KHẢO SÁT THỰC NGHIỆM 2 PHÍA (N = 10.920)"),
        dash("Tổng mẫu khảo sát: N = 10.920 người (trong đó Phía cung B2B: N = 5.240 hộ kinh doanh & KOC; Phía cầu B2C: N = 5.680 người tiêu dùng).", "Quy mô mẫu:"),
        dash("Mức độ đồng thuận: 94% thị trường (cả người bán lẫn người mua) xác nhận cần công cụ tự động hóa đa kênh gắn với minh bạch dòng tiền hoa hồng.", "Kết quả then chốt:"),
        ...embedChart("chart1_b2b_scale_channels.png", "Hình 1: Quy mô & Kênh bán hàng của nhóm Chủ shop/KOC B2B (N = 5.240)."),
        ...embedChart("chart2_b2b_categories_pain.png", "Hình 2: Cơ cấu 5 ngành hàng & Khó khăn lớn nhất của người bán (N = 5.240)."),
        ...embedChart("chart3_b2b_difficulties_pricing.png", "Hình 3: Điểm nghẽn vận hành & Mức giá sẵn sàng chi trả của B2B (N = 5.240)."),
        ...embedChart("chart4_b2c_platforms_influence.png", "Hình 4: Hành vi mua sắm đa nền tảng của Người tiêu dùng B2C (N = 5.680)."),
        ...embedChart("chart5_b2c_affiliate_barriers.png", "Hình 5: Rào cản tham gia Affiliate của lực lượng trẻ B2C (N = 5.680)."),
        ...embedChart("chart6_adoption_comparison.png", "Hình 6: Tỷ lệ sẵn sàng đón nhận giải pháp AutoBiz AI (94% đồng thuận)."),

        h1("3. MINH CHỨNG KIỂM THỬ TỰ ĐỘNG (71/71 PASS) & THỬ TẢI 452 CTV"),
        dash("Nhóm tự lập bộ kiểm thử tự động gồm 71 bài test chạy liên tục trên Local Engine và Production thật (Vercel + Supabase), đạt tỷ lệ 100% PASS sau 2 vòng kiểm định (đã phát hiện và vá triệt để lỗ hổng xác thực mặc định PROD-06 ở commit 5739877).", "Kết quả QA toàn diện:"),
        makeTable(
          ["Bộ Kiểm Thử Tự Động", "Phạm Vi Kiểm Định", "Kết Quả Thực Tế"],
          [
            ["QA Toàn Diện (tests/test_comprehensive_qa.js)", "30 case Local (Auth/RBAC, Brute-Force 429, Multi-Tenant, Click 60s/Bot, Toán học FinTech, CSV/Webhook, VietQR, Studio 5 kênh) + 8 case Production Live", "38 / 38 PASS (100%)\nThời gian: 12,39 giây"],
            ["Đóng Gói & E2E (scripts/verify_build_and_e2e.js)", "Kiểm tra Cache-Control chống Cache Poisoning, Responsive 4 khung hình, Calm Mobile & 17 endpoint HTTP 200", "17 / 17 PASS (100%)\n0 lỗi HTTP 404"],
            ["Nghiệp Vụ v1.0 & v1.1 (tests/test_v1_completion.js)", "URL Extractor, SSR Bio /u/:username, Link mời /join/:shop, Tài chính thực 0đ khi chỉ click, CSV Import & /ab-track.js", "16 / 16 PASS (100%)"],
            ["Thử Tải FinTech (452 CTV đồng thời)", "452 CTV / 21.486 clicks / 812 đơn hàng (GMV 3.015.129.600đ | HH 185.826.787đ | Thực thu 2.829.302.813đ)", "Tốc độ tổng hợp báo cáo:\n5 mili-giây (0,005s)"]
          ],
          [32, 46, 22]
        ),

        h1("4. ẢNH CHỤP MÀN HÌNH THỰC TẾ GIAO DIỆN MỚI (MINIMALIST FINTECH SÁNG / TỐI)"),
        dash("Toàn bộ ảnh dưới đây được chụp trực tiếp trên phiên bản Production live https://autobiz-ai-seven.vercel.app ngày 26/11/2026 (độ phân giải 1440x900).", "Nguồn ảnh xác thực:"),
        ...embedUiShot("04_Tong_Quan_FinTech_KOC_ThucTe_Dark.png", "Hình 7: Giao diện Tổng quan & FinTech (Chế độ Tối mặc định — Dark Mode #09090B) trên tài khoản thật với số liệu click & lọc spam."),
        ...embedUiShot("05_Tong_Quan_FinTech_KOC_ThucTe_Light.png", "Hình 8: Giao diện Tổng quan & FinTech (Chế độ Sáng — Light Mode #F9FAFB) chuyển đổi mượt mà 1 chạm."),
        ...embedUiShot("06_Trang_Link_Bio_Cong_Khai.png", "Hình 9: Trang Link Bio công khai (/u/nguyennhu19022008) hiển thị sản phẩm thật Xiaomi 17T Pro gắn link tracking /r/:code."),
        ...embedUiShot("08_Studio_Da_Kenh_5_NenTang_Dark.png", "Hình 10: Studio Đa Kênh hỗ trợ 5 nền tảng (Facebook, Instagram Business, TikTok Script, Zalo OA, Shopee SEO) và nút bóc tách URL."),
        ...embedUiShot("13_Cai_Dat_DoiSoat_CSV_Webhook_Cookie_Dark.png", "Hình 11: Cài Đặt Tab 4 — Chế độ Tài chính thực (Click không mua = 0đ), mã nhúng Cookie /ab-track.js, Import CSV/XLSX và Webhook POS."),
        ...embedUiShot("14_Quan_Ly_Tai_Khoan_LinkMoi_CTV_Dark.png", "Hình 12: Quản Lý Tài Khoản RBAC 3 cấp & Link tuyển dụng / Mời CTV (/join/admin) tự động gán về đúng Shop.")
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outProject = path.join(__dirname, 'THPTNguyenDu_LV03_DA01_Minhchung.docx');
  const outDesktop = path.join('C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'THPTNguyenDu_LV03_DA01_Minhchung.docx');
  fs.writeFileSync(outProject, buffer);
  try {
    fs.writeFileSync(outDesktop, buffer);
    console.log('Generated Minh chung Word Doc:', outDesktop, buffer.length);
  } catch (e) {
    const alt = outDesktop.replace('.docx', '_v2.docx');
    fs.writeFileSync(alt, buffer);
    console.log('Main file locked, saved Minh chung alt:', alt, buffer.length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
