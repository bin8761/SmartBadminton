# Postman Response Variables Design

## Goal
Tự động lấy các trường cần dùng từ response và lưu vào Collection Variables trong Postman, theo cách per-request để ít lỗi và dễ kiểm soát.

## Scope
- Chỉ áp dụng cho các request quan trọng tạo dữ liệu dùng lại.
- Mỗi request có Post-response script riêng.
- Lưu biến ở **Collection Variables**.

## Variables & Sources
- Auth:
  - `accessToken` ← `data.tokens.accessToken`
  - `refreshToken` ← `data.tokens.refreshToken`
  - `userId` ← `data.user.id`
  - `username` ← `data.user.username` (tuỳ chọn)
- Bookings:
  - `bookingId` ← `data.id`
  - `courtId` ← `data.courtId`
  - `bookingStatus` ← `data.status`
- Payments:
  - `paymentTransactionId` ← `data.paymentTransactionId`
  - `paymentQrString` ← `data.qrString`
  - `paymentExpiresAt` ← `data.expiresAt`
- Cancel booking:
  - `cancelRefundPolicy` ← `data.refundPolicy`
  - `cancelRefundAmount` ← `data.refundAmount`
  - `refundTransactionId` ← `data.refundTransactionId`

## Script Behavior
- Chỉ parse JSON khi response status là 2xx.
- Nếu field không tồn tại: không set biến (tránh lỗi).
- Nếu response không phải JSON: bỏ qua.

## Placement
- Post-response script trên từng request:
  - `POST /api/auth/login` (hoặc `/register`)
  - `POST /api/bookings`
  - `POST /api/payments/{bookingId}/qr`
  - `POST /api/bookings/{bookingId}/cancel` (nếu dùng)

## Error Handling
- Guard `pm.response.code` trong 200–299.
- Dùng `try/catch` khi `pm.response.json()`.

## Testing Plan
- Chạy tuần tự:
  1) Login → kiểm tra `accessToken`, `userId`
  2) Create booking → kiểm tra `bookingId`, `courtId`
  3) Create payment QR → kiểm tra `paymentTransactionId`
- Mở tab Collection Variables để xác nhận.

## Non-Goals
- Không gom logic lên collection-level.
- Không tự động refresh token.
