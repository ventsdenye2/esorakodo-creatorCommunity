"use client";
/* eslint-disable @next/next/no-img-element */
import {useState} from 'react';
export function Avatar({assetId,name}:{assetId?:string|null;name:string}){
 const [failed,setFailed]=useState(false);
 return assetId&&!failed?<img className="profile-avatar" src={`/api/media/${assetId}`} alt={`${name}的头像`} width={64} height={64} loading="lazy" onError={()=>setFailed(true)}/>:<span className="profile-avatar profile-avatar-initial" aria-label={`${name}的头像`}>{name.slice(0,1)}</span>;
}
