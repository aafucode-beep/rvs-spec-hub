# RVS Spec Sheet Generator

> **状态**: Phase 2 重构完成，可以开始新功能开发
> **起源**: 从 [SIMPLESEEK/rvsspeclitebeta](https://github.com/SIMPLESEEK/rvsspeclitebeta) 导入（基于 commit `065a8ef`，2025-05-13）
> **本仓建立时间**: 2026-06-05
> **本仓维护者账号**: [yjhkrepo](https://github.com/yjhkrepo)
> **目标部署域名**: `rvs-lighting.com` / `www.rvs-lighting.com`

---

## 这是什么

一个 Flask Web 应用，用于生成 RVS Lighting 产品的产品规格书（规格表）。用户填写产品规格参数、上传产品图/线图/配件图/配光曲线图，浏览器打印对话框另存为 PDF。

**当前实际能力**:
- 表单式编辑产品规格（开孔尺寸、功率、光通量、色温、显色指数等 17+ 项）
- 11 个图片槽位（1 主图 + 1 线图 + 4 配件 + 4 配光曲线 + 1 LOGO）
- 前端图片压缩（Canvas，最大宽度可配）
- 拖拽上传、键盘快捷键（`Ctrl+P` 打印）
- A4 排版打印输出（"另存为 PDF" 走浏览器对话框，不是服务端 PDF）

**明确不存在的功能**（不要在文档/PR 中承诺）:
- ❌ 服务端 PDF 导出（虽然旧 README 声称有）
- ❌ 数据持久化（刷新即丢失）
- ❌ i18n（`data-i18n` 属性是空钩子，没有翻译函数）

---

## 项目历史

### 来源仓 `SIMPLESEEK/rvsspeclitebeta`

旧仓现状（迁移时快照）:
- 单一 `templates/index.html` 1697 行，所有 CSS+JS 全内联
- `static/css/style.css`（33 行）和 `static/css/spec_sheet.css`（299 行）**完全没被引用**
- `pdf_generator.py` 是空壳（只 import Flask，路由返回 `index.html`）
- `uploads/` 下 4 张测试图被提交进 git
- `__pycache__/pdf_generator.cpython-313.pyc` 也被提交
- 没有任何 `.gitignore`
- `requirements.txt` 是 2021 年的旧版本（含 CVE）
- `Procfile` 是空文件（一个空格）
- README 谎称有 `.zeabur/Dockerfile`，但仓库里不存在

### 本仓改造（2026-06-05）

只做了 **Phase 2 重构**（仓库卫生、依赖升级、README 修复等 Phase 1 项目按要求跳过）。

完整 Review 见对话历史，迁移到本仓时**有意排除**了:
- `pdf_generator.py`（空壳）
- `vercel.json` / `zeabur.json` / `Procfile`（旧部署配置）
- `uploads/`（测试图）
- `__pycache__/`
- 旧的 4 条提交历史（全新单 commit 起步）

---

## 仓库操作

### 克隆

```bash
git clone https://github.com/yjhkrepo/rvs-spec-hub.git
cd rvs-spec-hub
```

公开仓库，无需认证。

### 分支与提交

- **默认分支**: `main`
- **新功能**: 从 `main` 拉 feature 分支，完成后提 PR 合并
- **commit 风格**: 祈使句、单行概要 + 换行 bullet 列举改动
- **不要直接 push 到 main**

### 本地开发

```bash
pip install -r requirements.txt
python app.py
# 浏览器访问 http://127.0.0.1:5000
```

---

## 当前架构

```
.
├── app.py                       # Flask: '/' → index.html, catch-all → index.html (SPA fallback)
├── requirements.txt             # Flask 2.0.1 等旧版本（见 Phase 1 待办）
├── project_structure            # 非正式目录树文档
├── README.md                    # 本文件
├── templates/
│   └── index.html               # A4 规格书页面，284 行（仅 HTML）
└── static/
    ├── css/
    │   ├── spec-editor.css      # 基础 + 布局 + 交互，~750 行
    │   └── print.css            # @media print，~120 行（合并自 3 个分散块）
    ├── js/
    │   ├── app.js               # DOMContentLoaded 初始化、事件绑定、参数单位、键盘、拖拽、LOGO
    │   └── image.js             # 图片压缩、主图/网格上传（统一接口）
    └── images/
        └── logo.png             # 芮光品牌 LOGO
```

### 全局函数（供其他 agent 复用）

| 文件 | 函数 | 用途 |
|---|---|---|
| `app.js` | `uploadLogo()` | 触发隐藏的 LOGO file input |
| `app.js` | `showToast(message)` | 顶部居中 Toast 提示，2 秒自动消失 |
| `image.js` | `compressImage(file, maxWidth, quality)` | Canvas 压缩 + 灰底去透明，返回 Blob |
| `image.js` | `handleImageUpload(input, imgId)` | 主产品图 / 产品线图上传（带压缩） |
| `image.js` | `handleGridImageUpload({kind, container, index})` | 配件/曲线网格上传（统一接口，`kind: 'accessory' \| 'curve'`） |

### 关键 DOM ID / class

- 11 个图片槽位: `.preview-image`, `.preview-diagram`, 4× `.accessory-box`, 4× `.curve-box`
- 主图预览: `#previewImage`, `#diagramPreview`, `#logoImage`
- 参数表: `.params-table input[data-unit]`，blur 时自动追加单位
- 打印按钮: `.print-btn`，绑定 `window.print()`

---

## Phase 2 改动清单（2026-06-05）

### 新增文件
- `static/css/spec-editor.css` (748 行)
- `static/css/print.css` (117 行)
- `static/js/app.js` (156 行)
- `static/js/image.js` (198 行)
- 重写 `templates/index.html` (1697 → 284 行)
- 更新 `project_structure`

### 删除
- `static/css/style.css` (33 行死代码)
- `static/css/spec_sheet.css` (299 行死代码)
- `image-preview-modal` 整套（HTML + CSS + JS），`showImagePreview` 等函数从未被任何 UI 流程调用

### Bug 修复
- 移除 `window.event` 隐式依赖（`uploadAccessory`/`uploadCurve` 内联 handler）
- 拖拽上传到 `.curve-box` 之前会静默落到 `.accessory-box` 分支 → 独立处理
- 主图/线图原本无压缩 → 加入 `compressImage(file, 1800, 0.8)`
- `Esc` 键 handler 调用不存在的 `closeImagePreview` → 删除
- `handleSmallImageUpload` + `handleCurveImageUpload` 90% 重复 → 统一为 `handleGridImageUpload({kind, container, index})`
- 8 个内联 `onclick="uploadAccessory(this, N)"` → `data-index` 属性 + JS 绑定

### 净行数
- 之前: 2029 行（1 个文件 + 2 个死文件）
- 之后: 1503 行（5 个活文件，结构清晰）
- 实际减少: 526 行（消除重复 @media print + 删除死代码）

---

## 待办事项（Open Work）

> 重要: 接手前请读这里。Phase 1 是上次的明确跳过项，**生产部署前必做**。

### 🔴 Phase 1 — 仓库卫生（部署前必做）

- [ ] 添加 `.gitignore`：
  ```
  __pycache__/
  *.pyc
  .venv/
  venv/
  uploads/
  .vscode/
  .idea/
  .DS_Store
  ```
- [ ] 升级 `requirements.txt`（CVE 修复）：
  - `Flask>=3.0,<4`
  - `Werkzeug>=3.0`
  - `Jinja2>=3.1`
  - `MarkupSafe>=2.1`
  - `itsdangerous>=2.2`
  - `click>=8.1`
- [ ] 删 `Procfile`（本仓没纳入；如以后加入，要写 `web: gunicorn app:app`）
- [ ] README 如加入"导出 PDF"措辞需更新（避免旧仓那种假承诺）

### 🟡 Phase 3 — 真正的服务端 PDF 导出

选定方案: **weasyprint**（服务端，精确可控）

任务:
- [ ] `requirements.txt` 加 `weasyprint`
- [ ] 写 `pdf_generator.py`：`POST /generate-pdf` 接受当前表单状态，渲染 PDF 返回
- [ ] 写一个 print-only 的 Jinja 模板（隐藏交互元素、按钮、表头等）
- [ ] 把 `<button onclick="window.print()">` 改成 fetch + 下载链接（或 `<form method="post">`）
- [ ] **部署注意**: weasyprint 需要系统库 `libpango`、`libcairo`。Vercel **不支持**。目标平台必须是 Railway / Zeabur / Docker
- [ ] 部署时验证中文字体回退（系统装 `fonts-noto-cjk` 或打包字体进容器）

### 🟢 Phase 4 — 产品打磨

- [ ] 配件/曲线拖拽重排（[SortableJS](https://github.com/SortableJS/Sortable)，~30 行）
- [ ] LocalStorage 自动保存草稿（每输入触发 + 页面加载时恢复）
- [ ] i18n 二选一:
  - 方案 A: 用 [i18next](https://www.i18next.com/) 实现
  - 方案 B: 删光所有 `data-i18n` 属性（39+ 处空钩子）
- [ ] 无障碍 (A11y):
  - 表单 `<label>` 关联
  - 上传按钮 `aria-label`
  - 键盘可达性（Tab、Enter、Esc）
- [ ] 删除 5 行硬编码的 `additional-info-2`~`additional-info-5`，改成"+添加一行"

---

## 部署指南

### 目标环境
- Linux (Ubuntu 22.04+ / Debian 12+)
- Python 3.10+
- systemd（推荐）
- nginx 反向代理

### 步骤

```bash
# 1. 准备用户
sudo useradd --system --shell /usr/sbin/nologin --home /opt/rvs-spec-hub rvs

# 2. 部署代码
sudo git clone https://github.com/yjhkrepo/rvs-spec-hub.git /opt/rvs-spec-hub
sudo chown -R rvs:rvs /opt/rvs-spec-hub

# 3. 虚拟环境
sudo -u rvs python3 -m venv /opt/rvs-spec-hub/venv
sudo -u rvs /opt/rvs-spec-hub/venv/bin/pip install -r /opt/rvs-spec-hub/requirements.txt gunicorn

# 4. systemd 单元
sudo tee /etc/systemd/system/rvs-spec-hub.service >/dev/null <<'EOF'
[Unit]
Description=RVS Spec Sheet Generator
After=network.target

[Service]
User=rvs
Group=rvs
WorkingDirectory=/opt/rvs-spec-hub
Environment="PATH=/opt/rvs-spec-hub/venv/bin"
ExecStart=/opt/rvs-spec-hub/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now rvs-spec-hub

# 5. nginx vhost (HTTP only, TLS 见 Phase 4+)
sudo tee /etc/nginx/sites-available/rvs-lighting >/dev/null <<'EOF'
server {
    listen 80;
    server_name rvs-lighting.com www.rvs-lighting.com;

    client_max_body_size 6M;  # 略大于 5MB 上限，避免 nginx 拦截

    location /static/ {
        alias /opt/rvs-spec-hub/static/;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/rvs-lighting /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. DNS: 在域名注册商把 A 记录指向服务器 IP
```

### 验证

```bash
# 服务状态
sudo systemctl status rvs-spec-hub

# 本地端口
curl -sI http://127.0.0.1:8000/ | head -3

# 静态资源
curl -sI http://127.0.0.1:8000/static/css/spec-editor.css | head -3
curl -sI http://127.0.0.1:8000/static/js/app.js | head -3

# 公网（DNS 生效后）
curl -sI http://rvs-lighting.com/ | head -3
```

---

## 已知技术债

- 5MB 图片上限仅 JS 校验（无服务端 API 所以攻击面被绕过）
- 无数据持久化（刷新即丢失）
- `data-i18n` 在 39+ 处但无翻译运行时
- 品牌信息（芮光、上海芮维溪智能科技、邮箱、地址）硬编码 HTML，单租户
- 5 行硬编码的 `补充信息 2~5` 应改为动态增删
- `app.py` catch-all 路由对所有未匹配路径返回 `index.html`（SPA fallback），但目前**没有**真正的客户端路由，可能掩盖路径错误

## 浏览器要求

- `:has()` CSS 伪类用于打印时智能隐藏（Safari 15.4+ / Chrome 105+ / Firefox 121+）
- 其他现代 evergreen 浏览器均可
- 移动端可用但体验未优化

## License

无 license 文件。**默认保留所有权利**。如需开源/团队使用，请先与项目所有者确认。
