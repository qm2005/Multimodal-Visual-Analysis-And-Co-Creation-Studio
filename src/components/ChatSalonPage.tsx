import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { ChatMessage } from "../types";
import { LazyImage } from "./LazyImage";
import { useTranslation } from "../context/LanguageContext";

interface ChatSalonPageProps {
  imageUrl: string | null;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  loading: boolean;
  runAnalysis: (mode: "qa", customPrompt?: string) => void;
  setActivePage: (p: "workbench" | "features" | "social" | "literary" | "salon") => void;
}

export const ChatSalonPage: React.FC<ChatSalonPageProps> = ({
  imageUrl,
  chatMessages,
  setChatMessages,
  loading,
  runAnalysis,
  setActivePage,
}) => {
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();

  // Auto scroll to bottom of chat when messages array updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  // Pre-populate with first friendly welcome message if none exist but imageUrl is ready
  useEffect(() => {
    if (imageUrl && (chatMessages.length === 0 || chatMessages[0]?.id === "welcome-init")) {
      const initMsg: ChatMessage = {
        id: "welcome-init",
        sender: "ai",
        text: language === "zh"
          ? "你好！多模态图像在工坊中加载已经就绪！您可以对这张图片的“冷暖光泽、设计质感、主体比例、艺术隐喻、技术排版、或背后未尽的情感细节”向我随时提问哦。您可以直接尝试下方我为您提供的几个核心探索引导预留问句，也可以在下方输入框中尽情敲下您的见解！"
          : "Hello! The multimodal image source has loaded successfully in the salon! You are welcome to query me anytime regarding the temperature, structural aesthetics, color weights, artistic metaphors, typography layouts, or hidden details. Try selecting any of the preset questions below or write down your own insights directly!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([initMsg]);
    }
  }, [imageUrl, chatMessages.length, language]);

  // Handle post submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const query = inputVal.trim();
    setInputVal("");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMessage]);
    runAnalysis("qa", query);
  };

  // Handle clicking presets
  const selectPresetInquiry = (prompt: string) => {
    if (loading) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMessage]);
    runAnalysis("qa", prompt);
  };

  // Empty state guard
  if (!imageUrl) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-5 py-16 shadow-xs max-w-2xl mx-auto my-6">
        <div className="mx-auto w-16 h-16 p-4 bg-slate-50 text-indigo-500 rounded-2xl border border-slate-100 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-lg">{t("noImageSource")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {language === "zh"
              ? "自由双语提问对话需要对具体插图进行上下文多模态投喂。请前往智能工作台，快速上传或生成图片来建立对话沙龙！"
              : "Interactive Q&A requires feeding image context into the multimodal model first. Please go to the Intelligent Workbench to upload or generate one!"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActivePage("workbench")}
          className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:translate-x-0.5"
        >
          <span>👇 {language === "zh" ? "前往智能工作台导入/生图" : "Go to Intelligent Workbench"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const presets = language === "zh"
    ? [
        "这张图最引人注目、占据视觉中心的是什么？",
        "画面上是如何精妙运用冷暖色对比与偏重的？",
        "如果我想参照这个风格写一张海报，你会建议应该怎么排版？",
        "画面传达了怎样深层的视觉艺术隐喻和情感基调？"
      ]
    : [
        "What is the most central or prominent visual element in this image?",
        "How does the image leverage warm and cool colors or lighting weights?",
        "If I want to design a poster referencing this style, what layout would you recommend?",
        "What deeper artistic metaphors or emotional mood does this image convey?"
      ];

  return (
    <div className="space-y-5 animate-fade-in-up flex flex-col h-[650px]">
      {/* Top Banner details */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <MessageSquare className="w-4.5 h-4.5 mr-1.5 text-indigo-600 animate-pulse" />
            <span>{language === "zh" ? "双语图像对话智能微沙龙" : "Bilingual Interactive QA Sandbox"}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === "zh"
              ? "通过建立起双向对话通道，您可以针对这张图的冷暖情绪流、笔触细节或潜在的设计考量随时向 Gemini 深入发问。"
              : "By leveraging the power of Gemini, engage in structural or aesthetic dialogues regarding details and contexts of this image."}
          </p>
        </div>
        <div className="text-[10px] bg-slate-100 border border-slate-150 rounded-lg px-2.5 py-1 text-slate-500 font-mono font-semibold self-start sm:self-auto uppercase">
          {language === "zh" ? "图像多模态Q&A" : "Interactive QA Sandbox"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Side: Thumbnail of active image being discussed */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-4.5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              {language === "zh" ? "当前讨论图像流" : "Under Discussion image"}
            </span>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-100 flex items-center justify-center shadow-inner">
              <LazyImage
                src={imageUrl}
                alt="Discussing active"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                wrapperClassName="w-full h-full"
              />
              <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-white font-mono text-[9px] px-2 py-0.5 rounded backdrop-blur-xs font-semibold z-20">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Quick preset inquiry list */}
          <div className="space-y-2 pt-2 border-t border-slate-50 overflow-y-auto max-h-[220px]">
            <span className="text-[10.5px] font-extrabold text-slate-400 block tracking-wider uppercase flex items-center">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 mr-1 shrink-0" />
              {language === "zh" ? "智能推荐探索方向" : "Suggested Topics"}:
            </span>
            <div className="flex flex-col gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => selectPresetInquiry(preset)}
                  className="w-full text-left text-[11px] bg-slate-50 hover:bg-slate-100/90 border border-slate-100 text-slate-600 hover:text-slate-900 p-2.5 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-50 text-justify font-sans"
                >
                  🎯 {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Message Feed & form inputs */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl flex flex-col min-h-0 overflow-hidden">
          {/* Message Feed list (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5.5 space-y-4 bg-slate-50/25">
            {chatMessages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1`}
                >
                  <div className="flex items-center space-x-1.5 px-1">
                    <span className="text-[9px] text-slate-400 font-mono font-bold">
                      {isAi
                        ? (language === "zh" ? "🎓 智能多模态导师" : "🎓 Gemini Multi-Modal Tutor")
                        : (language === "zh" ? "👤 您" : "👤 You")}{" "}
                      · {msg.timestamp}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap shadow-xs border font-sans ${
                      isAi
                        ? "bg-white border-slate-100 text-slate-700 text-justify"
                        : "bg-indigo-600 border-indigo-600 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 pl-1.5 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
                <span className="animate-pulse">
                  {language === "zh" ? "Gemini 导师正在深思熟虑画面元素中..." : "Gemini is analyzing details meticulously..."}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input controls footer */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
            <form onSubmit={handleFormSubmit} className="flex gap-2.5">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={loading}
                placeholder={
                  language === "zh"
                    ? "在此输入您的学术或者创意疑问（例：『画中有什么隐藏的质感细节？』）..."
                    : "Ask about hidden structures, details or visual moods (e.g., 'What are the textures here?')..."
                }
                className="flex-1 text-xs px-4 py-3 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-sans"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center cursor-pointer hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
