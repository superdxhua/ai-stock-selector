import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const SYSTEM_PROMPT = `你是一位专业的股票投资顾问智能体，擅长技术分析和选股策略。

你的能力包括：
1. 根据用户需求分析股票市场趋势
2. 基于技术指标（MACD、KDJ、RSI、均线等）提供选股建议
3. 解读股票基本面数据
4. 提供风险提示和投资建议

注意事项：
- 始终提醒用户投资有风险，入市需谨慎
- 不做具体买卖承诺，只提供分析建议
- 对于数据性问题，引导用户查看具体的数据接口
- 回答要专业、客观、有理有据
- 使用 Markdown 格式让回答更清晰（表格、列表等）`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    // 提取并转发请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息历史
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    // 使用流式输出
    const stream = client.stream(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.7,
    });

    // 创建 SSE 响应流
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
