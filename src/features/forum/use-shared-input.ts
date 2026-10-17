"use client";
import { useEffect, useRef, type RefObject } from "react";
import * as Y from "yjs";
import { replaceText } from "./collaboration-document";

// Native text controls keep the existing writing surface. Relative positions keep
// a local caret attached to its text when another editor inserts before it.
export function useSharedInput<T extends HTMLInputElement | HTMLTextAreaElement>(ref: RefObject<T | null>, text?: Y.Text) {
  const composing = useRef(false);
  useEffect(() => {
    const element = ref.current, doc = text?.doc;
    if (!element || !text || !doc) return;
    element.value = text.toString();
    let start: Y.RelativePosition | null = null, end: Y.RelativePosition | null = null;
    const before = (transaction: Y.Transaction) => {
      if (transaction.origin === element || composing.current || document.activeElement !== element) return;
      start = Y.createRelativePositionFromTypeIndex(text, Math.min(element.selectionStart ?? 0, text.length));
      end = Y.createRelativePositionFromTypeIndex(text, Math.min(element.selectionEnd ?? 0, text.length));
    };
    const changed = (_event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.origin === element || composing.current) return;
      element.value = text.toString();
      if (document.activeElement === element && start && end) {
        const left = Y.createAbsolutePositionFromRelativePosition(start, doc), right = Y.createAbsolutePositionFromRelativePosition(end, doc);
        if (left && right) element.setSelectionRange(left.index, right.index);
      }
    };
    const compositionStart = () => { composing.current = true; };
    const compositionEnd = () => { composing.current = false; doc.transact(() => replaceText(text, element.value), element); };
    element.addEventListener("compositionstart", compositionStart);
    element.addEventListener("compositionend", compositionEnd);
    doc.on("beforeTransaction", before); text.observe(changed);
    return () => { element.removeEventListener("compositionstart", compositionStart); element.removeEventListener("compositionend", compositionEnd); doc.off("beforeTransaction", before); text.unobserve(changed); };
  }, [text, ref]);
  function input(value: string) { if (text?.doc && !composing.current) text.doc.transact(() => replaceText(text, value), ref.current); }
  return { input, compositionStart: () => { composing.current = true; }, compositionEnd: () => { composing.current = false; if (ref.current) input(ref.current.value); } };
}
