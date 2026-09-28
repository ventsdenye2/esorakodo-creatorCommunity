"use client";
import {useActionState,startTransition} from 'react';
import {saveProfile} from './actions';
import {AvatarPicker} from '../media/avatar-picker';
export function ProfileForm({displayName,bio,avatarId}:{displayName:string;bio:string;avatarId?:string|null}){
 const [state,action,pending]=useActionState(saveProfile,{error:'',message:''});
 return <form className="portal-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);startTransition(()=>action(data));}}><AvatarPicker initialId={avatarId} name={displayName}/><label>显示名称<input name="display_name" defaultValue={displayName} required maxLength={60}/></label><label>个人简介<textarea name="bio" defaultValue={bio} maxLength={1000} rows={6}/></label><button className="button button-primary" disabled={pending}>{pending?'正在保存…':'保存资料'}</button>{state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}</form>;
}
