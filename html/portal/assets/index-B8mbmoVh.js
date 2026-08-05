var _r=Object.defineProperty;var Ir=(s,d,g)=>d in s?_r(s,d,{enumerable:!0,configurable:!0,writable:!0,value:g}):s[d]=g;var Gs=(s,d,g)=>Ir(s,typeof d!="symbol"?d+"":d,g);(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const k of document.querySelectorAll('link[rel="modulepreload"]'))h(k);new MutationObserver(k=>{for(const L of k)if(L.type==="childList")for(const O of L.addedNodes)O.tagName==="LINK"&&O.rel==="modulepreload"&&h(O)}).observe(document,{childList:!0,subtree:!0});function g(k){const L={};return k.integrity&&(L.integrity=k.integrity),k.referrerPolicy&&(L.referrerPolicy=k.referrerPolicy),k.crossOrigin==="use-credentials"?L.credentials="include":k.crossOrigin==="anonymous"?L.credentials="omit":L.credentials="same-origin",L}function h(k){if(k.ep)return;k.ep=!0;const L=g(k);fetch(k.href,L)}})();const Qs={off:0,error:1,warn:2,info:3,debug:4};let qa="off";const as="[angaradav-portal]";function Lr(s){const d=(s||"off").toLowerCase().trim();return d==="error"||d==="warn"||d==="info"||d==="debug"||d==="off"?d:"off"}function qr(s){return qa=Lr(s),qa!=="off"&&console.info(as,`log level = ${qa}`),qa}function an(s){return Qs[qa]>=Qs[s]}function Qa(s,d,g,h){if(!an(s))return;const k=[as,g];h!==void 0&&k.push(h),console[d](...k)}function Or(s,d){an("info")&&(d&&Object.keys(d).length>0?console.info(as,`event:${s}`,d):console.info(as,`event:${s}`))}const N={error(s,d){Qa("error","error",s,d)},warn(s,d){Qa("warn","warn",s,d)},info(s,d){Qa("info","info",s,d)},debug(s,d){Qa("debug","debug",s,d)},event:Or};class Pe extends Error{constructor(g,h){super(g);Gs(this,"status");this.status=h}}let sa="",Za=null,es=null;function ts(s){sa=s&&typeof s=="string"?s:""}function Ur(s){Za=s}function Pr(s){es=s}function Ss(s){if(!sn(s))try{es==null||es()}catch{}}function sn(s){return s==="/login"||s==="/ui"||s==="/logout"}function ss(s,d){if(!sn(s)){ts("");try{Za==null||Za(d||"Session timed out. Please sign in again.")}catch{}}}async function T(s,d={}){const g=new Headers(d.headers);d.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const h=(d.method||"GET").toUpperCase();h!=="GET"&&h!=="HEAD"&&h!=="OPTIONS"&&sa&&g.set("X-CSRF-Token",sa);const k=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${h} ${s}`);const L=await fetch(`/api${s}`,{...d,headers:g,credentials:"same-origin"});let O=null;const R=await L.text();if(R)try{O=JSON.parse(R)}catch{O={error:R}}const W=Math.round((typeof performance<"u"?performance.now():Date.now())-k);if(!L.ok){let X=`Request failed (${L.status})`;throw O&&typeof O=="object"&&O!==null&&"error"in O&&typeof O.error=="string"?X=O.error:(L.status===500||L.status===504)&&(X="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),L.status>=500?N.error(`api ← ${h} ${s} ${L.status} (${W}ms)`,X):L.status!==401?N.warn(`api ← ${h} ${s} ${L.status} (${W}ms)`,X):(N.debug(`api ← ${h} ${s} 401 (${W}ms)`),ss(s,X)),new Pe(X,L.status)}return N.info(`api ← ${h} ${s} ${L.status} (${W}ms)`),Ss(s),O}function Ge(s){return encodeURIComponent(s)}async function Xs(s,d,g,h){const k=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});sa&&k.set("X-CSRF-Token",sa);const L=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${s} (stream, ${g}, ${d.length} bytes)`);let O;try{O=await fetch(`/api${s}`,{method:"POST",headers:k,credentials:"same-origin",body:d})}catch(V){const K=V instanceof Error?V.message:"Network error";throw N.error(`api ← POST ${s} network fail`,K),new Pe(`Import request failed to start (${K}). Check connectivity and container logs.`,0)}const R=(O.headers.get("Content-Type")||"").toLowerCase(),W=R.includes("ndjson")||R.includes("x-ndjson");if(!O.ok&&!W){let V=`Request failed (${O.status})`;try{const K=await O.json();K.error&&(V=K.error)}catch{}throw(O.status===504||O.status===502)&&(V="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),O.status===401?(N.debug(`api ← POST ${s} 401`,V),ss(s,V)):N.warn(`api ← POST ${s} ${O.status}`,V),new Pe(V,O.status)}if(!W&&O.ok){try{const V=await O.json();if(V&&typeof V.error=="string")throw new Pe(V.error,O.status||500);if(V&&typeof V.imported=="number"&&typeof V.updated=="number")return N.info(`api ← POST ${s} json done`),V}catch(V){if(V instanceof Pe)throw V}throw new Pe("Unexpected import response from server",500)}if(!O.body)throw new Pe("Import stream unavailable",500);const X=O.body.getReader(),ce=new TextDecoder;let de="";const Z={final:null,error:null,sawProgress:!1},lt=V=>{let K;try{K=JSON.parse(V)}catch{N.debug("import stream non-JSON line",V.slice(0,80));return}if(K.type==="progress"){Z.sawProgress=!0;const Te=Number(K.total)||0,Be=Number(K.current)||0,_e=typeof K.percent=="number"?K.percent:Te>0?Math.round(100*Be/Te):0;h==null||h({percent:_e,current:Be,total:Te,imported:Number(K.imported)||0,updated:Number(K.updated)||0,skipped:Number(K.skipped)||0})}else K.type==="done"&&K.result?Z.final=K.result:K.type==="error"&&(Z.error={message:K.error||"Import failed",status:K.status||500})};for(;;){const{done:V,value:K}=await X.read();if(V)break;de+=ce.decode(K,{stream:!0});const Te=de.split(`
`);de=Te.pop()??"";for(const Be of Te){const _e=Be.trim();_e&&lt(_e)}}de.trim()&&lt(de.trim());const B=Math.round((typeof performance<"u"?performance.now():Date.now())-L);if(Z.error)throw Z.error.status===401?(N.debug(`api ← POST ${s} stream 401 (${B}ms)`,Z.error.message),ss(s,Z.error.message)):N.warn(`api ← POST ${s} stream error (${B}ms)`,Z.error.message),new Pe(Z.error.message,Z.error.status);if(!Z.final)throw N.error(`api ← POST ${s} stream incomplete (${B}ms)`,{sawProgress:Z.sawProgress}),new Pe(Z.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${s} stream done (${B}ms)`),Ss(s),Z.final}const E={ui:()=>T("/ui"),adminPing:()=>T("/admin/ping"),adminDashboard:()=>T("/admin/dashboard"),adminCapabilities:()=>T("/admin/capabilities"),adminUsers:()=>T("/admin/users"),adminUser:s=>T(`/admin/users/${encodeURIComponent(s)}`),adminCreateUser:s=>T("/admin/users",{method:"POST",body:JSON.stringify(s)}),adminUpdateUser:(s,d)=>T(`/admin/users/${encodeURIComponent(s)}`,{method:"PATCH",body:JSON.stringify(d)}),adminDeleteUser:(s,d=!0)=>T(`/admin/users/${encodeURIComponent(s)}`,{method:"DELETE",body:JSON.stringify({confirm:d})}),adminUserCalendars:s=>T(`/admin/users/${encodeURIComponent(s)}/calendars`),adminCreateUserCalendar:(s,d)=>T(`/admin/users/${encodeURIComponent(s)}/calendars`,{method:"POST",body:JSON.stringify(d)}),adminUpdateUserCalendar:(s,d,g)=>T(`/admin/users/${encodeURIComponent(s)}/calendars/${d}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(s,d,g=!0)=>T(`/admin/users/${encodeURIComponent(s)}/calendars/${d}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:s=>T(`/admin/users/${encodeURIComponent(s)}/addressbooks`),adminCreateUserAddressBook:(s,d)=>T(`/admin/users/${encodeURIComponent(s)}/addressbooks`,{method:"POST",body:JSON.stringify(d)}),adminUpdateUserAddressBook:(s,d,g)=>T(`/admin/users/${encodeURIComponent(s)}/addressbooks/${d}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(s,d,g=!0,h=!1)=>T(`/admin/users/${encodeURIComponent(s)}/addressbooks/${d}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:h})}),adminSystemSettings:()=>T("/admin/settings/system"),adminUpdateSystemSettings:s=>T("/admin/settings/system",{method:"PATCH",body:JSON.stringify(s)}),adminResetToDefault:(s=!0)=>T("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:s})}),adminDatabaseSettings:()=>T("/admin/settings/database"),adminUpdateDatabaseSettings:s=>T("/admin/settings/database",{method:"PATCH",body:JSON.stringify(s)}),me:async()=>{var d;const s=await T("/me");return ts(s.csrfToken||((d=s.user)==null?void 0:d.csrfToken)),s},login:async(s,d)=>{var h;const g=await T("/login",{method:"POST",body:JSON.stringify({username:s,password:d})});return ts((h=g.user)==null?void 0:h.csrfToken),g},logout:async()=>{try{return await T("/logout",{method:"POST"})}finally{ts("")}},calendars:()=>T("/calendars"),createCalendar:s=>T("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>T("/holidays/countries"),updateCalendar:(s,d)=>T(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteCalendar:s=>T(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,d,g)=>{const h=new URLSearchParams({from:d,to:g}).toString();return T(`/calendars/${s}/events?${h}`)},getEvent:(s,d)=>T(`/calendars/${s}/events/${Ge(d)}`),createEvent:(s,d)=>T(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(d)}),updateEvent:(s,d,g)=>T(`/calendars/${s}/events/${Ge(d)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(s,d)=>T(`/calendars/${s}/events/${Ge(d)}`,{method:"DELETE"}),exportCalendar:async s=>{const d=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!d.ok){let O=`Export failed (${d.status})`;try{const R=await d.json();R.error&&(O=R.error)}catch{}throw new Pe(O,d.status)}const g=d.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),k=(h==null?void 0:h[1])||`calendar-${s}.ics`;return{blob:await d.blob(),filename:k}},importCalendar:(s,d,g)=>Xs(`/calendars/${s}/import`,d,"text/calendar; charset=utf-8",g),directory:()=>T("/directory"),shares:s=>T(`/calendars/${s}/shares`),share:(s,d,g)=>T(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:d,access:g})}),revoke:(s,d)=>T(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:d})}),addressbooks:()=>T("/addressbooks"),createAddressBook:s=>T("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,d)=>T(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(d)}),deleteAddressBook:(s,d=!1)=>T(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:d})}),exportAddressBook:async s=>{const d=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!d.ok){let O=`Export failed (${d.status})`;try{const R=await d.json();R.error&&(O=R.error)}catch{}throw new Pe(O,d.status)}const g=d.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),k=(h==null?void 0:h[1])||`contacts-${s}.vcf`;return{blob:await d.blob(),filename:k}},importAddressBook:(s,d,g)=>Xs(`/addressbooks/${s}/import`,d,"text/vcard; charset=utf-8",g),contacts:(s,d="")=>{const g=d.trim()?`?q=${encodeURIComponent(d.trim())}`:"";return T(`/addressbooks/${s}/contacts${g}`)},getContact:(s,d)=>T(`/addressbooks/${s}/contacts/${Ge(d)}`),createContact:(s,d)=>T(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(d)}),updateContact:(s,d,g)=>T(`/addressbooks/${s}/contacts/${Ge(d)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(s,d)=>T(`/addressbooks/${s}/contacts/${Ge(d)}`,{method:"DELETE"}),exportContact:async(s,d)=>{const g=await fetch(`/api/addressbooks/${s}/contacts/${Ge(d)}/export`,{credentials:"same-origin"});if(!g.ok){let R=`Export failed (${g.status})`;try{const W=await g.json();W.error&&(R=W.error)}catch{}throw new Pe(R,g.status)}const h=g.headers.get("Content-Disposition")||"",k=/filename="([^"]+)"/i.exec(h),L=(k==null?void 0:k[1])||"contact.vcf";return{blob:await g.blob(),filename:L}},contactPhotoUrl:(s,d)=>`/api/addressbooks/${s}/contacts/${Ge(d)}/photo`,tasks:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const g=d.toString()?`?${d}`:"";return T(`/tasks${g}`)},createTask:s=>T("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,d,g)=>T(`/tasks/${s}/${Ge(d)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(s,d)=>T(`/tasks/${s}/${Ge(d)}`,{method:"DELETE"}),bulkTasks:s=>T("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const d=new URLSearchParams;s.q&&d.set("q",s.q),s.sort&&d.set("sort",s.sort),s.order&&d.set("order",s.order);const g=d.toString()?`?${d}`:"";return T(`/notes${g}`)},createNote:s=>T("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,d,g)=>T(`/notes/${s}/${Ge(d)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(s,d)=>T(`/notes/${s}/${Ge(d)}`,{method:"DELETE"}),filesStatus:()=>T("/files"),filesList:(s="")=>{const d=new URLSearchParams;s&&d.set("path",s);const g=d.toString()?`?${d}`:"";return T(`/files/entries${g}`)},filesMkdir:(s,d)=>T("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:d})}),filesUpload:async(s,d,g={})=>{const h=new URLSearchParams;s&&h.set("path",s),h.set("name",d.name),g.replace&&h.set("replace","1");const k=new Headers;sa&&k.set("X-CSRF-Token",sa);const L=new FormData;L.append("file",d,d.name),s&&L.append("path",s);const O=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST /files/upload path=${s||"/"} name=${d.name} size=${d.size}`);const R=await fetch(`/api/files/upload?${h}`,{method:"POST",headers:k,credentials:"same-origin",body:L}),W=await R.text();let X=null;if(W)try{X=JSON.parse(W)}catch{X={error:W}}const ce=Math.round((typeof performance<"u"?performance.now():Date.now())-O);if(!R.ok){let de=`Upload failed (${R.status})`;throw X&&typeof X=="object"&&X!==null&&"error"in X&&typeof X.error=="string"&&(de=X.error),R.status===401?(N.debug(`api ← POST /files/upload 401 (${ce}ms)`,de),ss("/files/upload",de)):R.status>=500?N.error(`api ← POST /files/upload ${R.status} (${ce}ms)`,de):N.warn(`api ← POST /files/upload ${R.status} (${ce}ms)`,de),new Pe(de,R.status)}return N.info(`api ← POST /files/upload 200 (${ce}ms)`),Ss("/files/upload"),X},filesDownloadUrl:s=>{const d=new URLSearchParams;return d.set("path",s),`/api/files/download?${d}`},filesDelete:s=>T("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,d)=>T("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:d})}),filesMove:(s,d,g)=>T("/files/move",{method:"POST",body:JSON.stringify({from:s,to:d,newName:g})}),filesCopy:(s,d={})=>T("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:d.to,newName:d.newName})}),filesBulk:(s,d)=>T("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:d})})},Mr=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let ha=null;function Fr(){if(ha)return ha;try{const s=Intl;if(typeof s.supportedValuesOf=="function"){const d=s.supportedValuesOf("timeZone");if(Array.isArray(d)&&d.length>0)return ha=[...d].sort((g,h)=>g.localeCompare(h)),ha}}catch{}return ha=[...Mr],ha}function nn(s){const d=s||"UTC",g=Fr(),h=g.includes(d),k=g.map(L=>`<option value="${Zs(L)}" ${L===d?"selected":""}>${en(L)}</option>`);return!h&&d&&k.unshift(`<option value="${Zs(d)}" selected>${en(d)}</option>`),k.join("")}function Zs(s){return s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function en(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function aa(s,d,g={}){if(!d)return"";const h=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,k=g.dismissAction??"flash-close",L=g.role??"status",O=g.className?` ${g.className}`:"",R=g.style?` style="${i(g.style)}"`:"",W=h?`<button type="button" class="flash-close" data-action="${i(k)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${i(s)}${O}" role="${i(L)}"${R}>
      <span class="flash-text">${i(d)}</span>
      ${W}
    </div>`}function Rr(s){return s==="sm"?" cal-modal-card-sm":s==="wide"?" cal-modal-card-wide":""}function Vr(s){return s==="danger"?"btn btn-danger":s==="ghost"?"btn btn-ghost":"btn btn-primary"}function rn(s){return s.map(g=>{const h=g.type??"button",k=Vr(g.variant),L=g.disabled?" disabled":"",O=g.id?` id="${i(g.id)}"`:"",R=g.action?` data-action="${i(g.action)}"`:"",W=g.attrs?` ${g.attrs}`:"";return`<button type="${h}" class="${k}"${R}${O}${W}${L}>${i(g.label)}</button>`}).join(`
`)}function ke(s){const d=s.titleId||(s.id?`${s.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=s.id?` id="${i(s.id)}"`:"",h=s.className?` ${s.className}`:"",k=s.rootAttrs?` ${s.rootAttrs}`:"",L=`${Rr(s.size)}${s.cardClassName?` ${s.cardClassName}`:""}`,O=s.closeAction,R=s.lockBackdrop?"":` data-action="${i(O)}"`,W=s.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${i(O)}" aria-label="Close">×</button>`;let X="";s.footer!==void 0&&(X=typeof s.footer=="string"?s.footer:rn(s.footer));const ce=X?`<footer class="cal-modal-footer">${X}</footer>`:"",de=`<div class="cal-modal-body">${s.body}</div>`;let Z;return s.form?Z=`<form class="stack"${s.formAttrs?` ${s.formAttrs}`:""}>
        ${de}
        ${ce}
      </form>`:Z=`${de}
      ${ce}`,`<div class="cal-modal${h}"${g}${k} role="dialog" aria-modal="true" aria-labelledby="${i(d)}">
      <div class="cal-modal-backdrop"${R}></div>
      <div class="cal-modal-card${L}">
        <header class="cal-modal-header">
          <h3 id="${i(d)}">${i(s.title)}</h3>
          ${W}
        </header>
        ${Z}
      </div>
    </div>`}function Xa(s){const d=s.style==="checkbox"?"checkbox":"admin-delete-confirm",g=s.style==="checkbox"?' style="margin-top:1rem"':"",h=s.id?` id="${i(s.id)}"`:"",k=s.checked?" checked":"",L=s.disabled?" disabled":"";return`<label class="${d}"${g}>
            <input type="checkbox"${h} data-action="${i(s.action)}"${k}${L} />
            ${i(s.label)}
          </label>`}const ln="angaradav-portal-tab",on="angaradav-portal-admin-page",Br="2.0.0",jr="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ds(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function ns(s){return s==="overview"||s==="users"||s==="settings"||s==="database"?s:null}function As(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!s)return{tab:null,adminPage:null,adminUsername:null};if(s==="admin"||s.startsWith("admin/")){const d=s.split("/").filter(Boolean),g=d[1]??"overview",h=ns(g)??"overview";let k=null;if(h==="users"&&d[2])try{k=decodeURIComponent(d[2])}catch{k=d[2]}return{tab:"admin",adminPage:h,adminUsername:k}}return{tab:Ds(s),adminPage:null,adminUsername:null}}function zr(){const s=As().tab;if(s)return s;try{const d=Ds(sessionStorage.getItem(ln));if(d)return d}catch{}return"calendars"}function Hr(){const s=As().adminPage;if(s)return s;try{const d=ns(sessionStorage.getItem(on));if(d)return d}catch{}return"overview"}function Wr(s,d=null){return s==="overview"?"#admin":s==="users"&&d?`#admin/users/${encodeURIComponent(d)}`:`#admin/${s}`}function st(s,d="overview",g=null){try{sessionStorage.setItem(ln,s),s==="admin"&&sessionStorage.setItem(on,d)}catch{}if(typeof history>"u"||typeof location>"u")return;const h=s==="admin"?Wr(d,g):`#${s}`;location.hash!==h&&history.replaceState(null,"",`${location.pathname}${location.search}${h}`)}function $s(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(s)}</span>`}function ws(s){const d=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&d.push(`${s.skipped} skipped`),d.join(", ")}const Jr={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function he(s,d,g="h2"){const h=g;return`<div class="section-title-row">
    <${h}>${i(s)}</${h}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(d)}"
      aria-label="About ${i(s)}" title="About ${i(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Yr(){return`
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
    </div>`}function Kr(s){let d=null,g=null,h=zr(),k=Hr(),L=null,O=!1,R=null,W=null,X=null,ce=[],de=!1,Z=null,lt="",B=As().adminUsername??null,V=null,K=!1,Te=null,Be=!1,_e=!1,ot=null,kt=!1,St=[],Dt=[],ya=!1,ze=null,Rt=null,Qe=null,Vt=null,ye=null,Bt=null,Oa=!1,va=null,na=!1,At=!1,jt=null,Ua=!1,$a=null,zt="sqlite",ra=!1,it="",la=null,Ie=!1,oa=null,Se=[],Ht=[],Pa=[],M=null,Wt=[],ue=!1,Me=!1,Fe=null,He=null,Ct={y:new Date().getFullYear(),m:new Date().getMonth()},Jt=[],os=!1,dt=!1,$=null,Xe=!1,U=null,Ma="",wa=null,Le=[],F=null,gt=[],Yt="",re=null,_=null,me=!1,De=!1,We=!1,Ce=null,je=null,Je=!1,c=!1,j=null,Fa=null,Es=!1,ia={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ye=null,Ns=900,ka=null,Sa=Br,is=!1,Ra=!1;function ds(t){if(!t)return;const e=(t.timeFormat||"auto").toLowerCase(),a=(t.weekStart||"auto").toLowerCase();ia={timeFormat:e==="12h"||e==="24h"?e:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:t.logLevel||"off"},qr(ia.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(Ns=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(Sa=t.version.trim())}function cs(){ka!==null&&(clearTimeout(ka),ka=null)}function us(){if(cs(),!d)return;const t=Math.max(30,Ns)*1e3;ka=setTimeout(()=>{ka=null,Is("Your session timed out. Please sign in again.")},t)}function ms(){cs(),ut(),j=null,d=null,Se=[],Wt=[],M=null,Ht=[],Le=[],F=null,gt=[],re=null,_=null,me=!1,De=!1,We=!1,Me=!1,ue=!1,Fe=null,He=null,dt=!1,$=null,Xe=!1,Jt=[],Ee=[],ca=[],Nt=[],xt=[],qe=null,Ze=null,z=null,ae=null,G=!1,$e=!1,ge=[],fs=null,Oe="",Ne=[],ma=!1,we=null,pe=null,ne=null,ct=!1,le=[],Ce=null,je=null,Je=!1,c=!1,Ie=!1,L=null,O=!1,R=null,W=null,X=null,ce=[],de=!1,Z=null,lt="",B=null,V=null,K=!1,Te=null,Be=!1,_e=!1,ot=null,kt=!1,St=[],Dt=[],ya=!1,ze=null,Rt=null,Qe=null,Vt=null,ye=null,Bt=null,Oa=!1,va=null,na=!1,At=!1,jt=null,Ua=!1,$a=null,zt="sqlite",ra=!1,it="",la=null,Aa()}function ve(){return!!(d!=null&&d.isAdmin||(d==null?void 0:d.role)==="Admin")}function Et(){return ve()?W===null?!0:W.uiEnabled!==!1:!1}function Re(t){const e=W==null?void 0:W.pages;return e?e.find(a=>a.id===t)??null:null}function da(t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Da(t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function Aa(){oa&&(document.removeEventListener("click",oa,!0),oa=null)}function dn(){Aa(),oa=e=>{var l;const a=e.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(Ie=!1,Aa(),m())};const t=oa;setTimeout(()=>{Ie&&oa===t&&document.addEventListener("click",t,!0)},0)}function xs(){h==="admin"&&(!ve()||!Et())&&(h="calendars",k="overview",st(h))}async function Ts(t,e={}){if(!ve()){await _s("calendars",e);return}h="admin",k=t,t!=="users"?(B=null,V=null,Te=null):e.username!==void 0&&(B=e.username,e.username||(V=null,Te=null)),Ie=!1,st("admin",t,B),N.event("tab",{tab:"admin",adminPage:t,user:B}),e.clearFlash!==!1&&C(),c=!0,m();try{if(await ps(),!Et()){h="calendars",st("calendars"),b("info","Portal Administration UI is disabled.");return}const a=Re(t);t==="overview"&&(a==null?void 0:a.available)!==!1?await Va():t==="users"&&(a==null?void 0:a.available)!==!1?(await Kt(),B&&(await ht(B),await Gt(B))):t==="settings"&&(a==null?void 0:a.available)!==!1?await Ba():t==="database"&&(a==null?void 0:a.available)!==!1&&await ja()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{c=!1,m()}}async function ps(){var t;X=null;try{W=(await E.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:W.uiEnabled,pages:((t=W.pages)==null?void 0:t.length)??0})}catch(e){X=e instanceof Error?e.message:"Failed to load capabilities",W={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",X)}}async function Va(){O=!0,R=null;try{L=(await E.adminDashboard()).data,N.debug("admin.dashboard",{users:L.users,calendars:L.calendars})}catch(t){throw L=null,R=t instanceof Error?t.message:"Failed to load dashboard",t}finally{O=!1}}async function Kt(){de=!0,Z=null;try{ce=(await E.adminUsers()).users??[],N.debug("admin.users",{count:ce.length})}catch(t){throw ce=[],Z=t instanceof Error?t.message:"Failed to load users",t}finally{de=!1}}async function ht(t){K=!0,Te=null;try{const e=await E.adminUser(t);V=e.user,B=e.user.username,N.debug("admin.user",{username:e.user.username})}catch(e){throw V=null,Te=e instanceof Error?e.message:"Failed to load user",e}finally{K=!1}}async function Gt(t){ya=!0;try{const[e,a]=await Promise.all([E.adminUserCalendars(t),E.adminUserAddressBooks(t)]);St=e.calendars??[],Dt=a.addressbooks??[]}catch(e){throw St=[],Dt=[],e}finally{ya=!1}}async function Ba(){Oa=!0,va=null;try{Bt=(await E.adminSystemSettings()).data}catch(t){throw Bt=null,va=t instanceof Error?t.message:"Failed to load settings",t}finally{Oa=!1}}async function ja(){Ua=!0,$a=null;try{const t=await E.adminDatabaseSettings();jt=t.data,zt=(t.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(t){throw jt=null,$a=t instanceof Error?t.message:"Failed to load database settings",t}finally{Ua=!1}}async function cn(t){const e=new FormData(t),a=String(e.get("username")??"").trim(),l=String(e.get("displayname")??"").trim(),o=String(e.get("email")??"").trim(),p=String(e.get("password")??""),n=String(e.get("passwordConfirm")??"");if(!a||!l||!o||!p){b("error","Username, display name, email, and password are required"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}c=!0,C(),m();try{const r=await E.adminCreateUser({username:a,displayname:l,email:o,password:p,passwordConfirm:n});N.event("admin.user.create",{username:r.user.username}),Be=!1,B=r.user.username,V=r.user,st("admin","users",r.user.username),await Kt(),b("success",`Created user “${r.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Create failed")}finally{c=!1,m()}}async function un(t){var u,f;if(!B)return;const e=B,a=new FormData(t),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim(),p=String(a.get("calendarcolor")??"").trim(),n=((u=t.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,r=((f=t.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;c=!0,C(),m();try{if(ze==="create"){const y=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserCalendar(e,{uri:y,displayname:l,description:o,calendarcolor:p||void 0,todos:n,notes:r}),b("success",`Created calendar “${l}”`)}else{const y=Number(a.get("instanceId"));await E.adminUpdateUserCalendar(e,y,{displayname:l,description:o,calendarcolor:p,todos:n,notes:r}),b("success",`Updated calendar “${l}”`)}ze=null,Rt=null,await Gt(e),await ht(e)}catch(y){b("error",y instanceof Error?y.message:"Save failed")}finally{c=!1,m()}}async function mn(t){if(!B)return;const e=B,a=new FormData(t),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim();c=!0,C(),m();try{if(Qe==="create"){const p=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserAddressBook(e,{uri:p,displayname:l,description:o}),b("success",`Created address book “${l}”`)}else{const p=Number(a.get("id"));await E.adminUpdateUserAddressBook(e,p,{displayname:l,description:o}),b("success",`Updated address book “${l}”`)}Qe=null,Vt=null,await Gt(e),await ht(e)}catch(p){b("error",p instanceof Error?p.message:"Save failed")}finally{c=!1,m()}}function pn(t){const e=new FormData(t),a=String(e.get("backend")??zt).toLowerCase()==="pgsql"?"pgsql":"sqlite",l={backend:a};a==="sqlite"?l.sqlite_file=String(e.get("sqlite_file")??"").trim():(l.pgsql_host=String(e.get("pgsql_host")??"").trim(),l.pgsql_dbname=String(e.get("pgsql_dbname")??"").trim(),l.pgsql_username=String(e.get("pgsql_username")??"").trim(),l.pgsql_password=String(e.get("pgsql_password")??"")),la=l,it="",ra=!0,C(),m()}async function fn(t){const e=new FormData(t),a=n=>{var r;return!!((r=t.querySelector(`input[name="${n}"]`))!=null&&r.checked)},l={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(e.get("timezone")??"").trim(),invite_from:String(e.get("invite_from")??"").trim(),dav_auth_type:String(e.get("dav_auth_type")??"Digest"),files_storage_path:String(e.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(e.get("files_max_upload_mb")??0),files_quota_mb:Number(e.get("files_quota_mb")??0),files_quarantine_days:Number(e.get("files_quarantine_days")??0),session_max_age_minutes:Number(e.get("session_max_age_minutes")??15),portal_log_level:String(e.get("portal_log_level")??"off"),portal_admin_users:String(e.get("portal_admin_users")??"").trim(),push_external_url:String(e.get("push_external_url")??"").trim(),push_log_level:String(e.get("push_log_level")??"off")},o=String(e.get("admin_password")??""),p=String(e.get("admin_password_confirm")??"");(o!==""||p!=="")&&(l.admin_password=o,l.admin_password_confirm=p),c=!0,C(),m();try{Bt=(await E.adminUpdateSystemSettings(l)).data,N.event("admin.settings.save"),b("success","System settings saved")}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{c=!1,m()}}async function bn(t){const e=new FormData(t),a=String(e.get("username")??"").trim(),l=String(e.get("displayname")??"").trim(),o=String(e.get("email")??"").trim(),p=String(e.get("password")??""),n=String(e.get("passwordConfirm")??"");if(!a){b("error","Username is required"),m();return}if(!l||!o){b("error","Display name and email are required"),m();return}if(p!==""||n!==""){if(p===""||n===""){b("error","Password and confirmation are required to change password"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}}c=!0,C(),m();try{const r={displayname:l,email:o};p!==""&&(r.password=p,r.passwordConfirm=n);const u=await E.adminUpdateUser(a,r);N.event("admin.user.update",{username:u.user.username,passwordChanged:p!==""}),_e=!1,V=u.user,B=u.user.username,await Kt(),b("success",p!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Update failed")}finally{c=!1,m()}}async function _s(t,e={}){if(t==="admin"&&(!ve()||!Et())&&(ve()&&W&&!W.uiEnabled&&b("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t="calendars"),t==="admin"){await Ts(k||"overview",{...e,username:k==="users"?B:null});return}h=t,Ie=!1,st(t),N.event("tab",{tab:t}),t!=="calendars"&&(ue=!1,Fe=null),t!=="contacts"&&(He=null),e.clearFlash!==!1&&C(),c=!0,m();try{t==="contacts"&&F!==null?await It(F):t==="calendars"?await et():t==="tasks"?await Lt():t==="notes"?await pa():t==="files"&&await yt()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{c=!1,m()}}async function yt(){ma=!0;try{N.debug("loadFiles",{path:Oe});const[t,e]=await Promise.all([E.filesStatus(),E.filesList(Oe).catch(a=>{if(a instanceof Pe&&(a.status===503||a.status===404))return{path:Oe,entries:[]};throw a})]);if(fs=t,t.ready){Oe=e.path,Ne=e.entries;const a=new Set(Ne.map(l=>l.path));le=le.filter(l=>a.has(l))}else Ne=[],le=[];N.event("loadFiles",{path:Oe,count:Ne.length,enabled:t.enabled,ready:t.ready})}finally{ma=!1}}function Is(t){if(!is){if(!d){cs();return}is=!0;try{N.event("session.expired"),ms(),Ra=!0,g={type:"info",message:t&&t.trim()?t:"Your session timed out. Please sign in again."},m()}finally{is=!1}}}let Ee=[],ca=[],Nt=[],xt=[],za="",Ha="",Tt="due",vt="asc",ua="dtstart",Qt="desc",qe=null,Ze=null,z=null,ae=null,G=!1,$e=!1,ge=[],fs=null,Oe="",Ne=[],ma=!1,we=null,pe=null,ne=null,ct=!1,le=[];function b(t,e){Ra&&t==="error"||(t!=="error"&&(Ra=!1),g={type:t,message:e})}function C(){g=null,Ra=!1}async function gn(){var t,e,a,l;N.event("bootstrap.start"),Ur(o=>{Is(/timed\s*out|session expired/i.test(o)?o:"Your session timed out. Please sign in again.")}),Pr(()=>{us()});try{const o=await E.ui();ds(o.ui),typeof o.version=="string"&&o.version.trim()!==""?Sa=o.version.trim():o.ui&&typeof o.ui.version=="string"&&o.ui.version.trim()!==""&&(Sa=o.ui.version.trim())}catch(o){N.debug("bootstrap: /api/ui failed",o instanceof Error?o.message:o)}try{const o=await E.me();if(d=o.user,ds(o.ui),typeof o.version=="string"&&o.version.trim()!==""&&(Sa=o.version.trim()),N.event("bootstrap.session",{username:(d==null?void 0:d.username)??null}),us(),ve())try{await ps()}catch(p){N.warn("admin.capabilities bootstrap",p instanceof Error?p.message:p)}if(xs(),st(h,k),await Ke(),h==="admin"&&ve()&&Et())try{k==="overview"&&((t=Re("overview"))==null?void 0:t.available)!==!1?await Va():k==="users"&&((e=Re("users"))==null?void 0:e.available)!==!1?(await Kt(),B&&(await ht(B),await Gt(B))):k==="settings"&&((a=Re("settings"))==null?void 0:a.available)!==!1?await Ba():k==="database"&&((l=Re("database"))==null?void 0:l.available)!==!1&&await ja()}catch(p){N.warn("admin bootstrap load",p instanceof Error?p.message:p)}}catch(o){o instanceof Pe&&o.status===401?(ms(),/timed\s*out|session expired/i.test(o.message)&&b("info",o.message),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",o instanceof Error?o.message:o),b("error",o instanceof Error?o.message:"Failed to load"))}m()}async function Ke(){N.debug("loadHome");const[t,e,a]=await Promise.all([E.calendars(),E.directory().catch(()=>({users:[]})),E.addressbooks()]);if(Se=t.calendars,Ht=e.users,Le=a.addressbooks,N.event("loadHome",{calendars:Se.length,addressBooks:Le.length,directory:Ht.length}),Pa.length===0)try{Pa=(await E.holidayCountries()).countries}catch{Pa=[]}if(M!==null&&!Se.some(l=>l.id===M)&&(M=null,Wt=[],ue=!1,Fe=null),M===null){const l=Ls();l&&(M=l.id)}M!==null&&ue?await Ca(M):M!==null&&(Wt=[]),h==="calendars"&&await et(),F!==null&&!Le.some(l=>l.id===F)&&(F=null,gt=[],re=null,_=null,me=!1),He!==null&&!Le.some(l=>l.id===He)&&(He=null),F===null&&Le.length>0&&(F=Le[0].id),F!==null&&h==="contacts"&&await It(F),h==="tasks"&&await Lt(),h==="notes"&&await pa(),h==="files"&&await yt()}async function Ca(t){Wt=(await E.shares(t)).shares}function Ls(){const t=Se.filter(a=>a.canShare);if(t.length===0)return null;const e=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return t.find(e)??t[0]??null}function fe(t){const e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),l=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${l}`}function hn(t,e){const a=new Date(t,e,1),l=new Date(t,e+1,0);return{from:fe(a),to:fe(l)}}function bs(t){if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[a,l,o]=t.split("-").map(Number);return new Date(a,l-1,o)}const e=new Date(t);if(Number.isNaN(e.getTime())){const[a,l,o]=t.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function yn(t){const e=bs(t.start);if(!t.end)return[fe(e)];let a=bs(t.end);if(!t.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(t.end)){const r=new Date(t.end);!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getSeconds()===0&&r.getTime()>new Date(t.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<e)return[fe(e)];const l=[],o=new Date(e.getFullYear(),e.getMonth(),e.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(fe(o)),o.setDate(o.getDate()+1);return l.length?l:[fe(e)]}function gs(t,e){const a=t.slice(0,10),l=(e||a).slice(0,10);if(a===l){const w=Na(a);return{start:w.start,end:w.end}}const[o,p,n]=a.split("-").map(Number),[r,u,f]=l.split("-").map(Number),y=_t(new Date(o,p-1,n,9,0,0,0)),v=_t(new Date(r,u-1,f,17,0,0,0));return{start:y,end:v}}function vn(t,e){const a=Xt(t);let l=e?Xt(e):a;if(e&&!/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=new Date(e);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(t).getTime()){const p=bs(e);p.setDate(p.getDate()-1),l=fe(p)}}return{start:a,end:l}}async function et(){if(M===null){Jt=[];return}const{from:t,to:e}=hn(Ct.y,Ct.m);os=!0,N.debug("loadMonthEvents",{selectedId:M,from:t,to:e});try{Jt=(await E.calendarEvents(M,t,e)).events,N.event("monthEvents.loaded",{calendarId:M,count:Jt.length,from:t,to:e})}catch(a){Jt=[],N.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{os=!1}}function $n(t,e){return new Date(t,e,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function wn(t){const e=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return e;const a=new Date(t.start);return Number.isNaN(a.getTime())?e:`${a.toLocaleTimeString(void 0,hs())} ${e}`}function kn(){const t=M!==null?Se.find(I=>I.id===M):null,e=(t==null?void 0:t.displayname)??"Calendar",a=t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6",l=Ct.y,o=Ct.m,p=new Date(l,o,1),n=ys(),r=(p.getDay()-n+7)%7,u=new Date(l,o+1,0).getDate(),f=new Date(l,o,0).getDate(),v=fe(new Date),w=qs(),x=new Map;for(const I of Jt)for(const Y of yn(I)){const H=x.get(Y)??[];H.push(I),x.set(Y,H)}const S=[],q=Math.ceil((r+u)/7)*7;for(let I=0;I<q;I++){let Y,H=!0,Q;I<r?(Y=f-r+I+1,H=!1,Q=new Date(l,o-1,Y)):I>=r+u?(Y=I-(r+u)+1,H=!1,Q=new Date(l,o+1,Y)):(Y=I-r+1,Q=new Date(l,o,Y));const ie=fe(Q),Ae=ie===v,xe=H?x.get(ie)??[]:[],mt=wa===ie?50:3,at=xe.slice(0,mt),$t=xe.length-at.length,Ve=at.map(J=>{const pt=M??0,Ue=wn(J);return`<button type="button" class="month-event${J.allDay?"":" is-timed"}" title="${i(Ue)}" style="--ev-color:${i(a)}"
            data-action="open-event" data-instance="${pt}" data-uri="${i(J.uri)}" ${c?"disabled":""}>${i(Ue)}</button>`}).join(""),Pt=$t>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${i(ie)}" title="Show all events this day" ${c?"disabled":""}>+${$t} more</button>`:"",A=!H&&(Y===1||I===r+u)?Q.toLocaleString(void 0,{month:"short",day:"numeric"}):String(Y),se=!!(t&&!t.readOnly&&(t.canShare||t.access==="readwrite"));S.push(`<div class="month-cell${H?"":" is-outside"}${Ae?" is-today":""}${se?" is-clickable":""}"${se?` data-action="new-event-day" data-day="${i(ie)}" role="button" tabindex="0" title="Add event on ${i(ie)}"`:""}>
        <div class="month-daynum${Ae?" is-today-num":""}">${i(A)}</div>
        <div class="month-events">${Ve}${Pt}</div>
      </div>`)}const ee=t?os?'<p class="muted small month-empty-hint">Loading events…</p>':"":Se.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${c?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${c?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${c?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i($n(l,o))}</h2>
        <span class="month-cal-name muted small" title="${i(e)}">
          <span class="cal-swatch" style="background:${i(a)};margin-top:0"></span>
          ${i(e)}
        </span>
      </div>
      ${ee}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${w.map(I=>`<div class="month-dow">${i(I)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${S.join("")}
        </div>
      </div>
    </section>`}function Xt(t){if(!t)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const e=new Date(t);return Number.isNaN(e.getTime())?t.slice(0,10):fe(e)}function Sn(){if(ia.timeFormat==="24h")return!1;if(ia.timeFormat==="12h")return!0;try{const e=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(e.hourCycle==="h23"||e.hourCycle==="h24")return!1;if(e.hourCycle==="h11"||e.hourCycle==="h12")return!0;if(typeof e.hour12=="boolean")return e.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function hs(){return Sn()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function ys(){var a;if(ia.weekStart==="monday")return 1;if(ia.weekStart==="sunday")return 0;const t=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of t)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const e=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(e)?0:1}function qs(){const t=ys(),e=new Date(2024,0,7+t),a=[];for(let l=0;l<7;l++){const o=new Date(e);o.setDate(e.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Os(t,e=15){const a=e*60*1e3,l=t.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function _t(t){const e=a=>String(a).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}function Dn(t,e){if(!t)return"Select…";if(e||/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=t.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((t.includes("T")&&t.length===16,t));return Number.isNaN(a.getTime())?t:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...hs()})}function Ea(t){if(!t){const a=Os(new Date);return{date:fe(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(t))return{date:t,hm:"09:00"};const e=new Date((t.length===16,t));return Number.isNaN(e.getTime())?{date:t.slice(0,10),hm:"09:00"}:{date:fe(e),hm:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}function Na(t){const e=new Date,a=fe(e);if(t&&t!==a){const[p,n,r]=t.split("-").map(Number),u=new Date(p,n-1,r,9,0,0,0),f=new Date(p,n-1,r,10,0,0,0);return{start:_t(u),end:_t(f)}}const l=Os(e,15),o=new Date(l.getTime()+3600*1e3);return{start:_t(l),end:_t(o)}}function An(){const t=[];for(let e=0;e<24;e++)for(let a=0;a<60;a+=15)t.push(`${String(e).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return t}function Zt(t){const{field:e,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:r,allowClear:u=!0}=t,f=(U==null?void 0:U.field)===e,y=Dn(o,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${i(e)}">
      <span class="dt-field-label">${i(l)}</span>
      <input type="hidden" name="${i(a)}" value="${i(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${i(e)}"
        data-dt-name="${i(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${u?"1":"0"}"
        ${r?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${i(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!r?Cn(e,o,p,u):""}
    </div>`}function vs(t){var e;return t==="start"?String(($==null?void 0:$.start)||""):t==="end"?String(($==null?void 0:$.end)||""):t==="until"?((e=$==null?void 0:$.repeat)==null?void 0:e.until)||Xt($==null?void 0:$.start)||fe(new Date):t==="due"?fa(z==null?void 0:z.due):t==="dtstart"?fa(ae==null?void 0:ae.dtstart):t==="bulk-due"?Ma:t==="birthday"?String((_==null?void 0:_.birthday)||""):""}function tt(t,e){if(t==="start"&&$){$={...$,start:e||""};return}if(t==="end"&&$){$={...$,end:e};return}if(t==="until"&&$){$={...$,repeat:{...$.repeat??Wa(),until:e,endMode:"until"}};return}if(t==="due"&&z){if(e===null||e==="")z={...z,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))z={...z,due:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));z={...z,due:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="dtstart"&&ae){if(e===null||e==="")ae={...ae,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))ae={...ae,dtstart:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));ae={...ae,dtstart:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="birthday"&&_){_={..._,birthday:e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null};return}t==="bulk-due"&&(Ma=e||"")}function Cn(t,e,a,l){const o=Ea(e),p=(U==null?void 0:U.viewY)??Number(o.date.slice(0,4)),n=(U==null?void 0:U.viewM)??Number(o.date.slice(5,7))-1,r=ys(),u=qs(),y=(new Date(p,n,1).getDay()-r+7)%7,v=new Date(p,n+1,0).getDate(),w=new Date(p,n,0).getDate(),x=o.date,S=o.hm,q=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),ee=[],I=Math.ceil((y+v)/7)*7;for(let H=0;H<I;H++){let Q,ie,Ae=!1;H<y?(Q=w-y+H+1,ie=new Date(p,n-1,Q),Ae=!0):H>=y+v?(Q=H-(y+v)+1,ie=new Date(p,n+1,Q),Ae=!0):(Q=H-y+1,ie=new Date(p,n,Q));const xe=fe(ie),mt=xe===x,at=xe===fe(new Date);ee.push(`<button type="button" class="dt-day${Ae?" is-outside":""}${mt?" is-selected":""}${at?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${i(xe)}">${Q}</button>`)}const Y=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${An().map(H=>{const Q=(()=>{const[ie,Ae]=H.split(":").map(Number);return new Date(2e3,0,1,ie,Ae).toLocaleTimeString(void 0,hs())})();return`<button type="button" class="dt-time${H===S?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${H}" role="option" aria-selected="${H===S}">${i(Q)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${i(q)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(H=>`<span class="dt-dow">${i(H)}</span>`).join("")}</div>
          <div class="dt-days">${ee.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${i(t)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${Y}
      </div>
    </div>`}function En(){s.querySelectorAll(".dt-field.is-open").forEach(t=>{const e=t.querySelector(".dt-trigger"),a=t.querySelector(".dt-popover");if(!e||!a)return;const l=e.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let r=l.bottom+6;r+n>window.innerHeight-o&&(r=Math.max(o,l.top-n-6));let u=l.left;u+p>window.innerWidth-o&&(u=Math.max(o,window.innerWidth-p-o)),u<o&&(u=o),a.style.top=`${Math.round(r)}px`,a.style.left=`${Math.round(u)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function Wa(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Nn(t){return t.endMode==="until"||t.endMode==="count"||t.endMode==="never"?t.endMode:t.until?"until":t.count?"count":"never"}function xn(){if(!dt||!$)return"";const t=$,e=t.repeat??Wa(),a=(e.freq||"").toUpperCase(),l=Se.filter(x=>x.canShare||x.access==="readwrite"),o=Se.filter(x=>x.id===t.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===t.instanceId?"selected":""}>${i(x.displayname)}</option>`).join(""),p=t.readOnly||!t.canWrite;let n,r;if(t.allDay)n=Xt(t.start),r=Xt(t.end);else{const x=t.start||"",S=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const q=gs(x,S||null);n=q.start,r=q.end||""}else n=fa(t.start),r=fa(t.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((e.byDay||[]).map(x=>x.toUpperCase())),y=Nn(e),v=!!a&&y==="until",w=e.until||(y==="until"?Xt(t.start)||fe(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${Xe?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Ot()}
          ${!Xe&&(t.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${p?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${p||l.length===0?"disabled":""}>
                ${o||`<option value="${t.instanceId}">${i(t.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${i(t.summary)}" ${p?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${i(t.location)}" ${p?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${p?"readonly":""}>${i(t.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${p?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${Zt({field:"start",name:"start",label:"Start",value:n,dateOnly:t.allDay,required:!0,disabled:p,allowClear:!1})}
              ${Zt({field:"end",name:"end",label:"End",value:r,dateOnly:t.allDay,disabled:p||v,allowClear:!v})}
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${i(String(e.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${u.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${f.has(x.code)?"checked":""} />
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
                      ${y==="until"?Zt({field:"until",name:"repeatUntil",label:"Until",value:w,dateOnly:!0,disabled:p,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${i(String(e.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${Xe?"Create event":"Save event"}</button>
                     ${Xe?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${c?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Tn(t,e){const a=Se.find(l=>l.id===e);return{uri:"",instanceId:e,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:Wa(),readOnly:!1,canWrite:!0}}async function It(t){gt=(await E.contacts(t,Yt)).contacts,re!==null&&!gt.some(a=>a.uri===re)&&(re=null,me||(_=null,Ce=null,je=null,Je=!1))}async function Lt(){const t=await E.tasks({q:za,sort:Tt,order:vt});Ee=t.tasks,Nt=t.calendars;const e=new Set(Ee.map(a=>oe(a.instanceId,a.uri)));ge=ge.filter(a=>e.has(a)),qe!==null&&!Ee.some(a=>`${a.instanceId}|${a.uri}`===qe)&&(qe=null,G||(z=null))}async function pa(){const t=await E.notes({q:Ha,sort:ua,order:Qt});ca=t.notes,xt=t.calendars,Ze!==null&&!ca.some(e=>`${e.instanceId}|${e.uri}`===Ze)&&(Ze=null,$e||(ae=null))}function oe(t,e){return`${t}|${e}`}function Us(t){if(!t)return"—";try{const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}function fa(t){if(!t)return"";try{const e=new Date(t);if(Number.isNaN(e.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${e.getFullYear()}-${a(e.getMonth()+1)}-${a(e.getDate())}T${a(e.getHours())}:${a(e.getMinutes())}`}catch{return""}}function qt(t,e,a,l,o,p=""){const n=a===e,r=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${i(e)}" role="columnheader" tabindex="0">${i(t)}${r}</th>`}async function _n(t){if(F===null)return;const e=await E.getContact(F,t);re=t,me=!1;const a=e.contact;_={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??Ps(),birthday:a.birthday??null},Ce=a.photoDataUri??(a.hasPhoto&&F!==null?`${E.contactPhotoUrl(F,t)}?t=${Date.now()}`:null),je=null,Je=!1,De=!0}function In(){me=!0,re=null,De=!0,_={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Ce=null,je=null,Je=!1}function Ps(){return{street:"",city:"",region:"",postal:"",country:""}}function Ln(t){return new Promise((e,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");e(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(t)})}function Ms(t,e={}){const a=!!d&&h==="admin"&&ve()&&Et(),o=`
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>${a?"AngaraDAV Administration Portal":"AngaraDAV User Portal"}</span>`,p=d?i(d.displayname||d.username):"",n=Et()?`<button type="button" class="user-menu-item${h==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",u=d?`<div class="user-menu${Ie?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${Ie?"true":"false"}"
              title="${p}">
              <span class="user-menu-name">${p}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${Ie?"":"hidden"}>
              ${a?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:""}
              ${n}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",f=d?`<nav class="topnav">
          <a class="brand" href="/portal/">${o}</a>
          <div class="topnav-right">
            ${u}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${o}</a>
        </nav>`,v=!(ue||Me||Fe!==null||He!==null||dt||De||We)?Ot():"",w=e.tabs&&e.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${e.tabs}
        </div>
      </div>`:"",x=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${i(Sa)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(jr)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return e.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${f}
      ${w}
    </div>
      <main class="container">
        ${v}
        ${t}
      </main>
      ${x}
      ${Yr()}
      ${qn()}`}function Ot(){return g?aa(g.type,g.message,{dismissible:!0}):""}function Fs(t){return!Number.isFinite(t)||t<0?"":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:`${(t/(1024*1024)).toFixed(1)} MB`}function ba(t){const e=Math.max(0,Math.floor(t)),a=Math.floor(e/60),l=e%60;return a>0?`${a}m ${l}s`:`${l}s`}function ut(){Fa!==null&&(clearInterval(Fa),Fa=null)}function Rs(){ut(),Fa=setInterval(()=>{if(!j||j.phase==="done"||j.phase==="error"){ut();return}j={...j,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},j.phase==="processing"&&js(j)},1e3)}function Ut(t,e={}){j&&(j={...j,phase:t,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3),...e},m())}function Vs(){ut(),j=null,m()}function Bs(t){!j||j.phase==="done"||j.phase==="error"||(j={...j,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},js(j))}function js(t){const e=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),l=s.querySelector(".import-progress-track"),o=s.querySelector("[data-import-counts]"),p=t.kind==="calendar"?"items":"contacts";let n;if(t.phase==="processing"&&t.processTotal>0)n=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${p} (${t.processPercent??0}%) · ${ba(t.elapsedSec)}`;else if(t.phase==="processing")n=`Importing on server… ${ba(t.elapsedSec)}`;else return;e&&(e.textContent=n),o&&(o.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),a&&t.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),l&&t.processPercent!==null&&(l.setAttribute("aria-valuenow",String(t.processPercent)),l.removeAttribute("aria-valuetext"))}function qn(){if(!j)return"";const t=j,e=t.phase!=="done"&&t.phase!=="error",a=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",o=(()=>{const r=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return r.map((y,v)=>{let w="pending";return t.phase==="done"||v<f?w="done":v===f&&(w=(t.phase==="error","active")),`<li class="import-step import-step-${w}"><span class="import-step-icon" aria-hidden="true">${w==="done"?"✓":w==="active"?"●":"○"}</span> ${i(y.label)}</li>`}).join("")})();let p="";if(e){let r=null;t.phase==="reading"&&t.readPercent!==null?r=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(r=Math.min(100,Math.max(0,t.processPercent)));const u=r===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=r!==null?` style="width:${r}%"`:"",y=t.kind==="calendar"?"items":"contacts";let v;t.phase==="reading"?v=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?v="Uploading to server…":t.processTotal>0?v=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${y} (${t.processPercent??0}%) · ${ba(t.elapsedSec)}`:v=`Importing on server… ${ba(t.elapsedSec)}`;const w=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${i(a)}</strong> from
          <span class="mono">${i(t.fileName)}</span>
          ${t.fileSizeLabel?` <span class="muted">(${i(t.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${u}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${i(v)}</p>
        ${w}
        <p class="muted small">Keep this tab open until the import finishes.
          ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else t.phase==="done"?p=`
        ${aa("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(t.fileName)}</span>
          · Took ${i(ba(t.elapsedSec))}
        </p>`:p=`
        ${aa("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(t.fileName)}</span>
          · After ${i(ba(t.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=e?'<p class="muted small" style="margin:0">Please wait…</p>':rn([{label:"Close",action:"close-import-progress",variant:"primary"}]);return ke({title:l,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:e,lockBackdrop:e,body:p,footer:n})}function zs(t,e){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?e(Math.min(100,Math.round(p.loaded/p.total*100))):e(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(t)})}function Hs(){s.innerHTML=Ms(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function On(){if(!d){Hs();return}const t=Se.filter(D=>D.canShare),e=Se.filter(D=>!D.canShare),a=Se.find(D=>D.id===M)??null,l=t.map(D=>{const be=D.id===M?" is-selected":"",bt=D.color?`<span class="cal-swatch" style="background:${i(D.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ia=$s(D.access)+(D.readOnly?'<span class="badge">read-only</span>':"")+(D.holidaysCountry?`<span class="badge badge-admin">holidays ${i(D.holidaysCountry)}</span>`:"");return`<div class="cal-row${be}" data-action="select-cal" data-id="${D.id}" role="button" tabindex="0">
          ${bt}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(D.displayname)}</span>
            <span class="cal-row-badges">${Ia}</span>
            <span class="muted small mono cal-row-uri">${i(D.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${D.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${D.id}" ${c?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=e.map(D=>{const be=D.id===M?" is-selected":"",bt=D.color?`<span class="cal-swatch" style="background:${i(D.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ia=D.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${be}" data-action="select-cal" data-id="${D.id}" role="button" tabindex="0" title="${i(Ia)}">
          ${bt}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(D.displayname)}</span>
            <span class="cal-row-badges">${$s(D.access)}</span>
            <span class="muted small">${D.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=Ht.map(D=>`<option value="${i(D.username)}">${i(D.displayname)} (${i(D.username)})</option>`).join(""),n=Wt.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':Wt.map(D=>`<tr>
                <td>
                  <strong>${i(D.displayname||D.username||D.href)}</strong>
                  <div class="muted small mono">${i(D.username||D.href)}</div>
                </td>
                <td>${$s(D.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(D.href)}" ${c?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),r=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",u=!!(a&&a.readOnly),f=ue&&a&&a.canShare?ke({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Ot()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${i(a.uri)}
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
                        value="${i(a.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${i(r)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${i(a.color||r)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${i(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${he(`Share “${a.displayname}”`,"share")}
                  ${u?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${Ht.length===0?"disabled":""}>
                        <option value="">${Ht.length?"Select user…":"No other users"}</option>
                        ${p}
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
                      <button type="submit" class="btn btn-primary" ${c||Ht.length===0?"disabled":""}>Share</button>
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
                  ${he("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${c?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${c||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${c||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",y=Fe!==null?Se.find(D=>D.id===Fe&&D.canShare)??null:null,v=y?ke({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Ot()}
              <p>You are about to permanently delete <strong>${i(y.displayname)}</strong>
                <span class="muted small mono">(${i(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${Xa({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:c},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${y.id}"`}]}):"",w=Me?ke({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Ot()}
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
                    ${Pa.map(D=>`<option value="${i(D.code)}">${i(D.name)} (${i(D.code)})</option>`).join("")}
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
              ${he("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${e.length?`<div class="calendars-shared-block">
                       ${he("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${c?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${kn()}
      </div>
      ${w}
      ${f}
      ${v}
      ${xn()}`,S=Le.map(D=>`<div class="cal-row${D.id===F?" is-selected":""}" data-action="select-ab" data-id="${D.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(D.displayname)}</span>
            <span class="muted small">${D.cardCount} contact${D.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(D.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${D.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${D.id}" ${c?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),q=Le.find(D=>D.id===F)??null,ee=gt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Yt?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:gt.map(D=>{const be=!me&&D.uri===re?" is-selected":"",bt=i((D.displayname||"?").slice(0,1).toUpperCase()),Ia=D.hasPhoto&&F!==null?`<img class="contact-avatar" src="${i(E.contactPhotoUrl(F,D.uri))}" alt="" loading="lazy" data-avatar-fallback="${bt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${bt}</span>`;return`<tr class="contact-table-row${be}" data-action="select-contact" data-uri="${i(D.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ia}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(D.displayname)}</span>
                      ${D.org?`<span class="muted small contact-name-secondary">${i(D.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(D.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(D.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(D.org||"—")}</span></td>
              </tr>`}).join(""),I=_,Y=Array.isArray(I==null?void 0:I.emails)&&I.emails.length>0?I.emails:[""],H=Array.isArray(I==null?void 0:I.phones)&&I.phones.length>0?I.phones:[{type:"cell",value:""}],Q=(I==null?void 0:I.address)??Ps(),ie=Y.map((D,be)=>`<div class="multi-row" data-multi="email" data-idx="${be}">
          <input type="email" name="email_${be}" value="${i(D??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${be}" ${Y.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Ae=H.map((D,be)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${be}">
          <select name="phone_type_${be}" aria-label="Phone type">
            ${["cell","work","home","other"].map(bt=>`<option value="${bt}" ${((D==null?void 0:D.type)??"other")===bt?"selected":""}>${bt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${be}" value="${i((D==null?void 0:D.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${be}" ${H.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),xe=Array.isArray(I==null?void 0:I.custom)?I.custom:[],mt=xe.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':xe.map((D,be)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${be}">
                <input type="text" name="custom_label_${be}" value="${i(D.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${be}" value="${i(D.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${be}" title="Remove">×</button>
              </div>`).join(""),at=De&&I&&q?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${me?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Ot()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${Ce?`<img src="${i(Ce)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((I.fullname||I.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                        ${Ce?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${c?"disabled":""} hidden />
                      </label>
                      ${Ce||I.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${c?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${i(I.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${i(I.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${i(I.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${i(I.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${i(I.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${ie}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${Y.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${Ae}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${H.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${i(Q.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${i(Q.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${i(Q.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${i(Q.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${i(Q.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${i(I.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${Zt({field:"birthday",name:"birthday",label:"Birthday",value:I.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${mt}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${xe.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${i(I.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${c?"disabled":""}>${me?"Create contact":"Save contact"}</button>
                    ${!me&&I.uri?`<button type="button" class="btn" data-action="export-contact" ${c?"disabled":""}>Export .vcf</button>`:""}
                    ${me?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${c?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${c?"disabled":""}>Cancel</button>
                    ${!me&&I.uri?`<span class="muted small mono">${i(I.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",$t=We&&q?ke({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Ot()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${i(q.uri)} · ${q.cardCount} contact${q.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${i(q.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${i(q.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(q.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${he("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${c?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${c?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",Ve=He!==null?Le.find(D=>D.id===He)??null:null,Pt=Ve?ke({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Ot()}
              <p>You are about to permanently delete <strong>${i(Ve.displayname)}</strong>
                <span class="muted small mono">(${i(Ve.uri)})</span>.</p>
              <p class="muted small">${(Ve.cardCount??0)>0?`All ${Ve.cardCount} contact${Ve.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${Xa({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:c},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${Ve.id}"`}]}):"",A=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${he("Address books","address-books")}
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
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${q?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${he("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${i(Yt)}" aria-label="Search contacts" ${c?"disabled":""} />
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
                        ${ee}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Pt}
      ${$t}
      ${at}`,se=h==="calendars"?"my-calendars":h==="contacts"?"my-contacts":h==="tasks"?"tasks":h==="notes"?"notes":h==="files"?"files":"administration",J=tr(),pt=ar(),Ue=Mn(),ft=Qn(),Ga=h==="calendars"?x:h==="contacts"?A:h==="tasks"?J:h==="notes"?pt:h==="files"?Ue:ft,Tr=h==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${Fn()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${k==="overview"?"admin-overview":k==="users"?"admin-users":k==="settings"?"admin-settings":"admin-database"}"
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
            data-info="${se}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;s.innerHTML=Ms(Ga,{tabs:Tr}),document.body.classList.toggle("cal-modal-open",ue||Me||Fe!==null||He!==null||dt||De||We||j!==null||we!==null||pe!==null||ne!==null||ct||Be||_e||ot!==null||na||ra||ze!==null||Qe!==null||ye!==null),document.body.classList.toggle("layout-contacts",h==="contacts"),document.body.classList.toggle("layout-calendars",h==="calendars"),document.body.classList.toggle("layout-tasks",h==="tasks"||h==="notes"),document.body.classList.toggle("layout-files",h==="files"),document.body.classList.toggle("layout-admin",h==="admin")}function Un(t){const e=t?t.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${c?"disabled":""}>Home</button>`];for(const o of e){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${i(p)}" ${c?"disabled":""}>${i(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function ga(t){return!Number.isFinite(t)||t<0?"—":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:t<1024*1024*1024?`${(t/(1024*1024)).toFixed(1)} MB`:`${(t/(1024*1024*1024)).toFixed(2)} GB`}function Pn(t){if(!t)return"—";try{return new Date(t*1e3).toLocaleString()}catch{return"—"}}function Mn(){const t=fs;if(!t)return`<div class="card"><p class="muted">${ma||c?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${he("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${he("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${i(t.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${i(t.davPath)}</span></p>
        </section>
      </div>`;const e=t.quotaBytes>0?`${ga(t.usedBytes)} used · ${ga(t.availableBytes)} free of ${ga(t.quotaBytes)}`:`${ga(t.usedBytes)} used · ${ga(t.availableBytes)} free (no app quota)`,a=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,l=le.length,o=Ne.length>0&&Ne.every(w=>le.includes(w.path)),p=l>0,n=l>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${l} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${c?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${c?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${c?"disabled":""}>Delete</button>
            </div>
          </div>`:"",r=Ne.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':Ne.map(w=>{const x=le.includes(w.path),S=w.type==="dir"?"📁":"📄",q=w.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${i(w.path)}" ${c?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${S}</span>${i(w.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${S}</span>${i(w.name)}</span>`,ee=w.type==="dir"?"—":ga(w.size);return`<tr class="files-row${x?" is-checked":""}" data-path="${i(w.path)}" data-type="${w.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${i(w.path)}"
                    ${x?"checked":""} ${c?"disabled":""}
                    aria-label="Select ${i(w.name)}" />
                </td>
                <td class="files-col-name">${q}</td>
                <td class="files-col-size mono">${ee}</td>
                <td class="files-col-mtime hide-sm">${i(Pn(w.mtime))}</td>
                <td class="files-col-actions">
                  ${w.type==="file"?`<a class="btn btn-ghost btn-small" href="${i(E.filesDownloadUrl(w.path))}" download="${i(w.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${i(w.path)}" ${c?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${i(w.path)}" ${c?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${i(w.path)}" data-name="${i(w.name)}" ${c?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${i(w.path)}" data-name="${i(w.name)}" ${c?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),u=we!==null?(()=>{const w=Ne.find(S=>S.path===we),x=(w==null?void 0:w.name)??"";return ke({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${i(we)}" />
                    <label>New name
                      <input type="text" name="newName" value="${i(x)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:c}]})})():"",f=pe!==null&&pe.length>0?(()=>{const w=pe,x=w.length>1,S=Ne.find(I=>I.path===w[0]),q=x?`Delete ${w.length} items`:`Delete ${(S==null?void 0:S.type)==="dir"?"folder":"file"}`,ee=x?`<p style="margin:0 0 0.75rem">Delete <strong>${w.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${w.slice(0,12).map(I=>{const Y=Ne.find(H=>H.path===I);return`<li><span class="mono">${i((Y==null?void 0:Y.name)??I)}</span></li>`}).join("")}
                   ${w.length>12?`<li>…and ${w.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${i((S==null?void 0:S.name)??w[0])}</strong>?${(S==null?void 0:S.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return ke({id:"files-delete-modal",title:q,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:ee,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:c}]})})():"",y=ne!==null&&ne.paths.length>0?(()=>{const w=ne.op,x=ne.paths,S=x.length>1,q=Ne.find(H=>H.path===x[0]),ee=(q==null?void 0:q.name)??Ja(x[0]),I=S?`${w==="copy"?"Copy":"Move"} ${x.length} items`:`${w==="copy"?"Copy":"Move"} ${(q==null?void 0:q.type)==="dir"?"folder":"file"}`,Y=Oe;return ke({id:"files-transfer-modal",title:I,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"sm",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${S?`<p class="muted small" style="margin:0 0 0.75rem">${x.length} items will be ${w==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${i(ee)}</span></p>`}
                    <label>Destination folder
                      <input type="text" name="toPath" value="${i(Y)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${S?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${i(ee)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${w==="copy"?"Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination).":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:w==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:c}]})})():"",v=ct?ke({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${i(Oe===""?"Home":Oe)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:c}]}):"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${he("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${i(e)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${Un(Oe)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${c||ma?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${c?"disabled":""}>New folder</button>
            <label class="btn btn-primary btn-small files-upload-btn" ${c?"aria-disabled=true":""}>
              Upload
              <input type="file" data-action="files-upload" ${c?"disabled":""} multiple hidden />
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
                    ${c||Ne.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ma&&Ne.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':r}
            </tbody>
          </table>
        </div>
      </section>
      ${u}
      ${f}
      ${y}
      ${v}
    </div>`}function Ja(t){const e=t.replace(/\\/g,"/").split("/").filter(Boolean);return e[e.length-1]||t}function Fn(){const t=["overview","settings","users","database"],e={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=W==null?void 0:W.pages,l=new Map;if(a)for(const o of a)ns(o.id)&&l.set(o.id,o);return t.map(o=>{const p=l.get(o),n=(p==null?void 0:p.label)||e[o],r=(p==null?void 0:p.status)??(o==="overview"?"read-only":"full"),u=(p==null?void 0:p.available)===!1;return`<button type="button" role="tab" class="tab-btn${k===o?" is-active":""}${u?" is-gated":""}"
            data-action="admin-page" data-admin-page="${o}"
            aria-selected="${k===o}"
            title="${i(n)}${u?" — "+da(r):""}">
            ${i(n)}
          </button>`}).join("")}function Ya(t){const e=Re(t),a=(e==null?void 0:e.status)??"coming-soon",l=(e==null?void 0:e.label)??t,o=(e==null?void 0:e.summary)||"This area is not available in portal Administration yet.",p=da(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${Da(a)}">${i(p)}</span>
        <h2 class="admin-coming-soon-title">${i(l)}</h2>
      </div>
      <p class="muted">${i(o)}</p>
    </section>`}function ea(t,e){return`<span class="badge ${t?"badge-ok":"badge-off"}">${i(e)}: ${t?"On":"Off"}</span>`}function ta(t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}function xa(t,e,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${i(String(e))}</div>
      <div class="admin-stat-label">${i(t)}</div>
      ${a?`<div class="admin-stat-hint muted small">${i(a)}</div>`:""}
    </div>`}function Rn(){const t=Re("overview");if(t&&t.available===!1)return Ya("overview");const e=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${i((d==null?void 0:d.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",l="";if(O&&!L)l='<section class="card"><p class="muted">Loading overview…</p></section>';else if(R&&!L)l=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${i(R)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${c?"disabled":""}>Retry</button>
      </section>`;else if(L){const o=L,p=o.services,n=o.links??{},r=t?`<span class="badge ${Da(t.status)}">${i(da(t.status))}</span>`:"",u=o.version?i(o.version):"—",f=o.git?i(o.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${he("About this system","admin-overview")}
            <div class="section-actions">
              ${r}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${c||O?"disabled":""}>Refresh</button>
            </div>
          </div>
          <div class="admin-about-grid">
            <div>
              <h3 class="admin-subsection-title">Version</h3>
              <p>
                AngaraDAV <span class="badge badge-admin">v${u}</span>
                ${f?`<span class="mono muted small"> (${f})</span>`:""}
              </p>
              <p class="muted small admin-link-row">
                ${n.releases?`<a href="${i(n.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
                ${n.docs?`${n.releases?'<span class="footer-sep">·</span>':""}<a href="${i(n.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
              </p>
            </div>
            <div>
              <h3 class="admin-subsection-title">Services</h3>
              <div class="admin-service-table-wrap">
                <table class="admin-kv-table">
                  <tbody>
                    <tr><td>Administration</td><td>${ta(p.administration!==!1&&p.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${ta(!!p.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${ta(!!p.carddav)}</td></tr>
                    <tr><td>Files</td><td>${ta(!!p.files)}</td></tr>
                    <tr><td>Tasks</td><td>${ta(!!p.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${ta(!!p.notes)}</td></tr>
                    <tr><td>Push</td><td>${ta(!!p.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${e}
        </section>`;const y=o.nbusers??o.users,v=o.nbcalendars??o.calendars,w=o.nbevents??o.events,x=o.nbbooks??o.addressBooks,S=o.nbcontacts??o.contacts;l=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${xa("Registered users",y,"Users")}
            ${xa("Calendars",v,"CalDAV")}
            ${xa("Events",w,"CalDAV")}
            ${xa("Address books",x,"CardDAV")}
            ${xa("Contacts",S,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${ea(p.administration!==!1&&p.webAdmin!==!1,"Administration")}
            ${ea(!!p.caldav,"CalDAV")}
            ${ea(!!p.carddav,"CardDAV")}
            ${ea(!!p.files,"Files")}
            ${ea(!!p.tasks,"Tasks")}
            ${ea(!!p.notes,"Notes")}
            ${ea(!!p.push,"Push")}
          </div>
        </section>`}else l=`<section class="card">
        ${he("System snapshot","admin-overview")}
        ${e}
      </section>`;return`${a}
      ${l}`}function Vn(){const t=lt.trim().toLowerCase();return t?ce.filter(e=>e.username.toLowerCase().includes(t)||(e.displayname||"").toLowerCase().includes(t)||(e.email||"").toLowerCase().includes(t)):ce}function Bn(){return Be?ke({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:c},{label:"Create user",type:"submit",variant:"primary",disabled:c}]}):""}function jn(){if(!_e||!V)return"";const t=V;return ke({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
          <p class="muted small">Username <span class="mono">${i(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${i(t.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${i(t.displayname)}" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${i(t.email)}" autocomplete="off" ${c?"disabled":""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${c?"disabled":""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${c?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:c},{label:"Save changes",type:"submit",variant:"primary",disabled:c}]})}function zn(){if(!ot)return"";const t=ot,e=V&&V.username.toLowerCase()===t.toLowerCase()?V:ce.find(l=>l.username.toLowerCase()===t.toLowerCase())??null,a=e?`${e.displayname||e.username} (${e.username})`:t;return ke({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${i(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${Xa({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:kt,disabled:c,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:c},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:c||!kt,attrs:`data-username="${i(t)}"`}]})}function Hn(){if(!B)return"";if(K&&!V)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${i(B)}</span>…</p>
      </section>`;if(Te&&!V)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${i(Te)}</p>
      </section>`;if(!V)return"";const t=V,e=ya&&St.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':St.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':St.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${i(u.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${i(u.displayname)}" ${c?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=ya&&Dt.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':Dt.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':Dt.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${i(u.displayname)}" ${c?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),l=Rt!==null?St.find(u=>u.instanceId===Rt)??null:null,o=Vt!==null?Dt.find(u=>u.id===Vt)??null:null,p=ze==="create"||ze==="edit"&&l?ke({title:ze==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${l?l.instanceId:""}" />
            ${ze==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${c?"disabled":""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`:`<p class="muted small">URI <span class="mono">${i(l.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((l==null?void 0:l.displayname)??"")}" ${c?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${c?"disabled":""}>${i((l==null?void 0:l.description)??"")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${i((l==null?void 0:l.calendarcolor)??"")}" ${c?"disabled":""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${l!=null&&l.todos||ze==="create"?"checked":""} ${c?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${l!=null&&l.notes?"checked":""} ${c?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:c},{label:"Save",type:"submit",variant:"primary",disabled:c}]}):"",n=Qe==="create"||Qe==="edit"&&o?ke({title:Qe==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${o?o.id:""}" />
            ${Qe==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${c?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${i(o.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((o==null?void 0:o.displayname)??"")}" ${c?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${c?"disabled":""}>${i((o==null?void 0:o.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:c},{label:"Save",type:"submit",variant:"primary",disabled:c}]}):"",r=ye?ke({title:`Delete ${ye.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${i(ye.label)}</strong> for <span class="mono">${i(t.username)}</span>?</p>
          ${ye.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${ye.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:c}]}):"";return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${i(t.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${i(t.username)}" ${c?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${i(t.username)}" ${c?"disabled":""}>Delete</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
      </div>
      <p class="muted small admin-breadcrumb">Users → <span class="mono">${i(t.username)}</span></p>
      <dl class="admin-dl">
        <div><dt>Username</dt><dd class="mono">${i(t.username)}</dd></div>
        <div><dt>Display name</dt><dd>${i(t.displayname||"—")}</dd></div>
        <div><dt>Email</dt><dd>${t.email?`<a href="mailto:${i(t.email)}">${i(t.email)}</a>`:"—"}</dd></div>
        <div><dt>Principal</dt><dd class="mono">${i(t.principal)}</dd></div>
        <div><dt>Calendars</dt><dd>${i(String(t.calendarCount))}</dd></div>
        <div><dt>Events / objects</dt><dd>${i(String(t.eventCount))}</dd></div>
        <div><dt>Address books</dt><dd>${i(String(t.addressBookCount))}</dd></div>
        <div><dt>Contacts</dt><dd>${i(String(t.contactCount))}</dd></div>
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
          <tbody>${e}</tbody>
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
    ${p}${n}${r}`}function Wn(){const t=Re("users");if(t&&t.available===!1)return Ya("users");const e=Vn(),a=de&&ce.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':e.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${Z?i(Z):lt.trim()?"No users match this filter.":"No users found."}</td></tr>`:e.map(l=>`<tr class="contact-table-row${B&&B.toLowerCase()===l.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${i(l.username)}" tabindex="0" role="button">
                  <td class="mono">${i(l.username)}</td>
                  <td class="hide-sm">${i(l.displayname||"—")}</td>
                  <td class="hide-sm">${i(l.email||"—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${i(l.username)}" ${c?"disabled":""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${i(l.username)}" ${c?"disabled":""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${i(l.username)}" ${c?"disabled":""}>Delete</button>
                  </td>
                </tr>`).join("");return`
      <section class="card">
        <div class="section-header">
          ${he("Users","admin-users")}
          <div class="section-actions">
            ${t?`<span class="badge ${Da(t.status)}">${i(da(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${c||de?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${c?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${i(lt)}" aria-label="Filter users" ${c?"disabled":""} />
          <span class="muted small">${i(String(e.length))}${lt.trim()?` / ${ce.length}`:""} user${e.length===1?"":"s"}</span>
        </div>
        ${Z&&ce.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${i(Z)}</p>`:""}
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
      ${Hn()}
      ${Bn()}
      ${jn()}
      ${zn()}`}function Jn(){const t=Re("settings");if(t&&t.available===!1)return Ya("settings");if(Oa&&!Bt)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(va&&!Bt)return`<section class="card">
        <p class="flash flash-error">${i(va)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const e=Bt;if(!e)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(o,p,n)=>`<label class="check-row"><input type="checkbox" name="${i(o)}" ${p?"checked":""} ${c||e.writable===!1?"disabled":""} /> ${i(n)}</label>`,l=(o,p,n,r="")=>`<label>${i(n)}
        <input type="number" name="${i(o)}" value="${i(String(p??0))}" ${c||e.writable===!1?"disabled":""} />
        ${r?`<span class="muted small">${i(r)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${he("System settings","admin-settings")}
          <div class="section-actions">
            ${t?`<span class="badge ${Da(t.status)}">${i(da(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${c?"disabled":""}>Reload</button>
          </div>
        </div>
        <p class="muted small">
          Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
          <strong>session timeout</strong> affects portal idle sessions.
          ${e.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
        </p>
        <form class="stack admin-settings-form" data-form="admin-settings">
          <h3 class="admin-subsection-title">DAV services</h3>
          ${a("cal_enabled",!!e.cal_enabled,"Enable CalDAV")}
          ${a("card_enabled",!!e.card_enabled,"Enable CardDAV")}
          ${a("tasks_enabled",!!e.tasks_enabled,"Enable Tasks (VTODO)")}
          ${a("notes_enabled",!!e.notes_enabled,"Enable Notes (VJOURNAL)")}
          <label>WebDAV authentication type
            <select name="dav_auth_type" ${c||e.writable===!1?"disabled":""}>
              ${["Digest","Basic","Apache"].map(o=>`<option value="${o}" ${e.dav_auth_type===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${c||e.writable===!1?"disabled":""}>
              ${nn(e.timezone||"UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${i(e.invite_from||"")}" placeholder="noreply@example.com" ${c||e.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${a("files_enabled",!!e.files_enabled,"Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${i(e.files_storage_path||"")}" placeholder="empty = Specific/files" ${c||e.writable===!1?"disabled":""} />
          </label>
          ${l("files_max_upload_mb",e.files_max_upload_mb,"Max file size (MB)")}
          ${l("files_quota_mb",e.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${l("files_quarantine_days",e.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${l("session_max_age_minutes",e.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${c||e.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(o=>`<option value="${o}" ${(e.portal_log_level||"off")===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          ${a("portal_admin_ui_enabled",e.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${i(Array.isArray(e.portal_admin_users)?e.portal_admin_users.join(", "):String(e.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${c||e.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${a("push_enabled",!!e.push_enabled,"Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${i(e.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${c||e.writable===!1?"disabled":""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${c||e.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(o=>`<option value="${o}" ${(e.push_log_level||"off")===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>

          <h3 class="admin-subsection-title">Server admin password</h3>
          <p class="muted small">
            Stored in <span class="mono">baikal.yaml</span> for install recovery.
            Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
            ${e.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
          </p>
          <label>New server admin password
            <input type="password" name="admin_password" autocomplete="new-password" ${c||e.writable===!1?"disabled":""} />
          </label>
          <label>Confirm server admin password
            <input type="password" name="admin_password_confirm" autocomplete="new-password" ${c||e.writable===!1?"disabled":""} />
          </label>

          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${c||e.writable===!1?"disabled":""}>Save settings</button>
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
          <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${c||e.writable===!1?"disabled":""}>
            Reset to Default
          </button>
        </div>
      </section>
      ${Yn()}`}function Yn(){return na?ke({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${Xa({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:At,disabled:c,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:c},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:c||!At}]}):""}function Kn(){const t=Re("database");if(t&&t.available===!1)return Ya("database");if(Ua&&!jt)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if($a&&!jt)return`<section class="card">
        <p class="flash flash-error">${i($a)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const e=jt;if(!e)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=zt,l=e.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${he("Database","admin-database")}
          <div class="section-actions">
            ${t?`<span class="badge ${Da(t.status)}">${i(da(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${c?"disabled":""}>Refresh</button>
          </div>
        </div>
        <p class="flash flash-info" style="margin-bottom:1rem">${i(e.warning)}</p>
        <dl class="admin-dl admin-dl-stack">
          <div>
            <dt>Current backend</dt>
            <dd><span class="badge badge-admin">${i((e.backend||"—").toUpperCase())}</span></dd>
          </div>
          ${e.backend==="sqlite"||e.sqlite_file?`<div>
            <dt>SQLite file</dt>
            <dd class="mono admin-dl-path">${i(e.sqlite_file||"—")}</dd>
          </div>`:""}
          ${e.backend==="pgsql"||e.pgsql_host?`<div>
            <dt>PostgreSQL</dt>
            <dd class="mono admin-dl-path">${i(e.pgsql_host||"—")} / ${i(e.pgsql_dbname||"—")} · ${i(e.pgsql_username||"—")}</dd>
          </div>
          <div>
            <dt>Password</dt>
            <dd>${e.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>`:""}
          <div>
            <dt>Encryption key</dt>
            <dd>${e.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>
        </dl>

        <h3 class="admin-subsection-title">Edit connection</h3>
        ${l?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
        <form class="stack admin-database-form" data-form="admin-database">
          <label>Backend
            <select name="backend" data-action="admin-db-backend" ${c||l?"disabled":""}>
              <option value="sqlite" ${a==="sqlite"?"selected":""}>SQLite</option>
              <option value="pgsql" ${a==="pgsql"?"selected":""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${a==="sqlite"?"":"display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${i(e.sqlite_file||"")}" ${c||l?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${i(e.pgsql_host||"")}" placeholder="localhost:5432" ${c||l?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${i(e.pgsql_dbname||"")}" ${c||l?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${i(e.pgsql_username||"")}" autocomplete="off" ${c||l?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${e.hasPassword?"Leave blank to keep current":""}" ${c||l?"disabled":""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${c||l?"disabled":""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${Gn()}`}function Gn(){if(!ra)return"";const t=it.trim()==="CONFIRM";return ke({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${i(it)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${c?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:c},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:c||!t}]})}function Qn(){return ve()?Et()?k==="users"?Wn():k==="settings"?Jn():k==="database"?Kn():Rn():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function Xn(t){const e=new Map;for(const f of t)f.uid&&e.set(f.uid,f);const a=new Map(t.map((f,y)=>[oe(f.instanceId,f.uri),y])),l=new Map,o=[];for(const f of t){const y=f.parentUid;if(y&&e.has(y)&&y!==f.uid){const v=l.get(y)??[];v.push(f),l.set(y,v)}else o.push(f)}const p=(f,y)=>(a.get(oe(f.instanceId,f.uri))??0)-(a.get(oe(y.instanceId,y.uri))??0);o.sort(p);for(const[,f]of l)f.sort(p);const n=[],r=new Set,u=(f,y)=>{const v=f.uid||oe(f.instanceId,f.uri);if(!r.has(v)){r.add(v),n.push({task:f,depth:Math.min(y,8)});for(const w of l.get(f.uid)??[])u(w,y+1);r.delete(v)}};for(const f of o)u(f,0);for(const f of t)n.some(y=>y.task===f)||n.push({task:f,depth:0});return n}function Zn(t){const e=new Set([t]);if(!t)return e;let a=!0;for(;a;){a=!1;for(const l of Ee)l.parentUid&&e.has(l.parentUid)&&l.uid&&!e.has(l.uid)&&(e.add(l.uid),a=!0)}return e}function er(t,e){const a=t.instanceId,l=e||!t.uid?new Set:Zn(t.uid),o=Ee.filter(r=>r.uid&&r.instanceId===a&&!l.has(r.uid)&&r.uid!==t.uid),p=t.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(r=>`<option value="${i(r.uid)}" ${r.uid===p?"selected":""}>${i(r.summary||r.uid)}</option>`)];if(p&&!o.some(r=>r.uid===p)){const r=Ee.find(u=>u.uid===p);n.push(`<option value="${i(p)}" selected>${i((r==null?void 0:r.summary)||p)} (current)</option>`)}return n.join("")}function Ws(){const t=new Set(ge);return Ee.filter(e=>t.has(oe(e.instanceId,e.uri))&&e.canWrite&&!e.readOnly)}function tr(){const t=S=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[S]||S,e=Xn(Ee),a=Ee.filter(S=>S.canWrite&&!S.readOnly).map(S=>oe(S.instanceId,S.uri)),l=a.length>0&&a.every(S=>ge.includes(S)),o=ge.length>0,n=Ws().length,r=Ee.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${za?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:e.map(({task:S,depth:q})=>{const ee=oe(S.instanceId,S.uri),I=!G&&ee===qe?" is-selected":"",Y=ge.includes(ee),H=S.status==="COMPLETED"?"badge-ok":S.status==="CANCELLED"?"":"badge-admin",Q=q>0?` style="--task-depth:${q}"`:"",ie=q>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",Ae=S.canWrite&&!S.readOnly;return`<tr class="contact-table-row task-row${q>0?" is-subtask":""}${I}${Y?" is-checked":""}" data-action="select-task" data-instance="${S.instanceId}" data-uri="${i(S.uri)}" tabindex="0" role="button"${Q}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${S.instanceId}" data-uri="${i(S.uri)}"
                    ${Y?"checked":""} ${Ae?"":"disabled"} aria-label="Select ${i(S.summary||S.uri)}" ${c?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${ie}<span class="contact-name-primary">${i(S.summary||S.uri)}</span></span>
                  ${S.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${H}">${i(t(S.status))}</span></td>
                <td class="col-task-due muted small">${i(Us(S.due))}</td>
                <td class="col-task-cal muted small">${i(S.calendarName)}</td>
                <td class="col-task-pct muted small">${S.percent?i(String(S.percent))+"%":"—"}</td>
              </tr>`}).join(""),u=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(S,q)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${S}"
        title="${i(q)}" aria-label="${i(q)}" ${c||n===0?"disabled":""}>${u}</button>`,y=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${ge.length!==n?`<span class="muted small bulk-bar-count-extra">(${ge.length-n} read-only skipped)</span>`:""}
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
                ${f("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${Zt({field:"bulk-due",name:"bulkDue",label:"Due",value:Ma,dateOnly:!1,disabled:c||n===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${c||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${c||n===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${c||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${c?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",v=z,w=Nt.map(S=>`<option value="${S.id}" ${v&&v.instanceId===S.id?"selected":""}>${i(S.displayname)}</option>`).join(""),x=v?`<div class="card">
            ${he(G?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${G?`<label>Calendar
                      <select name="instanceId" required ${Nt.length===0?"disabled":""}>
                        <option value="">${Nt.length?"Select calendar…":"No writable calendars"}</option>
                        ${w}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(v.calendarName)}</strong>${v.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(v.summary)}" ${v.readOnly&&!G?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${v.readOnly&&!G?"readonly":""}>${i(v.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${v.readOnly&&!G?"disabled":""}>
                  ${er(v,G)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${v.readOnly&&!G?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(S=>`<option value="${S}" ${v.status===S?"selected":""}>${i(t(S))}</option>`).join("")}
                  </select>
                </label>
                ${Zt({field:"due",name:"due",label:"Due",value:fa(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!G),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${i(String(v.priority||0))}" ${v.readOnly&&!G?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${i(String(v.percent||0))}" ${v.readOnly&&!G?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${G||v.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${G?"Create task":"Save task"}</button>`:""}
                ${!G&&v.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${c?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${c?"disabled":""}>Delete</button>`:G?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${he("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(za)}" aria-label="Search tasks" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${c||Nt.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${Nt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||c?"disabled":""} />
                </th>
                ${qt("Title","summary",Tt,vt,"task","col-task-title")}
                ${qt("Status","status",Tt,vt,"task","col-task-status")}
                ${qt("Due","due",Tt,vt,"task","col-task-due")}
                ${qt("Calendar","calendar",Tt,vt,"task","col-task-cal")}
                ${qt("%","percent",Tt,vt,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${r}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function ar(){const t=ca.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${Ha?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:ca.map(o=>{const p=oe(o.instanceId,o.uri),n=!$e&&p===Ze?" is-selected":"",r=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${i(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(o.summary||o.uri)}</span>
                  ${r?`<span class="muted small contact-name-secondary">${i(r)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(Us(o.dtstart))}</td>
                <td class="col-note-cal muted small">${i(o.calendarName)}</td>
              </tr>`}).join(""),e=ae,a=xt.map(o=>`<option value="${o.id}" ${e&&e.instanceId===o.id?"selected":""}>${i(o.displayname)}</option>`).join(""),l=e?`<div class="card">
            ${he($e?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${$e?`<label>Calendar
                      <select name="instanceId" required ${xt.length===0?"disabled":""}>
                        <option value="">${xt.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(e.calendarName)}</strong>${e.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(e.summary)}" ${e.readOnly&&!$e?"readonly":""} />
              </label>
              ${Zt({field:"dtstart",name:"dtstart",label:"Date",value:fa(e.dtstart),dateOnly:!1,disabled:!!(e.readOnly&&!$e),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${e.readOnly&&!$e?"readonly":""}>${i(e.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${$e||e.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${$e?"Create note":"Save note"}</button>`:""}
                ${!$e&&e.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${c?"disabled":""}>Delete</button>`:$e?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${he("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(Ha)}" aria-label="Search notes" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${c||xt.length===0?"disabled":""}>Add note</button>
        </div>
        ${xt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${qt("Title","summary",ua,Qt,"note","col-note-title")}
                ${qt("Date","dtstart",ua,Qt,"note","col-note-date")}
                ${qt("Calendar","calendar",ua,Qt,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${t}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function sr(){const t=s.querySelector(".contacts-table-wrap"),e=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(e==null?void 0:e.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function nr(t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const e=s.querySelector(".contacts-table-wrap");e&&(e.scrollTop=t.tableTop)}if(t.abListTop!==null){const e=s.querySelector(".contacts-ab-list");e&&(e.scrollTop=t.abListTop)}if(t.calListTop!==null){const e=s.querySelector(".calendars-owned-list");e&&(e.scrollTop=t.calListTop)}})})}function m(){const t=sr();d?On():Hs(),rr(),nr(t),requestAnimationFrame(()=>{var e;En(),(e=s.querySelector(".dt-time.is-selected"))==null||e.scrollIntoView({block:"center"})})}function Js(t){const e=t.querySelector('input[name="color_picker"]'),a=t.querySelector('input[name="color"]');!e||!a||(e.addEventListener("input",()=>{a.value=e.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(e.value=l.slice(0,7),a.value=l.toUpperCase())}))}function rr(){s.querySelectorAll("[data-action]").forEach(A=>{A.addEventListener("click",se=>{const J=se.target.closest("[data-action]");((J==null?void 0:J.dataset.action)==="info"||(J==null?void 0:J.dataset.action)==="info-close")&&(se.preventDefault(),se.stopPropagation()),$r(se)})}),Aa(),Ie&&dn(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(A=>{A.addEventListener("keydown",se=>{(se.key==="Enter"||se.key===" ")&&(se.preventDefault(),A.click())})});const t=s.querySelector("#delete-cal-confirm"),e=s.querySelector("#delete-cal-submit");t==null||t.addEventListener("change",()=>{e&&(e.disabled=!t.checked||c)});const a=s.querySelector("#delete-ab-confirm"),l=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||c)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(A=>{A.addEventListener("error",()=>{const se=A.dataset.avatarFallback||"?",J=document.createElement("span");J.className="contact-avatar contact-avatar-fallback",J.setAttribute("aria-hidden","true"),J.textContent=se,A.replaceWith(J)})}),Es||(document.addEventListener("keydown",A=>{if(A.key==="Escape"){if(j&&(j.phase==="done"||j.phase==="error")){Vs();return}if(!j){if(Ie){Ie=!1,Aa(),m();return}if(we!==null||pe!==null||ne!==null||ct){we=null,pe=null,ne=null,ct=!1,m();return}Ys()}}}),Es=!0);const o=s.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",A=>{A.preventDefault(),ur(o)});const p=s.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",A=>{A.preventDefault(),mr(p)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",A=>{A.preventDefault(),fr(n)});const r=s.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",A=>{A.preventDefault(),pr(r)}),ct&&requestAnimationFrame(()=>{var A;(A=r==null?void 0:r.querySelector('input[name="name"]'))==null||A.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(A=>{A.addEventListener("change",()=>{br(A)})}),s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(A=>{A.indeterminate=!0});const u=s.querySelector('[data-form="share"]');u==null||u.addEventListener("submit",A=>{A.preventDefault(),gr(u)});const f=s.querySelector('[data-form="edit-cal"]');f&&(Js(f),f.addEventListener("submit",A=>{A.preventDefault(),yr(f)}));const y=s.querySelector('[data-form="edit-event"]');y==null||y.addEventListener("submit",A=>{A.preventDefault(),hr(y)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(A=>{A.addEventListener("change",()=>{if(!$)return;const se=s.querySelector('[data-form="edit-event"]');if(!se)return;const J=new FormData(se),pt=se.querySelector('input[name="allDay"]'),Ue=_a(J);Ue.endMode==="until"&&!Ue.until&&(Ue.until=Xt(String(J.get("start")??$.start??""))||fe(new Date)),$={...$,summary:String(J.get("summary")??$.summary),description:String(J.get("description")??$.description),location:String(J.get("location")??$.location),instanceId:Number(J.get("instanceId"))||$.instanceId,allDay:(pt==null?void 0:pt.checked)??$.allDay,start:String(J.get("start")??$.start??""),end:String(J.get("end")??$.end??"")||null,repeat:Ue,hasRrule:!!String(J.get("repeatFreq")??"").trim()},Ue.freq&&Ue.endMode==="until"&&(U==null?void 0:U.field)==="end"&&(U=null),m(),Ue.endMode==="until"&&requestAnimationFrame(()=>{var Ga;const ft=s.querySelector('input[name="repeatUntil"]');ft==null||ft.focus();try{(Ga=ft==null?void 0:ft.showPicker)==null||Ga.call(ft)}catch{}})})});const v=s.querySelector('[data-form="create-cal"]');v&&(Js(v),v.addEventListener("submit",A=>{A.preventDefault(),vr(v)}));const w=s.querySelector('[data-form="create-ab"]');w==null||w.addEventListener("submit",A=>{A.preventDefault(),Ar(w)});const x=s.querySelector('[data-form="edit-ab"]');x==null||x.addEventListener("submit",A=>{A.preventDefault(),Cr(x)});const S=s.querySelector('[data-form="contact"]');S==null||S.addEventListener("submit",A=>{A.preventDefault(),Dr(S)});const q=s.querySelector('[data-form="task"]');if(q==null||q.addEventListener("submit",A=>{A.preventDefault(),or(q)}),q){const A=q.querySelector('select[name="instanceId"]');A==null||A.addEventListener("change",()=>{if(!G||!z)return;const se=Number(A.value);if(!Number.isFinite(se)||se<=0)return;const J=new FormData(q),pt=String(J.get("due")??"").trim();z={...z,instanceId:se,parentUid:z.parentUid&&Ee.some(Ue=>Ue.uid===z.parentUid&&Ue.instanceId===se)?z.parentUid:null,summary:String(J.get("summary")??""),description:String(J.get("description")??""),status:String(J.get("status")??"NEEDS-ACTION"),due:pt?new Date(pt).toISOString():null,priority:Number(J.get("priority")??0),percent:Number(J.get("percent")??0)},m()})}const ee=s.querySelector('[data-form="note"]');ee==null||ee.addEventListener("submit",A=>{A.preventDefault(),ir(ee)});const I=s.querySelector('input[data-action="contact-search"]');I==null||I.addEventListener("input",()=>{Ye&&clearTimeout(Ye),Ye=setTimeout(()=>{Yt=I.value,F!==null&&(async()=>{try{await It(F),m()}catch(A){b("error",A instanceof Error?A.message:"Search failed"),m()}})()},250)});const Y=s.querySelector('input[data-action="task-search"]');Y==null||Y.addEventListener("input",()=>{Ye&&clearTimeout(Ye),Ye=setTimeout(()=>{za=Y.value,(async()=>{try{await Lt(),m()}catch(A){b("error",A instanceof Error?A.message:"Search failed"),m()}})()},250)});const H=s.querySelector('input[data-action="admin-users-search"]');H==null||H.addEventListener("input",()=>{Ye&&clearTimeout(Ye),Ye=setTimeout(()=>{lt=H.value,m()},150)});const Q=s.querySelector('[data-form="admin-user-create"]');Q==null||Q.addEventListener("submit",A=>{A.preventDefault(),cn(Q)});const ie=s.querySelector('[data-form="admin-user-edit"]');ie==null||ie.addEventListener("submit",A=>{A.preventDefault(),bn(ie)});const Ae=s.querySelector('[data-form="admin-cal"]');Ae==null||Ae.addEventListener("submit",A=>{A.preventDefault(),un(Ae)});const xe=s.querySelector('[data-form="admin-ab"]');xe==null||xe.addEventListener("submit",A=>{A.preventDefault(),mn(xe)});const mt=s.querySelector('[data-form="admin-settings"]');mt==null||mt.addEventListener("submit",A=>{A.preventDefault(),fn(mt)});const at=s.querySelector('[data-form="admin-database"]');at==null||at.addEventListener("submit",A=>{A.preventDefault(),pn(at)});const $t=s.querySelector('select[data-action="admin-db-backend"]');$t==null||$t.addEventListener("change",()=>{zt=$t.value==="pgsql"?"pgsql":"sqlite",m()});const Ve=s.querySelector('input[data-action="admin-db-confirm-input"]');Ve==null||Ve.addEventListener("input",()=>{it=Ve.value;const A=s.querySelector('[data-action="admin-db-confirm-save"]');A&&(A.disabled=c||it.trim()!=="CONFIRM")});const Pt=s.querySelector('input[data-action="note-search"]');Pt==null||Pt.addEventListener("input",()=>{Ye&&clearTimeout(Ye),Ye=setTimeout(()=>{Ha=Pt.value,(async()=>{try{await pa(),m()}catch(A){b("error",A instanceof Error?A.message:"Search failed"),m()}})()},250)}),wr(),cr(),dr()}async function lr(t){var o,p;const e=Ws();if(e.length===0){b("error","No writable tasks selected"),m();return}const a=e.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(t==="bulk-task-delete"){if(!confirm(`Delete ${e.length} task${e.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;c=!0,C(),m();try{const n=await E.bulkTasks({op:"delete",items:a});ge=[],qe&&e.some(r=>oe(r.instanceId,r.uri)===qe)&&(qe=null,z=null,G=!1),await Lt(),n.failed>0?b("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk delete failed")}finally{c=!1,m()}return}let l={};if(t==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),r=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!r){b("error","Choose a status to apply"),m();return}l={status:r}}else if(t==="bulk-task-due"){const n=Ma.trim();if(!n){b("error","Choose a due date to apply"),m();return}const r=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(r.getTime())){b("error","Invalid due date"),m();return}l={due:r.toISOString()}}else if(t==="bulk-task-clear-due")l={due:null};else if(t==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),r=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(r===""){b("error","Enter a percent complete (0–100)"),m();return}const u=Number(r);if(!Number.isFinite(u)||u<0||u>100){b("error","Percent must be between 0 and 100"),m();return}l={percent:Math.round(u)}}c=!0,C(),m();try{const n=await E.bulkTasks({op:"update",items:a,fields:l});if(await Lt(),z&&!G){const u=oe(z.instanceId,z.uri),f=Ee.find(y=>oe(y.instanceId,y.uri)===u);f&&(z={...f})}const r=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";n.failed>0?b("error",`Updated ${r} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Updated ${r} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk update failed")}finally{c=!1,m()}}async function or(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("status")??"NEEDS-ACTION"),p=String(e.get("due")??"").trim(),n=p?new Date(p).toISOString():null,r=Number(e.get("priority")??0),u=Number(e.get("percent")??0),f=String(e.get("parentUid")??"").trim(),y=f===""?null:f;c=!0,C(),m();try{if(G){const v=Number(e.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const w=await E.createTask({instanceId:v,summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});G=!1,qe=oe(w.task.instanceId,w.task.uri),z=w.task,b("success",y?"Subtask created":"Task created")}else if(z){const v=await E.updateTask(z.instanceId,z.uri,{summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});z=v.task,qe=oe(v.task.instanceId,v.task.uri),b("success","Task saved")}await Lt()}catch(v){b("error",v instanceof Error?v.message:"Save failed")}finally{c=!1,m()}}async function ir(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;c=!0,C(),m();try{if($e){const n=Number(e.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const r=await E.createNote({instanceId:n,summary:a,description:l,dtstart:p});$e=!1,Ze=oe(r.note.instanceId,r.note.uri),ae=r.note,b("success","Note created")}else if(ae){const n=await E.updateNote(ae.instanceId,ae.uri,{summary:a,description:l,dtstart:p});ae=n.note,Ze=oe(n.note.instanceId,n.note.uri),b("success","Note saved")}await pa()}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{c=!1,m()}}function dr(){const t=s.querySelector('input[data-action="contact-photo"]');t&&t.addEventListener("change",()=>{(async()=>{var a;const e=(a=t.files)==null?void 0:a[0];if(t.value="",!!e){if(e.size>2.5*1024*1024){b("error","Photo is too large (max ~2 MB)"),m();return}try{const l=await Ln(e);je=l,Ce=`data:${e.type||"image/jpeg"};base64,${l}`,Je=!1,m()}catch(l){b("error",l instanceof Error?l.message:"Failed to read photo"),m()}}})()})}function cr(){const t=s.querySelector('[data-form="create-cal"]');if(!t)return;const e=t.querySelector('input[name="holidays"]'),a=t.querySelector("#holidays-country-wrap"),l=t.querySelector('input[name="displayname"]'),o=t.querySelector('input[name="readOnly"]');if(!e||!a)return;const p=()=>{const n=e.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};e.addEventListener("change",p),p()}async function ur(t){var o,p,n,r;const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("password")??"");c=!0,C(),m(),N.event("login.attempt",{username:a});try{const u=await E.login(a,l);if(d=u.user,ds(u.ui),N.event("login.ok",{username:(d==null?void 0:d.username)??a}),us(),ve())try{await ps()}catch(f){N.warn("admin.capabilities login",f instanceof Error?f.message:f)}if(xs(),st(h,k),await Ke(),h==="admin"&&ve()&&Et())try{k==="overview"&&((o=Re("overview"))==null?void 0:o.available)!==!1?await Va():k==="users"&&((p=Re("users"))==null?void 0:p.available)!==!1?(await Kt(),B&&(await ht(B),await Gt(B))):k==="settings"&&((n=Re("settings"))==null?void 0:n.available)!==!1?await Ba():k==="database"&&((r=Re("database"))==null?void 0:r.available)!==!1&&await ja()}catch(f){N.warn("admin login load",f instanceof Error?f.message:f)}b("success","Signed in")}catch(u){N.warn("login.failed",u instanceof Error?u.message:u),b("error",u instanceof Error?u.message:"Login failed")}finally{c=!1,m()}}async function mr(t){const e=new FormData(t),a=String(e.get("path")??""),l=String(e.get("newName")??"").trim();if(!a||!l){b("error","Name is required"),m();return}c=!0,C(),m();try{await E.filesRename(a,l),N.event("files.rename",{path:a,newName:l}),we=null,await yt(),b("success",`Renamed to “${l}”`)}catch(o){b("error",o instanceof Error?o.message:"Rename failed")}finally{c=!1,m()}}async function pr(t){const e=new FormData(t),a=String(e.get("name")??"").trim();if(!a){b("error","Folder name is required"),m();return}c=!0,C(),m();try{await E.filesMkdir(Oe,a),N.event("files.mkdir",{path:Oe,name:a}),ct=!1,await yt(),b("success",`Created folder “${a}”`)}catch(l){b("error",l instanceof Error?l.message:"Could not create folder")}finally{c=!1,m()}}async function fr(t){if(!ne||ne.paths.length===0)return;const e=new FormData(t),a=String(e.get("toPath")??"").trim().replace(/^\/+|\/+$/g,""),l=String(e.get("newName")??"").trim(),o=ne.op,p=[...ne.paths],n=p.length>1;c=!0,C(),m();let r=0;const u=[];try{for(const y of p)try{if(o==="copy"){const v=Ja(y),w=n||!l||l===v?void 0:l,x=await E.filesCopy(y,{to:a,newName:w});N.event("files.copy",{path:y,to:x.entry.path})}else{const v=Ja(y),w=n||!l||l===v?void 0:l;await E.filesMove(y,a,w),N.event("files.move",{path:y,to:a})}r+=1}catch(v){u.push(`${Ja(y)}: ${v instanceof Error?v.message:"failed"}`)}ne=null,le=[],await yt();const f=o==="copy"?"Copied":"Moved";r>0&&u.length===0?b("success",r===1?`${f} 1 item`:`${f} ${r} items`):r>0?b("info",`${f} ${r}; ${u.length} failed. ${u[0]}`):b("error",u[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){b("error",f instanceof Error?f.message:"Operation failed")}finally{c=!1,m()}}async function br(t){const e=t.files;if(!e||e.length===0)return;const a=Array.from(e);t.value="",c=!0,C(),m();let l=0;const o=[];try{for(const p of a)try{await E.filesUpload(Oe,p,{replace:!0}),N.event("files.upload",{path:Oe,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await yt(),l>0&&o.length===0?b("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?b("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):b("error",o[0]||"Upload failed")}catch(p){b("error",p instanceof Error?p.message:"Upload failed")}finally{c=!1,m()}}async function gr(t){if(M===null)return;const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("access")??"read");ue=!0,c=!0,C(),m();try{await E.share(M,a,l),await Ca(M),b("success",`Shared with ${a}`)}catch(o){b("error",o instanceof Error?o.message:"Share failed")}finally{c=!1,m()}}function Ta(t){if(!$)return;const e=new FormData(t),a=t.querySelector('input[name="allDay"]');$={...$,summary:String(e.get("summary")??$.summary),description:String(e.get("description")??$.description),location:String(e.get("location")??$.location),instanceId:Number(e.get("instanceId"))||$.instanceId,allDay:(a==null?void 0:a.checked)??$.allDay,start:String(e.get("start")??$.start??""),end:String(e.get("end")??$.end??"")||null,repeat:_a(e),hasRrule:!!String(e.get("repeatFreq")??"").trim()}}function _a(t){const e=String(t.get("repeatFreq")??"").trim().toUpperCase();if(!e)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(t.get("repeatInterval")??1)||1)),l=String(t.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const u=String(t.get("repeatUntil")??"").trim();p=u?u.slice(0,10):null}else if(o==="count"){const u=Number(t.get("repeatCount")??0);n=Number.isFinite(u)&&u>0?Math.min(999,Math.round(u)):10}const r=t.getAll("repeatByDay").map(u=>String(u).toUpperCase()).filter(Boolean);return{freq:e,interval:a,until:p,count:n,byDay:r,endMode:o}}async function hr(t){if(!$||!$.canWrite)return;const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("location")??"").trim(),p=e.get("allDay")==="on",n=String(e.get("start")??"").trim(),r=String(e.get("end")??"").trim(),u=Number(e.get("instanceId"))||$.instanceId,f=_a(e);if(!a){b("error","Title is required"),m();return}if(!n){b("error","Start is required"),m();return}let y,v;if(p)y=n.slice(0,10),v=r?r.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const q=gs(n,r||null);y=new Date(q.start).toISOString(),v=q.end?new Date(q.end).toISOString():null}else y=new Date(n).toISOString(),v=r?new Date(r).toISOString():null;const w=$.instanceId,x=$.uri,S=Xe;c=!0,C(),dt=!0,m(),N.event(S?"event.create":"event.update",{instanceId:u,uri:S?null:x,allDay:p,summary:a});try{const q={summary:a,description:l,location:o,allDay:p,start:y,end:v,instanceId:u,repeat:f},ee=S?await E.createEvent(u,q):await E.updateEvent(w,x,q);(M===null||ee.event.instanceId!==M)&&(M=ee.event.instanceId),await et(),dt=!1,$=null,Xe=!1,U=null,N.event(S?"event.created":"event.saved",{uri:ee.event.uri,instanceId:ee.event.instanceId}),b("success",S?"Event created":"Event saved")}catch(q){N.warn("event.save failed",q instanceof Error?q.message:q),b("error",q instanceof Error?q.message:"Save failed")}finally{c=!1,m()}}async function yr(t){if(M===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim();c=!0,C(),m();try{const p=await E.updateCalendar(M,{displayname:a,description:l,color:o});ue=!0,await Ke(),M=p.calendar.id,await Ca(M),await et(),b("success","Calendar updated")}catch(p){b("error",p instanceof Error?p.message:"Update failed")}finally{c=!1,m()}}async function vr(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim(),p=e.get("holidays")==="on",n=String(e.get("holidayCountry")??"").trim(),r=e.get("readOnly")==="on";if(Me=!0,p&&!n){b("error","Select a country for the holidays calendar"),m();return}if(!p&&!a){b("error","Display name is required"),m();return}c=!0,C(),m();try{const u=await E.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:r});M=u.calendar.id,Me=!1,await Ke();let f=`Created “${u.calendar.displayname}”`;const y=u.holidayImport??u.calendar.holidayImport;y&&(f+=`. Holidays imported: ${ws(y)}.`),r&&(f+=" Calendar is read-only."),b("success",f)}catch(u){Me=!0,b("error",u instanceof Error?u.message:"Create failed")}finally{c=!1,m()}}async function $r(t){var l,o,p;const e=t.target.closest("[data-action]");if(!e)return;const a=e.dataset.action;if(a&&N.debug(`action:${a}`,{id:e.dataset.id,tab:e.dataset.tab,uri:e.dataset.uri}),a==="close-import-progress"){j&&(j.phase==="done"||j.phase==="error")&&Vs();return}if(a==="logout"){c=!0,N.event("logout");try{await E.logout()}catch{}ms(),C(),m();return}if(a==="select-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;M=n,c=!0,C(),m();try{await et()}catch(r){b("error",r instanceof Error?r.message:"Failed to load calendar")}finally{c=!1,m()}return}if(a==="edit-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!Se.find(u=>u.id===n&&u.canShare))return;M=n,ue=!0,Fe=null,c=!0,C(),m();try{await Ca(n),await et()}catch(u){b("error",u instanceof Error?u.message:"Failed to open calendar")}finally{c=!1,m()}return}if(a==="close-cal-modal"){ue=!1,m();return}if(a==="open-create-cal-modal"){Me=!0,ue=!1,Fe=null,C(),m();return}if(a==="close-create-cal-modal"){Me=!1,C(),m();return}if(a==="delete-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!Se.find(u=>u.id===n&&u.canShare))return;Fe=n,ue=!1,C(),m();return}if(a==="cancel-delete-cal"){Fe=null,m();return}if(a==="confirm-delete-cal"){const n=Number(e.dataset.id),r=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;c=!0,C(),m();try{if(await E.deleteCalendar(n),M===n&&(M=null),Fe=null,ue=!1,Wt=[],Jt=[],await Ke(),M===null){const u=Ls();u&&(M=u.id,await et())}b("success","Calendar deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,m()}return}if(a==="month-today"){const n=new Date;Ct={y:n.getFullYear(),m:n.getMonth()},wa=null,c=!0,m();try{await et()}finally{c=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,r=new Date(Ct.y,Ct.m+n,1);Ct={y:r.getFullYear(),m:r.getMonth()},wa=null,c=!0,m();try{await et()}finally{c=!1,m()}return}if(a==="open-event"){t.stopPropagation();const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;c=!0,C(),m();try{const u=await E.getEvent(n,r);$={...u.event,repeat:u.event.repeat??Wa()},Xe=!1,dt=!0,U=null,ue=!1,Fe=null}catch(u){b("error",u instanceof Error?u.message:"Failed to open event")}finally{c=!1,m()}return}if(a==="open-event-day"){t.stopPropagation();const n=e.dataset.day??"";wa=wa===n?null:n,m();return}if(a==="new-event-day"){const n=t.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const r=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;if(M===null){b("error","Select a calendar first"),m();return}const u=Se.find(f=>f.id===M);if(!u||u.readOnly||!(u.canShare||u.access==="readwrite")){b("error","This calendar is read-only"),m();return}Xe=!0,$=Tn(r,M),dt=!0,U=null,ue=!1,Fe=null,C(),m();return}if(a==="close-event-modal"){dt=!1,$=null,Xe=!1,U=null,C(),m();return}if(a==="dt-open"){const n=e.dataset.dtField||"";if(!n)return;const r=s.querySelector('[data-form="edit-event"]');if(r&&$&&Ta(r),(U==null?void 0:U.field)===n)U=null;else{const u=e.dataset.dtDateOnly==="1",f=e.dataset.dtClear!=="0",y=e.dataset.dtName||n;let v=vs(n);!v&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(v=Na().start);const w=Ea(v||fe(new Date)),[x,S]=w.date.split("-").map(Number);U={field:n,viewY:x,viewM:(S||1)-1,dateOnly:u,allowClear:f,name:y}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!U)return;const n=a==="dt-month-prev"?-1:1,r=new Date(U.viewY,U.viewM+n,1);U={...U,viewY:r.getFullYear(),viewM:r.getMonth()},m();return}if(a==="dt-pick-day"){if(!U)return;const n=U.field,r=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&$&&Ta(u);const f=U.dateOnly;if(f)tt(n,r),U=null;else{const y=vs(n),v=Ea(y||Na(r).start).hm;tt(n,`${r}T${v}`),U={...U,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(n==="start"&&$&&!f&&$.end){const y=new Date(String($.start)),v=new Date(String($.end));!Number.isNaN(y.getTime())&&!Number.isNaN(v.getTime())&&v<=y&&tt("end",_t(new Date(y.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!U||U.dateOnly)return;const n=U.field,r=e.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&$&&Ta(u);const f=vs(n)||Na().start,v=`${Ea(f).date}T${r}`;if(tt(n,v),n==="start"&&$){$={...$,allDay:!1};const w=$.end?Ea(String($.end)):null,x=new Date(v);(!w||new Date(`${w.date}T${w.hm}`)<=x)&&tt("end",_t(new Date(x.getTime()+3600*1e3)))}U=null,m();return}if(a==="dt-today"){if(!U)return;const n=U.field,r=s.querySelector('[data-form="edit-event"]');r&&$&&Ta(r);const u=fe(new Date);if(U.dateOnly)tt(n,u);else{const f=Na(u);n==="start"?(tt("start",f.start),$&&!$.end&&tt("end",f.end)):n==="end"?tt("end",f.end):tt(n,f.start)}U=null,m();return}if(a==="dt-clear"){if(!U||!U.allowClear)return;const n=U.field,r=s.querySelector('[data-form="edit-event"]');r&&$&&Ta(r),tt(n,null),U=null,m();return}if(a==="event-allday-toggle"){if(!$)return;const n=s.querySelector('[data-form="edit-event"]'),r=e.checked;if(n){const u=new FormData(n),f=String(u.get("start")??$.start??""),y=String(u.get("end")??$.end??"")||null;let v=f,w=y;if(r){const x=vn(f,y);v=x.start,w=x.end}else{const x=f.slice(0,10),S=(y||f).slice(0,10),q=gs(x,S);v=q.start,w=q.end}$={...$,summary:String(u.get("summary")??$.summary),description:String(u.get("description")??$.description),location:String(u.get("location")??$.location),instanceId:Number(u.get("instanceId"))||$.instanceId,allDay:r,start:v,end:w,repeat:_a(u)}}else $={...$,allDay:r};U=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!$)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const r=new FormData(n),u=n.querySelector('input[name="allDay"]'),f=_a(r);$={...$,summary:String(r.get("summary")??$.summary),description:String(r.get("description")??$.description),location:String(r.get("location")??$.location),instanceId:Number(r.get("instanceId"))||$.instanceId,allDay:(u==null?void 0:u.checked)??$.allDay,start:String(r.get("start")??$.start??""),end:String(r.get("end")??$.end??"")||null,repeat:f,hasRrule:!!String(r.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(U==null?void 0:U.field)==="end"&&(U=null),m();return}if(a==="delete-event"){if(!$||!$.canWrite||Xe||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=$.instanceId,r=$.uri;c=!0,C(),m();try{await E.deleteEvent(n,r),dt=!1,$=null,await et(),b("success","Event deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,m()}return}if(a==="info"){const n=e.dataset.info??"";Er(n);return}if(a==="info-close"){Ys();return}if(a==="flash-close"){C(),m();return}if(a==="user-menu-toggle"){t.stopPropagation(),Ie=!Ie,m();return}if(a==="user-menu-close"){Ie&&(Ie=!1,m());return}if(a==="tab"){const n=Ds(e.dataset.tab);n&&(n==="admin"&&(k="overview"),await _s(n));return}if(a==="admin-page"){const n=ns(e.dataset.adminPage);n&&await Ts(n);return}if(a==="admin-refresh"){if(!ve()||h!=="admin")return;c=!0,C(),m();try{await Va(),b("success","Overview refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,m()}return}if(a==="admin-users-refresh"){if(!ve()||h!=="admin")return;c=!0,C(),m();try{await Kt(),B&&await ht(B),b("success","Users refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,m()}return}if(a==="admin-user-view"){const n=e.dataset.username??"";if(!n||!ve())return;c=!0,C(),B=n,k="users",st("admin","users",n),m();try{await ht(n),await Gt(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{c=!1,m()}return}if(a==="admin-user-close"){B=null,V=null,Te=null,_e=!1,st("admin","users",null),m();return}if(a==="admin-user-create-open"){if(!ve())return;Be=!0,_e=!1,ot=null,C(),m();return}if(a==="admin-user-create-close"){Be=!1,m();return}if(a==="admin-user-edit-open"){if(!ve())return;const n=e.dataset.username??B??"";if(!n)return;c=!0,C(),Be=!1,ot=null,B=n,k="users",st("admin","users",n),m();try{(!V||V.username.toLowerCase()!==n.toLowerCase())&&await ht(n),_e=!0}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{c=!1,m()}return}if(a==="admin-user-edit-close"){_e=!1,m();return}if(a==="admin-user-delete-open"){if(!ve())return;const n=e.dataset.username??B??"";if(!n)return;ot=n,kt=!1,Be=!1,_e=!1,C(),m();return}if(a==="admin-user-delete-close"){ot=null,kt=!1,m();return}if(a==="admin-user-delete-toggle"){kt=!!e.checked,m();return}if(a==="admin-user-delete-confirm"){if(!ve())return;const n=e.dataset.username??ot??"";if(!n||!kt)return;c=!0,C(),m();try{await E.adminDeleteUser(n,!0),N.event("admin.user.delete",{username:n}),ot=null,kt=!1,_e=!1,(B==null?void 0:B.toLowerCase())===n.toLowerCase()&&(B=null,V=null,St=[],Dt=[],st("admin","users",null)),await Kt(),b("success",`Deleted user “${n}”`)}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{c=!1,m()}return}if(a==="admin-cal-create"){ze="create",Rt=null,m();return}if(a==="admin-cal-edit"){ze="edit",Rt=Number(e.dataset.id),m();return}if(a==="admin-cal-close"){ze=null,Rt=null,m();return}if(a==="admin-cal-delete"){ye={kind:"calendar",id:Number(e.dataset.id),label:e.dataset.label??"calendar"},m();return}if(a==="admin-ab-create"){Qe="create",Vt=null,m();return}if(a==="admin-ab-edit"){Qe="edit",Vt=Number(e.dataset.id),m();return}if(a==="admin-ab-close"){Qe=null,Vt=null,m();return}if(a==="admin-ab-delete"){ye={kind:"addressbook",id:Number(e.dataset.id),label:e.dataset.label??"address book",force:!1},m();return}if(a==="admin-ab-force-toggle"){(ye==null?void 0:ye.kind)==="addressbook"&&(ye={...ye,force:!!e.checked},m());return}if(a==="admin-resource-delete-close"){ye=null,m();return}if(a==="admin-resource-delete-confirm"){if(!B||!ye)return;const n=B,r=ye;c=!0,C(),m();try{r.kind==="calendar"?await E.adminDeleteUserCalendar(n,r.id,!0):await E.adminDeleteUserAddressBook(n,r.id,!0,!!r.force),ye=null,await Gt(n),await ht(n),b("success","Deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{c=!1,m()}return}if(a==="admin-settings-refresh"){c=!0,C(),m();try{await Ba(),b("success","Settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{c=!1,m()}return}if(a==="admin-reset-open"){na=!0,At=!1,C(),m();return}if(a==="admin-reset-close"){na=!1,At=!1,m();return}if(a==="admin-reset-toggle"){At=!!e.checked,m();return}if(a==="admin-reset-confirm"){if(!At)return;c=!0,C(),m();try{const n=await E.adminResetToDefault(!0);N.event("admin.settings.reset-to-default"),na=!1,At=!1;const r=n.redirectUrl&&n.redirectUrl.startsWith("/")?n.redirectUrl:"/portal/install/";window.location.assign(r);return}catch(n){b("error",n instanceof Error?n.message:"Reset failed"),c=!1,m()}return}if(a==="admin-database-refresh"){c=!0,C(),m();try{await ja(),b("success","Database settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{c=!1,m()}return}if(a==="admin-db-backend"){zt=e.value==="pgsql"?"pgsql":"sqlite",m();return}if(a==="admin-db-confirm-close"){ra=!1,it="",la=null,m();return}if(a==="admin-db-confirm-input"){it=e.value,m();const r=s.querySelector('[data-action="admin-db-confirm-input"]');if(r){r.focus();const u=r.value.length;r.setSelectionRange(u,u)}return}if(a==="admin-db-confirm-save"){if(it.trim()!=="CONFIRM"||!la)return;c=!0,C(),m();try{const n={...la,confirm:"CONFIRM"},r=await E.adminUpdateDatabaseSettings(n);jt=r.data,ra=!1,it="",la=null,zt=(r.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:r.data.backend}),b("success","Database settings saved")}catch(n){b("error",n instanceof Error?n.message:"Database save failed")}finally{c=!1,m()}return}if(a==="files-nav"){Oe=e.dataset.path??"",we=null,pe=null,ne=null,ct=!1,le=[],c=!0,C(),m();try{await yt()}catch(r){b("error",r instanceof Error?r.message:"Failed to open folder")}finally{c=!1,m()}return}if(a==="files-toggle"){t.stopPropagation();const n=e.dataset.path??"";if(!n)return;e.checked?le.includes(n)||(le=[...le,n]):le=le.filter(u=>u!==n),m();return}if(a==="files-select-all"){t.stopPropagation(),le=e.checked?Ne.map(r=>r.path):[],m();return}if(a==="files-copy"){const n=e.dataset.path??"";if(!n)return;ne={op:"copy",paths:[n]},we=null,pe=null,m();return}if(a==="files-move"){const n=e.dataset.path??"";if(!n)return;ne={op:"move",paths:[n]},we=null,pe=null,m();return}if(a==="files-bulk-copy"){if(le.length===0)return;ne={op:"copy",paths:[...le]},we=null,pe=null,m();return}if(a==="files-bulk-move"){if(le.length===0)return;ne={op:"move",paths:[...le]},we=null,pe=null,m();return}if(a==="files-transfer-close"){ne=null,m();return}if(a==="files-bulk-delete"){if(le.length===0)return;pe=[...le],we=null,ne=null,m();return}if(a==="files-refresh"){c=!0,C(),m();try{await yt(),b("success","Refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{c=!1,m()}return}if(a==="files-mkdir"){ct=!0,we=null,pe=null,ne=null,C(),m();return}if(a==="files-mkdir-close"){ct=!1,m();return}if(a==="files-rename-open"){we=e.dataset.path??null,pe=null,ne=null,m();return}if(a==="files-rename-close"){we=null,m();return}if(a==="files-delete-open"){const n=e.dataset.path??"";pe=n?[n]:null,we=null,ne=null,m();return}if(a==="files-delete-close"){pe=null,m();return}if(a==="files-delete-confirm"){const n=pe?[...pe]:[];if(n.length===0)return;c=!0,C(),m();try{if(n.length===1)await E.filesDelete(n[0]),N.event("files.delete",{path:n[0]}),b("success","Deleted");else{const r=await E.filesBulk("delete",n);N.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?b("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?b("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):b("error",r.errors[0]||"Delete failed")}pe=null,le=[],await yt()}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{c=!1,m()}return}if(a==="files-download"){N.event("files.download",{path:e.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=e.dataset.sort||"";if(!n)return;if(a==="sort-task"){Tt===n?vt=vt==="asc"?"desc":"asc":(Tt=n,vt=n==="due"||n==="summary"?"asc":"desc"),c=!0,m();try{await Lt()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{c=!1,m()}}else{ua===n?Qt=Qt==="asc"?"desc":"asc":(ua=n,Qt="asc"),c=!0,m();try{await pa()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{c=!1,m()}}return}if(a==="select-task"){if(t.target.closest("[data-stop-row], .task-check"))return;const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=Ee.find(f=>f.instanceId===n&&f.uri===r)??null;G=!1,qe=oe(n,r),z=u?{...u}:null,C(),m();return}if(a==="task-check"){t.preventDefault(),t.stopPropagation();const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=oe(n,r),f=Ee.find(y=>oe(y.instanceId,y.uri)===u);if(!f||!f.canWrite||f.readOnly)return;ge.includes(u)?ge=ge.filter(y=>y!==u):ge=[...ge,u],m();return}if(a==="task-select-all"){t.preventDefault();const n=Ee.filter(u=>u.canWrite&&!u.readOnly);n.length>0&&n.every(u=>ge.includes(oe(u.instanceId,u.uri)))?ge=[]:ge=n.map(u=>oe(u.instanceId,u.uri)),m();return}if(a==="bulk-task-clear"){ge=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){lr(a);return}if(a==="select-note"){const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=ca.find(f=>f.instanceId===n&&f.uri===r)??null;$e=!1,Ze=oe(n,r),ae=u?{...u}:null,C(),m();return}if(a==="new-task"){G=!0,qe=null,z={uri:"",instanceId:((o=Nt[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},C(),m();return}if(a==="new-subtask"){if(!z||G||!z.uid||!z.canWrite)return;const n=z;G=!0,qe=null,z={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},C(),m();return}if(a==="new-note"){$e=!0,Ze=null,ae={uri:"",instanceId:((p=xt[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},C(),m();return}if(a==="cancel-task"){G=!1,z=null,qe=null,m();return}if(a==="cancel-note"){$e=!1,ae=null,Ze=null,m();return}if(a==="delete-task"){if(!z||G||!confirm("Delete this task? CalDAV clients will sync the removal."))return;c=!0,C(),m();try{await E.deleteTask(z.instanceId,z.uri),qe=null,z=null,await Lt(),b("success","Task deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,m()}return}if(a==="delete-note"){if(!ae||$e||!confirm("Delete this note? CalDAV clients will sync the removal."))return;c=!0,C(),m();try{await E.deleteNote(ae.instanceId,ae.uri),Ze=null,ae=null,await pa(),b("success","Note deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,m()}return}if(a==="select-ab"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;F=n,We=!1,re=null,_=null,me=!1,De=!1,Yt="",gt=[],Ce=null,je=null,Je=!1,C(),c=!0,m();try{await It(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contacts")}finally{c=!1,m()}return}if(a==="edit-ab"){t.stopPropagation();const n=Number(e.dataset.id);if(!Number.isFinite(n)||!Le.find(f=>f.id===n))return;const u=F!==n;F=n,We=!0,De=!1,C(),u&&(re=null,_=null,me=!1,Yt="",gt=[],Ce=null,je=null,Je=!1),c=!0,m();try{u&&await It(n)}catch(f){b("error",f instanceof Error?f.message:"Failed to open address book")}finally{c=!1,m()}return}if(a==="close-ab-modal"){We=!1,m();return}if(a==="select-contact"){const n=e.dataset.uri??"";if(!n)return;C();try{await _n(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(F===null)return;In(),C(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){me=!1,De=!1,_=null,re=null,Ce=null,je=null,Je=!1,U=null,C(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!_)return;Ka(),Array.isArray(_.emails)||(_.emails=[""]),Array.isArray(_.phones)||(_.phones=[{type:"cell",value:""}]),Array.isArray(_.custom)||(_.custom=[]),a==="add-email"?_.emails.length<10&&_.emails.push(""):a==="add-phone"?_.phones.length<10&&_.phones.push({type:"other",value:""}):_.custom.length<30&&_.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!_)return;Ka();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(_.emails)?_.emails:[""];_.emails=r.filter((u,f)=>f!==n),_.emails.length===0&&(_.emails=[""]),m();return}if(a==="remove-phone"){if(!_)return;Ka();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(_.phones)?_.phones:[{type:"cell",value:""}];_.phones=r.filter((u,f)=>f!==n),_.phones.length===0&&(_.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!_)return;Ka();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;_.custom=(Array.isArray(_.custom)?_.custom:[]).filter((r,u)=>u!==n),m();return}if(a==="remove-photo"){Ce=null,je=null,Je=!0,_&&(_.hasPhoto=!1),m();return}if(a==="delete-contact"){if(F===null||!re||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;c=!0,C(),De=!0,m();try{await E.deleteContact(F,re),re=null,_=null,me=!1,De=!1,U=null,Ce=null,await Ke(),b("success","Contact deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{c=!1,m()}return}if(a==="delete-ab"){t.stopPropagation();const n=Number(e.dataset.id??F);if(!Number.isFinite(n)||!Le.find(u=>u.id===n))return;He=n,We=!1,De=!1,C(),m();return}if(a==="cancel-delete-ab"){He=null,m();return}if(a==="confirm-delete-ab"){const n=Number(e.dataset.id),r=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;const u=Le.find(y=>y.id===n);if(!u)return;const f=(u.cardCount??0)>0;c=!0,C(),m();try{await E.deleteAddressBook(n,f),F===n&&(F=null,gt=[],_=null,re=null,me=!1),He=null,We=!1,De=!1,await Ke(),F===null&&Le.length>0&&(F=Le[0].id,await It(F)),b("success","Address book deleted")}catch(y){b("error",y instanceof Error?y.message:"Delete failed")}finally{c=!1,m()}return}if(a==="export-ab"){if(F===null)return;We=!0,c=!0,C(),m();try{const{blob:n,filename:r}=await E.exportAddressBook(F),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{c=!1,m()}return}if(a==="export-contact"){if(F===null||!re||me)return;De=!0,c=!0,C(),m();try{const{blob:n,filename:r}=await E.exportContact(F,re),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{c=!1,m()}return}if(a==="revoke"){const n=e.dataset.href??"";if(!n||M===null||!confirm("Revoke access for this user?"))return;ue=!0,c=!0,C(),m();try{await E.revoke(M,n),await Ca(M),b("success","Share revoked")}catch(r){b("error",r instanceof Error?r.message:"Revoke failed")}finally{c=!1,m()}return}if(a==="export-cal"){if(M===null)return;ue=!0,c=!0,C(),m();try{const{blob:n,filename:r}=await E.exportCalendar(M),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{c=!1,m()}}}function wr(){const t=s.querySelector('input[data-action="import-cal"]');t&&t.addEventListener("change",()=>{Nr(t)});const e=s.querySelector('input[data-action="import-create-cal"]');e&&e.addEventListener("change",()=>{xr(e)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{kr(a)})}async function kr(t){var l;if(F===null)return;const e=(l=t.files)==null?void 0:l[0];if(t.value="",!e)return;const a=F;We=!0,c=!0,C(),ut(),j={kind:"contacts",fileName:e.name,fileSizeLabel:Fs(e.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Rs(),m();try{const o=await zs(e,r=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:r};const u=s.querySelector(".import-progress-bar"),f=s.querySelector("[data-import-status-line]");u&&r!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${r}%`),f&&r!==null&&(f.textContent=`Reading file… ${r}%`)});Ut("uploading",{readPercent:100}),Ut("processing",{processPercent:0}),N.event("import.contacts.start",{file:e.name,bytes:e.size,abId:a});const p=await E.importAddressBook(a,o,r=>{Bs(r)}),n=ws(p);await Ke(),F===a&&await It(a),ut(),Ut("done",{ok:!0,resultMessage:`${n} (from “${e.name}”)`}),b("success",`Import finished for “${e.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";ut(),Ut("error",{ok:!1,resultMessage:p}),b("error",p)}finally{c=!1,m()}}function Ka(){if(!_)return;const t=s.querySelector('[data-form="contact"]');if(!t)return;const e=new FormData(t);_.firstname=String(e.get("firstname")??""),_.lastname=String(e.get("lastname")??""),_.fullname=String(e.get("fullname")??""),_.org=String(e.get("org")??""),_.title=String(e.get("title")??""),_.url=String(e.get("url")??""),_.note=String(e.get("note")??"");const a=String(e.get("birthday")??"").trim();_.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,_.address={street:String(e.get("street")??""),city:String(e.get("city")??""),region:String(e.get("region")??""),postal:String(e.get("postal")??""),country:String(e.get("country")??"")};const l=[];let o=0;for(;e.has(`email_${o}`);)l.push(String(e.get(`email_${o}`)??"")),o++;l.length&&(_.emails=l);const p=[];for(o=0;e.has(`phone_value_${o}`);)p.push({type:String(e.get(`phone_type_${o}`)??"other"),value:String(e.get(`phone_value_${o}`)??"")}),o++;p.length&&(_.phones=p);const n=[];for(o=0;e.has(`custom_label_${o}`)||e.has(`custom_value_${o}`);)n.push({label:String(e.get(`custom_label_${o}`)??""),value:String(e.get(`custom_value_${o}`)??"")}),o++;_.custom=n}function Sr(t){const e=new FormData(t),a=[];let l=0;for(;e.has(`email_${l}`);){const r=String(e.get(`email_${l}`)??"").trim();r&&a.push(r),l++}const o=[];for(l=0;e.has(`phone_value_${l}`);){const r=String(e.get(`phone_value_${l}`)??"").trim();r&&o.push({type:String(e.get(`phone_type_${l}`)??"other"),value:r}),l++}const p=[];for(l=0;e.has(`custom_label_${l}`)||e.has(`custom_value_${l}`);){const r=String(e.get(`custom_label_${l}`)??"").trim(),u=String(e.get(`custom_value_${l}`)??"").trim();(r||u)&&p.push({label:r,value:u}),l++}const n={firstname:String(e.get("firstname")??"").trim(),lastname:String(e.get("lastname")??"").trim(),fullname:String(e.get("fullname")??"").trim(),org:String(e.get("org")??"").trim(),title:String(e.get("title")??"").trim(),emails:a,phones:o,address:{street:String(e.get("street")??"").trim(),city:String(e.get("city")??"").trim(),region:String(e.get("region")??"").trim(),postal:String(e.get("postal")??"").trim(),country:String(e.get("country")??"").trim()},url:String(e.get("url")??"").trim(),note:String(e.get("note")??"").trim(),birthday:(()=>{const r=String(e.get("birthday")??"").trim();return r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null})(),custom:p};return Je?n.removePhoto=!0:je&&(n.photoBase64=je),n}async function Dr(t){if(F===null)return;const e=Sr(t);c=!0,C(),De=!0,m();try{if(me){const a=await E.createContact(F,e);me=!1,re=a.contact.uri,_=null,De=!1,Ce=null,je=null,Je=!1,U=null,b("success","Contact created")}else re&&(re=(await E.updateContact(F,re,e)).contact.uri,_=null,De=!1,Ce=null,je=null,Je=!1,U=null,b("success","Contact saved"));try{await Ke()}catch(a){if(console.error(a),F!==null)try{await It(F)}catch{}}}catch(a){b("error",a instanceof Error?a.message:"Save failed")}finally{c=!1,m()}}async function Ar(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();if(a){c=!0,C(),m();try{const o=await E.createAddressBook({displayname:a,description:l});F=o.addressbook.id,re=null,_=null,me=!1,Yt="",await Ke(),b("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){b("error",o instanceof Error?o.message:"Create failed")}finally{c=!1,m()}}}async function Cr(t){if(F===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();We=!0,c=!0,C(),m();try{await E.updateAddressBook(F,{displayname:a,description:l}),await Ke(),b("success","Address book updated")}catch(o){b("error",o instanceof Error?o.message:"Update failed")}finally{c=!1,m()}}function Er(t){const e=Jr[t];if(!e)return;const a=s.querySelector("#info-modal"),l=s.querySelector("#info-modal-title"),o=s.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=e.title,o.innerHTML=e.paragraphs.map(n=>`<p>${i(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function Ys(){const t=s.querySelector("#info-modal");t&&(t.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Nr(t){var a;if(M===null)return;const e=(a=t.files)==null?void 0:a[0];t.value="",e&&(ue=!0,await Ks(M,e,{keepEditModalOpen:!0}))}async function xr(t){var f;const e=(f=t.files)==null?void 0:f[0];if(t.value="",!e)return;const a=s.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){b("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Me=!0,m();return}if(p){b("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Me=!0,m();return}let n=String(l.get("displayname")??"").trim();n||(n=e.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const r=String(l.get("description")??""),u=String(l.get("color")??"").trim();c=!0,C(),Me=!0,m();try{const y=await E.createCalendar({displayname:n,description:r,color:u,readOnly:!1});M=y.calendar.id,Me=!1,await Ke(),b("success",`Created “${y.calendar.displayname}” — importing…`),await Ks(y.calendar.id,e,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const v=y instanceof Error?y.message:"Create or import failed";Me=!0,b("error",v),c=!1,m()}}async function Ks(t,e,a={}){c=!0,C(),ut(),j={kind:"calendar",fileName:e.name,fileSizeLabel:Fs(e.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Rs(),m();try{const l=await zs(e,n=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:n};const r=s.querySelector(".import-progress-bar"),u=s.querySelector("[data-import-status-line]");r&&n!==null&&(r.classList.remove("is-indeterminate"),r.style.width=`${n}%`),u&&n!==null&&(u.textContent=`Reading file… ${n}%`)});Ut("uploading",{readPercent:100}),Ut("processing",{processPercent:0}),N.event("import.calendar.start",{file:e.name,bytes:e.size,calId:t});const o=await E.importCalendar(t,l,n=>{Bs(n)}),p=ws(o);M===t&&await et(),ut(),Ut("done",{ok:!0,resultMessage:`${p} (from “${e.name}”)`}),b("success",`${a.successPrefix||""}Import finished for “${e.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";ut(),Ut("error",{ok:!1,resultMessage:o}),b("error",o)}finally{a.keepEditModalOpen&&(ue=!0),c=!1,m()}}gn()}let Ft="",P=null,te=!1,nt=null,wt=null,Mt="sqlite",rs=!1;async function ls(s,d={}){const g={Accept:"application/json",...d.headers};d.body&&(g["Content-Type"]="application/json"),Ft&&d.method&&d.method!=="GET"&&(g["X-CSRF-Token"]=Ft);const h=await fetch(`/api/install${s}`,{credentials:"same-origin",...d,headers:g});let k;try{k=await h.json()}catch{throw new Error(`Request failed (${h.status})`)}if(!h.ok)throw new Error(k.error||`Request failed (${h.status})`);return k&&typeof k=="object"&&"data"in k&&k.data!==void 0?k.data:k}async function Cs(){var s;P=await ls("/status"),Ft=P.csrfToken||Ft,((s=P.defaults)==null?void 0:s.backend)==="pgsql"?Mt="pgsql":Mt="sqlite"}function La(s,d,g){return`<label class="check-row"><input type="checkbox" name="${i(s)}" ${d?"checked":""} ${te?"disabled":""} /> ${i(g)}</label>`}function Gr(){const s=P==null?void 0:P.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${i((s==null?void 0:s.configPath)||"—")} ${s!=null&&s.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${i((s==null?void 0:s.specificPath)||"—")} ${s!=null&&s.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${aa("error",(P==null?void 0:P.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${te?"disabled":""}>Retry</button>
  </section>`}function Qr(){const s=P==null?void 0:P.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${te?"disabled":""}>
          ${nn((s==null?void 0:s.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${La("cal_enabled",(s==null?void 0:s.cal_enabled)!==!1,"Enable CalDAV")}
      ${La("card_enabled",(s==null?void 0:s.card_enabled)!==!1,"Enable CardDAV")}
      ${La("tasks_enabled",(s==null?void 0:s.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${La("notes_enabled",!!(s!=null&&s.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${La("files_enabled",!!(s!=null&&s.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${te?"disabled":""}>
          ${["Digest","Basic","Apache"].map(d=>`<option value="${d}" ${((s==null?void 0:s.dav_auth_type)||"Digest")===d?"selected":""}>${d}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${i((s==null?void 0:s.invite_from)||"")}" ${te?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${i(String((s==null?void 0:s.session_max_age_minutes)??15))}" ${te?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${te?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${te?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${te?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function Xr(){const s=P==null?void 0:P.defaults,d=(P==null?void 0:P.pdoDrivers)||[],g=d.includes("sqlite"),h=d.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${te?"disabled":""}>
          ${g?`<option value="sqlite" ${Mt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${h?`<option value="pgsql" ${Mt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Mt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${i((s==null?void 0:s.sqlite_file)||"")}" class="mono" ${te?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Mt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${i((s==null?void 0:s.pgsql_host)||"")}" placeholder="localhost:5432" ${te?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${i((s==null?void 0:s.pgsql_dbname)||"")}" ${te?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${i((s==null?void 0:s.pgsql_username)||"")}" autocomplete="off" ${te?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${te?"disabled":""} />
        </label>
      </div>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${te?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function Zr(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${i(String((P==null?void 0:P.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${i((P==null?void 0:P.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${rs?"checked":""} ${te?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${te||!rs?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function el(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${i((P==null?void 0:P.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function tl(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${aa("error",(P==null?void 0:P.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function rt(){const s=document.getElementById("app");if(!s)return;const d=(P==null?void 0:P.step)||"permissions";let g="";P?d==="permissions"?g=Gr():d==="initialize"?g=Qr():d==="database"?g=Xr():d==="upgrade"?g=Zr():d==="done"?g=el():d==="locked"?g=tl():g=`<section class="card"><p>Unknown step: ${i(d)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',s.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">AngaraDAV</p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${i((P==null?void 0:P.productVersion)||"…")}</span>
            ${P!=null&&P.configuredVersion?` · configured <span class="mono">${i(String(P.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${P!=null&&P.step?`<span class="badge badge-admin">${i(P.step)}</span>`:""}
      </header>
      ${nt?aa("error",nt,{dismissible:!1}):""}
      ${wt?aa("success",wt,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,al()}function al(){var d,g,h,k,L,O;const s=document.getElementById("app");s&&((d=s.querySelector('[data-action="reload"]'))==null||d.addEventListener("click",()=>{sl()}),(g=s.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",R=>{Mt=R.target.value==="pgsql"?"pgsql":"sqlite",rt()}),(h=s.querySelector('[data-action="upgrade-toggle"]'))==null||h.addEventListener("change",R=>{rs=!!R.target.checked,rt()}),(k=s.querySelector('[data-action="upgrade-run"]'))==null||k.addEventListener("click",()=>{ll()}),(L=s.querySelector('[data-form="initialize"]'))==null||L.addEventListener("submit",R=>{R.preventDefault(),nl(R.target)}),(O=s.querySelector('[data-form="database"]'))==null||O.addEventListener("submit",R=>{R.preventDefault(),rl(R.target)}))}async function sl(){te=!0,nt=null,rt();try{await Cs(),wt=null}catch(s){nt=s instanceof Error?s.message:"Failed to load installer status"}finally{te=!1,rt()}}async function nl(s){const d=new FormData(s),g=k=>{var L;return!!((L=s.querySelector(`input[name="${k}"]`))!=null&&L.checked)},h={timezone:String(d.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(d.get("dav_auth_type")??"Digest"),invite_from:String(d.get("invite_from")??"").trim(),session_max_age_minutes:Number(d.get("session_max_age_minutes")??15),admin_password:String(d.get("admin_password")??""),admin_password_confirm:String(d.get("admin_password_confirm")??"")};te=!0,nt=null,wt=null,rt();try{P=await ls("/initialize",{method:"POST",body:JSON.stringify(h)}),Ft=P.csrfToken||Ft,wt="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(k){nt=k instanceof Error?k.message:"Initialize failed"}finally{te=!1,rt()}}async function rl(s){const d=new FormData(s),g=String(d.get("backend")??Mt),h={backend:g};g==="sqlite"?h.sqlite_file=String(d.get("sqlite_file")??"").trim():(h.pgsql_host=String(d.get("pgsql_host")??"").trim(),h.pgsql_dbname=String(d.get("pgsql_dbname")??"").trim(),h.pgsql_username=String(d.get("pgsql_username")??"").trim(),h.pgsql_password=String(d.get("pgsql_password")??"")),te=!0,nt=null,wt=null,rt();try{P=await ls("/database",{method:"POST",body:JSON.stringify(h)}),Ft=P.csrfToken||Ft,wt="Database configured. Installer is locked.",N.event("install.database"),P.completed||P.step}catch(k){nt=k instanceof Error?k.message:"Database setup failed"}finally{te=!1,rt()}}async function ll(){if(rs){te=!0,nt=null,wt=null,rt();try{const s=await ls("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});wt="Upgrade completed."+(s.messages&&s.messages.length?" "+s.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await Cs()}catch(s){nt=s instanceof Error?s.message:"Upgrade failed"}finally{te=!1,rt()}}}async function ol(s){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),s.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Cs()}catch(d){nt=d instanceof Error?d.message:"Failed to load installer"}rt()}const ks=document.getElementById("app");if(!ks)throw new Error("#app missing");const tn=window.location.pathname.replace(/\/+$/,"")||"/";tn==="/portal/install"||tn.endsWith("/portal/install")?ol(ks):Kr(ks);
