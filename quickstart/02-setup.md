# Cài đặt môi trường

Hướng dẫn này giúp bạn cài đặt tất cả công cụ cần thiết từ đầu, ngay cả khi bạn chưa từng lập trình.

---

## 1. Cài đặt Docker

Docker dùng để chạy PostgreSQL (database) và Valkey (message queue) mà không cần cài đặt thủ công.

### macOS

```bash
# Tải và cài Docker Desktop từ: https://www.docker.com/products/docker-desktop/
# Sau khi cài, mở Docker Desktop và đợi nó khởi động xong (biểu tượng Docker trên thanh menu không còn nhấp nháy)

# Kiểm tra Docker đã cài thành công:
docker --version
docker compose version
```

### Linux (Ubuntu/Debian)

```bash
# Cài Docker
sudo apt update
sudo apt install docker.io docker-compose-v2 -y

# Cho phép chạy Docker không cần sudo
sudo usermod -aG docker $USER
# Đăng xuất rồi đăng nhập lại để có hiệu lực

# Kiểm tra
docker --version
docker compose version
```

### Windows

```
1. Tải Docker Desktop từ: https://www.docker.com/products/docker-desktop/
2. Chạy file cài đặt, nhấn Next cho đến khi xong
3. Khởi động lại máy nếu được yêu cầu
4. Mở Docker Desktop, đợi khởi động xong
5. Mở PowerShell hoặc Command Prompt, gõ:
   docker --version
   docker compose version
```

> **Lưu ý Windows:** Nếu gặp lỗi liên quan WSL2, hãy cài WSL2 theo hướng dẫn của Docker Desktop.

---

## 2. Cài đặt Go

Go (Golang) dùng để chạy backend server.

### macOS

```bash
# Cách 1: Dùng Homebrew (nếu đã có Homebrew)
brew install go

# Cách 2: Tải từ https://go.dev/dl/ và cài file .pkg

# Kiểm tra
go version
# Kết quả mong đợi: go version go1.25.x ...
```

### Linux

```bash
# Tải Go (thay phiên bản nếu cần)
wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz

# Giải nén
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz

# Thêm Go vào PATH (thêm dòng này vào ~/.bashrc hoặc ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin

# Áp dụng ngay
source ~/.bashrc

# Kiểm tra
go version
```

### Windows

```
1. Tải Go từ: https://go.dev/dl/ (chọn file .msi cho Windows)
2. Chạy file cài đặt, nhấn Next cho đến khi xong
3. Mở PowerShell mới, gõ:
   go version
```

---

## 3. Cài đặt Node.js (cho Frontend)

Node.js dùng để chạy frontend example.

### macOS

```bash
# Cách 1: Dùng Homebrew
brew install node

# Cách 2: Tải từ https://nodejs.org/ (chọn LTS version)

# Kiểm tra
node --version
npm --version
```

### Linux

```bash
# Dùng NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node --version
npm --version
```

### Windows

```
1. Tải từ: https://nodejs.org/ (chọn LTS version)
2. Chạy file cài đặt, nhấn Next cho đến khi xong
3. Mở PowerShell mới, gõ:
   node --version
   npm --version
```

---

## 4. Kiểm tra tất cả đã sẵn sàng

Mở terminal và chạy lần lượt:

```bash
docker --version        # Docker version 20.x trở lên
docker compose version  # Docker Compose version v2.x trở lên
go version              # go version go1.25.x trở lên
node --version          # v18.x trở lên
npm --version           # 9.x trở lên
```

Nếu tất cả lệnh đều hiển thị phiên bản, bạn đã sẵn sàng!

---

## Tiếp theo

→ [03 - Chạy Backend](./03-backend.md)
