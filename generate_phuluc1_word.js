/**
 * generate_phuluc1_word.js
 * Xuất Phiếu Đăng ký Dự thi chuẩn Phụ lục I Công văn 11677/KH-SGDĐT
 * Tên tệp: THPTNguyenDu_LV03_DA01_Phieudangky.docx
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
} = require('docx');

const COLOR_INK = "111827";
const COLOR_BORDER = "6B7280";
const COLOR_BG = "F3F4F6";

function p(text, opts = {}) {
  const { bold = false, italic = false, size = 26, align = AlignmentType.LEFT, spaceAfter = 80 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, line: 320 },
    children: [new TextRun({ text, bold, italic, size, font: "Times New Roman", color: COLOR_INK })]
  });
}

function cell(text, isHeader = false, widthPct = 20, align = AlignmentType.LEFT) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: isHeader ? { type: ShadingType.SOLID, color: COLOR_BG } : undefined,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    children: String(text).split('\n').map((line) => new Paragraph({
      alignment: align,
      spacing: { after: 30, before: 30, line: 280 },
      children: [new TextRun({ text: line, bold: isHeader, size: 24, font: "Times New Roman", color: COLOR_INK })]
    }))
  });
}

async function main() {
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              p("SỞ GIÁO DỤC VÀ ĐÀO TẠO", { size: 23, align: AlignmentType.CENTER, spaceAfter: 20 }),
              p("THÀNH PHỐ HỒ CHÍ MINH", { bold: true, size: 23, align: AlignmentType.CENTER, spaceAfter: 20 }),
              p("TRƯỜNG THPT NGUYỄN DU", { bold: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 40 })
            ]
          }),
          new TableCell({
            width: { size: 52, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              p("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true, size: 23, align: AlignmentType.CENTER, spaceAfter: 20 }),
              p("Độc lập - Tự do - Hạnh phúc", { bold: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 40 })
            ]
          })
        ]
      })
    ]
  });

  const regTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell("TT", true, 7, AlignmentType.CENTER),
          cell("Mã dự án", true, 12, AlignmentType.CENTER),
          cell("Tên dự án", true, 33, AlignmentType.CENTER),
          cell("Lĩnh vực dự thi", true, 20, AlignmentType.CENTER),
          cell("Số thành viên", true, 10, AlignmentType.CENTER),
          cell("Họ và tên Giáo viên hướng dẫn", true, 18, AlignmentType.CENTER)
        ]
      }),
      new TableRow({
        children: [
          cell("1", false, 7, AlignmentType.CENTER),
          cell("DA01", false, 12, AlignmentType.CENTER),
          cell("AutoBiz AI — Hệ sinh thái Tiếp thị Đa kênh & Affiliate FinTech", false, 33, AlignmentType.LEFT),
          cell("LV03 (Dịch vụ, tài chính, ngân hàng)", false, 20, AlignmentType.CENTER),
          cell("02\n(Nguyễn Như Vương Gia,\nNguyễn Khang Thịnh)", false, 10, AlignmentType.CENTER),
          cell("Đỗ Xuân Hưng", false, 18, AlignmentType.CENTER)
        ]
      }),
      new TableRow({
        children: [
          cell("2", false, 7, AlignmentType.CENTER),
          cell("DA02", false, 12, AlignmentType.CENTER),
          cell("", false, 33),
          cell("", false, 20),
          cell("", false, 10),
          cell("", false, 18)
        ]
      }),
      new TableRow({
        children: [
          cell("3", false, 7, AlignmentType.CENTER),
          cell("DA03", false, 12, AlignmentType.CENTER),
          cell("", false, 33),
          cell("", false, 20),
          cell("", false, 10),
          cell("", false, 18)
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1100 } } },
      children: [
        headerTable,
        p("", { spaceAfter: 120 }),
        p("PHIẾU ĐĂNG KÝ", { bold: true, size: 32, align: AlignmentType.CENTER, spaceAfter: 40 }),
        p("Tham dự Cuộc thi “Học sinh với ý tưởng khởi nghiệp cấp Thành phố”", { bold: true, size: 26, align: AlignmentType.CENTER, spaceAfter: 20 }),
        p("năm học 2026 - 2027", { bold: true, size: 26, align: AlignmentType.CENTER, spaceAfter: 180 }),

        p("I. THÔNG TIN ĐƠN VỊ", { bold: true, size: 26, spaceAfter: 80 }),
        p("- Tên cơ sở giáo dục, cơ sở đào tạo: Trường THPT Nguyễn Du", { size: 26 }),
        p("- Địa chỉ: Xã Ngãi Giao, Thành phố Hồ Chí Minh (theo địa giới hành chính hiện hành)", { size: 26 }),
        p("- Họ và tên lãnh đạo đại diện đăng ký: ...........................................................................", { size: 26 }),
        p("- Chức vụ: ...................................................................................................................", { size: 26 }),
        p("- Số điện thoại: ...........................................................................................................", { size: 26 }),
        p("- Email: .......................................................................................................................", { size: 26, spaceAfter: 140 }),

        p("II. DANH SÁCH DỰ ÁN ĐĂNG KÝ", { bold: true, size: 26, spaceAfter: 100 }),
        regTable,
        p("", { spaceAfter: 160 }),

        p("III. CAM KẾT CỦA ĐƠN VỊ", { bold: true, size: 26, spaceAfter: 80 }),
        p("Đơn vị xác nhận các dự án nêu trên đã được lựa chọn, kiểm tra về điều kiện tham dự; bảo đảm thông tin đăng ký, hồ sơ dự thi chính xác, trung thực và đáp ứng các yêu cầu của Kế hoạch tổ chức Cuộc thi./.", { size: 26, spaceAfter: 220 }),

        p("Ngãi Giao, ngày ...... tháng ...... năm 2026", { italic: true, size: 25, align: AlignmentType.RIGHT, spaceAfter: 40 }),
        p("THỦ TRƯỞNG ĐƠN VỊ", { bold: true, size: 26, align: AlignmentType.RIGHT, spaceAfter: 20 }),
        p("(Ký, ghi rõ họ tên và đóng dấu)", { italic: true, size: 24, align: AlignmentType.RIGHT })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outProject = path.join(__dirname, 'THPTNguyenDu_LV03_DA01_Phieudangky.docx');
  const outDesktop = path.join('C:\\Users\\Admin\\Desktop\\BO_KE_HOACH_DU_AN_AUTOBIZ_AI', 'THPTNguyenDu_LV03_DA01_Phieudangky.docx');
  fs.writeFileSync(outProject, buffer);
  fs.writeFileSync(outDesktop, buffer);
  console.log('Generated Phu luc I:', outDesktop, buffer.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
