var Rn=Object.defineProperty;var Bn=(r,c,k)=>c in r?Rn(r,c,{enumerable:!0,configurable:!0,writable:!0,value:k}):r[c]=k;var Ea=(r,c,k)=>Bn(r,typeof c!="symbol"?c+"":c,k);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const F of document.querySelectorAll('link[rel="modulepreload"]'))v(F);new MutationObserver(F=>{for(const j of F)if(j.type==="childList")for(const T of j.addedNodes)T.tagName==="LINK"&&T.rel==="modulepreload"&&v(T)}).observe(document,{childList:!0,subtree:!0});function k(F){const j={};return F.integrity&&(j.integrity=F.integrity),F.referrerPolicy&&(j.referrerPolicy=F.referrerPolicy),F.crossOrigin==="use-credentials"?j.credentials="include":F.crossOrigin==="anonymous"?j.credentials="omit":j.credentials="same-origin",j}function v(F){if(F.ep)return;F.ep=!0;const j=k(F);fetch(F.href,j)}})();const Ta={off:0,error:1,warn:2,info:3,debug:4};let kt="off";const Rt="[angaradav-portal]";function Vn(r){const c=(r||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function jn(r){return kt=Vn(r),kt!=="off"&&console.info(Rt,`log level = ${kt}`),kt}function xa(r){return Ta[kt]>=Ta[r]}function Pt(r,c,k,v){if(!xa(r))return;const F=[Rt,k];v!==void 0&&F.push(v),console[c](...F)}function _n(r,c){xa("info")&&(c&&Object.keys(c).length>0?console.info(Rt,`event:${r}`,c):console.info(Rt,`event:${r}`))}const O={error(r,c){Pt("error","error",r,c)},warn(r,c){Pt("warn","warn",r,c)},info(r,c){Pt("info","info",r,c)},debug(r,c){Pt("debug","debug",r,c)},event:_n};class ge extends Error{constructor(k,v){super(k);Ea(this,"status");this.status=v}}let at="",Mt=null,qt=null;function Ut(r){at=r&&typeof r=="string"?r:""}function Hn(r){Mt=r}function Wn(r){qt=r}function sa(r){if(!Aa(r))try{qt==null||qt()}catch{}}function Aa(r){return r==="/login"||r==="/ui"||r==="/logout"}function Bt(r,c){if(!Aa(r)){Ut("");try{Mt==null||Mt(c||"Session timed out. Please sign in again.")}catch{}}}async function R(r,c={}){const k=new Headers(c.headers);c.body&&!k.has("Content-Type")&&k.set("Content-Type","application/json");const v=(c.method||"GET").toUpperCase();v!=="GET"&&v!=="HEAD"&&v!=="OPTIONS"&&at&&k.set("X-CSRF-Token",at);const F=typeof performance<"u"?performance.now():Date.now();O.debug(`api → ${v} ${r}`);const j=await fetch(`/api${r}`,{...c,headers:k,credentials:"same-origin"});let T=null;const W=await j.text();if(W)try{T=JSON.parse(W)}catch{T={error:W}}const re=Math.round((typeof performance<"u"?performance.now():Date.now())-F);if(!j.ok){let D=`Request failed (${j.status})`;throw T&&typeof T=="object"&&T!==null&&"error"in T&&typeof T.error=="string"?D=T.error:(j.status===500||j.status===504)&&(D="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),j.status>=500?O.error(`api ← ${v} ${r} ${j.status} (${re}ms)`,D):j.status!==401?O.warn(`api ← ${v} ${r} ${j.status} (${re}ms)`,D):(O.debug(`api ← ${v} ${r} 401 (${re}ms)`),Bt(r,D)),new ge(D,j.status)}return O.info(`api ← ${v} ${r} ${j.status} (${re}ms)`),sa(r),T}function Ne(r){return encodeURIComponent(r)}async function Na(r,c,k,v){const F=new Headers({"Content-Type":k,Accept:"application/x-ndjson, application/json;q=0.9"});at&&F.set("X-CSRF-Token",at);const j=typeof performance<"u"?performance.now():Date.now();O.debug(`api → POST ${r} (stream, ${k}, ${c.length} bytes)`);let T;try{T=await fetch(`/api${r}`,{method:"POST",headers:F,credentials:"same-origin",body:c})}catch(_){const Y=_ instanceof Error?_.message:"Network error";throw O.error(`api ← POST ${r} network fail`,Y),new ge(`Import request failed to start (${Y}). Check connectivity and container logs.`,0)}const W=(T.headers.get("Content-Type")||"").toLowerCase(),re=W.includes("ndjson")||W.includes("x-ndjson");if(!T.ok&&!re){let _=`Request failed (${T.status})`;try{const Y=await T.json();Y.error&&(_=Y.error)}catch{}throw(T.status===504||T.status===502)&&(_="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),T.status===401?(O.debug(`api ← POST ${r} 401`,_),Bt(r,_)):O.warn(`api ← POST ${r} ${T.status}`,_),new ge(_,T.status)}if(!re&&T.ok){try{const _=await T.json();if(_&&typeof _.error=="string")throw new ge(_.error,T.status||500);if(_&&typeof _.imported=="number"&&typeof _.updated=="number")return O.info(`api ← POST ${r} json done`),_}catch(_){if(_ instanceof ge)throw _}throw new ge("Unexpected import response from server",500)}if(!T.body)throw new ge("Import stream unavailable",500);const D=T.body.getReader(),ve=new TextDecoder;let H="";const J={final:null,error:null,sawProgress:!1},ce=_=>{let Y;try{Y=JSON.parse(_)}catch{O.debug("import stream non-JSON line",_.slice(0,80));return}if(Y.type==="progress"){J.sawProgress=!0;const Pe=Number(Y.total)||0,be=Number(Y.current)||0,y=typeof Y.percent=="number"?Y.percent:Pe>0?Math.round(100*be/Pe):0;v==null||v({percent:y,current:be,total:Pe,imported:Number(Y.imported)||0,updated:Number(Y.updated)||0,skipped:Number(Y.skipped)||0})}else Y.type==="done"&&Y.result?J.final=Y.result:Y.type==="error"&&(J.error={message:Y.error||"Import failed",status:Y.status||500})};for(;;){const{done:_,value:Y}=await D.read();if(_)break;H+=ve.decode(Y,{stream:!0});const Pe=H.split(`
`);H=Pe.pop()??"";for(const be of Pe){const y=be.trim();y&&ce(y)}}H.trim()&&ce(H.trim());const de=Math.round((typeof performance<"u"?performance.now():Date.now())-j);if(J.error)throw J.error.status===401?(O.debug(`api ← POST ${r} stream 401 (${de}ms)`,J.error.message),Bt(r,J.error.message)):O.warn(`api ← POST ${r} stream error (${de}ms)`,J.error.message),new ge(J.error.message,J.error.status);if(!J.final)throw O.error(`api ← POST ${r} stream incomplete (${de}ms)`,{sawProgress:J.sawProgress}),new ge(J.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return O.info(`api ← POST ${r} stream done (${de}ms)`),sa(r),J.final}const A={ui:()=>R("/ui"),me:async()=>{var c;const r=await R("/me");return Ut(r.csrfToken||((c=r.user)==null?void 0:c.csrfToken)),r},login:async(r,c)=>{var v;const k=await R("/login",{method:"POST",body:JSON.stringify({username:r,password:c})});return Ut((v=k.user)==null?void 0:v.csrfToken),k},logout:async()=>{try{return await R("/logout",{method:"POST"})}finally{Ut("")}},calendars:()=>R("/calendars"),createCalendar:r=>R("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>R("/holidays/countries"),updateCalendar:(r,c)=>R(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:r=>R(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,c,k)=>{const v=new URLSearchParams({from:c,to:k}).toString();return R(`/calendars/${r}/events?${v}`)},getEvent:(r,c)=>R(`/calendars/${r}/events/${Ne(c)}`),createEvent:(r,c)=>R(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(r,c,k)=>R(`/calendars/${r}/events/${Ne(c)}`,{method:"PATCH",body:JSON.stringify(k)}),deleteEvent:(r,c)=>R(`/calendars/${r}/events/${Ne(c)}`,{method:"DELETE"}),exportCalendar:async r=>{const c=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!c.ok){let T=`Export failed (${c.status})`;try{const W=await c.json();W.error&&(T=W.error)}catch{}throw new ge(T,c.status)}const k=c.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(k),F=(v==null?void 0:v[1])||`calendar-${r}.ics`;return{blob:await c.blob(),filename:F}},importCalendar:(r,c,k)=>Na(`/calendars/${r}/import`,c,"text/calendar; charset=utf-8",k),directory:()=>R("/directory"),shares:r=>R(`/calendars/${r}/shares`),share:(r,c,k)=>R(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:c,access:k})}),revoke:(r,c)=>R(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>R("/addressbooks"),createAddressBook:r=>R("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,c)=>R(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(r,c=!1)=>R(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async r=>{const c=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!c.ok){let T=`Export failed (${c.status})`;try{const W=await c.json();W.error&&(T=W.error)}catch{}throw new ge(T,c.status)}const k=c.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(k),F=(v==null?void 0:v[1])||`contacts-${r}.vcf`;return{blob:await c.blob(),filename:F}},importAddressBook:(r,c,k)=>Na(`/addressbooks/${r}/import`,c,"text/vcard; charset=utf-8",k),contacts:(r,c="")=>{const k=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return R(`/addressbooks/${r}/contacts${k}`)},getContact:(r,c)=>R(`/addressbooks/${r}/contacts/${Ne(c)}`),createContact:(r,c)=>R(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(r,c,k)=>R(`/addressbooks/${r}/contacts/${Ne(c)}`,{method:"PATCH",body:JSON.stringify(k)}),deleteContact:(r,c)=>R(`/addressbooks/${r}/contacts/${Ne(c)}`,{method:"DELETE"}),exportContact:async(r,c)=>{const k=await fetch(`/api/addressbooks/${r}/contacts/${Ne(c)}/export`,{credentials:"same-origin"});if(!k.ok){let W=`Export failed (${k.status})`;try{const re=await k.json();re.error&&(W=re.error)}catch{}throw new ge(W,k.status)}const v=k.headers.get("Content-Disposition")||"",F=/filename="([^"]+)"/i.exec(v),j=(F==null?void 0:F[1])||"contact.vcf";return{blob:await k.blob(),filename:j}},contactPhotoUrl:(r,c)=>`/api/addressbooks/${r}/contacts/${Ne(c)}/photo`,tasks:(r={})=>{const c=new URLSearchParams;r.q&&c.set("q",r.q),r.sort&&c.set("sort",r.sort),r.order&&c.set("order",r.order);const k=c.toString()?`?${c}`:"";return R(`/tasks${k}`)},createTask:r=>R("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,c,k)=>R(`/tasks/${r}/${Ne(c)}`,{method:"PATCH",body:JSON.stringify(k)}),deleteTask:(r,c)=>R(`/tasks/${r}/${Ne(c)}`,{method:"DELETE"}),bulkTasks:r=>R("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const c=new URLSearchParams;r.q&&c.set("q",r.q),r.sort&&c.set("sort",r.sort),r.order&&c.set("order",r.order);const k=c.toString()?`?${c}`:"";return R(`/notes${k}`)},createNote:r=>R("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,c,k)=>R(`/notes/${r}/${Ne(c)}`,{method:"PATCH",body:JSON.stringify(k)}),deleteNote:(r,c)=>R(`/notes/${r}/${Ne(c)}`,{method:"DELETE"}),filesStatus:()=>R("/files"),filesList:(r="")=>{const c=new URLSearchParams;r&&c.set("path",r);const k=c.toString()?`?${c}`:"";return R(`/files/entries${k}`)},filesMkdir:(r,c)=>R("/files/mkdir",{method:"POST",body:JSON.stringify({path:r,name:c})}),filesUpload:async(r,c,k={})=>{const v=new URLSearchParams;r&&v.set("path",r),v.set("name",c.name),k.replace&&v.set("replace","1");const F=new Headers;at&&F.set("X-CSRF-Token",at);const j=new FormData;j.append("file",c,c.name),r&&j.append("path",r);const T=typeof performance<"u"?performance.now():Date.now();O.debug(`api → POST /files/upload path=${r||"/"} name=${c.name} size=${c.size}`);const W=await fetch(`/api/files/upload?${v}`,{method:"POST",headers:F,credentials:"same-origin",body:j}),re=await W.text();let D=null;if(re)try{D=JSON.parse(re)}catch{D={error:re}}const ve=Math.round((typeof performance<"u"?performance.now():Date.now())-T);if(!W.ok){let H=`Upload failed (${W.status})`;throw D&&typeof D=="object"&&D!==null&&"error"in D&&typeof D.error=="string"&&(H=D.error),W.status===401?(O.debug(`api ← POST /files/upload 401 (${ve}ms)`,H),Bt("/files/upload",H)):W.status>=500?O.error(`api ← POST /files/upload ${W.status} (${ve}ms)`,H):O.warn(`api ← POST /files/upload ${W.status} (${ve}ms)`,H),new ge(H,W.status)}return O.info(`api ← POST /files/upload 200 (${ve}ms)`),sa("/files/upload"),D},filesDownloadUrl:r=>{const c=new URLSearchParams;return c.set("path",r),`/api/files/download?${c}`},filesDelete:r=>R("/files/entry",{method:"DELETE",body:JSON.stringify({path:r})}),filesRename:(r,c)=>R("/files/rename",{method:"POST",body:JSON.stringify({path:r,newName:c})}),filesMove:(r,c,k)=>R("/files/move",{method:"POST",body:JSON.stringify({from:r,to:c,newName:k})}),filesCopy:(r,c={})=>R("/files/copy",{method:"POST",body:JSON.stringify({path:r,to:c.to,newName:c.newName})}),filesBulk:(r,c)=>R("/files/bulk",{method:"POST",body:JSON.stringify({op:r,paths:c})})},Ia="angaradav-portal-tab",Yn="1.0.6",Jn="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function na(r){return r==="calendars"||r==="contacts"||r==="tasks"||r==="notes"||r==="files"||r==="admin"?r:null}function zn(){const r=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0],c=na(r);if(c)return c;try{const k=na(sessionStorage.getItem(Ia));if(k)return k}catch{}return"calendars"}function Ft(r){try{sessionStorage.setItem(Ia,r)}catch{}if(typeof history>"u"||typeof location>"u")return;const c=`#${r}`;location.hash!==c&&history.replaceState(null,"",`${location.pathname}${location.search}${c}`)}function d(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ta(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(r)}</span>`}function aa(r){const c=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&c.push(`${r.skipped} skipped`),c.join(", ")}const Kn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, rename, and delete. Use checkboxes to multi-select items for bulk copy or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV. Open the classic Web Admin for users, system settings, and database configuration.","The Admin UI uses the separate admin password (not your DAV user password), unless you already have an admin session."]}};function fe(r,c,k="h2"){const v=k;return`<div class="section-title-row">
    <${v}>${d(r)}</${v}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(c)}"
      aria-label="About ${d(r)}" title="About ${d(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Gn(){return`
    <div class="info-modal" id="info-modal" hidden role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-backdrop" data-action="info-close"></div>
      <div class="info-modal-card">
        <header class="info-modal-header">
          <h3 id="info-modal-title"></h3>
          <button type="button" class="info-modal-close" data-action="info-close" aria-label="Close">×</button>
        </header>
        <div class="info-modal-body muted small" id="info-modal-body"></div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="info-close">Got it</button>
        </footer>
      </div>
    </div>`}function Xn(r){let c=null,k=null,v=zn(),F=!1,j=null,T=[],W=[],re=[],D=null,ve=[],H=!1,J=!1,ce=null,de=null,_={y:new Date().getFullYear(),m:new Date().getMonth()},Y=[],Pe=!1,be=!1,y=null,xe=!1,I=null,St="",ut=null,he=[],q=null,qe=[],Xe="",Q=null,C=null,te=!1,ue=!1,Se=!1,me=null,ke=null,De=!1,m=!1,B=null,Dt=null,ra=!1,nt={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ue=null,la=900,mt=null,pt=Yn,Vt=!1,Ct=!1;function jt(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();nt={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},jn(nt.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(la=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(pt=e.version.trim())}function _t(){mt!==null&&(clearTimeout(mt),mt=null)}function Ht(){if(_t(),!c)return;const e=Math.max(30,la)*1e3;mt=setTimeout(()=>{mt=null,ia("Your session timed out. Please sign in again.")},e)}function Wt(){_t(),Fe(),B=null,c=null,T=[],ve=[],D=null,W=[],he=[],q=null,qe=[],Q=null,C=null,te=!1,ue=!1,Se=!1,J=!1,H=!1,ce=null,de=null,be=!1,y=null,xe=!1,Y=[],pe=[],st=[],Ve=[],je=[],ye=null,Ie=null,V=null,K=null,z=!1,ie=!1,le=[],Yt=null,Ce="",$e=[],lt=!1,Ee=null,we=null,Z=[],me=null,ke=null,De=!1,m=!1,F=!1,ft()}function Et(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function ft(){j&&(document.removeEventListener("click",j,!0),j=null)}function La(){ft(),j=t=>{var l;const a=t.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(F=!1,ft(),u())};const e=j;setTimeout(()=>{F&&j===e&&document.addEventListener("click",e,!0)},0)}function oa(){v==="admin"&&!Et()&&(v="calendars",Ft(v))}async function Pa(e,t={}){e==="admin"&&!Et()&&(e="calendars"),v=e,F=!1,Ft(e),O.event("tab",{tab:e}),e!=="calendars"&&(H=!1,ce=null),e!=="contacts"&&(de=null),t.clearFlash!==!1&&N(),m=!0,u();try{e==="contacts"&&q!==null?await We(q):e==="calendars"?await Oe():e==="tasks"?await Ye():e==="notes"?await ot():e==="files"&&await Ae()}catch(a){O.warn("tab load failed",a instanceof Error?a.message:a),h("error",a instanceof Error?a.message:"Failed to load")}finally{m=!1,u()}}async function Ae(){lt=!0;try{O.debug("loadFiles",{path:Ce});const[e,t]=await Promise.all([A.filesStatus(),A.filesList(Ce).catch(a=>{if(a instanceof ge&&(a.status===503||a.status===404))return{path:Ce,entries:[]};throw a})]);if(Yt=e,e.ready){Ce=t.path,$e=t.entries;const a=new Set($e.map(l=>l.path));Z=Z.filter(l=>a.has(l))}else $e=[],Z=[];O.event("loadFiles",{path:Ce,count:$e.length,enabled:e.enabled,ready:e.ready})}finally{lt=!1}}function ia(e){if(!Vt){if(!c){_t();return}Vt=!0;try{O.event("session.expired"),Wt(),Ct=!0,k={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},u()}finally{Vt=!1}}}let pe=[],st=[],Ve=[],je=[],Tt="",Nt="",_e="due",Re="asc",rt="dtstart",Qe="desc",ye=null,Ie=null,V=null,K=null,z=!1,ie=!1,le=[],Yt=null,Ce="",$e=[],lt=!1,Ee=null,we=null,Z=[];function h(e,t){Ct&&e==="error"||(e!=="error"&&(Ct=!1),k={type:e,message:t})}function N(){k=null,Ct=!1}async function Fa(){O.event("bootstrap.start"),Hn(e=>{ia(/timed\s*out|session expired/i.test(e)?e:"Your session timed out. Please sign in again.")}),Wn(()=>{Ht()});try{const e=await A.ui();jt(e.ui),typeof e.version=="string"&&e.version.trim()!==""?pt=e.version.trim():e.ui&&typeof e.ui.version=="string"&&e.ui.version.trim()!==""&&(pt=e.ui.version.trim())}catch(e){O.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await A.me();c=e.user,jt(e.ui),typeof e.version=="string"&&e.version.trim()!==""&&(pt=e.version.trim()),O.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),Ht(),oa(),Ft(v),await Te()}catch(e){e instanceof ge&&e.status===401?(Wt(),/timed\s*out|session expired/i.test(e.message)&&h("info",e.message),O.event("bootstrap.anonymous")):(O.error("bootstrap failed",e instanceof Error?e.message:e),h("error",e instanceof Error?e.message:"Failed to load"))}u()}async function Te(){O.debug("loadHome");const[e,t,a]=await Promise.all([A.calendars(),A.directory().catch(()=>({users:[]})),A.addressbooks()]);if(T=e.calendars,W=t.users,he=a.addressbooks,O.event("loadHome",{calendars:T.length,addressBooks:he.length,directory:W.length}),re.length===0)try{re=(await A.holidayCountries()).countries}catch{re=[]}if(D!==null&&!T.some(l=>l.id===D)&&(D=null,ve=[],H=!1,ce=null),D===null){const l=ca();l&&(D=l.id)}D!==null&&H?await bt(D):D!==null&&(ve=[]),v==="calendars"&&await Oe(),q!==null&&!he.some(l=>l.id===q)&&(q=null,qe=[],Q=null,C=null,te=!1),de!==null&&!he.some(l=>l.id===de)&&(de=null),q===null&&he.length>0&&(q=he[0].id),q!==null&&v==="contacts"&&await We(q),v==="tasks"&&await Ye(),v==="notes"&&await ot(),v==="files"&&await Ae()}async function bt(e){ve=(await A.shares(e)).shares}function ca(){const e=T.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function ae(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${l}`}function Ma(e,t){const a=new Date(e,t,1),l=new Date(e,t+1,0);return{from:ae(a),to:ae(l)}}function Jt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,l,o]=e.split("-").map(Number);return new Date(a,l-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,l,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function qa(e){const t=Jt(e.start);if(!e.end)return[ae(t)];let a=Jt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const s=new Date(e.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ae(t)];const l=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(ae(o)),o.setDate(o.getDate()+1);return l.length?l:[ae(t)]}function zt(e,t){const a=e.slice(0,10),l=(t||a).slice(0,10);if(a===l){const P=yt(a);return{start:P.start,end:P.end}}const[o,p,n]=a.split("-").map(Number),[s,i,b]=l.split("-").map(Number),f=He(new Date(o,p-1,n,9,0,0,0)),g=He(new Date(s,i-1,b,17,0,0,0));return{start:f,end:g}}function Ua(e,t){const a=Ze(e);let l=t?Ze(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const p=Jt(t);p.setDate(p.getDate()-1),l=ae(p)}}return{start:a,end:l}}async function Oe(){if(D===null){Y=[];return}const{from:e,to:t}=Ma(_.y,_.m);Pe=!0,O.debug("loadMonthEvents",{selectedId:D,from:e,to:t});try{Y=(await A.calendarEvents(D,e,t)).events,O.event("monthEvents.loaded",{calendarId:D,count:Y.length,from:e,to:t})}catch(a){Y=[],O.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Pe=!1}}function Ra(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Ba(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Kt())} ${t}`}function Va(){const e=D!==null?T.find(E=>E.id===D):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",l=_.y,o=_.m,p=new Date(l,o,1),n=Gt(),s=(p.getDay()-n+7)%7,i=new Date(l,o+1,0).getDate(),b=new Date(l,o,0).getDate(),g=ae(new Date),P=da(),x=new Map;for(const E of Y)for(const w of qa(E)){const M=x.get(w)??[];M.push(E),x.set(w,M)}const S=[],U=Math.ceil((s+i)/7)*7;for(let E=0;E<U;E++){let w,M=!0,L;E<s?(w=b-s+E+1,M=!1,L=new Date(l,o-1,w)):E>=s+i?(w=E-(s+i)+1,M=!1,L=new Date(l,o+1,w)):(w=E-s+1,L=new Date(l,o,w));const G=ae(L),X=G===g,ne=M?x.get(G)??[]:[],Ge=ut===G?50:3,dt=ne.slice(0,Ge),It=ne.length-dt.length,Be=dt.map($t=>{const ea=D??0,Lt=Ba($t);return`<button type="button" class="month-event${$t.allDay?"":" is-timed"}" title="${d(Lt)}" style="--ev-color:${d(a)}"
            data-action="open-event" data-instance="${ea}" data-uri="${d($t.uri)}" ${m?"disabled":""}>${d(Lt)}</button>`}).join(""),Qt=It>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(G)}" title="Show all events this day" ${m?"disabled":""}>+${It} more</button>`:"",Zt=!M&&(w===1||E===s+i)?L.toLocaleString(void 0,{month:"short",day:"numeric"}):String(w),Ot=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));S.push(`<div class="month-cell${M?"":" is-outside"}${X?" is-today":""}${Ot?" is-clickable":""}"${Ot?` data-action="new-event-day" data-day="${d(G)}" role="button" tabindex="0" title="Add event on ${d(G)}"`:""}>
        <div class="month-daynum${X?" is-today-num":""}">${d(Zt)}</div>
        <div class="month-events">${Be}${Qt}</div>
      </div>`)}const oe=e?Pe?'<p class="muted small month-empty-hint">Loading events…</p>':"":T.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${m?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${m?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${m?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${d(Ra(l,o))}</h2>
        <span class="month-cal-name muted small" title="${d(t)}">
          <span class="cal-swatch" style="background:${d(a)};margin-top:0"></span>
          ${d(t)}
        </span>
      </div>
      ${oe}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${P.map(E=>`<div class="month-dow">${d(E)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${S.join("")}
        </div>
      </div>
    </section>`}function Ze(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ae(t)}function ja(){if(nt.timeFormat==="24h")return!1;if(nt.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Kt(){return ja()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Gt(){var a;if(nt.weekStart==="monday")return 1;if(nt.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of e)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function da(){const e=Gt(),t=new Date(2024,0,7+e),a=[];for(let l=0;l<7;l++){const o=new Date(t);o.setDate(t.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function ua(e,t=15){const a=t*60*1e3,l=e.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function He(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function _a(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const l=e.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Kt()})}function ht(e){if(!e){const a=ua(new Date);return{date:ae(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ae(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function yt(e){const t=new Date,a=ae(t);if(e&&e!==a){const[p,n,s]=e.split("-").map(Number),i=new Date(p,n-1,s,9,0,0,0),b=new Date(p,n-1,s,10,0,0,0);return{start:He(i),end:He(b)}}const l=ua(t,15),o=new Date(l.getTime()+3600*1e3);return{start:He(l),end:He(o)}}function Ha(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function et(e){const{field:t,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:s,allowClear:i=!0}=e,b=(I==null?void 0:I.field)===t,f=_a(o,p);return`<div class="dt-field${b?" is-open":""}" data-dt-id="${d(t)}">
      <span class="dt-field-label">${d(l)}</span>
      <input type="hidden" name="${d(a)}" value="${d(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(t)}"
        data-dt-name="${d(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${b}">
        <span class="dt-trigger-text">${d(f)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${b&&!s?Wa(t,o,p,i):""}
    </div>`}function Xt(e){var t;return e==="start"?String((y==null?void 0:y.start)||""):e==="end"?String((y==null?void 0:y.end)||""):e==="until"?((t=y==null?void 0:y.repeat)==null?void 0:t.until)||Ze(y==null?void 0:y.start)||ae(new Date):e==="due"?it(V==null?void 0:V.due):e==="dtstart"?it(K==null?void 0:K.dtstart):e==="bulk-due"?St:e==="birthday"?String((C==null?void 0:C.birthday)||""):""}function Le(e,t){if(e==="start"&&y){y={...y,start:t||""};return}if(e==="end"&&y){y={...y,end:t};return}if(e==="until"&&y){y={...y,repeat:{...y.repeat??xt(),until:t,endMode:"until"}};return}if(e==="due"&&V){if(t===null||t==="")V={...V,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))V={...V,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));V={...V,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&K){if(t===null||t==="")K={...K,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))K={...K,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));K={...K,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&C){C={...C,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(St=t||"")}function Wa(e,t,a,l){const o=ht(t),p=(I==null?void 0:I.viewY)??Number(o.date.slice(0,4)),n=(I==null?void 0:I.viewM)??Number(o.date.slice(5,7))-1,s=Gt(),i=da(),f=(new Date(p,n,1).getDay()-s+7)%7,g=new Date(p,n+1,0).getDate(),P=new Date(p,n,0).getDate(),x=o.date,S=o.hm,U=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),oe=[],E=Math.ceil((f+g)/7)*7;for(let M=0;M<E;M++){let L,G,X=!1;M<f?(L=P-f+M+1,G=new Date(p,n-1,L),X=!0):M>=f+g?(L=M-(f+g)+1,G=new Date(p,n+1,L),X=!0):(L=M-f+1,G=new Date(p,n,L));const ne=ae(G),Ge=ne===x,dt=ne===ae(new Date);oe.push(`<button type="button" class="dt-day${X?" is-outside":""}${Ge?" is-selected":""}${dt?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${d(ne)}">${L}</button>`)}const w=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Ha().map(M=>{const L=(()=>{const[G,X]=M.split(":").map(Number);return new Date(2e3,0,1,G,X).toLocaleTimeString(void 0,Kt())})();return`<button type="button" class="dt-time${M===S?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${M}" role="option" aria-selected="${M===S}">${d(L)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${d(U)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(M=>`<span class="dt-dow">${d(M)}</span>`).join("")}</div>
          <div class="dt-days">${oe.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(e)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${w}
      </div>
    </div>`}function Ya(){r.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const l=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let s=l.bottom+6;s+n>window.innerHeight-o&&(s=Math.max(o,l.top-n-6));let i=l.left;i+p>window.innerWidth-o&&(i=Math.max(o,window.innerWidth-p-o)),i<o&&(i=o),a.style.top=`${Math.round(s)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function xt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Ja(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function za(){if(!be||!y)return"";const e=y,t=e.repeat??xt(),a=(t.freq||"").toUpperCase(),l=T.filter(x=>x.canShare||x.access==="readwrite"),o=T.filter(x=>x.id===e.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===e.instanceId?"selected":""}>${d(x.displayname)}</option>`).join(""),p=e.readOnly||!e.canWrite;let n,s;if(e.allDay)n=Ze(e.start),s=Ze(e.end);else{const x=e.start||"",S=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const U=zt(x,S||null);n=U.start,s=U.end||""}else n=it(e.start),s=it(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],b=new Set((t.byDay||[]).map(x=>x.toUpperCase())),f=Ja(t),g=!!a&&f==="until",P=t.until||(f==="until"?Ze(e.start)||ae(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${xe?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${ze()}
          ${!xe&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${p?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${p||l.length===0?"disabled":""}>
                ${o||`<option value="${e.instanceId}">${d(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${d(e.summary)}" ${p?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${d(e.location)}" ${p?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${p?"readonly":""}>${d(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${p?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${et({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:p,allowClear:!1})}
              ${et({field:"end",name:"end",label:"End",value:s,dateOnly:e.allDay,disabled:p||g,allowClear:!g})}
            </div>
            <fieldset class="event-repeat" ${p?"disabled":""}>
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${d(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${i.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${b.has(x.code)?"checked":""} />
                              ${x.label}
                            </label>`).join("")}
                    </div>`:""}
              ${a?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${f==="never"?"selected":""}>Never</option>
                          <option value="until" ${f==="until"?"selected":""}>On date</option>
                          <option value="count" ${f==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${f==="until"?et({field:"until",name:"repeatUntil",label:"Until",value:P,dateOnly:!0,disabled:p,allowClear:!0}):f==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${d(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${xe?"Create event":"Save event"}</button>
                     ${xe?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${m?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Ka(e,t){const a=T.find(l=>l.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:xt(),readOnly:!1,canWrite:!0}}async function We(e){qe=(await A.contacts(e,Xe)).contacts,Q!==null&&!qe.some(a=>a.uri===Q)&&(Q=null,te||(C=null,me=null,ke=null,De=!1))}async function Ye(){const e=await A.tasks({q:Tt,sort:_e,order:Re});pe=e.tasks,Ve=e.calendars;const t=new Set(pe.map(a=>ee(a.instanceId,a.uri)));le=le.filter(a=>t.has(a)),ye!==null&&!pe.some(a=>`${a.instanceId}|${a.uri}`===ye)&&(ye=null,z||(V=null))}async function ot(){const e=await A.notes({q:Nt,sort:rt,order:Qe});st=e.notes,je=e.calendars,Ie!==null&&!st.some(t=>`${t.instanceId}|${t.uri}`===Ie)&&(Ie=null,ie||(K=null))}function ee(e,t){return`${e}|${t}`}function ma(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function it(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Je(e,t,a,l,o,p=""){const n=a===t,s=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${s}</th>`}async function Ga(e){if(q===null)return;const t=await A.getContact(q,e);Q=e,te=!1;const a=t.contact;C={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??pa(),birthday:a.birthday??null},me=a.photoDataUri??(a.hasPhoto&&q!==null?`${A.contactPhotoUrl(q,e)}?t=${Date.now()}`:null),ke=null,De=!1,ue=!0}function Xa(){te=!0,Q=null,ue=!0,C={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},me=null,ke=null,De=!1}function pa(){return{street:"",city:"",region:"",postal:"",country:""}}function Qa(e){return new Promise((t,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");t(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(e)})}function fa(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>AngaraDAV User Portal</span>`,l=c?d(c.displayname||c.username):"",o=Et()?`<button type="button" class="user-menu-item${v==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",p=c?`<div class="user-menu${F?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${F?"true":"false"}"
              title="${l}">
              <span class="user-menu-name">${l}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${F?"":"hidden"}>
              ${o}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",n=c?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            ${p}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,i=!(H||J||ce!==null||de!==null||be||ue||Se)?ze():"",b=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${d(pt)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(Jn)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${n}
      <main class="container">
        ${i}
        ${e}
      </main>
      ${b}
      ${Gn()}
      ${Za()}`}function ze(){return k?`<div class="flash flash-${d(k.type)}" role="status">
      <span class="flash-text">${d(k.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function ba(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function ct(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),l=t%60;return a>0?`${a}m ${l}s`:`${l}s`}function Fe(){Dt!==null&&(clearInterval(Dt),Dt=null)}function ha(){Fe(),Dt=setInterval(()=>{if(!B||B.phase==="done"||B.phase==="error"){Fe();return}B={...B,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},B.phase==="processing"&&va(B)},1e3)}function Ke(e,t={}){B&&(B={...B,phase:e,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3),...t},u())}function ya(){Fe(),B=null,u()}function ga(e){!B||B.phase==="done"||B.phase==="error"||(B={...B,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},va(B))}function va(e){const t=r.querySelector("[data-import-status-line]"),a=r.querySelector(".import-progress-bar"),l=r.querySelector(".import-progress-track"),o=r.querySelector("[data-import-counts]"),p=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${p} (${e.processPercent??0}%) · ${ct(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${ct(e.elapsedSec)}`;else return;t&&(t.textContent=n),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),l&&e.processPercent!==null&&(l.setAttribute("aria-valuenow",String(e.processPercent)),l.removeAttribute("aria-valuetext"))}function Za(){if(!B)return"";const e=B,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const s=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],b={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return s.map((f,g)=>{let P="pending";return e.phase==="done"||g<b?P="done":g===b&&(P=(e.phase==="error","active")),`<li class="import-step import-step-${P}"><span class="import-step-icon" aria-hidden="true">${P==="done"?"✓":P==="active"?"●":"○"}</span> ${d(f.label)}</li>`}).join("")})();let p="";if(t){let s=null;e.phase==="reading"&&e.readPercent!==null?s=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(s=Math.min(100,Math.max(0,e.processPercent)));const i=s===null?"import-progress-bar is-indeterminate":"import-progress-bar",b=s!==null?` style="width:${s}%"`:"",f=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${f} (${e.processPercent??0}%) · ${ct(e.elapsedSec)}`:g=`Importing on server… ${ct(e.elapsedSec)}`;const P=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${d(a)}</strong> from
          <span class="mono">${d(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${d(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${s!==null?`aria-valuenow="${s}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${i}"${b}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${d(g)}</p>
        ${P}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?p=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${d(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · Took ${d(ct(e.elapsedSec))}
        </p>`:p=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${d(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · After ${d(ct(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':'<button type="button" class="btn btn-primary" data-action="close-import-progress">Close</button>';return`
      <div class="cal-modal import-progress-modal" role="dialog" aria-modal="true"
        aria-labelledby="import-progress-title" data-import-progress>
        <div class="cal-modal-backdrop"${t?"":' data-action="close-import-progress"'}></div>
        <div class="cal-modal-card cal-modal-card-sm import-progress-card">
          <header class="cal-modal-header">
            <h3 id="import-progress-title">${d(l)}</h3>
            ${t?"":'<button type="button" class="info-modal-close" data-action="close-import-progress" aria-label="Close">×</button>'}
          </header>
          <div class="cal-modal-body">${p}</div>
          <footer class="cal-modal-footer">${n}</footer>
        </div>
      </div>`}function $a(e,t){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?t(Math.min(100,Math.round(p.loaded/p.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(e)})}function wa(){r.innerHTML=fa(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials (not the admin password).</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required />
            </label>
            <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function en(){if(!c){wa();return}const e=T.filter($=>$.canShare),t=T.filter($=>!$.canShare),a=T.find($=>$.id===D)??null,l=e.map($=>{const se=$.id===D?" is-selected":"",Me=$.color?`<span class="cal-swatch" style="background:${d($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',wt=ta($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${d($.holidaysCountry)}</span>`:"");return`<div class="cal-row${se}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${Me}
          <span class="cal-row-text">
            <span class="cal-row-title">${d($.displayname)}</span>
            <span class="cal-row-badges">${wt}</span>
            <span class="muted small mono cal-row-uri">${d($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map($=>{const se=$.id===D?" is-selected":"",Me=$.color?`<span class="cal-swatch" style="background:${d($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',wt=$.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${se}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0" title="${d(wt)}">
          ${Me}
          <span class="cal-row-text">
            <span class="cal-row-title">${d($.displayname)}</span>
            <span class="cal-row-badges">${ta($.access)}</span>
            <span class="muted small">${$.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=W.map($=>`<option value="${d($.username)}">${d($.displayname)} (${d($.username)})</option>`).join(""),n=ve.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':ve.map($=>`<tr>
                <td>
                  <strong>${d($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${d($.username||$.href)}</div>
                </td>
                <td>${ta($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d($.href)}" ${m?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),b=H&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${ze()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${d(a.uri)}
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
                        value="${d(a.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${d(s)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${d(a.color||s)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${d(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${d(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${fe(`Share “${a.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${W.length===0?"disabled":""}>
                        <option value="">${W.length?"Select user…":"No other users"}</option>
                        ${p}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${i?"disabled":""}>
                        <option value="read" selected>Read only</option>
                        ${i?"":'<option value="readwrite">Full access</option>'}
                      </select>
                      ${i?'<input type="hidden" name="access" value="read" />':""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${m||W.length===0?"disabled":""}>Share</button>
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
                  ${fe("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${m?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${m||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${m||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",f=ce!==null?T.find($=>$.id===ce&&$.canShare)??null:null,g=f?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${ze()}
              <p>You are about to permanently delete <strong>${d(f.displayname)}</strong>
                <span class="muted small mono">(${d(f.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${f.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",P=J?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${ze()}
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
                    ${re.map($=>`<option value="${d($.code)}">${d($.name)} (${d($.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Create calendar</button>
                  <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${m?"disabled":""} hidden />
                  </label>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${m?"disabled":""}>Cancel</button>
                </div>
                <p class="muted small" style="margin:0.5rem 0 0">
                  <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
                </p>
              </form>
            </div>
          </div>
        </div>`:"",x=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${fe("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${fe("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${m?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Va()}
      </div>
      ${P}
      ${b}
      ${g}
      ${za()}`,S=he.map($=>`<div class="cal-row${$.id===q?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${d($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${d($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),U=he.find($=>$.id===q)??null,oe=qe.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Xe?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:qe.map($=>{const se=!te&&$.uri===Q?" is-selected":"",Me=d(($.displayname||"?").slice(0,1).toUpperCase()),wt=$.hasPhoto&&q!==null?`<img class="contact-avatar" src="${d(A.contactPhotoUrl(q,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${Me}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Me}</span>`;return`<tr class="contact-table-row${se}" data-action="select-contact" data-uri="${d($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${wt}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${d($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${d($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${d($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${d($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${d($.org||"—")}</span></td>
              </tr>`}).join(""),E=C,w=Array.isArray(E==null?void 0:E.emails)&&E.emails.length>0?E.emails:[""],M=Array.isArray(E==null?void 0:E.phones)&&E.phones.length>0?E.phones:[{type:"cell",value:""}],L=(E==null?void 0:E.address)??pa(),G=w.map(($,se)=>`<div class="multi-row" data-multi="email" data-idx="${se}">
          <input type="email" name="email_${se}" value="${d($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${se}" ${w.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),X=M.map(($,se)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${se}">
          <select name="phone_type_${se}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Me=>`<option value="${Me}" ${(($==null?void 0:$.type)??"other")===Me?"selected":""}>${Me}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${se}" value="${d(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${se}" ${M.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ne=Array.isArray(E==null?void 0:E.custom)?E.custom:[],Ge=ne.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ne.map(($,se)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${se}">
                <input type="text" name="custom_label_${se}" value="${d($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${se}" value="${d($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${se}" title="Remove">×</button>
              </div>`).join(""),dt=ue&&E&&U?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${te?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${ze()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${me?`<img src="${d(me)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${d((E.fullname||E.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        ${me?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${m?"disabled":""} hidden />
                      </label>
                      ${me||E.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${m?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${d(E.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${d(E.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${d(E.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${d(E.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${d(E.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${G}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${w.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${X}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${M.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${d(L.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${d(L.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${d(L.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${d(L.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${d(L.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${d(E.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${et({field:"birthday",name:"birthday",label:"Birthday",value:E.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${Ge}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ne.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${d(E.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>${te?"Create contact":"Save contact"}</button>
                    ${!te&&E.uri?`<button type="button" class="btn" data-action="export-contact" ${m?"disabled":""}>Export .vcf</button>`:""}
                    ${te?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${m?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${m?"disabled":""}>Cancel</button>
                    ${!te&&E.uri?`<span class="muted small mono">${d(E.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",It=Se&&U?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${ze()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${d(U.uri)} · ${U.cardCount} contact${U.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${d(U.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${d(U.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${d(U.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${fe("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${m?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${m?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Be=de!==null?he.find($=>$.id===de)??null:null,Qt=Be?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${ze()}
              <p>You are about to permanently delete <strong>${d(Be.displayname)}</strong>
                <span class="muted small mono">(${d(Be.uri)})</span>.</p>
              <p class="muted small">${(Be.cardCount??0)>0?`All ${Be.cardCount} contact${Be.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Be.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",Zt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${fe("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${S||'<p class="muted">No address books yet. Create one below.</p>'}
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
                <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${U?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${fe("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${d(Xe)}" aria-label="Search contacts" ${m?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${m?"disabled":""}>Add contact</button>
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
                        ${oe}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Qt}
      ${It}
      ${dt}`,Ot=v==="calendars"?"my-calendars":v==="contacts"?"my-contacts":v==="tasks"?"tasks":v==="notes"?"notes":v==="files"?"files":"administration",$t=cn(),ea=dn(),Lt=nn(),Mn=sn(),qn=v==="calendars"?x:v==="contacts"?Zt:v==="tasks"?$t:v==="notes"?ea:v==="files"?Lt:Mn,Un=v!=="admin"?`<header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${v==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${v==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${v==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${v==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${v==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${v==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${v==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${v==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${v==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${v==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${Ot}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>`:`<header class="page-header page-header-admin">
        ${fe("Administration","administration","h1")}
        <button type="button" class="btn btn-ghost btn-small" data-action="tab" data-tab="calendars"
          title="Back to portal">← Portal</button>
      </header>`;r.innerHTML=fa(`
      ${Un}

      ${qn}
    `),document.body.classList.toggle("cal-modal-open",H||J||ce!==null||de!==null||be||ue||Se||B!==null||Ee!==null||we!==null),document.body.classList.toggle("layout-contacts",v==="contacts"),document.body.classList.toggle("layout-calendars",v==="calendars"),document.body.classList.toggle("layout-tasks",v==="tasks"||v==="notes"),document.body.classList.toggle("layout-files",v==="files"),document.body.classList.toggle("layout-admin",v==="admin")}function tn(e){const t=e?e.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${m?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(p)}" ${m?"disabled":""}>${d(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function tt(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function an(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function nn(){const e=Yt;if(!e)return`<div class="card"><p class="muted">${lt||m?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${fe("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${fe("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${d(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${d(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${tt(e.usedBytes)} used · ${tt(e.availableBytes)} free of ${tt(e.quotaBytes)}`:`${tt(e.usedBytes)} used · ${tt(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,l=Z.length,o=$e.length>0&&$e.every(f=>Z.includes(f.path)),p=l>0,n=$e.length>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <label class="bulk-select-all">
              <input type="checkbox" data-action="files-select-all"
                ${o?"checked":""}
                ${p&&!o?"data-indeterminate=1":""}
                ${m?"disabled":""}
                aria-label="Select all in this folder" />
              <span>${l>0?`${l} selected`:"Select"}</span>
            </label>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${m||l===0?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${m||l===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-clear" ${m||l===0?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",s=$e.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':$e.map(f=>{const g=Z.includes(f.path),P=f.type==="dir"?"📁":"📄",x=f.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(f.path)}" ${m?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${P}</span>${d(f.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${P}</span>${d(f.name)}</span>`,S=f.type==="dir"?"—":tt(f.size);return`<tr class="files-row${g?" is-checked":""}" data-path="${d(f.path)}" data-type="${f.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${d(f.path)}"
                    ${g?"checked":""} ${m?"disabled":""}
                    aria-label="Select ${d(f.name)}" />
                </td>
                <td class="files-col-name">${x}</td>
                <td class="files-col-size mono">${S}</td>
                <td class="files-col-mtime hide-sm">${d(an(f.mtime))}</td>
                <td class="files-col-actions">
                  ${f.type==="file"?`<a class="btn btn-ghost btn-small" href="${d(A.filesDownloadUrl(f.path))}" download="${d(f.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${d(f.path)}" ${m?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${d(f.path)}" data-name="${d(f.name)}" ${m?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${d(f.path)}" data-name="${d(f.name)}" ${m?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),i=Ee!==null?(()=>{const f=$e.find(P=>P.path===Ee),g=(f==null?void 0:f.name)??"";return`<div class="cal-modal" id="files-rename-modal" role="dialog" aria-modal="true" aria-labelledby="files-rename-title">
              <div class="cal-modal-backdrop" data-action="files-rename-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-rename-title">Rename</h3>
                  <button type="button" class="info-modal-close" data-action="files-rename-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-rename" id="files-rename-form">
                  <div class="cal-modal-body">
                    <input type="hidden" name="path" value="${d(Ee)}" />
                    <label>New name
                      <input type="text" name="newName" value="${d(g)}" required maxlength="255" autocomplete="off" />
                    </label>
                  </div>
                  <footer class="cal-modal-footer">
                    <button type="button" class="btn btn-ghost" data-action="files-rename-close">Cancel</button>
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Rename</button>
                  </footer>
                </form>
              </div>
            </div>`})():"",b=we!==null?(()=>{const f=$e.find(x=>x.path===we),g=(f==null?void 0:f.name)??we,P=(f==null?void 0:f.type)==="dir"?"folder":"file";return`<div class="cal-modal" id="files-delete-modal" role="dialog" aria-modal="true" aria-labelledby="files-delete-title">
              <div class="cal-modal-backdrop" data-action="files-delete-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-delete-title">Delete ${d(P)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-delete-close" aria-label="Close">×</button>
                </header>
                <div class="cal-modal-body">
                  <p style="margin:0">Delete <strong>${d(g)}</strong>?${(f==null?void 0:f.type)==="dir"?" This removes the folder and everything inside it.":""}</p>
                </div>
                <footer class="cal-modal-footer">
                  <button type="button" class="btn btn-ghost" data-action="files-delete-close">Cancel</button>
                  <button type="button" class="btn btn-danger" data-action="files-delete-confirm" data-path="${d(we)}" ${m?"disabled":""}>Delete</button>
                </footer>
              </div>
            </div>`})():"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${fe("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${d(t)}</span>
          </div>
        </div>
        <p class="muted small" style="margin:0.5rem 0 0">
          DAV clients: <span class="mono">${d(e.davPath)}</span>
          · max upload ${tt(e.maxUploadBytes)}
        </p>
        <div class="files-toolbar">
          ${tn(Ce)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${m||lt?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${m?"disabled":""}>New folder</button>
            <label class="btn btn-primary btn-small files-upload-btn" ${m?"aria-disabled=true":""}>
              Upload
              <input type="file" data-action="files-upload" ${m?"disabled":""} multiple hidden />
            </label>
          </div>
        </div>
        ${n}
        <div class="table-wrap files-table-wrap">
          <table class="files-table">
            <thead>
              <tr>
                <th class="files-col-check" aria-label="Select"></th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${lt&&$e.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':s}
            </tbody>
          </table>
        </div>
      </section>
      ${i}
      ${b}
    </div>`}function sn(){return Et()?`<div class="portal-grid portal-grid-admin">
      <section class="card admin-section">
        ${fe("Server administration","administration")}
        <p class="muted">
          Manage DAV users, calendars, address books, and system settings in the classic Web Admin.
          That UI uses the separate <strong>admin</strong> password (not your DAV credentials), unless you already have an admin session open.
        </p>
        <div class="admin-link-grid">
          <a class="btn btn-primary" href="/admin/">Open Admin Dashboard</a>
          <a class="btn btn-ghost" href="/admin/?/users">Users and resources</a>
          <a class="btn btn-ghost" href="/admin/?/settings/standard">System Settings</a>
          <a class="btn btn-ghost" href="/admin/?/settings/database">Database settings</a>
        </div>
        <p class="muted small" style="margin-top:1.25rem">
          Signed in as <span class="mono">${d((c==null?void 0:c.username)??"")}</span>
          with role <span class="badge badge-admin">Admin</span>.
        </p>
      </section>
    </div>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function rn(e){const t=new Map;for(const b of e)b.uid&&t.set(b.uid,b);const a=new Map(e.map((b,f)=>[ee(b.instanceId,b.uri),f])),l=new Map,o=[];for(const b of e){const f=b.parentUid;if(f&&t.has(f)&&f!==b.uid){const g=l.get(f)??[];g.push(b),l.set(f,g)}else o.push(b)}const p=(b,f)=>(a.get(ee(b.instanceId,b.uri))??0)-(a.get(ee(f.instanceId,f.uri))??0);o.sort(p);for(const[,b]of l)b.sort(p);const n=[],s=new Set,i=(b,f)=>{const g=b.uid||ee(b.instanceId,b.uri);if(!s.has(g)){s.add(g),n.push({task:b,depth:Math.min(f,8)});for(const P of l.get(b.uid)??[])i(P,f+1);s.delete(g)}};for(const b of o)i(b,0);for(const b of e)n.some(f=>f.task===b)||n.push({task:b,depth:0});return n}function ln(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const l of pe)l.parentUid&&t.has(l.parentUid)&&l.uid&&!t.has(l.uid)&&(t.add(l.uid),a=!0)}return t}function on(e,t){const a=e.instanceId,l=t||!e.uid?new Set:ln(e.uid),o=pe.filter(s=>s.uid&&s.instanceId===a&&!l.has(s.uid)&&s.uid!==e.uid),p=e.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(s=>`<option value="${d(s.uid)}" ${s.uid===p?"selected":""}>${d(s.summary||s.uid)}</option>`)];if(p&&!o.some(s=>s.uid===p)){const s=pe.find(i=>i.uid===p);n.push(`<option value="${d(p)}" selected>${d((s==null?void 0:s.summary)||p)} (current)</option>`)}return n.join("")}function ka(){const e=new Set(le);return pe.filter(t=>e.has(ee(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function cn(){const e=S=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[S]||S,t=rn(pe),a=pe.filter(S=>S.canWrite&&!S.readOnly).map(S=>ee(S.instanceId,S.uri)),l=a.length>0&&a.every(S=>le.includes(S)),o=le.length>0,n=ka().length,s=pe.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Tt?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:S,depth:U})=>{const oe=ee(S.instanceId,S.uri),E=!z&&oe===ye?" is-selected":"",w=le.includes(oe),M=S.status==="COMPLETED"?"badge-ok":S.status==="CANCELLED"?"":"badge-admin",L=U>0?` style="--task-depth:${U}"`:"",G=U>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",X=S.canWrite&&!S.readOnly;return`<tr class="contact-table-row task-row${U>0?" is-subtask":""}${E}${w?" is-checked":""}" data-action="select-task" data-instance="${S.instanceId}" data-uri="${d(S.uri)}" tabindex="0" role="button"${L}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${S.instanceId}" data-uri="${d(S.uri)}"
                    ${w?"checked":""} ${X?"":"disabled"} aria-label="Select ${d(S.summary||S.uri)}" ${m?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${G}<span class="contact-name-primary">${d(S.summary||S.uri)}</span></span>
                  ${S.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${M}">${d(e(S.status))}</span></td>
                <td class="col-task-due muted small">${d(ma(S.due))}</td>
                <td class="col-task-cal muted small">${d(S.calendarName)}</td>
                <td class="col-task-pct muted small">${S.percent?d(String(S.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,b=(S,U)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${S}"
        title="${d(U)}" aria-label="${d(U)}" ${m||n===0?"disabled":""}>${i}</button>`,f=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${le.length!==n?`<span class="muted small bulk-bar-count-extra">(${le.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${m||n===0?"disabled":""}>
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
                ${et({field:"bulk-due",name:"bulkDue",label:"Due",value:St,dateOnly:!1,disabled:m||n===0,allowClear:!0})}
                ${b("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${m||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${m||n===0?"disabled":""} />
                </label>
                ${b("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${m||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${m?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",g=V,P=Ve.map(S=>`<option value="${S.id}" ${g&&g.instanceId===S.id?"selected":""}>${d(S.displayname)}</option>`).join(""),x=g?`<div class="card">
            ${fe(z?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${z?`<label>Calendar
                      <select name="instanceId" required ${Ve.length===0?"disabled":""}>
                        <option value="">${Ve.length?"Select calendar…":"No writable calendars"}</option>
                        ${P}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(g.summary)}" ${g.readOnly&&!z?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!z?"readonly":""}>${d(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!z?"disabled":""}>
                  ${on(g,z)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!z?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(S=>`<option value="${S}" ${g.status===S?"selected":""}>${d(e(S))}</option>`).join("")}
                  </select>
                </label>
                ${et({field:"due",name:"due",label:"Due",value:it(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!z),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${d(String(g.priority||0))}" ${g.readOnly&&!z?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${d(String(g.percent||0))}" ${g.readOnly&&!z?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${z||g.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${z?"Create task":"Save task"}</button>`:""}
                ${!z&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${m?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${m?"disabled":""}>Delete</button>`:z?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${fe("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${d(Tt)}" aria-label="Search tasks" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${m||Ve.length===0?"disabled":""}>Add task</button>
        </div>
        ${f}
        ${Ve.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||m?"disabled":""} />
                </th>
                ${Je("Title","summary",_e,Re,"task","col-task-title")}
                ${Je("Status","status",_e,Re,"task","col-task-status")}
                ${Je("Due","due",_e,Re,"task","col-task-due")}
                ${Je("Calendar","calendar",_e,Re,"task","col-task-cal")}
                ${Je("%","percent",_e,Re,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function dn(){const e=st.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${Nt?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:st.map(o=>{const p=ee(o.instanceId,o.uri),n=!ie&&p===Ie?" is-selected":"",s=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${d(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${d(o.summary||o.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${d(s)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${d(ma(o.dtstart))}</td>
                <td class="col-note-cal muted small">${d(o.calendarName)}</td>
              </tr>`}).join(""),t=K,a=je.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${d(o.displayname)}</option>`).join(""),l=t?`<div class="card">
            ${fe(ie?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${ie?`<label>Calendar
                      <select name="instanceId" required ${je.length===0?"disabled":""}>
                        <option value="">${je.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(t.summary)}" ${t.readOnly&&!ie?"readonly":""} />
              </label>
              ${et({field:"dtstart",name:"dtstart",label:"Date",value:it(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!ie),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!ie?"readonly":""}>${d(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${ie||t.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${ie?"Create note":"Save note"}</button>`:""}
                ${!ie&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${m?"disabled":""}>Delete</button>`:ie?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${fe("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${d(Nt)}" aria-label="Search notes" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${m||je.length===0?"disabled":""}>Add note</button>
        </div>
        ${je.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Je("Title","summary",rt,Qe,"note","col-note-title")}
                ${Je("Date","dtstart",rt,Qe,"note","col-note-date")}
                ${Je("Calendar","calendar",rt,Qe,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function un(){const e=r.querySelector(".contacts-table-wrap"),t=r.querySelector(".contacts-ab-list"),a=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function mn(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=r.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=r.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=r.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function u(){const e=un();c?en():wa(),pn(),mn(e),requestAnimationFrame(()=>{var t;Ya(),(t=r.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Sa(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(t.value=l.slice(0,7),a.value=l.toUpperCase())}))}function pn(){r.querySelectorAll("[data-action]").forEach(w=>{w.addEventListener("click",M=>{const L=M.target.closest("[data-action]");((L==null?void 0:L.dataset.action)==="info"||(L==null?void 0:L.dataset.action)==="info-close")&&(M.preventDefault(),M.stopPropagation()),En(M)})}),ft(),F&&La(),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(w=>{w.addEventListener("keydown",M=>{(M.key==="Enter"||M.key===" ")&&(M.preventDefault(),w.click())})});const e=r.querySelector("#delete-cal-confirm"),t=r.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||m)});const a=r.querySelector("#delete-ab-confirm"),l=r.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||m)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(w=>{w.addEventListener("error",()=>{const M=w.dataset.avatarFallback||"?",L=document.createElement("span");L.className="contact-avatar contact-avatar-fallback",L.setAttribute("aria-hidden","true"),L.textContent=M,w.replaceWith(L)})}),ra||(document.addEventListener("keydown",w=>{if(w.key==="Escape"){if(B&&(B.phase==="done"||B.phase==="error")){ya();return}if(!B){if(F){F=!1,ft(),u();return}if(Ee!==null||we!==null){Ee=null,we=null,u();return}Da()}}}),ra=!0);const o=r.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",w=>{w.preventDefault(),vn(o)});const p=r.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",w=>{w.preventDefault(),$n(p)}),r.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(w=>{w.addEventListener("change",()=>{wn(w)})}),r.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(w=>{w.indeterminate=!0});const n=r.querySelector('[data-form="share"]');n==null||n.addEventListener("submit",w=>{w.preventDefault(),kn(n)});const s=r.querySelector('[data-form="edit-cal"]');s&&(Sa(s),s.addEventListener("submit",w=>{w.preventDefault(),Dn(s)}));const i=r.querySelector('[data-form="edit-event"]');i==null||i.addEventListener("submit",w=>{w.preventDefault(),Sn(i)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(w=>{w.addEventListener("change",()=>{if(!y)return;const M=r.querySelector('[data-form="edit-event"]');if(!M)return;const L=new FormData(M),G=M.querySelector('input[name="allDay"]'),X=vt(L);X.endMode==="until"&&!X.until&&(X.until=Ze(String(L.get("start")??y.start??""))||ae(new Date)),y={...y,summary:String(L.get("summary")??y.summary),description:String(L.get("description")??y.description),location:String(L.get("location")??y.location),instanceId:Number(L.get("instanceId"))||y.instanceId,allDay:(G==null?void 0:G.checked)??y.allDay,start:String(L.get("start")??y.start??""),end:String(L.get("end")??y.end??"")||null,repeat:X,hasRrule:!!String(L.get("repeatFreq")??"").trim()},X.freq&&X.endMode==="until"&&(I==null?void 0:I.field)==="end"&&(I=null),u(),X.endMode==="until"&&requestAnimationFrame(()=>{var Ge;const ne=r.querySelector('input[name="repeatUntil"]');ne==null||ne.focus();try{(Ge=ne==null?void 0:ne.showPicker)==null||Ge.call(ne)}catch{}})})});const b=r.querySelector('[data-form="create-cal"]');b&&(Sa(b),b.addEventListener("submit",w=>{w.preventDefault(),Cn(b)}));const f=r.querySelector('[data-form="create-ab"]');f==null||f.addEventListener("submit",w=>{w.preventDefault(),In(f)});const g=r.querySelector('[data-form="edit-ab"]');g==null||g.addEventListener("submit",w=>{w.preventDefault(),On(g)});const P=r.querySelector('[data-form="contact"]');P==null||P.addEventListener("submit",w=>{w.preventDefault(),An(P)});const x=r.querySelector('[data-form="task"]');if(x==null||x.addEventListener("submit",w=>{w.preventDefault(),bn(x)}),x){const w=x.querySelector('select[name="instanceId"]');w==null||w.addEventListener("change",()=>{if(!z||!V)return;const M=Number(w.value);if(!Number.isFinite(M)||M<=0)return;const L=new FormData(x),G=String(L.get("due")??"").trim();V={...V,instanceId:M,parentUid:V.parentUid&&pe.some(X=>X.uid===V.parentUid&&X.instanceId===M)?V.parentUid:null,summary:String(L.get("summary")??""),description:String(L.get("description")??""),status:String(L.get("status")??"NEEDS-ACTION"),due:G?new Date(G).toISOString():null,priority:Number(L.get("priority")??0),percent:Number(L.get("percent")??0)},u()})}const S=r.querySelector('[data-form="note"]');S==null||S.addEventListener("submit",w=>{w.preventDefault(),hn(S)});const U=r.querySelector('input[data-action="contact-search"]');U==null||U.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{Xe=U.value,q!==null&&(async()=>{try{await We(q),u()}catch(w){h("error",w instanceof Error?w.message:"Search failed"),u()}})()},250)});const oe=r.querySelector('input[data-action="task-search"]');oe==null||oe.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{Tt=oe.value,(async()=>{try{await Ye(),u()}catch(w){h("error",w instanceof Error?w.message:"Search failed"),u()}})()},250)});const E=r.querySelector('input[data-action="note-search"]');E==null||E.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{Nt=E.value,(async()=>{try{await ot(),u()}catch(w){h("error",w instanceof Error?w.message:"Search failed"),u()}})()},250)}),Tn(),gn(),yn()}async function fn(e){var o,p;const t=ka();if(t.length===0){h("error","No writable tasks selected"),u();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;m=!0,N(),u();try{const n=await A.bulkTasks({op:"delete",items:a});le=[],ye&&t.some(s=>ee(s.instanceId,s.uri)===ye)&&(ye=null,V=null,z=!1),await Ye(),n.failed>0?h("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk delete failed")}finally{m=!1,u()}return}let l={};if(e==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!s){h("error","Choose a status to apply"),u();return}l={status:s}}else if(e==="bulk-task-due"){const n=St.trim();if(!n){h("error","Choose a due date to apply"),u();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){h("error","Invalid due date"),u();return}l={due:s.toISOString()}}else if(e==="bulk-task-clear-due")l={due:null};else if(e==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(s===""){h("error","Enter a percent complete (0–100)"),u();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){h("error","Percent must be between 0 and 100"),u();return}l={percent:Math.round(i)}}m=!0,N(),u();try{const n=await A.bulkTasks({op:"update",items:a,fields:l});if(await Ye(),V&&!z){const i=ee(V.instanceId,V.uri),b=pe.find(f=>ee(f.instanceId,f.uri)===i);b&&(V={...b})}const s=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?h("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk update failed")}finally{m=!1,u()}}async function bn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),b=String(t.get("parentUid")??"").trim(),f=b===""?null:b;m=!0,N(),u();try{if(z){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const P=await A.createTask({instanceId:g,summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:f});z=!1,ye=ee(P.task.instanceId,P.task.uri),V=P.task,h("success",f?"Subtask created":"Task created")}else if(V){const g=await A.updateTask(V.instanceId,V.uri,{summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:f});V=g.task,ye=ee(g.task.instanceId,g.task.uri),h("success","Task saved")}await Ye()}catch(g){h("error",g instanceof Error?g.message:"Save failed")}finally{m=!1,u()}}async function hn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;m=!0,N(),u();try{if(ie){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await A.createNote({instanceId:n,summary:a,description:l,dtstart:p});ie=!1,Ie=ee(s.note.instanceId,s.note.uri),K=s.note,h("success","Note created")}else if(K){const n=await A.updateNote(K.instanceId,K.uri,{summary:a,description:l,dtstart:p});K=n.note,Ie=ee(n.note.instanceId,n.note.uri),h("success","Note saved")}await ot()}catch(n){h("error",n instanceof Error?n.message:"Save failed")}finally{m=!1,u()}}function yn(){const e=r.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),u();return}try{const l=await Qa(t);ke=l,me=`data:${t.type||"image/jpeg"};base64,${l}`,De=!1,u()}catch(l){h("error",l instanceof Error?l.message:"Failed to read photo"),u()}}})()})}function gn(){const e=r.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),l=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const p=()=>{const n=t.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};t.addEventListener("change",p),p()}async function vn(e){const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("password")??"");m=!0,N(),u(),O.event("login.attempt",{username:a});try{const o=await A.login(a,l);c=o.user,jt(o.ui),O.event("login.ok",{username:(c==null?void 0:c.username)??a}),Ht(),oa(),Ft(v),await Te(),h("success","Signed in")}catch(o){O.warn("login.failed",o instanceof Error?o.message:o),h("error",o instanceof Error?o.message:"Login failed")}finally{m=!1,u()}}async function $n(e){const t=new FormData(e),a=String(t.get("path")??""),l=String(t.get("newName")??"").trim();if(!a||!l){h("error","Name is required"),u();return}m=!0,N(),u();try{await A.filesRename(a,l),O.event("files.rename",{path:a,newName:l}),Ee=null,await Ae(),h("success",`Renamed to “${l}”`)}catch(o){h("error",o instanceof Error?o.message:"Rename failed")}finally{m=!1,u()}}async function wn(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",m=!0,N(),u();let l=0;const o=[];try{for(const p of a)try{await A.filesUpload(Ce,p,{replace:!0}),O.event("files.upload",{path:Ce,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await Ae(),l>0&&o.length===0?h("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?h("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):h("error",o[0]||"Upload failed")}catch(p){h("error",p instanceof Error?p.message:"Upload failed")}finally{m=!1,u()}}async function kn(e){if(D===null)return;const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("access")??"read");H=!0,m=!0,N(),u();try{await A.share(D,a,l),await bt(D),h("success",`Shared with ${a}`)}catch(o){h("error",o instanceof Error?o.message:"Share failed")}finally{m=!1,u()}}function gt(e){if(!y)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');y={...y,summary:String(t.get("summary")??y.summary),description:String(t.get("description")??y.description),location:String(t.get("location")??y.location),instanceId:Number(t.get("instanceId"))||y.instanceId,allDay:(a==null?void 0:a.checked)??y.allDay,start:String(t.get("start")??y.start??""),end:String(t.get("end")??y.end??"")||null,repeat:vt(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function vt(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),l=String(e.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const i=String(e.get("repeatUntil")??"").trim();p=i?i.slice(0,10):null}else if(o==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:p,count:n,byDay:s,endMode:o}}async function Sn(e){if(!y||!y.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||y.instanceId,b=vt(t);if(!a){h("error","Title is required"),u();return}if(!n){h("error","Start is required"),u();return}let f,g;if(p)f=n.slice(0,10),g=s?s.slice(0,10):f;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const U=zt(n,s||null);f=new Date(U.start).toISOString(),g=U.end?new Date(U.end).toISOString():null}else f=new Date(n).toISOString(),g=s?new Date(s).toISOString():null;const P=y.instanceId,x=y.uri,S=xe;m=!0,N(),be=!0,u(),O.event(S?"event.create":"event.update",{instanceId:i,uri:S?null:x,allDay:p,summary:a});try{const U={summary:a,description:l,location:o,allDay:p,start:f,end:g,instanceId:i,repeat:b},oe=S?await A.createEvent(i,U):await A.updateEvent(P,x,U);(D===null||oe.event.instanceId!==D)&&(D=oe.event.instanceId),await Oe(),be=!1,y=null,xe=!1,I=null,O.event(S?"event.created":"event.saved",{uri:oe.event.uri,instanceId:oe.event.instanceId}),h("success",S?"Event created":"Event saved")}catch(U){O.warn("event.save failed",U instanceof Error?U.message:U),h("error",U instanceof Error?U.message:"Save failed")}finally{m=!1,u()}}async function Dn(e){if(D===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim();m=!0,N(),u();try{const p=await A.updateCalendar(D,{displayname:a,description:l,color:o});H=!0,await Te(),D=p.calendar.id,await bt(D),await Oe(),h("success","Calendar updated")}catch(p){h("error",p instanceof Error?p.message:"Update failed")}finally{m=!1,u()}}async function Cn(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if(J=!0,p&&!n){h("error","Select a country for the holidays calendar"),u();return}if(!p&&!a){h("error","Display name is required"),u();return}m=!0,N(),u();try{const i=await A.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:s});D=i.calendar.id,J=!1,await Te();let b=`Created “${i.calendar.displayname}”`;const f=i.holidayImport??i.calendar.holidayImport;f&&(b+=`. Holidays imported: ${aa(f)}.`),s&&(b+=" Calendar is read-only."),h("success",b)}catch(i){J=!0,h("error",i instanceof Error?i.message:"Create failed")}finally{m=!1,u()}}async function En(e){var l,o,p;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&O.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){B&&(B.phase==="done"||B.phase==="error")&&ya();return}if(a==="logout"){m=!0,O.event("logout");try{await A.logout()}catch{}Wt(),N(),u();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;D=n,m=!0,N(),u();try{await Oe()}catch(s){h("error",s instanceof Error?s.message:"Failed to load calendar")}finally{m=!1,u()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;D=n,H=!0,ce=null,m=!0,N(),u();try{await bt(n),await Oe()}catch(i){h("error",i instanceof Error?i.message:"Failed to open calendar")}finally{m=!1,u()}return}if(a==="close-cal-modal"){H=!1,u();return}if(a==="open-create-cal-modal"){J=!0,H=!1,ce=null,N(),u();return}if(a==="close-create-cal-modal"){J=!1,N(),u();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;ce=n,H=!1,N(),u();return}if(a==="cancel-delete-cal"){ce=null,u();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;m=!0,N(),u();try{if(await A.deleteCalendar(n),D===n&&(D=null),ce=null,H=!1,ve=[],Y=[],await Te(),D===null){const i=ca();i&&(D=i.id,await Oe())}h("success","Calendar deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="month-today"){const n=new Date;_={y:n.getFullYear(),m:n.getMonth()},ut=null,m=!0,u();try{await Oe()}finally{m=!1,u()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,s=new Date(_.y,_.m+n,1);_={y:s.getFullYear(),m:s.getMonth()},ut=null,m=!0,u();try{await Oe()}finally{m=!1,u()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;m=!0,N(),u();try{const i=await A.getEvent(n,s);y={...i.event,repeat:i.event.repeat??xt()},xe=!1,be=!0,I=null,H=!1,ce=null}catch(i){h("error",i instanceof Error?i.message:"Failed to open event")}finally{m=!1,u()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";ut=ut===n?null:n,u();return}if(a==="new-event-day"){const n=e.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(D===null){h("error","Select a calendar first"),u();return}const i=T.find(b=>b.id===D);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){h("error","This calendar is read-only"),u();return}xe=!0,y=Ka(s,D),be=!0,I=null,H=!1,ce=null,N(),u();return}if(a==="close-event-modal"){be=!1,y=null,xe=!1,I=null,N(),u();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&y&&gt(s),(I==null?void 0:I.field)===n)I=null;else{const i=t.dataset.dtDateOnly==="1",b=t.dataset.dtClear!=="0",f=t.dataset.dtName||n;let g=Xt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=yt().start);const P=ht(g||ae(new Date)),[x,S]=P.date.split("-").map(Number);I={field:n,viewY:x,viewM:(S||1)-1,dateOnly:i,allowClear:b,name:f}}u();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!I)return;const n=a==="dt-month-prev"?-1:1,s=new Date(I.viewY,I.viewM+n,1);I={...I,viewY:s.getFullYear(),viewM:s.getMonth()},u();return}if(a==="dt-pick-day"){if(!I)return;const n=I.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&gt(i);const b=I.dateOnly;if(b)Le(n,s),I=null;else{const f=Xt(n),g=ht(f||yt(s).start).hm;Le(n,`${s}T${g}`),I={...I,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&y&&!b&&y.end){const f=new Date(String(y.start)),g=new Date(String(y.end));!Number.isNaN(f.getTime())&&!Number.isNaN(g.getTime())&&g<=f&&Le("end",He(new Date(f.getTime()+3600*1e3)))}u();return}if(a==="dt-pick-time"){if(!I||I.dateOnly)return;const n=I.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&gt(i);const b=Xt(n)||yt().start,g=`${ht(b).date}T${s}`;if(Le(n,g),n==="start"&&y){y={...y,allDay:!1};const P=y.end?ht(String(y.end)):null,x=new Date(g);(!P||new Date(`${P.date}T${P.hm}`)<=x)&&Le("end",He(new Date(x.getTime()+3600*1e3)))}I=null,u();return}if(a==="dt-today"){if(!I)return;const n=I.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&gt(s);const i=ae(new Date);if(I.dateOnly)Le(n,i);else{const b=yt(i);n==="start"?(Le("start",b.start),y&&!y.end&&Le("end",b.end)):n==="end"?Le("end",b.end):Le(n,b.start)}I=null,u();return}if(a==="dt-clear"){if(!I||!I.allowClear)return;const n=I.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&gt(s),Le(n,null),I=null,u();return}if(a==="event-allday-toggle"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),b=String(i.get("start")??y.start??""),f=String(i.get("end")??y.end??"")||null;let g=b,P=f;if(s){const x=Ua(b,f);g=x.start,P=x.end}else{const x=b.slice(0,10),S=(f||b).slice(0,10),U=zt(x,S);g=U.start,P=U.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:s,start:g,end:P,repeat:vt(i)}}else y={...y,allDay:s};I=null,u();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),b=vt(s);y={...y,summary:String(s.get("summary")??y.summary),description:String(s.get("description")??y.description),location:String(s.get("location")??y.location),instanceId:Number(s.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(s.get("start")??y.start??""),end:String(s.get("end")??y.end??"")||null,repeat:b,hasRrule:!!String(s.get("repeatFreq")??"").trim()},b.freq&&b.endMode==="until"&&(I==null?void 0:I.field)==="end"&&(I=null),u();return}if(a==="delete-event"){if(!y||!y.canWrite||xe||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,s=y.uri;m=!0,N(),u();try{await A.deleteEvent(n,s),be=!1,y=null,await Oe(),h("success","Event deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="info"){const n=t.dataset.info??"";Ln(n);return}if(a==="info-close"){Da();return}if(a==="flash-close"){N(),u();return}if(a==="user-menu-toggle"){e.stopPropagation(),F=!F,u();return}if(a==="user-menu-close"){F&&(F=!1,u());return}if(a==="tab"){const n=na(t.dataset.tab);n&&await Pa(n);return}if(a==="files-nav"){Ce=t.dataset.path??"",Ee=null,we=null,Z=[],m=!0,N(),u();try{await Ae()}catch(s){h("error",s instanceof Error?s.message:"Failed to open folder")}finally{m=!1,u()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?Z.includes(n)||(Z=[...Z,n]):Z=Z.filter(i=>i!==n),u();return}if(a==="files-select-all"){e.stopPropagation(),Z=t.checked?$e.map(s=>s.path):[],u();return}if(a==="files-bulk-clear"){Z=[],u();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;m=!0,N(),u();try{const s=await A.filesCopy(n);O.event("files.copy",{path:n,to:s.entry.path}),await Ae(),h("success",`Copied as “${s.entry.name}”`)}catch(s){h("error",s instanceof Error?s.message:"Copy failed")}finally{m=!1,u()}return}if(a==="files-bulk-copy"){if(Z.length===0)return;const n=[...Z];m=!0,N(),u();try{const s=await A.filesBulk("copy",n);O.event("files.bulk-copy",{ok:s.ok,failed:s.failed}),Z=[],await Ae(),s.failed===0?h("success",s.ok===1?"Copied 1 item":`Copied ${s.ok} items`):s.ok>0?h("info",`Copied ${s.ok}; ${s.failed} failed. ${s.errors[0]||""}`):h("error",s.errors[0]||"Copy failed")}catch(s){h("error",s instanceof Error?s.message:"Bulk copy failed")}finally{m=!1,u()}return}if(a==="files-bulk-delete"){if(Z.length===0)return;const n=Z.length;if(!confirm(n===1?"Delete the selected item? This cannot be undone.":`Delete ${n} selected items? This cannot be undone.`))return;const s=[...Z];m=!0,N(),u();try{const i=await A.filesBulk("delete",s);O.event("files.bulk-delete",{ok:i.ok,failed:i.failed}),Z=[],await Ae(),i.failed===0?h("success",i.ok===1?"Deleted 1 item":`Deleted ${i.ok} items`):i.ok>0?h("info",`Deleted ${i.ok}; ${i.failed} failed. ${i.errors[0]||""}`):h("error",i.errors[0]||"Delete failed")}catch(i){h("error",i instanceof Error?i.message:"Bulk delete failed")}finally{m=!1,u()}return}if(a==="files-refresh"){m=!0,N(),u();try{await Ae(),h("success","Refreshed")}catch(n){h("error",n instanceof Error?n.message:"Refresh failed")}finally{m=!1,u()}return}if(a==="files-mkdir"){const n=window.prompt("New folder name");if(n===null)return;const s=n.trim();if(!s){h("error","Folder name is required"),u();return}m=!0,N(),u();try{await A.filesMkdir(Ce,s),O.event("files.mkdir",{path:Ce,name:s}),await Ae(),h("success",`Created folder “${s}”`)}catch(i){h("error",i instanceof Error?i.message:"Could not create folder")}finally{m=!1,u()}return}if(a==="files-rename-open"){Ee=t.dataset.path??null,we=null,u();return}if(a==="files-rename-close"){Ee=null,u();return}if(a==="files-delete-open"){we=t.dataset.path??null,Ee=null,u();return}if(a==="files-delete-close"){we=null,u();return}if(a==="files-delete-confirm"){const n=t.dataset.path??we;if(!n)return;m=!0,N(),u();try{await A.filesDelete(n),O.event("files.delete",{path:n}),we=null,await Ae(),h("success","Deleted")}catch(s){h("error",s instanceof Error?s.message:"Delete failed")}finally{m=!1,u()}return}if(a==="files-download"){O.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){_e===n?Re=Re==="asc"?"desc":"asc":(_e=n,Re=n==="due"||n==="summary"?"asc":"desc"),m=!0,u();try{await Ye()}catch(s){h("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}else{rt===n?Qe=Qe==="asc"?"desc":"asc":(rt=n,Qe="asc"),m=!0,u();try{await ot()}catch(s){h("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=pe.find(b=>b.instanceId===n&&b.uri===s)??null;z=!1,ye=ee(n,s),V=i?{...i}:null,N(),u();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=ee(n,s),b=pe.find(f=>ee(f.instanceId,f.uri)===i);if(!b||!b.canWrite||b.readOnly)return;le.includes(i)?le=le.filter(f=>f!==i):le=[...le,i],u();return}if(a==="task-select-all"){e.preventDefault();const n=pe.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>le.includes(ee(i.instanceId,i.uri)))?le=[]:le=n.map(i=>ee(i.instanceId,i.uri)),u();return}if(a==="bulk-task-clear"){le=[],u();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){fn(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=st.find(b=>b.instanceId===n&&b.uri===s)??null;ie=!1,Ie=ee(n,s),K=i?{...i}:null,N(),u();return}if(a==="new-task"){z=!0,ye=null,V={uri:"",instanceId:((o=Ve[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},N(),u();return}if(a==="new-subtask"){if(!V||z||!V.uid||!V.canWrite)return;const n=V;z=!0,ye=null,V={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},N(),u();return}if(a==="new-note"){ie=!0,Ie=null,K={uri:"",instanceId:((p=je[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},N(),u();return}if(a==="cancel-task"){z=!1,V=null,ye=null,u();return}if(a==="cancel-note"){ie=!1,K=null,Ie=null,u();return}if(a==="delete-task"){if(!V||z||!confirm("Delete this task? CalDAV clients will sync the removal."))return;m=!0,N(),u();try{await A.deleteTask(V.instanceId,V.uri),ye=null,V=null,await Ye(),h("success","Task deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-note"){if(!K||ie||!confirm("Delete this note? CalDAV clients will sync the removal."))return;m=!0,N(),u();try{await A.deleteNote(K.instanceId,K.uri),Ie=null,K=null,await ot(),h("success","Note deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;q=n,Se=!1,Q=null,C=null,te=!1,ue=!1,Xe="",qe=[],me=null,ke=null,De=!1,N(),m=!0,u();try{await We(n)}catch(s){h("error",s instanceof Error?s.message:"Failed to load contacts")}finally{m=!1,u()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!he.find(b=>b.id===n))return;const i=q!==n;q=n,Se=!0,ue=!1,N(),i&&(Q=null,C=null,te=!1,Xe="",qe=[],me=null,ke=null,De=!1),m=!0,u();try{i&&await We(n)}catch(b){h("error",b instanceof Error?b.message:"Failed to open address book")}finally{m=!1,u()}return}if(a==="close-ab-modal"){Se=!1,u();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;N();try{await Ga(n)}catch(s){h("error",s instanceof Error?s.message:"Failed to load contact")}u();return}if(a==="new-contact"){if(q===null)return;Xa(),N(),u();return}if(a==="cancel-contact"||a==="close-contact-modal"){te=!1,ue=!1,C=null,Q=null,me=null,ke=null,De=!1,I=null,N(),u();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!C)return;At(),Array.isArray(C.emails)||(C.emails=[""]),Array.isArray(C.phones)||(C.phones=[{type:"cell",value:""}]),Array.isArray(C.custom)||(C.custom=[]),a==="add-email"?C.emails.length<10&&C.emails.push(""):a==="add-phone"?C.phones.length<10&&C.phones.push({type:"other",value:""}):C.custom.length<30&&C.custom.push({label:"",value:""}),u();return}if(a==="remove-email"){if(!C)return;At();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(C.emails)?C.emails:[""];C.emails=s.filter((i,b)=>b!==n),C.emails.length===0&&(C.emails=[""]),u();return}if(a==="remove-phone"){if(!C)return;At();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(C.phones)?C.phones:[{type:"cell",value:""}];C.phones=s.filter((i,b)=>b!==n),C.phones.length===0&&(C.phones=[{type:"cell",value:""}]),u();return}if(a==="remove-custom"){if(!C)return;At();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;C.custom=(Array.isArray(C.custom)?C.custom:[]).filter((s,i)=>i!==n),u();return}if(a==="remove-photo"){me=null,ke=null,De=!0,C&&(C.hasPhoto=!1),u();return}if(a==="delete-contact"){if(q===null||!Q||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;m=!0,N(),ue=!0,u();try{await A.deleteContact(q,Q),Q=null,C=null,te=!1,ue=!1,I=null,me=null,await Te(),h("success","Contact deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??q);if(!Number.isFinite(n)||!he.find(i=>i.id===n))return;de=n,Se=!1,ue=!1,N(),u();return}if(a==="cancel-delete-ab"){de=null,u();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=he.find(f=>f.id===n);if(!i)return;const b=(i.cardCount??0)>0;m=!0,N(),u();try{await A.deleteAddressBook(n,b),q===n&&(q=null,qe=[],C=null,Q=null,te=!1),de=null,Se=!1,ue=!1,await Te(),q===null&&he.length>0&&(q=he[0].id,await We(q)),h("success","Address book deleted")}catch(f){h("error",f instanceof Error?f.message:"Delete failed")}finally{m=!1,u()}return}if(a==="export-ab"){if(q===null)return;Se=!0,m=!0,N(),u();try{const{blob:n,filename:s}=await A.exportAddressBook(q),i=URL.createObjectURL(n),b=document.createElement("a");b.href=i,b.download=s,b.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="export-contact"){if(q===null||!Q||te)return;ue=!0,m=!0,N(),u();try{const{blob:n,filename:s}=await A.exportContact(q,Q),i=URL.createObjectURL(n),b=document.createElement("a");b.href=i,b.download=s,b.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||D===null||!confirm("Revoke access for this user?"))return;H=!0,m=!0,N(),u();try{await A.revoke(D,n),await bt(D),h("success","Share revoked")}catch(s){h("error",s instanceof Error?s.message:"Revoke failed")}finally{m=!1,u()}return}if(a==="export-cal"){if(D===null)return;H=!0,m=!0,N(),u();try{const{blob:n,filename:s}=await A.exportCalendar(D),i=URL.createObjectURL(n),b=document.createElement("a");b.href=i,b.download=s,b.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}}}function Tn(){const e=r.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Pn(e)});const t=r.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Fn(t)});const a=r.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Nn(a)})}async function Nn(e){var l;if(q===null)return;const t=(l=e.files)==null?void 0:l[0];if(e.value="",!t)return;const a=q;Se=!0,m=!0,N(),Fe(),B={kind:"contacts",fileName:t.name,fileSizeLabel:ba(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ha(),u();try{const o=await $a(t,s=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:s};const i=r.querySelector(".import-progress-bar"),b=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),b&&s!==null&&(b.textContent=`Reading file… ${s}%`)});Ke("uploading",{readPercent:100}),Ke("processing",{processPercent:0}),O.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const p=await A.importAddressBook(a,o,s=>{ga(s)}),n=aa(p);await Te(),q===a&&await We(a),Fe(),Ke("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),h("success",`Import finished for “${t.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";Fe(),Ke("error",{ok:!1,resultMessage:p}),h("error",p)}finally{m=!1,u()}}function At(){if(!C)return;const e=r.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);C.firstname=String(t.get("firstname")??""),C.lastname=String(t.get("lastname")??""),C.fullname=String(t.get("fullname")??""),C.org=String(t.get("org")??""),C.title=String(t.get("title")??""),C.url=String(t.get("url")??""),C.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();C.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,C.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const l=[];let o=0;for(;t.has(`email_${o}`);)l.push(String(t.get(`email_${o}`)??"")),o++;l.length&&(C.emails=l);const p=[];for(o=0;t.has(`phone_value_${o}`);)p.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;p.length&&(C.phones=p);const n=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)n.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;C.custom=n}function xn(e){const t=new FormData(e),a=[];let l=0;for(;t.has(`email_${l}`);){const s=String(t.get(`email_${l}`)??"").trim();s&&a.push(s),l++}const o=[];for(l=0;t.has(`phone_value_${l}`);){const s=String(t.get(`phone_value_${l}`)??"").trim();s&&o.push({type:String(t.get(`phone_type_${l}`)??"other"),value:s}),l++}const p=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);){const s=String(t.get(`custom_label_${l}`)??"").trim(),i=String(t.get(`custom_value_${l}`)??"").trim();(s||i)&&p.push({label:s,value:i}),l++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:p};return De?n.removePhoto=!0:ke&&(n.photoBase64=ke),n}async function An(e){if(q===null)return;const t=xn(e);m=!0,N(),ue=!0,u();try{if(te){const a=await A.createContact(q,t);te=!1,Q=a.contact.uri,C=null,ue=!1,me=null,ke=null,De=!1,I=null,h("success","Contact created")}else Q&&(Q=(await A.updateContact(q,Q,t)).contact.uri,C=null,ue=!1,me=null,ke=null,De=!1,I=null,h("success","Contact saved"));try{await Te()}catch(a){if(console.error(a),q!==null)try{await We(q)}catch{}}}catch(a){h("error",a instanceof Error?a.message:"Save failed")}finally{m=!1,u()}}async function In(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();if(a){m=!0,N(),u();try{const o=await A.createAddressBook({displayname:a,description:l});q=o.addressbook.id,Q=null,C=null,te=!1,Xe="",await Te(),h("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){h("error",o instanceof Error?o.message:"Create failed")}finally{m=!1,u()}}}async function On(e){if(q===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();Se=!0,m=!0,N(),u();try{await A.updateAddressBook(q,{displayname:a,description:l}),await Te(),h("success","Address book updated")}catch(o){h("error",o instanceof Error?o.message:"Update failed")}finally{m=!1,u()}}function Ln(e){const t=Kn[e];if(!t)return;const a=r.querySelector("#info-modal"),l=r.querySelector("#info-modal-title"),o=r.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=t.title,o.innerHTML=t.paragraphs.map(n=>`<p>${d(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function Da(){const e=r.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Pn(e){var a;if(D===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(H=!0,await Ca(D,t,{keepEditModalOpen:!0}))}async function Fn(e){var b;const t=(b=e.files)==null?void 0:b[0];if(e.value="",!t)return;const a=r.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){h("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),J=!0,u();return}if(p){h("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),J=!0,u();return}let n=String(l.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const s=String(l.get("description")??""),i=String(l.get("color")??"").trim();m=!0,N(),J=!0,u();try{const f=await A.createCalendar({displayname:n,description:s,color:i,readOnly:!1});D=f.calendar.id,J=!1,await Te(),h("success",`Created “${f.calendar.displayname}” — importing…`),await Ca(f.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${f.calendar.displayname}” created. `})}catch(f){const g=f instanceof Error?f.message:"Create or import failed";J=!0,h("error",g),m=!1,u()}}async function Ca(e,t,a={}){m=!0,N(),Fe(),B={kind:"calendar",fileName:t.name,fileSizeLabel:ba(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ha(),u();try{const l=await $a(t,n=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:n};const s=r.querySelector(".import-progress-bar"),i=r.querySelector("[data-import-status-line]");s&&n!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${n}%`),i&&n!==null&&(i.textContent=`Reading file… ${n}%`)});Ke("uploading",{readPercent:100}),Ke("processing",{processPercent:0}),O.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await A.importCalendar(e,l,n=>{ga(n)}),p=aa(o);D===e&&await Oe(),Fe(),Ke("done",{ok:!0,resultMessage:`${p} (from “${t.name}”)`}),h("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";Fe(),Ke("error",{ok:!1,resultMessage:o}),h("error",o)}finally{a.keepEditModalOpen&&(H=!0),m=!1,u()}}Fa()}const Oa=document.getElementById("app");if(!Oa)throw new Error("#app missing");Xn(Oa);
