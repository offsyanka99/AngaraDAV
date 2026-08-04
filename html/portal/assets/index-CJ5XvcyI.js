var _n=Object.defineProperty;var Hn=(r,c,D)=>c in r?_n(r,c,{enumerable:!0,configurable:!0,writable:!0,value:D}):r[c]=D;var xa=(r,c,D)=>Hn(r,typeof c!="symbol"?c+"":c,D);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const P of document.querySelectorAll('link[rel="modulepreload"]'))k(P);new MutationObserver(P=>{for(const j of P)if(j.type==="childList")for(const A of j.addedNodes)A.tagName==="LINK"&&A.rel==="modulepreload"&&k(A)}).observe(document,{childList:!0,subtree:!0});function D(P){const j={};return P.integrity&&(j.integrity=P.integrity),P.referrerPolicy&&(j.referrerPolicy=P.referrerPolicy),P.crossOrigin==="use-credentials"?j.credentials="include":P.crossOrigin==="anonymous"?j.credentials="omit":j.credentials="same-origin",j}function k(P){if(P.ep)return;P.ep=!0;const j=D(P);fetch(P.href,j)}})();const Aa={off:0,error:1,warn:2,info:3,debug:4};let St="off";const Vt="[angaradav-portal]";function Wn(r){const c=(r||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function Yn(r){return St=Wn(r),St!=="off"&&console.info(Vt,`log level = ${St}`),St}function Oa(r){return Aa[St]>=Aa[r]}function Ft(r,c,D,k){if(!Oa(r))return;const P=[Vt,D];k!==void 0&&P.push(k),console[c](...P)}function Jn(r,c){Oa("info")&&(c&&Object.keys(c).length>0?console.info(Vt,`event:${r}`,c):console.info(Vt,`event:${r}`))}const M={error(r,c){Ft("error","error",r,c)},warn(r,c){Ft("warn","warn",r,c)},info(r,c){Ft("info","info",r,c)},debug(r,c){Ft("debug","debug",r,c)},event:Jn};class ke extends Error{constructor(D,k){super(D);xa(this,"status");this.status=k}}let st="",Rt=null,Ut=null;function Bt(r){st=r&&typeof r=="string"?r:""}function zn(r){Rt=r}function Kn(r){Ut=r}function la(r){if(!La(r))try{Ut==null||Ut()}catch{}}function La(r){return r==="/login"||r==="/ui"||r==="/logout"}function jt(r,c){if(!La(r)){Bt("");try{Rt==null||Rt(c||"Session timed out. Please sign in again.")}catch{}}}async function R(r,c={}){const D=new Headers(c.headers);c.body&&!D.has("Content-Type")&&D.set("Content-Type","application/json");const k=(c.method||"GET").toUpperCase();k!=="GET"&&k!=="HEAD"&&k!=="OPTIONS"&&st&&D.set("X-CSRF-Token",st);const P=typeof performance<"u"?performance.now():Date.now();M.debug(`api → ${k} ${r}`);const j=await fetch(`/api${r}`,{...c,headers:D,credentials:"same-origin"});let A=null;const W=await j.text();if(W)try{A=JSON.parse(W)}catch{A={error:W}}const le=Math.round((typeof performance<"u"?performance.now():Date.now())-P);if(!j.ok){let C=`Request failed (${j.status})`;throw A&&typeof A=="object"&&A!==null&&"error"in A&&typeof A.error=="string"?C=A.error:(j.status===500||j.status===504)&&(C="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),j.status>=500?M.error(`api ← ${k} ${r} ${j.status} (${le}ms)`,C):j.status!==401?M.warn(`api ← ${k} ${r} ${j.status} (${le}ms)`,C):(M.debug(`api ← ${k} ${r} 401 (${le}ms)`),jt(r,C)),new ke(C,j.status)}return M.info(`api ← ${k} ${r} ${j.status} (${le}ms)`),la(r),A}function Ae(r){return encodeURIComponent(r)}async function Ia(r,c,D,k){const P=new Headers({"Content-Type":D,Accept:"application/x-ndjson, application/json;q=0.9"});st&&P.set("X-CSRF-Token",st);const j=typeof performance<"u"?performance.now():Date.now();M.debug(`api → POST ${r} (stream, ${D}, ${c.length} bytes)`);let A;try{A=await fetch(`/api${r}`,{method:"POST",headers:P,credentials:"same-origin",body:c})}catch(_){const Y=_ instanceof Error?_.message:"Network error";throw M.error(`api ← POST ${r} network fail`,Y),new ke(`Import request failed to start (${Y}). Check connectivity and container logs.`,0)}const W=(A.headers.get("Content-Type")||"").toLowerCase(),le=W.includes("ndjson")||W.includes("x-ndjson");if(!A.ok&&!le){let _=`Request failed (${A.status})`;try{const Y=await A.json();Y.error&&(_=Y.error)}catch{}throw(A.status===504||A.status===502)&&(_="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),A.status===401?(M.debug(`api ← POST ${r} 401`,_),jt(r,_)):M.warn(`api ← POST ${r} ${A.status}`,_),new ke(_,A.status)}if(!le&&A.ok){try{const _=await A.json();if(_&&typeof _.error=="string")throw new ke(_.error,A.status||500);if(_&&typeof _.imported=="number"&&typeof _.updated=="number")return M.info(`api ← POST ${r} json done`),_}catch(_){if(_ instanceof ke)throw _}throw new ke("Unexpected import response from server",500)}if(!A.body)throw new ke("Import stream unavailable",500);const C=A.body.getReader(),Se=new TextDecoder;let H="";const z={final:null,error:null,sawProgress:!1},ue=_=>{let Y;try{Y=JSON.parse(_)}catch{M.debug("import stream non-JSON line",_.slice(0,80));return}if(Y.type==="progress"){z.sawProgress=!0;const Pe=Number(Y.total)||0,ve=Number(Y.current)||0,y=typeof Y.percent=="number"?Y.percent:Pe>0?Math.round(100*ve/Pe):0;k==null||k({percent:y,current:ve,total:Pe,imported:Number(Y.imported)||0,updated:Number(Y.updated)||0,skipped:Number(Y.skipped)||0})}else Y.type==="done"&&Y.result?z.final=Y.result:Y.type==="error"&&(z.error={message:Y.error||"Import failed",status:Y.status||500})};for(;;){const{done:_,value:Y}=await C.read();if(_)break;H+=Se.decode(Y,{stream:!0});const Pe=H.split(`
`);H=Pe.pop()??"";for(const ve of Pe){const y=ve.trim();y&&ue(y)}}H.trim()&&ue(H.trim());const me=Math.round((typeof performance<"u"?performance.now():Date.now())-j);if(z.error)throw z.error.status===401?(M.debug(`api ← POST ${r} stream 401 (${me}ms)`,z.error.message),jt(r,z.error.message)):M.warn(`api ← POST ${r} stream error (${me}ms)`,z.error.message),new ke(z.error.message,z.error.status);if(!z.final)throw M.error(`api ← POST ${r} stream incomplete (${me}ms)`,{sawProgress:z.sawProgress}),new ke(z.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return M.info(`api ← POST ${r} stream done (${me}ms)`),la(r),z.final}const I={ui:()=>R("/ui"),me:async()=>{var c;const r=await R("/me");return Bt(r.csrfToken||((c=r.user)==null?void 0:c.csrfToken)),r},login:async(r,c)=>{var k;const D=await R("/login",{method:"POST",body:JSON.stringify({username:r,password:c})});return Bt((k=D.user)==null?void 0:k.csrfToken),D},logout:async()=>{try{return await R("/logout",{method:"POST"})}finally{Bt("")}},calendars:()=>R("/calendars"),createCalendar:r=>R("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>R("/holidays/countries"),updateCalendar:(r,c)=>R(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:r=>R(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,c,D)=>{const k=new URLSearchParams({from:c,to:D}).toString();return R(`/calendars/${r}/events?${k}`)},getEvent:(r,c)=>R(`/calendars/${r}/events/${Ae(c)}`),createEvent:(r,c)=>R(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(r,c,D)=>R(`/calendars/${r}/events/${Ae(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteEvent:(r,c)=>R(`/calendars/${r}/events/${Ae(c)}`,{method:"DELETE"}),exportCalendar:async r=>{const c=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!c.ok){let A=`Export failed (${c.status})`;try{const W=await c.json();W.error&&(A=W.error)}catch{}throw new ke(A,c.status)}const D=c.headers.get("Content-Disposition")||"",k=/filename="([^"]+)"/i.exec(D),P=(k==null?void 0:k[1])||`calendar-${r}.ics`;return{blob:await c.blob(),filename:P}},importCalendar:(r,c,D)=>Ia(`/calendars/${r}/import`,c,"text/calendar; charset=utf-8",D),directory:()=>R("/directory"),shares:r=>R(`/calendars/${r}/shares`),share:(r,c,D)=>R(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:c,access:D})}),revoke:(r,c)=>R(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>R("/addressbooks"),createAddressBook:r=>R("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,c)=>R(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(r,c=!1)=>R(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async r=>{const c=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!c.ok){let A=`Export failed (${c.status})`;try{const W=await c.json();W.error&&(A=W.error)}catch{}throw new ke(A,c.status)}const D=c.headers.get("Content-Disposition")||"",k=/filename="([^"]+)"/i.exec(D),P=(k==null?void 0:k[1])||`contacts-${r}.vcf`;return{blob:await c.blob(),filename:P}},importAddressBook:(r,c,D)=>Ia(`/addressbooks/${r}/import`,c,"text/vcard; charset=utf-8",D),contacts:(r,c="")=>{const D=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return R(`/addressbooks/${r}/contacts${D}`)},getContact:(r,c)=>R(`/addressbooks/${r}/contacts/${Ae(c)}`),createContact:(r,c)=>R(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(r,c,D)=>R(`/addressbooks/${r}/contacts/${Ae(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteContact:(r,c)=>R(`/addressbooks/${r}/contacts/${Ae(c)}`,{method:"DELETE"}),exportContact:async(r,c)=>{const D=await fetch(`/api/addressbooks/${r}/contacts/${Ae(c)}/export`,{credentials:"same-origin"});if(!D.ok){let W=`Export failed (${D.status})`;try{const le=await D.json();le.error&&(W=le.error)}catch{}throw new ke(W,D.status)}const k=D.headers.get("Content-Disposition")||"",P=/filename="([^"]+)"/i.exec(k),j=(P==null?void 0:P[1])||"contact.vcf";return{blob:await D.blob(),filename:j}},contactPhotoUrl:(r,c)=>`/api/addressbooks/${r}/contacts/${Ae(c)}/photo`,tasks:(r={})=>{const c=new URLSearchParams;r.q&&c.set("q",r.q),r.sort&&c.set("sort",r.sort),r.order&&c.set("order",r.order);const D=c.toString()?`?${c}`:"";return R(`/tasks${D}`)},createTask:r=>R("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,c,D)=>R(`/tasks/${r}/${Ae(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteTask:(r,c)=>R(`/tasks/${r}/${Ae(c)}`,{method:"DELETE"}),bulkTasks:r=>R("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const c=new URLSearchParams;r.q&&c.set("q",r.q),r.sort&&c.set("sort",r.sort),r.order&&c.set("order",r.order);const D=c.toString()?`?${c}`:"";return R(`/notes${D}`)},createNote:r=>R("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,c,D)=>R(`/notes/${r}/${Ae(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteNote:(r,c)=>R(`/notes/${r}/${Ae(c)}`,{method:"DELETE"}),filesStatus:()=>R("/files"),filesList:(r="")=>{const c=new URLSearchParams;r&&c.set("path",r);const D=c.toString()?`?${c}`:"";return R(`/files/entries${D}`)},filesMkdir:(r,c)=>R("/files/mkdir",{method:"POST",body:JSON.stringify({path:r,name:c})}),filesUpload:async(r,c,D={})=>{const k=new URLSearchParams;r&&k.set("path",r),k.set("name",c.name),D.replace&&k.set("replace","1");const P=new Headers;st&&P.set("X-CSRF-Token",st);const j=new FormData;j.append("file",c,c.name),r&&j.append("path",r);const A=typeof performance<"u"?performance.now():Date.now();M.debug(`api → POST /files/upload path=${r||"/"} name=${c.name} size=${c.size}`);const W=await fetch(`/api/files/upload?${k}`,{method:"POST",headers:P,credentials:"same-origin",body:j}),le=await W.text();let C=null;if(le)try{C=JSON.parse(le)}catch{C={error:le}}const Se=Math.round((typeof performance<"u"?performance.now():Date.now())-A);if(!W.ok){let H=`Upload failed (${W.status})`;throw C&&typeof C=="object"&&C!==null&&"error"in C&&typeof C.error=="string"&&(H=C.error),W.status===401?(M.debug(`api ← POST /files/upload 401 (${Se}ms)`,H),jt("/files/upload",H)):W.status>=500?M.error(`api ← POST /files/upload ${W.status} (${Se}ms)`,H):M.warn(`api ← POST /files/upload ${W.status} (${Se}ms)`,H),new ke(H,W.status)}return M.info(`api ← POST /files/upload 200 (${Se}ms)`),la("/files/upload"),C},filesDownloadUrl:r=>{const c=new URLSearchParams;return c.set("path",r),`/api/files/download?${c}`},filesDelete:r=>R("/files/entry",{method:"DELETE",body:JSON.stringify({path:r})}),filesRename:(r,c)=>R("/files/rename",{method:"POST",body:JSON.stringify({path:r,newName:c})}),filesMove:(r,c,D)=>R("/files/move",{method:"POST",body:JSON.stringify({from:r,to:c,newName:D})}),filesCopy:(r,c={})=>R("/files/copy",{method:"POST",body:JSON.stringify({path:r,to:c.to,newName:c.newName})}),filesBulk:(r,c)=>R("/files/bulk",{method:"POST",body:JSON.stringify({op:r,paths:c})})},Ma="angaradav-portal-tab",Gn="1.0.10",Xn="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function ra(r){return r==="calendars"||r==="contacts"||r==="tasks"||r==="notes"||r==="files"||r==="admin"?r:null}function Qn(){const r=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0],c=ra(r);if(c)return c;try{const D=ra(sessionStorage.getItem(Ma));if(D)return D}catch{}return"calendars"}function qt(r){try{sessionStorage.setItem(Ma,r)}catch{}if(typeof history>"u"||typeof location>"u")return;const c=`#${r}`;location.hash!==c&&history.replaceState(null,"",`${location.pathname}${location.search}${c}`)}function d(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function na(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(r)}</span>`}function sa(r){const c=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&c.push(`${r.skipped} skipped`),c.join(", ")}const Zn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV. Open the classic Web Admin for users, system settings, and database configuration.","The Admin UI uses the separate admin password (not your DAV user password), unless you already have an admin session."]}};function ge(r,c,D="h2"){const k=D;return`<div class="section-title-row">
    <${k}>${d(r)}</${k}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(c)}"
      aria-label="About ${d(r)}" title="About ${d(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function es(){return`
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
    </div>`}function ts(r){let c=null,D=null,k=Qn(),P=!1,j=null,A=[],W=[],le=[],C=null,Se=[],H=!1,z=!1,ue=null,me=null,_={y:new Date().getFullYear(),m:new Date().getMonth()},Y=[],Pe=!1,ve=!1,y=null,Ie=!1,O=null,Dt="",mt=null,$e=[],F=null,Re=[],Ze="",Q=null,N=null,ne=!1,pe=!1,Ne=!1,be=null,Ce=null,Te=!1,m=!1,B=null,Ct=null,oa=!1,rt={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ue=null,ia=900,pt=null,ft=Gn,_t=!1,Et=!1;function Ht(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();rt={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},Yn(rt.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(ia=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(ft=e.version.trim())}function Wt(){pt!==null&&(clearTimeout(pt),pt=null)}function Yt(){if(Wt(),!c)return;const e=Math.max(30,ia)*1e3;pt=setTimeout(()=>{pt=null,da("Your session timed out. Please sign in again.")},e)}function Jt(){Wt(),Fe(),B=null,c=null,A=[],Se=[],C=null,W=[],$e=[],F=null,Re=[],Q=null,N=null,ne=!1,pe=!1,Ne=!1,z=!1,H=!1,ue=null,me=null,ve=!1,y=null,Ie=!1,Y=[],he=[],lt=[],He=[],We=[],we=null,Oe=null,V=null,X=null,K=!1,de=!1,oe=[],zt=null,Ee="",ye=[],it=!1,fe=null,ie=null,Z=null,ee=[],be=null,Ce=null,Te=!1,m=!1,P=!1,bt()}function Nt(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function bt(){j&&(document.removeEventListener("click",j,!0),j=null)}function Fa(){bt(),j=t=>{var l;const a=t.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(P=!1,bt(),u())};const e=j;setTimeout(()=>{P&&j===e&&document.addEventListener("click",e,!0)},0)}function ca(){k==="admin"&&!Nt()&&(k="calendars",qt(k))}async function qa(e,t={}){e==="admin"&&!Nt()&&(e="calendars"),k=e,P=!1,qt(e),M.event("tab",{tab:e}),e!=="calendars"&&(H=!1,ue=null),e!=="contacts"&&(me=null),t.clearFlash!==!1&&L(),m=!0,u();try{e==="contacts"&&F!==null?await ze(F):e==="calendars"?await Le():e==="tasks"?await Ke():e==="notes"?await ct():e==="files"&&await Be()}catch(a){M.warn("tab load failed",a instanceof Error?a.message:a),h("error",a instanceof Error?a.message:"Failed to load")}finally{m=!1,u()}}async function Be(){it=!0;try{M.debug("loadFiles",{path:Ee});const[e,t]=await Promise.all([I.filesStatus(),I.filesList(Ee).catch(a=>{if(a instanceof ke&&(a.status===503||a.status===404))return{path:Ee,entries:[]};throw a})]);if(zt=e,e.ready){Ee=t.path,ye=t.entries;const a=new Set(ye.map(l=>l.path));ee=ee.filter(l=>a.has(l))}else ye=[],ee=[];M.event("loadFiles",{path:Ee,count:ye.length,enabled:e.enabled,ready:e.ready})}finally{it=!1}}function da(e){if(!_t){if(!c){Wt();return}_t=!0;try{M.event("session.expired"),Jt(),Et=!0,D={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},u()}finally{_t=!1}}}let he=[],lt=[],He=[],We=[],Tt="",xt="",Ye="due",Ve="asc",ot="dtstart",et="desc",we=null,Oe=null,V=null,X=null,K=!1,de=!1,oe=[],zt=null,Ee="",ye=[],it=!1,fe=null,ie=null,Z=null,ee=[];function h(e,t){Et&&e==="error"||(e!=="error"&&(Et=!1),D={type:e,message:t})}function L(){D=null,Et=!1}async function Ra(){M.event("bootstrap.start"),zn(e=>{da(/timed\s*out|session expired/i.test(e)?e:"Your session timed out. Please sign in again.")}),Kn(()=>{Yt()});try{const e=await I.ui();Ht(e.ui),typeof e.version=="string"&&e.version.trim()!==""?ft=e.version.trim():e.ui&&typeof e.ui.version=="string"&&e.ui.version.trim()!==""&&(ft=e.ui.version.trim())}catch(e){M.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await I.me();c=e.user,Ht(e.ui),typeof e.version=="string"&&e.version.trim()!==""&&(ft=e.version.trim()),M.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),Yt(),ca(),qt(k),await xe()}catch(e){e instanceof ke&&e.status===401?(Jt(),/timed\s*out|session expired/i.test(e.message)&&h("info",e.message),M.event("bootstrap.anonymous")):(M.error("bootstrap failed",e instanceof Error?e.message:e),h("error",e instanceof Error?e.message:"Failed to load"))}u()}async function xe(){M.debug("loadHome");const[e,t,a]=await Promise.all([I.calendars(),I.directory().catch(()=>({users:[]})),I.addressbooks()]);if(A=e.calendars,W=t.users,$e=a.addressbooks,M.event("loadHome",{calendars:A.length,addressBooks:$e.length,directory:W.length}),le.length===0)try{le=(await I.holidayCountries()).countries}catch{le=[]}if(C!==null&&!A.some(l=>l.id===C)&&(C=null,Se=[],H=!1,ue=null),C===null){const l=ua();l&&(C=l.id)}C!==null&&H?await ht(C):C!==null&&(Se=[]),k==="calendars"&&await Le(),F!==null&&!$e.some(l=>l.id===F)&&(F=null,Re=[],Q=null,N=null,ne=!1),me!==null&&!$e.some(l=>l.id===me)&&(me=null),F===null&&$e.length>0&&(F=$e[0].id),F!==null&&k==="contacts"&&await ze(F),k==="tasks"&&await Ke(),k==="notes"&&await ct(),k==="files"&&await Be()}async function ht(e){Se=(await I.shares(e)).shares}function ua(){const e=A.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function se(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${l}`}function Ua(e,t){const a=new Date(e,t,1),l=new Date(e,t+1,0);return{from:se(a),to:se(l)}}function Kt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,l,o]=e.split("-").map(Number);return new Date(a,l-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,l,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Ba(e){const t=Kt(e.start);if(!e.end)return[se(t)];let a=Kt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const s=new Date(e.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[se(t)];const l=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(se(o)),o.setDate(o.getDate()+1);return l.length?l:[se(t)]}function Gt(e,t){const a=e.slice(0,10),l=(t||a).slice(0,10);if(a===l){const v=gt(a);return{start:v.start,end:v.end}}const[o,p,n]=a.split("-").map(Number),[s,i,f]=l.split("-").map(Number),b=Je(new Date(o,p-1,n,9,0,0,0)),g=Je(new Date(s,i-1,f,17,0,0,0));return{start:b,end:g}}function Va(e,t){const a=tt(e);let l=t?tt(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const p=Kt(t);p.setDate(p.getDate()-1),l=se(p)}}return{start:a,end:l}}async function Le(){if(C===null){Y=[];return}const{from:e,to:t}=Ua(_.y,_.m);Pe=!0,M.debug("loadMonthEvents",{selectedId:C,from:e,to:t});try{Y=(await I.calendarEvents(C,e,t)).events,M.event("monthEvents.loaded",{calendarId:C,count:Y.length,from:e,to:t})}catch(a){Y=[],M.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Pe=!1}}function ja(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function _a(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Xt())} ${t}`}function Ha(){const e=C!==null?A.find(T=>T.id===C):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",l=_.y,o=_.m,p=new Date(l,o,1),n=Qt(),s=(p.getDay()-n+7)%7,i=new Date(l,o+1,0).getDate(),f=new Date(l,o,0).getDate(),g=se(new Date),v=ma(),E=new Map;for(const T of Y)for(const J of Ba(T)){const $=E.get(J)??[];$.push(T),E.set(J,$)}const w=[],x=Math.ceil((s+i)/7)*7;for(let T=0;T<x;T++){let J,$=!0,U;T<s?(J=f-s+T+1,$=!1,U=new Date(l,o-1,J)):T>=s+i?(J=T-(s+i)+1,$=!1,U=new Date(l,o+1,J)):(J=T-s+1,U=new Date(l,o,J));const q=se(U),ce=q===g,ae=$?E.get(q)??[]:[],De=mt===q?50:3,je=ae.slice(0,De),Lt=ae.length-je.length,_e=je.map(wt=>{const aa=C??0,Pt=_a(wt);return`<button type="button" class="month-event${wt.allDay?"":" is-timed"}" title="${d(Pt)}" style="--ev-color:${d(a)}"
            data-action="open-event" data-instance="${aa}" data-uri="${d(wt.uri)}" ${m?"disabled":""}>${d(Pt)}</button>`}).join(""),ea=Lt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(q)}" title="Show all events this day" ${m?"disabled":""}>+${Lt} more</button>`:"",ta=!$&&(J===1||T===s+i)?U.toLocaleString(void 0,{month:"short",day:"numeric"}):String(J),Mt=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));w.push(`<div class="month-cell${$?"":" is-outside"}${ce?" is-today":""}${Mt?" is-clickable":""}"${Mt?` data-action="new-event-day" data-day="${d(q)}" role="button" tabindex="0" title="Add event on ${d(q)}"`:""}>
        <div class="month-daynum${ce?" is-today-num":""}">${d(ta)}</div>
        <div class="month-events">${_e}${ea}</div>
      </div>`)}const G=e?Pe?'<p class="muted small month-empty-hint">Loading events…</p>':"":A.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${m?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${m?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${m?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${d(ja(l,o))}</h2>
        <span class="month-cal-name muted small" title="${d(t)}">
          <span class="cal-swatch" style="background:${d(a)};margin-top:0"></span>
          ${d(t)}
        </span>
      </div>
      ${G}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${v.map(T=>`<div class="month-dow">${d(T)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${w.join("")}
        </div>
      </div>
    </section>`}function tt(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):se(t)}function Wa(){if(rt.timeFormat==="24h")return!1;if(rt.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Xt(){return Wa()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Qt(){var a;if(rt.weekStart==="monday")return 1;if(rt.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of e)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function ma(){const e=Qt(),t=new Date(2024,0,7+e),a=[];for(let l=0;l<7;l++){const o=new Date(t);o.setDate(t.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function pa(e,t=15){const a=t*60*1e3,l=e.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function Je(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Ya(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const l=e.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Xt()})}function yt(e){if(!e){const a=pa(new Date);return{date:se(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:se(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function gt(e){const t=new Date,a=se(t);if(e&&e!==a){const[p,n,s]=e.split("-").map(Number),i=new Date(p,n-1,s,9,0,0,0),f=new Date(p,n-1,s,10,0,0,0);return{start:Je(i),end:Je(f)}}const l=pa(t,15),o=new Date(l.getTime()+3600*1e3);return{start:Je(l),end:Je(o)}}function Ja(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function at(e){const{field:t,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:s,allowClear:i=!0}=e,f=(O==null?void 0:O.field)===t,b=Ya(o,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${d(t)}">
      <span class="dt-field-label">${d(l)}</span>
      <input type="hidden" name="${d(a)}" value="${d(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(t)}"
        data-dt-name="${d(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${d(b)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!s?za(t,o,p,i):""}
    </div>`}function Zt(e){var t;return e==="start"?String((y==null?void 0:y.start)||""):e==="end"?String((y==null?void 0:y.end)||""):e==="until"?((t=y==null?void 0:y.repeat)==null?void 0:t.until)||tt(y==null?void 0:y.start)||se(new Date):e==="due"?dt(V==null?void 0:V.due):e==="dtstart"?dt(X==null?void 0:X.dtstart):e==="bulk-due"?Dt:e==="birthday"?String((N==null?void 0:N.birthday)||""):""}function Me(e,t){if(e==="start"&&y){y={...y,start:t||""};return}if(e==="end"&&y){y={...y,end:t};return}if(e==="until"&&y){y={...y,repeat:{...y.repeat??At(),until:t,endMode:"until"}};return}if(e==="due"&&V){if(t===null||t==="")V={...V,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))V={...V,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));V={...V,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&X){if(t===null||t==="")X={...X,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))X={...X,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));X={...X,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&N){N={...N,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Dt=t||"")}function za(e,t,a,l){const o=yt(t),p=(O==null?void 0:O.viewY)??Number(o.date.slice(0,4)),n=(O==null?void 0:O.viewM)??Number(o.date.slice(5,7))-1,s=Qt(),i=ma(),b=(new Date(p,n,1).getDay()-s+7)%7,g=new Date(p,n+1,0).getDate(),v=new Date(p,n,0).getDate(),E=o.date,w=o.hm,x=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),G=[],T=Math.ceil((b+g)/7)*7;for(let $=0;$<T;$++){let U,q,ce=!1;$<b?(U=v-b+$+1,q=new Date(p,n-1,U),ce=!0):$>=b+g?(U=$-(b+g)+1,q=new Date(p,n+1,U),ce=!0):(U=$-b+1,q=new Date(p,n,U));const ae=se(q),De=ae===E,je=ae===se(new Date);G.push(`<button type="button" class="dt-day${ce?" is-outside":""}${De?" is-selected":""}${je?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${d(ae)}">${U}</button>`)}const J=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Ja().map($=>{const U=(()=>{const[q,ce]=$.split(":").map(Number);return new Date(2e3,0,1,q,ce).toLocaleTimeString(void 0,Xt())})();return`<button type="button" class="dt-time${$===w?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${$}" role="option" aria-selected="${$===w}">${d(U)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${d(x)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map($=>`<span class="dt-dow">${d($)}</span>`).join("")}</div>
          <div class="dt-days">${G.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(e)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${J}
      </div>
    </div>`}function Ka(){r.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const l=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let s=l.bottom+6;s+n>window.innerHeight-o&&(s=Math.max(o,l.top-n-6));let i=l.left;i+p>window.innerWidth-o&&(i=Math.max(o,window.innerWidth-p-o)),i<o&&(i=o),a.style.top=`${Math.round(s)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function At(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Ga(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Xa(){if(!ve||!y)return"";const e=y,t=e.repeat??At(),a=(t.freq||"").toUpperCase(),l=A.filter(E=>E.canShare||E.access==="readwrite"),o=A.filter(E=>E.id===e.instanceId?!0:E.readOnly?!1:E.canShare||E.access==="readwrite").map(E=>`<option value="${E.id}" ${E.id===e.instanceId?"selected":""}>${d(E.displayname)}</option>`).join(""),p=e.readOnly||!e.canWrite;let n,s;if(e.allDay)n=tt(e.start),s=tt(e.end);else{const E=e.start||"",w=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(E)){const x=Gt(E,w||null);n=x.start,s=x.end||""}else n=dt(e.start),s=dt(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(E=>E.toUpperCase())),b=Ga(t),g=!!a&&b==="until",v=t.until||(b==="until"?tt(e.start)||se(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${Ie?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Xe()}
          ${!Ie&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
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
              ${at({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:p,allowClear:!1})}
              ${at({field:"end",name:"end",label:"End",value:s,dateOnly:e.allDay,disabled:p||g,allowClear:!g})}
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
                      ${i.map(E=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${E.code}" ${f.has(E.code)?"checked":""} />
                              ${E.label}
                            </label>`).join("")}
                    </div>`:""}
              ${a?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${b==="never"?"selected":""}>Never</option>
                          <option value="until" ${b==="until"?"selected":""}>On date</option>
                          <option value="count" ${b==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${b==="until"?at({field:"until",name:"repeatUntil",label:"Until",value:v,dateOnly:!0,disabled:p,allowClear:!0}):b==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${d(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${Ie?"Create event":"Save event"}</button>
                     ${Ie?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${m?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Qa(e,t){const a=A.find(l=>l.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:At(),readOnly:!1,canWrite:!0}}async function ze(e){Re=(await I.contacts(e,Ze)).contacts,Q!==null&&!Re.some(a=>a.uri===Q)&&(Q=null,ne||(N=null,be=null,Ce=null,Te=!1))}async function Ke(){const e=await I.tasks({q:Tt,sort:Ye,order:Ve});he=e.tasks,He=e.calendars;const t=new Set(he.map(a=>te(a.instanceId,a.uri)));oe=oe.filter(a=>t.has(a)),we!==null&&!he.some(a=>`${a.instanceId}|${a.uri}`===we)&&(we=null,K||(V=null))}async function ct(){const e=await I.notes({q:xt,sort:ot,order:et});lt=e.notes,We=e.calendars,Oe!==null&&!lt.some(t=>`${t.instanceId}|${t.uri}`===Oe)&&(Oe=null,de||(X=null))}function te(e,t){return`${e}|${t}`}function fa(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function dt(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Ge(e,t,a,l,o,p=""){const n=a===t,s=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${s}</th>`}async function Za(e){if(F===null)return;const t=await I.getContact(F,e);Q=e,ne=!1;const a=t.contact;N={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??ba(),birthday:a.birthday??null},be=a.photoDataUri??(a.hasPhoto&&F!==null?`${I.contactPhotoUrl(F,e)}?t=${Date.now()}`:null),Ce=null,Te=!1,pe=!0}function en(){ne=!0,Q=null,pe=!0,N={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},be=null,Ce=null,Te=!1}function ba(){return{street:"",city:"",region:"",postal:"",country:""}}function tn(e){return new Promise((t,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");t(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(e)})}function ha(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>AngaraDAV User Portal</span>`,l=c?d(c.displayname||c.username):"",o=Nt()?`<button type="button" class="user-menu-item${k==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",p=c?`<div class="user-menu${P?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${P?"true":"false"}"
              title="${l}">
              <span class="user-menu-name">${l}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${P?"":"hidden"}>
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
        </nav>`,i=!(H||z||ue!==null||me!==null||ve||pe||Ne)?Xe():"",f=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${d(ft)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(Xn)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${n}
      <main class="container">
        ${i}
        ${e}
      </main>
      ${f}
      ${es()}
      ${an()}`}function Xe(){return D?`<div class="flash flash-${d(D.type)}" role="status">
      <span class="flash-text">${d(D.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function ya(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function ut(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),l=t%60;return a>0?`${a}m ${l}s`:`${l}s`}function Fe(){Ct!==null&&(clearInterval(Ct),Ct=null)}function ga(){Fe(),Ct=setInterval(()=>{if(!B||B.phase==="done"||B.phase==="error"){Fe();return}B={...B,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},B.phase==="processing"&&wa(B)},1e3)}function Qe(e,t={}){B&&(B={...B,phase:e,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3),...t},u())}function va(){Fe(),B=null,u()}function $a(e){!B||B.phase==="done"||B.phase==="error"||(B={...B,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-B.startedAt)/1e3)},wa(B))}function wa(e){const t=r.querySelector("[data-import-status-line]"),a=r.querySelector(".import-progress-bar"),l=r.querySelector(".import-progress-track"),o=r.querySelector("[data-import-counts]"),p=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${p} (${e.processPercent??0}%) · ${ut(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${ut(e.elapsedSec)}`;else return;t&&(t.textContent=n),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),l&&e.processPercent!==null&&(l.setAttribute("aria-valuenow",String(e.processPercent)),l.removeAttribute("aria-valuetext"))}function an(){if(!B)return"";const e=B,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const s=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return s.map((b,g)=>{let v="pending";return e.phase==="done"||g<f?v="done":g===f&&(v=(e.phase==="error","active")),`<li class="import-step import-step-${v}"><span class="import-step-icon" aria-hidden="true">${v==="done"?"✓":v==="active"?"●":"○"}</span> ${d(b.label)}</li>`}).join("")})();let p="";if(t){let s=null;e.phase==="reading"&&e.readPercent!==null?s=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(s=Math.min(100,Math.max(0,e.processPercent)));const i=s===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=s!==null?` style="width:${s}%"`:"",b=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${b} (${e.processPercent??0}%) · ${ut(e.elapsedSec)}`:g=`Importing on server… ${ut(e.elapsedSec)}`;const v=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
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
          <div class="${i}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${d(g)}</p>
        ${v}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?p=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${d(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · Took ${d(ut(e.elapsedSec))}
        </p>`:p=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${d(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · After ${d(ut(e.elapsedSec))}
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
      </div>`}function ka(e,t){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?t(Math.min(100,Math.round(p.loaded/p.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(e)})}function Sa(){r.innerHTML=ha(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function nn(){if(!c){Sa();return}const e=A.filter(S=>S.canShare),t=A.filter(S=>!S.canShare),a=A.find(S=>S.id===C)??null,l=e.map(S=>{const re=S.id===C?" is-selected":"",qe=S.color?`<span class="cal-swatch" style="background:${d(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',kt=na(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${d(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${re}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0">
          ${qe}
          <span class="cal-row-text">
            <span class="cal-row-title">${d(S.displayname)}</span>
            <span class="cal-row-badges">${kt}</span>
            <span class="muted small mono cal-row-uri">${d(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map(S=>{const re=S.id===C?" is-selected":"",qe=S.color?`<span class="cal-swatch" style="background:${d(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',kt=S.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${re}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${d(kt)}">
          ${qe}
          <span class="cal-row-text">
            <span class="cal-row-title">${d(S.displayname)}</span>
            <span class="cal-row-badges">${na(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=W.map(S=>`<option value="${d(S.username)}">${d(S.displayname)} (${d(S.username)})</option>`).join(""),n=Se.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':Se.map(S=>`<tr>
                <td>
                  <strong>${d(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${d(S.username||S.href)}</div>
                </td>
                <td>${na(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d(S.href)}" ${m?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),f=H&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Xe()}
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
                  ${ge(`Share “${a.displayname}”`,"share")}
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
                  ${ge("Import / export","import-export")}
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
          </div>`:"",b=ue!==null?A.find(S=>S.id===ue&&S.canShare)??null:null,g=b?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Xe()}
              <p>You are about to permanently delete <strong>${d(b.displayname)}</strong>
                <span class="muted small mono">(${d(b.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${b.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",v=z?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Xe()}
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
                    ${le.map(S=>`<option value="${d(S.code)}">${d(S.name)} (${d(S.code)})</option>`).join("")}
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
        </div>`:"",E=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ge("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${ge("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${m?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Ha()}
      </div>
      ${v}
      ${f}
      ${g}
      ${Xa()}`,w=$e.map(S=>`<div class="cal-row${S.id===F?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${d(S.displayname)}</span>
            <span class="muted small">${S.cardCount} contact${S.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${d(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${S.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${S.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),x=$e.find(S=>S.id===F)??null,G=Re.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Ze?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Re.map(S=>{const re=!ne&&S.uri===Q?" is-selected":"",qe=d((S.displayname||"?").slice(0,1).toUpperCase()),kt=S.hasPhoto&&F!==null?`<img class="contact-avatar" src="${d(I.contactPhotoUrl(F,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${qe}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${qe}</span>`;return`<tr class="contact-table-row${re}" data-action="select-contact" data-uri="${d(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${kt}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${d(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${d(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${d(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${d(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${d(S.org||"—")}</span></td>
              </tr>`}).join(""),T=N,J=Array.isArray(T==null?void 0:T.emails)&&T.emails.length>0?T.emails:[""],$=Array.isArray(T==null?void 0:T.phones)&&T.phones.length>0?T.phones:[{type:"cell",value:""}],U=(T==null?void 0:T.address)??ba(),q=J.map((S,re)=>`<div class="multi-row" data-multi="email" data-idx="${re}">
          <input type="email" name="email_${re}" value="${d(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${re}" ${J.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ce=$.map((S,re)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${re}">
          <select name="phone_type_${re}" aria-label="Phone type">
            ${["cell","work","home","other"].map(qe=>`<option value="${qe}" ${((S==null?void 0:S.type)??"other")===qe?"selected":""}>${qe}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${re}" value="${d((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${re}" ${$.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ae=Array.isArray(T==null?void 0:T.custom)?T.custom:[],De=ae.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ae.map((S,re)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${re}">
                <input type="text" name="custom_label_${re}" value="${d(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${re}" value="${d(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${re}" title="Remove">×</button>
              </div>`).join(""),je=pe&&T&&x?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${ne?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Xe()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${be?`<img src="${d(be)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${d((T.fullname||T.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        ${be?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${m?"disabled":""} hidden />
                      </label>
                      ${be||T.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${m?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${d(T.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${d(T.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${d(T.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${d(T.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${d(T.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${q}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${J.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${ce}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${$.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${d(U.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${d(U.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${d(U.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${d(U.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${d(U.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${d(T.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${at({field:"birthday",name:"birthday",label:"Birthday",value:T.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${De}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ae.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${d(T.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>${ne?"Create contact":"Save contact"}</button>
                    ${!ne&&T.uri?`<button type="button" class="btn" data-action="export-contact" ${m?"disabled":""}>Export .vcf</button>`:""}
                    ${ne?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${m?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${m?"disabled":""}>Cancel</button>
                    ${!ne&&T.uri?`<span class="muted small mono">${d(T.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",Lt=Ne&&x?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Xe()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${d(x.uri)} · ${x.cardCount} contact${x.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${d(x.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${d(x.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${d(x.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ge("Import / export","contact-import-export")}
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
          </div>`:"",_e=me!==null?$e.find(S=>S.id===me)??null:null,ea=_e?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Xe()}
              <p>You are about to permanently delete <strong>${d(_e.displayname)}</strong>
                <span class="muted small mono">(${d(_e.uri)})</span>.</p>
              <p class="muted small">${(_e.cardCount??0)>0?`All ${_e.cardCount} contact${_e.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${_e.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",ta=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ge("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${w||'<p class="muted">No address books yet. Create one below.</p>'}
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
          ${x?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${ge("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${d(Ze)}" aria-label="Search contacts" ${m?"disabled":""} />
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
                        ${G}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${ea}
      ${Lt}
      ${je}`,Mt=k==="calendars"?"my-calendars":k==="contacts"?"my-contacts":k==="tasks"?"tasks":k==="notes"?"notes":k==="files"?"files":"administration",wt=mn(),aa=pn(),Pt=ln(),Bn=on(),Vn=k==="calendars"?E:k==="contacts"?ta:k==="tasks"?wt:k==="notes"?aa:k==="files"?Pt:Bn,jn=k!=="admin"?`<header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${k==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${k==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${k==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${k==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${k==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${k==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${k==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${k==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${k==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${k==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${Mt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>`:`<header class="page-header page-header-admin">
        ${ge("Administration","administration","h1")}
        <button type="button" class="btn btn-ghost btn-small" data-action="tab" data-tab="calendars"
          title="Back to portal">← Portal</button>
      </header>`;r.innerHTML=ha(`
      ${jn}

      ${Vn}
    `),document.body.classList.toggle("cal-modal-open",H||z||ue!==null||me!==null||ve||pe||Ne||B!==null||fe!==null||ie!==null||Z!==null),document.body.classList.toggle("layout-contacts",k==="contacts"),document.body.classList.toggle("layout-calendars",k==="calendars"),document.body.classList.toggle("layout-tasks",k==="tasks"||k==="notes"),document.body.classList.toggle("layout-files",k==="files"),document.body.classList.toggle("layout-admin",k==="admin")}function sn(e){const t=e?e.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${m?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(p)}" ${m?"disabled":""}>${d(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function nt(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Da(e){if(!Number.isFinite(e)||e<0)return"—";if(e===0)return"unlimited";const t=Math.round(e/(1024*1024));if(t<=0)return nt(e);if(t>=1024&&t%1024===0){const a=t/1024;return a===1?"1 GB":`${a} GB`}return`${t} MB`}function rn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function ln(){const e=zt;if(!e)return`<div class="card"><p class="muted">${it||m?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ge("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ge("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${d(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${d(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${nt(e.usedBytes)} used · ${nt(e.availableBytes)} free of ${nt(e.quotaBytes)}`:`${nt(e.usedBytes)} used · ${nt(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,l=ee.length,o=ye.length>0&&ye.every(v=>ee.includes(v.path)),p=l>0,n=l>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${l} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${m?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${m?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${m?"disabled":""}>Delete</button>
            </div>
          </div>`:"",s=ye.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':ye.map(v=>{const E=ee.includes(v.path),w=v.type==="dir"?"📁":"📄",x=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(v.path)}" ${m?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${w}</span>${d(v.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${w}</span>${d(v.name)}</span>`,G=v.type==="dir"?"—":nt(v.size);return`<tr class="files-row${E?" is-checked":""}" data-path="${d(v.path)}" data-type="${v.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${d(v.path)}"
                    ${E?"checked":""} ${m?"disabled":""}
                    aria-label="Select ${d(v.name)}" />
                </td>
                <td class="files-col-name">${x}</td>
                <td class="files-col-size mono">${G}</td>
                <td class="files-col-mtime hide-sm">${d(rn(v.mtime))}</td>
                <td class="files-col-actions">
                  ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${d(I.filesDownloadUrl(v.path))}" download="${d(v.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${d(v.path)}" ${m?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${d(v.path)}" ${m?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${m?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${m?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),i=fe!==null?(()=>{const v=ye.find(w=>w.path===fe),E=(v==null?void 0:v.name)??"";return`<div class="cal-modal" id="files-rename-modal" role="dialog" aria-modal="true" aria-labelledby="files-rename-title">
              <div class="cal-modal-backdrop" data-action="files-rename-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-rename-title">Rename</h3>
                  <button type="button" class="info-modal-close" data-action="files-rename-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-rename" id="files-rename-form">
                  <div class="cal-modal-body">
                    <input type="hidden" name="path" value="${d(fe)}" />
                    <label>New name
                      <input type="text" name="newName" value="${d(E)}" required maxlength="255" autocomplete="off" />
                    </label>
                  </div>
                  <footer class="cal-modal-footer">
                    <button type="button" class="btn btn-ghost" data-action="files-rename-close">Cancel</button>
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Rename</button>
                  </footer>
                </form>
              </div>
            </div>`})():"",f=ie!==null&&ie.length>0?(()=>{const v=ie,E=v.length>1,w=ye.find(T=>T.path===v[0]),x=E?`Delete ${v.length} items`:`Delete ${(w==null?void 0:w.type)==="dir"?"folder":"file"}`,G=E?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${v.slice(0,12).map(T=>{const J=ye.find($=>$.path===T);return`<li><span class="mono">${d((J==null?void 0:J.name)??T)}</span></li>`}).join("")}
                   ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${d((w==null?void 0:w.name)??v[0])}</strong>?${(w==null?void 0:w.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return`<div class="cal-modal" id="files-delete-modal" role="dialog" aria-modal="true" aria-labelledby="files-delete-title">
              <div class="cal-modal-backdrop" data-action="files-delete-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-delete-title">${d(x)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-delete-close" aria-label="Close">×</button>
                </header>
                <div class="cal-modal-body">
                  ${G}
                </div>
                <footer class="cal-modal-footer">
                  <button type="button" class="btn btn-ghost" data-action="files-delete-close">Cancel</button>
                  <button type="button" class="btn btn-danger" data-action="files-delete-confirm" ${m?"disabled":""}>Delete</button>
                </footer>
              </div>
            </div>`})():"",b=Z!==null&&Z.paths.length>0?(()=>{const v=Z.op,E=Z.paths,w=E.length>1,x=ye.find($=>$.path===E[0]),G=(x==null?void 0:x.name)??It(E[0]),T=w?`${v==="copy"?"Copy":"Move"} ${E.length} items`:`${v==="copy"?"Copy":"Move"} ${(x==null?void 0:x.type)==="dir"?"folder":"file"}`,J=Ee;return`<div class="cal-modal" id="files-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="files-transfer-title">
              <div class="cal-modal-backdrop" data-action="files-transfer-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-transfer-title">${d(T)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-transfer-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-transfer">
                  <div class="cal-modal-body">
                    ${w?`<p class="muted small" style="margin:0 0 0.75rem">${E.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${d(G)}</span></p>`}
                    <label>Destination folder
                      <input type="text" name="toPath" value="${d(J)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${w?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${d(G)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${v==="copy"?"Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination).":"Leave as-is to keep the current name."}
                          </p>`}
                  </div>
                  <footer class="cal-modal-footer">
                    <button type="button" class="btn btn-ghost" data-action="files-transfer-close">Cancel</button>
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>${v==="copy"?"Copy":"Move"}</button>
                  </footer>
                </form>
              </div>
            </div>`})():"",g=[`DAV clients: <span class="mono">${d(e.davPath)}</span>`,`max upload ${d(Da(e.maxUploadBytes))}`,e.quotaBytes>0?`quota ${d(Da(e.quotaBytes))}`:"quota unlimited"].join(" · ");return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${ge("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${d(t)}</span>
          </div>
        </div>
        <p class="muted small" style="margin:0.5rem 0 0">
          ${g}
        </p>
        <div class="files-toolbar">
          ${sn(Ee)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${m||it?"disabled":""}>Refresh</button>
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
                <th class="files-col-check">
                  <input type="checkbox" data-action="files-select-all"
                    ${o?"checked":""}
                    ${p&&!o?"data-indeterminate=1":""}
                    ${m||ye.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${it&&ye.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':s}
            </tbody>
          </table>
        </div>
      </section>
      ${i}
      ${f}
      ${b}
    </div>`}function It(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function on(){return Nt()?`<div class="portal-grid portal-grid-admin">
      <section class="card admin-section">
        ${ge("Server administration","administration")}
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
    </div>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function cn(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,b)=>[te(f.instanceId,f.uri),b])),l=new Map,o=[];for(const f of e){const b=f.parentUid;if(b&&t.has(b)&&b!==f.uid){const g=l.get(b)??[];g.push(f),l.set(b,g)}else o.push(f)}const p=(f,b)=>(a.get(te(f.instanceId,f.uri))??0)-(a.get(te(b.instanceId,b.uri))??0);o.sort(p);for(const[,f]of l)f.sort(p);const n=[],s=new Set,i=(f,b)=>{const g=f.uid||te(f.instanceId,f.uri);if(!s.has(g)){s.add(g),n.push({task:f,depth:Math.min(b,8)});for(const v of l.get(f.uid)??[])i(v,b+1);s.delete(g)}};for(const f of o)i(f,0);for(const f of e)n.some(b=>b.task===f)||n.push({task:f,depth:0});return n}function dn(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const l of he)l.parentUid&&t.has(l.parentUid)&&l.uid&&!t.has(l.uid)&&(t.add(l.uid),a=!0)}return t}function un(e,t){const a=e.instanceId,l=t||!e.uid?new Set:dn(e.uid),o=he.filter(s=>s.uid&&s.instanceId===a&&!l.has(s.uid)&&s.uid!==e.uid),p=e.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(s=>`<option value="${d(s.uid)}" ${s.uid===p?"selected":""}>${d(s.summary||s.uid)}</option>`)];if(p&&!o.some(s=>s.uid===p)){const s=he.find(i=>i.uid===p);n.push(`<option value="${d(p)}" selected>${d((s==null?void 0:s.summary)||p)} (current)</option>`)}return n.join("")}function Ca(){const e=new Set(oe);return he.filter(t=>e.has(te(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function mn(){const e=w=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[w]||w,t=cn(he),a=he.filter(w=>w.canWrite&&!w.readOnly).map(w=>te(w.instanceId,w.uri)),l=a.length>0&&a.every(w=>oe.includes(w)),o=oe.length>0,n=Ca().length,s=he.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Tt?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:w,depth:x})=>{const G=te(w.instanceId,w.uri),T=!K&&G===we?" is-selected":"",J=oe.includes(G),$=w.status==="COMPLETED"?"badge-ok":w.status==="CANCELLED"?"":"badge-admin",U=x>0?` style="--task-depth:${x}"`:"",q=x>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",ce=w.canWrite&&!w.readOnly;return`<tr class="contact-table-row task-row${x>0?" is-subtask":""}${T}${J?" is-checked":""}" data-action="select-task" data-instance="${w.instanceId}" data-uri="${d(w.uri)}" tabindex="0" role="button"${U}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${w.instanceId}" data-uri="${d(w.uri)}"
                    ${J?"checked":""} ${ce?"":"disabled"} aria-label="Select ${d(w.summary||w.uri)}" ${m?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${q}<span class="contact-name-primary">${d(w.summary||w.uri)}</span></span>
                  ${w.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${$}">${d(e(w.status))}</span></td>
                <td class="col-task-due muted small">${d(fa(w.due))}</td>
                <td class="col-task-cal muted small">${d(w.calendarName)}</td>
                <td class="col-task-pct muted small">${w.percent?d(String(w.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(w,x)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${w}"
        title="${d(x)}" aria-label="${d(x)}" ${m||n===0?"disabled":""}>${i}</button>`,b=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${oe.length!==n?`<span class="muted small bulk-bar-count-extra">(${oe.length-n} read-only skipped)</span>`:""}
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
                ${at({field:"bulk-due",name:"bulkDue",label:"Due",value:Dt,dateOnly:!1,disabled:m||n===0,allowClear:!0})}
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
          </div>`:"",g=V,v=He.map(w=>`<option value="${w.id}" ${g&&g.instanceId===w.id?"selected":""}>${d(w.displayname)}</option>`).join(""),E=g?`<div class="card">
            ${ge(K?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${K?`<label>Calendar
                      <select name="instanceId" required ${He.length===0?"disabled":""}>
                        <option value="">${He.length?"Select calendar…":"No writable calendars"}</option>
                        ${v}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(g.summary)}" ${g.readOnly&&!K?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!K?"readonly":""}>${d(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!K?"disabled":""}>
                  ${un(g,K)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!K?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(w=>`<option value="${w}" ${g.status===w?"selected":""}>${d(e(w))}</option>`).join("")}
                  </select>
                </label>
                ${at({field:"due",name:"due",label:"Due",value:dt(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!K),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${d(String(g.priority||0))}" ${g.readOnly&&!K?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${d(String(g.percent||0))}" ${g.readOnly&&!K?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${K||g.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${K?"Create task":"Save task"}</button>`:""}
                ${!K&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${m?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${m?"disabled":""}>Delete</button>`:K?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ge("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${d(Tt)}" aria-label="Search tasks" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${m||He.length===0?"disabled":""}>Add task</button>
        </div>
        ${b}
        ${He.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||m?"disabled":""} />
                </th>
                ${Ge("Title","summary",Ye,Ve,"task","col-task-title")}
                ${Ge("Status","status",Ye,Ve,"task","col-task-status")}
                ${Ge("Due","due",Ye,Ve,"task","col-task-due")}
                ${Ge("Calendar","calendar",Ye,Ve,"task","col-task-cal")}
                ${Ge("%","percent",Ye,Ve,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${E}
      </section>
    </div>`}function pn(){const e=lt.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${xt?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:lt.map(o=>{const p=te(o.instanceId,o.uri),n=!de&&p===Oe?" is-selected":"",s=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${d(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${d(o.summary||o.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${d(s)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${d(fa(o.dtstart))}</td>
                <td class="col-note-cal muted small">${d(o.calendarName)}</td>
              </tr>`}).join(""),t=X,a=We.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${d(o.displayname)}</option>`).join(""),l=t?`<div class="card">
            ${ge(de?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${de?`<label>Calendar
                      <select name="instanceId" required ${We.length===0?"disabled":""}>
                        <option value="">${We.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(t.summary)}" ${t.readOnly&&!de?"readonly":""} />
              </label>
              ${at({field:"dtstart",name:"dtstart",label:"Date",value:dt(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!de),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!de?"readonly":""}>${d(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${de||t.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${de?"Create note":"Save note"}</button>`:""}
                ${!de&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${m?"disabled":""}>Delete</button>`:de?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ge("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${d(xt)}" aria-label="Search notes" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${m||We.length===0?"disabled":""}>Add note</button>
        </div>
        ${We.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Ge("Title","summary",ot,et,"note","col-note-title")}
                ${Ge("Date","dtstart",ot,et,"note","col-note-date")}
                ${Ge("Calendar","calendar",ot,et,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function fn(){const e=r.querySelector(".contacts-table-wrap"),t=r.querySelector(".contacts-ab-list"),a=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function bn(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=r.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=r.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=r.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function u(){const e=fn();c?nn():Sa(),hn(),bn(e),requestAnimationFrame(()=>{var t;Ka(),(t=r.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Ea(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(t.value=l.slice(0,7),a.value=l.toUpperCase())}))}function hn(){r.querySelectorAll("[data-action]").forEach($=>{$.addEventListener("click",U=>{const q=U.target.closest("[data-action]");((q==null?void 0:q.dataset.action)==="info"||(q==null?void 0:q.dataset.action)==="info-close")&&(U.preventDefault(),U.stopPropagation()),An(U)})}),bt(),P&&Fa(),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach($=>{$.addEventListener("keydown",U=>{(U.key==="Enter"||U.key===" ")&&(U.preventDefault(),$.click())})});const e=r.querySelector("#delete-cal-confirm"),t=r.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||m)});const a=r.querySelector("#delete-ab-confirm"),l=r.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||m)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach($=>{$.addEventListener("error",()=>{const U=$.dataset.avatarFallback||"?",q=document.createElement("span");q.className="contact-avatar contact-avatar-fallback",q.setAttribute("aria-hidden","true"),q.textContent=U,$.replaceWith(q)})}),oa||(document.addEventListener("keydown",$=>{if($.key==="Escape"){if(B&&(B.phase==="done"||B.phase==="error")){va();return}if(!B){if(P){P=!1,bt(),u();return}if(fe!==null||ie!==null||Z!==null){fe=null,ie=null,Z=null,u();return}Na()}}}),oa=!0);const o=r.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",$=>{$.preventDefault(),kn(o)});const p=r.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",$=>{$.preventDefault(),Sn(p)});const n=r.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",$=>{$.preventDefault(),Dn(n)}),r.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach($=>{$.addEventListener("change",()=>{Cn($)})}),r.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach($=>{$.indeterminate=!0});const s=r.querySelector('[data-form="share"]');s==null||s.addEventListener("submit",$=>{$.preventDefault(),En(s)});const i=r.querySelector('[data-form="edit-cal"]');i&&(Ea(i),i.addEventListener("submit",$=>{$.preventDefault(),Tn(i)}));const f=r.querySelector('[data-form="edit-event"]');f==null||f.addEventListener("submit",$=>{$.preventDefault(),Nn(f)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach($=>{$.addEventListener("change",()=>{if(!y)return;const U=r.querySelector('[data-form="edit-event"]');if(!U)return;const q=new FormData(U),ce=U.querySelector('input[name="allDay"]'),ae=$t(q);ae.endMode==="until"&&!ae.until&&(ae.until=tt(String(q.get("start")??y.start??""))||se(new Date)),y={...y,summary:String(q.get("summary")??y.summary),description:String(q.get("description")??y.description),location:String(q.get("location")??y.location),instanceId:Number(q.get("instanceId"))||y.instanceId,allDay:(ce==null?void 0:ce.checked)??y.allDay,start:String(q.get("start")??y.start??""),end:String(q.get("end")??y.end??"")||null,repeat:ae,hasRrule:!!String(q.get("repeatFreq")??"").trim()},ae.freq&&ae.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),u(),ae.endMode==="until"&&requestAnimationFrame(()=>{var je;const De=r.querySelector('input[name="repeatUntil"]');De==null||De.focus();try{(je=De==null?void 0:De.showPicker)==null||je.call(De)}catch{}})})});const b=r.querySelector('[data-form="create-cal"]');b&&(Ea(b),b.addEventListener("submit",$=>{$.preventDefault(),xn(b)}));const g=r.querySelector('[data-form="create-ab"]');g==null||g.addEventListener("submit",$=>{$.preventDefault(),Pn(g)});const v=r.querySelector('[data-form="edit-ab"]');v==null||v.addEventListener("submit",$=>{$.preventDefault(),Fn(v)});const E=r.querySelector('[data-form="contact"]');E==null||E.addEventListener("submit",$=>{$.preventDefault(),Mn(E)});const w=r.querySelector('[data-form="task"]');if(w==null||w.addEventListener("submit",$=>{$.preventDefault(),gn(w)}),w){const $=w.querySelector('select[name="instanceId"]');$==null||$.addEventListener("change",()=>{if(!K||!V)return;const U=Number($.value);if(!Number.isFinite(U)||U<=0)return;const q=new FormData(w),ce=String(q.get("due")??"").trim();V={...V,instanceId:U,parentUid:V.parentUid&&he.some(ae=>ae.uid===V.parentUid&&ae.instanceId===U)?V.parentUid:null,summary:String(q.get("summary")??""),description:String(q.get("description")??""),status:String(q.get("status")??"NEEDS-ACTION"),due:ce?new Date(ce).toISOString():null,priority:Number(q.get("priority")??0),percent:Number(q.get("percent")??0)},u()})}const x=r.querySelector('[data-form="note"]');x==null||x.addEventListener("submit",$=>{$.preventDefault(),vn(x)});const G=r.querySelector('input[data-action="contact-search"]');G==null||G.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{Ze=G.value,F!==null&&(async()=>{try{await ze(F),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)});const T=r.querySelector('input[data-action="task-search"]');T==null||T.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{Tt=T.value,(async()=>{try{await Ke(),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)});const J=r.querySelector('input[data-action="note-search"]');J==null||J.addEventListener("input",()=>{Ue&&clearTimeout(Ue),Ue=setTimeout(()=>{xt=J.value,(async()=>{try{await ct(),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)}),In(),wn(),$n()}async function yn(e){var o,p;const t=Ca();if(t.length===0){h("error","No writable tasks selected"),u();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;m=!0,L(),u();try{const n=await I.bulkTasks({op:"delete",items:a});oe=[],we&&t.some(s=>te(s.instanceId,s.uri)===we)&&(we=null,V=null,K=!1),await Ke(),n.failed>0?h("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk delete failed")}finally{m=!1,u()}return}let l={};if(e==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!s){h("error","Choose a status to apply"),u();return}l={status:s}}else if(e==="bulk-task-due"){const n=Dt.trim();if(!n){h("error","Choose a due date to apply"),u();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){h("error","Invalid due date"),u();return}l={due:s.toISOString()}}else if(e==="bulk-task-clear-due")l={due:null};else if(e==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(s===""){h("error","Enter a percent complete (0–100)"),u();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){h("error","Percent must be between 0 and 100"),u();return}l={percent:Math.round(i)}}m=!0,L(),u();try{const n=await I.bulkTasks({op:"update",items:a,fields:l});if(await Ke(),V&&!K){const i=te(V.instanceId,V.uri),f=he.find(b=>te(b.instanceId,b.uri)===i);f&&(V={...f})}const s=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?h("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk update failed")}finally{m=!1,u()}}async function gn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),b=f===""?null:f;m=!0,L(),u();try{if(K){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const v=await I.createTask({instanceId:g,summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:b});K=!1,we=te(v.task.instanceId,v.task.uri),V=v.task,h("success",b?"Subtask created":"Task created")}else if(V){const g=await I.updateTask(V.instanceId,V.uri,{summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:b});V=g.task,we=te(g.task.instanceId,g.task.uri),h("success","Task saved")}await Ke()}catch(g){h("error",g instanceof Error?g.message:"Save failed")}finally{m=!1,u()}}async function vn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;m=!0,L(),u();try{if(de){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await I.createNote({instanceId:n,summary:a,description:l,dtstart:p});de=!1,Oe=te(s.note.instanceId,s.note.uri),X=s.note,h("success","Note created")}else if(X){const n=await I.updateNote(X.instanceId,X.uri,{summary:a,description:l,dtstart:p});X=n.note,Oe=te(n.note.instanceId,n.note.uri),h("success","Note saved")}await ct()}catch(n){h("error",n instanceof Error?n.message:"Save failed")}finally{m=!1,u()}}function $n(){const e=r.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),u();return}try{const l=await tn(t);Ce=l,be=`data:${t.type||"image/jpeg"};base64,${l}`,Te=!1,u()}catch(l){h("error",l instanceof Error?l.message:"Failed to read photo"),u()}}})()})}function wn(){const e=r.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),l=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const p=()=>{const n=t.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};t.addEventListener("change",p),p()}async function kn(e){const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("password")??"");m=!0,L(),u(),M.event("login.attempt",{username:a});try{const o=await I.login(a,l);c=o.user,Ht(o.ui),M.event("login.ok",{username:(c==null?void 0:c.username)??a}),Yt(),ca(),qt(k),await xe(),h("success","Signed in")}catch(o){M.warn("login.failed",o instanceof Error?o.message:o),h("error",o instanceof Error?o.message:"Login failed")}finally{m=!1,u()}}async function Sn(e){const t=new FormData(e),a=String(t.get("path")??""),l=String(t.get("newName")??"").trim();if(!a||!l){h("error","Name is required"),u();return}m=!0,L(),u();try{await I.filesRename(a,l),M.event("files.rename",{path:a,newName:l}),fe=null,await Be(),h("success",`Renamed to “${l}”`)}catch(o){h("error",o instanceof Error?o.message:"Rename failed")}finally{m=!1,u()}}async function Dn(e){if(!Z||Z.paths.length===0)return;const t=new FormData(e),a=String(t.get("toPath")??"").trim().replace(/^\/+|\/+$/g,""),l=String(t.get("newName")??"").trim(),o=Z.op,p=[...Z.paths],n=p.length>1;m=!0,L(),u();let s=0;const i=[];try{for(const b of p)try{if(o==="copy"){const g=It(b),v=n||!l||l===g?void 0:l,E=await I.filesCopy(b,{to:a,newName:v});M.event("files.copy",{path:b,to:E.entry.path})}else{const g=It(b),v=n||!l||l===g?void 0:l;await I.filesMove(b,a,v),M.event("files.move",{path:b,to:a})}s+=1}catch(g){i.push(`${It(b)}: ${g instanceof Error?g.message:"failed"}`)}Z=null,ee=[],await Be();const f=o==="copy"?"Copied":"Moved";s>0&&i.length===0?h("success",s===1?`${f} 1 item`:`${f} ${s} items`):s>0?h("info",`${f} ${s}; ${i.length} failed. ${i[0]}`):h("error",i[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){h("error",f instanceof Error?f.message:"Operation failed")}finally{m=!1,u()}}async function Cn(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",m=!0,L(),u();let l=0;const o=[];try{for(const p of a)try{await I.filesUpload(Ee,p,{replace:!0}),M.event("files.upload",{path:Ee,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await Be(),l>0&&o.length===0?h("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?h("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):h("error",o[0]||"Upload failed")}catch(p){h("error",p instanceof Error?p.message:"Upload failed")}finally{m=!1,u()}}async function En(e){if(C===null)return;const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("access")??"read");H=!0,m=!0,L(),u();try{await I.share(C,a,l),await ht(C),h("success",`Shared with ${a}`)}catch(o){h("error",o instanceof Error?o.message:"Share failed")}finally{m=!1,u()}}function vt(e){if(!y)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');y={...y,summary:String(t.get("summary")??y.summary),description:String(t.get("description")??y.description),location:String(t.get("location")??y.location),instanceId:Number(t.get("instanceId"))||y.instanceId,allDay:(a==null?void 0:a.checked)??y.allDay,start:String(t.get("start")??y.start??""),end:String(t.get("end")??y.end??"")||null,repeat:$t(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function $t(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),l=String(e.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const i=String(e.get("repeatUntil")??"").trim();p=i?i.slice(0,10):null}else if(o==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:p,count:n,byDay:s,endMode:o}}async function Nn(e){if(!y||!y.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||y.instanceId,f=$t(t);if(!a){h("error","Title is required"),u();return}if(!n){h("error","Start is required"),u();return}let b,g;if(p)b=n.slice(0,10),g=s?s.slice(0,10):b;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const x=Gt(n,s||null);b=new Date(x.start).toISOString(),g=x.end?new Date(x.end).toISOString():null}else b=new Date(n).toISOString(),g=s?new Date(s).toISOString():null;const v=y.instanceId,E=y.uri,w=Ie;m=!0,L(),ve=!0,u(),M.event(w?"event.create":"event.update",{instanceId:i,uri:w?null:E,allDay:p,summary:a});try{const x={summary:a,description:l,location:o,allDay:p,start:b,end:g,instanceId:i,repeat:f},G=w?await I.createEvent(i,x):await I.updateEvent(v,E,x);(C===null||G.event.instanceId!==C)&&(C=G.event.instanceId),await Le(),ve=!1,y=null,Ie=!1,O=null,M.event(w?"event.created":"event.saved",{uri:G.event.uri,instanceId:G.event.instanceId}),h("success",w?"Event created":"Event saved")}catch(x){M.warn("event.save failed",x instanceof Error?x.message:x),h("error",x instanceof Error?x.message:"Save failed")}finally{m=!1,u()}}async function Tn(e){if(C===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim();m=!0,L(),u();try{const p=await I.updateCalendar(C,{displayname:a,description:l,color:o});H=!0,await xe(),C=p.calendar.id,await ht(C),await Le(),h("success","Calendar updated")}catch(p){h("error",p instanceof Error?p.message:"Update failed")}finally{m=!1,u()}}async function xn(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if(z=!0,p&&!n){h("error","Select a country for the holidays calendar"),u();return}if(!p&&!a){h("error","Display name is required"),u();return}m=!0,L(),u();try{const i=await I.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:s});C=i.calendar.id,z=!1,await xe();let f=`Created “${i.calendar.displayname}”`;const b=i.holidayImport??i.calendar.holidayImport;b&&(f+=`. Holidays imported: ${sa(b)}.`),s&&(f+=" Calendar is read-only."),h("success",f)}catch(i){z=!0,h("error",i instanceof Error?i.message:"Create failed")}finally{m=!1,u()}}async function An(e){var l,o,p;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&M.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){B&&(B.phase==="done"||B.phase==="error")&&va();return}if(a==="logout"){m=!0,M.event("logout");try{await I.logout()}catch{}Jt(),L(),u();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;C=n,m=!0,L(),u();try{await Le()}catch(s){h("error",s instanceof Error?s.message:"Failed to load calendar")}finally{m=!1,u()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;C=n,H=!0,ue=null,m=!0,L(),u();try{await ht(n),await Le()}catch(i){h("error",i instanceof Error?i.message:"Failed to open calendar")}finally{m=!1,u()}return}if(a==="close-cal-modal"){H=!1,u();return}if(a==="open-create-cal-modal"){z=!0,H=!1,ue=null,L(),u();return}if(a==="close-create-cal-modal"){z=!1,L(),u();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;ue=n,H=!1,L(),u();return}if(a==="cancel-delete-cal"){ue=null,u();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;m=!0,L(),u();try{if(await I.deleteCalendar(n),C===n&&(C=null),ue=null,H=!1,Se=[],Y=[],await xe(),C===null){const i=ua();i&&(C=i.id,await Le())}h("success","Calendar deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="month-today"){const n=new Date;_={y:n.getFullYear(),m:n.getMonth()},mt=null,m=!0,u();try{await Le()}finally{m=!1,u()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,s=new Date(_.y,_.m+n,1);_={y:s.getFullYear(),m:s.getMonth()},mt=null,m=!0,u();try{await Le()}finally{m=!1,u()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;m=!0,L(),u();try{const i=await I.getEvent(n,s);y={...i.event,repeat:i.event.repeat??At()},Ie=!1,ve=!0,O=null,H=!1,ue=null}catch(i){h("error",i instanceof Error?i.message:"Failed to open event")}finally{m=!1,u()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";mt=mt===n?null:n,u();return}if(a==="new-event-day"){const n=e.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(C===null){h("error","Select a calendar first"),u();return}const i=A.find(f=>f.id===C);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){h("error","This calendar is read-only"),u();return}Ie=!0,y=Qa(s,C),ve=!0,O=null,H=!1,ue=null,L(),u();return}if(a==="close-event-modal"){ve=!1,y=null,Ie=!1,O=null,L(),u();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&y&&vt(s),(O==null?void 0:O.field)===n)O=null;else{const i=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",b=t.dataset.dtName||n;let g=Zt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=gt().start);const v=yt(g||se(new Date)),[E,w]=v.date.split("-").map(Number);O={field:n,viewY:E,viewM:(w||1)-1,dateOnly:i,allowClear:f,name:b}}u();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const n=a==="dt-month-prev"?-1:1,s=new Date(O.viewY,O.viewM+n,1);O={...O,viewY:s.getFullYear(),viewM:s.getMonth()},u();return}if(a==="dt-pick-day"){if(!O)return;const n=O.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&vt(i);const f=O.dateOnly;if(f)Me(n,s),O=null;else{const b=Zt(n),g=yt(b||gt(s).start).hm;Me(n,`${s}T${g}`),O={...O,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&y&&!f&&y.end){const b=new Date(String(y.start)),g=new Date(String(y.end));!Number.isNaN(b.getTime())&&!Number.isNaN(g.getTime())&&g<=b&&Me("end",Je(new Date(b.getTime()+3600*1e3)))}u();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const n=O.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&vt(i);const f=Zt(n)||gt().start,g=`${yt(f).date}T${s}`;if(Me(n,g),n==="start"&&y){y={...y,allDay:!1};const v=y.end?yt(String(y.end)):null,E=new Date(g);(!v||new Date(`${v.date}T${v.hm}`)<=E)&&Me("end",Je(new Date(E.getTime()+3600*1e3)))}O=null,u();return}if(a==="dt-today"){if(!O)return;const n=O.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&vt(s);const i=se(new Date);if(O.dateOnly)Me(n,i);else{const f=gt(i);n==="start"?(Me("start",f.start),y&&!y.end&&Me("end",f.end)):n==="end"?Me("end",f.end):Me(n,f.start)}O=null,u();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const n=O.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&vt(s),Me(n,null),O=null,u();return}if(a==="event-allday-toggle"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),f=String(i.get("start")??y.start??""),b=String(i.get("end")??y.end??"")||null;let g=f,v=b;if(s){const E=Va(f,b);g=E.start,v=E.end}else{const E=f.slice(0,10),w=(b||f).slice(0,10),x=Gt(E,w);g=x.start,v=x.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:s,start:g,end:v,repeat:$t(i)}}else y={...y,allDay:s};O=null,u();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),f=$t(s);y={...y,summary:String(s.get("summary")??y.summary),description:String(s.get("description")??y.description),location:String(s.get("location")??y.location),instanceId:Number(s.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(s.get("start")??y.start??""),end:String(s.get("end")??y.end??"")||null,repeat:f,hasRrule:!!String(s.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),u();return}if(a==="delete-event"){if(!y||!y.canWrite||Ie||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,s=y.uri;m=!0,L(),u();try{await I.deleteEvent(n,s),ve=!1,y=null,await Le(),h("success","Event deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="info"){const n=t.dataset.info??"";qn(n);return}if(a==="info-close"){Na();return}if(a==="flash-close"){L(),u();return}if(a==="user-menu-toggle"){e.stopPropagation(),P=!P,u();return}if(a==="user-menu-close"){P&&(P=!1,u());return}if(a==="tab"){const n=ra(t.dataset.tab);n&&await qa(n);return}if(a==="files-nav"){Ee=t.dataset.path??"",fe=null,ie=null,Z=null,ee=[],m=!0,L(),u();try{await Be()}catch(s){h("error",s instanceof Error?s.message:"Failed to open folder")}finally{m=!1,u()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?ee.includes(n)||(ee=[...ee,n]):ee=ee.filter(i=>i!==n),u();return}if(a==="files-select-all"){e.stopPropagation(),ee=t.checked?ye.map(s=>s.path):[],u();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;Z={op:"copy",paths:[n]},fe=null,ie=null,u();return}if(a==="files-move"){const n=t.dataset.path??"";if(!n)return;Z={op:"move",paths:[n]},fe=null,ie=null,u();return}if(a==="files-bulk-copy"){if(ee.length===0)return;Z={op:"copy",paths:[...ee]},fe=null,ie=null,u();return}if(a==="files-bulk-move"){if(ee.length===0)return;Z={op:"move",paths:[...ee]},fe=null,ie=null,u();return}if(a==="files-transfer-close"){Z=null,u();return}if(a==="files-bulk-delete"){if(ee.length===0)return;ie=[...ee],fe=null,Z=null,u();return}if(a==="files-refresh"){m=!0,L(),u();try{await Be(),h("success","Refreshed")}catch(n){h("error",n instanceof Error?n.message:"Refresh failed")}finally{m=!1,u()}return}if(a==="files-mkdir"){const n=window.prompt("New folder name");if(n===null)return;const s=n.trim();if(!s){h("error","Folder name is required"),u();return}m=!0,L(),u();try{await I.filesMkdir(Ee,s),M.event("files.mkdir",{path:Ee,name:s}),await Be(),h("success",`Created folder “${s}”`)}catch(i){h("error",i instanceof Error?i.message:"Could not create folder")}finally{m=!1,u()}return}if(a==="files-rename-open"){fe=t.dataset.path??null,ie=null,Z=null,u();return}if(a==="files-rename-close"){fe=null,u();return}if(a==="files-delete-open"){const n=t.dataset.path??"";ie=n?[n]:null,fe=null,Z=null,u();return}if(a==="files-delete-close"){ie=null,u();return}if(a==="files-delete-confirm"){const n=ie?[...ie]:[];if(n.length===0)return;m=!0,L(),u();try{if(n.length===1)await I.filesDelete(n[0]),M.event("files.delete",{path:n[0]}),h("success","Deleted");else{const s=await I.filesBulk("delete",n);M.event("files.bulk-delete",{ok:s.ok,failed:s.failed}),s.failed===0?h("success",s.ok===1?"Deleted 1 item":`Deleted ${s.ok} items`):s.ok>0?h("info",`Deleted ${s.ok}; ${s.failed} failed. ${s.errors[0]||""}`):h("error",s.errors[0]||"Delete failed")}ie=null,ee=[],await Be()}catch(s){h("error",s instanceof Error?s.message:"Delete failed")}finally{m=!1,u()}return}if(a==="files-download"){M.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){Ye===n?Ve=Ve==="asc"?"desc":"asc":(Ye=n,Ve=n==="due"||n==="summary"?"asc":"desc"),m=!0,u();try{await Ke()}catch(s){h("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}else{ot===n?et=et==="asc"?"desc":"asc":(ot=n,et="asc"),m=!0,u();try{await ct()}catch(s){h("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=he.find(f=>f.instanceId===n&&f.uri===s)??null;K=!1,we=te(n,s),V=i?{...i}:null,L(),u();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=te(n,s),f=he.find(b=>te(b.instanceId,b.uri)===i);if(!f||!f.canWrite||f.readOnly)return;oe.includes(i)?oe=oe.filter(b=>b!==i):oe=[...oe,i],u();return}if(a==="task-select-all"){e.preventDefault();const n=he.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>oe.includes(te(i.instanceId,i.uri)))?oe=[]:oe=n.map(i=>te(i.instanceId,i.uri)),u();return}if(a==="bulk-task-clear"){oe=[],u();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){yn(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=lt.find(f=>f.instanceId===n&&f.uri===s)??null;de=!1,Oe=te(n,s),X=i?{...i}:null,L(),u();return}if(a==="new-task"){K=!0,we=null,V={uri:"",instanceId:((o=He[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},L(),u();return}if(a==="new-subtask"){if(!V||K||!V.uid||!V.canWrite)return;const n=V;K=!0,we=null,V={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},L(),u();return}if(a==="new-note"){de=!0,Oe=null,X={uri:"",instanceId:((p=We[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},L(),u();return}if(a==="cancel-task"){K=!1,V=null,we=null,u();return}if(a==="cancel-note"){de=!1,X=null,Oe=null,u();return}if(a==="delete-task"){if(!V||K||!confirm("Delete this task? CalDAV clients will sync the removal."))return;m=!0,L(),u();try{await I.deleteTask(V.instanceId,V.uri),we=null,V=null,await Ke(),h("success","Task deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-note"){if(!X||de||!confirm("Delete this note? CalDAV clients will sync the removal."))return;m=!0,L(),u();try{await I.deleteNote(X.instanceId,X.uri),Oe=null,X=null,await ct(),h("success","Note deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;F=n,Ne=!1,Q=null,N=null,ne=!1,pe=!1,Ze="",Re=[],be=null,Ce=null,Te=!1,L(),m=!0,u();try{await ze(n)}catch(s){h("error",s instanceof Error?s.message:"Failed to load contacts")}finally{m=!1,u()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!$e.find(f=>f.id===n))return;const i=F!==n;F=n,Ne=!0,pe=!1,L(),i&&(Q=null,N=null,ne=!1,Ze="",Re=[],be=null,Ce=null,Te=!1),m=!0,u();try{i&&await ze(n)}catch(f){h("error",f instanceof Error?f.message:"Failed to open address book")}finally{m=!1,u()}return}if(a==="close-ab-modal"){Ne=!1,u();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;L();try{await Za(n)}catch(s){h("error",s instanceof Error?s.message:"Failed to load contact")}u();return}if(a==="new-contact"){if(F===null)return;en(),L(),u();return}if(a==="cancel-contact"||a==="close-contact-modal"){ne=!1,pe=!1,N=null,Q=null,be=null,Ce=null,Te=!1,O=null,L(),u();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!N)return;Ot(),Array.isArray(N.emails)||(N.emails=[""]),Array.isArray(N.phones)||(N.phones=[{type:"cell",value:""}]),Array.isArray(N.custom)||(N.custom=[]),a==="add-email"?N.emails.length<10&&N.emails.push(""):a==="add-phone"?N.phones.length<10&&N.phones.push({type:"other",value:""}):N.custom.length<30&&N.custom.push({label:"",value:""}),u();return}if(a==="remove-email"){if(!N)return;Ot();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(N.emails)?N.emails:[""];N.emails=s.filter((i,f)=>f!==n),N.emails.length===0&&(N.emails=[""]),u();return}if(a==="remove-phone"){if(!N)return;Ot();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(N.phones)?N.phones:[{type:"cell",value:""}];N.phones=s.filter((i,f)=>f!==n),N.phones.length===0&&(N.phones=[{type:"cell",value:""}]),u();return}if(a==="remove-custom"){if(!N)return;Ot();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;N.custom=(Array.isArray(N.custom)?N.custom:[]).filter((s,i)=>i!==n),u();return}if(a==="remove-photo"){be=null,Ce=null,Te=!0,N&&(N.hasPhoto=!1),u();return}if(a==="delete-contact"){if(F===null||!Q||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;m=!0,L(),pe=!0,u();try{await I.deleteContact(F,Q),Q=null,N=null,ne=!1,pe=!1,O=null,be=null,await xe(),h("success","Contact deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??F);if(!Number.isFinite(n)||!$e.find(i=>i.id===n))return;me=n,Ne=!1,pe=!1,L(),u();return}if(a==="cancel-delete-ab"){me=null,u();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=$e.find(b=>b.id===n);if(!i)return;const f=(i.cardCount??0)>0;m=!0,L(),u();try{await I.deleteAddressBook(n,f),F===n&&(F=null,Re=[],N=null,Q=null,ne=!1),me=null,Ne=!1,pe=!1,await xe(),F===null&&$e.length>0&&(F=$e[0].id,await ze(F)),h("success","Address book deleted")}catch(b){h("error",b instanceof Error?b.message:"Delete failed")}finally{m=!1,u()}return}if(a==="export-ab"){if(F===null)return;Ne=!0,m=!0,L(),u();try{const{blob:n,filename:s}=await I.exportAddressBook(F),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="export-contact"){if(F===null||!Q||ne)return;pe=!0,m=!0,L(),u();try{const{blob:n,filename:s}=await I.exportContact(F,Q),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||C===null||!confirm("Revoke access for this user?"))return;H=!0,m=!0,L(),u();try{await I.revoke(C,n),await ht(C),h("success","Share revoked")}catch(s){h("error",s instanceof Error?s.message:"Revoke failed")}finally{m=!1,u()}return}if(a==="export-cal"){if(C===null)return;H=!0,m=!0,L(),u();try{const{blob:n,filename:s}=await I.exportCalendar(C),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${s}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}}}function In(){const e=r.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Rn(e)});const t=r.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Un(t)});const a=r.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{On(a)})}async function On(e){var l;if(F===null)return;const t=(l=e.files)==null?void 0:l[0];if(e.value="",!t)return;const a=F;Ne=!0,m=!0,L(),Fe(),B={kind:"contacts",fileName:t.name,fileSizeLabel:ya(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ga(),u();try{const o=await ka(t,s=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:s};const i=r.querySelector(".import-progress-bar"),f=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),f&&s!==null&&(f.textContent=`Reading file… ${s}%`)});Qe("uploading",{readPercent:100}),Qe("processing",{processPercent:0}),M.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const p=await I.importAddressBook(a,o,s=>{$a(s)}),n=sa(p);await xe(),F===a&&await ze(a),Fe(),Qe("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),h("success",`Import finished for “${t.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";Fe(),Qe("error",{ok:!1,resultMessage:p}),h("error",p)}finally{m=!1,u()}}function Ot(){if(!N)return;const e=r.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);N.firstname=String(t.get("firstname")??""),N.lastname=String(t.get("lastname")??""),N.fullname=String(t.get("fullname")??""),N.org=String(t.get("org")??""),N.title=String(t.get("title")??""),N.url=String(t.get("url")??""),N.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();N.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,N.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const l=[];let o=0;for(;t.has(`email_${o}`);)l.push(String(t.get(`email_${o}`)??"")),o++;l.length&&(N.emails=l);const p=[];for(o=0;t.has(`phone_value_${o}`);)p.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;p.length&&(N.phones=p);const n=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)n.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;N.custom=n}function Ln(e){const t=new FormData(e),a=[];let l=0;for(;t.has(`email_${l}`);){const s=String(t.get(`email_${l}`)??"").trim();s&&a.push(s),l++}const o=[];for(l=0;t.has(`phone_value_${l}`);){const s=String(t.get(`phone_value_${l}`)??"").trim();s&&o.push({type:String(t.get(`phone_type_${l}`)??"other"),value:s}),l++}const p=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);){const s=String(t.get(`custom_label_${l}`)??"").trim(),i=String(t.get(`custom_value_${l}`)??"").trim();(s||i)&&p.push({label:s,value:i}),l++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:p};return Te?n.removePhoto=!0:Ce&&(n.photoBase64=Ce),n}async function Mn(e){if(F===null)return;const t=Ln(e);m=!0,L(),pe=!0,u();try{if(ne){const a=await I.createContact(F,t);ne=!1,Q=a.contact.uri,N=null,pe=!1,be=null,Ce=null,Te=!1,O=null,h("success","Contact created")}else Q&&(Q=(await I.updateContact(F,Q,t)).contact.uri,N=null,pe=!1,be=null,Ce=null,Te=!1,O=null,h("success","Contact saved"));try{await xe()}catch(a){if(console.error(a),F!==null)try{await ze(F)}catch{}}}catch(a){h("error",a instanceof Error?a.message:"Save failed")}finally{m=!1,u()}}async function Pn(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();if(a){m=!0,L(),u();try{const o=await I.createAddressBook({displayname:a,description:l});F=o.addressbook.id,Q=null,N=null,ne=!1,Ze="",await xe(),h("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){h("error",o instanceof Error?o.message:"Create failed")}finally{m=!1,u()}}}async function Fn(e){if(F===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();Ne=!0,m=!0,L(),u();try{await I.updateAddressBook(F,{displayname:a,description:l}),await xe(),h("success","Address book updated")}catch(o){h("error",o instanceof Error?o.message:"Update failed")}finally{m=!1,u()}}function qn(e){const t=Zn[e];if(!t)return;const a=r.querySelector("#info-modal"),l=r.querySelector("#info-modal-title"),o=r.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=t.title,o.innerHTML=t.paragraphs.map(n=>`<p>${d(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function Na(){const e=r.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Rn(e){var a;if(C===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(H=!0,await Ta(C,t,{keepEditModalOpen:!0}))}async function Un(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=r.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){h("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),z=!0,u();return}if(p){h("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),z=!0,u();return}let n=String(l.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const s=String(l.get("description")??""),i=String(l.get("color")??"").trim();m=!0,L(),z=!0,u();try{const b=await I.createCalendar({displayname:n,description:s,color:i,readOnly:!1});C=b.calendar.id,z=!1,await xe(),h("success",`Created “${b.calendar.displayname}” — importing…`),await Ta(b.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${b.calendar.displayname}” created. `})}catch(b){const g=b instanceof Error?b.message:"Create or import failed";z=!0,h("error",g),m=!1,u()}}async function Ta(e,t,a={}){m=!0,L(),Fe(),B={kind:"calendar",fileName:t.name,fileSizeLabel:ya(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},ga(),u();try{const l=await ka(t,n=>{if(!B||B.phase!=="reading")return;B={...B,readPercent:n};const s=r.querySelector(".import-progress-bar"),i=r.querySelector("[data-import-status-line]");s&&n!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${n}%`),i&&n!==null&&(i.textContent=`Reading file… ${n}%`)});Qe("uploading",{readPercent:100}),Qe("processing",{processPercent:0}),M.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await I.importCalendar(e,l,n=>{$a(n)}),p=sa(o);C===e&&await Le(),Fe(),Qe("done",{ok:!0,resultMessage:`${p} (from “${t.name}”)`}),h("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";Fe(),Qe("error",{ok:!1,resultMessage:o}),h("error",o)}finally{a.keepEditModalOpen&&(H=!0),m=!1,u()}}Ra()}const Pa=document.getElementById("app");if(!Pa)throw new Error("#app missing");ts(Pa);
