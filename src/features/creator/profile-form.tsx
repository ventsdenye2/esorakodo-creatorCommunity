"use client";
import {useActionState,useState,startTransition} from 'react';
import {saveProfile} from './actions';
import {AvatarPicker} from '../media/avatar-picker';
export function ProfileForm({displayName,bio,avatarId}:{displayName:string;bio:string;avatarId?:string|null}){
 const [uploading,setUploading]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [state,action,pending]=useActionState(async(previous:Parameters<typeof saveProfile>[0],form:FormData)=>{const result=await saveProfile(previous,form);if(!result.error)setDirty(false);return result;},{error:'',message:''});
 return <form className="portal-form" onChange={()=>setDirty(true)} onSubmit={event=>{event.preventDefault();if(pending||uploading)return;const data=new FormData(event.currentTarget);startTransition(()=>action(data));}}><AvatarPicker initialId={avatarId} name={displayName} disabled={pending||uploading} onBusy={setUploading} onChange={()=>setDirty(true)}/><label>显示名称<input disabled={pending||uploading} name="display_name" defaultValue={displayName} required maxLength={60}/></label><label>个人简介<textarea disabled={pending||uploading} name="bio" defaultValue={bio} maxLength={1000} rows={6}/></label><button className="button button-primary" disabled={pending||uploading}>{pending?'正在保存…':'保存资料'}</button>{uploading&&<p role="status">头像正在上传，请完成后保存。</p>}{state.error&&<p role="alert">{state.error}</p>}{state.message&&!dirty&&<p role="status">{state.message}</p>}</form>;
}
