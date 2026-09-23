import type { College, Json, Place, Student, WikiRevision } from "../../types/database";

export const wikiEntityTypes = ["student", "college", "place"] as const;
export type WikiEntityType = (typeof wikiEntityTypes)[number];

export type WikiEntity = Student | College | Place;

export type WikiEntitySummary = {
  id: string;
  type: WikiEntityType;
  slug: string;
  name: string;
  summary: string | null;
  version: number;
  updatedAt: string;
};

export type WikiEntityDetail = WikiEntitySummary & {
  collegeId: string | null;
  signature: string | null;
  createdBy: string;
  createdAt: string;
};

export type WikiRevisionView = WikiRevision & {
  snapshot: Json;
};

export function isWikiEntityType(value: string): value is WikiEntityType {
  return wikiEntityTypes.includes(value as WikiEntityType);
}

export function getWikiEntityLabel(type: WikiEntityType) {
  return { student: "人物", college: "学院", place: "地点" }[type];
}

export function getWikiEntityHref(type: WikiEntityType, slug: string) {
  return `/wiki/${type}/${encodeURIComponent(slug)}`;
}
