var Rn=Object.defineProperty;var Un=(s,d,w)=>d in s?Rn(s,d,{enumerable:!0,configurable:!0,writable:!0,value:w}):s[d]=w;var Ca=(s,d,w)=>Un(s,typeof d!="symbol"?d+"":d,w);(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const F of document.querySelectorAll('link[rel="modulepreload"]'))v(F);new MutationObserver(F=>{for(const j of F)if(j.type==="childList")for(const T of j.addedNodes)T.tagName==="LINK"&&T.rel==="modulepreload"&&v(T)}).observe(document,{childList:!0,subtree:!0});function w(F){const j={};return F.integrity&&(j.integrity=F.integrity),F.referrerPolicy&&(j.referrerPolicy=F.referrerPolicy),F.crossOrigin==="use-credentials"?j.credentials="include":F.crossOrigin==="anonymous"?j.credentials="omit":j.credentials="same-origin",j}function v(F){if(F.ep)return;F.ep=!0;const j=w(F);fetch(F.href,j)}})();const Ea={off:0,error:1,warn:2,info:3,debug:4};let wt="off";const Rt="[angaradav-portal]";function Bn(s){const d=(s||"off").toLowerCase().trim();return d==="error"||d==="warn"||d==="info"||d==="debug"||d==="off"?d:"off"}function Vn(s){return wt=Bn(s),wt!=="off"&&console.info(Rt,`log level = ${wt}`),wt}function Na(s){return Ea[wt]>=Ea[s]}function Lt(s,d,w,v){if(!Na(s))return;const F=[Rt,w];v!==void 0&&F.push(v),console[d](...F)}function jn(s,d){Na("info")&&(d&&Object.keys(d).length>0?console.info(Rt,`event:${s}`,d):console.info(Rt,`event:${s}`))}const L={error(s,d){Lt("error","error",s,d)},warn(s,d){Lt("warn","warn",s,d)},info(s,d){Lt("info","info",s,d)},debug(s,d){Lt("debug","debug",s,d)},event:jn};class ye extends Error{constructor(w,v){super(w);Ca(this,"status");this.status=v}}let tt="",Mt=null,Pt=null;function qt(s){tt=s&&typeof s=="string"?s:""}function _n(s){Mt=s}function Hn(s){Pt=s}function na(s){if(!xa(s))try{Pt==null||Pt()}catch{}}function xa(s){return s==="/login"||s==="/ui"||s==="/logout"}function Ut(s,d){if(!xa(s)){qt("");try{Mt==null||Mt(d||"Session timed out. Please sign in again.")}catch{}}}async function U(s,d={}){const w=new Headers(d.headers);d.body&&!w.has("Content-Type")&&w.set("Content-Type","application/json");const v=(d.method||"GET").toUpperCase();v!=="GET"&&v!=="HEAD"&&v!=="OPTIONS"&&tt&&w.set("X-CSRF-Token",tt);const F=typeof performance<"u"?performance.now():Date.now();L.debug(`api → ${v} ${s}`);const j=await fetch(`/api${s}`,{...d,headers:w,credentials:"same-origin"});let T=null;const W=await j.text();if(W)try{T=JSON.parse(W)}catch{T={error:W}}const se=Math.round((typeof performance<"u"?performance.now():Date.now())-F);if(!j.ok){let k=`Request failed (${j.status})`;throw T&&typeof T=="object"&&T!==null&&"error"in T&&typeof T.error=="string"?k=T.error:(j.status===500||j.status===504)&&(k="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),j.status>=500?L.error(`api ← ${v} ${s} ${j.status} (${se}ms)`,k):j.status!==401?L.warn(`api ← ${v} ${s} ${j.status} (${se}ms)`,k):(L.debug(`api ← ${v} ${s} 401 (${se}ms)`),Ut(s,k)),new ye(k,j.status)}return L.info(`api ← ${v} ${s} ${j.status} (${se}ms)`),na(s),T}function Ee(s){return encodeURIComponent(s)}async function Ta(s,d,w,v){const F=new Headers({"Content-Type":w,Accept:"application/x-ndjson, application/json;q=0.9"});tt&&F.set("X-CSRF-Token",tt);const j=typeof performance<"u"?performance.now():Date.now();L.debug(`api → POST ${s} (stream, ${w}, ${d.length} bytes)`);let T;try{T=await fetch(`/api${s}`,{method:"POST",headers:F,credentials:"same-origin",body:d})}catch(_){const Y=_ instanceof Error?_.message:"Network error";throw L.error(`api ← POST ${s} network fail`,Y),new ye(`Import request failed to start (${Y}). Check connectivity and container logs.`,0)}const W=(T.headers.get("Content-Type")||"").toLowerCase(),se=W.includes("ndjson")||W.includes("x-ndjson");if(!T.ok&&!se){let _=`Request failed (${T.status})`;try{const Y=await T.json();Y.error&&(_=Y.error)}catch{}throw(T.status===504||T.status===502)&&(_="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),T.status===401?(L.debug(`api ← POST ${s} 401`,_),Ut(s,_)):L.warn(`api ← POST ${s} ${T.status}`,_),new ye(_,T.status)}if(!se&&T.ok){try{const _=await T.json();if(_&&typeof _.error=="string")throw new ye(_.error,T.status||500);if(_&&typeof _.imported=="number"&&typeof _.updated=="number")return L.info(`api ← POST ${s} json done`),_}catch(_){if(_ instanceof ye)throw _}throw new ye("Unexpected import response from server",500)}if(!T.body)throw new ye("Import stream unavailable",500);const k=T.body.getReader(),ge=new TextDecoder;let H="";const J={final:null,error:null,sawProgress:!1},ie=_=>{let Y;try{Y=JSON.parse(_)}catch{L.debug("import stream non-JSON line",_.slice(0,80));return}if(Y.type==="progress"){J.sawProgress=!0;const Ie=Number(Y.total)||0,fe=Number(Y.current)||0,b=typeof Y.percent=="number"?Y.percent:Ie>0?Math.round(100*fe/Ie):0;v==null||v({percent:b,current:fe,total:Ie,imported:Number(Y.imported)||0,updated:Number(Y.updated)||0,skipped:Number(Y.skipped)||0})}else Y.type==="done"&&Y.result?J.final=Y.result:Y.type==="error"&&(J.error={message:Y.error||"Import failed",status:Y.status||500})};for(;;){const{done:_,value:Y}=await k.read();if(_)break;H+=ge.decode(Y,{stream:!0});const Ie=H.split(`
`);H=Ie.pop()??"";for(const fe of Ie){const b=fe.trim();b&&ie(b)}}H.trim()&&ie(H.trim());const de=Math.round((typeof performance<"u"?performance.now():Date.now())-j);if(J.error)throw J.error.status===401?(L.debug(`api ← POST ${s} stream 401 (${de}ms)`,J.error.message),Ut(s,J.error.message)):L.warn(`api ← POST ${s} stream error (${de}ms)`,J.error.message),new ye(J.error.message,J.error.status);if(!J.final)throw L.error(`api ← POST ${s} stream incomplete (${de}ms)`,{sawProgress:J.sawProgress}),new ye(J.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return L.info(`api ← POST ${s} stream done (${de}ms)`),na(s),J.final}const O={ui:()=>U("/ui"),me:async()=>{var d;const s=await U("/me");return qt(s.csrfToken||((d=s.user)==null?void 0:d.csrfToken)),s},login:async(s,d)=>{var v;const w=await U("/login",{method:"POST",body:JSON.stringify({username:s,password:d})});return qt((v=w.user)==null?void 0:v.csrfToken),w},logout:async()=>{try{return await U("/logout",{method:"POST"})}finally{qt("")}},calendars:()=>U("/calendars"),createCalendar:s=>U("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>U("/holidays/countries"),updateCalendar:(s,d)=>U(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteCalendar:s=>U(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,d,w)=>{const v=new URLSearchParams({from:d,to:w}).toString();return U(`/calendars/${s}/events?${v}`)},getEvent:(s,d)=>U(`/calendars/${s}/events/${Ee(d)}`),createEvent:(s,d)=>U(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(d)}),updateEvent:(s,d,w)=>U(`/calendars/${s}/events/${Ee(d)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteEvent:(s,d)=>U(`/calendars/${s}/events/${Ee(d)}`,{method:"DELETE"}),exportCalendar:async s=>{const d=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!d.ok){let T=`Export failed (${d.status})`;try{const W=await d.json();W.error&&(T=W.error)}catch{}throw new ye(T,d.status)}const w=d.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(w),F=(v==null?void 0:v[1])||`calendar-${s}.ics`;return{blob:await d.blob(),filename:F}},importCalendar:(s,d,w)=>Ta(`/calendars/${s}/import`,d,"text/calendar; charset=utf-8",w),directory:()=>U("/directory"),shares:s=>U(`/calendars/${s}/shares`),share:(s,d,w)=>U(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:d,access:w})}),revoke:(s,d)=>U(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:d})}),addressbooks:()=>U("/addressbooks"),createAddressBook:s=>U("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,d)=>U(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteAddressBook:(s,d=!1)=>U(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:d})}),exportAddressBook:async s=>{const d=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!d.ok){let T=`Export failed (${d.status})`;try{const W=await d.json();W.error&&(T=W.error)}catch{}throw new ye(T,d.status)}const w=d.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(w),F=(v==null?void 0:v[1])||`contacts-${s}.vcf`;return{blob:await d.blob(),filename:F}},importAddressBook:(s,d,w)=>Ta(`/addressbooks/${s}/import`,d,"text/vcard; charset=utf-8",w),contacts:(s,d="")=>{const w=d.trim()?`?q=${encodeURIComponent(d.trim())}`:"";return U(`/addressbooks/${s}/contacts${w}`)},getContact:(s,d)=>U(`/addressbooks/${s}/contacts/${Ee(d)}`),createContact:(s,d)=>U(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(d)}),updateContact:(s,d,w)=>U(`/addressbooks/${s}/contacts/${Ee(d)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteContact:(s,d)=>U(`/addressbooks/${s}/contacts/${Ee(d)}`,{method:"DELETE"}),exportContact:async(s,d)=>{const w=await fetch(`/api/addressbooks/${s}/contacts/${Ee(d)}/export`,{credentials:"same-origin"});if(!w.ok){let W=`Export failed (${w.status})`;try{const se=await w.json();se.error&&(W=se.error)}catch{}throw new ye(W,w.status)}const v=w.headers.get("Content-Disposition")||"",F=/filename="([^"]+)"/i.exec(v),j=(F==null?void 0:F[1])||"contact.vcf";return{blob:await w.blob(),filename:j}},contactPhotoUrl:(s,d)=>`/api/addressbooks/${s}/contacts/${Ee(d)}/photo`,tasks:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const w=d.toString()?`?${d}`:"";return U(`/tasks${w}`)},createTask:s=>U("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,d,w)=>U(`/tasks/${s}/${Ee(d)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteTask:(s,d)=>U(`/tasks/${s}/${Ee(d)}`,{method:"DELETE"}),bulkTasks:s=>U("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const w=d.toString()?`?${d}`:"";return U(`/notes${w}`)},createNote:s=>U("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,d,w)=>U(`/notes/${s}/${Ee(d)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteNote:(s,d)=>U(`/notes/${s}/${Ee(d)}`,{method:"DELETE"}),filesStatus:()=>U("/files"),filesList:(s="")=>{const d=new URLSearchParams;s&&d.set("path",s);const w=d.toString()?`?${d}`:"";return U(`/files/entries${w}`)},filesMkdir:(s,d)=>U("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:d})}),filesUpload:async(s,d,w={})=>{const v=new URLSearchParams;s&&v.set("path",s),v.set("name",d.name),w.replace&&v.set("replace","1");const F=new Headers;tt&&F.set("X-CSRF-Token",tt);const j=new FormData;j.append("file",d,d.name),s&&j.append("path",s);const T=typeof performance<"u"?performance.now():Date.now();L.debug(`api → POST /files/upload path=${s||"/"} name=${d.name} size=${d.size}`);const W=await fetch(`/api/files/upload?${v}`,{method:"POST",headers:F,credentials:"same-origin",body:j}),se=await W.text();let k=null;if(se)try{k=JSON.parse(se)}catch{k={error:se}}const ge=Math.round((typeof performance<"u"?performance.now():Date.now())-T);if(!W.ok){let H=`Upload failed (${W.status})`;throw k&&typeof k=="object"&&k!==null&&"error"in k&&typeof k.error=="string"&&(H=k.error),W.status===401?(L.debug(`api ← POST /files/upload 401 (${ge}ms)`,H),Ut("/files/upload",H)):W.status>=500?L.error(`api ← POST /files/upload ${W.status} (${ge}ms)`,H):L.warn(`api ← POST /files/upload ${W.status} (${ge}ms)`,H),new ye(H,W.status)}return L.info(`api ← POST /files/upload 200 (${ge}ms)`),na("/files/upload"),k},filesDownloadUrl:s=>{const d=new URLSearchParams;return d.set("path",s),`/api/files/download?${d}`},filesDelete:s=>U("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,d)=>U("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:d})}),filesMove:(s,d,w)=>U("/files/move",{method:"POST",body:JSON.stringify({from:s,to:d,newName:w})})},Aa="angaradav-portal-tab",Wn="1.0.5",Yn="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function aa(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function Jn(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0],d=aa(s);if(d)return d;try{const w=aa(sessionStorage.getItem(Aa));if(w)return w}catch{}return"calendars"}function Ft(s){try{sessionStorage.setItem(Aa,s)}catch{}if(typeof history>"u"||typeof location>"u")return;const d=`#${s}`;location.hash!==d&&history.replaceState(null,"",`${location.pathname}${location.search}${d}`)}function c(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ea(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(s)}</span>`}function ta(s){const d=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&d.push(`${s.skipped} skipped`),d.join(", ")}const zn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, rename, and delete. Quotas and size limits are configured by the administrator.","This feature must be enabled under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV. Open the classic Web Admin for users, system settings, and database configuration.","The Admin UI uses the separate admin password (not your DAV user password), unless you already have an admin session."]}};function pe(s,d,w="h2"){const v=w;return`<div class="section-title-row">
    <${v}>${c(s)}</${v}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(d)}"
      aria-label="About ${c(s)}" title="About ${c(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Kn(){return`
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
    </div>`}function Gn(s){let d=null,w=null,v=Jn(),F=!1,j=null,T=[],W=[],se=[],k=null,ge=[],H=!1,J=!1,ie=null,de=null,_={y:new Date().getFullYear(),m:new Date().getMonth()},Y=[],Ie=!1,fe=!1,b=null,Te=!1,N=null,St="",ct=null,be=[],P=null,Fe=[],Ge="",Q=null,C=null,ee=!1,ce=!1,we=!1,ue=null,$e=null,Se=!1,m=!1,B=null,kt=null,sa=!1,at={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Me=null,ra=900,ut=null,mt=Wn,Bt=!1,Dt=!1;function Vt(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();at={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},Vn(at.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(ra=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(mt=e.version.trim())}function jt(){ut!==null&&(clearTimeout(ut),ut=null)}function _t(){if(jt(),!d)return;const e=Math.max(30,ra)*1e3;ut=setTimeout(()=>{ut=null,la("Your session timed out. Please sign in again.")},e)}function Ht(){jt(),Oe(),B=null,d=null,T=[],ge=[],k=null,W=[],be=[],P=null,Fe=[],Q=null,C=null,ee=!1,ce=!1,we=!1,J=!1,H=!1,ie=null,de=null,fe=!1,b=null,Te=!1,Y=[],me=[],nt=[],Be=[],Ve=[],he=null,Ne=null,V=null,K=null,z=!1,le=!1,re=[],Wt=null,ke="",qe=[],rt=!1,De=null,ve=null,ue=null,$e=null,Se=!1,m=!1,F=!1,pt()}function Ct(){return!!(d!=null&&d.isAdmin||(d==null?void 0:d.role)==="Admin")}function pt(){j&&(document.removeEventListener("click",j,!0),j=null)}function Oa(){pt(),j=t=>{var o;const a=t.target;(o=a==null?void 0:a.closest)!=null&&o.call(a,".user-menu")||(F=!1,pt(),u())};const e=j;setTimeout(()=>{F&&j===e&&document.addEventListener("click",e,!0)},0)}function oa(){v==="admin"&&!Ct()&&(v="calendars",Ft(v))}async function La(e,t={}){e==="admin"&&!Ct()&&(e="calendars"),v=e,F=!1,Ft(e),L.event("tab",{tab:e}),e!=="calendars"&&(H=!1,ie=null),e!=="contacts"&&(de=null),t.clearFlash!==!1&&x(),m=!0,u();try{e==="contacts"&&P!==null?await He(P):e==="calendars"?await xe():e==="tasks"?await We():e==="notes"?await ot():e==="files"&&await Ue()}catch(a){L.warn("tab load failed",a instanceof Error?a.message:a),h("error",a instanceof Error?a.message:"Failed to load")}finally{m=!1,u()}}async function Ue(){rt=!0;try{L.debug("loadFiles",{path:ke});const[e,t]=await Promise.all([O.filesStatus(),O.filesList(ke).catch(a=>{if(a instanceof ye&&(a.status===503||a.status===404))return{path:ke,entries:[]};throw a})]);Wt=e,e.ready?(ke=t.path,qe=t.entries):qe=[],L.event("loadFiles",{path:ke,count:qe.length,enabled:e.enabled,ready:e.ready})}finally{rt=!1}}function la(e){if(!Bt){if(!d){jt();return}Bt=!0;try{L.event("session.expired"),Ht(),Dt=!0,w={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},u()}finally{Bt=!1}}}let me=[],nt=[],Be=[],Ve=[],Et="",Tt="",je="due",Pe="asc",st="dtstart",Xe="desc",he=null,Ne=null,V=null,K=null,z=!1,le=!1,re=[],Wt=null,ke="",qe=[],rt=!1,De=null,ve=null;function h(e,t){Dt&&e==="error"||(e!=="error"&&(Dt=!1),w={type:e,message:t})}function x(){w=null,Dt=!1}async function Fa(){L.event("bootstrap.start"),_n(e=>{la(/timed\s*out|session expired/i.test(e)?e:"Your session timed out. Please sign in again.")}),Hn(()=>{_t()});try{const e=await O.ui();Vt(e.ui),typeof e.version=="string"&&e.version.trim()!==""?mt=e.version.trim():e.ui&&typeof e.ui.version=="string"&&e.ui.version.trim()!==""&&(mt=e.ui.version.trim())}catch(e){L.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await O.me();d=e.user,Vt(e.ui),typeof e.version=="string"&&e.version.trim()!==""&&(mt=e.version.trim()),L.event("bootstrap.session",{username:(d==null?void 0:d.username)??null}),_t(),oa(),Ft(v),await Ce()}catch(e){e instanceof ye&&e.status===401?(Ht(),/timed\s*out|session expired/i.test(e.message)&&h("info",e.message),L.event("bootstrap.anonymous")):(L.error("bootstrap failed",e instanceof Error?e.message:e),h("error",e instanceof Error?e.message:"Failed to load"))}u()}async function Ce(){L.debug("loadHome");const[e,t,a]=await Promise.all([O.calendars(),O.directory().catch(()=>({users:[]})),O.addressbooks()]);if(T=e.calendars,W=t.users,be=a.addressbooks,L.event("loadHome",{calendars:T.length,addressBooks:be.length,directory:W.length}),se.length===0)try{se=(await O.holidayCountries()).countries}catch{se=[]}if(k!==null&&!T.some(o=>o.id===k)&&(k=null,ge=[],H=!1,ie=null),k===null){const o=ia();o&&(k=o.id)}k!==null&&H?await ft(k):k!==null&&(ge=[]),v==="calendars"&&await xe(),P!==null&&!be.some(o=>o.id===P)&&(P=null,Fe=[],Q=null,C=null,ee=!1),de!==null&&!be.some(o=>o.id===de)&&(de=null),P===null&&be.length>0&&(P=be[0].id),P!==null&&v==="contacts"&&await He(P),v==="tasks"&&await We(),v==="notes"&&await ot(),v==="files"&&await Ue()}async function ft(e){ge=(await O.shares(e)).shares}function ia(){const e=T.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const o=a.uri.toLowerCase(),l=a.displayname.toLowerCase();return o==="default"||l==="default"||l==="default calendar"};return e.find(t)??e[0]??null}function te(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${o}`}function Ma(e,t){const a=new Date(e,t,1),o=new Date(e,t+1,0);return{from:te(a),to:te(o)}}function Yt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,o,l]=e.split("-").map(Number);return new Date(a,o-1,l)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,o,l]=e.slice(0,10).split("-").map(Number);return new Date(a,(o||1)-1,l||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Pa(e){const t=Yt(e.start);if(!e.end)return[te(t)];let a=Yt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const r=new Date(e.end);!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getSeconds()===0&&r.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[te(t)];const o=[],l=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;l<=p&&n++<370;)o.push(te(l)),l.setDate(l.getDate()+1);return o.length?o:[te(t)]}function Jt(e,t){const a=e.slice(0,10),o=(t||a).slice(0,10);if(a===o){const R=ht(a);return{start:R.start,end:R.end}}const[l,p,n]=a.split("-").map(Number),[r,i,f]=o.split("-").map(Number),y=_e(new Date(l,p-1,n,9,0,0,0)),g=_e(new Date(r,i-1,f,17,0,0,0));return{start:y,end:g}}function qa(e,t){const a=Qe(e);let o=t?Qe(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=new Date(t);if(!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getTime()>new Date(e).getTime()){const p=Yt(t);p.setDate(p.getDate()-1),o=te(p)}}return{start:a,end:o}}async function xe(){if(k===null){Y=[];return}const{from:e,to:t}=Ma(_.y,_.m);Ie=!0,L.debug("loadMonthEvents",{selectedId:k,from:e,to:t});try{Y=(await O.calendarEvents(k,e,t)).events,L.event("monthEvents.loaded",{calendarId:k,count:Y.length,from:e,to:t})}catch(a){Y=[],L.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Ie=!1}}function Ra(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Ua(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,zt())} ${t}`}function Ba(){const e=k!==null?T.find(E=>E.id===k):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",o=_.y,l=_.m,p=new Date(o,l,1),n=Kt(),r=(p.getDay()-n+7)%7,i=new Date(o,l+1,0).getDate(),f=new Date(o,l,0).getDate(),g=te(new Date),R=da(),A=new Map;for(const E of Y)for(const S of Pa(E)){const M=A.get(S)??[];M.push(E),A.set(S,M)}const D=[],q=Math.ceil((r+i)/7)*7;for(let E=0;E<q;E++){let S,M=!0,I;E<r?(S=f-r+E+1,M=!1,I=new Date(o,l-1,S)):E>=r+i?(S=E-(r+i)+1,M=!1,I=new Date(o,l+1,S)):(S=E-r+1,I=new Date(o,l,S));const G=te(I),X=G===g,ae=M?A.get(G)??[]:[],Ke=ct===G?50:3,dt=ae.slice(0,Ke),At=ae.length-dt.length,Re=dt.map(vt=>{const Zt=k??0,Ot=Ua(vt);return`<button type="button" class="month-event${vt.allDay?"":" is-timed"}" title="${c(Ot)}" style="--ev-color:${c(a)}"
            data-action="open-event" data-instance="${Zt}" data-uri="${c(vt.uri)}" ${m?"disabled":""}>${c(Ot)}</button>`}).join(""),Xt=At>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(G)}" title="Show all events this day" ${m?"disabled":""}>+${At} more</button>`:"",Qt=!M&&(S===1||E===r+i)?I.toLocaleString(void 0,{month:"short",day:"numeric"}):String(S),It=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));D.push(`<div class="month-cell${M?"":" is-outside"}${X?" is-today":""}${It?" is-clickable":""}"${It?` data-action="new-event-day" data-day="${c(G)}" role="button" tabindex="0" title="Add event on ${c(G)}"`:""}>
        <div class="month-daynum${X?" is-today-num":""}">${c(Qt)}</div>
        <div class="month-events">${Re}${Xt}</div>
      </div>`)}const oe=e?Ie?'<p class="muted small month-empty-hint">Loading events…</p>':"":T.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${m?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${m?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${m?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(Ra(o,l))}</h2>
        <span class="month-cal-name muted small" title="${c(t)}">
          <span class="cal-swatch" style="background:${c(a)};margin-top:0"></span>
          ${c(t)}
        </span>
      </div>
      ${oe}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${R.map(E=>`<div class="month-dow">${c(E)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${D.join("")}
        </div>
      </div>
    </section>`}function Qe(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):te(t)}function Va(){if(at.timeFormat==="24h")return!1;if(at.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function zt(){return Va()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Kt(){var a;if(at.weekStart==="monday")return 1;if(at.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const o of e)try{const l=new Intl.Locale(o),p=typeof l.getWeekInfo=="function"?l.getWeekInfo():l.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function da(){const e=Kt(),t=new Date(2024,0,7+e),a=[];for(let o=0;o<7;o++){const l=new Date(t);l.setDate(t.getDate()+o),a.push(l.toLocaleDateString(void 0,{weekday:"short"}))}return a}function ca(e,t=15){const a=t*60*1e3,o=e.getTime();return o%a===0?new Date(o):new Date(Math.ceil(o/a)*a)}function _e(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ja(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=e.slice(0,10),[l,p,n]=o.split("-").map(Number);return new Date(l,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...zt()})}function bt(e){if(!e){const a=ca(new Date);return{date:te(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:te(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function ht(e){const t=new Date,a=te(t);if(e&&e!==a){const[p,n,r]=e.split("-").map(Number),i=new Date(p,n-1,r,9,0,0,0),f=new Date(p,n-1,r,10,0,0,0);return{start:_e(i),end:_e(f)}}const o=ca(t,15),l=new Date(o.getTime()+3600*1e3);return{start:_e(o),end:_e(l)}}function _a(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Ze(e){const{field:t,name:a,label:o,value:l,dateOnly:p=!1,required:n,disabled:r,allowClear:i=!0}=e,f=(N==null?void 0:N.field)===t,y=ja(l,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${c(t)}">
      <span class="dt-field-label">${c(o)}</span>
      <input type="hidden" name="${c(a)}" value="${c(l)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(t)}"
        data-dt-name="${c(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${r?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${c(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!r?Ha(t,l,p,i):""}
    </div>`}function Gt(e){var t;return e==="start"?String((b==null?void 0:b.start)||""):e==="end"?String((b==null?void 0:b.end)||""):e==="until"?((t=b==null?void 0:b.repeat)==null?void 0:t.until)||Qe(b==null?void 0:b.start)||te(new Date):e==="due"?lt(V==null?void 0:V.due):e==="dtstart"?lt(K==null?void 0:K.dtstart):e==="bulk-due"?St:e==="birthday"?String((C==null?void 0:C.birthday)||""):""}function Ae(e,t){if(e==="start"&&b){b={...b,start:t||""};return}if(e==="end"&&b){b={...b,end:t};return}if(e==="until"&&b){b={...b,repeat:{...b.repeat??Nt(),until:t,endMode:"until"}};return}if(e==="due"&&V){if(t===null||t==="")V={...V,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))V={...V,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));V={...V,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&K){if(t===null||t==="")K={...K,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))K={...K,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));K={...K,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&C){C={...C,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(St=t||"")}function Ha(e,t,a,o){const l=bt(t),p=(N==null?void 0:N.viewY)??Number(l.date.slice(0,4)),n=(N==null?void 0:N.viewM)??Number(l.date.slice(5,7))-1,r=Kt(),i=da(),y=(new Date(p,n,1).getDay()-r+7)%7,g=new Date(p,n+1,0).getDate(),R=new Date(p,n,0).getDate(),A=l.date,D=l.hm,q=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),oe=[],E=Math.ceil((y+g)/7)*7;for(let M=0;M<E;M++){let I,G,X=!1;M<y?(I=R-y+M+1,G=new Date(p,n-1,I),X=!0):M>=y+g?(I=M-(y+g)+1,G=new Date(p,n+1,I),X=!0):(I=M-y+1,G=new Date(p,n,I));const ae=te(G),Ke=ae===A,dt=ae===te(new Date);oe.push(`<button type="button" class="dt-day${X?" is-outside":""}${Ke?" is-selected":""}${dt?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${c(ae)}">${I}</button>`)}const S=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${_a().map(M=>{const I=(()=>{const[G,X]=M.split(":").map(Number);return new Date(2e3,0,1,G,X).toLocaleTimeString(void 0,zt())})();return`<button type="button" class="dt-time${M===D?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${M}" role="option" aria-selected="${M===D}">${c(I)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(q)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(M=>`<span class="dt-dow">${c(M)}</span>`).join("")}</div>
          <div class="dt-days">${oe.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(e)}" ${o?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${S}
      </div>
    </div>`}function Wa(){s.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const o=t.getBoundingClientRect(),l=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let r=o.bottom+6;r+n>window.innerHeight-l&&(r=Math.max(l,o.top-n-6));let i=o.left;i+p>window.innerWidth-l&&(i=Math.max(l,window.innerWidth-p-l)),i<l&&(i=l),a.style.top=`${Math.round(r)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function Nt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Ya(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Ja(){if(!fe||!b)return"";const e=b,t=e.repeat??Nt(),a=(t.freq||"").toUpperCase(),o=T.filter(A=>A.canShare||A.access==="readwrite"),l=T.filter(A=>A.id===e.instanceId?!0:A.readOnly?!1:A.canShare||A.access==="readwrite").map(A=>`<option value="${A.id}" ${A.id===e.instanceId?"selected":""}>${c(A.displayname)}</option>`).join(""),p=e.readOnly||!e.canWrite;let n,r;if(e.allDay)n=Qe(e.start),r=Qe(e.end);else{const A=e.start||"",D=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(A)){const q=Jt(A,D||null);n=q.start,r=q.end||""}else n=lt(e.start),r=lt(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(A=>A.toUpperCase())),y=Ya(t),g=!!a&&y==="until",R=t.until||(y==="until"?Qe(e.start)||te(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${Te?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Je()}
          ${!Te&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${p?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${p||o.length===0?"disabled":""}>
                ${l||`<option value="${e.instanceId}">${c(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(e.summary)}" ${p?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(e.location)}" ${p?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${p?"readonly":""}>${c(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${p?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${Ze({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:p,allowClear:!1})}
              ${Ze({field:"end",name:"end",label:"End",value:r,dateOnly:e.allDay,disabled:p||g,allowClear:!g})}
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${i.map(A=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${A.code}" ${f.has(A.code)?"checked":""} />
                              ${A.label}
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
                      ${y==="until"?Ze({field:"until",name:"repeatUntil",label:"Until",value:R,dateOnly:!0,disabled:p,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${Te?"Create event":"Save event"}</button>
                     ${Te?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${m?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function za(e,t){const a=T.find(o=>o.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:Nt(),readOnly:!1,canWrite:!0}}async function He(e){Fe=(await O.contacts(e,Ge)).contacts,Q!==null&&!Fe.some(a=>a.uri===Q)&&(Q=null,ee||(C=null,ue=null,$e=null,Se=!1))}async function We(){const e=await O.tasks({q:Et,sort:je,order:Pe});me=e.tasks,Be=e.calendars;const t=new Set(me.map(a=>Z(a.instanceId,a.uri)));re=re.filter(a=>t.has(a)),he!==null&&!me.some(a=>`${a.instanceId}|${a.uri}`===he)&&(he=null,z||(V=null))}async function ot(){const e=await O.notes({q:Tt,sort:st,order:Xe});nt=e.notes,Ve=e.calendars,Ne!==null&&!nt.some(t=>`${t.instanceId}|${t.uri}`===Ne)&&(Ne=null,le||(K=null))}function Z(e,t){return`${e}|${t}`}function ua(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function lt(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Ye(e,t,a,o,l,p=""){const n=a===t,r=n?o==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${l}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(e)}${r}</th>`}async function Ka(e){if(P===null)return;const t=await O.getContact(P,e);Q=e,ee=!1;const a=t.contact;C={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??ma(),birthday:a.birthday??null},ue=a.photoDataUri??(a.hasPhoto&&P!==null?`${O.contactPhotoUrl(P,e)}?t=${Date.now()}`:null),$e=null,Se=!1,ce=!0}function Ga(){ee=!0,Q=null,ce=!0,C={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},ue=null,$e=null,Se=!1}function ma(){return{street:"",city:"",region:"",postal:"",country:""}}function Xa(e){return new Promise((t,a)=>{const o=new FileReader;o.onload=()=>{const l=String(o.result??""),p=l.indexOf(",");t(p>=0?l.slice(p+1):l)},o.onerror=()=>a(new Error("Failed to read photo file")),o.readAsDataURL(e)})}function pa(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>AngaraDAV User Portal</span>`,o=d?c(d.displayname||d.username):"",l=Ct()?`<button type="button" class="user-menu-item${v==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",p=d?`<div class="user-menu${F?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${F?"true":"false"}"
              title="${o}">
              <span class="user-menu-name">${o}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${F?"":"hidden"}>
              ${l}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",n=d?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            ${p}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,i=!(H||J||ie!==null||de!==null||fe||ce||we)?Je():"",f=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${c(mt)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(Yn)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${n}
      <main class="container">
        ${i}
        ${e}
      </main>
      ${f}
      ${Kn()}
      ${Qa()}`}function Je(){return w?`<div class="flash flash-${c(w.type)}" role="status">
      <span class="flash-text">${c(w.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function fa(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function it(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),o=t%60;return a>0?`${a}m ${o}s`:`${o}s`}function Oe(){kt!==null&&(clearInterval(kt),kt=null)}function ba(){Oe(),kt=setInterval(()=>{if(!B||B.phase==="done"||B.phase==="error"){Oe();return}B={...B,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},B.phase==="processing"&&ga(B)},1e3)}function ze(e,t={}){B&&(B={...B,phase:e,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3),...t},u())}function ha(){Oe(),B=null,u()}function ya(e){!B||B.phase==="done"||B.phase==="error"||(B={...B,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},ga(B))}function ga(e){const t=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),o=s.querySelector(".import-progress-track"),l=s.querySelector("[data-import-counts]"),p=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${p} (${e.processPercent??0}%) · ${it(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${it(e.elapsedSec)}`;else return;t&&(t.textContent=n),l&&(l.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),o&&e.processPercent!==null&&(o.setAttribute("aria-valuenow",String(e.processPercent)),o.removeAttribute("aria-valuetext"))}function Qa(){if(!B)return"";const e=B,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",o=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",l=(()=>{const r=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return r.map((y,g)=>{let R="pending";return e.phase==="done"||g<f?R="done":g===f&&(R=(e.phase==="error","active")),`<li class="import-step import-step-${R}"><span class="import-step-icon" aria-hidden="true">${R==="done"?"✓":R==="active"?"●":"○"}</span> ${c(y.label)}</li>`}).join("")})();let p="";if(t){let r=null;e.phase==="reading"&&e.readPercent!==null?r=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(r=Math.min(100,Math.max(0,e.processPercent)));const i=r===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=r!==null?` style="width:${r}%"`:"",y=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${y} (${e.processPercent??0}%) · ${it(e.elapsedSec)}`:g=`Importing on server… ${it(e.elapsedSec)}`;const R=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${c(a)}</strong> from
          <span class="mono">${c(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${c(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${l}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${i}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${c(g)}</p>
        ${R}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?p=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${c(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · Took ${c(it(e.elapsedSec))}
        </p>`:p=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${c(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · After ${c(it(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':'<button type="button" class="btn btn-primary" data-action="close-import-progress">Close</button>';return`
      <div class="cal-modal import-progress-modal" role="dialog" aria-modal="true"
        aria-labelledby="import-progress-title" data-import-progress>
        <div class="cal-modal-backdrop"${t?"":' data-action="close-import-progress"'}></div>
        <div class="cal-modal-card cal-modal-card-sm import-progress-card">
          <header class="cal-modal-header">
            <h3 id="import-progress-title">${c(o)}</h3>
            ${t?"":'<button type="button" class="info-modal-close" data-action="close-import-progress" aria-label="Close">×</button>'}
          </header>
          <div class="cal-modal-body">${p}</div>
          <footer class="cal-modal-footer">${n}</footer>
        </div>
      </div>`}function va(e,t){return new Promise((a,o)=>{const l=new FileReader;l.onprogress=p=>{p.lengthComputable&&p.total>0?t(Math.min(100,Math.round(p.loaded/p.total*100))):t(null)},l.onload=()=>a(String(l.result??"")),l.onerror=()=>o(l.error??new Error("Failed to read file")),l.readAsText(e)})}function $a(){s.innerHTML=pa(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function Za(){if(!d){$a();return}const e=T.filter($=>$.canShare),t=T.filter($=>!$.canShare),a=T.find($=>$.id===k)??null,o=e.map($=>{const ne=$.id===k?" is-selected":"",Le=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',$t=ea($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${ne}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${Le}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${$t}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),l=t.map($=>{const ne=$.id===k?" is-selected":"",Le=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',$t=$.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${ne}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0" title="${c($t)}">
          ${Le}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${ea($.access)}</span>
            <span class="muted small">${$.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=W.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=ge.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':ge.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${ea($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${m?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),r=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),f=H&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Je()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(a.uri)}
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
                        value="${c(a.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${c(r)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${c(a.color||r)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${c(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${pe(`Share “${a.displayname}”`,"share")}
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
                  ${pe("Import / export","import-export")}
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
          </div>`:"",y=ie!==null?T.find($=>$.id===ie&&$.canShare)??null:null,g=y?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Je()}
              <p>You are about to permanently delete <strong>${c(y.displayname)}</strong>
                <span class="muted small mono">(${c(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${y.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",R=J?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Je()}
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
                    ${se.map($=>`<option value="${c($.code)}">${c($.name)} (${c($.code)})</option>`).join("")}
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
        </div>`:"",A=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${pe("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${o||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${pe("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${l}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${m?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Ba()}
      </div>
      ${R}
      ${f}
      ${g}
      ${Ja()}`,D=be.map($=>`<div class="cal-row${$.id===P?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),q=be.find($=>$.id===P)??null,oe=Fe.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Ge?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Fe.map($=>{const ne=!ee&&$.uri===Q?" is-selected":"",Le=c(($.displayname||"?").slice(0,1).toUpperCase()),$t=$.hasPhoto&&P!==null?`<img class="contact-avatar" src="${c(O.contactPhotoUrl(P,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${Le}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Le}</span>`;return`<tr class="contact-table-row${ne}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${$t}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),E=C,S=Array.isArray(E==null?void 0:E.emails)&&E.emails.length>0?E.emails:[""],M=Array.isArray(E==null?void 0:E.phones)&&E.phones.length>0?E.phones:[{type:"cell",value:""}],I=(E==null?void 0:E.address)??ma(),G=S.map(($,ne)=>`<div class="multi-row" data-multi="email" data-idx="${ne}">
          <input type="email" name="email_${ne}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${ne}" ${S.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),X=M.map(($,ne)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${ne}">
          <select name="phone_type_${ne}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Le=>`<option value="${Le}" ${(($==null?void 0:$.type)??"other")===Le?"selected":""}>${Le}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${ne}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${ne}" ${M.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ae=Array.isArray(E==null?void 0:E.custom)?E.custom:[],Ke=ae.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ae.map(($,ne)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${ne}">
                <input type="text" name="custom_label_${ne}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${ne}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${ne}" title="Remove">×</button>
              </div>`).join(""),dt=ce&&E&&q?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${ee?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Je()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${ue?`<img src="${c(ue)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((E.fullname||E.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        ${ue?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${m?"disabled":""} hidden />
                      </label>
                      ${ue||E.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${m?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${c(E.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${c(E.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${c(E.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${c(E.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${c(E.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${G}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${S.length>=10?"disabled":""}>+ Email</button>
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
                      <input type="text" name="street" value="${c(I.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${c(I.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${c(I.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${c(I.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${c(I.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${c(E.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${Ze({field:"birthday",name:"birthday",label:"Birthday",value:E.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${Ke}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ae.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(E.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>${ee?"Create contact":"Save contact"}</button>
                    ${!ee&&E.uri?`<button type="button" class="btn" data-action="export-contact" ${m?"disabled":""}>Export .vcf</button>`:""}
                    ${ee?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${m?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${m?"disabled":""}>Cancel</button>
                    ${!ee&&E.uri?`<span class="muted small mono">${c(E.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",At=we&&q?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Je()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(q.uri)} · ${q.cardCount} contact${q.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${c(q.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(q.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(q.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${pe("Import / export","contact-import-export")}
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
          </div>`:"",Re=de!==null?be.find($=>$.id===de)??null:null,Xt=Re?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Je()}
              <p>You are about to permanently delete <strong>${c(Re.displayname)}</strong>
                <span class="muted small mono">(${c(Re.uri)})</span>.</p>
              <p class="muted small">${(Re.cardCount??0)>0?`All ${Re.cardCount} contact${Re.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Re.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",Qt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${pe("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${D||'<p class="muted">No address books yet. Create one below.</p>'}
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
          ${q?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${pe("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(Ge)}" aria-label="Search contacts" ${m?"disabled":""} />
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
      ${Xt}
      ${At}
      ${dt}`,It=v==="calendars"?"my-calendars":v==="contacts"?"my-contacts":v==="tasks"?"tasks":v==="notes"?"notes":v==="files"?"files":"administration",vt=ln(),Zt=dn(),Ot=an(),Mn=nn(),Pn=v==="calendars"?A:v==="contacts"?Qt:v==="tasks"?vt:v==="notes"?Zt:v==="files"?Ot:Mn,qn=v!=="admin"?`<header class="page-header">
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
            data-info="${It}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>`:`<header class="page-header page-header-admin">
        ${pe("Administration","administration","h1")}
        <button type="button" class="btn btn-ghost btn-small" data-action="tab" data-tab="calendars"
          title="Back to portal">← Portal</button>
      </header>`;s.innerHTML=pa(`
      ${qn}

      ${Pn}
    `),document.body.classList.toggle("cal-modal-open",H||J||ie!==null||de!==null||fe||ce||we||B!==null||De!==null||ve!==null),document.body.classList.toggle("layout-contacts",v==="contacts"),document.body.classList.toggle("layout-calendars",v==="calendars"),document.body.classList.toggle("layout-tasks",v==="tasks"||v==="notes"),document.body.classList.toggle("layout-files",v==="files"),document.body.classList.toggle("layout-admin",v==="admin")}function en(e){const t=e?e.split("/").filter(Boolean):[];let a="";const o=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${m?"disabled":""}>Home</button>`];for(const l of t){a=a?`${a}/${l}`:l;const p=a;o.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),o.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${c(p)}" ${m?"disabled":""}>${c(l)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${o.join("")}</nav>`}function et(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function tn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function an(){const e=Wt;if(!e)return`<div class="card"><p class="muted">${rt||m?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${pe("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${pe("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${c(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${c(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${et(e.usedBytes)} used · ${et(e.availableBytes)} free of ${et(e.quotaBytes)}`:`${et(e.usedBytes)} used · ${et(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,o=qe.length===0?'<tr><td colspan="4" class="muted">This folder is empty.</td></tr>':qe.map(n=>{const r=n.type==="dir"?"📁":"📄",i=n.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${c(n.path)}" ${m?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${r}</span>${c(n.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${r}</span>${c(n.name)}</span>`,f=n.type==="dir"?"—":et(n.size);return`<tr class="files-row" data-path="${c(n.path)}" data-type="${n.type}">
                <td class="files-col-name">${i}</td>
                <td class="files-col-size mono">${f}</td>
                <td class="files-col-mtime hide-sm">${c(tn(n.mtime))}</td>
                <td class="files-col-actions">
                  ${n.type==="file"?`<a class="btn btn-ghost btn-small" href="${c(O.filesDownloadUrl(n.path))}" download="${c(n.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${c(n.path)}" data-name="${c(n.name)}" ${m?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${c(n.path)}" data-name="${c(n.name)}" ${m?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),l=De!==null?(()=>{const n=qe.find(i=>i.path===De),r=(n==null?void 0:n.name)??"";return`<div class="cal-modal" id="files-rename-modal" role="dialog" aria-modal="true" aria-labelledby="files-rename-title">
              <div class="cal-modal-backdrop" data-action="files-rename-close"></div>
              <div class="cal-modal-card" style="max-width:28rem">
                <header class="cal-modal-header">
                  <h3 id="files-rename-title">Rename</h3>
                  <button type="button" class="info-modal-close" data-action="files-rename-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-rename">
                  <input type="hidden" name="path" value="${c(De)}" />
                  <label>New name
                    <input type="text" name="newName" value="${c(r)}" required maxlength="255" autocomplete="off" />
                  </label>
                  <div class="row-actions">
                    <button type="button" class="btn btn-ghost" data-action="files-rename-close">Cancel</button>
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Rename</button>
                  </div>
                </form>
              </div>
            </div>`})():"",p=ve!==null?(()=>{const n=qe.find(f=>f.path===ve),r=(n==null?void 0:n.name)??ve,i=(n==null?void 0:n.type)==="dir"?"folder":"file";return`<div class="cal-modal" id="files-delete-modal" role="dialog" aria-modal="true" aria-labelledby="files-delete-title">
              <div class="cal-modal-backdrop" data-action="files-delete-close"></div>
              <div class="cal-modal-card" style="max-width:28rem">
                <header class="cal-modal-header">
                  <h3 id="files-delete-title">Delete ${c(i)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-delete-close" aria-label="Close">×</button>
                </header>
                <p>Delete <strong>${c(r)}</strong>?${(n==null?void 0:n.type)==="dir"?" This removes the folder and everything inside it.":""}</p>
                <div class="row-actions" style="margin-top:1rem">
                  <button type="button" class="btn btn-ghost" data-action="files-delete-close">Cancel</button>
                  <button type="button" class="btn btn-danger" data-action="files-delete-confirm" data-path="${c(ve)}" ${m?"disabled":""}>Delete</button>
                </div>
              </div>
            </div>`})():"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${pe("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${c(t)}</span>
          </div>
        </div>
        <p class="muted small" style="margin:0.5rem 0 0">
          DAV clients: <span class="mono">${c(e.davPath)}</span>
          · max upload ${et(e.maxUploadBytes)}
        </p>
        <div class="files-toolbar">
          ${en(ke)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${m||rt?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${m?"disabled":""}>New folder</button>
            <label class="btn btn-primary btn-small files-upload-btn" ${m?"aria-disabled=true":""}>
              Upload
              <input type="file" data-action="files-upload" ${m?"disabled":""} multiple hidden />
            </label>
          </div>
        </div>
        <div class="table-wrap files-table-wrap">
          <table class="files-table">
            <thead>
              <tr>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rt&&qe.length===0?'<tr><td colspan="4" class="muted">Loading…</td></tr>':o}
            </tbody>
          </table>
        </div>
      </section>
      ${l}
      ${p}
    </div>`}function nn(){return Ct()?`<div class="portal-grid portal-grid-admin">
      <section class="card admin-section">
        ${pe("Server administration","administration")}
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
          Signed in as <span class="mono">${c((d==null?void 0:d.username)??"")}</span>
          with role <span class="badge badge-admin">Admin</span>.
        </p>
      </section>
    </div>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function sn(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,y)=>[Z(f.instanceId,f.uri),y])),o=new Map,l=[];for(const f of e){const y=f.parentUid;if(y&&t.has(y)&&y!==f.uid){const g=o.get(y)??[];g.push(f),o.set(y,g)}else l.push(f)}const p=(f,y)=>(a.get(Z(f.instanceId,f.uri))??0)-(a.get(Z(y.instanceId,y.uri))??0);l.sort(p);for(const[,f]of o)f.sort(p);const n=[],r=new Set,i=(f,y)=>{const g=f.uid||Z(f.instanceId,f.uri);if(!r.has(g)){r.add(g),n.push({task:f,depth:Math.min(y,8)});for(const R of o.get(f.uid)??[])i(R,y+1);r.delete(g)}};for(const f of l)i(f,0);for(const f of e)n.some(y=>y.task===f)||n.push({task:f,depth:0});return n}function rn(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const o of me)o.parentUid&&t.has(o.parentUid)&&o.uid&&!t.has(o.uid)&&(t.add(o.uid),a=!0)}return t}function on(e,t){const a=e.instanceId,o=t||!e.uid?new Set:rn(e.uid),l=me.filter(r=>r.uid&&r.instanceId===a&&!o.has(r.uid)&&r.uid!==e.uid),p=e.parentUid||"",n=['<option value="">None (top-level)</option>',...l.map(r=>`<option value="${c(r.uid)}" ${r.uid===p?"selected":""}>${c(r.summary||r.uid)}</option>`)];if(p&&!l.some(r=>r.uid===p)){const r=me.find(i=>i.uid===p);n.push(`<option value="${c(p)}" selected>${c((r==null?void 0:r.summary)||p)} (current)</option>`)}return n.join("")}function wa(){const e=new Set(re);return me.filter(t=>e.has(Z(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function ln(){const e=D=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[D]||D,t=sn(me),a=me.filter(D=>D.canWrite&&!D.readOnly).map(D=>Z(D.instanceId,D.uri)),o=a.length>0&&a.every(D=>re.includes(D)),l=re.length>0,n=wa().length,r=me.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Et?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:D,depth:q})=>{const oe=Z(D.instanceId,D.uri),E=!z&&oe===he?" is-selected":"",S=re.includes(oe),M=D.status==="COMPLETED"?"badge-ok":D.status==="CANCELLED"?"":"badge-admin",I=q>0?` style="--task-depth:${q}"`:"",G=q>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",X=D.canWrite&&!D.readOnly;return`<tr class="contact-table-row task-row${q>0?" is-subtask":""}${E}${S?" is-checked":""}" data-action="select-task" data-instance="${D.instanceId}" data-uri="${c(D.uri)}" tabindex="0" role="button"${I}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${D.instanceId}" data-uri="${c(D.uri)}"
                    ${S?"checked":""} ${X?"":"disabled"} aria-label="Select ${c(D.summary||D.uri)}" ${m?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${G}<span class="contact-name-primary">${c(D.summary||D.uri)}</span></span>
                  ${D.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${M}">${c(e(D.status))}</span></td>
                <td class="col-task-due muted small">${c(ua(D.due))}</td>
                <td class="col-task-cal muted small">${c(D.calendarName)}</td>
                <td class="col-task-pct muted small">${D.percent?c(String(D.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(D,q)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${D}"
        title="${c(q)}" aria-label="${c(q)}" ${m||n===0?"disabled":""}>${i}</button>`,y=l?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${re.length!==n?`<span class="muted small bulk-bar-count-extra">(${re.length-n} read-only skipped)</span>`:""}
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
                ${f("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${Ze({field:"bulk-due",name:"bulkDue",label:"Due",value:St,dateOnly:!1,disabled:m||n===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${m||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${m||n===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${m||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${m?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",g=V,R=Be.map(D=>`<option value="${D.id}" ${g&&g.instanceId===D.id?"selected":""}>${c(D.displayname)}</option>`).join(""),A=g?`<div class="card">
            ${pe(z?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${z?`<label>Calendar
                      <select name="instanceId" required ${Be.length===0?"disabled":""}>
                        <option value="">${Be.length?"Select calendar…":"No writable calendars"}</option>
                        ${R}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(g.summary)}" ${g.readOnly&&!z?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!z?"readonly":""}>${c(g.description)}</textarea>
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
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(D=>`<option value="${D}" ${g.status===D?"selected":""}>${c(e(D))}</option>`).join("")}
                  </select>
                </label>
                ${Ze({field:"due",name:"due",label:"Due",value:lt(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!z),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${c(String(g.priority||0))}" ${g.readOnly&&!z?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${c(String(g.percent||0))}" ${g.readOnly&&!z?"readonly":""} />
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
        ${pe("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(Et)}" aria-label="Search tasks" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${m||Be.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${Be.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${o?"checked":""} ${a.length===0||m?"disabled":""} />
                </th>
                ${Ye("Title","summary",je,Pe,"task","col-task-title")}
                ${Ye("Status","status",je,Pe,"task","col-task-status")}
                ${Ye("Due","due",je,Pe,"task","col-task-due")}
                ${Ye("Calendar","calendar",je,Pe,"task","col-task-cal")}
                ${Ye("%","percent",je,Pe,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${r}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${A}
      </section>
    </div>`}function dn(){const e=nt.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${Tt?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:nt.map(l=>{const p=Z(l.instanceId,l.uri),n=!le&&p===Ne?" is-selected":"",r=(l.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${l.instanceId}" data-uri="${c(l.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(l.summary||l.uri)}</span>
                  ${r?`<span class="muted small contact-name-secondary">${c(r)}${l.description.length>80?"…":""}</span>`:""}
                  ${l.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(ua(l.dtstart))}</td>
                <td class="col-note-cal muted small">${c(l.calendarName)}</td>
              </tr>`}).join(""),t=K,a=Ve.map(l=>`<option value="${l.id}" ${t&&t.instanceId===l.id?"selected":""}>${c(l.displayname)}</option>`).join(""),o=t?`<div class="card">
            ${pe(le?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${le?`<label>Calendar
                      <select name="instanceId" required ${Ve.length===0?"disabled":""}>
                        <option value="">${Ve.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${t.readOnly&&!le?"readonly":""} />
              </label>
              ${Ze({field:"dtstart",name:"dtstart",label:"Date",value:lt(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!le),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!le?"readonly":""}>${c(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${le||t.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${le?"Create note":"Save note"}</button>`:""}
                ${!le&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${m?"disabled":""}>Delete</button>`:le?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${pe("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(Tt)}" aria-label="Search notes" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${m||Ve.length===0?"disabled":""}>Add note</button>
        </div>
        ${Ve.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Ye("Title","summary",st,Xe,"note","col-note-title")}
                ${Ye("Date","dtstart",st,Xe,"note","col-note-date")}
                ${Ye("Calendar","calendar",st,Xe,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${o}
      </section>
    </div>`}function cn(){const e=s.querySelector(".contacts-table-wrap"),t=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function un(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=s.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=s.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=s.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function u(){const e=cn();d?Za():$a(),mn(),un(e),requestAnimationFrame(()=>{var t;Wa(),(t=s.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Sa(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let o=a.value.trim();o&&!o.startsWith("#")&&(o=`#${o}`),/^#[0-9A-Fa-f]{6}/.test(o)&&(t.value=o.slice(0,7),a.value=o.toUpperCase())}))}function mn(){s.querySelectorAll("[data-action]").forEach(S=>{S.addEventListener("click",M=>{const I=M.target.closest("[data-action]");((I==null?void 0:I.dataset.action)==="info"||(I==null?void 0:I.dataset.action)==="info-close")&&(M.preventDefault(),M.stopPropagation()),Cn(M)})}),pt(),F&&Oa(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(S=>{S.addEventListener("keydown",M=>{(M.key==="Enter"||M.key===" ")&&(M.preventDefault(),S.click())})});const e=s.querySelector("#delete-cal-confirm"),t=s.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||m)});const a=s.querySelector("#delete-ab-confirm"),o=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{o&&(o.disabled=!a.checked||m)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(S=>{S.addEventListener("error",()=>{const M=S.dataset.avatarFallback||"?",I=document.createElement("span");I.className="contact-avatar contact-avatar-fallback",I.setAttribute("aria-hidden","true"),I.textContent=M,S.replaceWith(I)})}),sa||(document.addEventListener("keydown",S=>{if(S.key==="Escape"){if(B&&(B.phase==="done"||B.phase==="error")){ha();return}if(!B){if(F){F=!1,pt(),u();return}if(De!==null||ve!==null){De=null,ve=null,u();return}ka()}}}),sa=!0);const l=s.querySelector('[data-form="login"]');l==null||l.addEventListener("submit",S=>{S.preventDefault(),gn(l)});const p=s.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",S=>{S.preventDefault(),vn(p)}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(S=>{S.addEventListener("change",()=>{$n(S)})});const n=s.querySelector('[data-form="share"]');n==null||n.addEventListener("submit",S=>{S.preventDefault(),wn(n)});const r=s.querySelector('[data-form="edit-cal"]');r&&(Sa(r),r.addEventListener("submit",S=>{S.preventDefault(),kn(r)}));const i=s.querySelector('[data-form="edit-event"]');i==null||i.addEventListener("submit",S=>{S.preventDefault(),Sn(i)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(S=>{S.addEventListener("change",()=>{if(!b)return;const M=s.querySelector('[data-form="edit-event"]');if(!M)return;const I=new FormData(M),G=M.querySelector('input[name="allDay"]'),X=gt(I);X.endMode==="until"&&!X.until&&(X.until=Qe(String(I.get("start")??b.start??""))||te(new Date)),b={...b,summary:String(I.get("summary")??b.summary),description:String(I.get("description")??b.description),location:String(I.get("location")??b.location),instanceId:Number(I.get("instanceId"))||b.instanceId,allDay:(G==null?void 0:G.checked)??b.allDay,start:String(I.get("start")??b.start??""),end:String(I.get("end")??b.end??"")||null,repeat:X,hasRrule:!!String(I.get("repeatFreq")??"").trim()},X.freq&&X.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),u(),X.endMode==="until"&&requestAnimationFrame(()=>{var Ke;const ae=s.querySelector('input[name="repeatUntil"]');ae==null||ae.focus();try{(Ke=ae==null?void 0:ae.showPicker)==null||Ke.call(ae)}catch{}})})});const f=s.querySelector('[data-form="create-cal"]');f&&(Sa(f),f.addEventListener("submit",S=>{S.preventDefault(),Dn(f)}));const y=s.querySelector('[data-form="create-ab"]');y==null||y.addEventListener("submit",S=>{S.preventDefault(),An(y)});const g=s.querySelector('[data-form="edit-ab"]');g==null||g.addEventListener("submit",S=>{S.preventDefault(),In(g)});const R=s.querySelector('[data-form="contact"]');R==null||R.addEventListener("submit",S=>{S.preventDefault(),xn(R)});const A=s.querySelector('[data-form="task"]');if(A==null||A.addEventListener("submit",S=>{S.preventDefault(),fn(A)}),A){const S=A.querySelector('select[name="instanceId"]');S==null||S.addEventListener("change",()=>{if(!z||!V)return;const M=Number(S.value);if(!Number.isFinite(M)||M<=0)return;const I=new FormData(A),G=String(I.get("due")??"").trim();V={...V,instanceId:M,parentUid:V.parentUid&&me.some(X=>X.uid===V.parentUid&&X.instanceId===M)?V.parentUid:null,summary:String(I.get("summary")??""),description:String(I.get("description")??""),status:String(I.get("status")??"NEEDS-ACTION"),due:G?new Date(G).toISOString():null,priority:Number(I.get("priority")??0),percent:Number(I.get("percent")??0)},u()})}const D=s.querySelector('[data-form="note"]');D==null||D.addEventListener("submit",S=>{S.preventDefault(),bn(D)});const q=s.querySelector('input[data-action="contact-search"]');q==null||q.addEventListener("input",()=>{Me&&clearTimeout(Me),Me=setTimeout(()=>{Ge=q.value,P!==null&&(async()=>{try{await He(P),u()}catch(S){h("error",S instanceof Error?S.message:"Search failed"),u()}})()},250)});const oe=s.querySelector('input[data-action="task-search"]');oe==null||oe.addEventListener("input",()=>{Me&&clearTimeout(Me),Me=setTimeout(()=>{Et=oe.value,(async()=>{try{await We(),u()}catch(S){h("error",S instanceof Error?S.message:"Search failed"),u()}})()},250)});const E=s.querySelector('input[data-action="note-search"]');E==null||E.addEventListener("input",()=>{Me&&clearTimeout(Me),Me=setTimeout(()=>{Tt=E.value,(async()=>{try{await ot(),u()}catch(S){h("error",S instanceof Error?S.message:"Search failed"),u()}})()},250)}),En(),yn(),hn()}async function pn(e){var l,p;const t=wa();if(t.length===0){h("error","No writable tasks selected"),u();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;m=!0,x(),u();try{const n=await O.bulkTasks({op:"delete",items:a});re=[],he&&t.some(r=>Z(r.instanceId,r.uri)===he)&&(he=null,V=null,z=!1),await We(),n.failed>0?h("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk delete failed")}finally{m=!1,u()}return}let o={};if(e==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),r=((l=n==null?void 0:n.value)==null?void 0:l.trim())??"";if(!r){h("error","Choose a status to apply"),u();return}o={status:r}}else if(e==="bulk-task-due"){const n=St.trim();if(!n){h("error","Choose a due date to apply"),u();return}const r=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(r.getTime())){h("error","Invalid due date"),u();return}o={due:r.toISOString()}}else if(e==="bulk-task-clear-due")o={due:null};else if(e==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),r=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(r===""){h("error","Enter a percent complete (0–100)"),u();return}const i=Number(r);if(!Number.isFinite(i)||i<0||i>100){h("error","Percent must be between 0 and 100"),u();return}o={percent:Math.round(i)}}m=!0,x(),u();try{const n=await O.bulkTasks({op:"update",items:a,fields:o});if(await We(),V&&!z){const i=Z(V.instanceId,V.uri),f=me.find(y=>Z(y.instanceId,y.uri)===i);f&&(V={...f})}const r=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?h("error",`Updated ${r} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Updated ${r} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk update failed")}finally{m=!1,u()}}async function fn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,r=Number(t.get("priority")??0),i=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),y=f===""?null:f;m=!0,x(),u();try{if(z){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const R=await O.createTask({instanceId:g,summary:a,description:o,status:l,due:n,priority:r,percent:i,parentUid:y});z=!1,he=Z(R.task.instanceId,R.task.uri),V=R.task,h("success",y?"Subtask created":"Task created")}else if(V){const g=await O.updateTask(V.instanceId,V.uri,{summary:a,description:o,status:l,due:n,priority:r,percent:i,parentUid:y});V=g.task,he=Z(g.task.instanceId,g.task.uri),h("success","Task saved")}await We()}catch(g){h("error",g instanceof Error?g.message:"Save failed")}finally{m=!1,u()}}async function bn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("dtstart")??"").trim(),p=l?new Date(l).toISOString():null;m=!0,x(),u();try{if(le){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const r=await O.createNote({instanceId:n,summary:a,description:o,dtstart:p});le=!1,Ne=Z(r.note.instanceId,r.note.uri),K=r.note,h("success","Note created")}else if(K){const n=await O.updateNote(K.instanceId,K.uri,{summary:a,description:o,dtstart:p});K=n.note,Ne=Z(n.note.instanceId,n.note.uri),h("success","Note saved")}await ot()}catch(n){h("error",n instanceof Error?n.message:"Save failed")}finally{m=!1,u()}}function hn(){const e=s.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),u();return}try{const o=await Xa(t);$e=o,ue=`data:${t.type||"image/jpeg"};base64,${o}`,Se=!1,u()}catch(o){h("error",o instanceof Error?o.message:"Failed to read photo"),u()}}})()})}function yn(){const e=s.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),o=e.querySelector('input[name="displayname"]'),l=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const p=()=>{const n=t.checked;a.hidden=!n,o&&(o.required=!n,n&&!o.value.trim()?o.placeholder="Auto: Holidays (XX)":n||(o.placeholder="Work")),n&&l&&(l.checked=!0)};t.addEventListener("change",p),p()}async function gn(e){const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("password")??"");m=!0,x(),u(),L.event("login.attempt",{username:a});try{const l=await O.login(a,o);d=l.user,Vt(l.ui),L.event("login.ok",{username:(d==null?void 0:d.username)??a}),_t(),oa(),Ft(v),await Ce(),h("success","Signed in")}catch(l){L.warn("login.failed",l instanceof Error?l.message:l),h("error",l instanceof Error?l.message:"Login failed")}finally{m=!1,u()}}async function vn(e){const t=new FormData(e),a=String(t.get("path")??""),o=String(t.get("newName")??"").trim();if(!a||!o){h("error","Name is required"),u();return}m=!0,x(),u();try{await O.filesRename(a,o),L.event("files.rename",{path:a,newName:o}),De=null,await Ue(),h("success",`Renamed to “${o}”`)}catch(l){h("error",l instanceof Error?l.message:"Rename failed")}finally{m=!1,u()}}async function $n(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",m=!0,x(),u();let o=0;const l=[];try{for(const p of a)try{await O.filesUpload(ke,p,{replace:!0}),L.event("files.upload",{path:ke,name:p.name,size:p.size}),o+=1}catch(n){l.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await Ue(),o>0&&l.length===0?h("success",o===1?"Uploaded 1 file":`Uploaded ${o} files`):o>0?h("info",`Uploaded ${o}; ${l.length} failed. ${l[0]}`):h("error",l[0]||"Upload failed")}catch(p){h("error",p instanceof Error?p.message:"Upload failed")}finally{m=!1,u()}}async function wn(e){if(k===null)return;const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("access")??"read");H=!0,m=!0,x(),u();try{await O.share(k,a,o),await ft(k),h("success",`Shared with ${a}`)}catch(l){h("error",l instanceof Error?l.message:"Share failed")}finally{m=!1,u()}}function yt(e){if(!b)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');b={...b,summary:String(t.get("summary")??b.summary),description:String(t.get("description")??b.description),location:String(t.get("location")??b.location),instanceId:Number(t.get("instanceId"))||b.instanceId,allDay:(a==null?void 0:a.checked)??b.allDay,start:String(t.get("start")??b.start??""),end:String(t.get("end")??b.end??"")||null,repeat:gt(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function gt(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),o=String(e.get("repeatEndMode")??"never"),l=o==="until"||o==="count"?o:"never";let p=null,n=null;if(l==="until"){const i=String(e.get("repeatUntil")??"").trim();p=i?i.slice(0,10):null}else if(l==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const r=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:p,count:n,byDay:r,endMode:l}}async function Sn(e){if(!b||!b.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),r=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||b.instanceId,f=gt(t);if(!a){h("error","Title is required"),u();return}if(!n){h("error","Start is required"),u();return}let y,g;if(p)y=n.slice(0,10),g=r?r.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const q=Jt(n,r||null);y=new Date(q.start).toISOString(),g=q.end?new Date(q.end).toISOString():null}else y=new Date(n).toISOString(),g=r?new Date(r).toISOString():null;const R=b.instanceId,A=b.uri,D=Te;m=!0,x(),fe=!0,u(),L.event(D?"event.create":"event.update",{instanceId:i,uri:D?null:A,allDay:p,summary:a});try{const q={summary:a,description:o,location:l,allDay:p,start:y,end:g,instanceId:i,repeat:f},oe=D?await O.createEvent(i,q):await O.updateEvent(R,A,q);(k===null||oe.event.instanceId!==k)&&(k=oe.event.instanceId),await xe(),fe=!1,b=null,Te=!1,N=null,L.event(D?"event.created":"event.saved",{uri:oe.event.uri,instanceId:oe.event.instanceId}),h("success",D?"Event created":"Event saved")}catch(q){L.warn("event.save failed",q instanceof Error?q.message:q),h("error",q instanceof Error?q.message:"Save failed")}finally{m=!1,u()}}async function kn(e){if(k===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim();m=!0,x(),u();try{const p=await O.updateCalendar(k,{displayname:a,description:o,color:l});H=!0,await Ce(),k=p.calendar.id,await ft(k),await xe(),h("success","Calendar updated")}catch(p){h("error",p instanceof Error?p.message:"Update failed")}finally{m=!1,u()}}async function Dn(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),r=t.get("readOnly")==="on";if(J=!0,p&&!n){h("error","Select a country for the holidays calendar"),u();return}if(!p&&!a){h("error","Display name is required"),u();return}m=!0,x(),u();try{const i=await O.createCalendar({displayname:a,description:o,color:l,holidays:p,holidayCountry:p?n:void 0,readOnly:r});k=i.calendar.id,J=!1,await Ce();let f=`Created “${i.calendar.displayname}”`;const y=i.holidayImport??i.calendar.holidayImport;y&&(f+=`. Holidays imported: ${ta(y)}.`),r&&(f+=" Calendar is read-only."),h("success",f)}catch(i){J=!0,h("error",i instanceof Error?i.message:"Create failed")}finally{m=!1,u()}}async function Cn(e){var o,l,p;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&L.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){B&&(B.phase==="done"||B.phase==="error")&&ha();return}if(a==="logout"){m=!0,L.event("logout");try{await O.logout()}catch{}Ht(),x(),u();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;k=n,m=!0,x(),u();try{await xe()}catch(r){h("error",r instanceof Error?r.message:"Failed to load calendar")}finally{m=!1,u()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;k=n,H=!0,ie=null,m=!0,x(),u();try{await ft(n),await xe()}catch(i){h("error",i instanceof Error?i.message:"Failed to open calendar")}finally{m=!1,u()}return}if(a==="close-cal-modal"){H=!1,u();return}if(a==="open-create-cal-modal"){J=!0,H=!1,ie=null,x(),u();return}if(a==="close-create-cal-modal"){J=!1,x(),u();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;ie=n,H=!1,x(),u();return}if(a==="cancel-delete-cal"){ie=null,u();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),r=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;m=!0,x(),u();try{if(await O.deleteCalendar(n),k===n&&(k=null),ie=null,H=!1,ge=[],Y=[],await Ce(),k===null){const i=ia();i&&(k=i.id,await xe())}h("success","Calendar deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="month-today"){const n=new Date;_={y:n.getFullYear(),m:n.getMonth()},ct=null,m=!0,u();try{await xe()}finally{m=!1,u()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,r=new Date(_.y,_.m+n,1);_={y:r.getFullYear(),m:r.getMonth()},ct=null,m=!0,u();try{await xe()}finally{m=!1,u()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;m=!0,x(),u();try{const i=await O.getEvent(n,r);b={...i.event,repeat:i.event.repeat??Nt()},Te=!1,fe=!0,N=null,H=!1,ie=null}catch(i){h("error",i instanceof Error?i.message:"Failed to open event")}finally{m=!1,u()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";ct=ct===n?null:n,u();return}if(a==="new-event-day"){const n=e.target;if((o=n==null?void 0:n.closest)!=null&&o.call(n,".month-event, .month-event-more"))return;const r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;if(k===null){h("error","Select a calendar first"),u();return}const i=T.find(f=>f.id===k);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){h("error","This calendar is read-only"),u();return}Te=!0,b=za(r,k),fe=!0,N=null,H=!1,ie=null,x(),u();return}if(a==="close-event-modal"){fe=!1,b=null,Te=!1,N=null,x(),u();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const r=s.querySelector('[data-form="edit-event"]');if(r&&b&&yt(r),(N==null?void 0:N.field)===n)N=null;else{const i=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",y=t.dataset.dtName||n;let g=Gt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=ht().start);const R=bt(g||te(new Date)),[A,D]=R.date.split("-").map(Number);N={field:n,viewY:A,viewM:(D||1)-1,dateOnly:i,allowClear:f,name:y}}u();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!N)return;const n=a==="dt-month-prev"?-1:1,r=new Date(N.viewY,N.viewM+n,1);N={...N,viewY:r.getFullYear(),viewM:r.getMonth()},u();return}if(a==="dt-pick-day"){if(!N)return;const n=N.field,r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;const i=s.querySelector('[data-form="edit-event"]');i&&b&&yt(i);const f=N.dateOnly;if(f)Ae(n,r),N=null;else{const y=Gt(n),g=bt(y||ht(r).start).hm;Ae(n,`${r}T${g}`),N={...N,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(n==="start"&&b&&!f&&b.end){const y=new Date(String(b.start)),g=new Date(String(b.end));!Number.isNaN(y.getTime())&&!Number.isNaN(g.getTime())&&g<=y&&Ae("end",_e(new Date(y.getTime()+3600*1e3)))}u();return}if(a==="dt-pick-time"){if(!N||N.dateOnly)return;const n=N.field,r=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(r))return;const i=s.querySelector('[data-form="edit-event"]');i&&b&&yt(i);const f=Gt(n)||ht().start,g=`${bt(f).date}T${r}`;if(Ae(n,g),n==="start"&&b){b={...b,allDay:!1};const R=b.end?bt(String(b.end)):null,A=new Date(g);(!R||new Date(`${R.date}T${R.hm}`)<=A)&&Ae("end",_e(new Date(A.getTime()+3600*1e3)))}N=null,u();return}if(a==="dt-today"){if(!N)return;const n=N.field,r=s.querySelector('[data-form="edit-event"]');r&&b&&yt(r);const i=te(new Date);if(N.dateOnly)Ae(n,i);else{const f=ht(i);n==="start"?(Ae("start",f.start),b&&!b.end&&Ae("end",f.end)):n==="end"?Ae("end",f.end):Ae(n,f.start)}N=null,u();return}if(a==="dt-clear"){if(!N||!N.allowClear)return;const n=N.field,r=s.querySelector('[data-form="edit-event"]');r&&b&&yt(r),Ae(n,null),N=null,u();return}if(a==="event-allday-toggle"){if(!b)return;const n=s.querySelector('[data-form="edit-event"]'),r=t.checked;if(n){const i=new FormData(n),f=String(i.get("start")??b.start??""),y=String(i.get("end")??b.end??"")||null;let g=f,R=y;if(r){const A=qa(f,y);g=A.start,R=A.end}else{const A=f.slice(0,10),D=(y||f).slice(0,10),q=Jt(A,D);g=q.start,R=q.end}b={...b,summary:String(i.get("summary")??b.summary),description:String(i.get("description")??b.description),location:String(i.get("location")??b.location),instanceId:Number(i.get("instanceId"))||b.instanceId,allDay:r,start:g,end:R,repeat:gt(i)}}else b={...b,allDay:r};N=null,u();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!b)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const r=new FormData(n),i=n.querySelector('input[name="allDay"]'),f=gt(r);b={...b,summary:String(r.get("summary")??b.summary),description:String(r.get("description")??b.description),location:String(r.get("location")??b.location),instanceId:Number(r.get("instanceId"))||b.instanceId,allDay:(i==null?void 0:i.checked)??b.allDay,start:String(r.get("start")??b.start??""),end:String(r.get("end")??b.end??"")||null,repeat:f,hasRrule:!!String(r.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),u();return}if(a==="delete-event"){if(!b||!b.canWrite||Te||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=b.instanceId,r=b.uri;m=!0,x(),u();try{await O.deleteEvent(n,r),fe=!1,b=null,await xe(),h("success","Event deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="info"){const n=t.dataset.info??"";On(n);return}if(a==="info-close"){ka();return}if(a==="flash-close"){x(),u();return}if(a==="user-menu-toggle"){e.stopPropagation(),F=!F,u();return}if(a==="user-menu-close"){F&&(F=!1,u());return}if(a==="tab"){const n=aa(t.dataset.tab);n&&await La(n);return}if(a==="files-nav"){ke=t.dataset.path??"",De=null,ve=null,m=!0,x(),u();try{await Ue()}catch(r){h("error",r instanceof Error?r.message:"Failed to open folder")}finally{m=!1,u()}return}if(a==="files-refresh"){m=!0,x(),u();try{await Ue(),h("success","Refreshed")}catch(n){h("error",n instanceof Error?n.message:"Refresh failed")}finally{m=!1,u()}return}if(a==="files-mkdir"){const n=window.prompt("New folder name");if(n===null)return;const r=n.trim();if(!r){h("error","Folder name is required"),u();return}m=!0,x(),u();try{await O.filesMkdir(ke,r),L.event("files.mkdir",{path:ke,name:r}),await Ue(),h("success",`Created folder “${r}”`)}catch(i){h("error",i instanceof Error?i.message:"Could not create folder")}finally{m=!1,u()}return}if(a==="files-rename-open"){De=t.dataset.path??null,ve=null,u();return}if(a==="files-rename-close"){De=null,u();return}if(a==="files-delete-open"){ve=t.dataset.path??null,De=null,u();return}if(a==="files-delete-close"){ve=null,u();return}if(a==="files-delete-confirm"){const n=t.dataset.path??ve;if(!n)return;m=!0,x(),u();try{await O.filesDelete(n),L.event("files.delete",{path:n}),ve=null,await Ue(),h("success","Deleted")}catch(r){h("error",r instanceof Error?r.message:"Delete failed")}finally{m=!1,u()}return}if(a==="files-download"){L.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){je===n?Pe=Pe==="asc"?"desc":"asc":(je=n,Pe=n==="due"||n==="summary"?"asc":"desc"),m=!0,u();try{await We()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{m=!1,u()}}else{st===n?Xe=Xe==="asc"?"desc":"asc":(st=n,Xe="asc"),m=!0,u();try{await ot()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{m=!1,u()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=me.find(f=>f.instanceId===n&&f.uri===r)??null;z=!1,he=Z(n,r),V=i?{...i}:null,x(),u();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=Z(n,r),f=me.find(y=>Z(y.instanceId,y.uri)===i);if(!f||!f.canWrite||f.readOnly)return;re.includes(i)?re=re.filter(y=>y!==i):re=[...re,i],u();return}if(a==="task-select-all"){e.preventDefault();const n=me.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>re.includes(Z(i.instanceId,i.uri)))?re=[]:re=n.map(i=>Z(i.instanceId,i.uri)),u();return}if(a==="bulk-task-clear"){re=[],u();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){pn(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=nt.find(f=>f.instanceId===n&&f.uri===r)??null;le=!1,Ne=Z(n,r),K=i?{...i}:null,x(),u();return}if(a==="new-task"){z=!0,he=null,V={uri:"",instanceId:((l=Be[0])==null?void 0:l.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},x(),u();return}if(a==="new-subtask"){if(!V||z||!V.uid||!V.canWrite)return;const n=V;z=!0,he=null,V={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},x(),u();return}if(a==="new-note"){le=!0,Ne=null,K={uri:"",instanceId:((p=Ve[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},x(),u();return}if(a==="cancel-task"){z=!1,V=null,he=null,u();return}if(a==="cancel-note"){le=!1,K=null,Ne=null,u();return}if(a==="delete-task"){if(!V||z||!confirm("Delete this task? CalDAV clients will sync the removal."))return;m=!0,x(),u();try{await O.deleteTask(V.instanceId,V.uri),he=null,V=null,await We(),h("success","Task deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-note"){if(!K||le||!confirm("Delete this note? CalDAV clients will sync the removal."))return;m=!0,x(),u();try{await O.deleteNote(K.instanceId,K.uri),Ne=null,K=null,await ot(),h("success","Note deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;P=n,we=!1,Q=null,C=null,ee=!1,ce=!1,Ge="",Fe=[],ue=null,$e=null,Se=!1,x(),m=!0,u();try{await He(n)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contacts")}finally{m=!1,u()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!be.find(f=>f.id===n))return;const i=P!==n;P=n,we=!0,ce=!1,x(),i&&(Q=null,C=null,ee=!1,Ge="",Fe=[],ue=null,$e=null,Se=!1),m=!0,u();try{i&&await He(n)}catch(f){h("error",f instanceof Error?f.message:"Failed to open address book")}finally{m=!1,u()}return}if(a==="close-ab-modal"){we=!1,u();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;x();try{await Ka(n)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contact")}u();return}if(a==="new-contact"){if(P===null)return;Ga(),x(),u();return}if(a==="cancel-contact"||a==="close-contact-modal"){ee=!1,ce=!1,C=null,Q=null,ue=null,$e=null,Se=!1,N=null,x(),u();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!C)return;xt(),Array.isArray(C.emails)||(C.emails=[""]),Array.isArray(C.phones)||(C.phones=[{type:"cell",value:""}]),Array.isArray(C.custom)||(C.custom=[]),a==="add-email"?C.emails.length<10&&C.emails.push(""):a==="add-phone"?C.phones.length<10&&C.phones.push({type:"other",value:""}):C.custom.length<30&&C.custom.push({label:"",value:""}),u();return}if(a==="remove-email"){if(!C)return;xt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(C.emails)?C.emails:[""];C.emails=r.filter((i,f)=>f!==n),C.emails.length===0&&(C.emails=[""]),u();return}if(a==="remove-phone"){if(!C)return;xt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(C.phones)?C.phones:[{type:"cell",value:""}];C.phones=r.filter((i,f)=>f!==n),C.phones.length===0&&(C.phones=[{type:"cell",value:""}]),u();return}if(a==="remove-custom"){if(!C)return;xt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;C.custom=(Array.isArray(C.custom)?C.custom:[]).filter((r,i)=>i!==n),u();return}if(a==="remove-photo"){ue=null,$e=null,Se=!0,C&&(C.hasPhoto=!1),u();return}if(a==="delete-contact"){if(P===null||!Q||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;m=!0,x(),ce=!0,u();try{await O.deleteContact(P,Q),Q=null,C=null,ee=!1,ce=!1,N=null,ue=null,await Ce(),h("success","Contact deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??P);if(!Number.isFinite(n)||!be.find(i=>i.id===n))return;de=n,we=!1,ce=!1,x(),u();return}if(a==="cancel-delete-ab"){de=null,u();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),r=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;const i=be.find(y=>y.id===n);if(!i)return;const f=(i.cardCount??0)>0;m=!0,x(),u();try{await O.deleteAddressBook(n,f),P===n&&(P=null,Fe=[],C=null,Q=null,ee=!1),de=null,we=!1,ce=!1,await Ce(),P===null&&be.length>0&&(P=be[0].id,await He(P)),h("success","Address book deleted")}catch(y){h("error",y instanceof Error?y.message:"Delete failed")}finally{m=!1,u()}return}if(a==="export-ab"){if(P===null)return;we=!0,m=!0,x(),u();try{const{blob:n,filename:r}=await O.exportAddressBook(P),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="export-contact"){if(P===null||!Q||ee)return;ce=!0,m=!0,x(),u();try{const{blob:n,filename:r}=await O.exportContact(P,Q),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||k===null||!confirm("Revoke access for this user?"))return;H=!0,m=!0,x(),u();try{await O.revoke(k,n),await ft(k),h("success","Share revoked")}catch(r){h("error",r instanceof Error?r.message:"Revoke failed")}finally{m=!1,u()}return}if(a==="export-cal"){if(k===null)return;H=!0,m=!0,x(),u();try{const{blob:n,filename:r}=await O.exportCalendar(k),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}}}function En(){const e=s.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Ln(e)});const t=s.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Fn(t)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Tn(a)})}async function Tn(e){var o;if(P===null)return;const t=(o=e.files)==null?void 0:o[0];if(e.value="",!t)return;const a=P;we=!0,m=!0,x(),Oe(),B={kind:"contacts",fileName:t.name,fileSizeLabel:fa(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ba(),u();try{const l=await va(t,r=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:r};const i=s.querySelector(".import-progress-bar"),f=s.querySelector("[data-import-status-line]");i&&r!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${r}%`),f&&r!==null&&(f.textContent=`Reading file… ${r}%`)});ze("uploading",{readPercent:100}),ze("processing",{processPercent:0}),L.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const p=await O.importAddressBook(a,l,r=>{ya(r)}),n=ta(p);await Ce(),P===a&&await He(a),Oe(),ze("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),h("success",`Import finished for “${t.name}”: ${n}.`)}catch(l){const p=l instanceof Error?l.message:"Import failed";Oe(),ze("error",{ok:!1,resultMessage:p}),h("error",p)}finally{m=!1,u()}}function xt(){if(!C)return;const e=s.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);C.firstname=String(t.get("firstname")??""),C.lastname=String(t.get("lastname")??""),C.fullname=String(t.get("fullname")??""),C.org=String(t.get("org")??""),C.title=String(t.get("title")??""),C.url=String(t.get("url")??""),C.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();C.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,C.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const o=[];let l=0;for(;t.has(`email_${l}`);)o.push(String(t.get(`email_${l}`)??"")),l++;o.length&&(C.emails=o);const p=[];for(l=0;t.has(`phone_value_${l}`);)p.push({type:String(t.get(`phone_type_${l}`)??"other"),value:String(t.get(`phone_value_${l}`)??"")}),l++;p.length&&(C.phones=p);const n=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);)n.push({label:String(t.get(`custom_label_${l}`)??""),value:String(t.get(`custom_value_${l}`)??"")}),l++;C.custom=n}function Nn(e){const t=new FormData(e),a=[];let o=0;for(;t.has(`email_${o}`);){const r=String(t.get(`email_${o}`)??"").trim();r&&a.push(r),o++}const l=[];for(o=0;t.has(`phone_value_${o}`);){const r=String(t.get(`phone_value_${o}`)??"").trim();r&&l.push({type:String(t.get(`phone_type_${o}`)??"other"),value:r}),o++}const p=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);){const r=String(t.get(`custom_label_${o}`)??"").trim(),i=String(t.get(`custom_value_${o}`)??"").trim();(r||i)&&p.push({label:r,value:i}),o++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:l,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const r=String(t.get("birthday")??"").trim();return r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null})(),custom:p};return Se?n.removePhoto=!0:$e&&(n.photoBase64=$e),n}async function xn(e){if(P===null)return;const t=Nn(e);m=!0,x(),ce=!0,u();try{if(ee){const a=await O.createContact(P,t);ee=!1,Q=a.contact.uri,C=null,ce=!1,ue=null,$e=null,Se=!1,N=null,h("success","Contact created")}else Q&&(Q=(await O.updateContact(P,Q,t)).contact.uri,C=null,ce=!1,ue=null,$e=null,Se=!1,N=null,h("success","Contact saved"));try{await Ce()}catch(a){if(console.error(a),P!==null)try{await He(P)}catch{}}}catch(a){h("error",a instanceof Error?a.message:"Save failed")}finally{m=!1,u()}}async function An(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();if(a){m=!0,x(),u();try{const l=await O.createAddressBook({displayname:a,description:o});P=l.addressbook.id,Q=null,C=null,ee=!1,Ge="",await Ce(),h("success",`Address book “${l.addressbook.displayname}” created`)}catch(l){h("error",l instanceof Error?l.message:"Create failed")}finally{m=!1,u()}}}async function In(e){if(P===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();we=!0,m=!0,x(),u();try{await O.updateAddressBook(P,{displayname:a,description:o}),await Ce(),h("success","Address book updated")}catch(l){h("error",l instanceof Error?l.message:"Update failed")}finally{m=!1,u()}}function On(e){const t=zn[e];if(!t)return;const a=s.querySelector("#info-modal"),o=s.querySelector("#info-modal-title"),l=s.querySelector("#info-modal-body");if(!a||!o||!l)return;o.textContent=t.title,l.innerHTML=t.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function ka(){const e=s.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ln(e){var a;if(k===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(H=!0,await Da(k,t,{keepEditModalOpen:!0}))}async function Fn(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=s.querySelector('[data-form="create-cal"]'),o=a?new FormData(a):new FormData,l=o.get("holidays")==="on",p=o.get("readOnly")==="on";if(l){h("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),J=!0,u();return}if(p){h("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),J=!0,u();return}let n=String(o.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const r=String(o.get("description")??""),i=String(o.get("color")??"").trim();m=!0,x(),J=!0,u();try{const y=await O.createCalendar({displayname:n,description:r,color:i,readOnly:!1});k=y.calendar.id,J=!1,await Ce(),h("success",`Created “${y.calendar.displayname}” — importing…`),await Da(y.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const g=y instanceof Error?y.message:"Create or import failed";J=!0,h("error",g),m=!1,u()}}async function Da(e,t,a={}){m=!0,x(),Oe(),B={kind:"calendar",fileName:t.name,fileSizeLabel:fa(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ba(),u();try{const o=await va(t,n=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:n};const r=s.querySelector(".import-progress-bar"),i=s.querySelector("[data-import-status-line]");r&&n!==null&&(r.classList.remove("is-indeterminate"),r.style.width=`${n}%`),i&&n!==null&&(i.textContent=`Reading file… ${n}%`)});ze("uploading",{readPercent:100}),ze("processing",{processPercent:0}),L.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const l=await O.importCalendar(e,o,n=>{ya(n)}),p=ta(l);k===e&&await xe(),Oe(),ze("done",{ok:!0,resultMessage:`${p} (from “${t.name}”)`}),h("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${p}.`)}catch(o){const l=o instanceof Error?o.message:"Import failed";Oe(),ze("error",{ok:!1,resultMessage:l}),h("error",l)}finally{a.keepEditModalOpen&&(H=!0),m=!1,u()}}Fa()}const Ia=document.getElementById("app");if(!Ia)throw new Error("#app missing");Gn(Ia);
