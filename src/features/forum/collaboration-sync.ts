import * as Y from "yjs";

// An update can decode successfully while waiting for missing earlier structs/deletes.
export function isForumDocumentComplete(doc: Y.Doc) {
  return doc.store.pendingStructs === null && doc.store.pendingDs === null;
}

// A successful HTTP response is not an acknowledgement unless the persisted
// document contains the entire submitted state, including deletions.
export function acknowledgesForumUpdate(saved: Uint8Array, sent: Uint8Array) {
  const doc = new Y.Doc();
  try {
    Y.applyUpdate(doc, saved);
    if (!isForumDocumentComplete(doc)) return false;
    const before = Y.encodeStateAsUpdate(doc);
    Y.applyUpdate(doc, sent);
    if (!isForumDocumentComplete(doc)) return false;
    const after = Y.encodeStateAsUpdate(doc);
    return before.length === after.length && before.every((byte, i) => byte === after[i]);
  } finally { doc.destroy(); }
}
