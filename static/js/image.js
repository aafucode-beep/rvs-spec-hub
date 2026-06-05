// image.js — 通用图片处理：压缩、主图/线图上传、配件/曲线网格上传
// 暴露给 app.js 使用的全局函数：compressImage, handleImageUpload, handleGridImageUpload

const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

// ---------- 图片压缩（用于主图、线图、LOGO） ----------
async function compressImage(file, maxWidth = 1800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 按 maxWidth 等比缩放
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (maxWidth * height) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // 先铺白底（处理透明 PNG → JPEG 时的黑底问题）
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);

                    // 临时画布：处理灰色背景像素（产品摄影常见灰底）
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    tempCtx.drawImage(img, 0, 0, width, height);

                    const imageData = tempCtx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        if (Math.abs(data[i] - data[i + 1]) < 5 &&
                            Math.abs(data[i + 1] - data[i + 2]) < 5 &&
                            data[i] < 240) {
                            data[i + 3] = Math.max(0, data[i + 3] - (240 - data[i]) * 0.8);
                        }
                    }
                    tempCtx.putImageData(imageData, 0, 0);

                    ctx.drawImage(tempCanvas, 0, 0);

                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to create blob'));
                    }, 'image/jpeg', quality);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ---------- 主产品图 / 产品线图 上传 ----------
//   input: FileList-like { files: [...] } 或原生 input element
//   imgId: 目标 <img> 的 id
async function handleImageUpload(input, imgId) {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件');
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showToast('图片大小不能超过 5MB');
        return;
    }

    try {
        const compressed = await compressImage(file, 1800, 0.8);
        const objectUrl = URL.createObjectURL(compressed);
        const img = document.getElementById(imgId);
        const container = img.parentElement;

        img.src = objectUrl;
        img.style.display = 'block';

        // 删除按钮（首次创建后复用）
        let deleteBtn = container.querySelector('.delete-btn');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                img.src = '';
                img.style.display = 'none';
                deleteBtn.remove();
                container.querySelector('.image-placeholder').style.display = 'flex';
            });
            container.appendChild(deleteBtn);
        }
        container.querySelector('.image-placeholder').style.display = 'none';
    } catch (err) {
        showToast('图片处理失败，请重试');
    }
}

// ---------- 配件图 / 配光曲线 网格上传（统一接口） ----------
//   { kind: 'accessory' | 'curve', container, index }
function handleGridImageUpload({ kind, container: box, index }) {
    const labels = { accessory: '配件图', curve: '配光曲线' };
    const datasetKey = kind === 'accessory' ? 'accessoryIndex' : 'curveIndex';
    const label = `${labels[kind]}${index + 1}`;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        box.dataset[datasetKey] = index;

        if (file.size > MAX_FILE_SIZE) {
            showToast('图片大小不能超过 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 网格图限制 800px
                const maxWidth = 800;
                const maxHeight = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                // 清空原 placeholder，确保只有实线边框
                box.innerHTML = '';

                const preview = document.createElement('img');
                preview.src = dataUrl;
                preview.dataset[datasetKey] = index;
                box.appendChild(preview);

                // 删除按钮
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    box.innerHTML = placeholderHtml(label);
                });
                box.appendChild(deleteBtn);
            };
        };
        reader.readAsDataURL(file);
    });
    input.click();
}

// 复位的占位符 HTML（与 templates/index.html 里的 .image-placeholder 结构一致）
function placeholderHtml(label) {
    return `<div class="image-placeholder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ccc">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span>${label}</span>
    </div>`;
}
