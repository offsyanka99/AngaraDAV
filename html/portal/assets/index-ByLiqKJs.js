var ol=Object.defineProperty;var il=(n,u,g)=>u in n?ol(n,u,{enumerable:!0,configurable:!0,writable:!0,value:g}):n[u]=g;var Ms=(n,u,g)=>il(n,typeof u!="symbol"?u+"":u,g);(function(){const u=document.createElement("link").relList;if(u&&u.supports&&u.supports("modulepreload"))return;for(const w of document.querySelectorAll('link[rel="modulepreload"]'))y(w);new MutationObserver(w=>{for(const L of w)if(L.type==="childList")for(const U of L.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&y(U)}).observe(document,{childList:!0,subtree:!0});function g(w){const L={};return w.integrity&&(L.integrity=w.integrity),w.referrerPolicy&&(L.referrerPolicy=w.referrerPolicy),w.crossOrigin==="use-credentials"?L.credentials="include":w.crossOrigin==="anonymous"?L.credentials="omit":L.credentials="same-origin",L}function y(w){if(w.ep)return;w.ep=!0;const L=g(w);fetch(w.href,L)}})();const Sn={off:0,error:1,warn:2,info:3,debug:4};let Ja="off";const ys="[angaradav-portal]";function dl(n){const u=(n||"off").toLowerCase().trim();return u==="error"||u==="warn"||u==="info"||u==="debug"||u==="off"?u:"off"}function cl(n){return Ja=dl(n),Ja!=="off"&&console.info(ys,`log level = ${Ja}`),Ja}function En(n){return Sn[Ja]>=Sn[n]}function ps(n,u,g,y){if(!En(n))return;const w=[ys,g];y!==void 0&&w.push(y),console[u](...w)}function ul(n,u){En("info")&&(u&&Object.keys(u).length>0?console.info(ys,`event:${n}`,u):console.info(ys,`event:${n}`))}const N={error(n,u){ps("error","error",n,u)},warn(n,u){ps("warn","warn",n,u)},info(n,u){ps("info","info",n,u)},debug(n,u){ps("debug","debug",n,u)},event:ul};class ke extends Error{constructor(g,y,w={}){super(g);Ms(this,"status");Ms(this,"payload");this.status=y,this.payload=w}}let ga="",bs=null,gs=null;function hs(n){ga=n&&typeof n=="string"?n:""}function ml(n){bs=n}function pl(n){gs=n}function js(n){if(!Nn(n))try{gs==null||gs()}catch{}}function Nn(n){return n==="/login"||n==="/ui"||n==="/logout"||n==="/install/status"||n.startsWith("/install/")}function $s(n,u){if(!Nn(n)){hs("");try{bs==null||bs(u||"Session timed out. Please sign in again.")}catch{}}}async function q(n,u={}){const g=new Headers(u.headers);u.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const y=(u.method||"GET").toUpperCase();y!=="GET"&&y!=="HEAD"&&y!=="OPTIONS"&&ga&&g.set("X-CSRF-Token",ga);const w=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${y} ${n}`);const L=await fetch(`/api${n}`,{...u,headers:g,credentials:"same-origin"});let U=null;const H=await L.text();if(H)try{U=JSON.parse(H)}catch{U={error:H}}const B=Math.round((typeof performance<"u"?performance.now():Date.now())-w);if(!L.ok){let ae=`Request failed (${L.status})`,ee={};if(U&&typeof U=="object"&&U!==null){const le=U;ee={...le},typeof le.error=="string"&&(ae=le.error)}else(L.status===500||L.status===504)&&(ae="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw L.status>=500?N.error(`api ← ${y} ${n} ${L.status} (${B}ms)`,ae):L.status!==401?N.warn(`api ← ${y} ${n} ${L.status} (${B}ms)`,ae):(N.debug(`api ← ${y} ${n} 401 (${B}ms)`),$s(n,ae)),new ke(ae,L.status,ee)}return N.info(`api ← ${y} ${n} ${L.status} (${B}ms)`),js(n),U}function rt(n){return encodeURIComponent(n)}async function kn(n,u,g,y){const w=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});ga&&w.set("X-CSRF-Token",ga);const L=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${n} (stream, ${g}, ${u.length} bytes)`);let U;try{U=await fetch(`/api${n}`,{method:"POST",headers:w,credentials:"same-origin",body:u})}catch(R){const se=R instanceof Error?R.message:"Network error";throw N.error(`api ← POST ${n} network fail`,se),new ke(`Import request failed to start (${se}). Check connectivity and container logs.`,0)}const H=(U.headers.get("Content-Type")||"").toLowerCase(),B=H.includes("ndjson")||H.includes("x-ndjson");if(!U.ok&&!B){let R=`Request failed (${U.status})`;try{const se=await U.json();se.error&&(R=se.error)}catch{}throw(U.status===504||U.status===502)&&(R="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),U.status===401?(N.debug(`api ← POST ${n} 401`,R),$s(n,R)):N.warn(`api ← POST ${n} ${U.status}`,R),new ke(R,U.status)}if(!B&&U.ok){try{const R=await U.json();if(R&&typeof R.error=="string")throw new ke(R.error,U.status||500);if(R&&typeof R.imported=="number"&&typeof R.updated=="number")return N.info(`api ← POST ${n} json done`),R}catch(R){if(R instanceof ke)throw R}throw new ke("Unexpected import response from server",500)}if(!U.body)throw new ke("Import stream unavailable",500);const ae=U.body.getReader(),ee=new TextDecoder;let le="";const X={final:null,error:null,sawProgress:!1},Ne=R=>{let se;try{se=JSON.parse(R)}catch{N.debug("import stream non-JSON line",R.slice(0,80));return}if(se.type==="progress"){X.sawProgress=!0;const Oe=Number(se.total)||0,He=Number(se.current)||0,Ue=typeof se.percent=="number"?se.percent:Oe>0?Math.round(100*He/Oe):0;y==null||y({percent:Ue,current:He,total:Oe,imported:Number(se.imported)||0,updated:Number(se.updated)||0,skipped:Number(se.skipped)||0})}else se.type==="done"&&se.result?X.final=se.result:se.type==="error"&&(X.error={message:se.error||"Import failed",status:se.status||500})};for(;;){const{done:R,value:se}=await ae.read();if(R)break;le+=ee.decode(se,{stream:!0});const Oe=le.split(`
`);le=Oe.pop()??"";for(const He of Oe){const Ue=He.trim();Ue&&Ne(Ue)}}le.trim()&&Ne(le.trim());const z=Math.round((typeof performance<"u"?performance.now():Date.now())-L);if(X.error)throw X.error.status===401?(N.debug(`api ← POST ${n} stream 401 (${z}ms)`,X.error.message),$s(n,X.error.message)):N.warn(`api ← POST ${n} stream error (${z}ms)`,X.error.message),new ke(X.error.message,X.error.status);if(!X.final)throw N.error(`api ← POST ${n} stream incomplete (${z}ms)`,{sawProgress:X.sawProgress}),new ke(X.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${n} stream done (${z}ms)`),js(n),X.final}const E={ui:()=>q("/ui"),installStatus:async()=>{const n=await q("/install/status");return n&&typeof n=="object"&&"data"in n&&n.data?n.data:n},adminPing:()=>q("/admin/ping"),adminDashboard:()=>q("/admin/dashboard"),adminCapabilities:()=>q("/admin/capabilities"),adminUsers:()=>q("/admin/users"),adminUser:n=>q(`/admin/users/${encodeURIComponent(n)}`),adminCreateUser:n=>q("/admin/users",{method:"POST",body:JSON.stringify(n)}),adminUpdateUser:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}`,{method:"PATCH",body:JSON.stringify(u)}),adminDeleteUser:(n,u=!0)=>q(`/admin/users/${encodeURIComponent(n)}`,{method:"DELETE",body:JSON.stringify({confirm:u})}),adminUserCalendars:n=>q(`/admin/users/${encodeURIComponent(n)}/calendars`),adminCreateUserCalendar:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}/calendars`,{method:"POST",body:JSON.stringify(u)}),adminUpdateUserCalendar:(n,u,g)=>q(`/admin/users/${encodeURIComponent(n)}/calendars/${u}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(n,u,g=!0)=>q(`/admin/users/${encodeURIComponent(n)}/calendars/${u}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:n=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks`),adminCreateUserAddressBook:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks`,{method:"POST",body:JSON.stringify(u)}),adminUpdateUserAddressBook:(n,u,g)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks/${u}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(n,u,g=!0,y=!1)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks/${u}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:y})}),adminSystemSettings:()=>q("/admin/settings/system"),adminUpdateSystemSettings:n=>q("/admin/settings/system",{method:"PATCH",body:JSON.stringify(n)}),adminResetToDefault:(n=!0,u="")=>q("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:n,password:u})}),adminDatabaseSettings:()=>q("/admin/settings/database"),adminTestDatabaseConnection:n=>q("/admin/settings/database/test",{method:"POST",body:JSON.stringify(n)}),adminUpdateDatabaseSettings:n=>q("/admin/settings/database",{method:"PATCH",body:JSON.stringify(n)}),me:async()=>{var u;const n=await q("/me");return hs(n.csrfToken||((u=n.user)==null?void 0:u.csrfToken)),n},login:async(n,u)=>{var y;const g=await q("/login",{method:"POST",body:JSON.stringify({username:n,password:u})});return hs((y=g.user)==null?void 0:y.csrfToken),g},logout:async()=>{try{return await q("/logout",{method:"POST"})}finally{hs("")}},calendars:()=>q("/calendars"),createCalendar:n=>q("/calendars",{method:"POST",body:JSON.stringify(n)}),holidayCountries:()=>q("/holidays/countries"),updateCalendar:(n,u)=>q(`/calendars/${n}`,{method:"PATCH",body:JSON.stringify(u)}),deleteCalendar:n=>q(`/calendars/${n}`,{method:"DELETE"}),calendarEvents:(n,u,g)=>{const y=new URLSearchParams({from:u,to:g}).toString();return q(`/calendars/${n}/events?${y}`)},getEvent:(n,u)=>q(`/calendars/${n}/events/${rt(u)}`),createEvent:(n,u)=>q(`/calendars/${n}/events`,{method:"POST",body:JSON.stringify(u)}),updateEvent:(n,u,g)=>q(`/calendars/${n}/events/${rt(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(n,u)=>q(`/calendars/${n}/events/${rt(u)}`,{method:"DELETE"}),exportCalendar:async n=>{const u=await fetch(`/api/calendars/${n}/export`,{credentials:"same-origin"});if(!u.ok){let U=`Export failed (${u.status})`;try{const H=await u.json();H.error&&(U=H.error)}catch{}throw new ke(U,u.status)}const g=u.headers.get("Content-Disposition")||"",y=/filename="([^"]+)"/i.exec(g),w=(y==null?void 0:y[1])||`calendar-${n}.ics`;return{blob:await u.blob(),filename:w}},importCalendar:(n,u,g)=>kn(`/calendars/${n}/import`,u,"text/calendar; charset=utf-8",g),directory:()=>q("/directory"),shares:n=>q(`/calendars/${n}/shares`),share:(n,u,g)=>q(`/calendars/${n}/shares`,{method:"POST",body:JSON.stringify({username:u,access:g})}),revoke:(n,u)=>q(`/calendars/${n}/shares`,{method:"DELETE",body:JSON.stringify({href:u})}),addressbooks:()=>q("/addressbooks"),createAddressBook:n=>q("/addressbooks",{method:"POST",body:JSON.stringify(n)}),updateAddressBook:(n,u)=>q(`/addressbooks/${n}`,{method:"PATCH",body:JSON.stringify(u)}),deleteAddressBook:(n,u=!1)=>q(`/addressbooks/${n}`,{method:"DELETE",body:JSON.stringify({force:u})}),exportAddressBook:async n=>{const u=await fetch(`/api/addressbooks/${n}/export`,{credentials:"same-origin"});if(!u.ok){let U=`Export failed (${u.status})`;try{const H=await u.json();H.error&&(U=H.error)}catch{}throw new ke(U,u.status)}const g=u.headers.get("Content-Disposition")||"",y=/filename="([^"]+)"/i.exec(g),w=(y==null?void 0:y[1])||`contacts-${n}.vcf`;return{blob:await u.blob(),filename:w}},importAddressBook:(n,u,g)=>kn(`/addressbooks/${n}/import`,u,"text/vcard; charset=utf-8",g),contacts:(n,u="")=>{const g=u.trim()?`?q=${encodeURIComponent(u.trim())}`:"";return q(`/addressbooks/${n}/contacts${g}`)},getContact:(n,u)=>q(`/addressbooks/${n}/contacts/${rt(u)}`),createContact:(n,u)=>q(`/addressbooks/${n}/contacts`,{method:"POST",body:JSON.stringify(u)}),updateContact:(n,u,g)=>q(`/addressbooks/${n}/contacts/${rt(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(n,u)=>q(`/addressbooks/${n}/contacts/${rt(u)}`,{method:"DELETE"}),exportContact:async(n,u)=>{const g=await fetch(`/api/addressbooks/${n}/contacts/${rt(u)}/export`,{credentials:"same-origin"});if(!g.ok){let H=`Export failed (${g.status})`;try{const B=await g.json();B.error&&(H=B.error)}catch{}throw new ke(H,g.status)}const y=g.headers.get("Content-Disposition")||"",w=/filename="([^"]+)"/i.exec(y),L=(w==null?void 0:w[1])||"contact.vcf";return{blob:await g.blob(),filename:L}},contactPhotoUrl:(n,u)=>`/api/addressbooks/${n}/contacts/${rt(u)}/photo`,tasks:(n={})=>{const u=new URLSearchParams;n.q&&u.set("q",n.q),n.sort&&u.set("sort",n.sort),n.order&&u.set("order",n.order);const g=u.toString()?`?${u}`:"";return q(`/tasks${g}`)},createTask:n=>q("/tasks",{method:"POST",body:JSON.stringify(n)}),updateTask:(n,u,g)=>q(`/tasks/${n}/${rt(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(n,u)=>q(`/tasks/${n}/${rt(u)}`,{method:"DELETE"}),bulkTasks:n=>q("/tasks/bulk",{method:"POST",body:JSON.stringify(n)}),notes:(n={})=>{const u=new URLSearchParams;n.q&&u.set("q",n.q),n.sort&&u.set("sort",n.sort),n.order&&u.set("order",n.order);const g=u.toString()?`?${u}`:"";return q(`/notes${g}`)},createNote:n=>q("/notes",{method:"POST",body:JSON.stringify(n)}),updateNote:(n,u,g)=>q(`/notes/${n}/${rt(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(n,u)=>q(`/notes/${n}/${rt(u)}`,{method:"DELETE"}),filesStatus:()=>q("/files"),filesList:(n="")=>{const u=new URLSearchParams;n&&u.set("path",n);const g=u.toString()?`?${u}`:"";return q(`/files/entries${g}`)},filesMkdir:(n,u)=>q("/files/mkdir",{method:"POST",body:JSON.stringify({path:n,name:u})}),filesUpload:(n,u,g={})=>{const y=new URLSearchParams;n&&y.set("path",n),y.set("name",u.name),g.replace&&y.set("replace","1");const w=new FormData;w.append("file",u,u.name),n&&w.append("path",n);const L=typeof performance<"u"?performance.now():Date.now();return N.debug(`api → POST /files/upload path=${n||"/"} name=${u.name} size=${u.size}`),new Promise((U,H)=>{const B=new XMLHttpRequest;B.open("POST",`/api/files/upload?${y}`),B.withCredentials=!0,ga&&B.setRequestHeader("X-CSRF-Token",ga),g.onProgress&&(B.upload.onprogress=ae=>{var ee,le;ae.lengthComputable?(ee=g.onProgress)==null||ee.call(g,ae.loaded,ae.total):(le=g.onProgress)==null||le.call(g,ae.loaded,u.size||ae.loaded)}),B.onload=()=>{const ae=Math.round((typeof performance<"u"?performance.now():Date.now())-L);let ee=null;const le=B.responseText||"";if(le)try{ee=JSON.parse(le)}catch{ee={error:le}}const X=B.status;if(X<200||X>=300){let Ne=`Upload failed (${X||0})`;ee&&typeof ee=="object"&&ee!==null&&"error"in ee&&typeof ee.error=="string"&&(Ne=ee.error),X===401?(N.debug(`api ← POST /files/upload 401 (${ae}ms)`,Ne),$s("/files/upload",Ne)):X>=500?N.error(`api ← POST /files/upload ${X} (${ae}ms)`,Ne):N.warn(`api ← POST /files/upload ${X} (${ae}ms)`,Ne),H(new ke(Ne,X||0));return}N.info(`api ← POST /files/upload 200 (${ae}ms)`),js("/files/upload"),U(ee)},B.onerror=()=>{const ae=Math.round((typeof performance<"u"?performance.now():Date.now())-L);N.error(`api ← POST /files/upload network error (${ae}ms)`),H(new ke("Upload failed (network error)",0))},B.onabort=()=>{H(new ke("Upload cancelled",0))},B.send(w)})},filesDownloadUrl:n=>{const u=new URLSearchParams;return u.set("path",n),`/api/files/download?${u}`},filesDelete:n=>q("/files/entry",{method:"DELETE",body:JSON.stringify({path:n})}),filesRename:(n,u)=>q("/files/rename",{method:"POST",body:JSON.stringify({path:n,newName:u})}),filesMove:(n,u,g)=>q("/files/move",{method:"POST",body:JSON.stringify({from:n,to:u,newName:g})}),filesCopy:(n,u={})=>q("/files/copy",{method:"POST",body:JSON.stringify({path:n,to:u.to,newName:u.newName})}),filesBulk:(n,u)=>q("/files/bulk",{method:"POST",body:JSON.stringify({op:n,paths:u})})},fl=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let Ta=null;function bl(){if(Ta)return Ta;try{const n=Intl;if(typeof n.supportedValuesOf=="function"){const u=n.supportedValuesOf("timeZone");if(Array.isArray(u)&&u.length>0)return Ta=[...u].sort((g,y)=>g.localeCompare(y)),Ta}}catch{}return Ta=[...fl],Ta}function Tn(n){const u=n||"UTC",g=bl(),y=g.includes(u),w=g.map(L=>`<option value="${Dn(L)}" ${L===u?"selected":""}>${Cn(L)}</option>`);return!y&&u&&w.unshift(`<option value="${Dn(u)}" selected>${Cn(u)}</option>`),w.join("")}function Dn(n){return n.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function Cn(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function xt(n,u,g={}){if(!u)return"";const y=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,w=g.dismissAction??"flash-close",L=g.role??"status",U=g.className?` ${g.className}`:"",H=g.style?` style="${i(g.style)}"`:"",B=y?`<button type="button" class="flash-close" data-action="${i(w)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${i(n)}${U}" role="${i(L)}"${H}>
      <span class="flash-text">${i(u)}</span>
      ${B}
    </div>`}function gl(n){return n==="sm"?" cal-modal-card-sm":n==="wide"?" cal-modal-card-wide":""}function hl(n){return n==="danger"?"btn btn-danger":n==="ghost"?"btn btn-ghost":"btn btn-primary"}function Bs(n){return n.map(g=>{const y=g.type??"button",w=hl(g.variant),L=g.disabled?" disabled":"",U=g.id?` id="${i(g.id)}"`:"",H=g.action?` data-action="${i(g.action)}"`:"",B=g.attrs?` ${g.attrs}`:"";return`<button type="${y}" class="${w}"${H}${U}${B}${L}>${i(g.label)}</button>`}).join(`
`)}function we(n){const u=n.titleId||(n.id?`${n.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=n.id?` id="${i(n.id)}"`:"",y=n.className?` ${n.className}`:"",w=n.rootAttrs?` ${n.rootAttrs}`:"",L=`${gl(n.size)}${n.cardClassName?` ${n.cardClassName}`:""}`,U=n.closeAction,H=n.lockBackdrop?"":` data-action="${i(U)}"`,B=n.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${i(U)}" aria-label="Close">×</button>`;let ae="";n.footer!==void 0&&(ae=typeof n.footer=="string"?n.footer:Bs(n.footer));const ee=ae?`<footer class="cal-modal-footer">${ae}</footer>`:"",le=`<div class="cal-modal-body">${n.body}</div>`;let X;return n.form?X=`<form class="stack"${n.formAttrs?` ${n.formAttrs}`:""}>
        ${le}
        ${ee}
      </form>`:X=`${le}
      ${ee}`,`<div class="cal-modal${y}"${g}${w} role="dialog" aria-modal="true" aria-labelledby="${i(u)}">
      <div class="cal-modal-backdrop"${H}></div>
      <div class="cal-modal-card${L}">
        <header class="cal-modal-header">
          <h3 id="${i(u)}">${i(n.title)}</h3>
          ${B}
        </header>
        ${X}
      </div>
    </div>`}function fs(n){const u=n.style==="checkbox"?"checkbox":"admin-delete-confirm",g=n.style==="checkbox"?' style="margin-top:1rem"':"",y=n.id?` id="${i(n.id)}"`:"",w=n.checked?" checked":"",L=n.disabled?" disabled":"";return`<label class="${u}"${g}>
            <input type="checkbox"${y} data-action="${i(n.action)}"${w}${L} />
            ${i(n.label)}
          </label>`}const xn="angaradav-portal-tab",_n="angaradav-portal-admin-page",yl="2.1.1",$l="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Hs(n){return n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"||n==="files"||n==="admin"?n:null}function vs(n){return n==="overview"||n==="users"||n==="settings"||n==="database"?n:null}function Ws(){const n=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!n)return{tab:null,adminPage:null,adminUsername:null};if(n==="admin"||n.startsWith("admin/")){const u=n.split("/").filter(Boolean),g=u[1]??"overview",y=vs(g)??"overview";let w=null;if(y==="users"&&u[2])try{w=decodeURIComponent(u[2])}catch{w=u[2]}return{tab:"admin",adminPage:y,adminUsername:w}}return{tab:Hs(n),adminPage:null,adminUsername:null}}function vl(){const n=Ws().tab;if(n)return n;try{const u=Hs(sessionStorage.getItem(xn));if(u)return u}catch{}return"calendars"}function wl(){const n=Ws().adminPage;if(n)return n;try{const u=vs(sessionStorage.getItem(_n));if(u)return u}catch{}return"overview"}function Sl(n,u=null){return n==="overview"?"#admin":n==="users"&&u?`#admin/users/${encodeURIComponent(u)}`:`#admin/${n}`}function ft(n,u="overview",g=null){try{sessionStorage.setItem(xn,n),n==="admin"&&sessionStorage.setItem(_n,u)}catch{}if(typeof history>"u"||typeof location>"u")return;const y=n==="admin"?Sl(u,g):`#${n}`;location.hash!==y&&history.replaceState(null,"",`${location.pathname}${location.search}${y}`)}function Rs(n){return n==="readwrite"?'<span class="badge badge-admin">full access</span>':n==="read"?'<span class="badge">read-only</span>':n==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(n)}</span>`}function Vs(n){const u=[`${n.imported} new`,`${n.updated} updated`];return n.skipped>0&&u.push(`${n.skipped} skipped`),u.join(", ")}const kl={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload files or an entire folder (browser recreates the folder tree). Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function Se(n,u,g="h2"){const y=g;return`<div class="section-title-row">
    <${y}>${i(n)}</${y}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(u)}"
      aria-label="About ${i(n)}" title="About ${i(n)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Dl(){return`
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
    </div>`}function Cl(n){let u=null,g=null,y=vl(),w=wl(),L=null,U=!1,H=null,B=null,ae=null,ee=[],le=!1,X=null,Ne="",z=Ws().adminUsername??null,R=null,se=!1,Oe=null,He=!1,Ue=!1,ht=null,qt=!1,It=[],Lt=[],xa=!1,Ye=null,Qt=null,lt=null,Xt=null,De=null,Zt=null,Ya=!1,_a=null,ha=!1,yt=!1,Ke="",ea=null,Ka=!1,qa=null,ta="sqlite",ya=!1,$t="",$a=null,Pe=!1,va=null,oe=[],aa=[],Ga=[],F=null,te=[],sa=[],We=null,$e=!1,Ve=!1,Be=null,Ge=null,Ot={y:new Date().getFullYear(),m:new Date().getMonth()},na=[],ks=!1,vt=!1,S=null,ot=!1,O=null,Qa="",Ia=null,Fe=[],V=null,Dt=[],ra="",pe=null,I=null,ge=!1,Te=!1,it=!1,_e=null,Je=null,Qe=!1,d=!1,W=null,Xa=null,J=null,Za=null,Ys=!1,wa={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Xe=null,Ks=900,La=null,la=yl,Ds=!1,es=!1;function Cs(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();wa={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},cl(wa.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(Ks=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(la=e.version.trim())}function As(){La!==null&&(clearTimeout(La),La=null)}function Es(){if(As(),!u)return;const e=Math.max(30,Ks)*1e3;La=setTimeout(()=>{La=null,en("Your session timed out. Please sign in again.")},e)}function ts(){As(),St(),W=null,J=null,Ea(),u=null,oe=[],sa=[],F=null,te=[],aa=[],Fe=[],V=null,Dt=[],pe=null,I=null,ge=!1,Te=!1,it=!1,Ve=!1,$e=!1,Be=null,Ge=null,vt=!1,S=null,ot=!1,na=[],qe=[],ka=[],Ft=[],Mt=[],Me=null,dt=null,Y=null,ie=null,ne=!1,Ae=!1,ve=[],xs=null,Ie="",ue=[],ca=!1,Re=null,xe=null,Pt(),ut=!1,fe=[],_e=null,Je=null,Qe=!1,d=!1,Pe=!1,L=null,U=!1,H=null,B=null,ae=null,ee=[],le=!1,X=null,Ne="",z=null,R=null,se=!1,Oe=null,He=!1,Ue=!1,ht=null,qt=!1,It=[],Lt=[],xa=!1,Ye=null,Qt=null,lt=null,Xt=null,De=null,Zt=null,Ya=!1,_a=null,ha=!1,yt=!1,Ke="",ea=null,Ka=!1,qa=null,ta="sqlite",ya=!1,$t="",$a=null,Ua()}function Ce(){return!!(u!=null&&u.isAdmin||(u==null?void 0:u.role)==="Admin")}function Ut(){return Ce()?B===null?!0:B.uiEnabled!==!1:!1}function ze(e){const t=B==null?void 0:B.pages;return t?t.find(a=>a.id===e)??null:null}function Sa(e){switch(e){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return e}}function Oa(e){return e==="full"||e==="read-only"?"badge-ok":e==="deferred"?"badge-off":"badge-soon"}function Ua(){va&&(document.removeEventListener("click",va,!0),va=null)}function qn(){Ua(),va=t=>{var r;const a=t.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".user-menu")||(Pe=!1,Ua(),p())};const e=va;setTimeout(()=>{Pe&&va===e&&document.addEventListener("click",e,!0)},0)}function Gs(){y==="admin"&&(!Ce()||!Ut())&&(y="calendars",w="overview",ft(y))}async function Qs(e,t={}){if(!Ce()){await Zs("calendars",t);return}y="admin",w=e,e!=="users"?(z=null,R=null,Oe=null):t.username!==void 0&&(z=t.username,t.username||(R=null,Oe=null)),Pe=!1,ft("admin",e,z),N.event("tab",{tab:"admin",adminPage:e,user:z}),t.clearFlash!==!1&&T(),d=!0,p();try{if(await Ns(),!Ut()){y="calendars",ft("calendars"),b("info","Portal Administration UI is disabled.");return}const a=ze(e);e==="overview"&&(a==null?void 0:a.available)!==!1?await as():e==="users"&&(a==null?void 0:a.available)!==!1?(await oa(),z&&(await Ct(z),await ia(z))):e==="settings"&&(a==null?void 0:a.available)!==!1?await ss():e==="database"&&(a==null?void 0:a.available)!==!1&&await ns()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function Ns(){var e;ae=null;try{B=(await E.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:B.uiEnabled,pages:((e=B.pages)==null?void 0:e.length)??0})}catch(t){ae=t instanceof Error?t.message:"Failed to load capabilities",B={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",ae)}}async function as(){U=!0,H=null;try{L=(await E.adminDashboard()).data,N.debug("admin.dashboard",{users:L.users,calendars:L.calendars})}catch(e){throw L=null,H=e instanceof Error?e.message:"Failed to load dashboard",e}finally{U=!1}}async function oa(){le=!0,X=null;try{ee=(await E.adminUsers()).users??[],N.debug("admin.users",{count:ee.length})}catch(e){throw ee=[],X=e instanceof Error?e.message:"Failed to load users",e}finally{le=!1}}async function Ct(e){se=!0,Oe=null;try{const t=await E.adminUser(e);R=t.user,z=t.user.username,N.debug("admin.user",{username:t.user.username})}catch(t){throw R=null,Oe=t instanceof Error?t.message:"Failed to load user",t}finally{se=!1}}async function ia(e){xa=!0;try{const[t,a]=await Promise.all([E.adminUserCalendars(e),E.adminUserAddressBooks(e)]);It=t.calendars??[],Lt=a.addressbooks??[]}catch(t){throw It=[],Lt=[],t}finally{xa=!1}}async function ss(){Ya=!0,_a=null;try{Zt=(await E.adminSystemSettings()).data}catch(e){throw Zt=null,_a=e instanceof Error?e.message:"Failed to load settings",e}finally{Ya=!1}}async function ns(){Ka=!0,qa=null;try{const e=await E.adminDatabaseSettings();ea=e.data,ta=(e.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(e){throw ea=null,qa=e instanceof Error?e.message:"Failed to load database settings",e}finally{Ka=!1}}async function In(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),m=String(t.get("password")??""),s=String(t.get("passwordConfirm")??"");if(!a||!r||!o||!m){b("error","Username, display name, email, and password are required"),p();return}if(m!==s){b("error","Password confirmation does not match"),p();return}d=!0,T(),p();try{const l=await E.adminCreateUser({username:a,displayname:r,email:o,password:m,passwordConfirm:s});N.event("admin.user.create",{username:l.user.username}),He=!1,z=l.user.username,R=l.user,ft("admin","users",l.user.username),await oa(),b("success",`Created user “${l.user.username}”`)}catch(l){b("error",l instanceof Error?l.message:"Create failed")}finally{d=!1,p()}}async function Ln(e){var c,f;if(!z)return;const t=z,a=new FormData(e),r=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim(),m=String(a.get("calendarcolor")??"").trim(),s=((c=e.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,l=((f=e.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;d=!0,T(),p();try{if(Ye==="create"){const h=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserCalendar(t,{uri:h,displayname:r,description:o,calendarcolor:m||void 0,todos:s,notes:l}),b("success",`Created calendar “${r}”`)}else{const h=Number(a.get("instanceId"));await E.adminUpdateUserCalendar(t,h,{displayname:r,description:o,calendarcolor:m,todos:s,notes:l}),b("success",`Updated calendar “${r}”`)}Ye=null,Qt=null,await ia(t),await Ct(t)}catch(h){b("error",h instanceof Error?h.message:"Save failed")}finally{d=!1,p()}}async function On(e){if(!z)return;const t=z,a=new FormData(e),r=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim();d=!0,T(),p();try{if(lt==="create"){const m=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserAddressBook(t,{uri:m,displayname:r,description:o}),b("success",`Created address book “${r}”`)}else{const m=Number(a.get("id"));await E.adminUpdateUserAddressBook(t,m,{displayname:r,description:o}),b("success",`Updated address book “${r}”`)}lt=null,Xt=null,await ia(t),await Ct(t)}catch(m){b("error",m instanceof Error?m.message:"Save failed")}finally{d=!1,p()}}function Xs(e){const t=new FormData(e),a=String(t.get("backend")??ta).toLowerCase()==="pgsql"?"pgsql":"sqlite",r={backend:a};return a==="sqlite"?r.sqlite_file=String(t.get("sqlite_file")??"").trim():(r.pgsql_host=String(t.get("pgsql_host")??"").trim(),r.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),r.pgsql_username=String(t.get("pgsql_username")??"").trim(),r.pgsql_password=String(t.get("pgsql_password")??"")),r}function Un(e){$a=Xs(e),$t="",ya=!0,T(),p()}async function Pn(e){if(e||(e=n.querySelector('[data-form="admin-database"]')),!e){b("error","Database form not found"),p();return}const t=Xs(e);d=!0,T(),p();try{const a=await E.adminTestDatabaseConnection(t);b("success",a.message||"Connection successful"),N.event("admin.database.test",{backend:a.backend})}catch(a){b("error",a instanceof Error?a.message:"Connection test failed")}finally{d=!1,p()}}async function Fn(e){const t=new FormData(e),a=s=>{var l;return!!((l=e.querySelector(`input[name="${s}"]`))!=null&&l.checked)},r={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(t.get("timezone")??"").trim(),invite_from:String(t.get("invite_from")??"").trim(),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),files_storage_path:String(t.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(t.get("files_max_upload_mb")??0),files_quota_mb:Number(t.get("files_quota_mb")??0),files_quarantine_days:Number(t.get("files_quarantine_days")??0),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),portal_log_level:String(t.get("portal_log_level")??"off"),portal_admin_users:String(t.get("portal_admin_users")??"").trim(),push_external_url:String(t.get("push_external_url")??"").trim(),push_log_level:String(t.get("push_log_level")??"off")},o=String(t.get("admin_password")??""),m=String(t.get("admin_password_confirm")??"");(o!==""||m!=="")&&(r.admin_password=o,r.admin_password_confirm=m),d=!0,T(),p();try{Zt=(await E.adminUpdateSystemSettings(r)).data,N.event("admin.settings.save"),b("success","System settings saved")}catch(s){b("error",s instanceof Error?s.message:"Save failed")}finally{d=!1,p()}}async function Mn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),m=String(t.get("password")??""),s=String(t.get("passwordConfirm")??"");if(!a){b("error","Username is required"),p();return}if(!r||!o){b("error","Display name and email are required"),p();return}if(m!==""||s!==""){if(m===""||s===""){b("error","Password and confirmation are required to change password"),p();return}if(m!==s){b("error","Password confirmation does not match"),p();return}}d=!0,T(),p();try{const l={displayname:r,email:o};m!==""&&(l.password=m,l.passwordConfirm=s);const c=await E.adminUpdateUser(a,l);N.event("admin.user.update",{username:c.user.username,passwordChanged:m!==""}),Ue=!1,R=c.user,z=c.user.username,await oa(),b("success",m!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(l){b("error",l instanceof Error?l.message:"Update failed")}finally{d=!1,p()}}async function Zs(e,t={}){if(e==="admin"&&(!Ce()||!Ut())&&(Ce()&&B&&!B.uiEnabled&&b("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),e="calendars"),e==="admin"){await Qs(w||"overview",{...t,username:w==="users"?z:null});return}y=e,Pe=!1,ft(e),N.event("tab",{tab:e}),e!=="calendars"&&($e=!1,Be=null),e!=="contacts"&&(Ge=null),t.clearFlash!==!1&&T(),d=!0,p();try{e==="contacts"&&V!==null?await Bt(V):e==="calendars"?await tt():e==="tasks"?await zt():e==="notes"?await Ca():e==="files"&&await At()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function At(){ca=!0;try{N.debug("loadFiles",{path:Ie});const[e,t]=await Promise.all([E.filesStatus(),E.filesList(Ie).catch(a=>{if(a instanceof ke&&(a.status===503||a.status===404))return{path:Ie,entries:[]};throw a})]);if(xs=e,e.ready){Ie=t.path,ue=t.entries;const a=new Set(ue.map(r=>r.path));fe=fe.filter(r=>a.has(r))}else ue=[],fe=[];N.event("loadFiles",{path:Ie,count:ue.length,enabled:e.enabled,ready:e.ready})}finally{ca=!1}}function rs(e,t){for(const a of t)if(a&&(e===a||e.startsWith(`${a}/`)))return!0;return!1}function Pt(){he=null,Nt="",Ze={},ct=[]}async function ls(e,t){if(t.length===0)return;he={op:e,paths:[...t]},Nt=Ie,Ze={};const a=new Set([""]);if(Ie){const r=Ie.split("/").filter(Boolean);let o="";for(const m of r)o=o?`${o}/${m}`:m,a.add(o)}ct=[...a],Re=null,xe=null,ut=!1,T(),p(),await Promise.all([...a].map(r=>Ts(r)))}async function Ts(e){const t=Ze[e];if(!(t&&t!=="error")){Ze={...Ze,[e]:"loading"},p();try{const r=(await E.filesList(e)).entries.filter(o=>o.type==="dir").slice().sort((o,m)=>o.name.localeCompare(m.name,void 0,{sensitivity:"base"}));if(!he)return;Ze={...Ze,[e]:r}}catch(a){if(!he)return;Ze={...Ze,[e]:"error"},N.warn("files.tree",{path:e||"/",error:a instanceof Error?a.message:String(a)})}p()}}function Rn(){if(!he)return"";const e=he.paths,t=[],a=(r,o)=>{const m=Nt===r,s=rs(r,e),l=ct.includes(r),c=Ze[r],f=Array.isArray(c),h=r===""||c==="loading"||c==="error"||!f||c.length>0,$=r===""?"Home":Va(r),_=s?"Cannot use a selected item (or a folder inside it) as the destination":r===""?"File home root":r,A=l?"▾":"▸";if(t.push(`<div class="files-tree-row${m?" is-selected":""}${s?" is-blocked":""}" style="--depth:${o}" role="treeitem" aria-selected="${m}" aria-expanded="${l}" aria-disabled="${s}">
        ${h?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${i(r)}"
                aria-label="${l?"Collapse":"Expand"} ${i($)}" ${d?"disabled":""}>${A}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
        <button type="button" class="files-tree-select${m?" is-selected":""}" data-action="files-tree-select" data-path="${i(r)}"
          title="${i(_)}" ${d||s?"disabled":""}>
          <span class="files-icon" aria-hidden="true">📁</span>
          <span class="files-tree-label">${i($)}</span>
        </button>
      </div>`),!!l){if(c==="loading"){t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Loading…</div>`);return}if(c==="error"){t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Could not load folders.
            <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${i(r)}" ${d?"disabled":""}>Retry</button>
          </div>`);return}if(f){for(const x of c)a(x.path,o+1);c.length===0&&r===""&&t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">No subfolders yet — destination will be Home.</div>`)}}};return a("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${t.join("")}</div>`}function en(e){if(!Ds){if(!u){As();return}Ds=!0;try{N.event("session.expired"),ts(),es=!0,g={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},p()}finally{Ds=!1}}}let qe=[],ka=[],Ft=[],Mt=[],os="",is="",Rt="due",Et="asc",Da="dtstart",da="desc",Me=null,dt=null,Y=null,ie=null,ne=!1,Ae=!1,ve=[],xs=null,Ie="",ue=[],ca=!1,Re=null,xe=null,he=null,Nt="",Ze={},ct=[],ut=!1,fe=[];function b(e,t){es&&e==="error"||(e!=="error"&&(es=!1),g={type:e,message:t})}function T(){g=null,es=!1}function Vn(e){const t=String(e.step||"");t==="upgrade"||t==="initialize"||t==="permissions"||t==="database"?(We={step:t,message:e.message||(t==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:e.installUrl||"/portal/install/",productVersion:e.productVersion,configuredVersion:e.configuredVersion??null},typeof e.productVersion=="string"&&e.productVersion.trim()!==""&&(la=e.productVersion.trim())):We=null}function Bn(e){if(!(e instanceof ke)||e.status!==503)return!1;const t=typeof e.payload.code=="string"?e.payload.code:"";return t!=="upgrade_required"&&t!=="not_configured"&&t!=="admin_password_missing"?!1:(We={step:t==="upgrade_required"?"upgrade":"initialize",message:e.message,installUrl:typeof e.payload.installUrl=="string"?e.payload.installUrl:"/portal/install/",productVersion:typeof e.payload.productVersion=="string"?e.payload.productVersion:void 0,configuredVersion:typeof e.payload.configuredVersion=="string"?e.payload.configuredVersion:null},We.productVersion&&(la=We.productVersion),!0)}async function zn(){var e,t,a,r;N.event("bootstrap.start"),ml(o=>{en(/timed\s*out|session expired/i.test(o)?o:"Your session timed out. Please sign in again.")}),pl(()=>{Es()});try{const o=await E.installStatus();Vn(o)}catch(o){N.debug("bootstrap: /api/install/status failed",o instanceof Error?o.message:o)}try{const o=await E.ui();Cs(o.ui),typeof o.version=="string"&&o.version.trim()!==""?la=o.version.trim():o.ui&&typeof o.ui.version=="string"&&o.ui.version.trim()!==""&&(la=o.ui.version.trim()),We==null||We.step}catch(o){N.debug("bootstrap: /api/ui failed",o instanceof Error?o.message:o),Bn(o)}if(We&&We.step!=="done"&&We.step!=="locked"){ts(),N.event("bootstrap.installGate",{step:We.step}),p();return}try{const o=await E.me();if(u=o.user,Cs(o.ui),typeof o.version=="string"&&o.version.trim()!==""&&(la=o.version.trim()),N.event("bootstrap.session",{username:(u==null?void 0:u.username)??null}),Es(),Ce())try{await Ns()}catch(m){N.warn("admin.capabilities bootstrap",m instanceof Error?m.message:m)}if(Gs(),ft(y,w),await et(),y==="admin"&&Ce()&&Ut())try{w==="overview"&&((e=ze("overview"))==null?void 0:e.available)!==!1?await as():w==="users"&&((t=ze("users"))==null?void 0:t.available)!==!1?(await oa(),z&&(await Ct(z),await ia(z))):w==="settings"&&((a=ze("settings"))==null?void 0:a.available)!==!1?await ss():w==="database"&&((r=ze("database"))==null?void 0:r.available)!==!1&&await ns()}catch(m){N.warn("admin bootstrap load",m instanceof Error?m.message:m)}}catch(o){o instanceof ke&&o.status===401?(ts(),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",o instanceof Error?o.message:o),b("error",o instanceof Error?o.message:"Failed to load"))}p()}async function et(){N.debug("loadHome");const[e,t,a]=await Promise.all([E.calendars(),E.directory().catch(()=>({users:[]})),E.addressbooks()]);if(oe=e.calendars,aa=t.users,Fe=a.addressbooks,N.event("loadHome",{calendars:oe.length,addressBooks:Fe.length,directory:aa.length}),Ga.length===0)try{Ga=(await E.holidayCountries()).countries}catch{Ga=[]}if(te=te.filter(r=>oe.some(o=>o.id===r)),F!==null&&!oe.some(r=>r.id===F)&&(F=null,sa=[],$e=!1,Be=null),te.length===0){const r=tn();r?(te=[r.id],F=r.id):oe.length>0&&(te=[oe[0].id],F=oe[0].id)}F===null&&te.length>0&&(F=te[0]),F!==null&&$e?await Pa(F):F!==null&&(sa=[]),y==="calendars"&&await tt(),V!==null&&!Fe.some(r=>r.id===V)&&(V=null,Dt=[],pe=null,I=null,ge=!1),Ge!==null&&!Fe.some(r=>r.id===Ge)&&(Ge=null),V===null&&Fe.length>0&&(V=Fe[0].id),V!==null&&y==="contacts"&&await Bt(V),y==="tasks"&&await zt(),y==="notes"&&await Ca(),y==="files"&&await At()}async function Pa(e){sa=(await E.shares(e)).shares}function tn(){const e=oe.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const r=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return r==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function ye(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${r}`}function jn(e,t){const a=new Date(e,t,1),r=new Date(e,t+1,0);return{from:ye(a),to:ye(r)}}function _s(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,r,o]=e.split("-").map(Number);return new Date(a,r-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,r,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(r||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Hn(e){const t=_s(e.start);if(!e.end)return[ye(t)];let a=_s(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ye(t)];const r=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),m=new Date(a.getFullYear(),a.getMonth(),a.getDate());let s=0;for(;o<=m&&s++<370;)r.push(ye(o)),o.setDate(o.getDate()+1);return r.length?r:[ye(t)]}function qs(e,t){const a=e.slice(0,10),r=(t||a).slice(0,10);if(a===r){const _=Ma(a);return{start:_.start,end:_.end}}const[o,m,s]=a.split("-").map(Number),[l,c,f]=r.split("-").map(Number),h=Vt(new Date(o,m-1,s,9,0,0,0)),$=Vt(new Date(l,c-1,f,17,0,0,0));return{start:h,end:$}}function Wn(e,t){const a=ua(e);let r=t?ua(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const m=_s(t);m.setDate(m.getDate()-1),r=ye(m)}}return{start:a,end:r}}async function tt(){const e=te.filter(r=>oe.some(o=>o.id===r));if(e.length===0){na=[];return}const{from:t,to:a}=jn(Ot.y,Ot.m);ks=!0,N.debug("loadMonthEvents",{selectedIds:e,from:t,to:a});try{const o=(await Promise.all(e.map(async m=>(await E.calendarEvents(m,t,a)).events.map(l=>({...l,instanceId:m}))))).flat();o.sort((m,s)=>{const l=m.start||"",c=s.start||"";return l!==c?l<c?-1:1:(m.summary||"").localeCompare(s.summary||"")}),na=o,N.event("monthEvents.loaded",{calendarIds:e,count:na.length,from:t,to:a})}catch(r){na=[],N.warn("loadMonthEvents failed",r instanceof Error?r.message:r)}finally{ks=!1}}function Jn(e){const t=oe.find(a=>a.id===e);return t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6"}function Yn(e){te.includes(e)?(te=te.filter(t=>t!==e),F===e&&(F=te[0]??null)):(te=[...te,e],F=e)}function Kn(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Gn(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Is())} ${t}`}function Qn(){const e=oe.filter(C=>te.includes(C.id)),t=e.length===0?"No calendar selected":e.length===1?e[0].displayname:`${e.length} calendars`,a=Ot.y,r=Ot.m,o=new Date(a,r,1),m=Ls(),s=(o.getDay()-m+7)%7,l=new Date(a,r+1,0).getDate(),c=new Date(a,r,0).getDate(),h=ye(new Date),$=an(),_=new Map;for(const C of na)for(const j of Hn(C)){const M=_.get(j)??[];M.push(C),_.set(j,M)}const A=[],x=Math.ceil((s+l)/7)*7;for(let C=0;C<x;C++){let j,M=!0,G;C<s?(j=c-s+C+1,M=!1,G=new Date(a,r-1,j)):C>=s+l?(j=C-(s+l)+1,M=!1,G=new Date(a,r+1,j)):(j=C-s+1,G=new Date(a,r,j));const Z=ye(G),me=Z===h,Ee=M?_.get(Z)??[]:[],kt=Ia===Z?50:3,pt=Ee.slice(0,kt),Tt=Ee.length-pt.length,je=pt.map(Q=>{var de;const at=Q.instanceId,Le=Gn(Q),st=Jn(at),ba=((de=oe.find(nt=>nt.id===at))==null?void 0:de.displayname)||"",k=ba?`${Le} · ${ba}`:Le;return`<button type="button" class="month-event${Q.allDay?"":" is-timed"}" title="${i(k)}" style="--ev-color:${i(st)}"
            data-action="open-event" data-instance="${at}" data-uri="${i(Q.uri)}" ${d?"disabled":""}>${i(Le)}</button>`}).join(""),Jt=Tt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${i(Z)}" title="Show all events this day" ${d?"disabled":""}>+${Tt} more</button>`:"",Yt=!M&&(j===1||C===s+l)?G.toLocaleString(void 0,{month:"short",day:"numeric"}):String(j),D=F!==null?oe.find(Q=>Q.id===F)??null:null,ce=!!(D&&!D.readOnly&&(D.canShare||D.access==="readwrite"));A.push(`<div class="month-cell${M?"":" is-outside"}${me?" is-today":""}${ce?" is-clickable":""}"${ce?` data-action="new-event-day" data-day="${i(Z)}" role="button" tabindex="0" title="Add event on ${i(Z)}"`:""}>
        <div class="month-daynum${me?" is-today-num":""}">${i(Yt)}</div>
        <div class="month-events">${je}${Jt}</div>
      </div>`)}const v=e.length===0?oe.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":ks?'<p class="muted small month-empty-hint">Loading events…</p>':"",K=e.slice(0,6).map(C=>{const j=C.color&&C.color.length>=7?C.color.slice(0,7):C.color||"#3B82F6";return`<span class="cal-swatch" style="background:${i(j)};margin-top:0" title="${i(C.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${d?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${d?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${d?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i(Kn(a,r))}</h2>
        <span class="month-cal-name muted small" title="${i(t)}">
          ${K}
          ${i(t)}
        </span>
      </div>
      ${v}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${$.map(C=>`<div class="month-dow">${i(C)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${A.join("")}
        </div>
      </div>
    </section>`}function ua(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ye(t)}function Xn(){if(wa.timeFormat==="24h")return!1;if(wa.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Is(){return Xn()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Ls(){var a;if(wa.weekStart==="monday")return 1;if(wa.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const r of e)try{const o=new Intl.Locale(r),m=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,s=m==null?void 0:m.firstDay;if(typeof s=="number")return s===7?0:s}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function an(){const e=Ls(),t=new Date(2024,0,7+e),a=[];for(let r=0;r<7;r++){const o=new Date(t);o.setDate(t.getDate()+r),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function sn(e,t=15){const a=t*60*1e3,r=e.getTime();return r%a===0?new Date(r):new Date(Math.ceil(r/a)*a)}function Vt(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Zn(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const r=e.slice(0,10),[o,m,s]=r.split("-").map(Number);return new Date(o,m-1,s).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Is()})}function Fa(e){if(!e){const a=sn(new Date);return{date:ye(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ye(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Ma(e){const t=new Date,a=ye(t);if(e&&e!==a){const[m,s,l]=e.split("-").map(Number),c=new Date(m,s-1,l,9,0,0,0),f=new Date(m,s-1,l,10,0,0,0);return{start:Vt(c),end:Vt(f)}}const r=sn(t,15),o=new Date(r.getTime()+3600*1e3);return{start:Vt(r),end:Vt(o)}}function er(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function ma(e){const{field:t,name:a,label:r,value:o,dateOnly:m=!1,required:s,disabled:l,allowClear:c=!0}=e,f=(O==null?void 0:O.field)===t,h=Zn(o,m);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${i(t)}">
      <span class="dt-field-label">${i(r)}</span>
      <input type="hidden" name="${i(a)}" value="${i(o)}" ${s?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${i(t)}"
        data-dt-name="${i(a)}" data-dt-date-only="${m?"1":"0"}" data-dt-clear="${c?"1":"0"}"
        ${l?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${i(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!l?tr(t,o,m,c):""}
    </div>`}function Os(e){var t;return e==="start"?String((S==null?void 0:S.start)||""):e==="end"?String((S==null?void 0:S.end)||""):e==="until"?((t=S==null?void 0:S.repeat)==null?void 0:t.until)||ua(S==null?void 0:S.start)||ye(new Date):e==="due"?Aa(Y==null?void 0:Y.due):e==="dtstart"?Aa(ie==null?void 0:ie.dtstart):e==="bulk-due"?Qa:e==="birthday"?String((I==null?void 0:I.birthday)||""):""}function mt(e,t){if(e==="start"&&S){S={...S,start:t||""};return}if(e==="end"&&S){S={...S,end:t};return}if(e==="until"&&S){S={...S,repeat:{...S.repeat??ds(),until:t,endMode:"until"}};return}if(e==="due"&&Y){if(t===null||t==="")Y={...Y,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))Y={...Y,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));Y={...Y,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&ie){if(t===null||t==="")ie={...ie,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))ie={...ie,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));ie={...ie,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&I){I={...I,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Qa=t||"")}function tr(e,t,a,r){const o=Fa(t),m=(O==null?void 0:O.viewY)??Number(o.date.slice(0,4)),s=(O==null?void 0:O.viewM)??Number(o.date.slice(5,7))-1,l=Ls(),c=an(),h=(new Date(m,s,1).getDay()-l+7)%7,$=new Date(m,s+1,0).getDate(),_=new Date(m,s,0).getDate(),A=o.date,x=o.hm,v=new Date(m,s,1).toLocaleString(void 0,{month:"long",year:"numeric"}),K=[],C=Math.ceil((h+$)/7)*7;for(let M=0;M<C;M++){let G,Z,me=!1;M<h?(G=_-h+M+1,Z=new Date(m,s-1,G),me=!0):M>=h+$?(G=M-(h+$)+1,Z=new Date(m,s+1,G),me=!0):(G=M-h+1,Z=new Date(m,s,G));const Ee=ye(Z),kt=Ee===A,pt=Ee===ye(new Date);K.push(`<button type="button" class="dt-day${me?" is-outside":""}${kt?" is-selected":""}${pt?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${i(Ee)}">${G}</button>`)}const j=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${er().map(M=>{const G=(()=>{const[Z,me]=M.split(":").map(Number);return new Date(2e3,0,1,Z,me).toLocaleTimeString(void 0,Is())})();return`<button type="button" class="dt-time${M===x?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${M}" role="option" aria-selected="${M===x}">${i(G)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${i(v)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${c.map(M=>`<span class="dt-dow">${i(M)}</span>`).join("")}</div>
          <div class="dt-days">${K.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${i(e)}" ${r?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${j}
      </div>
    </div>`}function ar(){n.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const r=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const m=a.offsetWidth||320,s=a.offsetHeight||300;let l=r.bottom+6;l+s>window.innerHeight-o&&(l=Math.max(o,r.top-s-6));let c=r.left;c+m>window.innerWidth-o&&(c=Math.max(o,window.innerWidth-m-o)),c<o&&(c=o),a.style.top=`${Math.round(l)}px`,a.style.left=`${Math.round(c)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function ds(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function sr(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function nr(){if(!vt||!S)return"";const e=S,t=e.repeat??ds(),a=(t.freq||"").toUpperCase(),r=oe.filter(A=>A.canShare||A.access==="readwrite"),o=oe.filter(A=>A.id===e.instanceId?!0:A.readOnly?!1:A.canShare||A.access==="readwrite").map(A=>`<option value="${A.id}" ${A.id===e.instanceId?"selected":""}>${i(A.displayname)}</option>`).join(""),m=e.readOnly||!e.canWrite;let s,l;if(e.allDay)s=ua(e.start),l=ua(e.end);else{const A=e.start||"",x=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(A)){const v=qs(A,x||null);s=v.start,l=v.end||""}else s=Aa(e.start),l=Aa(e.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(A=>A.toUpperCase())),h=sr(t),$=!!a&&h==="until",_=t.until||(h==="until"?ua(e.start)||ye(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${ot?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Ht()}
          ${!ot&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${m?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${m||r.length===0?"disabled":""}>
                ${o||`<option value="${e.instanceId}">${i(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${i(e.summary)}" ${m?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${i(e.location)}" ${m?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${m?"readonly":""}>${i(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${m?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${ma({field:"start",name:"start",label:"Start",value:s,dateOnly:e.allDay,required:!0,disabled:m,allowClear:!1})}
              ${ma({field:"end",name:"end",label:"End",value:l,dateOnly:e.allDay,disabled:m||$,allowClear:!$})}
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${i(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${c.map(A=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${A.code}" ${f.has(A.code)?"checked":""} />
                              ${A.label}
                            </label>`).join("")}
                    </div>`:""}
              ${a?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${h==="never"?"selected":""}>Never</option>
                          <option value="until" ${h==="until"?"selected":""}>On date</option>
                          <option value="count" ${h==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${h==="until"?ma({field:"until",name:"repeatUntil",label:"Until",value:_,dateOnly:!0,disabled:m,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${i(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${m?"":`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ot?"Create event":"Save event"}</button>
                     ${ot?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${d?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function rr(e,t){const a=oe.find(r=>r.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:ds(),readOnly:!1,canWrite:!0}}async function Bt(e){Dt=(await E.contacts(e,ra)).contacts,pe!==null&&!Dt.some(a=>a.uri===pe)&&(pe=null,ge||(I=null,_e=null,Je=null,Qe=!1))}async function zt(){const e=await E.tasks({q:os,sort:Rt,order:Et});qe=e.tasks,Ft=e.calendars;const t=new Set(qe.map(a=>be(a.instanceId,a.uri)));ve=ve.filter(a=>t.has(a)),Me!==null&&!qe.some(a=>`${a.instanceId}|${a.uri}`===Me)&&(Me=null,ne||(Y=null))}async function Ca(){const e=await E.notes({q:is,sort:Da,order:da});ka=e.notes,Mt=e.calendars,dt!==null&&!ka.some(t=>`${t.instanceId}|${t.uri}`===dt)&&(dt=null,Ae||(ie=null))}function be(e,t){return`${e}|${t}`}function nn(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Aa(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=r=>String(r).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function jt(e,t,a,r,o,m=""){const s=a===t,l=s?r==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${s?" is-sorted":""}${m?" "+m:""}`}" data-action="sort-${o}" data-sort="${i(t)}" role="columnheader" tabindex="0">${i(e)}${l}</th>`}async function lr(e){if(V===null)return;const t=await E.getContact(V,e);pe=e,ge=!1;const a=t.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??rn(),birthday:a.birthday??null},_e=a.photoDataUri??(a.hasPhoto&&V!==null?`${E.contactPhotoUrl(V,e)}?t=${Date.now()}`:null),Je=null,Qe=!1,Te=!0}function or(){ge=!0,pe=null,Te=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},_e=null,Je=null,Qe=!1}function rn(){return{street:"",city:"",region:"",postal:"",country:""}}function ir(e){return new Promise((t,a)=>{const r=new FileReader;r.onload=()=>{const o=String(r.result??""),m=o.indexOf(",");t(m>=0?o.slice(m+1):o)},r.onerror=()=>a(new Error("Failed to read photo file")),r.readAsDataURL(e)})}function ln(e,t={}){const a=!!u&&y==="admin"&&Ce()&&Ut(),m=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${i(a?"Administration Portal":"User Portal")}</span></span>`,s=u?i(u.displayname||u.username):"",l=Ut()?`<button type="button" class="user-menu-item${y==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",f=u?`<div class="user-menu${Pe?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${Pe?"true":"false"}"
              title="${s}">
              <span class="user-menu-name">${s}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${Pe?"":"hidden"}>
              ${a?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:""}
              ${l}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",h=u?`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
          <div class="topnav-right">
            ${f}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${m}</a>
        </nav>`,_=!($e||Ve||Be!==null||Ge!==null||vt||Te||it)?Ht():"",A=t.tabs&&t.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${t.tabs}
        </div>
      </div>`:"",x=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${i(la)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i($l)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${h}
      ${A}
    </div>
      <main class="container">
        ${_}
        ${e}
      </main>
      ${x}
      ${Dl()}
      ${dr()}
      ${ur()}`}function Ht(){return g?xt(g.type,g.message,{dismissible:!0}):""}function cs(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function wt(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),r=t%60;return a>0?`${a}m ${r}s`:`${r}s`}function St(){Xa!==null&&(clearInterval(Xa),Xa=null)}function on(){St(),Xa=setInterval(()=>{if(!W||W.phase==="done"||W.phase==="error"){St();return}W={...W,elapsedSec:Math.floor((Date.now()-W.startedAt)/1e3)},W.phase==="processing"&&un(W)},1e3)}function Wt(e,t={}){W&&(W={...W,phase:e,elapsedSec:Math.floor((Date.now()-W.startedAt)/1e3),...t},p())}function dn(){St(),W=null,p()}function cn(e){!W||W.phase==="done"||W.phase==="error"||(W={...W,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-W.startedAt)/1e3)},un(W))}function un(e){const t=n.querySelector("[data-import-status-line]"),a=n.querySelector(".import-progress-bar"),r=n.querySelector(".import-progress-track"),o=n.querySelector("[data-import-counts]"),m=e.kind==="calendar"?"items":"contacts";let s;if(e.phase==="processing"&&e.processTotal>0)s=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${m} (${e.processPercent??0}%) · ${wt(e.elapsedSec)}`;else if(e.phase==="processing")s=`Importing on server… ${wt(e.elapsedSec)}`;else return;t&&(t.textContent=s),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),r&&e.processPercent!==null&&(r.setAttribute("aria-valuenow",String(e.processPercent)),r.removeAttribute("aria-valuetext"))}function dr(){if(!W)return"";const e=W,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",r=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const l=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return l.map((h,$)=>{let _="pending";return e.phase==="done"||$<f?_="done":$===f&&(_=(e.phase==="error","active")),`<li class="import-step import-step-${_}"><span class="import-step-icon" aria-hidden="true">${_==="done"?"✓":_==="active"?"●":"○"}</span> ${i(h.label)}</li>`}).join("")})();let m="";if(t){let l=null;e.phase==="reading"&&e.readPercent!==null?l=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(l=Math.min(100,Math.max(0,e.processPercent)));const c=l===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=l!==null?` style="width:${l}%"`:"",h=e.kind==="calendar"?"items":"contacts";let $;e.phase==="reading"?$=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?$="Uploading to server…":e.processTotal>0?$=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${h} (${e.processPercent??0}%) · ${wt(e.elapsedSec)}`:$=`Importing on server… ${wt(e.elapsedSec)}`;const _=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';m=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${i(a)}</strong> from
          <span class="mono">${i(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${i(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${l!==null?`aria-valuenow="${l}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${c}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${i($)}</p>
        ${_}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?m=`
        ${xt("success",`Success. ${e.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · Took ${i(wt(e.elapsedSec))}
        </p>`:m=`
        ${xt("error",`Failed. ${e.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · After ${i(wt(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const s=t?'<p class="muted small" style="margin:0">Please wait…</p>':Bs([{label:"Close",action:"close-import-progress",variant:"primary"}]);return we({title:r,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:t,lockBackdrop:t,body:m,footer:s})}function Ea(){Za!==null&&(clearInterval(Za),Za=null)}function cr(){Ea(),Za=setInterval(()=>{if(!J||J.phase==="done"||J.phase==="error"){Ea();return}J={...J,elapsedSec:Math.floor((Date.now()-J.startedAt)/1e3)},Ra(J)},1e3)}function mn(){Ea(),J=null,p()}function pn(e){return e.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*e.bytesSent/e.bytesTotal))):e.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*e.completedFiles/e.totalFiles))):null}function Ra(e){if(!n.querySelector("[data-files-upload-progress]"))return;const t=n.querySelector(".files-upload-progress-bar"),a=n.querySelector(".files-upload-progress-track"),r=n.querySelector("[data-files-upload-status]"),o=n.querySelector("[data-files-upload-current]"),m=pn(e),s=e.phase==="uploading"?`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${m!==null?` (${m}%)`:""} · ${wt(e.elapsedSec)}`:(r==null?void 0:r.textContent)||"";r&&e.phase==="uploading"&&(r.textContent=s),o&&e.phase==="uploading"&&(o.textContent=e.currentName||"",o.title=e.currentName||""),t&&m!==null&&(t.classList.remove("is-indeterminate"),t.style.width=`${m}%`),a&&m!==null&&(a.setAttribute("aria-valuenow",String(m)),a.removeAttribute("aria-valuetext"))}function ur(){if(!J)return"";const e=J,t=e.phase==="uploading",a=e.phase==="done"?"Upload finished":e.phase==="error"?"Upload failed":e.mode==="folder"?"Uploading folder…":"Uploading files…",r=pn(e),o=r===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",m=r!==null?` style="width:${r}%"`:"",s=e.mode==="folder"?"folder":"files";let l="";if(t){const f=`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${wt(e.elapsedSec)}`,h=e.bytesTotal>0?`${cs(e.bytesSent)} / ${cs(e.bytesTotal)}`:"";l=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Uploading <strong>${i(s)}</strong>
          ${h?` · <span class="muted">${i(h)}</span>`:""}
        </p>
        <div class="import-progress-track files-upload-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Upload progress">
          <div class="${o}"${m}></div>
        </div>
        <p class="import-status-line" data-files-upload-status>${i(f)}</p>
        <p class="muted small mono files-upload-current" data-files-upload-current title="${i(e.currentName)}">${i(e.currentName)}</p>
        <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(e.phase==="done")l=`
        ${xt("success",e.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">Took ${i(wt(e.elapsedSec))}</p>`;else{const f=e.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${e.errorSamples.slice(0,8).map(h=>`<li>${i(h)}</li>`).join("")}${e.errorSamples.length>8?`<li>…and ${e.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
        ${xt("error",e.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
        ${f}
        <p class="muted small" style="margin:0.75rem 0 0">After ${i(wt(e.elapsedSec))}</p>`}const c=t?'<p class="muted small" style="margin:0">Please wait…</p>':Bs([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return we({title:a,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:t,lockBackdrop:t,body:l,footer:c})}function fn(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}async function mr(e,t,a){const r=t.replace(/\\/g,"/").split("/").map(m=>m.trim()).filter(Boolean);let o=e;for(const m of r){const s=fn(o,m);if(a.has(s)){o=s;continue}try{await E.filesMkdir(o,m),N.event("files.mkdir",{path:o,name:m,via:"upload-folder"})}catch(l){if(!(l instanceof ke&&l.status===409))throw l}a.add(s),o=s}}function bn(e,t){return new Promise((a,r)=>{const o=new FileReader;o.onprogress=m=>{m.lengthComputable&&m.total>0?t(Math.min(100,Math.round(m.loaded/m.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>r(o.error??new Error("Failed to read file")),o.readAsText(e)})}function gn(){const e=We,t=e&&(e.step==="upgrade"||e.step==="initialize"||e.step==="permissions"||e.step==="database"),a=(e==null?void 0:e.installUrl)||"/portal/install/";let r="";if(t&&e){const m=e.step==="upgrade"?"Server upgrade required":"Setup incomplete",s=e.step==="upgrade"&&(e.configuredVersion||e.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${i(String(e.configuredVersion||"—"))}</span>
              → product <span class="mono">${i(String(e.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${i(m)}.</strong>
            ${i(e.message||"Complete the installer before signing in.")}
            ${s}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${i(a)}">Open installer</a>
        </p>`}const o=d||!!t;n.innerHTML=ln(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
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
      </div>`,{auth:!0})}function pr(){if(!u){gn();return}const e=oe.filter(k=>k.canShare),t=oe.filter(k=>!k.canShare),a=oe.find(k=>k.id===F)??null,r=e.map(k=>{const de=te.includes(k.id),nt=de?" is-selected":"",Ha=k.id===F?" is-primary":"",Ps=k.color?`<span class="cal-swatch" style="background:${i(k.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Fs=Rs(k.access)+(k.readOnly?'<span class="badge">read-only</span>':"")+(k.holidaysCountry?`<span class="badge badge-admin">holidays ${i(k.holidaysCountry)}</span>`:"");return`<div class="cal-row${nt}${Ha}" data-action="select-cal" data-id="${k.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${k.id}" ${de?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ps}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(k.displayname)}</span>
            <span class="cal-row-badges">${Fs}</span>
            <span class="muted small mono cal-row-uri">${i(k.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${k.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${k.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${k.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map(k=>{const de=te.includes(k.id),nt=de?" is-selected":"",Ha=k.id===F?" is-primary":"",Ps=k.color?`<span class="cal-swatch" style="background:${i(k.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Fs=k.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${nt}${Ha}" data-action="select-cal" data-id="${k.id}" role="button" tabindex="0" title="${i(Fs)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${k.id}" ${de?"checked":""} ${d?"disabled":""} />
          </label>
          ${Ps}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(k.displayname)}</span>
            <span class="cal-row-badges">${Rs(k.access)}</span>
            <span class="muted small">${k.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${k.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
          </span>
        </div>`}).join(""),m=aa.map(k=>`<option value="${i(k.username)}">${i(k.displayname)} (${i(k.username)})</option>`).join(""),s=sa.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':sa.map(k=>`<tr>
                <td>
                  <strong>${i(k.displayname||k.username||k.href)}</strong>
                  <div class="muted small mono">${i(k.username||k.href)}</div>
                </td>
                <td>${Rs(k.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(k.href)}" ${d?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),l=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",c=!!(a&&a.readOnly),f=$e&&a&&a.canShare?we({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Ht()}
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
                        <input type="color" name="color_picker" value="${i(l)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${i(a.color||l)}"
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
                  ${Se(`Share “${a.displayname}”`,"share")}
                  ${c?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${aa.length===0?"disabled":""}>
                        <option value="">${aa.length?"Select user…":"No other users"}</option>
                        ${m}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${c?"disabled":""}>
                        <option value="read" selected>Read only</option>
                        ${c?"":'<option value="readwrite">Full access</option>'}
                      </select>
                      ${c?'<input type="hidden" name="access" value="read" />':""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${d||aa.length===0?"disabled":""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${s}</tbody>
                    </table>
                  </div>
                </section>
                <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${Se("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${d?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${d||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${d||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",h=Be!==null?oe.find(k=>k.id===Be&&k.canShare)??null:null,$=h?we({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Ht()}
              <p>You are about to permanently delete <strong>${i(h.displayname)}</strong>
                <span class="muted small mono">(${i(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${fs({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${h.id}"`}]}):"",_=Ve?we({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Ht()}
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
                    ${Ga.map(k=>`<option value="${i(k.code)}">${i(k.name)} (${i(k.code)})</option>`).join("")}
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
              </form>`}):"",A=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${Se("Owned","owned")}
            </div>
            <p class="muted small" style="margin:0 0 0.65rem">
              Check one or more calendars to view events.
              Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${r||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${Se("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${d?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Qn()}
      </div>
      ${_}
      ${f}
      ${$}
      ${nr()}`,x=Fe.map(k=>`<div class="cal-row${k.id===V?" is-selected":""}" data-action="select-ab" data-id="${k.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(k.displayname)}</span>
            <span class="muted small">${k.cardCount} contact${k.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(k.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-ab" data-id="${k.id}" ${d?"disabled":""} title="Export as .vcf">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${k.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${k.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),v=Fe.find(k=>k.id===V)??null,K=Dt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${ra?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Dt.map(k=>{const de=!ge&&k.uri===pe?" is-selected":"",nt=i((k.displayname||"?").slice(0,1).toUpperCase()),Ha=k.hasPhoto&&V!==null?`<img class="contact-avatar" src="${i(E.contactPhotoUrl(V,k.uri))}" alt="" loading="lazy" data-avatar-fallback="${nt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${nt}</span>`;return`<tr class="contact-table-row${de}" data-action="select-contact" data-uri="${i(k.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ha}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(k.displayname)}</span>
                      ${k.org?`<span class="muted small contact-name-secondary">${i(k.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(k.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(k.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(k.org||"—")}</span></td>
              </tr>`}).join(""),C=I,j=Array.isArray(C==null?void 0:C.emails)&&C.emails.length>0?C.emails:[""],M=Array.isArray(C==null?void 0:C.phones)&&C.phones.length>0?C.phones:[{type:"cell",value:""}],G=(C==null?void 0:C.address)??rn(),Z=j.map((k,de)=>`<div class="multi-row" data-multi="email" data-idx="${de}">
          <input type="email" name="email_${de}" value="${i(k??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${de}" ${j.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),me=M.map((k,de)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${de}">
          <select name="phone_type_${de}" aria-label="Phone type">
            ${["cell","work","home","other"].map(nt=>`<option value="${nt}" ${((k==null?void 0:k.type)??"other")===nt?"selected":""}>${nt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${de}" value="${i((k==null?void 0:k.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${de}" ${M.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Ee=Array.isArray(C==null?void 0:C.custom)?C.custom:[],kt=Ee.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':Ee.map((k,de)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${de}">
                <input type="text" name="custom_label_${de}" value="${i(k.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${de}" value="${i(k.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${de}" title="Remove">×</button>
              </div>`).join(""),pt=Te&&C&&v?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${ge?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Ht()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${_e?`<img src="${i(_e)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((C.fullname||C.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        ${_e?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${d?"disabled":""} hidden />
                      </label>
                      ${_e||C.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${d?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${i(C.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${i(C.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${i(C.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${i(C.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${i(C.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${Z}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${j.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${me}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${M.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${i(G.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${i(G.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${i(G.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${i(G.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${i(G.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${i(C.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${ma({field:"birthday",name:"birthday",label:"Birthday",value:C.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${kt}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${Ee.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${i(C.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ge?"Create contact":"Save contact"}</button>
                    ${!ge&&C.uri?`<button type="button" class="btn" data-action="export-contact" ${d?"disabled":""}>Export .vcf</button>`:""}
                    ${ge?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${d?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${d?"disabled":""}>Cancel</button>
                    ${!ge&&C.uri?`<span class="muted small mono">${i(C.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",Tt=it&&v?we({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Ht()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${i(v.uri)} · ${v.cardCount} contact${v.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${i(v.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${i(v.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(v.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${Se("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${d?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${d?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",je=Ge!==null?Fe.find(k=>k.id===Ge)??null:null,Jt=je?we({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Ht()}
              <p>You are about to permanently delete <strong>${i(je.displayname)}</strong>
                <span class="muted small mono">(${i(je.uri)})</span>.</p>
              <p class="muted small">${(je.cardCount??0)>0?`All ${je.cardCount} contact${je.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${fs({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${je.id}"`}]}):"",Yt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${Se("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${x||'<p class="muted">No address books yet. Create one below.</p>'}
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
          ${v?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${Se("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${i(ra)}" aria-label="Search contacts" ${d?"disabled":""} />
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
                        ${K}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Jt}
      ${Tt}
      ${pt}`,D=y==="calendars"?"my-calendars":y==="contacts"?"my-contacts":y==="tasks"?"tasks":y==="notes"?"notes":y==="files"?"files":"administration",ce=Ir(),Q=Lr(),at=gr(),Le=Tr(),st=y==="calendars"?A:y==="contacts"?Yt:y==="tasks"?ce:y==="notes"?Q:y==="files"?at:Le,ba=y==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${hr()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${w==="overview"?"admin-overview":w==="users"?"admin-users":w==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${y==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${y==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${y==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${y==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${y==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${y==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${y==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${y==="notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${y==="files"?" is-active":""}"
            data-action="tab" data-tab="files" aria-selected="${y==="files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${D}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;n.innerHTML=ln(st,{tabs:ba}),document.body.classList.toggle("cal-modal-open",$e||Ve||Be!==null||Ge!==null||vt||Te||it||W!==null||J!==null||Re!==null||xe!==null||he!==null||ut||He||Ue||ht!==null||ha||ya||Ye!==null||lt!==null||De!==null),document.body.classList.toggle("layout-contacts",y==="contacts"),document.body.classList.toggle("layout-calendars",y==="calendars"),document.body.classList.toggle("layout-tasks",y==="tasks"||y==="notes"),document.body.classList.toggle("layout-files",y==="files"),document.body.classList.toggle("layout-admin",y==="admin")}function fr(e){const t=e?e.split("/").filter(Boolean):[];let a="";const r=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${d?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const m=a;r.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),r.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${i(m)}" ${d?"disabled":""}>${i(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${r.join("")}</nav>`}function Na(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function br(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function gr(){const e=xs;if(!e)return`<div class="card"><p class="muted">${ca||d?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${Se("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${Se("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${i(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${i(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${Na(e.usedBytes)} used · ${Na(e.availableBytes)} free of ${Na(e.quotaBytes)}`:`${Na(e.usedBytes)} used · ${Na(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,r=fe.length,o=ue.length>0&&ue.every(v=>fe.includes(v.path)),m=r>0,s=ue.filter(v=>v.type==="dir").length,l=ue.length-s,c=r>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${r} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${d?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${d?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${d?"disabled":""}>Delete</button>
            </div>
          </div>`:"",f=(()=>{if(ca&&ue.length===0)return"Loading…";if(ue.length===0)return"0 items";const v=[];s>0&&v.push(`${s} folder${s===1?"":"s"}`),l>0&&v.push(`${l} file${l===1?"":"s"}`);const K=`${ue.length} item${ue.length===1?"":"s"}`;return v.length===2?`${K} · ${v.join(", ")}`:v[0]??K})(),h=ue.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':ue.map(v=>{const K=fe.includes(v.path),C=v.type==="dir"?"📁":"📄",j=v.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${i(v.path)}" ${d?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${C}</span>${i(v.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${C}</span>${i(v.name)}</span>`,M=v.type==="dir"?"—":Na(v.size);return`<tr class="files-row${K?" is-checked":""}" data-path="${i(v.path)}" data-type="${v.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${i(v.path)}"
                    ${K?"checked":""} ${d?"disabled":""}
                    aria-label="Select ${i(v.name)}" />
                </td>
                <td class="files-col-name">${j}</td>
                <td class="files-col-size mono">${M}</td>
                <td class="files-col-mtime hide-sm">${i(br(v.mtime))}</td>
                <td class="files-col-actions">
                  ${v.type==="file"?`<a class="btn btn-ghost btn-small" href="${i(E.filesDownloadUrl(v.path))}" download="${i(v.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${i(v.path)}" ${d?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${i(v.path)}" ${d?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${i(v.path)}" data-name="${i(v.name)}" ${d?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${i(v.path)}" data-name="${i(v.name)}" ${d?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),$=Re!==null?(()=>{const v=ue.find(C=>C.path===Re),K=(v==null?void 0:v.name)??"";return we({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${i(Re)}" />
                    <label>New name
                      <input type="text" name="newName" value="${i(K)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:d}]})})():"",_=xe!==null&&xe.length>0?(()=>{const v=xe,K=v.length>1,C=ue.find(G=>G.path===v[0]),j=K?`Delete ${v.length} items`:`Delete ${(C==null?void 0:C.type)==="dir"?"folder":"file"}`,M=K?`<p style="margin:0 0 0.75rem">Delete <strong>${v.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${v.slice(0,12).map(G=>{const Z=ue.find(me=>me.path===G);return`<li><span class="mono">${i((Z==null?void 0:Z.name)??G)}</span></li>`}).join("")}
                   ${v.length>12?`<li>…and ${v.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${i((C==null?void 0:C.name)??v[0])}</strong>?${(C==null?void 0:C.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return we({id:"files-delete-modal",title:j,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:M,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:d}]})})():"",A=he!==null&&he.paths.length>0?(()=>{const v=he.op,K=he.paths,C=K.length>1,j=ue.find(Ee=>Ee.path===K[0]),M=(j==null?void 0:j.name)??Va(K[0]),G=C?`${v==="copy"?"Copy":"Move"} ${K.length} items`:`${v==="copy"?"Copy":"Move"} ${(j==null?void 0:j.type)==="dir"?"folder":"file"}`,Z=Nt===""?"Home":Nt,me=rs(Nt,K);return we({id:"files-transfer-modal",title:G,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${C?`<p class="muted small" style="margin:0 0 0.75rem">${K.length} items will be ${v==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${i(M)}</span></p>`}
                    <input type="hidden" name="toPath" value="${i(Nt)}" />
                    <div class="files-transfer-dest">
                      <div class="files-transfer-dest-head">
                        <span class="files-transfer-dest-label">Destination folder</span>
                        <span class="muted small mono files-transfer-dest-value" title="${i(Z)}">${i(Z)}</span>
                      </div>
                      ${Rn()}
                      <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                        Click a folder to select it. Use ▸ to expand. Home is the root of your file storage.
                      </p>
                    </div>
                    ${C?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${i(M)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${v==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:v==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:d||me}]})})():"",x=ut?we({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${i(Ie===""?"Home":Ie)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:d}]}):"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${Se("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${i(t)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${fr(Ie)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${d||ca?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${d?"disabled":""}>New folder</button>
            <label class="btn btn-ghost btn-small files-upload-btn" ${d?"aria-disabled=true":""} title="Upload one or more files into this folder">
              Upload files
              <input type="file" data-action="files-upload" ${d?"disabled":""} multiple hidden />
            </label>
            <label class="btn btn-primary btn-small files-upload-btn" ${d?"aria-disabled=true":""} title="Upload a folder (creates the folder and all nested files)">
              Upload folder
              <input type="file" data-action="files-upload-folder" ${d?"disabled":""}
                multiple webkitdirectory directory hidden />
            </label>
          </div>
        </div>
        ${c}
        <div class="table-wrap files-table-wrap">
          <table class="files-table">
            <thead>
              <tr>
                <th class="files-col-check">
                  <input type="checkbox" data-action="files-select-all"
                    ${o?"checked":""}
                    ${m&&!o?"data-indeterminate=1":""}
                    ${d||ue.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ca&&ue.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':h}
            </tbody>
          </table>
        </div>
        <div class="files-status-bar muted small" role="status" aria-live="polite">
          ${r>0?`${r} of ${ue.length} selected`:i(f)}
        </div>
      </section>
      ${$}
      ${_}
      ${A}
      ${x}
    </div>`}function Va(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function hr(){const e=["overview","settings","users","database"],t={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=B==null?void 0:B.pages,r=new Map;if(a)for(const o of a)vs(o.id)&&r.set(o.id,o);return e.map(o=>{const m=r.get(o),s=(m==null?void 0:m.label)||t[o],l=(m==null?void 0:m.status)??(o==="overview"?"read-only":"full"),c=(m==null?void 0:m.available)===!1;return`<button type="button" role="tab" class="tab-btn${w===o?" is-active":""}${c?" is-gated":""}"
            data-action="admin-page" data-admin-page="${o}"
            aria-selected="${w===o}"
            title="${i(s)}${c?" — "+Sa(l):""}">
            ${i(s)}
          </button>`}).join("")}function us(e){const t=ze(e),a=(t==null?void 0:t.status)??"coming-soon",r=(t==null?void 0:t.label)??e,o=(t==null?void 0:t.summary)||"This area is not available in portal Administration yet.",m=Sa(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${Oa(a)}">${i(m)}</span>
        <h2 class="admin-coming-soon-title">${i(r)}</h2>
      </div>
      <p class="muted">${i(o)}</p>
    </section>`}function pa(e,t){return`<span class="badge ${e?"badge-ok":"badge-off"}">${i(t)}: ${e?"On":"Off"}</span>`}function fa(e){return`<span class="badge ${e?"badge-ok":"badge-off"}">${e?"On":"Off"}</span>`}function Ba(e,t,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${i(String(t))}</div>
      <div class="admin-stat-label">${i(e)}</div>
      ${a?`<div class="admin-stat-hint muted small">${i(a)}</div>`:""}
    </div>`}function yr(){const e=ze("overview");if(e&&e.available===!1)return us("overview");const t=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${i((u==null?void 0:u.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",r="";if(U&&!L)r='<section class="card"><p class="muted">Loading overview…</p></section>';else if(H&&!L)r=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${i(H)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d?"disabled":""}>Retry</button>
      </section>`;else if(L){const o=L,m=o.services,s=o.links??{},l=e?`<span class="badge ${Oa(e.status)}">${i(Sa(e.status))}</span>`:"",c=o.version?i(o.version):"—",f=o.git?i(o.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${Se("About this system","admin-overview")}
            <div class="section-actions">
              ${l}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d||U?"disabled":""}>Refresh</button>
            </div>
          </div>
          <div class="admin-about-grid">
            <div>
              <h3 class="admin-subsection-title">Version</h3>
              <p>
                AngaraDAV <span class="badge badge-admin">v${c}</span>
                ${f?`<span class="mono muted small"> (${f})</span>`:""}
              </p>
              <p class="muted small admin-link-row">
                ${s.releases?`<a href="${i(s.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
                ${s.docs?`${s.releases?'<span class="footer-sep">·</span>':""}<a href="${i(s.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
              </p>
            </div>
            <div>
              <h3 class="admin-subsection-title">Services</h3>
              <div class="admin-service-table-wrap">
                <table class="admin-kv-table">
                  <tbody>
                    <tr><td>Administration</td><td>${fa(m.administration!==!1&&m.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${fa(!!m.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${fa(!!m.carddav)}</td></tr>
                    <tr><td>Files</td><td>${fa(!!m.files)}</td></tr>
                    <tr><td>Tasks</td><td>${fa(!!m.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${fa(!!m.notes)}</td></tr>
                    <tr><td>Push</td><td>${fa(!!m.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${t}
        </section>`;const h=o.nbusers??o.users,$=o.nbcalendars??o.calendars,_=o.nbevents??o.events,A=o.nbbooks??o.addressBooks,x=o.nbcontacts??o.contacts;r=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${Ba("Registered users",h,"Users")}
            ${Ba("Calendars",$,"CalDAV")}
            ${Ba("Events",_,"CalDAV")}
            ${Ba("Address books",A,"CardDAV")}
            ${Ba("Contacts",x,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${pa(m.administration!==!1&&m.webAdmin!==!1,"Administration")}
            ${pa(!!m.caldav,"CalDAV")}
            ${pa(!!m.carddav,"CardDAV")}
            ${pa(!!m.files,"Files")}
            ${pa(!!m.tasks,"Tasks")}
            ${pa(!!m.notes,"Notes")}
            ${pa(!!m.push,"Push")}
          </div>
        </section>`}else r=`<section class="card">
        ${Se("System snapshot","admin-overview")}
        ${t}
      </section>`;return`${a}
      ${r}`}function $r(){const e=Ne.trim().toLowerCase();return e?ee.filter(t=>t.username.toLowerCase().includes(e)||(t.displayname||"").toLowerCase().includes(e)||(t.email||"").toLowerCase().includes(e)):ee}function vr(){return He?we({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:d},{label:"Create user",type:"submit",variant:"primary",disabled:d}]}):""}function wr(){if(!Ue||!R)return"";const e=R;return we({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:d},{label:"Save changes",type:"submit",variant:"primary",disabled:d}]})}function Sr(){if(!ht)return"";const e=ht,t=R&&R.username.toLowerCase()===e.toLowerCase()?R:ee.find(r=>r.username.toLowerCase()===e.toLowerCase())??null,a=t?`${t.displayname||t.username} (${t.username})`:e;return we({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${i(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${fs({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:qt,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:d},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:d||!qt,attrs:`data-username="${i(e)}"`}]})}function kr(){if(!z)return"";if(se&&!R)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${i(z)}</span>…</p>
      </section>`;if(Oe&&!R)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${i(Oe)}</p>
      </section>`;if(!R)return"";const e=R,t=xa&&It.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':It.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':It.map(c=>`<tr>
          <td class="mono">${i(c.uri)}</td>
          <td>${i(c.displayname)}</td>
          <td class="hide-sm">${i(String(c.eventCount))}${c.todos?' <span class="badge badge-admin">tasks</span>':""}${c.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${i(c.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${i(c.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=xa&&Lt.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':Lt.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':Lt.map(c=>`<tr>
          <td class="mono">${i(c.uri)}</td>
          <td>${i(c.displayname)}</td>
          <td class="hide-sm">${i(String(c.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${c.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${c.id}" data-label="${i(c.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),r=Qt!==null?It.find(c=>c.instanceId===Qt)??null:null,o=Xt!==null?Lt.find(c=>c.id===Xt)??null:null,m=Ye==="create"||Ye==="edit"&&r?we({title:Ye==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${r?r.instanceId:""}" />
            ${Ye==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${d?"disabled":""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`:`<p class="muted small">URI <span class="mono">${i(r.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((r==null?void 0:r.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${i((r==null?void 0:r.description)??"")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${i((r==null?void 0:r.calendarcolor)??"")}" ${d?"disabled":""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${r!=null&&r.todos||Ye==="create"?"checked":""} ${d?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${r!=null&&r.notes?"checked":""} ${d?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",s=lt==="create"||lt==="edit"&&o?we({title:lt==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${o?o.id:""}" />
            ${lt==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${d?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${i(o.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((o==null?void 0:o.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${i((o==null?void 0:o.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",l=De?we({title:`Delete ${De.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${i(De.label)}</strong> for <span class="mono">${i(e.username)}</span>?</p>
          ${De.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${De.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:d}]}):"";return`<section class="card admin-user-detail">
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
    ${m}${s}${l}`}function Dr(){const e=ze("users");if(e&&e.available===!1)return us("users");const t=$r(),a=le&&ee.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':t.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${X?i(X):Ne.trim()?"No users match this filter.":"No users found."}</td></tr>`:t.map(r=>`<tr class="contact-table-row${z&&z.toLowerCase()===r.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${i(r.username)}" tabindex="0" role="button">
                  <td class="mono">${i(r.username)}</td>
                  <td class="hide-sm">${i(r.displayname||"—")}</td>
                  <td class="hide-sm">${i(r.email||"—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${i(r.username)}" ${d?"disabled":""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${i(r.username)}" ${d?"disabled":""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${i(r.username)}" ${d?"disabled":""}>Delete</button>
                  </td>
                </tr>`).join("");return`
      <section class="card">
        <div class="section-header">
          ${Se("Users","admin-users")}
          <div class="section-actions">
            ${e?`<span class="badge ${Oa(e.status)}">${i(Sa(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${d||le?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${d?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${i(Ne)}" aria-label="Filter users" ${d?"disabled":""} />
          <span class="muted small">${i(String(t.length))}${Ne.trim()?` / ${ee.length}`:""} user${t.length===1?"":"s"}</span>
        </div>
        ${X&&ee.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${i(X)}</p>`:""}
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
      ${kr()}
      ${vr()}
      ${wr()}
      ${Sr()}`}function Cr(){const e=ze("settings");if(e&&e.available===!1)return us("settings");if(Ya&&!Zt)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(_a&&!Zt)return`<section class="card">
        <p class="flash flash-error">${i(_a)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const t=Zt;if(!t)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(o,m,s)=>`<label class="check-row"><input type="checkbox" name="${i(o)}" ${m?"checked":""} ${d||t.writable===!1?"disabled":""} /> ${i(s)}</label>`,r=(o,m,s,l="")=>`<label>${i(s)}
        <input type="number" name="${i(o)}" value="${i(String(m??0))}" ${d||t.writable===!1?"disabled":""} />
        ${l?`<span class="muted small">${i(l)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${Se("System settings","admin-settings")}
          <div class="section-actions">
            ${e?`<span class="badge ${Oa(e.status)}">${i(Sa(e.status))}</span>`:""}
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
              ${Tn(t.timezone||"UTC")}
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
          ${r("files_max_upload_mb",t.files_max_upload_mb,"Max file size (MB)")}
          ${r("files_quota_mb",t.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
          ${r("files_quarantine_days",t.files_quarantine_days,"Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${r("session_max_age_minutes",t.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
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
      ${Ar()}`}function Ar(){return ha?we({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${fs({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:yt,disabled:d,style:"admin"})}
          <label style="margin-top:1rem">Your portal password
            <input type="password" data-action="admin-reset-password" value="${i(Ke)}"
              autocomplete="current-password" placeholder="Re-enter password to confirm" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:d},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:d||!yt||Ke.trim()===""}]}):""}function Er(){const e=ze("database");if(e&&e.available===!1)return us("database");if(Ka&&!ea)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(qa&&!ea)return`<section class="card">
        <p class="flash flash-error">${i(qa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const t=ea;if(!t)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=ta,r=t.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${Se("Database","admin-database")}
          <div class="section-actions">
            ${e?`<span class="badge ${Oa(e.status)}">${i(Sa(e.status))}</span>`:""}
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
              <input type="text" name="sqlite_file" class="mono" value="${i(t.sqlite_file||"")}" ${d||r?"disabled":""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${a==="pgsql"?"":"display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${i(t.pgsql_host||"")}" placeholder="localhost:5432" ${d||r?"disabled":""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${i(t.pgsql_dbname||"")}" ${d||r?"disabled":""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${i(t.pgsql_username||"")}" autocomplete="off" ${d||r?"disabled":""} />
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
      ${Nr()}`}function Nr(){if(!ya)return"";const e=$t.trim()==="CONFIRM";return we({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${i($t)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:d},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:d||!e}]})}function Tr(){return Ce()?Ut()?w==="users"?Dr():w==="settings"?Cr():w==="database"?Er():yr():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function xr(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,h)=>[be(f.instanceId,f.uri),h])),r=new Map,o=[];for(const f of e){const h=f.parentUid;if(h&&t.has(h)&&h!==f.uid){const $=r.get(h)??[];$.push(f),r.set(h,$)}else o.push(f)}const m=(f,h)=>(a.get(be(f.instanceId,f.uri))??0)-(a.get(be(h.instanceId,h.uri))??0);o.sort(m);for(const[,f]of r)f.sort(m);const s=[],l=new Set,c=(f,h)=>{const $=f.uid||be(f.instanceId,f.uri);if(!l.has($)){l.add($),s.push({task:f,depth:Math.min(h,8)});for(const _ of r.get(f.uid)??[])c(_,h+1);l.delete($)}};for(const f of o)c(f,0);for(const f of e)s.some(h=>h.task===f)||s.push({task:f,depth:0});return s}function _r(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const r of qe)r.parentUid&&t.has(r.parentUid)&&r.uid&&!t.has(r.uid)&&(t.add(r.uid),a=!0)}return t}function qr(e,t){const a=e.instanceId,r=t||!e.uid?new Set:_r(e.uid),o=qe.filter(l=>l.uid&&l.instanceId===a&&!r.has(l.uid)&&l.uid!==e.uid),m=e.parentUid||"",s=['<option value="">None (top-level)</option>',...o.map(l=>`<option value="${i(l.uid)}" ${l.uid===m?"selected":""}>${i(l.summary||l.uid)}</option>`)];if(m&&!o.some(l=>l.uid===m)){const l=qe.find(c=>c.uid===m);s.push(`<option value="${i(m)}" selected>${i((l==null?void 0:l.summary)||m)} (current)</option>`)}return s.join("")}function hn(){const e=new Set(ve);return qe.filter(t=>e.has(be(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function Ir(){const e=x=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[x]||x,t=xr(qe),a=qe.filter(x=>x.canWrite&&!x.readOnly).map(x=>be(x.instanceId,x.uri)),r=a.length>0&&a.every(x=>ve.includes(x)),o=ve.length>0,s=hn().length,l=qe.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${os?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:x,depth:v})=>{const K=be(x.instanceId,x.uri),C=!ne&&K===Me?" is-selected":"",j=ve.includes(K),M=x.status==="COMPLETED"?"badge-ok":x.status==="CANCELLED"?"":"badge-admin",G=v>0?` style="--task-depth:${v}"`:"",Z=v>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",me=x.canWrite&&!x.readOnly;return`<tr class="contact-table-row task-row${v>0?" is-subtask":""}${C}${j?" is-checked":""}" data-action="select-task" data-instance="${x.instanceId}" data-uri="${i(x.uri)}" tabindex="0" role="button"${G}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${x.instanceId}" data-uri="${i(x.uri)}"
                    ${j?"checked":""} ${me?"":"disabled"} aria-label="Select ${i(x.summary||x.uri)}" ${d?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${Z}<span class="contact-name-primary">${i(x.summary||x.uri)}</span></span>
                  ${x.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${M}">${i(e(x.status))}</span></td>
                <td class="col-task-due muted small">${i(nn(x.due))}</td>
                <td class="col-task-cal muted small">${i(x.calendarName)}</td>
                <td class="col-task-pct muted small">${x.percent?i(String(x.percent))+"%":"—"}</td>
              </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(x,v)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${x}"
        title="${i(v)}" aria-label="${i(v)}" ${d||s===0?"disabled":""}>${c}</button>`,h=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${s}</strong><span class="bulk-bar-count-label">selected</span>${ve.length!==s?`<span class="muted small bulk-bar-count-extra">(${ve.length-s} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${d||s===0?"disabled":""}>
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
                ${ma({field:"bulk-due",name:"bulkDue",label:"Due",value:Qa,dateOnly:!1,disabled:d||s===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${d||s===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${d||s===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${d||s===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${d?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",$=Y,_=Ft.map(x=>`<option value="${x.id}" ${$&&$.instanceId===x.id?"selected":""}>${i(x.displayname)}</option>`).join(""),A=$?`<div class="card">
            ${Se(ne?$.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${ne?`<label>Calendar
                      <select name="instanceId" required ${Ft.length===0?"disabled":""}>
                        <option value="">${Ft.length?"Select calendar…":"No writable calendars"}</option>
                        ${_}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i($.calendarName)}</strong>${$.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i($.summary)}" ${$.readOnly&&!ne?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${$.readOnly&&!ne?"readonly":""}>${i($.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${$.readOnly&&!ne?"disabled":""}>
                  ${qr($,ne)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${$.readOnly&&!ne?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(x=>`<option value="${x}" ${$.status===x?"selected":""}>${i(e(x))}</option>`).join("")}
                  </select>
                </label>
                ${ma({field:"due",name:"due",label:"Due",value:Aa($.due),dateOnly:!1,disabled:!!($.readOnly&&!ne),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${i(String($.priority||0))}" ${$.readOnly&&!ne?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${i(String($.percent||0))}" ${$.readOnly&&!ne?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${ne||$.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ne?"Create task":"Save task"}</button>`:""}
                ${!ne&&$.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${d?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${d?"disabled":""}>Delete</button>`:ne?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Se("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(os)}" aria-label="Search tasks" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${d||Ft.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Ft.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${r?"checked":""} ${a.length===0||d?"disabled":""} />
                </th>
                ${jt("Title","summary",Rt,Et,"task","col-task-title")}
                ${jt("Status","status",Rt,Et,"task","col-task-status")}
                ${jt("Due","due",Rt,Et,"task","col-task-due")}
                ${jt("Calendar","calendar",Rt,Et,"task","col-task-cal")}
                ${jt("%","percent",Rt,Et,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${A}
      </section>
    </div>`}function Lr(){const e=ka.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${is?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:ka.map(o=>{const m=be(o.instanceId,o.uri),s=!Ae&&m===dt?" is-selected":"",l=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${s}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${i(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(o.summary||o.uri)}</span>
                  ${l?`<span class="muted small contact-name-secondary">${i(l)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(nn(o.dtstart))}</td>
                <td class="col-note-cal muted small">${i(o.calendarName)}</td>
              </tr>`}).join(""),t=ie,a=Mt.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${i(o.displayname)}</option>`).join(""),r=t?`<div class="card">
            ${Se(Ae?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${Ae?`<label>Calendar
                      <select name="instanceId" required ${Mt.length===0?"disabled":""}>
                        <option value="">${Mt.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(t.summary)}" ${t.readOnly&&!Ae?"readonly":""} />
              </label>
              ${ma({field:"dtstart",name:"dtstart",label:"Date",value:Aa(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!Ae),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!Ae?"readonly":""}>${i(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${Ae||t.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${Ae?"Create note":"Save note"}</button>`:""}
                ${!Ae&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${d?"disabled":""}>Delete</button>`:Ae?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Se("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(is)}" aria-label="Search notes" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${d||Mt.length===0?"disabled":""}>Add note</button>
        </div>
        ${Mt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${jt("Title","summary",Da,da,"note","col-note-title")}
                ${jt("Date","dtstart",Da,da,"note","col-note-date")}
                ${jt("Calendar","calendar",Da,da,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${r}
      </section>
    </div>`}function Or(){const e=n.querySelector(".contacts-table-wrap"),t=n.querySelector(".contacts-ab-list"),a=n.querySelector(".calendars-owned-list"),r=n.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null,filesTableTop:(r==null?void 0:r.scrollTop)??null}}function Ur(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=n.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=n.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=n.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}if(e.filesTableTop!==null){const t=n.querySelector(".files-table-wrap");t&&(t.scrollTop=e.filesTableTop)}})})}function p(){const e=Or();u?pr():gn(),Pr(),Ur(e),requestAnimationFrame(()=>{var t;ar(),(t=n.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function yn(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let r=a.value.trim();r&&!r.startsWith("#")&&(r=`#${r}`),/^#[0-9A-Fa-f]{6}/.test(r)&&(t.value=r.slice(0,7),a.value=r.toUpperCase())}))}function Pr(){n.querySelectorAll("[data-action]").forEach(D=>{D.addEventListener("click",ce=>{const Q=ce.target.closest("[data-action]");((Q==null?void 0:Q.dataset.action)==="info"||(Q==null?void 0:Q.dataset.action)==="info-close")&&(ce.preventDefault(),ce.stopPropagation()),Qr(ce)})}),Ua(),Pe&&qn(),n.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(D=>{D.addEventListener("keydown",ce=>{(ce.key==="Enter"||ce.key===" ")&&(ce.preventDefault(),D.click())})});const e=n.querySelector("#delete-cal-confirm"),t=n.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||d)});const a=n.querySelector("#delete-ab-confirm"),r=n.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{r&&(r.disabled=!a.checked||d)}),n.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(D=>{D.addEventListener("error",()=>{const ce=D.dataset.avatarFallback||"?",Q=document.createElement("span");Q.className="contact-avatar contact-avatar-fallback",Q.setAttribute("aria-hidden","true"),Q.textContent=ce,D.replaceWith(Q)})}),Ys||(document.addEventListener("keydown",D=>{if(D.key==="Escape"){if(W&&(W.phase==="done"||W.phase==="error")){dn();return}if(!W){if(J&&(J.phase==="done"||J.phase==="error")){mn();return}if(!J){if(Pe){Pe=!1,Ua(),p();return}if(Re!==null||xe!==null||he!==null||ut){Re=null,xe=null,Pt(),ut=!1,p();return}vn()}}}}),Ys=!0);const o=n.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",D=>{D.preventDefault(),zr(o)});const m=n.querySelector('[data-form="files-rename"]');m==null||m.addEventListener("submit",D=>{D.preventDefault(),jr(m)});const s=n.querySelector('[data-form="files-transfer"]');s==null||s.addEventListener("submit",D=>{D.preventDefault(),Wr(s)});const l=n.querySelector('[data-form="files-mkdir"]');l==null||l.addEventListener("submit",D=>{D.preventDefault(),Hr(l)}),ut&&requestAnimationFrame(()=>{var D;(D=l==null?void 0:l.querySelector('input[name="name"]'))==null||D.focus()}),n.querySelectorAll('input[type="file"][data-action="files-upload"]').forEach(D=>{D.addEventListener("change",()=>{$n(D,"files")})}),n.querySelectorAll('input[type="file"][data-action="files-upload-folder"]').forEach(D=>{D.addEventListener("change",()=>{$n(D,"folder")})}),n.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(D=>{D.indeterminate=!0});const c=n.querySelector('[data-form="share"]');c==null||c.addEventListener("submit",D=>{D.preventDefault(),Jr(c)});const f=n.querySelector('[data-form="edit-cal"]');f&&(yn(f),f.addEventListener("submit",D=>{D.preventDefault(),Kr(f)}));const h=n.querySelector('[data-form="edit-event"]');h==null||h.addEventListener("submit",D=>{D.preventDefault(),Yr(h)}),n.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(D=>{D.addEventListener("change",()=>{if(!S)return;const ce=n.querySelector('[data-form="edit-event"]');if(!ce)return;const Q=new FormData(ce),at=ce.querySelector('input[name="allDay"]'),Le=ja(Q);Le.endMode==="until"&&!Le.until&&(Le.until=ua(String(Q.get("start")??S.start??""))||ye(new Date)),S={...S,summary:String(Q.get("summary")??S.summary),description:String(Q.get("description")??S.description),location:String(Q.get("location")??S.location),instanceId:Number(Q.get("instanceId"))||S.instanceId,allDay:(at==null?void 0:at.checked)??S.allDay,start:String(Q.get("start")??S.start??""),end:String(Q.get("end")??S.end??"")||null,repeat:Le,hasRrule:!!String(Q.get("repeatFreq")??"").trim()},Le.freq&&Le.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),p(),Le.endMode==="until"&&requestAnimationFrame(()=>{var ba;const st=n.querySelector('input[name="repeatUntil"]');st==null||st.focus();try{(ba=st==null?void 0:st.showPicker)==null||ba.call(st)}catch{}})})});const $=n.querySelector('[data-form="create-cal"]');$&&(yn($),$.addEventListener("submit",D=>{D.preventDefault(),Gr($)}));const _=n.querySelector('[data-form="create-ab"]');_==null||_.addEventListener("submit",D=>{D.preventDefault(),al(_)});const A=n.querySelector('[data-form="edit-ab"]');A==null||A.addEventListener("submit",D=>{D.preventDefault(),sl(A)});const x=n.querySelector('[data-form="contact"]');x==null||x.addEventListener("submit",D=>{D.preventDefault(),tl(x)});const v=n.querySelector('[data-form="task"]');if(v==null||v.addEventListener("submit",D=>{D.preventDefault(),Mr(v)}),v){const D=v.querySelector('select[name="instanceId"]');D==null||D.addEventListener("change",()=>{if(!ne||!Y)return;const ce=Number(D.value);if(!Number.isFinite(ce)||ce<=0)return;const Q=new FormData(v),at=String(Q.get("due")??"").trim();Y={...Y,instanceId:ce,parentUid:Y.parentUid&&qe.some(Le=>Le.uid===Y.parentUid&&Le.instanceId===ce)?Y.parentUid:null,summary:String(Q.get("summary")??""),description:String(Q.get("description")??""),status:String(Q.get("status")??"NEEDS-ACTION"),due:at?new Date(at).toISOString():null,priority:Number(Q.get("priority")??0),percent:Number(Q.get("percent")??0)},p()})}const K=n.querySelector('[data-form="note"]');K==null||K.addEventListener("submit",D=>{D.preventDefault(),Rr(K)});const C=n.querySelector('input[data-action="contact-search"]');C==null||C.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{ra=C.value,V!==null&&(async()=>{try{await Bt(V),p()}catch(D){b("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)});const j=n.querySelector('input[data-action="task-search"]');j==null||j.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{os=j.value,(async()=>{try{await zt(),p()}catch(D){b("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)});const M=n.querySelector('input[data-action="admin-users-search"]');M==null||M.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{Ne=M.value,p()},150)});const G=n.querySelector('[data-form="admin-user-create"]');G==null||G.addEventListener("submit",D=>{D.preventDefault(),In(G)});const Z=n.querySelector('[data-form="admin-user-edit"]');Z==null||Z.addEventListener("submit",D=>{D.preventDefault(),Mn(Z)});const me=n.querySelector('[data-form="admin-cal"]');me==null||me.addEventListener("submit",D=>{D.preventDefault(),Ln(me)});const Ee=n.querySelector('[data-form="admin-ab"]');Ee==null||Ee.addEventListener("submit",D=>{D.preventDefault(),On(Ee)});const kt=n.querySelector('[data-form="admin-settings"]');kt==null||kt.addEventListener("submit",D=>{D.preventDefault(),Fn(kt)});const pt=n.querySelector('[data-form="admin-database"]');pt==null||pt.addEventListener("submit",D=>{D.preventDefault(),Un(pt)});const Tt=n.querySelector('select[data-action="admin-db-backend"]');Tt==null||Tt.addEventListener("change",()=>{ta=Tt.value==="pgsql"?"pgsql":"sqlite",p()});const je=n.querySelector('input[data-action="admin-db-confirm-input"]');je==null||je.addEventListener("input",()=>{$t=je.value;const D=n.querySelector('[data-action="admin-db-confirm-save"]');D&&(D.disabled=d||$t.trim()!=="CONFIRM")});const Jt=n.querySelector('input[data-action="admin-reset-password"]');Jt==null||Jt.addEventListener("input",()=>{Ke=Jt.value;const D=n.querySelector('[data-action="admin-reset-confirm"]');D&&(D.disabled=d||!yt||Ke.trim()==="")});const Yt=n.querySelector('input[data-action="note-search"]');Yt==null||Yt.addEventListener("input",()=>{Xe&&clearTimeout(Xe),Xe=setTimeout(()=>{is=Yt.value,(async()=>{try{await Ca(),p()}catch(D){b("error",D instanceof Error?D.message:"Search failed"),p()}})()},250)}),Xr(),Br(),Vr()}async function Fr(e){var o,m;const t=hn();if(t.length===0){b("error","No writable tasks selected"),p();return}const a=t.map(s=>({instanceId:s.instanceId,uri:s.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;d=!0,T(),p();try{const s=await E.bulkTasks({op:"delete",items:a});ve=[],Me&&t.some(l=>be(l.instanceId,l.uri)===Me)&&(Me=null,Y=null,ne=!1),await zt(),s.failed>0?b("error",`Deleted ${s.ok}, failed ${s.failed}${s.errors[0]?`: ${s.errors[0]}`:""}`):b("success",`Deleted ${s.ok} task${s.ok===1?"":"s"}`)}catch(s){b("error",s instanceof Error?s.message:"Bulk delete failed")}finally{d=!1,p()}return}let r={};if(e==="bulk-task-status"){const s=n.querySelector("#bulk-task-status"),l=((o=s==null?void 0:s.value)==null?void 0:o.trim())??"";if(!l){b("error","Choose a status to apply"),p();return}r={status:l}}else if(e==="bulk-task-due"){const s=Qa.trim();if(!s){b("error","Choose a due date to apply"),p();return}const l=/^\d{4}-\d{2}-\d{2}$/.test(s)?new Date(s+"T00:00:00"):new Date((s.length===16,s));if(Number.isNaN(l.getTime())){b("error","Invalid due date"),p();return}r={due:l.toISOString()}}else if(e==="bulk-task-clear-due")r={due:null};else if(e==="bulk-task-percent"){const s=n.querySelector("#bulk-task-percent"),l=((m=s==null?void 0:s.value)==null?void 0:m.trim())??"";if(l===""){b("error","Enter a percent complete (0–100)"),p();return}const c=Number(l);if(!Number.isFinite(c)||c<0||c>100){b("error","Percent must be between 0 and 100"),p();return}r={percent:Math.round(c)}}d=!0,T(),p();try{const s=await E.bulkTasks({op:"update",items:a,fields:r});if(await zt(),Y&&!ne){const c=be(Y.instanceId,Y.uri),f=qe.find(h=>be(h.instanceId,h.uri)===c);f&&(Y={...f})}const l=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";s.failed>0?b("error",`Updated ${l} on ${s.ok}, failed ${s.failed}${s.errors[0]?`: ${s.errors[0]}`:""}`):b("success",`Updated ${l} on ${s.ok} task${s.ok===1?"":"s"}`)}catch(s){b("error",s instanceof Error?s.message:"Bulk update failed")}finally{d=!1,p()}}async function Mr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),m=String(t.get("due")??"").trim(),s=m?new Date(m).toISOString():null,l=Number(t.get("priority")??0),c=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),h=f===""?null:f;d=!0,T(),p();try{if(ne){const $=Number(t.get("instanceId"));if(!Number.isFinite($)||$<=0)throw new Error("Select a calendar");const _=await E.createTask({instanceId:$,summary:a,description:r,status:o,due:s,priority:l,percent:c,parentUid:h});ne=!1,Me=be(_.task.instanceId,_.task.uri),Y=_.task,b("success",h?"Subtask created":"Task created")}else if(Y){const $=await E.updateTask(Y.instanceId,Y.uri,{summary:a,description:r,status:o,due:s,priority:l,percent:c,parentUid:h});Y=$.task,Me=be($.task.instanceId,$.task.uri),b("success","Task saved")}await zt()}catch($){b("error",$ instanceof Error?$.message:"Save failed")}finally{d=!1,p()}}async function Rr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),m=o?new Date(o).toISOString():null;d=!0,T(),p();try{if(Ae){const s=Number(t.get("instanceId"));if(!Number.isFinite(s)||s<=0)throw new Error("Select a calendar");const l=await E.createNote({instanceId:s,summary:a,description:r,dtstart:m});Ae=!1,dt=be(l.note.instanceId,l.note.uri),ie=l.note,b("success","Note created")}else if(ie){const s=await E.updateNote(ie.instanceId,ie.uri,{summary:a,description:r,dtstart:m});ie=s.note,dt=be(s.note.instanceId,s.note.uri),b("success","Note saved")}await Ca()}catch(s){b("error",s instanceof Error?s.message:"Save failed")}finally{d=!1,p()}}function Vr(){const e=n.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){b("error","Photo is too large (max ~2 MB)"),p();return}try{const r=await ir(t);Je=r,_e=`data:${t.type||"image/jpeg"};base64,${r}`,Qe=!1,p()}catch(r){b("error",r instanceof Error?r.message:"Failed to read photo"),p()}}})()})}function Br(){const e=n.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),r=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const m=()=>{const s=t.checked;a.hidden=!s,r&&(r.required=!s,s&&!r.value.trim()?r.placeholder="Auto: Holidays (XX)":s||(r.placeholder="Work")),s&&o&&(o.checked=!0)};t.addEventListener("change",m),m()}async function zr(e){var o,m,s,l;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("password")??"");d=!0,T(),p(),N.event("login.attempt",{username:a});try{const c=await E.login(a,r);if(u=c.user,Cs(c.ui),N.event("login.ok",{username:(u==null?void 0:u.username)??a}),Es(),Ce())try{await Ns()}catch(f){N.warn("admin.capabilities login",f instanceof Error?f.message:f)}if(Gs(),ft(y,w),await et(),y==="admin"&&Ce()&&Ut())try{w==="overview"&&((o=ze("overview"))==null?void 0:o.available)!==!1?await as():w==="users"&&((m=ze("users"))==null?void 0:m.available)!==!1?(await oa(),z&&(await Ct(z),await ia(z))):w==="settings"&&((s=ze("settings"))==null?void 0:s.available)!==!1?await ss():w==="database"&&((l=ze("database"))==null?void 0:l.available)!==!1&&await ns()}catch(f){N.warn("admin login load",f instanceof Error?f.message:f)}b("success","Signed in")}catch(c){N.warn("login.failed",c instanceof Error?c.message:c),b("error",c instanceof Error?c.message:"Login failed")}finally{d=!1,p()}}async function jr(e){const t=new FormData(e),a=String(t.get("path")??""),r=String(t.get("newName")??"").trim();if(!a||!r){b("error","Name is required"),p();return}d=!0,T(),p();try{await E.filesRename(a,r),N.event("files.rename",{path:a,newName:r}),Re=null,await At(),b("success",`Renamed to “${r}”`)}catch(o){b("error",o instanceof Error?o.message:"Rename failed")}finally{d=!1,p()}}async function Hr(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){b("error","Folder name is required"),p();return}d=!0,T(),p();try{await E.filesMkdir(Ie,a),N.event("files.mkdir",{path:Ie,name:a}),ut=!1,await At(),b("success",`Created folder “${a}”`)}catch(r){b("error",r instanceof Error?r.message:"Could not create folder")}finally{d=!1,p()}}async function Wr(e){if(!he||he.paths.length===0)return;const t=new FormData(e),a=(Nt||String(t.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),r=String(t.get("newName")??"").trim(),o=he.op,m=[...he.paths],s=m.length>1;if(rs(a,m)){b("error","Choose a different destination folder"),p();return}d=!0,T(),p();let l=0;const c=[];try{for(const h of m)try{if(o==="copy"){const $=Va(h),_=s||!r||r===$?void 0:r,A=await E.filesCopy(h,{to:a,newName:_});N.event("files.copy",{path:h,to:A.entry.path})}else{const $=Va(h),_=s||!r||r===$?void 0:r;await E.filesMove(h,a,_),N.event("files.move",{path:h,to:a})}l+=1}catch($){c.push(`${Va(h)}: ${$ instanceof Error?$.message:"failed"}`)}Pt(),fe=[],await At();const f=o==="copy"?"Copied":"Moved";l>0&&c.length===0?b("success",l===1?`${f} 1 item`:`${f} ${l} items`):l>0?b("info",`${f} ${l}; ${c.length} failed. ${c[0]}`):b("error",c[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){b("error",f instanceof Error?f.message:"Operation failed")}finally{d=!1,p()}}async function $n(e,t){var $;const a=e.files;if(!a||a.length===0)return;const r=Array.from(a);e.value="";const o=Ie,m=r.reduce((_,A)=>_+(A.size||0),0),s=Date.now();J={mode:t,phase:"uploading",totalFiles:r.length,completedFiles:0,failedFiles:0,currentName:(($=r[0])==null?void 0:$.name)||"",bytesTotal:m,bytesSent:0,startedAt:s,elapsedSec:0,resultMessage:null,errorSamples:[]},d=!0,T(),cr(),p();let l=0;const c=[],f=new Set;let h=0;try{for(const A of r){const x=t==="folder"&&A.webkitRelativePath?A.webkitRelativePath.replace(/\\/g,"/"):A.name,v=x.split("/").filter(Boolean),K=v.pop()||A.name,C=v.join("/"),j=t==="folder"&&x?x:K;J&&(J={...J,currentName:j,bytesSent:h,elapsedSec:Math.floor((Date.now()-s)/1e3)},Ra(J));try{C&&await mr(o,C,f);const M=fn(o,C);await E.filesUpload(M,A,{replace:!0,onProgress:(G,Z)=>{if(!J||J.phase!=="uploading")return;const me=Z>0?Z:A.size;J={...J,currentName:j,bytesSent:h+Math.min(G,me||G),elapsedSec:Math.floor((Date.now()-s)/1e3)},Ra(J)}}),N.event("files.upload",{path:M,name:K,size:A.size,folder:t==="folder"}),l+=1,h+=A.size||0,J&&(J={...J,completedFiles:l,failedFiles:c.length,bytesSent:h},Ra(J))}catch(M){const G=`${j}: ${M instanceof Error?M.message:"failed"}`;c.push(G),h+=A.size||0,J&&(J={...J,completedFiles:l,failedFiles:c.length,bytesSent:h,errorSamples:c.slice(0,12)},Ra(J))}}await At(),Ea();const _=Math.floor((Date.now()-s)/1e3);if(l>0&&c.length===0){const A=t==="folder"?l===1?"Uploaded 1 file from folder":`Uploaded ${l} files from folder`:l===1?"Uploaded 1 file":`Uploaded ${l} files`;J={mode:t,phase:"done",totalFiles:r.length,completedFiles:l,failedFiles:0,currentName:"",bytesTotal:m,bytesSent:m,startedAt:s,elapsedSec:_,resultMessage:A,errorSamples:[]},b("success",A)}else if(l>0){const A=`Uploaded ${l}; ${c.length} failed. ${c[0]}`;J={mode:t,phase:"done",totalFiles:r.length,completedFiles:l,failedFiles:c.length,currentName:"",bytesTotal:m,bytesSent:m,startedAt:s,elapsedSec:_,resultMessage:A,errorSamples:c.slice(0,12)},b("info",A)}else{const A=c[0]||"Upload failed";J={mode:t,phase:"error",totalFiles:r.length,completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:m,bytesSent:0,startedAt:s,elapsedSec:_,resultMessage:A,errorSamples:c.slice(0,12)},b("error",A)}}catch(_){Ea();const A=_ instanceof Error?_.message:"Upload failed";J={mode:t,phase:"error",totalFiles:r.length,completedFiles:l,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:m,bytesSent:h,startedAt:s,elapsedSec:Math.floor((Date.now()-s)/1e3),resultMessage:A,errorSamples:c.length?c.slice(0,12):[A]},b("error",A)}finally{d=!1,p()}}async function Jr(e){if(F===null)return;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("access")??"read");$e=!0,d=!0,T(),p();try{await E.share(F,a,r),await Pa(F),b("success",`Shared with ${a}`)}catch(o){b("error",o instanceof Error?o.message:"Share failed")}finally{d=!1,p()}}function za(e){if(!S)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');S={...S,summary:String(t.get("summary")??S.summary),description:String(t.get("description")??S.description),location:String(t.get("location")??S.location),instanceId:Number(t.get("instanceId"))||S.instanceId,allDay:(a==null?void 0:a.checked)??S.allDay,start:String(t.get("start")??S.start??""),end:String(t.get("end")??S.end??"")||null,repeat:ja(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function ja(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),r=String(e.get("repeatEndMode")??"never"),o=r==="until"||r==="count"?r:"never";let m=null,s=null;if(o==="until"){const c=String(e.get("repeatUntil")??"").trim();m=c?c.slice(0,10):null}else if(o==="count"){const c=Number(e.get("repeatCount")??0);s=Number.isFinite(c)&&c>0?Math.min(999,Math.round(c)):10}const l=e.getAll("repeatByDay").map(c=>String(c).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:m,count:s,byDay:l,endMode:o}}async function Yr(e){if(!S||!S.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),m=t.get("allDay")==="on",s=String(t.get("start")??"").trim(),l=String(t.get("end")??"").trim(),c=Number(t.get("instanceId"))||S.instanceId,f=ja(t);if(!a){b("error","Title is required"),p();return}if(!s){b("error","Start is required"),p();return}let h,$;if(m)h=s.slice(0,10),$=l?l.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const v=qs(s,l||null);h=new Date(v.start).toISOString(),$=v.end?new Date(v.end).toISOString():null}else h=new Date(s).toISOString(),$=l?new Date(l).toISOString():null;const _=S.instanceId,A=S.uri,x=ot;d=!0,T(),vt=!0,p(),N.event(x?"event.create":"event.update",{instanceId:c,uri:x?null:A,allDay:m,summary:a});try{const v={summary:a,description:r,location:o,allDay:m,start:h,end:$,instanceId:c,repeat:f},K=x?await E.createEvent(c,v):await E.updateEvent(_,A,v);(F===null||K.event.instanceId!==F)&&(F=K.event.instanceId),await tt(),vt=!1,S=null,ot=!1,O=null,N.event(x?"event.created":"event.saved",{uri:K.event.uri,instanceId:K.event.instanceId}),b("success",x?"Event created":"Event saved")}catch(v){N.warn("event.save failed",v instanceof Error?v.message:v),b("error",v instanceof Error?v.message:"Save failed")}finally{d=!1,p()}}async function Kr(e){if(F===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),o=String(t.get("color")??"").trim();d=!0,T(),p();try{const m=await E.updateCalendar(F,{displayname:a,description:r,color:o});$e=!0,await et(),F=m.calendar.id,await Pa(F),await tt(),b("success","Calendar updated")}catch(m){b("error",m instanceof Error?m.message:"Update failed")}finally{d=!1,p()}}async function Gr(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),o=String(t.get("color")??"").trim(),m=t.get("holidays")==="on",s=String(t.get("holidayCountry")??"").trim(),l=t.get("readOnly")==="on";if(Ve=!0,m&&!s){b("error","Select a country for the holidays calendar"),p();return}if(!m&&!a){b("error","Display name is required"),p();return}d=!0,T(),p();try{const c=await E.createCalendar({displayname:a,description:r,color:o,holidays:m,holidayCountry:m?s:void 0,readOnly:l});F=c.calendar.id,te.includes(c.calendar.id)||(te=[...te,c.calendar.id]),Ve=!1,await et();let f=`Created “${c.calendar.displayname}”`;const h=c.holidayImport??c.calendar.holidayImport;h&&(f+=`. Holidays imported: ${Vs(h)}.`),l&&(f+=" Calendar is read-only."),b("success",f)}catch(c){Ve=!0,b("error",c instanceof Error?c.message:"Create failed")}finally{d=!1,p()}}async function Qr(e){var r,o,m;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&N.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){W&&(W.phase==="done"||W.phase==="error")&&dn();return}if(a==="close-files-upload-progress"){J&&(J.phase==="done"||J.phase==="error")&&mn();return}if(a==="logout"){d=!0,N.event("logout");try{await E.logout()}catch{}ts(),T(),p();return}if(a==="select-cal"||a==="toggle-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s))return;Yn(s),d=!0,T(),p();try{await tt()}catch(l){b("error",l instanceof Error?l.message:"Failed to load calendar")}finally{d=!1,p()}return}if(a==="edit-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s)||!oe.find(c=>c.id===s&&c.canShare))return;F=s,te.includes(s)||(te=[...te,s]),$e=!0,Be=null,d=!0,T(),p();try{await Pa(s),await tt()}catch(c){b("error",c instanceof Error?c.message:"Failed to open calendar")}finally{d=!1,p()}return}if(a==="close-cal-modal"){$e=!1,p();return}if(a==="open-create-cal-modal"){Ve=!0,$e=!1,Be=null,T(),p();return}if(a==="close-create-cal-modal"){Ve=!1,T(),p();return}if(a==="delete-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s)||!oe.find(c=>c.id===s&&c.canShare))return;Be=s,$e=!1,T(),p();return}if(a==="cancel-delete-cal"){Be=null,p();return}if(a==="confirm-delete-cal"){const s=Number(t.dataset.id),l=n.querySelector("#delete-cal-confirm");if(!Number.isFinite(s)||!(l!=null&&l.checked))return;d=!0,T(),p();try{if(await E.deleteCalendar(s),F===s&&(F=null),te=te.filter(c=>c!==s),Be=null,$e=!1,sa=[],na=[],await et(),F===null){const c=tn();c?(F=c.id,te.includes(c.id)||(te=[...te,c.id]),await tt()):te.length>0&&(F=te[0],await tt())}b("success","Calendar deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="month-today"){const s=new Date;Ot={y:s.getFullYear(),m:s.getMonth()},Ia=null,d=!0,p();try{await tt()}finally{d=!1,p()}return}if(a==="month-prev"||a==="month-next"){const s=a==="month-prev"?-1:1,l=new Date(Ot.y,Ot.m+s,1);Ot={y:l.getFullYear(),m:l.getMonth()},Ia=null,d=!0,p();try{await tt()}finally{d=!1,p()}return}if(a==="open-event"){e.stopPropagation();const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;d=!0,T(),p();try{const c=await E.getEvent(s,l);S={...c.event,repeat:c.event.repeat??ds()},ot=!1,vt=!0,O=null,$e=!1,Be=null}catch(c){b("error",c instanceof Error?c.message:"Failed to open event")}finally{d=!1,p()}return}if(a==="open-event-day"){e.stopPropagation();const s=t.dataset.day??"";Ia=Ia===s?null:s,p();return}if(a==="new-event-day"){const s=e.target;if((r=s==null?void 0:s.closest)!=null&&r.call(s,".month-event, .month-event-more"))return;const l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;if(F===null){b("error","Select a calendar first"),p();return}const c=oe.find(f=>f.id===F);if(!c||c.readOnly||!(c.canShare||c.access==="readwrite")){b("error","This calendar is read-only"),p();return}ot=!0,S=rr(l,F),vt=!0,O=null,$e=!1,Be=null,T(),p();return}if(a==="close-event-modal"){vt=!1,S=null,ot=!1,O=null,T(),p();return}if(a==="dt-open"){const s=t.dataset.dtField||"";if(!s)return;const l=n.querySelector('[data-form="edit-event"]');if(l&&S&&za(l),(O==null?void 0:O.field)===s)O=null;else{const c=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",h=t.dataset.dtName||s;let $=Os(s);!$&&(s==="due"||s==="dtstart"||s==="bulk-due")&&($=Ma().start);const _=Fa($||ye(new Date)),[A,x]=_.date.split("-").map(Number);O={field:s,viewY:A,viewM:(x||1)-1,dateOnly:c,allowClear:f,name:h}}p();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!O)return;const s=a==="dt-month-prev"?-1:1,l=new Date(O.viewY,O.viewM+s,1);O={...O,viewY:l.getFullYear(),viewM:l.getMonth()},p();return}if(a==="dt-pick-day"){if(!O)return;const s=O.field,l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;const c=n.querySelector('[data-form="edit-event"]');c&&S&&za(c);const f=O.dateOnly;if(f)mt(s,l),O=null;else{const h=Os(s),$=Fa(h||Ma(l).start).hm;mt(s,`${l}T${$}`),O={...O,viewY:Number(l.slice(0,4)),viewM:Number(l.slice(5,7))-1}}if(s==="start"&&S&&!f&&S.end){const h=new Date(String(S.start)),$=new Date(String(S.end));!Number.isNaN(h.getTime())&&!Number.isNaN($.getTime())&&$<=h&&mt("end",Vt(new Date(h.getTime()+3600*1e3)))}p();return}if(a==="dt-pick-time"){if(!O||O.dateOnly)return;const s=O.field,l=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(l))return;const c=n.querySelector('[data-form="edit-event"]');c&&S&&za(c);const f=Os(s)||Ma().start,$=`${Fa(f).date}T${l}`;if(mt(s,$),s==="start"&&S){S={...S,allDay:!1};const _=S.end?Fa(String(S.end)):null,A=new Date($);(!_||new Date(`${_.date}T${_.hm}`)<=A)&&mt("end",Vt(new Date(A.getTime()+3600*1e3)))}O=null,p();return}if(a==="dt-today"){if(!O)return;const s=O.field,l=n.querySelector('[data-form="edit-event"]');l&&S&&za(l);const c=ye(new Date);if(O.dateOnly)mt(s,c);else{const f=Ma(c);s==="start"?(mt("start",f.start),S&&!S.end&&mt("end",f.end)):s==="end"?mt("end",f.end):mt(s,f.start)}O=null,p();return}if(a==="dt-clear"){if(!O||!O.allowClear)return;const s=O.field,l=n.querySelector('[data-form="edit-event"]');l&&S&&za(l),mt(s,null),O=null,p();return}if(a==="event-allday-toggle"){if(!S)return;const s=n.querySelector('[data-form="edit-event"]'),l=t.checked;if(s){const c=new FormData(s),f=String(c.get("start")??S.start??""),h=String(c.get("end")??S.end??"")||null;let $=f,_=h;if(l){const A=Wn(f,h);$=A.start,_=A.end}else{const A=f.slice(0,10),x=(h||f).slice(0,10),v=qs(A,x);$=v.start,_=v.end}S={...S,summary:String(c.get("summary")??S.summary),description:String(c.get("description")??S.description),location:String(c.get("location")??S.location),instanceId:Number(c.get("instanceId"))||S.instanceId,allDay:l,start:$,end:_,repeat:ja(c)}}else S={...S,allDay:l};O=null,p();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!S)return;const s=n.querySelector('[data-form="edit-event"]');if(!s)return;const l=new FormData(s),c=s.querySelector('input[name="allDay"]'),f=ja(l);S={...S,summary:String(l.get("summary")??S.summary),description:String(l.get("description")??S.description),location:String(l.get("location")??S.location),instanceId:Number(l.get("instanceId"))||S.instanceId,allDay:(c==null?void 0:c.checked)??S.allDay,start:String(l.get("start")??S.start??""),end:String(l.get("end")??S.end??"")||null,repeat:f,hasRrule:!!String(l.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(O==null?void 0:O.field)==="end"&&(O=null),p();return}if(a==="delete-event"){if(!S||!S.canWrite||ot||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const s=S.instanceId,l=S.uri;d=!0,T(),p();try{await E.deleteEvent(s,l),vt=!1,S=null,await tt(),b("success","Event deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="info"){const s=t.dataset.info??"";nl(s);return}if(a==="info-close"){vn();return}if(a==="flash-close"){T(),p();return}if(a==="user-menu-toggle"){e.stopPropagation(),Pe=!Pe,p();return}if(a==="user-menu-close"){Pe&&(Pe=!1,p());return}if(a==="tab"){const s=Hs(t.dataset.tab);s&&(s==="admin"&&(w="overview"),await Zs(s));return}if(a==="admin-page"){const s=vs(t.dataset.adminPage);s&&await Qs(s);return}if(a==="admin-refresh"){if(!Ce()||y!=="admin")return;d=!0,T(),p();try{await as(),b("success","Overview refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-users-refresh"){if(!Ce()||y!=="admin")return;d=!0,T(),p();try{await oa(),z&&await Ct(z),b("success","Users refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-user-view"){const s=t.dataset.username??"";if(!s||!Ce())return;d=!0,T(),z=s,w="users",ft("admin","users",s),p();try{await Ct(s),await ia(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-close"){z=null,R=null,Oe=null,Ue=!1,ft("admin","users",null),p();return}if(a==="admin-user-create-open"){if(!Ce())return;He=!0,Ue=!1,ht=null,T(),p();return}if(a==="admin-user-create-close"){He=!1,p();return}if(a==="admin-user-edit-open"){if(!Ce())return;const s=t.dataset.username??z??"";if(!s)return;d=!0,T(),He=!1,ht=null,z=s,w="users",ft("admin","users",s),p();try{(!R||R.username.toLowerCase()!==s.toLowerCase())&&await Ct(s),Ue=!0}catch(l){b("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-edit-close"){Ue=!1,p();return}if(a==="admin-user-delete-open"){if(!Ce())return;const s=t.dataset.username??z??"";if(!s)return;ht=s,qt=!1,He=!1,Ue=!1,T(),p();return}if(a==="admin-user-delete-close"){ht=null,qt=!1,p();return}if(a==="admin-user-delete-toggle"){qt=!!t.checked,p();return}if(a==="admin-user-delete-confirm"){if(!Ce())return;const s=t.dataset.username??ht??"";if(!s||!qt)return;d=!0,T(),p();try{await E.adminDeleteUser(s,!0),N.event("admin.user.delete",{username:s}),ht=null,qt=!1,Ue=!1,(z==null?void 0:z.toLowerCase())===s.toLowerCase()&&(z=null,R=null,It=[],Lt=[],ft("admin","users",null)),await oa(),b("success",`Deleted user “${s}”`)}catch(l){b("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-cal-create"){Ye="create",Qt=null,p();return}if(a==="admin-cal-edit"){Ye="edit",Qt=Number(t.dataset.id),p();return}if(a==="admin-cal-close"){Ye=null,Qt=null,p();return}if(a==="admin-cal-delete"){De={kind:"calendar",id:Number(t.dataset.id),label:t.dataset.label??"calendar"},p();return}if(a==="admin-ab-create"){lt="create",Xt=null,p();return}if(a==="admin-ab-edit"){lt="edit",Xt=Number(t.dataset.id),p();return}if(a==="admin-ab-close"){lt=null,Xt=null,p();return}if(a==="admin-ab-delete"){De={kind:"addressbook",id:Number(t.dataset.id),label:t.dataset.label??"address book",force:!1},p();return}if(a==="admin-ab-force-toggle"){(De==null?void 0:De.kind)==="addressbook"&&(De={...De,force:!!t.checked},p());return}if(a==="admin-resource-delete-close"){De=null,p();return}if(a==="admin-resource-delete-confirm"){if(!z||!De)return;const s=z,l=De;d=!0,T(),p();try{l.kind==="calendar"?await E.adminDeleteUserCalendar(s,l.id,!0):await E.adminDeleteUserAddressBook(s,l.id,!0,!!l.force),De=null,await ia(s),await Ct(s),b("success","Deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-settings-refresh"){d=!0,T(),p();try{await ss(),b("success","Settings reloaded")}catch(s){b("error",s instanceof Error?s.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-reset-open"){ha=!0,yt=!1,Ke="",T(),p();return}if(a==="admin-reset-close"){ha=!1,yt=!1,Ke="",p();return}if(a==="admin-reset-toggle"){yt=!!t.checked,p();return}if(a==="admin-reset-password"){Ke=t.value;const s=n.querySelector('[data-action="admin-reset-confirm"]');s&&(s.disabled=d||!yt||Ke.trim()==="");return}if(a==="admin-reset-confirm"){if(!yt)return;if(Ke.trim()===""){b("error","Re-enter your password to confirm Reset to Default"),p();return}d=!0,T(),p();try{const s=await E.adminResetToDefault(!0,Ke);N.event("admin.settings.reset-to-default"),ha=!1,yt=!1,Ke="";const l=s.redirectUrl&&s.redirectUrl.startsWith("/")?s.redirectUrl:"/portal/install/";window.location.assign(l);return}catch(s){b("error",s instanceof Error?s.message:"Reset failed"),d=!1,p()}return}if(a==="admin-database-refresh"){d=!0,T(),p();try{await ns(),b("success","Database settings reloaded")}catch(s){b("error",s instanceof Error?s.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-db-backend"){ta=t.value==="pgsql"?"pgsql":"sqlite",p();return}if(a==="admin-db-test"){const s=t.closest("form");Pn(s);return}if(a==="admin-db-confirm-close"){ya=!1,$t="",$a=null,p();return}if(a==="admin-db-confirm-input"){$t=t.value,p();const l=n.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const c=l.value.length;l.setSelectionRange(c,c)}return}if(a==="admin-db-confirm-save"){if($t.trim()!=="CONFIRM"||!$a)return;d=!0,T(),p();try{const s={...$a,confirm:"CONFIRM"},l=await E.adminUpdateDatabaseSettings(s);ea=l.data,ya=!1,$t="",$a=null,ta=(l.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:l.data.backend}),b("success","Database settings saved")}catch(s){b("error",s instanceof Error?s.message:"Database save failed")}finally{d=!1,p()}return}if(a==="files-nav"){Ie=t.dataset.path??"",Re=null,xe=null,he=null,ut=!1,fe=[],d=!0,T(),p();try{await At()}catch(l){b("error",l instanceof Error?l.message:"Failed to open folder")}finally{d=!1,p()}return}if(a==="files-toggle"){e.stopPropagation();const s=t.dataset.path??"";if(!s)return;t.checked?fe.includes(s)||(fe=[...fe,s]):fe=fe.filter(c=>c!==s),p();return}if(a==="files-select-all"){e.stopPropagation(),fe=t.checked?ue.map(l=>l.path):[],p();return}if(a==="files-copy"){const s=t.dataset.path??"";if(!s)return;ls("copy",[s]);return}if(a==="files-move"){const s=t.dataset.path??"";if(!s)return;ls("move",[s]);return}if(a==="files-bulk-copy"){if(fe.length===0)return;ls("copy",[...fe]);return}if(a==="files-bulk-move"){if(fe.length===0)return;ls("move",[...fe]);return}if(a==="files-tree-select"){if(e.preventDefault(),e.stopPropagation(),!he)return;const s=t.dataset.path??"";if(rs(s,he.paths))return;Nt=s,p();return}if(a==="files-tree-toggle"||a==="files-tree-retry"){if(e.preventDefault(),e.stopPropagation(),!he)return;const s=t.dataset.path??"";if(a==="files-tree-retry"){const c={...Ze};delete c[s],Ze=c,ct.includes(s)||(ct=[...ct,s]),Ts(s);return}ct.includes(s)?(ct=ct.filter(c=>c!==s),p()):(ct=[...ct,s],Ts(s));return}if(a==="files-transfer-close"){Pt(),p();return}if(a==="files-bulk-delete"){if(fe.length===0)return;xe=[...fe],Re=null,Pt(),p();return}if(a==="files-refresh"){d=!0,T(),p();try{await At(),b("success","Refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="files-mkdir"){ut=!0,Re=null,xe=null,Pt(),T(),p();return}if(a==="files-mkdir-close"){ut=!1,p();return}if(a==="files-rename-open"){Re=t.dataset.path??null,xe=null,Pt(),p();return}if(a==="files-rename-close"){Re=null,p();return}if(a==="files-delete-open"){const s=t.dataset.path??"";xe=s?[s]:null,Re=null,Pt(),p();return}if(a==="files-delete-close"){xe=null,p();return}if(a==="files-delete-confirm"){const s=xe?[...xe]:[];if(s.length===0)return;d=!0,T(),p();try{if(s.length===1)await E.filesDelete(s[0]),N.event("files.delete",{path:s[0]}),b("success","Deleted");else{const l=await E.filesBulk("delete",s);N.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?b("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?b("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):b("error",l.errors[0]||"Delete failed")}xe=null,fe=[],await At()}catch(l){b("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="files-download"){N.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const s=t.dataset.sort||"";if(!s)return;if(a==="sort-task"){Rt===s?Et=Et==="asc"?"desc":"asc":(Rt=s,Et=s==="due"||s==="summary"?"asc":"desc"),d=!0,p();try{await zt()}catch(l){b("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}else{Da===s?da=da==="asc"?"desc":"asc":(Da=s,da="asc"),d=!0,p();try{await Ca()}catch(l){b("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=qe.find(f=>f.instanceId===s&&f.uri===l)??null;ne=!1,Me=be(s,l),Y=c?{...c}:null,T(),p();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=be(s,l),f=qe.find(h=>be(h.instanceId,h.uri)===c);if(!f||!f.canWrite||f.readOnly)return;ve.includes(c)?ve=ve.filter(h=>h!==c):ve=[...ve,c],p();return}if(a==="task-select-all"){e.preventDefault();const s=qe.filter(c=>c.canWrite&&!c.readOnly);s.length>0&&s.every(c=>ve.includes(be(c.instanceId,c.uri)))?ve=[]:ve=s.map(c=>be(c.instanceId,c.uri)),p();return}if(a==="bulk-task-clear"){ve=[],p();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Fr(a);return}if(a==="select-note"){const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=ka.find(f=>f.instanceId===s&&f.uri===l)??null;Ae=!1,dt=be(s,l),ie=c?{...c}:null,T(),p();return}if(a==="new-task"){ne=!0,Me=null,Y={uri:"",instanceId:((o=Ft[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-subtask"){if(!Y||ne||!Y.uid||!Y.canWrite)return;const s=Y;ne=!0,Me=null,Y={uri:"",instanceId:s.instanceId,calendarId:s.calendarId,calendarName:s.calendarName,calendarUri:s.calendarUri,uid:"",parentUid:s.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-note"){Ae=!0,dt=null,ie={uri:"",instanceId:((m=Mt[0])==null?void 0:m.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="cancel-task"){ne=!1,Y=null,Me=null,p();return}if(a==="cancel-note"){Ae=!1,ie=null,dt=null,p();return}if(a==="delete-task"){if(!Y||ne||!confirm("Delete this task? CalDAV clients will sync the removal."))return;d=!0,T(),p();try{await E.deleteTask(Y.instanceId,Y.uri),Me=null,Y=null,await zt(),b("success","Task deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-note"){if(!ie||Ae||!confirm("Delete this note? CalDAV clients will sync the removal."))return;d=!0,T(),p();try{await E.deleteNote(ie.instanceId,ie.uri),dt=null,ie=null,await Ca(),b("success","Note deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="select-ab"){const s=Number(t.dataset.id);if(!Number.isFinite(s))return;V=s,it=!1,pe=null,I=null,ge=!1,Te=!1,ra="",Dt=[],_e=null,Je=null,Qe=!1,T(),d=!0,p();try{await Bt(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load contacts")}finally{d=!1,p()}return}if(a==="edit-ab"){e.stopPropagation();const s=Number(t.dataset.id);if(!Number.isFinite(s)||!Fe.find(f=>f.id===s))return;const c=V!==s;V=s,it=!0,Te=!1,T(),c&&(pe=null,I=null,ge=!1,ra="",Dt=[],_e=null,Je=null,Qe=!1),d=!0,p();try{c&&await Bt(s)}catch(f){b("error",f instanceof Error?f.message:"Failed to open address book")}finally{d=!1,p()}return}if(a==="close-ab-modal"){it=!1,p();return}if(a==="select-contact"){const s=t.dataset.uri??"";if(!s)return;T();try{await lr(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load contact")}p();return}if(a==="new-contact"){if(V===null)return;or(),T(),p();return}if(a==="cancel-contact"||a==="close-contact-modal"){ge=!1,Te=!1,I=null,pe=null,_e=null,Je=null,Qe=!1,O=null,T(),p();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;ms(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),p();return}if(a==="remove-email"){if(!I)return;ms();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;const l=Array.isArray(I.emails)?I.emails:[""];I.emails=l.filter((c,f)=>f!==s),I.emails.length===0&&(I.emails=[""]),p();return}if(a==="remove-phone"){if(!I)return;ms();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;const l=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=l.filter((c,f)=>f!==s),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),p();return}if(a==="remove-custom"){if(!I)return;ms();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((l,c)=>c!==s),p();return}if(a==="remove-photo"){_e=null,Je=null,Qe=!0,I&&(I.hasPhoto=!1),p();return}if(a==="delete-contact"){if(V===null||!pe||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;d=!0,T(),Te=!0,p();try{await E.deleteContact(V,pe),pe=null,I=null,ge=!1,Te=!1,O=null,_e=null,await et(),b("success","Contact deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-ab"){e.stopPropagation();const s=Number(t.dataset.id??V);if(!Number.isFinite(s)||!Fe.find(c=>c.id===s))return;Ge=s,it=!1,Te=!1,T(),p();return}if(a==="cancel-delete-ab"){Ge=null,p();return}if(a==="confirm-delete-ab"){const s=Number(t.dataset.id),l=n.querySelector("#delete-ab-confirm");if(!Number.isFinite(s)||!(l!=null&&l.checked))return;const c=Fe.find(h=>h.id===s);if(!c)return;const f=(c.cardCount??0)>0;d=!0,T(),p();try{await E.deleteAddressBook(s,f),V===s&&(V=null,Dt=[],I=null,pe=null,ge=!1),Ge=null,it=!1,Te=!1,await et(),V===null&&Fe.length>0&&(V=Fe[0].id,await Bt(V)),b("success","Address book deleted")}catch(h){b("error",h instanceof Error?h.message:"Delete failed")}finally{d=!1,p()}return}if(a==="export-ab"){e.stopPropagation();const s=t.dataset.id,l=s!==void 0&&s!==""?Number(s):V;if(l===null||Number.isNaN(l))return;d=!0,T(),p();try{const{blob:c,filename:f}=await E.exportAddressBook(l),h=await Us(c,f);h==="cancelled"?b("info","Export cancelled"):h==="saved"?b("success",`Saved ${f}`):b("success",`Download started: ${f}`)}catch(c){b("error",c instanceof Error?c.message:"Export failed")}finally{d=!1,p()}return}if(a==="export-contact"){if(V===null||!pe||ge)return;Te=!0,d=!0,T(),p();try{const{blob:s,filename:l}=await E.exportContact(V,pe),c=await Us(s,l);c==="cancelled"?b("info","Export cancelled"):c==="saved"?b("success",`Saved ${l}`):b("success",`Download started: ${l}`)}catch(s){b("error",s instanceof Error?s.message:"Export failed")}finally{d=!1,p()}return}if(a==="revoke"){const s=t.dataset.href??"";if(!s||F===null||!confirm("Revoke access for this user?"))return;$e=!0,d=!0,T(),p();try{await E.revoke(F,s),await Pa(F),b("success","Share revoked")}catch(l){b("error",l instanceof Error?l.message:"Revoke failed")}finally{d=!1,p()}return}if(a==="export-cal"){e.stopPropagation();const s=t.dataset.id,l=s!==void 0&&s!==""?Number(s):F;if(l===null||Number.isNaN(l))return;d=!0,T(),p();try{const{blob:c,filename:f}=await E.exportCalendar(l),h=await Us(c,f);h==="cancelled"?b("info","Export cancelled"):h==="saved"?b("success",`Saved ${f}`):b("success",`Download started: ${f}`)}catch(c){b("error",c instanceof Error?c.message:"Export failed")}finally{d=!1,p()}}}async function Us(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const s=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await s.write(e)}finally{await s.close()}return"saved"}catch(m){if(m instanceof DOMException&&m.name==="AbortError")return"cancelled"}const r=URL.createObjectURL(e),o=document.createElement("a");return o.href=r,o.download=t,o.rel="noopener",o.style.display="none",document.body.appendChild(o),o.click(),window.setTimeout(()=>{URL.revokeObjectURL(r),o.remove()},6e4),"started"}function Xr(){const e=n.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{rl(e)});const t=n.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{ll(t)});const a=n.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Zr(a)})}async function Zr(e){var r;if(V===null)return;const t=(r=e.files)==null?void 0:r[0];if(e.value="",!t)return;const a=V;it=!0,d=!0,T(),St(),W={kind:"contacts",fileName:t.name,fileSizeLabel:cs(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},on(),p();try{const o=await bn(t,l=>{if(!W||W.phase!=="reading")return;W={...W,readPercent:l};const c=n.querySelector(".import-progress-bar"),f=n.querySelector("[data-import-status-line]");c&&l!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${l}%`),f&&l!==null&&(f.textContent=`Reading file… ${l}%`)});Wt("uploading",{readPercent:100}),Wt("processing",{processPercent:0}),N.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const m=await E.importAddressBook(a,o,l=>{cn(l)}),s=Vs(m);await et(),V===a&&await Bt(a),St(),Wt("done",{ok:!0,resultMessage:`${s} (from “${t.name}”)`}),b("success",`Import finished for “${t.name}”: ${s}.`)}catch(o){const m=o instanceof Error?o.message:"Import failed";St(),Wt("error",{ok:!1,resultMessage:m}),b("error",m)}finally{d=!1,p()}}function ms(){if(!I)return;const e=n.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);I.firstname=String(t.get("firstname")??""),I.lastname=String(t.get("lastname")??""),I.fullname=String(t.get("fullname")??""),I.org=String(t.get("org")??""),I.title=String(t.get("title")??""),I.url=String(t.get("url")??""),I.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const r=[];let o=0;for(;t.has(`email_${o}`);)r.push(String(t.get(`email_${o}`)??"")),o++;r.length&&(I.emails=r);const m=[];for(o=0;t.has(`phone_value_${o}`);)m.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;m.length&&(I.phones=m);const s=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)s.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;I.custom=s}function el(e){const t=new FormData(e),a=[];let r=0;for(;t.has(`email_${r}`);){const l=String(t.get(`email_${r}`)??"").trim();l&&a.push(l),r++}const o=[];for(r=0;t.has(`phone_value_${r}`);){const l=String(t.get(`phone_value_${r}`)??"").trim();l&&o.push({type:String(t.get(`phone_type_${r}`)??"other"),value:l}),r++}const m=[];for(r=0;t.has(`custom_label_${r}`)||t.has(`custom_value_${r}`);){const l=String(t.get(`custom_label_${r}`)??"").trim(),c=String(t.get(`custom_value_${r}`)??"").trim();(l||c)&&m.push({label:l,value:c}),r++}const s={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const l=String(t.get("birthday")??"").trim();return l&&/^\d{4}-\d{2}-\d{2}/.test(l)?l.slice(0,10):null})(),custom:m};return Qe?s.removePhoto=!0:Je&&(s.photoBase64=Je),s}async function tl(e){if(V===null)return;const t=el(e);d=!0,T(),Te=!0,p();try{if(ge){const a=await E.createContact(V,t);ge=!1,pe=a.contact.uri,I=null,Te=!1,_e=null,Je=null,Qe=!1,O=null,b("success","Contact created")}else pe&&(pe=(await E.updateContact(V,pe,t)).contact.uri,I=null,Te=!1,_e=null,Je=null,Qe=!1,O=null,b("success","Contact saved"));try{await et()}catch(a){if(console.error(a),V!==null)try{await Bt(V)}catch{}}}catch(a){b("error",a instanceof Error?a.message:"Save failed")}finally{d=!1,p()}}async function al(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();if(a){d=!0,T(),p();try{const o=await E.createAddressBook({displayname:a,description:r});V=o.addressbook.id,pe=null,I=null,ge=!1,ra="",await et(),b("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){b("error",o instanceof Error?o.message:"Create failed")}finally{d=!1,p()}}}async function sl(e){if(V===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();it=!0,d=!0,T(),p();try{await E.updateAddressBook(V,{displayname:a,description:r}),await et(),b("success","Address book updated")}catch(o){b("error",o instanceof Error?o.message:"Update failed")}finally{d=!1,p()}}function nl(e){const t=kl[e];if(!t)return;const a=n.querySelector("#info-modal"),r=n.querySelector("#info-modal-title"),o=n.querySelector("#info-modal-body");if(!a||!r||!o)return;r.textContent=t.title,o.innerHTML=t.paragraphs.map(s=>`<p>${i(s)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const m=a.querySelector(".info-modal-close");m==null||m.focus()}function vn(){const e=n.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function rl(e){var a;if(F===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&($e=!0,await wn(F,t,{keepEditModalOpen:!0}))}async function ll(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=n.querySelector('[data-form="create-cal"]'),r=a?new FormData(a):new FormData,o=r.get("holidays")==="on",m=r.get("readOnly")==="on";if(o){b("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Ve=!0,p();return}if(m){b("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Ve=!0,p();return}let s=String(r.get("displayname")??"").trim();s||(s=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const l=String(r.get("description")??""),c=String(r.get("color")??"").trim();d=!0,T(),Ve=!0,p();try{const h=await E.createCalendar({displayname:s,description:l,color:c,readOnly:!1});F=h.calendar.id,Ve=!1,await et(),b("success",`Created “${h.calendar.displayname}” — importing…`),await wn(h.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${h.calendar.displayname}” created. `})}catch(h){const $=h instanceof Error?h.message:"Create or import failed";Ve=!0,b("error",$),d=!1,p()}}async function wn(e,t,a={}){d=!0,T(),St(),W={kind:"calendar",fileName:t.name,fileSizeLabel:cs(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},on(),p();try{const r=await bn(t,s=>{if(!W||W.phase!=="reading")return;W={...W,readPercent:s};const l=n.querySelector(".import-progress-bar"),c=n.querySelector("[data-import-status-line]");l&&s!==null&&(l.classList.remove("is-indeterminate"),l.style.width=`${s}%`),c&&s!==null&&(c.textContent=`Reading file… ${s}%`)});Wt("uploading",{readPercent:100}),Wt("processing",{processPercent:0}),N.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await E.importCalendar(e,r,s=>{cn(s)}),m=Vs(o);F===e&&await tt(),St(),Wt("done",{ok:!0,resultMessage:`${m} (from “${t.name}”)`}),b("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${m}.`)}catch(r){const o=r instanceof Error?r.message:"Import failed";St(),Wt("error",{ok:!1,resultMessage:o}),b("error",o)}finally{a.keepEditModalOpen&&($e=!0),d=!1,p()}}zn()}let Gt="",P=null,re=!1,bt=null,_t=null,Kt="sqlite",ws=!1;async function Ss(n,u={}){const g={Accept:"application/json",...u.headers};u.body&&(g["Content-Type"]="application/json"),Gt&&u.method&&u.method!=="GET"&&(g["X-CSRF-Token"]=Gt);const y=await fetch(`/api/install${n}`,{credentials:"same-origin",...u,headers:g});let w;try{w=await y.json()}catch{throw new Error(`Request failed (${y.status})`)}if(!y.ok)throw new Error(w.error||`Request failed (${y.status})`);return w&&typeof w=="object"&&"data"in w&&w.data!==void 0?w.data:w}async function Js(){var n;P=await Ss("/status"),Gt=P.csrfToken||Gt,((n=P.defaults)==null?void 0:n.backend)==="pgsql"?Kt="pgsql":Kt="sqlite"}function Wa(n,u,g){return`<label class="check-row"><input type="checkbox" name="${i(n)}" ${u?"checked":""} ${re?"disabled":""} /> ${i(g)}</label>`}function Al(){const n=P==null?void 0:P.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${i((n==null?void 0:n.configPath)||"—")} ${n!=null&&n.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${i((n==null?void 0:n.specificPath)||"—")} ${n!=null&&n.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${xt("error",(P==null?void 0:P.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${re?"disabled":""}>Retry</button>
  </section>`}function El(){const n=P==null?void 0:P.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${re?"disabled":""}>
          ${Tn((n==null?void 0:n.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Wa("cal_enabled",(n==null?void 0:n.cal_enabled)!==!1,"Enable CalDAV")}
      ${Wa("card_enabled",(n==null?void 0:n.card_enabled)!==!1,"Enable CardDAV")}
      ${Wa("tasks_enabled",(n==null?void 0:n.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Wa("notes_enabled",!!(n!=null&&n.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Wa("files_enabled",!!(n!=null&&n.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${re?"disabled":""}>
          ${["Digest","Basic","Apache"].map(u=>`<option value="${u}" ${((n==null?void 0:n.dav_auth_type)||"Digest")===u?"selected":""}>${u}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${i((n==null?void 0:n.invite_from)||"")}" ${re?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${i(String((n==null?void 0:n.session_max_age_minutes)??15))}" ${re?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${re?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${re?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${re?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function Nl(){const n=P==null?void 0:P.defaults,u=(P==null?void 0:P.pdoDrivers)||[],g=u.includes("sqlite"),y=u.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${re?"disabled":""}>
          ${g?`<option value="sqlite" ${Kt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${y?`<option value="pgsql" ${Kt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Kt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${i((n==null?void 0:n.sqlite_file)||"")}" class="mono" ${re?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Kt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${i((n==null?void 0:n.pgsql_host)||"")}" placeholder="localhost:5432" ${re?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${i((n==null?void 0:n.pgsql_dbname)||"")}" ${re?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${i((n==null?void 0:n.pgsql_username)||"")}" autocomplete="off" ${re?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${re?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${re?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${re?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${re?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function Tl(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${i(String((P==null?void 0:P.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${i((P==null?void 0:P.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${ws?"checked":""} ${re?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${re||!ws?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function xl(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${i((P==null?void 0:P.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function _l(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${xt("error",(P==null?void 0:P.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function gt(){const n=document.getElementById("app");if(!n)return;const u=(P==null?void 0:P.step)||"permissions";let g="";P?u==="permissions"?g=Al():u==="initialize"?g=El():u==="database"?g=Nl():u==="upgrade"?g=Tl():u==="done"?g=xl():u==="locked"?g=_l():g=`<section class="card"><p>Unknown step: ${i(u)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',n.innerHTML=`
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
      ${bt?xt("error",bt,{dismissible:!1}):""}
      ${_t?xt("success",_t,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,ql()}function ql(){var u,g,y,w,L,U;const n=document.getElementById("app");n&&((u=n.querySelector('[data-action="reload"]'))==null||u.addEventListener("click",()=>{Il()}),(g=n.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",H=>{Kt=H.target.value==="pgsql"?"pgsql":"sqlite",gt()}),(y=n.querySelector('[data-action="upgrade-toggle"]'))==null||y.addEventListener("change",H=>{ws=!!H.target.checked,gt()}),(w=n.querySelector('[data-action="upgrade-run"]'))==null||w.addEventListener("click",()=>{Ul()}),(L=n.querySelector('[data-form="initialize"]'))==null||L.addEventListener("submit",H=>{H.preventDefault(),Ll(H.target)}),(U=n.querySelector('[data-form="database"]'))==null||U.addEventListener("submit",H=>{H.preventDefault(),Ol(H.target)}))}async function Il(){re=!0,bt=null,gt();try{await Js(),_t=null}catch(n){bt=n instanceof Error?n.message:"Failed to load installer status"}finally{re=!1,gt()}}async function Ll(n){const u=new FormData(n),g=w=>{var L;return!!((L=n.querySelector(`input[name="${w}"]`))!=null&&L.checked)},y={timezone:String(u.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(u.get("dav_auth_type")??"Digest"),invite_from:String(u.get("invite_from")??"").trim(),session_max_age_minutes:Number(u.get("session_max_age_minutes")??15),admin_password:String(u.get("admin_password")??""),admin_password_confirm:String(u.get("admin_password_confirm")??"")};re=!0,bt=null,_t=null,gt();try{P=await Ss("/initialize",{method:"POST",body:JSON.stringify(y)}),Gt=P.csrfToken||Gt,_t="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(w){bt=w instanceof Error?w.message:"Initialize failed"}finally{re=!1,gt()}}async function Ol(n){const u=new FormData(n),g=String(u.get("backend")??Kt),y={backend:g,admin_password:String(u.get("admin_password")??""),admin_password_confirm:String(u.get("admin_password_confirm")??"")};g==="sqlite"?y.sqlite_file=String(u.get("sqlite_file")??"").trim():(y.pgsql_host=String(u.get("pgsql_host")??"").trim(),y.pgsql_dbname=String(u.get("pgsql_dbname")??"").trim(),y.pgsql_username=String(u.get("pgsql_username")??"").trim(),y.pgsql_password=String(u.get("pgsql_password")??"")),re=!0,bt=null,_t=null,gt();try{P=await Ss("/database",{method:"POST",body:JSON.stringify(y)}),Gt=P.csrfToken||Gt,_t="Database configured. Installer is locked.",N.event("install.database"),P.completed||P.step}catch(w){bt=w instanceof Error?w.message:"Database setup failed"}finally{re=!1,gt()}}async function Ul(){if(ws){re=!0,bt=null,_t=null,gt();try{const n=await Ss("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});_t="Upgrade completed."+(n.messages&&n.messages.length?" "+n.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await Js()}catch(n){bt=n instanceof Error?n.message:"Upgrade failed"}finally{re=!1,gt()}}}async function Pl(n){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),n.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Js()}catch(u){bt=u instanceof Error?u.message:"Failed to load installer"}gt()}const zs=document.getElementById("app");if(!zs)throw new Error("#app missing");const An=window.location.pathname.replace(/\/+$/,"")||"/";An==="/portal/install"||An.endsWith("/portal/install")?Pl(zs):Cl(zs);
