import{L as e,N as t,P as n}from"../../index.js";import{t as r}from"./image-DGG7TKLo.js";import{t as i}from"./image-upload-BSTckwjk.js";import{n as a,t as o}from"./body-DsYcooxy.js";import{t as s}from"./markdown-DBPp7XAl.js";var c=e(t(),1),l=n();function u({value:e,onChange:t}){let n=(0,c.useRef)(e),[s,u]=(0,c.useState)(``);(0,c.useEffect)(()=>{n.current=e},[e]);let{images:d}=a(e);return(0,l.jsxs)(`section`,{className:`student-portrait-editor`,"aria-label":`人物图片与立绘`,children:[(0,l.jsx)(`h2`,{children:`人物图片 / 立绘`}),(0,l.jsx)(`p`,{children:`图片随本次档案修改一起保存，也会保留在修订历史中。`}),(0,l.jsx)(`div`,{className:`student-portrait-previews`,children:d.map((n,i)=>(0,l.jsxs)(`figure`,{children:[(0,l.jsx)(r,{unoptimized:!0,src:n.url,width:200,height:240,alt:n.alt||`人物图片`}),(0,l.jsx)(`figcaption`,{children:n.alt||`图片 ${i+1}`}),(0,l.jsxs)(`button`,{type:`button`,onClick:()=>{let n=-1;t(e.split(/\r?\n/).filter(e=>a(e).images.length?(n++,n!==i):!0).join(`
`))},children:[`移除图片 `,i+1]})]},`${n.id}-${i}`))}),(0,l.jsx)(i,{disabled:e.length>49700,onUploaded:e=>{let r=n.current+`
`+o(e.id,`人物立绘`)+`
`;if(r.length>5e4){u(`正文已达字数上限，请缩短后重新添加图片。`);return}n.current=r,t(r),u(``)}}),s&&(0,l.jsx)(`p`,{role:`alert`,children:s})]})}var d=[{label:`标题`,before:`
## `,after:`
`,sample:`小节标题`},{label:`粗体`,before:`**`,after:`**`,sample:`重点内容`},{label:`斜体`,before:`*`,after:`*`,sample:`强调内容`},{label:`有序列表`,before:`
1. `,after:`
2. 下一项
`,sample:`第一项`},{label:`无序列表`,before:`
- `,after:`
- 下一项
`,sample:`第一项`},{label:`引用`,before:`
> `,after:`
`,sample:`引用内容`},{label:`链接`,before:`[`,after:`](https://example.com)`,sample:`链接文字`},{label:`代码`,before:"\n```\n",after:"\n```\n",sample:`代码内容`},{label:`表格`,before:`
`,after:`
`,sample:`| 项目 | 说明 |
| --- | --- |
| 内容 | 内容 |
| 内容 | 内容 |`}];function f({initialValue:e=``,portraits:t=!1}){let[n,r]=(0,c.useState)(e),[i,a]=(0,c.useState)(`split`),o=(0,c.useRef)(null),f=(0,c.useId)();function p(e){let t=o.current,s=t?.selectionStart??n.length,c=t?.selectionEnd??s,l=n.slice(s,c)||e.sample,u=n.slice(0,s)+e.before+l+e.after+n.slice(c);u.length>5e4||(r(u),i===`preview`&&a(`edit`),requestAnimationFrame(()=>{o.current?.focus(),o.current?.setSelectionRange(s+e.before.length,s+e.before.length+l.length)}))}return(0,l.jsxs)(`section`,{className:`markdown-editor`,"aria-label":`档案正文编辑器`,children:[t&&(0,l.jsx)(u,{value:n,onChange:r}),(0,l.jsxs)(`div`,{className:`markdown-editor-heading`,children:[(0,l.jsx)(`label`,{htmlFor:f,children:`档案正文`}),(0,l.jsx)(`div`,{className:`markdown-modes`,"aria-label":`编辑视图`,children:[[`edit`,`编辑`],[`split`,`分栏`],[`preview`,`预览`]].map(([e,t])=>(0,l.jsx)(`button`,{type:`button`,"aria-pressed":i===e,onClick:()=>a(e),children:t},e))})]}),(0,l.jsx)(`div`,{className:`markdown-toolbar`,"aria-label":`插入格式`,children:d.map(e=>(0,l.jsx)(`button`,{type:`button`,onClick:()=>p(e),children:e.label},e.label))}),(0,l.jsxs)(`div`,{className:`markdown-panes markdown-mode-${i}`,children:[(0,l.jsx)(`textarea`,{id:f,ref:o,"aria-label":`Markdown 正文`,name:`body`,value:n,onChange:e=>r(e.target.value),maxLength:5e4,rows:18,placeholder:`在这里写下档案。选中文字后，可用上方按钮添加格式。`,hidden:i===`preview`}),i!==`edit`&&(0,l.jsx)(`div`,{className:`markdown-live-preview`,"aria-label":`正文预览`,children:n?(0,l.jsx)(s,{children:n}):(0,l.jsx)(`p`,{className:`markdown-placeholder`,children:`正文预览会显示在这里。`})})]}),(0,l.jsxs)(`p`,{className:`markdown-help`,children:[`支持 Markdown 标题、表格、列表、粗体、斜体与引用。`,n.length.toLocaleString(`zh-CN`),` / 50,000 字`]})]})}export{f as MarkdownEditor};