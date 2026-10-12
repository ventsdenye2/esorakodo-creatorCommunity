var e=/^!\[([^\]\r\n]*)\]\(\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)$/i;function t(t){let n=[],r=[];for(let i of t.replace(/\r\n?/g,`
`).split(`
`)){let t=e.exec(i.trim());t?n.push({id:t[2],alt:t[1],url:`/api/media/`+t[2]}):r.push(i)}return{text:r.join(`
`).trim(),images:n}}function n(t){return t.replace(/\r\n?/g,`
`).split(`
`).every(t=>!t.includes(`![`)||e.test(t.trim()))}function r(e,t){return`![`+t.replace(/[\]\r\n[]/g,` `)+`](/api/media/`+e+`)`}export{t as n,n as r,r as t};