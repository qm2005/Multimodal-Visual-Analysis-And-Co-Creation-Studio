// Types for our Multimodal Intelligent Image-Text Studio

export type AnalysisMode = "features" | "captions" | "story" | "qa" | "region";

export interface DominantColor {
  colorName: string;
  hex: string;
  percentage: number;
}

export interface KeyObject {
  name: string;
  description: string;
  prominence: "主体" | "背景" | "点缀" | string;
}

export interface MoodAndAtmosphere {
  dominantMood: string;
  lighting: string;
  composition: string;
  aestheticRating: number;
}

export interface MultimodalCoTStep {
  stage: string;
  reasoning: string;
  confidence: number;
}

export interface GroundingMetrics {
  hallucinationIndex: number; // 反幻觉可信度系数
  crossModalAlignment: number; // 跨模态特征对齐度
  semanticDensity: number; // 语义表征信息密度
}

export interface VisualFeatures {
  summary: string;
  dominantColors: DominantColor[];
  keyObjects: KeyObject[];
  moodAndAtmosphere: MoodAndAtmosphere;
  tags: string[];
  steppedCoTReasoning?: MultimodalCoTStep[];
  groundingMetrics?: GroundingMetrics;
}

export interface SocialMediaPost {
  title?: string;
  content: string;
  tags: string[];
}

export interface SocialMediaCaptions {
  xiaohongshu: SocialMediaPost;
  instagram: SocialMediaPost;
  linkedin: SocialMediaPost;
  creativeIdeation: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface PresetImage {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface RegionAnalysis {
  coordinates: string;
  subRegionDescription: string;
  microElements: string[];
  designPurpose: string;
}
