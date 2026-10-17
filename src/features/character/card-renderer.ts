import { studentNumber, type CharacterDraft } from "./model";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("图片未能载入，请重试。")); image.src = src; });
}
function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / scale, sh = height / scale;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, width, height);
}
export async function normalizePortrait(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 10485760) throw new Error("请选择不超过 10MB 的 PNG、JPEG 或 WebP 图片。");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("图片像素过大，请缩小后再上传。");
    const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 960;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("当前浏览器无法处理照片。");
    ctx.fillStyle = "#eff7fc"; ctx.fillRect(0, 0, 720, 960); cover(ctx, image, 0, 0, 720, 960);
    return canvas.toDataURL("image/jpeg", .9);
  } finally { URL.revokeObjectURL(url); }
}
export async function renderStudentCard(draft: CharacterDraft): Promise<string> {
  const [template, portrait] = await Promise.all([loadImage("/character-maker/art/cardUndergrad.png"), loadImage(draft.portrait), document.fonts.ready]);
  const canvas = document.createElement("canvas"); canvas.width = 1016; canvas.height = 638;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("当前浏览器无法生成学生证。");
  ctx.scale(1016 / 2000, 638 / 1266); ctx.drawImage(template, 0, 0, 2000, 1266);
  ctx.save(); ctx.beginPath(); ctx.roundRect(139, 285, 514, 740, 20); ctx.clip(); ctx.fillStyle = "#eff7fc"; ctx.fillRect(139, 285, 514, 740); cover(ctx, portrait, 139, 285, 514, 740); ctx.restore();
  ctx.fillStyle = "#123b5a"; ctx.textBaseline = "middle";
  const name = draft.name.trim() || "未命名同学";
  let size = 108; do { ctx.font = `600 ${size}px "Microsoft YaHei", sans-serif`; if (ctx.measureText(name).width <= 1060) break; size -= 2; } while (size > 24);
  ctx.fillText(name, 780, 468, 1060);
  ctx.font = '64px Consolas, monospace'; ctx.fillStyle = "#123b5a"; ctx.fillText(studentNumber(draft.requestId), 785, 752, 1060);
  return canvas.toDataURL("image/png");
}
export async function imageFile(src: string, filename: string): Promise<File> {
  const response = await fetch(src); if (!response.ok) throw new Error("学生证图片未能载入，请重试。");
  const blob = await response.blob();
  return new File([blob], filename.replace(/\.png$/, blob.type === "image/jpeg" ? ".jpg" : ".png"), { type: blob.type });
}
