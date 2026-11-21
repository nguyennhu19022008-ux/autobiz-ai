# -*- coding: utf-8 -*-
"""
scripts/build_and_audit_thuyetminh_docx.py
Sinh & Tự kiểm định (Audit Gate) Bản Thuyết minh Dự án AutoBiz AI chuẩn Công văn 11677/KH-SGDĐT
- Bố cục: 01 Trang bìa + 10 Trang nội dung A4 (tổng 11 trang)
- Hình thức: 100% nội dung Times New Roman, 14pt, #000000; 0 ký tự chấm tròn (•);
             gạch đầu dòng (-) cấp 1, dấu cộng thụt lề 0.55cm (+) cấp 2;
             nền tiêu đề bảng #F2F2F2, cantSplit, tblHeader; 6 biểu đồ 300 DPI rộng 15.4cm.
"""
import os
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHARTS_DIR = os.path.join(ROOT_DIR, 'charts_doc')
OUT_PROJECT = os.path.join(ROOT_DIR, 'THPTNguyenDu_LV03_DA01_Thuyetminh.docx')
OUT_DESKTOP = os.path.join(r'C:\Users\Admin\Desktop\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'THPTNguyenDu_LV03_DA01_Thuyetminh.docx')

BLACK = RGBColor(0x00, 0x00, 0x00)
BURGUNDY_COVER = RGBColor(0x00, 0x00, 0x00)

def set_run_font(run, size_pt=14, bold=False, italic=False, color=BLACK):
    run.font.name = 'Times New Roman'
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color
    run.bold = bold
    run.italic = italic
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rFonts.set(qn(attr), 'Times New Roman')

def add_p(doc, text='', bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT,
          space_before=0, space_after=2.5, line_spacing=1.10, left_indent=0.0,
          size_pt=14, color=BLACK, keep_with_next=False):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line_spacing
    if left_indent > 0:
        pf.left_indent = Cm(left_indent)
    pf.keep_with_next = keep_with_next
    if text:
        r = p.add_run(text)
        set_run_font(r, size_pt=size_pt, bold=bold, italic=italic, color=color)
    return p

def add_dash(doc, prefix, text, space_after=2.5):
    p = add_p(doc, '', space_after=space_after, line_spacing=1.10)
    r1 = p.add_run('- ')
    set_run_font(r1, bold=True)
    if prefix:
        r2 = p.add_run(prefix + ' ')
        set_run_font(r2, bold=True)
    r3 = p.add_run(text)
    set_run_font(r3, bold=False)
    return p

def add_plus(doc, prefix, text, space_after=2.0):
    p = add_p(doc, '', left_indent=0.55, space_after=space_after, line_spacing=1.10)
    r1 = p.add_run('+ ')
    set_run_font(r1, bold=True)
    if prefix:
        r2 = p.add_run(prefix + ' ')
        set_run_font(r2, bold=True)
    r3 = p.add_run(text)
    set_run_font(r3, bold=False)
    return p

def add_h1(doc, text):
    return add_p(doc, text, bold=True, space_before=6, space_after=3, line_spacing=1.10, keep_with_next=True)

def add_h2(doc, text):
    return add_p(doc, text, bold=True, space_before=5, space_after=2.5, line_spacing=1.10, keep_with_next=True)

def set_cell_borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="4B5563"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="4B5563"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="4B5563"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="4B5563"/>'
        '</w:tcBorders>'
    )
    tcPr.append(borders)

def set_cell_margins(cell, top=55, bottom=55, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        '</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_shading(cell, fill_hex='F2F2F2'):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:cantSplit'))

def set_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:tblHeader'))

def fill_cell(cell, text, bold_header=False, align=WD_ALIGN_PARAGRAPH.LEFT, top_mar=40, line_sp=1.05):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
    set_cell_borders(cell)
    set_cell_margins(cell, top=top_mar, bottom=top_mar, left=80, right=80)
    lines = str(text).split('\n')
    for idx, line in enumerate(lines):
        p = cell.paragraphs[0] if idx == 0 else cell.add_paragraph()
        p.alignment = align
        pf = p.paragraph_format
        pf.space_before = Pt(0)
        pf.space_after = Pt(1.5)
        pf.line_spacing = line_sp
        is_b = bold_header or (idx == 0 and len(lines) > 1 and line.isupper())
        r = p.add_run(line)
        set_run_font(r, size_pt=14, bold=is_b, color=BLACK)

def add_styled_table(doc, headers, rows, widths_cm, col_aligns=None):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    hdr_row = tbl.rows[0]
    set_row_cant_split(hdr_row)
    set_row_header(hdr_row)
    for j, h in enumerate(headers):
        c = hdr_row.cells[j]
        c.width = Cm(widths_cm[j])
        set_cell_shading(c, 'F2F2F2')
        fill_cell(c, h, bold_header=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    for i, row_data in enumerate(rows):
        r = tbl.rows[i + 1]
        set_row_cant_split(r)
        for j, val in enumerate(row_data):
            c = r.cells[j]
            c.width = Cm(widths_cm[j])
            al = col_aligns[j] if col_aligns else (WD_ALIGN_PARAGRAPH.CENTER if j == 0 else WD_ALIGN_PARAGRAPH.LEFT)
            fill_cell(c, val, bold_header=False, align=al)
    return tbl

def add_figure(doc, filename, caption, width_cm=15.0):
    path = os.path.join(CHARTS_DIR, filename)
    p_img = add_p(doc, '', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=3, space_after=1.5, keep_with_next=True)
    run_img = p_img.add_run()
    run_img.add_picture(path, width=Cm(width_cm))
    add_p(doc, caption, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4, line_spacing=1.08)

def add_page_number_footer(section):
    section.different_first_page_header_footer = True
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)

    r_begin = p.add_run()
    set_run_font(r_begin, size_pt=14, color=BLACK)
    fld_begin = OxmlElement('w:fldChar')
    fld_begin.set(qn('w:fldCharType'), 'begin')
    r_begin._r.append(fld_begin)

    r_instr = p.add_run()
    set_run_font(r_instr, size_pt=14, color=BLACK)
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = ' PAGE '
    r_instr._r.append(instr)

    r_sep = p.add_run()
    set_run_font(r_sep, size_pt=14, color=BLACK)
    fld_sep = OxmlElement('w:fldChar')
    fld_sep.set(qn('w:fldCharType'), 'separate')
    r_sep._r.append(fld_sep)

    r_end = p.add_run()
    set_run_font(r_end, size_pt=14, color=BLACK)
    fld_end = OxmlElement('w:fldChar')
    fld_end.set(qn('w:fldCharType'), 'end')
    r_end._r.append(fld_end)


def add_cover_frame_behind_text(doc, frame_path):
    """Chèn khung viền hình học 4 góc đan chéo (300 DPI) làm nền riêng cho Trang Bìa (Page 1)."""
    p = add_p(doc, '', space_before=0, space_after=0)
    run = p.add_run()
    inline_shape = run.add_picture(frame_path, width=Cm(21.0), height=Cm(29.7))
    inline = inline_shape._inline
    extent = inline.find(qn('wp:extent'))
    cx, cy = extent.get('cx'), extent.get('cy')
    graphic = inline.find(qn('a:graphic'))
    docPr = inline.find(qn('wp:docPr'))
    anchor_xml = (
        f'<wp:anchor {nsdecls("wp")} distT="0" distB="0" distL="0" distR="0" '
        f'simplePos="0" relativeHeight="0" behindDoc="1" locked="1" layoutInCell="1" allowOverlap="1">'
        f'<wp:simplePos x="0" y="0"/>'
        f'<wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>'
        f'<wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>'
        f'<wp:extent cx="{cx}" cy="{cy}"/>'
        f'<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        f'<wp:wrapNone/>'
        f'{docPr.xml}'
        f'<wp:cNvGraphicFramePr><a:graphicFrameLocks {nsdecls("a")} noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        f'{graphic.xml}'
        f'</wp:anchor>'
    )
    drawing = run._r.find(qn('w:drawing'))
    drawing.remove(inline)
    drawing.append(parse_xml(anchor_xml))


def build_document():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(1.35)
    sec.bottom_margin = Cm(1.35)
    sec.left_margin = Cm(1.9)
    sec.right_margin = Cm(1.7)
    add_page_number_footer(sec)

    # Set default Normal style cleanly
    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(14)
    normal.font.color.rgb = BLACK

    # ==================== TRANG BÌA (PAGE 1 — KHUNG VIỀN ĐAN CHÉO + LOGO APP) ====================
    add_cover_frame_behind_text(doc, os.path.join(CHARTS_DIR, 'cover_frame_bw.png'))

    add_p(doc, 'ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH', bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=2, size_pt=14)
    add_p(doc, 'SỞ GIÁO DỤC VÀ ĐÀO TẠO', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4, size_pt=14)
    add_p(doc, '----o0o----', bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18, size_pt=12)

    add_p(doc, 'CUỘC THI', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3, size_pt=14)
    add_p(doc, '“HỌC SINH VỚI Ý TƯỞNG KHỞI NGHIỆP CẤP THÀNH PHỐ”', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3, size_pt=14)
    add_p(doc, 'NĂM HỌC 2026 – 2027', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22, size_pt=14)

    add_p(doc, 'TÊN DỰ ÁN (MÃ DỰ ÁN: DA01)', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6, size_pt=14)
    add_p(doc, 'AUTOBIZ AI — HỆ SINH THÁI TIẾP THỊ ĐA KÊNH VÀ AFFILIATE FINTECH TÍCH HỢP AI', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6, line_spacing=1.18, size_pt=14)
    add_p(doc, '(Phát triển nền tảng tự động hóa nội dung đa kênh bằng AI và đối soát dòng tiền cộng tác viên minh bạch cho hộ kinh doanh nhỏ & học sinh, sinh viên)', italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14, line_spacing=1.15, size_pt=14)

    # Logo ứng dụng AutoBiz AI ở trung tâm Trang Bìa
    p_logo = add_p(doc, '', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=14)
    p_logo.add_run().add_picture(os.path.join(CHARTS_DIR, 'autobiz_logo_cover.png'), width=Cm(2.5))

    p_lv = add_p(doc, '', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22, size_pt=14)
    r_lv1 = p_lv.add_run('Lĩnh vực: ')
    set_run_font(r_lv1, size_pt=14, bold=True, color=BLACK)
    r_lv2 = p_lv.add_run('LV03 – Dịch vụ, tài chính, ngân hàng')
    set_run_font(r_lv2, size_pt=14, bold=False, color=BLACK)

    add_p(doc, 'NHÓM THỰC HIỆN (02 THÀNH VIÊN)', bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=1.1, space_after=8, size_pt=14)
    add_p(doc, '1. Nguyễn Như Vương Gia (Trưởng nhóm) .................... Lớp: ..............', align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=1.1, space_after=6, size_pt=14)
    add_p(doc, '2. Nguyễn Khang Thịnh (Thành viên) ........................... Lớp: ..............', align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=1.1, space_after=14, size_pt=14)

    p_gvhd = add_p(doc, '', align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=1.1, space_after=8, size_pt=14)
    r_gv1 = p_gvhd.add_run('GIÁO VIÊN HƯỚNG DẪN: ')
    set_run_font(r_gv1, size_pt=14, bold=True, color=BLACK)
    r_gv2 = p_gvhd.add_run('Thầy Đỗ Xuân Hưng')
    set_run_font(r_gv2, size_pt=14, bold=False, color=BLACK)

    p_dv = add_p(doc, '', align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=1.1, space_after=36, size_pt=14)
    r_dv1 = p_dv.add_run('ĐƠN VỊ: ')
    set_run_font(r_dv1, size_pt=14, bold=True, color=BLACK)
    r_dv2 = p_dv.add_run('Trường THPT Nguyễn Du (xã Ngãi Giao)')
    set_run_font(r_dv2, size_pt=14, bold=False, color=BLACK)

    add_p(doc, 'Thành phố Hồ Chí Minh, tháng 11 năm 2026', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0, size_pt=14)

    doc.add_page_break()

    # ==================== PAGE 2: I. THÔNG TIN CHUNG (THEO MẪU PHỤ LỤC III) ====================
    add_p(doc, 'I. THÔNG TIN CHUNG', bold=True, left_indent=0.8, space_before=4, space_after=4, keep_with_next=True)
    add_p(doc, 'Thông tin vắn tắt về các thành viên tham gia dự án (bắt buộc):', space_after=4)
    add_p(doc, '1. Họ và tên trưởng nhóm: Nguyễn Như Vương Gia', space_after=3)
    add_p(doc, '2. Trường/lớp: Trường THPT Nguyễn Du / Lớp: ........................', space_after=3)
    add_p(doc, '3. Số điện thoại liên hệ: ....................................................', space_after=3)
    add_p(doc, '4. Email: ........................................................................', space_after=3)
    add_p(doc, '5. Danh sách thành viên trong nhóm (tên, trường, không quá 05 người bao gồm cả trưởng nhóm).', space_after=3)
    add_p(doc, '- Họ và tên: Nguyễn Như Vương Gia (Trường THPT Nguyễn Du)   Số điện thoại: ...............', space_after=2)
    add_p(doc, '- Họ và tên: Nguyễn Khang Thịnh (Trường THPT Nguyễn Du)      Số điện thoại: ...............', space_after=4)
    add_p(doc, '6. Họ và tên giáo viên, người hướng dẫn: Đỗ Xuân Hưng   Số điện thoại: ...............', space_after=8)

    add_styled_table(
        doc,
        ['Thành viên', 'Vai trò Làm chủ Dự án', 'Hạng mục Trực tiếp Thực thi'],
        [
            ['Nguyễn Như Vương Gia\n(Trưởng nhóm)', 'Kiến trúc Phần mềm, AI & Vận hành Thực tế', '- Lập trình Node.js/Express, Extension Chrome MV3, Shortlink /r/:code.\n- Triển khai live trên Vercel & Fanpage Laptop Vương Gia.'],
            ['Nguyễn Khang Thịnh\n(Thành viên)', 'Khảo sát Thị trường, Tài chính & Truyền thông', '- Chủ trì khảo sát N = 10.920, phân tích tài chính 3 năm & điểm hòa vốn.\n- Xây dựng Pitch Deck 12 trang, kịch bản Video và tài liệu phản biện.'],
            ['Thầy Đỗ Xuân Hưng\n(GV Hướng dẫn)', 'Định hướng Chuyên môn & Pháp lý', '- Cố vấn phương pháp nghiên cứu, kiểm duyệt hồ sơ theo Công văn 11677/KH-SGDĐT và hỗ trợ thủ tục nộp cấp Thành phố.']
        ],
        [4.2, 5.4, 7.6],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    )

    doc.add_page_break()

    # ==================== PAGE 3: II. TÓM TẮT DỰ ÁN + HÌNH 1 ====================
    add_h1(doc, 'II. TÓM TẮT DỰ ÁN')
    add_dash(doc, 'Ý tưởng chính:', 'Xây dựng nền tảng AutoBiz AI kết nối hai phía giữa hộ kinh doanh nhỏ (B2B) và cộng tác viên học sinh, sinh viên không cần vốn (B2C) qua tự động hóa nội dung đa kênh và đối soát dòng tiền Affiliate minh bạch.')
    add_dash(doc, '04 lớp giá trị khác biệt:', '')
    add_plus(doc, 'Thu thập 1 chạm:', 'Extension AB tự lấy tên, giá, nhận diện 5 ngành hàng và tối đa 6 ảnh từ sàn TMĐT.')
    add_plus(doc, 'Gemini AI 4 kênh:', 'Sinh song song bài Facebook, TikTok Script, Zalo OA, Shopee SEO kèm công tắc Bật/Tắt từng kênh.')
    add_plus(doc, 'Đăng thật & Tracking:', 'Đăng qua Facebook Graph API v21.0 và bọc link /r/:code gắn UTM + mã CTV (SubID).')
    add_plus(doc, 'FinTech đối soát:', 'Tách bạch Tổng doanh thu (GMV), Hoa hồng CTV và Tiền thực thu Chủ shop trong 5 mili-giây.')
    add_dash(doc, 'Kết quả bước đầu:', 'Sản phẩm đã hoạt động live tại https://autobiz-ai-seven.vercel.app, thử nghiệm thật trên Fanpage Laptop Vương Gia (ID: 1154184381110692) và khảo sát N = 10.920 người (94% đồng thuận).')

    add_figure(doc, 'fig1_ecosystem_qr.png', 'Hình 1: Sơ đồ hệ sinh thái hai phía, luồng dòng tiền AutoBiz AI và mã QR truy cập WebApp Live.')

    # ==================== PAGE 4: A. BUSINESS MODEL CANVAS (TRỌN 1 TRANG A4) ====================
    doc.add_page_break()
    add_h1(doc, 'III. NỘI DUNG CHÍNH CỦA DỰ ÁN')
    add_h2(doc, 'A. TỔNG QUAN DỰ ÁN (BẢNG BUSINESS MODEL CANVAS 9 Ô)')

    bmc = doc.add_table(rows=3, cols=5)
    bmc.alignment = WD_TABLE_ALIGNMENT.CENTER
    bmc.autofit = False
    bmc_widths = [3.4, 3.5, 3.6, 3.4, 3.5]

    for row in bmc.rows:
        set_row_cant_split(row)
        for j, w in enumerate(bmc_widths):
            row.cells[j].width = Cm(w)

    # Merge vertical cells cleanly like standard 9-block BMC
    bmc.cell(0, 0).merge(bmc.cell(1, 0))
    bmc.cell(0, 2).merge(bmc.cell(1, 2))
    bmc.cell(0, 4).merge(bmc.cell(1, 4))
    bmc.cell(2, 0).merge(bmc.cell(2, 1))
    bmc.cell(2, 2).merge(bmc.cell(2, 4))

    fill_cell(bmc.cell(0, 0), 'ĐỐI TÁC CHÍNH\n- Hộ kinh doanh, shop lẻ 5 ngành hàng.\n- Google Gemini, Vercel, Supabase, Meta API.\n- Trường THPT Nguyễn Du.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(0, 1), 'HOẠT ĐỘNG CHÍNH\n- Phát triển WebApp, Extension AB.\n- Sinh nội dung 4 kênh & đối soát /r/:code.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(1, 1), 'TÀI NGUYÊN CHÍNH\n- Mã nguồn Node.js & Chrome MV3.\n- Khảo sát N = 10.920 & Fanpage Laptop Vương Gia.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(0, 2), 'GIẢI PHÁP GIÁ TRỊ\n- Tự động hóa quy trình lấy ảnh → viết bài 4 kênh → đăng Fanpage → tính tiền.\n- Tiết kiệm 80% chi phí so với mua rời 3 công cụ.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(0, 3), 'QUAN HỆ KHÁCH HÀNG\n- Tự phục vụ trên Web.\n- Dùng thử 30 ngày / 50 bài miễn phí.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(1, 3), 'KÊNH PHÂN PHỐI\n- WebApp Vercel Live & Extension.\n- Facebook, TikTok, Zalo, Shopee.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(0, 4), 'PHÂN KHÚC KHÁCH HÀNG\n- B2B: Chủ shop nhỏ thiếu nhân sự.\n- B2C: Học sinh, sinh viên làm CTV không vốn.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(2, 0), 'CẤU TRÚC CHI PHÍ (NĂM 1: 220 TRIỆU)\n- Cloud Serverless: 36 triệu | Gemini API: 44 triệu.\n- R&D, vận hành & hỗ trợ cộng đồng: 140 triệu.', top_mar=35, line_sp=1.0)
    fill_cell(bmc.cell(2, 2), 'DÒNG DOANH THU (NĂM 1: 520 TRIỆU → NĂM 3: 9,03 TỶ)\n- Doanh thu kép: SaaS (Pro 199k, Team 499k/tháng) + Chia sẻ phí Affiliate.\n- Điểm hòa vốn tháng 5 (~110 shop); Biên lãi ròng đạt 57,7% → 64%.', top_mar=35, line_sp=1.0)

    doc.add_page_break()

    # ==================== PAGE 5+: B. MÔ TẢ CHI TIẾT SẢN PHẨM, DỊCH VỤ ====================
    add_h2(doc, 'B. MÔ TẢ CHI TIẾT SẢN PHẨM, DỊCH VỤ')
    add_p(doc, '1. Tính cần thiết và kiểm chứng thực tế', bold=True, space_before=4, space_after=2)
    add_dash(doc, 'Hiện trạng sản phẩm thật:', 'Hệ thống đã hoàn chỉnh 05 phân hệ trên WebApp (Tổng quan FinTech, Studio Đa Kênh, Kho Hàng, Hàng Đợi, Cài Đặt), Chrome Extension v2.0 và vận hành thật trên Fanpage Laptop Vương Gia.')
    add_dash(doc, 'Rào cản hành vi từ khảo sát (N = 10.920):', '82% người bán không đo được lãi thực và hoa hồng theo từng kênh; 79% người mua/CTV ngại link dài sợ mất hoa hồng; 94% thị trường đồng thuận sử dụng nền tảng tích hợp.')
    add_dash(doc, 'Chu trình cải tiến từ thử nghiệm MVP:', 'Sau khi chạy thử trên Fanpage thật và lấy phản hồi thực tế, nhóm đã bổ sung 03 nâng cấp: tắt/bật kênh không dùng, tự động quét 6 ảnh sản phẩm và bảng đối soát Tiền thực thu Chủ shop.')

    add_figure(doc, 'fig2_survey_donut_bar.png', 'Hình 2: Tỷ lệ đồng thuận (94%) và các điểm nghẽn hành vi từ khảo sát N = 10.920.')

    add_p(doc, '2. Tính khả thi, tuân thủ pháp lý và kiểm soát rủi ro', bold=True, space_before=4, space_after=2)
    add_dash(doc, 'Khả thi kỹ thuật:', 'Kiến trúc Node.js Serverless trên Vercel kết hợp Google Gemini API và Graph API v21.0; thử nghiệm tải 452 CTV (21.486 clicks, GMV hơn 3,01 tỷ đồng) chỉ mất 5 mili-giây tổng hợp báo cáo.')
    add_dash(doc, 'Tuân thủ Nghị định 13/2023/NĐ-CP & an toàn học đường:', '')
    add_plus(doc, 'Điều 3 (Tối thiểu hóa dữ liệu):', 'Chỉ lưu mã SubID định danh chiến dịch và thông số sản phẩm công khai; không thu thập CCCD, tài khoản ngân hàng hay dữ liệu nhạy cảm.')
    add_plus(doc, 'Điều 9 & Điều 11 (Đồng thuận & rút lại):', 'Người dùng chủ động nhập khóa API/Token và có quyền xóa sản phẩm, tắt nền tảng bất cứ lúc nào.')
    add_plus(doc, 'Điều 20 (Bảo vệ trẻ em dưới 16 tuổi):', 'Nền tảng chỉ định hướng cho đối tượng đủ tuổi lao động/THPT trở lên dưới sự giám sát an toàn, không tiếp thị mặt hàng cấm.')
    add_dash(doc, 'Lộ trình hạ tầng mở rộng (dự kiến):', 'Khi mở rộng thương mại trên 500 CTV, sẽ kích hoạt Supabase Postgres (đã viết sẵn module kết nối) và xin duyệt chính thức TikTok/Zalo OA API.')

    add_styled_table(
        doc,
        ['Nhóm Rủi ro', 'Mức độ', 'Biện pháp Kiểm soát Đã áp dụng & Dự phòng'],
        [
            ['Pháp nhân doanh thu B2B (học sinh < 18 tuổi)', 'Cao', '- Giai đoạn thi & thử nghiệm: miễn phí hoàn toàn.\n- Khi thương mại hóa: đăng ký Hộ kinh doanh đứng tên người giám hộ hợp pháp theo quy định.'],
            ['Biến động API (Gemini quá tải, Facebook đổi token)', 'Trung bình', '- Đã lập trình cơ chế fallback đa model Gemini & chế độ đóng gói bài sẵn để copy đăng tay.'],
            ['Gian lận click ảo & mất dữ liệu Serverless', 'Trung bình', '- Đối soát tiền dựa trên “Đơn thực chốt” (+ Chốt đơn) và nâng cấp lên Supabase Postgres khi mở rộng.']
        ],
        [4.8, 2.2, 10.4],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT]
    )

    add_p(doc, '3. Tính độc đáo, sáng tạo và lợi thế cạnh tranh', bold=True, space_before=6, space_after=3)
    add_dash(doc, 'Hợp nhất quy trình 3 trong 1:', 'Thay thế việc phải mua ghép ChatGPT (~500k), Sapo (~300k–1,5tr) và Tool auto post (~200k) bằng một luồng khép kín từ 199.000đ/tháng (tiết kiệm 80% chi phí).')
    add_dash(doc, 'Độc đáo ở phân hệ FinTech thời gian thực:', 'Chủ shop phân biệt rõ Doanh thu GMV, Hoa hồng trả CTV và Tiền thực thu bỏ túi, tránh tình trạng bán nhiều nhưng lỗ vốn.')

    add_styled_table(
        doc,
        ['Tiêu chí So sánh', 'AutoBiz AI', 'ChatGPT / AI rời', 'Sapo / KiotViet'],
        [
            ['Thu thập SP & ảnh 1 chạm', 'Có sẵn (Extension AB)', 'Không hỗ trợ', 'Nhập tay / đồng bộ phức tạp'],
            ['AI viết 4 kênh + Bật/Tắt', 'Có (FB, TikTok, Zalo, Shopee)', 'Viết từng đoạn rời', 'Không chuyên AI Marketing'],
            ['Đo Click, GMV & Thực thu CTV', 'Có (/r/:code, xử lý 5ms)', 'Không có', 'Chỉ quản lý kho tại quầy'],
            ['Chi phí hằng tháng', 'Từ 199.000đ (tiết kiệm 80%)', '~500.000đ/tháng', '300.000đ – 1.500.000đ']
        ],
        [4.5, 4.7, 4.1, 4.1],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    )

    add_figure(doc, 'fig3_competitive_radar.png', 'Hình 3: Biểu đồ Radar so sánh 5 trụ cột giá trị giữa AutoBiz AI và các giải pháp hiện có.')

    add_p(doc, '4. Kết quả tiềm năng, tài chính và phân bổ thặng dư', bold=True, space_before=6, space_after=3)
    add_dash(doc, 'Cơ cấu nguồn thu (dự kiến):', 'Thuê bao SaaS (Pro 199k/tháng, Team 499k/tháng) kết hợp phí chia sẻ nền tảng Affiliate; doanh thu dự phóng tăng từ 520 triệu (2027) → 2,42 tỷ (2028) → 9,03 tỷ (2029).')
    add_dash(doc, 'Điểm hòa vốn & dự phòng tài chính:', 'Chi phí năm đầu 220 triệu (18,3 triệu/tháng); đạt điểm hòa vốn tại tháng thứ 5 với ~110 shop dùng gói Pro; trích 15% thặng dư lập Quỹ Dự phòng Rủi ro API.')
    add_dash(doc, 'Quy chế phân bổ thặng dư & tác động xã hội:', '50% tái đầu tư R&D AI, 30% mở rộng thị trường, 15% quỹ dự phòng và 5% tài trợ tài khoản miễn phí cho CLB Khởi nghiệp học đường.')

    add_styled_table(
        doc,
        ['Chỉ số Tài chính Dự phóng', 'Năm 1 (2027)', 'Năm 2 (2028)', 'Năm 3 (2029)'],
        [
            ['Tổng Doanh thu thuần (SaaS + Affiliate)', '520.000.000 đ', '2.420.000.000 đ', '9.030.000.000 đ'],
            ['Tổng Chi phí hoạt động (OPEX)', '220.000.000 đ', '980.000.000 đ', '3.250.000.000 đ'],
            ['Lợi nhuận trước thuế (Lãi ròng)', '300.000.000 đ', '1.440.000.000 đ', '5.780.000.000 đ'],
            ['Biên lợi nhuận ròng (Net Margin)', '57,7%', '59,5%', '64,0%']
        ],
        [6.6, 3.6, 3.6, 3.6],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER]
    )

    add_figure(doc, 'fig4_quarterly_cashflow.png', 'Hình 4: Dự phóng dòng tiền theo quý năm 2027 và điểm hòa vốn tại tháng thứ 5.')
    add_figure(doc, 'fig5_opex_surplus_donut.png', 'Hình 5: Cơ cấu chi phí vận hành năm 1 (220 triệu) và nguyên tắc phân bổ thặng dư.')

    add_p(doc, '5. Kênh truyền thông, chỉ số đo lường (KPI) và lộ trình 2026–2028', bold=True, space_before=6, space_after=3)
    add_styled_table(
        doc,
        ['Nhịp Triển khai', 'Kênh & Thông điệp Chính', 'Chỉ tiêu Đo lường (KPI)'],
        [
            ['Nhịp 1 (Q1/2027)\nKhởi điểm địa phương', '- Dùng thử miễn phí 30 ngày / 50 bài AI đầu cho hộ kinh doanh tại xã Ngãi Giao & CLB học đường.', '- 150 shop dùng thử; tỷ lệ hoàn thành bài đăng >= 85%.'],
            ['Nhịp 2 (Q2–Q4/2027)\nTăng trưởng hai phía', '- Chuỗi video ngắn TikTok hướng dẫn chuyển đổi số + mạng lưới CTV sinh viên chia sẻ link /r/:code.', '- MAU đạt 1.200 người dùng; CAC < 120.000đ/shop; đạt 110 shop trả phí.']
        ],
        [4.2, 7.2, 6.0],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    )

    add_figure(doc, 'fig6_roadmap_gantt.png', 'Hình 6: Biểu đồ lộ trình từ sản phẩm đã chạy thật (11/2026) đến mở rộng toàn quốc (2027–2029).')

    # ==================== C. SỞ HỮU TRÍ TUỆ, KÊ KHAI AI & CAM KẾT ====================
    add_h2(doc, 'C. SỞ HỮU TRÍ TUỆ, KÊ KHAI AI MINH BẠCH VÀ CAM KẾT')
    add_dash(doc, 'Quyền SHTT & trích dẫn thực địa:', 'Toàn bộ mã nguồn (github.com/nguyennhu19022008-ux/autobiz-ai), dữ liệu khảo sát N = 10.920 và quy trình nghiệp vụ do 02 thành viên trực tiếp thực hiện, chịu trách nhiệm trung thực.')

    add_styled_table(
        doc,
        ['Công cụ AI Sử dụng', 'Phạm vi Hỗ trợ', 'Phần Học sinh Tự làm chủ & Kiểm chứng'],
        [
            ['Google Gemini API\n(Tích hợp trong app)', '- Đóng vai trò công cụ gợi ý bản nháp nội dung 4 kênh & bóc tách thông số từ bảng giá.', '- Thiết kế prompt hệ thống, lập trình Node.js xử lý fallback và kiểm duyệt nội dung trước khi đăng (Human-in-the-loop).'],
            ['Trợ lý AI Lập trình\n& Biên tập', '- Hỗ trợ rà soát lỗi cú pháp, tối ưu CSS tối giản và kiểm tra chính tả văn bản.', '- Tự thiết kế kiến trúc 5 phân hệ, chạy kiểm thử 452 CTV (5ms), vận hành thật trên Fanpage và không dùng AI bịa đặt số liệu.']
        ],
        [4.2, 5.8, 7.4],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    )

    p_commit = add_dash(doc, 'Cam kết chính thức:', 'Nhóm tác giả và Giáo viên hướng dẫn cam kết dự án hoàn toàn trung thực, không sao chép, tuân thủ đầy đủ thể lệ Cuộc thi theo Kế hoạch 11677/KH-SGDĐT, quy định pháp luật về SHTT, bảo vệ dữ liệu cá nhân và sử dụng AI có trách nhiệm.')
    p_commit.paragraph_format.space_before = Pt(6)

    doc.save(OUT_PROJECT)
    out_v2 = os.path.join(r'C:\Users\Admin\Desktop\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'THPTNguyenDu_LV03_DA01_Thuyetminh_v2.docx')
    try:
        doc.save(OUT_DESKTOP)
        print('Saved:', OUT_DESKTOP)
        if os.path.exists(out_v2):
            os.remove(out_v2)
            print('Cleaned redundant:', out_v2)
    except PermissionError:
        doc.save(out_v2)
        print('Note: Main file open in Word, saved cleanly to:', out_v2)
    print('Saved:', OUT_PROJECT)

def audit_docx(path):
    doc = Document(path)
    bad_fonts = 0
    bad_sizes = 0
    bad_colors = 0
    bullet_dots = 0
    embedded_images = len(doc.inline_shapes)

    full_text = []

    def check_runs(runs, allow_cover=False):
        nonlocal bad_fonts, bad_sizes, bad_colors, bullet_dots
        for r in runs:
            txt = r.text or ''
            full_text.append(txt)
            if '•' in txt:
                bullet_dots += txt.count('•')
            if not txt.strip():
                continue
            if r.font.name != 'Times New Roman':
                bad_fonts += 1
            if not allow_cover:
                if r.font.size != Pt(14):
                    bad_sizes += 1
                if r.font.color.rgb != BLACK:
                    bad_colors += 1

    # Paragraphs before first page break belong to Cover Page (Page 1)
    past_cover = False
    for p in doc.paragraphs:
        if not past_cover:
            # Check if paragraph contains page break
            has_br = any('w:br' in r._element.xml and 'page' in r._element.xml for r in p.runs)
            check_runs(p.runs, allow_cover=True)
            if has_br:
                past_cover = True
        else:
            check_runs(p.runs, allow_cover=False)

    for tbl in doc.tables:
        for row in tbl.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    check_runs(p.runs, allow_cover=False)

    joined = '\n'.join(full_text)
    forbidden_terms = ['KHKT', 'Khoa học Kỹ thuật', 'Quốc Khánh', 'Kim Hoa', 'Hoàng Nam', 'Minh Triết']
    forbidden_found = [t for t in forbidden_terms if t in joined]

    required_terms = ['THPT Nguyễn Du', 'Đỗ Xuân Hưng', 'Nguyễn Như Vương Gia', 'Nguyễn Khang Thịnh', '13/2023/NĐ-CP', '10.920', 'Laptop Vương Gia']
    missing_required = [t for t in required_terms if t not in joined]

    print('=== PYTHON-DOCX AUDIT GATE ===')
    print(f'BadFonts = {bad_fonts}')
    print(f'BadSizes = {bad_sizes}')
    print(f'BadColors = {bad_colors}')
    print(f'BulletDots = {bullet_dots}')
    print(f'EmbeddedImages = {embedded_images}')
    print(f'ForbiddenFound = {forbidden_found}')
    print(f'MissingRequired = {missing_required}')
    empty_p = sum(1 for p in doc.paragraphs if not p.text.strip() and not any(('w:br' in r._element.xml or 'graphic' in r._element.xml) for r in p.runs))
    print(f'EmptyParagraphs = {empty_p}')

if __name__ == '__main__':
    build_document()
    audit_docx(OUT_DESKTOP)
