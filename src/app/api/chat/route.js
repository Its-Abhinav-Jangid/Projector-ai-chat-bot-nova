import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { fetchWithRotatedKey } from "@/lib/AI/fetchWithRotatedKey";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const IP_LIMIT = 100;

function getIP(req) {
  return (req.headers.get("x-forwarded-for") || "")
    .toString()
    .split(",")[0]
    .trim();
}

async function checkRateLimit(req) {
  const IP = getIP(req);

  const used = await redis.get(`AIDemoUsage:${IP}`);
  if (used >= IP_LIMIT) {
    return {
      allowed: false,
      reason: "AI usage limit reached. Get full access when we launch.",
      status: 429,
      new: false,
    };
  }
  if (!used) {
    return {
      allowed: true,
      reason: null,
      status: 200,
      new: true,
    };
  }

  return {
    allowed: true,
    reason: null,
    status: 200,
    new: false,
  };
}

export async function POST(request) {
  console.log(process.env.UPSTASH_REDIS_REST_URL);
  const limit = await checkRateLimit(request);

  if (!limit.allowed) {
    return NextResponse.json(
      { role: "error", content: limit.reason },
      { status: limit.status }
    );
  }

  const payload = await request.json();
  console.log(payload);

  if (!payload.messages) {
    return NextResponse.json(
      { role: "error", content: "No messages provided" },
      { status: 400 }
    );
  }

  const systemPrompt = {
    role: "system",
    content: `You are a friendly, engaging AI assistant named Nova, created for a school technology showcase. 
Your goal is to give clear, concise, and interesting responses that are fun to watch on a projector. 
Always greet users warmly, answer in a way that keeps the audience engaged, and adapt your tone to be 
enthusiastic yet professional. Use occasional emojis to add visual flair (but no more than 2 per message). 
Avoid controversial or inappropriate topics, and always keep your responses school-safe.

When explaining concepts, keep sentences short, use bullet points when helpful, and occasionally 
give fun facts related to the topic use emojis. If the user asks for something creative, make it colorful.

End every answer with either:
- a short follow-up question to keep the conversation going, OR
- a quick suggestion for something else the user can ask.

`,
  };

  const chatHistory = [systemPrompt, ...payload.messages.slice(-5)];

  try {
    const data = await fetchWithRotatedKey({ messages: chatHistory });

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({
        role: "error",
        content: "No response received",
      });
    }
    if (limit.new) {
      await redis.set(`AIDemoUsage:${getIP(request)}`, 1, {
        ex: 3600 * 24 * 2,
      });
    } else {
      await redis.incr(`AIDemoUsage:${getIP(request)}`);
    }
    const res = NextResponse.json(
      { role: "assistant", content: reply },
      { status: 200 }
    );

    return res;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        role: "error",
        content: "Some internal error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
