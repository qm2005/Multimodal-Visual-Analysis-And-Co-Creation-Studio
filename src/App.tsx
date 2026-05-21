import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  BookOpen,
  Loader2,
  Aperture,
  Share2,
  AlertCircle,
  Cpu
} from "lucide-react";
import { WorkbenchPage } from "./components/WorkbenchPage";
import { FeatureAnalysisPage } from "./components/FeatureAnalysisPage";
import { SocialCreativePage } from "./components/SocialCreativePage";
import { LiteraryWorkshopPage } from "./components/LiteraryWorkshopPage";
import { ChatSalonPage } from "./components/ChatSalonPage";
import { LITERARY_TEMPLATES } from "./data";
import {
  AnalysisMode,
  VisualFeatures,
  SocialMediaCaptions,
  ChatMessage
} from "./types";
import { useTranslation } from "./context/LanguageContext";
import { useLoadingState } from "./hooks/useLoadingState";
import { handleApiResponse } from "./utils/api";

// Helper to prevent requests from hanging indefinitely by enforcing a 25s timeout threshold
const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = 25000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error(
        "请求已超时 (限时 25秒)。这通常因为服务器负荷较重、Gemini 模型暂无响应或网络不畅。您可以再次点击重新发送，或手动上传一张稍小的图片噢。"
      );
    }
    throw error;
  }
};

export default function App() {
  const { language, toggleLanguage, t } = useTranslation();

  // Page state: workbench (工作台), features (特征), social (社媒), literary (文学), salon (沙龙)
  const [currentPage, setCurrentPage] = useState<"workbench" | "features" | "social" | "literary" | "salon">("workbench");

  // Image states
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Shared elegant loading state manager custom hook
  const {
    loading,
    regionLoading,
    activeRequests,
    setActiveRequests,
    isGlobalLoading,
    startAnalysis,
    endAnalysis,
    resetAll,
  } = useLoadingState();

  // Region Focus states
  const [regionXMin, setRegionXMin] = useState(30);
  const [regionXMax, setRegionXMax] = useState(70);
  const [regionYMin, setRegionYMin] = useState(30);
  const [regionYMax, setRegionYMax] = useState(70);
  const [regionLabel, setRegionLabel] = useState("画面核心主体质感");
  const [regionResult, setRegionResult] = useState<any | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  
  // States for outputs
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Analytical outputs data
  const [featuresData, setFeaturesData] = useState<VisualFeatures | null>(null);
  const [captionsData, setCaptionsData] = useState<SocialMediaCaptions | null>(null);
  const [activeStoryTemplate, setActiveStoryTemplate] = useState("romantic");
  const [storyMarkdown, setStoryMarkdown] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Trigger copy indicator
  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Reset the loaded data when image changes
  const handleImageSelected = (base64: string, mime: string, url: string) => {
    setImageBase64(base64);
    setMimeType(mime);
    setImageUrl(url);
    
    // Clear previous results
    setFeaturesData(null);
    setCaptionsData(null);
    setStoryMarkdown(null);
    setChatMessages([]);
    setErrorMsg(null);
    setRegionResult(null);
    setRegionError(null);
  };

  // Trigger Model Multimodal Action
  const runAnalysis = async (mode: AnalysisMode, customPrompt?: string) => {
    if (!imageBase64 || !mimeType) {
      setErrorMsg(t("noImageSource"));
      return;
    }

    try {
      startAnalysis(false);
      setErrorMsg(null);

      const response = await fetchWithTimeout("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          mode,
          customPrompt,
          language
        }),
      });

      const result = await handleApiResponse(response);
      if (!result.success) {
        throw new Error(result.error || "Request failed");
      }

      if (mode === "features") {
        setFeaturesData(result.data);
      } else if (mode === "captions") {
        setCaptionsData(result.data);
      } else if (mode === "story") {
        setStoryMarkdown(result.markdown);
      } else if (mode === "qa") {
        const botMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: "ai",
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`大模型多模态处理出错啦: ${err.message || "未知原因"}`);
    } finally {
      endAnalysis(false);
    }
  };

  // Interactive image click pointer to center focus coordinates box [0, 100]
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Create default focus box dimensions
    const boxW = Math.max(10, regionXMax - regionXMin);
    const boxH = Math.max(10, regionYMax - regionYMin);

    const halfW = boxW / 2;
    const halfH = boxH / 2;

    let newXMin = Math.round(clickX - halfW);
    let newXMax = Math.round(clickX + halfW);
    let newYMin = Math.round(clickY - halfH);
    let newYMax = Math.round(clickY + halfH);

    // Coordinate lock to stay within range [0, 100]
    if (newXMin < 0) {
      newXMax = boxW;
      newXMin = 0;
    }
    if (newXMax > 100) {
      newXMin = 100 - boxW;
      newXMax = 100;
    }
    if (newYMin < 0) {
      newYMax = boxH;
      newYMin = 0;
    }
    if (newYMax > 100) {
      newYMin = 100 - boxH;
      newYMax = 100;
    }

    setRegionXMin(newXMin);
    setRegionXMax(newXMax);
    setRegionYMin(newYMin);
    setRegionYMax(newYMax);
  };

  const runRegionAnalysis = async () => {
    if (!imageBase64 || !mimeType) {
      setRegionError(t("noImageSource"));
      return;
    }

    try {
      startAnalysis(true);
      setRegionError(null);

      const response = await fetchWithTimeout("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          mode: "region",
          language,
          regionInfo: {
            xMin: regionXMin,
            xMax: regionXMax,
            yMin: regionYMin,
            yMax: regionYMax,
            label: regionLabel,
          },
        }),
      });

      const result = await handleApiResponse(response);
      if (!result.success) {
        throw new Error(result.error || "Failed to retrieve coordinates data");
      }

      setRegionResult(result.data);
    } catch (err: any) {
      console.error(err);
      setRegionError(`Region analysis failed: ${err.message || "Unknown error"}`);
    } finally {
      endAnalysis(true);
    }
  };

  // Set up fluid simulated progress indicators matching active state
  useEffect(() => {
    let intervalId: any = null;
    let fadeOutTimeoutId: any = null;

    if (isGlobalLoading) {
      if (fadeOutTimeoutId) {
        clearTimeout(fadeOutTimeoutId);
      }
      setShowProgressBar(true);
      setLoadingProgress(12);

      intervalId = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 45) return prev + Math.floor(Math.random() * 8) + 4;
          if (prev < 78) return prev + Math.floor(Math.random() * 3) + 1;
          if (prev < 94) return prev + 1;
          return prev;
        });
      }, 200);
    } else {
      setLoadingProgress(100);
      fadeOutTimeoutId = setTimeout(() => {
        setShowProgressBar(false);
        setLoadingProgress(0);
      }, 350);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (fadeOutTimeoutId) clearTimeout(fadeOutTimeoutId);
    };
  }, [isGlobalLoading]);

  // Auto-run features extraction as soon as imageBase64 changes or language matches
  useEffect(() => {
    if (imageBase64) {
      runAnalysis("features");
    }
  }, [imageBase64, language]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col antialiased selection:bg-indigo-100">
      
      {/* Global Interactive Loading Progress Bar (Top Edge) */}
      {showProgressBar && (
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] h-[3.5px] bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300 shadow-[0_1.5px_8px_rgba(99,102,241,0.5)]"
          style={{ width: `${loadingProgress}%` }}
        />
      )}

      {/* Global Soft Activity Float HUD indicator */}
      {isGlobalLoading && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-slate-200 px-4 py-3.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center space-x-4 text-xs max-w-sm pointer-events-auto transition-all animate-fade-in-up">
          <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/30 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="font-bold flex items-center gap-1.5 text-white">
              {t("loadingTitle")}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {t("loadingSubtitle")}: {activeRequests || "SYSTEM"} · CORRELATION {Math.round(loadingProgress)}%
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              resetAll();
              setErrorMsg(language === "zh" ? "用户已手动中止大模型通信。您可以重新选中或生成插画尝试重连！" : "Manually aborted the multimodal model pipeline query. You can re-attempt by re-generating or re-uploading.");
            }}
            className="shrink-0 bg-slate-800 hover:bg-rose-950 font-bold text-[10px] text-rose-400 hover:text-rose-200 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-rose-900 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {language === "zh" ? "强制取消" : "Cancel"}
          </button>
        </div>
      )}
      
      {/* Upper Navigation bar with Elegant CS Student metadata */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-2.5 rounded-xl text-white shadow-md shadow-indigo-600/10">
              <Aperture className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold font-display tracking-tight text-slate-900">
                  {t("appTitle")}
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-100">
                  v3.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("appSubtitle")}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-3 self-start md:self-auto flex-wrap gap-2">
            {/* Quick Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>{language === "zh" ? "English" : "中文 (CN)"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Primary Multi-Page Tab Selector Links bar */}
      <nav className="bg-white/50 border-b border-slate-100 px-6 py-2.5 sticky top-[73px] z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setCurrentPage("workbench")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              currentPage === "workbench"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{t("navWorkbench")}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("features")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              currentPage === "features"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t("navFeatures")}</span>
            {imageUrl && !featuresData && (
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("social")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              currentPage === "social"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{t("navSocial")}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("literary")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              currentPage === "literary"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t("navLiterary")}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("salon")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              currentPage === "salon"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t("navSalon")}</span>
          </button>
        </div>
      </nav>

      {/* Main Single-paged Render Router Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-12">
        {/* Global Error message indicator if present */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs flex items-start space-x-2.5 shadow-xs max-w-4xl mx-auto">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <h4 className="font-bold text-slate-900 mb-0.5">多模态管道处理出错啦</h4>
              <p className="leading-relaxed text-rose-600 font-medium whitespace-pre-wrap">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dynamic page switching conditional */}
        <div className="max-w-4xl mx-auto">
          {currentPage === "workbench" && (
            <WorkbenchPage
              imageUrl={imageUrl}
              imageBase64={imageBase64}
              mimeType={mimeType}
              featuresData={featuresData}
              handleImageSelected={handleImageSelected}
              onImageEdited={handleImageSelected}
              setActivePage={setCurrentPage}
              setActiveRequests={setActiveRequests}
            />
          )}

          {currentPage === "features" && (
            <FeatureAnalysisPage
              imageUrl={imageUrl}
              featuresData={featuresData}
              loading={loading}
              runAnalysis={(m) => runAnalysis(m)}
              regionXMin={regionXMin}
              setRegionXMin={setRegionXMin}
              regionXMax={regionXMax}
              setRegionXMax={setRegionXMax}
              regionYMin={regionYMin}
              setRegionYMin={setRegionYMin}
              regionYMax={regionYMax}
              setRegionYMax={setRegionYMax}
              regionLabel={regionLabel}
              setRegionLabel={setRegionLabel}
              regionLoading={regionLoading}
              regionResult={regionResult}
              regionError={regionError}
              runRegionAnalysis={runRegionAnalysis}
              handleImageClick={handleImageClick}
              setActivePage={setCurrentPage}
            />
          )}

          {currentPage === "social" && (
            <SocialCreativePage
              imageUrl={imageUrl}
              captionsData={captionsData}
              loading={loading}
              runAnalysis={(m) => runAnalysis(m)}
              copiedText={copiedText}
              triggerCopy={triggerCopy}
              setActivePage={setCurrentPage}
            />
          )}

          {currentPage === "literary" && (
            <LiteraryWorkshopPage
              imageUrl={imageUrl}
              storyMarkdown={storyMarkdown}
              activeStoryTemplate={activeStoryTemplate}
              setActiveStoryTemplate={setActiveStoryTemplate}
              loading={loading}
              runAnalysis={(m, p) => runAnalysis(m, p)}
              copiedText={copiedText}
              triggerCopy={triggerCopy}
              setActivePage={setCurrentPage}
            />
          )}

          {currentPage === "salon" && (
            <ChatSalonPage
              imageUrl={imageUrl}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              loading={loading}
              runAnalysis={(m, p) => runAnalysis(m, p)}
              setActivePage={setCurrentPage}
            />
          )}
        </div>
      </main>

      {/* Styled Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-1">
          <p>{t("footerText")}</p>
          <p className="font-mono text-[10px] text-slate-350">
            Powered by Google AI Studio Build & Antigravity Enterprise Agent System.
          </p>
        </div>
      </footer>

    </div>
  );
}
