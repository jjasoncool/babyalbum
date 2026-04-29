/// <reference path="../pb_data/types.d.ts" />

// PocketBase 圖片上傳後自動壓縮
//
// 需求：Docker image 內需有 ImageMagick (`magick` 或 `convert`)。
// 本專案的 dockerfile 已安裝 imagemagick。
//
// 注意：這會直接壓縮 PocketBase 儲存的「原始檔」，可節省儲存空間。
// 前台若只是想省流量，仍建議搭配 PocketBase 的 `thumb` 參數使用。

const IMAGE_OPTIMIZE_CONFIG = {
    // collectionName: [fileFieldName, ...]
    photos: ['image'],
    about_content: ['image'],
    site_settings: ['photo'],
};

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;
const PNG_QUALITY = 85;
const MIN_BYTES_TO_OPTIMIZE = 512 * 1024;

function commandExists(command) {
    try {
        $os.exec(command, '--version').output();
        return true;
    } catch (_) {
        return false;
    }
}

function imageCommand() {
    if (commandExists('magick')) return 'magick';
    if (commandExists('convert')) return 'convert';
    return '';
}

function fileExists(path) {
    try {
        return $os.stat(path).isFile();
    } catch (_) {
        return false;
    }
}

function fileSize(path) {
    try {
        return $os.stat(path).size();
    } catch (_) {
        return 0;
    }
}

function optimizedTempPath(path) {
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex <= 0) return `${path}.optimizing`;

    return `${path.slice(0, dotIndex)}.optimizing${path.slice(dotIndex)}`;
}

function imageDimensions(path) {
    try {
        const output = $os.exec('identify', '-format', '%w %h', path).output().trim();
        const parts = output.split(/\s+/);
        return {
            width: Number(parts[0]) || 0,
            height: Number(parts[1]) || 0,
        };
    } catch (_) {
        return { width: 0, height: 0 };
    }
}

function isOptimizableImage(filename) {
    const name = String(filename || '').toLowerCase();

    // 不處理 gif/apng/bmp，避免動畫失效或格式轉換風險。
    return name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp');
}

function filenamesFromValue(value) {
    if (!value) return [];

    const filenames = Array.isArray(value) ? value : [value];
    return filenames
        .filter((filename) => !!filename)
        .map((filename) => String(filename));
}

function sameFilenames(a, b) {
    return JSON.stringify(filenamesFromValue(a).sort()) === JSON.stringify(filenamesFromValue(b).sort());
}

function changedImageFields(record) {
    const fields = IMAGE_OPTIMIZE_CONFIG[record.collection().name] || [];
    if (!fields.length) return [];

    const original = record.original();
    if (!original) return fields;

    return fields.filter((field) => !sameFilenames(record.get(field), original.get(field)));
}

function optimizeImageFile(path) {
    if (!fileExists(path) || !isOptimizableImage(path)) return;

    const cmd = imageCommand();
    if (!cmd) {
        console.warn('[image optimize] ImageMagick not found, skip:', path);
        return;
    }

    const lower = path.toLowerCase();
    const dimensions = imageDimensions(path);

    // 避免後台只更新標題/描述時，已經壓到限制內的圖片被重複有損壓縮。
    if (
        dimensions.width > 0 &&
        dimensions.height > 0 &&
        Math.max(dimensions.width, dimensions.height) <= MAX_WIDTH &&
        fileSize(path) < MIN_BYTES_TO_OPTIMIZE
    ) {
        return;
    }

    const tmpPath = optimizedTempPath(path);

    const args = [path, '-auto-orient', '-strip', '-resize', `${MAX_WIDTH}x${MAX_WIDTH}>`];

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        args.push('-sampling-factor', '4:2:0', '-interlace', 'JPEG', '-quality', String(JPEG_QUALITY));
    } else if (lower.endsWith('.webp')) {
        args.push('-quality', String(WEBP_QUALITY));
    } else if (lower.endsWith('.png')) {
        args.push('-quality', String(PNG_QUALITY));
    }

    args.push(tmpPath);

    try {
        $os.exec(cmd, ...args).output();

        if (fileExists(tmpPath)) {
            $os.rename(tmpPath, path);
            console.log('[image optimize] optimized:', path);
        }
    } catch (err) {
        console.error('[image optimize] failed:', path, err);

        try {
            if (fileExists(tmpPath)) $os.remove(tmpPath);
        } catch (_) {}
    }
}

function optimizeRecordImages(record, fields) {
    fields = fields || IMAGE_OPTIMIZE_CONFIG[record.collection().name] || [];
    if (!fields.length) return;

    const basePath = `${__hooks}/../pb_data/storage/${record.baseFilesPath()}`;

    fields.forEach((field) => {
        filenamesFromValue(record.get(field)).forEach((filename) => {
            optimizeImageFile(`${basePath}/${filename}`);
        });
    });
}

onRecordAfterCreateSuccess((e) => {
    optimizeRecordImages(e.record);
    e.next();
}, ...Object.keys(IMAGE_OPTIMIZE_CONFIG));

onRecordAfterUpdateSuccess((e) => {
    optimizeRecordImages(e.record, changedImageFields(e.record));
    e.next();
}, ...Object.keys(IMAGE_OPTIMIZE_CONFIG));
