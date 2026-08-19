var es=Object.defineProperty;var ts=(e,t,a)=>t in e?es(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var yt=(e,t,a)=>ts(e,typeof t!="symbol"?t+"":t,a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const Gt={off:0,error:1,warn:2,info:3,debug:4};let Ue="off";const Xe="[angaradav-portal]";function as(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function ss(e){return Ue=as(e),Ue!=="off"&&console.info(Xe,`log level = ${Ue}`),Ue}function ya(e){return Gt[Ue]>=Gt[e]}function Be(e,t,a,n){if(!ya(e))return;const s=[Xe,a];n!==void 0&&s.push(n),console[t](...s)}function ns(e,t){ya("info")&&(t&&Object.keys(t).length>0?console.info(Xe,`event:${e}`,t):console.info(Xe,`event:${e}`))}const $={error(e,t){Be("error","error",e,t)},warn(e,t){Be("warn","warn",e,t)},info(e,t){Be("info","info",e,t)},debug(e,t){Be("debug","debug",e,t)},event:ns};class I extends Error{constructor(a,n,s={}){super(a);yt(this,"status");yt(this,"payload");this.status=n,this.payload=s}}let ce="",We=null,Je=null;function Ye(e){ce=e&&typeof e=="string"?e:""}function rs(e){We=e}function is(e){Je=e}function ot(e){if(!va(e))try{Je==null||Je()}catch{}}function va(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function xe(e,t){if(!va(e)){Ye("");try{We==null||We(t||"Session timed out. Please sign in again.")}catch{}}}async function ls(e){const t=typeof performance<"u"?performance.now():Date.now();$.debug(`api → GET ${e}`);const a=await fetch(`/api${e}`,{credentials:"same-origin"}),n=Math.round((typeof performance<"u"?performance.now():Date.now())-t);if(!a.ok){let r=`Request failed (${a.status})`,l={};try{const o=await a.json();l={...o},typeof o.error=="string"&&(r=o.error)}catch{}throw a.status>=500?$.error(`api ← GET ${e} ${a.status} (${n}ms)`,r):a.status!==401?$.warn(`api ← GET ${e} ${a.status} (${n}ms)`,r):($.debug(`api ← GET ${e} 401 (${n}ms)`),xe(e,r)),new I(r,a.status,l)}$.info(`api ← GET ${e} ${a.status} (${n}ms)`),ot(e);const s=a.headers.get("Content-Type")||"application/octet-stream";return{blob:await a.blob(),contentType:s}}async function C(e,t={}){const a=new Headers(t.headers);t.body&&!a.has("Content-Type")&&a.set("Content-Type","application/json");const n=(t.method||"GET").toUpperCase();n!=="GET"&&n!=="HEAD"&&n!=="OPTIONS"&&ce&&a.set("X-CSRF-Token",ce);const s=typeof performance<"u"?performance.now():Date.now();$.debug(`api → ${n} ${e}`);const i=await fetch(`/api${e}`,{...t,headers:a,credentials:"same-origin"});let r=null;const l=await i.text();if(l)try{r=JSON.parse(l)}catch{r={error:l}}const o=Math.round((typeof performance<"u"?performance.now():Date.now())-s);if(!i.ok){let c=`Request failed (${i.status})`,f={};if(r&&typeof r=="object"&&r!==null){const m=r;f={...m},typeof m.error=="string"&&(c=m.error)}else(i.status===500||i.status===504)&&(c="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw i.status>=500?$.error(`api ← ${n} ${e} ${i.status} (${o}ms)`,c):i.status!==401?$.warn(`api ← ${n} ${e} ${i.status} (${o}ms)`,c):($.debug(`api ← ${n} ${e} 401 (${o}ms)`),xe(e,c)),new I(c,i.status,f)}return $.info(`api ← ${n} ${e} ${i.status} (${o}ms)`),ot(e),r}function q(e){return encodeURIComponent(e)}async function Qt(e,t,a,n){const s=new Headers({"Content-Type":a,Accept:"application/x-ndjson, application/json;q=0.9"});ce&&s.set("X-CSRF-Token",ce);const i=typeof performance<"u"?performance.now():Date.now();$.debug(`api → POST ${e} (stream, ${a}, ${t.length} bytes)`);let r;try{r=await fetch(`/api${e}`,{method:"POST",headers:s,credentials:"same-origin",body:t})}catch(p){const w=p instanceof Error?p.message:"Network error";throw $.error(`api ← POST ${e} network fail`,w),new I(`Import request failed to start (${w}). Check connectivity and container logs.`,0)}const l=(r.headers.get("Content-Type")||"").toLowerCase(),o=l.includes("ndjson")||l.includes("x-ndjson");if(!r.ok&&!o){let p=`Request failed (${r.status})`;try{const w=await r.json();w.error&&(p=w.error)}catch{}throw(r.status===504||r.status===502)&&(p="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),r.status===401?($.debug(`api ← POST ${e} 401`,p),xe(e,p)):$.warn(`api ← POST ${e} ${r.status}`,p),new I(p,r.status)}if(!o&&r.ok){try{const p=await r.json();if(p&&typeof p.error=="string")throw new I(p.error,r.status||500);if(p&&typeof p.imported=="number"&&typeof p.updated=="number")return $.info(`api ← POST ${e} json done`),p}catch(p){if(p instanceof I)throw p}throw new I("Unexpected import response from server",500)}if(!r.body)throw new I("Import stream unavailable",500);const c=r.body.getReader(),f=new TextDecoder;let m="";const u={final:null,error:null,sawProgress:!1},b=p=>{let w;try{w=JSON.parse(p)}catch{$.debug("import stream non-JSON line",p.slice(0,80));return}if(w.type==="progress"){u.sawProgress=!0;const k=Number(w.total)||0,S=Number(w.current)||0,v=typeof w.percent=="number"?w.percent:k>0?Math.round(100*S/k):0;n==null||n({percent:v,current:S,total:k,imported:Number(w.imported)||0,updated:Number(w.updated)||0,skipped:Number(w.skipped)||0})}else w.type==="done"&&w.result?u.final=w.result:w.type==="error"&&(u.error={message:w.error||"Import failed",status:w.status||500})};for(;;){const{done:p,value:w}=await c.read();if(p)break;m+=f.decode(w,{stream:!0});const k=m.split(`
`);m=k.pop()??"";for(const S of k){const v=S.trim();v&&b(v)}}m.trim()&&b(m.trim());const y=Math.round((typeof performance<"u"?performance.now():Date.now())-i);if(u.error)throw u.error.status===401?($.debug(`api ← POST ${e} stream 401 (${y}ms)`,u.error.message),xe(e,u.error.message)):$.warn(`api ← POST ${e} stream error (${y}ms)`,u.error.message),new I(u.error.message,u.error.status);if(!u.final)throw $.error(`api ← POST ${e} stream incomplete (${y}ms)`,{sawProgress:u.sawProgress}),new I(u.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return $.info(`api ← POST ${e} stream done (${y}ms)`),ot(e),u.final}const h={ui:()=>C("/ui"),installStatus:async()=>{const e=await C("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e},adminPing:()=>C("/admin/ping"),adminDashboard:()=>C("/admin/dashboard"),adminCapabilities:()=>C("/admin/capabilities"),adminUsers:()=>C("/admin/users"),adminUser:e=>C(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>C("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>C(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserCalendar:(e,t,a=!0)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a})}),adminUserAddressBooks:e=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserAddressBook:(e,t,a=!0,n=!1)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a,force:n})}),adminSystemSettings:()=>C("/admin/settings/system"),adminUpdateSystemSettings:e=>C("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>C("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>C("/admin/settings/database"),adminTestDatabaseConnection:e=>C("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>C("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await C("/me");return Ye(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)||""),e},login:async(e,t)=>{var n;const a=await C("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return Ye((n=a.user)==null?void 0:n.csrfToken),a},logout:async()=>{try{return await C("/logout",{method:"POST"})}finally{Ye("")}},calendars:()=>C("/calendars"),createCalendar:e=>C("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>C("/holidays/countries"),updateCalendar:(e,t)=>C(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>C(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,a)=>{const n=new URLSearchParams({from:t,to:a}).toString();return C(`/calendars/${e}/events?${n}`)},getEvent:(e,t)=>C(`/calendars/${e}/events/${q(t)}`),createEvent:(e,t)=>C(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,a)=>C(`/calendars/${e}/events/${q(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteEvent:(e,t)=>C(`/calendars/${e}/events/${q(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new I(r,t.status)}const a=t.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(a),s=(n==null?void 0:n[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:s}},importCalendar:(e,t,a)=>Qt(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",a),directory:()=>C("/directory"),shares:e=>C(`/calendars/${e}/shares`),share:(e,t,a)=>C(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:a})}),revoke:(e,t)=>C(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})}),addressbooks:()=>C("/addressbooks"),createAddressBook:e=>C("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>C(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>C(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new I(r,t.status)}const a=t.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(a),s=(n==null?void 0:n[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:s}},importAddressBook:(e,t,a)=>Qt(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",a),contacts:(e,t="")=>{const a=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return C(`/addressbooks/${e}/contacts${a}`)},getContact:(e,t)=>C(`/addressbooks/${e}/contacts/${q(t)}`),createContact:(e,t)=>C(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,a)=>C(`/addressbooks/${e}/contacts/${q(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteContact:(e,t)=>C(`/addressbooks/${e}/contacts/${q(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const a=await fetch(`/api/addressbooks/${e}/contacts/${q(t)}/export`,{credentials:"same-origin"});if(!a.ok){let l=`Export failed (${a.status})`;try{const o=await a.json();o.error&&(l=o.error)}catch{}throw new I(l,a.status)}const n=a.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(n),i=(s==null?void 0:s[1])||"contact.vcf";return{blob:await a.blob(),filename:i}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${q(t)}/photo`,tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/tasks${a}`)},createTask:e=>C("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,a)=>C(`/tasks/${e}/${q(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteTask:(e,t)=>C(`/tasks/${e}/${q(t)}`,{method:"DELETE"}),bulkTasks:e=>C("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/notes${a}`)},createNote:e=>C("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,a)=>C(`/notes/${e}/${q(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteNote:(e,t)=>C(`/notes/${e}/${q(t)}`,{method:"DELETE"}),filesStatus:()=>C("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const a=t.toString()?`?${t}`:"";return C(`/files/entries${a}`)},filesMkdir:(e,t)=>C("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,a={})=>{const n=new URLSearchParams;e&&n.set("path",e),n.set("name",t.name),a.replace&&n.set("replace","1");const s=new FormData;s.append("file",t,t.name),e&&s.append("path",e);const i=typeof performance<"u"?performance.now():Date.now();return $.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((r,l)=>{const o=new XMLHttpRequest;o.open("POST",`/api/files/upload?${n}`),o.withCredentials=!0,ce&&o.setRequestHeader("X-CSRF-Token",ce),a.onProgress&&(o.upload.onprogress=c=>{var f,m;c.lengthComputable?(f=a.onProgress)==null||f.call(a,c.loaded,c.total):(m=a.onProgress)==null||m.call(a,c.loaded,t.size||c.loaded)}),o.onload=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-i);let f=null;const m=o.responseText||"";if(m)try{f=JSON.parse(m)}catch{f={error:m}}const u=o.status;if(u<200||u>=300){let b=`Upload failed (${u||0})`;f&&typeof f=="object"&&f!==null&&"error"in f&&typeof f.error=="string"&&(b=f.error),u===401?($.debug(`api ← POST /files/upload 401 (${c}ms)`,b),xe("/files/upload",b)):u>=500?$.error(`api ← POST /files/upload ${u} (${c}ms)`,b):$.warn(`api ← POST /files/upload ${u} (${c}ms)`,b),l(new I(b,u||0));return}$.info(`api ← POST /files/upload 200 (${c}ms)`),ot("/files/upload"),r(f)},o.onerror=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-i);$.error(`api ← POST /files/upload network error (${c}ms)`),l(new I("Upload failed (network error)",0))},o.onabort=()=>{l(new I("Upload cancelled",0))},o.send(s)})},filesDownloadUrl:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),`/api/files/download?${a}`},filesGetBlob:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),ls(`/files/download?${a}`)},filesDelete:e=>C("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>C("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,a)=>C("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:a})}),filesCopy:(e,t={})=>C("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>C("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},$a="angaradav-portal-tab",wa="angaradav-portal-admin-page",os="angaradav-portal-cal-selection",ds="2.3.0",cs="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function us(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],calendarSelectionSeeded:!1,listKeyboardFocus:!1,shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,filesDropDepth:0,escapeBound:!1,portalEventsBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off",services:null},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:ds,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,checkedFilePaths:[],filesPreview:null,filesPreviewSeq:0,filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Y(e,t,a={}){if(!t)return"";const n=a.dismissible!==void 0?a.dismissible:a.dismissAction!==void 0,s=a.dismissAction??"flash-close",i=a.role??"status",r=a.className?` ${a.className}`:"",l=a.style?` style="${d(a.style)}"`:"",o=n?`<button type="button" class="flash-close" data-action="${d(s)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${d(e)}${r}" role="${d(i)}"${l}>
      <span class="flash-text">${d(t)}</span>
      ${o}
    </div>`}function ms(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function fs(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function Mt(e){return e.map(a=>{const n=a.type??"button",s=fs(a.variant),i=a.disabled?" disabled":"",r=a.id?` id="${d(a.id)}"`:"",l=a.action?` data-action="${d(a.action)}"`:"",o=a.attrs?` ${a.attrs}`:"";return`<button type="${n}" class="${s}"${l}${r}${o}${i}>${d(a.label)}</button>`}).join(`
`)}function U(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=e.id?` id="${d(e.id)}"`:"",n=e.className?` ${e.className}`:"",s=e.rootAttrs?` ${e.rootAttrs}`:"",i=`${ms(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,r=e.closeAction,l=e.lockBackdrop?"":` data-action="${d(r)}"`,o=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${d(r)}" aria-label="Close">×</button>`;let c="";e.footer!==void 0&&(c=typeof e.footer=="string"?e.footer:Mt(e.footer));const f=c?`<footer class="cal-modal-footer">${c}</footer>`:"",m=`<div class="cal-modal-body">${e.body}</div>`;let u;return e.form?u=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${m}
        ${f}
      </form>`:u=`${m}
      ${f}`,`<div class="cal-modal${n}"${a}${s} role="dialog" aria-modal="true" aria-labelledby="${d(t)}">
      <div class="cal-modal-backdrop"${l}></div>
      <div class="cal-modal-card${i}">
        <header class="cal-modal-header">
          <h3 id="${d(t)}">${d(e.title)}</h3>
          ${o}
        </header>
        ${u}
      </div>
    </div>`}function dt(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",a=e.style==="checkbox"?' style="margin-top:1rem"':"",n=e.id?` id="${d(e.id)}"`:"",s=e.checked?" checked":"",i=e.disabled?" disabled":"";return`<label class="${t}"${a}>
            <input type="checkbox"${n} data-action="${d(e.action)}"${s}${i} />
            ${d(e.label)}
          </label>`}function ka(e,t,a){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:a})}function ps(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function Ct(e){return e.flash?Y(e.flash.type,e.flash.message,{dismissible:!0}):""}function ue(e){var t,a;return!!((t=e.user)!=null&&t.isAdmin||((a=e.user)==null?void 0:a.role)==="Admin")}function Le(e){return ue(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function Ge(e,t){if(!t)return;const a=(t.timeFormat||"auto").toLowerCase(),n=(t.weekStart||"auto").toLowerCase(),s=e.portalUi.services;let i=s;if(t.services&&typeof t.services=="object"){const r=s??{caldav:!0,carddav:!0,tasks:!0,notes:!0,files:!0},l=t.services;i={caldav:typeof l.caldav=="boolean"?l.caldav:r.caldav,carddav:typeof l.carddav=="boolean"?l.carddav:r.carddav,tasks:typeof l.tasks=="boolean"?l.tasks:r.tasks,notes:typeof l.notes=="boolean"?l.notes:r.notes,files:typeof l.files=="boolean"?l.files:r.files}}e.portalUi={timeFormat:a==="12h"||a==="24h"?a:"auto",weekStart:n==="monday"||n==="sunday"?n:"auto",logLevel:t.logLevel||"off",services:i},ss(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function W(e,t){if(t==="admin")return!0;const a=e.portalUi.services;if(!a)return!0;switch(t){case"calendars":return a.caldav;case"contacts":return a.carddav;case"tasks":return a.tasks;case"notes":return a.notes;case"files":return a.files;default:return!0}}function Ze(e){const t=["calendars","contacts","tasks","notes","files"];for(const a of t)if(W(e,a))return a;return"calendars"}function Nt(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function Tt(e,t){if(Nt(e),!e.user)return;const a=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},a)}function bs(e,t){var a;if(Nt(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.calendarSelectionSeeded=!1,e.listKeyboardFocus=!1,e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,(a=e.filesPreview)!=null&&a.objectUrl)try{URL.revokeObjectURL(e.filesPreview.objectUrl)}catch{}e.filesPreview=null,e.filesPreviewSeq+=1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function gs(e,t){if(!e.handlingSessionExpiry){if(!e.user){Nt(e);return}e.handlingSessionExpiry=!0;try{$.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function ys(e,t){const a=String(t.step||"");a==="upgrade"||a==="initialize"||a==="permissions"||a==="database"?(e.installGate={step:a,message:t.message||(a==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function vs(e,t){if(!(t instanceof I)||t.status!==503)return!1;const a=typeof t.payload.code=="string"?t.payload.code:"";if(a!=="upgrade_required"&&a!=="not_configured"&&a!=="admin_password_missing")return!1;const n=a==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:n,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function ha(e){var a,n,s,i;const{state:t}=e;if(t.activeTab==="admin"&&ue(t)&&Le(t))try{t.adminPage==="overview"&&((a=e.adminPageMeta("overview"))==null?void 0:a.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((n=e.adminPageMeta("users"))==null?void 0:n.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((s=e.adminPageMeta("settings"))==null?void 0:s.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((i=e.adminPageMeta("database"))==null?void 0:i.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(r){$.warn("admin page load",r instanceof Error?r.message:r)}}async function $s(e){var a;const{state:t}=e;$.event("bootstrap.start"),rs(n=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(n)?n:"Your session timed out. Please sign in again.")}),is(()=>{Tt(t,n=>e.handleSessionExpired(n))});try{const n=await h.installStatus();ys(t,n)}catch(n){$.debug("bootstrap: /api/install/status failed",n instanceof Error?n.message:n)}try{const n=await h.ui();Ge(t,n.ui),typeof n.version=="string"&&n.version.trim()!==""?t.appVersion=n.version.trim():n.ui&&typeof n.ui.version=="string"&&n.ui.version.trim()!==""&&(t.appVersion=n.ui.version.trim())}catch(n){$.debug("bootstrap: /api/ui failed",n instanceof Error?n.message:n),vs(t,n)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),$.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const n=await h.me();if(!n.user)e.clearPortalSessionState(),Ge(t,n.ui),typeof n.version=="string"&&n.version.trim()!==""&&(t.appVersion=n.version.trim()),$.event("bootstrap.anonymous");else{if(t.user=n.user,Ge(t,n.ui),typeof n.version=="string"&&n.version.trim()!==""&&(t.appVersion=n.version.trim()),$.event("bootstrap.session",{username:((a=t.user)==null?void 0:a.username)??null}),Tt(t,s=>e.handleSessionExpired(s)),ue(t))try{await e.loadAdminCapabilities()}catch(s){$.warn("admin.capabilities bootstrap",s instanceof Error?s.message:s)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await ha(e)}}catch(n){n instanceof I&&n.status===401?(e.clearPortalSessionState(),$.event("bootstrap.anonymous")):($.error("bootstrap failed",n instanceof Error?n.message:n),ka(t,"error",n instanceof Error?n.message:"Failed to load"))}e.render()}async function ws(e,t){var r;const{state:a}=t,n=new FormData(e),s=String(n.get("username")??""),i=String(n.get("password")??"");a.busy=!0,t.clearFlash(),t.render(),$.event("login.attempt",{username:s});try{const l=await h.login(s,i);if(a.user=l.user,Ge(a,l.ui),$.event("login.ok",{username:((r=a.user)==null?void 0:r.username)??s}),Tt(a,o=>t.handleSessionExpired(o)),ue(a))try{await t.loadAdminCapabilities()}catch(o){$.warn("admin.capabilities login",o instanceof Error?o.message:o)}t.normalizeActiveTab(),t.persistTab(a.activeTab,a.adminPage),await t.loadHome(),await ha(t),t.setFlash("success","Signed in")}catch(l){$.warn("login.failed",l instanceof Error?l.message:l),t.setFlash("error",l instanceof Error?l.message:"Login failed")}finally{a.busy=!1,t.render()}}function Xt(e,t,a){const n=t.installGate,s=n&&(n.step==="upgrade"||n.step==="initialize"||n.step==="permissions"||n.step==="database"),i=(n==null?void 0:n.installUrl)||"/portal/install/";let r="";if(s&&n){const o=n.step==="upgrade"?"Server upgrade required":"Setup incomplete",c=n.step==="upgrade"&&(n.configuredVersion||n.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${d(String(n.configuredVersion||"—"))}</span>
              → product <span class="mono">${d(String(n.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${d(o)}.</strong>
            ${d(n.message||"Complete the installer before signing in.")}
            ${c}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${d(i)}">Open installer</a>
        </p>`}const l=t.busy||!!s;e.innerHTML=a(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function Zt(e){const t=e.querySelector(".contacts-table-wrap"),a=e.querySelector(".contacts-ab-list"),n=e.querySelector(".calendars-owned-list"),s=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(a==null?void 0:a.scrollTop)??null,calListTop:(n==null?void 0:n.scrollTop)??null,filesTableTop:(s==null?void 0:s.scrollTop)??null}}function ea(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const a=e.querySelector(".contacts-table-wrap");a&&(a.scrollTop=t.tableTop)}if(t.abListTop!==null){const a=e.querySelector(".contacts-ab-list");a&&(a.scrollTop=t.abListTop)}if(t.calListTop!==null){const a=e.querySelector(".calendars-owned-list");a&&(a.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const a=e.querySelector(".files-table-wrap");a&&(a.scrollTop=t.filesTableTop)}})})}function ks(e){const t=e.confirmDelete;if(!t)return"";const a=t.detail?`<p class="muted small" style="margin:0.75rem 0 0">${d(t.detail)}</p>`:"";return U({id:"portal-confirm-delete-modal",title:t.title,titleId:"portal-confirm-delete-title",closeAction:"confirm-delete-cancel",size:"sm",body:`<p style="margin:0">${d(t.message)}</p>${a}`,footer:[{label:"Cancel",action:"confirm-delete-cancel",variant:"ghost",disabled:e.busy},{label:"Delete",action:"confirm-delete-ok",variant:"danger",disabled:e.busy}]})}function ta(e){e.confirmDelete=null}const hs={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Click a file name or View to preview it: images, PDF, text, audio, and video open in a dialog. Other types offer a download instead. Download, create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function M(e,t,a="h2"){const n=a;return`<div class="section-title-row">
    <${n}>${d(e)}</${n}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(t)}"
      aria-label="About ${d(e)}" title="About ${d(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Ss(){return`
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
    </div>`}function vt(e,t,a={},n){const s=!!e.user&&e.activeTab==="admin"&&ue(e)&&Le(e),l=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${s?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${d(s?"Administration Portal":"User Portal")}</span></span>`,o=e.user?d(e.user.displayname||e.user.username):"",c=Le(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",f=s?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",m=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${o}">
              <span class="user-menu-name">${o}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${e.userMenuOpen?"":"hidden"}>
              ${f}
              ${c}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",u=e.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${l}</a>
          <div class="topnav-right">
            ${m}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${l}</a>
        </nav>`,y=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesPreview!==null||e.filesUploadConflict!==null||e.filesUploadProgress!==null||e.confirmDelete!==null)?Ct(e):"",p=a.tabs&&a.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${a.tabs}
        </div>
      </div>`:"",w=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${d(e.appVersion)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(cs)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return a.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${u}
      ${p}
    </div>
      <main class="container">
        ${y}
        ${t}
      </main>
      ${w}
      ${Ss()}
      ${ks(e)}
      ${n.renderImportProgressModal()}
      ${n.renderFilesUploadProgressModal()}`}function Et(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function Ds(e,t){Et(e),e.userMenuDocClick=n=>{var i;const s=n.target;(i=s==null?void 0:s.closest)!=null&&i.call(s,".user-menu")||(e.userMenuOpen=!1,Et(e),t())};const a=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===a&&document.addEventListener("click",a,!0)},0)}function et(e){e.dtPickerDocClick&&(document.removeEventListener("click",e.dtPickerDocClick,!0),e.dtPickerDocClick=null)}function Cs(e,t){if(et(e),!e.eventDtPicker)return;e.dtPickerDocClick=n=>{var i,r;const s=n.target;(i=s==null?void 0:s.closest)!=null&&i.call(s,".dt-field.is-open, .dt-popover, [data-dt-popover]")||(r=s==null?void 0:s.closest)!=null&&r.call(s,'[data-action="dt-open"]')||(e.eventDtPicker=null,et(e),t())};const a=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===a&&document.addEventListener("click",a,!0)},0)}async function te(e){e.state.filesLoading=!0;try{$.debug("loadFiles",{path:e.state.filesPath});const[t,a]=await Promise.all([h.filesStatus(),h.filesList(e.state.filesPath).catch(n=>{if(n instanceof I&&(n.status===503||n.status===404))return{path:e.state.filesPath,entries:[]};throw n})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=a.path,e.state.filesEntries=a.entries;const n=new Set(e.state.filesEntries.map(s=>s.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(s=>n.has(s))}else e.state.filesEntries=[],e.state.checkedFilePaths=[];$.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function Sa(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Ne(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function ct(e,t,a){for(const n of a)if(n&&(t===n||t.startsWith(`${n}/`)))return!0;return!1}function j(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function Ve(e,t,a){if(a.length===0)return;e.state.filesTransfer={op:t,paths:[...a]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const n=new Set([""]);if(e.state.filesPath){const s=e.state.filesPath.split("/").filter(Boolean);let i="";for(const r of s)i=i?`${i}/${r}`:r,n.add(i)}e.state.filesTreeExpanded=[...n],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),e.clearFlash(),e.render(),await Promise.all([...n].map(s=>Pt(e,s)))}async function Pt(e,t){const a=e.state.filesTreeChildren[t];if(!(a&&a!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const s=(await h.filesList(t)).entries.filter(i=>i.type==="dir").slice().sort((i,r)=>i.name.localeCompare(r.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:s}}catch(n){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},$.warn("files.tree",{path:t||"/",error:n instanceof Error?n.message:String(n)})}e.render()}}function Ts(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,a=[],n=(s,i)=>{const r=e.state.filesTransferDest===s,l=ct(e,s,t),o=e.state.filesTreeExpanded.includes(s),c=e.state.filesTreeChildren[s],f=Array.isArray(c),m=s===""||c==="loading"||c==="error"||!f||c.length>0,u=s===""?"Home":Ne(s),b=l?"Cannot use a selected item (or a folder inside it) as the destination":s===""?"File home host.root":s,y=o?"▾":"▸";if(a.push(`<div class="files-tree-row${r?" is-selected":""}${l?" is-blocked":""}" style="--depth:${i}" role="treeitem" aria-selected="${r}" aria-expanded="${o}" aria-disabled="${l}">
      ${m?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${d(s)}"
              aria-label="${o?"Collapse":"Expand"} ${d(u)}" ${e.state.busy?"disabled":""}>${y}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${r?" is-selected":""}" data-action="files-tree-select" data-path="${d(s)}"
        title="${d(b)}" ${e.state.busy||l?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${d(u)}</span>
      </button>
    </div>`),!!o){if(c==="loading"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Loading…</div>`);return}if(c==="error"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${d(s)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(f){for(const p of c)n(p.path,i+1);c.length===0&&s===""&&a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">No subfolders yet — destination will be Home.</div>`)}}};return n("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${a.join("")}</div>`}async function Es(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const a=new FormData(t),n=(e.state.filesTransferDest||String(a.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),s=String(a.get("newName")??"").trim(),i=e.state.filesTransfer.op,r=[...e.state.filesTransfer.paths],l=r.length>1;if(ct(e,n,r)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let o=0;const c=[];try{for(const m of r)try{if(i==="copy"){const u=Ne(m),b=l||!s||s===u?void 0:s,y=await h.filesCopy(m,{to:n,newName:b});$.event("files.copy",{path:m,to:y.entry.path})}else{const u=Ne(m),b=l||!s||s===u?void 0:s;await h.filesMove(m,n,b),$.event("files.move",{path:m,to:n})}o+=1}catch(u){c.push(`${Ne(m)}: ${u instanceof Error?u.message:"failed"}`)}j(e),e.state.checkedFilePaths=[],await te(e);const f=i==="copy"?"Copied":"Moved";o>0&&c.length===0?e.setFlash("success",o===1?`${f} 1 item`:`${f} ${o} items`):o>0?e.setFlash("info",`${f} ${o}; ${c.length} failed. ${c[0]}`):e.setFlash("error",c[0]||`${i==="copy"?"Copy":"Move"} failed`)}catch(f){e.setFlash("error",f instanceof Error?f.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function At(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Da(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function Ca(e,t=!0){return Array.from(e).map(n=>{const i=(n.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")||n.name;return{file:n,relativePath:i||n.name}})}function Ps(e){return new Promise((t,a)=>{const n=[],s=()=>{e.readEntries(i=>{if(!i.length){t(n);return}n.push(...i),s()},i=>a(i))};s()})}function As(e){return new Promise((t,a)=>{e.file(t,a)})}async function Ta(e,t){const a=At(t,e.name);if(e.isFile)return[{file:await As(e),relativePath:a||e.name}];if(e.isDirectory){const n=e.createReader(),s=await Ps(n);if(s.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const i=[];for(const r of s)i.push(...await Ta(r,a));return i}return[]}async function*Fs(e){const t=e;if(typeof t.values=="function"){for await(const a of t.values())yield a;return}if(typeof t.entries=="function")for await(const[,a]of t.entries())yield a}async function xt(e,t){const a=At(t,e.name),n=[];let s=0;for await(const i of Fs(e))if(s+=1,i.kind==="file"){const r=await i.getFile();n.push({file:r,relativePath:At(a,i.name)||r.name})}else i.kind==="directory"&&n.push(...await xt(i,a));return s===0&&n.push({file:null,relativePath:a,isEmptyDir:!0}),n}async function Us(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const a=[];for(const n of t){const s=await n.getFile();a.push({file:s,relativePath:s.name})}return{kind:"items",items:a}}catch(t){return Da(t)?{kind:"cancel"}:{kind:"fallback"}}}async function Is(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),a=await xt(t,"");return a.length===0?{kind:"cancel"}:{kind:"items",items:a}}catch(t){return Da(t)?{kind:"cancel"}:{kind:"fallback"}}}function aa(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function Os(e){const t=e.files?Array.from(e.files):[],a=[],n=[],s=e.items?Array.from(e.items):[];for(const i of s){if(i.kind!=="file")continue;const r=i;typeof r.getAsFileSystemHandle=="function"?a.push(r.getAsFileSystemHandle().catch(()=>null)):a.push(Promise.resolve(null));let l=null;if(typeof r.webkitGetAsEntry=="function")try{l=r.webkitGetAsEntry()}catch{l=null}n.push(l)}return{handlePromises:a,entries:n,files:t}}async function Ms(e){var i,r;const t=[],a=await Promise.all(e.handlePromises);for(let l=0;l<Math.max(a.length,e.entries.length);l++){const o=a[l]??null;if(o)try{if(o.kind==="file"){const f=await o.getFile();t.push({file:f,relativePath:f.name})}else o.kind==="directory"&&t.push(...await xt(o,""));continue}catch{}const c=e.entries[l];if(c)try{t.push(...await Ta(c,""))}catch{}}const n=Ca(e.files,!0),s=new Map;for(const l of n){const o=aa(l.relativePath||((i=l.file)==null?void 0:i.name)||"");o&&s.set(o,l)}for(const l of t){const o=aa(l.relativePath||((r=l.file)==null?void 0:r.name)||"");o&&s.set(o,l)}return Array.from(s.values())}function Ns(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function Ea(e,t=80){const a=String(e??"").replace(/\s+/g," ").trim();return a?a.length>t?`${a.slice(0,t-1)}…`:a:""}function ne(e,t,a){const n=Ea(t);return n?`${e} “${n}” ${a}`:`${e} ${a}`}function $t(e){const t=Ea(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(n=>String(n??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function Pa(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function tt(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function K(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),n=t%60;return a>0?`${a}m ${n}s`:`${n}s`}function z(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function xs(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function X(e,t,a,n,s,i=""){const r=a===t,l=r?n==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${r?" is-sorted":""}${i?" "+i:""}`}" data-action="sort-${s}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${l}</th>`}const Ft=2*1024*1024,Ls=50*1024*1024,_s=new Set(["jpg","jpeg","jfif","png","gif","webp","bmp","avif","ico","heic","heif"]),Rs=new Set(["mp3","wav","ogg","oga","flac","aac","m4a","opus","weba"]),qs=new Set(["mp4","m4v","webm","ogv","mov"]),Bs=new Set(["txt","md","markdown","rst","csv","tsv","json","jsonc","xml","yml","yaml","html","htm","xhtml","js","mjs","cjs","ts","tsx","jsx","css","scss","less","php","py","rb","go","rs","java","c","h","cpp","hpp","cs","sh","bash","zsh","sql","log","ini","conf","cfg","env","toml","diff","patch","vue","svelte","svg","rss","atom","ics","vcf","eml","nfo","rtf","tex","lua","kt","swift","pl","pm"]);function Vs(e){const t=e.split(/[/\\]/).pop()||e,a=t.lastIndexOf(".");return a<=0?"":t.slice(a+1).toLowerCase()}function Hs(e){const t=Vs(e);return _s.has(t)?"image":t==="pdf"?"pdf":Rs.has(t)?"audio":qs.has(t)?"video":Bs.has(t)?"text":"unsupported"}function js(e){const t=e.filesPreview;if(t!=null&&t.objectUrl)try{URL.revokeObjectURL(t.objectUrl)}catch{}e.filesPreviewSeq+=1,e.filesPreview=null}function R(e){js(e.state)}async function Ks(e,t){const a=e.state.filesEntries.find(l=>l.path===t);if(!a||a.type!=="file")return;R(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,j(e),e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1;const n=Hs(a.name),s=e.state.filesPreviewSeq+1;e.state.filesPreviewSeq=s;const i={path:a.path,name:a.name,size:a.size,kind:n,status:"loading",objectUrl:null,text:null,truncated:!1,error:null};if(!(n==="text"||n==="pdf")){e.state.filesPreview={...i,status:"ready"},$.event("files.preview",{path:a.path,kind:n}),e.render();return}e.state.filesPreview=i,e.render();try{if(n==="pdf"&&a.size>Ls){if(e.state.filesPreviewSeq!==s)return;e.state.filesPreview={...i,status:"error",error:`This PDF is too large to preview (${z(a.size)}). Download it instead.`},e.render();return}const{blob:l}=await h.filesGetBlob(a.path,{inline:!0});if(e.state.filesPreviewSeq!==s)return;if(n==="pdf"){const o=l.type&&l.type.toLowerCase().includes("pdf")?l:new Blob([l],{type:"application/pdf"});e.state.filesPreview={...i,status:"ready",objectUrl:URL.createObjectURL(o)}}else{const o=l.size>Ft,f=await(o?l.slice(0,Ft):l).text();if(e.state.filesPreviewSeq!==s)return;e.state.filesPreview={...i,status:"ready",text:f,truncated:o}}$.event("files.preview",{path:a.path,kind:n})}catch(l){if(e.state.filesPreviewSeq!==s)return;e.state.filesPreview={...i,status:"error",error:l instanceof Error?l.message:"Could not open file"}}e.render()}function zs(e){const t=e.state.filesPreview;if(!t)return"";let a;if(t.status==="loading")a='<p class="muted" style="margin:0">Loading preview…</p>';else if(t.status==="error")a=`<p class="flash flash-error" style="margin:0">${d(t.error||"Could not open file")}</p>`;else if(t.kind==="image"){const n=h.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <img class="files-preview-img" src="${d(n)}" alt="${d(t.name)}" decoding="async" />
    </div>`}else if(t.kind==="pdf"&&t.objectUrl)a=`<iframe class="files-preview-frame" title="${d(t.name)}" src="${d(t.objectUrl)}" type="application/pdf"></iframe>`;else if(t.kind==="audio"){const n=h.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${d(n)}"></audio>
    </div>`}else if(t.kind==="video"){const n=h.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${d(n)}"></video>
    </div>`}else t.kind==="text"?a=`${t.truncated?`<p class="muted small files-preview-truncated">Showing the first ${d(z(Ft))} of this file.</p>`:""}<pre class="files-preview-text">${d(t.text||"")}</pre>`:a=`<p style="margin:0">This file type cannot be previewed in the browser. Download it to open with another app.</p>
      <p class="muted small" style="margin:0.75rem 0 0">${d(t.name)} · ${d(z(t.size))}</p>`;return U({id:"files-preview-modal",title:t.name,titleId:"files-preview-title",closeAction:"files-preview-close",size:"wide",cardClassName:"files-preview-card",className:"files-preview-modal",body:a,footer:[{label:"Download",action:"files-preview-download",variant:"ghost"},{label:"Close",action:"files-preview-close",variant:"primary"}]})}function ae(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function Ws(e){ae(e),e.state.filesUploadMenuDocClick=a=>{var s;const n=a.target;(s=n==null?void 0:n.closest)!=null&&s.call(n,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,ae(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function ke(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function Js(e){ke(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){ke(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},ve(e,e.state.filesUploadProgress)},1e3)}function Aa(e){ke(e),e.state.filesUploadProgress=null,e.render()}function Fa(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function ve(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const a=e.root.querySelector(".files-upload-progress-bar"),n=e.root.querySelector(".files-upload-progress-track"),s=e.root.querySelector("[data-files-upload-status]"),i=e.root.querySelector("[data-files-upload-current]"),r=Fa(e,t),l=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${K(t.elapsedSec)}`:(s==null?void 0:s.textContent)||"";s&&t.phase==="uploading"&&(s.textContent=l),i&&t.phase==="uploading"&&(i.textContent=t.currentName||"",i.title=t.currentName||""),a&&r!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${r}%`),n&&r!==null&&(n.setAttribute("aria-valuenow",String(r)),n.removeAttribute("aria-valuetext"))}function He(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,a=t.phase==="uploading",n=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",s=Fa(e,t),i=s===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",r=s!==null?` style="width:${s}%"`:"";let l="";if(a){const c=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${s!==null?` (${s}%)`:""} · ${K(t.elapsedSec)}`,f=t.bytesTotal>0?`${tt(t.bytesSent)} / ${tt(t.bytesTotal)}`:"";l=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${f?` · <span class="muted">${d(f)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${s!==null?`aria-valuenow="${s}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${i}"${r}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${d(c)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${d(t.currentName)}">${d(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")l=`
      ${Y("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${d(K(t.elapsedSec))}</p>`;else{const c=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(f=>`<li>${d(f)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
      ${Y("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${c}
      <p class="muted small" style="margin:0.75rem 0 0">After ${d(K(t.elapsedSec))}</p>`}const o=a?'<p class="muted small" style="margin:0">Please wait…</p>':Mt([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return U({title:n,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:a,lockBackdrop:a,body:l,footer:o})}async function sa(e,t,a,n){const s=a.replace(/\\/g,"/").split("/").map(r=>r.trim()).filter(Boolean);let i=t;for(const r of s){const l=Sa(i,r);if(n.has(l)){i=l;continue}try{await h.filesMkdir(i,r),$.event("files.mkdir",{path:i,name:r,via:"upload-folder"})}catch(o){if(!(o instanceof I&&o.status===409))throw o}n.add(l),i=l}}function Ys(e,t){var n;const a=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(n=e.root.querySelector(a))==null||n.click()}async function na(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,ae(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,j(e),e.state.filesMkdirOpen=!1,R(e);const a=t==="files"?Us:Is;try{const n=await a();if(n.kind==="cancel"){e.render();return}if(n.kind==="items"){if(n.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await _t(e,n.items);return}e.render(),requestAnimationFrame(()=>{Ys(e,t)})}catch(n){e.setFlash("error",n instanceof Error?n.message:"Could not open picker"),e.render()}}function ut(e,t){return`${e}\0${t}`}function Gs(e,t){return t.map(a=>{const n=a.file,s=(a.relativePath||n.name).replace(/\\/g,"/"),i=s.split("/").filter(Boolean),r=i.pop()||n.name,l=i.join("/"),o=Sa(e,l);return{item:a,file:n,fileName:r,parentPath:o,displayName:s||r,relDir:l}})}function Qs(e){const t=new Set,a=[];for(const n of e){const s=ut(n.parentPath,n.fileName);t.has(s)||(t.add(s),a.push(n))}return a}async function Xs(e,t){if(t.length===0)return[];const a=new Map;for(const s of t){const i=a.get(s.parentPath)??[];i.push(s),a.set(s.parentPath,i)}const n=[];for(const[s,i]of a){let r=new Map;try{const l=await h.filesList(s);r=new Map;for(const o of l.entries)(o.type==="file"||o.type==="dir")&&r.set(o.name,o.type)}catch{r=new Map}for(const l of i)r.has(l.fileName)&&n.push(l)}return n.sort((s,i)=>s.displayName.localeCompare(i.displayName)),n}const Lt=new WeakMap;function wt(e){e&&(Lt.delete(e.state),e.state.filesUploadConflict=null)}function Qe(e,t){var f;const a=Lt.get(e.state),n=e.state.filesUploadConflict;if(t==="cancel"){wt(e),e.setFlash("info","Upload cancelled"),e.render();return}if(!a){e.state.filesUploadConflict=null,e.setFlash("error","Upload session expired — drop or choose the files again"),e.render();return}const s=new Set(((f=n==null?void 0:n.conflictKeys)!=null&&f.length?n.conflictKeys:a.conflictKeys)??[]);let i=a.planned,r=new Set,l=0;if(t==="overwrite")r=new Set(s);else{const m=[];for(const u of a.planned){const b=ut(u.parentPath,u.fileName);s.has(b)?l+=1:m.push(u)}if(i=m,$.event("files.upload.skip_existing",{skipped:l,remaining:i.length,total:a.planned.length,conflictKeys:s.size}),i.length===0&&a.emptyDirs.length===0){wt(e),e.setFlash("info",l===1?"Nothing to upload — the selected file already exists":`Nothing to upload — all ${l} selected files already exist`),e.render();return}}const o=a.destBase,c=a.emptyDirs;wt(e),Ua(e,i,c,o,r)}async function _t(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,ae(e),e.state.filesUploadDropActive=!1,R(e);const a=t.filter(r=>r.file&&!r.isEmptyDir),n=t.filter(r=>r.isEmptyDir&&r.relativePath),s=e.state.filesPath,i=Qs(Gs(s,a));if($.event("files.upload.plan",{destBase:s||"/",files:i.length,emptyDirs:n.length,sample:i.slice(0,5).map(r=>({display:r.displayName,parent:r.parentPath||"/",name:r.fileName}))}),i.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await Xs(s,i);if(r.length>0){const l=r.map(o=>ut(o.parentPath,o.fileName));Lt.set(e.state,{planned:i,emptyDirs:n,destBase:s,conflictKeys:l}),e.state.filesUploadConflict={names:r.map(o=>o.displayName),totalFiles:i.length,conflictCount:r.length,conflictKeys:l},$.event("files.upload.conflicts",{total:i.length,conflicts:r.length,names:r.slice(0,12).map(o=>o.displayName)}),e.state.busy=!1,e.render();return}}catch(r){e.state.busy=!1,e.setFlash("error",r instanceof Error?r.message:"Could not check existing files"),e.render();return}}await Ua(e,i,n,s,new Set)}async function Ua(e,t,a,n,s){var b,y;const i=t.reduce((p,w)=>p+(w.file.size||0),0),r=Date.now(),l=t.length+a.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((b=t[0])==null?void 0:b.displayName)||((y=a[0])==null?void 0:y.relativePath)||"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),Js(e),e.render();let o=0;const c=[],f=new Set;let m=0,u=0;try{for(const k of a){const S=k.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(S){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:S+"/",elapsedSec:Math.floor((Date.now()-r)/1e3)},ve(e,e.state.filesUploadProgress));try{await sa(e,n,S,f)}catch(v){c.push(`${S}/: ${v instanceof Error?v.message:"failed"}`)}}}for(const k of t){const{file:S,fileName:v,parentPath:g,displayName:D,relDir:P}=k;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:D,bytesSent:m,elapsedSec:Math.floor((Date.now()-r)/1e3)},ve(e,e.state.filesUploadProgress));try{P&&await sa(e,n,P,f);const F=s.has(ut(g,v));await h.filesUpload(g,S,{replace:F,onProgress:(O,_)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const E=_>0?_:S.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:D,bytesSent:m+Math.min(O,E||O),elapsedSec:Math.floor((Date.now()-r)/1e3)},ve(e,e.state.filesUploadProgress)}}),$.event("files.upload",{path:g,name:v,size:S.size,relativePath:D,replace:F}),o+=1,F&&(u+=1),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m},ve(e,e.state.filesUploadProgress))}catch(F){const O=`${D}: ${F instanceof Error?F.message:"failed"}`;c.push(O),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m,errorSamples:c.slice(0,12)},ve(e,e.state.filesUploadProgress))}}await te(e),ke(e);const p=Math.floor((Date.now()-r)/1e3),w=t.length;if(o>0&&c.length===0){let k=o===1?"Uploaded 1 file":`Uploaded ${o} files`;u>0&&(k+=u===1?" (1 overwritten)":` (${u} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(w,1),completedFiles:o,failedFiles:0,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:p,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else if(o>0){const k=`Uploaded ${o}; ${c.length} failed. ${c[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(w,1),completedFiles:o,failedFiles:c.length,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:p,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("info",k)}else if(l>0&&c.length===0&&a.length>0){const k=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:r,elapsedSec:p,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else{const k=c[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(w,1),completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:p,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("error",k)}}catch(p){ke(e);const w=p instanceof Error?p.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:o,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:i,bytesSent:m,startedAt:r,elapsedSec:Math.floor((Date.now()-r)/1e3),resultMessage:w,errorSamples:c.length?c.slice(0,12):[w]},e.setFlash("error",w)}finally{e.state.busy=!1,e.render()}}function ra(e,t,a){const n=t.files;if(!n||n.length===0)return;const s=Ca(n,a);t.value="",_t(e,s)}function Zs(e,t){const a=t?t.split("/").filter(Boolean):[];let n="";const s=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const i of a){n=n?`${n}/${i}`:i;const r=n;s.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),s.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(r)}" ${e.state.busy?"disabled":""}>${d(i)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${s.join("")}</nav>`}function en(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${M("Files","files","h1")}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${M("Files","files","h1")}
        <p class="flash flash-error" style="margin-top:0.75rem">${d(t.error||"File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${d(t.davPath)}</span></p>
      </section>
    </div>`;const a=t.quotaBytes>0?`${z(t.usedBytes)} used · ${z(t.availableBytes)} free of ${z(t.quotaBytes)}`:`${z(t.usedBytes)} used · ${z(t.availableBytes)} free (no app quota)`,n=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,s=e.state.checkedFilePaths.length,i=e.state.filesEntries.length>0&&e.state.filesEntries.every(v=>e.state.checkedFilePaths.includes(v.path)),r=s>0,l=e.state.filesEntries.filter(v=>v.type==="dir").length,o=e.state.filesEntries.length-l,c=s>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
          <span class="muted small">${s} selected</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>
        </div>`:"",f=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const v=[];l>0&&v.push(`${l} folder${l===1?"":"s"}`),o>0&&v.push(`${o} file${o===1?"":"s"}`);const g=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return v.length===2?`${g} · ${v.join(", ")}`:v[0]??g})(),m=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':e.state.filesEntries.map(v=>{const g=e.state.checkedFilePaths.includes(v.path),D=v.type==="dir"?"📁":"📄",P=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${D}</span>${d(v.name)}
                  </button>`:`<button type="button" class="files-name-btn" data-action="files-preview-open" data-path="${d(v.path)}" title="View ${d(v.name)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${D}</span>${d(v.name)}
                  </button>`,F=v.type==="dir"?"—":z(v.size);return`<tr class="files-row${g?" is-checked":""}" data-path="${d(v.path)}" data-type="${v.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${d(v.path)}"
                  ${g?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${d(v.name)}" />
              </td>
              <td class="files-col-name">${P}</td>
              <td class="files-col-size mono">${F}</td>
              <td class="files-col-mtime hide-sm">${d(xs(v.mtime))}</td>
              <td class="files-col-actions">
                ${v.type==="file"?`<button type="button" class="btn btn-ghost btn-small" data-action="files-preview-open" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>View</button>
                       <a class="btn btn-ghost btn-small" href="${d(h.filesDownloadUrl(v.path))}" download="${d(v.name)}" data-action="files-download">Download</a>`:""}
                <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>Copy</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>Move</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${e.state.busy?"disabled":""}>Rename</button>
                <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${e.state.busy?"disabled":""}>Delete</button>
              </td>
            </tr>`}).join(""),u=e.state.filesRenamePath!==null?(()=>{const v=e.state.filesEntries.find(D=>D.path===e.state.filesRenamePath),g=(v==null?void 0:v.name)??"";return U({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${d(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${d(g)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",b=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const v=e.state.filesDeletePaths,g=v.length>1,D=e.state.filesEntries.find(O=>O.path===v[0]),P=g?`Delete ${v.length} items`:`Delete ${(D==null?void 0:D.type)==="dir"?"folder":"file"}`,F=g?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${v.slice(0,12).map(O=>{const _=e.state.filesEntries.find(E=>E.path===O);return`<li><span class="mono">${d((_==null?void 0:_.name)??O)}</span></li>`}).join("")}
                 ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${d((D==null?void 0:D.name)??v[0])}</strong>?${(D==null?void 0:D.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return U({id:"files-delete-modal",title:P,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:F,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",y=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const v=e.state.filesTransfer.op,g=e.state.filesTransfer.paths,D=g.length>1,P=e.state.filesEntries.find(x=>x.path===g[0]),F=(P==null?void 0:P.name)??Ne(g[0]),O=D?`${v==="copy"?"Copy":"Move"} ${g.length} items`:`${v==="copy"?"Copy":"Move"} ${(P==null?void 0:P.type)==="dir"?"folder":"file"}`,_=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,E=ct(e,e.state.filesTransferDest,g);return U({id:"files-transfer-modal",title:O,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${D?`<p class="muted small" style="margin:0 0 0.75rem">${g.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${d(F)}</span></p>`}
                  <input type="hidden" name="toPath" value="${d(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${d(_)}">${d(_)}</span>
                    </div>
                    ${Ts(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${D?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${d(F)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${v==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:v==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||E}]})})():"",p=e.state.filesMkdirOpen?U({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",w=e.state.filesUploadConflict?(()=>{const v=e.state.filesUploadConflict,g=v.conflictCount,D=Math.max(0,v.totalFiles-g),P=g===1?"1 file already exists in the destination.":`${g} of ${v.totalFiles} files already exist in the destination.`,F=D>0?D===1?" Skip existing keeps the other 1 new file.":` Skip existing keeps the other ${D} new files.`:" Skip existing cancels the upload (nothing new to send).",O=v.names.slice(0,12).map(E=>`<li><span class="mono">${d(E)}</span></li>`).join(""),_=v.names.length>12?`<li class="muted">…and ${v.names.length-12} more</li>`:"";return U({id:"files-upload-conflict-modal",title:g===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${d(P)}${d(F)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${O}
                ${_}
              </ul>
              <p class="muted small" style="margin:0">
                Replace the existing files, skip only those listed above, or cancel the whole upload.
              </p>`,footer:[{label:"Cancel",action:"files-upload-conflict-cancel",variant:"ghost"},{label:"Skip existing",action:"files-upload-conflict-skip",variant:"ghost"},{label:g===1?"Overwrite":"Overwrite all",action:"files-upload-conflict-overwrite",variant:"primary"}]})})():"",k=e.state.filesPath===""?"Home":e.state.filesPath,S=`<div class="files-upload-menu${e.state.filesUploadMenuOpen?" is-open":""}">
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
        </div>
        <input type="file" data-action="files-upload-pick-files" ${e.state.busy?"disabled":""} multiple hidden />
        <input type="file" data-action="files-upload-pick-folder" ${e.state.busy?"disabled":""}
          multiple webkitdirectory directory hidden />`;return`<div class="portal-grid portal-grid-files">
    <section class="card files-panel${e.state.filesUploadDropActive?" is-dragover":""}" data-files-drop-target>
      <div class="files-drop-overlay" aria-hidden="true">
        <div class="files-drop-overlay-inner">
          <p class="files-drop-overlay-title">Drop to upload</p>
          <p class="muted small mono">${d(k)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${M("Files","files","h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${n}%"></div>
          </div>
          <span>${d(a)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${Zs(e,e.state.filesPath)}
        <div class="files-toolbar-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${e.state.busy||e.state.filesLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${e.state.busy?"disabled":""}>New folder</button>
          ${S}
        </div>
      </div>
      ${c}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${i?"checked":""}
                  ${r&&!i?"data-indeterminate=1":""}
                  ${e.state.busy||e.state.filesEntries.length===0?"disabled":""}
                  aria-label="Select all in this folder" />
              </th>
              <th class="files-col-name">Name</th>
              <th class="files-col-size">Size</th>
              <th class="files-col-mtime hide-sm">Modified</th>
              <th class="files-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${e.state.filesLoading&&e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':m}
          </tbody>
        </table>
      </div>
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${s>0?`${s} of ${e.state.filesEntries.length} selected`:d(f)}
      </div>
    </section>
    ${u}
    ${b}
    ${y}
    ${p}
    ${w}
    ${zs(e)}
  </div>`}async function tn(e,t){const a=new FormData(t),n=String(a.get("path")??""),s=String(a.get("newName")??"").trim();if(!n||!s){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await h.filesRename(n,s),$.event("files.rename",{path:n,newName:s}),e.state.filesRenamePath=null,await te(e),e.setFlash("success",`Renamed to “${s}”`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function an(e,t){const a=new FormData(t),n=String(a.get("name")??"").trim();if(!n){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await h.filesMkdir(e.state.filesPath,n),$.event("files.mkdir",{path:e.state.filesPath,name:n}),e.state.filesMkdirOpen=!1,await te(e),e.setFlash("success",`Created folder “${n}”`)}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function sn(e,t,a,n){const{state:s}=e;if(t==="files-upload-menu-toggle")return s.busy||s.filesUploadProgress||(s.filesUploadMenuOpen=!s.filesUploadMenuOpen,s.filesUploadMenuOpen&&(s.filesRenamePath=null,s.filesDeletePaths=null,j(e),s.filesMkdirOpen=!1),e.render()),!0;if(t==="files-upload-files")return na(e,"files"),!0;if(t==="files-upload-folder")return na(e,"folder"),!0;if(t==="files-nav"){const i=a.dataset.path??"";s.filesPath=i,s.filesRenamePath=null,s.filesDeletePaths=null,s.filesTransfer=null,s.filesMkdirOpen=!1,R(e),s.checkedFilePaths=[],s.busy=!0,e.clearFlash(),e.render();try{await te(e)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Failed to open folder")}finally{s.busy=!1,e.render()}return!0}if(t==="files-toggle"){n.stopPropagation();const i=a.dataset.path??"";return i&&(a.checked?s.checkedFilePaths.includes(i)||(s.checkedFilePaths=[...s.checkedFilePaths,i]):s.checkedFilePaths=s.checkedFilePaths.filter(l=>l!==i),e.render()),!0}if(t==="files-select-all"){n.stopPropagation();const i=a.checked;return s.checkedFilePaths=i?s.filesEntries.map(r=>r.path):[],e.render(),!0}if(t==="files-copy"){const i=a.dataset.path??"";return i&&(R(e),Ve(e,"copy",[i])),!0}if(t==="files-move"){const i=a.dataset.path??"";return i&&(R(e),Ve(e,"move",[i])),!0}if(t==="files-bulk-copy")return s.checkedFilePaths.length===0||(R(e),Ve(e,"copy",[...s.checkedFilePaths])),!0;if(t==="files-bulk-move")return s.checkedFilePaths.length===0||(R(e),Ve(e,"move",[...s.checkedFilePaths])),!0;if(t==="files-tree-select"){if(n.preventDefault(),n.stopPropagation(),!s.filesTransfer)return!0;const i=a.dataset.path??"";return ct(e,i,s.filesTransfer.paths)||(s.filesTransferDest=i,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(n.preventDefault(),n.stopPropagation(),!s.filesTransfer)return!0;const i=a.dataset.path??"";if(t==="files-tree-retry"){const l={...s.filesTreeChildren};return delete l[i],s.filesTreeChildren=l,s.filesTreeExpanded.includes(i)||(s.filesTreeExpanded=[...s.filesTreeExpanded,i]),Pt(e,i),!0}return s.filesTreeExpanded.includes(i)?(s.filesTreeExpanded=s.filesTreeExpanded.filter(l=>l!==i),e.render()):(s.filesTreeExpanded=[...s.filesTreeExpanded,i],Pt(e,i)),!0}if(t==="files-transfer-close")return j(e),e.render(),!0;if(t==="files-bulk-delete")return s.checkedFilePaths.length===0||(s.filesDeletePaths=[...s.checkedFilePaths],s.filesRenamePath=null,j(e),R(e),e.render()),!0;if(t==="files-refresh"){s.busy=!0,e.clearFlash(),e.render();try{await te(e),e.setFlash("success","Refreshed")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Refresh failed")}finally{s.busy=!1,e.render()}return!0}if(t==="files-mkdir")return s.filesMkdirOpen=!0,s.filesUploadMenuOpen=!1,ae(e),s.filesUploadDropActive=!1,s.filesRenamePath=null,s.filesDeletePaths=null,j(e),R(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return s.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open")return s.filesRenamePath=a.dataset.path??null,s.filesDeletePaths=null,j(e),s.filesUploadMenuOpen=!1,ae(e),R(e),e.render(),!0;if(t==="files-rename-close")return s.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const i=a.dataset.path??"";return s.filesDeletePaths=i?[i]:null,s.filesRenamePath=null,j(e),s.filesUploadMenuOpen=!1,ae(e),R(e),e.render(),!0}if(t==="files-delete-close")return s.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const i=s.filesDeletePaths?[...s.filesDeletePaths]:[];if(i.length===0)return!0;s.busy=!0,e.clearFlash(),e.render();try{if(i.length===1)await h.filesDelete(i[0]),$.event("files.delete",{path:i[0]}),e.setFlash("success","Deleted");else{const r=await h.filesBulk("delete",i);$.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?e.setFlash("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?e.setFlash("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):e.setFlash("error",r.errors[0]||"Delete failed")}s.filesDeletePaths=null,s.checkedFilePaths=[],await te(e)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Delete failed")}finally{s.busy=!1,e.render()}return!0}if(t==="files-download")return $.event("files.download",{path:a.getAttribute("href")??""}),!0;if(t==="files-preview-open"){const i=a.dataset.path??"";return i&&Ks(e,i),!0}if(t==="files-preview-close")return R(e),e.render(),!0;if(t==="files-preview-download"){const i=s.filesPreview;if(!i)return!0;const r=document.createElement("a");return r.href=h.filesDownloadUrl(i.path),r.download=i.name,r.rel="noopener",document.body.appendChild(r),r.click(),r.remove(),$.event("files.download",{path:i.path,via:"preview"}),!0}return t==="close-files-upload-progress"?(s.filesUploadProgress&&(s.filesUploadProgress.phase==="done"||s.filesUploadProgress.phase==="error")&&Aa(e),!0):t==="files-upload-conflict-cancel"?(Qe(e,"cancel"),!0):t==="files-upload-conflict-skip"?(Qe(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(Qe(e,"overwrite"),!0):!1}function Ia(e){const{root:t}=e;t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(a=>{a.indeterminate=!0})}function nn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function re(e,t){var n;const a=(n=e.state.adminCapabilities)==null?void 0:n.pages;return a?a.find(s=>s.id===t)??null:null}function Se(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Re(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function rn(e){var i;const t=["overview","settings","users","database"],a={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},n=(i=e.state.adminCapabilities)==null?void 0:i.pages,s=new Map;if(n)for(const r of n)nn(r.id)&&s.set(r.id,r);return t.map(r=>{const l=s.get(r),o=(l==null?void 0:l.label)||a[r],c=(l==null?void 0:l.status)??(r==="overview"?"read-only":"full"),f=(l==null?void 0:l.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===r?" is-active":""}${f?" is-gated":""}"
          data-action="admin-page" data-admin-page="${r}"
          aria-selected="${e.state.adminPage===r}"
          title="${d(o)}${f?" — "+Se(e,c):""}">
          ${d(o)}
        </button>`}).join("")}function mt(e,t){const a=re(e,t),n=(a==null?void 0:a.status)??"coming-soon",s=(a==null?void 0:a.label)??t,i=(a==null?void 0:a.summary)||"This area is not available in portal Administration yet.",r=Se(e,n);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Re(e,n)}">${d(r)}</span>
      <h2 class="admin-coming-soon-title">${d(s)}</h2>
    </div>
    <p class="muted">${d(i)}</p>
  </section>`}function De(e,t,a,n){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${d(String(a))}</div>
    <div class="admin-stat-label">${d(t)}</div>
    ${n?`<div class="admin-stat-hint muted small">${d(n)}</div>`:""}
  </div>`}function oe(e,t,a){return`<span class="badge ${t?"badge-ok":"badge-off"}">${d(a)}: ${t?"On":"Off"}</span>`}function de(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function Ut(e){var t;e.state.adminCapabilitiesError=null;try{const a=await h.adminCapabilities();e.state.adminCapabilities=a.data,$.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(a){e.state.adminCapabilitiesError=a instanceof Error?a.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},$.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function at(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await h.adminDashboard();e.state.adminDashboard=t.data,$.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function me(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await h.adminUsers();e.state.adminUsers=t.users??[],$.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function J(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const a=await h.adminUser(t);e.state.adminUserDetail=a.user,e.state.adminSelectedUsername=a.user.username,$.debug("admin.user",{username:a.user.username})}catch(a){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=a instanceof Error?a.message:"Failed to load user",a}finally{e.state.adminUserDetailLoading=!1}}async function fe(e,t){e.state.adminUserResourcesLoading=!0;try{const[a,n]=await Promise.all([h.adminUserCalendars(t),h.adminUserAddressBooks(t)]);e.state.adminUserCalendars=a.calendars??[],e.state.adminUserAddressBooks=n.addressbooks??[]}catch(a){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],a}finally{e.state.adminUserResourcesLoading=!1}}async function st(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await h.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function nt(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await h.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const a=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=a==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function ln(e){var i;const t=re(e,"overview");if(t&&t.available===!1)return mt(e,"overview");const a=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${d(((i=e.state.user)==null?void 0:i.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let n="",s="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)s='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)s=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${d(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const r=e.state.adminDashboard,l=r.services,o=r.links??{},c=t?`<span class="badge ${Re(e,t.status)}">${d(Se(e,t.status))}</span>`:"",f=r.version?d(r.version):"—",m=r.git?d(r.git):"";n=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${M("About this system","admin-overview")}
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
                  <tr><td>Administration</td><td>${de(e,l.administration!==!1&&l.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${de(e,!!l.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${de(e,!!l.carddav)}</td></tr>
                  <tr><td>Files</td><td>${de(e,!!l.files)}</td></tr>
                  <tr><td>Tasks</td><td>${de(e,!!l.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${de(e,!!l.notes)}</td></tr>
                  <tr><td>Push</td><td>${de(e,!!l.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${a}
      </section>`;const u=r.nbusers??r.users,b=r.nbcalendars??r.calendars,y=r.nbevents??r.events,p=r.nbbooks??r.addressBooks,w=r.nbcontacts??r.contacts;s=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${De(e,"Registered users",u,"Users")}
          ${De(e,"Calendars",b,"CalDAV")}
          ${De(e,"Events",y,"CalDAV")}
          ${De(e,"Address books",p,"CardDAV")}
          ${De(e,"Contacts",w,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${oe(e,l.administration!==!1&&l.webAdmin!==!1,"Administration")}
          ${oe(e,!!l.caldav,"CalDAV")}
          ${oe(e,!!l.carddav,"CardDAV")}
          ${oe(e,!!l.files,"Files")}
          ${oe(e,!!l.tasks,"Tasks")}
          ${oe(e,!!l.notes,"Notes")}
          ${oe(e,!!l.push,"Push")}
        </div>
      </section>`}else s=`<section class="card">
      ${M("System snapshot","admin-overview")}
      ${a}
    </section>`;return`${n}
    ${s}`}function on(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(a=>a.username.toLowerCase().includes(t)||(a.displayname||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)):e.state.adminUsers}function dn(e){return e.state.adminUserCreateOpen?U({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function cn(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return U({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function un(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,a=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(s=>s.username.toLowerCase()===t.toLowerCase())??null,n=a?`${a.displayname||a.username} (${a.username})`:t;return U({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${d(n)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${dt({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${d(t)}"`}]})}function mn(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
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
      </tr>`).join(""),n=e.state.adminUserResourcesLoading&&e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':e.state.adminUserAddressBooks.map(c=>`<tr>
        <td class="mono">${d(c.uri)}</td>
        <td>${d(c.displayname)}</td>
        <td class="hide-sm">${d(String(c.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${c.id}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${c.id}" data-label="${d(c.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),s=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(c=>c.instanceId===e.state.adminCalEditId)??null:null,i=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(c=>c.id===e.state.adminAbEditId)??null:null,r=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&s?U({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
          <input type="hidden" name="instanceId" value="${s?s.instanceId:""}" />
          ${e.state.adminCalModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${e.state.busy?"disabled":""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${d(s.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${d((s==null?void 0:s.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${d((s==null?void 0:s.description)??"")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${d((s==null?void 0:s.calendarcolor)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${s!=null&&s.todos||e.state.adminCalModal==="create"?"checked":""} ${e.state.busy?"disabled":""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${s!=null&&s.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",l=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&i?U({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${i?i.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${d(i.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${d((i==null?void 0:i.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${d((i==null?void 0:i.description)??"")}</textarea>
          </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",o=e.state.adminResourceDelete?U({title:`Delete ${e.state.adminResourceDelete.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
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
        <tbody>${n}</tbody>
      </table>
    </div>
  </section>
  ${r}${l}${o}`}function fn(e){const t=re(e,"users");if(t&&t.available===!1)return mt(e,"users");const a=on(e),n=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':a.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?d(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:a.map(s=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===s.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${d(s.username)}" tabindex="0" role="button">
                <td class="mono">${d(s.username)}</td>
                <td class="hide-sm">${d(s.displayname||"—")}</td>
                <td class="hide-sm">${d(s.email||"—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${d(s.username)}" ${e.state.busy?"disabled":""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${d(s.username)}" ${e.state.busy?"disabled":""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${d(s.username)}" ${e.state.busy?"disabled":""}>Delete</button>
                </td>
              </tr>`).join("");return`
    <section class="card">
      <div class="section-header">
        ${M("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Re(e,t.status)}">${d(Se(e,t.status))}</span>`:""}
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
          <tbody>${n}</tbody>
        </table>
      </div>
    </section>
    ${mn(e)}
    ${dn(e)}
    ${cn(e)}
    ${un(e)}`}async function pn(e,t){const a=new FormData(t),n=String(a.get("username")??"").trim(),s=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!n||!s||!i||!r){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const o=await h.adminCreateUser({username:n,displayname:s,email:i,password:r,passwordConfirm:l});$.event("admin.user.create",{username:o.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=o.user.username,e.state.adminUserDetail=o.user,e.persistTab("admin","users",o.user.username),await me(e),e.setFlash("success",`Created user “${o.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function bn(e,t){const a=new FormData(t),n=String(a.get("username")??"").trim(),s=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!n){e.setFlash("error","Username is required"),e.render();return}if(!s||!i){e.setFlash("error","Display name and email are required"),e.render();return}if(r!==""||l!==""){if(r===""||l===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const o={displayname:s,email:i};r!==""&&(o.password=r,o.passwordConfirm=l);const c=await h.adminUpdateUser(n,o);$.event("admin.user.update",{username:c.user.username,passwordChanged:r!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=c.user,e.state.adminSelectedUsername=c.user.username,await me(e),e.setFlash("success",r!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function gn(e,t){var c,f;if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,n=new FormData(t),s=String(n.get("displayname")??"").trim(),i=String(n.get("description")??"").trim(),r=String(n.get("calendarcolor")??"").trim(),l=((c=t.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,o=((f=t.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const m=String(n.get("uri")??"").trim().toLowerCase();await h.adminCreateUserCalendar(a,{uri:m,displayname:s,description:i,calendarcolor:r||void 0,todos:l,notes:o}),e.setFlash("success",`Created calendar “${s}”`)}else{const m=Number(n.get("instanceId"));await h.adminUpdateUserCalendar(a,m,{displayname:s,description:i,calendarcolor:r,todos:l,notes:o}),e.setFlash("success",`Updated calendar “${s}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await fe(e,a),await J(e,a)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function yn(e,t){if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,n=new FormData(t),s=String(n.get("displayname")??"").trim(),i=String(n.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const r=String(n.get("uri")??"").trim().toLowerCase();await h.adminCreateUserAddressBook(a,{uri:r,displayname:s,description:i}),e.setFlash("success",`Created address book “${s}”`)}else{const r=Number(n.get("id"));await h.adminUpdateUserAddressBook(a,r,{displayname:s,description:i}),e.setFlash("success",`Updated address book “${s}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await fe(e,a),await J(e,a)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const vn=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let ye=null;function $n(){if(ye)return ye;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return ye=[...t].sort((a,n)=>a.localeCompare(n)),ye}}catch{}return ye=[...vn],ye}function Oa(e){const t=e||"UTC",a=$n(),n=a.includes(t),s=a.map(i=>`<option value="${ia(i)}" ${i===t?"selected":""}>${la(i)}</option>`);return!n&&t&&s.unshift(`<option value="${ia(t)}" selected>${la(t)}</option>`),s.join("")}function ia(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function la(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function wn(e){const t=re(e,"settings");if(t&&t.available===!1)return mt(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const a=e.state.adminSystemSettings;if(!a)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const n=(i,r,l)=>`<label class="check-row"><input type="checkbox" name="${d(i)}" ${r?"checked":""} ${e.state.busy||a.writable===!1?"disabled":""} /> ${d(l)}</label>`,s=(i,r,l,o="")=>`<label>${d(l)}
      <input type="number" name="${d(i)}" value="${d(String(r??0))}" ${e.state.busy||a.writable===!1?"disabled":""} />
      ${o?`<span class="muted small">${d(o)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${M("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Re(e,t.status)}">${d(Se(e,t.status))}</span>`:""}
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
        ${n("cal_enabled",!!a.cal_enabled,"Enable CalDAV")}
        ${n("card_enabled",!!a.card_enabled,"Enable CardDAV")}
        ${n("tasks_enabled",!!a.tasks_enabled,"Enable Tasks (VTODO)")}
        ${n("notes_enabled",!!a.notes_enabled,"Enable Notes (VJOURNAL)")}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["Digest","Basic","Apache"].map(i=>`<option value="${i}" ${a.dav_auth_type===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||a.writable===!1?"disabled":""}>
            ${Oa(a.timezone||"UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${d(a.invite_from||"")}" placeholder="noreply@example.com" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${n("files_enabled",!!a.files_enabled,"Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${d(a.files_storage_path||"")}" placeholder="empty = Specific/files" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        ${s("files_max_upload_mb",a.files_max_upload_mb,"Max file size (MB)")}
        ${s("files_quota_mb",a.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
        ${s("files_quarantine_days",a.files_quarantine_days,"Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${s("session_max_age_minutes",a.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(a.portal_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        ${n("portal_admin_ui_enabled",a.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${d(Array.isArray(a.portal_admin_users)?a.portal_admin_users.join(", "):String(a.portal_admin_users||""))}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${n("push_enabled",!!a.push_enabled,"Enable WebDAV-Push")}
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
    ${kn(e)}`}function kn(e){return e.state.adminResetModalOpen?U({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${dt({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${d(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function hn(e,t){const a=new FormData(t),n=l=>{var o;return!!((o=t.querySelector(`input[name="${l}"]`))!=null&&o.checked)},s={cal_enabled:n("cal_enabled"),card_enabled:n("card_enabled"),tasks_enabled:n("tasks_enabled"),notes_enabled:n("notes_enabled"),files_enabled:n("files_enabled"),push_enabled:n("push_enabled"),portal_admin_ui_enabled:n("portal_admin_ui_enabled"),timezone:String(a.get("timezone")??"").trim(),invite_from:String(a.get("invite_from")??"").trim(),dav_auth_type:String(a.get("dav_auth_type")??"Digest"),files_storage_path:String(a.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(a.get("files_max_upload_mb")??0),files_quota_mb:Number(a.get("files_quota_mb")??0),files_quarantine_days:Number(a.get("files_quarantine_days")??0),session_max_age_minutes:Number(a.get("session_max_age_minutes")??15),portal_log_level:String(a.get("portal_log_level")??"off"),portal_admin_users:String(a.get("portal_admin_users")??"").trim(),push_external_url:String(a.get("push_external_url")??"").trim(),push_log_level:String(a.get("push_log_level")??"off")},i=String(a.get("admin_password")??""),r=String(a.get("admin_password_confirm")??"");(i!==""||r!=="")&&(s.admin_password=i,s.admin_password_confirm=r),e.state.busy=!0,e.clearFlash(),e.render();try{const l=await h.adminUpdateSystemSettings(s);e.state.adminSystemSettings=l.data;const o=l.data;e.state.portalUi={...e.state.portalUi,services:{caldav:!!o.cal_enabled,carddav:!!o.card_enabled,tasks:!!o.tasks_enabled,notes:!!o.notes_enabled,files:!!o.files_enabled}},$.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function Ma(e,t){const a=new FormData(t),n=String(a.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",s={backend:n};return n==="sqlite"?s.sqlite_file=String(a.get("sqlite_file")??"").trim():(s.pgsql_host=String(a.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(a.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(a.get("pgsql_username")??"").trim(),s.pgsql_password=String(a.get("pgsql_password")??"")),s}function Sn(e,t){e.state.adminDbPendingBody=Ma(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function Dn(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const a=Ma(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const n=await h.adminTestDatabaseConnection(a);e.setFlash("success",n.message||"Connection successful"),$.event("admin.database.test",{backend:n.backend})}catch(n){e.setFlash("error",n instanceof Error?n.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function Cn(e){const t=re(e,"database");if(t&&t.available===!1)return mt(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const a=e.state.adminDatabaseSettings;if(!a)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const n=e.state.adminDbFormBackend,s=a.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${M("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Re(e,t.status)}">${d(Se(e,t.status))}</span>`:""}
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
      ${s?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${e.state.busy||s?"disabled":""}>
            <option value="sqlite" ${n==="sqlite"?"selected":""}>SQLite</option>
            <option value="pgsql" ${n==="pgsql"?"selected":""}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${n==="sqlite"?"":"display:none"}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${d(a.sqlite_file||"")}" ${e.state.busy||s?"disabled":""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${n==="pgsql"?"":"display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${d(a.pgsql_host||"")}" placeholder="localhost:5432" ${e.state.busy||s?"disabled":""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${d(a.pgsql_dbname||"")}" ${e.state.busy||s?"disabled":""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${d(a.pgsql_username||"")}" autocomplete="off" ${e.state.busy||s?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${a.hasPassword?"Leave blank to keep current":""}" ${e.state.busy||s?"disabled":""} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${e.state.busy||s?"disabled":""}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${e.state.busy||s?"disabled":""}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${Tn(e)}`}function Tn(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return U({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${d(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function Na(e,t,a={}){if(!e.userIsAdmin()){await e.activateTab("calendars",a);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):a.username!==void 0&&(e.state.adminSelectedUsername=a.username,a.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),$.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),a.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await Ut(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const n=re(e,t);t==="overview"&&(n==null?void 0:n.available)!==!1?await at(e):t==="users"&&(n==null?void 0:n.available)!==!1?(await me(e),e.state.adminSelectedUsername&&(await J(e,e.state.adminSelectedUsername),await fe(e,e.state.adminSelectedUsername))):t==="settings"&&(n==null?void 0:n.available)!==!1?await st(e):t==="database"&&(n==null?void 0:n.available)!==!1&&await nt(e)}catch(n){$.warn("admin page load failed",n instanceof Error?n.message:n),e.setFlash("error",n instanceof Error?n.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function En(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?fn(e):e.state.adminPage==="settings"?wn(e):e.state.adminPage==="database"?Cn(e):ln(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function Pn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function An(e,t,a,n){var s,i;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const r=Pn(a.dataset.adminPage);return r&&await Na(e,r),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await at(e),e.setFlash("success","Overview refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await me(e),e.state.adminSelectedUsername&&await J(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const r=a.dataset.username??"";if(!r||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{await J(e,r),await fe(e,r)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";if(!r)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==r.toLowerCase())&&await J(e,r),e.state.adminUserEditOpen=!0}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";return r&&(e.state.adminUserDeleteUsername=r,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const r=a;return e.state.adminUserDeleteConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminUserDeleteUsername??"";if(!r||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await h.adminDeleteUser(r,!0),$.event("admin.user.delete",{username:r}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((s=e.state.adminSelectedUsername)==null?void 0:s.toLowerCase())===r.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await me(e),e.setFlash("success",`Deleted user “${r}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(a.dataset.id),label:a.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(a.dataset.id),label:a.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((i=e.state.adminResourceDelete)==null?void 0:i.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!a.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const r=e.state.adminSelectedUsername,l=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{l.kind==="calendar"?await h.adminDeleteUserCalendar(r,l.id,!0):await h.adminDeleteUserAddressBook(r,l.id,!0,!!l.force),e.state.adminResourceDelete=null,await fe(e,r),await J(e,r),e.setFlash("success","Deleted")}catch(o){e.setFlash("error",o instanceof Error?o.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await st(e),e.setFlash("success","Settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const r=a;return e.state.adminResetConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=a.value;const r=e.root.querySelector('[data-action="admin-reset-confirm"]');return r&&(r.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r=await h.adminResetToDefault(!0,e.state.adminResetPassword);$.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const l=r.redirectUrl&&r.redirectUrl.startsWith("/")?r.redirectUrl:"/portal/install/";return window.location.assign(l),!0}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await nt(e),e.setFlash("success","Database settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const r=a;return e.state.adminDbFormBackend=r.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const r=a.closest("form");return Dn(e,r),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const r=a;e.state.adminDbConfirmText=r.value,e.render();const l=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const o=l.value.length;l.setSelectionRange(o,o)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r={...e.state.adminDbPendingBody,confirm:"CONFIRM"},l=await h.adminUpdateDatabaseSettings(r);e.state.adminDatabaseSettings=l.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const o=(l.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=o==="pgsql"?"pgsql":"sqlite",$.event("admin.database.save",{backend:l.data.backend}),e.setFlash("success","Database settings saved")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function N(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${n}`}function Fn(e,t){const a=new Date(e,t,1),n=new Date(e,t+1,0);return{from:N(a),to:N(n)}}function It(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,n,s]=e.split("-").map(Number);return new Date(a,n-1,s)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,n,s]=e.slice(0,10).split("-").map(Number);return new Date(a,(n||1)-1,s||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Un(e){const t=It(e.start);if(!e.end)return[N(t)];let a=It(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[N(t)];const n=[],s=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(a.getFullYear(),a.getMonth(),a.getDate());let r=0;for(;s<=i&&r++<370;)n.push(N(s)),s.setDate(s.getDate()+1);return n.length?n:[N(t)]}function we(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):N(t)}function In(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const a=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(a.hourCycle==="h23"||a.hourCycle==="h24")return!1;if(a.hourCycle==="h11"||a.hourCycle==="h12")return!0;if(typeof a.hour12=="boolean")return a.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function Rt(e){return In(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function qt(e){var n;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(n=navigator.languages)!=null&&n.length?navigator.languages:[],navigator.language].filter(Boolean);for(const s of t)try{const i=new Intl.Locale(s),r=typeof i.getWeekInfo=="function"?i.getWeekInfo():i.weekInfo,l=r==null?void 0:r.firstDay;if(typeof l=="number")return l===7?0:l}catch{}const a=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(a)?0:1}function xa(e){const t=qt(e),a=new Date(2024,0,7+t),n=[];for(let s=0;s<7;s++){const i=new Date(a);i.setDate(a.getDate()+s),n.push(i.toLocaleDateString(void 0,{weekday:"short"}))}return n}function La(e,t=15){const a=t*60*1e3,n=e.getTime();return n%a===0?new Date(n):new Date(Math.ceil(n/a)*a)}function Z(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function On(e,t,a){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const s=e.slice(0,10),[i,r,l]=s.split("-").map(Number);return new Date(i,r-1,l).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const n=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(n.getTime())?e:n.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Rt(a)})}function $e(e){if(!e){const a=La(new Date);return{date:N(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:N(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Ie(e){const t=new Date,a=N(t);if(e&&e!==a){const[i,r,l]=e.split("-").map(Number),o=new Date(i,r-1,l,9,0,0,0),c=new Date(i,r-1,l,10,0,0,0);return{start:Z(o),end:Z(c)}}const n=La(t,15),s=new Date(n.getTime()+3600*1e3);return{start:Z(n),end:Z(s)}}function Mn(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Bt(e,t){const a=e.slice(0,10),n=(t||a).slice(0,10);if(a===n){const u=Ie(a);return{start:u.start,end:u.end}}const[s,i,r]=a.split("-").map(Number),[l,o,c]=n.split("-").map(Number),f=Z(new Date(s,i-1,r,9,0,0,0)),m=Z(new Date(l,o-1,c,17,0,0,0));return{start:f,end:m}}function Nn(e,t){const a=we(e);let n=t?we(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const s=new Date(t);if(!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getTime()>new Date(e).getTime()){const i=It(t);i.setDate(i.getDate()-1),n=N(i)}}return{start:a,end:n}}function he(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function xn(e){const{field:t,value:a,dateOnly:n,allowClear:s,viewY:i,viewM:r,weekStart:l,timeFormat:o}=e,c=$e(a),f=qt(l),m=xa(l),b=(new Date(i,r,1).getDay()-f+7)%7,y=new Date(i,r+1,0).getDate(),p=new Date(i,r,0).getDate(),w=c.date,k=c.hm,S=[],v=Math.ceil((b+y)/7)*7;for(let E=0;E<v;E++){let x,H,le=!1;E<b?(x=p-b+E+1,H=new Date(i,r-1,x),le=!0):E>=b+y?(x=E-(b+y)+1,H=new Date(i,r+1,x),le=!0):(x=E-b+1,H=new Date(i,r,x));const pe=N(H),be=pe===w,qe=pe===N(new Date);S.push(`<button type="button" class="dt-day${le?" is-outside":""}${be?" is-selected":""}${qe?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${d(pe)}">${x}</button>`)}const g=new Date().getFullYear(),D=Math.min(1900,i),P=Math.max(g+30,i),F=Array.from({length:12},(E,x)=>{const H=new Date(2e3,x,1).toLocaleString(void 0,{month:"short"});return`<option value="${x}" ${x===r?"selected":""}>${d(H)}</option>`}).join(""),O=[];for(let E=D;E<=P;E++)O.push(`<option value="${E}" ${E===i?"selected":""}>${E}</option>`);const _=n?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Mn().map(E=>{const x=(()=>{const[H,le]=E.split(":").map(Number);return new Date(2e3,0,1,H,le).toLocaleTimeString(void 0,Rt(o))})();return`<button type="button" class="dt-time${E===k?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${E}" role="option" aria-selected="${E===k}">${d(x)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${n?"":" and time"}">
      <div class="dt-popover-inner${n?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${d(t)}" aria-label="Month">${F}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${d(t)}" aria-label="Year">${O.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${m.map(E=>`<span class="dt-dow">${d(E)}</span>`).join("")}</div>
          <div class="dt-days">${S.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(t)}" ${s?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${_}
      </div>
    </div>`}function Ln(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const a=t.querySelector(".dt-trigger"),n=t.querySelector(".dt-popover");if(!a||!n)return;const s=a.getBoundingClientRect(),i=8;n.style.position="fixed",n.style.visibility="hidden",n.style.top="0",n.style.left="0";const r=n.offsetWidth||320,l=n.offsetHeight||300;let o=s.bottom+6;o+l>window.innerHeight-i&&(o=Math.max(i,s.top-l-6));let c=s.left;c+r>window.innerWidth-i&&(c=Math.max(i,window.innerWidth-r-i)),c<i&&(c=i),n.style.top=`${Math.round(o)}px`,n.style.left=`${Math.round(c)}px`,n.style.right="auto",n.style.visibility="visible",n.style.zIndex="200"})}function _a(e){return`${os}:${e}`}function _n(e){if(!e)return null;try{const t=localStorage.getItem(_a(e));if(t==null||t==="")return null;const a=JSON.parse(t);if(!a||typeof a!="object")return null;const n=a;let s=[];Array.isArray(n.ids)&&(s=n.ids.map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>0).map(r=>Math.floor(r)));let i=null;if(n.selectedId===null||n.selectedId===void 0)i=null;else{const r=Number(n.selectedId);i=Number.isFinite(r)&&r>0?Math.floor(r):null}return{ids:s,selectedId:i}}catch{return null}}function rt(e){var a;const t=(a=e.user)==null?void 0:a.username;if(t)try{const n={ids:e.selectedIds.slice(),selectedId:e.selectedId};localStorage.setItem(_a(t),JSON.stringify(n))}catch{}}async function Vt(e,t){const a=await h.shares(t);e.state.shares=a.shares}function Rn(e){const t=e.state.calendars.filter(n=>n.canShare);if(t.length===0)return null;const a=n=>{const s=n.uri.toLowerCase(),i=n.displayname.toLowerCase();return s==="default"||i==="default"||i==="default calendar"};return t.find(a)??t[0]??null}async function ft(e){const t=e.state.selectedIds.filter(s=>e.state.calendars.some(i=>i.id===s));if(t.length===0){e.state.monthEvents=[];return}const{from:a,to:n}=Fn(e.state.monthCursor.y,e.state.monthCursor.m);e.state.monthEventsLoading=!0,$.debug("loadMonthEvents",{selectedIds:t,from:a,to:n});try{const i=(await Promise.all(t.map(async r=>(await h.calendarEvents(r,a,n)).events.map(o=>({...o,instanceId:r}))))).flat();i.sort((r,l)=>{const o=r.start||"",c=l.start||"";return o!==c?o<c?-1:1:(r.summary||"").localeCompare(l.summary||"")}),e.state.monthEvents=i,$.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:a,to:n})}catch(s){e.state.monthEvents=[],$.warn("loadMonthEvents failed",s instanceof Error?s.message:s)}finally{e.state.monthEventsLoading=!1}}function qn(e,t){const a=e.state.calendars.find(n=>n.id===t);return a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6"}function Bn(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(a=>a!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t),rt(e.state)}function Vn(e,t,a){return new Date(t,a,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Hn(e,t){const a=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return a;const n=new Date(t.start);return Number.isNaN(n.getTime())?a:`${n.toLocaleTimeString(void 0,e.timeFormatOpts())} ${a}`}function jn(e){const t=e.state.calendars.filter(S=>e.state.selectedIds.includes(S.id)),a=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,n=e.state.monthCursor.y,s=e.state.monthCursor.m,i=new Date(n,s,1),r=e.localeWeekStart(),l=(i.getDay()-r+7)%7,o=new Date(n,s+1,0).getDate(),c=new Date(n,s,0).getDate(),m=N(new Date),u=e.localeDowLabels(),b=new Map;for(const S of e.state.monthEvents)for(const v of Un(S)){const g=b.get(v)??[];g.push(S),b.set(v,g)}const y=[],p=Math.ceil((l+o)/7)*7;for(let S=0;S<p;S++){let v,g=!0,D;S<l?(v=c-l+S+1,g=!1,D=new Date(n,s-1,v)):S>=l+o?(v=S-(l+o)+1,g=!1,D=new Date(n,s+1,v)):(v=S-l+1,D=new Date(n,s,v));const P=N(D),F=P===m,O=g?b.get(P)??[]:[],_=e.state.monthExpandDay===P?50:3,E=O.slice(0,_),x=O.length-E.length,H=E.map(ge=>{var Yt;const bt=ge.instanceId,gt=Hn(e,ge),Qa=qn(e,bt),Jt=((Yt=e.state.calendars.find(Za=>Za.id===bt))==null?void 0:Yt.displayname)||"",Xa=Jt?`${gt} · ${Jt}`:gt;return`<button type="button" class="month-event${ge.allDay?"":" is-timed"}" title="${d(Xa)}" style="--ev-color:${d(Qa)}"
          data-action="open-event" data-instance="${bt}" data-uri="${d(ge.uri)}" ${e.state.busy?"disabled":""}>${d(gt)}</button>`}).join(""),le=x>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(P)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${x} more</button>`:"",pe=!g&&(v===1||S===l+o)?D.toLocaleString(void 0,{month:"short",day:"numeric"}):String(v),be=e.state.selectedId!==null?e.state.calendars.find(ge=>ge.id===e.state.selectedId)??null:null,qe=!!(be&&!be.readOnly&&(be.canShare||be.access==="readwrite"));y.push(`<div class="month-cell${g?"":" is-outside"}${F?" is-today":""}${qe?" is-clickable":""}"${qe?` data-action="new-event-day" data-day="${d(P)}" role="button" tabindex="0" title="Add event on ${d(P)}"`:""}>
      <div class="month-daynum${F?" is-today-num":""}">${d(pe)}</div>
      <div class="month-events">${H}${le}</div>
    </div>`)}const w=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",k=t.slice(0,6).map(S=>{const v=S.color&&S.color.length>=7?S.color.slice(0,7):S.color||"#3B82F6";return`<span class="cal-swatch" style="background:${d(v)};margin-top:0" title="${d(S.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
    <div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${d(Vn(e,n,s))}</h2>
      <span class="month-cal-name muted small" title="${d(a)}">
        ${k}
        ${d(a)}
      </span>
    </div>
    ${w}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${u.map(S=>`<div class="month-dow">${d(S)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${y.join("")}
      </div>
    </div>
  </section>`}function Ht(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Kn(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function _e(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),n=String(e.get("repeatEndMode")??"never"),s=n==="until"||n==="count"?n:"never";let i=null,r=null;if(s==="until"){const o=String(e.get("repeatUntil")??"").trim();i=o?o.slice(0,10):null}else if(s==="count"){const o=Number(e.get("repeatCount")??0);r=Number.isFinite(o)&&o>0?Math.min(999,Math.round(o)):10}const l=e.getAll("repeatByDay").map(o=>String(o).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:i,count:r,byDay:l,endMode:s}}function zn(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,a=t.repeat??Ht(),n=(a.freq||"").toUpperCase(),s=e.state.calendars.filter(y=>y.canShare||y.access==="readwrite"),i=e.state.calendars.filter(y=>y.id===t.instanceId?!0:y.readOnly?!1:y.canShare||y.access==="readwrite").map(y=>`<option value="${y.id}" ${y.id===t.instanceId?"selected":""}>${d(y.displayname)}</option>`).join(""),r=t.readOnly||!t.canWrite;let l,o;if(t.allDay)l=we(t.start),o=we(t.end);else{const y=t.start||"",p=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(y)){const w=Bt(y,p||null);l=w.start,o=w.end||""}else l=he(t.start),o=he(t.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((a.byDay||[]).map(y=>y.toUpperCase())),m=Kn(a),u=!!n&&m==="until",b=a.until||(m==="until"?we(t.start)||N(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${e.state.creatingEvent?"New event":"Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${e.renderFlashBanner()}
        ${!e.state.creatingEvent&&(t.hasRrule||n)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
        ${r?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${r||s.length===0?"disabled":""}>
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
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:o,dateOnly:t.allDay,disabled:r||u,allowClear:!u})}
          </div>
          <fieldset class="event-repeat" ${r?"disabled":""}>
            <legend class="event-repeat-legend">Repeat</legend>
            <div class="form-grid form-grid-2">
              <label>Frequency
                <select name="repeatFreq" data-action="event-repeat-freq">
                  <option value="" ${n?"":"selected"}>Does not repeat</option>
                  <option value="DAILY" ${n==="DAILY"?"selected":""}>Daily</option>
                  <option value="WEEKLY" ${n==="WEEKLY"?"selected":""}>Weekly</option>
                  <option value="MONTHLY" ${n==="MONTHLY"?"selected":""}>Monthly</option>
                  <option value="YEARLY" ${n==="YEARLY"?"selected":""}>Yearly</option>
                </select>
              </label>
              <label>Every
                <input type="number" name="repeatInterval" min="1" max="99" value="${d(String(a.interval||1))}" ${n?"":"disabled"} />
              </label>
            </div>
            ${n==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${c.map(y=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${y.code}" ${f.has(y.code)?"checked":""} />
                            ${y.label}
                          </label>`).join("")}
                  </div>`:""}
            ${n?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${m==="never"?"selected":""}>Never</option>
                        <option value="until" ${m==="until"?"selected":""}>On date</option>
                        <option value="count" ${m==="count"?"selected":""}>After count</option>
                      </select>
                    </label>
                    ${m==="until"?e.renderPortalDateTimeField({field:"until",name:"repeatUntil",label:"Until",value:b,dateOnly:!0,disabled:r,allowClear:!0}):m==="count"?`<label>Occurrences
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
  </div>`}function Wn(e,t,a){const n=e.state.calendars.find(s=>s.id===a);return{uri:"",instanceId:a,calendarId:(n==null?void 0:n.calendarId)??0,calendarName:(n==null?void 0:n.displayname)??"Calendar",calendarUri:(n==null?void 0:n.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:Ht(),readOnly:!1,canWrite:!0}}function Jn(e,t){if(!e.state.editingEvent)return;const a=new FormData(t),n=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(a.get("summary")??e.state.editingEvent.summary),description:String(a.get("description")??e.state.editingEvent.description),location:String(a.get("location")??e.state.editingEvent.location),instanceId:Number(a.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(n==null?void 0:n.checked)??e.state.editingEvent.allDay,start:String(a.get("start")??e.state.editingEvent.start??""),end:String(a.get("end")??e.state.editingEvent.end??"")||null,repeat:_e(a),hasRrule:!!String(a.get("repeatFreq")??"").trim()}}function se(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function Ra(e){se(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){se(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&Ba(e,e.state.importProgress)},1e3)}function Oe(e,t,a={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...a},e.render())}function Yn(e){se(e),e.state.importProgress=null,e.render()}function qa(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Ba(e,e.state.importProgress))}function Ba(e,t){const a=e.root.querySelector("[data-import-status-line]"),n=e.root.querySelector(".import-progress-bar"),s=e.root.querySelector(".import-progress-track"),i=e.root.querySelector("[data-import-counts]"),r=t.kind==="calendar"?"items":"contacts";let l;if(t.phase==="processing"&&t.processTotal>0)l=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${r} (${t.processPercent??0}%) · ${K(t.elapsedSec)}`;else if(t.phase==="processing")l=`Importing on server… ${K(t.elapsedSec)}`;else return;a&&(a.textContent=l),i&&(i.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),n&&t.processPercent!==null&&(n.classList.remove("is-indeterminate"),n.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),s&&t.processPercent!==null&&(s.setAttribute("aria-valuenow",String(t.processPercent)),s.removeAttribute("aria-valuetext"))}function je(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,a=t.phase!=="done"&&t.phase!=="error",n=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",s=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",i=(()=>{const o=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return o.map((m,u)=>{let b="pending";return t.phase==="done"||u<f?b="done":u===f&&(b=(t.phase==="error","active")),`<li class="import-step import-step-${b}"><span class="import-step-icon" aria-hidden="true">${b==="done"?"✓":b==="active"?"●":"○"}</span> ${d(m.label)}</li>`}).join("")})();let r="";if(a){let o=null;t.phase==="reading"&&t.readPercent!==null?o=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(o=Math.min(100,Math.max(0,t.processPercent)));const c=o===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=o!==null?` style="width:${o}%"`:"",m=t.kind==="calendar"?"items":"contacts";let u;t.phase==="reading"?u=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?u="Uploading to server…":t.processTotal>0?u=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${m} (${t.processPercent??0}%) · ${K(t.elapsedSec)}`:u=`Importing on server… ${K(t.elapsedSec)}`;const b=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';r=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${d(n)}</strong> from
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
      <p class="import-status-line" data-import-status-line>${d(u)}</p>
      ${b}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?r=`
      ${Y("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · Took ${d(K(t.elapsedSec))}
      </p>`:r=`
      ${Y("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · After ${d(K(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const l=a?'<p class="muted small" style="margin:0">Please wait…</p>':Mt([{label:"Close",action:"close-import-progress",variant:"primary"}]);return U({title:s,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:a,lockBackdrop:a,body:r,footer:l})}function Va(e,t,a){return new Promise((n,s)=>{const i=new FileReader;i.onprogress=r=>{r.lengthComputable&&r.total>0?a(Math.min(100,Math.round(r.loaded/r.total*100))):a(null)},i.onload=()=>n(String(i.result??"")),i.onerror=()=>s(i.error??new Error("Failed to read file")),i.readAsText(t)})}async function Gn(e,t){var n;if(e.state.selectedId===null)return;const a=(n=t.files)==null?void 0:n[0];t.value="",a&&(e.state.calModalOpen=!0,await Ha(e,e.state.selectedId,a,{keepEditModalOpen:!0}))}async function Qn(e,t){var f;const a=(f=t.files)==null?void 0:f[0];if(t.value="",!a)return;const n=e.root.querySelector('[data-form="create-cal"]'),s=n?new FormData(n):new FormData,i=s.get("holidays")==="on",r=s.get("readOnly")==="on";if(i){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(r){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let l=String(s.get("displayname")??"").trim();l||(l=a.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const o=String(s.get("description")??""),c=String(s.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const m=await h.createCalendar({displayname:l,description:o,color:c,readOnly:!1});e.state.selectedId=m.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${m.calendar.displayname}” — importing…`),await Ha(e,m.calendar.id,a,{keepEditModalOpen:!1,successPrefix:`Calendar “${m.calendar.displayname}” created. `})}catch(m){const u=m instanceof Error?m.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",u),e.state.busy=!1,e.render()}}async function Ha(e,t,a,n={}){e.state.busy=!0,e.clearFlash(),se(e),e.state.importProgress={kind:"calendar",fileName:a.name,fileSizeLabel:tt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ra(e),e.render();try{const s=await Va(e,a,l=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:l};const o=e.root.querySelector(".import-progress-bar"),c=e.root.querySelector("[data-import-status-line]");o&&l!==null&&(o.classList.remove("is-indeterminate"),o.style.width=`${l}%`),c&&l!==null&&(c.textContent=`Reading file… ${l}%`)});Oe(e,"uploading",{readPercent:100}),Oe(e,"processing",{processPercent:0}),$.event("import.calendar.start",{file:a.name,bytes:a.size,calId:t});const i=await h.importCalendar(t,s,l=>{qa(e,l)}),r=e.formatImportResult(i);e.state.selectedId===t&&await ft(e),se(e),Oe(e,"done",{ok:!0,resultMessage:`${r} (from “${a.name}”)`}),e.setFlash("success",`${n.successPrefix||""}Import finished for “${a.name}”: ${r}.`)}catch(s){const i=s instanceof Error?s.message:"Import failed";se(e),Oe(e,"error",{ok:!1,resultMessage:i}),e.setFlash("error",i)}finally{n.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function Xn(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),n=String(a.get("username")??"").trim(),s=String(a.get("access")??"read");if(!n){e.setFlash("error","Select a user to share with"),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await h.share(e.state.selectedId,n,s),await Vt(e,e.state.selectedId),e.setFlash("success",`Shared with ${n}`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function Zn(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),i=String(a.get("location")??"").trim(),r=a.get("allDay")==="on",l=String(a.get("start")??"").trim(),o=String(a.get("end")??"").trim(),c=Number(a.get("instanceId"))||e.state.editingEvent.instanceId,f=_e(a);if(!n){e.setFlash("error","Title is required"),e.render();return}if(!l){e.setFlash("error","Start is required"),e.render();return}let m,u;if(r)m=l.slice(0,10),u=o?o.slice(0,10):m;else if(/^\d{4}-\d{2}-\d{2}$/.test(l)){const w=Bt(l,o||null);m=new Date(w.start).toISOString(),u=w.end?new Date(w.end).toISOString():null}else m=new Date(l).toISOString(),u=o?new Date(o).toISOString():null;const b=e.state.editingEvent.instanceId,y=e.state.editingEvent.uri,p=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),$.event(p?"event.create":"event.update",{instanceId:c,uri:p?null:y,allDay:r,summary:n});try{const w={summary:n,description:s,location:i,allDay:r,start:m,end:u,instanceId:c,repeat:f},k=p?await h.createEvent(c,w):await h.updateEvent(b,y,w);(e.state.selectedId===null||k.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=k.event.instanceId),await ft(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,$.event(p?"event.created":"event.saved",{uri:k.event.uri,instanceId:k.event.instanceId}),e.setFlash("success",ne("Event",k.event.summary||n,p?"created":"saved"))}catch(w){$.warn("event.save failed",w instanceof Error?w.message:w),e.setFlash("error",w instanceof Error?w.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function er(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??""),i=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const r=await h.updateCalendar(e.state.selectedId,{displayname:n,description:s,color:i});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=r.calendar.id,await Vt(e,e.state.selectedId),await ft(e),e.setFlash("success","Calendar updated")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function tr(e,t){const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??""),i=String(a.get("color")??"").trim(),r=a.get("holidays")==="on",l=String(a.get("holidayCountry")??"").trim(),o=a.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,r&&!l){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!r&&!n){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const c=await h.createCalendar({displayname:n,description:s,color:i,holidays:r,holidayCountry:r?l:void 0,readOnly:o});e.state.selectedId=c.calendar.id,e.state.selectedIds.includes(c.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,c.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let f=`Created “${c.calendar.displayname}”`;const m=c.holidayImport??c.calendar.holidayImport;m&&(f+=`. Holidays imported: ${e.formatImportResult(m)}.`),o&&(f+=" Calendar is read-only."),e.setFlash("success",f)}catch(c){e.state.createCalModalOpen=!0,e.setFlash("error",c instanceof Error?c.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function ja(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const a=t.querySelector('input[name="holidays"]'),n=t.querySelector("#holidays-country-wrap"),s=t.querySelector('input[name="displayname"]'),i=t.querySelector('input[name="readOnly"]');if(!a||!n)return;const r=a.checked;n.hidden=!r,s&&(s.required=!r,r&&!s.value.trim()?s.placeholder="Auto: Holidays (XX)":r||(s.placeholder="Work")),r&&i&&(i.checked=!0)}function ar(e){ja(e)}function oa(e){const{state:t}=e,a=t.calendars.filter(p=>p.canShare),n=t.calendars.filter(p=>!p.canShare),s=t.calendars.find(p=>p.id===t.selectedId)??null,i=a.map(p=>{const w=t.selectedIds.includes(p.id),k=w?" is-selected":"",S=p.id===t.selectedId?" is-primary":"",v=p.color?`<span class="cal-swatch" style="background:${d(p.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=e.accessBadge(p.access)+(p.readOnly?'<span class="badge">read-only</span>':"")+(p.holidaysCountry?`<span class="badge badge-admin">holidays ${d(p.holidaysCountry)}</span>`:"");return`<div class="cal-row${k}${S}" data-action="select-cal" data-id="${p.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${p.id}" ${w?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(p.displayname)}</span>
          <span class="cal-row-badges">${g}</span>
          <span class="muted small mono cal-row-uri">${d(p.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${p.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${p.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${p.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),r=n.map(p=>{const w=t.selectedIds.includes(p.id),k=w?" is-selected":"",S=p.id===t.selectedId?" is-primary":"",v=p.color?`<span class="cal-swatch" style="background:${d(p.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=p.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${k}${S}" data-action="select-cal" data-id="${p.id}" role="button" tabindex="0" title="${d(g)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${p.id}" ${w?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(p.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(p.access)}</span>
          <span class="muted small">${p.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${p.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),l=t.directory.map(p=>`<option value="${d(p.username)}">${d(p.displayname)} (${d(p.username)})</option>`).join(""),o=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(p=>`<tr>
              <td>
                <strong>${d(p.displayname||p.username||p.href)}</strong>
                <div class="muted small mono">${d(p.username||p.href)}</div>
              </td>
              <td>${e.accessBadge(p.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${d(p.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),c=s!=null&&s.color&&s.color.length>=7?s.color.slice(0,7):"#3B82F6",f=!!(s&&s.readOnly),m=t.calModalOpen&&s&&s.canShare?U({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${d(s.uri)}
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
                      value="${d(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${d(c)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${d(s.color||c)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${d(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${d(s.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${M(`Share “${s.displayname}”`,"share")}
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
                ${M("Import / export","import-export")}
                ${s.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||s.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||s.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",u=t.deleteConfirmId!==null?t.calendars.find(p=>p.id===t.deleteConfirmId&&p.canShare)??null:null,b=u?U({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(u.displayname)}</strong>
              <span class="muted small mono">(${d(u.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${dt({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${u.id}"`}]}):"",y=t.createCalModalOpen?U({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
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
                  ${t.holidayCountries.map(p=>`<option value="${d(p.code)}">${d(p.name)} (${d(p.code)})</option>`).join("")}
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
            ${M("Owned","owned")}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${i||'<p class="muted">No calendars yet. Create one below.</p>'}
            ${n.length?`<div class="calendars-shared-block">
                     ${M("Shared with me","shared-with-me")}
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
    ${y}
    ${m}
    ${b}
    ${e.renderEventModal()}`}function Me(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const a=new FormData(t);e.state.editingContact.firstname=String(a.get("firstname")??""),e.state.editingContact.lastname=String(a.get("lastname")??""),e.state.editingContact.fullname=String(a.get("fullname")??""),e.state.editingContact.org=String(a.get("org")??""),e.state.editingContact.title=String(a.get("title")??""),e.state.editingContact.url=String(a.get("url")??""),e.state.editingContact.note=String(a.get("note")??"");const n=String(a.get("birthday")??"").trim();e.state.editingContact.birthday=n&&/^\d{4}-\d{2}-\d{2}/.test(n)?n.slice(0,10):null,e.state.editingContact.address={street:String(a.get("street")??""),city:String(a.get("city")??""),region:String(a.get("region")??""),postal:String(a.get("postal")??""),country:String(a.get("country")??"")};const s=[];let i=0;for(;a.has(`email_${i}`);)s.push(String(a.get(`email_${i}`)??"")),i++;s.length&&(e.state.editingContact.emails=s);const r=[];for(i=0;a.has(`phone_value_${i}`);)r.push({type:String(a.get(`phone_type_${i}`)??"other"),value:String(a.get(`phone_value_${i}`)??"")}),i++;r.length&&(e.state.editingContact.phones=r);const l=[];for(i=0;a.has(`custom_label_${i}`)||a.has(`custom_value_${i}`);)l.push({label:String(a.get(`custom_label_${i}`)??""),value:String(a.get(`custom_value_${i}`)??"")}),i++;e.state.editingContact.custom=l}function sr(e,t){const a=new FormData(t),n=[];let s=0;for(;a.has(`email_${s}`);){const o=String(a.get(`email_${s}`)??"").trim();o&&n.push(o),s++}const i=[];for(s=0;a.has(`phone_value_${s}`);){const o=String(a.get(`phone_value_${s}`)??"").trim();o&&i.push({type:String(a.get(`phone_type_${s}`)??"other"),value:o}),s++}const r=[];for(s=0;a.has(`custom_label_${s}`)||a.has(`custom_value_${s}`);){const o=String(a.get(`custom_label_${s}`)??"").trim(),c=String(a.get(`custom_value_${s}`)??"").trim();(o||c)&&r.push({label:o,value:c}),s++}const l={firstname:String(a.get("firstname")??"").trim(),lastname:String(a.get("lastname")??"").trim(),fullname:String(a.get("fullname")??"").trim(),org:String(a.get("org")??"").trim(),title:String(a.get("title")??"").trim(),emails:n,phones:i,address:{street:String(a.get("street")??"").trim(),city:String(a.get("city")??"").trim(),region:String(a.get("region")??"").trim(),postal:String(a.get("postal")??"").trim(),country:String(a.get("country")??"").trim()},url:String(a.get("url")??"").trim(),note:String(a.get("note")??"").trim(),birthday:(()=>{const o=String(a.get("birthday")??"").trim();return o&&/^\d{4}-\d{2}-\d{2}/.test(o)?o.slice(0,10):null})(),custom:r};return e.state.removePhotoPending?l.removePhoto=!0:e.state.photoBase64Pending&&(l.photoBase64=e.state.photoBase64Pending),l}function Q(e){const{state:t,root:a}=e,n=a.querySelector('[data-form="edit-event"]');n&&t.editingEvent&&e.syncEditingEventFromForm(n);const s=a.querySelector('[data-form="task"]');s&&t.editingTask&&e.syncEditingTaskFromForm(s);const i=a.querySelector('[data-form="note"]');i&&t.editingNote&&e.syncEditingNoteFromForm(i),t.editingContact&&Me(e.contactsHost)}async function nr(e,t,a,n){var c,f,m;const{state:s,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="toggle-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u))return!0;n.stopPropagation(),e.toggleCalendarSelected(u),s.calendarSelectionSeeded=!0,s.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(b){l("error",b instanceof Error?b.message:"Failed to load calendar")}finally{s.busy=!1,r()}return!0}if(t==="select-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u))return!0;s.selectedIds.includes(u)||(s.selectedIds=[...s.selectedIds,u]),s.selectedId=u,s.calendarSelectionSeeded=!0,rt(s),s.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(b){l("error",b instanceof Error?b.message:"Failed to load calendar")}finally{s.busy=!1,r()}return!0}if(t==="edit-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u)||!s.calendars.find(y=>y.id===u&&y.canShare))return!0;s.selectedId=u,s.selectedIds.includes(u)||(s.selectedIds=[...s.selectedIds,u]),rt(s),s.calModalOpen=!0,s.deleteConfirmId=null,s.busy=!0,o(),r();try{await e.loadShares(u),await e.loadMonthEvents()}catch(y){l("error",y instanceof Error?y.message:"Failed to open calendar")}finally{s.busy=!1,r()}return!0}if(t==="close-cal-modal")return s.calModalOpen=!1,r(),!0;if(t==="open-create-cal-modal")return s.createCalModalOpen=!0,s.calModalOpen=!1,s.deleteConfirmId=null,o(),r(),!0;if(t==="close-create-cal-modal")return s.createCalModalOpen=!1,o(),r(),!0;if(t==="delete-cal"){const u=Number(a.dataset.id);return!Number.isFinite(u)||!s.calendars.find(y=>y.id===u&&y.canShare)||(s.deleteConfirmId=u,s.calModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-cal")return s.deleteConfirmId=null,r(),!0;if(t==="confirm-delete-cal"){const u=Number(a.dataset.id),b=i.querySelector("#delete-cal-confirm");if(!Number.isFinite(u)||!(b!=null&&b.checked))return!0;s.busy=!0,o(),r();try{if(await h.deleteCalendar(u),s.selectedId===u&&(s.selectedId=null),s.selectedIds=s.selectedIds.filter(y=>y!==u),s.deleteConfirmId=null,s.calModalOpen=!1,s.shares=[],s.monthEvents=[],await e.loadHome(),s.selectedId===null){const y=e.pickDefaultCalendar();y?(s.selectedId=y.id,s.selectedIds.includes(y.id)||(s.selectedIds=[...s.selectedIds,y.id]),await e.loadMonthEvents()):s.selectedIds.length>0&&(s.selectedId=s.selectedIds[0],await e.loadMonthEvents())}l("success","Calendar deleted")}catch(y){l("error",y instanceof Error?y.message:"Delete failed")}finally{s.busy=!1,r()}return!0}if(t==="month-today"){const u=new Date;s.monthCursor={y:u.getFullYear(),m:u.getMonth()},s.monthExpandDay=null,s.busy=!0,r();try{await e.loadMonthEvents()}finally{s.busy=!1,r()}return!0}if(t==="month-prev"||t==="month-next"){const u=t==="month-prev"?-1:1,b=new Date(s.monthCursor.y,s.monthCursor.m+u,1);s.monthCursor={y:b.getFullYear(),m:b.getMonth()},s.monthExpandDay=null,s.busy=!0,r();try{await e.loadMonthEvents()}finally{s.busy=!1,r()}return!0}if(t==="open-event"){n.stopPropagation();const u=Number(a.dataset.instance),b=a.dataset.uri??"";if(!Number.isFinite(u)||!b)return!0;s.busy=!0,o(),r();try{const y=await h.getEvent(u,b);s.editingEvent={...y.event,repeat:y.event.repeat??e.defaultRepeat()},s.creatingEvent=!1,s.eventModalOpen=!0,s.eventDtPicker=null,s.calModalOpen=!1,s.deleteConfirmId=null}catch(y){l("error",y instanceof Error?y.message:"Failed to open event")}finally{s.busy=!1,r()}return!0}if(t==="open-event-day"){n.stopPropagation();const u=a.dataset.day??"";return s.monthExpandDay=s.monthExpandDay===u?null:u,r(),!0}if(t==="new-event-day"){const u=n.target;if((c=u==null?void 0:u.closest)!=null&&c.call(u,".month-event, .month-event-more"))return!0;const b=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;if(s.selectedId===null)return l("error","Select a calendar first"),r(),!0;const y=s.calendars.find(p=>p.id===s.selectedId);return!y||y.readOnly||!(y.canShare||y.access==="readwrite")?(l("error","This calendar is read-only"),r(),!0):(s.creatingEvent=!0,s.editingEvent=e.blankEventForDay(b,s.selectedId),s.eventModalOpen=!0,s.eventDtPicker=null,s.calModalOpen=!1,s.deleteConfirmId=null,o(),r(),!0)}if(t==="close-event-modal")return s.eventModalOpen=!1,s.editingEvent=null,s.creatingEvent=!1,s.eventDtPicker=null,o(),r(),!0;if(t==="dt-open"){const u=a.dataset.dtField||"";if(!u)return!0;if(Q(e),((f=s.eventDtPicker)==null?void 0:f.field)===u)s.eventDtPicker=null;else{const b=a.dataset.dtDateOnly==="1",y=a.dataset.dtClear!=="0",p=a.dataset.dtName||u;let w=e.getDtFieldCurrentValue(u);!w&&(u==="due"||u==="dtstart"||u==="bulk-due")&&(w=Ie().start);const k=$e(w||N(new Date)),[S,v]=k.date.split("-").map(Number);s.eventDtPicker={field:u,viewY:S,viewM:(v||1)-1,dateOnly:b,allowClear:y,name:p}}return r(),!0}if(t==="dt-month-prev"||t==="dt-month-next"){if(!s.eventDtPicker)return!0;Q(e);const u=t==="dt-month-prev"?-1:1,b=new Date(s.eventDtPicker.viewY,s.eventDtPicker.viewM+u,1);return s.eventDtPicker={...s.eventDtPicker,viewY:b.getFullYear(),viewM:b.getMonth()},r(),!0}if(t==="dt-set-month"){if(!s.eventDtPicker)return!0;Q(e);const b=Number(a.value);return!Number.isFinite(b)||b<0||b>11||(s.eventDtPicker={...s.eventDtPicker,viewM:b},r()),!0}if(t==="dt-set-year"){if(!s.eventDtPicker)return!0;Q(e);const b=Number(a.value);return!Number.isFinite(b)||b<1||b>9999||(s.eventDtPicker={...s.eventDtPicker,viewY:b},r()),!0}if(t==="dt-pick-day"){if(!s.eventDtPicker)return!0;const u=s.eventDtPicker.field,b=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;Q(e);const y=s.eventDtPicker.dateOnly;if(y)e.setDtFieldValue(u,b),s.eventDtPicker=null;else{const p=e.getDtFieldCurrentValue(u),w=$e(p||Ie(b).start).hm;e.setDtFieldValue(u,`${b}T${w}`),s.eventDtPicker={...s.eventDtPicker,viewY:Number(b.slice(0,4)),viewM:Number(b.slice(5,7))-1}}if(u==="start"&&s.editingEvent&&!y&&s.editingEvent.end){const p=new Date(String(s.editingEvent.start)),w=new Date(String(s.editingEvent.end));!Number.isNaN(p.getTime())&&!Number.isNaN(w.getTime())&&w<=p&&e.setDtFieldValue("end",Z(new Date(p.getTime()+3600*1e3)))}return r(),!0}if(t==="dt-pick-time"){if(!s.eventDtPicker||s.eventDtPicker.dateOnly)return!0;const u=s.eventDtPicker.field,b=a.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(b))return!0;Q(e);const y=e.getDtFieldCurrentValue(u)||Ie().start,w=`${$e(y).date}T${b}`;if(e.setDtFieldValue(u,w),u==="start"&&s.editingEvent){s.editingEvent={...s.editingEvent,allDay:!1};const k=s.editingEvent.end?$e(String(s.editingEvent.end)):null,S=new Date(w);(!k||new Date(`${k.date}T${k.hm}`)<=S)&&e.setDtFieldValue("end",Z(new Date(S.getTime()+3600*1e3)))}return s.eventDtPicker=null,r(),!0}if(t==="dt-today"){if(!s.eventDtPicker)return!0;const u=s.eventDtPicker.field;Q(e);const b=N(new Date);if(s.eventDtPicker.dateOnly)e.setDtFieldValue(u,b);else{const y=Ie(b);u==="start"?(e.setDtFieldValue("start",y.start),s.editingEvent&&!s.editingEvent.end&&e.setDtFieldValue("end",y.end)):u==="end"?e.setDtFieldValue("end",y.end):e.setDtFieldValue(u,y.start)}return s.eventDtPicker=null,r(),!0}if(t==="dt-clear"){if(!s.eventDtPicker||!s.eventDtPicker.allowClear)return!0;const u=s.eventDtPicker.field;return Q(e),e.setDtFieldValue(u,null),s.eventDtPicker=null,r(),!0}if(t==="event-allday-toggle"){if(!s.editingEvent)return!0;const u=i.querySelector('[data-form="edit-event"]'),b=a.checked;if(u){const y=new FormData(u),p=String(y.get("start")??s.editingEvent.start??""),w=String(y.get("end")??s.editingEvent.end??"")||null;let k=p,S=w;if(b){const v=Nn(p,w);k=v.start,S=v.end}else{const v=p.slice(0,10),g=(w||p).slice(0,10),D=Bt(v,g);k=D.start,S=D.end}s.editingEvent={...s.editingEvent,summary:String(y.get("summary")??s.editingEvent.summary),description:String(y.get("description")??s.editingEvent.description),location:String(y.get("location")??s.editingEvent.location),instanceId:Number(y.get("instanceId"))||s.editingEvent.instanceId,allDay:b,start:k,end:S,repeat:_e(y)}}else s.editingEvent={...s.editingEvent,allDay:b};return s.eventDtPicker=null,r(),!0}if(t==="event-repeat-freq"||t==="event-repeat-end"){if(!s.editingEvent)return!0;const u=i.querySelector('[data-form="edit-event"]');if(!u)return!0;const b=new FormData(u),y=u.querySelector('input[name="allDay"]'),p=_e(b);return s.editingEvent={...s.editingEvent,summary:String(b.get("summary")??s.editingEvent.summary),description:String(b.get("description")??s.editingEvent.description),location:String(b.get("location")??s.editingEvent.location),instanceId:Number(b.get("instanceId"))||s.editingEvent.instanceId,allDay:(y==null?void 0:y.checked)??s.editingEvent.allDay,start:String(b.get("start")??s.editingEvent.start??""),end:String(b.get("end")??s.editingEvent.end??"")||null,repeat:p,hasRrule:!!String(b.get("repeatFreq")??"").trim()},p.freq&&p.endMode==="until"&&((m=s.eventDtPicker)==null?void 0:m.field)==="end"&&(s.eventDtPicker=null),r(),!0}if(t==="delete-event"){if(!s.editingEvent||!s.editingEvent.canWrite||s.creatingEvent)return!0;const u=String(s.editingEvent.summary||"this event").trim()||"this event";return s.confirmDelete={scope:"event",title:"Delete event",message:`Delete “${u}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="revoke"){const u=a.dataset.href??"";return!u||s.selectedId===null||(s.confirmDelete={scope:"revoke-share",title:"Revoke share",message:"Revoke access for this user?",detail:"They will lose this calendar until you share it again.",href:u},r()),!0}if(t==="export-cal"){n.stopPropagation();const u=a.dataset.id,b=u!==void 0&&u!==""?Number(u):s.selectedId;if(b===null||Number.isNaN(b))return!0;s.busy=!0,o(),r();try{const{blob:y,filename:p}=await h.exportCalendar(b),w=await e.saveBlobAsFile(y,p);w==="cancelled"?l("info","Export cancelled"):w==="saved"?l("success",`Saved ${p}`):l("success",`Download started: ${p}`)}catch(y){l("error",y instanceof Error?y.message:"Export failed")}finally{s.busy=!1,r()}return!0}return!1}async function Ka(e){const t=await h.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars,e.state.selectedNoteKey!==null&&!e.state.notes.some(a=>`${a.instanceId}|${a.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function L(e,t){return`${e}|${t}`}function rr(e){const t=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(i=>{const r=L(i.instanceId,i.uri),l=!e.state.creatingNote&&r===e.state.selectedNoteKey?" is-selected":"",o=(i.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${l}" data-action="select-note" data-instance="${i.instanceId}" data-uri="${d(i.uri)}" tabindex="0" role="button">
              <td class="col-note-title">
                <span class="contact-name-primary">${d(i.summary||i.uri)}</span>
                ${o?`<span class="muted small contact-name-secondary">${d(o)}${i.description.length>80?"…":""}</span>`:""}
                ${i.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${d(Pa(i.dtstart))}</td>
              <td class="col-note-cal muted small">${d(i.calendarName)}</td>
            </tr>`}).join(""),a=e.state.editingNote,n=e.state.noteCalendars.map(i=>`<option value="${i.id}" ${a&&a.instanceId===i.id?"selected":""}>${d(i.displayname)}</option>`).join(""),s=a?`<div class="card">
          ${M(e.state.creatingNote?"New note":"Edit note","notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${e.state.creatingNote?`<label>Calendar
                    <select name="instanceId" required ${e.state.noteCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.noteCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${n}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${d(a.calendarName)}</strong>${a.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${d(a.summary)}" ${a.readOnly&&!e.state.creatingNote?"readonly":""} />
            </label>
            ${e.renderPortalDateTimeField({field:"dtstart",name:"dtstart",label:"Date",value:he(a.dtstart),dateOnly:!1,disabled:!!(a.readOnly&&!e.state.creatingNote),allowClear:!0})}
            <label>Body
              <textarea name="description" rows="8" maxlength="20000" ${a.readOnly&&!e.state.creatingNote?"readonly":""}>${d(a.description)}</textarea>
            </label>
            <div class="form-actions-row">
              ${e.state.creatingNote||a.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingNote?"Create note":"Save note"}</button>`:""}
              ${!e.state.creatingNote&&a.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingNote?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${M("Notes","notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${d(e.state.noteSearch)}" aria-label="Search notes" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-note" ${e.state.busy||e.state.noteCalendars.length===0?"disabled":""}>Add note</button>
      </div>
      ${e.state.noteCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              ${X("Title","summary",e.state.noteSort,e.state.noteOrder,"note","col-note-title")}
              ${X("Date","dtstart",e.state.noteSort,e.state.noteOrder,"note","col-note-date")}
              ${X("Calendar","calendar",e.state.noteSort,e.state.noteOrder,"note","col-note-cal")}
            </tr>
          </thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${s}
    </section>
  </div>`}function ir(e,t){if(!e.state.editingNote)return;const a=new FormData(t),n=String(a.get("dtstart")??"").trim(),s=a.get("instanceId"),i=s!==null&&String(s)!==""?Number(s):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(i)&&i>0?i:e.state.editingNote.instanceId,summary:String(a.get("summary")??e.state.editingNote.summary),description:String(a.get("description")??e.state.editingNote.description),dtstart:n?new Date(n).toISOString():null}}async function lr(e,t){const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),i=String(a.get("dtstart")??"").trim(),r=i?new Date(i).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const l=Number(a.get("instanceId"));if(!Number.isFinite(l)||l<=0)throw new Error("Select a calendar");const o=await h.createNote({instanceId:l,summary:n,description:s,dtstart:r});e.state.creatingNote=!1,e.state.selectedNoteKey=L(o.note.instanceId,o.note.uri),e.state.editingNote=o.note,e.setFlash("success",ne("Note",o.note.summary||n,"created"))}else if(e.state.editingNote){const l=await h.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:n,description:s,dtstart:r});e.state.editingNote=l.note,e.state.selectedNoteKey=L(l.note.instanceId,l.note.uri),e.setFlash("success",ne("Note",l.note.summary||n,"saved"))}await Ka(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function or(e,t,a,n){var o;const{state:s,render:i,setFlash:r,clearFlash:l}=e;if(t==="sort-note"){const c=a.dataset.sort||"";if(!c)return!0;s.noteSort===c?s.noteOrder=s.noteOrder==="asc"?"desc":"asc":(s.noteSort=c,s.noteOrder="asc"),s.busy=!0,i();try{await e.loadNotes()}catch(f){r("error",f instanceof Error?f.message:"Sort failed")}finally{s.busy=!1,i()}return!0}if(t==="select-note"){const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=s.notes.find(u=>u.instanceId===c&&u.uri===f)??null;return s.creatingNote=!1,s.selectedNoteKey=e.itemKey(c,f),s.editingNote=m?{...m}:null,l(),i(),!0}if(t==="new-note")return s.creatingNote=!0,s.selectedNoteKey=null,s.editingNote={uri:"",instanceId:((o=s.noteCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="cancel-note")return s.creatingNote=!1,s.editingNote=null,s.selectedNoteKey=null,i(),!0;if(t==="delete-note"){if(!s.editingNote||s.creatingNote)return!0;const c=String(s.editingNote.summary||"this note").trim()||"this note";return s.confirmDelete={scope:"note",title:"Delete note",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function it(e){const t=await h.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const a=new Set(e.state.tasks.map(n=>L(n.instanceId,n.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(n=>a.has(n)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(n=>`${n.instanceId}|${n.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function dr(e,t){const a=new Map;for(const f of t)f.uid&&a.set(f.uid,f);const n=new Map(t.map((f,m)=>[L(f.instanceId,f.uri),m])),s=new Map,i=[];for(const f of t){const m=f.parentUid;if(m&&a.has(m)&&m!==f.uid){const u=s.get(m)??[];u.push(f),s.set(m,u)}else i.push(f)}const r=(f,m)=>(n.get(L(f.instanceId,f.uri))??0)-(n.get(L(m.instanceId,m.uri))??0);i.sort(r);for(const[,f]of s)f.sort(r);const l=[],o=new Set,c=(f,m)=>{const u=f.uid||L(f.instanceId,f.uri);if(!o.has(u)){o.add(u),l.push({task:f,depth:Math.min(m,8)});for(const b of s.get(f.uid)??[])c(b,m+1);o.delete(u)}};for(const f of i)c(f,0);for(const f of t)l.some(m=>m.task===f)||l.push({task:f,depth:0});return l}function cr(e,t){const a=new Set([t]);if(!t)return a;let n=!0;for(;n;){n=!1;for(const s of e.state.tasks)s.parentUid&&a.has(s.parentUid)&&s.uid&&!a.has(s.uid)&&(a.add(s.uid),n=!0)}return a}function ur(e,t,a){const n=t.instanceId,s=a||!t.uid?new Set:cr(e,t.uid),i=e.state.tasks.filter(o=>o.uid&&o.instanceId===n&&!s.has(o.uid)&&o.uid!==t.uid),r=t.parentUid||"",l=['<option value="">None (top-level)</option>',...i.map(o=>`<option value="${d(o.uid)}" ${o.uid===r?"selected":""}>${d(o.summary||o.uid)}</option>`)];if(r&&!i.some(o=>o.uid===r)){const o=e.state.tasks.find(c=>c.uid===r);l.push(`<option value="${d(r)}" selected>${d((o==null?void 0:o.summary)||r)} (current)</option>`)}return l.join("")}function za(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(a=>t.has(L(a.instanceId,a.uri))&&a.canWrite&&!a.readOnly)}function mr(e){const t=p=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[p]||p,a=dr(e,e.state.tasks),n=e.state.tasks.filter(p=>p.canWrite&&!p.readOnly).map(p=>L(p.instanceId,p.uri)),s=n.length>0&&n.every(p=>e.state.checkedTaskKeys.includes(p)),i=e.state.checkedTaskKeys.length>0,l=za(e).length,o=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:a.map(({task:p,depth:w})=>{const k=L(p.instanceId,p.uri),S=!e.state.creatingTask&&k===e.state.selectedTaskKey?" is-selected":"",v=e.state.checkedTaskKeys.includes(k),g=p.status==="COMPLETED"?"badge-ok":p.status==="CANCELLED"?"":"badge-admin",D=w>0?` style="--task-depth:${w}"`:"",P=w>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",F=p.canWrite&&!p.readOnly;return`<tr class="contact-table-row task-row${w>0?" is-subtask":""}${S}${v?" is-checked":""}" data-action="select-task" data-instance="${p.instanceId}" data-uri="${d(p.uri)}" tabindex="0" role="button"${D}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${p.instanceId}" data-uri="${d(p.uri)}"
                  ${v?"checked":""} ${F?"":"disabled"} aria-label="Select ${d(p.summary||p.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${P}<span class="contact-name-primary">${d(p.summary||p.uri)}</span></span>
                ${p.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${g}">${d(t(p.status))}</span></td>
              <td class="col-task-due muted small">${d(Pa(p.due))}</td>
              <td class="col-task-cal muted small">${d(p.calendarName)}</td>
              <td class="col-task-pct muted small">${p.percent?d(String(p.percent))+"%":"—"}</td>
            </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,f=(p,w)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${p}"
      title="${d(w)}" aria-label="${d(w)}" ${e.state.busy||l===0?"disabled":""}>${c}</button>`,m=i?`<div class="bulk-bar" style="margin-top:0.75rem">
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
        </div>`:"",u=e.state.editingTask,b=e.state.taskCalendars.map(p=>`<option value="${p.id}" ${u&&u.instanceId===p.id?"selected":""}>${d(p.displayname)}</option>`).join(""),y=u?`<div class="card">
          ${M(e.state.creatingTask?u.parentUid?"New subtask":"New task":"Edit task","tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${e.state.creatingTask?`<label>Calendar
                    <select name="instanceId" required ${e.state.taskCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.taskCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${b}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${d(u.calendarName)}</strong>${u.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${d(u.summary)}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${u.readOnly&&!e.state.creatingTask?"readonly":""}>${d(u.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${u.readOnly&&!e.state.creatingTask?"disabled":""}>
                ${ur(e,u,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${u.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(p=>`<option value="${p}" ${u.status===p?"selected":""}>${d(t(p))}</option>`).join("")}
                </select>
              </label>
              ${e.renderPortalDateTimeField({field:"due",name:"due",label:"Due",value:he(u.due),dateOnly:!1,disabled:!!(u.readOnly&&!e.state.creatingTask),allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${d(String(u.priority||0))}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${d(String(u.percent||0))}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
            </div>
            <div class="form-actions-row">
              ${e.state.creatingTask||u.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingTask?"Create task":"Save task"}</button>`:""}
              ${!e.state.creatingTask&&u.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${e.state.busy?"disabled":""}>Add subtask</button>
                     <button type="button" class="btn btn-danger" data-action="delete-task" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingTask?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${M("Tasks","tasks")}
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
                  ${s?"checked":""} ${n.length===0||e.state.busy?"disabled":""} />
              </th>
              ${X("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${X("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${X("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${X("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${X("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${y}
    </section>
  </div>`}function fr(e,t){if(!e.state.editingTask)return;const a=new FormData(t),n=String(a.get("due")??"").trim(),s=a.get("instanceId"),i=s!==null&&String(s)!==""?Number(s):e.state.editingTask.instanceId,r=String(a.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(i)&&i>0?i:e.state.editingTask.instanceId,summary:String(a.get("summary")??e.state.editingTask.summary),description:String(a.get("description")??e.state.editingTask.description),status:String(a.get("status")??e.state.editingTask.status),due:n?new Date(n).toISOString():null,priority:Number(a.get("priority")??e.state.editingTask.priority??0),percent:Number(a.get("percent")??e.state.editingTask.percent??0),parentUid:r===""?null:r}}async function pr(e,t){var i,r;const a=za(e);if(a.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const n=a.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(t==="bulk-task-delete"){e.state.busy=!0,e.clearFlash(),e.render();try{const l=await h.bulkTasks({op:"delete",items:n});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&a.some(o=>L(o.instanceId,o.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await it(e),l.failed>0?e.setFlash("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let s={};if(t==="bulk-task-status"){const l=e.root.querySelector("#bulk-task-status"),o=((i=l==null?void 0:l.value)==null?void 0:i.trim())??"";if(!o){e.setFlash("error","Choose a status to apply"),e.render();return}s={status:o}}else if(t==="bulk-task-due"){const l=e.state.bulkDueValue.trim();if(!l){e.setFlash("error","Choose a due date to apply"),e.render();return}const o=/^\d{4}-\d{2}-\d{2}$/.test(l)?new Date(l+"T00:00:00"):new Date((l.length===16,l));if(Number.isNaN(o.getTime())){e.setFlash("error","Invalid due date"),e.render();return}s={due:o.toISOString()}}else if(t==="bulk-task-clear-due")s={due:null};else if(t==="bulk-task-percent"){const l=e.root.querySelector("#bulk-task-percent"),o=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(o===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const c=Number(o);if(!Number.isFinite(c)||c<0||c>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}s={percent:Math.round(c)}}e.state.busy=!0,e.clearFlash(),e.render();try{const l=await h.bulkTasks({op:"update",items:n,fields:s});if(await it(e),e.state.editingTask&&!e.state.creatingTask){const c=L(e.state.editingTask.instanceId,e.state.editingTask.uri),f=e.state.tasks.find(m=>L(m.instanceId,m.uri)===c);f&&(e.state.editingTask={...f})}const o=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";l.failed>0?e.setFlash("error",`Updated ${o} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Updated ${o} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function br(e,t){const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),i=String(a.get("status")??"NEEDS-ACTION"),r=String(a.get("due")??"").trim(),l=r?new Date(r).toISOString():null,o=Number(a.get("priority")??0),c=Number(a.get("percent")??0),f=String(a.get("parentUid")??"").trim(),m=f===""?null:f;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const u=Number(a.get("instanceId"));if(!Number.isFinite(u)||u<=0)throw new Error("Select a calendar");const b=await h.createTask({instanceId:u,summary:n,description:s,status:i,due:l,priority:o,percent:c,parentUid:m});e.state.creatingTask=!1,e.state.selectedTaskKey=L(b.task.instanceId,b.task.uri),e.state.editingTask=b.task,e.setFlash("success",ne(m?"Subtask":"Task",b.task.summary||n,"created"))}else if(e.state.editingTask){const u=await h.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:n,description:s,status:i,due:l,priority:o,percent:c,parentUid:m});e.state.editingTask=u.task,e.state.selectedTaskKey=L(u.task.instanceId,u.task.uri),e.setFlash("success",ne("Task",u.task.summary||n,"saved"))}await it(e)}catch(u){e.setFlash("error",u instanceof Error?u.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function gr(e,t,a,n){var o;const{state:s,render:i,setFlash:r,clearFlash:l}=e;if(t==="sort-task"){const c=a.dataset.sort||"";if(!c)return!0;s.taskSort===c?s.taskOrder=s.taskOrder==="asc"?"desc":"asc":(s.taskSort=c,s.taskOrder=c==="due"||c==="summary"?"asc":"desc"),s.busy=!0,i();try{await e.loadTasks()}catch(f){r("error",f instanceof Error?f.message:"Sort failed")}finally{s.busy=!1,i()}return!0}if(t==="select-task"){if(n.target.closest("[data-stop-row], .task-check"))return!0;const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=s.tasks.find(u=>u.instanceId===c&&u.uri===f)??null;return s.creatingTask=!1,s.selectedTaskKey=e.itemKey(c,f),s.editingTask=m?{...m}:null,l(),i(),!0}if(t==="task-check"){n.preventDefault(),n.stopPropagation();const c=Number(a.dataset.instance),f=a.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=e.itemKey(c,f),u=s.tasks.find(b=>e.itemKey(b.instanceId,b.uri)===m);return!u||!u.canWrite||u.readOnly||(s.checkedTaskKeys.includes(m)?s.checkedTaskKeys=s.checkedTaskKeys.filter(b=>b!==m):s.checkedTaskKeys=[...s.checkedTaskKeys,m],i()),!0}if(t==="task-select-all"){n.preventDefault();const c=s.tasks.filter(m=>m.canWrite&&!m.readOnly);return c.length>0&&c.every(m=>s.checkedTaskKeys.includes(e.itemKey(m.instanceId,m.uri)))?s.checkedTaskKeys=[]:s.checkedTaskKeys=c.map(m=>e.itemKey(m.instanceId,m.uri)),i(),!0}if(t==="bulk-task-clear")return s.checkedTaskKeys=[],i(),!0;if(t==="bulk-task-status"||t==="bulk-task-due"||t==="bulk-task-clear-due"||t==="bulk-task-percent"||t==="bulk-task-delete"){if(t==="bulk-task-delete"){const c=s.checkedTaskKeys.length;return c===0?(r("error","No tasks selected"),i(),!0):(s.confirmDelete={scope:"bulk-task",title:c===1?"Delete task":`Delete ${c} tasks`,message:c===1?"Delete the selected task?":`Delete ${c} selected tasks?`,detail:"CalDAV clients will sync the removal. This cannot be undone.",count:c},i(),!0)}return e.runBulkTaskAction(t),!0}if(t==="new-task")return s.creatingTask=!0,s.selectedTaskKey=null,s.editingTask={uri:"",instanceId:((o=s.taskCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="new-subtask"){if(!s.editingTask||s.creatingTask||!s.editingTask.uid||!s.editingTask.canWrite)return!0;const c=s.editingTask;return s.creatingTask=!0,s.selectedTaskKey=null,s.editingTask={uri:"",instanceId:c.instanceId,calendarId:c.calendarId,calendarName:c.calendarName,calendarUri:c.calendarUri,uid:"",parentUid:c.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0}if(t==="cancel-task")return s.creatingTask=!1,s.editingTask=null,s.selectedTaskKey=null,i(),!0;if(t==="delete-task"){if(!s.editingTask||s.creatingTask)return!0;const c=String(s.editingTask.summary||"this task").trim()||"this task";return s.confirmDelete={scope:"task",title:"Delete task",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function jt(e,t){const a=await h.contacts(t,e.state.contactSearch);e.state.contacts=a.contacts,e.state.selectedContactUri!==null&&!e.state.contacts.some(n=>n.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function yr(e,t){if(e.state.selectedAbId===null)return;const a=await h.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const n=a.contact;e.state.editingContact={...n,emails:Array.isArray(n.emails)?n.emails:[],phones:Array.isArray(n.phones)?n.phones:[],custom:Array.isArray(n.custom)?n.custom:[],address:n.address??Wa(),birthday:n.birthday??null},e.state.photoPreview=n.photoDataUri??(n.hasPhoto&&e.state.selectedAbId!==null?`${h.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function vr(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function Wa(e){return{street:"",city:"",region:"",postal:"",country:""}}function $r(e,t){return new Promise((a,n)=>{const s=new FileReader;s.onload=()=>{const i=String(s.result??""),r=i.indexOf(",");a(r>=0?i.slice(r+1):i)},s.onerror=()=>n(new Error("Failed to read photo file")),s.readAsDataURL(t)})}async function wr(e,t){var n;const a=(n=t.files)==null?void 0:n[0];if(t.value="",!!a){if(a.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const s=await $r(e,a);e.state.photoBase64Pending=s,e.state.photoPreview=`data:${a.type||"image/jpeg"};base64,${s}`,e.state.removePhotoPending=!1,e.render()}catch(s){e.setFlash("error",s instanceof Error?s.message:"Failed to read photo"),e.render()}}}async function kr(e,t){var s;if(e.state.selectedAbId===null)return;const a=(s=t.files)==null?void 0:s[0];if(t.value="",!a)return;const n=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:a.name,fileSizeLabel:tt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const i=await e.readFileTextWithProgress(a,o=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:o};const c=e.root.querySelector(".import-progress-bar"),f=e.root.querySelector("[data-import-status-line]");c&&o!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${o}%`),f&&o!==null&&(f.textContent=`Reading file… ${o}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),$.event("import.contacts.start",{file:a.name,bytes:a.size,abId:n});const r=await h.importAddressBook(n,i,o=>{e.applyServerImportProgress(o)}),l=e.formatImportResult(r);await e.loadHome(),e.state.selectedAbId===n&&await jt(e,n),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${l} (from “${a.name}”)`}),e.setFlash("success",`Import finished for “${a.name}”: ${l}.`)}catch(i){const r=i instanceof Error?i.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{e.state.busy=!1,e.render()}}async function hr(e,t){if(e.state.selectedAbId===null)return;const a=sr(e,t),n=$t(a);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const s=await h.createContact(e.state.selectedAbId,a);e.state.creatingContact=!1,e.state.selectedContactUri=s.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ne("Contact",$t(s.contact)||n,"created"))}else if(e.state.selectedContactUri){const s=await h.updateContact(e.state.selectedAbId,e.state.selectedContactUri,a);e.state.selectedContactUri=s.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ne("Contact",$t(s.contact)||n,"saved"))}try{await e.loadHome()}catch(s){if(console.error(s),e.state.selectedAbId!==null)try{await jt(e,e.state.selectedAbId)}catch{}}}catch(s){e.setFlash("error",s instanceof Error?s.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Sr(e,t){const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??"").trim();if(n){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await h.createAddressBook({displayname:n,description:s});e.state.selectedAbId=i.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${i.addressbook.displayname}” created`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function Dr(e,t){if(e.state.selectedAbId===null)return;const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await h.updateAddressBook(e.state.selectedAbId,{displayname:n,description:s}),await e.loadHome(),e.setFlash("success",ne("Address book",n,"updated"))}catch(i){e.setFlash("error",i instanceof Error?i.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function Cr(e){const{state:t}=e,a=t.addressBooks.map(k=>`<div class="cal-row${k.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${k.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${d(k.displayname)}</span>
          <span class="muted small">${k.cardCount} contact${k.cardCount===1?"":"s"}</span>
          <span class="muted small mono cal-row-uri">${d(k.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${k.id}" ${t.busy?"disabled":""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${k.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${k.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`).join(""),n=t.addressBooks.find(k=>k.id===t.selectedAbId)??null,s=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map(k=>{const S=!t.creatingContact&&k.uri===t.selectedContactUri?" is-selected":"",v=d((k.displayname||"?").slice(0,1).toUpperCase()),g=k.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${d(h.contactPhotoUrl(t.selectedAbId,k.uri))}" alt="" loading="lazy" data-avatar-fallback="${v}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${v}</span>`;return`<tr class="contact-table-row${S}" data-action="select-contact" data-uri="${d(k.uri)}" tabindex="0" role="button">
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${g}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${d(k.displayname)}</span>
                    ${k.org?`<span class="muted small contact-name-secondary">${d(k.org)}</span>`:""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${d(k.email||"—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${d(k.phone||"—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${d(k.org||"—")}</span></td>
            </tr>`}).join(""),i=t.editingContact,r=Array.isArray(i==null?void 0:i.emails)&&i.emails.length>0?i.emails:[""],l=Array.isArray(i==null?void 0:i.phones)&&i.phones.length>0?i.phones:[{type:"cell",value:""}],o=(i==null?void 0:i.address)??e.emptyAddress(),c=r.map((k,S)=>`<div class="multi-row" data-multi="email" data-idx="${S}">
        <input type="email" name="email_${S}" value="${d(k??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${S}" ${r.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),f=l.map((k,S)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${S}">
        <select name="phone_type_${S}" aria-label="Phone type">
          ${["cell","work","home","other"].map(v=>`<option value="${v}" ${((k==null?void 0:k.type)??"other")===v?"selected":""}>${v}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${S}" value="${d((k==null?void 0:k.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${S}" ${l.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),m=Array.isArray(i==null?void 0:i.custom)?i.custom:[],u=m.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':m.map((k,S)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${S}">
              <input type="text" name="custom_label_${S}" value="${d(k.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${S}" value="${d(k.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${S}" title="Remove">×</button>
            </div>`).join(""),b=t.contactModalOpen&&i&&n?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
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
                  ${u}
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
        </div>`:"",y=t.abModalOpen&&n?U({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${d(n.uri)} · ${n.cardCount} contact${n.cardCount===1?"":"s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${d(n.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${d(n.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${d(n.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${M("Import / export","contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${t.busy?"disabled":""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${t.busy?"disabled":""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",p=t.deleteAbConfirmId!==null?t.addressBooks.find(k=>k.id===t.deleteAbConfirmId)??null:null,w=p?U({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(p.displayname)}</strong>
              <span class="muted small mono">(${d(p.uri)})</span>.</p>
            <p class="muted small">${(p.cardCount??0)>0?`All ${p.cardCount} contact${p.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${dt({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${p.id}"`}]}):"";return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${M("Address books","address-books")}
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
        ${n?`<div class="card contacts-main-card">
                <div class="contacts-main-head">
                  ${M("Contacts","contacts")}
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
                      ${s}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
      </section>
    </div>
    ${w}
    ${y}
    ${b}`}async function Tr(e,t,a,n){var c,f;const{state:s,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="select-ab"){const m=Number(a.dataset.id);if(!Number.isFinite(m))return!0;s.selectedAbId=m,s.abModalOpen=!1,s.selectedContactUri=null,s.editingContact=null,s.creatingContact=!1,s.contactModalOpen=!1,s.contactSearch="",s.contacts=[],s.photoPreview=null,s.photoBase64Pending=null,s.removePhotoPending=!1,o(),s.busy=!0,r();try{await e.loadContacts(m)}catch(u){l("error",u instanceof Error?u.message:"Failed to load contacts")}finally{s.busy=!1,r()}return!0}if(t==="edit-ab"){n.stopPropagation();const m=Number(a.dataset.id);if(!Number.isFinite(m)||!s.addressBooks.find(y=>y.id===m))return!0;const b=s.selectedAbId!==m;s.selectedAbId=m,s.abModalOpen=!0,s.contactModalOpen=!1,o(),b&&(s.selectedContactUri=null,s.editingContact=null,s.creatingContact=!1,s.contactSearch="",s.contacts=[],s.photoPreview=null,s.photoBase64Pending=null,s.removePhotoPending=!1),s.busy=!0,r();try{b&&await e.loadContacts(m)}catch(y){l("error",y instanceof Error?y.message:"Failed to open address book")}finally{s.busy=!1,r()}return!0}if(t==="close-ab-modal")return s.abModalOpen=!1,r(),!0;if(t==="select-contact"){const m=a.dataset.uri??"";if(!m)return!0;o();try{await e.openContact(m)}catch(u){l("error",u instanceof Error?u.message:"Failed to load contact")}return r(),!0}if(t==="new-contact")return s.selectedAbId===null||(e.startNewContact(),o(),r()),!0;if(t==="cancel-contact"||t==="close-contact-modal")return s.creatingContact=!1,s.contactModalOpen=!1,s.editingContact=null,s.selectedContactUri=null,s.photoPreview=null,s.photoBase64Pending=null,s.removePhotoPending=!1,s.eventDtPicker=null,o(),r(),!0;if(t==="add-email"||t==="add-phone"||t==="add-custom")return s.editingContact&&(Me(e.contactsHost),Array.isArray(s.editingContact.emails)||(s.editingContact.emails=[""]),Array.isArray(s.editingContact.phones)||(s.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(s.editingContact.custom)||(s.editingContact.custom=[]),t==="add-email"?s.editingContact.emails.length<10&&s.editingContact.emails.push(""):t==="add-phone"?s.editingContact.phones.length<10&&s.editingContact.phones.push({type:"other",value:""}):s.editingContact.custom.length<30&&s.editingContact.custom.push({label:"",value:""}),r()),!0;if(t==="remove-email"){if(!s.editingContact)return!0;Me(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(s.editingContact.emails)?s.editingContact.emails:[""];return s.editingContact.emails=u.filter((b,y)=>y!==m),s.editingContact.emails.length===0&&(s.editingContact.emails=[""]),r(),!0}if(t==="remove-phone"){if(!s.editingContact)return!0;Me(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(s.editingContact.phones)?s.editingContact.phones:[{type:"cell",value:""}];return s.editingContact.phones=u.filter((b,y)=>y!==m),s.editingContact.phones.length===0&&(s.editingContact.phones=[{type:"cell",value:""}]),r(),!0}if(t==="remove-custom"){if(!s.editingContact)return!0;Me(e.contactsHost);const m=Number(a.dataset.idx);return Number.isFinite(m)&&(s.editingContact.custom=(Array.isArray(s.editingContact.custom)?s.editingContact.custom:[]).filter((u,b)=>b!==m),r()),!0}if(t==="remove-photo")return s.photoPreview=null,s.photoBase64Pending=null,s.removePhotoPending=!0,s.editingContact&&(s.editingContact.hasPhoto=!1),r(),!0;if(t==="delete-contact"){if(s.selectedAbId===null||!s.selectedContactUri)return!0;const m=String(((c=s.editingContact)==null?void 0:c.fullname)||((f=s.editingContact)==null?void 0:f.displayname)||"this contact").trim()||"this contact";return s.confirmDelete={scope:"contact",title:"Delete contact",message:`Delete “${m}”?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="delete-ab"){n.stopPropagation();const m=Number(a.dataset.id??s.selectedAbId);return!Number.isFinite(m)||!s.addressBooks.find(b=>b.id===m)||(s.deleteAbConfirmId=m,s.abModalOpen=!1,s.contactModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-ab")return s.deleteAbConfirmId=null,r(),!0;if(t==="confirm-delete-ab"){const m=Number(a.dataset.id),u=i.querySelector("#delete-ab-confirm");if(!Number.isFinite(m)||!(u!=null&&u.checked))return!0;const b=s.addressBooks.find(p=>p.id===m);if(!b)return!0;const y=(b.cardCount??0)>0;s.busy=!0,o(),r();try{await h.deleteAddressBook(m,y),s.selectedAbId===m&&(s.selectedAbId=null,s.contacts=[],s.editingContact=null,s.selectedContactUri=null,s.creatingContact=!1),s.deleteAbConfirmId=null,s.abModalOpen=!1,s.contactModalOpen=!1,await e.loadHome(),s.selectedAbId===null&&s.addressBooks.length>0&&(s.selectedAbId=s.addressBooks[0].id,await e.loadContacts(s.selectedAbId)),l("success","Address book deleted")}catch(p){l("error",p instanceof Error?p.message:"Delete failed")}finally{s.busy=!1,r()}return!0}if(t==="export-ab"){n.stopPropagation();const m=a.dataset.id,u=m!==void 0&&m!==""?Number(m):s.selectedAbId;if(u===null||Number.isNaN(u))return!0;s.busy=!0,o(),r();try{const{blob:b,filename:y}=await h.exportAddressBook(u),p=await e.saveBlobAsFile(b,y);p==="cancelled"?l("info","Export cancelled"):p==="saved"?l("success",`Saved ${y}`):l("success",`Download started: ${y}`)}catch(b){l("error",b instanceof Error?b.message:"Export failed")}finally{s.busy=!1,r()}return!0}if(t==="export-contact"){if(s.selectedAbId===null||!s.selectedContactUri||s.creatingContact)return!0;s.contactModalOpen=!0,s.busy=!0,o(),r();try{const{blob:m,filename:u}=await h.exportContact(s.selectedAbId,s.selectedContactUri),b=await e.saveBlobAsFile(m,u);b==="cancelled"?l("info","Export cancelled"):b==="saved"?l("success",`Saved ${u}`):l("success",`Download started: ${u}`)}catch(m){l("error",m instanceof Error?m.message:"Export failed")}finally{s.busy=!1,r()}return!0}return!1}function Kt(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function Ja(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function zt(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),a=t[1]??"overview",n=Ja(a)??"overview";let s=null;if(n==="users"&&t[2])try{s=decodeURIComponent(t[2])}catch{s=t[2]}return{tab:"admin",adminPage:n,adminUsername:s}}return{tab:Kt(e),adminPage:null,adminUsername:null}}function Er(){const e=zt().tab;if(e)return e;try{const t=Kt(sessionStorage.getItem($a));if(t)return t}catch{}return"calendars"}function Pr(){const e=zt().adminPage;if(e)return e;try{const t=Ja(sessionStorage.getItem(wa));if(t)return t}catch{}return"overview"}function Ar(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function kt(e,t="overview",a=null){try{sessionStorage.setItem($a,e),e==="admin"&&sessionStorage.setItem(wa,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const n=e==="admin"?Ar(t,a):`#${e}`;location.hash!==n&&history.replaceState(null,"",`${location.pathname}${location.search}${n}`)}function da(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(e)}</span>`}function ht(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function Ce(e,t,a){if(!W(e,t))return"";const n=e.activeTab===t;return`<button type="button" role="tab" class="tab-btn${n?" is-active":""}"
            data-action="tab" data-tab="${t}" aria-selected="${n}">
            ${a}
          </button>`}function Fr(e){const{state:t,root:a}=e;if(!t.user){e.renderLogin();return}let n;switch(t.activeTab){case"calendars":n=W(t,"calendars")?oa(e):Te("Calendar","CalDAV");break;case"contacts":n=W(t,"contacts")?Cr(e):Te("Contacts","CardDAV");break;case"tasks":n=W(t,"tasks")?e.renderTasksTab():Te("Tasks","Tasks (VTODO)");break;case"notes":n=W(t,"notes")?e.renderNotesTab():Te("Notes","Notes (VJOURNAL)");break;case"files":n=W(t,"files")?e.renderFilesTab():Te("Files","WebDAV file storage");break;case"admin":n=e.renderAdminSection();break;default:n=oa(e)}const s=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",i=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage==="overview"?"admin-overview":t.adminPage==="users"?"admin-users":t.adminPage==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          ${Ce(t,"calendars","Calendar")}
          ${Ce(t,"contacts","Contacts")}
          ${Ce(t,"tasks","Tasks")}
          ${Ce(t,"notes","Notes")}
          ${Ce(t,"files","Files")}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${s}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;a.innerHTML=e.shell(n,{tabs:i}),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesPreview!==null||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}function Te(e,t){return`<div class="panel empty-panel">
    <h2>${e}</h2>
    <p class="muted">${e} is disabled in system settings (Enable ${t}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`}function Ur(e){const{state:t,render:a}=e;e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),et(t),t.eventDtPicker&&Cs(t,a),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),Ia(e.filesHost),e.bindHolidaysToggle(),Ir(e)}function Ir(e){var i;const{state:t,root:a}=e;if(!t.listKeyboardFocus||t.activeTab!=="contacts"&&t.activeTab!=="tasks"&&t.activeTab!=="notes")return;const n=document.activeElement;if(n&&a.contains(n)&&n.matches("input:not([type=checkbox]), textarea, select")&&!n.closest("tr.contact-table-row[data-action]")||(i=n==null?void 0:n.closest)!=null&&i.call(n,"tr.contact-table-row[data-action]"))return;let s=null;if(t.activeTab==="contacts"&&t.selectedContactUri)s=a.querySelector(`tr[data-action="select-contact"][data-uri="${CSS.escape(t.selectedContactUri)}"]`);else if(t.activeTab==="tasks"&&t.selectedTaskKey){const r=t.selectedTaskKey.indexOf("|");if(r>0){const l=t.selectedTaskKey.slice(0,r),o=t.selectedTaskKey.slice(r+1);s=a.querySelector(`tr[data-action="select-task"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}else if(t.activeTab==="notes"&&t.selectedNoteKey){const r=t.selectedNoteKey.indexOf("|");if(r>0){const l=t.selectedNoteKey.slice(0,r),o=t.selectedNoteKey.slice(r+1);s=a.querySelector(`tr[data-action="select-note"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}if(!s){const r=t.activeTab==="contacts"?"select-contact":t.activeTab==="tasks"?"select-task":"select-note";s=a.querySelector(`tr.contact-table-row[data-action="${r}"]`)}s&&s.focus({preventScroll:!0})}async function Or(e,t,a,n){const{state:s,render:i,clearFlash:r,setFlash:l}=e;if(t==="confirm-delete-cancel")return ta(s),i(),!0;if(t==="confirm-delete-ok"){const o=s.confirmDelete;if(!o)return i(),!0;const c=o.scope;if(ta(s),c==="event"){if(!s.editingEvent||!s.editingEvent.canWrite||s.creatingEvent)return i(),!0;const f=s.editingEvent.instanceId,m=s.editingEvent.uri;s.busy=!0,r(),i();try{await h.deleteEvent(f,m),s.eventModalOpen=!1,s.editingEvent=null,await e.loadMonthEvents(),l("success","Event deleted")}catch(u){l("error",u instanceof Error?u.message:"Delete failed")}finally{s.busy=!1,i()}return!0}if(c==="task"){if(!s.editingTask||s.creatingTask)return i(),!0;s.busy=!0,r(),i();try{await h.deleteTask(s.editingTask.instanceId,s.editingTask.uri),s.selectedTaskKey=null,s.editingTask=null,await e.loadTasks(),l("success","Task deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{s.busy=!1,i()}return!0}if(c==="note"){if(!s.editingNote||s.creatingNote)return i(),!0;s.busy=!0,r(),i();try{await h.deleteNote(s.editingNote.instanceId,s.editingNote.uri),s.selectedNoteKey=null,s.editingNote=null,await e.loadNotes(),l("success","Note deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{s.busy=!1,i()}return!0}if(c==="contact"){if(s.selectedAbId===null||!s.selectedContactUri)return i(),!0;s.busy=!0,r(),s.contactModalOpen=!0,i();try{await h.deleteContact(s.selectedAbId,s.selectedContactUri),s.selectedContactUri=null,s.editingContact=null,s.creatingContact=!1,s.contactModalOpen=!1,s.eventDtPicker=null,s.photoPreview=null,await e.loadHome(),l("success","Contact deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{s.busy=!1,i()}return!0}if(c==="bulk-task")return await e.runBulkTaskAction("bulk-task-delete"),!0;if(c==="revoke-share"){const f=o.href??"";if(!f||s.selectedId===null)return i(),!0;s.calModalOpen=!0,s.busy=!0,r(),i();try{await h.revoke(s.selectedId,f),await e.loadShares(s.selectedId),l("success","Share revoked")}catch(m){l("error",m instanceof Error?m.message:"Revoke failed")}finally{s.busy=!1,i()}return!0}return i(),!0}if(t==="close-import-progress")return s.importProgress&&(s.importProgress.phase==="done"||s.importProgress.phase==="error")&&e.closeImportProgress(),!0;if(t==="logout"){s.busy=!0,$.event("logout");try{await h.logout()}catch{}return e.clearPortalSessionState(),r(),i(),!0}if(t==="info"){const o=a.dataset.info??"";return e.openInfoModal(o),!0}if(t==="info-close")return e.closeInfoModal(),!0;if(t==="flash-close")return r(),i(),!0;if(t==="user-menu-toggle")return n.stopPropagation(),s.userMenuOpen=!s.userMenuOpen,i(),!0;if(t==="user-menu-close")return s.userMenuOpen&&(s.userMenuOpen=!1,i()),!0;if(t==="tab"){const o=Kt(a.dataset.tab);return o&&(o==="admin"&&(s.adminPage="overview"),await e.activateTab(o)),!0}return!1}async function Ya(e,t){const a=t.target.closest("[data-action]");if(!a)return;const n=a.dataset.action;n&&($.debug(`action:${n}`,{id:a.dataset.id,tab:a.dataset.tab,uri:a.dataset.uri}),!await Or(e,n,a,t)&&(n.startsWith("admin-")&&await An(e.adminHost,n,a)||(n.startsWith("files-")||n==="close-files-upload-progress")&&await sn(e.filesHost,n,a,t)||await nr(e,n,a,t)||await gr(e,n,a,t)||await or(e,n,a)||await Tr(e,n,a,t)))}const ca=new WeakMap;function Mr(e){if(ca.has(e.root)){$.debug("portalEvents: already bound for root");return}ca.set(e.root,!0),e.state.portalEventsBound=!0,e.state.escapeBound=!0;const{root:t}=e;t.addEventListener("click",a=>Nr(e,a)),t.addEventListener("submit",a=>xr(e,a)),t.addEventListener("change",a=>Lr(e,a)),t.addEventListener("input",a=>_r(e,a)),t.addEventListener("keydown",a=>qr(e,a)),document.addEventListener("keydown",a=>Hr(e,a)),t.addEventListener("dragenter",a=>Ke(e,"enter",a)),t.addEventListener("dragover",a=>Ke(e,"over",a)),t.addEventListener("dragleave",a=>Ke(e,"leave",a)),t.addEventListener("drop",a=>Ke(e,"drop",a)),t.addEventListener("error",a=>Vr(e,a),!0),$.event("portalEvents.registered")}function Nr(e,t){var s,i;const a=(i=(s=t.target)==null?void 0:s.closest)==null?void 0:i.call(s,"[data-action]");if(!a||!e.root.contains(a))return;const n=a.dataset.action??"";(n==="info"||n==="info-close")&&(t.preventDefault(),t.stopPropagation()),(n==="dt-set-month"||n==="dt-set-year")&&t.stopPropagation(),(n==="select-contact"||n==="select-task"||n==="select-note")&&(e.state.listKeyboardFocus=!0),$.debug("portalEvents.click",{action:n}),Ya(e,t)}function xr(e,t){var s,i;const a=(i=(s=t.target)==null?void 0:s.closest)==null?void 0:i.call(s,"form[data-form]");if(!a||!e.root.contains(a))return;const n=a.dataset.form??"";if(n)switch(t.preventDefault(),$.debug("portalEvents.submit",{form:n}),n){case"login":e.onLogin(a);return;case"share":e.onShare(a);return;case"edit-event":e.onSaveEvent(a);return;case"edit-cal":e.onEditCal(a);return;case"create-cal":e.onCreateCal(a);return;case"contact":e.onSaveContact(a);return;case"create-ab":e.onCreateAb(a);return;case"edit-ab":e.onEditAb(a);return;case"task":e.onSaveTask(a);return;case"note":e.onSaveNote(a);return;case"files-rename":tn(e.filesHost,a);return;case"files-transfer":Es(e.filesHost,a);return;case"files-mkdir":an(e.filesHost,a);return;case"admin-user-create":pn(e.adminHost,a);return;case"admin-user-edit":bn(e.adminHost,a);return;case"admin-cal":gn(e.adminHost,a);return;case"admin-ab":yn(e.adminHost,a);return;case"admin-settings":hn(e.adminHost,a);return;case"admin-database":Sn(e.adminHost,a);return;default:$.debug("portalEvents.submit.unknown",{form:n})}}function Lr(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const{state:n,root:s,render:i}=e,r=a.closest("[data-action]"),l=(r==null?void 0:r.dataset.action)??"";if(l==="dt-set-month"||l==="dt-set-year"){t.stopPropagation(),$.debug("portalEvents.change",{action:l}),Ya(e,t);return}if(l==="admin-db-backend"&&a instanceof HTMLSelectElement){n.adminDbFormBackend=a.value==="pgsql"?"pgsql":"sqlite",i();return}if(l==="files-upload-pick-files"&&a instanceof HTMLInputElement){ra(e.filesHost,a,!1);return}if(l==="files-upload-pick-folder"&&a instanceof HTMLInputElement){ra(e.filesHost,a,!0);return}if(l==="import-cal"&&a instanceof HTMLInputElement){Gn(e.calendarsHost,a);return}if(l==="import-create-cal"&&a instanceof HTMLInputElement){Qn(e.calendarsHost,a);return}if(l==="import-ab"&&a instanceof HTMLInputElement){e.calendarsHost.onImportContacts(a);return}if(l==="contact-photo"&&a instanceof HTMLInputElement){wr(e.contactsHost,a);return}if(a instanceof HTMLInputElement&&a.id==="delete-cal-confirm"){const o=s.querySelector("#delete-cal-submit");o&&(o.disabled=!a.checked||n.busy);return}if(a instanceof HTMLInputElement&&a.id==="delete-ab-confirm"){const o=s.querySelector("#delete-ab-submit");o&&(o.disabled=!a.checked||n.busy);return}if(a instanceof HTMLSelectElement&&(a.name==="repeatFreq"||a.name==="repeatEndMode")){const o=a.closest('[data-form="edit-event"]');if(o&&n.editingEvent){const c=new FormData(o);n.editingEvent={...n.editingEvent,repeat:_e(c),hasRrule:!!String(c.get("repeatFreq")??"").trim()},i()}return}if(a instanceof HTMLSelectElement&&a.name==="instanceId"){const o=a.closest('[data-form="task"]');if(o&&n.creatingTask&&n.editingTask){const f=Number(a.value);if(!Number.isFinite(f)||f<=0)return;e.syncEditingTaskFromForm(o);const m=n.editingTask.parentUid;n.editingTask={...n.editingTask,instanceId:f,parentUid:m&&n.tasks.some(u=>u.uid===m&&u.instanceId===f)?m:null},i();return}const c=a.closest('[data-form="note"]');if(c&&n.creatingNote&&n.editingNote){const f=Number(a.value);if(!Number.isFinite(f)||f<=0)return;e.syncEditingNoteFromForm(c),n.editingNote={...n.editingNote,instanceId:f},i();return}}if(a instanceof HTMLInputElement&&a.name==="holidays"&&a.closest('[data-form="create-cal"]')){ja(e.calendarsHost);return}if(a instanceof HTMLInputElement&&a.name==="color"){const o=a.closest("form"),c=o==null?void 0:o.querySelector('input[name="color_picker"]');if(c){let f=a.value.trim();f&&!f.startsWith("#")&&(f=`#${f}`),/^#[0-9A-Fa-f]{6}/.test(f)&&(c.value=f.slice(0,7),a.value=f.toUpperCase())}return}}function _r(e,t){var o;const a=t.target;if(!a||!e.root.contains(a))return;const{state:n,root:s,render:i,setFlash:r}=e;if(a instanceof HTMLInputElement&&a.name==="color_picker"){const c=a.closest("form"),f=c==null?void 0:c.querySelector('input[name="color"]');f&&(f.value=a.value.toUpperCase());return}const l=((o=a.closest("[data-action]"))==null?void 0:o.dataset.action)??"";if(l==="contact-search"&&a instanceof HTMLInputElement){n.listKeyboardFocus=!1,n.searchTimer&&clearTimeout(n.searchTimer);const c=a.value;n.searchTimer=setTimeout(()=>{n.contactSearch=c,(async()=>{try{n.selectedAbId!==null&&await e.loadContacts(n.selectedAbId),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="task-search"&&a instanceof HTMLInputElement){n.listKeyboardFocus=!1,n.searchTimer&&clearTimeout(n.searchTimer);const c=a.value;n.searchTimer=setTimeout(()=>{n.taskSearch=c,(async()=>{try{await e.loadTasks(),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="note-search"&&a instanceof HTMLInputElement){n.listKeyboardFocus=!1,n.searchTimer&&clearTimeout(n.searchTimer);const c=a.value;n.searchTimer=setTimeout(()=>{n.noteSearch=c,(async()=>{try{await e.loadNotes(),i()}catch(f){r("error",f instanceof Error?f.message:"Search failed"),i()}})()},250);return}if(l==="admin-db-confirm-input"&&a instanceof HTMLInputElement){n.adminDbConfirmText=a.value;const c=s.querySelector('[data-action="admin-db-confirm-save"]');c&&(c.disabled=n.busy||n.adminDbConfirmText.trim()!=="CONFIRM");return}if(l==="admin-reset-password"&&a instanceof HTMLInputElement){n.adminResetPassword=a.value;const c=s.querySelector('[data-action="admin-reset-confirm"]');c&&(c.disabled=n.busy||!n.adminResetConfirmChecked||n.adminResetPassword.trim()==="");return}}const ua='tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]',ma="tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]";function Rr(e){const{state:t,root:a}=e;let n="";if(t.activeTab==="contacts")n="select-contact";else if(t.activeTab==="tasks")n="select-task";else if(t.activeTab==="notes")n="select-note";else return[];return Array.from(a.querySelectorAll(`tr.contact-table-row[data-action="${n}"]`))}function Ee(e){e.focus({preventScroll:!1}),e.scrollIntoView({block:"nearest"})}function qr(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const n=e.state.activeTab,s=n==="contacts"||n==="tasks"||n==="notes",i=a instanceof HTMLInputElement&&(a.dataset.action==="contact-search"||a.dataset.action==="task-search"||a.dataset.action==="note-search");if(!i&&a.closest("button, a, input, select, textarea, [contenteditable=true]")&&!a.matches(ma)&&!a.matches(ua))return;if(s&&(t.key==="ArrowDown"||t.key==="ArrowUp"||t.key==="Home"||t.key==="End")){const l=Rr(e);if(l.length===0)return;const o=a.closest(ua);if(e.state.listKeyboardFocus=!0,t.preventDefault(),!o||i){t.key==="ArrowDown"||t.key==="Home"?Ee(l[0]):Ee(l[l.length-1]);return}const c=l.indexOf(o);if(c<0)return;if(t.key==="Home"){Ee(l[0]);return}if(t.key==="End"){Ee(l[l.length-1]);return}const f=t.key==="ArrowDown"?l[c+1]:l[c-1];f&&Ee(f);return}if(t.key!=="Enter"&&t.key!==" ")return;const r=a.closest(ma);!r||!e.root.contains(r)||t.target!==r&&t.target.closest("button, a, input, select, textarea")||(t.preventDefault(),(r.dataset.action==="select-contact"||r.dataset.action==="select-task"||r.dataset.action==="select-note")&&(e.state.listKeyboardFocus=!0),$.debug("portalEvents.keydown.row",{action:r.dataset.action,key:t.key}),r.click())}function Ke(e,t,a){var o,c,f;const{state:n,root:s}=e;if(n.activeTab!=="files"||n.busy||n.filesUploadProgress||!Ns(a.dataTransfer))return;const i=(c=(o=a.target)==null?void 0:o.closest)==null?void 0:c.call(o,"[data-files-drop-target]");if(!i||!s.contains(i)){if(t==="leave"&&n.filesDropDepth>0){const m=a.relatedTarget;m&&m instanceof Node&&((f=s.querySelector("[data-files-drop-target]"))==null?void 0:f.contains(m))||(n.filesDropDepth=0,Br(e))}return}if(t==="enter"){a.preventDefault(),a.stopPropagation(),n.filesDropDepth+=1,ze(e,i,!0);return}if(t==="over"){a.preventDefault(),a.stopPropagation(),a.dataTransfer&&(a.dataTransfer.dropEffect="copy"),ze(e,i,!0);return}if(t==="leave"){a.preventDefault(),a.stopPropagation();const m=a.relatedTarget;if(m&&i.contains(m))return;n.filesDropDepth=Math.max(0,n.filesDropDepth-1),n.filesDropDepth===0&&ze(e,i,!1);return}a.preventDefault(),a.stopPropagation(),n.filesDropDepth=0,ze(e,i,!1);const r=a.dataTransfer;if(!r||n.busy||n.filesUploadProgress)return;n.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside();const l=Os(r);$.event("files.drop.snapshot",{handles:l.handlePromises.length,entries:l.entries.filter(Boolean).length,files:l.files.length}),(async()=>{try{const m=await Ms(l);if($.event("files.drop.items",{count:m.length,sample:m.slice(0,8).map(u=>u.relativePath)}),m.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await _t(e.filesHost,m)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Drop failed"),e.render()}})()}function ze(e,t,a){if(e.state.filesUploadDropActive===a){t.classList.toggle("is-dragover",a);return}e.state.filesUploadDropActive=a,t.classList.toggle("is-dragover",a)}function Br(e){e.state.filesUploadDropActive=!1,e.root.querySelectorAll("[data-files-drop-target].is-dragover").forEach(t=>{t.classList.remove("is-dragover")})}function Vr(e,t){const a=t.target;if(!(a instanceof HTMLImageElement)||!a.classList.contains("contact-avatar")||!a.dataset.avatarFallback||!a.isConnected)return;const n=a.dataset.avatarFallback||"?",s=document.createElement("span");s.className="contact-avatar contact-avatar-fallback",s.setAttribute("aria-hidden","true"),s.textContent=n,a.replaceWith(s)}function Hr(e,t){if(t.key!=="Escape")return;const{state:a,render:n}=e;if(a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")){e.closeImportProgress();return}if(a.importProgress)return;if(a.filesUploadProgress&&(a.filesUploadProgress.phase==="done"||a.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(a.filesUploadProgress)return;if(a.filesUploadMenuOpen){a.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),n();return}if(a.userMenuOpen){a.userMenuOpen=!1,e.unbindUserMenuOutside(),n();return}if(a.filesUploadConflict!==null){Qe(e.filesHost,"cancel");return}if(a.filesPreview!==null){R(e.filesHost),n();return}if(a.filesRenamePath!==null||a.filesDeletePaths!==null||a.filesTransfer!==null||a.filesMkdirOpen){a.filesRenamePath=null,a.filesDeletePaths=null,e.resetFilesTransferTree(),a.filesMkdirOpen=!1,n();return}if(a.confirmDelete){a.confirmDelete=null,n();return}const s=e.root.querySelector("#info-modal");if(s&&!s.hidden){e.closeInfoModal();return}if(a.eventDtPicker){a.eventDtPicker=null,et(a),n();return}if(a.eventModalOpen){a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,n();return}if(a.contactModalOpen){a.contactModalOpen=!1,a.editingContact=null,a.creatingContact=!1,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,n();return}if(a.abModalOpen){a.abModalOpen=!1,n();return}if(a.calModalOpen||a.createCalModalOpen||a.deleteConfirmId!==null||a.deleteAbConfirmId!==null){a.calModalOpen=!1,a.createCalModalOpen=!1,a.deleteConfirmId=null,a.deleteAbConfirmId=null,n();return}if(a.adminUserCreateOpen||a.adminUserEditOpen||a.adminUserDeleteUsername!==null){a.adminUserCreateOpen=!1,a.adminUserEditOpen=!1,a.adminUserDeleteUsername=null,n();return}if(a.adminResetModalOpen){a.adminResetModalOpen=!1,n();return}if(a.adminDbConfirmOpen){a.adminDbConfirmOpen=!1,a.adminDbConfirmText="",a.adminDbPendingBody=null,n();return}(a.adminCalModal!==null||a.adminAbModal!==null||a.adminResourceDelete!==null)&&(a.adminCalModal=null,a.adminAbModal=null,a.adminResourceDelete=null,n())}function St(e){const{state:t}=e;if(t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())){t.activeTab=Ze(t),t.adminPage="overview",e.persistTab(t.activeTab);return}t.activeTab!=="admin"&&!W(t,t.activeTab)&&(t.activeTab=Ze(t),e.persistTab(t.activeTab))}async function jr(e,t,a={}){return Na(e.adminHost,t,a)}async function fa(e,t,a={}){const{state:n,render:s,setFlash:i,clearFlash:r}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&n.adminCapabilities&&!n.adminCapabilities.uiEnabled&&i("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t=Ze(n)),t!=="admin"&&!W(n,t)&&(i("info","That section is disabled in system settings."),t=Ze(n)),t==="admin"){await e.activateAdminPage(n.adminPage||"overview",{...a,username:n.adminPage==="users"?n.adminSelectedUsername:null});return}n.activeTab=t,n.userMenuOpen=!1,n.listKeyboardFocus=!1,e.persistTab(t),$.event("tab",{tab:t}),t!=="calendars"&&(n.calModalOpen=!1,n.deleteConfirmId=null),t!=="contacts"&&(n.deleteAbConfirmId=null),a.clearFlash!==!1&&r(),n.busy=!0,s();try{t==="contacts"&&n.selectedAbId!==null?await e.loadContacts(n.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await e.loadTasks():t==="notes"?await e.loadNotes():t==="files"&&await e.loadFiles()}catch(l){$.warn("tab load failed",l instanceof Error?l.message:l),i("error",l instanceof Error?l.message:"Failed to load")}finally{n.busy=!1,s()}}async function Pe(e){var i;const{state:t}=e;$.debug("loadHome");const[a,n,s]=await Promise.all([h.calendars(),h.directory().catch(()=>({users:[]})),h.addressbooks()]);if(t.calendars=a.calendars,t.directory=n.users,t.addressBooks=s.addressbooks,$.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await h.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(l=>l.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),!t.calendarSelectionSeeded&&t.selectedIds.length===0){const r=_n((i=t.user)==null?void 0:i.username);if(r){const l=r.ids.filter(o=>t.calendars.some(c=>c.id===o));t.selectedIds=l,r.selectedId!==null&&t.calendars.some(o=>o.id===r.selectedId)?t.selectedId=r.selectedId:t.selectedId=l[0]??null,t.calendarSelectionSeeded=!0,$.debug("loadHome.calSelection.restored",{count:l.length,selectedId:t.selectedId})}else{const l=e.pickDefaultCalendar();l?(t.selectedIds=[l.id],t.selectedId=l.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id),t.calendarSelectionSeeded=!0}}else t.selectedIds.length===0?t.selectedId=null:t.calendarSelectionSeeded=!0;t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),rt(t),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await e.loadTasks(),t.activeTab==="notes"&&await e.loadNotes(),t.activeTab==="files"&&await e.loadFiles()}function Kr(e){const{state:t}=e;return Rt(t.portalUi.timeFormat)}function zr(e){const{state:t}=e;return qt(t.portalUi.weekStart)}function Wr(e){const{state:t}=e;return xa(t.portalUi.weekStart)}function Ga(e,t,a){const{state:n}=e;return On(t,a,n.portalUi.timeFormat)}function Jr(e,t,a,n,s){var c,f;const{state:i}=e,r=$e(a),l=((c=i.eventDtPicker)==null?void 0:c.viewY)??Number(r.date.slice(0,4)),o=((f=i.eventDtPicker)==null?void 0:f.viewM)??Number(r.date.slice(5,7))-1;return xn({field:t,value:a,dateOnly:n,allowClear:s,viewY:l,viewM:o,weekStart:i.portalUi.weekStart,timeFormat:i.portalUi.timeFormat})}function Dt(e){Ln(e.root)}function Ae(e,t){var b;const{state:a}=e,{field:n,name:s,label:i,value:r,dateOnly:l=!1,required:o,disabled:c,allowClear:f=!0}=t,m=((b=a.eventDtPicker)==null?void 0:b.field)===n,u=Ga(e,r,l);return`<div class="dt-field${m?" is-open":""}" data-dt-id="${d(n)}">
    <span class="dt-field-label">${d(i)}</span>
    <input type="hidden" name="${d(s)}" value="${d(r)}" ${o?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(n)}"
      data-dt-name="${d(s)}" data-dt-date-only="${l?"1":"0"}" data-dt-clear="${f?"1":"0"}"
      ${c?"disabled":""} aria-expanded="${m}">
      <span class="dt-trigger-text">${d(u)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${m&&!c?Jr(e,n,r,l,f):""}
  </div>`}function pa(e,t){var n,s,i,r,l,o,c,f;const{state:a}=e;return t==="start"?String(((n=a.editingEvent)==null?void 0:n.start)||""):t==="end"?String(((s=a.editingEvent)==null?void 0:s.end)||""):t==="until"?((r=(i=a.editingEvent)==null?void 0:i.repeat)==null?void 0:r.until)||we((l=a.editingEvent)==null?void 0:l.start)||N(new Date):t==="due"?he((o=a.editingTask)==null?void 0:o.due):t==="dtstart"?he((c=a.editingNote)==null?void 0:c.dtstart):t==="bulk-due"?a.bulkDueValue:t==="birthday"?String(((f=a.editingContact)==null?void 0:f.birthday)||""):""}function ba(e,t,a){const{state:n}=e;if(t==="start"&&n.editingEvent){n.editingEvent={...n.editingEvent,start:a||""};return}if(t==="end"&&n.editingEvent){n.editingEvent={...n.editingEvent,end:a};return}if(t==="until"&&n.editingEvent){n.editingEvent={...n.editingEvent,repeat:{...n.editingEvent.repeat??e.defaultRepeat(),until:a,endMode:"until"}};return}if(t==="due"&&n.editingTask){if(a===null||a==="")n.editingTask={...n.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))n.editingTask={...n.editingTask,due:new Date(a+"T00:00:00").toISOString()};else{const s=new Date((a.length===16,a));n.editingTask={...n.editingTask,due:Number.isNaN(s.getTime())?a:s.toISOString()}}return}if(t==="dtstart"&&n.editingNote){if(a===null||a==="")n.editingNote={...n.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))n.editingNote={...n.editingNote,dtstart:new Date(a+"T00:00:00").toISOString()};else{const s=new Date((a.length===16,a));n.editingNote={...n.editingNote,dtstart:Number.isNaN(s.getTime())?a:s.toISOString()}}return}if(t==="birthday"&&n.editingContact){n.editingContact={...n.editingContact,birthday:a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null};return}t==="bulk-due"&&(n.bulkDueValue=a||"")}function Yr(e,t){const{root:a}=e,n=hs[t];if(!n)return;const s=a.querySelector("#info-modal"),i=a.querySelector("#info-modal-title"),r=a.querySelector("#info-modal-body");if(!s||!i||!r)return;i.textContent=n.title,r.innerHTML=n.paragraphs.map(o=>`<p>${d(o)}</p>`).join(""),s.hidden=!1,document.body.classList.add("info-modal-open");const l=s.querySelector(".info-modal-close");l==null||l.focus()}function Gr(e){const{root:t}=e,a=t.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Qr(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const r=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await r.write(e)}finally{await r.close()}return"saved"}catch(i){if(i instanceof DOMException&&i.name==="AbortError")return"cancelled"}const n=URL.createObjectURL(e),s=document.createElement("a");return s.href=n,s.download=t,s.rel="noopener",s.style.display="none",document.body.appendChild(s),s.click(),window.setTimeout(()=>{URL.revokeObjectURL(n),s.remove()},6e4),"started"}function Xr(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let n=a.value.trim();n&&!n.startsWith("#")&&(n=`#${n}`),/^#[0-9A-Fa-f]{6}/.test(n)&&(t.value=n.slice(0,7),a.value=n.toUpperCase())}))}function Zr(e){const t=us({activeTab:Er(),adminPage:Pr(),adminSelectedUsername:zt().adminUsername??null});let a,n,s,i,r,l,o;function c(g,D){ka(t,g,D)}function f(){ps(t)}function m(){const g=Zt(e);t.user?Fr(o):Xt(e,t,(D,P)=>vt(t,D,P,{renderImportProgressModal:()=>je(s),renderFilesUploadProgressModal:()=>He(a)})),Ur(o),ea(e,g),requestAnimationFrame(()=>{var D;Dt(o),(D=e.querySelector(".dt-time.is-selected"))==null||D.scrollIntoView({block:"center"})})}function u(){se(s)}function b(){ke(a)}function y(){j(a)}function p(){Et(t)}function w(){ae(a)}function k(){bs(t,{stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,resetFilesTransferTree:y,unbindUserMenuOutside:p,unbindFilesUploadMenuOutside:w})}function S(g){gs(t,{message:g,clearSession:k,render:m})}function v(){return{state:t,render:m,handleSessionExpired:S,clearPortalSessionState:k,normalizeActiveTab:()=>St(o),persistTab:kt,loadHome:()=>Pe(o),loadAdminCapabilities:()=>Ut(n),loadAdminDashboard:()=>at(n),loadAdminUsers:()=>me(n),loadAdminUserDetail:g=>J(n,g),loadAdminUserResources:g=>fe(n,g),loadAdminSystemSettings:()=>st(n),loadAdminDatabaseSettings:()=>nt(n),adminPageMeta:g=>re(n,g),setFlash:c,clearFlash:f}}a={state:t,root:e,render:m,setFlash:c,clearFlash:f},n={state:t,root:e,render:m,setFlash:c,clearFlash:f,userIsAdmin:()=>ue(t),adminUiEnabled:()=>Le(t),persistTab:kt,activateTab:(g,D)=>fa(o,g,D),loadHome:()=>Pe(o),normalizeActiveTab:()=>St(o)},s={state:t,root:e,render:m,setFlash:c,clearFlash:f,localeWeekStart:()=>zr(o),localeDowLabels:()=>Wr(o),formatDtDisplay:(g,D)=>Ga(o,g,D),timeFormatOpts:()=>Kr(o),renderPortalDateTimeField:g=>Ae(o,g),getDtFieldCurrentValue:g=>pa(o,g),setDtFieldValue:(g,D)=>ba(o,g,D),positionDtPopovers:()=>Dt(o),renderFlashBanner:()=>Ct(t),accessBadge:da,formatImportResult:ht,loadHome:()=>Pe(o),onImportContacts:g=>kr(l,g)},i={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>Ae(o,g)},r={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>Ae(o,g)},l={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>Ae(o,g),stopImportElapsedTimer:()=>se(s),startImportElapsedTimer:()=>Ra(s),setImportPhase:(g,D)=>Oe(s,g,D),applyServerImportProgress:g=>qa(s,g),readFileTextWithProgress:(g,D)=>Va(s,g,D),formatImportResult:ht,loadHome:()=>Pe(o)},o={state:t,root:e,render:m,setFlash:c,clearFlash:f,filesHost:a,adminHost:n,calendarsHost:s,notesHost:i,tasksHost:r,contactsHost:l,clearPortalSessionState:k,userIsAdmin:()=>ue(t),adminUiEnabled:()=>Le(t),normalizeActiveTab:()=>St(o),persistTab:kt,activateTab:(g,D)=>fa(o,g,D),activateAdminPage:(g,D)=>jr(o,g,D),loadHome:()=>Pe(o),handleSessionExpired:S,loadFiles:()=>te(a),loadShares:g=>Vt(s,g),loadMonthEvents:()=>ft(s),loadContacts:g=>jt(l,g),loadTasks:()=>it(r),loadNotes:()=>Ka(i),loadAdminCapabilities:()=>Ut(n),loadAdminDashboard:()=>at(n),loadAdminUsers:()=>me(n),loadAdminUserDetail:g=>J(n,g),loadAdminUserResources:g=>fe(n,g),loadAdminSystemSettings:()=>st(n),loadAdminDatabaseSettings:()=>nt(n),adminPageMeta:g=>re(n,g),pickDefaultCalendar:()=>Rn(s),toggleCalendarSelected:g=>Bn(s,g),blankEventForDay:(g,D)=>Wn(s,g,D),defaultRepeat:()=>Ht(),itemKey:L,openContact:g=>yr(l,g),startNewContact:()=>vr(l),emptyAddress:()=>Wa(),syncEditingEventFromForm:g=>Jn(s,g),syncEditingTaskFromForm:g=>fr(r,g),syncEditingNoteFromForm:g=>ir(i,g),runBulkTaskAction:g=>pr(r,g),shell:(g,D)=>vt(t,g,D,{renderImportProgressModal:()=>je(s),renderFilesUploadProgressModal:()=>He(a)}),renderLogin:()=>Xt(e,t,(g,D)=>vt(t,g,D,{renderImportProgressModal:()=>je(s),renderFilesUploadProgressModal:()=>He(a)})),renderFlashBanner:()=>Ct(t),renderMonthGrid:()=>jn(s),renderEventModal:()=>zn(s),renderImportProgressModal:()=>je(s),renderFilesUploadProgressModal:()=>He(a),renderTasksTab:()=>mr(r),renderNotesTab:()=>rr(i),renderFilesTab:()=>en(a),renderAdminSection:()=>En(n),adminSubnavButtons:()=>rn(n),renderPortalDateTimeField:g=>Ae(o,g),getDtFieldCurrentValue:g=>pa(o,g),setDtFieldValue:(g,D)=>ba(o,g,D),positionDtPopovers:()=>Dt(o),accessBadge:da,formatImportResult:ht,closeImportProgress:()=>Yn(s),closeFilesUploadProgress:()=>Aa(a),resetFilesTransferTree:y,stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,unbindUserMenuOutside:p,bindUserMenuOutside:()=>Ds(t,m),unbindFilesUploadMenuOutside:w,bindFilesUploadMenuOutside:()=>Ws(a),onLogin:g=>ws(g,v()),onShare:g=>Xn(s,g),onSaveEvent:g=>Zn(s,g),onEditCal:g=>er(s,g),onCreateCal:g=>tr(s,g),onSaveContact:g=>hr(l,g),onCreateAb:g=>Sr(l,g),onEditAb:g=>Dr(l,g),onSaveTask:g=>br(r,g),onSaveNote:g=>lr(i,g),bindColorPair:Xr,bindImportInput:()=>void 0,bindHolidaysToggle:()=>ar(s),bindContactPhotoInput:()=>void 0,bindFilesDom:()=>Ia(a),bindAdminDom:()=>void 0,saveBlobAsFile:Qr,openInfoModal:g=>Yr(o,g),closeInfoModal:()=>Gr(o),captureScroll:()=>Zt(e),restoreScroll:g=>ea(e,g)},Mr(o),$s(v())}let ie="",T=null,A=!1,B=null,G=null,ee="sqlite",lt=!1;async function pt(e,t={}){const a={Accept:"application/json",...t.headers};t.body&&(a["Content-Type"]="application/json"),ie&&t.method&&t.method!=="GET"&&(a["X-CSRF-Token"]=ie);const n=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:a});let s;try{s=await n.json()}catch{throw new Error(`Request failed (${n.status})`)}if(!n.ok)throw new Error(s.error||`Request failed (${n.status})`);return s&&typeof s=="object"&&"data"in s&&s.data!==void 0?s.data:s}async function Wt(){var e;T=await pt("/status"),ie=T.csrfToken||ie,((e=T.defaults)==null?void 0:e.backend)==="pgsql"?ee="pgsql":ee="sqlite"}function Fe(e,t,a){return`<label class="check-row"><input type="checkbox" name="${d(e)}" ${t?"checked":""} ${A?"disabled":""} /> ${d(a)}</label>`}function ei(){const e=T==null?void 0:T.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${d((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${d((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${Y("error",(T==null?void 0:T.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${A?"disabled":""}>Retry</button>
  </section>`}function ti(){const e=T==null?void 0:T.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${A?"disabled":""}>
          ${Oa((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Fe("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${Fe("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${Fe("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Fe("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Fe("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${A?"disabled":""}>
          ${["Digest","Basic","Apache"].map(t=>`<option value="${t}" ${((e==null?void 0:e.dav_auth_type)||"Digest")===t?"selected":""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${d((e==null?void 0:e.invite_from)||"")}" ${A?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${d(String((e==null?void 0:e.session_max_age_minutes)??15))}" ${A?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${A?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${A?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${A?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function ai(){const e=T==null?void 0:T.defaults,t=(T==null?void 0:T.pdoDrivers)||[],a=t.includes("sqlite"),n=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${A?"disabled":""}>
          ${a?`<option value="sqlite" ${ee==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${n?`<option value="pgsql" ${ee==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${ee==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${d((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${A?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${ee==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${d((e==null?void 0:e.pgsql_host)||"")}" placeholder="localhost:5432" ${A?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${d((e==null?void 0:e.pgsql_dbname)||"")}" ${A?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${d((e==null?void 0:e.pgsql_username)||"")}" autocomplete="off" ${A?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${A?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${A?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${A?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${A?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function si(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${d(String((T==null?void 0:T.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${d((T==null?void 0:T.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${lt?"checked":""} ${A?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${A||!lt?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function ni(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${d((T==null?void 0:T.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function ri(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${Y("error",(T==null?void 0:T.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function V(){const e=document.getElementById("app");if(!e)return;const t=(T==null?void 0:T.step)||"permissions";let a="";T?t==="permissions"?a=ei():t==="initialize"?a=ti():t==="database"?a=ai():t==="upgrade"?a=si():t==="done"?a=ni():t==="locked"?a=ri():a=`<section class="card"><p>Unknown step: ${d(t)}</p></section>`:a='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${d((T==null?void 0:T.productVersion)||"…")}</span>
            ${T!=null&&T.configuredVersion?` · configured <span class="mono">${d(String(T.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${T!=null&&T.step?`<span class="badge badge-admin">${d(T.step)}</span>`:""}
      </header>
      ${B?Y("error",B,{dismissible:!1}):""}
      ${G?Y("success",G,{dismissible:!1}):""}
      ${a}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,ii()}function ii(){var t,a,n,s,i,r;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{li()}),(a=e.querySelector('[data-action="backend-change"]'))==null||a.addEventListener("change",l=>{ee=l.target.value==="pgsql"?"pgsql":"sqlite",V()}),(n=e.querySelector('[data-action="upgrade-toggle"]'))==null||n.addEventListener("change",l=>{lt=!!l.target.checked,V()}),(s=e.querySelector('[data-action="upgrade-run"]'))==null||s.addEventListener("click",()=>{ci()}),(i=e.querySelector('[data-form="initialize"]'))==null||i.addEventListener("submit",l=>{l.preventDefault(),oi(l.target)}),(r=e.querySelector('[data-form="database"]'))==null||r.addEventListener("submit",l=>{l.preventDefault(),di(l.target)}))}async function li(){A=!0,B=null,V();try{await Wt(),G=null}catch(e){B=e instanceof Error?e.message:"Failed to load installer status"}finally{A=!1,V()}}async function oi(e){const t=new FormData(e),a=s=>{var i;return!!((i=e.querySelector(`input[name="${s}"]`))!=null&&i.checked)},n={timezone:String(t.get("timezone")??"").trim(),cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};A=!0,B=null,G=null,V();try{T=await pt("/initialize",{method:"POST",body:JSON.stringify(n)}),ie=T.csrfToken||ie,G="Server settings saved. Configure the database next.",$.event("install.initialize")}catch(s){B=s instanceof Error?s.message:"Initialize failed"}finally{A=!1,V()}}async function di(e){const t=new FormData(e),a=String(t.get("backend")??ee),n={backend:a,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};a==="sqlite"?n.sqlite_file=String(t.get("sqlite_file")??"").trim():(n.pgsql_host=String(t.get("pgsql_host")??"").trim(),n.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),n.pgsql_username=String(t.get("pgsql_username")??"").trim(),n.pgsql_password=String(t.get("pgsql_password")??"")),A=!0,B=null,G=null,V();try{T=await pt("/database",{method:"POST",body:JSON.stringify(n)}),ie=T.csrfToken||ie,G="Database configured. Installer is locked.",$.event("install.database"),T.completed||T.step}catch(s){B=s instanceof Error?s.message:"Database setup failed"}finally{A=!1,V()}}async function ci(){if(lt){A=!0,B=null,G=null,V();try{const e=await pt("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});G="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),$.event("install.upgrade"),await Wt()}catch(e){B=e instanceof Error?e.message:"Upgrade failed"}finally{A=!1,V()}}}async function ui(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Wt()}catch(t){B=t instanceof Error?t.message:"Failed to load installer"}V()}const Ot=document.getElementById("app");if(!Ot)throw new Error("#app missing");const ga=window.location.pathname.replace(/\/+$/,"")||"/";ga==="/portal/install"||ga.endsWith("/portal/install")?ui(Ot):Zr(Ot);
