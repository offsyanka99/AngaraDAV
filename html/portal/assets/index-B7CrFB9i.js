var wl=Object.defineProperty;var kl=(s,d,f)=>d in s?wl(s,d,{enumerable:!0,configurable:!0,writable:!0,value:f}):s[d]=f;var Hs=(s,d,f)=>kl(s,typeof d!="symbol"?d+"":d,f);(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))h(v);new MutationObserver(v=>{for(const N of v)if(N.type==="childList")for(const L of N.addedNodes)L.tagName==="LINK"&&L.rel==="modulepreload"&&h(L)}).observe(document,{childList:!0,subtree:!0});function f(v){const N={};return v.integrity&&(N.integrity=v.integrity),v.referrerPolicy&&(N.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?N.credentials="include":v.crossOrigin==="anonymous"?N.credentials="omit":N.credentials="same-origin",N}function h(v){if(v.ep)return;v.ep=!0;const N=f(v);fetch(v.href,N)}})();const qn={off:0,error:1,warn:2,info:3,debug:4};let Qa="off";const Ss="[angaradav-portal]";function Sl(s){const d=(s||"off").toLowerCase().trim();return d==="error"||d==="warn"||d==="info"||d==="debug"||d==="off"?d:"off"}function Dl(s){return Qa=Sl(s),Qa!=="off"&&console.info(Ss,`log level = ${Qa}`),Qa}function Un(s){return qn[Qa]>=qn[s]}function hs(s,d,f,h){if(!Un(s))return;const v=[Ss,f];h!==void 0&&v.push(h),console[d](...v)}function Cl(s,d){Un("info")&&(d&&Object.keys(d).length>0?console.info(Ss,`event:${s}`,d):console.info(Ss,`event:${s}`))}const E={error(s,d){hs("error","error",s,d)},warn(s,d){hs("warn","warn",s,d)},info(s,d){hs("info","info",s,d)},debug(s,d){hs("debug","debug",s,d)},event:Cl};class Ne extends Error{constructor(f,h,v={}){super(f);Hs(this,"status");Hs(this,"payload");this.status=h,this.payload=v}}let $a="",vs=null,ws=null;function ks(s){$a=s&&typeof s=="string"?s:""}function Al(s){vs=s}function El(s){ws=s}function Qs(s){if(!Fn(s))try{ws==null||ws()}catch{}}function Fn(s){return s==="/login"||s==="/ui"||s==="/logout"||s==="/install/status"||s.startsWith("/install/")}function Ds(s,d){if(!Fn(s)){ks("");try{vs==null||vs(d||"Session timed out. Please sign in again.")}catch{}}}async function q(s,d={}){const f=new Headers(d.headers);d.body&&!f.has("Content-Type")&&f.set("Content-Type","application/json");const h=(d.method||"GET").toUpperCase();h!=="GET"&&h!=="HEAD"&&h!=="OPTIONS"&&$a&&f.set("X-CSRF-Token",$a);const v=typeof performance<"u"?performance.now():Date.now();E.debug(`api → ${h} ${s}`);const N=await fetch(`/api${s}`,{...d,headers:f,credentials:"same-origin"});let L=null;const R=await N.text();if(R)try{L=JSON.parse(R)}catch{L={error:R}}const z=Math.round((typeof performance<"u"?performance.now():Date.now())-v);if(!N.ok){let se=`Request failed (${N.status})`,te={};if(L&&typeof L=="object"&&L!==null){const de=L;te={...de},typeof de.error=="string"&&(se=de.error)}else(N.status===500||N.status===504)&&(se="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw N.status>=500?E.error(`api ← ${h} ${s} ${N.status} (${z}ms)`,se):N.status!==401?E.warn(`api ← ${h} ${s} ${N.status} (${z}ms)`,se):(E.debug(`api ← ${h} ${s} 401 (${z}ms)`),Ds(s,se)),new Ne(se,N.status,te)}return E.info(`api ← ${h} ${s} ${N.status} (${z}ms)`),Qs(s),L}function ct(s){return encodeURIComponent(s)}async function In(s,d,f,h){const v=new Headers({"Content-Type":f,Accept:"application/x-ndjson, application/json;q=0.9"});$a&&v.set("X-CSRF-Token",$a);const N=typeof performance<"u"?performance.now():Date.now();E.debug(`api → POST ${s} (stream, ${f}, ${d.length} bytes)`);let L;try{L=await fetch(`/api${s}`,{method:"POST",headers:v,credentials:"same-origin",body:d})}catch(H){const re=H instanceof Error?H.message:"Network error";throw E.error(`api ← POST ${s} network fail`,re),new Ne(`Import request failed to start (${re}). Check connectivity and container logs.`,0)}const R=(L.headers.get("Content-Type")||"").toLowerCase(),z=R.includes("ndjson")||R.includes("x-ndjson");if(!L.ok&&!z){let H=`Request failed (${L.status})`;try{const re=await L.json();re.error&&(H=re.error)}catch{}throw(L.status===504||L.status===502)&&(H="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),L.status===401?(E.debug(`api ← POST ${s} 401`,H),Ds(s,H)):E.warn(`api ← POST ${s} ${L.status}`,H),new Ne(H,L.status)}if(!z&&L.ok){try{const H=await L.json();if(H&&typeof H.error=="string")throw new Ne(H.error,L.status||500);if(H&&typeof H.imported=="number"&&typeof H.updated=="number")return E.info(`api ← POST ${s} json done`),H}catch(H){if(H instanceof Ne)throw H}throw new Ne("Unexpected import response from server",500)}if(!L.body)throw new Ne("Import stream unavailable",500);const se=L.body.getReader(),te=new TextDecoder;let de="";const X={final:null,error:null,sawProgress:!1},qe=H=>{let re;try{re=JSON.parse(H)}catch{E.debug("import stream non-JSON line",H.slice(0,80));return}if(re.type==="progress"){X.sawProgress=!0;const Fe=Number(re.total)||0,Ke=Number(re.current)||0,Me=typeof re.percent=="number"?re.percent:Fe>0?Math.round(100*Ke/Fe):0;h==null||h({percent:Me,current:Ke,total:Fe,imported:Number(re.imported)||0,updated:Number(re.updated)||0,skipped:Number(re.skipped)||0})}else re.type==="done"&&re.result?X.final=re.result:re.type==="error"&&(X.error={message:re.error||"Import failed",status:re.status||500})};for(;;){const{done:H,value:re}=await se.read();if(H)break;de+=te.decode(re,{stream:!0});const Fe=de.split(`
`);de=Fe.pop()??"";for(const Ke of Fe){const Me=Ke.trim();Me&&qe(Me)}}de.trim()&&qe(de.trim());const J=Math.round((typeof performance<"u"?performance.now():Date.now())-N);if(X.error)throw X.error.status===401?(E.debug(`api ← POST ${s} stream 401 (${J}ms)`,X.error.message),Ds(s,X.error.message)):E.warn(`api ← POST ${s} stream error (${J}ms)`,X.error.message),new Ne(X.error.message,X.error.status);if(!X.final)throw E.error(`api ← POST ${s} stream incomplete (${J}ms)`,{sawProgress:X.sawProgress}),new Ne(X.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return E.info(`api ← POST ${s} stream done (${J}ms)`),Qs(s),X.final}const A={ui:()=>q("/ui"),installStatus:async()=>{const s=await q("/install/status");return s&&typeof s=="object"&&"data"in s&&s.data?s.data:s},adminPing:()=>q("/admin/ping"),adminDashboard:()=>q("/admin/dashboard"),adminCapabilities:()=>q("/admin/capabilities"),adminUsers:()=>q("/admin/users"),adminUser:s=>q(`/admin/users/${encodeURIComponent(s)}`),adminCreateUser:s=>q("/admin/users",{method:"POST",body:JSON.stringify(s)}),adminUpdateUser:(s,d)=>q(`/admin/users/${encodeURIComponent(s)}`,{method:"PATCH",body:JSON.stringify(d)}),adminDeleteUser:(s,d=!0)=>q(`/admin/users/${encodeURIComponent(s)}`,{method:"DELETE",body:JSON.stringify({confirm:d})}),adminUserCalendars:s=>q(`/admin/users/${encodeURIComponent(s)}/calendars`),adminCreateUserCalendar:(s,d)=>q(`/admin/users/${encodeURIComponent(s)}/calendars`,{method:"POST",body:JSON.stringify(d)}),adminUpdateUserCalendar:(s,d,f)=>q(`/admin/users/${encodeURIComponent(s)}/calendars/${d}`,{method:"PATCH",body:JSON.stringify(f)}),adminDeleteUserCalendar:(s,d,f=!0)=>q(`/admin/users/${encodeURIComponent(s)}/calendars/${d}`,{method:"DELETE",body:JSON.stringify({confirm:f})}),adminUserAddressBooks:s=>q(`/admin/users/${encodeURIComponent(s)}/addressbooks`),adminCreateUserAddressBook:(s,d)=>q(`/admin/users/${encodeURIComponent(s)}/addressbooks`,{method:"POST",body:JSON.stringify(d)}),adminUpdateUserAddressBook:(s,d,f)=>q(`/admin/users/${encodeURIComponent(s)}/addressbooks/${d}`,{method:"PATCH",body:JSON.stringify(f)}),adminDeleteUserAddressBook:(s,d,f=!0,h=!1)=>q(`/admin/users/${encodeURIComponent(s)}/addressbooks/${d}`,{method:"DELETE",body:JSON.stringify({confirm:f,force:h})}),adminSystemSettings:()=>q("/admin/settings/system"),adminUpdateSystemSettings:s=>q("/admin/settings/system",{method:"PATCH",body:JSON.stringify(s)}),adminResetToDefault:(s=!0,d="")=>q("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:s,password:d})}),adminDatabaseSettings:()=>q("/admin/settings/database"),adminTestDatabaseConnection:s=>q("/admin/settings/database/test",{method:"POST",body:JSON.stringify(s)}),adminUpdateDatabaseSettings:s=>q("/admin/settings/database",{method:"PATCH",body:JSON.stringify(s)}),me:async()=>{var d;const s=await q("/me");return ks(s.csrfToken||((d=s.user)==null?void 0:d.csrfToken)),s},login:async(s,d)=>{var h;const f=await q("/login",{method:"POST",body:JSON.stringify({username:s,password:d})});return ks((h=f.user)==null?void 0:h.csrfToken),f},logout:async()=>{try{return await q("/logout",{method:"POST"})}finally{ks("")}},calendars:()=>q("/calendars"),createCalendar:s=>q("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>q("/holidays/countries"),updateCalendar:(s,d)=>q(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteCalendar:s=>q(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,d,f)=>{const h=new URLSearchParams({from:d,to:f}).toString();return q(`/calendars/${s}/events?${h}`)},getEvent:(s,d)=>q(`/calendars/${s}/events/${ct(d)}`),createEvent:(s,d)=>q(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(d)}),updateEvent:(s,d,f)=>q(`/calendars/${s}/events/${ct(d)}`,{method:"PATCH",body:JSON.stringify(f)}),deleteEvent:(s,d)=>q(`/calendars/${s}/events/${ct(d)}`,{method:"DELETE"}),exportCalendar:async s=>{const d=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!d.ok){let L=`Export failed (${d.status})`;try{const R=await d.json();R.error&&(L=R.error)}catch{}throw new Ne(L,d.status)}const f=d.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(f),v=(h==null?void 0:h[1])||`calendar-${s}.ics`;return{blob:await d.blob(),filename:v}},importCalendar:(s,d,f)=>In(`/calendars/${s}/import`,d,"text/calendar; charset=utf-8",f),directory:()=>q("/directory"),shares:s=>q(`/calendars/${s}/shares`),share:(s,d,f)=>q(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:d,access:f})}),revoke:(s,d)=>q(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:d})}),addressbooks:()=>q("/addressbooks"),createAddressBook:s=>q("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,d)=>q(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteAddressBook:(s,d=!1)=>q(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:d})}),exportAddressBook:async s=>{const d=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!d.ok){let L=`Export failed (${d.status})`;try{const R=await d.json();R.error&&(L=R.error)}catch{}throw new Ne(L,d.status)}const f=d.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(f),v=(h==null?void 0:h[1])||`contacts-${s}.vcf`;return{blob:await d.blob(),filename:v}},importAddressBook:(s,d,f)=>In(`/addressbooks/${s}/import`,d,"text/vcard; charset=utf-8",f),contacts:(s,d="")=>{const f=d.trim()?`?q=${encodeURIComponent(d.trim())}`:"";return q(`/addressbooks/${s}/contacts${f}`)},getContact:(s,d)=>q(`/addressbooks/${s}/contacts/${ct(d)}`),createContact:(s,d)=>q(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(d)}),updateContact:(s,d,f)=>q(`/addressbooks/${s}/contacts/${ct(d)}`,{method:"PATCH",body:JSON.stringify(f)}),deleteContact:(s,d)=>q(`/addressbooks/${s}/contacts/${ct(d)}`,{method:"DELETE"}),exportContact:async(s,d)=>{const f=await fetch(`/api/addressbooks/${s}/contacts/${ct(d)}/export`,{credentials:"same-origin"});if(!f.ok){let R=`Export failed (${f.status})`;try{const z=await f.json();z.error&&(R=z.error)}catch{}throw new Ne(R,f.status)}const h=f.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(h),N=(v==null?void 0:v[1])||"contact.vcf";return{blob:await f.blob(),filename:N}},contactPhotoUrl:(s,d)=>`/api/addressbooks/${s}/contacts/${ct(d)}/photo`,tasks:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const f=d.toString()?`?${d}`:"";return q(`/tasks${f}`)},createTask:s=>q("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,d,f)=>q(`/tasks/${s}/${ct(d)}`,{method:"PATCH",body:JSON.stringify(f)}),deleteTask:(s,d)=>q(`/tasks/${s}/${ct(d)}`,{method:"DELETE"}),bulkTasks:s=>q("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const f=d.toString()?`?${d}`:"";return q(`/notes${f}`)},createNote:s=>q("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,d,f)=>q(`/notes/${s}/${ct(d)}`,{method:"PATCH",body:JSON.stringify(f)}),deleteNote:(s,d)=>q(`/notes/${s}/${ct(d)}`,{method:"DELETE"}),filesStatus:()=>q("/files"),filesList:(s="")=>{const d=new URLSearchParams;s&&d.set("path",s);const f=d.toString()?`?${d}`:"";return q(`/files/entries${f}`)},filesMkdir:(s,d)=>q("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:d})}),filesUpload:(s,d,f={})=>{const h=new URLSearchParams;s&&h.set("path",s),h.set("name",d.name),f.replace&&h.set("replace","1");const v=new FormData;v.append("file",d,d.name),s&&v.append("path",s);const N=typeof performance<"u"?performance.now():Date.now();return E.debug(`api → POST /files/upload path=${s||"/"} name=${d.name} size=${d.size}`),new Promise((L,R)=>{const z=new XMLHttpRequest;z.open("POST",`/api/files/upload?${h}`),z.withCredentials=!0,$a&&z.setRequestHeader("X-CSRF-Token",$a),f.onProgress&&(z.upload.onprogress=se=>{var te,de;se.lengthComputable?(te=f.onProgress)==null||te.call(f,se.loaded,se.total):(de=f.onProgress)==null||de.call(f,se.loaded,d.size||se.loaded)}),z.onload=()=>{const se=Math.round((typeof performance<"u"?performance.now():Date.now())-N);let te=null;const de=z.responseText||"";if(de)try{te=JSON.parse(de)}catch{te={error:de}}const X=z.status;if(X<200||X>=300){let qe=`Upload failed (${X||0})`;te&&typeof te=="object"&&te!==null&&"error"in te&&typeof te.error=="string"&&(qe=te.error),X===401?(E.debug(`api ← POST /files/upload 401 (${se}ms)`,qe),Ds("/files/upload",qe)):X>=500?E.error(`api ← POST /files/upload ${X} (${se}ms)`,qe):E.warn(`api ← POST /files/upload ${X} (${se}ms)`,qe),R(new Ne(qe,X||0));return}E.info(`api ← POST /files/upload 200 (${se}ms)`),Qs("/files/upload"),L(te)},z.onerror=()=>{const se=Math.round((typeof performance<"u"?performance.now():Date.now())-N);E.error(`api ← POST /files/upload network error (${se}ms)`),R(new Ne("Upload failed (network error)",0))},z.onabort=()=>{R(new Ne("Upload cancelled",0))},z.send(v)})},filesDownloadUrl:s=>{const d=new URLSearchParams;return d.set("path",s),`/api/files/download?${d}`},filesDelete:s=>q("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,d)=>q("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:d})}),filesMove:(s,d,f)=>q("/files/move",{method:"POST",body:JSON.stringify({from:s,to:d,newName:f})}),filesCopy:(s,d={})=>q("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:d.to,newName:d.newName})}),filesBulk:(s,d)=>q("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:d})})};function Ys(...s){return s.map(d=>d.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Mn(s){if(!s||typeof s!="object")return!1;const d=s.name;return d==="AbortError"||d==="NotAllowedError"}function Rn(s,d){return Array.from(s).map(h=>{const v=d&&h.webkitRelativePath?h.webkitRelativePath.replace(/\\/g,"/"):h.name;return{file:h,relativePath:v||h.name}})}function Nl(s){return new Promise((d,f)=>{const h=[],v=()=>{s.readEntries(N=>{if(!N.length){d(h);return}h.push(...N),v()},N=>f(N))};v()})}function Tl(s){return new Promise((d,f)=>{s.file(d,f)})}async function Vn(s,d){const f=Ys(d,s.name);if(s.isFile)return[{file:await Tl(s),relativePath:f||s.name}];if(s.isDirectory){const h=s.createReader(),v=await Nl(h);if(v.length===0)return[{file:null,relativePath:f,isEmptyDir:!0}];const N=[];for(const L of v)N.push(...await Vn(L,f));return N}return[]}async function*xl(s){const d=s;if(typeof d.values=="function"){for await(const f of d.values())yield f;return}if(typeof d.entries=="function")for await(const[,f]of d.entries())yield f}async function Xs(s,d){const f=Ys(d,s.name),h=[];let v=0;for await(const N of xl(s))if(v+=1,N.kind==="file"){const L=await N.getFile();h.push({file:L,relativePath:Ys(f,N.name)||L.name})}else N.kind==="directory"&&h.push(...await Xs(N,f));return v===0&&h.push({file:null,relativePath:f,isEmptyDir:!0}),h}async function _l(){const s=window;if(typeof s.showOpenFilePicker!="function")return{kind:"fallback"};try{const d=await s.showOpenFilePicker({multiple:!0});if(!d||d.length===0)return{kind:"cancel"};const f=[];for(const h of d){const v=await h.getFile();f.push({file:v,relativePath:v.name})}return{kind:"items",items:f}}catch(d){return Mn(d)?{kind:"cancel"}:{kind:"fallback"}}}async function ql(){const s=window;if(typeof s.showDirectoryPicker!="function")return{kind:"fallback"};try{const d=await s.showDirectoryPicker({mode:"read"}),f=await Xs(d,"");return f.length===0?{kind:"cancel"}:{kind:"items",items:f}}catch(d){return Mn(d)?{kind:"cancel"}:{kind:"fallback"}}}async function Il(s){const d=s.items?Array.from(s.items):[],f=[];let h=!1,v=!1;for(const N of d){if(N.kind!=="file")continue;const L=N;if(typeof L.getAsFileSystemHandle=="function")try{const R=await L.getAsFileSystemHandle();if(R){if(h=!0,R.kind==="file"){const z=await R.getFile();f.push({file:z,relativePath:z.name})}else R.kind==="directory"&&f.push(...await Xs(R,""));continue}}catch{}if(typeof L.webkitGetAsEntry=="function"){const R=L.webkitGetAsEntry();if(R){v=!0,f.push(...await Vn(R,""));continue}}}return(h||v)&&f.length>0?f:s.files&&s.files.length>0?Rn(s.files,!1):f}function ys(s){if(!s)return!1;if(s.types&&typeof s.types.includes=="function")return s.types.includes("Files");try{for(let d=0;d<s.types.length;d++)if(s.types[d]==="Files")return!0}catch{}return!1}const Ll=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let La=null;function Ol(){if(La)return La;try{const s=Intl;if(typeof s.supportedValuesOf=="function"){const d=s.supportedValuesOf("timeZone");if(Array.isArray(d)&&d.length>0)return La=[...d].sort((f,h)=>f.localeCompare(h)),La}}catch{}return La=[...Ll],La}function Bn(s){const d=s||"UTC",f=Ol(),h=f.includes(d),v=f.map(N=>`<option value="${Ln(N)}" ${N===d?"selected":""}>${On(N)}</option>`);return!h&&d&&v.unshift(`<option value="${Ln(d)}" selected>${On(d)}</option>`),v.join("")}function Ln(s){return s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function On(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function o(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Lt(s,d,f={}){if(!d)return"";const h=f.dismissible!==void 0?f.dismissible:f.dismissAction!==void 0,v=f.dismissAction??"flash-close",N=f.role??"status",L=f.className?` ${f.className}`:"",R=f.style?` style="${o(f.style)}"`:"",z=h?`<button type="button" class="flash-close" data-action="${o(v)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${o(s)}${L}" role="${o(N)}"${R}>
      <span class="flash-text">${o(d)}</span>
      ${z}
    </div>`}function Pl(s){return s==="sm"?" cal-modal-card-sm":s==="wide"?" cal-modal-card-wide":""}function Ul(s){return s==="danger"?"btn btn-danger":s==="ghost"?"btn btn-ghost":"btn btn-primary"}function Ks(s){return s.map(f=>{const h=f.type??"button",v=Ul(f.variant),N=f.disabled?" disabled":"",L=f.id?` id="${o(f.id)}"`:"",R=f.action?` data-action="${o(f.action)}"`:"",z=f.attrs?` ${f.attrs}`:"";return`<button type="${h}" class="${v}"${R}${L}${z}${N}>${o(f.label)}</button>`}).join(`
`)}function Ae(s){const d=s.titleId||(s.id?`${s.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),f=s.id?` id="${o(s.id)}"`:"",h=s.className?` ${s.className}`:"",v=s.rootAttrs?` ${s.rootAttrs}`:"",N=`${Pl(s.size)}${s.cardClassName?` ${s.cardClassName}`:""}`,L=s.closeAction,R=s.lockBackdrop?"":` data-action="${o(L)}"`,z=s.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${o(L)}" aria-label="Close">×</button>`;let se="";s.footer!==void 0&&(se=typeof s.footer=="string"?s.footer:Ks(s.footer));const te=se?`<footer class="cal-modal-footer">${se}</footer>`:"",de=`<div class="cal-modal-body">${s.body}</div>`;let X;return s.form?X=`<form class="stack"${s.formAttrs?` ${s.formAttrs}`:""}>
        ${de}
        ${te}
      </form>`:X=`${de}
      ${te}`,`<div class="cal-modal${h}"${f}${v} role="dialog" aria-modal="true" aria-labelledby="${o(d)}">
      <div class="cal-modal-backdrop"${R}></div>
      <div class="cal-modal-card${N}">
        <header class="cal-modal-header">
          <h3 id="${o(d)}">${o(s.title)}</h3>
          ${z}
        </header>
        ${X}
      </div>
    </div>`}function $s(s){const d=s.style==="checkbox"?"checkbox":"admin-delete-confirm",f=s.style==="checkbox"?' style="margin-top:1rem"':"",h=s.id?` id="${o(s.id)}"`:"",v=s.checked?" checked":"",N=s.disabled?" disabled":"";return`<label class="${d}"${f}>
            <input type="checkbox"${h} data-action="${o(s.action)}"${v}${N} />
            ${o(s.label)}
          </label>`}const zn="angaradav-portal-tab",jn="angaradav-portal-admin-page",Fl="2.1.2",Ml="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Zs(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function Cs(s){return s==="overview"||s==="users"||s==="settings"||s==="database"?s:null}function en(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!s)return{tab:null,adminPage:null,adminUsername:null};if(s==="admin"||s.startsWith("admin/")){const d=s.split("/").filter(Boolean),f=d[1]??"overview",h=Cs(f)??"overview";let v=null;if(h==="users"&&d[2])try{v=decodeURIComponent(d[2])}catch{v=d[2]}return{tab:"admin",adminPage:h,adminUsername:v}}return{tab:Zs(s),adminPage:null,adminUsername:null}}function Rl(){const s=en().tab;if(s)return s;try{const d=Zs(sessionStorage.getItem(zn));if(d)return d}catch{}return"calendars"}function Vl(){const s=en().adminPage;if(s)return s;try{const d=Cs(sessionStorage.getItem(jn));if(d)return d}catch{}return"overview"}function Bl(s,d=null){return s==="overview"?"#admin":s==="users"&&d?`#admin/users/${encodeURIComponent(d)}`:`#admin/${s}`}function yt(s,d="overview",f=null){try{sessionStorage.setItem(zn,s),s==="admin"&&sessionStorage.setItem(jn,d)}catch{}if(typeof history>"u"||typeof location>"u")return;const h=s==="admin"?Bl(d,f):`#${s}`;location.hash!==h&&history.replaceState(null,"",`${location.pathname}${location.search}${h}`)}function Ws(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${o(s)}</span>`}function Js(s){const d=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&d.push(`${s.skipped} skipped`),d.join(", ")}const zl={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Download (files), create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function Ee(s,d,f="h2"){const h=f;return`<div class="section-title-row">
    <${h}>${o(s)}</${h}>
    <button type="button" class="info-btn" data-action="info" data-info="${o(d)}"
      aria-label="About ${o(s)}" title="About ${o(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function jl(){return`
    <div class="info-modal" id="info-modal" hidden role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-backdrop" data-action="info-close"></div>
      <div class="info-modal-card">
        <header class="info-modal-header">
          <h3 id="info-modal-title"></h3>
          <button type="button" class="modal-close info-modal-close" data-action="info-close" aria-label="Close">×</button>
        </header>
        <div class="info-modal-body muted small" id="info-modal-body"></div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="info-close">Got it</button>
        </footer>
      </div>
    </div>`}function Hl(s){let d=null,f=null,h=Rl(),v=Vl(),N=null,L=!1,R=null,z=null,se=null,te=[],de=!1,X=null,qe="",J=en().adminUsername??null,H=null,re=!1,Fe=null,Ke=!1,Me=!1,wt=null,Pt=!1,Ut=[],Ft=[],Oa=!1,tt=null,ea=null,ut=null,ta=null,Te=null,aa=null,Xa=!1,Pa=null,va=!1,kt=!1,at="",sa=null,Za=!1,Ua=null,na="sqlite",wa=!1,St="",ka=null,Re=!1,Sa=null,ce=[],ra=[],es=[],j=null,ae=[],la=[],Ge=null,Se=!1,He=!1,We=null,st=null,Mt={y:new Date().getFullYear(),m:new Date().getMonth()},ia=[],Ns=!1,Dt=!1,k=null,mt=!1,F=null,ts="",Fa=null,Ve=[],W=null,Nt=[],oa="",fe=null,I=null,he=!1,Ie=!1,pt=!1,Pe=null,Qe=null,nt=!1,c=!1,K=null,as=null,V=null,ss=null,ye=!1,Da=null,da=!1,an=!1,Ca={timeFormat:"auto",weekStart:"auto",logLevel:"off"},rt=null,sn=900,Ma=null,ca=Fl,Ts=!1,ns=!1;function xs(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();Ca={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},Dl(Ca.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(sn=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(ca=e.version.trim())}function _s(){Ma!==null&&(clearTimeout(Ma),Ma=null)}function qs(){if(_s(),!d)return;const e=Math.max(30,sn)*1e3;Ma=setTimeout(()=>{Ma=null,dn("Your session timed out. Please sign in again.")},e)}function rs(){_s(),Et(),K=null,V=null,_a(),ye=!1,Xe(),da=!1,d=null,ce=[],la=[],j=null,ae=[],ra=[],Ve=[],W=null,Nt=[],fe=null,I=null,he=!1,Ie=!1,pt=!1,He=!1,Se=!1,We=null,st=null,Dt=!1,k=null,mt=!1,ia=[],Ue=[],Ea=[],Vt=[],Bt=[],Be=null,ft=null,G=null,ue=null,le=!1,_e=!1,De=[],Os=null,$e="",pe=[],fa=!1,Le=null,Ce=null,Ct(),Ze=!1,ye=!1,Xe(),da=!1,be=[],Pe=null,Qe=null,nt=!1,c=!1,Re=!1,N=null,L=!1,R=null,z=null,se=null,te=[],de=!1,X=null,qe="",J=null,H=null,re=!1,Fe=null,Ke=!1,Me=!1,wt=null,Pt=!1,Ut=[],Ft=[],Oa=!1,tt=null,ea=null,ut=null,ta=null,Te=null,aa=null,Xa=!1,Pa=null,va=!1,kt=!1,at="",sa=null,Za=!1,Ua=null,na="sqlite",wa=!1,St="",ka=null,Va()}function xe(){return!!(d!=null&&d.isAdmin||(d==null?void 0:d.role)==="Admin")}function Rt(){return xe()?z===null?!0:z.uiEnabled!==!1:!1}function Je(e){const t=z==null?void 0:z.pages;return t?t.find(a=>a.id===e)??null:null}function Aa(e){switch(e){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return e}}function Ra(e){return e==="full"||e==="read-only"?"badge-ok":e==="deferred"?"badge-off":"badge-soon"}function Va(){Sa&&(document.removeEventListener("click",Sa,!0),Sa=null)}function Hn(){Va(),Sa=t=>{var r;const a=t.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".user-menu")||(Re=!1,Va(),p())};const e=Sa;setTimeout(()=>{Re&&Sa===e&&document.addEventListener("click",e,!0)},0)}function Xe(){Da&&(document.removeEventListener("click",Da,!0),Da=null)}function Wn(){Xe(),Da=t=>{var r;const a=t.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".files-upload-menu")||(ye=!1,Xe(),p())};const e=Da;setTimeout(()=>{ye&&Da===e&&document.addEventListener("click",e,!0)},0)}function nn(){h==="admin"&&(!xe()||!Rt())&&(h="calendars",v="overview",yt(h))}async function rn(e,t={}){if(!xe()){await on("calendars",t);return}h="admin",v=e,e!=="users"?(J=null,H=null,Fe=null):t.username!==void 0&&(J=t.username,t.username||(H=null,Fe=null)),Re=!1,yt("admin",e,J),E.event("tab",{tab:"admin",adminPage:e,user:J}),t.clearFlash!==!1&&T(),c=!0,p();try{if(await Is(),!Rt()){h="calendars",yt("calendars"),g("info","Portal Administration UI is disabled.");return}const a=Je(e);e==="overview"&&(a==null?void 0:a.available)!==!1?await ls():e==="users"&&(a==null?void 0:a.available)!==!1?(await ua(),J&&(await Tt(J),await ma(J))):e==="settings"&&(a==null?void 0:a.available)!==!1?await is():e==="database"&&(a==null?void 0:a.available)!==!1&&await os()}catch(a){E.warn("admin page load failed",a instanceof Error?a.message:a),g("error",a instanceof Error?a.message:"Failed to load")}finally{c=!1,p()}}async function Is(){var e;se=null;try{z=(await A.adminCapabilities()).data,E.debug("admin.capabilities",{uiEnabled:z.uiEnabled,pages:((e=z.pages)==null?void 0:e.length)??0})}catch(t){se=t instanceof Error?t.message:"Failed to load capabilities",z={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},E.warn("admin.capabilities fallback",se)}}async function ls(){L=!0,R=null;try{N=(await A.adminDashboard()).data,E.debug("admin.dashboard",{users:N.users,calendars:N.calendars})}catch(e){throw N=null,R=e instanceof Error?e.message:"Failed to load dashboard",e}finally{L=!1}}async function ua(){de=!0,X=null;try{te=(await A.adminUsers()).users??[],E.debug("admin.users",{count:te.length})}catch(e){throw te=[],X=e instanceof Error?e.message:"Failed to load users",e}finally{de=!1}}async function Tt(e){re=!0,Fe=null;try{const t=await A.adminUser(e);H=t.user,J=t.user.username,E.debug("admin.user",{username:t.user.username})}catch(t){throw H=null,Fe=t instanceof Error?t.message:"Failed to load user",t}finally{re=!1}}async function ma(e){Oa=!0;try{const[t,a]=await Promise.all([A.adminUserCalendars(e),A.adminUserAddressBooks(e)]);Ut=t.calendars??[],Ft=a.addressbooks??[]}catch(t){throw Ut=[],Ft=[],t}finally{Oa=!1}}async function is(){Xa=!0,Pa=null;try{aa=(await A.adminSystemSettings()).data}catch(e){throw aa=null,Pa=e instanceof Error?e.message:"Failed to load settings",e}finally{Xa=!1}}async function os(){Za=!0,Ua=null;try{const e=await A.adminDatabaseSettings();sa=e.data,na=(e.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(e){throw sa=null,Ua=e instanceof Error?e.message:"Failed to load database settings",e}finally{Za=!1}}async function Jn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),i=String(t.get("email")??"").trim(),m=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a||!r||!i||!m){g("error","Username, display name, email, and password are required"),p();return}if(m!==n){g("error","Password confirmation does not match"),p();return}c=!0,T(),p();try{const l=await A.adminCreateUser({username:a,displayname:r,email:i,password:m,passwordConfirm:n});E.event("admin.user.create",{username:l.user.username}),Ke=!1,J=l.user.username,H=l.user,yt("admin","users",l.user.username),await ua(),g("success",`Created user “${l.user.username}”`)}catch(l){g("error",l instanceof Error?l.message:"Create failed")}finally{c=!1,p()}}async function Yn(e){var u,b;if(!J)return;const t=J,a=new FormData(e),r=String(a.get("displayname")??"").trim(),i=String(a.get("description")??"").trim(),m=String(a.get("calendarcolor")??"").trim(),n=((u=e.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,l=((b=e.querySelector('input[name="notes"]'))==null?void 0:b.checked)??!1;c=!0,T(),p();try{if(tt==="create"){const y=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserCalendar(t,{uri:y,displayname:r,description:i,calendarcolor:m||void 0,todos:n,notes:l}),g("success",`Created calendar “${r}”`)}else{const y=Number(a.get("instanceId"));await A.adminUpdateUserCalendar(t,y,{displayname:r,description:i,calendarcolor:m,todos:n,notes:l}),g("success",`Updated calendar “${r}”`)}tt=null,ea=null,await ma(t),await Tt(t)}catch(y){g("error",y instanceof Error?y.message:"Save failed")}finally{c=!1,p()}}async function Kn(e){if(!J)return;const t=J,a=new FormData(e),r=String(a.get("displayname")??"").trim(),i=String(a.get("description")??"").trim();c=!0,T(),p();try{if(ut==="create"){const m=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserAddressBook(t,{uri:m,displayname:r,description:i}),g("success",`Created address book “${r}”`)}else{const m=Number(a.get("id"));await A.adminUpdateUserAddressBook(t,m,{displayname:r,description:i}),g("success",`Updated address book “${r}”`)}ut=null,ta=null,await ma(t),await Tt(t)}catch(m){g("error",m instanceof Error?m.message:"Save failed")}finally{c=!1,p()}}function ln(e){const t=new FormData(e),a=String(t.get("backend")??na).toLowerCase()==="pgsql"?"pgsql":"sqlite",r={backend:a};return a==="sqlite"?r.sqlite_file=String(t.get("sqlite_file")??"").trim():(r.pgsql_host=String(t.get("pgsql_host")??"").trim(),r.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),r.pgsql_username=String(t.get("pgsql_username")??"").trim(),r.pgsql_password=String(t.get("pgsql_password")??"")),r}function Gn(e){ka=ln(e),St="",wa=!0,T(),p()}async function Qn(e){if(e||(e=s.querySelector('[data-form="admin-database"]')),!e){g("error","Database form not found"),p();return}const t=ln(e);c=!0,T(),p();try{const a=await A.adminTestDatabaseConnection(t);g("success",a.message||"Connection successful"),E.event("admin.database.test",{backend:a.backend})}catch(a){g("error",a instanceof Error?a.message:"Connection test failed")}finally{c=!1,p()}}async function Xn(e){const t=new FormData(e),a=n=>{var l;return!!((l=e.querySelector(`input[name="${n}"]`))!=null&&l.checked)},r={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(t.get("timezone")??"").trim(),invite_from:String(t.get("invite_from")??"").trim(),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),files_storage_path:String(t.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(t.get("files_max_upload_mb")??0),files_quota_mb:Number(t.get("files_quota_mb")??0),files_quarantine_days:Number(t.get("files_quarantine_days")??0),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),portal_log_level:String(t.get("portal_log_level")??"off"),portal_admin_users:String(t.get("portal_admin_users")??"").trim(),push_external_url:String(t.get("push_external_url")??"").trim(),push_log_level:String(t.get("push_log_level")??"off")},i=String(t.get("admin_password")??""),m=String(t.get("admin_password_confirm")??"");(i!==""||m!=="")&&(r.admin_password=i,r.admin_password_confirm=m),c=!0,T(),p();try{aa=(await A.adminUpdateSystemSettings(r)).data,E.event("admin.settings.save"),g("success","System settings saved")}catch(n){g("error",n instanceof Error?n.message:"Save failed")}finally{c=!1,p()}}async function Zn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),i=String(t.get("email")??"").trim(),m=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a){g("error","Username is required"),p();return}if(!r||!i){g("error","Display name and email are required"),p();return}if(m!==""||n!==""){if(m===""||n===""){g("error","Password and confirmation are required to change password"),p();return}if(m!==n){g("error","Password confirmation does not match"),p();return}}c=!0,T(),p();try{const l={displayname:r,email:i};m!==""&&(l.password=m,l.passwordConfirm=n);const u=await A.adminUpdateUser(a,l);E.event("admin.user.update",{username:u.user.username,passwordChanged:m!==""}),Me=!1,H=u.user,J=u.user.username,await ua(),g("success",m!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(l){g("error",l instanceof Error?l.message:"Update failed")}finally{c=!1,p()}}async function on(e,t={}){if(e==="admin"&&(!xe()||!Rt())&&(xe()&&z&&!z.uiEnabled&&g("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),e="calendars"),e==="admin"){await rn(v||"overview",{...t,username:v==="users"?J:null});return}h=e,Re=!1,yt(e),E.event("tab",{tab:e}),e!=="calendars"&&(Se=!1,We=null),e!=="contacts"&&(st=null),t.clearFlash!==!1&&T(),c=!0,p();try{e==="contacts"&&W!==null?await Ht(W):e==="calendars"?await ot():e==="tasks"?await Wt():e==="notes"?await Ta():e==="files"&&await xt()}catch(a){E.warn("tab load failed",a instanceof Error?a.message:a),g("error",a instanceof Error?a.message:"Failed to load")}finally{c=!1,p()}}async function xt(){fa=!0;try{E.debug("loadFiles",{path:$e});const[e,t]=await Promise.all([A.filesStatus(),A.filesList($e).catch(a=>{if(a instanceof Ne&&(a.status===503||a.status===404))return{path:$e,entries:[]};throw a})]);if(Os=e,e.ready){$e=t.path,pe=t.entries;const a=new Set(pe.map(r=>r.path));be=be.filter(r=>a.has(r))}else pe=[],be=[];E.event("loadFiles",{path:$e,count:pe.length,enabled:e.enabled,ready:e.ready})}finally{fa=!1}}function ds(e,t){for(const a of t)if(a&&(e===a||e.startsWith(`${a}/`)))return!0;return!1}function Ct(){ve=null,qt="",lt={},bt=[]}async function cs(e,t){if(t.length===0)return;ve={op:e,paths:[...t]},qt=$e,lt={};const a=new Set([""]);if($e){const r=$e.split("/").filter(Boolean);let i="";for(const m of r)i=i?`${i}/${m}`:m,a.add(i)}bt=[...a],Le=null,Ce=null,Ze=!1,ye=!1,Xe(),T(),p(),await Promise.all([...a].map(r=>Ls(r)))}async function Ls(e){const t=lt[e];if(!(t&&t!=="error")){lt={...lt,[e]:"loading"},p();try{const r=(await A.filesList(e)).entries.filter(i=>i.type==="dir").slice().sort((i,m)=>i.name.localeCompare(m.name,void 0,{sensitivity:"base"}));if(!ve)return;lt={...lt,[e]:r}}catch(a){if(!ve)return;lt={...lt,[e]:"error"},E.warn("files.tree",{path:e||"/",error:a instanceof Error?a.message:String(a)})}p()}}function er(){if(!ve)return"";const e=ve.paths,t=[],a=(r,i)=>{const m=qt===r,n=ds(r,e),l=bt.includes(r),u=lt[r],b=Array.isArray(u),y=r===""||u==="loading"||u==="error"||!b||u.length>0,w=r===""?"Home":Ha(r),O=n?"Cannot use a selected item (or a folder inside it) as the destination":r===""?"File home root":r,x=l?"▾":"▸";if(t.push(`<div class="files-tree-row${m?" is-selected":""}${n?" is-blocked":""}" style="--depth:${i}" role="treeitem" aria-selected="${m}" aria-expanded="${l}" aria-disabled="${n}">
        ${y?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${o(r)}"
                aria-label="${l?"Collapse":"Expand"} ${o(w)}" ${c?"disabled":""}>${x}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
        <button type="button" class="files-tree-select${m?" is-selected":""}" data-action="files-tree-select" data-path="${o(r)}"
          title="${o(O)}" ${c||n?"disabled":""}>
          <span class="files-icon" aria-hidden="true">📁</span>
          <span class="files-tree-label">${o(w)}</span>
        </button>
      </div>`),!!l){if(u==="loading"){t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Loading…</div>`);return}if(u==="error"){t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Could not load folders.
            <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${o(r)}" ${c?"disabled":""}>Retry</button>
          </div>`);return}if(b){for(const C of u)a(C.path,i+1);u.length===0&&r===""&&t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">No subfolders yet — destination will be Home.</div>`)}}};return a("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${t.join("")}</div>`}function dn(e){if(!Ts){if(!d){_s();return}Ts=!0;try{E.event("session.expired"),rs(),ns=!0,f={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},p()}finally{Ts=!1}}}let Ue=[],Ea=[],Vt=[],Bt=[],us="",ms="",zt="due",_t="asc",Na="dtstart",pa="desc",Be=null,ft=null,G=null,ue=null,le=!1,_e=!1,De=[],Os=null,$e="",pe=[],fa=!1,Le=null,Ce=null,ve=null,qt="",lt={},bt=[],Ze=!1,be=[];function g(e,t){ns&&e==="error"||(e!=="error"&&(ns=!1),f={type:e,message:t})}function T(){f=null,ns=!1}function tr(e){const t=String(e.step||"");t==="upgrade"||t==="initialize"||t==="permissions"||t==="database"?(Ge={step:t,message:e.message||(t==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:e.installUrl||"/portal/install/",productVersion:e.productVersion,configuredVersion:e.configuredVersion??null},typeof e.productVersion=="string"&&e.productVersion.trim()!==""&&(ca=e.productVersion.trim())):Ge=null}function ar(e){if(!(e instanceof Ne)||e.status!==503)return!1;const t=typeof e.payload.code=="string"?e.payload.code:"";return t!=="upgrade_required"&&t!=="not_configured"&&t!=="admin_password_missing"?!1:(Ge={step:t==="upgrade_required"?"upgrade":"initialize",message:e.message,installUrl:typeof e.payload.installUrl=="string"?e.payload.installUrl:"/portal/install/",productVersion:typeof e.payload.productVersion=="string"?e.payload.productVersion:void 0,configuredVersion:typeof e.payload.configuredVersion=="string"?e.payload.configuredVersion:null},Ge.productVersion&&(ca=Ge.productVersion),!0)}async function sr(){var e,t,a,r;E.event("bootstrap.start"),Al(i=>{dn(/timed\s*out|session expired/i.test(i)?i:"Your session timed out. Please sign in again.")}),El(()=>{qs()});try{const i=await A.installStatus();tr(i)}catch(i){E.debug("bootstrap: /api/install/status failed",i instanceof Error?i.message:i)}try{const i=await A.ui();xs(i.ui),typeof i.version=="string"&&i.version.trim()!==""?ca=i.version.trim():i.ui&&typeof i.ui.version=="string"&&i.ui.version.trim()!==""&&(ca=i.ui.version.trim()),Ge==null||Ge.step}catch(i){E.debug("bootstrap: /api/ui failed",i instanceof Error?i.message:i),ar(i)}if(Ge&&Ge.step!=="done"&&Ge.step!=="locked"){rs(),E.event("bootstrap.installGate",{step:Ge.step}),p();return}try{const i=await A.me();if(d=i.user,xs(i.ui),typeof i.version=="string"&&i.version.trim()!==""&&(ca=i.version.trim()),E.event("bootstrap.session",{username:(d==null?void 0:d.username)??null}),qs(),xe())try{await Is()}catch(m){E.warn("admin.capabilities bootstrap",m instanceof Error?m.message:m)}if(nn(),yt(h,v),await it(),h==="admin"&&xe()&&Rt())try{v==="overview"&&((e=Je("overview"))==null?void 0:e.available)!==!1?await ls():v==="users"&&((t=Je("users"))==null?void 0:t.available)!==!1?(await ua(),J&&(await Tt(J),await ma(J))):v==="settings"&&((a=Je("settings"))==null?void 0:a.available)!==!1?await is():v==="database"&&((r=Je("database"))==null?void 0:r.available)!==!1&&await os()}catch(m){E.warn("admin bootstrap load",m instanceof Error?m.message:m)}}catch(i){i instanceof Ne&&i.status===401?(rs(),E.event("bootstrap.anonymous")):(E.error("bootstrap failed",i instanceof Error?i.message:i),g("error",i instanceof Error?i.message:"Failed to load"))}p()}async function it(){E.debug("loadHome");const[e,t,a]=await Promise.all([A.calendars(),A.directory().catch(()=>({users:[]})),A.addressbooks()]);if(ce=e.calendars,ra=t.users,Ve=a.addressbooks,E.event("loadHome",{calendars:ce.length,addressBooks:Ve.length,directory:ra.length}),es.length===0)try{es=(await A.holidayCountries()).countries}catch{es=[]}if(ae=ae.filter(r=>ce.some(i=>i.id===r)),j!==null&&!ce.some(r=>r.id===j)&&(j=null,la=[],Se=!1,We=null),ae.length===0){const r=cn();r?(ae=[r.id],j=r.id):ce.length>0&&(ae=[ce[0].id],j=ce[0].id)}j===null&&ae.length>0&&(j=ae[0]),j!==null&&Se?await Ba(j):j!==null&&(la=[]),h==="calendars"&&await ot(),W!==null&&!Ve.some(r=>r.id===W)&&(W=null,Nt=[],fe=null,I=null,he=!1),st!==null&&!Ve.some(r=>r.id===st)&&(st=null),W===null&&Ve.length>0&&(W=Ve[0].id),W!==null&&h==="contacts"&&await Ht(W),h==="tasks"&&await Wt(),h==="notes"&&await Ta(),h==="files"&&await xt()}async function Ba(e){la=(await A.shares(e)).shares}function cn(){const e=ce.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const r=a.uri.toLowerCase(),i=a.displayname.toLowerCase();return r==="default"||i==="default"||i==="default calendar"};return e.find(t)??e[0]??null}function we(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${r}`}function nr(e,t){const a=new Date(e,t,1),r=new Date(e,t+1,0);return{from:we(a),to:we(r)}}function Ps(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,r,i]=e.split("-").map(Number);return new Date(a,r-1,i)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,r,i]=e.slice(0,10).split("-").map(Number);return new Date(a,(r||1)-1,i||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function rr(e){const t=Ps(e.start);if(!e.end)return[we(t)];let a=Ps(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[we(t)];const r=[],i=new Date(t.getFullYear(),t.getMonth(),t.getDate()),m=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;i<=m&&n++<370;)r.push(we(i)),i.setDate(i.getDate()+1);return r.length?r:[we(t)]}function Us(e,t){const a=e.slice(0,10),r=(t||a).slice(0,10);if(a===r){const O=ja(a);return{start:O.start,end:O.end}}const[i,m,n]=a.split("-").map(Number),[l,u,b]=r.split("-").map(Number),y=jt(new Date(i,m-1,n,9,0,0,0)),w=jt(new Date(l,u-1,b,17,0,0,0));return{start:y,end:w}}function lr(e,t){const a=ba(e);let r=t?ba(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const i=new Date(t);if(!Number.isNaN(i.getTime())&&i.getHours()===0&&i.getMinutes()===0&&i.getTime()>new Date(e).getTime()){const m=Ps(t);m.setDate(m.getDate()-1),r=we(m)}}return{start:a,end:r}}async function ot(){const e=ae.filter(r=>ce.some(i=>i.id===r));if(e.length===0){ia=[];return}const{from:t,to:a}=nr(Mt.y,Mt.m);Ns=!0,E.debug("loadMonthEvents",{selectedIds:e,from:t,to:a});try{const i=(await Promise.all(e.map(async m=>(await A.calendarEvents(m,t,a)).events.map(l=>({...l,instanceId:m}))))).flat();i.sort((m,n)=>{const l=m.start||"",u=n.start||"";return l!==u?l<u?-1:1:(m.summary||"").localeCompare(n.summary||"")}),ia=i,E.event("monthEvents.loaded",{calendarIds:e,count:ia.length,from:t,to:a})}catch(r){ia=[],E.warn("loadMonthEvents failed",r instanceof Error?r.message:r)}finally{Ns=!1}}function ir(e){const t=ce.find(a=>a.id===e);return t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6"}function or(e){ae.includes(e)?(ae=ae.filter(t=>t!==e),j===e&&(j=ae[0]??null)):(ae=[...ae,e],j=e)}function dr(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function cr(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Fs())} ${t}`}function ur(){const e=ce.filter($=>ae.includes($.id)),t=e.length===0?"No calendar selected":e.length===1?e[0].displayname:`${e.length} calendars`,a=Mt.y,r=Mt.m,i=new Date(a,r,1),m=Ms(),n=(i.getDay()-m+7)%7,l=new Date(a,r+1,0).getDate(),u=new Date(a,r,0).getDate(),y=we(new Date),w=un(),O=new Map;for(const $ of ia)for(const B of rr($)){const U=O.get(B)??[];U.push($),O.set(B,U)}const x=[],C=Math.ceil((n+l)/7)*7;for(let $=0;$<C;$++){let B,U=!0,Y;$<n?(B=u-n+$+1,U=!1,Y=new Date(a,r-1,B)):$>=n+l?(B=$-(n+l)+1,U=!1,Y=new Date(a,r+1,B)):(B=$-n+1,Y=new Date(a,r,B));const Z=we(Y),ne=Z===y,ie=U?O.get(Z)??[]:[],Oe=Fa===Z?50:3,ze=ie.slice(0,Oe),It=ie.length-ze.length,Ye=ze.map(ee=>{var me;const P=ee.instanceId,je=cr(ee),ke=ir(P),et=((me=ce.find(dt=>dt.id===P))==null?void 0:me.displayname)||"",S=et?`${je} · ${et}`:je;return`<button type="button" class="month-event${ee.allDay?"":" is-timed"}" title="${o(S)}" style="--ev-color:${o(ke)}"
            data-action="open-event" data-instance="${P}" data-uri="${o(ee.uri)}" ${c?"disabled":""}>${o(je)}</button>`}).join(""),Gt=It>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${o(Z)}" title="Show all events this day" ${c?"disabled":""}>+${It} more</button>`:"",Qt=!U&&(B===1||$===n+l)?Y.toLocaleString(void 0,{month:"short",day:"numeric"}):String(B),ht=j!==null?ce.find(ee=>ee.id===j)??null:null,D=!!(ht&&!ht.readOnly&&(ht.canShare||ht.access==="readwrite"));x.push(`<div class="month-cell${U?"":" is-outside"}${ne?" is-today":""}${D?" is-clickable":""}"${D?` data-action="new-event-day" data-day="${o(Z)}" role="button" tabindex="0" title="Add event on ${o(Z)}"`:""}>
        <div class="month-daynum${ne?" is-today-num":""}">${o(Qt)}</div>
        <div class="month-events">${Ye}${Gt}</div>
      </div>`)}const _=e.length===0?ce.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":Ns?'<p class="muted small month-empty-hint">Loading events…</p>':"",Q=e.slice(0,6).map($=>{const B=$.color&&$.color.length>=7?$.color.slice(0,7):$.color||"#3B82F6";return`<span class="cal-swatch" style="background:${o(B)};margin-top:0" title="${o($.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${c?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${c?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${c?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${o(dr(a,r))}</h2>
        <span class="month-cal-name muted small" title="${o(t)}">
          ${Q}
          ${o(t)}
        </span>
      </div>
      ${_}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${w.map($=>`<div class="month-dow">${o($)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${x.join("")}
        </div>
      </div>
    </section>`}function ba(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):we(t)}function mr(){if(Ca.timeFormat==="24h")return!1;if(Ca.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Fs(){return mr()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Ms(){var a;if(Ca.weekStart==="monday")return 1;if(Ca.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const r of e)try{const i=new Intl.Locale(r),m=typeof i.getWeekInfo=="function"?i.getWeekInfo():i.weekInfo,n=m==null?void 0:m.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function un(){const e=Ms(),t=new Date(2024,0,7+e),a=[];for(let r=0;r<7;r++){const i=new Date(t);i.setDate(t.getDate()+r),a.push(i.toLocaleDateString(void 0,{weekday:"short"}))}return a}function mn(e,t=15){const a=t*60*1e3,r=e.getTime();return r%a===0?new Date(r):new Date(Math.ceil(r/a)*a)}function jt(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function pr(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const r=e.slice(0,10),[i,m,n]=r.split("-").map(Number);return new Date(i,m-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Fs()})}function za(e){if(!e){const a=mn(new Date);return{date:we(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:we(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function ja(e){const t=new Date,a=we(t);if(e&&e!==a){const[m,n,l]=e.split("-").map(Number),u=new Date(m,n-1,l,9,0,0,0),b=new Date(m,n-1,l,10,0,0,0);return{start:jt(u),end:jt(b)}}const r=mn(t,15),i=new Date(r.getTime()+3600*1e3);return{start:jt(r),end:jt(i)}}function fr(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function ga(e){const{field:t,name:a,label:r,value:i,dateOnly:m=!1,required:n,disabled:l,allowClear:u=!0}=e,b=(F==null?void 0:F.field)===t,y=pr(i,m);return`<div class="dt-field${b?" is-open":""}" data-dt-id="${o(t)}">
      <span class="dt-field-label">${o(r)}</span>
      <input type="hidden" name="${o(a)}" value="${o(i)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${o(t)}"
        data-dt-name="${o(a)}" data-dt-date-only="${m?"1":"0"}" data-dt-clear="${u?"1":"0"}"
        ${l?"disabled":""} aria-expanded="${b}">
        <span class="dt-trigger-text">${o(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${b&&!l?br(t,i,m,u):""}
    </div>`}function Rs(e){var t;return e==="start"?String((k==null?void 0:k.start)||""):e==="end"?String((k==null?void 0:k.end)||""):e==="until"?((t=k==null?void 0:k.repeat)==null?void 0:t.until)||ba(k==null?void 0:k.start)||we(new Date):e==="due"?xa(G==null?void 0:G.due):e==="dtstart"?xa(ue==null?void 0:ue.dtstart):e==="bulk-due"?ts:e==="birthday"?String((I==null?void 0:I.birthday)||""):""}function gt(e,t){if(e==="start"&&k){k={...k,start:t||""};return}if(e==="end"&&k){k={...k,end:t};return}if(e==="until"&&k){k={...k,repeat:{...k.repeat??ps(),until:t,endMode:"until"}};return}if(e==="due"&&G){if(t===null||t==="")G={...G,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))G={...G,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));G={...G,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&ue){if(t===null||t==="")ue={...ue,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))ue={...ue,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));ue={...ue,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&I){I={...I,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(ts=t||"")}function br(e,t,a,r){const i=za(t),m=(F==null?void 0:F.viewY)??Number(i.date.slice(0,4)),n=(F==null?void 0:F.viewM)??Number(i.date.slice(5,7))-1,l=Ms(),u=un(),y=(new Date(m,n,1).getDay()-l+7)%7,w=new Date(m,n+1,0).getDate(),O=new Date(m,n,0).getDate(),x=i.date,C=i.hm,_=new Date(m,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),Q=[],$=Math.ceil((y+w)/7)*7;for(let U=0;U<$;U++){let Y,Z,ne=!1;U<y?(Y=O-y+U+1,Z=new Date(m,n-1,Y),ne=!0):U>=y+w?(Y=U-(y+w)+1,Z=new Date(m,n+1,Y),ne=!0):(Y=U-y+1,Z=new Date(m,n,Y));const ie=we(Z),Oe=ie===x,ze=ie===we(new Date);Q.push(`<button type="button" class="dt-day${ne?" is-outside":""}${Oe?" is-selected":""}${ze?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${o(ie)}">${Y}</button>`)}const B=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${fr().map(U=>{const Y=(()=>{const[Z,ne]=U.split(":").map(Number);return new Date(2e3,0,1,Z,ne).toLocaleTimeString(void 0,Fs())})();return`<button type="button" class="dt-time${U===C?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${U}" role="option" aria-selected="${U===C}">${o(Y)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${o(_)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(U=>`<span class="dt-dow">${o(U)}</span>`).join("")}</div>
          <div class="dt-days">${Q.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${o(e)}" ${r?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${B}
      </div>
    </div>`}function gr(){s.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const r=t.getBoundingClientRect(),i=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const m=a.offsetWidth||320,n=a.offsetHeight||300;let l=r.bottom+6;l+n>window.innerHeight-i&&(l=Math.max(i,r.top-n-6));let u=r.left;u+m>window.innerWidth-i&&(u=Math.max(i,window.innerWidth-m-i)),u<i&&(u=i),a.style.top=`${Math.round(l)}px`,a.style.left=`${Math.round(u)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function ps(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function hr(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function yr(){if(!Dt||!k)return"";const e=k,t=e.repeat??ps(),a=(t.freq||"").toUpperCase(),r=ce.filter(x=>x.canShare||x.access==="readwrite"),i=ce.filter(x=>x.id===e.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===e.instanceId?"selected":""}>${o(x.displayname)}</option>`).join(""),m=e.readOnly||!e.canWrite;let n,l;if(e.allDay)n=ba(e.start),l=ba(e.end);else{const x=e.start||"",C=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const _=Us(x,C||null);n=_.start,l=_.end||""}else n=xa(e.start),l=xa(e.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],b=new Set((t.byDay||[]).map(x=>x.toUpperCase())),y=hr(t),w=!!a&&y==="until",O=t.until||(y==="until"?ba(e.start)||we(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${mt?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Yt()}
          ${!mt&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${m?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${m||r.length===0?"disabled":""}>
                ${i||`<option value="${e.instanceId}">${o(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${o(e.summary)}" ${m?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${o(e.location)}" ${m?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${m?"readonly":""}>${o(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${m?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${ga({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:m,allowClear:!1})}
              ${ga({field:"end",name:"end",label:"End",value:l,dateOnly:e.allDay,disabled:m||w,allowClear:!w})}
            </div>
            <fieldset class="event-repeat" ${m?"disabled":""}>
              <legend class="event-repeat-legend">Repeat</legend>
              <div class="form-grid form-grid-2">
                <label>Frequency
                  <select name="repeatFreq" data-action="event-repeat-freq">
                    <option value="" ${a?"":"selected"}>Does not repeat</option>
                    <option value="DAILY" ${a==="DAILY"?"selected":""}>Daily</option>
                    <option value="WEEKLY" ${a==="WEEKLY"?"selected":""}>Weekly</option>
                    <option value="MONTHLY" ${a==="MONTHLY"?"selected":""}>Monthly</option>
                    <option value="YEARLY" ${a==="YEARLY"?"selected":""}>Yearly</option>
                  </select>
                </label>
                <label>Every
                  <input type="number" name="repeatInterval" min="1" max="99" value="${o(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${u.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${b.has(x.code)?"checked":""} />
                              ${x.label}
                            </label>`).join("")}
                    </div>`:""}
              ${a?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${y==="never"?"selected":""}>Never</option>
                          <option value="until" ${y==="until"?"selected":""}>On date</option>
                          <option value="count" ${y==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${y==="until"?ga({field:"until",name:"repeatUntil",label:"Until",value:O,dateOnly:!0,disabled:m,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${o(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${m?"":`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${mt?"Create event":"Save event"}</button>
                     ${mt?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${c?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function $r(e,t){const a=ce.find(r=>r.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:ps(),readOnly:!1,canWrite:!0}}async function Ht(e){Nt=(await A.contacts(e,oa)).contacts,fe!==null&&!Nt.some(a=>a.uri===fe)&&(fe=null,he||(I=null,Pe=null,Qe=null,nt=!1))}async function Wt(){const e=await A.tasks({q:us,sort:zt,order:_t});Ue=e.tasks,Vt=e.calendars;const t=new Set(Ue.map(a=>ge(a.instanceId,a.uri)));De=De.filter(a=>t.has(a)),Be!==null&&!Ue.some(a=>`${a.instanceId}|${a.uri}`===Be)&&(Be=null,le||(G=null))}async function Ta(){const e=await A.notes({q:ms,sort:Na,order:pa});Ea=e.notes,Bt=e.calendars,ft!==null&&!Ea.some(t=>`${t.instanceId}|${t.uri}`===ft)&&(ft=null,_e||(ue=null))}function ge(e,t){return`${e}|${t}`}function pn(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function xa(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=r=>String(r).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Jt(e,t,a,r,i,m=""){const n=a===t,l=n?r==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${m?" "+m:""}`}" data-action="sort-${i}" data-sort="${o(t)}" role="columnheader" tabindex="0">${o(e)}${l}</th>`}async function vr(e){if(W===null)return;const t=await A.getContact(W,e);fe=e,he=!1;const a=t.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??fn(),birthday:a.birthday??null},Pe=a.photoDataUri??(a.hasPhoto&&W!==null?`${A.contactPhotoUrl(W,e)}?t=${Date.now()}`:null),Qe=null,nt=!1,Ie=!0}function wr(){he=!0,fe=null,Ie=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Pe=null,Qe=null,nt=!1}function fn(){return{street:"",city:"",region:"",postal:"",country:""}}function kr(e){return new Promise((t,a)=>{const r=new FileReader;r.onload=()=>{const i=String(r.result??""),m=i.indexOf(",");t(m>=0?i.slice(m+1):i)},r.onerror=()=>a(new Error("Failed to read photo file")),r.readAsDataURL(e)})}function bn(e,t={}){const a=!!d&&h==="admin"&&xe()&&Rt(),m=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${o(a?"Administration Portal":"User Portal")}</span></span>`,n=d?o(d.displayname||d.username):"",l=Rt()?`<button type="button" class="user-menu-item${h==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",b=d?`<div class="user-menu${Re?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${Re?"true":"false"}"
              title="${n}">
              <span class="user-menu-name">${n}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${Re?"":"hidden"}>
              ${a?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:""}
              ${l}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",y=d?`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
          <div class="topnav-right">
            ${b}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
        </nav>`,O=!(Se||He||We!==null||st!==null||Dt||Ie||pt)?Yt():"",x=t.tabs&&t.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${t.tabs}
        </div>
      </div>`:"",C=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${o(ca)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${o(Ml)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${y}
      ${x}
    </div>
      <main class="container">
        ${O}
        ${e}
      </main>
      ${C}
      ${jl()}
      ${Sr()}
      ${Cr()}`}function Yt(){return f?Lt(f.type,f.message,{dismissible:!0}):""}function fs(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function At(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),r=t%60;return a>0?`${a}m ${r}s`:`${r}s`}function Et(){as!==null&&(clearInterval(as),as=null)}function gn(){Et(),as=setInterval(()=>{if(!K||K.phase==="done"||K.phase==="error"){Et();return}K={...K,elapsedSec:Math.floor((Date.now()-K.startedAt)/1e3)},K.phase==="processing"&&$n(K)},1e3)}function Kt(e,t={}){K&&(K={...K,phase:e,elapsedSec:Math.floor((Date.now()-K.startedAt)/1e3),...t},p())}function hn(){Et(),K=null,p()}function yn(e){!K||K.phase==="done"||K.phase==="error"||(K={...K,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-K.startedAt)/1e3)},$n(K))}function $n(e){const t=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),r=s.querySelector(".import-progress-track"),i=s.querySelector("[data-import-counts]"),m=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${m} (${e.processPercent??0}%) · ${At(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${At(e.elapsedSec)}`;else return;t&&(t.textContent=n),i&&(i.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),r&&e.processPercent!==null&&(r.setAttribute("aria-valuenow",String(e.processPercent)),r.removeAttribute("aria-valuetext"))}function Sr(){if(!K)return"";const e=K,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",r=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",i=(()=>{const l=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],b={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return l.map((y,w)=>{let O="pending";return e.phase==="done"||w<b?O="done":w===b&&(O=(e.phase==="error","active")),`<li class="import-step import-step-${O}"><span class="import-step-icon" aria-hidden="true">${O==="done"?"✓":O==="active"?"●":"○"}</span> ${o(y.label)}</li>`}).join("")})();let m="";if(t){let l=null;e.phase==="reading"&&e.readPercent!==null?l=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(l=Math.min(100,Math.max(0,e.processPercent)));const u=l===null?"import-progress-bar is-indeterminate":"import-progress-bar",b=l!==null?` style="width:${l}%"`:"",y=e.kind==="calendar"?"items":"contacts";let w;e.phase==="reading"?w=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?w="Uploading to server…":e.processTotal>0?w=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${y} (${e.processPercent??0}%) · ${At(e.elapsedSec)}`:w=`Importing on server… ${At(e.elapsedSec)}`;const O=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';m=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${o(a)}</strong> from
          <span class="mono">${o(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${o(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${i}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${l!==null?`aria-valuenow="${l}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${u}"${b}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${o(w)}</p>
        ${O}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?m=`
        ${Lt("success",`Success. ${e.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${o(e.fileName)}</span>
          · Took ${o(At(e.elapsedSec))}
        </p>`:m=`
        ${Lt("error",`Failed. ${e.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${o(e.fileName)}</span>
          · After ${o(At(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':Ks([{label:"Close",action:"close-import-progress",variant:"primary"}]);return Ae({title:r,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:t,lockBackdrop:t,body:m,footer:n})}function _a(){ss!==null&&(clearInterval(ss),ss=null)}function Dr(){_a(),ss=setInterval(()=>{if(!V||V.phase==="done"||V.phase==="error"){_a();return}V={...V,elapsedSec:Math.floor((Date.now()-V.startedAt)/1e3)},qa(V)},1e3)}function vn(){_a(),V=null,p()}function wn(e){return e.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*e.bytesSent/e.bytesTotal))):e.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*e.completedFiles/e.totalFiles))):null}function qa(e){if(!s.querySelector("[data-files-upload-progress]"))return;const t=s.querySelector(".files-upload-progress-bar"),a=s.querySelector(".files-upload-progress-track"),r=s.querySelector("[data-files-upload-status]"),i=s.querySelector("[data-files-upload-current]"),m=wn(e),n=e.phase==="uploading"?`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${m!==null?` (${m}%)`:""} · ${At(e.elapsedSec)}`:(r==null?void 0:r.textContent)||"";r&&e.phase==="uploading"&&(r.textContent=n),i&&e.phase==="uploading"&&(i.textContent=e.currentName||"",i.title=e.currentName||""),t&&m!==null&&(t.classList.remove("is-indeterminate"),t.style.width=`${m}%`),a&&m!==null&&(a.setAttribute("aria-valuenow",String(m)),a.removeAttribute("aria-valuetext"))}function Cr(){if(!V)return"";const e=V,t=e.phase==="uploading",a=e.phase==="done"?"Upload finished":e.phase==="error"?"Upload failed":"Uploading…",r=wn(e),i=r===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",m=r!==null?` style="width:${r}%"`:"";let n="";if(t){const u=`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${At(e.elapsedSec)}`,b=e.bytesTotal>0?`${fs(e.bytesSent)} / ${fs(e.bytesTotal)}`:"";n=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Uploading to
          <span class="mono">${o($e===""?"Home":$e)}</span>
          ${b?` · <span class="muted">${o(b)}</span>`:""}
        </p>
        <div class="import-progress-track files-upload-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Upload progress">
          <div class="${i}"${m}></div>
        </div>
        <p class="import-status-line" data-files-upload-status>${o(u)}</p>
        <p class="muted small mono files-upload-current" data-files-upload-current title="${o(e.currentName)}">${o(e.currentName)}</p>
        <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(e.phase==="done")n=`
        ${Lt("success",e.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">Took ${o(At(e.elapsedSec))}</p>`;else{const u=e.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${e.errorSamples.slice(0,8).map(b=>`<li>${o(b)}</li>`).join("")}${e.errorSamples.length>8?`<li>…and ${e.errorSamples.length-8} more</li>`:""}</ul>`:"";n=`
        ${Lt("error",e.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
        ${u}
        <p class="muted small" style="margin:0.75rem 0 0">After ${o(At(e.elapsedSec))}</p>`}const l=t?'<p class="muted small" style="margin:0">Please wait…</p>':Ks([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return Ae({title:a,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:t,lockBackdrop:t,body:n,footer:l})}function kn(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}async function Sn(e,t,a){const r=t.replace(/\\/g,"/").split("/").map(m=>m.trim()).filter(Boolean);let i=e;for(const m of r){const n=kn(i,m);if(a.has(n)){i=n;continue}try{await A.filesMkdir(i,m),E.event("files.mkdir",{path:i,name:m,via:"upload-folder"})}catch(l){if(!(l instanceof Ne&&l.status===409))throw l}a.add(n),i=n}}function Dn(e,t){return new Promise((a,r)=>{const i=new FileReader;i.onprogress=m=>{m.lengthComputable&&m.total>0?t(Math.min(100,Math.round(m.loaded/m.total*100))):t(null)},i.onload=()=>a(String(i.result??"")),i.onerror=()=>r(i.error??new Error("Failed to read file")),i.readAsText(e)})}function Cn(){const e=Ge,t=e&&(e.step==="upgrade"||e.step==="initialize"||e.step==="permissions"||e.step==="database"),a=(e==null?void 0:e.installUrl)||"/portal/install/";let r="";if(t&&e){const m=e.step==="upgrade"?"Server upgrade required":"Setup incomplete",n=e.step==="upgrade"&&(e.configuredVersion||e.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${o(String(e.configuredVersion||"—"))}</span>
              → product <span class="mono">${o(String(e.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${o(m)}.</strong>
            ${o(e.message||"Complete the installer before signing in.")}
            ${n}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${o(a)}">Open installer</a>
        </p>`}const i=c||!!t;s.innerHTML=bn(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials (not the admin password).</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${i?"disabled":""} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${i?"disabled":""} />
            </label>
            <button type="submit" class="btn btn-primary" ${i?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function Ar(){if(!d){Cn();return}const e=ce.filter(S=>S.canShare),t=ce.filter(S=>!S.canShare),a=ce.find(S=>S.id===j)??null,r=e.map(S=>{const me=ae.includes(S.id),dt=me?" is-selected":"",Ka=S.id===j?" is-primary":"",zs=S.color?`<span class="cal-swatch" style="background:${o(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',js=Ws(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${o(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${dt}${Ka}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${me?"checked":""} ${c?"disabled":""} />
          </label>
          ${zs}
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="cal-row-badges">${js}</span>
            <span class="muted small mono cal-row-uri">${o(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${c?"disabled":""} title="Export as .ics">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${c?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),i=t.map(S=>{const me=ae.includes(S.id),dt=me?" is-selected":"",Ka=S.id===j?" is-primary":"",zs=S.color?`<span class="cal-swatch" style="background:${o(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',js=S.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${dt}${Ka}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${o(js)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${me?"checked":""} ${c?"disabled":""} />
          </label>
          ${zs}
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="cal-row-badges">${Ws(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${c?"disabled":""} title="Export as .ics">Export</button>
          </span>
        </div>`}).join(""),m=ra.map(S=>`<option value="${o(S.username)}">${o(S.displayname)} (${o(S.username)})</option>`).join(""),n=la.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':la.map(S=>`<tr>
                <td>
                  <strong>${o(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${o(S.username||S.href)}</div>
                </td>
                <td>${Ws(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${o(S.href)}" ${c?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),l=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",u=!!(a&&a.readOnly),b=Se&&a&&a.canShare?Ae({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Yt()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${o(a.uri)}
                    <button type="button" class="info-btn" data-action="info" data-info="calendar-details"
                      aria-label="About calendar details" title="About calendar details"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                    <label>
                      Display name
                      <input type="text" name="displayname" required maxlength="200"
                        value="${o(a.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${o(l)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${o(a.color||l)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${o(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${o(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${Ee(`Share “${a.displayname}”`,"share")}
                  ${u?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${ra.length===0?"disabled":""}>
                        <option value="">${ra.length?"Select user…":"No other users"}</option>
                        ${m}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${u?"disabled":""}>
                        <option value="read" selected>Read only</option>
                        ${u?"":'<option value="readwrite">Full access</option>'}
                      </select>
                      ${u?'<input type="hidden" name="access" value="read" />':""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${c||ra.length===0?"disabled":""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${n}</tbody>
                    </table>
                  </div>
                </section>
                <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${Ee("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${c?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${c||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${c||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",y=We!==null?ce.find(S=>S.id===We&&S.canShare)??null:null,w=y?Ae({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Yt()}
              <p>You are about to permanently delete <strong>${o(y.displayname)}</strong>
                <span class="muted small mono">(${o(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${$s({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:c},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${y.id}"`}]}):"",O=He?Ae({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Yt()}
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a personal calendar, optional holidays feed, or a read-only calendar.
                <button type="button" class="info-btn" data-action="info" data-info="add-calendar"
                  aria-label="About add calendar" title="About add calendar"
                  style="vertical-align:middle;margin-left:0.25rem">
                  <span aria-hidden="true">i</span>
                </button>
              </p>
              <form class="stack" data-form="create-cal">
                <label>
                  Display name
                  <input type="text" name="displayname" id="create-displayname" maxlength="200" placeholder="Work" autocomplete="off" />
                </label>
                <label>
                  Color
                  <span class="color-field">
                    <input type="color" name="color_picker" value="#3B82F6" aria-label="New calendar color" />
                    <input type="text" name="color" class="mono" maxlength="9" value="#3B82F6" placeholder="#3B82F6" />
                  </span>
                </label>
                <label>
                  Description
                  <textarea name="description" rows="2" maxlength="2000" placeholder="Optional"></textarea>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="holidays" data-action="toggle-holidays" />
                  Holidays calendar
                </label>
                <label class="holidays-country" id="holidays-country-wrap" hidden>
                  Country
                  <select name="holidayCountry" id="holiday-country">
                    <option value="">Select country…</option>
                    ${es.map(S=>`<option value="${o(S.code)}">${o(S.name)} (${o(S.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create calendar</button>
                  <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${c?"disabled":""} hidden />
                  </label>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${c?"disabled":""}>Cancel</button>
                </div>
                <p class="muted small" style="margin:0.5rem 0 0">
                  <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
                </p>
              </form>`}):"",x=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${Ee("Owned","owned")}
            </div>
            <p class="muted small" style="margin:0 0 0.65rem">
              Check one or more calendars to view events.
              Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${r||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${Ee("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${i}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${c?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${ur()}
      </div>
      ${O}
      ${b}
      ${w}
      ${yr()}`,C=Ve.map(S=>`<div class="cal-row${S.id===W?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="muted small">${S.cardCount} contact${S.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${o(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-ab" data-id="${S.id}" ${c?"disabled":""} title="Export as .vcf">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${S.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${S.id}" ${c?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),_=Ve.find(S=>S.id===W)??null,Q=Nt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${oa?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Nt.map(S=>{const me=!he&&S.uri===fe?" is-selected":"",dt=o((S.displayname||"?").slice(0,1).toUpperCase()),Ka=S.hasPhoto&&W!==null?`<img class="contact-avatar" src="${o(A.contactPhotoUrl(W,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${dt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${dt}</span>`;return`<tr class="contact-table-row${me}" data-action="select-contact" data-uri="${o(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ka}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${o(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${o(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${o(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${o(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${o(S.org||"—")}</span></td>
              </tr>`}).join(""),$=I,B=Array.isArray($==null?void 0:$.emails)&&$.emails.length>0?$.emails:[""],U=Array.isArray($==null?void 0:$.phones)&&$.phones.length>0?$.phones:[{type:"cell",value:""}],Y=($==null?void 0:$.address)??fn(),Z=B.map((S,me)=>`<div class="multi-row" data-multi="email" data-idx="${me}">
          <input type="email" name="email_${me}" value="${o(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${me}" ${B.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ne=U.map((S,me)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${me}">
          <select name="phone_type_${me}" aria-label="Phone type">
            ${["cell","work","home","other"].map(dt=>`<option value="${dt}" ${((S==null?void 0:S.type)??"other")===dt?"selected":""}>${dt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${me}" value="${o((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${me}" ${U.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ie=Array.isArray($==null?void 0:$.custom)?$.custom:[],Oe=ie.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ie.map((S,me)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${me}">
                <input type="text" name="custom_label_${me}" value="${o(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${me}" value="${o(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${me}" title="Remove">×</button>
              </div>`).join(""),ze=Ie&&$&&_?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${he?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Yt()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${Pe?`<img src="${o(Pe)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${o(($.fullname||$.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                        ${Pe?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${c?"disabled":""} hidden />
                      </label>
                      ${Pe||$.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${c?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${o($.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${o($.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${o($.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${o($.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${o($.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${Z}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${B.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${ne}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${U.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${o(Y.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${o(Y.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${o(Y.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${o(Y.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${o(Y.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${o($.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${ga({field:"birthday",name:"birthday",label:"Birthday",value:$.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${Oe}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ie.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${o($.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${c?"disabled":""}>${he?"Create contact":"Save contact"}</button>
                    ${!he&&$.uri?`<button type="button" class="btn" data-action="export-contact" ${c?"disabled":""}>Export .vcf</button>`:""}
                    ${he?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${c?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${c?"disabled":""}>Cancel</button>
                    ${!he&&$.uri?`<span class="muted small mono">${o($.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",It=pt&&_?Ae({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Yt()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${o(_.uri)} · ${_.cardCount} contact${_.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${o(_.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${o(_.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${o(_.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${Ee("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${c?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${c?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",Ye=st!==null?Ve.find(S=>S.id===st)??null:null,Gt=Ye?Ae({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Yt()}
              <p>You are about to permanently delete <strong>${o(Ye.displayname)}</strong>
                <span class="muted small mono">(${o(Ye.uri)})</span>.</p>
              <p class="muted small">${(Ye.cardCount??0)>0?`All ${Ye.cardCount} contact${Ye.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${$s({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:c},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${Ye.id}"`}]}):"",Qt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${Ee("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${C||'<p class="muted">No address books yet. Create one below.</p>'}
            </div>
            <div class="contacts-sidebar-create">
              <h3 class="h3-inline">Add address book</h3>
              <form class="stack stack-tight" data-form="create-ab" style="margin-top:0.5rem">
                <label>Display name
                  <input type="text" name="displayname" required maxlength="200" placeholder="Personal" autocomplete="off" />
                </label>
                <label>Description
                  <input type="text" name="description" maxlength="2000" placeholder="Optional" />
                </label>
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${_?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${Ee("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${o(oa)}" aria-label="Search contacts" ${c?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${c?"disabled":""}>Add contact</button>
                    </div>
                  </div>
                  <div class="contacts-table-wrap contacts-table-wrap-tall">
                    <table class="contacts-table">
                      <thead>
                        <tr>
                          <th class="contact-col-name">Name</th>
                          <th class="contact-col-email">Email</th>
                          <th class="contact-col-phone">Phone</th>
                          <th class="contact-col-org hide-sm">Organization</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Q}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Gt}
      ${It}
      ${ze}`,ht=h==="calendars"?"my-calendars":h==="contacts"?"my-contacts":h==="tasks"?"tasks":h==="notes"?"notes":h==="files"?"files":"administration",D=Wr(),ee=Jr(),P=Tr(),je=Br(),ke=h==="calendars"?x:h==="contacts"?Qt:h==="tasks"?D:h==="notes"?ee:h==="files"?P:je,et=h==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${xr()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${v==="overview"?"admin-overview":v==="users"?"admin-users":v==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${h==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${h==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${h==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${h==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${h==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${h==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${h==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${h==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${h==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${h==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${ht}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;s.innerHTML=bn(ke,{tabs:et}),document.body.classList.toggle("cal-modal-open",Se||He||We!==null||st!==null||Dt||Ie||pt||K!==null||V!==null||Le!==null||Ce!==null||ve!==null||Ze||Ke||Me||wt!==null||va||wa||tt!==null||ut!==null||Te!==null),document.body.classList.toggle("layout-contacts",h==="contacts"),document.body.classList.toggle("layout-calendars",h==="calendars"),document.body.classList.toggle("layout-tasks",h==="tasks"||h==="notes"),document.body.classList.toggle("layout-files",h==="files"),document.body.classList.toggle("layout-admin",h==="admin")}function Er(e){const t=e?e.split("/").filter(Boolean):[];let a="";const r=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${c?"disabled":""}>Home</button>`];for(const i of t){a=a?`${a}/${i}`:i;const m=a;r.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),r.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${o(m)}" ${c?"disabled":""}>${o(i)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${r.join("")}</nav>`}function Ia(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Nr(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function Tr(){const e=Os;if(!e)return`<div class="card"><p class="muted">${fa||c?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${Ee("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${Ee("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${o(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${o(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${Ia(e.usedBytes)} used · ${Ia(e.availableBytes)} free of ${Ia(e.quotaBytes)}`:`${Ia(e.usedBytes)} used · ${Ia(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,r=be.length,i=pe.length>0&&pe.every($=>be.includes($.path)),m=r>0,n=pe.filter($=>$.type==="dir").length,l=pe.length-n,u=r>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${r} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${c?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${c?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${c?"disabled":""}>Delete</button>
            </div>
          </div>`:"",b=(()=>{if(fa&&pe.length===0)return"Loading…";if(pe.length===0)return"0 items";const $=[];n>0&&$.push(`${n} folder${n===1?"":"s"}`),l>0&&$.push(`${l} file${l===1?"":"s"}`);const B=`${pe.length} item${pe.length===1?"":"s"}`;return $.length===2?`${B} · ${$.join(", ")}`:$[0]??B})(),y=pe.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':pe.map($=>{const B=be.includes($.path),U=$.type==="dir"?"📁":"📄",Y=$.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${o($.path)}" ${c?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${U}</span>${o($.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${U}</span>${o($.name)}</span>`,Z=$.type==="dir"?"—":Ia($.size);return`<tr class="files-row${B?" is-checked":""}" data-path="${o($.path)}" data-type="${$.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${o($.path)}"
                    ${B?"checked":""} ${c?"disabled":""}
                    aria-label="Select ${o($.name)}" />
                </td>
                <td class="files-col-name">${Y}</td>
                <td class="files-col-size mono">${Z}</td>
                <td class="files-col-mtime hide-sm">${o(Nr($.mtime))}</td>
                <td class="files-col-actions">
                  ${$.type==="file"?`<a class="btn btn-ghost btn-small" href="${o(A.filesDownloadUrl($.path))}" download="${o($.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${o($.path)}" ${c?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${o($.path)}" ${c?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${o($.path)}" data-name="${o($.name)}" ${c?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${o($.path)}" data-name="${o($.name)}" ${c?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),w=Le!==null?(()=>{const $=pe.find(U=>U.path===Le),B=($==null?void 0:$.name)??"";return Ae({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${o(Le)}" />
                    <label>New name
                      <input type="text" name="newName" value="${o(B)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:c}]})})():"",O=Ce!==null&&Ce.length>0?(()=>{const $=Ce,B=$.length>1,U=pe.find(ne=>ne.path===$[0]),Y=B?`Delete ${$.length} items`:`Delete ${(U==null?void 0:U.type)==="dir"?"folder":"file"}`,Z=B?`<p style="margin:0 0 0.75rem">Delete <strong>${$.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${$.slice(0,12).map(ne=>{const ie=pe.find(Oe=>Oe.path===ne);return`<li><span class="mono">${o((ie==null?void 0:ie.name)??ne)}</span></li>`}).join("")}
                   ${$.length>12?`<li>…and ${$.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${o((U==null?void 0:U.name)??$[0])}</strong>?${(U==null?void 0:U.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return Ae({id:"files-delete-modal",title:Y,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:Z,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:c}]})})():"",x=ve!==null&&ve.paths.length>0?(()=>{const $=ve.op,B=ve.paths,U=B.length>1,Y=pe.find(ze=>ze.path===B[0]),Z=(Y==null?void 0:Y.name)??Ha(B[0]),ne=U?`${$==="copy"?"Copy":"Move"} ${B.length} items`:`${$==="copy"?"Copy":"Move"} ${(Y==null?void 0:Y.type)==="dir"?"folder":"file"}`,ie=qt===""?"Home":qt,Oe=ds(qt,B);return Ae({id:"files-transfer-modal",title:ne,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${U?`<p class="muted small" style="margin:0 0 0.75rem">${B.length} items will be ${$==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${o(Z)}</span></p>`}
                    <input type="hidden" name="toPath" value="${o(qt)}" />
                    <div class="files-transfer-dest">
                      <div class="files-transfer-dest-head">
                        <span class="files-transfer-dest-label">Destination folder</span>
                        <span class="muted small mono files-transfer-dest-value" title="${o(ie)}">${o(ie)}</span>
                      </div>
                      ${er()}
                      <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                        Click a folder to select it. Use ▸ to expand. Home is the root of your file storage.
                      </p>
                    </div>
                    ${U?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${o(Z)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${$==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:$==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:c||Oe}]})})():"",C=Ze?Ae({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${o($e===""?"Home":$e)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:c}]}):"",_=$e===""?"Home":$e,Q=`<div class="files-upload-menu${ye?" is-open":""}">
            <button type="button" class="btn btn-primary btn-small files-upload-menu-trigger"
              data-action="files-upload-menu-toggle"
              ${c?"disabled":""}
              aria-haspopup="menu"
              aria-expanded="${ye?"true":"false"}"
              aria-controls="files-upload-menu-list"
              title="Upload files or a folder into this directory">
              Upload
              <span class="files-upload-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div id="files-upload-menu-list" class="files-upload-menu-dropdown" role="menu"
              ${ye?"":"hidden"}>
              <button type="button" class="files-upload-menu-item" role="menuitem"
                data-action="files-upload-files" ${c?"disabled":""}>
                Files…
              </button>
              <button type="button" class="files-upload-menu-item" role="menuitem"
                data-action="files-upload-folder" ${c?"disabled":""}>
                Folder…
              </button>
            </div>
          </div>
          <input type="file" data-action="files-upload-pick-files" ${c?"disabled":""} multiple hidden />
          <input type="file" data-action="files-upload-pick-folder" ${c?"disabled":""}
            multiple webkitdirectory directory hidden />`;return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel${da?" is-dragover":""}" data-files-drop-target>
        <div class="files-drop-overlay" aria-hidden="true">
          <div class="files-drop-overlay-inner">
            <p class="files-drop-overlay-title">Drop to upload</p>
            <p class="muted small mono">${o(_)}</p>
            <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
          </div>
        </div>
        <div class="files-head">
          ${Ee("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${o(t)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${Er($e)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${c||fa?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${c?"disabled":""}>New folder</button>
            ${Q}
          </div>
        </div>
        ${u}
        <div class="table-wrap files-table-wrap">
          <table class="files-table">
            <thead>
              <tr>
                <th class="files-col-check">
                  <input type="checkbox" data-action="files-select-all"
                    ${i?"checked":""}
                    ${m&&!i?"data-indeterminate=1":""}
                    ${c||pe.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${fa&&pe.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':y}
            </tbody>
          </table>
        </div>
        <div class="files-status-bar muted small" role="status" aria-live="polite">
          ${r>0?`${r} of ${pe.length} selected`:o(b)}
        </div>
      </section>
      ${w}
      ${O}
      ${x}
      ${C}
    </div>`}function Ha(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function xr(){const e=["overview","settings","users","database"],t={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=z==null?void 0:z.pages,r=new Map;if(a)for(const i of a)Cs(i.id)&&r.set(i.id,i);return e.map(i=>{const m=r.get(i),n=(m==null?void 0:m.label)||t[i],l=(m==null?void 0:m.status)??(i==="overview"?"read-only":"full"),u=(m==null?void 0:m.available)===!1;return`<button type="button" role="tab" class="tab-btn${v===i?" is-active":""}${u?" is-gated":""}"
            data-action="admin-page" data-admin-page="${i}"
            aria-selected="${v===i}"
            title="${o(n)}${u?" — "+Aa(l):""}">
            ${o(n)}
          </button>`}).join("")}function bs(e){const t=Je(e),a=(t==null?void 0:t.status)??"coming-soon",r=(t==null?void 0:t.label)??e,i=(t==null?void 0:t.summary)||"This area is not available in portal Administration yet.",m=Aa(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${Ra(a)}">${o(m)}</span>
        <h2 class="admin-coming-soon-title">${o(r)}</h2>
      </div>
      <p class="muted">${o(i)}</p>
    </section>`}function ha(e,t){return`<span class="badge ${e?"badge-ok":"badge-off"}">${o(t)}: ${e?"On":"Off"}</span>`}function ya(e){return`<span class="badge ${e?"badge-ok":"badge-off"}">${e?"On":"Off"}</span>`}function Wa(e,t,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${o(String(t))}</div>
      <div class="admin-stat-label">${o(e)}</div>
      ${a?`<div class="admin-stat-hint muted small">${o(a)}</div>`:""}
    </div>`}function _r(){const e=Je("overview");if(e&&e.available===!1)return bs("overview");const t=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${o((d==null?void 0:d.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",r="";if(L&&!N)r='<section class="card"><p class="muted">Loading overview…</p></section>';else if(R&&!N)r=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${o(R)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${c?"disabled":""}>Retry</button>
      </section>`;else if(N){const i=N,m=i.services,n=i.links??{},l=e?`<span class="badge ${Ra(e.status)}">${o(Aa(e.status))}</span>`:"",u=i.version?o(i.version):"—",b=i.git?o(i.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${Ee("About this system","admin-overview")}
            <div class="section-actions">
              ${l}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${c||L?"disabled":""}>Refresh</button>
            </div>
          </div>
          <div class="admin-about-grid">
            <div>
              <h3 class="admin-subsection-title">Version</h3>
              <p>
                AngaraDAV <span class="badge badge-admin">v${u}</span>
                ${b?`<span class="mono muted small"> (${b})</span>`:""}
              </p>
              <p class="muted small admin-link-row">
                ${n.releases?`<a href="${o(n.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
                ${n.docs?`${n.releases?'<span class="footer-sep">·</span>':""}<a href="${o(n.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
              </p>
            </div>
            <div>
              <h3 class="admin-subsection-title">Services</h3>
              <div class="admin-service-table-wrap">
                <table class="admin-kv-table">
                  <tbody>
                    <tr><td>Administration</td><td>${ya(m.administration!==!1&&m.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${ya(!!m.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${ya(!!m.carddav)}</td></tr>
                    <tr><td>Files</td><td>${ya(!!m.files)}</td></tr>
                    <tr><td>Tasks</td><td>${ya(!!m.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${ya(!!m.notes)}</td></tr>
                    <tr><td>Push</td><td>${ya(!!m.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${t}
        </section>`;const y=i.nbusers??i.users,w=i.nbcalendars??i.calendars,O=i.nbevents??i.events,x=i.nbbooks??i.addressBooks,C=i.nbcontacts??i.contacts;r=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${Wa("Registered users",y,"Users")}
            ${Wa("Calendars",w,"CalDAV")}
            ${Wa("Events",O,"CalDAV")}
            ${Wa("Address books",x,"CardDAV")}
            ${Wa("Contacts",C,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${ha(m.administration!==!1&&m.webAdmin!==!1,"Administration")}
            ${ha(!!m.caldav,"CalDAV")}
            ${ha(!!m.carddav,"CardDAV")}
            ${ha(!!m.files,"Files")}
            ${ha(!!m.tasks,"Tasks")}
            ${ha(!!m.notes,"Notes")}
            ${ha(!!m.push,"Push")}
          </div>
        </section>`}else r=`<section class="card">
        ${Ee("System snapshot","admin-overview")}
        ${t}
      </section>`;return`${a}
      ${r}`}function qr(){const e=qe.trim().toLowerCase();return e?te.filter(t=>t.username.toLowerCase().includes(e)||(t.displayname||"").toLowerCase().includes(e)||(t.email||"").toLowerCase().includes(e)):te}function Ir(){return Ke?Ae({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
          <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
            <label>Username
              <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${c?"disabled":""} />
            </label>
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="password" required autocomplete="new-password" ${c?"disabled":""} />
            </label>
            <label>Confirm password
              <input type="password" name="passwordConfirm" required autocomplete="new-password" ${c?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:c},{label:"Create user",type:"submit",variant:"primary",disabled:c}]}):""}function Lr(){if(!Me||!H)return"";const e=H;return Ae({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
          <p class="muted small">Username <span class="mono">${o(e.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${o(e.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${o(e.displayname)}" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${o(e.email)}" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${c?"disabled":""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${c?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:c},{label:"Save changes",type:"submit",variant:"primary",disabled:c}]})}function Or(){if(!wt)return"";const e=wt,t=H&&H.username.toLowerCase()===e.toLowerCase()?H:te.find(r=>r.username.toLowerCase()===e.toLowerCase())??null,a=t?`${t.displayname||t.username} (${t.username})`:e;return Ae({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${o(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${$s({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:Pt,disabled:c,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:c},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:c||!Pt,attrs:`data-username="${o(e)}"`}]})}function Pr(){if(!J)return"";if(re&&!H)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${o(J)}</span>…</p>
      </section>`;if(Fe&&!H)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${o(Fe)}</p>
      </section>`;if(!H)return"";const e=H,t=Oa&&Ut.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':Ut.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':Ut.map(u=>`<tr>
          <td class="mono">${o(u.uri)}</td>
          <td>${o(u.displayname)}</td>
          <td class="hide-sm">${o(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${o(u.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${o(u.displayname)}" ${c?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=Oa&&Ft.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':Ft.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':Ft.map(u=>`<tr>
          <td class="mono">${o(u.uri)}</td>
          <td>${o(u.displayname)}</td>
          <td class="hide-sm">${o(String(u.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${o(u.displayname)}" ${c?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),r=ea!==null?Ut.find(u=>u.instanceId===ea)??null:null,i=ta!==null?Ft.find(u=>u.id===ta)??null:null,m=tt==="create"||tt==="edit"&&r?Ae({title:tt==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${r?r.instanceId:""}" />
            ${tt==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${c?"disabled":""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`:`<p class="muted small">URI <span class="mono">${o(r.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${o((r==null?void 0:r.displayname)??"")}" ${c?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${c?"disabled":""}>${o((r==null?void 0:r.description)??"")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${o((r==null?void 0:r.calendarcolor)??"")}" ${c?"disabled":""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${r!=null&&r.todos||tt==="create"?"checked":""} ${c?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${r!=null&&r.notes?"checked":""} ${c?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:c},{label:"Save",type:"submit",variant:"primary",disabled:c}]}):"",n=ut==="create"||ut==="edit"&&i?Ae({title:ut==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${i?i.id:""}" />
            ${ut==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${c?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${o(i.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${o((i==null?void 0:i.displayname)??"")}" ${c?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${c?"disabled":""}>${o((i==null?void 0:i.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:c},{label:"Save",type:"submit",variant:"primary",disabled:c}]}):"",l=Te?Ae({title:`Delete ${Te.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${o(Te.label)}</strong> for <span class="mono">${o(e.username)}</span>?</p>
          ${Te.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${Te.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:c}]}):"";return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${o(e.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${o(e.username)}" ${c?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${o(e.username)}" ${c?"disabled":""}>Delete</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
      </div>
      <p class="muted small admin-breadcrumb">Users → <span class="mono">${o(e.username)}</span></p>
      <dl class="admin-dl">
        <div><dt>Username</dt><dd class="mono">${o(e.username)}</dd></div>
        <div><dt>Display name</dt><dd>${o(e.displayname||"—")}</dd></div>
        <div><dt>Email</dt><dd>${e.email?`<a href="mailto:${o(e.email)}">${o(e.email)}</a>`:"—"}</dd></div>
        <div><dt>Principal</dt><dd class="mono">${o(e.principal)}</dd></div>
        <div><dt>Calendars</dt><dd>${o(String(e.calendarCount))}</dd></div>
        <div><dt>Events / objects</dt><dd>${o(String(e.eventCount))}</dd></div>
        <div><dt>Address books</dt><dd>${o(String(e.addressBookCount))}</dd></div>
        <div><dt>Contacts</dt><dd>${o(String(e.contactCount))}</dd></div>
      </dl>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Calendars</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${c?"disabled":""}>Add calendar</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Address books</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${c?"disabled":""}>Add address book</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
          <tbody>${a}</tbody>
        </table>
      </div>
    </section>
    ${m}${n}${l}`}function Ur(){const e=Je("users");if(e&&e.available===!1)return bs("users");const t=qr(),a=de&&te.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':t.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${X?o(X):qe.trim()?"No users match this filter.":"No users found."}</td></tr>`:t.map(r=>`<tr class="contact-table-row${J&&J.toLowerCase()===r.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${o(r.username)}" tabindex="0" role="button">
                  <td class="mono">${o(r.username)}</td>
                  <td class="hide-sm">${o(r.displayname||"—")}</td>
                  <td class="hide-sm">${o(r.email||"—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${o(r.username)}" ${c?"disabled":""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${o(r.username)}" ${c?"disabled":""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${o(r.username)}" ${c?"disabled":""}>Delete</button>
                  </td>
                </tr>`).join("");return`
      <section class="card">
        <div class="section-header">
          ${Ee("Users","admin-users")}
          <div class="section-actions">
            ${e?`<span class="badge ${Ra(e.status)}">${o(Aa(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${c||de?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${c?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${o(qe)}" aria-label="Filter users" ${c?"disabled":""} />
          <span class="muted small">${o(String(t.length))}${qe.trim()?` / ${te.length}`:""} user${t.length===1?"":"s"}</span>
        </div>
        ${X&&te.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${o(X)}</p>`:""}
        <div class="contacts-table-wrap admin-table-placeholder">
          <table class="contacts-table">
            <thead>
              <tr>
                <th>Username</th>
                <th class="hide-sm">Display name</th>
                <th class="hide-sm">Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${a}</tbody>
          </table>
        </div>
      </section>
      ${Pr()}
      ${Ir()}
      ${Lr()}
      ${Or()}`}function Fr(){const e=Je("settings");if(e&&e.available===!1)return bs("settings");if(Xa&&!aa)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(Pa&&!aa)return`<section class="card">
        <p class="flash flash-error">${o(Pa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const t=aa;if(!t)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(i,m,n)=>`<label class="check-row"><input type="checkbox" name="${o(i)}" ${m?"checked":""} ${c||t.writable===!1?"disabled":""} /> ${o(n)}</label>`,r=(i,m,n,l="")=>`<label>${o(n)}
        <input type="number" name="${o(i)}" value="${o(String(m??0))}" ${c||t.writable===!1?"disabled":""} />
        ${l?`<span class="muted small">${o(l)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${Ee("System settings","admin-settings")}
          <div class="section-actions">
            ${e?`<span class="badge ${Ra(e.status)}">${o(Aa(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${c?"disabled":""}>Reload</button>
          </div>
        </div>
        <p class="muted small">
          Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
          <strong>session timeout</strong> affects portal idle sessions.
          ${t.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
        </p>
        <form class="stack admin-settings-form" data-form="admin-settings">
          <h3 class="admin-subsection-title">DAV services</h3>
          ${a("cal_enabled",!!t.cal_enabled,"Enable CalDAV")}
          ${a("card_enabled",!!t.card_enabled,"Enable CardDAV")}
          ${a("tasks_enabled",!!t.tasks_enabled,"Enable Tasks (VTODO)")}
          ${a("notes_enabled",!!t.notes_enabled,"Enable Notes (VJOURNAL)")}
          <label>WebDAV authentication type
            <select name="dav_auth_type" ${c||t.writable===!1?"disabled":""}>
              ${["Digest","Basic","Apache"].map(i=>`<option value="${i}" ${t.dav_auth_type===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${c||t.writable===!1?"disabled":""}>
              ${Bn(t.timezone||"UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${o(t.invite_from||"")}" placeholder="noreply@example.com" ${c||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${a("files_enabled",!!t.files_enabled,"Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${o(t.files_storage_path||"")}" placeholder="empty = Specific/files" ${c||t.writable===!1?"disabled":""} />
          </label>
          ${r("files_max_upload_mb",t.files_max_upload_mb,"Max file size (MB)")}
          ${r("files_quota_mb",t.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${r("files_quarantine_days",t.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${r("session_max_age_minutes",t.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${c||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(t.portal_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>
          ${a("portal_admin_ui_enabled",t.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${o(Array.isArray(t.portal_admin_users)?t.portal_admin_users.join(", "):String(t.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${c||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${a("push_enabled",!!t.push_enabled,"Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${o(t.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${c||t.writable===!1?"disabled":""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${c||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(t.push_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>

          <h3 class="admin-subsection-title">Server admin password</h3>
          <p class="muted small">
            Stored in <span class="mono">baikal.yaml</span> for install recovery.
            Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
            ${t.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
          </p>
          <label>New server admin password
            <input type="password" name="admin_password" autocomplete="new-password" ${c||t.writable===!1?"disabled":""} />
          </label>
          <label>Confirm server admin password
            <input type="password" name="admin_password_confirm" autocomplete="new-password" ${c||t.writable===!1?"disabled":""} />
          </label>

          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${c||t.writable===!1?"disabled":""}>Save settings</button>
          </div>
        </form>
      </section>
      <section class="card card-danger-zone">
        <div class="section-header">
          <h2>Danger zone</h2>
        </div>
        <p class="muted small">
          <strong>Reset to Default</strong> is a full factory wipe: config, database (all users and data),
          WebDAV files, and install lock. A timestamped backup of
          <span class="mono">baikal.yaml</span> is kept next to config; <strong>back up volumes first</strong>
          if you need data recovery. Everything else is deleted, then the installer opens.
        </p>
        <div class="form-actions-row" style="margin-top:0.75rem">
          <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${c||t.writable===!1?"disabled":""}>
            Reset to Default
          </button>
        </div>
      </section>
      ${Mr()}`}function Mr(){return va?Ae({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${$s({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:kt,disabled:c,style:"admin"})}
          <label style="margin-top:1rem">Your portal password
            <input type="password" data-action="admin-reset-password" value="${o(at)}"
              autocomplete="current-password" placeholder="Re-enter password to confirm" ${c?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:c},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:c||!kt||at.trim()===""}]}):""}function Rr(){const e=Je("database");if(e&&e.available===!1)return bs("database");if(Za&&!sa)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(Ua&&!sa)return`<section class="card">
        <p class="flash flash-error">${o(Ua)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const t=sa;if(!t)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=na,r=t.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${Ee("Database","admin-database")}
          <div class="section-actions">
            ${e?`<span class="badge ${Ra(e.status)}">${o(Aa(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${c?"disabled":""}>Refresh</button>
          </div>
        </div>
        <p class="flash flash-info" style="margin-bottom:1rem">${o(t.warning)}</p>
        <dl class="admin-dl admin-dl-stack">
          <div>
            <dt>Current backend</dt>
            <dd><span class="badge badge-admin">${o((t.backend||"—").toUpperCase())}</span></dd>
          </div>
          ${t.backend==="sqlite"||t.sqlite_file?`<div>
            <dt>SQLite file</dt>
            <dd class="mono admin-dl-path">${o(t.sqlite_file||"—")}</dd>
          </div>`:""}
          ${t.backend==="pgsql"||t.pgsql_host?`<div>
            <dt>PostgreSQL</dt>
            <dd class="mono admin-dl-path">${o(t.pgsql_host||"—")} / ${o(t.pgsql_dbname||"—")} · ${o(t.pgsql_username||"—")}</dd>
          </div>
          <div>
            <dt>Password</dt>
            <dd>${t.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>`:""}
          <div>
            <dt>Encryption key</dt>
            <dd>${t.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>
        </dl>

        <h3 class="admin-subsection-title">Edit connection</h3>
        ${r?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
        <form class="stack admin-database-form" data-form="admin-database">
          <label>Backend
            <select name="backend" data-action="admin-db-backend" ${c||r?"disabled":""}>
              <option value="sqlite" ${a==="sqlite"?"selected":""}>SQLite</option>
              <option value="pgsql" ${a==="pgsql"?"selected":""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${a==="sqlite"?"":"display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${o(t.sqlite_file||"")}" ${c||r?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${o(t.pgsql_host||"")}" placeholder="localhost:5432" ${c||r?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${o(t.pgsql_dbname||"")}" ${c||r?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${o(t.pgsql_username||"")}" autocomplete="off" ${c||r?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${t.hasPassword?"Leave blank to keep current":""}" ${c||r?"disabled":""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${c||r?"disabled":""}>Test connection</button>
            <button type="submit" class="btn btn-primary" ${c||r?"disabled":""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${Vr()}`}function Vr(){if(!wa)return"";const e=St.trim()==="CONFIRM";return Ae({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${o(St)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${c?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:c},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:c||!e}]})}function Br(){return xe()?Rt()?v==="users"?Ur():v==="settings"?Fr():v==="database"?Rr():_r():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function zr(e){const t=new Map;for(const b of e)b.uid&&t.set(b.uid,b);const a=new Map(e.map((b,y)=>[ge(b.instanceId,b.uri),y])),r=new Map,i=[];for(const b of e){const y=b.parentUid;if(y&&t.has(y)&&y!==b.uid){const w=r.get(y)??[];w.push(b),r.set(y,w)}else i.push(b)}const m=(b,y)=>(a.get(ge(b.instanceId,b.uri))??0)-(a.get(ge(y.instanceId,y.uri))??0);i.sort(m);for(const[,b]of r)b.sort(m);const n=[],l=new Set,u=(b,y)=>{const w=b.uid||ge(b.instanceId,b.uri);if(!l.has(w)){l.add(w),n.push({task:b,depth:Math.min(y,8)});for(const O of r.get(b.uid)??[])u(O,y+1);l.delete(w)}};for(const b of i)u(b,0);for(const b of e)n.some(y=>y.task===b)||n.push({task:b,depth:0});return n}function jr(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const r of Ue)r.parentUid&&t.has(r.parentUid)&&r.uid&&!t.has(r.uid)&&(t.add(r.uid),a=!0)}return t}function Hr(e,t){const a=e.instanceId,r=t||!e.uid?new Set:jr(e.uid),i=Ue.filter(l=>l.uid&&l.instanceId===a&&!r.has(l.uid)&&l.uid!==e.uid),m=e.parentUid||"",n=['<option value="">None (top-level)</option>',...i.map(l=>`<option value="${o(l.uid)}" ${l.uid===m?"selected":""}>${o(l.summary||l.uid)}</option>`)];if(m&&!i.some(l=>l.uid===m)){const l=Ue.find(u=>u.uid===m);n.push(`<option value="${o(m)}" selected>${o((l==null?void 0:l.summary)||m)} (current)</option>`)}return n.join("")}function An(){const e=new Set(De);return Ue.filter(t=>e.has(ge(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function Wr(){const e=C=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[C]||C,t=zr(Ue),a=Ue.filter(C=>C.canWrite&&!C.readOnly).map(C=>ge(C.instanceId,C.uri)),r=a.length>0&&a.every(C=>De.includes(C)),i=De.length>0,n=An().length,l=Ue.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${us?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:C,depth:_})=>{const Q=ge(C.instanceId,C.uri),$=!le&&Q===Be?" is-selected":"",B=De.includes(Q),U=C.status==="COMPLETED"?"badge-ok":C.status==="CANCELLED"?"":"badge-admin",Y=_>0?` style="--task-depth:${_}"`:"",Z=_>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",ne=C.canWrite&&!C.readOnly;return`<tr class="contact-table-row task-row${_>0?" is-subtask":""}${$}${B?" is-checked":""}" data-action="select-task" data-instance="${C.instanceId}" data-uri="${o(C.uri)}" tabindex="0" role="button"${Y}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${C.instanceId}" data-uri="${o(C.uri)}"
                    ${B?"checked":""} ${ne?"":"disabled"} aria-label="Select ${o(C.summary||C.uri)}" ${c?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${Z}<span class="contact-name-primary">${o(C.summary||C.uri)}</span></span>
                  ${C.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${U}">${o(e(C.status))}</span></td>
                <td class="col-task-due muted small">${o(pn(C.due))}</td>
                <td class="col-task-cal muted small">${o(C.calendarName)}</td>
                <td class="col-task-pct muted small">${C.percent?o(String(C.percent))+"%":"—"}</td>
              </tr>`}).join(""),u=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,b=(C,_)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${C}"
        title="${o(_)}" aria-label="${o(_)}" ${c||n===0?"disabled":""}>${u}</button>`,y=i?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${De.length!==n?`<span class="muted small bulk-bar-count-extra">(${De.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${c||n===0?"disabled":""}>
                    <option value="">—</option>
                    <option value="NEEDS-ACTION">To do</option>
                    <option value="IN-PROCESS">In progress</option>
                    <option value="COMPLETED">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
                ${b("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${ga({field:"bulk-due",name:"bulkDue",label:"Due",value:ts,dateOnly:!1,disabled:c||n===0,allowClear:!0})}
                ${b("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${c||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${c||n===0?"disabled":""} />
                </label>
                ${b("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${c||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${c?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",w=G,O=Vt.map(C=>`<option value="${C.id}" ${w&&w.instanceId===C.id?"selected":""}>${o(C.displayname)}</option>`).join(""),x=w?`<div class="card">
            ${Ee(le?w.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${le?`<label>Calendar
                      <select name="instanceId" required ${Vt.length===0?"disabled":""}>
                        <option value="">${Vt.length?"Select calendar…":"No writable calendars"}</option>
                        ${O}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${o(w.calendarName)}</strong>${w.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${o(w.summary)}" ${w.readOnly&&!le?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${w.readOnly&&!le?"readonly":""}>${o(w.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${w.readOnly&&!le?"disabled":""}>
                  ${Hr(w,le)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${w.readOnly&&!le?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(C=>`<option value="${C}" ${w.status===C?"selected":""}>${o(e(C))}</option>`).join("")}
                  </select>
                </label>
                ${ga({field:"due",name:"due",label:"Due",value:xa(w.due),dateOnly:!1,disabled:!!(w.readOnly&&!le),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${o(String(w.priority||0))}" ${w.readOnly&&!le?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${o(String(w.percent||0))}" ${w.readOnly&&!le?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${le||w.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${le?"Create task":"Save task"}</button>`:""}
                ${!le&&w.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${c?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${c?"disabled":""}>Delete</button>`:le?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Ee("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${o(us)}" aria-label="Search tasks" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${c||Vt.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${Vt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${r?"checked":""} ${a.length===0||c?"disabled":""} />
                </th>
                ${Jt("Title","summary",zt,_t,"task","col-task-title")}
                ${Jt("Status","status",zt,_t,"task","col-task-status")}
                ${Jt("Due","due",zt,_t,"task","col-task-due")}
                ${Jt("Calendar","calendar",zt,_t,"task","col-task-cal")}
                ${Jt("%","percent",zt,_t,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function Jr(){const e=Ea.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${ms?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Ea.map(i=>{const m=ge(i.instanceId,i.uri),n=!_e&&m===ft?" is-selected":"",l=(i.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${i.instanceId}" data-uri="${o(i.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${o(i.summary||i.uri)}</span>
                  ${l?`<span class="muted small contact-name-secondary">${o(l)}${i.description.length>80?"…":""}</span>`:""}
                  ${i.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${o(pn(i.dtstart))}</td>
                <td class="col-note-cal muted small">${o(i.calendarName)}</td>
              </tr>`}).join(""),t=ue,a=Bt.map(i=>`<option value="${i.id}" ${t&&t.instanceId===i.id?"selected":""}>${o(i.displayname)}</option>`).join(""),r=t?`<div class="card">
            ${Ee(_e?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${_e?`<label>Calendar
                      <select name="instanceId" required ${Bt.length===0?"disabled":""}>
                        <option value="">${Bt.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${o(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${o(t.summary)}" ${t.readOnly&&!_e?"readonly":""} />
              </label>
              ${ga({field:"dtstart",name:"dtstart",label:"Date",value:xa(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!_e),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!_e?"readonly":""}>${o(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${_e||t.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${_e?"Create note":"Save note"}</button>`:""}
                ${!_e&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${c?"disabled":""}>Delete</button>`:_e?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Ee("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${o(ms)}" aria-label="Search notes" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${c||Bt.length===0?"disabled":""}>Add note</button>
        </div>
        ${Bt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Jt("Title","summary",Na,pa,"note","col-note-title")}
                ${Jt("Date","dtstart",Na,pa,"note","col-note-date")}
                ${Jt("Calendar","calendar",Na,pa,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${r}
      </section>
    </div>`}function Yr(){const e=s.querySelector(".contacts-table-wrap"),t=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list"),r=s.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null,filesTableTop:(r==null?void 0:r.scrollTop)??null}}function Kr(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=s.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=s.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=s.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}if(e.filesTableTop!==null){const t=s.querySelector(".files-table-wrap");t&&(t.scrollTop=e.filesTableTop)}})})}function p(){const e=Yr();d?Ar():Cn(),Gr(),Kr(e),requestAnimationFrame(()=>{var t;gr(),(t=s.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function En(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let r=a.value.trim();r&&!r.startsWith("#")&&(r=`#${r}`),/^#[0-9A-Fa-f]{6}/.test(r)&&(t.value=r.slice(0,7),a.value=r.toUpperCase())}))}function Gr(){s.querySelectorAll("[data-action]").forEach(D=>{D.addEventListener("click",ee=>{const P=ee.target.closest("[data-action]");((P==null?void 0:P.dataset.action)==="info"||(P==null?void 0:P.dataset.action)==="info-close")&&(ee.preventDefault(),ee.stopPropagation()),ul(ee)})}),Va(),Re&&Hn(),Xe(),ye&&Wn(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(D=>{D.addEventListener("keydown",ee=>{(ee.key==="Enter"||ee.key===" ")&&(ee.preventDefault(),D.click())})});const e=s.querySelector("#delete-cal-confirm"),t=s.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||c)});const a=s.querySelector("#delete-ab-confirm"),r=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{r&&(r.disabled=!a.checked||c)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(D=>{D.addEventListener("error",()=>{const ee=D.dataset.avatarFallback||"?",P=document.createElement("span");P.className="contact-avatar contact-avatar-fallback",P.setAttribute("aria-hidden","true"),P.textContent=ee,D.replaceWith(P)})}),an||(document.addEventListener("keydown",D=>{if(D.key==="Escape"){if(K&&(K.phase==="done"||K.phase==="error")){hn();return}if(!K){if(V&&(V.phase==="done"||V.phase==="error")){vn();return}if(!V){if(ye){ye=!1,Xe(),p();return}if(Re){Re=!1,Va(),p();return}if(Le!==null||Ce!==null||ve!==null||Ze){Le=null,Ce=null,Ct(),Ze=!1,p();return}xn()}}}}),an=!0);const i=s.querySelector('[data-form="login"]');i==null||i.addEventListener("submit",D=>{D.preventDefault(),al(i)});const m=s.querySelector('[data-form="files-rename"]');m==null||m.addEventListener("submit",D=>{D.preventDefault(),sl(m)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",D=>{D.preventDefault(),rl(n)});const l=s.querySelector('[data-form="files-mkdir"]');l==null||l.addEventListener("submit",D=>{D.preventDefault(),nl(l)}),Ze&&requestAnimationFrame(()=>{var D;(D=l==null?void 0:l.querySelector('input[name="name"]'))==null||D.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload-pick-files"]').forEach(D=>{D.addEventListener("change",()=>{Tn(D,!1)})}),s.querySelectorAll('input[type="file"][data-action="files-upload-pick-folder"]').forEach(D=>{D.addEventListener("change",()=>{Tn(D,!0)})});const u=s.querySelector("[data-files-drop-target]");if(u&&h==="files"&&!c&&!V){let D=0;const ee=P=>{da!==P&&(da=P,u.classList.toggle("is-dragover",P))};u.addEventListener("dragenter",P=>{ys(P.dataTransfer)&&(P.preventDefault(),P.stopPropagation(),D+=1,ee(!0))}),u.addEventListener("dragover",P=>{ys(P.dataTransfer)&&(P.preventDefault(),P.stopPropagation(),P.dataTransfer&&(P.dataTransfer.dropEffect="copy"),ee(!0))}),u.addEventListener("dragleave",P=>{ys(P.dataTransfer)&&(P.preventDefault(),P.stopPropagation(),D=Math.max(0,D-1),D===0&&ee(!1))}),u.addEventListener("drop",P=>{if(!ys(P.dataTransfer))return;P.preventDefault(),P.stopPropagation(),D=0,ee(!1);const je=P.dataTransfer;!je||c||V||(ye=!1,Xe(),(async()=>{try{const ke=await Il(je);if(ke.length===0){g("info","Nothing to upload from that drop"),p();return}await Vs(ke)}catch(ke){g("error",ke instanceof Error?ke.message:"Drop failed"),p()}})())})}s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(D=>{D.indeterminate=!0});const b=s.querySelector('[data-form="share"]');b==null||b.addEventListener("submit",D=>{D.preventDefault(),il(b)});const y=s.querySelector('[data-form="edit-cal"]');y&&(En(y),y.addEventListener("submit",D=>{D.preventDefault(),dl(y)}));const w=s.querySelector('[data-form="edit-event"]');w==null||w.addEventListener("submit",D=>{D.preventDefault(),ol(w)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(D=>{D.addEventListener("change",()=>{if(!k)return;const ee=s.querySelector('[data-form="edit-event"]');if(!ee)return;const P=new FormData(ee),je=ee.querySelector('input[name="allDay"]'),ke=Ya(P);ke.endMode==="until"&&!ke.until&&(ke.until=ba(String(P.get("start")??k.start??""))||we(new Date)),k={...k,summary:String(P.get("summary")??k.summary),description:String(P.get("description")??k.description),location:String(P.get("location")??k.location),instanceId:Number(P.get("instanceId"))||k.instanceId,allDay:(je==null?void 0:je.checked)??k.allDay,start:String(P.get("start")??k.start??""),end:String(P.get("end")??k.end??"")||null,repeat:ke,hasRrule:!!String(P.get("repeatFreq")??"").trim()},ke.freq&&ke.endMode==="until"&&(F==null?void 0:F.field)==="end"&&(F=null),p(),ke.endMode==="until"&&requestAnimationFrame(()=>{var S;const et=s.querySelector('input[name="repeatUntil"]');et==null||et.focus();try{(S=et==null?void 0:et.showPicker)==null||S.call(et)}catch{}})})});const O=s.querySelector('[data-form="create-cal"]');O&&(En(O),O.addEventListener("submit",D=>{D.preventDefault(),cl(O)}));const x=s.querySelector('[data-form="create-ab"]');x==null||x.addEventListener("submit",D=>{D.preventDefault(),gl(x)});const C=s.querySelector('[data-form="edit-ab"]');C==null||C.addEventListener("submit",D=>{D.preventDefault(),hl(C)});const _=s.querySelector('[data-form="contact"]');_==null||_.addEventListener("submit",D=>{D.preventDefault(),bl(_)});const Q=s.querySelector('[data-form="task"]');if(Q==null||Q.addEventListener("submit",D=>{D.preventDefault(),Xr(Q)}),Q){const D=Q.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!le||!G)return;const ee=Number(D.value);if(!Number.isFinite(ee)||ee<=0)return;const P=new FormData(Q),je=String(P.get("due")??"").trim();G={...G,instanceId:ee,parentUid:G.parentUid&&Ue.some(ke=>ke.uid===G.parentUid&&ke.instanceId===ee)?G.parentUid:null,summary:String(P.get("summary")??""),description:String(P.get("description")??""),status:String(P.get("status")??"NEEDS-ACTION"),due:je?new Date(je).toISOString():null,priority:Number(P.get("priority")??0),percent:Number(P.get("percent")??0)},p()})}const $=s.querySelector('[data-form="note"]');$==null||$.addEventListener("submit",D=>{D.preventDefault(),Zr($)});const B=s.querySelector('input[data-action="contact-search"]');B==null||B.addEventListener("input",()=>{rt&&clearTimeout(rt),rt=setTimeout(()=>{oa=B.value,W!==null&&(async()=>{try{await Ht(W),p()}catch(D){g("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)});const U=s.querySelector('input[data-action="task-search"]');U==null||U.addEventListener("input",()=>{rt&&clearTimeout(rt),rt=setTimeout(()=>{us=U.value,(async()=>{try{await Wt(),p()}catch(D){g("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)});const Y=s.querySelector('input[data-action="admin-users-search"]');Y==null||Y.addEventListener("input",()=>{rt&&clearTimeout(rt),rt=setTimeout(()=>{qe=Y.value,p()},150)});const Z=s.querySelector('[data-form="admin-user-create"]');Z==null||Z.addEventListener("submit",D=>{D.preventDefault(),Jn(Z)});const ne=s.querySelector('[data-form="admin-user-edit"]');ne==null||ne.addEventListener("submit",D=>{D.preventDefault(),Zn(ne)});const ie=s.querySelector('[data-form="admin-cal"]');ie==null||ie.addEventListener("submit",D=>{D.preventDefault(),Yn(ie)});const Oe=s.querySelector('[data-form="admin-ab"]');Oe==null||Oe.addEventListener("submit",D=>{D.preventDefault(),Kn(Oe)});const ze=s.querySelector('[data-form="admin-settings"]');ze==null||ze.addEventListener("submit",D=>{D.preventDefault(),Xn(ze)});const It=s.querySelector('[data-form="admin-database"]');It==null||It.addEventListener("submit",D=>{D.preventDefault(),Gn(It)});const Ye=s.querySelector('select[data-action="admin-db-backend"]');Ye==null||Ye.addEventListener("change",()=>{na=Ye.value==="pgsql"?"pgsql":"sqlite",p()});const Gt=s.querySelector('input[data-action="admin-db-confirm-input"]');Gt==null||Gt.addEventListener("input",()=>{St=Gt.value;const D=s.querySelector('[data-action="admin-db-confirm-save"]');D&&(D.disabled=c||St.trim()!=="CONFIRM")});const Qt=s.querySelector('input[data-action="admin-reset-password"]');Qt==null||Qt.addEventListener("input",()=>{at=Qt.value;const D=s.querySelector('[data-action="admin-reset-confirm"]');D&&(D.disabled=c||!kt||at.trim()==="")});const ht=s.querySelector('input[data-action="note-search"]');ht==null||ht.addEventListener("input",()=>{rt&&clearTimeout(rt),rt=setTimeout(()=>{ms=ht.value,(async()=>{try{await Ta(),p()}catch(D){g("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)}),ml(),tl(),el()}async function Qr(e){var i,m;const t=An();if(t.length===0){g("error","No writable tasks selected"),p();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;c=!0,T(),p();try{const n=await A.bulkTasks({op:"delete",items:a});De=[],Be&&t.some(l=>ge(l.instanceId,l.uri)===Be)&&(Be=null,G=null,le=!1),await Wt(),n.failed>0?g("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk delete failed")}finally{c=!1,p()}return}let r={};if(e==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),l=((i=n==null?void 0:n.value)==null?void 0:i.trim())??"";if(!l){g("error","Choose a status to apply"),p();return}r={status:l}}else if(e==="bulk-task-due"){const n=ts.trim();if(!n){g("error","Choose a due date to apply"),p();return}const l=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(l.getTime())){g("error","Invalid due date"),p();return}r={due:l.toISOString()}}else if(e==="bulk-task-clear-due")r={due:null};else if(e==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),l=((m=n==null?void 0:n.value)==null?void 0:m.trim())??"";if(l===""){g("error","Enter a percent complete (0–100)"),p();return}const u=Number(l);if(!Number.isFinite(u)||u<0||u>100){g("error","Percent must be between 0 and 100"),p();return}r={percent:Math.round(u)}}c=!0,T(),p();try{const n=await A.bulkTasks({op:"update",items:a,fields:r});if(await Wt(),G&&!le){const u=ge(G.instanceId,G.uri),b=Ue.find(y=>ge(y.instanceId,y.uri)===u);b&&(G={...b})}const l=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?g("error",`Updated ${l} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Updated ${l} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk update failed")}finally{c=!1,p()}}async function Xr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("status")??"NEEDS-ACTION"),m=String(t.get("due")??"").trim(),n=m?new Date(m).toISOString():null,l=Number(t.get("priority")??0),u=Number(t.get("percent")??0),b=String(t.get("parentUid")??"").trim(),y=b===""?null:b;c=!0,T(),p();try{if(le){const w=Number(t.get("instanceId"));if(!Number.isFinite(w)||w<=0)throw new Error("Select a calendar");const O=await A.createTask({instanceId:w,summary:a,description:r,status:i,due:n,priority:l,percent:u,parentUid:y});le=!1,Be=ge(O.task.instanceId,O.task.uri),G=O.task,g("success",y?"Subtask created":"Task created")}else if(G){const w=await A.updateTask(G.instanceId,G.uri,{summary:a,description:r,status:i,due:n,priority:l,percent:u,parentUid:y});G=w.task,Be=ge(w.task.instanceId,w.task.uri),g("success","Task saved")}await Wt()}catch(w){g("error",w instanceof Error?w.message:"Save failed")}finally{c=!1,p()}}async function Zr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("dtstart")??"").trim(),m=i?new Date(i).toISOString():null;c=!0,T(),p();try{if(_e){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const l=await A.createNote({instanceId:n,summary:a,description:r,dtstart:m});_e=!1,ft=ge(l.note.instanceId,l.note.uri),ue=l.note,g("success","Note created")}else if(ue){const n=await A.updateNote(ue.instanceId,ue.uri,{summary:a,description:r,dtstart:m});ue=n.note,ft=ge(n.note.instanceId,n.note.uri),g("success","Note saved")}await Ta()}catch(n){g("error",n instanceof Error?n.message:"Save failed")}finally{c=!1,p()}}function el(){const e=s.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){g("error","Photo is too large (max ~2 MB)"),p();return}try{const r=await kr(t);Qe=r,Pe=`data:${t.type||"image/jpeg"};base64,${r}`,nt=!1,p()}catch(r){g("error",r instanceof Error?r.message:"Failed to read photo"),p()}}})()})}function tl(){const e=s.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),r=e.querySelector('input[name="displayname"]'),i=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const m=()=>{const n=t.checked;a.hidden=!n,r&&(r.required=!n,n&&!r.value.trim()?r.placeholder="Auto: Holidays (XX)":n||(r.placeholder="Work")),n&&i&&(i.checked=!0)};t.addEventListener("change",m),m()}async function al(e){var i,m,n,l;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("password")??"");c=!0,T(),p(),E.event("login.attempt",{username:a});try{const u=await A.login(a,r);if(d=u.user,xs(u.ui),E.event("login.ok",{username:(d==null?void 0:d.username)??a}),qs(),xe())try{await Is()}catch(b){E.warn("admin.capabilities login",b instanceof Error?b.message:b)}if(nn(),yt(h,v),await it(),h==="admin"&&xe()&&Rt())try{v==="overview"&&((i=Je("overview"))==null?void 0:i.available)!==!1?await ls():v==="users"&&((m=Je("users"))==null?void 0:m.available)!==!1?(await ua(),J&&(await Tt(J),await ma(J))):v==="settings"&&((n=Je("settings"))==null?void 0:n.available)!==!1?await is():v==="database"&&((l=Je("database"))==null?void 0:l.available)!==!1&&await os()}catch(b){E.warn("admin login load",b instanceof Error?b.message:b)}g("success","Signed in")}catch(u){E.warn("login.failed",u instanceof Error?u.message:u),g("error",u instanceof Error?u.message:"Login failed")}finally{c=!1,p()}}async function sl(e){const t=new FormData(e),a=String(t.get("path")??""),r=String(t.get("newName")??"").trim();if(!a||!r){g("error","Name is required"),p();return}c=!0,T(),p();try{await A.filesRename(a,r),E.event("files.rename",{path:a,newName:r}),Le=null,await xt(),g("success",`Renamed to “${r}”`)}catch(i){g("error",i instanceof Error?i.message:"Rename failed")}finally{c=!1,p()}}async function nl(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){g("error","Folder name is required"),p();return}c=!0,T(),p();try{await A.filesMkdir($e,a),E.event("files.mkdir",{path:$e,name:a}),Ze=!1,await xt(),g("success",`Created folder “${a}”`)}catch(r){g("error",r instanceof Error?r.message:"Could not create folder")}finally{c=!1,p()}}async function rl(e){if(!ve||ve.paths.length===0)return;const t=new FormData(e),a=(qt||String(t.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),r=String(t.get("newName")??"").trim(),i=ve.op,m=[...ve.paths],n=m.length>1;if(ds(a,m)){g("error","Choose a different destination folder"),p();return}c=!0,T(),p();let l=0;const u=[];try{for(const y of m)try{if(i==="copy"){const w=Ha(y),O=n||!r||r===w?void 0:r,x=await A.filesCopy(y,{to:a,newName:O});E.event("files.copy",{path:y,to:x.entry.path})}else{const w=Ha(y),O=n||!r||r===w?void 0:r;await A.filesMove(y,a,O),E.event("files.move",{path:y,to:a})}l+=1}catch(w){u.push(`${Ha(y)}: ${w instanceof Error?w.message:"failed"}`)}Ct(),be=[],await xt();const b=i==="copy"?"Copied":"Moved";l>0&&u.length===0?g("success",l===1?`${b} 1 item`:`${b} ${l} items`):l>0?g("info",`${b} ${l}; ${u.length} failed. ${u[0]}`):g("error",u[0]||`${i==="copy"?"Copy":"Move"} failed`)}catch(b){g("error",b instanceof Error?b.message:"Operation failed")}finally{c=!1,p()}}function ll(e){var a;const t=e==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(a=s.querySelector(t))==null||a.click()}async function Nn(e){if(c||V)return;ye=!1,Xe(),Le=null,Ce=null,Ct(),Ze=!1;const t=e==="files"?_l:ql;try{const a=await t();if(a.kind==="cancel"){p();return}if(a.kind==="items"){if(a.items.length===0){g("info",e==="folder"?"Folder is empty":"No files selected"),p();return}await Vs(a.items);return}p(),requestAnimationFrame(()=>{ll(e)})}catch(a){g("error",a instanceof Error?a.message:"Could not open picker"),p()}}async function Vs(e){var w,O;if(e.length===0)return;ye=!1,Xe(),da=!1;const t=e.filter(x=>x.file&&!x.isEmptyDir),a=e.filter(x=>x.isEmptyDir&&x.relativePath),r=$e,i=t.reduce((x,C)=>{var _;return x+(((_=C.file)==null?void 0:_.size)||0)},0),m=Date.now(),n=t.length+a.length;V={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((w=t[0])==null?void 0:w.relativePath)||((O=a[0])==null?void 0:O.relativePath)||"",bytesTotal:i,bytesSent:0,startedAt:m,elapsedSec:0,resultMessage:null,errorSamples:[]},c=!0,T(),Dr(),p();let l=0;const u=[],b=new Set;let y=0;try{for(const _ of a){const Q=_.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(Q){V&&(V={...V,currentName:Q+"/",elapsedSec:Math.floor((Date.now()-m)/1e3)},qa(V));try{await Sn(r,Q,b)}catch($){u.push(`${Q}/: ${$ instanceof Error?$.message:"failed"}`)}}}for(const _ of t){const Q=_.file,$=(_.relativePath||Q.name).replace(/\\/g,"/"),B=$.split("/").filter(Boolean),U=B.pop()||Q.name,Y=B.join("/"),Z=$||U;V&&(V={...V,currentName:Z,bytesSent:y,elapsedSec:Math.floor((Date.now()-m)/1e3)},qa(V));try{Y&&await Sn(r,Y,b);const ne=kn(r,Y);await A.filesUpload(ne,Q,{replace:!0,onProgress:(ie,Oe)=>{if(!V||V.phase!=="uploading")return;const ze=Oe>0?Oe:Q.size;V={...V,currentName:Z,bytesSent:y+Math.min(ie,ze||ie),elapsedSec:Math.floor((Date.now()-m)/1e3)},qa(V)}}),E.event("files.upload",{path:ne,name:U,size:Q.size,relativePath:$}),l+=1,y+=Q.size||0,V&&(V={...V,completedFiles:l,failedFiles:u.length,bytesSent:y},qa(V))}catch(ne){const ie=`${Z}: ${ne instanceof Error?ne.message:"failed"}`;u.push(ie),y+=Q.size||0,V&&(V={...V,completedFiles:l,failedFiles:u.length,bytesSent:y,errorSamples:u.slice(0,12)},qa(V))}}await xt(),_a();const x=Math.floor((Date.now()-m)/1e3),C=t.length;if(l>0&&u.length===0){const _=l===1?"Uploaded 1 file":`Uploaded ${l} files`;V={phase:"done",totalFiles:Math.max(C,1),completedFiles:l,failedFiles:0,currentName:"",bytesTotal:i,bytesSent:i,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:[]},g("success",_)}else if(l>0){const _=`Uploaded ${l}; ${u.length} failed. ${u[0]}`;V={phase:"done",totalFiles:Math.max(C,1),completedFiles:l,failedFiles:u.length,currentName:"",bytesTotal:i,bytesSent:i,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:u.slice(0,12)},g("info",_)}else if(n>0&&u.length===0&&a.length>0){const _=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;V={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:[]},g("success",_)}else{const _=u[0]||"Upload failed";V={phase:"error",totalFiles:Math.max(C,1),completedFiles:0,failedFiles:u.length,currentName:"",bytesTotal:i,bytesSent:0,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:u.slice(0,12)},g("error",_)}}catch(x){_a();const C=x instanceof Error?x.message:"Upload failed";V={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:l,failedFiles:Math.max(u.length,1),currentName:"",bytesTotal:i,bytesSent:y,startedAt:m,elapsedSec:Math.floor((Date.now()-m)/1e3),resultMessage:C,errorSamples:u.length?u.slice(0,12):[C]},g("error",C)}finally{c=!1,p()}}function Tn(e,t){const a=e.files;if(!a||a.length===0)return;const r=Rn(a,t);e.value="",Vs(r)}async function il(e){if(j===null)return;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("access")??"read");Se=!0,c=!0,T(),p();try{await A.share(j,a,r),await Ba(j),g("success",`Shared with ${a}`)}catch(i){g("error",i instanceof Error?i.message:"Share failed")}finally{c=!1,p()}}function Ja(e){if(!k)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');k={...k,summary:String(t.get("summary")??k.summary),description:String(t.get("description")??k.description),location:String(t.get("location")??k.location),instanceId:Number(t.get("instanceId"))||k.instanceId,allDay:(a==null?void 0:a.checked)??k.allDay,start:String(t.get("start")??k.start??""),end:String(t.get("end")??k.end??"")||null,repeat:Ya(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function Ya(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),r=String(e.get("repeatEndMode")??"never"),i=r==="until"||r==="count"?r:"never";let m=null,n=null;if(i==="until"){const u=String(e.get("repeatUntil")??"").trim();m=u?u.slice(0,10):null}else if(i==="count"){const u=Number(e.get("repeatCount")??0);n=Number.isFinite(u)&&u>0?Math.min(999,Math.round(u)):10}const l=e.getAll("repeatByDay").map(u=>String(u).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:m,count:n,byDay:l,endMode:i}}async function ol(e){if(!k||!k.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("location")??"").trim(),m=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),l=String(t.get("end")??"").trim(),u=Number(t.get("instanceId"))||k.instanceId,b=Ya(t);if(!a){g("error","Title is required"),p();return}if(!n){g("error","Start is required"),p();return}let y,w;if(m)y=n.slice(0,10),w=l?l.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const _=Us(n,l||null);y=new Date(_.start).toISOString(),w=_.end?new Date(_.end).toISOString():null}else y=new Date(n).toISOString(),w=l?new Date(l).toISOString():null;const O=k.instanceId,x=k.uri,C=mt;c=!0,T(),Dt=!0,p(),E.event(C?"event.create":"event.update",{instanceId:u,uri:C?null:x,allDay:m,summary:a});try{const _={summary:a,description:r,location:i,allDay:m,start:y,end:w,instanceId:u,repeat:b},Q=C?await A.createEvent(u,_):await A.updateEvent(O,x,_);(j===null||Q.event.instanceId!==j)&&(j=Q.event.instanceId),await ot(),Dt=!1,k=null,mt=!1,F=null,E.event(C?"event.created":"event.saved",{uri:Q.event.uri,instanceId:Q.event.instanceId}),g("success",C?"Event created":"Event saved")}catch(_){E.warn("event.save failed",_ instanceof Error?_.message:_),g("error",_ instanceof Error?_.message:"Save failed")}finally{c=!1,p()}}async function dl(e){if(j===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),i=String(t.get("color")??"").trim();c=!0,T(),p();try{const m=await A.updateCalendar(j,{displayname:a,description:r,color:i});Se=!0,await it(),j=m.calendar.id,await Ba(j),await ot(),g("success","Calendar updated")}catch(m){g("error",m instanceof Error?m.message:"Update failed")}finally{c=!1,p()}}async function cl(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),i=String(t.get("color")??"").trim(),m=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),l=t.get("readOnly")==="on";if(He=!0,m&&!n){g("error","Select a country for the holidays calendar"),p();return}if(!m&&!a){g("error","Display name is required"),p();return}c=!0,T(),p();try{const u=await A.createCalendar({displayname:a,description:r,color:i,holidays:m,holidayCountry:m?n:void 0,readOnly:l});j=u.calendar.id,ae.includes(u.calendar.id)||(ae=[...ae,u.calendar.id]),He=!1,await it();let b=`Created “${u.calendar.displayname}”`;const y=u.holidayImport??u.calendar.holidayImport;y&&(b+=`. Holidays imported: ${Js(y)}.`),l&&(b+=" Calendar is read-only."),g("success",b)}catch(u){He=!0,g("error",u instanceof Error?u.message:"Create failed")}finally{c=!1,p()}}async function ul(e){var r,i,m;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&E.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){K&&(K.phase==="done"||K.phase==="error")&&hn();return}if(a==="close-files-upload-progress"){V&&(V.phase==="done"||V.phase==="error")&&vn();return}if(a==="files-upload-menu-toggle"){if(c||V)return;ye=!ye,ye&&(Le=null,Ce=null,Ct(),Ze=!1),p();return}if(a==="files-upload-files"){Nn("files");return}if(a==="files-upload-folder"){Nn("folder");return}if(a==="logout"){c=!0,E.event("logout");try{await A.logout()}catch{}rs(),T(),p();return}if(a==="select-cal"||a==="toggle-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;or(n),c=!0,T(),p();try{await ot()}catch(l){g("error",l instanceof Error?l.message:"Failed to load calendar")}finally{c=!1,p()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ce.find(u=>u.id===n&&u.canShare))return;j=n,ae.includes(n)||(ae=[...ae,n]),Se=!0,We=null,c=!0,T(),p();try{await Ba(n),await ot()}catch(u){g("error",u instanceof Error?u.message:"Failed to open calendar")}finally{c=!1,p()}return}if(a==="close-cal-modal"){Se=!1,p();return}if(a==="open-create-cal-modal"){He=!0,Se=!1,We=null,T(),p();return}if(a==="close-create-cal-modal"){He=!1,T(),p();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ce.find(u=>u.id===n&&u.canShare))return;We=n,Se=!1,T(),p();return}if(a==="cancel-delete-cal"){We=null,p();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),l=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(l!=null&&l.checked))return;c=!0,T(),p();try{if(await A.deleteCalendar(n),j===n&&(j=null),ae=ae.filter(u=>u!==n),We=null,Se=!1,la=[],ia=[],await it(),j===null){const u=cn();u?(j=u.id,ae.includes(u.id)||(ae=[...ae,u.id]),await ot()):ae.length>0&&(j=ae[0],await ot())}g("success","Calendar deleted")}catch(u){g("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,p()}return}if(a==="month-today"){const n=new Date;Mt={y:n.getFullYear(),m:n.getMonth()},Fa=null,c=!0,p();try{await ot()}finally{c=!1,p()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,l=new Date(Mt.y,Mt.m+n,1);Mt={y:l.getFullYear(),m:l.getMonth()},Fa=null,c=!0,p();try{await ot()}finally{c=!1,p()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;c=!0,T(),p();try{const u=await A.getEvent(n,l);k={...u.event,repeat:u.event.repeat??ps()},mt=!1,Dt=!0,F=null,Se=!1,We=null}catch(u){g("error",u instanceof Error?u.message:"Failed to open event")}finally{c=!1,p()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";Fa=Fa===n?null:n,p();return}if(a==="new-event-day"){const n=e.target;if((r=n==null?void 0:n.closest)!=null&&r.call(n,".month-event, .month-event-more"))return;const l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;if(j===null){g("error","Select a calendar first"),p();return}const u=ce.find(b=>b.id===j);if(!u||u.readOnly||!(u.canShare||u.access==="readwrite")){g("error","This calendar is read-only"),p();return}mt=!0,k=$r(l,j),Dt=!0,F=null,Se=!1,We=null,T(),p();return}if(a==="close-event-modal"){Dt=!1,k=null,mt=!1,F=null,T(),p();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const l=s.querySelector('[data-form="edit-event"]');if(l&&k&&Ja(l),(F==null?void 0:F.field)===n)F=null;else{const u=t.dataset.dtDateOnly==="1",b=t.dataset.dtClear!=="0",y=t.dataset.dtName||n;let w=Rs(n);!w&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(w=ja().start);const O=za(w||we(new Date)),[x,C]=O.date.split("-").map(Number);F={field:n,viewY:x,viewM:(C||1)-1,dateOnly:u,allowClear:b,name:y}}p();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!F)return;const n=a==="dt-month-prev"?-1:1,l=new Date(F.viewY,F.viewM+n,1);F={...F,viewY:l.getFullYear(),viewM:l.getMonth()},p();return}if(a==="dt-pick-day"){if(!F)return;const n=F.field,l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Ja(u);const b=F.dateOnly;if(b)gt(n,l),F=null;else{const y=Rs(n),w=za(y||ja(l).start).hm;gt(n,`${l}T${w}`),F={...F,viewY:Number(l.slice(0,4)),viewM:Number(l.slice(5,7))-1}}if(n==="start"&&k&&!b&&k.end){const y=new Date(String(k.start)),w=new Date(String(k.end));!Number.isNaN(y.getTime())&&!Number.isNaN(w.getTime())&&w<=y&&gt("end",jt(new Date(y.getTime()+3600*1e3)))}p();return}if(a==="dt-pick-time"){if(!F||F.dateOnly)return;const n=F.field,l=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(l))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Ja(u);const b=Rs(n)||ja().start,w=`${za(b).date}T${l}`;if(gt(n,w),n==="start"&&k){k={...k,allDay:!1};const O=k.end?za(String(k.end)):null,x=new Date(w);(!O||new Date(`${O.date}T${O.hm}`)<=x)&&gt("end",jt(new Date(x.getTime()+3600*1e3)))}F=null,p();return}if(a==="dt-today"){if(!F)return;const n=F.field,l=s.querySelector('[data-form="edit-event"]');l&&k&&Ja(l);const u=we(new Date);if(F.dateOnly)gt(n,u);else{const b=ja(u);n==="start"?(gt("start",b.start),k&&!k.end&&gt("end",b.end)):n==="end"?gt("end",b.end):gt(n,b.start)}F=null,p();return}if(a==="dt-clear"){if(!F||!F.allowClear)return;const n=F.field,l=s.querySelector('[data-form="edit-event"]');l&&k&&Ja(l),gt(n,null),F=null,p();return}if(a==="event-allday-toggle"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]'),l=t.checked;if(n){const u=new FormData(n),b=String(u.get("start")??k.start??""),y=String(u.get("end")??k.end??"")||null;let w=b,O=y;if(l){const x=lr(b,y);w=x.start,O=x.end}else{const x=b.slice(0,10),C=(y||b).slice(0,10),_=Us(x,C);w=_.start,O=_.end}k={...k,summary:String(u.get("summary")??k.summary),description:String(u.get("description")??k.description),location:String(u.get("location")??k.location),instanceId:Number(u.get("instanceId"))||k.instanceId,allDay:l,start:w,end:O,repeat:Ya(u)}}else k={...k,allDay:l};F=null,p();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const l=new FormData(n),u=n.querySelector('input[name="allDay"]'),b=Ya(l);k={...k,summary:String(l.get("summary")??k.summary),description:String(l.get("description")??k.description),location:String(l.get("location")??k.location),instanceId:Number(l.get("instanceId"))||k.instanceId,allDay:(u==null?void 0:u.checked)??k.allDay,start:String(l.get("start")??k.start??""),end:String(l.get("end")??k.end??"")||null,repeat:b,hasRrule:!!String(l.get("repeatFreq")??"").trim()},b.freq&&b.endMode==="until"&&(F==null?void 0:F.field)==="end"&&(F=null),p();return}if(a==="delete-event"){if(!k||!k.canWrite||mt||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=k.instanceId,l=k.uri;c=!0,T(),p();try{await A.deleteEvent(n,l),Dt=!1,k=null,await ot(),g("success","Event deleted")}catch(u){g("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,p()}return}if(a==="info"){const n=t.dataset.info??"";yl(n);return}if(a==="info-close"){xn();return}if(a==="flash-close"){T(),p();return}if(a==="user-menu-toggle"){e.stopPropagation(),Re=!Re,p();return}if(a==="user-menu-close"){Re&&(Re=!1,p());return}if(a==="tab"){const n=Zs(t.dataset.tab);n&&(n==="admin"&&(v="overview"),await on(n));return}if(a==="admin-page"){const n=Cs(t.dataset.adminPage);n&&await rn(n);return}if(a==="admin-refresh"){if(!xe()||h!=="admin")return;c=!0,T(),p();try{await ls(),g("success","Overview refreshed")}catch(n){g("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,p()}return}if(a==="admin-users-refresh"){if(!xe()||h!=="admin")return;c=!0,T(),p();try{await ua(),J&&await Tt(J),g("success","Users refreshed")}catch(n){g("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,p()}return}if(a==="admin-user-view"){const n=t.dataset.username??"";if(!n||!xe())return;c=!0,T(),J=n,v="users",yt("admin","users",n),p();try{await Tt(n),await ma(n)}catch(l){g("error",l instanceof Error?l.message:"Failed to load user")}finally{c=!1,p()}return}if(a==="admin-user-close"){J=null,H=null,Fe=null,Me=!1,yt("admin","users",null),p();return}if(a==="admin-user-create-open"){if(!xe())return;Ke=!0,Me=!1,wt=null,T(),p();return}if(a==="admin-user-create-close"){Ke=!1,p();return}if(a==="admin-user-edit-open"){if(!xe())return;const n=t.dataset.username??J??"";if(!n)return;c=!0,T(),Ke=!1,wt=null,J=n,v="users",yt("admin","users",n),p();try{(!H||H.username.toLowerCase()!==n.toLowerCase())&&await Tt(n),Me=!0}catch(l){g("error",l instanceof Error?l.message:"Failed to load user")}finally{c=!1,p()}return}if(a==="admin-user-edit-close"){Me=!1,p();return}if(a==="admin-user-delete-open"){if(!xe())return;const n=t.dataset.username??J??"";if(!n)return;wt=n,Pt=!1,Ke=!1,Me=!1,T(),p();return}if(a==="admin-user-delete-close"){wt=null,Pt=!1,p();return}if(a==="admin-user-delete-toggle"){Pt=!!t.checked,p();return}if(a==="admin-user-delete-confirm"){if(!xe())return;const n=t.dataset.username??wt??"";if(!n||!Pt)return;c=!0,T(),p();try{await A.adminDeleteUser(n,!0),E.event("admin.user.delete",{username:n}),wt=null,Pt=!1,Me=!1,(J==null?void 0:J.toLowerCase())===n.toLowerCase()&&(J=null,H=null,Ut=[],Ft=[],yt("admin","users",null)),await ua(),g("success",`Deleted user “${n}”`)}catch(l){g("error",l instanceof Error?l.message:"Delete failed")}finally{c=!1,p()}return}if(a==="admin-cal-create"){tt="create",ea=null,p();return}if(a==="admin-cal-edit"){tt="edit",ea=Number(t.dataset.id),p();return}if(a==="admin-cal-close"){tt=null,ea=null,p();return}if(a==="admin-cal-delete"){Te={kind:"calendar",id:Number(t.dataset.id),label:t.dataset.label??"calendar"},p();return}if(a==="admin-ab-create"){ut="create",ta=null,p();return}if(a==="admin-ab-edit"){ut="edit",ta=Number(t.dataset.id),p();return}if(a==="admin-ab-close"){ut=null,ta=null,p();return}if(a==="admin-ab-delete"){Te={kind:"addressbook",id:Number(t.dataset.id),label:t.dataset.label??"address book",force:!1},p();return}if(a==="admin-ab-force-toggle"){(Te==null?void 0:Te.kind)==="addressbook"&&(Te={...Te,force:!!t.checked},p());return}if(a==="admin-resource-delete-close"){Te=null,p();return}if(a==="admin-resource-delete-confirm"){if(!J||!Te)return;const n=J,l=Te;c=!0,T(),p();try{l.kind==="calendar"?await A.adminDeleteUserCalendar(n,l.id,!0):await A.adminDeleteUserAddressBook(n,l.id,!0,!!l.force),Te=null,await ma(n),await Tt(n),g("success","Deleted")}catch(u){g("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,p()}return}if(a==="admin-settings-refresh"){c=!0,T(),p();try{await is(),g("success","Settings reloaded")}catch(n){g("error",n instanceof Error?n.message:"Reload failed")}finally{c=!1,p()}return}if(a==="admin-reset-open"){va=!0,kt=!1,at="",T(),p();return}if(a==="admin-reset-close"){va=!1,kt=!1,at="",p();return}if(a==="admin-reset-toggle"){kt=!!t.checked,p();return}if(a==="admin-reset-password"){at=t.value;const n=s.querySelector('[data-action="admin-reset-confirm"]');n&&(n.disabled=c||!kt||at.trim()==="");return}if(a==="admin-reset-confirm"){if(!kt)return;if(at.trim()===""){g("error","Re-enter your password to confirm Reset to Default"),p();return}c=!0,T(),p();try{const n=await A.adminResetToDefault(!0,at);E.event("admin.settings.reset-to-default"),va=!1,kt=!1,at="";const l=n.redirectUrl&&n.redirectUrl.startsWith("/")?n.redirectUrl:"/portal/install/";window.location.assign(l);return}catch(n){g("error",n instanceof Error?n.message:"Reset failed"),c=!1,p()}return}if(a==="admin-database-refresh"){c=!0,T(),p();try{await os(),g("success","Database settings reloaded")}catch(n){g("error",n instanceof Error?n.message:"Reload failed")}finally{c=!1,p()}return}if(a==="admin-db-backend"){na=t.value==="pgsql"?"pgsql":"sqlite",p();return}if(a==="admin-db-test"){const n=t.closest("form");Qn(n);return}if(a==="admin-db-confirm-close"){wa=!1,St="",ka=null,p();return}if(a==="admin-db-confirm-input"){St=t.value,p();const l=s.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const u=l.value.length;l.setSelectionRange(u,u)}return}if(a==="admin-db-confirm-save"){if(St.trim()!=="CONFIRM"||!ka)return;c=!0,T(),p();try{const n={...ka,confirm:"CONFIRM"},l=await A.adminUpdateDatabaseSettings(n);sa=l.data,wa=!1,St="",ka=null,na=(l.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",E.event("admin.database.save",{backend:l.data.backend}),g("success","Database settings saved")}catch(n){g("error",n instanceof Error?n.message:"Database save failed")}finally{c=!1,p()}return}if(a==="files-nav"){$e=t.dataset.path??"",Le=null,Ce=null,ve=null,Ze=!1,be=[],c=!0,T(),p();try{await xt()}catch(l){g("error",l instanceof Error?l.message:"Failed to open folder")}finally{c=!1,p()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?be.includes(n)||(be=[...be,n]):be=be.filter(u=>u!==n),p();return}if(a==="files-select-all"){e.stopPropagation(),be=t.checked?pe.map(l=>l.path):[],p();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;cs("copy",[n]);return}if(a==="files-move"){const n=t.dataset.path??"";if(!n)return;cs("move",[n]);return}if(a==="files-bulk-copy"){if(be.length===0)return;cs("copy",[...be]);return}if(a==="files-bulk-move"){if(be.length===0)return;cs("move",[...be]);return}if(a==="files-tree-select"){if(e.preventDefault(),e.stopPropagation(),!ve)return;const n=t.dataset.path??"";if(ds(n,ve.paths))return;qt=n,p();return}if(a==="files-tree-toggle"||a==="files-tree-retry"){if(e.preventDefault(),e.stopPropagation(),!ve)return;const n=t.dataset.path??"";if(a==="files-tree-retry"){const u={...lt};delete u[n],lt=u,bt.includes(n)||(bt=[...bt,n]),Ls(n);return}bt.includes(n)?(bt=bt.filter(u=>u!==n),p()):(bt=[...bt,n],Ls(n));return}if(a==="files-transfer-close"){Ct(),p();return}if(a==="files-bulk-delete"){if(be.length===0)return;Ce=[...be],Le=null,Ct(),p();return}if(a==="files-refresh"){c=!0,T(),p();try{await xt(),g("success","Refreshed")}catch(n){g("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,p()}return}if(a==="files-mkdir"){Ze=!0,ye=!1,Xe(),da=!1,Le=null,Ce=null,Ct(),T(),p();return}if(a==="files-mkdir-close"){Ze=!1,p();return}if(a==="files-rename-open"){Le=t.dataset.path??null,Ce=null,Ct(),ye=!1,Xe(),p();return}if(a==="files-rename-close"){Le=null,p();return}if(a==="files-delete-open"){const n=t.dataset.path??"";Ce=n?[n]:null,Le=null,Ct(),ye=!1,Xe(),p();return}if(a==="files-delete-close"){Ce=null,p();return}if(a==="files-delete-confirm"){const n=Ce?[...Ce]:[];if(n.length===0)return;c=!0,T(),p();try{if(n.length===1)await A.filesDelete(n[0]),E.event("files.delete",{path:n[0]}),g("success","Deleted");else{const l=await A.filesBulk("delete",n);E.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?g("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?g("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):g("error",l.errors[0]||"Delete failed")}Ce=null,be=[],await xt()}catch(l){g("error",l instanceof Error?l.message:"Delete failed")}finally{c=!1,p()}return}if(a==="files-download"){E.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){zt===n?_t=_t==="asc"?"desc":"asc":(zt=n,_t=n==="due"||n==="summary"?"asc":"desc"),c=!0,p();try{await Wt()}catch(l){g("error",l instanceof Error?l.message:"Sort failed")}finally{c=!1,p()}}else{Na===n?pa=pa==="asc"?"desc":"asc":(Na=n,pa="asc"),c=!0,p();try{await Ta()}catch(l){g("error",l instanceof Error?l.message:"Sort failed")}finally{c=!1,p()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=Ue.find(b=>b.instanceId===n&&b.uri===l)??null;le=!1,Be=ge(n,l),G=u?{...u}:null,T(),p();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=ge(n,l),b=Ue.find(y=>ge(y.instanceId,y.uri)===u);if(!b||!b.canWrite||b.readOnly)return;De.includes(u)?De=De.filter(y=>y!==u):De=[...De,u],p();return}if(a==="task-select-all"){e.preventDefault();const n=Ue.filter(u=>u.canWrite&&!u.readOnly);n.length>0&&n.every(u=>De.includes(ge(u.instanceId,u.uri)))?De=[]:De=n.map(u=>ge(u.instanceId,u.uri)),p();return}if(a==="bulk-task-clear"){De=[],p();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Qr(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=Ea.find(b=>b.instanceId===n&&b.uri===l)??null;_e=!1,ft=ge(n,l),ue=u?{...u}:null,T(),p();return}if(a==="new-task"){le=!0,Be=null,G={uri:"",instanceId:((i=Vt[0])==null?void 0:i.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-subtask"){if(!G||le||!G.uid||!G.canWrite)return;const n=G;le=!0,Be=null,G={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-note"){_e=!0,ft=null,ue={uri:"",instanceId:((m=Bt[0])==null?void 0:m.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="cancel-task"){le=!1,G=null,Be=null,p();return}if(a==="cancel-note"){_e=!1,ue=null,ft=null,p();return}if(a==="delete-task"){if(!G||le||!confirm("Delete this task? CalDAV clients will sync the removal."))return;c=!0,T(),p();try{await A.deleteTask(G.instanceId,G.uri),Be=null,G=null,await Wt(),g("success","Task deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,p()}return}if(a==="delete-note"){if(!ue||_e||!confirm("Delete this note? CalDAV clients will sync the removal."))return;c=!0,T(),p();try{await A.deleteNote(ue.instanceId,ue.uri),ft=null,ue=null,await Ta(),g("success","Note deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,p()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;W=n,pt=!1,fe=null,I=null,he=!1,Ie=!1,oa="",Nt=[],Pe=null,Qe=null,nt=!1,T(),c=!0,p();try{await Ht(n)}catch(l){g("error",l instanceof Error?l.message:"Failed to load contacts")}finally{c=!1,p()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!Ve.find(b=>b.id===n))return;const u=W!==n;W=n,pt=!0,Ie=!1,T(),u&&(fe=null,I=null,he=!1,oa="",Nt=[],Pe=null,Qe=null,nt=!1),c=!0,p();try{u&&await Ht(n)}catch(b){g("error",b instanceof Error?b.message:"Failed to open address book")}finally{c=!1,p()}return}if(a==="close-ab-modal"){pt=!1,p();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;T();try{await vr(n)}catch(l){g("error",l instanceof Error?l.message:"Failed to load contact")}p();return}if(a==="new-contact"){if(W===null)return;wr(),T(),p();return}if(a==="cancel-contact"||a==="close-contact-modal"){he=!1,Ie=!1,I=null,fe=null,Pe=null,Qe=null,nt=!1,F=null,T(),p();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;gs(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),p();return}if(a==="remove-email"){if(!I)return;gs();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const l=Array.isArray(I.emails)?I.emails:[""];I.emails=l.filter((u,b)=>b!==n),I.emails.length===0&&(I.emails=[""]),p();return}if(a==="remove-phone"){if(!I)return;gs();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const l=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=l.filter((u,b)=>b!==n),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),p();return}if(a==="remove-custom"){if(!I)return;gs();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((l,u)=>u!==n),p();return}if(a==="remove-photo"){Pe=null,Qe=null,nt=!0,I&&(I.hasPhoto=!1),p();return}if(a==="delete-contact"){if(W===null||!fe||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;c=!0,T(),Ie=!0,p();try{await A.deleteContact(W,fe),fe=null,I=null,he=!1,Ie=!1,F=null,Pe=null,await it(),g("success","Contact deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,p()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??W);if(!Number.isFinite(n)||!Ve.find(u=>u.id===n))return;st=n,pt=!1,Ie=!1,T(),p();return}if(a==="cancel-delete-ab"){st=null,p();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),l=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(l!=null&&l.checked))return;const u=Ve.find(y=>y.id===n);if(!u)return;const b=(u.cardCount??0)>0;c=!0,T(),p();try{await A.deleteAddressBook(n,b),W===n&&(W=null,Nt=[],I=null,fe=null,he=!1),st=null,pt=!1,Ie=!1,await it(),W===null&&Ve.length>0&&(W=Ve[0].id,await Ht(W)),g("success","Address book deleted")}catch(y){g("error",y instanceof Error?y.message:"Delete failed")}finally{c=!1,p()}return}if(a==="export-ab"){e.stopPropagation();const n=t.dataset.id,l=n!==void 0&&n!==""?Number(n):W;if(l===null||Number.isNaN(l))return;c=!0,T(),p();try{const{blob:u,filename:b}=await A.exportAddressBook(l),y=await Bs(u,b);y==="cancelled"?g("info","Export cancelled"):y==="saved"?g("success",`Saved ${b}`):g("success",`Download started: ${b}`)}catch(u){g("error",u instanceof Error?u.message:"Export failed")}finally{c=!1,p()}return}if(a==="export-contact"){if(W===null||!fe||he)return;Ie=!0,c=!0,T(),p();try{const{blob:n,filename:l}=await A.exportContact(W,fe),u=await Bs(n,l);u==="cancelled"?g("info","Export cancelled"):u==="saved"?g("success",`Saved ${l}`):g("success",`Download started: ${l}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{c=!1,p()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||j===null||!confirm("Revoke access for this user?"))return;Se=!0,c=!0,T(),p();try{await A.revoke(j,n),await Ba(j),g("success","Share revoked")}catch(l){g("error",l instanceof Error?l.message:"Revoke failed")}finally{c=!1,p()}return}if(a==="export-cal"){e.stopPropagation();const n=t.dataset.id,l=n!==void 0&&n!==""?Number(n):j;if(l===null||Number.isNaN(l))return;c=!0,T(),p();try{const{blob:u,filename:b}=await A.exportCalendar(l),y=await Bs(u,b);y==="cancelled"?g("info","Export cancelled"):y==="saved"?g("success",`Saved ${b}`):g("success",`Download started: ${b}`)}catch(u){g("error",u instanceof Error?u.message:"Export failed")}finally{c=!1,p()}}}async function Bs(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const n=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await n.write(e)}finally{await n.close()}return"saved"}catch(m){if(m instanceof DOMException&&m.name==="AbortError")return"cancelled"}const r=URL.createObjectURL(e),i=document.createElement("a");return i.href=r,i.download=t,i.rel="noopener",i.style.display="none",document.body.appendChild(i),i.click(),window.setTimeout(()=>{URL.revokeObjectURL(r),i.remove()},6e4),"started"}function ml(){const e=s.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{$l(e)});const t=s.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{vl(t)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{pl(a)})}async function pl(e){var r;if(W===null)return;const t=(r=e.files)==null?void 0:r[0];if(e.value="",!t)return;const a=W;pt=!0,c=!0,T(),Et(),K={kind:"contacts",fileName:t.name,fileSizeLabel:fs(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},gn(),p();try{const i=await Dn(t,l=>{if(!K||K.phase!=="reading")return;K={...K,readPercent:l};const u=s.querySelector(".import-progress-bar"),b=s.querySelector("[data-import-status-line]");u&&l!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${l}%`),b&&l!==null&&(b.textContent=`Reading file… ${l}%`)});Kt("uploading",{readPercent:100}),Kt("processing",{processPercent:0}),E.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const m=await A.importAddressBook(a,i,l=>{yn(l)}),n=Js(m);await it(),W===a&&await Ht(a),Et(),Kt("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),g("success",`Import finished for “${t.name}”: ${n}.`)}catch(i){const m=i instanceof Error?i.message:"Import failed";Et(),Kt("error",{ok:!1,resultMessage:m}),g("error",m)}finally{c=!1,p()}}function gs(){if(!I)return;const e=s.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);I.firstname=String(t.get("firstname")??""),I.lastname=String(t.get("lastname")??""),I.fullname=String(t.get("fullname")??""),I.org=String(t.get("org")??""),I.title=String(t.get("title")??""),I.url=String(t.get("url")??""),I.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const r=[];let i=0;for(;t.has(`email_${i}`);)r.push(String(t.get(`email_${i}`)??"")),i++;r.length&&(I.emails=r);const m=[];for(i=0;t.has(`phone_value_${i}`);)m.push({type:String(t.get(`phone_type_${i}`)??"other"),value:String(t.get(`phone_value_${i}`)??"")}),i++;m.length&&(I.phones=m);const n=[];for(i=0;t.has(`custom_label_${i}`)||t.has(`custom_value_${i}`);)n.push({label:String(t.get(`custom_label_${i}`)??""),value:String(t.get(`custom_value_${i}`)??"")}),i++;I.custom=n}function fl(e){const t=new FormData(e),a=[];let r=0;for(;t.has(`email_${r}`);){const l=String(t.get(`email_${r}`)??"").trim();l&&a.push(l),r++}const i=[];for(r=0;t.has(`phone_value_${r}`);){const l=String(t.get(`phone_value_${r}`)??"").trim();l&&i.push({type:String(t.get(`phone_type_${r}`)??"other"),value:l}),r++}const m=[];for(r=0;t.has(`custom_label_${r}`)||t.has(`custom_value_${r}`);){const l=String(t.get(`custom_label_${r}`)??"").trim(),u=String(t.get(`custom_value_${r}`)??"").trim();(l||u)&&m.push({label:l,value:u}),r++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:i,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const l=String(t.get("birthday")??"").trim();return l&&/^\d{4}-\d{2}-\d{2}/.test(l)?l.slice(0,10):null})(),custom:m};return nt?n.removePhoto=!0:Qe&&(n.photoBase64=Qe),n}async function bl(e){if(W===null)return;const t=fl(e);c=!0,T(),Ie=!0,p();try{if(he){const a=await A.createContact(W,t);he=!1,fe=a.contact.uri,I=null,Ie=!1,Pe=null,Qe=null,nt=!1,F=null,g("success","Contact created")}else fe&&(fe=(await A.updateContact(W,fe,t)).contact.uri,I=null,Ie=!1,Pe=null,Qe=null,nt=!1,F=null,g("success","Contact saved"));try{await it()}catch(a){if(console.error(a),W!==null)try{await Ht(W)}catch{}}}catch(a){g("error",a instanceof Error?a.message:"Save failed")}finally{c=!1,p()}}async function gl(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();if(a){c=!0,T(),p();try{const i=await A.createAddressBook({displayname:a,description:r});W=i.addressbook.id,fe=null,I=null,he=!1,oa="",await it(),g("success",`Address book “${i.addressbook.displayname}” created`)}catch(i){g("error",i instanceof Error?i.message:"Create failed")}finally{c=!1,p()}}}async function hl(e){if(W===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();pt=!0,c=!0,T(),p();try{await A.updateAddressBook(W,{displayname:a,description:r}),await it(),g("success","Address book updated")}catch(i){g("error",i instanceof Error?i.message:"Update failed")}finally{c=!1,p()}}function yl(e){const t=zl[e];if(!t)return;const a=s.querySelector("#info-modal"),r=s.querySelector("#info-modal-title"),i=s.querySelector("#info-modal-body");if(!a||!r||!i)return;r.textContent=t.title,i.innerHTML=t.paragraphs.map(n=>`<p>${o(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const m=a.querySelector(".info-modal-close");m==null||m.focus()}function xn(){const e=s.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function $l(e){var a;if(j===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(Se=!0,await _n(j,t,{keepEditModalOpen:!0}))}async function vl(e){var b;const t=(b=e.files)==null?void 0:b[0];if(e.value="",!t)return;const a=s.querySelector('[data-form="create-cal"]'),r=a?new FormData(a):new FormData,i=r.get("holidays")==="on",m=r.get("readOnly")==="on";if(i){g("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),He=!0,p();return}if(m){g("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),He=!0,p();return}let n=String(r.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const l=String(r.get("description")??""),u=String(r.get("color")??"").trim();c=!0,T(),He=!0,p();try{const y=await A.createCalendar({displayname:n,description:l,color:u,readOnly:!1});j=y.calendar.id,He=!1,await it(),g("success",`Created “${y.calendar.displayname}” — importing…`),await _n(y.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const w=y instanceof Error?y.message:"Create or import failed";He=!0,g("error",w),c=!1,p()}}async function _n(e,t,a={}){c=!0,T(),Et(),K={kind:"calendar",fileName:t.name,fileSizeLabel:fs(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},gn(),p();try{const r=await Dn(t,n=>{if(!K||K.phase!=="reading")return;K={...K,readPercent:n};const l=s.querySelector(".import-progress-bar"),u=s.querySelector("[data-import-status-line]");l&&n!==null&&(l.classList.remove("is-indeterminate"),l.style.width=`${n}%`),u&&n!==null&&(u.textContent=`Reading file… ${n}%`)});Kt("uploading",{readPercent:100}),Kt("processing",{processPercent:0}),E.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const i=await A.importCalendar(e,r,n=>{yn(n)}),m=Js(i);j===e&&await ot(),Et(),Kt("done",{ok:!0,resultMessage:`${m} (from “${t.name}”)`}),g("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${m}.`)}catch(r){const i=r instanceof Error?r.message:"Import failed";Et(),Kt("error",{ok:!1,resultMessage:i}),g("error",i)}finally{a.keepEditModalOpen&&(Se=!0),c=!1,p()}}sr()}let Zt="",M=null,oe=!1,$t=null,Ot=null,Xt="sqlite",As=!1;async function Es(s,d={}){const f={Accept:"application/json",...d.headers};d.body&&(f["Content-Type"]="application/json"),Zt&&d.method&&d.method!=="GET"&&(f["X-CSRF-Token"]=Zt);const h=await fetch(`/api/install${s}`,{credentials:"same-origin",...d,headers:f});let v;try{v=await h.json()}catch{throw new Error(`Request failed (${h.status})`)}if(!h.ok)throw new Error(v.error||`Request failed (${h.status})`);return v&&typeof v=="object"&&"data"in v&&v.data!==void 0?v.data:v}async function tn(){var s;M=await Es("/status"),Zt=M.csrfToken||Zt,((s=M.defaults)==null?void 0:s.backend)==="pgsql"?Xt="pgsql":Xt="sqlite"}function Ga(s,d,f){return`<label class="check-row"><input type="checkbox" name="${o(s)}" ${d?"checked":""} ${oe?"disabled":""} /> ${o(f)}</label>`}function Wl(){const s=M==null?void 0:M.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${o((s==null?void 0:s.configPath)||"—")} ${s!=null&&s.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${o((s==null?void 0:s.specificPath)||"—")} ${s!=null&&s.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${Lt("error",(M==null?void 0:M.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${oe?"disabled":""}>Retry</button>
  </section>`}function Jl(){const s=M==null?void 0:M.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${oe?"disabled":""}>
          ${Bn((s==null?void 0:s.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ga("cal_enabled",(s==null?void 0:s.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ga("card_enabled",(s==null?void 0:s.card_enabled)!==!1,"Enable CardDAV")}
      ${Ga("tasks_enabled",(s==null?void 0:s.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ga("notes_enabled",!!(s!=null&&s.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ga("files_enabled",!!(s!=null&&s.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${oe?"disabled":""}>
          ${["Digest","Basic","Apache"].map(d=>`<option value="${d}" ${((s==null?void 0:s.dav_auth_type)||"Digest")===d?"selected":""}>${d}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${o((s==null?void 0:s.invite_from)||"")}" ${oe?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${o(String((s==null?void 0:s.session_max_age_minutes)??15))}" ${oe?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${oe?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function Yl(){const s=M==null?void 0:M.defaults,d=(M==null?void 0:M.pdoDrivers)||[],f=d.includes("sqlite"),h=d.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${oe?"disabled":""}>
          ${f?`<option value="sqlite" ${Xt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${h?`<option value="pgsql" ${Xt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Xt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${o((s==null?void 0:s.sqlite_file)||"")}" class="mono" ${oe?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Xt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${o((s==null?void 0:s.pgsql_host)||"")}" placeholder="localhost:5432" ${oe?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${o((s==null?void 0:s.pgsql_dbname)||"")}" ${oe?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${o((s==null?void 0:s.pgsql_username)||"")}" autocomplete="off" ${oe?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${oe?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${oe?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function Kl(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${o(String((M==null?void 0:M.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${o((M==null?void 0:M.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${As?"checked":""} ${oe?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${oe||!As?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function Gl(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${o((M==null?void 0:M.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function Ql(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${Lt("error",(M==null?void 0:M.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function vt(){const s=document.getElementById("app");if(!s)return;const d=(M==null?void 0:M.step)||"permissions";let f="";M?d==="permissions"?f=Wl():d==="initialize"?f=Jl():d==="database"?f=Yl():d==="upgrade"?f=Kl():d==="done"?f=Gl():d==="locked"?f=Ql():f=`<section class="card"><p>Unknown step: ${o(d)}</p></section>`:f='<section class="card"><p class="muted">Loading installer…</p></section>',s.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${o((M==null?void 0:M.productVersion)||"…")}</span>
            ${M!=null&&M.configuredVersion?` · configured <span class="mono">${o(String(M.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${M!=null&&M.step?`<span class="badge badge-admin">${o(M.step)}</span>`:""}
      </header>
      ${$t?Lt("error",$t,{dismissible:!1}):""}
      ${Ot?Lt("success",Ot,{dismissible:!1}):""}
      ${f}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,Xl()}function Xl(){var d,f,h,v,N,L;const s=document.getElementById("app");s&&((d=s.querySelector('[data-action="reload"]'))==null||d.addEventListener("click",()=>{Zl()}),(f=s.querySelector('[data-action="backend-change"]'))==null||f.addEventListener("change",R=>{Xt=R.target.value==="pgsql"?"pgsql":"sqlite",vt()}),(h=s.querySelector('[data-action="upgrade-toggle"]'))==null||h.addEventListener("change",R=>{As=!!R.target.checked,vt()}),(v=s.querySelector('[data-action="upgrade-run"]'))==null||v.addEventListener("click",()=>{ai()}),(N=s.querySelector('[data-form="initialize"]'))==null||N.addEventListener("submit",R=>{R.preventDefault(),ei(R.target)}),(L=s.querySelector('[data-form="database"]'))==null||L.addEventListener("submit",R=>{R.preventDefault(),ti(R.target)}))}async function Zl(){oe=!0,$t=null,vt();try{await tn(),Ot=null}catch(s){$t=s instanceof Error?s.message:"Failed to load installer status"}finally{oe=!1,vt()}}async function ei(s){const d=new FormData(s),f=v=>{var N;return!!((N=s.querySelector(`input[name="${v}"]`))!=null&&N.checked)},h={timezone:String(d.get("timezone")??"").trim(),cal_enabled:f("cal_enabled"),card_enabled:f("card_enabled"),tasks_enabled:f("tasks_enabled"),notes_enabled:f("notes_enabled"),files_enabled:f("files_enabled"),dav_auth_type:String(d.get("dav_auth_type")??"Digest"),invite_from:String(d.get("invite_from")??"").trim(),session_max_age_minutes:Number(d.get("session_max_age_minutes")??15),admin_password:String(d.get("admin_password")??""),admin_password_confirm:String(d.get("admin_password_confirm")??"")};oe=!0,$t=null,Ot=null,vt();try{M=await Es("/initialize",{method:"POST",body:JSON.stringify(h)}),Zt=M.csrfToken||Zt,Ot="Server settings saved. Configure the database next.",E.event("install.initialize")}catch(v){$t=v instanceof Error?v.message:"Initialize failed"}finally{oe=!1,vt()}}async function ti(s){const d=new FormData(s),f=String(d.get("backend")??Xt),h={backend:f,admin_password:String(d.get("admin_password")??""),admin_password_confirm:String(d.get("admin_password_confirm")??"")};f==="sqlite"?h.sqlite_file=String(d.get("sqlite_file")??"").trim():(h.pgsql_host=String(d.get("pgsql_host")??"").trim(),h.pgsql_dbname=String(d.get("pgsql_dbname")??"").trim(),h.pgsql_username=String(d.get("pgsql_username")??"").trim(),h.pgsql_password=String(d.get("pgsql_password")??"")),oe=!0,$t=null,Ot=null,vt();try{M=await Es("/database",{method:"POST",body:JSON.stringify(h)}),Zt=M.csrfToken||Zt,Ot="Database configured. Installer is locked.",E.event("install.database"),M.completed||M.step}catch(v){$t=v instanceof Error?v.message:"Database setup failed"}finally{oe=!1,vt()}}async function ai(){if(As){oe=!0,$t=null,Ot=null,vt();try{const s=await Es("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});Ot="Upgrade completed."+(s.messages&&s.messages.length?" "+s.messages.slice(0,3).join(" · "):""),E.event("install.upgrade"),await tn()}catch(s){$t=s instanceof Error?s.message:"Upgrade failed"}finally{oe=!1,vt()}}}async function si(s){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),s.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await tn()}catch(d){$t=d instanceof Error?d.message:"Failed to load installer"}vt()}const Gs=document.getElementById("app");if(!Gs)throw new Error("#app missing");const Pn=window.location.pathname.replace(/\/+$/,"")||"/";Pn==="/portal/install"||Pn.endsWith("/portal/install")?si(Gs):Hl(Gs);
