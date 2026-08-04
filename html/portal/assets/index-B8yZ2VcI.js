var Wn=Object.defineProperty;var Yn=(s,c,D)=>c in s?Wn(s,c,{enumerable:!0,configurable:!0,writable:!0,value:D}):s[c]=D;var Aa=(s,c,D)=>Yn(s,typeof c!="symbol"?c+"":c,D);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const P of document.querySelectorAll('link[rel="modulepreload"]'))w(P);new MutationObserver(P=>{for(const V of P)if(V.type==="childList")for(const x of V.addedNodes)x.tagName==="LINK"&&x.rel==="modulepreload"&&w(x)}).observe(document,{childList:!0,subtree:!0});function D(P){const V={};return P.integrity&&(V.integrity=P.integrity),P.referrerPolicy&&(V.referrerPolicy=P.referrerPolicy),P.crossOrigin==="use-credentials"?V.credentials="include":P.crossOrigin==="anonymous"?V.credentials="omit":V.credentials="same-origin",V}function w(P){if(P.ep)return;P.ep=!0;const V=D(P);fetch(P.href,V)}})();const Ia={off:0,error:1,warn:2,info:3,debug:4};let Ct="off";const jt="[angaradav-portal]";function Jn(s){const c=(s||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function zn(s){return Ct=Jn(s),Ct!=="off"&&console.info(jt,`log level = ${Ct}`),Ct}function La(s){return Ia[Ct]>=Ia[s]}function qt(s,c,D,w){if(!La(s))return;const P=[jt,D];w!==void 0&&P.push(w),console[c](...P)}function Kn(s,c){La("info")&&(c&&Object.keys(c).length>0?console.info(jt,`event:${s}`,c):console.info(jt,`event:${s}`))}const L={error(s,c){qt("error","error",s,c)},warn(s,c){qt("warn","warn",s,c)},info(s,c){qt("info","info",s,c)},debug(s,c){qt("debug","debug",s,c)},event:Kn};class Ce extends Error{constructor(D,w){super(D);Aa(this,"status");this.status=w}}let lt="",Ut=null,Bt=null;function Vt(s){lt=s&&typeof s=="string"?s:""}function Gn(s){Ut=s}function Xn(s){Bt=s}function oa(s){if(!Ma(s))try{Bt==null||Bt()}catch{}}function Ma(s){return s==="/login"||s==="/ui"||s==="/logout"}function _t(s,c){if(!Ma(s)){Vt("");try{Ut==null||Ut(c||"Session timed out. Please sign in again.")}catch{}}}async function q(s,c={}){const D=new Headers(c.headers);c.body&&!D.has("Content-Type")&&D.set("Content-Type","application/json");const w=(c.method||"GET").toUpperCase();w!=="GET"&&w!=="HEAD"&&w!=="OPTIONS"&&lt&&D.set("X-CSRF-Token",lt);const P=typeof performance<"u"?performance.now():Date.now();L.debug(`api → ${w} ${s}`);const V=await fetch(`/api${s}`,{...c,headers:D,credentials:"same-origin"});let x=null;const Y=await V.text();if(Y)try{x=JSON.parse(Y)}catch{x={error:Y}}const oe=Math.round((typeof performance<"u"?performance.now():Date.now())-P);if(!V.ok){let E=`Request failed (${V.status})`;throw x&&typeof x=="object"&&x!==null&&"error"in x&&typeof x.error=="string"?E=x.error:(V.status===500||V.status===504)&&(E="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),V.status>=500?L.error(`api ← ${w} ${s} ${V.status} (${oe}ms)`,E):V.status!==401?L.warn(`api ← ${w} ${s} ${V.status} (${oe}ms)`,E):(L.debug(`api ← ${w} ${s} 401 (${oe}ms)`),_t(s,E)),new Ce(E,V.status)}return L.info(`api ← ${w} ${s} ${V.status} (${oe}ms)`),oa(s),x}function Ie(s){return encodeURIComponent(s)}async function Oa(s,c,D,w){const P=new Headers({"Content-Type":D,Accept:"application/x-ndjson, application/json;q=0.9"});lt&&P.set("X-CSRF-Token",lt);const V=typeof performance<"u"?performance.now():Date.now();L.debug(`api → POST ${s} (stream, ${D}, ${c.length} bytes)`);let x;try{x=await fetch(`/api${s}`,{method:"POST",headers:P,credentials:"same-origin",body:c})}catch(H){const z=H instanceof Error?H.message:"Network error";throw L.error(`api ← POST ${s} network fail`,z),new Ce(`Import request failed to start (${z}). Check connectivity and container logs.`,0)}const Y=(x.headers.get("Content-Type")||"").toLowerCase(),oe=Y.includes("ndjson")||Y.includes("x-ndjson");if(!x.ok&&!oe){let H=`Request failed (${x.status})`;try{const z=await x.json();z.error&&(H=z.error)}catch{}throw(x.status===504||x.status===502)&&(H="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),x.status===401?(L.debug(`api ← POST ${s} 401`,H),_t(s,H)):L.warn(`api ← POST ${s} ${x.status}`,H),new Ce(H,x.status)}if(!oe&&x.ok){try{const H=await x.json();if(H&&typeof H.error=="string")throw new Ce(H.error,x.status||500);if(H&&typeof H.imported=="number"&&typeof H.updated=="number")return L.info(`api ← POST ${s} json done`),H}catch(H){if(H instanceof Ce)throw H}throw new Ce("Unexpected import response from server",500)}if(!x.body)throw new Ce("Import stream unavailable",500);const E=x.body.getReader(),Ee=new TextDecoder;let W="";const G={final:null,error:null,sawProgress:!1},me=H=>{let z;try{z=JSON.parse(H)}catch{L.debug("import stream non-JSON line",H.slice(0,80));return}if(z.type==="progress"){G.sawProgress=!0;const Fe=Number(z.total)||0,$e=Number(z.current)||0,y=typeof z.percent=="number"?z.percent:Fe>0?Math.round(100*$e/Fe):0;w==null||w({percent:y,current:$e,total:Fe,imported:Number(z.imported)||0,updated:Number(z.updated)||0,skipped:Number(z.skipped)||0})}else z.type==="done"&&z.result?G.final=z.result:z.type==="error"&&(G.error={message:z.error||"Import failed",status:z.status||500})};for(;;){const{done:H,value:z}=await E.read();if(H)break;W+=Ee.decode(z,{stream:!0});const Fe=W.split(`
`);W=Fe.pop()??"";for(const $e of Fe){const y=$e.trim();y&&me(y)}}W.trim()&&me(W.trim());const pe=Math.round((typeof performance<"u"?performance.now():Date.now())-V);if(G.error)throw G.error.status===401?(L.debug(`api ← POST ${s} stream 401 (${pe}ms)`,G.error.message),_t(s,G.error.message)):L.warn(`api ← POST ${s} stream error (${pe}ms)`,G.error.message),new Ce(G.error.message,G.error.status);if(!G.final)throw L.error(`api ← POST ${s} stream incomplete (${pe}ms)`,{sawProgress:G.sawProgress}),new Ce(G.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return L.info(`api ← POST ${s} stream done (${pe}ms)`),oa(s),G.final}const I={ui:()=>q("/ui"),me:async()=>{var c;const s=await q("/me");return Vt(s.csrfToken||((c=s.user)==null?void 0:c.csrfToken)),s},login:async(s,c)=>{var w;const D=await q("/login",{method:"POST",body:JSON.stringify({username:s,password:c})});return Vt((w=D.user)==null?void 0:w.csrfToken),D},logout:async()=>{try{return await q("/logout",{method:"POST"})}finally{Vt("")}},calendars:()=>q("/calendars"),createCalendar:s=>q("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>q("/holidays/countries"),updateCalendar:(s,c)=>q(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:s=>q(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,c,D)=>{const w=new URLSearchParams({from:c,to:D}).toString();return q(`/calendars/${s}/events?${w}`)},getEvent:(s,c)=>q(`/calendars/${s}/events/${Ie(c)}`),createEvent:(s,c)=>q(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(s,c,D)=>q(`/calendars/${s}/events/${Ie(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteEvent:(s,c)=>q(`/calendars/${s}/events/${Ie(c)}`,{method:"DELETE"}),exportCalendar:async s=>{const c=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!c.ok){let x=`Export failed (${c.status})`;try{const Y=await c.json();Y.error&&(x=Y.error)}catch{}throw new Ce(x,c.status)}const D=c.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(D),P=(w==null?void 0:w[1])||`calendar-${s}.ics`;return{blob:await c.blob(),filename:P}},importCalendar:(s,c,D)=>Oa(`/calendars/${s}/import`,c,"text/calendar; charset=utf-8",D),directory:()=>q("/directory"),shares:s=>q(`/calendars/${s}/shares`),share:(s,c,D)=>q(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:c,access:D})}),revoke:(s,c)=>q(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>q("/addressbooks"),createAddressBook:s=>q("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,c)=>q(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(s,c=!1)=>q(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async s=>{const c=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!c.ok){let x=`Export failed (${c.status})`;try{const Y=await c.json();Y.error&&(x=Y.error)}catch{}throw new Ce(x,c.status)}const D=c.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(D),P=(w==null?void 0:w[1])||`contacts-${s}.vcf`;return{blob:await c.blob(),filename:P}},importAddressBook:(s,c,D)=>Oa(`/addressbooks/${s}/import`,c,"text/vcard; charset=utf-8",D),contacts:(s,c="")=>{const D=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return q(`/addressbooks/${s}/contacts${D}`)},getContact:(s,c)=>q(`/addressbooks/${s}/contacts/${Ie(c)}`),createContact:(s,c)=>q(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(s,c,D)=>q(`/addressbooks/${s}/contacts/${Ie(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteContact:(s,c)=>q(`/addressbooks/${s}/contacts/${Ie(c)}`,{method:"DELETE"}),exportContact:async(s,c)=>{const D=await fetch(`/api/addressbooks/${s}/contacts/${Ie(c)}/export`,{credentials:"same-origin"});if(!D.ok){let Y=`Export failed (${D.status})`;try{const oe=await D.json();oe.error&&(Y=oe.error)}catch{}throw new Ce(Y,D.status)}const w=D.headers.get("Content-Disposition")||"",P=/filename="([^"]+)"/i.exec(w),V=(P==null?void 0:P[1])||"contact.vcf";return{blob:await D.blob(),filename:V}},contactPhotoUrl:(s,c)=>`/api/addressbooks/${s}/contacts/${Ie(c)}/photo`,tasks:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const D=c.toString()?`?${c}`:"";return q(`/tasks${D}`)},createTask:s=>q("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,c,D)=>q(`/tasks/${s}/${Ie(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteTask:(s,c)=>q(`/tasks/${s}/${Ie(c)}`,{method:"DELETE"}),bulkTasks:s=>q("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const D=c.toString()?`?${c}`:"";return q(`/notes${D}`)},createNote:s=>q("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,c,D)=>q(`/notes/${s}/${Ie(c)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteNote:(s,c)=>q(`/notes/${s}/${Ie(c)}`,{method:"DELETE"}),filesStatus:()=>q("/files"),filesList:(s="")=>{const c=new URLSearchParams;s&&c.set("path",s);const D=c.toString()?`?${c}`:"";return q(`/files/entries${D}`)},filesMkdir:(s,c)=>q("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:c})}),filesUpload:async(s,c,D={})=>{const w=new URLSearchParams;s&&w.set("path",s),w.set("name",c.name),D.replace&&w.set("replace","1");const P=new Headers;lt&&P.set("X-CSRF-Token",lt);const V=new FormData;V.append("file",c,c.name),s&&V.append("path",s);const x=typeof performance<"u"?performance.now():Date.now();L.debug(`api → POST /files/upload path=${s||"/"} name=${c.name} size=${c.size}`);const Y=await fetch(`/api/files/upload?${w}`,{method:"POST",headers:P,credentials:"same-origin",body:V}),oe=await Y.text();let E=null;if(oe)try{E=JSON.parse(oe)}catch{E={error:oe}}const Ee=Math.round((typeof performance<"u"?performance.now():Date.now())-x);if(!Y.ok){let W=`Upload failed (${Y.status})`;throw E&&typeof E=="object"&&E!==null&&"error"in E&&typeof E.error=="string"&&(W=E.error),Y.status===401?(L.debug(`api ← POST /files/upload 401 (${Ee}ms)`,W),_t("/files/upload",W)):Y.status>=500?L.error(`api ← POST /files/upload ${Y.status} (${Ee}ms)`,W):L.warn(`api ← POST /files/upload ${Y.status} (${Ee}ms)`,W),new Ce(W,Y.status)}return L.info(`api ← POST /files/upload 200 (${Ee}ms)`),oa("/files/upload"),E},filesDownloadUrl:s=>{const c=new URLSearchParams;return c.set("path",s),`/api/files/download?${c}`},filesDelete:s=>q("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,c)=>q("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:c})}),filesMove:(s,c,D)=>q("/files/move",{method:"POST",body:JSON.stringify({from:s,to:c,newName:D})}),filesCopy:(s,c={})=>q("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:c.to,newName:c.newName})}),filesBulk:(s,c)=>q("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:c})})},Pa="angaradav-portal-tab",Qn="1.0.10",Zn="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function la(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function es(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0],c=la(s);if(c)return c;try{const D=la(sessionStorage.getItem(Pa));if(D)return D}catch{}return"calendars"}function Rt(s){try{sessionStorage.setItem(Pa,s)}catch{}if(typeof history>"u"||typeof location>"u")return;const c=`#${s}`;location.hash!==c&&history.replaceState(null,"",`${location.pathname}${location.search}${c}`)}function d(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function sa(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(s)}</span>`}function ra(s){const c=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&c.push(`${s.skipped} skipped`),c.join(", ")}const ts={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV. Open the classic Web Admin for users, system settings, and database configuration.","The Admin UI uses the separate admin password (not your DAV user password), unless you already have an admin session."]}};function ve(s,c,D="h2"){const w=D;return`<div class="section-title-row">
    <${w}>${d(s)}</${w}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(c)}"
      aria-label="About ${d(s)}" title="About ${d(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function as(){return`
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
    </div>`}function ns(s){let c=null,D=null,w=es(),P=!1,V=null,x=[],Y=[],oe=[],E=null,Ee=[],W=!1,G=!1,me=null,pe=null,H={y:new Date().getFullYear(),m:new Date().getMonth()},z=[],Fe=!1,$e=!1,y=null,Oe=!1,O=null,Et="",ft=null,we=[],F=null,Be=[],et="",ee=null,N=null,ne=!1,fe=!1,Te=!1,be=null,Ne=null,xe=!1,m=!1,R=null,Nt=null,ia=!1,ot={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ve=null,ca=900,bt=null,ht=Qn,Ht=!1,Tt=!1;function Wt(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();ot={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},zn(ot.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(ca=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(ht=e.version.trim())}function Yt(){bt!==null&&(clearTimeout(bt),bt=null)}function Jt(){if(Yt(),!c)return;const e=Math.max(30,ca)*1e3;bt=setTimeout(()=>{bt=null,ua("Your session timed out. Please sign in again.")},e)}function zt(){Yt(),Re(),R=null,c=null,x=[],Ee=[],E=null,Y=[],we=[],F=null,Be=[],ee=null,N=null,ne=!1,fe=!1,Te=!1,G=!1,W=!1,me=null,pe=null,$e=!1,y=null,Oe=!1,z=[],he=[],it=[],We=[],Ye=[],ke=null,Le=null,U=null,Q=null,X=!1,ce=!1,ie=[],Kt=null,Se="",ye=[],dt=!1,de=null,se=null,Z=null,qe=!1,te=[],be=null,Ne=null,xe=!1,m=!1,P=!1,yt()}function xt(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function yt(){V&&(document.removeEventListener("click",V,!0),V=null)}function qa(){yt(),V=t=>{var l;const a=t.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(P=!1,yt(),u())};const e=V;setTimeout(()=>{P&&V===e&&document.addEventListener("click",e,!0)},0)}function da(){w==="admin"&&!xt()&&(w="calendars",Rt(w))}async function Ra(e,t={}){e==="admin"&&!xt()&&(e="calendars"),w=e,P=!1,Rt(e),L.event("tab",{tab:e}),e!=="calendars"&&(W=!1,me=null),e!=="contacts"&&(pe=null),t.clearFlash!==!1&&A(),m=!0,u();try{e==="contacts"&&F!==null?await Ke(F):e==="calendars"?await Me():e==="tasks"?await Ge():e==="notes"?await ut():e==="files"&&await je()}catch(a){L.warn("tab load failed",a instanceof Error?a.message:a),h("error",a instanceof Error?a.message:"Failed to load")}finally{m=!1,u()}}async function je(){dt=!0;try{L.debug("loadFiles",{path:Se});const[e,t]=await Promise.all([I.filesStatus(),I.filesList(Se).catch(a=>{if(a instanceof Ce&&(a.status===503||a.status===404))return{path:Se,entries:[]};throw a})]);if(Kt=e,e.ready){Se=t.path,ye=t.entries;const a=new Set(ye.map(l=>l.path));te=te.filter(l=>a.has(l))}else ye=[],te=[];L.event("loadFiles",{path:Se,count:ye.length,enabled:e.enabled,ready:e.ready})}finally{dt=!1}}function ua(e){if(!Ht){if(!c){Yt();return}Ht=!0;try{L.event("session.expired"),zt(),Tt=!0,D={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},u()}finally{Ht=!1}}}let he=[],it=[],We=[],Ye=[],At="",It="",Je="due",_e="asc",ct="dtstart",tt="desc",ke=null,Le=null,U=null,Q=null,X=!1,ce=!1,ie=[],Kt=null,Se="",ye=[],dt=!1,de=null,se=null,Z=null,qe=!1,te=[];function h(e,t){Tt&&e==="error"||(e!=="error"&&(Tt=!1),D={type:e,message:t})}function A(){D=null,Tt=!1}async function Ua(){L.event("bootstrap.start"),Gn(e=>{ua(/timed\s*out|session expired/i.test(e)?e:"Your session timed out. Please sign in again.")}),Xn(()=>{Jt()});try{const e=await I.ui();Wt(e.ui),typeof e.version=="string"&&e.version.trim()!==""?ht=e.version.trim():e.ui&&typeof e.ui.version=="string"&&e.ui.version.trim()!==""&&(ht=e.ui.version.trim())}catch(e){L.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await I.me();c=e.user,Wt(e.ui),typeof e.version=="string"&&e.version.trim()!==""&&(ht=e.version.trim()),L.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),Jt(),da(),Rt(w),await Ae()}catch(e){e instanceof Ce&&e.status===401?(zt(),/timed\s*out|session expired/i.test(e.message)&&h("info",e.message),L.event("bootstrap.anonymous")):(L.error("bootstrap failed",e instanceof Error?e.message:e),h("error",e instanceof Error?e.message:"Failed to load"))}u()}async function Ae(){L.debug("loadHome");const[e,t,a]=await Promise.all([I.calendars(),I.directory().catch(()=>({users:[]})),I.addressbooks()]);if(x=e.calendars,Y=t.users,we=a.addressbooks,L.event("loadHome",{calendars:x.length,addressBooks:we.length,directory:Y.length}),oe.length===0)try{oe=(await I.holidayCountries()).countries}catch{oe=[]}if(E!==null&&!x.some(l=>l.id===E)&&(E=null,Ee=[],W=!1,me=null),E===null){const l=ma();l&&(E=l.id)}E!==null&&W?await gt(E):E!==null&&(Ee=[]),w==="calendars"&&await Me(),F!==null&&!we.some(l=>l.id===F)&&(F=null,Be=[],ee=null,N=null,ne=!1),pe!==null&&!we.some(l=>l.id===pe)&&(pe=null),F===null&&we.length>0&&(F=we[0].id),F!==null&&w==="contacts"&&await Ke(F),w==="tasks"&&await Ge(),w==="notes"&&await ut(),w==="files"&&await je()}async function gt(e){Ee=(await I.shares(e)).shares}function ma(){const e=x.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function re(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${l}`}function Ba(e,t){const a=new Date(e,t,1),l=new Date(e,t+1,0);return{from:re(a),to:re(l)}}function Gt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,l,o]=e.split("-").map(Number);return new Date(a,l-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,l,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Va(e){const t=Gt(e.start);if(!e.end)return[re(t)];let a=Gt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const r=new Date(e.end);!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getSeconds()===0&&r.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[re(t)];const l=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(re(o)),o.setDate(o.getDate()+1);return l.length?l:[re(t)]}function Xt(e,t){const a=e.slice(0,10),l=(t||a).slice(0,10);if(a===l){const M=$t(a);return{start:M.start,end:M.end}}const[o,p,n]=a.split("-").map(Number),[r,i,f]=l.split("-").map(Number),b=ze(new Date(o,p-1,n,9,0,0,0)),g=ze(new Date(r,i-1,f,17,0,0,0));return{start:b,end:g}}function ja(e,t){const a=at(e);let l=t?at(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const p=Gt(t);p.setDate(p.getDate()-1),l=re(p)}}return{start:a,end:l}}async function Me(){if(E===null){z=[];return}const{from:e,to:t}=Ba(H.y,H.m);Fe=!0,L.debug("loadMonthEvents",{selectedId:E,from:e,to:t});try{z=(await I.calendarEvents(E,e,t)).events,L.event("monthEvents.loaded",{calendarId:E,count:z.length,from:e,to:t})}catch(a){z=[],L.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Fe=!1}}function _a(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Ha(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Qt())} ${t}`}function Wa(){const e=E!==null?x.find(T=>T.id===E):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",l=H.y,o=H.m,p=new Date(l,o,1),n=Zt(),r=(p.getDay()-n+7)%7,i=new Date(l,o+1,0).getDate(),f=new Date(l,o,0).getDate(),g=re(new Date),M=pa(),v=new Map;for(const T of z)for(const J of Va(T)){const j=v.get(J)??[];j.push(T),v.set(J,j)}const S=[],C=Math.ceil((r+i)/7)*7;for(let T=0;T<C;T++){let J,j=!0,$;T<r?(J=f-r+T+1,j=!1,$=new Date(l,o-1,J)):T>=r+i?(J=T-(r+i)+1,j=!1,$=new Date(l,o+1,J)):(J=T-r+1,$=new Date(l,o,J));const _=re($),B=_===g,ue=j?v.get(_)??[]:[],ge=ft===_?50:3,De=ue.slice(0,ge),rt=ue.length-De.length,He=De.map(St=>{const na=E??0,Ft=Ha(St);return`<button type="button" class="month-event${St.allDay?"":" is-timed"}" title="${d(Ft)}" style="--ev-color:${d(a)}"
            data-action="open-event" data-instance="${na}" data-uri="${d(St.uri)}" ${m?"disabled":""}>${d(Ft)}</button>`}).join(""),ta=rt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${d(_)}" title="Show all events this day" ${m?"disabled":""}>+${rt} more</button>`:"",aa=!j&&(J===1||T===r+i)?$.toLocaleString(void 0,{month:"short",day:"numeric"}):String(J),Pt=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));S.push(`<div class="month-cell${j?"":" is-outside"}${B?" is-today":""}${Pt?" is-clickable":""}"${Pt?` data-action="new-event-day" data-day="${d(_)}" role="button" tabindex="0" title="Add event on ${d(_)}"`:""}>
        <div class="month-daynum${B?" is-today-num":""}">${d(aa)}</div>
        <div class="month-events">${He}${ta}</div>
      </div>`)}const K=e?Fe?'<p class="muted small month-empty-hint">Loading events…</p>':"":x.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${m?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${m?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${m?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${d(_a(l,o))}</h2>
        <span class="month-cal-name muted small" title="${d(t)}">
          <span class="cal-swatch" style="background:${d(a)};margin-top:0"></span>
          ${d(t)}
        </span>
      </div>
      ${K}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${M.map(T=>`<div class="month-dow">${d(T)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${S.join("")}
        </div>
      </div>
    </section>`}function at(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):re(t)}function Ya(){if(ot.timeFormat==="24h")return!1;if(ot.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Qt(){return Ya()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Zt(){var a;if(ot.weekStart==="monday")return 1;if(ot.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of e)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function pa(){const e=Zt(),t=new Date(2024,0,7+e),a=[];for(let l=0;l<7;l++){const o=new Date(t);o.setDate(t.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function fa(e,t=15){const a=t*60*1e3,l=e.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function ze(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Ja(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const l=e.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Qt()})}function vt(e){if(!e){const a=fa(new Date);return{date:re(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:re(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function $t(e){const t=new Date,a=re(t);if(e&&e!==a){const[p,n,r]=e.split("-").map(Number),i=new Date(p,n-1,r,9,0,0,0),f=new Date(p,n-1,r,10,0,0,0);return{start:ze(i),end:ze(f)}}const l=fa(t,15),o=new Date(l.getTime()+3600*1e3);return{start:ze(l),end:ze(o)}}function za(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function nt(e){const{field:t,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:r,allowClear:i=!0}=e,f=(O==null?void 0:O.field)===t,b=Ja(o,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${d(t)}">
      <span class="dt-field-label">${d(l)}</span>
      <input type="hidden" name="${d(a)}" value="${d(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${d(t)}"
        data-dt-name="${d(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${r?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${d(b)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!r?Ka(t,o,p,i):""}
    </div>`}function ea(e){var t;return e==="start"?String((y==null?void 0:y.start)||""):e==="end"?String((y==null?void 0:y.end)||""):e==="until"?((t=y==null?void 0:y.repeat)==null?void 0:t.until)||at(y==null?void 0:y.start)||re(new Date):e==="due"?mt(U==null?void 0:U.due):e==="dtstart"?mt(Q==null?void 0:Q.dtstart):e==="bulk-due"?Et:e==="birthday"?String((N==null?void 0:N.birthday)||""):""}function Pe(e,t){if(e==="start"&&y){y={...y,start:t||""};return}if(e==="end"&&y){y={...y,end:t};return}if(e==="until"&&y){y={...y,repeat:{...y.repeat??Ot(),until:t,endMode:"until"}};return}if(e==="due"&&U){if(t===null||t==="")U={...U,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))U={...U,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));U={...U,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&Q){if(t===null||t==="")Q={...Q,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))Q={...Q,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));Q={...Q,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&N){N={...N,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Et=t||"")}function Ka(e,t,a,l){const o=vt(t),p=(O==null?void 0:O.viewY)??Number(o.date.slice(0,4)),n=(O==null?void 0:O.viewM)??Number(o.date.slice(5,7))-1,r=Zt(),i=pa(),b=(new Date(p,n,1).getDay()-r+7)%7,g=new Date(p,n+1,0).getDate(),M=new Date(p,n,0).getDate(),v=o.date,S=o.hm,C=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),K=[],T=Math.ceil((b+g)/7)*7;for(let j=0;j<T;j++){let $,_,B=!1;j<b?($=M-b+j+1,_=new Date(p,n-1,$),B=!0):j>=b+g?($=j-(b+g)+1,_=new Date(p,n+1,$),B=!0):($=j-b+1,_=new Date(p,n,$));const ue=re(_),ge=ue===v,De=ue===re(new Date);K.push(`<button type="button" class="dt-day${B?" is-outside":""}${ge?" is-selected":""}${De?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${d(ue)}">${$}</button>`)}const J=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${za().map(j=>{const $=(()=>{const[_,B]=j.split(":").map(Number);return new Date(2e3,0,1,_,B).toLocaleTimeString(void 0,Qt())})();return`<button type="button" class="dt-time${j===S?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${j}" role="option" aria-selected="${j===S}">${d($)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${d(C)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(j=>`<span class="dt-dow">${d(j)}</span>`).join("")}</div>
          <div class="dt-days">${K.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${d(e)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${J}
      </div>
    </div>`}function Ga(){s.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const l=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let r=l.bottom+6;r+n>window.innerHeight-o&&(r=Math.max(o,l.top-n-6));let i=l.left;i+p>window.innerWidth-o&&(i=Math.max(o,window.innerWidth-p-o)),i<o&&(i=o),a.style.top=`${Math.round(r)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function Ot(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Xa(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Qa(){if(!$e||!y)return"";const e=y,t=e.repeat??Ot(),a=(t.freq||"").toUpperCase(),l=x.filter(v=>v.canShare||v.access==="readwrite"),o=x.filter(v=>v.id===e.instanceId?!0:v.readOnly?!1:v.canShare||v.access==="readwrite").map(v=>`<option value="${v.id}" ${v.id===e.instanceId?"selected":""}>${d(v.displayname)}</option>`).join(""),p=e.readOnly||!e.canWrite;let n,r;if(e.allDay)n=at(e.start),r=at(e.end);else{const v=e.start||"",S=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const C=Xt(v,S||null);n=C.start,r=C.end||""}else n=mt(e.start),r=mt(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(v=>v.toUpperCase())),b=Xa(t),g=!!a&&b==="until",M=t.until||(b==="until"?at(e.start)||re(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${Oe?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Qe()}
          ${!Oe&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
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
              ${nt({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:p,allowClear:!1})}
              ${nt({field:"end",name:"end",label:"End",value:r,dateOnly:e.allDay,disabled:p||g,allowClear:!g})}
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
                      ${i.map(v=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${v.code}" ${f.has(v.code)?"checked":""} />
                              ${v.label}
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
                      ${b==="until"?nt({field:"until",name:"repeatUntil",label:"Until",value:M,dateOnly:!0,disabled:p,allowClear:!0}):b==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${d(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${Oe?"Create event":"Save event"}</button>
                     ${Oe?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${m?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Za(e,t){const a=x.find(l=>l.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:Ot(),readOnly:!1,canWrite:!0}}async function Ke(e){Be=(await I.contacts(e,et)).contacts,ee!==null&&!Be.some(a=>a.uri===ee)&&(ee=null,ne||(N=null,be=null,Ne=null,xe=!1))}async function Ge(){const e=await I.tasks({q:At,sort:Je,order:_e});he=e.tasks,We=e.calendars;const t=new Set(he.map(a=>ae(a.instanceId,a.uri)));ie=ie.filter(a=>t.has(a)),ke!==null&&!he.some(a=>`${a.instanceId}|${a.uri}`===ke)&&(ke=null,X||(U=null))}async function ut(){const e=await I.notes({q:It,sort:ct,order:tt});it=e.notes,Ye=e.calendars,Le!==null&&!it.some(t=>`${t.instanceId}|${t.uri}`===Le)&&(Le=null,ce||(Q=null))}function ae(e,t){return`${e}|${t}`}function ba(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function mt(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Xe(e,t,a,l,o,p=""){const n=a===t,r=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${d(t)}" role="columnheader" tabindex="0">${d(e)}${r}</th>`}async function en(e){if(F===null)return;const t=await I.getContact(F,e);ee=e,ne=!1;const a=t.contact;N={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??ha(),birthday:a.birthday??null},be=a.photoDataUri??(a.hasPhoto&&F!==null?`${I.contactPhotoUrl(F,e)}?t=${Date.now()}`:null),Ne=null,xe=!1,fe=!0}function tn(){ne=!0,ee=null,fe=!0,N={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},be=null,Ne=null,xe=!1}function ha(){return{street:"",city:"",region:"",postal:"",country:""}}function an(e){return new Promise((t,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");t(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(e)})}function ya(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>AngaraDAV User Portal</span>`,l=c?d(c.displayname||c.username):"",o=xt()?`<button type="button" class="user-menu-item${w==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
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
        </nav>`,i=!(W||G||me!==null||pe!==null||$e||fe||Te)?Qe():"",f=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${d(ht)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(Zn)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${n}
      <main class="container">
        ${i}
        ${e}
      </main>
      ${f}
      ${as()}
      ${nn()}`}function Qe(){return D?`<div class="flash flash-${d(D.type)}" role="status">
      <span class="flash-text">${d(D.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function ga(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function pt(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),l=t%60;return a>0?`${a}m ${l}s`:`${l}s`}function Re(){Nt!==null&&(clearInterval(Nt),Nt=null)}function va(){Re(),Nt=setInterval(()=>{if(!R||R.phase==="done"||R.phase==="error"){Re();return}R={...R,elapsedSec:Math.floor((Date.now()-R.startedAt)/1e3)},R.phase==="processing"&&ka(R)},1e3)}function Ze(e,t={}){R&&(R={...R,phase:e,elapsedSec:Math.floor((Date.now()-R.startedAt)/1e3),...t},u())}function $a(){Re(),R=null,u()}function wa(e){!R||R.phase==="done"||R.phase==="error"||(R={...R,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-R.startedAt)/1e3)},ka(R))}function ka(e){const t=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),l=s.querySelector(".import-progress-track"),o=s.querySelector("[data-import-counts]"),p=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${p} (${e.processPercent??0}%) · ${pt(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${pt(e.elapsedSec)}`;else return;t&&(t.textContent=n),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),l&&e.processPercent!==null&&(l.setAttribute("aria-valuenow",String(e.processPercent)),l.removeAttribute("aria-valuetext"))}function nn(){if(!R)return"";const e=R,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const r=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return r.map((b,g)=>{let M="pending";return e.phase==="done"||g<f?M="done":g===f&&(M=(e.phase==="error","active")),`<li class="import-step import-step-${M}"><span class="import-step-icon" aria-hidden="true">${M==="done"?"✓":M==="active"?"●":"○"}</span> ${d(b.label)}</li>`}).join("")})();let p="";if(t){let r=null;e.phase==="reading"&&e.readPercent!==null?r=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(r=Math.min(100,Math.max(0,e.processPercent)));const i=r===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=r!==null?` style="width:${r}%"`:"",b=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${b} (${e.processPercent??0}%) · ${pt(e.elapsedSec)}`:g=`Importing on server… ${pt(e.elapsedSec)}`;const M=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${d(a)}</strong> from
          <span class="mono">${d(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${d(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${i}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${d(g)}</p>
        ${M}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?p=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${d(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · Took ${d(pt(e.elapsedSec))}
        </p>`:p=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${d(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${d(e.fileName)}</span>
          · After ${d(pt(e.elapsedSec))}
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
      </div>`}function Sa(e,t){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?t(Math.min(100,Math.round(p.loaded/p.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(e)})}function Da(){s.innerHTML=ya(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function sn(){if(!c){Da();return}const e=x.filter(k=>k.canShare),t=x.filter(k=>!k.canShare),a=x.find(k=>k.id===E)??null,l=e.map(k=>{const le=k.id===E?" is-selected":"",Ue=k.color?`<span class="cal-swatch" style="background:${d(k.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Dt=sa(k.access)+(k.readOnly?'<span class="badge">read-only</span>':"")+(k.holidaysCountry?`<span class="badge badge-admin">holidays ${d(k.holidaysCountry)}</span>`:"");return`<div class="cal-row${le}" data-action="select-cal" data-id="${k.id}" role="button" tabindex="0">
          ${Ue}
          <span class="cal-row-text">
            <span class="cal-row-title">${d(k.displayname)}</span>
            <span class="cal-row-badges">${Dt}</span>
            <span class="muted small mono cal-row-uri">${d(k.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${k.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${k.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map(k=>{const le=k.id===E?" is-selected":"",Ue=k.color?`<span class="cal-swatch" style="background:${d(k.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Dt=k.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${le}" data-action="select-cal" data-id="${k.id}" role="button" tabindex="0" title="${d(Dt)}">
          ${Ue}
          <span class="cal-row-text">
            <span class="cal-row-title">${d(k.displayname)}</span>
            <span class="cal-row-badges">${sa(k.access)}</span>
            <span class="muted small">${k.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=Y.map(k=>`<option value="${d(k.username)}">${d(k.displayname)} (${d(k.username)})</option>`).join(""),n=Ee.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':Ee.map(k=>`<tr>
                <td>
                  <strong>${d(k.displayname||k.username||k.href)}</strong>
                  <div class="muted small mono">${d(k.username||k.href)}</div>
                </td>
                <td>${sa(k.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d(k.href)}" ${m?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),r=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),f=W&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Qe()}
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
                        <input type="color" name="color_picker" value="${d(r)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${d(a.color||r)}"
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
                  ${ve(`Share “${a.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${Y.length===0?"disabled":""}>
                        <option value="">${Y.length?"Select user…":"No other users"}</option>
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
                      <button type="submit" class="btn btn-primary" ${m||Y.length===0?"disabled":""}>Share</button>
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
                  ${ve("Import / export","import-export")}
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
          </div>`:"",b=me!==null?x.find(k=>k.id===me&&k.canShare)??null:null,g=b?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Qe()}
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
        </div>`:"",M=G?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Qe()}
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
                    ${oe.map(k=>`<option value="${d(k.code)}">${d(k.name)} (${d(k.code)})</option>`).join("")}
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
        </div>`:"",v=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ve("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${ve("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${m?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Wa()}
      </div>
      ${M}
      ${f}
      ${g}
      ${Qa()}`,S=we.map(k=>`<div class="cal-row${k.id===F?" is-selected":""}" data-action="select-ab" data-id="${k.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${d(k.displayname)}</span>
            <span class="muted small">${k.cardCount} contact${k.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${d(k.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${k.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${k.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),C=we.find(k=>k.id===F)??null,K=Be.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${et?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Be.map(k=>{const le=!ne&&k.uri===ee?" is-selected":"",Ue=d((k.displayname||"?").slice(0,1).toUpperCase()),Dt=k.hasPhoto&&F!==null?`<img class="contact-avatar" src="${d(I.contactPhotoUrl(F,k.uri))}" alt="" loading="lazy" data-avatar-fallback="${Ue}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Ue}</span>`;return`<tr class="contact-table-row${le}" data-action="select-contact" data-uri="${d(k.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Dt}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${d(k.displayname)}</span>
                      ${k.org?`<span class="muted small contact-name-secondary">${d(k.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${d(k.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${d(k.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${d(k.org||"—")}</span></td>
              </tr>`}).join(""),T=N,J=Array.isArray(T==null?void 0:T.emails)&&T.emails.length>0?T.emails:[""],j=Array.isArray(T==null?void 0:T.phones)&&T.phones.length>0?T.phones:[{type:"cell",value:""}],$=(T==null?void 0:T.address)??ha(),_=J.map((k,le)=>`<div class="multi-row" data-multi="email" data-idx="${le}">
          <input type="email" name="email_${le}" value="${d(k??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${le}" ${J.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),B=j.map((k,le)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${le}">
          <select name="phone_type_${le}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Ue=>`<option value="${Ue}" ${((k==null?void 0:k.type)??"other")===Ue?"selected":""}>${Ue}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${le}" value="${d((k==null?void 0:k.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${le}" ${j.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ue=Array.isArray(T==null?void 0:T.custom)?T.custom:[],ge=ue.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ue.map((k,le)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${le}">
                <input type="text" name="custom_label_${le}" value="${d(k.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${le}" value="${d(k.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${le}" title="Remove">×</button>
              </div>`).join(""),De=fe&&T&&C?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${ne?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Qe()}
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
                      ${_}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${J.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${B}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${j.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${d($.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${d($.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${d($.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${d($.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${d($.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${d(T.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${nt({field:"birthday",name:"birthday",label:"Birthday",value:T.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${ge}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ue.length>=30?"disabled":""}>+ Custom field</button>
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
          </div>`:"",rt=Te&&C?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Qe()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${d(C.uri)} · ${C.cardCount} contact${C.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${d(C.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${d(C.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${d(C.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ve("Import / export","contact-import-export")}
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
          </div>`:"",He=pe!==null?we.find(k=>k.id===pe)??null:null,ta=He?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Qe()}
              <p>You are about to permanently delete <strong>${d(He.displayname)}</strong>
                <span class="muted small mono">(${d(He.uri)})</span>.</p>
              <p class="muted small">${(He.cardCount??0)>0?`All ${He.cardCount} contact${He.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${He.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",aa=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ve("Address books","address-books")}
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
          ${C?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${ve("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${d(et)}" aria-label="Search contacts" ${m?"disabled":""} />
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
                        ${K}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${ta}
      ${rt}
      ${De}`,Pt=w==="calendars"?"my-calendars":w==="contacts"?"my-contacts":w==="tasks"?"tasks":w==="notes"?"notes":w==="files"?"files":"administration",St=pn(),na=fn(),Ft=on(),jn=cn(),_n=w==="calendars"?v:w==="contacts"?aa:w==="tasks"?St:w==="notes"?na:w==="files"?Ft:jn,Hn=w!=="admin"?`<header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${w==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${w==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${w==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${w==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${w==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${w==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${w==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${w==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${w==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${w==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${Pt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>`:`<header class="page-header page-header-admin">
        ${ve("Administration","administration","h1")}
        <button type="button" class="btn btn-ghost btn-small" data-action="tab" data-tab="calendars"
          title="Back to portal">← Portal</button>
      </header>`;s.innerHTML=ya(`
      ${Hn}

      ${_n}
    `),document.body.classList.toggle("cal-modal-open",W||G||me!==null||pe!==null||$e||fe||Te||R!==null||de!==null||se!==null||Z!==null||qe),document.body.classList.toggle("layout-contacts",w==="contacts"),document.body.classList.toggle("layout-calendars",w==="calendars"),document.body.classList.toggle("layout-tasks",w==="tasks"||w==="notes"),document.body.classList.toggle("layout-files",w==="files"),document.body.classList.toggle("layout-admin",w==="admin")}function rn(e){const t=e?e.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${m?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${d(p)}" ${m?"disabled":""}>${d(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function st(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Ca(e){if(!Number.isFinite(e)||e<0)return"—";if(e===0)return"unlimited";const t=Math.round(e/(1024*1024));if(t<=0)return st(e);if(t>=1024&&t%1024===0){const a=t/1024;return a===1?"1 GB":`${a} GB`}return`${t} MB`}function ln(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function on(){const e=Kt;if(!e)return`<div class="card"><p class="muted">${dt||m?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ve("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ve("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${d(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${d(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${st(e.usedBytes)} used · ${st(e.availableBytes)} free of ${st(e.quotaBytes)}`:`${st(e.usedBytes)} used · ${st(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,l=te.length,o=ye.length>0&&ye.every(v=>te.includes(v.path)),p=l>0,n=l>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${l} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${m?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${m?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${m?"disabled":""}>Delete</button>
            </div>
          </div>`:"",r=ye.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':ye.map(v=>{const S=te.includes(v.path),C=v.type==="dir"?"📁":"📄",K=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${d(v.path)}" ${m?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${C}</span>${d(v.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${C}</span>${d(v.name)}</span>`,T=v.type==="dir"?"—":st(v.size);return`<tr class="files-row${S?" is-checked":""}" data-path="${d(v.path)}" data-type="${v.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${d(v.path)}"
                    ${S?"checked":""} ${m?"disabled":""}
                    aria-label="Select ${d(v.name)}" />
                </td>
                <td class="files-col-name">${K}</td>
                <td class="files-col-size mono">${T}</td>
                <td class="files-col-mtime hide-sm">${d(ln(v.mtime))}</td>
                <td class="files-col-actions">
                  ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${d(I.filesDownloadUrl(v.path))}" download="${d(v.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${d(v.path)}" ${m?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${d(v.path)}" ${m?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${m?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${d(v.path)}" data-name="${d(v.name)}" ${m?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),i=de!==null?(()=>{const v=ye.find(C=>C.path===de),S=(v==null?void 0:v.name)??"";return`<div class="cal-modal" id="files-rename-modal" role="dialog" aria-modal="true" aria-labelledby="files-rename-title">
              <div class="cal-modal-backdrop" data-action="files-rename-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-rename-title">Rename</h3>
                  <button type="button" class="info-modal-close" data-action="files-rename-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-rename" id="files-rename-form">
                  <div class="cal-modal-body">
                    <input type="hidden" name="path" value="${d(de)}" />
                    <label>New name
                      <input type="text" name="newName" value="${d(S)}" required maxlength="255" autocomplete="off" />
                    </label>
                  </div>
                  <footer class="cal-modal-footer">
                    <button type="button" class="btn btn-ghost" data-action="files-rename-close">Cancel</button>
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Rename</button>
                  </footer>
                </form>
              </div>
            </div>`})():"",f=se!==null&&se.length>0?(()=>{const v=se,S=v.length>1,C=ye.find(J=>J.path===v[0]),K=S?`Delete ${v.length} items`:`Delete ${(C==null?void 0:C.type)==="dir"?"folder":"file"}`,T=S?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${v.slice(0,12).map(J=>{const j=ye.find($=>$.path===J);return`<li><span class="mono">${d((j==null?void 0:j.name)??J)}</span></li>`}).join("")}
                   ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${d((C==null?void 0:C.name)??v[0])}</strong>?${(C==null?void 0:C.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return`<div class="cal-modal" id="files-delete-modal" role="dialog" aria-modal="true" aria-labelledby="files-delete-title">
              <div class="cal-modal-backdrop" data-action="files-delete-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-delete-title">${d(K)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-delete-close" aria-label="Close">×</button>
                </header>
                <div class="cal-modal-body">
                  ${T}
                </div>
                <footer class="cal-modal-footer">
                  <button type="button" class="btn btn-ghost" data-action="files-delete-close">Cancel</button>
                  <button type="button" class="btn btn-danger" data-action="files-delete-confirm" ${m?"disabled":""}>Delete</button>
                </footer>
              </div>
            </div>`})():"",b=Z!==null&&Z.paths.length>0?(()=>{const v=Z.op,S=Z.paths,C=S.length>1,K=ye.find($=>$.path===S[0]),T=(K==null?void 0:K.name)??Lt(S[0]),J=C?`${v==="copy"?"Copy":"Move"} ${S.length} items`:`${v==="copy"?"Copy":"Move"} ${(K==null?void 0:K.type)==="dir"?"folder":"file"}`,j=Se;return`<div class="cal-modal" id="files-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="files-transfer-title">
              <div class="cal-modal-backdrop" data-action="files-transfer-close"></div>
              <div class="cal-modal-card cal-modal-card-sm">
                <header class="cal-modal-header">
                  <h3 id="files-transfer-title">${d(J)}</h3>
                  <button type="button" class="info-modal-close" data-action="files-transfer-close" aria-label="Close">×</button>
                </header>
                <form class="stack" data-form="files-transfer">
                  <div class="cal-modal-body">
                    ${C?`<p class="muted small" style="margin:0 0 0.75rem">${S.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${d(T)}</span></p>`}
                    <label>Destination folder
                      <input type="text" name="toPath" value="${d(j)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${C?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${d(T)}" maxlength="255" autocomplete="off" />
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
            </div>`})():"",g=qe?`<div class="cal-modal" id="files-mkdir-modal" role="dialog" aria-modal="true" aria-labelledby="files-mkdir-title">
          <div class="cal-modal-backdrop" data-action="files-mkdir-close"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="files-mkdir-title">New folder</h3>
              <button type="button" class="info-modal-close" data-action="files-mkdir-close" aria-label="Close">×</button>
            </header>
            <form class="stack" data-form="files-mkdir">
              <div class="cal-modal-body">
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${d(Se===""?"Home":Se)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="files-mkdir-close">Cancel</button>
                <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Create</button>
              </footer>
            </form>
          </div>
        </div>`:"",M=[`DAV clients: <span class="mono">${d(e.davPath)}</span>`,`max upload ${d(Ca(e.maxUploadBytes))}`,e.quotaBytes>0?`quota ${d(Ca(e.quotaBytes))}`:"quota unlimited"].join(" · ");return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${ve("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${d(t)}</span>
          </div>
        </div>
        <p class="muted small" style="margin:0.5rem 0 0">
          ${M}
        </p>
        <div class="files-toolbar">
          ${rn(Se)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${m||dt?"disabled":""}>Refresh</button>
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
              ${dt&&ye.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':r}
            </tbody>
          </table>
        </div>
      </section>
      ${i}
      ${f}
      ${b}
      ${g}
    </div>`}function Lt(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function cn(){return xt()?`<div class="portal-grid portal-grid-admin">
      <section class="card admin-section">
        ${ve("Server administration","administration")}
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
    </div>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function dn(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,b)=>[ae(f.instanceId,f.uri),b])),l=new Map,o=[];for(const f of e){const b=f.parentUid;if(b&&t.has(b)&&b!==f.uid){const g=l.get(b)??[];g.push(f),l.set(b,g)}else o.push(f)}const p=(f,b)=>(a.get(ae(f.instanceId,f.uri))??0)-(a.get(ae(b.instanceId,b.uri))??0);o.sort(p);for(const[,f]of l)f.sort(p);const n=[],r=new Set,i=(f,b)=>{const g=f.uid||ae(f.instanceId,f.uri);if(!r.has(g)){r.add(g),n.push({task:f,depth:Math.min(b,8)});for(const M of l.get(f.uid)??[])i(M,b+1);r.delete(g)}};for(const f of o)i(f,0);for(const f of e)n.some(b=>b.task===f)||n.push({task:f,depth:0});return n}function un(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const l of he)l.parentUid&&t.has(l.parentUid)&&l.uid&&!t.has(l.uid)&&(t.add(l.uid),a=!0)}return t}function mn(e,t){const a=e.instanceId,l=t||!e.uid?new Set:un(e.uid),o=he.filter(r=>r.uid&&r.instanceId===a&&!l.has(r.uid)&&r.uid!==e.uid),p=e.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(r=>`<option value="${d(r.uid)}" ${r.uid===p?"selected":""}>${d(r.summary||r.uid)}</option>`)];if(p&&!o.some(r=>r.uid===p)){const r=he.find(i=>i.uid===p);n.push(`<option value="${d(p)}" selected>${d((r==null?void 0:r.summary)||p)} (current)</option>`)}return n.join("")}function Ea(){const e=new Set(ie);return he.filter(t=>e.has(ae(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function pn(){const e=S=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[S]||S,t=dn(he),a=he.filter(S=>S.canWrite&&!S.readOnly).map(S=>ae(S.instanceId,S.uri)),l=a.length>0&&a.every(S=>ie.includes(S)),o=ie.length>0,n=Ea().length,r=he.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${At?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:S,depth:C})=>{const K=ae(S.instanceId,S.uri),T=!X&&K===ke?" is-selected":"",J=ie.includes(K),j=S.status==="COMPLETED"?"badge-ok":S.status==="CANCELLED"?"":"badge-admin",$=C>0?` style="--task-depth:${C}"`:"",_=C>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",B=S.canWrite&&!S.readOnly;return`<tr class="contact-table-row task-row${C>0?" is-subtask":""}${T}${J?" is-checked":""}" data-action="select-task" data-instance="${S.instanceId}" data-uri="${d(S.uri)}" tabindex="0" role="button"${$}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${S.instanceId}" data-uri="${d(S.uri)}"
                    ${J?"checked":""} ${B?"":"disabled"} aria-label="Select ${d(S.summary||S.uri)}" ${m?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${_}<span class="contact-name-primary">${d(S.summary||S.uri)}</span></span>
                  ${S.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${j}">${d(e(S.status))}</span></td>
                <td class="col-task-due muted small">${d(ba(S.due))}</td>
                <td class="col-task-cal muted small">${d(S.calendarName)}</td>
                <td class="col-task-pct muted small">${S.percent?d(String(S.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(S,C)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${S}"
        title="${d(C)}" aria-label="${d(C)}" ${m||n===0?"disabled":""}>${i}</button>`,b=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${ie.length!==n?`<span class="muted small bulk-bar-count-extra">(${ie.length-n} read-only skipped)</span>`:""}
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
                ${nt({field:"bulk-due",name:"bulkDue",label:"Due",value:Et,dateOnly:!1,disabled:m||n===0,allowClear:!0})}
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
          </div>`:"",g=U,M=We.map(S=>`<option value="${S.id}" ${g&&g.instanceId===S.id?"selected":""}>${d(S.displayname)}</option>`).join(""),v=g?`<div class="card">
            ${ve(X?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${X?`<label>Calendar
                      <select name="instanceId" required ${We.length===0?"disabled":""}>
                        <option value="">${We.length?"Select calendar…":"No writable calendars"}</option>
                        ${M}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(g.summary)}" ${g.readOnly&&!X?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!X?"readonly":""}>${d(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!X?"disabled":""}>
                  ${mn(g,X)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!X?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(S=>`<option value="${S}" ${g.status===S?"selected":""}>${d(e(S))}</option>`).join("")}
                  </select>
                </label>
                ${nt({field:"due",name:"due",label:"Due",value:mt(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!X),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${d(String(g.priority||0))}" ${g.readOnly&&!X?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${d(String(g.percent||0))}" ${g.readOnly&&!X?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${X||g.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${X?"Create task":"Save task"}</button>`:""}
                ${!X&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${m?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${m?"disabled":""}>Delete</button>`:X?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ve("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${d(At)}" aria-label="Search tasks" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${m||We.length===0?"disabled":""}>Add task</button>
        </div>
        ${b}
        ${We.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||m?"disabled":""} />
                </th>
                ${Xe("Title","summary",Je,_e,"task","col-task-title")}
                ${Xe("Status","status",Je,_e,"task","col-task-status")}
                ${Xe("Due","due",Je,_e,"task","col-task-due")}
                ${Xe("Calendar","calendar",Je,_e,"task","col-task-cal")}
                ${Xe("%","percent",Je,_e,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${r}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${v}
      </section>
    </div>`}function fn(){const e=it.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${It?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:it.map(o=>{const p=ae(o.instanceId,o.uri),n=!ce&&p===Le?" is-selected":"",r=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${d(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${d(o.summary||o.uri)}</span>
                  ${r?`<span class="muted small contact-name-secondary">${d(r)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${d(ba(o.dtstart))}</td>
                <td class="col-note-cal muted small">${d(o.calendarName)}</td>
              </tr>`}).join(""),t=Q,a=Ye.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${d(o.displayname)}</option>`).join(""),l=t?`<div class="card">
            ${ve(ce?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${ce?`<label>Calendar
                      <select name="instanceId" required ${Ye.length===0?"disabled":""}>
                        <option value="">${Ye.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${d(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${d(t.summary)}" ${t.readOnly&&!ce?"readonly":""} />
              </label>
              ${nt({field:"dtstart",name:"dtstart",label:"Date",value:mt(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!ce),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!ce?"readonly":""}>${d(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${ce||t.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${ce?"Create note":"Save note"}</button>`:""}
                ${!ce&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${m?"disabled":""}>Delete</button>`:ce?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ve("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${d(It)}" aria-label="Search notes" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${m||Ye.length===0?"disabled":""}>Add note</button>
        </div>
        ${Ye.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Xe("Title","summary",ct,tt,"note","col-note-title")}
                ${Xe("Date","dtstart",ct,tt,"note","col-note-date")}
                ${Xe("Calendar","calendar",ct,tt,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function bn(){const e=s.querySelector(".contacts-table-wrap"),t=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function hn(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=s.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=s.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=s.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function u(){const e=bn();c?sn():Da(),yn(),hn(e),requestAnimationFrame(()=>{var t;Ga(),(t=s.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Na(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(t.value=l.slice(0,7),a.value=l.toUpperCase())}))}function yn(){s.querySelectorAll("[data-action]").forEach($=>{$.addEventListener("click",_=>{const B=_.target.closest("[data-action]");((B==null?void 0:B.dataset.action)==="info"||(B==null?void 0:B.dataset.action)==="info-close")&&(_.preventDefault(),_.stopPropagation()),On(_)})}),yt(),P&&qa(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach($=>{$.addEventListener("keydown",_=>{(_.key==="Enter"||_.key===" ")&&(_.preventDefault(),$.click())})});const e=s.querySelector("#delete-cal-confirm"),t=s.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||m)});const a=s.querySelector("#delete-ab-confirm"),l=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||m)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach($=>{$.addEventListener("error",()=>{const _=$.dataset.avatarFallback||"?",B=document.createElement("span");B.className="contact-avatar contact-avatar-fallback",B.setAttribute("aria-hidden","true"),B.textContent=_,$.replaceWith(B)})}),ia||(document.addEventListener("keydown",$=>{if($.key==="Escape"){if(R&&(R.phase==="done"||R.phase==="error")){$a();return}if(!R){if(P){P=!1,yt(),u();return}if(de!==null||se!==null||Z!==null||qe){de=null,se=null,Z=null,qe=!1,u();return}Ta()}}}),ia=!0);const o=s.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",$=>{$.preventDefault(),Sn(o)});const p=s.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",$=>{$.preventDefault(),Dn(p)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",$=>{$.preventDefault(),En(n)});const r=s.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",$=>{$.preventDefault(),Cn(r)}),qe&&requestAnimationFrame(()=>{var $;($=r==null?void 0:r.querySelector('input[name="name"]'))==null||$.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach($=>{$.addEventListener("change",()=>{Nn($)})}),s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach($=>{$.indeterminate=!0});const i=s.querySelector('[data-form="share"]');i==null||i.addEventListener("submit",$=>{$.preventDefault(),Tn(i)});const f=s.querySelector('[data-form="edit-cal"]');f&&(Na(f),f.addEventListener("submit",$=>{$.preventDefault(),An(f)}));const b=s.querySelector('[data-form="edit-event"]');b==null||b.addEventListener("submit",$=>{$.preventDefault(),xn(b)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach($=>{$.addEventListener("change",()=>{if(!y)return;const _=s.querySelector('[data-form="edit-event"]');if(!_)return;const B=new FormData(_),ue=_.querySelector('input[name="allDay"]'),ge=kt(B);ge.endMode==="until"&&!ge.until&&(ge.until=at(String(B.get("start")??y.start??""))||re(new Date)),y={...y,summary:String(B.get("summary")??y.summary),description:String(B.get("description")??y.description),location:String(B.get("location")??y.location),instanceId:Number(B.get("instanceId"))||y.instanceId,allDay:(ue==null?void 0:ue.checked)??y.allDay,start:String(B.get("start")??y.start??""),end:String(B.get("end")??y.end??"")||null,repeat:ge,hasRrule:!!String(B.get("repeatFreq")??"").trim()},ge.freq&&ge.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),u(),ge.endMode==="until"&&requestAnimationFrame(()=>{var rt;const De=s.querySelector('input[name="repeatUntil"]');De==null||De.focus();try{(rt=De==null?void 0:De.showPicker)==null||rt.call(De)}catch{}})})});const g=s.querySelector('[data-form="create-cal"]');g&&(Na(g),g.addEventListener("submit",$=>{$.preventDefault(),In(g)}));const M=s.querySelector('[data-form="create-ab"]');M==null||M.addEventListener("submit",$=>{$.preventDefault(),qn(M)});const v=s.querySelector('[data-form="edit-ab"]');v==null||v.addEventListener("submit",$=>{$.preventDefault(),Rn(v)});const S=s.querySelector('[data-form="contact"]');S==null||S.addEventListener("submit",$=>{$.preventDefault(),Fn(S)});const C=s.querySelector('[data-form="task"]');if(C==null||C.addEventListener("submit",$=>{$.preventDefault(),vn(C)}),C){const $=C.querySelector('select[name="instanceId"]');$==null||$.addEventListener("change",()=>{if(!X||!U)return;const _=Number($.value);if(!Number.isFinite(_)||_<=0)return;const B=new FormData(C),ue=String(B.get("due")??"").trim();U={...U,instanceId:_,parentUid:U.parentUid&&he.some(ge=>ge.uid===U.parentUid&&ge.instanceId===_)?U.parentUid:null,summary:String(B.get("summary")??""),description:String(B.get("description")??""),status:String(B.get("status")??"NEEDS-ACTION"),due:ue?new Date(ue).toISOString():null,priority:Number(B.get("priority")??0),percent:Number(B.get("percent")??0)},u()})}const K=s.querySelector('[data-form="note"]');K==null||K.addEventListener("submit",$=>{$.preventDefault(),$n(K)});const T=s.querySelector('input[data-action="contact-search"]');T==null||T.addEventListener("input",()=>{Ve&&clearTimeout(Ve),Ve=setTimeout(()=>{et=T.value,F!==null&&(async()=>{try{await Ke(F),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)});const J=s.querySelector('input[data-action="task-search"]');J==null||J.addEventListener("input",()=>{Ve&&clearTimeout(Ve),Ve=setTimeout(()=>{At=J.value,(async()=>{try{await Ge(),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)});const j=s.querySelector('input[data-action="note-search"]');j==null||j.addEventListener("input",()=>{Ve&&clearTimeout(Ve),Ve=setTimeout(()=>{It=j.value,(async()=>{try{await ut(),u()}catch($){h("error",$ instanceof Error?$.message:"Search failed"),u()}})()},250)}),Ln(),kn(),wn()}async function gn(e){var o,p;const t=Ea();if(t.length===0){h("error","No writable tasks selected"),u();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;m=!0,A(),u();try{const n=await I.bulkTasks({op:"delete",items:a});ie=[],ke&&t.some(r=>ae(r.instanceId,r.uri)===ke)&&(ke=null,U=null,X=!1),await Ge(),n.failed>0?h("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk delete failed")}finally{m=!1,u()}return}let l={};if(e==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),r=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!r){h("error","Choose a status to apply"),u();return}l={status:r}}else if(e==="bulk-task-due"){const n=Et.trim();if(!n){h("error","Choose a due date to apply"),u();return}const r=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(r.getTime())){h("error","Invalid due date"),u();return}l={due:r.toISOString()}}else if(e==="bulk-task-clear-due")l={due:null};else if(e==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),r=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(r===""){h("error","Enter a percent complete (0–100)"),u();return}const i=Number(r);if(!Number.isFinite(i)||i<0||i>100){h("error","Percent must be between 0 and 100"),u();return}l={percent:Math.round(i)}}m=!0,A(),u();try{const n=await I.bulkTasks({op:"update",items:a,fields:l});if(await Ge(),U&&!X){const i=ae(U.instanceId,U.uri),f=he.find(b=>ae(b.instanceId,b.uri)===i);f&&(U={...f})}const r=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?h("error",`Updated ${r} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):h("success",`Updated ${r} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){h("error",n instanceof Error?n.message:"Bulk update failed")}finally{m=!1,u()}}async function vn(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,r=Number(t.get("priority")??0),i=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),b=f===""?null:f;m=!0,A(),u();try{if(X){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const M=await I.createTask({instanceId:g,summary:a,description:l,status:o,due:n,priority:r,percent:i,parentUid:b});X=!1,ke=ae(M.task.instanceId,M.task.uri),U=M.task,h("success",b?"Subtask created":"Task created")}else if(U){const g=await I.updateTask(U.instanceId,U.uri,{summary:a,description:l,status:o,due:n,priority:r,percent:i,parentUid:b});U=g.task,ke=ae(g.task.instanceId,g.task.uri),h("success","Task saved")}await Ge()}catch(g){h("error",g instanceof Error?g.message:"Save failed")}finally{m=!1,u()}}async function $n(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;m=!0,A(),u();try{if(ce){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const r=await I.createNote({instanceId:n,summary:a,description:l,dtstart:p});ce=!1,Le=ae(r.note.instanceId,r.note.uri),Q=r.note,h("success","Note created")}else if(Q){const n=await I.updateNote(Q.instanceId,Q.uri,{summary:a,description:l,dtstart:p});Q=n.note,Le=ae(n.note.instanceId,n.note.uri),h("success","Note saved")}await ut()}catch(n){h("error",n instanceof Error?n.message:"Save failed")}finally{m=!1,u()}}function wn(){const e=s.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),u();return}try{const l=await an(t);Ne=l,be=`data:${t.type||"image/jpeg"};base64,${l}`,xe=!1,u()}catch(l){h("error",l instanceof Error?l.message:"Failed to read photo"),u()}}})()})}function kn(){const e=s.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),l=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const p=()=>{const n=t.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};t.addEventListener("change",p),p()}async function Sn(e){const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("password")??"");m=!0,A(),u(),L.event("login.attempt",{username:a});try{const o=await I.login(a,l);c=o.user,Wt(o.ui),L.event("login.ok",{username:(c==null?void 0:c.username)??a}),Jt(),da(),Rt(w),await Ae(),h("success","Signed in")}catch(o){L.warn("login.failed",o instanceof Error?o.message:o),h("error",o instanceof Error?o.message:"Login failed")}finally{m=!1,u()}}async function Dn(e){const t=new FormData(e),a=String(t.get("path")??""),l=String(t.get("newName")??"").trim();if(!a||!l){h("error","Name is required"),u();return}m=!0,A(),u();try{await I.filesRename(a,l),L.event("files.rename",{path:a,newName:l}),de=null,await je(),h("success",`Renamed to “${l}”`)}catch(o){h("error",o instanceof Error?o.message:"Rename failed")}finally{m=!1,u()}}async function Cn(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){h("error","Folder name is required"),u();return}m=!0,A(),u();try{await I.filesMkdir(Se,a),L.event("files.mkdir",{path:Se,name:a}),qe=!1,await je(),h("success",`Created folder “${a}”`)}catch(l){h("error",l instanceof Error?l.message:"Could not create folder")}finally{m=!1,u()}}async function En(e){if(!Z||Z.paths.length===0)return;const t=new FormData(e),a=String(t.get("toPath")??"").trim().replace(/^\/+|\/+$/g,""),l=String(t.get("newName")??"").trim(),o=Z.op,p=[...Z.paths],n=p.length>1;m=!0,A(),u();let r=0;const i=[];try{for(const b of p)try{if(o==="copy"){const g=Lt(b),M=n||!l||l===g?void 0:l,v=await I.filesCopy(b,{to:a,newName:M});L.event("files.copy",{path:b,to:v.entry.path})}else{const g=Lt(b),M=n||!l||l===g?void 0:l;await I.filesMove(b,a,M),L.event("files.move",{path:b,to:a})}r+=1}catch(g){i.push(`${Lt(b)}: ${g instanceof Error?g.message:"failed"}`)}Z=null,te=[],await je();const f=o==="copy"?"Copied":"Moved";r>0&&i.length===0?h("success",r===1?`${f} 1 item`:`${f} ${r} items`):r>0?h("info",`${f} ${r}; ${i.length} failed. ${i[0]}`):h("error",i[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){h("error",f instanceof Error?f.message:"Operation failed")}finally{m=!1,u()}}async function Nn(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",m=!0,A(),u();let l=0;const o=[];try{for(const p of a)try{await I.filesUpload(Se,p,{replace:!0}),L.event("files.upload",{path:Se,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await je(),l>0&&o.length===0?h("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?h("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):h("error",o[0]||"Upload failed")}catch(p){h("error",p instanceof Error?p.message:"Upload failed")}finally{m=!1,u()}}async function Tn(e){if(E===null)return;const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("access")??"read");W=!0,m=!0,A(),u();try{await I.share(E,a,l),await gt(E),h("success",`Shared with ${a}`)}catch(o){h("error",o instanceof Error?o.message:"Share failed")}finally{m=!1,u()}}function wt(e){if(!y)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');y={...y,summary:String(t.get("summary")??y.summary),description:String(t.get("description")??y.description),location:String(t.get("location")??y.location),instanceId:Number(t.get("instanceId"))||y.instanceId,allDay:(a==null?void 0:a.checked)??y.allDay,start:String(t.get("start")??y.start??""),end:String(t.get("end")??y.end??"")||null,repeat:kt(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function kt(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),l=String(e.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const i=String(e.get("repeatUntil")??"").trim();p=i?i.slice(0,10):null}else if(o==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const r=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:p,count:n,byDay:r,endMode:o}}async function xn(e){if(!y||!y.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),r=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||y.instanceId,f=kt(t);if(!a){h("error","Title is required"),u();return}if(!n){h("error","Start is required"),u();return}let b,g;if(p)b=n.slice(0,10),g=r?r.slice(0,10):b;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const C=Xt(n,r||null);b=new Date(C.start).toISOString(),g=C.end?new Date(C.end).toISOString():null}else b=new Date(n).toISOString(),g=r?new Date(r).toISOString():null;const M=y.instanceId,v=y.uri,S=Oe;m=!0,A(),$e=!0,u(),L.event(S?"event.create":"event.update",{instanceId:i,uri:S?null:v,allDay:p,summary:a});try{const C={summary:a,description:l,location:o,allDay:p,start:b,end:g,instanceId:i,repeat:f},K=S?await I.createEvent(i,C):await I.updateEvent(M,v,C);(E===null||K.event.instanceId!==E)&&(E=K.event.instanceId),await Me(),$e=!1,y=null,Oe=!1,O=null,L.event(S?"event.created":"event.saved",{uri:K.event.uri,instanceId:K.event.instanceId}),h("success",S?"Event created":"Event saved")}catch(C){L.warn("event.save failed",C instanceof Error?C.message:C),h("error",C instanceof Error?C.message:"Save failed")}finally{m=!1,u()}}async function An(e){if(E===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim();m=!0,A(),u();try{const p=await I.updateCalendar(E,{displayname:a,description:l,color:o});W=!0,await Ae(),E=p.calendar.id,await gt(E),await Me(),h("success","Calendar updated")}catch(p){h("error",p instanceof Error?p.message:"Update failed")}finally{m=!1,u()}}async function In(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),r=t.get("readOnly")==="on";if(G=!0,p&&!n){h("error","Select a country for the holidays calendar"),u();return}if(!p&&!a){h("error","Display name is required"),u();return}m=!0,A(),u();try{const i=await I.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:r});E=i.calendar.id,G=!1,await Ae();let f=`Created “${i.calendar.displayname}”`;const b=i.holidayImport??i.calendar.holidayImport;b&&(f+=`. Holidays imported: ${ra(b)}.`),r&&(f+=" Calendar is read-only."),h("success",f)}catch(i){G=!0,h("error",i instanceof Error?i.message:"Create failed")}finally{m=!1,u()}}async function On(e){var l,o,p;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&L.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){R&&(R.phase==="done"||R.phase==="error")&&$a();return}if(a==="logout"){m=!0,L.event("logout");try{await I.logout()}catch{}zt(),A(),u();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;E=n,m=!0,A(),u();try{await Me()}catch(r){h("error",r instanceof Error?r.message:"Failed to load calendar")}finally{m=!1,u()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!x.find(i=>i.id===n&&i.canShare))return;E=n,W=!0,me=null,m=!0,A(),u();try{await gt(n),await Me()}catch(i){h("error",i instanceof Error?i.message:"Failed to open calendar")}finally{m=!1,u()}return}if(a==="close-cal-modal"){W=!1,u();return}if(a==="open-create-cal-modal"){G=!0,W=!1,me=null,A(),u();return}if(a==="close-create-cal-modal"){G=!1,A(),u();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!x.find(i=>i.id===n&&i.canShare))return;me=n,W=!1,A(),u();return}if(a==="cancel-delete-cal"){me=null,u();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),r=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;m=!0,A(),u();try{if(await I.deleteCalendar(n),E===n&&(E=null),me=null,W=!1,Ee=[],z=[],await Ae(),E===null){const i=ma();i&&(E=i.id,await Me())}h("success","Calendar deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="month-today"){const n=new Date;H={y:n.getFullYear(),m:n.getMonth()},ft=null,m=!0,u();try{await Me()}finally{m=!1,u()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,r=new Date(H.y,H.m+n,1);H={y:r.getFullYear(),m:r.getMonth()},ft=null,m=!0,u();try{await Me()}finally{m=!1,u()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;m=!0,A(),u();try{const i=await I.getEvent(n,r);y={...i.event,repeat:i.event.repeat??Ot()},Oe=!1,$e=!0,O=null,W=!1,me=null}catch(i){h("error",i instanceof Error?i.message:"Failed to open event")}finally{m=!1,u()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";ft=ft===n?null:n,u();return}if(a==="new-event-day"){const n=e.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;if(E===null){h("error","Select a calendar first"),u();return}const i=x.find(f=>f.id===E);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){h("error","This calendar is read-only"),u();return}Oe=!0,y=Za(r,E),$e=!0,O=null,W=!1,me=null,A(),u();return}if(a==="close-event-modal"){$e=!1,y=null,Oe=!1,O=null,A(),u();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const r=s.querySelector('[data-form="edit-event"]');if(r&&y&&wt(r),(O==null?void 0:O.field)===n)O=null;else{const i=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",b=t.dataset.dtName||n;let g=ea(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=$t().start);const M=vt(g||re(new Date)),[v,S]=M.date.split("-").map(Number);O={field:n,viewY:v,viewM:(S||1)-1,dateOnly:i,allowClear:f,name:b}}u();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const n=a==="dt-month-prev"?-1:1,r=new Date(O.viewY,O.viewM+n,1);O={...O,viewY:r.getFullYear(),viewM:r.getMonth()},u();return}if(a==="dt-pick-day"){if(!O)return;const n=O.field,r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;const i=s.querySelector('[data-form="edit-event"]');i&&y&&wt(i);const f=O.dateOnly;if(f)Pe(n,r),O=null;else{const b=ea(n),g=vt(b||$t(r).start).hm;Pe(n,`${r}T${g}`),O={...O,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(n==="start"&&y&&!f&&y.end){const b=new Date(String(y.start)),g=new Date(String(y.end));!Number.isNaN(b.getTime())&&!Number.isNaN(g.getTime())&&g<=b&&Pe("end",ze(new Date(b.getTime()+3600*1e3)))}u();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const n=O.field,r=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(r))return;const i=s.querySelector('[data-form="edit-event"]');i&&y&&wt(i);const f=ea(n)||$t().start,g=`${vt(f).date}T${r}`;if(Pe(n,g),n==="start"&&y){y={...y,allDay:!1};const M=y.end?vt(String(y.end)):null,v=new Date(g);(!M||new Date(`${M.date}T${M.hm}`)<=v)&&Pe("end",ze(new Date(v.getTime()+3600*1e3)))}O=null,u();return}if(a==="dt-today"){if(!O)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&y&&wt(r);const i=re(new Date);if(O.dateOnly)Pe(n,i);else{const f=$t(i);n==="start"?(Pe("start",f.start),y&&!y.end&&Pe("end",f.end)):n==="end"?Pe("end",f.end):Pe(n,f.start)}O=null,u();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&y&&wt(r),Pe(n,null),O=null,u();return}if(a==="event-allday-toggle"){if(!y)return;const n=s.querySelector('[data-form="edit-event"]'),r=t.checked;if(n){const i=new FormData(n),f=String(i.get("start")??y.start??""),b=String(i.get("end")??y.end??"")||null;let g=f,M=b;if(r){const v=ja(f,b);g=v.start,M=v.end}else{const v=f.slice(0,10),S=(b||f).slice(0,10),C=Xt(v,S);g=C.start,M=C.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:r,start:g,end:M,repeat:kt(i)}}else y={...y,allDay:r};O=null,u();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!y)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const r=new FormData(n),i=n.querySelector('input[name="allDay"]'),f=kt(r);y={...y,summary:String(r.get("summary")??y.summary),description:String(r.get("description")??y.description),location:String(r.get("location")??y.location),instanceId:Number(r.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(r.get("start")??y.start??""),end:String(r.get("end")??y.end??"")||null,repeat:f,hasRrule:!!String(r.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),u();return}if(a==="delete-event"){if(!y||!y.canWrite||Oe||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,r=y.uri;m=!0,A(),u();try{await I.deleteEvent(n,r),$e=!1,y=null,await Me(),h("success","Event deleted")}catch(i){h("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(a==="info"){const n=t.dataset.info??"";Un(n);return}if(a==="info-close"){Ta();return}if(a==="flash-close"){A(),u();return}if(a==="user-menu-toggle"){e.stopPropagation(),P=!P,u();return}if(a==="user-menu-close"){P&&(P=!1,u());return}if(a==="tab"){const n=la(t.dataset.tab);n&&await Ra(n);return}if(a==="files-nav"){Se=t.dataset.path??"",de=null,se=null,Z=null,qe=!1,te=[],m=!0,A(),u();try{await je()}catch(r){h("error",r instanceof Error?r.message:"Failed to open folder")}finally{m=!1,u()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?te.includes(n)||(te=[...te,n]):te=te.filter(i=>i!==n),u();return}if(a==="files-select-all"){e.stopPropagation(),te=t.checked?ye.map(r=>r.path):[],u();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;Z={op:"copy",paths:[n]},de=null,se=null,u();return}if(a==="files-move"){const n=t.dataset.path??"";if(!n)return;Z={op:"move",paths:[n]},de=null,se=null,u();return}if(a==="files-bulk-copy"){if(te.length===0)return;Z={op:"copy",paths:[...te]},de=null,se=null,u();return}if(a==="files-bulk-move"){if(te.length===0)return;Z={op:"move",paths:[...te]},de=null,se=null,u();return}if(a==="files-transfer-close"){Z=null,u();return}if(a==="files-bulk-delete"){if(te.length===0)return;se=[...te],de=null,Z=null,u();return}if(a==="files-refresh"){m=!0,A(),u();try{await je(),h("success","Refreshed")}catch(n){h("error",n instanceof Error?n.message:"Refresh failed")}finally{m=!1,u()}return}if(a==="files-mkdir"){qe=!0,de=null,se=null,Z=null,A(),u();return}if(a==="files-mkdir-close"){qe=!1,u();return}if(a==="files-rename-open"){de=t.dataset.path??null,se=null,Z=null,u();return}if(a==="files-rename-close"){de=null,u();return}if(a==="files-delete-open"){const n=t.dataset.path??"";se=n?[n]:null,de=null,Z=null,u();return}if(a==="files-delete-close"){se=null,u();return}if(a==="files-delete-confirm"){const n=se?[...se]:[];if(n.length===0)return;m=!0,A(),u();try{if(n.length===1)await I.filesDelete(n[0]),L.event("files.delete",{path:n[0]}),h("success","Deleted");else{const r=await I.filesBulk("delete",n);L.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?h("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?h("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):h("error",r.errors[0]||"Delete failed")}se=null,te=[],await je()}catch(r){h("error",r instanceof Error?r.message:"Delete failed")}finally{m=!1,u()}return}if(a==="files-download"){L.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){Je===n?_e=_e==="asc"?"desc":"asc":(Je=n,_e=n==="due"||n==="summary"?"asc":"desc"),m=!0,u();try{await Ge()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{m=!1,u()}}else{ct===n?tt=tt==="asc"?"desc":"asc":(ct=n,tt="asc"),m=!0,u();try{await ut()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{m=!1,u()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=he.find(f=>f.instanceId===n&&f.uri===r)??null;X=!1,ke=ae(n,r),U=i?{...i}:null,A(),u();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=ae(n,r),f=he.find(b=>ae(b.instanceId,b.uri)===i);if(!f||!f.canWrite||f.readOnly)return;ie.includes(i)?ie=ie.filter(b=>b!==i):ie=[...ie,i],u();return}if(a==="task-select-all"){e.preventDefault();const n=he.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>ie.includes(ae(i.instanceId,i.uri)))?ie=[]:ie=n.map(i=>ae(i.instanceId,i.uri)),u();return}if(a==="bulk-task-clear"){ie=[],u();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){gn(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const i=it.find(f=>f.instanceId===n&&f.uri===r)??null;ce=!1,Le=ae(n,r),Q=i?{...i}:null,A(),u();return}if(a==="new-task"){X=!0,ke=null,U={uri:"",instanceId:((o=We[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),u();return}if(a==="new-subtask"){if(!U||X||!U.uid||!U.canWrite)return;const n=U;X=!0,ke=null,U={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),u();return}if(a==="new-note"){ce=!0,Le=null,Q={uri:"",instanceId:((p=Ye[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},A(),u();return}if(a==="cancel-task"){X=!1,U=null,ke=null,u();return}if(a==="cancel-note"){ce=!1,Q=null,Le=null,u();return}if(a==="delete-task"){if(!U||X||!confirm("Delete this task? CalDAV clients will sync the removal."))return;m=!0,A(),u();try{await I.deleteTask(U.instanceId,U.uri),ke=null,U=null,await Ge(),h("success","Task deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-note"){if(!Q||ce||!confirm("Delete this note? CalDAV clients will sync the removal."))return;m=!0,A(),u();try{await I.deleteNote(Q.instanceId,Q.uri),Le=null,Q=null,await ut(),h("success","Note deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;F=n,Te=!1,ee=null,N=null,ne=!1,fe=!1,et="",Be=[],be=null,Ne=null,xe=!1,A(),m=!0,u();try{await Ke(n)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contacts")}finally{m=!1,u()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!we.find(f=>f.id===n))return;const i=F!==n;F=n,Te=!0,fe=!1,A(),i&&(ee=null,N=null,ne=!1,et="",Be=[],be=null,Ne=null,xe=!1),m=!0,u();try{i&&await Ke(n)}catch(f){h("error",f instanceof Error?f.message:"Failed to open address book")}finally{m=!1,u()}return}if(a==="close-ab-modal"){Te=!1,u();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;A();try{await en(n)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contact")}u();return}if(a==="new-contact"){if(F===null)return;tn(),A(),u();return}if(a==="cancel-contact"||a==="close-contact-modal"){ne=!1,fe=!1,N=null,ee=null,be=null,Ne=null,xe=!1,O=null,A(),u();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!N)return;Mt(),Array.isArray(N.emails)||(N.emails=[""]),Array.isArray(N.phones)||(N.phones=[{type:"cell",value:""}]),Array.isArray(N.custom)||(N.custom=[]),a==="add-email"?N.emails.length<10&&N.emails.push(""):a==="add-phone"?N.phones.length<10&&N.phones.push({type:"other",value:""}):N.custom.length<30&&N.custom.push({label:"",value:""}),u();return}if(a==="remove-email"){if(!N)return;Mt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(N.emails)?N.emails:[""];N.emails=r.filter((i,f)=>f!==n),N.emails.length===0&&(N.emails=[""]),u();return}if(a==="remove-phone"){if(!N)return;Mt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(N.phones)?N.phones:[{type:"cell",value:""}];N.phones=r.filter((i,f)=>f!==n),N.phones.length===0&&(N.phones=[{type:"cell",value:""}]),u();return}if(a==="remove-custom"){if(!N)return;Mt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;N.custom=(Array.isArray(N.custom)?N.custom:[]).filter((r,i)=>i!==n),u();return}if(a==="remove-photo"){be=null,Ne=null,xe=!0,N&&(N.hasPhoto=!1),u();return}if(a==="delete-contact"){if(F===null||!ee||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;m=!0,A(),fe=!0,u();try{await I.deleteContact(F,ee),ee=null,N=null,ne=!1,fe=!1,O=null,be=null,await Ae(),h("success","Contact deleted")}catch(n){h("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??F);if(!Number.isFinite(n)||!we.find(i=>i.id===n))return;pe=n,Te=!1,fe=!1,A(),u();return}if(a==="cancel-delete-ab"){pe=null,u();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),r=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;const i=we.find(b=>b.id===n);if(!i)return;const f=(i.cardCount??0)>0;m=!0,A(),u();try{await I.deleteAddressBook(n,f),F===n&&(F=null,Be=[],N=null,ee=null,ne=!1),pe=null,Te=!1,fe=!1,await Ae(),F===null&&we.length>0&&(F=we[0].id,await Ke(F)),h("success","Address book deleted")}catch(b){h("error",b instanceof Error?b.message:"Delete failed")}finally{m=!1,u()}return}if(a==="export-ab"){if(F===null)return;Te=!0,m=!0,A(),u();try{const{blob:n,filename:r}=await I.exportAddressBook(F),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="export-contact"){if(F===null||!ee||ne)return;fe=!0,m=!0,A(),u();try{const{blob:n,filename:r}=await I.exportContact(F,ee),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||E===null||!confirm("Revoke access for this user?"))return;W=!0,m=!0,A(),u();try{await I.revoke(E,n),await gt(E),h("success","Share revoked")}catch(r){h("error",r instanceof Error?r.message:"Revoke failed")}finally{m=!1,u()}return}if(a==="export-cal"){if(E===null)return;W=!0,m=!0,A(),u();try{const{blob:n,filename:r}=await I.exportCalendar(E),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=r,f.click(),URL.revokeObjectURL(i),h("success",`Exported ${r}`)}catch(n){h("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}}}function Ln(){const e=s.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Bn(e)});const t=s.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Vn(t)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Mn(a)})}async function Mn(e){var l;if(F===null)return;const t=(l=e.files)==null?void 0:l[0];if(e.value="",!t)return;const a=F;Te=!0,m=!0,A(),Re(),R={kind:"contacts",fileName:t.name,fileSizeLabel:ga(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},va(),u();try{const o=await Sa(t,r=>{if(!R||R.phase!=="reading")return;R={...R,readPercent:r};const i=s.querySelector(".import-progress-bar"),f=s.querySelector("[data-import-status-line]");i&&r!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${r}%`),f&&r!==null&&(f.textContent=`Reading file… ${r}%`)});Ze("uploading",{readPercent:100}),Ze("processing",{processPercent:0}),L.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const p=await I.importAddressBook(a,o,r=>{wa(r)}),n=ra(p);await Ae(),F===a&&await Ke(a),Re(),Ze("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),h("success",`Import finished for “${t.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";Re(),Ze("error",{ok:!1,resultMessage:p}),h("error",p)}finally{m=!1,u()}}function Mt(){if(!N)return;const e=s.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);N.firstname=String(t.get("firstname")??""),N.lastname=String(t.get("lastname")??""),N.fullname=String(t.get("fullname")??""),N.org=String(t.get("org")??""),N.title=String(t.get("title")??""),N.url=String(t.get("url")??""),N.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();N.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,N.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const l=[];let o=0;for(;t.has(`email_${o}`);)l.push(String(t.get(`email_${o}`)??"")),o++;l.length&&(N.emails=l);const p=[];for(o=0;t.has(`phone_value_${o}`);)p.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;p.length&&(N.phones=p);const n=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)n.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;N.custom=n}function Pn(e){const t=new FormData(e),a=[];let l=0;for(;t.has(`email_${l}`);){const r=String(t.get(`email_${l}`)??"").trim();r&&a.push(r),l++}const o=[];for(l=0;t.has(`phone_value_${l}`);){const r=String(t.get(`phone_value_${l}`)??"").trim();r&&o.push({type:String(t.get(`phone_type_${l}`)??"other"),value:r}),l++}const p=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);){const r=String(t.get(`custom_label_${l}`)??"").trim(),i=String(t.get(`custom_value_${l}`)??"").trim();(r||i)&&p.push({label:r,value:i}),l++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const r=String(t.get("birthday")??"").trim();return r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null})(),custom:p};return xe?n.removePhoto=!0:Ne&&(n.photoBase64=Ne),n}async function Fn(e){if(F===null)return;const t=Pn(e);m=!0,A(),fe=!0,u();try{if(ne){const a=await I.createContact(F,t);ne=!1,ee=a.contact.uri,N=null,fe=!1,be=null,Ne=null,xe=!1,O=null,h("success","Contact created")}else ee&&(ee=(await I.updateContact(F,ee,t)).contact.uri,N=null,fe=!1,be=null,Ne=null,xe=!1,O=null,h("success","Contact saved"));try{await Ae()}catch(a){if(console.error(a),F!==null)try{await Ke(F)}catch{}}}catch(a){h("error",a instanceof Error?a.message:"Save failed")}finally{m=!1,u()}}async function qn(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();if(a){m=!0,A(),u();try{const o=await I.createAddressBook({displayname:a,description:l});F=o.addressbook.id,ee=null,N=null,ne=!1,et="",await Ae(),h("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){h("error",o instanceof Error?o.message:"Create failed")}finally{m=!1,u()}}}async function Rn(e){if(F===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();Te=!0,m=!0,A(),u();try{await I.updateAddressBook(F,{displayname:a,description:l}),await Ae(),h("success","Address book updated")}catch(o){h("error",o instanceof Error?o.message:"Update failed")}finally{m=!1,u()}}function Un(e){const t=ts[e];if(!t)return;const a=s.querySelector("#info-modal"),l=s.querySelector("#info-modal-title"),o=s.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=t.title,o.innerHTML=t.paragraphs.map(n=>`<p>${d(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function Ta(){const e=s.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Bn(e){var a;if(E===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(W=!0,await xa(E,t,{keepEditModalOpen:!0}))}async function Vn(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=s.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){h("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),G=!0,u();return}if(p){h("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),G=!0,u();return}let n=String(l.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const r=String(l.get("description")??""),i=String(l.get("color")??"").trim();m=!0,A(),G=!0,u();try{const b=await I.createCalendar({displayname:n,description:r,color:i,readOnly:!1});E=b.calendar.id,G=!1,await Ae(),h("success",`Created “${b.calendar.displayname}” — importing…`),await xa(b.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${b.calendar.displayname}” created. `})}catch(b){const g=b instanceof Error?b.message:"Create or import failed";G=!0,h("error",g),m=!1,u()}}async function xa(e,t,a={}){m=!0,A(),Re(),R={kind:"calendar",fileName:t.name,fileSizeLabel:ga(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},va(),u();try{const l=await Sa(t,n=>{if(!R||R.phase!=="reading")return;R={...R,readPercent:n};const r=s.querySelector(".import-progress-bar"),i=s.querySelector("[data-import-status-line]");r&&n!==null&&(r.classList.remove("is-indeterminate"),r.style.width=`${n}%`),i&&n!==null&&(i.textContent=`Reading file… ${n}%`)});Ze("uploading",{readPercent:100}),Ze("processing",{processPercent:0}),L.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await I.importCalendar(e,l,n=>{wa(n)}),p=ra(o);E===e&&await Me(),Re(),Ze("done",{ok:!0,resultMessage:`${p} (from “${t.name}”)`}),h("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";Re(),Ze("error",{ok:!1,resultMessage:o}),h("error",o)}finally{a.keepEditModalOpen&&(W=!0),m=!1,u()}}Ua()}const Fa=document.getElementById("app");if(!Fa)throw new Error("#app missing");ns(Fa);
