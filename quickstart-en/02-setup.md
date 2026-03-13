# Environment Setup

This guide helps you install all the necessary tools from scratch, even if you've never programmed before.

---

## 1. Install Docker

Docker is used to run PostgreSQL (database) and Valkey (message queue) without manual installation.

### macOS

```bash
# Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/
# After installation, open Docker Desktop and wait for it to finish starting (the Docker icon in the menu bar stops blinking)

# Verify Docker is installed:
docker --version
docker compose version
```

### Linux (Ubuntu/Debian)

```bash
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose-v2 -y

# Allow running Docker without sudo
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect

# Verify
docker --version
docker compose version
```

### Windows

```
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer, click Next until complete
3. Restart your computer if prompted
4. Open Docker Desktop, wait for it to finish starting
5. Open PowerShell or Command Prompt, type:
   docker --version
   docker compose version
```

> **Windows Note:** If you encounter WSL2-related errors, install WSL2 following Docker Desktop's instructions.

---

## 2. Install Go

Go (Golang) is used to run the backend server.

### macOS

```bash
# Option 1: Using Homebrew (if you already have Homebrew)
brew install go

# Option 2: Download from https://go.dev/dl/ and install the .pkg file

# Verify
go version
# Expected output: go version go1.25.x ...
```

### Linux

```bash
# Download Go (replace version if needed)
wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz

# Extract
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz

# Add Go to PATH (add this line to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin

# Apply immediately
source ~/.bashrc

# Verify
go version
```

### Windows

```
1. Download Go from: https://go.dev/dl/ (choose the .msi file for Windows)
2. Run the installer, click Next until complete
3. Open a new PowerShell window, type:
   go version
```

---

## 3. Install Node.js (for Frontend)

Node.js is used to run the frontend example.

### macOS

```bash
# Option 1: Using Homebrew
brew install node

# Option 2: Download from https://nodejs.org/ (choose LTS version)

# Verify
node --version
npm --version
```

### Linux

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### Windows

```
1. Download from: https://nodejs.org/ (choose LTS version)
2. Run the installer, click Next until complete
3. Open a new PowerShell window, type:
   node --version
   npm --version
```

---

## 4. Verify Everything is Ready

Open a terminal and run each command:

```bash
docker --version        # Docker version 20.x or higher
docker compose version  # Docker Compose version v2.x or higher
go version              # go version go1.25.x or higher
node --version          # v18.x or higher
npm --version           # 9.x or higher
```

If all commands display their versions, you're ready to go!

---

## Next

→ [03 - Running the Backend](./03-backend.md)
