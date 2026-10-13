"use client";
import {useState} from 'react';
import {ImageUpload} from './image-upload';
import {Avatar} from '../../components/ui/avatar';
export function AvatarPicker({initialId,name,onBusy,onChange,disabled=false}:{initialId?:string|null;name:string;onBusy?:(busy:boolean)=>void;onChange?:()=>void;disabled?:boolean}){
 const [assetId,setAssetId]=useState(initialId??'');
 return <div className="avatar-picker"><p>头像</p><Avatar assetId={assetId} name={name}/><input type="hidden" name="avatar_asset_id" value={assetId}/><ImageUpload disabled={disabled} onBusy={onBusy} onUploaded={asset=>{setAssetId(asset.id);onChange?.();}}/>{assetId&&<button type="button" disabled={disabled} className="button" onClick={()=>{setAssetId('');onChange?.();}}>移除头像</button>}</div>;
}
