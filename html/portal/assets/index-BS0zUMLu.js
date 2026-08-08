var bl=Object.defineProperty;var gl=(n,u,g)=>u in n?bl(n,u,{enumerable:!0,configurable:!0,writable:!0,value:g}):n[u]=g;var Bs=(n,u,g)=>gl(n,typeof u!="symbol"?u+"":u,g);(function(){const u=document.createElement("link").relList;if(u&&u.supports&&u.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))y(v);new MutationObserver(v=>{for(const O of v)if(O.type==="childList")for(const F of O.addedNodes)F.tagName==="LINK"&&F.rel==="modulepreload"&&y(F)}).observe(document,{childList:!0,subtree:!0});function g(v){const O={};return v.integrity&&(O.integrity=v.integrity),v.referrerPolicy&&(O.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?O.credentials="include":v.crossOrigin==="anonymous"?O.credentials="omit":O.credentials="same-origin",O}function y(v){if(v.ep)return;v.ep=!0;const O=g(v);fetch(v.href,O)}})();const Nn={off:0,error:1,warn:2,info:3,debug:4};let Ka="off";const vs="[angaradav-portal]";function hl(n){const u=(n||"off").toLowerCase().trim();return u==="error"||u==="warn"||u==="info"||u==="debug"||u==="off"?u:"off"}function yl(n){return Ka=hl(n),Ka!=="off"&&console.info(vs,`log level = ${Ka}`),Ka}function In(n){return Nn[Ka]>=Nn[n]}function bs(n,u,g,y){if(!In(n))return;const v=[vs,g];y!==void 0&&v.push(y),console[u](...v)}function $l(n,u){In("info")&&(u&&Object.keys(u).length>0?console.info(vs,`event:${n}`,u):console.info(vs,`event:${n}`))}const N={error(n,u){bs("error","error",n,u)},warn(n,u){bs("warn","warn",n,u)},info(n,u){bs("info","info",n,u)},debug(n,u){bs("debug","debug",n,u)},event:$l};class Ce extends Error{constructor(g,y,v={}){super(g);Bs(this,"status");Bs(this,"payload");this.status=y,this.payload=v}}let ya="",hs=null,ys=null;function $s(n){ya=n&&typeof n=="string"?n:""}function vl(n){hs=n}function wl(n){ys=n}function Js(n){if(!Ln(n))try{ys==null||ys()}catch{}}function Ln(n){return n==="/login"||n==="/ui"||n==="/logout"||n==="/install/status"||n.startsWith("/install/")}function ws(n,u){if(!Ln(n)){$s("");try{hs==null||hs(u||"Session timed out. Please sign in again.")}catch{}}}async function q(n,u={}){const g=new Headers(u.headers);u.body&&!g.has("Content-Type")&&g.set("Content-Type","application/json");const y=(u.method||"GET").toUpperCase();y!=="GET"&&y!=="HEAD"&&y!=="OPTIONS"&&ya&&g.set("X-CSRF-Token",ya);const v=typeof performance<"u"?performance.now():Date.now();N.debug(`api → ${y} ${n}`);const O=await fetch(`/api${n}`,{...u,headers:g,credentials:"same-origin"});let F=null;const K=await O.text();if(K)try{F=JSON.parse(K)}catch{F={error:K}}const W=Math.round((typeof performance<"u"?performance.now():Date.now())-v);if(!O.ok){let se=`Request failed (${O.status})`,te={};if(F&&typeof F=="object"&&F!==null){const ie=F;te={...ie},typeof ie.error=="string"&&(se=ie.error)}else(O.status===500||O.status===504)&&(se="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw O.status>=500?N.error(`api ← ${y} ${n} ${O.status} (${W}ms)`,se):O.status!==401?N.warn(`api ← ${y} ${n} ${O.status} (${W}ms)`,se):(N.debug(`api ← ${y} ${n} 401 (${W}ms)`),ws(n,se)),new Ce(se,O.status,te)}return N.info(`api ← ${y} ${n} ${O.status} (${W}ms)`),Js(n),F}function it(n){return encodeURIComponent(n)}async function Tn(n,u,g,y){const v=new Headers({"Content-Type":g,Accept:"application/x-ndjson, application/json;q=0.9"});ya&&v.set("X-CSRF-Token",ya);const O=typeof performance<"u"?performance.now():Date.now();N.debug(`api → POST ${n} (stream, ${g}, ${u.length} bytes)`);let F;try{F=await fetch(`/api${n}`,{method:"POST",headers:v,credentials:"same-origin",body:u})}catch(z){const re=z instanceof Error?z.message:"Network error";throw N.error(`api ← POST ${n} network fail`,re),new Ce(`Import request failed to start (${re}). Check connectivity and container logs.`,0)}const K=(F.headers.get("Content-Type")||"").toLowerCase(),W=K.includes("ndjson")||K.includes("x-ndjson");if(!F.ok&&!W){let z=`Request failed (${F.status})`;try{const re=await F.json();re.error&&(z=re.error)}catch{}throw(F.status===504||F.status===502)&&(z="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),F.status===401?(N.debug(`api ← POST ${n} 401`,z),ws(n,z)):N.warn(`api ← POST ${n} ${F.status}`,z),new Ce(z,F.status)}if(!W&&F.ok){try{const z=await F.json();if(z&&typeof z.error=="string")throw new Ce(z.error,F.status||500);if(z&&typeof z.imported=="number"&&typeof z.updated=="number")return N.info(`api ← POST ${n} json done`),z}catch(z){if(z instanceof Ce)throw z}throw new Ce("Unexpected import response from server",500)}if(!F.body)throw new Ce("Import stream unavailable",500);const se=F.body.getReader(),te=new TextDecoder;let ie="";const Z={final:null,error:null,sawProgress:!1},_e=z=>{let re;try{re=JSON.parse(z)}catch{N.debug("import stream non-JSON line",z.slice(0,80));return}if(re.type==="progress"){Z.sawProgress=!0;const Pe=Number(re.total)||0,Je=Number(re.current)||0,Ue=typeof re.percent=="number"?re.percent:Pe>0?Math.round(100*Je/Pe):0;y==null||y({percent:Ue,current:Je,total:Pe,imported:Number(re.imported)||0,updated:Number(re.updated)||0,skipped:Number(re.skipped)||0})}else re.type==="done"&&re.result?Z.final=re.result:re.type==="error"&&(Z.error={message:re.error||"Import failed",status:re.status||500})};for(;;){const{done:z,value:re}=await se.read();if(z)break;ie+=te.decode(re,{stream:!0});const Pe=ie.split(`
`);ie=Pe.pop()??"";for(const Je of Pe){const Ue=Je.trim();Ue&&_e(Ue)}}ie.trim()&&_e(ie.trim());const J=Math.round((typeof performance<"u"?performance.now():Date.now())-O);if(Z.error)throw Z.error.status===401?(N.debug(`api ← POST ${n} stream 401 (${J}ms)`,Z.error.message),ws(n,Z.error.message)):N.warn(`api ← POST ${n} stream error (${J}ms)`,Z.error.message),new Ce(Z.error.message,Z.error.status);if(!Z.final)throw N.error(`api ← POST ${n} stream incomplete (${J}ms)`,{sawProgress:Z.sawProgress}),new Ce(Z.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return N.info(`api ← POST ${n} stream done (${J}ms)`),Js(n),Z.final}const E={ui:()=>q("/ui"),installStatus:async()=>{const n=await q("/install/status");return n&&typeof n=="object"&&"data"in n&&n.data?n.data:n},adminPing:()=>q("/admin/ping"),adminDashboard:()=>q("/admin/dashboard"),adminCapabilities:()=>q("/admin/capabilities"),adminUsers:()=>q("/admin/users"),adminUser:n=>q(`/admin/users/${encodeURIComponent(n)}`),adminCreateUser:n=>q("/admin/users",{method:"POST",body:JSON.stringify(n)}),adminUpdateUser:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}`,{method:"PATCH",body:JSON.stringify(u)}),adminDeleteUser:(n,u=!0)=>q(`/admin/users/${encodeURIComponent(n)}`,{method:"DELETE",body:JSON.stringify({confirm:u})}),adminUserCalendars:n=>q(`/admin/users/${encodeURIComponent(n)}/calendars`),adminCreateUserCalendar:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}/calendars`,{method:"POST",body:JSON.stringify(u)}),adminUpdateUserCalendar:(n,u,g)=>q(`/admin/users/${encodeURIComponent(n)}/calendars/${u}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserCalendar:(n,u,g=!0)=>q(`/admin/users/${encodeURIComponent(n)}/calendars/${u}`,{method:"DELETE",body:JSON.stringify({confirm:g})}),adminUserAddressBooks:n=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks`),adminCreateUserAddressBook:(n,u)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks`,{method:"POST",body:JSON.stringify(u)}),adminUpdateUserAddressBook:(n,u,g)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks/${u}`,{method:"PATCH",body:JSON.stringify(g)}),adminDeleteUserAddressBook:(n,u,g=!0,y=!1)=>q(`/admin/users/${encodeURIComponent(n)}/addressbooks/${u}`,{method:"DELETE",body:JSON.stringify({confirm:g,force:y})}),adminSystemSettings:()=>q("/admin/settings/system"),adminUpdateSystemSettings:n=>q("/admin/settings/system",{method:"PATCH",body:JSON.stringify(n)}),adminResetToDefault:(n=!0,u="")=>q("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:n,password:u})}),adminDatabaseSettings:()=>q("/admin/settings/database"),adminTestDatabaseConnection:n=>q("/admin/settings/database/test",{method:"POST",body:JSON.stringify(n)}),adminUpdateDatabaseSettings:n=>q("/admin/settings/database",{method:"PATCH",body:JSON.stringify(n)}),me:async()=>{var u;const n=await q("/me");return $s(n.csrfToken||((u=n.user)==null?void 0:u.csrfToken)),n},login:async(n,u)=>{var y;const g=await q("/login",{method:"POST",body:JSON.stringify({username:n,password:u})});return $s((y=g.user)==null?void 0:y.csrfToken),g},logout:async()=>{try{return await q("/logout",{method:"POST"})}finally{$s("")}},calendars:()=>q("/calendars"),createCalendar:n=>q("/calendars",{method:"POST",body:JSON.stringify(n)}),holidayCountries:()=>q("/holidays/countries"),updateCalendar:(n,u)=>q(`/calendars/${n}`,{method:"PATCH",body:JSON.stringify(u)}),deleteCalendar:n=>q(`/calendars/${n}`,{method:"DELETE"}),calendarEvents:(n,u,g)=>{const y=new URLSearchParams({from:u,to:g}).toString();return q(`/calendars/${n}/events?${y}`)},getEvent:(n,u)=>q(`/calendars/${n}/events/${it(u)}`),createEvent:(n,u)=>q(`/calendars/${n}/events`,{method:"POST",body:JSON.stringify(u)}),updateEvent:(n,u,g)=>q(`/calendars/${n}/events/${it(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteEvent:(n,u)=>q(`/calendars/${n}/events/${it(u)}`,{method:"DELETE"}),exportCalendar:async n=>{const u=await fetch(`/api/calendars/${n}/export`,{credentials:"same-origin"});if(!u.ok){let F=`Export failed (${u.status})`;try{const K=await u.json();K.error&&(F=K.error)}catch{}throw new Ce(F,u.status)}const g=u.headers.get("Content-Disposition")||"",y=/filename="([^"]+)"/i.exec(g),v=(y==null?void 0:y[1])||`calendar-${n}.ics`;return{blob:await u.blob(),filename:v}},importCalendar:(n,u,g)=>Tn(`/calendars/${n}/import`,u,"text/calendar; charset=utf-8",g),directory:()=>q("/directory"),shares:n=>q(`/calendars/${n}/shares`),share:(n,u,g)=>q(`/calendars/${n}/shares`,{method:"POST",body:JSON.stringify({username:u,access:g})}),revoke:(n,u)=>q(`/calendars/${n}/shares`,{method:"DELETE",body:JSON.stringify({href:u})}),addressbooks:()=>q("/addressbooks"),createAddressBook:n=>q("/addressbooks",{method:"POST",body:JSON.stringify(n)}),updateAddressBook:(n,u)=>q(`/addressbooks/${n}`,{method:"PATCH",body:JSON.stringify(u)}),deleteAddressBook:(n,u=!1)=>q(`/addressbooks/${n}`,{method:"DELETE",body:JSON.stringify({force:u})}),exportAddressBook:async n=>{const u=await fetch(`/api/addressbooks/${n}/export`,{credentials:"same-origin"});if(!u.ok){let F=`Export failed (${u.status})`;try{const K=await u.json();K.error&&(F=K.error)}catch{}throw new Ce(F,u.status)}const g=u.headers.get("Content-Disposition")||"",y=/filename="([^"]+)"/i.exec(g),v=(y==null?void 0:y[1])||`contacts-${n}.vcf`;return{blob:await u.blob(),filename:v}},importAddressBook:(n,u,g)=>Tn(`/addressbooks/${n}/import`,u,"text/vcard; charset=utf-8",g),contacts:(n,u="")=>{const g=u.trim()?`?q=${encodeURIComponent(u.trim())}`:"";return q(`/addressbooks/${n}/contacts${g}`)},getContact:(n,u)=>q(`/addressbooks/${n}/contacts/${it(u)}`),createContact:(n,u)=>q(`/addressbooks/${n}/contacts`,{method:"POST",body:JSON.stringify(u)}),updateContact:(n,u,g)=>q(`/addressbooks/${n}/contacts/${it(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteContact:(n,u)=>q(`/addressbooks/${n}/contacts/${it(u)}`,{method:"DELETE"}),exportContact:async(n,u)=>{const g=await fetch(`/api/addressbooks/${n}/contacts/${it(u)}/export`,{credentials:"same-origin"});if(!g.ok){let K=`Export failed (${g.status})`;try{const W=await g.json();W.error&&(K=W.error)}catch{}throw new Ce(K,g.status)}const y=g.headers.get("Content-Disposition")||"",v=/filename="([^"]+)"/i.exec(y),O=(v==null?void 0:v[1])||"contact.vcf";return{blob:await g.blob(),filename:O}},contactPhotoUrl:(n,u)=>`/api/addressbooks/${n}/contacts/${it(u)}/photo`,tasks:(n={})=>{const u=new URLSearchParams;n.q&&u.set("q",n.q),n.sort&&u.set("sort",n.sort),n.order&&u.set("order",n.order);const g=u.toString()?`?${u}`:"";return q(`/tasks${g}`)},createTask:n=>q("/tasks",{method:"POST",body:JSON.stringify(n)}),updateTask:(n,u,g)=>q(`/tasks/${n}/${it(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteTask:(n,u)=>q(`/tasks/${n}/${it(u)}`,{method:"DELETE"}),bulkTasks:n=>q("/tasks/bulk",{method:"POST",body:JSON.stringify(n)}),notes:(n={})=>{const u=new URLSearchParams;n.q&&u.set("q",n.q),n.sort&&u.set("sort",n.sort),n.order&&u.set("order",n.order);const g=u.toString()?`?${u}`:"";return q(`/notes${g}`)},createNote:n=>q("/notes",{method:"POST",body:JSON.stringify(n)}),updateNote:(n,u,g)=>q(`/notes/${n}/${it(u)}`,{method:"PATCH",body:JSON.stringify(g)}),deleteNote:(n,u)=>q(`/notes/${n}/${it(u)}`,{method:"DELETE"}),filesStatus:()=>q("/files"),filesList:(n="")=>{const u=new URLSearchParams;n&&u.set("path",n);const g=u.toString()?`?${u}`:"";return q(`/files/entries${g}`)},filesMkdir:(n,u)=>q("/files/mkdir",{method:"POST",body:JSON.stringify({path:n,name:u})}),filesUpload:(n,u,g={})=>{const y=new URLSearchParams;n&&y.set("path",n),y.set("name",u.name),g.replace&&y.set("replace","1");const v=new FormData;v.append("file",u,u.name),n&&v.append("path",n);const O=typeof performance<"u"?performance.now():Date.now();return N.debug(`api → POST /files/upload path=${n||"/"} name=${u.name} size=${u.size}`),new Promise((F,K)=>{const W=new XMLHttpRequest;W.open("POST",`/api/files/upload?${y}`),W.withCredentials=!0,ya&&W.setRequestHeader("X-CSRF-Token",ya),g.onProgress&&(W.upload.onprogress=se=>{var te,ie;se.lengthComputable?(te=g.onProgress)==null||te.call(g,se.loaded,se.total):(ie=g.onProgress)==null||ie.call(g,se.loaded,u.size||se.loaded)}),W.onload=()=>{const se=Math.round((typeof performance<"u"?performance.now():Date.now())-O);let te=null;const ie=W.responseText||"";if(ie)try{te=JSON.parse(ie)}catch{te={error:ie}}const Z=W.status;if(Z<200||Z>=300){let _e=`Upload failed (${Z||0})`;te&&typeof te=="object"&&te!==null&&"error"in te&&typeof te.error=="string"&&(_e=te.error),Z===401?(N.debug(`api ← POST /files/upload 401 (${se}ms)`,_e),ws("/files/upload",_e)):Z>=500?N.error(`api ← POST /files/upload ${Z} (${se}ms)`,_e):N.warn(`api ← POST /files/upload ${Z} (${se}ms)`,_e),K(new Ce(_e,Z||0));return}N.info(`api ← POST /files/upload 200 (${se}ms)`),Js("/files/upload"),F(te)},W.onerror=()=>{const se=Math.round((typeof performance<"u"?performance.now():Date.now())-O);N.error(`api ← POST /files/upload network error (${se}ms)`),K(new Ce("Upload failed (network error)",0))},W.onabort=()=>{K(new Ce("Upload cancelled",0))},W.send(v)})},filesDownloadUrl:n=>{const u=new URLSearchParams;return u.set("path",n),`/api/files/download?${u}`},filesDelete:n=>q("/files/entry",{method:"DELETE",body:JSON.stringify({path:n})}),filesRename:(n,u)=>q("/files/rename",{method:"POST",body:JSON.stringify({path:n,newName:u})}),filesMove:(n,u,g)=>q("/files/move",{method:"POST",body:JSON.stringify({from:n,to:u,newName:g})}),filesCopy:(n,u={})=>q("/files/copy",{method:"POST",body:JSON.stringify({path:n,to:u.to,newName:u.newName})}),filesBulk:(n,u)=>q("/files/bulk",{method:"POST",body:JSON.stringify({op:n,paths:u})})},Sl=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let qa=null;function kl(){if(qa)return qa;try{const n=Intl;if(typeof n.supportedValuesOf=="function"){const u=n.supportedValuesOf("timeZone");if(Array.isArray(u)&&u.length>0)return qa=[...u].sort((g,y)=>g.localeCompare(y)),qa}}catch{}return qa=[...Sl],qa}function On(n){const u=n||"UTC",g=kl(),y=g.includes(u),v=g.map(O=>`<option value="${xn(O)}" ${O===u?"selected":""}>${_n(O)}</option>`);return!y&&u&&v.unshift(`<option value="${xn(u)}" selected>${_n(u)}</option>`),v.join("")}function xn(n){return n.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function _n(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Lt(n,u,g={}){if(!u)return"";const y=g.dismissible!==void 0?g.dismissible:g.dismissAction!==void 0,v=g.dismissAction??"flash-close",O=g.role??"status",F=g.className?` ${g.className}`:"",K=g.style?` style="${i(g.style)}"`:"",W=y?`<button type="button" class="flash-close" data-action="${i(v)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${i(n)}${F}" role="${i(O)}"${K}>
      <span class="flash-text">${i(u)}</span>
      ${W}
    </div>`}function Dl(n){return n==="sm"?" cal-modal-card-sm":n==="wide"?" cal-modal-card-wide":""}function Cl(n){return n==="danger"?"btn btn-danger":n==="ghost"?"btn btn-ghost":"btn btn-primary"}function Hs(n){return n.map(g=>{const y=g.type??"button",v=Cl(g.variant),O=g.disabled?" disabled":"",F=g.id?` id="${i(g.id)}"`:"",K=g.action?` data-action="${i(g.action)}"`:"",W=g.attrs?` ${g.attrs}`:"";return`<button type="${y}" class="${v}"${K}${F}${W}${O}>${i(g.label)}</button>`}).join(`
`)}function we(n){const u=n.titleId||(n.id?`${n.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),g=n.id?` id="${i(n.id)}"`:"",y=n.className?` ${n.className}`:"",v=n.rootAttrs?` ${n.rootAttrs}`:"",O=`${Dl(n.size)}${n.cardClassName?` ${n.cardClassName}`:""}`,F=n.closeAction,K=n.lockBackdrop?"":` data-action="${i(F)}"`,W=n.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${i(F)}" aria-label="Close">×</button>`;let se="";n.footer!==void 0&&(se=typeof n.footer=="string"?n.footer:Hs(n.footer));const te=se?`<footer class="cal-modal-footer">${se}</footer>`:"",ie=`<div class="cal-modal-body">${n.body}</div>`;let Z;return n.form?Z=`<form class="stack"${n.formAttrs?` ${n.formAttrs}`:""}>
        ${ie}
        ${te}
      </form>`:Z=`${ie}
      ${te}`,`<div class="cal-modal${y}"${g}${v} role="dialog" aria-modal="true" aria-labelledby="${i(u)}">
      <div class="cal-modal-backdrop"${K}></div>
      <div class="cal-modal-card${O}">
        <header class="cal-modal-header">
          <h3 id="${i(u)}">${i(n.title)}</h3>
          ${W}
        </header>
        ${Z}
      </div>
    </div>`}function gs(n){const u=n.style==="checkbox"?"checkbox":"admin-delete-confirm",g=n.style==="checkbox"?' style="margin-top:1rem"':"",y=n.id?` id="${i(n.id)}"`:"",v=n.checked?" checked":"",O=n.disabled?" disabled":"";return`<label class="${u}"${g}>
            <input type="checkbox"${y} data-action="${i(n.action)}"${v}${O} />
            ${i(n.label)}
          </label>`}const Pn="angaradav-portal-tab",Un="angaradav-portal-admin-page",Al="2.1.1",El="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ys(n){return n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"||n==="files"||n==="admin"?n:null}function Ss(n){return n==="overview"||n==="users"||n==="settings"||n==="database"?n:null}function Ks(){const n=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!n)return{tab:null,adminPage:null,adminUsername:null};if(n==="admin"||n.startsWith("admin/")){const u=n.split("/").filter(Boolean),g=u[1]??"overview",y=Ss(g)??"overview";let v=null;if(y==="users"&&u[2])try{v=decodeURIComponent(u[2])}catch{v=u[2]}return{tab:"admin",adminPage:y,adminUsername:v}}return{tab:Ys(n),adminPage:null,adminUsername:null}}function Nl(){const n=Ks().tab;if(n)return n;try{const u=Ys(sessionStorage.getItem(Pn));if(u)return u}catch{}return"calendars"}function Tl(){const n=Ks().adminPage;if(n)return n;try{const u=Ss(sessionStorage.getItem(Un));if(u)return u}catch{}return"overview"}function xl(n,u=null){return n==="overview"?"#admin":n==="users"&&u?`#admin/users/${encodeURIComponent(u)}`:`#admin/${n}`}function ht(n,u="overview",g=null){try{sessionStorage.setItem(Pn,n),n==="admin"&&sessionStorage.setItem(Un,u)}catch{}if(typeof history>"u"||typeof location>"u")return;const y=n==="admin"?xl(u,g):`#${n}`;location.hash!==y&&history.replaceState(null,"",`${location.pathname}${location.search}${y}`)}function zs(n){return n==="readwrite"?'<span class="badge badge-admin">full access</span>':n==="read"?'<span class="badge">read-only</span>':n==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(n)}</span>`}function js(n){const u=[`${n.imported} new`,`${n.updated} updated`];return n.skipped>0&&u.push(`${n.skipped} skipped`),u.join(", ")}const _l={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload files, folders, or a mix (drag-and-drop or browse). Nested folder trees are recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function De(n,u,g="h2"){const y=g;return`<div class="section-title-row">
    <${y}>${i(n)}</${y}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(u)}"
      aria-label="About ${i(n)}" title="About ${i(n)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function ql(){return`
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
    </div>`}function Il(n){let u=null,g=null,y=Nl(),v=Tl(),O=null,F=!1,K=null,W=null,se=null,te=[],ie=!1,Z=null,_e="",J=Ks().adminUsername??null,z=null,re=!1,Pe=null,Je=!1,Ue=!1,vt=null,Pt=!1,Ut=[],Ft=[],Ia=!1,Xe=null,ea=null,dt=null,ta=null,Ae=null,aa=null,Ga=!1,La=null,$a=!1,wt=!1,Ze="",sa=null,Qa=!1,Oa=null,na="sqlite",va=!1,St="",wa=null,Fe=!1,Sa=null,de=[],ra=[],Xa=[],B=null,ae=[],la=[],Ye=null,Se=!1,Be=!1,ze=null,et=null,Mt={y:new Date().getFullYear(),m:new Date().getMonth()},oa=[],Cs=!1,kt=!1,w=null,ct=!1,U=null,Za="",Pa=null,Me=[],j=null,Et=[],ia="",fe=null,I=null,he=!1,qe=!1,ut=!1,Ie=null,Ke=null,tt=!1,d=!1,G=null,es=null,H=null,ts=null,mt=!1,Dt=!1,Qs=!1,ka={timeFormat:"auto",weekStart:"auto",logLevel:"off"},at=null,Xs=900,Ua=null,da=Al,As=!1,as=!1;function Es(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();ka={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},yl(ka.logLevel),typeof e.sessionIdleSeconds=="number"&&Number.isFinite(e.sessionIdleSeconds)&&e.sessionIdleSeconds>0&&(Xs=Math.floor(e.sessionIdleSeconds)),typeof e.version=="string"&&e.version.trim()!==""&&(da=e.version.trim())}function Ns(){Ua!==null&&(clearTimeout(Ua),Ua=null)}function Ts(){if(Ns(),!u)return;const e=Math.max(30,Xs)*1e3;Ua=setTimeout(()=>{Ua=null,sn("Your session timed out. Please sign in again.")},e)}function ss(){Ns(),At(),G=null,H=null,Ta(),mt=!1,Dt=!1,u=null,de=[],la=[],B=null,ae=[],ra=[],Me=[],j=null,Et=[],fe=null,I=null,he=!1,qe=!1,ut=!1,Be=!1,Se=!1,ze=null,et=null,kt=!1,w=null,ct=!1,oa=[],Le=[],Ca=[],Vt=[],Bt=[],Re=null,pt=null,Q=null,ce=null,le=!1,Ne=!1,ke=[],qs=null,ye="",pe=[],pa=!1,Oe=null,Te=null,xt(),nt=!1,mt=!1,Dt=!1,be=[],Ie=null,Ke=null,tt=!1,d=!1,Fe=!1,O=null,F=!1,K=null,W=null,se=null,te=[],ie=!1,Z=null,_e="",J=null,z=null,re=!1,Pe=null,Je=!1,Ue=!1,vt=null,Pt=!1,Ut=[],Ft=[],Ia=!1,Xe=null,ea=null,dt=null,ta=null,Ae=null,aa=null,Ga=!1,La=null,$a=!1,wt=!1,Ze="",sa=null,Qa=!1,Oa=null,na="sqlite",va=!1,St="",wa=null,Ma()}function Ee(){return!!(u!=null&&u.isAdmin||(u==null?void 0:u.role)==="Admin")}function Rt(){return Ee()?W===null?!0:W.uiEnabled!==!1:!1}function je(e){const t=W==null?void 0:W.pages;return t?t.find(a=>a.id===e)??null:null}function Da(e){switch(e){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return e}}function Fa(e){return e==="full"||e==="read-only"?"badge-ok":e==="deferred"?"badge-off":"badge-soon"}function Ma(){Sa&&(document.removeEventListener("click",Sa,!0),Sa=null)}function Fn(){Ma(),Sa=t=>{var r;const a=t.target;(r=a==null?void 0:a.closest)!=null&&r.call(a,".user-menu")||(Fe=!1,Ma(),p())};const e=Sa;setTimeout(()=>{Fe&&Sa===e&&document.addEventListener("click",e,!0)},0)}function Zs(){y==="admin"&&(!Ee()||!Rt())&&(y="calendars",v="overview",ht(y))}async function en(e,t={}){if(!Ee()){await an("calendars",t);return}y="admin",v=e,e!=="users"?(J=null,z=null,Pe=null):t.username!==void 0&&(J=t.username,t.username||(z=null,Pe=null)),Fe=!1,ht("admin",e,J),N.event("tab",{tab:"admin",adminPage:e,user:J}),t.clearFlash!==!1&&T(),d=!0,p();try{if(await xs(),!Rt()){y="calendars",ht("calendars"),b("info","Portal Administration UI is disabled.");return}const a=je(e);e==="overview"&&(a==null?void 0:a.available)!==!1?await ns():e==="users"&&(a==null?void 0:a.available)!==!1?(await ca(),J&&(await Nt(J),await ua(J))):e==="settings"&&(a==null?void 0:a.available)!==!1?await rs():e==="database"&&(a==null?void 0:a.available)!==!1&&await ls()}catch(a){N.warn("admin page load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function xs(){var e;se=null;try{W=(await E.adminCapabilities()).data,N.debug("admin.capabilities",{uiEnabled:W.uiEnabled,pages:((e=W.pages)==null?void 0:e.length)??0})}catch(t){se=t instanceof Error?t.message:"Failed to load capabilities",W={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},N.warn("admin.capabilities fallback",se)}}async function ns(){F=!0,K=null;try{O=(await E.adminDashboard()).data,N.debug("admin.dashboard",{users:O.users,calendars:O.calendars})}catch(e){throw O=null,K=e instanceof Error?e.message:"Failed to load dashboard",e}finally{F=!1}}async function ca(){ie=!0,Z=null;try{te=(await E.adminUsers()).users??[],N.debug("admin.users",{count:te.length})}catch(e){throw te=[],Z=e instanceof Error?e.message:"Failed to load users",e}finally{ie=!1}}async function Nt(e){re=!0,Pe=null;try{const t=await E.adminUser(e);z=t.user,J=t.user.username,N.debug("admin.user",{username:t.user.username})}catch(t){throw z=null,Pe=t instanceof Error?t.message:"Failed to load user",t}finally{re=!1}}async function ua(e){Ia=!0;try{const[t,a]=await Promise.all([E.adminUserCalendars(e),E.adminUserAddressBooks(e)]);Ut=t.calendars??[],Ft=a.addressbooks??[]}catch(t){throw Ut=[],Ft=[],t}finally{Ia=!1}}async function rs(){Ga=!0,La=null;try{aa=(await E.adminSystemSettings()).data}catch(e){throw aa=null,La=e instanceof Error?e.message:"Failed to load settings",e}finally{Ga=!1}}async function ls(){Qa=!0,Oa=null;try{const e=await E.adminDatabaseSettings();sa=e.data,na=(e.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite"}catch(e){throw sa=null,Oa=e instanceof Error?e.message:"Failed to load database settings",e}finally{Qa=!1}}async function Mn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),m=String(t.get("password")??""),s=String(t.get("passwordConfirm")??"");if(!a||!r||!o||!m){b("error","Username, display name, email, and password are required"),p();return}if(m!==s){b("error","Password confirmation does not match"),p();return}d=!0,T(),p();try{const l=await E.adminCreateUser({username:a,displayname:r,email:o,password:m,passwordConfirm:s});N.event("admin.user.create",{username:l.user.username}),Je=!1,J=l.user.username,z=l.user,ht("admin","users",l.user.username),await ca(),b("success",`Created user “${l.user.username}”`)}catch(l){b("error",l instanceof Error?l.message:"Create failed")}finally{d=!1,p()}}async function Rn(e){var c,f;if(!J)return;const t=J,a=new FormData(e),r=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim(),m=String(a.get("calendarcolor")??"").trim(),s=((c=e.querySelector('input[name="todos"]'))==null?void 0:c.checked)??!1,l=((f=e.querySelector('input[name="notes"]'))==null?void 0:f.checked)??!1;d=!0,T(),p();try{if(Xe==="create"){const h=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserCalendar(t,{uri:h,displayname:r,description:o,calendarcolor:m||void 0,todos:s,notes:l}),b("success",`Created calendar “${r}”`)}else{const h=Number(a.get("instanceId"));await E.adminUpdateUserCalendar(t,h,{displayname:r,description:o,calendarcolor:m,todos:s,notes:l}),b("success",`Updated calendar “${r}”`)}Xe=null,ea=null,await ua(t),await Nt(t)}catch(h){b("error",h instanceof Error?h.message:"Save failed")}finally{d=!1,p()}}async function Vn(e){if(!J)return;const t=J,a=new FormData(e),r=String(a.get("displayname")??"").trim(),o=String(a.get("description")??"").trim();d=!0,T(),p();try{if(dt==="create"){const m=String(a.get("uri")??"").trim().toLowerCase();await E.adminCreateUserAddressBook(t,{uri:m,displayname:r,description:o}),b("success",`Created address book “${r}”`)}else{const m=Number(a.get("id"));await E.adminUpdateUserAddressBook(t,m,{displayname:r,description:o}),b("success",`Updated address book “${r}”`)}dt=null,ta=null,await ua(t),await Nt(t)}catch(m){b("error",m instanceof Error?m.message:"Save failed")}finally{d=!1,p()}}function tn(e){const t=new FormData(e),a=String(t.get("backend")??na).toLowerCase()==="pgsql"?"pgsql":"sqlite",r={backend:a};return a==="sqlite"?r.sqlite_file=String(t.get("sqlite_file")??"").trim():(r.pgsql_host=String(t.get("pgsql_host")??"").trim(),r.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),r.pgsql_username=String(t.get("pgsql_username")??"").trim(),r.pgsql_password=String(t.get("pgsql_password")??"")),r}function Bn(e){wa=tn(e),St="",va=!0,T(),p()}async function zn(e){if(e||(e=n.querySelector('[data-form="admin-database"]')),!e){b("error","Database form not found"),p();return}const t=tn(e);d=!0,T(),p();try{const a=await E.adminTestDatabaseConnection(t);b("success",a.message||"Connection successful"),N.event("admin.database.test",{backend:a.backend})}catch(a){b("error",a instanceof Error?a.message:"Connection test failed")}finally{d=!1,p()}}async function jn(e){const t=new FormData(e),a=s=>{var l;return!!((l=e.querySelector(`input[name="${s}"]`))!=null&&l.checked)},r={cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),push_enabled:a("push_enabled"),portal_admin_ui_enabled:a("portal_admin_ui_enabled"),timezone:String(t.get("timezone")??"").trim(),invite_from:String(t.get("invite_from")??"").trim(),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),files_storage_path:String(t.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(t.get("files_max_upload_mb")??0),files_quota_mb:Number(t.get("files_quota_mb")??0),files_quarantine_days:Number(t.get("files_quarantine_days")??0),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),portal_log_level:String(t.get("portal_log_level")??"off"),portal_admin_users:String(t.get("portal_admin_users")??"").trim(),push_external_url:String(t.get("push_external_url")??"").trim(),push_log_level:String(t.get("push_log_level")??"off")},o=String(t.get("admin_password")??""),m=String(t.get("admin_password_confirm")??"");(o!==""||m!=="")&&(r.admin_password=o,r.admin_password_confirm=m),d=!0,T(),p();try{aa=(await E.adminUpdateSystemSettings(r)).data,N.event("admin.settings.save"),b("success","System settings saved")}catch(s){b("error",s instanceof Error?s.message:"Save failed")}finally{d=!1,p()}}async function Hn(e){const t=new FormData(e),a=String(t.get("username")??"").trim(),r=String(t.get("displayname")??"").trim(),o=String(t.get("email")??"").trim(),m=String(t.get("password")??""),s=String(t.get("passwordConfirm")??"");if(!a){b("error","Username is required"),p();return}if(!r||!o){b("error","Display name and email are required"),p();return}if(m!==""||s!==""){if(m===""||s===""){b("error","Password and confirmation are required to change password"),p();return}if(m!==s){b("error","Password confirmation does not match"),p();return}}d=!0,T(),p();try{const l={displayname:r,email:o};m!==""&&(l.password=m,l.passwordConfirm=s);const c=await E.adminUpdateUser(a,l);N.event("admin.user.update",{username:c.user.username,passwordChanged:m!==""}),Ue=!1,z=c.user,J=c.user.username,await ca(),b("success",m!==""?`Updated “${c.user.username}” (password changed)`:`Updated “${c.user.username}”`)}catch(l){b("error",l instanceof Error?l.message:"Update failed")}finally{d=!1,p()}}async function an(e,t={}){if(e==="admin"&&(!Ee()||!Rt())&&(Ee()&&W&&!W.uiEnabled&&b("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),e="calendars"),e==="admin"){await en(v||"overview",{...t,username:v==="users"?J:null});return}y=e,Fe=!1,ht(e),N.event("tab",{tab:e}),e!=="calendars"&&(Se=!1,ze=null),e!=="contacts"&&(et=null),t.clearFlash!==!1&&T(),d=!0,p();try{e==="contacts"&&j!==null?await Ht(j):e==="calendars"?await lt():e==="tasks"?await Wt():e==="notes"?await Ea():e==="files"&&await Tt()}catch(a){N.warn("tab load failed",a instanceof Error?a.message:a),b("error",a instanceof Error?a.message:"Failed to load")}finally{d=!1,p()}}async function Tt(){pa=!0;try{N.debug("loadFiles",{path:ye});const[e,t]=await Promise.all([E.filesStatus(),E.filesList(ye).catch(a=>{if(a instanceof Ce&&(a.status===503||a.status===404))return{path:ye,entries:[]};throw a})]);if(qs=e,e.ready){ye=t.path,pe=t.entries;const a=new Set(pe.map(r=>r.path));be=be.filter(r=>a.has(r))}else pe=[],be=[];N.event("loadFiles",{path:ye,count:pe.length,enabled:e.enabled,ready:e.ready})}finally{pa=!1}}function os(e,t){for(const a of t)if(a&&(e===a||e.startsWith(`${a}/`)))return!0;return!1}function xt(){$e=null,qt="",st={},ft=[]}async function is(e,t){if(t.length===0)return;$e={op:e,paths:[...t]},qt=ye,st={};const a=new Set([""]);if(ye){const r=ye.split("/").filter(Boolean);let o="";for(const m of r)o=o?`${o}/${m}`:m,a.add(o)}ft=[...a],Oe=null,Te=null,nt=!1,T(),p(),await Promise.all([...a].map(r=>_s(r)))}async function _s(e){const t=st[e];if(!(t&&t!=="error")){st={...st,[e]:"loading"},p();try{const r=(await E.filesList(e)).entries.filter(o=>o.type==="dir").slice().sort((o,m)=>o.name.localeCompare(m.name,void 0,{sensitivity:"base"}));if(!$e)return;st={...st,[e]:r}}catch(a){if(!$e)return;st={...st,[e]:"error"},N.warn("files.tree",{path:e||"/",error:a instanceof Error?a.message:String(a)})}p()}}function Wn(){if(!$e)return"";const e=$e.paths,t=[],a=(r,o)=>{const m=qt===r,s=os(r,e),l=ft.includes(r),c=st[r],f=Array.isArray(c),h=r===""||c==="loading"||c==="error"||!f||c.length>0,$=r===""?"Home":za(r),L=s?"Cannot use a selected item (or a folder inside it) as the destination":r===""?"File home root":r,x=l?"▾":"▸";if(t.push(`<div class="files-tree-row${m?" is-selected":""}${s?" is-blocked":""}" style="--depth:${o}" role="treeitem" aria-selected="${m}" aria-expanded="${l}" aria-disabled="${s}">
        ${h?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${i(r)}"
                aria-label="${l?"Collapse":"Expand"} ${i($)}" ${d?"disabled":""}>${x}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
        <button type="button" class="files-tree-select${m?" is-selected":""}" data-action="files-tree-select" data-path="${i(r)}"
          title="${i(L)}" ${d||s?"disabled":""}>
          <span class="files-icon" aria-hidden="true">📁</span>
          <span class="files-tree-label">${i($)}</span>
        </button>
      </div>`),!!l){if(c==="loading"){t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Loading…</div>`);return}if(c==="error"){t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Could not load folders.
            <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${i(r)}" ${d?"disabled":""}>Retry</button>
          </div>`);return}if(f){for(const A of c)a(A.path,o+1);c.length===0&&r===""&&t.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">No subfolders yet — destination will be Home.</div>`)}}};return a("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${t.join("")}</div>`}function sn(e){if(!As){if(!u){Ns();return}As=!0;try{N.event("session.expired"),ss(),as=!0,g={type:"info",message:e&&e.trim()?e:"Your session timed out. Please sign in again."},p()}finally{As=!1}}}let Le=[],Ca=[],Vt=[],Bt=[],ds="",cs="",zt="due",_t="asc",Aa="dtstart",ma="desc",Re=null,pt=null,Q=null,ce=null,le=!1,Ne=!1,ke=[],qs=null,ye="",pe=[],pa=!1,Oe=null,Te=null,$e=null,qt="",st={},ft=[],nt=!1,be=[];function b(e,t){as&&e==="error"||(e!=="error"&&(as=!1),g={type:e,message:t})}function T(){g=null,as=!1}function Jn(e){const t=String(e.step||"");t==="upgrade"||t==="initialize"||t==="permissions"||t==="database"?(Ye={step:t,message:e.message||(t==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:e.installUrl||"/portal/install/",productVersion:e.productVersion,configuredVersion:e.configuredVersion??null},typeof e.productVersion=="string"&&e.productVersion.trim()!==""&&(da=e.productVersion.trim())):Ye=null}function Yn(e){if(!(e instanceof Ce)||e.status!==503)return!1;const t=typeof e.payload.code=="string"?e.payload.code:"";return t!=="upgrade_required"&&t!=="not_configured"&&t!=="admin_password_missing"?!1:(Ye={step:t==="upgrade_required"?"upgrade":"initialize",message:e.message,installUrl:typeof e.payload.installUrl=="string"?e.payload.installUrl:"/portal/install/",productVersion:typeof e.payload.productVersion=="string"?e.payload.productVersion:void 0,configuredVersion:typeof e.payload.configuredVersion=="string"?e.payload.configuredVersion:null},Ye.productVersion&&(da=Ye.productVersion),!0)}async function Kn(){var e,t,a,r;N.event("bootstrap.start"),vl(o=>{sn(/timed\s*out|session expired/i.test(o)?o:"Your session timed out. Please sign in again.")}),wl(()=>{Ts()});try{const o=await E.installStatus();Jn(o)}catch(o){N.debug("bootstrap: /api/install/status failed",o instanceof Error?o.message:o)}try{const o=await E.ui();Es(o.ui),typeof o.version=="string"&&o.version.trim()!==""?da=o.version.trim():o.ui&&typeof o.ui.version=="string"&&o.ui.version.trim()!==""&&(da=o.ui.version.trim()),Ye==null||Ye.step}catch(o){N.debug("bootstrap: /api/ui failed",o instanceof Error?o.message:o),Yn(o)}if(Ye&&Ye.step!=="done"&&Ye.step!=="locked"){ss(),N.event("bootstrap.installGate",{step:Ye.step}),p();return}try{const o=await E.me();if(u=o.user,Es(o.ui),typeof o.version=="string"&&o.version.trim()!==""&&(da=o.version.trim()),N.event("bootstrap.session",{username:(u==null?void 0:u.username)??null}),Ts(),Ee())try{await xs()}catch(m){N.warn("admin.capabilities bootstrap",m instanceof Error?m.message:m)}if(Zs(),ht(y,v),await rt(),y==="admin"&&Ee()&&Rt())try{v==="overview"&&((e=je("overview"))==null?void 0:e.available)!==!1?await ns():v==="users"&&((t=je("users"))==null?void 0:t.available)!==!1?(await ca(),J&&(await Nt(J),await ua(J))):v==="settings"&&((a=je("settings"))==null?void 0:a.available)!==!1?await rs():v==="database"&&((r=je("database"))==null?void 0:r.available)!==!1&&await ls()}catch(m){N.warn("admin bootstrap load",m instanceof Error?m.message:m)}}catch(o){o instanceof Ce&&o.status===401?(ss(),N.event("bootstrap.anonymous")):(N.error("bootstrap failed",o instanceof Error?o.message:o),b("error",o instanceof Error?o.message:"Failed to load"))}p()}async function rt(){N.debug("loadHome");const[e,t,a]=await Promise.all([E.calendars(),E.directory().catch(()=>({users:[]})),E.addressbooks()]);if(de=e.calendars,ra=t.users,Me=a.addressbooks,N.event("loadHome",{calendars:de.length,addressBooks:Me.length,directory:ra.length}),Xa.length===0)try{Xa=(await E.holidayCountries()).countries}catch{Xa=[]}if(ae=ae.filter(r=>de.some(o=>o.id===r)),B!==null&&!de.some(r=>r.id===B)&&(B=null,la=[],Se=!1,ze=null),ae.length===0){const r=nn();r?(ae=[r.id],B=r.id):de.length>0&&(ae=[de[0].id],B=de[0].id)}B===null&&ae.length>0&&(B=ae[0]),B!==null&&Se?await Ra(B):B!==null&&(la=[]),y==="calendars"&&await lt(),j!==null&&!Me.some(r=>r.id===j)&&(j=null,Et=[],fe=null,I=null,he=!1),et!==null&&!Me.some(r=>r.id===et)&&(et=null),j===null&&Me.length>0&&(j=Me[0].id),j!==null&&y==="contacts"&&await Ht(j),y==="tasks"&&await Wt(),y==="notes"&&await Ea(),y==="files"&&await Tt()}async function Ra(e){la=(await E.shares(e)).shares}function nn(){const e=de.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const r=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return r==="default"||o==="default"||o==="default calendar"};return e.find(t)??e[0]??null}function ve(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${r}`}function Gn(e,t){const a=new Date(e,t,1),r=new Date(e,t+1,0);return{from:ve(a),to:ve(r)}}function Is(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,r,o]=e.split("-").map(Number);return new Date(a,r-1,o)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,r,o]=e.slice(0,10).split("-").map(Number);return new Date(a,(r||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Qn(e){const t=Is(e.start);if(!e.end)return[ve(t)];let a=Is(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ve(t)];const r=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),m=new Date(a.getFullYear(),a.getMonth(),a.getDate());let s=0;for(;o<=m&&s++<370;)r.push(ve(o)),o.setDate(o.getDate()+1);return r.length?r:[ve(t)]}function Ls(e,t){const a=e.slice(0,10),r=(t||a).slice(0,10);if(a===r){const L=Ba(a);return{start:L.start,end:L.end}}const[o,m,s]=a.split("-").map(Number),[l,c,f]=r.split("-").map(Number),h=jt(new Date(o,m-1,s,9,0,0,0)),$=jt(new Date(l,c-1,f,17,0,0,0));return{start:h,end:$}}function Xn(e,t){const a=fa(e);let r=t?fa(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(e).getTime()){const m=Is(t);m.setDate(m.getDate()-1),r=ve(m)}}return{start:a,end:r}}async function lt(){const e=ae.filter(r=>de.some(o=>o.id===r));if(e.length===0){oa=[];return}const{from:t,to:a}=Gn(Mt.y,Mt.m);Cs=!0,N.debug("loadMonthEvents",{selectedIds:e,from:t,to:a});try{const o=(await Promise.all(e.map(async m=>(await E.calendarEvents(m,t,a)).events.map(l=>({...l,instanceId:m}))))).flat();o.sort((m,s)=>{const l=m.start||"",c=s.start||"";return l!==c?l<c?-1:1:(m.summary||"").localeCompare(s.summary||"")}),oa=o,N.event("monthEvents.loaded",{calendarIds:e,count:oa.length,from:t,to:a})}catch(r){oa=[],N.warn("loadMonthEvents failed",r instanceof Error?r.message:r)}finally{Cs=!1}}function Zn(e){const t=de.find(a=>a.id===e);return t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6"}function er(e){ae.includes(e)?(ae=ae.filter(t=>t!==e),B===e&&(B=ae[0]??null)):(ae=[...ae,e],B=e)}function tr(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function ar(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Os())} ${t}`}function sr(){const e=de.filter(D=>ae.includes(D.id)),t=e.length===0?"No calendar selected":e.length===1?e[0].displayname:`${e.length} calendars`,a=Mt.y,r=Mt.m,o=new Date(a,r,1),m=Ps(),s=(o.getDay()-m+7)%7,l=new Date(a,r+1,0).getDate(),c=new Date(a,r,0).getDate(),h=ve(new Date),$=rn(),L=new Map;for(const D of oa)for(const R of Qn(D)){const V=L.get(R)??[];V.push(D),L.set(R,V)}const x=[],A=Math.ceil((s+l)/7)*7;for(let D=0;D<A;D++){let R,V=!0,X;D<s?(R=c-s+D+1,V=!1,X=new Date(a,r-1,R)):D>=s+l?(R=D-(s+l)+1,V=!1,X=new Date(a,r+1,R)):(R=D-s+1,X=new Date(a,r,R));const ee=ve(X),ne=ee===h,ue=V?L.get(ee)??[]:[],Ve=Pa===ee?50:3,Ge=ue.slice(0,Ve),It=ue.length-Ge.length,He=Ge.map(P=>{var me;const Y=P.instanceId,xe=ar(P),We=Zn(Y),Qe=((me=de.find(ot=>ot.id===Y))==null?void 0:me.displayname)||"",S=Qe?`${xe} · ${Qe}`:xe;return`<button type="button" class="month-event${P.allDay?"":" is-timed"}" title="${i(S)}" style="--ev-color:${i(We)}"
            data-action="open-event" data-instance="${Y}" data-uri="${i(P.uri)}" ${d?"disabled":""}>${i(xe)}</button>`}).join(""),Gt=It>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${i(ee)}" title="Show all events this day" ${d?"disabled":""}>+${It} more</button>`:"",Qt=!V&&(R===1||D===s+l)?X.toLocaleString(void 0,{month:"short",day:"numeric"}):String(R),gt=B!==null?de.find(P=>P.id===B)??null:null,k=!!(gt&&!gt.readOnly&&(gt.canShare||gt.access==="readwrite"));x.push(`<div class="month-cell${V?"":" is-outside"}${ne?" is-today":""}${k?" is-clickable":""}"${k?` data-action="new-event-day" data-day="${i(ee)}" role="button" tabindex="0" title="Add event on ${i(ee)}"`:""}>
        <div class="month-daynum${ne?" is-today-num":""}">${i(Qt)}</div>
        <div class="month-events">${He}${Gt}</div>
      </div>`)}const _=e.length===0?de.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":Cs?'<p class="muted small month-empty-hint">Loading events…</p>':"",C=e.slice(0,6).map(D=>{const R=D.color&&D.color.length>=7?D.color.slice(0,7):D.color||"#3B82F6";return`<span class="cal-swatch" style="background:${i(R)};margin-top:0" title="${i(D.displayname)}"></span>`}).join("");return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${d?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${d?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${d?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i(tr(a,r))}</h2>
        <span class="month-cal-name muted small" title="${i(t)}">
          ${C}
          ${i(t)}
        </span>
      </div>
      ${_}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${$.map(D=>`<div class="month-dow">${i(D)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${x.join("")}
        </div>
      </div>
    </section>`}function fa(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ve(t)}function nr(){if(ka.timeFormat==="24h")return!1;if(ka.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Os(){return nr()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Ps(){var a;if(ka.weekStart==="monday")return 1;if(ka.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const r of e)try{const o=new Intl.Locale(r),m=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,s=m==null?void 0:m.firstDay;if(typeof s=="number")return s===7?0:s}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function rn(){const e=Ps(),t=new Date(2024,0,7+e),a=[];for(let r=0;r<7;r++){const o=new Date(t);o.setDate(t.getDate()+r),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function ln(e,t=15){const a=t*60*1e3,r=e.getTime();return r%a===0?new Date(r):new Date(Math.ceil(r/a)*a)}function jt(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function rr(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const r=e.slice(0,10),[o,m,s]=r.split("-").map(Number);return new Date(o,m-1,s).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Os()})}function Va(e){if(!e){const a=ln(new Date);return{date:ve(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ve(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Ba(e){const t=new Date,a=ve(t);if(e&&e!==a){const[m,s,l]=e.split("-").map(Number),c=new Date(m,s-1,l,9,0,0,0),f=new Date(m,s-1,l,10,0,0,0);return{start:jt(c),end:jt(f)}}const r=ln(t,15),o=new Date(r.getTime()+3600*1e3);return{start:jt(r),end:jt(o)}}function lr(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function ba(e){const{field:t,name:a,label:r,value:o,dateOnly:m=!1,required:s,disabled:l,allowClear:c=!0}=e,f=(U==null?void 0:U.field)===t,h=rr(o,m);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${i(t)}">
      <span class="dt-field-label">${i(r)}</span>
      <input type="hidden" name="${i(a)}" value="${i(o)}" ${s?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${i(t)}"
        data-dt-name="${i(a)}" data-dt-date-only="${m?"1":"0"}" data-dt-clear="${c?"1":"0"}"
        ${l?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${i(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!l?or(t,o,m,c):""}
    </div>`}function Us(e){var t;return e==="start"?String((w==null?void 0:w.start)||""):e==="end"?String((w==null?void 0:w.end)||""):e==="until"?((t=w==null?void 0:w.repeat)==null?void 0:t.until)||fa(w==null?void 0:w.start)||ve(new Date):e==="due"?Na(Q==null?void 0:Q.due):e==="dtstart"?Na(ce==null?void 0:ce.dtstart):e==="bulk-due"?Za:e==="birthday"?String((I==null?void 0:I.birthday)||""):""}function bt(e,t){if(e==="start"&&w){w={...w,start:t||""};return}if(e==="end"&&w){w={...w,end:t};return}if(e==="until"&&w){w={...w,repeat:{...w.repeat??us(),until:t,endMode:"until"}};return}if(e==="due"&&Q){if(t===null||t==="")Q={...Q,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))Q={...Q,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));Q={...Q,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&ce){if(t===null||t==="")ce={...ce,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))ce={...ce,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));ce={...ce,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&I){I={...I,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Za=t||"")}function or(e,t,a,r){const o=Va(t),m=(U==null?void 0:U.viewY)??Number(o.date.slice(0,4)),s=(U==null?void 0:U.viewM)??Number(o.date.slice(5,7))-1,l=Ps(),c=rn(),h=(new Date(m,s,1).getDay()-l+7)%7,$=new Date(m,s+1,0).getDate(),L=new Date(m,s,0).getDate(),x=o.date,A=o.hm,_=new Date(m,s,1).toLocaleString(void 0,{month:"long",year:"numeric"}),C=[],D=Math.ceil((h+$)/7)*7;for(let V=0;V<D;V++){let X,ee,ne=!1;V<h?(X=L-h+V+1,ee=new Date(m,s-1,X),ne=!0):V>=h+$?(X=V-(h+$)+1,ee=new Date(m,s+1,X),ne=!0):(X=V-h+1,ee=new Date(m,s,X));const ue=ve(ee),Ve=ue===x,Ge=ue===ve(new Date);C.push(`<button type="button" class="dt-day${ne?" is-outside":""}${Ve?" is-selected":""}${Ge?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${i(ue)}">${X}</button>`)}const R=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${lr().map(V=>{const X=(()=>{const[ee,ne]=V.split(":").map(Number);return new Date(2e3,0,1,ee,ne).toLocaleTimeString(void 0,Os())})();return`<button type="button" class="dt-time${V===A?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${V}" role="option" aria-selected="${V===A}">${i(X)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${i(_)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${c.map(V=>`<span class="dt-dow">${i(V)}</span>`).join("")}</div>
          <div class="dt-days">${C.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${i(e)}" ${r?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${R}
      </div>
    </div>`}function ir(){n.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const r=t.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const m=a.offsetWidth||320,s=a.offsetHeight||300;let l=r.bottom+6;l+s>window.innerHeight-o&&(l=Math.max(o,r.top-s-6));let c=r.left;c+m>window.innerWidth-o&&(c=Math.max(o,window.innerWidth-m-o)),c<o&&(c=o),a.style.top=`${Math.round(l)}px`,a.style.left=`${Math.round(c)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function us(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function dr(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function cr(){if(!kt||!w)return"";const e=w,t=e.repeat??us(),a=(t.freq||"").toUpperCase(),r=de.filter(x=>x.canShare||x.access==="readwrite"),o=de.filter(x=>x.id===e.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===e.instanceId?"selected":""}>${i(x.displayname)}</option>`).join(""),m=e.readOnly||!e.canWrite;let s,l;if(e.allDay)s=fa(e.start),l=fa(e.end);else{const x=e.start||"",A=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const _=Ls(x,A||null);s=_.start,l=_.end||""}else s=Na(e.start),l=Na(e.end)}const c=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(x=>x.toUpperCase())),h=dr(t),$=!!a&&h==="until",L=t.until||(h==="until"?fa(e.start)||ve(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${ct?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Yt()}
          ${!ct&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
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
              ${ba({field:"start",name:"start",label:"Start",value:s,dateOnly:e.allDay,required:!0,disabled:m,allowClear:!1})}
              ${ba({field:"end",name:"end",label:"End",value:l,dateOnly:e.allDay,disabled:m||$,allowClear:!$})}
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
                      ${c.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${f.has(x.code)?"checked":""} />
                              ${x.label}
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
                      ${h==="until"?ba({field:"until",name:"repeatUntil",label:"Until",value:L,dateOnly:!0,disabled:m,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${i(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${m?"":`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${ct?"Create event":"Save event"}</button>
                     ${ct?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${d?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function ur(e,t){const a=de.find(r=>r.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:us(),readOnly:!1,canWrite:!0}}async function Ht(e){Et=(await E.contacts(e,ia)).contacts,fe!==null&&!Et.some(a=>a.uri===fe)&&(fe=null,he||(I=null,Ie=null,Ke=null,tt=!1))}async function Wt(){const e=await E.tasks({q:ds,sort:zt,order:_t});Le=e.tasks,Vt=e.calendars;const t=new Set(Le.map(a=>ge(a.instanceId,a.uri)));ke=ke.filter(a=>t.has(a)),Re!==null&&!Le.some(a=>`${a.instanceId}|${a.uri}`===Re)&&(Re=null,le||(Q=null))}async function Ea(){const e=await E.notes({q:cs,sort:Aa,order:ma});Ca=e.notes,Bt=e.calendars,pt!==null&&!Ca.some(t=>`${t.instanceId}|${t.uri}`===pt)&&(pt=null,Ne||(ce=null))}function ge(e,t){return`${e}|${t}`}function on(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Na(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=r=>String(r).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Jt(e,t,a,r,o,m=""){const s=a===t,l=s?r==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${s?" is-sorted":""}${m?" "+m:""}`}" data-action="sort-${o}" data-sort="${i(t)}" role="columnheader" tabindex="0">${i(e)}${l}</th>`}async function mr(e){if(j===null)return;const t=await E.getContact(j,e);fe=e,he=!1;const a=t.contact;I={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??dn(),birthday:a.birthday??null},Ie=a.photoDataUri??(a.hasPhoto&&j!==null?`${E.contactPhotoUrl(j,e)}?t=${Date.now()}`:null),Ke=null,tt=!1,qe=!0}function pr(){he=!0,fe=null,qe=!0,I={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},Ie=null,Ke=null,tt=!1}function dn(){return{street:"",city:"",region:"",postal:"",country:""}}function fr(e){return new Promise((t,a)=>{const r=new FileReader;r.onload=()=>{const o=String(r.result??""),m=o.indexOf(",");t(m>=0?o.slice(m+1):o)},r.onerror=()=>a(new Error("Failed to read photo file")),r.readAsDataURL(e)})}function cn(e,t={}){const a=!!u&&y==="admin"&&Ee()&&Rt(),m=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${a?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${i(a?"Administration Portal":"User Portal")}</span></span>`,s=u?i(u.displayname||u.username):"",l=Rt()?`<button type="button" class="user-menu-item${y==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",f=u?`<div class="user-menu${Fe?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${Fe?"true":"false"}"
              title="${s}">
              <span class="user-menu-name">${s}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${Fe?"":"hidden"}>
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
        </nav>`,L=!(Se||Be||ze!==null||et!==null||kt||qe||ut)?Yt():"",x=t.tabs&&t.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${t.tabs}
        </div>
      </div>`:"",A=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${i(da)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(El)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${h}
      ${x}
    </div>
      <main class="container">
        ${L}
        ${e}
      </main>
      ${A}
      ${ql()}
      ${br()}
      ${hr()}`}function Yt(){return g?Lt(g.type,g.message,{dismissible:!0}):""}function ms(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Ct(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),r=t%60;return a>0?`${a}m ${r}s`:`${r}s`}function At(){es!==null&&(clearInterval(es),es=null)}function un(){At(),es=setInterval(()=>{if(!G||G.phase==="done"||G.phase==="error"){At();return}G={...G,elapsedSec:Math.floor((Date.now()-G.startedAt)/1e3)},G.phase==="processing"&&fn(G)},1e3)}function Kt(e,t={}){G&&(G={...G,phase:e,elapsedSec:Math.floor((Date.now()-G.startedAt)/1e3),...t},p())}function mn(){At(),G=null,p()}function pn(e){!G||G.phase==="done"||G.phase==="error"||(G={...G,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-G.startedAt)/1e3)},fn(G))}function fn(e){const t=n.querySelector("[data-import-status-line]"),a=n.querySelector(".import-progress-bar"),r=n.querySelector(".import-progress-track"),o=n.querySelector("[data-import-counts]"),m=e.kind==="calendar"?"items":"contacts";let s;if(e.phase==="processing"&&e.processTotal>0)s=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${m} (${e.processPercent??0}%) · ${Ct(e.elapsedSec)}`;else if(e.phase==="processing")s=`Importing on server… ${Ct(e.elapsedSec)}`;else return;t&&(t.textContent=s),o&&(o.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),r&&e.processPercent!==null&&(r.setAttribute("aria-valuenow",String(e.processPercent)),r.removeAttribute("aria-valuetext"))}function br(){if(!G)return"";const e=G,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",r=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",o=(()=>{const l=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return l.map((h,$)=>{let L="pending";return e.phase==="done"||$<f?L="done":$===f&&(L=(e.phase==="error","active")),`<li class="import-step import-step-${L}"><span class="import-step-icon" aria-hidden="true">${L==="done"?"✓":L==="active"?"●":"○"}</span> ${i(h.label)}</li>`}).join("")})();let m="";if(t){let l=null;e.phase==="reading"&&e.readPercent!==null?l=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(l=Math.min(100,Math.max(0,e.processPercent)));const c=l===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=l!==null?` style="width:${l}%"`:"",h=e.kind==="calendar"?"items":"contacts";let $;e.phase==="reading"?$=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?$="Uploading to server…":e.processTotal>0?$=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${h} (${e.processPercent??0}%) · ${Ct(e.elapsedSec)}`:$=`Importing on server… ${Ct(e.elapsedSec)}`;const L=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';m=`
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
        ${L}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?m=`
        ${Lt("success",`Success. ${e.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · Took ${i(Ct(e.elapsedSec))}
        </p>`:m=`
        ${Lt("error",`Failed. ${e.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${i(e.fileName)}</span>
          · After ${i(Ct(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const s=t?'<p class="muted small" style="margin:0">Please wait…</p>':Hs([{label:"Close",action:"close-import-progress",variant:"primary"}]);return we({title:r,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:t,lockBackdrop:t,body:m,footer:s})}function Ta(){ts!==null&&(clearInterval(ts),ts=null)}function gr(){Ta(),ts=setInterval(()=>{if(!H||H.phase==="done"||H.phase==="error"){Ta();return}H={...H,elapsedSec:Math.floor((Date.now()-H.startedAt)/1e3)},xa(H)},1e3)}function bn(){Ta(),H=null,p()}function gn(e){return e.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*e.bytesSent/e.bytesTotal))):e.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*e.completedFiles/e.totalFiles))):null}function xa(e){if(!n.querySelector("[data-files-upload-progress]"))return;const t=n.querySelector(".files-upload-progress-bar"),a=n.querySelector(".files-upload-progress-track"),r=n.querySelector("[data-files-upload-status]"),o=n.querySelector("[data-files-upload-current]"),m=gn(e),s=e.phase==="uploading"?`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${m!==null?` (${m}%)`:""} · ${Ct(e.elapsedSec)}`:(r==null?void 0:r.textContent)||"";r&&e.phase==="uploading"&&(r.textContent=s),o&&e.phase==="uploading"&&(o.textContent=e.currentName||"",o.title=e.currentName||""),t&&m!==null&&(t.classList.remove("is-indeterminate"),t.style.width=`${m}%`),a&&m!==null&&(a.setAttribute("aria-valuenow",String(m)),a.removeAttribute("aria-valuetext"))}function hr(){if(!H)return"";const e=H,t=e.phase==="uploading",a=e.phase==="done"?"Upload finished":e.phase==="error"?"Upload failed":"Uploading…",r=gn(e),o=r===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",m=r!==null?` style="width:${r}%"`:"";let s="";if(t){const c=`Uploading ${e.completedFiles.toLocaleString()} / ${e.totalFiles.toLocaleString()} file${e.totalFiles===1?"":"s"}${e.failedFiles?` · ${e.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${Ct(e.elapsedSec)}`,f=e.bytesTotal>0?`${ms(e.bytesSent)} / ${ms(e.bytesTotal)}`:"";s=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Uploading to
          <span class="mono">${i(ye===""?"Home":ye)}</span>
          ${f?` · <span class="muted">${i(f)}</span>`:""}
        </p>
        <div class="import-progress-track files-upload-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${r!==null?`aria-valuenow="${r}"`:'aria-valuetext="In progress"'}
          aria-label="Upload progress">
          <div class="${o}"${m}></div>
        </div>
        <p class="import-status-line" data-files-upload-status>${i(c)}</p>
        <p class="muted small mono files-upload-current" data-files-upload-current title="${i(e.currentName)}">${i(e.currentName)}</p>
        <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(e.phase==="done")s=`
        ${Lt("success",e.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
        <p class="muted small" style="margin:0">Took ${i(Ct(e.elapsedSec))}</p>`;else{const c=e.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${e.errorSamples.slice(0,8).map(f=>`<li>${i(f)}</li>`).join("")}${e.errorSamples.length>8?`<li>…and ${e.errorSamples.length-8} more</li>`:""}</ul>`:"";s=`
        ${Lt("error",e.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
        ${c}
        <p class="muted small" style="margin:0.75rem 0 0">After ${i(Ct(e.elapsedSec))}</p>`}const l=t?'<p class="muted small" style="margin:0">Please wait…</p>':Hs([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return we({title:a,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:t,lockBackdrop:t,body:s,footer:l})}function Fs(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}async function hn(e,t,a){const r=t.replace(/\\/g,"/").split("/").map(m=>m.trim()).filter(Boolean);let o=e;for(const m of r){const s=Fs(o,m);if(a.has(s)){o=s;continue}try{await E.filesMkdir(o,m),N.event("files.mkdir",{path:o,name:m,via:"upload-folder"})}catch(l){if(!(l instanceof Ce&&l.status===409))throw l}a.add(s),o=s}}function yn(e,t){return new Promise((a,r)=>{const o=new FileReader;o.onprogress=m=>{m.lengthComputable&&m.total>0?t(Math.min(100,Math.round(m.loaded/m.total*100))):t(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>r(o.error??new Error("Failed to read file")),o.readAsText(e)})}function $n(){const e=Ye,t=e&&(e.step==="upgrade"||e.step==="initialize"||e.step==="permissions"||e.step==="database"),a=(e==null?void 0:e.installUrl)||"/portal/install/";let r="";if(t&&e){const m=e.step==="upgrade"?"Server upgrade required":"Setup incomplete",s=e.step==="upgrade"&&(e.configuredVersion||e.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${i(String(e.configuredVersion||"—"))}</span>
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
        </p>`}const o=d||!!t;n.innerHTML=cn(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function yr(){if(!u){$n();return}const e=de.filter(S=>S.canShare),t=de.filter(S=>!S.canShare),a=de.find(S=>S.id===B)??null,r=e.map(S=>{const me=ae.includes(S.id),ot=me?" is-selected":"",Ja=S.id===B?" is-primary":"",Rs=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Vs=zs(S.access)+(S.readOnly?'<span class="badge">read-only</span>':"")+(S.holidaysCountry?`<span class="badge badge-admin">holidays ${i(S.holidaysCountry)}</span>`:"");return`<div class="cal-row${ot}${Ja}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="Toggle on the month grid">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${me?"checked":""} ${d?"disabled":""} />
          </label>
          ${Rs}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${Vs}</span>
            <span class="muted small mono cal-row-uri">${i(S.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${S.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${S.id}" ${d?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map(S=>{const me=ae.includes(S.id),ot=me?" is-selected":"",Ja=S.id===B?" is-primary":"",Rs=S.color?`<span class="cal-swatch" style="background:${i(S.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Vs=S.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${ot}${Ja}" data-action="select-cal" data-id="${S.id}" role="button" tabindex="0" title="${i(Vs)}">
          <label class="cal-row-check" title="Show events on the month grid" onclick="event.stopPropagation()">
            <input type="checkbox" data-action="toggle-cal" data-id="${S.id}" ${me?"checked":""} ${d?"disabled":""} />
          </label>
          ${Rs}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(S.displayname)}</span>
            <span class="cal-row-badges">${zs(S.access)}</span>
            <span class="muted small">${S.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="export-cal" data-id="${S.id}" ${d?"disabled":""} title="Export as .ics">Export</button>
          </span>
        </div>`}).join(""),m=ra.map(S=>`<option value="${i(S.username)}">${i(S.displayname)} (${i(S.username)})</option>`).join(""),s=la.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':la.map(S=>`<tr>
                <td>
                  <strong>${i(S.displayname||S.username||S.href)}</strong>
                  <div class="muted small mono">${i(S.username||S.href)}</div>
                </td>
                <td>${zs(S.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(S.href)}" ${d?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),l=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",c=!!(a&&a.readOnly),f=Se&&a&&a.canShare?we({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
                ${Yt()}
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
                  ${De(`Share “${a.displayname}”`,"share")}
                  ${c?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${ra.length===0?"disabled":""}>
                        <option value="">${ra.length?"Select user…":"No other users"}</option>
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
                      <button type="submit" class="btn btn-primary" ${d||ra.length===0?"disabled":""}>Share</button>
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
                  ${De("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${d?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${d||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${d||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",h=ze!==null?de.find(S=>S.id===ze&&S.canShare)??null:null,$=h?we({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
              ${Yt()}
              <p>You are about to permanently delete <strong>${i(h.displayname)}</strong>
                <span class="muted small mono">(${i(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${gs({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${h.id}"`}]}):"",L=Be?we({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
              ${Yt()}
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
                    ${Xa.map(S=>`<option value="${i(S.code)}">${i(S.name)} (${i(S.code)})</option>`).join("")}
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
              ${De("Owned","owned")}
            </div>
            <p class="muted small" style="margin:0 0 0.65rem">
              Check one or more calendars to view events.
              Underlined name is primary for new events.
            </p>
            <div class="cal-list calendars-owned-list">
              ${r||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${De("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${d?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${sr()}
      </div>
      ${L}
      ${f}
      ${$}
      ${cr()}`,A=Me.map(S=>`<div class="cal-row${S.id===j?" is-selected":""}" data-action="select-ab" data-id="${S.id}" role="button" tabindex="0">
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
        </div>`).join(""),_=Me.find(S=>S.id===j)??null,C=Et.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${ia?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Et.map(S=>{const me=!he&&S.uri===fe?" is-selected":"",ot=i((S.displayname||"?").slice(0,1).toUpperCase()),Ja=S.hasPhoto&&j!==null?`<img class="contact-avatar" src="${i(E.contactPhotoUrl(j,S.uri))}" alt="" loading="lazy" data-avatar-fallback="${ot}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${ot}</span>`;return`<tr class="contact-table-row${me}" data-action="select-contact" data-uri="${i(S.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ja}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(S.displayname)}</span>
                      ${S.org?`<span class="muted small contact-name-secondary">${i(S.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(S.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(S.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(S.org||"—")}</span></td>
              </tr>`}).join(""),D=I,R=Array.isArray(D==null?void 0:D.emails)&&D.emails.length>0?D.emails:[""],V=Array.isArray(D==null?void 0:D.phones)&&D.phones.length>0?D.phones:[{type:"cell",value:""}],X=(D==null?void 0:D.address)??dn(),ee=R.map((S,me)=>`<div class="multi-row" data-multi="email" data-idx="${me}">
          <input type="email" name="email_${me}" value="${i(S??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${me}" ${R.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ne=V.map((S,me)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${me}">
          <select name="phone_type_${me}" aria-label="Phone type">
            ${["cell","work","home","other"].map(ot=>`<option value="${ot}" ${((S==null?void 0:S.type)??"other")===ot?"selected":""}>${ot}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${me}" value="${i((S==null?void 0:S.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${me}" ${V.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ue=Array.isArray(D==null?void 0:D.custom)?D.custom:[],Ve=ue.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ue.map((S,me)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${me}">
                <input type="text" name="custom_label_${me}" value="${i(S.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${me}" value="${i(S.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${me}" title="Remove">×</button>
              </div>`).join(""),Ge=qe&&D&&_?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${he?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Yt()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${Ie?`<img src="${i(Ie)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((D.fullname||D.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        ${Ie?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${d?"disabled":""} hidden />
                      </label>
                      ${Ie||D.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${d?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${i(D.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${i(D.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${i(D.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${i(D.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${i(D.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${ee}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${R.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${ne}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${V.length>=10?"disabled":""}>+ Phone</button>
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
                    <input type="url" name="url" value="${i(D.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${ba({field:"birthday",name:"birthday",label:"Birthday",value:D.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${Ve}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ue.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${i(D.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${d?"disabled":""}>${he?"Create contact":"Save contact"}</button>
                    ${!he&&D.uri?`<button type="button" class="btn" data-action="export-contact" ${d?"disabled":""}>Export .vcf</button>`:""}
                    ${he?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${d?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${d?"disabled":""}>Cancel</button>
                    ${!he&&D.uri?`<span class="muted small mono">${i(D.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",It=ut&&_?we({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
                ${Yt()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${i(_.uri)} · ${_.cardCount} contact${_.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${i(_.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${i(_.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${d?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(_.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${De("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${d?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${d?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${d?"disabled":""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",He=et!==null?Me.find(S=>S.id===et)??null:null,Gt=He?we({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
              ${Yt()}
              <p>You are about to permanently delete <strong>${i(He.displayname)}</strong>
                <span class="muted small mono">(${i(He.uri)})</span>.</p>
              <p class="muted small">${(He.cardCount??0)>0?`All ${He.cardCount} contact${He.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              ${gs({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:d},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${He.id}"`}]}):"",Qt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${De("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${A||'<p class="muted">No address books yet. Create one below.</p>'}
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
          ${_?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${De("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${i(ia)}" aria-label="Search contacts" ${d?"disabled":""} />
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
                        ${C}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Gt}
      ${It}
      ${Ge}`,gt=y==="calendars"?"my-calendars":y==="contacts"?"my-contacts":y==="tasks"?"tasks":y==="notes"?"notes":y==="files"?"files":"administration",k=Fr(),P=Mr(),Y=wr(),xe=Lr(),We=y==="calendars"?x:y==="contacts"?Qt:y==="tasks"?k:y==="notes"?P:y==="files"?Y:xe,Qe=y==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${Sr()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${v==="overview"?"admin-overview":v==="users"?"admin-users":v==="settings"?"admin-settings":"admin-database"}"
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
            data-info="${gt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;n.innerHTML=cn(We,{tabs:Qe}),document.body.classList.toggle("cal-modal-open",Se||Be||ze!==null||et!==null||kt||qe||ut||G!==null||H!==null||mt||Oe!==null||Te!==null||$e!==null||nt||Je||Ue||vt!==null||$a||va||Xe!==null||dt!==null||Ae!==null),document.body.classList.toggle("layout-contacts",y==="contacts"),document.body.classList.toggle("layout-calendars",y==="calendars"),document.body.classList.toggle("layout-tasks",y==="tasks"||y==="notes"),document.body.classList.toggle("layout-files",y==="files"),document.body.classList.toggle("layout-admin",y==="admin")}function $r(e){const t=e?e.split("/").filter(Boolean):[];let a="";const r=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${d?"disabled":""}>Home</button>`];for(const o of t){a=a?`${a}/${o}`:o;const m=a;r.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),r.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${i(m)}" ${d?"disabled":""}>${i(o)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${r.join("")}</nav>`}function _a(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function vr(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function wr(){const e=qs;if(!e)return`<div class="card"><p class="muted">${pa||d?"Loading…":"Unable to load file storage status."}</p></div>`;if(!e.enabled)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${De("Files","files","h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;if(!e.ready)return`<div class="portal-grid portal-grid-files">
        <section class="card">
          ${De("Files","files","h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${i(e.error||"File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${i(e.davPath)}</span></p>
        </section>
      </div>`;const t=e.quotaBytes>0?`${_a(e.usedBytes)} used · ${_a(e.availableBytes)} free of ${_a(e.quotaBytes)}`:`${_a(e.usedBytes)} used · ${_a(e.availableBytes)} free (no app quota)`,a=e.quotaBytes>0?Math.min(100,Math.round(100*e.usedBytes/e.quotaBytes)):0,r=be.length,o=pe.length>0&&pe.every(C=>be.includes(C.path)),m=r>0,s=pe.filter(C=>C.type==="dir").length,l=pe.length-s,c=r>0?`<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${r} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${d?"disabled":""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${d?"disabled":""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${d?"disabled":""}>Delete</button>
            </div>
          </div>`:"",f=(()=>{if(pa&&pe.length===0)return"Loading…";if(pe.length===0)return"0 items";const C=[];s>0&&C.push(`${s} folder${s===1?"":"s"}`),l>0&&C.push(`${l} file${l===1?"":"s"}`);const D=`${pe.length} item${pe.length===1?"":"s"}`;return C.length===2?`${D} · ${C.join(", ")}`:C[0]??D})(),h=pe.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':pe.map(C=>{const D=be.includes(C.path),R=C.type==="dir"?"📁":"📄",V=C.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${i(C.path)}" ${d?"disabled":""}>
                      <span class="files-icon" aria-hidden="true">${R}</span>${i(C.name)}
                    </button>`:`<span class="files-name"><span class="files-icon" aria-hidden="true">${R}</span>${i(C.name)}</span>`,X=C.type==="dir"?"—":_a(C.size);return`<tr class="files-row${D?" is-checked":""}" data-path="${i(C.path)}" data-type="${C.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${i(C.path)}"
                    ${D?"checked":""} ${d?"disabled":""}
                    aria-label="Select ${i(C.name)}" />
                </td>
                <td class="files-col-name">${V}</td>
                <td class="files-col-size mono">${X}</td>
                <td class="files-col-mtime hide-sm">${i(vr(C.mtime))}</td>
                <td class="files-col-actions">
                  ${C.type==="file"?`<a class="btn btn-ghost btn-small" href="${i(E.filesDownloadUrl(C.path))}" download="${i(C.name)}" data-action="files-download">Download</a>`:""}
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${i(C.path)}" ${d?"disabled":""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${i(C.path)}" ${d?"disabled":""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${i(C.path)}" data-name="${i(C.name)}" ${d?"disabled":""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${i(C.path)}" data-name="${i(C.name)}" ${d?"disabled":""}>Delete</button>
                </td>
              </tr>`}).join(""),$=Oe!==null?(()=>{const C=pe.find(R=>R.path===Oe),D=(C==null?void 0:C.name)??"";return we({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                    <input type="hidden" name="path" value="${i(Oe)}" />
                    <label>New name
                      <input type="text" name="newName" value="${i(D)}" required maxlength="255" autocomplete="off" />
                    </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:d}]})})():"",L=Te!==null&&Te.length>0?(()=>{const C=Te,D=C.length>1,R=pe.find(ee=>ee.path===C[0]),V=D?`Delete ${C.length} items`:`Delete ${(R==null?void 0:R.type)==="dir"?"folder":"file"}`,X=D?`<p style="margin:0 0 0.75rem">Delete <strong>${C.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${C.slice(0,12).map(ee=>{const ne=pe.find(ue=>ue.path===ee);return`<li><span class="mono">${i((ne==null?void 0:ne.name)??ee)}</span></li>`}).join("")}
                   ${C.length>12?`<li>…and ${C.length-12} more</li>`:""}
                 </ul>`:`<p style="margin:0">Delete <strong>${i((R==null?void 0:R.name)??C[0])}</strong>?${(R==null?void 0:R.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return we({id:"files-delete-modal",title:V,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:X,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:d}]})})():"",x=$e!==null&&$e.paths.length>0?(()=>{const C=$e.op,D=$e.paths,R=D.length>1,V=pe.find(Ve=>Ve.path===D[0]),X=(V==null?void 0:V.name)??za(D[0]),ee=R?`${C==="copy"?"Copy":"Move"} ${D.length} items`:`${C==="copy"?"Copy":"Move"} ${(V==null?void 0:V.type)==="dir"?"folder":"file"}`,ne=qt===""?"Home":qt,ue=os(qt,D);return we({id:"files-transfer-modal",title:ee,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                    ${R?`<p class="muted small" style="margin:0 0 0.75rem">${D.length} items will be ${C==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${i(X)}</span></p>`}
                    <input type="hidden" name="toPath" value="${i(qt)}" />
                    <div class="files-transfer-dest">
                      <div class="files-transfer-dest-head">
                        <span class="files-transfer-dest-label">Destination folder</span>
                        <span class="muted small mono files-transfer-dest-value" title="${i(ne)}">${i(ne)}</span>
                      </div>
                      ${Wn()}
                      <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                        Click a folder to select it. Use ▸ to expand. Home is the root of your file storage.
                      </p>
                    </div>
                    ${R?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${i(X)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${C==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                          </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:C==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:d||ue}]})})():"",A=nt?we({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${i(ye===""?"Home":ye)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:d}]}):"",_=mt?we({id:"files-upload-picker-modal",title:"Upload",titleId:"files-upload-picker-title",closeAction:"files-upload-picker-close",size:"md",body:`
                <p class="muted small" style="margin:0 0 0.75rem">
                  Destination:
                  <span class="mono">${i(ye===""?"Home":ye)}</span>
                </p>
                <div class="files-upload-dropzone${Dt?" is-dragover":""}"
                  data-files-upload-dropzone
                  tabindex="0"
                  role="button"
                  aria-label="Drop files or folders to upload">
                  <div class="files-upload-dropzone-icon" aria-hidden="true">⬆</div>
                  <p class="files-upload-dropzone-title">Drop files or folders here</p>
                  <p class="muted small" style="margin:0.35rem 0 0">
                    Nested folders keep their structure. You can mix files and folders in one drop.
                  </p>
                </div>
                <div class="files-upload-browse-row">
                  <label class="btn btn-primary btn-small files-upload-btn" ${d?"aria-disabled=true":""}>
                    Choose files…
                    <input type="file" data-action="files-upload-pick-files" ${d?"disabled":""} multiple hidden />
                  </label>
                  <label class="btn btn-ghost btn-small files-upload-btn" ${d?"aria-disabled=true":""}>
                    Choose folder…
                    <input type="file" data-action="files-upload-pick-folder" ${d?"disabled":""}
                      multiple webkitdirectory directory hidden />
                  </label>
                </div>
                <p class="muted small" style="margin:0.75rem 0 0">
                  Browsers need separate pickers for files vs folders; drag-and-drop supports both at once.
                </p>`,footer:[{label:"Cancel",action:"files-upload-picker-close",variant:"ghost"}]}):"";return`<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${De("Files","files","h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${a}%"></div>
            </div>
            <span>${i(t)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${$r(ye)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${d||pa?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${d?"disabled":""}>New folder</button>
            <button type="button" class="btn btn-primary btn-small" data-action="files-upload-open" ${d?"disabled":""}
              title="Upload files or folders into this folder">Upload</button>
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
                    ${d||pe.length===0?"disabled":""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pa&&pe.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':h}
            </tbody>
          </table>
        </div>
        <div class="files-status-bar muted small" role="status" aria-live="polite">
          ${r>0?`${r} of ${pe.length} selected`:i(f)}
        </div>
      </section>
      ${$}
      ${L}
      ${x}
      ${A}
      ${_}
    </div>`}function za(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function Sr(){const e=["overview","settings","users","database"],t={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},a=W==null?void 0:W.pages,r=new Map;if(a)for(const o of a)Ss(o.id)&&r.set(o.id,o);return e.map(o=>{const m=r.get(o),s=(m==null?void 0:m.label)||t[o],l=(m==null?void 0:m.status)??(o==="overview"?"read-only":"full"),c=(m==null?void 0:m.available)===!1;return`<button type="button" role="tab" class="tab-btn${v===o?" is-active":""}${c?" is-gated":""}"
            data-action="admin-page" data-admin-page="${o}"
            aria-selected="${v===o}"
            title="${i(s)}${c?" — "+Da(l):""}">
            ${i(s)}
          </button>`}).join("")}function ps(e){const t=je(e),a=(t==null?void 0:t.status)??"coming-soon",r=(t==null?void 0:t.label)??e,o=(t==null?void 0:t.summary)||"This area is not available in portal Administration yet.",m=Da(a);return`<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${Fa(a)}">${i(m)}</span>
        <h2 class="admin-coming-soon-title">${i(r)}</h2>
      </div>
      <p class="muted">${i(o)}</p>
    </section>`}function ga(e,t){return`<span class="badge ${e?"badge-ok":"badge-off"}">${i(t)}: ${e?"On":"Off"}</span>`}function ha(e){return`<span class="badge ${e?"badge-ok":"badge-off"}">${e?"On":"Off"}</span>`}function ja(e,t,a){return`<div class="admin-stat-card">
      <div class="admin-stat-value mono">${i(String(t))}</div>
      <div class="admin-stat-label">${i(e)}</div>
      ${a?`<div class="admin-stat-hint muted small">${i(a)}</div>`:""}
    </div>`}function kr(){const e=je("overview");if(e&&e.available===!1)return ps("overview");const t=`<p class="muted small admin-session-line">
      Signed in as <span class="mono">${i((u==null?void 0:u.username)??"")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;let a="",r="";if(F&&!O)r='<section class="card"><p class="muted">Loading overview…</p></section>';else if(K&&!O)r=`<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${i(K)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d?"disabled":""}>Retry</button>
      </section>`;else if(O){const o=O,m=o.services,s=o.links??{},l=e?`<span class="badge ${Fa(e.status)}">${i(Da(e.status))}</span>`:"",c=o.version?i(o.version):"—",f=o.git?i(o.git):"";a=`
        <section class="card admin-about-card">
          <div class="section-header">
            ${De("About this system","admin-overview")}
            <div class="section-actions">
              ${l}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${d||F?"disabled":""}>Refresh</button>
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
                    <tr><td>Administration</td><td>${ha(m.administration!==!1&&m.webAdmin!==!1)}</td></tr>
                    <tr><td>CalDAV</td><td>${ha(!!m.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${ha(!!m.carddav)}</td></tr>
                    <tr><td>Files</td><td>${ha(!!m.files)}</td></tr>
                    <tr><td>Tasks</td><td>${ha(!!m.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${ha(!!m.notes)}</td></tr>
                    <tr><td>Push</td><td>${ha(!!m.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${t}
        </section>`;const h=o.nbusers??o.users,$=o.nbcalendars??o.calendars,L=o.nbevents??o.events,x=o.nbbooks??o.addressBooks,A=o.nbcontacts??o.contacts;r=`
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${ja("Registered users",h,"Users")}
            ${ja("Calendars",$,"CalDAV")}
            ${ja("Events",L,"CalDAV")}
            ${ja("Address books",x,"CardDAV")}
            ${ja("Contacts",A,"CardDAV")}
          </div>
          <div class="admin-service-row">
            ${ga(m.administration!==!1&&m.webAdmin!==!1,"Administration")}
            ${ga(!!m.caldav,"CalDAV")}
            ${ga(!!m.carddav,"CardDAV")}
            ${ga(!!m.files,"Files")}
            ${ga(!!m.tasks,"Tasks")}
            ${ga(!!m.notes,"Notes")}
            ${ga(!!m.push,"Push")}
          </div>
        </section>`}else r=`<section class="card">
        ${De("System snapshot","admin-overview")}
        ${t}
      </section>`;return`${a}
      ${r}`}function Dr(){const e=_e.trim().toLowerCase();return e?te.filter(t=>t.username.toLowerCase().includes(e)||(t.displayname||"").toLowerCase().includes(e)||(t.email||"").toLowerCase().includes(e)):te}function Cr(){return Je?we({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:d},{label:"Create user",type:"submit",variant:"primary",disabled:d}]}):""}function Ar(){if(!Ue||!z)return"";const e=z;return we({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
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
            </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:d},{label:"Save changes",type:"submit",variant:"primary",disabled:d}]})}function Er(){if(!vt)return"";const e=vt,t=z&&z.username.toLowerCase()===e.toLowerCase()?z:te.find(r=>r.username.toLowerCase()===e.toLowerCase())??null,a=t?`${t.displayname||t.username} (${t.username})`:e;return we({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
          <p>You are about to permanently delete <strong>${i(a)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${gs({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:Pt,disabled:d,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:d},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:d||!Pt,attrs:`data-username="${i(e)}"`}]})}function Nr(){if(!J)return"";if(re&&!z)return`<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${i(J)}</span>…</p>
      </section>`;if(Pe&&!z)return`<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${i(Pe)}</p>
      </section>`;if(!z)return"";const e=z,t=Ia&&Ut.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':Ut.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':Ut.map(c=>`<tr>
          <td class="mono">${i(c.uri)}</td>
          <td>${i(c.displayname)}</td>
          <td class="hide-sm">${i(String(c.eventCount))}${c.todos?' <span class="badge badge-admin">tasks</span>':""}${c.notes?' <span class="badge badge-admin">notes</span>':""}</td>
          <td class="hide-sm mono small">${i(c.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${i(c.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),a=Ia&&Ft.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':Ft.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':Ft.map(c=>`<tr>
          <td class="mono">${i(c.uri)}</td>
          <td>${i(c.displayname)}</td>
          <td class="hide-sm">${i(String(c.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${c.id}" ${d?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${c.id}" data-label="${i(c.displayname)}" ${d?"disabled":""}>Delete</button>
          </td>
        </tr>`).join(""),r=ea!==null?Ut.find(c=>c.instanceId===ea)??null:null,o=ta!==null?Ft.find(c=>c.id===ta)??null:null,m=Xe==="create"||Xe==="edit"&&r?we({title:Xe==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
            <input type="hidden" name="instanceId" value="${r?r.instanceId:""}" />
            ${Xe==="create"?`<label>URI token id
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
            <label class="check-row"><input type="checkbox" name="todos" ${r!=null&&r.todos||Xe==="create"?"checked":""} ${d?"disabled":""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${r!=null&&r.notes?"checked":""} ${d?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",s=dt==="create"||dt==="edit"&&o?we({title:dt==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
            <input type="hidden" name="id" value="${o?o.id:""}" />
            ${dt==="create"?`<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${d?"disabled":""} />
            </label>`:`<p class="muted small">URI <span class="mono">${i(o.uri)}</span> (read-only)</p>`}
            <label>Display name
              <input type="text" name="displayname" required value="${i((o==null?void 0:o.displayname)??"")}" ${d?"disabled":""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${d?"disabled":""}>${i((o==null?void 0:o.description)??"")}</textarea>
            </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:d},{label:"Save",type:"submit",variant:"primary",disabled:d}]}):"",l=Ae?we({title:`Delete ${Ae.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
          <p>Delete <strong>${i(Ae.label)}</strong> for <span class="mono">${i(e.username)}</span>?</p>
          ${Ae.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${Ae.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:d}]}):"";return`<section class="card admin-user-detail">
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
    ${m}${s}${l}`}function Tr(){const e=je("users");if(e&&e.available===!1)return ps("users");const t=Dr(),a=ie&&te.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':t.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${Z?i(Z):_e.trim()?"No users match this filter.":"No users found."}</td></tr>`:t.map(r=>`<tr class="contact-table-row${J&&J.toLowerCase()===r.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${i(r.username)}" tabindex="0" role="button">
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
          ${De("Users","admin-users")}
          <div class="section-actions">
            ${e?`<span class="badge ${Fa(e.status)}">${i(Da(e.status))}</span>`:""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${d||ie?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${d?"disabled":""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${i(_e)}" aria-label="Filter users" ${d?"disabled":""} />
          <span class="muted small">${i(String(t.length))}${_e.trim()?` / ${te.length}`:""} user${t.length===1?"":"s"}</span>
        </div>
        ${Z&&te.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${i(Z)}</p>`:""}
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
      ${Nr()}
      ${Cr()}
      ${Ar()}
      ${Er()}`}function xr(){const e=je("settings");if(e&&e.available===!1)return ps("settings");if(Ga&&!aa)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(La&&!aa)return`<section class="card">
        <p class="flash flash-error">${i(La)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;const t=aa;if(!t)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const a=(o,m,s)=>`<label class="check-row"><input type="checkbox" name="${i(o)}" ${m?"checked":""} ${d||t.writable===!1?"disabled":""} /> ${i(s)}</label>`,r=(o,m,s,l="")=>`<label>${i(s)}
        <input type="number" name="${i(o)}" value="${i(String(m??0))}" ${d||t.writable===!1?"disabled":""} />
        ${l?`<span class="muted small">${i(l)}</span>`:""}
      </label>`;return`
      <section class="card">
        <div class="section-header">
          ${De("System settings","admin-settings")}
          <div class="section-actions">
            ${e?`<span class="badge ${Fa(e.status)}">${i(Da(e.status))}</span>`:""}
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
              ${On(t.timezone||"UTC")}
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
      ${_r()}`}function _r(){return $a?we({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${gs({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:wt,disabled:d,style:"admin"})}
          <label style="margin-top:1rem">Your portal password
            <input type="password" data-action="admin-reset-password" value="${i(Ze)}"
              autocomplete="current-password" placeholder="Re-enter password to confirm" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:d},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:d||!wt||Ze.trim()===""}]}):""}function qr(){const e=je("database");if(e&&e.available===!1)return ps("database");if(Qa&&!sa)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(Oa&&!sa)return`<section class="card">
        <p class="flash flash-error">${i(Oa)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;const t=sa;if(!t)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const a=na,r=t.writable===!1;return`
      <section class="card">
        <div class="section-header">
          ${De("Database","admin-database")}
          <div class="section-actions">
            ${e?`<span class="badge ${Fa(e.status)}">${i(Da(e.status))}</span>`:""}
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
      ${Ir()}`}function Ir(){if(!va)return"";const e=St.trim()==="CONFIRM";return we({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${i(St)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${d?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:d},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:d||!e}]})}function Lr(){return Ee()?Rt()?v==="users"?Tr():v==="settings"?xr():v==="database"?qr():kr():`<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function Or(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,h)=>[ge(f.instanceId,f.uri),h])),r=new Map,o=[];for(const f of e){const h=f.parentUid;if(h&&t.has(h)&&h!==f.uid){const $=r.get(h)??[];$.push(f),r.set(h,$)}else o.push(f)}const m=(f,h)=>(a.get(ge(f.instanceId,f.uri))??0)-(a.get(ge(h.instanceId,h.uri))??0);o.sort(m);for(const[,f]of r)f.sort(m);const s=[],l=new Set,c=(f,h)=>{const $=f.uid||ge(f.instanceId,f.uri);if(!l.has($)){l.add($),s.push({task:f,depth:Math.min(h,8)});for(const L of r.get(f.uid)??[])c(L,h+1);l.delete($)}};for(const f of o)c(f,0);for(const f of e)s.some(h=>h.task===f)||s.push({task:f,depth:0});return s}function Pr(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const r of Le)r.parentUid&&t.has(r.parentUid)&&r.uid&&!t.has(r.uid)&&(t.add(r.uid),a=!0)}return t}function Ur(e,t){const a=e.instanceId,r=t||!e.uid?new Set:Pr(e.uid),o=Le.filter(l=>l.uid&&l.instanceId===a&&!r.has(l.uid)&&l.uid!==e.uid),m=e.parentUid||"",s=['<option value="">None (top-level)</option>',...o.map(l=>`<option value="${i(l.uid)}" ${l.uid===m?"selected":""}>${i(l.summary||l.uid)}</option>`)];if(m&&!o.some(l=>l.uid===m)){const l=Le.find(c=>c.uid===m);s.push(`<option value="${i(m)}" selected>${i((l==null?void 0:l.summary)||m)} (current)</option>`)}return s.join("")}function vn(){const e=new Set(ke);return Le.filter(t=>e.has(ge(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function Fr(){const e=A=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[A]||A,t=Or(Le),a=Le.filter(A=>A.canWrite&&!A.readOnly).map(A=>ge(A.instanceId,A.uri)),r=a.length>0&&a.every(A=>ke.includes(A)),o=ke.length>0,s=vn().length,l=Le.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${ds?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:A,depth:_})=>{const C=ge(A.instanceId,A.uri),D=!le&&C===Re?" is-selected":"",R=ke.includes(C),V=A.status==="COMPLETED"?"badge-ok":A.status==="CANCELLED"?"":"badge-admin",X=_>0?` style="--task-depth:${_}"`:"",ee=_>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",ne=A.canWrite&&!A.readOnly;return`<tr class="contact-table-row task-row${_>0?" is-subtask":""}${D}${R?" is-checked":""}" data-action="select-task" data-instance="${A.instanceId}" data-uri="${i(A.uri)}" tabindex="0" role="button"${X}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${A.instanceId}" data-uri="${i(A.uri)}"
                    ${R?"checked":""} ${ne?"":"disabled"} aria-label="Select ${i(A.summary||A.uri)}" ${d?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${ee}<span class="contact-name-primary">${i(A.summary||A.uri)}</span></span>
                  ${A.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${V}">${i(e(A.status))}</span></td>
                <td class="col-task-due muted small">${i(on(A.due))}</td>
                <td class="col-task-cal muted small">${i(A.calendarName)}</td>
                <td class="col-task-pct muted small">${A.percent?i(String(A.percent))+"%":"—"}</td>
              </tr>`}).join(""),c=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(A,_)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${A}"
        title="${i(_)}" aria-label="${i(_)}" ${d||s===0?"disabled":""}>${c}</button>`,h=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${s}</strong><span class="bulk-bar-count-label">selected</span>${ke.length!==s?`<span class="muted small bulk-bar-count-extra">(${ke.length-s} read-only skipped)</span>`:""}
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
                ${ba({field:"bulk-due",name:"bulkDue",label:"Due",value:Za,dateOnly:!1,disabled:d||s===0,allowClear:!0})}
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
          </div>`:"",$=Q,L=Vt.map(A=>`<option value="${A.id}" ${$&&$.instanceId===A.id?"selected":""}>${i(A.displayname)}</option>`).join(""),x=$?`<div class="card">
            ${De(le?$.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${le?`<label>Calendar
                      <select name="instanceId" required ${Vt.length===0?"disabled":""}>
                        <option value="">${Vt.length?"Select calendar…":"No writable calendars"}</option>
                        ${L}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i($.calendarName)}</strong>${$.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i($.summary)}" ${$.readOnly&&!le?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${$.readOnly&&!le?"readonly":""}>${i($.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${$.readOnly&&!le?"disabled":""}>
                  ${Ur($,le)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${$.readOnly&&!le?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(A=>`<option value="${A}" ${$.status===A?"selected":""}>${i(e(A))}</option>`).join("")}
                  </select>
                </label>
                ${ba({field:"due",name:"due",label:"Due",value:Na($.due),dateOnly:!1,disabled:!!($.readOnly&&!le),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${i(String($.priority||0))}" ${$.readOnly&&!le?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${i(String($.percent||0))}" ${$.readOnly&&!le?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${le||$.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${le?"Create task":"Save task"}</button>`:""}
                ${!le&&$.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${d?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${d?"disabled":""}>Delete</button>`:le?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${De("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(ds)}" aria-label="Search tasks" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${d||Vt.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Vt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${r?"checked":""} ${a.length===0||d?"disabled":""} />
                </th>
                ${Jt("Title","summary",zt,_t,"task","col-task-title")}
                ${Jt("Status","status",zt,_t,"task","col-task-status")}
                ${Jt("Due","due",zt,_t,"task","col-task-due")}
                ${Jt("Calendar","calendar",zt,_t,"task","col-task-cal")}
                ${Jt("%","percent",zt,_t,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function Mr(){const e=Ca.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${cs?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Ca.map(o=>{const m=ge(o.instanceId,o.uri),s=!Ne&&m===pt?" is-selected":"",l=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${s}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${i(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(o.summary||o.uri)}</span>
                  ${l?`<span class="muted small contact-name-secondary">${i(l)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(on(o.dtstart))}</td>
                <td class="col-note-cal muted small">${i(o.calendarName)}</td>
              </tr>`}).join(""),t=ce,a=Bt.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${i(o.displayname)}</option>`).join(""),r=t?`<div class="card">
            ${De(Ne?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${Ne?`<label>Calendar
                      <select name="instanceId" required ${Bt.length===0?"disabled":""}>
                        <option value="">${Bt.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(t.summary)}" ${t.readOnly&&!Ne?"readonly":""} />
              </label>
              ${ba({field:"dtstart",name:"dtstart",label:"Date",value:Na(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!Ne),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!Ne?"readonly":""}>${i(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${Ne||t.canWrite?`<button type="submit" class="btn btn-primary" ${d?"disabled":""}>${Ne?"Create note":"Save note"}</button>`:""}
                ${!Ne&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${d?"disabled":""}>Delete</button>`:Ne?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${De("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(cs)}" aria-label="Search notes" ${d?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${d||Bt.length===0?"disabled":""}>Add note</button>
        </div>
        ${Bt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Jt("Title","summary",Aa,ma,"note","col-note-title")}
                ${Jt("Date","dtstart",Aa,ma,"note","col-note-date")}
                ${Jt("Calendar","calendar",Aa,ma,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${r}
      </section>
    </div>`}function Rr(){const e=n.querySelector(".contacts-table-wrap"),t=n.querySelector(".contacts-ab-list"),a=n.querySelector(".calendars-owned-list"),r=n.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null,filesTableTop:(r==null?void 0:r.scrollTop)??null}}function Vr(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=n.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=n.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=n.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}if(e.filesTableTop!==null){const t=n.querySelector(".files-table-wrap");t&&(t.scrollTop=e.filesTableTop)}})})}function p(){const e=Rr();u?yr():$n(),Br(),Vr(e),requestAnimationFrame(()=>{var t;ir(),(t=n.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function wn(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let r=a.value.trim();r&&!r.startsWith("#")&&(r=`#${r}`),/^#[0-9A-Fa-f]{6}/.test(r)&&(t.value=r.slice(0,7),a.value=r.toUpperCase())}))}function Br(){n.querySelectorAll("[data-action]").forEach(k=>{k.addEventListener("click",P=>{const Y=P.target.closest("[data-action]");((Y==null?void 0:Y.dataset.action)==="info"||(Y==null?void 0:Y.dataset.action)==="info-close")&&(P.preventDefault(),P.stopPropagation()),rl(P)})}),Ma(),Fe&&Fn(),n.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(k=>{k.addEventListener("keydown",P=>{(P.key==="Enter"||P.key===" ")&&(P.preventDefault(),k.click())})});const e=n.querySelector("#delete-cal-confirm"),t=n.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||d)});const a=n.querySelector("#delete-ab-confirm"),r=n.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{r&&(r.disabled=!a.checked||d)}),n.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(k=>{k.addEventListener("error",()=>{const P=k.dataset.avatarFallback||"?",Y=document.createElement("span");Y.className="contact-avatar contact-avatar-fallback",Y.setAttribute("aria-hidden","true"),Y.textContent=P,k.replaceWith(Y)})}),Qs||(document.addEventListener("keydown",k=>{if(k.key==="Escape"){if(G&&(G.phase==="done"||G.phase==="error")){mn();return}if(!G){if(H&&(H.phase==="done"||H.phase==="error")){bn();return}if(!H){if(mt){mt=!1,Dt=!1,p();return}if(Fe){Fe=!1,Ma(),p();return}if(Oe!==null||Te!==null||$e!==null||nt){Oe=null,Te=null,xt(),nt=!1,p();return}An()}}}}),Qs=!0);const o=n.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",k=>{k.preventDefault(),Yr(o)});const m=n.querySelector('[data-form="files-rename"]');m==null||m.addEventListener("submit",k=>{k.preventDefault(),Kr(m)});const s=n.querySelector('[data-form="files-transfer"]');s==null||s.addEventListener("submit",k=>{k.preventDefault(),Qr(s)});const l=n.querySelector('[data-form="files-mkdir"]');l==null||l.addEventListener("submit",k=>{k.preventDefault(),Gr(l)}),nt&&requestAnimationFrame(()=>{var k;(k=l==null?void 0:l.querySelector('input[name="name"]'))==null||k.focus()}),n.querySelectorAll('input[type="file"][data-action="files-upload-pick-files"]').forEach(k=>{k.addEventListener("change",()=>{Cn(k,!1)})}),n.querySelectorAll('input[type="file"][data-action="files-upload-pick-folder"]').forEach(k=>{k.addEventListener("change",()=>{Cn(k,!0)})});const c=n.querySelector("[data-files-upload-dropzone]");if(c&&mt){const k=P=>{Dt!==P&&(Dt=P,c.classList.toggle("is-dragover",P))};c.addEventListener("dragenter",P=>{P.preventDefault(),P.stopPropagation(),k(!0)}),c.addEventListener("dragover",P=>{P.preventDefault(),P.stopPropagation(),P.dataTransfer&&(P.dataTransfer.dropEffect="copy"),k(!0)}),c.addEventListener("dragleave",P=>{P.preventDefault(),P.stopPropagation();const Y=P.relatedTarget;Y&&c.contains(Y)||k(!1)}),c.addEventListener("drop",P=>{P.preventDefault(),P.stopPropagation(),k(!1);const Y=P.dataTransfer;Y&&(async()=>{try{const xe=await el(Y);if(xe.length===0){b("info","Nothing to upload from that drop"),p();return}await Dn(xe)}catch(xe){b("error",xe instanceof Error?xe.message:"Drop failed"),p()}})()}),c.addEventListener("click",()=>{var P;(P=n.querySelector('input[data-action="files-upload-pick-files"]'))==null||P.click()}),c.addEventListener("keydown",P=>{var Y;(P.key==="Enter"||P.key===" ")&&(P.preventDefault(),(Y=n.querySelector('input[data-action="files-upload-pick-files"]'))==null||Y.click())})}n.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(k=>{k.indeterminate=!0});const f=n.querySelector('[data-form="share"]');f==null||f.addEventListener("submit",k=>{k.preventDefault(),tl(f)});const h=n.querySelector('[data-form="edit-cal"]');h&&(wn(h),h.addEventListener("submit",k=>{k.preventDefault(),sl(h)}));const $=n.querySelector('[data-form="edit-event"]');$==null||$.addEventListener("submit",k=>{k.preventDefault(),al($)}),n.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(k=>{k.addEventListener("change",()=>{if(!w)return;const P=n.querySelector('[data-form="edit-event"]');if(!P)return;const Y=new FormData(P),xe=P.querySelector('input[name="allDay"]'),We=Wa(Y);We.endMode==="until"&&!We.until&&(We.until=fa(String(Y.get("start")??w.start??""))||ve(new Date)),w={...w,summary:String(Y.get("summary")??w.summary),description:String(Y.get("description")??w.description),location:String(Y.get("location")??w.location),instanceId:Number(Y.get("instanceId"))||w.instanceId,allDay:(xe==null?void 0:xe.checked)??w.allDay,start:String(Y.get("start")??w.start??""),end:String(Y.get("end")??w.end??"")||null,repeat:We,hasRrule:!!String(Y.get("repeatFreq")??"").trim()},We.freq&&We.endMode==="until"&&(U==null?void 0:U.field)==="end"&&(U=null),p(),We.endMode==="until"&&requestAnimationFrame(()=>{var S;const Qe=n.querySelector('input[name="repeatUntil"]');Qe==null||Qe.focus();try{(S=Qe==null?void 0:Qe.showPicker)==null||S.call(Qe)}catch{}})})});const L=n.querySelector('[data-form="create-cal"]');L&&(wn(L),L.addEventListener("submit",k=>{k.preventDefault(),nl(L)}));const x=n.querySelector('[data-form="create-ab"]');x==null||x.addEventListener("submit",k=>{k.preventDefault(),cl(x)});const A=n.querySelector('[data-form="edit-ab"]');A==null||A.addEventListener("submit",k=>{k.preventDefault(),ul(A)});const _=n.querySelector('[data-form="contact"]');_==null||_.addEventListener("submit",k=>{k.preventDefault(),dl(_)});const C=n.querySelector('[data-form="task"]');if(C==null||C.addEventListener("submit",k=>{k.preventDefault(),jr(C)}),C){const k=C.querySelector('select[name="instanceId"]');k==null||k.addEventListener("change",()=>{if(!le||!Q)return;const P=Number(k.value);if(!Number.isFinite(P)||P<=0)return;const Y=new FormData(C),xe=String(Y.get("due")??"").trim();Q={...Q,instanceId:P,parentUid:Q.parentUid&&Le.some(We=>We.uid===Q.parentUid&&We.instanceId===P)?Q.parentUid:null,summary:String(Y.get("summary")??""),description:String(Y.get("description")??""),status:String(Y.get("status")??"NEEDS-ACTION"),due:xe?new Date(xe).toISOString():null,priority:Number(Y.get("priority")??0),percent:Number(Y.get("percent")??0)},p()})}const D=n.querySelector('[data-form="note"]');D==null||D.addEventListener("submit",k=>{k.preventDefault(),Hr(D)});const R=n.querySelector('input[data-action="contact-search"]');R==null||R.addEventListener("input",()=>{at&&clearTimeout(at),at=setTimeout(()=>{ia=R.value,j!==null&&(async()=>{try{await Ht(j),p()}catch(k){b("error",k instanceof Error?k.message:"Search failed"),p()}})()},250)});const V=n.querySelector('input[data-action="task-search"]');V==null||V.addEventListener("input",()=>{at&&clearTimeout(at),at=setTimeout(()=>{ds=V.value,(async()=>{try{await Wt(),p()}catch(k){b("error",k instanceof Error?k.message:"Search failed"),p()}})()},250)});const X=n.querySelector('input[data-action="admin-users-search"]');X==null||X.addEventListener("input",()=>{at&&clearTimeout(at),at=setTimeout(()=>{_e=X.value,p()},150)});const ee=n.querySelector('[data-form="admin-user-create"]');ee==null||ee.addEventListener("submit",k=>{k.preventDefault(),Mn(ee)});const ne=n.querySelector('[data-form="admin-user-edit"]');ne==null||ne.addEventListener("submit",k=>{k.preventDefault(),Hn(ne)});const ue=n.querySelector('[data-form="admin-cal"]');ue==null||ue.addEventListener("submit",k=>{k.preventDefault(),Rn(ue)});const Ve=n.querySelector('[data-form="admin-ab"]');Ve==null||Ve.addEventListener("submit",k=>{k.preventDefault(),Vn(Ve)});const Ge=n.querySelector('[data-form="admin-settings"]');Ge==null||Ge.addEventListener("submit",k=>{k.preventDefault(),jn(Ge)});const It=n.querySelector('[data-form="admin-database"]');It==null||It.addEventListener("submit",k=>{k.preventDefault(),Bn(It)});const He=n.querySelector('select[data-action="admin-db-backend"]');He==null||He.addEventListener("change",()=>{na=He.value==="pgsql"?"pgsql":"sqlite",p()});const Gt=n.querySelector('input[data-action="admin-db-confirm-input"]');Gt==null||Gt.addEventListener("input",()=>{St=Gt.value;const k=n.querySelector('[data-action="admin-db-confirm-save"]');k&&(k.disabled=d||St.trim()!=="CONFIRM")});const Qt=n.querySelector('input[data-action="admin-reset-password"]');Qt==null||Qt.addEventListener("input",()=>{Ze=Qt.value;const k=n.querySelector('[data-action="admin-reset-confirm"]');k&&(k.disabled=d||!wt||Ze.trim()==="")});const gt=n.querySelector('input[data-action="note-search"]');gt==null||gt.addEventListener("input",()=>{at&&clearTimeout(at),at=setTimeout(()=>{cs=gt.value,(async()=>{try{await Ea(),p()}catch(k){b("error",k instanceof Error?k.message:"Search failed"),p()}})()},250)}),ll(),Jr(),Wr()}async function zr(e){var o,m;const t=vn();if(t.length===0){b("error","No writable tasks selected"),p();return}const a=t.map(s=>({instanceId:s.instanceId,uri:s.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;d=!0,T(),p();try{const s=await E.bulkTasks({op:"delete",items:a});ke=[],Re&&t.some(l=>ge(l.instanceId,l.uri)===Re)&&(Re=null,Q=null,le=!1),await Wt(),s.failed>0?b("error",`Deleted ${s.ok}, failed ${s.failed}${s.errors[0]?`: ${s.errors[0]}`:""}`):b("success",`Deleted ${s.ok} task${s.ok===1?"":"s"}`)}catch(s){b("error",s instanceof Error?s.message:"Bulk delete failed")}finally{d=!1,p()}return}let r={};if(e==="bulk-task-status"){const s=n.querySelector("#bulk-task-status"),l=((o=s==null?void 0:s.value)==null?void 0:o.trim())??"";if(!l){b("error","Choose a status to apply"),p();return}r={status:l}}else if(e==="bulk-task-due"){const s=Za.trim();if(!s){b("error","Choose a due date to apply"),p();return}const l=/^\d{4}-\d{2}-\d{2}$/.test(s)?new Date(s+"T00:00:00"):new Date((s.length===16,s));if(Number.isNaN(l.getTime())){b("error","Invalid due date"),p();return}r={due:l.toISOString()}}else if(e==="bulk-task-clear-due")r={due:null};else if(e==="bulk-task-percent"){const s=n.querySelector("#bulk-task-percent"),l=((m=s==null?void 0:s.value)==null?void 0:m.trim())??"";if(l===""){b("error","Enter a percent complete (0–100)"),p();return}const c=Number(l);if(!Number.isFinite(c)||c<0||c>100){b("error","Percent must be between 0 and 100"),p();return}r={percent:Math.round(c)}}d=!0,T(),p();try{const s=await E.bulkTasks({op:"update",items:a,fields:r});if(await Wt(),Q&&!le){const c=ge(Q.instanceId,Q.uri),f=Le.find(h=>ge(h.instanceId,h.uri)===c);f&&(Q={...f})}const l=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";s.failed>0?b("error",`Updated ${l} on ${s.ok}, failed ${s.failed}${s.errors[0]?`: ${s.errors[0]}`:""}`):b("success",`Updated ${l} on ${s.ok} task${s.ok===1?"":"s"}`)}catch(s){b("error",s instanceof Error?s.message:"Bulk update failed")}finally{d=!1,p()}}async function jr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),m=String(t.get("due")??"").trim(),s=m?new Date(m).toISOString():null,l=Number(t.get("priority")??0),c=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),h=f===""?null:f;d=!0,T(),p();try{if(le){const $=Number(t.get("instanceId"));if(!Number.isFinite($)||$<=0)throw new Error("Select a calendar");const L=await E.createTask({instanceId:$,summary:a,description:r,status:o,due:s,priority:l,percent:c,parentUid:h});le=!1,Re=ge(L.task.instanceId,L.task.uri),Q=L.task,b("success",h?"Subtask created":"Task created")}else if(Q){const $=await E.updateTask(Q.instanceId,Q.uri,{summary:a,description:r,status:o,due:s,priority:l,percent:c,parentUid:h});Q=$.task,Re=ge($.task.instanceId,$.task.uri),b("success","Task saved")}await Wt()}catch($){b("error",$ instanceof Error?$.message:"Save failed")}finally{d=!1,p()}}async function Hr(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),m=o?new Date(o).toISOString():null;d=!0,T(),p();try{if(Ne){const s=Number(t.get("instanceId"));if(!Number.isFinite(s)||s<=0)throw new Error("Select a calendar");const l=await E.createNote({instanceId:s,summary:a,description:r,dtstart:m});Ne=!1,pt=ge(l.note.instanceId,l.note.uri),ce=l.note,b("success","Note created")}else if(ce){const s=await E.updateNote(ce.instanceId,ce.uri,{summary:a,description:r,dtstart:m});ce=s.note,pt=ge(s.note.instanceId,s.note.uri),b("success","Note saved")}await Ea()}catch(s){b("error",s instanceof Error?s.message:"Save failed")}finally{d=!1,p()}}function Wr(){const e=n.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){b("error","Photo is too large (max ~2 MB)"),p();return}try{const r=await fr(t);Ke=r,Ie=`data:${t.type||"image/jpeg"};base64,${r}`,tt=!1,p()}catch(r){b("error",r instanceof Error?r.message:"Failed to read photo"),p()}}})()})}function Jr(){const e=n.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),r=e.querySelector('input[name="displayname"]'),o=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const m=()=>{const s=t.checked;a.hidden=!s,r&&(r.required=!s,s&&!r.value.trim()?r.placeholder="Auto: Holidays (XX)":s||(r.placeholder="Work")),s&&o&&(o.checked=!0)};t.addEventListener("change",m),m()}async function Yr(e){var o,m,s,l;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("password")??"");d=!0,T(),p(),N.event("login.attempt",{username:a});try{const c=await E.login(a,r);if(u=c.user,Es(c.ui),N.event("login.ok",{username:(u==null?void 0:u.username)??a}),Ts(),Ee())try{await xs()}catch(f){N.warn("admin.capabilities login",f instanceof Error?f.message:f)}if(Zs(),ht(y,v),await rt(),y==="admin"&&Ee()&&Rt())try{v==="overview"&&((o=je("overview"))==null?void 0:o.available)!==!1?await ns():v==="users"&&((m=je("users"))==null?void 0:m.available)!==!1?(await ca(),J&&(await Nt(J),await ua(J))):v==="settings"&&((s=je("settings"))==null?void 0:s.available)!==!1?await rs():v==="database"&&((l=je("database"))==null?void 0:l.available)!==!1&&await ls()}catch(f){N.warn("admin login load",f instanceof Error?f.message:f)}b("success","Signed in")}catch(c){N.warn("login.failed",c instanceof Error?c.message:c),b("error",c instanceof Error?c.message:"Login failed")}finally{d=!1,p()}}async function Kr(e){const t=new FormData(e),a=String(t.get("path")??""),r=String(t.get("newName")??"").trim();if(!a||!r){b("error","Name is required"),p();return}d=!0,T(),p();try{await E.filesRename(a,r),N.event("files.rename",{path:a,newName:r}),Oe=null,await Tt(),b("success",`Renamed to “${r}”`)}catch(o){b("error",o instanceof Error?o.message:"Rename failed")}finally{d=!1,p()}}async function Gr(e){const t=new FormData(e),a=String(t.get("name")??"").trim();if(!a){b("error","Folder name is required"),p();return}d=!0,T(),p();try{await E.filesMkdir(ye,a),N.event("files.mkdir",{path:ye,name:a}),nt=!1,await Tt(),b("success",`Created folder “${a}”`)}catch(r){b("error",r instanceof Error?r.message:"Could not create folder")}finally{d=!1,p()}}async function Qr(e){if(!$e||$e.paths.length===0)return;const t=new FormData(e),a=(qt||String(t.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),r=String(t.get("newName")??"").trim(),o=$e.op,m=[...$e.paths],s=m.length>1;if(os(a,m)){b("error","Choose a different destination folder"),p();return}d=!0,T(),p();let l=0;const c=[];try{for(const h of m)try{if(o==="copy"){const $=za(h),L=s||!r||r===$?void 0:r,x=await E.filesCopy(h,{to:a,newName:L});N.event("files.copy",{path:h,to:x.entry.path})}else{const $=za(h),L=s||!r||r===$?void 0:r;await E.filesMove(h,a,L),N.event("files.move",{path:h,to:a})}l+=1}catch($){c.push(`${za(h)}: ${$ instanceof Error?$.message:"failed"}`)}xt(),be=[],await Tt();const f=o==="copy"?"Copied":"Moved";l>0&&c.length===0?b("success",l===1?`${f} 1 item`:`${f} ${l} items`):l>0?b("info",`${f} ${l}; ${c.length} failed. ${c[0]}`):b("error",c[0]||`${o==="copy"?"Copy":"Move"} failed`)}catch(f){b("error",f instanceof Error?f.message:"Operation failed")}finally{d=!1,p()}}function Sn(e,t){return Array.from(e).map(r=>{const o=t&&r.webkitRelativePath?r.webkitRelativePath.replace(/\\/g,"/"):r.name;return{file:r,relativePath:o||r.name}})}function Xr(e){return new Promise((t,a)=>{const r=[],o=()=>{e.readEntries(m=>{if(!m.length){t(r);return}r.push(...m),o()},m=>a(m))};o()})}function Zr(e){return new Promise((t,a)=>{e.file(t,a)})}async function kn(e,t){const a=Fs(t,e.name);if(e.isFile)return[{file:await Zr(e),relativePath:a||e.name}];if(e.isDirectory){const r=e.createReader(),o=await Xr(r);if(o.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const m=[];for(const s of o)m.push(...await kn(s,a));return m}return[]}async function el(e){const t=e.items?Array.from(e.items):[],a=[];let r=!1;for(const o of t){if(o.kind!=="file")continue;const m=o,s=typeof m.webkitGetAsEntry=="function"?m.webkitGetAsEntry():null;s&&(r=!0,a.push(...await kn(s,"")))}return r&&a.length>0?a:e.files&&e.files.length>0?Sn(e.files,!1):a}async function Dn(e){var $,L;if(e.length===0)return;mt=!1,Dt=!1;const t=e.filter(x=>x.file&&!x.isEmptyDir),a=e.filter(x=>x.isEmptyDir&&x.relativePath),r=ye,o=t.reduce((x,A)=>{var _;return x+(((_=A.file)==null?void 0:_.size)||0)},0),m=Date.now(),s=t.length+a.length;H={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:(($=t[0])==null?void 0:$.relativePath)||((L=a[0])==null?void 0:L.relativePath)||"",bytesTotal:o,bytesSent:0,startedAt:m,elapsedSec:0,resultMessage:null,errorSamples:[]},d=!0,T(),gr(),p();let l=0;const c=[],f=new Set;let h=0;try{for(const _ of a){const C=_.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(C){H&&(H={...H,currentName:C+"/",elapsedSec:Math.floor((Date.now()-m)/1e3)},xa(H));try{await hn(r,C,f)}catch(D){c.push(`${C}/: ${D instanceof Error?D.message:"failed"}`)}}}for(const _ of t){const C=_.file,D=(_.relativePath||C.name).replace(/\\/g,"/"),R=D.split("/").filter(Boolean),V=R.pop()||C.name,X=R.join("/"),ee=D||V;H&&(H={...H,currentName:ee,bytesSent:h,elapsedSec:Math.floor((Date.now()-m)/1e3)},xa(H));try{X&&await hn(r,X,f);const ne=Fs(r,X);await E.filesUpload(ne,C,{replace:!0,onProgress:(ue,Ve)=>{if(!H||H.phase!=="uploading")return;const Ge=Ve>0?Ve:C.size;H={...H,currentName:ee,bytesSent:h+Math.min(ue,Ge||ue),elapsedSec:Math.floor((Date.now()-m)/1e3)},xa(H)}}),N.event("files.upload",{path:ne,name:V,size:C.size,relativePath:D}),l+=1,h+=C.size||0,H&&(H={...H,completedFiles:l,failedFiles:c.length,bytesSent:h},xa(H))}catch(ne){const ue=`${ee}: ${ne instanceof Error?ne.message:"failed"}`;c.push(ue),h+=C.size||0,H&&(H={...H,completedFiles:l,failedFiles:c.length,bytesSent:h,errorSamples:c.slice(0,12)},xa(H))}}await Tt(),Ta();const x=Math.floor((Date.now()-m)/1e3),A=t.length;if(l>0&&c.length===0){const _=l===1?"Uploaded 1 file":`Uploaded ${l} files`;H={phase:"done",totalFiles:Math.max(A,1),completedFiles:l,failedFiles:0,currentName:"",bytesTotal:o,bytesSent:o,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:[]},b("success",_)}else if(l>0){const _=`Uploaded ${l}; ${c.length} failed. ${c[0]}`;H={phase:"done",totalFiles:Math.max(A,1),completedFiles:l,failedFiles:c.length,currentName:"",bytesTotal:o,bytesSent:o,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:c.slice(0,12)},b("info",_)}else if(s>0&&c.length===0&&a.length>0){const _=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;H={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:[]},b("success",_)}else{const _=c[0]||"Upload failed";H={phase:"error",totalFiles:Math.max(A,1),completedFiles:0,failedFiles:c.length,currentName:"",bytesTotal:o,bytesSent:0,startedAt:m,elapsedSec:x,resultMessage:_,errorSamples:c.slice(0,12)},b("error",_)}}catch(x){Ta();const A=x instanceof Error?x.message:"Upload failed";H={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:l,failedFiles:Math.max(c.length,1),currentName:"",bytesTotal:o,bytesSent:h,startedAt:m,elapsedSec:Math.floor((Date.now()-m)/1e3),resultMessage:A,errorSamples:c.length?c.slice(0,12):[A]},b("error",A)}finally{d=!1,p()}}function Cn(e,t){const a=e.files;if(!a||a.length===0)return;const r=Sn(a,t);e.value="",Dn(r)}async function tl(e){if(B===null)return;const t=new FormData(e),a=String(t.get("username")??""),r=String(t.get("access")??"read");Se=!0,d=!0,T(),p();try{await E.share(B,a,r),await Ra(B),b("success",`Shared with ${a}`)}catch(o){b("error",o instanceof Error?o.message:"Share failed")}finally{d=!1,p()}}function Ha(e){if(!w)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');w={...w,summary:String(t.get("summary")??w.summary),description:String(t.get("description")??w.description),location:String(t.get("location")??w.location),instanceId:Number(t.get("instanceId"))||w.instanceId,allDay:(a==null?void 0:a.checked)??w.allDay,start:String(t.get("start")??w.start??""),end:String(t.get("end")??w.end??"")||null,repeat:Wa(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function Wa(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),r=String(e.get("repeatEndMode")??"never"),o=r==="until"||r==="count"?r:"never";let m=null,s=null;if(o==="until"){const c=String(e.get("repeatUntil")??"").trim();m=c?c.slice(0,10):null}else if(o==="count"){const c=Number(e.get("repeatCount")??0);s=Number.isFinite(c)&&c>0?Math.min(999,Math.round(c)):10}const l=e.getAll("repeatByDay").map(c=>String(c).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:m,count:s,byDay:l,endMode:o}}async function al(e){if(!w||!w.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),r=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),m=t.get("allDay")==="on",s=String(t.get("start")??"").trim(),l=String(t.get("end")??"").trim(),c=Number(t.get("instanceId"))||w.instanceId,f=Wa(t);if(!a){b("error","Title is required"),p();return}if(!s){b("error","Start is required"),p();return}let h,$;if(m)h=s.slice(0,10),$=l?l.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const _=Ls(s,l||null);h=new Date(_.start).toISOString(),$=_.end?new Date(_.end).toISOString():null}else h=new Date(s).toISOString(),$=l?new Date(l).toISOString():null;const L=w.instanceId,x=w.uri,A=ct;d=!0,T(),kt=!0,p(),N.event(A?"event.create":"event.update",{instanceId:c,uri:A?null:x,allDay:m,summary:a});try{const _={summary:a,description:r,location:o,allDay:m,start:h,end:$,instanceId:c,repeat:f},C=A?await E.createEvent(c,_):await E.updateEvent(L,x,_);(B===null||C.event.instanceId!==B)&&(B=C.event.instanceId),await lt(),kt=!1,w=null,ct=!1,U=null,N.event(A?"event.created":"event.saved",{uri:C.event.uri,instanceId:C.event.instanceId}),b("success",A?"Event created":"Event saved")}catch(_){N.warn("event.save failed",_ instanceof Error?_.message:_),b("error",_ instanceof Error?_.message:"Save failed")}finally{d=!1,p()}}async function sl(e){if(B===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),o=String(t.get("color")??"").trim();d=!0,T(),p();try{const m=await E.updateCalendar(B,{displayname:a,description:r,color:o});Se=!0,await rt(),B=m.calendar.id,await Ra(B),await lt(),b("success","Calendar updated")}catch(m){b("error",m instanceof Error?m.message:"Update failed")}finally{d=!1,p()}}async function nl(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??""),o=String(t.get("color")??"").trim(),m=t.get("holidays")==="on",s=String(t.get("holidayCountry")??"").trim(),l=t.get("readOnly")==="on";if(Be=!0,m&&!s){b("error","Select a country for the holidays calendar"),p();return}if(!m&&!a){b("error","Display name is required"),p();return}d=!0,T(),p();try{const c=await E.createCalendar({displayname:a,description:r,color:o,holidays:m,holidayCountry:m?s:void 0,readOnly:l});B=c.calendar.id,ae.includes(c.calendar.id)||(ae=[...ae,c.calendar.id]),Be=!1,await rt();let f=`Created “${c.calendar.displayname}”`;const h=c.holidayImport??c.calendar.holidayImport;h&&(f+=`. Holidays imported: ${js(h)}.`),l&&(f+=" Calendar is read-only."),b("success",f)}catch(c){Be=!0,b("error",c instanceof Error?c.message:"Create failed")}finally{d=!1,p()}}async function rl(e){var r,o,m;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&N.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){G&&(G.phase==="done"||G.phase==="error")&&mn();return}if(a==="close-files-upload-progress"){H&&(H.phase==="done"||H.phase==="error")&&bn();return}if(a==="files-upload-open"){if(d)return;mt=!0,Dt=!1,Oe=null,Te=null,xt(),nt=!1,T(),p();return}if(a==="files-upload-picker-close"){mt=!1,Dt=!1,p();return}if(a==="logout"){d=!0,N.event("logout");try{await E.logout()}catch{}ss(),T(),p();return}if(a==="select-cal"||a==="toggle-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s))return;er(s),d=!0,T(),p();try{await lt()}catch(l){b("error",l instanceof Error?l.message:"Failed to load calendar")}finally{d=!1,p()}return}if(a==="edit-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s)||!de.find(c=>c.id===s&&c.canShare))return;B=s,ae.includes(s)||(ae=[...ae,s]),Se=!0,ze=null,d=!0,T(),p();try{await Ra(s),await lt()}catch(c){b("error",c instanceof Error?c.message:"Failed to open calendar")}finally{d=!1,p()}return}if(a==="close-cal-modal"){Se=!1,p();return}if(a==="open-create-cal-modal"){Be=!0,Se=!1,ze=null,T(),p();return}if(a==="close-create-cal-modal"){Be=!1,T(),p();return}if(a==="delete-cal"){const s=Number(t.dataset.id);if(!Number.isFinite(s)||!de.find(c=>c.id===s&&c.canShare))return;ze=s,Se=!1,T(),p();return}if(a==="cancel-delete-cal"){ze=null,p();return}if(a==="confirm-delete-cal"){const s=Number(t.dataset.id),l=n.querySelector("#delete-cal-confirm");if(!Number.isFinite(s)||!(l!=null&&l.checked))return;d=!0,T(),p();try{if(await E.deleteCalendar(s),B===s&&(B=null),ae=ae.filter(c=>c!==s),ze=null,Se=!1,la=[],oa=[],await rt(),B===null){const c=nn();c?(B=c.id,ae.includes(c.id)||(ae=[...ae,c.id]),await lt()):ae.length>0&&(B=ae[0],await lt())}b("success","Calendar deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="month-today"){const s=new Date;Mt={y:s.getFullYear(),m:s.getMonth()},Pa=null,d=!0,p();try{await lt()}finally{d=!1,p()}return}if(a==="month-prev"||a==="month-next"){const s=a==="month-prev"?-1:1,l=new Date(Mt.y,Mt.m+s,1);Mt={y:l.getFullYear(),m:l.getMonth()},Pa=null,d=!0,p();try{await lt()}finally{d=!1,p()}return}if(a==="open-event"){e.stopPropagation();const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;d=!0,T(),p();try{const c=await E.getEvent(s,l);w={...c.event,repeat:c.event.repeat??us()},ct=!1,kt=!0,U=null,Se=!1,ze=null}catch(c){b("error",c instanceof Error?c.message:"Failed to open event")}finally{d=!1,p()}return}if(a==="open-event-day"){e.stopPropagation();const s=t.dataset.day??"";Pa=Pa===s?null:s,p();return}if(a==="new-event-day"){const s=e.target;if((r=s==null?void 0:s.closest)!=null&&r.call(s,".month-event, .month-event-more"))return;const l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;if(B===null){b("error","Select a calendar first"),p();return}const c=de.find(f=>f.id===B);if(!c||c.readOnly||!(c.canShare||c.access==="readwrite")){b("error","This calendar is read-only"),p();return}ct=!0,w=ur(l,B),kt=!0,U=null,Se=!1,ze=null,T(),p();return}if(a==="close-event-modal"){kt=!1,w=null,ct=!1,U=null,T(),p();return}if(a==="dt-open"){const s=t.dataset.dtField||"";if(!s)return;const l=n.querySelector('[data-form="edit-event"]');if(l&&w&&Ha(l),(U==null?void 0:U.field)===s)U=null;else{const c=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",h=t.dataset.dtName||s;let $=Us(s);!$&&(s==="due"||s==="dtstart"||s==="bulk-due")&&($=Ba().start);const L=Va($||ve(new Date)),[x,A]=L.date.split("-").map(Number);U={field:s,viewY:x,viewM:(A||1)-1,dateOnly:c,allowClear:f,name:h}}p();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!U)return;const s=a==="dt-month-prev"?-1:1,l=new Date(U.viewY,U.viewM+s,1);U={...U,viewY:l.getFullYear(),viewM:l.getMonth()},p();return}if(a==="dt-pick-day"){if(!U)return;const s=U.field,l=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(l))return;const c=n.querySelector('[data-form="edit-event"]');c&&w&&Ha(c);const f=U.dateOnly;if(f)bt(s,l),U=null;else{const h=Us(s),$=Va(h||Ba(l).start).hm;bt(s,`${l}T${$}`),U={...U,viewY:Number(l.slice(0,4)),viewM:Number(l.slice(5,7))-1}}if(s==="start"&&w&&!f&&w.end){const h=new Date(String(w.start)),$=new Date(String(w.end));!Number.isNaN(h.getTime())&&!Number.isNaN($.getTime())&&$<=h&&bt("end",jt(new Date(h.getTime()+3600*1e3)))}p();return}if(a==="dt-pick-time"){if(!U||U.dateOnly)return;const s=U.field,l=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(l))return;const c=n.querySelector('[data-form="edit-event"]');c&&w&&Ha(c);const f=Us(s)||Ba().start,$=`${Va(f).date}T${l}`;if(bt(s,$),s==="start"&&w){w={...w,allDay:!1};const L=w.end?Va(String(w.end)):null,x=new Date($);(!L||new Date(`${L.date}T${L.hm}`)<=x)&&bt("end",jt(new Date(x.getTime()+3600*1e3)))}U=null,p();return}if(a==="dt-today"){if(!U)return;const s=U.field,l=n.querySelector('[data-form="edit-event"]');l&&w&&Ha(l);const c=ve(new Date);if(U.dateOnly)bt(s,c);else{const f=Ba(c);s==="start"?(bt("start",f.start),w&&!w.end&&bt("end",f.end)):s==="end"?bt("end",f.end):bt(s,f.start)}U=null,p();return}if(a==="dt-clear"){if(!U||!U.allowClear)return;const s=U.field,l=n.querySelector('[data-form="edit-event"]');l&&w&&Ha(l),bt(s,null),U=null,p();return}if(a==="event-allday-toggle"){if(!w)return;const s=n.querySelector('[data-form="edit-event"]'),l=t.checked;if(s){const c=new FormData(s),f=String(c.get("start")??w.start??""),h=String(c.get("end")??w.end??"")||null;let $=f,L=h;if(l){const x=Xn(f,h);$=x.start,L=x.end}else{const x=f.slice(0,10),A=(h||f).slice(0,10),_=Ls(x,A);$=_.start,L=_.end}w={...w,summary:String(c.get("summary")??w.summary),description:String(c.get("description")??w.description),location:String(c.get("location")??w.location),instanceId:Number(c.get("instanceId"))||w.instanceId,allDay:l,start:$,end:L,repeat:Wa(c)}}else w={...w,allDay:l};U=null,p();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!w)return;const s=n.querySelector('[data-form="edit-event"]');if(!s)return;const l=new FormData(s),c=s.querySelector('input[name="allDay"]'),f=Wa(l);w={...w,summary:String(l.get("summary")??w.summary),description:String(l.get("description")??w.description),location:String(l.get("location")??w.location),instanceId:Number(l.get("instanceId"))||w.instanceId,allDay:(c==null?void 0:c.checked)??w.allDay,start:String(l.get("start")??w.start??""),end:String(l.get("end")??w.end??"")||null,repeat:f,hasRrule:!!String(l.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(U==null?void 0:U.field)==="end"&&(U=null),p();return}if(a==="delete-event"){if(!w||!w.canWrite||ct||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const s=w.instanceId,l=w.uri;d=!0,T(),p();try{await E.deleteEvent(s,l),kt=!1,w=null,await lt(),b("success","Event deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="info"){const s=t.dataset.info??"";ml(s);return}if(a==="info-close"){An();return}if(a==="flash-close"){T(),p();return}if(a==="user-menu-toggle"){e.stopPropagation(),Fe=!Fe,p();return}if(a==="user-menu-close"){Fe&&(Fe=!1,p());return}if(a==="tab"){const s=Ys(t.dataset.tab);s&&(s==="admin"&&(v="overview"),await an(s));return}if(a==="admin-page"){const s=Ss(t.dataset.adminPage);s&&await en(s);return}if(a==="admin-refresh"){if(!Ee()||y!=="admin")return;d=!0,T(),p();try{await ns(),b("success","Overview refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-users-refresh"){if(!Ee()||y!=="admin")return;d=!0,T(),p();try{await ca(),J&&await Nt(J),b("success","Users refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="admin-user-view"){const s=t.dataset.username??"";if(!s||!Ee())return;d=!0,T(),J=s,v="users",ht("admin","users",s),p();try{await Nt(s),await ua(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-close"){J=null,z=null,Pe=null,Ue=!1,ht("admin","users",null),p();return}if(a==="admin-user-create-open"){if(!Ee())return;Je=!0,Ue=!1,vt=null,T(),p();return}if(a==="admin-user-create-close"){Je=!1,p();return}if(a==="admin-user-edit-open"){if(!Ee())return;const s=t.dataset.username??J??"";if(!s)return;d=!0,T(),Je=!1,vt=null,J=s,v="users",ht("admin","users",s),p();try{(!z||z.username.toLowerCase()!==s.toLowerCase())&&await Nt(s),Ue=!0}catch(l){b("error",l instanceof Error?l.message:"Failed to load user")}finally{d=!1,p()}return}if(a==="admin-user-edit-close"){Ue=!1,p();return}if(a==="admin-user-delete-open"){if(!Ee())return;const s=t.dataset.username??J??"";if(!s)return;vt=s,Pt=!1,Je=!1,Ue=!1,T(),p();return}if(a==="admin-user-delete-close"){vt=null,Pt=!1,p();return}if(a==="admin-user-delete-toggle"){Pt=!!t.checked,p();return}if(a==="admin-user-delete-confirm"){if(!Ee())return;const s=t.dataset.username??vt??"";if(!s||!Pt)return;d=!0,T(),p();try{await E.adminDeleteUser(s,!0),N.event("admin.user.delete",{username:s}),vt=null,Pt=!1,Ue=!1,(J==null?void 0:J.toLowerCase())===s.toLowerCase()&&(J=null,z=null,Ut=[],Ft=[],ht("admin","users",null)),await ca(),b("success",`Deleted user “${s}”`)}catch(l){b("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-cal-create"){Xe="create",ea=null,p();return}if(a==="admin-cal-edit"){Xe="edit",ea=Number(t.dataset.id),p();return}if(a==="admin-cal-close"){Xe=null,ea=null,p();return}if(a==="admin-cal-delete"){Ae={kind:"calendar",id:Number(t.dataset.id),label:t.dataset.label??"calendar"},p();return}if(a==="admin-ab-create"){dt="create",ta=null,p();return}if(a==="admin-ab-edit"){dt="edit",ta=Number(t.dataset.id),p();return}if(a==="admin-ab-close"){dt=null,ta=null,p();return}if(a==="admin-ab-delete"){Ae={kind:"addressbook",id:Number(t.dataset.id),label:t.dataset.label??"address book",force:!1},p();return}if(a==="admin-ab-force-toggle"){(Ae==null?void 0:Ae.kind)==="addressbook"&&(Ae={...Ae,force:!!t.checked},p());return}if(a==="admin-resource-delete-close"){Ae=null,p();return}if(a==="admin-resource-delete-confirm"){if(!J||!Ae)return;const s=J,l=Ae;d=!0,T(),p();try{l.kind==="calendar"?await E.adminDeleteUserCalendar(s,l.id,!0):await E.adminDeleteUserAddressBook(s,l.id,!0,!!l.force),Ae=null,await ua(s),await Nt(s),b("success","Deleted")}catch(c){b("error",c instanceof Error?c.message:"Delete failed")}finally{d=!1,p()}return}if(a==="admin-settings-refresh"){d=!0,T(),p();try{await rs(),b("success","Settings reloaded")}catch(s){b("error",s instanceof Error?s.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-reset-open"){$a=!0,wt=!1,Ze="",T(),p();return}if(a==="admin-reset-close"){$a=!1,wt=!1,Ze="",p();return}if(a==="admin-reset-toggle"){wt=!!t.checked,p();return}if(a==="admin-reset-password"){Ze=t.value;const s=n.querySelector('[data-action="admin-reset-confirm"]');s&&(s.disabled=d||!wt||Ze.trim()==="");return}if(a==="admin-reset-confirm"){if(!wt)return;if(Ze.trim()===""){b("error","Re-enter your password to confirm Reset to Default"),p();return}d=!0,T(),p();try{const s=await E.adminResetToDefault(!0,Ze);N.event("admin.settings.reset-to-default"),$a=!1,wt=!1,Ze="";const l=s.redirectUrl&&s.redirectUrl.startsWith("/")?s.redirectUrl:"/portal/install/";window.location.assign(l);return}catch(s){b("error",s instanceof Error?s.message:"Reset failed"),d=!1,p()}return}if(a==="admin-database-refresh"){d=!0,T(),p();try{await ls(),b("success","Database settings reloaded")}catch(s){b("error",s instanceof Error?s.message:"Reload failed")}finally{d=!1,p()}return}if(a==="admin-db-backend"){na=t.value==="pgsql"?"pgsql":"sqlite",p();return}if(a==="admin-db-test"){const s=t.closest("form");zn(s);return}if(a==="admin-db-confirm-close"){va=!1,St="",wa=null,p();return}if(a==="admin-db-confirm-input"){St=t.value,p();const l=n.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const c=l.value.length;l.setSelectionRange(c,c)}return}if(a==="admin-db-confirm-save"){if(St.trim()!=="CONFIRM"||!wa)return;d=!0,T(),p();try{const s={...wa,confirm:"CONFIRM"},l=await E.adminUpdateDatabaseSettings(s);sa=l.data,va=!1,St="",wa=null,na=(l.data.backend||"sqlite").toLowerCase()==="pgsql"?"pgsql":"sqlite",N.event("admin.database.save",{backend:l.data.backend}),b("success","Database settings saved")}catch(s){b("error",s instanceof Error?s.message:"Database save failed")}finally{d=!1,p()}return}if(a==="files-nav"){ye=t.dataset.path??"",Oe=null,Te=null,$e=null,nt=!1,be=[],d=!0,T(),p();try{await Tt()}catch(l){b("error",l instanceof Error?l.message:"Failed to open folder")}finally{d=!1,p()}return}if(a==="files-toggle"){e.stopPropagation();const s=t.dataset.path??"";if(!s)return;t.checked?be.includes(s)||(be=[...be,s]):be=be.filter(c=>c!==s),p();return}if(a==="files-select-all"){e.stopPropagation(),be=t.checked?pe.map(l=>l.path):[],p();return}if(a==="files-copy"){const s=t.dataset.path??"";if(!s)return;is("copy",[s]);return}if(a==="files-move"){const s=t.dataset.path??"";if(!s)return;is("move",[s]);return}if(a==="files-bulk-copy"){if(be.length===0)return;is("copy",[...be]);return}if(a==="files-bulk-move"){if(be.length===0)return;is("move",[...be]);return}if(a==="files-tree-select"){if(e.preventDefault(),e.stopPropagation(),!$e)return;const s=t.dataset.path??"";if(os(s,$e.paths))return;qt=s,p();return}if(a==="files-tree-toggle"||a==="files-tree-retry"){if(e.preventDefault(),e.stopPropagation(),!$e)return;const s=t.dataset.path??"";if(a==="files-tree-retry"){const c={...st};delete c[s],st=c,ft.includes(s)||(ft=[...ft,s]),_s(s);return}ft.includes(s)?(ft=ft.filter(c=>c!==s),p()):(ft=[...ft,s],_s(s));return}if(a==="files-transfer-close"){xt(),p();return}if(a==="files-bulk-delete"){if(be.length===0)return;Te=[...be],Oe=null,xt(),p();return}if(a==="files-refresh"){d=!0,T(),p();try{await Tt(),b("success","Refreshed")}catch(s){b("error",s instanceof Error?s.message:"Refresh failed")}finally{d=!1,p()}return}if(a==="files-mkdir"){nt=!0,mt=!1,Dt=!1,Oe=null,Te=null,xt(),T(),p();return}if(a==="files-mkdir-close"){nt=!1,p();return}if(a==="files-rename-open"){Oe=t.dataset.path??null,Te=null,xt(),p();return}if(a==="files-rename-close"){Oe=null,p();return}if(a==="files-delete-open"){const s=t.dataset.path??"";Te=s?[s]:null,Oe=null,xt(),p();return}if(a==="files-delete-close"){Te=null,p();return}if(a==="files-delete-confirm"){const s=Te?[...Te]:[];if(s.length===0)return;d=!0,T(),p();try{if(s.length===1)await E.filesDelete(s[0]),N.event("files.delete",{path:s[0]}),b("success","Deleted");else{const l=await E.filesBulk("delete",s);N.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?b("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?b("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):b("error",l.errors[0]||"Delete failed")}Te=null,be=[],await Tt()}catch(l){b("error",l instanceof Error?l.message:"Delete failed")}finally{d=!1,p()}return}if(a==="files-download"){N.event("files.download",{path:t.getAttribute("href")??""});return}if(a==="sort-task"||a==="sort-note"){const s=t.dataset.sort||"";if(!s)return;if(a==="sort-task"){zt===s?_t=_t==="asc"?"desc":"asc":(zt=s,_t=s==="due"||s==="summary"?"asc":"desc"),d=!0,p();try{await Wt()}catch(l){b("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}else{Aa===s?ma=ma==="asc"?"desc":"asc":(Aa=s,ma="asc"),d=!0,p();try{await Ea()}catch(l){b("error",l instanceof Error?l.message:"Sort failed")}finally{d=!1,p()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=Le.find(f=>f.instanceId===s&&f.uri===l)??null;le=!1,Re=ge(s,l),Q=c?{...c}:null,T(),p();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=ge(s,l),f=Le.find(h=>ge(h.instanceId,h.uri)===c);if(!f||!f.canWrite||f.readOnly)return;ke.includes(c)?ke=ke.filter(h=>h!==c):ke=[...ke,c],p();return}if(a==="task-select-all"){e.preventDefault();const s=Le.filter(c=>c.canWrite&&!c.readOnly);s.length>0&&s.every(c=>ke.includes(ge(c.instanceId,c.uri)))?ke=[]:ke=s.map(c=>ge(c.instanceId,c.uri)),p();return}if(a==="bulk-task-clear"){ke=[],p();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){zr(a);return}if(a==="select-note"){const s=Number(t.dataset.instance),l=t.dataset.uri??"";if(!Number.isFinite(s)||!l)return;const c=Ca.find(f=>f.instanceId===s&&f.uri===l)??null;Ne=!1,pt=ge(s,l),ce=c?{...c}:null,T(),p();return}if(a==="new-task"){le=!0,Re=null,Q={uri:"",instanceId:((o=Vt[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-subtask"){if(!Q||le||!Q.uid||!Q.canWrite)return;const s=Q;le=!0,Re=null,Q={uri:"",instanceId:s.instanceId,calendarId:s.calendarId,calendarName:s.calendarName,calendarUri:s.calendarUri,uid:"",parentUid:s.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="new-note"){Ne=!0,pt=null,ce={uri:"",instanceId:((m=Bt[0])==null?void 0:m.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},T(),p();return}if(a==="cancel-task"){le=!1,Q=null,Re=null,p();return}if(a==="cancel-note"){Ne=!1,ce=null,pt=null,p();return}if(a==="delete-task"){if(!Q||le||!confirm("Delete this task? CalDAV clients will sync the removal."))return;d=!0,T(),p();try{await E.deleteTask(Q.instanceId,Q.uri),Re=null,Q=null,await Wt(),b("success","Task deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-note"){if(!ce||Ne||!confirm("Delete this note? CalDAV clients will sync the removal."))return;d=!0,T(),p();try{await E.deleteNote(ce.instanceId,ce.uri),pt=null,ce=null,await Ea(),b("success","Note deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="select-ab"){const s=Number(t.dataset.id);if(!Number.isFinite(s))return;j=s,ut=!1,fe=null,I=null,he=!1,qe=!1,ia="",Et=[],Ie=null,Ke=null,tt=!1,T(),d=!0,p();try{await Ht(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load contacts")}finally{d=!1,p()}return}if(a==="edit-ab"){e.stopPropagation();const s=Number(t.dataset.id);if(!Number.isFinite(s)||!Me.find(f=>f.id===s))return;const c=j!==s;j=s,ut=!0,qe=!1,T(),c&&(fe=null,I=null,he=!1,ia="",Et=[],Ie=null,Ke=null,tt=!1),d=!0,p();try{c&&await Ht(s)}catch(f){b("error",f instanceof Error?f.message:"Failed to open address book")}finally{d=!1,p()}return}if(a==="close-ab-modal"){ut=!1,p();return}if(a==="select-contact"){const s=t.dataset.uri??"";if(!s)return;T();try{await mr(s)}catch(l){b("error",l instanceof Error?l.message:"Failed to load contact")}p();return}if(a==="new-contact"){if(j===null)return;pr(),T(),p();return}if(a==="cancel-contact"||a==="close-contact-modal"){he=!1,qe=!1,I=null,fe=null,Ie=null,Ke=null,tt=!1,U=null,T(),p();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!I)return;fs(),Array.isArray(I.emails)||(I.emails=[""]),Array.isArray(I.phones)||(I.phones=[{type:"cell",value:""}]),Array.isArray(I.custom)||(I.custom=[]),a==="add-email"?I.emails.length<10&&I.emails.push(""):a==="add-phone"?I.phones.length<10&&I.phones.push({type:"other",value:""}):I.custom.length<30&&I.custom.push({label:"",value:""}),p();return}if(a==="remove-email"){if(!I)return;fs();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;const l=Array.isArray(I.emails)?I.emails:[""];I.emails=l.filter((c,f)=>f!==s),I.emails.length===0&&(I.emails=[""]),p();return}if(a==="remove-phone"){if(!I)return;fs();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;const l=Array.isArray(I.phones)?I.phones:[{type:"cell",value:""}];I.phones=l.filter((c,f)=>f!==s),I.phones.length===0&&(I.phones=[{type:"cell",value:""}]),p();return}if(a==="remove-custom"){if(!I)return;fs();const s=Number(t.dataset.idx);if(!Number.isFinite(s))return;I.custom=(Array.isArray(I.custom)?I.custom:[]).filter((l,c)=>c!==s),p();return}if(a==="remove-photo"){Ie=null,Ke=null,tt=!0,I&&(I.hasPhoto=!1),p();return}if(a==="delete-contact"){if(j===null||!fe||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;d=!0,T(),qe=!0,p();try{await E.deleteContact(j,fe),fe=null,I=null,he=!1,qe=!1,U=null,Ie=null,await rt(),b("success","Contact deleted")}catch(s){b("error",s instanceof Error?s.message:"Delete failed")}finally{d=!1,p()}return}if(a==="delete-ab"){e.stopPropagation();const s=Number(t.dataset.id??j);if(!Number.isFinite(s)||!Me.find(c=>c.id===s))return;et=s,ut=!1,qe=!1,T(),p();return}if(a==="cancel-delete-ab"){et=null,p();return}if(a==="confirm-delete-ab"){const s=Number(t.dataset.id),l=n.querySelector("#delete-ab-confirm");if(!Number.isFinite(s)||!(l!=null&&l.checked))return;const c=Me.find(h=>h.id===s);if(!c)return;const f=(c.cardCount??0)>0;d=!0,T(),p();try{await E.deleteAddressBook(s,f),j===s&&(j=null,Et=[],I=null,fe=null,he=!1),et=null,ut=!1,qe=!1,await rt(),j===null&&Me.length>0&&(j=Me[0].id,await Ht(j)),b("success","Address book deleted")}catch(h){b("error",h instanceof Error?h.message:"Delete failed")}finally{d=!1,p()}return}if(a==="export-ab"){e.stopPropagation();const s=t.dataset.id,l=s!==void 0&&s!==""?Number(s):j;if(l===null||Number.isNaN(l))return;d=!0,T(),p();try{const{blob:c,filename:f}=await E.exportAddressBook(l),h=await Ms(c,f);h==="cancelled"?b("info","Export cancelled"):h==="saved"?b("success",`Saved ${f}`):b("success",`Download started: ${f}`)}catch(c){b("error",c instanceof Error?c.message:"Export failed")}finally{d=!1,p()}return}if(a==="export-contact"){if(j===null||!fe||he)return;qe=!0,d=!0,T(),p();try{const{blob:s,filename:l}=await E.exportContact(j,fe),c=await Ms(s,l);c==="cancelled"?b("info","Export cancelled"):c==="saved"?b("success",`Saved ${l}`):b("success",`Download started: ${l}`)}catch(s){b("error",s instanceof Error?s.message:"Export failed")}finally{d=!1,p()}return}if(a==="revoke"){const s=t.dataset.href??"";if(!s||B===null||!confirm("Revoke access for this user?"))return;Se=!0,d=!0,T(),p();try{await E.revoke(B,s),await Ra(B),b("success","Share revoked")}catch(l){b("error",l instanceof Error?l.message:"Revoke failed")}finally{d=!1,p()}return}if(a==="export-cal"){e.stopPropagation();const s=t.dataset.id,l=s!==void 0&&s!==""?Number(s):B;if(l===null||Number.isNaN(l))return;d=!0,T(),p();try{const{blob:c,filename:f}=await E.exportCalendar(l),h=await Ms(c,f);h==="cancelled"?b("info","Export cancelled"):h==="saved"?b("success",`Saved ${f}`):b("success",`Download started: ${f}`)}catch(c){b("error",c instanceof Error?c.message:"Export failed")}finally{d=!1,p()}}}async function Ms(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const s=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await s.write(e)}finally{await s.close()}return"saved"}catch(m){if(m instanceof DOMException&&m.name==="AbortError")return"cancelled"}const r=URL.createObjectURL(e),o=document.createElement("a");return o.href=r,o.download=t,o.rel="noopener",o.style.display="none",document.body.appendChild(o),o.click(),window.setTimeout(()=>{URL.revokeObjectURL(r),o.remove()},6e4),"started"}function ll(){const e=n.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{pl(e)});const t=n.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{fl(t)});const a=n.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{ol(a)})}async function ol(e){var r;if(j===null)return;const t=(r=e.files)==null?void 0:r[0];if(e.value="",!t)return;const a=j;ut=!0,d=!0,T(),At(),G={kind:"contacts",fileName:t.name,fileSizeLabel:ms(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},un(),p();try{const o=await yn(t,l=>{if(!G||G.phase!=="reading")return;G={...G,readPercent:l};const c=n.querySelector(".import-progress-bar"),f=n.querySelector("[data-import-status-line]");c&&l!==null&&(c.classList.remove("is-indeterminate"),c.style.width=`${l}%`),f&&l!==null&&(f.textContent=`Reading file… ${l}%`)});Kt("uploading",{readPercent:100}),Kt("processing",{processPercent:0}),N.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const m=await E.importAddressBook(a,o,l=>{pn(l)}),s=js(m);await rt(),j===a&&await Ht(a),At(),Kt("done",{ok:!0,resultMessage:`${s} (from “${t.name}”)`}),b("success",`Import finished for “${t.name}”: ${s}.`)}catch(o){const m=o instanceof Error?o.message:"Import failed";At(),Kt("error",{ok:!1,resultMessage:m}),b("error",m)}finally{d=!1,p()}}function fs(){if(!I)return;const e=n.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);I.firstname=String(t.get("firstname")??""),I.lastname=String(t.get("lastname")??""),I.fullname=String(t.get("fullname")??""),I.org=String(t.get("org")??""),I.title=String(t.get("title")??""),I.url=String(t.get("url")??""),I.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();I.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,I.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const r=[];let o=0;for(;t.has(`email_${o}`);)r.push(String(t.get(`email_${o}`)??"")),o++;r.length&&(I.emails=r);const m=[];for(o=0;t.has(`phone_value_${o}`);)m.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;m.length&&(I.phones=m);const s=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)s.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;I.custom=s}function il(e){const t=new FormData(e),a=[];let r=0;for(;t.has(`email_${r}`);){const l=String(t.get(`email_${r}`)??"").trim();l&&a.push(l),r++}const o=[];for(r=0;t.has(`phone_value_${r}`);){const l=String(t.get(`phone_value_${r}`)??"").trim();l&&o.push({type:String(t.get(`phone_type_${r}`)??"other"),value:l}),r++}const m=[];for(r=0;t.has(`custom_label_${r}`)||t.has(`custom_value_${r}`);){const l=String(t.get(`custom_label_${r}`)??"").trim(),c=String(t.get(`custom_value_${r}`)??"").trim();(l||c)&&m.push({label:l,value:c}),r++}const s={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const l=String(t.get("birthday")??"").trim();return l&&/^\d{4}-\d{2}-\d{2}/.test(l)?l.slice(0,10):null})(),custom:m};return tt?s.removePhoto=!0:Ke&&(s.photoBase64=Ke),s}async function dl(e){if(j===null)return;const t=il(e);d=!0,T(),qe=!0,p();try{if(he){const a=await E.createContact(j,t);he=!1,fe=a.contact.uri,I=null,qe=!1,Ie=null,Ke=null,tt=!1,U=null,b("success","Contact created")}else fe&&(fe=(await E.updateContact(j,fe,t)).contact.uri,I=null,qe=!1,Ie=null,Ke=null,tt=!1,U=null,b("success","Contact saved"));try{await rt()}catch(a){if(console.error(a),j!==null)try{await Ht(j)}catch{}}}catch(a){b("error",a instanceof Error?a.message:"Save failed")}finally{d=!1,p()}}async function cl(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();if(a){d=!0,T(),p();try{const o=await E.createAddressBook({displayname:a,description:r});j=o.addressbook.id,fe=null,I=null,he=!1,ia="",await rt(),b("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){b("error",o instanceof Error?o.message:"Create failed")}finally{d=!1,p()}}}async function ul(e){if(j===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),r=String(t.get("description")??"").trim();ut=!0,d=!0,T(),p();try{await E.updateAddressBook(j,{displayname:a,description:r}),await rt(),b("success","Address book updated")}catch(o){b("error",o instanceof Error?o.message:"Update failed")}finally{d=!1,p()}}function ml(e){const t=_l[e];if(!t)return;const a=n.querySelector("#info-modal"),r=n.querySelector("#info-modal-title"),o=n.querySelector("#info-modal-body");if(!a||!r||!o)return;r.textContent=t.title,o.innerHTML=t.paragraphs.map(s=>`<p>${i(s)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const m=a.querySelector(".info-modal-close");m==null||m.focus()}function An(){const e=n.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function pl(e){var a;if(B===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(Se=!0,await En(B,t,{keepEditModalOpen:!0}))}async function fl(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=n.querySelector('[data-form="create-cal"]'),r=a?new FormData(a):new FormData,o=r.get("holidays")==="on",m=r.get("readOnly")==="on";if(o){b("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),Be=!0,p();return}if(m){b("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),Be=!0,p();return}let s=String(r.get("displayname")??"").trim();s||(s=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const l=String(r.get("description")??""),c=String(r.get("color")??"").trim();d=!0,T(),Be=!0,p();try{const h=await E.createCalendar({displayname:s,description:l,color:c,readOnly:!1});B=h.calendar.id,Be=!1,await rt(),b("success",`Created “${h.calendar.displayname}” — importing…`),await En(h.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${h.calendar.displayname}” created. `})}catch(h){const $=h instanceof Error?h.message:"Create or import failed";Be=!0,b("error",$),d=!1,p()}}async function En(e,t,a={}){d=!0,T(),At(),G={kind:"calendar",fileName:t.name,fileSizeLabel:ms(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},un(),p();try{const r=await yn(t,s=>{if(!G||G.phase!=="reading")return;G={...G,readPercent:s};const l=n.querySelector(".import-progress-bar"),c=n.querySelector("[data-import-status-line]");l&&s!==null&&(l.classList.remove("is-indeterminate"),l.style.width=`${s}%`),c&&s!==null&&(c.textContent=`Reading file… ${s}%`)});Kt("uploading",{readPercent:100}),Kt("processing",{processPercent:0}),N.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const o=await E.importCalendar(e,r,s=>{pn(s)}),m=js(o);B===e&&await lt(),At(),Kt("done",{ok:!0,resultMessage:`${m} (from “${t.name}”)`}),b("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${m}.`)}catch(r){const o=r instanceof Error?r.message:"Import failed";At(),Kt("error",{ok:!1,resultMessage:o}),b("error",o)}finally{a.keepEditModalOpen&&(Se=!0),d=!1,p()}}Kn()}let Zt="",M=null,oe=!1,yt=null,Ot=null,Xt="sqlite",ks=!1;async function Ds(n,u={}){const g={Accept:"application/json",...u.headers};u.body&&(g["Content-Type"]="application/json"),Zt&&u.method&&u.method!=="GET"&&(g["X-CSRF-Token"]=Zt);const y=await fetch(`/api/install${n}`,{credentials:"same-origin",...u,headers:g});let v;try{v=await y.json()}catch{throw new Error(`Request failed (${y.status})`)}if(!y.ok)throw new Error(v.error||`Request failed (${y.status})`);return v&&typeof v=="object"&&"data"in v&&v.data!==void 0?v.data:v}async function Gs(){var n;M=await Ds("/status"),Zt=M.csrfToken||Zt,((n=M.defaults)==null?void 0:n.backend)==="pgsql"?Xt="pgsql":Xt="sqlite"}function Ya(n,u,g){return`<label class="check-row"><input type="checkbox" name="${i(n)}" ${u?"checked":""} ${oe?"disabled":""} /> ${i(g)}</label>`}function Ll(){const n=M==null?void 0:M.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${i((n==null?void 0:n.configPath)||"—")} ${n!=null&&n.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${i((n==null?void 0:n.specificPath)||"—")} ${n!=null&&n.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${Lt("error",(M==null?void 0:M.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${oe?"disabled":""}>Retry</button>
  </section>`}function Ol(){const n=M==null?void 0:M.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${oe?"disabled":""}>
          ${On((n==null?void 0:n.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Ya("cal_enabled",(n==null?void 0:n.cal_enabled)!==!1,"Enable CalDAV")}
      ${Ya("card_enabled",(n==null?void 0:n.card_enabled)!==!1,"Enable CardDAV")}
      ${Ya("tasks_enabled",(n==null?void 0:n.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${Ya("notes_enabled",!!(n!=null&&n.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${Ya("files_enabled",!!(n!=null&&n.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${oe?"disabled":""}>
          ${["Digest","Basic","Apache"].map(u=>`<option value="${u}" ${((n==null?void 0:n.dav_auth_type)||"Digest")===u?"selected":""}>${u}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${i((n==null?void 0:n.invite_from)||"")}" ${oe?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${i(String((n==null?void 0:n.session_max_age_minutes)??15))}" ${oe?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${oe?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function Pl(){const n=M==null?void 0:M.defaults,u=(M==null?void 0:M.pdoDrivers)||[],g=u.includes("sqlite"),y=u.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${oe?"disabled":""}>
          ${g?`<option value="sqlite" ${Xt==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${y?`<option value="pgsql" ${Xt==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${Xt==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${i((n==null?void 0:n.sqlite_file)||"")}" class="mono" ${oe?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${Xt==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${i((n==null?void 0:n.pgsql_host)||"")}" placeholder="localhost:5432" ${oe?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${i((n==null?void 0:n.pgsql_dbname)||"")}" ${oe?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${i((n==null?void 0:n.pgsql_username)||"")}" autocomplete="off" ${oe?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${oe?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${oe?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${oe?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function Ul(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${i(String((M==null?void 0:M.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${i((M==null?void 0:M.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${ks?"checked":""} ${oe?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${oe||!ks?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function Fl(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${i((M==null?void 0:M.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function Ml(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${Lt("error",(M==null?void 0:M.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function $t(){const n=document.getElementById("app");if(!n)return;const u=(M==null?void 0:M.step)||"permissions";let g="";M?u==="permissions"?g=Ll():u==="initialize"?g=Ol():u==="database"?g=Pl():u==="upgrade"?g=Ul():u==="done"?g=Fl():u==="locked"?g=Ml():g=`<section class="card"><p>Unknown step: ${i(u)}</p></section>`:g='<section class="card"><p class="muted">Loading installer…</p></section>',n.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${i((M==null?void 0:M.productVersion)||"…")}</span>
            ${M!=null&&M.configuredVersion?` · configured <span class="mono">${i(String(M.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${M!=null&&M.step?`<span class="badge badge-admin">${i(M.step)}</span>`:""}
      </header>
      ${yt?Lt("error",yt,{dismissible:!1}):""}
      ${Ot?Lt("success",Ot,{dismissible:!1}):""}
      ${g}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,Rl()}function Rl(){var u,g,y,v,O,F;const n=document.getElementById("app");n&&((u=n.querySelector('[data-action="reload"]'))==null||u.addEventListener("click",()=>{Vl()}),(g=n.querySelector('[data-action="backend-change"]'))==null||g.addEventListener("change",K=>{Xt=K.target.value==="pgsql"?"pgsql":"sqlite",$t()}),(y=n.querySelector('[data-action="upgrade-toggle"]'))==null||y.addEventListener("change",K=>{ks=!!K.target.checked,$t()}),(v=n.querySelector('[data-action="upgrade-run"]'))==null||v.addEventListener("click",()=>{jl()}),(O=n.querySelector('[data-form="initialize"]'))==null||O.addEventListener("submit",K=>{K.preventDefault(),Bl(K.target)}),(F=n.querySelector('[data-form="database"]'))==null||F.addEventListener("submit",K=>{K.preventDefault(),zl(K.target)}))}async function Vl(){oe=!0,yt=null,$t();try{await Gs(),Ot=null}catch(n){yt=n instanceof Error?n.message:"Failed to load installer status"}finally{oe=!1,$t()}}async function Bl(n){const u=new FormData(n),g=v=>{var O;return!!((O=n.querySelector(`input[name="${v}"]`))!=null&&O.checked)},y={timezone:String(u.get("timezone")??"").trim(),cal_enabled:g("cal_enabled"),card_enabled:g("card_enabled"),tasks_enabled:g("tasks_enabled"),notes_enabled:g("notes_enabled"),files_enabled:g("files_enabled"),dav_auth_type:String(u.get("dav_auth_type")??"Digest"),invite_from:String(u.get("invite_from")??"").trim(),session_max_age_minutes:Number(u.get("session_max_age_minutes")??15),admin_password:String(u.get("admin_password")??""),admin_password_confirm:String(u.get("admin_password_confirm")??"")};oe=!0,yt=null,Ot=null,$t();try{M=await Ds("/initialize",{method:"POST",body:JSON.stringify(y)}),Zt=M.csrfToken||Zt,Ot="Server settings saved. Configure the database next.",N.event("install.initialize")}catch(v){yt=v instanceof Error?v.message:"Initialize failed"}finally{oe=!1,$t()}}async function zl(n){const u=new FormData(n),g=String(u.get("backend")??Xt),y={backend:g,admin_password:String(u.get("admin_password")??""),admin_password_confirm:String(u.get("admin_password_confirm")??"")};g==="sqlite"?y.sqlite_file=String(u.get("sqlite_file")??"").trim():(y.pgsql_host=String(u.get("pgsql_host")??"").trim(),y.pgsql_dbname=String(u.get("pgsql_dbname")??"").trim(),y.pgsql_username=String(u.get("pgsql_username")??"").trim(),y.pgsql_password=String(u.get("pgsql_password")??"")),oe=!0,yt=null,Ot=null,$t();try{M=await Ds("/database",{method:"POST",body:JSON.stringify(y)}),Zt=M.csrfToken||Zt,Ot="Database configured. Installer is locked.",N.event("install.database"),M.completed||M.step}catch(v){yt=v instanceof Error?v.message:"Database setup failed"}finally{oe=!1,$t()}}async function jl(){if(ks){oe=!0,yt=null,Ot=null,$t();try{const n=await Ds("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});Ot="Upgrade completed."+(n.messages&&n.messages.length?" "+n.messages.slice(0,3).join(" · "):""),N.event("install.upgrade"),await Gs()}catch(n){yt=n instanceof Error?n.message:"Upgrade failed"}finally{oe=!1,$t()}}}async function Hl(n){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),n.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Gs()}catch(u){yt=u instanceof Error?u.message:"Failed to load installer"}$t()}const Ws=document.getElementById("app");if(!Ws)throw new Error("#app missing");const qn=window.location.pathname.replace(/\/+$/,"")||"/";qn==="/portal/install"||qn.endsWith("/portal/install")?Hl(Ws):Il(Ws);
