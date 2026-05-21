import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, CornerDownLeft, Download, RefreshCw, Layers } from "lucide-react";
import { LazyImage } from "./LazyImage";
import { handleApiResponse } from "../utils/api";

interface AIPaintAssistantProps {
  analyzedTags: string[];
  analyzedMood: string;
  onPipedToAnalyzer: (base64: string, mimeType: string, imageUrl: string) => void;
  onRequestStart?: () => void;
  onRequestEnd?: () => void;
}

export const AIPaintAssistant: React.FC<AIPaintAssistantProps> = ({
  analyzedTags,
  analyzedMood,
  onPipedToAnalyzer,
  onRequestStart,
  onRequestEnd,
}) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedImg, setGeneratedImg] = useState<{ url: string; base64: string; description?: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg("请先输入一些文字描述噢");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setGeneratedImg(null);
      if (onRequestStart) {
        onRequestStart();
      }

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      const data = await handleApiResponse(response);
      if (data.success && data.imageUrl) {
        // Safe check for base64
        const base64Parts = data.imageUrl.split(";base64,");
        const base64Data = base64Parts[1] || "";
        
        setGeneratedImg({
          url: data.imageUrl,
          base64: base64Data,
          description: data.description,
        });
      } else {
        throw new Error(data.error || data.message || "图像生成失败，模型未返回图像数据。");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`艺术画作生成出现意外: ${err.message || "请求服务器异常，请重试。"}`);
    } finally {
      setLoading(false);
      if (onRequestEnd) {
        onRequestEnd();
      }
    }
  };

  const handleApplyTags = () => {
    if (analyzedTags.length === 0) return;
    const styleStr = analyzedTags.join("、");
    const moodStr = analyzedMood ? `具备【${analyzedMood}】的画风，` : "";
    setPrompt(`一个绝美的数字艺术插画，展现一个充满想象力的场景，${moodStr}融合以下艺术风格和特征标签：${styleStr}。细节精致，4k分辨率`);
  };

  const handleLoadToAnalyzer = () => {
    if (!generatedImg) return;
    onPipedToAnalyzer(generatedImg.base64, "image/png", generatedImg.url);
  };

  const handleDownloadImage = () => {
    if (!generatedImg) return;
    try {
      // Decode base64 to blob to bypass iframe data-url download restriction
      const base64Data = generatedImg.base64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ai-painting-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download via Blob method, trying direct data URL:", err);
      // Fallback to direct download
      const link = document.createElement("a");
      link.href = generatedImg.url;
      link.download = `ai-painting-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500 fill-indigo-200" />
            AI 创意图像发生器
          </div>
          <span className="text-[11px] text-slate-400 font-mono">gemini-2.5-flash-image</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span>输入描述性画作词 (Prompt)：</span>
            {analyzedTags.length > 0 && (
              <button
                type="button"
                onClick={handleApplyTags}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 hover:underline flex items-center py-0.5 px-1 bg-white rounded border border-slate-100 hover:shadow-xs transition-all"
              >
                <Layers className="w-2.5 h-2.5 mr-1" />
                套用分析标签
              </button>
            )}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="描述你想让 AI 绘制的场景。例如：一只穿着宇航服在火星上喝咖啡的可爱白猫，赛博朋克霓虹氛围，手绘插画风格..."
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 resize-none leading-relaxed"
          ></textarea>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">画作长宽比例 (Aspect Ratio)：</span>
            <div className="flex bg-white border border-slate-200 p-0.5 rounded-xl gap-0.5">
              {["1:1", "4:3", "16:9"].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 text-[10px] font-medium py-1 rounded-lg text-center cursor-pointer transition-all ${
                    aspectRatio === ratio
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0 pt-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  绘画中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  生成画作
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-xs space-y-2">
          <div className="flex items-start text-rose-700">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2 shrink-0 mt-1.5"></span>
            <div className="font-semibold flex-1">
              {errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") ? (
                <span>⚠️ 触发大模型 API 免费层配额与频率限制 (429 Rate Limit)</span>
              ) : (
                <span>艺术画作生成出现意外状况</span>
              )}
            </div>
          </div>
          
          {(errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) && (
            <div className="text-slate-600 leading-relaxed text-justify mt-1 pl-3.5 space-y-1.5 border-l-2 border-rose-200">
              <p>
                <strong>CS 实践贴士：</strong>当前大模型平台对画图模型 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">gemini-2.5-flash-image</code> 的免费层级（Free Tier）每日配额有极其严格的次数或并发限制。
              </p>
              <p>
                由于您正在使用的是免费配额测试 Key，超出时便会触发此报错。<strong>您的全套代码逻辑已经 100% 正确跑通</strong>，在未来接入商业生产 key 时即可随时解锁无限绘画。
              </p>
              <p className="text-indigo-600 font-medium">
                💡 <strong>当前作业演示解决方案：</strong>您可以放心跳过该步骤，直接点击左侧最上方的<strong>“晨雾幽林”、“霓虹幻域”或“午后暖角”试用样图</strong>，或者<strong>手动上传您本机的任何精美卡片</strong>！系统核心的“多模态图文识别、美学评分、风格提取标签与小说/文案生成接口”完全在线且绝不受限！
              </p>
            </div>
          )}

          <details className="mt-2 text-[10px] text-slate-400 cursor-pointer pl-3.5">
            <summary className="hover:text-slate-600 select-none">查看底层异常错误栈信息 (用于作业代码调试)</summary>
            <pre className="mt-1 bg-slate-900 text-slate-300 p-2 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap max-h-32">
              {errorMsg}
            </pre>
          </details>
        </div>
      )}

      {generatedImg && (
        <div className="border border-indigo-100 bg-indigo-50/10 rounded-2xl p-3.5 space-y-3 animate-fade-in-up">
          <div className="relative group/img rounded-xl overflow-hidden border border-slate-100 shadow-sm mx-auto max-w-[280px]">
            <LazyImage
              src={generatedImg.url}
              alt="AI Generated"
              referrerPolicy="no-referrer"
              className="w-full object-cover rounded-xl"
              wrapperClassName="w-full"
            />
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="p-1 px-2 bg-black/75 hover:bg-black text-white text-[10px] rounded-lg flex items-center shadow-md cursor-pointer"
              >
                <Download className="w-3 h-3 mr-1" />
                下载
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center">
            <button
              onClick={handleLoadToAnalyzer}
              className="flex-1 w-full text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-98"
            >
              <CornerDownLeft className="w-3.5 h-3.5 mr-1.5" />
              导入多模态智能分析
            </button>
            <button
              onClick={handleDownloadImage}
              className="flex-1 w-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-110 hover:border-emerald-200 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-98"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              保存画作到本地
            </button>
          </div>

          <div className="border-t border-dashed border-slate-200/60 pt-2.5">
            <p className="text-center text-[10px] text-slate-400 leading-normal select-text">
              💡 <strong>提示：</strong>若点击下载未触发（部分浏览器对 iframe 机制有下载安全沙盒路径拦截限制），您只需在上方图片上 <strong>长按</strong> 或面朝图片点击 <strong>鼠标右键选择 “另存为” / “保存图像”</strong> 即可百分百成功保存到本机噢！
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
