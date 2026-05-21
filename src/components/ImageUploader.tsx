import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Zap, AlertTriangle, Check, Loader2 } from "lucide-react";
import { PRESET_IMAGES } from "../data";
import { PresetImage } from "../types";
import { LazyImage } from "./LazyImage";
import { handleApiResponse } from "../utils/api";
import { downscaleImageFile, downscaleImageDataUrl } from "../utils/imageCompressor";

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, imageUrl: string) => void;
  selectedImageUrl: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedImageUrl,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("所选文件不是有效的图像格式哦。请上传图片（JPEG/PNG/WEBP）");
      return;
    }

    setErrorMsg(null);
    setIsCompressing(true);
    try {
      // Compress/downscale file using client canvas to keep payload under 300KB
      const result = await downscaleImageFile(file, 1200);
      onImageSelected(result.base64, result.mimeType, result.dataUrl);
    } catch (err: any) {
      console.error("Client side image downscaling failed:", err);
      setErrorMsg("图像优化压缩失败，请换张图片重试");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePresetSelect = async (preset: PresetImage) => {
    try {
      setLoadingPreset(preset.id);
      setErrorMsg(null);
      
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(preset.url)}`);
      const data = await handleApiResponse(response);
      
      if (data.success && data.imageBase64) {
        const rawDataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        setIsCompressing(true);
        // Optimize the proxy'd remote image block on client side as well for safety
        const result = await downscaleImageDataUrl(rawDataUrl, 1200);
        onImageSelected(result.base64, result.mimeType, result.dataUrl);
      } else {
        throw new Error(data.error || "获取预置图片失败");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`下载预估样图失败: ${err.message || "网络请求异常"}`);
    } finally {
      setIsCompressing(false);
      setLoadingPreset(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        id="image-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] overflow-hidden ${
          isDragActive
            ? "border-indigo-600 bg-indigo-50/50 scale-[0.99] shadow-inner"
            : selectedImageUrl
            ? "border-slate-200 hover:border-indigo-400 bg-slate-50/35"
            : "border-slate-300 hover:border-indigo-500 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {isCompressing && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-2 z-30">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-700">正在优化缩放图像像素...</p>
            <p className="text-[10px] text-slate-400">进行高精度 Canvas 压缩以适配极速多动态计算</p>
          </div>
        )}

        {selectedImageUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
            <div className="relative max-h-[170px] max-w-full rounded-lg overflow-hidden border border-slate-200 shadow-md">
              <LazyImage
                src={selectedImageUrl}
                alt="Selected preview"
                referrerPolicy="no-referrer"
                className="object-contain max-h-[160px] block transition-transform duration-500 group-hover:scale-[1.03]"
                wrapperClassName="max-h-[160px]"
              />
              <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg z-20">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-indigo-600 group-hover:underline flex items-center justify-center">
              <ImageIcon className="w-3 h-3 mr-1" />
              点击或拖拽更换新图片
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex p-3.5 bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-sm border border-slate-100">
              <Upload className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                拖拽本区 或 <span className="text-indigo-600">点击上传图片</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">支持 PNG, JPEG, WEBP 图像格式 (大小不超过12MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs leading-5">
          <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preset Stocks select */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
            <Zap className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
            没有图片？轻触试用一键体验：
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {PRESET_IMAGES.map((preset) => {
            const isSelected = selectedImageUrl && preset.url === selectedImageUrl;
            const isLoading = loadingPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-btn-${preset.id}`}
                disabled={loadingPreset !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePresetSelect(preset);
                }}
                className={`relative border rounded-xl overflow-hidden text-left p-1 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10 shadow-sm"
                    : "border-slate-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-white hover:shadow-xs"
                }`}
              >
                <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                  <LazyImage
                    src={preset.url}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-25">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="p-1 px-1.5 mt-1">
                  <div className="font-medium text-[11px] text-slate-700 truncate">{preset.name}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{preset.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
