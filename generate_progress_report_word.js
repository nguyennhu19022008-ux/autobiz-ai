/**
 * generate_progress_report_word.js
 * Xuất Báo cáo Tiến độ Triển khai Dự án AutoBiz AI (File Word .docx)
 * - Font: Times New Roman
 * - Bảng màu truyền thống: Đen mực (#111827), Đỏ đô (#7F1D1D), Nâu hổ phách (#92400E), Xám trung tính (#F3F4F6)
 * - Trình bày: Ngắn gọn, súc tích, dùng dấu gạch ngang (-) và bảng so sánh
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
} = require('docx');

const COLOR_INK = "111827";       // Đen mực truyền thống
const COLOR_BURGUNDY = "7F1D1D";  // Đỏ đô truyền thống
const COLOR_AMBER = "92400E";     // Nâu vàng truyền thống
const COLOR_MUTED = "4B5563";     // Xám trung tính
const COLOR_BORDER = "9CA3AF";    // Viền bảng xám chuẩn
const COLOR_BG_HEADER = "F3F4F6"; // Nền tiêu đề bảng xám sáng
const COLOR_BG_DONE = "FEF2F2";   // Nền nhấn nhẹ đỏ đô nhạt cho trạng thái hoàn thành

function p(text, options = {}) {
  const {
    bold = false, italic = false, size = 25,
    align = AlignmentType.LEFT, spaceAfter = 90, color = COLOR_INK
  } = options;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 310 },
    children: [
      new TextRun({ text, bold, italic, size, font: "Times New Roman", color })
    ]
  });
}

function dash(text, boldPrefix = "") {
  const children = [
    new TextRun({ text: "- ", bold: true, size: 25, font: "Times New Roman", color: COLOR_BURGUNDY })
  ];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + " ", bold: true, size: 25, font: "Times New Roman", color: COLOR_INK }));
  }
  children.push(new TextRun({ text, size: 25, font: "Times New Roman", color: COLOR_INK }));
  return new Paragraph({
    spacing: { after: 75, line: 300 },
    indent: { left: 240 },
    children
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 110 },
    border: {
      bottom: { color: COLOR_BURGUNDY, space: 4, style: BorderStyle.SINGLE, size: 8 }
    },
    children: [
      new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_BURGUNDY })
    ]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT, customColor = null, customBg = null) {
  const lines = String(text).split('\n');
  const paragraphs = lines.map((line) => new Paragraph({
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
    shading: customBg
      ? { type: ShadingType.SOLID, color: customBg }
      : (isHeader ? { type: ShadingType.SOLID, color: COLOR_BG_HEADER } : undefined),
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

function makeTable(headers, rows, colWidths, statusColIdx = -1) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, true, colWidths[i], AlignmentType.CENTER))
  });

  const dataRows = rows.map((r) => new TableRow({
    children: r.map((val, i) => {
      const str = String(val);
      let align = AlignmentType.LEFT;
      let color = null;
      let bg = null;

      if (i === 0 || (statusColIdx >= 0 && i === statusColIdx)) {
        align = AlignmentType.CENTER;
      }
      if (statusColIdx >= 0 && i === statusColIdx) {
        if (str.includes('100%') || str.includes('ĐÃ HOÀN THÀNH') || str.includes('ĐẠT')) {
          color = COLOR_BURGUNDY;
          bg = COLOR_BG_DONE;
        } else if (str.includes('0%') || str.includes('CHƯA') || str.includes('Kế hoạch')) {
          color = COLOR_AMBER;
        }
      }
      return cell(val, false, colWidths[i], align, color, bg);
    })
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 900, bottom: 1000, left: 1100 }
          }
        },
        children: [
          p("SỞ GIÁO DỤC VÀ ĐÀO TẠO — ĐỘI DỰ ÁN KHỞI NGHIỆP AUTOBIZ AI", {
            bold: true, size: 23, align: AlignmentType.CENTER, spaceAfter: 40, color: COLOR_MUTED
          }),
          p("BÁO CÁO TIẾN ĐỘ TRIỂN KHAI DỰ ÁN", {
            bold: true, size: 36, align: AlignmentType.CENTER, spaceAfter: 60, color: COLOR_BURGUNDY
          }),
          p("Hệ sinh thái Tiếp thị Đa kênh & Affiliate FinTech tích hợp AI (AutoBiz AI)", {
            bold: true, italic: true, size: 26, align: AlignmentType.CENTER, spaceAfter: 60, color: COLOR_INK
          }),
          p("Cập nhật đến ngày: 17/11/2026 | Mốc tham chiếu: File 02 Master Plan (CV01 – CV20)", {
            italic: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 200, color: COLOR_MUTED
          }),

          // MỤC 1
          h1("1. TÓM TẮT TÌNH TRẠNG DỰ ÁN (ĐẠT 95% / 100%)"),
          dash("Tính đến ngày 17/11/2026, dự án đã hoàn thành trọn vẹn 6/7 Giai đoạn (17/20 đầu việc từ CV01 đến CV17), đạt 95% tổng khối lượng trọng số kế hoạch.", "Tiến độ tổng thể:"),
          dash("Theo lịch trình gốc trong File 02, Giai đoạn 6 dự kiến hoàn thành vào ngày 26/11/2026. Nhóm đã hoàn tất sớm hơn 09 ngày để dồn toàn lực cho Giai đoạn 7 (Quay Video 3 phút & Phản biện BGK).", "Vượt tiến độ:"),
          dash("Toàn bộ WebApp 5 phân hệ, Chrome Extension v2.0, 16/16 Endpoint HTTP 200 OK, Báo cáo khảo sát N = 10.920, Bản Thuyết minh Phụ lục III và Bộ Slide 12 trang (/slides) đã đồng bộ 100% dữ liệu và bảng màu truyền thống.", "Chất lượng nghiệm thu:"),
          p("", { spaceAfter: 60 }),

          makeTable(
            ["Chỉ số Theo dõi", "Kế hoạch Tổng thể", "Kết quả Thực tế (17/11/2026)", "Đánh giá"],
            [
              ["Tổng tiến độ theo trọng số", "100% (7 Giai đoạn)", "95% (Hoàn thành GĐ 1 – GĐ 6)", "ĐẠT & VƯỢT LỊCH"],
              ["Số đầu việc hoàn thành", "20 đầu việc (CV01 – CV20)", "17 / 20 đầu việc (CV01 – CV17)", "ĐẠT 85% SỐ ĐẦU VIỆC"],
              ["Phân hệ kỹ thuật cốt lõi", "6 phân hệ phần mềm", "6 / 6 phân hệ hoàn chỉnh", "HOÀN THÀNH 100%"],
              ["Kiểm định Endpoint & E2E", "16 đường dẫn + Luồng /r/:code", "16/16 HTTP 200 OK, 0 lỗi 404", "ĐẠT 100%"],
              ["Dữ liệu khảo sát thực địa", "B2B + B2C (N >= 10.000)", "N = 10.920 (94% đồng thuận)", "ĐẠT 100%"],
              ["Hạn chót nộp Sở GD&ĐT", "02/12/2026 (Mục tiêu 30/11)", "Còn 13 ngày dự phòng cho GĐ 7", "AN TOÀN TUYỆT ĐỐI"]
            ],
            [28, 24, 28, 20],
            3
          ),

          // MỤC 2
          h1("2. TIẾN ĐỘ THEO 7 GIAI ĐOẠN (BÁM SÁT FILE 02 MASTER PLAN)"),
          makeTable(
            ["Mã", "Tên Giai đoạn", "Thời gian", "Trọng số", "Sản phẩm Bàn giao Chính", "Trạng thái"],
            [
              ["GĐ 1", "Khởi tạo & Tách biệt Kiến trúc Độc lập", "12/11 – 13/11", "10%", "- Thư mục AutoBiz-AI độc lập\n- Giữ nguyên 100% dự án cũ", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 2", "Tái cấu trúc WebApp 5 Phân hệ & UI Tối giản", "13/11 – 15/11", "35%", "- Backend /r/:code, Catalog 5 ngành, Adapters 5 kênh\n- Giao diện tối giản, tách AUTOBIZ_SUPABASE_URL", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 3", "Khảo sát Thực nghiệm 2 Phía (N = 10.920)", "13/11 – 14/11", "20%", "- Mẫu B2B (N=5.240) & B2C (N=5.680)\n- Báo cáo Word + 6 Biểu đồ 300 DPI truyền thống", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 4", "Nâng cấp Chrome Extension & Seed Data", "15/11 – 18/11", "12%", "- Extension AutoBiz AI Collector v2.0\n- Script seed_demo_data.js (10 SP 5 ngành)", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 5", "Đóng gói, Kiểm định Production & E2E", "15/11 – 22/11", "10%", "- Script verify_build_and_e2e.js (16/16 HTTP 200)\n- Cache-busting & Responsive 4 khung hình", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 6", "Bản Thuyết minh Phụ lục III & Slide 12 trang", "23/11 – 26/11", "8%", "- File Word Thuyết minh chuẩn CV 11677\n- Pitch Deck 12 trang (/slides) nhúng biểu đồ", "ĐÃ HOÀN THÀNH (100%)"],
              ["GĐ 7", "Video 3 Phút (Phụ lục IV) & Nộp Hồ sơ", "27/11 – 30/11", "5%", "- Video MP4 FullHD 1080p (< 500MB)\n- Bộ 15 Q&A Phản biện BGK & Nộp Sở GD&ĐT", "CHƯA BẮT ĐẦU (0%)"]
            ],
            [8, 22, 13, 9, 32, 16],
            5
          ),

          // MỤC 3
          h1("3. BẢNG THEO DÕI CHI TIẾT 20 ĐẦU VIỆC (CV01 – CV20)"),
          makeTable(
            ["Mã", "GĐ", "Nội dung Công việc", "Phụ trách", "Đầu ra & Tiêu chí Nghiệm thu", "Trạng thái"],
            [
              ["CV01", "GĐ 1", "Khởi tạo workspace AutoBiz-AI độc lập", "Vương Gia", "AutoBiz-AI/, package.json, .env; cổng 3000", "100%"],
              ["CV02", "GĐ 2", "Backend Kho hàng 5 ngành & Động cơ Affiliate", "Vương Gia + Minh Khôi", "catalog.js, affiliate.js, route /r/:code", "100%"],
              ["CV03", "GĐ 2", "Universal Gemini AI Parser & Adapters 4 kênh", "Vương Gia + Quốc Khánh", "gemini.js, 5 adapter FB/TikTok/Zalo/Shopee/TG", "100%"],
              ["CV04", "GĐ 2", "Giao diện Utilitarian Minimalism (Bỏ Slide 0)", "Vương Gia + Quang Hưng", "index.html, style.css, autobiz.js (5 phân hệ)", "100%"],
              ["CV05", "GĐ 3", "Xử lý thống kê N=10.920 & vẽ 6 biểu đồ 300 DPI", "Hoàng Nam + Kim Hoa", "6 file PNG 300 DPI màu truyền thống", "100%"],
              ["CV06", "GĐ 3", "Xuất Báo cáo Phân tích Khảo sát Word", "Vương Gia + Hoàng Nam", "BAO_CAO_PHAN_TICH_KHAO_SAT_AUTOBIZ_AI.docx", "100%"],
              ["CV07", "GĐ 2", "Làm sạch dữ liệu test trên Web Local", "Vương Gia", "data/*.json = [] (UTF-8 không BOM), xóa 31MB cũ", "100%"],
              ["CV08", "GĐ 2", "Rà soát kiến trúc theo File 02 & tách DB Cloud", "Vương Gia (Lead)", "Tách AUTOBIZ_SUPABASE_URL, sửa /app & /r/:code", "100%"],
              ["CV09", "GĐ 4", "Nâng cấp Extension sang AutoBiz AI Collector v2.0", "Quốc Khánh + Trâm Anh", "manifest.json, popup.html, popup.js (5 ngành)", "100%"],
              ["CV10", "GĐ 4", "Kết nối Extension thẳng API WebApp & AI Studio", "Quốc Khánh + Minh Khôi", "background.js, web_bridge.js đồng bộ live", "100%"],
              ["CV11", "GĐ 4", "Công cụ nạp/xóa nhanh 10 sản phẩm mẫu", "Kim Hoa + Hoàng Duy", "scripts/seed_demo_data.js (--seed / --clear)", "100%"],
              ["CV12", "GĐ 5", "Chuẩn hóa Production & Cache-Control an toàn", "Vương Gia + Minh Khôi", "?v=20261115_prod, must-revalidate, đủ 15 tệp lõi", "100%"],
              ["CV13", "GĐ 5", "Kiểm định 16/16 Endpoint trả về HTTP 200 OK", "Vương Gia", "server.js, api/index.js, vercel.json (0 lỗi 404)", "100%"],
              ["CV14", "GĐ 5", "Nghiệm thu luồng E2E tự động (/r/:code -> 302)", "Trâm Anh + Quang Hưng", "scripts/verify_build_and_e2e.js đạt 100%", "100%"],
              ["CV15", "GĐ 5", "Responsive 4 khung hình & Calm Mobile", "Quang Hưng + Trâm Anh", "375px–1440px, bỏ màu xanh, tắt animation mobile", "100%"],
              ["CV16", "GĐ 6", "Bản Thuyết minh Dự án chuẩn Phụ lục III", "Vương Gia + Đội nòng cốt", "KE_HOACH_THIET_KE_VA_BAN_THUYET_MINH_AUTOBIZ_AI.docx", "100%"],
              ["CV17", "GĐ 6", "Bộ Slide Pitch Deck 12 trang chuẩn 16:9", "Bích Thảo + Vương Gia", "public/pitch-deck.html (/slides) nhúng 6 biểu đồ", "100%"],
              ["CV18", "GĐ 7", "Kịch bản & Video Giới thiệu 03 phút (Phụ lục IV)", "Bích Thảo + Hoàng Duy", "Storyboard 180s & Video MP4 FullHD (< 500MB)", "0% (Kế hoạch)"],
              ["CV19", "GĐ 7", "Bộ 15 Câu hỏi & Đáp án Phản biện BGK", "5 Thành viên chính thức", "Tài liệu Q&A 5 mảng (Pháp lý, AI, Tài chính, Bảo mật)", "0% (Kế hoạch)"],
              ["CV20", "GĐ 7", "Khóa sổ 100% File 02 & Nộp Hồ sơ Sở GD&ĐT", "Vương Gia + GV Hướng dẫn", "Nộp trọn bộ hồ sơ trước 20h00 ngày 30/11/2026", "0% (Kế hoạch)"]
            ],
            [8, 7, 27, 17, 29, 12],
            5
          ),

          // MỤC 4
          h1("4. KẾ HOẠCH HÀNH ĐỘNG GIAI ĐOẠN CUỐI (GĐ 7: CV18 – CV20)"),
          dash("Biên soạn Kịch bản phân cảnh chi tiết từng giây (00:00 – 03:00) theo Phụ lục IV: Mở đầu bằng số liệu khảo sát N = 10.920 (0:00–0:30); Demo trực tiếp 5 phân hệ WebApp & Extension v2.0 (0:30–2:00); Mô hình tài chính điểm hòa vốn tháng thứ 5 & cam kết tác động xã hội (2:00–3:00).", "CV18 (Video 3 phút):"),
          dash("Hoàn thiện Bộ 15 Câu hỏi & Đáp án phản biện BGK (tập trung vào cơ chế tính hoa hồng chống gian lận click, bảo mật OAuth 2.0, tối ưu chi phí AI Gemini Flash và khả năng mở rộng đa ngành).", "CV19 (Phản biện BGK):"),
          dash("Kiểm tra toàn bộ liên kết Production trên Vercel, xuất bản đủ bộ tài liệu DOCX/XLSX/PDF/MP4, khóa sổ File 02 lên 100% và nộp cổng Google Form Sở GD&ĐT trước 20h00 ngày 30/11/2026.", "CV20 (Nghiệm thu & Nộp hồ sơ):"),

          p("", { spaceAfter: 160 }),
          makeTable(
            ["NGƯỜI LẬP BÁO CÁO (TRƯỞNG NHÓM)", "XÁC NHẬN CỦA GIÁO VIÊN HƯỚNG DẪN"],
            [
              [
                "\n\n\nNguyễn Như Vương Gia\n(Ký và ghi rõ họ tên)",
                "\n\n\n....................................................\n(Ký, nhận xét và xác nhận tiến độ)"
              ]
            ],
            [50, 50]
          )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outLocal = path.join(__dirname, 'BAO_CAO_TIEN_DO_DU_AN_AUTOBIZ_AI.docx');
  const outDownloads = path.join('C:\\Users\\Admin\\Downloads', 'BAO_CAO_TIEN_DO_DU_AN_AUTOBIZ_AI.docx');

  fs.writeFileSync(outLocal, buffer);
  fs.writeFileSync(outDownloads, buffer);

  console.log('Generated Word Progress Report:', outLocal);
  console.log('Synced to Downloads:', outDownloads);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
