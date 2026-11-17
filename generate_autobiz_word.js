/**
 * generate_autobiz_word.js (CV16 - Giai đoạn 6)
 * Xuất Bản Thuyết minh Dự án Khởi nghiệp chuẩn Phụ lục III Công văn 11677/KH-SGDĐT
 * - Font: Times New Roman
 * - Bảng màu truyền thống: Đen mực (#111827), Đỏ đô (#7F1D1D), Xám trung tính (#F3F4F6) - Tuyệt đối không dùng màu xanh
 * - Trình bày: Ngắn gọn, súc tích, dùng dấu gạch ngang (-) và bảng so sánh, nhúng biểu đồ khảo sát N = 10.920
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun
} = require('docx');

const COLOR_INK = "111827";      // Đen mực truyền thống
const COLOR_BURGUNDY = "7F1D1D"; // Đỏ đô truyền thống
const COLOR_MUTED = "4B5563";    // Xám trung tính
const COLOR_BORDER = "9CA3AF";   // Viền bảng xám chuẩn
const COLOR_BG_HEADER = "F3F4F6";// Nền tiêu đề bảng xám sáng

function p(text, options = {}) {
  const {
    bold = false, italic = false, size = 25, // 12.5pt
    align = AlignmentType.LEFT, spaceAfter = 100, color = COLOR_INK
  } = options;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 320 },
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
    spacing: { after: 80, line: 310 },
    indent: { left: 240 },
    children
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: COLOR_BURGUNDY, space: 4, style: BorderStyle.SINGLE, size: 8 }
    },
    children: [
      new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_BURGUNDY })
    ]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 90 },
    children: [
      new TextRun({ text, bold: true, size: 26, font: "Times New Roman", color: COLOR_INK })
    ]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT) {
  const lines = String(text).split('\n');
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: isHeader ? { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: lines.map((line, idx) => new Paragraph({
      alignment: align,
      spacing: { after: idx < lines.length - 1 ? 40 : 10, line: 260 },
      children: [
        new TextRun({
          text: line,
          bold: isHeader,
          size: 22, // 11pt
          font: "Times New Roman",
          color: COLOR_INK
        })
      ]
    }))
  });
}

function embedChart(filename, caption, widthPx = 540, heightPx = 210) {
  const imgPath = path.join(__dirname, "charts", filename);
  if (!fs.existsSync(imgPath)) return [];
  const imgBuffer = fs.readFileSync(imgPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 40 },
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: widthPx, height: heightPx }
        })
      ]
    }),
    p(caption, { italic: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 120, color: COLOR_MUTED })
  ];
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 25, color: COLOR_INK }
      }
    }
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } }
      },
      children: [
        // TRANG BÌA
        p("SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ HỒ CHÍ MINH", { bold: true, align: AlignmentType.CENTER, size: 24, spaceAfter: 60 }),
        p("CUỘC THI “HỌC SINH VỚI Ý TƯỞNG KHỞI NGHIỆP” CẤP THÀNH PHỐ NĂM HỌC 2026 - 2027", { bold: true, align: AlignmentType.CENTER, size: 26, spaceAfter: 90 }),
        p("(Theo Kế hoạch số 11677/KH-SGDĐT ngày 30 tháng 10 năm 2026 - Phụ lục III)", { italic: true, align: AlignmentType.CENTER, size: 22, spaceAfter: 500 }),

        p("BẢN THUYẾT MINH Ý TƯỞNG / DỰ ÁN KHỞI NGHIỆP", { bold: true, align: AlignmentType.CENTER, size: 34, color: COLOR_INK, spaceAfter: 160 }),
        p("AUTOBIZ AI", { bold: true, align: AlignmentType.CENTER, size: 42, color: COLOR_BURGUNDY, spaceAfter: 120 }),
        p("HỆ SINH THÁI TỰ ĐỘNG HÓA TIẾP THỊ ĐA KÊNH VÀ CHUỖI CUNG ỨNG THƯƠNG MẠI ĐIỆN TỬ ĐA MẶT HÀNG", { bold: true, align: AlignmentType.CENTER, size: 26, spaceAfter: 450 }),
        p("LĨNH VỰC DỰ THI: LV03 - DỊCH VỤ, TÀI CHÍNH, NGÂN HÀNG", { bold: true, align: AlignmentType.CENTER, size: 25, color: COLOR_BURGUNDY, spaceAfter: 500 }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Thông tin Hồ sơ", true, 30),
                cell("Nội dung Đăng ký Chính thức", true, 70)
              ]
            }),
            new TableRow({
              children: [
                cell("Đơn vị dự thi", false, 30),
                cell("Khối Trung học Phổ thông - TP. Hồ Chí Minh", false, 70)
              ]
            }),
            new TableRow({
              children: [
                cell("Trưởng nhóm dự án", false, 30),
                cell("Nguyễn Như Vương Gia - Phụ trách Kiến trúc Hệ thống & AI Engine", false, 70)
              ]
            }),
            new TableRow({
              children: [
                cell("Quy mô khảo sát thực chứng", false, 30),
                cell("N = 10.920 mẫu thực tế (B2B Sellers: N = 5.240 | B2C Gen Z: N = 5.680)", false, 70)
              ]
            }),
            new TableRow({
              children: [
                cell("Thời gian hoàn thiện", false, 30),
                cell("Tháng 11/2026 - Nghiệm thu tổng thể: 30/11/2026", false, 70)
              ]
            })
          ]
        }),

        p("", { spaceAfter: 450 }),
        p("TP. HỒ CHÍ MINH, THÁNG 11 NĂM 2026", { bold: true, align: AlignmentType.CENTER, size: 24 }),

        new Paragraph({ pageBreakBefore: true }),

        // PHẦN I
        h1("I. THÔNG TIN CHUNG VỀ DỰ ÁN VÀ NHÓM TÁC GIẢ"),
        dash("AutoBiz AI - Hệ sinh thái tự động hóa tiếp thị đa kênh và chuỗi cung ứng thương mại điện tử đa mặt hàng.", "1. Tên dự án:"),
        dash("LV03 - Dịch vụ, tài chính, ngân hàng (Ứng dụng FinTech & MarTech tự động hóa luồng hoa hồng tiếp thị liên kết, rút gọn link định danh và kết nối chuỗi cung ứng đa ngành).", "2. Lĩnh vực dự thi:"),
        dash("Danh sách 05 thành viên nòng cốt đại diện dự thi theo đúng quy chế:", "3. Nhóm tác giả:"),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("TT", true, 8, AlignmentType.CENTER),
                cell("Họ và tên", true, 26),
                cell("Vai trò Chuyên môn", true, 28),
                cell("Hạng mục Phụ trách Chính", true, 38)
              ]
            }),
            new TableRow({
              children: [
                cell("01", false, 8, AlignmentType.CENTER),
                cell("Nguyễn Như Vương Gia", false, 26),
                cell("Trưởng nhóm - Kiến trúc sư Phần mềm", false, 28),
                cell("- Kiến trúc 5 phân hệ WebApp, thuật toán Gemini AI Parser, Shortlink Engine /r/:code", false, 38)
              ]
            }),
            new TableRow({
              children: [
                cell("02", false, 8, AlignmentType.CENTER),
                cell("Nguyễn Quốc Khánh", false, 26),
                cell("Kỹ sư Backend & Extension", false, 28),
                cell("- Bộ chuyển tiếp 5 kênh (FB, TikTok, Zalo, Shopee, Telegram) & Chrome Extension v2.0", false, 38)
              ]
            }),
            new TableRow({
              children: [
                cell("03", false, 8, AlignmentType.CENTER),
                cell("Trần Kim Hoa", false, 26),
                cell("Giám đốc Dữ liệu & Khảo sát", false, 28),
                cell("- Chủ trì 2 chương trình khảo sát thực nghiệm (N = 10.920) & Kho hàng 5 ngành", false, 38)
              ]
            }),
            new TableRow({
              children: [
                cell("04", false, 8, AlignmentType.CENTER),
                cell("Lê Hoàng Nam", false, 26),
                cell("Chuyên viên Phân tích Tài chính", false, 28),
                cell("- Định giá thuê bao SaaS (199k/tháng), bài toán hoa hồng Affiliate & dòng tiền 3 năm", false, 38)
              ]
            }),
            new TableRow({
              children: [
                cell("05", false, 8, AlignmentType.CENTER),
                cell("Phạm Minh Triết", false, 26),
                cell("Chuyên viên Pháp chế & Đạo đức AI", false, 28),
                cell("- Bản quyền sở hữu trí tuệ, bảo mật dữ liệu OAuth 2.0 & Kê khai AI có trách nhiệm", false, 38)
              ]
            })
          ]
        }),

        // PHẦN II
        h1("II. TÓM TẮT Ý TƯỞNG VÀ ĐỐI CHIẾU GIÁ TRỊ CỐT LÕI"),
        dash("Xây dựng nền tảng SaaS kết hợp Chrome Extension v2.0 ứng dụng Gemini AI giúp tự động bóc tách sản phẩm đa ngành hàng, sinh đồng thời 4 bản nội dung tiếp thị (Facebook, TikTok, Zalo, Shopee) và tạo Shortlink Affiliate (/r/:code) đo lường hoa hồng thời gian thực.", "Ý tưởng cốt lõi:"),
        dash("Giải phóng 90% thời gian đăng bài thủ công cho chủ shop nhỏ và trao công cụ khởi nghiệp 0 đồng vốn cho học sinh - sinh viên.", "Giá trị đột phá:"),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Tiêu chí Đối chiếu", true, 22),
                cell("Phương thức Cũ / Thủ công", true, 39),
                cell("Hệ sinh thái Mới (AutoBiz AI)", true, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Phạm vi ngành hàng", false, 22),
                cell("- Bị giới hạn ở 1 ngành đơn lẻ (như Laptop cũ)", false, 39),
                cell("- Đa ngành hàng (5 nhóm: Phụ kiện số, Thời trang Gen Z, Gia dụng, FMCG, Điện tử)", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Kênh phân phối", false, 22),
                cell("- Đơn kênh, phải copy-paste và sửa văn phong bằng tay", false, 39),
                cell("- Đa kênh hợp nhất: Sinh tự động 4 văn phong chuẩn Facebook, TikTok, Zalo, Shopee", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Mô hình dòng tiền (LV03)", false, 22),
                cell("- Phải bỏ vốn nhập hàng, rủi ro tồn kho cao", false, 39),
                cell("- Affiliate FinTech & Dropship: Tạo link rút gọn /r/:code đếm click & tính hoa hồng tự động", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Giao diện & Công cụ", false, 22),
                cell("- Rườm rà, nhập liệu thủ công rời rạc", false, 39),
                cell("- Giao diện Utilitarian Minimalism + AutoBiz Collector Extension v2.0 thu thập 1 chạm", false, 39)
              ]
            })
          ]
        }),

        new Paragraph({ pageBreakBefore: true }),

        // PHẦN III: BUSINESS MODEL CANVAS & KIẾN TRÚC 6 CẤU PHẦN
        h1("III. MÔ HÌNH KINH DOANH (CANVAS) & KIẾN TRÚC HỆ THỐNG"),
        h2("1. Khung Mô hình Kinh doanh (Business Model Canvas):"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Trụ cột Canvas", true, 28),
                cell("Nội dung Xác lập trong Dự án AutoBiz AI", true, 72)
              ]
            }),
            new TableRow({
              children: [
                cell("1. Phân khúc khách hàng", false, 28),
                cell("- Phía Cung (B2B): Chủ shop nhỏ (1-3 nhân sự), SMEs và người bán cá nhân cần tự động hóa tiếp thị.\n- Phía Cầu/CTV (B2C): Học sinh THPT, Sinh viên làm Affiliate/Dropshipping khởi nghiệp 0 đồng vốn.", false, 72)
              ]
            }),
            new TableRow({
              children: [
                cell("2. Đề xuất giá trị", false, 28),
                cell("- Rút ngắn thời gian làm nội dung 4 kênh từ 2-4 tiếng/ngày xuống còn 30 giây/sản phẩm.\n- Tích hợp sẵn kho hàng đa ngành và trình rút gọn link /r/:code theo dõi hoa hồng minh bạch.", false, 72)
              ]
            }),
            new TableRow({
              children: [
                cell("3. Kênh tiếp cận & Quan hệ", false, 28),
                cell("- Triển khai qua nền tảng WebApp SaaS trực tuyến và tiện ích Chrome Extension v2.0.\n- Mô hình tự phục vụ (Self-service) kết hợp cộng đồng khởi nghiệp học đường tại TP.HCM.", false, 72)
              ]
            }),
            new TableRow({
              children: [
                cell("4. Dòng doanh thu (LV03)", false, 28),
                cell("- Dòng 1 (SaaS): Gói Basic (Miễn phí/99k), Gói Pro (199.000đ/tháng), Gói Team/SME (499.000đ/tháng).\n- Dòng 2 (FinTech Affiliate): Phí chia sẻ hoa hồng qua hệ thống Smart Shortlink & phí kết nối API kho sỉ.", false, 72)
              ]
            }),
            new TableRow({
              children: [
                cell("5. Nguồn lực, Hoạt động & Đối tác", false, 28),
                cell("- Nguồn lực: Mã nguồn 5 phân hệ + Extension v2.0, thuật toán Gemini AI Parser, dữ liệu N = 10.920 mẫu.\n- Đối tác kỹ thuật: Google Gemini API, Meta Graph API, TikTok, Zalo OA, Shopee, Vercel & Supabase.\n- Cơ cấu chi phí: Hạ tầng Cloud (15%), API AI (20%), R&D & Bảo mật (15%), Phát triển cộng đồng (20%).", false, 72)
              ]
            })
          ]
        }),

        h2("2. Đặc tả 6 Cấu phần Kỹ thuật Đã Hoàn thiện của AutoBiz AI:"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Cấu phần Kỹ thuật", true, 26),
                cell("Luồng Hoạt động & Đầu ra Nghiệp vụ Thực tế", true, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("1. Dashboard & Analytics FinTech", false, 26),
                cell("- Thống kê trực quan theo thời gian thực: Tổng sản phẩm, Bài đã lên lịch, Tổng lượt Click Link Affiliate và Doanh thu hoa hồng ước tính (VNĐ).", false, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("2. Omni-Channel AI Studio", false, 26),
                cell("- Nhận mô tả thô hoặc sản phẩm từ Kho hàng -> Gemini AI tự động sinh 4 bản nội dung chuyên biệt: Facebook Post, TikTok Video Script, Zalo OA Broadcast, Shopee SEO.", false, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("3. Kho Hàng Đa Ngành (Catalog)", false, 26),
                cell("- Quản lý danh mục hàng hóa thuộc 5 ngành (Công nghệ, Phụ kiện số, Gia dụng, Thời trang Gen Z, FMCG) kèm giá bán lẻ và % chiết khấu hoa hồng.", false, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("4. Động cơ Shortlink (/r/:code)", false, 26),
                cell("- Rút gọn link gốc thành /r/:shortCode gắn tham số UTM tự động, trả về HTTP 302 Redirect và cộng dồn lượt click + hoa hồng thời gian thực.", false, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("5. Bộ Chuyển tiếp Đa kênh & Lịch", false, 26),
                cell("- Quản lý hàng đợi xuất bản bất đồng bộ (Async Queue) và phân phối bài đăng qua 5 Adapter: Facebook, TikTok, Zalo, Shopee, Telegram.", false, 74)
              ]
            }),
            new TableRow({
              children: [
                cell("6. Chrome Extension v2.0", false, 26),
                cell("- Tiện ích trình duyệt AutoBiz AI Collector v2.0 giúp lấy thông tin sản phẩm từ Tab hiện tại, lưu vào Kho hàng và tạo Shortlink + 4 bản nội dung chỉ với 1 chạm.", false, 74)
              ]
            })
          ]
        }),

        new Paragraph({ pageBreakBefore: true }),

        // PHẦN IV: MINH CHỨNG KHẢO SÁT N = 10.920
        h1("IV. KẾT QUẢ KHẢO SÁT THỰC NGHIỆM THỊ TRƯỜNG HAI PHÍA (N = 10.920)"),
        p("Nhóm đã thực hiện 2 cuộc khảo sát độc lập với tổng quy mô N = 10.920 mẫu thực tế nhằm bảo chứng cả Phía Cung (Người bán trả phí SaaS) và Phía Cầu (Gen Z mua hàng & làm CTV Affiliate):"),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Hạng mục Khảo sát", true, 22),
                cell("Khảo sát 1: Phía Cung / B2B (N = 5.240)", true, 39),
                cell("Khảo sát 2: Phía Cầu / B2C (N = 5.680)", true, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Đối tượng khảo sát", false, 22),
                cell("- Cá nhân/HS-SV bán hàng: 47% (2.483)\n- Chủ shop nhỏ (1-3 người): 35% (1.818)\n- Doanh nghiệp SMEs: 15% (766) | Khác: 3%", false, 39),
                cell("- Học sinh THPT Lớp 10-11: 38% (2.162)\n- Học sinh THPT Lớp 12: 35% (2.008)\n- Sinh viên ĐH/CĐ năm 1-2: 27% (1.510)", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Thực trạng đa kênh & ngành hàng", false, 22),
                cell("- 55% (2.871) đang bán đa kênh hợp nhất\n- Ngành hàng: Phụ kiện số (63%), Thời trang Gen Z (52%), Gia dụng (47%), FMCG (38%), Điện tử (29%)", false, 39),
                cell("- Nền tảng dùng nhiều nhất: TikTok (86%), Facebook (71%), IG/Threads (45%), Zalo (36%)\n- 80% mua hàng do ảnh hưởng từ TikTok/Reels (56%) & Group FB (24%)", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Nỗi đau & Hành vi Affiliate", false, 22),
                cell("- 58% tốn từ 2 tiếng/ngày trở lên đăng bài thủ công\n- 70% gặp khó khăn vì mỗi MXH đòi 1 văn phong khác nhau; 61% bí ý tưởng viết bài", false, 39),
                cell("- 88% có thói quen bấm Link Affiliate mua sắm (47% rất thường xuyên + 41% thỉnh thoảng)\n- 82% kẹt khởi nghiệp vì thiếu vốn nhập hàng (52%) & không biết viết/quay (30%)", false, 39)
              ]
            }),
            new TableRow({
              children: [
                cell("Mức độ Đón nhận & Sẵn sàng Chi trả", false, 22),
                cell("- 94% đánh giá tích cực (71% cực kỳ cần thiết + 23% hữu ích)\n- 54% (2.823) sẵn sàng trả 150k-250k/tháng -> Định giá Gói Pro 199.000đ/tháng", false, 39),
                cell("- 94% sẵn sàng tham gia mạng lưới AutoBiz AI không cần vốn (69% tham gia ngay + 25% tham gia khi có hướng dẫn)", false, 39)
              ]
            })
          ]
        }),

        ...embedChart("chart3_b2b_difficulties_pricing.png", "Hình 1: Rào cản sáng tạo nội dung đa kênh & Mức phí thuê bao sẵn sàng chi trả của Người bán (N = 5.240)", 540, 208),
        ...embedChart("chart6_adoption_comparison.png", "Hình 2: Chỉ số hội tụ Cung - Cầu đạt 94% đồng thuận trên tổng quy mô N = 10.920 mẫu", 540, 220),

        new Paragraph({ pageBreakBefore: true }),

        // PHẦN V: TÀI CHÍNH, SỞ HỮU TRÍ TUỆ & LỘ TRÌNH
        h1("V. DỰ PHÓNG TÀI CHÍNH 3 NĂM, SỞ HỮU TRÍ TUỆ & CAM KẾT"),
        h2("1. Bảng Dự phóng Hiệu quả Tài chính 3 Năm (2027 - 2029):"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Chỉ tiêu Tài chính", true, 34),
                cell("Năm 1 (2027)", true, 22, AlignmentType.RIGHT),
                cell("Năm 2 (2028)", true, 22, AlignmentType.RIGHT),
                cell("Năm 3 (2029)", true, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("Số người dùng trả phí (Active Paid)", false, 34),
                cell("250 Users", false, 22, AlignmentType.RIGHT),
                cell("1.100 Users", false, 22, AlignmentType.RIGHT),
                cell("3.800 Users", false, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("Doanh thu Thuê bao SaaS (Gói Pro/Team)", false, 34),
                cell("420.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("1.820.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("6.350.000.000 VNĐ", false, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("Doanh thu Hoa hồng Affiliate & API Kho", false, 34),
                cell("100.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("600.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("2.680.000.000 VNĐ", false, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("TỔNG DOANH THU THUẦN", true, 34),
                cell("520.000.000 VNĐ", true, 22, AlignmentType.RIGHT),
                cell("2.420.000.000 VNĐ", true, 22, AlignmentType.RIGHT),
                cell("9.030.000.000 VNĐ", true, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("Tổng Chi phí Vận hành, Hạ tầng & R&D", false, 34),
                cell("220.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("980.000.000 VNĐ", false, 22, AlignmentType.RIGHT),
                cell("3.250.000.000 VNĐ", false, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("LỢI NHUẬN TRƯỚC THUẾ (EBT)", true, 34),
                cell("300.000.000 VNĐ", true, 22, AlignmentType.RIGHT),
                cell("1.440.000.000 VNĐ", true, 22, AlignmentType.RIGHT),
                cell("5.780.000.000 VNĐ", true, 22, AlignmentType.RIGHT)
              ]
            }),
            new TableRow({
              children: [
                cell("Biên lợi nhuận ròng (Net Margin)", false, 34),
                cell("57,7% (Hòa vốn Tháng 5)", false, 22, AlignmentType.RIGHT),
                cell("59,5%", false, 22, AlignmentType.RIGHT),
                cell("64,0%", false, 22, AlignmentType.RIGHT)
              ]
            })
          ]
        }),

        h2("2. Quyền Sở hữu Trí tuệ & Kê khai Sử dụng AI Có Trách nhiệm:"),
        dash("Toàn bộ kiến trúc phần mềm 5 phân hệ, Chrome Extension v2.0, bộ dữ liệu khảo sát và tài liệu thuyết minh do nhóm học sinh trực tiếp xây dựng dưới sự chủ trì của Trưởng nhóm Vương Gia.", "Tính nguyên bản & Bản quyền:"),
        dash("Hệ thống tích hợp mô hình Google Gemini thông qua API chính thức để bóc tách thông số hàng hóa và tạo bản nháp nội dung tiếp thị; tuyệt đối có bước kiểm duyệt của người dùng trước khi xuất bản.", "Kê khai ứng dụng AI trong sản phẩm:"),
        dash("Tuân thủ nghiêm ngặt quy định đạo đức AI và bảo mật thông tin người dùng; không tạo nội dung vi phạm pháp luật hoặc hàng hóa cấm lưu hành.", "Cam kết đạo đức & Pháp lý:"),

        p("", { spaceAfter: 250 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("XÁC NHẬN CỦA GIÁO VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)\n\n\n\n", false, 50, AlignmentType.CENTER),
                cell("ĐẠI DIỆN TRƯỞNG NHÓM TÁC GIẢ\n(Ký và ghi rõ họ tên)\n\n\n\nNGUYỄN NHƯ VƯƠNG GIA", false, 50, AlignmentType.CENTER)
              ]
            })
          ]
        })
      ]
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  const p1 = path.join(__dirname, "KE_HOACH_THIET_KE_VA_BAN_THUYET_MINH_AUTOBIZ_AI.docx");
  const p2 = "C:/Users/Admin/Downloads/KE_HOACH_THIET_KE_VA_BAN_THUYET_MINH_AUTOBIZ_AI.docx";
  fs.writeFileSync(p1, buffer);
  try { fs.writeFileSync(p2, buffer); } catch (e) {}
  console.log("Updated Proposal Word Document:", p1);
}).catch(err => {
  console.error("Error creating docx:", err);
  process.exit(1);
});
