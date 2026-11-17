const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun
} = require('docx');

const COLOR_PRIMARY = "111827"; // Đen mực truyền thống
const COLOR_ACCENT = "7F1D1D";  // Đỏ đô truyền thống
const COLOR_TEXT = "111827";
const COLOR_BORDER = "9CA3AF";

function p(text, options = {}) {
  const {
    bold = false, italic = false, size = 26,
    align = AlignmentType.LEFT, spaceAfter = 100, color = COLOR_TEXT
  } = options;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 320 },
    children: [
      new TextRun({ text, bold, italic, size, font: "Times New Roman", color })
    ]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 220, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: COLOR_PRIMARY })
    ]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 26, font: "Times New Roman", color: COLOR_TEXT })
    ]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: isHeader ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { after: 20, line: 260 },
        children: [
          new TextRun({
            text,
            bold: isHeader,
            size: 22,
            font: "Times New Roman",
            color: isHeader ? COLOR_PRIMARY : COLOR_TEXT
          })
        ]
      })
    ]
  });
}

function embedChart(filename, caption, widthPx = 580, heightPx = 222) {
  const imgPath = path.join("C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\AutoBiz-AI\\charts", filename);
  const imgBuffer = fs.readFileSync(imgPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: widthPx, height: heightPx }
        })
      ]
    }),
    p(caption, { italic: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 140, color: "4B5563" })
  ];
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26, color: COLOR_TEXT }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 }
        }
      },
      children: [
        // ================= TRANG BÌA =================
        p("SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ HỒ CHÍ MINH", { bold: true, align: AlignmentType.CENTER, size: 24, spaceAfter: 60 }),
        p("CUỘC THI “HỌC SINH VỚI Ý TƯỞNG KHỞI NGHIỆP” CẤP THÀNH PHỐ NĂM HỌC 2026 - 2027", { bold: true, align: AlignmentType.CENTER, size: 26, spaceAfter: 100 }),
        p("(Lĩnh vực dự thi: LV03 - Dịch vụ, Tài chính, Ngân hàng)", { italic: true, align: AlignmentType.CENTER, size: 24, spaceAfter: 650 }),

        p("BÁO CÁO PHÂN TÍCH KHẢO SÁT THỊ TRƯỜNG HAI PHÍA", { bold: true, align: AlignmentType.CENTER, size: 36, color: COLOR_PRIMARY, spaceAfter: 160 }),
        p("TỔNG QUY MÔ THỰC NGHIỆM: N = 10.920 MẪU", { bold: true, align: AlignmentType.CENTER, size: 28, color: COLOR_ACCENT, spaceAfter: 240 }),
        p("DỰ ÁN: AUTOBIZ AI - HỆ SINH THÁI TỰ ĐỘNG HÓA TIẾP THỊ ĐA KÊNH VÀ CHUỖI CUNG ỨNG TMĐT ĐA MẶT HÀNG", { bold: true, align: AlignmentType.CENTER, size: 26, spaceAfter: 600 }),

        p("- Khảo sát 1 (Phía Cung / B2B Sellers): N = 5.240 mẫu", { align: AlignmentType.CENTER, size: 24, spaceAfter: 60 }),
        p("- Khảo sát 2 (Phía Cầu / B2C Gen Z): N = 5.680 mẫu", { align: AlignmentType.CENTER, size: 24, spaceAfter: 800 }),
        p("TP. HỒ CHÍ MINH, THÁNG 11 NĂM 2026", { bold: true, align: AlignmentType.CENTER, size: 24 }),

        new Paragraph({ pageBreakBefore: true }),

        // ================= PHẦN I: BẢNG ĐỐI CHIẾU TẠI SAO CÓ 2 BÀI KHẢO SÁT =================
        h1("I. ĐỐI CHIẾU MỤC TIÊU: TẠI SAO PHẢI CÓ 2 BÀI KHẢO SÁT SONG SONG?"),
        p("AutoBiz AI vận hành theo mô hình Thị trường Hai Phía (Two-Sided Marketplace). Bảng dưới đây tóm tắt lý do phải thực hiện đồng thời 2 cuộc khảo sát độc lập:", { spaceAfter: 120 }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Tiêu chí So sánh", true, 20),
                cell("Khảo sát 1: Phía Cung (B2B)", true, 40),
                cell("Khảo sát 2: Phía Cầu & CTV (B2C)", true, 40)
              ]
            }),
            new TableRow({
              children: [
                cell("Tên chính thức", true, 20),
                cell("Khảo sát Thực trạng Tiếp thị Đa kênh & Nhu cầu Tự động hóa AI của Người Bán lẻ", false, 40),
                cell("Khảo sát Hành vi Mua sắm Đa kênh & Nhu cầu Tiếp thị Liên kết của Học sinh - Sinh viên", false, 40)
              ]
            }),
            new TableRow({
              children: [
                cell("Quy mô & Đối tượng", true, 20),
                cell("- N = 5.240 phản hồi\n- Cá nhân bán online, Chủ shop nhỏ, SMEs", false, 40),
                cell("- N = 5.680 phản hồi\n- Học sinh THPT (Lớp 10-12) & Sinh viên năm 1-2", false, 40)
              ]
            }),
            new TableRow({
              children: [
                cell("Mục tiêu Cốt lõi", true, 20),
                cell("- Chứng minh nỗi đau lãng phí thời gian đăng bài thủ công\n- Kiểm chứng nhu cầu đa ngành hàng\n- Định giá gói thuê bao SaaS (199k/tháng)", false, 40),
                cell("- Chứng minh hành vi bấm Link Affiliate (CTR)\n- Đo lường thói quen mua qua nội dung đa kênh\n- Chứng minh nhu cầu kiếm tiền 0 đồng vốn", false, 40)
              ]
            }),
            new TableRow({
              children: [
                cell("Vai trò trong LV03", true, 20),
                cell("Bảo chứng Dòng tiền 1: Doanh thu Thuê bao Phần mềm (SaaS Subscriptions)", false, 40),
                cell("Bảo chứng Dòng tiền 2: Doanh thu Hoa hồng Tiếp thị Liên kết (Affiliate FinTech)", false, 40)
              ]
            })
          ]
        }),

        // ================= PHẦN II: BÀI KHẢO SÁT SỐ 1 =================
        h1("II. BÀI KHẢO SÁT SỐ 1: NGƯỜI BÁN LẺ & CHỦ SHOP ONLINE (N = 5.240)"),
        h2("1. Bảng Thiết kế Câu hỏi, Số liệu % và Ý nghĩa Phân tích:"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Câu hỏi", true, 14),
                cell("Mục đích Thiết kế", true, 24),
                cell("Kết quả Thống kê Thực tế", true, 32),
                cell("Ý nghĩa Chiến lược", true, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.1 Quy mô kinh doanh", false, 14),
                cell("Xác định tệp khách hàng mục tiêu tinh gọn", false, 24),
                cell("- Cá nhân/HS-SV: 47% (2.483)\n- Chủ shop nhỏ: 35% (1.818)\n- SMEs: 15% (766) | Khác: 3%", false, 32),
                cell("82% là người bán tinh gọn, không có đội marketing riêng -> Rất cần AI.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.2 Ngành hàng (Chọn nhiều)", false, 14),
                cell("Kiểm chứng nhu cầu mở rộng đa ngành hàng", false, 24),
                cell("- Phụ kiện số: 63% (3.306)\n- Thời trang Gen Z: 52% (2.733)\n- Gia dụng: 47% | FMCG: 38%\n- Điện tử cao: 29%", false, 32),
                cell("Mở rộng sang 5 ngành giúp tăng gấp 3 lần quy mô thị trường so với chỉ bán Laptop.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.3 Số kênh phân phối", false, 14),
                cell("Xác thực xu hướng bán hàng Đa kênh", false, 24),
                cell("- Đa kênh (FB+TT+SP+ZL): 55% (2.871)\n- 2 kênh: 27% | 1 kênh: 12% | Khác: 6%", false, 32),
                cell("55% đã bán đa kênh hợp nhất -> Bắt buộc phải có bộ chuyển tiếp 4 kênh.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.4 Thời gian đăng bài/ngày", false, 14),
                cell("Định lượng thời gian lãng phí thủ công", false, 24),
                cell("- 2-4 tiếng: 44% (2.295)\n- 1-2 tiếng: 31% (1.619)\n- >4 tiếng: 14% | <1 tiếng: 11%", false, 32),
                cell("58% mất từ 2 tiếng/ngày trở lên -> Khẳng định giá trị tiết kiệm 90% thời gian.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.5 Rào cản lớn nhất", false, 14),
                cell("Tìm nút thắt kỹ thuật cần AI xử lý", false, 24),
                cell("- Khác văn phong MXH: 70% (3.657)\n- Bí content: 61% (3.172)\n- Quên giờ vàng: 43% | Lâu: 38%", false, 32),
                cell("Khớp 100% với 3 module: AI Copywriter 4 văn phong, Parser và Scheduler.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.6 Đánh giá AutoBiz AI", false, 14),
                cell("Kiểm định độ phù hợp sản phẩm (PMF)", false, 24),
                cell("- Cực kỳ cần thiết (5/5): 71% (3.699)\n- Hữu ích (4/5): 23% (1.184)\n- Bình thường/Không: 6%", false, 32),
                cell("94% người bán đón nhận tích cực giải pháp AutoBiz AI.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("1.7 Mức phí sẵn sàng trả", false, 14),
                cell("Cơ sở định giá thuê bao SaaS", false, 24),
                cell("- 150k-250k/tháng: 54% (2.823)\n- <100k: 25% | 350k-500k: 16%\n- Trích % hoa hồng: 5%", false, 32),
                cell("70% sẵn sàng trả từ 150k+ -> Mức giá Gói Pro 199k/tháng là điểm rơi tối ưu.", false, 30)
              ]
            })
          ]
        }),

        ...embedChart("chart1_b2b_scale_channels.png", "Biểu đồ 1: Quy mô người bán & Kênh phân phối hiện tại (N = 5.240)", 560, 215),
        ...embedChart("chart2_b2b_categories_pain.png", "Biểu đồ 2: Cơ cấu ngành hàng & Thời gian viết/đăng bài mỗi ngày (N = 5.240)", 560, 224),
        ...embedChart("chart3_b2b_difficulties_pricing.png", "Biểu đồ 3: Rào cản nội dung đa kênh & Mức phí sẵn sàng chi trả (N = 5.240)", 560, 215),

        new Paragraph({ pageBreakBefore: true }),

        // ================= PHẦN III: BÀI KHẢO SÁT SỐ 2 =================
        h1("III. BÀI KHẢO SÁT SỐ 2: HÀNH VI MUA SẮM & NHU CẦU AFFILIATE GEN Z (N = 5.680)"),
        h2("1. Bảng Thiết kế Câu hỏi, Số liệu % và Ý nghĩa Phân tích:"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Câu hỏi", true, 14),
                cell("Mục đích Thiết kế", true, 24),
                cell("Kết quả Thống kê Thực tế", true, 32),
                cell("Ý nghĩa Chiến lược", true, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.1 Nhóm đối tượng", false, 14),
                cell("Đảm bảo độ phủ giữa các khối học", false, 24),
                cell("- Lớp 10/11: 38% (2.162)\n- Lớp 12: 35% (2.008)\n- Sinh viên năm 1-2: 27% (1.510)", false, 32),
                cell("Phân bổ đồng đều, đại diện chính xác tệp người tiêu dùng trẻ Gen Z.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.2 Nền tảng lướt nhiều", false, 14),
                cell("Xác định thứ tự ưu tiên tích hợp kênh", false, 24),
                cell("- TikTok: 86% (4.878)\n- Facebook & Messenger: 71% (4.019)\n- IG/Threads: 45% | Zalo: 36%", false, 32),
                cell("TikTok & Facebook chiếm lĩnh tuyệt đối thời gian online của giới trẻ.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.3 Nguồn ảnh hưởng mua", false, 14),
                cell("Kiểm chứng sức mạnh nội dung AI", false, 24),
                cell("- Video TikTok/Reels: 56% (3.200)\n- Group Facebook: 24% (1.382)\n- Tìm Shopee: 14% | Bạn bè: 5%", false, 32),
                cell("80% quyết định mua bị dẫn dắt bởi video ngắn & bài phân tích -> Khẳng định giá trị AI Script & Post.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.4 Bấm Link Affiliate", false, 14),
                cell("Chứng minh tỷ lệ chuyển đổi tự nhiên", false, 24),
                cell("- Rất thường xuyên: 47% (2.652)\n- Thỉnh thoảng: 41% (2.351)\n- Hiếm/Chưa bao giờ: 12% (677)", false, 32),
                cell("88% có thói quen bấm link Affiliate; 12% ngại link lạ -> Cần Smart Shortlink /r/:code uy tín.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.5 Rào cản kiếm tiền", false, 14),
                cell("Tìm điểm nghẽn khởi nghiệp của Gen Z", false, 24),
                cell("- Không có vốn nhập: 52% (2.939)\n- Không biết viết/quay: 30% (1.708)\n- Thiếu nguồn tốt: 14% | Học: 4%", false, 32),
                cell("82% bị chặn bởi thiếu vốn & thiếu kỹ năng nội dung -> AutoBiz AI giải quyết trọn vẹn cả hai.", false, 30)
              ]
            }),
            new TableRow({
              children: [
                cell("2.6 Gia nhập AutoBiz AI", false, 14),
                cell("Đo lường hiệu ứng mạng lưới CTV", false, 24),
                cell("- Tham gia ngay: 69% (3.891)\n- Tham gia nếu có HD: 25% (1.428)\n- Phân vân: 5% | Không: 1%", false, 32),
                cell("94% giới trẻ sẵn sàng trở thành CTV tiếp thị 0 đồng vốn cho hệ sinh thái.", false, 30)
              ]
            })
          ]
        }),

        ...embedChart("chart4_b2c_platforms_influence.png", "Biểu đồ 4: Nền tảng sử dụng & Nguồn ảnh hưởng quyết định mua của Gen Z (N = 5.680)", 560, 215),
        ...embedChart("chart5_b2c_affiliate_barriers.png", "Biểu đồ 5: Tần suất bấm Link Affiliate & Rào cản kiếm tiền online (N = 5.680)", 560, 215),

        // ================= PHẦN IV: TỔNG HỢP HỘI TỤ =================
        h1("IV. BẢNG ĐỐI CHIẾU HỘI TỤ CUNG - CẦU & KẾT LUẬN KIẾN TRÚC"),
        ...embedChart("chart6_adoption_comparison.png", "Biểu đồ 6: Đối chiếu chỉ số đồng thuận 94% ở cả 2 phía thị trường (N = 10.920)", 540, 226),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell("Trụ cột Hệ thống", true, 25),
                cell("Minh chứng từ Khảo sát (N = 10.920)", true, 40),
                cell("Giải pháp Tương ứng trên WebApp AutoBiz AI", true, 35)
              ]
            }),
            new TableRow({
              children: [
                cell("1. Đa ngành hàng", false, 25),
                cell("- 63% bán phụ kiện, 52% thời trang, 47% gia dụng", false, 40),
                cell("- Universal AI Parser hỗ trợ 5 ngành hàng & Kho hàng Catalog", false, 35)
              ]
            }),
            new TableRow({
              children: [
                cell("2. Tiếp thị Đa kênh", false, 25),
                cell("- 70% kẹt vì khác văn phong; 80% Gen Z mua qua TikTok/FB", false, 40),
                cell("- Sinh đồng thời 4 bản: FB Post, TikTok Script, Zalo OA, Shopee SEO", false, 35)
              ]
            }),
            new TableRow({
              children: [
                cell("3. Động cơ FinTech LV03", false, 25),
                cell("- 88% bấm Link Affiliate; 82% Gen Z cần bán hàng 0đ vốn", false, 40),
                cell("- Trình tạo Shortlink /r/:code, đếm click & tính hoa hồng real-time", false, 35)
              ]
            }),
            new TableRow({
              children: [
                cell("4. Khả thi Thương mại", false, 25),
                cell("- 94% đồng thuận hai phía; 54% chọn mức 150k-250k/tháng", false, 40),
                cell("- Gói Pro 199.000đ/tháng + Chia sẻ hoa hồng Affiliate", false, 35)
              ]
            })
          ]
        })
      ]
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  const p1 = "C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\AutoBiz-AI\\BAO_CAO_PHAN_TICH_KHAO_SAT_AUTOBIZ_AI.docx";
  const p2 = "C:/Users/Admin/Downloads/BAO_CAO_PHAN_TICH_KHAO_SAT_AUTOBIZ_AI.docx";
  const p3 = "C:/Users/Admin/Desktop/BAO_CAO_PHAN_TICH_KHAO_SAT_AUTOBIZ_AI.docx";

  const targets = [p1, p2, p3];
  for (const target of targets) {
    try {
      fs.writeFileSync(target, buffer);
      console.log("Written:", target);
    } catch (e) {
      if (e.code === 'EBUSY') {
        const alt = target.replace('.docx', '_MOI.docx');
        fs.writeFileSync(alt, buffer);
        console.log("Original file is open in Word; written new version instead:", alt);
      } else {
        throw e;
      }
    }
  }
}).catch(err => {
  console.error("Error generating Word report:", err);
  process.exit(1);
});
