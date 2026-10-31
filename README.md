# Lịch học

React + Tailwind CSS + Vite. Thời khóa biểu cố định thứ Hai–thứ Sáu, 4 ca mỗi ngày. Thêm, sửa, xóa môn học và phòng; chọn màu. Lịch ban đầu trống để nhập môn học thực tế.

Giao diện iOS, tự đổi sáng/tối theo hệ thống, vuốt để chuyển ngày. Màn mở đầu Totoro, mèo khóc tại ca đang học. Các animation hỗ trợ Giảm chuyển động và được lưu cục bộ để dùng offline. Nguồn và giấy phép nằm trong `THIRD_PARTY_NOTICES.md`.

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

## Cập nhật sau deploy

PWA kiểm tra bản mới khi mở app, trở lại từ nền, có mạng trở lại và mỗi phút khi đang hiển thị. Khi service worker mới tải xong, app tự tải lại; nếu đang sửa ca học thì đợi lưu hoặc đóng hộp chỉnh sửa. Lịch đã lưu vẫn nằm trong localStorage.

`vercel.json` đặt header chống cache cũ cho service worker và HTML. Hosting khác cần cấu hình tương đương. iOS không cho app web tự chạy cập nhật liên tục khi bị đóng hoặc tạm ngưng; việc kiểm tra tiếp tục khi mở lại và có mạng. Bản cũ cần nhận bản cập nhật cơ chế này một lần trước khi áp dụng đầy đủ.

## Cấu trúc

- `src/main.jsx`: giao diện và thao tác lịch học.
- `src/storage.js`: khung giờ, kiểm tra dữ liệu, đọc dữ liệu.
- `src/styles.css`: Tailwind và giao diện responsive.
- `vite.config.js`: React, Tailwind và PWA precache tài nguyên.

Ca học: 07:00–09:25, 09:35–12:00, 13:00–15:25, 15:35–18:00. Một môn trong mỗi ca. Tuần tính từ thứ Hai đến Chủ nhật; các ca học hiển thị thứ Hai–thứ Sáu, kèm ngày cụ thể.

Lịch cũ được giữ làm lịch lặp mặc định cho các tuần. Khi thêm ca mới, mặc định “Lặp mỗi tuần”; khi sửa ca đã có, mặc định “Chỉ tuần này”. Có thể đổi phạm vi trong ô “Áp dụng”. Thay đổi riêng tuần khác được giữ nguyên khi cập nhật lịch lặp. Dữ liệu mới lưu trong `lich-hoc-weekly-v2`; dữ liệu `lich-hoc-v1` cũ được đọc khi chuyển đổi lần đầu.
