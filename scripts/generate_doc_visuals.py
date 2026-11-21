# -*- coding: utf-8 -*-
"""
scripts/generate_doc_visuals.py
Sinh 06 hình ảnh & biểu đồ 300 DPI + QR Code (bảng màu truyền thống, font Times New Roman)
phục vụ Bản Thuyết minh & Minh chứng Dự án AutoBiz AI (11 trang A4).
"""
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import qrcode

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'charts_doc')
os.makedirs(OUT_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'Times New Roman'
plt.rcParams['axes.edgecolor'] = '#374151'
plt.rcParams['axes.linewidth'] = 0.9

C_INK = '#000000'
C_BURGUNDY = '#DC2626'   # Đỏ tươi độ tương phản cao, tông sáng
C_AMBER = '#F59E0B'      # Vàng hổ phách sáng
C_GREEN = '#16A34A'      # Xanh lá sáng (phân biệt rõ sắc độ khi in trắng đen)
C_SLATE = '#4B5563'      # Xám đậm trung tính
C_LIGHT = '#E5E7EB'      # Xám sáng nền phụ
C_BG_BOX = '#FFFFFF'     # Nền trắng tinh khiết

# ---------------------------------------------------------
# HÌNH 1: SƠ ĐỒ HỆ SINH THÁI & DÒNG TIỀN + QR CODE LIVE
# ---------------------------------------------------------
def make_fig1():
    fig, ax = plt.subplots(figsize=(10.5, 4.1), dpi=300)
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 4.1)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    ax.text(5.25, 3.82, 'HÌNH 1: SƠ ĐỒ HỆ SINH THÁI HAI PHÍA & DÒNG TIỀN AUTOBIZ AI',
            ha='center', va='center', fontsize=12.5, fontweight='bold', color=C_INK)

    boxes = [
        (0.25, 2.02, 2.0, 1.35, '1. EXTENSION AB (MV3)', 'Thu thập tên, giá,\nngành hàng & tối đa\n6 ảnh SP từ sàn TMĐT', C_INK),
        (2.55, 2.02, 2.1, 1.35, '2. GEMINI AI STUDIO', 'Sinh song song 4 kênh\n(FB, TikTok, Zalo, Shopee)\n+ Bật/Tắt app không dùng', C_BURGUNDY),
        (4.95, 2.02, 2.1, 1.35, '3. PHÂN PHỐI & /r/:code', 'Đăng Fanpage (Graph API)\n& gắn Shortlink UTM\nđịnh danh từng CTV (SubID)', C_AMBER),
        (7.35, 2.02, 2.85, 1.35, '4. FINTECH ĐỐI SOÁT (5ms)', 'Đo Click thật -> Chốt đơn\n-> GMV, Hoa hồng CTV &\nTiền thực thu Chủ shop', C_GREEN),
    ]
    for x, y, w, h, title, body, col in boxes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.05,rounding_size=0.08',
                                      linewidth=1.8, edgecolor=col, facecolor='#FFFFFF')
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h - 0.24, title, ha='center', va='center', fontsize=9.0, fontweight='bold', color=col)
        ax.text(x + w / 2, y + h / 2 - 0.14, body, ha='center', va='center', fontsize=8.4, color=C_INK, linespacing=1.32)

    for x_start, x_end in [(2.30, 2.50), (4.70, 4.90), (7.10, 7.30)]:
        ax.annotate('', xy=(x_end, 2.70), xytext=(x_start, 2.70),
                    arrowprops=dict(arrowstyle='->', lw=2.0, color=C_INK))

    # Bottom 2-sided market + QR
    b2b = patches.FancyBboxPatch((0.25, 0.22), 3.6, 1.42, boxstyle='round,pad=0.04,rounding_size=0.08',
                                 linewidth=1.4, edgecolor=C_INK, facecolor='#FEF2F2')
    ax.add_patch(b2b)
    ax.text(2.05, 1.42, 'PHÍA CUNG (B2B): CHỦ SHOP / HỘ KINH DOANH', ha='center', va='center', fontsize=8.0, fontweight='bold', color=C_BURGUNDY)
    ax.text(2.05, 0.82, '- Gói Pro 199k/tháng | Team 499k/tháng (Tiết kiệm 80%)\n- Đã vận hành thật trên Fanpage Laptop Vương Gia\n- Kiểm soát chặt GMV, Hoa hồng & Tiền thực thu',
            ha='center', va='center', fontsize=8.0, color=C_INK, linespacing=1.32)

    b2c = patches.FancyBboxPatch((4.10, 0.22), 3.6, 1.42, boxstyle='round,pad=0.04,rounding_size=0.08',
                                 linewidth=1.4, edgecolor=C_INK, facecolor='#FFFBEB')
    ax.add_patch(b2c)
    ax.text(5.90, 1.42, 'PHÍA CẦU (B2C): HỌC SINH, SINH VIÊN / CTV', ha='center', va='center', fontsize=8.0, fontweight='bold', color=C_INK)
    ax.text(5.90, 0.82, '- Không cần vốn ôm hàng, nhận bài AI viết sẵn\n- Cầm link /r/:code riêng theo mã SubID cá nhân\n- Thử nghiệm tải: 452 CTV | 21.486 clicks | 5ms',
            ha='center', va='center', fontsize=8.0, color=C_INK, linespacing=1.32)

    # QR Code pointing to Live Vercel URL
    qr = qrcode.QRCode(box_size=6, border=1)
    qr.add_data('https://autobiz-ai-seven.vercel.app')
    qr.make(fit=True)
    qr_img = np.array(qr.make_image(fill_color='#000000', back_color='white').convert('RGB'))
    ax_qr = fig.add_axes([0.785, 0.155, 0.17, 0.27])
    ax_qr.imshow(qr_img)
    ax_qr.axis('off')
    ax.text(9.05, 0.07, 'Quét mã mở WebApp Live', ha='center', va='center', fontsize=8.0, fontweight='bold', color=C_INK)

    plt.savefig(os.path.join(OUT_DIR, 'fig1_ecosystem_qr.png'), dpi=300, bbox_inches='tight', pad_inches=0.06)
    plt.close()

# ---------------------------------------------------------
# HÌNH 2: BIỂU ĐỒ DONUT + THANH NGANG KHẢO SÁT (N = 10.920)
# ---------------------------------------------------------
def make_fig2():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.0), dpi=300, gridspec_kw={'width_ratios': [1.0, 1.45]})
    fig.patch.set_facecolor('white')

    # Donut: 94% dong thuan
    sizes = [94, 6]
    colors = [C_BURGUNDY, C_LIGHT]
    wedges, _ = ax1.pie(sizes, startangle=90, colors=colors, wedgeprops=dict(width=0.38, edgecolor='white', linewidth=2))
    ax1.text(0, 0.06, '94%', ha='center', va='center', fontsize=24, fontweight='bold', color=C_BURGUNDY)
    ax1.text(0, -0.22, 'Đồng thuận\n(N = 10.920)', ha='center', va='center', fontsize=9.5, color=C_INK)
    ax1.set_title('Tỷ lệ Đón nhận AutoBiz AI\n(5.240 B2B + 5.680 B2C)', fontsize=11, fontweight='bold', color=C_INK, pad=8)

    # Horizontal bars: Top pain points
    labels = [
        'Không đo được lãi & hoa hồng từng kênh (B2B)',
        'Ngại link Affiliate dài, sợ mất hoa hồng (B2C)',
        'Tốn 2–4 giờ/ngày viết lại bài cho 4 nền tảng',
        'Thiếu vốn nhập hàng & thiếu kịch bản quay (B2C)'
    ]
    vals = [82, 79, 76, 71]
    y_pos = np.arange(len(labels))
    bars = ax2.barh(y_pos, vals, color=[C_BURGUNDY, C_AMBER, C_GREEN, C_SLATE], height=0.55, edgecolor=C_INK, linewidth=0.6)
    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(labels, fontsize=9.5, color=C_INK)
    ax2.invert_yaxis()
    ax2.set_xlim(0, 100)
    ax2.set_xlabel('Tỷ lệ phản hồi từ khảo sát thực địa (%)', fontsize=9.5, color=C_INK)
    ax2.set_title('Các Điểm nghẽn Hành vi Chính Từ Khảo sát Thực địa', fontsize=11, fontweight='bold', color=C_INK, pad=8)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    for bar, v in zip(bars, vals):
        ax2.text(v + 1.8, bar.get_y() + bar.get_height()/2, f'{v}%', va='center', fontsize=9.5, fontweight='bold', color=C_INK)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'fig2_survey_donut_bar.png'), dpi=300, bbox_inches='tight')
    plt.close()

# ---------------------------------------------------------
# HÌNH 3: BIỂU ĐỒ RADAR SO SÁNH LỢI THẾ CẠNH TRANH
# ---------------------------------------------------------
def make_fig3():
    categories = [
        'Lấy SP & Ảnh\n1 chạm',
        'AI Sinh bài\n4 Kênh',
        'Đo Click, GMV\n& Lãi CTV',
        'Tiết kiệm\nChi phí (80%)',
        'An toàn API\nChính thống'
    ]
    N = len(categories)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    autobiz = [9.5, 9.2, 9.6, 9.5, 9.2] + [9.5]
    chatgpt = [2.0, 7.5, 1.0, 5.0, 8.0] + [2.0]
    sapo    = [4.5, 2.0, 5.5, 4.0, 9.0] + [4.5]

    fig, ax = plt.subplots(figsize=(8.8, 4.4), subplot_kw=dict(polar=True), dpi=300)
    fig.patch.set_facecolor('white')

    ax.plot(angles, autobiz, linewidth=2.4, color=C_BURGUNDY, label='AutoBiz AI (Từ 199k/tháng)')
    ax.fill(angles, autobiz, color=C_BURGUNDY, alpha=0.14)

    ax.plot(angles, sapo, linewidth=1.8, linestyle='--', color=C_INK, label='Phần mềm Kho/POS (Sapo, KiotViet)')
    ax.plot(angles, chatgpt, linewidth=1.8, linestyle=':', color=C_AMBER, label='AI Viết bài rời (ChatGPT)')

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=9.5, fontweight='bold', color=C_INK)
    ax.set_ylim(0, 10)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(['2', '4', '6', '8', '10'], fontsize=8, color=C_SLATE)
    ax.set_title('So sánh Năng lực Cạnh tranh Theo 5 Trụ cột Giá trị (Thang 10)', fontsize=12, fontweight='bold', color=C_BURGUNDY, pad=18)
    ax.legend(loc='upper right', bbox_to_anchor=(1.36, 1.08), fontsize=8.8, frameon=True)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'fig3_competitive_radar.png'), dpi=300, bbox_inches='tight')
    plt.close()

# ---------------------------------------------------------
# HÌNH 4: DÒNG TIỀN THEO QUÝ NĂM 1 (2027) & ĐIỂM HÒA VỐN
# ---------------------------------------------------------
def make_fig4():
    quarters = ['Quý 1/2027', 'Quý 2/2027\n(Hòa vốn T5)', 'Quý 3/2027', 'Quý 4/2027']
    rev = [45, 95, 160, 220]      # Tổng = 520 triệu
    opex = [55, 55, 55, 55]       # Tổng = 220 triệu
    cum_profit = [-10, 30, 135, 300]  # Lợi nhuận lũy kế = 300 triệu

    x = np.arange(len(quarters))
    width = 0.34

    fig, ax1 = plt.subplots(figsize=(9.5, 4.1), dpi=300)
    fig.patch.set_facecolor('white')

    b1 = ax1.bar(x - width/2, rev, width, label='Doanh thu thuần (triệu đ)', color=C_INK)
    b2 = ax1.bar(x + width/2, opex, width, label='Chi phí vận hành OPEX (triệu đ)', color=C_LIGHT, edgecolor=C_SLATE)
    ax1.set_ylabel('Doanh thu & Chi phí (Triệu VNĐ)', fontsize=10, color=C_INK)
    ax1.set_ylim(0, 360)
    ax1.set_xticks(x)
    ax1.set_xticklabels(quarters, fontsize=9.5, fontweight='bold', color=C_INK)
    ax1.spines['top'].set_visible(False)

    ax1.plot(x, cum_profit, color=C_BURGUNDY, marker='o', linewidth=2.4, markersize=7, label='Lợi nhuận lũy kế (triệu đ)')
    ax1.axhline(0, color=C_SLATE, linewidth=0.8, linestyle='--')

    for bar in b1:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, h + 6, f'{h}tr', ha='center', fontsize=8.5, fontweight='bold', color=C_INK)
    for xi, cp in zip(x, cum_profit):
        offset = 14 if cp >= 0 else -18
        ax1.text(xi, cp + offset, f'{cp:+d}tr', ha='center', fontsize=9, fontweight='bold', color=C_BURGUNDY)

    ax1.set_title('Dòng tiền Theo Quý Năm 1 (2027) — Hòa vốn Tháng thứ 5, Lãi Lũy kế 300 Triệu',
                  fontsize=11.5, fontweight='bold', color=C_BURGUNDY, pad=12)
    ax1.legend(loc='upper left', fontsize=8.8, frameon=True)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'fig4_quarterly_cashflow.png'), dpi=300, bbox_inches='tight')
    plt.close()

# ---------------------------------------------------------
# HÌNH 5: DONUT KÉP CƠ CẤU CHI PHÍ (220TR) & PHÂN BỔ THẶNG DƯ (300TR)
# ---------------------------------------------------------
def make_fig5():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.2, 4.0), dpi=300)
    fig.patch.set_facecolor('white')

    c_vals = [36, 44, 140]
    c_labels = ['Cloud Serverless\n(36tr | 16,4%)', 'Gemini API & Kênh\n(44tr | 20,0%)', 'R&D & Cộng đồng\n(140tr | 63,6%)']
    ax1.pie(c_vals, labels=c_labels, startangle=90, colors=[C_LIGHT, C_AMBER, C_GREEN],
            wedgeprops=dict(width=0.42, edgecolor='black', linewidth=1.0), textprops={'fontsize': 8.8, 'color': C_INK})
    ax1.text(0, 0, '220tr\nOPEX Y1', ha='center', va='center', fontsize=11, fontweight='bold', color=C_INK)
    ax1.set_title('Cơ cấu Chi phí Năm 1 (2027)', fontsize=11, fontweight='bold', color=C_INK)

    s_vals = [50, 30, 15, 5]
    s_labels = ['Tái đầu tư R&D AI\n(50%)', 'Mở rộng Thị trường\n(30%)', 'Quỹ Dự phòng Rủi ro\n(15%)', 'Quỹ Học đường\n(5%)']
    ax2.pie(s_vals, labels=s_labels, startangle=90, colors=[C_BURGUNDY, C_AMBER, C_GREEN, C_LIGHT],
            wedgeprops=dict(width=0.42, edgecolor='black', linewidth=1.0), textprops={'fontsize': 8.8, 'color': C_INK})
    ax2.text(0, 0, '300tr\nThặng dư', ha='center', va='center', fontsize=11, fontweight='bold', color=C_BURGUNDY)
    ax2.set_title('Phân bổ Thặng dư & Quỹ Cộng đồng', fontsize=11, fontweight='bold', color=C_BURGUNDY)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'fig5_opex_surplus_donut.png'), dpi=300, bbox_inches='tight')
    plt.close()

# ---------------------------------------------------------
# HÌNH 6: BIỂU ĐỒ LỘ TRÌNH THỰC THI 2026 – 2028 (GANTT)
# ---------------------------------------------------------
def make_fig6():
    tasks = [
        'GĐ1: WebApp 5 Phân hệ, Extension v2.0 & Vercel Live [ĐÃ XONG]',
        'GĐ2: Khảo sát N=10.920 & Chạy thật Fanpage Laptop Vương Gia [ĐÃ XONG]',
        'GĐ3: Dự thi Cấp Thành phố & Gắn Supabase Cloud riêng (12/2026–01/2027)',
        'GĐ4: Freemium 30 ngày tại Ngãi Giao → 110 Shop Hòa vốn (Q2/2027)',
        'GĐ5: Xin duyệt TikTok / Zalo OA API & Đạt 520tr (Cuối 2027)',
        'GĐ6: Mở rộng toàn quốc → 2,42 tỷ (2028) & 9,03 tỷ (2029)'
    ]
    starts = [0, 0.2, 1.0, 2.5, 4.5, 6.5]
    durations = [1.0, 1.0, 1.6, 2.2, 2.5, 3.5]
    cols = [C_GREEN, C_GREEN, C_BURGUNDY, C_AMBER, C_AMBER, C_SLATE]

    fig, ax = plt.subplots(figsize=(10.5, 3.8), dpi=300)
    fig.patch.set_facecolor('white')

    y = np.arange(len(tasks))
    for i in range(len(tasks)):
        ax.barh(y[i], durations[i], left=starts[i], height=0.52, color=cols[i], edgecolor='white')

    ax.set_yticks(y)
    ax.set_yticklabels(tasks, fontsize=8.8, color=C_INK, fontweight='bold')
    ax.invert_yaxis()
    ax.set_xticks([0, 1.2, 2.6, 4.8, 7.0, 10.0])
    ax.set_xticklabels(['11/2026\n(Hiện tại)', '01/2027\n(Chung kết)', 'Q2/2027\n(Hòa vốn)', 'Q4/2027\n(520tr)', '2028\n(2,42 tỷ)', '2029\n(9,03 tỷ)'],
                       fontsize=8.5, color=C_INK)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.set_title('Lộ trình Thực thi Từ Sản phẩm Đã Chạy Thật (2026) Đến Nhân rộng (2027–2029)',
                 fontsize=11.5, fontweight='bold', color=C_BURGUNDY, pad=10)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'fig6_roadmap_gantt.png'), dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == '__main__':
    make_fig1()
    make_fig2()
    make_fig3()
    make_fig4()
    make_fig5()
    make_fig6()
    print('Generated all 6 300-DPI charts in:', OUT_DIR)
