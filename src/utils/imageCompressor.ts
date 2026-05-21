/**
 * Client-Side Intelligent Image Compression and Downscaling Utility.
 * Restricts maximum dimensional limits to protect serverless payloads and model input bounds.
 */

export interface CompressionResult {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

/**
 * Resizes any image DataURL/Base64 pattern using high-performance HTML5 Canvas scaling.
 * @param dataUrl The source image formatted as a DataURL.
 * @param maxDimension The upper height/width boundary. Defaults to 1200 pixels.
 * @returns Compressed base64 structure.
 */
export function downscaleImageDataUrl(
  dataUrl: string,
  maxDimension = 1200
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Adjust aspect ratio preserving dimensions if bounds exceeded
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not construct Canvas 2D render context."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as jpeg with high-performance 0.85 visual balance target
      const outputMimeType = "image/jpeg";
      const resultDataUrl = canvas.toDataURL(outputMimeType, 0.85);
      const [header, base64] = resultDataUrl.split(";base64,");

      resolve({
        base64,
        mimeType: outputMimeType,
        dataUrl: resultDataUrl,
      });
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = dataUrl;
  });
}

/**
 * Resizes an uploaded File object down to safe boundaries.
 */
export function downscaleImageFile(
  file: File,
  maxDimension = 1200
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error("File contents loaded as blank."));
        return;
      }

      try {
        const compressed = await downscaleImageDataUrl(result, maxDimension);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}
