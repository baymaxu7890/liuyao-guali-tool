# 六爻卦例工具

Vue 3 + TypeScript 的六爻排盘与综合术数工作台，包含：

- 六爻起卦、排盘、卦例归档和导入导出
- 万年历、干支搜索、五虎遁与五鼠遁约束
- 六爻歌诀及预留的梅花、八字、奇门模块
- 浏览器本地备份、JSON 下载和服务器多云自动备份
- Windows 桌面版与应用数据目录自动备份

## 本地开发

```bash
npm ci
npm run dev
```

本地开发默认关闭服务器云备份，排盘、日历和本地保存不依赖云端接口。

## 构建与验证

```bash
npm run verify
npm run build
npm run build:port80
```

- `npm run build` 生成部署在站点根路径的 `dist/`。
- `npm run build:port80` 生成部署在 `/tool/` 的 `dist-port80/`。
- 两个构建目录均为生成物，不提交到 Git。

## Windows 桌面版

桌面版使用 Tauri 2，与网页版共用同一套 Vue 源码。它可以完全离线运行；云端接口、云盘登录或网络异常不会影响排盘、日历、歌诀与本地归档。

首次编译需要安装 Rust、Microsoft C++ Build Tools 和 WebView2。环境就绪后执行：

```bash
npm run desktop:dev
npm run desktop:build
```

`npm run desktop:build` 会生成：

- 可直接运行的程序：`src-tauri/target/release/liuyao-guali-tool.exe`
- Windows x64 安装程序：`src-tauri/target/release/bundle/nsis/六爻综合排盘_1.0.0_x64-setup.exe`

桌面版每次归档、更新、删除或导入后都会自动写入：

- `%APPDATA%/com.baymaxu.liuyao/backups/六爻排盘_latest.json`
- `%APPDATA%/com.baymaxu.liuyao/backups/历史备份/六爻排盘_YYYY-MM-DD.json`

浏览器和桌面版的本地数据空间相互独立。首次使用桌面版时，可以先在网页版“导出所有”，再在桌面版“导入卦例”，完成一次性迁移。

## 云端备份

浏览器始终先保存本地数据，再异步请求 `/api/backup`。云端超时或登录失败只会改变备份状态，不会阻断排盘、日历、歌诀或本地归档。

服务器会同时维护：

- `六爻排盘备份/六爻排盘_latest.json`
- `六爻排盘备份/历史备份/六爻排盘_YYYY-MM-DD.json`

后端支持通过 rclone 同步到坚果云、Yandex Disk 和 Box。云盘账号、OAuth 令牌、WebDAV 应用密码以及备份接口密码只能保存在服务器，禁止写入源码或提交到 Git。

## 阿里云部署结构

当前生产部署使用：

- 一个 `nginx:alpine` 容器：80 端口保留原站并提供 `/tool/`，888 端口提供综合排盘。
- 一个宿主机 systemd 服务 `liuyao-backup.service`：运行 `server/index.mjs`。
- rclone：并行上传坚果云、Yandex Disk 和 Box。
- Nginx Basic Auth：保护 `/api/`，避免公网访客覆盖备份。

相关文件位于 `deploy/aliyun/`：

- `install_host_service.sh`：安装宿主机备份服务。
- `configure_multicloud.sh`：配置及启用多云目标。
- `setup_secrets.sh`：交互式生成备份接口密码文件，不包含固定密码。
- `deploy_static.sh`：原根路径版本的原子发布。
- `deploy_port80_static.sh`：`/tool/` 版本的原子发布。
- `start_single_nginx.sh`：启动单个 Nginx 容器。
- `test_multicloud.sh`：上传并校验三家云盘。
- `sites.conf`：80/888 双入口及 `/api/` 反向代理配置。

不要把服务器上的以下文件复制进 Git：

- `/etc/liuyao-backup/env`
- `/var/lib/liuyao-backup/rclone/rclone.conf`
- `/docker/nginx/secrets/backup.htpasswd`

## 简单 Docker Compose 部署

仓库仍保留 `docker-compose.yml`，可用于单独部署 Web 与备份 API。先复制并填写服务器专用的 `deploy/.env`，再生成 `deploy/.htpasswd`；这两个文件已被 `.gitignore` 排除。

```bash
cp deploy/.env.example deploy/.env
docker compose up -d --build
```
