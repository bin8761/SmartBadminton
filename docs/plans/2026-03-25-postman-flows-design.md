# Postman Flows (3 Flows) Design

## Goal
Tạo 3 Postman Flows riêng biệt để tự động hoá:
1) Đặt sân + thanh toán
2) Đặt sân + hủy
3) Kiểm tra sân trống

## Inputs (Collection Variables)
- `baseUrl`
- `username`
- `password`
- Thời gian động (GMT+7) được tạo trong flow, không lưu cố định.

## Shared Logic
- **Login** lấy `accessToken`.
- **Get available courts** dùng `date/startTime/endTime` động.
- Lấy `courtId` từ court đầu tiên trong danh sách.
- Nếu danh sách trống → dừng flow với thông báo.

## Dynamic Time (GMT+7)
Trong flow tạo:
- `date` = today (YYYY-MM-DD) theo GMT+7
- `startTime` = now + 2h (HH:mm)
- `endTime` = now + 3h (HH:mm)

## Flow A: Đặt sân + thanh toán
**Steps**
1. Login
2. Get available courts
3. Create booking (courtId + start/end)
4. Create payment QR (bookingId)
5. Verify payment (bookingId)

**Outputs**
- `bookingId`, `paymentTransactionId`, `paymentQrString`, `paymentExpiresAt`

## Flow B: Đặt sân + hủy
**Steps**
1. Login
2. Get available courts
3. Create booking (courtId + start/end)
4. Cancel booking (reason mặc định)

**Outputs**
- `bookingId`, `cancelRefundPolicy`, `cancelRefundAmount`, `refundTransactionId`

## Flow C: Kiểm tra sân trống
**Steps**
1. Login
2. Get available courts

**Outputs**
- Danh sách courts (log)
- `courtId` (court đầu tiên nếu có)

## Error Handling
- Login thất bại → dừng flow.
- Available courts rỗng → dừng flow và hiển thị message.

## Non-Goals
- Không gộp vào 1 flow lớn.
- Không quản lý refresh token trong flow.
