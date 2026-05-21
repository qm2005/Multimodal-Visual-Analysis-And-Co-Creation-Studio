import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Aperture,
  Check,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ArrowRight
} from "lucide-react";
import { VisualFeatures, RegionAnalysis } from "../types";
import { useTranslation } from "../context/LanguageContext";
import { ColorAnalyticsPanel } from "./ColorAnalyticsPanel";

interface FeatureAnalysisPageProps {
  imageUrl: string | null;
  featuresData: VisualFeatures | null;
  loading: boolean;
  runAnalysis: (mode: "features") => void;
  regionXMin: number;
  setRegionXMin: (val: number) => void;
  regionXMax: number;
  setRegionXMax: (val: number) => void;
  regionYMin: number;
  setRegionYMin: (val: number) => void;
  regionYMax: number;
  setRegionYMax: (val: number) => void;
  regionLabel: string;
  setRegionLabel: (val: string) => void;
  regionLoading: boolean;
  regionResult: RegionAnalysis | null;
  regionError: string | null;
  runRegionAnalysis: () => void;
  handleImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  setActivePage: (p: "workbench" | "features" | "social" | "literary" | "salon") => void;
}

export const FeatureAnalysisPage: React.FC<FeatureAnalysisPageProps> = ({
  imageUrl,
  featuresData,
  loading,
  regionXMin,
  setRegionXMin,
  regionXMax,
  setRegionXMax,
  regionYMin,
  setRegionYMin,
  regionYMax,
  setRegionYMax,
  regionLabel,
  setRegionLabel,
  regionLoading,
  regionResult,
  regionError,
  runRegionAnalysis,
  handleImageClick,
  setActivePage,
  runAnalysis,
}) => {
  const { t, language } = useTranslation();

  // If no image is uploaded, prompt the user gracefully
  if (!imageUrl) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-5 py-16 shadow-xs max-w-2xl mx-auto my-6">
        <div className="mx-auto w-16 h-16 p-4 bg-slate-50 text-indigo-500 rounded-2xl border border-slate-100 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-lg">{t("noImageSource")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("zh") === "zh"
              ? "特征提取与局部探针探析需要针对具体的图像像素进行大模型演算。请前往智能工作台，快速导入您喜欢的图片，我们就会立刻为您建立数字图像流！"
              : "Feature extraction and regional coordinate probe require specific pixel metadata. Go to the workspace tab to load your graphics and unlock the AI engine!"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActivePage("workbench")}
          className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:translate-x-0.5"
        >
          <span>👉 {t("zh") === "zh" ? "前往智能工作台导入/生图" : "Go to Intelligent Workbench"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // If loading and there is no previous feature data
  if (loading && !featuresData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-5 shadow-xs">
        <div className="relative inline-block">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse-slow" />
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">{t("analysisPending")}</h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {t("zh") === "zh"
              ? "正在分析画面核心像素、色彩通道及构图力学，并运行多模态图像对齐处理..."
              : "Aligning multi-modal features, decoding spatial layers, and framing color balance..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header Detail */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>{t("analysisTitle")}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("analysisSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => runAnalysis("features")}
          disabled={loading}
          className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center shadow-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Loader2 className={`w-3.5 h-3.5 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
          {t("reRunFullAnalysis")}
        </button>
      </div>

      {featuresData ? (
        <>
          {/* Visual Summary */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 p-5 rounded-2xl border border-indigo-100/30 relative shadow-xs">
            <span className="absolute -top-2.5 left-5 bg-slate-900 text-white text-[9px] font-mono tracking-widest uppercase font-bold px-2.5 py-0.5 rounded shadow-sm">
              Visual Narrative Abstract
            </span>
            <p className="text-slate-700 text-sm leading-relaxed text-justify mt-2 pt-0.5">
              {featuresData.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color distribution */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display flex items-center pb-2 border-b border-slate-50">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2"></span>
                {t("dominantSpectrum")}
              </h4>
              <div className="space-y-3.5">
                {featuresData.dominantColors.map((color, cIdx) => (
                  <div key={cIdx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-4.5 h-4.5 rounded-lg shadow-inner border border-slate-200/50"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-slate-800">{color.colorName}</span>
                        <span className="text-slate-400 font-mono text-[11px] font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{color.hex}</span>
                      </div>
                      <span className="font-mono text-indigo-600">{color.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px]">
                      <div
                        className="h-full rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${color.percentage}%`, backgroundColor: color.hex }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aesthetics Rating Panel */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display flex items-center pb-2 border-b border-slate-50">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></span>
                {t("aestheticsTitle")}
              </h4>
              <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-mono font-bold tracking-wider">
                      {t("zh") === "zh" ? "画面主导调性" : "Dominant Mood"}
                    </span>
                    <span className="font-bold text-slate-800 text-[13px] mt-0.5 block">{featuresData.moodAndAtmosphere.dominantMood}</span>
                  </div>
                  <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/30">
                    <span className="text-indigo-500/80 block text-[9px] uppercase font-mono font-bold tracking-wider">{t("aestheticsCompositeScore")}</span>
                    <div className="flex items-baseline mt-0.5">
                      <span className="font-black text-indigo-700 text-lg leading-none">{featuresData.moodAndAtmosphere.aestheticRating}</span>
                      <span className="text-slate-400 text-[10px] ml-1 font-mono">/ 10.0</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-700 block text-[10.5px] font-bold mb-0.5">💡 {t("lightingAtmosphere")}：</strong>
                    <span className="text-slate-600 leading-relaxed">{featuresData.moodAndAtmosphere.lighting}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-700 block text-[10.5px] font-bold mb-0.5">📐 {t("viewCompositionDesign")}：</strong>
                    <span className="text-slate-600 leading-relaxed">{featuresData.moodAndAtmosphere.composition}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Client-Side Color Analytics & Cluster Accessibility Auditor */}
          <ColorAnalyticsPanel imageUrl={imageUrl} language={language} />

          {/* Detected Objects list */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display flex items-center pb-2 border-b border-slate-50">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
              {t("layerDetections")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuresData.keyObjects.map((obj, oIdx) => (
                <div key={oIdx} className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-100/80 hover:border-indigo-100 transition-all">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-800 mb-1.5">
                    <span>{obj.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      obj.prominence === "主体" || obj.prominence === "Subject"
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : obj.prominence === "背景" || obj.prominence === "Background"
                        ? "bg-slate-100 text-slate-500 border-slate-200"
                        : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    }`}>
                      {t("zh") === "zh" 
                        ? obj.prominence 
                        : (obj.prominence === "主体" ? "Subject" : obj.prominence === "背景" ? "Background" : "Secondary")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {obj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Decoded tags */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3.5">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {t("tagsHeader")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {featuresData.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[11px] font-semibold bg-slate-50/80 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-100 text-slate-600 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* MICROSCOPIC HOTSPOT REGIONAL DETAIL PROBE PANEL */}
          <div id="roi-probe-panel" className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-6.5 space-y-5 shadow-2xl leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20 shadow-inner">
                  <Aperture className="w-5.5 h-5.5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-white tracking-wide flex items-center gap-2">
                    {t("microTextureProbeTitle")}
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded">
                      {t("pixelSignalAlign")}
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    {t("probeInstructions")}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded hidden sm:inline">
                PIXEL LEVEL SPECTRAL RECOLLECT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Coordinates Thumbnail clicker */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-indigo-400 block">
                    {t("zh") === "zh" ? "图像测距锁定网格 · 鼠标轻触重设" : "Image Grid Locking • touch/click to frame"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t("zh") === "zh" ? "点击画面即可将黄线剪裁框的中心瞬移至特定的位置" : "Touch image to instantly center and scope the focus bounding box"}
                  </span>
                </div>

                <div
                  className="relative bg-slate-900 rounded-xl overflow-hidden cursor-crosshair border border-slate-800 select-none shadow-2xl flex items-center justify-center p-1"
                  onClick={handleImageClick}
                  style={{ minHeight: "220px" }}
                >
                  <img
                    src={imageUrl}
                    alt="ROI Selection Grid"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain block max-h-[250px] mx-auto opacity-70"
                  />

                  {/* Focus clipping box */}
                  <div
                    className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    style={{
                      left: `${regionXMin}%`,
                      width: `${regionXMax - regionXMin}%`,
                      top: `${regionYMin}%`,
                      height: `${regionYMax - regionYMin}%`
                    }}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-300 -mt-0.5 -ml-0.5"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-300 -mt-0.5 -mr-0.5"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-300 -mb-0.5 -ml-0.5"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-300 -mb-0.5 -mr-0.5"></div>

                    <span className="absolute top-1 left-1 bg-amber-400 text-slate-950 font-mono font-black text-[7.5px] px-1 py-0.5 rounded leading-none shadow-sm">
                      {regionLabel ? regionLabel.slice(0, 15) : "TARGET"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex justify-between px-1.5 font-bold">
                  <span>{t("probeHorizontalAnchor")}: {regionXMin}% - {regionXMax}%</span>
                  <span>{t("probeVerticalAnchor")}: {regionYMin}% - {regionYMax}%</span>
                </div>
              </div>

              {/* Right Column: Controls, Sliders and Buttons */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                {/* Micro focus presets */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                    📍 {t("probePresetTitle")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: t("probePresetCenter"), xMin: 35, xMax: 65, yMin: 35, yMax: 65, tag: t("zh") === "zh" ? "中心核心主体" : "Central focus object" },
                      { name: t("probePresetTopLeft"), xMin: 5, xMax: 40, yMin: 5, yMax: 40, tag: t("zh") === "zh" ? "左上背景细节" : "Top left atmospheric detail" },
                      { name: t("probePresetTopRight"), xMin: 60, xMax: 95, yMin: 5, yMax: 40, tag: t("zh") === "zh" ? "右上构图角" : "Top right framing" },
                      { name: t("probePresetBottom"), xMin: 30, xMax: 70, yMin: 65, yMax: 98, tag: t("zh") === "zh" ? "底部基带与质感" : "Bottom textures and shadow" },
                      { name: t("probePresetBottomRight"), xMin: 60, xMax: 95, yMin: 60, yMax: 95, tag: t("zh") === "zh" ? "右下微落笔触" : "Bottom right texture details" }
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setRegionXMin(preset.xMin);
                          setRegionXMax(preset.xMax);
                          setRegionYMin(preset.yMin);
                          setRegionYMax(preset.yMax);
                          setRegionLabel(preset.tag);
                        }}
                        className="text-[10.5px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range Sliders Grid */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                      <span>{t("probeHorizontalAnchor")} (Start %)</span>
                      <span className="font-mono text-indigo-400 font-semibold">{regionXMin}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={regionXMin}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionXMin(val);
                        if (val >= regionXMax) {
                          setRegionXMax(Math.min(100, val + 10));
                        }
                      }}
                      className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-900 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                      <span>{t("probeHorizontalAnchor")} (End %)</span>
                      <span className="font-mono text-indigo-400 font-semibold">{regionXMax}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={regionXMax}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionXMax(val);
                        if (val <= regionXMin) {
                          setRegionXMin(Math.max(0, val - 10));
                        }
                      }}
                      className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-900 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                      <span>{t("probeVerticalAnchor")} (Start %)</span>
                      <span className="font-mono text-indigo-400 font-semibold">{regionYMin}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={regionYMin}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionYMin(val);
                        if (val >= regionYMax) {
                          setRegionYMax(Math.min(100, val + 10));
                        }
                      }}
                      className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-900 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                      <span>{t("probeVerticalAnchor")} (End %)</span>
                      <span className="font-mono text-indigo-400 font-semibold">{regionYMax}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={regionYMax}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionYMax(val);
                        if (val <= regionYMin) {
                          setRegionYMin(Math.max(0, val - 10));
                        }
                      }}
                      className="w-full accent-indigo-500 rounded-lg h-1.5 bg-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Sub-region Label Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 block tracking-wide font-sans">
                    🔍 {t("zh") === "zh" ? "本次定向探析的局部主题/主观描述 (ROI Title)：" : "Subject/Keyword for targeted regional probe (ROI Title):"}
                  </label>
                  <input
                    type="text"
                    value={regionLabel}
                    onChange={(e) => setRegionLabel(e.target.value)}
                    placeholder={t("zh") === "zh" ? "远山轮廓、微波倒影、材质颗粒" : t("tagsPlaceholder")}
                    className="w-full text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Submit probe analysis */}
                <div>
                  <button
                    type="button"
                    disabled={regionLoading}
                    onClick={runRegionAnalysis}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {regionLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>{t("loadingPixelReport")}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t("reRunAnalysisBtn")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Region Analysis Output Result */}
            {regionError && (
              <div className="p-3.5 bg-red-950/50 border border-red-900 text-red-300 rounded-xl text-xs flex items-center animate-fade-in-up whitespace-pre-wrap">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{regionError}</span>
              </div>
            )}

            {regionResult && (
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs animate-fade-in-up shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-extrabold text-amber-400 text-xs flex items-center font-sans">
                    <Check className="w-4 h-4 text-emerald-400 mr-1.5 shrink-0" />
                    {t("spectrumReport")}: {regionResult.coordinates || `X:[${regionXMin}%~${regionXMax}%], Y:[${regionYMin}%~${regionYMax}%]`}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest font-bold">
                    PROBE SOLITARY OUTPUT
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Descriptions columns */}
                  <div className="lg:col-span-8 space-y-3 font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider font-mono">{t("microElementsTitle")}</span>
                      <p className="text-slate-300 leading-relaxed text-justify bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        {regionResult.subRegionDescription}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider font-mono">{t("designPurposeTitle")}</span>
                      <p className="text-slate-300 leading-relaxed text-justify bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        {regionResult.designPurpose}
                      </p>
                    </div>
                  </div>

                  {/* Micro element tags */}
                  <div className="lg:col-span-4 space-y-2 font-sans">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono block">{t("microTextureTags")}</span>
                    <div className="flex flex-col gap-2">
                      {regionResult.microElements && regionResult.microElements.map((elem: string, idx: number) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                          <span className="text-slate-300 text-[11px] font-semibold">{elem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-100 animate-pulse">
          <Layers className="w-8 h-8 text-indigo-300 mx-auto mb-2 animate-bounce" />
          <span>{t("analysisReset")}</span>
        </div>
      )}
    </div>
  );
};
