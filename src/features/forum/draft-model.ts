export type DraftFloor = {
  like_count: number; question_count: number; forum_account_id: string;
  body: string; in_world_time: string; reply_to_floor_no: number | null;
};
export type EditableFloor = Omit<DraftFloor, "reply_to_floor_no"> & { id: string; replyToId: string | null };

export function prepareFloors(floors: DraftFloor[]): EditableFloor[] {
  return floors.map((floor, index) => {
    const { reply_to_floor_no, ...message } = floor;
    return { ...message, id: `initial-${index}`, replyToId: reply_to_floor_no === null ? null : `initial-${reply_to_floor_no - 1}` };
  });
}

export function serializeFloors(floors: EditableFloor[]): DraftFloor[] {
  const positions = new Map(floors.map((floor, index) => [floor.id, index + 1]));
  return floors.map(floor => ({ body: floor.body, forum_account_id: floor.forum_account_id, in_world_time: floor.in_world_time,
    like_count: floor.like_count, question_count: floor.question_count,
    reply_to_floor_no: floor.replyToId ? positions.get(floor.replyToId) ?? null : null }));
}

export function insertFloor(floors: EditableFloor[], floor: EditableFloor, beforeId?: string): EditableFloor[] {
  if (floors.length >= 100) throw new Error("一篇帖子最多 100 条发言。");
  if (!beforeId) return [...floors, floor];
  const position = floors.findIndex((item) => item.id === beforeId);
  if (position <= 0) throw new Error("不能在首楼之前插入发言。");
  return [...floors.slice(0, position), floor, ...floors.slice(position)];
}

export function removeFloor(floors: EditableFloor[], id: string): EditableFloor[] {
  if (floors[0]?.id === id) throw new Error("首楼不能删除。");
  return floors.filter((floor) => floor.id !== id).map((floor) => floor.replyToId === id ? { ...floor, replyToId: null } : floor);
}

export function defaultSpeakerName(seed: string) {
  const names = ["路过图书馆", "晚自习观察员", "食堂排队中", "走廊的风", "今天没有早八", "操场散步中", "窗边的位置", "课间十分钟"];
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${names[hash % names.length]}${String(hash % 10000).padStart(4, "0")}`;
}
