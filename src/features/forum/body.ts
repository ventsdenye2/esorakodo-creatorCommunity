export type ForumImage = { id: string; alt: string; url: string };
const imageLine = /^!\[([^\]\r\n]*)\]\(\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)$/i;
export function parseForumBody(body: string) {
  const images: ForumImage[] = [];
  const text: string[] = [];
  for (const line of body.replace(/\r\n?/g, "\n").split("\n")) {
    const match = imageLine.exec(line.trim());
    if (match) images.push({ id: match[2], alt: match[1], url: "/api/media/" + match[2] });
    else text.push(line);
  }
  return { text: text.join("\n").trim(), images };
}
export function validForumImages(body: string) {
  return body.replace(/\r\n?/g, "\n").split("\n").every(line => !line.includes("![") || imageLine.test(line.trim()));
}
export function forumImageMarkdown(id: string, alt: string) {
  return "![" + alt.replace(/[\]\r\n[]/g, " ") + "](/api/media/" + id + ")";
}
