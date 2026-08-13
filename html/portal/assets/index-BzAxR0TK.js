var Xa=Object.defineProperty;var Za=(e,t,a)=>t in e?Xa(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var bt=(e,t,a)=>Za(e,typeof t!="symbol"?t+"":t,a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const r of l.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function s(n){if(n.ep)return;n.ep=!0;const l=a(n);fetch(n.href,l)}})();const Jt={off:0,error:1,warn:2,info:3,debug:4};let Fe="off";const Ge="[angaradav-portal]";function en(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function tn(e){return Fe=en(e),Fe!=="off"&&console.info(Ge,`log level = ${Fe}`),Fe}function ba(e){return Jt[Fe]>=Jt[e]}function Re(e,t,a,s){if(!ba(e))return;const n=[Ge,a];s!==void 0&&n.push(s),console[t](...n)}function an(e,t){ba("info")&&(t&&Object.keys(t).length>0?console.info(Ge,`event:${e}`,t):console.info(Ge,`event:${e}`))}const h={error(e,t){Re("error","error",e,t)},warn(e,t){Re("warn","warn",e,t)},info(e,t){Re("info","info",e,t)},debug(e,t){Re("debug","debug",e,t)},event:an};class O extends Error{constructor(a,s,n={}){super(a);bt(this,"status");bt(this,"payload");this.status=s,this.payload=n}}let oe="",ze=null,je=null;function We(e){oe=e&&typeof e=="string"?e:""}function nn(e){ze=e}function sn(e){je=e}function Ut(e){if(!ga(e))try{je==null||je()}catch{}}function ga(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function Qe(e,t){if(!ga(e)){We("");try{ze==null||ze(t||"Session timed out. Please sign in again.")}catch{}}}async function C(e,t={}){const a=new Headers(t.headers);t.body&&!a.has("Content-Type")&&a.set("Content-Type","application/json");const s=(t.method||"GET").toUpperCase();s!=="GET"&&s!=="HEAD"&&s!=="OPTIONS"&&oe&&a.set("X-CSRF-Token",oe);const n=typeof performance<"u"?performance.now():Date.now();h.debug(`api → ${s} ${e}`);const l=await fetch(`/api${e}`,{...t,headers:a,credentials:"same-origin"});let r=null;const i=await l.text();if(i)try{r=JSON.parse(i)}catch{r={error:i}}const o=Math.round((typeof performance<"u"?performance.now():Date.now())-n);if(!l.ok){let c=`Request failed (${l.status})`,p={};if(r&&typeof r=="object"&&r!==null){const m=r;p={...m},typeof m.error=="string"&&(c=m.error)}else(l.status===500||l.status===504)&&(c="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw l.status>=500?h.error(`api ← ${s} ${e} ${l.status} (${o}ms)`,c):l.status!==401?h.warn(`api ← ${s} ${e} ${l.status} (${o}ms)`,c):(h.debug(`api ← ${s} ${e} 401 (${o}ms)`),Qe(e,c)),new O(c,l.status,p)}return h.info(`api ← ${s} ${e} ${l.status} (${o}ms)`),Ut(e),r}function R(e){return encodeURIComponent(e)}async function Yt(e,t,a,s){const n=new Headers({"Content-Type":a,Accept:"application/x-ndjson, application/json;q=0.9"});oe&&n.set("X-CSRF-Token",oe);const l=typeof performance<"u"?performance.now():Date.now();h.debug(`api → POST ${e} (stream, ${a}, ${t.length} bytes)`);let r;try{r=await fetch(`/api${e}`,{method:"POST",headers:n,credentials:"same-origin",body:t})}catch(f){const $=f instanceof Error?f.message:"Network error";throw h.error(`api ← POST ${e} network fail`,$),new O(`Import request failed to start (${$}). Check connectivity and container logs.`,0)}const i=(r.headers.get("Content-Type")||"").toLowerCase(),o=i.includes("ndjson")||i.includes("x-ndjson");if(!r.ok&&!o){let f=`Request failed (${r.status})`;try{const $=await r.json();$.error&&(f=$.error)}catch{}throw(r.status===504||r.status===502)&&(f="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),r.status===401?(h.debug(`api ← POST ${e} 401`,f),Qe(e,f)):h.warn(`api ← POST ${e} ${r.status}`,f),new O(f,r.status)}if(!o&&r.ok){try{const f=await r.json();if(f&&typeof f.error=="string")throw new O(f.error,r.status||500);if(f&&typeof f.imported=="number"&&typeof f.updated=="number")return h.info(`api ← POST ${e} json done`),f}catch(f){if(f instanceof O)throw f}throw new O("Unexpected import response from server",500)}if(!r.body)throw new O("Import stream unavailable",500);const c=r.body.getReader(),p=new TextDecoder;let m="";const u={final:null,error:null,sawProgress:!1},b=f=>{let $;try{$=JSON.parse(f)}catch{h.debug("import stream non-JSON line",f.slice(0,80));return}if($.type==="progress"){u.sawProgress=!0;const k=Number($.total)||0,S=Number($.current)||0,v=typeof $.percent=="number"?$.percent:k>0?Math.round(100*S/k):0;s==null||s({percent:v,current:S,total:k,imported:Number($.imported)||0,updated:Number($.updated)||0,skipped:Number($.skipped)||0})}else $.type==="done"&&$.result?u.final=$.result:$.type==="error"&&(u.error={message:$.error||"Import failed",status:$.status||500})};for(;;){const{done:f,value:$}=await c.read();if(f)break;m+=p.decode($,{stream:!0});const k=m.split(`
`);m=k.pop()??"";for(const S of k){const v=S.trim();v&&b(v)}}m.trim()&&b(m.trim());const y=Math.round((typeof performance<"u"?performance.now():Date.now())-l);if(u.error)throw u.error.status===401?(h.debug(`api ← POST ${e} stream 401 (${y}ms)`,u.error.message),Qe(e,u.error.message)):h.warn(`api ← POST ${e} stream error (${y}ms)`,u.error.message),new O(u.error.message,u.error.status);if(!u.final)throw h.error(`api ← POST ${e} stream incomplete (${y}ms)`,{sawProgress:u.sawProgress}),new O(u.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return h.info(`api ← POST ${e} stream done (${y}ms)`),Ut(e),u.final}const w={ui:()=>C("/ui"),installStatus:async()=>{const e=await C("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e},adminPing:()=>C("/admin/ping"),adminDashboard:()=>C("/admin/dashboard"),adminCapabilities:()=>C("/admin/capabilities"),adminUsers:()=>C("/admin/users"),adminUser:e=>C(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>C("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>C(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserCalendar:(e,t,a=!0)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a})}),adminUserAddressBooks:e=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserAddressBook:(e,t,a=!0,s=!1)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a,force:s})}),adminSystemSettings:()=>C("/admin/settings/system"),adminUpdateSystemSettings:e=>C("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>C("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>C("/admin/settings/database"),adminTestDatabaseConnection:e=>C("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>C("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await C("/me");return We(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)||""),e},login:async(e,t)=>{var s;const a=await C("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return We((s=a.user)==null?void 0:s.csrfToken),a},logout:async()=>{try{return await C("/logout",{method:"POST"})}finally{We("")}},calendars:()=>C("/calendars"),createCalendar:e=>C("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>C("/holidays/countries"),updateCalendar:(e,t)=>C(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>C(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,a)=>{const s=new URLSearchParams({from:t,to:a}).toString();return C(`/calendars/${e}/events?${s}`)},getEvent:(e,t)=>C(`/calendars/${e}/events/${R(t)}`),createEvent:(e,t)=>C(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,a)=>C(`/calendars/${e}/events/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteEvent:(e,t)=>C(`/calendars/${e}/events/${R(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const i=await t.json();i.error&&(r=i.error)}catch{}throw new O(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:n}},importCalendar:(e,t,a)=>Yt(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",a),directory:()=>C("/directory"),shares:e=>C(`/calendars/${e}/shares`),share:(e,t,a)=>C(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:a})}),revoke:(e,t)=>C(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})}),addressbooks:()=>C("/addressbooks"),createAddressBook:e=>C("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>C(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>C(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const i=await t.json();i.error&&(r=i.error)}catch{}throw new O(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:n}},importAddressBook:(e,t,a)=>Yt(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",a),contacts:(e,t="")=>{const a=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return C(`/addressbooks/${e}/contacts${a}`)},getContact:(e,t)=>C(`/addressbooks/${e}/contacts/${R(t)}`),createContact:(e,t)=>C(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,a)=>C(`/addressbooks/${e}/contacts/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteContact:(e,t)=>C(`/addressbooks/${e}/contacts/${R(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const a=await fetch(`/api/addressbooks/${e}/contacts/${R(t)}/export`,{credentials:"same-origin"});if(!a.ok){let i=`Export failed (${a.status})`;try{const o=await a.json();o.error&&(i=o.error)}catch{}throw new O(i,a.status)}const s=a.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(s),l=(n==null?void 0:n[1])||"contact.vcf";return{blob:await a.blob(),filename:l}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${R(t)}/photo`,tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/tasks${a}`)},createTask:e=>C("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,a)=>C(`/tasks/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteTask:(e,t)=>C(`/tasks/${e}/${R(t)}`,{method:"DELETE"}),bulkTasks:e=>C("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/notes${a}`)},createNote:e=>C("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,a)=>C(`/notes/${e}/${R(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteNote:(e,t)=>C(`/notes/${e}/${R(t)}`,{method:"DELETE"}),filesStatus:()=>C("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const a=t.toString()?`?${t}`:"";return C(`/files/entries${a}`)},filesMkdir:(e,t)=>C("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,a={})=>{const s=new URLSearchParams;e&&s.set("path",e),s.set("name",t.name),a.replace&&s.set("replace","1");const n=new FormData;n.append("file",t,t.name),e&&n.append("path",e);const l=typeof performance<"u"?performance.now():Date.now();return h.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((r,i)=>{const o=new XMLHttpRequest;o.open("POST",`/api/files/upload?${s}`),o.withCredentials=!0,oe&&o.setRequestHeader("X-CSRF-Token",oe),a.onProgress&&(o.upload.onprogress=c=>{var p,m;c.lengthComputable?(p=a.onProgress)==null||p.call(a,c.loaded,c.total):(m=a.onProgress)==null||m.call(a,c.loaded,t.size||c.loaded)}),o.onload=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-l);let p=null;const m=o.responseText||"";if(m)try{p=JSON.parse(m)}catch{p={error:m}}const u=o.status;if(u<200||u>=300){let b=`Upload failed (${u||0})`;p&&typeof p=="object"&&p!==null&&"error"in p&&typeof p.error=="string"&&(b=p.error),u===401?(h.debug(`api ← POST /files/upload 401 (${c}ms)`,b),Qe("/files/upload",b)):u>=500?h.error(`api ← POST /files/upload ${u} (${c}ms)`,b):h.warn(`api ← POST /files/upload ${u} (${c}ms)`,b),i(new O(b,u||0));return}h.info(`api ← POST /files/upload 200 (${c}ms)`),Ut("/files/upload"),r(p)},o.onerror=()=>{const c=Math.round((typeof performance<"u"?performance.now():Date.now())-l);h.error(`api ← POST /files/upload network error (${c}ms)`),i(new O("Upload failed (network error)",0))},o.onabort=()=>{i(new O("Upload cancelled",0))},o.send(n)})},filesDownloadUrl:e=>{const t=new URLSearchParams;return t.set("path",e),`/api/files/download?${t}`},filesDelete:e=>C("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>C("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,a)=>C("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:a})}),filesCopy:(e,t={})=>C("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>C("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},ya="angaradav-portal-tab",va="angaradav-portal-admin-page",rn="angaradav-portal-cal-selection",ln="2.2.3",on="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function dn(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],calendarSelectionSeeded:!1,listKeyboardFocus:!1,shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,filesDropDepth:0,escapeBound:!1,portalEventsBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off",services:null},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:ln,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,checkedFilePaths:[],filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function W(e,t,a={}){if(!t)return"";const s=a.dismissible!==void 0?a.dismissible:a.dismissAction!==void 0,n=a.dismissAction??"flash-close",l=a.role??"status",r=a.className?` ${a.className}`:"",i=a.style?` style="${d(a.style)}"`:"",o=s?`<button type="button" class="flash-close" data-action="${d(n)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${d(e)}${r}" role="${d(l)}"${i}>
      <span class="flash-text">${d(t)}</span>
      ${o}
    </div>`}function cn(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function un(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function It(e){return e.map(a=>{const s=a.type??"button",n=un(a.variant),l=a.disabled?" disabled":"",r=a.id?` id="${d(a.id)}"`:"",i=a.action?` data-action="${d(a.action)}"`:"",o=a.attrs?` ${a.attrs}`:"";return`<button type="${s}" class="${n}"${i}${r}${o}${l}>${d(a.label)}</button>`}).join(`
`)}function U(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=e.id?` id="${d(e.id)}"`:"",s=e.className?` ${e.className}`:"",n=e.rootAttrs?` ${e.rootAttrs}`:"",l=`${cn(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,r=e.closeAction,i=e.lockBackdrop?"":` data-action="${d(r)}"`,o=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${d(r)}" aria-label="Close">×</button>`;let c="";e.footer!==void 0&&(c=typeof e.footer=="string"?e.footer:It(e.footer));const p=c?`<footer class="cal-modal-footer">${c}</footer>`:"",m=`<div class="cal-modal-body">${e.body}</div>`;let u;return e.form?u=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${m}
        ${p}
      </form>`:u=`${m}
      ${p}`,`<div class="cal-modal${s}"${a}${n} role="dialog" aria-modal="true" aria-labelledby="${d(t)}">
      <div class="cal-modal-backdrop"${i}></div>
      <div class="cal-modal-card${l}">
        <header class="cal-modal-header">
          <h3 id="${d(t)}">${d(e.title)}</h3>
          ${o}
        </header>
        ${u}
      </div>
    </div>`}function it(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",a=e.style==="checkbox"?' style="margin-top:1rem"':"",s=e.id?` id="${d(e.id)}"`:"",n=e.checked?" checked":"",l=e.disabled?" disabled":"";return`<label class="${t}"${a}>
            <input type="checkbox"${s} data-action="${d(e.action)}"${n}${l} />
            ${d(e.label)}
          </label>`}function $a(e,t,a){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:a})}function mn(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function St(e){return e.flash?W(e.flash.type,e.flash.message,{dismissible:!0}):""}function de(e){var t,a;return!!((t=e.user)!=null&&t.isAdmin||((a=e.user)==null?void 0:a.role)==="Admin")}function Ne(e){return de(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function Je(e,t){if(!t)return;const a=(t.timeFormat||"auto").toLowerCase(),s=(t.weekStart||"auto").toLowerCase(),n=e.portalUi.services;let l=n;if(t.services&&typeof t.services=="object"){const r=n??{caldav:!0,carddav:!0,tasks:!0,notes:!0,files:!0},i=t.services;l={caldav:typeof i.caldav=="boolean"?i.caldav:r.caldav,carddav:typeof i.carddav=="boolean"?i.carddav:r.carddav,tasks:typeof i.tasks=="boolean"?i.tasks:r.tasks,notes:typeof i.notes=="boolean"?i.notes:r.notes,files:typeof i.files=="boolean"?i.files:r.files}}e.portalUi={timeFormat:a==="12h"||a==="24h"?a:"auto",weekStart:s==="monday"||s==="sunday"?s:"auto",logLevel:t.logLevel||"off",services:l},tn(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function z(e,t){if(t==="admin")return!0;const a=e.portalUi.services;if(!a)return!0;switch(t){case"calendars":return a.caldav;case"contacts":return a.carddav;case"tasks":return a.tasks;case"notes":return a.notes;case"files":return a.files;default:return!0}}function Xe(e){const t=["calendars","contacts","tasks","notes","files"];for(const a of t)if(z(e,a))return a;return"calendars"}function Ot(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function Dt(e,t){if(Ot(e),!e.user)return;const a=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},a)}function pn(e,t){Ot(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.calendarSelectionSeeded=!1,e.listKeyboardFocus=!1,e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function fn(e,t){if(!e.handlingSessionExpiry){if(!e.user){Ot(e);return}e.handlingSessionExpiry=!0;try{h.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function bn(e,t){const a=String(t.step||"");a==="upgrade"||a==="initialize"||a==="permissions"||a==="database"?(e.installGate={step:a,message:t.message||(a==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function gn(e,t){if(!(t instanceof O)||t.status!==503)return!1;const a=typeof t.payload.code=="string"?t.payload.code:"";if(a!=="upgrade_required"&&a!=="not_configured"&&a!=="admin_password_missing")return!1;const s=a==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:s,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function ka(e){var a,s,n,l;const{state:t}=e;if(t.activeTab==="admin"&&de(t)&&Ne(t))try{t.adminPage==="overview"&&((a=e.adminPageMeta("overview"))==null?void 0:a.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((s=e.adminPageMeta("users"))==null?void 0:s.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((n=e.adminPageMeta("settings"))==null?void 0:n.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((l=e.adminPageMeta("database"))==null?void 0:l.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(r){h.warn("admin page load",r instanceof Error?r.message:r)}}async function yn(e){var a;const{state:t}=e;h.event("bootstrap.start"),nn(s=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(s)?s:"Your session timed out. Please sign in again.")}),sn(()=>{Dt(t,s=>e.handleSessionExpired(s))});try{const s=await w.installStatus();bn(t,s)}catch(s){h.debug("bootstrap: /api/install/status failed",s instanceof Error?s.message:s)}try{const s=await w.ui();Je(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""?t.appVersion=s.version.trim():s.ui&&typeof s.ui.version=="string"&&s.ui.version.trim()!==""&&(t.appVersion=s.ui.version.trim())}catch(s){h.debug("bootstrap: /api/ui failed",s instanceof Error?s.message:s),gn(t,s)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),h.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const s=await w.me();if(!s.user)e.clearPortalSessionState(),Je(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),h.event("bootstrap.anonymous");else{if(t.user=s.user,Je(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),h.event("bootstrap.session",{username:((a=t.user)==null?void 0:a.username)??null}),Dt(t,n=>e.handleSessionExpired(n)),de(t))try{await e.loadAdminCapabilities()}catch(n){h.warn("admin.capabilities bootstrap",n instanceof Error?n.message:n)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await ka(e)}}catch(s){s instanceof O&&s.status===401?(e.clearPortalSessionState(),h.event("bootstrap.anonymous")):(h.error("bootstrap failed",s instanceof Error?s.message:s),$a(t,"error",s instanceof Error?s.message:"Failed to load"))}e.render()}async function vn(e,t){var r;const{state:a}=t,s=new FormData(e),n=String(s.get("username")??""),l=String(s.get("password")??"");a.busy=!0,t.clearFlash(),t.render(),h.event("login.attempt",{username:n});try{const i=await w.login(n,l);if(a.user=i.user,Je(a,i.ui),h.event("login.ok",{username:((r=a.user)==null?void 0:r.username)??n}),Dt(a,o=>t.handleSessionExpired(o)),de(a))try{await t.loadAdminCapabilities()}catch(o){h.warn("admin.capabilities login",o instanceof Error?o.message:o)}t.normalizeActiveTab(),t.persistTab(a.activeTab,a.adminPage),await t.loadHome(),await ka(t),t.setFlash("success","Signed in")}catch(i){h.warn("login.failed",i instanceof Error?i.message:i),t.setFlash("error",i instanceof Error?i.message:"Login failed")}finally{a.busy=!1,t.render()}}function Gt(e,t,a){const s=t.installGate,n=s&&(s.step==="upgrade"||s.step==="initialize"||s.step==="permissions"||s.step==="database"),l=(s==null?void 0:s.installUrl)||"/portal/install/";let r="";if(n&&s){const o=s.step==="upgrade"?"Server upgrade required":"Setup incomplete",c=s.step==="upgrade"&&(s.configuredVersion||s.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${d(String(s.configuredVersion||"—"))}</span>
              → product <span class="mono">${d(String(s.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${d(o)}.</strong>
            ${d(s.message||"Complete the installer before signing in.")}
            ${c}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${d(l)}">Open installer</a>
        </p>`}const i=t.busy||!!n;e.innerHTML=a(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials.</p>
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
            This portal is for calendars, contacts, tasks/notes and files.
          </p>
        </div>
      </div>`,{auth:!0})}function Qt(e){const t=e.querySelector(".contacts-table-wrap"),a=e.querySelector(".contacts-ab-list"),s=e.querySelector(".calendars-owned-list"),n=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(a==null?void 0:a.scrollTop)??null,calListTop:(s==null?void 0:s.scrollTop)??null,filesTableTop:(n==null?void 0:n.scrollTop)??null}}function Xt(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const a=e.querySelector(".contacts-table-wrap");a&&(a.scrollTop=t.tableTop)}if(t.abListTop!==null){const a=e.querySelector(".contacts-ab-list");a&&(a.scrollTop=t.abListTop)}if(t.calListTop!==null){const a=e.querySelector(".calendars-owned-list");a&&(a.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const a=e.querySelector(".files-table-wrap");a&&(a.scrollTop=t.filesTableTop)}})})}function $n(e){const t=e.confirmDelete;if(!t)return"";const a=t.detail?`<p class="muted small" style="margin:0.75rem 0 0">${d(t.detail)}</p>`:"";return U({id:"portal-confirm-delete-modal",title:t.title,titleId:"portal-confirm-delete-title",closeAction:"confirm-delete-cancel",size:"sm",body:`<p style="margin:0">${d(t.message)}</p>${a}`,footer:[{label:"Cancel",action:"confirm-delete-cancel",variant:"ghost",disabled:e.busy},{label:"Delete",action:"confirm-delete-ok",variant:"danger",disabled:e.busy}]})}function Zt(e){e.confirmDelete=null}const kn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Download (files), create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function M(e,t,a="h2"){const s=a;return`<div class="section-title-row">
    <${s}>${d(e)}</${s}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(t)}"
      aria-label="About ${d(e)}" title="About ${d(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function hn(){return`
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
    </div>`}function gt(e,t,a={},s){const n=!!e.user&&e.activeTab==="admin"&&de(e)&&Ne(e),i=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${n?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${d(n?"Administration Portal":"User Portal")}</span></span>`,o=e.user?d(e.user.displayname||e.user.username):"",c=Ne(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",p=n?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",m=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${o}">
              <span class="user-menu-name">${o}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${e.userMenuOpen?"":"hidden"}>
              ${p}
              ${c}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",u=e.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${i}</a>
          <div class="topnav-right">
            ${m}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${i}</a>
        </nav>`,y=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesUploadConflict!==null||e.filesUploadProgress!==null||e.confirmDelete!==null)?St(e):"",f=a.tabs&&a.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${a.tabs}
        </div>
      </div>`:"",$=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${d(e.appVersion)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(on)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return a.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${u}
      ${f}
    </div>
      <main class="container">
        ${y}
        ${t}
      </main>
      ${$}
      ${hn()}
      ${$n(e)}
      ${s.renderImportProgressModal()}
      ${s.renderFilesUploadProgressModal()}`}function Ct(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function wn(e,t){Ct(e),e.userMenuDocClick=s=>{var l;const n=s.target;(l=n==null?void 0:n.closest)!=null&&l.call(n,".user-menu")||(e.userMenuOpen=!1,Ct(e),t())};const a=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===a&&document.addEventListener("click",a,!0)},0)}function Ze(e){e.dtPickerDocClick&&(document.removeEventListener("click",e.dtPickerDocClick,!0),e.dtPickerDocClick=null)}function Sn(e,t){if(Ze(e),!e.eventDtPicker)return;e.dtPickerDocClick=s=>{var l,r;const n=s.target;(l=n==null?void 0:n.closest)!=null&&l.call(n,".dt-field.is-open, .dt-popover, [data-dt-popover]")||(r=n==null?void 0:n.closest)!=null&&r.call(n,'[data-action="dt-open"]')||(e.eventDtPicker=null,Ze(e),t())};const a=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===a&&document.addEventListener("click",a,!0)},0)}async function Z(e){e.state.filesLoading=!0;try{h.debug("loadFiles",{path:e.state.filesPath});const[t,a]=await Promise.all([w.filesStatus(),w.filesList(e.state.filesPath).catch(s=>{if(s instanceof O&&(s.status===503||s.status===404))return{path:e.state.filesPath,entries:[]};throw s})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=a.path,e.state.filesEntries=a.entries;const s=new Set(e.state.filesEntries.map(n=>n.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(n=>s.has(n))}else e.state.filesEntries=[],e.state.checkedFilePaths=[];h.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function ha(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function Me(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function ot(e,t,a){for(const s of a)if(s&&(t===s||t.startsWith(`${s}/`)))return!0;return!1}function K(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function qe(e,t,a){if(a.length===0)return;e.state.filesTransfer={op:t,paths:[...a]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const s=new Set([""]);if(e.state.filesPath){const n=e.state.filesPath.split("/").filter(Boolean);let l="";for(const r of n)l=l?`${l}/${r}`:r,s.add(l)}e.state.filesTreeExpanded=[...s],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),e.clearFlash(),e.render(),await Promise.all([...s].map(n=>Et(e,n)))}async function Et(e,t){const a=e.state.filesTreeChildren[t];if(!(a&&a!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const n=(await w.filesList(t)).entries.filter(l=>l.type==="dir").slice().sort((l,r)=>l.name.localeCompare(r.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:n}}catch(s){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},h.warn("files.tree",{path:t||"/",error:s instanceof Error?s.message:String(s)})}e.render()}}function Dn(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,a=[],s=(n,l)=>{const r=e.state.filesTransferDest===n,i=ot(e,n,t),o=e.state.filesTreeExpanded.includes(n),c=e.state.filesTreeChildren[n],p=Array.isArray(c),m=n===""||c==="loading"||c==="error"||!p||c.length>0,u=n===""?"Home":Me(n),b=i?"Cannot use a selected item (or a folder inside it) as the destination":n===""?"File home host.root":n,y=o?"▾":"▸";if(a.push(`<div class="files-tree-row${r?" is-selected":""}${i?" is-blocked":""}" style="--depth:${l}" role="treeitem" aria-selected="${r}" aria-expanded="${o}" aria-disabled="${i}">
      ${m?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${d(n)}"
              aria-label="${o?"Collapse":"Expand"} ${d(u)}" ${e.state.busy?"disabled":""}>${y}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${r?" is-selected":""}" data-action="files-tree-select" data-path="${d(n)}"
        title="${d(b)}" ${e.state.busy||i?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${d(u)}</span>
      </button>
    </div>`),!!o){if(c==="loading"){a.push(`<div class="files-tree-status muted small" style="--depth:${l+1}">Loading…</div>`);return}if(c==="error"){a.push(`<div class="files-tree-status muted small" style="--depth:${l+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${d(n)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(p){for(const f of c)s(f.path,l+1);c.length===0&&n===""&&a.push(`<div class="files-tree-status muted small" style="--depth:${l+1}">No subfolders yet — destination will be Home.</div>`)}}};return s("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${a.join("")}</div>`}async function Cn(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const a=new FormData(t),s=(e.state.filesTransferDest||String(a.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),n=String(a.get("newName")??"").trim(),l=e.state.filesTransfer.op,r=[...e.state.filesTransfer.paths],i=r.length>1;if(ot(e,s,r)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let o=0;const c=[];try{for(const m of r)try{if(l==="copy"){const u=Me(m),b=i||!n||n===u?void 0:n,y=await w.filesCopy(m,{to:s,newName:b});h.event("files.copy",{path:m,to:y.entry.path})}else{const u=Me(m),b=i||!n||n===u?void 0:n;await w.filesMove(m,s,b),h.event("files.move",{path:m,to:s})}o+=1}catch(u){c.push(`${Me(m)}: ${u instanceof Error?u.message:"failed"}`)}K(e),e.state.checkedFilePaths=[],await Z(e);const p=l==="copy"?"Copied":"Moved";o>0&&c.length===0?e.setFlash("success",o===1?`${p} 1 item`:`${p} ${o} items`):o>0?e.setFlash("info",`${p} ${o}; ${c.length} failed. ${c[0]}`):e.setFlash("error",c[0]||`${l==="copy"?"Copy":"Move"} failed`)}catch(p){e.setFlash("error",p instanceof Error?p.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function Tt(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function wa(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function Sa(e,t=!0){return Array.from(e).map(s=>{const l=(s.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")||s.name;return{file:s,relativePath:l||s.name}})}function En(e){return new Promise((t,a)=>{const s=[],n=()=>{e.readEntries(l=>{if(!l.length){t(s);return}s.push(...l),n()},l=>a(l))};n()})}function Tn(e){return new Promise((t,a)=>{e.file(t,a)})}async function Da(e,t){const a=Tt(t,e.name);if(e.isFile)return[{file:await Tn(e),relativePath:a||e.name}];if(e.isDirectory){const s=e.createReader(),n=await En(s);if(n.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const l=[];for(const r of n)l.push(...await Da(r,a));return l}return[]}async function*Pn(e){const t=e;if(typeof t.values=="function"){for await(const a of t.values())yield a;return}if(typeof t.entries=="function")for await(const[,a]of t.entries())yield a}async function Mt(e,t){const a=Tt(t,e.name),s=[];let n=0;for await(const l of Pn(e))if(n+=1,l.kind==="file"){const r=await l.getFile();s.push({file:r,relativePath:Tt(a,l.name)||r.name})}else l.kind==="directory"&&s.push(...await Mt(l,a));return n===0&&s.push({file:null,relativePath:a,isEmptyDir:!0}),s}async function An(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const a=[];for(const s of t){const n=await s.getFile();a.push({file:n,relativePath:n.name})}return{kind:"items",items:a}}catch(t){return wa(t)?{kind:"cancel"}:{kind:"fallback"}}}async function Fn(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),a=await Mt(t,"");return a.length===0?{kind:"cancel"}:{kind:"items",items:a}}catch(t){return wa(t)?{kind:"cancel"}:{kind:"fallback"}}}function ea(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function Un(e){const t=e.files?Array.from(e.files):[],a=[],s=[],n=e.items?Array.from(e.items):[];for(const l of n){if(l.kind!=="file")continue;const r=l;typeof r.getAsFileSystemHandle=="function"?a.push(r.getAsFileSystemHandle().catch(()=>null)):a.push(Promise.resolve(null));let i=null;if(typeof r.webkitGetAsEntry=="function")try{i=r.webkitGetAsEntry()}catch{i=null}s.push(i)}return{handlePromises:a,entries:s,files:t}}async function In(e){var l,r;const t=[],a=await Promise.all(e.handlePromises);for(let i=0;i<Math.max(a.length,e.entries.length);i++){const o=a[i]??null;if(o)try{if(o.kind==="file"){const p=await o.getFile();t.push({file:p,relativePath:p.name})}else o.kind==="directory"&&t.push(...await Mt(o,""));continue}catch{}const c=e.entries[i];if(c)try{t.push(...await Da(c,""))}catch{}}const s=Sa(e.files,!0),n=new Map;for(const i of s){const o=ea(i.relativePath||((l=i.file)==null?void 0:l.name)||"");o&&n.set(o,i)}for(const i of t){const o=ea(i.relativePath||((r=i.file)==null?void 0:r.name)||"");o&&n.set(o,i)}return Array.from(n.values())}function On(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function Ca(e,t=80){const a=String(e??"").replace(/\s+/g," ").trim();return a?a.length>t?`${a.slice(0,t-1)}…`:a:""}function ae(e,t,a){const s=Ca(t);return s?`${e} “${s}” ${a}`:`${e} ${a}`}function yt(e){const t=Ca(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(s=>String(s??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function Ea(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function et(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function H(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),s=t%60;return a>0?`${a}m ${s}s`:`${s}s`}function be(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Mn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function G(e,t,a,s,n,l=""){const r=a===t,i=r?s==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${r?" is-sorted":""}${l?" "+l:""}`}" data-action="sort-${n}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${i}</th>`}function ee(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function Nn(e){ee(e),e.state.filesUploadMenuDocClick=a=>{var n;const s=a.target;(n=s==null?void 0:s.closest)!=null&&n.call(s,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,ee(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function ke(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function xn(e){ke(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){ke(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},ye(e,e.state.filesUploadProgress)},1e3)}function Ta(e){ke(e),e.state.filesUploadProgress=null,e.render()}function Pa(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function ye(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const a=e.root.querySelector(".files-upload-progress-bar"),s=e.root.querySelector(".files-upload-progress-track"),n=e.root.querySelector("[data-files-upload-status]"),l=e.root.querySelector("[data-files-upload-current]"),r=Pa(e,t),i=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${H(t.elapsedSec)}`:(n==null?void 0:n.textContent)||"";n&&t.phase==="uploading"&&(n.textContent=i),l&&t.phase==="uploading"&&(l.textContent=t.currentName||"",l.title=t.currentName||""),a&&r!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${r}%`),s&&r!==null&&(s.setAttribute("aria-valuenow",String(r)),s.removeAttribute("aria-valuetext"))}function Be(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,a=t.phase==="uploading",s=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",n=Pa(e,t),l=n===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",r=n!==null?` style="width:${n}%"`:"";let i="";if(a){const c=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${n!==null?` (${n}%)`:""} · ${H(t.elapsedSec)}`,p=t.bytesTotal>0?`${et(t.bytesSent)} / ${et(t.bytesTotal)}`:"";i=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${p?` · <span class="muted">${d(p)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${n!==null?`aria-valuenow="${n}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${l}"${r}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${d(c)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${d(t.currentName)}">${d(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")i=`
      ${W("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${d(H(t.elapsedSec))}</p>`;else{const c=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(p=>`<li>${d(p)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";i=`
      ${W("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${c}
      <p class="muted small" style="margin:0.75rem 0 0">After ${d(H(t.elapsedSec))}</p>`}const o=a?'<p class="muted small" style="margin:0">Please wait…</p>':It([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return U({title:s,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:a,lockBackdrop:a,body:i,footer:o})}async function ta(e,t,a,s){const n=a.replace(/\\/g,"/").split("/").map(r=>r.trim()).filter(Boolean);let l=t;for(const r of n){const i=ha(l,r);if(s.has(i)){l=i;continue}try{await w.filesMkdir(l,r),h.event("files.mkdir",{path:l,name:r,via:"upload-folder"})}catch(o){if(!(o instanceof O&&o.status===409))throw o}s.add(i),l=i}}function Ln(e,t){var s;const a=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(s=e.root.querySelector(a))==null||s.click()}async function aa(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,ee(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,K(e),e.state.filesMkdirOpen=!1;const a=t==="files"?An:Fn;try{const s=await a();if(s.kind==="cancel"){e.render();return}if(s.kind==="items"){if(s.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await xt(e,s.items);return}e.render(),requestAnimationFrame(()=>{Ln(e,t)})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not open picker"),e.render()}}function dt(e,t){return`${e}\0${t}`}function _n(e,t){return t.map(a=>{const s=a.file,n=(a.relativePath||s.name).replace(/\\/g,"/"),l=n.split("/").filter(Boolean),r=l.pop()||s.name,i=l.join("/"),o=ha(e,i);return{item:a,file:s,fileName:r,parentPath:o,displayName:n||r,relDir:i}})}function Rn(e){const t=new Set,a=[];for(const s of e){const n=dt(s.parentPath,s.fileName);t.has(n)||(t.add(n),a.push(s))}return a}async function qn(e,t){if(t.length===0)return[];const a=new Map;for(const n of t){const l=a.get(n.parentPath)??[];l.push(n),a.set(n.parentPath,l)}const s=[];for(const[n,l]of a){let r=new Map;try{const i=await w.filesList(n);r=new Map;for(const o of i.entries)(o.type==="file"||o.type==="dir")&&r.set(o.name,o.type)}catch{r=new Map}for(const i of l)r.has(i.fileName)&&s.push(i)}return s.sort((n,l)=>n.displayName.localeCompare(l.displayName)),s}const Nt=new WeakMap;function vt(e){e&&(Nt.delete(e.state),e.state.filesUploadConflict=null)}function Ye(e,t){var p;const a=Nt.get(e.state),s=e.state.filesUploadConflict;if(t==="cancel"){vt(e),e.setFlash("info","Upload cancelled"),e.render();return}if(!a){e.state.filesUploadConflict=null,e.setFlash("error","Upload session expired — drop or choose the files again"),e.render();return}const n=new Set(((p=s==null?void 0:s.conflictKeys)!=null&&p.length?s.conflictKeys:a.conflictKeys)??[]);let l=a.planned,r=new Set,i=0;if(t==="overwrite")r=new Set(n);else{const m=[];for(const u of a.planned){const b=dt(u.parentPath,u.fileName);n.has(b)?i+=1:m.push(u)}if(l=m,h.event("files.upload.skip_existing",{skipped:i,remaining:l.length,total:a.planned.length,conflictKeys:n.size}),l.length===0&&a.emptyDirs.length===0){vt(e),e.setFlash("info",i===1?"Nothing to upload — the selected file already exists":`Nothing to upload — all ${i} selected files already exist`),e.render();return}}const o=a.destBase,c=a.emptyDirs;vt(e),Aa(e,l,c,o,r)}async function xt(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,ee(e),e.state.filesUploadDropActive=!1;const a=t.filter(r=>r.file&&!r.isEmptyDir),s=t.filter(r=>r.isEmptyDir&&r.relativePath),n=e.state.filesPath,l=Rn(_n(n,a));if(h.event("files.upload.plan",{destBase:n||"/",files:l.length,emptyDirs:s.length,sample:l.slice(0,5).map(r=>({display:r.displayName,parent:r.parentPath||"/",name:r.fileName}))}),l.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await qn(n,l);if(r.length>0){const i=r.map(o=>dt(o.parentPath,o.fileName));Nt.set(e.state,{planned:l,emptyDirs:s,destBase:n,conflictKeys:i}),e.state.filesUploadConflict={names:r.map(o=>o.displayName),totalFiles:l.length,conflictCount:r.length,conflictKeys:i},h.event("files.upload.conflicts",{total:l.length,conflicts:r.length,names:r.slice(0,12).map(o=>o.displayName)}),e.state.busy=!1,e.render();return}}catch(r){e.state.busy=!1,e.setFlash("error",r instanceof Error?r.message:"Could not check existing files"),e.render();return}}await Aa(e,l,s,n,new Set)}async function Aa(e,t,a,s,n){var b,y;const l=t.reduce((f,$)=>f+($.file.size||0),0),r=Date.now(),i=t.length+a.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((b=t[0])==null?void 0:b.displayName)||((y=a[0])==null?void 0:y.relativePath)||"",bytesTotal:l,bytesSent:0,startedAt:r,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),xn(e),e.render();let o=0;const c=[],p=new Set;let m=0,u=0;try{for(const k of a){const S=k.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(S){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:S+"/",elapsedSec:Math.floor((Date.now()-r)/1e3)},ye(e,e.state.filesUploadProgress));try{await ta(e,s,S,p)}catch(v){c.push(`${S}/: ${v instanceof Error?v.message:"failed"}`)}}}for(const k of t){const{file:S,fileName:v,parentPath:g,displayName:D,relDir:P}=k;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:D,bytesSent:m,elapsedSec:Math.floor((Date.now()-r)/1e3)},ye(e,e.state.filesUploadProgress));try{P&&await ta(e,s,P,p);const F=n.has(dt(g,v));await w.filesUpload(g,S,{replace:F,onProgress:(I,_)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const T=_>0?_:S.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:D,bytesSent:m+Math.min(I,T||I),elapsedSec:Math.floor((Date.now()-r)/1e3)},ye(e,e.state.filesUploadProgress)}}),h.event("files.upload",{path:g,name:v,size:S.size,relativePath:D,replace:F}),o+=1,F&&(u+=1),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m},ye(e,e.state.filesUploadProgress))}catch(F){const I=`${D}: ${F instanceof Error?F.message:"failed"}`;c.push(I),m+=S.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:c.length,bytesSent:m,errorSamples:c.slice(0,12)},ye(e,e.state.filesUploadProgress))}}await Z(e),ke(e);const f=Math.floor((Date.now()-r)/1e3),$=t.length;if(o>0&&c.length===0){let k=o===1?"Uploaded 1 file":`Uploaded ${o} files`;u>0&&(k+=u===1?" (1 overwritten)":` (${u} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max($,1),completedFiles:o,failedFiles:0,currentName:"",bytesTotal:l,bytesSent:l,startedAt:r,elapsedSec:f,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else if(o>0){const k=`Uploaded ${o}; ${c.length} failed. ${c[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max($,1),completedFiles:o,failedFiles:c.length,currentName:"",bytesTotal:l,bytesSent:l,startedAt:r,elapsedSec:f,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("info",k)}else if(i>0&&c.length===0&&a.length>0){const k=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:r,elapsedSec:f,resultMessage:k,errorSamples:[]},e.setFlash("success",k)}else{const k=c[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max($,1),completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:l,bytesSent:0,startedAt:r,elapsedSec:f,resultMessage:k,errorSamples:c.slice(0,12)},e.setFlash("error",k)}}catch(f){ke(e);const $=f instanceof Error?f.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:o,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:l,bytesSent:m,startedAt:r,elapsedSec:Math.floor((Date.now()-r)/1e3),resultMessage:$,errorSamples:c.length?c.slice(0,12):[$]},e.setFlash("error",$)}finally{e.state.busy=!1,e.render()}}function na(e,t,a){const s=t.files;if(!s||s.length===0)return;const n=Sa(s,a);t.value="",xt(e,n)}function Bn(e,t){const a=t?t.split("/").filter(Boolean):[];let s="";const n=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const l of a){s=s?`${s}/${l}`:l;const r=s;n.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),n.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(r)}" ${e.state.busy?"disabled":""}>${d(l)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${n.join("")}</nav>`}function Vn(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
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
    </div>`;const a=t.quotaBytes>0?`${be(t.usedBytes)} used · ${be(t.availableBytes)} free of ${be(t.quotaBytes)}`:`${be(t.usedBytes)} used · ${be(t.availableBytes)} free (no app quota)`,s=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,n=e.state.checkedFilePaths.length,l=e.state.filesEntries.length>0&&e.state.filesEntries.every(v=>e.state.checkedFilePaths.includes(v.path)),r=n>0,i=e.state.filesEntries.filter(v=>v.type==="dir").length,o=e.state.filesEntries.length-i,c=n>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
          <span class="muted small">${n} selected</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>
        </div>`:"",p=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const v=[];i>0&&v.push(`${i} folder${i===1?"":"s"}`),o>0&&v.push(`${o} file${o===1?"":"s"}`);const g=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return v.length===2?`${g} · ${v.join(", ")}`:v[0]??g})(),m=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':e.state.filesEntries.map(v=>{const g=e.state.checkedFilePaths.includes(v.path),D=v.type==="dir"?"📁":"📄",P=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${D}</span>${d(v.name)}
                  </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${D}</span>${d(v.name)}</span>`,F=v.type==="dir"?"—":be(v.size);return`<tr class="files-row${g?" is-checked":""}" data-path="${d(v.path)}" data-type="${v.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${d(v.path)}"
                  ${g?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${d(v.name)}" />
              </td>
              <td class="files-col-name">${P}</td>
              <td class="files-col-size mono">${F}</td>
              <td class="files-col-mtime hide-sm">${d(Mn(v.mtime))}</td>
              <td class="files-col-actions">
                ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${d(w.filesDownloadUrl(v.path))}" download="${d(v.name)}" data-action="files-download">Download</a>`:""}
                <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>Copy</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${d(v.path)}" ${e.state.busy?"disabled":""}>Move</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${e.state.busy?"disabled":""}>Rename</button>
                <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${e.state.busy?"disabled":""}>Delete</button>
              </td>
            </tr>`}).join(""),u=e.state.filesRenamePath!==null?(()=>{const v=e.state.filesEntries.find(D=>D.path===e.state.filesRenamePath),g=(v==null?void 0:v.name)??"";return U({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${d(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${d(g)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",b=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const v=e.state.filesDeletePaths,g=v.length>1,D=e.state.filesEntries.find(I=>I.path===v[0]),P=g?`Delete ${v.length} items`:`Delete ${(D==null?void 0:D.type)==="dir"?"folder":"file"}`,F=g?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${v.slice(0,12).map(I=>{const _=e.state.filesEntries.find(T=>T.path===I);return`<li><span class="mono">${d((_==null?void 0:_.name)??I)}</span></li>`}).join("")}
                 ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${d((D==null?void 0:D.name)??v[0])}</strong>?${(D==null?void 0:D.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return U({id:"files-delete-modal",title:P,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:F,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",y=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const v=e.state.filesTransfer.op,g=e.state.filesTransfer.paths,D=g.length>1,P=e.state.filesEntries.find(x=>x.path===g[0]),F=(P==null?void 0:P.name)??Me(g[0]),I=D?`${v==="copy"?"Copy":"Move"} ${g.length} items`:`${v==="copy"?"Copy":"Move"} ${(P==null?void 0:P.type)==="dir"?"folder":"file"}`,_=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,T=ot(e,e.state.filesTransferDest,g);return U({id:"files-transfer-modal",title:I,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${D?`<p class="muted small" style="margin:0 0 0.75rem">${g.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${d(F)}</span></p>`}
                  <input type="hidden" name="toPath" value="${d(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${d(_)}">${d(_)}</span>
                    </div>
                    ${Dn(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${D?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${d(F)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${v==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:v==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||T}]})})():"",f=e.state.filesMkdirOpen?U({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${d(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",$=e.state.filesUploadConflict?(()=>{const v=e.state.filesUploadConflict,g=v.conflictCount,D=Math.max(0,v.totalFiles-g),P=g===1?"1 file already exists in the destination.":`${g} of ${v.totalFiles} files already exist in the destination.`,F=D>0?D===1?" Skip existing keeps the other 1 new file.":` Skip existing keeps the other ${D} new files.`:" Skip existing cancels the upload (nothing new to send).",I=v.names.slice(0,12).map(T=>`<li><span class="mono">${d(T)}</span></li>`).join(""),_=v.names.length>12?`<li class="muted">…and ${v.names.length-12} more</li>`:"";return U({id:"files-upload-conflict-modal",title:g===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${d(P)}${d(F)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${I}
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
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${s}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${s}%"></div>
          </div>
          <span>${d(a)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${Bn(e,e.state.filesPath)}
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
                  ${l?"checked":""}
                  ${r&&!l?"data-indeterminate=1":""}
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
        ${n>0?`${n} of ${e.state.filesEntries.length} selected`:d(p)}
      </div>
    </section>
    ${u}
    ${b}
    ${y}
    ${f}
    ${$}
  </div>`}async function Hn(e,t){const a=new FormData(t),s=String(a.get("path")??""),n=String(a.get("newName")??"").trim();if(!s||!n){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await w.filesRename(s,n),h.event("files.rename",{path:s,newName:n}),e.state.filesRenamePath=null,await Z(e),e.setFlash("success",`Renamed to “${n}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function Kn(e,t){const a=new FormData(t),s=String(a.get("name")??"").trim();if(!s){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await w.filesMkdir(e.state.filesPath,s),h.event("files.mkdir",{path:e.state.filesPath,name:s}),e.state.filesMkdirOpen=!1,await Z(e),e.setFlash("success",`Created folder “${s}”`)}catch(n){e.setFlash("error",n instanceof Error?n.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function zn(e,t,a,s){const{state:n}=e;if(t==="files-upload-menu-toggle")return n.busy||n.filesUploadProgress||(n.filesUploadMenuOpen=!n.filesUploadMenuOpen,n.filesUploadMenuOpen&&(n.filesRenamePath=null,n.filesDeletePaths=null,K(e),n.filesMkdirOpen=!1),e.render()),!0;if(t==="files-upload-files")return aa(e,"files"),!0;if(t==="files-upload-folder")return aa(e,"folder"),!0;if(t==="files-nav"){const l=a.dataset.path??"";n.filesPath=l,n.filesRenamePath=null,n.filesDeletePaths=null,n.filesTransfer=null,n.filesMkdirOpen=!1,n.checkedFilePaths=[],n.busy=!0,e.clearFlash(),e.render();try{await Z(e)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Failed to open folder")}finally{n.busy=!1,e.render()}return!0}if(t==="files-toggle"){s.stopPropagation();const l=a.dataset.path??"";return l&&(a.checked?n.checkedFilePaths.includes(l)||(n.checkedFilePaths=[...n.checkedFilePaths,l]):n.checkedFilePaths=n.checkedFilePaths.filter(i=>i!==l),e.render()),!0}if(t==="files-select-all"){s.stopPropagation();const l=a.checked;return n.checkedFilePaths=l?n.filesEntries.map(r=>r.path):[],e.render(),!0}if(t==="files-copy"){const l=a.dataset.path??"";return l&&qe(e,"copy",[l]),!0}if(t==="files-move"){const l=a.dataset.path??"";return l&&qe(e,"move",[l]),!0}if(t==="files-bulk-copy")return n.checkedFilePaths.length===0||qe(e,"copy",[...n.checkedFilePaths]),!0;if(t==="files-bulk-move")return n.checkedFilePaths.length===0||qe(e,"move",[...n.checkedFilePaths]),!0;if(t==="files-tree-select"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const l=a.dataset.path??"";return ot(e,l,n.filesTransfer.paths)||(n.filesTransferDest=l,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const l=a.dataset.path??"";if(t==="files-tree-retry"){const i={...n.filesTreeChildren};return delete i[l],n.filesTreeChildren=i,n.filesTreeExpanded.includes(l)||(n.filesTreeExpanded=[...n.filesTreeExpanded,l]),Et(e,l),!0}return n.filesTreeExpanded.includes(l)?(n.filesTreeExpanded=n.filesTreeExpanded.filter(i=>i!==l),e.render()):(n.filesTreeExpanded=[...n.filesTreeExpanded,l],Et(e,l)),!0}if(t==="files-transfer-close")return K(e),e.render(),!0;if(t==="files-bulk-delete")return n.checkedFilePaths.length===0||(n.filesDeletePaths=[...n.checkedFilePaths],n.filesRenamePath=null,K(e),e.render()),!0;if(t==="files-refresh"){n.busy=!0,e.clearFlash(),e.render();try{await Z(e),e.setFlash("success","Refreshed")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Refresh failed")}finally{n.busy=!1,e.render()}return!0}if(t==="files-mkdir")return n.filesMkdirOpen=!0,n.filesUploadMenuOpen=!1,ee(e),n.filesUploadDropActive=!1,n.filesRenamePath=null,n.filesDeletePaths=null,K(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return n.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open")return n.filesRenamePath=a.dataset.path??null,n.filesDeletePaths=null,K(e),n.filesUploadMenuOpen=!1,ee(e),e.render(),!0;if(t==="files-rename-close")return n.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const l=a.dataset.path??"";return n.filesDeletePaths=l?[l]:null,n.filesRenamePath=null,K(e),n.filesUploadMenuOpen=!1,ee(e),e.render(),!0}if(t==="files-delete-close")return n.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const l=n.filesDeletePaths?[...n.filesDeletePaths]:[];if(l.length===0)return!0;n.busy=!0,e.clearFlash(),e.render();try{if(l.length===1)await w.filesDelete(l[0]),h.event("files.delete",{path:l[0]}),e.setFlash("success","Deleted");else{const r=await w.filesBulk("delete",l);h.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?e.setFlash("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?e.setFlash("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):e.setFlash("error",r.errors[0]||"Delete failed")}n.filesDeletePaths=null,n.checkedFilePaths=[],await Z(e)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Delete failed")}finally{n.busy=!1,e.render()}return!0}return t==="files-download"?(h.event("files.download",{path:a.getAttribute("href")??""}),!0):t==="close-files-upload-progress"?(n.filesUploadProgress&&(n.filesUploadProgress.phase==="done"||n.filesUploadProgress.phase==="error")&&Ta(e),!0):t==="files-upload-conflict-cancel"?(Ye(e,"cancel"),!0):t==="files-upload-conflict-skip"?(Ye(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(Ye(e,"overwrite"),!0):!1}function Fa(e){const{root:t}=e;t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(a=>{a.indeterminate=!0})}function jn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function ne(e,t){var s;const a=(s=e.state.adminCapabilities)==null?void 0:s.pages;return a?a.find(n=>n.id===t)??null:null}function we(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Le(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function Wn(e){var l;const t=["overview","settings","users","database"],a={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},s=(l=e.state.adminCapabilities)==null?void 0:l.pages,n=new Map;if(s)for(const r of s)jn(r.id)&&n.set(r.id,r);return t.map(r=>{const i=n.get(r),o=(i==null?void 0:i.label)||a[r],c=(i==null?void 0:i.status)??(r==="overview"?"read-only":"full"),p=(i==null?void 0:i.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===r?" is-active":""}${p?" is-gated":""}"
          data-action="admin-page" data-admin-page="${r}"
          aria-selected="${e.state.adminPage===r}"
          title="${d(o)}${p?" — "+we(e,c):""}">
          ${d(o)}
        </button>`}).join("")}function ct(e,t){const a=ne(e,t),s=(a==null?void 0:a.status)??"coming-soon",n=(a==null?void 0:a.label)??t,l=(a==null?void 0:a.summary)||"This area is not available in portal Administration yet.",r=we(e,s);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Le(e,s)}">${d(r)}</span>
      <h2 class="admin-coming-soon-title">${d(n)}</h2>
    </div>
    <p class="muted">${d(l)}</p>
  </section>`}function Se(e,t,a,s){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${d(String(a))}</div>
    <div class="admin-stat-label">${d(t)}</div>
    ${s?`<div class="admin-stat-hint muted small">${d(s)}</div>`:""}
  </div>`}function le(e,t,a){return`<span class="badge ${t?"badge-ok":"badge-off"}">${d(a)}: ${t?"On":"Off"}</span>`}function ie(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function Pt(e){var t;e.state.adminCapabilitiesError=null;try{const a=await w.adminCapabilities();e.state.adminCapabilities=a.data,h.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(a){e.state.adminCapabilitiesError=a instanceof Error?a.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},h.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function tt(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await w.adminDashboard();e.state.adminDashboard=t.data,h.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function ce(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await w.adminUsers();e.state.adminUsers=t.users??[],h.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function j(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const a=await w.adminUser(t);e.state.adminUserDetail=a.user,e.state.adminSelectedUsername=a.user.username,h.debug("admin.user",{username:a.user.username})}catch(a){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=a instanceof Error?a.message:"Failed to load user",a}finally{e.state.adminUserDetailLoading=!1}}async function ue(e,t){e.state.adminUserResourcesLoading=!0;try{const[a,s]=await Promise.all([w.adminUserCalendars(t),w.adminUserAddressBooks(t)]);e.state.adminUserCalendars=a.calendars??[],e.state.adminUserAddressBooks=s.addressbooks??[]}catch(a){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],a}finally{e.state.adminUserResourcesLoading=!1}}async function at(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await w.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function nt(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await w.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const a=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=a==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function Jn(e){var l;const t=ne(e,"overview");if(t&&t.available===!1)return ct(e,"overview");const a=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${d(((l=e.state.user)==null?void 0:l.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let s="",n="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)n='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)n=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${d(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const r=e.state.adminDashboard,i=r.services,o=r.links??{},c=t?`<span class="badge ${Le(e,t.status)}">${d(we(e,t.status))}</span>`:"",p=r.version?d(r.version):"—",m=r.git?d(r.git):"";s=`
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
              AngaraDAV <span class="badge badge-admin">v${p}</span>
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
                  <tr><td>Administration</td><td>${ie(e,i.administration!==!1&&i.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${ie(e,!!i.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${ie(e,!!i.carddav)}</td></tr>
                  <tr><td>Files</td><td>${ie(e,!!i.files)}</td></tr>
                  <tr><td>Tasks</td><td>${ie(e,!!i.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${ie(e,!!i.notes)}</td></tr>
                  <tr><td>Push</td><td>${ie(e,!!i.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${a}
      </section>`;const u=r.nbusers??r.users,b=r.nbcalendars??r.calendars,y=r.nbevents??r.events,f=r.nbbooks??r.addressBooks,$=r.nbcontacts??r.contacts;n=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${Se(e,"Registered users",u,"Users")}
          ${Se(e,"Calendars",b,"CalDAV")}
          ${Se(e,"Events",y,"CalDAV")}
          ${Se(e,"Address books",f,"CardDAV")}
          ${Se(e,"Contacts",$,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${le(e,i.administration!==!1&&i.webAdmin!==!1,"Administration")}
          ${le(e,!!i.caldav,"CalDAV")}
          ${le(e,!!i.carddav,"CardDAV")}
          ${le(e,!!i.files,"Files")}
          ${le(e,!!i.tasks,"Tasks")}
          ${le(e,!!i.notes,"Notes")}
          ${le(e,!!i.push,"Push")}
        </div>
      </section>`}else n=`<section class="card">
      ${M("System snapshot","admin-overview")}
      ${a}
    </section>`;return`${s}
    ${n}`}function Yn(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(a=>a.username.toLowerCase().includes(t)||(a.displayname||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)):e.state.adminUsers}function Gn(e){return e.state.adminUserCreateOpen?U({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function Qn(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return U({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
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
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function Xn(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,a=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(n=>n.username.toLowerCase()===t.toLowerCase())??null,s=a?`${a.displayname||a.username} (${a.username})`:t;return U({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${d(s)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${it({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${d(t)}"`}]})}function Zn(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
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
      </tr>`).join(""),n=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(c=>c.instanceId===e.state.adminCalEditId)??null:null,l=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(c=>c.id===e.state.adminAbEditId)??null:null,r=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&n?U({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
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
          <label class="check-row"><input type="checkbox" name="notes" ${n!=null&&n.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",i=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&l?U({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${l?l.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${d(l.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${d((l==null?void 0:l.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${d((l==null?void 0:l.description)??"")}</textarea>
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
        <tbody>${s}</tbody>
      </table>
    </div>
  </section>
  ${r}${i}${o}`}function es(e){const t=ne(e,"users");if(t&&t.available===!1)return ct(e,"users");const a=Yn(e),s=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':a.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?d(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:a.map(n=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===n.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${d(n.username)}" tabindex="0" role="button">
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
        ${M("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Le(e,t.status)}">${d(we(e,t.status))}</span>`:""}
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
    ${Zn(e)}
    ${Gn(e)}
    ${Qn(e)}
    ${Xn(e)}`}async function ts(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),l=String(a.get("email")??"").trim(),r=String(a.get("password")??""),i=String(a.get("passwordConfirm")??"");if(!s||!n||!l||!r){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(r!==i){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const o=await w.adminCreateUser({username:s,displayname:n,email:l,password:r,passwordConfirm:i});h.event("admin.user.create",{username:o.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=o.user.username,e.state.adminUserDetail=o.user,e.persistTab("admin","users",o.user.username),await ce(e),e.setFlash("success",`Created user “${o.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function as(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),l=String(a.get("email")??"").trim(),r=String(a.get("password")??""),i=String(a.get("passwordConfirm")??"");if(!s){e.setFlash("error","Username is required"),e.render();return}if(!n||!l){e.setFlash("error","Display name and email are required"),e.render();return}if(r!==""||i!==""){if(r===""||i===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(r!==i){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const o={displayname:n,email:l};r!==""&&(o.password=r,o.passwordConfirm=i);const c=await w.adminUpdateUser(s,o);h.event("admin.user.update",{username:c.user.username,passwordChanged:r!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=c.user,e.state.adminSelectedUsername=c.user.username,await ce(e),e.setFlash("success",r!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function ns(e,t){var c,p;if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),l=String(s.get("description")??"").trim(),r=String(s.get("calendarcolor")??"").trim(),i=((c=t.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,o=((p=t.querySelector('input[name="notes"]'))==null?void 0:p.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const m=String(s.get("uri")??"").trim().toLowerCase();await w.adminCreateUserCalendar(a,{uri:m,displayname:n,description:l,calendarcolor:r||void 0,todos:i,notes:o}),e.setFlash("success",`Created calendar “${n}”`)}else{const m=Number(s.get("instanceId"));await w.adminUpdateUserCalendar(a,m,{displayname:n,description:l,calendarcolor:r,todos:i,notes:o}),e.setFlash("success",`Updated calendar “${n}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await ue(e,a),await j(e,a)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function ss(e,t){if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),l=String(s.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const r=String(s.get("uri")??"").trim().toLowerCase();await w.adminCreateUserAddressBook(a,{uri:r,displayname:n,description:l}),e.setFlash("success",`Created address book “${n}”`)}else{const r=Number(s.get("id"));await w.adminUpdateUserAddressBook(a,r,{displayname:n,description:l}),e.setFlash("success",`Updated address book “${n}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await ue(e,a),await j(e,a)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const rs=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let ge=null;function ls(){if(ge)return ge;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return ge=[...t].sort((a,s)=>a.localeCompare(s)),ge}}catch{}return ge=[...rs],ge}function Ua(e){const t=e||"UTC",a=ls(),s=a.includes(t),n=a.map(l=>`<option value="${sa(l)}" ${l===t?"selected":""}>${ra(l)}</option>`);return!s&&t&&n.unshift(`<option value="${sa(t)}" selected>${ra(t)}</option>`),n.join("")}function sa(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function ra(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function is(e){const t=ne(e,"settings");if(t&&t.available===!1)return ct(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const a=e.state.adminSystemSettings;if(!a)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const s=(l,r,i)=>`<label class="check-row"><input type="checkbox" name="${d(l)}" ${r?"checked":""} ${e.state.busy||a.writable===!1?"disabled":""} /> ${d(i)}</label>`,n=(l,r,i,o="")=>`<label>${d(i)}
      <input type="number" name="${d(l)}" value="${d(String(r??0))}" ${e.state.busy||a.writable===!1?"disabled":""} />
      ${o?`<span class="muted small">${d(o)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${M("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Le(e,t.status)}">${d(we(e,t.status))}</span>`:""}
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
            ${["Digest","Basic","Apache"].map(l=>`<option value="${l}" ${a.dav_auth_type===l?"selected":""}>${l}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||a.writable===!1?"disabled":""}>
            ${Ua(a.timezone||"UTC")}
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
            ${["off","error","warn","info","debug"].map(l=>`<option value="${l}" ${(a.portal_log_level||"off")===l?"selected":""}>${l}</option>`).join("")}
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
            ${["off","error","warn","info","debug"].map(l=>`<option value="${l}" ${(a.push_log_level||"off")===l?"selected":""}>${l}</option>`).join("")}
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
    ${os(e)}`}function os(e){return e.state.adminResetModalOpen?U({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${it({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${d(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function ds(e,t){const a=new FormData(t),s=i=>{var o;return!!((o=t.querySelector(`input[name="${i}"]`))!=null&&o.checked)},n={cal_enabled:s("cal_enabled"),card_enabled:s("card_enabled"),tasks_enabled:s("tasks_enabled"),notes_enabled:s("notes_enabled"),files_enabled:s("files_enabled"),push_enabled:s("push_enabled"),portal_admin_ui_enabled:s("portal_admin_ui_enabled"),timezone:String(a.get("timezone")??"").trim(),invite_from:String(a.get("invite_from")??"").trim(),dav_auth_type:String(a.get("dav_auth_type")??"Digest"),files_storage_path:String(a.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(a.get("files_max_upload_mb")??0),files_quota_mb:Number(a.get("files_quota_mb")??0),files_quarantine_days:Number(a.get("files_quarantine_days")??0),session_max_age_minutes:Number(a.get("session_max_age_minutes")??15),portal_log_level:String(a.get("portal_log_level")??"off"),portal_admin_users:String(a.get("portal_admin_users")??"").trim(),push_external_url:String(a.get("push_external_url")??"").trim(),push_log_level:String(a.get("push_log_level")??"off")},l=String(a.get("admin_password")??""),r=String(a.get("admin_password_confirm")??"");(l!==""||r!=="")&&(n.admin_password=l,n.admin_password_confirm=r),e.state.busy=!0,e.clearFlash(),e.render();try{const i=await w.adminUpdateSystemSettings(n);e.state.adminSystemSettings=i.data;const o=i.data;e.state.portalUi={...e.state.portalUi,services:{caldav:!!o.cal_enabled,carddav:!!o.card_enabled,tasks:!!o.tasks_enabled,notes:!!o.notes_enabled,files:!!o.files_enabled}},h.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(i){e.setFlash("error",i instanceof Error?i.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function Ia(e,t){const a=new FormData(t),s=String(a.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",n={backend:s};return s==="sqlite"?n.sqlite_file=String(a.get("sqlite_file")??"").trim():(n.pgsql_host=String(a.get("pgsql_host")??"").trim(),n.pgsql_dbname=String(a.get("pgsql_dbname")??"").trim(),n.pgsql_username=String(a.get("pgsql_username")??"").trim(),n.pgsql_password=String(a.get("pgsql_password")??"")),n}function cs(e,t){e.state.adminDbPendingBody=Ia(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function us(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const a=Ia(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const s=await w.adminTestDatabaseConnection(a);e.setFlash("success",s.message||"Connection successful"),h.event("admin.database.test",{backend:s.backend})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function ms(e){const t=ne(e,"database");if(t&&t.available===!1)return ct(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${d(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const a=e.state.adminDatabaseSettings;if(!a)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const s=e.state.adminDbFormBackend,n=a.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${M("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Le(e,t.status)}">${d(we(e,t.status))}</span>`:""}
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
    ${ps(e)}`}function ps(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return U({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${d(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function Oa(e,t,a={}){if(!e.userIsAdmin()){await e.activateTab("calendars",a);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):a.username!==void 0&&(e.state.adminSelectedUsername=a.username,a.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),h.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),a.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await Pt(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const s=ne(e,t);t==="overview"&&(s==null?void 0:s.available)!==!1?await tt(e):t==="users"&&(s==null?void 0:s.available)!==!1?(await ce(e),e.state.adminSelectedUsername&&(await j(e,e.state.adminSelectedUsername),await ue(e,e.state.adminSelectedUsername))):t==="settings"&&(s==null?void 0:s.available)!==!1?await at(e):t==="database"&&(s==null?void 0:s.available)!==!1&&await nt(e)}catch(s){h.warn("admin page load failed",s instanceof Error?s.message:s),e.setFlash("error",s instanceof Error?s.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function fs(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?es(e):e.state.adminPage==="settings"?is(e):e.state.adminPage==="database"?ms(e):Jn(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function bs(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function gs(e,t,a,s){var n,l;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const r=bs(a.dataset.adminPage);return r&&await Oa(e,r),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await tt(e),e.setFlash("success","Overview refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await ce(e),e.state.adminSelectedUsername&&await j(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const r=a.dataset.username??"";if(!r||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{await j(e,r),await ue(e,r)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";if(!r)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==r.toLowerCase())&&await j(e,r),e.state.adminUserEditOpen=!0}catch(i){e.setFlash("error",i instanceof Error?i.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";return r&&(e.state.adminUserDeleteUsername=r,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const r=a;return e.state.adminUserDeleteConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminUserDeleteUsername??"";if(!r||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await w.adminDeleteUser(r,!0),h.event("admin.user.delete",{username:r}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((n=e.state.adminSelectedUsername)==null?void 0:n.toLowerCase())===r.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await ce(e),e.setFlash("success",`Deleted user “${r}”`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(a.dataset.id),label:a.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(a.dataset.id),label:a.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((l=e.state.adminResourceDelete)==null?void 0:l.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!a.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const r=e.state.adminSelectedUsername,i=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{i.kind==="calendar"?await w.adminDeleteUserCalendar(r,i.id,!0):await w.adminDeleteUserAddressBook(r,i.id,!0,!!i.force),e.state.adminResourceDelete=null,await ue(e,r),await j(e,r),e.setFlash("success","Deleted")}catch(o){e.setFlash("error",o instanceof Error?o.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await at(e),e.setFlash("success","Settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const r=a;return e.state.adminResetConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=a.value;const r=e.root.querySelector('[data-action="admin-reset-confirm"]');return r&&(r.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r=await w.adminResetToDefault(!0,e.state.adminResetPassword);h.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const i=r.redirectUrl&&r.redirectUrl.startsWith("/")?r.redirectUrl:"/portal/install/";return window.location.assign(i),!0}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await nt(e),e.setFlash("success","Database settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const r=a;return e.state.adminDbFormBackend=r.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const r=a.closest("form");return us(e,r),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const r=a;e.state.adminDbConfirmText=r.value,e.render();const i=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(i){i.focus();const o=i.value.length;i.setSelectionRange(o,o)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r={...e.state.adminDbPendingBody,confirm:"CONFIRM"},i=await w.adminUpdateDatabaseSettings(r);e.state.adminDatabaseSettings=i.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const o=(i.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=o==="pgsql"?"pgsql":"sqlite",h.event("admin.database.save",{backend:i.data.backend}),e.setFlash("success","Database settings saved")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function N(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${s}`}function ys(e,t){const a=new Date(e,t,1),s=new Date(e,t+1,0);return{from:N(a),to:N(s)}}function At(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,s,n]=e.split("-").map(Number);return new Date(a,s-1,n)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,s,n]=e.slice(0,10).split("-").map(Number);return new Date(a,(s||1)-1,n||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function vs(e){const t=At(e.start);if(!e.end)return[N(t)];let a=At(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const i=new Date(e.end);!Number.isNaN(i.getTime())&&i.getHours()===0&&i.getMinutes()===0&&i.getSeconds()===0&&i.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[N(t)];const s=[],n=new Date(t.getFullYear(),t.getMonth(),t.getDate()),l=new Date(a.getFullYear(),a.getMonth(),a.getDate());let r=0;for(;n<=l&&r++<370;)s.push(N(n)),n.setDate(n.getDate()+1);return s.length?s:[N(t)]}function $e(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):N(t)}function $s(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const a=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(a.hourCycle==="h23"||a.hourCycle==="h24")return!1;if(a.hourCycle==="h11"||a.hourCycle==="h12")return!0;if(typeof a.hour12=="boolean")return a.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function Lt(e){return $s(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function _t(e){var s;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(s=navigator.languages)!=null&&s.length?navigator.languages:[],navigator.language].filter(Boolean);for(const n of t)try{const l=new Intl.Locale(n),r=typeof l.getWeekInfo=="function"?l.getWeekInfo():l.weekInfo,i=r==null?void 0:r.firstDay;if(typeof i=="number")return i===7?0:i}catch{}const a=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(a)?0:1}function Ma(e){const t=_t(e),a=new Date(2024,0,7+t),s=[];for(let n=0;n<7;n++){const l=new Date(a);l.setDate(a.getDate()+n),s.push(l.toLocaleDateString(void 0,{weekday:"short"}))}return s}function Na(e,t=15){const a=t*60*1e3,s=e.getTime();return s%a===0?new Date(s):new Date(Math.ceil(s/a)*a)}function Q(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ks(e,t,a){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const n=e.slice(0,10),[l,r,i]=n.split("-").map(Number);return new Date(l,r-1,i).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const s=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(s.getTime())?e:s.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Lt(a)})}function ve(e){if(!e){const a=Na(new Date);return{date:N(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:N(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Ue(e){const t=new Date,a=N(t);if(e&&e!==a){const[l,r,i]=e.split("-").map(Number),o=new Date(l,r-1,i,9,0,0,0),c=new Date(l,r-1,i,10,0,0,0);return{start:Q(o),end:Q(c)}}const s=Na(t,15),n=new Date(s.getTime()+3600*1e3);return{start:Q(s),end:Q(n)}}function hs(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Rt(e,t){const a=e.slice(0,10),s=(t||a).slice(0,10);if(a===s){const u=Ue(a);return{start:u.start,end:u.end}}const[n,l,r]=a.split("-").map(Number),[i,o,c]=s.split("-").map(Number),p=Q(new Date(n,l-1,r,9,0,0,0)),m=Q(new Date(i,o-1,c,17,0,0,0));return{start:p,end:m}}function ws(e,t){const a=$e(e);let s=t?$e(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const n=new Date(t);if(!Number.isNaN(n.getTime())&&n.getHours()===0&&n.getMinutes()===0&&n.getTime()>new Date(e).getTime()){const l=At(t);l.setDate(l.getDate()-1),s=N(l)}}return{start:a,end:s}}function he(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Ss(e){const{field:t,value:a,dateOnly:s,allowClear:n,viewY:l,viewM:r,weekStart:i,timeFormat:o}=e,c=ve(a),p=_t(i),m=Ma(i),b=(new Date(l,r,1).getDay()-p+7)%7,y=new Date(l,r+1,0).getDate(),f=new Date(l,r,0).getDate(),$=c.date,k=c.hm,S=[],v=Math.ceil((b+y)/7)*7;for(let T=0;T<v;T++){let x,V,re=!1;T<b?(x=f-b+T+1,V=new Date(l,r-1,x),re=!0):T>=b+y?(x=T-(b+y)+1,V=new Date(l,r+1,x),re=!0):(x=T-b+1,V=new Date(l,r,x));const me=N(V),pe=me===$,_e=me===N(new Date);S.push(`<button type="button" class="dt-day${re?" is-outside":""}${pe?" is-selected":""}${_e?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${d(me)}">${x}</button>`)}const g=new Date().getFullYear(),D=Math.min(1900,l),P=Math.max(g+30,l),F=Array.from({length:12},(T,x)=>{const V=new Date(2e3,x,1).toLocaleString(void 0,{month:"short"});return`<option value="${x}" ${x===r?"selected":""}>${d(V)}</option>`}).join(""),I=[];for(let T=D;T<=P;T++)I.push(`<option value="${T}" ${T===l?"selected":""}>${T}</option>`);const _=s?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${hs().map(T=>{const x=(()=>{const[V,re]=T.split(":").map(Number);return new Date(2e3,0,1,V,re).toLocaleTimeString(void 0,Lt(o))})();return`<button type="button" class="dt-time${T===k?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${T}" role="option" aria-selected="${T===k}">${d(x)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${s?"":" and time"}">
      <div class="dt-popover-inner${s?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${d(t)}" aria-label="Month">${F}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${d(t)}" aria-label="Year">${I.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${m.map(T=>`<span class="dt-dow">${d(T)}</span>`).join("")}</div>
          <div class="dt-days">${S.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(t)}" ${n?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${_}
      </div>
    </div>`}function Ds(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const a=t.querySelector(".dt-trigger"),s=t.querySelector(".dt-popover");if(!a||!s)return;const n=a.getBoundingClientRect(),l=8;s.style.position="fixed",s.style.visibility="hidden",s.style.top="0",s.style.left="0";const r=s.offsetWidth||320,i=s.offsetHeight||300;let o=n.bottom+6;o+i>window.innerHeight-l&&(o=Math.max(l,n.top-i-6));let c=n.left;c+r>window.innerWidth-l&&(c=Math.max(l,window.innerWidth-r-l)),c<l&&(c=l),s.style.top=`${Math.round(o)}px`,s.style.left=`${Math.round(c)}px`,s.style.right="auto",s.style.visibility="visible",s.style.zIndex="200"})}function xa(e){return`${rn}:${e}`}function Cs(e){if(!e)return null;try{const t=localStorage.getItem(xa(e));if(t==null||t==="")return null;const a=JSON.parse(t);if(!a||typeof a!="object")return null;const s=a;let n=[];Array.isArray(s.ids)&&(n=s.ids.map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>0).map(r=>Math.floor(r)));let l=null;if(s.selectedId===null||s.selectedId===void 0)l=null;else{const r=Number(s.selectedId);l=Number.isFinite(r)&&r>0?Math.floor(r):null}return{ids:n,selectedId:l}}catch{return null}}function st(e){var a;const t=(a=e.user)==null?void 0:a.username;if(t)try{const s={ids:e.selectedIds.slice(),selectedId:e.selectedId};localStorage.setItem(xa(t),JSON.stringify(s))}catch{}}async function qt(e,t){const a=await w.shares(t);e.state.shares=a.shares}function Es(e){const t=e.state.calendars.filter(s=>s.canShare);if(t.length===0)return null;const a=s=>{const n=s.uri.toLowerCase(),l=s.displayname.toLowerCase();return n==="default"||l==="default"||l==="default calendar"};return t.find(a)??t[0]??null}async function ut(e){const t=e.state.selectedIds.filter(n=>e.state.calendars.some(l=>l.id===n));if(t.length===0){e.state.monthEvents=[];return}const{from:a,to:s}=ys(e.state.monthCursor.y,e.state.monthCursor.m);e.state.monthEventsLoading=!0,h.debug("loadMonthEvents",{selectedIds:t,from:a,to:s});try{const l=(await Promise.all(t.map(async r=>(await w.calendarEvents(r,a,s)).events.map(o=>({...o,instanceId:r}))))).flat();l.sort((r,i)=>{const o=r.start||"",c=i.start||"";return o!==c?o<c?-1:1:(r.summary||"").localeCompare(i.summary||"")}),e.state.monthEvents=l,h.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:a,to:s})}catch(n){e.state.monthEvents=[],h.warn("loadMonthEvents failed",n instanceof Error?n.message:n)}finally{e.state.monthEventsLoading=!1}}function Ts(e,t){const a=e.state.calendars.find(s=>s.id===t);return a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6"}function Ps(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(a=>a!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t),st(e.state)}function As(e,t,a){return new Date(t,a,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Fs(e,t){const a=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return a;const s=new Date(t.start);return Number.isNaN(s.getTime())?a:`${s.toLocaleTimeString(void 0,e.timeFormatOpts())} ${a}`}function Us(e){const t=e.state.calendars.filter(S=>e.state.selectedIds.includes(S.id)),a=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,s=e.state.monthCursor.y,n=e.state.monthCursor.m,l=new Date(s,n,1),r=e.localeWeekStart(),i=(l.getDay()-r+7)%7,o=new Date(s,n+1,0).getDate(),c=new Date(s,n,0).getDate(),m=N(new Date),u=e.localeDowLabels(),b=new Map;for(const S of e.state.monthEvents)for(const v of vs(S)){const g=b.get(v)??[];g.push(S),b.set(v,g)}const y=[],f=Math.ceil((i+o)/7)*7;for(let S=0;S<f;S++){let v,g=!0,D;S<i?(v=c-i+S+1,g=!1,D=new Date(s,n-1,v)):S>=i+o?(v=S-(i+o)+1,g=!1,D=new Date(s,n+1,v)):(v=S-i+1,D=new Date(s,n,v));const P=N(D),F=P===m,I=g?b.get(P)??[]:[],_=e.state.monthExpandDay===P?50:3,T=I.slice(0,_),x=I.length-T.length,V=T.map(fe=>{var Wt;const pt=fe.instanceId,ft=Fs(e,fe),Ya=Ts(e,pt),jt=((Wt=e.state.calendars.find(Qa=>Qa.id===pt))==null?void 0:Wt.displayname)||"",Ga=jt?`${ft} · ${jt}`:ft;return`<button type="button" class="month-event${fe.allDay?"":" is-timed"}" title="${d(Ga)}" style="--ev-color:${d(Ya)}"
          data-action="open-event" data-instance="${pt}" data-uri="${d(fe.uri)}" ${e.state.busy?"disabled":""}>${d(ft)}</button>`}).join(""),re=x>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(P)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${x} more</button>`:"",me=!g&&(v===1||S===i+o)?D.toLocaleString(void 0,{month:"short",day:"numeric"}):String(v),pe=e.state.selectedId!==null?e.state.calendars.find(fe=>fe.id===e.state.selectedId)??null:null,_e=!!(pe&&!pe.readOnly&&(pe.canShare||pe.access==="readwrite"));y.push(`<div class="month-cell${g?"":" is-outside"}${F?" is-today":""}${_e?" is-clickable":""}"${_e?` data-action="new-event-day" data-day="${d(P)}" role="button" tabindex="0" title="Add event on ${d(P)}"`:""}>
      <div class="month-daynum${F?" is-today-num":""}">${d(me)}</div>
      <div class="month-events">${V}${re}</div>
    </div>`)}const $=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",k=t.slice(0,6).map(S=>{const v=S.color&&S.color.length>=7?S.color.slice(0,7):S.color||"#3B82F6";return`<span class="cal-swatch" style="background:${d(v)};margin-top:0" title="${d(S.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
    <div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${d(As(e,s,n))}</h2>
      <span class="month-cal-name muted small" title="${d(a)}">
        ${k}
        ${d(a)}
      </span>
    </div>
    ${$}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${u.map(S=>`<div class="month-dow">${d(S)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${y.join("")}
      </div>
    </div>
  </section>`}function Bt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Is(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function xe(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),s=String(e.get("repeatEndMode")??"never"),n=s==="until"||s==="count"?s:"never";let l=null,r=null;if(n==="until"){const o=String(e.get("repeatUntil")??"").trim();l=o?o.slice(0,10):null}else if(n==="count"){const o=Number(e.get("repeatCount")??0);r=Number.isFinite(o)&&o>0?Math.min(999,Math.round(o)):10}const i=e.getAll("repeatByDay").map(o=>String(o).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:l,count:r,byDay:i,endMode:n}}function Os(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,a=t.repeat??Bt(),s=(a.freq||"").toUpperCase(),n=e.state.calendars.filter(y=>y.canShare||y.access==="readwrite"),l=e.state.calendars.filter(y=>y.id===t.instanceId?!0:y.readOnly?!1:y.canShare||y.access==="readwrite").map(y=>`<option value="${y.id}" ${y.id===t.instanceId?"selected":""}>${d(y.displayname)}</option>`).join(""),r=t.readOnly||!t.canWrite;let i,o;if(t.allDay)i=$e(t.start),o=$e(t.end);else{const y=t.start||"",f=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(y)){const $=Rt(y,f||null);i=$.start,o=$.end||""}else i=he(t.start),o=he(t.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],p=new Set((a.byDay||[]).map(y=>y.toUpperCase())),m=Is(a),u=!!s&&m==="until",b=a.until||(m==="until"?$e(t.start)||N(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
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
              ${l||`<option value="${t.instanceId}">${d(t.calendarName)}</option>`}
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
            ${e.renderPortalDateTimeField({field:"start",name:"start",label:"Start",value:i,dateOnly:t.allDay,required:!0,disabled:r,allowClear:!1})}
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:o,dateOnly:t.allDay,disabled:r||u,allowClear:!u})}
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
                    ${c.map(y=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${y.code}" ${p.has(y.code)?"checked":""} />
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
  </div>`}function Ms(e,t,a){const s=e.state.calendars.find(n=>n.id===a);return{uri:"",instanceId:a,calendarId:(s==null?void 0:s.calendarId)??0,calendarName:(s==null?void 0:s.displayname)??"Calendar",calendarUri:(s==null?void 0:s.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:Bt(),readOnly:!1,canWrite:!0}}function Ns(e,t){if(!e.state.editingEvent)return;const a=new FormData(t),s=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(a.get("summary")??e.state.editingEvent.summary),description:String(a.get("description")??e.state.editingEvent.description),location:String(a.get("location")??e.state.editingEvent.location),instanceId:Number(a.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(s==null?void 0:s.checked)??e.state.editingEvent.allDay,start:String(a.get("start")??e.state.editingEvent.start??""),end:String(a.get("end")??e.state.editingEvent.end??"")||null,repeat:xe(a),hasRrule:!!String(a.get("repeatFreq")??"").trim()}}function te(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function La(e){te(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){te(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&Ra(e,e.state.importProgress)},1e3)}function Ie(e,t,a={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...a},e.render())}function xs(e){te(e),e.state.importProgress=null,e.render()}function _a(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Ra(e,e.state.importProgress))}function Ra(e,t){const a=e.root.querySelector("[data-import-status-line]"),s=e.root.querySelector(".import-progress-bar"),n=e.root.querySelector(".import-progress-track"),l=e.root.querySelector("[data-import-counts]"),r=t.kind==="calendar"?"items":"contacts";let i;if(t.phase==="processing"&&t.processTotal>0)i=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${r} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`;else if(t.phase==="processing")i=`Importing on server… ${H(t.elapsedSec)}`;else return;a&&(a.textContent=i),l&&(l.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),s&&t.processPercent!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),n&&t.processPercent!==null&&(n.setAttribute("aria-valuenow",String(t.processPercent)),n.removeAttribute("aria-valuetext"))}function Ve(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,a=t.phase!=="done"&&t.phase!=="error",s=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",n=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",l=(()=>{const o=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],p={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return o.map((m,u)=>{let b="pending";return t.phase==="done"||u<p?b="done":u===p&&(b=(t.phase==="error","active")),`<li class="import-step import-step-${b}"><span class="import-step-icon" aria-hidden="true">${b==="done"?"✓":b==="active"?"●":"○"}</span> ${d(m.label)}</li>`}).join("")})();let r="";if(a){let o=null;t.phase==="reading"&&t.readPercent!==null?o=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(o=Math.min(100,Math.max(0,t.processPercent)));const c=o===null?"import-progress-bar is-indeterminate":"import-progress-bar",p=o!==null?` style="width:${o}%"`:"",m=t.kind==="calendar"?"items":"contacts";let u;t.phase==="reading"?u=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?u="Uploading to server…":t.processTotal>0?u=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${m} (${t.processPercent??0}%) · ${H(t.elapsedSec)}`:u=`Importing on server… ${H(t.elapsedSec)}`;const b=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';r=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${d(s)}</strong> from
        <span class="mono">${d(t.fileName)}</span>
        ${t.fileSizeLabel?` <span class="muted">(${d(t.fileSizeLabel)})</span>`:""}
      </p>
      <ul class="import-steps">${l}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${o!==null?`aria-valuenow="${o}"`:'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${c}"${p}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${d(u)}</p>
      ${b}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?r=`
      ${W("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · Took ${d(H(t.elapsedSec))}
      </p>`:r=`
      ${W("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${d(t.fileName)}</span>
        · After ${d(H(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const i=a?'<p class="muted small" style="margin:0">Please wait…</p>':It([{label:"Close",action:"close-import-progress",variant:"primary"}]);return U({title:n,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:a,lockBackdrop:a,body:r,footer:i})}function qa(e,t,a){return new Promise((s,n)=>{const l=new FileReader;l.onprogress=r=>{r.lengthComputable&&r.total>0?a(Math.min(100,Math.round(r.loaded/r.total*100))):a(null)},l.onload=()=>s(String(l.result??"")),l.onerror=()=>n(l.error??new Error("Failed to read file")),l.readAsText(t)})}async function Ls(e,t){var s;if(e.state.selectedId===null)return;const a=(s=t.files)==null?void 0:s[0];t.value="",a&&(e.state.calModalOpen=!0,await Ba(e,e.state.selectedId,a,{keepEditModalOpen:!0}))}async function _s(e,t){var p;const a=(p=t.files)==null?void 0:p[0];if(t.value="",!a)return;const s=e.root.querySelector('[data-form="create-cal"]'),n=s?new FormData(s):new FormData,l=n.get("holidays")==="on",r=n.get("readOnly")==="on";if(l){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(r){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let i=String(n.get("displayname")??"").trim();i||(i=a.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const o=String(n.get("description")??""),c=String(n.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const m=await w.createCalendar({displayname:i,description:o,color:c,readOnly:!1});e.state.selectedId=m.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${m.calendar.displayname}” — importing…`),await Ba(e,m.calendar.id,a,{keepEditModalOpen:!1,successPrefix:`Calendar “${m.calendar.displayname}” created. `})}catch(m){const u=m instanceof Error?m.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",u),e.state.busy=!1,e.render()}}async function Ba(e,t,a,s={}){e.state.busy=!0,e.clearFlash(),te(e),e.state.importProgress={kind:"calendar",fileName:a.name,fileSizeLabel:et(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},La(e),e.render();try{const n=await qa(e,a,i=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:i};const o=e.root.querySelector(".import-progress-bar"),c=e.root.querySelector("[data-import-status-line]");o&&i!==null&&(o.classList.remove("is-indeterminate"),o.style.width=`${i}%`),c&&i!==null&&(c.textContent=`Reading file… ${i}%`)});Ie(e,"uploading",{readPercent:100}),Ie(e,"processing",{processPercent:0}),h.event("import.calendar.start",{file:a.name,bytes:a.size,calId:t});const l=await w.importCalendar(t,n,i=>{_a(e,i)}),r=e.formatImportResult(l);e.state.selectedId===t&&await ut(e),te(e),Ie(e,"done",{ok:!0,resultMessage:`${r} (from “${a.name}”)`}),e.setFlash("success",`${s.successPrefix||""}Import finished for “${a.name}”: ${r}.`)}catch(n){const l=n instanceof Error?n.message:"Import failed";te(e),Ie(e,"error",{ok:!1,resultMessage:l}),e.setFlash("error",l)}finally{s.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function Rs(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("access")??"read");if(!s){e.setFlash("error","Select a user to share with"),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await w.share(e.state.selectedId,s,n),await qt(e,e.state.selectedId),e.setFlash("success",`Shared with ${s}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function qs(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),l=String(a.get("location")??"").trim(),r=a.get("allDay")==="on",i=String(a.get("start")??"").trim(),o=String(a.get("end")??"").trim(),c=Number(a.get("instanceId"))||e.state.editingEvent.instanceId,p=xe(a);if(!s){e.setFlash("error","Title is required"),e.render();return}if(!i){e.setFlash("error","Start is required"),e.render();return}let m,u;if(r)m=i.slice(0,10),u=o?o.slice(0,10):m;else if(/^\d{4}-\d{2}-\d{2}$/.test(i)){const $=Rt(i,o||null);m=new Date($.start).toISOString(),u=$.end?new Date($.end).toISOString():null}else m=new Date(i).toISOString(),u=o?new Date(o).toISOString():null;const b=e.state.editingEvent.instanceId,y=e.state.editingEvent.uri,f=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),h.event(f?"event.create":"event.update",{instanceId:c,uri:f?null:y,allDay:r,summary:s});try{const $={summary:s,description:n,location:l,allDay:r,start:m,end:u,instanceId:c,repeat:p},k=f?await w.createEvent(c,$):await w.updateEvent(b,y,$);(e.state.selectedId===null||k.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=k.event.instanceId),await ut(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,h.event(f?"event.created":"event.saved",{uri:k.event.uri,instanceId:k.event.instanceId}),e.setFlash("success",ae("Event",k.event.summary||s,f?"created":"saved"))}catch($){h.warn("event.save failed",$ instanceof Error?$.message:$),e.setFlash("error",$ instanceof Error?$.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Bs(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),l=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const r=await w.updateCalendar(e.state.selectedId,{displayname:s,description:n,color:l});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=r.calendar.id,await qt(e,e.state.selectedId),await ut(e),e.setFlash("success","Calendar updated")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function Vs(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),l=String(a.get("color")??"").trim(),r=a.get("holidays")==="on",i=String(a.get("holidayCountry")??"").trim(),o=a.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,r&&!i){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!r&&!s){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const c=await w.createCalendar({displayname:s,description:n,color:l,holidays:r,holidayCountry:r?i:void 0,readOnly:o});e.state.selectedId=c.calendar.id,e.state.selectedIds.includes(c.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,c.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let p=`Created “${c.calendar.displayname}”`;const m=c.holidayImport??c.calendar.holidayImport;m&&(p+=`. Holidays imported: ${e.formatImportResult(m)}.`),o&&(p+=" Calendar is read-only."),e.setFlash("success",p)}catch(c){e.state.createCalModalOpen=!0,e.setFlash("error",c instanceof Error?c.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function Va(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const a=t.querySelector('input[name="holidays"]'),s=t.querySelector("#holidays-country-wrap"),n=t.querySelector('input[name="displayname"]'),l=t.querySelector('input[name="readOnly"]');if(!a||!s)return;const r=a.checked;s.hidden=!r,n&&(n.required=!r,r&&!n.value.trim()?n.placeholder="Auto: Holidays (XX)":r||(n.placeholder="Work")),r&&l&&(l.checked=!0)}function Hs(e){Va(e)}function la(e){const{state:t}=e,a=t.calendars.filter(f=>f.canShare),s=t.calendars.filter(f=>!f.canShare),n=t.calendars.find(f=>f.id===t.selectedId)??null,l=a.map(f=>{const $=t.selectedIds.includes(f.id),k=$?" is-selected":"",S=f.id===t.selectedId?" is-primary":"",v=f.color?`<span class="cal-swatch" style="background:${d(f.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=e.accessBadge(f.access)+(f.readOnly?'<span class="badge">read-only</span>':"")+(f.holidaysCountry?`<span class="badge badge-admin">holidays ${d(f.holidaysCountry)}</span>`:"");return`<div class="cal-row${k}${S}" data-action="select-cal" data-id="${f.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${f.id}" ${$?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(f.displayname)}</span>
          <span class="cal-row-badges">${g}</span>
          <span class="muted small mono cal-row-uri">${d(f.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${f.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${f.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${f.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),r=s.map(f=>{const $=t.selectedIds.includes(f.id),k=$?" is-selected":"",S=f.id===t.selectedId?" is-primary":"",v=f.color?`<span class="cal-swatch" style="background:${d(f.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',g=f.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${k}${S}" data-action="select-cal" data-id="${f.id}" role="button" tabindex="0" title="${d(g)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${f.id}" ${$?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${v}
        <span class="cal-row-text">
          <span class="cal-row-title">${d(f.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(f.access)}</span>
          <span class="muted small">${f.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${f.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),i=t.directory.map(f=>`<option value="${d(f.username)}">${d(f.displayname)} (${d(f.username)})</option>`).join(""),o=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(f=>`<tr>
              <td>
                <strong>${d(f.displayname||f.username||f.href)}</strong>
                <div class="muted small mono">${d(f.username||f.href)}</div>
              </td>
              <td>${e.accessBadge(f.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${d(f.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),c=n!=null&&n.color&&n.color.length>=7?n.color.slice(0,7):"#3B82F6",p=!!(n&&n.readOnly),m=t.calModalOpen&&n&&n.canShare?U({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
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
                ${M(`Share “${n.displayname}”`,"share")}
                ${p?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                <form class="form-grid" data-form="share" style="margin-top:1rem">
                  <label>
                    User
                    <select name="username" required ${t.directory.length===0?"disabled":""}>
                      <option value="">${t.directory.length?"Select user…":"No other users"}</option>
                      ${i}
                    </select>
                  </label>
                  <label>
                    Access
                    <select name="access" ${p?"disabled":""}>
                      <option value="read" selected>Read only</option>
                      ${p?"":'<option value="readwrite">Full access</option>'}
                    </select>
                    ${p?'<input type="hidden" name="access" value="read" />':""}
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
                ${n.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||n.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||n.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",u=t.deleteConfirmId!==null?t.calendars.find(f=>f.id===t.deleteConfirmId&&f.canShare)??null:null,b=u?U({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(u.displayname)}</strong>
              <span class="muted small mono">(${d(u.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${it({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${u.id}"`}]}):"",y=t.createCalModalOpen?U({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
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
                  ${t.holidayCountries.map(f=>`<option value="${d(f.code)}">${d(f.name)} (${d(f.code)})</option>`).join("")}
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
            ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
            ${s.length?`<div class="calendars-shared-block">
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
    ${e.renderEventModal()}`}function Oe(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const a=new FormData(t);e.state.editingContact.firstname=String(a.get("firstname")??""),e.state.editingContact.lastname=String(a.get("lastname")??""),e.state.editingContact.fullname=String(a.get("fullname")??""),e.state.editingContact.org=String(a.get("org")??""),e.state.editingContact.title=String(a.get("title")??""),e.state.editingContact.url=String(a.get("url")??""),e.state.editingContact.note=String(a.get("note")??"");const s=String(a.get("birthday")??"").trim();e.state.editingContact.birthday=s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null,e.state.editingContact.address={street:String(a.get("street")??""),city:String(a.get("city")??""),region:String(a.get("region")??""),postal:String(a.get("postal")??""),country:String(a.get("country")??"")};const n=[];let l=0;for(;a.has(`email_${l}`);)n.push(String(a.get(`email_${l}`)??"")),l++;n.length&&(e.state.editingContact.emails=n);const r=[];for(l=0;a.has(`phone_value_${l}`);)r.push({type:String(a.get(`phone_type_${l}`)??"other"),value:String(a.get(`phone_value_${l}`)??"")}),l++;r.length&&(e.state.editingContact.phones=r);const i=[];for(l=0;a.has(`custom_label_${l}`)||a.has(`custom_value_${l}`);)i.push({label:String(a.get(`custom_label_${l}`)??""),value:String(a.get(`custom_value_${l}`)??"")}),l++;e.state.editingContact.custom=i}function Ks(e,t){const a=new FormData(t),s=[];let n=0;for(;a.has(`email_${n}`);){const o=String(a.get(`email_${n}`)??"").trim();o&&s.push(o),n++}const l=[];for(n=0;a.has(`phone_value_${n}`);){const o=String(a.get(`phone_value_${n}`)??"").trim();o&&l.push({type:String(a.get(`phone_type_${n}`)??"other"),value:o}),n++}const r=[];for(n=0;a.has(`custom_label_${n}`)||a.has(`custom_value_${n}`);){const o=String(a.get(`custom_label_${n}`)??"").trim(),c=String(a.get(`custom_value_${n}`)??"").trim();(o||c)&&r.push({label:o,value:c}),n++}const i={firstname:String(a.get("firstname")??"").trim(),lastname:String(a.get("lastname")??"").trim(),fullname:String(a.get("fullname")??"").trim(),org:String(a.get("org")??"").trim(),title:String(a.get("title")??"").trim(),emails:s,phones:l,address:{street:String(a.get("street")??"").trim(),city:String(a.get("city")??"").trim(),region:String(a.get("region")??"").trim(),postal:String(a.get("postal")??"").trim(),country:String(a.get("country")??"").trim()},url:String(a.get("url")??"").trim(),note:String(a.get("note")??"").trim(),birthday:(()=>{const o=String(a.get("birthday")??"").trim();return o&&/^\d{4}-\d{2}-\d{2}/.test(o)?o.slice(0,10):null})(),custom:r};return e.state.removePhotoPending?i.removePhoto=!0:e.state.photoBase64Pending&&(i.photoBase64=e.state.photoBase64Pending),i}function Y(e){const{state:t,root:a}=e,s=a.querySelector('[data-form="edit-event"]');s&&t.editingEvent&&e.syncEditingEventFromForm(s);const n=a.querySelector('[data-form="task"]');n&&t.editingTask&&e.syncEditingTaskFromForm(n);const l=a.querySelector('[data-form="note"]');l&&t.editingNote&&e.syncEditingNoteFromForm(l),t.editingContact&&Oe(e.contactsHost)}async function zs(e,t,a,s){var c,p,m;const{state:n,root:l,render:r,setFlash:i,clearFlash:o}=e;if(t==="toggle-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u))return!0;s.stopPropagation(),e.toggleCalendarSelected(u),n.calendarSelectionSeeded=!0,n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(b){i("error",b instanceof Error?b.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="select-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u))return!0;n.selectedIds.includes(u)||(n.selectedIds=[...n.selectedIds,u]),n.selectedId=u,n.calendarSelectionSeeded=!0,st(n),n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(b){i("error",b instanceof Error?b.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="edit-cal"){const u=Number(a.dataset.id);if(!Number.isFinite(u)||!n.calendars.find(y=>y.id===u&&y.canShare))return!0;n.selectedId=u,n.selectedIds.includes(u)||(n.selectedIds=[...n.selectedIds,u]),st(n),n.calModalOpen=!0,n.deleteConfirmId=null,n.busy=!0,o(),r();try{await e.loadShares(u),await e.loadMonthEvents()}catch(y){i("error",y instanceof Error?y.message:"Failed to open calendar")}finally{n.busy=!1,r()}return!0}if(t==="close-cal-modal")return n.calModalOpen=!1,r(),!0;if(t==="open-create-cal-modal")return n.createCalModalOpen=!0,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0;if(t==="close-create-cal-modal")return n.createCalModalOpen=!1,o(),r(),!0;if(t==="delete-cal"){const u=Number(a.dataset.id);return!Number.isFinite(u)||!n.calendars.find(y=>y.id===u&&y.canShare)||(n.deleteConfirmId=u,n.calModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-cal")return n.deleteConfirmId=null,r(),!0;if(t==="confirm-delete-cal"){const u=Number(a.dataset.id),b=l.querySelector("#delete-cal-confirm");if(!Number.isFinite(u)||!(b!=null&&b.checked))return!0;n.busy=!0,o(),r();try{if(await w.deleteCalendar(u),n.selectedId===u&&(n.selectedId=null),n.selectedIds=n.selectedIds.filter(y=>y!==u),n.deleteConfirmId=null,n.calModalOpen=!1,n.shares=[],n.monthEvents=[],await e.loadHome(),n.selectedId===null){const y=e.pickDefaultCalendar();y?(n.selectedId=y.id,n.selectedIds.includes(y.id)||(n.selectedIds=[...n.selectedIds,y.id]),await e.loadMonthEvents()):n.selectedIds.length>0&&(n.selectedId=n.selectedIds[0],await e.loadMonthEvents())}i("success","Calendar deleted")}catch(y){i("error",y instanceof Error?y.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="month-today"){const u=new Date;n.monthCursor={y:u.getFullYear(),m:u.getMonth()},n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="month-prev"||t==="month-next"){const u=t==="month-prev"?-1:1,b=new Date(n.monthCursor.y,n.monthCursor.m+u,1);n.monthCursor={y:b.getFullYear(),m:b.getMonth()},n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="open-event"){s.stopPropagation();const u=Number(a.dataset.instance),b=a.dataset.uri??"";if(!Number.isFinite(u)||!b)return!0;n.busy=!0,o(),r();try{const y=await w.getEvent(u,b);n.editingEvent={...y.event,repeat:y.event.repeat??e.defaultRepeat()},n.creatingEvent=!1,n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null}catch(y){i("error",y instanceof Error?y.message:"Failed to open event")}finally{n.busy=!1,r()}return!0}if(t==="open-event-day"){s.stopPropagation();const u=a.dataset.day??"";return n.monthExpandDay=n.monthExpandDay===u?null:u,r(),!0}if(t==="new-event-day"){const u=s.target;if((c=u==null?void 0:u.closest)!=null&&c.call(u,".month-event, .month-event-more"))return!0;const b=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;if(n.selectedId===null)return i("error","Select a calendar first"),r(),!0;const y=n.calendars.find(f=>f.id===n.selectedId);return!y||y.readOnly||!(y.canShare||y.access==="readwrite")?(i("error","This calendar is read-only"),r(),!0):(n.creatingEvent=!0,n.editingEvent=e.blankEventForDay(b,n.selectedId),n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0)}if(t==="close-event-modal")return n.eventModalOpen=!1,n.editingEvent=null,n.creatingEvent=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="dt-open"){const u=a.dataset.dtField||"";if(!u)return!0;if(Y(e),((p=n.eventDtPicker)==null?void 0:p.field)===u)n.eventDtPicker=null;else{const b=a.dataset.dtDateOnly==="1",y=a.dataset.dtClear!=="0",f=a.dataset.dtName||u;let $=e.getDtFieldCurrentValue(u);!$&&(u==="due"||u==="dtstart"||u==="bulk-due")&&($=Ue().start);const k=ve($||N(new Date)),[S,v]=k.date.split("-").map(Number);n.eventDtPicker={field:u,viewY:S,viewM:(v||1)-1,dateOnly:b,allowClear:y,name:f}}return r(),!0}if(t==="dt-month-prev"||t==="dt-month-next"){if(!n.eventDtPicker)return!0;Y(e);const u=t==="dt-month-prev"?-1:1,b=new Date(n.eventDtPicker.viewY,n.eventDtPicker.viewM+u,1);return n.eventDtPicker={...n.eventDtPicker,viewY:b.getFullYear(),viewM:b.getMonth()},r(),!0}if(t==="dt-set-month"){if(!n.eventDtPicker)return!0;Y(e);const b=Number(a.value);return!Number.isFinite(b)||b<0||b>11||(n.eventDtPicker={...n.eventDtPicker,viewM:b},r()),!0}if(t==="dt-set-year"){if(!n.eventDtPicker)return!0;Y(e);const b=Number(a.value);return!Number.isFinite(b)||b<1||b>9999||(n.eventDtPicker={...n.eventDtPicker,viewY:b},r()),!0}if(t==="dt-pick-day"){if(!n.eventDtPicker)return!0;const u=n.eventDtPicker.field,b=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return!0;Y(e);const y=n.eventDtPicker.dateOnly;if(y)e.setDtFieldValue(u,b),n.eventDtPicker=null;else{const f=e.getDtFieldCurrentValue(u),$=ve(f||Ue(b).start).hm;e.setDtFieldValue(u,`${b}T${$}`),n.eventDtPicker={...n.eventDtPicker,viewY:Number(b.slice(0,4)),viewM:Number(b.slice(5,7))-1}}if(u==="start"&&n.editingEvent&&!y&&n.editingEvent.end){const f=new Date(String(n.editingEvent.start)),$=new Date(String(n.editingEvent.end));!Number.isNaN(f.getTime())&&!Number.isNaN($.getTime())&&$<=f&&e.setDtFieldValue("end",Q(new Date(f.getTime()+3600*1e3)))}return r(),!0}if(t==="dt-pick-time"){if(!n.eventDtPicker||n.eventDtPicker.dateOnly)return!0;const u=n.eventDtPicker.field,b=a.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(b))return!0;Y(e);const y=e.getDtFieldCurrentValue(u)||Ue().start,$=`${ve(y).date}T${b}`;if(e.setDtFieldValue(u,$),u==="start"&&n.editingEvent){n.editingEvent={...n.editingEvent,allDay:!1};const k=n.editingEvent.end?ve(String(n.editingEvent.end)):null,S=new Date($);(!k||new Date(`${k.date}T${k.hm}`)<=S)&&e.setDtFieldValue("end",Q(new Date(S.getTime()+3600*1e3)))}return n.eventDtPicker=null,r(),!0}if(t==="dt-today"){if(!n.eventDtPicker)return!0;const u=n.eventDtPicker.field;Y(e);const b=N(new Date);if(n.eventDtPicker.dateOnly)e.setDtFieldValue(u,b);else{const y=Ue(b);u==="start"?(e.setDtFieldValue("start",y.start),n.editingEvent&&!n.editingEvent.end&&e.setDtFieldValue("end",y.end)):u==="end"?e.setDtFieldValue("end",y.end):e.setDtFieldValue(u,y.start)}return n.eventDtPicker=null,r(),!0}if(t==="dt-clear"){if(!n.eventDtPicker||!n.eventDtPicker.allowClear)return!0;const u=n.eventDtPicker.field;return Y(e),e.setDtFieldValue(u,null),n.eventDtPicker=null,r(),!0}if(t==="event-allday-toggle"){if(!n.editingEvent)return!0;const u=l.querySelector('[data-form="edit-event"]'),b=a.checked;if(u){const y=new FormData(u),f=String(y.get("start")??n.editingEvent.start??""),$=String(y.get("end")??n.editingEvent.end??"")||null;let k=f,S=$;if(b){const v=ws(f,$);k=v.start,S=v.end}else{const v=f.slice(0,10),g=($||f).slice(0,10),D=Rt(v,g);k=D.start,S=D.end}n.editingEvent={...n.editingEvent,summary:String(y.get("summary")??n.editingEvent.summary),description:String(y.get("description")??n.editingEvent.description),location:String(y.get("location")??n.editingEvent.location),instanceId:Number(y.get("instanceId"))||n.editingEvent.instanceId,allDay:b,start:k,end:S,repeat:xe(y)}}else n.editingEvent={...n.editingEvent,allDay:b};return n.eventDtPicker=null,r(),!0}if(t==="event-repeat-freq"||t==="event-repeat-end"){if(!n.editingEvent)return!0;const u=l.querySelector('[data-form="edit-event"]');if(!u)return!0;const b=new FormData(u),y=u.querySelector('input[name="allDay"]'),f=xe(b);return n.editingEvent={...n.editingEvent,summary:String(b.get("summary")??n.editingEvent.summary),description:String(b.get("description")??n.editingEvent.description),location:String(b.get("location")??n.editingEvent.location),instanceId:Number(b.get("instanceId"))||n.editingEvent.instanceId,allDay:(y==null?void 0:y.checked)??n.editingEvent.allDay,start:String(b.get("start")??n.editingEvent.start??""),end:String(b.get("end")??n.editingEvent.end??"")||null,repeat:f,hasRrule:!!String(b.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&((m=n.eventDtPicker)==null?void 0:m.field)==="end"&&(n.eventDtPicker=null),r(),!0}if(t==="delete-event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return!0;const u=String(n.editingEvent.summary||"this event").trim()||"this event";return n.confirmDelete={scope:"event",title:"Delete event",message:`Delete “${u}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="revoke"){const u=a.dataset.href??"";return!u||n.selectedId===null||(n.confirmDelete={scope:"revoke-share",title:"Revoke share",message:"Revoke access for this user?",detail:"They will lose this calendar until you share it again.",href:u},r()),!0}if(t==="export-cal"){s.stopPropagation();const u=a.dataset.id,b=u!==void 0&&u!==""?Number(u):n.selectedId;if(b===null||Number.isNaN(b))return!0;n.busy=!0,o(),r();try{const{blob:y,filename:f}=await w.exportCalendar(b),$=await e.saveBlobAsFile(y,f);$==="cancelled"?i("info","Export cancelled"):$==="saved"?i("success",`Saved ${f}`):i("success",`Download started: ${f}`)}catch(y){i("error",y instanceof Error?y.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}async function Ha(e){const t=await w.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars,e.state.selectedNoteKey!==null&&!e.state.notes.some(a=>`${a.instanceId}|${a.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function L(e,t){return`${e}|${t}`}function js(e){const t=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(l=>{const r=L(l.instanceId,l.uri),i=!e.state.creatingNote&&r===e.state.selectedNoteKey?" is-selected":"",o=(l.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${i}" data-action="select-note" data-instance="${l.instanceId}" data-uri="${d(l.uri)}" tabindex="0" role="button">
              <td class="col-note-title">
                <span class="contact-name-primary">${d(l.summary||l.uri)}</span>
                ${o?`<span class="muted small contact-name-secondary">${d(o)}${l.description.length>80?"…":""}</span>`:""}
                ${l.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${d(Ea(l.dtstart))}</td>
              <td class="col-note-cal muted small">${d(l.calendarName)}</td>
            </tr>`}).join(""),a=e.state.editingNote,s=e.state.noteCalendars.map(l=>`<option value="${l.id}" ${a&&a.instanceId===l.id?"selected":""}>${d(l.displayname)}</option>`).join(""),n=a?`<div class="card">
          ${M(e.state.creatingNote?"New note":"Edit note","notes")}
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
      ${n}
    </section>
  </div>`}function Ws(e,t){if(!e.state.editingNote)return;const a=new FormData(t),s=String(a.get("dtstart")??"").trim(),n=a.get("instanceId"),l=n!==null&&String(n)!==""?Number(n):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(l)&&l>0?l:e.state.editingNote.instanceId,summary:String(a.get("summary")??e.state.editingNote.summary),description:String(a.get("description")??e.state.editingNote.description),dtstart:s?new Date(s).toISOString():null}}async function Js(e,t){const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),l=String(a.get("dtstart")??"").trim(),r=l?new Date(l).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const i=Number(a.get("instanceId"));if(!Number.isFinite(i)||i<=0)throw new Error("Select a calendar");const o=await w.createNote({instanceId:i,summary:s,description:n,dtstart:r});e.state.creatingNote=!1,e.state.selectedNoteKey=L(o.note.instanceId,o.note.uri),e.state.editingNote=o.note,e.setFlash("success",ae("Note",o.note.summary||s,"created"))}else if(e.state.editingNote){const i=await w.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:s,description:n,dtstart:r});e.state.editingNote=i.note,e.state.selectedNoteKey=L(i.note.instanceId,i.note.uri),e.setFlash("success",ae("Note",i.note.summary||s,"saved"))}await Ha(e)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Ys(e,t,a,s){var o;const{state:n,render:l,setFlash:r,clearFlash:i}=e;if(t==="sort-note"){const c=a.dataset.sort||"";if(!c)return!0;n.noteSort===c?n.noteOrder=n.noteOrder==="asc"?"desc":"asc":(n.noteSort=c,n.noteOrder="asc"),n.busy=!0,l();try{await e.loadNotes()}catch(p){r("error",p instanceof Error?p.message:"Sort failed")}finally{n.busy=!1,l()}return!0}if(t==="select-note"){const c=Number(a.dataset.instance),p=a.dataset.uri??"";if(!Number.isFinite(c)||!p)return!0;const m=n.notes.find(u=>u.instanceId===c&&u.uri===p)??null;return n.creatingNote=!1,n.selectedNoteKey=e.itemKey(c,p),n.editingNote=m?{...m}:null,i(),l(),!0}if(t==="new-note")return n.creatingNote=!0,n.selectedNoteKey=null,n.editingNote={uri:"",instanceId:((o=n.noteCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},i(),l(),!0;if(t==="cancel-note")return n.creatingNote=!1,n.editingNote=null,n.selectedNoteKey=null,l(),!0;if(t==="delete-note"){if(!n.editingNote||n.creatingNote)return!0;const c=String(n.editingNote.summary||"this note").trim()||"this note";return n.confirmDelete={scope:"note",title:"Delete note",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},l(),!0}return!1}async function rt(e){const t=await w.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const a=new Set(e.state.tasks.map(s=>L(s.instanceId,s.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(s=>a.has(s)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(s=>`${s.instanceId}|${s.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function Gs(e,t){const a=new Map;for(const p of t)p.uid&&a.set(p.uid,p);const s=new Map(t.map((p,m)=>[L(p.instanceId,p.uri),m])),n=new Map,l=[];for(const p of t){const m=p.parentUid;if(m&&a.has(m)&&m!==p.uid){const u=n.get(m)??[];u.push(p),n.set(m,u)}else l.push(p)}const r=(p,m)=>(s.get(L(p.instanceId,p.uri))??0)-(s.get(L(m.instanceId,m.uri))??0);l.sort(r);for(const[,p]of n)p.sort(r);const i=[],o=new Set,c=(p,m)=>{const u=p.uid||L(p.instanceId,p.uri);if(!o.has(u)){o.add(u),i.push({task:p,depth:Math.min(m,8)});for(const b of n.get(p.uid)??[])c(b,m+1);o.delete(u)}};for(const p of l)c(p,0);for(const p of t)i.some(m=>m.task===p)||i.push({task:p,depth:0});return i}function Qs(e,t){const a=new Set([t]);if(!t)return a;let s=!0;for(;s;){s=!1;for(const n of e.state.tasks)n.parentUid&&a.has(n.parentUid)&&n.uid&&!a.has(n.uid)&&(a.add(n.uid),s=!0)}return a}function Xs(e,t,a){const s=t.instanceId,n=a||!t.uid?new Set:Qs(e,t.uid),l=e.state.tasks.filter(o=>o.uid&&o.instanceId===s&&!n.has(o.uid)&&o.uid!==t.uid),r=t.parentUid||"",i=['<option value="">None (top-level)</option>',...l.map(o=>`<option value="${d(o.uid)}" ${o.uid===r?"selected":""}>${d(o.summary||o.uid)}</option>`)];if(r&&!l.some(o=>o.uid===r)){const o=e.state.tasks.find(c=>c.uid===r);i.push(`<option value="${d(r)}" selected>${d((o==null?void 0:o.summary)||r)} (current)</option>`)}return i.join("")}function Ka(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(a=>t.has(L(a.instanceId,a.uri))&&a.canWrite&&!a.readOnly)}function Zs(e){const t=f=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[f]||f,a=Gs(e,e.state.tasks),s=e.state.tasks.filter(f=>f.canWrite&&!f.readOnly).map(f=>L(f.instanceId,f.uri)),n=s.length>0&&s.every(f=>e.state.checkedTaskKeys.includes(f)),l=e.state.checkedTaskKeys.length>0,i=Ka(e).length,o=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:a.map(({task:f,depth:$})=>{const k=L(f.instanceId,f.uri),S=!e.state.creatingTask&&k===e.state.selectedTaskKey?" is-selected":"",v=e.state.checkedTaskKeys.includes(k),g=f.status==="COMPLETED"?"badge-ok":f.status==="CANCELLED"?"":"badge-admin",D=$>0?` style="--task-depth:${$}"`:"",P=$>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",F=f.canWrite&&!f.readOnly;return`<tr class="contact-table-row task-row${$>0?" is-subtask":""}${S}${v?" is-checked":""}" data-action="select-task" data-instance="${f.instanceId}" data-uri="${d(f.uri)}" tabindex="0" role="button"${D}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${f.instanceId}" data-uri="${d(f.uri)}"
                  ${v?"checked":""} ${F?"":"disabled"} aria-label="Select ${d(f.summary||f.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${P}<span class="contact-name-primary">${d(f.summary||f.uri)}</span></span>
                ${f.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${g}">${d(t(f.status))}</span></td>
              <td class="col-task-due muted small">${d(Ea(f.due))}</td>
              <td class="col-task-cal muted small">${d(f.calendarName)}</td>
              <td class="col-task-pct muted small">${f.percent?d(String(f.percent))+"%":"—"}</td>
            </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,p=(f,$)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${f}"
      title="${d($)}" aria-label="${d($)}" ${e.state.busy||i===0?"disabled":""}>${c}</button>`,m=l?`<div class="bulk-bar" style="margin-top:0.75rem">
          <div class="bulk-bar-row">
            <div class="bulk-bar-count">
              <strong>${i}</strong><span class="bulk-bar-count-label">selected</span>${e.state.checkedTaskKeys.length!==i?`<span class="muted small bulk-bar-count-extra">(${e.state.checkedTaskKeys.length-i} read-only skipped)</span>`:""}
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Status
                <select id="bulk-task-status" ${e.state.busy||i===0?"disabled":""}>
                  <option value="">—</option>
                  <option value="NEEDS-ACTION">To do</option>
                  <option value="IN-PROCESS">In progress</option>
                  <option value="COMPLETED">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              ${p("bulk-task-status","Apply status")}
            </div>
            <div class="bulk-group bulk-group-due">
              ${e.renderPortalDateTimeField({field:"bulk-due",name:"bulkDue",label:"Due",value:e.state.bulkDueValue,dateOnly:!1,disabled:e.state.busy||i===0,allowClear:!0})}
              ${p("bulk-task-due","Apply due")}
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${e.state.busy||i===0?"disabled":""} title="Clear due date">Clear due</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field bulk-field-pct">%
                <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${e.state.busy||i===0?"disabled":""} />
              </label>
              ${p("bulk-task-percent","Apply %")}
            </div>
          </div>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${e.state.busy||i===0?"disabled":""}>Delete</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${e.state.busy?"disabled":""}>Clear selection</button>
          </div>
        </div>`:"",u=e.state.editingTask,b=e.state.taskCalendars.map(f=>`<option value="${f.id}" ${u&&u.instanceId===f.id?"selected":""}>${d(f.displayname)}</option>`).join(""),y=u?`<div class="card">
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
                ${Xs(e,u,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${u.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(f=>`<option value="${f}" ${u.status===f?"selected":""}>${d(t(f))}</option>`).join("")}
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
                  ${n?"checked":""} ${s.length===0||e.state.busy?"disabled":""} />
              </th>
              ${G("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${G("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${G("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${G("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${G("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${y}
    </section>
  </div>`}function er(e,t){if(!e.state.editingTask)return;const a=new FormData(t),s=String(a.get("due")??"").trim(),n=a.get("instanceId"),l=n!==null&&String(n)!==""?Number(n):e.state.editingTask.instanceId,r=String(a.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(l)&&l>0?l:e.state.editingTask.instanceId,summary:String(a.get("summary")??e.state.editingTask.summary),description:String(a.get("description")??e.state.editingTask.description),status:String(a.get("status")??e.state.editingTask.status),due:s?new Date(s).toISOString():null,priority:Number(a.get("priority")??e.state.editingTask.priority??0),percent:Number(a.get("percent")??e.state.editingTask.percent??0),parentUid:r===""?null:r}}async function tr(e,t){var l,r;const a=Ka(e);if(a.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const s=a.map(i=>({instanceId:i.instanceId,uri:i.uri}));if(t==="bulk-task-delete"){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await w.bulkTasks({op:"delete",items:s});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&a.some(o=>L(o.instanceId,o.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await rt(e),i.failed>0?e.setFlash("error",`Deleted ${i.ok}, failed ${i.failed}${i.errors[0]?`: ${i.errors[0]}`:""}`):e.setFlash("success",`Deleted ${i.ok} task${i.ok===1?"":"s"}`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let n={};if(t==="bulk-task-status"){const i=e.root.querySelector("#bulk-task-status"),o=((l=i==null?void 0:i.value)==null?void 0:l.trim())??"";if(!o){e.setFlash("error","Choose a status to apply"),e.render();return}n={status:o}}else if(t==="bulk-task-due"){const i=e.state.bulkDueValue.trim();if(!i){e.setFlash("error","Choose a due date to apply"),e.render();return}const o=/^\d{4}-\d{2}-\d{2}$/.test(i)?new Date(i+"T00:00:00"):new Date((i.length===16,i));if(Number.isNaN(o.getTime())){e.setFlash("error","Invalid due date"),e.render();return}n={due:o.toISOString()}}else if(t==="bulk-task-clear-due")n={due:null};else if(t==="bulk-task-percent"){const i=e.root.querySelector("#bulk-task-percent"),o=((r=i==null?void 0:i.value)==null?void 0:r.trim())??"";if(o===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const c=Number(o);if(!Number.isFinite(c)||c<0||c>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}n={percent:Math.round(c)}}e.state.busy=!0,e.clearFlash(),e.render();try{const i=await w.bulkTasks({op:"update",items:s,fields:n});if(await rt(e),e.state.editingTask&&!e.state.creatingTask){const c=L(e.state.editingTask.instanceId,e.state.editingTask.uri),p=e.state.tasks.find(m=>L(m.instanceId,m.uri)===c);p&&(e.state.editingTask={...p})}const o=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";i.failed>0?e.setFlash("error",`Updated ${o} on ${i.ok}, failed ${i.failed}${i.errors[0]?`: ${i.errors[0]}`:""}`):e.setFlash("success",`Updated ${o} on ${i.ok} task${i.ok===1?"":"s"}`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function ar(e,t){const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),l=String(a.get("status")??"NEEDS-ACTION"),r=String(a.get("due")??"").trim(),i=r?new Date(r).toISOString():null,o=Number(a.get("priority")??0),c=Number(a.get("percent")??0),p=String(a.get("parentUid")??"").trim(),m=p===""?null:p;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const u=Number(a.get("instanceId"));if(!Number.isFinite(u)||u<=0)throw new Error("Select a calendar");const b=await w.createTask({instanceId:u,summary:s,description:n,status:l,due:i,priority:o,percent:c,parentUid:m});e.state.creatingTask=!1,e.state.selectedTaskKey=L(b.task.instanceId,b.task.uri),e.state.editingTask=b.task,e.setFlash("success",ae(m?"Subtask":"Task",b.task.summary||s,"created"))}else if(e.state.editingTask){const u=await w.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:s,description:n,status:l,due:i,priority:o,percent:c,parentUid:m});e.state.editingTask=u.task,e.state.selectedTaskKey=L(u.task.instanceId,u.task.uri),e.setFlash("success",ae("Task",u.task.summary||s,"saved"))}await rt(e)}catch(u){e.setFlash("error",u instanceof Error?u.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function nr(e,t,a,s){var o;const{state:n,render:l,setFlash:r,clearFlash:i}=e;if(t==="sort-task"){const c=a.dataset.sort||"";if(!c)return!0;n.taskSort===c?n.taskOrder=n.taskOrder==="asc"?"desc":"asc":(n.taskSort=c,n.taskOrder=c==="due"||c==="summary"?"asc":"desc"),n.busy=!0,l();try{await e.loadTasks()}catch(p){r("error",p instanceof Error?p.message:"Sort failed")}finally{n.busy=!1,l()}return!0}if(t==="select-task"){if(s.target.closest("[data-stop-row], .task-check"))return!0;const c=Number(a.dataset.instance),p=a.dataset.uri??"";if(!Number.isFinite(c)||!p)return!0;const m=n.tasks.find(u=>u.instanceId===c&&u.uri===p)??null;return n.creatingTask=!1,n.selectedTaskKey=e.itemKey(c,p),n.editingTask=m?{...m}:null,i(),l(),!0}if(t==="task-check"){s.preventDefault(),s.stopPropagation();const c=Number(a.dataset.instance),p=a.dataset.uri??"";if(!Number.isFinite(c)||!p)return!0;const m=e.itemKey(c,p),u=n.tasks.find(b=>e.itemKey(b.instanceId,b.uri)===m);return!u||!u.canWrite||u.readOnly||(n.checkedTaskKeys.includes(m)?n.checkedTaskKeys=n.checkedTaskKeys.filter(b=>b!==m):n.checkedTaskKeys=[...n.checkedTaskKeys,m],l()),!0}if(t==="task-select-all"){s.preventDefault();const c=n.tasks.filter(m=>m.canWrite&&!m.readOnly);return c.length>0&&c.every(m=>n.checkedTaskKeys.includes(e.itemKey(m.instanceId,m.uri)))?n.checkedTaskKeys=[]:n.checkedTaskKeys=c.map(m=>e.itemKey(m.instanceId,m.uri)),l(),!0}if(t==="bulk-task-clear")return n.checkedTaskKeys=[],l(),!0;if(t==="bulk-task-status"||t==="bulk-task-due"||t==="bulk-task-clear-due"||t==="bulk-task-percent"||t==="bulk-task-delete"){if(t==="bulk-task-delete"){const c=n.checkedTaskKeys.length;return c===0?(r("error","No tasks selected"),l(),!0):(n.confirmDelete={scope:"bulk-task",title:c===1?"Delete task":`Delete ${c} tasks`,message:c===1?"Delete the selected task?":`Delete ${c} selected tasks?`,detail:"CalDAV clients will sync the removal. This cannot be undone.",count:c},l(),!0)}return e.runBulkTaskAction(t),!0}if(t==="new-task")return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:((o=n.taskCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},i(),l(),!0;if(t==="new-subtask"){if(!n.editingTask||n.creatingTask||!n.editingTask.uid||!n.editingTask.canWrite)return!0;const c=n.editingTask;return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:c.instanceId,calendarId:c.calendarId,calendarName:c.calendarName,calendarUri:c.calendarUri,uid:"",parentUid:c.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},i(),l(),!0}if(t==="cancel-task")return n.creatingTask=!1,n.editingTask=null,n.selectedTaskKey=null,l(),!0;if(t==="delete-task"){if(!n.editingTask||n.creatingTask)return!0;const c=String(n.editingTask.summary||"this task").trim()||"this task";return n.confirmDelete={scope:"task",title:"Delete task",message:`Delete “${c}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},l(),!0}return!1}async function Vt(e,t){const a=await w.contacts(t,e.state.contactSearch);e.state.contacts=a.contacts,e.state.selectedContactUri!==null&&!e.state.contacts.some(s=>s.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function sr(e,t){if(e.state.selectedAbId===null)return;const a=await w.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const s=a.contact;e.state.editingContact={...s,emails:Array.isArray(s.emails)?s.emails:[],phones:Array.isArray(s.phones)?s.phones:[],custom:Array.isArray(s.custom)?s.custom:[],address:s.address??za(),birthday:s.birthday??null},e.state.photoPreview=s.photoDataUri??(s.hasPhoto&&e.state.selectedAbId!==null?`${w.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function rr(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function za(e){return{street:"",city:"",region:"",postal:"",country:""}}function lr(e,t){return new Promise((a,s)=>{const n=new FileReader;n.onload=()=>{const l=String(n.result??""),r=l.indexOf(",");a(r>=0?l.slice(r+1):l)},n.onerror=()=>s(new Error("Failed to read photo file")),n.readAsDataURL(t)})}async function ir(e,t){var s;const a=(s=t.files)==null?void 0:s[0];if(t.value="",!!a){if(a.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const n=await lr(e,a);e.state.photoBase64Pending=n,e.state.photoPreview=`data:${a.type||"image/jpeg"};base64,${n}`,e.state.removePhotoPending=!1,e.render()}catch(n){e.setFlash("error",n instanceof Error?n.message:"Failed to read photo"),e.render()}}}async function or(e,t){var n;if(e.state.selectedAbId===null)return;const a=(n=t.files)==null?void 0:n[0];if(t.value="",!a)return;const s=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:a.name,fileSizeLabel:et(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const l=await e.readFileTextWithProgress(a,o=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:o};const c=e.root.querySelector(".import-progress-bar"),p=e.root.querySelector("[data-import-status-line]");c&&o!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${o}%`),p&&o!==null&&(p.textContent=`Reading file… ${o}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),h.event("import.contacts.start",{file:a.name,bytes:a.size,abId:s});const r=await w.importAddressBook(s,l,o=>{e.applyServerImportProgress(o)}),i=e.formatImportResult(r);await e.loadHome(),e.state.selectedAbId===s&&await Vt(e,s),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${i} (from “${a.name}”)`}),e.setFlash("success",`Import finished for “${a.name}”: ${i}.`)}catch(l){const r=l instanceof Error?l.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{e.state.busy=!1,e.render()}}async function dr(e,t){if(e.state.selectedAbId===null)return;const a=Ks(e,t),s=yt(a);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const n=await w.createContact(e.state.selectedAbId,a);e.state.creatingContact=!1,e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ae("Contact",yt(n.contact)||s,"created"))}else if(e.state.selectedContactUri){const n=await w.updateContact(e.state.selectedAbId,e.state.selectedContactUri,a);e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",ae("Contact",yt(n.contact)||s,"saved"))}try{await e.loadHome()}catch(n){if(console.error(n),e.state.selectedAbId!==null)try{await Vt(e,e.state.selectedAbId)}catch{}}}catch(n){e.setFlash("error",n instanceof Error?n.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function cr(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();if(s){e.state.busy=!0,e.clearFlash(),e.render();try{const l=await w.createAddressBook({displayname:s,description:n});e.state.selectedAbId=l.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${l.addressbook.displayname}” created`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function ur(e,t){if(e.state.selectedAbId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await w.updateAddressBook(e.state.selectedAbId,{displayname:s,description:n}),await e.loadHome(),e.setFlash("success",ae("Address book",s,"updated"))}catch(l){e.setFlash("error",l instanceof Error?l.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function mr(e){const{state:t}=e,a=t.addressBooks.map(k=>`<div class="cal-row${k.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${k.id}" role="button" tabindex="0">
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
      </div>`).join(""),s=t.addressBooks.find(k=>k.id===t.selectedAbId)??null,n=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map(k=>{const S=!t.creatingContact&&k.uri===t.selectedContactUri?" is-selected":"",v=d((k.displayname||"?").slice(0,1).toUpperCase()),g=k.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${d(w.contactPhotoUrl(t.selectedAbId,k.uri))}" alt="" loading="lazy" data-avatar-fallback="${v}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${v}</span>`;return`<tr class="contact-table-row${S}" data-action="select-contact" data-uri="${d(k.uri)}" tabindex="0" role="button">
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
            </tr>`}).join(""),l=t.editingContact,r=Array.isArray(l==null?void 0:l.emails)&&l.emails.length>0?l.emails:[""],i=Array.isArray(l==null?void 0:l.phones)&&l.phones.length>0?l.phones:[{type:"cell",value:""}],o=(l==null?void 0:l.address)??e.emptyAddress(),c=r.map((k,S)=>`<div class="multi-row" data-multi="email" data-idx="${S}">
        <input type="email" name="email_${S}" value="${d(k??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${S}" ${r.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),p=i.map((k,S)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${S}">
        <select name="phone_type_${S}" aria-label="Phone type">
          ${["cell","work","home","other"].map(v=>`<option value="${v}" ${((k==null?void 0:k.type)??"other")===v?"selected":""}>${v}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${S}" value="${d((k==null?void 0:k.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${S}" ${i.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),m=Array.isArray(l==null?void 0:l.custom)?l.custom:[],u=m.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':m.map((k,S)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${S}">
              <input type="text" name="custom_label_${S}" value="${d(k.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${S}" value="${d(k.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${S}" title="Remove">×</button>
            </div>`).join(""),b=t.contactModalOpen&&l&&s?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
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
                    ${t.photoPreview?`<img src="${d(t.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${d((l.fullname||l.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      ${t.photoPreview?"Change photo":"Upload photo"}
                      <input type="file" accept="image/*" data-action="contact-photo" ${t.busy?"disabled":""} hidden />
                    </label>
                    ${t.photoPreview||l.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${t.busy?"disabled":""}>Remove photo</button>`:""}
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${d(l.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${d(l.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${d(l.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${d(l.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${d(l.title)}" maxlength="200" autocomplete="off" />
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
                    ${p}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${i.length>=10?"disabled":""}>+ Phone</button>
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
                  <input type="url" name="url" value="${d(l.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${e.renderPortalDateTimeField({field:"birthday",name:"birthday",label:"Birthday",value:l.birthday||"",dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${u}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${m.length>=30?"disabled":""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${d(l.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>${t.creatingContact?"Create contact":"Save contact"}</button>
                  ${!t.creatingContact&&l.uri?`<button type="button" class="btn" data-action="export-contact" ${t.busy?"disabled":""}>Export .vcf</button>`:""}
                  ${t.creatingContact?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${t.busy?"disabled":""}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${t.busy?"disabled":""}>Cancel</button>
                  ${!t.creatingContact&&l.uri?`<span class="muted small mono">${d(l.uri)}</span>`:""}
                </div>
              </form>
            </div>
          </div>
        </div>`:"",y=t.abModalOpen&&s?U({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
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
                  ${M("Import / export","contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${t.busy?"disabled":""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${t.busy?"disabled":""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",f=t.deleteAbConfirmId!==null?t.addressBooks.find(k=>k.id===t.deleteAbConfirmId)??null:null,$=f?U({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${d(f.displayname)}</strong>
              <span class="muted small mono">(${d(f.uri)})</span>.</p>
            <p class="muted small">${(f.cardCount??0)>0?`All ${f.cardCount} contact${f.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${it({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${f.id}"`}]}):"";return`
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
        ${s?`<div class="card contacts-main-card">
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
                      ${n}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
      </section>
    </div>
    ${$}
    ${y}
    ${b}`}async function pr(e,t,a,s){var c,p;const{state:n,root:l,render:r,setFlash:i,clearFlash:o}=e;if(t==="select-ab"){const m=Number(a.dataset.id);if(!Number.isFinite(m))return!0;n.selectedAbId=m,n.abModalOpen=!1,n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.contactSearch="",n.contacts=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,o(),n.busy=!0,r();try{await e.loadContacts(m)}catch(u){i("error",u instanceof Error?u.message:"Failed to load contacts")}finally{n.busy=!1,r()}return!0}if(t==="edit-ab"){s.stopPropagation();const m=Number(a.dataset.id);if(!Number.isFinite(m)||!n.addressBooks.find(y=>y.id===m))return!0;const b=n.selectedAbId!==m;n.selectedAbId=m,n.abModalOpen=!0,n.contactModalOpen=!1,o(),b&&(n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactSearch="",n.contacts=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1),n.busy=!0,r();try{b&&await e.loadContacts(m)}catch(y){i("error",y instanceof Error?y.message:"Failed to open address book")}finally{n.busy=!1,r()}return!0}if(t==="close-ab-modal")return n.abModalOpen=!1,r(),!0;if(t==="select-contact"){const m=a.dataset.uri??"";if(!m)return!0;o();try{await e.openContact(m)}catch(u){i("error",u instanceof Error?u.message:"Failed to load contact")}return r(),!0}if(t==="new-contact")return n.selectedAbId===null||(e.startNewContact(),o(),r()),!0;if(t==="cancel-contact"||t==="close-contact-modal")return n.creatingContact=!1,n.contactModalOpen=!1,n.editingContact=null,n.selectedContactUri=null,n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="add-email"||t==="add-phone"||t==="add-custom")return n.editingContact&&(Oe(e.contactsHost),Array.isArray(n.editingContact.emails)||(n.editingContact.emails=[""]),Array.isArray(n.editingContact.phones)||(n.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(n.editingContact.custom)||(n.editingContact.custom=[]),t==="add-email"?n.editingContact.emails.length<10&&n.editingContact.emails.push(""):t==="add-phone"?n.editingContact.phones.length<10&&n.editingContact.phones.push({type:"other",value:""}):n.editingContact.custom.length<30&&n.editingContact.custom.push({label:"",value:""}),r()),!0;if(t==="remove-email"){if(!n.editingContact)return!0;Oe(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(n.editingContact.emails)?n.editingContact.emails:[""];return n.editingContact.emails=u.filter((b,y)=>y!==m),n.editingContact.emails.length===0&&(n.editingContact.emails=[""]),r(),!0}if(t==="remove-phone"){if(!n.editingContact)return!0;Oe(e.contactsHost);const m=Number(a.dataset.idx);if(!Number.isFinite(m))return!0;const u=Array.isArray(n.editingContact.phones)?n.editingContact.phones:[{type:"cell",value:""}];return n.editingContact.phones=u.filter((b,y)=>y!==m),n.editingContact.phones.length===0&&(n.editingContact.phones=[{type:"cell",value:""}]),r(),!0}if(t==="remove-custom"){if(!n.editingContact)return!0;Oe(e.contactsHost);const m=Number(a.dataset.idx);return Number.isFinite(m)&&(n.editingContact.custom=(Array.isArray(n.editingContact.custom)?n.editingContact.custom:[]).filter((u,b)=>b!==m),r()),!0}if(t==="remove-photo")return n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!0,n.editingContact&&(n.editingContact.hasPhoto=!1),r(),!0;if(t==="delete-contact"){if(n.selectedAbId===null||!n.selectedContactUri)return!0;const m=String(((c=n.editingContact)==null?void 0:c.fullname)||((p=n.editingContact)==null?void 0:p.displayname)||"this contact").trim()||"this contact";return n.confirmDelete={scope:"contact",title:"Delete contact",message:`Delete “${m}”?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="delete-ab"){s.stopPropagation();const m=Number(a.dataset.id??n.selectedAbId);return!Number.isFinite(m)||!n.addressBooks.find(b=>b.id===m)||(n.deleteAbConfirmId=m,n.abModalOpen=!1,n.contactModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-ab")return n.deleteAbConfirmId=null,r(),!0;if(t==="confirm-delete-ab"){const m=Number(a.dataset.id),u=l.querySelector("#delete-ab-confirm");if(!Number.isFinite(m)||!(u!=null&&u.checked))return!0;const b=n.addressBooks.find(f=>f.id===m);if(!b)return!0;const y=(b.cardCount??0)>0;n.busy=!0,o(),r();try{await w.deleteAddressBook(m,y),n.selectedAbId===m&&(n.selectedAbId=null,n.contacts=[],n.editingContact=null,n.selectedContactUri=null,n.creatingContact=!1),n.deleteAbConfirmId=null,n.abModalOpen=!1,n.contactModalOpen=!1,await e.loadHome(),n.selectedAbId===null&&n.addressBooks.length>0&&(n.selectedAbId=n.addressBooks[0].id,await e.loadContacts(n.selectedAbId)),i("success","Address book deleted")}catch(f){i("error",f instanceof Error?f.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="export-ab"){s.stopPropagation();const m=a.dataset.id,u=m!==void 0&&m!==""?Number(m):n.selectedAbId;if(u===null||Number.isNaN(u))return!0;n.busy=!0,o(),r();try{const{blob:b,filename:y}=await w.exportAddressBook(u),f=await e.saveBlobAsFile(b,y);f==="cancelled"?i("info","Export cancelled"):f==="saved"?i("success",`Saved ${y}`):i("success",`Download started: ${y}`)}catch(b){i("error",b instanceof Error?b.message:"Export failed")}finally{n.busy=!1,r()}return!0}if(t==="export-contact"){if(n.selectedAbId===null||!n.selectedContactUri||n.creatingContact)return!0;n.contactModalOpen=!0,n.busy=!0,o(),r();try{const{blob:m,filename:u}=await w.exportContact(n.selectedAbId,n.selectedContactUri),b=await e.saveBlobAsFile(m,u);b==="cancelled"?i("info","Export cancelled"):b==="saved"?i("success",`Saved ${u}`):i("success",`Download started: ${u}`)}catch(m){i("error",m instanceof Error?m.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}function Ht(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function ja(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function Kt(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),a=t[1]??"overview",s=ja(a)??"overview";let n=null;if(s==="users"&&t[2])try{n=decodeURIComponent(t[2])}catch{n=t[2]}return{tab:"admin",adminPage:s,adminUsername:n}}return{tab:Ht(e),adminPage:null,adminUsername:null}}function fr(){const e=Kt().tab;if(e)return e;try{const t=Ht(sessionStorage.getItem(ya));if(t)return t}catch{}return"calendars"}function br(){const e=Kt().adminPage;if(e)return e;try{const t=ja(sessionStorage.getItem(va));if(t)return t}catch{}return"overview"}function gr(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function $t(e,t="overview",a=null){try{sessionStorage.setItem(ya,e),e==="admin"&&sessionStorage.setItem(va,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const s=e==="admin"?gr(t,a):`#${e}`;location.hash!==s&&history.replaceState(null,"",`${location.pathname}${location.search}${s}`)}function ia(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(e)}</span>`}function kt(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function De(e,t,a){if(!z(e,t))return"";const s=e.activeTab===t;return`<button type="button" role="tab" class="tab-btn${s?" is-active":""}"
            data-action="tab" data-tab="${t}" aria-selected="${s}">
            ${a}
          </button>`}function yr(e){const{state:t,root:a}=e;if(!t.user){e.renderLogin();return}let s;switch(t.activeTab){case"calendars":s=z(t,"calendars")?la(e):Ce("Calendar","CalDAV");break;case"contacts":s=z(t,"contacts")?mr(e):Ce("Contacts","CardDAV");break;case"tasks":s=z(t,"tasks")?e.renderTasksTab():Ce("Tasks","Tasks (VTODO)");break;case"notes":s=z(t,"notes")?e.renderNotesTab():Ce("Notes","Notes (VJOURNAL)");break;case"files":s=z(t,"files")?e.renderFilesTab():Ce("Files","WebDAV file storage");break;case"admin":s=e.renderAdminSection();break;default:s=la(e)}const n=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",l=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage==="overview"?"admin-overview":t.adminPage==="users"?"admin-users":t.adminPage==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          ${De(t,"calendars","Calendar")}
          ${De(t,"contacts","Contacts")}
          ${De(t,"tasks","Tasks")}
          ${De(t,"notes","Notes")}
          ${De(t,"files","Files")}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${n}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;a.innerHTML=e.shell(s,{tabs:l}),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}function Ce(e,t){return`<div class="panel empty-panel">
    <h2>${e}</h2>
    <p class="muted">${e} is disabled in system settings (Enable ${t}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`}function vr(e){const{state:t,render:a}=e;e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),Ze(t),t.eventDtPicker&&Sn(t,a),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),Fa(e.filesHost),e.bindHolidaysToggle(),$r(e)}function $r(e){var l;const{state:t,root:a}=e;if(!t.listKeyboardFocus||t.activeTab!=="contacts"&&t.activeTab!=="tasks"&&t.activeTab!=="notes")return;const s=document.activeElement;if(s&&a.contains(s)&&s.matches("input:not([type=checkbox]), textarea, select")&&!s.closest("tr.contact-table-row[data-action]")||(l=s==null?void 0:s.closest)!=null&&l.call(s,"tr.contact-table-row[data-action]"))return;let n=null;if(t.activeTab==="contacts"&&t.selectedContactUri)n=a.querySelector(`tr[data-action="select-contact"][data-uri="${CSS.escape(t.selectedContactUri)}"]`);else if(t.activeTab==="tasks"&&t.selectedTaskKey){const r=t.selectedTaskKey.indexOf("|");if(r>0){const i=t.selectedTaskKey.slice(0,r),o=t.selectedTaskKey.slice(r+1);n=a.querySelector(`tr[data-action="select-task"][data-instance="${CSS.escape(i)}"][data-uri="${CSS.escape(o)}"]`)}}else if(t.activeTab==="notes"&&t.selectedNoteKey){const r=t.selectedNoteKey.indexOf("|");if(r>0){const i=t.selectedNoteKey.slice(0,r),o=t.selectedNoteKey.slice(r+1);n=a.querySelector(`tr[data-action="select-note"][data-instance="${CSS.escape(i)}"][data-uri="${CSS.escape(o)}"]`)}}if(!n){const r=t.activeTab==="contacts"?"select-contact":t.activeTab==="tasks"?"select-task":"select-note";n=a.querySelector(`tr.contact-table-row[data-action="${r}"]`)}n&&n.focus({preventScroll:!0})}async function kr(e,t,a,s){const{state:n,render:l,clearFlash:r,setFlash:i}=e;if(t==="confirm-delete-cancel")return Zt(n),l(),!0;if(t==="confirm-delete-ok"){const o=n.confirmDelete;if(!o)return l(),!0;const c=o.scope;if(Zt(n),c==="event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return l(),!0;const p=n.editingEvent.instanceId,m=n.editingEvent.uri;n.busy=!0,r(),l();try{await w.deleteEvent(p,m),n.eventModalOpen=!1,n.editingEvent=null,await e.loadMonthEvents(),i("success","Event deleted")}catch(u){i("error",u instanceof Error?u.message:"Delete failed")}finally{n.busy=!1,l()}return!0}if(c==="task"){if(!n.editingTask||n.creatingTask)return l(),!0;n.busy=!0,r(),l();try{await w.deleteTask(n.editingTask.instanceId,n.editingTask.uri),n.selectedTaskKey=null,n.editingTask=null,await e.loadTasks(),i("success","Task deleted")}catch(p){i("error",p instanceof Error?p.message:"Delete failed")}finally{n.busy=!1,l()}return!0}if(c==="note"){if(!n.editingNote||n.creatingNote)return l(),!0;n.busy=!0,r(),l();try{await w.deleteNote(n.editingNote.instanceId,n.editingNote.uri),n.selectedNoteKey=null,n.editingNote=null,await e.loadNotes(),i("success","Note deleted")}catch(p){i("error",p instanceof Error?p.message:"Delete failed")}finally{n.busy=!1,l()}return!0}if(c==="contact"){if(n.selectedAbId===null||!n.selectedContactUri)return l(),!0;n.busy=!0,r(),n.contactModalOpen=!0,l();try{await w.deleteContact(n.selectedAbId,n.selectedContactUri),n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.eventDtPicker=null,n.photoPreview=null,await e.loadHome(),i("success","Contact deleted")}catch(p){i("error",p instanceof Error?p.message:"Delete failed")}finally{n.busy=!1,l()}return!0}if(c==="bulk-task")return await e.runBulkTaskAction("bulk-task-delete"),!0;if(c==="revoke-share"){const p=o.href??"";if(!p||n.selectedId===null)return l(),!0;n.calModalOpen=!0,n.busy=!0,r(),l();try{await w.revoke(n.selectedId,p),await e.loadShares(n.selectedId),i("success","Share revoked")}catch(m){i("error",m instanceof Error?m.message:"Revoke failed")}finally{n.busy=!1,l()}return!0}return l(),!0}if(t==="close-import-progress")return n.importProgress&&(n.importProgress.phase==="done"||n.importProgress.phase==="error")&&e.closeImportProgress(),!0;if(t==="logout"){n.busy=!0,h.event("logout");try{await w.logout()}catch{}return e.clearPortalSessionState(),r(),l(),!0}if(t==="info"){const o=a.dataset.info??"";return e.openInfoModal(o),!0}if(t==="info-close")return e.closeInfoModal(),!0;if(t==="flash-close")return r(),l(),!0;if(t==="user-menu-toggle")return s.stopPropagation(),n.userMenuOpen=!n.userMenuOpen,l(),!0;if(t==="user-menu-close")return n.userMenuOpen&&(n.userMenuOpen=!1,l()),!0;if(t==="tab"){const o=Ht(a.dataset.tab);return o&&(o==="admin"&&(n.adminPage="overview"),await e.activateTab(o)),!0}return!1}async function Wa(e,t){const a=t.target.closest("[data-action]");if(!a)return;const s=a.dataset.action;s&&(h.debug(`action:${s}`,{id:a.dataset.id,tab:a.dataset.tab,uri:a.dataset.uri}),!await kr(e,s,a,t)&&(s.startsWith("admin-")&&await gs(e.adminHost,s,a)||(s.startsWith("files-")||s==="close-files-upload-progress")&&await zn(e.filesHost,s,a,t)||await zs(e,s,a,t)||await nr(e,s,a,t)||await Ys(e,s,a)||await pr(e,s,a,t)))}const oa=new WeakMap;function hr(e){if(oa.has(e.root)){h.debug("portalEvents: already bound for root");return}oa.set(e.root,!0),e.state.portalEventsBound=!0,e.state.escapeBound=!0;const{root:t}=e;t.addEventListener("click",a=>wr(e,a)),t.addEventListener("submit",a=>Sr(e,a)),t.addEventListener("change",a=>Dr(e,a)),t.addEventListener("input",a=>Cr(e,a)),t.addEventListener("keydown",a=>Tr(e,a)),document.addEventListener("keydown",a=>Fr(e,a)),t.addEventListener("dragenter",a=>He(e,"enter",a)),t.addEventListener("dragover",a=>He(e,"over",a)),t.addEventListener("dragleave",a=>He(e,"leave",a)),t.addEventListener("drop",a=>He(e,"drop",a)),t.addEventListener("error",a=>Ar(e,a),!0),h.event("portalEvents.registered")}function wr(e,t){var n,l;const a=(l=(n=t.target)==null?void 0:n.closest)==null?void 0:l.call(n,"[data-action]");if(!a||!e.root.contains(a))return;const s=a.dataset.action??"";(s==="info"||s==="info-close")&&(t.preventDefault(),t.stopPropagation()),(s==="dt-set-month"||s==="dt-set-year")&&t.stopPropagation(),(s==="select-contact"||s==="select-task"||s==="select-note")&&(e.state.listKeyboardFocus=!0),h.debug("portalEvents.click",{action:s}),Wa(e,t)}function Sr(e,t){var n,l;const a=(l=(n=t.target)==null?void 0:n.closest)==null?void 0:l.call(n,"form[data-form]");if(!a||!e.root.contains(a))return;const s=a.dataset.form??"";if(s)switch(t.preventDefault(),h.debug("portalEvents.submit",{form:s}),s){case"login":e.onLogin(a);return;case"share":e.onShare(a);return;case"edit-event":e.onSaveEvent(a);return;case"edit-cal":e.onEditCal(a);return;case"create-cal":e.onCreateCal(a);return;case"contact":e.onSaveContact(a);return;case"create-ab":e.onCreateAb(a);return;case"edit-ab":e.onEditAb(a);return;case"task":e.onSaveTask(a);return;case"note":e.onSaveNote(a);return;case"files-rename":Hn(e.filesHost,a);return;case"files-transfer":Cn(e.filesHost,a);return;case"files-mkdir":Kn(e.filesHost,a);return;case"admin-user-create":ts(e.adminHost,a);return;case"admin-user-edit":as(e.adminHost,a);return;case"admin-cal":ns(e.adminHost,a);return;case"admin-ab":ss(e.adminHost,a);return;case"admin-settings":ds(e.adminHost,a);return;case"admin-database":cs(e.adminHost,a);return;default:h.debug("portalEvents.submit.unknown",{form:s})}}function Dr(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:l}=e,r=a.closest("[data-action]"),i=(r==null?void 0:r.dataset.action)??"";if(i==="dt-set-month"||i==="dt-set-year"){t.stopPropagation(),h.debug("portalEvents.change",{action:i}),Wa(e,t);return}if(i==="admin-db-backend"&&a instanceof HTMLSelectElement){s.adminDbFormBackend=a.value==="pgsql"?"pgsql":"sqlite",l();return}if(i==="files-upload-pick-files"&&a instanceof HTMLInputElement){na(e.filesHost,a,!1);return}if(i==="files-upload-pick-folder"&&a instanceof HTMLInputElement){na(e.filesHost,a,!0);return}if(i==="import-cal"&&a instanceof HTMLInputElement){Ls(e.calendarsHost,a);return}if(i==="import-create-cal"&&a instanceof HTMLInputElement){_s(e.calendarsHost,a);return}if(i==="import-ab"&&a instanceof HTMLInputElement){e.calendarsHost.onImportContacts(a);return}if(i==="contact-photo"&&a instanceof HTMLInputElement){ir(e.contactsHost,a);return}if(a instanceof HTMLInputElement&&a.id==="delete-cal-confirm"){const o=n.querySelector("#delete-cal-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLInputElement&&a.id==="delete-ab-confirm"){const o=n.querySelector("#delete-ab-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLSelectElement&&(a.name==="repeatFreq"||a.name==="repeatEndMode")){const o=a.closest('[data-form="edit-event"]');if(o&&s.editingEvent){const c=new FormData(o);s.editingEvent={...s.editingEvent,repeat:xe(c),hasRrule:!!String(c.get("repeatFreq")??"").trim()},l()}return}if(a instanceof HTMLSelectElement&&a.name==="instanceId"){const o=a.closest('[data-form="task"]');if(o&&s.creatingTask&&s.editingTask){const p=Number(a.value);if(!Number.isFinite(p)||p<=0)return;e.syncEditingTaskFromForm(o);const m=s.editingTask.parentUid;s.editingTask={...s.editingTask,instanceId:p,parentUid:m&&s.tasks.some(u=>u.uid===m&&u.instanceId===p)?m:null},l();return}const c=a.closest('[data-form="note"]');if(c&&s.creatingNote&&s.editingNote){const p=Number(a.value);if(!Number.isFinite(p)||p<=0)return;e.syncEditingNoteFromForm(c),s.editingNote={...s.editingNote,instanceId:p},l();return}}if(a instanceof HTMLInputElement&&a.name==="holidays"&&a.closest('[data-form="create-cal"]')){Va(e.calendarsHost);return}if(a instanceof HTMLInputElement&&a.name==="color"){const o=a.closest("form"),c=o==null?void 0:o.querySelector('input[name="color_picker"]');if(c){let p=a.value.trim();p&&!p.startsWith("#")&&(p=`#${p}`),/^#[0-9A-Fa-f]{6}/.test(p)&&(c.value=p.slice(0,7),a.value=p.toUpperCase())}return}}function Cr(e,t){var o;const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:l,setFlash:r}=e;if(a instanceof HTMLInputElement&&a.name==="color_picker"){const c=a.closest("form"),p=c==null?void 0:c.querySelector('input[name="color"]');p&&(p.value=a.value.toUpperCase());return}const i=((o=a.closest("[data-action]"))==null?void 0:o.dataset.action)??"";if(i==="contact-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.contactSearch=c,(async()=>{try{s.selectedAbId!==null&&await e.loadContacts(s.selectedAbId),l()}catch(p){r("error",p instanceof Error?p.message:"Search failed"),l()}})()},250);return}if(i==="task-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.taskSearch=c,(async()=>{try{await e.loadTasks(),l()}catch(p){r("error",p instanceof Error?p.message:"Search failed"),l()}})()},250);return}if(i==="note-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const c=a.value;s.searchTimer=setTimeout(()=>{s.noteSearch=c,(async()=>{try{await e.loadNotes(),l()}catch(p){r("error",p instanceof Error?p.message:"Search failed"),l()}})()},250);return}if(i==="admin-db-confirm-input"&&a instanceof HTMLInputElement){s.adminDbConfirmText=a.value;const c=n.querySelector('[data-action="admin-db-confirm-save"]');c&&(c.disabled=s.busy||s.adminDbConfirmText.trim()!=="CONFIRM");return}if(i==="admin-reset-password"&&a instanceof HTMLInputElement){s.adminResetPassword=a.value;const c=n.querySelector('[data-action="admin-reset-confirm"]');c&&(c.disabled=s.busy||!s.adminResetConfirmChecked||s.adminResetPassword.trim()==="");return}}const da='tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]',ca="tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]";function Er(e){const{state:t,root:a}=e;let s="";if(t.activeTab==="contacts")s="select-contact";else if(t.activeTab==="tasks")s="select-task";else if(t.activeTab==="notes")s="select-note";else return[];return Array.from(a.querySelectorAll(`tr.contact-table-row[data-action="${s}"]`))}function Ee(e){e.focus({preventScroll:!1}),e.scrollIntoView({block:"nearest"})}function Tr(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const s=e.state.activeTab,n=s==="contacts"||s==="tasks"||s==="notes",l=a instanceof HTMLInputElement&&(a.dataset.action==="contact-search"||a.dataset.action==="task-search"||a.dataset.action==="note-search");if(!l&&a.closest("button, a, input, select, textarea, [contenteditable=true]")&&!a.matches(ca)&&!a.matches(da))return;if(n&&(t.key==="ArrowDown"||t.key==="ArrowUp"||t.key==="Home"||t.key==="End")){const i=Er(e);if(i.length===0)return;const o=a.closest(da);if(e.state.listKeyboardFocus=!0,t.preventDefault(),!o||l){t.key==="ArrowDown"||t.key==="Home"?Ee(i[0]):Ee(i[i.length-1]);return}const c=i.indexOf(o);if(c<0)return;if(t.key==="Home"){Ee(i[0]);return}if(t.key==="End"){Ee(i[i.length-1]);return}const p=t.key==="ArrowDown"?i[c+1]:i[c-1];p&&Ee(p);return}if(t.key!=="Enter"&&t.key!==" ")return;const r=a.closest(ca);!r||!e.root.contains(r)||t.target!==r&&t.target.closest("button, a, input, select, textarea")||(t.preventDefault(),(r.dataset.action==="select-contact"||r.dataset.action==="select-task"||r.dataset.action==="select-note")&&(e.state.listKeyboardFocus=!0),h.debug("portalEvents.keydown.row",{action:r.dataset.action,key:t.key}),r.click())}function He(e,t,a){var o,c,p;const{state:s,root:n}=e;if(s.activeTab!=="files"||s.busy||s.filesUploadProgress||!On(a.dataTransfer))return;const l=(c=(o=a.target)==null?void 0:o.closest)==null?void 0:c.call(o,"[data-files-drop-target]");if(!l||!n.contains(l)){if(t==="leave"&&s.filesDropDepth>0){const m=a.relatedTarget;m&&m instanceof Node&&((p=n.querySelector("[data-files-drop-target]"))==null?void 0:p.contains(m))||(s.filesDropDepth=0,Pr(e))}return}if(t==="enter"){a.preventDefault(),a.stopPropagation(),s.filesDropDepth+=1,Ke(e,l,!0);return}if(t==="over"){a.preventDefault(),a.stopPropagation(),a.dataTransfer&&(a.dataTransfer.dropEffect="copy"),Ke(e,l,!0);return}if(t==="leave"){a.preventDefault(),a.stopPropagation();const m=a.relatedTarget;if(m&&l.contains(m))return;s.filesDropDepth=Math.max(0,s.filesDropDepth-1),s.filesDropDepth===0&&Ke(e,l,!1);return}a.preventDefault(),a.stopPropagation(),s.filesDropDepth=0,Ke(e,l,!1);const r=a.dataTransfer;if(!r||s.busy||s.filesUploadProgress)return;s.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside();const i=Un(r);h.event("files.drop.snapshot",{handles:i.handlePromises.length,entries:i.entries.filter(Boolean).length,files:i.files.length}),(async()=>{try{const m=await In(i);if(h.event("files.drop.items",{count:m.length,sample:m.slice(0,8).map(u=>u.relativePath)}),m.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await xt(e.filesHost,m)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Drop failed"),e.render()}})()}function Ke(e,t,a){if(e.state.filesUploadDropActive===a){t.classList.toggle("is-dragover",a);return}e.state.filesUploadDropActive=a,t.classList.toggle("is-dragover",a)}function Pr(e){e.state.filesUploadDropActive=!1,e.root.querySelectorAll("[data-files-drop-target].is-dragover").forEach(t=>{t.classList.remove("is-dragover")})}function Ar(e,t){const a=t.target;if(!(a instanceof HTMLImageElement)||!a.classList.contains("contact-avatar")||!a.dataset.avatarFallback||!a.isConnected)return;const s=a.dataset.avatarFallback||"?",n=document.createElement("span");n.className="contact-avatar contact-avatar-fallback",n.setAttribute("aria-hidden","true"),n.textContent=s,a.replaceWith(n)}function Fr(e,t){if(t.key!=="Escape")return;const{state:a,render:s}=e;if(a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")){e.closeImportProgress();return}if(a.importProgress)return;if(a.filesUploadProgress&&(a.filesUploadProgress.phase==="done"||a.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(a.filesUploadProgress)return;if(a.filesUploadMenuOpen){a.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),s();return}if(a.userMenuOpen){a.userMenuOpen=!1,e.unbindUserMenuOutside(),s();return}if(a.filesUploadConflict!==null){Ye(e.filesHost,"cancel");return}if(a.filesRenamePath!==null||a.filesDeletePaths!==null||a.filesTransfer!==null||a.filesMkdirOpen){a.filesRenamePath=null,a.filesDeletePaths=null,e.resetFilesTransferTree(),a.filesMkdirOpen=!1,s();return}if(a.confirmDelete){a.confirmDelete=null,s();return}const n=e.root.querySelector("#info-modal");if(n&&!n.hidden){e.closeInfoModal();return}if(a.eventDtPicker){a.eventDtPicker=null,Ze(a),s();return}if(a.eventModalOpen){a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,s();return}if(a.contactModalOpen){a.contactModalOpen=!1,a.editingContact=null,a.creatingContact=!1,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,s();return}if(a.abModalOpen){a.abModalOpen=!1,s();return}if(a.calModalOpen||a.createCalModalOpen||a.deleteConfirmId!==null||a.deleteAbConfirmId!==null){a.calModalOpen=!1,a.createCalModalOpen=!1,a.deleteConfirmId=null,a.deleteAbConfirmId=null,s();return}if(a.adminUserCreateOpen||a.adminUserEditOpen||a.adminUserDeleteUsername!==null){a.adminUserCreateOpen=!1,a.adminUserEditOpen=!1,a.adminUserDeleteUsername=null,s();return}if(a.adminResetModalOpen){a.adminResetModalOpen=!1,s();return}if(a.adminDbConfirmOpen){a.adminDbConfirmOpen=!1,a.adminDbConfirmText="",a.adminDbPendingBody=null,s();return}(a.adminCalModal!==null||a.adminAbModal!==null||a.adminResourceDelete!==null)&&(a.adminCalModal=null,a.adminAbModal=null,a.adminResourceDelete=null,s())}function ht(e){const{state:t}=e;if(t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())){t.activeTab=Xe(t),t.adminPage="overview",e.persistTab(t.activeTab);return}t.activeTab!=="admin"&&!z(t,t.activeTab)&&(t.activeTab=Xe(t),e.persistTab(t.activeTab))}async function Ur(e,t,a={}){return Oa(e.adminHost,t,a)}async function ua(e,t,a={}){const{state:s,render:n,setFlash:l,clearFlash:r}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&s.adminCapabilities&&!s.adminCapabilities.uiEnabled&&l("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t=Xe(s)),t!=="admin"&&!z(s,t)&&(l("info","That section is disabled in system settings."),t=Xe(s)),t==="admin"){await e.activateAdminPage(s.adminPage||"overview",{...a,username:s.adminPage==="users"?s.adminSelectedUsername:null});return}s.activeTab=t,s.userMenuOpen=!1,s.listKeyboardFocus=!1,e.persistTab(t),h.event("tab",{tab:t}),t!=="calendars"&&(s.calModalOpen=!1,s.deleteConfirmId=null),t!=="contacts"&&(s.deleteAbConfirmId=null),a.clearFlash!==!1&&r(),s.busy=!0,n();try{t==="contacts"&&s.selectedAbId!==null?await e.loadContacts(s.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await e.loadTasks():t==="notes"?await e.loadNotes():t==="files"&&await e.loadFiles()}catch(i){h.warn("tab load failed",i instanceof Error?i.message:i),l("error",i instanceof Error?i.message:"Failed to load")}finally{s.busy=!1,n()}}async function Te(e){var l;const{state:t}=e;h.debug("loadHome");const[a,s,n]=await Promise.all([w.calendars(),w.directory().catch(()=>({users:[]})),w.addressbooks()]);if(t.calendars=a.calendars,t.directory=s.users,t.addressBooks=n.addressbooks,h.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await w.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(i=>i.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),!t.calendarSelectionSeeded&&t.selectedIds.length===0){const r=Cs((l=t.user)==null?void 0:l.username);if(r){const i=r.ids.filter(o=>t.calendars.some(c=>c.id===o));t.selectedIds=i,r.selectedId!==null&&t.calendars.some(o=>o.id===r.selectedId)?t.selectedId=r.selectedId:t.selectedId=i[0]??null,t.calendarSelectionSeeded=!0,h.debug("loadHome.calSelection.restored",{count:i.length,selectedId:t.selectedId})}else{const i=e.pickDefaultCalendar();i?(t.selectedIds=[i.id],t.selectedId=i.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id),t.calendarSelectionSeeded=!0}}else t.selectedIds.length===0?t.selectedId=null:t.calendarSelectionSeeded=!0;t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),st(t),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await e.loadTasks(),t.activeTab==="notes"&&await e.loadNotes(),t.activeTab==="files"&&await e.loadFiles()}function Ir(e){const{state:t}=e;return Lt(t.portalUi.timeFormat)}function Or(e){const{state:t}=e;return _t(t.portalUi.weekStart)}function Mr(e){const{state:t}=e;return Ma(t.portalUi.weekStart)}function Ja(e,t,a){const{state:s}=e;return ks(t,a,s.portalUi.timeFormat)}function Nr(e,t,a,s,n){var c,p;const{state:l}=e,r=ve(a),i=((c=l.eventDtPicker)==null?void 0:c.viewY)??Number(r.date.slice(0,4)),o=((p=l.eventDtPicker)==null?void 0:p.viewM)??Number(r.date.slice(5,7))-1;return Ss({field:t,value:a,dateOnly:s,allowClear:n,viewY:i,viewM:o,weekStart:l.portalUi.weekStart,timeFormat:l.portalUi.timeFormat})}function wt(e){Ds(e.root)}function Pe(e,t){var b;const{state:a}=e,{field:s,name:n,label:l,value:r,dateOnly:i=!1,required:o,disabled:c,allowClear:p=!0}=t,m=((b=a.eventDtPicker)==null?void 0:b.field)===s,u=Ja(e,r,i);return`<div class="dt-field${m?" is-open":""}" data-dt-id="${d(s)}">
    <span class="dt-field-label">${d(l)}</span>
    <input type="hidden" name="${d(n)}" value="${d(r)}" ${o?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(s)}"
      data-dt-name="${d(n)}" data-dt-date-only="${i?"1":"0"}" data-dt-clear="${p?"1":"0"}"
      ${c?"disabled":""} aria-expanded="${m}">
      <span class="dt-trigger-text">${d(u)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${m&&!c?Nr(e,s,r,i,p):""}
  </div>`}function ma(e,t){var s,n,l,r,i,o,c,p;const{state:a}=e;return t==="start"?String(((s=a.editingEvent)==null?void 0:s.start)||""):t==="end"?String(((n=a.editingEvent)==null?void 0:n.end)||""):t==="until"?((r=(l=a.editingEvent)==null?void 0:l.repeat)==null?void 0:r.until)||$e((i=a.editingEvent)==null?void 0:i.start)||N(new Date):t==="due"?he((o=a.editingTask)==null?void 0:o.due):t==="dtstart"?he((c=a.editingNote)==null?void 0:c.dtstart):t==="bulk-due"?a.bulkDueValue:t==="birthday"?String(((p=a.editingContact)==null?void 0:p.birthday)||""):""}function pa(e,t,a){const{state:s}=e;if(t==="start"&&s.editingEvent){s.editingEvent={...s.editingEvent,start:a||""};return}if(t==="end"&&s.editingEvent){s.editingEvent={...s.editingEvent,end:a};return}if(t==="until"&&s.editingEvent){s.editingEvent={...s.editingEvent,repeat:{...s.editingEvent.repeat??e.defaultRepeat(),until:a,endMode:"until"}};return}if(t==="due"&&s.editingTask){if(a===null||a==="")s.editingTask={...s.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingTask={...s.editingTask,due:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingTask={...s.editingTask,due:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="dtstart"&&s.editingNote){if(a===null||a==="")s.editingNote={...s.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingNote={...s.editingNote,dtstart:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingNote={...s.editingNote,dtstart:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="birthday"&&s.editingContact){s.editingContact={...s.editingContact,birthday:a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null};return}t==="bulk-due"&&(s.bulkDueValue=a||"")}function xr(e,t){const{root:a}=e,s=kn[t];if(!s)return;const n=a.querySelector("#info-modal"),l=a.querySelector("#info-modal-title"),r=a.querySelector("#info-modal-body");if(!n||!l||!r)return;l.textContent=s.title,r.innerHTML=s.paragraphs.map(o=>`<p>${d(o)}</p>`).join(""),n.hidden=!1,document.body.classList.add("info-modal-open");const i=n.querySelector(".info-modal-close");i==null||i.focus()}function Lr(e){const{root:t}=e,a=t.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function _r(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const r=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await r.write(e)}finally{await r.close()}return"saved"}catch(l){if(l instanceof DOMException&&l.name==="AbortError")return"cancelled"}const s=URL.createObjectURL(e),n=document.createElement("a");return n.href=s,n.download=t,n.rel="noopener",n.style.display="none",document.body.appendChild(n),n.click(),window.setTimeout(()=>{URL.revokeObjectURL(s),n.remove()},6e4),"started"}function Rr(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let s=a.value.trim();s&&!s.startsWith("#")&&(s=`#${s}`),/^#[0-9A-Fa-f]{6}/.test(s)&&(t.value=s.slice(0,7),a.value=s.toUpperCase())}))}function qr(e){const t=dn({activeTab:fr(),adminPage:br(),adminSelectedUsername:Kt().adminUsername??null});let a,s,n,l,r,i,o;function c(g,D){$a(t,g,D)}function p(){mn(t)}function m(){const g=Qt(e);t.user?yr(o):Gt(e,t,(D,P)=>gt(t,D,P,{renderImportProgressModal:()=>Ve(n),renderFilesUploadProgressModal:()=>Be(a)})),vr(o),Xt(e,g),requestAnimationFrame(()=>{var D;wt(o),(D=e.querySelector(".dt-time.is-selected"))==null||D.scrollIntoView({block:"center"})})}function u(){te(n)}function b(){ke(a)}function y(){K(a)}function f(){Ct(t)}function $(){ee(a)}function k(){pn(t,{stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,resetFilesTransferTree:y,unbindUserMenuOutside:f,unbindFilesUploadMenuOutside:$})}function S(g){fn(t,{message:g,clearSession:k,render:m})}function v(){return{state:t,render:m,handleSessionExpired:S,clearPortalSessionState:k,normalizeActiveTab:()=>ht(o),persistTab:$t,loadHome:()=>Te(o),loadAdminCapabilities:()=>Pt(s),loadAdminDashboard:()=>tt(s),loadAdminUsers:()=>ce(s),loadAdminUserDetail:g=>j(s,g),loadAdminUserResources:g=>ue(s,g),loadAdminSystemSettings:()=>at(s),loadAdminDatabaseSettings:()=>nt(s),adminPageMeta:g=>ne(s,g),setFlash:c,clearFlash:p}}a={state:t,root:e,render:m,setFlash:c,clearFlash:p},s={state:t,root:e,render:m,setFlash:c,clearFlash:p,userIsAdmin:()=>de(t),adminUiEnabled:()=>Ne(t),persistTab:$t,activateTab:(g,D)=>ua(o,g,D),loadHome:()=>Te(o),normalizeActiveTab:()=>ht(o)},n={state:t,root:e,render:m,setFlash:c,clearFlash:p,localeWeekStart:()=>Or(o),localeDowLabels:()=>Mr(o),formatDtDisplay:(g,D)=>Ja(o,g,D),timeFormatOpts:()=>Ir(o),renderPortalDateTimeField:g=>Pe(o,g),getDtFieldCurrentValue:g=>ma(o,g),setDtFieldValue:(g,D)=>pa(o,g,D),positionDtPopovers:()=>wt(o),renderFlashBanner:()=>St(t),accessBadge:ia,formatImportResult:kt,loadHome:()=>Te(o),onImportContacts:g=>or(i,g)},l={state:t,root:e,render:m,setFlash:c,clearFlash:p,renderPortalDateTimeField:g=>Pe(o,g)},r={state:t,root:e,render:m,setFlash:c,clearFlash:p,renderPortalDateTimeField:g=>Pe(o,g)},i={state:t,root:e,render:m,setFlash:c,clearFlash:p,renderPortalDateTimeField:g=>Pe(o,g),stopImportElapsedTimer:()=>te(n),startImportElapsedTimer:()=>La(n),setImportPhase:(g,D)=>Ie(n,g,D),applyServerImportProgress:g=>_a(n,g),readFileTextWithProgress:(g,D)=>qa(n,g,D),formatImportResult:kt,loadHome:()=>Te(o)},o={state:t,root:e,render:m,setFlash:c,clearFlash:p,filesHost:a,adminHost:s,calendarsHost:n,notesHost:l,tasksHost:r,contactsHost:i,clearPortalSessionState:k,userIsAdmin:()=>de(t),adminUiEnabled:()=>Ne(t),normalizeActiveTab:()=>ht(o),persistTab:$t,activateTab:(g,D)=>ua(o,g,D),activateAdminPage:(g,D)=>Ur(o,g,D),loadHome:()=>Te(o),handleSessionExpired:S,loadFiles:()=>Z(a),loadShares:g=>qt(n,g),loadMonthEvents:()=>ut(n),loadContacts:g=>Vt(i,g),loadTasks:()=>rt(r),loadNotes:()=>Ha(l),loadAdminCapabilities:()=>Pt(s),loadAdminDashboard:()=>tt(s),loadAdminUsers:()=>ce(s),loadAdminUserDetail:g=>j(s,g),loadAdminUserResources:g=>ue(s,g),loadAdminSystemSettings:()=>at(s),loadAdminDatabaseSettings:()=>nt(s),adminPageMeta:g=>ne(s,g),pickDefaultCalendar:()=>Es(n),toggleCalendarSelected:g=>Ps(n,g),blankEventForDay:(g,D)=>Ms(n,g,D),defaultRepeat:()=>Bt(),itemKey:L,openContact:g=>sr(i,g),startNewContact:()=>rr(i),emptyAddress:()=>za(),syncEditingEventFromForm:g=>Ns(n,g),syncEditingTaskFromForm:g=>er(r,g),syncEditingNoteFromForm:g=>Ws(l,g),runBulkTaskAction:g=>tr(r,g),shell:(g,D)=>gt(t,g,D,{renderImportProgressModal:()=>Ve(n),renderFilesUploadProgressModal:()=>Be(a)}),renderLogin:()=>Gt(e,t,(g,D)=>gt(t,g,D,{renderImportProgressModal:()=>Ve(n),renderFilesUploadProgressModal:()=>Be(a)})),renderFlashBanner:()=>St(t),renderMonthGrid:()=>Us(n),renderEventModal:()=>Os(n),renderImportProgressModal:()=>Ve(n),renderFilesUploadProgressModal:()=>Be(a),renderTasksTab:()=>Zs(r),renderNotesTab:()=>js(l),renderFilesTab:()=>Vn(a),renderAdminSection:()=>fs(s),adminSubnavButtons:()=>Wn(s),renderPortalDateTimeField:g=>Pe(o,g),getDtFieldCurrentValue:g=>ma(o,g),setDtFieldValue:(g,D)=>pa(o,g,D),positionDtPopovers:()=>wt(o),accessBadge:ia,formatImportResult:kt,closeImportProgress:()=>xs(n),closeFilesUploadProgress:()=>Ta(a),resetFilesTransferTree:y,stopImportElapsedTimer:u,stopFilesUploadElapsedTimer:b,unbindUserMenuOutside:f,bindUserMenuOutside:()=>wn(t,m),unbindFilesUploadMenuOutside:$,bindFilesUploadMenuOutside:()=>Nn(a),onLogin:g=>vn(g,v()),onShare:g=>Rs(n,g),onSaveEvent:g=>qs(n,g),onEditCal:g=>Bs(n,g),onCreateCal:g=>Vs(n,g),onSaveContact:g=>dr(i,g),onCreateAb:g=>cr(i,g),onEditAb:g=>ur(i,g),onSaveTask:g=>ar(r,g),onSaveNote:g=>Js(l,g),bindColorPair:Rr,bindImportInput:()=>void 0,bindHolidaysToggle:()=>Hs(n),bindContactPhotoInput:()=>void 0,bindFilesDom:()=>Fa(a),bindAdminDom:()=>void 0,saveBlobAsFile:_r,openInfoModal:g=>xr(o,g),closeInfoModal:()=>Lr(o),captureScroll:()=>Qt(e),restoreScroll:g=>Xt(e,g)},hr(o),yn(v())}let se="",E=null,A=!1,q=null,J=null,X="sqlite",lt=!1;async function mt(e,t={}){const a={Accept:"application/json",...t.headers};t.body&&(a["Content-Type"]="application/json"),se&&t.method&&t.method!=="GET"&&(a["X-CSRF-Token"]=se);const s=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:a});let n;try{n=await s.json()}catch{throw new Error(`Request failed (${s.status})`)}if(!s.ok)throw new Error(n.error||`Request failed (${s.status})`);return n&&typeof n=="object"&&"data"in n&&n.data!==void 0?n.data:n}async function zt(){var e;E=await mt("/status"),se=E.csrfToken||se,((e=E.defaults)==null?void 0:e.backend)==="pgsql"?X="pgsql":X="sqlite"}function Ae(e,t,a){return`<label class="check-row"><input type="checkbox" name="${d(e)}" ${t?"checked":""} ${A?"disabled":""} /> ${d(a)}</label>`}function Br(){const e=E==null?void 0:E.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${d((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${d((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${W("error",(E==null?void 0:E.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${A?"disabled":""}>Retry</button>
  </section>`}function Vr(){const e=E==null?void 0:E.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${A?"disabled":""}>
          ${Ua((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ae("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ae("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${Ae("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ae("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ae("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
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
  </section>`}function Hr(){const e=E==null?void 0:E.defaults,t=(E==null?void 0:E.pdoDrivers)||[],a=t.includes("sqlite"),s=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${A?"disabled":""}>
          ${a?`<option value="sqlite" ${X==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${s?`<option value="pgsql" ${X==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${X==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${d((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${A?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${X==="pgsql"?"":"display:none"}">
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
  </section>`}function Kr(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${d(String((E==null?void 0:E.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${d((E==null?void 0:E.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${lt?"checked":""} ${A?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${A||!lt?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function zr(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${d((E==null?void 0:E.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function jr(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${W("error",(E==null?void 0:E.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function B(){const e=document.getElementById("app");if(!e)return;const t=(E==null?void 0:E.step)||"permissions";let a="";E?t==="permissions"?a=Br():t==="initialize"?a=Vr():t==="database"?a=Hr():t==="upgrade"?a=Kr():t==="done"?a=zr():t==="locked"?a=jr():a=`<section class="card"><p>Unknown step: ${d(t)}</p></section>`:a='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
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
      ${q?W("error",q,{dismissible:!1}):""}
      ${J?W("success",J,{dismissible:!1}):""}
      ${a}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,Wr()}function Wr(){var t,a,s,n,l,r;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{Jr()}),(a=e.querySelector('[data-action="backend-change"]'))==null||a.addEventListener("change",i=>{X=i.target.value==="pgsql"?"pgsql":"sqlite",B()}),(s=e.querySelector('[data-action="upgrade-toggle"]'))==null||s.addEventListener("change",i=>{lt=!!i.target.checked,B()}),(n=e.querySelector('[data-action="upgrade-run"]'))==null||n.addEventListener("click",()=>{Qr()}),(l=e.querySelector('[data-form="initialize"]'))==null||l.addEventListener("submit",i=>{i.preventDefault(),Yr(i.target)}),(r=e.querySelector('[data-form="database"]'))==null||r.addEventListener("submit",i=>{i.preventDefault(),Gr(i.target)}))}async function Jr(){A=!0,q=null,B();try{await zt(),J=null}catch(e){q=e instanceof Error?e.message:"Failed to load installer status"}finally{A=!1,B()}}async function Yr(e){const t=new FormData(e),a=n=>{var l;return!!((l=e.querySelector(`input[name="${n}"]`))!=null&&l.checked)},s={timezone:String(t.get("timezone")??"").trim(),cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};A=!0,q=null,J=null,B();try{E=await mt("/initialize",{method:"POST",body:JSON.stringify(s)}),se=E.csrfToken||se,J="Server settings saved. Configure the database next.",h.event("install.initialize")}catch(n){q=n instanceof Error?n.message:"Initialize failed"}finally{A=!1,B()}}async function Gr(e){const t=new FormData(e),a=String(t.get("backend")??X),s={backend:a,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};a==="sqlite"?s.sqlite_file=String(t.get("sqlite_file")??"").trim():(s.pgsql_host=String(t.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(t.get("pgsql_username")??"").trim(),s.pgsql_password=String(t.get("pgsql_password")??"")),A=!0,q=null,J=null,B();try{E=await mt("/database",{method:"POST",body:JSON.stringify(s)}),se=E.csrfToken||se,J="Database configured. Installer is locked.",h.event("install.database"),E.completed||E.step}catch(n){q=n instanceof Error?n.message:"Database setup failed"}finally{A=!1,B()}}async function Qr(){if(lt){A=!0,q=null,J=null,B();try{const e=await mt("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});J="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),h.event("install.upgrade"),await zt()}catch(e){q=e instanceof Error?e.message:"Upgrade failed"}finally{A=!1,B()}}}async function Xr(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await zt()}catch(t){q=t instanceof Error?t.message:"Failed to load installer"}B()}const Ft=document.getElementById("app");if(!Ft)throw new Error("#app missing");const fa=window.location.pathname.replace(/\/+$/,"")||"/";fa==="/portal/install"||fa.endsWith("/portal/install")?Xr(Ft):qr(Ft);
