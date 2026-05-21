/**
 * Utilities for robust handling of API responses and JSON-parsing failure mitigations.
 */

/**
 * Safely handles an API response. If the response is not OK, it inspects the Content-Type
 * and payload to extract structured error details (json) or parse any raw html/text error
 * pages (like Express 'Payload Too Large' errors or server timeout errors).
 */
export async function handleApiResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") || "";
  let bodyText = "";
  
  try {
    bodyText = await response.text();
  } catch (err: any) {
    throw new Error(`无法读取服务器响应数据 (HTTP 状态码: ${response.status}) ${err.message || ""}`);
  }

  if (!response.ok) {
    // If response content type is JSON, try parsing error message
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        const errorJson = JSON.parse(bodyText);
        throw new Error(errorJson.error || errorJson.message || `请求不成功 (状态码: ${response.status})`);
      } catch (e: any) {
        throw new Error(e.message || `请求不成功 (状态码: ${response.status})`);
      }
    } else {
      // If response is HTML (e.g. Express default error page, Nginx Gateway error, or 413 Payload too large)
      // Extract the error details inside a <pre> element if present
      const preRegex = /<pre>([\s\S]*?)<\/pre>/i;
      const match = bodyText.match(preRegex);
      if (match && match[1]) {
        throw new Error(`服务器处理出错 (${response.status}): ${match[1].trim()}`);
      }
      
      const titleRegex = /<title>([\s\S]*?)<\/title>/i;
      const titleMatch = bodyText.match(titleRegex);
      if (titleMatch && titleMatch[1]) {
        throw new Error(`服务器处理出错 (${response.status}): ${titleMatch[1].trim()}`);
      }

      throw new Error(`服务器内部错误或连接超时 (${response.status})。请稍后重试或上传较小的图片。`);
    }
  }

  // Parse success response safely
  try {
    return JSON.parse(bodyText);
  } catch (err: any) {
    throw new Error(`解析服务器响应 JSON 数据失败 (状态码: ${response.status})。可能返回了非标准数据流或格式错误。原文本：${bodyText.substring(0, 150)}...`);
  }
}
