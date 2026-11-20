/**
 * generate_autobiz_word.js (CV16 - Chuẩn Phụ lục III Công văn 11677/KH-SGDĐT)
 * Xuất Bản Thuyết minh Dự án Khởi nghiệp: THPTNguyenDu_LV03_DA01_Thuyetminh.docx
 * - Đơn vị: Trường THPT Nguyễn Du (xã Ngãi Giao) | GVHD: Thầy Đỗ Xuân Hưng
 * - Đội thi (02 thành viên): Nguyễn Như Vương Gia (Trưởng nhóm) & Nguyễn Khang Thịnh
 * - Định dạng chuẩn PL III: Times New Roman, cỡ chữ 14 (28 half-points), nội dung chính <= 10 trang A4
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak
} = require('docx');

const COLOR_INK = "111827";
const COLOR_BURGUNDY = "7F1D1D";
const COLOR_BORDER = "6B7280";
const COLOR_BG = "F3F4F6";

// Cỡ chữ 14pt = 28 half-points theo chuẩn Phụ lục III Công văn 11677
function p14(text, opts = {}) {
  const { bold = false, italic = false, align = AlignmentType.LEFT, spaceAfter = 100, color = COLOR_INK, size = 28 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 310 },
    children: [new TextRun({ text, bold, italic, size, font: "Times New Roman", color })]
  });
}

function dash14(text, boldPrefix = "") {
  const children = [new TextRun({ text: "- ", bold: true, size: 28, font: "Times New Roman", color: COLOR_INK })];
  if (boldPrefix) children.push(new TextRun({ text: boldPrefix + " ", bold: true, size: 28, font: "Times New Roman", color: COLOR_INK }));
  children.push(new TextRun({ text, size: 28, font: "Times New Roman", color: COLOR_INK }));
  return new Paragraph({ spacing: { after: 80, line: 300 }, indent: { left: 260 }, children });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_BURGUNDY })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 140, after: 70 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_INK })]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT, rowSpan = 1, colSpan = 1) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    rowSpan,
    columnSpan: colSpan,
    shading: isHeader ? { type: ShadingType.SOLID, color: COLOR_BG } : undefined,
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    children: String(text).split('\n').map((line, idx) => new Paragraph({
      alignment: align,
      spacing: { after: 30, before: 30, line: 270 },
      children: [new TextRun({ text: line, bold: isHeader || idx === 0 && text.includes('\n'), size: isHeader ? 23 : 22, font: "Times New Roman", color: isHeader ? COLOR_BURGUNDY : COLOR_INK })]
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

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

async function main() {
  // Bảng Business Model Canvas 9 ô theo đúng Phụ lục III trang 16 CV 11677
  const bmcTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("ĐỐI TÁC CHÍNH\n- Hộ kinh doanh, shop bán lẻ (lĩnh vực laptop, phụ kiện, gia dụng, FMCG, thời trang).\n- Nền tảng AI & Cloud (Google Gemini, Vercel, Supabase, Meta Graph API).\n- Trường THPT Nguyễn Du & cộng đồng khởi nghiệp trẻ.", false, 20, AlignmentType.LEFT, 2, 1),
          cell("HOẠT ĐỘNG CHÍNH\n- Phát triển & vận hành WebApp 5 phân hệ, Chrome Extension thu thập ảnh/SP.\n- Sinh nội dung 4 kênh & theo dõi link /r/:code.\n- Hỗ trợ shop triển khai & đối soát doanh thu CTV.", false, 20, AlignmentType.LEFT, 1, 1),
          cell("GIẢI PHÁP GIÁ TRỊ\n- Tự động hóa viết bài 4 kênh + đăng Fanpage.\n- Rút gọn link gắn UTM & bảng tính GMV, Hoa hồng CTV, Thực thu shop trong 5ms.\n- Tiết kiệm 80% chi phí so với mua rời 3 công cụ.", false, 20, AlignmentType.LEFT, 2, 1),
          cell("QUAN HỆ KHÁCH HÀNG\n- Tự phục vụ qua WebApp & Extension.\n- Dùng thử miễn phí 30 ngày / 50 bài đầu.\n- Hỗ trợ trực tiếp qua Zalo/Telegram & cộng đồng.", false, 20, AlignmentType.LEFT, 1, 1),
          cell("PHÂN KHÚC KHÁCH HÀNG\n- B2B: Hộ kinh doanh nhỏ, shop online thiếu nhân lực marketing (gói Pro 199k, Team 499k).\n- B2C: Học sinh, sinh viên làm CTV không cần vốn.", false, 20, AlignmentType.LEFT, 2, 1)
        ]
      }),
      new TableRow({
        children: [
          cell("TÀI NGUYÊN CHÍNH\n- Mã nguồn AutoBiz AI (Node.js, Chrome MV3).\n- Bộ dữ liệu khảo sát N=10.920 & minh chứng Fanpage Laptop Vương Gia.", false, 20, AlignmentType.LEFT, 1, 1),
          cell("KÊNH THÔNG TIN & PHÂN PHỐI\n- Website: autobiz-ai-seven.vercel.app\n- Chrome Extension, Facebook Fanpage, TikTok, Zalo OA.", false, 20, AlignmentType.LEFT, 1, 1)
        ]
      }),
      new TableRow({
        children: [
          cell("CẤU TRÚC CHI PHÍ\n- Hạ tầng Cloud Serverless (Vercel/Supabase): 36 triệu/năm.\n- API Google Gemini & kết nối đa kênh: 44 triệu/năm.\n- Vận hành, R&D & hỗ trợ cộng đồng: 140 triệu/năm (Tổng OPEX năm 1: 220 triệu).", false, 50, AlignmentType.LEFT, 1, 2),
          cell("DÒNG DOANH THU\n- Doanh thu kép: Thuê bao SaaS (Pro 199.000đ/tháng, Team 499.000đ/tháng) + Chia sẻ phí nền tảng Affiliate.\n- Doanh thu năm 1: 520tr (Hòa vốn tháng 5) -> Năm 3: 9,03 tỷ.", false, 50, AlignmentType.LEFT, 1, 3)
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 1100 } } },
      children: [
        // TRANG BÌA (Không tính vào giới hạn 10 trang theo Công văn 11677)
        p14("ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", { bold: true, align: AlignmentType.CENTER, spaceAfter: 40 }),
        p14("SỞ GIÁO DỤC VÀ ĐÀO TẠO", { bold: true, align: AlignmentType.CENTER, spaceAfter: 240 }),
        p14("CUỘC THI", { bold: true, align: AlignmentType.CENTER, spaceAfter: 40, size: 32 }),
        p14("“HỌC SINH VỚI Ý TƯỞNG KHỞI NGHIỆP CẤP THÀNH PHỐ”", { bold: true, align: AlignmentType.CENTER, spaceAfter: 40, size: 32, color: COLOR_BURGUNDY }),
        p14("NĂM HỌC 2026 - 2027", { bold: true, align: AlignmentType.CENTER, spaceAfter: 360, size: 30 }),
        p14("TÊN DỰ ÁN: AUTOBIZ AI", { bold: true, align: AlignmentType.CENTER, spaceAfter: 40, size: 34, color: COLOR_BURGUNDY }),
        p14("Hệ sinh thái Tiếp thị Đa kênh & Affiliate FinTech tích hợp AI", { bold: true, italic: true, align: AlignmentType.CENTER, spaceAfter: 160, size: 28 }),
        p14("Lĩnh vực dự thi: LV03 — Dịch vụ, tài chính, ngân hàng", { bold: true, align: AlignmentType.CENTER, spaceAfter: 360 }),
        p14("NHÓM THỰC HIỆN (02 THÀNH VIÊN):", { bold: true, align: AlignmentType.CENTER, spaceAfter: 40 }),
        p14("1. Nguyễn Như Vương Gia (Trưởng nhóm)", { align: AlignmentType.CENTER, spaceAfter: 30 }),
        p14("2. Nguyễn Khang Thịnh (Thành viên)", { align: AlignmentType.CENTER, spaceAfter: 160 }),
        p14("Giáo viên hướng dẫn: Thầy Đỗ Xuân Hưng", { bold: true, align: AlignmentType.CENTER, spaceAfter: 60 }),
        p14("ĐƠN VỊ: TRƯỜNG THPT NGUYỄN DU (XÃ NGÃI GIAO)", { bold: true, align: AlignmentType.CENTER, spaceAfter: 420 }),
        p14("Thành phố Hồ Chí Minh, tháng 11 năm 2026", { italic: true, align: AlignmentType.CENTER }),

        pageBreak(),

        // TRANG THỨ 1: I. THÔNG TIN CHUNG
        h1("I. THÔNG TIN CHUNG"),
        p14("1. Họ và tên trưởng nhóm: Nguyễn Như Vương Gia"),
        p14("2. Trường: Trường THPT Nguyễn Du (xã Ngãi Giao)"),
        p14("3. Số điện thoại liên hệ: ...................................................................................."),
        p14("4. Email: ............................................................................................................"),
        p14("5. Danh sách thành viên trong nhóm (02 thành viên):", { bold: true }),
        dash14("Nguyễn Như Vương Gia — Trường THPT Nguyễn Du — SĐT: ........................."),
        dash14("Nguyễn Khang Thịnh — Trường THPT Nguyễn Du — SĐT: .............................."),
        p14("6. Họ và tên giáo viên hướng dẫn: Đỗ Xuân Hưng — SĐT: .........................", { spaceAfter: 180 }),

        // TRANG THỨ 2: II. TÓM TẮT DỰ ÁN
        h1("II. TÓM TẮT DỰ ÁN"),
        dash14("Xây dựng nền tảng AutoBiz AI kết nối 2 phía giữa hộ kinh doanh nhỏ (B2B) và cộng tác viên học sinh, sinh viên (B2C) thông qua tự động hóa nội dung AI đa kênh và đo lường dòng tiền Affiliate minh bạch.", "Ý tưởng chính của dự án:"),
        dash14("AutoBiz AI gồm WebApp 5 phân hệ (https://autobiz-ai-seven.vercel.app) và Chrome Extension v2.0. Người dùng chỉ cần 1 chạm để thu thập sản phẩm kèm hình ảnh từ sàn TMĐT, dùng Google Gemini AI viết song song 4 định dạng (Facebook, TikTok, Zalo, Shopee), tự động đăng lên Fanpage và gắn link rút gọn /r/:code. Hệ thống tự động thống kê lượt click, doanh thu (GMV), tiền hoa hồng trả từng CTV và tiền thực thu của chủ shop, giúp tiết kiệm 80% chi phí so với mua rời các công cụ hiện có.", "Mô tả sản phẩm/dịch vụ, giá trị của dự án:", { spaceAfter: 180 }),

        // III. NỘI DUNG CHÍNH
        h1("III. NỘI DUNG CHÍNH CỦA DỰ ÁN"),
        h2("A. TỔNG QUAN DỰ ÁN (BUSINESS MODEL CANVAS)"),
        bmcTable,
        p14("", { spaceAfter: 80 }),

        h2("B. MÔ TẢ THÊM VỀ SẢN PHẨM, DỊCH VỤ"),
        p14("1. Tính cần thiết của sản phẩm, dịch vụ", { bold: true }),
        dash14("Dự án đã có sản phẩm hoàn chỉnh chạy thực tế trên Vercel (autobiz-ai-seven.vercel.app), Chrome Extension Manifest V3 và đã triển khai vận hành thật trên Fanpage bán laptop Laptop Vương Gia (ID: 1154184381110692).", "Mức độ hoàn thiện:"),
        dash14("Mục tiêu: Đồng bộ quy trình từ lấy hàng -> viết bài -> đăng bài -> đối soát hoa hồng trên 1 nền tảng duy nhất. Tầm nhìn: Trở thành hạ tầng chuyển đổi số bình dân và tiếp thị liên kết minh bạch cho hộ kinh doanh nhỏ và thế hệ trẻ.", "Mục tiêu, giá trị, tầm nhìn:"),
        dash14("Phân khúc 1 (B2B): Chủ shop, hộ kinh doanh nhỏ lẻ cần bán đa kênh nhưng thiếu nhân lực. Phân khúc 2 (B2C): Học sinh, sinh viên muốn làm CTV bán hàng không cần vốn.", "Khách hàng & Lý do lựa chọn:"),
        dash14("Giúp tiểu thương bước vào chuyển đổi số với chi phí thấp, đồng thời tạo việc làm linh hoạt, minh bạch thu nhập cho học sinh, sinh viên.", "Giá trị cộng đồng:"),

        p14("2. Tính khả thi", { bold: true }),
        dash14("Khảo sát thực địa 2 phía trên N = 10.920 người (5.240 chủ shop/KOC B2B và 5.680 người tiêu dùng B2C) ghi nhận 94% đồng thuận với giải pháp tự động hóa kết hợp minh bạch hoa hồng.", "Khả thi thị trường:"),
        dash14("Kiến trúc Node.js Serverless + Chrome Extension tối ưu chi phí (chỉ 36 triệu/năm tiền hạ tầng). Thử nghiệm tải với quy mô 452 CTV, 21.486 lượt click và 812 đơn hàng (GMV > 3,01 tỷ đồng) cho thời gian xử lý báo cáo chỉ 5 mili-giây.", "Khả thi kỹ thuật:"),
        dash14("Rủi ro phụ thuộc API bên thứ ba được kiểm soát bằng cơ chế fallback đa model Gemini và chế độ đóng gói bài sẵn sàng khi API gián đoạn.", "Thuận lợi & kiểm soát rủi ro:"),

        p14("3. Tính độc đáo, sáng tạo & lợi thế cạnh tranh", { bold: true }),
        makeTable(
          ["Tiêu chí", "AutoBiz AI (Nhóm phát triển)", "ChatGPT / AI rời", "Sapo / KiotViet", "Tool Auto Post lẻ"],
          [
            ["Thu thập ảnh & SP 1 chạm", "Có sẵn (Extension AB)", "Không", "Nhập tay / đồng bộ phức tạp", "Quét thô dễ khóa nick"],
            ["AI viết 4 kênh + Bật/Tắt app", "Có (FB, TikTok, Zalo, Shopee)", "Viết từng đoạn rời", "Không chuyên AI content", "Không"],
            ["Đo Click, Doanh thu & Lãi CTV", "Có (/r/:code, GMV, Thực thu)", "Không", "Chỉ quản lý kho nội bộ", "Không"],
            ["Chi phí hằng tháng", "Từ 199.000đ (tiết kiệm 80%)", "~500.000đ", "300.000đ – 1.500.000đ", "150.000đ – 300.000đ"]
          ],
          [22, 24, 18, 18, 18]
        ),
        p14("", { spaceAfter: 60 }),

        p14("4. Kết quả tiềm năng & Dự phóng Tài chính 3 năm", { bold: true }),
        dash14("Chiến lược tiếp cận 110 shop đầu tiên để hòa vốn: Áp dụng Freemium dùng thử miễn phí 30 ngày / 50 bài AI đầu tiên cho hộ kinh doanh tại xã Ngãi Giao và khu vực lân cận trải nghiệm ra đơn thật trước khi nâng cấp gói Pro (199.000đ/tháng) hoặc Team (499.000đ/tháng).", "Nguồn thu & điểm hòa vốn:"),
        makeTable(
          ["Chỉ số Tài chính Dự phóng", "Năm 1 (2027)", "Năm 2 (2028)", "Năm 3 (2029)"],
          [
            ["Tổng Doanh thu thuần (SaaS + Affiliate)", "520.000.000 đ", "2.420.000.000 đ", "9.030.000.000 đ"],
            ["Tổng Chi phí hoạt động (OPEX)", "220.000.000 đ", "980.000.000 đ", "3.250.000.000 đ"],
            ["Lợi nhuận trước thuế (Lãi)", "300.000.000 đ", "1.440.000.000 đ", "5.780.000.000 đ"],
            ["Biên lợi nhuận ròng (Net Margin)", "57,7%", "59,5%", "64,0%"],
            ["Điểm hòa vốn", "Tháng thứ 5 (~110 shop)", "Đã có lãi tích lũy", "Mở rộng toàn quốc"]
          ],
          [34, 22, 22, 22]
        ),
        p14("", { spaceAfter: 60 }),

        p14("5. Các kênh truyền thông", { bold: true }),
        dash14("Triển khai truyền thông đa kênh ngay bằng chính sản phẩm AutoBiz AI: Fanpage Facebook thử nghiệm thực tế, chuỗi video ngắn TikTok hướng dẫn hộ kinh doanh chuyển đổi số, kết hợp giới thiệu trực tiếp qua câu lạc bộ khởi nghiệp học đường."),

        h2("C. SỞ HỮU TRÍ TUỆ, KÊ KHAI AI VÀ CAM KẾT"),
        dash14("Toàn bộ mã nguồn WebApp, Chrome Extension và động cơ FinTech do 2 thành viên đội thi trực tiếp thiết kế, lập trình và lưu trữ công khai tại github.com/nguyennhu19022008-ux/autobiz-ai.", "Quyền tác giả & Mã nguồn:"),
        dash14("Bộ dữ liệu khảo sát N = 10.920 do nhóm trực tiếp thu thập và tổng hợp; hình ảnh demo lấy hợp lệ từ sản phẩm thử nghiệm trên Fanpage Laptop Vương Gia.", "Nguồn dữ liệu & hình ảnh:"),
        dash14("Sản phẩm có tích hợp API Google Gemini làm công cụ hỗ trợ soạn thảo nội dung tiếp thị và có sử dụng trợ lý AI trong quá trình kiểm thử/soạn thảo tài liệu; mọi kiến trúc, logic nghiệp vụ và thử nghiệm thực tế do 2 thành viên làm chủ và chịu trách nhiệm.", "Kê khai sử dụng AI có trách nhiệm:"),
        dash14("Nhóm cam kết dự án hoàn toàn trung thực, không sao chép, tuân thủ Luật An ninh mạng, bảo vệ dữ liệu cá nhân (mã hóa API Key) và quy chế Cuộc thi theo Công văn 11677/KH-SGDĐT.", "Cam kết:")
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outProject = path.join(__dirname, 'THPTNguyenDu_LV03_DA01_Thuyetminh.docx');
  const outDesktop = path.join('C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'THPTNguyenDu_LV03_DA01_Thuyetminh.docx');
  fs.writeFileSync(outProject, buffer);
  fs.writeFileSync(outDesktop, buffer);
  console.log('Generated Phu luc III Thuyet minh:', outDesktop, buffer.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
