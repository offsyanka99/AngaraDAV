var qn=Object.defineProperty;var Rn=(e,t,a)=>t in e?qn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var Pt=(e,t,a)=>Rn(e,typeof t!="symbol"?t+"":t,a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();const Yt="angaradav-portal-theme";function ot(e){return e==="dark"||e==="light"?e:null}function Ja(e){return`${Yt}:${e}`}function Bn(e){try{if(e){const t=ot(localStorage.getItem(Ja(e)));if(t)return t}return ot(localStorage.getItem(Yt))??"dark"}catch{return"dark"}}function Hn(e,t){try{localStorage.setItem(Yt,e),t&&localStorage.setItem(Ja(t),e)}catch{}}function Vn(){return ot(document.documentElement.getAttribute("data-theme"))??"dark"}function Ga(e){const t=document.documentElement;t.setAttribute("data-theme",e),t.style.colorScheme=e;const a=document.querySelector('meta[name="color-scheme"]');a&&a.setAttribute("content",e)}function Jt(e){const t=Bn(e);return Ga(t),t}const ka={off:0,error:1,warn:2,info:3,debug:4};let Be="off";const dt="[angaradav-portal]";function jn(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function zn(e){return Be=jn(e),Be!=="off"&&console.info(dt,`log level = ${Be}`),Be}function Xa(e){return ka[Be]>=ka[e]}function Ze(e,t,a,s){if(!Xa(e))return;const n=[dt,a];s!==void 0&&n.push(s),console[t](...n)}function Kn(e,t){Xa("info")&&(t&&Object.keys(t).length>0?console.info(dt,`event:${e}`,t):console.info(dt,`event:${e}`))}const w={error(e,t){Ze("error","error",e,t)},warn(e,t){Ze("warn","warn",e,t)},info(e,t){Ze("info","info",e,t)},debug(e,t){Ze("debug","debug",e,t)},event:Kn};class L extends Error{constructor(a,s,n={}){super(a);Pt(this,"status");Pt(this,"payload");this.status=s,this.payload=n}}let Te="",nt=null,st=null;function rt(e){Te=e&&typeof e=="string"?e:""}function Wn(){return Te}function Yn(e){nt=e}function Jn(e){st=e}function $t(e){if(!Qa(e))try{st==null||st()}catch{}}function Qa(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function Ye(e,t){if(!Qa(e)){rt("");try{nt==null||nt(t||"Session timed out. Please sign in again.")}catch{}}}async function Gn(e){const t=typeof performance<"u"?performance.now():Date.now();w.debug(`api → GET ${e}`);const a=await fetch(`/api${e}`,{credentials:"same-origin"}),s=Math.round((typeof performance<"u"?performance.now():Date.now())-t);if(!a.ok){let r=`Request failed (${a.status})`,l={};try{const o=await a.json();l={...o},typeof o.error=="string"&&(r=o.error)}catch{}throw a.status>=500?w.error(`api ← GET ${e} ${a.status} (${s}ms)`,r):a.status!==401?w.warn(`api ← GET ${e} ${a.status} (${s}ms)`,r):(w.debug(`api ← GET ${e} 401 (${s}ms)`),Ye(e,r)),new L(r,a.status,l)}w.info(`api ← GET ${e} ${a.status} (${s}ms)`),$t(e);const n=a.headers.get("Content-Type")||"application/octet-stream";return{blob:await a.blob(),contentType:n}}async function D(e,t={}){const a=new Headers(t.headers);t.body&&!a.has("Content-Type")&&a.set("Content-Type","application/json");const s=(t.method||"GET").toUpperCase();s!=="GET"&&s!=="HEAD"&&s!=="OPTIONS"&&Te&&a.set("X-CSRF-Token",Te);const n=typeof performance<"u"?performance.now():Date.now();w.debug(`api → ${s} ${e}`);const i=await fetch(`/api${e}`,{...t,headers:a,credentials:"same-origin"});let r=null;const l=await i.text();if(l)try{r=JSON.parse(l)}catch{r={error:l}}const o=Math.round((typeof performance<"u"?performance.now():Date.now())-n);if(!i.ok){let c=`Request failed (${i.status})`,f={};if(r&&typeof r=="object"&&r!==null){const m=r;f={...m},typeof m.error=="string"&&(c=m.error)}else(i.status===500||i.status===504)&&(c="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw i.status>=500?w.error(`api ← ${s} ${e} ${i.status} (${o}ms)`,c):i.status!==401?w.warn(`api ← ${s} ${e} ${i.status} (${o}ms)`,c):(w.debug(`api ← ${s} ${e} 401 (${o}ms)`),Ye(e,c)),new L(c,i.status,f)}return w.info(`api ← ${s} ${e} ${i.status} (${o}ms)`),$t(e),r}function z(e){return encodeURIComponent(e)}async function Za(e,t,a,s){const n=new Headers({"Content-Type":a,Accept:"application/x-ndjson, application/json;q=0.9"});Te&&n.set("X-CSRF-Token",Te);const i=typeof performance<"u"?performance.now():Date.now();w.debug(`api → POST ${e} (stream, ${a}, ${t.length} bytes)`);let r;try{r=await fetch(`/api${e}`,{method:"POST",headers:n,credentials:"same-origin",body:t})}catch(u){const v=u instanceof Error?u.message:"Network error";throw w.error(`api ← POST ${e} network fail`,v),new L(`Import request failed to start (${v}). Check connectivity and container logs.`,0)}const l=(r.headers.get("Content-Type")||"").toLowerCase(),o=l.includes("ndjson")||l.includes("x-ndjson");if(!r.ok&&!o){let u=`Request failed (${r.status})`;try{const v=await r.json();v.error&&(u=v.error)}catch{}throw(r.status===504||r.status===502)&&(u="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),r.status===401?(w.debug(`api ← POST ${e} 401`,u),Ye(e,u)):w.warn(`api ← POST ${e} ${r.status}`,u),new L(u,r.status)}if(!o&&r.ok){try{const u=await r.json();if(u&&typeof u.error=="string")throw new L(u.error,r.status||500);if(u&&typeof u.imported=="number"&&typeof u.updated=="number")return w.info(`api ← POST ${e} json done`),u}catch(u){if(u instanceof L)throw u}throw new L("Unexpected import response from server",500)}if(!r.body)throw new L("Import stream unavailable",500);const c=r.body.getReader(),f=new TextDecoder;let m="";const b={final:null,error:null,sawProgress:!1},p=u=>{let v;try{v=JSON.parse(u)}catch{w.debug("import stream non-JSON line",u.slice(0,80));return}if(v.type==="progress"){b.sawProgress=!0;const $=Number(v.total)||0,S=Number(v.current)||0,C=typeof v.percent=="number"?v.percent:$>0?Math.round(100*S/$):0;s==null||s({percent:C,current:S,total:$,imported:Number(v.imported)||0,updated:Number(v.updated)||0,skipped:Number(v.skipped)||0})}else v.type==="done"&&v.result?b.final=v.result:v.type==="error"&&(b.error={message:v.error||"Import failed",status:v.status||500})};for(;;){const{done:u,value:v}=await c.read();if(u)break;m+=f.decode(v,{stream:!0});const $=m.split(`
`);m=$.pop()??"";for(const S of $){const C=S.trim();C&&p(C)}}m.trim()&&p(m.trim());const g=Math.round((typeof performance<"u"?performance.now():Date.now())-i);if(b.error)throw b.error.status===401?(w.debug(`api ← POST ${e} stream 401 (${g}ms)`,b.error.message),Ye(e,b.error.message)):w.warn(`api ← POST ${e} stream error (${g}ms)`,b.error.message),new L(b.error.message,b.error.status);if(!b.final)throw w.error(`api ← POST ${e} stream incomplete (${g}ms)`,{sawProgress:b.sawProgress}),new L(b.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return w.info(`api ← POST ${e} stream done (${g}ms)`),$t(e),b.final}const Xn={adminPing:()=>D("/admin/ping"),adminDashboard:()=>D("/admin/dashboard"),adminCapabilities:()=>D("/admin/capabilities"),adminUsers:()=>D("/admin/users"),adminUser:e=>D(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>D("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>D(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>D(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>D(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>D(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,a)=>D(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserCalendar:(e,t,a=!0)=>D(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a})}),adminUserAddressBooks:e=>D(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>D(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,a)=>D(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserAddressBook:(e,t,a=!0,s=!1)=>D(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a,force:s})}),adminSystemSettings:()=>D("/admin/settings/system"),adminUpdateSystemSettings:e=>D("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>D("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>D("/admin/settings/database"),adminTestDatabaseConnection:e=>D("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>D("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await D("/me");return rt(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)||""),e},login:async(e,t)=>{var s;const a=await D("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return rt((s=a.user)==null?void 0:s.csrfToken),a},logout:async()=>{try{return await D("/logout",{method:"POST"})}finally{rt("")}}},Qn={calendars:()=>D("/calendars"),createCalendar:e=>D("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>D("/holidays/countries"),updateCalendar:(e,t)=>D(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>D(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,a)=>{const s=new URLSearchParams({from:t,to:a}).toString();return D(`/calendars/${e}/events?${s}`)},getEvent:(e,t)=>D(`/calendars/${e}/events/${z(t)}`),createEvent:(e,t)=>D(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,a)=>D(`/calendars/${e}/events/${z(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteEvent:(e,t)=>D(`/calendars/${e}/events/${z(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new L(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:n}},importCalendar:(e,t,a)=>Za(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",a),directory:()=>D("/directory"),shares:e=>D(`/calendars/${e}/shares`),share:(e,t,a)=>D(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:a})}),revoke:(e,t)=>D(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})})},Zn={addressbooks:()=>D("/addressbooks"),createAddressBook:e=>D("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>D(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>D(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new L(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:n}},importAddressBook:(e,t,a)=>Za(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",a),contacts:(e,t="")=>{const a=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return D(`/addressbooks/${e}/contacts${a}`)},getContact:(e,t)=>D(`/addressbooks/${e}/contacts/${z(t)}`),createContact:(e,t)=>D(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,a)=>D(`/addressbooks/${e}/contacts/${z(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteContact:(e,t)=>D(`/addressbooks/${e}/contacts/${z(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const a=await fetch(`/api/addressbooks/${e}/contacts/${z(t)}/export`,{credentials:"same-origin"});if(!a.ok){let l=`Export failed (${a.status})`;try{const o=await a.json();o.error&&(l=o.error)}catch{}throw new L(l,a.status)}const s=a.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(s),i=(n==null?void 0:n[1])||"contact.vcf";return{blob:await a.blob(),filename:i}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${z(t)}/photo`},es={filesStatus:()=>D("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const a=t.toString()?`?${t}`:"";return D(`/files/entries${a}`)},filesMkdir:(e,t)=>D("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,a={})=>{const s=new URLSearchParams;e&&s.set("path",e),s.set("name",t.name),a.replace&&s.set("replace","1");const n=new FormData;n.append("file",t,t.name),e&&n.append("path",e);const i=typeof performance<"u"?performance.now():Date.now();return w.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((r,l)=>{const o=new XMLHttpRequest;o.open("POST",`/api/files/upload?${s}`),o.withCredentials=!0;const c=Wn();c&&o.setRequestHeader("X-CSRF-Token",c),a.onProgress&&(o.upload.onprogress=f=>{var m,b;f.lengthComputable?(m=a.onProgress)==null||m.call(a,f.loaded,f.total):(b=a.onProgress)==null||b.call(a,f.loaded,t.size||f.loaded)}),o.onload=()=>{const f=Math.round((typeof performance<"u"?performance.now():Date.now())-i);let m=null;const b=o.responseText||"";if(b)try{m=JSON.parse(b)}catch{m={error:b}}const p=o.status;if(p<200||p>=300){let g=`Upload failed (${p||0})`;m&&typeof m=="object"&&m!==null&&"error"in m&&typeof m.error=="string"&&(g=m.error),p===401?(w.debug(`api ← POST /files/upload 401 (${f}ms)`,g),Ye("/files/upload",g)):p>=500?w.error(`api ← POST /files/upload ${p} (${f}ms)`,g):w.warn(`api ← POST /files/upload ${p} (${f}ms)`,g),l(new L(g,p||0));return}w.info(`api ← POST /files/upload 200 (${f}ms)`),$t("/files/upload"),r(m)},o.onerror=()=>{const f=Math.round((typeof performance<"u"?performance.now():Date.now())-i);w.error(`api ← POST /files/upload network error (${f}ms)`),l(new L("Upload failed (network error)",0))},o.onabort=()=>{l(new L("Upload cancelled",0))},o.send(n)})},filesDownloadUrl:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),`/api/files/download?${a}`},filesGetBlob:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),Gn(`/files/download?${a}`)},filesDelete:e=>D("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>D("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,a)=>D("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:a})}),filesCopy:(e,t={})=>D("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>D("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},ts={tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return D(`/tasks${a}`)},createTask:e=>D("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,a)=>D(`/tasks/${e}/${z(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteTask:(e,t)=>D(`/tasks/${e}/${z(t)}`,{method:"DELETE"}),bulkTasks:e=>D("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return D(`/notes${a}`)},createNote:e=>D("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,a)=>D(`/notes/${e}/${z(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteNote:(e,t)=>D(`/notes/${e}/${z(t)}`,{method:"DELETE"})},as={ui:()=>D("/ui"),installStatus:async()=>{const e=await D("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e}},k={...as,...Xn,...Qn,...Zn,...ts,...es},en="angaradav-portal-tab",tn="angaradav-portal-admin-page",ns="angaradav-portal-cal-selection",Lt="2.3.1";function ss(e){const t=(e||Lt).trim(),a=t.indexOf("+");return a<=0?{version:t||Lt,build:""}:{version:t.slice(0,a),build:t.slice(a+1)}}const rs="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function is(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],calendarSelectionSeeded:!1,listKeyboardFocus:!1,shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},calView:"month",calFocusDay:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,eventSearch:"",eventSearchFocus:!1,monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,filesDropDepth:0,escapeBound:!1,portalEventsBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off",services:null},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:Lt,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,filesSearch:"",filesSearchFocus:!1,filesSort:"name",filesOrder:"asc",filesTypeFilter:"all",checkedFilePaths:[],filesItemMenu:null,filesItemMenuDocClick:null,filesItemMenuWinClose:null,filesPreview:null,filesPreviewSeq:0,filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ne(e,t,a={}){if(!t)return"";const s=a.dismissible!==void 0?a.dismissible:a.dismissAction!==void 0,n=a.dismissAction??"flash-close",i=a.role??"status",r=a.className?` ${a.className}`:"",l=a.style?` style="${d(a.style)}"`:"",o=s?`<button type="button" class="flash-close" data-action="${d(n)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${d(e)}${r}" role="${d(i)}"${l}>
      <span class="flash-text">${d(t)}</span>
      ${o}
    </div>`}function ls(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function os(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function Gt(e){return e.map(a=>{const s=a.type??"button",n=os(a.variant),i=a.disabled?" disabled":"",r=a.id?` id="${d(a.id)}"`:"",l=a.action?` data-action="${d(a.action)}"`:"",o=a.attrs?` ${a.attrs}`:"";return`<button type="${s}" class="${n}"${l}${r}${o}${i}>${d(a.label)}</button>`}).join(`
`)}function x(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=e.id?` id="${d(e.id)}"`:"",s=e.className?` ${e.className}`:"",n=e.rootAttrs?` ${e.rootAttrs}`:"",i=`${ls(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,r=e.closeAction,l=e.lockBackdrop?"":` data-action="${d(r)}"`,o=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${d(r)}" aria-label="Close">×</button>`;let c="";e.footer!==void 0&&(c=typeof e.footer=="string"?e.footer:Gt(e.footer));const f=c?`<footer class="cal-modal-footer">${c}</footer>`:"",m=`<div class="cal-modal-body">${e.body}</div>`;let b;return e.form?b=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${m}
        ${f}
      </form>`:b=`${m}
      ${f}`,`<div class="cal-modal${s}"${a}${n} role="dialog" aria-modal="true" aria-labelledby="${d(t)}" data-focus-trap="1">
      <div class="cal-modal-backdrop"${l}></div>
      <div class="cal-modal-card${i}">
        <header class="cal-modal-header">
          <h3 id="${d(t)}">${d(e.title)}</h3>
          ${o}
        </header>
        ${b}
      </div>
    </div>`}function wt(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",a=e.style==="checkbox"?' style="margin-top:1rem"':"",s=e.id?` id="${d(e.id)}"`:"",n=e.checked?" checked":"",i=e.disabled?" disabled":"";return`<label class="${t}"${a}>
            <input type="checkbox"${s} data-action="${d(e.action)}"${n}${i} />
            ${d(e.label)}
          </label>`}function an(e,t,a){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:a})}function ds(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function _t(e){return e.flash?ne(e.flash.type,e.flash.message,{dismissible:!0}):""}function $e(e){var t,a;return!!((t=e.user)!=null&&t.isAdmin||((a=e.user)==null?void 0:a.role)==="Admin")}function Je(e){return $e(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function it(e,t){if(!t)return;const a=(t.timeFormat||"auto").toLowerCase(),s=(t.weekStart||"auto").toLowerCase(),n=e.portalUi.services;let i=n;if(t.services&&typeof t.services=="object"){const r=n??{caldav:!0,carddav:!0,tasks:!0,notes:!0,files:!0},l=t.services;i={caldav:typeof l.caldav=="boolean"?l.caldav:r.caldav,carddav:typeof l.carddav=="boolean"?l.carddav:r.carddav,tasks:typeof l.tasks=="boolean"?l.tasks:r.tasks,notes:typeof l.notes=="boolean"?l.notes:r.notes,files:typeof l.files=="boolean"?l.files:r.files}}e.portalUi={timeFormat:a==="12h"||a==="24h"?a:"auto",weekStart:s==="monday"||s==="sunday"?s:"auto",logLevel:t.logLevel||"off",services:i},zn(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function ee(e,t){if(t==="admin")return!0;const a=e.portalUi.services;if(!a)return!0;switch(t){case"calendars":return a.caldav;case"contacts":return a.carddav;case"tasks":return a.tasks;case"notes":return a.notes;case"files":return a.files;default:return!0}}function ct(e){const t=["calendars","contacts","tasks","notes","files"];for(const a of t)if(ee(e,a))return a;return"calendars"}function Xt(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function qt(e,t){if(Xt(e),!e.user)return;const a=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},a)}function cs(e,t){var a;Xt(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.calendarSelectionSeeded=!1,e.listKeyboardFocus=!1,e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.calView="month",e.eventSearch="",e.eventSearchFocus=!1;{const s=new Date;e.calFocusDay=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`,e.monthCursor={y:s.getFullYear(),m:s.getMonth()}}if(e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesSearch="",e.filesSearchFocus=!1,e.filesSort="name",e.filesOrder="asc",e.filesTypeFilter="all",e.filesItemMenu=null,e.filesItemMenuDocClick&&(document.removeEventListener("click",e.filesItemMenuDocClick,!0),e.filesItemMenuDocClick=null),e.filesItemMenuWinClose&&(window.removeEventListener("resize",e.filesItemMenuWinClose),e.filesItemMenuWinClose=null),(a=e.filesPreview)!=null&&a.objectUrl)try{URL.revokeObjectURL(e.filesPreview.objectUrl)}catch{}e.filesPreview=null,e.filesPreviewSeq+=1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function us(e,t){if(!e.handlingSessionExpiry){if(!e.user){Xt(e);return}e.handlingSessionExpiry=!0;try{w.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function ms(e,t){const a=String(t.step||"");a==="upgrade"||a==="initialize"||a==="permissions"||a==="database"?(e.installGate={step:a,message:t.message||(a==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function fs(e,t){if(!(t instanceof L)||t.status!==503)return!1;const a=typeof t.payload.code=="string"?t.payload.code:"";if(a!=="upgrade_required"&&a!=="not_configured"&&a!=="admin_password_missing")return!1;const s=a==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:s,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function nn(e){var a,s,n,i;const{state:t}=e;if(t.activeTab==="admin"&&$e(t)&&Je(t))try{t.adminPage==="overview"&&((a=e.adminPageMeta("overview"))==null?void 0:a.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((s=e.adminPageMeta("users"))==null?void 0:s.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((n=e.adminPageMeta("settings"))==null?void 0:n.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((i=e.adminPageMeta("database"))==null?void 0:i.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(r){w.warn("admin page load",r instanceof Error?r.message:r)}}async function ps(e){var a;const{state:t}=e;w.event("bootstrap.start"),Yn(s=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(s)?s:"Your session timed out. Please sign in again.")}),Jn(()=>{qt(t,s=>e.handleSessionExpired(s))});try{const s=await k.installStatus();ms(t,s)}catch(s){w.debug("bootstrap: /api/install/status failed",s instanceof Error?s.message:s)}try{const s=await k.ui();it(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""?t.appVersion=s.version.trim():s.ui&&typeof s.ui.version=="string"&&s.ui.version.trim()!==""&&(t.appVersion=s.ui.version.trim())}catch(s){w.debug("bootstrap: /api/ui failed",s instanceof Error?s.message:s),fs(t,s)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),w.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const s=await k.me();if(!s.user)e.clearPortalSessionState(),it(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),w.event("bootstrap.anonymous");else{if(t.user=s.user,Jt(t.user.username),it(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),w.event("bootstrap.session",{username:((a=t.user)==null?void 0:a.username)??null}),qt(t,n=>e.handleSessionExpired(n)),$e(t))try{await e.loadAdminCapabilities()}catch(n){w.warn("admin.capabilities bootstrap",n instanceof Error?n.message:n)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await nn(e)}}catch(s){s instanceof L&&s.status===401?(e.clearPortalSessionState(),w.event("bootstrap.anonymous")):(w.error("bootstrap failed",s instanceof Error?s.message:s),an(t,"error",s instanceof Error?s.message:"Failed to load"))}e.render()}async function bs(e,t){var r,l;const{state:a}=t,s=new FormData(e),n=String(s.get("username")??""),i=String(s.get("password")??"");a.busy=!0,t.clearFlash(),t.render(),w.event("login.attempt",{username:n});try{const o=await k.login(n,i);if(a.user=o.user,Jt(((r=a.user)==null?void 0:r.username)??n),it(a,o.ui),w.event("login.ok",{username:((l=a.user)==null?void 0:l.username)??n}),qt(a,c=>t.handleSessionExpired(c)),$e(a))try{await t.loadAdminCapabilities()}catch(c){w.warn("admin.capabilities login",c instanceof Error?c.message:c)}t.normalizeActiveTab(),t.persistTab(a.activeTab,a.adminPage),await t.loadHome(),await nn(t),t.setFlash("success","Signed in")}catch(o){w.warn("login.failed",o instanceof Error?o.message:o),t.setFlash("error",o instanceof Error?o.message:"Login failed")}finally{a.busy=!1,t.render()}}function Sa(e,t,a){const s=t.installGate,n=s&&(s.step==="upgrade"||s.step==="initialize"||s.step==="permissions"||s.step==="database"),i=(s==null?void 0:s.installUrl)||"/portal/install/";let r="";if(n&&s){const o=s.step==="upgrade"?"Server upgrade required":"Setup incomplete",c=s.step==="upgrade"&&(s.configuredVersion||s.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${d(String(s.configuredVersion||"—"))}</span>
              → product <span class="mono">${d(String(s.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${d(o)}.</strong>
            ${d(s.message||"Complete the installer before signing in.")}
            ${c}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${d(i)}">Open installer</a>
        </p>`}const l=t.busy||!!n;e.innerHTML=a(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials.</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${l?"disabled":""} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${l?"disabled":""} />
            </label>
            <button type="submit" class="btn btn-primary" ${l?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            This portal is for calendars, contacts, tasks/notes and files.
          </p>
        </div>
      </div>`,{auth:!0})}function Da(e){const t=e.querySelector(".contacts-table-wrap"),a=e.querySelector(".contacts-ab-list"),s=e.querySelector(".calendars-owned-list"),n=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(a==null?void 0:a.scrollTop)??null,calListTop:(s==null?void 0:s.scrollTop)??null,filesTableTop:(n==null?void 0:n.scrollTop)??null}}function Ca(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const a=e.querySelector(".contacts-table-wrap");a&&(a.scrollTop=t.tableTop)}if(t.abListTop!==null){const a=e.querySelector(".contacts-ab-list");a&&(a.scrollTop=t.abListTop)}if(t.calListTop!==null){const a=e.querySelector(".calendars-owned-list");a&&(a.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const a=e.querySelector(".files-table-wrap");a&&(a.scrollTop=t.filesTableTop)}})})}const Ea="hummersoft@mailbox.org",gs="AngaraDAV",Ta="https://github.com/offsyanka99/AngaraDAV";function ys(e){const{version:t,build:a}=ss(e.appVersion),s=a||"—";return`
    <div class="info-modal" id="about-modal" hidden role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div class="info-modal-backdrop" data-action="about-close"></div>
      <div class="info-modal-card about-modal-card">
        <header class="info-modal-header">
          <h3 id="about-modal-title">About</h3>
          <button type="button" class="modal-close info-modal-close" data-action="about-close" aria-label="Close">×</button>
        </header>
        <div class="about-modal-body">
          <img class="about-logo" src="/logo.png" width="72" height="72" alt="" />
          <p class="about-name">${d(gs)}</p>
          <dl class="about-meta">
            <div><dt>Version</dt><dd class="mono">${d(t)}</dd></div>
            <div><dt>Build</dt><dd class="mono">${d(s)}</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:${d(Ea)}">${d(Ea)}</a></dd></div>
            <div><dt>GitHub</dt><dd><a href="${d(Ta)}" target="_blank" rel="noopener noreferrer">${d(Ta.replace(/^https:\/\//,""))}</a></dd></div>
          </dl>
        </div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="about-close">Close</button>
        </footer>
      </div>
    </div>`}function vs(e){var a;const t=e.querySelector("#about-modal");t&&(t.hidden=!1,document.body.classList.add("info-modal-open"),(a=t.querySelector(".info-modal-close"))==null||a.focus())}function sn(e){const t=e.querySelector("#about-modal");if(!t)return;t.hidden=!0;const a=e.querySelector("#info-modal");(!a||a.hidden)&&document.body.classList.remove("info-modal-open")}function $s(e){const t=e.querySelector("#about-modal");return!!t&&!t.hidden}function Ft(e,t,a={}){const s=!!e.user&&e.activeTab==="admin"&&$e(e)&&Je(e),r=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${s?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${d(s?"Administration Portal":"User Portal")}</span></span>`,l=e.user?d(e.user.displayname||e.user.username):"",o=Je(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",c=s?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",f=Vn(),m=`<div class="user-menu-theme" role="group" aria-label="Theme">
              <button type="button" class="user-menu-item${f==="dark"?" is-active":""}" role="menuitem" data-action="set-theme" data-theme="dark">
                Dark
              </button>
              <button type="button" class="user-menu-item${f==="light"?" is-active":""}" role="menuitem" data-action="set-theme" data-theme="light">
                Light
              </button>
            </div>
            <div class="user-menu-sep" role="separator"></div>`,b=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${l}">
              <span class="user-menu-name">${l}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${e.userMenuOpen?"":"hidden"}>
              ${c}
              ${o}
              ${m}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",p=e.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
          <div class="topnav-right">
            ${b}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
        </nav>`,u=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesPreview!==null||e.filesUploadConflict!==null||e.filesUploadProgress!==null||e.confirmDelete!==null)?_t(e):"",v=a.tabs&&a.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${a.tabs}
        </div>
      </div>`:"",$=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal</span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="footer-link" data-action="about-open">About</button>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(rs)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>
      ${ys(e)}`;return a.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${p}
      ${v}
    </div>
      <main class="container">
        ${u}
        ${t}
      </main>
      ${$}`}function Rt(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function ws(e,t){Rt(e),e.userMenuDocClick=s=>{var i;const n=s.target;(i=n==null?void 0:n.closest)!=null&&i.call(n,".user-menu")||(e.userMenuOpen=!1,Rt(e),t())};const a=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===a&&document.addEventListener("click",a,!0)},0)}function ut(e){e.dtPickerDocClick&&(document.removeEventListener("click",e.dtPickerDocClick,!0),e.dtPickerDocClick=null)}function hs(e,t){if(ut(e),!e.eventDtPicker)return;e.dtPickerDocClick=s=>{var i,r;const n=s.target;(i=n==null?void 0:n.closest)!=null&&i.call(n,".dt-field.is-open, .dt-popover, [data-dt-popover]")||(r=n==null?void 0:n.closest)!=null&&r.call(n,'[data-action="dt-open"]')||(e.eventDtPicker=null,ut(e),t())};const a=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===a&&document.addEventListener("click",a,!0)},0)}function ks(e,t){return!t||e.includes(t)?e:[t]}function Qt(e,t){const a=new Map(e.map(r=>[r.path,r])),s=[];for(const r of t){const l=a.get(r);l&&s.push(l)}const n=s.filter(r=>r.type==="file"),i=s.length;return{count:i,heading:i>1?`${i} items`:null,showDownload:n.length>0,downloadItems:n.map(r=>({path:r.path,name:r.name})),renameEnabled:i===1,renamePath:i===1?s[0].path:null,renameName:i===1?s[0].name:null}}function Zt(e){return!!(e.busy||e.filesRenamePath||e.filesDeletePaths||e.filesTransfer||e.filesMkdirOpen||e.filesPreview||e.filesUploadConflict||e.filesUploadProgress)}function M(e){ta(e),e.state.filesItemMenu=null}function ea(e,t,a){!t||Zt(e.state)||e.state.filesEntries.some(s=>s.path===t)&&(e.state.checkedFilePaths=ks(e.state.checkedFilePaths,t),e.state.filesItemMenu={path:t,x:a.x,y:a.y,origin:a.origin},e.state.filesUploadMenuOpen=!1,e.render())}function ta(e){e.state.filesItemMenuDocClick&&(document.removeEventListener("click",e.state.filesItemMenuDocClick,!0),e.state.filesItemMenuDocClick=null),e.state.filesItemMenuWinClose&&(window.removeEventListener("resize",e.state.filesItemMenuWinClose),e.state.filesItemMenuWinClose=null)}function Ss(e){ta(e),e.state.filesItemMenuDocClick=a=>{var n,i;const s=a.target;(n=s==null?void 0:s.closest)!=null&&n.call(s,"#files-item-menu")||(i=s==null?void 0:s.closest)!=null&&i.call(s,'[data-action="files-item-menu-toggle"]')||(M(e),e.render())};const t=e.state.filesItemMenuDocClick;setTimeout(()=>{e.state.filesItemMenu&&e.state.filesItemMenuDocClick===t&&document.addEventListener("click",t,!0)},0),e.state.filesItemMenuWinClose=()=>{e.state.filesItemMenu&&(M(e),e.render())},window.addEventListener("resize",e.state.filesItemMenuWinClose)}function Ds(e){const t=e.root.querySelector("#files-item-menu");if(!t||!e.state.filesItemMenu)return;Pa(e),requestAnimationFrame(()=>Pa(e));const a=e.root.querySelector(".files-table-wrap"),s=e.state.filesItemMenuWinClose;a&&s&&a.addEventListener("scroll",s,{passive:!0});const n=[...t.querySelectorAll('[role="menuitem"]:not([disabled])')];e.state.filesItemMenu.origin==="button"&&n.length>0&&!t.contains(document.activeElement)&&n[0].focus(),t.addEventListener("keydown",r=>{var m;if(r.key!=="ArrowDown"&&r.key!=="ArrowUp"&&r.key!=="Home"&&r.key!=="End")return;const l=[...t.querySelectorAll('[role="menuitem"]:not([disabled])')];if(l.length===0)return;r.preventDefault();const o=document.activeElement,c=o?l.indexOf(o):-1;let f=0;r.key==="ArrowDown"?f=c<0?0:(c+1)%l.length:r.key==="ArrowUp"?f=c<0?l.length-1:(c-1+l.length)%l.length:r.key==="End"&&(f=l.length-1),(m=l[f])==null||m.focus()})}function Pa(e){const t=e.root.querySelector("#files-item-menu"),a=e.state.filesItemMenu;if(!t||!a)return;let s=a.x,n=a.y;if(a.origin==="button"){const c=e.root.querySelector(`.files-row-menu-btn[data-path="${CSS.escape(a.path)}"]`);if(c){const f=c.getBoundingClientRect();s=f.right,n=f.bottom+4}}t.style.left=`${s}px`,t.style.top=`${n}px`;const i=t.getBoundingClientRect(),r=8;let l=a.origin==="button"?s-i.width:s,o=n;l+i.width>window.innerWidth-r&&(l=window.innerWidth-r-i.width),l<r&&(l=r),o+i.height>window.innerHeight-r&&(o=n-i.height-(a.origin==="button"?8:0)),o<r&&(o=r),t.style.left=`${Math.round(l)}px`,t.style.top=`${Math.round(o)}px`}function Cs(e){const t=e.state.filesItemMenu;if(!t)return"";const a=Qt(e.state.filesEntries,e.state.checkedFilePaths);if(a.count===0)return"";const s=e.state.busy?"disabled":"",n=a.showDownload?`<button type="button" class="files-item-menu-item" role="menuitem"
          data-action="files-bulk-download" ${s}>Download</button>
       <div class="files-item-menu-sep" role="separator"></div>`:"",i=e.state.busy||!a.renameEnabled,r=a.renamePath??"",l=a.renameName??"",o=a.heading?`<div class="files-item-menu-heading" id="files-item-menu-label">${d(a.heading)}</div>`:"";return`<div id="files-item-menu" class="files-item-menu" role="menu"${a.heading?' aria-labelledby="files-item-menu-label"':""}
            style="left:${t.x}px;top:${t.y}px">
    ${o}
    ${n}
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-copy" ${s}>Copy</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-move" ${s}>Move</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-rename-open" data-path="${d(r)}" data-name="${d(l)}"
      ${i?"disabled":""}
      title="${a.renameEnabled?"Rename":"Select a single item to rename"}">Rename</button>
    <div class="files-item-menu-sep" role="separator"></div>
    <button type="button" class="files-item-menu-item is-danger" role="menuitem"
      data-action="files-bulk-delete" ${s}>Delete</button>
  </div>`}function Es(e){e.forEach((t,a)=>{window.setTimeout(()=>{const s=document.createElement("a");s.href=k.filesDownloadUrl(t.path),s.download=t.name,s.rel="noopener",document.body.appendChild(s),s.click(),s.remove(),w.event("files.download",{path:t.path,via:"selection"})},a*100)})}async function ae(e){e.state.filesLoading=!0;try{w.debug("loadFiles",{path:e.state.filesPath});const[t,a]=await Promise.all([k.filesStatus(),k.filesList(e.state.filesPath).catch(s=>{if(s instanceof L&&(s.status===503||s.status===404))return{path:e.state.filesPath,entries:[]};throw s})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=a.path,e.state.filesEntries=a.entries;const s=new Set(e.state.filesEntries.map(n=>n.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(n=>s.has(n)),e.state.filesItemMenu&&!s.has(e.state.filesItemMenu.path)&&M(e)}else e.state.filesEntries=[],e.state.checkedFilePaths=[],M(e);w.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function rn(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function ze(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function ht(e,t,a){for(const s of a)if(s&&(t===s||t.startsWith(`${s}/`)))return!0;return!1}function X(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function et(e,t,a){if(a.length===0)return;e.state.filesTransfer={op:t,paths:[...a]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const s=new Set([""]);if(e.state.filesPath){const n=e.state.filesPath.split("/").filter(Boolean);let i="";for(const r of n)i=i?`${i}/${r}`:r,s.add(i)}e.state.filesTreeExpanded=[...s],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),M(e),e.clearFlash(),e.render(),await Promise.all([...s].map(n=>Bt(e,n)))}async function Bt(e,t){const a=e.state.filesTreeChildren[t];if(!(a&&a!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const n=(await k.filesList(t)).entries.filter(i=>i.type==="dir").slice().sort((i,r)=>i.name.localeCompare(r.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:n}}catch(s){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},w.warn("files.tree",{path:t||"/",error:s instanceof Error?s.message:String(s)})}e.render()}}function Ts(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,a=[],s=(n,i)=>{const r=e.state.filesTransferDest===n,l=ht(e,n,t),o=e.state.filesTreeExpanded.includes(n),c=e.state.filesTreeChildren[n],f=Array.isArray(c),m=n===""||c==="loading"||c==="error"||!f||c.length>0,b=n===""?"Home":ze(n),p=l?"Cannot use a selected item (or a folder inside it) as the destination":n===""?"File home host.root":n,g=o?"▾":"▸";if(a.push(`<div class="files-tree-row${r?" is-selected":""}${l?" is-blocked":""}" style="--depth:${i}" role="treeitem" aria-selected="${r}" aria-expanded="${o}" aria-disabled="${l}">
      ${m?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${d(n)}"
              aria-label="${o?"Collapse":"Expand"} ${d(b)}" ${e.state.busy?"disabled":""}>${g}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${r?" is-selected":""}" data-action="files-tree-select" data-path="${d(n)}"
        title="${d(p)}" ${e.state.busy||l?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${d(b)}</span>
      </button>
    </div>`),!!o){if(c==="loading"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Loading…</div>`);return}if(c==="error"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${d(n)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(f){for(const u of c)s(u.path,i+1);c.length===0&&n===""&&a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">No subfolders yet — destination will be Home.</div>`)}}};return s("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${a.join("")}</div>`}async function Ps(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const a=new FormData(t),s=(e.state.filesTransferDest||String(a.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),n=String(a.get("newName")??"").trim(),i=e.state.filesTransfer.op,r=[...e.state.filesTransfer.paths],l=r.length>1;if(ht(e,s,r)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let o=0;const c=[];try{for(const m of r)try{if(i==="copy"){const b=ze(m),p=l||!n||n===b?void 0:n,g=await k.filesCopy(m,{to:s,newName:p});w.event("files.copy",{path:m,to:g.entry.path})}else{const b=ze(m),p=l||!n||n===b?void 0:n;await k.filesMove(m,s,p),w.event("files.move",{path:m,to:s})}o+=1}catch(b){c.push(`${ze(m)}: ${b instanceof Error?b.message:"failed"}`)}X(e),e.state.checkedFilePaths=[],await ae(e);const f=i==="copy"?"Copied":"Moved";o>0&&c.length===0?e.setFlash("success",o===1?`${f} 1 item`:`${f} ${o} items`):o>0?e.setFlash("info",`${f} ${o}; ${c.length} failed. ${c[0]}`):e.setFlash("error",c[0]||`${i==="copy"?"Copy":"Move"} failed`)}catch(f){e.setFlash("error",f instanceof Error?f.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function Ht(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function ln(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function on(e,t=!0){return Array.from(e).map(s=>{const i=(s.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")||s.name;return{file:s,relativePath:i||s.name}})}function Fs(e){return new Promise((t,a)=>{const s=[],n=()=>{e.readEntries(i=>{if(!i.length){t(s);return}s.push(...i),n()},i=>a(i))};n()})}function As(e){return new Promise((t,a)=>{e.file(t,a)})}async function dn(e,t){const a=Ht(t,e.name);if(e.isFile)return[{file:await As(e),relativePath:a||e.name}];if(e.isDirectory){const s=e.createReader(),n=await Fs(s);if(n.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const i=[];for(const r of n)i.push(...await dn(r,a));return i}return[]}async function*Is(e){const t=e;if(typeof t.values=="function"){for await(const a of t.values())yield a;return}if(typeof t.entries=="function")for await(const[,a]of t.entries())yield a}async function aa(e,t){const a=Ht(t,e.name),s=[];let n=0;for await(const i of Is(e))if(n+=1,i.kind==="file"){const r=await i.getFile();s.push({file:r,relativePath:Ht(a,i.name)||r.name})}else i.kind==="directory"&&s.push(...await aa(i,a));return n===0&&s.push({file:null,relativePath:a,isEmptyDir:!0}),s}async function Us(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const a=[];for(const s of t){const n=await s.getFile();a.push({file:n,relativePath:n.name})}return{kind:"items",items:a}}catch(t){return ln(t)?{kind:"cancel"}:{kind:"fallback"}}}async function Ms(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),a=await aa(t,"");return a.length===0?{kind:"cancel"}:{kind:"items",items:a}}catch(t){return ln(t)?{kind:"cancel"}:{kind:"fallback"}}}function Fa(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function Os(e){const t=e.files?Array.from(e.files):[],a=[],s=[],n=e.items?Array.from(e.items):[];for(const i of n){if(i.kind!=="file")continue;const r=i;typeof r.getAsFileSystemHandle=="function"?a.push(r.getAsFileSystemHandle().catch(()=>null)):a.push(Promise.resolve(null));let l=null;if(typeof r.webkitGetAsEntry=="function")try{l=r.webkitGetAsEntry()}catch{l=null}s.push(l)}return{handlePromises:a,entries:s,files:t}}async function xs(e){var i,r;const t=[],a=await Promise.all(e.handlePromises);for(let l=0;l<Math.max(a.length,e.entries.length);l++){const o=a[l]??null;if(o)try{if(o.kind==="file"){const f=await o.getFile();t.push({file:f,relativePath:f.name})}else o.kind==="directory"&&t.push(...await aa(o,""));continue}catch{}const c=e.entries[l];if(c)try{t.push(...await dn(c,""))}catch{}}const s=on(e.files,!0),n=new Map;for(const l of s){const o=Fa(l.relativePath||((i=l.file)==null?void 0:i.name)||"");o&&n.set(o,l)}for(const l of t){const o=Fa(l.relativePath||((r=l.file)==null?void 0:r.name)||"");o&&n.set(o,l)}return Array.from(n.values())}function Ns(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function cn(e,t=80){const a=String(e??"").replace(/\s+/g," ").trim();return a?a.length>t?`${a.slice(0,t-1)}…`:a:""}function me(e,t,a){const s=cn(t);return s?`${e} “${s}” ${a}`:`${e} ${a}`}function At(e){const t=cn(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(s=>String(s??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function un(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function mt(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Q(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),s=t%60;return a>0?`${a}m ${s}s`:`${s}s`}function G(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Ls(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function K(e,t,a,s,n,i=""){const r=a===t,l=r?s==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${r?" is-sorted":""}${i?" "+i:""}`}" data-action="sort-${n}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${l}</th>`}const _s=new Set(["docx","xlsx","pptx","odt","ods","odp","doc","xls","ppt"]),qs=new Set(["jpg","jpeg","jfif","png","gif","webp","bmp","avif","ico","heic","heif"]),Rs=new Set(["mp3","wav","ogg","oga","flac","aac","m4a","opus","weba"]),Bs=new Set(["mp4","m4v","webm","ogv","mov"]),Hs=new Set(["txt","md","markdown","rst","csv","tsv","json","jsonc","xml","yml","yaml","html","htm","xhtml","js","mjs","cjs","ts","tsx","jsx","css","scss","less","php","py","rb","go","rs","java","c","h","cpp","hpp","cs","sh","bash","zsh","sql","log","ini","conf","cfg","env","toml","diff","patch","vue","svelte","svg","rss","atom","ics","vcf","eml","nfo","rtf","tex","lua","kt","swift","pl","pm"]);function na(e){const t=e.split(/[/\\]/).pop()||e,a=t.lastIndexOf(".");return a<=0?"":t.slice(a+1).toLowerCase()}function mn(e){const t=na(e);return qs.has(t)?"image":t==="pdf"?"pdf":Rs.has(t)?"audio":Bs.has(t)?"video":_s.has(t)?"office":Hs.has(t)?"text":"unsupported"}function ve(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function fn(e){return e.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(t,a)=>String.fromCharCode(Number(a))).replace(/&#x([0-9a-fA-F]+);/g,(t,a)=>String.fromCharCode(parseInt(a,16)))}function Vs(e,t){const a=[],s=new RegExp(t.source,t.flags.includes("g")?t.flags:`${t.flags}g`);let n;for(;n=s.exec(e);)a.push(n[1]??n[0]);return a}function le(e,t){const a=new RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${t}>`,"gi");return e.match(a)??[]}function de(e,t){const a=new RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${t}>`,"gi");return Vs(e,a).map(s=>fn(s.replace(/<[^>]+>/g,"")))}function js(e){const t=le(e,"p");if(t.length===0){const n=de(e,"t").join(" ").trim();return n?`<p>${ve(n)}</p>`:""}const a=[];for(const n of t){const i=le(n,"r"),r=[],l=i.length?i:[n];for(const o of l){const c=de(o,"t").join("");if(!c)continue;let f=ve(c);(/<(?:[\w.-]+:)?b\b/i.test(o)||/w:val="true"[^>]*w:b|w:b\s*\/>/i.test(o))&&(f=`<strong>${f}</strong>`),/<(?:[\w.-]+:)?i\b/i.test(o)&&(f=`<em>${f}</em>`),r.push(f)}a.push(`<p>${r.join("")||"&nbsp;"}</p>`)}const s=le(e,"tbl");for(const n of s){const i=le(n,"tr").map(r=>`<tr>${le(r,"tc").map(o=>`<td>${ve(de(o,"t").join(" "))}</td>`).join("")}</tr>`).join("");i&&a.push(`<table class="files-preview-sheet">${i}</table>`)}return a.join("")}function zs(e,t){const a=e?de(e,"t"):[],s=le(t,"row");return s.length===0?"":`<table class="files-preview-sheet">${s.map(i=>`<tr>${le(i,"c").map(l=>{const o=/\bt="s"/.test(l),c=(de(l,"v")[0]??de(l,"t")[0]??"").trim();let f=c;if(o){const m=Number(c);f=Number.isFinite(m)&&a[m]!==void 0?a[m]:c}return`<td>${ve(f)}</td>`}).join("")}</tr>`).join("")}</table>`}function Ks(e){return e.map((t,a)=>{const n=de(t,"t").map(i=>i.trim()).filter(Boolean).map(i=>`<p>${ve(i)}</p>`).join("")||'<p class="muted">(empty slide)</p>';return`<section class="files-preview-slide"><h3>Slide ${a+1}</h3>${n}</section>`}).join("")}function Ws(e){const t=le(e,"p");return t.length===0?de(e,"p").map(a=>`<p>${ve(a)}</p>`).join(""):t.map(a=>`<p>${ve(fn(a.replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim())||"&nbsp;"}</p>`).join("")}function be(e,t){return e.getUint16(t,!0)}function Ue(e,t){return e.getUint32(t,!0)}async function Ys(e){if(typeof DecompressionStream>"u")throw new Error("Deflate is not available in this browser");const t=new DecompressionStream("deflate-raw"),a=new Blob([e]).stream().pipeThrough(t),s=await new Response(a).arrayBuffer();return new Uint8Array(s)}async function Js(e){const t=new Uint8Array(e),a=new DataView(e);let s=-1;const n=Math.max(0,t.length-22-65535);for(let c=t.length-22;c>=n;c--)if(Ue(a,c)===101010256){s=c;break}if(s<0)throw new Error("Not a ZIP file");const i=be(a,s+10);let r=Ue(a,s+16);const l=new Map,o=new TextDecoder("utf-8");for(let c=0;c<i;c++){if(Ue(a,r)!==33639248)throw new Error("Bad ZIP directory");const f=be(a,r+10),m=Ue(a,r+20),b=be(a,r+28),p=be(a,r+30),g=be(a,r+32),u=Ue(a,r+42),v=o.decode(t.subarray(r+46,r+46+b)).replace(/\\/g,"/");if(r+=46+b+p+g,!v||v.endsWith("/"))continue;const $=be(a,u+26),S=be(a,u+28),C=u+30+$+S,y=t.subarray(C,C+m);f===0?l.set(v,y.slice()):f===8&&l.set(v,await Ys(y))}return l}function Me(e,t){const a=e.get(t);return a?new TextDecoder("utf-8").decode(a):null}const Gs=20*1024*1024;async function Xs(e,t){const a=na(e);if(a==="doc"||a==="xls"||a==="ppt")throw new Error("Older binary Office files (.doc / .xls / .ppt) cannot be previewed. Download to open them.");if(t.size>Gs)throw new Error("This document is too large to preview. Download it instead.");const s=await Js(await t.arrayBuffer());if(a==="docx"){const n=Me(s,"word/document.xml");if(!n)throw new Error("This Word file has no document.xml");const i=js(n);if(!i)throw new Error("No readable text in this Word file");return i}if(a==="xlsx"){const n=[...s.keys()].filter(l=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(l)).sort((l,o)=>l.localeCompare(o,void 0,{numeric:!0}))[0],i=n?Me(s,n):null;if(!i)throw new Error("This spreadsheet has no worksheet");const r=zs(Me(s,"xl/sharedStrings.xml"),i);if(!r)throw new Error("No readable cells in this spreadsheet");return r}if(a==="pptx"){const n=[...s.keys()].filter(i=>/^ppt\/slides\/slide\d+\.xml$/i.test(i)).sort((i,r)=>i.localeCompare(r,void 0,{numeric:!0})).map(i=>Me(s,i)).filter(i=>!!i);if(n.length===0)throw new Error("This presentation has no slides");return Ks(n)}if(a==="odt"||a==="ods"||a==="odp"){const n=Me(s,"content.xml");if(!n)throw new Error("This OpenDocument file has no content.xml");const i=Ws(n);if(!i)throw new Error("No readable text in this document");return i}throw new Error("This Office file type cannot be previewed")}const Vt=2*1024*1024,Qs=50*1024*1024;function Zs(e){const t=e.filesPreview;if(t!=null&&t.objectUrl)try{URL.revokeObjectURL(t.objectUrl)}catch{}e.filesPreviewSeq+=1,e.filesPreview=null}function j(e){Zs(e.state)}async function er(e,t){const a=e.state.filesEntries.find(l=>l.path===t);if(!a||a.type!=="file")return;j(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,X(e),e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,M(e);const s=mn(a.name),n=e.state.filesPreviewSeq+1;e.state.filesPreviewSeq=n;const i={path:a.path,name:a.name,size:a.size,kind:s,status:"loading",objectUrl:null,text:null,html:null,truncated:!1,error:null};if(!(s==="text"||s==="pdf"||s==="office")){e.state.filesPreview={...i,status:"ready"},w.event("files.preview",{path:a.path,kind:s}),e.render();return}e.state.filesPreview=i,e.render();try{if(s==="pdf"&&a.size>Qs){if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"error",error:`This PDF is too large to preview (${G(a.size)}). Download it instead.`},e.render();return}const{blob:l}=await k.filesGetBlob(a.path,{inline:!0});if(e.state.filesPreviewSeq!==n)return;if(s==="office"){const o=await Xs(a.name,l);if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"ready",html:o}}else if(s==="pdf"){const o=l.type&&l.type.toLowerCase().includes("pdf")?l:new Blob([l],{type:"application/pdf"});e.state.filesPreview={...i,status:"ready",objectUrl:URL.createObjectURL(o)}}else{const o=l.size>Vt,f=await(o?l.slice(0,Vt):l).text();if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"ready",text:f,truncated:o}}w.event("files.preview",{path:a.path,kind:s})}catch(l){if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"error",error:l instanceof Error?l.message:"Could not open file"}}e.render()}function tr(e){const t=e.state.filesPreview;if(!t)return"";let a;if(t.status==="loading")a='<p class="muted" style="margin:0">Loading preview…</p>';else if(t.status==="error")a=`<p class="flash flash-error" style="margin:0">${d(t.error||"Could not open file")}</p>`;else if(t.kind==="image"){const s=k.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <img class="files-preview-img" src="${d(s)}" alt="${d(t.name)}" decoding="async" />
    </div>`}else if(t.kind==="pdf"&&t.objectUrl)a=`<iframe class="files-preview-frame" title="${d(t.name)}" src="${d(t.objectUrl)}" type="application/pdf"></iframe>`;else if(t.kind==="audio"){const s=k.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${d(s)}"></audio>
    </div>`}else if(t.kind==="video"){const s=k.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${d(s)}"></video>
    </div>`}else t.kind==="office"&&t.html?a=`<div class="files-preview-office">${t.html}</div>`:t.kind==="text"?a=`${t.truncated?`<p class="muted small files-preview-truncated">Showing the first ${d(G(Vt))} of this file.</p>`:""}<pre class="files-preview-text">${d(t.text||"")}</pre>`:a=`<p style="margin:0">This file type cannot be previewed in the browser. Download it to open with another app.</p>
      <p class="muted small" style="margin:0.75rem 0 0">${d(t.name)} · ${d(G(t.size))}</p>`;return x({id:"files-preview-modal",title:t.name,titleId:"files-preview-title",closeAction:"files-preview-close",size:"wide",cardClassName:"files-preview-card",className:"files-preview-modal",body:a,footer:[{label:"Download",action:"files-preview-download",variant:"ghost"},{label:"Close",action:"files-preview-close",variant:"primary"}]})}function ce(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function ar(e){ce(e),e.state.filesUploadMenuDocClick=a=>{var n;const s=a.target;(n=s==null?void 0:s.closest)!=null&&n.call(s,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,ce(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function Pe(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function nr(e){Pe(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){Pe(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},De(e,e.state.filesUploadProgress)},1e3)}function pn(e){Pe(e),e.state.filesUploadProgress=null,e.render()}function bn(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function De(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const a=e.root.querySelector(".files-upload-progress-bar"),s=e.root.querySelector(".files-upload-progress-track"),n=e.root.querySelector("[data-files-upload-status]"),i=e.root.querySelector("[data-files-upload-current]"),r=bn(e,t),l=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${Q(t.elapsedSec)}`:(n==null?void 0:n.textContent)||"";n&&t.phase==="uploading"&&(n.textContent=l),i&&t.phase==="uploading"&&(i.textContent=t.currentName||"",i.title=t.currentName||""),a&&r!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${r}%`),s&&r!==null&&(s.setAttribute("aria-valuenow",String(r)),s.removeAttribute("aria-valuetext"))}function sr(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,a=t.phase==="uploading",s=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",n=bn(e,t),i=n===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",r=n!==null?` style="width:${n}%"`:"";let l="";if(a){const c=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${n!==null?` (${n}%)`:""} · ${Q(t.elapsedSec)}`,f=t.bytesTotal>0?`${mt(t.bytesSent)} / ${mt(t.bytesTotal)}`:"";l=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${f?` · <span class="muted">${d(f)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${n!==null?`aria-valuenow="${n}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${i}"${r}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${d(c)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${d(t.currentName)}">${d(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")l=`
      ${ne("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${d(Q(t.elapsedSec))}</p>`;else{const c=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(f=>`<li>${d(f)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
      ${ne("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${c}
      <p class="muted small" style="margin:0.75rem 0 0">After ${d(Q(t.elapsedSec))}</p>`}const o=a?'<p class="muted small" style="margin:0">Please wait…</p>':Gt([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return x({title:s,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:a,lockBackdrop:a,body:l,footer:o})}async function Aa(e,t,a,s){const n=a.replace(/\\/g,"/").split("/").map(r=>r.trim()).filter(Boolean);let i=t;for(const r of n){const l=rn(i,r);if(s.has(l)){i=l;continue}try{await k.filesMkdir(i,r),w.event("files.mkdir",{path:i,name:r,via:"upload-folder"})}catch(o){if(!(o instanceof L&&o.status===409))throw o}s.add(l),i=l}}function rr(e,t){var s;const a=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(s=e.root.querySelector(a))==null||s.click()}async function Ia(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,ce(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,X(e),e.state.filesMkdirOpen=!1,j(e),M(e);const a=t==="files"?Us:Ms;try{const s=await a();if(s.kind==="cancel"){e.render();return}if(s.kind==="items"){if(s.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await ra(e,s.items);return}e.render(),requestAnimationFrame(()=>{rr(e,t)})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not open picker"),e.render()}}function kt(e,t){return`${e}\0${t}`}function ir(e,t){return t.map(a=>{const s=a.file,n=(a.relativePath||s.name).replace(/\\/g,"/"),i=n.split("/").filter(Boolean),r=i.pop()||s.name,l=i.join("/"),o=rn(e,l);return{item:a,file:s,fileName:r,parentPath:o,displayName:n||r,relDir:l}})}function lr(e){const t=new Set,a=[];for(const s of e){const n=kt(s.parentPath,s.fileName);t.has(n)||(t.add(n),a.push(s))}return a}async function or(e,t){if(t.length===0)return[];const a=new Map;for(const n of t){const i=a.get(n.parentPath)??[];i.push(n),a.set(n.parentPath,i)}const s=[];for(const[n,i]of a){let r=new Map;try{const l=await k.filesList(n);r=new Map;for(const o of l.entries)(o.type==="file"||o.type==="dir")&&r.set(o.name,o.type)}catch{r=new Map}for(const l of i)r.has(l.fileName)&&s.push(l)}return s.sort((n,i)=>n.displayName.localeCompare(i.displayName)),s}const sa=new WeakMap;function It(e){e&&(sa.delete(e.state),e.state.filesUploadConflict=null)}function lt(e,t){var f;const a=sa.get(e.state),s=e.state.filesUploadConflict;if(t==="cancel"){It(e),e.setFlash("info","Upload cancelled"),e.render();return}if(!a){e.state.filesUploadConflict=null,e.setFlash("error","Upload session expired — drop or choose the files again"),e.render();return}const n=new Set(((f=s==null?void 0:s.conflictKeys)!=null&&f.length?s.conflictKeys:a.conflictKeys)??[]);let i=a.planned,r=new Set,l=0;if(t==="overwrite")r=new Set(n);else{const m=[];for(const b of a.planned){const p=kt(b.parentPath,b.fileName);n.has(p)?l+=1:m.push(b)}if(i=m,w.event("files.upload.skip_existing",{skipped:l,remaining:i.length,total:a.planned.length,conflictKeys:n.size}),i.length===0&&a.emptyDirs.length===0){It(e),e.setFlash("info",l===1?"Nothing to upload — the selected file already exists":`Nothing to upload — all ${l} selected files already exist`),e.render();return}}const o=a.destBase,c=a.emptyDirs;It(e),gn(e,i,c,o,r)}async function ra(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,ce(e),e.state.filesUploadDropActive=!1,j(e),M(e);const a=t.filter(r=>r.file&&!r.isEmptyDir),s=t.filter(r=>r.isEmptyDir&&r.relativePath),n=e.state.filesPath,i=lr(ir(n,a));if(w.event("files.upload.plan",{destBase:n||"/",files:i.length,emptyDirs:s.length,sample:i.slice(0,5).map(r=>({display:r.displayName,parent:r.parentPath||"/",name:r.fileName}))}),i.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await or(n,i);if(r.length>0){const l=r.map(o=>kt(o.parentPath,o.fileName));sa.set(e.state,{planned:i,emptyDirs:s,destBase:n,conflictKeys:l}),e.state.filesUploadConflict={names:r.map(o=>o.displayName),totalFiles:i.length,conflictCount:r.length,conflictKeys:l},w.event("files.upload.conflicts",{total:i.length,conflicts:r.length,names:r.slice(0,12).map(o=>o.displayName)}),e.state.busy=!1,e.render();return}}catch(r){e.state.busy=!1,e.setFlash("error",r instanceof Error?r.message:"Could not check existing files"),e.render();return}}await gn(e,i,s,n,new Set)}async function gn(e,t,a,s,n){var p,g;const i=t.reduce((u,v)=>u+(v.file.size||0),0),r=Date.now(),l=t.length+a.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((p=t[0])==null?void 0:p.displayName)||((g=a[0])==null?void 0:g.relativePath)||"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),nr(e),e.render();let o=0;const c=[],f=new Set;let m=0,b=0;try{for(const $ of a){const S=$.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(S){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:S+"/",elapsedSec:Math.floor((Date.now()-r)/1e3)},De(e,e.state.filesUploadProgress));try{await Aa(e,s,S,f)}catch(C){c.push(`${S}/: ${C instanceof Error?C.message:"failed"}`)}}}for(const $ of t){const{file:S,fileName:C,parentPath:y,displayName:T,relDir:I}=$;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:T,bytesSent:m,elapsedSec:Math.floor((Date.now()-r)/1e3)},De(e,e.state.filesUploadProgress));try{I&&await Aa(e,s,I,f);const q=n.has(kt(y,C));await k.filesUpload(y,S,{replace:q,onProgress:(V,re)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const h=re>0?re:S.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:T,bytesSent:m+Math.min(V,h||V),elapsedSec:Math.floor((Date.now()-r)/1e3)},De(e,e.state.filesUploadProgress)}}),w.event("files.upload",{path:y,name:C,size:S.size,relativePath:T,replace:q}),o+=1,q&&(b+=1),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m},De(e,e.state.filesUploadProgress))}catch(q){const V=`${T}: ${q instanceof Error?q.message:"failed"}`;c.push(V),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m,errorSamples:c.slice(0,12)},De(e,e.state.filesUploadProgress))}}await ae(e),Pe(e);const u=Math.floor((Date.now()-r)/1e3),v=t.length;if(o>0&&c.length===0){let $=o===1?"Uploaded 1 file":`Uploaded ${o} files`;b>0&&($+=b===1?" (1 overwritten)":` (${b} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(v,1),completedFiles:o,failedFiles:0,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:u,resultMessage:$,errorSamples:[]},e.setFlash("success",$)}else if(o>0){const $=`Uploaded ${o}; ${c.length} failed. ${c[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(v,1),completedFiles:o,failedFiles:c.length,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:u,resultMessage:$,errorSamples:c.slice(0,12)},e.setFlash("info",$)}else if(l>0&&c.length===0&&a.length>0){const $=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:r,elapsedSec:u,resultMessage:$,errorSamples:[]},e.setFlash("success",$)}else{const $=c[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(v,1),completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:u,resultMessage:$,errorSamples:c.slice(0,12)},e.setFlash("error",$)}}catch(u){Pe(e);const v=u instanceof Error?u.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:o,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:i,bytesSent:m,startedAt:r,elapsedSec:Math.floor((Date.now()-r)/1e3),resultMessage:v,errorSamples:c.length?c.slice(0,12):[v]},e.setFlash("error",v)}finally{e.state.busy=!1,e.render()}}function Ua(e,t,a){const s=t.files;if(!s||s.length===0)return;const n=on(s,a);t.value="",ra(e,n)}const dr={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Click a file name or View to preview it: images, PDF, text, audio, and video open in a dialog. Other types offer a download instead. Download, create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function _(e,t,a="h2"){const s=a;return`<div class="section-title-row">
    <${s}>${d(e)}</${s}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(t)}"
      aria-label="About ${d(e)}" title="About ${d(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function cr(){return`
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
    </div>`}const ur=new Set(["zip","tar","gz","tgz","bz2","7z","rar","xz"]),mr=[{value:"all",label:"All types"},{value:"folder",label:"Folders"},{value:"file",label:"Files"},{value:"image",label:"Images"},{value:"document",label:"Documents"},{value:"audio",label:"Audio"},{value:"video",label:"Video"},{value:"archive",label:"Archives"},{value:"other",label:"Other"}];function fr(e){if(e.type==="dir")return"folder";const t=mn(e.name);return t==="image"?"image":t==="pdf"||t==="office"||t==="text"?"document":t==="audio"?"audio":t==="video"?"video":ur.has(na(e.name))?"archive":"other"}function pr(e,t){return t==="all"?!0:t==="file"?e.type==="file":fr(e)===t}function yn(e,t){const a=t.search.trim().toLowerCase();let s=e.filter(i=>!(!pr(i,t.type)||a&&!i.name.toLowerCase().includes(a)));const n=t.order==="desc"?-1:1;return s=s.slice().sort((i,r)=>t.sort==="name"?i.type!==r.type?i.type==="dir"?-1:1:n*i.name.localeCompare(r.name,void 0,{sensitivity:"base"}):t.sort==="size"?i.type!==r.type?i.type==="dir"?1:-1:i.size!==r.size?n*(i.size-r.size):i.name.localeCompare(r.name,void 0,{sensitivity:"base"}):i.mtime!==r.mtime?n*(i.mtime-r.mtime):i.name.localeCompare(r.name,void 0,{sensitivity:"base"})),s}function br(e,t){const a=t?t.split("/").filter(Boolean):[];let s="";const n=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const i of a){s=s?`${s}/${i}`:i;const r=s;n.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),n.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(r)}" ${e.state.busy?"disabled":""}>${d(i)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${n.join("")}</nav>`}function gr(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${_("Files","files","h1")}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${_("Files","files","h1")}
        <p class="flash flash-error" style="margin-top:0.75rem">${d(t.error||"File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${d(t.davPath)}</span></p>
      </section>
    </div>`;const a=t.quotaBytes>0?`${G(t.usedBytes)} used · ${G(t.availableBytes)} free of ${G(t.quotaBytes)}`:`${G(t.usedBytes)} used · ${G(t.availableBytes)} free (no app quota)`,s=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,n=yn(e.state.filesEntries,{search:e.state.filesSearch,type:e.state.filesTypeFilter,sort:e.state.filesSort,order:e.state.filesOrder}),i=e.state.checkedFilePaths.length,r=(()=>{if(i===0)return null;const h=new Set(e.state.checkedFilePaths);let P=0,F=0;for(const O of e.state.filesEntries)!h.has(O.path)||O.type!=="file"||(P+=O.size,F+=1);return F>0?P:null})(),l=n.length>0&&n.every(h=>e.state.checkedFilePaths.includes(h.path)),o=i>0,c=e.state.filesEntries.filter(h=>h.type==="dir").length,f=e.state.filesEntries.length-c,m=Qt(e.state.filesEntries,e.state.checkedFilePaths),b=n.length!==e.state.filesEntries.length,p=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const h=[];c>0&&h.push(`${c} folder${c===1?"":"s"}`),f>0&&h.push(`${f} file${f===1?"":"s"}`);const P=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return h.length===2?`${P} · ${h.join(", ")}`:h[0]??P})(),g=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':n.length===0?'<tr><td colspan="5" class="muted">No items match this search or filter.</td></tr>':n.map(h=>{var B,J;const P=e.state.checkedFilePaths.includes(h.path),F=h.type==="dir"?"📁":"📄",O=h.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(h.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${F}</span>${d(h.name)}
                  </button>`:`<button type="button" class="files-name-btn" data-action="files-preview-open" data-path="${d(h.path)}" title="View ${d(h.name)}" aria-expanded="${((B=e.state.filesPreview)==null?void 0:B.path)===h.path?"true":"false"}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${F}</span>${d(h.name)}
                  </button>`,N=h.type==="dir"?"—":G(h.size),R=((J=e.state.filesItemMenu)==null?void 0:J.path)===h.path;return`<tr class="files-row${P?" is-checked":""}${R?" is-menu-open":""}" data-path="${d(h.path)}" data-type="${h.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${d(h.path)}"
                  ${P?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${d(h.name)}" />
              </td>
              <td class="files-col-name">${O}</td>
              <td class="files-col-size mono">${N}</td>
              <td class="files-col-mtime hide-sm">${d(Ls(h.mtime))}</td>
              <td class="files-col-actions">
                <button type="button" class="files-row-menu-btn" data-action="files-item-menu-toggle"
                  data-path="${d(h.path)}"
                  aria-haspopup="menu"
                  aria-expanded="${R?"true":"false"}"
                  ${R?'aria-controls="files-item-menu"':""}
                  aria-label="Actions for ${d(h.name)}"
                  title="Actions"
                  ${e.state.busy?"disabled":""}>
                  <span aria-hidden="true">⋮</span>
                </button>
              </td>
            </tr>`}).join(""),u=e.state.filesRenamePath!==null?(()=>{const h=e.state.filesEntries.find(F=>F.path===e.state.filesRenamePath),P=(h==null?void 0:h.name)??"";return x({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${d(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${d(P)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",v=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const h=e.state.filesDeletePaths,P=h.length>1,F=e.state.filesEntries.find(R=>R.path===h[0]),O=P?`Delete ${h.length} items`:`Delete ${(F==null?void 0:F.type)==="dir"?"folder":"file"}`,N=P?`<p style="margin:0 0 0.75rem">Delete <strong>${h.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${h.slice(0,12).map(R=>{const B=e.state.filesEntries.find(J=>J.path===R);return`<li><span class="mono">${d((B==null?void 0:B.name)??R)}</span></li>`}).join("")}
                 ${h.length>12?`<li>…and ${h.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${d((F==null?void 0:F.name)??h[0])}</strong>?${(F==null?void 0:F.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return x({id:"files-delete-modal",title:O,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:N,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",$=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const h=e.state.filesTransfer.op,P=e.state.filesTransfer.paths,F=P.length>1,O=e.state.filesEntries.find(Qe=>Qe.path===P[0]),N=(O==null?void 0:O.name)??ze(P[0]),R=F?`${h==="copy"?"Copy":"Move"} ${P.length} items`:`${h==="copy"?"Copy":"Move"} ${(O==null?void 0:O.type)==="dir"?"folder":"file"}`,B=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,J=ht(e,e.state.filesTransferDest,P);return x({id:"files-transfer-modal",title:R,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${F?`<p class="muted small" style="margin:0 0 0.75rem">${P.length} items will be ${h==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${d(N)}</span></p>`}
                  <input type="hidden" name="toPath" value="${d(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${d(B)}">${d(B)}</span>
                    </div>
                    ${Ts(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${F?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${d(N)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${h==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:h==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||J}]})})():"",S=e.state.filesMkdirOpen?x({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",C=e.state.filesUploadConflict?(()=>{const h=e.state.filesUploadConflict,P=h.conflictCount,F=Math.max(0,h.totalFiles-P),O=P===1?"1 file already exists in the destination.":`${P} of ${h.totalFiles} files already exist in the destination.`,N=F>0?F===1?" Skip existing keeps the other 1 new file.":` Skip existing keeps the other ${F} new files.`:" Skip existing cancels the upload (nothing new to send).",R=h.names.slice(0,12).map(J=>`<li><span class="mono">${d(J)}</span></li>`).join(""),B=h.names.length>12?`<li class="muted">…and ${h.names.length-12} more</li>`:"";return x({id:"files-upload-conflict-modal",title:P===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${d(O)}${d(N)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${R}
                ${B}
              </ul>
              <p class="muted small" style="margin:0">
                Replace the existing files, skip only those listed above, or cancel the whole upload.
              </p>`,footer:[{label:"Cancel",action:"files-upload-conflict-cancel",variant:"ghost"},{label:"Skip existing",action:"files-upload-conflict-skip",variant:"ghost"},{label:P===1?"Overwrite":"Overwrite all",action:"files-upload-conflict-overwrite",variant:"primary"}]})})():"",y=e.state.filesPath===""?"Home":e.state.filesPath,T=`<div class="files-upload-menu${e.state.filesUploadMenuOpen?" is-open":""}">
          <button type="button" class="btn btn-primary btn-small files-upload-menu-trigger"
            data-action="files-upload-menu-toggle"
            ${e.state.busy?"disabled":""}
            aria-haspopup="menu"
            aria-expanded="${e.state.filesUploadMenuOpen?"true":"false"}"
            aria-controls="files-upload-menu-list"
            title="Upload files or a folder into this directory">
            Upload
            <span class="files-upload-menu-caret" aria-hidden="true">▾</span>
          </button>
          <div id="files-upload-menu-list" class="files-upload-menu-dropdown" role="menu"
            ${e.state.filesUploadMenuOpen?"":"hidden"}>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-files" ${e.state.busy?"disabled":""}>
              Files…
            </button>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-folder" ${e.state.busy?"disabled":""}>
              Folder…
            </button>
          </div>
        </div>`,I=`<input type="file" data-action="files-upload-pick-files" ${e.state.busy?"disabled":""} multiple hidden />
        <input type="file" data-action="files-upload-pick-folder" ${e.state.busy?"disabled":""}
          multiple webkitdirectory directory hidden />`,q=mr.map(h=>`<option value="${d(h.value)}" ${e.state.filesTypeFilter===h.value?"selected":""}>${d(h.label)}</option>`).join(""),V=`<div class="files-filter-bar">
          <input type="search" class="files-search" data-action="files-search" placeholder="Search this folder…"
            value="${d(e.state.filesSearch)}" aria-label="Search files in this folder" ${e.state.busy?"disabled":""} />
          <label class="files-type-filter">
            <span class="visually-hidden">Type</span>
            <select data-action="files-type-filter" aria-label="Filter by type" ${e.state.busy?"disabled":""}>
              ${q}
            </select>
          </label>
        </div>`,re=i>0?`<div class="files-toolbar-actions" role="toolbar" aria-label="Selected files">
            <span class="files-selection-count">${i} selected</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-clear-selection" ${e.state.busy?"disabled":""}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-download"
              ${e.state.busy||!m.showDownload?"disabled":""}
              title="${m.showDownload?"Download selected files":"No files in the selection"}">Download</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>`:`<div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${e.state.busy||e.state.filesLoading?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${e.state.busy?"disabled":""}>New folder</button>
            ${T}
          </div>`;return`<div class="portal-grid portal-grid-files">
    <section class="card files-panel${e.state.filesUploadDropActive?" is-dragover":""}" data-files-drop-target>
      <div class="files-drop-overlay" aria-hidden="true">
        <div class="files-drop-overlay-inner">
          <p class="files-drop-overlay-title">Drop to upload</p>
          <p class="muted small mono">${d(y)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${_("Files","files","h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${s}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${s}%"></div>
          </div>
          <span>${d(a)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${br(e,e.state.filesPath)}
        ${re}
      </div>
      ${I}
      ${V}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${l?"checked":""}
                  ${o&&!l?"data-indeterminate=1":""}
                  ${e.state.busy||n.length===0?"disabled":""}
                  aria-label="Select all visible in this folder" />
              </th>
              ${K("Name","name",e.state.filesSort,e.state.filesOrder,"file","files-col-name")}
              ${K("Size","size",e.state.filesSort,e.state.filesOrder,"file","files-col-size")}
              ${K("Modified","mtime",e.state.filesSort,e.state.filesOrder,"file","files-col-mtime hide-sm")}
              <th class="files-col-actions" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            ${e.state.filesLoading&&e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':g}
          </tbody>
        </table>
      </div>
      ${Cs(e)}
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${i>0?`${i} of ${e.state.filesEntries.length} selected${r!==null?` · ${d(G(r))}`:""}`:b?`${n.length} shown of ${e.state.filesEntries.length}`:d(p)}
      </div>
    </section>
    ${u}
    ${v}
    ${$}
    ${S}
    ${C}
  </div>`}async function yr(e,t){const a=new FormData(t),s=String(a.get("path")??""),n=String(a.get("newName")??"").trim();if(!s||!n){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await k.filesRename(s,n),w.event("files.rename",{path:s,newName:n}),e.state.filesRenamePath=null,await ae(e),e.setFlash("success",`Renamed to “${n}”`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function vr(e,t){const a=new FormData(t),s=String(a.get("name")??"").trim();if(!s){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await k.filesMkdir(e.state.filesPath,s),w.event("files.mkdir",{path:e.state.filesPath,name:s}),e.state.filesMkdirOpen=!1,await ae(e),e.setFlash("success",`Created folder “${s}”`)}catch(n){e.setFlash("error",n instanceof Error?n.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function $r(e,t,a,s){var i;const{state:n}=e;if(t==="files-upload-menu-toggle")return n.busy||n.filesUploadProgress||(n.filesUploadMenuOpen=!n.filesUploadMenuOpen,n.filesUploadMenuOpen&&(n.filesRenamePath=null,n.filesDeletePaths=null,X(e),n.filesMkdirOpen=!1,M(e)),e.render()),!0;if(t==="files-item-menu-toggle"){s.stopPropagation();const r=a.dataset.path??"";if(!r||Zt(n))return!0;if(((i=n.filesItemMenu)==null?void 0:i.path)===r)return M(e),e.render(),!0;const l=a.getBoundingClientRect();return ea(e,r,{x:l.right,y:l.bottom+4,origin:"button"}),!0}if(t==="sort-file"){const r=a.dataset.sort||"";return r!=="name"&&r!=="size"&&r!=="mtime"||(n.filesSort===r?n.filesOrder=n.filesOrder==="asc"?"desc":"asc":(n.filesSort=r,n.filesOrder=r==="name"?"asc":"desc"),e.render()),!0}if(t==="files-type-filter"){const r=a.value;return n.filesTypeFilter=r==="folder"||r==="file"||r==="image"||r==="document"||r==="audio"||r==="video"||r==="archive"||r==="other"?r:"all",e.render(),!0}if(t==="files-clear-selection")return n.checkedFilePaths=[],M(e),e.render(),!0;if(t==="files-upload-files")return Ia(e,"files"),!0;if(t==="files-upload-folder")return Ia(e,"folder"),!0;if(t==="files-nav"){const r=a.dataset.path??"";n.filesPath=r,n.filesRenamePath=null,n.filesDeletePaths=null,n.filesTransfer=null,n.filesMkdirOpen=!1,j(e),M(e),n.checkedFilePaths=[],n.busy=!0,e.clearFlash(),e.render();try{await ae(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to open folder")}finally{n.busy=!1,e.render()}return!0}if(t==="files-toggle"){s.stopPropagation();const r=a.dataset.path??"";return r&&(a.checked?n.checkedFilePaths.includes(r)||(n.checkedFilePaths=[...n.checkedFilePaths,r]):n.checkedFilePaths=n.checkedFilePaths.filter(o=>o!==r),n.filesItemMenu&&!n.checkedFilePaths.includes(n.filesItemMenu.path)&&M(e),e.render()),!0}if(t==="files-select-all"){s.stopPropagation();const r=a.checked,l=yn(n.filesEntries,{search:n.filesSearch,type:n.filesTypeFilter,sort:n.filesSort,order:n.filesOrder});return n.checkedFilePaths=r?l.map(o=>o.path):[],n.filesItemMenu&&!n.checkedFilePaths.includes(n.filesItemMenu.path)&&M(e),e.render(),!0}if(t==="files-copy"){const r=a.dataset.path??"";return r&&(j(e),M(e),et(e,"copy",[r])),!0}if(t==="files-move"){const r=a.dataset.path??"";return r&&(j(e),M(e),et(e,"move",[r])),!0}if(t==="files-bulk-copy")return n.checkedFilePaths.length===0||(j(e),M(e),et(e,"copy",[...n.checkedFilePaths])),!0;if(t==="files-bulk-move")return n.checkedFilePaths.length===0||(j(e),M(e),et(e,"move",[...n.checkedFilePaths])),!0;if(t==="files-bulk-download"){const r=Qt(n.filesEntries,n.checkedFilePaths);return r.downloadItems.length===0||(M(e),Es(r.downloadItems),e.render()),!0}if(t==="files-tree-select"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const r=a.dataset.path??"";return ht(e,r,n.filesTransfer.paths)||(n.filesTransferDest=r,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const r=a.dataset.path??"";if(t==="files-tree-retry"){const o={...n.filesTreeChildren};return delete o[r],n.filesTreeChildren=o,n.filesTreeExpanded.includes(r)||(n.filesTreeExpanded=[...n.filesTreeExpanded,r]),Bt(e,r),!0}return n.filesTreeExpanded.includes(r)?(n.filesTreeExpanded=n.filesTreeExpanded.filter(o=>o!==r),e.render()):(n.filesTreeExpanded=[...n.filesTreeExpanded,r],Bt(e,r)),!0}if(t==="files-transfer-close")return X(e),e.render(),!0;if(t==="files-bulk-delete")return n.checkedFilePaths.length===0||(n.filesDeletePaths=[...n.checkedFilePaths],n.filesRenamePath=null,X(e),j(e),M(e),e.render()),!0;if(t==="files-refresh"){M(e),n.busy=!0,e.clearFlash(),e.render();try{await ae(e),e.setFlash("success","Refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{n.busy=!1,e.render()}return!0}if(t==="files-mkdir")return n.filesMkdirOpen=!0,n.filesUploadMenuOpen=!1,ce(e),n.filesUploadDropActive=!1,n.filesRenamePath=null,n.filesDeletePaths=null,X(e),j(e),M(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return n.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open"){const r=a.dataset.path||(n.checkedFilePaths.length===1?n.checkedFilePaths[0]:"");return r&&(n.filesRenamePath=r,n.filesDeletePaths=null,X(e),n.filesUploadMenuOpen=!1,ce(e),j(e),M(e),e.render()),!0}if(t==="files-rename-close")return n.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const r=a.dataset.path??"";return n.filesDeletePaths=r?[r]:null,n.filesRenamePath=null,X(e),n.filesUploadMenuOpen=!1,ce(e),j(e),M(e),e.render(),!0}if(t==="files-delete-close")return n.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const r=n.filesDeletePaths?[...n.filesDeletePaths]:[];if(r.length===0)return!0;n.busy=!0,e.clearFlash(),e.render();try{if(r.length===1)await k.filesDelete(r[0]),w.event("files.delete",{path:r[0]}),e.setFlash("success","Deleted");else{const l=await k.filesBulk("delete",r);w.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?e.setFlash("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?e.setFlash("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):e.setFlash("error",l.errors[0]||"Delete failed")}n.filesDeletePaths=null,n.checkedFilePaths=[],await ae(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{n.busy=!1,e.render()}return!0}if(t==="files-download")return w.event("files.download",{path:a.getAttribute("href")??""}),!0;if(t==="files-preview-open"){const r=a.dataset.path??"";return r&&er(e,r),!0}if(t==="files-preview-close")return j(e),e.render(),!0;if(t==="files-preview-download"){const r=n.filesPreview;if(!r)return!0;const l=document.createElement("a");return l.href=k.filesDownloadUrl(r.path),l.download=r.name,l.rel="noopener",document.body.appendChild(l),l.click(),l.remove(),w.event("files.download",{path:r.path,via:"preview"}),!0}return t==="close-files-upload-progress"?(n.filesUploadProgress&&(n.filesUploadProgress.phase==="done"||n.filesUploadProgress.phase==="error")&&pn(e),!0):t==="files-upload-conflict-cancel"?(lt(e,"cancel"),!0):t==="files-upload-conflict-skip"?(lt(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(lt(e,"overwrite"),!0):!1}function vn(e){const{root:t}=e;t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(a=>{a.indeterminate=!0}),ta(e),e.state.filesItemMenu&&(t.querySelector("#files-item-menu")?(Ss(e),Ds(e)):e.state.filesItemMenu=null)}function wr(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function fe(e,t){var s;const a=(s=e.state.adminCapabilities)==null?void 0:s.pages;return a?a.find(n=>n.id===t)??null:null}function Ie(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Xe(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function hr(e){var i;const t=["overview","settings","users","database"],a={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},s=(i=e.state.adminCapabilities)==null?void 0:i.pages,n=new Map;if(s)for(const r of s)wr(r.id)&&n.set(r.id,r);return t.map(r=>{const l=n.get(r),o=(l==null?void 0:l.label)||a[r],c=(l==null?void 0:l.status)??(r==="overview"?"read-only":"full"),f=(l==null?void 0:l.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===r?" is-active":""}${f?" is-gated":""}"
          data-action="admin-page" data-admin-page="${r}"
          aria-selected="${e.state.adminPage===r}"
          title="${d(o)}${f?" — "+Ie(e,c):""}">
          ${d(o)}
        </button>`}).join("")}function St(e,t){const a=fe(e,t),s=(a==null?void 0:a.status)??"coming-soon",n=(a==null?void 0:a.label)??t,i=(a==null?void 0:a.summary)||"This area is not available in portal Administration yet.",r=Ie(e,s);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Xe(e,s)}">${d(r)}</span>
      <h2 class="admin-coming-soon-title">${d(n)}</h2>
    </div>
    <p class="muted">${d(i)}</p>
  </section>`}function Oe(e,t,a,s){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${d(String(a))}</div>
    <div class="admin-stat-label">${d(t)}</div>
    ${s?`<div class="admin-stat-hint muted small">${d(s)}</div>`:""}
  </div>`}function ge(e,t,a){return`<span class="badge ${t?"badge-ok":"badge-off"}">${d(a)}: ${t?"On":"Off"}</span>`}function ye(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function jt(e){var t;e.state.adminCapabilitiesError=null;try{const a=await k.adminCapabilities();e.state.adminCapabilities=a.data,w.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(a){e.state.adminCapabilitiesError=a instanceof Error?a.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},w.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function ft(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await k.adminDashboard();e.state.adminDashboard=t.data,w.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function we(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await k.adminUsers();e.state.adminUsers=t.users??[],w.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function te(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const a=await k.adminUser(t);e.state.adminUserDetail=a.user,e.state.adminSelectedUsername=a.user.username,w.debug("admin.user",{username:a.user.username})}catch(a){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=a instanceof Error?a.message:"Failed to load user",a}finally{e.state.adminUserDetailLoading=!1}}async function he(e,t){e.state.adminUserResourcesLoading=!0;try{const[a,s]=await Promise.all([k.adminUserCalendars(t),k.adminUserAddressBooks(t)]);e.state.adminUserCalendars=a.calendars??[],e.state.adminUserAddressBooks=s.addressbooks??[]}catch(a){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],a}finally{e.state.adminUserResourcesLoading=!1}}async function pt(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await k.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function bt(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await k.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const a=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=a==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function kr(e){var i;const t=fe(e,"overview");if(t&&t.available===!1)return St(e,"overview");const a=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${d(((i=e.state.user)==null?void 0:i.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let s="",n="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)n='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)n=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${d(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const r=e.state.adminDashboard,l=r.services,o=r.links??{},c=t?`<span class="badge ${Xe(e,t.status)}">${d(Ie(e,t.status))}</span>`:"",f=r.version?d(r.version):"—",m=r.git?d(r.git):"";s=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${_("About this system","admin-overview")}
          <div class="section-actions">
            ${c}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy||e.state.adminDashboardLoading?"disabled":""}>Refresh</button>
          </div>
        </div>
        <div class="admin-about-grid">
          <div>
            <h3 class="admin-subsection-title">Version</h3>
            <p>
              AngaraDAV <span class="badge badge-admin">v${f}</span>
              ${m?`<span class="mono muted small"> (${m})</span>`:""}
            </p>
            <p class="muted small admin-link-row">
              ${o.releases?`<a href="${d(o.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
              ${o.docs?`${o.releases?'<span class="footer-sep">·</span>':""}<a href="${d(o.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${ye(e,l.administration!==!1&&l.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${ye(e,!!l.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${ye(e,!!l.carddav)}</td></tr>
                  <tr><td>Files</td><td>${ye(e,!!l.files)}</td></tr>
                  <tr><td>Tasks</td><td>${ye(e,!!l.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${ye(e,!!l.notes)}</td></tr>
                  <tr><td>Push</td><td>${ye(e,!!l.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${a}
      </section>`;const b=r.nbusers??r.users,p=r.nbcalendars??r.calendars,g=r.nbevents??r.events,u=r.nbbooks??r.addressBooks,v=r.nbcontacts??r.contacts;n=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${Oe(e,"Registered users",b,"Users")}
          ${Oe(e,"Calendars",p,"CalDAV")}
          ${Oe(e,"Events",g,"CalDAV")}
          ${Oe(e,"Address books",u,"CardDAV")}
          ${Oe(e,"Contacts",v,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${ge(e,l.administration!==!1&&l.webAdmin!==!1,"Administration")}
          ${ge(e,!!l.caldav,"CalDAV")}
          ${ge(e,!!l.carddav,"CardDAV")}
          ${ge(e,!!l.files,"Files")}
          ${ge(e,!!l.tasks,"Tasks")}
          ${ge(e,!!l.notes,"Notes")}
          ${ge(e,!!l.push,"Push")}
        </div>
      </section>`}else n=`<section class="card">
      ${_("System snapshot","admin-overview")}
      ${a}
    </section>`;return`${s}
    ${n}`}function Sr(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(a=>a.username.toLowerCase().includes(t)||(a.displayname||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)):e.state.adminUsers}function Dr(e){return e.state.adminUserCreateOpen?x({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
        <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
          <label>Username
            <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${e.state.busy?"disabled":""} />
          </label>
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="password" required autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm password
            <input type="password" name="passwordConfirm" required autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function Cr(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return x({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
        <p class="muted small">Username <span class="mono">${d(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${d(t.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${d(t.displayname)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${d(t.email)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function Er(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,a=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(n=>n.username.toLowerCase()===t.toLowerCase())??null,s=a?`${a.displayname||a.username} (${a.username})`:t;return x({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${d(s)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${wt({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${d(t)}"`}]})}function Tr(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${d(e.state.adminSelectedUsername)}</span>…</p>
    </section>`;if(e.state.adminUserDetailError&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${d(e.state.adminUserDetailError)}</p>
    </section>`;if(!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail,a=e.state.adminUserResourcesLoading&&e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':e.state.adminUserCalendars.map(c=>`<tr>
        <td class="mono">${d(c.uri)}</td>
        <td>${d(c.displayname)}</td>
        <td class="hide-sm">${d(String(c.eventCount))}${c.todos?' <span class="badge badge-admin">tasks</span>':""}${c.notes?' <span class="badge badge-admin">notes</span>':""}</td>
        <td class="hide-sm mono small">${d(c.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${d(c.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),s=e.state.adminUserResourcesLoading&&e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':e.state.adminUserAddressBooks.map(c=>`<tr>
        <td class="mono">${d(c.uri)}</td>
        <td>${d(c.displayname)}</td>
        <td class="hide-sm">${d(String(c.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${c.id}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${c.id}" data-label="${d(c.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),n=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(c=>c.instanceId===e.state.adminCalEditId)??null:null,i=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(c=>c.id===e.state.adminAbEditId)??null:null,r=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&n?x({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
          <input type="hidden" name="instanceId" value="${n?n.instanceId:""}" />
          ${e.state.adminCalModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${e.state.busy?"disabled":""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${d(n.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${d((n==null?void 0:n.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${d((n==null?void 0:n.description)??"")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${d((n==null?void 0:n.calendarcolor)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${n!=null&&n.todos||e.state.adminCalModal==="create"?"checked":""} ${e.state.busy?"disabled":""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${n!=null&&n.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",l=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&i?x({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${i?i.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${d(i.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${d((i==null?void 0:i.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${d((i==null?void 0:i.description)??"")}</textarea>
          </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",o=e.state.adminResourceDelete?x({title:`Delete ${e.state.adminResourceDelete.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
        <p>Delete <strong>${d(e.state.adminResourceDelete.label)}</strong> for <span class="mono">${d(t.username)}</span>?</p>
        ${e.state.adminResourceDelete.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${e.state.adminResourceDelete.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:e.state.busy}]}):"";return`<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${d(t.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${d(t.username)}" ${e.state.busy?"disabled":""}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${d(t.username)}" ${e.state.busy?"disabled":""}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${d(t.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${d(t.username)}</dd></div>
      <div><dt>Display name</dt><dd>${d(t.displayname||"—")}</dd></div>
      <div><dt>Email</dt><dd>${t.email?`<a href="mailto:${d(t.email)}">${d(t.email)}</a>`:"—"}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${d(t.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${d(String(t.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${d(String(t.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${d(String(t.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${d(String(t.contactCount))}</dd></div>
    </dl>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Calendars</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${e.state.busy?"disabled":""}>Add calendar</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Address books</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${e.state.busy?"disabled":""}>Add address book</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
        <tbody>${s}</tbody>
      </table>
    </div>
  </section>
  ${r}${l}${o}`}function Pr(e){const t=fe(e,"users");if(t&&t.available===!1)return St(e,"users");const a=Sr(e),s=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':a.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?d(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:a.map(n=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===n.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${d(n.username)}" tabindex="0" role="button">
                <td class="mono">${d(n.username)}</td>
                <td class="hide-sm">${d(n.displayname||"—")}</td>
                <td class="hide-sm">${d(n.email||"—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${d(n.username)}" ${e.state.busy?"disabled":""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${d(n.username)}" ${e.state.busy?"disabled":""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${d(n.username)}" ${e.state.busy?"disabled":""}>Delete</button>
                </td>
              </tr>`).join("");return`
    <section class="card">
      <div class="section-header">
        ${_("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Xe(e,t.status)}">${d(Ie(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${e.state.busy||e.state.adminUsersLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${e.state.busy?"disabled":""}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${d(e.state.adminUsersQuery)}" aria-label="Filter users" ${e.state.busy?"disabled":""} />
        <span class="muted small">${d(String(a.length))}${e.state.adminUsersQuery.trim()?` / ${e.state.adminUsers.length}`:""} user${a.length===1?"":"s"}</span>
      </div>
      ${e.state.adminUsersError&&e.state.adminUsers.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${d(e.state.adminUsersError)}</p>`:""}
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
          <tbody>${s}</tbody>
        </table>
      </div>
    </section>
    ${Tr(e)}
    ${Dr(e)}
    ${Cr(e)}
    ${Er(e)}`}async function Fr(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!s||!n||!i||!r){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const o=await k.adminCreateUser({username:s,displayname:n,email:i,password:r,passwordConfirm:l});w.event("admin.user.create",{username:o.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=o.user.username,e.state.adminUserDetail=o.user,e.persistTab("admin","users",o.user.username),await we(e),e.setFlash("success",`Created user “${o.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function Ar(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!s){e.setFlash("error","Username is required"),e.render();return}if(!n||!i){e.setFlash("error","Display name and email are required"),e.render();return}if(r!==""||l!==""){if(r===""||l===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const o={displayname:n,email:i};r!==""&&(o.password=r,o.passwordConfirm=l);const c=await k.adminUpdateUser(s,o);w.event("admin.user.update",{username:c.user.username,passwordChanged:r!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=c.user,e.state.adminSelectedUsername=c.user.username,await we(e),e.setFlash("success",r!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function Ir(e,t){var c,f;if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),i=String(s.get("description")??"").trim(),r=String(s.get("calendarcolor")??"").trim(),l=((c=t.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,o=((f=t.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const m=String(s.get("uri")??"").trim().toLowerCase();await k.adminCreateUserCalendar(a,{uri:m,displayname:n,description:i,calendarcolor:r||void 0,todos:l,notes:o}),e.setFlash("success",`Created calendar “${n}”`)}else{const m=Number(s.get("instanceId"));await k.adminUpdateUserCalendar(a,m,{displayname:n,description:i,calendarcolor:r,todos:l,notes:o}),e.setFlash("success",`Updated calendar “${n}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await he(e,a),await te(e,a)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ur(e,t){if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),i=String(s.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const r=String(s.get("uri")??"").trim().toLowerCase();await k.adminCreateUserAddressBook(a,{uri:r,displayname:n,description:i}),e.setFlash("success",`Created address book “${n}”`)}else{const r=Number(s.get("id"));await k.adminUpdateUserAddressBook(a,r,{displayname:n,description:i}),e.setFlash("success",`Updated address book “${n}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await he(e,a),await te(e,a)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const Mr=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let Se=null;function Or(){if(Se)return Se;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return Se=[...t].sort((a,s)=>a.localeCompare(s)),Se}}catch{}return Se=[...Mr],Se}function $n(e){const t=e||"UTC",a=Or(),s=a.includes(t),n=a.map(i=>`<option value="${Ma(i)}" ${i===t?"selected":""}>${Oa(i)}</option>`);return!s&&t&&n.unshift(`<option value="${Ma(t)}" selected>${Oa(t)}</option>`),n.join("")}function Ma(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function Oa(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function xr(e){const t=fe(e,"settings");if(t&&t.available===!1)return St(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const a=e.state.adminSystemSettings;if(!a)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const s=(i,r,l)=>`<label class="check-row"><input type="checkbox" name="${d(i)}" ${r?"checked":""} ${e.state.busy||a.writable===!1?"disabled":""} /> ${d(l)}</label>`,n=(i,r,l,o="")=>`<label>${d(l)}
      <input type="number" name="${d(i)}" value="${d(String(r??0))}" ${e.state.busy||a.writable===!1?"disabled":""} />
      ${o?`<span class="muted small">${d(o)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${_("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Xe(e,t.status)}">${d(Ie(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${e.state.busy?"disabled":""}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
        <strong>session timeout</strong> affects portal idle sessions.
        ${a.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
      </p>
      <form class="stack admin-settings-form" data-form="admin-settings">
        <h3 class="admin-subsection-title">DAV services</h3>
        ${s("cal_enabled",!!a.cal_enabled,"Enable CalDAV")}
        ${s("card_enabled",!!a.card_enabled,"Enable CardDAV")}
        ${s("tasks_enabled",!!a.tasks_enabled,"Enable Tasks (VTODO)")}
        ${s("notes_enabled",!!a.notes_enabled,"Enable Notes (VJOURNAL)")}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["Digest","Basic","Apache"].map(i=>`<option value="${i}" ${a.dav_auth_type===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||a.writable===!1?"disabled":""}>
            ${$n(a.timezone||"UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${d(a.invite_from||"")}" placeholder="noreply@example.com" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${s("files_enabled",!!a.files_enabled,"Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${d(a.files_storage_path||"")}" placeholder="empty = Specific/files" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        ${n("files_max_upload_mb",a.files_max_upload_mb,"Max file size (MB)")}
        ${n("files_quota_mb",a.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
        ${n("files_quarantine_days",a.files_quarantine_days,"Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${n("session_max_age_minutes",a.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(a.portal_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        ${s("portal_admin_ui_enabled",a.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${d(Array.isArray(a.portal_admin_users)?a.portal_admin_users.join(", "):String(a.portal_admin_users||""))}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${s("push_enabled",!!a.push_enabled,"Enable WebDAV-Push")}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${d(a.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(a.push_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">baikal.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${a.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${e.state.busy||a.writable===!1?"disabled":""}>Save settings</button>
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
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${e.state.busy||a.writable===!1?"disabled":""}>
          Reset to Default
        </button>
      </div>
    </section>
    ${Nr(e)}`}function Nr(e){return e.state.adminResetModalOpen?x({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${wt({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${d(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function Lr(e,t){const a=new FormData(t),s=l=>{var o;return!!((o=t.querySelector(`input[name="${l}"]`))!=null&&o.checked)},n={cal_enabled:s("cal_enabled"),card_enabled:s("card_enabled"),tasks_enabled:s("tasks_enabled"),notes_enabled:s("notes_enabled"),files_enabled:s("files_enabled"),push_enabled:s("push_enabled"),portal_admin_ui_enabled:s("portal_admin_ui_enabled"),timezone:String(a.get("timezone")??"").trim(),invite_from:String(a.get("invite_from")??"").trim(),dav_auth_type:String(a.get("dav_auth_type")??"Digest"),files_storage_path:String(a.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(a.get("files_max_upload_mb")??0),files_quota_mb:Number(a.get("files_quota_mb")??0),files_quarantine_days:Number(a.get("files_quarantine_days")??0),session_max_age_minutes:Number(a.get("session_max_age_minutes")??15),portal_log_level:String(a.get("portal_log_level")??"off"),portal_admin_users:String(a.get("portal_admin_users")??"").trim(),push_external_url:String(a.get("push_external_url")??"").trim(),push_log_level:String(a.get("push_log_level")??"off")},i=String(a.get("admin_password")??""),r=String(a.get("admin_password_confirm")??"");(i!==""||r!=="")&&(n.admin_password=i,n.admin_password_confirm=r),e.state.busy=!0,e.clearFlash(),e.render();try{const l=await k.adminUpdateSystemSettings(n);e.state.adminSystemSettings=l.data;const o=l.data;e.state.portalUi={...e.state.portalUi,services:{caldav:!!o.cal_enabled,carddav:!!o.card_enabled,tasks:!!o.tasks_enabled,notes:!!o.notes_enabled,files:!!o.files_enabled}},w.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function wn(e,t){const a=new FormData(t),s=String(a.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",n={backend:s};return s==="sqlite"?n.sqlite_file=String(a.get("sqlite_file")??"").trim():(n.pgsql_host=String(a.get("pgsql_host")??"").trim(),n.pgsql_dbname=String(a.get("pgsql_dbname")??"").trim(),n.pgsql_username=String(a.get("pgsql_username")??"").trim(),n.pgsql_password=String(a.get("pgsql_password")??"")),n}function _r(e,t){e.state.adminDbPendingBody=wn(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function qr(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const a=wn(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const s=await k.adminTestDatabaseConnection(a);e.setFlash("success",s.message||"Connection successful"),w.event("admin.database.test",{backend:s.backend})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function Rr(e){const t=fe(e,"database");if(t&&t.available===!1)return St(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const a=e.state.adminDatabaseSettings;if(!a)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const s=e.state.adminDbFormBackend,n=a.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${_("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Xe(e,t.status)}">${d(Ie(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${e.state.busy?"disabled":""}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${d(a.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${d((a.backend||"—").toUpperCase())}</span></dd>
        </div>
        ${a.backend==="sqlite"||a.sqlite_file?`<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${d(a.sqlite_file||"—")}</dd>
        </div>`:""}
        ${a.backend==="pgsql"||a.pgsql_host?`<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${d(a.pgsql_host||"—")} / ${d(a.pgsql_dbname||"—")} · ${d(a.pgsql_username||"—")}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>${a.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>`:""}
        <div>
          <dt>Encryption key</dt>
          <dd>${a.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>
      </dl>

      <h3 class="admin-subsection-title">Edit connection</h3>
      ${n?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${e.state.busy||n?"disabled":""}>
            <option value="sqlite" ${s==="sqlite"?"selected":""}>SQLite</option>
            <option value="pgsql" ${s==="pgsql"?"selected":""}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${s==="sqlite"?"":"display:none"}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${d(a.sqlite_file||"")}" ${e.state.busy||n?"disabled":""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${s==="pgsql"?"":"display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${d(a.pgsql_host||"")}" placeholder="localhost:5432" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${d(a.pgsql_dbname||"")}" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${d(a.pgsql_username||"")}" autocomplete="off" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${a.hasPassword?"Leave blank to keep current":""}" ${e.state.busy||n?"disabled":""} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${e.state.busy||n?"disabled":""}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${e.state.busy||n?"disabled":""}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${Br(e)}`}function Br(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return x({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${d(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function hn(e,t,a={}){if(!e.userIsAdmin()){await e.activateTab("calendars",a);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):a.username!==void 0&&(e.state.adminSelectedUsername=a.username,a.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),w.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),a.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await jt(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const s=fe(e,t);t==="overview"&&(s==null?void 0:s.available)!==!1?await ft(e):t==="users"&&(s==null?void 0:s.available)!==!1?(await we(e),e.state.adminSelectedUsername&&(await te(e,e.state.adminSelectedUsername),await he(e,e.state.adminSelectedUsername))):t==="settings"&&(s==null?void 0:s.available)!==!1?await pt(e):t==="database"&&(s==null?void 0:s.available)!==!1&&await bt(e)}catch(s){w.warn("admin page load failed",s instanceof Error?s.message:s),e.setFlash("error",s instanceof Error?s.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function Hr(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?Pr(e):e.state.adminPage==="settings"?xr(e):e.state.adminPage==="database"?Rr(e):kr(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function Vr(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function jr(e,t,a,s){var n,i;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const r=Vr(a.dataset.adminPage);return r&&await hn(e,r),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await ft(e),e.setFlash("success","Overview refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await we(e),e.state.adminSelectedUsername&&await te(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const r=a.dataset.username??"";if(!r||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{await te(e,r),await he(e,r)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";if(!r)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==r.toLowerCase())&&await te(e,r),e.state.adminUserEditOpen=!0}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";return r&&(e.state.adminUserDeleteUsername=r,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const r=a;return e.state.adminUserDeleteConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminUserDeleteUsername??"";if(!r||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await k.adminDeleteUser(r,!0),w.event("admin.user.delete",{username:r}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((n=e.state.adminSelectedUsername)==null?void 0:n.toLowerCase())===r.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await we(e),e.setFlash("success",`Deleted user “${r}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(a.dataset.id),label:a.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(a.dataset.id),label:a.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((i=e.state.adminResourceDelete)==null?void 0:i.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!a.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const r=e.state.adminSelectedUsername,l=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{l.kind==="calendar"?await k.adminDeleteUserCalendar(r,l.id,!0):await k.adminDeleteUserAddressBook(r,l.id,!0,!!l.force),e.state.adminResourceDelete=null,await he(e,r),await te(e,r),e.setFlash("success","Deleted")}catch(o){e.setFlash("error",o instanceof Error?o.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await pt(e),e.setFlash("success","Settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const r=a;return e.state.adminResetConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=a.value;const r=e.root.querySelector('[data-action="admin-reset-confirm"]');return r&&(r.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r=await k.adminResetToDefault(!0,e.state.adminResetPassword);w.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const l=r.redirectUrl&&r.redirectUrl.startsWith("/")?r.redirectUrl:"/portal/install/";return window.location.assign(l),!0}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await bt(e),e.setFlash("success","Database settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const r=a;return e.state.adminDbFormBackend=r.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const r=a.closest("form");return qr(e,r),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const r=a;e.state.adminDbConfirmText=r.value,e.render();const l=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const o=l.value.length;l.setSelectionRange(o,o)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r={...e.state.adminDbPendingBody,confirm:"CONFIRM"},l=await k.adminUpdateDatabaseSettings(r);e.state.adminDatabaseSettings=l.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const o=(l.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=o==="pgsql"?"pgsql":"sqlite",w.event("admin.database.save",{backend:l.data.backend}),e.setFlash("success","Database settings saved")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function A(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${s}`}function gt(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return null;const a=new Date(Number(t[1]),Number(t[2])-1,Number(t[3]));return Number.isNaN(a.getTime())?null:a}function yt(e,t){return new Date(e.getFullYear(),e.getMonth(),e.getDate()+t)}function ia(e,t){const a=(e.getDay()-t+7)%7,s=yt(e,-a),n=[];for(let i=0;i<7;i++)n.push(yt(s,i));return{from:A(n[0]),to:A(n[6]),days:n}}function xa(e,t){const a=e.getFullYear()===t.getFullYear();if(a&&e.getMonth()===t.getMonth())return`${e.toLocaleString(void 0,{month:"short"})} ${e.getDate()}–${t.getDate()}, ${e.getFullYear()}`;const n=e.toLocaleString(void 0,{month:"short",day:"numeric",year:a?void 0:"numeric"}),i=t.toLocaleString(void 0,{month:"short",day:"numeric",year:"numeric"});return`${n} – ${i}`}function zt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,s,n]=e.split("-").map(Number);return new Date(a,s-1,n)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,s,n]=e.slice(0,10).split("-").map(Number);return new Date(a,(s||1)-1,n||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function la(e){const t=zt(e.start);if(!e.end)return[A(t)];let a=zt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[A(t)];const s=[],n=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(a.getFullYear(),a.getMonth(),a.getDate());let r=0;for(;n<=i&&r++<370;)s.push(A(n)),n.setDate(n.getDate()+1);return s.length?s:[A(t)]}function Ee(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):A(t)}function zr(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const a=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(a.hourCycle==="h23"||a.hourCycle==="h24")return!1;if(a.hourCycle==="h11"||a.hourCycle==="h12")return!0;if(typeof a.hour12=="boolean")return a.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function oa(e){return zr(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function da(e){var s;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(s=navigator.languages)!=null&&s.length?navigator.languages:[],navigator.language].filter(Boolean);for(const n of t)try{const i=new Intl.Locale(n),r=typeof i.getWeekInfo=="function"?i.getWeekInfo():i.weekInfo,l=r==null?void 0:r.firstDay;if(typeof l=="number")return l===7?0:l}catch{}const a=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(a)?0:1}function kn(e){const t=da(e),a=new Date(2024,0,7+t),s=[];for(let n=0;n<7;n++){const i=new Date(a);i.setDate(a.getDate()+n),s.push(i.toLocaleDateString(void 0,{weekday:"short"}))}return s}function Sn(e,t=15){const a=t*60*1e3,s=e.getTime();return s%a===0?new Date(s):new Date(Math.ceil(s/a)*a)}function Z(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Kr(e,t,a){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const n=e.slice(0,10),[i,r,l]=n.split("-").map(Number);return new Date(i,r-1,l).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const s=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(s.getTime())?e:s.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...oa(a)})}function Ce(e){if(!e){const a=Sn(new Date);return{date:A(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:A(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function He(e){const t=new Date,a=A(t);if(e&&e!==a){const[i,r,l]=e.split("-").map(Number),o=new Date(i,r-1,l,9,0,0,0),c=new Date(i,r-1,l,10,0,0,0);return{start:Z(o),end:Z(c)}}const s=Sn(t,15),n=new Date(s.getTime()+3600*1e3);return{start:Z(s),end:Z(n)}}function Wr(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function ca(e,t){const a=e.slice(0,10),s=(t||a).slice(0,10);if(a===s){const b=He(a);return{start:b.start,end:b.end}}const[n,i,r]=a.split("-").map(Number),[l,o,c]=s.split("-").map(Number),f=Z(new Date(n,i-1,r,9,0,0,0)),m=Z(new Date(l,o-1,c,17,0,0,0));return{start:f,end:m}}function Yr(e,t){const a=Ee(e);let s=t?Ee(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const n=new Date(t);if(!Number.isNaN(n.getTime())&&n.getHours()===0&&n.getMinutes()===0&&n.getTime()>new Date(e).getTime()){const i=zt(t);i.setDate(i.getDate()-1),s=A(i)}}return{start:a,end:s}}function Fe(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Jr(e){const{field:t,value:a,dateOnly:s,allowClear:n,viewY:i,viewM:r,weekStart:l,timeFormat:o}=e,c=Ce(a),f=da(l),m=kn(l),p=(new Date(i,r,1).getDay()-f+7)%7,g=new Date(i,r+1,0).getDate(),u=new Date(i,r,0).getDate(),v=c.date,$=c.hm,S=[],C=Math.ceil((p+g)/7)*7;for(let h=0;h<C;h++){let P,F,O=!1;h<p?(P=u-p+h+1,F=new Date(i,r-1,P),O=!0):h>=p+g?(P=h-(p+g)+1,F=new Date(i,r+1,P),O=!0):(P=h-p+1,F=new Date(i,r,P));const N=A(F),R=N===v,B=N===A(new Date);S.push(`<button type="button" class="dt-day${O?" is-outside":""}${R?" is-selected":""}${B?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${d(N)}">${P}</button>`)}const y=new Date().getFullYear(),T=Math.min(1900,i),I=Math.max(y+30,i),q=Array.from({length:12},(h,P)=>{const F=new Date(2e3,P,1).toLocaleString(void 0,{month:"short"});return`<option value="${P}" ${P===r?"selected":""}>${d(F)}</option>`}).join(""),V=[];for(let h=T;h<=I;h++)V.push(`<option value="${h}" ${h===i?"selected":""}>${h}</option>`);const re=s?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Wr().map(h=>{const P=(()=>{const[F,O]=h.split(":").map(Number);return new Date(2e3,0,1,F,O).toLocaleTimeString(void 0,oa(o))})();return`<button type="button" class="dt-time${h===$?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${h}" role="option" aria-selected="${h===$}">${d(P)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${s?"":" and time"}">
      <div class="dt-popover-inner${s?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${d(t)}" aria-label="Month">${q}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${d(t)}" aria-label="Year">${V.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${m.map(h=>`<span class="dt-dow">${d(h)}</span>`).join("")}</div>
          <div class="dt-days">${S.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(t)}" ${n?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${re}
      </div>
    </div>`}function Gr(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const a=t.querySelector(".dt-trigger"),s=t.querySelector(".dt-popover");if(!a||!s)return;const n=a.getBoundingClientRect(),i=8;s.style.position="fixed",s.style.visibility="hidden",s.style.top="0",s.style.left="0";const r=s.offsetWidth||320,l=s.offsetHeight||300;let o=n.bottom+6;o+l>window.innerHeight-i&&(o=Math.max(i,n.top-l-6));let c=n.left;c+r>window.innerWidth-i&&(c=Math.max(i,window.innerWidth-r-i)),c<i&&(c=i),s.style.top=`${Math.round(o)}px`,s.style.left=`${Math.round(c)}px`,s.style.right="auto",s.style.visibility="visible",s.style.zIndex="200"})}function ua(e,t){const a=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return a;const s=new Date(t.start);return Number.isNaN(s.getTime())?a:`${s.toLocaleTimeString(void 0,e.timeFormatOpts())} ${a}`}function Xr(e,t,a){return new Date(t,a,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Dt(e){return gt(e.state.calFocusDay)??new Date}function ma(e){const t=e.state.eventSearch.trim().toLowerCase();return t?e.state.monthEvents.filter(a=>(a.summary||"").toLowerCase().includes(t)):e.state.monthEvents}function Qr(e){const t=e.localeWeekStart(),a=Dt(e);if(e.state.calView==="week"){const l=ia(a,t);return{from:l.from,to:l.to}}if(e.state.calView==="agenda"){const l=yt(a,34);return{from:A(a),to:A(l)}}const s=e.state.monthCursor.y,n=e.state.monthCursor.m,i=new Date(s,n,1),r=new Date(s,n+1,0);return{from:A(i),to:A(r)}}function Zr(e){return e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start)?gt(e.start.slice(0,10))??new Date(NaN):new Date(e.start)}function Ut(e){return e.getHours()*60+e.getMinutes()}function Dn(e){return e==="month"||e==="week"||e==="agenda"?e:null}function Cn(e){return`${ns}:${e}`}function ei(e){if(!e)return null;try{const t=localStorage.getItem(Cn(e));if(t==null||t==="")return null;const a=JSON.parse(t);if(!a||typeof a!="object")return null;const s=a;let n=[];Array.isArray(s.ids)&&(n=s.ids.map(l=>Number(l)).filter(l=>Number.isFinite(l)&&l>0).map(l=>Math.floor(l)));let i=null;if(s.selectedId===null||s.selectedId===void 0)i=null;else{const l=Number(s.selectedId);i=Number.isFinite(l)&&l>0?Math.floor(l):null}const r=Dn(s.view)??void 0;return{ids:n,selectedId:i,view:r}}catch{return null}}function Ke(e){var a;const t=(a=e.user)==null?void 0:a.username;if(t)try{const s={ids:e.selectedIds.slice(),selectedId:e.selectedId,view:Dn(e.calView)??"month"};localStorage.setItem(Cn(t),JSON.stringify(s))}catch{}}async function fa(e,t){const a=await k.shares(t);e.state.shares=a.shares}function ti(e){const t=e.state.calendars.filter(s=>s.canShare);if(t.length===0)return null;const a=s=>{const n=s.uri.toLowerCase(),i=s.displayname.toLowerCase();return n==="default"||i==="default"||i==="default calendar"};return t.find(a)??t[0]??null}async function Ct(e){const t=e.state.selectedIds.filter(n=>e.state.calendars.some(i=>i.id===n));if(t.length===0){e.state.monthEvents=[];return}const{from:a,to:s}=Qr(e);e.state.monthEventsLoading=!0,w.debug("loadMonthEvents",{selectedIds:t,from:a,to:s});try{const i=(await Promise.all(t.map(async r=>(await k.calendarEvents(r,a,s)).events.map(o=>({...o,instanceId:r}))))).flat();i.sort((r,l)=>{const o=r.start||"",c=l.start||"";return o!==c?o<c?-1:1:(r.summary||"").localeCompare(l.summary||"")}),e.state.monthEvents=i,w.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:a,to:s})}catch(n){e.state.monthEvents=[],w.warn("loadMonthEvents failed",n instanceof Error?n.message:n)}finally{e.state.monthEventsLoading=!1}}function pa(e,t){const a=e.state.calendars.find(s=>s.id===t);return a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6"}function ai(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(a=>a!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t),Ke(e.state)}function ba(e){const t=e.state.calendars.filter(p=>e.state.selectedIds.includes(p.id)),a=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,s=t.slice(0,6).map(p=>{const g=p.color&&p.color.length>=7?p.color.slice(0,7):p.color||"#3B82F6";return`<span class="cal-swatch" style="background:${d(g)};margin-top:0" title="${d(p.displayname)}"></span>`}).join(""),n=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",i=e.state.calView,r=Dt(e);let l,o,c;if(i==="week"){const p=ia(r,e.localeWeekStart());l=xa(p.days[0],p.days[6]),o="Previous week",c="Next week"}else i==="agenda"?(l=`Agenda · ${xa(r,new Date(r.getFullYear(),r.getMonth(),r.getDate()+34))}`,o="Previous period",c="Next period"):(l=Xr(e,e.state.monthCursor.y,e.state.monthCursor.m),o="Previous month",c="Next month");const m=[{id:"month",label:"Month"},{id:"week",label:"Week"},{id:"agenda",label:"Agenda"}].map(p=>`<button type="button" class="btn btn-ghost btn-small cal-view-btn${i===p.id?" is-active":""}" data-action="cal-view" data-view="${p.id}" ${e.state.busy?"disabled":""}>${p.label}</button>`).join(""),b=`<div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="${d(o)}" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="${d(c)}" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${d(l)}</h2>
      <div class="cal-view-toggle" role="group" aria-label="Calendar view">${m}</div>
      <input type="search" class="cal-event-search" data-action="event-search" placeholder="Search events…"
        value="${d(e.state.eventSearch)}" aria-label="Search events" ${e.state.busy?"disabled":""} />
      <span class="month-cal-name muted small" title="${d(a)}">
        ${s}
        ${d(a)}
      </span>
    </div>`;return{calName:a,swatches:s,emptyHint:n,toolbar:b}}function ni(e){const t=ba(e),a=Dt(e),s=ma(e),n=new Map;for(const o of s)for(const c of la(o)){const f=n.get(c)??[];f.push(o),n.set(c,f)}const i=A(new Date),r=[];for(let o=0;o<35;o++){const c=yt(a,o),f=A(c),m=n.get(f)??[];if(m.length===0)continue;const b=c.toLocaleString(void 0,{weekday:"long",month:"long",day:"numeric",year:"numeric"}),p=m.map(g=>{var y;const u=g.instanceId,v=ua(e,g),$=pa(e,u),S=((y=e.state.calendars.find(T=>T.id===u))==null?void 0:y.displayname)||"",C=S?`${v} · ${S}`:v;return`<button type="button" class="agenda-event" title="${d(C)}" style="--ev-color:${d($)}"
            data-action="open-event" data-instance="${u}" data-uri="${d(g.uri)}" ${e.state.busy?"disabled":""}>${d(v)}</button>`}).join("");r.push(`<section class="agenda-day${f===i?" is-today":""}">
      <h3 class="agenda-day-title">${d(b)}</h3>
      <div class="agenda-list">${p}</div>
    </section>`)}const l=r.length>0?r.join(""):`<p class="muted" style="margin:0.5rem 0 0">${e.state.eventSearch.trim()?"No events match this search in the current range.":"No events in this period."}</p>`;return`<section class="card month-cal-card agenda-cal-card">
    ${t.toolbar}
    ${t.emptyHint}
    <div class="agenda-wrap">${l}</div>
  </section>`}const We=40;function Na(e,t,a){var m;const s=t.instanceId,n=ua(e,t),i=pa(e,s),r=((m=e.state.calendars.find(b=>b.id===s))==null?void 0:m.displayname)||"",l=r?`${n} · ${r}`:n;let o=0,c=We;if(!t.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(t.start)){const b=Zr(t);A(b)===a&&(o=Ut(b)/60*We);const p=t.end&&!/^\d{4}-\d{2}-\d{2}$/.test(t.end)?new Date(t.end):null;if(p&&!Number.isNaN(p.getTime())){const g=A(b)===a?Ut(b):0,u=A(p)===a?Ut(p):1440;c=Math.max(18,(u-g)/60*We)}}const f=t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start)?`--ev-color:${d(i)}`:`--ev-color:${d(i)};top:${o}px;height:${c}px`;return`<button type="button" class="week-event${t.allDay?"":" is-timed"}" title="${d(l)}"
      style="${f}"
      data-action="open-event" data-instance="${s}" data-uri="${d(t.uri)}" ${e.state.busy?"disabled":""}>${d(n)}</button>`}function si(e){const t=ba(e),a=Dt(e),{days:s}=ia(a,e.localeWeekStart()),n=A(new Date),i=ma(e),r=new Map;for(const b of i)for(const p of la(b)){const g=r.get(p)??[];g.push(b),r.set(p,g)}const l=Array.from({length:24},(b,p)=>{const u=new Date(2024,0,1,p).toLocaleTimeString(void 0,e.timeFormatOpts());return`<div class="week-hour-label" style="height:${We}px">${d(u)}</div>`}).join(""),o=(()=>{const b=e.state.selectedId!==null?e.state.calendars.find(p=>p.id===e.state.selectedId)??null:null;return!!(b&&!b.readOnly&&(b.canShare||b.access==="readwrite"))})(),c=[],f=[],m=[];for(const b of s){const p=A(b),g=p===n,u=r.get(p)??[],v=u.filter(I=>I.allDay||/^\d{4}-\d{2}-\d{2}$/.test(I.start)),$=u.filter(I=>!I.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(I.start)),S=v.map(I=>Na(e,I,p)).join(""),C=$.map(I=>Na(e,I,p)).join(""),y=b.toLocaleString(void 0,{weekday:"short",month:"short",day:"numeric"});c.push(`<div class="week-day-head${g?" is-today":""}"${o?` data-action="new-event-day" data-day="${d(p)}" role="button" tabindex="0" title="Add event on ${d(p)}"`:""}>${d(y)}</div>`),f.push(`<div class="week-allday${g?" is-today":""}">${S||'<span class="week-allday-empty"></span>'}</div>`);const T=o?`<div class="week-slots">${Array.from({length:24},(I,q)=>{const V=String(q).padStart(2,"0");return`<button type="button" class="week-slot" data-action="new-event-slot" data-day="${d(p)}" data-hour="${q}" title="Add event at ${d(p)} ${V}:00" ${e.state.busy?"disabled":""}></button>`}).join("")}</div>`:"";m.push(`<div class="week-timed${g?" is-today":""}${o?" is-clickable":""}" style="height:${24*We}px">${T}${C}</div>`)}return`<section class="card month-cal-card week-cal-card">
    ${t.toolbar}
    ${t.emptyHint}
    <div class="week-wrap">
      <div class="week-frozen">
        <div class="week-grid-row week-head-row">
          <div class="week-gutter-head"></div>
          ${c.join("")}
        </div>
        <div class="week-grid-row week-allday-row">
          <div class="week-gutter-allday muted small">All day</div>
          ${f.join("")}
        </div>
      </div>
      <div class="week-grid-row week-timed-row">
        <div class="week-hours">${l}</div>
        ${m.join("")}
      </div>
    </div>
  </section>`}function ri(e){return e.state.calView==="week"?si(e):e.state.calView==="agenda"?ni(e):li(e)}function ii(e){return ri(e)}function li(e){const t=e.state.monthCursor.y,a=e.state.monthCursor.m,s=new Date(t,a,1),n=e.localeWeekStart(),i=(s.getDay()-n+7)%7,r=new Date(t,a+1,0).getDate(),l=new Date(t,a,0).getDate(),c=A(new Date),f=e.localeDowLabels(),m=new Map;for(const u of ma(e))for(const v of la(u)){const $=m.get(v)??[];$.push(u),m.set(v,$)}const b=[],p=Math.ceil((i+r)/7)*7;for(let u=0;u<p;u++){let v,$=!0,S;u<i?(v=l-i+u+1,$=!1,S=new Date(t,a-1,v)):u>=i+r?(v=u-(i+r)+1,$=!1,S=new Date(t,a+1,v)):(v=u-i+1,S=new Date(t,a,v));const C=A(S),y=C===c,T=$?m.get(C)??[]:[],I=e.state.monthExpandDay===C?50:3,q=T.slice(0,I),V=T.length-q.length,re=q.map(N=>{var ha;const R=N.instanceId,B=ua(e,N),J=pa(e,R),Qe=((ha=e.state.calendars.find(_n=>_n.id===R))==null?void 0:ha.displayname)||"",Ln=Qe?`${B} · ${Qe}`:B;return`<button type="button" class="month-event${N.allDay?"":" is-timed"}" title="${d(Ln)}" style="--ev-color:${d(J)}"
          data-action="open-event" data-instance="${R}" data-uri="${d(N.uri)}" ${e.state.busy?"disabled":""}>${d(B)}</button>`}).join(""),h=V>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(C)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${V} more</button>`:"",P=!$&&(v===1||u===i+r)?S.toLocaleString(void 0,{month:"short",day:"numeric"}):String(v),F=e.state.selectedId!==null?e.state.calendars.find(N=>N.id===e.state.selectedId)??null:null,O=!!(F&&!F.readOnly&&(F.canShare||F.access==="readwrite"));b.push(`<div class="month-cell${$?"":" is-outside"}${y?" is-today":""}${O?" is-clickable":""}"${O?` data-action="new-event-day" data-day="${d(C)}" role="button" tabindex="0" title="Add event on ${d(C)}"`:""}>
      <div class="month-daynum${y?" is-today-num":""}">${d(P)}</div>
      <div class="month-events">${re}${h}</div>
    </div>`)}const g=ba(e);return`<section class="card month-cal-card">
    ${g.toolbar}
    ${g.emptyHint}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${f.map(u=>`<div class="month-dow">${d(u)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${b.join("")}
      </div>
    </div>
  </section>`}function ga(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function oi(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Ge(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),s=String(e.get("repeatEndMode")??"never"),n=s==="until"||s==="count"?s:"never";let i=null,r=null;if(n==="until"){const o=String(e.get("repeatUntil")??"").trim();i=o?o.slice(0,10):null}else if(n==="count"){const o=Number(e.get("repeatCount")??0);r=Number.isFinite(o)&&o>0?Math.min(999,Math.round(o)):10}const l=e.getAll("repeatByDay").map(o=>String(o).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:i,count:r,byDay:l,endMode:n}}function di(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,a=t.repeat??ga(),s=(a.freq||"").toUpperCase(),n=e.state.calendars.filter(g=>g.canShare||g.access==="readwrite"),i=e.state.calendars.filter(g=>g.id===t.instanceId?!0:g.readOnly?!1:g.canShare||g.access==="readwrite").map(g=>`<option value="${g.id}" ${g.id===t.instanceId?"selected":""}>${d(g.displayname)}</option>`).join(""),r=t.readOnly||!t.canWrite;let l,o;if(t.allDay)l=Ee(t.start),o=Ee(t.end);else{const g=t.start||"",u=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(g)){const v=ca(g,u||null);l=v.start,o=v.end||""}else l=Fe(t.start),o=Fe(t.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((a.byDay||[]).map(g=>g.toUpperCase())),m=oi(a),b=!!s&&m==="until",p=a.until||(m==="until"?Ee(t.start)||A(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${e.state.creatingEvent?"New event":"Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${e.renderFlashBanner()}
        ${!e.state.creatingEvent&&(t.hasRrule||s)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
        ${r?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${r||n.length===0?"disabled":""}>
              ${i||`<option value="${t.instanceId}">${d(t.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${d(t.summary)}" ${r?"readonly":""} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${d(t.location)}" ${r?"readonly":""} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${r?"readonly":""}>${d(t.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${r?"disabled":""} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${e.renderPortalDateTimeField({field:"start",name:"start",label:"Start",value:l,dateOnly:t.allDay,required:!0,disabled:r,allowClear:!1})}
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:o,dateOnly:t.allDay,disabled:r||b,allowClear:!b})}
          </div>
          <fieldset class="event-repeat" ${r?"disabled":""}>
            <legend class="event-repeat-legend">Repeat</legend>
            <div class="form-grid form-grid-2">
              <label>Frequency
                <select name="repeatFreq" data-action="event-repeat-freq">
                  <option value="" ${s?"":"selected"}>Does not repeat</option>
                  <option value="DAILY" ${s==="DAILY"?"selected":""}>Daily</option>
                  <option value="WEEKLY" ${s==="WEEKLY"?"selected":""}>Weekly</option>
                  <option value="MONTHLY" ${s==="MONTHLY"?"selected":""}>Monthly</option>
                  <option value="YEARLY" ${s==="YEARLY"?"selected":""}>Yearly</option>
                </select>
              </label>
              <label>Every
                <input type="number" name="repeatInterval" min="1" max="99" value="${d(String(a.interval||1))}" ${s?"":"disabled"} />
              </label>
            </div>
            ${s==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${c.map(g=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${g.code}" ${f.has(g.code)?"checked":""} />
                            ${g.label}
                          </label>`).join("")}
                  </div>`:""}
            ${s?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${m==="never"?"selected":""}>Never</option>
                        <option value="until" ${m==="until"?"selected":""}>On date</option>
                        <option value="count" ${m==="count"?"selected":""}>After count</option>
                      </select>
                    </label>
                    ${m==="until"?e.renderPortalDateTimeField({field:"until",name:"repeatUntil",label:"Until",value:p,dateOnly:!0,disabled:r,allowClear:!0}):m==="count"?`<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${d(String(a.count||10))}" />
                            </label>`:"<span></span>"}
                  </div>`:""}
          </fieldset>
          <div class="form-actions-row" style="margin-top:0.5rem">
            ${r?"":`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingEvent?"Create event":"Save event"}</button>
                   ${e.state.creatingEvent?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${e.state.busy?"disabled":""}>Delete</button>`}`}
            <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`}function En(e,t){const a=e.state.calendars.find(s=>s.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",hasRrule:!1,repeat:ga(),readOnly:!1,canWrite:!0}}function ci(e,t,a){return{...En(e,a),start:t,end:t,allDay:!0}}function ui(e,t,a,s){const[n,i,r]=t.split("-").map(Number),l=Math.max(0,Math.min(23,Math.floor(a))),o=new Date(n,i-1,r,l,0,0,0),c=new Date(o.getTime()+3600*1e3);return{...En(e,s),start:Z(o),end:Z(c),allDay:!1}}function mi(e,t){if(!e.state.editingEvent)return;const a=new FormData(t),s=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(a.get("summary")??e.state.editingEvent.summary),description:String(a.get("description")??e.state.editingEvent.description),location:String(a.get("location")??e.state.editingEvent.location),instanceId:Number(a.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(s==null?void 0:s.checked)??e.state.editingEvent.allDay,start:String(a.get("start")??e.state.editingEvent.start??""),end:String(a.get("end")??e.state.editingEvent.end??"")||null,repeat:Ge(a),hasRrule:!!String(a.get("repeatFreq")??"").trim()}}function ue(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function Tn(e){ue(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){ue(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&Fn(e,e.state.importProgress)},1e3)}function Ve(e,t,a={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...a},e.render())}function fi(e){ue(e),e.state.importProgress=null,e.render()}function Pn(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Fn(e,e.state.importProgress))}function Fn(e,t){const a=e.root.querySelector("[data-import-status-line]"),s=e.root.querySelector(".import-progress-bar"),n=e.root.querySelector(".import-progress-track"),i=e.root.querySelector("[data-import-counts]"),r=t.kind==="calendar"?"items":"contacts";let l;if(t.phase==="processing"&&t.processTotal>0)l=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${r} (${t.processPercent??0}%) · ${Q(t.elapsedSec)}`;else if(t.phase==="processing")l=`Importing on server… ${Q(t.elapsedSec)}`;else return;a&&(a.textContent=l),i&&(i.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),s&&t.processPercent!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),n&&t.processPercent!==null&&(n.setAttribute("aria-valuenow",String(t.processPercent)),n.removeAttribute("aria-valuetext"))}function pi(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,a=t.phase!=="done"&&t.phase!=="error",s=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",n=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",i=(()=>{const o=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return o.map((m,b)=>{let p="pending";return t.phase==="done"||b<f?p="done":b===f&&(p=(t.phase==="error","active")),`<li class="import-step import-step-${p}"><span class="import-step-icon" aria-hidden="true">${p==="done"?"✓":p==="active"?"●":"○"}</span> ${d(m.label)}</li>`}).join("")})();let r="";if(a){let o=null;t.phase==="reading"&&t.readPercent!==null?o=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(o=Math.min(100,Math.max(0,t.processPercent)));const c=o===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=o!==null?` style="width:${o}%"`:"",m=t.kind==="calendar"?"items":"contacts";let b;t.phase==="reading"?b=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?b="Uploading to server…":t.processTotal>0?b=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${m} (${t.processPercent??0}%) · ${Q(t.elapsedSec)}`:b=`Importing on server… ${Q(t.elapsedSec)}`;const p=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';r=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${d(s)}</strong> from
        <span class="mono">${d(t.fileName)}</span>
        ${t.fileSizeLabel?` <span class="muted">(${d(t.fileSizeLabel)})</span>`:""}
      </p>
      <ul class="import-steps">${i}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${o!==null?`aria-valuenow="${o}"`:'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${c}"${f}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${d(b)}</p>
      ${p}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?r=`
      ${ne("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · Took ${d(Q(t.elapsedSec))}
      </p>`:r=`
      ${ne("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · After ${d(Q(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const l=a?'<p class="muted small" style="margin:0">Please wait…</p>':Gt([{label:"Close",action:"close-import-progress",variant:"primary"}]);return x({title:n,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:a,lockBackdrop:a,body:r,footer:l})}function An(e,t,a){return new Promise((s,n)=>{const i=new FileReader;i.onprogress=r=>{r.lengthComputable&&r.total>0?a(Math.min(100,Math.round(r.loaded/r.total*100))):a(null)},i.onload=()=>s(String(i.result??"")),i.onerror=()=>n(i.error??new Error("Failed to read file")),i.readAsText(t)})}async function bi(e,t){var s;if(e.state.selectedId===null)return;const a=(s=t.files)==null?void 0:s[0];t.value="",a&&(e.state.calModalOpen=!0,await In(e,e.state.selectedId,a,{keepEditModalOpen:!0}))}async function gi(e,t){var f;const a=(f=t.files)==null?void 0:f[0];if(t.value="",!a)return;const s=e.root.querySelector('[data-form="create-cal"]'),n=s?new FormData(s):new FormData,i=n.get("holidays")==="on",r=n.get("readOnly")==="on";if(i){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(r){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let l=String(n.get("displayname")??"").trim();l||(l=a.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const o=String(n.get("description")??""),c=String(n.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const m=await k.createCalendar({displayname:l,description:o,color:c,readOnly:!1});e.state.selectedId=m.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${m.calendar.displayname}” — importing…`),await In(e,m.calendar.id,a,{keepEditModalOpen:!1,successPrefix:`Calendar “${m.calendar.displayname}” created. `})}catch(m){const b=m instanceof Error?m.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",b),e.state.busy=!1,e.render()}}async function In(e,t,a,s={}){e.state.busy=!0,e.clearFlash(),ue(e),e.state.importProgress={kind:"calendar",fileName:a.name,fileSizeLabel:mt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Tn(e),e.render();try{const n=await An(e,a,l=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:l};const o=e.root.querySelector(".import-progress-bar"),c=e.root.querySelector("[data-import-status-line]");o&&l!==null&&(o.classList.remove("is-indeterminate"),o.style.width=`${l}%`),c&&l!==null&&(c.textContent=`Reading file… ${l}%`)});Ve(e,"uploading",{readPercent:100}),Ve(e,"processing",{processPercent:0}),w.event("import.calendar.start",{file:a.name,bytes:a.size,calId:t});const i=await k.importCalendar(t,n,l=>{Pn(e,l)}),r=e.formatImportResult(i);e.state.selectedId===t&&await Ct(e),ue(e),Ve(e,"done",{ok:!0,resultMessage:`${r} (from “${a.name}”)`}),e.setFlash("success",`${s.successPrefix||""}Import finished for “${a.name}”: ${r}.`)}catch(n){const i=n instanceof Error?n.message:"Import failed";ue(e),Ve(e,"error",{ok:!1,resultMessage:i}),e.setFlash("error",i)}finally{s.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function yi(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("access")??"read");if(!s){e.setFlash("error","Select a user to share with"),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await k.share(e.state.selectedId,s,n),await fa(e,e.state.selectedId),e.setFlash("success",`Shared with ${s}`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function vi(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),i=String(a.get("location")??"").trim(),r=a.get("allDay")==="on",l=String(a.get("start")??"").trim(),o=String(a.get("end")??"").trim(),c=Number(a.get("instanceId"))||e.state.editingEvent.instanceId,f=Ge(a);if(!s){e.setFlash("error","Title is required"),e.render();return}if(!l){e.setFlash("error","Start is required"),e.render();return}let m,b;if(r)m=l.slice(0,10),b=o?o.slice(0,10):m;else if(/^\d{4}-\d{2}-\d{2}$/.test(l)){const v=ca(l,o||null);m=new Date(v.start).toISOString(),b=v.end?new Date(v.end).toISOString():null}else m=new Date(l).toISOString(),b=o?new Date(o).toISOString():null;const p=e.state.editingEvent.instanceId,g=e.state.editingEvent.uri,u=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),w.event(u?"event.create":"event.update",{instanceId:c,uri:u?null:g,allDay:r,summary:s});try{const v={summary:s,description:n,location:i,allDay:r,start:m,end:b,instanceId:c,repeat:f},$=u?await k.createEvent(c,v):await k.updateEvent(p,g,v);(e.state.selectedId===null||$.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=$.event.instanceId),await Ct(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,w.event(u?"event.created":"event.saved",{uri:$.event.uri,instanceId:$.event.instanceId}),e.setFlash("success",me("Event",$.event.summary||s,u?"created":"saved"))}catch(v){w.warn("event.save failed",v instanceof Error?v.message:v),e.setFlash("error",v instanceof Error?v.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function $i(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),i=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const r=await k.updateCalendar(e.state.selectedId,{displayname:s,description:n,color:i});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=r.calendar.id,await fa(e,e.state.selectedId),await Ct(e),e.setFlash("success","Calendar updated")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function wi(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),i=String(a.get("color")??"").trim(),r=a.get("holidays")==="on",l=String(a.get("holidayCountry")??"").trim(),o=a.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,r&&!l){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!r&&!s){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const c=await k.createCalendar({displayname:s,description:n,color:i,holidays:r,holidayCountry:r?l:void 0,readOnly:o});e.state.selectedId=c.calendar.id,e.state.selectedIds.includes(c.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,c.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let f=`Created “${c.calendar.displayname}”`;const m=c.holidayImport??c.calendar.holidayImport;m&&(f+=`. Holidays imported: ${e.formatImportResult(m)}.`),o&&(f+=" Calendar is read-only."),e.setFlash("success",f)}catch(c){e.state.createCalModalOpen=!0,e.setFlash("error",c instanceof Error?c.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function Un(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const a=t.querySelector('input[name="holidays"]'),s=t.querySelector("#holidays-country-wrap"),n=t.querySelector('input[name="displayname"]'),i=t.querySelector('input[name="readOnly"]');if(!a||!s)return;const r=a.checked;s.hidden=!r,n&&(n.required=!r,r&&!n.value.trim()?n.placeholder="Auto: Holidays (XX)":r||(n.placeholder="Work")),r&&i&&(i.checked=!0)}function hi(e){Un(e)}function La(e){const{state:t}=e,a=t.calendars.filter(u=>u.canShare),s=t.calendars.filter(u=>!u.canShare),n=t.calendars.find(u=>u.id===t.selectedId)??null,i=a.map(u=>{const v=t.selectedIds.includes(u.id),$=v?" is-selected":"",S=u.id===t.selectedId?" is-primary":"",C=u.color?`<span class="cal-swatch" style="background:${d(u.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',y=e.accessBadge(u.access)+(u.readOnly?'<span class="badge">read-only</span>':"")+(u.holidaysCountry?`<span class="badge badge-admin">holidays ${d(u.holidaysCountry)}</span>`:"");return`<div class="cal-row${$}${S}" data-action="select-cal" data-id="${u.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${u.id}" ${v?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${C}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(u.displayname)}</span>
          <span class="cal-row-badges">${y}</span>
          <span class="muted small mono cal-row-uri">${d(u.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${u.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${u.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${u.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),r=s.map(u=>{const v=t.selectedIds.includes(u.id),$=v?" is-selected":"",S=u.id===t.selectedId?" is-primary":"",C=u.color?`<span class="cal-swatch" style="background:${d(u.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',y=u.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${$}${S}" data-action="select-cal" data-id="${u.id}" role="button" tabindex="0" title="${d(y)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${u.id}" ${v?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${C}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(u.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(u.access)}</span>
          <span class="muted small">${u.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${u.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),l=t.directory.map(u=>`<option value="${d(u.username)}">${d(u.displayname)} (${d(u.username)})</option>`).join(""),o=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(u=>`<tr>
              <td>
                <strong>${d(u.displayname||u.username||u.href)}</strong>
                <div class="muted small mono">${d(u.username||u.href)}</div>
              </td>
              <td>${e.accessBadge(u.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${d(u.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),c=n!=null&&n.color&&n.color.length>=7?n.color.slice(0,7):"#3B82F6",f=!!(n&&n.readOnly),m=t.calModalOpen&&n&&n.canShare?x({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${d(n.uri)}
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
                      value="${d(n.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${d(c)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${d(n.color||c)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${d(n.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${d(n.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${_(`Share “${n.displayname}”`,"share")}
                ${f?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                <form class="form-grid" data-form="share" style="margin-top:1rem">
                  <label>
                    User
                    <select name="username" required ${t.directory.length===0?"disabled":""}>
                      <option value="">${t.directory.length?"Select user…":"No other users"}</option>
                      ${l}
                    </select>
                  </label>
                  <label>
                    Access
                    <select name="access" ${f?"disabled":""}>
                      <option value="read" selected>Read only</option>
                      ${f?"":'<option value="readwrite">Full access</option>'}
                    </select>
                    ${f?'<input type="hidden" name="access" value="read" />':""}
                  </label>
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" ${t.busy||t.directory.length===0?"disabled":""}>Share</button>
                  </div>
                </form>
                <div class="table-wrap" style="margin-top:1.25rem">
                  <table>
                    <thead>
                      <tr><th>Shared with</th><th>Access</th><th></th></tr>
                    </thead>
                    <tbody>${o}</tbody>
                  </table>
                </div>
              </section>
              <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${_("Import / export","import-export")}
                ${n.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||n.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||n.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",b=t.deleteConfirmId!==null?t.calendars.find(u=>u.id===t.deleteConfirmId&&u.canShare)??null:null,p=b?x({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(b.displayname)}</strong>
              <span class="muted small mono">(${d(b.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${wt({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${b.id}"`}]}):"",g=t.createCalModalOpen?x({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
            ${e.renderFlashBanner()}
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
                  ${t.holidayCountries.map(u=>`<option value="${d(u.code)}">${d(u.name)} (${d(u.code)})</option>`).join("")}
                </select>
              </label>
              <label class="checkbox">
                <input type="checkbox" name="readOnly" />
                Read-only (for everyone)
              </label>
              <div class="form-actions-row form-actions-wrap">
                <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Create calendar</button>
                <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${t.busy?"disabled":""} hidden />
                </label>
                <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${t.busy?"disabled":""}>Cancel</button>
              </div>
              <p class="muted small" style="margin:0.5rem 0 0">
                <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
              </p>
            </form>`}):"";return`
    <div class="portal-grid portal-grid-calendars">
      <aside class="calendars-sidebar">
        <section class="card calendars-sidebar-card">
          <div class="calendars-sidebar-head">
            ${_("Owned","owned")}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${i||'<p class="muted">No calendars yet. Create one below.</p>'}
            ${s.length?`<div class="calendars-shared-block">
                     ${_("Shared with me","shared-with-me")}
                     <div class="cal-list" style="margin-top:0.75rem">${r}</div>
                   </div>`:""}
          </div>
          <div class="calendars-sidebar-create">
            <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${t.busy?"disabled":""}>Create calendar</button>
          </div>
        </section>
      </aside>
      ${e.renderMonthGrid()}
    </div>
    ${g}
    ${m}
    ${p}
    ${e.renderEventModal()}`}function je(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const a=new FormData(t);e.state.editingContact.firstname=String(a.get("firstname")??""),e.state.editingContact.lastname=String(a.get("lastname")??""),e.state.editingContact.fullname=String(a.get("fullname")??""),e.state.editingContact.org=String(a.get("org")??""),e.state.editingContact.title=String(a.get("title")??""),e.state.editingContact.url=String(a.get("url")??""),e.state.editingContact.note=String(a.get("note")??"");const s=String(a.get("birthday")??"").trim();e.state.editingContact.birthday=s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null,e.state.editingContact.address={street:String(a.get("street")??""),city:String(a.get("city")??""),region:String(a.get("region")??""),postal:String(a.get("postal")??""),country:String(a.get("country")??"")};const n=[];let i=0;for(;a.has(`email_${i}`);)n.push(String(a.get(`email_${i}`)??"")),i++;n.length&&(e.state.editingContact.emails=n);const r=[];for(i=0;a.has(`phone_value_${i}`);)r.push({type:String(a.get(`phone_type_${i}`)??"other"),value:String(a.get(`phone_value_${i}`)??"")}),i++;r.length&&(e.state.editingContact.phones=r);const l=[];for(i=0;a.has(`custom_label_${i}`)||a.has(`custom_value_${i}`);)l.push({label:String(a.get(`custom_label_${i}`)??""),value:String(a.get(`custom_value_${i}`)??"")}),i++;e.state.editingContact.custom=l}function ki(e,t){const a=new FormData(t),s=[];let n=0;for(;a.has(`email_${n}`);){const o=String(a.get(`email_${n}`)??"").trim();o&&s.push(o),n++}const i=[];for(n=0;a.has(`phone_value_${n}`);){const o=String(a.get(`phone_value_${n}`)??"").trim();o&&i.push({type:String(a.get(`phone_type_${n}`)??"other"),value:o}),n++}const r=[];for(n=0;a.has(`custom_label_${n}`)||a.has(`custom_value_${n}`);){const o=String(a.get(`custom_label_${n}`)??"").trim(),c=String(a.get(`custom_value_${n}`)??"").trim();(o||c)&&r.push({label:o,value:c}),n++}const l={firstname:String(a.get("firstname")??"").trim(),lastname:String(a.get("lastname")??"").trim(),fullname:String(a.get("fullname")??"").trim(),org:String(a.get("org")??"").trim(),title:String(a.get("title")??"").trim(),emails:s,phones:i,address:{street:String(a.get("street")??"").trim(),city:String(a.get("city")??"").trim(),region:String(a.get("region")??"").trim(),postal:String(a.get("postal")??"").trim(),country:String(a.get("country")??"").trim()},url:String(a.get("url")??"").trim(),note:String(a.get("note")??"").trim(),birthday:(()=>{const o=String(a.get("birthday")??"").trim();return o&&/^\d{4}-\d{2}-\d{2}/.test(o)?o.slice(0,10):null})(),custom:r};return e.state.removePhotoPending?l.removePhoto=!0:e.state.photoBase64Pending&&(l.photoBase64=e.state.photoBase64Pending),l}function ie(e){const{state:t,root:a}=e,s=a.querySelector('[data-form="edit-event"]');s&&t.editingEvent&&e.syncEditingEventFromForm(s);const n=a.querySelector('[data-form="task"]');n&&t.editingTask&&e.syncEditingTaskFromForm(n);const i=a.querySelector('[data-form="note"]');i&&t.editingNote&&e.syncEditingNoteFromForm(i),t.editingContact&&je(e.contactsHost)}async function Si(e,t,a,s){var c,f,m,b;const{state:n,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="toggle-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p))return!0;s.stopPropagation(),e.toggleCalendarSelected(p),n.calendarSelectionSeeded=!0,n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(g){l("error",g instanceof Error?g.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="select-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p))return!0;n.selectedIds.includes(p)||(n.selectedIds=[...n.selectedIds,p]),n.selectedId=p,n.calendarSelectionSeeded=!0,Ke(n),n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(g){l("error",g instanceof Error?g.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="edit-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p)||!n.calendars.find(u=>u.id===p&&u.canShare))return!0;n.selectedId=p,n.selectedIds.includes(p)||(n.selectedIds=[...n.selectedIds,p]),Ke(n),n.calModalOpen=!0,n.deleteConfirmId=null,n.busy=!0,o(),r();try{await e.loadShares(p),await e.loadMonthEvents()}catch(u){l("error",u instanceof Error?u.message:"Failed to open calendar")}finally{n.busy=!1,r()}return!0}if(t==="close-cal-modal")return n.calModalOpen=!1,r(),!0;if(t==="open-create-cal-modal")return n.createCalModalOpen=!0,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0;if(t==="close-create-cal-modal")return n.createCalModalOpen=!1,o(),r(),!0;if(t==="delete-cal"){const p=Number(a.dataset.id);return!Number.isFinite(p)||!n.calendars.find(u=>u.id===p&&u.canShare)||(n.deleteConfirmId=p,n.calModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-cal")return n.deleteConfirmId=null,r(),!0;if(t==="confirm-delete-cal"){const p=Number(a.dataset.id),g=i.querySelector("#delete-cal-confirm");if(!Number.isFinite(p)||!(g!=null&&g.checked))return!0;n.busy=!0,o(),r();try{if(await k.deleteCalendar(p),n.selectedId===p&&(n.selectedId=null),n.selectedIds=n.selectedIds.filter(u=>u!==p),n.deleteConfirmId=null,n.calModalOpen=!1,n.shares=[],n.monthEvents=[],await e.loadHome(),n.selectedId===null){const u=e.pickDefaultCalendar();u?(n.selectedId=u.id,n.selectedIds.includes(u.id)||(n.selectedIds=[...n.selectedIds,u.id]),await e.loadMonthEvents()):n.selectedIds.length>0&&(n.selectedId=n.selectedIds[0],await e.loadMonthEvents())}l("success","Calendar deleted")}catch(u){l("error",u instanceof Error?u.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="cal-view"){const p=a.dataset.view;if(p!=="month"&&p!=="week"&&p!=="agenda")return!0;n.calView=p,Ke(n),n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="month-today"){const p=new Date;n.monthCursor={y:p.getFullYear(),m:p.getMonth()},n.calFocusDay=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`,n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="month-prev"||t==="month-next"){const p=t==="month-prev"?-1:1,g=n.calView;if(g==="week"){const u=gt(n.calFocusDay)??new Date;u.setDate(u.getDate()+p*7),n.calFocusDay=A(u),n.monthCursor={y:u.getFullYear(),m:u.getMonth()}}else if(g==="agenda"){const u=gt(n.calFocusDay)??new Date;u.setDate(u.getDate()+p*7),n.calFocusDay=A(u),n.monthCursor={y:u.getFullYear(),m:u.getMonth()}}else{const u=new Date(n.monthCursor.y,n.monthCursor.m+p,1);n.monthCursor={y:u.getFullYear(),m:u.getMonth()},n.calFocusDay=A(u)}n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="open-event"){s.stopPropagation();const p=Number(a.dataset.instance),g=a.dataset.uri??"";if(!Number.isFinite(p)||!g)return!0;n.busy=!0,o(),r();try{const u=await k.getEvent(p,g);n.editingEvent={...u.event,repeat:u.event.repeat??e.defaultRepeat()},n.creatingEvent=!1,n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null}catch(u){l("error",u instanceof Error?u.message:"Failed to open event")}finally{n.busy=!1,r()}return!0}if(t==="open-event-day"){s.stopPropagation();const p=a.dataset.day??"";return n.monthExpandDay=n.monthExpandDay===p?null:p,r(),!0}if(t==="new-event-day"){const p=s.target;if((c=p==null?void 0:p.closest)!=null&&c.call(p,".month-event, .month-event-more"))return!0;const g=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(g))return!0;if(n.selectedId===null)return l("error","Select a calendar first"),r(),!0;const u=n.calendars.find(v=>v.id===n.selectedId);return!u||u.readOnly||!(u.canShare||u.access==="readwrite")?(l("error","This calendar is read-only"),r(),!0):(n.creatingEvent=!0,n.editingEvent=e.blankEventForDay(g,n.selectedId),n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0)}if(t==="new-event-slot"){const p=s.target;if((f=p==null?void 0:p.closest)!=null&&f.call(p,".week-event"))return!0;const g=a.dataset.day??"",u=Number(a.dataset.hour);if(!/^\d{4}-\d{2}-\d{2}$/.test(g)||!Number.isInteger(u)||u<0||u>23)return!0;if(n.selectedId===null)return l("error","Select a calendar first"),r(),!0;const v=n.calendars.find($=>$.id===n.selectedId);return!v||v.readOnly||!(v.canShare||v.access==="readwrite")?(l("error","This calendar is read-only"),r(),!0):(n.creatingEvent=!0,n.editingEvent=e.blankEventForSlot(g,u,n.selectedId),n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0)}if(t==="close-event-modal")return n.eventModalOpen=!1,n.editingEvent=null,n.creatingEvent=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="dt-open"){const p=a.dataset.dtField||"";if(!p)return!0;if(ie(e),((m=n.eventDtPicker)==null?void 0:m.field)===p)n.eventDtPicker=null;else{const g=a.dataset.dtDateOnly==="1",u=a.dataset.dtClear!=="0",v=a.dataset.dtName||p;let $=e.getDtFieldCurrentValue(p);!$&&(p==="due"||p==="dtstart"||p==="bulk-due")&&($=He().start);const S=Ce($||A(new Date)),[C,y]=S.date.split("-").map(Number);n.eventDtPicker={field:p,viewY:C,viewM:(y||1)-1,dateOnly:g,allowClear:u,name:v}}return r(),!0}if(t==="dt-month-prev"||t==="dt-month-next"){if(!n.eventDtPicker)return!0;ie(e);const p=t==="dt-month-prev"?-1:1,g=new Date(n.eventDtPicker.viewY,n.eventDtPicker.viewM+p,1);return n.eventDtPicker={...n.eventDtPicker,viewY:g.getFullYear(),viewM:g.getMonth()},r(),!0}if(t==="dt-set-month"){if(!n.eventDtPicker)return!0;ie(e);const g=Number(a.value);return!Number.isFinite(g)||g<0||g>11||(n.eventDtPicker={...n.eventDtPicker,viewM:g},r()),!0}if(t==="dt-set-year"){if(!n.eventDtPicker)return!0;ie(e);const g=Number(a.value);return!Number.isFinite(g)||g<1||g>9999||(n.eventDtPicker={...n.eventDtPicker,viewY:g},r()),!0}if(t==="dt-pick-day"){if(!n.eventDtPicker)return!0;const p=n.eventDtPicker.field,g=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(g))return!0;ie(e);const u=n.eventDtPicker.dateOnly;if(u)e.setDtFieldValue(p,g),n.eventDtPicker=null;else{const v=e.getDtFieldCurrentValue(p),$=Ce(v||He(g).start).hm;e.setDtFieldValue(p,`${g}T${$}`),n.eventDtPicker={...n.eventDtPicker,viewY:Number(g.slice(0,4)),viewM:Number(g.slice(5,7))-1}}if(p==="start"&&n.editingEvent&&!u&&n.editingEvent.end){const v=new Date(String(n.editingEvent.start)),$=new Date(String(n.editingEvent.end));!Number.isNaN(v.getTime())&&!Number.isNaN($.getTime())&&$<=v&&e.setDtFieldValue("end",Z(new Date(v.getTime()+3600*1e3)))}return r(),!0}if(t==="dt-pick-time"){if(!n.eventDtPicker||n.eventDtPicker.dateOnly)return!0;const p=n.eventDtPicker.field,g=a.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(g))return!0;ie(e);const u=e.getDtFieldCurrentValue(p)||He().start,$=`${Ce(u).date}T${g}`;if(e.setDtFieldValue(p,$),p==="start"&&n.editingEvent){n.editingEvent={...n.editingEvent,allDay:!1};const S=n.editingEvent.end?Ce(String(n.editingEvent.end)):null,C=new Date($);(!S||new Date(`${S.date}T${S.hm}`)<=C)&&e.setDtFieldValue("end",Z(new Date(C.getTime()+3600*1e3)))}return n.eventDtPicker=null,r(),!0}if(t==="dt-today"){if(!n.eventDtPicker)return!0;const p=n.eventDtPicker.field;ie(e);const g=A(new Date);if(n.eventDtPicker.dateOnly)e.setDtFieldValue(p,g);else{const u=He(g);p==="start"?(e.setDtFieldValue("start",u.start),n.editingEvent&&!n.editingEvent.end&&e.setDtFieldValue("end",u.end)):p==="end"?e.setDtFieldValue("end",u.end):e.setDtFieldValue(p,u.start)}return n.eventDtPicker=null,r(),!0}if(t==="dt-clear"){if(!n.eventDtPicker||!n.eventDtPicker.allowClear)return!0;const p=n.eventDtPicker.field;return ie(e),e.setDtFieldValue(p,null),n.eventDtPicker=null,r(),!0}if(t==="event-allday-toggle"){if(!n.editingEvent)return!0;const p=i.querySelector('[data-form="edit-event"]'),g=a.checked;if(p){const u=new FormData(p),v=String(u.get("start")??n.editingEvent.start??""),$=String(u.get("end")??n.editingEvent.end??"")||null;let S=v,C=$;if(g){const y=Yr(v,$);S=y.start,C=y.end}else{const y=v.slice(0,10),T=($||v).slice(0,10),I=ca(y,T);S=I.start,C=I.end}n.editingEvent={...n.editingEvent,summary:String(u.get("summary")??n.editingEvent.summary),description:String(u.get("description")??n.editingEvent.description),location:String(u.get("location")??n.editingEvent.location),instanceId:Number(u.get("instanceId"))||n.editingEvent.instanceId,allDay:g,start:S,end:C,repeat:Ge(u)}}else n.editingEvent={...n.editingEvent,allDay:g};return n.eventDtPicker=null,r(),!0}if(t==="event-repeat-freq"||t==="event-repeat-end"){if(!n.editingEvent)return!0;const p=i.querySelector('[data-form="edit-event"]');if(!p)return!0;const g=new FormData(p),u=p.querySelector('input[name="allDay"]'),v=Ge(g);return n.editingEvent={...n.editingEvent,summary:String(g.get("summary")??n.editingEvent.summary),description:String(g.get("description")??n.editingEvent.description),location:String(g.get("location")??n.editingEvent.location),instanceId:Number(g.get("instanceId"))||n.editingEvent.instanceId,allDay:(u==null?void 0:u.checked)??n.editingEvent.allDay,start:String(g.get("start")??n.editingEvent.start??""),end:String(g.get("end")??n.editingEvent.end??"")||null,repeat:v,hasRrule:!!String(g.get("repeatFreq")??"").trim()},v.freq&&v.endMode==="until"&&((b=n.eventDtPicker)==null?void 0:b.field)==="end"&&(n.eventDtPicker=null),r(),!0}if(t==="delete-event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return!0;const p=String(n.editingEvent.summary||"this event").trim()||"this event";return n.confirmDelete={scope:"event",title:"Delete event",message:`Delete “${p}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="revoke"){const p=a.dataset.href??"";return!p||n.selectedId===null||(n.confirmDelete={scope:"revoke-share",title:"Revoke share",message:"Revoke access for this user?",detail:"They will lose this calendar until you share it again.",href:p},r()),!0}if(t==="export-cal"){s.stopPropagation();const p=a.dataset.id,g=p!==void 0&&p!==""?Number(p):n.selectedId;if(g===null||Number.isNaN(g))return!0;n.busy=!0,o(),r();try{const{blob:u,filename:v}=await k.exportCalendar(g),$=await e.saveBlobAsFile(u,v);$==="cancelled"?l("info","Export cancelled"):$==="saved"?l("success",`Saved ${v}`):l("success",`Download started: ${v}`)}catch(u){l("error",u instanceof Error?u.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}async function Et(e){const t=await k.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars,e.state.selectedNoteKey!==null&&!e.state.notes.some(a=>`${a.instanceId}|${a.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function H(e,t){return`${e}|${t}`}const Di=new Set(["P","BR","STRONG","B","EM","I","U","UL","OL","LI","H2","H3","A","BLOCKQUOTE","DIV","SPAN"]);function Ci(e){return/<[a-z][\s\S]*>/i.test(e)}function Ei(e){return e.replace(/<\/(p|div|h2|h3|li|blockquote)>/gi,`
`).replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/\s+\n/g,`
`).replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).trim()}function ke(e){if(!e)return"";if(!Ci(e))return e;if(typeof DOMParser>"u")return e.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/on\w+\s*=/gi,"");const a=new DOMParser().parseFromString(`<div id="n">${e}</div>`,"text/html").getElementById("n");if(!a)return"";const s=n=>{var r;const i=[...n.childNodes];for(const l of i)if(l.nodeType===1){const o=l,c=o.tagName;if(!Di.has(c)){const f=o.parentNode;if(f){for(;o.firstChild;)f.insertBefore(o.firstChild,o);f.removeChild(o)}continue}for(const f of[...o.attributes]){const m=f.name.toLowerCase();if(m.startsWith("on")||m==="style")o.removeAttribute(f.name);else if(c==="A"&&m==="href"){const b=f.value.trim();/^(https?:|mailto:|#)/i.test(b)||o.removeAttribute("href")}else c==="A"&&(m==="href"||m==="target"||m==="rel")||o.removeAttribute(f.name)}c==="A"&&(o.setAttribute("rel","noopener noreferrer"),o.setAttribute("target","_blank")),s(o)}else l.nodeType!==3&&((r=l.parentNode)==null||r.removeChild(l))};return s(a),a.innerHTML}function Ti(e,t){const a=ke(e);return`<div class="note-editor">
      ${t?"":`<div class="note-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h2" title="Heading">H</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="createLink" title="Link">Link</button>
      </div>`}
      <div class="note-editor-body" data-note-editor="1" ${t?'contenteditable="false"':'contenteditable="true" role="textbox" aria-label="Note body" aria-multiline="true"'}
        >${a}</div>
      <textarea name="description" hidden>${d(e)}</textarea>
    </div>`}function Pi(e){const t=e.root.querySelector("[data-note-editor]"),a=e.root.querySelector('textarea[name="description"]');if(!t||!a)return;const s=()=>{a.value=ke(t.innerHTML)};t.addEventListener("input",s),t.addEventListener("blur",s);const n=e.root.querySelector(".note-editor-toolbar");n==null||n.addEventListener("mousedown",i=>{var r,l;(l=(r=i.target)==null?void 0:r.closest)!=null&&l.call(r,"[data-action='note-fmt']")&&i.preventDefault()})}function Fi(e,t){const a=document.querySelector("[data-note-editor]");if(!a||a.getAttribute("contenteditable")!=="true")return;if(a.focus(),e==="createLink"){const n=window.prompt("Link URL","https://");if(!n)return;document.execCommand("createLink",!1,n)}else e==="formatBlock"?document.execCommand("formatBlock",!1,t||"h2"):document.execCommand(e,!1,t);const s=document.querySelector('textarea[name="description"]');s&&(s.value=ke(a.innerHTML))}function Ai(e){const t=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(i=>{const r=H(i.instanceId,i.uri),l=!e.state.creatingNote&&r===e.state.selectedNoteKey?" is-selected":"",o=Ei(i.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${l}" data-action="select-note" data-instance="${i.instanceId}" data-uri="${d(i.uri)}" tabindex="0" role="button">
              <td class="col-note-title">
                <span class="contact-name-primary">${d(i.summary||i.uri)}</span>
                ${o?`<span class="muted small contact-name-secondary">${d(o)}${i.description.length>80?"…":""}</span>`:""}
                ${i.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${d(un(i.dtstart))}</td>
              <td class="col-note-cal muted small">${d(i.calendarName)}</td>
            </tr>`}).join(""),a=e.state.editingNote,s=e.state.noteCalendars.map(i=>`<option value="${i.id}" ${a&&a.instanceId===i.id?"selected":""}>${d(i.displayname)}</option>`).join(""),n=a?`<div class="card">
          ${_(e.state.creatingNote?"New note":"Edit note","notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${e.state.creatingNote?`<label>Calendar
                    <select name="instanceId" required ${e.state.noteCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.noteCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${s}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${d(a.calendarName)}</strong>${a.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${d(a.summary)}" ${a.readOnly&&!e.state.creatingNote?"readonly":""} />
            </label>
            ${e.renderPortalDateTimeField({field:"dtstart",name:"dtstart",label:"Date",value:Fe(a.dtstart),dateOnly:!1,disabled:!!(a.readOnly&&!e.state.creatingNote),allowClear:!0})}
            <label>Body
              ${Ti(a.description,!!(a.readOnly&&!e.state.creatingNote))}
            </label>
            <div class="form-actions-row">
              ${e.state.creatingNote||a.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingNote?"Create note":"Save note"}</button>`:""}
              ${!e.state.creatingNote&&a.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingNote?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${_("Notes","notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${d(e.state.noteSearch)}" aria-label="Search notes" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-note" ${e.state.busy||e.state.noteCalendars.length===0?"disabled":""}>Add note</button>
      </div>
      ${e.state.noteCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              ${K("Title","summary",e.state.noteSort,e.state.noteOrder,"note","col-note-title")}
              ${K("Date","dtstart",e.state.noteSort,e.state.noteOrder,"note","col-note-date")}
              ${K("Calendar","calendar",e.state.noteSort,e.state.noteOrder,"note","col-note-cal")}
            </tr>
          </thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${n}
    </section>
  </div>`}function Ii(e,t){if(!e.state.editingNote)return;const a=t.querySelector("[data-note-editor]"),s=t.querySelector('textarea[name="description"]');a&&s&&(s.value=ke(a.innerHTML));const n=new FormData(t),i=String(n.get("dtstart")??"").trim(),r=n.get("instanceId"),l=r!==null&&String(r)!==""?Number(r):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(l)&&l>0?l:e.state.editingNote.instanceId,summary:String(n.get("summary")??e.state.editingNote.summary),description:ke(String(n.get("description")??e.state.editingNote.description)),dtstart:i?new Date(i).toISOString():null}}async function Ui(e,t){const a=t.querySelector("[data-note-editor]"),s=t.querySelector('textarea[name="description"]');a&&s&&(s.value=ke(a.innerHTML));const n=new FormData(t),i=String(n.get("summary")??"").trim(),r=ke(String(n.get("description")??"").trim()),l=String(n.get("dtstart")??"").trim(),o=l?new Date(l).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const c=Number(n.get("instanceId"));if(!Number.isFinite(c)||c<=0)throw new Error("Select a calendar");const f=await k.createNote({instanceId:c,summary:i,description:r,dtstart:o});e.state.creatingNote=!1,e.state.selectedNoteKey=H(f.note.instanceId,f.note.uri),e.state.editingNote=f.note,e.setFlash("success",me("Note",f.note.summary||i,"created"))}else if(e.state.editingNote){const c=await k.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:i,description:r,dtstart:o});e.state.editingNote=c.note,e.state.selectedNoteKey=H(c.note.instanceId,c.note.uri),e.setFlash("success",me("Note",c.note.summary||i,"saved"))}await Et(e)}catch(c){e.setFlash("error",c instanceof Error?c.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Mi(e,t,a,s){var o;const{state:n,render:i,setFlash:r,clearFlash:l}=e;if(t==="note-fmt")return s.preventDefault(),Fi(a.dataset.cmd||"",a.dataset.value),!0;if(t==="sort-note"){const c=a.dataset.sort||"";if(!c)return!0;n.noteSort===c?n.noteOrder=n.noteOrder==="asc"?"desc":"asc":(n.noteSort=c,n.noteOrder="asc"),n.busy=!0,i();try{await e.loadNotes()}catch(f){r("error",f instanceof Error?f.message:"Sort failed")}finally{n.busy=!1,i()}return!0}if(t==="select-note"){const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=n.notes.find(b=>b.instanceId===c&&b.uri===f)??null;return n.creatingNote=!1,n.selectedNoteKey=e.itemKey(c,f),n.editingNote=m?{...m}:null,l(),i(),!0}if(t==="new-note")return n.creatingNote=!0,n.selectedNoteKey=null,n.editingNote={uri:"",instanceId:((o=n.noteCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="cancel-note")return n.creatingNote=!1,n.editingNote=null,n.selectedNoteKey=null,i(),!0;if(t==="delete-note"){if(!n.editingNote||n.creatingNote)return!0;const c=String(n.editingNote.summary||"this note").trim()||"this note";return n.confirmDelete={scope:"note",title:"Delete note",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function Ae(e){const t=await k.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const a=new Set(e.state.tasks.map(s=>H(s.instanceId,s.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(s=>a.has(s)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(s=>`${s.instanceId}|${s.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function Oi(e,t){const a=new Map;for(const f of t)f.uid&&a.set(f.uid,f);const s=new Map(t.map((f,m)=>[H(f.instanceId,f.uri),m])),n=new Map,i=[];for(const f of t){const m=f.parentUid;if(m&&a.has(m)&&m!==f.uid){const b=n.get(m)??[];b.push(f),n.set(m,b)}else i.push(f)}const r=(f,m)=>(s.get(H(f.instanceId,f.uri))??0)-(s.get(H(m.instanceId,m.uri))??0);i.sort(r);for(const[,f]of n)f.sort(r);const l=[],o=new Set,c=(f,m)=>{const b=f.uid||H(f.instanceId,f.uri);if(!o.has(b)){o.add(b),l.push({task:f,depth:Math.min(m,8)});for(const p of n.get(f.uid)??[])c(p,m+1);o.delete(b)}};for(const f of i)c(f,0);for(const f of t)l.some(m=>m.task===f)||l.push({task:f,depth:0});return l}function xi(e,t){const a=new Set([t]);if(!t)return a;let s=!0;for(;s;){s=!1;for(const n of e.state.tasks)n.parentUid&&a.has(n.parentUid)&&n.uid&&!a.has(n.uid)&&(a.add(n.uid),s=!0)}return a}function Ni(e,t,a){const s=t.instanceId,n=a||!t.uid?new Set:xi(e,t.uid),i=e.state.tasks.filter(o=>o.uid&&o.instanceId===s&&!n.has(o.uid)&&o.uid!==t.uid),r=t.parentUid||"",l=['<option value="">None (top-level)</option>',...i.map(o=>`<option value="${d(o.uid)}" ${o.uid===r?"selected":""}>${d(o.summary||o.uid)}</option>`)];if(r&&!i.some(o=>o.uid===r)){const o=e.state.tasks.find(c=>c.uid===r);l.push(`<option value="${d(r)}" selected>${d((o==null?void 0:o.summary)||r)} (current)</option>`)}return l.join("")}function Mn(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(a=>t.has(H(a.instanceId,a.uri))&&a.canWrite&&!a.readOnly)}function Li(e){const t=u=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[u]||u,a=Oi(e,e.state.tasks),s=e.state.tasks.filter(u=>u.canWrite&&!u.readOnly).map(u=>H(u.instanceId,u.uri)),n=s.length>0&&s.every(u=>e.state.checkedTaskKeys.includes(u)),i=e.state.checkedTaskKeys.length>0,l=Mn(e).length,o=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:a.map(({task:u,depth:v})=>{const $=H(u.instanceId,u.uri),S=!e.state.creatingTask&&$===e.state.selectedTaskKey?" is-selected":"",C=e.state.checkedTaskKeys.includes($),y=u.status==="COMPLETED"?"badge-ok":u.status==="CANCELLED"?"":"badge-admin",T=v>0?` style="--task-depth:${v}"`:"",I=v>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",q=u.canWrite&&!u.readOnly;return`<tr class="contact-table-row task-row${v>0?" is-subtask":""}${S}${C?" is-checked":""}" data-action="select-task" data-instance="${u.instanceId}" data-uri="${d(u.uri)}" tabindex="0" role="button"${T}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${u.instanceId}" data-uri="${d(u.uri)}"
                  ${C?"checked":""} ${q?"":"disabled"} aria-label="Select ${d(u.summary||u.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${I}<span class="contact-name-primary">${d(u.summary||u.uri)}</span></span>
                ${u.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${y}">${d(t(u.status))}</span></td>
              <td class="col-task-due muted small">${d(un(u.due))}</td>
              <td class="col-task-cal muted small">${d(u.calendarName)}</td>
              <td class="col-task-pct muted small">${u.percent?d(String(u.percent))+"%":"—"}</td>
            </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,f=(u,v)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${u}"
      title="${d(v)}" aria-label="${d(v)}" ${e.state.busy||l===0?"disabled":""}>${c}</button>`,m=i?`<div class="bulk-bar" style="margin-top:0.75rem">
          <div class="bulk-bar-row">
            <div class="bulk-bar-count">
              <strong>${l}</strong><span class="bulk-bar-count-label">selected</span>${e.state.checkedTaskKeys.length!==l?`<span class="muted small bulk-bar-count-extra">(${e.state.checkedTaskKeys.length-l} read-only skipped)</span>`:""}
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Status
                <select id="bulk-task-status" ${e.state.busy||l===0?"disabled":""}>
                  <option value="">—</option>
                  <option value="NEEDS-ACTION">To do</option>
                  <option value="IN-PROCESS">In progress</option>
                  <option value="COMPLETED">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              ${f("bulk-task-status","Apply status")}
            </div>
            <div class="bulk-group bulk-group-due">
              ${e.renderPortalDateTimeField({field:"bulk-due",name:"bulkDue",label:"Due",value:e.state.bulkDueValue,dateOnly:!1,disabled:e.state.busy||l===0,allowClear:!0})}
              ${f("bulk-task-due","Apply due")}
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${e.state.busy||l===0?"disabled":""} title="Clear due date">Clear due</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field bulk-field-pct">%
                <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${e.state.busy||l===0?"disabled":""} />
              </label>
              ${f("bulk-task-percent","Apply %")}
            </div>
          </div>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${e.state.busy||l===0?"disabled":""}>Delete</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${e.state.busy?"disabled":""}>Clear selection</button>
          </div>
        </div>`:"",b=e.state.editingTask,p=e.state.taskCalendars.map(u=>`<option value="${u.id}" ${b&&b.instanceId===u.id?"selected":""}>${d(u.displayname)}</option>`).join(""),g=b?`<div class="card">
          ${_(e.state.creatingTask?b.parentUid?"New subtask":"New task":"Edit task","tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${e.state.creatingTask?`<label>Calendar
                    <select name="instanceId" required ${e.state.taskCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.taskCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${p}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${d(b.calendarName)}</strong>${b.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${d(b.summary)}" ${b.readOnly&&!e.state.creatingTask?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${b.readOnly&&!e.state.creatingTask?"readonly":""}>${d(b.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${b.readOnly&&!e.state.creatingTask?"disabled":""}>
                ${Ni(e,b,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${b.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(u=>`<option value="${u}" ${b.status===u?"selected":""}>${d(t(u))}</option>`).join("")}
                </select>
              </label>
              ${e.renderPortalDateTimeField({field:"due",name:"due",label:"Due",value:Fe(b.due),dateOnly:!1,disabled:!!(b.readOnly&&!e.state.creatingTask),allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${d(String(b.priority||0))}" ${b.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${d(String(b.percent||0))}" ${b.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
            </div>
            <div class="form-actions-row">
              ${e.state.creatingTask||b.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingTask?"Create task":"Save task"}</button>`:""}
              ${!e.state.creatingTask&&b.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${e.state.busy?"disabled":""}>Add subtask</button>
                     <button type="button" class="btn btn-danger" data-action="delete-task" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingTask?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${_("Tasks","tasks")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="task-search" placeholder="Search tasks…" value="${d(e.state.taskSearch)}" aria-label="Search tasks" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-task" ${e.state.busy||e.state.taskCalendars.length===0?"disabled":""}>Add task</button>
      </div>
      ${m}
      ${e.state.taskCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-task-check">
                <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                  ${n?"checked":""} ${s.length===0||e.state.busy?"disabled":""} />
              </th>
              ${K("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${K("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${K("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${K("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${K("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${g}
    </section>
  </div>`}function _i(e,t){if(!e.state.editingTask)return;const a=new FormData(t),s=String(a.get("due")??"").trim(),n=a.get("instanceId"),i=n!==null&&String(n)!==""?Number(n):e.state.editingTask.instanceId,r=String(a.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(i)&&i>0?i:e.state.editingTask.instanceId,summary:String(a.get("summary")??e.state.editingTask.summary),description:String(a.get("description")??e.state.editingTask.description),status:String(a.get("status")??e.state.editingTask.status),due:s?new Date(s).toISOString():null,priority:Number(a.get("priority")??e.state.editingTask.priority??0),percent:Number(a.get("percent")??e.state.editingTask.percent??0),parentUid:r===""?null:r}}async function qi(e,t){var i,r;const a=Mn(e);if(a.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const s=a.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(t==="bulk-task-delete"){e.state.busy=!0,e.clearFlash(),e.render();try{const l=await k.bulkTasks({op:"delete",items:s});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&a.some(o=>H(o.instanceId,o.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await Ae(e),l.failed>0?e.setFlash("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let n={};if(t==="bulk-task-status"){const l=e.root.querySelector("#bulk-task-status"),o=((i=l==null?void 0:l.value)==null?void 0:i.trim())??"";if(!o){e.setFlash("error","Choose a status to apply"),e.render();return}n={status:o}}else if(t==="bulk-task-due"){const l=e.state.bulkDueValue.trim();if(!l){e.setFlash("error","Choose a due date to apply"),e.render();return}const o=/^\d{4}-\d{2}-\d{2}$/.test(l)?new Date(l+"T00:00:00"):new Date((l.length===16,l));if(Number.isNaN(o.getTime())){e.setFlash("error","Invalid due date"),e.render();return}n={due:o.toISOString()}}else if(t==="bulk-task-clear-due")n={due:null};else if(t==="bulk-task-percent"){const l=e.root.querySelector("#bulk-task-percent"),o=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(o===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const c=Number(o);if(!Number.isFinite(c)||c<0||c>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}n={percent:Math.round(c)}}e.state.busy=!0,e.clearFlash(),e.render();try{const l=await k.bulkTasks({op:"update",items:s,fields:n});if(await Ae(e),e.state.editingTask&&!e.state.creatingTask){const c=H(e.state.editingTask.instanceId,e.state.editingTask.uri),f=e.state.tasks.find(m=>H(m.instanceId,m.uri)===c);f&&(e.state.editingTask={...f})}const o=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";l.failed>0?e.setFlash("error",`Updated ${o} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Updated ${o} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function Ri(e,t){const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),i=String(a.get("status")??"NEEDS-ACTION"),r=String(a.get("due")??"").trim(),l=r?new Date(r).toISOString():null,o=Number(a.get("priority")??0),c=Number(a.get("percent")??0),f=String(a.get("parentUid")??"").trim(),m=f===""?null:f;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const b=Number(a.get("instanceId"));if(!Number.isFinite(b)||b<=0)throw new Error("Select a calendar");const p=await k.createTask({instanceId:b,summary:s,description:n,status:i,due:l,priority:o,percent:c,parentUid:m});e.state.creatingTask=!1,e.state.selectedTaskKey=H(p.task.instanceId,p.task.uri),e.state.editingTask=p.task,e.setFlash("success",me(m?"Subtask":"Task",p.task.summary||s,"created"))}else if(e.state.editingTask){const b=await k.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:s,description:n,status:i,due:l,priority:o,percent:c,parentUid:m});e.state.editingTask=b.task,e.state.selectedTaskKey=H(b.task.instanceId,b.task.uri),e.setFlash("success",me("Task",b.task.summary||s,"saved"))}await Ae(e)}catch(b){e.setFlash("error",b instanceof Error?b.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Bi(e,t,a,s){var o;const{state:n,render:i,setFlash:r,clearFlash:l}=e;if(t==="sort-task"){const c=a.dataset.sort||"";if(!c)return!0;n.taskSort===c?n.taskOrder=n.taskOrder==="asc"?"desc":"asc":(n.taskSort=c,n.taskOrder=c==="due"||c==="summary"?"asc":"desc"),n.busy=!0,i();try{await e.loadTasks()}catch(f){r("error",f instanceof Error?f.message:"Sort failed")}finally{n.busy=!1,i()}return!0}if(t==="select-task"){if(s.target.closest("[data-stop-row], .task-check"))return!0;const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=n.tasks.find(b=>b.instanceId===c&&b.uri===f)??null;return n.creatingTask=!1,n.selectedTaskKey=e.itemKey(c,f),n.editingTask=m?{...m}:null,l(),i(),!0}if(t==="task-check"){s.preventDefault(),s.stopPropagation();const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=e.itemKey(c,f),b=n.tasks.find(p=>e.itemKey(p.instanceId,p.uri)===m);return!b||!b.canWrite||b.readOnly||(n.checkedTaskKeys.includes(m)?n.checkedTaskKeys=n.checkedTaskKeys.filter(p=>p!==m):n.checkedTaskKeys=[...n.checkedTaskKeys,m],i()),!0}if(t==="task-select-all"){s.preventDefault();const c=n.tasks.filter(m=>m.canWrite&&!m.readOnly);return c.length>0&&c.every(m=>n.checkedTaskKeys.includes(e.itemKey(m.instanceId,m.uri)))?n.checkedTaskKeys=[]:n.checkedTaskKeys=c.map(m=>e.itemKey(m.instanceId,m.uri)),i(),!0}if(t==="bulk-task-clear")return n.checkedTaskKeys=[],i(),!0;if(t==="bulk-task-status"||t==="bulk-task-due"||t==="bulk-task-clear-due"||t==="bulk-task-percent"||t==="bulk-task-delete"){if(t==="bulk-task-delete"){const c=n.checkedTaskKeys.length;return c===0?(r("error","No tasks selected"),i(),!0):(n.confirmDelete={scope:"bulk-task",title:c===1?"Delete task":`Delete ${c} tasks`,message:c===1?"Delete the selected task?":`Delete ${c} selected tasks?`,detail:"CalDAV clients will sync the removal. This cannot be undone.",count:c},i(),!0)}return e.runBulkTaskAction(t),!0}if(t==="new-task")return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:((o=n.taskCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="new-subtask"){if(!n.editingTask||n.creatingTask||!n.editingTask.uid||!n.editingTask.canWrite)return!0;const c=n.editingTask;return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:c.instanceId,calendarId:c.calendarId,calendarName:c.calendarName,calendarUri:c.calendarUri,uid:"",parentUid:c.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0}if(t==="cancel-task")return n.creatingTask=!1,n.editingTask=null,n.selectedTaskKey=null,i(),!0;if(t==="delete-task"){if(!n.editingTask||n.creatingTask)return!0;const c=String(n.editingTask.summary||"this task").trim()||"this task";return n.confirmDelete={scope:"task",title:"Delete task",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function ya(e,t){const a=await k.contacts(t,e.state.contactSearch);e.state.contacts=a.contacts,e.state.selectedContactUri!==null&&!e.state.contacts.some(s=>s.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function Hi(e,t){if(e.state.selectedAbId===null)return;const a=await k.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const s=a.contact;e.state.editingContact={...s,emails:Array.isArray(s.emails)?s.emails:[],phones:Array.isArray(s.phones)?s.phones:[],custom:Array.isArray(s.custom)?s.custom:[],address:s.address??On(),birthday:s.birthday??null},e.state.photoPreview=s.photoDataUri??(s.hasPhoto&&e.state.selectedAbId!==null?`${k.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function Vi(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function On(e){return{street:"",city:"",region:"",postal:"",country:""}}function ji(e,t){return new Promise((a,s)=>{const n=new FileReader;n.onload=()=>{const i=String(n.result??""),r=i.indexOf(",");a(r>=0?i.slice(r+1):i)},n.onerror=()=>s(new Error("Failed to read photo file")),n.readAsDataURL(t)})}async function zi(e,t){var s;const a=(s=t.files)==null?void 0:s[0];if(t.value="",!!a){if(a.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const n=await ji(e,a);e.state.photoBase64Pending=n,e.state.photoPreview=`data:${a.type||"image/jpeg"};base64,${n}`,e.state.removePhotoPending=!1,e.render()}catch(n){e.setFlash("error",n instanceof Error?n.message:"Failed to read photo"),e.render()}}}async function Ki(e,t){var n;if(e.state.selectedAbId===null)return;const a=(n=t.files)==null?void 0:n[0];if(t.value="",!a)return;const s=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:a.name,fileSizeLabel:mt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const i=await e.readFileTextWithProgress(a,o=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:o};const c=e.root.querySelector(".import-progress-bar"),f=e.root.querySelector("[data-import-status-line]");c&&o!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${o}%`),f&&o!==null&&(f.textContent=`Reading file… ${o}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),w.event("import.contacts.start",{file:a.name,bytes:a.size,abId:s});const r=await k.importAddressBook(s,i,o=>{e.applyServerImportProgress(o)}),l=e.formatImportResult(r);await e.loadHome(),e.state.selectedAbId===s&&await ya(e,s),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${l} (from “${a.name}”)`}),e.setFlash("success",`Import finished for “${a.name}”: ${l}.`)}catch(i){const r=i instanceof Error?i.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{e.state.busy=!1,e.render()}}async function Wi(e,t){if(e.state.selectedAbId===null)return;const a=ki(e,t),s=At(a);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const n=await k.createContact(e.state.selectedAbId,a);e.state.creatingContact=!1,e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",me("Contact",At(n.contact)||s,"created"))}else if(e.state.selectedContactUri){const n=await k.updateContact(e.state.selectedAbId,e.state.selectedContactUri,a);e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",me("Contact",At(n.contact)||s,"saved"))}try{await e.loadHome()}catch(n){if(console.error(n),e.state.selectedAbId!==null)try{await ya(e,e.state.selectedAbId)}catch{}}}catch(n){e.setFlash("error",n instanceof Error?n.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Yi(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();if(s){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await k.createAddressBook({displayname:s,description:n});e.state.selectedAbId=i.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${i.addressbook.displayname}” created`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function Ji(e,t){if(e.state.selectedAbId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await k.updateAddressBook(e.state.selectedAbId,{displayname:s,description:n}),await e.loadHome(),e.setFlash("success",me("Address book",s,"updated"))}catch(i){e.setFlash("error",i instanceof Error?i.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function Gi(e){const{state:t}=e,a=t.addressBooks.map($=>`<div class="cal-row${$.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${d($.displayname)}</span>
          <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
          <span class="muted small mono cal-row-uri">${d($.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${$.id}" ${t.busy?"disabled":""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`).join(""),s=t.addressBooks.find($=>$.id===t.selectedAbId)??null,n=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map($=>{const S=!t.creatingContact&&$.uri===t.selectedContactUri?" is-selected":"",C=d(($.displayname||"?").slice(0,1).toUpperCase()),y=$.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${d(k.contactPhotoUrl(t.selectedAbId,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${C}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${C}</span>`;return`<tr class="contact-table-row${S}" data-action="select-contact" data-uri="${d($.uri)}" tabindex="0" role="button">
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${y}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${d($.displayname)}</span>
                    ${$.org?`<span class="muted small contact-name-secondary">${d($.org)}</span>`:""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${d($.email||"—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${d($.phone||"—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${d($.org||"—")}</span></td>
            </tr>`}).join(""),i=t.editingContact,r=Array.isArray(i==null?void 0:i.emails)&&i.emails.length>0?i.emails:[""],l=Array.isArray(i==null?void 0:i.phones)&&i.phones.length>0?i.phones:[{type:"cell",value:""}],o=(i==null?void 0:i.address)??e.emptyAddress(),c=r.map(($,S)=>`<div class="multi-row" data-multi="email" data-idx="${S}">
        <input type="email" name="email_${S}" value="${d($??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${S}" ${r.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),f=l.map(($,S)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${S}">
        <select name="phone_type_${S}" aria-label="Phone type">
          ${["cell","work","home","other"].map(C=>`<option value="${C}" ${(($==null?void 0:$.type)??"other")===C?"selected":""}>${C}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${S}" value="${d(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${S}" ${l.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),m=Array.isArray(i==null?void 0:i.custom)?i.custom:[],b=m.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':m.map(($,S)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${S}">
              <input type="text" name="custom_label_${S}" value="${d($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${S}" value="${d($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${S}" title="Remove">×</button>
            </div>`).join(""),p=t.contactModalOpen&&i&&s?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
          <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
          <div class="cal-modal-card cal-modal-card-wide">
            <header class="cal-modal-header">
              <h3 id="contact-modal-title">${t.creatingContact?"New contact":"Edit contact"}</h3>
              <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${e.renderFlashBanner()}
              <form class="stack" data-form="contact">
                <div class="contact-photo-row">
                  <div class="contact-photo-preview">
                    ${t.photoPreview?`<img src="${d(t.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${d((i.fullname||i.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      ${t.photoPreview?"Change photo":"Upload photo"}
                      <input type="file" accept="image/*" data-action="contact-photo" ${t.busy?"disabled":""} hidden />
                    </label>
                    ${t.photoPreview||i.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${t.busy?"disabled":""}>Remove photo</button>`:""}
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${d(i.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${d(i.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${d(i.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${d(i.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${d(i.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${c}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${r.length>=10?"disabled":""}>+ Email</button>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend>Phones</legend>
                    ${f}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${l.length>=10?"disabled":""}>+ Phone</button>
                  </fieldset>
                </div>
                <fieldset class="fieldset fieldset-address">
                  <legend>Address</legend>
                  <label>Street
                    <input type="text" name="street" value="${d(o.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${d(o.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${d(o.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${d(o.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${d(o.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${d(i.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${e.renderPortalDateTimeField({field:"birthday",name:"birthday",label:"Birthday",value:i.birthday||"",dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${b}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${m.length>=30?"disabled":""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${d(i.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>${t.creatingContact?"Create contact":"Save contact"}</button>
                  ${!t.creatingContact&&i.uri?`<button type="button" class="btn" data-action="export-contact" ${t.busy?"disabled":""}>Export .vcf</button>`:""}
                  ${t.creatingContact?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${t.busy?"disabled":""}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${t.busy?"disabled":""}>Cancel</button>
                  ${!t.creatingContact&&i.uri?`<span class="muted small mono">${d(i.uri)}</span>`:""}
                </div>
              </form>
            </div>
          </div>
        </div>`:"",g=t.abModalOpen&&s?x({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${d(s.uri)} · ${s.cardCount} contact${s.cardCount===1?"":"s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${d(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${d(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${d(s.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${_("Import / export","contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${t.busy?"disabled":""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${t.busy?"disabled":""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",u=t.deleteAbConfirmId!==null?t.addressBooks.find($=>$.id===t.deleteAbConfirmId)??null:null,v=u?x({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(u.displayname)}</strong>
              <span class="muted small mono">(${d(u.uri)})</span>.</p>
            <p class="muted small">${(u.cardCount??0)>0?`All ${u.cardCount} contact${u.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${wt({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${u.id}"`}]}):"";return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${_("Address books","address-books")}
          </div>
          <div class="cal-list contacts-ab-list">
            ${a||'<p class="muted">No address books yet. Create one below.</p>'}
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
              <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Create</button>
            </form>
          </div>
        </section>
      </aside>
      <section class="contacts-main-col">
        ${s?`<div class="card contacts-main-card">
                <div class="contacts-main-head">
                  ${_("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${d(t.contactSearch)}" aria-label="Search contacts" ${t.busy?"disabled":""} />
                    <button type="button" class="btn btn-primary" data-action="new-contact" ${t.busy?"disabled":""}>Add contact</button>
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
                      ${n}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
      </section>
    </div>
    ${v}
    ${g}
    ${p}`}async function Xi(e,t,a,s){var c,f;const{state:n,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="select-ab"){const m=Number(a.dataset.id);if(!Number.isFinite(m))return!0;n.selectedAbId=m,n.abModalOpen=!1,n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.contactSearch="",n.contacts=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,o(),n.busy=!0,r();try{await e.loadContacts(m)}catch(b){l("error",b instanceof Error?b.message:"Failed to load contacts")}finally{n.busy=!1,r()}return!0}if(t==="edit-ab"){s.stopPropagation();const m=Number(a.dataset.id);if(!Number.isFinite(m)||!n.addressBooks.find(g=>g.id===m))return!0;const p=n.selectedAbId!==m;n.selectedAbId=m,n.abModalOpen=!0,n.contactModalOpen=!1,o(),p&&(n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactSearch="",n.contacts=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1),n.busy=!0,r();try{p&&await e.loadContacts(m)}catch(g){l("error",g instanceof Error?g.message:"Failed to open address book")}finally{n.busy=!1,r()}return!0}if(t==="close-ab-modal")return n.abModalOpen=!1,r(),!0;if(t==="select-contact"){const m=a.dataset.uri??"";if(!m)return!0;o();try{await e.openContact(m)}catch(b){l("error",b instanceof Error?b.message:"Failed to load contact")}return r(),!0}if(t==="new-contact")return n.selectedAbId===null||(e.startNewContact(),o(),r()),!0;if(t==="cancel-contact"||t==="close-contact-modal")return n.creatingContact=!1,n.contactModalOpen=!1,n.editingContact=null,n.selectedContactUri=null,n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="add-email"||t==="add-phone"||t==="add-custom")return n.editingContact&&(je(e.contactsHost),Array.isArray(n.editingContact.emails)||(n.editingContact.emails=[""]),Array.isArray(n.editingContact.phones)||(n.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(n.editingContact.custom)||(n.editingContact.custom=[]),t==="add-email"?n.editingContact.emails.length<10&&n.editingContact.emails.push(""):t==="add-phone"?n.editingContact.phones.length<10&&n.editingContact.phones.push({type:"other",value:""}):n.editingContact.custom.length<30&&n.editingContact.custom.push({label:"",value:""}),r()),!0;if(t==="remove-email"){if(!n.editingContact)return!0;je(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const b=Array.isArray(n.editingContact.emails)?n.editingContact.emails:[""];return n.editingContact.emails=b.filter((p,g)=>g!==m),n.editingContact.emails.length===0&&(n.editingContact.emails=[""]),r(),!0}if(t==="remove-phone"){if(!n.editingContact)return!0;je(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const b=Array.isArray(n.editingContact.phones)?n.editingContact.phones:[{type:"cell",value:""}];return n.editingContact.phones=b.filter((p,g)=>g!==m),n.editingContact.phones.length===0&&(n.editingContact.phones=[{type:"cell",value:""}]),r(),!0}if(t==="remove-custom"){if(!n.editingContact)return!0;je(e.contactsHost);const m=Number(a.dataset.idx);return Number.isFinite(m)&&(n.editingContact.custom=(Array.isArray(n.editingContact.custom)?n.editingContact.custom:[]).filter((b,p)=>p!==m),r()),!0}if(t==="remove-photo")return n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!0,n.editingContact&&(n.editingContact.hasPhoto=!1),r(),!0;if(t==="delete-contact"){if(n.selectedAbId===null||!n.selectedContactUri)return!0;const m=String(((c=n.editingContact)==null?void 0:c.fullname)||((f=n.editingContact)==null?void 0:f.displayname)||"this contact").trim()||"this contact";return n.confirmDelete={scope:"contact",title:"Delete contact",message:`Delete “${m}”?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="delete-ab"){s.stopPropagation();const m=Number(a.dataset.id??n.selectedAbId);return!Number.isFinite(m)||!n.addressBooks.find(p=>p.id===m)||(n.deleteAbConfirmId=m,n.abModalOpen=!1,n.contactModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-ab")return n.deleteAbConfirmId=null,r(),!0;if(t==="confirm-delete-ab"){const m=Number(a.dataset.id),b=i.querySelector("#delete-ab-confirm");if(!Number.isFinite(m)||!(b!=null&&b.checked))return!0;const p=n.addressBooks.find(u=>u.id===m);if(!p)return!0;const g=(p.cardCount??0)>0;n.busy=!0,o(),r();try{await k.deleteAddressBook(m,g),n.selectedAbId===m&&(n.selectedAbId=null,n.contacts=[],n.editingContact=null,n.selectedContactUri=null,n.creatingContact=!1),n.deleteAbConfirmId=null,n.abModalOpen=!1,n.contactModalOpen=!1,await e.loadHome(),n.selectedAbId===null&&n.addressBooks.length>0&&(n.selectedAbId=n.addressBooks[0].id,await e.loadContacts(n.selectedAbId)),l("success","Address book deleted")}catch(u){l("error",u instanceof Error?u.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="export-ab"){s.stopPropagation();const m=a.dataset.id,b=m!==void 0&&m!==""?Number(m):n.selectedAbId;if(b===null||Number.isNaN(b))return!0;n.busy=!0,o(),r();try{const{blob:p,filename:g}=await k.exportAddressBook(b),u=await e.saveBlobAsFile(p,g);u==="cancelled"?l("info","Export cancelled"):u==="saved"?l("success",`Saved ${g}`):l("success",`Download started: ${g}`)}catch(p){l("error",p instanceof Error?p.message:"Export failed")}finally{n.busy=!1,r()}return!0}if(t==="export-contact"){if(n.selectedAbId===null||!n.selectedContactUri||n.creatingContact)return!0;n.contactModalOpen=!0,n.busy=!0,o(),r();try{const{blob:m,filename:b}=await k.exportContact(n.selectedAbId,n.selectedContactUri),p=await e.saveBlobAsFile(m,b);p==="cancelled"?l("info","Export cancelled"):p==="saved"?l("success",`Saved ${b}`):l("success",`Download started: ${b}`)}catch(m){l("error",m instanceof Error?m.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}function va(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function xn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function $a(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),a=t[1]??"overview",s=xn(a)??"overview";let n=null;if(s==="users"&&t[2])try{n=decodeURIComponent(t[2])}catch{n=t[2]}return{tab:"admin",adminPage:s,adminUsername:n}}return{tab:va(e),adminPage:null,adminUsername:null}}function Qi(){const e=$a().tab;if(e)return e;try{const t=va(sessionStorage.getItem(en));if(t)return t}catch{}return"calendars"}function Zi(){const e=$a().adminPage;if(e)return e;try{const t=xn(sessionStorage.getItem(tn));if(t)return t}catch{}return"overview"}function el(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function Mt(e,t="overview",a=null){try{sessionStorage.setItem(en,e),e==="admin"&&sessionStorage.setItem(tn,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const s=e==="admin"?el(t,a):`#${e}`;location.hash!==s&&history.replaceState(null,"",`${location.pathname}${location.search}${s}`)}function _a(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(e)}</span>`}function Ot(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function tl(e){const t=e.confirmDelete;if(!t)return"";const a=t.detail?`<p class="muted small" style="margin:0.75rem 0 0">${d(t.detail)}</p>`:"";return x({id:"portal-confirm-delete-modal",title:t.title,titleId:"portal-confirm-delete-title",closeAction:"confirm-delete-cancel",size:"sm",body:`<p style="margin:0">${d(t.message)}</p>${a}`,footer:[{label:"Cancel",action:"confirm-delete-cancel",variant:"ghost",disabled:e.busy},{label:"Delete",action:"confirm-delete-ok",variant:"danger",disabled:e.busy}]})}function qa(e){e.confirmDelete=null}const Ra="portal-page",Ba="portal-overlays";function al(e){let t=e.querySelector(`#${Ra}`),a=e.querySelector(`#${Ba}`);return(!t||!a)&&(e.replaceChildren(),t=document.createElement("div"),t.id=Ra,a=document.createElement("div"),a.id=Ba,e.append(t,a)),{page:t,overlays:a}}function nl(e){const t=e.filesPreview,a=t?[t.path,t.status,t.kind,t.objectUrl??"",t.truncated?"1":"0",String((t.text??"").length),t.error??""].join("|"):"",s=e.filesUploadProgress,n=s?[s.phase,s.completedFiles,s.failedFiles,s.bytesSent,s.currentName].join("|"):"",i=e.importProgress,r=i?[i.phase,i.readPercent??"",i.processPercent??"",i.processCurrent,i.ok??""].join("|"):"",l=e.confirmDelete?e.confirmDelete.scope:"";return`p:${a};u:${n};i:${r};c:${l}`}function sl(e){return`${cr()}
      ${tl(e.state)}
      ${pi(e.calendarsHost)}
      ${sr(e.filesHost)}
      ${tr(e.filesHost)}`}function rl(e,t,a){e.dataset.overlayKey===a&&e.childElementCount>0||(e.dataset.overlayKey=a,e.innerHTML=t)}function xe(e,t,a){if(!ee(e,t))return"";const s=e.activeTab===t;return`<button type="button" role="tab" class="tab-btn${s?" is-active":""}"
            data-action="tab" data-tab="${t}" aria-selected="${s}">
            ${a}
          </button>`}function il(e){const{state:t,root:a}=e;if(!t.user){e.renderLogin();return}let s;switch(t.activeTab){case"calendars":s=ee(t,"calendars")?La(e):Ne("Calendar","CalDAV");break;case"contacts":s=ee(t,"contacts")?Gi(e):Ne("Contacts","CardDAV");break;case"tasks":s=ee(t,"tasks")?Li(e.tasksHost):Ne("Tasks","Tasks (VTODO)");break;case"notes":s=ee(t,"notes")?Ai(e.notesHost):Ne("Notes","Notes (VJOURNAL)");break;case"files":s=ee(t,"files")?gr(e.filesHost):Ne("Files","WebDAV file storage");break;case"admin":s=Hr(e.adminHost);break;default:s=La(e)}const n=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",i=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage==="overview"?"admin-overview":t.adminPage==="users"?"admin-users":t.adminPage==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          ${xe(t,"calendars","Calendar")}
          ${xe(t,"contacts","Contacts")}
          ${xe(t,"tasks","Tasks")}
          ${xe(t,"notes","Notes")}
          ${xe(t,"files","Files")}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${n}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`,{page:r,overlays:l}=al(a);r.innerHTML=e.shell(s,{tabs:i}),rl(l,sl(e),nl(t)),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesPreview!==null||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}function Ne(e,t){return`<div class="panel empty-panel">
    <h2>${e}</h2>
    <p class="muted">${e} is disabled in system settings (Enable ${t}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`}function ll(e){const{state:t,render:a}=e;e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),ut(t),t.eventDtPicker&&hs(t,a),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),vn(e.filesHost),Pi(e.notesHost),e.bindHolidaysToggle(),cl(e),dl(e.root),ol(e)}function ol(e){const{state:t,root:a}=e,s=t.filesSearchFocus&&t.activeTab==="files"?'input[data-action="files-search"]':t.eventSearchFocus&&t.activeTab==="calendars"?'input[data-action="event-search"]':null;if(!s)return;const n=a.querySelector(s);if(!n)return;n.focus({preventScroll:!0});const i=n.value.length;try{n.setSelectionRange(i,i)}catch{}t.filesSearchFocus=!1,t.eventSearchFocus=!1}function dl(e){const t=e.querySelector(".cal-modal[data-focus-trap]");if(!t)return;const a=document.activeElement;if(a&&t.contains(a))return;const s=e.querySelector("#portal-page");if(a&&(s!=null&&s.contains(a)))return;const n=t.querySelector("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");n==null||n.focus()}function cl(e){var i;const{state:t,root:a}=e;if(!t.listKeyboardFocus||t.activeTab!=="contacts"&&t.activeTab!=="tasks"&&t.activeTab!=="notes")return;const s=document.activeElement;if(s&&a.contains(s)&&s.matches("input:not([type=checkbox]), textarea, select, [contenteditable='true']")&&!s.closest("tr.contact-table-row[data-action]")||(i=s==null?void 0:s.closest)!=null&&i.call(s,"tr.contact-table-row[data-action]"))return;let n=null;if(t.activeTab==="contacts"&&t.selectedContactUri)n=a.querySelector(`tr[data-action="select-contact"][data-uri="${CSS.escape(t.selectedContactUri)}"]`);else if(t.activeTab==="tasks"&&t.selectedTaskKey){const r=t.selectedTaskKey.indexOf("|");if(r>0){const l=t.selectedTaskKey.slice(0,r),o=t.selectedTaskKey.slice(r+1);n=a.querySelector(`tr[data-action="select-task"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}else if(t.activeTab==="notes"&&t.selectedNoteKey){const r=t.selectedNoteKey.indexOf("|");if(r>0){const l=t.selectedNoteKey.slice(0,r),o=t.selectedNoteKey.slice(r+1);n=a.querySelector(`tr[data-action="select-note"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}if(!n){const r=t.activeTab==="contacts"?"select-contact":t.activeTab==="tasks"?"select-task":"select-note";n=a.querySelector(`tr.contact-table-row[data-action="${r}"]`)}n&&n.focus({preventScroll:!0})}async function ul(e,t,a,s){var o;const{state:n,render:i,clearFlash:r,setFlash:l}=e;if(t==="confirm-delete-cancel")return qa(n),i(),!0;if(t==="confirm-delete-ok"){const c=n.confirmDelete;if(!c)return i(),!0;const f=c.scope;if(qa(n),f==="event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return i(),!0;const m=n.editingEvent.instanceId,b=n.editingEvent.uri;n.busy=!0,r(),i();try{await k.deleteEvent(m,b),n.eventModalOpen=!1,n.editingEvent=null,await e.loadMonthEvents(),l("success","Event deleted")}catch(p){l("error",p instanceof Error?p.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(f==="task"){if(!n.editingTask||n.creatingTask)return i(),!0;n.busy=!0,r(),i();try{await k.deleteTask(n.editingTask.instanceId,n.editingTask.uri),n.selectedTaskKey=null,n.editingTask=null,await e.loadTasks(),l("success","Task deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(f==="note"){if(!n.editingNote||n.creatingNote)return i(),!0;n.busy=!0,r(),i();try{await k.deleteNote(n.editingNote.instanceId,n.editingNote.uri),n.selectedNoteKey=null,n.editingNote=null,await e.loadNotes(),l("success","Note deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(f==="contact"){if(n.selectedAbId===null||!n.selectedContactUri)return i(),!0;n.busy=!0,r(),n.contactModalOpen=!0,i();try{await k.deleteContact(n.selectedAbId,n.selectedContactUri),n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.eventDtPicker=null,n.photoPreview=null,await e.loadHome(),l("success","Contact deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(f==="bulk-task")return await e.runBulkTaskAction("bulk-task-delete"),!0;if(f==="revoke-share"){const m=c.href??"";if(!m||n.selectedId===null)return i(),!0;n.calModalOpen=!0,n.busy=!0,r(),i();try{await k.revoke(n.selectedId,m),await e.loadShares(n.selectedId),l("success","Share revoked")}catch(b){l("error",b instanceof Error?b.message:"Revoke failed")}finally{n.busy=!1,i()}return!0}return i(),!0}if(t==="close-import-progress")return n.importProgress&&(n.importProgress.phase==="done"||n.importProgress.phase==="error")&&e.closeImportProgress(),!0;if(t==="logout"){n.busy=!0,w.event("logout");try{await k.logout()}catch{}return e.clearPortalSessionState(),r(),i(),!0}if(t==="info"){const c=a.dataset.info??"";return e.openInfoModal(c),!0}if(t==="info-close")return e.closeInfoModal(),!0;if(t==="about-open")return s.preventDefault(),vs(e.root),!0;if(t==="about-close")return s.preventDefault(),sn(e.root),!0;if(t==="flash-close")return r(),i(),!0;if(t==="set-theme"){const c=ot(a.dataset.theme);return c&&(Hn(c,((o=n.user)==null?void 0:o.username)??null),Ga(c),i()),!0}if(t==="user-menu-toggle")return s.stopPropagation(),n.userMenuOpen=!n.userMenuOpen,i(),!0;if(t==="user-menu-close")return n.userMenuOpen&&(n.userMenuOpen=!1,i()),!0;if(t==="tab"){const c=va(a.dataset.tab);return c&&(c==="admin"&&(n.adminPage="overview"),await e.activateTab(c)),!0}return!1}async function Kt(e,t){const a=t.target.closest("[data-action]");if(!a)return;const s=a.dataset.action;s&&(w.debug(`action:${s}`,{id:a.dataset.id,tab:a.dataset.tab,uri:a.dataset.uri}),!await ul(e,s,a,t)&&(s.startsWith("admin-")&&await jr(e.adminHost,s,a)||(s.startsWith("files-")||s==="sort-file"||s==="close-files-upload-progress")&&await $r(e.filesHost,s,a,t)||await Si(e,s,a,t)||await Bi(e,s,a,t)||await Mi(e,s,a,t)||await Xi(e,s,a,t)))}const Ha=new WeakMap;function ml(e){if(Ha.has(e.root)){w.debug("portalEvents: already bound for root");return}Ha.set(e.root,!0),e.state.portalEventsBound=!0,e.state.escapeBound=!0;const{root:t}=e;t.addEventListener("click",a=>fl(e,a)),t.addEventListener("contextmenu",a=>pl(e,a)),t.addEventListener("submit",a=>bl(e,a)),t.addEventListener("change",a=>gl(e,a)),t.addEventListener("input",a=>yl(e,a)),t.addEventListener("keydown",a=>$l(e,a)),document.addEventListener("keydown",a=>Dl(e,a)),t.addEventListener("dragenter",a=>tt(e,"enter",a)),t.addEventListener("dragover",a=>tt(e,"over",a)),t.addEventListener("dragleave",a=>tt(e,"leave",a)),t.addEventListener("drop",a=>tt(e,"drop",a)),t.addEventListener("error",a=>hl(e,a),!0),w.event("portalEvents.registered")}function fl(e,t){var n,i;const a=(i=(n=t.target)==null?void 0:n.closest)==null?void 0:i.call(n,"[data-action]");if(!a||!e.root.contains(a))return;const s=a.dataset.action??"";(s==="info"||s==="info-close"||s==="about-open"||s==="about-close")&&(t.preventDefault(),t.stopPropagation()),(s==="dt-set-month"||s==="dt-set-year")&&t.stopPropagation(),(s==="select-contact"||s==="select-task"||s==="select-note")&&(e.state.listKeyboardFocus=!0),w.debug("portalEvents.click",{action:s}),Kt(e,t)}function pl(e,t){const a=t.target;if(!a||!e.root.contains(a))return;if(a.closest("#files-item-menu")){t.preventDefault();return}const s=a.closest("tr.files-row");if(!s||!e.root.contains(s))return;const n=s.dataset.path??"";!n||Zt(e.state)||(t.preventDefault(),ea(e.filesHost,n,{x:t.clientX,y:t.clientY,origin:"context"}))}function bl(e,t){var n,i;const a=(i=(n=t.target)==null?void 0:n.closest)==null?void 0:i.call(n,"form[data-form]");if(!a||!e.root.contains(a))return;const s=a.dataset.form??"";if(s)switch(t.preventDefault(),w.debug("portalEvents.submit",{form:s}),s){case"login":e.onLogin(a);return;case"share":e.onShare(a);return;case"edit-event":e.onSaveEvent(a);return;case"edit-cal":e.onEditCal(a);return;case"create-cal":e.onCreateCal(a);return;case"contact":e.onSaveContact(a);return;case"create-ab":e.onCreateAb(a);return;case"edit-ab":e.onEditAb(a);return;case"task":e.onSaveTask(a);return;case"note":e.onSaveNote(a);return;case"files-rename":yr(e.filesHost,a);return;case"files-transfer":Ps(e.filesHost,a);return;case"files-mkdir":vr(e.filesHost,a);return;case"admin-user-create":Fr(e.adminHost,a);return;case"admin-user-edit":Ar(e.adminHost,a);return;case"admin-cal":Ir(e.adminHost,a);return;case"admin-ab":Ur(e.adminHost,a);return;case"admin-settings":Lr(e.adminHost,a);return;case"admin-database":_r(e.adminHost,a);return;default:w.debug("portalEvents.submit.unknown",{form:s})}}function gl(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:i}=e,r=a.closest("[data-action]"),l=(r==null?void 0:r.dataset.action)??"";if(l==="dt-set-month"||l==="dt-set-year"){t.stopPropagation(),w.debug("portalEvents.change",{action:l}),Kt(e,t);return}if(l==="admin-db-backend"&&a instanceof HTMLSelectElement){s.adminDbFormBackend=a.value==="pgsql"?"pgsql":"sqlite",i();return}if(l==="files-upload-pick-files"&&a instanceof HTMLInputElement){Ua(e.filesHost,a,!1);return}if(l==="files-upload-pick-folder"&&a instanceof HTMLInputElement){Ua(e.filesHost,a,!0);return}if(l==="files-type-filter"){w.debug("portalEvents.change",{action:l}),Kt(e,t);return}if(l==="import-cal"&&a instanceof HTMLInputElement){bi(e.calendarsHost,a);return}if(l==="import-create-cal"&&a instanceof HTMLInputElement){gi(e.calendarsHost,a);return}if(l==="import-ab"&&a instanceof HTMLInputElement){e.calendarsHost.onImportContacts(a);return}if(l==="contact-photo"&&a instanceof HTMLInputElement){zi(e.contactsHost,a);return}if(a instanceof HTMLInputElement&&a.id==="delete-cal-confirm"){const o=n.querySelector("#delete-cal-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLInputElement&&a.id==="delete-ab-confirm"){const o=n.querySelector("#delete-ab-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLSelectElement&&(a.name==="repeatFreq"||a.name==="repeatEndMode")){const o=a.closest('[data-form="edit-event"]');if(o&&s.editingEvent){const c=new FormData(o);s.editingEvent={...s.editingEvent,repeat:Ge(c),hasRrule:!!String(c.get("repeatFreq")??"").trim()},i()}return}if(a instanceof HTMLSelectElement&&a.name==="instanceId"){const o=a.closest('[data-form="task"]');if(o&&s.creatingTask&&s.editingTask){const f=Number(a.value);if(!Number.isFinite(f)||f<=0)return;e.syncEditingTaskFromForm(o);const m=s.editingTask.parentUid;s.editingTask={...s.editingTask,instanceId:f,parentUid:m&&s.tasks.some(b=>b.uid===m&&b.instanceId===f)?m:null},i();return}const c=a.closest('[data-form="note"]');if(c&&s.creatingNote&&s.editingNote){const f=Number(a.value);if(!Number.isFinite(f)||f<=0)return;e.syncEditingNoteFromForm(c),s.editingNote={...s.editingNote,instanceId:f},i();return}}if(a instanceof HTMLInputElement&&a.name==="holidays"&&a.closest('[data-form="create-cal"]')){Un(e.calendarsHost);return}if(a instanceof HTMLInputElement&&a.name==="color"){const o=a.closest("form"),c=o==null?void 0:o.querySelector('input[name="color_picker"]');if(c){let f=a.value.trim();f&&!f.startsWith("#")&&(f=`#${f}`),/^#[0-9A-Fa-f]{6}/.test(f)&&(c.value=f.slice(0,7),a.value=f.toUpperCase())}return}}function yl(e,t){var o;const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:i,setFlash:r}=e;if(a instanceof HTMLInputElement&&a.name==="color_picker"){const c=a.closest("form"),f=c==null?void 0:c.querySelector('input[name="color"]');f&&(f.value=a.value.toUpperCase());return}const l=((o=a.closest("[data-action]"))==null?void 0:o.dataset.action)??"";if(l==="contact-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.contactSearch=c,(async()=>{try{s.selectedAbId!==null&&await e.loadContacts(s.selectedAbId),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="task-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.taskSearch=c,(async()=>{try{await e.loadTasks(),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="files-search"&&a instanceof HTMLInputElement){s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.filesSearch=c,s.filesSearchFocus=!0,i()},150);return}if(l==="event-search"&&a instanceof HTMLInputElement){s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.eventSearch=c,s.eventSearchFocus=!0,i()},150);return}if(l==="note-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.noteSearch=c,(async()=>{try{await e.loadNotes(),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="admin-db-confirm-input"&&a instanceof HTMLInputElement){s.adminDbConfirmText=a.value;const c=n.querySelector('[data-action="admin-db-confirm-save"]');c&&(c.disabled=s.busy||s.adminDbConfirmText.trim()!=="CONFIRM");return}if(l==="admin-reset-password"&&a instanceof HTMLInputElement){s.adminResetPassword=a.value;const c=n.querySelector('[data-action="admin-reset-confirm"]');c&&(c.disabled=s.busy||!s.adminResetConfirmChecked||s.adminResetPassword.trim()==="");return}}const Va='tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]',ja="tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]";function vl(e){const{state:t,root:a}=e;let s="";if(t.activeTab==="contacts")s="select-contact";else if(t.activeTab==="tasks")s="select-task";else if(t.activeTab==="notes")s="select-note";else return[];return Array.from(a.querySelectorAll(`tr.contact-table-row[data-action="${s}"]`))}function Le(e){e.focus({preventScroll:!1}),e.scrollIntoView({block:"nearest"})}function $l(e,t){const a=t.target;if(!a||!e.root.contains(a))return;if((t.key==="ContextMenu"||t.key==="F10"&&t.shiftKey)&&e.state.activeTab==="files"){const l=a.closest("tr.files-row");if(l&&e.root.contains(l)){const o=l.dataset.path??"";if(o){t.preventDefault();const f=(l.querySelector(".files-row-menu-btn")??l).getBoundingClientRect();ea(e.filesHost,o,{x:f.right,y:f.bottom+4,origin:"button"});return}}}const s=e.state.activeTab,n=s==="contacts"||s==="tasks"||s==="notes",i=a instanceof HTMLInputElement&&(a.dataset.action==="contact-search"||a.dataset.action==="task-search"||a.dataset.action==="note-search");if(!i&&a.closest("button, a, input, select, textarea, [contenteditable=true]")&&!a.matches(ja)&&!a.matches(Va))return;if(n&&(t.key==="ArrowDown"||t.key==="ArrowUp"||t.key==="Home"||t.key==="End")){const l=vl(e);if(l.length===0)return;const o=a.closest(Va);if(e.state.listKeyboardFocus=!0,t.preventDefault(),!o||i){t.key==="ArrowDown"||t.key==="Home"?Le(l[0]):Le(l[l.length-1]);return}const c=l.indexOf(o);if(c<0)return;if(t.key==="Home"){Le(l[0]);return}if(t.key==="End"){Le(l[l.length-1]);return}const f=t.key==="ArrowDown"?l[c+1]:l[c-1];f&&Le(f);return}if(t.key!=="Enter"&&t.key!==" ")return;const r=a.closest(ja);!r||!e.root.contains(r)||t.target!==r&&t.target.closest("button, a, input, select, textarea")||(t.preventDefault(),(r.dataset.action==="select-contact"||r.dataset.action==="select-task"||r.dataset.action==="select-note")&&(e.state.listKeyboardFocus=!0),w.debug("portalEvents.keydown.row",{action:r.dataset.action,key:t.key}),r.click())}function tt(e,t,a){var o,c,f;const{state:s,root:n}=e;if(s.activeTab!=="files"||s.busy||s.filesUploadProgress||!Ns(a.dataTransfer))return;const i=(c=(o=a.target)==null?void 0:o.closest)==null?void 0:c.call(o,"[data-files-drop-target]");if(!i||!n.contains(i)){if(t==="leave"&&s.filesDropDepth>0){const m=a.relatedTarget;m&&m instanceof Node&&((f=n.querySelector("[data-files-drop-target]"))==null?void 0:f.contains(m))||(s.filesDropDepth=0,wl(e))}return}if(t==="enter"){a.preventDefault(),a.stopPropagation(),s.filesDropDepth+=1,at(e,i,!0);return}if(t==="over"){a.preventDefault(),a.stopPropagation(),a.dataTransfer&&(a.dataTransfer.dropEffect="copy"),at(e,i,!0);return}if(t==="leave"){a.preventDefault(),a.stopPropagation();const m=a.relatedTarget;if(m&&i.contains(m))return;s.filesDropDepth=Math.max(0,s.filesDropDepth-1),s.filesDropDepth===0&&at(e,i,!1);return}a.preventDefault(),a.stopPropagation(),s.filesDropDepth=0,at(e,i,!1);const r=a.dataTransfer;if(!r||s.busy||s.filesUploadProgress)return;s.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),M(e.filesHost);const l=Os(r);w.event("files.drop.snapshot",{handles:l.handlePromises.length,entries:l.entries.filter(Boolean).length,files:l.files.length}),(async()=>{try{const m=await xs(l);if(w.event("files.drop.items",{count:m.length,sample:m.slice(0,8).map(b=>b.relativePath)}),m.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await ra(e.filesHost,m)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Drop failed"),e.render()}})()}function at(e,t,a){if(e.state.filesUploadDropActive===a){t.classList.toggle("is-dragover",a);return}e.state.filesUploadDropActive=a,t.classList.toggle("is-dragover",a)}function wl(e){e.state.filesUploadDropActive=!1,e.root.querySelectorAll("[data-files-drop-target].is-dragover").forEach(t=>{t.classList.remove("is-dragover")})}function hl(e,t){const a=t.target;if(!(a instanceof HTMLImageElement)||!a.classList.contains("contact-avatar")||!a.dataset.avatarFallback||!a.isConnected)return;const s=a.dataset.avatarFallback||"?",n=document.createElement("span");n.className="contact-avatar contact-avatar-fallback",n.setAttribute("aria-hidden","true"),n.textContent=s,a.replaceWith(n)}const kl='a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';function Sl(e,t){if(t.key!=="Tab")return;const a=e.querySelector(".cal-modal[data-focus-trap]");if(!a)return;const s=[...a.querySelectorAll(kl)].filter(l=>l.offsetParent!==null||l===document.activeElement);if(s.length===0)return;const n=s[0],i=s[s.length-1],r=document.activeElement;!t.shiftKey&&r===i?(t.preventDefault(),n.focus()):t.shiftKey&&(r===n||!a.contains(r))&&(t.preventDefault(),i.focus())}function Dl(e,t){if(Sl(e.root,t),t.key!=="Escape")return;const{state:a,render:s}=e;if(a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")){e.closeImportProgress();return}if(a.importProgress)return;if(a.filesUploadProgress&&(a.filesUploadProgress.phase==="done"||a.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(a.filesUploadProgress)return;if(a.filesUploadMenuOpen){a.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),s();return}if(a.filesItemMenu){M(e.filesHost),s();return}if(a.userMenuOpen){a.userMenuOpen=!1,e.unbindUserMenuOutside(),s();return}if(a.filesUploadConflict!==null){lt(e.filesHost,"cancel");return}if(a.filesPreview!==null){j(e.filesHost),s();return}if(a.filesRenamePath!==null||a.filesDeletePaths!==null||a.filesTransfer!==null||a.filesMkdirOpen){a.filesRenamePath=null,a.filesDeletePaths=null,e.resetFilesTransferTree(),a.filesMkdirOpen=!1,s();return}if(a.confirmDelete){a.confirmDelete=null,s();return}if($s(e.root)){sn(e.root);return}const n=e.root.querySelector("#info-modal");if(n&&!n.hidden){e.closeInfoModal();return}if(a.eventDtPicker){a.eventDtPicker=null,ut(a),s();return}if(a.eventModalOpen){a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,s();return}if(a.contactModalOpen){a.contactModalOpen=!1,a.editingContact=null,a.creatingContact=!1,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,s();return}if(a.abModalOpen){a.abModalOpen=!1,s();return}if(a.calModalOpen||a.createCalModalOpen||a.deleteConfirmId!==null||a.deleteAbConfirmId!==null){a.calModalOpen=!1,a.createCalModalOpen=!1,a.deleteConfirmId=null,a.deleteAbConfirmId=null,s();return}if(a.adminUserCreateOpen||a.adminUserEditOpen||a.adminUserDeleteUsername!==null){a.adminUserCreateOpen=!1,a.adminUserEditOpen=!1,a.adminUserDeleteUsername=null,s();return}if(a.adminResetModalOpen){a.adminResetModalOpen=!1,s();return}if(a.adminDbConfirmOpen){a.adminDbConfirmOpen=!1,a.adminDbConfirmText="",a.adminDbPendingBody=null,s();return}(a.adminCalModal!==null||a.adminAbModal!==null||a.adminResourceDelete!==null)&&(a.adminCalModal=null,a.adminAbModal=null,a.adminResourceDelete=null,s())}function xt(e){const{state:t}=e;if(t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())){t.activeTab=ct(t),t.adminPage="overview",e.persistTab(t.activeTab);return}t.activeTab!=="admin"&&!ee(t,t.activeTab)&&(t.activeTab=ct(t),e.persistTab(t.activeTab))}async function Cl(e,t,a={}){return hn(e.adminHost,t,a)}async function za(e,t,a={}){const{state:s,render:n,setFlash:i,clearFlash:r}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&s.adminCapabilities&&!s.adminCapabilities.uiEnabled&&i("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t=ct(s)),t!=="admin"&&!ee(s,t)&&(i("info","That section is disabled in system settings."),t=ct(s)),t!=="files"&&M(e.filesHost),t==="admin"){await e.activateAdminPage(s.adminPage||"overview",{...a,username:s.adminPage==="users"?s.adminSelectedUsername:null});return}s.activeTab=t,s.userMenuOpen=!1,s.listKeyboardFocus=!1,e.persistTab(t),w.event("tab",{tab:t}),t!=="calendars"&&(s.calModalOpen=!1,s.deleteConfirmId=null),t!=="contacts"&&(s.deleteAbConfirmId=null),a.clearFlash!==!1&&r(),s.busy=!0,n();try{t==="contacts"&&s.selectedAbId!==null?await e.loadContacts(s.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await Ae(e.tasksHost):t==="notes"?await Et(e.notesHost):t==="files"&&await ae(e.filesHost)}catch(l){w.warn("tab load failed",l instanceof Error?l.message:l),i("error",l instanceof Error?l.message:"Failed to load")}finally{s.busy=!1,n()}}async function _e(e){var i;const{state:t}=e;w.debug("loadHome");const[a,s,n]=await Promise.all([k.calendars(),k.directory().catch(()=>({users:[]})),k.addressbooks()]);if(t.calendars=a.calendars,t.directory=s.users,t.addressBooks=n.addressbooks,w.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await k.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(l=>l.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),!t.calendarSelectionSeeded&&t.selectedIds.length===0){const r=ei((i=t.user)==null?void 0:i.username);if(r){r.view&&(t.calView=r.view);const l=r.ids.filter(o=>t.calendars.some(c=>c.id===o));t.selectedIds=l,r.selectedId!==null&&t.calendars.some(o=>o.id===r.selectedId)?t.selectedId=r.selectedId:t.selectedId=l[0]??null,t.calendarSelectionSeeded=!0,w.debug("loadHome.calSelection.restored",{count:l.length,selectedId:t.selectedId,view:t.calView})}else{const l=e.pickDefaultCalendar();l?(t.selectedIds=[l.id],t.selectedId=l.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id),t.calendarSelectionSeeded=!0}}else t.selectedIds.length===0?t.selectedId=null:t.calendarSelectionSeeded=!0;t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),Ke(t),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await Ae(e.tasksHost),t.activeTab==="notes"&&await Et(e.notesHost),t.activeTab==="files"&&await ae(e.filesHost)}function El(e){const{state:t}=e;return oa(t.portalUi.timeFormat)}function Tl(e){const{state:t}=e;return da(t.portalUi.weekStart)}function Pl(e){const{state:t}=e;return kn(t.portalUi.weekStart)}function Nn(e,t,a){const{state:s}=e;return Kr(t,a,s.portalUi.timeFormat)}function Fl(e,t,a,s,n){var c,f;const{state:i}=e,r=Ce(a),l=((c=i.eventDtPicker)==null?void 0:c.viewY)??Number(r.date.slice(0,4)),o=((f=i.eventDtPicker)==null?void 0:f.viewM)??Number(r.date.slice(5,7))-1;return Jr({field:t,value:a,dateOnly:s,allowClear:n,viewY:l,viewM:o,weekStart:i.portalUi.weekStart,timeFormat:i.portalUi.timeFormat})}function Nt(e){Gr(e.root)}function qe(e,t){var p;const{state:a}=e,{field:s,name:n,label:i,value:r,dateOnly:l=!1,required:o,disabled:c,allowClear:f=!0}=t,m=((p=a.eventDtPicker)==null?void 0:p.field)===s,b=Nn(e,r,l);return`<div class="dt-field${m?" is-open":""}" data-dt-id="${d(s)}">
    <span class="dt-field-label">${d(i)}</span>
    <input type="hidden" name="${d(n)}" value="${d(r)}" ${o?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(s)}"
      data-dt-name="${d(n)}" data-dt-date-only="${l?"1":"0"}" data-dt-clear="${f?"1":"0"}"
      ${c?"disabled":""} aria-expanded="${m}">
      <span class="dt-trigger-text">${d(b)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${m&&!c?Fl(e,s,r,l,f):""}
  </div>`}function Ka(e,t){var s,n,i,r,l,o,c,f;const{state:a}=e;return t==="start"?String(((s=a.editingEvent)==null?void 0:s.start)||""):t==="end"?String(((n=a.editingEvent)==null?void 0:n.end)||""):t==="until"?((r=(i=a.editingEvent)==null?void 0:i.repeat)==null?void 0:r.until)||Ee((l=a.editingEvent)==null?void 0:l.start)||A(new Date):t==="due"?Fe((o=a.editingTask)==null?void 0:o.due):t==="dtstart"?Fe((c=a.editingNote)==null?void 0:c.dtstart):t==="bulk-due"?a.bulkDueValue:t==="birthday"?String(((f=a.editingContact)==null?void 0:f.birthday)||""):""}function Wa(e,t,a){const{state:s}=e;if(t==="start"&&s.editingEvent){s.editingEvent={...s.editingEvent,start:a||""};return}if(t==="end"&&s.editingEvent){s.editingEvent={...s.editingEvent,end:a};return}if(t==="until"&&s.editingEvent){s.editingEvent={...s.editingEvent,repeat:{...s.editingEvent.repeat??e.defaultRepeat(),until:a,endMode:"until"}};return}if(t==="due"&&s.editingTask){if(a===null||a==="")s.editingTask={...s.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingTask={...s.editingTask,due:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingTask={...s.editingTask,due:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="dtstart"&&s.editingNote){if(a===null||a==="")s.editingNote={...s.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingNote={...s.editingNote,dtstart:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingNote={...s.editingNote,dtstart:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="birthday"&&s.editingContact){s.editingContact={...s.editingContact,birthday:a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null};return}t==="bulk-due"&&(s.bulkDueValue=a||"")}function Al(e,t){const{root:a}=e,s=dr[t];if(!s)return;const n=a.querySelector("#info-modal"),i=a.querySelector("#info-modal-title"),r=a.querySelector("#info-modal-body");if(!n||!i||!r)return;i.textContent=s.title,r.innerHTML=s.paragraphs.map(o=>`<p>${d(o)}</p>`).join(""),n.hidden=!1,document.body.classList.add("info-modal-open");const l=n.querySelector(".info-modal-close");l==null||l.focus()}function Il(e){const{root:t}=e,a=t.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ul(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const r=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await r.write(e)}finally{await r.close()}return"saved"}catch(i){if(i instanceof DOMException&&i.name==="AbortError")return"cancelled"}const s=URL.createObjectURL(e),n=document.createElement("a");return n.href=s,n.download=t,n.rel="noopener",n.style.display="none",document.body.appendChild(n),n.click(),window.setTimeout(()=>{URL.revokeObjectURL(s),n.remove()},6e4),"started"}function Ml(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let s=a.value.trim();s&&!s.startsWith("#")&&(s=`#${s}`),/^#[0-9A-Fa-f]{6}/.test(s)&&(t.value=s.slice(0,7),a.value=s.toUpperCase())}))}function Ol(e){const t=is({activeTab:Qi(),adminPage:Zi(),adminSelectedUsername:$a().adminUsername??null});let a,s,n,i,r,l,o;function c(y,T){an(t,y,T)}function f(){ds(t)}function m(){const y=Da(e);t.user?il(o):Sa(e,t,(T,I)=>Ft(t,T,I)),ll(o),Ca(e,y),requestAnimationFrame(()=>{var T;Nt(o),(T=e.querySelector(".dt-time.is-selected"))==null||T.scrollIntoView({block:"center"})})}function b(){ue(n)}function p(){Pe(a)}function g(){X(a)}function u(){Rt(t)}function v(){ce(a)}function $(){cs(t,{stopImportElapsedTimer:b,stopFilesUploadElapsedTimer:p,resetFilesTransferTree:g,unbindUserMenuOutside:u,unbindFilesUploadMenuOutside:v})}function S(y){us(t,{message:y,clearSession:$,render:m})}function C(){return{state:t,render:m,handleSessionExpired:S,clearPortalSessionState:$,normalizeActiveTab:()=>xt(o),persistTab:Mt,loadHome:()=>_e(o),loadAdminCapabilities:()=>jt(s),loadAdminDashboard:()=>ft(s),loadAdminUsers:()=>we(s),loadAdminUserDetail:y=>te(s,y),loadAdminUserResources:y=>he(s,y),loadAdminSystemSettings:()=>pt(s),loadAdminDatabaseSettings:()=>bt(s),adminPageMeta:y=>fe(s,y),setFlash:c,clearFlash:f}}a={state:t,root:e,render:m,setFlash:c,clearFlash:f},s={state:t,root:e,render:m,setFlash:c,clearFlash:f,userIsAdmin:()=>$e(t),adminUiEnabled:()=>Je(t),persistTab:Mt,activateTab:(y,T)=>za(o,y,T),loadHome:()=>_e(o),normalizeActiveTab:()=>xt(o)},n={state:t,root:e,render:m,setFlash:c,clearFlash:f,localeWeekStart:()=>Tl(o),localeDowLabels:()=>Pl(o),formatDtDisplay:(y,T)=>Nn(o,y,T),timeFormatOpts:()=>El(o),renderPortalDateTimeField:y=>qe(o,y),getDtFieldCurrentValue:y=>Ka(o,y),setDtFieldValue:(y,T)=>Wa(o,y,T),positionDtPopovers:()=>Nt(o),renderFlashBanner:()=>_t(t),accessBadge:_a,formatImportResult:Ot,loadHome:()=>_e(o),onImportContacts:y=>Ki(l,y)},i={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:y=>qe(o,y)},r={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:y=>qe(o,y)},l={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:y=>qe(o,y),stopImportElapsedTimer:()=>ue(n),startImportElapsedTimer:()=>Tn(n),setImportPhase:(y,T)=>Ve(n,y,T),applyServerImportProgress:y=>Pn(n,y),readFileTextWithProgress:(y,T)=>An(n,y,T),formatImportResult:Ot,loadHome:()=>_e(o)},o={state:t,root:e,render:m,setFlash:c,clearFlash:f,filesHost:a,adminHost:s,calendarsHost:n,notesHost:i,tasksHost:r,contactsHost:l,clearPortalSessionState:$,userIsAdmin:()=>$e(t),adminUiEnabled:()=>Je(t),normalizeActiveTab:()=>xt(o),persistTab:Mt,activateTab:(y,T)=>za(o,y,T),activateAdminPage:(y,T)=>Cl(o,y,T),loadHome:()=>_e(o),handleSessionExpired:S,loadShares:y=>fa(n,y),loadMonthEvents:()=>Ct(n),loadContacts:y=>ya(l,y),loadTasks:()=>Ae(r),loadNotes:()=>Et(i),loadAdminCapabilities:()=>jt(s),loadAdminDashboard:()=>ft(s),loadAdminUsers:()=>we(s),loadAdminUserDetail:y=>te(s,y),loadAdminUserResources:y=>he(s,y),loadAdminSystemSettings:()=>pt(s),loadAdminDatabaseSettings:()=>bt(s),adminPageMeta:y=>fe(s,y),pickDefaultCalendar:()=>ti(n),toggleCalendarSelected:y=>ai(n,y),blankEventForDay:(y,T)=>ci(n,y,T),blankEventForSlot:(y,T,I)=>ui(n,y,T,I),defaultRepeat:()=>ga(),itemKey:H,openContact:y=>Hi(l,y),startNewContact:()=>Vi(l),emptyAddress:()=>On(),syncEditingEventFromForm:y=>mi(n,y),syncEditingTaskFromForm:y=>_i(r,y),syncEditingNoteFromForm:y=>Ii(i,y),runBulkTaskAction:y=>qi(r,y),shell:(y,T)=>Ft(t,y,T),renderLogin:()=>Sa(e,t,(y,T)=>Ft(t,y,T)),renderFlashBanner:()=>_t(t),renderMonthGrid:()=>ii(n),renderEventModal:()=>di(n),adminSubnavButtons:()=>hr(s),renderPortalDateTimeField:y=>qe(o,y),getDtFieldCurrentValue:y=>Ka(o,y),setDtFieldValue:(y,T)=>Wa(o,y,T),positionDtPopovers:()=>Nt(o),accessBadge:_a,formatImportResult:Ot,closeImportProgress:()=>fi(n),closeFilesUploadProgress:()=>pn(a),resetFilesTransferTree:g,stopImportElapsedTimer:b,stopFilesUploadElapsedTimer:p,unbindUserMenuOutside:u,bindUserMenuOutside:()=>ws(t,m),unbindFilesUploadMenuOutside:v,bindFilesUploadMenuOutside:()=>ar(a),onLogin:y=>bs(y,C()),onShare:y=>yi(n,y),onSaveEvent:y=>vi(n,y),onEditCal:y=>$i(n,y),onCreateCal:y=>wi(n,y),onSaveContact:y=>Wi(l,y),onCreateAb:y=>Yi(l,y),onEditAb:y=>Ji(l,y),onSaveTask:y=>Ri(r,y),onSaveNote:y=>Ui(i,y),bindColorPair:Ml,bindImportInput:()=>void 0,bindHolidaysToggle:()=>hi(n),bindContactPhotoInput:()=>void 0,bindFilesDom:()=>vn(a),bindAdminDom:()=>void 0,saveBlobAsFile:Ul,openInfoModal:y=>Al(o,y),closeInfoModal:()=>Il(o),captureScroll:()=>Da(e),restoreScroll:y=>Ca(e,y)},ml(o),ps(C())}let pe="",E=null,U=!1,W=null,se=null,oe="sqlite",vt=!1;async function Tt(e,t={}){const a={Accept:"application/json",...t.headers};t.body&&(a["Content-Type"]="application/json"),pe&&t.method&&t.method!=="GET"&&(a["X-CSRF-Token"]=pe);const s=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:a});let n;try{n=await s.json()}catch{throw new Error(`Request failed (${s.status})`)}if(!s.ok)throw new Error(n.error||`Request failed (${s.status})`);return n&&typeof n=="object"&&"data"in n&&n.data!==void 0?n.data:n}async function wa(){var e;E=await Tt("/status"),pe=E.csrfToken||pe,((e=E.defaults)==null?void 0:e.backend)==="pgsql"?oe="pgsql":oe="sqlite"}function Re(e,t,a){return`<label class="check-row"><input type="checkbox" name="${d(e)}" ${t?"checked":""} ${U?"disabled":""} /> ${d(a)}</label>`}function xl(){const e=E==null?void 0:E.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${d((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${d((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${ne("error",(E==null?void 0:E.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${U?"disabled":""}>Retry</button>
  </section>`}function Nl(){const e=E==null?void 0:E.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${U?"disabled":""}>
          ${$n((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Re("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${Re("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${Re("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Re("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Re("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${U?"disabled":""}>
          ${["Digest","Basic","Apache"].map(t=>`<option value="${t}" ${((e==null?void 0:e.dav_auth_type)||"Digest")===t?"selected":""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${d((e==null?void 0:e.invite_from)||"")}" ${U?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${d(String((e==null?void 0:e.session_max_age_minutes)??15))}" ${U?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${U?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${U?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${U?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function Ll(){const e=E==null?void 0:E.defaults,t=(E==null?void 0:E.pdoDrivers)||[],a=t.includes("sqlite"),s=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${U?"disabled":""}>
          ${a?`<option value="sqlite" ${oe==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${s?`<option value="pgsql" ${oe==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${oe==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${d((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${U?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${oe==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${d((e==null?void 0:e.pgsql_host)||"")}" placeholder="localhost:5432" ${U?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${d((e==null?void 0:e.pgsql_dbname)||"")}" ${U?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${d((e==null?void 0:e.pgsql_username)||"")}" autocomplete="off" ${U?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${U?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${U?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${U?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${U?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function _l(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${d(String((E==null?void 0:E.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${d((E==null?void 0:E.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${vt?"checked":""} ${U?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${U||!vt?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function ql(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${d((E==null?void 0:E.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function Rl(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${ne("error",(E==null?void 0:E.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function Y(){const e=document.getElementById("app");if(!e)return;const t=(E==null?void 0:E.step)||"permissions";let a="";E?t==="permissions"?a=xl():t==="initialize"?a=Nl():t==="database"?a=Ll():t==="upgrade"?a=_l():t==="done"?a=ql():t==="locked"?a=Rl():a=`<section class="card"><p>Unknown step: ${d(t)}</p></section>`:a='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${d((E==null?void 0:E.productVersion)||"…")}</span>
            ${E!=null&&E.configuredVersion?` · configured <span class="mono">${d(String(E.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${E!=null&&E.step?`<span class="badge badge-admin">${d(E.step)}</span>`:""}
      </header>
      ${W?ne("error",W,{dismissible:!1}):""}
      ${se?ne("success",se,{dismissible:!1}):""}
      ${a}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,Bl()}function Bl(){var t,a,s,n,i,r;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{Hl()}),(a=e.querySelector('[data-action="backend-change"]'))==null||a.addEventListener("change",l=>{oe=l.target.value==="pgsql"?"pgsql":"sqlite",Y()}),(s=e.querySelector('[data-action="upgrade-toggle"]'))==null||s.addEventListener("change",l=>{vt=!!l.target.checked,Y()}),(n=e.querySelector('[data-action="upgrade-run"]'))==null||n.addEventListener("click",()=>{zl()}),(i=e.querySelector('[data-form="initialize"]'))==null||i.addEventListener("submit",l=>{l.preventDefault(),Vl(l.target)}),(r=e.querySelector('[data-form="database"]'))==null||r.addEventListener("submit",l=>{l.preventDefault(),jl(l.target)}))}async function Hl(){U=!0,W=null,Y();try{await wa(),se=null}catch(e){W=e instanceof Error?e.message:"Failed to load installer status"}finally{U=!1,Y()}}async function Vl(e){const t=new FormData(e),a=n=>{var i;return!!((i=e.querySelector(`input[name="${n}"]`))!=null&&i.checked)},s={timezone:String(t.get("timezone")??"").trim(),cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};U=!0,W=null,se=null,Y();try{E=await Tt("/initialize",{method:"POST",body:JSON.stringify(s)}),pe=E.csrfToken||pe,se="Server settings saved. Configure the database next.",w.event("install.initialize")}catch(n){W=n instanceof Error?n.message:"Initialize failed"}finally{U=!1,Y()}}async function jl(e){const t=new FormData(e),a=String(t.get("backend")??oe),s={backend:a,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};a==="sqlite"?s.sqlite_file=String(t.get("sqlite_file")??"").trim():(s.pgsql_host=String(t.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(t.get("pgsql_username")??"").trim(),s.pgsql_password=String(t.get("pgsql_password")??"")),U=!0,W=null,se=null,Y();try{E=await Tt("/database",{method:"POST",body:JSON.stringify(s)}),pe=E.csrfToken||pe,se="Database configured. Installer is locked.",w.event("install.database"),E.completed||E.step}catch(n){W=n instanceof Error?n.message:"Database setup failed"}finally{U=!1,Y()}}async function zl(){if(vt){U=!0,W=null,se=null,Y();try{const e=await Tt("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});se="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),w.event("install.upgrade"),await wa()}catch(e){W=e instanceof Error?e.message:"Upgrade failed"}finally{U=!1,Y()}}}async function Kl(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await wa()}catch(t){W=t instanceof Error?t.message:"Failed to load installer"}Y()}Jt();const Wt=document.getElementById("app");if(!Wt)throw new Error("#app missing");const Ya=window.location.pathname.replace(/\/+$/,"")||"/";Ya==="/portal/install"||Ya.endsWith("/portal/install")?Kl(Wt):Ol(Wt);
