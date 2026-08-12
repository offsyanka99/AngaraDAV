var Ba=Object.defineProperty;var Va=(e,t,n)=>t in e?Ba(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var dt=(e,t,n)=>Va(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function n(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(a){if(a.ep)return;a.ep=!0;const r=n(a);fetch(a.href,r)}})();const Vt={off:0,error:1,warn:2,info:3,debug:4};let Ee="off";const Ke="[angaradav-portal]";function Ha(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function za(e){return Ee=Ha(e),Ee!=="off"&&console.info(Ke,`log level = ${Ee}`),Ee}function ia(e){return Vt[Ee]>=Vt[e]}function Me(e,t,n,s){if(!ia(e))return;const a=[Ke,n];s!==void 0&&a.push(s),console[t](...a)}function Ka(e,t){ia("info")&&(t&&Object.keys(t).length>0?console.info(Ke,`event:${e}`,t):console.info(Ke,`event:${e}`))}const h={error(e,t){Me("error","error",e,t)},warn(e,t){Me("warn","warn",e,t)},info(e,t){Me("info","info",e,t)},debug(e,t){Me("debug","debug",e,t)},event:Ka};class M extends Error{constructor(n,s,a={}){super(n);dt(this,"status");dt(this,"payload");this.status=s,this.payload=a}}let le="",Re=null,Be=null;function Ve(e){le=e&&typeof e=="string"?e:""}function ja(e){Re=e}function Wa(e){Be=e}function Ct(e){if(!la(e))try{Be==null||Be()}catch{}}function la(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function je(e,t){if(!la(e)){Ve("");try{Re==null||Re(t||"Session timed out. Please sign in again.")}catch{}}}async function E(e,t={}){const n=new Headers(t.headers);t.body&&!n.has("Content-Type")&&n.set("Content-Type","application/json");const s=(t.method||"GET").toUpperCase();s!=="GET"&&s!=="HEAD"&&s!=="OPTIONS"&&le&&n.set("X-CSRF-Token",le);const a=typeof performance<"u"?performance.now():Date.now();h.debug(`api → ${s} ${e}`);const r=await fetch(`/api${e}`,{...t,headers:n,credentials:"same-origin"});let i=null;const l=await r.text();if(l)try{i=JSON.parse(l)}catch{i={error:l}}const d=Math.round((typeof performance<"u"?performance.now():Date.now())-a);if(!r.ok){let c=`Request failed (${r.status})`,f={};if(i&&typeof i=="object"&&i!==null){const m=i;f={...m},typeof m.error=="string"&&(c=m.error)}else(r.status===500||r.status===504)&&(c="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw r.status>=500?h.error(`api ← ${s} ${e} ${r.status} (${d}ms)`,c):r.status!==401?h.warn(`api ← ${s} ${e} ${r.status} (${d}ms)`,c):(h.debug(`api ← ${s} ${e} 401 (${d}ms)`),je(e,c)),new M(c,r.status,f)}return h.info(`api ← ${s} ${e} ${r.status} (${d}ms)`),Ct(e),i}function R(e){return encodeURIComponent(e)}async function Ht(e,t,n,s){const a=new Headers({"Content-Type":n,Accept:"application/x-ndjson, application/json;q=0.9"});le&&a.set("X-CSRF-Token",le);const r=typeof performance<"u"?performance.now():Date.now();h.debug(`api → POST ${e} (stream, ${n}, ${t.length} bytes)`);let i;try{i=await fetch(`/api${e}`,{method:"POST",headers:a,credentials:"same-origin",body:t})}catch(p){const $=p instanceof Error?p.message:"Network error";throw h.error(`api ← POST ${e} network fail`,$),new M(`Import request failed to start (${$}). Check connectivity and container logs.`,0)}const l=(i.headers.get("Content-Type")||"").toLowerCase(),d=l.includes("ndjson")||l.includes("x-ndjson");if(!i.ok&&!d){let p=`Request failed (${i.status})`;try{const $=await i.json();$.error&&(p=$.error)}catch{}throw(i.status===504||i.status===502)&&(p="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),i.status===401?(h.debug(`api ← POST ${e} 401`,p),je(e,p)):h.warn(`api ← POST ${e} ${i.status}`,p),new M(p,i.status)}if(!d&&i.ok){try{const p=await i.json();if(p&&typeof p.error=="string")throw new M(p.error,i.status||500);if(p&&typeof p.imported=="number"&&typeof p.updated=="number")return h.info(`api ← POST ${e} json done`),p}catch(p){if(p instanceof M)throw p}throw new M("Unexpected import response from server",500)}if(!i.body)throw new M("Import stream unavailable",500);const c=i.body.getReader(),f=new TextDecoder;let m="";const u={final:null,error:null,sawProgress:!1},b=p=>{let $;try{$=JSON.parse(p)}catch{h.debug("import stream non-JSON line",p.slice(0,80));return}if($.type==="progress"){u.sawProgress=!0;const k=Number($.total)||0,w=Number($.current)||0,v=typeof $.percent=="number"?$.percent:k>0?Math.round(100*w/k):0;s==null||s({percent:v,current:w,total:k,imported:Number($.imported)||0,updated:Number($.updated)||0,skipped:Number($.skipped)||0})}else $.type==="done"&&$.result?u.final=$.result:$.type==="error"&&(u.error={message:$.error||"Import failed",status:$.status||500})};for(;;){const{done:p,value:$}=await c.read();if(p)break;m+=f.decode($,{stream:!0});const k=m.split(`
`);m=k.pop()??"";for(const w of k){const v=w.trim();v&&b(v)}}m.trim()&&b(m.trim());const y=Math.round((typeof performance<"u"?performance.now():Date.now())-r);if(u.error)throw u.error.status===401?(h.debug(`api ← POST ${e} stream 401 (${y}ms)`,u.error.message),je(e,u.error.message)):h.warn(`api ← POST ${e} stream error (${y}ms)`,u.error.message),new M(u.error.message,u.error.status);if(!u.final)throw h.error(`api ← POST ${e} stream incomplete (${y}ms)`,{sawProgress:u.sawProgress}),new M(u.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return h.info(`api ← POST ${e} stream done (${y}ms)`),Ct(e),u.final}const S={ui:()=>E("/ui"),installStatus:async()=>{const e=await E("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e},adminPing:()=>E("/admin/ping"),adminDashboard:()=>E("/admin/dashboard"),adminCapabilities:()=>E("/admin/capabilities"),adminUsers:()=>E("/admin/users"),adminUser:e=>E(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>E("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>E(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>E(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>E(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>E(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,n)=>E(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(n)}),adminDeleteUserCalendar:(e,t,n=!0)=>E(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:n})}),adminUserAddressBooks:e=>E(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>E(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,n)=>E(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(n)}),adminDeleteUserAddressBook:(e,t,n=!0,s=!1)=>E(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:n,force:s})}),adminSystemSettings:()=>E("/admin/settings/system"),adminUpdateSystemSettings:e=>E("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>E("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>E("/admin/settings/database"),adminTestDatabaseConnection:e=>E("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>E("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await E("/me");return Ve(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)||""),e},login:async(e,t)=>{var s;const n=await E("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return Ve((s=n.user)==null?void 0:s.csrfToken),n},logout:async()=>{try{return await E("/logout",{method:"POST"})}finally{Ve("")}},calendars:()=>E("/calendars"),createCalendar:e=>E("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>E("/holidays/countries"),updateCalendar:(e,t)=>E(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>E(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,n)=>{const s=new URLSearchParams({from:t,to:n}).toString();return E(`/calendars/${e}/events?${s}`)},getEvent:(e,t)=>E(`/calendars/${e}/events/${R(t)}`),createEvent:(e,t)=>E(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,n)=>E(`/calendars/${e}/events/${R(t)}`,{method:"PATCH",body:JSON.stringify(n)}),deleteEvent:(e,t)=>E(`/calendars/${e}/events/${R(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let i=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(i=l.error)}catch{}throw new M(i,t.status)}const n=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(n),a=(s==null?void 0:s[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:a}},importCalendar:(e,t,n)=>Ht(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",n),directory:()=>E("/directory"),shares:e=>E(`/calendars/${e}/shares`),share:(e,t,n)=>E(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:n})}),revoke:(e,t)=>E(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})}),addressbooks:()=>E("/addressbooks"),createAddressBook:e=>E("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>E(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>E(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let i=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(i=l.error)}catch{}throw new M(i,t.status)}const n=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(n),a=(s==null?void 0:s[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:a}},importAddressBook:(e,t,n)=>Ht(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",n),contacts:(e,t="")=>{const n=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return E(`/addressbooks/${e}/contacts${n}`)},getContact:(e,t)=>E(`/addressbooks/${e}/contacts/${R(t)}`),createContact:(e,t)=>E(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,n)=>E(`/addressbooks/${e}/contacts/${R(t)}`,{method:"PATCH",body:JSON.stringify(n)}),deleteContact:(e,t)=>E(`/addressbooks/${e}/contacts/${R(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const n=await fetch(`/api/addressbooks/${e}/contacts/${R(t)}/export`,{credentials:"same-origin"});if(!n.ok){let l=`Export failed (${n.status})`;try{const d=await n.json();d.error&&(l=d.error)}catch{}throw new M(l,n.status)}const s=n.headers.get("Content-Disposition")||"",a=/filename="([^"]+)"/i.exec(s),r=(a==null?void 0:a[1])||"contact.vcf";return{blob:await n.blob(),filename:r}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${R(t)}/photo`,tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const n=t.toString()?`?${t}`:"";return E(`/tasks${n}`)},createTask:e=>E("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,n)=>E(`/tasks/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(n)}),deleteTask:(e,t)=>E(`/tasks/${e}/${R(t)}`,{method:"DELETE"}),bulkTasks:e=>E("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const n=t.toString()?`?${t}`:"";return E(`/notes${n}`)},createNote:e=>E("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,n)=>E(`/notes/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(n)}),deleteNote:(e,t)=>E(`/notes/${e}/${R(t)}`,{method:"DELETE"}),filesStatus:()=>E("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const n=t.toString()?`?${t}`:"";return E(`/files/entries${n}`)},filesMkdir:(e,t)=>E("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,n={})=>{const s=new URLSearchParams;e&&s.set("path",e),s.set("name",t.name),n.replace&&s.set("replace","1");const a=new FormData;a.append("file",t,t.name),e&&a.append("path",e);const r=typeof performance<"u"?performance.now():Date.now();return h.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((i,l)=>{const d=new XMLHttpRequest;d.open("POST",`/api/files/upload?${s}`),d.withCredentials=!0,le&&d.setRequestHeader("X-CSRF-Token",le),n.onProgress&&(d.upload.onprogress=c=>{var f,m;c.lengthComputable?(f=n.onProgress)==null||f.call(n,c.loaded,c.total):(m=n.onProgress)==null||m.call(n,c.loaded,t.size||c.loaded)}),d.onload=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-r);let f=null;const m=d.responseText||"";if(m)try{f=JSON.parse(m)}catch{f={error:m}}const u=d.status;if(u<200||u>=300){let b=`Upload failed (${u||0})`;f&&typeof f=="object"&&f!==null&&"error"in f&&typeof f.error=="string"&&(b=f.error),u===401?(h.debug(`api ← POST /files/upload 401 (${c}ms)`,b),je("/files/upload",b)):u>=500?h.error(`api ← POST /files/upload ${u} (${c}ms)`,b):h.warn(`api ← POST /files/upload ${u} (${c}ms)`,b),l(new M(b,u||0));return}h.info(`api ← POST /files/upload 200 (${c}ms)`),Ct("/files/upload"),i(f)},d.onerror=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-r);h.error(`api ← POST /files/upload network error (${c}ms)`),l(new M("Upload failed (network error)",0))},d.onabort=()=>{l(new M("Upload cancelled",0))},d.send(a)})},filesDownloadUrl:e=>{const t=new URLSearchParams;return t.set("path",e),`/api/files/download?${t}`},filesDelete:e=>E("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>E("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,n)=>E("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:n})}),filesCopy:(e,t={})=>E("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>E("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},da="angaradav-portal-tab",oa="angaradav-portal-admin-page",Ja="2.2.1",Ya="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ga(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,escapeBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off"},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:Ja,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,checkedFilePaths:[],filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}function o(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function W(e,t,n={}){if(!t)return"";const s=n.dismissible!==void 0?n.dismissible:n.dismissAction!==void 0,a=n.dismissAction??"flash-close",r=n.role??"status",i=n.className?` ${n.className}`:"",l=n.style?` style="${o(n.style)}"`:"",d=s?`<button type="button" class="flash-close" data-action="${o(a)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${o(e)}${i}" role="${o(r)}"${l}>
      <span class="flash-text">${o(t)}</span>
      ${d}
    </div>`}function Qa(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function Xa(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function Et(e){return e.map(n=>{const s=n.type??"button",a=Xa(n.variant),r=n.disabled?" disabled":"",i=n.id?` id="${o(n.id)}"`:"",l=n.action?` data-action="${o(n.action)}"`:"",d=n.attrs?` ${n.attrs}`:"";return`<button type="${s}" class="${a}"${l}${i}${d}${r}>${o(n.label)}</button>`}).join(`
`)}function N(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),n=e.id?` id="${o(e.id)}"`:"",s=e.className?` ${e.className}`:"",a=e.rootAttrs?` ${e.rootAttrs}`:"",r=`${Qa(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,i=e.closeAction,l=e.lockBackdrop?"":` data-action="${o(i)}"`,d=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${o(i)}" aria-label="Close">×</button>`;let c="";e.footer!==void 0&&(c=typeof e.footer=="string"?e.footer:Et(e.footer));const f=c?`<footer class="cal-modal-footer">${c}</footer>`:"",m=`<div class="cal-modal-body">${e.body}</div>`;let u;return e.form?u=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${m}
        ${f}
      </form>`:u=`${m}
      ${f}`,`<div class="cal-modal${s}"${n}${a} role="dialog" aria-modal="true" aria-labelledby="${o(t)}">
      <div class="cal-modal-backdrop"${l}></div>
      <div class="cal-modal-card${r}">
        <header class="cal-modal-header">
          <h3 id="${o(t)}">${o(e.title)}</h3>
          ${d}
        </header>
        ${u}
      </div>
    </div>`}function et(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",n=e.style==="checkbox"?' style="margin-top:1rem"':"",s=e.id?` id="${o(e.id)}"`:"",a=e.checked?" checked":"",r=e.disabled?" disabled":"";return`<label class="${t}"${n}>
            <input type="checkbox"${s} data-action="${o(e.action)}"${a}${r} />
            ${o(e.label)}
          </label>`}function ca(e,t,n){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:n})}function Za(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function yt(e){return e.flash?W(e.flash.type,e.flash.message,{dismissible:!0}):""}function de(e){var t,n;return!!((t=e.user)!=null&&t.isAdmin||((n=e.user)==null?void 0:n.role)==="Admin")}function Fe(e){return de(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function He(e,t){if(!t)return;const n=(t.timeFormat||"auto").toLowerCase(),s=(t.weekStart||"auto").toLowerCase();e.portalUi={timeFormat:n==="12h"||n==="24h"?n:"auto",weekStart:s==="monday"||s==="sunday"?s:"auto",logLevel:t.logLevel||"off"},za(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function Pt(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function vt(e,t){if(Pt(e),!e.user)return;const n=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},n)}function en(e,t){Pt(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function tn(e,t){if(!e.handlingSessionExpiry){if(!e.user){Pt(e);return}e.handlingSessionExpiry=!0;try{h.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function an(e,t){const n=String(t.step||"");n==="upgrade"||n==="initialize"||n==="permissions"||n==="database"?(e.installGate={step:n,message:t.message||(n==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function nn(e,t){if(!(t instanceof M)||t.status!==503)return!1;const n=typeof t.payload.code=="string"?t.payload.code:"";if(n!=="upgrade_required"&&n!=="not_configured"&&n!=="admin_password_missing")return!1;const s=n==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:s,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function ua(e){var n,s,a,r;const{state:t}=e;if(t.activeTab==="admin"&&de(t)&&Fe(t))try{t.adminPage==="overview"&&((n=e.adminPageMeta("overview"))==null?void 0:n.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((s=e.adminPageMeta("users"))==null?void 0:s.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((a=e.adminPageMeta("settings"))==null?void 0:a.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((r=e.adminPageMeta("database"))==null?void 0:r.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(i){h.warn("admin page load",i instanceof Error?i.message:i)}}async function sn(e){var n;const{state:t}=e;h.event("bootstrap.start"),ja(s=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(s)?s:"Your session timed out. Please sign in again.")}),Wa(()=>{vt(t,s=>e.handleSessionExpired(s))});try{const s=await S.installStatus();an(t,s)}catch(s){h.debug("bootstrap: /api/install/status failed",s instanceof Error?s.message:s)}try{const s=await S.ui();He(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""?t.appVersion=s.version.trim():s.ui&&typeof s.ui.version=="string"&&s.ui.version.trim()!==""&&(t.appVersion=s.ui.version.trim())}catch(s){h.debug("bootstrap: /api/ui failed",s instanceof Error?s.message:s),nn(t,s)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),h.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const s=await S.me();if(!s.user)e.clearPortalSessionState(),He(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),h.event("bootstrap.anonymous");else{if(t.user=s.user,He(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),h.event("bootstrap.session",{username:((n=t.user)==null?void 0:n.username)??null}),vt(t,a=>e.handleSessionExpired(a)),de(t))try{await e.loadAdminCapabilities()}catch(a){h.warn("admin.capabilities bootstrap",a instanceof Error?a.message:a)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await ua(e)}}catch(s){s instanceof M&&s.status===401?(e.clearPortalSessionState(),h.event("bootstrap.anonymous")):(h.error("bootstrap failed",s instanceof Error?s.message:s),ca(t,"error",s instanceof Error?s.message:"Failed to load"))}e.render()}async function rn(e,t){var i;const{state:n}=t,s=new FormData(e),a=String(s.get("username")??""),r=String(s.get("password")??"");n.busy=!0,t.clearFlash(),t.render(),h.event("login.attempt",{username:a});try{const l=await S.login(a,r);if(n.user=l.user,He(n,l.ui),h.event("login.ok",{username:((i=n.user)==null?void 0:i.username)??a}),vt(n,d=>t.handleSessionExpired(d)),de(n))try{await t.loadAdminCapabilities()}catch(d){h.warn("admin.capabilities login",d instanceof Error?d.message:d)}t.normalizeActiveTab(),t.persistTab(n.activeTab,n.adminPage),await t.loadHome(),await ua(t),t.setFlash("success","Signed in")}catch(l){h.warn("login.failed",l instanceof Error?l.message:l),t.setFlash("error",l instanceof Error?l.message:"Login failed")}finally{n.busy=!1,t.render()}}function zt(e,t,n){const s=t.installGate,a=s&&(s.step==="upgrade"||s.step==="initialize"||s.step==="permissions"||s.step==="database"),r=(s==null?void 0:s.installUrl)||"/portal/install/";let i="";if(a&&s){const d=s.step==="upgrade"?"Server upgrade required":"Setup incomplete",c=s.step==="upgrade"&&(s.configuredVersion||s.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${o(String(s.configuredVersion||"—"))}</span>
              → product <span class="mono">${o(String(s.productVersion||"—"))}</span></p>`:"";i=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${o(d)}.</strong>
            ${o(s.message||"Complete the installer before signing in.")}
            ${c}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${o(r)}">Open installer</a>
        </p>`}const l=t.busy||!!a;e.innerHTML=n(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${i}
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
      </div>`,{auth:!0})}function Kt(e){const t=e.querySelector(".contacts-table-wrap"),n=e.querySelector(".contacts-ab-list"),s=e.querySelector(".calendars-owned-list"),a=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(n==null?void 0:n.scrollTop)??null,calListTop:(s==null?void 0:s.scrollTop)??null,filesTableTop:(a==null?void 0:a.scrollTop)??null}}function jt(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const n=e.querySelector(".contacts-table-wrap");n&&(n.scrollTop=t.tableTop)}if(t.abListTop!==null){const n=e.querySelector(".contacts-ab-list");n&&(n.scrollTop=t.abListTop)}if(t.calListTop!==null){const n=e.querySelector(".calendars-owned-list");n&&(n.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const n=e.querySelector(".files-table-wrap");n&&(n.scrollTop=t.filesTableTop)}})})}function ln(e){const t=e.confirmDelete;if(!t)return"";const n=t.detail?`<p class="muted small" style="margin:0.75rem 0 0">${o(t.detail)}</p>`:"";return N({id:"portal-confirm-delete-modal",title:t.title,titleId:"portal-confirm-delete-title",closeAction:"confirm-delete-cancel",size:"sm",body:`<p style="margin:0">${o(t.message)}</p>${n}`,footer:[{label:"Cancel",action:"confirm-delete-cancel",variant:"ghost",disabled:e.busy},{label:"Delete",action:"confirm-delete-ok",variant:"danger",disabled:e.busy}]})}function Wt(e){e.confirmDelete=null}const dn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Download (files), create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function x(e,t,n="h2"){const s=n;return`<div class="section-title-row">
    <${s}>${o(e)}</${s}>
    <button type="button" class="info-btn" data-action="info" data-info="${o(t)}"
      aria-label="About ${o(e)}" title="About ${o(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function on(){return`
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
    </div>`}function ot(e,t,n={},s){const a=!!e.user&&e.activeTab==="admin"&&de(e)&&Fe(e),l=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${o(a?"Administration Portal":"User Portal")}</span></span>`,d=e.user?o(e.user.displayname||e.user.username):"",c=Fe(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",f=a?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",m=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${d}">
              <span class="user-menu-name">${d}</span>
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
        </nav>`,y=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesUploadConflict!==null||e.filesUploadProgress!==null||e.confirmDelete!==null)?yt(e):"",p=n.tabs&&n.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${n.tabs}
        </div>
      </div>`:"",$=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${o(e.appVersion)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${o(Ya)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return n.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${u}
      ${p}
    </div>
      <main class="container">
        ${y}
        ${t}
      </main>
      ${$}
      ${on()}
      ${ln(e)}
      ${s.renderImportProgressModal()}
      ${s.renderFilesUploadProgressModal()}`}function $t(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function cn(e,t){$t(e),e.userMenuDocClick=s=>{var r;const a=s.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".user-menu")||(e.userMenuOpen=!1,$t(e),t())};const n=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===n&&document.addEventListener("click",n,!0)},0)}function We(e){e.dtPickerDocClick&&(document.removeEventListener("click",e.dtPickerDocClick,!0),e.dtPickerDocClick=null)}function un(e,t){if(We(e),!e.eventDtPicker)return;e.dtPickerDocClick=s=>{var r,i;const a=s.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".dt-field.is-open, .dt-popover, [data-dt-popover]")||(i=a==null?void 0:a.closest)!=null&&i.call(a,'[data-action="dt-open"]')||(e.eventDtPicker=null,We(e),t())};const n=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===n&&document.addEventListener("click",n,!0)},0)}async function Z(e){e.state.filesLoading=!0;try{h.debug("loadFiles",{path:e.state.filesPath});const[t,n]=await Promise.all([S.filesStatus(),S.filesList(e.state.filesPath).catch(s=>{if(s instanceof M&&(s.status===503||s.status===404))return{path:e.state.filesPath,entries:[]};throw s})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=n.path,e.state.filesEntries=n.entries;const s=new Set(e.state.filesEntries.map(a=>a.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(a=>s.has(a))}else e.state.filesEntries=[],e.state.checkedFilePaths=[];h.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function ma(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Ue(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function tt(e,t,n){for(const s of n)if(s&&(t===s||t.startsWith(`${s}/`)))return!0;return!1}function z(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function xe(e,t,n){if(n.length===0)return;e.state.filesTransfer={op:t,paths:[...n]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const s=new Set([""]);if(e.state.filesPath){const a=e.state.filesPath.split("/").filter(Boolean);let r="";for(const i of a)r=r?`${r}/${i}`:i,s.add(r)}e.state.filesTreeExpanded=[...s],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),e.clearFlash(),e.render(),await Promise.all([...s].map(a=>kt(e,a)))}async function kt(e,t){const n=e.state.filesTreeChildren[t];if(!(n&&n!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const a=(await S.filesList(t)).entries.filter(r=>r.type==="dir").slice().sort((r,i)=>r.name.localeCompare(i.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:a}}catch(s){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},h.warn("files.tree",{path:t||"/",error:s instanceof Error?s.message:String(s)})}e.render()}}function mn(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,n=[],s=(a,r)=>{const i=e.state.filesTransferDest===a,l=tt(e,a,t),d=e.state.filesTreeExpanded.includes(a),c=e.state.filesTreeChildren[a],f=Array.isArray(c),m=a===""||c==="loading"||c==="error"||!f||c.length>0,u=a===""?"Home":Ue(a),b=l?"Cannot use a selected item (or a folder inside it) as the destination":a===""?"File home host.root":a,y=d?"▾":"▸";if(n.push(`<div class="files-tree-row${i?" is-selected":""}${l?" is-blocked":""}" style="--depth:${r}" role="treeitem" aria-selected="${i}" aria-expanded="${d}" aria-disabled="${l}">
      ${m?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${o(a)}"
              aria-label="${d?"Collapse":"Expand"} ${o(u)}" ${e.state.busy?"disabled":""}>${y}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${i?" is-selected":""}" data-action="files-tree-select" data-path="${o(a)}"
        title="${o(b)}" ${e.state.busy||l?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${o(u)}</span>
      </button>
    </div>`),!!d){if(c==="loading"){n.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">Loading…</div>`);return}if(c==="error"){n.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${o(a)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(f){for(const p of c)s(p.path,r+1);c.length===0&&a===""&&n.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">No subfolders yet — destination will be Home.</div>`)}}};return s("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${n.join("")}</div>`}async function pn(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const n=new FormData(t),s=(e.state.filesTransferDest||String(n.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),a=String(n.get("newName")??"").trim(),r=e.state.filesTransfer.op,i=[...e.state.filesTransfer.paths],l=i.length>1;if(tt(e,s,i)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let d=0;const c=[];try{for(const m of i)try{if(r==="copy"){const u=Ue(m),b=l||!a||a===u?void 0:a,y=await S.filesCopy(m,{to:s,newName:b});h.event("files.copy",{path:m,to:y.entry.path})}else{const u=Ue(m),b=l||!a||a===u?void 0:a;await S.filesMove(m,s,b),h.event("files.move",{path:m,to:s})}d+=1}catch(u){c.push(`${Ue(m)}: ${u instanceof Error?u.message:"failed"}`)}z(e),e.state.checkedFilePaths=[],await Z(e);const f=r==="copy"?"Copied":"Moved";d>0&&c.length===0?e.setFlash("success",d===1?`${f} 1 item`:`${f} ${d} items`):d>0?e.setFlash("info",`${f} ${d}; ${c.length} failed. ${c[0]}`):e.setFlash("error",c[0]||`${r==="copy"?"Copy":"Move"} failed`)}catch(f){e.setFlash("error",f instanceof Error?f.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function wt(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function pa(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function fa(e,t=!0){return Array.from(e).map(s=>{const r=(s.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")||s.name;return{file:s,relativePath:r||s.name}})}function fn(e){return new Promise((t,n)=>{const s=[],a=()=>{e.readEntries(r=>{if(!r.length){t(s);return}s.push(...r),a()},r=>n(r))};a()})}function bn(e){return new Promise((t,n)=>{e.file(t,n)})}async function ba(e,t){const n=wt(t,e.name);if(e.isFile)return[{file:await bn(e),relativePath:n||e.name}];if(e.isDirectory){const s=e.createReader(),a=await fn(s);if(a.length===0)return[{file:null,relativePath:n,isEmptyDir:!0}];const r=[];for(const i of a)r.push(...await ba(i,n));return r}return[]}async function*gn(e){const t=e;if(typeof t.values=="function"){for await(const n of t.values())yield n;return}if(typeof t.entries=="function")for await(const[,n]of t.entries())yield n}async function Tt(e,t){const n=wt(t,e.name),s=[];let a=0;for await(const r of gn(e))if(a+=1,r.kind==="file"){const i=await r.getFile();s.push({file:i,relativePath:wt(n,r.name)||i.name})}else r.kind==="directory"&&s.push(...await Tt(r,n));return a===0&&s.push({file:null,relativePath:n,isEmptyDir:!0}),s}async function yn(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const n=[];for(const s of t){const a=await s.getFile();n.push({file:a,relativePath:a.name})}return{kind:"items",items:n}}catch(t){return pa(t)?{kind:"cancel"}:{kind:"fallback"}}}async function vn(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),n=await Tt(t,"");return n.length===0?{kind:"cancel"}:{kind:"items",items:n}}catch(t){return pa(t)?{kind:"cancel"}:{kind:"fallback"}}}function ct(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}async function $n(e){var r,i;const t=e.items?Array.from(e.items):[],n=[];for(const l of t){if(l.kind!=="file")continue;const d=l;if(typeof d.getAsFileSystemHandle=="function")try{const c=await d.getAsFileSystemHandle();if(c){if(c.kind==="file"){const f=await c.getFile();n.push({file:f,relativePath:f.name})}else c.kind==="directory"&&n.push(...await Tt(c,""));continue}}catch{}if(typeof d.webkitGetAsEntry=="function"){const c=d.webkitGetAsEntry();if(c){n.push(...await ba(c,""));continue}}}const s=e.files&&e.files.length>0?fa(e.files,!0):[],a=new Map;for(const l of s){const d=ct(l.relativePath||((r=l.file)==null?void 0:r.name)||"");d&&a.set(d,l)}for(const l of n){const d=ct(l.relativePath||((i=l.file)==null?void 0:i.name)||"");if(!d&&l.isEmptyDir){const c=ct(l.relativePath);c&&a.set(c,l);continue}d&&a.set(d,l)}return Array.from(a.values())}function Le(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function ga(e,t=80){const n=String(e??"").replace(/\s+/g," ").trim();return n?n.length>t?`${n.slice(0,t-1)}…`:n:""}function te(e,t,n){const s=ga(t);return s?`${e} “${s}” ${n}`:`${e} ${n}`}function ut(e){const t=ga(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(s=>String(s??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function ya(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Je(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function H(e){const t=Math.max(0,Math.floor(e)),n=Math.floor(t/60),s=t%60;return n>0?`${n}m ${s}s`:`${s}s`}function fe(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function kn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function G(e,t,n,s,a,r=""){const i=n===t,l=i?s==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${i?" is-sorted":""}${r?" "+r:""}`}" data-action="sort-${a}" data-sort="${o(t)}" role="columnheader" tabindex="0">${o(e)}${l}</th>`}function j(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function wn(e){j(e),e.state.filesUploadMenuDocClick=n=>{var a;const s=n.target;(a=s==null?void 0:s.closest)!=null&&a.call(s,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,j(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function $e(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function hn(e){$e(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){$e(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},ge(e,e.state.filesUploadProgress)},1e3)}function va(e){$e(e),e.state.filesUploadProgress=null,e.render()}function $a(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function ge(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const n=e.root.querySelector(".files-upload-progress-bar"),s=e.root.querySelector(".files-upload-progress-track"),a=e.root.querySelector("[data-files-upload-status]"),r=e.root.querySelector("[data-files-upload-current]"),i=$a(e,t),l=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${i!==null?` (${i}%)`:""} · ${H(t.elapsedSec)}`:(a==null?void 0:a.textContent)||"";a&&t.phase==="uploading"&&(a.textContent=l),r&&t.phase==="uploading"&&(r.textContent=t.currentName||"",r.title=t.currentName||""),n&&i!==null&&(n.classList.remove("is-indeterminate"),n.style.width=`${i}%`),s&&i!==null&&(s.setAttribute("aria-valuenow",String(i)),s.removeAttribute("aria-valuetext"))}function _e(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,n=t.phase==="uploading",s=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",a=$a(e,t),r=a===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",i=a!==null?` style="width:${a}%"`:"";let l="";if(n){const c=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${a!==null?` (${a}%)`:""} · ${H(t.elapsedSec)}`,f=t.bytesTotal>0?`${Je(t.bytesSent)} / ${Je(t.bytesTotal)}`:"";l=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${o(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${f?` · <span class="muted">${o(f)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${a!==null?`aria-valuenow="${a}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${r}"${i}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${o(c)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${o(t.currentName)}">${o(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")l=`
      ${W("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${o(H(t.elapsedSec))}</p>`;else{const c=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(f=>`<li>${o(f)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
      ${W("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${c}
      <p class="muted small" style="margin:0.75rem 0 0">After ${o(H(t.elapsedSec))}</p>`}const d=n?'<p class="muted small" style="margin:0">Please wait…</p>':Et([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return N({title:s,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:n,lockBackdrop:n,body:l,footer:d})}async function Jt(e,t,n,s){const a=n.replace(/\\/g,"/").split("/").map(i=>i.trim()).filter(Boolean);let r=t;for(const i of a){const l=ma(r,i);if(s.has(l)){r=l;continue}try{await S.filesMkdir(r,i),h.event("files.mkdir",{path:r,name:i,via:"upload-folder"})}catch(d){if(!(d instanceof M&&d.status===409))throw d}s.add(l),r=l}}function Sn(e,t){var s;const n=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(s=e.root.querySelector(n))==null||s.click()}async function Yt(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,j(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,z(e),e.state.filesMkdirOpen=!1;const n=t==="files"?yn:vn;try{const s=await n();if(s.kind==="cancel"){e.render();return}if(s.kind==="items"){if(s.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await Ut(e,s.items);return}e.render(),requestAnimationFrame(()=>{Sn(e,t)})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not open picker"),e.render()}}function at(e,t){return`${e}\0${t}`}function Dn(e,t){return t.map(n=>{const s=n.file,a=(n.relativePath||s.name).replace(/\\/g,"/"),r=a.split("/").filter(Boolean),i=r.pop()||s.name,l=r.join("/"),d=ma(e,l);return{item:n,file:s,fileName:i,parentPath:d,displayName:a||i,relDir:l}})}function Cn(e){const t=new Set,n=[];for(const s of e){const a=at(s.parentPath,s.fileName);t.has(a)||(t.add(a),n.push(s))}return n}async function En(e,t){if(t.length===0)return[];const n=new Map;for(const a of t){const r=n.get(a.parentPath)??[];r.push(a),n.set(a.parentPath,r)}const s=[];for(const[a,r]of n){let i=new Map;try{const l=await S.filesList(a);i=new Map;for(const d of l.entries)(d.type==="file"||d.type==="dir")&&i.set(d.name,d.type)}catch{i=new Map}for(const l of r)i.has(l.fileName)&&s.push(l)}return s.sort((a,r)=>a.displayName.localeCompare(r.displayName)),s}const At=new WeakMap;function mt(e){e&&(At.delete(e.state),e.state.filesUploadConflict=null)}function ze(e,t){var f;const n=At.get(e.state),s=e.state.filesUploadConflict;if(t==="cancel"){mt(e),e.setFlash("info","Upload cancelled"),e.render();return}if(!n){e.state.filesUploadConflict=null,e.setFlash("error","Upload session expired — drop or choose the files again"),e.render();return}const a=new Set(((f=s==null?void 0:s.conflictKeys)!=null&&f.length?s.conflictKeys:n.conflictKeys)??[]);let r=n.planned,i=new Set,l=0;if(t==="overwrite")i=new Set(a);else{const m=[];for(const u of n.planned){const b=at(u.parentPath,u.fileName);a.has(b)?l+=1:m.push(u)}if(r=m,h.event("files.upload.skip_existing",{skipped:l,remaining:r.length,total:n.planned.length,conflictKeys:a.size}),r.length===0&&n.emptyDirs.length===0){mt(e),e.setFlash("info",l===1?"Nothing to upload — the selected file already exists":`Nothing to upload — all ${l} selected files already exist`),e.render();return}}const d=n.destBase,c=n.emptyDirs;mt(e),ka(e,r,c,d,i)}async function Ut(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,j(e),e.state.filesUploadDropActive=!1;const n=t.filter(i=>i.file&&!i.isEmptyDir),s=t.filter(i=>i.isEmptyDir&&i.relativePath),a=e.state.filesPath,r=Cn(Dn(a,n));if(h.event("files.upload.plan",{destBase:a||"/",files:r.length,emptyDirs:s.length,sample:r.slice(0,5).map(i=>({display:i.displayName,parent:i.parentPath||"/",name:i.fileName}))}),r.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await En(a,r);if(i.length>0){const l=i.map(d=>at(d.parentPath,d.fileName));At.set(e.state,{planned:r,emptyDirs:s,destBase:a,conflictKeys:l}),e.state.filesUploadConflict={names:i.map(d=>d.displayName),totalFiles:r.length,conflictCount:i.length,conflictKeys:l},h.event("files.upload.conflicts",{total:r.length,conflicts:i.length,names:i.slice(0,12).map(d=>d.displayName)}),e.state.busy=!1,e.render();return}}catch(i){e.state.busy=!1,e.setFlash("error",i instanceof Error?i.message:"Could not check existing files"),e.render();return}}await ka(e,r,s,a,new Set)}async function ka(e,t,n,s,a){var b,y;const r=t.reduce((p,$)=>p+($.file.size||0),0),i=Date.now(),l=t.length+n.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((b=t[0])==null?void 0:b.displayName)||((y=n[0])==null?void 0:y.relativePath)||"",bytesTotal:r,bytesSent:0,startedAt:i,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),hn(e),e.render();let d=0;const c=[],f=new Set;let m=0,u=0;try{for(const k of n){const w=k.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(w){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:w+"/",elapsedSec:Math.floor((Date.now()-i)/1e3)},ge(e,e.state.filesUploadProgress));try{await Jt(e,s,w,f)}catch(v){c.push(`${w}/: ${v instanceof Error?v.message:"failed"}`)}}}for(const k of t){const{file:w,fileName:v,parentPath:g,displayName:C,relDir:U}=k;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:C,bytesSent:m,elapsedSec:Math.floor((Date.now()-i)/1e3)},ge(e,e.state.filesUploadProgress));try{U&&await Jt(e,s,U,f);const I=a.has(at(g,v));await S.filesUpload(g,w,{replace:I,onProgress:(O,D)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const P=D>0?D:w.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:C,bytesSent:m+Math.min(O,P||O),elapsedSec:Math.floor((Date.now()-i)/1e3)},ge(e,e.state.filesUploadProgress)}}),h.event("files.upload",{path:g,name:v,size:w.size,relativePath:C,replace:I}),d+=1,I&&(u+=1),m+=w.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:d,failedFiles:c.length,bytesSent:m},ge(e,e.state.filesUploadProgress))}catch(I){const O=`${C}: ${I instanceof Error?I.message:"failed"}`;c.push(O),m+=w.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:d,failedFiles:c.length,bytesSent:m,errorSamples:c.slice(0,12)},ge(e,e.state.filesUploadProgress))}}await Z(e),$e(e);const p=Math.floor((Date.now()-i)/1e3),$=t.length;if(d>0&&c.length===0){let k=d===1?"Uploaded 1 file":`Uploaded ${d} files`;u>0&&(k+=u===1?" (1 overwritten)":` (${u} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max($,1),completedFiles:d,failedFiles:0,currentName:"",bytesTotal:r,bytesSent:r,startedAt:i,elapsedSec:p,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else if(d>0){const k=`Uploaded ${d}; ${c.length} failed. ${c[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max($,1),completedFiles:d,failedFiles:c.length,currentName:"",bytesTotal:r,bytesSent:r,startedAt:i,elapsedSec:p,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("info",k)}else if(l>0&&c.length===0&&n.length>0){const k=n.length===1?"Created 1 empty folder":`Created ${n.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:i,elapsedSec:p,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else{const k=c[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max($,1),completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:r,bytesSent:0,startedAt:i,elapsedSec:p,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("error",k)}}catch(p){$e(e);const $=p instanceof Error?p.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:d,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:r,bytesSent:m,startedAt:i,elapsedSec:Math.floor((Date.now()-i)/1e3),resultMessage:$,errorSamples:c.length?c.slice(0,12):[$]},e.setFlash("error",$)}finally{e.state.busy=!1,e.render()}}function Gt(e,t,n){const s=t.files;if(!s||s.length===0)return;const a=fa(s,n);t.value="",Ut(e,a)}function Pn(e,t){const n=t?t.split("/").filter(Boolean):[];let s="";const a=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const r of n){s=s?`${s}/${r}`:r;const i=s;a.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),a.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${o(i)}" ${e.state.busy?"disabled":""}>${o(r)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${a.join("")}</nav>`}function Tn(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${x("Files","files","h1")}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${x("Files","files","h1")}
        <p class="flash flash-error" style="margin-top:0.75rem">${o(t.error||"File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${o(t.davPath)}</span></p>
      </section>
    </div>`;const n=t.quotaBytes>0?`${fe(t.usedBytes)} used · ${fe(t.availableBytes)} free of ${fe(t.quotaBytes)}`:`${fe(t.usedBytes)} used · ${fe(t.availableBytes)} free (no app quota)`,s=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,a=e.state.checkedFilePaths.length,r=e.state.filesEntries.length>0&&e.state.filesEntries.every(v=>e.state.checkedFilePaths.includes(v.path)),i=a>0,l=e.state.filesEntries.filter(v=>v.type==="dir").length,d=e.state.filesEntries.length-l,c=a>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
          <span class="muted small">${a} selected</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>
        </div>`:"",f=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const v=[];l>0&&v.push(`${l} folder${l===1?"":"s"}`),d>0&&v.push(`${d} file${d===1?"":"s"}`);const g=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return v.length===2?`${g} · ${v.join(", ")}`:v[0]??g})(),m=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':e.state.filesEntries.map(v=>{const g=e.state.checkedFilePaths.includes(v.path),C=v.type==="dir"?"📁":"📄",U=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${o(v.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${C}</span>${o(v.name)}
                  </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${C}</span>${o(v.name)}</span>`,I=v.type==="dir"?"—":fe(v.size);return`<tr class="files-row${g?" is-checked":""}" data-path="${o(v.path)}" data-type="${v.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${o(v.path)}"
                  ${g?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${o(v.name)}" />
              </td>
              <td class="files-col-name">${U}</td>
              <td class="files-col-size mono">${I}</td>
              <td class="files-col-mtime hide-sm">${o(kn(v.mtime))}</td>
              <td class="files-col-actions">
                ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${o(S.filesDownloadUrl(v.path))}" download="${o(v.name)}" data-action="files-download">Download</a>`:""}
                <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${o(v.path)}" ${e.state.busy?"disabled":""}>Copy</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${o(v.path)}" ${e.state.busy?"disabled":""}>Move</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${o(v.path)}" data-name="${o(v.name)}" ${e.state.busy?"disabled":""}>Rename</button>
                <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${o(v.path)}" data-name="${o(v.name)}" ${e.state.busy?"disabled":""}>Delete</button>
              </td>
            </tr>`}).join(""),u=e.state.filesRenamePath!==null?(()=>{const v=e.state.filesEntries.find(C=>C.path===e.state.filesRenamePath),g=(v==null?void 0:v.name)??"";return N({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${o(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${o(g)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",b=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const v=e.state.filesDeletePaths,g=v.length>1,C=e.state.filesEntries.find(O=>O.path===v[0]),U=g?`Delete ${v.length} items`:`Delete ${(C==null?void 0:C.type)==="dir"?"folder":"file"}`,I=g?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${v.slice(0,12).map(O=>{const D=e.state.filesEntries.find(P=>P.path===O);return`<li><span class="mono">${o((D==null?void 0:D.name)??O)}</span></li>`}).join("")}
                 ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${o((C==null?void 0:C.name)??v[0])}</strong>?${(C==null?void 0:C.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return N({id:"files-delete-modal",title:U,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:I,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",y=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const v=e.state.filesTransfer.op,g=e.state.filesTransfer.paths,C=g.length>1,U=e.state.filesEntries.find(A=>A.path===g[0]),I=(U==null?void 0:U.name)??Ue(g[0]),O=C?`${v==="copy"?"Copy":"Move"} ${g.length} items`:`${v==="copy"?"Copy":"Move"} ${(U==null?void 0:U.type)==="dir"?"folder":"file"}`,D=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,P=tt(e,e.state.filesTransferDest,g);return N({id:"files-transfer-modal",title:O,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${C?`<p class="muted small" style="margin:0 0 0.75rem">${g.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${o(I)}</span></p>`}
                  <input type="hidden" name="toPath" value="${o(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${o(D)}">${o(D)}</span>
                    </div>
                    ${mn(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${C?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${o(I)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${v==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:v==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||P}]})})():"",p=e.state.filesMkdirOpen?N({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${o(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",$=e.state.filesUploadConflict?(()=>{const v=e.state.filesUploadConflict,g=v.conflictCount,C=Math.max(0,v.totalFiles-g),U=g===1?"1 file already exists in the destination.":`${g} of ${v.totalFiles} files already exist in the destination.`,I=C>0?C===1?" Skip existing keeps the other 1 new file.":` Skip existing keeps the other ${C} new files.`:" Skip existing cancels the upload (nothing new to send).",O=v.names.slice(0,12).map(P=>`<li><span class="mono">${o(P)}</span></li>`).join(""),D=v.names.length>12?`<li class="muted">…and ${v.names.length-12} more</li>`:"";return N({id:"files-upload-conflict-modal",title:g===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${o(U)}${o(I)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${O}
                ${D}
              </ul>
              <p class="muted small" style="margin:0">
                Replace the existing files, skip only those listed above, or cancel the whole upload.
              </p>`,footer:[{label:"Cancel",action:"files-upload-conflict-cancel",variant:"ghost"},{label:"Skip existing",action:"files-upload-conflict-skip",variant:"ghost"},{label:g===1?"Overwrite":"Overwrite all",action:"files-upload-conflict-overwrite",variant:"primary"}]})})():"",k=e.state.filesPath===""?"Home":e.state.filesPath,w=`<div class="files-upload-menu${e.state.filesUploadMenuOpen?" is-open":""}">
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
          <p class="muted small mono">${o(k)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${x("Files","files","h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${s}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${s}%"></div>
          </div>
          <span>${o(n)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${Pn(e,e.state.filesPath)}
        <div class="files-toolbar-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${e.state.busy||e.state.filesLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${e.state.busy?"disabled":""}>New folder</button>
          ${w}
        </div>
      </div>
      ${c}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${r?"checked":""}
                  ${i&&!r?"data-indeterminate=1":""}
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
        ${a>0?`${a} of ${e.state.filesEntries.length} selected`:o(f)}
      </div>
    </section>
    ${u}
    ${b}
    ${y}
    ${p}
    ${$}
  </div>`}async function An(e,t){const n=new FormData(t),s=String(n.get("path")??""),a=String(n.get("newName")??"").trim();if(!s||!a){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await S.filesRename(s,a),h.event("files.rename",{path:s,newName:a}),e.state.filesRenamePath=null,await Z(e),e.setFlash("success",`Renamed to “${a}”`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function Un(e,t){const n=new FormData(t),s=String(n.get("name")??"").trim();if(!s){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await S.filesMkdir(e.state.filesPath,s),h.event("files.mkdir",{path:e.state.filesPath,name:s}),e.state.filesMkdirOpen=!1,await Z(e),e.setFlash("success",`Created folder “${s}”`)}catch(a){e.setFlash("error",a instanceof Error?a.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function Fn(e,t,n,s){const{state:a}=e;if(t==="files-upload-menu-toggle")return a.busy||a.filesUploadProgress||(a.filesUploadMenuOpen=!a.filesUploadMenuOpen,a.filesUploadMenuOpen&&(a.filesRenamePath=null,a.filesDeletePaths=null,z(e),a.filesMkdirOpen=!1),e.render()),!0;if(t==="files-upload-files")return Yt(e,"files"),!0;if(t==="files-upload-folder")return Yt(e,"folder"),!0;if(t==="files-nav"){const r=n.dataset.path??"";a.filesPath=r,a.filesRenamePath=null,a.filesDeletePaths=null,a.filesTransfer=null,a.filesMkdirOpen=!1,a.checkedFilePaths=[],a.busy=!0,e.clearFlash(),e.render();try{await Z(e)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Failed to open folder")}finally{a.busy=!1,e.render()}return!0}if(t==="files-toggle"){s.stopPropagation();const r=n.dataset.path??"";return r&&(n.checked?a.checkedFilePaths.includes(r)||(a.checkedFilePaths=[...a.checkedFilePaths,r]):a.checkedFilePaths=a.checkedFilePaths.filter(l=>l!==r),e.render()),!0}if(t==="files-select-all"){s.stopPropagation();const r=n.checked;return a.checkedFilePaths=r?a.filesEntries.map(i=>i.path):[],e.render(),!0}if(t==="files-copy"){const r=n.dataset.path??"";return r&&xe(e,"copy",[r]),!0}if(t==="files-move"){const r=n.dataset.path??"";return r&&xe(e,"move",[r]),!0}if(t==="files-bulk-copy")return a.checkedFilePaths.length===0||xe(e,"copy",[...a.checkedFilePaths]),!0;if(t==="files-bulk-move")return a.checkedFilePaths.length===0||xe(e,"move",[...a.checkedFilePaths]),!0;if(t==="files-tree-select"){if(s.preventDefault(),s.stopPropagation(),!a.filesTransfer)return!0;const r=n.dataset.path??"";return tt(e,r,a.filesTransfer.paths)||(a.filesTransferDest=r,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(s.preventDefault(),s.stopPropagation(),!a.filesTransfer)return!0;const r=n.dataset.path??"";if(t==="files-tree-retry"){const l={...a.filesTreeChildren};return delete l[r],a.filesTreeChildren=l,a.filesTreeExpanded.includes(r)||(a.filesTreeExpanded=[...a.filesTreeExpanded,r]),kt(e,r),!0}return a.filesTreeExpanded.includes(r)?(a.filesTreeExpanded=a.filesTreeExpanded.filter(l=>l!==r),e.render()):(a.filesTreeExpanded=[...a.filesTreeExpanded,r],kt(e,r)),!0}if(t==="files-transfer-close")return z(e),e.render(),!0;if(t==="files-bulk-delete")return a.checkedFilePaths.length===0||(a.filesDeletePaths=[...a.checkedFilePaths],a.filesRenamePath=null,z(e),e.render()),!0;if(t==="files-refresh"){a.busy=!0,e.clearFlash(),e.render();try{await Z(e),e.setFlash("success","Refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{a.busy=!1,e.render()}return!0}if(t==="files-mkdir")return a.filesMkdirOpen=!0,a.filesUploadMenuOpen=!1,j(e),a.filesUploadDropActive=!1,a.filesRenamePath=null,a.filesDeletePaths=null,z(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return a.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open")return a.filesRenamePath=n.dataset.path??null,a.filesDeletePaths=null,z(e),a.filesUploadMenuOpen=!1,j(e),e.render(),!0;if(t==="files-rename-close")return a.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const r=n.dataset.path??"";return a.filesDeletePaths=r?[r]:null,a.filesRenamePath=null,z(e),a.filesUploadMenuOpen=!1,j(e),e.render(),!0}if(t==="files-delete-close")return a.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const r=a.filesDeletePaths?[...a.filesDeletePaths]:[];if(r.length===0)return!0;a.busy=!0,e.clearFlash(),e.render();try{if(r.length===1)await S.filesDelete(r[0]),h.event("files.delete",{path:r[0]}),e.setFlash("success","Deleted");else{const i=await S.filesBulk("delete",r);h.event("files.bulk-delete",{ok:i.ok,failed:i.failed}),i.failed===0?e.setFlash("success",i.ok===1?"Deleted 1 item":`Deleted ${i.ok} items`):i.ok>0?e.setFlash("info",`Deleted ${i.ok}; ${i.failed} failed. ${i.errors[0]||""}`):e.setFlash("error",i.errors[0]||"Delete failed")}a.filesDeletePaths=null,a.checkedFilePaths=[],await Z(e)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Delete failed")}finally{a.busy=!1,e.render()}return!0}return t==="files-download"?(h.event("files.download",{path:n.getAttribute("href")??""}),!0):t==="close-files-upload-progress"?(a.filesUploadProgress&&(a.filesUploadProgress.phase==="done"||a.filesUploadProgress.phase==="error")&&va(e),!0):t==="files-upload-conflict-cancel"?(ze(e,"cancel"),!0):t==="files-upload-conflict-skip"?(ze(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(ze(e,"overwrite"),!0):!1}function wa(e){const{root:t,state:n}=e,s=t.querySelector('[data-form="files-rename"]');s==null||s.addEventListener("submit",l=>{l.preventDefault(),An(e,s)});const a=t.querySelector('[data-form="files-transfer"]');a==null||a.addEventListener("submit",l=>{l.preventDefault(),pn(e,a)});const r=t.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",l=>{l.preventDefault(),Un(e,r)}),t.querySelectorAll('input[type="file"][data-action="files-upload-pick-files"]').forEach(l=>{l.addEventListener("change",()=>{Gt(e,l,!1)})}),t.querySelectorAll('input[type="file"][data-action="files-upload-pick-folder"]').forEach(l=>{l.addEventListener("change",()=>{Gt(e,l,!0)})});const i=t.querySelector("[data-files-drop-target]");if(i&&n.activeTab==="files"&&!n.busy&&!n.filesUploadProgress){let l=0;const d=c=>{n.filesUploadDropActive!==c&&(n.filesUploadDropActive=c,i.classList.toggle("is-dragover",c))};i.addEventListener("dragenter",c=>{Le(c.dataTransfer)&&(c.preventDefault(),c.stopPropagation(),l+=1,d(!0))}),i.addEventListener("dragover",c=>{Le(c.dataTransfer)&&(c.preventDefault(),c.stopPropagation(),c.dataTransfer&&(c.dataTransfer.dropEffect="copy"),d(!0))}),i.addEventListener("dragleave",c=>{Le(c.dataTransfer)&&(c.preventDefault(),c.stopPropagation(),l=Math.max(0,l-1),l===0&&d(!1))}),i.addEventListener("drop",c=>{if(!Le(c.dataTransfer))return;c.preventDefault(),c.stopPropagation(),l=0,d(!1);const f=c.dataTransfer;!f||n.busy||n.filesUploadProgress||(n.filesUploadMenuOpen=!1,j(e),(async()=>{try{const m=await $n(f);if(m.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await Ut(e,m)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Drop failed"),e.render()}})())})}t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(l=>{l.indeterminate=!0})}function In(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function ae(e,t){var s;const n=(s=e.state.adminCapabilities)==null?void 0:s.pages;return n?n.find(a=>a.id===t)??null:null}function we(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Oe(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function On(e){var r;const t=["overview","settings","users","database"],n={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},s=(r=e.state.adminCapabilities)==null?void 0:r.pages,a=new Map;if(s)for(const i of s)In(i.id)&&a.set(i.id,i);return t.map(i=>{const l=a.get(i),d=(l==null?void 0:l.label)||n[i],c=(l==null?void 0:l.status)??(i==="overview"?"read-only":"full"),f=(l==null?void 0:l.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===i?" is-active":""}${f?" is-gated":""}"
          data-action="admin-page" data-admin-page="${i}"
          aria-selected="${e.state.adminPage===i}"
          title="${o(d)}${f?" — "+we(e,c):""}">
          ${o(d)}
        </button>`}).join("")}function nt(e,t){const n=ae(e,t),s=(n==null?void 0:n.status)??"coming-soon",a=(n==null?void 0:n.label)??t,r=(n==null?void 0:n.summary)||"This area is not available in portal Administration yet.",i=we(e,s);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Oe(e,s)}">${o(i)}</span>
      <h2 class="admin-coming-soon-title">${o(a)}</h2>
    </div>
    <p class="muted">${o(r)}</p>
  </section>`}function he(e,t,n,s){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${o(String(n))}</div>
    <div class="admin-stat-label">${o(t)}</div>
    ${s?`<div class="admin-stat-hint muted small">${o(s)}</div>`:""}
  </div>`}function re(e,t,n){return`<span class="badge ${t?"badge-ok":"badge-off"}">${o(n)}: ${t?"On":"Off"}</span>`}function ie(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function ht(e){var t;e.state.adminCapabilitiesError=null;try{const n=await S.adminCapabilities();e.state.adminCapabilities=n.data,h.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(n){e.state.adminCapabilitiesError=n instanceof Error?n.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},h.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function Ye(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await S.adminDashboard();e.state.adminDashboard=t.data,h.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function oe(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await S.adminUsers();e.state.adminUsers=t.users??[],h.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function K(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const n=await S.adminUser(t);e.state.adminUserDetail=n.user,e.state.adminSelectedUsername=n.user.username,h.debug("admin.user",{username:n.user.username})}catch(n){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=n instanceof Error?n.message:"Failed to load user",n}finally{e.state.adminUserDetailLoading=!1}}async function ce(e,t){e.state.adminUserResourcesLoading=!0;try{const[n,s]=await Promise.all([S.adminUserCalendars(t),S.adminUserAddressBooks(t)]);e.state.adminUserCalendars=n.calendars??[],e.state.adminUserAddressBooks=s.addressbooks??[]}catch(n){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],n}finally{e.state.adminUserResourcesLoading=!1}}async function Ge(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await S.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function Qe(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await S.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const n=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=n==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function Nn(e){var r;const t=ae(e,"overview");if(t&&t.available===!1)return nt(e,"overview");const n=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${o(((r=e.state.user)==null?void 0:r.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let s="",a="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)a='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)a=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${o(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const i=e.state.adminDashboard,l=i.services,d=i.links??{},c=t?`<span class="badge ${Oe(e,t.status)}">${o(we(e,t.status))}</span>`:"",f=i.version?o(i.version):"—",m=i.git?o(i.git):"";s=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${x("About this system","admin-overview")}
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
              ${d.releases?`<a href="${o(d.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
              ${d.docs?`${d.releases?'<span class="footer-sep">·</span>':""}<a href="${o(d.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${ie(e,l.administration!==!1&&l.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${ie(e,!!l.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${ie(e,!!l.carddav)}</td></tr>
                  <tr><td>Files</td><td>${ie(e,!!l.files)}</td></tr>
                  <tr><td>Tasks</td><td>${ie(e,!!l.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${ie(e,!!l.notes)}</td></tr>
                  <tr><td>Push</td><td>${ie(e,!!l.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${n}
      </section>`;const u=i.nbusers??i.users,b=i.nbcalendars??i.calendars,y=i.nbevents??i.events,p=i.nbbooks??i.addressBooks,$=i.nbcontacts??i.contacts;a=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${he(e,"Registered users",u,"Users")}
          ${he(e,"Calendars",b,"CalDAV")}
          ${he(e,"Events",y,"CalDAV")}
          ${he(e,"Address books",p,"CardDAV")}
          ${he(e,"Contacts",$,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${re(e,l.administration!==!1&&l.webAdmin!==!1,"Administration")}
          ${re(e,!!l.caldav,"CalDAV")}
          ${re(e,!!l.carddav,"CardDAV")}
          ${re(e,!!l.files,"Files")}
          ${re(e,!!l.tasks,"Tasks")}
          ${re(e,!!l.notes,"Notes")}
          ${re(e,!!l.push,"Push")}
        </div>
      </section>`}else a=`<section class="card">
      ${x("System snapshot","admin-overview")}
      ${n}
    </section>`;return`${s}
    ${a}`}function Mn(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(n=>n.username.toLowerCase().includes(t)||(n.displayname||"").toLowerCase().includes(t)||(n.email||"").toLowerCase().includes(t)):e.state.adminUsers}function xn(e){return e.state.adminUserCreateOpen?N({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function Ln(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return N({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
        <p class="muted small">Username <span class="mono">${o(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${o(t.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${o(t.displayname)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${o(t.email)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function _n(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,n=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(a=>a.username.toLowerCase()===t.toLowerCase())??null,s=n?`${n.displayname||n.username} (${n.username})`:t;return N({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${o(s)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${et({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${o(t)}"`}]})}function qn(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${o(e.state.adminSelectedUsername)}</span>…</p>
    </section>`;if(e.state.adminUserDetailError&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${o(e.state.adminUserDetailError)}</p>
    </section>`;if(!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail,n=e.state.adminUserResourcesLoading&&e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':e.state.adminUserCalendars.map(c=>`<tr>
        <td class="mono">${o(c.uri)}</td>
        <td>${o(c.displayname)}</td>
        <td class="hide-sm">${o(String(c.eventCount))}${c.todos?' <span class="badge badge-admin">tasks</span>':""}${c.notes?' <span class="badge badge-admin">notes</span>':""}</td>
        <td class="hide-sm mono small">${o(c.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${o(c.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),s=e.state.adminUserResourcesLoading&&e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':e.state.adminUserAddressBooks.map(c=>`<tr>
        <td class="mono">${o(c.uri)}</td>
        <td>${o(c.displayname)}</td>
        <td class="hide-sm">${o(String(c.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${c.id}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${c.id}" data-label="${o(c.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),a=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(c=>c.instanceId===e.state.adminCalEditId)??null:null,r=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(c=>c.id===e.state.adminAbEditId)??null:null,i=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&a?N({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
          <input type="hidden" name="instanceId" value="${a?a.instanceId:""}" />
          ${e.state.adminCalModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${e.state.busy?"disabled":""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${o(a.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${o((a==null?void 0:a.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${o((a==null?void 0:a.description)??"")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${o((a==null?void 0:a.calendarcolor)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${a!=null&&a.todos||e.state.adminCalModal==="create"?"checked":""} ${e.state.busy?"disabled":""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${a!=null&&a.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",l=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&r?N({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${r?r.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${o(r.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${o((r==null?void 0:r.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${o((r==null?void 0:r.description)??"")}</textarea>
          </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",d=e.state.adminResourceDelete?N({title:`Delete ${e.state.adminResourceDelete.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
        <p>Delete <strong>${o(e.state.adminResourceDelete.label)}</strong> for <span class="mono">${o(t.username)}</span>?</p>
        ${e.state.adminResourceDelete.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${e.state.adminResourceDelete.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:e.state.busy}]}):"";return`<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${o(t.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${o(t.username)}" ${e.state.busy?"disabled":""}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${o(t.username)}" ${e.state.busy?"disabled":""}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${o(t.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${o(t.username)}</dd></div>
      <div><dt>Display name</dt><dd>${o(t.displayname||"—")}</dd></div>
      <div><dt>Email</dt><dd>${t.email?`<a href="mailto:${o(t.email)}">${o(t.email)}</a>`:"—"}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${o(t.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${o(String(t.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${o(String(t.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${o(String(t.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${o(String(t.contactCount))}</dd></div>
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
        <tbody>${n}</tbody>
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
  ${i}${l}${d}`}function Rn(e){const t=ae(e,"users");if(t&&t.available===!1)return nt(e,"users");const n=Mn(e),s=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':n.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?o(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:n.map(a=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===a.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${o(a.username)}" tabindex="0" role="button">
                <td class="mono">${o(a.username)}</td>
                <td class="hide-sm">${o(a.displayname||"—")}</td>
                <td class="hide-sm">${o(a.email||"—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${o(a.username)}" ${e.state.busy?"disabled":""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${o(a.username)}" ${e.state.busy?"disabled":""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${o(a.username)}" ${e.state.busy?"disabled":""}>Delete</button>
                </td>
              </tr>`).join("");return`
    <section class="card">
      <div class="section-header">
        ${x("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Oe(e,t.status)}">${o(we(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${e.state.busy||e.state.adminUsersLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${e.state.busy?"disabled":""}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${o(e.state.adminUsersQuery)}" aria-label="Filter users" ${e.state.busy?"disabled":""} />
        <span class="muted small">${o(String(n.length))}${e.state.adminUsersQuery.trim()?` / ${e.state.adminUsers.length}`:""} user${n.length===1?"":"s"}</span>
      </div>
      ${e.state.adminUsersError&&e.state.adminUsers.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${o(e.state.adminUsersError)}</p>`:""}
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
    ${qn(e)}
    ${xn(e)}
    ${Ln(e)}
    ${_n(e)}`}async function Bn(e,t){const n=new FormData(t),s=String(n.get("username")??"").trim(),a=String(n.get("displayname")??"").trim(),r=String(n.get("email")??"").trim(),i=String(n.get("password")??""),l=String(n.get("passwordConfirm")??"");if(!s||!a||!r||!i){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(i!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const d=await S.adminCreateUser({username:s,displayname:a,email:r,password:i,passwordConfirm:l});h.event("admin.user.create",{username:d.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=d.user.username,e.state.adminUserDetail=d.user,e.persistTab("admin","users",d.user.username),await oe(e),e.setFlash("success",`Created user “${d.user.username}”`)}catch(d){e.setFlash("error",d instanceof Error?d.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function Vn(e,t){const n=new FormData(t),s=String(n.get("username")??"").trim(),a=String(n.get("displayname")??"").trim(),r=String(n.get("email")??"").trim(),i=String(n.get("password")??""),l=String(n.get("passwordConfirm")??"");if(!s){e.setFlash("error","Username is required"),e.render();return}if(!a||!r){e.setFlash("error","Display name and email are required"),e.render();return}if(i!==""||l!==""){if(i===""||l===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(i!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const d={displayname:a,email:r};i!==""&&(d.password=i,d.passwordConfirm=l);const c=await S.adminUpdateUser(s,d);h.event("admin.user.update",{username:c.user.username,passwordChanged:i!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=c.user,e.state.adminSelectedUsername=c.user.username,await oe(e),e.setFlash("success",i!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(d){e.setFlash("error",d instanceof Error?d.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function Hn(e,t){var c,f;if(!e.state.adminSelectedUsername)return;const n=e.state.adminSelectedUsername,s=new FormData(t),a=String(s.get("displayname")??"").trim(),r=String(s.get("description")??"").trim(),i=String(s.get("calendarcolor")??"").trim(),l=((c=t.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,d=((f=t.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const m=String(s.get("uri")??"").trim().toLowerCase();await S.adminCreateUserCalendar(n,{uri:m,displayname:a,description:r,calendarcolor:i||void 0,todos:l,notes:d}),e.setFlash("success",`Created calendar “${a}”`)}else{const m=Number(s.get("instanceId"));await S.adminUpdateUserCalendar(n,m,{displayname:a,description:r,calendarcolor:i,todos:l,notes:d}),e.setFlash("success",`Updated calendar “${a}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await ce(e,n),await K(e,n)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function zn(e,t){if(!e.state.adminSelectedUsername)return;const n=e.state.adminSelectedUsername,s=new FormData(t),a=String(s.get("displayname")??"").trim(),r=String(s.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const i=String(s.get("uri")??"").trim().toLowerCase();await S.adminCreateUserAddressBook(n,{uri:i,displayname:a,description:r}),e.setFlash("success",`Created address book “${a}”`)}else{const i=Number(s.get("id"));await S.adminUpdateUserAddressBook(n,i,{displayname:a,description:r}),e.setFlash("success",`Updated address book “${a}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await ce(e,n),await K(e,n)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const Kn=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let be=null;function jn(){if(be)return be;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return be=[...t].sort((n,s)=>n.localeCompare(s)),be}}catch{}return be=[...Kn],be}function ha(e){const t=e||"UTC",n=jn(),s=n.includes(t),a=n.map(r=>`<option value="${Qt(r)}" ${r===t?"selected":""}>${Xt(r)}</option>`);return!s&&t&&a.unshift(`<option value="${Qt(t)}" selected>${Xt(t)}</option>`),a.join("")}function Qt(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function Xt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Wn(e){const t=ae(e,"settings");if(t&&t.available===!1)return nt(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${o(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const n=e.state.adminSystemSettings;if(!n)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const s=(r,i,l)=>`<label class="check-row"><input type="checkbox" name="${o(r)}" ${i?"checked":""} ${e.state.busy||n.writable===!1?"disabled":""} /> ${o(l)}</label>`,a=(r,i,l,d="")=>`<label>${o(l)}
      <input type="number" name="${o(r)}" value="${o(String(i??0))}" ${e.state.busy||n.writable===!1?"disabled":""} />
      ${d?`<span class="muted small">${o(d)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${x("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Oe(e,t.status)}">${o(we(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${e.state.busy?"disabled":""}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
        <strong>session timeout</strong> affects portal idle sessions.
        ${n.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
      </p>
      <form class="stack admin-settings-form" data-form="admin-settings">
        <h3 class="admin-subsection-title">DAV services</h3>
        ${s("cal_enabled",!!n.cal_enabled,"Enable CalDAV")}
        ${s("card_enabled",!!n.card_enabled,"Enable CardDAV")}
        ${s("tasks_enabled",!!n.tasks_enabled,"Enable Tasks (VTODO)")}
        ${s("notes_enabled",!!n.notes_enabled,"Enable Notes (VJOURNAL)")}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${e.state.busy||n.writable===!1?"disabled":""}>
            ${["Digest","Basic","Apache"].map(r=>`<option value="${r}" ${n.dav_auth_type===r?"selected":""}>${r}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||n.writable===!1?"disabled":""}>
            ${ha(n.timezone||"UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${o(n.invite_from||"")}" placeholder="noreply@example.com" ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${s("files_enabled",!!n.files_enabled,"Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${o(n.files_storage_path||"")}" placeholder="empty = Specific/files" ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>
        ${a("files_max_upload_mb",n.files_max_upload_mb,"Max file size (MB)")}
        ${a("files_quota_mb",n.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
        ${a("files_quarantine_days",n.files_quarantine_days,"Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${a("session_max_age_minutes",n.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${e.state.busy||n.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(r=>`<option value="${r}" ${(n.portal_log_level||"off")===r?"selected":""}>${r}</option>`).join("")}
          </select>
        </label>
        ${s("portal_admin_ui_enabled",n.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${o(Array.isArray(n.portal_admin_users)?n.portal_admin_users.join(", "):String(n.portal_admin_users||""))}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${s("push_enabled",!!n.push_enabled,"Enable WebDAV-Push")}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${o(n.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${e.state.busy||n.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(r=>`<option value="${r}" ${(n.push_log_level||"off")===r?"selected":""}>${r}</option>`).join("")}
          </select>
        </label>

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">baikal.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${n.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${e.state.busy||n.writable===!1?"disabled":""} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${e.state.busy||n.writable===!1?"disabled":""}>Save settings</button>
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
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${e.state.busy||n.writable===!1?"disabled":""}>
          Reset to Default
        </button>
      </div>
    </section>
    ${Jn(e)}`}function Jn(e){return e.state.adminResetModalOpen?N({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${et({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${o(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function Yn(e,t){const n=new FormData(t),s=l=>{var d;return!!((d=t.querySelector(`input[name="${l}"]`))!=null&&d.checked)},a={cal_enabled:s("cal_enabled"),card_enabled:s("card_enabled"),tasks_enabled:s("tasks_enabled"),notes_enabled:s("notes_enabled"),files_enabled:s("files_enabled"),push_enabled:s("push_enabled"),portal_admin_ui_enabled:s("portal_admin_ui_enabled"),timezone:String(n.get("timezone")??"").trim(),invite_from:String(n.get("invite_from")??"").trim(),dav_auth_type:String(n.get("dav_auth_type")??"Digest"),files_storage_path:String(n.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(n.get("files_max_upload_mb")??0),files_quota_mb:Number(n.get("files_quota_mb")??0),files_quarantine_days:Number(n.get("files_quarantine_days")??0),session_max_age_minutes:Number(n.get("session_max_age_minutes")??15),portal_log_level:String(n.get("portal_log_level")??"off"),portal_admin_users:String(n.get("portal_admin_users")??"").trim(),push_external_url:String(n.get("push_external_url")??"").trim(),push_log_level:String(n.get("push_log_level")??"off")},r=String(n.get("admin_password")??""),i=String(n.get("admin_password_confirm")??"");(r!==""||i!=="")&&(a.admin_password=r,a.admin_password_confirm=i),e.state.busy=!0,e.clearFlash(),e.render();try{const l=await S.adminUpdateSystemSettings(a);e.state.adminSystemSettings=l.data,h.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function Sa(e,t){const n=new FormData(t),s=String(n.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",a={backend:s};return s==="sqlite"?a.sqlite_file=String(n.get("sqlite_file")??"").trim():(a.pgsql_host=String(n.get("pgsql_host")??"").trim(),a.pgsql_dbname=String(n.get("pgsql_dbname")??"").trim(),a.pgsql_username=String(n.get("pgsql_username")??"").trim(),a.pgsql_password=String(n.get("pgsql_password")??"")),a}function Gn(e,t){e.state.adminDbPendingBody=Sa(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function Qn(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const n=Sa(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const s=await S.adminTestDatabaseConnection(n);e.setFlash("success",s.message||"Connection successful"),h.event("admin.database.test",{backend:s.backend})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function Xn(e){const t=ae(e,"database");if(t&&t.available===!1)return nt(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${o(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const n=e.state.adminDatabaseSettings;if(!n)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const s=e.state.adminDbFormBackend,a=n.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${x("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Oe(e,t.status)}">${o(we(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${e.state.busy?"disabled":""}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${o(n.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${o((n.backend||"—").toUpperCase())}</span></dd>
        </div>
        ${n.backend==="sqlite"||n.sqlite_file?`<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${o(n.sqlite_file||"—")}</dd>
        </div>`:""}
        ${n.backend==="pgsql"||n.pgsql_host?`<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${o(n.pgsql_host||"—")} / ${o(n.pgsql_dbname||"—")} · ${o(n.pgsql_username||"—")}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>${n.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>`:""}
        <div>
          <dt>Encryption key</dt>
          <dd>${n.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>
      </dl>

      <h3 class="admin-subsection-title">Edit connection</h3>
      ${a?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${e.state.busy||a?"disabled":""}>
            <option value="sqlite" ${s==="sqlite"?"selected":""}>SQLite</option>
            <option value="pgsql" ${s==="pgsql"?"selected":""}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${s==="sqlite"?"":"display:none"}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${o(n.sqlite_file||"")}" ${e.state.busy||a?"disabled":""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${s==="pgsql"?"":"display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${o(n.pgsql_host||"")}" placeholder="localhost:5432" ${e.state.busy||a?"disabled":""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${o(n.pgsql_dbname||"")}" ${e.state.busy||a?"disabled":""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${o(n.pgsql_username||"")}" autocomplete="off" ${e.state.busy||a?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${n.hasPassword?"Leave blank to keep current":""}" ${e.state.busy||a?"disabled":""} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${e.state.busy||a?"disabled":""}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${e.state.busy||a?"disabled":""}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${Zn(e)}`}function Zn(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return N({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${o(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function Da(e,t,n={}){if(!e.userIsAdmin()){await e.activateTab("calendars",n);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):n.username!==void 0&&(e.state.adminSelectedUsername=n.username,n.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),h.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),n.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await ht(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const s=ae(e,t);t==="overview"&&(s==null?void 0:s.available)!==!1?await Ye(e):t==="users"&&(s==null?void 0:s.available)!==!1?(await oe(e),e.state.adminSelectedUsername&&(await K(e,e.state.adminSelectedUsername),await ce(e,e.state.adminSelectedUsername))):t==="settings"&&(s==null?void 0:s.available)!==!1?await Ge(e):t==="database"&&(s==null?void 0:s.available)!==!1&&await Qe(e)}catch(s){h.warn("admin page load failed",s instanceof Error?s.message:s),e.setFlash("error",s instanceof Error?s.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function es(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?Rn(e):e.state.adminPage==="settings"?Wn(e):e.state.adminPage==="database"?Xn(e):Nn(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function ts(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function as(e,t,n,s){var a,r;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const i=ts(n.dataset.adminPage);return i&&await Da(e,i),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await Ye(e),e.setFlash("success","Overview refreshed")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await oe(e),e.state.adminSelectedUsername&&await K(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const i=n.dataset.username??"";if(!i||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=i,e.state.adminPage="users",e.persistTab("admin","users",i),e.render();try{await K(e,i),await ce(e,i)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const i=n.dataset.username??e.state.adminSelectedUsername??"";if(!i)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=i,e.state.adminPage="users",e.persistTab("admin","users",i),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==i.toLowerCase())&&await K(e,i),e.state.adminUserEditOpen=!0}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const i=n.dataset.username??e.state.adminSelectedUsername??"";return i&&(e.state.adminUserDeleteUsername=i,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const i=n;return e.state.adminUserDeleteConfirmChecked=!!i.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const i=n.dataset.username??e.state.adminUserDeleteUsername??"";if(!i||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await S.adminDeleteUser(i,!0),h.event("admin.user.delete",{username:i}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((a=e.state.adminSelectedUsername)==null?void 0:a.toLowerCase())===i.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await oe(e),e.setFlash("success",`Deleted user “${i}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(n.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(n.dataset.id),label:n.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(n.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(n.dataset.id),label:n.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((r=e.state.adminResourceDelete)==null?void 0:r.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!n.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const i=e.state.adminSelectedUsername,l=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{l.kind==="calendar"?await S.adminDeleteUserCalendar(i,l.id,!0):await S.adminDeleteUserAddressBook(i,l.id,!0,!!l.force),e.state.adminResourceDelete=null,await ce(e,i),await K(e,i),e.setFlash("success","Deleted")}catch(d){e.setFlash("error",d instanceof Error?d.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await Ge(e),e.setFlash("success","Settings reloaded")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const i=n;return e.state.adminResetConfirmChecked=!!i.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=n.value;const i=e.root.querySelector('[data-action="admin-reset-confirm"]');return i&&(i.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const i=await S.adminResetToDefault(!0,e.state.adminResetPassword);h.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const l=i.redirectUrl&&i.redirectUrl.startsWith("/")?i.redirectUrl:"/portal/install/";return window.location.assign(l),!0}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await Qe(e),e.setFlash("success","Database settings reloaded")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const i=n;return e.state.adminDbFormBackend=i.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const i=n.closest("form");return Qn(e,i),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const i=n;e.state.adminDbConfirmText=i.value,e.render();const l=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const d=l.value.length;l.setSelectionRange(d,d)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const i={...e.state.adminDbPendingBody,confirm:"CONFIRM"},l=await S.adminUpdateDatabaseSettings(i);e.state.adminDatabaseSettings=l.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const d=(l.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=d==="pgsql"?"pgsql":"sqlite",h.event("admin.database.save",{backend:l.data.backend}),e.setFlash("success","Database settings saved")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function Ca(e){const{root:t}=e,n=t.querySelector('[data-form="admin-user-create"]');n==null||n.addEventListener("submit",d=>{d.preventDefault(),Bn(e,n)});const s=t.querySelector('[data-form="admin-user-edit"]');s==null||s.addEventListener("submit",d=>{d.preventDefault(),Vn(e,s)});const a=t.querySelector('[data-form="admin-cal"]');a==null||a.addEventListener("submit",d=>{d.preventDefault(),Hn(e,a)});const r=t.querySelector('[data-form="admin-ab"]');r==null||r.addEventListener("submit",d=>{d.preventDefault(),zn(e,r)});const i=t.querySelector('[data-form="admin-settings"]');i==null||i.addEventListener("submit",d=>{d.preventDefault(),Yn(e,i)});const l=t.querySelector('[data-form="admin-database"]');l==null||l.addEventListener("submit",d=>{d.preventDefault(),Gn(e,l)})}function L(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${s}`}function ns(e,t){const n=new Date(e,t,1),s=new Date(e,t+1,0);return{from:L(n),to:L(s)}}function St(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[n,s,a]=e.split("-").map(Number);return new Date(n,s-1,a)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[n,s,a]=e.slice(0,10).split("-").map(Number);return new Date(n,(s||1)-1,a||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function ss(e){const t=St(e.start);if(!e.end)return[L(t)];let n=St(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(n=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1))}if(n<t)return[L(t)];const s=[],a=new Date(t.getFullYear(),t.getMonth(),t.getDate()),r=new Date(n.getFullYear(),n.getMonth(),n.getDate());let i=0;for(;a<=r&&i++<370;)s.push(L(a)),a.setDate(a.getDate()+1);return s.length?s:[L(t)]}function ve(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):L(t)}function rs(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const n=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(n.hourCycle==="h23"||n.hourCycle==="h24")return!1;if(n.hourCycle==="h11"||n.hourCycle==="h12")return!0;if(typeof n.hour12=="boolean")return n.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function Ft(e){return rs(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function It(e){var s;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(s=navigator.languages)!=null&&s.length?navigator.languages:[],navigator.language].filter(Boolean);for(const a of t)try{const r=new Intl.Locale(a),i=typeof r.getWeekInfo=="function"?r.getWeekInfo():r.weekInfo,l=i==null?void 0:i.firstDay;if(typeof l=="number")return l===7?0:l}catch{}const n=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(n)?0:1}function Ea(e){const t=It(e),n=new Date(2024,0,7+t),s=[];for(let a=0;a<7;a++){const r=new Date(n);r.setDate(n.getDate()+a),s.push(r.toLocaleDateString(void 0,{weekday:"short"}))}return s}function Pa(e,t=15){const n=t*60*1e3,s=e.getTime();return s%n===0?new Date(s):new Date(Math.ceil(s/n)*n)}function Q(e){const t=n=>String(n).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function is(e,t,n){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const a=e.slice(0,10),[r,i,l]=a.split("-").map(Number);return new Date(r,i-1,l).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const s=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(s.getTime())?e:s.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Ft(n)})}function ye(e){if(!e){const n=Pa(new Date);return{date:L(n),hm:`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:L(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Pe(e){const t=new Date,n=L(t);if(e&&e!==n){const[r,i,l]=e.split("-").map(Number),d=new Date(r,i-1,l,9,0,0,0),c=new Date(r,i-1,l,10,0,0,0);return{start:Q(d),end:Q(c)}}const s=Pa(t,15),a=new Date(s.getTime()+3600*1e3);return{start:Q(s),end:Q(a)}}function ls(){const e=[];for(let t=0;t<24;t++)for(let n=0;n<60;n+=15)e.push(`${String(t).padStart(2,"0")}:${String(n).padStart(2,"0")}`);return e}function Ot(e,t){const n=e.slice(0,10),s=(t||n).slice(0,10);if(n===s){const u=Pe(n);return{start:u.start,end:u.end}}const[a,r,i]=n.split("-").map(Number),[l,d,c]=s.split("-").map(Number),f=Q(new Date(a,r-1,i,9,0,0,0)),m=Q(new Date(l,d-1,c,17,0,0,0));return{start:f,end:m}}function ds(e,t){const n=ve(e);let s=t?ve(t):n;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const a=new Date(t);if(!Number.isNaN(a.getTime())&&a.getHours()===0&&a.getMinutes()===0&&a.getTime()>new Date(e).getTime()){const r=St(t);r.setDate(r.getDate()-1),s=L(r)}}return{start:n,end:s}}function ke(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const n=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}`}catch{return""}}function os(e){const{field:t,value:n,dateOnly:s,allowClear:a,viewY:r,viewM:i,weekStart:l,timeFormat:d}=e,c=ye(n),f=It(l),m=Ea(l),b=(new Date(r,i,1).getDay()-f+7)%7,y=new Date(r,i+1,0).getDate(),p=new Date(r,i,0).getDate(),$=c.date,k=c.hm,w=[],v=Math.ceil((b+y)/7)*7;for(let P=0;P<v;P++){let A,q,se=!1;P<b?(A=p-b+P+1,q=new Date(r,i-1,A),se=!0):P>=b+y?(A=P-(b+y)+1,q=new Date(r,i+1,A),se=!0):(A=P-b+1,q=new Date(r,i,A));const ue=L(q),me=ue===$,Ne=ue===L(new Date);w.push(`<button type="button" class="dt-day${se?" is-outside":""}${me?" is-selected":""}${Ne?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${o(ue)}">${A}</button>`)}const g=new Date().getFullYear(),C=Math.min(1900,r),U=Math.max(g+30,r),I=Array.from({length:12},(P,A)=>{const q=new Date(2e3,A,1).toLocaleString(void 0,{month:"short"});return`<option value="${A}" ${A===i?"selected":""}>${o(q)}</option>`}).join(""),O=[];for(let P=C;P<=U;P++)O.push(`<option value="${P}" ${P===r?"selected":""}>${P}</option>`);const D=s?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${ls().map(P=>{const A=(()=>{const[q,se]=P.split(":").map(Number);return new Date(2e3,0,1,q,se).toLocaleTimeString(void 0,Ft(d))})();return`<button type="button" class="dt-time${P===k?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${P}" role="option" aria-selected="${P===k}">${o(A)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${s?"":" and time"}">
      <div class="dt-popover-inner${s?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${o(t)}" aria-label="Month">${I}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${o(t)}" aria-label="Year">${O.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${m.map(P=>`<span class="dt-dow">${o(P)}</span>`).join("")}</div>
          <div class="dt-days">${w.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${o(t)}" ${a?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${D}
      </div>
    </div>`}function cs(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const n=t.querySelector(".dt-trigger"),s=t.querySelector(".dt-popover");if(!n||!s)return;const a=n.getBoundingClientRect(),r=8;s.style.position="fixed",s.style.visibility="hidden",s.style.top="0",s.style.left="0";const i=s.offsetWidth||320,l=s.offsetHeight||300;let d=a.bottom+6;d+l>window.innerHeight-r&&(d=Math.max(r,a.top-l-6));let c=a.left;c+i>window.innerWidth-r&&(c=Math.max(r,window.innerWidth-i-r)),c<r&&(c=r),s.style.top=`${Math.round(d)}px`,s.style.left=`${Math.round(c)}px`,s.style.right="auto",s.style.visibility="visible",s.style.zIndex="200"})}async function Nt(e,t){const n=await S.shares(t);e.state.shares=n.shares}function us(e){const t=e.state.calendars.filter(s=>s.canShare);if(t.length===0)return null;const n=s=>{const a=s.uri.toLowerCase(),r=s.displayname.toLowerCase();return a==="default"||r==="default"||r==="default calendar"};return t.find(n)??t[0]??null}async function st(e){const t=e.state.selectedIds.filter(a=>e.state.calendars.some(r=>r.id===a));if(t.length===0){e.state.monthEvents=[];return}const{from:n,to:s}=ns(e.state.monthCursor.y,e.state.monthCursor.m);e.state.monthEventsLoading=!0,h.debug("loadMonthEvents",{selectedIds:t,from:n,to:s});try{const r=(await Promise.all(t.map(async i=>(await S.calendarEvents(i,n,s)).events.map(d=>({...d,instanceId:i}))))).flat();r.sort((i,l)=>{const d=i.start||"",c=l.start||"";return d!==c?d<c?-1:1:(i.summary||"").localeCompare(l.summary||"")}),e.state.monthEvents=r,h.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:n,to:s})}catch(a){e.state.monthEvents=[],h.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{e.state.monthEventsLoading=!1}}function ms(e,t){const n=e.state.calendars.find(s=>s.id===t);return n!=null&&n.color?n.color.length>=7?n.color.slice(0,7):n.color:"#3B82F6"}function ps(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(n=>n!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t)}function fs(e,t,n){return new Date(t,n,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function bs(e,t){const n=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return n;const s=new Date(t.start);return Number.isNaN(s.getTime())?n:`${s.toLocaleTimeString(void 0,e.timeFormatOpts())} ${n}`}function gs(e){const t=e.state.calendars.filter(w=>e.state.selectedIds.includes(w.id)),n=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,s=e.state.monthCursor.y,a=e.state.monthCursor.m,r=new Date(s,a,1),i=e.localeWeekStart(),l=(r.getDay()-i+7)%7,d=new Date(s,a+1,0).getDate(),c=new Date(s,a,0).getDate(),m=L(new Date),u=e.localeDowLabels(),b=new Map;for(const w of e.state.monthEvents)for(const v of ss(w)){const g=b.get(v)??[];g.push(w),b.set(v,g)}const y=[],p=Math.ceil((l+d)/7)*7;for(let w=0;w<p;w++){let v,g=!0,C;w<l?(v=c-l+w+1,g=!1,C=new Date(s,a-1,v)):w>=l+d?(v=w-(l+d)+1,g=!1,C=new Date(s,a+1,v)):(v=w-l+1,C=new Date(s,a,v));const U=L(C),I=U===m,O=g?b.get(U)??[]:[],D=e.state.monthExpandDay===U?50:3,P=O.slice(0,D),A=O.length-P.length,q=P.map(pe=>{var Bt;const it=pe.instanceId,lt=bs(e,pe),_a=ms(e,it),Rt=((Bt=e.state.calendars.find(Ra=>Ra.id===it))==null?void 0:Bt.displayname)||"",qa=Rt?`${lt} · ${Rt}`:lt;return`<button type="button" class="month-event${pe.allDay?"":" is-timed"}" title="${o(qa)}" style="--ev-color:${o(_a)}"
          data-action="open-event" data-instance="${it}" data-uri="${o(pe.uri)}" ${e.state.busy?"disabled":""}>${o(lt)}</button>`}).join(""),se=A>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${o(U)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${A} more</button>`:"",ue=!g&&(v===1||w===l+d)?C.toLocaleString(void 0,{month:"short",day:"numeric"}):String(v),me=e.state.selectedId!==null?e.state.calendars.find(pe=>pe.id===e.state.selectedId)??null:null,Ne=!!(me&&!me.readOnly&&(me.canShare||me.access==="readwrite"));y.push(`<div class="month-cell${g?"":" is-outside"}${I?" is-today":""}${Ne?" is-clickable":""}"${Ne?` data-action="new-event-day" data-day="${o(U)}" role="button" tabindex="0" title="Add event on ${o(U)}"`:""}>
      <div class="month-daynum${I?" is-today-num":""}">${o(ue)}</div>
      <div class="month-events">${q}${se}</div>
    </div>`)}const $=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",k=t.slice(0,6).map(w=>{const v=w.color&&w.color.length>=7?w.color.slice(0,7):w.color||"#3B82F6";return`<span class="cal-swatch" style="background:${o(v)};margin-top:0" title="${o(w.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
    <div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${o(fs(e,s,a))}</h2>
      <span class="month-cal-name muted small" title="${o(n)}">
        ${k}
        ${o(n)}
      </span>
    </div>
    ${$}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${u.map(w=>`<div class="month-dow">${o(w)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${y.join("")}
      </div>
    </div>
  </section>`}function Mt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function ys(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Ie(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const n=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),s=String(e.get("repeatEndMode")??"never"),a=s==="until"||s==="count"?s:"never";let r=null,i=null;if(a==="until"){const d=String(e.get("repeatUntil")??"").trim();r=d?d.slice(0,10):null}else if(a==="count"){const d=Number(e.get("repeatCount")??0);i=Number.isFinite(d)&&d>0?Math.min(999,Math.round(d)):10}const l=e.getAll("repeatByDay").map(d=>String(d).toUpperCase()).filter(Boolean);return{freq:t,interval:n,until:r,count:i,byDay:l,endMode:a}}function vs(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,n=t.repeat??Mt(),s=(n.freq||"").toUpperCase(),a=e.state.calendars.filter(y=>y.canShare||y.access==="readwrite"),r=e.state.calendars.filter(y=>y.id===t.instanceId?!0:y.readOnly?!1:y.canShare||y.access==="readwrite").map(y=>`<option value="${y.id}" ${y.id===t.instanceId?"selected":""}>${o(y.displayname)}</option>`).join(""),i=t.readOnly||!t.canWrite;let l,d;if(t.allDay)l=ve(t.start),d=ve(t.end);else{const y=t.start||"",p=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(y)){const $=Ot(y,p||null);l=$.start,d=$.end||""}else l=ke(t.start),d=ke(t.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((n.byDay||[]).map(y=>y.toUpperCase())),m=ys(n),u=!!s&&m==="until",b=n.until||(m==="until"?ve(t.start)||L(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${e.state.creatingEvent?"New event":"Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${e.renderFlashBanner()}
        ${!e.state.creatingEvent&&(t.hasRrule||s)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
        ${i?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${i||a.length===0?"disabled":""}>
              ${r||`<option value="${t.instanceId}">${o(t.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${o(t.summary)}" ${i?"readonly":""} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${o(t.location)}" ${i?"readonly":""} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${i?"readonly":""}>${o(t.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${i?"disabled":""} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${e.renderPortalDateTimeField({field:"start",name:"start",label:"Start",value:l,dateOnly:t.allDay,required:!0,disabled:i,allowClear:!1})}
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:d,dateOnly:t.allDay,disabled:i||u,allowClear:!u})}
          </div>
          <fieldset class="event-repeat" ${i?"disabled":""}>
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
                <input type="number" name="repeatInterval" min="1" max="99" value="${o(String(n.interval||1))}" ${s?"":"disabled"} />
              </label>
            </div>
            ${s==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${c.map(y=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${y.code}" ${f.has(y.code)?"checked":""} />
                            ${y.label}
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
                    ${m==="until"?e.renderPortalDateTimeField({field:"until",name:"repeatUntil",label:"Until",value:b,dateOnly:!0,disabled:i,allowClear:!0}):m==="count"?`<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${o(String(n.count||10))}" />
                            </label>`:"<span></span>"}
                  </div>`:""}
          </fieldset>
          <div class="form-actions-row" style="margin-top:0.5rem">
            ${i?"":`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingEvent?"Create event":"Save event"}</button>
                   ${e.state.creatingEvent?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${e.state.busy?"disabled":""}>Delete</button>`}`}
            <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`}function $s(e,t,n){const s=e.state.calendars.find(a=>a.id===n);return{uri:"",instanceId:n,calendarId:(s==null?void 0:s.calendarId)??0,calendarName:(s==null?void 0:s.displayname)??"Calendar",calendarUri:(s==null?void 0:s.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:Mt(),readOnly:!1,canWrite:!0}}function ks(e,t){if(!e.state.editingEvent)return;const n=new FormData(t),s=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(n.get("summary")??e.state.editingEvent.summary),description:String(n.get("description")??e.state.editingEvent.description),location:String(n.get("location")??e.state.editingEvent.location),instanceId:Number(n.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(s==null?void 0:s.checked)??e.state.editingEvent.allDay,start:String(n.get("start")??e.state.editingEvent.start??""),end:String(n.get("end")??e.state.editingEvent.end??"")||null,repeat:Ie(n),hasRrule:!!String(n.get("repeatFreq")??"").trim()}}function ee(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function Ta(e){ee(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){ee(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&Ua(e,e.state.importProgress)},1e3)}function Te(e,t,n={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...n},e.render())}function ws(e){ee(e),e.state.importProgress=null,e.render()}function Aa(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Ua(e,e.state.importProgress))}function Ua(e,t){const n=e.root.querySelector("[data-import-status-line]"),s=e.root.querySelector(".import-progress-bar"),a=e.root.querySelector(".import-progress-track"),r=e.root.querySelector("[data-import-counts]"),i=t.kind==="calendar"?"items":"contacts";let l;if(t.phase==="processing"&&t.processTotal>0)l=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${i} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`;else if(t.phase==="processing")l=`Importing on server… ${H(t.elapsedSec)}`;else return;n&&(n.textContent=l),r&&(r.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),s&&t.processPercent!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),a&&t.processPercent!==null&&(a.setAttribute("aria-valuenow",String(t.processPercent)),a.removeAttribute("aria-valuetext"))}function qe(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,n=t.phase!=="done"&&t.phase!=="error",s=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",a=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",r=(()=>{const d=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return d.map((m,u)=>{let b="pending";return t.phase==="done"||u<f?b="done":u===f&&(b=(t.phase==="error","active")),`<li class="import-step import-step-${b}"><span class="import-step-icon" aria-hidden="true">${b==="done"?"✓":b==="active"?"●":"○"}</span> ${o(m.label)}</li>`}).join("")})();let i="";if(n){let d=null;t.phase==="reading"&&t.readPercent!==null?d=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(d=Math.min(100,Math.max(0,t.processPercent)));const c=d===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=d!==null?` style="width:${d}%"`:"",m=t.kind==="calendar"?"items":"contacts";let u;t.phase==="reading"?u=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?u="Uploading to server…":t.processTotal>0?u=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${m} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`:u=`Importing on server… ${H(t.elapsedSec)}`;const b=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';i=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${o(s)}</strong> from
        <span class="mono">${o(t.fileName)}</span>
        ${t.fileSizeLabel?` <span class="muted">(${o(t.fileSizeLabel)})</span>`:""}
      </p>
      <ul class="import-steps">${r}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${d!==null?`aria-valuenow="${d}"`:'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${c}"${f}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${o(u)}</p>
      ${b}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?i=`
      ${W("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${o(t.fileName)}</span>
        · Took ${o(H(t.elapsedSec))}
      </p>`:i=`
      ${W("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${o(t.fileName)}</span>
        · After ${o(H(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const l=n?'<p class="muted small" style="margin:0">Please wait…</p>':Et([{label:"Close",action:"close-import-progress",variant:"primary"}]);return N({title:a,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:n,lockBackdrop:n,body:i,footer:l})}function Fa(e,t,n){return new Promise((s,a)=>{const r=new FileReader;r.onprogress=i=>{i.lengthComputable&&i.total>0?n(Math.min(100,Math.round(i.loaded/i.total*100))):n(null)},r.onload=()=>s(String(r.result??"")),r.onerror=()=>a(r.error??new Error("Failed to read file")),r.readAsText(t)})}function hs(e){const t=e.root.querySelector('input[data-action="import-cal"]');t&&t.addEventListener("change",()=>{Ss(e,t)});const n=e.root.querySelector('input[data-action="import-create-cal"]');n&&n.addEventListener("change",()=>{Ds(e,n)});const s=e.root.querySelector('input[data-action="import-ab"]');s&&s.addEventListener("change",()=>{e.onImportContacts(s)})}async function Ss(e,t){var s;if(e.state.selectedId===null)return;const n=(s=t.files)==null?void 0:s[0];t.value="",n&&(e.state.calModalOpen=!0,await Ia(e,e.state.selectedId,n,{keepEditModalOpen:!0}))}async function Ds(e,t){var f;const n=(f=t.files)==null?void 0:f[0];if(t.value="",!n)return;const s=e.root.querySelector('[data-form="create-cal"]'),a=s?new FormData(s):new FormData,r=a.get("holidays")==="on",i=a.get("readOnly")==="on";if(r){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(i){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let l=String(a.get("displayname")??"").trim();l||(l=n.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const d=String(a.get("description")??""),c=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const m=await S.createCalendar({displayname:l,description:d,color:c,readOnly:!1});e.state.selectedId=m.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${m.calendar.displayname}” — importing…`),await Ia(e,m.calendar.id,n,{keepEditModalOpen:!1,successPrefix:`Calendar “${m.calendar.displayname}” created. `})}catch(m){const u=m instanceof Error?m.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",u),e.state.busy=!1,e.render()}}async function Ia(e,t,n,s={}){e.state.busy=!0,e.clearFlash(),ee(e),e.state.importProgress={kind:"calendar",fileName:n.name,fileSizeLabel:Je(n.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ta(e),e.render();try{const a=await Fa(e,n,l=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:l};const d=e.root.querySelector(".import-progress-bar"),c=e.root.querySelector("[data-import-status-line]");d&&l!==null&&(d.classList.remove("is-indeterminate"),d.style.width=`${l}%`),c&&l!==null&&(c.textContent=`Reading file… ${l}%`)});Te(e,"uploading",{readPercent:100}),Te(e,"processing",{processPercent:0}),h.event("import.calendar.start",{file:n.name,bytes:n.size,calId:t});const r=await S.importCalendar(t,a,l=>{Aa(e,l)}),i=e.formatImportResult(r);e.state.selectedId===t&&await st(e),ee(e),Te(e,"done",{ok:!0,resultMessage:`${i} (from “${n.name}”)`}),e.setFlash("success",`${s.successPrefix||""}Import finished for “${n.name}”: ${i}.`)}catch(a){const r=a instanceof Error?a.message:"Import failed";ee(e),Te(e,"error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{s.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function Cs(e,t){if(e.state.selectedId===null)return;const n=new FormData(t),s=String(n.get("username")??"").trim(),a=String(n.get("access")??"read");if(!s){e.setFlash("error","Select a user to share with"),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await S.share(e.state.selectedId,s,a),await Nt(e,e.state.selectedId),e.setFlash("success",`Shared with ${s}`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function Es(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const n=new FormData(t),s=String(n.get("summary")??"").trim(),a=String(n.get("description")??"").trim(),r=String(n.get("location")??"").trim(),i=n.get("allDay")==="on",l=String(n.get("start")??"").trim(),d=String(n.get("end")??"").trim(),c=Number(n.get("instanceId"))||e.state.editingEvent.instanceId,f=Ie(n);if(!s){e.setFlash("error","Title is required"),e.render();return}if(!l){e.setFlash("error","Start is required"),e.render();return}let m,u;if(i)m=l.slice(0,10),u=d?d.slice(0,10):m;else if(/^\d{4}-\d{2}-\d{2}$/.test(l)){const $=Ot(l,d||null);m=new Date($.start).toISOString(),u=$.end?new Date($.end).toISOString():null}else m=new Date(l).toISOString(),u=d?new Date(d).toISOString():null;const b=e.state.editingEvent.instanceId,y=e.state.editingEvent.uri,p=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),h.event(p?"event.create":"event.update",{instanceId:c,uri:p?null:y,allDay:i,summary:s});try{const $={summary:s,description:a,location:r,allDay:i,start:m,end:u,instanceId:c,repeat:f},k=p?await S.createEvent(c,$):await S.updateEvent(b,y,$);(e.state.selectedId===null||k.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=k.event.instanceId),await st(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,h.event(p?"event.created":"event.saved",{uri:k.event.uri,instanceId:k.event.instanceId}),e.setFlash("success",te("Event",k.event.summary||s,p?"created":"saved"))}catch($){h.warn("event.save failed",$ instanceof Error?$.message:$),e.setFlash("error",$ instanceof Error?$.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ps(e,t){if(e.state.selectedId===null)return;const n=new FormData(t),s=String(n.get("displayname")??"").trim(),a=String(n.get("description")??""),r=String(n.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const i=await S.updateCalendar(e.state.selectedId,{displayname:s,description:a,color:r});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=i.calendar.id,await Nt(e,e.state.selectedId),await st(e),e.setFlash("success","Calendar updated")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function Ts(e,t){const n=new FormData(t),s=String(n.get("displayname")??"").trim(),a=String(n.get("description")??""),r=String(n.get("color")??"").trim(),i=n.get("holidays")==="on",l=String(n.get("holidayCountry")??"").trim(),d=n.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,i&&!l){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!i&&!s){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const c=await S.createCalendar({displayname:s,description:a,color:r,holidays:i,holidayCountry:i?l:void 0,readOnly:d});e.state.selectedId=c.calendar.id,e.state.selectedIds.includes(c.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,c.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let f=`Created “${c.calendar.displayname}”`;const m=c.holidayImport??c.calendar.holidayImport;m&&(f+=`. Holidays imported: ${e.formatImportResult(m)}.`),d&&(f+=" Calendar is read-only."),e.setFlash("success",f)}catch(c){e.state.createCalModalOpen=!0,e.setFlash("error",c instanceof Error?c.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function As(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const n=t.querySelector('input[name="holidays"]'),s=t.querySelector("#holidays-country-wrap"),a=t.querySelector('input[name="displayname"]'),r=t.querySelector('input[name="readOnly"]');if(!n||!s)return;const i=()=>{const l=n.checked;s.hidden=!l,a&&(a.required=!l,l&&!a.value.trim()?a.placeholder="Auto: Holidays (XX)":l||(a.placeholder="Work")),l&&r&&(r.checked=!0)};n.addEventListener("change",i),i()}function Zt(e){const{state:t}=e,n=t.calendars.filter(p=>p.canShare),s=t.calendars.filter(p=>!p.canShare),a=t.calendars.find(p=>p.id===t.selectedId)??null,r=n.map(p=>{const $=t.selectedIds.includes(p.id),k=$?" is-selected":"",w=p.id===t.selectedId?" is-primary":"",v=p.color?`<span class="cal-swatch" style="background:${o(p.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=e.accessBadge(p.access)+(p.readOnly?'<span class="badge">read-only</span>':"")+(p.holidaysCountry?`<span class="badge badge-admin">holidays ${o(p.holidaysCountry)}</span>`:"");return`<div class="cal-row${k}${w}" data-action="select-cal" data-id="${p.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
          <input type="checkbox" data-action="toggle-cal" data-id="${p.id}" ${$?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${o(p.displayname)}</span>
          <span class="cal-row-badges">${g}</span>
          <span class="muted small mono cal-row-uri">${o(p.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${p.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${p.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${p.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),i=s.map(p=>{const $=t.selectedIds.includes(p.id),k=$?" is-selected":"",w=p.id===t.selectedId?" is-primary":"",v=p.color?`<span class="cal-swatch" style="background:${o(p.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=p.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${k}${w}" data-action="select-cal" data-id="${p.id}" role="button" tabindex="0" title="${o(g)}">
        <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
          <input type="checkbox" data-action="toggle-cal" data-id="${p.id}" ${$?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${o(p.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(p.access)}</span>
          <span class="muted small">${p.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${p.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),l=t.directory.map(p=>`<option value="${o(p.username)}">${o(p.displayname)} (${o(p.username)})</option>`).join(""),d=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(p=>`<tr>
              <td>
                <strong>${o(p.displayname||p.username||p.href)}</strong>
                <div class="muted small mono">${o(p.username||p.href)}</div>
              </td>
              <td>${e.accessBadge(p.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${o(p.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),c=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",f=!!(a&&a.readOnly),m=t.calModalOpen&&a&&a.canShare?N({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
              ${e.renderFlashBanner()}
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
                      <input type="color" name="color_picker" value="${o(c)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${o(a.color||c)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${o(a.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${o(a.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${x(`Share “${a.displayname}”`,"share")}
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
                    <tbody>${d}</tbody>
                  </table>
                </div>
              </section>
              <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${x("Import / export","import-export")}
                ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||a.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||a.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",u=t.deleteConfirmId!==null?t.calendars.find(p=>p.id===t.deleteConfirmId&&p.canShare)??null:null,b=u?N({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${o(u.displayname)}</strong>
              <span class="muted small mono">(${o(u.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${et({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${u.id}"`}]}):"",y=t.createCalModalOpen?N({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
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
                  ${t.holidayCountries.map(p=>`<option value="${o(p.code)}">${o(p.name)} (${o(p.code)})</option>`).join("")}
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
            ${x("Owned","owned")}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${r||'<p class="muted">No calendars yet. Create one below.</p>'}
            ${s.length?`<div class="calendars-shared-block">
                     ${x("Shared with me","shared-with-me")}
                     <div class="cal-list" style="margin-top:0.75rem">${i}</div>
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
    ${e.renderEventModal()}`}function Ae(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const n=new FormData(t);e.state.editingContact.firstname=String(n.get("firstname")??""),e.state.editingContact.lastname=String(n.get("lastname")??""),e.state.editingContact.fullname=String(n.get("fullname")??""),e.state.editingContact.org=String(n.get("org")??""),e.state.editingContact.title=String(n.get("title")??""),e.state.editingContact.url=String(n.get("url")??""),e.state.editingContact.note=String(n.get("note")??"");const s=String(n.get("birthday")??"").trim();e.state.editingContact.birthday=s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null,e.state.editingContact.address={street:String(n.get("street")??""),city:String(n.get("city")??""),region:String(n.get("region")??""),postal:String(n.get("postal")??""),country:String(n.get("country")??"")};const a=[];let r=0;for(;n.has(`email_${r}`);)a.push(String(n.get(`email_${r}`)??"")),r++;a.length&&(e.state.editingContact.emails=a);const i=[];for(r=0;n.has(`phone_value_${r}`);)i.push({type:String(n.get(`phone_type_${r}`)??"other"),value:String(n.get(`phone_value_${r}`)??"")}),r++;i.length&&(e.state.editingContact.phones=i);const l=[];for(r=0;n.has(`custom_label_${r}`)||n.has(`custom_value_${r}`);)l.push({label:String(n.get(`custom_label_${r}`)??""),value:String(n.get(`custom_value_${r}`)??"")}),r++;e.state.editingContact.custom=l}function Us(e,t){const n=new FormData(t),s=[];let a=0;for(;n.has(`email_${a}`);){const d=String(n.get(`email_${a}`)??"").trim();d&&s.push(d),a++}const r=[];for(a=0;n.has(`phone_value_${a}`);){const d=String(n.get(`phone_value_${a}`)??"").trim();d&&r.push({type:String(n.get(`phone_type_${a}`)??"other"),value:d}),a++}const i=[];for(a=0;n.has(`custom_label_${a}`)||n.has(`custom_value_${a}`);){const d=String(n.get(`custom_label_${a}`)??"").trim(),c=String(n.get(`custom_value_${a}`)??"").trim();(d||c)&&i.push({label:d,value:c}),a++}const l={firstname:String(n.get("firstname")??"").trim(),lastname:String(n.get("lastname")??"").trim(),fullname:String(n.get("fullname")??"").trim(),org:String(n.get("org")??"").trim(),title:String(n.get("title")??"").trim(),emails:s,phones:r,address:{street:String(n.get("street")??"").trim(),city:String(n.get("city")??"").trim(),region:String(n.get("region")??"").trim(),postal:String(n.get("postal")??"").trim(),country:String(n.get("country")??"").trim()},url:String(n.get("url")??"").trim(),note:String(n.get("note")??"").trim(),birthday:(()=>{const d=String(n.get("birthday")??"").trim();return d&&/^\d{4}-\d{2}-\d{2}/.test(d)?d.slice(0,10):null})(),custom:i};return e.state.removePhotoPending?l.removePhoto=!0:e.state.photoBase64Pending&&(l.photoBase64=e.state.photoBase64Pending),l}function Y(e){const{state:t,root:n}=e,s=n.querySelector('[data-form="edit-event"]');s&&t.editingEvent&&e.syncEditingEventFromForm(s);const a=n.querySelector('[data-form="task"]');a&&t.editingTask&&e.syncEditingTaskFromForm(a);const r=n.querySelector('[data-form="note"]');r&&t.editingNote&&e.syncEditingNoteFromForm(r),t.editingContact&&Ae(e.contactsHost)}async function Fs(e,t,n,s){var c,f,m;const{state:a,root:r,render:i,setFlash:l,clearFlash:d}=e;if(t==="select-cal"||t==="toggle-cal"){const u=Number(n.dataset.id);if(!Number.isFinite(u))return!0;e.toggleCalendarSelected(u),a.busy=!0,d(),i();try{await e.loadMonthEvents()}catch(b){l("error",b instanceof Error?b.message:"Failed to load calendar")}finally{a.busy=!1,i()}return!0}if(t==="edit-cal"){const u=Number(n.dataset.id);if(!Number.isFinite(u)||!a.calendars.find(y=>y.id===u&&y.canShare))return!0;a.selectedId=u,a.selectedIds.includes(u)||(a.selectedIds=[...a.selectedIds,u]),a.calModalOpen=!0,a.deleteConfirmId=null,a.busy=!0,d(),i();try{await e.loadShares(u),await e.loadMonthEvents()}catch(y){l("error",y instanceof Error?y.message:"Failed to open calendar")}finally{a.busy=!1,i()}return!0}if(t==="close-cal-modal")return a.calModalOpen=!1,i(),!0;if(t==="open-create-cal-modal")return a.createCalModalOpen=!0,a.calModalOpen=!1,a.deleteConfirmId=null,d(),i(),!0;if(t==="close-create-cal-modal")return a.createCalModalOpen=!1,d(),i(),!0;if(t==="delete-cal"){const u=Number(n.dataset.id);return!Number.isFinite(u)||!a.calendars.find(y=>y.id===u&&y.canShare)||(a.deleteConfirmId=u,a.calModalOpen=!1,d(),i()),!0}if(t==="cancel-delete-cal")return a.deleteConfirmId=null,i(),!0;if(t==="confirm-delete-cal"){const u=Number(n.dataset.id),b=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(u)||!(b!=null&&b.checked))return!0;a.busy=!0,d(),i();try{if(await S.deleteCalendar(u),a.selectedId===u&&(a.selectedId=null),a.selectedIds=a.selectedIds.filter(y=>y!==u),a.deleteConfirmId=null,a.calModalOpen=!1,a.shares=[],a.monthEvents=[],await e.loadHome(),a.selectedId===null){const y=e.pickDefaultCalendar();y?(a.selectedId=y.id,a.selectedIds.includes(y.id)||(a.selectedIds=[...a.selectedIds,y.id]),await e.loadMonthEvents()):a.selectedIds.length>0&&(a.selectedId=a.selectedIds[0],await e.loadMonthEvents())}l("success","Calendar deleted")}catch(y){l("error",y instanceof Error?y.message:"Delete failed")}finally{a.busy=!1,i()}return!0}if(t==="month-today"){const u=new Date;a.monthCursor={y:u.getFullYear(),m:u.getMonth()},a.monthExpandDay=null,a.busy=!0,i();try{await e.loadMonthEvents()}finally{a.busy=!1,i()}return!0}if(t==="month-prev"||t==="month-next"){const u=t==="month-prev"?-1:1,b=new Date(a.monthCursor.y,a.monthCursor.m+u,1);a.monthCursor={y:b.getFullYear(),m:b.getMonth()},a.monthExpandDay=null,a.busy=!0,i();try{await e.loadMonthEvents()}finally{a.busy=!1,i()}return!0}if(t==="open-event"){s.stopPropagation();const u=Number(n.dataset.instance),b=n.dataset.uri??"";if(!Number.isFinite(u)||!b)return!0;a.busy=!0,d(),i();try{const y=await S.getEvent(u,b);a.editingEvent={...y.event,repeat:y.event.repeat??e.defaultRepeat()},a.creatingEvent=!1,a.eventModalOpen=!0,a.eventDtPicker=null,a.calModalOpen=!1,a.deleteConfirmId=null}catch(y){l("error",y instanceof Error?y.message:"Failed to open event")}finally{a.busy=!1,i()}return!0}if(t==="open-event-day"){s.stopPropagation();const u=n.dataset.day??"";return a.monthExpandDay=a.monthExpandDay===u?null:u,i(),!0}if(t==="new-event-day"){const u=s.target;if((c=u==null?void 0:u.closest)!=null&&c.call(u,".month-event, .month-event-more"))return!0;const b=n.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;if(a.selectedId===null)return l("error","Select a calendar first"),i(),!0;const y=a.calendars.find(p=>p.id===a.selectedId);return!y||y.readOnly||!(y.canShare||y.access==="readwrite")?(l("error","This calendar is read-only"),i(),!0):(a.creatingEvent=!0,a.editingEvent=e.blankEventForDay(b,a.selectedId),a.eventModalOpen=!0,a.eventDtPicker=null,a.calModalOpen=!1,a.deleteConfirmId=null,d(),i(),!0)}if(t==="close-event-modal")return a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,d(),i(),!0;if(t==="dt-open"){const u=n.dataset.dtField||"";if(!u)return!0;if(Y(e),((f=a.eventDtPicker)==null?void 0:f.field)===u)a.eventDtPicker=null;else{const b=n.dataset.dtDateOnly==="1",y=n.dataset.dtClear!=="0",p=n.dataset.dtName||u;let $=e.getDtFieldCurrentValue(u);!$&&(u==="due"||u==="dtstart"||u==="bulk-due")&&($=Pe().start);const k=ye($||L(new Date)),[w,v]=k.date.split("-").map(Number);a.eventDtPicker={field:u,viewY:w,viewM:(v||1)-1,dateOnly:b,allowClear:y,name:p}}return i(),!0}if(t==="dt-month-prev"||t==="dt-month-next"){if(!a.eventDtPicker)return!0;Y(e);const u=t==="dt-month-prev"?-1:1,b=new Date(a.eventDtPicker.viewY,a.eventDtPicker.viewM+u,1);return a.eventDtPicker={...a.eventDtPicker,viewY:b.getFullYear(),viewM:b.getMonth()},i(),!0}if(t==="dt-set-month"){if(!a.eventDtPicker)return!0;Y(e);const b=Number(n.value);return!Number.isFinite(b)||b<0||b>11||(a.eventDtPicker={...a.eventDtPicker,viewM:b},i()),!0}if(t==="dt-set-year"){if(!a.eventDtPicker)return!0;Y(e);const b=Number(n.value);return!Number.isFinite(b)||b<1||b>9999||(a.eventDtPicker={...a.eventDtPicker,viewY:b},i()),!0}if(t==="dt-pick-day"){if(!a.eventDtPicker)return!0;const u=a.eventDtPicker.field,b=n.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;Y(e);const y=a.eventDtPicker.dateOnly;if(y)e.setDtFieldValue(u,b),a.eventDtPicker=null;else{const p=e.getDtFieldCurrentValue(u),$=ye(p||Pe(b).start).hm;e.setDtFieldValue(u,`${b}T${$}`),a.eventDtPicker={...a.eventDtPicker,viewY:Number(b.slice(0,4)),viewM:Number(b.slice(5,7))-1}}if(u==="start"&&a.editingEvent&&!y&&a.editingEvent.end){const p=new Date(String(a.editingEvent.start)),$=new Date(String(a.editingEvent.end));!Number.isNaN(p.getTime())&&!Number.isNaN($.getTime())&&$<=p&&e.setDtFieldValue("end",Q(new Date(p.getTime()+3600*1e3)))}return i(),!0}if(t==="dt-pick-time"){if(!a.eventDtPicker||a.eventDtPicker.dateOnly)return!0;const u=a.eventDtPicker.field,b=n.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(b))return!0;Y(e);const y=e.getDtFieldCurrentValue(u)||Pe().start,$=`${ye(y).date}T${b}`;if(e.setDtFieldValue(u,$),u==="start"&&a.editingEvent){a.editingEvent={...a.editingEvent,allDay:!1};const k=a.editingEvent.end?ye(String(a.editingEvent.end)):null,w=new Date($);(!k||new Date(`${k.date}T${k.hm}`)<=w)&&e.setDtFieldValue("end",Q(new Date(w.getTime()+3600*1e3)))}return a.eventDtPicker=null,i(),!0}if(t==="dt-today"){if(!a.eventDtPicker)return!0;const u=a.eventDtPicker.field;Y(e);const b=L(new Date);if(a.eventDtPicker.dateOnly)e.setDtFieldValue(u,b);else{const y=Pe(b);u==="start"?(e.setDtFieldValue("start",y.start),a.editingEvent&&!a.editingEvent.end&&e.setDtFieldValue("end",y.end)):u==="end"?e.setDtFieldValue("end",y.end):e.setDtFieldValue(u,y.start)}return a.eventDtPicker=null,i(),!0}if(t==="dt-clear"){if(!a.eventDtPicker||!a.eventDtPicker.allowClear)return!0;const u=a.eventDtPicker.field;return Y(e),e.setDtFieldValue(u,null),a.eventDtPicker=null,i(),!0}if(t==="event-allday-toggle"){if(!a.editingEvent)return!0;const u=r.querySelector('[data-form="edit-event"]'),b=n.checked;if(u){const y=new FormData(u),p=String(y.get("start")??a.editingEvent.start??""),$=String(y.get("end")??a.editingEvent.end??"")||null;let k=p,w=$;if(b){const v=ds(p,$);k=v.start,w=v.end}else{const v=p.slice(0,10),g=($||p).slice(0,10),C=Ot(v,g);k=C.start,w=C.end}a.editingEvent={...a.editingEvent,summary:String(y.get("summary")??a.editingEvent.summary),description:String(y.get("description")??a.editingEvent.description),location:String(y.get("location")??a.editingEvent.location),instanceId:Number(y.get("instanceId"))||a.editingEvent.instanceId,allDay:b,start:k,end:w,repeat:Ie(y)}}else a.editingEvent={...a.editingEvent,allDay:b};return a.eventDtPicker=null,i(),!0}if(t==="event-repeat-freq"||t==="event-repeat-end"){if(!a.editingEvent)return!0;const u=r.querySelector('[data-form="edit-event"]');if(!u)return!0;const b=new FormData(u),y=u.querySelector('input[name="allDay"]'),p=Ie(b);return a.editingEvent={...a.editingEvent,summary:String(b.get("summary")??a.editingEvent.summary),description:String(b.get("description")??a.editingEvent.description),location:String(b.get("location")??a.editingEvent.location),instanceId:Number(b.get("instanceId"))||a.editingEvent.instanceId,allDay:(y==null?void 0:y.checked)??a.editingEvent.allDay,start:String(b.get("start")??a.editingEvent.start??""),end:String(b.get("end")??a.editingEvent.end??"")||null,repeat:p,hasRrule:!!String(b.get("repeatFreq")??"").trim()},p.freq&&p.endMode==="until"&&((m=a.eventDtPicker)==null?void 0:m.field)==="end"&&(a.eventDtPicker=null),i(),!0}if(t==="delete-event"){if(!a.editingEvent||!a.editingEvent.canWrite||a.creatingEvent)return!0;const u=String(a.editingEvent.summary||"this event").trim()||"this event";return a.confirmDelete={scope:"event",title:"Delete event",message:`Delete “${u}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}if(t==="revoke"){const u=n.dataset.href??"";return!u||a.selectedId===null||(a.confirmDelete={scope:"revoke-share",title:"Revoke share",message:"Revoke access for this user?",detail:"They will lose this calendar until you share it again.",href:u},i()),!0}if(t==="export-cal"){s.stopPropagation();const u=n.dataset.id,b=u!==void 0&&u!==""?Number(u):a.selectedId;if(b===null||Number.isNaN(b))return!0;a.busy=!0,d(),i();try{const{blob:y,filename:p}=await S.exportCalendar(b),$=await e.saveBlobAsFile(y,p);$==="cancelled"?l("info","Export cancelled"):$==="saved"?l("success",`Saved ${p}`):l("success",`Download started: ${p}`)}catch(y){l("error",y instanceof Error?y.message:"Export failed")}finally{a.busy=!1,i()}return!0}return!1}async function Oa(e){const t=await S.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars,e.state.selectedNoteKey!==null&&!e.state.notes.some(n=>`${n.instanceId}|${n.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function _(e,t){return`${e}|${t}`}function Is(e){const t=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(r=>{const i=_(r.instanceId,r.uri),l=!e.state.creatingNote&&i===e.state.selectedNoteKey?" is-selected":"",d=(r.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${l}" data-action="select-note" data-instance="${r.instanceId}" data-uri="${o(r.uri)}" tabindex="0" role="button">
              <td class="col-note-title">
                <span class="contact-name-primary">${o(r.summary||r.uri)}</span>
                ${d?`<span class="muted small contact-name-secondary">${o(d)}${r.description.length>80?"…":""}</span>`:""}
                ${r.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${o(ya(r.dtstart))}</td>
              <td class="col-note-cal muted small">${o(r.calendarName)}</td>
            </tr>`}).join(""),n=e.state.editingNote,s=e.state.noteCalendars.map(r=>`<option value="${r.id}" ${n&&n.instanceId===r.id?"selected":""}>${o(r.displayname)}</option>`).join(""),a=n?`<div class="card">
          ${x(e.state.creatingNote?"New note":"Edit note","notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${e.state.creatingNote?`<label>Calendar
                    <select name="instanceId" required ${e.state.noteCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.noteCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${s}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${o(n.calendarName)}</strong>${n.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${o(n.summary)}" ${n.readOnly&&!e.state.creatingNote?"readonly":""} />
            </label>
            ${e.renderPortalDateTimeField({field:"dtstart",name:"dtstart",label:"Date",value:ke(n.dtstart),dateOnly:!1,disabled:!!(n.readOnly&&!e.state.creatingNote),allowClear:!0})}
            <label>Body
              <textarea name="description" rows="8" maxlength="20000" ${n.readOnly&&!e.state.creatingNote?"readonly":""}>${o(n.description)}</textarea>
            </label>
            <div class="form-actions-row">
              ${e.state.creatingNote||n.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingNote?"Create note":"Save note"}</button>`:""}
              ${!e.state.creatingNote&&n.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingNote?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${x("Notes","notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${o(e.state.noteSearch)}" aria-label="Search notes" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-note" ${e.state.busy||e.state.noteCalendars.length===0?"disabled":""}>Add note</button>
      </div>
      ${e.state.noteCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              ${G("Title","summary",e.state.noteSort,e.state.noteOrder,"note","col-note-title")}
              ${G("Date","dtstart",e.state.noteSort,e.state.noteOrder,"note","col-note-date")}
              ${G("Calendar","calendar",e.state.noteSort,e.state.noteOrder,"note","col-note-cal")}
            </tr>
          </thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${a}
    </section>
  </div>`}function Os(e,t){if(!e.state.editingNote)return;const n=new FormData(t),s=String(n.get("dtstart")??"").trim(),a=n.get("instanceId"),r=a!==null&&String(a)!==""?Number(a):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(r)&&r>0?r:e.state.editingNote.instanceId,summary:String(n.get("summary")??e.state.editingNote.summary),description:String(n.get("description")??e.state.editingNote.description),dtstart:s?new Date(s).toISOString():null}}async function Ns(e,t){const n=new FormData(t),s=String(n.get("summary")??"").trim(),a=String(n.get("description")??"").trim(),r=String(n.get("dtstart")??"").trim(),i=r?new Date(r).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const l=Number(n.get("instanceId"));if(!Number.isFinite(l)||l<=0)throw new Error("Select a calendar");const d=await S.createNote({instanceId:l,summary:s,description:a,dtstart:i});e.state.creatingNote=!1,e.state.selectedNoteKey=_(d.note.instanceId,d.note.uri),e.state.editingNote=d.note,e.setFlash("success",te("Note",d.note.summary||s,"created"))}else if(e.state.editingNote){const l=await S.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:s,description:a,dtstart:i});e.state.editingNote=l.note,e.state.selectedNoteKey=_(l.note.instanceId,l.note.uri),e.setFlash("success",te("Note",l.note.summary||s,"saved"))}await Oa(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ms(e,t,n,s){var d;const{state:a,render:r,setFlash:i,clearFlash:l}=e;if(t==="sort-note"){const c=n.dataset.sort||"";if(!c)return!0;a.noteSort===c?a.noteOrder=a.noteOrder==="asc"?"desc":"asc":(a.noteSort=c,a.noteOrder="asc"),a.busy=!0,r();try{await e.loadNotes()}catch(f){i("error",f instanceof Error?f.message:"Sort failed")}finally{a.busy=!1,r()}return!0}if(t==="select-note"){const c=Number(n.dataset.instance),f=n.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=a.notes.find(u=>u.instanceId===c&&u.uri===f)??null;return a.creatingNote=!1,a.selectedNoteKey=e.itemKey(c,f),a.editingNote=m?{...m}:null,l(),r(),!0}if(t==="new-note")return a.creatingNote=!0,a.selectedNoteKey=null,a.editingNote={uri:"",instanceId:((d=a.noteCalendars[0])==null?void 0:d.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},l(),r(),!0;if(t==="cancel-note")return a.creatingNote=!1,a.editingNote=null,a.selectedNoteKey=null,r(),!0;if(t==="delete-note"){if(!a.editingNote||a.creatingNote)return!0;const c=String(a.editingNote.summary||"this note").trim()||"this note";return a.confirmDelete={scope:"note",title:"Delete note",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}return!1}async function Xe(e){const t=await S.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const n=new Set(e.state.tasks.map(s=>_(s.instanceId,s.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(s=>n.has(s)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(s=>`${s.instanceId}|${s.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function xs(e,t){const n=new Map;for(const f of t)f.uid&&n.set(f.uid,f);const s=new Map(t.map((f,m)=>[_(f.instanceId,f.uri),m])),a=new Map,r=[];for(const f of t){const m=f.parentUid;if(m&&n.has(m)&&m!==f.uid){const u=a.get(m)??[];u.push(f),a.set(m,u)}else r.push(f)}const i=(f,m)=>(s.get(_(f.instanceId,f.uri))??0)-(s.get(_(m.instanceId,m.uri))??0);r.sort(i);for(const[,f]of a)f.sort(i);const l=[],d=new Set,c=(f,m)=>{const u=f.uid||_(f.instanceId,f.uri);if(!d.has(u)){d.add(u),l.push({task:f,depth:Math.min(m,8)});for(const b of a.get(f.uid)??[])c(b,m+1);d.delete(u)}};for(const f of r)c(f,0);for(const f of t)l.some(m=>m.task===f)||l.push({task:f,depth:0});return l}function Ls(e,t){const n=new Set([t]);if(!t)return n;let s=!0;for(;s;){s=!1;for(const a of e.state.tasks)a.parentUid&&n.has(a.parentUid)&&a.uid&&!n.has(a.uid)&&(n.add(a.uid),s=!0)}return n}function _s(e,t,n){const s=t.instanceId,a=n||!t.uid?new Set:Ls(e,t.uid),r=e.state.tasks.filter(d=>d.uid&&d.instanceId===s&&!a.has(d.uid)&&d.uid!==t.uid),i=t.parentUid||"",l=['<option value="">None (top-level)</option>',...r.map(d=>`<option value="${o(d.uid)}" ${d.uid===i?"selected":""}>${o(d.summary||d.uid)}</option>`)];if(i&&!r.some(d=>d.uid===i)){const d=e.state.tasks.find(c=>c.uid===i);l.push(`<option value="${o(i)}" selected>${o((d==null?void 0:d.summary)||i)} (current)</option>`)}return l.join("")}function Na(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(n=>t.has(_(n.instanceId,n.uri))&&n.canWrite&&!n.readOnly)}function qs(e){const t=p=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[p]||p,n=xs(e,e.state.tasks),s=e.state.tasks.filter(p=>p.canWrite&&!p.readOnly).map(p=>_(p.instanceId,p.uri)),a=s.length>0&&s.every(p=>e.state.checkedTaskKeys.includes(p)),r=e.state.checkedTaskKeys.length>0,l=Na(e).length,d=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:n.map(({task:p,depth:$})=>{const k=_(p.instanceId,p.uri),w=!e.state.creatingTask&&k===e.state.selectedTaskKey?" is-selected":"",v=e.state.checkedTaskKeys.includes(k),g=p.status==="COMPLETED"?"badge-ok":p.status==="CANCELLED"?"":"badge-admin",C=$>0?` style="--task-depth:${$}"`:"",U=$>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",I=p.canWrite&&!p.readOnly;return`<tr class="contact-table-row task-row${$>0?" is-subtask":""}${w}${v?" is-checked":""}" data-action="select-task" data-instance="${p.instanceId}" data-uri="${o(p.uri)}" tabindex="0" role="button"${C}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${p.instanceId}" data-uri="${o(p.uri)}"
                  ${v?"checked":""} ${I?"":"disabled"} aria-label="Select ${o(p.summary||p.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${U}<span class="contact-name-primary">${o(p.summary||p.uri)}</span></span>
                ${p.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${g}">${o(t(p.status))}</span></td>
              <td class="col-task-due muted small">${o(ya(p.due))}</td>
              <td class="col-task-cal muted small">${o(p.calendarName)}</td>
              <td class="col-task-pct muted small">${p.percent?o(String(p.percent))+"%":"—"}</td>
            </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,f=(p,$)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${p}"
      title="${o($)}" aria-label="${o($)}" ${e.state.busy||l===0?"disabled":""}>${c}</button>`,m=r?`<div class="bulk-bar" style="margin-top:0.75rem">
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
        </div>`:"",u=e.state.editingTask,b=e.state.taskCalendars.map(p=>`<option value="${p.id}" ${u&&u.instanceId===p.id?"selected":""}>${o(p.displayname)}</option>`).join(""),y=u?`<div class="card">
          ${x(e.state.creatingTask?u.parentUid?"New subtask":"New task":"Edit task","tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${e.state.creatingTask?`<label>Calendar
                    <select name="instanceId" required ${e.state.taskCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.taskCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${b}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${o(u.calendarName)}</strong>${u.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${o(u.summary)}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${u.readOnly&&!e.state.creatingTask?"readonly":""}>${o(u.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${u.readOnly&&!e.state.creatingTask?"disabled":""}>
                ${_s(e,u,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${u.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(p=>`<option value="${p}" ${u.status===p?"selected":""}>${o(t(p))}</option>`).join("")}
                </select>
              </label>
              ${e.renderPortalDateTimeField({field:"due",name:"due",label:"Due",value:ke(u.due),dateOnly:!1,disabled:!!(u.readOnly&&!e.state.creatingTask),allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${o(String(u.priority||0))}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${o(String(u.percent||0))}" ${u.readOnly&&!e.state.creatingTask?"readonly":""} />
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
      ${x("Tasks","tasks")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="task-search" placeholder="Search tasks…" value="${o(e.state.taskSearch)}" aria-label="Search tasks" ${e.state.busy?"disabled":""} />
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
                  ${a?"checked":""} ${s.length===0||e.state.busy?"disabled":""} />
              </th>
              ${G("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${G("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${G("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${G("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${G("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${d}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${y}
    </section>
  </div>`}function Rs(e,t){if(!e.state.editingTask)return;const n=new FormData(t),s=String(n.get("due")??"").trim(),a=n.get("instanceId"),r=a!==null&&String(a)!==""?Number(a):e.state.editingTask.instanceId,i=String(n.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(r)&&r>0?r:e.state.editingTask.instanceId,summary:String(n.get("summary")??e.state.editingTask.summary),description:String(n.get("description")??e.state.editingTask.description),status:String(n.get("status")??e.state.editingTask.status),due:s?new Date(s).toISOString():null,priority:Number(n.get("priority")??e.state.editingTask.priority??0),percent:Number(n.get("percent")??e.state.editingTask.percent??0),parentUid:i===""?null:i}}async function Bs(e,t){var r,i;const n=Na(e);if(n.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const s=n.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(t==="bulk-task-delete"){e.state.busy=!0,e.clearFlash(),e.render();try{const l=await S.bulkTasks({op:"delete",items:s});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&n.some(d=>_(d.instanceId,d.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await Xe(e),l.failed>0?e.setFlash("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let a={};if(t==="bulk-task-status"){const l=e.root.querySelector("#bulk-task-status"),d=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(!d){e.setFlash("error","Choose a status to apply"),e.render();return}a={status:d}}else if(t==="bulk-task-due"){const l=e.state.bulkDueValue.trim();if(!l){e.setFlash("error","Choose a due date to apply"),e.render();return}const d=/^\d{4}-\d{2}-\d{2}$/.test(l)?new Date(l+"T00:00:00"):new Date((l.length===16,l));if(Number.isNaN(d.getTime())){e.setFlash("error","Invalid due date"),e.render();return}a={due:d.toISOString()}}else if(t==="bulk-task-clear-due")a={due:null};else if(t==="bulk-task-percent"){const l=e.root.querySelector("#bulk-task-percent"),d=((i=l==null?void 0:l.value)==null?void 0:i.trim())??"";if(d===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const c=Number(d);if(!Number.isFinite(c)||c<0||c>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}a={percent:Math.round(c)}}e.state.busy=!0,e.clearFlash(),e.render();try{const l=await S.bulkTasks({op:"update",items:s,fields:a});if(await Xe(e),e.state.editingTask&&!e.state.creatingTask){const c=_(e.state.editingTask.instanceId,e.state.editingTask.uri),f=e.state.tasks.find(m=>_(m.instanceId,m.uri)===c);f&&(e.state.editingTask={...f})}const d=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";l.failed>0?e.setFlash("error",`Updated ${d} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Updated ${d} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function Vs(e,t){const n=new FormData(t),s=String(n.get("summary")??"").trim(),a=String(n.get("description")??"").trim(),r=String(n.get("status")??"NEEDS-ACTION"),i=String(n.get("due")??"").trim(),l=i?new Date(i).toISOString():null,d=Number(n.get("priority")??0),c=Number(n.get("percent")??0),f=String(n.get("parentUid")??"").trim(),m=f===""?null:f;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const u=Number(n.get("instanceId"));if(!Number.isFinite(u)||u<=0)throw new Error("Select a calendar");const b=await S.createTask({instanceId:u,summary:s,description:a,status:r,due:l,priority:d,percent:c,parentUid:m});e.state.creatingTask=!1,e.state.selectedTaskKey=_(b.task.instanceId,b.task.uri),e.state.editingTask=b.task,e.setFlash("success",te(m?"Subtask":"Task",b.task.summary||s,"created"))}else if(e.state.editingTask){const u=await S.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:s,description:a,status:r,due:l,priority:d,percent:c,parentUid:m});e.state.editingTask=u.task,e.state.selectedTaskKey=_(u.task.instanceId,u.task.uri),e.setFlash("success",te("Task",u.task.summary||s,"saved"))}await Xe(e)}catch(u){e.setFlash("error",u instanceof Error?u.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Hs(e,t,n,s){var d;const{state:a,render:r,setFlash:i,clearFlash:l}=e;if(t==="sort-task"){const c=n.dataset.sort||"";if(!c)return!0;a.taskSort===c?a.taskOrder=a.taskOrder==="asc"?"desc":"asc":(a.taskSort=c,a.taskOrder=c==="due"||c==="summary"?"asc":"desc"),a.busy=!0,r();try{await e.loadTasks()}catch(f){i("error",f instanceof Error?f.message:"Sort failed")}finally{a.busy=!1,r()}return!0}if(t==="select-task"){if(s.target.closest("[data-stop-row], .task-check"))return!0;const c=Number(n.dataset.instance),f=n.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=a.tasks.find(u=>u.instanceId===c&&u.uri===f)??null;return a.creatingTask=!1,a.selectedTaskKey=e.itemKey(c,f),a.editingTask=m?{...m}:null,l(),r(),!0}if(t==="task-check"){s.preventDefault(),s.stopPropagation();const c=Number(n.dataset.instance),f=n.dataset.uri??"";if(!Number.isFinite(c)||!f)return!0;const m=e.itemKey(c,f),u=a.tasks.find(b=>e.itemKey(b.instanceId,b.uri)===m);return!u||!u.canWrite||u.readOnly||(a.checkedTaskKeys.includes(m)?a.checkedTaskKeys=a.checkedTaskKeys.filter(b=>b!==m):a.checkedTaskKeys=[...a.checkedTaskKeys,m],r()),!0}if(t==="task-select-all"){s.preventDefault();const c=a.tasks.filter(m=>m.canWrite&&!m.readOnly);return c.length>0&&c.every(m=>a.checkedTaskKeys.includes(e.itemKey(m.instanceId,m.uri)))?a.checkedTaskKeys=[]:a.checkedTaskKeys=c.map(m=>e.itemKey(m.instanceId,m.uri)),r(),!0}if(t==="bulk-task-clear")return a.checkedTaskKeys=[],r(),!0;if(t==="bulk-task-status"||t==="bulk-task-due"||t==="bulk-task-clear-due"||t==="bulk-task-percent"||t==="bulk-task-delete"){if(t==="bulk-task-delete"){const c=a.checkedTaskKeys.length;return c===0?(i("error","No tasks selected"),r(),!0):(a.confirmDelete={scope:"bulk-task",title:c===1?"Delete task":`Delete ${c} tasks`,message:c===1?"Delete the selected task?":`Delete ${c} selected tasks?`,detail:"CalDAV clients will sync the removal. This cannot be undone.",count:c},r(),!0)}return e.runBulkTaskAction(t),!0}if(t==="new-task")return a.creatingTask=!0,a.selectedTaskKey=null,a.editingTask={uri:"",instanceId:((d=a.taskCalendars[0])==null?void 0:d.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),r(),!0;if(t==="new-subtask"){if(!a.editingTask||a.creatingTask||!a.editingTask.uid||!a.editingTask.canWrite)return!0;const c=a.editingTask;return a.creatingTask=!0,a.selectedTaskKey=null,a.editingTask={uri:"",instanceId:c.instanceId,calendarId:c.calendarId,calendarName:c.calendarName,calendarUri:c.calendarUri,uid:"",parentUid:c.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),r(),!0}if(t==="cancel-task")return a.creatingTask=!1,a.editingTask=null,a.selectedTaskKey=null,r(),!0;if(t==="delete-task"){if(!a.editingTask||a.creatingTask)return!0;const c=String(a.editingTask.summary||"this task").trim()||"this task";return a.confirmDelete={scope:"task",title:"Delete task",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}return!1}async function xt(e,t){const n=await S.contacts(t,e.state.contactSearch);e.state.contacts=n.contacts,e.state.selectedContactUri!==null&&!e.state.contacts.some(s=>s.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function zs(e,t){if(e.state.selectedAbId===null)return;const n=await S.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const s=n.contact;e.state.editingContact={...s,emails:Array.isArray(s.emails)?s.emails:[],phones:Array.isArray(s.phones)?s.phones:[],custom:Array.isArray(s.custom)?s.custom:[],address:s.address??Ma(),birthday:s.birthday??null},e.state.photoPreview=s.photoDataUri??(s.hasPhoto&&e.state.selectedAbId!==null?`${S.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function Ks(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function Ma(e){return{street:"",city:"",region:"",postal:"",country:""}}function js(e,t){return new Promise((n,s)=>{const a=new FileReader;a.onload=()=>{const r=String(a.result??""),i=r.indexOf(",");n(i>=0?r.slice(i+1):r)},a.onerror=()=>s(new Error("Failed to read photo file")),a.readAsDataURL(t)})}function Ws(e){const t=e.root.querySelector('input[data-action="contact-photo"]');t&&t.addEventListener("change",()=>{(async()=>{var s;const n=(s=t.files)==null?void 0:s[0];if(t.value="",!!n){if(n.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const a=await js(e,n);e.state.photoBase64Pending=a,e.state.photoPreview=`data:${n.type||"image/jpeg"};base64,${a}`,e.state.removePhotoPending=!1,e.render()}catch(a){e.setFlash("error",a instanceof Error?a.message:"Failed to read photo"),e.render()}}})()})}async function Js(e,t){var a;if(e.state.selectedAbId===null)return;const n=(a=t.files)==null?void 0:a[0];if(t.value="",!n)return;const s=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:n.name,fileSizeLabel:Je(n.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const r=await e.readFileTextWithProgress(n,d=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:d};const c=e.root.querySelector(".import-progress-bar"),f=e.root.querySelector("[data-import-status-line]");c&&d!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${d}%`),f&&d!==null&&(f.textContent=`Reading file… ${d}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),h.event("import.contacts.start",{file:n.name,bytes:n.size,abId:s});const i=await S.importAddressBook(s,r,d=>{e.applyServerImportProgress(d)}),l=e.formatImportResult(i);await e.loadHome(),e.state.selectedAbId===s&&await xt(e,s),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${l} (from “${n.name}”)`}),e.setFlash("success",`Import finished for “${n.name}”: ${l}.`)}catch(r){const i=r instanceof Error?r.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:i}),e.setFlash("error",i)}finally{e.state.busy=!1,e.render()}}async function Ys(e,t){if(e.state.selectedAbId===null)return;const n=Us(e,t),s=ut(n);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const a=await S.createContact(e.state.selectedAbId,n);e.state.creatingContact=!1,e.state.selectedContactUri=a.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",te("Contact",ut(a.contact)||s,"created"))}else if(e.state.selectedContactUri){const a=await S.updateContact(e.state.selectedAbId,e.state.selectedContactUri,n);e.state.selectedContactUri=a.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",te("Contact",ut(a.contact)||s,"saved"))}try{await e.loadHome()}catch(a){if(console.error(a),e.state.selectedAbId!==null)try{await xt(e,e.state.selectedAbId)}catch{}}}catch(a){e.setFlash("error",a instanceof Error?a.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Gs(e,t){const n=new FormData(t),s=String(n.get("displayname")??"").trim(),a=String(n.get("description")??"").trim();if(s){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await S.createAddressBook({displayname:s,description:a});e.state.selectedAbId=r.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${r.addressbook.displayname}” created`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function Qs(e,t){if(e.state.selectedAbId===null)return;const n=new FormData(t),s=String(n.get("displayname")??"").trim(),a=String(n.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await S.updateAddressBook(e.state.selectedAbId,{displayname:s,description:a}),await e.loadHome(),e.setFlash("success",te("Address book",s,"updated"))}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function Xs(e){const{state:t}=e,n=t.addressBooks.map(k=>`<div class="cal-row${k.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${k.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${o(k.displayname)}</span>
          <span class="muted small">${k.cardCount} contact${k.cardCount===1?"":"s"}</span>
          <span class="muted small mono cal-row-uri">${o(k.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${k.id}" ${t.busy?"disabled":""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${k.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${k.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`).join(""),s=t.addressBooks.find(k=>k.id===t.selectedAbId)??null,a=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map(k=>{const w=!t.creatingContact&&k.uri===t.selectedContactUri?" is-selected":"",v=o((k.displayname||"?").slice(0,1).toUpperCase()),g=k.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${o(S.contactPhotoUrl(t.selectedAbId,k.uri))}" alt="" loading="lazy" data-avatar-fallback="${v}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${v}</span>`;return`<tr class="contact-table-row${w}" data-action="select-contact" data-uri="${o(k.uri)}" tabindex="0" role="button">
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${g}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${o(k.displayname)}</span>
                    ${k.org?`<span class="muted small contact-name-secondary">${o(k.org)}</span>`:""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${o(k.email||"—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${o(k.phone||"—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${o(k.org||"—")}</span></td>
            </tr>`}).join(""),r=t.editingContact,i=Array.isArray(r==null?void 0:r.emails)&&r.emails.length>0?r.emails:[""],l=Array.isArray(r==null?void 0:r.phones)&&r.phones.length>0?r.phones:[{type:"cell",value:""}],d=(r==null?void 0:r.address)??e.emptyAddress(),c=i.map((k,w)=>`<div class="multi-row" data-multi="email" data-idx="${w}">
        <input type="email" name="email_${w}" value="${o(k??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${w}" ${i.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),f=l.map((k,w)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${w}">
        <select name="phone_type_${w}" aria-label="Phone type">
          ${["cell","work","home","other"].map(v=>`<option value="${v}" ${((k==null?void 0:k.type)??"other")===v?"selected":""}>${v}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${w}" value="${o((k==null?void 0:k.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${w}" ${l.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),m=Array.isArray(r==null?void 0:r.custom)?r.custom:[],u=m.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':m.map((k,w)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${w}">
              <input type="text" name="custom_label_${w}" value="${o(k.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${w}" value="${o(k.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${w}" title="Remove">×</button>
            </div>`).join(""),b=t.contactModalOpen&&r&&s?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
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
                    ${t.photoPreview?`<img src="${o(t.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${o((r.fullname||r.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      ${t.photoPreview?"Change photo":"Upload photo"}
                      <input type="file" accept="image/*" data-action="contact-photo" ${t.busy?"disabled":""} hidden />
                    </label>
                    ${t.photoPreview||r.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${t.busy?"disabled":""}>Remove photo</button>`:""}
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${o(r.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${o(r.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${o(r.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${o(r.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${o(r.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${c}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${i.length>=10?"disabled":""}>+ Email</button>
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
                    <input type="text" name="street" value="${o(d.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${o(d.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${o(d.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${o(d.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${o(d.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${o(r.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${e.renderPortalDateTimeField({field:"birthday",name:"birthday",label:"Birthday",value:r.birthday||"",dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${u}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${m.length>=30?"disabled":""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${o(r.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>${t.creatingContact?"Create contact":"Save contact"}</button>
                  ${!t.creatingContact&&r.uri?`<button type="button" class="btn" data-action="export-contact" ${t.busy?"disabled":""}>Export .vcf</button>`:""}
                  ${t.creatingContact?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${t.busy?"disabled":""}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${t.busy?"disabled":""}>Cancel</button>
                  ${!t.creatingContact&&r.uri?`<span class="muted small mono">${o(r.uri)}</span>`:""}
                </div>
              </form>
            </div>
          </div>
        </div>`:"",y=t.abModalOpen&&s?N({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${o(s.uri)} · ${s.cardCount} contact${s.cardCount===1?"":"s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${o(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${o(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${o(s.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${x("Import / export","contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${t.busy?"disabled":""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${t.busy?"disabled":""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",p=t.deleteAbConfirmId!==null?t.addressBooks.find(k=>k.id===t.deleteAbConfirmId)??null:null,$=p?N({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${o(p.displayname)}</strong>
              <span class="muted small mono">(${o(p.uri)})</span>.</p>
            <p class="muted small">${(p.cardCount??0)>0?`All ${p.cardCount} contact${p.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${et({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${p.id}"`}]}):"";return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${x("Address books","address-books")}
          </div>
          <div class="cal-list contacts-ab-list">
            ${n||'<p class="muted">No address books yet. Create one below.</p>'}
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
                  ${x("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${o(t.contactSearch)}" aria-label="Search contacts" ${t.busy?"disabled":""} />
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
                      ${a}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
      </section>
    </div>
    ${$}
    ${y}
    ${b}`}async function Zs(e,t,n,s){var c,f;const{state:a,root:r,render:i,setFlash:l,clearFlash:d}=e;if(t==="select-ab"){const m=Number(n.dataset.id);if(!Number.isFinite(m))return!0;a.selectedAbId=m,a.abModalOpen=!1,a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactModalOpen=!1,a.contactSearch="",a.contacts=[],a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,d(),a.busy=!0,i();try{await e.loadContacts(m)}catch(u){l("error",u instanceof Error?u.message:"Failed to load contacts")}finally{a.busy=!1,i()}return!0}if(t==="edit-ab"){s.stopPropagation();const m=Number(n.dataset.id);if(!Number.isFinite(m)||!a.addressBooks.find(y=>y.id===m))return!0;const b=a.selectedAbId!==m;a.selectedAbId=m,a.abModalOpen=!0,a.contactModalOpen=!1,d(),b&&(a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactSearch="",a.contacts=[],a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1),a.busy=!0,i();try{b&&await e.loadContacts(m)}catch(y){l("error",y instanceof Error?y.message:"Failed to open address book")}finally{a.busy=!1,i()}return!0}if(t==="close-ab-modal")return a.abModalOpen=!1,i(),!0;if(t==="select-contact"){const m=n.dataset.uri??"";if(!m)return!0;d();try{await e.openContact(m)}catch(u){l("error",u instanceof Error?u.message:"Failed to load contact")}return i(),!0}if(t==="new-contact")return a.selectedAbId===null||(e.startNewContact(),d(),i()),!0;if(t==="cancel-contact"||t==="close-contact-modal")return a.creatingContact=!1,a.contactModalOpen=!1,a.editingContact=null,a.selectedContactUri=null,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,a.eventDtPicker=null,d(),i(),!0;if(t==="add-email"||t==="add-phone"||t==="add-custom")return a.editingContact&&(Ae(e.contactsHost),Array.isArray(a.editingContact.emails)||(a.editingContact.emails=[""]),Array.isArray(a.editingContact.phones)||(a.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(a.editingContact.custom)||(a.editingContact.custom=[]),t==="add-email"?a.editingContact.emails.length<10&&a.editingContact.emails.push(""):t==="add-phone"?a.editingContact.phones.length<10&&a.editingContact.phones.push({type:"other",value:""}):a.editingContact.custom.length<30&&a.editingContact.custom.push({label:"",value:""}),i()),!0;if(t==="remove-email"){if(!a.editingContact)return!0;Ae(e.contactsHost);const m=Number(n.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(a.editingContact.emails)?a.editingContact.emails:[""];return a.editingContact.emails=u.filter((b,y)=>y!==m),a.editingContact.emails.length===0&&(a.editingContact.emails=[""]),i(),!0}if(t==="remove-phone"){if(!a.editingContact)return!0;Ae(e.contactsHost);const m=Number(n.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(a.editingContact.phones)?a.editingContact.phones:[{type:"cell",value:""}];return a.editingContact.phones=u.filter((b,y)=>y!==m),a.editingContact.phones.length===0&&(a.editingContact.phones=[{type:"cell",value:""}]),i(),!0}if(t==="remove-custom"){if(!a.editingContact)return!0;Ae(e.contactsHost);const m=Number(n.dataset.idx);return Number.isFinite(m)&&(a.editingContact.custom=(Array.isArray(a.editingContact.custom)?a.editingContact.custom:[]).filter((u,b)=>b!==m),i()),!0}if(t==="remove-photo")return a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!0,a.editingContact&&(a.editingContact.hasPhoto=!1),i(),!0;if(t==="delete-contact"){if(a.selectedAbId===null||!a.selectedContactUri)return!0;const m=String(((c=a.editingContact)==null?void 0:c.fullname)||((f=a.editingContact)==null?void 0:f.displayname)||"this contact").trim()||"this contact";return a.confirmDelete={scope:"contact",title:"Delete contact",message:`Delete “${m}”?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},i(),!0}if(t==="delete-ab"){s.stopPropagation();const m=Number(n.dataset.id??a.selectedAbId);return!Number.isFinite(m)||!a.addressBooks.find(b=>b.id===m)||(a.deleteAbConfirmId=m,a.abModalOpen=!1,a.contactModalOpen=!1,d(),i()),!0}if(t==="cancel-delete-ab")return a.deleteAbConfirmId=null,i(),!0;if(t==="confirm-delete-ab"){const m=Number(n.dataset.id),u=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(m)||!(u!=null&&u.checked))return!0;const b=a.addressBooks.find(p=>p.id===m);if(!b)return!0;const y=(b.cardCount??0)>0;a.busy=!0,d(),i();try{await S.deleteAddressBook(m,y),a.selectedAbId===m&&(a.selectedAbId=null,a.contacts=[],a.editingContact=null,a.selectedContactUri=null,a.creatingContact=!1),a.deleteAbConfirmId=null,a.abModalOpen=!1,a.contactModalOpen=!1,await e.loadHome(),a.selectedAbId===null&&a.addressBooks.length>0&&(a.selectedAbId=a.addressBooks[0].id,await e.loadContacts(a.selectedAbId)),l("success","Address book deleted")}catch(p){l("error",p instanceof Error?p.message:"Delete failed")}finally{a.busy=!1,i()}return!0}if(t==="export-ab"){s.stopPropagation();const m=n.dataset.id,u=m!==void 0&&m!==""?Number(m):a.selectedAbId;if(u===null||Number.isNaN(u))return!0;a.busy=!0,d(),i();try{const{blob:b,filename:y}=await S.exportAddressBook(u),p=await e.saveBlobAsFile(b,y);p==="cancelled"?l("info","Export cancelled"):p==="saved"?l("success",`Saved ${y}`):l("success",`Download started: ${y}`)}catch(b){l("error",b instanceof Error?b.message:"Export failed")}finally{a.busy=!1,i()}return!0}if(t==="export-contact"){if(a.selectedAbId===null||!a.selectedContactUri||a.creatingContact)return!0;a.contactModalOpen=!0,a.busy=!0,d(),i();try{const{blob:m,filename:u}=await S.exportContact(a.selectedAbId,a.selectedContactUri),b=await e.saveBlobAsFile(m,u);b==="cancelled"?l("info","Export cancelled"):b==="saved"?l("success",`Saved ${u}`):l("success",`Download started: ${u}`)}catch(m){l("error",m instanceof Error?m.message:"Export failed")}finally{a.busy=!1,i()}return!0}return!1}function Lt(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function xa(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function _t(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),n=t[1]??"overview",s=xa(n)??"overview";let a=null;if(s==="users"&&t[2])try{a=decodeURIComponent(t[2])}catch{a=t[2]}return{tab:"admin",adminPage:s,adminUsername:a}}return{tab:Lt(e),adminPage:null,adminUsername:null}}function er(){const e=_t().tab;if(e)return e;try{const t=Lt(sessionStorage.getItem(da));if(t)return t}catch{}return"calendars"}function tr(){const e=_t().adminPage;if(e)return e;try{const t=xa(sessionStorage.getItem(oa));if(t)return t}catch{}return"overview"}function ar(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function pt(e,t="overview",n=null){try{sessionStorage.setItem(da,e),e==="admin"&&sessionStorage.setItem(oa,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const s=e==="admin"?ar(t,n):`#${e}`;location.hash!==s&&history.replaceState(null,"",`${location.pathname}${location.search}${s}`)}function ea(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${o(e)}</span>`}function ft(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function nr(e){const{state:t,root:n}=e;if(!t.user){e.renderLogin();return}let s;switch(t.activeTab){case"calendars":s=Zt(e);break;case"contacts":s=Xs(e);break;case"tasks":s=e.renderTasksTab();break;case"notes":s=e.renderNotesTab();break;case"files":s=e.renderFilesTab();break;case"admin":s=e.renderAdminSection();break;default:s=Zt(e)}const a=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",r=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage==="overview"?"admin-overview":t.adminPage==="users"?"admin-users":t.adminPage==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${t.activeTab==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${t.activeTab==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${t.activeTab==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${t.activeTab==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${t.activeTab==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${t.activeTab==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${t.activeTab==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${t.activeTab==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${t.activeTab==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${t.activeTab==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${a}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;n.innerHTML=e.shell(s,{tabs:r}),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}async function sr(e,t,n,s){const{state:a,render:r,clearFlash:i,setFlash:l}=e;if(t==="confirm-delete-cancel")return Wt(a),r(),!0;if(t==="confirm-delete-ok"){const d=a.confirmDelete;if(!d)return r(),!0;const c=d.scope;if(Wt(a),c==="event"){if(!a.editingEvent||!a.editingEvent.canWrite||a.creatingEvent)return r(),!0;const f=a.editingEvent.instanceId,m=a.editingEvent.uri;a.busy=!0,i(),r();try{await S.deleteEvent(f,m),a.eventModalOpen=!1,a.editingEvent=null,await e.loadMonthEvents(),l("success","Event deleted")}catch(u){l("error",u instanceof Error?u.message:"Delete failed")}finally{a.busy=!1,r()}return!0}if(c==="task"){if(!a.editingTask||a.creatingTask)return r(),!0;a.busy=!0,i(),r();try{await S.deleteTask(a.editingTask.instanceId,a.editingTask.uri),a.selectedTaskKey=null,a.editingTask=null,await e.loadTasks(),l("success","Task deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{a.busy=!1,r()}return!0}if(c==="note"){if(!a.editingNote||a.creatingNote)return r(),!0;a.busy=!0,i(),r();try{await S.deleteNote(a.editingNote.instanceId,a.editingNote.uri),a.selectedNoteKey=null,a.editingNote=null,await e.loadNotes(),l("success","Note deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{a.busy=!1,r()}return!0}if(c==="contact"){if(a.selectedAbId===null||!a.selectedContactUri)return r(),!0;a.busy=!0,i(),a.contactModalOpen=!0,r();try{await S.deleteContact(a.selectedAbId,a.selectedContactUri),a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactModalOpen=!1,a.eventDtPicker=null,a.photoPreview=null,await e.loadHome(),l("success","Contact deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{a.busy=!1,r()}return!0}if(c==="bulk-task")return await e.runBulkTaskAction("bulk-task-delete"),!0;if(c==="revoke-share"){const f=d.href??"";if(!f||a.selectedId===null)return r(),!0;a.calModalOpen=!0,a.busy=!0,i(),r();try{await S.revoke(a.selectedId,f),await e.loadShares(a.selectedId),l("success","Share revoked")}catch(m){l("error",m instanceof Error?m.message:"Revoke failed")}finally{a.busy=!1,r()}return!0}return r(),!0}if(t==="close-import-progress")return a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")&&e.closeImportProgress(),!0;if(t==="logout"){a.busy=!0,h.event("logout");try{await S.logout()}catch{}return e.clearPortalSessionState(),i(),r(),!0}if(t==="info"){const d=n.dataset.info??"";return e.openInfoModal(d),!0}if(t==="info-close")return e.closeInfoModal(),!0;if(t==="flash-close")return i(),r(),!0;if(t==="user-menu-toggle")return s.stopPropagation(),a.userMenuOpen=!a.userMenuOpen,r(),!0;if(t==="user-menu-close")return a.userMenuOpen&&(a.userMenuOpen=!1,r()),!0;if(t==="tab"){const d=Lt(n.dataset.tab);return d&&(d==="admin"&&(a.adminPage="overview"),await e.activateTab(d)),!0}return!1}async function ta(e,t){const n=t.target.closest("[data-action]");if(!n)return;const s=n.dataset.action;s&&(h.debug(`action:${s}`,{id:n.dataset.id,tab:n.dataset.tab,uri:n.dataset.uri}),!await sr(e,s,n,t)&&(s.startsWith("admin-")&&await as(e.adminHost,s,n)||(s.startsWith("files-")||s==="close-files-upload-progress")&&await Fn(e.filesHost,s,n,t)||await Fs(e,s,n,t)||await Hs(e,s,n,t)||await Ms(e,s,n)||await Zs(e,s,n,t)))}function rr(e){const{state:t,root:n,render:s,setFlash:a}=e;n.querySelectorAll("[data-action]").forEach(D=>{D.addEventListener("click",P=>{const A=P.target.closest("[data-action]");((A==null?void 0:A.dataset.action)==="info"||(A==null?void 0:A.dataset.action)==="info-close")&&(P.preventDefault(),P.stopPropagation()),ta(e,P)})}),n.querySelectorAll('select[data-action="dt-set-month"], select[data-action="dt-set-year"]').forEach(D=>{D.addEventListener("change",P=>{P.stopPropagation(),ta(e,P)}),D.addEventListener("click",P=>{P.stopPropagation()})}),e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),We(t),t.eventDtPicker&&un(t,s),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),n.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(D=>{D.addEventListener("keydown",P=>{(P.key==="Enter"||P.key===" ")&&(P.preventDefault(),D.click())})});const r=n.querySelector("#delete-cal-confirm"),i=n.querySelector("#delete-cal-submit");r==null||r.addEventListener("change",()=>{i&&(i.disabled=!r.checked||t.busy)});const l=n.querySelector("#delete-ab-confirm"),d=n.querySelector("#delete-ab-submit");l==null||l.addEventListener("change",()=>{d&&(d.disabled=!l.checked||t.busy)}),n.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(D=>{D.addEventListener("error",()=>{const P=D.dataset.avatarFallback||"?",A=document.createElement("span");A.className="contact-avatar contact-avatar-fallback",A.setAttribute("aria-hidden","true"),A.textContent=P,D.replaceWith(A)})}),t.escapeBound||(document.addEventListener("keydown",D=>{if(D.key==="Escape"){if(t.importProgress&&(t.importProgress.phase==="done"||t.importProgress.phase==="error")){e.closeImportProgress();return}if(!t.importProgress){if(t.filesUploadProgress&&(t.filesUploadProgress.phase==="done"||t.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(!t.filesUploadProgress){if(t.filesUploadMenuOpen){t.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),s();return}if(t.userMenuOpen){t.userMenuOpen=!1,e.unbindUserMenuOutside(),s();return}if(t.filesUploadConflict!==null){ze(e.filesHost,"cancel");return}if(t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen){t.filesRenamePath=null,t.filesDeletePaths=null,e.resetFilesTransferTree(),t.filesMkdirOpen=!1,s();return}if(t.confirmDelete){t.confirmDelete=null,s();return}if(e.closeInfoModal(),t.eventDtPicker){t.eventDtPicker=null,We(t),s();return}if(t.eventModalOpen){t.eventModalOpen=!1,t.editingEvent=null,t.creatingEvent=!1,t.eventDtPicker=null,s();return}if(t.contactModalOpen){t.contactModalOpen=!1,t.editingContact=null,t.creatingContact=!1,t.photoPreview=null,t.photoBase64Pending=null,t.removePhotoPending=!1,s();return}if(t.abModalOpen){t.abModalOpen=!1,s();return}if(t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null){t.calModalOpen=!1,t.createCalModalOpen=!1,t.deleteConfirmId=null,t.deleteAbConfirmId=null,s();return}if(t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null){t.adminUserCreateOpen=!1,t.adminUserEditOpen=!1,t.adminUserDeleteUsername=null,s();return}if(t.adminResetModalOpen){t.adminResetModalOpen=!1,s();return}if(t.adminDbConfirmOpen){t.adminDbConfirmOpen=!1,t.adminDbConfirmText="",t.adminDbPendingBody=null,s();return}(t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null)&&(t.adminCalModal=null,t.adminAbModal=null,t.adminResourceDelete=null,s())}}}}),t.escapeBound=!0);const c=n.querySelector('[data-form="login"]');c==null||c.addEventListener("submit",D=>{D.preventDefault(),e.onLogin(c)});const f=n.querySelector('[data-form="share"]');f==null||f.addEventListener("submit",D=>{D.preventDefault(),e.onShare(f)});const m=n.querySelector('[data-form="edit-event"]');m==null||m.addEventListener("submit",D=>{D.preventDefault(),e.onSaveEvent(m)}),m==null||m.querySelectorAll('select[name="repeatFreq"], select[name="repeatEndMode"]').forEach(D=>{D.addEventListener("change",()=>{if(!t.editingEvent)return;const P=new FormData(m);t.editingEvent={...t.editingEvent,repeat:Ie(P),hasRrule:!!String(P.get("repeatFreq")??"").trim()},s()})});const u=n.querySelector('[data-form="edit-cal"]');u==null||u.addEventListener("submit",D=>{D.preventDefault(),e.onEditCal(u)}),u&&e.bindColorPair(u);const b=n.querySelector('[data-form="create-cal"]');b==null||b.addEventListener("submit",D=>{D.preventDefault(),e.onCreateCal(b)}),b&&e.bindColorPair(b);const y=n.querySelector('[data-form="contact"]');y==null||y.addEventListener("submit",D=>{D.preventDefault(),e.onSaveContact(y)});const p=n.querySelector('[data-form="create-ab"]');p==null||p.addEventListener("submit",D=>{D.preventDefault(),e.onCreateAb(p)});const $=n.querySelector('[data-form="edit-ab"]');$==null||$.addEventListener("submit",D=>{D.preventDefault(),e.onEditAb($)});const k=n.querySelector('[data-form="task"]');if(k==null||k.addEventListener("submit",D=>{D.preventDefault(),e.onSaveTask(k)}),k){const D=k.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!t.creatingTask||!t.editingTask)return;const P=Number(D.value);if(!Number.isFinite(P)||P<=0)return;e.syncEditingTaskFromForm(k);const A=t.editingTask.parentUid;t.editingTask={...t.editingTask,instanceId:P,parentUid:A&&t.tasks.some(q=>q.uid===A&&q.instanceId===P)?A:null},s()})}const w=n.querySelector('[data-form="note"]');if(w==null||w.addEventListener("submit",D=>{D.preventDefault(),e.onSaveNote(w)}),w){const D=w.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!t.creatingNote||!t.editingNote)return;const P=Number(D.value);!Number.isFinite(P)||P<=0||(e.syncEditingNoteFromForm(w),t.editingNote={...t.editingNote,instanceId:P},s())})}const v=n.querySelector('input[data-action="contact-search"]');v==null||v.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.contactSearch=v.value,(async()=>{try{t.selectedAbId!==null&&await e.loadContacts(t.selectedAbId),s()}catch(D){a("error",D instanceof Error?D.message:"Search failed"),s()}})()},250)});const g=n.querySelector('input[data-action="task-search"]');g==null||g.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.taskSearch=g.value,(async()=>{try{await e.loadTasks(),s()}catch(D){a("error",D instanceof Error?D.message:"Search failed"),s()}})()},250)});const C=n.querySelector('input[data-action="note-search"]');C==null||C.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.noteSearch=C.value,(async()=>{try{await e.loadNotes(),s()}catch(D){a("error",D instanceof Error?D.message:"Search failed"),s()}})()},250)});const U=n.querySelector('select[data-action="admin-db-backend"]');U==null||U.addEventListener("change",()=>{t.adminDbFormBackend=U.value==="pgsql"?"pgsql":"sqlite",s()});const I=n.querySelector('input[data-action="admin-db-confirm-input"]');I==null||I.addEventListener("input",()=>{t.adminDbConfirmText=I.value;const D=n.querySelector('[data-action="admin-db-confirm-save"]');D&&(D.disabled=t.busy||t.adminDbConfirmText.trim()!=="CONFIRM")});const O=n.querySelector('input[data-action="admin-reset-password"]');O==null||O.addEventListener("input",()=>{t.adminResetPassword=O.value;const D=n.querySelector('[data-action="admin-reset-confirm"]');D&&(D.disabled=t.busy||!t.adminResetConfirmChecked||t.adminResetPassword.trim()==="")}),wa(e.filesHost),Ca(e.adminHost),e.bindImportInput(),e.bindHolidaysToggle(),e.bindContactPhotoInput()}function bt(e){const{state:t}=e;t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(t.activeTab="calendars",t.adminPage="overview",e.persistTab(t.activeTab))}async function ir(e,t,n={}){return Da(e.adminHost,t,n)}async function aa(e,t,n={}){const{state:s,render:a,setFlash:r,clearFlash:i}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&s.adminCapabilities&&!s.adminCapabilities.uiEnabled&&r("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t="calendars"),t==="admin"){await e.activateAdminPage(s.adminPage||"overview",{...n,username:s.adminPage==="users"?s.adminSelectedUsername:null});return}s.activeTab=t,s.userMenuOpen=!1,e.persistTab(t),h.event("tab",{tab:t}),t!=="calendars"&&(s.calModalOpen=!1,s.deleteConfirmId=null),t!=="contacts"&&(s.deleteAbConfirmId=null),n.clearFlash!==!1&&i(),s.busy=!0,a();try{t==="contacts"&&s.selectedAbId!==null?await e.loadContacts(s.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await e.loadTasks():t==="notes"?await e.loadNotes():t==="files"&&await e.loadFiles()}catch(l){h.warn("tab load failed",l instanceof Error?l.message:l),r("error",l instanceof Error?l.message:"Failed to load")}finally{s.busy=!1,a()}}async function Se(e){const{state:t}=e;h.debug("loadHome");const[n,s,a]=await Promise.all([S.calendars(),S.directory().catch(()=>({users:[]})),S.addressbooks()]);if(t.calendars=n.calendars,t.directory=s.users,t.addressBooks=a.addressbooks,h.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await S.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(i=>i.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),t.selectedIds.length===0){const r=e.pickDefaultCalendar();r?(t.selectedIds=[r.id],t.selectedId=r.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id)}t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await e.loadTasks(),t.activeTab==="notes"&&await e.loadNotes(),t.activeTab==="files"&&await e.loadFiles()}function lr(e){const{state:t}=e;return Ft(t.portalUi.timeFormat)}function dr(e){const{state:t}=e;return It(t.portalUi.weekStart)}function or(e){const{state:t}=e;return Ea(t.portalUi.weekStart)}function La(e,t,n){const{state:s}=e;return is(t,n,s.portalUi.timeFormat)}function cr(e,t,n,s,a){var c,f;const{state:r}=e,i=ye(n),l=((c=r.eventDtPicker)==null?void 0:c.viewY)??Number(i.date.slice(0,4)),d=((f=r.eventDtPicker)==null?void 0:f.viewM)??Number(i.date.slice(5,7))-1;return os({field:t,value:n,dateOnly:s,allowClear:a,viewY:l,viewM:d,weekStart:r.portalUi.weekStart,timeFormat:r.portalUi.timeFormat})}function gt(e){cs(e.root)}function De(e,t){var b;const{state:n}=e,{field:s,name:a,label:r,value:i,dateOnly:l=!1,required:d,disabled:c,allowClear:f=!0}=t,m=((b=n.eventDtPicker)==null?void 0:b.field)===s,u=La(e,i,l);return`<div class="dt-field${m?" is-open":""}" data-dt-id="${o(s)}">
    <span class="dt-field-label">${o(r)}</span>
    <input type="hidden" name="${o(a)}" value="${o(i)}" ${d?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${o(s)}"
      data-dt-name="${o(a)}" data-dt-date-only="${l?"1":"0"}" data-dt-clear="${f?"1":"0"}"
      ${c?"disabled":""} aria-expanded="${m}">
      <span class="dt-trigger-text">${o(u)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${m&&!c?cr(e,s,i,l,f):""}
  </div>`}function na(e,t){var s,a,r,i,l,d,c,f;const{state:n}=e;return t==="start"?String(((s=n.editingEvent)==null?void 0:s.start)||""):t==="end"?String(((a=n.editingEvent)==null?void 0:a.end)||""):t==="until"?((i=(r=n.editingEvent)==null?void 0:r.repeat)==null?void 0:i.until)||ve((l=n.editingEvent)==null?void 0:l.start)||L(new Date):t==="due"?ke((d=n.editingTask)==null?void 0:d.due):t==="dtstart"?ke((c=n.editingNote)==null?void 0:c.dtstart):t==="bulk-due"?n.bulkDueValue:t==="birthday"?String(((f=n.editingContact)==null?void 0:f.birthday)||""):""}function sa(e,t,n){const{state:s}=e;if(t==="start"&&s.editingEvent){s.editingEvent={...s.editingEvent,start:n||""};return}if(t==="end"&&s.editingEvent){s.editingEvent={...s.editingEvent,end:n};return}if(t==="until"&&s.editingEvent){s.editingEvent={...s.editingEvent,repeat:{...s.editingEvent.repeat??e.defaultRepeat(),until:n,endMode:"until"}};return}if(t==="due"&&s.editingTask){if(n===null||n==="")s.editingTask={...s.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(n))s.editingTask={...s.editingTask,due:new Date(n+"T00:00:00").toISOString()};else{const a=new Date((n.length===16,n));s.editingTask={...s.editingTask,due:Number.isNaN(a.getTime())?n:a.toISOString()}}return}if(t==="dtstart"&&s.editingNote){if(n===null||n==="")s.editingNote={...s.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(n))s.editingNote={...s.editingNote,dtstart:new Date(n+"T00:00:00").toISOString()};else{const a=new Date((n.length===16,n));s.editingNote={...s.editingNote,dtstart:Number.isNaN(a.getTime())?n:a.toISOString()}}return}if(t==="birthday"&&s.editingContact){s.editingContact={...s.editingContact,birthday:n&&/^\d{4}-\d{2}-\d{2}/.test(n)?n.slice(0,10):null};return}t==="bulk-due"&&(s.bulkDueValue=n||"")}function ur(e,t){const{root:n}=e,s=dn[t];if(!s)return;const a=n.querySelector("#info-modal"),r=n.querySelector("#info-modal-title"),i=n.querySelector("#info-modal-body");if(!a||!r||!i)return;r.textContent=s.title,i.innerHTML=s.paragraphs.map(d=>`<p>${o(d)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const l=a.querySelector(".info-modal-close");l==null||l.focus()}function mr(e){const{root:t}=e,n=t.querySelector("#info-modal");n&&(n.hidden=!0,document.body.classList.remove("info-modal-open"))}async function pr(e,t){const n=window;if(typeof n.showSaveFilePicker=="function")try{const i=await(await n.showSaveFilePicker({suggestedName:t})).createWritable();try{await i.write(e)}finally{await i.close()}return"saved"}catch(r){if(r instanceof DOMException&&r.name==="AbortError")return"cancelled"}const s=URL.createObjectURL(e),a=document.createElement("a");return a.href=s,a.download=t,a.rel="noopener",a.style.display="none",document.body.appendChild(a),a.click(),window.setTimeout(()=>{URL.revokeObjectURL(s),a.remove()},6e4),"started"}function fr(e){const t=e.querySelector('input[name="color_picker"]'),n=e.querySelector('input[name="color"]');!t||!n||(t.addEventListener("input",()=>{n.value=t.value.toUpperCase()}),n.addEventListener("change",()=>{let s=n.value.trim();s&&!s.startsWith("#")&&(s=`#${s}`),/^#[0-9A-Fa-f]{6}/.test(s)&&(t.value=s.slice(0,7),n.value=s.toUpperCase())}))}function br(e){const t=Ga({activeTab:er(),adminPage:tr(),adminSelectedUsername:_t().adminUsername??null});let n,s,a,r,i,l,d;function c(g,C){ca(t,g,C)}function f(){Za(t)}function m(){const g=Kt(e);t.user?nr(d):zt(e,t,(C,U)=>ot(t,C,U,{renderImportProgressModal:()=>qe(a),renderFilesUploadProgressModal:()=>_e(n)})),rr(d),jt(e,g),requestAnimationFrame(()=>{var C;gt(d),(C=e.querySelector(".dt-time.is-selected"))==null||C.scrollIntoView({block:"center"})})}function u(){ee(a)}function b(){$e(n)}function y(){z(n)}function p(){$t(t)}function $(){j(n)}function k(){en(t,{stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,resetFilesTransferTree:y,unbindUserMenuOutside:p,unbindFilesUploadMenuOutside:$})}function w(g){tn(t,{message:g,clearSession:k,render:m})}function v(){return{state:t,render:m,handleSessionExpired:w,clearPortalSessionState:k,normalizeActiveTab:()=>bt(d),persistTab:pt,loadHome:()=>Se(d),loadAdminCapabilities:()=>ht(s),loadAdminDashboard:()=>Ye(s),loadAdminUsers:()=>oe(s),loadAdminUserDetail:g=>K(s,g),loadAdminUserResources:g=>ce(s,g),loadAdminSystemSettings:()=>Ge(s),loadAdminDatabaseSettings:()=>Qe(s),adminPageMeta:g=>ae(s,g),setFlash:c,clearFlash:f}}n={state:t,root:e,render:m,setFlash:c,clearFlash:f},s={state:t,root:e,render:m,setFlash:c,clearFlash:f,userIsAdmin:()=>de(t),adminUiEnabled:()=>Fe(t),persistTab:pt,activateTab:(g,C)=>aa(d,g,C),loadHome:()=>Se(d),normalizeActiveTab:()=>bt(d)},a={state:t,root:e,render:m,setFlash:c,clearFlash:f,localeWeekStart:()=>dr(d),localeDowLabels:()=>or(d),formatDtDisplay:(g,C)=>La(d,g,C),timeFormatOpts:()=>lr(d),renderPortalDateTimeField:g=>De(d,g),getDtFieldCurrentValue:g=>na(d,g),setDtFieldValue:(g,C)=>sa(d,g,C),positionDtPopovers:()=>gt(d),renderFlashBanner:()=>yt(t),accessBadge:ea,formatImportResult:ft,loadHome:()=>Se(d),onImportContacts:g=>Js(l,g)},r={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>De(d,g)},i={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>De(d,g)},l={state:t,root:e,render:m,setFlash:c,clearFlash:f,renderPortalDateTimeField:g=>De(d,g),stopImportElapsedTimer:()=>ee(a),startImportElapsedTimer:()=>Ta(a),setImportPhase:(g,C)=>Te(a,g,C),applyServerImportProgress:g=>Aa(a,g),readFileTextWithProgress:(g,C)=>Fa(a,g,C),formatImportResult:ft,loadHome:()=>Se(d)},d={state:t,root:e,render:m,setFlash:c,clearFlash:f,filesHost:n,adminHost:s,calendarsHost:a,notesHost:r,tasksHost:i,contactsHost:l,clearPortalSessionState:k,userIsAdmin:()=>de(t),adminUiEnabled:()=>Fe(t),normalizeActiveTab:()=>bt(d),persistTab:pt,activateTab:(g,C)=>aa(d,g,C),activateAdminPage:(g,C)=>ir(d,g,C),loadHome:()=>Se(d),handleSessionExpired:w,loadFiles:()=>Z(n),loadShares:g=>Nt(a,g),loadMonthEvents:()=>st(a),loadContacts:g=>xt(l,g),loadTasks:()=>Xe(i),loadNotes:()=>Oa(r),loadAdminCapabilities:()=>ht(s),loadAdminDashboard:()=>Ye(s),loadAdminUsers:()=>oe(s),loadAdminUserDetail:g=>K(s,g),loadAdminUserResources:g=>ce(s,g),loadAdminSystemSettings:()=>Ge(s),loadAdminDatabaseSettings:()=>Qe(s),adminPageMeta:g=>ae(s,g),pickDefaultCalendar:()=>us(a),toggleCalendarSelected:g=>ps(a,g),blankEventForDay:(g,C)=>$s(a,g,C),defaultRepeat:()=>Mt(),itemKey:_,openContact:g=>zs(l,g),startNewContact:()=>Ks(l),emptyAddress:()=>Ma(),syncEditingEventFromForm:g=>ks(a,g),syncEditingTaskFromForm:g=>Rs(i,g),syncEditingNoteFromForm:g=>Os(r,g),runBulkTaskAction:g=>Bs(i,g),shell:(g,C)=>ot(t,g,C,{renderImportProgressModal:()=>qe(a),renderFilesUploadProgressModal:()=>_e(n)}),renderLogin:()=>zt(e,t,(g,C)=>ot(t,g,C,{renderImportProgressModal:()=>qe(a),renderFilesUploadProgressModal:()=>_e(n)})),renderFlashBanner:()=>yt(t),renderMonthGrid:()=>gs(a),renderEventModal:()=>vs(a),renderImportProgressModal:()=>qe(a),renderFilesUploadProgressModal:()=>_e(n),renderTasksTab:()=>qs(i),renderNotesTab:()=>Is(r),renderFilesTab:()=>Tn(n),renderAdminSection:()=>es(s),adminSubnavButtons:()=>On(s),renderPortalDateTimeField:g=>De(d,g),getDtFieldCurrentValue:g=>na(d,g),setDtFieldValue:(g,C)=>sa(d,g,C),positionDtPopovers:()=>gt(d),accessBadge:ea,formatImportResult:ft,closeImportProgress:()=>ws(a),closeFilesUploadProgress:()=>va(n),resetFilesTransferTree:y,stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,unbindUserMenuOutside:p,bindUserMenuOutside:()=>cn(t,m),unbindFilesUploadMenuOutside:$,bindFilesUploadMenuOutside:()=>wn(n),onLogin:g=>rn(g,v()),onShare:g=>Cs(a,g),onSaveEvent:g=>Es(a,g),onEditCal:g=>Ps(a,g),onCreateCal:g=>Ts(a,g),onSaveContact:g=>Ys(l,g),onCreateAb:g=>Gs(l,g),onEditAb:g=>Qs(l,g),onSaveTask:g=>Vs(i,g),onSaveNote:g=>Ns(r,g),bindColorPair:fr,bindImportInput:()=>hs(a),bindHolidaysToggle:()=>As(a),bindContactPhotoInput:()=>Ws(l),bindFilesDom:()=>wa(n),bindAdminDom:()=>Ca(s),saveBlobAsFile:pr,openInfoModal:g=>ur(d,g),closeInfoModal:()=>mr(d),captureScroll:()=>Kt(e),restoreScroll:g=>jt(e,g)},sn(v())}let ne="",T=null,F=!1,B=null,J=null,X="sqlite",Ze=!1;async function rt(e,t={}){const n={Accept:"application/json",...t.headers};t.body&&(n["Content-Type"]="application/json"),ne&&t.method&&t.method!=="GET"&&(n["X-CSRF-Token"]=ne);const s=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:n});let a;try{a=await s.json()}catch{throw new Error(`Request failed (${s.status})`)}if(!s.ok)throw new Error(a.error||`Request failed (${s.status})`);return a&&typeof a=="object"&&"data"in a&&a.data!==void 0?a.data:a}async function qt(){var e;T=await rt("/status"),ne=T.csrfToken||ne,((e=T.defaults)==null?void 0:e.backend)==="pgsql"?X="pgsql":X="sqlite"}function Ce(e,t,n){return`<label class="check-row"><input type="checkbox" name="${o(e)}" ${t?"checked":""} ${F?"disabled":""} /> ${o(n)}</label>`}function gr(){const e=T==null?void 0:T.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${o((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${o((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${W("error",(T==null?void 0:T.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${F?"disabled":""}>Retry</button>
  </section>`}function yr(){const e=T==null?void 0:T.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${F?"disabled":""}>
          ${ha((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ce("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ce("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${Ce("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ce("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ce("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${F?"disabled":""}>
          ${["Digest","Basic","Apache"].map(t=>`<option value="${t}" ${((e==null?void 0:e.dav_auth_type)||"Digest")===t?"selected":""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${o((e==null?void 0:e.invite_from)||"")}" ${F?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${o(String((e==null?void 0:e.session_max_age_minutes)??15))}" ${F?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${F?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${F?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${F?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function vr(){const e=T==null?void 0:T.defaults,t=(T==null?void 0:T.pdoDrivers)||[],n=t.includes("sqlite"),s=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${F?"disabled":""}>
          ${n?`<option value="sqlite" ${X==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${s?`<option value="pgsql" ${X==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${X==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${o((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${F?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${X==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${o((e==null?void 0:e.pgsql_host)||"")}" placeholder="localhost:5432" ${F?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${o((e==null?void 0:e.pgsql_dbname)||"")}" ${F?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${o((e==null?void 0:e.pgsql_username)||"")}" autocomplete="off" ${F?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${F?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${F?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${F?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${F?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function $r(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${o(String((T==null?void 0:T.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${o((T==null?void 0:T.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${Ze?"checked":""} ${F?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${F||!Ze?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function kr(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${o((T==null?void 0:T.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function wr(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${W("error",(T==null?void 0:T.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function V(){const e=document.getElementById("app");if(!e)return;const t=(T==null?void 0:T.step)||"permissions";let n="";T?t==="permissions"?n=gr():t==="initialize"?n=yr():t==="database"?n=vr():t==="upgrade"?n=$r():t==="done"?n=kr():t==="locked"?n=wr():n=`<section class="card"><p>Unknown step: ${o(t)}</p></section>`:n='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${o((T==null?void 0:T.productVersion)||"…")}</span>
            ${T!=null&&T.configuredVersion?` · configured <span class="mono">${o(String(T.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${T!=null&&T.step?`<span class="badge badge-admin">${o(T.step)}</span>`:""}
      </header>
      ${B?W("error",B,{dismissible:!1}):""}
      ${J?W("success",J,{dismissible:!1}):""}
      ${n}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,hr()}function hr(){var t,n,s,a,r,i;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{Sr()}),(n=e.querySelector('[data-action="backend-change"]'))==null||n.addEventListener("change",l=>{X=l.target.value==="pgsql"?"pgsql":"sqlite",V()}),(s=e.querySelector('[data-action="upgrade-toggle"]'))==null||s.addEventListener("change",l=>{Ze=!!l.target.checked,V()}),(a=e.querySelector('[data-action="upgrade-run"]'))==null||a.addEventListener("click",()=>{Er()}),(r=e.querySelector('[data-form="initialize"]'))==null||r.addEventListener("submit",l=>{l.preventDefault(),Dr(l.target)}),(i=e.querySelector('[data-form="database"]'))==null||i.addEventListener("submit",l=>{l.preventDefault(),Cr(l.target)}))}async function Sr(){F=!0,B=null,V();try{await qt(),J=null}catch(e){B=e instanceof Error?e.message:"Failed to load installer status"}finally{F=!1,V()}}async function Dr(e){const t=new FormData(e),n=a=>{var r;return!!((r=e.querySelector(`input[name="${a}"]`))!=null&&r.checked)},s={timezone:String(t.get("timezone")??"").trim(),cal_enabled:n("cal_enabled"),card_enabled:n("card_enabled"),tasks_enabled:n("tasks_enabled"),notes_enabled:n("notes_enabled"),files_enabled:n("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};F=!0,B=null,J=null,V();try{T=await rt("/initialize",{method:"POST",body:JSON.stringify(s)}),ne=T.csrfToken||ne,J="Server settings saved. Configure the database next.",h.event("install.initialize")}catch(a){B=a instanceof Error?a.message:"Initialize failed"}finally{F=!1,V()}}async function Cr(e){const t=new FormData(e),n=String(t.get("backend")??X),s={backend:n,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};n==="sqlite"?s.sqlite_file=String(t.get("sqlite_file")??"").trim():(s.pgsql_host=String(t.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(t.get("pgsql_username")??"").trim(),s.pgsql_password=String(t.get("pgsql_password")??"")),F=!0,B=null,J=null,V();try{T=await rt("/database",{method:"POST",body:JSON.stringify(s)}),ne=T.csrfToken||ne,J="Database configured. Installer is locked.",h.event("install.database"),T.completed||T.step}catch(a){B=a instanceof Error?a.message:"Database setup failed"}finally{F=!1,V()}}async function Er(){if(Ze){F=!0,B=null,J=null,V();try{const e=await rt("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});J="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),h.event("install.upgrade"),await qt()}catch(e){B=e instanceof Error?e.message:"Upgrade failed"}finally{F=!1,V()}}}async function Pr(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await qt()}catch(t){B=t instanceof Error?t.message:"Failed to load installer"}V()}const Dt=document.getElementById("app");if(!Dt)throw new Error("#app missing");const ra=window.location.pathname.replace(/\/+$/,"")||"/";ra==="/portal/install"||ra.endsWith("/portal/install")?Pr(Dt):br(Dt);
