function taoHaiFormKhaoSatAutoBizAI() {
  Logger.log("=== BẮT ĐẦU KHỞI TẠO 2 FORM KHẢO SÁT AUTOBIZ AI (MÃ LV03) ===");
  
  // 1. Tạo Form 1: B2B Sellers & Chủ Shop Online
  var formB2B = taoFormB2BSellers();
  
  // 2. Tạo Form 2: B2C Gen Z Consumers & Affiliates
  var formB2C = taoFormB2CGenZ();
  
  Logger.log("\n=======================================================");
  Logger.log("🎉 KHỞI TẠO THÀNH CÔNG TRỌN VẸN 2 FORM KHẢO SÁT!");
  Logger.log("-------------------------------------------------------");
  Logger.log("📋 FORM 1 (B2B SELLERS):");
  Logger.log("👉 Link gửi người điền: " + formB2B.getPublishedUrl());
  Logger.log("👉 Link chỉnh sửa (Admin): " + formB2B.getEditUrl());
  Logger.log("-------------------------------------------------------");
  Logger.log("📋 FORM 2 (B2C GEN Z):");
  Logger.log("👉 Link gửi người điền: " + formB2C.getPublishedUrl());
  Logger.log("👉 Link chỉnh sửa (Admin): " + formB2C.getEditUrl());
  Logger.log("=======================================================\n");
}

function taoFormB2BSellers() {
  var formTitle = "KHẢO SÁT THỰC TRẠNG TIẾP THỊ ĐA KÊNH & NHU CẦU TỰ ĐỘNG HÓA AI CỦA NGƯỜI BÁN LẺ";
  var form = FormApp.create(formTitle);
  
  form.setDescription(
    "Kính chào Anh/Chị và các bạn kinh doanh online!\n\n" +
    "Phiếu khảo sát này nằm trong khuôn khổ Đề án Nghiên cứu & Phát triển Dự án Khởi nghiệp: " +
    "\"AutoBiz AI - Hệ sinh thái tự động hóa tiếp thị đa kênh và chuỗi cung ứng thương mại điện tử đa mặt hàng\" " +
    "(Dự án dự thi Cuộc thi Học sinh với ý tưởng khởi nghiệp cấp Thành phố năm học 2026 - 2027, Sở GD&ĐT TP.HCM - Lĩnh vực LV03).\n\n" +
    "Ý kiến đóng góp thực tế của Anh/Chị là cơ sở khoa học quan trọng giúp nhóm hoàn thiện giải pháp công nghệ phục vụ cộng đồng người bán lẻ Việt Nam. Mọi thông tin được bảo mật và chỉ phục vụ mục đích nghiên cứu."
  );
  
  // PHẦN 1
  var sec1 = form.addSectionHeaderItem();
  sec1.setTitle("PHẦN 1: THÔNG TIN MÔ HÌNH KINH DOANH & NGÀNH HÀNG");
  sec1.setHelpText("Giúp nhóm phân loại quy mô và đặc thù sản phẩm của người bán.");
  
  var q1_1 = form.addMultipleChoiceItem();
  q1_1.setTitle("1. Bạn hiện đang kinh doanh online dưới hình thức hoặc quy mô nào?");
  q1_1.setRequired(true);
  q1_1.setChoiceValues([
    "Cá nhân / Học sinh - Sinh viên tự kinh doanh online, làm Tiếp thị liên kết (Affiliate) hoặc Dropshipping",
    "Chủ shop / Hộ kinh doanh cá thể có cửa hàng hoặc kho hàng nhỏ (1 - 3 nhân sự)",
    "Doanh nghiệp bán lẻ vừa và nhỏ (SMEs, quy mô từ 4 - 10 nhân sự)",
    "Khác (Cộng tác viên bán tự do, kinh doanh thời vụ)"
  ]);
      
  var q1_2 = form.addCheckboxItem();
  q1_2.setTitle("2. Mặt hàng kinh doanh chủ đạo hiện tại của bạn là gì? (Có thể chọn nhiều)");
  q1_2.setRequired(true);
  q1_2.setChoiceValues([
    "Phụ kiện công nghệ & Đồ chơi số (Cáp sạc, tai nghe, pin dự phòng, ốp lưng, phím chuột)",
    "Thời trang, Giày dép & Phụ kiện học đường Gen Z",
    "Đồ gia dụng thông minh, Tiện ích đời sống & Không gian học tập",
    "Mỹ phẩm, Chăm sóc cá nhân & Hàng tiêu dùng nhanh (FMCG)",
    "Đồ công nghệ & Thiết bị điện tử giá trị cao (Laptop, Máy tính bảng, Điện thoại)"
  ]);

  // PHẦN 2
  form.addPageBreakItem().setTitle("PHẦN 2: THỰC TRẠNG QUẢN LÝ TIẾP THỊ & ÁP LỰC NỘI DUNG");

  var q1_3 = form.addMultipleChoiceItem();
  q1_3.setTitle("3. Bạn hiện đang phân phối bài viết bán hàng / tiếp thị trên bao nhiêu nền tảng cùng lúc?");
  q1_3.setRequired(true);
  q1_3.setChoiceValues([
    "Bán hàng Đa kênh hợp nhất (Facebook + TikTok Video/Shop + Shopee + Zalo)",
    "2 kênh kết hợp (Facebook Fanpage/cá nhân + Zalo tư vấn)",
    "Chỉ duy nhất 1 kênh (Chỉ đăng trên Facebook cá nhân hoặc Fanpage)",
    "Các kênh khác (Instagram, Threads, Telegram, sàn TMĐT khác)"
  ]);

  var q1_4 = form.addMultipleChoiceItem();
  q1_4.setTitle("4. Trung bình mỗi ngày bạn (hoặc nhóm) mất bao nhiêu thời gian chỉ để chuẩn bị ảnh, bóc tách thông số và viết bài đăng lên các kênh?");
  q1_4.setRequired(true);
  q1_4.setChoiceValues([
    "Mất từ 2 đến 4 tiếng mỗi ngày (Chiếm phần lớn thời gian vận hành kinh doanh)",
    "Từ 1 đến 2 tiếng mỗi ngày",
    "Trên 4 tiếng mỗi ngày (Bị quá tải, phải thuê người hoặc làm thêm ngoài giờ)",
    "Dưới 1 tiếng mỗi ngày"
  ]);

  var q1_5 = form.addCheckboxItem();
  q1_5.setTitle("5. Đâu là khó khăn lớn nhất của bạn khi quản lý tiếp thị nội dung đa kênh? (Chọn tối đa 2 đáp án)");
  q1_5.setRequired(true);
  q1_5.setChoiceValues([
    "Mỗi mạng xã hội đòi 1 kiểu viết khác nhau (Facebook cần bài dài uy tín, TikTok cần kịch bản ngắn giật gân, Shopee cần SEO)",
    "Cạn kiệt ý tưởng viết bài (Bí content), không biết viết thế nào để hút tương tác người trẻ",
    "Thường xuyên quên đăng bài đúng khung giờ vàng, tần suất đăng bài rời rạc không đều đặn",
    "Bóc tách thông số kỹ thuật sản phẩm quá lâu, dễ gõ nhầm cấu hình và giá cả"
  ]);

  // PHẦN 3
  form.addPageBreakItem().setTitle("PHẦN 3: ĐÁNH GIÁ GIẢI PHÁP AUTOBIZ AI & MỨC PHÍ PHÙ HỢP");

  var q1_6 = form.addMultipleChoiceItem();
  q1_6.setTitle("6. Nếu có một giải pháp AI tự động đọc ảnh/link từ kho hàng, bóc tách thông số trong 3 giây và tự tạo 4 phiên bản bài viết (FB, TikTok, Zalo, Shopee) để bạn duyệt 1 chạm, bạn đánh giá giải pháp này ra sao?");
  q1_6.setRequired(true);
  q1_6.setChoiceValues([
    "Cực kỳ cần thiết, giải quyết đúng bế tắc hiện tại của tôi (5/5 sao)",
    "Hữu ích, sẽ giúp tôi tiết kiệm được rất nhiều thời gian mỗi ngày (4/5 sao)",
    "Bình thường, cần dùng thử thực tế trên sản phẩm của mình mới đánh giá được (3/5 sao)",
    "Không quan tâm / Vẫn thích viết bài thủ công truyền thống (1-2 sao)"
  ]);

  var q1_7 = form.addMultipleChoiceItem();
  q1_7.setTitle("7. Bạn sẵn sàng chi trả mức phí bao nhiêu hàng tháng cho phần mềm tự động hóa tiếp thị này?");
  q1_7.setRequired(true);
  q1_7.setChoiceValues([
    "Từ 150.000 - 250.000 VNĐ / tháng (Tương đương Gói Pro 199.000 đ/tháng của AutoBiz AI)",
    "Dưới 100.000 VNĐ / tháng (Chỉ dùng bản cơ bản, giới hạn số lượt đăng)",
    "Từ 350.000 - 500.000 VNĐ / tháng (Gói Doanh nghiệp / Nhóm nhiều kênh, không giới hạn bài đăng)",
    "Không trả phí cố định hàng tháng, chỉ muốn trích % hoa hồng trên đơn hàng bán được"
  ]);

  return form;
}

function taoFormB2CGenZ() {
  var formTitle = "KHẢO SÁT HÀNH VI MUA SẮM ĐA KÊNH & NHU CẦU TIẾP THỊ LIÊN KẾT CỦA HỌC SINH - SINH VIÊN";
  var form = FormApp.create(formTitle);
  
  form.setDescription(
    "Chào các bạn học sinh, sinh viên thân mến!\n\n" +
    "Phiếu khảo sát này được thực hiện bởi Nhóm khởi nghiệp THPT TP.HCM trong khuôn khổ Đề án: " +
    "\"AutoBiz AI - Hệ sinh thái tự động hóa tiếp thị đa kênh và chuỗi cung ứng thương mại điện tử đa mặt hàng\" " +
    "(Cuộc thi Học sinh với ý tưởng khởi nghiệp cấp Thành phố năm học 2026 - 2027, Sở GD&ĐT TP.HCM - Lĩnh vực LV03 Dịch vụ, tài chính, ngân hàng).\n\n" +
    "Khảo sát nhằm ghi nhận chân thực thói quen mua sắm trực tuyến, hành vi click vào link sản phẩm trên mạng xã hội và nhu cầu tự tạo thu nhập của thế hệ trẻ Gen Z. Chỉ mất 1 - 2 phút để hoàn thành!"
  );

  // PHẦN 1
  var sec1 = form.addSectionHeaderItem();
  sec1.setTitle("PHẦN 1: THÔNG TIN ĐỐI TƯỢNG & NỀN TẢNG YÊU THÍCH");
  sec1.setHelpText("Tìm hiểu mức độ gắn bó của bạn với các nền tảng số hiện nay.");

  var q2_1 = form.addMultipleChoiceItem();
  q2_1.setTitle("1. Bạn hiện đang là học sinh / sinh viên thuộc nhóm nào?");
  q2_1.setRequired(true);
  q2_1.setChoiceValues([
    "Học sinh THPT Lớp 10 / 11",
    "Học sinh THPT Lớp 12 (Chuẩn bị thi Tốt nghiệp và xét tuyển Đại học)",
    "Sinh viên Cao đẳng / Đại học năm 1 hoặc năm 2"
  ]);

  var q2_2 = form.addCheckboxItem();
  q2_2.setTitle("2. Nền tảng mạng xã hội nào bạn dành nhiều thời gian lướt xem nhất mỗi ngày? (Chọn tối đa 2 đáp án)");
  q2_2.setRequired(true);
  q2_2.setChoiceValues([
    "TikTok (Lướt video ngắn giải trí, xem video review đồ hay, xem livestream)",
    "Facebook & Messenger (Lướt Newsfeed, theo dõi hội nhóm trường lớp, chat với bạn bè)",
    "Instagram & Threads (Xem story, cập nhật hình ảnh thẩm mỹ và xu hướng thời trang/lifestyle)",
    "Zalo (Trao đổi thông tin nhóm học tập, liên lạc với gia đình và thầy cô)"
  ]);

  // PHẦN 2
  form.addPageBreakItem().setTitle("PHẦN 2: THÓI QUEN MUA SẮM & TƯƠNG TÁC VỚI LINK TIẾP THỊ");

  var q2_3 = form.addMultipleChoiceItem();
  q2_3.setTitle("3. Khi cần mua đồ công nghệ (tai nghe, cáp sạc), đồ dùng học tập hoặc quần áo, nguồn nào ảnh hưởng lớn nhất đến quyết định chọn mua của bạn?");
  q2_3.setRequired(true);
  q2_3.setChoiceValues([
    "Xem video review trải nghiệm thực tế trên TikTok / Facebook Reels",
    "Đọc bài viết phân tích chi tiết, bảng so sánh thông số trong các Group Facebook uy tín",
    "Tự gõ từ khóa tìm kiếm trên thanh tìm kiếm của sàn Shopee / Lazada rồi lọc theo đánh giá",
    "Được bạn bè, người thân gửi tin nhắn giới thiệu trực tiếp"
  ]);

  var q2_4 = form.addMultipleChoiceItem();
  q2_4.setTitle("4. Bạn có từng bấm vào các đường link rút gọn (Affiliate Link / Bio Link) gắn dưới video TikTok hoặc bài viết Facebook để xem thông số và đặt mua hàng chưa?");
  q2_4.setRequired(true);
  q2_4.setChoiceValues([
    "Rất thường xuyên (Hầu như tuần nào lướt thấy món đồ hay, lạ mắt cũng bấm vào xem thử)",
    "Thỉnh thoảng (Chỉ bấm khi thấy món đồ thực sự cần thiết, độc đáo và giá cả hợp túi tiền)",
    "Rất hiếm khi hoặc chưa bao giờ (Do sợ link độc hại hoặc không có thói quen mua hàng qua link)"
  ]);

  // PHẦN 3
  form.addPageBreakItem().setTitle("PHẦN 3: NHU CẦU KIẾM THÊM THU NHẬP BẰNG TIẾP THỊ LIÊN KẾT");

  var q2_5 = form.addMultipleChoiceItem();
  q2_5.setTitle("5. Bạn có từng mong muốn kiếm thêm thu nhập từ việc kinh doanh online hoặc làm tiếp thị liên kết (Affiliate) không? Điều gì cản trở bạn nhiều nhất?");
  q2_5.setRequired(true);
  q2_5.setChoiceValues([
    "Rất muốn, nhưng KHÔNG CÓ VỐN để nhập hàng về bán và sợ rủi ro bị tồn kho, ôm hàng",
    "Rất muốn, nhưng KHÔNG BIẾT CÁCH VIẾT BÀI / LÀM VIDEO sao cho hay và thu hút người xem",
    "Không tìm được nguồn hàng uy tín, giá tận gốc và chính sách bảo hành rõ ràng để giới thiệu",
    "Hiện tại mình chỉ tập trung vào việc học, chưa có nhu cầu kiếm tiền online"
  ]);

  var q2_6 = form.addMultipleChoiceItem();
  q2_6.setTitle("6. Nếu hệ thống AutoBiz AI cung cấp sẵn nguồn hàng đa ngành đã kiểm định, tự động tạo bài đăng hấp dẫn và link nhận hoa hồng mang tên bạn để bạn chia sẻ nhận tiền chiết khấu, bạn có muốn tham gia không?");
  q2_6.setRequired(true);
  q2_6.setChoiceValues([
    "Chắc chắn tham gia ngay vì không phải bỏ vốn, không lo tồn kho và được AI hỗ trợ viết nội dung sẵn",
    "Muốn tham gia trải nghiệm nếu có đội ngũ dự án hướng dẫn chi tiết từng bước cách làm",
    "Phân vân, cần tìm hiểu kỹ hơn về tỷ lệ % hoa hồng chiết khấu trên từng sản phẩm",
    "Không quan tâm"
  ]);

  return form;
}
