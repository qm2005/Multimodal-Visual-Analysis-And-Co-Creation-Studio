import { PresetImage } from "./types";

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: "mystic_forest",
    name: "晨雾幽林 (Mystic Forest)",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    description: "氤氲雾气与穿透树冠晨曦的森林溪流",
  },
  {
    id: "neon_cyber",
    name: "霓虹幻域 (Cyber Tokyo)",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80",
    description: "雨夜中迷幻交错的多彩东京霓虹街区",
  },
  {
    id: "cozy_space",
    name: "午后暖角 (Cozy Desk)",
    url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    description: "咖啡暖香、极简电脑与散落的手作日志",
  },
];

export const LITERARY_TEMPLATES = [
  {
    id: "romantic",
    name: "治愈唯美 (Romantic & Healing)",
    prompt: "请根据这张图片的视觉氛围、环境、细节和隐含情感，创作一篇温暖治愈、富有浪漫主义色彩的微型散文。语言要富有张力，运用精致的感官描写（色彩、气味、温度、声音），字数在450字左右。用精致的 Markdown 格式输出，加粗核心感性句，并包含标题与卷首语。",
  },
  {
    id: "scifi",
    name: "科幻深邃 (Sci-Fi Dream)",
    prompt: "请将这张图片视为一个遥远未来、赛博朋克或太空歌剧世界的切片。以此创作一则充满科幻宿命感和神秘科技气息的微型概念故事。注意结合画面中的色彩倾向（如霓虹光影或荒凉色调）和冷暖对比。字数450字左右，以 Markdown 形式分章节输出，首段自带诗意的引言。",
  },
  {
    id: "mystery",
    name: "悬疑冷冽 (Cold Noir)",
    prompt: "将图片氛围设定为黑色电影或现代悬疑小说中的场景。创作一篇冷冽、克制、充满叙事张力的故事片段。注重侧面烘托和画面物象的隐喻分析。字数450字左右，以优雅的 Markdown 格式输出，包含悬念极强的收尾。",
  },
  {
    id: "poetry",
    name: "现代浪漫新诗 (Aesthetic Poetry)",
    prompt: "深度参悟这张图片里的意象、构图线条以及潜藏的寂静寂寞，以此视觉灵魂为引，创作一首包含三到四个乐章的现代主义新诗。诗歌语言应融合西方象征主义与东方意境美，使用排比、回环和色彩通感手法。格式排版在 Markdown 中需有恰到好处的留白，并附上一段富有见地的‘视觉灵感动因’说明。",
  }
];
