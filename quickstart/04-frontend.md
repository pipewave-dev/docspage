# Chạy Frontend

Frontend module (`echowave-femodule`) là một thư viện React cung cấp sẵn Provider và Hook để kết nối tới backend. Nó cũng bao gồm một trang Example để bạn test ngay.

---

## Bước 1: Cài đặt dependencies

Mở **terminal mới** (giữ terminal backend đang chạy), sau đó:

```bash
cd echowave-femodule
npm install
```

> **Lần đầu** chạy sẽ tải nhiều package, mất khoảng 1-2 phút.

---

## Bước 2: Chạy Development Server

```bash
npm run dev
```

Kết quả mong đợi:

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Mở trình duyệt tại **http://localhost:5173/** để thấy trang Example.

---

## Bước 3: Test giao tiếp WebSocket

Trên trang Example, bạn sẽ thấy:

1. **Access Token input**: Nhập token (chính là username). Mặc định là `"default"`.
2. **Status**: Trạng thái kết nối WebSocket (CONNECTING → READY).
3. **Text input + Send button**: Gửi message tới backend.
4. **Received Messages**: Hiển thị message nhận được từ backend.

### Test thử:

1. Đợi Status chuyển thành **READY**
2. Gõ `hello` vào ô input, nhấn **Send** (hoặc Enter)
3. Bạn sẽ thấy message phản hồi xuất hiện ở phần "Received Messages", ví dụ:
   ```
   Got [ hello ] at 15:30:45
   ```

### Test server push:

1. Nhập `userxxx` vào ô Access Token, nhấn **Reconnect**
2. Mỗi 6 giây, bạn sẽ nhận được message tự động từ server:
   ```
   hello, can you hear me? [15:30:48]
   ```
   (Vì trong playground, backend gửi message đến user `"userxxx"` mỗi 6 giây)

---

## Hiểu code Example (src/pages/Example.tsx)

### 1. Cấu hình kết nối

```tsx
const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',  // Địa chỉ backend
    insecure: true,                                // true = dùng ws:// (không SSL)
    debugMode: true,                               // Hiện log debug
    getAccessToken: async () => accessToken.value,  // Hàm lấy access token
})
```

| Thuộc tính | Mô tả |
|-----------|-------|
| `backendEndpoint` | Địa chỉ backend (không cần `ws://` hay `http://`) |
| `insecure` | `true` = dùng `ws://` và `http://`, `false` = dùng `wss://` và `https://` |
| `debugMode` | `true` = log chi tiết ra console |
| `getAccessToken` | Hàm async trả về access token. Backend dùng token này để xác thực user |

### 2. Wrap app với PipewaveProvider

```tsx
export default function ExamplePage() {
    return (
        <PipewaveProvider config={config} eventHandler={eventHandler}>
            <Chat />
        </PipewaveProvider>
    )
}
```

`PipewaveProvider` phải wrap toàn bộ component tree muốn dùng WebSocket. Tương tự React Context Provider.

> **Quan trọng:** `config` và `eventHandler` phải có **stable reference** (khai báo bên ngoài component hoặc dùng `useMemo`). Nếu tạo inline trong render, WebSocket sẽ bị reconnect liên tục.

### 3. Dùng hook usePipewave

```tsx
function Chat() {
    // Định nghĩa handler cho từng message type
    const onMessage: OnMessage = useMemo(() => ({
        'ECHO_RESPONSE': async (data: Uint8Array, id: string) => {
            const text = decoder.decode(data)
            setMessages(prev => [...prev, { id, text }])
        },
    }), [])

    // Lấy các API từ hook
    const { status, send, resetRetryCount } = usePipewave(onMessage)

    // Gửi message
    const handleSend = () => {
        send({
            id: crypto.randomUUID(),          // ID duy nhất cho message
            msgType: 'ECHO',                   // Kiểu message (backend dùng để route)
            data: encoder.encode(input),       // Nội dung (phải là Uint8Array)
        })
    }
}
```

### Chi tiết usePipewave hook

```tsx
const { status, send, resetRetryCount, reconnect } = usePipewave(onMessage)
```

| Giá trị | Kiểu | Mô tả |
|---------|------|-------|
| `status` | `string` | Trạng thái kết nối: `"CONNECTING"`, `"READY"`, `"CLOSED"`, `"SUSPEND"` |
| `send` | `function` | Gửi message. Nhận `{ id, msgType, data }` |
| `resetRetryCount` | `function` | Reset bộ đếm retry khi ở trạng thái SUSPEND |
| `reconnect` | `function` | Ngắt kết nối hiện tại và kết nối lại |

### Trạng thái kết nối (status)

```
CONNECTING → READY → (nếu mất kết nối) → CONNECTING → READY
                                        → (nếu retry hết) → SUSPEND
```

| Status | Ý nghĩa |
|--------|---------|
| `CONNECTING` | Đang kết nối tới backend |
| `READY` | Đã kết nối, sẵn sàng gửi/nhận message |
| `CLOSED` | Đã ngắt kết nối |
| `SUSPEND` | Đã retry tối đa số lần cho phép, không tự kết nối lại. Gọi `resetRetryCount()` để thử lại |

### 4. Format dữ liệu message

Message gửi đi và nhận về đều ở dạng **Uint8Array** (byte array). Bạn cần encode/decode thủ công:

```tsx
// Encode: string → Uint8Array (khi gửi)
const encoder = new TextEncoder()
const data = encoder.encode("hello world")

// Decode: Uint8Array → string (khi nhận)
const decoder = new TextDecoder()
const text = decoder.decode(data)
```

> **Tại sao dùng Uint8Array?** Để hỗ trợ gửi bất kỳ loại dữ liệu nào (JSON, binary, protobuf...), không giới hạn ở text. Nếu bạn muốn gửi JSON:
>
> ```tsx
> // Gửi
> const data = encoder.encode(JSON.stringify({ name: "Alice", age: 25 }))
>
> // Nhận
> const obj = JSON.parse(decoder.decode(data))
> ```

---

## Long Polling Fallback

EchoWave tự động chuyển từ WebSocket sang Long Polling nếu WebSocket không khả dụng (ví dụ: bị firewall chặn).

- Hành vi này được bật mặc định qua `enableLongPollingFallback: true` trong Provider
- Transport đã chứng minh hoạt động được sẽ được lưu vào `sessionStorage` để không cần thử lại
- Bạn có thể **ép dùng Long Polling** để test bằng cách set localStorage trong browser console:

```javascript
localStorage.setItem('FORCE_LONG_POLLING', 'true')
```

Xoá để quay lại WebSocket:

```javascript
localStorage.removeItem('FORCE_LONG_POLLING')
```

---

## Xử lý lỗi thường gặp

### Status luôn ở CONNECTING, không chuyển sang READY

```
Nguyên nhân: Backend chưa chạy, hoặc sai endpoint
Kiểm tra:
  1. Backend có đang chạy không? (terminal hiển thị "Starting server on :8080")
  2. backendEndpoint có đúng là 'localhost:8080/websocket' không?
  3. Mở browser DevTools → Console để xem lỗi chi tiết
```

### "Access-Control-Allow-Origin" error trong Console

```
Nguyên nhân: CORS chưa được cấu hình
Giải pháp:   Kiểm tra config.yaml phần CORS đã cho phép origin của frontend
             (mặc định đã cho phép localhost:*)
```

### npm install bị lỗi

```
Nguyên nhân: Phiên bản Node.js quá cũ
Giải pháp:   Cập nhật Node.js lên version 18 trở lên
```

---

## Tiếp theo

→ [05 - Hiểu cách hoạt động](./05-how-it-works.md)
