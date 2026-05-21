import React from "react";
import {
  BookOpen,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { MarkdownView } from "./MarkdownView";
import { LITERARY_TEMPLATES } from "../data";
import { useTranslation } from "../context/LanguageContext";

interface LiteraryWorkshopPageProps {
  imageUrl: string | null;
  storyMarkdown: string | null;
  activeStoryTemplate: string;
  setActiveStoryTemplate: (id: string) => void;
  loading: boolean;
  runAnalysis: (mode: "story", customPrompt?: string) => void;
  copiedText: string | null;
  triggerCopy: (text: string, label: string) => void;
  setActivePage: (p: "workbench" | "features" | "social" | "literary" | "salon") => void;
}

export const LiteraryWorkshopPage: React.FC<LiteraryWorkshopPageProps> = ({
  imageUrl,
  storyMarkdown,
  activeStoryTemplate,
  setActiveStoryTemplate,
  loading,
  runAnalysis,
  copiedText,
  triggerCopy,
  setActivePage,
}) => {
  const { t } = useTranslation();

  // Empty state guard
  if (!imageUrl) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-5 py-16 shadow-xs max-w-2xl mx-auto my-6">
        <div className="mx-auto w-16 h-16 p-4 bg-slate-50 text-indigo-500 rounded-2xl border border-slate-100 flex items-center justify-center">
          <BookOpen className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-lg">{t("noImageSource")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("zh") === "zh"
              ? "创意文学写作需要参画入意，剖析画面主体的潜在情感隐喻及线条结构张力。请即刻移步工作台导入图像！"
              : "Creative literature rendering requires scanning the visual imagery, emotional metaphors and structural composition of the picture. Navigate to the workbench now to import!"}
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
  if (loading && !storyMarkdown) {
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
            {t("zh") === "zh" ? "Gemini 多模态文学修辞智库协同生成中" : "Gemini Multimodal Literary Studio Compiling"}
          </h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {t("zh") === "zh"
              ? "正在解构画作的情境流、描配诗意修辞，并融合选定的主题基调开始书写独白小说手稿..."
              : "Deconstructing the painterly flow, forging descriptive poetry, and marrying selected tone settings to carve deep monologues..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header option toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <BookOpen className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>{t("zh") === "zh" ? "智能多模态图文叙事文学馆" : "Intelligent Multimodal Narratives Studio"}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("zh") === "zh"
              ? "通过选择不同情感意象和创作流派，呼唤大语言模型的文学修辞智力，一键将冷冰冰的像素翻译成温暖浪漫的数字手稿。"
              : "By selecting varied visual motifs and creative tropes, mobilize the power of LLMs to translate cold pixels into warm, lyrical narrative drafts."}
          </p>
        </div>

        {storyMarkdown && (
          <button
            type="button"
            onClick={() => {
              const currentTmpl = LITERARY_TEMPLATES.find((t) => t.id === activeStoryTemplate);
              runAnalysis("story", currentTmpl?.prompt);
            }}
            disabled={loading}
            className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center shadow-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Loader2 className={`w-3.5 h-3.5 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
            {t("zh") === "zh" ? "重新构思写作" : "Re-Compose Manuscript"}
          </button>
        )}
      </div>

      {/* Literary Selector Options */}
      <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1 w-full">
          <label className="text-[10.5px] font-extrabold text-slate-400 block uppercase tracking-wider">
            {t("zh") === "zh" ? "请自选心仪的文学题材与感官意调 (Creative Vibe Select)：" : "Choose your desired creative trope & literature mood:"}
          </label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {LITERARY_TEMPLATES.map((tmpl) => {
              let name = tmpl.name;
              if (t("zh") !== "zh") {
                if (tmpl.id === "romantic") name = "Healing Romanticism";
                else if (tmpl.id === "scifi") name = "Sci-Fi Mythos";
                else if (tmpl.id === "mystery") name = "Noir Mystery";
                else if (tmpl.id === "poetry") name = "Modern Lyric Poetry";
              }
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setActiveStoryTemplate(tmpl.id);
                    // Trigger with the custom template prompt immediately
                    runAnalysis("story", tmpl.prompt);
                  }}
                  className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    activeStoryTemplate === tmpl.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Story Content View Render block */}
      {storyMarkdown ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6.5 sm:p-8 shadow-xs relative">
          {/* Copy button */}
          <button
            type="button"
            onClick={() => triggerCopy(storyMarkdown, "story")}
            className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs flex items-center shadow-xs transition-all cursor-pointer border-slate-200"
          >
            {copiedText === "story" ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
                <span className="text-emerald-700 font-bold">{t("zh") === "zh" ? "已复制 MD 原稿" : "Copied MD source"}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5 text-indigo-500" />
                <span>{t("zh") === "zh" ? "复制 MD 全文" : "Copy Markdown"}</span>
              </>
            )}
          </button>

          <div className="prose prose-indigo max-w-none text-slate-700">
            <MarkdownView content={storyMarkdown} />
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-8 h-8 text-indigo-300 mx-auto mb-2 animate-bounce" />
          <span>
            {t("zh") === "zh"
              ? "已经载入图片。请在上方轻触选择任一文学题材（如治愈唯美/科幻深邃），即刻提炼美学并完成创作！"
              : "Image is loaded safely. Choose any literary motif above to immediately analyze aesthetics and write warm copy!"}
          </span>
        </div>
      )}
    </div>
  );
};
