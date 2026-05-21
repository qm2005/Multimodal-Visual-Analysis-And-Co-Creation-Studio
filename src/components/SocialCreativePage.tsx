import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Compass,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { SocialMediaCaptions } from "../types";
import { useTranslation } from "../context/LanguageContext";

interface SocialCreativePageProps {
  imageUrl: string | null;
  captionsData: SocialMediaCaptions | null;
  loading: boolean;
  runAnalysis: (mode: "captions") => void;
  copiedText: string | null;
  triggerCopy: (text: string, label: string) => void;
  setActivePage: (p: "workbench" | "features" | "social" | "literary" | "salon") => void;
}

export const SocialCreativePage: React.FC<SocialCreativePageProps> = ({
  imageUrl,
  captionsData,
  loading,
  runAnalysis,
  copiedText,
  triggerCopy,
  setActivePage,
}) => {
  const [activeTab, setActiveTab] = useState<"xiaohongshu" | "instagram" | "linkedin">("xiaohongshu");
  const { t } = useTranslation();

  // Empty state guard
  if (!imageUrl) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-5 py-16 shadow-xs max-w-2xl mx-auto my-6">
        <div className="mx-auto w-16 h-16 p-4 bg-slate-50 text-indigo-500 rounded-2xl border border-slate-100 flex items-center justify-center">
          <Share2 className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-lg">{t("noImageSource")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("zh") === "zh"
              ? "社媒推广文案需要与特定图片的视觉元素、冷暖光影以及氛围基调相结合。请现在前往工作台上传图片或生图！"
              : "Social media marketing copy requires parsing the composition, tones, and visual elements of a specific image. Please visit the workbench to upload or generate one!"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActivePage("workbench")}
          className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:translate-x-0.5"
        >
          <span>👇 {t("zh") === "zh" ? "前往智能工作台导入/生图" : "Go to Intelligent Workbench"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Loading state guard
  if (loading && !captionsData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-5 shadow-xs">
        <div className="relative inline-block">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">
            {t("zh") === "zh" ? "Gemini 双语多模态社媒撰稿人分析中" : "Gemini Multimodal Social Copywriter Analyzing"}
          </h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {t("zh") === "zh"
              ? "正在评估图像包含的主题风格、主要色相明暗、并实时规划符合受众喜好的推文排版和新潮标签..."
              : "Evaluating visual motifs, color contrasts, layout cues, and preparing customized hashtags and emoji sequences..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header Option */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <Share2 className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>{t("zh") === "zh" ? "爆款图文社媒创作矩阵" : "Viral Social Copywriting Center"}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("zh") === "zh"
              ? "大模型智能撰文系统已融合小红书、Instagram 以及 LinkedIn 的专业分发调性，助您一键排版宣发。"
              : "AI writing algorithms tailored for Xiaohongshu, Instagram, and LinkedIn specific formatting preferences."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => runAnalysis("captions")}
          disabled={loading}
          className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center shadow-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Loader2 className={`w-3.5 h-3.5 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
          {t("zh") === "zh" ? "重新生成社媒文案" : "Regenerate Captions"}
        </button>
      </div>

      {captionsData ? (
        <>
          {/* Main Copywriting Area */}
          <div className="space-y-4">
            {/* Nav Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 sm:max-w-md">
              {(["xiaohongshu", "instagram", "linkedin"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs py-2.5 rounded-xl font-bold text-center cursor-pointer transition-all ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "xiaohongshu"
                    ? `📕 ${t("zh") === "zh" ? "小红书红爆款" : "Xiaohongshu"}`
                    : tab === "instagram"
                    ? `📸 ${t("zh") === "zh" ? "Ins 极简风" : "Instagram style"}`
                    : `💼 ${t("zh") === "zh" ? "LinkedIn 专业派" : "LinkedIn corporate"}`}
                </button>
              ))}
            </div>

            {/* Generated copy card layout */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6.5 shadow-xs relative">
              {/* Copy action */}
              <button
                type="button"
                onClick={() => {
                  const currentPayload = captionsData[activeTab];
                  if (!currentPayload) return;
                  const readyToCopy = `${
                    currentPayload.title ? currentPayload.title + "\n\n" : ""
                  }${currentPayload.content}\n\n${(currentPayload.tags || [])
                    .map((t) => "#" + t)
                    .join(" ")}`;
                  triggerCopy(readyToCopy, "captions");
                }}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-150 text-slate-600 hover:text-slate-900 rounded-xl text-xs flex items-center shadow-xs transition-all cursor-pointer border-slate-200"
              >
                {copiedText === "captions" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
                    <span className="text-emerald-700 font-bold">{t("zh") === "zh" ? "复制成功" : "Successfully Copied!"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5 text-indigo-500" />
                    <span>{t("zh") === "zh" ? "复制全盘推文" : "Copy Full Post"}</span>
                  </>
                )}
              </button>

              <div className="space-y-4 pt-2">
                {captionsData[activeTab]?.title && (
                  <h3 className="text-base font-extrabold text-slate-900 pr-24 leading-snug font-sans">
                    {captionsData[activeTab].title}
                  </h3>
                )}

                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed text-justify pr-3 font-sans">
                  {captionsData[activeTab]?.content}
                </p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                  {captionsData[activeTab]?.tags?.map((tg, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-indigo-50/70 border border-indigo-100/40 text-indigo-600 px-2.5 py-1 rounded-lg font-mono font-medium"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Creative Ideation / Pro tips */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-indigo-100 rounded-2xl p-5 border border-indigo-950/80 shadow-lg space-y-3">
            <h4 className="font-bold text-sm text-indigo-200 flex items-center font-display border-b border-indigo-800/50 pb-2">
              <Compass className="w-4.5 h-4.5 text-indigo-400 mr-1.5 shrink-0 animate-pulse" />
              {t("zh") === "zh" ? "视觉软表达及摄影构图宣发建议 (AI Social Advice)" : "Creative Positioning & Photo Posting Advice"}
            </h4>
            <p className="text-slate-200 leading-relaxed text-justify text-xs font-sans">
              {captionsData.creativeIdeation}
            </p>
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-100">
          <Share2 className="w-8 h-8 text-indigo-300 mx-auto mb-2 animate-bounce" />
          <span>
            {t("zh") === "zh"
              ? "已载入图片，请点击右上角的“重新生成”或通过分析按钮来呼叫 Gemini 撰写爆品推广。"
              : "Image source active. Tap 'Regenerate Captions' to call Gemini copywriting studio."}
          </span>
        </div>
      )}
    </div>
  );
};
