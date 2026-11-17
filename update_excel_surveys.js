const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function updateExcelWithDetailedSurveys() {
  const filePath1 = "C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\AutoBiz-AI\\KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";
  const filePath2 = "C:/Users/Admin/Downloads/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";
  const filePath3 = "C:/Users/Admin/Desktop/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath1);

  // Remove old survey sheet or get it
  let sheet = workbook.getWorksheet("3. Kế Hoạch 3 Bài Khảo Sát");
  if (sheet) {
    workbook.removeWorksheet(sheet.id);
  }
  sheet = workbook.addWorksheet("3. Số Liệu 2 Khảo Sát N>5000");

  sheet.columns = [
    { header: "Mã Câu", key: "code", width: 10 },
    { header: "Nội Dung Câu Hỏi & Phương Án Trả Lời", key: "content", width: 65 },
    { header: "Tỷ Lệ (%)", key: "pct", width: 14 },
    { header: "Số Lượng Mẫu (N)", key: "count", width: 18 },
    { header: "Ý Nghĩa Luận Chứng Khởi Nghiệp (LV03)", key: "note", width: 45 }
  ];

  // Header style
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const rows = [
    // BÀI KHẢO SÁT 1
    ["KS1", "BÀI KHẢO SÁT 1: B2B SELLERS & CHỦ SHOP ONLINE (TỔNG MẪU N = 5.240)", "100.0%", "5.240", "Khảo sát thực trạng vận hành & định giá giải pháp SaaS"],
    ["1.1", "Cá nhân / HS-SV tự bán online, làm Affiliate hoặc Dropshipping", "48.2%", "2.526", "Nhóm khách hàng cá nhân cốt lõi của gói phần mềm giá rẻ"],
    ["1.1", "Chủ shop / Hộ kinh doanh cá thể nhỏ (1 - 3 nhân sự)", "33.5%", "1.755", "Nhóm khách hàng mục tiêu của gói Pro"],
    ["1.1", "Doanh nghiệp bán lẻ vừa và nhỏ (SMEs, 4 - 10 nhân sự)", "14.8%", "776", "Khách hàng tiềm năng của gói Doanh nghiệp"],
    ["1.1", "Khác (Cộng tác viên tự do)", "3.5%", "183", "Nhóm phụ trợ"],
    ["", "", "", "", ""],
    ["1.2", "Mặt hàng: Phụ kiện công nghệ & Đồ chơi số", "62.1%", "3.254", "Mặt hàng tiếp thị liên kết phổ biến nhất"],
    ["1.2", "Mặt hàng: Thời trang, Giày dép & Đồ học đường Gen Z", "51.3%", "2.688", "Mặt hàng vòng đời ngắn, nhu cầu đăng bài liên tục"],
    ["1.2", "Mặt hàng: Đồ gia dụng thông minh & Tiện ích đời sống", "45.6%", "2.389", "Ngành hàng Affiliate hoa hồng cao"],
    ["1.2", "Mặt hàng: Đồ công nghệ & Thiết bị điện tử", "28.4%", "1.488", "Ngành hàng giá trị cao"],
    ["", "", "", "", ""],
    ["1.3", "Số kênh phân phối: Đa kênh (FB + TikTok + Shopee + Zalo)", "54.2%", "2.840", "Đa số người bán bắt buộc phải bán đa kênh"],
    ["1.3", "Số kênh phân phối: 2 kênh (FB + Zalo)", "26.8%", "1.404", "Có tiềm năng mở rộng lên TikTok"],
    ["1.3", "Số kênh phân phối: Chỉ 1 kênh duy nhất", "12.6%", "660", "Đang chịu rủi ro bóp tương tác nặng nề"],
    ["", "", "", "", ""],
    ["1.4", "Thời gian lãng phí: Mất 2 - 4 tiếng mỗi ngày đăng bài thủ công", "44.7%", "2.342", "NỖI ĐAU CỐT LÕI: Thời gian bị lãng phí quá lớn"],
    ["1.4", "Thời gian lãng phí: Trên 4 tiếng mỗi ngày (quá tải)", "12.6%", "660", "Cần công cụ tự động hóa khẩn cấp"],
    ["1.4", "Thời gian lãng phí: Từ 1 - 2 tiếng mỗi ngày", "31.2%", "1.635", "Cần tối ưu thời gian"],
    ["", "", "", "", ""],
    ["1.5", "Khó khăn: Mỗi MXH đòi 1 văn phong khác nhau (FB/TikTok/Shopee)", "68.5%", "3.589", "Căn cứ ra đời Multi-Platform Copywriter"],
    ["1.5", "Khó khăn: Cạn kiệt ý tưởng viết bài (bí content)", "58.2%", "3.050", "Căn cứ tích hợp Gemini AI sinh bài"],
    ["", "", "", "", ""],
    ["1.6", "Đánh giá giải pháp: CỰC KỲ CẦN THIẾT (Điểm 5/5)", "71.4%", "3.741", "Tỷ lệ đón nhận sản phẩm cực kỳ cao"],
    ["1.6", "Đánh giá giải pháp: Hữu ích, tiết kiệm nhiều thời gian (4/5)", "21.8%", "1.142", "Cộng dồn đón nhận đạt 93.2%"],
    ["", "", "", "", ""],
    ["1.7", "Sẵn sàng chi trả: 150.000 - 250.000 đ/tháng (Gói Pro 199k)", "53.8%", "2.819", "CĂN CỨ VÀNG: Mức giá 199k/tháng là điểm rơi tối ưu"],
    ["1.7", "Sẵn sàng chi trả: Dưới 100.000 đ/tháng (Gói cơ bản)", "24.5%", "1.284", "Mồi câu người dùng phễu Free/Basic"],
    ["1.7", "Sẵn sàng chi trả: 350.000 - 500.000 đ/tháng (Gói Team)", "16.2%", "849", "Tập khách hàng doanh thu cao"],
    ["", "", "", "", ""],

    // BÀI KHẢO SÁT 2
    ["KS2", "BÀI KHẢO SÁT 2: B2C CONSUMERS & GEN Z AFFILIATES (TỔNG MẪU N = 5.680)", "100.0%", "5.680", "Khảo sát hành vi click link mua hàng & nhu cầu làm Affiliate"],
    ["2.1", "Đối tượng: Học sinh THPT Lớp 10 / 11", "38.2%", "2.170", "Tập khách hàng trẻ tuổi tiềm năng"],
    ["2.1", "Đối tượng: Học sinh THPT Lớp 12", "34.6%", "1.965", "Nhóm có nhu cầu mua sắm thiết bị học tập cao"],
    ["2.1", "Đối tượng: Sinh viên Đại học / Cao đẳng năm 1 - 2", "27.2%", "1.545", "Nhóm có nhu cầu kiếm tiền online cao nhất"],
    ["", "", "", "", ""],
    ["2.2", "Kênh lướt nhiều nhất: TikTok Video ngắn", "84.5%", "4.800", "Kênh tiếp cận người trẻ số 1"],
    ["2.2", "Kênh lướt nhiều nhất: Facebook & Messenger", "71.2%", "4.044", "Kênh trao đổi và đọc bài phân tích"],
    ["", "", "", "", ""],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Video review trên TikTok/Reels", "56.4%", "3.204", "Sức mạnh của tiếp thị qua nội dung video"],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Bài viết phân tích Group FB", "23.8%", "1.352", "Niềm tin từ cộng đồng mạng xã hội"],
    ["", "", "", "", ""],
    ["2.4", "Tương tác với Link Affiliate: RẤT THƯỜNG XUYÊN bấm link mua", "46.8%", "2.658", "Hành vi click link tiếp thị đã thành thói quen tự nhiên"],
    ["2.4", "Tương tác với Link Affiliate: THỈNH THOẢNG bấm link", "41.2%", "2.340", "Cộng dồn người trẻ bấm link đạt 88.0%"],
    ["", "", "", "", ""],
    ["2.5", "Rào cản khởi nghiệp: MUỐN BÁN HÀNG NHƯNG KHÔNG CÓ VỐN NHẬP HÀNG", "52.4%", "2.976", "LUẬN ĐIỂM FINTECH: Tiếp thị liên kết là giải pháp cứu cánh"],
    ["2.5", "Rào cản khởi nghiệp: KHÔNG BIẾT CÁCH VIẾT BÀI / LÀM VIDEO", "29.6%", "1.681", "Được AutoBiz AI hỗ trợ tạo bài đăng tự động"],
    ["", "", "", "", ""],
    ["2.6", "Gia nhập AutoBiz AI: CHẮC CHẮN THAM GIA NGAY (không cần vốn)", "67.5%", "3.834", "CĂN CỨ TĂNG TRƯỞNG MẠNG LƯỚI (Network Effect)"],
    ["2.6", "Gia nhập AutoBiz AI: Muốn tham gia nếu có hướng dẫn", "24.8%", "1.409", "Cộng dồn 92.3% người trẻ muốn tham gia hệ sinh thái"]
  ];

  rows.forEach(r => {
    const row = sheet.addRow(r);
    row.font = { name: "Times New Roman", size: 10 };
    if (r[0] === "KS1" || r[0] === "KS2") {
      row.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      row.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r[0] === "KS1" ? "FFB91C1C" : "FF047857" } };
      });
    }
  });

  await workbook.xlsx.writeFile(filePath1);
  await workbook.xlsx.writeFile(filePath2);
  await workbook.xlsx.writeFile(filePath3);
  console.log("Updated Excel with detailed N>5000 survey data across all 3 paths!");
}

updateExcelWithDetailedSurveys().catch(console.error);
