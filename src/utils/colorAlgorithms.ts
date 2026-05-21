/**
 * Custom High-Performance Client-Side Color Analysis and Clustering Algorithms.
 * This file implements:
 * 1. K-Means Clustering on RGB color space vectors for dominant color extraction.
 * 2. WCAG 2.1 Contrast Ratio formulation based on relative luminance formulas.
 * 3. Color space conversion mathematics (RGB, HEX, HSL, CMYK).
 * 4. Delta-E (CIE76) Perceptual Color Distance calculation.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ClusteredColor {
  hex: string;
  rgb: RGB;
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
  percentage: number;
  wcagContrastWhite: number; // Contrast ratio against white (#FFFFFF)
  wcagContrastBlack: number; // Contrast ratio against black (#000000)
}

/**
 * 1. Convert RGB to Hexadecimal string
 */
export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert Hexadecimal to RGB
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl({ r, g, b }: RGB) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert RGB to CMYK
 */
export function rgbToCmyk({ r, g, b }: RGB) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

/**
 * 2. WCAG Relative Luminance calculation for an RGB color channel
 * See: https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
export function getRelativeLuminance({ r, g, b }: RGB): number {
  const transform = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

/**
 * Calculate Contrast Ratio between two RGB colors
 * Returns rating between 1 and 21
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 3. Delta-E Perceptual Distance (CIE76 formulation in RGB space approximation)
 * Calculates color distance based on euclidean distance in RGB space weighting.
 * Standard human eye is more sensitive to green, then red, then blue.
 */
export function getDeltaE(c1: RGB, c2: RGB): number {
  const rMean = (c1.r + c2.r) / 2;
  const dR = c1.r - c2.r;
  const dG = c1.g - c2.g;
  const dB = c1.b - c2.b;
  // Weighted RGB distance approximation (Redmean algorithm) for solid perceptual matching
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  return Math.sqrt(weightR * dR * dR + weightG * dG * dG + weightB * dB * dB);
}

/**
 * 4. K-Means Clustering on Pixel RGB Arrays
 * Extends basic clustering with smart initialization and iterative feedback loop.
 */
export function runKMeansClustering(
  pixels: RGB[],
  k: number,
  maxIterations = 12
): ClusteredColor[] {
  if (pixels.length === 0 || k <= 0) return [];

  // Initialize centroids with K-Means++ style selection space dispersion
  const centroids: RGB[] = [];
  
  // Choose first centroid completely at random
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);

  while (centroids.length < k) {
    let maxDistance = -1;
    let fallbackPixelIdx = 0;
    
    // Select remaining centroids by picking pixels furthest from all previous ones
    // For large speeds, sample a subset of 50 choices
    for (let i = 0; i < 50; i++) {
      const idx = Math.floor(Math.random() * pixels.length);
      const pixel = pixels[idx];
      let minDistanceToCentroids = Infinity;
      
      for (const centroid of centroids) {
        const d = getDeltaE(pixel, centroid);
        if (d < minDistanceToCentroids) {
          minDistanceToCentroids = d;
        }
      }
      
      if (minDistanceToCentroids > maxDistance) {
        maxDistance = minDistanceToCentroids;
        fallbackPixelIdx = idx;
      }
    }
    centroids.push(pixels[fallbackPixelIdx]);
  }

  // Iterate to minimize intra-cluster RGB distance variances
  interface ClusterGroup {
    centroid: RGB;
    assignedPixels: RGB[];
  }

  let clusters: ClusterGroup[] = centroids.map((c) => ({
    centroid: c,
    assignedPixels: [],
  }));

  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Reset assignments
    for (let i = 0; i < k; i++) {
      clusters[i].assignedPixels = [];
    }

    // 2. Assign each pixel to the nearest centroid
    for (const pixel of pixels) {
      let nearestDist = Infinity;
      let nearestIdx = 0;
      
      for (let i = 0; i < k; i++) {
        const dist = getDeltaE(pixel, clusters[i].centroid);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
      
      clusters[nearestIdx].assignedPixels.push(pixel);
    }

    // 3. Recalculate centroids as average of assigned pixels
    let centroidShifted = false;
    for (let i = 0; i < k; i++) {
      const group = clusters[i];
      if (group.assignedPixels.length === 0) continue;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (const p of group.assignedPixels) {
        sumR += p.r;
        sumG += p.g;
        sumB += p.b;
      }

      const count = group.assignedPixels.length;
      const newCentroid: RGB = {
        r: Math.round(sumR / count),
        g: Math.round(sumG / count),
        b: Math.round(sumB / count),
      };

      // Check if centroid moved significantly
      if (
        newCentroid.r !== group.centroid.r ||
        newCentroid.g !== group.centroid.g ||
        newCentroid.b !== group.centroid.b
      ) {
        group.centroid = newCentroid;
        centroidShifted = true;
      }
    }

    // Early exit if centroids converged
    if (!centroidShifted) break;
  }

  // Calculate percentage of pixels mapped to each cluster centroid, then structure outputs
  const totalPixels = pixels.length;
  const whiteRGB: RGB = { r: 255, g: 255, b: 255 };
  const blackRGB: RGB = { r: 0, g: 0, b: 0 };

  return clusters
    .map((cluster) => {
      const rgb = cluster.centroid;
      const hex = rgbToHex(rgb);
      const percentage = Math.round((cluster.assignedPixels.length / totalPixels) * 100);
      
      return {
        hex,
        rgb,
        hsl: rgbToHsl(rgb),
        cmyk: rgbToCmyk(rgb),
        percentage,
        wcagContrastWhite: parseFloat(getContrastRatio(rgb, whiteRGB).toFixed(2)),
        wcagContrastBlack: parseFloat(getContrastRatio(rgb, blackRGB).toFixed(2)),
      };
    })
    .sort((a, b) => b.percentage - a.percentage); // Sort descending by dominance
}

/**
 * Extracts sample pixels from an image source using high-performance Canvas mechanics.
 */
export async function getSamplePixelsFromImageUrl(
  imageUrl: string,
  sampleCount = 1800
): Promise<RGB[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas 2D context"));
          return;
        }

        // Downscale image inside canvas for lightning-fast reading
        const width = 100;
        const height = 100;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height).data;
        const pixels: RGB[] = [];
        
        // Stride calculation for fast representative sampling
        const totalPixels = width * height;
        const step = Math.max(1, Math.floor(totalPixels / sampleCount));

        for (let i = 0; i < totalPixels; i += step) {
          const idx = i * 4;
          // Guard alpha transparency - only sample opaque colors
          if (imgData[idx + 3] >= 200) {
            pixels.push({
              r: imgData[idx],
              g: imgData[idx + 1],
              b: imgData[idx + 2],
            });
          }
        }
        resolve(pixels);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    
    // Set src to resolve
    img.src = imageUrl;
  });
}
