# -*- coding: utf-8 -*-
"""
scripts/build_qa_phanbien_docx.py
Cập nhật & nâng cấp Bộ Câu Hỏi & Đáp Án Phản Biện Ban Giám Khảo (20 Câu trọng tâm — Đồng bộ v1.1 + Supabase + QA 71/71)
Lưu song song vào repo và Desktop\BO_KE_HOACH_DU_AN_AUTOBIZ_AI\BO_15_CAU_HOI_PHAN_BIEN_BGK_AUTOBIZ_AI.docx
"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT_PROJECT = os.path.join(ROOT_DIR, 'BO_15_CAU_HOI_PHAN_BIEN_BGK_AUTOBIZ_AI.docx')
OUT_DESKTOP = os.path.join(r'C:\Users\Admin\Desktop\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'BO_15_CAU_HOI_PHAN_BIEN_BGK_AUTOBIZ_AI.docx')

BLACK = RGBColor(0x11, 0x18, 0x27)
BURGUNDY = RGBColor(0x7F, 0x1D, 0x1D)
MUTED = RGBColor(0x4B, 0x55, 0x63)

def style_run(r, size=12, bold=False, italic=False, color=BLACK):
    r.font.name = 'Times New Roman'
    r.font.size = Pt(size)
    r.font.color.rgb = color
    r.bold = bold
    r.italic = italic
    rPr = r._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rFonts.set(qn(attr), 'Times New Roman')

def add_p(doc, text, size=12, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, color=BLACK, sb=0, sa=4):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after = Pt(sa)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    style_run(r, size=size, bold=bold, italic=italic, color=color)
    return p

def set_cell_borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="9CA3AF"/>'
        '</w:tcBorders>'
    ))

def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        '</w:tcMar>'
    ))

def set_cell_shading(cell, hex_color):
    cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def add_qa_table(doc, rows):
    tbl = doc.add_table(rows=len(rows) + 1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    widths = [1.3, 5.2, 10.9]
    headers = ['Câu', 'Câu hỏi Phản biện của Ban Giám khảo', 'Trọng tâm Trả lời Chuẩn (Ngắn gọn — Trúng điểm — Có minh chứng thật)']

    hdr = tbl.rows[0]
    hdr._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))
    hdr._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
    for j, h in enumerate(headers):
        c = hdr.cells[j]
        c.width = Cm(widths[j])
        set_cell_borders(c)
        set_cell_margins(c)
        set_cell_shading(c, 'F3F4F6')
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        style_run(r, size=11, bold=True, color=BURGUNDY)

    for i, (num, q, ans) in enumerate(rows):
        row = tbl.rows[i + 1]
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
        vals = [num, q, ans]
        for j, v in enumerate(vals):
            c = row.cells[j]
            c.width = Cm(widths[j])
            c.vertical_alignment = WD_ALIGN_VERTICAL.TOP
            set_cell_borders(c)
            set_cell_margins(c)
            lines = v.split('\n')
            for li, line in enumerate(lines):
                p = c.paragraphs[0] if li == 0 else c.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 0 else WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.12
                r = p.add_run(line)
                style_run(r, size=11, bold=(j in (0, 1)), color=BURGUNDY if j == 0 else BLACK)

def main():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(1.5)
    sec.bottom_margin = Cm(1.5)
    sec.left_margin = Cm(1.8)
    sec.right_margin = Cm(1.8)

    add_p(doc, 'TRƯỜNG THPT NGUYỄN DU (XÃ NGÃI GIAO) — ĐỘI THI AUTOBIZ AI (LV03)', size=11, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color=MUTED, sa=2)
    add_p(doc, 'BỘ 20 CÂU HỎI & ĐÁP ÁN PHẢN BIỆN BAN GIÁM KHẢO (CẬP NHẬT V1.1)', size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color=BURGUNDY, sa=3)
    add_p(doc, 'Thành viên trả lời: Nguyễn Như Vương Gia (Kỹ thuật/AI) & Nguyễn Khang Thịnh (Thị trường/Tài chính) | GVHD: Thầy Đỗ Xuân Hưng', size=11, bold=True, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, color=BLACK, sa=10)

    add_p(doc, 'NHÓM 1: SẢN PHẨM, ĐỐI THỦ & TÍNH THỰC TẾ (KHANG THỊNH CHỦ TRÌ)', size=12, bold=True, color=BURGUNDY, sb=6, sa=4)
    add_qa_table(doc, [
        ('01', 'AutoBiz AI khác gì so với ChatGPT, Sapo hay KiotViet?',
         '- ChatGPT chỉ viết chữ rời; Sapo/KiotViet tập trung quản lý kho & hóa đơn tại quầy.\n- AutoBiz AI là chuỗi khép kín: Bóc tách URL / Extension AB lấy ảnh -> Gemini AI 5 kênh (FB, Instagram, TikTok, Zalo, Shopee) -> Đăng trực tiếp -> Shortlink /r/:code & Trang Link Bio /u/:username -> Đối soát đơn thật (Webhook/CSV) & Thanh toán hoa hồng VietQR.\n- Giá 199k/tháng giúp shop tiết kiệm ~80% so với mua ghép 3 công cụ rời (~1 triệu/tháng).'),
        ('02', 'Các em mới học THPT, làm sao chứng minh sản phẩm dùng được thật ngoài đời?',
         '- Hệ thống đang chạy live trên Vercel + Cơ sở dữ liệu đám mây Supabase Postgres tại https://autobiz-ai-seven.vercel.app.\n- Em Nguyễn Như Vương Gia đã triển khai chạy thử trên Fanpage thật Laptop Vương Gia (ID: 1154184381110692), bóc tách trực tiếp sản phẩm thật từ Shopee (VD: Xiaomi 17T Pro) và vượt qua 71/71 bài kiểm thử tự động.'),
        ('03', 'Vì sao chọn cả 2 đối tượng B2B (chủ shop) và B2C (CTV/sinh viên)?',
         '- Khảo sát thực địa N = 10.920 (5.240 shop B2B và 5.680 người mua/CTV B2C) cho thấy 94% hai phía đều cần nhau: shop nhỏ thiếu nhân sự đăng bài, học sinh/sinh viên muốn kiếm thêm không cần vốn nhập hàng.\n- AutoBiz AI còn hỗ trợ cả luồng Chủ shop tự bán (không CTV) và KOC làm Affiliate sàn độc lập qua khảo sát phân luồng khi đăng ký.'),
        ('04', 'Nếu shop chỉ bán trên Facebook & Instagram mà không dùng TikTok/Zalo thì sao?',
         '- Trong mục Kết Nối Kênh & Cài Đặt (Tab 1), mỗi tài khoản có công tắc Bật/Tắt độc lập cho 5 nền tảng.\n- Khi tắt TikTok/Zalo, Studio tự ẩn tab và API phân phối tự bỏ qua kênh đó, không tốn quota AI sinh nội dung thừa.'),
        ('05', 'Làm sao cạnh tranh nếu đối thủ lớn sao chép tính năng?',
         '- Lợi thế đi đầu ở phân khúc hộ kinh doanh siêu nhỏ địa phương và mạng lưới CTV học sinh, sinh viên với chi phí cực thấp (199k) nhờ kiến trúc Serverless (Vercel + Supabase) cùng giao diện Minimalist FinTech Sáng/Tối dễ dùng ngay trong 3 phút.')
    ])

    add_p(doc, 'NHÓM 2: KỸ THUẬT AI, SỐ LIỆU FINTECH, BẢO MẬT & PHÁP LÝ (VƯƠNG GIA CHỦ TRÌ)', size=12, bold=True, color=BURGUNDY, sb=10, sa=4)
    add_qa_table(doc, [
        ('06', 'Hệ thống dùng AI ở mức nào? Có phụ thuộc hoàn toàn vào AI không?',
         '- Gemini AI chỉ đóng vai trò trợ lý soạn thảo nội dung 5 kênh & bóc tách bảng giá (Human-in-the-loop: con người luôn duyệt trước khi đăng).\n- Toàn bộ lõi xác thực scrypt/RBAC 3 cấp, URL Extractor, Link Bio SSR, Shortlink /r/:code, lọc spam click, Webhook/CSV đối soát đơn, VietQR và Supabase Postgres đều do nhóm tự lập trình bằng Node.js.'),
        ('07', 'Nếu khách chỉ bấm link /r/:code mà KHÔNG mua hàng, hoa hồng tính thế nào?',
         '- Đây là điểm nhóm đã nâng cấp ở v1.1: mặc định bật Chế độ Tài chính thực (strictConfirmedOnly = true) -> Click không mua = 0 đ Doanh thu & 0 đ Hoa hồng.\n- Tiền hoa hồng chỉ được cộng khi có đơn hàng giao thành công (status: completed) xác nhận từ 1 trong 3 nguồn: Webhook POS (Pancake/Sapo/Haravan), Upload file báo cáo .CSV/.XLSX từ Shopee/TikTok, hoặc Chủ shop bấm Chốt đơn thủ công — có chống cộng trùng theo orderId.'),
        ('08', 'Nếu CTV tự bấm link nhiều lần (hoặc dùng bot) để gian lận lượt click thì sao?',
         '- Bộ lọc thông minh ở GET /r/:code tự nhận diện và chặn cộng click đối với Bot Preview (FacebookExternalHit, ZaloBot, TelegramBot...) nhưng vẫn redirect 302 để không vỡ ảnh xem trước.\n- Đồng thời áp dụng chống click đúp 60 giây theo dấu vân tay IP + Thiết bị (cho phép 2 điện thoại thật chung Wi-Fi và trình duyệt trong Zalo vẫn được đếm độc lập), hiển thị minh bạch số lượt bị lọc spam.'),
        ('09', 'Hệ thống làm sao biết người mua từ Website riêng là do CTV nào giới thiệu?',
         '- Khi khách bấm link /r/:code, hệ thống tự động gắn tham số ?utm_source=...&sub_id=<mã_CTV> vào URL đích.\n- Chủ shop dán 1 dòng mã nhúng <script src=".../ab-track.js?days=14"></script> (có sẵn trong Cài đặt Tab 4) vào Website bán hàng để tự lưu Cookie 7–30 ngày; khi khách đặt hàng, hệ thống gửi sub_id về Webhook để chốt hoa hồng tự động.'),
        ('10', 'Token Fanpage, Mật khẩu & Dữ liệu giữa các Shop được bảo mật ra sao?',
         '- Mật khẩu băm 1 chiều bằng thuật toán scrypt + salt ngẫu nhiên (không lưu chữ thường); chống dò mật khẩu Brute-Force (khóa tạm HTTP 429 sau 5 lần sai).\n- Cô lập dữ liệu Multi-Tenant 100% trên Supabase Postgres: Shop A không thể xem kho hàng, doanh thu hay duyệt rút tiền của Shop B (chặn HTTP 403). Mọi API nhạy cảm không có JWT bị chặn HTTP 401.'),
        ('11', 'Extension lấy ảnh từ Shopee/TikTok có vi phạm bản quyền hay khóa nick không?',
         '- AutoBiz AI chỉ hỗ trợ bóc tách thông tin & ảnh sản phẩm để người bán/CTV tiếp thị lại đúng mặt hàng đó kèm link gốc về chính gian hàng trên sàn.\n- Việc đăng bài sử dụng Official Meta Graph API v21.0 (Facebook & Instagram Business), không dùng trình duyệt giả lập spam.'),
        ('12', 'Nếu hệ thống có 450+ CTV cùng lúc thì có bị chậm hoặc mất dữ liệu không?',
         '- Nhóm đã chạy thử tải 452 CTV (21.486 clicks, 812 đơn, GMV > 3,01 tỷ đồng) với tốc độ tổng hợp báo cáo chỉ 5 mili-giây.\n- Dữ liệu hiện đã đồng bộ bền vững trên Supabase Postgres (Singapore) kết hợp hàng đợi ghi tuần tự chống xung đột đồng thời.'),
        ('13', 'Thanh toán hoa hồng cho CTV qua VietQR hoạt động thế nào? Có giữ tiền của khách không?',
         '- AutoBiz AI không thu giữ tiền trung gian (không vi phạm pháp lý trung gian thanh toán). Khi CTV gửi yêu cầu rút trong giới hạn số dư thật (>= 50.000đ), hệ thống tự sinh ảnh mã VietQR chuẩn Napas điền sẵn STK + số tiền + nội dung; Chủ shop quét chuyển khoản trực tiếp và bấm xác nhận Đã thanh toán.')
    ])

    add_p(doc, 'NHÓM 3: TÀI CHÍNH, HÒA VỐN, KIỂM THỬ & TÁC ĐỘNG XÃ HỘI (KHANG THỊNH & VƯƠNG GIA)', size=12, bold=True, color=BURGUNDY, sb=10, sa=4)
    add_qa_table(doc, [
        ('14', 'Con số 520 triệu doanh thu năm 1 và hòa vốn tháng thứ 5 tính như thế nào?',
         '- Chi phí năm đầu 220 triệu (Cloud Serverless 36tr, API Gemini 44tr, Vận hành & hỗ trợ 140tr) -> trung bình ~18,3 triệu/tháng.\n- Chỉ cần đạt mốc ~110 shop dùng gói Pro 199.000đ/tháng (~21,9 triệu/tháng) kết hợp phí chia sẻ Affiliate là vượt điểm hòa vốn vào tháng thứ 5.'),
        ('15', 'Chiến lược cụ thể để có được 110 shop đầu tiên là gì?',
         '- Áp dụng mô hình Freemium: miễn phí 30 ngày / 50 bài AI đầu tiên cho các hộ kinh doanh tại xã Ngãi Giao & khu vực lân cận trải nghiệm ra đơn thật trên Fanpage/Link Bio trước khi thu phí 199k/tháng.'),
        ('16', 'Tại sao biên lợi nhuận ròng lại cao (57,7% lên 64%)?',
         '- Kiến trúc Serverless (Vercel + Supabase Postgres) giúp chi phí biên cho mỗi khách hàng mới tăng thêm rất thấp; người dùng tự đăng ký, tự cấu hình cài đặt 4 tab và sử dụng ngay mà không cần đội kỹ thuật lắp đặt tận nơi.'),
        ('17', 'Rủi ro lớn nhất của dự án là gì và cách kiểm soát?',
         '- Rủi ro pháp nhân (< 18 tuổi): giai đoạn thi miễn phí hoàn toàn; khi thương mại hóa đăng ký Hộ kinh doanh đứng tên người giám hộ hợp pháp.\n- Rủi ro API bên thứ ba: đã có cơ chế fallback đa model Gemini, đóng gói bài sẵn copy đăng tay và nhập báo cáo CSV/XLSX khi sàn thay đổi API.'),
        ('18', 'Nhóm đã kiểm thử hệ thống kỹ đến mức nào trước khi đem dự thi?',
         '- Nhóm tự lập quy trình kiểm thử tự động gồm 71 bài test (38 case QA toàn diện + 17 E2E đóng gói + 16 nghiệp vụ v1.1) chạy trực tiếp trên cả Local lẫn Production thật.\n- Đặc biệt vòng test thực tế đã phát hiện và vá ngay 1 lỗ hổng xác thực mặc định trên API quản trị (PROD-06), đạt 71/71 PASS (100%).'),
        ('19', 'Vì sao nhóm chọn giao diện tối giản Dual Theme (Sáng/Tối) thay vì nhiều hiệu ứng màu mè?',
         '- Chủ shop và CTV phải nhìn bảng số liệu tài chính nhiều giờ mỗi ngày. Thiết kế Minimalist FinTech (chuẩn shadcn/ui, Linear, Vercel) với Dark Mode mặc định dịu mắt, số thẳng cột tabular-nums, Skeleton Shimmer mượt mà và tự tắt hiệu ứng nặng trên điện thoại (Calm Mobile Performance) giúp làm việc bền bỉ, không lỗi hiển thị.'),
        ('20', 'Thông điệp & đóng góp thực chất của 2 học sinh THPT đối với cộng đồng?',
         '- Giúp hộ kinh doanh truyền thống tiếp cận AI và chuyển đổi số minh bạch với chi phí bình dân (199k), đồng thời mở ra mô hình học đi đôi với hành, trích 5% thặng dư tài trợ tài khoản miễn phí cho CLB Khởi nghiệp học đường.')
    ])

    doc.save(OUT_PROJECT)
    try:
        doc.save(OUT_DESKTOP)
        print('Saved Q&A BGK (20 câu):', OUT_DESKTOP)
    except PermissionError:
        alt = OUT_DESKTOP.replace('.docx', '_v2.docx')
        doc.save(alt)
        print('Saved Q&A BGK alt:', alt)
    print('Saved Q&A BGK (repo):', OUT_PROJECT)

if __name__ == '__main__':
    main()
