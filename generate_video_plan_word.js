/**
 * generate_video_plan_word.js (CV18 - Giai đoạn 7)
 * Kịch bản Quay Video 03 Phút chuẩn Phụ lục IV Công văn 11677/KH-SGDĐT
 * - Đơn vị: Trường THPT Nguyễn Du (xã Ngãi Giao) | GVHD: Thầy Đỗ Xuân Hưng
 * - Đội thi (02 thành viên): Nguyễn Như Vương Gia (Trưởng nhóm) & Nguyễn Khang Thịnh
 * - Định vị: Mô hình 2 phía (B2B Shop nhỏ + B2C CTV không vốn) | Minh chứng thật: Fanpage Laptop Vương Gia
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
} = require('docx');

const COLOR_INK = "111827";
const COLOR_BURGUNDY = "7F1D1D";
const COLOR_MUTED = "4B5563";
const COLOR_BORDER = "9CA3AF";
const COLOR_BG_HEADER = "F3F4F6";
const COLOR_BG_HIGHLIGHT = "FEF2F2";

function p(text, options = {}) {
  const { bold = false, italic = false, size = 25, align = AlignmentType.LEFT, spaceAfter = 90, color = COLOR_INK } = options;
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

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT, customColor = null, customBg = null) {
  const paragraphs = String(text).split('\n').map((line) => new Paragraph({
    alignment: align,
    spacing: { after: 40, before: 40, line: 270 },
    children: [
      new TextRun({
        text: line,
        bold: isHeader || Boolean(customColor),
        size: isHeader ? 22 : 21,
        font: "Times New Roman",
        color: customColor || (isHeader ? COLOR_BURGUNDY : COLOR_INK)
      })
    ]
  }));

  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: customBg ? { type: ShadingType.SOLID, color: customBg } : (isHeader ? { type: ShadingType.SOLID, color: COLOR_BG_HEADER } : undefined),
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    children: paragraphs
  });
}

function makeTable(headers, rows, colWidths, highlightRows = []) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, true, colWidths[i], AlignmentType.CENTER))
  });
  const dataRows = rows.map((r, rowIdx) => {
    const isHi = highlightRows.includes(rowIdx);
    return new TableRow({
      children: r.map((val, i) => cell(val, false, colWidths[i], i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT, isHi && i === 0 ? COLOR_BURGUNDY : null, isHi ? COLOR_BG_HIGHLIGHT : null))
    });
  });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

async function main() {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, right: 850, bottom: 900, left: 1000 } } },
      children: [
        p("TRƯỜNG THPT NGUYỄN DU (XÃ NGÃI GIAO) — PHỤ LỤC IV CÔNG VĂN 11677/KH-SGDĐT", {
          bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 40, color: COLOR_MUTED
        }),
        p("KẾ HOẠCH & KỊCH BẢN QUAY VIDEO THẬT (03 PHÚT)", {
          bold: true, size: 34, align: AlignmentType.CENTER, spaceAfter: 60, color: COLOR_BURGUNDY
        }),
        p("Dự án: AutoBiz AI (LV03) | Đội thi (02 TV): Nguyễn Như Vương Gia & Nguyễn Khang Thịnh | GVHD: Thầy Đỗ Xuân Hưng", {
          bold: true, italic: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 50, color: COLOR_INK
        }),
        p("Tên file nộp chuẩn: THPTNguyenDu_LV03_DA01_Video.mp4 | Định dạng: MP4 FullHD 1080p (< 500MB)", {
          italic: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 180, color: COLOR_MUTED
        }),

        h1("1. ĐỘI THI & 5 TIÊU CHÍ BẮT BUỘC THEO PHỤ LỤC IV"),
        makeTable(
          ["STT", "Tiêu chí Bắt buộc", "Vị trí trong Video", "Nội dung Thực tế Của Nhóm"],
          [
            ["01", "Giới thiệu Đội thi & Thành viên", "Cảnh 1 (0:00–0:20)", "- Trường THPT Nguyễn Du (xã Ngãi Giao), GVHD: Thầy Đỗ Xuân Hưng.\n- 02 thành viên: Nguyễn Như Vương Gia (Trưởng nhóm - Kiến trúc AI & Vận hành) & Nguyễn Khang Thịnh (Khảo sát, Tài chính & Truyền thông)."],
            ["02", "Tóm tắt SP, Lợi thế, Mục tiêu - Tầm nhìn & Phân khúc KH", "Cảnh 2 (0:20–0:45)", "- Mô hình 2 phía: B2B (Hộ kinh doanh/Shop nhỏ) + B2C (Học sinh, sinh viên/CTV không vốn).\n- Lợi thế: 3 trong 1 từ 199k/tháng (tiết kiệm 80% so với ghép ChatGPT + Sapo + Tool)."],
            ["03", "Demo Sản phẩm & Minh chứng Chạy thật", "Cảnh 3–5 (0:45–1:55)", "- Đã vận hành thực tế trên Fanpage Laptop Vương Gia.\n- Quay Extension AB lấy ảnh + Gemini AI 4 kênh + Đăng Fanpage + FinTech 452 CTV."],
            ["04", "Đánh giá Tính khả thi của Dự án", "Cảnh 6 (1:55–2:30)", "- Thị trường: N=10.920 (94% đồng thuận) | Kỹ thuật: Vercel Live, 452 CTV / 5ms | Tài chính: Doanh thu 520tr -> 9,03 tỷ, Lãi 300tr -> 5,78 tỷ, Biên 57,7% -> 64%, Hòa vốn tháng 5."],
            ["05", "Ý nghĩa Xã hội, Thông điệp & Dẫn nguồn", "Cảnh 7 (2:30–3:00)", "- Chuyển đổi số bình dân cho tiểu thương + việc làm không vốn cho học sinh, sinh viên.\n- Bắt buộc có khung Credit dẫn nguồn nhạc nền, hình ảnh & AI ở 5 giây cuối (Mục 5 PL IV)."]
          ],
          [7, 25, 16, 52],
          [0, 3, 4]
        ),

        h1("2. KỊCH BẢN QUAY THẬT CHI TIẾT (00:00 – 03:00 — 7 CẢNH)"),
        makeTable(
          ["Thời gian", "Phân cảnh & Người nói", "Hình ảnh Quay & Chữ nổi (Text Overlay)", "Lời bình Đọc mẫu (~430 chữ / 3 phút)"],
          [
            ["0:00 – 0:20\n(20s)", "Cảnh 1:\nGiới thiệu Đội thi\n(Gia & Thịnh cùng xuất hiện)", "- Vương Gia & Khang Thịnh mặc đồng phục THPT Nguyễn Du đứng trước máy quay.\n- Bảng tên: Trường THPT Nguyễn Du (Ngãi Giao) | GVHD: Đỗ Xuân Hưng | 02 TV: Vương Gia - Khang Thịnh.", "Vương Gia: \"Kính chào Ban Giám khảo! Chúng em đến từ Trường THPT Nguyễn Du, xã Ngãi Giao, dưới sự hướng dẫn của thầy Đỗ Xuân Hưng. Em là Nguyễn Như Vương Gia, trưởng nhóm phụ trách Kiến trúc AI.\" Khang Thịnh: \"Còn em là Nguyễn Khang Thịnh, phụ trách Khảo sát, Tài chính và Truyền thông. Hôm nay chúng em xin giới thiệu dự án AutoBiz AI.\""],
            ["0:20 – 0:45\n(25s)", "Cảnh 2:\nMô hình 2 phía, Lợi thế & Tầm nhìn\n(Khang Thịnh đọc)", "- Quay Slide 1, 2 & Slide 7 (/slides).\n- Chữ nổi: B2B SMEs + B2C GEN Z | 3 TRONG 1 TỪ 199K | TIẾT KIỆM 80% CHI PHÍ.", "\"AutoBiz AI kết nối 2 phân khúc khách hàng chính: các hộ kinh doanh nhỏ (B2B) thiếu nhân lực marketing và học sinh, sinh viên (B2C) muốn làm cộng tác viên không cần vốn. Lợi thế cạnh tranh của chúng em là gói gọn 3 trong 1 chỉ từ 199.000đ/tháng — tiết kiệm 80% chi phí so với mua rời ChatGPT, Sapo và tool đăng bài — hướng tới tầm nhìn trở thành hạ tầng tiếp thị liên kết minh bạch cho kinh doanh nhỏ.\""],
            ["0:45 – 1:10\n(25s)", "Cảnh 3:\nDemo 1 — Extension & Gemini AI\n(Vương Gia thao tác & đọc)", "- Mở Shopee -> bấm icon AB -> [Lấy từ Tab hiện tại] (hiện 6 ảnh) -> sang [Studio Đa Kênh] bấm [Sinh 4 Kênh] -> lướt nút Bật/Tắt kênh.", "\"Sản phẩm đã chạy thực tế trên Fanpage bán laptop của em. Khi lướt Shopee, chỉ cần 1 chạm trên tiện ích AutoBiz AI Collector, hệ thống tự lấy tên, giá, ngành hàng và toàn bộ hình ảnh. Sau đó Gemini AI viết song song 4 bản cho Facebook, TikTok, Zalo, Shopee và cho phép tắt bớt kênh không dùng.\""],
            ["1:10 – 1:32\n(22s)", "Cảnh 4:\nDemo 2 — Shortlink /r/:code & Đăng Fanpage\n(Vương Gia đọc)", "- Bấm [Tạo Shortlink /r/:code] -> bấm [Phân phối Đa Kênh] (hiện Thành công lên Fanpage Laptop Vương Gia) -> mở thử /r/:code.", "\"Mỗi bài viết tự động gắn shortlink /r/:code mang mã định danh từng CTV (SubID). Chỉ 1 nút bấm, bài kèm ảnh được đăng trực tiếp lên Fanpage qua Graph API chính thống, còn mọi lượt click của khách hàng đều được đo lường theo thời gian thực.\""],
            ["1:32 – 1:55\n(23s)", "Cảnh 5:\nDemo 3 — Doanh thu, Tiền & Lãi (452 CTV)\n(Khang Thịnh đọc)", "- Mở [Tổng quan & FinTech] -> zoom 4 thẻ tiền: GMV 3,01 tỷ | Hoa hồng 185,8tr | Thực thu 2,83 tỷ -> bấm [+ Chốt đơn] -> cuộn bảng 452 CTV.", "\"Tại bảng điều khiển FinTech, chủ shop nhìn rõ từng đồng: từ tổng doanh thu GMV, doanh thu thực chốt, tiền hoa hồng trả từng CTV đến tiền thực thu của shop — giúp kiểm soát chặt chẽ lãi lỗ trên từng đơn hàng.\""],
            ["1:55 – 2:30\n(35s)", "Cảnh 6:\nĐánh giá Tính khả thi (3 Trụ cột)\n(Khang Thịnh đọc)", "- Quay Slide 3–6 (N=10.920, 94%) -> Slide 10–11.\n- Chữ nổi: THỊ TRƯỜNG: N=10.920 (94%) | KỸ THUẬT: 452 CTV / 5ms | TÀI CHÍNH: HÒA VỐN THÁNG 5 | BIÊN 57,7% → 64%.", "\"Tính khả thi được chứng minh trên 3 trụ cột. Thị trường: khảo sát 10.920 người đạt 94% đồng thuận. Kỹ thuật: chạy ổn định trên Vercel, xử lý 452 CTV trong 5 mili-giây và đã vận hành thực tế trên Fanpage Laptop Vương Gia. Tài chính: chi phí năm đầu 220 triệu, doanh thu 520 triệu, lãi 300 triệu, biên lợi nhuận 57,7% và hòa vốn tháng thứ 5; năm 3 đạt 9,03 tỷ doanh thu, 5,78 tỷ tiền lãi với biên 64%.\""],
            ["2:30 – 3:00\n(30s)", "Cảnh 7:\nÝ nghĩa Xã hội, Thông điệp & Credit\n(Gia & Thịnh cùng nói)", "- Cảnh 2 bạn đứng cùng nhau -> 5s cuối hiện màn hình `autobiz-ai-seven.vercel.app` + Dòng dẫn nguồn nhạc/ảnh/AI.", "Vương Gia: \"Giá trị xã hội lớn nhất của AutoBiz AI là đưa công nghệ chuyển đổi số bình dân đến hộ kinh doanh nhỏ và tạo việc làm không vốn, minh bạch cho học sinh, sinh viên.\" Cả 2 bạn: \"AutoBiz AI — Công nghệ vị nhân sinh, dòng tiền minh bạch! Xin cảm ơn Ban Giám khảo!\""]
          ],
          [12, 18, 28, 42],
          [0, 5, 6]
        ),

        h1("3. PHÂN CÔNG QUAY THẬT CHO 2 THÀNH VIÊN & LƯU Ý PHỤ LỤC IV"),
        dash("Vương Gia chuẩn bị máy tính mở sẵn Local (452 CTV), Vercel Live, Tab Shopee và Fanpage Laptop Vương Gia để quay sạch màn hình 4 đoạn Demo (Cảnh 3–5).", "Quay màn hình:"),
        dash("Hai bạn mặc đồng phục Trường THPT Nguyễn Du quay chung Cảnh 1 (0:00–0:20) và Cảnh 7 (2:30–3:00) tại lớp/phòng sáng rõ, đặt điện thoại ngang (16:9).", "Quay người thật:"),
        dash("Bắt buộc chèn 5 giây cuối bảng chữ: \"Nguồn tư liệu: Khảo sát thực địa N=10.920 (nhóm thực hiện); Nhạc nền: Free-to-use Audio; Công cụ hỗ trợ mã hóa & sinh nội dung mẫu: Google Gemini AI (đã kê khai theo CV 11677)\".", "Dẫn nguồn (Mục 5 PL IV):"),
        dash("Xuất file định dạng .mp4 (1920x1080), thời lượng <= 03:00, dung lượng < 500MB, đặt tên chính xác: THPTNguyenDu_LV03_DA01_Video.mp4.", "Đặt tên file nộp:")
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outProject = path.join(__dirname, 'KE_HOACH_VA_KICH_BAN_QUAY_VIDEO_3PHUT_AUTOBIZ_AI.docx');
  const outDesktop = path.join('C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'KE_HOACH_VA_KICH_BAN_QUAY_VIDEO_3PHUT_AUTOBIZ_AI.docx');
  fs.writeFileSync(outProject, buffer);
  fs.writeFileSync(outDesktop, buffer);
  console.log('Video Plan updated:', outDesktop, buffer.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
