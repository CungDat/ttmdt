const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    // URL ảnh banner (full-width hero)
    image: { type: String, required: true, trim: true },
    // Ảnh cho mobile (tuỳ chọn - nếu không có thì dùng image)
    imageMobile: { type: String, trim: true, default: '' },
    // Link khi click vào banner
    link: { type: String, default: '/', trim: true },
    // Text nút CTA (Call to Action)
    buttonText: { type: String, trim: true, default: '' },
    // Vị trí hiển thị: hero (trang chủ đầu), mid (giữa trang), series (trang dòng sản phẩm)
    position: {
      type: String,
      enum: ['hero', 'mid', 'series', 'popup', 'sidebar'],
      default: 'hero'
    },
    // Key dùng để map vào LineSeriesPage
    seriesKey: { type: String, trim: true, default: '' },
    // Màu overlay text (hex hoặc rgba)
    overlayColor: { type: String, trim: true, default: '' },
    // Màu text tiêu đề
    textColor: { type: String, trim: true, default: '#ffffff' },
    // Thứ tự hiển thị (thấp hơn = trên trước)
    order: { type: Number, default: 0 },
    // Ngày bắt đầu và kết thúc hiển thị
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Bật/tắt
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, position: 1, order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
