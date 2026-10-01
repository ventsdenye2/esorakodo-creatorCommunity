import{r as e}from"./rolldown-runtime-C60lm6uB.js";import{i as t,r as n}from"./framework-maMm1VQx.js";import{t as r}from"./markdown-BNwnEShL.js";var i=e(n(),1),a=t(),o=[{label:`标题`,before:`
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
| 内容 | 内容 |`}];function s({initialValue:e=``}){let[t,n]=(0,i.useState)(e),[s,c]=(0,i.useState)(`split`),l=(0,i.useRef)(null),u=(0,i.useId)();function d(e){let r=l.current,i=r?.selectionStart??t.length,a=r?.selectionEnd??i,o=t.slice(i,a)||e.sample,u=t.slice(0,i)+e.before+o+e.after+t.slice(a);u.length>5e4||(n(u),s===`preview`&&c(`edit`),requestAnimationFrame(()=>{l.current?.focus(),l.current?.setSelectionRange(i+e.before.length,i+e.before.length+o.length)}))}return(0,a.jsxs)(`section`,{className:`markdown-editor`,"aria-label":`档案正文编辑器`,children:[(0,a.jsxs)(`div`,{className:`markdown-editor-heading`,children:[(0,a.jsx)(`label`,{htmlFor:u,children:`档案正文`}),(0,a.jsx)(`div`,{className:`markdown-modes`,"aria-label":`编辑视图`,children:[[`edit`,`编辑`],[`split`,`分栏`],[`preview`,`预览`]].map(([e,t])=>(0,a.jsx)(`button`,{type:`button`,"aria-pressed":s===e,onClick:()=>c(e),children:t},e))})]}),(0,a.jsx)(`div`,{className:`markdown-toolbar`,"aria-label":`插入格式`,children:o.map(e=>(0,a.jsx)(`button`,{type:`button`,onClick:()=>d(e),children:e.label},e.label))}),(0,a.jsxs)(`div`,{className:`markdown-panes markdown-mode-${s}`,children:[(0,a.jsx)(`textarea`,{id:u,ref:l,"aria-label":`Markdown 正文`,name:`body`,value:t,onChange:e=>n(e.target.value),maxLength:5e4,rows:18,placeholder:`在这里写下档案。选中文字后，可用上方按钮添加格式。`,hidden:s===`preview`}),s!==`edit`&&(0,a.jsx)(`div`,{className:`markdown-live-preview`,"aria-label":`正文预览`,children:t?(0,a.jsx)(r,{children:t}):(0,a.jsx)(`p`,{className:`markdown-placeholder`,children:`正文预览会显示在这里。`})})]}),(0,a.jsxs)(`p`,{className:`markdown-help`,children:[`支持 Markdown 标题、表格、列表、粗体、斜体与引用。`,t.length.toLocaleString(`zh-CN`),` / 50,000 字`]})]})}export{s as MarkdownEditor};