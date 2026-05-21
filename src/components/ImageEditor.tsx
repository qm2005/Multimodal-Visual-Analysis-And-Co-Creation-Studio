import React, { useState, useEffect } from "react";
import { RotateCw, Crop, Sliders, RefreshCw, Check, Sparkles, Undo, Redo } from "lucide-react";
import { LazyImage } from "./LazyImage";

interface ImageEditorProps {
  selectedImageUrl: string | null;
  mimeType: string | null;
  onImageEdited: (base64: string, mimeType: string, imageUrl: string) => void;
}

export type FilterType = 
  | "none" 
  | "grayscale" 
  | "sepia" 
  | "contrast" 
  | "invert" 
  | "warm" 
  | "cool" 
  | "vintage" 
  | "vivid";

interface FilterOption {
  type: FilterType;
  name: string;
  cssVal: string;
  bgPreview: string; // Tailwinds demo classes
}

export interface EditState {
  angle: number;
  activeFilter: FilterType;
  cropLeft: number;
  cropRight: number;
  cropTop: number;
  cropBottom: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  selectedImageUrl,
  mimeType,
  onImageEdited,
}) => {
  // Angle state (0, 90, 180, 270)
  const [angle, setAngle] = useState<number>(0);

  // Active filter
  const [activeFilter, setActiveFilter] = useState<FilterType>("none");

  // Crop offsets in percentage from edges (0-45%)
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);

  // Active sub-tab in editor: filter, rotate, or crop
  const [editorSubTab, setEditorSubTab] = useState<"filter" | "rotate" | "crop">("filter");

  // Is processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // History states for Undo/Redo
  const [history, setHistory] = useState<EditState[]>([
    { angle: 0, activeFilter: "none", cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 }
  ]);
  const [pointer, setPointer] = useState<number>(0);

  const pushToHistory = (nextState: EditState) => {
    const current = history[pointer];
    if (current &&
        current.angle === nextState.angle &&
        current.activeFilter === nextState.activeFilter &&
        current.cropLeft === nextState.cropLeft &&
        current.cropRight === nextState.cropRight &&
        current.cropTop === nextState.cropTop &&
        current.cropBottom === nextState.cropBottom
    ) {
      return; 
    }

    const newHistory = history.slice(0, pointer + 1);
    const updatedHistory = [...newHistory, nextState];
    setHistory(updatedHistory);
    setPointer(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (pointer > 0) {
      const prevPointer = pointer - 1;
      setPointer(prevPointer);
      const state = history[prevPointer];
      if (state) {
        setAngle(state.angle);
        setActiveFilter(state.activeFilter);
        setCropLeft(state.cropLeft);
        setCropRight(state.cropRight);
        setCropTop(state.cropTop);
        setCropBottom(state.cropBottom);
      }
    }
  };

  const handleRedo = () => {
    if (pointer < history.length - 1) {
      const nextPointer = pointer + 1;
      setPointer(nextPointer);
      const state = history[nextPointer];
      if (state) {
        setAngle(state.angle);
        setActiveFilter(state.activeFilter);
        setCropLeft(state.cropLeft);
        setCropRight(state.cropRight);
        setCropTop(state.cropTop);
        setCropBottom(state.cropBottom);
      }
    }
  };

  const commitCurrentToHistory = () => {
    pushToHistory({
      angle,
      activeFilter,
      cropLeft,
      cropRight,
      cropTop,
      cropBottom
    });
  };

  // Reset editor whenever a brand new image is loaded from outside
  useEffect(() => {
    const defaultState: EditState = {
      angle: 0,
      activeFilter: "none",
      cropLeft: 0,
      cropRight: 0,
      cropTop: 0,
      cropBottom: 0
    };
    setAngle(0);
    setActiveFilter("none");
    setCropLeft(0);
    setCropRight(0);
    setCropTop(0);
    setCropBottom(0);
    setHistory([defaultState]);
    setPointer(0);
  }, [selectedImageUrl]);

  if (!selectedImageUrl) {
    return (
      <div className="bg-slate-50/40 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
        请先导入上方多模态图像，随后即可解锁：旋转画幅、微观剪裁和美学滤镜群。
      </div>
    );
  }

  const filters: FilterOption[] = [
    { type: "none", name: "原图", cssVal: "none", bgPreview: "" },
    { type: "grayscale", name: "黑白极简", cssVal: "grayscale(100%)", bgPreview: "grayscale saturate-0" },
    { type: "sepia", name: "怀旧古铜", cssVal: "sepia(100%)", bgPreview: "sepia" },
    { type: "contrast", name: "黑金高反", cssVal: "contrast(150%)", bgPreview: "contrast-150" },
    { type: "invert", name: "幻境反色", cssVal: "invert(100%)", bgPreview: "invert" },
    { type: "warm", name: "落日暖橘", cssVal: "sepia(30%) saturate(140%) hue-rotate(-10deg)", bgPreview: "sepia-[0.3] saturate-[1.4] hue-rotate-[-10deg]" },
    { type: "cool", name: "冬日冷青", cssVal: "saturate(110%) hue-rotate(15deg) brightness(95%)", bgPreview: "saturate-[1.1] hue-rotate-[15deg] brightness-[0.95]" },
    { type: "vintage", name: "胶片回忆", cssVal: "contrast(115%) brightness(90%) sepia(30%) saturate(120%)", bgPreview: "contrast-[1.15] brightness-[0.90] sepia-[0.3] saturate-[1.2]" },
    { type: "vivid", name: "璀璨多姿", cssVal: "saturate(165%) contrast(110%)", bgPreview: "saturate-[1.65] contrast-[1.1]" }
  ];

  const handleRotate = () => {
    const nextAngle = (angle + 90) % 360;
    setAngle(nextAngle);
    pushToHistory({
      angle: nextAngle,
      activeFilter,
      cropLeft,
      cropRight,
      cropTop,
      cropBottom
    });
  };

  const chooseFilter = (type: FilterType) => {
    setActiveFilter(type);
    pushToHistory({
      angle,
      activeFilter: type,
      cropLeft,
      cropRight,
      cropTop,
      cropBottom
    });
  };

  const handleReset = () => {
    const defaultState: EditState = {
      angle: 0,
      activeFilter: "none",
      cropLeft: 0,
      cropRight: 0,
      cropTop: 0,
      cropBottom: 0
    };
    setAngle(0);
    setActiveFilter("none");
    setCropLeft(0);
    setCropRight(0);
    setCropTop(0);
    setCropBottom(0);
    pushToHistory(defaultState);
  };

  const handleSaveChanges = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = selectedImageUrl;
        
        img.onload = () => {
          // 1. Calculate pixel sizes for source cropping
          const sx = img.naturalWidth * (cropLeft / 100);
          const sy = img.naturalHeight * (cropTop / 100);
          const sWidth = img.naturalWidth * (1 - (cropLeft + cropRight) / 100);
          const sHeight = img.naturalHeight * (1 - (cropTop + cropBottom) / 100);

          // 2. Setup canvas dimensions, accounting for rotation
          const canvas = document.createElement("canvas");
          const isRotated90or270 = angle === 90 || angle === 270;
          
          canvas.width = isRotated90or270 ? sHeight : sWidth;
          canvas.height = isRotated90or270 ? sWidth : sHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setIsProcessing(false);
            return;
          }

          // 3. Match selected filters on the canvas context API
          let filterString = "none";
          const chosen = filters.find(f => f.type === activeFilter);
          if (chosen) {
            filterString = chosen.cssVal;
          }
          ctx.filter = filterString;

          // 4. Translate context to center of output canvas, then rotate and draw
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);

          // 5. Draw the source crop centered on rotation point
          ctx.drawImage(
            img,
            sx, sy, sWidth, sHeight,
            -sWidth / 2, -sHeight / 2, sWidth, sHeight
          );

          // 6. Pipe updated base64 to parent handler
          const updatedMime = mimeType || "image/png";
          const editedDataUrl = canvas.toDataURL(updatedMime);
          const base64Data = editedDataUrl.split(";base64,")[1] || "";
          
          onImageEdited(base64Data, updatedMime, editedDataUrl);
          setIsProcessing(false);
        };

        img.onerror = () => {
          setIsProcessing(false);
          alert("图片加载失败，请重试！");
        };
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    }, 150);
  };

  // Get active preview inline style
  const getPreviewFilterClass = () => {
    const f = filters.find(filter => filter.type === activeFilter);
    return f ? f.bgPreview : "";
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-50/80 p-1.5 rounded-lg text-indigo-600">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              🎨 图像智能创意轻编辑工坊 (Light Editor)
            </h3>
            <p className="text-[10px] text-slate-400">在提交大模型解读前，对画幅大小、朝向与意境进行裁剪或重塑</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3.5">
          {/* Undo and Redo control sets */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              disabled={pointer <= 0}
              onClick={handleUndo}
              className="p-1 px-2 rounded-md hover:bg-white hover:shadow-xs text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer flex items-center gap-1 text-[10.5px] font-semibold"
              title="撤销 (Undo)"
            >
              <Undo className="w-3 h-3" />
              撤销
            </button>
            <button
              type="button"
              disabled={pointer >= history.length - 1}
              onClick={handleRedo}
              className="p-1 px-2 rounded-md hover:bg-white hover:shadow-xs text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer flex items-center gap-1 text-[10.5px] font-semibold"
              title="重做 (Redo)"
            >
              <Redo className="w-3 h-3" />
              重做
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            恢复默认
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Left pane: interactive real-time CSS preview */}
        <div className="md:col-span-5 flex flex-col justify-center bg-slate-950 p-4 rounded-xl relative overflow-hidden group min-h-[180px] max-h-[260px] border border-slate-900 select-none">
          <div 
            className="relative mx-auto max-h-[170px] max-w-full rounded-lg transition-transform duration-300"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <LazyImage
              src={selectedImageUrl}
              alt="Real-time edit preview"
              referrerPolicy="no-referrer"
              className={`object-contain max-h-[170px] max-w-full rounded block transition-all duration-300 ${getPreviewFilterClass()}`}
              wrapperClassName="max-h-[170px]"
            />

            {/* Simulated Live Crop Box overlay */}
            <div 
              className="absolute border-2 border-dashed border-sky-400 bg-sky-500/10 transition-all pointer-events-none"
              style={{
                left: `${cropLeft}%`,
                right: `${cropRight}%`,
                top: `${cropTop}%`,
                bottom: `${cropBottom}%`,
              }}
            >
              {/* Dynamic corner indicators */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sky-300"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sky-300"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sky-300"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sky-300"></div>
            </div>
          </div>

          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[9px] text-slate-300 px-2 py-0.5 rounded border border-slate-800">
            画布层级实时渲染预览
          </div>
        </div>

        {/* Right pane: tool controller panels */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Editor sub-category tabs */}
          <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setEditorSubTab("filter")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                editorSubTab === "filter" 
                  ? "bg-white text-slate-800 shadow-xs border border-slate-100" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              美学滤镜
            </button>
            <button
              type="button"
              onClick={() => setEditorSubTab("rotate")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                editorSubTab === "rotate"
                  ? "bg-white text-slate-800 shadow-xs border border-slate-100" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              方向轴
            </button>
            <button
              type="button"
              onClick={() => setEditorSubTab("crop")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                editorSubTab === "crop"
                  ? "bg-white text-slate-800 shadow-xs border border-slate-100" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              微观剪裁
            </button>
          </div>

          {/* Sub Panels rendering */}
          <div className="flex-1 min-h-[110px] flex flex-col justify-center">
            
            {/* 1. FILTER CONTROLLER PANEL */}
            {editorSubTab === "filter" && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">美化调色选项：</span>
                <div className="grid grid-cols-3 gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.type}
                      type="button"
                      onClick={() => chooseFilter(f.type)}
                      className={`text-[11px] py-2 px-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                        activeFilter === f.type
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ROTATE CONTROLLER PANEL */}
            {editorSubTab === "rotate" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-700 block">旋转与构图校正</span>
                    <span className="text-[10px] text-slate-400">支持 90/180/270 度极速几何旋转，重新定义画幅重心</span>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                    当前旋转: {angle}°
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                    顺时针旋转 +90°
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAngle(0)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs py-3 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    归零
                  </button>
                </div>
              </div>
            )}

            {/* 3. CROP CONTROLLER PANEL */}
            {editorSubTab === "crop" && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">高低左右边缘缩剪 (%)：</span>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50/50 p-2.5 border border-slate-105/85 rounded-xl">
                  {/* Left edge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>👈 左边切去</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">{cropLeft}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      value={cropLeft}
                      onChange={(e) => setCropLeft(Number(e.target.value))}
                      onMouseUp={commitCurrentToHistory}
                      onTouchEnd={commitCurrentToHistory}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Right edge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>👉 右边切去</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">{cropRight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      value={cropRight}
                      onChange={(e) => setCropRight(Number(e.target.value))}
                      onMouseUp={commitCurrentToHistory}
                      onTouchEnd={commitCurrentToHistory}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Top edge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>👆 顶部切去</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">{cropTop}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      value={cropTop}
                      onChange={(e) => setCropTop(Number(e.target.value))}
                      onMouseUp={commitCurrentToHistory}
                      onTouchEnd={commitCurrentToHistory}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Bottom edge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>👇 底部切去</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">{cropBottom}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      value={cropBottom}
                      onChange={(e) => setCropBottom(Number(e.target.value))}
                      onMouseUp={commitCurrentToHistory}
                      onTouchEnd={commitCurrentToHistory}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Core Action triggers */}
          <div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveChanges}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-white" />
                  <span>正在像素级重新渲染画布并保存中...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>✨ 确认保存并应用底层编辑画面 (更新当前主画幅)</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
