var Qr=Object.defineProperty;var Xr=(s,c,g)=>c in s?Qr(s,c,{enumerable:!0,configurable:!0,writable:!0,value:g}):s[c]=g;var Ls=(s,c,g)=>Xr(s,typeof c!="symbol"?c+"":c,g);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const w of document.querySelectorAll('link[rel="modulepreload"]'))h(w);new MutationObserver(w=>{for(const q of w)if(q.type==="childList")for(const U of q.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&h(U)}).observe(document,{childList:!0,subtree:!0});function g(w){const q={};return w.integrity&&(q.integrity=w.integrity),w.referrerPolicy&&(q.referrerPolicy=w.referrerPolicy),w.crossOrigin==="use-credentials"?q.credentials="include":w.crossOrigin==="anonymous"?q.credentials="omit":q.credentials="same-origin",q}function h(w){if(w.ep)return;w.ep=!0;const q=g(w);fetch(w.href,q)}})();const pn={off:0,error:1,warn:2,info:3,debug:4};let ja="off";const ps="[angaradav-portal]";function Zr(s){const c=(s||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function el(s){return ja=Zr(s),ja!=="off"&&console.info(ps,`log level = ${ja}`),ja}function yn(s){return pn[ja]>=pn[s]}function os(s,c,g,h){if(!yn(s))return;const w=[ps,g];h!==void 0&&w.push(h),console[c](...w)}function tl(s,c){yn("info")&&(c&&Object.keys(c).length>0?console.info(ps,`event:${s}`,c):console.info(ps,`event:${s}`))}const N={error(s,c){os("error","error",s,c)},warn(s,c){os("warn","warn",s,c)},info(s,c){os("info","info",s,c)},debug(s,c){os("debug","debug",s,c)},event:tl};class Ie extends Error{constructor(g,h,w={}){super(g);Ls(this,"status");Ls(this,"payload");this.status=h,this.payload=w}}let pa="",cs=null,us=null;function ms(s){pa=s&&typeof s=="string"?s:""}function al(s){cs=s}function sl(s){us=s}function Fs(s){if(!$n(s))try{us==null||us()}catch{}}function $n(s){return s==="/login"||s==="/ui"||s==="/logout"||s==="/install/status"||s.startsWith("/install/")}function fs(s,c){if(!$n(s)){ms("");try{cs==null||cs(c||"Session timed out. Please sign in again.")}catch{}}}async function _(s,c={}){const g=new Headers(c.headers);c.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const h=(c.method||"GET").toUpperCase();h!=="GET"&&h!=="HEAD"&&h!=="OPTIONS"&&pa&&g.set("X-CSRF-Token",pa);const w=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${h} ${s}`);const q=await fetch(`/api${s}`,{...c,headers:g,credentials:"same-origin"});let U=null;const M=await q.text();if(M)try{U=JSON.parse(M)}catch{U={error:M}}const W=Math.round((typeof performance<"u"?performance.now():Date.now())-w);if(!q.ok){let ee=`Request failed (${q.status})`,oe={};if(U&&typeof U=="object"&&U!==null){const se=U;oe={...se},typeof se.error=="string"&&(ee=se.error)}else(q.status===500||q.status===504)&&(ee="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw q.status>=500?N.error(`api ← ${h} ${s} ${q.status} (${W}ms)`,ee):q.status!==401?N.warn(`api ← ${h} ${s} ${q.status} (${W}ms)`,ee):(N.debug(`api ← ${h} ${s} 401 (${W}ms)`),fs(s,ee)),new Ie(ee,q.status,oe)}return N.info(`api ← ${h} ${s} ${q.status} (${W}ms)`),Fs(s),U}function st(s){return encodeURIComponent(s)}async function fn(s,c,g,h){const w=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});pa&&w.set("X-CSRF-Token",pa);const q=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${s} (stream, ${g}, ${c.length} bytes)`);let U;try{U=await fetch(`/api${s}`,{method:"POST",headers:w,credentials:"same-origin",body:c})}catch(R){const Q=R instanceof Error?R.message:"Network error";throw N.error(`api ← POST ${s} network fail`,Q),new Ie(`Import request failed to start (${Q}). Check connectivity and container logs.`,0)}const M=(U.headers.get("Content-Type")||"").toLowerCase(),W=M.includes("ndjson")||M.includes("x-ndjson");if(!U.ok&&!W){let R=`Request failed (${U.status})`;try{const Q=await U.json();Q.error&&(R=Q.error)}catch{}throw(U.status===504||U.status===502)&&(R="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),U.status===401?(N.debug(`api ← POST ${s} 401`,R),fs(s,R)):N.warn(`api ← POST ${s} ${U.status}`,R),new Ie(R,U.status)}if(!W&&U.ok){try{const R=await U.json();if(R&&typeof R.error=="string")throw new Ie(R.error,U.status||500);if(R&&typeof R.imported=="number"&&typeof R.updated=="number")return N.info(`api ← POST ${s} json done`),R}catch(R){if(R instanceof Ie)throw R}throw new Ie("Unexpected import response from server",500)}if(!U.body)throw new Ie("Import stream unavailable",500);const ee=U.body.getReader(),oe=new TextDecoder;let se="";const te={final:null,error:null,sawProgress:!1},bt=R=>{let Q;try{Q=JSON.parse(R)}catch{N.debug("import stream non-JSON line",R.slice(0,80));return}if(Q.type==="progress"){te.sawProgress=!0;const qe=Number(Q.total)||0,ze=Number(Q.current)||0,Le=typeof Q.percent=="number"?Q.percent:qe>0?Math.round(100*ze/qe):0;h==null||h({percent:Le,current:ze,total:qe,imported:Number(Q.imported)||0,updated:Number(Q.updated)||0,skipped:Number(Q.skipped)||0})}else Q.type==="done"&&Q.result?te.final=Q.result:Q.type==="error"&&(te.error={message:Q.error||"Import failed",status:Q.status||500})};for(;;){const{done:R,value:Q}=await ee.read();if(R)break;se+=oe.decode(Q,{stream:!0});const qe=se.split(`
`);se=qe.pop()??"";for(const ze of qe){const Le=ze.trim();Le&&bt(Le)}}se.trim()&&bt(se.trim());const B=Math.round((typeof performance<"u"?performance.now():Date.now())-q);if(te.error)throw te.error.status===401?(N.debug(`api ← POST ${s} stream 401 (${B}ms)`,te.error.message),fs(s,te.error.message)):N.warn(`api ← POST ${s} stream error (${B}ms)`,te.error.message),new Ie(te.error.message,te.error.status);if(!te.final)throw N.error(`api ← POST ${s} stream incomplete (${B}ms)`,{sawProgress:te.sawProgress}),new Ie(te.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${s} stream done (${B}ms)`),Fs(s),te.final}const A={ui:()=>_("/ui"),installStatus:async()=>{const s=await _("/install/status");return s&&typeof s=="object"&&"data"in s&&s.data?s.data:s},adminPing:()=>_("/admin/ping"),adminDashboard:()=>_("/admin/dashboard"),adminCapabilities:()=>_("/admin/capabilities"),adminUsers:()=>_("/admin/users"),adminUser:s=>_(`/admin/users/${encodeURIComponent(s)}`),adminCreateUser:s=>_("/admin/users",{method:"POST",body:JSON.stringify(s)}),adminUpdateUser:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"PATCH",body:JSON.stringify(c)}),adminDeleteUser:(s,c=!0)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"DELETE",body:JSON.stringify({confirm:c})}),adminUserCalendars:s=>_(`/admin/users/${encodeURIComponent(s)}/calendars`),adminCreateUserCalendar:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/calendars`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserCalendar:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(s,c,g=!0)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:s=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`),adminCreateUserAddressBook:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserAddressBook:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(s,c,g=!0,h=!1)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:h})}),adminSystemSettings:()=>_("/admin/settings/system"),adminUpdateSystemSettings:s=>_("/admin/settings/system",{method:"PATCH",body:JSON.stringify(s)}),adminResetToDefault:(s=!0,c="")=>_("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:s,password:c})}),adminDatabaseSettings:()=>_("/admin/settings/database"),adminTestDatabaseConnection:s=>_("/admin/settings/database/test",{method:"POST",body:JSON.stringify(s)}),adminUpdateDatabaseSettings:s=>_("/admin/settings/database",{method:"PATCH",body:JSON.stringify(s)}),me:async()=>{var c;const s=await _("/me");return ms(s.csrfToken||((c=s.user)==null?void 0:c.csrfToken)),s},login:async(s,c)=>{var h;const g=await _("/login",{method:"POST",body:JSON.stringify({username:s,password:c})});return ms((h=g.user)==null?void 0:h.csrfToken),g},logout:async()=>{try{return await _("/logout",{method:"POST"})}finally{ms("")}},calendars:()=>_("/calendars"),createCalendar:s=>_("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>_("/holidays/countries"),updateCalendar:(s,c)=>_(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:s=>_(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,c,g)=>{const h=new URLSearchParams({from:c,to:g}).toString();return _(`/calendars/${s}/events?${h}`)},getEvent:(s,c)=>_(`/calendars/${s}/events/${st(c)}`),createEvent:(s,c)=>_(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(s,c,g)=>_(`/calendars/${s}/events/${st(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(s,c)=>_(`/calendars/${s}/events/${st(c)}`,{method:"DELETE"}),exportCalendar:async s=>{const c=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const M=await c.json();M.error&&(U=M.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`calendar-${s}.ics`;return{blob:await c.blob(),filename:w}},importCalendar:(s,c,g)=>fn(`/calendars/${s}/import`,c,"text/calendar; charset=utf-8",g),directory:()=>_("/directory"),shares:s=>_(`/calendars/${s}/shares`),share:(s,c,g)=>_(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:c,access:g})}),revoke:(s,c)=>_(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>_("/addressbooks"),createAddressBook:s=>_("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,c)=>_(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(s,c=!1)=>_(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async s=>{const c=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const M=await c.json();M.error&&(U=M.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`contacts-${s}.vcf`;return{blob:await c.blob(),filename:w}},importAddressBook:(s,c,g)=>fn(`/addressbooks/${s}/import`,c,"text/vcard; charset=utf-8",g),contacts:(s,c="")=>{const g=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return _(`/addressbooks/${s}/contacts${g}`)},getContact:(s,c)=>_(`/addressbooks/${s}/contacts/${st(c)}`),createContact:(s,c)=>_(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(s,c,g)=>_(`/addressbooks/${s}/contacts/${st(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(s,c)=>_(`/addressbooks/${s}/contacts/${st(c)}`,{method:"DELETE"}),exportContact:async(s,c)=>{const g=await fetch(`/api/addressbooks/${s}/contacts/${st(c)}/export`,{credentials:"same-origin"});if(!g.ok){let M=`Export failed (${g.status})`;try{const W=await g.json();W.error&&(M=W.error)}catch{}throw new Ie(M,g.status)}const h=g.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(h),q=(w==null?void 0:w[1])||"contact.vcf";return{blob:await g.blob(),filename:q}},contactPhotoUrl:(s,c)=>`/api/addressbooks/${s}/contacts/${st(c)}/photo`,tasks:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/tasks${g}`)},createTask:s=>_("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,c,g)=>_(`/tasks/${s}/${st(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(s,c)=>_(`/tasks/${s}/${st(c)}`,{method:"DELETE"}),bulkTasks:s=>_("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/notes${g}`)},createNote:s=>_("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,c,g)=>_(`/notes/${s}/${st(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(s,c)=>_(`/notes/${s}/${st(c)}`,{method:"DELETE"}),filesStatus:()=>_("/files"),filesList:(s="")=>{const c=new URLSearchParams;s&&c.set("path",s);const g=c.toString()?`?${c}`:"";return _(`/files/entries${g}`)},filesMkdir:(s,c)=>_("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:c})}),filesUpload:async(s,c,g={})=>{const h=new URLSearchParams;s&&h.set("path",s),h.set("name",c.name),g.replace&&h.set("replace","1");const w=new Headers;pa&&w.set("X-CSRF-Token",pa);const q=new FormData;q.append("file",c,c.name),s&&q.append("path",s);const U=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST /files/upload path=${s||"/"} name=${c.name} size=${c.size}`);const M=await fetch(`/api/files/upload?${h}`,{method:"POST",headers:w,credentials:"same-origin",body:q}),W=await M.text();let ee=null;if(W)try{ee=JSON.parse(W)}catch{ee={error:W}}const oe=Math.round((typeof performance<"u"?performance.now():Date.now())-U);if(!M.ok){let se=`Upload failed (${M.status})`;throw ee&&typeof ee=="object"&&ee!==null&&"error"in ee&&typeof ee.error=="string"&&(se=ee.error),M.status===401?(N.debug(`api ← POST /files/upload 401 (${oe}ms)`,se),fs("/files/upload",se)):M.status>=500?N.error(`api ← POST /files/upload ${M.status} (${oe}ms)`,se):N.warn(`api ← POST /files/upload ${M.status} (${oe}ms)`,se),new Ie(se,M.status)}return N.info(`api ← POST /files/upload 200 (${oe}ms)`),Fs("/files/upload"),ee},filesDownloadUrl:s=>{const c=new URLSearchParams;return c.set("path",s),`/api/files/download?${c}`},filesDelete:s=>_("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,c)=>_("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:c})}),filesMove:(s,c,g)=>_("/files/move",{method:"POST",body:JSON.stringify({from:s,to:c,newName:g})}),filesCopy:(s,c={})=>_("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:c.to,newName:c.newName})}),filesBulk:(s,c)=>_("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:c})})},nl=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let Ea=null;function rl(){if(Ea)return Ea;try{const s=Intl;if(typeof s.supportedValuesOf=="function"){const c=s.supportedValuesOf("timeZone");if(Array.isArray(c)&&c.length>0)return Ea=[...c].sort((g,h)=>g.localeCompare(h)),Ea}}catch{}return Ea=[...nl],Ea}function vn(s){const c=s||"UTC",g=rl(),h=g.includes(c),w=g.map(q=>`<option value="${bn(q)}" ${q===c?"selected":""}>${gn(q)}</option>`);return!h&&c&&w.unshift(`<option value="${bn(c)}" selected>${gn(c)}</option>`),w.join("")}function bn(s){return s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function gn(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function o(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ma(s,c,g={}){if(!c)return"";const h=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,w=g.dismissAction??"flash-close",q=g.role??"status",U=g.className?` ${g.className}`:"",M=g.style?` style="${o(g.style)}"`:"",W=h?`<button type="button" class="flash-close" data-action="${o(w)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${o(s)}${U}" role="${o(q)}"${M}>
      <span class="flash-text">${o(c)}</span>
      ${W}
    </div>`}function ll(s){return s==="sm"?" cal-modal-card-sm":s==="wide"?" cal-modal-card-wide":""}function il(s){return s==="danger"?"btn btn-danger":s==="ghost"?"btn btn-ghost":"btn btn-primary"}function wn(s){return s.map(g=>{const h=g.type??"button",w=il(g.variant),q=g.disabled?" disabled":"",U=g.id?` id="${o(g.id)}"`:"",M=g.action?` data-action="${o(g.action)}"`:"",W=g.attrs?` ${g.attrs}`:"";return`<button type="${h}" class="${w}"${M}${U}${W}${q}>${o(g.label)}</button>`}).join(`
`)}function ke(s){const c=s.titleId||(s.id?`${s.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=s.id?` id="${o(s.id)}"`:"",h=s.className?` ${s.className}`:"",w=s.rootAttrs?` ${s.rootAttrs}`:"",q=`${ll(s.size)}${s.cardClassName?` ${s.cardClassName}`:""}`,U=s.closeAction,M=s.lockBackdrop?"":` data-action="${o(U)}"`,W=s.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${o(U)}" aria-label="Close">×</button>`;let ee="";s.footer!==void 0&&(ee=typeof s.footer=="string"?s.footer:wn(s.footer));const oe=ee?`<footer class="cal-modal-footer">${ee}</footer>`:"",se=`<div class="cal-modal-body">${s.body}</div>`;let te;return s.form?te=`<form class="stack"${s.formAttrs?` ${s.formAttrs}`:""}>
        ${se}
        ${oe}
      </form>`:te=`${se}
      ${oe}`,`<div class="cal-modal${h}"${g}${w} role="dialog" aria-modal="true" aria-labelledby="${o(c)}">
      <div class="cal-modal-backdrop"${M}></div>
      <div class="cal-modal-card${q}">
        <header class="cal-modal-header">
          <h3 id="${o(c)}">${o(s.title)}</h3>
          ${W}
        </header>
        ${te}
      </div>
    </div>`}function ds(s){const c=s.style==="checkbox"?"checkbox":"admin-delete-confirm",g=s.style==="checkbox"?' style="margin-top:1rem"':"",h=s.id?` id="${o(s.id)}"`:"",w=s.checked?" checked":"",q=s.disabled?" disabled":"";return`<label class="${c}"${g}>
            <input type="checkbox"${h} data-action="${o(s.action)}"${w}${q} />
            ${o(s.label)}
          </label>`}const kn="angaradav-portal-tab",Sn="angaradav-portal-admin-page",ol="2.0.0",dl="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ms(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function bs(s){return s==="overview"||s==="users"||s==="settings"||s==="database"?s:null}function Rs(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!s)return{tab:null,adminPage:null,adminUsername:null};if(s==="admin"||s.startsWith("admin/")){const c=s.split("/").filter(Boolean),g=c[1]??"overview",h=bs(g)??"overview";let w=null;if(h==="users"&&c[2])try{w=decodeURIComponent(c[2])}catch{w=c[2]}return{tab:"admin",adminPage:h,adminUsername:w}}return{tab:Ms(s),adminPage:null,adminUsername:null}}function cl(){const s=Rs().tab;if(s)return s;try{const c=Ms(sessionStorage.getItem(kn));if(c)return c}catch{}return"calendars"}function ul(){const s=Rs().adminPage;if(s)return s;try{const c=bs(sessionStorage.getItem(Sn));if(c)return c}catch{}return"overview"}function ml(s,c=null){return s==="overview"?"#admin":s==="users"&&c?`#admin/users/${encodeURIComponent(c)}`:`#admin/${s}`}function mt(s,c="overview",g=null){try{sessionStorage.setItem(kn,s),s==="admin"&&sessionStorage.setItem(Sn,c)}catch{}if(typeof history>"u"||typeof location>"u")return;const h=s==="admin"?ml(c,g):`#${s}`;location.hash!==h&&history.replaceState(null,"",`${location.pathname}${location.search}${h}`)}function Os(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${o(s)}</span>`}function Us(s){const c=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&c.push(`${s.skipped} skipped`),c.join(", ")}const pl={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function ye(s,c,g="h2"){const h=g;return`<div class="section-title-row">
    <${h}>${o(s)}</${h}>
    <button type="button" class="info-btn" data-action="info" data-info="${o(c)}"
      aria-label="About ${o(s)}" title="About ${o(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function fl(){return`
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
    </div>`}function bl(s){let c=null,g=null,h=cl(),w=ul(),q=null,U=!1,M=null,W=null,ee=null,oe=[],se=!1,te=null,bt="",B=Rs().adminUsername??null,R=null,Q=!1,qe=null,ze=!1,Le=!1,gt=null,xt=!1,Tt=[],_t=[],Na=!1,We=null,Yt=null,nt=null,Kt=null,$e=null,Gt=null,Ha=!1,xa=null,fa=!1,ht=!1,Je="",Qt=null,Wa=!1,Ta=null,Xt="sqlite",ba=!1,yt="",ga=null,Oe=!1,ha=null,ne=[],Zt=[],Ja=[],F=null,K=[],ea=[],je=null,ge=!1,Me=!1,Re=null,Ye=null,It={y:new Date().getFullYear(),m:new Date().getMonth()},ta=[],ys=!1,$t=!1,k=null,rt=!1,O=null,Ya="",_a=null,Ue=[],V=null,kt=[],aa="",de=null,I=null,pe=!1,Se=!1,lt=!1,Ee=null,He=null,Ke=!1,d=!1,z=null,Ka=null,Bs=!1,ya={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ge=null,zs=900,Ia=null,sa=ol,$s=!1,Ga=!1;function vs(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();ya={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},el(ya.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(zs=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(sa=e.version.trim())}function ws(){Ia!==null&&(clearTimeout(Ia),Ia=null)}function ks(){if(ws(),!c)return;const e=Math.max(30,zs)*1e3;Ia=setTimeout(()=>{Ia=null,Ys("Your session timed out. Please sign in again.")},e)}function Qa(){ws(),vt(),z=null,c=null,ne=[],ea=[],F=null,K=[],Zt=[],Ue=[],V=null,kt=[],de=null,I=null,pe=!1,Se=!1,lt=!1,Me=!1,ge=!1,Re=null,Ye=null,$t=!1,k=null,rt=!1,ta=[],Ne=[],va=[],Ot=[],Ut=[],Pe=null,it=null,j=null,re=null,X=!1,we=!1,he=[],Cs=null,De="",xe=[],ka=!1,Fe=null,Ce=null,Lt(),dt=!1,ce=[],Ee=null,He=null,Ke=!1,d=!1,Oe=!1,q=null,U=!1,M=null,W=null,ee=null,oe=[],se=!1,te=null,bt="",B=null,R=null,Q=!1,qe=null,ze=!1,Le=!1,gt=null,xt=!1,Tt=[],_t=[],Na=!1,We=null,Yt=null,nt=null,Kt=null,$e=null,Gt=null,Ha=!1,xa=null,fa=!1,ht=!1,Je="",Qt=null,Wa=!1,Ta=null,Xt="sqlite",ba=!1,yt="",ga=null,La()}function ve(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function qt(){return ve()?W===null?!0:W.uiEnabled!==!1:!1}function Ve(e){const t=W==null?void 0:W.pages;return t?t.find(a=>a.id===e)??null:null}function $a(e){switch(e){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return e}}function qa(e){return e==="full"||e==="read-only"?"badge-ok":e==="deferred"?"badge-off":"badge-soon"}function La(){ha&&(document.removeEventListener("click",ha,!0),ha=null)}function Dn(){La(),ha=t=>{var r;const a=t.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".user-menu")||(Oe=!1,La(),p())};const e=ha;setTimeout(()=>{Oe&&ha===e&&document.addEventListener("click",e,!0)},0)}function js(){h==="admin"&&(!ve()||!qt())&&(h="calendars",w="overview",mt(h))}async function Hs(e,t={}){if(!ve()){await Js("calendars",t);return}h="admin",w=e,e!=="users"?(B=null,R=null,qe=null):t.username!==void 0&&(B=t.username,t.username||(R=null,qe=null)),Oe=!1,mt("admin",e,B),N.event("tab",{tab:"admin",adminPage:e,user:B}),t.clearFlash!==!1&&E(),d=!0,p();try{if(await Ss(),!qt()){h="calendars",mt("calendars"),f("info","Portal Administration UI is disabled.");return}const a=Ve(e);e==="overview"&&(a==null?void 0:a.available)!==!1?await Xa():e==="users"&&(a==null?void 0:a.available)!==!1?(await na(),B&&(await St(B),await ra(B))):e==="settings"&&(a==null?void 0:a.available)!==!1?await Za():e==="database"&&(a==null?void 0:a.available)!==!1&&await es()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),f("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function Ss(){var e;ee=null;try{W=(await A.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:W.uiEnabled,pages:((e=W.pages)==null?void 0:e.length)??0})}catch(t){ee=t instanceof Error?t.message:"Failed to load capabilities",W={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",ee)}}async function Xa(){U=!0,M=null;try{q=(await A.adminDashboard()).data,N.debug("admin.dashboard",{users:q.users,calendars:q.calendars})}catch(e){throw q=null,M=e instanceof Error?e.message:"Failed to load dashboard",e}finally{U=!1}}async function na(){se=!0,te=null;try{oe=(await A.adminUsers()).users??[],N.debug("admin.users",{count:oe.length})}catch(e){throw oe=[],te=e instanceof Error?e.message:"Failed to load users",e}finally{se=!1}}async function St(e){Q=!0,qe=null;try{const t=await A.adminUser(e);R=t.user,B=t.user.username,N.debug("admin.user",{username:t.user.username})}catch(t){throw R=null,qe=t instanceof Error?t.message:"Failed to load user",t}finally{Q=!1}}async function ra(e){Na=!0;try{const[t,a]=await Promise.all([A.adminUserCalendars(e),A.adminUserAddressBooks(e)]);Tt=t.calendars??[],_t=a.addressbooks??[]}catch(t){throw Tt=[],_t=[],t}finally{Na=!1}}async function Za(){Ha=!0,xa=null;try{Gt=(await A.adminSystemSettings()).data}catch(e){throw Gt=null,xa=e instanceof Error?e.message:"Failed to load settings",e}finally{Ha=!1}}async function es(){Wa=!0,Ta=null;try{const e=await A.adminDatabaseSettings();Qt=e.data,Xt=(e.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(e){throw Qt=null,Ta=e instanceof Error?e.message:"Failed to load database settings",e}finally{Wa=!1}}async function Cn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),i=String(t.get("email")??"").trim(),m=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a||!r||!i||!m){f("error","Username, display name, email, and password are required"),p();return}if(m!==n){f("error","Password confirmation does not match"),p();return}d=!0,E(),p();try{const l=await A.adminCreateUser({username:a,displayname:r,email:i,password:m,passwordConfirm:n});N.event("admin.user.create",{username:l.user.username}),ze=!1,B=l.user.username,R=l.user,mt("admin","users",l.user.username),await na(),f("success",`Created user “${l.user.username}”`)}catch(l){f("error",l instanceof Error?l.message:"Create failed")}finally{d=!1,p()}}async function An(e){var u,b;if(!B)return;const t=B,a=new FormData(e),r=String(a.get("displayname")??"").trim(),i=String(a.get("description")??"").trim(),m=String(a.get("calendarcolor")??"").trim(),n=((u=e.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,l=((b=e.querySelector('input[name="notes"]'))==null?void 0:b.checked)??!1;d=!0,E(),p();try{if(We==="create"){const y=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserCalendar(t,{uri:y,displayname:r,description:i,calendarcolor:m||void 0,todos:n,notes:l}),f("success",`Created calendar “${r}”`)}else{const y=Number(a.get("instanceId"));await A.adminUpdateUserCalendar(t,y,{displayname:r,description:i,calendarcolor:m,todos:n,notes:l}),f("success",`Updated calendar “${r}”`)}We=null,Yt=null,await ra(t),await St(t)}catch(y){f("error",y instanceof Error?y.message:"Save failed")}finally{d=!1,p()}}async function En(e){if(!B)return;const t=B,a=new FormData(e),r=String(a.get("displayname")??"").trim(),i=String(a.get("description")??"").trim();d=!0,E(),p();try{if(nt==="create"){const m=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserAddressBook(t,{uri:m,displayname:r,description:i}),f("success",`Created address book “${r}”`)}else{const m=Number(a.get("id"));await A.adminUpdateUserAddressBook(t,m,{displayname:r,description:i}),f("success",`Updated address book “${r}”`)}nt=null,Kt=null,await ra(t),await St(t)}catch(m){f("error",m instanceof Error?m.message:"Save failed")}finally{d=!1,p()}}function Ws(e){const t=new FormData(e),a=String(t.get("backend")??Xt).toLowerCase()==="pgsql"?"pgsql":"sqlite",r={backend:a};return a==="sqlite"?r.sqlite_file=String(t.get("sqlite_file")??"").trim():(r.pgsql_host=String(t.get("pgsql_host")??"").trim(),r.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),r.pgsql_username=String(t.get("pgsql_username")??"").trim(),r.pgsql_password=String(t.get("pgsql_password")??"")),r}function Nn(e){ga=Ws(e),yt="",ba=!0,E(),p()}async function xn(e){if(e||(e=s.querySelector('[data-form="admin-database"]')),!e){f("error","Database form not found"),p();return}const t=Ws(e);d=!0,E(),p();try{const a=await A.adminTestDatabaseConnection(t);f("success",a.message||"Connection successful"),N.event("admin.database.test",{backend:a.backend})}catch(a){f("error",a instanceof Error?a.message:"Connection test failed")}finally{d=!1,p()}}async function Tn(e){const t=new FormData(e),a=n=>{var l;return!!((l=e.querySelector(`input[name="${n}"]`))!=null&&l.checked)},r={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(t.get("timezone")??"").trim(),invite_from:String(t.get("invite_from")??"").trim(),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),files_storage_path:String(t.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(t.get("files_max_upload_mb")??0),files_quota_mb:Number(t.get("files_quota_mb")??0),files_quarantine_days:Number(t.get("files_quarantine_days")??0),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),portal_log_level:String(t.get("portal_log_level")??"off"),portal_admin_users:String(t.get("portal_admin_users")??"").trim(),push_external_url:String(t.get("push_external_url")??"").trim(),push_log_level:String(t.get("push_log_level")??"off")},i=String(t.get("admin_password")??""),m=String(t.get("admin_password_confirm")??"");(i!==""||m!=="")&&(r.admin_password=i,r.admin_password_confirm=m),d=!0,E(),p();try{Gt=(await A.adminUpdateSystemSettings(r)).data,N.event("admin.settings.save"),f("success","System settings saved")}catch(n){f("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,p()}}async function _n(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),i=String(t.get("email")??"").trim(),m=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a){f("error","Username is required"),p();return}if(!r||!i){f("error","Display name and email are required"),p();return}if(m!==""||n!==""){if(m===""||n===""){f("error","Password and confirmation are required to change password"),p();return}if(m!==n){f("error","Password confirmation does not match"),p();return}}d=!0,E(),p();try{const l={displayname:r,email:i};m!==""&&(l.password=m,l.passwordConfirm=n);const u=await A.adminUpdateUser(a,l);N.event("admin.user.update",{username:u.user.username,passwordChanged:m!==""}),Le=!1,R=u.user,B=u.user.username,await na(),f("success",m!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(l){f("error",l instanceof Error?l.message:"Update failed")}finally{d=!1,p()}}async function Js(e,t={}){if(e==="admin"&&(!ve()||!qt())&&(ve()&&W&&!W.uiEnabled&&f("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),e="calendars"),e==="admin"){await Hs(w||"overview",{...t,username:w==="users"?B:null});return}h=e,Oe=!1,mt(e),N.event("tab",{tab:e}),e!=="calendars"&&(ge=!1,Re=null),e!=="contacts"&&(Ye=null),t.clearFlash!==!1&&E(),d=!0,p();try{e==="contacts"&&V!==null?await Mt(V):e==="calendars"?await Ze():e==="tasks"?await Rt():e==="notes"?await Sa():e==="files"&&await Dt()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),f("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function Dt(){ka=!0;try{N.debug("loadFiles",{path:De});const[e,t]=await Promise.all([A.filesStatus(),A.filesList(De).catch(a=>{if(a instanceof Ie&&(a.status===503||a.status===404))return{path:De,entries:[]};throw a})]);if(Cs=e,e.ready){De=t.path,xe=t.entries;const a=new Set(xe.map(r=>r.path));ce=ce.filter(r=>a.has(r))}else xe=[],ce=[];N.event("loadFiles",{path:De,count:xe.length,enabled:e.enabled,ready:e.ready})}finally{ka=!1}}function ts(e,t){for(const a of t)if(a&&(e===a||e.startsWith(`${a}/`)))return!0;return!1}function Lt(){fe=null,At="",Qe={},ot=[]}async function as(e,t){if(t.length===0)return;fe={op:e,paths:[...t]},At=De,Qe={};const a=new Set([""]);if(De){const r=De.split("/").filter(Boolean);let i="";for(const m of r)i=i?`${i}/${m}`:m,a.add(i)}ot=[...a],Fe=null,Ce=null,dt=!1,E(),p(),await Promise.all([...a].map(r=>Ds(r)))}async function Ds(e){const t=Qe[e];if(!(t&&t!=="error")){Qe={...Qe,[e]:"loading"},p();try{const r=(await A.filesList(e)).entries.filter(i=>i.type==="dir").slice().sort((i,m)=>i.name.localeCompare(m.name,void 0,{sensitivity:"base"}));if(!fe)return;Qe={...Qe,[e]:r}}catch(a){if(!fe)return;Qe={...Qe,[e]:"error"},N.warn("files.tree",{path:e||"/",error:a instanceof Error?a.message:String(a)})}p()}}function In(){if(!fe)return"";const e=fe.paths,t=[],a=(r,i)=>{const m=At===r,n=ts(r,e),l=ot.includes(r),u=Qe[r],b=Array.isArray(u),y=r===""||u==="loading"||u==="error"||!b||u.length>0,$=r===""?"Home":Fa(r),v=n?"Cannot use a selected item (or a folder inside it) as the destination":r===""?"File home root":r,x=l?"▾":"▸";if(t.push(`<div class="files-tree-row${m?" is-selected":""}${n?" is-blocked":""}" style="--depth:${i}" role="treeitem" aria-selected="${m}" aria-expanded="${l}" aria-disabled="${n}">
        ${y?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${o(r)}"
                aria-label="${l?"Collapse":"Expand"} ${o($)}" ${d?"disabled":""}>${x}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
        <button type="button" class="files-tree-select${m?" is-selected":""}" data-action="files-tree-select" data-path="${o(r)}"
          title="${o(v)}" ${d||n?"disabled":""}>
          <span class="files-icon" aria-hidden="true">📁</span>
          <span class="files-tree-label">${o($)}</span>
        </button>
      </div>`),!!l){if(u==="loading"){t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Loading…</div>`);return}if(u==="error"){t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Could not load folders.
            <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${o(r)}" ${d?"disabled":""}>Retry</button>
          </div>`);return}if(b){for(const D of u)a(D.path,i+1);u.length===0&&r===""&&t.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">No subfolders yet — destination will be Home.</div>`)}}};return a("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${t.join("")}</div>`}function Ys(e){if(!$s){if(!c){ws();return}$s=!0;try{N.event("session.expired"),Qa(),Ga=!0,g={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},p()}finally{$s=!1}}}let Ne=[],va=[],Ot=[],Ut=[],ss="",ns="",Pt="due",Ct="asc",wa="dtstart",la="desc",Pe=null,it=null,j=null,re=null,X=!1,we=!1,he=[],Cs=null,De="",xe=[],ka=!1,Fe=null,Ce=null,fe=null,At="",Qe={},ot=[],dt=!1,ce=[];function f(e,t){Ga&&e==="error"||(e!=="error"&&(Ga=!1),g={type:e,message:t})}function E(){g=null,Ga=!1}function qn(e){const t=String(e.step||"");t==="upgrade"||t==="initialize"||t==="permissions"||t==="database"?(je={step:t,message:e.message||(t==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:e.installUrl||"/portal/install/",productVersion:e.productVersion,configuredVersion:e.configuredVersion??null},typeof e.productVersion=="string"&&e.productVersion.trim()!==""&&(sa=e.productVersion.trim())):je=null}function Ln(e){if(!(e instanceof Ie)||e.status!==503)return!1;const t=typeof e.payload.code=="string"?e.payload.code:"";return t!=="upgrade_required"&&t!=="not_configured"&&t!=="admin_password_missing"?!1:(je={step:t==="upgrade_required"?"upgrade":"initialize",message:e.message,installUrl:typeof e.payload.installUrl=="string"?e.payload.installUrl:"/portal/install/",productVersion:typeof e.payload.productVersion=="string"?e.payload.productVersion:void 0,configuredVersion:typeof e.payload.configuredVersion=="string"?e.payload.configuredVersion:null},je.productVersion&&(sa=je.productVersion),!0)}async function On(){var e,t,a,r;N.event("bootstrap.start"),al(i=>{Ys(/timed\s*out|session expired/i.test(i)?i:"Your session timed out. Please sign in again.")}),sl(()=>{ks()});try{const i=await A.installStatus();qn(i)}catch(i){N.debug("bootstrap: /api/install/status failed",i instanceof Error?i.message:i)}try{const i=await A.ui();vs(i.ui),typeof i.version=="string"&&i.version.trim()!==""?sa=i.version.trim():i.ui&&typeof i.ui.version=="string"&&i.ui.version.trim()!==""&&(sa=i.ui.version.trim()),je==null||je.step}catch(i){N.debug("bootstrap: /api/ui failed",i instanceof Error?i.message:i),Ln(i)}if(je&&je.step!=="done"&&je.step!=="locked"){Qa(),N.event("bootstrap.installGate",{step:je.step}),p();return}try{const i=await A.me();if(c=i.user,vs(i.ui),typeof i.version=="string"&&i.version.trim()!==""&&(sa=i.version.trim()),N.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),ks(),ve())try{await Ss()}catch(m){N.warn("admin.capabilities bootstrap",m instanceof Error?m.message:m)}if(js(),mt(h,w),await Xe(),h==="admin"&&ve()&&qt())try{w==="overview"&&((e=Ve("overview"))==null?void 0:e.available)!==!1?await Xa():w==="users"&&((t=Ve("users"))==null?void 0:t.available)!==!1?(await na(),B&&(await St(B),await ra(B))):w==="settings"&&((a=Ve("settings"))==null?void 0:a.available)!==!1?await Za():w==="database"&&((r=Ve("database"))==null?void 0:r.available)!==!1&&await es()}catch(m){N.warn("admin bootstrap load",m instanceof Error?m.message:m)}}catch(i){i instanceof Ie&&i.status===401?(Qa(),/timed\s*out|session expired/i.test(i.message)&&f("info",i.message),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",i instanceof Error?i.message:i),f("error",i instanceof Error?i.message:"Failed to load"))}p()}async function Xe(){N.debug("loadHome");const[e,t,a]=await Promise.all([A.calendars(),A.directory().catch(()=>({users:[]})),A.addressbooks()]);if(ne=e.calendars,Zt=t.users,Ue=a.addressbooks,N.event("loadHome",{calendars:ne.length,addressBooks:Ue.length,directory:Zt.length}),Ja.length===0)try{Ja=(await A.holidayCountries()).countries}catch{Ja=[]}if(K=K.filter(r=>ne.some(i=>i.id===r)),F!==null&&!ne.some(r=>r.id===F)&&(F=null,ea=[],ge=!1,Re=null),K.length===0){const r=Ks();r?(K=[r.id],F=r.id):ne.length>0&&(K=[ne[0].id],F=ne[0].id)}F===null&&K.length>0&&(F=K[0]),F!==null&&ge?await Oa(F):F!==null&&(ea=[]),h==="calendars"&&await Ze(),V!==null&&!Ue.some(r=>r.id===V)&&(V=null,kt=[],de=null,I=null,pe=!1),Ye!==null&&!Ue.some(r=>r.id===Ye)&&(Ye=null),V===null&&Ue.length>0&&(V=Ue[0].id),V!==null&&h==="contacts"&&await Mt(V),h==="tasks"&&await Rt(),h==="notes"&&await Sa(),h==="files"&&await Dt()}async function Oa(e){ea=(await A.shares(e)).shares}function Ks(){const e=ne.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const r=a.uri.toLowerCase(),i=a.displayname.toLowerCase();return r==="default"||i==="default"||i==="default calendar"};return e.find(t)??e[0]??null}function be(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${r}`}function Un(e,t){const a=new Date(e,t,1),r=new Date(e,t+1,0);return{from:be(a),to:be(r)}}function As(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,r,i]=e.split("-").map(Number);return new Date(a,r-1,i)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,r,i]=e.slice(0,10).split("-").map(Number);return new Date(a,(r||1)-1,i||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Pn(e){const t=As(e.start);if(!e.end)return[be(t)];let a=As(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[be(t)];const r=[],i=new Date(t.getFullYear(),t.getMonth(),t.getDate()),m=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;i<=m&&n++<370;)r.push(be(i)),i.setDate(i.getDate()+1);return r.length?r:[be(t)]}function Es(e,t){const a=e.slice(0,10),r=(t||a).slice(0,10);if(a===r){const v=Pa(a);return{start:v.start,end:v.end}}const[i,m,n]=a.split("-").map(Number),[l,u,b]=r.split("-").map(Number),y=Ft(new Date(i,m-1,n,9,0,0,0)),$=Ft(new Date(l,u-1,b,17,0,0,0));return{start:y,end:$}}function Fn(e,t){const a=ia(e);let r=t?ia(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const i=new Date(t);if(!Number.isNaN(i.getTime())&&i.getHours()===0&&i.getMinutes()===0&&i.getTime()>new Date(e).getTime()){const m=As(t);m.setDate(m.getDate()-1),r=be(m)}}return{start:a,end:r}}async function Ze(){const e=K.filter(r=>ne.some(i=>i.id===r));if(e.length===0){ta=[];return}const{from:t,to:a}=Un(It.y,It.m);ys=!0,N.debug("loadMonthEvents",{selectedIds:e,from:t,to:a});try{const i=(await Promise.all(e.map(async m=>(await A.calendarEvents(m,t,a)).events.map(l=>({...l,instanceId:m}))))).flat();i.sort((m,n)=>{const l=m.start||"",u=n.start||"";return l!==u?l<u?-1:1:(m.summary||"").localeCompare(n.summary||"")}),ta=i,N.event("monthEvents.loaded",{calendarIds:e,count:ta.length,from:t,to:a})}catch(r){ta=[],N.warn("loadMonthEvents failed",r instanceof Error?r.message:r)}finally{ys=!1}}function Mn(e){const t=ne.find(a=>a.id===e);return t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6"}function Rn(e){K.includes(e)?(K=K.filter(t=>t!==e),F===e&&(F=K[0]??null)):(K=[...K,e],F=e)}function Vn(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Bn(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Ns())} ${t}`}function zn(){const e=ne.filter(T=>K.includes(T.id)),t=e.length===0?"No calendar selected":e.length===1?e[0].displayname:`${e.length} calendars`,a=It.y,r=It.m,i=new Date(a,r,1),m=xs(),n=(i.getDay()-m+7)%7,l=new Date(a,r+1,0).getDate(),u=new Date(a,r,0).getDate(),y=be(new Date),$=Gs(),v=new Map;for(const T of ta)for(const Y of Pn(T)){const H=v.get(Y)??[];H.push(T),v.set(Y,H)}const x=[],D=Math.ceil((n+l)/7)*7;for(let T=0;T<D;T++){let Y,H=!0,G;T<n?(Y=u-n+T+1,H=!1,G=new Date(a,r-1,Y)):T>=n+l?(Y=T-(n+l)+1,H=!1,G=new Date(a,r+1,Y)):(Y=T-n+1,G=new Date(a,r,Y));const me=be(G),Ae=me===y,Te=H?v.get(me)??[]:[],wt=_a===me?50:3,ut=Te.slice(0,wt),Et=Te.length-ut.length,Be=ut.map(J=>{var le;const et=J.instanceId,_e=Bn(J),tt=Mn(et),ua=((le=ne.find(at=>at.id===et))==null?void 0:le.displayname)||"",S=ua?`${_e} · ${ua}`:_e;return`<button type="button" class="month-event${J.allDay?"":" is-timed"}" title="${o(S)}" style="--ev-color:${o(tt)}"
            data-action="open-event" data-instance="${et}" data-uri="${o(J.uri)}" ${d?"disabled":""}>${o(_e)}</button>`}).join(""),jt=Et>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${o(me)}" title="Show all events this day" ${d?"disabled":""}>+${Et} more</button>`:"",Ht=!H&&(Y===1||T===n+l)?G.toLocaleString(void 0,{month:"short",day:"numeric"}):String(Y),C=F!==null?ne.find(J=>J.id===F)??null:null,ie=!!(C&&!C.readOnly&&(C.canShare||C.access==="readwrite"));x.push(`<div class="month-cell${H?"":" is-outside"}${Ae?" is-today":""}${ie?" is-clickable":""}"${ie?` data-action="new-event-day" data-day="${o(me)}" role="button" tabindex="0" title="Add event on ${o(me)}"`:""}>
        <div class="month-daynum${Ae?" is-today-num":""}">${o(Ht)}</div>
        <div class="month-events">${Be}${jt}</div>
      </div>`)}const L=e.length===0?ne.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":ys?'<p class="muted small month-empty-hint">Loading events…</p>':"",ae=e.slice(0,6).map(T=>{const Y=T.color&&T.color.length>=7?T.color.slice(0,7):T.color||"#3B82F6";return`<span class="cal-swatch" style="background:${o(Y)};margin-top:0" title="${o(T.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${d?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${d?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${d?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${o(Vn(a,r))}</h2>
        <span class="month-cal-name muted small" title="${o(t)}">
          ${ae}
          ${o(t)}
        </span>
      </div>
      ${L}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${$.map(T=>`<div class="month-dow">${o(T)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${x.join("")}
        </div>
      </div>
    </section>`}function ia(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):be(t)}function jn(){if(ya.timeFormat==="24h")return!1;if(ya.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Ns(){return jn()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function xs(){var a;if(ya.weekStart==="monday")return 1;if(ya.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const r of e)try{const i=new Intl.Locale(r),m=typeof i.getWeekInfo=="function"?i.getWeekInfo():i.weekInfo,n=m==null?void 0:m.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Gs(){const e=xs(),t=new Date(2024,0,7+e),a=[];for(let r=0;r<7;r++){const i=new Date(t);i.setDate(t.getDate()+r),a.push(i.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Qs(e,t=15){const a=t*60*1e3,r=e.getTime();return r%a===0?new Date(r):new Date(Math.ceil(r/a)*a)}function Ft(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Hn(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const r=e.slice(0,10),[i,m,n]=r.split("-").map(Number);return new Date(i,m-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Ns()})}function Ua(e){if(!e){const a=Qs(new Date);return{date:be(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:be(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Pa(e){const t=new Date,a=be(t);if(e&&e!==a){const[m,n,l]=e.split("-").map(Number),u=new Date(m,n-1,l,9,0,0,0),b=new Date(m,n-1,l,10,0,0,0);return{start:Ft(u),end:Ft(b)}}const r=Qs(t,15),i=new Date(r.getTime()+3600*1e3);return{start:Ft(r),end:Ft(i)}}function Wn(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function oa(e){const{field:t,name:a,label:r,value:i,dateOnly:m=!1,required:n,disabled:l,allowClear:u=!0}=e,b=(O==null?void 0:O.field)===t,y=Hn(i,m);return`<div class="dt-field${b?" is-open":""}" data-dt-id="${o(t)}">
      <span class="dt-field-label">${o(r)}</span>
      <input type="hidden" name="${o(a)}" value="${o(i)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${o(t)}"
        data-dt-name="${o(a)}" data-dt-date-only="${m?"1":"0"}" data-dt-clear="${u?"1":"0"}"
        ${l?"disabled":""} aria-expanded="${b}">
        <span class="dt-trigger-text">${o(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${b&&!l?Jn(t,i,m,u):""}
    </div>`}function Ts(e){var t;return e==="start"?String((k==null?void 0:k.start)||""):e==="end"?String((k==null?void 0:k.end)||""):e==="until"?((t=k==null?void 0:k.repeat)==null?void 0:t.until)||ia(k==null?void 0:k.start)||be(new Date):e==="due"?Da(j==null?void 0:j.due):e==="dtstart"?Da(re==null?void 0:re.dtstart):e==="bulk-due"?Ya:e==="birthday"?String((I==null?void 0:I.birthday)||""):""}function ct(e,t){if(e==="start"&&k){k={...k,start:t||""};return}if(e==="end"&&k){k={...k,end:t};return}if(e==="until"&&k){k={...k,repeat:{...k.repeat??rs(),until:t,endMode:"until"}};return}if(e==="due"&&j){if(t===null||t==="")j={...j,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))j={...j,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));j={...j,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&re){if(t===null||t==="")re={...re,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))re={...re,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));re={...re,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&I){I={...I,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Ya=t||"")}function Jn(e,t,a,r){const i=Ua(t),m=(O==null?void 0:O.viewY)??Number(i.date.slice(0,4)),n=(O==null?void 0:O.viewM)??Number(i.date.slice(5,7))-1,l=xs(),u=Gs(),y=(new Date(m,n,1).getDay()-l+7)%7,$=new Date(m,n+1,0).getDate(),v=new Date(m,n,0).getDate(),x=i.date,D=i.hm,L=new Date(m,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),ae=[],T=Math.ceil((y+$)/7)*7;for(let H=0;H<T;H++){let G,me,Ae=!1;H<y?(G=v-y+H+1,me=new Date(m,n-1,G),Ae=!0):H>=y+$?(G=H-(y+$)+1,me=new Date(m,n+1,G),Ae=!0):(G=H-y+1,me=new Date(m,n,G));const Te=be(me),wt=Te===x,ut=Te===be(new Date);ae.push(`<button type="button" class="dt-day${Ae?" is-outside":""}${wt?" is-selected":""}${ut?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${o(Te)}">${G}</button>`)}const Y=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Wn().map(H=>{const G=(()=>{const[me,Ae]=H.split(":").map(Number);return new Date(2e3,0,1,me,Ae).toLocaleTimeString(void 0,Ns())})();return`<button type="button" class="dt-time${H===D?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${H}" role="option" aria-selected="${H===D}">${o(G)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${o(L)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(H=>`<span class="dt-dow">${o(H)}</span>`).join("")}</div>
          <div class="dt-days">${ae.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${o(e)}" ${r?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${Y}
      </div>
    </div>`}function Yn(){s.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const r=t.getBoundingClientRect(),i=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const m=a.offsetWidth||320,n=a.offsetHeight||300;let l=r.bottom+6;l+n>window.innerHeight-i&&(l=Math.max(i,r.top-n-6));let u=r.left;u+m>window.innerWidth-i&&(u=Math.max(i,window.innerWidth-m-i)),u<i&&(u=i),a.style.top=`${Math.round(l)}px`,a.style.left=`${Math.round(u)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function rs(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Kn(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Gn(){if(!$t||!k)return"";const e=k,t=e.repeat??rs(),a=(t.freq||"").toUpperCase(),r=ne.filter(x=>x.canShare||x.access==="readwrite"),i=ne.filter(x=>x.id===e.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===e.instanceId?"selected":""}>${o(x.displayname)}</option>`).join(""),m=e.readOnly||!e.canWrite;let n,l;if(e.allDay)n=ia(e.start),l=ia(e.end);else{const x=e.start||"",D=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const L=Es(x,D||null);n=L.start,l=L.end||""}else n=Da(e.start),l=Da(e.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],b=new Set((t.byDay||[]).map(x=>x.toUpperCase())),y=Kn(t),$=!!a&&y==="until",v=t.until||(y==="until"?ia(e.start)||be(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${rt?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Bt()}
          ${!rt&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${m?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${m||r.length===0?"disabled":""}>
                ${i||`<option value="${e.instanceId}">${o(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${o(e.summary)}" ${m?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${o(e.location)}" ${m?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${m?"readonly":""}>${o(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${m?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${oa({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:m,allowClear:!1})}
              ${oa({field:"end",name:"end",label:"End",value:l,dateOnly:e.allDay,disabled:m||$,allowClear:!$})}
            </div>
            <fieldset class="event-repeat" ${m?"disabled":""}>
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${o(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${u.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${b.has(x.code)?"checked":""} />
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
                      ${y==="until"?oa({field:"until",name:"repeatUntil",label:"Until",value:v,dateOnly:!0,disabled:m,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${o(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${m?"":`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${rt?"Create event":"Save event"}</button>
                     ${rt?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${d?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Qn(e,t){const a=ne.find(r=>r.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:rs(),readOnly:!1,canWrite:!0}}async function Mt(e){kt=(await A.contacts(e,aa)).contacts,de!==null&&!kt.some(a=>a.uri===de)&&(de=null,pe||(I=null,Ee=null,He=null,Ke=!1))}async function Rt(){const e=await A.tasks({q:ss,sort:Pt,order:Ct});Ne=e.tasks,Ot=e.calendars;const t=new Set(Ne.map(a=>ue(a.instanceId,a.uri)));he=he.filter(a=>t.has(a)),Pe!==null&&!Ne.some(a=>`${a.instanceId}|${a.uri}`===Pe)&&(Pe=null,X||(j=null))}async function Sa(){const e=await A.notes({q:ns,sort:wa,order:la});va=e.notes,Ut=e.calendars,it!==null&&!va.some(t=>`${t.instanceId}|${t.uri}`===it)&&(it=null,we||(re=null))}function ue(e,t){return`${e}|${t}`}function Xs(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Da(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=r=>String(r).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Vt(e,t,a,r,i,m=""){const n=a===t,l=n?r==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${m?" "+m:""}`}" data-action="sort-${i}" data-sort="${o(t)}" role="columnheader" tabindex="0">${o(e)}${l}</th>`}async function Xn(e){if(V===null)return;const t=await A.getContact(V,e);de=e,pe=!1;const a=t.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??Zs(),birthday:a.birthday??null},Ee=a.photoDataUri??(a.hasPhoto&&V!==null?`${A.contactPhotoUrl(V,e)}?t=${Date.now()}`:null),He=null,Ke=!1,Se=!0}function Zn(){pe=!0,de=null,Se=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Ee=null,He=null,Ke=!1}function Zs(){return{street:"",city:"",region:"",postal:"",country:""}}function er(e){return new Promise((t,a)=>{const r=new FileReader;r.onload=()=>{const i=String(r.result??""),m=i.indexOf(",");t(m>=0?i.slice(m+1):i)},r.onerror=()=>a(new Error("Failed to read photo file")),r.readAsDataURL(e)})}function en(e,t={}){const a=!!c&&h==="admin"&&ve()&&qt(),m=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${o(a?"Administration Portal":"User Portal")}</span></span>`,n=c?o(c.displayname||c.username):"",l=qt()?`<button type="button" class="user-menu-item${h==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",b=c?`<div class="user-menu${Oe?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${Oe?"true":"false"}"
              title="${n}">
              <span class="user-menu-name">${n}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${Oe?"":"hidden"}>
              ${a?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:""}
              ${l}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",y=c?`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
          <div class="topnav-right">
            ${b}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
        </nav>`,v=!(ge||Me||Re!==null||Ye!==null||$t||Se||lt)?Bt():"",x=t.tabs&&t.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${t.tabs}
        </div>
      </div>`:"",D=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${o(sa)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${o(dl)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${y}
      ${x}
    </div>
      <main class="container">
        ${v}
        ${e}
      </main>
      ${D}
      ${fl()}
      ${tr()}`}function Bt(){return g?ma(g.type,g.message,{dismissible:!0}):""}function tn(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Ca(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),r=t%60;return a>0?`${a}m ${r}s`:`${r}s`}function vt(){Ka!==null&&(clearInterval(Ka),Ka=null)}function an(){vt(),Ka=setInterval(()=>{if(!z||z.phase==="done"||z.phase==="error"){vt();return}z={...z,elapsedSec:Math.floor((Date.now()-z.startedAt)/1e3)},z.phase==="processing"&&rn(z)},1e3)}function zt(e,t={}){z&&(z={...z,phase:e,elapsedSec:Math.floor((Date.now()-z.startedAt)/1e3),...t},p())}function sn(){vt(),z=null,p()}function nn(e){!z||z.phase==="done"||z.phase==="error"||(z={...z,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-z.startedAt)/1e3)},rn(z))}function rn(e){const t=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),r=s.querySelector(".import-progress-track"),i=s.querySelector("[data-import-counts]"),m=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${m} (${e.processPercent??0}%) · ${Ca(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${Ca(e.elapsedSec)}`;else return;t&&(t.textContent=n),i&&(i.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),r&&e.processPercent!==null&&(r.setAttribute("aria-valuenow",String(e.processPercent)),r.removeAttribute("aria-valuetext"))}function tr(){if(!z)return"";const e=z,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",r=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",i=(()=>{const l=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],b={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return l.map((y,$)=>{let v="pending";return e.phase==="done"||$<b?v="done":$===b&&(v=(e.phase==="error","active")),`<li class="import-step import-step-${v}"><span class="import-step-icon" aria-hidden="true">${v==="done"?"✓":v==="active"?"●":"○"}</span> ${o(y.label)}</li>`}).join("")})();let m="";if(t){let l=null;e.phase==="reading"&&e.readPercent!==null?l=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(l=Math.min(100,Math.max(0,e.processPercent)));const u=l===null?"import-progress-bar is-indeterminate":"import-progress-bar",b=l!==null?` style="width:${l}%"`:"",y=e.kind==="calendar"?"items":"contacts";let $;e.phase==="reading"?$=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?$="Uploading to server…":e.processTotal>0?$=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${y} (${e.processPercent??0}%) · ${Ca(e.elapsedSec)}`:$=`Importing on server… ${Ca(e.elapsedSec)}`;const v=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';m=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${o(a)}</strong> from
          <span class="mono">${o(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${o(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${i}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${l!==null?`aria-valuenow="${l}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${u}"${b}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${o($)}</p>
        ${v}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?m=`
        ${ma("success",`Success. ${e.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${o(e.fileName)}</span>
          · Took ${o(Ca(e.elapsedSec))}
        </p>`:m=`
        ${ma("error",`Failed. ${e.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${o(e.fileName)}</span>
          · After ${o(Ca(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':wn([{label:"Close",action:"close-import-progress",variant:"primary"}]);return ke({title:r,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:t,lockBackdrop:t,body:m,footer:n})}function ln(e,t){return new Promise((a,r)=>{const i=new FileReader;i.onprogress=m=>{m.lengthComputable&&m.total>0?t(Math.min(100,Math.round(m.loaded/m.total*100))):t(null)},i.onload=()=>a(String(i.result??"")),i.onerror=()=>r(i.error??new Error("Failed to read file")),i.readAsText(e)})}function on(){const e=je,t=e&&(e.step==="upgrade"||e.step==="initialize"||e.step==="permissions"||e.step==="database"),a=(e==null?void 0:e.installUrl)||"/portal/install/";let r="";if(t&&e){const m=e.step==="upgrade"?"Server upgrade required":"Setup incomplete",n=e.step==="upgrade"&&(e.configuredVersion||e.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${o(String(e.configuredVersion||"—"))}</span>
              → product <span class="mono">${o(String(e.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${o(m)}.</strong>
            ${o(e.message||"Complete the installer before signing in.")}
            ${n}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${o(a)}">Open installer</a>
        </p>`}const i=d||!!t;s.innerHTML=en(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials (not the admin password).</p>
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
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function ar(){if(!c){on();return}const e=ne.filter(S=>S.canShare),t=ne.filter(S=>!S.canShare),a=ne.find(S=>S.id===F)??null,r=e.map(S=>{const le=K.includes(S.id),at=le?" is-selected":"",Ba=S.id===F?" is-primary":"",Is=S.color?`<span class="cal-swatch" style="background:${o(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',qs=Os(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${o(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${at}${Ba}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${le?"checked":""} ${d?"disabled":""} />
          </label>
          ${Is}
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="cal-row-badges">${qs}</span>
            <span class="muted small mono cal-row-uri">${o(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),i=t.map(S=>{const le=K.includes(S.id),at=le?" is-selected":"",Ba=S.id===F?" is-primary":"",Is=S.color?`<span class="cal-swatch" style="background:${o(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',qs=S.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${at}${Ba}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${o(qs)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${le?"checked":""} ${d?"disabled":""} />
          </label>
          ${Is}
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="cal-row-badges">${Os(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
          </span>
        </div>`}).join(""),m=Zt.map(S=>`<option value="${o(S.username)}">${o(S.displayname)} (${o(S.username)})</option>`).join(""),n=ea.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':ea.map(S=>`<tr>
                <td>
                  <strong>${o(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${o(S.username||S.href)}</div>
                </td>
                <td>${Os(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${o(S.href)}" ${d?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),l=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",u=!!(a&&a.readOnly),b=ge&&a&&a.canShare?ke({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Bt()}
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
                        <input type="color" name="color_picker" value="${o(l)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${o(a.color||l)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${o(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${o(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${ye(`Share “${a.displayname}”`,"share")}
                  ${u?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${Zt.length===0?"disabled":""}>
                        <option value="">${Zt.length?"Select user…":"No other users"}</option>
                        ${m}
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
                      <button type="submit" class="btn btn-primary" ${d||Zt.length===0?"disabled":""}>Share</button>
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
                  ${ye("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${d?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${d||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${d||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",y=Re!==null?ne.find(S=>S.id===Re&&S.canShare)??null:null,$=y?ke({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Bt()}
              <p>You are about to permanently delete <strong>${o(y.displayname)}</strong>
                <span class="muted small mono">(${o(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${ds({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${y.id}"`}]}):"",v=Me?ke({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Bt()}
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
                    ${Ja.map(S=>`<option value="${o(S.code)}">${o(S.name)} (${o(S.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Create calendar</button>
                  <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${d?"disabled":""} hidden />
                  </label>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${d?"disabled":""}>Cancel</button>
                </div>
                <p class="muted small" style="margin:0.5rem 0 0">
                  <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
                </p>
              </form>`}):"",x=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ye("Owned","owned")}
            </div>
            <p class="muted small" style="margin:0 0 0.65rem">
              Check one or more calendars to view events.
              Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${r||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${ye("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${i}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${d?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${zn()}
      </div>
      ${v}
      ${b}
      ${$}
      ${Gn()}`,D=Ue.map(S=>`<div class="cal-row${S.id===V?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${o(S.displayname)}</span>
            <span class="muted small">${S.cardCount} contact${S.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${o(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-ab" data-id="${S.id}" ${d?"disabled":""} title="Export as .vcf">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),L=Ue.find(S=>S.id===V)??null,ae=kt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${aa?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:kt.map(S=>{const le=!pe&&S.uri===de?" is-selected":"",at=o((S.displayname||"?").slice(0,1).toUpperCase()),Ba=S.hasPhoto&&V!==null?`<img class="contact-avatar" src="${o(A.contactPhotoUrl(V,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${at}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${at}</span>`;return`<tr class="contact-table-row${le}" data-action="select-contact" data-uri="${o(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ba}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${o(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${o(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${o(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${o(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${o(S.org||"—")}</span></td>
              </tr>`}).join(""),T=I,Y=Array.isArray(T==null?void 0:T.emails)&&T.emails.length>0?T.emails:[""],H=Array.isArray(T==null?void 0:T.phones)&&T.phones.length>0?T.phones:[{type:"cell",value:""}],G=(T==null?void 0:T.address)??Zs(),me=Y.map((S,le)=>`<div class="multi-row" data-multi="email" data-idx="${le}">
          <input type="email" name="email_${le}" value="${o(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${le}" ${Y.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Ae=H.map((S,le)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${le}">
          <select name="phone_type_${le}" aria-label="Phone type">
            ${["cell","work","home","other"].map(at=>`<option value="${at}" ${((S==null?void 0:S.type)??"other")===at?"selected":""}>${at}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${le}" value="${o((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${le}" ${H.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Te=Array.isArray(T==null?void 0:T.custom)?T.custom:[],wt=Te.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':Te.map((S,le)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${le}">
                <input type="text" name="custom_label_${le}" value="${o(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${le}" value="${o(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${le}" title="Remove">×</button>
              </div>`).join(""),ut=Se&&T&&L?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${pe?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Bt()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${Ee?`<img src="${o(Ee)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${o((T.fullname||T.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        ${Ee?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${d?"disabled":""} hidden />
                      </label>
                      ${Ee||T.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${d?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${o(T.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${o(T.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${o(T.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${o(T.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${o(T.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${me}
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
                      <input type="text" name="street" value="${o(G.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${o(G.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${o(G.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${o(G.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${o(G.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${o(T.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${oa({field:"birthday",name:"birthday",label:"Birthday",value:T.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${wt}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${Te.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${o(T.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${d?"disabled":""}>${pe?"Create contact":"Save contact"}</button>
                    ${!pe&&T.uri?`<button type="button" class="btn" data-action="export-contact" ${d?"disabled":""}>Export .vcf</button>`:""}
                    ${pe?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${d?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${d?"disabled":""}>Cancel</button>
                    ${!pe&&T.uri?`<span class="muted small mono">${o(T.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",Et=lt&&L?ke({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Bt()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${o(L.uri)} · ${L.cardCount} contact${L.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${o(L.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${o(L.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${o(L.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ye("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${d?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${d?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",Be=Ye!==null?Ue.find(S=>S.id===Ye)??null:null,jt=Be?ke({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Bt()}
              <p>You are about to permanently delete <strong>${o(Be.displayname)}</strong>
                <span class="muted small mono">(${o(Be.uri)})</span>.</p>
              <p class="muted small">${(Be.cardCount??0)>0?`All ${Be.cardCount} contact${Be.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${ds({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${Be.id}"`}]}):"",Ht=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ye("Address books","address-books")}
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
                <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${L?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${ye("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${o(aa)}" aria-label="Search contacts" ${d?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${d?"disabled":""}>Add contact</button>
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
                        ${ae}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${jt}
      ${Et}
      ${ut}`,C=h==="calendars"?"my-calendars":h==="contacts"?"my-contacts":h==="tasks"?"tasks":h==="notes"?"notes":h==="files"?"files":"administration",ie=kr(),J=Sr(),et=rr(),_e=yr(),tt=h==="calendars"?x:h==="contacts"?Ht:h==="tasks"?ie:h==="notes"?J:h==="files"?et:_e,ua=h==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${lr()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${w==="overview"?"admin-overview":w==="users"?"admin-users":w==="settings"?"admin-settings":"admin-database"}"
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
            data-info="${C}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;s.innerHTML=en(tt,{tabs:ua}),document.body.classList.toggle("cal-modal-open",ge||Me||Re!==null||Ye!==null||$t||Se||lt||z!==null||Fe!==null||Ce!==null||fe!==null||dt||ze||Le||gt!==null||fa||ba||We!==null||nt!==null||$e!==null),document.body.classList.toggle("layout-contacts",h==="contacts"),document.body.classList.toggle("layout-calendars",h==="calendars"),document.body.classList.toggle("layout-tasks",h==="tasks"||h==="notes"),document.body.classList.toggle("layout-files",h==="files"),document.body.classList.toggle("layout-admin",h==="admin")}function sr(e){const t=e?e.split("/").filter(Boolean):[];let a="";const r=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${d?"disabled":""}>Home</button>`];for(const i of t){a=a?`${a}/${i}`:i;const m=a;r.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),r.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${o(m)}" ${d?"disabled":""}>${o(i)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${r.join("")}</nav>`}function Aa(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function nr(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function rr(){const e=Cs;if(!e)return`<div class="card"><p class="muted">${ka||d?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ye("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ye("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${o(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${o(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${Aa(e.usedBytes)} used · ${Aa(e.availableBytes)} free of ${Aa(e.quotaBytes)}`:`${Aa(e.usedBytes)} used · ${Aa(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,r=ce.length,i=xe.length>0&&xe.every(v=>ce.includes(v.path)),m=r>0,n=r>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${r} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${d?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${d?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${d?"disabled":""}>Delete</button>
            </div>
          </div>`:"",l=xe.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':xe.map(v=>{const x=ce.includes(v.path),D=v.type==="dir"?"📁":"📄",L=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${o(v.path)}" ${d?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${D}</span>${o(v.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${D}</span>${o(v.name)}</span>`,ae=v.type==="dir"?"—":Aa(v.size);return`<tr class="files-row${x?" is-checked":""}" data-path="${o(v.path)}" data-type="${v.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${o(v.path)}"
                    ${x?"checked":""} ${d?"disabled":""}
                    aria-label="Select ${o(v.name)}" />
                </td>
                <td class="files-col-name">${L}</td>
                <td class="files-col-size mono">${ae}</td>
                <td class="files-col-mtime hide-sm">${o(nr(v.mtime))}</td>
                <td class="files-col-actions">
                  ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${o(A.filesDownloadUrl(v.path))}" download="${o(v.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${o(v.path)}" ${d?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${o(v.path)}" ${d?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${o(v.path)}" data-name="${o(v.name)}" ${d?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${o(v.path)}" data-name="${o(v.name)}" ${d?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),u=Fe!==null?(()=>{const v=xe.find(D=>D.path===Fe),x=(v==null?void 0:v.name)??"";return ke({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${o(Fe)}" />
                    <label>New name
                      <input type="text" name="newName" value="${o(x)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:d}]})})():"",b=Ce!==null&&Ce.length>0?(()=>{const v=Ce,x=v.length>1,D=xe.find(T=>T.path===v[0]),L=x?`Delete ${v.length} items`:`Delete ${(D==null?void 0:D.type)==="dir"?"folder":"file"}`,ae=x?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${v.slice(0,12).map(T=>{const Y=xe.find(H=>H.path===T);return`<li><span class="mono">${o((Y==null?void 0:Y.name)??T)}</span></li>`}).join("")}
                   ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${o((D==null?void 0:D.name)??v[0])}</strong>?${(D==null?void 0:D.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return ke({id:"files-delete-modal",title:L,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:ae,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:d}]})})():"",y=fe!==null&&fe.paths.length>0?(()=>{const v=fe.op,x=fe.paths,D=x.length>1,L=xe.find(G=>G.path===x[0]),ae=(L==null?void 0:L.name)??Fa(x[0]),T=D?`${v==="copy"?"Copy":"Move"} ${x.length} items`:`${v==="copy"?"Copy":"Move"} ${(L==null?void 0:L.type)==="dir"?"folder":"file"}`,Y=At===""?"Home":At,H=ts(At,x);return ke({id:"files-transfer-modal",title:T,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${D?`<p class="muted small" style="margin:0 0 0.75rem">${x.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${o(ae)}</span></p>`}
                    <input type="hidden" name="toPath" value="${o(At)}" />
                    <div class="files-transfer-dest">
                      <div class="files-transfer-dest-head">
                        <span class="files-transfer-dest-label">Destination folder</span>
                        <span class="muted small mono files-transfer-dest-value" title="${o(Y)}">${o(Y)}</span>
                      </div>
                      ${In()}
                      <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                        Click a folder to select it. Use ▸ to expand. Home is the root of your file storage.
                      </p>
                    </div>
                    ${D?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${o(ae)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${v==="copy"?"Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination).":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:v==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:d||H}]})})():"",$=dt?ke({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${o(De===""?"Home":De)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:d}]}):"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${ye("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${o(t)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${sr(De)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${d||ka?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${d?"disabled":""}>New folder</button>
            <label class="btn btn-primary btn-small files-upload-btn" ${d?"aria-disabled=true":""}>
              Upload
              <input type="file" data-action="files-upload" ${d?"disabled":""} multiple hidden />
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
                    ${i?"checked":""}
                    ${m&&!i?"data-indeterminate=1":""}
                    ${d||xe.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ka&&xe.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':l}
            </tbody>
          </table>
        </div>
      </section>
      ${u}
      ${b}
      ${y}
      ${$}
    </div>`}function Fa(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function lr(){const e=["overview","settings","users","database"],t={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=W==null?void 0:W.pages,r=new Map;if(a)for(const i of a)bs(i.id)&&r.set(i.id,i);return e.map(i=>{const m=r.get(i),n=(m==null?void 0:m.label)||t[i],l=(m==null?void 0:m.status)??(i==="overview"?"read-only":"full"),u=(m==null?void 0:m.available)===!1;return`<button type="button" role="tab" class="tab-btn${w===i?" is-active":""}${u?" is-gated":""}"
            data-action="admin-page" data-admin-page="${i}"
            aria-selected="${w===i}"
            title="${o(n)}${u?" — "+$a(l):""}">
            ${o(n)}
          </button>`}).join("")}function ls(e){const t=Ve(e),a=(t==null?void 0:t.status)??"coming-soon",r=(t==null?void 0:t.label)??e,i=(t==null?void 0:t.summary)||"This area is not available in portal Administration yet.",m=$a(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${qa(a)}">${o(m)}</span>
        <h2 class="admin-coming-soon-title">${o(r)}</h2>
      </div>
      <p class="muted">${o(i)}</p>
    </section>`}function da(e,t){return`<span class="badge ${e?"badge-ok":"badge-off"}">${o(t)}: ${e?"On":"Off"}</span>`}function ca(e){return`<span class="badge ${e?"badge-ok":"badge-off"}">${e?"On":"Off"}</span>`}function Ma(e,t,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${o(String(t))}</div>
      <div class="admin-stat-label">${o(e)}</div>
      ${a?`<div class="admin-stat-hint muted small">${o(a)}</div>`:""}
    </div>`}function ir(){const e=Ve("overview");if(e&&e.available===!1)return ls("overview");const t=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${o((c==null?void 0:c.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",r="";if(U&&!q)r='<section class="card"><p class="muted">Loading overview…</p></section>';else if(M&&!q)r=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${o(M)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d?"disabled":""}>Retry</button>
      </section>`;else if(q){const i=q,m=i.services,n=i.links??{},l=e?`<span class="badge ${qa(e.status)}">${o($a(e.status))}</span>`:"",u=i.version?o(i.version):"—",b=i.git?o(i.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${ye("About this system","admin-overview")}
            <div class="section-actions">
              ${l}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d||U?"disabled":""}>Refresh</button>
            </div>
          </div>
          <div class="admin-about-grid">
            <div>
              <h3 class="admin-subsection-title">Version</h3>
              <p>
                AngaraDAV <span class="badge badge-admin">v${u}</span>
                ${b?`<span class="mono muted small"> (${b})</span>`:""}
              </p>
              <p class="muted small admin-link-row">
                ${n.releases?`<a href="${o(n.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
                ${n.docs?`${n.releases?'<span class="footer-sep">·</span>':""}<a href="${o(n.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
              </p>
            </div>
            <div>
              <h3 class="admin-subsection-title">Services</h3>
              <div class="admin-service-table-wrap">
                <table class="admin-kv-table">
                  <tbody>
                    <tr><td>Administration</td><td>${ca(m.administration!==!1&&m.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${ca(!!m.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${ca(!!m.carddav)}</td></tr>
                    <tr><td>Files</td><td>${ca(!!m.files)}</td></tr>
                    <tr><td>Tasks</td><td>${ca(!!m.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${ca(!!m.notes)}</td></tr>
                    <tr><td>Push</td><td>${ca(!!m.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${t}
        </section>`;const y=i.nbusers??i.users,$=i.nbcalendars??i.calendars,v=i.nbevents??i.events,x=i.nbbooks??i.addressBooks,D=i.nbcontacts??i.contacts;r=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${Ma("Registered users",y,"Users")}
            ${Ma("Calendars",$,"CalDAV")}
            ${Ma("Events",v,"CalDAV")}
            ${Ma("Address books",x,"CardDAV")}
            ${Ma("Contacts",D,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${da(m.administration!==!1&&m.webAdmin!==!1,"Administration")}
            ${da(!!m.caldav,"CalDAV")}
            ${da(!!m.carddav,"CardDAV")}
            ${da(!!m.files,"Files")}
            ${da(!!m.tasks,"Tasks")}
            ${da(!!m.notes,"Notes")}
            ${da(!!m.push,"Push")}
          </div>
        </section>`}else r=`<section class="card">
        ${ye("System snapshot","admin-overview")}
        ${t}
      </section>`;return`${a}
      ${r}`}function or(){const e=bt.trim().toLowerCase();return e?oe.filter(t=>t.username.toLowerCase().includes(e)||(t.displayname||"").toLowerCase().includes(e)||(t.email||"").toLowerCase().includes(e)):oe}function dr(){return ze?ke({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
          <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
            <label>Username
              <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${d?"disabled":""} />
            </label>
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="password" required autocomplete="new-password" ${d?"disabled":""} />
            </label>
            <label>Confirm password
              <input type="password" name="passwordConfirm" required autocomplete="new-password" ${d?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:d},{label:"Create user",type:"submit",variant:"primary",disabled:d}]}):""}function cr(){if(!Le||!R)return"";const e=R;return ke({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
          <p class="muted small">Username <span class="mono">${o(e.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${o(e.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${o(e.displayname)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${o(e.email)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${d?"disabled":""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${d?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:d},{label:"Save changes",type:"submit",variant:"primary",disabled:d}]})}function ur(){if(!gt)return"";const e=gt,t=R&&R.username.toLowerCase()===e.toLowerCase()?R:oe.find(r=>r.username.toLowerCase()===e.toLowerCase())??null,a=t?`${t.displayname||t.username} (${t.username})`:e;return ke({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${o(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${ds({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:xt,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:d},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:d||!xt,attrs:`data-username="${o(e)}"`}]})}function mr(){if(!B)return"";if(Q&&!R)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${o(B)}</span>…</p>
      </section>`;if(qe&&!R)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${o(qe)}</p>
      </section>`;if(!R)return"";const e=R,t=Na&&Tt.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':Tt.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':Tt.map(u=>`<tr>
          <td class="mono">${o(u.uri)}</td>
          <td>${o(u.displayname)}</td>
          <td class="hide-sm">${o(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${o(u.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${o(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=Na&&_t.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':_t.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':_t.map(u=>`<tr>
          <td class="mono">${o(u.uri)}</td>
          <td>${o(u.displayname)}</td>
          <td class="hide-sm">${o(String(u.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${o(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),r=Yt!==null?Tt.find(u=>u.instanceId===Yt)??null:null,i=Kt!==null?_t.find(u=>u.id===Kt)??null:null,m=We==="create"||We==="edit"&&r?ke({title:We==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${r?r.instanceId:""}" />
            ${We==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${d?"disabled":""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`:`<p class="muted small">URI <span class="mono">${o(r.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${o((r==null?void 0:r.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${o((r==null?void 0:r.description)??"")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${o((r==null?void 0:r.calendarcolor)??"")}" ${d?"disabled":""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${r!=null&&r.todos||We==="create"?"checked":""} ${d?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${r!=null&&r.notes?"checked":""} ${d?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",n=nt==="create"||nt==="edit"&&i?ke({title:nt==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${i?i.id:""}" />
            ${nt==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${d?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${o(i.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${o((i==null?void 0:i.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${o((i==null?void 0:i.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",l=$e?ke({title:`Delete ${$e.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${o($e.label)}</strong> for <span class="mono">${o(e.username)}</span>?</p>
          ${$e.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${$e.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:d}]}):"";return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${o(e.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${o(e.username)}" ${d?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${o(e.username)}" ${d?"disabled":""}>Delete</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
      </div>
      <p class="muted small admin-breadcrumb">Users → <span class="mono">${o(e.username)}</span></p>
      <dl class="admin-dl">
        <div><dt>Username</dt><dd class="mono">${o(e.username)}</dd></div>
        <div><dt>Display name</dt><dd>${o(e.displayname||"—")}</dd></div>
        <div><dt>Email</dt><dd>${e.email?`<a href="mailto:${o(e.email)}">${o(e.email)}</a>`:"—"}</dd></div>
        <div><dt>Principal</dt><dd class="mono">${o(e.principal)}</dd></div>
        <div><dt>Calendars</dt><dd>${o(String(e.calendarCount))}</dd></div>
        <div><dt>Events / objects</dt><dd>${o(String(e.eventCount))}</dd></div>
        <div><dt>Address books</dt><dd>${o(String(e.addressBookCount))}</dd></div>
        <div><dt>Contacts</dt><dd>${o(String(e.contactCount))}</dd></div>
      </dl>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Calendars</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${d?"disabled":""}>Add calendar</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Address books</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${d?"disabled":""}>Add address book</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
          <tbody>${a}</tbody>
        </table>
      </div>
    </section>
    ${m}${n}${l}`}function pr(){const e=Ve("users");if(e&&e.available===!1)return ls("users");const t=or(),a=se&&oe.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':t.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${te?o(te):bt.trim()?"No users match this filter.":"No users found."}</td></tr>`:t.map(r=>`<tr class="contact-table-row${B&&B.toLowerCase()===r.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${o(r.username)}" tabindex="0" role="button">
                  <td class="mono">${o(r.username)}</td>
                  <td class="hide-sm">${o(r.displayname||"—")}</td>
                  <td class="hide-sm">${o(r.email||"—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${o(r.username)}" ${d?"disabled":""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${o(r.username)}" ${d?"disabled":""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${o(r.username)}" ${d?"disabled":""}>Delete</button>
                  </td>
                </tr>`).join("");return`
      <section class="card">
        <div class="section-header">
          ${ye("Users","admin-users")}
          <div class="section-actions">
            ${e?`<span class="badge ${qa(e.status)}">${o($a(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${d||se?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${d?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${o(bt)}" aria-label="Filter users" ${d?"disabled":""} />
          <span class="muted small">${o(String(t.length))}${bt.trim()?` / ${oe.length}`:""} user${t.length===1?"":"s"}</span>
        </div>
        ${te&&oe.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${o(te)}</p>`:""}
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
      ${mr()}
      ${dr()}
      ${cr()}
      ${ur()}`}function fr(){const e=Ve("settings");if(e&&e.available===!1)return ls("settings");if(Ha&&!Gt)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(xa&&!Gt)return`<section class="card">
        <p class="flash flash-error">${o(xa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const t=Gt;if(!t)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(i,m,n)=>`<label class="check-row"><input type="checkbox" name="${o(i)}" ${m?"checked":""} ${d||t.writable===!1?"disabled":""} /> ${o(n)}</label>`,r=(i,m,n,l="")=>`<label>${o(n)}
        <input type="number" name="${o(i)}" value="${o(String(m??0))}" ${d||t.writable===!1?"disabled":""} />
        ${l?`<span class="muted small">${o(l)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${ye("System settings","admin-settings")}
          <div class="section-actions">
            ${e?`<span class="badge ${qa(e.status)}">${o($a(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${d?"disabled":""}>Reload</button>
          </div>
        </div>
        <p class="muted small">
          Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
          <strong>session timeout</strong> affects portal idle sessions.
          ${t.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
        </p>
        <form class="stack admin-settings-form" data-form="admin-settings">
          <h3 class="admin-subsection-title">DAV services</h3>
          ${a("cal_enabled",!!t.cal_enabled,"Enable CalDAV")}
          ${a("card_enabled",!!t.card_enabled,"Enable CardDAV")}
          ${a("tasks_enabled",!!t.tasks_enabled,"Enable Tasks (VTODO)")}
          ${a("notes_enabled",!!t.notes_enabled,"Enable Notes (VJOURNAL)")}
          <label>WebDAV authentication type
            <select name="dav_auth_type" ${d||t.writable===!1?"disabled":""}>
              ${["Digest","Basic","Apache"].map(i=>`<option value="${i}" ${t.dav_auth_type===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${d||t.writable===!1?"disabled":""}>
              ${vn(t.timezone||"UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${o(t.invite_from||"")}" placeholder="noreply@example.com" ${d||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${a("files_enabled",!!t.files_enabled,"Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${o(t.files_storage_path||"")}" placeholder="empty = Specific/files" ${d||t.writable===!1?"disabled":""} />
          </label>
          ${r("files_max_upload_mb",t.files_max_upload_mb,"Max file size (MB)")}
          ${r("files_quota_mb",t.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${r("files_quarantine_days",t.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${r("session_max_age_minutes",t.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${d||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(t.portal_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>
          ${a("portal_admin_ui_enabled",t.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${o(Array.isArray(t.portal_admin_users)?t.portal_admin_users.join(", "):String(t.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${d||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${a("push_enabled",!!t.push_enabled,"Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${o(t.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${d||t.writable===!1?"disabled":""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${d||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(t.push_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
            </select>
          </label>

          <h3 class="admin-subsection-title">Server admin password</h3>
          <p class="muted small">
            Stored in <span class="mono">baikal.yaml</span> for install recovery.
            Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
            ${t.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
          </p>
          <label>New server admin password
            <input type="password" name="admin_password" autocomplete="new-password" ${d||t.writable===!1?"disabled":""} />
          </label>
          <label>Confirm server admin password
            <input type="password" name="admin_password_confirm" autocomplete="new-password" ${d||t.writable===!1?"disabled":""} />
          </label>

          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${d||t.writable===!1?"disabled":""}>Save settings</button>
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
          <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${d||t.writable===!1?"disabled":""}>
            Reset to Default
          </button>
        </div>
      </section>
      ${br()}`}function br(){return fa?ke({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${ds({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:ht,disabled:d,style:"admin"})}
          <label style="margin-top:1rem">Your portal password
            <input type="password" data-action="admin-reset-password" value="${o(Je)}"
              autocomplete="current-password" placeholder="Re-enter password to confirm" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:d},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:d||!ht||Je.trim()===""}]}):""}function gr(){const e=Ve("database");if(e&&e.available===!1)return ls("database");if(Wa&&!Qt)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(Ta&&!Qt)return`<section class="card">
        <p class="flash flash-error">${o(Ta)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const t=Qt;if(!t)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=Xt,r=t.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${ye("Database","admin-database")}
          <div class="section-actions">
            ${e?`<span class="badge ${qa(e.status)}">${o($a(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${d?"disabled":""}>Refresh</button>
          </div>
        </div>
        <p class="flash flash-info" style="margin-bottom:1rem">${o(t.warning)}</p>
        <dl class="admin-dl admin-dl-stack">
          <div>
            <dt>Current backend</dt>
            <dd><span class="badge badge-admin">${o((t.backend||"—").toUpperCase())}</span></dd>
          </div>
          ${t.backend==="sqlite"||t.sqlite_file?`<div>
            <dt>SQLite file</dt>
            <dd class="mono admin-dl-path">${o(t.sqlite_file||"—")}</dd>
          </div>`:""}
          ${t.backend==="pgsql"||t.pgsql_host?`<div>
            <dt>PostgreSQL</dt>
            <dd class="mono admin-dl-path">${o(t.pgsql_host||"—")} / ${o(t.pgsql_dbname||"—")} · ${o(t.pgsql_username||"—")}</dd>
          </div>
          <div>
            <dt>Password</dt>
            <dd>${t.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>`:""}
          <div>
            <dt>Encryption key</dt>
            <dd>${t.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
          </div>
        </dl>

        <h3 class="admin-subsection-title">Edit connection</h3>
        ${r?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
        <form class="stack admin-database-form" data-form="admin-database">
          <label>Backend
            <select name="backend" data-action="admin-db-backend" ${d||r?"disabled":""}>
              <option value="sqlite" ${a==="sqlite"?"selected":""}>SQLite</option>
              <option value="pgsql" ${a==="pgsql"?"selected":""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${a==="sqlite"?"":"display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${o(t.sqlite_file||"")}" ${d||r?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${o(t.pgsql_host||"")}" placeholder="localhost:5432" ${d||r?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${o(t.pgsql_dbname||"")}" ${d||r?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${o(t.pgsql_username||"")}" autocomplete="off" ${d||r?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${t.hasPassword?"Leave blank to keep current":""}" ${d||r?"disabled":""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${d||r?"disabled":""}>Test connection</button>
            <button type="submit" class="btn btn-primary" ${d||r?"disabled":""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${hr()}`}function hr(){if(!ba)return"";const e=yt.trim()==="CONFIRM";return ke({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${o(yt)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:d},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:d||!e}]})}function yr(){return ve()?qt()?w==="users"?pr():w==="settings"?fr():w==="database"?gr():ir():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function $r(e){const t=new Map;for(const b of e)b.uid&&t.set(b.uid,b);const a=new Map(e.map((b,y)=>[ue(b.instanceId,b.uri),y])),r=new Map,i=[];for(const b of e){const y=b.parentUid;if(y&&t.has(y)&&y!==b.uid){const $=r.get(y)??[];$.push(b),r.set(y,$)}else i.push(b)}const m=(b,y)=>(a.get(ue(b.instanceId,b.uri))??0)-(a.get(ue(y.instanceId,y.uri))??0);i.sort(m);for(const[,b]of r)b.sort(m);const n=[],l=new Set,u=(b,y)=>{const $=b.uid||ue(b.instanceId,b.uri);if(!l.has($)){l.add($),n.push({task:b,depth:Math.min(y,8)});for(const v of r.get(b.uid)??[])u(v,y+1);l.delete($)}};for(const b of i)u(b,0);for(const b of e)n.some(y=>y.task===b)||n.push({task:b,depth:0});return n}function vr(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const r of Ne)r.parentUid&&t.has(r.parentUid)&&r.uid&&!t.has(r.uid)&&(t.add(r.uid),a=!0)}return t}function wr(e,t){const a=e.instanceId,r=t||!e.uid?new Set:vr(e.uid),i=Ne.filter(l=>l.uid&&l.instanceId===a&&!r.has(l.uid)&&l.uid!==e.uid),m=e.parentUid||"",n=['<option value="">None (top-level)</option>',...i.map(l=>`<option value="${o(l.uid)}" ${l.uid===m?"selected":""}>${o(l.summary||l.uid)}</option>`)];if(m&&!i.some(l=>l.uid===m)){const l=Ne.find(u=>u.uid===m);n.push(`<option value="${o(m)}" selected>${o((l==null?void 0:l.summary)||m)} (current)</option>`)}return n.join("")}function dn(){const e=new Set(he);return Ne.filter(t=>e.has(ue(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function kr(){const e=D=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[D]||D,t=$r(Ne),a=Ne.filter(D=>D.canWrite&&!D.readOnly).map(D=>ue(D.instanceId,D.uri)),r=a.length>0&&a.every(D=>he.includes(D)),i=he.length>0,n=dn().length,l=Ne.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${ss?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:D,depth:L})=>{const ae=ue(D.instanceId,D.uri),T=!X&&ae===Pe?" is-selected":"",Y=he.includes(ae),H=D.status==="COMPLETED"?"badge-ok":D.status==="CANCELLED"?"":"badge-admin",G=L>0?` style="--task-depth:${L}"`:"",me=L>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",Ae=D.canWrite&&!D.readOnly;return`<tr class="contact-table-row task-row${L>0?" is-subtask":""}${T}${Y?" is-checked":""}" data-action="select-task" data-instance="${D.instanceId}" data-uri="${o(D.uri)}" tabindex="0" role="button"${G}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${D.instanceId}" data-uri="${o(D.uri)}"
                    ${Y?"checked":""} ${Ae?"":"disabled"} aria-label="Select ${o(D.summary||D.uri)}" ${d?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${me}<span class="contact-name-primary">${o(D.summary||D.uri)}</span></span>
                  ${D.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${H}">${o(e(D.status))}</span></td>
                <td class="col-task-due muted small">${o(Xs(D.due))}</td>
                <td class="col-task-cal muted small">${o(D.calendarName)}</td>
                <td class="col-task-pct muted small">${D.percent?o(String(D.percent))+"%":"—"}</td>
              </tr>`}).join(""),u=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,b=(D,L)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${D}"
        title="${o(L)}" aria-label="${o(L)}" ${d||n===0?"disabled":""}>${u}</button>`,y=i?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${he.length!==n?`<span class="muted small bulk-bar-count-extra">(${he.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${d||n===0?"disabled":""}>
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
                ${oa({field:"bulk-due",name:"bulkDue",label:"Due",value:Ya,dateOnly:!1,disabled:d||n===0,allowClear:!0})}
                ${b("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${d||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${d||n===0?"disabled":""} />
                </label>
                ${b("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${d||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${d?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",$=j,v=Ot.map(D=>`<option value="${D.id}" ${$&&$.instanceId===D.id?"selected":""}>${o(D.displayname)}</option>`).join(""),x=$?`<div class="card">
            ${ye(X?$.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${X?`<label>Calendar
                      <select name="instanceId" required ${Ot.length===0?"disabled":""}>
                        <option value="">${Ot.length?"Select calendar…":"No writable calendars"}</option>
                        ${v}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${o($.calendarName)}</strong>${$.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${o($.summary)}" ${$.readOnly&&!X?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${$.readOnly&&!X?"readonly":""}>${o($.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${$.readOnly&&!X?"disabled":""}>
                  ${wr($,X)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${$.readOnly&&!X?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(D=>`<option value="${D}" ${$.status===D?"selected":""}>${o(e(D))}</option>`).join("")}
                  </select>
                </label>
                ${oa({field:"due",name:"due",label:"Due",value:Da($.due),dateOnly:!1,disabled:!!($.readOnly&&!X),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${o(String($.priority||0))}" ${$.readOnly&&!X?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${o(String($.percent||0))}" ${$.readOnly&&!X?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${X||$.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${X?"Create task":"Save task"}</button>`:""}
                ${!X&&$.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${d?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${d?"disabled":""}>Delete</button>`:X?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ye("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${o(ss)}" aria-label="Search tasks" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${d||Ot.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${Ot.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${r?"checked":""} ${a.length===0||d?"disabled":""} />
                </th>
                ${Vt("Title","summary",Pt,Ct,"task","col-task-title")}
                ${Vt("Status","status",Pt,Ct,"task","col-task-status")}
                ${Vt("Due","due",Pt,Ct,"task","col-task-due")}
                ${Vt("Calendar","calendar",Pt,Ct,"task","col-task-cal")}
                ${Vt("%","percent",Pt,Ct,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function Sr(){const e=va.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${ns?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:va.map(i=>{const m=ue(i.instanceId,i.uri),n=!we&&m===it?" is-selected":"",l=(i.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${i.instanceId}" data-uri="${o(i.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${o(i.summary||i.uri)}</span>
                  ${l?`<span class="muted small contact-name-secondary">${o(l)}${i.description.length>80?"…":""}</span>`:""}
                  ${i.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${o(Xs(i.dtstart))}</td>
                <td class="col-note-cal muted small">${o(i.calendarName)}</td>
              </tr>`}).join(""),t=re,a=Ut.map(i=>`<option value="${i.id}" ${t&&t.instanceId===i.id?"selected":""}>${o(i.displayname)}</option>`).join(""),r=t?`<div class="card">
            ${ye(we?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${we?`<label>Calendar
                      <select name="instanceId" required ${Ut.length===0?"disabled":""}>
                        <option value="">${Ut.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${o(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${o(t.summary)}" ${t.readOnly&&!we?"readonly":""} />
              </label>
              ${oa({field:"dtstart",name:"dtstart",label:"Date",value:Da(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!we),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!we?"readonly":""}>${o(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${we||t.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${we?"Create note":"Save note"}</button>`:""}
                ${!we&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${d?"disabled":""}>Delete</button>`:we?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ye("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${o(ns)}" aria-label="Search notes" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${d||Ut.length===0?"disabled":""}>Add note</button>
        </div>
        ${Ut.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Vt("Title","summary",wa,la,"note","col-note-title")}
                ${Vt("Date","dtstart",wa,la,"note","col-note-date")}
                ${Vt("Calendar","calendar",wa,la,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${r}
      </section>
    </div>`}function Dr(){const e=s.querySelector(".contacts-table-wrap"),t=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function Cr(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=s.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=s.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=s.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function p(){const e=Dr();c?ar():on(),Ar(),Cr(e),requestAnimationFrame(()=>{var t;Yn(),(t=s.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function cn(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let r=a.value.trim();r&&!r.startsWith("#")&&(r=`#${r}`),/^#[0-9A-Fa-f]{6}/.test(r)&&(t.value=r.slice(0,7),a.value=r.toUpperCase())}))}function Ar(){s.querySelectorAll("[data-action]").forEach(C=>{C.addEventListener("click",ie=>{const J=ie.target.closest("[data-action]");((J==null?void 0:J.dataset.action)==="info"||(J==null?void 0:J.dataset.action)==="info-close")&&(ie.preventDefault(),ie.stopPropagation()),Vr(ie)})}),La(),Oe&&Dn(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(C=>{C.addEventListener("keydown",ie=>{(ie.key==="Enter"||ie.key===" ")&&(ie.preventDefault(),C.click())})});const e=s.querySelector("#delete-cal-confirm"),t=s.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||d)});const a=s.querySelector("#delete-ab-confirm"),r=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{r&&(r.disabled=!a.checked||d)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(C=>{C.addEventListener("error",()=>{const ie=C.dataset.avatarFallback||"?",J=document.createElement("span");J.className="contact-avatar contact-avatar-fallback",J.setAttribute("aria-hidden","true"),J.textContent=ie,C.replaceWith(J)})}),Bs||(document.addEventListener("keydown",C=>{if(C.key==="Escape"){if(z&&(z.phase==="done"||z.phase==="error")){sn();return}if(!z){if(Oe){Oe=!1,La(),p();return}if(Fe!==null||Ce!==null||fe!==null||dt){Fe=null,Ce=null,Lt(),dt=!1,p();return}un()}}}),Bs=!0);const i=s.querySelector('[data-form="login"]');i==null||i.addEventListener("submit",C=>{C.preventDefault(),Ir(i)});const m=s.querySelector('[data-form="files-rename"]');m==null||m.addEventListener("submit",C=>{C.preventDefault(),qr(m)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",C=>{C.preventDefault(),Or(n)});const l=s.querySelector('[data-form="files-mkdir"]');l==null||l.addEventListener("submit",C=>{C.preventDefault(),Lr(l)}),dt&&requestAnimationFrame(()=>{var C;(C=l==null?void 0:l.querySelector('input[name="name"]'))==null||C.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(C=>{C.addEventListener("change",()=>{Ur(C)})}),s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(C=>{C.indeterminate=!0});const u=s.querySelector('[data-form="share"]');u==null||u.addEventListener("submit",C=>{C.preventDefault(),Pr(u)});const b=s.querySelector('[data-form="edit-cal"]');b&&(cn(b),b.addEventListener("submit",C=>{C.preventDefault(),Mr(b)}));const y=s.querySelector('[data-form="edit-event"]');y==null||y.addEventListener("submit",C=>{C.preventDefault(),Fr(y)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(C=>{C.addEventListener("change",()=>{if(!k)return;const ie=s.querySelector('[data-form="edit-event"]');if(!ie)return;const J=new FormData(ie),et=ie.querySelector('input[name="allDay"]'),_e=Va(J);_e.endMode==="until"&&!_e.until&&(_e.until=ia(String(J.get("start")??k.start??""))||be(new Date)),k={...k,summary:String(J.get("summary")??k.summary),description:String(J.get("description")??k.description),location:String(J.get("location")??k.location),instanceId:Number(J.get("instanceId"))||k.instanceId,allDay:(et==null?void 0:et.checked)??k.allDay,start:String(J.get("start")??k.start??""),end:String(J.get("end")??k.end??"")||null,repeat:_e,hasRrule:!!String(J.get("repeatFreq")??"").trim()},_e.freq&&_e.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),p(),_e.endMode==="until"&&requestAnimationFrame(()=>{var ua;const tt=s.querySelector('input[name="repeatUntil"]');tt==null||tt.focus();try{(ua=tt==null?void 0:tt.showPicker)==null||ua.call(tt)}catch{}})})});const $=s.querySelector('[data-form="create-cal"]');$&&(cn($),$.addEventListener("submit",C=>{C.preventDefault(),Rr($)}));const v=s.querySelector('[data-form="create-ab"]');v==null||v.addEventListener("submit",C=>{C.preventDefault(),Wr(v)});const x=s.querySelector('[data-form="edit-ab"]');x==null||x.addEventListener("submit",C=>{C.preventDefault(),Jr(x)});const D=s.querySelector('[data-form="contact"]');D==null||D.addEventListener("submit",C=>{C.preventDefault(),Hr(D)});const L=s.querySelector('[data-form="task"]');if(L==null||L.addEventListener("submit",C=>{C.preventDefault(),Nr(L)}),L){const C=L.querySelector('select[name="instanceId"]');C==null||C.addEventListener("change",()=>{if(!X||!j)return;const ie=Number(C.value);if(!Number.isFinite(ie)||ie<=0)return;const J=new FormData(L),et=String(J.get("due")??"").trim();j={...j,instanceId:ie,parentUid:j.parentUid&&Ne.some(_e=>_e.uid===j.parentUid&&_e.instanceId===ie)?j.parentUid:null,summary:String(J.get("summary")??""),description:String(J.get("description")??""),status:String(J.get("status")??"NEEDS-ACTION"),due:et?new Date(et).toISOString():null,priority:Number(J.get("priority")??0),percent:Number(J.get("percent")??0)},p()})}const ae=s.querySelector('[data-form="note"]');ae==null||ae.addEventListener("submit",C=>{C.preventDefault(),xr(ae)});const T=s.querySelector('input[data-action="contact-search"]');T==null||T.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{aa=T.value,V!==null&&(async()=>{try{await Mt(V),p()}catch(C){f("error",C instanceof Error?C.message:"Search failed"),p()}})()},250)});const Y=s.querySelector('input[data-action="task-search"]');Y==null||Y.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{ss=Y.value,(async()=>{try{await Rt(),p()}catch(C){f("error",C instanceof Error?C.message:"Search failed"),p()}})()},250)});const H=s.querySelector('input[data-action="admin-users-search"]');H==null||H.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{bt=H.value,p()},150)});const G=s.querySelector('[data-form="admin-user-create"]');G==null||G.addEventListener("submit",C=>{C.preventDefault(),Cn(G)});const me=s.querySelector('[data-form="admin-user-edit"]');me==null||me.addEventListener("submit",C=>{C.preventDefault(),_n(me)});const Ae=s.querySelector('[data-form="admin-cal"]');Ae==null||Ae.addEventListener("submit",C=>{C.preventDefault(),An(Ae)});const Te=s.querySelector('[data-form="admin-ab"]');Te==null||Te.addEventListener("submit",C=>{C.preventDefault(),En(Te)});const wt=s.querySelector('[data-form="admin-settings"]');wt==null||wt.addEventListener("submit",C=>{C.preventDefault(),Tn(wt)});const ut=s.querySelector('[data-form="admin-database"]');ut==null||ut.addEventListener("submit",C=>{C.preventDefault(),Nn(ut)});const Et=s.querySelector('select[data-action="admin-db-backend"]');Et==null||Et.addEventListener("change",()=>{Xt=Et.value==="pgsql"?"pgsql":"sqlite",p()});const Be=s.querySelector('input[data-action="admin-db-confirm-input"]');Be==null||Be.addEventListener("input",()=>{yt=Be.value;const C=s.querySelector('[data-action="admin-db-confirm-save"]');C&&(C.disabled=d||yt.trim()!=="CONFIRM")});const jt=s.querySelector('input[data-action="admin-reset-password"]');jt==null||jt.addEventListener("input",()=>{Je=jt.value;const C=s.querySelector('[data-action="admin-reset-confirm"]');C&&(C.disabled=d||!ht||Je.trim()==="")});const Ht=s.querySelector('input[data-action="note-search"]');Ht==null||Ht.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{ns=Ht.value,(async()=>{try{await Sa(),p()}catch(C){f("error",C instanceof Error?C.message:"Search failed"),p()}})()},250)}),Br(),_r(),Tr()}async function Er(e){var i,m;const t=dn();if(t.length===0){f("error","No writable tasks selected"),p();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;d=!0,E(),p();try{const n=await A.bulkTasks({op:"delete",items:a});he=[],Pe&&t.some(l=>ue(l.instanceId,l.uri)===Pe)&&(Pe=null,j=null,X=!1),await Rt(),n.failed>0?f("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):f("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){f("error",n instanceof Error?n.message:"Bulk delete failed")}finally{d=!1,p()}return}let r={};if(e==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),l=((i=n==null?void 0:n.value)==null?void 0:i.trim())??"";if(!l){f("error","Choose a status to apply"),p();return}r={status:l}}else if(e==="bulk-task-due"){const n=Ya.trim();if(!n){f("error","Choose a due date to apply"),p();return}const l=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(l.getTime())){f("error","Invalid due date"),p();return}r={due:l.toISOString()}}else if(e==="bulk-task-clear-due")r={due:null};else if(e==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),l=((m=n==null?void 0:n.value)==null?void 0:m.trim())??"";if(l===""){f("error","Enter a percent complete (0–100)"),p();return}const u=Number(l);if(!Number.isFinite(u)||u<0||u>100){f("error","Percent must be between 0 and 100"),p();return}r={percent:Math.round(u)}}d=!0,E(),p();try{const n=await A.bulkTasks({op:"update",items:a,fields:r});if(await Rt(),j&&!X){const u=ue(j.instanceId,j.uri),b=Ne.find(y=>ue(y.instanceId,y.uri)===u);b&&(j={...b})}const l=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?f("error",`Updated ${l} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):f("success",`Updated ${l} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){f("error",n instanceof Error?n.message:"Bulk update failed")}finally{d=!1,p()}}async function Nr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("status")??"NEEDS-ACTION"),m=String(t.get("due")??"").trim(),n=m?new Date(m).toISOString():null,l=Number(t.get("priority")??0),u=Number(t.get("percent")??0),b=String(t.get("parentUid")??"").trim(),y=b===""?null:b;d=!0,E(),p();try{if(X){const $=Number(t.get("instanceId"));if(!Number.isFinite($)||$<=0)throw new Error("Select a calendar");const v=await A.createTask({instanceId:$,summary:a,description:r,status:i,due:n,priority:l,percent:u,parentUid:y});X=!1,Pe=ue(v.task.instanceId,v.task.uri),j=v.task,f("success",y?"Subtask created":"Task created")}else if(j){const $=await A.updateTask(j.instanceId,j.uri,{summary:a,description:r,status:i,due:n,priority:l,percent:u,parentUid:y});j=$.task,Pe=ue($.task.instanceId,$.task.uri),f("success","Task saved")}await Rt()}catch($){f("error",$ instanceof Error?$.message:"Save failed")}finally{d=!1,p()}}async function xr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("dtstart")??"").trim(),m=i?new Date(i).toISOString():null;d=!0,E(),p();try{if(we){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const l=await A.createNote({instanceId:n,summary:a,description:r,dtstart:m});we=!1,it=ue(l.note.instanceId,l.note.uri),re=l.note,f("success","Note created")}else if(re){const n=await A.updateNote(re.instanceId,re.uri,{summary:a,description:r,dtstart:m});re=n.note,it=ue(n.note.instanceId,n.note.uri),f("success","Note saved")}await Sa()}catch(n){f("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,p()}}function Tr(){const e=s.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){f("error","Photo is too large (max ~2 MB)"),p();return}try{const r=await er(t);He=r,Ee=`data:${t.type||"image/jpeg"};base64,${r}`,Ke=!1,p()}catch(r){f("error",r instanceof Error?r.message:"Failed to read photo"),p()}}})()})}function _r(){const e=s.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),r=e.querySelector('input[name="displayname"]'),i=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const m=()=>{const n=t.checked;a.hidden=!n,r&&(r.required=!n,n&&!r.value.trim()?r.placeholder="Auto: Holidays (XX)":n||(r.placeholder="Work")),n&&i&&(i.checked=!0)};t.addEventListener("change",m),m()}async function Ir(e){var i,m,n,l;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("password")??"");d=!0,E(),p(),N.event("login.attempt",{username:a});try{const u=await A.login(a,r);if(c=u.user,vs(u.ui),N.event("login.ok",{username:(c==null?void 0:c.username)??a}),ks(),ve())try{await Ss()}catch(b){N.warn("admin.capabilities login",b instanceof Error?b.message:b)}if(js(),mt(h,w),await Xe(),h==="admin"&&ve()&&qt())try{w==="overview"&&((i=Ve("overview"))==null?void 0:i.available)!==!1?await Xa():w==="users"&&((m=Ve("users"))==null?void 0:m.available)!==!1?(await na(),B&&(await St(B),await ra(B))):w==="settings"&&((n=Ve("settings"))==null?void 0:n.available)!==!1?await Za():w==="database"&&((l=Ve("database"))==null?void 0:l.available)!==!1&&await es()}catch(b){N.warn("admin login load",b instanceof Error?b.message:b)}f("success","Signed in")}catch(u){N.warn("login.failed",u instanceof Error?u.message:u),f("error",u instanceof Error?u.message:"Login failed")}finally{d=!1,p()}}async function qr(e){const t=new FormData(e),a=String(t.get("path")??""),r=String(t.get("newName")??"").trim();if(!a||!r){f("error","Name is required"),p();return}d=!0,E(),p();try{await A.filesRename(a,r),N.event("files.rename",{path:a,newName:r}),Fe=null,await Dt(),f("success",`Renamed to “${r}”`)}catch(i){f("error",i instanceof Error?i.message:"Rename failed")}finally{d=!1,p()}}async function Lr(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){f("error","Folder name is required"),p();return}d=!0,E(),p();try{await A.filesMkdir(De,a),N.event("files.mkdir",{path:De,name:a}),dt=!1,await Dt(),f("success",`Created folder “${a}”`)}catch(r){f("error",r instanceof Error?r.message:"Could not create folder")}finally{d=!1,p()}}async function Or(e){if(!fe||fe.paths.length===0)return;const t=new FormData(e),a=(At||String(t.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),r=String(t.get("newName")??"").trim(),i=fe.op,m=[...fe.paths],n=m.length>1;if(ts(a,m)){f("error","Choose a different destination folder"),p();return}d=!0,E(),p();let l=0;const u=[];try{for(const y of m)try{if(i==="copy"){const $=Fa(y),v=n||!r||r===$?void 0:r,x=await A.filesCopy(y,{to:a,newName:v});N.event("files.copy",{path:y,to:x.entry.path})}else{const $=Fa(y),v=n||!r||r===$?void 0:r;await A.filesMove(y,a,v),N.event("files.move",{path:y,to:a})}l+=1}catch($){u.push(`${Fa(y)}: ${$ instanceof Error?$.message:"failed"}`)}Lt(),ce=[],await Dt();const b=i==="copy"?"Copied":"Moved";l>0&&u.length===0?f("success",l===1?`${b} 1 item`:`${b} ${l} items`):l>0?f("info",`${b} ${l}; ${u.length} failed. ${u[0]}`):f("error",u[0]||`${i==="copy"?"Copy":"Move"} failed`)}catch(b){f("error",b instanceof Error?b.message:"Operation failed")}finally{d=!1,p()}}async function Ur(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",d=!0,E(),p();let r=0;const i=[];try{for(const m of a)try{await A.filesUpload(De,m,{replace:!0}),N.event("files.upload",{path:De,name:m.name,size:m.size}),r+=1}catch(n){i.push(`${m.name}: ${n instanceof Error?n.message:"failed"}`)}await Dt(),r>0&&i.length===0?f("success",r===1?"Uploaded 1 file":`Uploaded ${r} files`):r>0?f("info",`Uploaded ${r}; ${i.length} failed. ${i[0]}`):f("error",i[0]||"Upload failed")}catch(m){f("error",m instanceof Error?m.message:"Upload failed")}finally{d=!1,p()}}async function Pr(e){if(F===null)return;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("access")??"read");ge=!0,d=!0,E(),p();try{await A.share(F,a,r),await Oa(F),f("success",`Shared with ${a}`)}catch(i){f("error",i instanceof Error?i.message:"Share failed")}finally{d=!1,p()}}function Ra(e){if(!k)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');k={...k,summary:String(t.get("summary")??k.summary),description:String(t.get("description")??k.description),location:String(t.get("location")??k.location),instanceId:Number(t.get("instanceId"))||k.instanceId,allDay:(a==null?void 0:a.checked)??k.allDay,start:String(t.get("start")??k.start??""),end:String(t.get("end")??k.end??"")||null,repeat:Va(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function Va(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),r=String(e.get("repeatEndMode")??"never"),i=r==="until"||r==="count"?r:"never";let m=null,n=null;if(i==="until"){const u=String(e.get("repeatUntil")??"").trim();m=u?u.slice(0,10):null}else if(i==="count"){const u=Number(e.get("repeatCount")??0);n=Number.isFinite(u)&&u>0?Math.min(999,Math.round(u)):10}const l=e.getAll("repeatByDay").map(u=>String(u).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:m,count:n,byDay:l,endMode:i}}async function Fr(e){if(!k||!k.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),i=String(t.get("location")??"").trim(),m=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),l=String(t.get("end")??"").trim(),u=Number(t.get("instanceId"))||k.instanceId,b=Va(t);if(!a){f("error","Title is required"),p();return}if(!n){f("error","Start is required"),p();return}let y,$;if(m)y=n.slice(0,10),$=l?l.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const L=Es(n,l||null);y=new Date(L.start).toISOString(),$=L.end?new Date(L.end).toISOString():null}else y=new Date(n).toISOString(),$=l?new Date(l).toISOString():null;const v=k.instanceId,x=k.uri,D=rt;d=!0,E(),$t=!0,p(),N.event(D?"event.create":"event.update",{instanceId:u,uri:D?null:x,allDay:m,summary:a});try{const L={summary:a,description:r,location:i,allDay:m,start:y,end:$,instanceId:u,repeat:b},ae=D?await A.createEvent(u,L):await A.updateEvent(v,x,L);(F===null||ae.event.instanceId!==F)&&(F=ae.event.instanceId),await Ze(),$t=!1,k=null,rt=!1,O=null,N.event(D?"event.created":"event.saved",{uri:ae.event.uri,instanceId:ae.event.instanceId}),f("success",D?"Event created":"Event saved")}catch(L){N.warn("event.save failed",L instanceof Error?L.message:L),f("error",L instanceof Error?L.message:"Save failed")}finally{d=!1,p()}}async function Mr(e){if(F===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),i=String(t.get("color")??"").trim();d=!0,E(),p();try{const m=await A.updateCalendar(F,{displayname:a,description:r,color:i});ge=!0,await Xe(),F=m.calendar.id,await Oa(F),await Ze(),f("success","Calendar updated")}catch(m){f("error",m instanceof Error?m.message:"Update failed")}finally{d=!1,p()}}async function Rr(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),i=String(t.get("color")??"").trim(),m=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),l=t.get("readOnly")==="on";if(Me=!0,m&&!n){f("error","Select a country for the holidays calendar"),p();return}if(!m&&!a){f("error","Display name is required"),p();return}d=!0,E(),p();try{const u=await A.createCalendar({displayname:a,description:r,color:i,holidays:m,holidayCountry:m?n:void 0,readOnly:l});F=u.calendar.id,K.includes(u.calendar.id)||(K=[...K,u.calendar.id]),Me=!1,await Xe();let b=`Created “${u.calendar.displayname}”`;const y=u.holidayImport??u.calendar.holidayImport;y&&(b+=`. Holidays imported: ${Us(y)}.`),l&&(b+=" Calendar is read-only."),f("success",b)}catch(u){Me=!0,f("error",u instanceof Error?u.message:"Create failed")}finally{d=!1,p()}}async function Vr(e){var r,i,m;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&N.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){z&&(z.phase==="done"||z.phase==="error")&&sn();return}if(a==="logout"){d=!0,N.event("logout");try{await A.logout()}catch{}Qa(),E(),p();return}if(a==="select-cal"||a==="toggle-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;Rn(n),d=!0,E(),p();try{await Ze()}catch(l){f("error",l instanceof Error?l.message:"Failed to load calendar")}finally{d=!1,p()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ne.find(u=>u.id===n&&u.canShare))return;F=n,K.includes(n)||(K=[...K,n]),ge=!0,Re=null,d=!0,E(),p();try{await Oa(n),await Ze()}catch(u){f("error",u instanceof Error?u.message:"Failed to open calendar")}finally{d=!1,p()}return}if(a==="close-cal-modal"){ge=!1,p();return}if(a==="open-create-cal-modal"){Me=!0,ge=!1,Re=null,E(),p();return}if(a==="close-create-cal-modal"){Me=!1,E(),p();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ne.find(u=>u.id===n&&u.canShare))return;Re=n,ge=!1,E(),p();return}if(a==="cancel-delete-cal"){Re=null,p();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),l=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(l!=null&&l.checked))return;d=!0,E(),p();try{if(await A.deleteCalendar(n),F===n&&(F=null),K=K.filter(u=>u!==n),Re=null,ge=!1,ea=[],ta=[],await Xe(),F===null){const u=Ks();u?(F=u.id,K.includes(u.id)||(K=[...K,u.id]),await Ze()):K.length>0&&(F=K[0],await Ze())}f("success","Calendar deleted")}catch(u){f("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,p()}return}if(a==="month-today"){const n=new Date;It={y:n.getFullYear(),m:n.getMonth()},_a=null,d=!0,p();try{await Ze()}finally{d=!1,p()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,l=new Date(It.y,It.m+n,1);It={y:l.getFullYear(),m:l.getMonth()},_a=null,d=!0,p();try{await Ze()}finally{d=!1,p()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;d=!0,E(),p();try{const u=await A.getEvent(n,l);k={...u.event,repeat:u.event.repeat??rs()},rt=!1,$t=!0,O=null,ge=!1,Re=null}catch(u){f("error",u instanceof Error?u.message:"Failed to open event")}finally{d=!1,p()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";_a=_a===n?null:n,p();return}if(a==="new-event-day"){const n=e.target;if((r=n==null?void 0:n.closest)!=null&&r.call(n,".month-event, .month-event-more"))return;const l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;if(F===null){f("error","Select a calendar first"),p();return}const u=ne.find(b=>b.id===F);if(!u||u.readOnly||!(u.canShare||u.access==="readwrite")){f("error","This calendar is read-only"),p();return}rt=!0,k=Qn(l,F),$t=!0,O=null,ge=!1,Re=null,E(),p();return}if(a==="close-event-modal"){$t=!1,k=null,rt=!1,O=null,E(),p();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const l=s.querySelector('[data-form="edit-event"]');if(l&&k&&Ra(l),(O==null?void 0:O.field)===n)O=null;else{const u=t.dataset.dtDateOnly==="1",b=t.dataset.dtClear!=="0",y=t.dataset.dtName||n;let $=Ts(n);!$&&(n==="due"||n==="dtstart"||n==="bulk-due")&&($=Pa().start);const v=Ua($||be(new Date)),[x,D]=v.date.split("-").map(Number);O={field:n,viewY:x,viewM:(D||1)-1,dateOnly:u,allowClear:b,name:y}}p();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const n=a==="dt-month-prev"?-1:1,l=new Date(O.viewY,O.viewM+n,1);O={...O,viewY:l.getFullYear(),viewM:l.getMonth()},p();return}if(a==="dt-pick-day"){if(!O)return;const n=O.field,l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Ra(u);const b=O.dateOnly;if(b)ct(n,l),O=null;else{const y=Ts(n),$=Ua(y||Pa(l).start).hm;ct(n,`${l}T${$}`),O={...O,viewY:Number(l.slice(0,4)),viewM:Number(l.slice(5,7))-1}}if(n==="start"&&k&&!b&&k.end){const y=new Date(String(k.start)),$=new Date(String(k.end));!Number.isNaN(y.getTime())&&!Number.isNaN($.getTime())&&$<=y&&ct("end",Ft(new Date(y.getTime()+3600*1e3)))}p();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const n=O.field,l=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(l))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Ra(u);const b=Ts(n)||Pa().start,$=`${Ua(b).date}T${l}`;if(ct(n,$),n==="start"&&k){k={...k,allDay:!1};const v=k.end?Ua(String(k.end)):null,x=new Date($);(!v||new Date(`${v.date}T${v.hm}`)<=x)&&ct("end",Ft(new Date(x.getTime()+3600*1e3)))}O=null,p();return}if(a==="dt-today"){if(!O)return;const n=O.field,l=s.querySelector('[data-form="edit-event"]');l&&k&&Ra(l);const u=be(new Date);if(O.dateOnly)ct(n,u);else{const b=Pa(u);n==="start"?(ct("start",b.start),k&&!k.end&&ct("end",b.end)):n==="end"?ct("end",b.end):ct(n,b.start)}O=null,p();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const n=O.field,l=s.querySelector('[data-form="edit-event"]');l&&k&&Ra(l),ct(n,null),O=null,p();return}if(a==="event-allday-toggle"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]'),l=t.checked;if(n){const u=new FormData(n),b=String(u.get("start")??k.start??""),y=String(u.get("end")??k.end??"")||null;let $=b,v=y;if(l){const x=Fn(b,y);$=x.start,v=x.end}else{const x=b.slice(0,10),D=(y||b).slice(0,10),L=Es(x,D);$=L.start,v=L.end}k={...k,summary:String(u.get("summary")??k.summary),description:String(u.get("description")??k.description),location:String(u.get("location")??k.location),instanceId:Number(u.get("instanceId"))||k.instanceId,allDay:l,start:$,end:v,repeat:Va(u)}}else k={...k,allDay:l};O=null,p();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const l=new FormData(n),u=n.querySelector('input[name="allDay"]'),b=Va(l);k={...k,summary:String(l.get("summary")??k.summary),description:String(l.get("description")??k.description),location:String(l.get("location")??k.location),instanceId:Number(l.get("instanceId"))||k.instanceId,allDay:(u==null?void 0:u.checked)??k.allDay,start:String(l.get("start")??k.start??""),end:String(l.get("end")??k.end??"")||null,repeat:b,hasRrule:!!String(l.get("repeatFreq")??"").trim()},b.freq&&b.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),p();return}if(a==="delete-event"){if(!k||!k.canWrite||rt||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=k.instanceId,l=k.uri;d=!0,E(),p();try{await A.deleteEvent(n,l),$t=!1,k=null,await Ze(),f("success","Event deleted")}catch(u){f("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,p()}return}if(a==="info"){const n=t.dataset.info??"";Yr(n);return}if(a==="info-close"){un();return}if(a==="flash-close"){E(),p();return}if(a==="user-menu-toggle"){e.stopPropagation(),Oe=!Oe,p();return}if(a==="user-menu-close"){Oe&&(Oe=!1,p());return}if(a==="tab"){const n=Ms(t.dataset.tab);n&&(n==="admin"&&(w="overview"),await Js(n));return}if(a==="admin-page"){const n=bs(t.dataset.adminPage);n&&await Hs(n);return}if(a==="admin-refresh"){if(!ve()||h!=="admin")return;d=!0,E(),p();try{await Xa(),f("success","Overview refreshed")}catch(n){f("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-users-refresh"){if(!ve()||h!=="admin")return;d=!0,E(),p();try{await na(),B&&await St(B),f("success","Users refreshed")}catch(n){f("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-user-view"){const n=t.dataset.username??"";if(!n||!ve())return;d=!0,E(),B=n,w="users",mt("admin","users",n),p();try{await St(n),await ra(n)}catch(l){f("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-close"){B=null,R=null,qe=null,Le=!1,mt("admin","users",null),p();return}if(a==="admin-user-create-open"){if(!ve())return;ze=!0,Le=!1,gt=null,E(),p();return}if(a==="admin-user-create-close"){ze=!1,p();return}if(a==="admin-user-edit-open"){if(!ve())return;const n=t.dataset.username??B??"";if(!n)return;d=!0,E(),ze=!1,gt=null,B=n,w="users",mt("admin","users",n),p();try{(!R||R.username.toLowerCase()!==n.toLowerCase())&&await St(n),Le=!0}catch(l){f("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-edit-close"){Le=!1,p();return}if(a==="admin-user-delete-open"){if(!ve())return;const n=t.dataset.username??B??"";if(!n)return;gt=n,xt=!1,ze=!1,Le=!1,E(),p();return}if(a==="admin-user-delete-close"){gt=null,xt=!1,p();return}if(a==="admin-user-delete-toggle"){xt=!!t.checked,p();return}if(a==="admin-user-delete-confirm"){if(!ve())return;const n=t.dataset.username??gt??"";if(!n||!xt)return;d=!0,E(),p();try{await A.adminDeleteUser(n,!0),N.event("admin.user.delete",{username:n}),gt=null,xt=!1,Le=!1,(B==null?void 0:B.toLowerCase())===n.toLowerCase()&&(B=null,R=null,Tt=[],_t=[],mt("admin","users",null)),await na(),f("success",`Deleted user “${n}”`)}catch(l){f("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-cal-create"){We="create",Yt=null,p();return}if(a==="admin-cal-edit"){We="edit",Yt=Number(t.dataset.id),p();return}if(a==="admin-cal-close"){We=null,Yt=null,p();return}if(a==="admin-cal-delete"){$e={kind:"calendar",id:Number(t.dataset.id),label:t.dataset.label??"calendar"},p();return}if(a==="admin-ab-create"){nt="create",Kt=null,p();return}if(a==="admin-ab-edit"){nt="edit",Kt=Number(t.dataset.id),p();return}if(a==="admin-ab-close"){nt=null,Kt=null,p();return}if(a==="admin-ab-delete"){$e={kind:"addressbook",id:Number(t.dataset.id),label:t.dataset.label??"address book",force:!1},p();return}if(a==="admin-ab-force-toggle"){($e==null?void 0:$e.kind)==="addressbook"&&($e={...$e,force:!!t.checked},p());return}if(a==="admin-resource-delete-close"){$e=null,p();return}if(a==="admin-resource-delete-confirm"){if(!B||!$e)return;const n=B,l=$e;d=!0,E(),p();try{l.kind==="calendar"?await A.adminDeleteUserCalendar(n,l.id,!0):await A.adminDeleteUserAddressBook(n,l.id,!0,!!l.force),$e=null,await ra(n),await St(n),f("success","Deleted")}catch(u){f("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-settings-refresh"){d=!0,E(),p();try{await Za(),f("success","Settings reloaded")}catch(n){f("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-reset-open"){fa=!0,ht=!1,Je="",E(),p();return}if(a==="admin-reset-close"){fa=!1,ht=!1,Je="",p();return}if(a==="admin-reset-toggle"){ht=!!t.checked,p();return}if(a==="admin-reset-password"){Je=t.value;const n=s.querySelector('[data-action="admin-reset-confirm"]');n&&(n.disabled=d||!ht||Je.trim()==="");return}if(a==="admin-reset-confirm"){if(!ht)return;if(Je.trim()===""){f("error","Re-enter your password to confirm Reset to Default"),p();return}d=!0,E(),p();try{const n=await A.adminResetToDefault(!0,Je);N.event("admin.settings.reset-to-default"),fa=!1,ht=!1,Je="";const l=n.redirectUrl&&n.redirectUrl.startsWith("/")?n.redirectUrl:"/portal/install/";window.location.assign(l);return}catch(n){f("error",n instanceof Error?n.message:"Reset failed"),d=!1,p()}return}if(a==="admin-database-refresh"){d=!0,E(),p();try{await es(),f("success","Database settings reloaded")}catch(n){f("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-db-backend"){Xt=t.value==="pgsql"?"pgsql":"sqlite",p();return}if(a==="admin-db-test"){const n=t.closest("form");xn(n);return}if(a==="admin-db-confirm-close"){ba=!1,yt="",ga=null,p();return}if(a==="admin-db-confirm-input"){yt=t.value,p();const l=s.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const u=l.value.length;l.setSelectionRange(u,u)}return}if(a==="admin-db-confirm-save"){if(yt.trim()!=="CONFIRM"||!ga)return;d=!0,E(),p();try{const n={...ga,confirm:"CONFIRM"},l=await A.adminUpdateDatabaseSettings(n);Qt=l.data,ba=!1,yt="",ga=null,Xt=(l.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:l.data.backend}),f("success","Database settings saved")}catch(n){f("error",n instanceof Error?n.message:"Database save failed")}finally{d=!1,p()}return}if(a==="files-nav"){De=t.dataset.path??"",Fe=null,Ce=null,fe=null,dt=!1,ce=[],d=!0,E(),p();try{await Dt()}catch(l){f("error",l instanceof Error?l.message:"Failed to open folder")}finally{d=!1,p()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?ce.includes(n)||(ce=[...ce,n]):ce=ce.filter(u=>u!==n),p();return}if(a==="files-select-all"){e.stopPropagation(),ce=t.checked?xe.map(l=>l.path):[],p();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;as("copy",[n]);return}if(a==="files-move"){const n=t.dataset.path??"";if(!n)return;as("move",[n]);return}if(a==="files-bulk-copy"){if(ce.length===0)return;as("copy",[...ce]);return}if(a==="files-bulk-move"){if(ce.length===0)return;as("move",[...ce]);return}if(a==="files-tree-select"){if(e.preventDefault(),e.stopPropagation(),!fe)return;const n=t.dataset.path??"";if(ts(n,fe.paths))return;At=n,p();return}if(a==="files-tree-toggle"||a==="files-tree-retry"){if(e.preventDefault(),e.stopPropagation(),!fe)return;const n=t.dataset.path??"";if(a==="files-tree-retry"){const u={...Qe};delete u[n],Qe=u,ot.includes(n)||(ot=[...ot,n]),Ds(n);return}ot.includes(n)?(ot=ot.filter(u=>u!==n),p()):(ot=[...ot,n],Ds(n));return}if(a==="files-transfer-close"){Lt(),p();return}if(a==="files-bulk-delete"){if(ce.length===0)return;Ce=[...ce],Fe=null,Lt(),p();return}if(a==="files-refresh"){d=!0,E(),p();try{await Dt(),f("success","Refreshed")}catch(n){f("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="files-mkdir"){dt=!0,Fe=null,Ce=null,Lt(),E(),p();return}if(a==="files-mkdir-close"){dt=!1,p();return}if(a==="files-rename-open"){Fe=t.dataset.path??null,Ce=null,Lt(),p();return}if(a==="files-rename-close"){Fe=null,p();return}if(a==="files-delete-open"){const n=t.dataset.path??"";Ce=n?[n]:null,Fe=null,Lt(),p();return}if(a==="files-delete-close"){Ce=null,p();return}if(a==="files-delete-confirm"){const n=Ce?[...Ce]:[];if(n.length===0)return;d=!0,E(),p();try{if(n.length===1)await A.filesDelete(n[0]),N.event("files.delete",{path:n[0]}),f("success","Deleted");else{const l=await A.filesBulk("delete",n);N.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?f("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?f("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):f("error",l.errors[0]||"Delete failed")}Ce=null,ce=[],await Dt()}catch(l){f("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="files-download"){N.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){Pt===n?Ct=Ct==="asc"?"desc":"asc":(Pt=n,Ct=n==="due"||n==="summary"?"asc":"desc"),d=!0,p();try{await Rt()}catch(l){f("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}else{wa===n?la=la==="asc"?"desc":"asc":(wa=n,la="asc"),d=!0,p();try{await Sa()}catch(l){f("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=Ne.find(b=>b.instanceId===n&&b.uri===l)??null;X=!1,Pe=ue(n,l),j=u?{...u}:null,E(),p();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=ue(n,l),b=Ne.find(y=>ue(y.instanceId,y.uri)===u);if(!b||!b.canWrite||b.readOnly)return;he.includes(u)?he=he.filter(y=>y!==u):he=[...he,u],p();return}if(a==="task-select-all"){e.preventDefault();const n=Ne.filter(u=>u.canWrite&&!u.readOnly);n.length>0&&n.every(u=>he.includes(ue(u.instanceId,u.uri)))?he=[]:he=n.map(u=>ue(u.instanceId,u.uri)),p();return}if(a==="bulk-task-clear"){he=[],p();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Er(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(n)||!l)return;const u=va.find(b=>b.instanceId===n&&b.uri===l)??null;we=!1,it=ue(n,l),re=u?{...u}:null,E(),p();return}if(a==="new-task"){X=!0,Pe=null,j={uri:"",instanceId:((i=Ot[0])==null?void 0:i.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),p();return}if(a==="new-subtask"){if(!j||X||!j.uid||!j.canWrite)return;const n=j;X=!0,Pe=null,j={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),p();return}if(a==="new-note"){we=!0,it=null,re={uri:"",instanceId:((m=Ut[0])==null?void 0:m.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},E(),p();return}if(a==="cancel-task"){X=!1,j=null,Pe=null,p();return}if(a==="cancel-note"){we=!1,re=null,it=null,p();return}if(a==="delete-task"){if(!j||X||!confirm("Delete this task? CalDAV clients will sync the removal."))return;d=!0,E(),p();try{await A.deleteTask(j.instanceId,j.uri),Pe=null,j=null,await Rt(),f("success","Task deleted")}catch(n){f("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-note"){if(!re||we||!confirm("Delete this note? CalDAV clients will sync the removal."))return;d=!0,E(),p();try{await A.deleteNote(re.instanceId,re.uri),it=null,re=null,await Sa(),f("success","Note deleted")}catch(n){f("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,p()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;V=n,lt=!1,de=null,I=null,pe=!1,Se=!1,aa="",kt=[],Ee=null,He=null,Ke=!1,E(),d=!0,p();try{await Mt(n)}catch(l){f("error",l instanceof Error?l.message:"Failed to load contacts")}finally{d=!1,p()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!Ue.find(b=>b.id===n))return;const u=V!==n;V=n,lt=!0,Se=!1,E(),u&&(de=null,I=null,pe=!1,aa="",kt=[],Ee=null,He=null,Ke=!1),d=!0,p();try{u&&await Mt(n)}catch(b){f("error",b instanceof Error?b.message:"Failed to open address book")}finally{d=!1,p()}return}if(a==="close-ab-modal"){lt=!1,p();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;E();try{await Xn(n)}catch(l){f("error",l instanceof Error?l.message:"Failed to load contact")}p();return}if(a==="new-contact"){if(V===null)return;Zn(),E(),p();return}if(a==="cancel-contact"||a==="close-contact-modal"){pe=!1,Se=!1,I=null,de=null,Ee=null,He=null,Ke=!1,O=null,E(),p();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;is(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),p();return}if(a==="remove-email"){if(!I)return;is();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const l=Array.isArray(I.emails)?I.emails:[""];I.emails=l.filter((u,b)=>b!==n),I.emails.length===0&&(I.emails=[""]),p();return}if(a==="remove-phone"){if(!I)return;is();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const l=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=l.filter((u,b)=>b!==n),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),p();return}if(a==="remove-custom"){if(!I)return;is();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((l,u)=>u!==n),p();return}if(a==="remove-photo"){Ee=null,He=null,Ke=!0,I&&(I.hasPhoto=!1),p();return}if(a==="delete-contact"){if(V===null||!de||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;d=!0,E(),Se=!0,p();try{await A.deleteContact(V,de),de=null,I=null,pe=!1,Se=!1,O=null,Ee=null,await Xe(),f("success","Contact deleted")}catch(n){f("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??V);if(!Number.isFinite(n)||!Ue.find(u=>u.id===n))return;Ye=n,lt=!1,Se=!1,E(),p();return}if(a==="cancel-delete-ab"){Ye=null,p();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),l=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(l!=null&&l.checked))return;const u=Ue.find(y=>y.id===n);if(!u)return;const b=(u.cardCount??0)>0;d=!0,E(),p();try{await A.deleteAddressBook(n,b),V===n&&(V=null,kt=[],I=null,de=null,pe=!1),Ye=null,lt=!1,Se=!1,await Xe(),V===null&&Ue.length>0&&(V=Ue[0].id,await Mt(V)),f("success","Address book deleted")}catch(y){f("error",y instanceof Error?y.message:"Delete failed")}finally{d=!1,p()}return}if(a==="export-ab"){e.stopPropagation();const n=t.dataset.id,l=n!==void 0&&n!==""?Number(n):V;if(l===null||Number.isNaN(l))return;d=!0,E(),p();try{const{blob:u,filename:b}=await A.exportAddressBook(l),y=await _s(u,b);y==="cancelled"?f("info","Export cancelled"):y==="saved"?f("success",`Saved ${b}`):f("success",`Download started: ${b}`)}catch(u){f("error",u instanceof Error?u.message:"Export failed")}finally{d=!1,p()}return}if(a==="export-contact"){if(V===null||!de||pe)return;Se=!0,d=!0,E(),p();try{const{blob:n,filename:l}=await A.exportContact(V,de),u=await _s(n,l);u==="cancelled"?f("info","Export cancelled"):u==="saved"?f("success",`Saved ${l}`):f("success",`Download started: ${l}`)}catch(n){f("error",n instanceof Error?n.message:"Export failed")}finally{d=!1,p()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||F===null||!confirm("Revoke access for this user?"))return;ge=!0,d=!0,E(),p();try{await A.revoke(F,n),await Oa(F),f("success","Share revoked")}catch(l){f("error",l instanceof Error?l.message:"Revoke failed")}finally{d=!1,p()}return}if(a==="export-cal"){e.stopPropagation();const n=t.dataset.id,l=n!==void 0&&n!==""?Number(n):F;if(l===null||Number.isNaN(l))return;d=!0,E(),p();try{const{blob:u,filename:b}=await A.exportCalendar(l),y=await _s(u,b);y==="cancelled"?f("info","Export cancelled"):y==="saved"?f("success",`Saved ${b}`):f("success",`Download started: ${b}`)}catch(u){f("error",u instanceof Error?u.message:"Export failed")}finally{d=!1,p()}}}async function _s(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const n=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await n.write(e)}finally{await n.close()}return"saved"}catch(m){if(m instanceof DOMException&&m.name==="AbortError")return"cancelled"}const r=URL.createObjectURL(e),i=document.createElement("a");return i.href=r,i.download=t,i.rel="noopener",i.style.display="none",document.body.appendChild(i),i.click(),window.setTimeout(()=>{URL.revokeObjectURL(r),i.remove()},6e4),"started"}function Br(){const e=s.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Kr(e)});const t=s.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Gr(t)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{zr(a)})}async function zr(e){var r;if(V===null)return;const t=(r=e.files)==null?void 0:r[0];if(e.value="",!t)return;const a=V;lt=!0,d=!0,E(),vt(),z={kind:"contacts",fileName:t.name,fileSizeLabel:tn(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},an(),p();try{const i=await ln(t,l=>{if(!z||z.phase!=="reading")return;z={...z,readPercent:l};const u=s.querySelector(".import-progress-bar"),b=s.querySelector("[data-import-status-line]");u&&l!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${l}%`),b&&l!==null&&(b.textContent=`Reading file… ${l}%`)});zt("uploading",{readPercent:100}),zt("processing",{processPercent:0}),N.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const m=await A.importAddressBook(a,i,l=>{nn(l)}),n=Us(m);await Xe(),V===a&&await Mt(a),vt(),zt("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),f("success",`Import finished for “${t.name}”: ${n}.`)}catch(i){const m=i instanceof Error?i.message:"Import failed";vt(),zt("error",{ok:!1,resultMessage:m}),f("error",m)}finally{d=!1,p()}}function is(){if(!I)return;const e=s.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);I.firstname=String(t.get("firstname")??""),I.lastname=String(t.get("lastname")??""),I.fullname=String(t.get("fullname")??""),I.org=String(t.get("org")??""),I.title=String(t.get("title")??""),I.url=String(t.get("url")??""),I.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const r=[];let i=0;for(;t.has(`email_${i}`);)r.push(String(t.get(`email_${i}`)??"")),i++;r.length&&(I.emails=r);const m=[];for(i=0;t.has(`phone_value_${i}`);)m.push({type:String(t.get(`phone_type_${i}`)??"other"),value:String(t.get(`phone_value_${i}`)??"")}),i++;m.length&&(I.phones=m);const n=[];for(i=0;t.has(`custom_label_${i}`)||t.has(`custom_value_${i}`);)n.push({label:String(t.get(`custom_label_${i}`)??""),value:String(t.get(`custom_value_${i}`)??"")}),i++;I.custom=n}function jr(e){const t=new FormData(e),a=[];let r=0;for(;t.has(`email_${r}`);){const l=String(t.get(`email_${r}`)??"").trim();l&&a.push(l),r++}const i=[];for(r=0;t.has(`phone_value_${r}`);){const l=String(t.get(`phone_value_${r}`)??"").trim();l&&i.push({type:String(t.get(`phone_type_${r}`)??"other"),value:l}),r++}const m=[];for(r=0;t.has(`custom_label_${r}`)||t.has(`custom_value_${r}`);){const l=String(t.get(`custom_label_${r}`)??"").trim(),u=String(t.get(`custom_value_${r}`)??"").trim();(l||u)&&m.push({label:l,value:u}),r++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:i,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const l=String(t.get("birthday")??"").trim();return l&&/^\d{4}-\d{2}-\d{2}/.test(l)?l.slice(0,10):null})(),custom:m};return Ke?n.removePhoto=!0:He&&(n.photoBase64=He),n}async function Hr(e){if(V===null)return;const t=jr(e);d=!0,E(),Se=!0,p();try{if(pe){const a=await A.createContact(V,t);pe=!1,de=a.contact.uri,I=null,Se=!1,Ee=null,He=null,Ke=!1,O=null,f("success","Contact created")}else de&&(de=(await A.updateContact(V,de,t)).contact.uri,I=null,Se=!1,Ee=null,He=null,Ke=!1,O=null,f("success","Contact saved"));try{await Xe()}catch(a){if(console.error(a),V!==null)try{await Mt(V)}catch{}}}catch(a){f("error",a instanceof Error?a.message:"Save failed")}finally{d=!1,p()}}async function Wr(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();if(a){d=!0,E(),p();try{const i=await A.createAddressBook({displayname:a,description:r});V=i.addressbook.id,de=null,I=null,pe=!1,aa="",await Xe(),f("success",`Address book “${i.addressbook.displayname}” created`)}catch(i){f("error",i instanceof Error?i.message:"Create failed")}finally{d=!1,p()}}}async function Jr(e){if(V===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();lt=!0,d=!0,E(),p();try{await A.updateAddressBook(V,{displayname:a,description:r}),await Xe(),f("success","Address book updated")}catch(i){f("error",i instanceof Error?i.message:"Update failed")}finally{d=!1,p()}}function Yr(e){const t=pl[e];if(!t)return;const a=s.querySelector("#info-modal"),r=s.querySelector("#info-modal-title"),i=s.querySelector("#info-modal-body");if(!a||!r||!i)return;r.textContent=t.title,i.innerHTML=t.paragraphs.map(n=>`<p>${o(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const m=a.querySelector(".info-modal-close");m==null||m.focus()}function un(){const e=s.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Kr(e){var a;if(F===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(ge=!0,await mn(F,t,{keepEditModalOpen:!0}))}async function Gr(e){var b;const t=(b=e.files)==null?void 0:b[0];if(e.value="",!t)return;const a=s.querySelector('[data-form="create-cal"]'),r=a?new FormData(a):new FormData,i=r.get("holidays")==="on",m=r.get("readOnly")==="on";if(i){f("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Me=!0,p();return}if(m){f("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Me=!0,p();return}let n=String(r.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const l=String(r.get("description")??""),u=String(r.get("color")??"").trim();d=!0,E(),Me=!0,p();try{const y=await A.createCalendar({displayname:n,description:l,color:u,readOnly:!1});F=y.calendar.id,Me=!1,await Xe(),f("success",`Created “${y.calendar.displayname}” — importing…`),await mn(y.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const $=y instanceof Error?y.message:"Create or import failed";Me=!0,f("error",$),d=!1,p()}}async function mn(e,t,a={}){d=!0,E(),vt(),z={kind:"calendar",fileName:t.name,fileSizeLabel:tn(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},an(),p();try{const r=await ln(t,n=>{if(!z||z.phase!=="reading")return;z={...z,readPercent:n};const l=s.querySelector(".import-progress-bar"),u=s.querySelector("[data-import-status-line]");l&&n!==null&&(l.classList.remove("is-indeterminate"),l.style.width=`${n}%`),u&&n!==null&&(u.textContent=`Reading file… ${n}%`)});zt("uploading",{readPercent:100}),zt("processing",{processPercent:0}),N.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const i=await A.importCalendar(e,r,n=>{nn(n)}),m=Us(i);F===e&&await Ze(),vt(),zt("done",{ok:!0,resultMessage:`${m} (from “${t.name}”)`}),f("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${m}.`)}catch(r){const i=r instanceof Error?r.message:"Import failed";vt(),zt("error",{ok:!1,resultMessage:i}),f("error",i)}finally{a.keepEditModalOpen&&(ge=!0),d=!1,p()}}On()}let Jt="",P=null,Z=!1,pt=null,Nt=null,Wt="sqlite",gs=!1;async function hs(s,c={}){const g={Accept:"application/json",...c.headers};c.body&&(g["Content-Type"]="application/json"),Jt&&c.method&&c.method!=="GET"&&(g["X-CSRF-Token"]=Jt);const h=await fetch(`/api/install${s}`,{credentials:"same-origin",...c,headers:g});let w;try{w=await h.json()}catch{throw new Error(`Request failed (${h.status})`)}if(!h.ok)throw new Error(w.error||`Request failed (${h.status})`);return w&&typeof w=="object"&&"data"in w&&w.data!==void 0?w.data:w}async function Vs(){var s;P=await hs("/status"),Jt=P.csrfToken||Jt,((s=P.defaults)==null?void 0:s.backend)==="pgsql"?Wt="pgsql":Wt="sqlite"}function za(s,c,g){return`<label class="check-row"><input type="checkbox" name="${o(s)}" ${c?"checked":""} ${Z?"disabled":""} /> ${o(g)}</label>`}function gl(){const s=P==null?void 0:P.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${o((s==null?void 0:s.configPath)||"—")} ${s!=null&&s.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${o((s==null?void 0:s.specificPath)||"—")} ${s!=null&&s.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${ma("error",(P==null?void 0:P.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${Z?"disabled":""}>Retry</button>
  </section>`}function hl(){const s=P==null?void 0:P.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${Z?"disabled":""}>
          ${vn((s==null?void 0:s.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${za("cal_enabled",(s==null?void 0:s.cal_enabled)!==!1,"Enable CalDAV")}
      ${za("card_enabled",(s==null?void 0:s.card_enabled)!==!1,"Enable CardDAV")}
      ${za("tasks_enabled",(s==null?void 0:s.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${za("notes_enabled",!!(s!=null&&s.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${za("files_enabled",!!(s!=null&&s.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${Z?"disabled":""}>
          ${["Digest","Basic","Apache"].map(c=>`<option value="${c}" ${((s==null?void 0:s.dav_auth_type)||"Digest")===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${o((s==null?void 0:s.invite_from)||"")}" ${Z?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${o(String((s==null?void 0:s.session_max_age_minutes)??15))}" ${Z?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${Z?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${Z?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${Z?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function yl(){const s=P==null?void 0:P.defaults,c=(P==null?void 0:P.pdoDrivers)||[],g=c.includes("sqlite"),h=c.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${Z?"disabled":""}>
          ${g?`<option value="sqlite" ${Wt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${h?`<option value="pgsql" ${Wt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Wt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${o((s==null?void 0:s.sqlite_file)||"")}" class="mono" ${Z?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Wt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${o((s==null?void 0:s.pgsql_host)||"")}" placeholder="localhost:5432" ${Z?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${o((s==null?void 0:s.pgsql_dbname)||"")}" ${Z?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${o((s==null?void 0:s.pgsql_username)||"")}" autocomplete="off" ${Z?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${Z?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${Z?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${Z?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${Z?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function $l(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${o(String((P==null?void 0:P.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${o((P==null?void 0:P.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${gs?"checked":""} ${Z?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${Z||!gs?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function vl(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${o((P==null?void 0:P.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function wl(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${ma("error",(P==null?void 0:P.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function ft(){const s=document.getElementById("app");if(!s)return;const c=(P==null?void 0:P.step)||"permissions";let g="";P?c==="permissions"?g=gl():c==="initialize"?g=hl():c==="database"?g=yl():c==="upgrade"?g=$l():c==="done"?g=vl():c==="locked"?g=wl():g=`<section class="card"><p>Unknown step: ${o(c)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',s.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${o((P==null?void 0:P.productVersion)||"…")}</span>
            ${P!=null&&P.configuredVersion?` · configured <span class="mono">${o(String(P.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${P!=null&&P.step?`<span class="badge badge-admin">${o(P.step)}</span>`:""}
      </header>
      ${pt?ma("error",pt,{dismissible:!1}):""}
      ${Nt?ma("success",Nt,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,kl()}function kl(){var c,g,h,w,q,U;const s=document.getElementById("app");s&&((c=s.querySelector('[data-action="reload"]'))==null||c.addEventListener("click",()=>{Sl()}),(g=s.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",M=>{Wt=M.target.value==="pgsql"?"pgsql":"sqlite",ft()}),(h=s.querySelector('[data-action="upgrade-toggle"]'))==null||h.addEventListener("change",M=>{gs=!!M.target.checked,ft()}),(w=s.querySelector('[data-action="upgrade-run"]'))==null||w.addEventListener("click",()=>{Al()}),(q=s.querySelector('[data-form="initialize"]'))==null||q.addEventListener("submit",M=>{M.preventDefault(),Dl(M.target)}),(U=s.querySelector('[data-form="database"]'))==null||U.addEventListener("submit",M=>{M.preventDefault(),Cl(M.target)}))}async function Sl(){Z=!0,pt=null,ft();try{await Vs(),Nt=null}catch(s){pt=s instanceof Error?s.message:"Failed to load installer status"}finally{Z=!1,ft()}}async function Dl(s){const c=new FormData(s),g=w=>{var q;return!!((q=s.querySelector(`input[name="${w}"]`))!=null&&q.checked)},h={timezone:String(c.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(c.get("dav_auth_type")??"Digest"),invite_from:String(c.get("invite_from")??"").trim(),session_max_age_minutes:Number(c.get("session_max_age_minutes")??15),admin_password:String(c.get("admin_password")??""),admin_password_confirm:String(c.get("admin_password_confirm")??"")};Z=!0,pt=null,Nt=null,ft();try{P=await hs("/initialize",{method:"POST",body:JSON.stringify(h)}),Jt=P.csrfToken||Jt,Nt="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(w){pt=w instanceof Error?w.message:"Initialize failed"}finally{Z=!1,ft()}}async function Cl(s){const c=new FormData(s),g=String(c.get("backend")??Wt),h={backend:g,admin_password:String(c.get("admin_password")??""),admin_password_confirm:String(c.get("admin_password_confirm")??"")};g==="sqlite"?h.sqlite_file=String(c.get("sqlite_file")??"").trim():(h.pgsql_host=String(c.get("pgsql_host")??"").trim(),h.pgsql_dbname=String(c.get("pgsql_dbname")??"").trim(),h.pgsql_username=String(c.get("pgsql_username")??"").trim(),h.pgsql_password=String(c.get("pgsql_password")??"")),Z=!0,pt=null,Nt=null,ft();try{P=await hs("/database",{method:"POST",body:JSON.stringify(h)}),Jt=P.csrfToken||Jt,Nt="Database configured. Installer is locked.",N.event("install.database"),P.completed||P.step}catch(w){pt=w instanceof Error?w.message:"Database setup failed"}finally{Z=!1,ft()}}async function Al(){if(gs){Z=!0,pt=null,Nt=null,ft();try{const s=await hs("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});Nt="Upgrade completed."+(s.messages&&s.messages.length?" "+s.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await Vs()}catch(s){pt=s instanceof Error?s.message:"Upgrade failed"}finally{Z=!1,ft()}}}async function El(s){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),s.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Vs()}catch(c){pt=c instanceof Error?c.message:"Failed to load installer"}ft()}const Ps=document.getElementById("app");if(!Ps)throw new Error("#app missing");const hn=window.location.pathname.replace(/\/+$/,"")||"/";hn==="/portal/install"||hn.endsWith("/portal/install")?El(Ps):bl(Ps);
