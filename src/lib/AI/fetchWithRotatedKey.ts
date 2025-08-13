import axios from "axios";
import { keys } from "./getRotatedKey";

// Fisher-Yates shuffle
function shuffle(array: any) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export async function fetchWithRotatedKey({
  messages,
  maxTokens,
}: {
  messages: any;
  maxTokens: number;
}) {
  const shuffledKeys = shuffle([...keys]); // copy + shuffle

  for (const key of shuffledKeys) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: process.env.AI_MODEL,
          messages: messages,
          maxTokens: maxTokens || 5000,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data; // success!
    } catch (err: any) {
      console.warn(`Key failed: ${key}, retrying...`, err.message);

      continue;
    }
  }

  throw new Error("All keys failed. Please try again later.");
}
