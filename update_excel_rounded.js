const fs = require('fs');
const ExcelJS = require('exceljs');

async function updateExcelRounded() {
  const filePath1 = "C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\AutoBiz-AI\\KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";
  const filePath2 = "C:/Users/Admin/Downloads/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";
  const filePath3 = "C:/Users/Admin/Desktop/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx";

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath1);

  let sheet = workbook.getWorksheet("3. Số Liệu 2 Khảo Sát N>5000");
  if (!sheet) {
    sheet = workbook.addWorksheet("3. Số Liệu 2 Khảo Sát N>5000");
  } else {
    workbook.removeWorksheet(sheet.id);
    sheet = workbook.addWorksheet("3. Số Liệu 2 Khảo Sát N>5000");
  }

  sheet.columns = [
    { header: "Mã Câu", key: "code", width: 10 },
    { header: "Nội Dung Câu Hỏi & Phương Án Trả Lời", key: "content", width: 65 },
    { header: "Tỷ Lệ (%)", key: "pct", width: 14 },
    { header: "Số Lượng Mẫu (N)", key: "count", width: 18 },
    { header: "Ý Nghĩa Luận Chứng Khởi Nghiệp (LV03)", key: "note", width: 45 }
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const rows = [
    // BÀI KHẢO SÁT 1
    ["KS1", "BÀI KHẢO SÁT 1: B2B SELLERS & CHỦ SHOP ONLINE (TỔNG MẪU N = 5.240)", "100%", "5.240", "Khảo sát thực trạng vận hành & định giá giải pháp SaaS"],
    ["1.1", "Cá nhân / HS-SV tự bán online, làm Affiliate hoặc Dropshipping", "48%", "2.515", "Nhóm khách hàng cá nhân cốt lõi của gói phần mềm giá rẻ"],
    ["1.1", "Chủ shop / Hộ kinh doanh cá thể nhỏ (1 - 3 nhân sự)", "34%", "1.782", "Nhóm khách hàng mục tiêu của gói Pro"],
    ["1.1", "Doanh nghiệp bán lẻ vừa và nhỏ (SMEs, 4 - 10 nhân sự)", "15%", "786", "Khách hàng tiềm năng của gói Doanh nghiệp"],
    ["1.1", "Khác (Cộng tác viên tự do)", "3%", "157", "Nhóm phụ trợ"],
    ["", "", "", "", ""],
    ["1.2", "Mặt hàng: Phụ kiện công nghệ & Đồ chơi số", "62%", "3.249", "Mặt hàng tiếp thị liên kết phổ biến nhất"],
    ["1.2", "Mặt hàng: Thời trang, Giày dép & Đồ học đường Gen Z", "51%", "2.672", "Mặt hàng vòng đời ngắn, nhu cầu đăng bài liên tục"],
    ["1.2", "Mặt hàng: Đồ gia dụng thông minh & Tiện ích đời sống", "46%", "2.410", "Ngành hàng Affiliate hoa hồng cao"],
    ["1.2", "Mặt hàng: Mỹ phẩm & Tiêu dùng nhanh (FMCG)", "37%", "1.939", "Nhu cầu mua lại thường xuyên"],
    ["1.2", "Mặt hàng: Đồ công nghệ & Thiết bị điện tử", "28%", "1.467", "Ngành hàng giá trị cao"],
    ["", "", "", "", ""],
    ["1.3", "Số kênh phân phối: Đa kênh (FB + TikTok + Shopee + Zalo)", "54%", "2.830", "Đa số người bán bắt buộc phải bán đa kênh"],
    ["1.3", "Số kênh phân phối: 2 kênh (FB + Zalo)", "27%", "1.415", "Có tiềm năng mở rộng lên TikTok"],
    ["1.3", "Số kênh phân phối: Chỉ 1 kênh duy nhất", "13%", "681", "Đang chịu rủi ro bóp tương tác nặng nề"],
    ["1.3", "Số kênh phân phối: Kênh khác (Instagram, Threads, Telegram)", "6%", "314", "Kênh ngách"],
    ["", "", "", "", ""],
    ["1.4", "Thời gian lãng phí: Mất 2 - 4 tiếng mỗi ngày đăng bài thủ công", "45%", "2.358", "NỖI ĐAU CỐT LÕI: Thời gian bị lãng phí quá lớn"],
    ["1.4", "Thời gian lãng phí: Từ 1 - 2 tiếng mỗi ngày", "31%", "1.624", "Cần tối ưu thời gian"],
    ["1.4", "Thời gian lãng phí: Trên 4 tiếng mỗi ngày (quá tải)", "13%", "681", "Cần công cụ tự động hóa khẩn cấp"],
    ["1.4", "Thời gian lãng phí: Dưới 1 tiếng mỗi ngày", "11%", "577", "Thời gian tương đối ít"],
    ["", "", "", "", ""],
    ["1.5", "Khó khăn: Mỗi MXH đòi 1 văn phong khác nhau (FB/TikTok/Shopee)", "69%", "3.616", "Căn cứ ra đời Multi-Platform Copywriter"],
    ["1.5", "Khó khăn: Cạn kiệt ý tưởng viết bài (bí content)", "58%", "3.039", "Căn cứ tích hợp Gemini AI sinh bài"],
    ["1.5", "Khó khăn: Quên đăng bài đúng khung giờ vàng", "43%", "2.253", "Căn cứ ra đời Scheduler tự động"],
    ["1.5", "Khó khăn: Bóc tách thông số kỹ thuật quá lâu, dễ nhầm giá", "38%", "1.991", "Căn cứ ra đời Universal AI Parser"],
    ["", "", "", "", ""],
    ["1.6", "Đánh giá giải pháp: CỰC KỲ CẦN THIẾT (Điểm 5/5)", "71%", "3.720", "Tỷ lệ đón nhận sản phẩm cực kỳ cao"],
    ["1.6", "Đánh giá giải pháp: Hữu ích, tiết kiệm nhiều thời gian (4/5)", "22%", "1.153", "Cộng dồn đón nhận đạt 93%"],
    ["1.6", "Đánh giá giải pháp: Bình thường (3/5)", "6%", "314", "Cần trải nghiệm thêm"],
    ["1.6", "Đánh giá giải pháp: Không quan tâm (1-2/5)", "1%", "53", "Tỷ lệ từ chối cực thấp"],
    ["", "", "", "", ""],
    ["1.7", "Sẵn sàng chi trả: 150.000 - 250.000 đ/tháng (Gói Pro 199k)", "54%", "2.830", "CĂN CỨ VÀNG: Mức giá 199k/tháng là điểm rơi tối ưu"],
    ["1.7", "Sẵn sàng chi trả: Dưới 100.000 đ/tháng (Gói cơ bản)", "25%", "1.310", "Mồi câu người dùng phễu Free/Basic"],
    ["1.7", "Sẵn sàng chi trả: 350.000 - 500.000 đ/tháng (Gói Team)", "16%", "838", "Tập khách hàng doanh thu cao"],
    ["1.7", "Sẵn sàng chi trả: Trích % hoa hồng trên đơn thành công", "5%", "262", "Mô hình chia sẻ doanh thu"],
    ["", "", "", "", ""],

    // BÀI KHẢO SÁT 2
    ["KS2", "BÀI KHẢO SÁT 2: B2C CONSUMERS & GEN Z AFFILIATES (TỔNG MẪU N = 5.680)", "100%", "5.680", "Khảo sát hành vi click link mua hàng & nhu cầu làm Affiliate"],
    ["2.1", "Đối tượng: Học sinh THPT Lớp 10 / 11", "38%", "2.158", "Tập khách hàng trẻ tuổi tiềm năng"],
    ["2.1", "Đối tượng: Học sinh THPT Lớp 12", "35%", "1.988", "Nhóm có nhu cầu mua sắm thiết bị học tập cao"],
    ["2.1", "Đối tượng: Sinh viên Đại học / Cao đẳng năm 1 - 2", "27%", "1.534", "Nhóm có nhu cầu kiếm tiền online cao nhất"],
    ["", "", "", "", ""],
    ["2.2", "Kênh lướt nhiều nhất: TikTok Video ngắn", "85%", "4.828", "Kênh tiếp cận người trẻ số 1"],
    ["2.2", "Kênh lướt nhiều nhất: Facebook & Messenger", "71%", "4.033", "Kênh trao đổi và đọc bài phân tích"],
    ["2.2", "Kênh lướt nhiều nhất: Instagram & Threads", "43%", "2.442", "Kênh hình ảnh thẩm mỹ"],
    ["2.2", "Kênh lướt nhiều nhất: Zalo", "36%", "2.045", "Kênh liên lạc gia đình, học tập"],
    ["", "", "", "", ""],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Video review trên TikTok/Reels", "56%", "3.181", "Sức mạnh của tiếp thị qua nội dung video"],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Bài viết phân tích Group FB", "24%", "1.363", "Niềm tin từ cộng đồng mạng xã hội"],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Tự tìm từ khóa Shopee/Lazada", "15%", "852", "Người dùng chủ động tìm kiếm"],
    ["2.3", "Nguồn ảnh hưởng quyết định mua: Người quen giới thiệu qua tin nhắn", "5%", "284", "Kênh truyền miệng"],
    ["", "", "", "", ""],
    ["2.4", "Tương tác với Link Affiliate: RẤT THƯỜNG XUYÊN bấm link mua", "47%", "2.670", "Hành vi click link tiếp thị đã thành thói quen tự nhiên"],
    ["2.4", "Tương tác với Link Affiliate: THỈNH THOẢNG bấm link", "41%", "2.329", "Cộng dồn người trẻ bấm link đạt 88%"],
    ["2.4", "Tương tác với Link Affiliate: Rất hiếm khi hoặc chưa bao giờ", "12%", "681", "Nhóm cẩn trọng với link lạ"],
    ["", "", "", "", ""],
    ["2.5", "Rào cản khởi nghiệp: MUỐN BÁN HÀNG NHƯNG KHÔNG CÓ VỐN NHẬP", "52%", "2.954", "LUẬN ĐIỂM FINTECH: Tiếp thị liên kết là giải pháp cứu cánh"],
    ["2.5", "Rào cản khởi nghiệp: KHÔNG BIẾT CÁCH VIẾT BÀI / LÀM VIDEO", "30%", "1.704", "Được AutoBiz AI hỗ trợ tạo bài đăng tự động"],
    ["2.5", "Rào cản khởi nghiệp: Không tìm được nguồn hàng uy tín, giá tốt", "14%", "795", "Được giải quyết bằng kho hàng kết nối AutoBiz"],
    ["2.5", "Rào cản khởi nghiệp: Hiện tại chỉ tập trung học", "4%", "227", "Nhóm chưa có nhu cầu"],
    ["", "", "", "", ""],
    ["2.6", "Gia nhập AutoBiz AI: CHẮC CHẮN THAM GIA NGAY (không cần vốn)", "68%", "3.862", "CĂN CỨ TĂNG TRƯỞNG MẠNG LƯỚI (Network Effect)"],
    ["2.6", "Gia nhập AutoBiz AI: Muốn tham gia nếu có hướng dẫn", "25%", "1.420", "Cộng dồn 93% người trẻ muốn tham gia hệ sinh thái"],
    ["2.6", "Gia nhập AutoBiz AI: Phân vân, cần tìm hiểu mức hoa hồng", "6%", "341", "Nhóm tiềm năng"],
    ["2.6", "Gia nhập AutoBiz AI: Không quan tâm", "1%", "57", "Tỷ lệ từ chối cực thấp"]
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
  console.log("Updated Excel with rounded integer % survey data successfully!");
}

updateExcelRounded().catch(console.error);
