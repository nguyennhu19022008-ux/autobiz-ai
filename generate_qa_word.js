/**
 * generate_qa_word.js (CV19 - Giai đoạn 7)
 * Bộ 15 Câu hỏi & Đáp án Phản biện Hội đồng Giám khảo (Vòng Chung kết: 7–10 phút phản biện)
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

function p(text, options = {}) {
  const { bold = false, italic = false, size = 25, align = AlignmentType.LEFT, spaceAfter = 90, color = COLOR_INK } = options;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 310 },
    children: [new TextRun({ text, bold, italic, size, font: "Times New Roman", color })]
  });
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
    shading: isHeader ? { type: ShadingType.SOLID, color: COLOR_BG_HEADER } : undefined,
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

async function main() {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, right: 850, bottom: 900, left: 1000 } } },
      children: [
        p("TRƯỜNG THPT NGUYỄN DU (XÃ NGÃI GIAO) — ĐỘI THI AUTOBIZ AI (LV03)", { bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 40, color: COLOR_MUTED }),
        p("BỘ 15 CÂU HỎI & ĐÁP ÁN PHẢN BIỆN BAN GIÁM KHẢO", { bold: true, size: 34, align: AlignmentType.CENTER, spaceAfter: 60, color: COLOR_BURGUNDY }),
        p("Thành viên trả lời: Nguyễn Như Vương Gia (Kỹ thuật/AI) & Nguyễn Khang Thịnh (Thị trường/Tài chính) | GVHD: Thầy Đỗ Xuân Hưng", { italic: true, size: 23, align: AlignmentType.CENTER, spaceAfter: 180, color: COLOR_INK }),

        h1("NHÓM 1: SẢN PHẨM, ĐỐI THỦ & TÍNH THỰC TẾ (KHANG THỊNH CHỦ TRÌ)"),
        makeTable(
          ["Câu", "Câu hỏi Phản biện của Ban Giám khảo", "Trọng tâm Trả lời Chuẩn (Ngắn gọn — Trúng điểm)"],
          [
            ["01", "AutoBiz AI khác gì so với ChatGPT, Sapo hay KiotViet?", "- ChatGPT chỉ viết chữ rời; Sapo/KiotViet tập trung quản lý kho & hóa đơn tại quầy.\n- AutoBiz AI là chuỗi khép kín: Extension lấy sản phẩm & ảnh -> Gemini AI 4 kênh -> Đăng Fanpage -> Shortlink /r/:code -> Bảng tính hoa hồng CTV & thực thu.\n- Giá 199k/tháng giúp shop tiết kiệm ~80% so với mua ghép 3 công cụ rời (~1 triệu/tháng)."],
            ["02", "Các em mới học THPT, làm sao chứng minh sản phẩm dùng được thật ngoài đời?", "- Em Nguyễn Như Vương Gia đã triển khai chạy thực tế ngay trên Fanpage bán laptop của mình (Laptop Vương Gia, ID 1154184381110692).\n- Hệ thống đang chạy live trên Vercel, Extension Chrome v2.0 lấy được ảnh & tên sản phẩm trực tiếp từ Shopee, và đã đăng bài kèm ảnh thật qua Facebook Graph API."],
            ["03", "Vì sao chọn cả 2 đối tượng B2B (chủ shop) và B2C (CTV/sinh viên)?", "- Khảo sát thực địa N = 10.920 (5.240 shop B2B và 5.680 người mua/CTV B2C) cho thấy cả 2 bên đều cần nhau: shop nhỏ thiếu người bán, sinh viên muốn kiếm thêm nhưng không có vốn nhập hàng.\n- AutoBiz AI đóng vai trò cầu nối kỹ thuật và đối soát tiền minh bạch giữa 2 phía."],
            ["04", "Nếu shop chỉ bán trên Facebook & Shopee mà không dùng TikTok/Zalo thì sao?", "- Hệ thống có công tắc Bật/Tắt từng nền tảng trong mục Cài đặt.\n- Tắt TikTok/Zalo đi thì Studio tự ẩn các tab đó, AI không tốn quota sinh nội dung thừa."],
            ["05", "Làm sao cạnh tranh nếu đối thủ lớn sao chép tính năng?", "- Lợi thế đi đầu ở thị trường ngách: hộ kinh doanh siêu nhỏ ở địa phương (xã/huyện) và mạng lưới CTV học sinh, sinh viên với chi phí cực thấp (199k) nhờ hạ tầng Serverless."]
          ],
          [7, 33, 60]
        ),

        h1("NHÓM 2: KỸ THUẬT AI, BẢO MẬT & PHÁP LÝ (VƯƠNG GIA CHỦ TRÌ)"),
        makeTable(
          ["Câu", "Câu hỏi Phản biện của Ban Giám khảo", "Trọng tâm Trả lời Chuẩn"],
          [
            ["06", "Hệ thống dùng AI ở mức nào? Có phụ thuộc hoàn toàn vào AI không?", "- Gemini AI chỉ đóng vai trò trợ lý soạn thảo nội dung 4 kênh & đọc bảng giá theo prompt chuẩn của nhóm.\n- Toàn bộ lõi Extension, Catalog 5 ngành, Shortlink /r/:code, đo click 302, tính hoa hồng FinTech và Graph API đều do nhóm tự lập trình bằng Node.js."],
            ["07", "Nếu người dùng bấm vào link /r/:code nhiều lần liên tiếp để gian lận click thì sao?", "- Cơ chế tracking ghi nhận timestamp & sub_id từng lượt; hoa hồng trả cho CTV trên thực tế được đối soát dựa trên 'Đơn thực chốt' (+ Chốt đơn / đối soát sàn) chứ không trả tiền mù theo click ảo."],
            ["08", "Token Fanpage Facebook & API Key lưu thế nào để không bị lộ?", "- Trên Vercel Production, toàn bộ GEMINI_API_KEY và FB_PAGE_TOKEN được mã hóa trong Environment Variables.\n- File .env và settings.json được chặn tuyệt đối bởi .gitignore, không bao giờ đẩy lên GitHub công khai."],
            ["09", "Extension lấy ảnh từ Shopee/TikTok có vi phạm bản quyền hay khóa nick không?", "- AutoBiz AI chỉ hỗ trợ lấy ảnh sản phẩm để người bán/CTV tiếp thị lại đúng mặt hàng đó kèm link gốc về chính gian hàng trên sàn, và đăng bài qua Official Facebook Graph API v21.0 chứ không spam tự động bằng trình duyệt giả lập."],
            ["10", "Nếu hệ thống có 450+ CTV cùng lúc thì có bị chậm hoặc sập không?", "- Nhóm đã chạy thử nghiệm tải 452 CTV với 21.486 lượt click và 812 đơn (GMV > 3 tỷ đồng); thời gian tổng hợp báo cáo FinTech đo được chỉ mất 5 mili-giây.\n- Khi triển khai thương mại đại trà, chỉ cần gắn Supabase Postgres là chịu tải hàng nghìn CTV đồng thời."]
          ],
          [7, 33, 60]
        ),

        h1("NHÓM 3: TÀI CHÍNH, HÒA VỐN & TÁC ĐỘNG XÃ HỘI (KHANG THỊNH & VƯƠNG GIA)"),
        makeTable(
          ["Câu", "Câu hỏi Phản biện của Ban Giám khảo", "Trọng tâm Trả lời Chuẩn"],
          [
            ["11", "Con số 520 triệu doanh thu năm 1 và hòa vốn tháng thứ 5 tính như thế nào?", "- Chi phí năm đầu khoảng 220 triệu (Cloud Serverless 36tr, API Gemini 44tr, Vận hành 140tr) -> trung bình ~18,3 triệu/tháng.\n- Chỉ cần đạt mốc ~110 shop dùng gói Pro 199.000đ/tháng (~21,9 triệu/tháng) kết hợp phí chia sẻ Affiliate là vượt điểm hòa vốn vào tháng thứ 5."],
            ["12", "Chiến lược cụ thể để có được 110 shop đầu tiên là gì?", "- Áp dụng mô hình Freemium: miễn phí 30 ngày / 50 bài AI đầu tiên để các hộ kinh doanh tại xã Ngãi Giao và khu vực lân cận trải nghiệm ra đơn thật trên Fanpage/Zalo trước khi thu phí 199k/tháng."],
            ["13", "Tại sao biên lợi nhuận ròng lại cao (57,7% lên 64%)?", "- Vì phần mềm chạy trên kiến trúc Serverless (Vercel/Supabase), chi phí biên cho mỗi khách hàng mới tăng thêm rất thấp; không cần đội ngũ nhân viên cài đặt trực tiếp tại cửa hàng."],
            ["14", "Rủi ro lớn nhất của dự án là gì và cách kiểm soát?", "- Rủi ro phụ thuộc API nền tảng (Facebook thay đổi chính sách token, Gemini quá tải): nhóm đã xây dựng cơ chế fallback đa model Gemini và chế độ đóng gói sẵn nội dung để copy đăng tay khi API gián đoạn."],
            ["15", "Thông điệp & đóng góp thực chất của 2 học sinh THPT đối với cộng đồng?", "- Giúp hộ kinh doanh truyền thống tiếp cận AI và chuyển đổi số với chi phí bình dân, đồng thời mở ra mô hình học đi đôi với hành, giúp học sinh/sinh viên tạo thu nhập minh bạch không cần vốn."]
          ],
          [7, 33, 60]
        )
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outProject = path.join(__dirname, 'BO_15_CAU_HOI_PHAN_BIEN_BGK_AUTOBIZ_AI.docx');
  const outDesktop = path.join('C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'BO_15_CAU_HOI_PHAN_BIEN_BGK_AUTOBIZ_AI.docx');
  fs.writeFileSync(outProject, buffer);
  fs.writeFileSync(outDesktop, buffer);
  console.log('Generated Q&A Word Doc:', outDesktop, buffer.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
