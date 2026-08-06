var Br=Object.defineProperty;var jr=(s,c,g)=>c in s?Br(s,c,{enumerable:!0,configurable:!0,writable:!0,value:g}):s[c]=g;var As=(s,c,g)=>jr(s,typeof c!="symbol"?c+"":c,g);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const w of document.querySelectorAll('link[rel="modulepreload"]'))h(w);new MutationObserver(w=>{for(const q of w)if(q.type==="childList")for(const U of q.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&h(U)}).observe(document,{childList:!0,subtree:!0});function g(w){const q={};return w.integrity&&(q.integrity=w.integrity),w.referrerPolicy&&(q.referrerPolicy=w.referrerPolicy),w.crossOrigin==="use-credentials"?q.credentials="include":w.crossOrigin==="anonymous"?q.credentials="omit":q.credentials="same-origin",q}function h(w){if(w.ep)return;w.ep=!0;const q=g(w);fetch(w.href,q)}})();const nn={off:0,error:1,warn:2,info:3,debug:4};let Fa="off";const os="[angaradav-portal]";function zr(s){const c=(s||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function Hr(s){return Fa=zr(s),Fa!=="off"&&console.info(os,`log level = ${Fa}`),Fa}function cn(s){return nn[Fa]>=nn[s]}function as(s,c,g,h){if(!cn(s))return;const w=[os,g];h!==void 0&&w.push(h),console[c](...w)}function Wr(s,c){cn("info")&&(c&&Object.keys(c).length>0?console.info(os,`event:${s}`,c):console.info(os,`event:${s}`))}const N={error(s,c){as("error","error",s,c)},warn(s,c){as("warn","warn",s,c)},info(s,c){as("info","info",s,c)},debug(s,c){as("debug","debug",s,c)},event:Wr};class Ie extends Error{constructor(g,h,w={}){super(g);As(this,"status");As(this,"payload");this.status=h,this.payload=w}}let da="",ns=null,rs=null;function ls(s){da=s&&typeof s=="string"?s:""}function Jr(s){ns=s}function Yr(s){rs=s}function Ts(s){if(!un(s))try{rs==null||rs()}catch{}}function un(s){return s==="/login"||s==="/ui"||s==="/logout"||s==="/install/status"||s.startsWith("/install/")}function is(s,c){if(!un(s)){ls("");try{ns==null||ns(c||"Session timed out. Please sign in again.")}catch{}}}async function _(s,c={}){const g=new Headers(c.headers);c.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const h=(c.method||"GET").toUpperCase();h!=="GET"&&h!=="HEAD"&&h!=="OPTIONS"&&da&&g.set("X-CSRF-Token",da);const w=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${h} ${s}`);const q=await fetch(`/api${s}`,{...c,headers:g,credentials:"same-origin"});let U=null;const F=await q.text();if(F)try{U=JSON.parse(F)}catch{U={error:F}}const W=Math.round((typeof performance<"u"?performance.now():Date.now())-w);if(!q.ok){let ee=`Request failed (${q.status})`,ie={};if(U&&typeof U=="object"&&U!==null){const se=U;ie={...se},typeof se.error=="string"&&(ee=se.error)}else(q.status===500||q.status===504)&&(ee="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw q.status>=500?N.error(`api ← ${h} ${s} ${q.status} (${W}ms)`,ee):q.status!==401?N.warn(`api ← ${h} ${s} ${q.status} (${W}ms)`,ee):(N.debug(`api ← ${h} ${s} 401 (${W}ms)`),is(s,ee)),new Ie(ee,q.status,ie)}return N.info(`api ← ${h} ${s} ${q.status} (${W}ms)`),Ts(s),U}function at(s){return encodeURIComponent(s)}async function rn(s,c,g,h){const w=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});da&&w.set("X-CSRF-Token",da);const q=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${s} (stream, ${g}, ${c.length} bytes)`);let U;try{U=await fetch(`/api${s}`,{method:"POST",headers:w,credentials:"same-origin",body:c})}catch(M){const G=M instanceof Error?M.message:"Network error";throw N.error(`api ← POST ${s} network fail`,G),new Ie(`Import request failed to start (${G}). Check connectivity and container logs.`,0)}const F=(U.headers.get("Content-Type")||"").toLowerCase(),W=F.includes("ndjson")||F.includes("x-ndjson");if(!U.ok&&!W){let M=`Request failed (${U.status})`;try{const G=await U.json();G.error&&(M=G.error)}catch{}throw(U.status===504||U.status===502)&&(M="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),U.status===401?(N.debug(`api ← POST ${s} 401`,M),is(s,M)):N.warn(`api ← POST ${s} ${U.status}`,M),new Ie(M,U.status)}if(!W&&U.ok){try{const M=await U.json();if(M&&typeof M.error=="string")throw new Ie(M.error,U.status||500);if(M&&typeof M.imported=="number"&&typeof M.updated=="number")return N.info(`api ← POST ${s} json done`),M}catch(M){if(M instanceof Ie)throw M}throw new Ie("Unexpected import response from server",500)}if(!U.body)throw new Ie("Import stream unavailable",500);const ee=U.body.getReader(),ie=new TextDecoder;let se="";const te={final:null,error:null,sawProgress:!1},mt=M=>{let G;try{G=JSON.parse(M)}catch{N.debug("import stream non-JSON line",M.slice(0,80));return}if(G.type==="progress"){te.sawProgress=!0;const qe=Number(G.total)||0,je=Number(G.current)||0,Le=typeof G.percent=="number"?G.percent:qe>0?Math.round(100*je/qe):0;h==null||h({percent:Le,current:je,total:qe,imported:Number(G.imported)||0,updated:Number(G.updated)||0,skipped:Number(G.skipped)||0})}else G.type==="done"&&G.result?te.final=G.result:G.type==="error"&&(te.error={message:G.error||"Import failed",status:G.status||500})};for(;;){const{done:M,value:G}=await ee.read();if(M)break;se+=ie.decode(G,{stream:!0});const qe=se.split(`
`);se=qe.pop()??"";for(const je of qe){const Le=je.trim();Le&&mt(Le)}}se.trim()&&mt(se.trim());const B=Math.round((typeof performance<"u"?performance.now():Date.now())-q);if(te.error)throw te.error.status===401?(N.debug(`api ← POST ${s} stream 401 (${B}ms)`,te.error.message),is(s,te.error.message)):N.warn(`api ← POST ${s} stream error (${B}ms)`,te.error.message),new Ie(te.error.message,te.error.status);if(!te.final)throw N.error(`api ← POST ${s} stream incomplete (${B}ms)`,{sawProgress:te.sawProgress}),new Ie(te.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${s} stream done (${B}ms)`),Ts(s),te.final}const A={ui:()=>_("/ui"),installStatus:async()=>{const s=await _("/install/status");return s&&typeof s=="object"&&"data"in s&&s.data?s.data:s},adminPing:()=>_("/admin/ping"),adminDashboard:()=>_("/admin/dashboard"),adminCapabilities:()=>_("/admin/capabilities"),adminUsers:()=>_("/admin/users"),adminUser:s=>_(`/admin/users/${encodeURIComponent(s)}`),adminCreateUser:s=>_("/admin/users",{method:"POST",body:JSON.stringify(s)}),adminUpdateUser:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"PATCH",body:JSON.stringify(c)}),adminDeleteUser:(s,c=!0)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"DELETE",body:JSON.stringify({confirm:c})}),adminUserCalendars:s=>_(`/admin/users/${encodeURIComponent(s)}/calendars`),adminCreateUserCalendar:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/calendars`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserCalendar:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(s,c,g=!0)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:s=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`),adminCreateUserAddressBook:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserAddressBook:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(s,c,g=!0,h=!1)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:h})}),adminSystemSettings:()=>_("/admin/settings/system"),adminUpdateSystemSettings:s=>_("/admin/settings/system",{method:"PATCH",body:JSON.stringify(s)}),adminResetToDefault:(s=!0,c="")=>_("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:s,password:c})}),adminDatabaseSettings:()=>_("/admin/settings/database"),adminTestDatabaseConnection:s=>_("/admin/settings/database/test",{method:"POST",body:JSON.stringify(s)}),adminUpdateDatabaseSettings:s=>_("/admin/settings/database",{method:"PATCH",body:JSON.stringify(s)}),me:async()=>{var c;const s=await _("/me");return ls(s.csrfToken||((c=s.user)==null?void 0:c.csrfToken)),s},login:async(s,c)=>{var h;const g=await _("/login",{method:"POST",body:JSON.stringify({username:s,password:c})});return ls((h=g.user)==null?void 0:h.csrfToken),g},logout:async()=>{try{return await _("/logout",{method:"POST"})}finally{ls("")}},calendars:()=>_("/calendars"),createCalendar:s=>_("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>_("/holidays/countries"),updateCalendar:(s,c)=>_(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:s=>_(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,c,g)=>{const h=new URLSearchParams({from:c,to:g}).toString();return _(`/calendars/${s}/events?${h}`)},getEvent:(s,c)=>_(`/calendars/${s}/events/${at(c)}`),createEvent:(s,c)=>_(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(s,c,g)=>_(`/calendars/${s}/events/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(s,c)=>_(`/calendars/${s}/events/${at(c)}`,{method:"DELETE"}),exportCalendar:async s=>{const c=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const F=await c.json();F.error&&(U=F.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`calendar-${s}.ics`;return{blob:await c.blob(),filename:w}},importCalendar:(s,c,g)=>rn(`/calendars/${s}/import`,c,"text/calendar; charset=utf-8",g),directory:()=>_("/directory"),shares:s=>_(`/calendars/${s}/shares`),share:(s,c,g)=>_(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:c,access:g})}),revoke:(s,c)=>_(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>_("/addressbooks"),createAddressBook:s=>_("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,c)=>_(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(s,c=!1)=>_(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async s=>{const c=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const F=await c.json();F.error&&(U=F.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`contacts-${s}.vcf`;return{blob:await c.blob(),filename:w}},importAddressBook:(s,c,g)=>rn(`/addressbooks/${s}/import`,c,"text/vcard; charset=utf-8",g),contacts:(s,c="")=>{const g=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return _(`/addressbooks/${s}/contacts${g}`)},getContact:(s,c)=>_(`/addressbooks/${s}/contacts/${at(c)}`),createContact:(s,c)=>_(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(s,c,g)=>_(`/addressbooks/${s}/contacts/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(s,c)=>_(`/addressbooks/${s}/contacts/${at(c)}`,{method:"DELETE"}),exportContact:async(s,c)=>{const g=await fetch(`/api/addressbooks/${s}/contacts/${at(c)}/export`,{credentials:"same-origin"});if(!g.ok){let F=`Export failed (${g.status})`;try{const W=await g.json();W.error&&(F=W.error)}catch{}throw new Ie(F,g.status)}const h=g.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(h),q=(w==null?void 0:w[1])||"contact.vcf";return{blob:await g.blob(),filename:q}},contactPhotoUrl:(s,c)=>`/api/addressbooks/${s}/contacts/${at(c)}/photo`,tasks:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/tasks${g}`)},createTask:s=>_("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,c,g)=>_(`/tasks/${s}/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(s,c)=>_(`/tasks/${s}/${at(c)}`,{method:"DELETE"}),bulkTasks:s=>_("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/notes${g}`)},createNote:s=>_("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,c,g)=>_(`/notes/${s}/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(s,c)=>_(`/notes/${s}/${at(c)}`,{method:"DELETE"}),filesStatus:()=>_("/files"),filesList:(s="")=>{const c=new URLSearchParams;s&&c.set("path",s);const g=c.toString()?`?${c}`:"";return _(`/files/entries${g}`)},filesMkdir:(s,c)=>_("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:c})}),filesUpload:async(s,c,g={})=>{const h=new URLSearchParams;s&&h.set("path",s),h.set("name",c.name),g.replace&&h.set("replace","1");const w=new Headers;da&&w.set("X-CSRF-Token",da);const q=new FormData;q.append("file",c,c.name),s&&q.append("path",s);const U=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST /files/upload path=${s||"/"} name=${c.name} size=${c.size}`);const F=await fetch(`/api/files/upload?${h}`,{method:"POST",headers:w,credentials:"same-origin",body:q}),W=await F.text();let ee=null;if(W)try{ee=JSON.parse(W)}catch{ee={error:W}}const ie=Math.round((typeof performance<"u"?performance.now():Date.now())-U);if(!F.ok){let se=`Upload failed (${F.status})`;throw ee&&typeof ee=="object"&&ee!==null&&"error"in ee&&typeof ee.error=="string"&&(se=ee.error),F.status===401?(N.debug(`api ← POST /files/upload 401 (${ie}ms)`,se),is("/files/upload",se)):F.status>=500?N.error(`api ← POST /files/upload ${F.status} (${ie}ms)`,se):N.warn(`api ← POST /files/upload ${F.status} (${ie}ms)`,se),new Ie(se,F.status)}return N.info(`api ← POST /files/upload 200 (${ie}ms)`),Ts("/files/upload"),ee},filesDownloadUrl:s=>{const c=new URLSearchParams;return c.set("path",s),`/api/files/download?${c}`},filesDelete:s=>_("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,c)=>_("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:c})}),filesMove:(s,c,g)=>_("/files/move",{method:"POST",body:JSON.stringify({from:s,to:c,newName:g})}),filesCopy:(s,c={})=>_("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:c.to,newName:c.newName})}),filesBulk:(s,c)=>_("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:c})})},Kr=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let Sa=null;function Gr(){if(Sa)return Sa;try{const s=Intl;if(typeof s.supportedValuesOf=="function"){const c=s.supportedValuesOf("timeZone");if(Array.isArray(c)&&c.length>0)return Sa=[...c].sort((g,h)=>g.localeCompare(h)),Sa}}catch{}return Sa=[...Kr],Sa}function mn(s){const c=s||"UTC",g=Gr(),h=g.includes(c),w=g.map(q=>`<option value="${ln(q)}" ${q===c?"selected":""}>${on(q)}</option>`);return!h&&c&&w.unshift(`<option value="${ln(c)}" selected>${on(c)}</option>`),w.join("")}function ln(s){return s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function on(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ia(s,c,g={}){if(!c)return"";const h=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,w=g.dismissAction??"flash-close",q=g.role??"status",U=g.className?` ${g.className}`:"",F=g.style?` style="${i(g.style)}"`:"",W=h?`<button type="button" class="flash-close" data-action="${i(w)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${i(s)}${U}" role="${i(q)}"${F}>
      <span class="flash-text">${i(c)}</span>
      ${W}
    </div>`}function Qr(s){return s==="sm"?" cal-modal-card-sm":s==="wide"?" cal-modal-card-wide":""}function Xr(s){return s==="danger"?"btn btn-danger":s==="ghost"?"btn btn-ghost":"btn btn-primary"}function pn(s){return s.map(g=>{const h=g.type??"button",w=Xr(g.variant),q=g.disabled?" disabled":"",U=g.id?` id="${i(g.id)}"`:"",F=g.action?` data-action="${i(g.action)}"`:"",W=g.attrs?` ${g.attrs}`:"";return`<button type="${h}" class="${w}"${F}${U}${W}${q}>${i(g.label)}</button>`}).join(`
`)}function De(s){const c=s.titleId||(s.id?`${s.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=s.id?` id="${i(s.id)}"`:"",h=s.className?` ${s.className}`:"",w=s.rootAttrs?` ${s.rootAttrs}`:"",q=`${Qr(s.size)}${s.cardClassName?` ${s.cardClassName}`:""}`,U=s.closeAction,F=s.lockBackdrop?"":` data-action="${i(U)}"`,W=s.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${i(U)}" aria-label="Close">×</button>`;let ee="";s.footer!==void 0&&(ee=typeof s.footer=="string"?s.footer:pn(s.footer));const ie=ee?`<footer class="cal-modal-footer">${ee}</footer>`:"",se=`<div class="cal-modal-body">${s.body}</div>`;let te;return s.form?te=`<form class="stack"${s.formAttrs?` ${s.formAttrs}`:""}>
        ${se}
        ${ie}
      </form>`:te=`${se}
      ${ie}`,`<div class="cal-modal${h}"${g}${w} role="dialog" aria-modal="true" aria-labelledby="${i(c)}">
      <div class="cal-modal-backdrop"${F}></div>
      <div class="cal-modal-card${q}">
        <header class="cal-modal-header">
          <h3 id="${i(c)}">${i(s.title)}</h3>
          ${W}
        </header>
        ${te}
      </div>
    </div>`}function ss(s){const c=s.style==="checkbox"?"checkbox":"admin-delete-confirm",g=s.style==="checkbox"?' style="margin-top:1rem"':"",h=s.id?` id="${i(s.id)}"`:"",w=s.checked?" checked":"",q=s.disabled?" disabled":"";return`<label class="${c}"${g}>
            <input type="checkbox"${h} data-action="${i(s.action)}"${w}${q} />
            ${i(s.label)}
          </label>`}const fn="angaradav-portal-tab",bn="angaradav-portal-admin-page",Zr="2.0.0",el="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function _s(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function ds(s){return s==="overview"||s==="users"||s==="settings"||s==="database"?s:null}function Is(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!s)return{tab:null,adminPage:null,adminUsername:null};if(s==="admin"||s.startsWith("admin/")){const c=s.split("/").filter(Boolean),g=c[1]??"overview",h=ds(g)??"overview";let w=null;if(h==="users"&&c[2])try{w=decodeURIComponent(c[2])}catch{w=c[2]}return{tab:"admin",adminPage:h,adminUsername:w}}return{tab:_s(s),adminPage:null,adminUsername:null}}function tl(){const s=Is().tab;if(s)return s;try{const c=_s(sessionStorage.getItem(fn));if(c)return c}catch{}return"calendars"}function al(){const s=Is().adminPage;if(s)return s;try{const c=ds(sessionStorage.getItem(bn));if(c)return c}catch{}return"overview"}function sl(s,c=null){return s==="overview"?"#admin":s==="users"&&c?`#admin/users/${encodeURIComponent(c)}`:`#admin/${s}`}function dt(s,c="overview",g=null){try{sessionStorage.setItem(fn,s),s==="admin"&&sessionStorage.setItem(bn,c)}catch{}if(typeof history>"u"||typeof location>"u")return;const h=s==="admin"?sl(c,g):`#${s}`;location.hash!==h&&history.replaceState(null,"",`${location.pathname}${location.search}${h}`)}function Es(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(s)}</span>`}function Ns(s){const c=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&c.push(`${s.skipped} skipped`),c.join(", ")}const nl={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function ve(s,c,g="h2"){const h=g;return`<div class="section-title-row">
    <${h}>${i(s)}</${h}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(c)}"
      aria-label="About ${i(s)}" title="About ${i(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function rl(){return`
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
    </div>`}function ll(s){let c=null,g=null,h=tl(),w=al(),q=null,U=!1,F=null,W=null,ee=null,ie=[],se=!1,te=null,mt="",B=Is().adminUsername??null,M=null,G=!1,qe=null,je=!1,Le=!1,pt=null,At=!1,Et=[],Nt=[],Da=!1,We=null,zt=null,st=null,Ht=null,$e=null,Wt=null,Ma=!1,Ca=null,ca=!1,ft=!1,Je="",Jt=null,Va=!1,Aa=null,Yt="sqlite",ua=!1,bt="",ma=null,Oe=!1,pa=null,ne=[],Kt=[],Ba=[],R=null,K=[],Gt=[],ze=null,he=!1,Fe=!1,Me=null,Ye=null,xt={y:new Date().getFullYear(),m:new Date().getMonth()},Qt=[],ms=!1,gt=!1,k=null,nt=!1,O=null,ja="",Ea=null,Ue=[],V=null,$t=[],Xt="",ce=null,I=null,fe=!1,Ce=!1,rt=!1,Ee=null,He=null,Ke=!1,d=!1,j=null,za=null,Ls=!1,fa={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ge=null,Os=900,Na=null,Zt=Zr,ps=!1,Ha=!1;function fs(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();fa={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},Hr(fa.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(Os=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(Zt=e.version.trim())}function bs(){Na!==null&&(clearTimeout(Na),Na=null)}function gs(){if(bs(),!c)return;const e=Math.max(30,Os)*1e3;Na=setTimeout(()=>{Na=null,Ms("Your session timed out. Please sign in again.")},e)}function Wa(){bs(),yt(),j=null,c=null,ne=[],Gt=[],R=null,K=[],Kt=[],Ue=[],V=null,$t=[],ce=null,I=null,fe=!1,Ce=!1,rt=!1,Fe=!1,he=!1,Me=null,Ye=null,gt=!1,k=null,nt=!1,Qt=[],Ne=[],ga=[],_t=[],It=[],Pe=null,lt=null,z=null,re=null,Q=!1,ke=!1,ye=[],ys=null,Re="",xe=[],ya=!1,Se=null,be=null,de=null,ht=!1,ue=[],Ee=null,He=null,Ke=!1,d=!1,Oe=!1,q=null,U=!1,F=null,W=null,ee=null,ie=[],se=!1,te=null,mt="",B=null,M=null,G=!1,qe=null,je=!1,Le=!1,pt=null,At=!1,Et=[],Nt=[],Da=!1,We=null,zt=null,st=null,Ht=null,$e=null,Wt=null,Ma=!1,Ca=null,ca=!1,ft=!1,Je="",Jt=null,Va=!1,Aa=null,Yt="sqlite",ua=!1,bt="",ma=null,Ta()}function we(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function Tt(){return we()?W===null?!0:W.uiEnabled!==!1:!1}function Ve(e){const t=W==null?void 0:W.pages;return t?t.find(a=>a.id===e)??null:null}function ba(e){switch(e){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return e}}function xa(e){return e==="full"||e==="read-only"?"badge-ok":e==="deferred"?"badge-off":"badge-soon"}function Ta(){pa&&(document.removeEventListener("click",pa,!0),pa=null)}function gn(){Ta(),pa=t=>{var l;const a=t.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(Oe=!1,Ta(),m())};const e=pa;setTimeout(()=>{Oe&&pa===e&&document.addEventListener("click",e,!0)},0)}function Us(){h==="admin"&&(!we()||!Tt())&&(h="calendars",w="overview",dt(h))}async function Ps(e,t={}){if(!we()){await Fs("calendars",t);return}h="admin",w=e,e!=="users"?(B=null,M=null,qe=null):t.username!==void 0&&(B=t.username,t.username||(M=null,qe=null)),Oe=!1,dt("admin",e,B),N.event("tab",{tab:"admin",adminPage:e,user:B}),t.clearFlash!==!1&&E(),d=!0,m();try{if(await hs(),!Tt()){h="calendars",dt("calendars"),b("info","Portal Administration UI is disabled.");return}const a=Ve(e);e==="overview"&&(a==null?void 0:a.available)!==!1?await Ja():e==="users"&&(a==null?void 0:a.available)!==!1?(await ea(),B&&(await wt(B),await ta(B))):e==="settings"&&(a==null?void 0:a.available)!==!1?await Ya():e==="database"&&(a==null?void 0:a.available)!==!1&&await Ka()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,m()}}async function hs(){var e;ee=null;try{W=(await A.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:W.uiEnabled,pages:((e=W.pages)==null?void 0:e.length)??0})}catch(t){ee=t instanceof Error?t.message:"Failed to load capabilities",W={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",ee)}}async function Ja(){U=!0,F=null;try{q=(await A.adminDashboard()).data,N.debug("admin.dashboard",{users:q.users,calendars:q.calendars})}catch(e){throw q=null,F=e instanceof Error?e.message:"Failed to load dashboard",e}finally{U=!1}}async function ea(){se=!0,te=null;try{ie=(await A.adminUsers()).users??[],N.debug("admin.users",{count:ie.length})}catch(e){throw ie=[],te=e instanceof Error?e.message:"Failed to load users",e}finally{se=!1}}async function wt(e){G=!0,qe=null;try{const t=await A.adminUser(e);M=t.user,B=t.user.username,N.debug("admin.user",{username:t.user.username})}catch(t){throw M=null,qe=t instanceof Error?t.message:"Failed to load user",t}finally{G=!1}}async function ta(e){Da=!0;try{const[t,a]=await Promise.all([A.adminUserCalendars(e),A.adminUserAddressBooks(e)]);Et=t.calendars??[],Nt=a.addressbooks??[]}catch(t){throw Et=[],Nt=[],t}finally{Da=!1}}async function Ya(){Ma=!0,Ca=null;try{Wt=(await A.adminSystemSettings()).data}catch(e){throw Wt=null,Ca=e instanceof Error?e.message:"Failed to load settings",e}finally{Ma=!1}}async function Ka(){Va=!0,Aa=null;try{const e=await A.adminDatabaseSettings();Jt=e.data,Yt=(e.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(e){throw Jt=null,Aa=e instanceof Error?e.message:"Failed to load database settings",e}finally{Va=!1}}async function hn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),l=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),p=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a||!l||!o||!p){b("error","Username, display name, email, and password are required"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}d=!0,E(),m();try{const r=await A.adminCreateUser({username:a,displayname:l,email:o,password:p,passwordConfirm:n});N.event("admin.user.create",{username:r.user.username}),je=!1,B=r.user.username,M=r.user,dt("admin","users",r.user.username),await ea(),b("success",`Created user “${r.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Create failed")}finally{d=!1,m()}}async function yn(e){var u,f;if(!B)return;const t=B,a=new FormData(e),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim(),p=String(a.get("calendarcolor")??"").trim(),n=((u=e.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,r=((f=e.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;d=!0,E(),m();try{if(We==="create"){const y=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserCalendar(t,{uri:y,displayname:l,description:o,calendarcolor:p||void 0,todos:n,notes:r}),b("success",`Created calendar “${l}”`)}else{const y=Number(a.get("instanceId"));await A.adminUpdateUserCalendar(t,y,{displayname:l,description:o,calendarcolor:p,todos:n,notes:r}),b("success",`Updated calendar “${l}”`)}We=null,zt=null,await ta(t),await wt(t)}catch(y){b("error",y instanceof Error?y.message:"Save failed")}finally{d=!1,m()}}async function vn(e){if(!B)return;const t=B,a=new FormData(e),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim();d=!0,E(),m();try{if(st==="create"){const p=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserAddressBook(t,{uri:p,displayname:l,description:o}),b("success",`Created address book “${l}”`)}else{const p=Number(a.get("id"));await A.adminUpdateUserAddressBook(t,p,{displayname:l,description:o}),b("success",`Updated address book “${l}”`)}st=null,Ht=null,await ta(t),await wt(t)}catch(p){b("error",p instanceof Error?p.message:"Save failed")}finally{d=!1,m()}}function Rs(e){const t=new FormData(e),a=String(t.get("backend")??Yt).toLowerCase()==="pgsql"?"pgsql":"sqlite",l={backend:a};return a==="sqlite"?l.sqlite_file=String(t.get("sqlite_file")??"").trim():(l.pgsql_host=String(t.get("pgsql_host")??"").trim(),l.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),l.pgsql_username=String(t.get("pgsql_username")??"").trim(),l.pgsql_password=String(t.get("pgsql_password")??"")),l}function $n(e){ma=Rs(e),bt="",ua=!0,E(),m()}async function wn(e){if(e||(e=s.querySelector('[data-form="admin-database"]')),!e){b("error","Database form not found"),m();return}const t=Rs(e);d=!0,E(),m();try{const a=await A.adminTestDatabaseConnection(t);b("success",a.message||"Connection successful"),N.event("admin.database.test",{backend:a.backend})}catch(a){b("error",a instanceof Error?a.message:"Connection test failed")}finally{d=!1,m()}}async function kn(e){const t=new FormData(e),a=n=>{var r;return!!((r=e.querySelector(`input[name="${n}"]`))!=null&&r.checked)},l={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(t.get("timezone")??"").trim(),invite_from:String(t.get("invite_from")??"").trim(),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),files_storage_path:String(t.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(t.get("files_max_upload_mb")??0),files_quota_mb:Number(t.get("files_quota_mb")??0),files_quarantine_days:Number(t.get("files_quarantine_days")??0),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),portal_log_level:String(t.get("portal_log_level")??"off"),portal_admin_users:String(t.get("portal_admin_users")??"").trim(),push_external_url:String(t.get("push_external_url")??"").trim(),push_log_level:String(t.get("push_log_level")??"off")},o=String(t.get("admin_password")??""),p=String(t.get("admin_password_confirm")??"");(o!==""||p!=="")&&(l.admin_password=o,l.admin_password_confirm=p),d=!0,E(),m();try{Wt=(await A.adminUpdateSystemSettings(l)).data,N.event("admin.settings.save"),b("success","System settings saved")}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,m()}}async function Sn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),l=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),p=String(t.get("password")??""),n=String(t.get("passwordConfirm")??"");if(!a){b("error","Username is required"),m();return}if(!l||!o){b("error","Display name and email are required"),m();return}if(p!==""||n!==""){if(p===""||n===""){b("error","Password and confirmation are required to change password"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}}d=!0,E(),m();try{const r={displayname:l,email:o};p!==""&&(r.password=p,r.passwordConfirm=n);const u=await A.adminUpdateUser(a,r);N.event("admin.user.update",{username:u.user.username,passwordChanged:p!==""}),Le=!1,M=u.user,B=u.user.username,await ea(),b("success",p!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Update failed")}finally{d=!1,m()}}async function Fs(e,t={}){if(e==="admin"&&(!we()||!Tt())&&(we()&&W&&!W.uiEnabled&&b("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),e="calendars"),e==="admin"){await Ps(w||"overview",{...t,username:w==="users"?B:null});return}h=e,Oe=!1,dt(e),N.event("tab",{tab:e}),e!=="calendars"&&(he=!1,Me=null),e!=="contacts"&&(Ye=null),t.clearFlash!==!1&&E(),d=!0,m();try{e==="contacts"&&V!==null?await Ot(V):e==="calendars"?await Xe():e==="tasks"?await Ut():e==="notes"?await va():e==="files"&&await kt()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,m()}}async function kt(){ya=!0;try{N.debug("loadFiles",{path:Re});const[e,t]=await Promise.all([A.filesStatus(),A.filesList(Re).catch(a=>{if(a instanceof Ie&&(a.status===503||a.status===404))return{path:Re,entries:[]};throw a})]);if(ys=e,e.ready){Re=t.path,xe=t.entries;const a=new Set(xe.map(l=>l.path));ue=ue.filter(l=>a.has(l))}else xe=[],ue=[];N.event("loadFiles",{path:Re,count:xe.length,enabled:e.enabled,ready:e.ready})}finally{ya=!1}}function Ms(e){if(!ps){if(!c){bs();return}ps=!0;try{N.event("session.expired"),Wa(),Ha=!0,g={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},m()}finally{ps=!1}}}let Ne=[],ga=[],_t=[],It=[],Ga="",Qa="",qt="due",St="asc",ha="dtstart",aa="desc",Pe=null,lt=null,z=null,re=null,Q=!1,ke=!1,ye=[],ys=null,Re="",xe=[],ya=!1,Se=null,be=null,de=null,ht=!1,ue=[];function b(e,t){Ha&&e==="error"||(e!=="error"&&(Ha=!1),g={type:e,message:t})}function E(){g=null,Ha=!1}function Dn(e){const t=String(e.step||"");t==="upgrade"||t==="initialize"||t==="permissions"||t==="database"?(ze={step:t,message:e.message||(t==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:e.installUrl||"/portal/install/",productVersion:e.productVersion,configuredVersion:e.configuredVersion??null},typeof e.productVersion=="string"&&e.productVersion.trim()!==""&&(Zt=e.productVersion.trim())):ze=null}function Cn(e){if(!(e instanceof Ie)||e.status!==503)return!1;const t=typeof e.payload.code=="string"?e.payload.code:"";return t!=="upgrade_required"&&t!=="not_configured"&&t!=="admin_password_missing"?!1:(ze={step:t==="upgrade_required"?"upgrade":"initialize",message:e.message,installUrl:typeof e.payload.installUrl=="string"?e.payload.installUrl:"/portal/install/",productVersion:typeof e.payload.productVersion=="string"?e.payload.productVersion:void 0,configuredVersion:typeof e.payload.configuredVersion=="string"?e.payload.configuredVersion:null},ze.productVersion&&(Zt=ze.productVersion),!0)}async function An(){var e,t,a,l;N.event("bootstrap.start"),Jr(o=>{Ms(/timed\s*out|session expired/i.test(o)?o:"Your session timed out. Please sign in again.")}),Yr(()=>{gs()});try{const o=await A.installStatus();Dn(o)}catch(o){N.debug("bootstrap: /api/install/status failed",o instanceof Error?o.message:o)}try{const o=await A.ui();fs(o.ui),typeof o.version=="string"&&o.version.trim()!==""?Zt=o.version.trim():o.ui&&typeof o.ui.version=="string"&&o.ui.version.trim()!==""&&(Zt=o.ui.version.trim()),ze==null||ze.step}catch(o){N.debug("bootstrap: /api/ui failed",o instanceof Error?o.message:o),Cn(o)}if(ze&&ze.step!=="done"&&ze.step!=="locked"){Wa(),N.event("bootstrap.installGate",{step:ze.step}),m();return}try{const o=await A.me();if(c=o.user,fs(o.ui),typeof o.version=="string"&&o.version.trim()!==""&&(Zt=o.version.trim()),N.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),gs(),we())try{await hs()}catch(p){N.warn("admin.capabilities bootstrap",p instanceof Error?p.message:p)}if(Us(),dt(h,w),await Qe(),h==="admin"&&we()&&Tt())try{w==="overview"&&((e=Ve("overview"))==null?void 0:e.available)!==!1?await Ja():w==="users"&&((t=Ve("users"))==null?void 0:t.available)!==!1?(await ea(),B&&(await wt(B),await ta(B))):w==="settings"&&((a=Ve("settings"))==null?void 0:a.available)!==!1?await Ya():w==="database"&&((l=Ve("database"))==null?void 0:l.available)!==!1&&await Ka()}catch(p){N.warn("admin bootstrap load",p instanceof Error?p.message:p)}}catch(o){o instanceof Ie&&o.status===401?(Wa(),/timed\s*out|session expired/i.test(o.message)&&b("info",o.message),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",o instanceof Error?o.message:o),b("error",o instanceof Error?o.message:"Failed to load"))}m()}async function Qe(){N.debug("loadHome");const[e,t,a]=await Promise.all([A.calendars(),A.directory().catch(()=>({users:[]})),A.addressbooks()]);if(ne=e.calendars,Kt=t.users,Ue=a.addressbooks,N.event("loadHome",{calendars:ne.length,addressBooks:Ue.length,directory:Kt.length}),Ba.length===0)try{Ba=(await A.holidayCountries()).countries}catch{Ba=[]}if(K=K.filter(l=>ne.some(o=>o.id===l)),R!==null&&!ne.some(l=>l.id===R)&&(R=null,Gt=[],he=!1,Me=null),K.length===0){const l=Vs();l?(K=[l.id],R=l.id):ne.length>0&&(K=[ne[0].id],R=ne[0].id)}R===null&&K.length>0&&(R=K[0]),R!==null&&he?await _a(R):R!==null&&(Gt=[]),h==="calendars"&&await Xe(),V!==null&&!Ue.some(l=>l.id===V)&&(V=null,$t=[],ce=null,I=null,fe=!1),Ye!==null&&!Ue.some(l=>l.id===Ye)&&(Ye=null),V===null&&Ue.length>0&&(V=Ue[0].id),V!==null&&h==="contacts"&&await Ot(V),h==="tasks"&&await Ut(),h==="notes"&&await va(),h==="files"&&await kt()}async function _a(e){Gt=(await A.shares(e)).shares}function Vs(){const e=ne.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function ge(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),l=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${l}`}function En(e,t){const a=new Date(e,t,1),l=new Date(e,t+1,0);return{from:ge(a),to:ge(l)}}function vs(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,l,o]=e.split("-").map(Number);return new Date(a,l-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,l,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Nn(e){const t=vs(e.start);if(!e.end)return[ge(t)];let a=vs(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const r=new Date(e.end);!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getSeconds()===0&&r.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ge(t)];const l=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(ge(o)),o.setDate(o.getDate()+1);return l.length?l:[ge(t)]}function $s(e,t){const a=e.slice(0,10),l=(t||a).slice(0,10);if(a===l){const $=qa(a);return{start:$.start,end:$.end}}const[o,p,n]=a.split("-").map(Number),[r,u,f]=l.split("-").map(Number),y=Lt(new Date(o,p-1,n,9,0,0,0)),v=Lt(new Date(r,u-1,f,17,0,0,0));return{start:y,end:v}}function xn(e,t){const a=sa(e);let l=t?sa(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const p=vs(t);p.setDate(p.getDate()-1),l=ge(p)}}return{start:a,end:l}}async function Xe(){const e=K.filter(l=>ne.some(o=>o.id===l));if(e.length===0){Qt=[];return}const{from:t,to:a}=En(xt.y,xt.m);ms=!0,N.debug("loadMonthEvents",{selectedIds:e,from:t,to:a});try{const o=(await Promise.all(e.map(async p=>(await A.calendarEvents(p,t,a)).events.map(r=>({...r,instanceId:p}))))).flat();o.sort((p,n)=>{const r=p.start||"",u=n.start||"";return r!==u?r<u?-1:1:(p.summary||"").localeCompare(n.summary||"")}),Qt=o,N.event("monthEvents.loaded",{calendarIds:e,count:Qt.length,from:t,to:a})}catch(l){Qt=[],N.warn("loadMonthEvents failed",l instanceof Error?l.message:l)}finally{ms=!1}}function Tn(e){const t=ne.find(a=>a.id===e);return t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6"}function _n(e){K.includes(e)?(K=K.filter(t=>t!==e),R===e&&(R=K[0]??null)):(K=[...K,e],R=e)}function In(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function qn(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,ws())} ${t}`}function Ln(){const e=ne.filter(x=>K.includes(x.id)),t=e.length===0?"No calendar selected":e.length===1?e[0].displayname:`${e.length} calendars`,a=xt.y,l=xt.m,o=new Date(a,l,1),p=ks(),n=(o.getDay()-p+7)%7,r=new Date(a,l+1,0).getDate(),u=new Date(a,l,0).getDate(),y=ge(new Date),v=Bs(),$=new Map;for(const x of Qt)for(const Y of Nn(x)){const H=$.get(Y)??[];H.push(x),$.set(Y,H)}const T=[],D=Math.ceil((n+r)/7)*7;for(let x=0;x<D;x++){let Y,H=!0,X;x<n?(Y=u-n+x+1,H=!1,X=new Date(a,l-1,Y)):x>=n+r?(Y=x-(n+r)+1,H=!1,X=new Date(a,l+1,Y)):(Y=x-n+1,X=new Date(a,l,Y));const pe=ge(X),Ae=pe===y,Te=H?$.get(pe)??[]:[],vt=Ea===pe?50:3,it=Te.slice(0,vt),Dt=Te.length-it.length,Be=it.map(J=>{var le;const Ze=J.instanceId,_e=qn(J),et=Tn(Ze),oa=((le=ne.find(tt=>tt.id===Ze))==null?void 0:le.displayname)||"",S=oa?`${_e} · ${oa}`:_e;return`<button type="button" class="month-event${J.allDay?"":" is-timed"}" title="${i(S)}" style="--ev-color:${i(et)}"
            data-action="open-event" data-instance="${Ze}" data-uri="${i(J.uri)}" ${d?"disabled":""}>${i(_e)}</button>`}).join(""),Mt=Dt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${i(pe)}" title="Show all events this day" ${d?"disabled":""}>+${Dt} more</button>`:"",Vt=!H&&(Y===1||x===n+r)?X.toLocaleString(void 0,{month:"short",day:"numeric"}):String(Y),C=R!==null?ne.find(J=>J.id===R)??null:null,oe=!!(C&&!C.readOnly&&(C.canShare||C.access==="readwrite"));T.push(`<div class="month-cell${H?"":" is-outside"}${Ae?" is-today":""}${oe?" is-clickable":""}"${oe?` data-action="new-event-day" data-day="${i(pe)}" role="button" tabindex="0" title="Add event on ${i(pe)}"`:""}>
        <div class="month-daynum${Ae?" is-today-num":""}">${i(Vt)}</div>
        <div class="month-events">${Be}${Mt}</div>
      </div>`)}const L=e.length===0?ne.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":ms?'<p class="muted small month-empty-hint">Loading events…</p>':"",ae=e.slice(0,6).map(x=>{const Y=x.color&&x.color.length>=7?x.color.slice(0,7):x.color||"#3B82F6";return`<span class="cal-swatch" style="background:${i(Y)};margin-top:0" title="${i(x.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${d?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${d?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${d?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i(In(a,l))}</h2>
        <span class="month-cal-name muted small" title="${i(t)}">
          ${ae}
          ${i(t)}
        </span>
      </div>
      ${L}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${v.map(x=>`<div class="month-dow">${i(x)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${T.join("")}
        </div>
      </div>
    </section>`}function sa(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ge(t)}function On(){if(fa.timeFormat==="24h")return!1;if(fa.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function ws(){return On()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function ks(){var a;if(fa.weekStart==="monday")return 1;if(fa.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of e)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Bs(){const e=ks(),t=new Date(2024,0,7+e),a=[];for(let l=0;l<7;l++){const o=new Date(t);o.setDate(t.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function js(e,t=15){const a=t*60*1e3,l=e.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function Lt(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Un(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const l=e.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...ws()})}function Ia(e){if(!e){const a=js(new Date);return{date:ge(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ge(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function qa(e){const t=new Date,a=ge(t);if(e&&e!==a){const[p,n,r]=e.split("-").map(Number),u=new Date(p,n-1,r,9,0,0,0),f=new Date(p,n-1,r,10,0,0,0);return{start:Lt(u),end:Lt(f)}}const l=js(t,15),o=new Date(l.getTime()+3600*1e3);return{start:Lt(l),end:Lt(o)}}function Pn(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function na(e){const{field:t,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:r,allowClear:u=!0}=e,f=(O==null?void 0:O.field)===t,y=Un(o,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${i(t)}">
      <span class="dt-field-label">${i(l)}</span>
      <input type="hidden" name="${i(a)}" value="${i(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${i(t)}"
        data-dt-name="${i(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${u?"1":"0"}"
        ${r?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${i(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!r?Rn(t,o,p,u):""}
    </div>`}function Ss(e){var t;return e==="start"?String((k==null?void 0:k.start)||""):e==="end"?String((k==null?void 0:k.end)||""):e==="until"?((t=k==null?void 0:k.repeat)==null?void 0:t.until)||sa(k==null?void 0:k.start)||ge(new Date):e==="due"?$a(z==null?void 0:z.due):e==="dtstart"?$a(re==null?void 0:re.dtstart):e==="bulk-due"?ja:e==="birthday"?String((I==null?void 0:I.birthday)||""):""}function ot(e,t){if(e==="start"&&k){k={...k,start:t||""};return}if(e==="end"&&k){k={...k,end:t};return}if(e==="until"&&k){k={...k,repeat:{...k.repeat??Xa(),until:t,endMode:"until"}};return}if(e==="due"&&z){if(t===null||t==="")z={...z,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))z={...z,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));z={...z,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&re){if(t===null||t==="")re={...re,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))re={...re,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));re={...re,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&I){I={...I,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(ja=t||"")}function Rn(e,t,a,l){const o=Ia(t),p=(O==null?void 0:O.viewY)??Number(o.date.slice(0,4)),n=(O==null?void 0:O.viewM)??Number(o.date.slice(5,7))-1,r=ks(),u=Bs(),y=(new Date(p,n,1).getDay()-r+7)%7,v=new Date(p,n+1,0).getDate(),$=new Date(p,n,0).getDate(),T=o.date,D=o.hm,L=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),ae=[],x=Math.ceil((y+v)/7)*7;for(let H=0;H<x;H++){let X,pe,Ae=!1;H<y?(X=$-y+H+1,pe=new Date(p,n-1,X),Ae=!0):H>=y+v?(X=H-(y+v)+1,pe=new Date(p,n+1,X),Ae=!0):(X=H-y+1,pe=new Date(p,n,X));const Te=ge(pe),vt=Te===T,it=Te===ge(new Date);ae.push(`<button type="button" class="dt-day${Ae?" is-outside":""}${vt?" is-selected":""}${it?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${i(Te)}">${X}</button>`)}const Y=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Pn().map(H=>{const X=(()=>{const[pe,Ae]=H.split(":").map(Number);return new Date(2e3,0,1,pe,Ae).toLocaleTimeString(void 0,ws())})();return`<button type="button" class="dt-time${H===D?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${H}" role="option" aria-selected="${H===D}">${i(X)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${i(L)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(H=>`<span class="dt-dow">${i(H)}</span>`).join("")}</div>
          <div class="dt-days">${ae.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${i(e)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${Y}
      </div>
    </div>`}function Fn(){s.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const l=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let r=l.bottom+6;r+n>window.innerHeight-o&&(r=Math.max(o,l.top-n-6));let u=l.left;u+p>window.innerWidth-o&&(u=Math.max(o,window.innerWidth-p-o)),u<o&&(u=o),a.style.top=`${Math.round(r)}px`,a.style.left=`${Math.round(u)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function Xa(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Mn(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Vn(){if(!gt||!k)return"";const e=k,t=e.repeat??Xa(),a=(t.freq||"").toUpperCase(),l=ne.filter(T=>T.canShare||T.access==="readwrite"),o=ne.filter(T=>T.id===e.instanceId?!0:T.readOnly?!1:T.canShare||T.access==="readwrite").map(T=>`<option value="${T.id}" ${T.id===e.instanceId?"selected":""}>${i(T.displayname)}</option>`).join(""),p=e.readOnly||!e.canWrite;let n,r;if(e.allDay)n=sa(e.start),r=sa(e.end);else{const T=e.start||"",D=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(T)){const L=$s(T,D||null);n=L.start,r=L.end||""}else n=$a(e.start),r=$a(e.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(T=>T.toUpperCase())),y=Mn(t),v=!!a&&y==="until",$=t.until||(y==="until"?sa(e.start)||ge(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${nt?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Rt()}
          ${!nt&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${p?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${p||l.length===0?"disabled":""}>
                ${o||`<option value="${e.instanceId}">${i(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${i(e.summary)}" ${p?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${i(e.location)}" ${p?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${p?"readonly":""}>${i(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${p?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${na({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:p,allowClear:!1})}
              ${na({field:"end",name:"end",label:"End",value:r,dateOnly:e.allDay,disabled:p||v,allowClear:!v})}
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${i(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${u.map(T=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${T.code}" ${f.has(T.code)?"checked":""} />
                              ${T.label}
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
                      ${y==="until"?na({field:"until",name:"repeatUntil",label:"Until",value:$,dateOnly:!0,disabled:p,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${i(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${nt?"Create event":"Save event"}</button>
                     ${nt?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${d?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Bn(e,t){const a=ne.find(l=>l.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:Xa(),readOnly:!1,canWrite:!0}}async function Ot(e){$t=(await A.contacts(e,Xt)).contacts,ce!==null&&!$t.some(a=>a.uri===ce)&&(ce=null,fe||(I=null,Ee=null,He=null,Ke=!1))}async function Ut(){const e=await A.tasks({q:Ga,sort:qt,order:St});Ne=e.tasks,_t=e.calendars;const t=new Set(Ne.map(a=>me(a.instanceId,a.uri)));ye=ye.filter(a=>t.has(a)),Pe!==null&&!Ne.some(a=>`${a.instanceId}|${a.uri}`===Pe)&&(Pe=null,Q||(z=null))}async function va(){const e=await A.notes({q:Qa,sort:ha,order:aa});ga=e.notes,It=e.calendars,lt!==null&&!ga.some(t=>`${t.instanceId}|${t.uri}`===lt)&&(lt=null,ke||(re=null))}function me(e,t){return`${e}|${t}`}function zs(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function $a(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Pt(e,t,a,l,o,p=""){const n=a===t,r=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${i(t)}" role="columnheader" tabindex="0">${i(e)}${r}</th>`}async function jn(e){if(V===null)return;const t=await A.getContact(V,e);ce=e,fe=!1;const a=t.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??Hs(),birthday:a.birthday??null},Ee=a.photoDataUri??(a.hasPhoto&&V!==null?`${A.contactPhotoUrl(V,e)}?t=${Date.now()}`:null),He=null,Ke=!1,Ce=!0}function zn(){fe=!0,ce=null,Ce=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Ee=null,He=null,Ke=!1}function Hs(){return{street:"",city:"",region:"",postal:"",country:""}}function Hn(e){return new Promise((t,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");t(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(e)})}function Ws(e,t={}){const a=!!c&&h==="admin"&&we()&&Tt(),p=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${i(a?"Administration Portal":"User Portal")}</span></span>`,n=c?i(c.displayname||c.username):"",r=Tt()?`<button type="button" class="user-menu-item${h==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",f=c?`<div class="user-menu${Oe?" is-open":""}">
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
              ${r}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",y=c?`<nav class="topnav">
          <a class="brand" href="/portal/">${p}</a>
          <div class="topnav-right">
            ${f}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${p}</a>
        </nav>`,$=!(he||Fe||Me!==null||Ye!==null||gt||Ce||rt)?Rt():"",T=t.tabs&&t.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${t.tabs}
        </div>
      </div>`:"",D=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${i(Zt)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(el)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${y}
      ${T}
    </div>
      <main class="container">
        ${$}
        ${e}
      </main>
      ${D}
      ${rl()}
      ${Wn()}`}function Rt(){return g?ia(g.type,g.message,{dismissible:!0}):""}function Js(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function wa(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),l=t%60;return a>0?`${a}m ${l}s`:`${l}s`}function yt(){za!==null&&(clearInterval(za),za=null)}function Ys(){yt(),za=setInterval(()=>{if(!j||j.phase==="done"||j.phase==="error"){yt();return}j={...j,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},j.phase==="processing"&&Qs(j)},1e3)}function Ft(e,t={}){j&&(j={...j,phase:e,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3),...t},m())}function Ks(){yt(),j=null,m()}function Gs(e){!j||j.phase==="done"||j.phase==="error"||(j={...j,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},Qs(j))}function Qs(e){const t=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),l=s.querySelector(".import-progress-track"),o=s.querySelector("[data-import-counts]"),p=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${p} (${e.processPercent??0}%) · ${wa(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${wa(e.elapsedSec)}`;else return;t&&(t.textContent=n),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),l&&e.processPercent!==null&&(l.setAttribute("aria-valuenow",String(e.processPercent)),l.removeAttribute("aria-valuetext"))}function Wn(){if(!j)return"";const e=j,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const r=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return r.map((y,v)=>{let $="pending";return e.phase==="done"||v<f?$="done":v===f&&($=(e.phase==="error","active")),`<li class="import-step import-step-${$}"><span class="import-step-icon" aria-hidden="true">${$==="done"?"✓":$==="active"?"●":"○"}</span> ${i(y.label)}</li>`}).join("")})();let p="";if(t){let r=null;e.phase==="reading"&&e.readPercent!==null?r=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(r=Math.min(100,Math.max(0,e.processPercent)));const u=r===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=r!==null?` style="width:${r}%"`:"",y=e.kind==="calendar"?"items":"contacts";let v;e.phase==="reading"?v=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?v="Uploading to server…":e.processTotal>0?v=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${y} (${e.processPercent??0}%) · ${wa(e.elapsedSec)}`:v=`Importing on server… ${wa(e.elapsedSec)}`;const $=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${i(a)}</strong> from
          <span class="mono">${i(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${i(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${u}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${i(v)}</p>
        ${$}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?p=`
        ${ia("success",`Success. ${e.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · Took ${i(wa(e.elapsedSec))}
        </p>`:p=`
        ${ia("error",`Failed. ${e.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · After ${i(wa(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':pn([{label:"Close",action:"close-import-progress",variant:"primary"}]);return De({title:l,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:t,lockBackdrop:t,body:p,footer:n})}function Xs(e,t){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?t(Math.min(100,Math.round(p.loaded/p.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(e)})}function Zs(){const e=ze,t=e&&(e.step==="upgrade"||e.step==="initialize"||e.step==="permissions"||e.step==="database"),a=(e==null?void 0:e.installUrl)||"/portal/install/";let l="";if(t&&e){const p=e.step==="upgrade"?"Server upgrade required":"Setup incomplete",n=e.step==="upgrade"&&(e.configuredVersion||e.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${i(String(e.configuredVersion||"—"))}</span>
              → product <span class="mono">${i(String(e.productVersion||"—"))}</span></p>`:"";l=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${i(p)}.</strong>
            ${i(e.message||"Complete the installer before signing in.")}
            ${n}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${i(a)}">Open installer</a>
        </p>`}const o=d||!!t;s.innerHTML=Ws(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${l}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials (not the admin password).</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${o?"disabled":""} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${o?"disabled":""} />
            </label>
            <button type="submit" class="btn btn-primary" ${o?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function Jn(){if(!c){Zs();return}const e=ne.filter(S=>S.canShare),t=ne.filter(S=>!S.canShare),a=ne.find(S=>S.id===R)??null,l=e.map(S=>{const le=K.includes(S.id),tt=le?" is-selected":"",Pa=S.id===R?" is-primary":"",Ds=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Cs=Es(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${i(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${tt}${Pa}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${le?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ds}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${Cs}</span>
            <span class="muted small mono cal-row-uri">${i(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map(S=>{const le=K.includes(S.id),tt=le?" is-selected":"",Pa=S.id===R?" is-primary":"",Ds=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Cs=S.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${tt}${Pa}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${i(Cs)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${le?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ds}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${Es(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
          </span>
        </div>`}).join(""),p=Kt.map(S=>`<option value="${i(S.username)}">${i(S.displayname)} (${i(S.username)})</option>`).join(""),n=Gt.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':Gt.map(S=>`<tr>
                <td>
                  <strong>${i(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${i(S.username||S.href)}</div>
                </td>
                <td>${Es(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(S.href)}" ${d?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),r=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",u=!!(a&&a.readOnly),f=he&&a&&a.canShare?De({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Rt()}
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
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${ve(`Share “${a.displayname}”`,"share")}
                  ${u?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${Kt.length===0?"disabled":""}>
                        <option value="">${Kt.length?"Select user…":"No other users"}</option>
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
                      <button type="submit" class="btn btn-primary" ${d||Kt.length===0?"disabled":""}>Share</button>
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
                    <button type="button" class="btn" data-action="export-cal" ${d?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${d||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${d||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",y=Me!==null?ne.find(S=>S.id===Me&&S.canShare)??null:null,v=y?De({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Rt()}
              <p>You are about to permanently delete <strong>${i(y.displayname)}</strong>
                <span class="muted small mono">(${i(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${ss({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${y.id}"`}]}):"",$=Fe?De({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Rt()}
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
                    ${Ba.map(S=>`<option value="${i(S.code)}">${i(S.name)} (${i(S.code)})</option>`).join("")}
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
              </form>`}):"",T=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ve("Owned","owned")}
            </div>
            <p class="muted small" style="margin:0 0 0.65rem">
              Check one or more calendars to view events.
              Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${ve("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${d?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Ln()}
      </div>
      ${$}
      ${f}
      ${v}
      ${Vn()}`,D=Ue.map(S=>`<div class="cal-row${S.id===V?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="muted small">${S.cardCount} contact${S.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-ab" data-id="${S.id}" ${d?"disabled":""} title="Export as .vcf">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),L=Ue.find(S=>S.id===V)??null,ae=$t.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Xt?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:$t.map(S=>{const le=!fe&&S.uri===ce?" is-selected":"",tt=i((S.displayname||"?").slice(0,1).toUpperCase()),Pa=S.hasPhoto&&V!==null?`<img class="contact-avatar" src="${i(A.contactPhotoUrl(V,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${tt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${tt}</span>`;return`<tr class="contact-table-row${le}" data-action="select-contact" data-uri="${i(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Pa}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${i(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(S.org||"—")}</span></td>
              </tr>`}).join(""),x=I,Y=Array.isArray(x==null?void 0:x.emails)&&x.emails.length>0?x.emails:[""],H=Array.isArray(x==null?void 0:x.phones)&&x.phones.length>0?x.phones:[{type:"cell",value:""}],X=(x==null?void 0:x.address)??Hs(),pe=Y.map((S,le)=>`<div class="multi-row" data-multi="email" data-idx="${le}">
          <input type="email" name="email_${le}" value="${i(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${le}" ${Y.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Ae=H.map((S,le)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${le}">
          <select name="phone_type_${le}" aria-label="Phone type">
            ${["cell","work","home","other"].map(tt=>`<option value="${tt}" ${((S==null?void 0:S.type)??"other")===tt?"selected":""}>${tt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${le}" value="${i((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${le}" ${H.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Te=Array.isArray(x==null?void 0:x.custom)?x.custom:[],vt=Te.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':Te.map((S,le)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${le}">
                <input type="text" name="custom_label_${le}" value="${i(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${le}" value="${i(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${le}" title="Remove">×</button>
              </div>`).join(""),it=Ce&&x&&L?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${fe?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Rt()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${Ee?`<img src="${i(Ee)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((x.fullname||x.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        ${Ee?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${d?"disabled":""} hidden />
                      </label>
                      ${Ee||x.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${d?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${i(x.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${i(x.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${i(x.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${i(x.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${i(x.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${pe}
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
                      <input type="text" name="street" value="${i(X.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${i(X.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${i(X.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${i(X.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${i(X.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${i(x.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${na({field:"birthday",name:"birthday",label:"Birthday",value:x.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${vt}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${Te.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${i(x.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${d?"disabled":""}>${fe?"Create contact":"Save contact"}</button>
                    ${!fe&&x.uri?`<button type="button" class="btn" data-action="export-contact" ${d?"disabled":""}>Export .vcf</button>`:""}
                    ${fe?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${d?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${d?"disabled":""}>Cancel</button>
                    ${!fe&&x.uri?`<span class="muted small mono">${i(x.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",Dt=rt&&L?De({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Rt()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${i(L.uri)} · ${L.cardCount} contact${L.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${i(L.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${i(L.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(L.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ve("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${d?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${d?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",Be=Ye!==null?Ue.find(S=>S.id===Ye)??null:null,Mt=Be?De({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Rt()}
              <p>You are about to permanently delete <strong>${i(Be.displayname)}</strong>
                <span class="muted small mono">(${i(Be.uri)})</span>.</p>
              <p class="muted small">${(Be.cardCount??0)>0?`All ${Be.cardCount} contact${Be.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${ss({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${Be.id}"`}]}):"",Vt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ve("Address books","address-books")}
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
                    ${ve("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${i(Xt)}" aria-label="Search contacts" ${d?"disabled":""} />
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
      ${Mt}
      ${Dt}
      ${it}`,C=h==="calendars"?"my-calendars":h==="contacts"?"my-contacts":h==="tasks"?"tasks":h==="notes"?"notes":h==="files"?"files":"administration",oe=pr(),J=fr(),Ze=Gn(),_e=dr(),et=h==="calendars"?T:h==="contacts"?Vt:h==="tasks"?oe:h==="notes"?J:h==="files"?Ze:_e,oa=h==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${Qn()}
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
        </div>`;s.innerHTML=Ws(et,{tabs:oa}),document.body.classList.toggle("cal-modal-open",he||Fe||Me!==null||Ye!==null||gt||Ce||rt||j!==null||Se!==null||be!==null||de!==null||ht||je||Le||pt!==null||ca||ua||We!==null||st!==null||$e!==null),document.body.classList.toggle("layout-contacts",h==="contacts"),document.body.classList.toggle("layout-calendars",h==="calendars"),document.body.classList.toggle("layout-tasks",h==="tasks"||h==="notes"),document.body.classList.toggle("layout-files",h==="files"),document.body.classList.toggle("layout-admin",h==="admin")}function Yn(e){const t=e?e.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${d?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${i(p)}" ${d?"disabled":""}>${i(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function ka(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Kn(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function Gn(){const e=ys;if(!e)return`<div class="card"><p class="muted">${ya||d?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
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
          <p class="flash flash-error" style="margin-top:0.75rem">${i(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${i(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${ka(e.usedBytes)} used · ${ka(e.availableBytes)} free of ${ka(e.quotaBytes)}`:`${ka(e.usedBytes)} used · ${ka(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,l=ue.length,o=xe.length>0&&xe.every($=>ue.includes($.path)),p=l>0,n=l>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${l} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${d?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${d?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${d?"disabled":""}>Delete</button>
            </div>
          </div>`:"",r=xe.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':xe.map($=>{const T=ue.includes($.path),D=$.type==="dir"?"📁":"📄",L=$.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${i($.path)}" ${d?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${D}</span>${i($.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${D}</span>${i($.name)}</span>`,ae=$.type==="dir"?"—":ka($.size);return`<tr class="files-row${T?" is-checked":""}" data-path="${i($.path)}" data-type="${$.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${i($.path)}"
                    ${T?"checked":""} ${d?"disabled":""}
                    aria-label="Select ${i($.name)}" />
                </td>
                <td class="files-col-name">${L}</td>
                <td class="files-col-size mono">${ae}</td>
                <td class="files-col-mtime hide-sm">${i(Kn($.mtime))}</td>
                <td class="files-col-actions">
                  ${$.type==="file"?`<a class="btn btn-ghost btn-small" href="${i(A.filesDownloadUrl($.path))}" download="${i($.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${i($.path)}" ${d?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${i($.path)}" ${d?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${i($.path)}" data-name="${i($.name)}" ${d?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${i($.path)}" data-name="${i($.name)}" ${d?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),u=Se!==null?(()=>{const $=xe.find(D=>D.path===Se),T=($==null?void 0:$.name)??"";return De({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${i(Se)}" />
                    <label>New name
                      <input type="text" name="newName" value="${i(T)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:d}]})})():"",f=be!==null&&be.length>0?(()=>{const $=be,T=$.length>1,D=xe.find(x=>x.path===$[0]),L=T?`Delete ${$.length} items`:`Delete ${(D==null?void 0:D.type)==="dir"?"folder":"file"}`,ae=T?`<p style="margin:0 0 0.75rem">Delete <strong>${$.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${$.slice(0,12).map(x=>{const Y=xe.find(H=>H.path===x);return`<li><span class="mono">${i((Y==null?void 0:Y.name)??x)}</span></li>`}).join("")}
                   ${$.length>12?`<li>…and ${$.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${i((D==null?void 0:D.name)??$[0])}</strong>?${(D==null?void 0:D.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return De({id:"files-delete-modal",title:L,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:ae,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:d}]})})():"",y=de!==null&&de.paths.length>0?(()=>{const $=de.op,T=de.paths,D=T.length>1,L=xe.find(H=>H.path===T[0]),ae=(L==null?void 0:L.name)??Za(T[0]),x=D?`${$==="copy"?"Copy":"Move"} ${T.length} items`:`${$==="copy"?"Copy":"Move"} ${(L==null?void 0:L.type)==="dir"?"folder":"file"}`,Y=Re;return De({id:"files-transfer-modal",title:x,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"sm",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${D?`<p class="muted small" style="margin:0 0 0.75rem">${T.length} items will be ${$==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${i(ae)}</span></p>`}
                    <label>Destination folder
                      <input type="text" name="toPath" value="${i(Y)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${D?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${i(ae)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${$==="copy"?"Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination).":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:$==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:d}]})})():"",v=ht?De({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${i(Re===""?"Home":Re)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:d}]}):"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${ve("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${i(t)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${Yn(Re)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${d||ya?"disabled":""}>Refresh</button>
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
                    ${o?"checked":""}
                    ${p&&!o?"data-indeterminate=1":""}
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
              ${ya&&xe.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':r}
            </tbody>
          </table>
        </div>
      </section>
      ${u}
      ${f}
      ${y}
      ${v}
    </div>`}function Za(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function Qn(){const e=["overview","settings","users","database"],t={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=W==null?void 0:W.pages,l=new Map;if(a)for(const o of a)ds(o.id)&&l.set(o.id,o);return e.map(o=>{const p=l.get(o),n=(p==null?void 0:p.label)||t[o],r=(p==null?void 0:p.status)??(o==="overview"?"read-only":"full"),u=(p==null?void 0:p.available)===!1;return`<button type="button" role="tab" class="tab-btn${w===o?" is-active":""}${u?" is-gated":""}"
            data-action="admin-page" data-admin-page="${o}"
            aria-selected="${w===o}"
            title="${i(n)}${u?" — "+ba(r):""}">
            ${i(n)}
          </button>`}).join("")}function es(e){const t=Ve(e),a=(t==null?void 0:t.status)??"coming-soon",l=(t==null?void 0:t.label)??e,o=(t==null?void 0:t.summary)||"This area is not available in portal Administration yet.",p=ba(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${xa(a)}">${i(p)}</span>
        <h2 class="admin-coming-soon-title">${i(l)}</h2>
      </div>
      <p class="muted">${i(o)}</p>
    </section>`}function ra(e,t){return`<span class="badge ${e?"badge-ok":"badge-off"}">${i(t)}: ${e?"On":"Off"}</span>`}function la(e){return`<span class="badge ${e?"badge-ok":"badge-off"}">${e?"On":"Off"}</span>`}function La(e,t,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${i(String(t))}</div>
      <div class="admin-stat-label">${i(e)}</div>
      ${a?`<div class="admin-stat-hint muted small">${i(a)}</div>`:""}
    </div>`}function Xn(){const e=Ve("overview");if(e&&e.available===!1)return es("overview");const t=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${i((c==null?void 0:c.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",l="";if(U&&!q)l='<section class="card"><p class="muted">Loading overview…</p></section>';else if(F&&!q)l=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${i(F)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d?"disabled":""}>Retry</button>
      </section>`;else if(q){const o=q,p=o.services,n=o.links??{},r=e?`<span class="badge ${xa(e.status)}">${i(ba(e.status))}</span>`:"",u=o.version?i(o.version):"—",f=o.git?i(o.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${ve("About this system","admin-overview")}
            <div class="section-actions">
              ${r}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d||U?"disabled":""}>Refresh</button>
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
                    <tr><td>Administration</td><td>${la(p.administration!==!1&&p.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${la(!!p.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${la(!!p.carddav)}</td></tr>
                    <tr><td>Files</td><td>${la(!!p.files)}</td></tr>
                    <tr><td>Tasks</td><td>${la(!!p.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${la(!!p.notes)}</td></tr>
                    <tr><td>Push</td><td>${la(!!p.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${t}
        </section>`;const y=o.nbusers??o.users,v=o.nbcalendars??o.calendars,$=o.nbevents??o.events,T=o.nbbooks??o.addressBooks,D=o.nbcontacts??o.contacts;l=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${La("Registered users",y,"Users")}
            ${La("Calendars",v,"CalDAV")}
            ${La("Events",$,"CalDAV")}
            ${La("Address books",T,"CardDAV")}
            ${La("Contacts",D,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${ra(p.administration!==!1&&p.webAdmin!==!1,"Administration")}
            ${ra(!!p.caldav,"CalDAV")}
            ${ra(!!p.carddav,"CardDAV")}
            ${ra(!!p.files,"Files")}
            ${ra(!!p.tasks,"Tasks")}
            ${ra(!!p.notes,"Notes")}
            ${ra(!!p.push,"Push")}
          </div>
        </section>`}else l=`<section class="card">
        ${ve("System snapshot","admin-overview")}
        ${t}
      </section>`;return`${a}
      ${l}`}function Zn(){const e=mt.trim().toLowerCase();return e?ie.filter(t=>t.username.toLowerCase().includes(e)||(t.displayname||"").toLowerCase().includes(e)||(t.email||"").toLowerCase().includes(e)):ie}function er(){return je?De({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:d},{label:"Create user",type:"submit",variant:"primary",disabled:d}]}):""}function tr(){if(!Le||!M)return"";const e=M;return De({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
          <p class="muted small">Username <span class="mono">${i(e.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${i(e.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${i(e.displayname)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${i(e.email)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${d?"disabled":""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${d?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:d},{label:"Save changes",type:"submit",variant:"primary",disabled:d}]})}function ar(){if(!pt)return"";const e=pt,t=M&&M.username.toLowerCase()===e.toLowerCase()?M:ie.find(l=>l.username.toLowerCase()===e.toLowerCase())??null,a=t?`${t.displayname||t.username} (${t.username})`:e;return De({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${i(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${ss({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:At,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:d},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:d||!At,attrs:`data-username="${i(e)}"`}]})}function sr(){if(!B)return"";if(G&&!M)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${i(B)}</span>…</p>
      </section>`;if(qe&&!M)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${i(qe)}</p>
      </section>`;if(!M)return"";const e=M,t=Da&&Et.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':Et.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':Et.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${i(u.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${i(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=Da&&Nt.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':Nt.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':Nt.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${i(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),l=zt!==null?Et.find(u=>u.instanceId===zt)??null:null,o=Ht!==null?Nt.find(u=>u.id===Ht)??null:null,p=We==="create"||We==="edit"&&l?De({title:We==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${l?l.instanceId:""}" />
            ${We==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${d?"disabled":""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`:`<p class="muted small">URI <span class="mono">${i(l.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((l==null?void 0:l.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${i((l==null?void 0:l.description)??"")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${i((l==null?void 0:l.calendarcolor)??"")}" ${d?"disabled":""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${l!=null&&l.todos||We==="create"?"checked":""} ${d?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${l!=null&&l.notes?"checked":""} ${d?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",n=st==="create"||st==="edit"&&o?De({title:st==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${o?o.id:""}" />
            ${st==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${d?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${i(o.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((o==null?void 0:o.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${i((o==null?void 0:o.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",r=$e?De({title:`Delete ${$e.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${i($e.label)}</strong> for <span class="mono">${i(e.username)}</span>?</p>
          ${$e.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${$e.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:d}]}):"";return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${i(e.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${i(e.username)}" ${d?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${i(e.username)}" ${d?"disabled":""}>Delete</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
      </div>
      <p class="muted small admin-breadcrumb">Users → <span class="mono">${i(e.username)}</span></p>
      <dl class="admin-dl">
        <div><dt>Username</dt><dd class="mono">${i(e.username)}</dd></div>
        <div><dt>Display name</dt><dd>${i(e.displayname||"—")}</dd></div>
        <div><dt>Email</dt><dd>${e.email?`<a href="mailto:${i(e.email)}">${i(e.email)}</a>`:"—"}</dd></div>
        <div><dt>Principal</dt><dd class="mono">${i(e.principal)}</dd></div>
        <div><dt>Calendars</dt><dd>${i(String(e.calendarCount))}</dd></div>
        <div><dt>Events / objects</dt><dd>${i(String(e.eventCount))}</dd></div>
        <div><dt>Address books</dt><dd>${i(String(e.addressBookCount))}</dd></div>
        <div><dt>Contacts</dt><dd>${i(String(e.contactCount))}</dd></div>
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
    ${p}${n}${r}`}function nr(){const e=Ve("users");if(e&&e.available===!1)return es("users");const t=Zn(),a=se&&ie.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':t.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${te?i(te):mt.trim()?"No users match this filter.":"No users found."}</td></tr>`:t.map(l=>`<tr class="contact-table-row${B&&B.toLowerCase()===l.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${i(l.username)}" tabindex="0" role="button">
                  <td class="mono">${i(l.username)}</td>
                  <td class="hide-sm">${i(l.displayname||"—")}</td>
                  <td class="hide-sm">${i(l.email||"—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${i(l.username)}" ${d?"disabled":""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${i(l.username)}" ${d?"disabled":""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${i(l.username)}" ${d?"disabled":""}>Delete</button>
                  </td>
                </tr>`).join("");return`
      <section class="card">
        <div class="section-header">
          ${ve("Users","admin-users")}
          <div class="section-actions">
            ${e?`<span class="badge ${xa(e.status)}">${i(ba(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${d||se?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${d?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${i(mt)}" aria-label="Filter users" ${d?"disabled":""} />
          <span class="muted small">${i(String(t.length))}${mt.trim()?` / ${ie.length}`:""} user${t.length===1?"":"s"}</span>
        </div>
        ${te&&ie.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${i(te)}</p>`:""}
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
      ${sr()}
      ${er()}
      ${tr()}
      ${ar()}`}function rr(){const e=Ve("settings");if(e&&e.available===!1)return es("settings");if(Ma&&!Wt)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(Ca&&!Wt)return`<section class="card">
        <p class="flash flash-error">${i(Ca)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const t=Wt;if(!t)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(o,p,n)=>`<label class="check-row"><input type="checkbox" name="${i(o)}" ${p?"checked":""} ${d||t.writable===!1?"disabled":""} /> ${i(n)}</label>`,l=(o,p,n,r="")=>`<label>${i(n)}
        <input type="number" name="${i(o)}" value="${i(String(p??0))}" ${d||t.writable===!1?"disabled":""} />
        ${r?`<span class="muted small">${i(r)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${ve("System settings","admin-settings")}
          <div class="section-actions">
            ${e?`<span class="badge ${xa(e.status)}">${i(ba(e.status))}</span>`:""}
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
              ${["Digest","Basic","Apache"].map(o=>`<option value="${o}" ${t.dav_auth_type===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${d||t.writable===!1?"disabled":""}>
              ${mn(t.timezone||"UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${i(t.invite_from||"")}" placeholder="noreply@example.com" ${d||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${a("files_enabled",!!t.files_enabled,"Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${i(t.files_storage_path||"")}" placeholder="empty = Specific/files" ${d||t.writable===!1?"disabled":""} />
          </label>
          ${l("files_max_upload_mb",t.files_max_upload_mb,"Max file size (MB)")}
          ${l("files_quota_mb",t.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${l("files_quarantine_days",t.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${l("session_max_age_minutes",t.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${d||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(o=>`<option value="${o}" ${(t.portal_log_level||"off")===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          ${a("portal_admin_ui_enabled",t.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${i(Array.isArray(t.portal_admin_users)?t.portal_admin_users.join(", "):String(t.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${d||t.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${a("push_enabled",!!t.push_enabled,"Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${i(t.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${d||t.writable===!1?"disabled":""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${d||t.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(o=>`<option value="${o}" ${(t.push_log_level||"off")===o?"selected":""}>${o}</option>`).join("")}
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
      ${lr()}`}function lr(){return ca?De({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${ss({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:ft,disabled:d,style:"admin"})}
          <label style="margin-top:1rem">Your portal password
            <input type="password" data-action="admin-reset-password" value="${i(Je)}"
              autocomplete="current-password" placeholder="Re-enter password to confirm" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:d},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:d||!ft||Je.trim()===""}]}):""}function or(){const e=Ve("database");if(e&&e.available===!1)return es("database");if(Va&&!Jt)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(Aa&&!Jt)return`<section class="card">
        <p class="flash flash-error">${i(Aa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const t=Jt;if(!t)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=Yt,l=t.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${ve("Database","admin-database")}
          <div class="section-actions">
            ${e?`<span class="badge ${xa(e.status)}">${i(ba(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${d?"disabled":""}>Refresh</button>
          </div>
        </div>
        <p class="flash flash-info" style="margin-bottom:1rem">${i(t.warning)}</p>
        <dl class="admin-dl admin-dl-stack">
          <div>
            <dt>Current backend</dt>
            <dd><span class="badge badge-admin">${i((t.backend||"—").toUpperCase())}</span></dd>
          </div>
          ${t.backend==="sqlite"||t.sqlite_file?`<div>
            <dt>SQLite file</dt>
            <dd class="mono admin-dl-path">${i(t.sqlite_file||"—")}</dd>
          </div>`:""}
          ${t.backend==="pgsql"||t.pgsql_host?`<div>
            <dt>PostgreSQL</dt>
            <dd class="mono admin-dl-path">${i(t.pgsql_host||"—")} / ${i(t.pgsql_dbname||"—")} · ${i(t.pgsql_username||"—")}</dd>
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
        ${l?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
        <form class="stack admin-database-form" data-form="admin-database">
          <label>Backend
            <select name="backend" data-action="admin-db-backend" ${d||l?"disabled":""}>
              <option value="sqlite" ${a==="sqlite"?"selected":""}>SQLite</option>
              <option value="pgsql" ${a==="pgsql"?"selected":""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${a==="sqlite"?"":"display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${i(t.sqlite_file||"")}" ${d||l?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${i(t.pgsql_host||"")}" placeholder="localhost:5432" ${d||l?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${i(t.pgsql_dbname||"")}" ${d||l?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${i(t.pgsql_username||"")}" autocomplete="off" ${d||l?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${t.hasPassword?"Leave blank to keep current":""}" ${d||l?"disabled":""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${d||l?"disabled":""}>Test connection</button>
            <button type="submit" class="btn btn-primary" ${d||l?"disabled":""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${ir()}`}function ir(){if(!ua)return"";const e=bt.trim()==="CONFIRM";return De({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${i(bt)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:d},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:d||!e}]})}function dr(){return we()?Tt()?w==="users"?nr():w==="settings"?rr():w==="database"?or():Xn():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function cr(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,y)=>[me(f.instanceId,f.uri),y])),l=new Map,o=[];for(const f of e){const y=f.parentUid;if(y&&t.has(y)&&y!==f.uid){const v=l.get(y)??[];v.push(f),l.set(y,v)}else o.push(f)}const p=(f,y)=>(a.get(me(f.instanceId,f.uri))??0)-(a.get(me(y.instanceId,y.uri))??0);o.sort(p);for(const[,f]of l)f.sort(p);const n=[],r=new Set,u=(f,y)=>{const v=f.uid||me(f.instanceId,f.uri);if(!r.has(v)){r.add(v),n.push({task:f,depth:Math.min(y,8)});for(const $ of l.get(f.uid)??[])u($,y+1);r.delete(v)}};for(const f of o)u(f,0);for(const f of e)n.some(y=>y.task===f)||n.push({task:f,depth:0});return n}function ur(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const l of Ne)l.parentUid&&t.has(l.parentUid)&&l.uid&&!t.has(l.uid)&&(t.add(l.uid),a=!0)}return t}function mr(e,t){const a=e.instanceId,l=t||!e.uid?new Set:ur(e.uid),o=Ne.filter(r=>r.uid&&r.instanceId===a&&!l.has(r.uid)&&r.uid!==e.uid),p=e.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(r=>`<option value="${i(r.uid)}" ${r.uid===p?"selected":""}>${i(r.summary||r.uid)}</option>`)];if(p&&!o.some(r=>r.uid===p)){const r=Ne.find(u=>u.uid===p);n.push(`<option value="${i(p)}" selected>${i((r==null?void 0:r.summary)||p)} (current)</option>`)}return n.join("")}function en(){const e=new Set(ye);return Ne.filter(t=>e.has(me(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function pr(){const e=D=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[D]||D,t=cr(Ne),a=Ne.filter(D=>D.canWrite&&!D.readOnly).map(D=>me(D.instanceId,D.uri)),l=a.length>0&&a.every(D=>ye.includes(D)),o=ye.length>0,n=en().length,r=Ne.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Ga?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:D,depth:L})=>{const ae=me(D.instanceId,D.uri),x=!Q&&ae===Pe?" is-selected":"",Y=ye.includes(ae),H=D.status==="COMPLETED"?"badge-ok":D.status==="CANCELLED"?"":"badge-admin",X=L>0?` style="--task-depth:${L}"`:"",pe=L>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",Ae=D.canWrite&&!D.readOnly;return`<tr class="contact-table-row task-row${L>0?" is-subtask":""}${x}${Y?" is-checked":""}" data-action="select-task" data-instance="${D.instanceId}" data-uri="${i(D.uri)}" tabindex="0" role="button"${X}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${D.instanceId}" data-uri="${i(D.uri)}"
                    ${Y?"checked":""} ${Ae?"":"disabled"} aria-label="Select ${i(D.summary||D.uri)}" ${d?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${pe}<span class="contact-name-primary">${i(D.summary||D.uri)}</span></span>
                  ${D.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${H}">${i(e(D.status))}</span></td>
                <td class="col-task-due muted small">${i(zs(D.due))}</td>
                <td class="col-task-cal muted small">${i(D.calendarName)}</td>
                <td class="col-task-pct muted small">${D.percent?i(String(D.percent))+"%":"—"}</td>
              </tr>`}).join(""),u=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(D,L)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${D}"
        title="${i(L)}" aria-label="${i(L)}" ${d||n===0?"disabled":""}>${u}</button>`,y=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${ye.length!==n?`<span class="muted small bulk-bar-count-extra">(${ye.length-n} read-only skipped)</span>`:""}
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
                ${f("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${na({field:"bulk-due",name:"bulkDue",label:"Due",value:ja,dateOnly:!1,disabled:d||n===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${d||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${d||n===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${d||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${d?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",v=z,$=_t.map(D=>`<option value="${D.id}" ${v&&v.instanceId===D.id?"selected":""}>${i(D.displayname)}</option>`).join(""),T=v?`<div class="card">
            ${ve(Q?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${Q?`<label>Calendar
                      <select name="instanceId" required ${_t.length===0?"disabled":""}>
                        <option value="">${_t.length?"Select calendar…":"No writable calendars"}</option>
                        ${$}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(v.calendarName)}</strong>${v.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(v.summary)}" ${v.readOnly&&!Q?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${v.readOnly&&!Q?"readonly":""}>${i(v.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${v.readOnly&&!Q?"disabled":""}>
                  ${mr(v,Q)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${v.readOnly&&!Q?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(D=>`<option value="${D}" ${v.status===D?"selected":""}>${i(e(D))}</option>`).join("")}
                  </select>
                </label>
                ${na({field:"due",name:"due",label:"Due",value:$a(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!Q),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${i(String(v.priority||0))}" ${v.readOnly&&!Q?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${i(String(v.percent||0))}" ${v.readOnly&&!Q?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${Q||v.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${Q?"Create task":"Save task"}</button>`:""}
                ${!Q&&v.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${d?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${d?"disabled":""}>Delete</button>`:Q?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ve("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(Ga)}" aria-label="Search tasks" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${d||_t.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${_t.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||d?"disabled":""} />
                </th>
                ${Pt("Title","summary",qt,St,"task","col-task-title")}
                ${Pt("Status","status",qt,St,"task","col-task-status")}
                ${Pt("Due","due",qt,St,"task","col-task-due")}
                ${Pt("Calendar","calendar",qt,St,"task","col-task-cal")}
                ${Pt("%","percent",qt,St,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${r}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function fr(){const e=ga.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${Qa?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:ga.map(o=>{const p=me(o.instanceId,o.uri),n=!ke&&p===lt?" is-selected":"",r=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${i(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(o.summary||o.uri)}</span>
                  ${r?`<span class="muted small contact-name-secondary">${i(r)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(zs(o.dtstart))}</td>
                <td class="col-note-cal muted small">${i(o.calendarName)}</td>
              </tr>`}).join(""),t=re,a=It.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${i(o.displayname)}</option>`).join(""),l=t?`<div class="card">
            ${ve(ke?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${ke?`<label>Calendar
                      <select name="instanceId" required ${It.length===0?"disabled":""}>
                        <option value="">${It.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(t.summary)}" ${t.readOnly&&!ke?"readonly":""} />
              </label>
              ${na({field:"dtstart",name:"dtstart",label:"Date",value:$a(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!ke),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!ke?"readonly":""}>${i(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${ke||t.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ke?"Create note":"Save note"}</button>`:""}
                ${!ke&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${d?"disabled":""}>Delete</button>`:ke?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ve("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(Qa)}" aria-label="Search notes" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${d||It.length===0?"disabled":""}>Add note</button>
        </div>
        ${It.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Pt("Title","summary",ha,aa,"note","col-note-title")}
                ${Pt("Date","dtstart",ha,aa,"note","col-note-date")}
                ${Pt("Calendar","calendar",ha,aa,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function br(){const e=s.querySelector(".contacts-table-wrap"),t=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function gr(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=s.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=s.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=s.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function m(){const e=br();c?Jn():Zs(),hr(),gr(e),requestAnimationFrame(()=>{var t;Fn(),(t=s.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function tn(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(t.value=l.slice(0,7),a.value=l.toUpperCase())}))}function hr(){s.querySelectorAll("[data-action]").forEach(C=>{C.addEventListener("click",oe=>{const J=oe.target.closest("[data-action]");((J==null?void 0:J.dataset.action)==="info"||(J==null?void 0:J.dataset.action)==="info-close")&&(oe.preventDefault(),oe.stopPropagation()),Ir(oe)})}),Ta(),Oe&&gn(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(C=>{C.addEventListener("keydown",oe=>{(oe.key==="Enter"||oe.key===" ")&&(oe.preventDefault(),C.click())})});const e=s.querySelector("#delete-cal-confirm"),t=s.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||d)});const a=s.querySelector("#delete-ab-confirm"),l=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||d)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(C=>{C.addEventListener("error",()=>{const oe=C.dataset.avatarFallback||"?",J=document.createElement("span");J.className="contact-avatar contact-avatar-fallback",J.setAttribute("aria-hidden","true"),J.textContent=oe,C.replaceWith(J)})}),Ls||(document.addEventListener("keydown",C=>{if(C.key==="Escape"){if(j&&(j.phase==="done"||j.phase==="error")){Ks();return}if(!j){if(Oe){Oe=!1,Ta(),m();return}if(Se!==null||be!==null||de!==null||ht){Se=null,be=null,de=null,ht=!1,m();return}an()}}}),Ls=!0);const o=s.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",C=>{C.preventDefault(),Sr(o)});const p=s.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",C=>{C.preventDefault(),Dr(p)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",C=>{C.preventDefault(),Ar(n)});const r=s.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",C=>{C.preventDefault(),Cr(r)}),ht&&requestAnimationFrame(()=>{var C;(C=r==null?void 0:r.querySelector('input[name="name"]'))==null||C.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(C=>{C.addEventListener("change",()=>{Er(C)})}),s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(C=>{C.indeterminate=!0});const u=s.querySelector('[data-form="share"]');u==null||u.addEventListener("submit",C=>{C.preventDefault(),Nr(u)});const f=s.querySelector('[data-form="edit-cal"]');f&&(tn(f),f.addEventListener("submit",C=>{C.preventDefault(),Tr(f)}));const y=s.querySelector('[data-form="edit-event"]');y==null||y.addEventListener("submit",C=>{C.preventDefault(),xr(y)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(C=>{C.addEventListener("change",()=>{if(!k)return;const oe=s.querySelector('[data-form="edit-event"]');if(!oe)return;const J=new FormData(oe),Ze=oe.querySelector('input[name="allDay"]'),_e=Ua(J);_e.endMode==="until"&&!_e.until&&(_e.until=sa(String(J.get("start")??k.start??""))||ge(new Date)),k={...k,summary:String(J.get("summary")??k.summary),description:String(J.get("description")??k.description),location:String(J.get("location")??k.location),instanceId:Number(J.get("instanceId"))||k.instanceId,allDay:(Ze==null?void 0:Ze.checked)??k.allDay,start:String(J.get("start")??k.start??""),end:String(J.get("end")??k.end??"")||null,repeat:_e,hasRrule:!!String(J.get("repeatFreq")??"").trim()},_e.freq&&_e.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),m(),_e.endMode==="until"&&requestAnimationFrame(()=>{var oa;const et=s.querySelector('input[name="repeatUntil"]');et==null||et.focus();try{(oa=et==null?void 0:et.showPicker)==null||oa.call(et)}catch{}})})});const v=s.querySelector('[data-form="create-cal"]');v&&(tn(v),v.addEventListener("submit",C=>{C.preventDefault(),_r(v)}));const $=s.querySelector('[data-form="create-ab"]');$==null||$.addEventListener("submit",C=>{C.preventDefault(),Pr($)});const T=s.querySelector('[data-form="edit-ab"]');T==null||T.addEventListener("submit",C=>{C.preventDefault(),Rr(T)});const D=s.querySelector('[data-form="contact"]');D==null||D.addEventListener("submit",C=>{C.preventDefault(),Ur(D)});const L=s.querySelector('[data-form="task"]');if(L==null||L.addEventListener("submit",C=>{C.preventDefault(),vr(L)}),L){const C=L.querySelector('select[name="instanceId"]');C==null||C.addEventListener("change",()=>{if(!Q||!z)return;const oe=Number(C.value);if(!Number.isFinite(oe)||oe<=0)return;const J=new FormData(L),Ze=String(J.get("due")??"").trim();z={...z,instanceId:oe,parentUid:z.parentUid&&Ne.some(_e=>_e.uid===z.parentUid&&_e.instanceId===oe)?z.parentUid:null,summary:String(J.get("summary")??""),description:String(J.get("description")??""),status:String(J.get("status")??"NEEDS-ACTION"),due:Ze?new Date(Ze).toISOString():null,priority:Number(J.get("priority")??0),percent:Number(J.get("percent")??0)},m()})}const ae=s.querySelector('[data-form="note"]');ae==null||ae.addEventListener("submit",C=>{C.preventDefault(),$r(ae)});const x=s.querySelector('input[data-action="contact-search"]');x==null||x.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{Xt=x.value,V!==null&&(async()=>{try{await Ot(V),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)});const Y=s.querySelector('input[data-action="task-search"]');Y==null||Y.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{Ga=Y.value,(async()=>{try{await Ut(),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)});const H=s.querySelector('input[data-action="admin-users-search"]');H==null||H.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{mt=H.value,m()},150)});const X=s.querySelector('[data-form="admin-user-create"]');X==null||X.addEventListener("submit",C=>{C.preventDefault(),hn(X)});const pe=s.querySelector('[data-form="admin-user-edit"]');pe==null||pe.addEventListener("submit",C=>{C.preventDefault(),Sn(pe)});const Ae=s.querySelector('[data-form="admin-cal"]');Ae==null||Ae.addEventListener("submit",C=>{C.preventDefault(),yn(Ae)});const Te=s.querySelector('[data-form="admin-ab"]');Te==null||Te.addEventListener("submit",C=>{C.preventDefault(),vn(Te)});const vt=s.querySelector('[data-form="admin-settings"]');vt==null||vt.addEventListener("submit",C=>{C.preventDefault(),kn(vt)});const it=s.querySelector('[data-form="admin-database"]');it==null||it.addEventListener("submit",C=>{C.preventDefault(),$n(it)});const Dt=s.querySelector('select[data-action="admin-db-backend"]');Dt==null||Dt.addEventListener("change",()=>{Yt=Dt.value==="pgsql"?"pgsql":"sqlite",m()});const Be=s.querySelector('input[data-action="admin-db-confirm-input"]');Be==null||Be.addEventListener("input",()=>{bt=Be.value;const C=s.querySelector('[data-action="admin-db-confirm-save"]');C&&(C.disabled=d||bt.trim()!=="CONFIRM")});const Mt=s.querySelector('input[data-action="admin-reset-password"]');Mt==null||Mt.addEventListener("input",()=>{Je=Mt.value;const C=s.querySelector('[data-action="admin-reset-confirm"]');C&&(C.disabled=d||!ft||Je.trim()==="")});const Vt=s.querySelector('input[data-action="note-search"]');Vt==null||Vt.addEventListener("input",()=>{Ge&&clearTimeout(Ge),Ge=setTimeout(()=>{Qa=Vt.value,(async()=>{try{await va(),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)}),qr(),kr(),wr()}async function yr(e){var o,p;const t=en();if(t.length===0){b("error","No writable tasks selected"),m();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;d=!0,E(),m();try{const n=await A.bulkTasks({op:"delete",items:a});ye=[],Pe&&t.some(r=>me(r.instanceId,r.uri)===Pe)&&(Pe=null,z=null,Q=!1),await Ut(),n.failed>0?b("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk delete failed")}finally{d=!1,m()}return}let l={};if(e==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),r=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!r){b("error","Choose a status to apply"),m();return}l={status:r}}else if(e==="bulk-task-due"){const n=ja.trim();if(!n){b("error","Choose a due date to apply"),m();return}const r=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(r.getTime())){b("error","Invalid due date"),m();return}l={due:r.toISOString()}}else if(e==="bulk-task-clear-due")l={due:null};else if(e==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),r=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(r===""){b("error","Enter a percent complete (0–100)"),m();return}const u=Number(r);if(!Number.isFinite(u)||u<0||u>100){b("error","Percent must be between 0 and 100"),m();return}l={percent:Math.round(u)}}d=!0,E(),m();try{const n=await A.bulkTasks({op:"update",items:a,fields:l});if(await Ut(),z&&!Q){const u=me(z.instanceId,z.uri),f=Ne.find(y=>me(y.instanceId,y.uri)===u);f&&(z={...f})}const r=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?b("error",`Updated ${r} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Updated ${r} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk update failed")}finally{d=!1,m()}}async function vr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,r=Number(t.get("priority")??0),u=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),y=f===""?null:f;d=!0,E(),m();try{if(Q){const v=Number(t.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const $=await A.createTask({instanceId:v,summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});Q=!1,Pe=me($.task.instanceId,$.task.uri),z=$.task,b("success",y?"Subtask created":"Task created")}else if(z){const v=await A.updateTask(z.instanceId,z.uri,{summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});z=v.task,Pe=me(v.task.instanceId,v.task.uri),b("success","Task saved")}await Ut()}catch(v){b("error",v instanceof Error?v.message:"Save failed")}finally{d=!1,m()}}async function $r(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;d=!0,E(),m();try{if(ke){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const r=await A.createNote({instanceId:n,summary:a,description:l,dtstart:p});ke=!1,lt=me(r.note.instanceId,r.note.uri),re=r.note,b("success","Note created")}else if(re){const n=await A.updateNote(re.instanceId,re.uri,{summary:a,description:l,dtstart:p});re=n.note,lt=me(n.note.instanceId,n.note.uri),b("success","Note saved")}await va()}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,m()}}function wr(){const e=s.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){b("error","Photo is too large (max ~2 MB)"),m();return}try{const l=await Hn(t);He=l,Ee=`data:${t.type||"image/jpeg"};base64,${l}`,Ke=!1,m()}catch(l){b("error",l instanceof Error?l.message:"Failed to read photo"),m()}}})()})}function kr(){const e=s.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),l=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const p=()=>{const n=t.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};t.addEventListener("change",p),p()}async function Sr(e){var o,p,n,r;const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("password")??"");d=!0,E(),m(),N.event("login.attempt",{username:a});try{const u=await A.login(a,l);if(c=u.user,fs(u.ui),N.event("login.ok",{username:(c==null?void 0:c.username)??a}),gs(),we())try{await hs()}catch(f){N.warn("admin.capabilities login",f instanceof Error?f.message:f)}if(Us(),dt(h,w),await Qe(),h==="admin"&&we()&&Tt())try{w==="overview"&&((o=Ve("overview"))==null?void 0:o.available)!==!1?await Ja():w==="users"&&((p=Ve("users"))==null?void 0:p.available)!==!1?(await ea(),B&&(await wt(B),await ta(B))):w==="settings"&&((n=Ve("settings"))==null?void 0:n.available)!==!1?await Ya():w==="database"&&((r=Ve("database"))==null?void 0:r.available)!==!1&&await Ka()}catch(f){N.warn("admin login load",f instanceof Error?f.message:f)}b("success","Signed in")}catch(u){N.warn("login.failed",u instanceof Error?u.message:u),b("error",u instanceof Error?u.message:"Login failed")}finally{d=!1,m()}}async function Dr(e){const t=new FormData(e),a=String(t.get("path")??""),l=String(t.get("newName")??"").trim();if(!a||!l){b("error","Name is required"),m();return}d=!0,E(),m();try{await A.filesRename(a,l),N.event("files.rename",{path:a,newName:l}),Se=null,await kt(),b("success",`Renamed to “${l}”`)}catch(o){b("error",o instanceof Error?o.message:"Rename failed")}finally{d=!1,m()}}async function Cr(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){b("error","Folder name is required"),m();return}d=!0,E(),m();try{await A.filesMkdir(Re,a),N.event("files.mkdir",{path:Re,name:a}),ht=!1,await kt(),b("success",`Created folder “${a}”`)}catch(l){b("error",l instanceof Error?l.message:"Could not create folder")}finally{d=!1,m()}}async function Ar(e){if(!de||de.paths.length===0)return;const t=new FormData(e),a=String(t.get("toPath")??"").trim().replace(/^\/+|\/+$/g,""),l=String(t.get("newName")??"").trim(),o=de.op,p=[...de.paths],n=p.length>1;d=!0,E(),m();let r=0;const u=[];try{for(const y of p)try{if(o==="copy"){const v=Za(y),$=n||!l||l===v?void 0:l,T=await A.filesCopy(y,{to:a,newName:$});N.event("files.copy",{path:y,to:T.entry.path})}else{const v=Za(y),$=n||!l||l===v?void 0:l;await A.filesMove(y,a,$),N.event("files.move",{path:y,to:a})}r+=1}catch(v){u.push(`${Za(y)}: ${v instanceof Error?v.message:"failed"}`)}de=null,ue=[],await kt();const f=o==="copy"?"Copied":"Moved";r>0&&u.length===0?b("success",r===1?`${f} 1 item`:`${f} ${r} items`):r>0?b("info",`${f} ${r}; ${u.length} failed. ${u[0]}`):b("error",u[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){b("error",f instanceof Error?f.message:"Operation failed")}finally{d=!1,m()}}async function Er(e){const t=e.files;if(!t||t.length===0)return;const a=Array.from(t);e.value="",d=!0,E(),m();let l=0;const o=[];try{for(const p of a)try{await A.filesUpload(Re,p,{replace:!0}),N.event("files.upload",{path:Re,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await kt(),l>0&&o.length===0?b("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?b("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):b("error",o[0]||"Upload failed")}catch(p){b("error",p instanceof Error?p.message:"Upload failed")}finally{d=!1,m()}}async function Nr(e){if(R===null)return;const t=new FormData(e),a=String(t.get("username")??""),l=String(t.get("access")??"read");he=!0,d=!0,E(),m();try{await A.share(R,a,l),await _a(R),b("success",`Shared with ${a}`)}catch(o){b("error",o instanceof Error?o.message:"Share failed")}finally{d=!1,m()}}function Oa(e){if(!k)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');k={...k,summary:String(t.get("summary")??k.summary),description:String(t.get("description")??k.description),location:String(t.get("location")??k.location),instanceId:Number(t.get("instanceId"))||k.instanceId,allDay:(a==null?void 0:a.checked)??k.allDay,start:String(t.get("start")??k.start??""),end:String(t.get("end")??k.end??"")||null,repeat:Ua(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function Ua(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),l=String(e.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const u=String(e.get("repeatUntil")??"").trim();p=u?u.slice(0,10):null}else if(o==="count"){const u=Number(e.get("repeatCount")??0);n=Number.isFinite(u)&&u>0?Math.min(999,Math.round(u)):10}const r=e.getAll("repeatByDay").map(u=>String(u).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:p,count:n,byDay:r,endMode:o}}async function xr(e){if(!k||!k.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),r=String(t.get("end")??"").trim(),u=Number(t.get("instanceId"))||k.instanceId,f=Ua(t);if(!a){b("error","Title is required"),m();return}if(!n){b("error","Start is required"),m();return}let y,v;if(p)y=n.slice(0,10),v=r?r.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const L=$s(n,r||null);y=new Date(L.start).toISOString(),v=L.end?new Date(L.end).toISOString():null}else y=new Date(n).toISOString(),v=r?new Date(r).toISOString():null;const $=k.instanceId,T=k.uri,D=nt;d=!0,E(),gt=!0,m(),N.event(D?"event.create":"event.update",{instanceId:u,uri:D?null:T,allDay:p,summary:a});try{const L={summary:a,description:l,location:o,allDay:p,start:y,end:v,instanceId:u,repeat:f},ae=D?await A.createEvent(u,L):await A.updateEvent($,T,L);(R===null||ae.event.instanceId!==R)&&(R=ae.event.instanceId),await Xe(),gt=!1,k=null,nt=!1,O=null,N.event(D?"event.created":"event.saved",{uri:ae.event.uri,instanceId:ae.event.instanceId}),b("success",D?"Event created":"Event saved")}catch(L){N.warn("event.save failed",L instanceof Error?L.message:L),b("error",L instanceof Error?L.message:"Save failed")}finally{d=!1,m()}}async function Tr(e){if(R===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim();d=!0,E(),m();try{const p=await A.updateCalendar(R,{displayname:a,description:l,color:o});he=!0,await Qe(),R=p.calendar.id,await _a(R),await Xe(),b("success","Calendar updated")}catch(p){b("error",p instanceof Error?p.message:"Update failed")}finally{d=!1,m()}}async function _r(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),r=t.get("readOnly")==="on";if(Fe=!0,p&&!n){b("error","Select a country for the holidays calendar"),m();return}if(!p&&!a){b("error","Display name is required"),m();return}d=!0,E(),m();try{const u=await A.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:r});R=u.calendar.id,K.includes(u.calendar.id)||(K=[...K,u.calendar.id]),Fe=!1,await Qe();let f=`Created “${u.calendar.displayname}”`;const y=u.holidayImport??u.calendar.holidayImport;y&&(f+=`. Holidays imported: ${Ns(y)}.`),r&&(f+=" Calendar is read-only."),b("success",f)}catch(u){Fe=!0,b("error",u instanceof Error?u.message:"Create failed")}finally{d=!1,m()}}async function Ir(e){var l,o,p;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&N.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){j&&(j.phase==="done"||j.phase==="error")&&Ks();return}if(a==="logout"){d=!0,N.event("logout");try{await A.logout()}catch{}Wa(),E(),m();return}if(a==="select-cal"||a==="toggle-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;_n(n),d=!0,E(),m();try{await Xe()}catch(r){b("error",r instanceof Error?r.message:"Failed to load calendar")}finally{d=!1,m()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ne.find(u=>u.id===n&&u.canShare))return;R=n,K.includes(n)||(K=[...K,n]),he=!0,Me=null,d=!0,E(),m();try{await _a(n),await Xe()}catch(u){b("error",u instanceof Error?u.message:"Failed to open calendar")}finally{d=!1,m()}return}if(a==="close-cal-modal"){he=!1,m();return}if(a==="open-create-cal-modal"){Fe=!0,he=!1,Me=null,E(),m();return}if(a==="close-create-cal-modal"){Fe=!1,E(),m();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ne.find(u=>u.id===n&&u.canShare))return;Me=n,he=!1,E(),m();return}if(a==="cancel-delete-cal"){Me=null,m();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),r=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;d=!0,E(),m();try{if(await A.deleteCalendar(n),R===n&&(R=null),K=K.filter(u=>u!==n),Me=null,he=!1,Gt=[],Qt=[],await Qe(),R===null){const u=Vs();u?(R=u.id,K.includes(u.id)||(K=[...K,u.id]),await Xe()):K.length>0&&(R=K[0],await Xe())}b("success","Calendar deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="month-today"){const n=new Date;xt={y:n.getFullYear(),m:n.getMonth()},Ea=null,d=!0,m();try{await Xe()}finally{d=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,r=new Date(xt.y,xt.m+n,1);xt={y:r.getFullYear(),m:r.getMonth()},Ea=null,d=!0,m();try{await Xe()}finally{d=!1,m()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;d=!0,E(),m();try{const u=await A.getEvent(n,r);k={...u.event,repeat:u.event.repeat??Xa()},nt=!1,gt=!0,O=null,he=!1,Me=null}catch(u){b("error",u instanceof Error?u.message:"Failed to open event")}finally{d=!1,m()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";Ea=Ea===n?null:n,m();return}if(a==="new-event-day"){const n=e.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;if(R===null){b("error","Select a calendar first"),m();return}const u=ne.find(f=>f.id===R);if(!u||u.readOnly||!(u.canShare||u.access==="readwrite")){b("error","This calendar is read-only"),m();return}nt=!0,k=Bn(r,R),gt=!0,O=null,he=!1,Me=null,E(),m();return}if(a==="close-event-modal"){gt=!1,k=null,nt=!1,O=null,E(),m();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const r=s.querySelector('[data-form="edit-event"]');if(r&&k&&Oa(r),(O==null?void 0:O.field)===n)O=null;else{const u=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",y=t.dataset.dtName||n;let v=Ss(n);!v&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(v=qa().start);const $=Ia(v||ge(new Date)),[T,D]=$.date.split("-").map(Number);O={field:n,viewY:T,viewM:(D||1)-1,dateOnly:u,allowClear:f,name:y}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const n=a==="dt-month-prev"?-1:1,r=new Date(O.viewY,O.viewM+n,1);O={...O,viewY:r.getFullYear(),viewM:r.getMonth()},m();return}if(a==="dt-pick-day"){if(!O)return;const n=O.field,r=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Oa(u);const f=O.dateOnly;if(f)ot(n,r),O=null;else{const y=Ss(n),v=Ia(y||qa(r).start).hm;ot(n,`${r}T${v}`),O={...O,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(n==="start"&&k&&!f&&k.end){const y=new Date(String(k.start)),v=new Date(String(k.end));!Number.isNaN(y.getTime())&&!Number.isNaN(v.getTime())&&v<=y&&ot("end",Lt(new Date(y.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const n=O.field,r=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&Oa(u);const f=Ss(n)||qa().start,v=`${Ia(f).date}T${r}`;if(ot(n,v),n==="start"&&k){k={...k,allDay:!1};const $=k.end?Ia(String(k.end)):null,T=new Date(v);(!$||new Date(`${$.date}T${$.hm}`)<=T)&&ot("end",Lt(new Date(T.getTime()+3600*1e3)))}O=null,m();return}if(a==="dt-today"){if(!O)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&k&&Oa(r);const u=ge(new Date);if(O.dateOnly)ot(n,u);else{const f=qa(u);n==="start"?(ot("start",f.start),k&&!k.end&&ot("end",f.end)):n==="end"?ot("end",f.end):ot(n,f.start)}O=null,m();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&k&&Oa(r),ot(n,null),O=null,m();return}if(a==="event-allday-toggle"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]'),r=t.checked;if(n){const u=new FormData(n),f=String(u.get("start")??k.start??""),y=String(u.get("end")??k.end??"")||null;let v=f,$=y;if(r){const T=xn(f,y);v=T.start,$=T.end}else{const T=f.slice(0,10),D=(y||f).slice(0,10),L=$s(T,D);v=L.start,$=L.end}k={...k,summary:String(u.get("summary")??k.summary),description:String(u.get("description")??k.description),location:String(u.get("location")??k.location),instanceId:Number(u.get("instanceId"))||k.instanceId,allDay:r,start:v,end:$,repeat:Ua(u)}}else k={...k,allDay:r};O=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const r=new FormData(n),u=n.querySelector('input[name="allDay"]'),f=Ua(r);k={...k,summary:String(r.get("summary")??k.summary),description:String(r.get("description")??k.description),location:String(r.get("location")??k.location),instanceId:Number(r.get("instanceId"))||k.instanceId,allDay:(u==null?void 0:u.checked)??k.allDay,start:String(r.get("start")??k.start??""),end:String(r.get("end")??k.end??"")||null,repeat:f,hasRrule:!!String(r.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),m();return}if(a==="delete-event"){if(!k||!k.canWrite||nt||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=k.instanceId,r=k.uri;d=!0,E(),m();try{await A.deleteEvent(n,r),gt=!1,k=null,await Xe(),b("success","Event deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="info"){const n=t.dataset.info??"";Fr(n);return}if(a==="info-close"){an();return}if(a==="flash-close"){E(),m();return}if(a==="user-menu-toggle"){e.stopPropagation(),Oe=!Oe,m();return}if(a==="user-menu-close"){Oe&&(Oe=!1,m());return}if(a==="tab"){const n=_s(t.dataset.tab);n&&(n==="admin"&&(w="overview"),await Fs(n));return}if(a==="admin-page"){const n=ds(t.dataset.adminPage);n&&await Ps(n);return}if(a==="admin-refresh"){if(!we()||h!=="admin")return;d=!0,E(),m();try{await Ja(),b("success","Overview refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="admin-users-refresh"){if(!we()||h!=="admin")return;d=!0,E(),m();try{await ea(),B&&await wt(B),b("success","Users refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="admin-user-view"){const n=t.dataset.username??"";if(!n||!we())return;d=!0,E(),B=n,w="users",dt("admin","users",n),m();try{await wt(n),await ta(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{d=!1,m()}return}if(a==="admin-user-close"){B=null,M=null,qe=null,Le=!1,dt("admin","users",null),m();return}if(a==="admin-user-create-open"){if(!we())return;je=!0,Le=!1,pt=null,E(),m();return}if(a==="admin-user-create-close"){je=!1,m();return}if(a==="admin-user-edit-open"){if(!we())return;const n=t.dataset.username??B??"";if(!n)return;d=!0,E(),je=!1,pt=null,B=n,w="users",dt("admin","users",n),m();try{(!M||M.username.toLowerCase()!==n.toLowerCase())&&await wt(n),Le=!0}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{d=!1,m()}return}if(a==="admin-user-edit-close"){Le=!1,m();return}if(a==="admin-user-delete-open"){if(!we())return;const n=t.dataset.username??B??"";if(!n)return;pt=n,At=!1,je=!1,Le=!1,E(),m();return}if(a==="admin-user-delete-close"){pt=null,At=!1,m();return}if(a==="admin-user-delete-toggle"){At=!!t.checked,m();return}if(a==="admin-user-delete-confirm"){if(!we())return;const n=t.dataset.username??pt??"";if(!n||!At)return;d=!0,E(),m();try{await A.adminDeleteUser(n,!0),N.event("admin.user.delete",{username:n}),pt=null,At=!1,Le=!1,(B==null?void 0:B.toLowerCase())===n.toLowerCase()&&(B=null,M=null,Et=[],Nt=[],dt("admin","users",null)),await ea(),b("success",`Deleted user “${n}”`)}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{d=!1,m()}return}if(a==="admin-cal-create"){We="create",zt=null,m();return}if(a==="admin-cal-edit"){We="edit",zt=Number(t.dataset.id),m();return}if(a==="admin-cal-close"){We=null,zt=null,m();return}if(a==="admin-cal-delete"){$e={kind:"calendar",id:Number(t.dataset.id),label:t.dataset.label??"calendar"},m();return}if(a==="admin-ab-create"){st="create",Ht=null,m();return}if(a==="admin-ab-edit"){st="edit",Ht=Number(t.dataset.id),m();return}if(a==="admin-ab-close"){st=null,Ht=null,m();return}if(a==="admin-ab-delete"){$e={kind:"addressbook",id:Number(t.dataset.id),label:t.dataset.label??"address book",force:!1},m();return}if(a==="admin-ab-force-toggle"){($e==null?void 0:$e.kind)==="addressbook"&&($e={...$e,force:!!t.checked},m());return}if(a==="admin-resource-delete-close"){$e=null,m();return}if(a==="admin-resource-delete-confirm"){if(!B||!$e)return;const n=B,r=$e;d=!0,E(),m();try{r.kind==="calendar"?await A.adminDeleteUserCalendar(n,r.id,!0):await A.adminDeleteUserAddressBook(n,r.id,!0,!!r.force),$e=null,await ta(n),await wt(n),b("success","Deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="admin-settings-refresh"){d=!0,E(),m();try{await Ya(),b("success","Settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,m()}return}if(a==="admin-reset-open"){ca=!0,ft=!1,Je="",E(),m();return}if(a==="admin-reset-close"){ca=!1,ft=!1,Je="",m();return}if(a==="admin-reset-toggle"){ft=!!t.checked,m();return}if(a==="admin-reset-password"){Je=t.value;const n=s.querySelector('[data-action="admin-reset-confirm"]');n&&(n.disabled=d||!ft||Je.trim()==="");return}if(a==="admin-reset-confirm"){if(!ft)return;if(Je.trim()===""){b("error","Re-enter your password to confirm Reset to Default"),m();return}d=!0,E(),m();try{const n=await A.adminResetToDefault(!0,Je);N.event("admin.settings.reset-to-default"),ca=!1,ft=!1,Je="";const r=n.redirectUrl&&n.redirectUrl.startsWith("/")?n.redirectUrl:"/portal/install/";window.location.assign(r);return}catch(n){b("error",n instanceof Error?n.message:"Reset failed"),d=!1,m()}return}if(a==="admin-database-refresh"){d=!0,E(),m();try{await Ka(),b("success","Database settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,m()}return}if(a==="admin-db-backend"){Yt=t.value==="pgsql"?"pgsql":"sqlite",m();return}if(a==="admin-db-test"){const n=t.closest("form");wn(n);return}if(a==="admin-db-confirm-close"){ua=!1,bt="",ma=null,m();return}if(a==="admin-db-confirm-input"){bt=t.value,m();const r=s.querySelector('[data-action="admin-db-confirm-input"]');if(r){r.focus();const u=r.value.length;r.setSelectionRange(u,u)}return}if(a==="admin-db-confirm-save"){if(bt.trim()!=="CONFIRM"||!ma)return;d=!0,E(),m();try{const n={...ma,confirm:"CONFIRM"},r=await A.adminUpdateDatabaseSettings(n);Jt=r.data,ua=!1,bt="",ma=null,Yt=(r.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:r.data.backend}),b("success","Database settings saved")}catch(n){b("error",n instanceof Error?n.message:"Database save failed")}finally{d=!1,m()}return}if(a==="files-nav"){Re=t.dataset.path??"",Se=null,be=null,de=null,ht=!1,ue=[],d=!0,E(),m();try{await kt()}catch(r){b("error",r instanceof Error?r.message:"Failed to open folder")}finally{d=!1,m()}return}if(a==="files-toggle"){e.stopPropagation();const n=t.dataset.path??"";if(!n)return;t.checked?ue.includes(n)||(ue=[...ue,n]):ue=ue.filter(u=>u!==n),m();return}if(a==="files-select-all"){e.stopPropagation(),ue=t.checked?xe.map(r=>r.path):[],m();return}if(a==="files-copy"){const n=t.dataset.path??"";if(!n)return;de={op:"copy",paths:[n]},Se=null,be=null,m();return}if(a==="files-move"){const n=t.dataset.path??"";if(!n)return;de={op:"move",paths:[n]},Se=null,be=null,m();return}if(a==="files-bulk-copy"){if(ue.length===0)return;de={op:"copy",paths:[...ue]},Se=null,be=null,m();return}if(a==="files-bulk-move"){if(ue.length===0)return;de={op:"move",paths:[...ue]},Se=null,be=null,m();return}if(a==="files-transfer-close"){de=null,m();return}if(a==="files-bulk-delete"){if(ue.length===0)return;be=[...ue],Se=null,de=null,m();return}if(a==="files-refresh"){d=!0,E(),m();try{await kt(),b("success","Refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="files-mkdir"){ht=!0,Se=null,be=null,de=null,E(),m();return}if(a==="files-mkdir-close"){ht=!1,m();return}if(a==="files-rename-open"){Se=t.dataset.path??null,be=null,de=null,m();return}if(a==="files-rename-close"){Se=null,m();return}if(a==="files-delete-open"){const n=t.dataset.path??"";be=n?[n]:null,Se=null,de=null,m();return}if(a==="files-delete-close"){be=null,m();return}if(a==="files-delete-confirm"){const n=be?[...be]:[];if(n.length===0)return;d=!0,E(),m();try{if(n.length===1)await A.filesDelete(n[0]),N.event("files.delete",{path:n[0]}),b("success","Deleted");else{const r=await A.filesBulk("delete",n);N.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?b("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?b("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):b("error",r.errors[0]||"Delete failed")}be=null,ue=[],await kt()}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{d=!1,m()}return}if(a==="files-download"){N.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){qt===n?St=St==="asc"?"desc":"asc":(qt=n,St=n==="due"||n==="summary"?"asc":"desc"),d=!0,m();try{await Ut()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{d=!1,m()}}else{ha===n?aa=aa==="asc"?"desc":"asc":(ha=n,aa="asc"),d=!0,m();try{await va()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{d=!1,m()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=Ne.find(f=>f.instanceId===n&&f.uri===r)??null;Q=!1,Pe=me(n,r),z=u?{...u}:null,E(),m();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=me(n,r),f=Ne.find(y=>me(y.instanceId,y.uri)===u);if(!f||!f.canWrite||f.readOnly)return;ye.includes(u)?ye=ye.filter(y=>y!==u):ye=[...ye,u],m();return}if(a==="task-select-all"){e.preventDefault();const n=Ne.filter(u=>u.canWrite&&!u.readOnly);n.length>0&&n.every(u=>ye.includes(me(u.instanceId,u.uri)))?ye=[]:ye=n.map(u=>me(u.instanceId,u.uri)),m();return}if(a==="bulk-task-clear"){ye=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){yr(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=ga.find(f=>f.instanceId===n&&f.uri===r)??null;ke=!1,lt=me(n,r),re=u?{...u}:null,E(),m();return}if(a==="new-task"){Q=!0,Pe=null,z={uri:"",instanceId:((o=_t[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="new-subtask"){if(!z||Q||!z.uid||!z.canWrite)return;const n=z;Q=!0,Pe=null,z={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="new-note"){ke=!0,lt=null,re={uri:"",instanceId:((p=It[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="cancel-task"){Q=!1,z=null,Pe=null,m();return}if(a==="cancel-note"){ke=!1,re=null,lt=null,m();return}if(a==="delete-task"){if(!z||Q||!confirm("Delete this task? CalDAV clients will sync the removal."))return;d=!0,E(),m();try{await A.deleteTask(z.instanceId,z.uri),Pe=null,z=null,await Ut(),b("success","Task deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="delete-note"){if(!re||ke||!confirm("Delete this note? CalDAV clients will sync the removal."))return;d=!0,E(),m();try{await A.deleteNote(re.instanceId,re.uri),lt=null,re=null,await va(),b("success","Note deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;V=n,rt=!1,ce=null,I=null,fe=!1,Ce=!1,Xt="",$t=[],Ee=null,He=null,Ke=!1,E(),d=!0,m();try{await Ot(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contacts")}finally{d=!1,m()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!Ue.find(f=>f.id===n))return;const u=V!==n;V=n,rt=!0,Ce=!1,E(),u&&(ce=null,I=null,fe=!1,Xt="",$t=[],Ee=null,He=null,Ke=!1),d=!0,m();try{u&&await Ot(n)}catch(f){b("error",f instanceof Error?f.message:"Failed to open address book")}finally{d=!1,m()}return}if(a==="close-ab-modal"){rt=!1,m();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;E();try{await jn(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(V===null)return;zn(),E(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){fe=!1,Ce=!1,I=null,ce=null,Ee=null,He=null,Ke=!1,O=null,E(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;ts(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!I)return;ts();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(I.emails)?I.emails:[""];I.emails=r.filter((u,f)=>f!==n),I.emails.length===0&&(I.emails=[""]),m();return}if(a==="remove-phone"){if(!I)return;ts();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=r.filter((u,f)=>f!==n),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!I)return;ts();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((r,u)=>u!==n),m();return}if(a==="remove-photo"){Ee=null,He=null,Ke=!0,I&&(I.hasPhoto=!1),m();return}if(a==="delete-contact"){if(V===null||!ce||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;d=!0,E(),Ce=!0,m();try{await A.deleteContact(V,ce),ce=null,I=null,fe=!1,Ce=!1,O=null,Ee=null,await Qe(),b("success","Contact deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??V);if(!Number.isFinite(n)||!Ue.find(u=>u.id===n))return;Ye=n,rt=!1,Ce=!1,E(),m();return}if(a==="cancel-delete-ab"){Ye=null,m();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),r=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;const u=Ue.find(y=>y.id===n);if(!u)return;const f=(u.cardCount??0)>0;d=!0,E(),m();try{await A.deleteAddressBook(n,f),V===n&&(V=null,$t=[],I=null,ce=null,fe=!1),Ye=null,rt=!1,Ce=!1,await Qe(),V===null&&Ue.length>0&&(V=Ue[0].id,await Ot(V)),b("success","Address book deleted")}catch(y){b("error",y instanceof Error?y.message:"Delete failed")}finally{d=!1,m()}return}if(a==="export-ab"){e.stopPropagation();const n=t.dataset.id,r=n!==void 0&&n!==""?Number(n):V;if(r===null||Number.isNaN(r))return;d=!0,E(),m();try{const{blob:u,filename:f}=await A.exportAddressBook(r),y=URL.createObjectURL(u),v=document.createElement("a");v.href=y,v.download=f,v.click(),URL.revokeObjectURL(y),b("success",`Exported ${f}`)}catch(u){b("error",u instanceof Error?u.message:"Export failed")}finally{d=!1,m()}return}if(a==="export-contact"){if(V===null||!ce||fe)return;Ce=!0,d=!0,E(),m();try{const{blob:n,filename:r}=await A.exportContact(V,ce),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{d=!1,m()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||R===null||!confirm("Revoke access for this user?"))return;he=!0,d=!0,E(),m();try{await A.revoke(R,n),await _a(R),b("success","Share revoked")}catch(r){b("error",r instanceof Error?r.message:"Revoke failed")}finally{d=!1,m()}return}if(a==="export-cal"){e.stopPropagation();const n=t.dataset.id,r=n!==void 0&&n!==""?Number(n):R;if(r===null||Number.isNaN(r))return;d=!0,E(),m();try{const{blob:u,filename:f}=await A.exportCalendar(r),y=URL.createObjectURL(u),v=document.createElement("a");v.href=y,v.download=f,v.click(),URL.revokeObjectURL(y),b("success",`Exported ${f}`)}catch(u){b("error",u instanceof Error?u.message:"Export failed")}finally{d=!1,m()}}}function qr(){const e=s.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Mr(e)});const t=s.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Vr(t)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Lr(a)})}async function Lr(e){var l;if(V===null)return;const t=(l=e.files)==null?void 0:l[0];if(e.value="",!t)return;const a=V;rt=!0,d=!0,E(),yt(),j={kind:"contacts",fileName:t.name,fileSizeLabel:Js(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ys(),m();try{const o=await Xs(t,r=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:r};const u=s.querySelector(".import-progress-bar"),f=s.querySelector("[data-import-status-line]");u&&r!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${r}%`),f&&r!==null&&(f.textContent=`Reading file… ${r}%`)});Ft("uploading",{readPercent:100}),Ft("processing",{processPercent:0}),N.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const p=await A.importAddressBook(a,o,r=>{Gs(r)}),n=Ns(p);await Qe(),V===a&&await Ot(a),yt(),Ft("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),b("success",`Import finished for “${t.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";yt(),Ft("error",{ok:!1,resultMessage:p}),b("error",p)}finally{d=!1,m()}}function ts(){if(!I)return;const e=s.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);I.firstname=String(t.get("firstname")??""),I.lastname=String(t.get("lastname")??""),I.fullname=String(t.get("fullname")??""),I.org=String(t.get("org")??""),I.title=String(t.get("title")??""),I.url=String(t.get("url")??""),I.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const l=[];let o=0;for(;t.has(`email_${o}`);)l.push(String(t.get(`email_${o}`)??"")),o++;l.length&&(I.emails=l);const p=[];for(o=0;t.has(`phone_value_${o}`);)p.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;p.length&&(I.phones=p);const n=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)n.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;I.custom=n}function Or(e){const t=new FormData(e),a=[];let l=0;for(;t.has(`email_${l}`);){const r=String(t.get(`email_${l}`)??"").trim();r&&a.push(r),l++}const o=[];for(l=0;t.has(`phone_value_${l}`);){const r=String(t.get(`phone_value_${l}`)??"").trim();r&&o.push({type:String(t.get(`phone_type_${l}`)??"other"),value:r}),l++}const p=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);){const r=String(t.get(`custom_label_${l}`)??"").trim(),u=String(t.get(`custom_value_${l}`)??"").trim();(r||u)&&p.push({label:r,value:u}),l++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const r=String(t.get("birthday")??"").trim();return r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null})(),custom:p};return Ke?n.removePhoto=!0:He&&(n.photoBase64=He),n}async function Ur(e){if(V===null)return;const t=Or(e);d=!0,E(),Ce=!0,m();try{if(fe){const a=await A.createContact(V,t);fe=!1,ce=a.contact.uri,I=null,Ce=!1,Ee=null,He=null,Ke=!1,O=null,b("success","Contact created")}else ce&&(ce=(await A.updateContact(V,ce,t)).contact.uri,I=null,Ce=!1,Ee=null,He=null,Ke=!1,O=null,b("success","Contact saved"));try{await Qe()}catch(a){if(console.error(a),V!==null)try{await Ot(V)}catch{}}}catch(a){b("error",a instanceof Error?a.message:"Save failed")}finally{d=!1,m()}}async function Pr(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();if(a){d=!0,E(),m();try{const o=await A.createAddressBook({displayname:a,description:l});V=o.addressbook.id,ce=null,I=null,fe=!1,Xt="",await Qe(),b("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){b("error",o instanceof Error?o.message:"Create failed")}finally{d=!1,m()}}}async function Rr(e){if(V===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();rt=!0,d=!0,E(),m();try{await A.updateAddressBook(V,{displayname:a,description:l}),await Qe(),b("success","Address book updated")}catch(o){b("error",o instanceof Error?o.message:"Update failed")}finally{d=!1,m()}}function Fr(e){const t=nl[e];if(!t)return;const a=s.querySelector("#info-modal"),l=s.querySelector("#info-modal-title"),o=s.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=t.title,o.innerHTML=t.paragraphs.map(n=>`<p>${i(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function an(){const e=s.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Mr(e){var a;if(R===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(he=!0,await sn(R,t,{keepEditModalOpen:!0}))}async function Vr(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=s.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){b("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Fe=!0,m();return}if(p){b("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Fe=!0,m();return}let n=String(l.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const r=String(l.get("description")??""),u=String(l.get("color")??"").trim();d=!0,E(),Fe=!0,m();try{const y=await A.createCalendar({displayname:n,description:r,color:u,readOnly:!1});R=y.calendar.id,Fe=!1,await Qe(),b("success",`Created “${y.calendar.displayname}” — importing…`),await sn(y.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const v=y instanceof Error?y.message:"Create or import failed";Fe=!0,b("error",v),d=!1,m()}}async function sn(e,t,a={}){d=!0,E(),yt(),j={kind:"calendar",fileName:t.name,fileSizeLabel:Js(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ys(),m();try{const l=await Xs(t,n=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:n};const r=s.querySelector(".import-progress-bar"),u=s.querySelector("[data-import-status-line]");r&&n!==null&&(r.classList.remove("is-indeterminate"),r.style.width=`${n}%`),u&&n!==null&&(u.textContent=`Reading file… ${n}%`)});Ft("uploading",{readPercent:100}),Ft("processing",{processPercent:0}),N.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await A.importCalendar(e,l,n=>{Gs(n)}),p=Ns(o);R===e&&await Xe(),yt(),Ft("done",{ok:!0,resultMessage:`${p} (from “${t.name}”)`}),b("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";yt(),Ft("error",{ok:!1,resultMessage:o}),b("error",o)}finally{a.keepEditModalOpen&&(he=!0),d=!1,m()}}An()}let jt="",P=null,Z=!1,ct=null,Ct=null,Bt="sqlite",cs=!1;async function us(s,c={}){const g={Accept:"application/json",...c.headers};c.body&&(g["Content-Type"]="application/json"),jt&&c.method&&c.method!=="GET"&&(g["X-CSRF-Token"]=jt);const h=await fetch(`/api/install${s}`,{credentials:"same-origin",...c,headers:g});let w;try{w=await h.json()}catch{throw new Error(`Request failed (${h.status})`)}if(!h.ok)throw new Error(w.error||`Request failed (${h.status})`);return w&&typeof w=="object"&&"data"in w&&w.data!==void 0?w.data:w}async function qs(){var s;P=await us("/status"),jt=P.csrfToken||jt,((s=P.defaults)==null?void 0:s.backend)==="pgsql"?Bt="pgsql":Bt="sqlite"}function Ra(s,c,g){return`<label class="check-row"><input type="checkbox" name="${i(s)}" ${c?"checked":""} ${Z?"disabled":""} /> ${i(g)}</label>`}function ol(){const s=P==null?void 0:P.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${i((s==null?void 0:s.configPath)||"—")} ${s!=null&&s.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${i((s==null?void 0:s.specificPath)||"—")} ${s!=null&&s.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${ia("error",(P==null?void 0:P.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${Z?"disabled":""}>Retry</button>
  </section>`}function il(){const s=P==null?void 0:P.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${Z?"disabled":""}>
          ${mn((s==null?void 0:s.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ra("cal_enabled",(s==null?void 0:s.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ra("card_enabled",(s==null?void 0:s.card_enabled)!==!1,"Enable CardDAV")}
      ${Ra("tasks_enabled",(s==null?void 0:s.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ra("notes_enabled",!!(s!=null&&s.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ra("files_enabled",!!(s!=null&&s.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${Z?"disabled":""}>
          ${["Digest","Basic","Apache"].map(c=>`<option value="${c}" ${((s==null?void 0:s.dav_auth_type)||"Digest")===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${i((s==null?void 0:s.invite_from)||"")}" ${Z?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${i(String((s==null?void 0:s.session_max_age_minutes)??15))}" ${Z?"disabled":""} />
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
  </section>`}function dl(){const s=P==null?void 0:P.defaults,c=(P==null?void 0:P.pdoDrivers)||[],g=c.includes("sqlite"),h=c.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${Z?"disabled":""}>
          ${g?`<option value="sqlite" ${Bt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${h?`<option value="pgsql" ${Bt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Bt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${i((s==null?void 0:s.sqlite_file)||"")}" class="mono" ${Z?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Bt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${i((s==null?void 0:s.pgsql_host)||"")}" placeholder="localhost:5432" ${Z?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${i((s==null?void 0:s.pgsql_dbname)||"")}" ${Z?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${i((s==null?void 0:s.pgsql_username)||"")}" autocomplete="off" ${Z?"disabled":""} />
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
  </section>`}function cl(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${i(String((P==null?void 0:P.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${i((P==null?void 0:P.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${cs?"checked":""} ${Z?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${Z||!cs?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function ul(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${i((P==null?void 0:P.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function ml(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${ia("error",(P==null?void 0:P.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function ut(){const s=document.getElementById("app");if(!s)return;const c=(P==null?void 0:P.step)||"permissions";let g="";P?c==="permissions"?g=ol():c==="initialize"?g=il():c==="database"?g=dl():c==="upgrade"?g=cl():c==="done"?g=ul():c==="locked"?g=ml():g=`<section class="card"><p>Unknown step: ${i(c)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',s.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${i((P==null?void 0:P.productVersion)||"…")}</span>
            ${P!=null&&P.configuredVersion?` · configured <span class="mono">${i(String(P.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${P!=null&&P.step?`<span class="badge badge-admin">${i(P.step)}</span>`:""}
      </header>
      ${ct?ia("error",ct,{dismissible:!1}):""}
      ${Ct?ia("success",Ct,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,pl()}function pl(){var c,g,h,w,q,U;const s=document.getElementById("app");s&&((c=s.querySelector('[data-action="reload"]'))==null||c.addEventListener("click",()=>{fl()}),(g=s.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",F=>{Bt=F.target.value==="pgsql"?"pgsql":"sqlite",ut()}),(h=s.querySelector('[data-action="upgrade-toggle"]'))==null||h.addEventListener("change",F=>{cs=!!F.target.checked,ut()}),(w=s.querySelector('[data-action="upgrade-run"]'))==null||w.addEventListener("click",()=>{hl()}),(q=s.querySelector('[data-form="initialize"]'))==null||q.addEventListener("submit",F=>{F.preventDefault(),bl(F.target)}),(U=s.querySelector('[data-form="database"]'))==null||U.addEventListener("submit",F=>{F.preventDefault(),gl(F.target)}))}async function fl(){Z=!0,ct=null,ut();try{await qs(),Ct=null}catch(s){ct=s instanceof Error?s.message:"Failed to load installer status"}finally{Z=!1,ut()}}async function bl(s){const c=new FormData(s),g=w=>{var q;return!!((q=s.querySelector(`input[name="${w}"]`))!=null&&q.checked)},h={timezone:String(c.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(c.get("dav_auth_type")??"Digest"),invite_from:String(c.get("invite_from")??"").trim(),session_max_age_minutes:Number(c.get("session_max_age_minutes")??15),admin_password:String(c.get("admin_password")??""),admin_password_confirm:String(c.get("admin_password_confirm")??"")};Z=!0,ct=null,Ct=null,ut();try{P=await us("/initialize",{method:"POST",body:JSON.stringify(h)}),jt=P.csrfToken||jt,Ct="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(w){ct=w instanceof Error?w.message:"Initialize failed"}finally{Z=!1,ut()}}async function gl(s){const c=new FormData(s),g=String(c.get("backend")??Bt),h={backend:g,admin_password:String(c.get("admin_password")??""),admin_password_confirm:String(c.get("admin_password_confirm")??"")};g==="sqlite"?h.sqlite_file=String(c.get("sqlite_file")??"").trim():(h.pgsql_host=String(c.get("pgsql_host")??"").trim(),h.pgsql_dbname=String(c.get("pgsql_dbname")??"").trim(),h.pgsql_username=String(c.get("pgsql_username")??"").trim(),h.pgsql_password=String(c.get("pgsql_password")??"")),Z=!0,ct=null,Ct=null,ut();try{P=await us("/database",{method:"POST",body:JSON.stringify(h)}),jt=P.csrfToken||jt,Ct="Database configured. Installer is locked.",N.event("install.database"),P.completed||P.step}catch(w){ct=w instanceof Error?w.message:"Database setup failed"}finally{Z=!1,ut()}}async function hl(){if(cs){Z=!0,ct=null,Ct=null,ut();try{const s=await us("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});Ct="Upgrade completed."+(s.messages&&s.messages.length?" "+s.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await qs()}catch(s){ct=s instanceof Error?s.message:"Upgrade failed"}finally{Z=!1,ut()}}}async function yl(s){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),s.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await qs()}catch(c){ct=c instanceof Error?c.message:"Failed to load installer"}ut()}const xs=document.getElementById("app");if(!xs)throw new Error("#app missing");const dn=window.location.pathname.replace(/\/+$/,"")||"/";dn==="/portal/install"||dn.endsWith("/portal/install")?yl(xs):ll(xs);
