# RVS Spec Sheet Generator

Web 应用，用于生成 RVS Lighting 产品的产品规格书（A4 排版，支持打印导出为 PDF）。

## 功能

- 填表式编辑产品规格参数（开孔尺寸 / 功率 / 光通量 / 色温 / 显色指数等）
- 上传产品图、产品线图、4 张配件图、4 张配光曲线图
- 图片前端压缩（Canvas，最大宽度可配）
- 拖拽上传、键盘快捷键（Ctrl+P 打印）
- 一键打印：A4 排版，可"另存为 PDF"（走浏览器打印对话框，不是服务端 PDF）

## 本地运行

```bash
pip install -r requirements.txt
python app.py
# 浏览器访问 http://127.0.0.1:5000
```

## 部署

应用为 Flask 静态站点，推荐用 gunicorn + nginx 反向代理运行。

```bash
gunicorn --bind 127.0.0.1:8000 --workers 3 app:app
```

nginx 反代示例见项目根目录的 `project_structure` 旁边的注释（暂未提供完整 vhost 模板）。

## 目录结构

```
.
├── app.py
├── requirements.txt
├── project_structure          # 仓库结构说明
├── templates/
│   └── index.html             # A4 规格书页面
└── static/
    ├── css/
    │   ├── spec-editor.css    # 编辑器样式
    │   └── print.css          # @media print 打印样式
    ├── js/
    │   ├── app.js             # 主入口
    │   └── image.js           # 图片压缩/上传
    └── images/
        └── logo.png
```

## 浏览器要求

- Chrome / Edge / Firefox / Safari 最新版
- `:has()` 伪类（Safari 15.4+）用于打印时智能隐藏空容器

## 已知限制

- 5MB 图片大小限制仅在 JS 端校验（应用暂无服务端 API）
- "导出 PDF" 实际为浏览器打印对话框
- 无数据持久化（刷新页面后已填内容丢失）
