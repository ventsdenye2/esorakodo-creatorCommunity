export const workKinds = ['forum','article','event','supplement'] as const;
export type WorkKind = typeof workKinds[number];
export const workColumns = {forum:'forum_topic_id',article:'article_id',event:'event_id',supplement:'supplement_id'} as const;
export type InteractionState = {error:string;message:string};
