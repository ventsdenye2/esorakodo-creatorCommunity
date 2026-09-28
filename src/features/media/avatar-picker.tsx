"use client";
import {useState} from 'react';
import {ImageUpload} from './image-upload';
import {Avatar} from '../../components/ui/avatar';
export function AvatarPicker({initialId,name}:{initialId?:string|null;name:string}){
 const [assetId,setAssetId]=useState(initialId??'');
 return <div className="avatar-picker"><p>头像</p><Avatar assetId={assetId} name={name}/><input type="hidden" name="avatar_asset_id" value={assetId}/><ImageUpload onUploaded={asset=>setAssetId(asset.id)}/>{assetId&&<button type="button" className="button" onClick={()=>setAssetId('')}>移除头像</button>}</div>;
}
