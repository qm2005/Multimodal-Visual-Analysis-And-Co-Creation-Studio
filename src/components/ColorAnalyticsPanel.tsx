import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Eye,
  Info,
  Copy,
  Layout,
  Palette,
  AlertCircle
} from "lucide-react";
import {
  RGB,
  ClusteredColor,
  runKMeansClustering,
  getSamplePixelsFromImageUrl,
  getDeltaE,
  rgbToHex,
  rgbToHsl,
  rgbToCmyk,
  getContrastRatio,
  hexToRgb
} from "../utils/colorAlgorithms";

interface ColorAnalyticsPanelProps {
  imageUrl: string;
  language: "zh" | "en";
}

export const ColorAnalyticsPanel: React.FC<ColorAnalyticsPanelProps> = ({
  imageUrl,
  language,
}) => {
  // Config states
  const [kCount, setKCount] = useState<number>(5);
  const [pixelSamples, setPixelSamples] = useState<number>(2500);
  const [allPixels, setAllPixels] = useState<RGB[]>([]);
  const [colors, setColors] = useState<ClusteredColor[]>([]);
  
  // Interaction states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Sandbox Card preview states (indices of colors array)
  const [bgChoice, setBgChoice] = useState<number>(0);
  const [textChoice, setTextChoice] = useState<number>(1);
  const [primaryChoice, setPrimaryChoice] = useState<number>(2);
  const [accentChoice, setAccentChoice] = useState<number>(3);
  
  // Interactive coordinate color picker state (Eye Dropper)
  const [eyedropperActive, setEyedropperActive] = useState<boolean>(false);
  const [eyedropColor, setEyedropColor] = useState<{
    hex: string;
    rgb: RGB;
    hsl: { h: number; s: number; l: number };
    cmyk: { c: number; m: number; y: number; k: number };
    closestCentroidIdx: number;
    deltaE: number;
  } | null>(null);
  
  const imgPickerRef = useRef<HTMLImageElement>(null);
  
  // Fetch and cache raw pixel sample array on image source load or sample change
  useEffect(() => {
    let active = true;
    const fetchPixels = async () => {
      setLoading(true);
      setError(null);
      try {
        const samples = await getSamplePixelsFromImageUrl(imageUrl, pixelSamples);
        if (active) {
          setAllPixels(samples);
          // Auto cluster
          const clustered = runKMeansClustering(samples, kCount);
          setColors(clustered);
          
          // Set sensible defaults for Sandbox card presets based on cluster count
          setBgChoice(0);
          setTextChoice(clustered.length > 4 ? 4 : clustered.length - 1);
          setPrimaryChoice(clustered.length > 2 ? 1 : 0);
          setAccentChoice(clustered.length > 3 ? 2 : 0);
        }
      } catch (err: any) {
        console.error("Pixel sampling error:", err);
        if (active) {
          setError(
            language === "zh"
              ? "读取或分析图像像素失败。此图片源可能存在跨域(CORS)策略保护，或者是无效的数据流。您可以在工作台尝试手动上传本地图片噢。"
              : "Failed to read image pixel bytes. The source lacks CORS configuration, or is an invalid asset stream."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchPixels();
    return () => {
      active = false;
    };
  }, [imageUrl, pixelSamples]);

  // Recalculate clusters whenever K or pixels change
  const handleRecalculate = () => {
    if (allPixels.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const clustered = runKMeansClustering(allPixels, kCount);
        setColors(clustered);
        
        // Reset sandbox choices
        setBgChoice(0);
        setTextChoice(Math.min(clustered.length - 1, 4));
        setPrimaryChoice(Math.min(clustered.length - 1, 1));
        setAccentChoice(Math.min(clustered.length - 1, 2));
      } catch (err: any) {
        setError(err.message || "Failed to cluster");
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Human friendly ratings for relative WCAG accessibility guidelines
  const getWCAGRating = (contrast: number) => {
    if (contrast >= 7.0) {
      return {
        label: language === "zh" ? "超强 AAA级" : "L3 (AAA)",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-100",
        explain: language === "zh" ? "完美适配任何极细字体，对比极优" : "Excellent contrast compliant for all text sizing"
      };
    } else if (contrast >= 4.5) {
      return {
        label: language === "zh" ? "标准 AA级" : "L2 (AA)",
        classes: "bg-indigo-50 text-indigo-700 border-indigo-100",
        explain: language === "zh" ? "合格通过，适配日常正文级标准文字" : "Clear compliance for standard text body sizes"
      };
    } else if (contrast >= 3.0) {
      return {
        label: language === "zh" ? "大字 AA级" : "L1 (AA Wide)",
        classes: "bg-amber-50 text-amber-700 border-amber-100",
        explain: language === "zh" ? "仅适合标题性或大于18px的加粗粗体字" : "Requires large or bold heading text formats"
      };
    } else {
      return {
        label: language === "zh" ? "不合规 low" : "Non-compliant",
        classes: "bg-rose-50 text-rose-700 border-rose-100",
        explain: language === "zh" ? "对比度极差，极其容易引发视觉疲劳" : "Poor contrast ratio; causes fatiguing readability"
      };
    }
  };

  // Pixel Pick coordinates and Delta-E centroid calculation
  const handleImagePickerClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!eyedropperActive || !imgPickerRef.current || colors.length === 0) return;
    
    try {
      const rect = imgPickerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Draw temporarily into a 1px hidden canvas to capture true pixel value
      const canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(imgPickerRef.current, 0, 0, rect.width, rect.height);
      const pixelData = ctx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;
      
      const rgb: RGB = {
        r: pixelData[0],
        g: pixelData[1],
        b: pixelData[2]
      };
      const hex = rgbToHex(rgb);
      
      // Calculate deltaE distance against all K centroids to find closest match
      let closestIdx = 0;
      let minDistance = Infinity;
      
      colors.forEach((clustered, idx) => {
        const d = getDeltaE(rgb, clustered.rgb);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = idx;
        }
      });

      setEyedropColor({
        hex,
        rgb,
        hsl: rgbToHsl(rgb),
        cmyk: rgbToCmyk(rgb),
        closestCentroidIdx: closestIdx,
        deltaE: parseFloat(minDistance.toFixed(1))
      });
      setEyedropperActive(false);
    } catch (err) {
      console.error("Eye-dropper coordinate reading error:", err);
    }
  };

  // Generate dynamic styled configurations for selected Sandbox tokens
  const activeBgHex = colors[bgChoice]?.hex || "#FFFFFF";
  const activeTextHex = colors[textChoice]?.hex || "#000000";
  const activePrimaryHex = colors[primaryChoice]?.hex || "#4F46E5";
  const activeAccentHex = colors[accentChoice]?.hex || "#E2E8F0";

  // Calculate contrast for preview accessibility info
  const previewContrastHex = getContrastRatio(hexToRgb(activeBgHex), hexToRgb(activeTextHex)).toFixed(1);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-sm">
            <Palette className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>{language === "zh" ? "微像素 K-Means 聚类与配色无障碍适配器" : "Pixel K-Means Clustering & WCAG Theme Auditor"}</span>
              <span className="bg-violet-50 text-violet-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-violet-100">
                {language === "zh" ? "高级算法实现" : "Native Algorithm"}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === "zh"
                ? "基于三维色彩矢量的 K-Means 聚类迭代算法，对画面像素进行高精度抽取，全自研计算 WCAG 视觉对比度标准。"
                : "Continuous coordinate distance calculations dynamically clustering and analyzing contrast compliance based on pixel bytes."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {eyedropperActive ? (
            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2 py-1 rounded animate-pulse">
              🎯 {language === "zh" ? "请点击图像吸色" : "Dropper Active • click image"}
            </span>
          ) : (
            <button
              onClick={() => setEyedropperActive(true)}
              className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 bg-white transition-all cursor-pointer flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "吸色探析" : "Eyedropper Probe"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main grids */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column (Sliders & Interactive Thumb) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3.5">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {language === "zh" ? "聚类算法超参数配置" : "Hyperparameter Configurations"}
            </h4>

            {/* Slider K */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-600">{language === "zh" ? "聚类个数 K 值" : "Clustered Centroids (K)"}</span>
                <span className="text-indigo-600 font-mono font-bold">{kCount}</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                value={kCount}
                onChange={(e) => setKCount(Number(e.target.value))}
                className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-200 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 block leading-tight font-sans">
                {language === "zh" ? "需要迭代抽出的色彩质心个数，支持 2~8 级分类" : "Number of major dominant pigments extracted via RGB Redmean math."}
              </span>
            </div>

            {/* Slider Samples */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-600">{language === "zh" ? "像素抽取样本数" : "Representative Pixel Samples"}</span>
                <span className="text-indigo-600 font-mono font-bold">{pixelSamples} px</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={pixelSamples}
                onChange={(e) => setPixelSamples(Number(e.target.value))}
                className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-200 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 block leading-tight font-sans">
                {language === "zh" ? "抽样样本点，数值越大越精细，但运算耗时增加" : "Downscaled array density used for initial K-means++ convergence."}
              </span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleRecalculate}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{language === "zh" ? "重新运行 K-Means 聚类" : "Re-run K-Means Pipeline"}</span>
            </button>
          </div>

          {/* Interactive Pick Thumbnail wrapper */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-bold text-slate-500 block">
              ✨ {language === "zh" ? "吸色视窗 (按需选取)" : "Eyedropper Viewport"}
            </span>
            <div 
              className={`relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-1 flex items-center justify-center select-none ${
                eyedropperActive ? "cursor-crosshair ring-2 ring-indigo-500" : ""
              }`}
            >
              <img
                ref={imgPickerRef}
                src={imageUrl}
                alt="Eye-dropper target"
                referrerPolicy="no-referrer"
                onClick={handleImagePickerClick}
                className="max-h-[160px] object-contain rounded"
              />
              {eyedropperActive && (
                <div className="absolute inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                  <div className="bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-700 animate-pulse">
                    {language === "zh" ? "🎯 请点击图片任意一点像素" : "🎯 Select any pixel point"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Eyedropper math report data output */}
          {eyedropColor && (
            <div className="bg-indigo-50/50 border border-indigo-100/40 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-100/30 pb-1.5">
                <span className="font-extrabold text-indigo-800 tracking-wide">{language === "zh" ? "微测像素信号报告" : "Pixel Sample Signal"}</span>
                <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded">Delta-E Alignment</span>
              </div>
              
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: eyedropColor.hex }} />
                <div className="space-y-0.5 font-mono text-[10px] flex-1 text-slate-700">
                  <div className="font-bold text-slate-900">{eyedropColor.hex}</div>
                  <div>RGB: {eyedropColor.rgb.r}, {eyedropColor.rgb.g}, {eyedropColor.rgb.b}</div>
                  <div>HSL: {eyedropColor.hsl.h}°, {eyedropColor.hsl.s}%, {eyedropColor.hsl.l}%</div>
                </div>
              </div>

              <div className="text-[10px] leading-relaxed text-slate-600 bg-white p-2 rounded-lg border border-indigo-100/20 font-sans">
                {language === "zh" ? (
                  <>
                    与第 <strong>{eyedropColor.closestCentroidIdx + 1}</strong> 个聚类质心的感知偏差 <strong>DeltaE</strong> 距离为 <strong>{eyedropColor.deltaE}</strong> 
                    {eyedropColor.deltaE < 4 ? "（属于接近同色域，视觉一致性优秀）" : "（存在明显反差，可作为对比重点配置）"}
                  </>
                ) : (
                  <>
                    Spectral DeltaE variance to cluster centroid <strong>#{eyedropColor.closestCentroidIdx + 1}</strong> is <strong>{eyedropColor.deltaE}</strong> 
                    {eyedropColor.deltaE < 4 ? " (highly congruent, clean perceptual harmony)" : " (contrastful tone range, beautiful accents)"}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Spectrum & Math Report & CSS Custom Sandbox Column */}
        <div className="xl:col-span-8 space-y-5">
          {loading && colors.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-xl">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Running high-dimensional Euclidean coordinate iterations...</p>
            </div>
          ) : (
            <>
              {/* Clustered Color Blocks cards */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    {language === "zh" ? "📊 精准 K-Means 质心光谱矩阵 (降序降噪)" : "📊 K-Means Cluster Centroids Summary"}
                  </span>
                  <span className="text-[10px] text-slate-400">Total samples calculated</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                  {colors.map((color, idx) => {
                    const blackContrastRating = getWCAGRating(color.wcagContrastBlack);
                    
                    return (
                      <div key={idx} className="bg-slate-50/40 hover:bg-slate-50 p-3 rounded-xl border border-slate-100/80 hover:border-slate-200 transition-all flex items-start space-x-3 shadow-xs">
                        {/* Swatch */}
                        <div 
                          className="w-12 h-20 rounded-lg shadow-inner border border-slate-200/50 flex flex-col justify-end p-1.5 shrink-0 hover:scale-105 transition-transform"
                          style={{ backgroundColor: color.hex }}
                        >
                          <span className="text-[9px] font-black text-white mix-blend-difference leading-none">#{idx + 1}</span>
                          <span className="text-[9px] font-mono text-white mix-blend-difference font-bold tracking-tight">{color.percentage}%</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between">
                            <span 
                              onClick={() => triggerCopy(color.hex, `c-${idx}-hex`)}
                              className="font-mono text-[11px] font-extrabold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {color.hex}
                              {copiedToken === `c-${idx}-hex` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 hover:text-slate-500" />
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">K-RGB [{color.rgb.r}, {color.rgb.g}, {color.rgb.b}]</span>
                          </div>

                          <div className="text-[9px] text-slate-400 font-mono tracking-tight font-medium space-x-1 flex flex-wrap gap-y-0.5">
                            <span className="bg-white/80 border border-slate-100 px-1 py-0.5 rounded">HSL: {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</span>
                            <span className="bg-white/80 border border-slate-100 px-1 py-0.5 rounded">CMYK: C{color.cmyk.c}% M{color.cmyk.m}% Y{color.cmyk.y}% K{color.cmyk.k}%</span>
                          </div>

                          {/* Contrast Auditing indicator */}
                          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-sans flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="text-slate-400 font-bold block">{language === "zh" ? "暗字对比" : "Dark text Contrast"}:</span>
                              <span className="font-mono font-black text-indigo-700">{color.wcagContrastBlack}:1</span>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[8.5px] font-black tracking-wide rounded-md border ${blackContrastRating.classes}`}>
                              {blackContrastRating.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advanced UI Theme Sandbox (CSS Theme Sandbox) */}
              {colors.length > 0 && (
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4.5 space-y-4 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/50 pb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center">
                      <Layout className="w-4 h-4 mr-1.5 text-violet-600" />
                      🧩 {language === "zh" ? "色彩美学沙盒 & CSS 组件动态预览" : "Theme Synthesis & Component Sandbox"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const tokenStr = `
--theme-bg: ${activeBgHex};
--theme-text: ${activeTextHex};
--theme-primary: ${activePrimaryHex};
--theme-accent: ${activeAccentHex};
/* Extracted from Multimodal K-Means Process */
`.trim();
                        triggerCopy(tokenStr, "style-tokens");
                      }}
                      className="text-[9.5px] bg-indigo-50 border border-indigo-100 hover:bg-indigo-150 text-indigo-700 font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {copiedToken === "style-tokens" ? (
                        <>
                          <Check className="w-3" />
                          <span>{language === "zh" ? "样式标记已复制" : "Styles Copied"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3" />
                          <span>{language === "zh" ? "导出 CSS 主题变量" : "Export Style Tokens"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sandbox Selectors Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 block">{language === "zh" ? "1. 背景色选择" : "1. Theme Background"}</label>
                      <select
                        value={bgChoice}
                        onChange={(e) => setBgChoice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                      >
                        {colors.map((color, cIdx) => (
                          <option key={cIdx} value={cIdx}>#{cIdx + 1} - Hex {color.hex} ({color.percentage}%)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 block">{language === "zh" ? "2. 主体文本色" : "2. Core Text Body"}</label>
                      <select
                        value={textChoice}
                        onChange={(e) => setTextChoice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                      >
                        {colors.map((color, cIdx) => (
                          <option key={cIdx} value={cIdx}>#{cIdx + 1} - Hex {color.hex} ({color.percentage}%)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 block">{language === "zh" ? "3. 交互主按键色" : "3. Primary Accent"}</label>
                      <select
                        value={primaryChoice}
                        onChange={(e) => setPrimaryChoice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                      >
                        {colors.map((color, cIdx) => (
                          <option key={cIdx} value={cIdx}>#{cIdx + 1} - Hex {color.hex} ({color.percentage}%)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 block">{language === "zh" ? "4. 边框/徽章轻色" : "4. Border & Badge"}</label>
                      <select
                        value={accentChoice}
                        onChange={(e) => setAccentChoice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                      >
                        {colors.map((color, cIdx) => (
                          <option key={cIdx} value={cIdx}>#{cIdx + 1} - Hex {color.hex} ({color.percentage}%)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Components live Preview box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Live Preview UI Card */}
                    <div 
                      className="rounded-2xl p-5 border shadow-md transition-colors"
                      style={{ 
                        backgroundColor: activeBgHex, 
                        color: activeTextHex,
                        borderColor: activeAccentHex
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span 
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: activeAccentHex,
                            color: activeTextHex,
                            border: `1px solid ${activeTextHex}1F`
                          }}
                        >
                          LIVE THEME CARD
                        </span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePrimaryHex }} />
                      </div>

                      <h4 className="text-[13px] font-bold tracking-tight mb-1">
                        {language === "zh" ? "多模态三维色彩演算成果" : "Harmonal Design Palette Suite"}
                      </h4>
                      <p className="text-[10px] leading-relaxed mb-4 opacity-80 select-text">
                        {language === "zh" 
                          ? "此卡片正文及按钮颜色完全来源于您选中并提取的图片像素。通过调整左侧下拉框配置进行实时的设计师比对！"
                          : "This preview card renders using exact raw colors gathered from your photo. Ensure robust typography pairing and visual weights."}
                      </p>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer select-none transition-transform active:scale-95 shadow-sm"
                          style={{
                            backgroundColor: activePrimaryHex,
                            color: activeBgHex,
                            borderColor: activePrimaryHex
                          }}
                        >
                          {language === "zh" ? "激活主样式" : "Primary Action"}
                        </button>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer select-none transition-colors"
                          style={{
                            borderColor: `${activeTextHex}4F`,
                            color: activeTextHex
                          }}
                        >
                          {language === "zh" ? "边框款式" : "Secondary"}
                        </button>
                      </div>
                    </div>

                    {/* WCAG Accessibility and advice report */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block tracking-wide">
                          🛡️ WCAG 2.1 CONTRAST AUDIT REPORT
                        </span>
                        
                        <div className="flex items-center justify-between mt-2 pb-2 border-b border-slate-100">
                          <span className="text-slate-600 text-xs">{language === "zh" ? "背景色与文字色对比度：" : "Bg to Text Ratio:"}</span>
                          <span className="font-mono font-bold text-slate-900 text-[13px]">{previewContrastHex} : 1</span>
                        </div>
                        
                        <p className="text-[10.5px] leading-relaxed text-slate-500 mt-2 text-justify">
                          {parseFloat(previewContrastHex) >= 4.5 ? (
                            <span className="text-emerald-700 font-medium font-sans">
                              ✅ {language === "zh" ? "符合 W3C Web 规范！该搭配在明视度上非常卓越，适合生产环境普通字体大批量显示。" 
                                                   : "Perfect compliance! Legible layout matches accessibility directives for standard screen body texts."}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium font-sans">
                              ⚠️ {language === "zh" ? "对比度不足 4.5。在暗沉的光照下普通用户较难阅读，请尝试更换具有更高色域对比的主、背景色彩选择！" 
                                                   : "Suboptimal rendering ratio. Consider pairing dark colors with pale background choices to help readability."}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl text-[9px] text-slate-400 font-sans flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="leading-normal">
                          {language === "zh" 
                            ? "WCAG 换算算法基于标准 RGB 转化为相对亮度和色光加权公式计算。Delta-E CIE76 perceptual 距离提供高维空间最接近颜色的匹配演算支持。"
                            : "WCAG contrast metrics calculated via relative luminance multipliers based on W3C Guidelines."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
};
