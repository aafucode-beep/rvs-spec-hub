// app.js — 主入口：DOMContentLoaded 时挂事件、绑定键盘/拖拽/参数单位/LOGO 上传
// 注意：image.js 暴露的 handleImageUpload / handleGridImageUpload 在此被调用

document.addEventListener('DOMContentLoaded', () => {
    // ---------- 主产品图 / 产品线图：change 事件触发上传 ----------
    document.getElementById('productImage').addEventListener('change', function () {
        handleImageUpload(this, 'previewImage');
    });

    document.getElementById('productDiagram').addEventListener('change', function () {
        handleImageUpload(this, 'diagramPreview');
    });

    // ---------- 配件图 / 配光曲线：data-index 决定槽位 ----------
    document.querySelectorAll('.accessory-box').forEach((box, index) => {
        box.dataset.index = index;
        box.addEventListener('click', () => {
            handleGridImageUpload({ kind: 'accessory', container: box, index });
        });
    });

    document.querySelectorAll('.curve-box').forEach((box, index) => {
        box.dataset.index = index;
        box.addEventListener('click', () => {
            handleGridImageUpload({ kind: 'curve', container: box, index });
        });
    });

    // ---------- 参数表 input 自动追加单位 ----------
    document.querySelectorAll('.params-table input').forEach(input => {
        const unit = input.dataset.unit;

        input.addEventListener('blur', function () {
            let value = this.value.trim();
            if (!value || !unit) return;

            if (!value.endsWith(unit)) {
                if (value.includes('/')) {
                    value = value + unit;
                } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        value = numValue + unit;
                    }
                }
            }
            this.value = value;
            this.setAttribute('value', value);
        });

        input.addEventListener('focus', function () {
            if (!unit) return;
            const value = this.value.trim();
            if (value.endsWith(unit)) {
                this.value = value.slice(0, -unit.length);
            }
        });
    });

    // ---------- 键盘快捷键 ----------
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
    });

    // ---------- 拖拽上传（主图 / 线图 / 配件 / 曲线） ----------
    document.querySelectorAll('.preview-image, .preview-diagram, .accessory-box, .curve-box').forEach(zone => {
        zone.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('请上传图片文件');
                return;
            }

            if (this.classList.contains('preview-image')) {
                handleImageUpload({ files: [file] }, 'previewImage');
            } else if (this.classList.contains('preview-diagram')) {
                handleImageUpload({ files: [file] }, 'diagramPreview');
            } else if (this.classList.contains('accessory-box')) {
                handleGridImageUpload({ kind: 'accessory', container: this, index: Number(this.dataset.index) || 0 });
            } else if (this.classList.contains('curve-box')) {
                handleGridImageUpload({ kind: 'curve', container: this, index: Number(this.dataset.index) || 0 });
            }
        });
    });

    // ---------- LOGO 上传 ----------
    document.getElementById('logoInput').addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('请上传图片文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('图片大小不能超过 5MB');
            return;
        }

        try {
            const compressedBlob = await compressImage(file, 800, 0.9);
            const objectUrl = URL.createObjectURL(compressedBlob);

            const logoImg = document.getElementById('logoImage');
            logoImg.style.opacity = '0';

            const tempImg = new Image();
            tempImg.onload = () => {
                logoImg.src = objectUrl;
                requestAnimationFrame(() => {
                    logoImg.style.opacity = '1';
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 300);
                });
            };
            tempImg.src = objectUrl;
        } catch (err) {
            showToast('图片处理失败，请重试');
        }
    });
});

// ---------- LOGO 区域点击：触发隐藏的文件 input ----------
function uploadLogo() {
    document.getElementById('logoInput').click();
}

// ---------- Toast 提示 ----------
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
    });
}
