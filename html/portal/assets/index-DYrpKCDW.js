var Mr=Object.defineProperty;var Rr=(s,c,g)=>c in s?Mr(s,c,{enumerable:!0,configurable:!0,writable:!0,value:g}):s[c]=g;var Cs=(s,c,g)=>Rr(s,typeof c!="symbol"?c+"":c,g);(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const w of document.querySelectorAll('link[rel="modulepreload"]'))h(w);new MutationObserver(w=>{for(const q of w)if(q.type==="childList")for(const U of q.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&h(U)}).observe(document,{childList:!0,subtree:!0});function g(w){const q={};return w.integrity&&(q.integrity=w.integrity),w.referrerPolicy&&(q.referrerPolicy=w.referrerPolicy),w.crossOrigin==="use-credentials"?q.credentials="include":w.crossOrigin==="anonymous"?q.credentials="omit":q.credentials="same-origin",q}function h(w){if(w.ep)return;w.ep=!0;const q=g(w);fetch(w.href,q)}})();const an={off:0,error:1,warn:2,info:3,debug:4};let Pa="off";const ls="[angaradav-portal]";function Vr(s){const c=(s||"off").toLowerCase().trim();return c==="error"||c==="warn"||c==="info"||c==="debug"||c==="off"?c:"off"}function Br(s){return Pa=Vr(s),Pa!=="off"&&console.info(ls,`log level = ${Pa}`),Pa}function on(s){return an[Pa]>=an[s]}function ts(s,c,g,h){if(!on(s))return;const w=[ls,g];h!==void 0&&w.push(h),console[c](...w)}function jr(s,c){on("info")&&(c&&Object.keys(c).length>0?console.info(ls,`event:${s}`,c):console.info(ls,`event:${s}`))}const N={error(s,c){ts("error","error",s,c)},warn(s,c){ts("warn","warn",s,c)},info(s,c){ts("info","info",s,c)},debug(s,c){ts("debug","debug",s,c)},event:jr};class Ie extends Error{constructor(g,h,w={}){super(g);Cs(this,"status");Cs(this,"payload");this.status=h,this.payload=w}}let la="",ss=null,ns=null;function rs(s){la=s&&typeof s=="string"?s:""}function zr(s){ss=s}function Hr(s){ns=s}function xs(s){if(!dn(s))try{ns==null||ns()}catch{}}function dn(s){return s==="/login"||s==="/ui"||s==="/logout"||s==="/install/status"||s.startsWith("/install/")}function os(s,c){if(!dn(s)){rs("");try{ss==null||ss(c||"Session timed out. Please sign in again.")}catch{}}}async function _(s,c={}){const g=new Headers(c.headers);c.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const h=(c.method||"GET").toUpperCase();h!=="GET"&&h!=="HEAD"&&h!=="OPTIONS"&&la&&g.set("X-CSRF-Token",la);const w=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${h} ${s}`);const q=await fetch(`/api${s}`,{...c,headers:g,credentials:"same-origin"});let U=null;const R=await q.text();if(R)try{U=JSON.parse(R)}catch{U={error:R}}const W=Math.round((typeof performance<"u"?performance.now():Date.now())-w);if(!q.ok){let Z=`Request failed (${q.status})`,ie={};if(U&&typeof U=="object"&&U!==null){const ne=U;ie={...ne},typeof ne.error=="string"&&(Z=ne.error)}else(q.status===500||q.status===504)&&(Z="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw q.status>=500?N.error(`api ← ${h} ${s} ${q.status} (${W}ms)`,Z):q.status!==401?N.warn(`api ← ${h} ${s} ${q.status} (${W}ms)`,Z):(N.debug(`api ← ${h} ${s} 401 (${W}ms)`),os(s,Z)),new Ie(Z,q.status,ie)}return N.info(`api ← ${h} ${s} ${q.status} (${W}ms)`),xs(s),U}function at(s){return encodeURIComponent(s)}async function sn(s,c,g,h){const w=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});la&&w.set("X-CSRF-Token",la);const q=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${s} (stream, ${g}, ${c.length} bytes)`);let U;try{U=await fetch(`/api${s}`,{method:"POST",headers:w,credentials:"same-origin",body:c})}catch(V){const G=V instanceof Error?V.message:"Network error";throw N.error(`api ← POST ${s} network fail`,G),new Ie(`Import request failed to start (${G}). Check connectivity and container logs.`,0)}const R=(U.headers.get("Content-Type")||"").toLowerCase(),W=R.includes("ndjson")||R.includes("x-ndjson");if(!U.ok&&!W){let V=`Request failed (${U.status})`;try{const G=await U.json();G.error&&(V=G.error)}catch{}throw(U.status===504||U.status===502)&&(V="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),U.status===401?(N.debug(`api ← POST ${s} 401`,V),os(s,V)):N.warn(`api ← POST ${s} ${U.status}`,V),new Ie(V,U.status)}if(!W&&U.ok){try{const V=await U.json();if(V&&typeof V.error=="string")throw new Ie(V.error,U.status||500);if(V&&typeof V.imported=="number"&&typeof V.updated=="number")return N.info(`api ← POST ${s} json done`),V}catch(V){if(V instanceof Ie)throw V}throw new Ie("Unexpected import response from server",500)}if(!U.body)throw new Ie("Import stream unavailable",500);const Z=U.body.getReader(),ie=new TextDecoder;let ne="";const ee={final:null,error:null,sawProgress:!1},ut=V=>{let G;try{G=JSON.parse(V)}catch{N.debug("import stream non-JSON line",V.slice(0,80));return}if(G.type==="progress"){ee.sawProgress=!0;const qe=Number(G.total)||0,He=Number(G.current)||0,Le=typeof G.percent=="number"?G.percent:qe>0?Math.round(100*He/qe):0;h==null||h({percent:Le,current:He,total:qe,imported:Number(G.imported)||0,updated:Number(G.updated)||0,skipped:Number(G.skipped)||0})}else G.type==="done"&&G.result?ee.final=G.result:G.type==="error"&&(ee.error={message:G.error||"Import failed",status:G.status||500})};for(;;){const{done:V,value:G}=await Z.read();if(V)break;ne+=ie.decode(G,{stream:!0});const qe=ne.split(`
`);ne=qe.pop()??"";for(const He of qe){const Le=He.trim();Le&&ut(Le)}}ne.trim()&&ut(ne.trim());const B=Math.round((typeof performance<"u"?performance.now():Date.now())-q);if(ee.error)throw ee.error.status===401?(N.debug(`api ← POST ${s} stream 401 (${B}ms)`,ee.error.message),os(s,ee.error.message)):N.warn(`api ← POST ${s} stream error (${B}ms)`,ee.error.message),new Ie(ee.error.message,ee.error.status);if(!ee.final)throw N.error(`api ← POST ${s} stream incomplete (${B}ms)`,{sawProgress:ee.sawProgress}),new Ie(ee.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${s} stream done (${B}ms)`),xs(s),ee.final}const A={ui:()=>_("/ui"),installStatus:async()=>{const s=await _("/install/status");return s&&typeof s=="object"&&"data"in s&&s.data?s.data:s},adminPing:()=>_("/admin/ping"),adminDashboard:()=>_("/admin/dashboard"),adminCapabilities:()=>_("/admin/capabilities"),adminUsers:()=>_("/admin/users"),adminUser:s=>_(`/admin/users/${encodeURIComponent(s)}`),adminCreateUser:s=>_("/admin/users",{method:"POST",body:JSON.stringify(s)}),adminUpdateUser:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"PATCH",body:JSON.stringify(c)}),adminDeleteUser:(s,c=!0)=>_(`/admin/users/${encodeURIComponent(s)}`,{method:"DELETE",body:JSON.stringify({confirm:c})}),adminUserCalendars:s=>_(`/admin/users/${encodeURIComponent(s)}/calendars`),adminCreateUserCalendar:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/calendars`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserCalendar:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(s,c,g=!0)=>_(`/admin/users/${encodeURIComponent(s)}/calendars/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:s=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`),adminCreateUserAddressBook:(s,c)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks`,{method:"POST",body:JSON.stringify(c)}),adminUpdateUserAddressBook:(s,c,g)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(s,c,g=!0,h=!1)=>_(`/admin/users/${encodeURIComponent(s)}/addressbooks/${c}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:h})}),adminSystemSettings:()=>_("/admin/settings/system"),adminUpdateSystemSettings:s=>_("/admin/settings/system",{method:"PATCH",body:JSON.stringify(s)}),adminResetToDefault:(s=!0)=>_("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:s})}),adminDatabaseSettings:()=>_("/admin/settings/database"),adminUpdateDatabaseSettings:s=>_("/admin/settings/database",{method:"PATCH",body:JSON.stringify(s)}),me:async()=>{var c;const s=await _("/me");return rs(s.csrfToken||((c=s.user)==null?void 0:c.csrfToken)),s},login:async(s,c)=>{var h;const g=await _("/login",{method:"POST",body:JSON.stringify({username:s,password:c})});return rs((h=g.user)==null?void 0:h.csrfToken),g},logout:async()=>{try{return await _("/logout",{method:"POST"})}finally{rs("")}},calendars:()=>_("/calendars"),createCalendar:s=>_("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>_("/holidays/countries"),updateCalendar:(s,c)=>_(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteCalendar:s=>_(`/calendars/${s}`,{method:"DELETE"}),calendarEvents:(s,c,g)=>{const h=new URLSearchParams({from:c,to:g}).toString();return _(`/calendars/${s}/events?${h}`)},getEvent:(s,c)=>_(`/calendars/${s}/events/${at(c)}`),createEvent:(s,c)=>_(`/calendars/${s}/events`,{method:"POST",body:JSON.stringify(c)}),updateEvent:(s,c,g)=>_(`/calendars/${s}/events/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(s,c)=>_(`/calendars/${s}/events/${at(c)}`,{method:"DELETE"}),exportCalendar:async s=>{const c=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const R=await c.json();R.error&&(U=R.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`calendar-${s}.ics`;return{blob:await c.blob(),filename:w}},importCalendar:(s,c,g)=>sn(`/calendars/${s}/import`,c,"text/calendar; charset=utf-8",g),directory:()=>_("/directory"),shares:s=>_(`/calendars/${s}/shares`),share:(s,c,g)=>_(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:c,access:g})}),revoke:(s,c)=>_(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:c})}),addressbooks:()=>_("/addressbooks"),createAddressBook:s=>_("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,c)=>_(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(c)}),deleteAddressBook:(s,c=!1)=>_(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:c})}),exportAddressBook:async s=>{const c=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!c.ok){let U=`Export failed (${c.status})`;try{const R=await c.json();R.error&&(U=R.error)}catch{}throw new Ie(U,c.status)}const g=c.headers.get("Content-Disposition")||"",h=/filename="([^"]+)"/i.exec(g),w=(h==null?void 0:h[1])||`contacts-${s}.vcf`;return{blob:await c.blob(),filename:w}},importAddressBook:(s,c,g)=>sn(`/addressbooks/${s}/import`,c,"text/vcard; charset=utf-8",g),contacts:(s,c="")=>{const g=c.trim()?`?q=${encodeURIComponent(c.trim())}`:"";return _(`/addressbooks/${s}/contacts${g}`)},getContact:(s,c)=>_(`/addressbooks/${s}/contacts/${at(c)}`),createContact:(s,c)=>_(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(c)}),updateContact:(s,c,g)=>_(`/addressbooks/${s}/contacts/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(s,c)=>_(`/addressbooks/${s}/contacts/${at(c)}`,{method:"DELETE"}),exportContact:async(s,c)=>{const g=await fetch(`/api/addressbooks/${s}/contacts/${at(c)}/export`,{credentials:"same-origin"});if(!g.ok){let R=`Export failed (${g.status})`;try{const W=await g.json();W.error&&(R=W.error)}catch{}throw new Ie(R,g.status)}const h=g.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(h),q=(w==null?void 0:w[1])||"contact.vcf";return{blob:await g.blob(),filename:q}},contactPhotoUrl:(s,c)=>`/api/addressbooks/${s}/contacts/${at(c)}/photo`,tasks:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/tasks${g}`)},createTask:s=>_("/tasks",{method:"POST",body:JSON.stringify(s)}),updateTask:(s,c,g)=>_(`/tasks/${s}/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(s,c)=>_(`/tasks/${s}/${at(c)}`,{method:"DELETE"}),bulkTasks:s=>_("/tasks/bulk",{method:"POST",body:JSON.stringify(s)}),notes:(s={})=>{const c=new URLSearchParams;s.q&&c.set("q",s.q),s.sort&&c.set("sort",s.sort),s.order&&c.set("order",s.order);const g=c.toString()?`?${c}`:"";return _(`/notes${g}`)},createNote:s=>_("/notes",{method:"POST",body:JSON.stringify(s)}),updateNote:(s,c,g)=>_(`/notes/${s}/${at(c)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(s,c)=>_(`/notes/${s}/${at(c)}`,{method:"DELETE"}),filesStatus:()=>_("/files"),filesList:(s="")=>{const c=new URLSearchParams;s&&c.set("path",s);const g=c.toString()?`?${c}`:"";return _(`/files/entries${g}`)},filesMkdir:(s,c)=>_("/files/mkdir",{method:"POST",body:JSON.stringify({path:s,name:c})}),filesUpload:async(s,c,g={})=>{const h=new URLSearchParams;s&&h.set("path",s),h.set("name",c.name),g.replace&&h.set("replace","1");const w=new Headers;la&&w.set("X-CSRF-Token",la);const q=new FormData;q.append("file",c,c.name),s&&q.append("path",s);const U=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST /files/upload path=${s||"/"} name=${c.name} size=${c.size}`);const R=await fetch(`/api/files/upload?${h}`,{method:"POST",headers:w,credentials:"same-origin",body:q}),W=await R.text();let Z=null;if(W)try{Z=JSON.parse(W)}catch{Z={error:W}}const ie=Math.round((typeof performance<"u"?performance.now():Date.now())-U);if(!R.ok){let ne=`Upload failed (${R.status})`;throw Z&&typeof Z=="object"&&Z!==null&&"error"in Z&&typeof Z.error=="string"&&(ne=Z.error),R.status===401?(N.debug(`api ← POST /files/upload 401 (${ie}ms)`,ne),os("/files/upload",ne)):R.status>=500?N.error(`api ← POST /files/upload ${R.status} (${ie}ms)`,ne):N.warn(`api ← POST /files/upload ${R.status} (${ie}ms)`,ne),new Ie(ne,R.status)}return N.info(`api ← POST /files/upload 200 (${ie}ms)`),xs("/files/upload"),Z},filesDownloadUrl:s=>{const c=new URLSearchParams;return c.set("path",s),`/api/files/download?${c}`},filesDelete:s=>_("/files/entry",{method:"DELETE",body:JSON.stringify({path:s})}),filesRename:(s,c)=>_("/files/rename",{method:"POST",body:JSON.stringify({path:s,newName:c})}),filesMove:(s,c,g)=>_("/files/move",{method:"POST",body:JSON.stringify({from:s,to:c,newName:g})}),filesCopy:(s,c={})=>_("/files/copy",{method:"POST",body:JSON.stringify({path:s,to:c.to,newName:c.newName})}),filesBulk:(s,c)=>_("/files/bulk",{method:"POST",body:JSON.stringify({op:s,paths:c})})},Wr=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let wa=null;function Jr(){if(wa)return wa;try{const s=Intl;if(typeof s.supportedValuesOf=="function"){const c=s.supportedValuesOf("timeZone");if(Array.isArray(c)&&c.length>0)return wa=[...c].sort((g,h)=>g.localeCompare(h)),wa}}catch{}return wa=[...Wr],wa}function cn(s){const c=s||"UTC",g=Jr(),h=g.includes(c),w=g.map(q=>`<option value="${nn(q)}" ${q===c?"selected":""}>${rn(q)}</option>`);return!h&&c&&w.unshift(`<option value="${nn(c)}" selected>${rn(c)}</option>`),w.join("")}function nn(s){return s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function rn(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ra(s,c,g={}){if(!c)return"";const h=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,w=g.dismissAction??"flash-close",q=g.role??"status",U=g.className?` ${g.className}`:"",R=g.style?` style="${i(g.style)}"`:"",W=h?`<button type="button" class="flash-close" data-action="${i(w)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${i(s)}${U}" role="${i(q)}"${R}>
      <span class="flash-text">${i(c)}</span>
      ${W}
    </div>`}function Yr(s){return s==="sm"?" cal-modal-card-sm":s==="wide"?" cal-modal-card-wide":""}function Kr(s){return s==="danger"?"btn btn-danger":s==="ghost"?"btn btn-ghost":"btn btn-primary"}function un(s){return s.map(g=>{const h=g.type??"button",w=Kr(g.variant),q=g.disabled?" disabled":"",U=g.id?` id="${i(g.id)}"`:"",R=g.action?` data-action="${i(g.action)}"`:"",W=g.attrs?` ${g.attrs}`:"";return`<button type="${h}" class="${w}"${R}${U}${W}${q}>${i(g.label)}</button>`}).join(`
`)}function De(s){const c=s.titleId||(s.id?`${s.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=s.id?` id="${i(s.id)}"`:"",h=s.className?` ${s.className}`:"",w=s.rootAttrs?` ${s.rootAttrs}`:"",q=`${Yr(s.size)}${s.cardClassName?` ${s.cardClassName}`:""}`,U=s.closeAction,R=s.lockBackdrop?"":` data-action="${i(U)}"`,W=s.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${i(U)}" aria-label="Close">×</button>`;let Z="";s.footer!==void 0&&(Z=typeof s.footer=="string"?s.footer:un(s.footer));const ie=Z?`<footer class="cal-modal-footer">${Z}</footer>`:"",ne=`<div class="cal-modal-body">${s.body}</div>`;let ee;return s.form?ee=`<form class="stack"${s.formAttrs?` ${s.formAttrs}`:""}>
        ${ne}
        ${ie}
      </form>`:ee=`${ne}
      ${ie}`,`<div class="cal-modal${h}"${g}${w} role="dialog" aria-modal="true" aria-labelledby="${i(c)}">
      <div class="cal-modal-backdrop"${R}></div>
      <div class="cal-modal-card${q}">
        <header class="cal-modal-header">
          <h3 id="${i(c)}">${i(s.title)}</h3>
          ${W}
        </header>
        ${ee}
      </div>
    </div>`}function as(s){const c=s.style==="checkbox"?"checkbox":"admin-delete-confirm",g=s.style==="checkbox"?' style="margin-top:1rem"':"",h=s.id?` id="${i(s.id)}"`:"",w=s.checked?" checked":"",q=s.disabled?" disabled":"";return`<label class="${c}"${g}>
            <input type="checkbox"${h} data-action="${i(s.action)}"${w}${q} />
            ${i(s.label)}
          </label>`}const mn="angaradav-portal-tab",pn="angaradav-portal-admin-page",Gr="2.0.0",Qr="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ts(s){return s==="calendars"||s==="contacts"||s==="tasks"||s==="notes"||s==="files"||s==="admin"?s:null}function is(s){return s==="overview"||s==="users"||s==="settings"||s==="database"?s:null}function _s(){const s=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!s)return{tab:null,adminPage:null,adminUsername:null};if(s==="admin"||s.startsWith("admin/")){const c=s.split("/").filter(Boolean),g=c[1]??"overview",h=is(g)??"overview";let w=null;if(h==="users"&&c[2])try{w=decodeURIComponent(c[2])}catch{w=c[2]}return{tab:"admin",adminPage:h,adminUsername:w}}return{tab:Ts(s),adminPage:null,adminUsername:null}}function Xr(){const s=_s().tab;if(s)return s;try{const c=Ts(sessionStorage.getItem(mn));if(c)return c}catch{}return"calendars"}function Zr(){const s=_s().adminPage;if(s)return s;try{const c=is(sessionStorage.getItem(pn));if(c)return c}catch{}return"overview"}function el(s,c=null){return s==="overview"?"#admin":s==="users"&&c?`#admin/users/${encodeURIComponent(c)}`:`#admin/${s}`}function it(s,c="overview",g=null){try{sessionStorage.setItem(mn,s),s==="admin"&&sessionStorage.setItem(pn,c)}catch{}if(typeof history>"u"||typeof location>"u")return;const h=s==="admin"?el(c,g):`#${s}`;location.hash!==h&&history.replaceState(null,"",`${location.pathname}${location.search}${h}`)}function As(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(s)}</span>`}function Es(s){const c=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&c.push(`${s.skipped} skipped`),c.join(", ")}const tl={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function ve(s,c,g="h2"){const h=g;return`<div class="section-title-row">
    <${h}>${i(s)}</${h}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(c)}"
      aria-label="About ${i(s)}" title="About ${i(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function al(){return`
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
    </div>`}function sl(s){let c=null,g=null,h=Xr(),w=Zr(),q=null,U=!1,R=null,W=null,Z=null,ie=[],ne=!1,ee=null,ut="",B=_s().adminUsername??null,V=null,G=!1,qe=null,He=!1,Le=!1,mt=null,Dt=!1,Ct=[],At=[],ka=!1,Ye=null,Bt=null,st=null,jt=null,$e=null,zt=null,Fa=!1,Sa=null,oa=!1,Et=!1,Ht=null,Ma=!1,Da=null,Wt="sqlite",ia=!1,pt="",da=null,Oe=!1,ca=null,re=[],Jt=[],Ra=[],F=null,K=[],Yt=[],We=null,fe=!1,Re=!1,Ve=null,Ke=null,Nt={y:new Date().getFullYear(),m:new Date().getMonth()},Kt=[],us=!1,ft=!1,k=null,nt=!1,O=null,Va="",Ca=null,Ue=[],M=null,yt=[],Gt="",ce=null,I=null,be=!1,Ce=!1,Ge=!1,Ee=null,Je=null,Qe=!1,d=!1,j=null,Ba=null,qs=!1,ua={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Xe=null,Ls=900,Aa=null,Qt=Gr,ms=!1,ja=!1;function ps(t){if(!t)return;const e=(t.timeFormat||"auto").toLowerCase(),a=(t.weekStart||"auto").toLowerCase();ua={timeFormat:e==="12h"||e==="24h"?e:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:t.logLevel||"off"},Br(ua.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(Ls=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(Qt=t.version.trim())}function fs(){Aa!==null&&(clearTimeout(Aa),Aa=null)}function bs(){if(fs(),!c)return;const t=Math.max(30,Ls)*1e3;Aa=setTimeout(()=>{Aa=null,Fs("Your session timed out. Please sign in again.")},t)}function za(){fs(),gt(),j=null,c=null,re=[],Yt=[],F=null,K=[],Jt=[],Ue=[],M=null,yt=[],ce=null,I=null,be=!1,Ce=!1,Ge=!1,Re=!1,fe=!1,Ve=null,Ke=null,ft=!1,k=null,nt=!1,Kt=[],Ne=[],pa=[],Tt=[],_t=[],Pe=null,rt=null,z=null,le=null,Q=!1,ke=!1,ye=[],hs=null,Fe="",xe=[],ba=!1,Se=null,ge=null,de=null,bt=!1,ue=[],Ee=null,Je=null,Qe=!1,d=!1,Oe=!1,q=null,U=!1,R=null,W=null,Z=null,ie=[],ne=!1,ee=null,ut="",B=null,V=null,G=!1,qe=null,He=!1,Le=!1,mt=null,Dt=!1,Ct=[],At=[],ka=!1,Ye=null,Bt=null,st=null,jt=null,$e=null,zt=null,Fa=!1,Sa=null,oa=!1,Et=!1,Ht=null,Ma=!1,Da=null,Wt="sqlite",ia=!1,pt="",da=null,Na()}function we(){return!!(c!=null&&c.isAdmin||(c==null?void 0:c.role)==="Admin")}function xt(){return we()?W===null?!0:W.uiEnabled!==!1:!1}function Be(t){const e=W==null?void 0:W.pages;return e?e.find(a=>a.id===t)??null:null}function ma(t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Ea(t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function Na(){ca&&(document.removeEventListener("click",ca,!0),ca=null)}function fn(){Na(),ca=e=>{var l;const a=e.target;(l=a==null?void 0:a.closest)!=null&&l.call(a,".user-menu")||(Oe=!1,Na(),m())};const t=ca;setTimeout(()=>{Oe&&ca===t&&document.addEventListener("click",t,!0)},0)}function Os(){h==="admin"&&(!we()||!xt())&&(h="calendars",w="overview",it(h))}async function Us(t,e={}){if(!we()){await Ps("calendars",e);return}h="admin",w=t,t!=="users"?(B=null,V=null,qe=null):e.username!==void 0&&(B=e.username,e.username||(V=null,qe=null)),Oe=!1,it("admin",t,B),N.event("tab",{tab:"admin",adminPage:t,user:B}),e.clearFlash!==!1&&E(),d=!0,m();try{if(await gs(),!xt()){h="calendars",it("calendars"),b("info","Portal Administration UI is disabled.");return}const a=Be(t);t==="overview"&&(a==null?void 0:a.available)!==!1?await Ha():t==="users"&&(a==null?void 0:a.available)!==!1?(await Xt(),B&&(await vt(B),await Zt(B))):t==="settings"&&(a==null?void 0:a.available)!==!1?await Wa():t==="database"&&(a==null?void 0:a.available)!==!1&&await Ja()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,m()}}async function gs(){var t;Z=null;try{W=(await A.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:W.uiEnabled,pages:((t=W.pages)==null?void 0:t.length)??0})}catch(e){Z=e instanceof Error?e.message:"Failed to load capabilities",W={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",Z)}}async function Ha(){U=!0,R=null;try{q=(await A.adminDashboard()).data,N.debug("admin.dashboard",{users:q.users,calendars:q.calendars})}catch(t){throw q=null,R=t instanceof Error?t.message:"Failed to load dashboard",t}finally{U=!1}}async function Xt(){ne=!0,ee=null;try{ie=(await A.adminUsers()).users??[],N.debug("admin.users",{count:ie.length})}catch(t){throw ie=[],ee=t instanceof Error?t.message:"Failed to load users",t}finally{ne=!1}}async function vt(t){G=!0,qe=null;try{const e=await A.adminUser(t);V=e.user,B=e.user.username,N.debug("admin.user",{username:e.user.username})}catch(e){throw V=null,qe=e instanceof Error?e.message:"Failed to load user",e}finally{G=!1}}async function Zt(t){ka=!0;try{const[e,a]=await Promise.all([A.adminUserCalendars(t),A.adminUserAddressBooks(t)]);Ct=e.calendars??[],At=a.addressbooks??[]}catch(e){throw Ct=[],At=[],e}finally{ka=!1}}async function Wa(){Fa=!0,Sa=null;try{zt=(await A.adminSystemSettings()).data}catch(t){throw zt=null,Sa=t instanceof Error?t.message:"Failed to load settings",t}finally{Fa=!1}}async function Ja(){Ma=!0,Da=null;try{const t=await A.adminDatabaseSettings();Ht=t.data,Wt=(t.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(t){throw Ht=null,Da=t instanceof Error?t.message:"Failed to load database settings",t}finally{Ma=!1}}async function bn(t){const e=new FormData(t),a=String(e.get("username")??"").trim(),l=String(e.get("displayname")??"").trim(),o=String(e.get("email")??"").trim(),p=String(e.get("password")??""),n=String(e.get("passwordConfirm")??"");if(!a||!l||!o||!p){b("error","Username, display name, email, and password are required"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}d=!0,E(),m();try{const r=await A.adminCreateUser({username:a,displayname:l,email:o,password:p,passwordConfirm:n});N.event("admin.user.create",{username:r.user.username}),He=!1,B=r.user.username,V=r.user,it("admin","users",r.user.username),await Xt(),b("success",`Created user “${r.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Create failed")}finally{d=!1,m()}}async function gn(t){var u,f;if(!B)return;const e=B,a=new FormData(t),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim(),p=String(a.get("calendarcolor")??"").trim(),n=((u=t.querySelector('input[name="todos"]'))==null?void 0:u.checked)??!1,r=((f=t.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;d=!0,E(),m();try{if(Ye==="create"){const y=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserCalendar(e,{uri:y,displayname:l,description:o,calendarcolor:p||void 0,todos:n,notes:r}),b("success",`Created calendar “${l}”`)}else{const y=Number(a.get("instanceId"));await A.adminUpdateUserCalendar(e,y,{displayname:l,description:o,calendarcolor:p,todos:n,notes:r}),b("success",`Updated calendar “${l}”`)}Ye=null,Bt=null,await Zt(e),await vt(e)}catch(y){b("error",y instanceof Error?y.message:"Save failed")}finally{d=!1,m()}}async function hn(t){if(!B)return;const e=B,a=new FormData(t),l=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim();d=!0,E(),m();try{if(st==="create"){const p=String(a.get("uri")??"").trim().toLowerCase();await A.adminCreateUserAddressBook(e,{uri:p,displayname:l,description:o}),b("success",`Created address book “${l}”`)}else{const p=Number(a.get("id"));await A.adminUpdateUserAddressBook(e,p,{displayname:l,description:o}),b("success",`Updated address book “${l}”`)}st=null,jt=null,await Zt(e),await vt(e)}catch(p){b("error",p instanceof Error?p.message:"Save failed")}finally{d=!1,m()}}function yn(t){const e=new FormData(t),a=String(e.get("backend")??Wt).toLowerCase()==="pgsql"?"pgsql":"sqlite",l={backend:a};a==="sqlite"?l.sqlite_file=String(e.get("sqlite_file")??"").trim():(l.pgsql_host=String(e.get("pgsql_host")??"").trim(),l.pgsql_dbname=String(e.get("pgsql_dbname")??"").trim(),l.pgsql_username=String(e.get("pgsql_username")??"").trim(),l.pgsql_password=String(e.get("pgsql_password")??"")),da=l,pt="",ia=!0,E(),m()}async function vn(t){const e=new FormData(t),a=n=>{var r;return!!((r=t.querySelector(`input[name="${n}"]`))!=null&&r.checked)},l={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(e.get("timezone")??"").trim(),invite_from:String(e.get("invite_from")??"").trim(),dav_auth_type:String(e.get("dav_auth_type")??"Digest"),files_storage_path:String(e.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(e.get("files_max_upload_mb")??0),files_quota_mb:Number(e.get("files_quota_mb")??0),files_quarantine_days:Number(e.get("files_quarantine_days")??0),session_max_age_minutes:Number(e.get("session_max_age_minutes")??15),portal_log_level:String(e.get("portal_log_level")??"off"),portal_admin_users:String(e.get("portal_admin_users")??"").trim(),push_external_url:String(e.get("push_external_url")??"").trim(),push_log_level:String(e.get("push_log_level")??"off")},o=String(e.get("admin_password")??""),p=String(e.get("admin_password_confirm")??"");(o!==""||p!=="")&&(l.admin_password=o,l.admin_password_confirm=p),d=!0,E(),m();try{zt=(await A.adminUpdateSystemSettings(l)).data,N.event("admin.settings.save"),b("success","System settings saved")}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,m()}}async function $n(t){const e=new FormData(t),a=String(e.get("username")??"").trim(),l=String(e.get("displayname")??"").trim(),o=String(e.get("email")??"").trim(),p=String(e.get("password")??""),n=String(e.get("passwordConfirm")??"");if(!a){b("error","Username is required"),m();return}if(!l||!o){b("error","Display name and email are required"),m();return}if(p!==""||n!==""){if(p===""||n===""){b("error","Password and confirmation are required to change password"),m();return}if(p!==n){b("error","Password confirmation does not match"),m();return}}d=!0,E(),m();try{const r={displayname:l,email:o};p!==""&&(r.password=p,r.passwordConfirm=n);const u=await A.adminUpdateUser(a,r);N.event("admin.user.update",{username:u.user.username,passwordChanged:p!==""}),Le=!1,V=u.user,B=u.user.username,await Xt(),b("success",p!==""?`Updated “${u.user.username}” (password changed)`:`Updated “${u.user.username}”`)}catch(r){b("error",r instanceof Error?r.message:"Update failed")}finally{d=!1,m()}}async function Ps(t,e={}){if(t==="admin"&&(!we()||!xt())&&(we()&&W&&!W.uiEnabled&&b("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t="calendars"),t==="admin"){await Us(w||"overview",{...e,username:w==="users"?B:null});return}h=t,Oe=!1,it(t),N.event("tab",{tab:t}),t!=="calendars"&&(fe=!1,Ve=null),t!=="contacts"&&(Ke=null),e.clearFlash!==!1&&E(),d=!0,m();try{t==="contacts"&&M!==null?await Lt(M):t==="calendars"?await et():t==="tasks"?await Ot():t==="notes"?await ga():t==="files"&&await $t()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,m()}}async function $t(){ba=!0;try{N.debug("loadFiles",{path:Fe});const[t,e]=await Promise.all([A.filesStatus(),A.filesList(Fe).catch(a=>{if(a instanceof Ie&&(a.status===503||a.status===404))return{path:Fe,entries:[]};throw a})]);if(hs=t,t.ready){Fe=e.path,xe=e.entries;const a=new Set(xe.map(l=>l.path));ue=ue.filter(l=>a.has(l))}else xe=[],ue=[];N.event("loadFiles",{path:Fe,count:xe.length,enabled:t.enabled,ready:t.ready})}finally{ba=!1}}function Fs(t){if(!ms){if(!c){fs();return}ms=!0;try{N.event("session.expired"),za(),ja=!0,g={type:"info",message:t&&t.trim()?t:"Your session timed out. Please sign in again."},m()}finally{ms=!1}}}let Ne=[],pa=[],Tt=[],_t=[],Ya="",Ka="",It="due",wt="asc",fa="dtstart",ea="desc",Pe=null,rt=null,z=null,le=null,Q=!1,ke=!1,ye=[],hs=null,Fe="",xe=[],ba=!1,Se=null,ge=null,de=null,bt=!1,ue=[];function b(t,e){ja&&t==="error"||(t!=="error"&&(ja=!1),g={type:t,message:e})}function E(){g=null,ja=!1}function wn(t){const e=String(t.step||"");e==="upgrade"||e==="initialize"||e==="permissions"||e==="database"?(We={step:e,message:t.message||(e==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(Qt=t.productVersion.trim())):We=null}function kn(t){if(!(t instanceof Ie)||t.status!==503)return!1;const e=typeof t.payload.code=="string"?t.payload.code:"";return e!=="upgrade_required"&&e!=="not_configured"&&e!=="admin_password_missing"?!1:(We={step:e==="upgrade_required"?"upgrade":"initialize",message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},We.productVersion&&(Qt=We.productVersion),!0)}async function Sn(){var t,e,a,l;N.event("bootstrap.start"),zr(o=>{Fs(/timed\s*out|session expired/i.test(o)?o:"Your session timed out. Please sign in again.")}),Hr(()=>{bs()});try{const o=await A.installStatus();wn(o)}catch(o){N.debug("bootstrap: /api/install/status failed",o instanceof Error?o.message:o)}try{const o=await A.ui();ps(o.ui),typeof o.version=="string"&&o.version.trim()!==""?Qt=o.version.trim():o.ui&&typeof o.ui.version=="string"&&o.ui.version.trim()!==""&&(Qt=o.ui.version.trim()),We==null||We.step}catch(o){N.debug("bootstrap: /api/ui failed",o instanceof Error?o.message:o),kn(o)}if(We&&We.step!=="done"&&We.step!=="locked"){za(),N.event("bootstrap.installGate",{step:We.step}),m();return}try{const o=await A.me();if(c=o.user,ps(o.ui),typeof o.version=="string"&&o.version.trim()!==""&&(Qt=o.version.trim()),N.event("bootstrap.session",{username:(c==null?void 0:c.username)??null}),bs(),we())try{await gs()}catch(p){N.warn("admin.capabilities bootstrap",p instanceof Error?p.message:p)}if(Os(),it(h,w),await Ze(),h==="admin"&&we()&&xt())try{w==="overview"&&((t=Be("overview"))==null?void 0:t.available)!==!1?await Ha():w==="users"&&((e=Be("users"))==null?void 0:e.available)!==!1?(await Xt(),B&&(await vt(B),await Zt(B))):w==="settings"&&((a=Be("settings"))==null?void 0:a.available)!==!1?await Wa():w==="database"&&((l=Be("database"))==null?void 0:l.available)!==!1&&await Ja()}catch(p){N.warn("admin bootstrap load",p instanceof Error?p.message:p)}}catch(o){o instanceof Ie&&o.status===401?(za(),/timed\s*out|session expired/i.test(o.message)&&b("info",o.message),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",o instanceof Error?o.message:o),b("error",o instanceof Error?o.message:"Failed to load"))}m()}async function Ze(){N.debug("loadHome");const[t,e,a]=await Promise.all([A.calendars(),A.directory().catch(()=>({users:[]})),A.addressbooks()]);if(re=t.calendars,Jt=e.users,Ue=a.addressbooks,N.event("loadHome",{calendars:re.length,addressBooks:Ue.length,directory:Jt.length}),Ra.length===0)try{Ra=(await A.holidayCountries()).countries}catch{Ra=[]}if(K=K.filter(l=>re.some(o=>o.id===l)),F!==null&&!re.some(l=>l.id===F)&&(F=null,Yt=[],fe=!1,Ve=null),K.length===0){const l=Ms();l?(K=[l.id],F=l.id):re.length>0&&(K=[re[0].id],F=re[0].id)}F===null&&K.length>0&&(F=K[0]),F!==null&&fe?await xa(F):F!==null&&(Yt=[]),h==="calendars"&&await et(),M!==null&&!Ue.some(l=>l.id===M)&&(M=null,yt=[],ce=null,I=null,be=!1),Ke!==null&&!Ue.some(l=>l.id===Ke)&&(Ke=null),M===null&&Ue.length>0&&(M=Ue[0].id),M!==null&&h==="contacts"&&await Lt(M),h==="tasks"&&await Ot(),h==="notes"&&await ga(),h==="files"&&await $t()}async function xa(t){Yt=(await A.shares(t)).shares}function Ms(){const t=re.filter(a=>a.canShare);if(t.length===0)return null;const e=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return t.find(e)??t[0]??null}function he(t){const e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),l=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${l}`}function Dn(t,e){const a=new Date(t,e,1),l=new Date(t,e+1,0);return{from:he(a),to:he(l)}}function ys(t){if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[a,l,o]=t.split("-").map(Number);return new Date(a,l-1,o)}const e=new Date(t);if(Number.isNaN(e.getTime())){const[a,l,o]=t.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function Cn(t){const e=ys(t.start);if(!t.end)return[he(e)];let a=ys(t.end);if(!t.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(t.end)){const r=new Date(t.end);!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getSeconds()===0&&r.getTime()>new Date(t.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<e)return[he(e)];const l=[],o=new Date(e.getFullYear(),e.getMonth(),e.getDate()),p=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=p&&n++<370;)l.push(he(o)),o.setDate(o.getDate()+1);return l.length?l:[he(e)]}function vs(t,e){const a=t.slice(0,10),l=(e||a).slice(0,10);if(a===l){const $=_a(a);return{start:$.start,end:$.end}}const[o,p,n]=a.split("-").map(Number),[r,u,f]=l.split("-").map(Number),y=qt(new Date(o,p-1,n,9,0,0,0)),v=qt(new Date(r,u-1,f,17,0,0,0));return{start:y,end:v}}function An(t,e){const a=ta(t);let l=e?ta(e):a;if(e&&!/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=new Date(e);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(t).getTime()){const p=ys(e);p.setDate(p.getDate()-1),l=he(p)}}return{start:a,end:l}}async function et(){const t=K.filter(l=>re.some(o=>o.id===l));if(t.length===0){Kt=[];return}const{from:e,to:a}=Dn(Nt.y,Nt.m);us=!0,N.debug("loadMonthEvents",{selectedIds:t,from:e,to:a});try{const o=(await Promise.all(t.map(async p=>(await A.calendarEvents(p,e,a)).events.map(r=>({...r,instanceId:p}))))).flat();o.sort((p,n)=>{const r=p.start||"",u=n.start||"";return r!==u?r<u?-1:1:(p.summary||"").localeCompare(n.summary||"")}),Kt=o,N.event("monthEvents.loaded",{calendarIds:t,count:Kt.length,from:e,to:a})}catch(l){Kt=[],N.warn("loadMonthEvents failed",l instanceof Error?l.message:l)}finally{us=!1}}function En(t){const e=re.find(a=>a.id===t);return e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6"}function Nn(t){K.includes(t)?(K=K.filter(e=>e!==t),F===t&&(F=K[0]??null)):(K=[...K,t],F=t)}function xn(t,e){return new Date(t,e,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Tn(t){const e=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return e;const a=new Date(t.start);return Number.isNaN(a.getTime())?e:`${a.toLocaleTimeString(void 0,$s())} ${e}`}function _n(){const t=re.filter(x=>K.includes(x.id)),e=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,a=Nt.y,l=Nt.m,o=new Date(a,l,1),p=ws(),n=(o.getDay()-p+7)%7,r=new Date(a,l+1,0).getDate(),u=new Date(a,l,0).getDate(),y=he(new Date),v=Rs(),$=new Map;for(const x of Kt)for(const J of Cn(x)){const H=$.get(J)??[];H.push(x),$.set(J,H)}const T=[],D=Math.ceil((n+r)/7)*7;for(let x=0;x<D;x++){let J,H=!0,X;x<n?(J=u-n+x+1,H=!1,X=new Date(a,l-1,J)):x>=n+r?(J=x-(n+r)+1,H=!1,X=new Date(a,l+1,J)):(J=x-n+1,X=new Date(a,l,J));const pe=he(X),Ae=pe===y,Te=H?$.get(pe)??[]:[],ht=Ca===pe?50:3,ot=Te.slice(0,ht),kt=Te.length-ot.length,je=ot.map(Me=>{var oe;const _e=Me.instanceId,ze=Tn(Me),$a=En(_e),es=((oe=re.find(tt=>tt.id===_e))==null?void 0:oe.displayname)||"",S=es?`${ze} · ${es}`:ze;return`<button type="button" class="month-event${Me.allDay?"":" is-timed"}" title="${i(S)}" style="--ev-color:${i($a)}"
            data-action="open-event" data-instance="${_e}" data-uri="${i(Me.uri)}" ${d?"disabled":""}>${i(ze)}</button>`}).join(""),Mt=kt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${i(pe)}" title="Show all events this day" ${d?"disabled":""}>+${kt} more</button>`:"",C=!H&&(J===1||x===n+r)?X.toLocaleString(void 0,{month:"short",day:"numeric"}):String(J),ae=F!==null?re.find(Me=>Me.id===F)??null:null,Y=!!(ae&&!ae.readOnly&&(ae.canShare||ae.access==="readwrite"));T.push(`<div class="month-cell${H?"":" is-outside"}${Ae?" is-today":""}${Y?" is-clickable":""}"${Y?` data-action="new-event-day" data-day="${i(pe)}" role="button" tabindex="0" title="Add event on ${i(pe)}"`:""}>
        <div class="month-daynum${Ae?" is-today-num":""}">${i(C)}</div>
        <div class="month-events">${je}${Mt}</div>
      </div>`)}const L=t.length===0?re.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Check one or more calendars on the left to view events.</p>':us?'<p class="muted small month-empty-hint">Loading events…</p>':"",te=t.slice(0,6).map(x=>{const J=x.color&&x.color.length>=7?x.color.slice(0,7):x.color||"#3B82F6";return`<span class="cal-swatch" style="background:${i(J)};margin-top:0" title="${i(x.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${d?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${d?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${d?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i(xn(a,l))}</h2>
        <span class="month-cal-name muted small" title="${i(e)}">
          ${te}
          ${i(e)}
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
    </section>`}function ta(t){if(!t)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const e=new Date(t);return Number.isNaN(e.getTime())?t.slice(0,10):he(e)}function In(){if(ua.timeFormat==="24h")return!1;if(ua.timeFormat==="12h")return!0;try{const e=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(e.hourCycle==="h23"||e.hourCycle==="h24")return!1;if(e.hourCycle==="h11"||e.hourCycle==="h12")return!0;if(typeof e.hour12=="boolean")return e.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function $s(){return In()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function ws(){var a;if(ua.weekStart==="monday")return 1;if(ua.weekStart==="sunday")return 0;const t=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of t)try{const o=new Intl.Locale(l),p=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const e=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(e)?0:1}function Rs(){const t=ws(),e=new Date(2024,0,7+t),a=[];for(let l=0;l<7;l++){const o=new Date(e);o.setDate(e.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Vs(t,e=15){const a=e*60*1e3,l=t.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function qt(t){const e=a=>String(a).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}function qn(t,e){if(!t)return"Select…";if(e||/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=t.slice(0,10),[o,p,n]=l.split("-").map(Number);return new Date(o,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((t.includes("T")&&t.length===16,t));return Number.isNaN(a.getTime())?t:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...$s()})}function Ta(t){if(!t){const a=Vs(new Date);return{date:he(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(t))return{date:t,hm:"09:00"};const e=new Date((t.length===16,t));return Number.isNaN(e.getTime())?{date:t.slice(0,10),hm:"09:00"}:{date:he(e),hm:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}function _a(t){const e=new Date,a=he(e);if(t&&t!==a){const[p,n,r]=t.split("-").map(Number),u=new Date(p,n-1,r,9,0,0,0),f=new Date(p,n-1,r,10,0,0,0);return{start:qt(u),end:qt(f)}}const l=Vs(e,15),o=new Date(l.getTime()+3600*1e3);return{start:qt(l),end:qt(o)}}function Ln(){const t=[];for(let e=0;e<24;e++)for(let a=0;a<60;a+=15)t.push(`${String(e).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return t}function aa(t){const{field:e,name:a,label:l,value:o,dateOnly:p=!1,required:n,disabled:r,allowClear:u=!0}=t,f=(O==null?void 0:O.field)===e,y=qn(o,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${i(e)}">
      <span class="dt-field-label">${i(l)}</span>
      <input type="hidden" name="${i(a)}" value="${i(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${i(e)}"
        data-dt-name="${i(a)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${u?"1":"0"}"
        ${r?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${i(y)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!r?On(e,o,p,u):""}
    </div>`}function ks(t){var e;return t==="start"?String((k==null?void 0:k.start)||""):t==="end"?String((k==null?void 0:k.end)||""):t==="until"?((e=k==null?void 0:k.repeat)==null?void 0:e.until)||ta(k==null?void 0:k.start)||he(new Date):t==="due"?ha(z==null?void 0:z.due):t==="dtstart"?ha(le==null?void 0:le.dtstart):t==="bulk-due"?Va:t==="birthday"?String((I==null?void 0:I.birthday)||""):""}function lt(t,e){if(t==="start"&&k){k={...k,start:e||""};return}if(t==="end"&&k){k={...k,end:e};return}if(t==="until"&&k){k={...k,repeat:{...k.repeat??Ga(),until:e,endMode:"until"}};return}if(t==="due"&&z){if(e===null||e==="")z={...z,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))z={...z,due:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));z={...z,due:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="dtstart"&&le){if(e===null||e==="")le={...le,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))le={...le,dtstart:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));le={...le,dtstart:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="birthday"&&I){I={...I,birthday:e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null};return}t==="bulk-due"&&(Va=e||"")}function On(t,e,a,l){const o=Ta(e),p=(O==null?void 0:O.viewY)??Number(o.date.slice(0,4)),n=(O==null?void 0:O.viewM)??Number(o.date.slice(5,7))-1,r=ws(),u=Rs(),y=(new Date(p,n,1).getDay()-r+7)%7,v=new Date(p,n+1,0).getDate(),$=new Date(p,n,0).getDate(),T=o.date,D=o.hm,L=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),te=[],x=Math.ceil((y+v)/7)*7;for(let H=0;H<x;H++){let X,pe,Ae=!1;H<y?(X=$-y+H+1,pe=new Date(p,n-1,X),Ae=!0):H>=y+v?(X=H-(y+v)+1,pe=new Date(p,n+1,X),Ae=!0):(X=H-y+1,pe=new Date(p,n,X));const Te=he(pe),ht=Te===T,ot=Te===he(new Date);te.push(`<button type="button" class="dt-day${Ae?" is-outside":""}${ht?" is-selected":""}${ot?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${i(Te)}">${X}</button>`)}const J=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Ln().map(H=>{const X=(()=>{const[pe,Ae]=H.split(":").map(Number);return new Date(2e3,0,1,pe,Ae).toLocaleTimeString(void 0,$s())})();return`<button type="button" class="dt-time${H===D?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${H}" role="option" aria-selected="${H===D}">${i(X)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${i(L)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(H=>`<span class="dt-dow">${i(H)}</span>`).join("")}</div>
          <div class="dt-days">${te.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${i(t)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${J}
      </div>
    </div>`}function Un(){s.querySelectorAll(".dt-field.is-open").forEach(t=>{const e=t.querySelector(".dt-trigger"),a=t.querySelector(".dt-popover");if(!e||!a)return;const l=e.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const p=a.offsetWidth||320,n=a.offsetHeight||300;let r=l.bottom+6;r+n>window.innerHeight-o&&(r=Math.max(o,l.top-n-6));let u=l.left;u+p>window.innerWidth-o&&(u=Math.max(o,window.innerWidth-p-o)),u<o&&(u=o),a.style.top=`${Math.round(r)}px`,a.style.left=`${Math.round(u)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function Ga(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Pn(t){return t.endMode==="until"||t.endMode==="count"||t.endMode==="never"?t.endMode:t.until?"until":t.count?"count":"never"}function Fn(){if(!ft||!k)return"";const t=k,e=t.repeat??Ga(),a=(e.freq||"").toUpperCase(),l=re.filter(T=>T.canShare||T.access==="readwrite"),o=re.filter(T=>T.id===t.instanceId?!0:T.readOnly?!1:T.canShare||T.access==="readwrite").map(T=>`<option value="${T.id}" ${T.id===t.instanceId?"selected":""}>${i(T.displayname)}</option>`).join(""),p=t.readOnly||!t.canWrite;let n,r;if(t.allDay)n=ta(t.start),r=ta(t.end);else{const T=t.start||"",D=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(T)){const L=vs(T,D||null);n=L.start,r=L.end||""}else n=ha(t.start),r=ha(t.end)}const u=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((e.byDay||[]).map(T=>T.toUpperCase())),y=Pn(e),v=!!a&&y==="until",$=e.until||(y==="until"?ta(t.start)||he(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${nt?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Pt()}
          ${!nt&&(t.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
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
              ${aa({field:"start",name:"start",label:"Start",value:n,dateOnly:t.allDay,required:!0,disabled:p,allowClear:!1})}
              ${aa({field:"end",name:"end",label:"End",value:r,dateOnly:t.allDay,disabled:p||v,allowClear:!v})}
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
                      ${y==="until"?aa({field:"until",name:"repeatUntil",label:"Until",value:$,dateOnly:!0,disabled:p,allowClear:!0}):y==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${i(String(e.count||10))}" />
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
    </div>`}function Mn(t,e){const a=re.find(l=>l.id===e);return{uri:"",instanceId:e,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:Ga(),readOnly:!1,canWrite:!0}}async function Lt(t){yt=(await A.contacts(t,Gt)).contacts,ce!==null&&!yt.some(a=>a.uri===ce)&&(ce=null,be||(I=null,Ee=null,Je=null,Qe=!1))}async function Ot(){const t=await A.tasks({q:Ya,sort:It,order:wt});Ne=t.tasks,Tt=t.calendars;const e=new Set(Ne.map(a=>me(a.instanceId,a.uri)));ye=ye.filter(a=>e.has(a)),Pe!==null&&!Ne.some(a=>`${a.instanceId}|${a.uri}`===Pe)&&(Pe=null,Q||(z=null))}async function ga(){const t=await A.notes({q:Ka,sort:fa,order:ea});pa=t.notes,_t=t.calendars,rt!==null&&!pa.some(e=>`${e.instanceId}|${e.uri}`===rt)&&(rt=null,ke||(le=null))}function me(t,e){return`${t}|${e}`}function Bs(t){if(!t)return"—";try{const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}function ha(t){if(!t)return"";try{const e=new Date(t);if(Number.isNaN(e.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${e.getFullYear()}-${a(e.getMonth()+1)}-${a(e.getDate())}T${a(e.getHours())}:${a(e.getMinutes())}`}catch{return""}}function Ut(t,e,a,l,o,p=""){const n=a===e,r=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${o}" data-sort="${i(e)}" role="columnheader" tabindex="0">${i(t)}${r}</th>`}async function Rn(t){if(M===null)return;const e=await A.getContact(M,t);ce=t,be=!1;const a=e.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??js(),birthday:a.birthday??null},Ee=a.photoDataUri??(a.hasPhoto&&M!==null?`${A.contactPhotoUrl(M,t)}?t=${Date.now()}`:null),Je=null,Qe=!1,Ce=!0}function Vn(){be=!0,ce=null,Ce=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Ee=null,Je=null,Qe=!1}function js(){return{street:"",city:"",region:"",postal:"",country:""}}function Bn(t){return new Promise((e,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),p=o.indexOf(",");e(p>=0?o.slice(p+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(t)})}function zs(t,e={}){const a=!!c&&h==="admin"&&we()&&xt(),p=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${i(a?"Administration Portal":"User Portal")}</span></span>`,n=c?i(c.displayname||c.username):"",r=xt()?`<button type="button" class="user-menu-item${h==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
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
        </nav>`,$=!(fe||Re||Ve!==null||Ke!==null||ft||Ce||Ge)?Pt():"",T=e.tabs&&e.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${e.tabs}
        </div>
      </div>`:"",D=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${i(Qt)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(Qr)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return e.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${y}
      ${T}
    </div>
      <main class="container">
        ${$}
        ${t}
      </main>
      ${D}
      ${al()}
      ${jn()}`}function Pt(){return g?ra(g.type,g.message,{dismissible:!0}):""}function Hs(t){return!Number.isFinite(t)||t<0?"":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:`${(t/(1024*1024)).toFixed(1)} MB`}function ya(t){const e=Math.max(0,Math.floor(t)),a=Math.floor(e/60),l=e%60;return a>0?`${a}m ${l}s`:`${l}s`}function gt(){Ba!==null&&(clearInterval(Ba),Ba=null)}function Ws(){gt(),Ba=setInterval(()=>{if(!j||j.phase==="done"||j.phase==="error"){gt();return}j={...j,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},j.phase==="processing"&&Ks(j)},1e3)}function Ft(t,e={}){j&&(j={...j,phase:t,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3),...e},m())}function Js(){gt(),j=null,m()}function Ys(t){!j||j.phase==="done"||j.phase==="error"||(j={...j,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-j.startedAt)/1e3)},Ks(j))}function Ks(t){const e=s.querySelector("[data-import-status-line]"),a=s.querySelector(".import-progress-bar"),l=s.querySelector(".import-progress-track"),o=s.querySelector("[data-import-counts]"),p=t.kind==="calendar"?"items":"contacts";let n;if(t.phase==="processing"&&t.processTotal>0)n=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${p} (${t.processPercent??0}%) · ${ya(t.elapsedSec)}`;else if(t.phase==="processing")n=`Importing on server… ${ya(t.elapsedSec)}`;else return;e&&(e.textContent=n),o&&(o.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),a&&t.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),l&&t.processPercent!==null&&(l.setAttribute("aria-valuenow",String(t.processPercent)),l.removeAttribute("aria-valuetext"))}function jn(){if(!j)return"";const t=j,e=t.phase!=="done"&&t.phase!=="error",a=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",o=(()=>{const r=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return r.map((y,v)=>{let $="pending";return t.phase==="done"||v<f?$="done":v===f&&($=(t.phase==="error","active")),`<li class="import-step import-step-${$}"><span class="import-step-icon" aria-hidden="true">${$==="done"?"✓":$==="active"?"●":"○"}</span> ${i(y.label)}</li>`}).join("")})();let p="";if(e){let r=null;t.phase==="reading"&&t.readPercent!==null?r=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(r=Math.min(100,Math.max(0,t.processPercent)));const u=r===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=r!==null?` style="width:${r}%"`:"",y=t.kind==="calendar"?"items":"contacts";let v;t.phase==="reading"?v=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?v="Uploading to server…":t.processTotal>0?v=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${y} (${t.processPercent??0}%) · ${ya(t.elapsedSec)}`:v=`Importing on server… ${ya(t.elapsedSec)}`;const $=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';p=`
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
        ${$}
        <p class="muted small">Keep this tab open until the import finishes.
          ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else t.phase==="done"?p=`
        ${ra("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(t.fileName)}</span>
          · Took ${i(ya(t.elapsedSec))}
        </p>`:p=`
        ${ra("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(t.fileName)}</span>
          · After ${i(ya(t.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=e?'<p class="muted small" style="margin:0">Please wait…</p>':un([{label:"Close",action:"close-import-progress",variant:"primary"}]);return De({title:l,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:e,lockBackdrop:e,body:p,footer:n})}function Gs(t,e){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=p=>{p.lengthComputable&&p.total>0?e(Math.min(100,Math.round(p.loaded/p.total*100))):e(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(t)})}function Qs(){const t=We,e=t&&(t.step==="upgrade"||t.step==="initialize"||t.step==="permissions"||t.step==="database"),a=(t==null?void 0:t.installUrl)||"/portal/install/";let l="";if(e&&t){const p=t.step==="upgrade"?"Server upgrade required":"Setup incomplete",n=t.step==="upgrade"&&(t.configuredVersion||t.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${i(String(t.configuredVersion||"—"))}</span>
              → product <span class="mono">${i(String(t.productVersion||"—"))}</span></p>`:"";l=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${i(p)}.</strong>
            ${i(t.message||"Complete the installer before signing in.")}
            ${n}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${i(a)}">Open installer</a>
        </p>`}const o=d||!!e;s.innerHTML=zs(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function zn(){if(!c){Qs();return}const t=re.filter(S=>S.canShare),e=re.filter(S=>!S.canShare),a=re.find(S=>S.id===F)??null,l=t.map(S=>{const oe=K.includes(S.id),tt=oe?" is-selected":"",Oa=S.id===F?" is-primary":"",Ss=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ds=As(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${i(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${tt}${Oa}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${oe?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ss}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${Ds}</span>
            <span class="muted small mono cal-row-uri">${i(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=e.map(S=>{const oe=K.includes(S.id),tt=oe?" is-selected":"",Oa=S.id===F?" is-primary":"",Ss=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ds=S.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${tt}${Oa}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${i(Ds)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${oe?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ss}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${As(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),p=Jt.map(S=>`<option value="${i(S.username)}">${i(S.displayname)} (${i(S.username)})</option>`).join(""),n=Yt.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':Yt.map(S=>`<tr>
                <td>
                  <strong>${i(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${i(S.username||S.href)}</div>
                </td>
                <td>${As(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(S.href)}" ${d?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),r=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",u=!!(a&&a.readOnly),f=fe&&a&&a.canShare?De({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Pt()}
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
                      <select name="username" required ${Jt.length===0?"disabled":""}>
                        <option value="">${Jt.length?"Select user…":"No other users"}</option>
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
                      <button type="submit" class="btn btn-primary" ${d||Jt.length===0?"disabled":""}>Share</button>
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
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",y=Ve!==null?re.find(S=>S.id===Ve&&S.canShare)??null:null,v=y?De({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Pt()}
              <p>You are about to permanently delete <strong>${i(y.displayname)}</strong>
                <span class="muted small mono">(${i(y.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${as({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${y.id}"`}]}):"",$=Re?De({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Pt()}
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
                    ${Ra.map(S=>`<option value="${i(S.code)}">${i(S.name)} (${i(S.code)})</option>`).join("")}
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
              Check calendars to show events on the right. Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${e.length?`<div class="calendars-shared-block">
                       ${ve("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${d?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${_n()}
      </div>
      ${$}
      ${f}
      ${v}
      ${Fn()}`,D=Ue.map(S=>`<div class="cal-row${S.id===M?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="muted small">${S.cardCount} contact${S.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),L=Ue.find(S=>S.id===M)??null,te=yt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Gt?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:yt.map(S=>{const oe=!be&&S.uri===ce?" is-selected":"",tt=i((S.displayname||"?").slice(0,1).toUpperCase()),Oa=S.hasPhoto&&M!==null?`<img class="contact-avatar" src="${i(A.contactPhotoUrl(M,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${tt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${tt}</span>`;return`<tr class="contact-table-row${oe}" data-action="select-contact" data-uri="${i(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Oa}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${i(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(S.org||"—")}</span></td>
              </tr>`}).join(""),x=I,J=Array.isArray(x==null?void 0:x.emails)&&x.emails.length>0?x.emails:[""],H=Array.isArray(x==null?void 0:x.phones)&&x.phones.length>0?x.phones:[{type:"cell",value:""}],X=(x==null?void 0:x.address)??js(),pe=J.map((S,oe)=>`<div class="multi-row" data-multi="email" data-idx="${oe}">
          <input type="email" name="email_${oe}" value="${i(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${oe}" ${J.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Ae=H.map((S,oe)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${oe}">
          <select name="phone_type_${oe}" aria-label="Phone type">
            ${["cell","work","home","other"].map(tt=>`<option value="${tt}" ${((S==null?void 0:S.type)??"other")===tt?"selected":""}>${tt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${oe}" value="${i((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${oe}" ${H.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Te=Array.isArray(x==null?void 0:x.custom)?x.custom:[],ht=Te.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':Te.map((S,oe)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${oe}">
                <input type="text" name="custom_label_${oe}" value="${i(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${oe}" value="${i(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${oe}" title="Remove">×</button>
              </div>`).join(""),ot=Ce&&x&&L?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${be?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Pt()}
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
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${J.length>=10?"disabled":""}>+ Email</button>
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
                  ${aa({field:"birthday",name:"birthday",label:"Birthday",value:x.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${ht}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${Te.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${i(x.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${d?"disabled":""}>${be?"Create contact":"Save contact"}</button>
                    ${!be&&x.uri?`<button type="button" class="btn" data-action="export-contact" ${d?"disabled":""}>Export .vcf</button>`:""}
                    ${be?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${d?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${d?"disabled":""}>Cancel</button>
                    ${!be&&x.uri?`<span class="muted small mono">${i(x.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",kt=Ge&&L?De({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Pt()}
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
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",je=Ke!==null?Ue.find(S=>S.id===Ke)??null:null,Mt=je?De({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Pt()}
              <p>You are about to permanently delete <strong>${i(je.displayname)}</strong>
                <span class="muted small mono">(${i(je.uri)})</span>.</p>
              <p class="muted small">${(je.cardCount??0)>0?`All ${je.cardCount} contact${je.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${as({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${je.id}"`}]}):"",C=`
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
                        value="${i(Gt)}" aria-label="Search contacts" ${d?"disabled":""} />
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
                        ${te}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Mt}
      ${kt}
      ${ot}`,ae=h==="calendars"?"my-calendars":h==="contacts"?"my-contacts":h==="tasks"?"tasks":h==="notes"?"notes":h==="files"?"files":"administration",Y=cr(),Me=ur(),_e=Jn(),ze=lr(),$a=h==="calendars"?T:h==="contacts"?C:h==="tasks"?Y:h==="notes"?Me:h==="files"?_e:ze,es=h==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${Yn()}
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
            data-info="${ae}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;s.innerHTML=zs($a,{tabs:es}),document.body.classList.toggle("cal-modal-open",fe||Re||Ve!==null||Ke!==null||ft||Ce||Ge||j!==null||Se!==null||ge!==null||de!==null||bt||He||Le||mt!==null||oa||ia||Ye!==null||st!==null||$e!==null),document.body.classList.toggle("layout-contacts",h==="contacts"),document.body.classList.toggle("layout-calendars",h==="calendars"),document.body.classList.toggle("layout-tasks",h==="tasks"||h==="notes"),document.body.classList.toggle("layout-files",h==="files"),document.body.classList.toggle("layout-admin",h==="admin")}function Hn(t){const e=t?t.split("/").filter(Boolean):[];let a="";const l=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${d?"disabled":""}>Home</button>`];for(const o of e){a=a?`${a}/${o}`:o;const p=a;l.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),l.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${i(p)}" ${d?"disabled":""}>${i(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${l.join("")}</nav>`}function va(t){return!Number.isFinite(t)||t<0?"—":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:t<1024*1024*1024?`${(t/(1024*1024)).toFixed(1)} MB`:`${(t/(1024*1024*1024)).toFixed(2)} GB`}function Wn(t){if(!t)return"—";try{return new Date(t*1e3).toLocaleString()}catch{return"—"}}function Jn(){const t=hs;if(!t)return`<div class="card"><p class="muted">${ba||d?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ve("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${ve("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${i(t.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${i(t.davPath)}</span></p>
        </section>
      </div>`;const e=t.quotaBytes>0?`${va(t.usedBytes)} used · ${va(t.availableBytes)} free of ${va(t.quotaBytes)}`:`${va(t.usedBytes)} used · ${va(t.availableBytes)} free (no app quota)`,a=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,l=ue.length,o=xe.length>0&&xe.every($=>ue.includes($.path)),p=l>0,n=l>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${l} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${d?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${d?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${d?"disabled":""}>Delete</button>
            </div>
          </div>`:"",r=xe.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':xe.map($=>{const T=ue.includes($.path),D=$.type==="dir"?"📁":"📄",L=$.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${i($.path)}" ${d?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${D}</span>${i($.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${D}</span>${i($.name)}</span>`,te=$.type==="dir"?"—":va($.size);return`<tr class="files-row${T?" is-checked":""}" data-path="${i($.path)}" data-type="${$.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${i($.path)}"
                    ${T?"checked":""} ${d?"disabled":""}
                    aria-label="Select ${i($.name)}" />
                </td>
                <td class="files-col-name">${L}</td>
                <td class="files-col-size mono">${te}</td>
                <td class="files-col-mtime hide-sm">${i(Wn($.mtime))}</td>
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
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:d}]})})():"",f=ge!==null&&ge.length>0?(()=>{const $=ge,T=$.length>1,D=xe.find(x=>x.path===$[0]),L=T?`Delete ${$.length} items`:`Delete ${(D==null?void 0:D.type)==="dir"?"folder":"file"}`,te=T?`<p style="margin:0 0 0.75rem">Delete <strong>${$.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${$.slice(0,12).map(x=>{const J=xe.find(H=>H.path===x);return`<li><span class="mono">${i((J==null?void 0:J.name)??x)}</span></li>`}).join("")}
                   ${$.length>12?`<li>…and ${$.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${i((D==null?void 0:D.name)??$[0])}</strong>?${(D==null?void 0:D.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return De({id:"files-delete-modal",title:L,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:te,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:d}]})})():"",y=de!==null&&de.paths.length>0?(()=>{const $=de.op,T=de.paths,D=T.length>1,L=xe.find(H=>H.path===T[0]),te=(L==null?void 0:L.name)??Qa(T[0]),x=D?`${$==="copy"?"Copy":"Move"} ${T.length} items`:`${$==="copy"?"Copy":"Move"} ${(L==null?void 0:L.type)==="dir"?"folder":"file"}`,J=Fe;return De({id:"files-transfer-modal",title:x,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"sm",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${D?`<p class="muted small" style="margin:0 0 0.75rem">${T.length} items will be ${$==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${i(te)}</span></p>`}
                    <label>Destination folder
                      <input type="text" name="toPath" value="${i(J)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${D?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${i(te)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${$==="copy"?"Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination).":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:$==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:d}]})})():"",v=bt?De({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${i(Fe===""?"Home":Fe)}</span>
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
            <span>${i(e)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${Hn(Fe)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${d||ba?"disabled":""}>Refresh</button>
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
              ${ba&&xe.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':r}
            </tbody>
          </table>
        </div>
      </section>
      ${u}
      ${f}
      ${y}
      ${v}
    </div>`}function Qa(t){const e=t.replace(/\\/g,"/").split("/").filter(Boolean);return e[e.length-1]||t}function Yn(){const t=["overview","settings","users","database"],e={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=W==null?void 0:W.pages,l=new Map;if(a)for(const o of a)is(o.id)&&l.set(o.id,o);return t.map(o=>{const p=l.get(o),n=(p==null?void 0:p.label)||e[o],r=(p==null?void 0:p.status)??(o==="overview"?"read-only":"full"),u=(p==null?void 0:p.available)===!1;return`<button type="button" role="tab" class="tab-btn${w===o?" is-active":""}${u?" is-gated":""}"
            data-action="admin-page" data-admin-page="${o}"
            aria-selected="${w===o}"
            title="${i(n)}${u?" — "+ma(r):""}">
            ${i(n)}
          </button>`}).join("")}function Xa(t){const e=Be(t),a=(e==null?void 0:e.status)??"coming-soon",l=(e==null?void 0:e.label)??t,o=(e==null?void 0:e.summary)||"This area is not available in portal Administration yet.",p=ma(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${Ea(a)}">${i(p)}</span>
        <h2 class="admin-coming-soon-title">${i(l)}</h2>
      </div>
      <p class="muted">${i(o)}</p>
    </section>`}function sa(t,e){return`<span class="badge ${t?"badge-ok":"badge-off"}">${i(e)}: ${t?"On":"Off"}</span>`}function na(t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}function Ia(t,e,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${i(String(e))}</div>
      <div class="admin-stat-label">${i(t)}</div>
      ${a?`<div class="admin-stat-hint muted small">${i(a)}</div>`:""}
    </div>`}function Kn(){const t=Be("overview");if(t&&t.available===!1)return Xa("overview");const e=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${i((c==null?void 0:c.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",l="";if(U&&!q)l='<section class="card"><p class="muted">Loading overview…</p></section>';else if(R&&!q)l=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${i(R)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d?"disabled":""}>Retry</button>
      </section>`;else if(q){const o=q,p=o.services,n=o.links??{},r=t?`<span class="badge ${Ea(t.status)}">${i(ma(t.status))}</span>`:"",u=o.version?i(o.version):"—",f=o.git?i(o.git):"";a=`
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
                    <tr><td>Administration</td><td>${na(p.administration!==!1&&p.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${na(!!p.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${na(!!p.carddav)}</td></tr>
                    <tr><td>Files</td><td>${na(!!p.files)}</td></tr>
                    <tr><td>Tasks</td><td>${na(!!p.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${na(!!p.notes)}</td></tr>
                    <tr><td>Push</td><td>${na(!!p.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${e}
        </section>`;const y=o.nbusers??o.users,v=o.nbcalendars??o.calendars,$=o.nbevents??o.events,T=o.nbbooks??o.addressBooks,D=o.nbcontacts??o.contacts;l=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${Ia("Registered users",y,"Users")}
            ${Ia("Calendars",v,"CalDAV")}
            ${Ia("Events",$,"CalDAV")}
            ${Ia("Address books",T,"CardDAV")}
            ${Ia("Contacts",D,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${sa(p.administration!==!1&&p.webAdmin!==!1,"Administration")}
            ${sa(!!p.caldav,"CalDAV")}
            ${sa(!!p.carddav,"CardDAV")}
            ${sa(!!p.files,"Files")}
            ${sa(!!p.tasks,"Tasks")}
            ${sa(!!p.notes,"Notes")}
            ${sa(!!p.push,"Push")}
          </div>
        </section>`}else l=`<section class="card">
        ${ve("System snapshot","admin-overview")}
        ${e}
      </section>`;return`${a}
      ${l}`}function Gn(){const t=ut.trim().toLowerCase();return t?ie.filter(e=>e.username.toLowerCase().includes(t)||(e.displayname||"").toLowerCase().includes(t)||(e.email||"").toLowerCase().includes(t)):ie}function Qn(){return He?De({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:d},{label:"Create user",type:"submit",variant:"primary",disabled:d}]}):""}function Xn(){if(!Le||!V)return"";const t=V;return De({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
          <p class="muted small">Username <span class="mono">${i(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${i(t.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${i(t.displayname)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${i(t.email)}" autocomplete="off" ${d?"disabled":""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${d?"disabled":""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${d?"disabled":""} />
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:d},{label:"Save changes",type:"submit",variant:"primary",disabled:d}]})}function Zn(){if(!mt)return"";const t=mt,e=V&&V.username.toLowerCase()===t.toLowerCase()?V:ie.find(l=>l.username.toLowerCase()===t.toLowerCase())??null,a=e?`${e.displayname||e.username} (${e.username})`:t;return De({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${i(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${as({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:Dt,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:d},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:d||!Dt,attrs:`data-username="${i(t)}"`}]})}function er(){if(!B)return"";if(G&&!V)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${i(B)}</span>…</p>
      </section>`;if(qe&&!V)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${i(qe)}</p>
      </section>`;if(!V)return"";const t=V,e=ka&&Ct.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':Ct.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':Ct.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.eventCount))}${u.todos?' <span class="badge badge-admin">tasks</span>':""}${u.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${i(u.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${u.instanceId}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${u.instanceId}" data-label="${i(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=ka&&At.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':At.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':At.map(u=>`<tr>
          <td class="mono">${i(u.uri)}</td>
          <td>${i(u.displayname)}</td>
          <td class="hide-sm">${i(String(u.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${u.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${u.id}" data-label="${i(u.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),l=Bt!==null?Ct.find(u=>u.instanceId===Bt)??null:null,o=jt!==null?At.find(u=>u.id===jt)??null:null,p=Ye==="create"||Ye==="edit"&&l?De({title:Ye==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${l?l.instanceId:""}" />
            ${Ye==="create"?`<label>URI token id
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
            <label class="check-row"><input type="checkbox" name="todos" ${l!=null&&l.todos||Ye==="create"?"checked":""} ${d?"disabled":""} /> Tasks (VTODO)</label>
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
          <p>Delete <strong>${i($e.label)}</strong> for <span class="mono">${i(t.username)}</span>?</p>
          ${$e.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${$e.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:d}]}):"";return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${i(t.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${i(t.username)}" ${d?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${i(t.username)}" ${d?"disabled":""}>Delete</button>
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
          <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${d?"disabled":""}>Add calendar</button>
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
    ${p}${n}${r}`}function tr(){const t=Be("users");if(t&&t.available===!1)return Xa("users");const e=Gn(),a=ne&&ie.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':e.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${ee?i(ee):ut.trim()?"No users match this filter.":"No users found."}</td></tr>`:e.map(l=>`<tr class="contact-table-row${B&&B.toLowerCase()===l.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${i(l.username)}" tabindex="0" role="button">
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
            ${t?`<span class="badge ${Ea(t.status)}">${i(ma(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${d||ne?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${d?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${i(ut)}" aria-label="Filter users" ${d?"disabled":""} />
          <span class="muted small">${i(String(e.length))}${ut.trim()?` / ${ie.length}`:""} user${e.length===1?"":"s"}</span>
        </div>
        ${ee&&ie.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${i(ee)}</p>`:""}
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
      ${er()}
      ${Qn()}
      ${Xn()}
      ${Zn()}`}function ar(){const t=Be("settings");if(t&&t.available===!1)return Xa("settings");if(Fa&&!zt)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(Sa&&!zt)return`<section class="card">
        <p class="flash flash-error">${i(Sa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const e=zt;if(!e)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(o,p,n)=>`<label class="check-row"><input type="checkbox" name="${i(o)}" ${p?"checked":""} ${d||e.writable===!1?"disabled":""} /> ${i(n)}</label>`,l=(o,p,n,r="")=>`<label>${i(n)}
        <input type="number" name="${i(o)}" value="${i(String(p??0))}" ${d||e.writable===!1?"disabled":""} />
        ${r?`<span class="muted small">${i(r)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${ve("System settings","admin-settings")}
          <div class="section-actions">
            ${t?`<span class="badge ${Ea(t.status)}">${i(ma(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${d?"disabled":""}>Reload</button>
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
            <select name="dav_auth_type" ${d||e.writable===!1?"disabled":""}>
              ${["Digest","Basic","Apache"].map(o=>`<option value="${o}" ${e.dav_auth_type===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${d||e.writable===!1?"disabled":""}>
              ${cn(e.timezone||"UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${i(e.invite_from||"")}" placeholder="noreply@example.com" ${d||e.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${a("files_enabled",!!e.files_enabled,"Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${i(e.files_storage_path||"")}" placeholder="empty = Specific/files" ${d||e.writable===!1?"disabled":""} />
          </label>
          ${l("files_max_upload_mb",e.files_max_upload_mb,"Max file size (MB)")}
          ${l("files_quota_mb",e.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${l("files_quarantine_days",e.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${l("session_max_age_minutes",e.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${d||e.writable===!1?"disabled":""}>
              ${["off","error","warn","info","debug"].map(o=>`<option value="${o}" ${(e.portal_log_level||"off")===o?"selected":""}>${o}</option>`).join("")}
            </select>
          </label>
          ${a("portal_admin_ui_enabled",e.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${i(Array.isArray(e.portal_admin_users)?e.portal_admin_users.join(", "):String(e.portal_admin_users||""))}" placeholder="empty = DAV user admin" ${d||e.writable===!1?"disabled":""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${a("push_enabled",!!e.push_enabled,"Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${i(e.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${d||e.writable===!1?"disabled":""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${d||e.writable===!1?"disabled":""}>
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
            <input type="password" name="admin_password" autocomplete="new-password" ${d||e.writable===!1?"disabled":""} />
          </label>
          <label>Confirm server admin password
            <input type="password" name="admin_password_confirm" autocomplete="new-password" ${d||e.writable===!1?"disabled":""} />
          </label>

          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${d||e.writable===!1?"disabled":""}>Save settings</button>
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
          <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${d||e.writable===!1?"disabled":""}>
            Reset to Default
          </button>
        </div>
      </section>
      ${sr()}`}function sr(){return oa?De({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${as({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:Et,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:d},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:d||!Et}]}):""}function nr(){const t=Be("database");if(t&&t.available===!1)return Xa("database");if(Ma&&!Ht)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(Da&&!Ht)return`<section class="card">
        <p class="flash flash-error">${i(Da)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const e=Ht;if(!e)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=Wt,l=e.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${ve("Database","admin-database")}
          <div class="section-actions">
            ${t?`<span class="badge ${Ea(t.status)}">${i(ma(t.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${d?"disabled":""}>Refresh</button>
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
            <select name="backend" data-action="admin-db-backend" ${d||l?"disabled":""}>
              <option value="sqlite" ${a==="sqlite"?"selected":""}>SQLite</option>
              <option value="pgsql" ${a==="pgsql"?"selected":""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${a==="sqlite"?"":"display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${i(e.sqlite_file||"")}" ${d||l?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${i(e.pgsql_host||"")}" placeholder="localhost:5432" ${d||l?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${i(e.pgsql_dbname||"")}" ${d||l?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${i(e.pgsql_username||"")}" autocomplete="off" ${d||l?"disabled":""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${e.hasPassword?"Leave blank to keep current":""}" ${d||l?"disabled":""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${d||l?"disabled":""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${rr()}`}function rr(){if(!ia)return"";const t=pt.trim()==="CONFIRM";return De({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${i(pt)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:d},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:d||!t}]})}function lr(){return we()?xt()?w==="users"?tr():w==="settings"?ar():w==="database"?nr():Kn():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function or(t){const e=new Map;for(const f of t)f.uid&&e.set(f.uid,f);const a=new Map(t.map((f,y)=>[me(f.instanceId,f.uri),y])),l=new Map,o=[];for(const f of t){const y=f.parentUid;if(y&&e.has(y)&&y!==f.uid){const v=l.get(y)??[];v.push(f),l.set(y,v)}else o.push(f)}const p=(f,y)=>(a.get(me(f.instanceId,f.uri))??0)-(a.get(me(y.instanceId,y.uri))??0);o.sort(p);for(const[,f]of l)f.sort(p);const n=[],r=new Set,u=(f,y)=>{const v=f.uid||me(f.instanceId,f.uri);if(!r.has(v)){r.add(v),n.push({task:f,depth:Math.min(y,8)});for(const $ of l.get(f.uid)??[])u($,y+1);r.delete(v)}};for(const f of o)u(f,0);for(const f of t)n.some(y=>y.task===f)||n.push({task:f,depth:0});return n}function ir(t){const e=new Set([t]);if(!t)return e;let a=!0;for(;a;){a=!1;for(const l of Ne)l.parentUid&&e.has(l.parentUid)&&l.uid&&!e.has(l.uid)&&(e.add(l.uid),a=!0)}return e}function dr(t,e){const a=t.instanceId,l=e||!t.uid?new Set:ir(t.uid),o=Ne.filter(r=>r.uid&&r.instanceId===a&&!l.has(r.uid)&&r.uid!==t.uid),p=t.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(r=>`<option value="${i(r.uid)}" ${r.uid===p?"selected":""}>${i(r.summary||r.uid)}</option>`)];if(p&&!o.some(r=>r.uid===p)){const r=Ne.find(u=>u.uid===p);n.push(`<option value="${i(p)}" selected>${i((r==null?void 0:r.summary)||p)} (current)</option>`)}return n.join("")}function Xs(){const t=new Set(ye);return Ne.filter(e=>t.has(me(e.instanceId,e.uri))&&e.canWrite&&!e.readOnly)}function cr(){const t=D=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[D]||D,e=or(Ne),a=Ne.filter(D=>D.canWrite&&!D.readOnly).map(D=>me(D.instanceId,D.uri)),l=a.length>0&&a.every(D=>ye.includes(D)),o=ye.length>0,n=Xs().length,r=Ne.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Ya?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:e.map(({task:D,depth:L})=>{const te=me(D.instanceId,D.uri),x=!Q&&te===Pe?" is-selected":"",J=ye.includes(te),H=D.status==="COMPLETED"?"badge-ok":D.status==="CANCELLED"?"":"badge-admin",X=L>0?` style="--task-depth:${L}"`:"",pe=L>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",Ae=D.canWrite&&!D.readOnly;return`<tr class="contact-table-row task-row${L>0?" is-subtask":""}${x}${J?" is-checked":""}" data-action="select-task" data-instance="${D.instanceId}" data-uri="${i(D.uri)}" tabindex="0" role="button"${X}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${D.instanceId}" data-uri="${i(D.uri)}"
                    ${J?"checked":""} ${Ae?"":"disabled"} aria-label="Select ${i(D.summary||D.uri)}" ${d?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${pe}<span class="contact-name-primary">${i(D.summary||D.uri)}</span></span>
                  ${D.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${H}">${i(t(D.status))}</span></td>
                <td class="col-task-due muted small">${i(Bs(D.due))}</td>
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
                ${aa({field:"bulk-due",name:"bulkDue",label:"Due",value:Va,dateOnly:!1,disabled:d||n===0,allowClear:!0})}
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
          </div>`:"",v=z,$=Tt.map(D=>`<option value="${D.id}" ${v&&v.instanceId===D.id?"selected":""}>${i(D.displayname)}</option>`).join(""),T=v?`<div class="card">
            ${ve(Q?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${Q?`<label>Calendar
                      <select name="instanceId" required ${Tt.length===0?"disabled":""}>
                        <option value="">${Tt.length?"Select calendar…":"No writable calendars"}</option>
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
                  ${dr(v,Q)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${v.readOnly&&!Q?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(D=>`<option value="${D}" ${v.status===D?"selected":""}>${i(t(D))}</option>`).join("")}
                  </select>
                </label>
                ${aa({field:"due",name:"due",label:"Due",value:ha(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!Q),allowClear:!0})}
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
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(Ya)}" aria-label="Search tasks" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${d||Tt.length===0?"disabled":""}>Add task</button>
        </div>
        ${y}
        ${Tt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||d?"disabled":""} />
                </th>
                ${Ut("Title","summary",It,wt,"task","col-task-title")}
                ${Ut("Status","status",It,wt,"task","col-task-status")}
                ${Ut("Due","due",It,wt,"task","col-task-due")}
                ${Ut("Calendar","calendar",It,wt,"task","col-task-cal")}
                ${Ut("%","percent",It,wt,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${r}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function ur(){const t=pa.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${Ka?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:pa.map(o=>{const p=me(o.instanceId,o.uri),n=!ke&&p===rt?" is-selected":"",r=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${i(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(o.summary||o.uri)}</span>
                  ${r?`<span class="muted small contact-name-secondary">${i(r)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(Bs(o.dtstart))}</td>
                <td class="col-note-cal muted small">${i(o.calendarName)}</td>
              </tr>`}).join(""),e=le,a=_t.map(o=>`<option value="${o.id}" ${e&&e.instanceId===o.id?"selected":""}>${i(o.displayname)}</option>`).join(""),l=e?`<div class="card">
            ${ve(ke?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${ke?`<label>Calendar
                      <select name="instanceId" required ${_t.length===0?"disabled":""}>
                        <option value="">${_t.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(e.calendarName)}</strong>${e.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(e.summary)}" ${e.readOnly&&!ke?"readonly":""} />
              </label>
              ${aa({field:"dtstart",name:"dtstart",label:"Date",value:ha(e.dtstart),dateOnly:!1,disabled:!!(e.readOnly&&!ke),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${e.readOnly&&!ke?"readonly":""}>${i(e.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${ke||e.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ke?"Create note":"Save note"}</button>`:""}
                ${!ke&&e.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${d?"disabled":""}>Delete</button>`:ke?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ve("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(Ka)}" aria-label="Search notes" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${d||_t.length===0?"disabled":""}>Add note</button>
        </div>
        ${_t.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Ut("Title","summary",fa,ea,"note","col-note-title")}
                ${Ut("Date","dtstart",fa,ea,"note","col-note-date")}
                ${Ut("Calendar","calendar",fa,ea,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${t}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function mr(){const t=s.querySelector(".contacts-table-wrap"),e=s.querySelector(".contacts-ab-list"),a=s.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(e==null?void 0:e.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function pr(t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const e=s.querySelector(".contacts-table-wrap");e&&(e.scrollTop=t.tableTop)}if(t.abListTop!==null){const e=s.querySelector(".contacts-ab-list");e&&(e.scrollTop=t.abListTop)}if(t.calListTop!==null){const e=s.querySelector(".calendars-owned-list");e&&(e.scrollTop=t.calListTop)}})})}function m(){const t=mr();c?zn():Qs(),fr(),pr(t),requestAnimationFrame(()=>{var e;Un(),(e=s.querySelector(".dt-time.is-selected"))==null||e.scrollIntoView({block:"center"})})}function Zs(t){const e=t.querySelector('input[name="color_picker"]'),a=t.querySelector('input[name="color"]');!e||!a||(e.addEventListener("input",()=>{a.value=e.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(e.value=l.slice(0,7),a.value=l.toUpperCase())}))}function fr(){s.querySelectorAll("[data-action]").forEach(C=>{C.addEventListener("click",ae=>{const Y=ae.target.closest("[data-action]");((Y==null?void 0:Y.dataset.action)==="info"||(Y==null?void 0:Y.dataset.action)==="info-close")&&(ae.preventDefault(),ae.stopPropagation()),xr(ae)})}),Na(),Oe&&fn(),s.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(C=>{C.addEventListener("keydown",ae=>{(ae.key==="Enter"||ae.key===" ")&&(ae.preventDefault(),C.click())})});const t=s.querySelector("#delete-cal-confirm"),e=s.querySelector("#delete-cal-submit");t==null||t.addEventListener("change",()=>{e&&(e.disabled=!t.checked||d)});const a=s.querySelector("#delete-ab-confirm"),l=s.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||d)}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(C=>{C.addEventListener("error",()=>{const ae=C.dataset.avatarFallback||"?",Y=document.createElement("span");Y.className="contact-avatar contact-avatar-fallback",Y.setAttribute("aria-hidden","true"),Y.textContent=ae,C.replaceWith(Y)})}),qs||(document.addEventListener("keydown",C=>{if(C.key==="Escape"){if(j&&(j.phase==="done"||j.phase==="error")){Js();return}if(!j){if(Oe){Oe=!1,Na(),m();return}if(Se!==null||ge!==null||de!==null||bt){Se=null,ge=null,de=null,bt=!1,m();return}en()}}}),qs=!0);const o=s.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",C=>{C.preventDefault(),$r(o)});const p=s.querySelector('[data-form="files-rename"]');p==null||p.addEventListener("submit",C=>{C.preventDefault(),wr(p)});const n=s.querySelector('[data-form="files-transfer"]');n==null||n.addEventListener("submit",C=>{C.preventDefault(),Sr(n)});const r=s.querySelector('[data-form="files-mkdir"]');r==null||r.addEventListener("submit",C=>{C.preventDefault(),kr(r)}),bt&&requestAnimationFrame(()=>{var C;(C=r==null?void 0:r.querySelector('input[name="name"]'))==null||C.focus()}),s.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(C=>{C.addEventListener("change",()=>{Dr(C)})}),s.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(C=>{C.indeterminate=!0});const u=s.querySelector('[data-form="share"]');u==null||u.addEventListener("submit",C=>{C.preventDefault(),Cr(u)});const f=s.querySelector('[data-form="edit-cal"]');f&&(Zs(f),f.addEventListener("submit",C=>{C.preventDefault(),Er(f)}));const y=s.querySelector('[data-form="edit-event"]');y==null||y.addEventListener("submit",C=>{C.preventDefault(),Ar(y)}),s.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(C=>{C.addEventListener("change",()=>{if(!k)return;const ae=s.querySelector('[data-form="edit-event"]');if(!ae)return;const Y=new FormData(ae),Me=ae.querySelector('input[name="allDay"]'),_e=La(Y);_e.endMode==="until"&&!_e.until&&(_e.until=ta(String(Y.get("start")??k.start??""))||he(new Date)),k={...k,summary:String(Y.get("summary")??k.summary),description:String(Y.get("description")??k.description),location:String(Y.get("location")??k.location),instanceId:Number(Y.get("instanceId"))||k.instanceId,allDay:(Me==null?void 0:Me.checked)??k.allDay,start:String(Y.get("start")??k.start??""),end:String(Y.get("end")??k.end??"")||null,repeat:_e,hasRrule:!!String(Y.get("repeatFreq")??"").trim()},_e.freq&&_e.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),m(),_e.endMode==="until"&&requestAnimationFrame(()=>{var $a;const ze=s.querySelector('input[name="repeatUntil"]');ze==null||ze.focus();try{($a=ze==null?void 0:ze.showPicker)==null||$a.call(ze)}catch{}})})});const v=s.querySelector('[data-form="create-cal"]');v&&(Zs(v),v.addEventListener("submit",C=>{C.preventDefault(),Nr(v)}));const $=s.querySelector('[data-form="create-ab"]');$==null||$.addEventListener("submit",C=>{C.preventDefault(),Lr($)});const T=s.querySelector('[data-form="edit-ab"]');T==null||T.addEventListener("submit",C=>{C.preventDefault(),Or(T)});const D=s.querySelector('[data-form="contact"]');D==null||D.addEventListener("submit",C=>{C.preventDefault(),qr(D)});const L=s.querySelector('[data-form="task"]');if(L==null||L.addEventListener("submit",C=>{C.preventDefault(),gr(L)}),L){const C=L.querySelector('select[name="instanceId"]');C==null||C.addEventListener("change",()=>{if(!Q||!z)return;const ae=Number(C.value);if(!Number.isFinite(ae)||ae<=0)return;const Y=new FormData(L),Me=String(Y.get("due")??"").trim();z={...z,instanceId:ae,parentUid:z.parentUid&&Ne.some(_e=>_e.uid===z.parentUid&&_e.instanceId===ae)?z.parentUid:null,summary:String(Y.get("summary")??""),description:String(Y.get("description")??""),status:String(Y.get("status")??"NEEDS-ACTION"),due:Me?new Date(Me).toISOString():null,priority:Number(Y.get("priority")??0),percent:Number(Y.get("percent")??0)},m()})}const te=s.querySelector('[data-form="note"]');te==null||te.addEventListener("submit",C=>{C.preventDefault(),hr(te)});const x=s.querySelector('input[data-action="contact-search"]');x==null||x.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{Gt=x.value,M!==null&&(async()=>{try{await Lt(M),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)});const J=s.querySelector('input[data-action="task-search"]');J==null||J.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{Ya=J.value,(async()=>{try{await Ot(),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)});const H=s.querySelector('input[data-action="admin-users-search"]');H==null||H.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{ut=H.value,m()},150)});const X=s.querySelector('[data-form="admin-user-create"]');X==null||X.addEventListener("submit",C=>{C.preventDefault(),bn(X)});const pe=s.querySelector('[data-form="admin-user-edit"]');pe==null||pe.addEventListener("submit",C=>{C.preventDefault(),$n(pe)});const Ae=s.querySelector('[data-form="admin-cal"]');Ae==null||Ae.addEventListener("submit",C=>{C.preventDefault(),gn(Ae)});const Te=s.querySelector('[data-form="admin-ab"]');Te==null||Te.addEventListener("submit",C=>{C.preventDefault(),hn(Te)});const ht=s.querySelector('[data-form="admin-settings"]');ht==null||ht.addEventListener("submit",C=>{C.preventDefault(),vn(ht)});const ot=s.querySelector('[data-form="admin-database"]');ot==null||ot.addEventListener("submit",C=>{C.preventDefault(),yn(ot)});const kt=s.querySelector('select[data-action="admin-db-backend"]');kt==null||kt.addEventListener("change",()=>{Wt=kt.value==="pgsql"?"pgsql":"sqlite",m()});const je=s.querySelector('input[data-action="admin-db-confirm-input"]');je==null||je.addEventListener("input",()=>{pt=je.value;const C=s.querySelector('[data-action="admin-db-confirm-save"]');C&&(C.disabled=d||pt.trim()!=="CONFIRM")});const Mt=s.querySelector('input[data-action="note-search"]');Mt==null||Mt.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{Ka=Mt.value,(async()=>{try{await ga(),m()}catch(C){b("error",C instanceof Error?C.message:"Search failed"),m()}})()},250)}),Tr(),vr(),yr()}async function br(t){var o,p;const e=Xs();if(e.length===0){b("error","No writable tasks selected"),m();return}const a=e.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(t==="bulk-task-delete"){if(!confirm(`Delete ${e.length} task${e.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;d=!0,E(),m();try{const n=await A.bulkTasks({op:"delete",items:a});ye=[],Pe&&e.some(r=>me(r.instanceId,r.uri)===Pe)&&(Pe=null,z=null,Q=!1),await Ot(),n.failed>0?b("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk delete failed")}finally{d=!1,m()}return}let l={};if(t==="bulk-task-status"){const n=s.querySelector("#bulk-task-status"),r=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!r){b("error","Choose a status to apply"),m();return}l={status:r}}else if(t==="bulk-task-due"){const n=Va.trim();if(!n){b("error","Choose a due date to apply"),m();return}const r=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(r.getTime())){b("error","Invalid due date"),m();return}l={due:r.toISOString()}}else if(t==="bulk-task-clear-due")l={due:null};else if(t==="bulk-task-percent"){const n=s.querySelector("#bulk-task-percent"),r=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(r===""){b("error","Enter a percent complete (0–100)"),m();return}const u=Number(r);if(!Number.isFinite(u)||u<0||u>100){b("error","Percent must be between 0 and 100"),m();return}l={percent:Math.round(u)}}d=!0,E(),m();try{const n=await A.bulkTasks({op:"update",items:a,fields:l});if(await Ot(),z&&!Q){const u=me(z.instanceId,z.uri),f=Ne.find(y=>me(y.instanceId,y.uri)===u);f&&(z={...f})}const r=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";n.failed>0?b("error",`Updated ${r} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):b("success",`Updated ${r} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){b("error",n instanceof Error?n.message:"Bulk update failed")}finally{d=!1,m()}}async function gr(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("status")??"NEEDS-ACTION"),p=String(e.get("due")??"").trim(),n=p?new Date(p).toISOString():null,r=Number(e.get("priority")??0),u=Number(e.get("percent")??0),f=String(e.get("parentUid")??"").trim(),y=f===""?null:f;d=!0,E(),m();try{if(Q){const v=Number(e.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const $=await A.createTask({instanceId:v,summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});Q=!1,Pe=me($.task.instanceId,$.task.uri),z=$.task,b("success",y?"Subtask created":"Task created")}else if(z){const v=await A.updateTask(z.instanceId,z.uri,{summary:a,description:l,status:o,due:n,priority:r,percent:u,parentUid:y});z=v.task,Pe=me(v.task.instanceId,v.task.uri),b("success","Task saved")}await Ot()}catch(v){b("error",v instanceof Error?v.message:"Save failed")}finally{d=!1,m()}}async function hr(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("dtstart")??"").trim(),p=o?new Date(o).toISOString():null;d=!0,E(),m();try{if(ke){const n=Number(e.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const r=await A.createNote({instanceId:n,summary:a,description:l,dtstart:p});ke=!1,rt=me(r.note.instanceId,r.note.uri),le=r.note,b("success","Note created")}else if(le){const n=await A.updateNote(le.instanceId,le.uri,{summary:a,description:l,dtstart:p});le=n.note,rt=me(n.note.instanceId,n.note.uri),b("success","Note saved")}await ga()}catch(n){b("error",n instanceof Error?n.message:"Save failed")}finally{d=!1,m()}}function yr(){const t=s.querySelector('input[data-action="contact-photo"]');t&&t.addEventListener("change",()=>{(async()=>{var a;const e=(a=t.files)==null?void 0:a[0];if(t.value="",!!e){if(e.size>2.5*1024*1024){b("error","Photo is too large (max ~2 MB)"),m();return}try{const l=await Bn(e);Je=l,Ee=`data:${e.type||"image/jpeg"};base64,${l}`,Qe=!1,m()}catch(l){b("error",l instanceof Error?l.message:"Failed to read photo"),m()}}})()})}function vr(){const t=s.querySelector('[data-form="create-cal"]');if(!t)return;const e=t.querySelector('input[name="holidays"]'),a=t.querySelector("#holidays-country-wrap"),l=t.querySelector('input[name="displayname"]'),o=t.querySelector('input[name="readOnly"]');if(!e||!a)return;const p=()=>{const n=e.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};e.addEventListener("change",p),p()}async function $r(t){var o,p,n,r;const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("password")??"");d=!0,E(),m(),N.event("login.attempt",{username:a});try{const u=await A.login(a,l);if(c=u.user,ps(u.ui),N.event("login.ok",{username:(c==null?void 0:c.username)??a}),bs(),we())try{await gs()}catch(f){N.warn("admin.capabilities login",f instanceof Error?f.message:f)}if(Os(),it(h,w),await Ze(),h==="admin"&&we()&&xt())try{w==="overview"&&((o=Be("overview"))==null?void 0:o.available)!==!1?await Ha():w==="users"&&((p=Be("users"))==null?void 0:p.available)!==!1?(await Xt(),B&&(await vt(B),await Zt(B))):w==="settings"&&((n=Be("settings"))==null?void 0:n.available)!==!1?await Wa():w==="database"&&((r=Be("database"))==null?void 0:r.available)!==!1&&await Ja()}catch(f){N.warn("admin login load",f instanceof Error?f.message:f)}b("success","Signed in")}catch(u){N.warn("login.failed",u instanceof Error?u.message:u),b("error",u instanceof Error?u.message:"Login failed")}finally{d=!1,m()}}async function wr(t){const e=new FormData(t),a=String(e.get("path")??""),l=String(e.get("newName")??"").trim();if(!a||!l){b("error","Name is required"),m();return}d=!0,E(),m();try{await A.filesRename(a,l),N.event("files.rename",{path:a,newName:l}),Se=null,await $t(),b("success",`Renamed to “${l}”`)}catch(o){b("error",o instanceof Error?o.message:"Rename failed")}finally{d=!1,m()}}async function kr(t){const e=new FormData(t),a=String(e.get("name")??"").trim();if(!a){b("error","Folder name is required"),m();return}d=!0,E(),m();try{await A.filesMkdir(Fe,a),N.event("files.mkdir",{path:Fe,name:a}),bt=!1,await $t(),b("success",`Created folder “${a}”`)}catch(l){b("error",l instanceof Error?l.message:"Could not create folder")}finally{d=!1,m()}}async function Sr(t){if(!de||de.paths.length===0)return;const e=new FormData(t),a=String(e.get("toPath")??"").trim().replace(/^\/+|\/+$/g,""),l=String(e.get("newName")??"").trim(),o=de.op,p=[...de.paths],n=p.length>1;d=!0,E(),m();let r=0;const u=[];try{for(const y of p)try{if(o==="copy"){const v=Qa(y),$=n||!l||l===v?void 0:l,T=await A.filesCopy(y,{to:a,newName:$});N.event("files.copy",{path:y,to:T.entry.path})}else{const v=Qa(y),$=n||!l||l===v?void 0:l;await A.filesMove(y,a,$),N.event("files.move",{path:y,to:a})}r+=1}catch(v){u.push(`${Qa(y)}: ${v instanceof Error?v.message:"failed"}`)}de=null,ue=[],await $t();const f=o==="copy"?"Copied":"Moved";r>0&&u.length===0?b("success",r===1?`${f} 1 item`:`${f} ${r} items`):r>0?b("info",`${f} ${r}; ${u.length} failed. ${u[0]}`):b("error",u[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){b("error",f instanceof Error?f.message:"Operation failed")}finally{d=!1,m()}}async function Dr(t){const e=t.files;if(!e||e.length===0)return;const a=Array.from(e);t.value="",d=!0,E(),m();let l=0;const o=[];try{for(const p of a)try{await A.filesUpload(Fe,p,{replace:!0}),N.event("files.upload",{path:Fe,name:p.name,size:p.size}),l+=1}catch(n){o.push(`${p.name}: ${n instanceof Error?n.message:"failed"}`)}await $t(),l>0&&o.length===0?b("success",l===1?"Uploaded 1 file":`Uploaded ${l} files`):l>0?b("info",`Uploaded ${l}; ${o.length} failed. ${o[0]}`):b("error",o[0]||"Upload failed")}catch(p){b("error",p instanceof Error?p.message:"Upload failed")}finally{d=!1,m()}}async function Cr(t){if(F===null)return;const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("access")??"read");fe=!0,d=!0,E(),m();try{await A.share(F,a,l),await xa(F),b("success",`Shared with ${a}`)}catch(o){b("error",o instanceof Error?o.message:"Share failed")}finally{d=!1,m()}}function qa(t){if(!k)return;const e=new FormData(t),a=t.querySelector('input[name="allDay"]');k={...k,summary:String(e.get("summary")??k.summary),description:String(e.get("description")??k.description),location:String(e.get("location")??k.location),instanceId:Number(e.get("instanceId"))||k.instanceId,allDay:(a==null?void 0:a.checked)??k.allDay,start:String(e.get("start")??k.start??""),end:String(e.get("end")??k.end??"")||null,repeat:La(e),hasRrule:!!String(e.get("repeatFreq")??"").trim()}}function La(t){const e=String(t.get("repeatFreq")??"").trim().toUpperCase();if(!e)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(t.get("repeatInterval")??1)||1)),l=String(t.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let p=null,n=null;if(o==="until"){const u=String(t.get("repeatUntil")??"").trim();p=u?u.slice(0,10):null}else if(o==="count"){const u=Number(t.get("repeatCount")??0);n=Number.isFinite(u)&&u>0?Math.min(999,Math.round(u)):10}const r=t.getAll("repeatByDay").map(u=>String(u).toUpperCase()).filter(Boolean);return{freq:e,interval:a,until:p,count:n,byDay:r,endMode:o}}async function Ar(t){if(!k||!k.canWrite)return;const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("location")??"").trim(),p=e.get("allDay")==="on",n=String(e.get("start")??"").trim(),r=String(e.get("end")??"").trim(),u=Number(e.get("instanceId"))||k.instanceId,f=La(e);if(!a){b("error","Title is required"),m();return}if(!n){b("error","Start is required"),m();return}let y,v;if(p)y=n.slice(0,10),v=r?r.slice(0,10):y;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const L=vs(n,r||null);y=new Date(L.start).toISOString(),v=L.end?new Date(L.end).toISOString():null}else y=new Date(n).toISOString(),v=r?new Date(r).toISOString():null;const $=k.instanceId,T=k.uri,D=nt;d=!0,E(),ft=!0,m(),N.event(D?"event.create":"event.update",{instanceId:u,uri:D?null:T,allDay:p,summary:a});try{const L={summary:a,description:l,location:o,allDay:p,start:y,end:v,instanceId:u,repeat:f},te=D?await A.createEvent(u,L):await A.updateEvent($,T,L);(F===null||te.event.instanceId!==F)&&(F=te.event.instanceId),await et(),ft=!1,k=null,nt=!1,O=null,N.event(D?"event.created":"event.saved",{uri:te.event.uri,instanceId:te.event.instanceId}),b("success",D?"Event created":"Event saved")}catch(L){N.warn("event.save failed",L instanceof Error?L.message:L),b("error",L instanceof Error?L.message:"Save failed")}finally{d=!1,m()}}async function Er(t){if(F===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim();d=!0,E(),m();try{const p=await A.updateCalendar(F,{displayname:a,description:l,color:o});fe=!0,await Ze(),F=p.calendar.id,await xa(F),await et(),b("success","Calendar updated")}catch(p){b("error",p instanceof Error?p.message:"Update failed")}finally{d=!1,m()}}async function Nr(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim(),p=e.get("holidays")==="on",n=String(e.get("holidayCountry")??"").trim(),r=e.get("readOnly")==="on";if(Re=!0,p&&!n){b("error","Select a country for the holidays calendar"),m();return}if(!p&&!a){b("error","Display name is required"),m();return}d=!0,E(),m();try{const u=await A.createCalendar({displayname:a,description:l,color:o,holidays:p,holidayCountry:p?n:void 0,readOnly:r});F=u.calendar.id,K.includes(u.calendar.id)||(K=[...K,u.calendar.id]),Re=!1,await Ze();let f=`Created “${u.calendar.displayname}”`;const y=u.holidayImport??u.calendar.holidayImport;y&&(f+=`. Holidays imported: ${Es(y)}.`),r&&(f+=" Calendar is read-only."),b("success",f)}catch(u){Re=!0,b("error",u instanceof Error?u.message:"Create failed")}finally{d=!1,m()}}async function xr(t){var l,o,p;const e=t.target.closest("[data-action]");if(!e)return;const a=e.dataset.action;if(a&&N.debug(`action:${a}`,{id:e.dataset.id,tab:e.dataset.tab,uri:e.dataset.uri}),a==="close-import-progress"){j&&(j.phase==="done"||j.phase==="error")&&Js();return}if(a==="logout"){d=!0,N.event("logout");try{await A.logout()}catch{}za(),E(),m();return}if(a==="select-cal"||a==="toggle-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;Nn(n),d=!0,E(),m();try{await et()}catch(r){b("error",r instanceof Error?r.message:"Failed to load calendar")}finally{d=!1,m()}return}if(a==="edit-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!re.find(u=>u.id===n&&u.canShare))return;F=n,K.includes(n)||(K=[...K,n]),fe=!0,Ve=null,d=!0,E(),m();try{await xa(n),await et()}catch(u){b("error",u instanceof Error?u.message:"Failed to open calendar")}finally{d=!1,m()}return}if(a==="close-cal-modal"){fe=!1,m();return}if(a==="open-create-cal-modal"){Re=!0,fe=!1,Ve=null,E(),m();return}if(a==="close-create-cal-modal"){Re=!1,E(),m();return}if(a==="delete-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!re.find(u=>u.id===n&&u.canShare))return;Ve=n,fe=!1,E(),m();return}if(a==="cancel-delete-cal"){Ve=null,m();return}if(a==="confirm-delete-cal"){const n=Number(e.dataset.id),r=s.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;d=!0,E(),m();try{if(await A.deleteCalendar(n),F===n&&(F=null),K=K.filter(u=>u!==n),Ve=null,fe=!1,Yt=[],Kt=[],await Ze(),F===null){const u=Ms();u?(F=u.id,K.includes(u.id)||(K=[...K,u.id]),await et()):K.length>0&&(F=K[0],await et())}b("success","Calendar deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="month-today"){const n=new Date;Nt={y:n.getFullYear(),m:n.getMonth()},Ca=null,d=!0,m();try{await et()}finally{d=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,r=new Date(Nt.y,Nt.m+n,1);Nt={y:r.getFullYear(),m:r.getMonth()},Ca=null,d=!0,m();try{await et()}finally{d=!1,m()}return}if(a==="open-event"){t.stopPropagation();const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;d=!0,E(),m();try{const u=await A.getEvent(n,r);k={...u.event,repeat:u.event.repeat??Ga()},nt=!1,ft=!0,O=null,fe=!1,Ve=null}catch(u){b("error",u instanceof Error?u.message:"Failed to open event")}finally{d=!1,m()}return}if(a==="open-event-day"){t.stopPropagation();const n=e.dataset.day??"";Ca=Ca===n?null:n,m();return}if(a==="new-event-day"){const n=t.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const r=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;if(F===null){b("error","Select a calendar first"),m();return}const u=re.find(f=>f.id===F);if(!u||u.readOnly||!(u.canShare||u.access==="readwrite")){b("error","This calendar is read-only"),m();return}nt=!0,k=Mn(r,F),ft=!0,O=null,fe=!1,Ve=null,E(),m();return}if(a==="close-event-modal"){ft=!1,k=null,nt=!1,O=null,E(),m();return}if(a==="dt-open"){const n=e.dataset.dtField||"";if(!n)return;const r=s.querySelector('[data-form="edit-event"]');if(r&&k&&qa(r),(O==null?void 0:O.field)===n)O=null;else{const u=e.dataset.dtDateOnly==="1",f=e.dataset.dtClear!=="0",y=e.dataset.dtName||n;let v=ks(n);!v&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(v=_a().start);const $=Ta(v||he(new Date)),[T,D]=$.date.split("-").map(Number);O={field:n,viewY:T,viewM:(D||1)-1,dateOnly:u,allowClear:f,name:y}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const n=a==="dt-month-prev"?-1:1,r=new Date(O.viewY,O.viewM+n,1);O={...O,viewY:r.getFullYear(),viewM:r.getMonth()},m();return}if(a==="dt-pick-day"){if(!O)return;const n=O.field,r=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&qa(u);const f=O.dateOnly;if(f)lt(n,r),O=null;else{const y=ks(n),v=Ta(y||_a(r).start).hm;lt(n,`${r}T${v}`),O={...O,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(n==="start"&&k&&!f&&k.end){const y=new Date(String(k.start)),v=new Date(String(k.end));!Number.isNaN(y.getTime())&&!Number.isNaN(v.getTime())&&v<=y&&lt("end",qt(new Date(y.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const n=O.field,r=e.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(r))return;const u=s.querySelector('[data-form="edit-event"]');u&&k&&qa(u);const f=ks(n)||_a().start,v=`${Ta(f).date}T${r}`;if(lt(n,v),n==="start"&&k){k={...k,allDay:!1};const $=k.end?Ta(String(k.end)):null,T=new Date(v);(!$||new Date(`${$.date}T${$.hm}`)<=T)&&lt("end",qt(new Date(T.getTime()+3600*1e3)))}O=null,m();return}if(a==="dt-today"){if(!O)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&k&&qa(r);const u=he(new Date);if(O.dateOnly)lt(n,u);else{const f=_a(u);n==="start"?(lt("start",f.start),k&&!k.end&&lt("end",f.end)):n==="end"?lt("end",f.end):lt(n,f.start)}O=null,m();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const n=O.field,r=s.querySelector('[data-form="edit-event"]');r&&k&&qa(r),lt(n,null),O=null,m();return}if(a==="event-allday-toggle"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]'),r=e.checked;if(n){const u=new FormData(n),f=String(u.get("start")??k.start??""),y=String(u.get("end")??k.end??"")||null;let v=f,$=y;if(r){const T=An(f,y);v=T.start,$=T.end}else{const T=f.slice(0,10),D=(y||f).slice(0,10),L=vs(T,D);v=L.start,$=L.end}k={...k,summary:String(u.get("summary")??k.summary),description:String(u.get("description")??k.description),location:String(u.get("location")??k.location),instanceId:Number(u.get("instanceId"))||k.instanceId,allDay:r,start:v,end:$,repeat:La(u)}}else k={...k,allDay:r};O=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!k)return;const n=s.querySelector('[data-form="edit-event"]');if(!n)return;const r=new FormData(n),u=n.querySelector('input[name="allDay"]'),f=La(r);k={...k,summary:String(r.get("summary")??k.summary),description:String(r.get("description")??k.description),location:String(r.get("location")??k.location),instanceId:Number(r.get("instanceId"))||k.instanceId,allDay:(u==null?void 0:u.checked)??k.allDay,start:String(r.get("start")??k.start??""),end:String(r.get("end")??k.end??"")||null,repeat:f,hasRrule:!!String(r.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),m();return}if(a==="delete-event"){if(!k||!k.canWrite||nt||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=k.instanceId,r=k.uri;d=!0,E(),m();try{await A.deleteEvent(n,r),ft=!1,k=null,await et(),b("success","Event deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="info"){const n=e.dataset.info??"";Ur(n);return}if(a==="info-close"){en();return}if(a==="flash-close"){E(),m();return}if(a==="user-menu-toggle"){t.stopPropagation(),Oe=!Oe,m();return}if(a==="user-menu-close"){Oe&&(Oe=!1,m());return}if(a==="tab"){const n=Ts(e.dataset.tab);n&&(n==="admin"&&(w="overview"),await Ps(n));return}if(a==="admin-page"){const n=is(e.dataset.adminPage);n&&await Us(n);return}if(a==="admin-refresh"){if(!we()||h!=="admin")return;d=!0,E(),m();try{await Ha(),b("success","Overview refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="admin-users-refresh"){if(!we()||h!=="admin")return;d=!0,E(),m();try{await Xt(),B&&await vt(B),b("success","Users refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="admin-user-view"){const n=e.dataset.username??"";if(!n||!we())return;d=!0,E(),B=n,w="users",it("admin","users",n),m();try{await vt(n),await Zt(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{d=!1,m()}return}if(a==="admin-user-close"){B=null,V=null,qe=null,Le=!1,it("admin","users",null),m();return}if(a==="admin-user-create-open"){if(!we())return;He=!0,Le=!1,mt=null,E(),m();return}if(a==="admin-user-create-close"){He=!1,m();return}if(a==="admin-user-edit-open"){if(!we())return;const n=e.dataset.username??B??"";if(!n)return;d=!0,E(),He=!1,mt=null,B=n,w="users",it("admin","users",n),m();try{(!V||V.username.toLowerCase()!==n.toLowerCase())&&await vt(n),Le=!0}catch(r){b("error",r instanceof Error?r.message:"Failed to load user")}finally{d=!1,m()}return}if(a==="admin-user-edit-close"){Le=!1,m();return}if(a==="admin-user-delete-open"){if(!we())return;const n=e.dataset.username??B??"";if(!n)return;mt=n,Dt=!1,He=!1,Le=!1,E(),m();return}if(a==="admin-user-delete-close"){mt=null,Dt=!1,m();return}if(a==="admin-user-delete-toggle"){Dt=!!e.checked,m();return}if(a==="admin-user-delete-confirm"){if(!we())return;const n=e.dataset.username??mt??"";if(!n||!Dt)return;d=!0,E(),m();try{await A.adminDeleteUser(n,!0),N.event("admin.user.delete",{username:n}),mt=null,Dt=!1,Le=!1,(B==null?void 0:B.toLowerCase())===n.toLowerCase()&&(B=null,V=null,Ct=[],At=[],it("admin","users",null)),await Xt(),b("success",`Deleted user “${n}”`)}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{d=!1,m()}return}if(a==="admin-cal-create"){Ye="create",Bt=null,m();return}if(a==="admin-cal-edit"){Ye="edit",Bt=Number(e.dataset.id),m();return}if(a==="admin-cal-close"){Ye=null,Bt=null,m();return}if(a==="admin-cal-delete"){$e={kind:"calendar",id:Number(e.dataset.id),label:e.dataset.label??"calendar"},m();return}if(a==="admin-ab-create"){st="create",jt=null,m();return}if(a==="admin-ab-edit"){st="edit",jt=Number(e.dataset.id),m();return}if(a==="admin-ab-close"){st=null,jt=null,m();return}if(a==="admin-ab-delete"){$e={kind:"addressbook",id:Number(e.dataset.id),label:e.dataset.label??"address book",force:!1},m();return}if(a==="admin-ab-force-toggle"){($e==null?void 0:$e.kind)==="addressbook"&&($e={...$e,force:!!e.checked},m());return}if(a==="admin-resource-delete-close"){$e=null,m();return}if(a==="admin-resource-delete-confirm"){if(!B||!$e)return;const n=B,r=$e;d=!0,E(),m();try{r.kind==="calendar"?await A.adminDeleteUserCalendar(n,r.id,!0):await A.adminDeleteUserAddressBook(n,r.id,!0,!!r.force),$e=null,await Zt(n),await vt(n),b("success","Deleted")}catch(u){b("error",u instanceof Error?u.message:"Delete failed")}finally{d=!1,m()}return}if(a==="admin-settings-refresh"){d=!0,E(),m();try{await Wa(),b("success","Settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,m()}return}if(a==="admin-reset-open"){oa=!0,Et=!1,E(),m();return}if(a==="admin-reset-close"){oa=!1,Et=!1,m();return}if(a==="admin-reset-toggle"){Et=!!e.checked,m();return}if(a==="admin-reset-confirm"){if(!Et)return;d=!0,E(),m();try{const n=await A.adminResetToDefault(!0);N.event("admin.settings.reset-to-default"),oa=!1,Et=!1;const r=n.redirectUrl&&n.redirectUrl.startsWith("/")?n.redirectUrl:"/portal/install/";window.location.assign(r);return}catch(n){b("error",n instanceof Error?n.message:"Reset failed"),d=!1,m()}return}if(a==="admin-database-refresh"){d=!0,E(),m();try{await Ja(),b("success","Database settings reloaded")}catch(n){b("error",n instanceof Error?n.message:"Reload failed")}finally{d=!1,m()}return}if(a==="admin-db-backend"){Wt=e.value==="pgsql"?"pgsql":"sqlite",m();return}if(a==="admin-db-confirm-close"){ia=!1,pt="",da=null,m();return}if(a==="admin-db-confirm-input"){pt=e.value,m();const r=s.querySelector('[data-action="admin-db-confirm-input"]');if(r){r.focus();const u=r.value.length;r.setSelectionRange(u,u)}return}if(a==="admin-db-confirm-save"){if(pt.trim()!=="CONFIRM"||!da)return;d=!0,E(),m();try{const n={...da,confirm:"CONFIRM"},r=await A.adminUpdateDatabaseSettings(n);Ht=r.data,ia=!1,pt="",da=null,Wt=(r.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:r.data.backend}),b("success","Database settings saved")}catch(n){b("error",n instanceof Error?n.message:"Database save failed")}finally{d=!1,m()}return}if(a==="files-nav"){Fe=e.dataset.path??"",Se=null,ge=null,de=null,bt=!1,ue=[],d=!0,E(),m();try{await $t()}catch(r){b("error",r instanceof Error?r.message:"Failed to open folder")}finally{d=!1,m()}return}if(a==="files-toggle"){t.stopPropagation();const n=e.dataset.path??"";if(!n)return;e.checked?ue.includes(n)||(ue=[...ue,n]):ue=ue.filter(u=>u!==n),m();return}if(a==="files-select-all"){t.stopPropagation(),ue=e.checked?xe.map(r=>r.path):[],m();return}if(a==="files-copy"){const n=e.dataset.path??"";if(!n)return;de={op:"copy",paths:[n]},Se=null,ge=null,m();return}if(a==="files-move"){const n=e.dataset.path??"";if(!n)return;de={op:"move",paths:[n]},Se=null,ge=null,m();return}if(a==="files-bulk-copy"){if(ue.length===0)return;de={op:"copy",paths:[...ue]},Se=null,ge=null,m();return}if(a==="files-bulk-move"){if(ue.length===0)return;de={op:"move",paths:[...ue]},Se=null,ge=null,m();return}if(a==="files-transfer-close"){de=null,m();return}if(a==="files-bulk-delete"){if(ue.length===0)return;ge=[...ue],Se=null,de=null,m();return}if(a==="files-refresh"){d=!0,E(),m();try{await $t(),b("success","Refreshed")}catch(n){b("error",n instanceof Error?n.message:"Refresh failed")}finally{d=!1,m()}return}if(a==="files-mkdir"){bt=!0,Se=null,ge=null,de=null,E(),m();return}if(a==="files-mkdir-close"){bt=!1,m();return}if(a==="files-rename-open"){Se=e.dataset.path??null,ge=null,de=null,m();return}if(a==="files-rename-close"){Se=null,m();return}if(a==="files-delete-open"){const n=e.dataset.path??"";ge=n?[n]:null,Se=null,de=null,m();return}if(a==="files-delete-close"){ge=null,m();return}if(a==="files-delete-confirm"){const n=ge?[...ge]:[];if(n.length===0)return;d=!0,E(),m();try{if(n.length===1)await A.filesDelete(n[0]),N.event("files.delete",{path:n[0]}),b("success","Deleted");else{const r=await A.filesBulk("delete",n);N.event("files.bulk-delete",{ok:r.ok,failed:r.failed}),r.failed===0?b("success",r.ok===1?"Deleted 1 item":`Deleted ${r.ok} items`):r.ok>0?b("info",`Deleted ${r.ok}; ${r.failed} failed. ${r.errors[0]||""}`):b("error",r.errors[0]||"Delete failed")}ge=null,ue=[],await $t()}catch(r){b("error",r instanceof Error?r.message:"Delete failed")}finally{d=!1,m()}return}if(a==="files-download"){N.event("files.download",{path:e.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const n=e.dataset.sort||"";if(!n)return;if(a==="sort-task"){It===n?wt=wt==="asc"?"desc":"asc":(It=n,wt=n==="due"||n==="summary"?"asc":"desc"),d=!0,m();try{await Ot()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{d=!1,m()}}else{fa===n?ea=ea==="asc"?"desc":"asc":(fa=n,ea="asc"),d=!0,m();try{await ga()}catch(r){b("error",r instanceof Error?r.message:"Sort failed")}finally{d=!1,m()}}return}if(a==="select-task"){if(t.target.closest("[data-stop-row], .task-check"))return;const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=Ne.find(f=>f.instanceId===n&&f.uri===r)??null;Q=!1,Pe=me(n,r),z=u?{...u}:null,E(),m();return}if(a==="task-check"){t.preventDefault(),t.stopPropagation();const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=me(n,r),f=Ne.find(y=>me(y.instanceId,y.uri)===u);if(!f||!f.canWrite||f.readOnly)return;ye.includes(u)?ye=ye.filter(y=>y!==u):ye=[...ye,u],m();return}if(a==="task-select-all"){t.preventDefault();const n=Ne.filter(u=>u.canWrite&&!u.readOnly);n.length>0&&n.every(u=>ye.includes(me(u.instanceId,u.uri)))?ye=[]:ye=n.map(u=>me(u.instanceId,u.uri)),m();return}if(a==="bulk-task-clear"){ye=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){br(a);return}if(a==="select-note"){const n=Number(e.dataset.instance),r=e.dataset.uri??"";if(!Number.isFinite(n)||!r)return;const u=pa.find(f=>f.instanceId===n&&f.uri===r)??null;ke=!1,rt=me(n,r),le=u?{...u}:null,E(),m();return}if(a==="new-task"){Q=!0,Pe=null,z={uri:"",instanceId:((o=Tt[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="new-subtask"){if(!z||Q||!z.uid||!z.canWrite)return;const n=z;Q=!0,Pe=null,z={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="new-note"){ke=!0,rt=null,le={uri:"",instanceId:((p=_t[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},E(),m();return}if(a==="cancel-task"){Q=!1,z=null,Pe=null,m();return}if(a==="cancel-note"){ke=!1,le=null,rt=null,m();return}if(a==="delete-task"){if(!z||Q||!confirm("Delete this task? CalDAV clients will sync the removal."))return;d=!0,E(),m();try{await A.deleteTask(z.instanceId,z.uri),Pe=null,z=null,await Ot(),b("success","Task deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="delete-note"){if(!le||ke||!confirm("Delete this note? CalDAV clients will sync the removal."))return;d=!0,E(),m();try{await A.deleteNote(le.instanceId,le.uri),rt=null,le=null,await ga(),b("success","Note deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="select-ab"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;M=n,Ge=!1,ce=null,I=null,be=!1,Ce=!1,Gt="",yt=[],Ee=null,Je=null,Qe=!1,E(),d=!0,m();try{await Lt(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contacts")}finally{d=!1,m()}return}if(a==="edit-ab"){t.stopPropagation();const n=Number(e.dataset.id);if(!Number.isFinite(n)||!Ue.find(f=>f.id===n))return;const u=M!==n;M=n,Ge=!0,Ce=!1,E(),u&&(ce=null,I=null,be=!1,Gt="",yt=[],Ee=null,Je=null,Qe=!1),d=!0,m();try{u&&await Lt(n)}catch(f){b("error",f instanceof Error?f.message:"Failed to open address book")}finally{d=!1,m()}return}if(a==="close-ab-modal"){Ge=!1,m();return}if(a==="select-contact"){const n=e.dataset.uri??"";if(!n)return;E();try{await Rn(n)}catch(r){b("error",r instanceof Error?r.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(M===null)return;Vn(),E(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){be=!1,Ce=!1,I=null,ce=null,Ee=null,Je=null,Qe=!1,O=null,E(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;Za(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!I)return;Za();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(I.emails)?I.emails:[""];I.emails=r.filter((u,f)=>f!==n),I.emails.length===0&&(I.emails=[""]),m();return}if(a==="remove-phone"){if(!I)return;Za();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const r=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=r.filter((u,f)=>f!==n),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!I)return;Za();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((r,u)=>u!==n),m();return}if(a==="remove-photo"){Ee=null,Je=null,Qe=!0,I&&(I.hasPhoto=!1),m();return}if(a==="delete-contact"){if(M===null||!ce||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;d=!0,E(),Ce=!0,m();try{await A.deleteContact(M,ce),ce=null,I=null,be=!1,Ce=!1,O=null,Ee=null,await Ze(),b("success","Contact deleted")}catch(n){b("error",n instanceof Error?n.message:"Delete failed")}finally{d=!1,m()}return}if(a==="delete-ab"){t.stopPropagation();const n=Number(e.dataset.id??M);if(!Number.isFinite(n)||!Ue.find(u=>u.id===n))return;Ke=n,Ge=!1,Ce=!1,E(),m();return}if(a==="cancel-delete-ab"){Ke=null,m();return}if(a==="confirm-delete-ab"){const n=Number(e.dataset.id),r=s.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(r!=null&&r.checked))return;const u=Ue.find(y=>y.id===n);if(!u)return;const f=(u.cardCount??0)>0;d=!0,E(),m();try{await A.deleteAddressBook(n,f),M===n&&(M=null,yt=[],I=null,ce=null,be=!1),Ke=null,Ge=!1,Ce=!1,await Ze(),M===null&&Ue.length>0&&(M=Ue[0].id,await Lt(M)),b("success","Address book deleted")}catch(y){b("error",y instanceof Error?y.message:"Delete failed")}finally{d=!1,m()}return}if(a==="export-ab"){if(M===null)return;Ge=!0,d=!0,E(),m();try{const{blob:n,filename:r}=await A.exportAddressBook(M),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{d=!1,m()}return}if(a==="export-contact"){if(M===null||!ce||be)return;Ce=!0,d=!0,E(),m();try{const{blob:n,filename:r}=await A.exportContact(M,ce),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{d=!1,m()}return}if(a==="revoke"){const n=e.dataset.href??"";if(!n||F===null||!confirm("Revoke access for this user?"))return;fe=!0,d=!0,E(),m();try{await A.revoke(F,n),await xa(F),b("success","Share revoked")}catch(r){b("error",r instanceof Error?r.message:"Revoke failed")}finally{d=!1,m()}return}if(a==="export-cal"){if(F===null)return;fe=!0,d=!0,E(),m();try{const{blob:n,filename:r}=await A.exportCalendar(F),u=URL.createObjectURL(n),f=document.createElement("a");f.href=u,f.download=r,f.click(),URL.revokeObjectURL(u),b("success",`Exported ${r}`)}catch(n){b("error",n instanceof Error?n.message:"Export failed")}finally{d=!1,m()}}}function Tr(){const t=s.querySelector('input[data-action="import-cal"]');t&&t.addEventListener("change",()=>{Pr(t)});const e=s.querySelector('input[data-action="import-create-cal"]');e&&e.addEventListener("change",()=>{Fr(e)});const a=s.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{_r(a)})}async function _r(t){var l;if(M===null)return;const e=(l=t.files)==null?void 0:l[0];if(t.value="",!e)return;const a=M;Ge=!0,d=!0,E(),gt(),j={kind:"contacts",fileName:e.name,fileSizeLabel:Hs(e.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ws(),m();try{const o=await Gs(e,r=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:r};const u=s.querySelector(".import-progress-bar"),f=s.querySelector("[data-import-status-line]");u&&r!==null&&(u.classList.remove("is-indeterminate"),u.style.width=`${r}%`),f&&r!==null&&(f.textContent=`Reading file… ${r}%`)});Ft("uploading",{readPercent:100}),Ft("processing",{processPercent:0}),N.event("import.contacts.start",{file:e.name,bytes:e.size,abId:a});const p=await A.importAddressBook(a,o,r=>{Ys(r)}),n=Es(p);await Ze(),M===a&&await Lt(a),gt(),Ft("done",{ok:!0,resultMessage:`${n} (from “${e.name}”)`}),b("success",`Import finished for “${e.name}”: ${n}.`)}catch(o){const p=o instanceof Error?o.message:"Import failed";gt(),Ft("error",{ok:!1,resultMessage:p}),b("error",p)}finally{d=!1,m()}}function Za(){if(!I)return;const t=s.querySelector('[data-form="contact"]');if(!t)return;const e=new FormData(t);I.firstname=String(e.get("firstname")??""),I.lastname=String(e.get("lastname")??""),I.fullname=String(e.get("fullname")??""),I.org=String(e.get("org")??""),I.title=String(e.get("title")??""),I.url=String(e.get("url")??""),I.note=String(e.get("note")??"");const a=String(e.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(e.get("street")??""),city:String(e.get("city")??""),region:String(e.get("region")??""),postal:String(e.get("postal")??""),country:String(e.get("country")??"")};const l=[];let o=0;for(;e.has(`email_${o}`);)l.push(String(e.get(`email_${o}`)??"")),o++;l.length&&(I.emails=l);const p=[];for(o=0;e.has(`phone_value_${o}`);)p.push({type:String(e.get(`phone_type_${o}`)??"other"),value:String(e.get(`phone_value_${o}`)??"")}),o++;p.length&&(I.phones=p);const n=[];for(o=0;e.has(`custom_label_${o}`)||e.has(`custom_value_${o}`);)n.push({label:String(e.get(`custom_label_${o}`)??""),value:String(e.get(`custom_value_${o}`)??"")}),o++;I.custom=n}function Ir(t){const e=new FormData(t),a=[];let l=0;for(;e.has(`email_${l}`);){const r=String(e.get(`email_${l}`)??"").trim();r&&a.push(r),l++}const o=[];for(l=0;e.has(`phone_value_${l}`);){const r=String(e.get(`phone_value_${l}`)??"").trim();r&&o.push({type:String(e.get(`phone_type_${l}`)??"other"),value:r}),l++}const p=[];for(l=0;e.has(`custom_label_${l}`)||e.has(`custom_value_${l}`);){const r=String(e.get(`custom_label_${l}`)??"").trim(),u=String(e.get(`custom_value_${l}`)??"").trim();(r||u)&&p.push({label:r,value:u}),l++}const n={firstname:String(e.get("firstname")??"").trim(),lastname:String(e.get("lastname")??"").trim(),fullname:String(e.get("fullname")??"").trim(),org:String(e.get("org")??"").trim(),title:String(e.get("title")??"").trim(),emails:a,phones:o,address:{street:String(e.get("street")??"").trim(),city:String(e.get("city")??"").trim(),region:String(e.get("region")??"").trim(),postal:String(e.get("postal")??"").trim(),country:String(e.get("country")??"").trim()},url:String(e.get("url")??"").trim(),note:String(e.get("note")??"").trim(),birthday:(()=>{const r=String(e.get("birthday")??"").trim();return r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null})(),custom:p};return Qe?n.removePhoto=!0:Je&&(n.photoBase64=Je),n}async function qr(t){if(M===null)return;const e=Ir(t);d=!0,E(),Ce=!0,m();try{if(be){const a=await A.createContact(M,e);be=!1,ce=a.contact.uri,I=null,Ce=!1,Ee=null,Je=null,Qe=!1,O=null,b("success","Contact created")}else ce&&(ce=(await A.updateContact(M,ce,e)).contact.uri,I=null,Ce=!1,Ee=null,Je=null,Qe=!1,O=null,b("success","Contact saved"));try{await Ze()}catch(a){if(console.error(a),M!==null)try{await Lt(M)}catch{}}}catch(a){b("error",a instanceof Error?a.message:"Save failed")}finally{d=!1,m()}}async function Lr(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();if(a){d=!0,E(),m();try{const o=await A.createAddressBook({displayname:a,description:l});M=o.addressbook.id,ce=null,I=null,be=!1,Gt="",await Ze(),b("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){b("error",o instanceof Error?o.message:"Create failed")}finally{d=!1,m()}}}async function Or(t){if(M===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();Ge=!0,d=!0,E(),m();try{await A.updateAddressBook(M,{displayname:a,description:l}),await Ze(),b("success","Address book updated")}catch(o){b("error",o instanceof Error?o.message:"Update failed")}finally{d=!1,m()}}function Ur(t){const e=tl[t];if(!e)return;const a=s.querySelector("#info-modal"),l=s.querySelector("#info-modal-title"),o=s.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=e.title,o.innerHTML=e.paragraphs.map(n=>`<p>${i(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const p=a.querySelector(".info-modal-close");p==null||p.focus()}function en(){const t=s.querySelector("#info-modal");t&&(t.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Pr(t){var a;if(F===null)return;const e=(a=t.files)==null?void 0:a[0];t.value="",e&&(fe=!0,await tn(F,e,{keepEditModalOpen:!0}))}async function Fr(t){var f;const e=(f=t.files)==null?void 0:f[0];if(t.value="",!e)return;const a=s.querySelector('[data-form="create-cal"]'),l=a?new FormData(a):new FormData,o=l.get("holidays")==="on",p=l.get("readOnly")==="on";if(o){b("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Re=!0,m();return}if(p){b("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Re=!0,m();return}let n=String(l.get("displayname")??"").trim();n||(n=e.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const r=String(l.get("description")??""),u=String(l.get("color")??"").trim();d=!0,E(),Re=!0,m();try{const y=await A.createCalendar({displayname:n,description:r,color:u,readOnly:!1});F=y.calendar.id,Re=!1,await Ze(),b("success",`Created “${y.calendar.displayname}” — importing…`),await tn(y.calendar.id,e,{keepEditModalOpen:!1,successPrefix:`Calendar “${y.calendar.displayname}” created. `})}catch(y){const v=y instanceof Error?y.message:"Create or import failed";Re=!0,b("error",v),d=!1,m()}}async function tn(t,e,a={}){d=!0,E(),gt(),j={kind:"calendar",fileName:e.name,fileSizeLabel:Hs(e.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Ws(),m();try{const l=await Gs(e,n=>{if(!j||j.phase!=="reading")return;j={...j,readPercent:n};const r=s.querySelector(".import-progress-bar"),u=s.querySelector("[data-import-status-line]");r&&n!==null&&(r.classList.remove("is-indeterminate"),r.style.width=`${n}%`),u&&n!==null&&(u.textContent=`Reading file… ${n}%`)});Ft("uploading",{readPercent:100}),Ft("processing",{processPercent:0}),N.event("import.calendar.start",{file:e.name,bytes:e.size,calId:t});const o=await A.importCalendar(t,l,n=>{Ys(n)}),p=Es(o);F===t&&await et(),gt(),Ft("done",{ok:!0,resultMessage:`${p} (from “${e.name}”)`}),b("success",`${a.successPrefix||""}Import finished for “${e.name}”: ${p}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";gt(),Ft("error",{ok:!1,resultMessage:o}),b("error",o)}finally{a.keepEditModalOpen&&(fe=!0),d=!1,m()}}Sn()}let Vt="",P=null,se=!1,dt=null,St=null,Rt="sqlite",ds=!1;async function cs(s,c={}){const g={Accept:"application/json",...c.headers};c.body&&(g["Content-Type"]="application/json"),Vt&&c.method&&c.method!=="GET"&&(g["X-CSRF-Token"]=Vt);const h=await fetch(`/api/install${s}`,{credentials:"same-origin",...c,headers:g});let w;try{w=await h.json()}catch{throw new Error(`Request failed (${h.status})`)}if(!h.ok)throw new Error(w.error||`Request failed (${h.status})`);return w&&typeof w=="object"&&"data"in w&&w.data!==void 0?w.data:w}async function Is(){var s;P=await cs("/status"),Vt=P.csrfToken||Vt,((s=P.defaults)==null?void 0:s.backend)==="pgsql"?Rt="pgsql":Rt="sqlite"}function Ua(s,c,g){return`<label class="check-row"><input type="checkbox" name="${i(s)}" ${c?"checked":""} ${se?"disabled":""} /> ${i(g)}</label>`}function nl(){const s=P==null?void 0:P.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${i((s==null?void 0:s.configPath)||"—")} ${s!=null&&s.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${i((s==null?void 0:s.specificPath)||"—")} ${s!=null&&s.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${ra("error",(P==null?void 0:P.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${se?"disabled":""}>Retry</button>
  </section>`}function rl(){const s=P==null?void 0:P.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${se?"disabled":""}>
          ${cn((s==null?void 0:s.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ua("cal_enabled",(s==null?void 0:s.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ua("card_enabled",(s==null?void 0:s.card_enabled)!==!1,"Enable CardDAV")}
      ${Ua("tasks_enabled",(s==null?void 0:s.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ua("notes_enabled",!!(s!=null&&s.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ua("files_enabled",!!(s!=null&&s.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${se?"disabled":""}>
          ${["Digest","Basic","Apache"].map(c=>`<option value="${c}" ${((s==null?void 0:s.dav_auth_type)||"Digest")===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${i((s==null?void 0:s.invite_from)||"")}" ${se?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${i(String((s==null?void 0:s.session_max_age_minutes)??15))}" ${se?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${se?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${se?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${se?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function ll(){const s=P==null?void 0:P.defaults,c=(P==null?void 0:P.pdoDrivers)||[],g=c.includes("sqlite"),h=c.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${se?"disabled":""}>
          ${g?`<option value="sqlite" ${Rt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${h?`<option value="pgsql" ${Rt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Rt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${i((s==null?void 0:s.sqlite_file)||"")}" class="mono" ${se?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Rt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${i((s==null?void 0:s.pgsql_host)||"")}" placeholder="localhost:5432" ${se?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${i((s==null?void 0:s.pgsql_dbname)||"")}" ${se?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${i((s==null?void 0:s.pgsql_username)||"")}" autocomplete="off" ${se?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${se?"disabled":""} />
        </label>
      </div>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${se?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function ol(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${i(String((P==null?void 0:P.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${i((P==null?void 0:P.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${ds?"checked":""} ${se?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${se||!ds?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function il(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${i((P==null?void 0:P.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function dl(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${ra("error",(P==null?void 0:P.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function ct(){const s=document.getElementById("app");if(!s)return;const c=(P==null?void 0:P.step)||"permissions";let g="";P?c==="permissions"?g=nl():c==="initialize"?g=rl():c==="database"?g=ll():c==="upgrade"?g=ol():c==="done"?g=il():c==="locked"?g=dl():g=`<section class="card"><p>Unknown step: ${i(c)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',s.innerHTML=`
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
      ${dt?ra("error",dt,{dismissible:!1}):""}
      ${St?ra("success",St,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,cl()}function cl(){var c,g,h,w,q,U;const s=document.getElementById("app");s&&((c=s.querySelector('[data-action="reload"]'))==null||c.addEventListener("click",()=>{ul()}),(g=s.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",R=>{Rt=R.target.value==="pgsql"?"pgsql":"sqlite",ct()}),(h=s.querySelector('[data-action="upgrade-toggle"]'))==null||h.addEventListener("change",R=>{ds=!!R.target.checked,ct()}),(w=s.querySelector('[data-action="upgrade-run"]'))==null||w.addEventListener("click",()=>{fl()}),(q=s.querySelector('[data-form="initialize"]'))==null||q.addEventListener("submit",R=>{R.preventDefault(),ml(R.target)}),(U=s.querySelector('[data-form="database"]'))==null||U.addEventListener("submit",R=>{R.preventDefault(),pl(R.target)}))}async function ul(){se=!0,dt=null,ct();try{await Is(),St=null}catch(s){dt=s instanceof Error?s.message:"Failed to load installer status"}finally{se=!1,ct()}}async function ml(s){const c=new FormData(s),g=w=>{var q;return!!((q=s.querySelector(`input[name="${w}"]`))!=null&&q.checked)},h={timezone:String(c.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(c.get("dav_auth_type")??"Digest"),invite_from:String(c.get("invite_from")??"").trim(),session_max_age_minutes:Number(c.get("session_max_age_minutes")??15),admin_password:String(c.get("admin_password")??""),admin_password_confirm:String(c.get("admin_password_confirm")??"")};se=!0,dt=null,St=null,ct();try{P=await cs("/initialize",{method:"POST",body:JSON.stringify(h)}),Vt=P.csrfToken||Vt,St="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(w){dt=w instanceof Error?w.message:"Initialize failed"}finally{se=!1,ct()}}async function pl(s){const c=new FormData(s),g=String(c.get("backend")??Rt),h={backend:g};g==="sqlite"?h.sqlite_file=String(c.get("sqlite_file")??"").trim():(h.pgsql_host=String(c.get("pgsql_host")??"").trim(),h.pgsql_dbname=String(c.get("pgsql_dbname")??"").trim(),h.pgsql_username=String(c.get("pgsql_username")??"").trim(),h.pgsql_password=String(c.get("pgsql_password")??"")),se=!0,dt=null,St=null,ct();try{P=await cs("/database",{method:"POST",body:JSON.stringify(h)}),Vt=P.csrfToken||Vt,St="Database configured. Installer is locked.",N.event("install.database"),P.completed||P.step}catch(w){dt=w instanceof Error?w.message:"Database setup failed"}finally{se=!1,ct()}}async function fl(){if(ds){se=!0,dt=null,St=null,ct();try{const s=await cs("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});St="Upgrade completed."+(s.messages&&s.messages.length?" "+s.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await Is()}catch(s){dt=s instanceof Error?s.message:"Upgrade failed"}finally{se=!1,ct()}}}async function bl(s){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),s.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Is()}catch(c){dt=c instanceof Error?c.message:"Failed to load installer"}ct()}const Ns=document.getElementById("app");if(!Ns)throw new Error("#app missing");const ln=window.location.pathname.replace(/\/+$/,"")||"/";ln==="/portal/install"||ln.endsWith("/portal/install")?bl(Ns):sl(Ns);
