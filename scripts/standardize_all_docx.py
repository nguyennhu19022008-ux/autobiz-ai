# -*- coding: utf-8 -*-
"""
scripts/standardize_all_docx.py
Chuẩn hóa đồng bộ toàn bộ các tệp .docx trong thư mục Desktop BO_KE_HOACH_DU_AN_AUTOBIZ_AI:
- Font: 100% Times New Roman
- Cỡ chữ: 14pt cho nội dung (trừ trang bìa)
- Màu chữ: Đen mực #000000
- Xóa sạch ký tự chấm tròn (•) -> dấu gạch ngang (-)
- Giãn cách dòng 1.15 (đoạn văn) / 1.08 (trong bảng), cantSplit cho hàng bảng, nền tiêu đề #F2F2F2
"""
import os
import glob
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

FOLDER = r'C:\Users\Admin\Desktop\BO_KE_HOACH_DU_AN_AUTOBIZ_AI'
BLACK = RGBColor(0x00, 0x00, 0x00)

def force_run_style(run, size_pt=14):
    if run.text and '•' in run.text:
        run.text = run.text.replace('•', '-')
    run.font.name = 'Times New Roman'
    run.font.size = Pt(size_pt)
    run.font.color.rgb = BLACK
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rFonts.set(qn(attr), 'Times New Roman')

def standardize_file(path):
    name = os.path.basename(path)
    if name == 'THPTNguyenDu_LV03_DA01_Thuyetminh.docx':
        # Already built & audited by build_and_audit_thuyetminh_docx.py
        return (name, 'SKIP (already 14pt audited)')

    doc = Document(path)
    for sec in doc.sections:
        sec.page_width = Cm(21.0)
        sec.page_height = Cm(29.7)
        sec.top_margin = Cm(1.5)
        sec.bottom_margin = Cm(1.5)
        sec.left_margin = Cm(2.0)
        sec.right_margin = Cm(1.8)

    if 'Normal' in doc.styles:
        doc.styles['Normal'].font.name = 'Times New Roman'
        doc.styles['Normal'].font.size = Pt(14)
        doc.styles['Normal'].font.color.rgb = BLACK

    for p in doc.paragraphs:
        pf = p.paragraph_format
        pf.line_spacing = 1.15
        if pf.space_after is None or pf.space_after > Pt(10):
            pf.space_after = Pt(5)
        for r in p.runs:
            force_run_style(r, size_pt=14)

    for tbl in doc.tables:
        for r_idx, row in enumerate(tbl.rows):
            trPr = row._tr.get_or_add_trPr()
            if trPr.find(qn('w:cantSplit')) is None:
                trPr.append(OxmlElement('w:cantSplit'))
            for cell in row.cells:
                if r_idx == 0 and len(tbl.rows) > 1 and len(tbl.columns) >= 2:
                    tcPr = cell._tc.get_or_add_tcPr()
                    for old_shd in tcPr.findall(qn('w:shd')):
                        tcPr.remove(old_shd)
                    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F2F2F2"/>'))
                for p in cell.paragraphs:
                    p.paragraph_format.line_spacing = 1.08
                    p.paragraph_format.space_before = Pt(0)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        force_run_style(r, size_pt=13)

    doc.save(path)
    return (name, 'STANDARDIZED')

if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(FOLDER, '*.docx')))
    for f in files:
        if os.path.basename(f).startswith('~$'):
            continue
        res = standardize_file(f)
        print(res[0], '->', res[1])
