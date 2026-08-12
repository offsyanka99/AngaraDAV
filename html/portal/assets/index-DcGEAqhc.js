var La=Object.defineProperty;var _a=(e,t,a)=>t in e?La(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var rt=(e,t,a)=>_a(e,typeof t!="symbol"?t+"":t,a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function a(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=a(s);fetch(s.href,r)}})();const qt={off:0,error:1,warn:2,info:3,debug:4};let Ee="off";const ze="[angaradav-portal]";function qa(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function Ra(e){return Ee=qa(e),Ee!=="off"&&console.info(ze,`log level = ${Ee}`),Ee}function aa(e){return qt[Ee]>=qt[e]}function Ne(e,t,a,n){if(!aa(e))return;const s=[ze,a];n!==void 0&&s.push(n),console[t](...s)}function Ba(e,t){aa("info")&&(t&&Object.keys(t).length>0?console.info(ze,`event:${e}`,t):console.info(ze,`event:${e}`))}const h={error(e,t){Ne("error","error",e,t)},warn(e,t){Ne("warn","warn",e,t)},info(e,t){Ne("info","info",e,t)},debug(e,t){Ne("debug","debug",e,t)},event:Ba};class M extends Error{constructor(a,n,s={}){super(a);rt(this,"status");rt(this,"payload");this.status=n,this.payload=s}}let ie="",qe=null,Re=null;function Be(e){ie=e&&typeof e=="string"?e:""}function Va(e){qe=e}function Ha(e){Re=e}function ht(e){if(!na(e))try{Re==null||Re()}catch{}}function na(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function je(e,t){if(!na(e)){Be("");try{qe==null||qe(t||"Session timed out. Please sign in again.")}catch{}}}async function C(e,t={}){const a=new Headers(t.headers);t.body&&!a.has("Content-Type")&&a.set("Content-Type","application/json");const n=(t.method||"GET").toUpperCase();n!=="GET"&&n!=="HEAD"&&n!=="OPTIONS"&&ie&&a.set("X-CSRF-Token",ie);const s=typeof performance<"u"?performance.now():Date.now();h.debug(`api → ${n} ${e}`);const r=await fetch(`/api${e}`,{...t,headers:a,credentials:"same-origin"});let i=null;const l=await r.text();if(l)try{i=JSON.parse(l)}catch{i={error:l}}const d=Math.round((typeof performance<"u"?performance.now():Date.now())-s);if(!r.ok){let u=`Request failed (${r.status})`,g={};if(i&&typeof i=="object"&&i!==null){const b=i;g={...b},typeof b.error=="string"&&(u=b.error)}else(r.status===500||r.status===504)&&(u="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw r.status>=500?h.error(`api ← ${n} ${e} ${r.status} (${d}ms)`,u):r.status!==401?h.warn(`api ← ${n} ${e} ${r.status} (${d}ms)`,u):(h.debug(`api ← ${n} ${e} 401 (${d}ms)`),je(e,u)),new M(u,r.status,g)}return h.info(`api ← ${n} ${e} ${r.status} (${d}ms)`),ht(e),i}function R(e){return encodeURIComponent(e)}async function Rt(e,t,a,n){const s=new Headers({"Content-Type":a,Accept:"application/x-ndjson, application/json;q=0.9"});ie&&s.set("X-CSRF-Token",ie);const r=typeof performance<"u"?performance.now():Date.now();h.debug(`api → POST ${e} (stream, ${a}, ${t.length} bytes)`);let i;try{i=await fetch(`/api${e}`,{method:"POST",headers:s,credentials:"same-origin",body:t})}catch(o){const m=o instanceof Error?o.message:"Network error";throw h.error(`api ← POST ${e} network fail`,m),new M(`Import request failed to start (${m}). Check connectivity and container logs.`,0)}const l=(i.headers.get("Content-Type")||"").toLowerCase(),d=l.includes("ndjson")||l.includes("x-ndjson");if(!i.ok&&!d){let o=`Request failed (${i.status})`;try{const m=await i.json();m.error&&(o=m.error)}catch{}throw(i.status===504||i.status===502)&&(o="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),i.status===401?(h.debug(`api ← POST ${e} 401`,o),je(e,o)):h.warn(`api ← POST ${e} ${i.status}`,o),new M(o,i.status)}if(!d&&i.ok){try{const o=await i.json();if(o&&typeof o.error=="string")throw new M(o.error,i.status||500);if(o&&typeof o.imported=="number"&&typeof o.updated=="number")return h.info(`api ← POST ${e} json done`),o}catch(o){if(o instanceof M)throw o}throw new M("Unexpected import response from server",500)}if(!i.body)throw new M("Import stream unavailable",500);const u=i.body.getReader(),g=new TextDecoder;let b="";const v={final:null,error:null,sawProgress:!1},S=o=>{let m;try{m=JSON.parse(o)}catch{h.debug("import stream non-JSON line",o.slice(0,80));return}if(m.type==="progress"){v.sawProgress=!0;const p=Number(m.total)||0,$=Number(m.current)||0,y=typeof m.percent=="number"?m.percent:p>0?Math.round(100*$/p):0;n==null||n({percent:y,current:$,total:p,imported:Number(m.imported)||0,updated:Number(m.updated)||0,skipped:Number(m.skipped)||0})}else m.type==="done"&&m.result?v.final=m.result:m.type==="error"&&(v.error={message:m.error||"Import failed",status:m.status||500})};for(;;){const{done:o,value:m}=await u.read();if(o)break;b+=g.decode(m,{stream:!0});const p=b.split(`
`);b=p.pop()??"";for(const $ of p){const y=$.trim();y&&S(y)}}b.trim()&&S(b.trim());const E=Math.round((typeof performance<"u"?performance.now():Date.now())-r);if(v.error)throw v.error.status===401?(h.debug(`api ← POST ${e} stream 401 (${E}ms)`,v.error.message),je(e,v.error.message)):h.warn(`api ← POST ${e} stream error (${E}ms)`,v.error.message),new M(v.error.message,v.error.status);if(!v.final)throw h.error(`api ← POST ${e} stream incomplete (${E}ms)`,{sawProgress:v.sawProgress}),new M(v.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return h.info(`api ← POST ${e} stream done (${E}ms)`),ht(e),v.final}const w={ui:()=>C("/ui"),installStatus:async()=>{const e=await C("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e},adminPing:()=>C("/admin/ping"),adminDashboard:()=>C("/admin/dashboard"),adminCapabilities:()=>C("/admin/capabilities"),adminUsers:()=>C("/admin/users"),adminUser:e=>C(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>C("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>C(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserCalendar:(e,t,a=!0)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a})}),adminUserAddressBooks:e=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserAddressBook:(e,t,a=!0,n=!1)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a,force:n})}),adminSystemSettings:()=>C("/admin/settings/system"),adminUpdateSystemSettings:e=>C("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>C("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>C("/admin/settings/database"),adminTestDatabaseConnection:e=>C("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>C("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await C("/me");return Be(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)),e},login:async(e,t)=>{var n;const a=await C("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return Be((n=a.user)==null?void 0:n.csrfToken),a},logout:async()=>{try{return await C("/logout",{method:"POST"})}finally{Be("")}},calendars:()=>C("/calendars"),createCalendar:e=>C("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>C("/holidays/countries"),updateCalendar:(e,t)=>C(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>C(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,a)=>{const n=new URLSearchParams({from:t,to:a}).toString();return C(`/calendars/${e}/events?${n}`)},getEvent:(e,t)=>C(`/calendars/${e}/events/${R(t)}`),createEvent:(e,t)=>C(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,a)=>C(`/calendars/${e}/events/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteEvent:(e,t)=>C(`/calendars/${e}/events/${R(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let i=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(i=l.error)}catch{}throw new M(i,t.status)}const a=t.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(a),s=(n==null?void 0:n[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:s}},importCalendar:(e,t,a)=>Rt(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",a),directory:()=>C("/directory"),shares:e=>C(`/calendars/${e}/shares`),share:(e,t,a)=>C(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:a})}),revoke:(e,t)=>C(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})}),addressbooks:()=>C("/addressbooks"),createAddressBook:e=>C("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>C(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>C(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let i=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(i=l.error)}catch{}throw new M(i,t.status)}const a=t.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(a),s=(n==null?void 0:n[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:s}},importAddressBook:(e,t,a)=>Rt(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",a),contacts:(e,t="")=>{const a=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return C(`/addressbooks/${e}/contacts${a}`)},getContact:(e,t)=>C(`/addressbooks/${e}/contacts/${R(t)}`),createContact:(e,t)=>C(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,a)=>C(`/addressbooks/${e}/contacts/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteContact:(e,t)=>C(`/addressbooks/${e}/contacts/${R(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const a=await fetch(`/api/addressbooks/${e}/contacts/${R(t)}/export`,{credentials:"same-origin"});if(!a.ok){let l=`Export failed (${a.status})`;try{const d=await a.json();d.error&&(l=d.error)}catch{}throw new M(l,a.status)}const n=a.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(n),r=(s==null?void 0:s[1])||"contact.vcf";return{blob:await a.blob(),filename:r}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${R(t)}/photo`,tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/tasks${a}`)},createTask:e=>C("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,a)=>C(`/tasks/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteTask:(e,t)=>C(`/tasks/${e}/${R(t)}`,{method:"DELETE"}),bulkTasks:e=>C("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/notes${a}`)},createNote:e=>C("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,a)=>C(`/notes/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteNote:(e,t)=>C(`/notes/${e}/${R(t)}`,{method:"DELETE"}),filesStatus:()=>C("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const a=t.toString()?`?${t}`:"";return C(`/files/entries${a}`)},filesMkdir:(e,t)=>C("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,a={})=>{const n=new URLSearchParams;e&&n.set("path",e),n.set("name",t.name),a.replace&&n.set("replace","1");const s=new FormData;s.append("file",t,t.name),e&&s.append("path",e);const r=typeof performance<"u"?performance.now():Date.now();return h.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((i,l)=>{const d=new XMLHttpRequest;d.open("POST",`/api/files/upload?${n}`),d.withCredentials=!0,ie&&d.setRequestHeader("X-CSRF-Token",ie),a.onProgress&&(d.upload.onprogress=u=>{var g,b;u.lengthComputable?(g=a.onProgress)==null||g.call(a,u.loaded,u.total):(b=a.onProgress)==null||b.call(a,u.loaded,t.size||u.loaded)}),d.onload=()=>{const u=Math.round((typeof performance<"u"?performance.now():Date.now())-r);let g=null;const b=d.responseText||"";if(b)try{g=JSON.parse(b)}catch{g={error:b}}const v=d.status;if(v<200||v>=300){let S=`Upload failed (${v||0})`;g&&typeof g=="object"&&g!==null&&"error"in g&&typeof g.error=="string"&&(S=g.error),v===401?(h.debug(`api ← POST /files/upload 401 (${u}ms)`,S),je("/files/upload",S)):v>=500?h.error(`api ← POST /files/upload ${v} (${u}ms)`,S):h.warn(`api ← POST /files/upload ${v} (${u}ms)`,S),l(new M(S,v||0));return}h.info(`api ← POST /files/upload 200 (${u}ms)`),ht("/files/upload"),i(g)},d.onerror=()=>{const u=Math.round((typeof performance<"u"?performance.now():Date.now())-r);h.error(`api ← POST /files/upload network error (${u}ms)`),l(new M("Upload failed (network error)",0))},d.onabort=()=>{l(new M("Upload cancelled",0))},d.send(s)})},filesDownloadUrl:e=>{const t=new URLSearchParams;return t.set("path",e),`/api/files/download?${t}`},filesDelete:e=>C("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>C("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,a)=>C("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:a})}),filesCopy:(e,t={})=>C("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>C("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},sa="angaradav-portal-tab",ra="angaradav-portal-admin-page",za="2.2.0",ja="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ka(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,escapeBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off"},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:za,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,checkedFilePaths:[],filesUploadConflict:null}}function c(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function W(e,t,a={}){if(!t)return"";const n=a.dismissible!==void 0?a.dismissible:a.dismissAction!==void 0,s=a.dismissAction??"flash-close",r=a.role??"status",i=a.className?` ${a.className}`:"",l=a.style?` style="${c(a.style)}"`:"",d=n?`<button type="button" class="flash-close" data-action="${c(s)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${c(e)}${i}" role="${c(r)}"${l}>
      <span class="flash-text">${c(t)}</span>
      ${d}
    </div>`}function Wa(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function Ja(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function St(e){return e.map(a=>{const n=a.type??"button",s=Ja(a.variant),r=a.disabled?" disabled":"",i=a.id?` id="${c(a.id)}"`:"",l=a.action?` data-action="${c(a.action)}"`:"",d=a.attrs?` ${a.attrs}`:"";return`<button type="${n}" class="${s}"${l}${i}${d}${r}>${c(a.label)}</button>`}).join(`
`)}function N(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=e.id?` id="${c(e.id)}"`:"",n=e.className?` ${e.className}`:"",s=e.rootAttrs?` ${e.rootAttrs}`:"",r=`${Wa(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,i=e.closeAction,l=e.lockBackdrop?"":` data-action="${c(i)}"`,d=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${c(i)}" aria-label="Close">×</button>`;let u="";e.footer!==void 0&&(u=typeof e.footer=="string"?e.footer:St(e.footer));const g=u?`<footer class="cal-modal-footer">${u}</footer>`:"",b=`<div class="cal-modal-body">${e.body}</div>`;let v;return e.form?v=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${b}
        ${g}
      </form>`:v=`${b}
      ${g}`,`<div class="cal-modal${n}"${a}${s} role="dialog" aria-modal="true" aria-labelledby="${c(t)}">
      <div class="cal-modal-backdrop"${l}></div>
      <div class="cal-modal-card${r}">
        <header class="cal-modal-header">
          <h3 id="${c(t)}">${c(e.title)}</h3>
          ${d}
        </header>
        ${v}
      </div>
    </div>`}function Xe(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",a=e.style==="checkbox"?' style="margin-top:1rem"':"",n=e.id?` id="${c(e.id)}"`:"",s=e.checked?" checked":"",r=e.disabled?" disabled":"";return`<label class="${t}"${a}>
            <input type="checkbox"${n} data-action="${c(e.action)}"${s}${r} />
            ${c(e.label)}
          </label>`}function ia(e,t,a){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:a})}function Ya(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function pt(e){return e.flash?W(e.flash.type,e.flash.message,{dismissible:!0}):""}function le(e){var t,a;return!!((t=e.user)!=null&&t.isAdmin||((a=e.user)==null?void 0:a.role)==="Admin")}function Ue(e){return le(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function ft(e,t){if(!t)return;const a=(t.timeFormat||"auto").toLowerCase(),n=(t.weekStart||"auto").toLowerCase();e.portalUi={timeFormat:a==="12h"||a==="24h"?a:"auto",weekStart:n==="monday"||n==="sunday"?n:"auto",logLevel:t.logLevel||"off"},Ra(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function Dt(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function bt(e,t){if(Dt(e),!e.user)return;const a=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},a)}function Ga(e,t){Dt(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function Qa(e,t){if(!e.handlingSessionExpiry){if(!e.user){Dt(e);return}e.handlingSessionExpiry=!0;try{h.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function Xa(e,t){const a=String(t.step||"");a==="upgrade"||a==="initialize"||a==="permissions"||a==="database"?(e.installGate={step:a,message:t.message||(a==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function Za(e,t){if(!(t instanceof M)||t.status!==503)return!1;const a=typeof t.payload.code=="string"?t.payload.code:"";if(a!=="upgrade_required"&&a!=="not_configured"&&a!=="admin_password_missing")return!1;const n=a==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:n,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function la(e){var a,n,s,r;const{state:t}=e;if(t.activeTab==="admin"&&le(t)&&Ue(t))try{t.adminPage==="overview"&&((a=e.adminPageMeta("overview"))==null?void 0:a.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((n=e.adminPageMeta("users"))==null?void 0:n.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((s=e.adminPageMeta("settings"))==null?void 0:s.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((r=e.adminPageMeta("database"))==null?void 0:r.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(i){h.warn("admin page load",i instanceof Error?i.message:i)}}async function en(e){var a;const{state:t}=e;h.event("bootstrap.start"),Va(n=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(n)?n:"Your session timed out. Please sign in again.")}),Ha(()=>{bt(t,n=>e.handleSessionExpired(n))});try{const n=await w.installStatus();Xa(t,n)}catch(n){h.debug("bootstrap: /api/install/status failed",n instanceof Error?n.message:n)}try{const n=await w.ui();ft(t,n.ui),typeof n.version=="string"&&n.version.trim()!==""?t.appVersion=n.version.trim():n.ui&&typeof n.ui.version=="string"&&n.ui.version.trim()!==""&&(t.appVersion=n.ui.version.trim())}catch(n){h.debug("bootstrap: /api/ui failed",n instanceof Error?n.message:n),Za(t,n)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),h.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const n=await w.me();if(t.user=n.user,ft(t,n.ui),typeof n.version=="string"&&n.version.trim()!==""&&(t.appVersion=n.version.trim()),h.event("bootstrap.session",{username:((a=t.user)==null?void 0:a.username)??null}),bt(t,s=>e.handleSessionExpired(s)),le(t))try{await e.loadAdminCapabilities()}catch(s){h.warn("admin.capabilities bootstrap",s instanceof Error?s.message:s)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await la(e)}catch(n){n instanceof M&&n.status===401?(e.clearPortalSessionState(),h.event("bootstrap.anonymous")):(h.error("bootstrap failed",n instanceof Error?n.message:n),ia(t,"error",n instanceof Error?n.message:"Failed to load"))}e.render()}async function tn(e,t){var i;const{state:a}=t,n=new FormData(e),s=String(n.get("username")??""),r=String(n.get("password")??"");a.busy=!0,t.clearFlash(),t.render(),h.event("login.attempt",{username:s});try{const l=await w.login(s,r);if(a.user=l.user,ft(a,l.ui),h.event("login.ok",{username:((i=a.user)==null?void 0:i.username)??s}),bt(a,d=>t.handleSessionExpired(d)),le(a))try{await t.loadAdminCapabilities()}catch(d){h.warn("admin.capabilities login",d instanceof Error?d.message:d)}t.normalizeActiveTab(),t.persistTab(a.activeTab,a.adminPage),await t.loadHome(),await la(t),t.setFlash("success","Signed in")}catch(l){h.warn("login.failed",l instanceof Error?l.message:l),t.setFlash("error",l instanceof Error?l.message:"Login failed")}finally{a.busy=!1,t.render()}}function Bt(e,t,a){const n=t.installGate,s=n&&(n.step==="upgrade"||n.step==="initialize"||n.step==="permissions"||n.step==="database"),r=(n==null?void 0:n.installUrl)||"/portal/install/";let i="";if(s&&n){const d=n.step==="upgrade"?"Server upgrade required":"Setup incomplete",u=n.step==="upgrade"&&(n.configuredVersion||n.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${c(String(n.configuredVersion||"—"))}</span>
              → product <span class="mono">${c(String(n.productVersion||"—"))}</span></p>`:"";i=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${c(d)}.</strong>
            ${c(n.message||"Complete the installer before signing in.")}
            ${u}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${c(r)}">Open installer</a>
        </p>`}const l=t.busy||!!s;e.innerHTML=a(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function Vt(e){const t=e.querySelector(".contacts-table-wrap"),a=e.querySelector(".contacts-ab-list"),n=e.querySelector(".calendars-owned-list"),s=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(a==null?void 0:a.scrollTop)??null,calListTop:(n==null?void 0:n.scrollTop)??null,filesTableTop:(s==null?void 0:s.scrollTop)??null}}function Ht(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const a=e.querySelector(".contacts-table-wrap");a&&(a.scrollTop=t.tableTop)}if(t.abListTop!==null){const a=e.querySelector(".contacts-ab-list");a&&(a.scrollTop=t.abListTop)}if(t.calListTop!==null){const a=e.querySelector(".calendars-owned-list");a&&(a.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const a=e.querySelector(".files-table-wrap");a&&(a.scrollTop=t.filesTableTop)}})})}const an={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Download (files), create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function x(e,t,a="h2"){const n=a;return`<div class="section-title-row">
    <${n}>${c(e)}</${n}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(t)}"
      aria-label="About ${c(e)}" title="About ${c(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function nn(){return`
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
    </div>`}function it(e,t,a={},n){const s=!!e.user&&e.activeTab==="admin"&&le(e)&&Ue(e),l=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${s?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${c(s?"Administration Portal":"User Portal")}</span></span>`,d=e.user?c(e.user.displayname||e.user.username):"",u=Ue(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",g=s?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",b=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${d}">
              <span class="user-menu-name">${d}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${e.userMenuOpen?"":"hidden"}>
              ${g}
              ${u}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",v=e.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${l}</a>
          <div class="topnav-right">
            ${b}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${l}</a>
        </nav>`,E=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesUploadConflict!==null||e.filesUploadProgress!==null)?pt(e):"",o=a.tabs&&a.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${a.tabs}
        </div>
      </div>`:"",m=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${c(e.appVersion)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(ja)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return a.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${v}
      ${o}
    </div>
      <main class="container">
        ${E}
        ${t}
      </main>
      ${m}
      ${nn()}
      ${n.renderImportProgressModal()}
      ${n.renderFilesUploadProgressModal()}`}function gt(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function sn(e,t){gt(e),e.userMenuDocClick=n=>{var r;const s=n.target;(r=s==null?void 0:s.closest)!=null&&r.call(s,".user-menu")||(e.userMenuOpen=!1,gt(e),t())};const a=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===a&&document.addEventListener("click",a,!0)},0)}async function X(e){e.state.filesLoading=!0;try{h.debug("loadFiles",{path:e.state.filesPath});const[t,a]=await Promise.all([w.filesStatus(),w.filesList(e.state.filesPath).catch(n=>{if(n instanceof M&&(n.status===503||n.status===404))return{path:e.state.filesPath,entries:[]};throw n})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=a.path,e.state.filesEntries=a.entries;const n=new Set(e.state.filesEntries.map(s=>s.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(s=>n.has(s))}else e.state.filesEntries=[],e.state.checkedFilePaths=[];h.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function da(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Ae(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function Ze(e,t,a){for(const n of a)if(n&&(t===n||t.startsWith(`${n}/`)))return!0;return!1}function z(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function Me(e,t,a){if(a.length===0)return;e.state.filesTransfer={op:t,paths:[...a]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const n=new Set([""]);if(e.state.filesPath){const s=e.state.filesPath.split("/").filter(Boolean);let r="";for(const i of s)r=r?`${r}/${i}`:i,n.add(r)}e.state.filesTreeExpanded=[...n],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),e.clearFlash(),e.render(),await Promise.all([...n].map(s=>yt(e,s)))}async function yt(e,t){const a=e.state.filesTreeChildren[t];if(!(a&&a!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const s=(await w.filesList(t)).entries.filter(r=>r.type==="dir").slice().sort((r,i)=>r.name.localeCompare(i.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:s}}catch(n){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},h.warn("files.tree",{path:t||"/",error:n instanceof Error?n.message:String(n)})}e.render()}}function rn(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,a=[],n=(s,r)=>{const i=e.state.filesTransferDest===s,l=Ze(e,s,t),d=e.state.filesTreeExpanded.includes(s),u=e.state.filesTreeChildren[s],g=Array.isArray(u),b=s===""||u==="loading"||u==="error"||!g||u.length>0,v=s===""?"Home":Ae(s),S=l?"Cannot use a selected item (or a folder inside it) as the destination":s===""?"File home host.root":s,E=d?"▾":"▸";if(a.push(`<div class="files-tree-row${i?" is-selected":""}${l?" is-blocked":""}" style="--depth:${r}" role="treeitem" aria-selected="${i}" aria-expanded="${d}" aria-disabled="${l}">
      ${b?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${c(s)}"
              aria-label="${d?"Collapse":"Expand"} ${c(v)}" ${e.state.busy?"disabled":""}>${E}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${i?" is-selected":""}" data-action="files-tree-select" data-path="${c(s)}"
        title="${c(S)}" ${e.state.busy||l?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${c(v)}</span>
      </button>
    </div>`),!!d){if(u==="loading"){a.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">Loading…</div>`);return}if(u==="error"){a.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${c(s)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(g){for(const o of u)n(o.path,r+1);u.length===0&&s===""&&a.push(`<div class="files-tree-status muted small" style="--depth:${r+1}">No subfolders yet — destination will be Home.</div>`)}}};return n("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${a.join("")}</div>`}async function ln(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const a=new FormData(t),n=(e.state.filesTransferDest||String(a.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),s=String(a.get("newName")??"").trim(),r=e.state.filesTransfer.op,i=[...e.state.filesTransfer.paths],l=i.length>1;if(Ze(e,n,i)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let d=0;const u=[];try{for(const b of i)try{if(r==="copy"){const v=Ae(b),S=l||!s||s===v?void 0:s,E=await w.filesCopy(b,{to:n,newName:S});h.event("files.copy",{path:b,to:E.entry.path})}else{const v=Ae(b),S=l||!s||s===v?void 0:s;await w.filesMove(b,n,S),h.event("files.move",{path:b,to:n})}d+=1}catch(v){u.push(`${Ae(b)}: ${v instanceof Error?v.message:"failed"}`)}z(e),e.state.checkedFilePaths=[],await X(e);const g=r==="copy"?"Copied":"Moved";d>0&&u.length===0?e.setFlash("success",d===1?`${g} 1 item`:`${g} ${d} items`):d>0?e.setFlash("info",`${g} ${d}; ${u.length} failed. ${u[0]}`):e.setFlash("error",u[0]||`${r==="copy"?"Copy":"Move"} failed`)}catch(g){e.setFlash("error",g instanceof Error?g.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function vt(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function oa(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function ca(e,t){return Array.from(e).map(n=>{const s=t&&n.webkitRelativePath?n.webkitRelativePath.replace(/\\/g,"/"):n.name;return{file:n,relativePath:s||n.name}})}function dn(e){return new Promise((t,a)=>{const n=[],s=()=>{e.readEntries(r=>{if(!r.length){t(n);return}n.push(...r),s()},r=>a(r))};s()})}function on(e){return new Promise((t,a)=>{e.file(t,a)})}async function ua(e,t){const a=vt(t,e.name);if(e.isFile)return[{file:await on(e),relativePath:a||e.name}];if(e.isDirectory){const n=e.createReader(),s=await dn(n);if(s.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const r=[];for(const i of s)r.push(...await ua(i,a));return r}return[]}async function*cn(e){const t=e;if(typeof t.values=="function"){for await(const a of t.values())yield a;return}if(typeof t.entries=="function")for await(const[,a]of t.entries())yield a}async function Ct(e,t){const a=vt(t,e.name),n=[];let s=0;for await(const r of cn(e))if(s+=1,r.kind==="file"){const i=await r.getFile();n.push({file:i,relativePath:vt(a,r.name)||i.name})}else r.kind==="directory"&&n.push(...await Ct(r,a));return s===0&&n.push({file:null,relativePath:a,isEmptyDir:!0}),n}async function un(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const a=[];for(const n of t){const s=await n.getFile();a.push({file:s,relativePath:s.name})}return{kind:"items",items:a}}catch(t){return oa(t)?{kind:"cancel"}:{kind:"fallback"}}}async function mn(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),a=await Ct(t,"");return a.length===0?{kind:"cancel"}:{kind:"items",items:a}}catch(t){return oa(t)?{kind:"cancel"}:{kind:"fallback"}}}async function pn(e){const t=e.items?Array.from(e.items):[],a=[];let n=!1,s=!1;for(const r of t){if(r.kind!=="file")continue;const i=r;if(typeof i.getAsFileSystemHandle=="function")try{const l=await i.getAsFileSystemHandle();if(l){if(n=!0,l.kind==="file"){const d=await l.getFile();a.push({file:d,relativePath:d.name})}else l.kind==="directory"&&a.push(...await Ct(l,""));continue}}catch{}if(typeof i.webkitGetAsEntry=="function"){const l=i.webkitGetAsEntry();if(l){s=!0,a.push(...await ua(l,""));continue}}}return(n||s)&&a.length>0?a:e.files&&e.files.length>0?ca(e.files,!1):a}function xe(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function ma(e,t=80){const a=String(e??"").replace(/\s+/g," ").trim();return a?a.length>t?`${a.slice(0,t-1)}…`:a:""}function ee(e,t,a){const n=ma(t);return n?`${e} “${n}” ${a}`:`${e} ${a}`}function lt(e){const t=ma(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(n=>String(n??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function pa(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Ke(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function H(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),n=t%60;return a>0?`${a}m ${n}s`:`${n}s`}function pe(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function fn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function Y(e,t,a,n,s,r=""){const i=a===t,l=i?n==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${i?" is-sorted":""}${r?" "+r:""}`}" data-action="sort-${s}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(e)}${l}</th>`}function K(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function bn(e){K(e),e.state.filesUploadMenuDocClick=a=>{var s;const n=a.target;(s=n==null?void 0:n.closest)!=null&&s.call(n,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,K(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function ve(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function gn(e){ve(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){ve(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},be(e,e.state.filesUploadProgress)},1e3)}function fa(e){ve(e),e.state.filesUploadProgress=null,e.render()}function ba(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function be(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const a=e.root.querySelector(".files-upload-progress-bar"),n=e.root.querySelector(".files-upload-progress-track"),s=e.root.querySelector("[data-files-upload-status]"),r=e.root.querySelector("[data-files-upload-current]"),i=ba(e,t),l=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${i!==null?` (${i}%)`:""} · ${H(t.elapsedSec)}`:(s==null?void 0:s.textContent)||"";s&&t.phase==="uploading"&&(s.textContent=l),r&&t.phase==="uploading"&&(r.textContent=t.currentName||"",r.title=t.currentName||""),a&&i!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${i}%`),n&&i!==null&&(n.setAttribute("aria-valuenow",String(i)),n.removeAttribute("aria-valuetext"))}function Le(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,a=t.phase==="uploading",n=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",s=ba(e,t),r=s===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",i=s!==null?` style="width:${s}%"`:"";let l="";if(a){const u=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${s!==null?` (${s}%)`:""} · ${H(t.elapsedSec)}`,g=t.bytesTotal>0?`${Ke(t.bytesSent)} / ${Ke(t.bytesTotal)}`:"";l=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${c(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${g?` · <span class="muted">${c(g)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${s!==null?`aria-valuenow="${s}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${r}"${i}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${c(u)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${c(t.currentName)}">${c(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")l=`
      ${W("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${c(H(t.elapsedSec))}</p>`;else{const u=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(g=>`<li>${c(g)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
      ${W("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${u}
      <p class="muted small" style="margin:0.75rem 0 0">After ${c(H(t.elapsedSec))}</p>`}const d=a?'<p class="muted small" style="margin:0">Please wait…</p>':St([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return N({title:n,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:a,lockBackdrop:a,body:l,footer:d})}async function zt(e,t,a,n){const s=a.replace(/\\/g,"/").split("/").map(i=>i.trim()).filter(Boolean);let r=t;for(const i of s){const l=da(r,i);if(n.has(l)){r=l;continue}try{await w.filesMkdir(r,i),h.event("files.mkdir",{path:r,name:i,via:"upload-folder"})}catch(d){if(!(d instanceof M&&d.status===409))throw d}n.add(l),r=l}}function yn(e,t){var n;const a=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(n=e.root.querySelector(a))==null||n.click()}async function jt(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,K(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,z(e),e.state.filesMkdirOpen=!1;const a=t==="files"?un:mn;try{const n=await a();if(n.kind==="cancel"){e.render();return}if(n.kind==="items"){if(n.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await Pt(e,n.items);return}e.render(),requestAnimationFrame(()=>{yn(e,t)})}catch(n){e.setFlash("error",n instanceof Error?n.message:"Could not open picker"),e.render()}}function Ve(e,t){return`${e}\0${t}`}function vn(e,t){return t.map(a=>{const n=a.file,s=(a.relativePath||n.name).replace(/\\/g,"/"),r=s.split("/").filter(Boolean),i=r.pop()||n.name,l=r.join("/"),d=da(e,l);return{item:a,file:n,fileName:i,parentPath:d,displayName:s||i,relDir:l}})}async function $n(e,t){if(t.length===0)return[];const a=new Map;for(const s of t){const r=a.get(s.parentPath)??[];r.push(s),a.set(s.parentPath,r)}const n=[];for(const[s,r]of a){let i=new Set;try{const d=await w.filesList(s);i=new Set(d.entries.filter(u=>u.type==="file"||u.type==="dir").map(u=>u.name))}catch{i=new Set}const l=new Set;for(const d of r)(i.has(d.fileName)||l.has(d.fileName))&&n.push(d),l.add(d.fileName)}return n.sort((s,r)=>s.displayName.localeCompare(r.displayName)),n}let Et=null;function dt(e){Et=null,e&&(e.state.filesUploadConflict=null)}function He(e,t){const a=Et;if(!a){e.state.filesUploadConflict=null,e.render();return}if(t==="cancel"){dt(e),e.setFlash("info","Upload cancelled"),e.render();return}let n=a.planned,s=new Set;if(t==="overwrite")s=new Set(a.conflicts.map(l=>Ve(l.parentPath,l.fileName)));else{const l=new Set(a.conflicts.map(d=>Ve(d.parentPath,d.fileName)));if(n=a.planned.filter(d=>!l.has(Ve(d.parentPath,d.fileName))),n.length===0&&a.emptyDirs.length===0){dt(e),e.setFlash("info","Upload cancelled — all selected files already exist"),e.render();return}}const r=a.destBase,i=a.emptyDirs;dt(e),ga(e,n,i,r,s)}async function Pt(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,K(e),e.state.filesUploadDropActive=!1;const a=t.filter(i=>i.file&&!i.isEmptyDir),n=t.filter(i=>i.isEmptyDir&&i.relativePath),s=e.state.filesPath,r=vn(s,a);if(r.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await $n(s,r);if(i.length>0){Et={planned:r,emptyDirs:n,destBase:s,conflicts:i},e.state.filesUploadConflict={names:i.map(l=>l.displayName),totalFiles:r.length,conflictCount:i.length},e.state.busy=!1,e.render();return}}catch(i){e.state.busy=!1,e.setFlash("error",i instanceof Error?i.message:"Could not check existing files"),e.render();return}}await ga(e,r,n,s,new Set)}async function ga(e,t,a,n,s){var S,E;const r=t.reduce((o,m)=>o+(m.file.size||0),0),i=Date.now(),l=t.length+a.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((S=t[0])==null?void 0:S.displayName)||((E=a[0])==null?void 0:E.relativePath)||"",bytesTotal:r,bytesSent:0,startedAt:i,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),gn(e),e.render();let d=0;const u=[],g=new Set;let b=0,v=0;try{for(const p of a){const $=p.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if($){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:$+"/",elapsedSec:Math.floor((Date.now()-i)/1e3)},be(e,e.state.filesUploadProgress));try{await zt(e,n,$,g)}catch(y){u.push(`${$}/: ${y instanceof Error?y.message:"failed"}`)}}}for(const p of t){const{file:$,fileName:y,parentPath:f,displayName:k,relDir:A}=p;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:k,bytesSent:b,elapsedSec:Math.floor((Date.now()-i)/1e3)},be(e,e.state.filesUploadProgress));try{A&&await zt(e,n,A,g);const F=s.has(Ve(f,y));await w.filesUpload(f,$,{replace:F,onProgress:(O,D)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const P=D>0?D:$.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:k,bytesSent:b+Math.min(O,P||O),elapsedSec:Math.floor((Date.now()-i)/1e3)},be(e,e.state.filesUploadProgress)}}),h.event("files.upload",{path:f,name:y,size:$.size,relativePath:k,replace:F}),d+=1,F&&(v+=1),b+=$.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:d,failedFiles:u.length,bytesSent:b},be(e,e.state.filesUploadProgress))}catch(F){const O=`${k}: ${F instanceof Error?F.message:"failed"}`;u.push(O),b+=$.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:d,failedFiles:u.length,bytesSent:b,errorSamples:u.slice(0,12)},be(e,e.state.filesUploadProgress))}}await X(e),ve(e);const o=Math.floor((Date.now()-i)/1e3),m=t.length;if(d>0&&u.length===0){let p=d===1?"Uploaded 1 file":`Uploaded ${d} files`;v>0&&(p+=v===1?" (1 overwritten)":` (${v} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(m,1),completedFiles:d,failedFiles:0,currentName:"",bytesTotal:r,bytesSent:r,startedAt:i,elapsedSec:o,resultMessage:p,errorSamples:[]},e.setFlash("success",p)}else if(d>0){const p=`Uploaded ${d}; ${u.length} failed. ${u[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(m,1),completedFiles:d,failedFiles:u.length,currentName:"",bytesTotal:r,bytesSent:r,startedAt:i,elapsedSec:o,resultMessage:p,errorSamples:u.slice(0,12)},e.setFlash("info",p)}else if(l>0&&u.length===0&&a.length>0){const p=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:i,elapsedSec:o,resultMessage:p,errorSamples:[]},e.setFlash("success",p)}else{const p=u[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(m,1),completedFiles:0,failedFiles:u.length,currentName:"",bytesTotal:r,bytesSent:0,startedAt:i,elapsedSec:o,resultMessage:p,errorSamples:u.slice(0,12)},e.setFlash("error",p)}}catch(o){ve(e);const m=o instanceof Error?o.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:d,failedFiles:Math.max(u.length,1),currentName:"",bytesTotal:r,bytesSent:b,startedAt:i,elapsedSec:Math.floor((Date.now()-i)/1e3),resultMessage:m,errorSamples:u.length?u.slice(0,12):[m]},e.setFlash("error",m)}finally{e.state.busy=!1,e.render()}}function Kt(e,t,a){const n=t.files;if(!n||n.length===0)return;const s=ca(n,a);t.value="",Pt(e,s)}function wn(e,t){const a=t?t.split("/").filter(Boolean):[];let n="";const s=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const r of a){n=n?`${n}/${r}`:r;const i=n;s.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),s.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${c(i)}" ${e.state.busy?"disabled":""}>${c(r)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${s.join("")}</nav>`}function kn(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
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
        <p class="flash flash-error" style="margin-top:0.75rem">${c(t.error||"File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${c(t.davPath)}</span></p>
      </section>
    </div>`;const a=t.quotaBytes>0?`${pe(t.usedBytes)} used · ${pe(t.availableBytes)} free of ${pe(t.quotaBytes)}`:`${pe(t.usedBytes)} used · ${pe(t.availableBytes)} free (no app quota)`,n=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,s=e.state.checkedFilePaths.length,r=e.state.filesEntries.length>0&&e.state.filesEntries.every(y=>e.state.checkedFilePaths.includes(y.path)),i=s>0,l=e.state.filesEntries.filter(y=>y.type==="dir").length,d=e.state.filesEntries.length-l,u=s>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
          <span class="muted small">${s} selected</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>
        </div>`:"",g=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const y=[];l>0&&y.push(`${l} folder${l===1?"":"s"}`),d>0&&y.push(`${d} file${d===1?"":"s"}`);const f=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return y.length===2?`${f} · ${y.join(", ")}`:y[0]??f})(),b=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':e.state.filesEntries.map(y=>{const f=e.state.checkedFilePaths.includes(y.path),k=y.type==="dir"?"📁":"📄",A=y.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${c(y.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${k}</span>${c(y.name)}
                  </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${k}</span>${c(y.name)}</span>`,F=y.type==="dir"?"—":pe(y.size);return`<tr class="files-row${f?" is-checked":""}" data-path="${c(y.path)}" data-type="${y.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${c(y.path)}"
                  ${f?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${c(y.name)}" />
              </td>
              <td class="files-col-name">${A}</td>
              <td class="files-col-size mono">${F}</td>
              <td class="files-col-mtime hide-sm">${c(fn(y.mtime))}</td>
              <td class="files-col-actions">
                ${y.type==="file"?`<a class="btn btn-ghost btn-small" href="${c(w.filesDownloadUrl(y.path))}" download="${c(y.name)}" data-action="files-download">Download</a>`:""}
                <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${c(y.path)}" ${e.state.busy?"disabled":""}>Copy</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${c(y.path)}" ${e.state.busy?"disabled":""}>Move</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${c(y.path)}" data-name="${c(y.name)}" ${e.state.busy?"disabled":""}>Rename</button>
                <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${c(y.path)}" data-name="${c(y.name)}" ${e.state.busy?"disabled":""}>Delete</button>
              </td>
            </tr>`}).join(""),v=e.state.filesRenamePath!==null?(()=>{const y=e.state.filesEntries.find(k=>k.path===e.state.filesRenamePath),f=(y==null?void 0:y.name)??"";return N({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${c(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${c(f)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",S=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const y=e.state.filesDeletePaths,f=y.length>1,k=e.state.filesEntries.find(O=>O.path===y[0]),A=f?`Delete ${y.length} items`:`Delete ${(k==null?void 0:k.type)==="dir"?"folder":"file"}`,F=f?`<p style="margin:0 0 0.75rem">Delete <strong>${y.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${y.slice(0,12).map(O=>{const D=e.state.filesEntries.find(P=>P.path===O);return`<li><span class="mono">${c((D==null?void 0:D.name)??O)}</span></li>`}).join("")}
                 ${y.length>12?`<li>…and ${y.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${c((k==null?void 0:k.name)??y[0])}</strong>?${(k==null?void 0:k.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return N({id:"files-delete-modal",title:A,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:F,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",E=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const y=e.state.filesTransfer.op,f=e.state.filesTransfer.paths,k=f.length>1,A=e.state.filesEntries.find(U=>U.path===f[0]),F=(A==null?void 0:A.name)??Ae(f[0]),O=k?`${y==="copy"?"Copy":"Move"} ${f.length} items`:`${y==="copy"?"Copy":"Move"} ${(A==null?void 0:A.type)==="dir"?"folder":"file"}`,D=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,P=Ze(e,e.state.filesTransferDest,f);return N({id:"files-transfer-modal",title:O,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${k?`<p class="muted small" style="margin:0 0 0.75rem">${f.length} items will be ${y==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${c(F)}</span></p>`}
                  <input type="hidden" name="toPath" value="${c(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${c(D)}">${c(D)}</span>
                    </div>
                    ${rn(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${k?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${c(F)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${y==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:y==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||P}]})})():"",o=e.state.filesMkdirOpen?N({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${c(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",m=e.state.filesUploadConflict?(()=>{const y=e.state.filesUploadConflict,f=y.conflictCount,k=f===1?"1 file already exists in the destination.":`${f} of ${y.totalFiles} files already exist in the destination.`,A=y.names.slice(0,12).map(O=>`<li><span class="mono">${c(O)}</span></li>`).join(""),F=y.names.length>12?`<li class="muted">…and ${y.names.length-12} more</li>`:"";return N({id:"files-upload-conflict-modal",title:f===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${c(k)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${A}
                ${F}
              </ul>
              <p class="muted small" style="margin:0">
                Choose whether to replace the existing files, skip them, or cancel the upload.
              </p>`,footer:[{label:"Cancel",action:"files-upload-conflict-cancel",variant:"ghost"},{label:"Skip existing",action:"files-upload-conflict-skip",variant:"ghost"},{label:f===1?"Overwrite":"Overwrite all",action:"files-upload-conflict-overwrite",variant:"primary"}]})})():"",p=e.state.filesPath===""?"Home":e.state.filesPath,$=`<div class="files-upload-menu${e.state.filesUploadMenuOpen?" is-open":""}">
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
          <p class="muted small mono">${c(p)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${x("Files","files","h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${n}%"></div>
          </div>
          <span>${c(a)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${wn(e,e.state.filesPath)}
        <div class="files-toolbar-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${e.state.busy||e.state.filesLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${e.state.busy?"disabled":""}>New folder</button>
          ${$}
        </div>
      </div>
      ${u}
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
            ${e.state.filesLoading&&e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':b}
          </tbody>
        </table>
      </div>
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${s>0?`${s} of ${e.state.filesEntries.length} selected`:c(g)}
      </div>
    </section>
    ${v}
    ${S}
    ${E}
    ${o}
    ${m}
  </div>`}async function hn(e,t){const a=new FormData(t),n=String(a.get("path")??""),s=String(a.get("newName")??"").trim();if(!n||!s){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await w.filesRename(n,s),h.event("files.rename",{path:n,newName:s}),e.state.filesRenamePath=null,await X(e),e.setFlash("success",`Renamed to “${s}”`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function Sn(e,t){const a=new FormData(t),n=String(a.get("name")??"").trim();if(!n){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await w.filesMkdir(e.state.filesPath,n),h.event("files.mkdir",{path:e.state.filesPath,name:n}),e.state.filesMkdirOpen=!1,await X(e),e.setFlash("success",`Created folder “${n}”`)}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function Dn(e,t,a,n){const{state:s}=e;if(t==="files-upload-menu-toggle")return s.busy||s.filesUploadProgress||(s.filesUploadMenuOpen=!s.filesUploadMenuOpen,s.filesUploadMenuOpen&&(s.filesRenamePath=null,s.filesDeletePaths=null,z(e),s.filesMkdirOpen=!1),e.render()),!0;if(t==="files-upload-files")return jt(e,"files"),!0;if(t==="files-upload-folder")return jt(e,"folder"),!0;if(t==="files-nav"){const r=a.dataset.path??"";s.filesPath=r,s.filesRenamePath=null,s.filesDeletePaths=null,s.filesTransfer=null,s.filesMkdirOpen=!1,s.checkedFilePaths=[],s.busy=!0,e.clearFlash(),e.render();try{await X(e)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Failed to open folder")}finally{s.busy=!1,e.render()}return!0}if(t==="files-toggle"){n.stopPropagation();const r=a.dataset.path??"";return r&&(a.checked?s.checkedFilePaths.includes(r)||(s.checkedFilePaths=[...s.checkedFilePaths,r]):s.checkedFilePaths=s.checkedFilePaths.filter(l=>l!==r),e.render()),!0}if(t==="files-select-all"){n.stopPropagation();const r=a.checked;return s.checkedFilePaths=r?s.filesEntries.map(i=>i.path):[],e.render(),!0}if(t==="files-copy"){const r=a.dataset.path??"";return r&&Me(e,"copy",[r]),!0}if(t==="files-move"){const r=a.dataset.path??"";return r&&Me(e,"move",[r]),!0}if(t==="files-bulk-copy")return s.checkedFilePaths.length===0||Me(e,"copy",[...s.checkedFilePaths]),!0;if(t==="files-bulk-move")return s.checkedFilePaths.length===0||Me(e,"move",[...s.checkedFilePaths]),!0;if(t==="files-tree-select"){if(n.preventDefault(),n.stopPropagation(),!s.filesTransfer)return!0;const r=a.dataset.path??"";return Ze(e,r,s.filesTransfer.paths)||(s.filesTransferDest=r,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(n.preventDefault(),n.stopPropagation(),!s.filesTransfer)return!0;const r=a.dataset.path??"";if(t==="files-tree-retry"){const l={...s.filesTreeChildren};return delete l[r],s.filesTreeChildren=l,s.filesTreeExpanded.includes(r)||(s.filesTreeExpanded=[...s.filesTreeExpanded,r]),yt(e,r),!0}return s.filesTreeExpanded.includes(r)?(s.filesTreeExpanded=s.filesTreeExpanded.filter(l=>l!==r),e.render()):(s.filesTreeExpanded=[...s.filesTreeExpanded,r],yt(e,r)),!0}if(t==="files-transfer-close")return z(e),e.render(),!0;if(t==="files-bulk-delete")return s.checkedFilePaths.length===0||(s.filesDeletePaths=[...s.checkedFilePaths],s.filesRenamePath=null,z(e),e.render()),!0;if(t==="files-refresh"){s.busy=!0,e.clearFlash(),e.render();try{await X(e),e.setFlash("success","Refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{s.busy=!1,e.render()}return!0}if(t==="files-mkdir")return s.filesMkdirOpen=!0,s.filesUploadMenuOpen=!1,K(e),s.filesUploadDropActive=!1,s.filesRenamePath=null,s.filesDeletePaths=null,z(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return s.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open")return s.filesRenamePath=a.dataset.path??null,s.filesDeletePaths=null,z(e),s.filesUploadMenuOpen=!1,K(e),e.render(),!0;if(t==="files-rename-close")return s.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const r=a.dataset.path??"";return s.filesDeletePaths=r?[r]:null,s.filesRenamePath=null,z(e),s.filesUploadMenuOpen=!1,K(e),e.render(),!0}if(t==="files-delete-close")return s.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const r=s.filesDeletePaths?[...s.filesDeletePaths]:[];if(r.length===0)return!0;s.busy=!0,e.clearFlash(),e.render();try{if(r.length===1)await w.filesDelete(r[0]),h.event("files.delete",{path:r[0]}),e.setFlash("success","Deleted");else{const i=await w.filesBulk("delete",r);h.event("files.bulk-delete",{ok:i.ok,failed:i.failed}),i.failed===0?e.setFlash("success",i.ok===1?"Deleted 1 item":`Deleted ${i.ok} items`):i.ok>0?e.setFlash("info",`Deleted ${i.ok}; ${i.failed} failed. ${i.errors[0]||""}`):e.setFlash("error",i.errors[0]||"Delete failed")}s.filesDeletePaths=null,s.checkedFilePaths=[],await X(e)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Delete failed")}finally{s.busy=!1,e.render()}return!0}return t==="files-download"?(h.event("files.download",{path:a.getAttribute("href")??""}),!0):t==="close-files-upload-progress"?(s.filesUploadProgress&&(s.filesUploadProgress.phase==="done"||s.filesUploadProgress.phase==="error")&&fa(e),!0):t==="files-upload-conflict-cancel"?(He(e,"cancel"),!0):t==="files-upload-conflict-skip"?(He(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(He(e,"overwrite"),!0):!1}function ya(e){const{root:t,state:a}=e,n=t.querySelector('[data-form="files-rename"]');n==null||n.addEventListener("submit",l=>{l.preventDefault(),hn(e,n)});const s=t.querySelector('[data-form="files-transfer"]');s==null||s.addEventListener("submit",l=>{l.preventDefault(),ln(e,s)});const r=t.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",l=>{l.preventDefault(),Sn(e,r)}),t.querySelectorAll('input[type="file"][data-action="files-upload-pick-files"]').forEach(l=>{l.addEventListener("change",()=>{Kt(e,l,!1)})}),t.querySelectorAll('input[type="file"][data-action="files-upload-pick-folder"]').forEach(l=>{l.addEventListener("change",()=>{Kt(e,l,!0)})});const i=t.querySelector("[data-files-drop-target]");if(i&&a.activeTab==="files"&&!a.busy&&!a.filesUploadProgress){let l=0;const d=u=>{a.filesUploadDropActive!==u&&(a.filesUploadDropActive=u,i.classList.toggle("is-dragover",u))};i.addEventListener("dragenter",u=>{xe(u.dataTransfer)&&(u.preventDefault(),u.stopPropagation(),l+=1,d(!0))}),i.addEventListener("dragover",u=>{xe(u.dataTransfer)&&(u.preventDefault(),u.stopPropagation(),u.dataTransfer&&(u.dataTransfer.dropEffect="copy"),d(!0))}),i.addEventListener("dragleave",u=>{xe(u.dataTransfer)&&(u.preventDefault(),u.stopPropagation(),l=Math.max(0,l-1),l===0&&d(!1))}),i.addEventListener("drop",u=>{if(!xe(u.dataTransfer))return;u.preventDefault(),u.stopPropagation(),l=0,d(!1);const g=u.dataTransfer;!g||a.busy||a.filesUploadProgress||(a.filesUploadMenuOpen=!1,K(e),(async()=>{try{const b=await pn(g);if(b.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await Pt(e,b)}catch(b){e.setFlash("error",b instanceof Error?b.message:"Drop failed"),e.render()}})())})}t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(l=>{l.indeterminate=!0})}function Cn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function te(e,t){var n;const a=(n=e.state.adminCapabilities)==null?void 0:n.pages;return a?a.find(s=>s.id===t)??null:null}function we(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Ie(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function En(e){var r;const t=["overview","settings","users","database"],a={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},n=(r=e.state.adminCapabilities)==null?void 0:r.pages,s=new Map;if(n)for(const i of n)Cn(i.id)&&s.set(i.id,i);return t.map(i=>{const l=s.get(i),d=(l==null?void 0:l.label)||a[i],u=(l==null?void 0:l.status)??(i==="overview"?"read-only":"full"),g=(l==null?void 0:l.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===i?" is-active":""}${g?" is-gated":""}"
          data-action="admin-page" data-admin-page="${i}"
          aria-selected="${e.state.adminPage===i}"
          title="${c(d)}${g?" — "+we(e,u):""}">
          ${c(d)}
        </button>`}).join("")}function et(e,t){const a=te(e,t),n=(a==null?void 0:a.status)??"coming-soon",s=(a==null?void 0:a.label)??t,r=(a==null?void 0:a.summary)||"This area is not available in portal Administration yet.",i=we(e,n);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Ie(e,n)}">${c(i)}</span>
      <h2 class="admin-coming-soon-title">${c(s)}</h2>
    </div>
    <p class="muted">${c(r)}</p>
  </section>`}function ke(e,t,a,n){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${c(String(a))}</div>
    <div class="admin-stat-label">${c(t)}</div>
    ${n?`<div class="admin-stat-hint muted small">${c(n)}</div>`:""}
  </div>`}function se(e,t,a){return`<span class="badge ${t?"badge-ok":"badge-off"}">${c(a)}: ${t?"On":"Off"}</span>`}function re(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function $t(e){var t;e.state.adminCapabilitiesError=null;try{const a=await w.adminCapabilities();e.state.adminCapabilities=a.data,h.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(a){e.state.adminCapabilitiesError=a instanceof Error?a.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},h.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function We(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await w.adminDashboard();e.state.adminDashboard=t.data,h.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function de(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await w.adminUsers();e.state.adminUsers=t.users??[],h.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function j(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const a=await w.adminUser(t);e.state.adminUserDetail=a.user,e.state.adminSelectedUsername=a.user.username,h.debug("admin.user",{username:a.user.username})}catch(a){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=a instanceof Error?a.message:"Failed to load user",a}finally{e.state.adminUserDetailLoading=!1}}async function oe(e,t){e.state.adminUserResourcesLoading=!0;try{const[a,n]=await Promise.all([w.adminUserCalendars(t),w.adminUserAddressBooks(t)]);e.state.adminUserCalendars=a.calendars??[],e.state.adminUserAddressBooks=n.addressbooks??[]}catch(a){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],a}finally{e.state.adminUserResourcesLoading=!1}}async function Je(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await w.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function Ye(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await w.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const a=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=a==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function Pn(e){var r;const t=te(e,"overview");if(t&&t.available===!1)return et(e,"overview");const a=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${c(((r=e.state.user)==null?void 0:r.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let n="",s="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)s='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)s=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${c(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const i=e.state.adminDashboard,l=i.services,d=i.links??{},u=t?`<span class="badge ${Ie(e,t.status)}">${c(we(e,t.status))}</span>`:"",g=i.version?c(i.version):"—",b=i.git?c(i.git):"";n=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${x("About this system","admin-overview")}
          <div class="section-actions">
            ${u}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy||e.state.adminDashboardLoading?"disabled":""}>Refresh</button>
          </div>
        </div>
        <div class="admin-about-grid">
          <div>
            <h3 class="admin-subsection-title">Version</h3>
            <p>
              AngaraDAV <span class="badge badge-admin">v${g}</span>
              ${b?`<span class="mono muted small"> (${b})</span>`:""}
            </p>
            <p class="muted small admin-link-row">
              ${d.releases?`<a href="${c(d.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
              ${d.docs?`${d.releases?'<span class="footer-sep">·</span>':""}<a href="${c(d.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${re(e,l.administration!==!1&&l.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${re(e,!!l.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${re(e,!!l.carddav)}</td></tr>
                  <tr><td>Files</td><td>${re(e,!!l.files)}</td></tr>
                  <tr><td>Tasks</td><td>${re(e,!!l.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${re(e,!!l.notes)}</td></tr>
                  <tr><td>Push</td><td>${re(e,!!l.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${a}
      </section>`;const v=i.nbusers??i.users,S=i.nbcalendars??i.calendars,E=i.nbevents??i.events,o=i.nbbooks??i.addressBooks,m=i.nbcontacts??i.contacts;s=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${ke(e,"Registered users",v,"Users")}
          ${ke(e,"Calendars",S,"CalDAV")}
          ${ke(e,"Events",E,"CalDAV")}
          ${ke(e,"Address books",o,"CardDAV")}
          ${ke(e,"Contacts",m,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${se(e,l.administration!==!1&&l.webAdmin!==!1,"Administration")}
          ${se(e,!!l.caldav,"CalDAV")}
          ${se(e,!!l.carddav,"CardDAV")}
          ${se(e,!!l.files,"Files")}
          ${se(e,!!l.tasks,"Tasks")}
          ${se(e,!!l.notes,"Notes")}
          ${se(e,!!l.push,"Push")}
        </div>
      </section>`}else s=`<section class="card">
      ${x("System snapshot","admin-overview")}
      ${a}
    </section>`;return`${n}
    ${s}`}function Tn(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(a=>a.username.toLowerCase().includes(t)||(a.displayname||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)):e.state.adminUsers}function An(e){return e.state.adminUserCreateOpen?N({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function Un(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return N({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
        <p class="muted small">Username <span class="mono">${c(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${c(t.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${c(t.displayname)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${c(t.email)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function Fn(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,a=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(s=>s.username.toLowerCase()===t.toLowerCase())??null,n=a?`${a.displayname||a.username} (${a.username})`:t;return N({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${c(n)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${Xe({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${c(t)}"`}]})}function In(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${c(e.state.adminSelectedUsername)}</span>…</p>
    </section>`;if(e.state.adminUserDetailError&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${c(e.state.adminUserDetailError)}</p>
    </section>`;if(!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail,a=e.state.adminUserResourcesLoading&&e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':e.state.adminUserCalendars.map(u=>`<tr>
        <td class="mono">${c(u.uri)}</td>
        <td>${c(u.displayname)}</td>
        <td class="hide-sm">${c(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
        <td class="hide-sm mono small">${c(u.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${c(u.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),n=e.state.adminUserResourcesLoading&&e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':e.state.adminUserAddressBooks.map(u=>`<tr>
        <td class="mono">${c(u.uri)}</td>
        <td>${c(u.displayname)}</td>
        <td class="hide-sm">${c(String(u.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${c(u.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),s=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(u=>u.instanceId===e.state.adminCalEditId)??null:null,r=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(u=>u.id===e.state.adminAbEditId)??null:null,i=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&s?N({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
          <input type="hidden" name="instanceId" value="${s?s.instanceId:""}" />
          ${e.state.adminCalModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${e.state.busy?"disabled":""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${c(s.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${c((s==null?void 0:s.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${c((s==null?void 0:s.description)??"")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${c((s==null?void 0:s.calendarcolor)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${s!=null&&s.todos||e.state.adminCalModal==="create"?"checked":""} ${e.state.busy?"disabled":""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${s!=null&&s.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",l=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&r?N({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${r?r.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${c(r.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${c((r==null?void 0:r.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${c((r==null?void 0:r.description)??"")}</textarea>
          </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",d=e.state.adminResourceDelete?N({title:`Delete ${e.state.adminResourceDelete.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
        <p>Delete <strong>${c(e.state.adminResourceDelete.label)}</strong> for <span class="mono">${c(t.username)}</span>?</p>
        ${e.state.adminResourceDelete.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${e.state.adminResourceDelete.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:e.state.busy}]}):"";return`<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${c(t.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${c(t.username)}" ${e.state.busy?"disabled":""}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${c(t.username)}" ${e.state.busy?"disabled":""}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${c(t.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${c(t.username)}</dd></div>
      <div><dt>Display name</dt><dd>${c(t.displayname||"—")}</dd></div>
      <div><dt>Email</dt><dd>${t.email?`<a href="mailto:${c(t.email)}">${c(t.email)}</a>`:"—"}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${c(t.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${c(String(t.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${c(String(t.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${c(String(t.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${c(String(t.contactCount))}</dd></div>
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
  ${i}${l}${d}`}function On(e){const t=te(e,"users");if(t&&t.available===!1)return et(e,"users");const a=Tn(e),n=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':a.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?c(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:a.map(s=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===s.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${c(s.username)}" tabindex="0" role="button">
                <td class="mono">${c(s.username)}</td>
                <td class="hide-sm">${c(s.displayname||"—")}</td>
                <td class="hide-sm">${c(s.email||"—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${c(s.username)}" ${e.state.busy?"disabled":""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${c(s.username)}" ${e.state.busy?"disabled":""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${c(s.username)}" ${e.state.busy?"disabled":""}>Delete</button>
                </td>
              </tr>`).join("");return`
    <section class="card">
      <div class="section-header">
        ${x("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ie(e,t.status)}">${c(we(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${e.state.busy||e.state.adminUsersLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${e.state.busy?"disabled":""}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${c(e.state.adminUsersQuery)}" aria-label="Filter users" ${e.state.busy?"disabled":""} />
        <span class="muted small">${c(String(a.length))}${e.state.adminUsersQuery.trim()?` / ${e.state.adminUsers.length}`:""} user${a.length===1?"":"s"}</span>
      </div>
      ${e.state.adminUsersError&&e.state.adminUsers.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${c(e.state.adminUsersError)}</p>`:""}
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
    ${In(e)}
    ${An(e)}
    ${Un(e)}
    ${Fn(e)}`}async function Nn(e,t){const a=new FormData(t),n=String(a.get("username")??"").trim(),s=String(a.get("displayname")??"").trim(),r=String(a.get("email")??"").trim(),i=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!n||!s||!r||!i){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(i!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const d=await w.adminCreateUser({username:n,displayname:s,email:r,password:i,passwordConfirm:l});h.event("admin.user.create",{username:d.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=d.user.username,e.state.adminUserDetail=d.user,e.persistTab("admin","users",d.user.username),await de(e),e.setFlash("success",`Created user “${d.user.username}”`)}catch(d){e.setFlash("error",d instanceof Error?d.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function Mn(e,t){const a=new FormData(t),n=String(a.get("username")??"").trim(),s=String(a.get("displayname")??"").trim(),r=String(a.get("email")??"").trim(),i=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!n){e.setFlash("error","Username is required"),e.render();return}if(!s||!r){e.setFlash("error","Display name and email are required"),e.render();return}if(i!==""||l!==""){if(i===""||l===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(i!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const d={displayname:s,email:r};i!==""&&(d.password=i,d.passwordConfirm=l);const u=await w.adminUpdateUser(n,d);h.event("admin.user.update",{username:u.user.username,passwordChanged:i!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=u.user,e.state.adminSelectedUsername=u.user.username,await de(e),e.setFlash("success",i!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(d){e.setFlash("error",d instanceof Error?d.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function xn(e,t){var u,g;if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,n=new FormData(t),s=String(n.get("displayname")??"").trim(),r=String(n.get("description")??"").trim(),i=String(n.get("calendarcolor")??"").trim(),l=((u=t.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,d=((g=t.querySelector('input[name="notes"]'))==null?void 0:g.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const b=String(n.get("uri")??"").trim().toLowerCase();await w.adminCreateUserCalendar(a,{uri:b,displayname:s,description:r,calendarcolor:i||void 0,todos:l,notes:d}),e.setFlash("success",`Created calendar “${s}”`)}else{const b=Number(n.get("instanceId"));await w.adminUpdateUserCalendar(a,b,{displayname:s,description:r,calendarcolor:i,todos:l,notes:d}),e.setFlash("success",`Updated calendar “${s}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await oe(e,a),await j(e,a)}catch(b){e.setFlash("error",b instanceof Error?b.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ln(e,t){if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,n=new FormData(t),s=String(n.get("displayname")??"").trim(),r=String(n.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const i=String(n.get("uri")??"").trim().toLowerCase();await w.adminCreateUserAddressBook(a,{uri:i,displayname:s,description:r}),e.setFlash("success",`Created address book “${s}”`)}else{const i=Number(n.get("id"));await w.adminUpdateUserAddressBook(a,i,{displayname:s,description:r}),e.setFlash("success",`Updated address book “${s}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await oe(e,a),await j(e,a)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const _n=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let fe=null;function qn(){if(fe)return fe;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return fe=[...t].sort((a,n)=>a.localeCompare(n)),fe}}catch{}return fe=[..._n],fe}function va(e){const t=e||"UTC",a=qn(),n=a.includes(t),s=a.map(r=>`<option value="${Wt(r)}" ${r===t?"selected":""}>${Jt(r)}</option>`);return!n&&t&&s.unshift(`<option value="${Wt(t)}" selected>${Jt(t)}</option>`),s.join("")}function Wt(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function Jt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Rn(e){const t=te(e,"settings");if(t&&t.available===!1)return et(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${c(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const a=e.state.adminSystemSettings;if(!a)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const n=(r,i,l)=>`<label class="check-row"><input type="checkbox" name="${c(r)}" ${i?"checked":""} ${e.state.busy||a.writable===!1?"disabled":""} /> ${c(l)}</label>`,s=(r,i,l,d="")=>`<label>${c(l)}
      <input type="number" name="${c(r)}" value="${c(String(i??0))}" ${e.state.busy||a.writable===!1?"disabled":""} />
      ${d?`<span class="muted small">${c(d)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${x("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ie(e,t.status)}">${c(we(e,t.status))}</span>`:""}
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
            ${["Digest","Basic","Apache"].map(r=>`<option value="${r}" ${a.dav_auth_type===r?"selected":""}>${r}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||a.writable===!1?"disabled":""}>
            ${va(a.timezone||"UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${c(a.invite_from||"")}" placeholder="noreply@example.com" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${n("files_enabled",!!a.files_enabled,"Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${c(a.files_storage_path||"")}" placeholder="empty = Specific/files" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        ${s("files_max_upload_mb",a.files_max_upload_mb,"Max file size (MB)")}
        ${s("files_quota_mb",a.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
        ${s("files_quarantine_days",a.files_quarantine_days,"Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${s("session_max_age_minutes",a.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(r=>`<option value="${r}" ${(a.portal_log_level||"off")===r?"selected":""}>${r}</option>`).join("")}
          </select>
        </label>
        ${n("portal_admin_ui_enabled",a.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${c(Array.isArray(a.portal_admin_users)?a.portal_admin_users.join(", "):String(a.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${n("push_enabled",!!a.push_enabled,"Enable WebDAV-Push")}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${c(a.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(r=>`<option value="${r}" ${(a.push_log_level||"off")===r?"selected":""}>${r}</option>`).join("")}
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
    ${Bn(e)}`}function Bn(e){return e.state.adminResetModalOpen?N({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${Xe({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${c(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function Vn(e,t){const a=new FormData(t),n=l=>{var d;return!!((d=t.querySelector(`input[name="${l}"]`))!=null&&d.checked)},s={cal_enabled:n("cal_enabled"),card_enabled:n("card_enabled"),tasks_enabled:n("tasks_enabled"),notes_enabled:n("notes_enabled"),files_enabled:n("files_enabled"),push_enabled:n("push_enabled"),portal_admin_ui_enabled:n("portal_admin_ui_enabled"),timezone:String(a.get("timezone")??"").trim(),invite_from:String(a.get("invite_from")??"").trim(),dav_auth_type:String(a.get("dav_auth_type")??"Digest"),files_storage_path:String(a.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(a.get("files_max_upload_mb")??0),files_quota_mb:Number(a.get("files_quota_mb")??0),files_quarantine_days:Number(a.get("files_quarantine_days")??0),session_max_age_minutes:Number(a.get("session_max_age_minutes")??15),portal_log_level:String(a.get("portal_log_level")??"off"),portal_admin_users:String(a.get("portal_admin_users")??"").trim(),push_external_url:String(a.get("push_external_url")??"").trim(),push_log_level:String(a.get("push_log_level")??"off")},r=String(a.get("admin_password")??""),i=String(a.get("admin_password_confirm")??"");(r!==""||i!=="")&&(s.admin_password=r,s.admin_password_confirm=i),e.state.busy=!0,e.clearFlash(),e.render();try{const l=await w.adminUpdateSystemSettings(s);e.state.adminSystemSettings=l.data,h.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function $a(e,t){const a=new FormData(t),n=String(a.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",s={backend:n};return n==="sqlite"?s.sqlite_file=String(a.get("sqlite_file")??"").trim():(s.pgsql_host=String(a.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(a.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(a.get("pgsql_username")??"").trim(),s.pgsql_password=String(a.get("pgsql_password")??"")),s}function Hn(e,t){e.state.adminDbPendingBody=$a(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function zn(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const a=$a(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const n=await w.adminTestDatabaseConnection(a);e.setFlash("success",n.message||"Connection successful"),h.event("admin.database.test",{backend:n.backend})}catch(n){e.setFlash("error",n instanceof Error?n.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function jn(e){const t=te(e,"database");if(t&&t.available===!1)return et(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${c(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const a=e.state.adminDatabaseSettings;if(!a)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const n=e.state.adminDbFormBackend,s=a.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${x("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ie(e,t.status)}">${c(we(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${e.state.busy?"disabled":""}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${c(a.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${c((a.backend||"—").toUpperCase())}</span></dd>
        </div>
        ${a.backend==="sqlite"||a.sqlite_file?`<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${c(a.sqlite_file||"—")}</dd>
        </div>`:""}
        ${a.backend==="pgsql"||a.pgsql_host?`<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${c(a.pgsql_host||"—")} / ${c(a.pgsql_dbname||"—")} · ${c(a.pgsql_username||"—")}</dd>
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
            <input type="text" name="sqlite_file" class="mono" value="${c(a.sqlite_file||"")}" ${e.state.busy||s?"disabled":""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${n==="pgsql"?"":"display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${c(a.pgsql_host||"")}" placeholder="localhost:5432" ${e.state.busy||s?"disabled":""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${c(a.pgsql_dbname||"")}" ${e.state.busy||s?"disabled":""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${c(a.pgsql_username||"")}" autocomplete="off" ${e.state.busy||s?"disabled":""} />
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
    ${Kn(e)}`}function Kn(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return N({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${c(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function wa(e,t,a={}){if(!e.userIsAdmin()){await e.activateTab("calendars",a);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):a.username!==void 0&&(e.state.adminSelectedUsername=a.username,a.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),h.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),a.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await $t(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const n=te(e,t);t==="overview"&&(n==null?void 0:n.available)!==!1?await We(e):t==="users"&&(n==null?void 0:n.available)!==!1?(await de(e),e.state.adminSelectedUsername&&(await j(e,e.state.adminSelectedUsername),await oe(e,e.state.adminSelectedUsername))):t==="settings"&&(n==null?void 0:n.available)!==!1?await Je(e):t==="database"&&(n==null?void 0:n.available)!==!1&&await Ye(e)}catch(n){h.warn("admin page load failed",n instanceof Error?n.message:n),e.setFlash("error",n instanceof Error?n.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function Wn(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?On(e):e.state.adminPage==="settings"?Rn(e):e.state.adminPage==="database"?jn(e):Pn(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function Jn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function Yn(e,t,a,n){var s,r;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const i=Jn(a.dataset.adminPage);return i&&await wa(e,i),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await We(e),e.setFlash("success","Overview refreshed")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await de(e),e.state.adminSelectedUsername&&await j(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const i=a.dataset.username??"";if(!i||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=i,e.state.adminPage="users",e.persistTab("admin","users",i),e.render();try{await j(e,i),await oe(e,i)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const i=a.dataset.username??e.state.adminSelectedUsername??"";if(!i)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=i,e.state.adminPage="users",e.persistTab("admin","users",i),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==i.toLowerCase())&&await j(e,i),e.state.adminUserEditOpen=!0}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const i=a.dataset.username??e.state.adminSelectedUsername??"";return i&&(e.state.adminUserDeleteUsername=i,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const i=a;return e.state.adminUserDeleteConfirmChecked=!!i.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const i=a.dataset.username??e.state.adminUserDeleteUsername??"";if(!i||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await w.adminDeleteUser(i,!0),h.event("admin.user.delete",{username:i}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((s=e.state.adminSelectedUsername)==null?void 0:s.toLowerCase())===i.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await de(e),e.setFlash("success",`Deleted user “${i}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(a.dataset.id),label:a.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(a.dataset.id),label:a.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((r=e.state.adminResourceDelete)==null?void 0:r.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!a.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const i=e.state.adminSelectedUsername,l=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{l.kind==="calendar"?await w.adminDeleteUserCalendar(i,l.id,!0):await w.adminDeleteUserAddressBook(i,l.id,!0,!!l.force),e.state.adminResourceDelete=null,await oe(e,i),await j(e,i),e.setFlash("success","Deleted")}catch(d){e.setFlash("error",d instanceof Error?d.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await Je(e),e.setFlash("success","Settings reloaded")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const i=a;return e.state.adminResetConfirmChecked=!!i.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=a.value;const i=e.root.querySelector('[data-action="admin-reset-confirm"]');return i&&(i.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const i=await w.adminResetToDefault(!0,e.state.adminResetPassword);h.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const l=i.redirectUrl&&i.redirectUrl.startsWith("/")?i.redirectUrl:"/portal/install/";return window.location.assign(l),!0}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await Ye(e),e.setFlash("success","Database settings reloaded")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const i=a;return e.state.adminDbFormBackend=i.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const i=a.closest("form");return zn(e,i),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const i=a;e.state.adminDbConfirmText=i.value,e.render();const l=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const d=l.value.length;l.setSelectionRange(d,d)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const i={...e.state.adminDbPendingBody,confirm:"CONFIRM"},l=await w.adminUpdateDatabaseSettings(i);e.state.adminDatabaseSettings=l.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const d=(l.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=d==="pgsql"?"pgsql":"sqlite",h.event("admin.database.save",{backend:l.data.backend}),e.setFlash("success","Database settings saved")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function ka(e){const{root:t}=e,a=t.querySelector('[data-form="admin-user-create"]');a==null||a.addEventListener("submit",d=>{d.preventDefault(),Nn(e,a)});const n=t.querySelector('[data-form="admin-user-edit"]');n==null||n.addEventListener("submit",d=>{d.preventDefault(),Mn(e,n)});const s=t.querySelector('[data-form="admin-cal"]');s==null||s.addEventListener("submit",d=>{d.preventDefault(),xn(e,s)});const r=t.querySelector('[data-form="admin-ab"]');r==null||r.addEventListener("submit",d=>{d.preventDefault(),Ln(e,r)});const i=t.querySelector('[data-form="admin-settings"]');i==null||i.addEventListener("submit",d=>{d.preventDefault(),Vn(e,i)});const l=t.querySelector('[data-form="admin-database"]');l==null||l.addEventListener("submit",d=>{d.preventDefault(),Hn(e,l)})}function L(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${n}`}function Gn(e,t){const a=new Date(e,t,1),n=new Date(e,t+1,0);return{from:L(a),to:L(n)}}function wt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,n,s]=e.split("-").map(Number);return new Date(a,n-1,s)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,n,s]=e.slice(0,10).split("-").map(Number);return new Date(a,(n||1)-1,s||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Qn(e){const t=wt(e.start);if(!e.end)return[L(t)];let a=wt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[L(t)];const n=[],s=new Date(t.getFullYear(),t.getMonth(),t.getDate()),r=new Date(a.getFullYear(),a.getMonth(),a.getDate());let i=0;for(;s<=r&&i++<370;)n.push(L(s)),s.setDate(s.getDate()+1);return n.length?n:[L(t)]}function ye(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):L(t)}function Xn(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const a=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(a.hourCycle==="h23"||a.hourCycle==="h24")return!1;if(a.hourCycle==="h11"||a.hourCycle==="h12")return!0;if(typeof a.hour12=="boolean")return a.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function Tt(e){return Xn(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function At(e){var n;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(n=navigator.languages)!=null&&n.length?navigator.languages:[],navigator.language].filter(Boolean);for(const s of t)try{const r=new Intl.Locale(s),i=typeof r.getWeekInfo=="function"?r.getWeekInfo():r.weekInfo,l=i==null?void 0:i.firstDay;if(typeof l=="number")return l===7?0:l}catch{}const a=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(a)?0:1}function ha(e){const t=At(e),a=new Date(2024,0,7+t),n=[];for(let s=0;s<7;s++){const r=new Date(a);r.setDate(a.getDate()+s),n.push(r.toLocaleDateString(void 0,{weekday:"short"}))}return n}function Sa(e,t=15){const a=t*60*1e3,n=e.getTime();return n%a===0?new Date(n):new Date(Math.ceil(n/a)*a)}function G(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Zn(e,t,a){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const s=e.slice(0,10),[r,i,l]=s.split("-").map(Number);return new Date(r,i-1,l).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const n=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(n.getTime())?e:n.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Tt(a)})}function ge(e){if(!e){const a=Sa(new Date);return{date:L(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:L(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Pe(e){const t=new Date,a=L(t);if(e&&e!==a){const[r,i,l]=e.split("-").map(Number),d=new Date(r,i-1,l,9,0,0,0),u=new Date(r,i-1,l,10,0,0,0);return{start:G(d),end:G(u)}}const n=Sa(t,15),s=new Date(n.getTime()+3600*1e3);return{start:G(n),end:G(s)}}function es(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Ut(e,t){const a=e.slice(0,10),n=(t||a).slice(0,10);if(a===n){const v=Pe(a);return{start:v.start,end:v.end}}const[s,r,i]=a.split("-").map(Number),[l,d,u]=n.split("-").map(Number),g=G(new Date(s,r-1,i,9,0,0,0)),b=G(new Date(l,d-1,u,17,0,0,0));return{start:g,end:b}}function ts(e,t){const a=ye(e);let n=t?ye(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const s=new Date(t);if(!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getTime()>new Date(e).getTime()){const r=wt(t);r.setDate(r.getDate()-1),n=L(r)}}return{start:a,end:n}}function $e(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function as(e){const{field:t,value:a,dateOnly:n,allowClear:s,viewY:r,viewM:i,weekStart:l,timeFormat:d}=e,u=ge(a),g=At(l),b=ha(l),S=(new Date(r,i,1).getDay()-g+7)%7,E=new Date(r,i+1,0).getDate(),o=new Date(r,i,0).getDate(),m=u.date,p=u.hm,$=[],y=Math.ceil((S+E)/7)*7;for(let P=0;P<y;P++){let U,q,ne=!1;P<S?(U=o-S+P+1,q=new Date(r,i-1,U),ne=!0):P>=S+E?(U=P-(S+E)+1,q=new Date(r,i+1,U),ne=!0):(U=P-S+1,q=new Date(r,i,U));const ce=L(q),ue=ce===m,Oe=ce===L(new Date);$.push(`<button type="button" class="dt-day${ne?" is-outside":""}${ue?" is-selected":""}${Oe?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${c(ce)}">${U}</button>`)}const f=new Date().getFullYear(),k=Math.min(1900,r),A=Math.max(f+30,r),F=Array.from({length:12},(P,U)=>{const q=new Date(2e3,U,1).toLocaleString(void 0,{month:"short"});return`<option value="${U}" ${U===i?"selected":""}>${c(q)}</option>`}).join(""),O=[];for(let P=k;P<=A;P++)O.push(`<option value="${P}" ${P===r?"selected":""}>${P}</option>`);const D=n?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${es().map(P=>{const U=(()=>{const[q,ne]=P.split(":").map(Number);return new Date(2e3,0,1,q,ne).toLocaleTimeString(void 0,Tt(d))})();return`<button type="button" class="dt-time${P===p?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${P}" role="option" aria-selected="${P===p}">${c(U)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${n?"":" and time"}">
      <div class="dt-popover-inner${n?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${c(t)}" aria-label="Month">${F}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${c(t)}" aria-label="Year">${O.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${b.map(P=>`<span class="dt-dow">${c(P)}</span>`).join("")}</div>
          <div class="dt-days">${$.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(t)}" ${s?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${D}
      </div>
    </div>`}function ns(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const a=t.querySelector(".dt-trigger"),n=t.querySelector(".dt-popover");if(!a||!n)return;const s=a.getBoundingClientRect(),r=8;n.style.position="fixed",n.style.visibility="hidden",n.style.top="0",n.style.left="0";const i=n.offsetWidth||320,l=n.offsetHeight||300;let d=s.bottom+6;d+l>window.innerHeight-r&&(d=Math.max(r,s.top-l-6));let u=s.left;u+i>window.innerWidth-r&&(u=Math.max(r,window.innerWidth-i-r)),u<r&&(u=r),n.style.top=`${Math.round(d)}px`,n.style.left=`${Math.round(u)}px`,n.style.right="auto",n.style.visibility="visible",n.style.zIndex="200"})}async function Ft(e,t){const a=await w.shares(t);e.state.shares=a.shares}function ss(e){const t=e.state.calendars.filter(n=>n.canShare);if(t.length===0)return null;const a=n=>{const s=n.uri.toLowerCase(),r=n.displayname.toLowerCase();return s==="default"||r==="default"||r==="default calendar"};return t.find(a)??t[0]??null}async function tt(e){const t=e.state.selectedIds.filter(s=>e.state.calendars.some(r=>r.id===s));if(t.length===0){e.state.monthEvents=[];return}const{from:a,to:n}=Gn(e.state.monthCursor.y,e.state.monthCursor.m);e.state.monthEventsLoading=!0,h.debug("loadMonthEvents",{selectedIds:t,from:a,to:n});try{const r=(await Promise.all(t.map(async i=>(await w.calendarEvents(i,a,n)).events.map(d=>({...d,instanceId:i}))))).flat();r.sort((i,l)=>{const d=i.start||"",u=l.start||"";return d!==u?d<u?-1:1:(i.summary||"").localeCompare(l.summary||"")}),e.state.monthEvents=r,h.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:a,to:n})}catch(s){e.state.monthEvents=[],h.warn("loadMonthEvents failed",s instanceof Error?s.message:s)}finally{e.state.monthEventsLoading=!1}}function rs(e,t){const a=e.state.calendars.find(n=>n.id===t);return a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6"}function is(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(a=>a!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t)}function ls(e,t,a){return new Date(t,a,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function ds(e,t){const a=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return a;const n=new Date(t.start);return Number.isNaN(n.getTime())?a:`${n.toLocaleTimeString(void 0,e.timeFormatOpts())} ${a}`}function os(e){const t=e.state.calendars.filter($=>e.state.selectedIds.includes($.id)),a=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,n=e.state.monthCursor.y,s=e.state.monthCursor.m,r=new Date(n,s,1),i=e.localeWeekStart(),l=(r.getDay()-i+7)%7,d=new Date(n,s+1,0).getDate(),u=new Date(n,s,0).getDate(),b=L(new Date),v=e.localeDowLabels(),S=new Map;for(const $ of e.state.monthEvents)for(const y of Qn($)){const f=S.get(y)??[];f.push($),S.set(y,f)}const E=[],o=Math.ceil((l+d)/7)*7;for(let $=0;$<o;$++){let y,f=!0,k;$<l?(y=u-l+$+1,f=!1,k=new Date(n,s-1,y)):$>=l+d?(y=$-(l+d)+1,f=!1,k=new Date(n,s+1,y)):(y=$-l+1,k=new Date(n,s,y));const A=L(k),F=A===b,O=f?S.get(A)??[]:[],D=e.state.monthExpandDay===A?50:3,P=O.slice(0,D),U=O.length-P.length,q=P.map(me=>{var _t;const nt=me.instanceId,st=ds(e,me),Na=rs(e,nt),Lt=((_t=e.state.calendars.find(xa=>xa.id===nt))==null?void 0:_t.displayname)||"",Ma=Lt?`${st} · ${Lt}`:st;return`<button type="button" class="month-event${me.allDay?"":" is-timed"}" title="${c(Ma)}" style="--ev-color:${c(Na)}"
          data-action="open-event" data-instance="${nt}" data-uri="${c(me.uri)}" ${e.state.busy?"disabled":""}>${c(st)}</button>`}).join(""),ne=U>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(A)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${U} more</button>`:"",ce=!f&&(y===1||$===l+d)?k.toLocaleString(void 0,{month:"short",day:"numeric"}):String(y),ue=e.state.selectedId!==null?e.state.calendars.find(me=>me.id===e.state.selectedId)??null:null,Oe=!!(ue&&!ue.readOnly&&(ue.canShare||ue.access==="readwrite"));E.push(`<div class="month-cell${f?"":" is-outside"}${F?" is-today":""}${Oe?" is-clickable":""}"${Oe?` data-action="new-event-day" data-day="${c(A)}" role="button" tabindex="0" title="Add event on ${c(A)}"`:""}>
      <div class="month-daynum${F?" is-today-num":""}">${c(ce)}</div>
      <div class="month-events">${q}${ne}</div>
    </div>`)}const m=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",p=t.slice(0,6).map($=>{const y=$.color&&$.color.length>=7?$.color.slice(0,7):$.color||"#3B82F6";return`<span class="cal-swatch" style="background:${c(y)};margin-top:0" title="${c($.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
    <div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${c(ls(e,n,s))}</h2>
      <span class="month-cal-name muted small" title="${c(a)}">
        ${p}
        ${c(a)}
      </span>
    </div>
    ${m}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${v.map($=>`<div class="month-dow">${c($)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${E.join("")}
      </div>
    </div>
  </section>`}function It(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function cs(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Fe(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),n=String(e.get("repeatEndMode")??"never"),s=n==="until"||n==="count"?n:"never";let r=null,i=null;if(s==="until"){const d=String(e.get("repeatUntil")??"").trim();r=d?d.slice(0,10):null}else if(s==="count"){const d=Number(e.get("repeatCount")??0);i=Number.isFinite(d)&&d>0?Math.min(999,Math.round(d)):10}const l=e.getAll("repeatByDay").map(d=>String(d).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:r,count:i,byDay:l,endMode:s}}function us(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,a=t.repeat??It(),n=(a.freq||"").toUpperCase(),s=e.state.calendars.filter(E=>E.canShare||E.access==="readwrite"),r=e.state.calendars.filter(E=>E.id===t.instanceId?!0:E.readOnly?!1:E.canShare||E.access==="readwrite").map(E=>`<option value="${E.id}" ${E.id===t.instanceId?"selected":""}>${c(E.displayname)}</option>`).join(""),i=t.readOnly||!t.canWrite;let l,d;if(t.allDay)l=ye(t.start),d=ye(t.end);else{const E=t.start||"",o=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(E)){const m=Ut(E,o||null);l=m.start,d=m.end||""}else l=$e(t.start),d=$e(t.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],g=new Set((a.byDay||[]).map(E=>E.toUpperCase())),b=cs(a),v=!!n&&b==="until",S=a.until||(b==="until"?ye(t.start)||L(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${e.state.creatingEvent?"New event":"Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${e.renderFlashBanner()}
        ${!e.state.creatingEvent&&(t.hasRrule||n)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
        ${i?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${i||s.length===0?"disabled":""}>
              ${r||`<option value="${t.instanceId}">${c(t.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${i?"readonly":""} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${c(t.location)}" ${i?"readonly":""} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${i?"readonly":""}>${c(t.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${i?"disabled":""} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${e.renderPortalDateTimeField({field:"start",name:"start",label:"Start",value:l,dateOnly:t.allDay,required:!0,disabled:i,allowClear:!1})}
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:d,dateOnly:t.allDay,disabled:i||v,allowClear:!v})}
          </div>
          <fieldset class="event-repeat" ${i?"disabled":""}>
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
                <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(a.interval||1))}" ${n?"":"disabled"} />
              </label>
            </div>
            ${n==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${u.map(E=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${E.code}" ${g.has(E.code)?"checked":""} />
                            ${E.label}
                          </label>`).join("")}
                  </div>`:""}
            ${n?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${b==="never"?"selected":""}>Never</option>
                        <option value="until" ${b==="until"?"selected":""}>On date</option>
                        <option value="count" ${b==="count"?"selected":""}>After count</option>
                      </select>
                    </label>
                    ${b==="until"?e.renderPortalDateTimeField({field:"until",name:"repeatUntil",label:"Until",value:S,dateOnly:!0,disabled:i,allowClear:!0}):b==="count"?`<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${c(String(a.count||10))}" />
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
  </div>`}function ms(e,t,a){const n=e.state.calendars.find(s=>s.id===a);return{uri:"",instanceId:a,calendarId:(n==null?void 0:n.calendarId)??0,calendarName:(n==null?void 0:n.displayname)??"Calendar",calendarUri:(n==null?void 0:n.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:It(),readOnly:!1,canWrite:!0}}function ps(e,t){if(!e.state.editingEvent)return;const a=new FormData(t),n=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(a.get("summary")??e.state.editingEvent.summary),description:String(a.get("description")??e.state.editingEvent.description),location:String(a.get("location")??e.state.editingEvent.location),instanceId:Number(a.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(n==null?void 0:n.checked)??e.state.editingEvent.allDay,start:String(a.get("start")??e.state.editingEvent.start??""),end:String(a.get("end")??e.state.editingEvent.end??"")||null,repeat:Fe(a),hasRrule:!!String(a.get("repeatFreq")??"").trim()}}function Z(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function Da(e){Z(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){Z(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&Ea(e,e.state.importProgress)},1e3)}function Te(e,t,a={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...a},e.render())}function fs(e){Z(e),e.state.importProgress=null,e.render()}function Ca(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Ea(e,e.state.importProgress))}function Ea(e,t){const a=e.root.querySelector("[data-import-status-line]"),n=e.root.querySelector(".import-progress-bar"),s=e.root.querySelector(".import-progress-track"),r=e.root.querySelector("[data-import-counts]"),i=t.kind==="calendar"?"items":"contacts";let l;if(t.phase==="processing"&&t.processTotal>0)l=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${i} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`;else if(t.phase==="processing")l=`Importing on server… ${H(t.elapsedSec)}`;else return;a&&(a.textContent=l),r&&(r.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),n&&t.processPercent!==null&&(n.classList.remove("is-indeterminate"),n.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),s&&t.processPercent!==null&&(s.setAttribute("aria-valuenow",String(t.processPercent)),s.removeAttribute("aria-valuetext"))}function _e(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,a=t.phase!=="done"&&t.phase!=="error",n=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",s=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",r=(()=>{const d=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],g={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return d.map((b,v)=>{let S="pending";return t.phase==="done"||v<g?S="done":v===g&&(S=(t.phase==="error","active")),`<li class="import-step import-step-${S}"><span class="import-step-icon" aria-hidden="true">${S==="done"?"✓":S==="active"?"●":"○"}</span> ${c(b.label)}</li>`}).join("")})();let i="";if(a){let d=null;t.phase==="reading"&&t.readPercent!==null?d=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(d=Math.min(100,Math.max(0,t.processPercent)));const u=d===null?"import-progress-bar is-indeterminate":"import-progress-bar",g=d!==null?` style="width:${d}%"`:"",b=t.kind==="calendar"?"items":"contacts";let v;t.phase==="reading"?v=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?v="Uploading to server…":t.processTotal>0?v=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${b} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`:v=`Importing on server… ${H(t.elapsedSec)}`;const S=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';i=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${c(n)}</strong> from
        <span class="mono">${c(t.fileName)}</span>
        ${t.fileSizeLabel?` <span class="muted">(${c(t.fileSizeLabel)})</span>`:""}
      </p>
      <ul class="import-steps">${r}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${d!==null?`aria-valuenow="${d}"`:'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${u}"${g}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${c(v)}</p>
      ${S}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?i=`
      ${W("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${c(t.fileName)}</span>
        · Took ${c(H(t.elapsedSec))}
      </p>`:i=`
      ${W("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${c(t.fileName)}</span>
        · After ${c(H(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const l=a?'<p class="muted small" style="margin:0">Please wait…</p>':St([{label:"Close",action:"close-import-progress",variant:"primary"}]);return N({title:s,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:a,lockBackdrop:a,body:i,footer:l})}function Pa(e,t,a){return new Promise((n,s)=>{const r=new FileReader;r.onprogress=i=>{i.lengthComputable&&i.total>0?a(Math.min(100,Math.round(i.loaded/i.total*100))):a(null)},r.onload=()=>n(String(r.result??"")),r.onerror=()=>s(r.error??new Error("Failed to read file")),r.readAsText(t)})}function bs(e){const t=e.root.querySelector('input[data-action="import-cal"]');t&&t.addEventListener("change",()=>{gs(e,t)});const a=e.root.querySelector('input[data-action="import-create-cal"]');a&&a.addEventListener("change",()=>{ys(e,a)});const n=e.root.querySelector('input[data-action="import-ab"]');n&&n.addEventListener("change",()=>{e.onImportContacts(n)})}async function gs(e,t){var n;if(e.state.selectedId===null)return;const a=(n=t.files)==null?void 0:n[0];t.value="",a&&(e.state.calModalOpen=!0,await Ta(e,e.state.selectedId,a,{keepEditModalOpen:!0}))}async function ys(e,t){var g;const a=(g=t.files)==null?void 0:g[0];if(t.value="",!a)return;const n=e.root.querySelector('[data-form="create-cal"]'),s=n?new FormData(n):new FormData,r=s.get("holidays")==="on",i=s.get("readOnly")==="on";if(r){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(i){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let l=String(s.get("displayname")??"").trim();l||(l=a.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const d=String(s.get("description")??""),u=String(s.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const b=await w.createCalendar({displayname:l,description:d,color:u,readOnly:!1});e.state.selectedId=b.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${b.calendar.displayname}” — importing…`),await Ta(e,b.calendar.id,a,{keepEditModalOpen:!1,successPrefix:`Calendar “${b.calendar.displayname}” created. `})}catch(b){const v=b instanceof Error?b.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",v),e.state.busy=!1,e.render()}}async function Ta(e,t,a,n={}){e.state.busy=!0,e.clearFlash(),Z(e),e.state.importProgress={kind:"calendar",fileName:a.name,fileSizeLabel:Ke(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Da(e),e.render();try{const s=await Pa(e,a,l=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:l};const d=e.root.querySelector(".import-progress-bar"),u=e.root.querySelector("[data-import-status-line]");d&&l!==null&&(d.classList.remove("is-indeterminate"),d.style.width=`${l}%`),u&&l!==null&&(u.textContent=`Reading file… ${l}%`)});Te(e,"uploading",{readPercent:100}),Te(e,"processing",{processPercent:0}),h.event("import.calendar.start",{file:a.name,bytes:a.size,calId:t});const r=await w.importCalendar(t,s,l=>{Ca(e,l)}),i=e.formatImportResult(r);e.state.selectedId===t&&await tt(e),Z(e),Te(e,"done",{ok:!0,resultMessage:`${i} (from “${a.name}”)`}),e.setFlash("success",`${n.successPrefix||""}Import finished for “${a.name}”: ${i}.`)}catch(s){const r=s instanceof Error?s.message:"Import failed";Z(e),Te(e,"error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{n.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function vs(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),n=String(a.get("username")??""),s=String(a.get("access")??"read");e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await w.share(e.state.selectedId,n,s),await Ft(e,e.state.selectedId),e.setFlash("success",`Shared with ${n}`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function $s(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),r=String(a.get("location")??"").trim(),i=a.get("allDay")==="on",l=String(a.get("start")??"").trim(),d=String(a.get("end")??"").trim(),u=Number(a.get("instanceId"))||e.state.editingEvent.instanceId,g=Fe(a);if(!n){e.setFlash("error","Title is required"),e.render();return}if(!l){e.setFlash("error","Start is required"),e.render();return}let b,v;if(i)b=l.slice(0,10),v=d?d.slice(0,10):b;else if(/^\d{4}-\d{2}-\d{2}$/.test(l)){const m=Ut(l,d||null);b=new Date(m.start).toISOString(),v=m.end?new Date(m.end).toISOString():null}else b=new Date(l).toISOString(),v=d?new Date(d).toISOString():null;const S=e.state.editingEvent.instanceId,E=e.state.editingEvent.uri,o=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),h.event(o?"event.create":"event.update",{instanceId:u,uri:o?null:E,allDay:i,summary:n});try{const m={summary:n,description:s,location:r,allDay:i,start:b,end:v,instanceId:u,repeat:g},p=o?await w.createEvent(u,m):await w.updateEvent(S,E,m);(e.state.selectedId===null||p.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=p.event.instanceId),await tt(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,h.event(o?"event.created":"event.saved",{uri:p.event.uri,instanceId:p.event.instanceId}),e.setFlash("success",ee("Event",p.event.summary||n,o?"created":"saved"))}catch(m){h.warn("event.save failed",m instanceof Error?m.message:m),e.setFlash("error",m instanceof Error?m.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function ws(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??""),r=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const i=await w.updateCalendar(e.state.selectedId,{displayname:n,description:s,color:r});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=i.calendar.id,await Ft(e,e.state.selectedId),await tt(e),e.setFlash("success","Calendar updated")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function ks(e,t){const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??""),r=String(a.get("color")??"").trim(),i=a.get("holidays")==="on",l=String(a.get("holidayCountry")??"").trim(),d=a.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,i&&!l){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!i&&!n){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const u=await w.createCalendar({displayname:n,description:s,color:r,holidays:i,holidayCountry:i?l:void 0,readOnly:d});e.state.selectedId=u.calendar.id,e.state.selectedIds.includes(u.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,u.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let g=`Created “${u.calendar.displayname}”`;const b=u.holidayImport??u.calendar.holidayImport;b&&(g+=`. Holidays imported: ${e.formatImportResult(b)}.`),d&&(g+=" Calendar is read-only."),e.setFlash("success",g)}catch(u){e.state.createCalModalOpen=!0,e.setFlash("error",u instanceof Error?u.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function hs(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const a=t.querySelector('input[name="holidays"]'),n=t.querySelector("#holidays-country-wrap"),s=t.querySelector('input[name="displayname"]'),r=t.querySelector('input[name="readOnly"]');if(!a||!n)return;const i=()=>{const l=a.checked;n.hidden=!l,s&&(s.required=!l,l&&!s.value.trim()?s.placeholder="Auto: Holidays (XX)":l||(s.placeholder="Work")),l&&r&&(r.checked=!0)};a.addEventListener("change",i),i()}function Yt(e){const{state:t}=e,a=t.calendars.filter(o=>o.canShare),n=t.calendars.filter(o=>!o.canShare),s=t.calendars.find(o=>o.id===t.selectedId)??null,r=a.map(o=>{const m=t.selectedIds.includes(o.id),p=m?" is-selected":"",$=o.id===t.selectedId?" is-primary":"",y=o.color?`<span class="cal-swatch" style="background:${c(o.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',f=e.accessBadge(o.access)+(o.readOnly?'<span class="badge">read-only</span>':"")+(o.holidaysCountry?`<span class="badge badge-admin">holidays ${c(o.holidaysCountry)}</span>`:"");return`<div class="cal-row${p}${$}" data-action="select-cal" data-id="${o.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
          <input type="checkbox" data-action="toggle-cal" data-id="${o.id}" ${m?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${y}
        <span class="cal-row-text">
          <span class="cal-row-title">${c(o.displayname)}</span>
          <span class="cal-row-badges">${f}</span>
          <span class="muted small mono cal-row-uri">${c(o.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${o.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${o.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${o.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),i=n.map(o=>{const m=t.selectedIds.includes(o.id),p=m?" is-selected":"",$=o.id===t.selectedId?" is-primary":"",y=o.color?`<span class="cal-swatch" style="background:${c(o.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',f=o.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${p}${$}" data-action="select-cal" data-id="${o.id}" role="button" tabindex="0" title="${c(f)}">
        <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
          <input type="checkbox" data-action="toggle-cal" data-id="${o.id}" ${m?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${y}
        <span class="cal-row-text">
          <span class="cal-row-title">${c(o.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(o.access)}</span>
          <span class="muted small">${o.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${o.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),l=t.directory.map(o=>`<option value="${c(o.username)}">${c(o.displayname)} (${c(o.username)})</option>`).join(""),d=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(o=>`<tr>
              <td>
                <strong>${c(o.displayname||o.username||o.href)}</strong>
                <div class="muted small mono">${c(o.username||o.href)}</div>
              </td>
              <td>${e.accessBadge(o.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${c(o.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),u=s!=null&&s.color&&s.color.length>=7?s.color.slice(0,7):"#3B82F6",g=!!(s&&s.readOnly),b=t.calModalOpen&&s&&s.canShare?N({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${c(s.uri)}
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
                      value="${c(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${c(u)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${c(s.color||u)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${c(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${c(s.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${x(`Share “${s.displayname}”`,"share")}
                ${g?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
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
                    <select name="access" ${g?"disabled":""}>
                      <option value="read" selected>Read only</option>
                      ${g?"":'<option value="readwrite">Full access</option>'}
                    </select>
                    ${g?'<input type="hidden" name="access" value="read" />':""}
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
                ${s.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||s.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||s.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",v=t.deleteConfirmId!==null?t.calendars.find(o=>o.id===t.deleteConfirmId&&o.canShare)??null:null,S=v?N({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${c(v.displayname)}</strong>
              <span class="muted small mono">(${c(v.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${Xe({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${v.id}"`}]}):"",E=t.createCalModalOpen?N({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
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
                  ${t.holidayCountries.map(o=>`<option value="${c(o.code)}">${c(o.name)} (${c(o.code)})</option>`).join("")}
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
            ${n.length?`<div class="calendars-shared-block">
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
    ${E}
    ${b}
    ${S}
    ${e.renderEventModal()}`}async function Aa(e){const t=await w.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars,e.state.selectedNoteKey!==null&&!e.state.notes.some(a=>`${a.instanceId}|${a.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function _(e,t){return`${e}|${t}`}function Ss(e){const t=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(r=>{const i=_(r.instanceId,r.uri),l=!e.state.creatingNote&&i===e.state.selectedNoteKey?" is-selected":"",d=(r.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${l}" data-action="select-note" data-instance="${r.instanceId}" data-uri="${c(r.uri)}" tabindex="0" role="button">
              <td class="col-note-title">
                <span class="contact-name-primary">${c(r.summary||r.uri)}</span>
                ${d?`<span class="muted small contact-name-secondary">${c(d)}${r.description.length>80?"…":""}</span>`:""}
                ${r.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${c(pa(r.dtstart))}</td>
              <td class="col-note-cal muted small">${c(r.calendarName)}</td>
            </tr>`}).join(""),a=e.state.editingNote,n=e.state.noteCalendars.map(r=>`<option value="${r.id}" ${a&&a.instanceId===r.id?"selected":""}>${c(r.displayname)}</option>`).join(""),s=a?`<div class="card">
          ${x(e.state.creatingNote?"New note":"Edit note","notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${e.state.creatingNote?`<label>Calendar
                    <select name="instanceId" required ${e.state.noteCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.noteCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${n}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${c(a.calendarName)}</strong>${a.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(a.summary)}" ${a.readOnly&&!e.state.creatingNote?"readonly":""} />
            </label>
            ${e.renderPortalDateTimeField({field:"dtstart",name:"dtstart",label:"Date",value:$e(a.dtstart),dateOnly:!1,disabled:!!(a.readOnly&&!e.state.creatingNote),allowClear:!0})}
            <label>Body
              <textarea name="description" rows="8" maxlength="20000" ${a.readOnly&&!e.state.creatingNote?"readonly":""}>${c(a.description)}</textarea>
            </label>
            <div class="form-actions-row">
              ${e.state.creatingNote||a.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingNote?"Create note":"Save note"}</button>`:""}
              ${!e.state.creatingNote&&a.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingNote?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${x("Notes","notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(e.state.noteSearch)}" aria-label="Search notes" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-note" ${e.state.busy||e.state.noteCalendars.length===0?"disabled":""}>Add note</button>
      </div>
      ${e.state.noteCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              ${Y("Title","summary",e.state.noteSort,e.state.noteOrder,"note","col-note-title")}
              ${Y("Date","dtstart",e.state.noteSort,e.state.noteOrder,"note","col-note-date")}
              ${Y("Calendar","calendar",e.state.noteSort,e.state.noteOrder,"note","col-note-cal")}
            </tr>
          </thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${s}
    </section>
  </div>`}function Ds(e,t){if(!e.state.editingNote)return;const a=new FormData(t),n=String(a.get("dtstart")??"").trim(),s=a.get("instanceId"),r=s!==null&&String(s)!==""?Number(s):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(r)&&r>0?r:e.state.editingNote.instanceId,summary:String(a.get("summary")??e.state.editingNote.summary),description:String(a.get("description")??e.state.editingNote.description),dtstart:n?new Date(n).toISOString():null}}async function Cs(e,t){const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),r=String(a.get("dtstart")??"").trim(),i=r?new Date(r).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const l=Number(a.get("instanceId"));if(!Number.isFinite(l)||l<=0)throw new Error("Select a calendar");const d=await w.createNote({instanceId:l,summary:n,description:s,dtstart:i});e.state.creatingNote=!1,e.state.selectedNoteKey=_(d.note.instanceId,d.note.uri),e.state.editingNote=d.note,e.setFlash("success",ee("Note",d.note.summary||n,"created"))}else if(e.state.editingNote){const l=await w.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:n,description:s,dtstart:i});e.state.editingNote=l.note,e.state.selectedNoteKey=_(l.note.instanceId,l.note.uri),e.setFlash("success",ee("Note",l.note.summary||n,"saved"))}await Aa(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ge(e){const t=await w.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const a=new Set(e.state.tasks.map(n=>_(n.instanceId,n.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(n=>a.has(n)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(n=>`${n.instanceId}|${n.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function Es(e,t){const a=new Map;for(const g of t)g.uid&&a.set(g.uid,g);const n=new Map(t.map((g,b)=>[_(g.instanceId,g.uri),b])),s=new Map,r=[];for(const g of t){const b=g.parentUid;if(b&&a.has(b)&&b!==g.uid){const v=s.get(b)??[];v.push(g),s.set(b,v)}else r.push(g)}const i=(g,b)=>(n.get(_(g.instanceId,g.uri))??0)-(n.get(_(b.instanceId,b.uri))??0);r.sort(i);for(const[,g]of s)g.sort(i);const l=[],d=new Set,u=(g,b)=>{const v=g.uid||_(g.instanceId,g.uri);if(!d.has(v)){d.add(v),l.push({task:g,depth:Math.min(b,8)});for(const S of s.get(g.uid)??[])u(S,b+1);d.delete(v)}};for(const g of r)u(g,0);for(const g of t)l.some(b=>b.task===g)||l.push({task:g,depth:0});return l}function Ps(e,t){const a=new Set([t]);if(!t)return a;let n=!0;for(;n;){n=!1;for(const s of e.state.tasks)s.parentUid&&a.has(s.parentUid)&&s.uid&&!a.has(s.uid)&&(a.add(s.uid),n=!0)}return a}function Ts(e,t,a){const n=t.instanceId,s=a||!t.uid?new Set:Ps(e,t.uid),r=e.state.tasks.filter(d=>d.uid&&d.instanceId===n&&!s.has(d.uid)&&d.uid!==t.uid),i=t.parentUid||"",l=['<option value="">None (top-level)</option>',...r.map(d=>`<option value="${c(d.uid)}" ${d.uid===i?"selected":""}>${c(d.summary||d.uid)}</option>`)];if(i&&!r.some(d=>d.uid===i)){const d=e.state.tasks.find(u=>u.uid===i);l.push(`<option value="${c(i)}" selected>${c((d==null?void 0:d.summary)||i)} (current)</option>`)}return l.join("")}function Ua(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(a=>t.has(_(a.instanceId,a.uri))&&a.canWrite&&!a.readOnly)}function As(e){const t=o=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[o]||o,a=Es(e,e.state.tasks),n=e.state.tasks.filter(o=>o.canWrite&&!o.readOnly).map(o=>_(o.instanceId,o.uri)),s=n.length>0&&n.every(o=>e.state.checkedTaskKeys.includes(o)),r=e.state.checkedTaskKeys.length>0,l=Ua(e).length,d=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:a.map(({task:o,depth:m})=>{const p=_(o.instanceId,o.uri),$=!e.state.creatingTask&&p===e.state.selectedTaskKey?" is-selected":"",y=e.state.checkedTaskKeys.includes(p),f=o.status==="COMPLETED"?"badge-ok":o.status==="CANCELLED"?"":"badge-admin",k=m>0?` style="--task-depth:${m}"`:"",A=m>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",F=o.canWrite&&!o.readOnly;return`<tr class="contact-table-row task-row${m>0?" is-subtask":""}${$}${y?" is-checked":""}" data-action="select-task" data-instance="${o.instanceId}" data-uri="${c(o.uri)}" tabindex="0" role="button"${k}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${o.instanceId}" data-uri="${c(o.uri)}"
                  ${y?"checked":""} ${F?"":"disabled"} aria-label="Select ${c(o.summary||o.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${A}<span class="contact-name-primary">${c(o.summary||o.uri)}</span></span>
                ${o.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${f}">${c(t(o.status))}</span></td>
              <td class="col-task-due muted small">${c(pa(o.due))}</td>
              <td class="col-task-cal muted small">${c(o.calendarName)}</td>
              <td class="col-task-pct muted small">${o.percent?c(String(o.percent))+"%":"—"}</td>
            </tr>`}).join(""),u=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,g=(o,m)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${o}"
      title="${c(m)}" aria-label="${c(m)}" ${e.state.busy||l===0?"disabled":""}>${u}</button>`,b=r?`<div class="bulk-bar" style="margin-top:0.75rem">
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
              ${g("bulk-task-status","Apply status")}
            </div>
            <div class="bulk-group bulk-group-due">
              ${e.renderPortalDateTimeField({field:"bulk-due",name:"bulkDue",label:"Due",value:e.state.bulkDueValue,dateOnly:!1,disabled:e.state.busy||l===0,allowClear:!0})}
              ${g("bulk-task-due","Apply due")}
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${e.state.busy||l===0?"disabled":""} title="Clear due date">Clear due</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field bulk-field-pct">%
                <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${e.state.busy||l===0?"disabled":""} />
              </label>
              ${g("bulk-task-percent","Apply %")}
            </div>
          </div>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${e.state.busy||l===0?"disabled":""}>Delete</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${e.state.busy?"disabled":""}>Clear selection</button>
          </div>
        </div>`:"",v=e.state.editingTask,S=e.state.taskCalendars.map(o=>`<option value="${o.id}" ${v&&v.instanceId===o.id?"selected":""}>${c(o.displayname)}</option>`).join(""),E=v?`<div class="card">
          ${x(e.state.creatingTask?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${e.state.creatingTask?`<label>Calendar
                    <select name="instanceId" required ${e.state.taskCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.taskCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${S}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${c(v.calendarName)}</strong>${v.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(v.summary)}" ${v.readOnly&&!e.state.creatingTask?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${v.readOnly&&!e.state.creatingTask?"readonly":""}>${c(v.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${v.readOnly&&!e.state.creatingTask?"disabled":""}>
                ${Ts(e,v,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${v.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(o=>`<option value="${o}" ${v.status===o?"selected":""}>${c(t(o))}</option>`).join("")}
                </select>
              </label>
              ${e.renderPortalDateTimeField({field:"due",name:"due",label:"Due",value:$e(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!e.state.creatingTask),allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${c(String(v.priority||0))}" ${v.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${c(String(v.percent||0))}" ${v.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
            </div>
            <div class="form-actions-row">
              ${e.state.creatingTask||v.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingTask?"Create task":"Save task"}</button>`:""}
              ${!e.state.creatingTask&&v.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${e.state.busy?"disabled":""}>Add subtask</button>
                     <button type="button" class="btn btn-danger" data-action="delete-task" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingTask?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${x("Tasks","tasks")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(e.state.taskSearch)}" aria-label="Search tasks" ${e.state.busy?"disabled":""} />
        <button type="button" class="btn btn-primary" data-action="new-task" ${e.state.busy||e.state.taskCalendars.length===0?"disabled":""}>Add task</button>
      </div>
      ${b}
      ${e.state.taskCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-task-check">
                <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                  ${s?"checked":""} ${n.length===0||e.state.busy?"disabled":""} />
              </th>
              ${Y("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${Y("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${Y("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${Y("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${Y("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${d}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${E}
    </section>
  </div>`}function Us(e,t){if(!e.state.editingTask)return;const a=new FormData(t),n=String(a.get("due")??"").trim(),s=a.get("instanceId"),r=s!==null&&String(s)!==""?Number(s):e.state.editingTask.instanceId,i=String(a.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(r)&&r>0?r:e.state.editingTask.instanceId,summary:String(a.get("summary")??e.state.editingTask.summary),description:String(a.get("description")??e.state.editingTask.description),status:String(a.get("status")??e.state.editingTask.status),due:n?new Date(n).toISOString():null,priority:Number(a.get("priority")??e.state.editingTask.priority??0),percent:Number(a.get("percent")??e.state.editingTask.percent??0),parentUid:i===""?null:i}}async function Fs(e,t){var r,i;const a=Ua(e);if(a.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const n=a.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(t==="bulk-task-delete"){if(!confirm(`Delete ${a.length} task${a.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;e.state.busy=!0,e.clearFlash(),e.render();try{const l=await w.bulkTasks({op:"delete",items:n});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&a.some(d=>_(d.instanceId,d.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await Ge(e),l.failed>0?e.setFlash("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let s={};if(t==="bulk-task-status"){const l=e.root.querySelector("#bulk-task-status"),d=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(!d){e.setFlash("error","Choose a status to apply"),e.render();return}s={status:d}}else if(t==="bulk-task-due"){const l=e.state.bulkDueValue.trim();if(!l){e.setFlash("error","Choose a due date to apply"),e.render();return}const d=/^\d{4}-\d{2}-\d{2}$/.test(l)?new Date(l+"T00:00:00"):new Date((l.length===16,l));if(Number.isNaN(d.getTime())){e.setFlash("error","Invalid due date"),e.render();return}s={due:d.toISOString()}}else if(t==="bulk-task-clear-due")s={due:null};else if(t==="bulk-task-percent"){const l=e.root.querySelector("#bulk-task-percent"),d=((i=l==null?void 0:l.value)==null?void 0:i.trim())??"";if(d===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const u=Number(d);if(!Number.isFinite(u)||u<0||u>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}s={percent:Math.round(u)}}e.state.busy=!0,e.clearFlash(),e.render();try{const l=await w.bulkTasks({op:"update",items:n,fields:s});if(await Ge(e),e.state.editingTask&&!e.state.creatingTask){const u=_(e.state.editingTask.instanceId,e.state.editingTask.uri),g=e.state.tasks.find(b=>_(b.instanceId,b.uri)===u);g&&(e.state.editingTask={...g})}const d=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";l.failed>0?e.setFlash("error",`Updated ${d} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Updated ${d} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function Is(e,t){const a=new FormData(t),n=String(a.get("summary")??"").trim(),s=String(a.get("description")??"").trim(),r=String(a.get("status")??"NEEDS-ACTION"),i=String(a.get("due")??"").trim(),l=i?new Date(i).toISOString():null,d=Number(a.get("priority")??0),u=Number(a.get("percent")??0),g=String(a.get("parentUid")??"").trim(),b=g===""?null:g;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const v=Number(a.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const S=await w.createTask({instanceId:v,summary:n,description:s,status:r,due:l,priority:d,percent:u,parentUid:b});e.state.creatingTask=!1,e.state.selectedTaskKey=_(S.task.instanceId,S.task.uri),e.state.editingTask=S.task,e.setFlash("success",ee(b?"Subtask":"Task",S.task.summary||n,"created"))}else if(e.state.editingTask){const v=await w.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:n,description:s,status:r,due:l,priority:d,percent:u,parentUid:b});e.state.editingTask=v.task,e.state.selectedTaskKey=_(v.task.instanceId,v.task.uri),e.setFlash("success",ee("Task",v.task.summary||n,"saved"))}await Ge(e)}catch(v){e.setFlash("error",v instanceof Error?v.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ot(e,t){const a=await w.contacts(t,e.state.contactSearch);e.state.contacts=a.contacts,e.state.selectedContactUri!==null&&!e.state.contacts.some(n=>n.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function Os(e,t){if(e.state.selectedAbId===null)return;const a=await w.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const n=a.contact;e.state.editingContact={...n,emails:Array.isArray(n.emails)?n.emails:[],phones:Array.isArray(n.phones)?n.phones:[],custom:Array.isArray(n.custom)?n.custom:[],address:n.address??Fa(),birthday:n.birthday??null},e.state.photoPreview=n.photoDataUri??(n.hasPhoto&&e.state.selectedAbId!==null?`${w.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function Ns(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function Fa(e){return{street:"",city:"",region:"",postal:"",country:""}}function Ms(e,t){return new Promise((a,n)=>{const s=new FileReader;s.onload=()=>{const r=String(s.result??""),i=r.indexOf(",");a(i>=0?r.slice(i+1):r)},s.onerror=()=>n(new Error("Failed to read photo file")),s.readAsDataURL(t)})}function xs(e){const t=e.root.querySelector('input[data-action="contact-photo"]');t&&t.addEventListener("change",()=>{(async()=>{var n;const a=(n=t.files)==null?void 0:n[0];if(t.value="",!!a){if(a.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const s=await Ms(e,a);e.state.photoBase64Pending=s,e.state.photoPreview=`data:${a.type||"image/jpeg"};base64,${s}`,e.state.removePhotoPending=!1,e.render()}catch(s){e.setFlash("error",s instanceof Error?s.message:"Failed to read photo"),e.render()}}})()})}function he(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const a=new FormData(t);e.state.editingContact.firstname=String(a.get("firstname")??""),e.state.editingContact.lastname=String(a.get("lastname")??""),e.state.editingContact.fullname=String(a.get("fullname")??""),e.state.editingContact.org=String(a.get("org")??""),e.state.editingContact.title=String(a.get("title")??""),e.state.editingContact.url=String(a.get("url")??""),e.state.editingContact.note=String(a.get("note")??"");const n=String(a.get("birthday")??"").trim();e.state.editingContact.birthday=n&&/^\d{4}-\d{2}-\d{2}/.test(n)?n.slice(0,10):null,e.state.editingContact.address={street:String(a.get("street")??""),city:String(a.get("city")??""),region:String(a.get("region")??""),postal:String(a.get("postal")??""),country:String(a.get("country")??"")};const s=[];let r=0;for(;a.has(`email_${r}`);)s.push(String(a.get(`email_${r}`)??"")),r++;s.length&&(e.state.editingContact.emails=s);const i=[];for(r=0;a.has(`phone_value_${r}`);)i.push({type:String(a.get(`phone_type_${r}`)??"other"),value:String(a.get(`phone_value_${r}`)??"")}),r++;i.length&&(e.state.editingContact.phones=i);const l=[];for(r=0;a.has(`custom_label_${r}`)||a.has(`custom_value_${r}`);)l.push({label:String(a.get(`custom_label_${r}`)??""),value:String(a.get(`custom_value_${r}`)??"")}),r++;e.state.editingContact.custom=l}function Ls(e,t){const a=new FormData(t),n=[];let s=0;for(;a.has(`email_${s}`);){const d=String(a.get(`email_${s}`)??"").trim();d&&n.push(d),s++}const r=[];for(s=0;a.has(`phone_value_${s}`);){const d=String(a.get(`phone_value_${s}`)??"").trim();d&&r.push({type:String(a.get(`phone_type_${s}`)??"other"),value:d}),s++}const i=[];for(s=0;a.has(`custom_label_${s}`)||a.has(`custom_value_${s}`);){const d=String(a.get(`custom_label_${s}`)??"").trim(),u=String(a.get(`custom_value_${s}`)??"").trim();(d||u)&&i.push({label:d,value:u}),s++}const l={firstname:String(a.get("firstname")??"").trim(),lastname:String(a.get("lastname")??"").trim(),fullname:String(a.get("fullname")??"").trim(),org:String(a.get("org")??"").trim(),title:String(a.get("title")??"").trim(),emails:n,phones:r,address:{street:String(a.get("street")??"").trim(),city:String(a.get("city")??"").trim(),region:String(a.get("region")??"").trim(),postal:String(a.get("postal")??"").trim(),country:String(a.get("country")??"").trim()},url:String(a.get("url")??"").trim(),note:String(a.get("note")??"").trim(),birthday:(()=>{const d=String(a.get("birthday")??"").trim();return d&&/^\d{4}-\d{2}-\d{2}/.test(d)?d.slice(0,10):null})(),custom:i};return e.state.removePhotoPending?l.removePhoto=!0:e.state.photoBase64Pending&&(l.photoBase64=e.state.photoBase64Pending),l}async function _s(e,t){var s;if(e.state.selectedAbId===null)return;const a=(s=t.files)==null?void 0:s[0];if(t.value="",!a)return;const n=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:a.name,fileSizeLabel:Ke(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const r=await e.readFileTextWithProgress(a,d=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:d};const u=e.root.querySelector(".import-progress-bar"),g=e.root.querySelector("[data-import-status-line]");u&&d!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${d}%`),g&&d!==null&&(g.textContent=`Reading file… ${d}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),h.event("import.contacts.start",{file:a.name,bytes:a.size,abId:n});const i=await w.importAddressBook(n,r,d=>{e.applyServerImportProgress(d)}),l=e.formatImportResult(i);await e.loadHome(),e.state.selectedAbId===n&&await Ot(e,n),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${l} (from “${a.name}”)`}),e.setFlash("success",`Import finished for “${a.name}”: ${l}.`)}catch(r){const i=r instanceof Error?r.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:i}),e.setFlash("error",i)}finally{e.state.busy=!1,e.render()}}async function qs(e,t){if(e.state.selectedAbId===null)return;const a=Ls(e,t),n=lt(a);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const s=await w.createContact(e.state.selectedAbId,a);e.state.creatingContact=!1,e.state.selectedContactUri=s.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ee("Contact",lt(s.contact)||n,"created"))}else if(e.state.selectedContactUri){const s=await w.updateContact(e.state.selectedAbId,e.state.selectedContactUri,a);e.state.selectedContactUri=s.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ee("Contact",lt(s.contact)||n,"saved"))}try{await e.loadHome()}catch(s){if(console.error(s),e.state.selectedAbId!==null)try{await Ot(e,e.state.selectedAbId)}catch{}}}catch(s){e.setFlash("error",s instanceof Error?s.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Rs(e,t){const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??"").trim();if(n){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await w.createAddressBook({displayname:n,description:s});e.state.selectedAbId=r.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${r.addressbook.displayname}” created`)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function Bs(e,t){if(e.state.selectedAbId===null)return;const a=new FormData(t),n=String(a.get("displayname")??"").trim(),s=String(a.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await w.updateAddressBook(e.state.selectedAbId,{displayname:n,description:s}),await e.loadHome(),e.setFlash("success",ee("Address book",n,"updated"))}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function Vs(e){const{state:t}=e,a=t.addressBooks.map(p=>`<div class="cal-row${p.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${p.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${c(p.displayname)}</span>
          <span class="muted small">${p.cardCount} contact${p.cardCount===1?"":"s"}</span>
          <span class="muted small mono cal-row-uri">${c(p.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${p.id}" ${t.busy?"disabled":""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${p.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${p.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`).join(""),n=t.addressBooks.find(p=>p.id===t.selectedAbId)??null,s=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map(p=>{const $=!t.creatingContact&&p.uri===t.selectedContactUri?" is-selected":"",y=c((p.displayname||"?").slice(0,1).toUpperCase()),f=p.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${c(w.contactPhotoUrl(t.selectedAbId,p.uri))}" alt="" loading="lazy" data-avatar-fallback="${y}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${y}</span>`;return`<tr class="contact-table-row${$}" data-action="select-contact" data-uri="${c(p.uri)}" tabindex="0" role="button">
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${f}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${c(p.displayname)}</span>
                    ${p.org?`<span class="muted small contact-name-secondary">${c(p.org)}</span>`:""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${c(p.email||"—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${c(p.phone||"—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c(p.org||"—")}</span></td>
            </tr>`}).join(""),r=t.editingContact,i=Array.isArray(r==null?void 0:r.emails)&&r.emails.length>0?r.emails:[""],l=Array.isArray(r==null?void 0:r.phones)&&r.phones.length>0?r.phones:[{type:"cell",value:""}],d=(r==null?void 0:r.address)??e.emptyAddress(),u=i.map((p,$)=>`<div class="multi-row" data-multi="email" data-idx="${$}">
        <input type="email" name="email_${$}" value="${c(p??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${$}" ${i.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),g=l.map((p,$)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${$}">
        <select name="phone_type_${$}" aria-label="Phone type">
          ${["cell","work","home","other"].map(y=>`<option value="${y}" ${((p==null?void 0:p.type)??"other")===y?"selected":""}>${y}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${$}" value="${c((p==null?void 0:p.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${$}" ${l.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),b=Array.isArray(r==null?void 0:r.custom)?r.custom:[],v=b.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':b.map((p,$)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${$}">
              <input type="text" name="custom_label_${$}" value="${c(p.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${$}" value="${c(p.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${$}" title="Remove">×</button>
            </div>`).join(""),S=t.contactModalOpen&&r&&n?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
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
                    ${t.photoPreview?`<img src="${c(t.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((r.fullname||r.firstname||"?").slice(0,1).toUpperCase())}</span>`}
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
                    <input type="text" name="firstname" value="${c(r.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${c(r.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${c(r.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${c(r.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${c(r.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${u}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${i.length>=10?"disabled":""}>+ Email</button>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend>Phones</legend>
                    ${g}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${l.length>=10?"disabled":""}>+ Phone</button>
                  </fieldset>
                </div>
                <fieldset class="fieldset fieldset-address">
                  <legend>Address</legend>
                  <label>Street
                    <input type="text" name="street" value="${c(d.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${c(d.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${c(d.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${c(d.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${c(d.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${c(r.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${e.renderPortalDateTimeField({field:"birthday",name:"birthday",label:"Birthday",value:r.birthday||"",dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${v}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${b.length>=30?"disabled":""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${c(r.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>${t.creatingContact?"Create contact":"Save contact"}</button>
                  ${!t.creatingContact&&r.uri?`<button type="button" class="btn" data-action="export-contact" ${t.busy?"disabled":""}>Export .vcf</button>`:""}
                  ${t.creatingContact?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${t.busy?"disabled":""}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${t.busy?"disabled":""}>Cancel</button>
                  ${!t.creatingContact&&r.uri?`<span class="muted small mono">${c(r.uri)}</span>`:""}
                </div>
              </form>
            </div>
          </div>
        </div>`:"",E=t.abModalOpen&&n?N({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${c(n.uri)} · ${n.cardCount} contact${n.cardCount===1?"":"s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${c(n.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(n.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${c(n.uri)}</span>
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
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",o=t.deleteAbConfirmId!==null?t.addressBooks.find(p=>p.id===t.deleteAbConfirmId)??null:null,m=o?N({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${c(o.displayname)}</strong>
              <span class="muted small mono">(${c(o.uri)})</span>.</p>
            <p class="muted small">${(o.cardCount??0)>0?`All ${o.cardCount} contact${o.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${Xe({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${o.id}"`}]}):"";return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${x("Address books","address-books")}
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
                  ${x("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${c(t.contactSearch)}" aria-label="Search contacts" ${t.busy?"disabled":""} />
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
    ${m}
    ${E}
    ${S}`}function Nt(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function Ia(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function Mt(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),a=t[1]??"overview",n=Ia(a)??"overview";let s=null;if(n==="users"&&t[2])try{s=decodeURIComponent(t[2])}catch{s=t[2]}return{tab:"admin",adminPage:n,adminUsername:s}}return{tab:Nt(e),adminPage:null,adminUsername:null}}function Hs(){const e=Mt().tab;if(e)return e;try{const t=Nt(sessionStorage.getItem(sa));if(t)return t}catch{}return"calendars"}function zs(){const e=Mt().adminPage;if(e)return e;try{const t=Ia(sessionStorage.getItem(ra));if(t)return t}catch{}return"overview"}function js(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function ot(e,t="overview",a=null){try{sessionStorage.setItem(sa,e),e==="admin"&&sessionStorage.setItem(ra,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const n=e==="admin"?js(t,a):`#${e}`;location.hash!==n&&history.replaceState(null,"",`${location.pathname}${location.search}${n}`)}function Gt(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(e)}</span>`}function ct(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function Ks(e){const{state:t,root:a}=e;if(!t.user){e.renderLogin();return}let n;switch(t.activeTab){case"calendars":n=Yt(e);break;case"contacts":n=Vs(e);break;case"tasks":n=e.renderTasksTab();break;case"notes":n=e.renderNotesTab();break;case"files":n=e.renderFilesTab();break;case"admin":n=e.renderAdminSection();break;default:n=Yt(e)}const s=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",r=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
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
            data-info="${s}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;a.innerHTML=e.shell(n,{tabs:r}),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesUploadConflict!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}async function Qt(e,t){var g,b,v,S,E;const{state:a,root:n,render:s,setFlash:r,clearFlash:i}=e,l=t.target.closest("[data-action]");if(!l)return;const d=l.dataset.action;if(d&&h.debug(`action:${d}`,{id:l.dataset.id,tab:l.dataset.tab,uri:l.dataset.uri}),d==="close-import-progress"){a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")&&e.closeImportProgress();return}if(d==="logout"){a.busy=!0,h.event("logout");try{await w.logout()}catch{}e.clearPortalSessionState(),i(),s();return}if(d==="select-cal"||d==="toggle-cal"){const o=Number(l.dataset.id);if(!Number.isFinite(o))return;e.toggleCalendarSelected(o),a.busy=!0,i(),s();try{await e.loadMonthEvents()}catch(m){r("error",m instanceof Error?m.message:"Failed to load calendar")}finally{a.busy=!1,s()}return}if(d==="edit-cal"){const o=Number(l.dataset.id);if(!Number.isFinite(o)||!a.calendars.find(p=>p.id===o&&p.canShare))return;a.selectedId=o,a.selectedIds.includes(o)||(a.selectedIds=[...a.selectedIds,o]),a.calModalOpen=!0,a.deleteConfirmId=null,a.busy=!0,i(),s();try{await e.loadShares(o),await e.loadMonthEvents()}catch(p){r("error",p instanceof Error?p.message:"Failed to open calendar")}finally{a.busy=!1,s()}return}if(d==="close-cal-modal"){a.calModalOpen=!1,s();return}if(d==="open-create-cal-modal"){a.createCalModalOpen=!0,a.calModalOpen=!1,a.deleteConfirmId=null,i(),s();return}if(d==="close-create-cal-modal"){a.createCalModalOpen=!1,i(),s();return}if(d==="delete-cal"){const o=Number(l.dataset.id);if(!Number.isFinite(o)||!a.calendars.find(p=>p.id===o&&p.canShare))return;a.deleteConfirmId=o,a.calModalOpen=!1,i(),s();return}if(d==="cancel-delete-cal"){a.deleteConfirmId=null,s();return}if(d==="confirm-delete-cal"){const o=Number(l.dataset.id),m=n.querySelector("#delete-cal-confirm");if(!Number.isFinite(o)||!(m!=null&&m.checked))return;a.busy=!0,i(),s();try{if(await w.deleteCalendar(o),a.selectedId===o&&(a.selectedId=null),a.selectedIds=a.selectedIds.filter(p=>p!==o),a.deleteConfirmId=null,a.calModalOpen=!1,a.shares=[],a.monthEvents=[],await e.loadHome(),a.selectedId===null){const p=e.pickDefaultCalendar();p?(a.selectedId=p.id,a.selectedIds.includes(p.id)||(a.selectedIds=[...a.selectedIds,p.id]),await e.loadMonthEvents()):a.selectedIds.length>0&&(a.selectedId=a.selectedIds[0],await e.loadMonthEvents())}r("success","Calendar deleted")}catch(p){r("error",p instanceof Error?p.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="month-today"){const o=new Date;a.monthCursor={y:o.getFullYear(),m:o.getMonth()},a.monthExpandDay=null,a.busy=!0,s();try{await e.loadMonthEvents()}finally{a.busy=!1,s()}return}if(d==="month-prev"||d==="month-next"){const o=d==="month-prev"?-1:1,m=new Date(a.monthCursor.y,a.monthCursor.m+o,1);a.monthCursor={y:m.getFullYear(),m:m.getMonth()},a.monthExpandDay=null,a.busy=!0,s();try{await e.loadMonthEvents()}finally{a.busy=!1,s()}return}if(d==="open-event"){t.stopPropagation();const o=Number(l.dataset.instance),m=l.dataset.uri??"";if(!Number.isFinite(o)||!m)return;a.busy=!0,i(),s();try{const p=await w.getEvent(o,m);a.editingEvent={...p.event,repeat:p.event.repeat??e.defaultRepeat()},a.creatingEvent=!1,a.eventModalOpen=!0,a.eventDtPicker=null,a.calModalOpen=!1,a.deleteConfirmId=null}catch(p){r("error",p instanceof Error?p.message:"Failed to open event")}finally{a.busy=!1,s()}return}if(d==="open-event-day"){t.stopPropagation();const o=l.dataset.day??"";a.monthExpandDay=a.monthExpandDay===o?null:o,s();return}if(d==="new-event-day"){const o=t.target;if((g=o==null?void 0:o.closest)!=null&&g.call(o,".month-event, .month-event-more"))return;const m=l.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(m))return;if(a.selectedId===null){r("error","Select a calendar first"),s();return}const p=a.calendars.find($=>$.id===a.selectedId);if(!p||p.readOnly||!(p.canShare||p.access==="readwrite")){r("error","This calendar is read-only"),s();return}a.creatingEvent=!0,a.editingEvent=e.blankEventForDay(m,a.selectedId),a.eventModalOpen=!0,a.eventDtPicker=null,a.calModalOpen=!1,a.deleteConfirmId=null,i(),s();return}if(d==="close-event-modal"){a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,i(),s();return}function u(){const o=n.querySelector('[data-form="edit-event"]');o&&a.editingEvent&&e.syncEditingEventFromForm(o);const m=n.querySelector('[data-form="task"]');m&&a.editingTask&&e.syncEditingTaskFromForm(m);const p=n.querySelector('[data-form="note"]');p&&a.editingNote&&e.syncEditingNoteFromForm(p),a.editingContact&&he(e.contactsHost)}if(d==="dt-open"){const o=l.dataset.dtField||"";if(!o)return;if(u(),((b=a.eventDtPicker)==null?void 0:b.field)===o)a.eventDtPicker=null;else{const m=l.dataset.dtDateOnly==="1",p=l.dataset.dtClear!=="0",$=l.dataset.dtName||o;let y=e.getDtFieldCurrentValue(o);!y&&(o==="due"||o==="dtstart"||o==="bulk-due")&&(y=Pe().start);const f=ge(y||L(new Date)),[k,A]=f.date.split("-").map(Number);a.eventDtPicker={field:o,viewY:k,viewM:(A||1)-1,dateOnly:m,allowClear:p,name:$}}s();return}if(d==="dt-month-prev"||d==="dt-month-next"){if(!a.eventDtPicker)return;u();const o=d==="dt-month-prev"?-1:1,m=new Date(a.eventDtPicker.viewY,a.eventDtPicker.viewM+o,1);a.eventDtPicker={...a.eventDtPicker,viewY:m.getFullYear(),viewM:m.getMonth()},s();return}if(d==="dt-set-month"){if(!a.eventDtPicker)return;u();const m=Number(l.value);if(!Number.isFinite(m)||m<0||m>11)return;a.eventDtPicker={...a.eventDtPicker,viewM:m},s();return}if(d==="dt-set-year"){if(!a.eventDtPicker)return;u();const m=Number(l.value);if(!Number.isFinite(m)||m<1||m>9999)return;a.eventDtPicker={...a.eventDtPicker,viewY:m},s();return}if(d==="dt-pick-day"){if(!a.eventDtPicker)return;const o=a.eventDtPicker.field,m=l.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(m))return;u();const p=a.eventDtPicker.dateOnly;if(p)e.setDtFieldValue(o,m),a.eventDtPicker=null;else{const $=e.getDtFieldCurrentValue(o),y=ge($||Pe(m).start).hm;e.setDtFieldValue(o,`${m}T${y}`),a.eventDtPicker={...a.eventDtPicker,viewY:Number(m.slice(0,4)),viewM:Number(m.slice(5,7))-1}}if(o==="start"&&a.editingEvent&&!p&&a.editingEvent.end){const $=new Date(String(a.editingEvent.start)),y=new Date(String(a.editingEvent.end));!Number.isNaN($.getTime())&&!Number.isNaN(y.getTime())&&y<=$&&e.setDtFieldValue("end",G(new Date($.getTime()+3600*1e3)))}s();return}if(d==="dt-pick-time"){if(!a.eventDtPicker||a.eventDtPicker.dateOnly)return;const o=a.eventDtPicker.field,m=l.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(m))return;u();const p=e.getDtFieldCurrentValue(o)||Pe().start,y=`${ge(p).date}T${m}`;if(e.setDtFieldValue(o,y),o==="start"&&a.editingEvent){a.editingEvent={...a.editingEvent,allDay:!1};const f=a.editingEvent.end?ge(String(a.editingEvent.end)):null,k=new Date(y);(!f||new Date(`${f.date}T${f.hm}`)<=k)&&e.setDtFieldValue("end",G(new Date(k.getTime()+3600*1e3)))}a.eventDtPicker=null,s();return}if(d==="dt-today"){if(!a.eventDtPicker)return;const o=a.eventDtPicker.field;u();const m=L(new Date);if(a.eventDtPicker.dateOnly)e.setDtFieldValue(o,m);else{const p=Pe(m);o==="start"?(e.setDtFieldValue("start",p.start),a.editingEvent&&!a.editingEvent.end&&e.setDtFieldValue("end",p.end)):o==="end"?e.setDtFieldValue("end",p.end):e.setDtFieldValue(o,p.start)}a.eventDtPicker=null,s();return}if(d==="dt-clear"){if(!a.eventDtPicker||!a.eventDtPicker.allowClear)return;const o=a.eventDtPicker.field;u(),e.setDtFieldValue(o,null),a.eventDtPicker=null,s();return}if(d==="event-allday-toggle"){if(!a.editingEvent)return;const o=n.querySelector('[data-form="edit-event"]'),m=l.checked;if(o){const p=new FormData(o),$=String(p.get("start")??a.editingEvent.start??""),y=String(p.get("end")??a.editingEvent.end??"")||null;let f=$,k=y;if(m){const A=ts($,y);f=A.start,k=A.end}else{const A=$.slice(0,10),F=(y||$).slice(0,10),O=Ut(A,F);f=O.start,k=O.end}a.editingEvent={...a.editingEvent,summary:String(p.get("summary")??a.editingEvent.summary),description:String(p.get("description")??a.editingEvent.description),location:String(p.get("location")??a.editingEvent.location),instanceId:Number(p.get("instanceId"))||a.editingEvent.instanceId,allDay:m,start:f,end:k,repeat:Fe(p)}}else a.editingEvent={...a.editingEvent,allDay:m};a.eventDtPicker=null,s();return}if(d==="event-repeat-freq"||d==="event-repeat-end"){if(!a.editingEvent)return;const o=n.querySelector('[data-form="edit-event"]');if(!o)return;const m=new FormData(o),p=o.querySelector('input[name="allDay"]'),$=Fe(m);a.editingEvent={...a.editingEvent,summary:String(m.get("summary")??a.editingEvent.summary),description:String(m.get("description")??a.editingEvent.description),location:String(m.get("location")??a.editingEvent.location),instanceId:Number(m.get("instanceId"))||a.editingEvent.instanceId,allDay:(p==null?void 0:p.checked)??a.editingEvent.allDay,start:String(m.get("start")??a.editingEvent.start??""),end:String(m.get("end")??a.editingEvent.end??"")||null,repeat:$,hasRrule:!!String(m.get("repeatFreq")??"").trim()},$.freq&&$.endMode==="until"&&((v=a.eventDtPicker)==null?void 0:v.field)==="end"&&(a.eventDtPicker=null),s();return}if(d==="delete-event"){if(!a.editingEvent||!a.editingEvent.canWrite||a.creatingEvent||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const o=a.editingEvent.instanceId,m=a.editingEvent.uri;a.busy=!0,i(),s();try{await w.deleteEvent(o,m),a.eventModalOpen=!1,a.editingEvent=null,await e.loadMonthEvents(),r("success","Event deleted")}catch(p){r("error",p instanceof Error?p.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="info"){const o=l.dataset.info??"";e.openInfoModal(o);return}if(d==="info-close"){e.closeInfoModal();return}if(d==="flash-close"){i(),s();return}if(d==="user-menu-toggle"){t.stopPropagation(),a.userMenuOpen=!a.userMenuOpen,s();return}if(d==="user-menu-close"){a.userMenuOpen&&(a.userMenuOpen=!1,s());return}if(d==="tab"){const o=Nt(l.dataset.tab);o&&(o==="admin"&&(a.adminPage="overview"),await e.activateTab(o));return}if(!(d&&d.startsWith("admin-")&&await Yn(e.adminHost,d,l))&&!(d&&(d.startsWith("files-")||d==="close-files-upload-progress")&&await Dn(e.filesHost,d,l,t))){if(d==="sort-task"||d==="sort-note"){const o=l.dataset.sort||"";if(!o)return;if(d==="sort-task"){a.taskSort===o?a.taskOrder=a.taskOrder==="asc"?"desc":"asc":(a.taskSort=o,a.taskOrder=o==="due"||o==="summary"?"asc":"desc"),a.busy=!0,s();try{await e.loadTasks()}catch(m){r("error",m instanceof Error?m.message:"Sort failed")}finally{a.busy=!1,s()}}else{a.noteSort===o?a.noteOrder=a.noteOrder==="asc"?"desc":"asc":(a.noteSort=o,a.noteOrder="asc"),a.busy=!0,s();try{await e.loadNotes()}catch(m){r("error",m instanceof Error?m.message:"Sort failed")}finally{a.busy=!1,s()}}return}if(d==="select-task"){if(t.target.closest("[data-stop-row], .task-check"))return;const o=Number(l.dataset.instance),m=l.dataset.uri??"";if(!Number.isFinite(o)||!m)return;const p=a.tasks.find($=>$.instanceId===o&&$.uri===m)??null;a.creatingTask=!1,a.selectedTaskKey=e.itemKey(o,m),a.editingTask=p?{...p}:null,i(),s();return}if(d==="task-check"){t.preventDefault(),t.stopPropagation();const o=Number(l.dataset.instance),m=l.dataset.uri??"";if(!Number.isFinite(o)||!m)return;const p=e.itemKey(o,m),$=a.tasks.find(y=>e.itemKey(y.instanceId,y.uri)===p);if(!$||!$.canWrite||$.readOnly)return;a.checkedTaskKeys.includes(p)?a.checkedTaskKeys=a.checkedTaskKeys.filter(y=>y!==p):a.checkedTaskKeys=[...a.checkedTaskKeys,p],s();return}if(d==="task-select-all"){t.preventDefault();const o=a.tasks.filter(p=>p.canWrite&&!p.readOnly);o.length>0&&o.every(p=>a.checkedTaskKeys.includes(e.itemKey(p.instanceId,p.uri)))?a.checkedTaskKeys=[]:a.checkedTaskKeys=o.map(p=>e.itemKey(p.instanceId,p.uri)),s();return}if(d==="bulk-task-clear"){a.checkedTaskKeys=[],s();return}if(d==="bulk-task-status"||d==="bulk-task-due"||d==="bulk-task-clear-due"||d==="bulk-task-percent"||d==="bulk-task-delete"){e.runBulkTaskAction(d);return}if(d==="select-note"){const o=Number(l.dataset.instance),m=l.dataset.uri??"";if(!Number.isFinite(o)||!m)return;const p=a.notes.find($=>$.instanceId===o&&$.uri===m)??null;a.creatingNote=!1,a.selectedNoteKey=e.itemKey(o,m),a.editingNote=p?{...p}:null,i(),s();return}if(d==="new-task"){a.creatingTask=!0,a.selectedTaskKey=null,a.editingTask={uri:"",instanceId:((S=a.taskCalendars[0])==null?void 0:S.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},i(),s();return}if(d==="new-subtask"){if(!a.editingTask||a.creatingTask||!a.editingTask.uid||!a.editingTask.canWrite)return;const o=a.editingTask;a.creatingTask=!0,a.selectedTaskKey=null,a.editingTask={uri:"",instanceId:o.instanceId,calendarId:o.calendarId,calendarName:o.calendarName,calendarUri:o.calendarUri,uid:"",parentUid:o.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},i(),s();return}if(d==="new-note"){a.creatingNote=!0,a.selectedNoteKey=null,a.editingNote={uri:"",instanceId:((E=a.noteCalendars[0])==null?void 0:E.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},i(),s();return}if(d==="cancel-task"){a.creatingTask=!1,a.editingTask=null,a.selectedTaskKey=null,s();return}if(d==="cancel-note"){a.creatingNote=!1,a.editingNote=null,a.selectedNoteKey=null,s();return}if(d==="delete-task"){if(!a.editingTask||a.creatingTask||!confirm("Delete this task? CalDAV clients will sync the removal."))return;a.busy=!0,i(),s();try{await w.deleteTask(a.editingTask.instanceId,a.editingTask.uri),a.selectedTaskKey=null,a.editingTask=null,await e.loadTasks(),r("success","Task deleted")}catch(o){r("error",o instanceof Error?o.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="delete-note"){if(!a.editingNote||a.creatingNote||!confirm("Delete this note? CalDAV clients will sync the removal."))return;a.busy=!0,i(),s();try{await w.deleteNote(a.editingNote.instanceId,a.editingNote.uri),a.selectedNoteKey=null,a.editingNote=null,await e.loadNotes(),r("success","Note deleted")}catch(o){r("error",o instanceof Error?o.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="select-ab"){const o=Number(l.dataset.id);if(!Number.isFinite(o))return;a.selectedAbId=o,a.abModalOpen=!1,a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactModalOpen=!1,a.contactSearch="",a.contacts=[],a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,i(),a.busy=!0,s();try{await e.loadContacts(o)}catch(m){r("error",m instanceof Error?m.message:"Failed to load contacts")}finally{a.busy=!1,s()}return}if(d==="edit-ab"){t.stopPropagation();const o=Number(l.dataset.id);if(!Number.isFinite(o)||!a.addressBooks.find($=>$.id===o))return;const p=a.selectedAbId!==o;a.selectedAbId=o,a.abModalOpen=!0,a.contactModalOpen=!1,i(),p&&(a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactSearch="",a.contacts=[],a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1),a.busy=!0,s();try{p&&await e.loadContacts(o)}catch($){r("error",$ instanceof Error?$.message:"Failed to open address book")}finally{a.busy=!1,s()}return}if(d==="close-ab-modal"){a.abModalOpen=!1,s();return}if(d==="select-contact"){const o=l.dataset.uri??"";if(!o)return;i();try{await e.openContact(o)}catch(m){r("error",m instanceof Error?m.message:"Failed to load contact")}s();return}if(d==="new-contact"){if(a.selectedAbId===null)return;e.startNewContact(),i(),s();return}if(d==="cancel-contact"||d==="close-contact-modal"){a.creatingContact=!1,a.contactModalOpen=!1,a.editingContact=null,a.selectedContactUri=null,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,a.eventDtPicker=null,i(),s();return}if(d==="add-email"||d==="add-phone"||d==="add-custom"){if(!a.editingContact)return;he(e.contactsHost),Array.isArray(a.editingContact.emails)||(a.editingContact.emails=[""]),Array.isArray(a.editingContact.phones)||(a.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(a.editingContact.custom)||(a.editingContact.custom=[]),d==="add-email"?a.editingContact.emails.length<10&&a.editingContact.emails.push(""):d==="add-phone"?a.editingContact.phones.length<10&&a.editingContact.phones.push({type:"other",value:""}):a.editingContact.custom.length<30&&a.editingContact.custom.push({label:"",value:""}),s();return}if(d==="remove-email"){if(!a.editingContact)return;he(e.contactsHost);const o=Number(l.dataset.idx);if(!Number.isFinite(o))return;const m=Array.isArray(a.editingContact.emails)?a.editingContact.emails:[""];a.editingContact.emails=m.filter((p,$)=>$!==o),a.editingContact.emails.length===0&&(a.editingContact.emails=[""]),s();return}if(d==="remove-phone"){if(!a.editingContact)return;he(e.contactsHost);const o=Number(l.dataset.idx);if(!Number.isFinite(o))return;const m=Array.isArray(a.editingContact.phones)?a.editingContact.phones:[{type:"cell",value:""}];a.editingContact.phones=m.filter((p,$)=>$!==o),a.editingContact.phones.length===0&&(a.editingContact.phones=[{type:"cell",value:""}]),s();return}if(d==="remove-custom"){if(!a.editingContact)return;he(e.contactsHost);const o=Number(l.dataset.idx);if(!Number.isFinite(o))return;a.editingContact.custom=(Array.isArray(a.editingContact.custom)?a.editingContact.custom:[]).filter((m,p)=>p!==o),s();return}if(d==="remove-photo"){a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!0,a.editingContact&&(a.editingContact.hasPhoto=!1),s();return}if(d==="delete-contact"){if(a.selectedAbId===null||!a.selectedContactUri||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;a.busy=!0,i(),a.contactModalOpen=!0,s();try{await w.deleteContact(a.selectedAbId,a.selectedContactUri),a.selectedContactUri=null,a.editingContact=null,a.creatingContact=!1,a.contactModalOpen=!1,a.eventDtPicker=null,a.photoPreview=null,await e.loadHome(),r("success","Contact deleted")}catch(o){r("error",o instanceof Error?o.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="delete-ab"){t.stopPropagation();const o=Number(l.dataset.id??a.selectedAbId);if(!Number.isFinite(o)||!a.addressBooks.find(p=>p.id===o))return;a.deleteAbConfirmId=o,a.abModalOpen=!1,a.contactModalOpen=!1,i(),s();return}if(d==="cancel-delete-ab"){a.deleteAbConfirmId=null,s();return}if(d==="confirm-delete-ab"){const o=Number(l.dataset.id),m=n.querySelector("#delete-ab-confirm");if(!Number.isFinite(o)||!(m!=null&&m.checked))return;const p=a.addressBooks.find(y=>y.id===o);if(!p)return;const $=(p.cardCount??0)>0;a.busy=!0,i(),s();try{await w.deleteAddressBook(o,$),a.selectedAbId===o&&(a.selectedAbId=null,a.contacts=[],a.editingContact=null,a.selectedContactUri=null,a.creatingContact=!1),a.deleteAbConfirmId=null,a.abModalOpen=!1,a.contactModalOpen=!1,await e.loadHome(),a.selectedAbId===null&&a.addressBooks.length>0&&(a.selectedAbId=a.addressBooks[0].id,await e.loadContacts(a.selectedAbId)),r("success","Address book deleted")}catch(y){r("error",y instanceof Error?y.message:"Delete failed")}finally{a.busy=!1,s()}return}if(d==="export-ab"){t.stopPropagation();const o=l.dataset.id,m=o!==void 0&&o!==""?Number(o):a.selectedAbId;if(m===null||Number.isNaN(m))return;a.busy=!0,i(),s();try{const{blob:p,filename:$}=await w.exportAddressBook(m),y=await e.saveBlobAsFile(p,$);y==="cancelled"?r("info","Export cancelled"):y==="saved"?r("success",`Saved ${$}`):r("success",`Download started: ${$}`)}catch(p){r("error",p instanceof Error?p.message:"Export failed")}finally{a.busy=!1,s()}return}if(d==="export-contact"){if(a.selectedAbId===null||!a.selectedContactUri||a.creatingContact)return;a.contactModalOpen=!0,a.busy=!0,i(),s();try{const{blob:o,filename:m}=await w.exportContact(a.selectedAbId,a.selectedContactUri),p=await e.saveBlobAsFile(o,m);p==="cancelled"?r("info","Export cancelled"):p==="saved"?r("success",`Saved ${m}`):r("success",`Download started: ${m}`)}catch(o){r("error",o instanceof Error?o.message:"Export failed")}finally{a.busy=!1,s()}return}if(d==="revoke"){const o=l.dataset.href??"";if(!o||a.selectedId===null||!confirm("Revoke access for this user?"))return;a.calModalOpen=!0,a.busy=!0,i(),s();try{await w.revoke(a.selectedId,o),await e.loadShares(a.selectedId),r("success","Share revoked")}catch(m){r("error",m instanceof Error?m.message:"Revoke failed")}finally{a.busy=!1,s()}return}if(d==="export-cal"){t.stopPropagation();const o=l.dataset.id,m=o!==void 0&&o!==""?Number(o):a.selectedId;if(m===null||Number.isNaN(m))return;a.busy=!0,i(),s();try{const{blob:p,filename:$}=await w.exportCalendar(m),y=await e.saveBlobAsFile(p,$);y==="cancelled"?r("info","Export cancelled"):y==="saved"?r("success",`Saved ${$}`):r("success",`Download started: ${$}`)}catch(p){r("error",p instanceof Error?p.message:"Export failed")}finally{a.busy=!1,s()}}}}function Ws(e){const{state:t,root:a,render:n,setFlash:s}=e;a.querySelectorAll("[data-action]").forEach(D=>{D.addEventListener("click",P=>{const U=P.target.closest("[data-action]");((U==null?void 0:U.dataset.action)==="info"||(U==null?void 0:U.dataset.action)==="info-close")&&(P.preventDefault(),P.stopPropagation()),Qt(e,P)})}),a.querySelectorAll('select[data-action="dt-set-month"], select[data-action="dt-set-year"]').forEach(D=>{D.addEventListener("change",P=>{P.stopPropagation(),Qt(e,P)}),D.addEventListener("click",P=>{P.stopPropagation()})}),e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),a.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(D=>{D.addEventListener("keydown",P=>{(P.key==="Enter"||P.key===" ")&&(P.preventDefault(),D.click())})});const r=a.querySelector("#delete-cal-confirm"),i=a.querySelector("#delete-cal-submit");r==null||r.addEventListener("change",()=>{i&&(i.disabled=!r.checked||t.busy)});const l=a.querySelector("#delete-ab-confirm"),d=a.querySelector("#delete-ab-submit");l==null||l.addEventListener("change",()=>{d&&(d.disabled=!l.checked||t.busy)}),a.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(D=>{D.addEventListener("error",()=>{const P=D.dataset.avatarFallback||"?",U=document.createElement("span");U.className="contact-avatar contact-avatar-fallback",U.setAttribute("aria-hidden","true"),U.textContent=P,D.replaceWith(U)})}),t.escapeBound||(document.addEventListener("keydown",D=>{if(D.key==="Escape"){if(t.importProgress&&(t.importProgress.phase==="done"||t.importProgress.phase==="error")){e.closeImportProgress();return}if(!t.importProgress){if(t.filesUploadProgress&&(t.filesUploadProgress.phase==="done"||t.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(!t.filesUploadProgress){if(t.filesUploadMenuOpen){t.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),n();return}if(t.userMenuOpen){t.userMenuOpen=!1,e.unbindUserMenuOutside(),n();return}if(t.filesUploadConflict!==null){He(e.filesHost,"cancel");return}if(t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen){t.filesRenamePath=null,t.filesDeletePaths=null,e.resetFilesTransferTree(),t.filesMkdirOpen=!1,n();return}if(e.closeInfoModal(),t.eventDtPicker){t.eventDtPicker=null,n();return}if(t.eventModalOpen){t.eventModalOpen=!1,t.editingEvent=null,t.creatingEvent=!1,t.eventDtPicker=null,n();return}if(t.contactModalOpen){t.contactModalOpen=!1,t.editingContact=null,t.creatingContact=!1,t.photoPreview=null,t.photoBase64Pending=null,t.removePhotoPending=!1,n();return}if(t.abModalOpen){t.abModalOpen=!1,n();return}if(t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null){t.calModalOpen=!1,t.createCalModalOpen=!1,t.deleteConfirmId=null,t.deleteAbConfirmId=null,n();return}if(t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null){t.adminUserCreateOpen=!1,t.adminUserEditOpen=!1,t.adminUserDeleteUsername=null,n();return}if(t.adminResetModalOpen){t.adminResetModalOpen=!1,n();return}if(t.adminDbConfirmOpen){t.adminDbConfirmOpen=!1,t.adminDbConfirmText="",t.adminDbPendingBody=null,n();return}(t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null)&&(t.adminCalModal=null,t.adminAbModal=null,t.adminResourceDelete=null,n())}}}}),t.escapeBound=!0);const u=a.querySelector('[data-form="login"]');u==null||u.addEventListener("submit",D=>{D.preventDefault(),e.onLogin(u)});const g=a.querySelector('[data-form="share"]');g==null||g.addEventListener("submit",D=>{D.preventDefault(),e.onShare(g)});const b=a.querySelector('[data-form="edit-event"]');b==null||b.addEventListener("submit",D=>{D.preventDefault(),e.onSaveEvent(b)}),b==null||b.querySelectorAll('select[name="repeatFreq"], select[name="repeatEndMode"]').forEach(D=>{D.addEventListener("change",()=>{if(!t.editingEvent)return;const P=new FormData(b);t.editingEvent={...t.editingEvent,repeat:Fe(P),hasRrule:!!String(P.get("repeatFreq")??"").trim()},n()})});const v=a.querySelector('[data-form="edit-cal"]');v==null||v.addEventListener("submit",D=>{D.preventDefault(),e.onEditCal(v)}),v&&e.bindColorPair(v);const S=a.querySelector('[data-form="create-cal"]');S==null||S.addEventListener("submit",D=>{D.preventDefault(),e.onCreateCal(S)}),S&&e.bindColorPair(S);const E=a.querySelector('[data-form="contact"]');E==null||E.addEventListener("submit",D=>{D.preventDefault(),e.onSaveContact(E)});const o=a.querySelector('[data-form="create-ab"]');o==null||o.addEventListener("submit",D=>{D.preventDefault(),e.onCreateAb(o)});const m=a.querySelector('[data-form="edit-ab"]');m==null||m.addEventListener("submit",D=>{D.preventDefault(),e.onEditAb(m)});const p=a.querySelector('[data-form="task"]');if(p==null||p.addEventListener("submit",D=>{D.preventDefault(),e.onSaveTask(p)}),p){const D=p.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!t.creatingTask||!t.editingTask)return;const P=Number(D.value);if(!Number.isFinite(P)||P<=0)return;e.syncEditingTaskFromForm(p);const U=t.editingTask.parentUid;t.editingTask={...t.editingTask,instanceId:P,parentUid:U&&t.tasks.some(q=>q.uid===U&&q.instanceId===P)?U:null},n()})}const $=a.querySelector('[data-form="note"]');if($==null||$.addEventListener("submit",D=>{D.preventDefault(),e.onSaveNote($)}),$){const D=$.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!t.creatingNote||!t.editingNote)return;const P=Number(D.value);!Number.isFinite(P)||P<=0||(e.syncEditingNoteFromForm($),t.editingNote={...t.editingNote,instanceId:P},n())})}const y=a.querySelector('input[data-action="contact-search"]');y==null||y.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.contactSearch=y.value,(async()=>{try{t.selectedAbId!==null&&await e.loadContacts(t.selectedAbId),n()}catch(D){s("error",D instanceof Error?D.message:"Search failed"),n()}})()},250)});const f=a.querySelector('input[data-action="task-search"]');f==null||f.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.taskSearch=f.value,(async()=>{try{await e.loadTasks(),n()}catch(D){s("error",D instanceof Error?D.message:"Search failed"),n()}})()},250)});const k=a.querySelector('input[data-action="note-search"]');k==null||k.addEventListener("input",()=>{t.searchTimer&&clearTimeout(t.searchTimer),t.searchTimer=setTimeout(()=>{t.noteSearch=k.value,(async()=>{try{await e.loadNotes(),n()}catch(D){s("error",D instanceof Error?D.message:"Search failed"),n()}})()},250)});const A=a.querySelector('select[data-action="admin-db-backend"]');A==null||A.addEventListener("change",()=>{t.adminDbFormBackend=A.value==="pgsql"?"pgsql":"sqlite",n()});const F=a.querySelector('input[data-action="admin-db-confirm-input"]');F==null||F.addEventListener("input",()=>{t.adminDbConfirmText=F.value;const D=a.querySelector('[data-action="admin-db-confirm-save"]');D&&(D.disabled=t.busy||t.adminDbConfirmText.trim()!=="CONFIRM")});const O=a.querySelector('input[data-action="admin-reset-password"]');O==null||O.addEventListener("input",()=>{t.adminResetPassword=O.value;const D=a.querySelector('[data-action="admin-reset-confirm"]');D&&(D.disabled=t.busy||!t.adminResetConfirmChecked||t.adminResetPassword.trim()==="")}),ya(e.filesHost),ka(e.adminHost),e.bindImportInput(),e.bindHolidaysToggle(),e.bindContactPhotoInput()}function ut(e){const{state:t}=e;t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(t.activeTab="calendars",t.adminPage="overview",e.persistTab(t.activeTab))}async function Js(e,t,a={}){return wa(e.adminHost,t,a)}async function Xt(e,t,a={}){const{state:n,render:s,setFlash:r,clearFlash:i}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&n.adminCapabilities&&!n.adminCapabilities.uiEnabled&&r("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t="calendars"),t==="admin"){await e.activateAdminPage(n.adminPage||"overview",{...a,username:n.adminPage==="users"?n.adminSelectedUsername:null});return}n.activeTab=t,n.userMenuOpen=!1,e.persistTab(t),h.event("tab",{tab:t}),t!=="calendars"&&(n.calModalOpen=!1,n.deleteConfirmId=null),t!=="contacts"&&(n.deleteAbConfirmId=null),a.clearFlash!==!1&&i(),n.busy=!0,s();try{t==="contacts"&&n.selectedAbId!==null?await e.loadContacts(n.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await e.loadTasks():t==="notes"?await e.loadNotes():t==="files"&&await e.loadFiles()}catch(l){h.warn("tab load failed",l instanceof Error?l.message:l),r("error",l instanceof Error?l.message:"Failed to load")}finally{n.busy=!1,s()}}async function Se(e){const{state:t}=e;h.debug("loadHome");const[a,n,s]=await Promise.all([w.calendars(),w.directory().catch(()=>({users:[]})),w.addressbooks()]);if(t.calendars=a.calendars,t.directory=n.users,t.addressBooks=s.addressbooks,h.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await w.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(i=>i.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),t.selectedIds.length===0){const r=e.pickDefaultCalendar();r?(t.selectedIds=[r.id],t.selectedId=r.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id)}t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await e.loadTasks(),t.activeTab==="notes"&&await e.loadNotes(),t.activeTab==="files"&&await e.loadFiles()}function Ys(e){const{state:t}=e;return Tt(t.portalUi.timeFormat)}function Gs(e){const{state:t}=e;return At(t.portalUi.weekStart)}function Qs(e){const{state:t}=e;return ha(t.portalUi.weekStart)}function Oa(e,t,a){const{state:n}=e;return Zn(t,a,n.portalUi.timeFormat)}function Xs(e,t,a,n,s){var u,g;const{state:r}=e,i=ge(a),l=((u=r.eventDtPicker)==null?void 0:u.viewY)??Number(i.date.slice(0,4)),d=((g=r.eventDtPicker)==null?void 0:g.viewM)??Number(i.date.slice(5,7))-1;return as({field:t,value:a,dateOnly:n,allowClear:s,viewY:l,viewM:d,weekStart:r.portalUi.weekStart,timeFormat:r.portalUi.timeFormat})}function mt(e){ns(e.root)}function De(e,t){var S;const{state:a}=e,{field:n,name:s,label:r,value:i,dateOnly:l=!1,required:d,disabled:u,allowClear:g=!0}=t,b=((S=a.eventDtPicker)==null?void 0:S.field)===n,v=Oa(e,i,l);return`<div class="dt-field${b?" is-open":""}" data-dt-id="${c(n)}">
    <span class="dt-field-label">${c(r)}</span>
    <input type="hidden" name="${c(s)}" value="${c(i)}" ${d?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(n)}"
      data-dt-name="${c(s)}" data-dt-date-only="${l?"1":"0"}" data-dt-clear="${g?"1":"0"}"
      ${u?"disabled":""} aria-expanded="${b}">
      <span class="dt-trigger-text">${c(v)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${b&&!u?Xs(e,n,i,l,g):""}
  </div>`}function Zt(e,t){var n,s,r,i,l,d,u,g;const{state:a}=e;return t==="start"?String(((n=a.editingEvent)==null?void 0:n.start)||""):t==="end"?String(((s=a.editingEvent)==null?void 0:s.end)||""):t==="until"?((i=(r=a.editingEvent)==null?void 0:r.repeat)==null?void 0:i.until)||ye((l=a.editingEvent)==null?void 0:l.start)||L(new Date):t==="due"?$e((d=a.editingTask)==null?void 0:d.due):t==="dtstart"?$e((u=a.editingNote)==null?void 0:u.dtstart):t==="bulk-due"?a.bulkDueValue:t==="birthday"?String(((g=a.editingContact)==null?void 0:g.birthday)||""):""}function ea(e,t,a){const{state:n}=e;if(t==="start"&&n.editingEvent){n.editingEvent={...n.editingEvent,start:a||""};return}if(t==="end"&&n.editingEvent){n.editingEvent={...n.editingEvent,end:a};return}if(t==="until"&&n.editingEvent){n.editingEvent={...n.editingEvent,repeat:{...n.editingEvent.repeat??e.defaultRepeat(),until:a,endMode:"until"}};return}if(t==="due"&&n.editingTask){if(a===null||a==="")n.editingTask={...n.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))n.editingTask={...n.editingTask,due:new Date(a+"T00:00:00").toISOString()};else{const s=new Date((a.length===16,a));n.editingTask={...n.editingTask,due:Number.isNaN(s.getTime())?a:s.toISOString()}}return}if(t==="dtstart"&&n.editingNote){if(a===null||a==="")n.editingNote={...n.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))n.editingNote={...n.editingNote,dtstart:new Date(a+"T00:00:00").toISOString()};else{const s=new Date((a.length===16,a));n.editingNote={...n.editingNote,dtstart:Number.isNaN(s.getTime())?a:s.toISOString()}}return}if(t==="birthday"&&n.editingContact){n.editingContact={...n.editingContact,birthday:a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null};return}t==="bulk-due"&&(n.bulkDueValue=a||"")}function Zs(e,t){const{root:a}=e,n=an[t];if(!n)return;const s=a.querySelector("#info-modal"),r=a.querySelector("#info-modal-title"),i=a.querySelector("#info-modal-body");if(!s||!r||!i)return;r.textContent=n.title,i.innerHTML=n.paragraphs.map(d=>`<p>${c(d)}</p>`).join(""),s.hidden=!1,document.body.classList.add("info-modal-open");const l=s.querySelector(".info-modal-close");l==null||l.focus()}function er(e){const{root:t}=e,a=t.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function tr(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const i=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await i.write(e)}finally{await i.close()}return"saved"}catch(r){if(r instanceof DOMException&&r.name==="AbortError")return"cancelled"}const n=URL.createObjectURL(e),s=document.createElement("a");return s.href=n,s.download=t,s.rel="noopener",s.style.display="none",document.body.appendChild(s),s.click(),window.setTimeout(()=>{URL.revokeObjectURL(n),s.remove()},6e4),"started"}function ar(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let n=a.value.trim();n&&!n.startsWith("#")&&(n=`#${n}`),/^#[0-9A-Fa-f]{6}/.test(n)&&(t.value=n.slice(0,7),a.value=n.toUpperCase())}))}function nr(e){const t=Ka({activeTab:Hs(),adminPage:zs(),adminSelectedUsername:Mt().adminUsername??null});let a,n,s,r,i,l,d;function u(f,k){ia(t,f,k)}function g(){Ya(t)}function b(){const f=Vt(e);t.user?Ks(d):Bt(e,t,(k,A)=>it(t,k,A,{renderImportProgressModal:()=>_e(s),renderFilesUploadProgressModal:()=>Le(a)})),Ws(d),Ht(e,f),requestAnimationFrame(()=>{var k;mt(d),(k=e.querySelector(".dt-time.is-selected"))==null||k.scrollIntoView({block:"center"})})}function v(){Z(s)}function S(){ve(a)}function E(){z(a)}function o(){gt(t)}function m(){K(a)}function p(){Ga(t,{stopImportElapsedTimer:v,stopFilesUploadElapsedTimer:S,resetFilesTransferTree:E,unbindUserMenuOutside:o,unbindFilesUploadMenuOutside:m})}function $(f){Qa(t,{message:f,clearSession:p,render:b})}function y(){return{state:t,render:b,handleSessionExpired:$,clearPortalSessionState:p,normalizeActiveTab:()=>ut(d),persistTab:ot,loadHome:()=>Se(d),loadAdminCapabilities:()=>$t(n),loadAdminDashboard:()=>We(n),loadAdminUsers:()=>de(n),loadAdminUserDetail:f=>j(n,f),loadAdminUserResources:f=>oe(n,f),loadAdminSystemSettings:()=>Je(n),loadAdminDatabaseSettings:()=>Ye(n),adminPageMeta:f=>te(n,f),setFlash:u,clearFlash:g}}a={state:t,root:e,render:b,setFlash:u,clearFlash:g},n={state:t,root:e,render:b,setFlash:u,clearFlash:g,userIsAdmin:()=>le(t),adminUiEnabled:()=>Ue(t),persistTab:ot,activateTab:(f,k)=>Xt(d,f,k),loadHome:()=>Se(d),normalizeActiveTab:()=>ut(d)},s={state:t,root:e,render:b,setFlash:u,clearFlash:g,localeWeekStart:()=>Gs(d),localeDowLabels:()=>Qs(d),formatDtDisplay:(f,k)=>Oa(d,f,k),timeFormatOpts:()=>Ys(d),renderPortalDateTimeField:f=>De(d,f),getDtFieldCurrentValue:f=>Zt(d,f),setDtFieldValue:(f,k)=>ea(d,f,k),positionDtPopovers:()=>mt(d),renderFlashBanner:()=>pt(t),accessBadge:Gt,formatImportResult:ct,loadHome:()=>Se(d),onImportContacts:f=>_s(l,f)},r={state:t,root:e,render:b,setFlash:u,clearFlash:g,renderPortalDateTimeField:f=>De(d,f)},i={state:t,root:e,render:b,setFlash:u,clearFlash:g,renderPortalDateTimeField:f=>De(d,f)},l={state:t,root:e,render:b,setFlash:u,clearFlash:g,renderPortalDateTimeField:f=>De(d,f),stopImportElapsedTimer:()=>Z(s),startImportElapsedTimer:()=>Da(s),setImportPhase:(f,k)=>Te(s,f,k),applyServerImportProgress:f=>Ca(s,f),readFileTextWithProgress:(f,k)=>Pa(s,f,k),formatImportResult:ct,loadHome:()=>Se(d)},d={state:t,root:e,render:b,setFlash:u,clearFlash:g,filesHost:a,adminHost:n,calendarsHost:s,notesHost:r,tasksHost:i,contactsHost:l,clearPortalSessionState:p,userIsAdmin:()=>le(t),adminUiEnabled:()=>Ue(t),normalizeActiveTab:()=>ut(d),persistTab:ot,activateTab:(f,k)=>Xt(d,f,k),activateAdminPage:(f,k)=>Js(d,f,k),loadHome:()=>Se(d),handleSessionExpired:$,loadFiles:()=>X(a),loadShares:f=>Ft(s,f),loadMonthEvents:()=>tt(s),loadContacts:f=>Ot(l,f),loadTasks:()=>Ge(i),loadNotes:()=>Aa(r),loadAdminCapabilities:()=>$t(n),loadAdminDashboard:()=>We(n),loadAdminUsers:()=>de(n),loadAdminUserDetail:f=>j(n,f),loadAdminUserResources:f=>oe(n,f),loadAdminSystemSettings:()=>Je(n),loadAdminDatabaseSettings:()=>Ye(n),adminPageMeta:f=>te(n,f),pickDefaultCalendar:()=>ss(s),toggleCalendarSelected:f=>is(s,f),blankEventForDay:(f,k)=>ms(s,f,k),defaultRepeat:()=>It(),itemKey:_,openContact:f=>Os(l,f),startNewContact:()=>Ns(l),emptyAddress:()=>Fa(),syncEditingEventFromForm:f=>ps(s,f),syncEditingTaskFromForm:f=>Us(i,f),syncEditingNoteFromForm:f=>Ds(r,f),runBulkTaskAction:f=>Fs(i,f),shell:(f,k)=>it(t,f,k,{renderImportProgressModal:()=>_e(s),renderFilesUploadProgressModal:()=>Le(a)}),renderLogin:()=>Bt(e,t,(f,k)=>it(t,f,k,{renderImportProgressModal:()=>_e(s),renderFilesUploadProgressModal:()=>Le(a)})),renderFlashBanner:()=>pt(t),renderMonthGrid:()=>os(s),renderEventModal:()=>us(s),renderImportProgressModal:()=>_e(s),renderFilesUploadProgressModal:()=>Le(a),renderTasksTab:()=>As(i),renderNotesTab:()=>Ss(r),renderFilesTab:()=>kn(a),renderAdminSection:()=>Wn(n),adminSubnavButtons:()=>En(n),renderPortalDateTimeField:f=>De(d,f),getDtFieldCurrentValue:f=>Zt(d,f),setDtFieldValue:(f,k)=>ea(d,f,k),positionDtPopovers:()=>mt(d),accessBadge:Gt,formatImportResult:ct,closeImportProgress:()=>fs(s),closeFilesUploadProgress:()=>fa(a),resetFilesTransferTree:E,stopImportElapsedTimer:v,stopFilesUploadElapsedTimer:S,unbindUserMenuOutside:o,bindUserMenuOutside:()=>sn(t,b),unbindFilesUploadMenuOutside:m,bindFilesUploadMenuOutside:()=>bn(a),onLogin:f=>tn(f,y()),onShare:f=>vs(s,f),onSaveEvent:f=>$s(s,f),onEditCal:f=>ws(s,f),onCreateCal:f=>ks(s,f),onSaveContact:f=>qs(l,f),onCreateAb:f=>Rs(l,f),onEditAb:f=>Bs(l,f),onSaveTask:f=>Is(i,f),onSaveNote:f=>Cs(r,f),bindColorPair:ar,bindImportInput:()=>bs(s),bindHolidaysToggle:()=>hs(s),bindContactPhotoInput:()=>xs(l),bindFilesDom:()=>ya(a),bindAdminDom:()=>ka(n),saveBlobAsFile:tr,openInfoModal:f=>Zs(d,f),closeInfoModal:()=>er(d),captureScroll:()=>Vt(e),restoreScroll:f=>Ht(e,f)},en(y())}let ae="",T=null,I=!1,B=null,J=null,Q="sqlite",Qe=!1;async function at(e,t={}){const a={Accept:"application/json",...t.headers};t.body&&(a["Content-Type"]="application/json"),ae&&t.method&&t.method!=="GET"&&(a["X-CSRF-Token"]=ae);const n=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:a});let s;try{s=await n.json()}catch{throw new Error(`Request failed (${n.status})`)}if(!n.ok)throw new Error(s.error||`Request failed (${n.status})`);return s&&typeof s=="object"&&"data"in s&&s.data!==void 0?s.data:s}async function xt(){var e;T=await at("/status"),ae=T.csrfToken||ae,((e=T.defaults)==null?void 0:e.backend)==="pgsql"?Q="pgsql":Q="sqlite"}function Ce(e,t,a){return`<label class="check-row"><input type="checkbox" name="${c(e)}" ${t?"checked":""} ${I?"disabled":""} /> ${c(a)}</label>`}function sr(){const e=T==null?void 0:T.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${c((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${c((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${W("error",(T==null?void 0:T.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${I?"disabled":""}>Retry</button>
  </section>`}function rr(){const e=T==null?void 0:T.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${I?"disabled":""}>
          ${va((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ce("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ce("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${Ce("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ce("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ce("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${I?"disabled":""}>
          ${["Digest","Basic","Apache"].map(t=>`<option value="${t}" ${((e==null?void 0:e.dav_auth_type)||"Digest")===t?"selected":""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${c((e==null?void 0:e.invite_from)||"")}" ${I?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${c(String((e==null?void 0:e.session_max_age_minutes)??15))}" ${I?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${I?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function ir(){const e=T==null?void 0:T.defaults,t=(T==null?void 0:T.pdoDrivers)||[],a=t.includes("sqlite"),n=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${I?"disabled":""}>
          ${a?`<option value="sqlite" ${Q==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${n?`<option value="pgsql" ${Q==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Q==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${c((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${I?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Q==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${c((e==null?void 0:e.pgsql_host)||"")}" placeholder="localhost:5432" ${I?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${c((e==null?void 0:e.pgsql_dbname)||"")}" ${I?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${c((e==null?void 0:e.pgsql_username)||"")}" autocomplete="off" ${I?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${I?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${I?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function lr(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${c(String((T==null?void 0:T.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${c((T==null?void 0:T.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${Qe?"checked":""} ${I?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${I||!Qe?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function dr(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${c((T==null?void 0:T.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function or(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${W("error",(T==null?void 0:T.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function V(){const e=document.getElementById("app");if(!e)return;const t=(T==null?void 0:T.step)||"permissions";let a="";T?t==="permissions"?a=sr():t==="initialize"?a=rr():t==="database"?a=ir():t==="upgrade"?a=lr():t==="done"?a=dr():t==="locked"?a=or():a=`<section class="card"><p>Unknown step: ${c(t)}</p></section>`:a='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${c((T==null?void 0:T.productVersion)||"…")}</span>
            ${T!=null&&T.configuredVersion?` · configured <span class="mono">${c(String(T.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${T!=null&&T.step?`<span class="badge badge-admin">${c(T.step)}</span>`:""}
      </header>
      ${B?W("error",B,{dismissible:!1}):""}
      ${J?W("success",J,{dismissible:!1}):""}
      ${a}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,cr()}function cr(){var t,a,n,s,r,i;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{ur()}),(a=e.querySelector('[data-action="backend-change"]'))==null||a.addEventListener("change",l=>{Q=l.target.value==="pgsql"?"pgsql":"sqlite",V()}),(n=e.querySelector('[data-action="upgrade-toggle"]'))==null||n.addEventListener("change",l=>{Qe=!!l.target.checked,V()}),(s=e.querySelector('[data-action="upgrade-run"]'))==null||s.addEventListener("click",()=>{fr()}),(r=e.querySelector('[data-form="initialize"]'))==null||r.addEventListener("submit",l=>{l.preventDefault(),mr(l.target)}),(i=e.querySelector('[data-form="database"]'))==null||i.addEventListener("submit",l=>{l.preventDefault(),pr(l.target)}))}async function ur(){I=!0,B=null,V();try{await xt(),J=null}catch(e){B=e instanceof Error?e.message:"Failed to load installer status"}finally{I=!1,V()}}async function mr(e){const t=new FormData(e),a=s=>{var r;return!!((r=e.querySelector(`input[name="${s}"]`))!=null&&r.checked)},n={timezone:String(t.get("timezone")??"").trim(),cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};I=!0,B=null,J=null,V();try{T=await at("/initialize",{method:"POST",body:JSON.stringify(n)}),ae=T.csrfToken||ae,J="Server settings saved. Configure the database next.",h.event("install.initialize")}catch(s){B=s instanceof Error?s.message:"Initialize failed"}finally{I=!1,V()}}async function pr(e){const t=new FormData(e),a=String(t.get("backend")??Q),n={backend:a,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};a==="sqlite"?n.sqlite_file=String(t.get("sqlite_file")??"").trim():(n.pgsql_host=String(t.get("pgsql_host")??"").trim(),n.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),n.pgsql_username=String(t.get("pgsql_username")??"").trim(),n.pgsql_password=String(t.get("pgsql_password")??"")),I=!0,B=null,J=null,V();try{T=await at("/database",{method:"POST",body:JSON.stringify(n)}),ae=T.csrfToken||ae,J="Database configured. Installer is locked.",h.event("install.database"),T.completed||T.step}catch(s){B=s instanceof Error?s.message:"Database setup failed"}finally{I=!1,V()}}async function fr(){if(Qe){I=!0,B=null,J=null,V();try{const e=await at("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});J="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),h.event("install.upgrade"),await xt()}catch(e){B=e instanceof Error?e.message:"Upgrade failed"}finally{I=!1,V()}}}async function br(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await xt()}catch(t){B=t instanceof Error?t.message:"Failed to load installer"}V()}const kt=document.getElementById("app");if(!kt)throw new Error("#app missing");const ta=window.location.pathname.replace(/\/+$/,"")||"/";ta==="/portal/install"||ta.endsWith("/portal/install")?br(kt):nr(kt);
