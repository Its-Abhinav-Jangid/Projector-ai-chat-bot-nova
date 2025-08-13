export const keys = [
  process.env.AI_API_KEY_1,
  process.env.AI_API_KEY_2,
  process.env.AI_API_KEY_3,
  process.env.AI_API_KEY_4,
  process.env.AI_API_KEY_5,
  process.env.AI_API_KEY_6,
].filter(Boolean);

export function getRotatedKey() {
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}
