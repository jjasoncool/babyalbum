# Baby Album Project

這是一個使用 PocketBase 作為後端的相簿網站專案。

## 快速啟動

```bash
docker-compose up -d
```

## 建立管理員帳號 (必要步驟)

在 Docker 環境下使用新版 PocketBase 時，可能無法直接透過網頁介面建立第一組管理員帳號。
請**務必**使用以下指令直接在容器內建立：

```bash
# 語法：docker exec -it <container_name> /pb/pocketbase superuser create <email> <password>
docker exec -it baby-album-backend /pb/pocketbase superuser create admin@example.com 1234567890
```

> **注意**：請將 `admin@example.com` 與 `1234567890` 替換為您實際想要使用的帳號與密碼 (密碼至少需 8 碼)。

建立完成後，您即可前往網站管理後台 `/_/` (例如 `http://localhost:8090/_/` 或您的網域名稱) 進行登入。

## Docker Compose 端口配置說明

本專案使用 `expose` 而非 `ports` 是因為 demo network 中有 nginx reverse server 負責反向代理。如果您需要直接從宿主機訪問 PocketBase 的端口，可以修改 `docker-compose.yaml` 中的配置：

將 `expose:` 替換為 `ports:`，並設定為 `"${PB_PORT}:${PB_PORT}"`。

## 目錄結構說明

- **pb_data/**: 存放 SQLite 資料庫與使用者上傳的檔案 (已加入 gitignore，請勿刪除)。
- **pb_public/**: 存放前端靜態網頁檔案 (HTML/CSS/JS)。
- **pb_migrations/**: 存放資料庫結構變更紀錄 (用於版本控管)。
- **.env**: 環境變數設定 (包含 PocketBase 版本與 Port 設定)。
