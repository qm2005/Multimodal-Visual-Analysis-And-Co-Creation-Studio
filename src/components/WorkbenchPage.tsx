import React from "react";
import { ImageUploader } from "./ImageUploader";
import { ImageEditor } from "./ImageEditor";
import { AIPaintAssistant } from "./AIPaintAssistant";
import { Check, AlertCircle, ArrowRight, Sparkles, Image as ImageIcon } from "lucide-react";
import { VisualFeatures } from "../types";
import { useTranslation } from "../context/LanguageContext";

interface WorkbenchPageProps {
  imageUrl: string | null;
  imageBase64: string | null;
  mimeType: string | null;
  featuresData: VisualFeatures | null;
  handleImageSelected: (base64: string, mime: string, url: string) => void;
  onImageEdited: (newBase64: string, newMime: string, newUrl: string) => void;
  setActivePage: (page: "workbench" | "features" | "social" | "literary" | "salon") => void;
  setActiveRequests: React.Dispatch<React.SetStateAction<number>>;
}

export const WorkbenchPage: React.FC<WorkbenchPageProps> = ({
  imageUrl,
  imageBase64,
  mimeType,
  featuresData,
  handleImageSelected,
  onImageEdited,
  setActivePage,
  setActiveRequests,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center mb-1.5 font-display">
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-2"></span>
          {t("uploadTab")}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {t("zh") === "zh" 
            ? "您可以通过本地拖拽上传、点击文件夹上传，也可以一键试用学者专属的晨雾幽林、霓虹东京等优质灵感素材图。" 
            : "Upload your photography locally or select premium high-fidelity presets."}
        </p>
        
        <ImageUploader
          onImageSelected={handleImageSelected}
          selectedImageUrl={imageUrl}
        />
      </div>

      {imageUrl && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs animate-fade-in-up">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center mb-1.5 font-display">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full mr-2"></span>
            {t("editorHeader")}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {t("editorIntro")}
          </p>
          <ImageEditor
            selectedImageUrl={imageUrl}
            mimeType={mimeType}
            onImageEdited={onImageEdited}
          />
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center mb-1.5 font-display">
          <span className="w-2.5 h-2.5 bg-pink-500 rounded-full mr-2"></span>
          {t("paintTab")}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {t("zh") === "zh" 
            ? "在下方直接向大模型绘图引擎发送描绘指令，为你实时生成具有精妙艺术意境的多模态插图！" 
            : "Describe your concept in english/chinese below to generate rich conceptual illustrations with Gemini."}
        </p>
        <AIPaintAssistant
          analyzedTags={featuresData?.tags || []}
          analyzedMood={featuresData?.moodAndAtmosphere?.dominantMood || ""}
          onPipedToAnalyzer={handleImageSelected}
          onRequestStart={() => setActiveRequests(prev => prev + 1)}
          onRequestEnd={() => setActiveRequests(prev => Math.max(0, prev - 1))}
        />
      </div>

      {imageUrl ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-start space-x-3 text-left">
            <div className="bg-indigo-600 text-white p-2 rounded-xl mt-0.5 shadow-sm">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-indigo-950 text-sm">{t("imageSpecText")}</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                {t("zh") === "zh"
                  ? "图像数据流已经跟创意底座完成对接。快去分析它的色彩、成分，或者为您一瞬撰写爆款宣发软文与故事吧！"
                  : "The image is linked to our co-creation core. Let's analyze details or generate stunning social copy!"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePage("features")}
            className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1.5 cursor-pointer hover:translate-x-0.5"
          >
            <span>🚀 {t("navFeatures")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-5 flex items-start space-x-3 text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-amber-950 text-sm">{t("noImageSource")}</p>
            <p className="text-xs text-amber-800/90 leading-relaxed mt-0.5">
              {t("zh") === "zh"
                ? "上传或生成完图片后，系统的核心模块（特征解读、局部探针、推广软文、大模型对话、创意微散文等）便能完全发挥作用。"
                : "Once you load an image, our intelligence core (spectrum analyzers, marketing, stories, and dialogues) will unlock."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
