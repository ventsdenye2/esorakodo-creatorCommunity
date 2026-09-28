"use client";
import {useActionState,startTransition,type FormEvent} from "react";
import {moderate} from "./actions";
export function ModerationForm({id,contentStatus}:{id:string;contentStatus:string}){
 const [state,action,pending]=useActionState(moderate,{error:"",message:""});
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);startTransition(()=>action(data));}
 return <form action={action} onSubmit={submit} className="portal-form"><input type="hidden" name="id" value={id}/><label>处置方式<select name="action" disabled={pending} defaultValue="dismiss">{contentStatus==="published"&&<option value="hide">隐藏已发布内容</option>}{contentStatus==="hidden"&&<option value="restore">恢复已隐藏内容</option>}<option value="dismiss">不予处理</option></select></label><label>处置说明<textarea name="reason" disabled={pending} required minLength={5} maxLength={1000} rows={3}/></label><button className="button" disabled={pending}>{pending?"处理中…":"记录并执行"}</button>{state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}</form>;
}
