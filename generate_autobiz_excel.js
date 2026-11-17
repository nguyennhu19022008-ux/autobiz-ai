const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function createAutoBizExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AutoBiz AI Founding Team';
  workbook.created = new Date('2026-11-12');
  workbook.modified = new Date('2026-11-12');

  const COLOR_HEADER_BG = '0F172A'; // Deep Slate
  const COLOR_SUB_BG = '1E293B';
  const COLOR_ACCENT_BG = '2563EB'; // Royal Blue
  const COLOR_LIGHT_ROW = 'F8FAFC';
  const COLOR_BORDER = 'CBD5E1';
  const COLOR_SUCCESS = '16A34A';
  const COLOR_WARN = 'D97706';

  const defaultBorder = {
    top: { style: 'thin', color: { argb: 'FF' + COLOR_BORDER } },
    bottom: { style: 'thin', color: { argb: 'FF' + COLOR_BORDER } },
    left: { style: 'thin', color: { argb: 'FF' + COLOR_BORDER } },
    right: { style: 'thin', color: { argb: 'FF' + COLOR_BORDER } }
  };

  // ==========================================
  // SHEET 1: GANTT TIMELINE (12/11 -> 30/11/2026)
  // ==========================================
  const wsGantt = workbook.addWorksheet('1. Tiến Độ & Gantt (12-30.11)', {
    views: [{ showGridLines: true }]
  });

  wsGantt.columns = [
    { header: 'Mã CV', key: 'code', width: 10 },
    { header: 'Hạng Mục Công Việc', key: 'task', width: 38 },
    { header: 'Giai Đoạn', key: 'phase', width: 22 },
    { header: 'Người Phụ Trách', key: 'assignee', width: 22 },
    { header: 'Ngày Bắt Đầu', key: 'start', width: 14 },
    { header: 'Ngày Kết Thúc', key: 'end', width: 14 },
    { header: 'Số Ngày', key: 'days', width: 10 },
    { header: 'Trọng Số', key: 'weight', width: 12 },
    { header: 'Tiến Độ', key: 'progress', width: 12 },
    { header: 'Sản Phẩm Đầu Ra', key: 'deliverable', width: 36 },
    { header: 'Ghi Chú Kỹ Thuật', key: 'note', width: 28 },
  ];

  const ganttData = [
    { code: 'GD1.1', task: 'Thiết lập dự án AutoBiz-AI & Tham chiếu code autopost cũ', phase: 'GĐ 1: Kiến Trúc & Khởi Động', assignee: 'Vương Gia (Lead)', start: '12/11/2026', end: '13/11/2026', days: 2, weight: '5%', progress: '100%', deliverable: 'Source code AutoBiz-AI độc lập, clean env', note: 'Không chạm vào code cũ' },
    { code: 'GD1.2', task: 'Thiết kế Đặc tả Kiến trúc Microservices & Omni-channel Hub', phase: 'GĐ 1: Kiến Trúc & Khởi Động', assignee: 'Minh Khôi + Vương Gia', start: '13/11/2026', end: '14/11/2026', days: 2, weight: '8%', progress: '80%', deliverable: 'Sơ đồ luồng dữ liệu & REST API specs', note: 'Hỗ trợ FB, TikTok, Zalo, Shopee' },
    { code: 'GD1.3', task: 'Soạn thảo & Phát động BÀI KHẢO SÁT 1: Người Bán Hàng (B2B)', phase: 'GĐ 1: Khảo Sát Thực Nghiệm 1', assignee: 'Hoàng Nam + Bích Thảo', start: '13/11/2026', end: '18/11/2026', days: 6, weight: '10%', progress: '60%', deliverable: 'FormForge & Google Forms (Target: 1.200 mẫu)', note: 'Nỗi đau đa kênh & tiếp thị' },
    { code: 'GD1.4', task: 'Nâng cấp Database Schema (Multi-Tenant & Multi-Product)', phase: 'GĐ 1: Kiến Trúc & Khởi Động', assignee: 'Kim Hoa + Minh Khôi', start: '14/11/2026', end: '16/11/2026', days: 3, weight: '7%', progress: '50%', deliverable: 'Supabase PostgreSQL tables & storage buckets', note: '5 danh mục hàng hóa mới' },
    
    { code: 'GD2.1', task: 'Phát triển Universal AI Parser (Gemini Multi-Category)', phase: 'GĐ 2: Xây Dựng Core WebApp', assignee: 'Quốc Khánh + Vương Gia', start: '17/11/2026', end: '19/11/2026', days: 3, weight: '10%', progress: '20%', deliverable: 'services/universalAiParser.js', note: 'Lọc sỉ & viết bài theo 5 ngành hàng' },
    { code: 'GD2.2', task: 'Xây dựng Multi-Platform Connector (FB, TikTok, Zalo, Shopee)', phase: 'GĐ 2: Xây Dựng Core WebApp', assignee: 'Vương Gia + Minh Khôi', start: '18/11/2026', end: '21/11/2026', days: 4, weight: '12%', progress: '10%', deliverable: 'services/omniChannels.js', note: 'Đăng chéo Fanpage, Group, Shop' },
    { code: 'GD2.3', task: 'Soạn thảo & Phát động BÀI KHẢO SÁT 2: Người Tiêu Dùng Gen Z', phase: 'GĐ 2: Khảo Sát Thực Nghiệm 2', assignee: 'Hoàng Nam + Hoàng Duy', start: '18/11/2026', end: '24/11/2026', days: 7, weight: '10%', progress: '10%', deliverable: 'Google Forms khảo sát (Target: 3.500 mẫu)', note: 'Hành vi mua sắm qua social' },
    { code: 'GD2.4', task: 'Nâng cấp Web Cockpit Dashboard (Giao diện quản trị tập trung)', phase: 'GĐ 2: Xây Dựng Core WebApp', assignee: 'Trâm Anh + Quang Hưng', start: '19/11/2026', end: '21/11/2026', days: 3, weight: '8%', progress: '15%', deliverable: 'Giao diện Studio Pro quản lý bài & hàng đợi', note: 'Omni-channel calendar' },

    { code: 'GD3.1', task: 'Tích hợp Module Tiếp thị liên kết (Affiliate & Smart UTM)', phase: 'GĐ 3: Tiếp Thị & Khảo Sát 3', assignee: 'Vương Gia + Kim Hoa', start: '22/11/2026', end: '24/11/2026', days: 3, weight: '8%', progress: '0%', deliverable: 'Affiliate tracker & commission counter', note: 'Rút gọn link & đo lường click' },
    { code: 'GD3.2', task: 'Triển khai BÀI KHẢO SÁT 3: Đối Tác Tổng Kho & Nhà Phân Phối', phase: 'GĐ 3: Tiếp Thị & Khảo Sát 3', assignee: 'Bích Thảo + Minh Triết', start: '22/11/2026', end: '26/11/2026', days: 5, weight: '6%', progress: '0%', deliverable: 'Phiếu phỏng vấn sâu 300 tổng kho tại TP.HCM', note: 'Nhu cầu mở API đẩy hàng' },
    { code: 'GD3.3', task: 'Nâng cấp Chrome Extension: AutoBiz Universal Collector', phase: 'GĐ 3: Tiếp Thị & Khảo Sát 3', assignee: 'Quốc Khánh + Trâm Anh', start: '23/11/2026', end: '25/11/2026', days: 3, weight: '6%', progress: '0%', deliverable: 'Extension bắt sản phẩm từ Zalo, Shopee, TikTok', note: '1-click gom ảnh HD & mô tả' },

    { code: 'GD4.1', task: 'Tổng hợp phân tích số liệu 3 bài khảo sát (N = 5.000+)', phase: 'GĐ 4: Báo Cáo & Hồ Sơ Dự Thi', assignee: 'Hoàng Nam + Kim Hoa', start: '25/11/2026', end: '27/11/2026', days: 3, weight: '5%', progress: '0%', deliverable: 'Báo cáo thống kê SPSS / Excel data charts', note: 'Biểu đồ trực quan, độ tin cậy 95%' },
    { code: 'GD4.2', task: 'Hoàn thiện Bản thuyết minh đề án theo Phụ lục III (10 trang A4)', phase: 'GĐ 4: Báo Cáo & Hồ Sơ Dự Thi', assignee: 'Vương Gia + Đội nòng cốt', start: '26/11/2026', end: '29/11/2026', days: 4, weight: '5%', progress: '0%', deliverable: 'File Word dự thi chính thức (LV03)', note: 'Bám sát 5 tiêu chí Rubric' },
    { code: 'GD4.3', task: 'Sản xuất Video clip giới thiệu 03 phút theo Phụ lục IV', phase: 'GĐ 4: Báo Cáo & Hồ Sơ Dự Thi', assignee: 'Bích Thảo + Hoàng Duy', start: '27/11/2026', end: '29/11/2026', days: 3, weight: '5%', progress: '0%', deliverable: 'Video MP4 &lt; 500MB (Demo WebApp & Impact)', note: 'Thuyết minh trực quan sinh động' },
    { code: 'GD4.4', task: 'Đóng gói toàn bộ hồ sơ, kiểm tra tính hợp lệ & Nghiệm thu', phase: 'GĐ 4: Báo Cáo & Hồ Sơ Dự Thi', assignee: 'Vương Gia + GV Hướng dẫn', start: '29/11/2026', end: '30/11/2026', days: 2, weight: '2%', progress: '0%', deliverable: 'Trọn bộ hồ sơ sẵn sàng nộp Google Forms', note: 'Hạn chót nội bộ: 30/11/2026' }
  ];

  wsGantt.getRow(1).height = 28;
  wsGantt.getRow(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  wsGantt.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsGantt.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_HEADER_BG } };

  ganttData.forEach((row, i) => {
    const r = wsGantt.addRow(row);
    r.height = 24;
    r.font = { name: 'Times New Roman', size: 11 };
    r.alignment = { vertical: 'middle' };
    if (i % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_LIGHT_ROW } };
    }
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = defaultBorder;
      if ([1, 5, 6, 7, 8, 9].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 9) { // Progress
        cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: cell.value === '100%' ? 'FF' + COLOR_SUCCESS : 'FF' + COLOR_WARN } };
      }
    });
  });

  // ==========================================
  // SHEET 2: RACI MATRIX (10 MEMBERS)
  // ==========================================
  const wsRaci = workbook.addWorksheet('2. Phân Công RACI (10 TV)', {
    views: [{ showGridLines: true }]
  });

  wsRaci.columns = [
    { header: 'STT', key: 'idx', width: 6 },
    { header: 'Họ Và Tên', key: 'name', width: 22 },
    { header: 'Chức Danh', key: 'title', width: 24 },
    { header: 'SĐT / Kênh Liên Hệ', key: 'phone', width: 18 },
    { header: 'Nhiệm Vụ Cốt Lõi', key: 'core', width: 34 },
    { header: 'Kiến Trúc & Code', key: 'r1', width: 16 },
    { header: 'Khảo Sát 1 & 2', key: 'r2', width: 16 },
    { header: 'Tài Chính & Kế Hoạch', key: 'r3', width: 18 },
    { header: 'Hồ Sơ & Video', key: 'r4', width: 16 },
  ];

  const raciData = [
    { idx: '01', name: 'Nguyễn Như Vương Gia', title: 'Chủ nhiệm Đề án · Lead Dev', phone: '0876 637 806', core: 'Điều phối chung, kiến trúc đa kênh, thuật toán AI', r1: 'Accountable (A)', r2: 'Consulted (C)', r3: 'Responsible (R)', r4: 'Accountable (A)' },
    { idx: '02', name: 'Trần Quốc Khánh', title: 'Phụ trách Phần cứng & QC', phone: '0903 112 233', core: 'Chuỗi cung ứng đa mặt hàng, tiêu chuẩn kiểm định hàng', r1: 'Responsible (R)', r2: 'Informed (I)', r3: 'Consulted (C)', r4: 'Responsible (R)' },
    { idx: '03', name: 'Lê Huỳnh Kim Hoa', title: 'Giám đốc Tài chính (CFO)', phone: '0912 345 678', core: 'Dự toán ngân sách, dòng tiền 3 năm, mô hình doanh thu', r1: 'Consulted (C)', r2: 'Responsible (R)', r3: 'Accountable (A)', r4: 'Responsible (R)' },
    { idx: '04', name: 'Phạm Hoàng Nam', title: 'Trưởng ban Nghiên cứu Thị trường', phone: '0933 445 566', core: 'Thiết kế 3 bài khảo sát, thu thập 5.000 mẫu, SPSS', r1: 'Consulted (C)', r2: 'Accountable (A)', r3: 'Responsible (R)', r4: 'Responsible (R)' },
    { idx: '05', name: 'Đỗ Minh Triết', title: 'Pháp chế & Vận hành', phone: '0944 556 677', core: 'Điều khoản tiếp thị liên kết, pháp lý TMĐT, an toàn dữ liệu', r1: 'Consulted (C)', r2: 'Responsible (R)', r3: 'Responsible (R)', r4: 'Responsible (R)' },
    { idx: '06', name: 'Phan Văn Minh Khôi', title: 'Kỹ sư Full-stack', phone: '0902 334 455', core: 'Phát triển backend Express, Supabase API & Webhooks', r1: 'Responsible (R)', r2: 'Informed (I)', r3: 'Informed (I)', r4: 'Consulted (C)' },
    { idx: '07', name: 'Đặng Quang Hưng', title: 'Kỹ sư Frontend UI/UX', phone: '0905 667 788', core: 'Xây dựng Web Cockpit Studio, responsive desktop & mobile', r1: 'Responsible (R)', r2: 'Informed (I)', r3: 'Informed (I)', r4: 'Responsible (R)' },
    { idx: '08', name: 'Trần Ngọc Trâm Anh', title: 'Kiểm thử & QA Extension', phone: '0907 889 900', core: 'Thử nghiệm Chrome Extension thu thập dữ liệu Shopee/Zalo', r1: 'Responsible (R)', r2: 'Responsible (R)', r3: 'Informed (I)', r4: 'Consulted (C)' },
    { idx: '09', name: 'Võ Thị Bích Thảo', title: 'Truyền thông & Kịch bản Video', phone: '0908 112 334', core: 'Biên tập video clip 3 phút, tài liệu truyền thông dự thi', r1: 'Informed (I)', r2: 'Responsible (R)', r3: 'Consulted (C)', r4: 'Responsible (R)' },
    { idx: '10', name: 'Nguyễn Hoàng Duy', title: 'Chăm sóc Đối tác & Khách hàng', phone: '0909 223 445', core: 'Phỏng vấn 300 tổng kho, thu thập phản hồi người bán hàng', r1: 'Informed (I)', r2: 'Responsible (R)', r3: 'Informed (I)', r4: 'Responsible (R)' }
  ];

  wsRaci.getRow(1).height = 28;
  wsRaci.getRow(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  wsRaci.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsRaci.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_HEADER_BG } };

  raciData.forEach((row, i) => {
    const r = wsRaci.addRow(row);
    r.height = 24;
    r.font = { name: 'Times New Roman', size: 11 };
    r.alignment = { vertical: 'middle' };
    if (i % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_LIGHT_ROW } };
    }
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = defaultBorder;
      if ([1, 4, 6, 7, 8, 9].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // ==========================================
  // SHEET 3: SURVEY METHODOLOGY (3 SURVEYS)
  // ==========================================
  const wsSurvey = workbook.addWorksheet('3. Kế Hoạch 3 Bài Khảo Sát', {
    views: [{ showGridLines: true }]
  });

  wsSurvey.columns = [
    { header: 'Mã', key: 'code', width: 8 },
    { header: 'Tên Bài Khảo Sát', key: 'name', width: 36 },
    { header: 'Đối Tượng Mục Tiêu', key: 'target', width: 28 },
    { header: 'Quy Mô Mẫu (N)', key: 'sample', width: 16 },
    { header: 'Phương Pháp Thu Thập', key: 'method', width: 26 },
    { header: 'Thời Gian Triển Khai', key: 'time', width: 20 },
    { header: 'Chỉ Số Trọng Tâm Đo Lường', key: 'metrics', width: 34 },
    { header: 'Ứng Dụng Vào Hệ Thống AutoBiz AI', key: 'impact', width: 32 }
  ];

  const surveyData = [
    {
      code: 'KS01',
      name: 'Nỗi đau & Nhu cầu Tự động hóa Vận hành Đa Kênh của Người Bán Hàng Trẻ (B2B)',
      target: 'Người bán hàng online, học sinh/sinh viên khởi nghiệp TMĐT, CTV bán lẻ',
      sample: 'N = 1.250 mẫu',
      method: 'Google Forms + FormForge REST API + Group Zalo/FB bán hàng',
      time: '13/11/2026 – 18/11/2026',
      metrics: '• % Thời gian lãng phí copy bài thủ công\n• Số kênh bán hàng quản lý song song\n• Rào cản bóc tách thông số sỉ\n• Mức phí sẵn sàng chi trả SaaS/tháng',
      impact: 'Xác định chính xác các tính năng cốt lõi của Web Cockpit: Multi-channel scheduler, auto-sanitizer và mức định giá gói thuê bao.'
    },
    {
      code: 'KS02',
      name: 'Hành vi Mua Sắm Đa Kênh & Mức Độ Đón Nhận Tiếp Thị Tự Động của Gen Z (B2C)',
      target: 'Học sinh THPT (10-12), Sinh viên ĐH/CĐ trên địa bàn TP.HCM',
      sample: 'N = 3.600 mẫu',
      method: 'Khảo sát ngẫu nhiên phân tầng tại 15 trường THPT/ĐH TP.HCM',
      time: '18/11/2026 – 24/11/2026',
      metrics: '• Nền tảng mua sắm thường xuyên nhất (TikTok vs Shopee vs FB)\n• Tỷ lệ tin tưởng nội dung review/bán hàng\n• Nhu cầu mua sắm sản phẩm phụ kiện/học tập',
      impact: 'Hoạch định thuật toán tối ưu khung giờ vàng của AutoBiz AI theo từng nhóm mặt hàng và kênh truyền thông.'
    },
    {
      code: 'KS03',
      name: 'Khảo Sát Sẵn Sàng Kết Nối API & Cung Ứng Tiếp Thị Liên Kết của Tổng Kho (Suppliers)',
      target: 'Chủ tổng kho, nhà phân phối hàng công nghệ, phụ kiện, thời trang tại TP.HCM',
      sample: 'N = 320 kho sỉ',
      method: 'Phỏng vấn chuyên sâu trực tiếp + Bảng hỏi số hóa qua Zalo đối tác',
      time: '22/11/2026 – 26/11/2026',
      metrics: '• Tỷ lệ kho có sẵn file ảnh HD & bảng giá sỉ\n• Mong muốn xả tồn kho nhanh qua mạng lưới CTV\n• % Chiết khấu hoa hồng affiliate sẵn sàng chi trả',
      impact: 'Xây dựng module "Universal Collector Extension" và chuẩn hóa định dạng API nhận hàng từ kho vào hệ thống AutoBiz AI.'
    }
  ];

  wsSurvey.getRow(1).height = 28;
  wsSurvey.getRow(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  wsSurvey.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsSurvey.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_HEADER_BG } };

  surveyData.forEach((row, i) => {
    const r = wsSurvey.addRow(row);
    r.height = 48;
    r.font = { name: 'Times New Roman', size: 11 };
    r.alignment = { vertical: 'middle', wrapText: true };
    if (i % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_LIGHT_ROW } };
    }
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = defaultBorder;
      if ([1, 4, 6].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
    });
  });

  // ==========================================
  // SHEET 4: FINANCIAL PLAN 3 YEARS (2026 - 2029)
  // ==========================================
  const wsFin = workbook.addWorksheet('4. Kế Hoạch Tài Chính 3 Năm', {
    views: [{ showGridLines: true }]
  });

  wsFin.columns = [
    { header: 'Mã', key: 'code', width: 8 },
    { header: 'Chỉ Tiêu Tài Chính', key: 'name', width: 36 },
    { header: 'Đơn Vị', key: 'unit', width: 12 },
    { header: 'Năm 1 (2026 - 2027)', key: 'y1', width: 22 },
    { header: 'Năm 2 (2027 - 2028)', key: 'y2', width: 22 },
    { header: 'Năm 3 (2028 - 2029)', key: 'y3', width: 22 },
    { header: 'Ghi Chú Cơ Sở Tính Toán', key: 'note', width: 34 }
  ];

  const finData = [
    { code: 'A', name: 'QUY MÔ VẬN HÀNH', unit: '', y1: '', y2: '', y3: '', note: '' },
    { code: 'A1', name: 'Số lượng nhà bán hàng (Sellers/Users)', unit: 'Tài khoản', y1: 450, y2: 1800, y3: 6500, note: 'Tăng trưởng qua mạng lưới học sinh/SV' },
    { code: 'A2', name: 'Tổng số bài đăng tiếp thị tự động', unit: 'Bài đăng', y1: 162000, y2: 864000, y3: 3900000, note: 'Bình quân 12 bài/user/ngày đa kênh' },
    { code: 'A3', name: 'Tổng đơn hàng TMĐT tạo ra (GMV)', unit: 'Đơn hàng', y1: 18500, y2: 89000, y3: 360000, note: 'Tỷ lệ chuyển đổi bình quân 1,8% - 2,5%' },

    { code: 'B', name: 'DOANH THU THUẦN (REVENUE)', unit: '', y1: '', y2: '', y3: '', note: '' },
    { code: 'B1', name: '1. Doanh thu phí thuê bao phần mềm (SaaS)', unit: 'VNĐ', y1: 270000000, y2: 1296000000, y3: 4680000000, note: 'Gói Pro 99k/tháng & Gói Business 199k/tháng' },
    { code: 'B2', name: '2. Doanh thu hoa hồng tiếp thị liên kết (Affiliate)', unit: 'VNĐ', y1: 185000000, y2: 890000000, y3: 3600000000, note: '3% - 8% trên giá trị đơn hàng thành công' },
    { code: 'B3', name: '3. Doanh thu phí kết nối dữ liệu kho (API Partners)', unit: 'VNĐ', y1: 65000000, y2: 240000000, y3: 750000000, note: 'Phí kết nối tổng kho đẩy sản phẩm tự động' },
    { code: 'BT', name: 'TỔNG DOANH THU THUẦN', unit: 'VNĐ', y1: 520000000, y2: 2426000000, y3: 9030000000, note: 'Tăng trưởng 366% ở Năm 2' },

    { code: 'C', name: 'CHI PHÍ HOẠT ĐỘNG (OPEX)', unit: '', y1: '', y2: '', y3: '', note: '' },
    { code: 'C1', name: 'Chi phí hạ tầng máy chủ & Cloud Supabase/Vercel', unit: 'VNĐ', y1: 36000000, y2: 120000000, y3: 380000000, note: 'Server Node.js, DB PostgreSQL, Storage' },
    { code: 'C2', name: 'Chi phí API AI Gemini & Proxy mạng xã hội', unit: 'VNĐ', y1: 42000000, y2: 168000000, y3: 540000000, note: 'Token Gemini 3.5 Flash & Proxy xoay IP' },
    { code: 'C3', name: 'Chi phí hỗ trợ kỹ thuật & chăm sóc khách hàng', unit: 'VNĐ', y1: 72000000, y2: 360000000, y3: 1200000000, note: 'Trợ cấp đội ngũ sinh viên hỗ trợ 24/7' },
    { code: 'C4', name: 'Chi phí truyền thông, cuộc thi & phát triển cộng đồng', unit: 'VNĐ', y1: 45000000, y2: 180000000, y3: 450000000, note: 'Workshop trường học, CLB Tin học/Khởi nghiệp' },
    { code: 'C5', name: 'Chi phí quản lý & dự phòng rủi ro bảo hành/hoàn tiền', unit: 'VNĐ', y1: 25000000, y2: 98000000, y3: 320000000, note: '5% quỹ dự phòng rủi ro vận hành' },
    { code: 'CT', name: 'TỔNG CHI PHÍ HOẠT ĐỘNG', unit: 'VNĐ', y1: 220000000, y2: 926000000, y3: 2890000000, note: 'Kiểm soát tỷ lệ chi phí &lt; 40% doanh thu' },

    { code: 'D', name: 'LỢI NHUẬN & HIỆU QUẢ', unit: '', y1: '', y2: '', y3: '', note: '' },
    { code: 'D1', name: 'LỢI NHUẬN TRƯỚC THUẾ (EBT)', unit: 'VNĐ', y1: 300000000, y2: 1500000000, y3: 6140000000, note: 'Tỷ suất lợi nhuận ròng cực kỳ cao (SaaS)' },
    { code: 'D2', name: 'Tỷ suất lợi nhuận ròng (ROS)', unit: '%', y1: 0.577, y2: 0.618, y3: 0.680, note: 'Mô hình phần mềm biên lợi nhuận cao' },
    { code: 'D3', name: 'Điểm hòa vốn (Break-even Point)', unit: 'Users', y1: 180, y2: 350, y3: 600, note: 'Đạt điểm hòa vốn ngay trong Quý 2 Năm 1' },
    { code: 'D4', name: 'Trích Quỹ Khuyến học & Ươm mầm Khởi nghiệp (5%)', unit: 'VNĐ', y1: 15000000, y2: 75000000, y3: 307000000, note: 'Trao học bổng & tài trợ công nghệ cho học sinh' }
  ];

  wsFin.getRow(1).height = 28;
  wsFin.getRow(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  wsFin.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsFin.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_HEADER_BG } };

  finData.forEach((row, i) => {
    const r = wsFin.addRow(row);
    const isHeaderRow = ['A', 'B', 'C', 'D'].includes(row.code);
    const isTotalRow = ['BT', 'CT', 'D1'].includes(row.code);

    r.height = isHeaderRow ? 26 : 22;
    r.font = {
      name: 'Times New Roman',
      size: 11,
      bold: isHeaderRow || isTotalRow,
      color: { argb: isHeaderRow ? 'FFFFFFFF' : (isTotalRow ? 'FF' + COLOR_ACCENT_BG : 'FF0F172A') }
    };
    r.alignment = { vertical: 'middle' };

    if (isHeaderRow) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_SUB_BG } };
    } else if (isTotalRow) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    } else if (i % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_LIGHT_ROW } };
    }

    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = defaultBorder;
      if (colNumber === 1 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if ([4, 5, 6].includes(colNumber) && typeof cell.value === 'number') {
        if (row.code === 'D2') {
          cell.numFmt = '0.0%';
        } else if (row.code.startsWith('A')) {
          cell.numFmt = '#,##0';
        } else {
          cell.numFmt = '#,##0 "₫"';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  });

  // ==========================================
  // SHEET 5: RISK MANAGEMENT & MITIGATION
  // ==========================================
  const wsRisk = workbook.addWorksheet('5. Quản Trị Rủi Ro (Risk Matrix)', {
    views: [{ showGridLines: true }]
  });

  wsRisk.columns = [
    { header: 'Mã', key: 'code', width: 8 },
    { header: 'Nhóm Rủi Ro', key: 'category', width: 22 },
    { header: 'Mô Tả Rủi Ro Nhận Diện', key: 'risk', width: 36 },
    { header: 'Xác Suất', key: 'prob', width: 12 },
    { header: 'Mức Độ Ảnh Hưởng', key: 'impact', width: 16 },
    { header: 'Biện Pháp Phòng Ngừa & Ứng Phó Chủ Động', key: 'mitigation', width: 44 },
    { header: 'Người Phụ Trách', key: 'owner', width: 20 }
  ];

  const riskData = [
    { code: 'R01', category: 'Kỹ Thuật & Nền Tảng', risk: 'Facebook / TikTok thay đổi chính sách API hoặc siết chặt kiểm duyệt đăng bài', prob: 'Cao', impact: 'Nghiêm trọng', mitigation: '• Triển khai kiến trúc Modular Connector linh hoạt.\n• Kết hợp cơ chế Robot Web Extension mô phỏng người dùng tự nhiên.\n• Đa dạng hóa sang Zalo OA, Shopee, Telegram để không bị phụ thuộc duy nhất vào 1 nền tảng.', owner: 'Vương Gia + Minh Khôi' },
    { code: 'R02', category: 'Chất Lượng Dữ Liệu', risk: 'AI Gemini bóc tách sai thông số sản phẩm hoặc bỏ sót từ ngữ nhạy cảm từ kho sỉ', prob: 'Trung bình', impact: 'Cao', mitigation: '• Áp dụng chuỗi 3 mô hình dự phòng kết hợp RegEx Rule Engine kiểm tra 2 lớp.\n• Cung cấp giao diện Live Preview bắt buộc người bán xác nhận trước khi đăng.\n• Tự động gắn nhãn "Đang kiểm duyệt" đối với bài viết có độ tin cậy AI &lt; 90%.', owner: 'Quốc Khánh + Trâm Anh' },
    { code: 'R03', category: 'Pháp Lý & Bản Quyền', risk: 'Tranh chấp về hình ảnh thương hiệu sản phẩm và điều khoản tiếp thị liên kết', prob: 'Trung bình', impact: 'Trung bình', mitigation: '• Chỉ kết nối với các tổng kho có chứng từ xuất xứ rõ ràng.\n• Tự động chèn đóng dấu bản quyền người bán (Watermark) và tuyên bố miễn trừ trách nhiệm tiếp thị liên kết theo Luật TMĐT 2020.', owner: 'Minh Triết (Pháp chế)' },
    { code: 'R04', category: 'Hạ Tầng & Chi Phí API', risk: 'Lượng người dùng tăng đột biến dẫn đến nghẽn máy chủ và vượt ngân sách API', prob: 'Thấp', impact: 'Cao', mitigation: '• Ứng dụng Serverless kiến trúc phân tán Vercel + Supabase tự động co giãn.\n• Sử dụng bộ nhớ đệm Cache Redis lưu tạm kết quả bài viết tương tự.\n• Phân bổ hạn ngạch đăng bài (Quota) theo từng gói thuê bao của người dùng.', owner: 'Minh Khôi + Kim Hoa' },
    { code: 'R05', category: 'Đối Thủ Cạnh Tranh', risk: 'Các công cụ đăng bài truyền thống sao chép tính năng bóc tách AI', prob: 'Cao', impact: 'Trung bình', mitigation: '• Xây dựng rào cản độc quyền: Kho mẫu tuần hoàn (Data Post) và hệ thống kết nối trực tiếp tổng kho không công khai.\n• Tập trung chăm sóc cộng đồng học sinh/sinh viên khởi nghiệp với chi phí rẻ hơn 60% thị trường.', owner: 'Hoàng Nam + Vương Gia' }
  ];

  wsRisk.getRow(1).height = 28;
  wsRisk.getRow(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  wsRisk.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsRisk.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_HEADER_BG } };

  riskData.forEach((row, i) => {
    const r = wsRisk.addRow(row);
    r.height = 44;
    r.font = { name: 'Times New Roman', size: 11 };
    r.alignment = { vertical: 'middle', wrapText: true };
    if (i % 2 === 1) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR_LIGHT_ROW } };
    }
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = defaultBorder;
      if ([1, 4, 5, 7].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      if (colNumber === 4 || colNumber === 5) {
        if (cell.value === 'Cao' || cell.value === 'Nghiêm trọng') {
          cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFDC2626' } };
        }
      }
    });
  });

  const outLocal = path.join(__dirname, 'KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx');
  const outDownloads = 'C:/Users/Admin/Downloads/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx';
  const outDesktop = 'C:/Users/Admin/Desktop/KE_HOACH_TIEN_DO_VA_TAI_CHINH_AUTOBIZ_AI.xlsx';

  await workbook.xlsx.writeFile(outLocal);
  try { await workbook.xlsx.writeFile(outDownloads); } catch(e){}
  try { await workbook.xlsx.writeFile(outDesktop); } catch(e){}

  console.log('Successfully written Excel file to:');
  console.log('1. ' + outLocal);
  console.log('2. ' + outDownloads);
  console.log('3. ' + outDesktop);
}

createAutoBizExcel().catch(err => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});
