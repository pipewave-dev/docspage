# Chạy Backend

## Bước 1: Khởi động Infrastructure (PostgreSQL + Valkey)

Mở terminal tại thư mục gốc của project, sau đó:

```bash
cd echowave-backend
docker compose up -d
```

Lệnh này sẽ khởi động:
- **PostgreSQL** (database) — port `29102`
- **Valkey** (message queue, tương tự Redis) — port `29100`

> **`-d` nghĩa là gì?** Chạy ở chế độ nền (detach). Terminal sẽ không bị chiếm bởi log của Docker.

Kiểm tra các service đã chạy:

```bash
docker compose ps
```

Kết quả mong đợi — cả 2 service đều ở trạng thái `Up`:

```
NAME                    STATUS
echowave-backend-valkey-1     Up
echowave-backend-postgres-1   Up
```

> **Lưu ý:** Lần đầu chạy sẽ mất vài phút để Docker tải image. Các lần sau sẽ nhanh hơn.

---

## Bước 2: Chạy Backend Server

Vẫn trong thư mục `echowave-backend`:

```bash
go run ./playground
```

Kết quả mong đợi:

```
xxx
Starting server on :8080
Worker pool stats: ...
```

Backend đã sẵn sàng tại `http://localhost:8080`.

> **Lưu ý:** Cửa sổ terminal này cần giữ mở. Backend sẽ dừng nếu bạn đóng terminal hoặc nhấn `Ctrl+C`.

---

## Hiểu file cấu hình (config.yaml)

File `echowave-backend/config.yaml` chứa cấu hình cho backend. Một số mục quan trọng:

### Kết nối Valkey (Message Queue)

```yaml
VALKEY:
  PRIMARY_ADDRESS: "localhost:29100"
  REPLICA_ADDRESS: "localhost:29100"
  PASSWORD: veryStrongP@ssw0rd
  DB_INDEX: 0
```

### Kết nối PostgreSQL

```yaml
POSTGRES:
  CREATE_TABLES: true        # Tự tạo bảng khi khởi động
  HOST: localhost
  PORT: 29102
  DB_NAME: postgres
  USER: postgres
  PASSWORD: postgres
  SSL_MODE: disable
  MAX_CONNS: 15
  MIN_CONNS: 1
```

### CORS (cho phép frontend kết nối)

```yaml
CORS:
  ENABLED: true
  REGEX_ORIGINS:
    - ws://localhost:([0-9]+)
    - wss://localhost:([0-9]+)
    - http://localhost:([0-9]+)
    - https://localhost:([0-9]+)
```

> Cấu hình mặc định đã cho phép mọi kết nối từ `localhost`, phù hợp cho môi trường phát triển.

---

## Hiểu file playground/main.go

File `playground/main.go` là entry point của backend. Dưới đây là giải thích từng phần:

### 1. Khởi tạo app

```go
appDI := app.NewPipewave(
    config,
    slog.Default(),
    ddbRepo.NewPostgresRepo,       // Chọn PostgreSQL làm database
    queueprovider.QueueValkey,     // Chọn Valkey làm message queue
)
```

Bạn có thể chuyển sang DynamoDB bằng cách thay đổi import:

```go
// Thay dòng này:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-postgres"

// Thành dòng này:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-dynamodb"
```

> Khi dùng DynamoDB, bạn cần uncomment phần `dynamodb-local` trong `docker-compose.yml` và cập nhật config tương ứng.

### 2. Hàm xác thực token (InspectToken)

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    return trimToken(token), false, nil
},
```

Hàm này nhận access token từ client và trả về:
- `username`: tên người dùng
- `IsAnonymous`: có phải user ẩn danh không
- `err`: lỗi (nếu có)

**Trong playground**, token chính là username (để dễ test). Trong thực tế, bạn sẽ thay bằng logic xác thực JWT hoặc gọi tới auth service.

### 3. Hàm xử lý message (HandleMessage)

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    fmt.Printf("Received message with inputType: %s and data: %s\n", inputType, string(data))
    return "ECHO_RESPONSE",
        fmt.Appendf(nil, "Got [ %s ] at %s", string(data), time.Now().Format(time.TimeOnly)),
        nil
},
```

Hàm này nhận message từ client và trả về response:
- `inputType`: kiểu message client gửi lên (ví dụ: `"ECHO"`)
- `data`: nội dung message (dạng bytes)
- Trả về `outputType` + `res` → gửi lại cho client
- Nếu `outputType` rỗng `""` → không gửi response về client

**Trong playground**, server echo lại message kèm timestamp.

### 4. Server push (gửi message từ server)

```go
ws := appDI.Delivery.Services().Websocket()
go func() {
    for t := range time.Tick(6 * time.Second) {
        ws.SendToUser(context.Background(), testUser, "ECHO_RESPONSE",
            fmt.Appendf(nil, "hello, can you hear me? [%s]", t.Format(time.TimeOnly)))
    }
}()
```

Backend có thể chủ động gửi message tới user bất kỳ lúc nào bằng `SendToUser(ctx, username, msgType, data)`.

**Trong playground**, mỗi 6 giây server gửi một message tới user `"userxxx"`.

---

## Xử lý lỗi thường gặp

### "connection refused" khi kết nối PostgreSQL hoặc Valkey

```
Nguyên nhân: Docker containers chưa khởi động xong
Giải pháp:   Chờ vài giây rồi chạy lại, hoặc kiểm tra bằng: docker compose ps
```

### "port already in use" (port 8080)

```
Nguyên nhân: Có ứng dụng khác đang dùng port 8080
Giải pháp:   Tắt ứng dụng đó, hoặc thay đổi port trong main.go:
             Addr: ":8081"  (thay 8080 thành port khác)
```

### "go: module not found" hoặc lỗi tải module

```
Nguyên nhân: Chưa tải dependencies
Giải pháp:   Chạy: go mod download
             (trong thư mục echowave-backend)
```

---

## Dừng Backend

- Nhấn `Ctrl+C` trong terminal đang chạy backend
- Để dừng Docker containers:

```bash
docker compose down
```

> **Lưu ý:** `docker compose down` sẽ dừng PostgreSQL và Valkey. Dữ liệu PostgreSQL được lưu trong `./tmp/postgres-data` nên không bị mất khi restart.

---

## Tiếp theo

→ [04 - Chạy Frontend](./04-frontend.md)
