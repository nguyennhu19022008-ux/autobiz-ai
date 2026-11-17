import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

# Configure Vietnamese-safe font (Times New Roman on Windows supports full Vietnamese)
plt.rcParams['font.family'] = 'Times New Roman'
plt.rcParams['axes.edgecolor'] = '#D1D5DB'
plt.rcParams['axes.linewidth'] = 0.8

OUT_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\AutoBiz-AI\charts"
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = "#1F2937"       # Đen than truyền thống
TEAL = "#7F1D1D"       # Đỏ đô truyền thống
AMBER = "#92400E"      # Nâu đồng truyền thống
CRIMSON = "#991B1B"    # Đỏ son đậm
SLATE = "#4B5563"      # Xám đậm
LIGHT_GRAY = "#9CA3AF" # Xám nhạt

def style_ax(ax):
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='x', linestyle='--', alpha=0.35, color='#CBD5E1')
    ax.set_axisbelow(True)

# 1. Chart 1: B2B Scale & Channels
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.6), dpi=300)
fig.patch.set_facecolor('white')

labels1 = ["Cá nhân / HS-SV\n(Affiliate / Dropship)", "Chủ shop nhỏ\n(1 - 3 nhân sự)", "Doanh nghiệp SMEs\n(4 - 10 nhân sự)", "Khác\n(CTV tự do)"]
vals1 = [47, 35, 15, 3]
counts1 = [2483, 1818, 766, 173]
colors1 = [NAVY, TEAL, SLATE, LIGHT_GRAY]

bars1 = ax1.barh(labels1[::-1], vals1[::-1], color=colors1[::-1], height=0.55)
style_ax(ax1)
ax1.set_xlim(0, 62)
ax1.set_title("Hình 1a. Quy mô Kinh doanh Người bán (Câu 1.1)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_xlabel("Tỷ lệ (%) trên N = 5.240", fontsize=10, color='#374151')
for bar, v, c in zip(bars1, vals1[::-1], counts1[::-1]):
    ax1.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

labels2 = ["Đa kênh hợp nhất\n(FB+TikTok+Shopee+Zalo)", "2 kênh kết hợp\n(Facebook + Zalo)", "Chỉ 1 kênh duy nhất\n(Chỉ Facebook)", "Kênh khác\n(IG, Threads, Telegram)"]
vals2 = [55, 27, 12, 6]
counts2 = [2871, 1410, 649, 310]
colors2 = [CRIMSON, NAVY, SLATE, LIGHT_GRAY]

bars2 = ax2.barh(labels2[::-1], vals2[::-1], color=colors2[::-1], height=0.55)
style_ax(ax2)
ax2.set_xlim(0, 72)
ax2.set_title("Hình 1b. Kênh Phân phối Đang sử dụng (Câu 1.3)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_xlabel("Tỷ lệ (%) trên N = 5.240", fontsize=10, color='#374151')
for bar, v, c in zip(bars2, vals2[::-1], counts2[::-1]):
    ax2.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

plt.tight_layout(pad=2.0)
plt.savefig(os.path.join(OUT_DIR, "chart1_b2b_scale_channels.png"), dpi=300)
plt.close()

# 2. Chart 2: B2B Categories & Time Wasted
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.8), dpi=300)
fig.patch.set_facecolor('white')

cat_labels = ["Phụ kiện công nghệ\n& Đồ chơi số", "Thời trang & Phụ kiện\nhọc đường Gen Z", "Gia dụng thông minh\n& Tiện ích", "Mỹ phẩm & Tiêu dùng\nnhanh (FMCG)", "Thiết bị điện tử\ngiá trị cao"]
cat_vals = [63, 52, 47, 38, 29]
cat_counts = [3306, 2733, 2472, 2002, 1532]
cat_colors = [NAVY, TEAL, AMBER, SLATE, LIGHT_GRAY]

b1 = ax1.barh(cat_labels[::-1], cat_vals[::-1], color=cat_colors[::-1], height=0.55)
style_ax(ax1)
ax1.set_xlim(0, 82)
ax1.set_title("Hình 2a. Ngành hàng Chủ đạo [Chọn nhiều] (Câu 1.2)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_xlabel("Tỷ lệ (%) người bán chọn", fontsize=10, color='#374151')
for bar, v, c in zip(b1, cat_vals[::-1], cat_counts[::-1]):
    ax1.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% ({c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

time_labels = ["2 - 4 tiếng / ngày\n(Chiếm phần lớn)", "1 - 2 tiếng / ngày", "Trên 4 tiếng / ngày\n(Quá tải vận hành)", "Dưới 1 tiếng / ngày"]
time_vals = [44, 31, 14, 11]
time_counts = [2295, 1619, 726, 600]
time_colors = [CRIMSON, AMBER, NAVY, LIGHT_GRAY]

b2 = ax2.barh(time_labels[::-1], time_vals[::-1], color=time_colors[::-1], height=0.55)
style_ax(ax2)
ax2.set_xlim(0, 62)
ax2.set_title("Hình 2b. Thời gian Viết & Đăng bài/Ngày (Câu 1.4)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_xlabel("Tỷ lệ (%) trên N = 5.240", fontsize=10, color='#374151')
for bar, v, c in zip(b2, time_vals[::-1], time_counts[::-1]):
    ax2.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

plt.tight_layout(pad=2.0)
plt.savefig(os.path.join(OUT_DIR, "chart2_b2b_categories_pain.png"), dpi=300)
plt.close()

# 3. Chart 3: B2B Difficulties & SaaS Willingness to Pay
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.6), dpi=300)
fig.patch.set_facecolor('white')

diff_labels = ["Mỗi MXH đòi 1 văn phong\n(FB / TikTok / Shopee)", "Cạn kiệt ý tưởng viết bài\n(Bí content)", "Quên đăng đúng khung\ngiờ vàng tương tác", "Bóc tách thông số lâu,\ndễ nhầm giá/cấu hình"]
diff_vals = [70, 61, 43, 38]
diff_counts = [3657, 3172, 2266, 1992]

b1 = ax1.barh(diff_labels[::-1], diff_vals[::-1], color=[CRIMSON, NAVY, TEAL, SLATE][::-1], height=0.55)
style_ax(ax1)
ax1.set_xlim(0, 88)
ax1.set_title("Hình 3a. Rào cản Nội dung Đa kênh [Chọn <=2] (Câu 1.5)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_xlabel("Tỷ lệ (%) người bán gặp phải", fontsize=10, color='#374151')
for bar, v, c in zip(b1, diff_vals[::-1], diff_counts[::-1]):
    ax1.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% ({c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

pay_labels = ["150k - 250k VNĐ/tháng\n(Gói Pro 199k)", "Dưới 100k VNĐ/tháng\n(Gói Cơ bản)", "350k - 500k VNĐ/tháng\n(Gói Team/SME)", "Chỉ trích % hoa hồng\ntrên đơn thành công"]
pay_vals = [54, 25, 16, 5]
pay_counts = [2823, 1307, 825, 285]

b2 = ax2.barh(pay_labels[::-1], pay_vals[::-1], color=[TEAL, NAVY, AMBER, LIGHT_GRAY][::-1], height=0.55)
style_ax(ax2)
ax2.set_xlim(0, 72)
ax2.set_title("Hình 3b. Mức phí Sẵn sàng Chi trả/Tháng (Câu 1.7)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_xlabel("Tỷ lệ (%) trên N = 5.240", fontsize=10, color='#374151')
for bar, v, c in zip(b2, pay_vals[::-1], pay_counts[::-1]):
    ax2.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

plt.tight_layout(pad=2.0)
plt.savefig(os.path.join(OUT_DIR, "chart3_b2b_difficulties_pricing.png"), dpi=300)
plt.close()

# 4. Chart 4: B2C Platforms & Purchase Influence
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.6), dpi=300)
fig.patch.set_facecolor('white')

plat_labels = ["TikTok\n(Video ngắn, Livestream)", "Facebook & Messenger\n(Nhóm, Newsfeed)", "Instagram & Threads\n(Hình ảnh, Lifestyle)", "Zalo\n(Nhóm lớp, Gia đình)"]
plat_vals = [86, 71, 45, 36]
plat_counts = [4878, 4019, 2531, 2049]

b1 = ax1.barh(plat_labels[::-1], plat_vals[::-1], color=[CRIMSON, NAVY, TEAL, SLATE][::-1], height=0.55)
style_ax(ax1)
ax1.set_xlim(0, 105)
ax1.set_title("Hình 4a. Nền tảng Gen Z Sử dụng Nhiều nhất (Câu 2.2)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_xlabel("Tỷ lệ (%) trên N = 5.680", fontsize=10, color='#374151')
for bar, v, c in zip(b1, plat_vals[::-1], plat_counts[::-1]):
    ax1.text(bar.get_width() + 1.5, bar.get_y() + bar.get_height()/2, f"{v}% ({c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

inf_labels = ["Video review thực tế\n(TikTok / Reels)", "Bài phân tích thông số\ntrong Group Facebook", "Tự tìm từ khóa trên\nShopee / Lazada", "Bạn bè, người thân\ngửi trực tiếp"]
inf_vals = [56, 24, 14, 5]
inf_counts = [3200, 1382, 815, 283]

b2 = ax2.barh(inf_labels[::-1], inf_vals[::-1], color=[NAVY, TEAL, AMBER, LIGHT_GRAY][::-1], height=0.55)
style_ax(ax2)
ax2.set_xlim(0, 74)
ax2.set_title("Hình 4b. Nguồn Ảnh hưởng Quyết định Mua (Câu 2.3)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_xlabel("Tỷ lệ (%) trên N = 5.680", fontsize=10, color='#374151')
for bar, v, c in zip(b2, inf_vals[::-1], inf_counts[::-1]):
    ax2.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

plt.tight_layout(pad=2.0)
plt.savefig(os.path.join(OUT_DIR, "chart4_b2c_platforms_influence.png"), dpi=300)
plt.close()

# 5. Chart 5: B2C Affiliate Click Behavior & Barriers
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.6), dpi=300)
fig.patch.set_facecolor('white')

aff_labels = ["Rất thường xuyên\n(Tuần nào cũng bấm)", "Thỉnh thoảng\n(Khi đồ hay, giá tốt)", "Rất hiếm / Chưa bao giờ\n(Ngại link lạ)"]
aff_vals = [47, 41, 12]
aff_counts = [2652, 2351, 677]

b1 = ax1.barh(aff_labels[::-1], aff_vals[::-1], color=[TEAL, NAVY, LIGHT_GRAY][::-1], height=0.48)
style_ax(ax1)
ax1.set_xlim(0, 64)
ax1.set_title("Hình 5a. Tần suất Bấm Link Affiliate (Câu 2.4)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax1.set_xlabel("Tỷ lệ (%) trên N = 5.680 (88% có thói quen bấm link)", fontsize=10, color='#374151')
for bar, v, c in zip(b1, aff_vals[::-1], aff_counts[::-1]):
    ax1.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

bar_labels = ["Muốn làm nhưng\nKHÔNG CÓ VỐN nhập", "Muốn làm nhưng\nKHÔNG BIẾT VIẾT/QUAY", "Thiếu nguồn hàng\nuy tín, giá gốc", "Chỉ tập trung học,\nchưa có nhu cầu"]
bar_vals = [52, 30, 14, 4]
bar_counts = [2939, 1708, 812, 221]

b2 = ax2.barh(bar_labels[::-1], bar_vals[::-1], color=[CRIMSON, AMBER, NAVY, LIGHT_GRAY][::-1], height=0.55)
style_ax(ax2)
ax2.set_xlim(0, 70)
ax2.set_title("Hình 5b. Rào cản Khởi nghiệp Online Gen Z (Câu 2.5)", fontsize=12, fontweight='bold', pad=12, color='#111827')
ax2.set_xlabel("Tỷ lệ (%) trên N = 5.680", fontsize=10, color='#374151')
for bar, v, c in zip(b2, bar_vals[::-1], bar_counts[::-1]):
    ax2.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2, f"{v}% (n={c:,})".replace(",", "."), va='center', fontsize=9.5, fontweight='bold', color='#111827')

plt.tight_layout(pad=2.0)
plt.savefig(os.path.join(OUT_DIR, "chart5_b2c_affiliate_barriers.png"), dpi=300)
plt.close()

# 6. Chart 6: Two-Sided Adoption Comparison (B2B 1.6 vs B2C 2.6)
fig, ax = plt.subplots(figsize=(10.5, 4.4), dpi=300)
fig.patch.set_facecolor('white')

categories = [
    "Mức độ Sẵn sàng Đón nhận\n(Phía Cung: B2B Sellers, N=5.240)",
    "Mức độ Sẵn sàng Tham gia Mạng lưới\n(Phía Cầu/CTV: Gen Z, N=5.680)"
]
strong_yes = [71, 69]
soft_yes = [23, 25]
neutral_no = [6, 6] # 6% bình thường/phân vân + <1% không quan tâm

y = np.arange(len(categories))
h = 0.45

p1 = ax.barh(y, strong_yes, height=h, color=TEAL, label="Ủng hộ tuyệt đối / Tham gia ngay (71% & 69%)")
p2 = ax.barh(y, soft_yes, left=strong_yes, height=h, color=NAVY, label="Hữu ích / Tham gia nếu có hướng dẫn (23% & 25%)")
p3 = ax.barh(y, neutral_no, left=np.array(strong_yes)+np.array(soft_yes), height=h, color=LIGHT_GRAY, label="Phân vân / Bình thường / Không quan tâm (6%)")

ax.set_yticks(y)
ax.set_yticklabels(categories, fontsize=11, fontweight='bold', color='#111827')
ax.set_xlim(0, 108)
ax.set_xlabel("Tổng Tỷ lệ Đồng thuận (%)", fontsize=10.5, color='#374151')
ax.set_title("Hình 6. Chỉ số Hội tụ Cung - Cầu: 94% Thị trường Hai Phía Sẵn sàng Đón nhận AutoBiz AI", fontsize=12.5, fontweight='bold', pad=14, color='#111827')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.18), ncol=3, frameon=False, fontsize=9.5)

for i in range(len(categories)):
    ax.text(strong_yes[i]/2, y[i], f"{strong_yes[i]}%", ha='center', va='center', color='white', fontweight='bold', fontsize=11)
    ax.text(strong_yes[i] + soft_yes[i]/2, y[i], f"{soft_yes[i]}%", ha='center', va='center', color='white', fontweight='bold', fontsize=11)
    ax.text(101.5, y[i], f"Tổng đồng thuận: {strong_yes[i]+soft_yes[i]}%", ha='left', va='center', color=TEAL, fontweight='bold', fontsize=10.5)

ax.set_xlim(0, 128)
ax.set_xticks([0, 20, 40, 60, 80, 100])
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "chart6_adoption_comparison.png"), dpi=300, bbox_inches='tight')
plt.close()

print("All 6 high-DPI Vietnamese charts generated successfully in:", OUT_DIR)
