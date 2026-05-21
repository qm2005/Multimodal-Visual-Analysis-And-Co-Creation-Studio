import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "zh" | "en";

interface TranslationDictionary {
  [key: string]: {
    zh: string;
    en: string;
  };
}

const translations: TranslationDictionary = {
  // App Header
  appTitle: {
    zh: "多模态图文智能分析与创作系统",
    en: "Multimodal Visual Analysis & Co-Creation Studio"
  },
  appSubtitle: {
    zh: "基于 Gemini 双语多模态大模型的智能图像识别、多特征提炼与图文创意营销工坊",
    en: "Intelligent image recognition, visual feature extraction & creative copywriting powered by Gemini Multimodal LLM"
  },
  apiStatus: {
    zh: "接口状态: 在线",
    en: "API STATUS: ONLINE"
  },
  studentBadge: {
    zh: "CS 计算机双专业 · 大三",
    en: "CS Double Major · Junior Year"
  },
  studentVibe: {
    zh: "智能多模态大模型工程项目实训",
    en: "Project: Multimodal Agent Engineering"
  },
  modelName: {
    zh: "模型名称: gemini-3.5-flash",
    en: "MODEL: gemini-3.5-flash"
  },
  footerText: {
    zh: "© 2026. 智能多模态图文创作工坊. 专为计算机科学与技术大三学生作业定制设计.",
    en: "© 2026. Multimodal Visual Co-Creation Studio. Custom-built for computer science project presentation."
  },

  // Navigation Tabs
  navWorkbench: {
    zh: "智能画布工作台",
    en: "Creative Workbench"
  },
  navFeatures: {
    zh: "智能特征析像",
    en: "Feature Extractor"
  },
  navSocial: {
    zh: "社媒爆款推广",
    en: "Social Copywriter"
  },
  navLiterary: {
    zh: "创意文学馆",
    en: "Literary Storyteller"
  },
  navSalon: {
    zh: "对话沙龙区",
    en: "Interactive Q&A"
  },

  // Common UI Strings
  loadingTitle: {
    zh: "大模型多模态管道处理中",
    en: "Multimodal Gemini Pipeline Active"
  },
  loadingSubtitle: {
    zh: "活动 API 线程",
    en: "ACTIVE API THREADS"
  },
  reGenerate: {
    zh: "重新分析与生成",
    en: "Re-generate Output"
  },
  copySuccess: {
    zh: "复制成功",
    en: "Copied!"
  },
  copySuccessFull: {
    zh: "已复制原稿",
    en: "Markdown copied successfully"
  },
  copyCaptionFull: {
    zh: "复制全盘推文",
    en: "Copy full captions"
  },
  copyMdFull: {
    zh: "复制 MD 全文",
    en: "Copy MD content"
  },
  noImageSource: {
    zh: "暂无多模态图像源",
    en: "No Multimodal Image Source"
  },
  goWorkbench: {
    zh: "👇 前往智能工作台导入/生图",
    en: "👇 Go to Workbench to Upload/Paint"
  },
  imageLoadedAlert: {
    zh: "已经载入图片。请随时在上方切换页面，体验不同的分析与生成模块！",
    en: "Image loaded successfully. Switch tabs above to discover analysis and generation modules!"
  },

  // Workbench Page
  workbenchTitle: {
    zh: "多源智能画布工作台",
    en: "Multi-Source Intelligent Canvas Workbench"
  },
  workbenchSubtitle: {
    zh: "在这里上传您已有的照片，或者召唤 AI 作画助手生成专属于您的写意概念插画，为大模型注入无限的视觉想象力。",
    en: "Upload your existing photography, or summon our generative painter to render custom conceptual illustrations."
  },
  uploadTab: {
    zh: "📁 本地导入或预设画作 (Import)",
    en: "📁 Local Upload & Presets"
  },
  paintTab: {
    zh: "🎨 召唤 AI 创意艺术生 (AI Painter)",
    en: "🎨 AI Generative Artist"
  },
  imageSpecText: {
    zh: "已成功加载多模态目标卡片图像",
    en: "Target card image loaded for multimodal analysis"
  },
  editorHeader: {
    zh: "🎨 专属图像剪护舱 (Visual Transform and Fine-tuning Studio)",
    en: "🎨 Custom Visual Transform & Tuning Studio"
  },
  editorIntro: {
    zh: "支持极速色温感官滤镜叠加以及 90 度步进旋转重构，调整后的像素数据将完美适配多模态感知输入。",
    en: "Apply fast photo filters, color tweaks, or right-angle rotation. Modified pixels feed directly to Gemini."
  },
  currentTagTitle: {
    zh: "当前图像已提取出的微观视觉标签 (Visual Elements)：",
    en: "Extracted visual elements and structural tags:"
  },
  waitingTags: {
    zh: "请先前往特征析像页面或在此运行抽取",
    en: "Extraction will run automatically once picture loads."
  },
  quickNavigationToModules: {
    zh: "🚀 快速流转至内容产出板块：",
    en: "🚀 Instant routing to downstream generators:"
  },

  // Feature Analysis Page
  featurePageHeader: {
    zh: "多模态视觉多维度透镜析像",
    en: "Multimodal Deep Vision Feature Extraction"
  },
  featurePageDesc: {
    zh: "集成微观色彩光谱捕获、关键实体局部跨模态对齐以及情感灯影与三分透视评价系统。通过 M-CoT（多模态思维链）展示人工智能在解构图像像素时的完整内部决策路径，更有内置反幻觉和对齐度指标。点击右侧图像可以自由移动微聚焦取样框。",
    en: "Capture microscopic color spectra, map local bounding entities, and measure compositional aesthetics. Features a Multimodal Chain-of-Thought (M-CoT) trace explaining pixels-to-thoughts, paired with alignment grounding metrics."
  },
  reRunAnalysis: {
    zh: "重新进行特征提取",
    en: "Re-run Feature Analysis"
  },
  visualSummary: {
    zh: "📝 视觉主旨与基调总括 (Aesthetic & Semantic Summary)",
    en: "📝 Aesthetic & Semantic Visual Summary"
  },
  spectroscopy: {
    zh: "🌈 微观色谱光谱提取 (Microscopic Spectroscopy)",
    en: "🌈 Dominant Color Spectrum"
  },
  entityTracking: {
    zh: "🔍 关键物理实体识别 (Multimodal Bounding Entities)",
    en: "🔍 Key Bound Entities & Objects"
  },
  objectName: {
    zh: "实体名",
    en: "Entity Name"
  },
  objectDescription: {
    zh: "视觉属性描述",
    en: "Visual Description"
  },
  objectProminence: {
    zh: "画面地位",
    en: "Prominence"
  },
  aestheticEvaluating: {
    zh: "📐 情感张力、构图与美学综合质检 (Composition & Atmosphere Evaluation)",
    en: "📐 Composition, Lighting & Mood Audit"
  },
  aestheticRating: {
    zh: "构图与色彩美学评分：",
    en: "Aesthetic Composition & Color score:"
  },
  overarchingMood: {
    zh: "画面核心情绪流：",
    en: "Overarching Emotional Atmosphere:"
  },
  lightingSchema: {
    zh: "光影分布明暗：",
    en: "Lighting Type & Setup:"
  },
  compositionRule: {
    zh: "构图透视法则：",
    en: "Structural Composition Rule:"
  },
  featureTags: {
    zh: "🎨 感官标签 (Sensory Tags)",
    en: "🎨 Sensory Style Tags"
  },
  mcotTitle: {
    zh: "🧠 深入核心：多模态解构思维链脉络 (Multimodal Chain-of-Thought Reasoning)",
    en: "🧠 Deep Dive: Multimodal Chain-of-Thought (M-CoT) Log"
  },
  mcotSub: {
    zh: "大模型在解码图像视觉层时的推理脉络追踪",
    en: "Tracing the internal step-by-step reasoning Gemini uses to convert pixels into metadata"
  },
  mcotStageTitle: {
    zh: "阶段",
    en: "Stage"
  },
  groundingMetricsTitle: {
    zh: "🛡️ 跨模态反幻觉与数据对齐可信度 (Cross-Modal Grounding Alignment)",
    en: "🛡️ Cross-Modal Grounding Alignment & Trust Metrics"
  },
  groundingSub: {
    zh: "由大微调网络对多模态回答做严谨的可信度与对齐校正",
    en: "In-context calibration parameters evaluating pixel-to-description consistency"
  },
  antiHallucination: {
    zh: "反幻觉置信系数",
    en: "Anti-Hallucination Rate"
  },
  alignmentFactor: {
    zh: "跨模态词图对齐度",
    en: "Cross-Modal Alignment"
  },
  semanticInformationDensity: {
    zh: "语义层信息流密度",
    en: "Semantic Info Density"
  },
  microAnalysisTitle: {
    zh: "🔬 局部细节微聚焦取样测定 (Coordinates Micro Focal Sampling)",
    en: "🔬 Coordinate-Focussed Sub-Region Sampling"
  },
  microAnalysisSub: {
    zh: "直接在右侧图像画布中点击，我们的大模型会将视网膜焦点汇聚至您所选的像素坐标，单独对这个矩形子特征空间进行细微解构。",
    en: "Click any local part of the right image. Gemini shifts its focus coordinates to parse custom localized details."
  },
  configureFocalCoords: {
    zh: "配置局部聚焦区域参数：",
    en: "Adjust Coordinate Bounding Box:"
  },
  focusLabelName: {
    zh: "本期取样聚焦名称 (Label)：",
    en: "Sample Target Label:"
  },
  analyzeSpecificRegionBtn: {
    zh: "⚡ 分析指定对齐区域细节",
    en: "⚡ Parse Sub-Region Coordinates"
  },
  analyzingSubregion: {
    zh: "微聚焦空间多模态对准中...",
    en: "Summoning coordinate detail analysis..."
  },
  samplingCoordinates: {
    zh: "取样区域归一化物理座标：",
    en: "Normalized Sampling Coordinates:"
  },
  structuralMeaningText: {
    zh: "细节在全局构图中的点睛意义：",
    en: "Role in overall design composition:"
  },
  detectedMicroTextures: {
    zh: "探测到的微观物质与纹理层：",
    en: "Discovered micro elements & textures:"
  },

  // Social Page
  socialHeader: {
    zh: "爆款图文社媒创作矩阵",
    en: "Social Media Campaign Copywriter"
  },
  socialDesc: {
    zh: "大模型智能撰文系统已融合小红书、Instagram 以及 LinkedIn 的专业分发调性，助您一键排版宣发。",
    en: "Optimised copywriting matrices specifically calibrated to 小红书 (Red Book), Instagram, and LinkedIn styles."
  },
  socialEmptyText: {
    zh: "已载入图片，请点击右上角的“重新生成”或通过分析按钮来呼叫 Gemini 撰写爆品推广。",
    en: "Image is ready. Click Re-generate in top-right to compose premium social copy."
  },
  remixSocialTitle: {
    zh: "重新生成社媒文案",
    en: "Re-generate Social Captions"
  },
  xiaohongshuTab: {
    zh: "📕 小红书爆款风",
    en: "📕 Xiaohongshu Trendy"
  },
  instagramTab: {
    zh: "📸 Ins 极简感官",
    en: "📸 Ins Clean Style"
  },
  linkedinTab: {
    zh: "💼 LinkedIn 专业派",
    en: "💼 LinkedIn Professional"
  },
  socialTipsTitle: {
    zh: "视觉软表达及摄影构图宣发建议 (AI Social Advice)",
    en: "Aesthetic Layout & Visual Framing Recommendations"
  },
  socialEmptyGuard: {
    zh: "社媒推广文案需要与特定图片的视觉元素、冷暖光影以及氛围基调相结合。请现在前往工作台上传图片或生图！",
    en: "Social media campaign generation requires an active image matching visual shadows and objects. Click below to load an image!"
  },

  // Literary Page
  literaryHeader: {
    zh: "智能多模态图文叙事文学馆",
    en: "Intelligent Multimodal Literary Narrative Saloon"
  },
  literaryDesc: {
    zh: "通过选择不同情感意象和创作流派，呼唤大语言模型的文学修辞智力，一键将冷冰冰的像素翻译成温暖浪漫的数字手稿。",
    en: "Blend visual cues with chosen genres. Translate cold pixels into human narratives and poetry draft manuscripts."
  },
  literaryEmptyText: {
    zh: "已经载入图片。请在上方轻触选择任一文学题材（如治愈唯美/科幻深邃），即刻提炼美学并完成创作！",
    en: "Image is ready. Select an aesthetic theme below to write your literary manuscript instantly."
  },
  literarySelectLabel: {
    zh: "请自选心仪的文学题材与感官意调 (Creative Vibe Select)：",
    en: "Select your desired narrative style and emotional atmosphere:"
  },
  literaryEmptyGuard: {
    zh: "创意文学写作需要参画入意，剖析画面主体的潜在情感隐喻及线条结构张力。请即刻移步工作台导入图像！",
    en: "Creative literary narrative matches specific visual frames and emotional metaphors. Go to Workbench to import or paint images first!"
  },
  rewriteStory: {
    zh: "重新构思写作",
    en: "Re-imagine Narrative"
  },

  // Salon Page
  salonHeader: {
    zh: "双语图像对话智能微沙龙",
    en: "Bilingual Multi-Modal Q&A Salon"
  },
  salonDesc: {
    zh: "通过建立起双向对话通道，您可以针对这张图的冷暖情绪流、笔触细节或潜在的设计考量随时向 Gemini 深入发问。",
    en: "Ask Gemini deep questions regarding lighting tones, artistic brushstrokes, hidden motifs, or physical features."
  },
  salonEmptyGuard: {
    zh: "自由双语提问对话需要对具体插图进行上下文多模态投喂。请前往智能工作台，快速上传或生成图片来建立对话沙龙！",
    en: "Interactive visual dialogue requires an active image payload. Head over to the Workbench tab to load one first!"
  },
  discussionStream: {
    zh: "当前讨论图像流",
    en: "Active Discussion Image"
  },
  presetInquiryLabel: {
    zh: "智能推荐探索方向 (Preset Questions)：",
    en: "Discovered Exploratory Vectors:"
  },
  chatWelcomeMsg: {
    zh: "你好！多模态图像在工坊中加载已经就绪！您可以对这张图片的“冷暖光泽、设计质感、主体比例、艺术隐喻、技术排版、或背后未尽的情感细节”向我随时提问哦。您可以直接尝试下方我为您提供的几个核心探索引导预留问句，也可以在下方输入框中尽情敲下您的见解！",
    en: "Hello! Multi-modal image context is successfully loaded. You can ask me anything about lights & shadows, textures, central scale ratio, metaphors, typographic adjustments, or emotional details. Pick a preset vector or type your inquiry directly below."
  },
  placeholderChat: {
    zh: "在此输入您的学术或者创意疑问（例：『画中有什么隐藏的质感细节？』）...",
    en: "Inquire about visual properties (e.g., 'What hidden lighting contrasts support this design?')..."
  },
  aiConsultantBadge: {
    zh: "🎓 智能多模态导师",
    en: "🎓 Gemini Visual Expert"
  },
  userBadge: {
    zh: "👤 您",
    en: "👤 You"
  },
  aiThinking: {
    zh: "Gemini 导师正在深思熟虑画面元素中...",
    en: "Gemini visual agent is interpreting pixel arrays..."
  }
};

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Attempt local storage retrieve
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("app_lang");
      if (saved === "zh" || saved === "en") return saved as Language;
    }
    return "zh";
  });

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("app_lang", next);
      }
      return next;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app_lang", lang);
    }
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry["zh"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
