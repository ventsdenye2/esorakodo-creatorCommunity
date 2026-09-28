"use client";
import { useId,useState } from "react";
export function ImageUpload({onUploaded,disabled=false}:{onUploaded:(asset:{id:string;url:string})=>void;disabled?:boolean}) {
  const id=useId();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function upload(file:File) {
    setError("");if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10485760){setError("请选择不超过10MB的JPEG、PNG或WebP图片。");return;}
    setBusy(true);
    try {
      const start=await fetch('/api/media/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,mimeType:file.type,byteSize:file.size})});
      const reservation=await start.json();if(!start.ok)throw new Error(reservation.error);
      const upload=await fetch(reservation.uploadUrl,{method:'PUT',headers:reservation.headers,body:file});if(!upload.ok)throw new Error("上传中断，请重新选择图片重试。");
      const complete=await fetch('/api/media/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:reservation.id})});
      const result=await complete.json();if(!complete.ok)throw new Error(result.error);onUploaded(result);
    }catch(err){setError(err instanceof Error?err.message:'图片上传失败。');}finally{setBusy(false);}
  }
  return <div className="image-upload"><label htmlFor={id}>{busy?'正在上传并校验…':'选择图片（JPEG / PNG / WebP，最多10MB）'}</label><input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled||busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.target.value='';}}/>{error&&<p role="alert">{error}</p>}</div>;
}
