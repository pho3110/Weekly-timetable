# Lịch học

React + Tailwind CSS + Vite. Thời khóa biểu cố định thứ Hai–thứ Sáu, 4 ca mỗi ngày. Thêm, sửa, xóa môn học và phòng; chọn màu. Lịch ban đầu trống để nhập môn học thực tế.

Giao diện iOS, tự đổi sáng/tối theo hệ thống, vuốt để chuyển ngày. Màn mở đầu Totoro, mèo khóc tại ca đang học và mèo Rive tương tác có thể kéo, thu gọn. Các animation hỗ trợ Giảm chuyển động và được lưu cục bộ để dùng offline. Nguồn và giấy phép nằm trong `THIRD_PARTY_NOTICES.md`.

## Chạy dự án

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

Triển khai thư mục `dist` lên hosting tĩnh có **HTTPS**. Không mở `index.html` trực tiếp bằng giao thức file. Service worker hoạt động trong bản build production; dev server không cung cấp offline.

## iPhone và offline

Mở URL HTTPS bằng Safari khi có mạng và chờ ứng dụng tải xong, chọn Chia sẻ → Thêm vào MH chính. Mở ứng dụng từ biểu tượng khi còn mạng một lần để tài nguyên được lưu, sau đó thử bật chế độ máy bay. Có thể xem, thêm, sửa và xóa ca học offline.

Dữ liệu nằm trong localStorage trên thiết bị, không đồng bộ tài khoản. Xóa dữ liệu trình duyệt hoặc việc Safari thu hồi dữ liệu lưu trữ có thể xóa lịch. Safari và bản cài màn hình chính có thể dùng bộ nhớ riêng.

## Cấu trúc

- `src/main.jsx`: giao diện và thao tác lịch học.
- `src/storage.js`: khung giờ, kiểm tra dữ liệu, đọc dữ liệu.
- `src/styles.css`: Tailwind và giao diện responsive.
- `vite.config.js`: React, Tailwind và PWA precache tài nguyên.

Ca học: 07:00–09:25, 09:35–12:00, 13:00–15:25, 15:35–18:00. Một môn trong mỗi ca. Lịch lặp lại theo tuần, không gắn ngày tháng.
