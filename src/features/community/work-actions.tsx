"use client";
import { startTransition, useActionState, useState } from 'react';
import { interact } from './actions';
import type { InteractionState, WorkKind } from './types';

function submit(event: React.FormEvent<HTMLFormElement>, action: (form: FormData) => void) {
  event.preventDefault();
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  const form = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget);
  startTransition(() => action(form));
}
export function WorkActions({ kind, id, liked, bookmarked, likes }: { kind: WorkKind; id: string; liked: boolean; bookmarked: boolean; likes: number }) {
  const [reason, setReason] = useState('');
  const [state, action, pending] = useActionState(async (previous: InteractionState, form: FormData) => {
    const result = await interact(previous, form);
    if (!result.error && form.get('action') === 'report') setReason('');
    return result;
  }, { error: '', message: '' });
  return <div><form onSubmit={(event) => submit(event, action)} className="work-action-row"><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><button disabled={pending} name="action" value="like" aria-pressed={liked}>{liked ? '已赞' : '赞'} · {likes}</button><button disabled={pending} name="action" value="bookmark" aria-pressed={bookmarked}>{bookmarked ? '已收藏' : '收藏作品'}</button></form><details className="work-report"><summary>举报内容</summary><form onSubmit={(event) => submit(event, action)}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><label>举报原因<textarea required name="body" minLength={5} maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} disabled={pending} /></label><button disabled={pending} name="action" value="report">提交举报</button></form></details>{state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}</div>;
}
export function CommentForm({ kind, id }: { kind: WorkKind; id: string }) {
  const [body, setBody] = useState('');
  const [state, action, pending] = useActionState(async (previous: InteractionState, form: FormData) => {
    const result = await interact(previous, form);
    if (!result.error) setBody('');
    return result;
  }, { error: '', message: '' });
  return <form onSubmit={(event) => submit(event, action)} className="work-comment-form"><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><label>作品评论<textarea required name="body" rows={3} maxLength={2000} placeholder="交流作品的构思、阅读感受与建议。" value={body} onChange={(event) => setBody(event.target.value)} disabled={pending} /></label><button disabled={pending} name="action" value="comment">{pending ? '正在发布…' : '发布评论'}</button>{state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}</form>;
}
export function RemoveComment({ kind, id }: { kind: WorkKind; id: string }) {
  const [state, action, pending] = useActionState(interact, { error: '', message: '' });
  return <form onSubmit={(event) => submit(event, action)}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><button disabled={pending} name="action" value="remove">移除评论</button>{state.error && <span role="alert">{state.error}</span>}</form>;
}
