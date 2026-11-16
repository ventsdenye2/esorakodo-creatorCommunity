export async function manageForum(topicId: string, body?: unknown) {
  const response = await fetch(`/api/forum/${topicId}/manage`, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "操作未完成，请重试。");
  return data;
}
