var Qn=Object.defineProperty;var Zn=(e,t,a)=>t in e?Qn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var It=(e,t,a)=>Zn(e,typeof t!="symbol"?t+"":t,a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();function c(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function se(e,t,a={}){if(!t)return"";const s=a.dismissible!==void 0?a.dismissible:a.dismissAction!==void 0,n=a.dismissAction??"flash-close",i=a.role??"status",r=a.className?` ${a.className}`:"",l=a.style?` style="${c(a.style)}"`:"",o=s?`<button type="button" class="flash-close" data-action="${c(n)}" aria-label="Dismiss message" title="Dismiss">×</button>`:"";return`<div class="flash flash-${c(e)}${r}" role="${c(i)}"${l}>
      <span class="flash-text">${c(t)}</span>
      ${o}
    </div>`}function es(e){return e==="sm"?" cal-modal-card-sm":e==="wide"?" cal-modal-card-wide":""}function ts(e){return e==="danger"?"btn btn-danger":e==="ghost"?"btn btn-ghost":"btn btn-primary"}function ea(e){return e.map(a=>{const s=a.type??"button",n=ts(a.variant),i=a.disabled?" disabled":"",r=a.id?` id="${c(a.id)}"`:"",l=a.action?` data-action="${c(a.action)}"`:"",o=a.attrs?` ${a.attrs}`:"";return`<button type="${s}" class="${n}"${l}${r}${o}${i}>${c(a.label)}</button>`}).join(`
`)}function _(e){const t=e.titleId||(e.id?`${e.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=e.id?` id="${c(e.id)}"`:"",s=e.className?` ${e.className}`:"",n=e.rootAttrs?` ${e.rootAttrs}`:"",i=`${es(e.size)}${e.cardClassName?` ${e.cardClassName}`:""}`,r=e.closeAction,l=e.lockBackdrop?"":` data-action="${c(r)}"`,o=e.hideClose?"":`<button type="button" class="modal-close info-modal-close" data-action="${c(r)}" aria-label="Close">×</button>`;let d="";e.footer!==void 0&&(d=typeof e.footer=="string"?e.footer:ea(e.footer));const m=d?`<footer class="cal-modal-footer">${d}</footer>`:"",u=`<div class="cal-modal-body">${e.body}</div>`;let b;return e.form?b=`<form class="stack"${e.formAttrs?` ${e.formAttrs}`:""}>
        ${u}
        ${m}
      </form>`:b=`${u}
      ${m}`,`<div class="cal-modal${s}"${a}${n} role="dialog" aria-modal="true" aria-labelledby="${c(t)}" data-focus-trap="1">
      <div class="cal-modal-backdrop"${l}></div>
      <div class="cal-modal-card${i}">
        <header class="cal-modal-header">
          <h3 id="${c(t)}">${c(e.title)}</h3>
          ${o}
        </header>
        ${b}
      </div>
    </div>`}function wt(e){const t=e.style==="checkbox"?"checkbox":"admin-delete-confirm",a=e.style==="checkbox"?' style="margin-top:1rem"':"",s=e.id?` id="${c(e.id)}"`:"",n=e.checked?" checked":"",i=e.disabled?" disabled":"";return`<label class="${t}"${a}>
            <input type="checkbox"${s} data-action="${c(e.action)}"${n}${i} />
            ${c(e.label)}
          </label>`}const ta="angaradav-portal-theme";function $e(e){return e==="dark"||e==="light"?e:null}function nn(e){return`${ta}:${e}`}function as(e){try{if(e){const t=$e(localStorage.getItem(nn(e)));if(t)return t}return $e(localStorage.getItem(ta))??"dark"}catch{return"dark"}}function ns(e,t){try{localStorage.setItem(ta,e),t&&localStorage.setItem(nn(t),e)}catch{}}function kt(e){const t=document.documentElement;t.setAttribute("data-theme",e),t.style.colorScheme=e;const a=document.querySelector('meta[name="color-scheme"]');a&&a.setAttribute("content",e)}const ct="angaradav-portal-user-settings",Mt={theme:"dark",dayStartHour:8,dayEndHour:18};function ut(e){const t=typeof e=="number"?e:Number(e);return!Number.isInteger(t)||t<0||t>23?null:t}function sn(e){const t=$e(e==null?void 0:e.theme)??Mt.theme,a=ut(e==null?void 0:e.dayStartHour)??Mt.dayStartHour,s=ut(e==null?void 0:e.dayEndHour)??Mt.dayEndHour;return{theme:t,dayStartHour:a,dayEndHour:s,showWeekNumbers:!!(e!=null&&e.showWeekNumbers)}}function rn(e){return`${ct}:${e}`}function Ot(e){try{const t=localStorage.getItem(e);if(!t)return null;const a=JSON.parse(t);return!a||typeof a!="object"?null:a}catch{return null}}function ln(e){const a={...(e?Ot(rn(e))??Ot(ct):Ot(ct))??{}};return $e(a.theme)||(a.theme=as(e)),sn(a)}function ss(e,t){const a=sn(e);try{const s=JSON.stringify(a);localStorage.setItem(ct,s),t&&localStorage.setItem(rn(t),s)}catch{}ns(a.theme,t)}function aa(e){const t=ln(e);return kt(t.theme),t}function Fa(e){const t=[];for(let a=0;a<24;a++){const s=`${String(a).padStart(2,"0")}:00`;t.push(`<option value="${a}" ${a===e?"selected":""}>${s}</option>`)}return t.join("")}function rs(e){if(!e.userSettingsOpen||!e.user)return"";const t=e.userSettings,a=$e(document.documentElement.getAttribute("data-theme"))??t.theme,s=`
    <div class="stack user-settings-form">
      <fieldset class="user-settings-fieldset">
        <legend>Theme</legend>
        <label class="check-row" data-action="set-theme" data-theme="dark">
          <input type="radio" name="theme" value="dark" ${a==="dark"?"checked":""} />
          Dark
        </label>
        <label class="check-row" data-action="set-theme" data-theme="light">
          <input type="radio" name="theme" value="light" ${a==="light"?"checked":""} />
          Light
        </label>
      </fieldset>
      <fieldset class="user-settings-fieldset">
        <legend>Calendar</legend>
        <label>Day starts at
          <select name="dayStartHour">${Fa(t.dayStartHour)}</select>
        </label>
        <label>Day ends at
          <select name="dayEndHour">${Fa(t.dayEndHour)}</select>
        </label>
        <label class="check-row">
          <input type="checkbox" name="showWeekNumbers" ${t.showWeekNumbers?"checked":""} />
          Show week numbers
        </label>
      </fieldset>
    </div>`;return _({id:"user-settings-modal",title:"User settings",closeAction:"user-settings-close",form:!0,formAttrs:'data-form="user-settings"',size:"sm",body:s,footer:[{label:"Cancel",action:"user-settings-close",variant:"ghost"},{label:"Save",type:"submit"}]})}function is(e){const t=new FormData(e),a=$e(String(t.get("theme")??""))??"dark",s=ut(t.get("dayStartHour")),n=ut(t.get("dayEndHour"));return s===null||n===null?{error:"Choose a start and end hour"}:n<=s?{error:"Day end must be after day start"}:{theme:a,dayStartHour:s,dayEndHour:n,showWeekNumbers:t.get("showWeekNumbers")==="on"}}function on(e){e.userSettingsOpen=!1,kt(e.userSettings.theme)}const Aa={off:0,error:1,warn:2,info:3,debug:4};let Ve="off";const mt="[angaradav-portal]";function ls(e){const t=(e||"off").toLowerCase().trim();return t==="error"||t==="warn"||t==="info"||t==="debug"||t==="off"?t:"off"}function os(e){return Ve=ls(e),Ve!=="off"&&console.info(mt,`log level = ${Ve}`),Ve}function dn(e){return Aa[Ve]>=Aa[e]}function tt(e,t,a,s){if(!dn(e))return;const n=[mt,a];s!==void 0&&n.push(s),console[t](...n)}function ds(e,t){dn("info")&&(t&&Object.keys(t).length>0?console.info(mt,`event:${e}`,t):console.info(mt,`event:${e}`))}const $={error(e,t){tt("error","error",e,t)},warn(e,t){tt("warn","warn",e,t)},info(e,t){tt("info","info",e,t)},debug(e,t){tt("debug","debug",e,t)},event:ds};class q extends Error{constructor(a,s,n={}){super(a);It(this,"status");It(this,"payload");this.status=s,this.payload=n}}let Fe="",rt=null,it=null;function lt(e){Fe=e&&typeof e=="string"?e:""}function cs(){return Fe}function us(e){rt=e}function ms(e){it=e}function St(e){if(!cn(e))try{it==null||it()}catch{}}function cn(e){return e==="/login"||e==="/ui"||e==="/logout"||e==="/install/status"||e.startsWith("/install/")}function Je(e,t){if(!cn(e)){lt("");try{rt==null||rt(t||"Session timed out. Please sign in again.")}catch{}}}async function fs(e){const t=typeof performance<"u"?performance.now():Date.now();$.debug(`api → GET ${e}`);const a=await fetch(`/api${e}`,{credentials:"same-origin"}),s=Math.round((typeof performance<"u"?performance.now():Date.now())-t);if(!a.ok){let r=`Request failed (${a.status})`,l={};try{const o=await a.json();l={...o},typeof o.error=="string"&&(r=o.error)}catch{}throw a.status>=500?$.error(`api ← GET ${e} ${a.status} (${s}ms)`,r):a.status!==401?$.warn(`api ← GET ${e} ${a.status} (${s}ms)`,r):($.debug(`api ← GET ${e} 401 (${s}ms)`),Je(e,r)),new q(r,a.status,l)}$.info(`api ← GET ${e} ${a.status} (${s}ms)`),St(e);const n=a.headers.get("Content-Type")||"application/octet-stream";return{blob:await a.blob(),contentType:n}}async function C(e,t={}){const a=new Headers(t.headers);t.body&&!a.has("Content-Type")&&a.set("Content-Type","application/json");const s=(t.method||"GET").toUpperCase();s!=="GET"&&s!=="HEAD"&&s!=="OPTIONS"&&Fe&&a.set("X-CSRF-Token",Fe);const n=typeof performance<"u"?performance.now():Date.now();$.debug(`api → ${s} ${e}`);const i=await fetch(`/api${e}`,{...t,headers:a,credentials:"same-origin"});let r=null;const l=await i.text();if(l)try{r=JSON.parse(l)}catch{r={error:l}}const o=Math.round((typeof performance<"u"?performance.now():Date.now())-n);if(!i.ok){let d=`Request failed (${i.status})`,m={};if(r&&typeof r=="object"&&r!==null){const u=r;m={...u},typeof u.error=="string"&&(d=u.error)}else(i.status===500||i.status===504)&&(d="Server error during import (often a timeout on large calendars). Try again — already imported events update faster.");throw i.status>=500?$.error(`api ← ${s} ${e} ${i.status} (${o}ms)`,d):i.status!==401?$.warn(`api ← ${s} ${e} ${i.status} (${o}ms)`,d):($.debug(`api ← ${s} ${e} 401 (${o}ms)`),Je(e,d)),new q(d,i.status,m)}return $.info(`api ← ${s} ${e} ${i.status} (${o}ms)`),St(e),r}function W(e){return encodeURIComponent(e)}async function un(e,t,a,s){const n=new Headers({"Content-Type":a,Accept:"application/x-ndjson, application/json;q=0.9"});Fe&&n.set("X-CSRF-Token",Fe);const i=typeof performance<"u"?performance.now():Date.now();$.debug(`api → POST ${e} (stream, ${a}, ${t.length} bytes)`);let r;try{r=await fetch(`/api${e}`,{method:"POST",headers:n,credentials:"same-origin",body:t})}catch(f){const v=f instanceof Error?f.message:"Network error";throw $.error(`api ← POST ${e} network fail`,v),new q(`Import request failed to start (${v}). Check connectivity and container logs.`,0)}const l=(r.headers.get("Content-Type")||"").toLowerCase(),o=l.includes("ndjson")||l.includes("x-ndjson");if(!r.ok&&!o){let f=`Request failed (${r.status})`;try{const v=await r.json();v.error&&(f=v.error)}catch{}throw(r.status===504||r.status===502)&&(f="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),r.status===401?($.debug(`api ← POST ${e} 401`,f),Je(e,f)):$.warn(`api ← POST ${e} ${r.status}`,f),new q(f,r.status)}if(!o&&r.ok){try{const f=await r.json();if(f&&typeof f.error=="string")throw new q(f.error,r.status||500);if(f&&typeof f.imported=="number"&&typeof f.updated=="number")return $.info(`api ← POST ${e} json done`),f}catch(f){if(f instanceof q)throw f}throw new q("Unexpected import response from server",500)}if(!r.body)throw new q("Import stream unavailable",500);const d=r.body.getReader(),m=new TextDecoder;let u="";const b={final:null,error:null,sawProgress:!1},p=f=>{let v;try{v=JSON.parse(f)}catch{$.debug("import stream non-JSON line",f.slice(0,80));return}if(v.type==="progress"){b.sawProgress=!0;const S=Number(v.total)||0,h=Number(v.current)||0,E=typeof v.percent=="number"?v.percent:S>0?Math.round(100*h/S):0;s==null||s({percent:E,current:h,total:S,imported:Number(v.imported)||0,updated:Number(v.updated)||0,skipped:Number(v.skipped)||0})}else v.type==="done"&&v.result?b.final=v.result:v.type==="error"&&(b.error={message:v.error||"Import failed",status:v.status||500})};for(;;){const{done:f,value:v}=await d.read();if(f)break;u+=m.decode(v,{stream:!0});const S=u.split(`
`);u=S.pop()??"";for(const h of S){const E=h.trim();E&&p(E)}}u.trim()&&p(u.trim());const g=Math.round((typeof performance<"u"?performance.now():Date.now())-i);if(b.error)throw b.error.status===401?($.debug(`api ← POST ${e} stream 401 (${g}ms)`,b.error.message),Je(e,b.error.message)):$.warn(`api ← POST ${e} stream error (${g}ms)`,b.error.message),new q(b.error.message,b.error.status);if(!b.final)throw $.error(`api ← POST ${e} stream incomplete (${g}ms)`,{sawProgress:b.sawProgress}),new q(b.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return $.info(`api ← POST ${e} stream done (${g}ms)`),St(e),b.final}const ps={adminPing:()=>C("/admin/ping"),adminDashboard:()=>C("/admin/dashboard"),adminCapabilities:()=>C("/admin/capabilities"),adminUsers:()=>C("/admin/users"),adminUser:e=>C(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>C("/admin/users",{method:"POST",body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>C(`/admin/users/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>C(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserCalendar:(e,t,a=!0)=>C(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a})}),adminUserAddressBooks:e=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:"POST",body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,a)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"PATCH",body:JSON.stringify(a)}),adminDeleteUserAddressBook:(e,t,a=!0,s=!1)=>C(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:"DELETE",body:JSON.stringify({confirm:a,force:s})}),adminSystemSettings:()=>C("/admin/settings/system"),adminUpdateSystemSettings:e=>C("/admin/settings/system",{method:"PATCH",body:JSON.stringify(e)}),adminResetToDefault:(e=!0,t="")=>C("/admin/settings/reset-to-default",{method:"POST",body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>C("/admin/settings/database"),adminTestDatabaseConnection:e=>C("/admin/settings/database/test",{method:"POST",body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>C("/admin/settings/database",{method:"PATCH",body:JSON.stringify(e)}),me:async()=>{var t;const e=await C("/me");return lt(e.csrfToken||((t=e.user)==null?void 0:t.csrfToken)||""),e},login:async(e,t)=>{var s;const a=await C("/login",{method:"POST",body:JSON.stringify({username:e,password:t})});return lt((s=a.user)==null?void 0:s.csrfToken),a},logout:async()=>{try{return await C("/logout",{method:"POST"})}finally{lt("")}}},bs={calendars:()=>C("/calendars"),createCalendar:e=>C("/calendars",{method:"POST",body:JSON.stringify(e)}),holidayCountries:()=>C("/holidays/countries"),updateCalendar:(e,t)=>C(`/calendars/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteCalendar:e=>C(`/calendars/${e}`,{method:"DELETE"}),calendarEvents:(e,t,a)=>{const s=new URLSearchParams({from:t,to:a}).toString();return C(`/calendars/${e}/events?${s}`)},getEvent:(e,t)=>C(`/calendars/${e}/events/${W(t)}`),createEvent:(e,t)=>C(`/calendars/${e}/events`,{method:"POST",body:JSON.stringify(t)}),updateEvent:(e,t,a)=>C(`/calendars/${e}/events/${W(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteEvent:(e,t)=>C(`/calendars/${e}/events/${W(t)}`,{method:"DELETE"}),exportCalendar:async e=>{const t=await fetch(`/api/calendars/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new q(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`calendar-${e}.ics`;return{blob:await t.blob(),filename:n}},importCalendar:(e,t,a)=>un(`/calendars/${e}/import`,t,"text/calendar; charset=utf-8",a),directory:()=>C("/directory"),shares:e=>C(`/calendars/${e}/shares`),share:(e,t,a)=>C(`/calendars/${e}/shares`,{method:"POST",body:JSON.stringify({username:t,access:a})}),revoke:(e,t)=>C(`/calendars/${e}/shares`,{method:"DELETE",body:JSON.stringify({href:t})})},gs={addressbooks:()=>C("/addressbooks"),createAddressBook:e=>C("/addressbooks",{method:"POST",body:JSON.stringify(e)}),updateAddressBook:(e,t)=>C(`/addressbooks/${e}`,{method:"PATCH",body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>C(`/addressbooks/${e}`,{method:"DELETE",body:JSON.stringify({force:t})}),exportAddressBook:async e=>{const t=await fetch(`/api/addressbooks/${e}/export`,{credentials:"same-origin"});if(!t.ok){let r=`Export failed (${t.status})`;try{const l=await t.json();l.error&&(r=l.error)}catch{}throw new q(r,t.status)}const a=t.headers.get("Content-Disposition")||"",s=/filename="([^"]+)"/i.exec(a),n=(s==null?void 0:s[1])||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:n}},importAddressBook:(e,t,a)=>un(`/addressbooks/${e}/import`,t,"text/vcard; charset=utf-8",a),contacts:(e,t="")=>{const a=t.trim()?`?q=${encodeURIComponent(t.trim())}`:"";return C(`/addressbooks/${e}/contacts${a}`)},getContact:(e,t)=>C(`/addressbooks/${e}/contacts/${W(t)}`),createContact:(e,t)=>C(`/addressbooks/${e}/contacts`,{method:"POST",body:JSON.stringify(t)}),updateContact:(e,t,a)=>C(`/addressbooks/${e}/contacts/${W(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteContact:(e,t)=>C(`/addressbooks/${e}/contacts/${W(t)}`,{method:"DELETE"}),exportContact:async(e,t)=>{const a=await fetch(`/api/addressbooks/${e}/contacts/${W(t)}/export`,{credentials:"same-origin"});if(!a.ok){let l=`Export failed (${a.status})`;try{const o=await a.json();o.error&&(l=o.error)}catch{}throw new q(l,a.status)}const s=a.headers.get("Content-Disposition")||"",n=/filename="([^"]+)"/i.exec(s),i=(n==null?void 0:n[1])||"contact.vcf";return{blob:await a.blob(),filename:i}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${W(t)}/photo`,bulkContacts:(e,t)=>C(`/addressbooks/${e}/contacts/bulk`,{method:"POST",body:JSON.stringify(t)}),exportContacts:async(e,t)=>{const a=await C(`/addressbooks/${e}/contacts/export`,{method:"POST",body:JSON.stringify({uris:t})});return{blob:new Blob([a.vcf],{type:"text/vcard;charset=utf-8"}),filename:a.filename||"contacts.vcf"}}},ys={filesStatus:()=>C("/files"),filesList:(e="")=>{const t=new URLSearchParams;e&&t.set("path",e);const a=t.toString()?`?${t}`:"";return C(`/files/entries${a}`)},filesMkdir:(e,t)=>C("/files/mkdir",{method:"POST",body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,a={})=>{const s=new URLSearchParams;e&&s.set("path",e),s.set("name",t.name),a.replace&&s.set("replace","1");const n=new FormData;n.append("file",t,t.name),e&&n.append("path",e);const i=typeof performance<"u"?performance.now():Date.now();return $.debug(`api → POST /files/upload path=${e||"/"} name=${t.name} size=${t.size}`),new Promise((r,l)=>{const o=new XMLHttpRequest;o.open("POST",`/api/files/upload?${s}`),o.withCredentials=!0;const d=cs();d&&o.setRequestHeader("X-CSRF-Token",d),a.onProgress&&(o.upload.onprogress=m=>{var u,b;m.lengthComputable?(u=a.onProgress)==null||u.call(a,m.loaded,m.total):(b=a.onProgress)==null||b.call(a,m.loaded,t.size||m.loaded)}),o.onload=()=>{const m=Math.round((typeof performance<"u"?performance.now():Date.now())-i);let u=null;const b=o.responseText||"";if(b)try{u=JSON.parse(b)}catch{u={error:b}}const p=o.status;if(p<200||p>=300){let g=`Upload failed (${p||0})`;u&&typeof u=="object"&&u!==null&&"error"in u&&typeof u.error=="string"&&(g=u.error),p===401?($.debug(`api ← POST /files/upload 401 (${m}ms)`,g),Je("/files/upload",g)):p>=500?$.error(`api ← POST /files/upload ${p} (${m}ms)`,g):$.warn(`api ← POST /files/upload ${p} (${m}ms)`,g),l(new q(g,p||0));return}$.info(`api ← POST /files/upload 200 (${m}ms)`),St("/files/upload"),r(u)},o.onerror=()=>{const m=Math.round((typeof performance<"u"?performance.now():Date.now())-i);$.error(`api ← POST /files/upload network error (${m}ms)`),l(new q("Upload failed (network error)",0))},o.onabort=()=>{l(new q("Upload cancelled",0))},o.send(n)})},filesDownloadUrl:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),`/api/files/download?${a}`},filesGetBlob:(e,t)=>{const a=new URLSearchParams;return a.set("path",e),t!=null&&t.inline&&a.set("inline","1"),fs(`/files/download?${a}`)},filesDelete:e=>C("/files/entry",{method:"DELETE",body:JSON.stringify({path:e})}),filesRename:(e,t)=>C("/files/rename",{method:"POST",body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,a)=>C("/files/move",{method:"POST",body:JSON.stringify({from:e,to:t,newName:a})}),filesCopy:(e,t={})=>C("/files/copy",{method:"POST",body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>C("/files/bulk",{method:"POST",body:JSON.stringify({op:e,paths:t})})},vs={tasks:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/tasks${a}`)},createTask:e=>C("/tasks",{method:"POST",body:JSON.stringify(e)}),updateTask:(e,t,a)=>C(`/tasks/${e}/${W(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteTask:(e,t)=>C(`/tasks/${e}/${W(t)}`,{method:"DELETE"}),bulkTasks:e=>C("/tasks/bulk",{method:"POST",body:JSON.stringify(e)}),notes:(e={})=>{const t=new URLSearchParams;e.q&&t.set("q",e.q),e.sort&&t.set("sort",e.sort),e.order&&t.set("order",e.order);const a=t.toString()?`?${t}`:"";return C(`/notes${a}`)},createNote:e=>C("/notes",{method:"POST",body:JSON.stringify(e)}),updateNote:(e,t,a)=>C(`/notes/${e}/${W(t)}`,{method:"PATCH",body:JSON.stringify(a)}),deleteNote:(e,t)=>C(`/notes/${e}/${W(t)}`,{method:"DELETE"}),bulkNotes:e=>C("/notes/bulk",{method:"POST",body:JSON.stringify(e)})},$s={ui:()=>C("/ui"),installStatus:async()=>{const e=await C("/install/status");return e&&typeof e=="object"&&"data"in e&&e.data?e.data:e}},D={...$s,...ps,...bs,...gs,...vs,...ys},mn="angaradav-portal-tab",fn="angaradav-portal-admin-page",hs="angaradav-portal-cal-selection",Vt="2.3.3";function ws(e){const t=(e||Vt).trim(),a=t.indexOf("+");return a<=0?{version:t||Vt,build:""}:{version:t.slice(0,a),build:t.slice(a+1)}}const ks="https://github.com/offsyanka99/AngaraDAV/tree/main/docs";function Ss(e){const t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:"",adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:"",adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:"sqlite",adminDbConfirmOpen:!1,adminDbConfirmText:"",adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,userSettings:ln(),userSettingsOpen:!1,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],calendarSelectionSeeded:!1,listKeyboardFocus:!1,shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},calView:"month",calFocusDay:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,eventSearch:"",eventSearchFocus:!1,monthEvents:[],monthEventsLoading:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:"",monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:"",selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,filesDropDepth:0,escapeBound:!1,portalEventsBound:!1,portalUi:{timeFormat:"auto",weekStart:"auto",logLevel:"off",services:null},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:Vt,handlingSessionExpiry:!1,suppressErrorFlashAfterExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskSearch:"",noteSearch:"",taskSort:"due",taskOrder:"asc",noteSort:"dtstart",noteOrder:"desc",selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,checkedTaskKeys:[],checkedNoteKeys:[],checkedContactUris:[],filesStatus:null,filesPath:"",filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:"",filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,filesSearch:"",filesSearchFocus:!1,filesSort:"name",filesOrder:"asc",filesTypeFilter:"all",checkedFilePaths:[],filesItemMenu:null,filesItemMenuDocClick:null,filesItemMenuWinClose:null,filesPreview:null,filesPreviewSeq:0,filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}function pn(e,t,a){e.suppressErrorFlashAfterExpiry&&t==="error"||(t!=="error"&&(e.suppressErrorFlashAfterExpiry=!1),e.flash={type:t,message:a})}function Ds(e){e.flash=null,e.suppressErrorFlashAfterExpiry=!1}function Kt(e){return e.flash?se(e.flash.type,e.flash.message,{dismissible:!0}):""}function he(e){var t,a;return!!((t=e.user)!=null&&t.isAdmin||((a=e.user)==null?void 0:a.role)==="Admin")}function Ge(e){return he(e)?e.adminCapabilities===null?!0:e.adminCapabilities.uiEnabled!==!1:!1}function ot(e,t){if(!t)return;const a=(t.timeFormat||"auto").toLowerCase(),s=(t.weekStart||"auto").toLowerCase(),n=e.portalUi.services;let i=n;if(t.services&&typeof t.services=="object"){const r=n??{caldav:!0,carddav:!0,tasks:!0,notes:!0,files:!0},l=t.services;i={caldav:typeof l.caldav=="boolean"?l.caldav:r.caldav,carddav:typeof l.carddav=="boolean"?l.carddav:r.carddav,tasks:typeof l.tasks=="boolean"?l.tasks:r.tasks,notes:typeof l.notes=="boolean"?l.notes:r.notes,files:typeof l.files=="boolean"?l.files:r.files}}e.portalUi={timeFormat:a==="12h"||a==="24h"?a:"auto",weekStart:s==="monday"||s==="sunday"?s:"auto",logLevel:t.logLevel||"off",services:i},os(e.portalUi.logLevel),typeof t.sessionIdleSeconds=="number"&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version=="string"&&t.version.trim()!==""&&(e.appVersion=t.version.trim())}function te(e,t){if(t==="admin")return!0;const a=e.portalUi.services;if(!a)return!0;switch(t){case"calendars":return a.caldav;case"contacts":return a.carddav;case"tasks":return a.tasks;case"notes":return a.notes;case"files":return a.files;default:return!0}}function ft(e){const t=["calendars","contacts","tasks","notes","files"];for(const a of t)if(te(e,a))return a;return"calendars"}function na(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function jt(e,t){if(na(e),!e.user)return;const a=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t("Your session timed out. Please sign in again.")},a)}function Cs(e,t){var a;na(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.calendarSelectionSeeded=!1,e.listKeyboardFocus=!1,e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.userSettingsOpen=!1,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.calView="month",e.eventSearch="",e.eventSearchFocus=!1;{const s=new Date;e.calFocusDay=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`,e.monthCursor={y:s.getFullYear(),m:s.getMonth()}}if(e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.creatingTask=!1,e.creatingNote=!1,e.checkedTaskKeys=[],e.checkedNoteKeys=[],e.checkedContactUris=[],e.filesStatus=null,e.filesPath="",e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesSearch="",e.filesSearchFocus=!1,e.filesSort="name",e.filesOrder="asc",e.filesTypeFilter="all",e.filesItemMenu=null,e.filesItemMenuDocClick&&(document.removeEventListener("click",e.filesItemMenuDocClick,!0),e.filesItemMenuDocClick=null),e.filesItemMenuWinClose&&(window.removeEventListener("resize",e.filesItemMenuWinClose),e.filesItemMenuWinClose=null),(a=e.filesPreview)!=null&&a.objectUrl)try{URL.revokeObjectURL(e.filesPreview.objectUrl)}catch{}e.filesPreview=null,e.filesPreviewSeq+=1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery="",e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword="",e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend="sqlite",e.adminDbConfirmOpen=!1,e.adminDbConfirmText="",e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function Es(e,t){if(!e.handlingSessionExpiry){if(!e.user){na(e);return}e.handlingSessionExpiry=!0;try{$.event("session.expired"),t.clearSession(),e.suppressErrorFlashAfterExpiry=!0,e.flash={type:"info",message:t.message&&t.message.trim()?t.message:"Your session timed out. Please sign in again."},t.render()}finally{e.handlingSessionExpiry=!1}}}function Ts(e,t){const a=String(t.step||"");a==="upgrade"||a==="initialize"||a==="permissions"||a==="database"?(e.installGate={step:a,message:t.message||(a==="upgrade"?"Complete the upgrade wizard before signing in.":"Complete setup before signing in."),installUrl:t.installUrl||"/portal/install/",productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion=="string"&&t.productVersion.trim()!==""&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function Ps(e,t){if(!(t instanceof q)||t.status!==503)return!1;const a=typeof t.payload.code=="string"?t.payload.code:"";if(a!=="upgrade_required"&&a!=="not_configured"&&a!=="admin_password_missing")return!1;const s=a==="upgrade_required"?"upgrade":"initialize";return e.installGate={step:s,message:t.message,installUrl:typeof t.payload.installUrl=="string"?t.payload.installUrl:"/portal/install/",productVersion:typeof t.payload.productVersion=="string"?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion=="string"?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0}async function bn(e){var a,s,n,i;const{state:t}=e;if(t.activeTab==="admin"&&he(t)&&Ge(t))try{t.adminPage==="overview"&&((a=e.adminPageMeta("overview"))==null?void 0:a.available)!==!1?await e.loadAdminDashboard():t.adminPage==="users"&&((s=e.adminPageMeta("users"))==null?void 0:s.available)!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage==="settings"&&((n=e.adminPageMeta("settings"))==null?void 0:n.available)!==!1?await e.loadAdminSystemSettings():t.adminPage==="database"&&((i=e.adminPageMeta("database"))==null?void 0:i.available)!==!1&&await e.loadAdminDatabaseSettings()}catch(r){$.warn("admin page load",r instanceof Error?r.message:r)}}async function Fs(e){var a;const{state:t}=e;$.event("bootstrap.start"),us(s=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(s)?s:"Your session timed out. Please sign in again.")}),ms(()=>{jt(t,s=>e.handleSessionExpired(s))});try{const s=await D.installStatus();Ts(t,s)}catch(s){$.debug("bootstrap: /api/install/status failed",s instanceof Error?s.message:s)}try{const s=await D.ui();ot(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""?t.appVersion=s.version.trim():s.ui&&typeof s.ui.version=="string"&&s.ui.version.trim()!==""&&(t.appVersion=s.ui.version.trim())}catch(s){$.debug("bootstrap: /api/ui failed",s instanceof Error?s.message:s),Ps(t,s)}if(t.installGate&&t.installGate.step!=="done"&&t.installGate.step!=="locked"){e.clearPortalSessionState(),$.event("bootstrap.installGate",{step:t.installGate.step}),e.render();return}try{const s=await D.me();if(!s.user)e.clearPortalSessionState(),ot(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),$.event("bootstrap.anonymous");else{if(t.user=s.user,t.userSettings=aa(t.user.username),ot(t,s.ui),typeof s.version=="string"&&s.version.trim()!==""&&(t.appVersion=s.version.trim()),$.event("bootstrap.session",{username:((a=t.user)==null?void 0:a.username)??null}),jt(t,n=>e.handleSessionExpired(n)),he(t))try{await e.loadAdminCapabilities()}catch(n){$.warn("admin.capabilities bootstrap",n instanceof Error?n.message:n)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await bn(e)}}catch(s){s instanceof q&&s.status===401?(e.clearPortalSessionState(),$.event("bootstrap.anonymous")):($.error("bootstrap failed",s instanceof Error?s.message:s),pn(t,"error",s instanceof Error?s.message:"Failed to load"))}e.render()}async function As(e,t){var r,l;const{state:a}=t,s=new FormData(e),n=String(s.get("username")??""),i=String(s.get("password")??"");a.busy=!0,t.clearFlash(),t.render(),$.event("login.attempt",{username:n});try{const o=await D.login(n,i);if(a.user=o.user,a.userSettings=aa(((r=a.user)==null?void 0:r.username)??n),ot(a,o.ui),$.event("login.ok",{username:((l=a.user)==null?void 0:l.username)??n}),jt(a,d=>t.handleSessionExpired(d)),he(a))try{await t.loadAdminCapabilities()}catch(d){$.warn("admin.capabilities login",d instanceof Error?d.message:d)}t.normalizeActiveTab(),t.persistTab(a.activeTab,a.adminPage),await t.loadHome(),await bn(t),t.setFlash("success","Signed in")}catch(o){$.warn("login.failed",o instanceof Error?o.message:o),t.setFlash("error",o instanceof Error?o.message:"Login failed")}finally{a.busy=!1,t.render()}}function Ua(e,t,a){const s=t.installGate,n=s&&(s.step==="upgrade"||s.step==="initialize"||s.step==="permissions"||s.step==="database"),i=(s==null?void 0:s.installUrl)||"/portal/install/";let r="";if(n&&s){const o=s.step==="upgrade"?"Server upgrade required":"Setup incomplete",d=s.step==="upgrade"&&(s.configuredVersion||s.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${c(String(s.configuredVersion||"—"))}</span>
              → product <span class="mono">${c(String(s.productVersion||"—"))}</span></p>`:"";r=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${c(o)}.</strong>
            ${c(s.message||"Complete the installer before signing in.")}
            ${d}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${c(i)}">Open installer</a>
        </p>`}const l=t.busy||!!n;e.innerHTML=a(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${r}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials.</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${l?"disabled":""} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${l?"disabled":""} />
            </label>
            <button type="submit" class="btn btn-primary" ${l?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            This portal is for calendars, contacts, tasks/notes and files.
          </p>
        </div>
      </div>`,{auth:!0})}function Ia(e){const t=e.querySelector(".contacts-table-wrap"),a=e.querySelector(".contacts-ab-list"),s=e.querySelector(".calendars-owned-list"),n=e.querySelector(".files-table-wrap");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(a==null?void 0:a.scrollTop)??null,calListTop:(s==null?void 0:s.scrollTop)??null,filesTableTop:(n==null?void 0:n.scrollTop)??null}}function Ma(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const a=e.querySelector(".contacts-table-wrap");a&&(a.scrollTop=t.tableTop)}if(t.abListTop!==null){const a=e.querySelector(".contacts-ab-list");a&&(a.scrollTop=t.abListTop)}if(t.calListTop!==null){const a=e.querySelector(".calendars-owned-list");a&&(a.scrollTop=t.calListTop)}if(t.filesTableTop!==null){const a=e.querySelector(".files-table-wrap");a&&(a.scrollTop=t.filesTableTop)}})})}const Oa="hummersoft@mailbox.org",Us="AngaraDAV",Na="https://github.com/offsyanka99/AngaraDAV";function Is(e){const{version:t,build:a}=ws(e.appVersion),s=a||"—";return`
    <div class="info-modal" id="about-modal" hidden role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div class="info-modal-backdrop" data-action="about-close"></div>
      <div class="info-modal-card about-modal-card">
        <header class="info-modal-header">
          <h3 id="about-modal-title">About</h3>
          <button type="button" class="modal-close info-modal-close" data-action="about-close" aria-label="Close">×</button>
        </header>
        <div class="about-modal-body">
          <img class="about-logo" src="/logo.png" width="72" height="72" alt="" />
          <p class="about-name">${c(Us)}</p>
          <dl class="about-meta">
            <div><dt>Version</dt><dd class="mono">${c(t)}</dd></div>
            <div><dt>Build</dt><dd class="mono">${c(s)}</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:${c(Oa)}">${c(Oa)}</a></dd></div>
            <div><dt>GitHub</dt><dd><a href="${c(Na)}" target="_blank" rel="noopener noreferrer">${c(Na.replace(/^https:\/\//,""))}</a></dd></div>
          </dl>
        </div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="about-close">Close</button>
        </footer>
      </div>
    </div>`}function Ms(e){var a;const t=e.querySelector("#about-modal");t&&(t.hidden=!1,document.body.classList.add("info-modal-open"),(a=t.querySelector(".info-modal-close"))==null||a.focus())}function gn(e){const t=e.querySelector("#about-modal");if(!t)return;t.hidden=!0;const a=e.querySelector("#info-modal");(!a||a.hidden)&&document.body.classList.remove("info-modal-open")}function Os(e){const t=e.querySelector("#about-modal");return!!t&&!t.hidden}function Nt(e,t,a={}){const s=!!e.user&&e.activeTab==="admin"&&he(e)&&Ge(e),r=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${s?"brand-portal brand-portal-admin":"brand-portal brand-portal-user"}">${c(s?"Administration Portal":"User Portal")}</span></span>`,l=e.user?c(e.user.displayname||e.user.username):"",o=Ge(e)?`<button type="button" class="user-menu-item${e.activeTab==="admin"?" is-active":""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:"",d=s?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:"",m=e.user?`<div class="user-menu${e.userMenuOpen?" is-open":""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${e.userMenuOpen?"true":"false"}"
              title="${l}">
              <span class="user-menu-name">${l}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${e.userMenuOpen?"":"hidden"}>
              ${d}
              ${o}
              <button type="button" class="user-menu-item" role="menuitem" data-action="user-settings-open">
                User settings
              </button>
              <div class="user-menu-sep" role="separator"></div>
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:"",u=e.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
          <div class="topnav-right">
            ${m}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
        </nav>`,p=!(e.calModalOpen||e.createCalModalOpen||e.deleteConfirmId!==null||e.deleteAbConfirmId!==null||e.eventModalOpen||e.contactModalOpen||e.abModalOpen||e.filesRenamePath!==null||e.filesDeletePaths!==null||e.filesTransfer!==null||e.filesMkdirOpen||e.filesPreview!==null||e.filesUploadConflict!==null||e.filesUploadProgress!==null||e.confirmDelete!==null)?Kt(e):"",g=a.tabs&&a.tabs.trim()!==""?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${a.tabs}
        </div>
      </div>`:"",f=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal</span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="footer-link" data-action="about-open">About</button>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(ks)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>
      ${Is(e)}
      ${rs(e)}`;return a.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`<div class="app-chrome">
      ${u}
      ${g}
    </div>
      <main class="container">
        ${p}
        ${t}
      </main>
      ${f}`}function zt(e){e.userMenuDocClick&&(document.removeEventListener("click",e.userMenuDocClick,!0),e.userMenuDocClick=null)}function Ns(e,t){zt(e),e.userMenuDocClick=s=>{var i;const n=s.target;(i=n==null?void 0:n.closest)!=null&&i.call(n,".user-menu")||(e.userMenuOpen=!1,zt(e),t())};const a=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===a&&document.addEventListener("click",a,!0)},0)}function pt(e){e.dtPickerDocClick&&(document.removeEventListener("click",e.dtPickerDocClick,!0),e.dtPickerDocClick=null)}function xs(e,t){if(pt(e),!e.eventDtPicker)return;e.dtPickerDocClick=s=>{var i,r;const n=s.target;(i=n==null?void 0:n.closest)!=null&&i.call(n,".dt-field.is-open, .dt-popover, [data-dt-popover]")||(r=n==null?void 0:n.closest)!=null&&r.call(n,'[data-action="dt-open"]')||(e.eventDtPicker=null,pt(e),t())};const a=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===a&&document.addEventListener("click",a,!0)},0)}function Ls(e,t){return!t||e.includes(t)?e:[t]}function sa(e,t){const a=new Map(e.map(r=>[r.path,r])),s=[];for(const r of t){const l=a.get(r);l&&s.push(l)}const n=s.filter(r=>r.type==="file"),i=s.length;return{count:i,heading:i>1?`${i} items`:null,showDownload:n.length>0,downloadItems:n.map(r=>({path:r.path,name:r.name})),renameEnabled:i===1,renamePath:i===1?s[0].path:null,renameName:i===1?s[0].name:null}}function ra(e){return!!(e.busy||e.filesRenamePath||e.filesDeletePaths||e.filesTransfer||e.filesMkdirOpen||e.filesPreview||e.filesUploadConflict||e.filesUploadProgress)}function O(e){la(e),e.state.filesItemMenu=null}function ia(e,t,a){!t||ra(e.state)||e.state.filesEntries.some(s=>s.path===t)&&(e.state.checkedFilePaths=Ls(e.state.checkedFilePaths,t),e.state.filesItemMenu={path:t,x:a.x,y:a.y,origin:a.origin},e.state.filesUploadMenuOpen=!1,e.render())}function la(e){e.state.filesItemMenuDocClick&&(document.removeEventListener("click",e.state.filesItemMenuDocClick,!0),e.state.filesItemMenuDocClick=null),e.state.filesItemMenuWinClose&&(window.removeEventListener("resize",e.state.filesItemMenuWinClose),e.state.filesItemMenuWinClose=null)}function _s(e){la(e),e.state.filesItemMenuDocClick=a=>{var n,i;const s=a.target;(n=s==null?void 0:s.closest)!=null&&n.call(s,"#files-item-menu")||(i=s==null?void 0:s.closest)!=null&&i.call(s,'[data-action="files-item-menu-toggle"]')||(O(e),e.render())};const t=e.state.filesItemMenuDocClick;setTimeout(()=>{e.state.filesItemMenu&&e.state.filesItemMenuDocClick===t&&document.addEventListener("click",t,!0)},0),e.state.filesItemMenuWinClose=()=>{e.state.filesItemMenu&&(O(e),e.render())},window.addEventListener("resize",e.state.filesItemMenuWinClose)}function Rs(e){const t=e.root.querySelector("#files-item-menu");if(!t||!e.state.filesItemMenu)return;xa(e),requestAnimationFrame(()=>xa(e));const a=e.root.querySelector(".files-table-wrap"),s=e.state.filesItemMenuWinClose;a&&s&&a.addEventListener("scroll",s,{passive:!0});const n=[...t.querySelectorAll('[role="menuitem"]:not([disabled])')];e.state.filesItemMenu.origin==="button"&&n.length>0&&!t.contains(document.activeElement)&&n[0].focus(),t.addEventListener("keydown",r=>{var u;if(r.key!=="ArrowDown"&&r.key!=="ArrowUp"&&r.key!=="Home"&&r.key!=="End")return;const l=[...t.querySelectorAll('[role="menuitem"]:not([disabled])')];if(l.length===0)return;r.preventDefault();const o=document.activeElement,d=o?l.indexOf(o):-1;let m=0;r.key==="ArrowDown"?m=d<0?0:(d+1)%l.length:r.key==="ArrowUp"?m=d<0?l.length-1:(d-1+l.length)%l.length:r.key==="End"&&(m=l.length-1),(u=l[m])==null||u.focus()})}function xa(e){const t=e.root.querySelector("#files-item-menu"),a=e.state.filesItemMenu;if(!t||!a)return;let s=a.x,n=a.y;if(a.origin==="button"){const d=e.root.querySelector(`.files-row-menu-btn[data-path="${CSS.escape(a.path)}"]`);if(d){const m=d.getBoundingClientRect();s=m.right,n=m.bottom+4}}t.style.left=`${s}px`,t.style.top=`${n}px`;const i=t.getBoundingClientRect(),r=8;let l=a.origin==="button"?s-i.width:s,o=n;l+i.width>window.innerWidth-r&&(l=window.innerWidth-r-i.width),l<r&&(l=r),o+i.height>window.innerHeight-r&&(o=n-i.height-(a.origin==="button"?8:0)),o<r&&(o=r),t.style.left=`${Math.round(l)}px`,t.style.top=`${Math.round(o)}px`}function qs(e){const t=e.state.filesItemMenu;if(!t)return"";const a=sa(e.state.filesEntries,e.state.checkedFilePaths);if(a.count===0)return"";const s=e.state.busy?"disabled":"",n=a.showDownload?`<button type="button" class="files-item-menu-item" role="menuitem"
          data-action="files-bulk-download" ${s}>Download</button>
       <div class="files-item-menu-sep" role="separator"></div>`:"",i=e.state.busy||!a.renameEnabled,r=a.renamePath??"",l=a.renameName??"",o=a.heading?`<div class="files-item-menu-heading" id="files-item-menu-label">${c(a.heading)}</div>`:"";return`<div id="files-item-menu" class="files-item-menu" role="menu"${a.heading?' aria-labelledby="files-item-menu-label"':""}
            style="left:${t.x}px;top:${t.y}px">
    ${o}
    ${n}
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-copy" ${s}>Copy</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-move" ${s}>Move</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-rename-open" data-path="${c(r)}" data-name="${c(l)}"
      ${i?"disabled":""}
      title="${a.renameEnabled?"Rename":"Select a single item to rename"}">Rename</button>
    <div class="files-item-menu-sep" role="separator"></div>
    <button type="button" class="files-item-menu-item is-danger" role="menuitem"
      data-action="files-bulk-delete" ${s}>Delete</button>
  </div>`}function Bs(e){e.forEach((t,a)=>{window.setTimeout(()=>{const s=document.createElement("a");s.href=D.filesDownloadUrl(t.path),s.download=t.name,s.rel="noopener",document.body.appendChild(s),s.click(),s.remove(),$.event("files.download",{path:t.path,via:"selection"})},a*100)})}async function ne(e){e.state.filesLoading=!0;try{$.debug("loadFiles",{path:e.state.filesPath});const[t,a]=await Promise.all([D.filesStatus(),D.filesList(e.state.filesPath).catch(s=>{if(s instanceof q&&(s.status===503||s.status===404))return{path:e.state.filesPath,entries:[]};throw s})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=a.path,e.state.filesEntries=a.entries;const s=new Set(e.state.filesEntries.map(n=>n.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(n=>s.has(n)),e.state.filesItemMenu&&!s.has(e.state.filesItemMenu.path)&&O(e)}else e.state.filesEntries=[],e.state.checkedFilePaths=[],O(e);$.event("loadFiles",{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function yn(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function We(e){const t=e.replace(/\\/g,"/").split("/").filter(Boolean);return t[t.length-1]||e}function Dt(e,t,a){for(const s of a)if(s&&(t===s||t.startsWith(`${s}/`)))return!0;return!1}function Q(e){e.state.filesTransfer=null,e.state.filesTransferDest="",e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function at(e,t,a){if(a.length===0)return;e.state.filesTransfer={op:t,paths:[...a]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};const s=new Set([""]);if(e.state.filesPath){const n=e.state.filesPath.split("/").filter(Boolean);let i="";for(const r of n)i=i?`${i}/${r}`:r,s.add(i)}e.state.filesTreeExpanded=[...s],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),O(e),e.clearFlash(),e.render(),await Promise.all([...s].map(n=>Wt(e,n)))}async function Wt(e,t){const a=e.state.filesTreeChildren[t];if(!(a&&a!=="error")){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"loading"},e.render();try{const n=(await D.filesList(t)).entries.filter(i=>i.type==="dir").slice().sort((i,r)=>i.name.localeCompare(r.name,void 0,{sensitivity:"base"}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:n}}catch(s){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:"error"},$.warn("files.tree",{path:t||"/",error:s instanceof Error?s.message:String(s)})}e.render()}}function Hs(e){if(!e.state.filesTransfer)return"";const t=e.state.filesTransfer.paths,a=[],s=(n,i)=>{const r=e.state.filesTransferDest===n,l=Dt(e,n,t),o=e.state.filesTreeExpanded.includes(n),d=e.state.filesTreeChildren[n],m=Array.isArray(d),u=n===""||d==="loading"||d==="error"||!m||d.length>0,b=n===""?"Home":We(n),p=l?"Cannot use a selected item (or a folder inside it) as the destination":n===""?"File home host.root":n,g=o?"▾":"▸";if(a.push(`<div class="files-tree-row${r?" is-selected":""}${l?" is-blocked":""}" style="--depth:${i}" role="treeitem" aria-selected="${r}" aria-expanded="${o}" aria-disabled="${l}">
      ${u?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${c(n)}"
              aria-label="${o?"Collapse":"Expand"} ${c(b)}" ${e.state.busy?"disabled":""}>${g}</button>`:'<span class="files-tree-toggle-spacer" aria-hidden="true"></span>'}
      <button type="button" class="files-tree-select${r?" is-selected":""}" data-action="files-tree-select" data-path="${c(n)}"
        title="${c(p)}" ${e.state.busy||l?"disabled":""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${c(b)}</span>
      </button>
    </div>`),!!o){if(d==="loading"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Loading…</div>`);return}if(d==="error"){a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${c(n)}" ${e.state.busy?"disabled":""}>Retry</button>
        </div>`);return}if(m){for(const f of d)s(f.path,i+1);d.length===0&&n===""&&a.push(`<div class="files-tree-status muted small" style="--depth:${i+1}">No subfolders yet — destination will be Home.</div>`)}}};return s("",0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${a.join("")}</div>`}async function Vs(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;const a=new FormData(t),s=(e.state.filesTransferDest||String(a.get("toPath")??"")).trim().replace(/^\/+|\/+$/g,""),n=String(a.get("newName")??"").trim(),i=e.state.filesTransfer.op,r=[...e.state.filesTransfer.paths],l=r.length>1;if(Dt(e,s,r)){e.setFlash("error","Choose a different destination folder"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let o=0;const d=[];try{for(const u of r)try{if(i==="copy"){const b=We(u),p=l||!n||n===b?void 0:n,g=await D.filesCopy(u,{to:s,newName:p});$.event("files.copy",{path:u,to:g.entry.path})}else{const b=We(u),p=l||!n||n===b?void 0:n;await D.filesMove(u,s,p),$.event("files.move",{path:u,to:s})}o+=1}catch(b){d.push(`${We(u)}: ${b instanceof Error?b.message:"failed"}`)}Q(e),e.state.checkedFilePaths=[],await ne(e);const m=i==="copy"?"Copied":"Moved";o>0&&d.length===0?e.setFlash("success",o===1?`${m} 1 item`:`${m} ${o} items`):o>0?e.setFlash("info",`${m} ${o}; ${d.length} failed. ${d[0]}`):e.setFlash("error",d[0]||`${i==="copy"?"Copy":"Move"} failed`)}catch(m){e.setFlash("error",m instanceof Error?m.message:"Operation failed")}finally{e.state.busy=!1,e.render()}}function Yt(...e){return e.map(t=>t.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"")).filter(Boolean).join("/")}function vn(e){if(!e||typeof e!="object")return!1;const t=e.name;return t==="AbortError"||t==="NotAllowedError"}function $n(e,t=!0){return Array.from(e).map(s=>{const i=(s.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")||s.name;return{file:s,relativePath:i||s.name}})}function Ks(e){return new Promise((t,a)=>{const s=[],n=()=>{e.readEntries(i=>{if(!i.length){t(s);return}s.push(...i),n()},i=>a(i))};n()})}function js(e){return new Promise((t,a)=>{e.file(t,a)})}async function hn(e,t){const a=Yt(t,e.name);if(e.isFile)return[{file:await js(e),relativePath:a||e.name}];if(e.isDirectory){const s=e.createReader(),n=await Ks(s);if(n.length===0)return[{file:null,relativePath:a,isEmptyDir:!0}];const i=[];for(const r of n)i.push(...await hn(r,a));return i}return[]}async function*zs(e){const t=e;if(typeof t.values=="function"){for await(const a of t.values())yield a;return}if(typeof t.entries=="function")for await(const[,a]of t.entries())yield a}async function oa(e,t){const a=Yt(t,e.name),s=[];let n=0;for await(const i of zs(e))if(n+=1,i.kind==="file"){const r=await i.getFile();s.push({file:r,relativePath:Yt(a,i.name)||r.name})}else i.kind==="directory"&&s.push(...await oa(i,a));return n===0&&s.push({file:null,relativePath:a,isEmptyDir:!0}),s}async function Ws(){const e=window;if(typeof e.showOpenFilePicker!="function")return{kind:"fallback"};try{const t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:"cancel"};const a=[];for(const s of t){const n=await s.getFile();a.push({file:n,relativePath:n.name})}return{kind:"items",items:a}}catch(t){return vn(t)?{kind:"cancel"}:{kind:"fallback"}}}async function Ys(){const e=window;if(typeof e.showDirectoryPicker!="function")return{kind:"fallback"};try{const t=await e.showDirectoryPicker({mode:"read"}),a=await oa(t,"");return a.length===0?{kind:"cancel"}:{kind:"items",items:a}}catch(t){return vn(t)?{kind:"cancel"}:{kind:"fallback"}}}function La(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function Js(e){const t=e.files?Array.from(e.files):[],a=[],s=[],n=e.items?Array.from(e.items):[];for(const i of n){if(i.kind!=="file")continue;const r=i;typeof r.getAsFileSystemHandle=="function"?a.push(r.getAsFileSystemHandle().catch(()=>null)):a.push(Promise.resolve(null));let l=null;if(typeof r.webkitGetAsEntry=="function")try{l=r.webkitGetAsEntry()}catch{l=null}s.push(l)}return{handlePromises:a,entries:s,files:t}}async function Gs(e){var i,r;const t=[],a=await Promise.all(e.handlePromises);for(let l=0;l<Math.max(a.length,e.entries.length);l++){const o=a[l]??null;if(o)try{if(o.kind==="file"){const m=await o.getFile();t.push({file:m,relativePath:m.name})}else o.kind==="directory"&&t.push(...await oa(o,""));continue}catch{}const d=e.entries[l];if(d)try{t.push(...await hn(d,""))}catch{}}const s=$n(e.files,!0),n=new Map;for(const l of s){const o=La(l.relativePath||((i=l.file)==null?void 0:i.name)||"");o&&n.set(o,l)}for(const l of t){const o=La(l.relativePath||((r=l.file)==null?void 0:r.name)||"");o&&n.set(o,l)}return Array.from(n.values())}function Xs(e){if(!e)return!1;if(e.types&&typeof e.types.includes=="function")return e.types.includes("Files");try{for(let t=0;t<e.types.length;t++)if(e.types[t]==="Files")return!0}catch{}return!1}function wn(e,t=80){const a=String(e??"").replace(/\s+/g," ").trim();return a?a.length>t?`${a.slice(0,t-1)}…`:a:""}function me(e,t,a){const s=wn(t);return s?`${e} “${s}” ${a}`:`${e} ${a}`}function xt(e){const t=wn(e.displayname||e.fullname);return t||[e.firstname,e.lastname].map(s=>String(s??"").trim()).filter(Boolean).join(" ")||"Unnamed contact"}function kn(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function bt(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Z(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),s=t%60;return a>0?`${a}m ${s}s`:`${s}s`}function X(e){return!Number.isFinite(e)||e<0?"—":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:e<1024*1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:`${(e/(1024*1024*1024)).toFixed(2)} GB`}function Qs(e){if(!e)return"—";try{return new Date(e*1e3).toLocaleString()}catch{return"—"}}function Y(e,t,a,s,n,i=""){const r=a===t,l=r?s==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${r?" is-sorted":""}${i?" "+i:""}`}" data-action="sort-${n}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(e)}${l}</th>`}const Zs=new Set(["docx","xlsx","pptx","odt","ods","odp","doc","xls","ppt"]),er=new Set(["jpg","jpeg","jfif","png","gif","webp","bmp","avif","ico","heic","heif"]),tr=new Set(["mp3","wav","ogg","oga","flac","aac","m4a","opus","weba"]),ar=new Set(["mp4","m4v","webm","ogv","mov"]),nr=new Set(["txt","md","markdown","rst","csv","tsv","json","jsonc","xml","yml","yaml","html","htm","xhtml","js","mjs","cjs","ts","tsx","jsx","css","scss","less","php","py","rb","go","rs","java","c","h","cpp","hpp","cs","sh","bash","zsh","sql","log","ini","conf","cfg","env","toml","diff","patch","vue","svelte","svg","rss","atom","ics","vcf","eml","nfo","rtf","tex","lua","kt","swift","pl","pm"]);function da(e){const t=e.split(/[/\\]/).pop()||e,a=t.lastIndexOf(".");return a<=0?"":t.slice(a+1).toLowerCase()}function Sn(e){const t=da(e);return er.has(t)?"image":t==="pdf"?"pdf":tr.has(t)?"audio":ar.has(t)?"video":Zs.has(t)?"office":nr.has(t)?"text":"unsupported"}function ve(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Dn(e){return e.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(t,a)=>String.fromCharCode(Number(a))).replace(/&#x([0-9a-fA-F]+);/g,(t,a)=>String.fromCharCode(parseInt(a,16)))}function sr(e,t){const a=[],s=new RegExp(t.source,t.flags.includes("g")?t.flags:`${t.flags}g`);let n;for(;n=s.exec(e);)a.push(n[1]??n[0]);return a}function le(e,t){const a=new RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${t}>`,"gi");return e.match(a)??[]}function de(e,t){const a=new RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${t}>`,"gi");return sr(e,a).map(s=>Dn(s.replace(/<[^>]+>/g,"")))}function rr(e){const t=le(e,"p");if(t.length===0){const n=de(e,"t").join(" ").trim();return n?`<p>${ve(n)}</p>`:""}const a=[];for(const n of t){const i=le(n,"r"),r=[],l=i.length?i:[n];for(const o of l){const d=de(o,"t").join("");if(!d)continue;let m=ve(d);(/<(?:[\w.-]+:)?b\b/i.test(o)||/w:val="true"[^>]*w:b|w:b\s*\/>/i.test(o))&&(m=`<strong>${m}</strong>`),/<(?:[\w.-]+:)?i\b/i.test(o)&&(m=`<em>${m}</em>`),r.push(m)}a.push(`<p>${r.join("")||"&nbsp;"}</p>`)}const s=le(e,"tbl");for(const n of s){const i=le(n,"tr").map(r=>`<tr>${le(r,"tc").map(o=>`<td>${ve(de(o,"t").join(" "))}</td>`).join("")}</tr>`).join("");i&&a.push(`<table class="files-preview-sheet">${i}</table>`)}return a.join("")}function ir(e,t){const a=e?de(e,"t"):[],s=le(t,"row");return s.length===0?"":`<table class="files-preview-sheet">${s.map(i=>`<tr>${le(i,"c").map(l=>{const o=/\bt="s"/.test(l),d=(de(l,"v")[0]??de(l,"t")[0]??"").trim();let m=d;if(o){const u=Number(d);m=Number.isFinite(u)&&a[u]!==void 0?a[u]:d}return`<td>${ve(m)}</td>`}).join("")}</tr>`).join("")}</table>`}function lr(e){return e.map((t,a)=>{const n=de(t,"t").map(i=>i.trim()).filter(Boolean).map(i=>`<p>${ve(i)}</p>`).join("")||'<p class="muted">(empty slide)</p>';return`<section class="files-preview-slide"><h3>Slide ${a+1}</h3>${n}</section>`}).join("")}function or(e){const t=le(e,"p");return t.length===0?de(e,"p").map(a=>`<p>${ve(a)}</p>`).join(""):t.map(a=>`<p>${ve(Dn(a.replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim())||"&nbsp;"}</p>`).join("")}function be(e,t){return e.getUint16(t,!0)}function Oe(e,t){return e.getUint32(t,!0)}async function dr(e){if(typeof DecompressionStream>"u")throw new Error("Deflate is not available in this browser");const t=new DecompressionStream("deflate-raw"),a=new Blob([e]).stream().pipeThrough(t),s=await new Response(a).arrayBuffer();return new Uint8Array(s)}async function cr(e){const t=new Uint8Array(e),a=new DataView(e);let s=-1;const n=Math.max(0,t.length-22-65535);for(let d=t.length-22;d>=n;d--)if(Oe(a,d)===101010256){s=d;break}if(s<0)throw new Error("Not a ZIP file");const i=be(a,s+10);let r=Oe(a,s+16);const l=new Map,o=new TextDecoder("utf-8");for(let d=0;d<i;d++){if(Oe(a,r)!==33639248)throw new Error("Bad ZIP directory");const m=be(a,r+10),u=Oe(a,r+20),b=be(a,r+28),p=be(a,r+30),g=be(a,r+32),f=Oe(a,r+42),v=o.decode(t.subarray(r+46,r+46+b)).replace(/\\/g,"/");if(r+=46+b+p+g,!v||v.endsWith("/"))continue;const S=be(a,f+26),h=be(a,f+28),E=f+30+S+h,y=t.subarray(E,E+u);m===0?l.set(v,y.slice()):m===8&&l.set(v,await dr(y))}return l}function Ne(e,t){const a=e.get(t);return a?new TextDecoder("utf-8").decode(a):null}const ur=20*1024*1024;async function mr(e,t){const a=da(e);if(a==="doc"||a==="xls"||a==="ppt")throw new Error("Older binary Office files (.doc / .xls / .ppt) cannot be previewed. Download to open them.");if(t.size>ur)throw new Error("This document is too large to preview. Download it instead.");const s=await cr(await t.arrayBuffer());if(a==="docx"){const n=Ne(s,"word/document.xml");if(!n)throw new Error("This Word file has no document.xml");const i=rr(n);if(!i)throw new Error("No readable text in this Word file");return i}if(a==="xlsx"){const n=[...s.keys()].filter(l=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(l)).sort((l,o)=>l.localeCompare(o,void 0,{numeric:!0}))[0],i=n?Ne(s,n):null;if(!i)throw new Error("This spreadsheet has no worksheet");const r=ir(Ne(s,"xl/sharedStrings.xml"),i);if(!r)throw new Error("No readable cells in this spreadsheet");return r}if(a==="pptx"){const n=[...s.keys()].filter(i=>/^ppt\/slides\/slide\d+\.xml$/i.test(i)).sort((i,r)=>i.localeCompare(r,void 0,{numeric:!0})).map(i=>Ne(s,i)).filter(i=>!!i);if(n.length===0)throw new Error("This presentation has no slides");return lr(n)}if(a==="odt"||a==="ods"||a==="odp"){const n=Ne(s,"content.xml");if(!n)throw new Error("This OpenDocument file has no content.xml");const i=or(n);if(!i)throw new Error("No readable text in this document");return i}throw new Error("This Office file type cannot be previewed")}const Jt=2*1024*1024,fr=50*1024*1024;function pr(e){const t=e.filesPreview;if(t!=null&&t.objectUrl)try{URL.revokeObjectURL(t.objectUrl)}catch{}e.filesPreviewSeq+=1,e.filesPreview=null}function j(e){pr(e.state)}async function br(e,t){const a=e.state.filesEntries.find(l=>l.path===t);if(!a||a.type!=="file")return;j(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,Q(e),e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,O(e);const s=Sn(a.name),n=e.state.filesPreviewSeq+1;e.state.filesPreviewSeq=n;const i={path:a.path,name:a.name,size:a.size,kind:s,status:"loading",objectUrl:null,text:null,html:null,truncated:!1,error:null};if(!(s==="text"||s==="pdf"||s==="office")){e.state.filesPreview={...i,status:"ready"},$.event("files.preview",{path:a.path,kind:s}),e.render();return}e.state.filesPreview=i,e.render();try{if(s==="pdf"&&a.size>fr){if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"error",error:`This PDF is too large to preview (${X(a.size)}). Download it instead.`},e.render();return}const{blob:l}=await D.filesGetBlob(a.path,{inline:!0});if(e.state.filesPreviewSeq!==n)return;if(s==="office"){const o=await mr(a.name,l);if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"ready",html:o}}else if(s==="pdf"){const o=l.type&&l.type.toLowerCase().includes("pdf")?l:new Blob([l],{type:"application/pdf"});e.state.filesPreview={...i,status:"ready",objectUrl:URL.createObjectURL(o)}}else{const o=l.size>Jt,m=await(o?l.slice(0,Jt):l).text();if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"ready",text:m,truncated:o}}$.event("files.preview",{path:a.path,kind:s})}catch(l){if(e.state.filesPreviewSeq!==n)return;e.state.filesPreview={...i,status:"error",error:l instanceof Error?l.message:"Could not open file"}}e.render()}function gr(e){const t=e.state.filesPreview;if(!t)return"";let a;if(t.status==="loading")a='<p class="muted" style="margin:0">Loading preview…</p>';else if(t.status==="error")a=`<p class="flash flash-error" style="margin:0">${c(t.error||"Could not open file")}</p>`;else if(t.kind==="image"){const s=D.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <img class="files-preview-img" src="${c(s)}" alt="${c(t.name)}" decoding="async" />
    </div>`}else if(t.kind==="pdf"&&t.objectUrl)a=`<iframe class="files-preview-frame" title="${c(t.name)}" src="${c(t.objectUrl)}" type="application/pdf"></iframe>`;else if(t.kind==="audio"){const s=D.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${c(s)}"></audio>
    </div>`}else if(t.kind==="video"){const s=D.filesDownloadUrl(t.path,{inline:!0});a=`<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${c(s)}"></video>
    </div>`}else t.kind==="office"&&t.html?a=`<div class="files-preview-office">${t.html}</div>`:t.kind==="text"?a=`${t.truncated?`<p class="muted small files-preview-truncated">Showing the first ${c(X(Jt))} of this file.</p>`:""}<pre class="files-preview-text">${c(t.text||"")}</pre>`:a=`<p style="margin:0">This file type cannot be previewed in the browser. Download it to open with another app.</p>
      <p class="muted small" style="margin:0.75rem 0 0">${c(t.name)} · ${c(X(t.size))}</p>`;return _({id:"files-preview-modal",title:t.name,titleId:"files-preview-title",closeAction:"files-preview-close",size:"wide",cardClassName:"files-preview-card",className:"files-preview-modal",body:a,footer:[{label:"Download",action:"files-preview-download",variant:"ghost"},{label:"Close",action:"files-preview-close",variant:"primary"}]})}function ce(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener("click",e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function yr(e){ce(e),e.state.filesUploadMenuDocClick=a=>{var n;const s=a.target;(n=s==null?void 0:s.closest)!=null&&n.call(s,".files-upload-menu")||(e.state.filesUploadMenuOpen=!1,ce(e),e.render())};const t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener("click",t,!0)},0)}function Ae(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function vr(e){Ae(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase==="done"||e.state.filesUploadProgress.phase==="error"){Ae(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},Ce(e,e.state.filesUploadProgress)},1e3)}function Cn(e){Ae(e),e.state.filesUploadProgress=null,e.render()}function En(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function Ce(e,t){if(!e.root.querySelector("[data-files-upload-progress]"))return;const a=e.root.querySelector(".files-upload-progress-bar"),s=e.root.querySelector(".files-upload-progress-track"),n=e.root.querySelector("[data-files-upload-status]"),i=e.root.querySelector("[data-files-upload-current]"),r=En(e,t),l=t.phase==="uploading"?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${r!==null?` (${r}%)`:""} · ${Z(t.elapsedSec)}`:(n==null?void 0:n.textContent)||"";n&&t.phase==="uploading"&&(n.textContent=l),i&&t.phase==="uploading"&&(i.textContent=t.currentName||"",i.title=t.currentName||""),a&&r!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${r}%`),s&&r!==null&&(s.setAttribute("aria-valuenow",String(r)),s.removeAttribute("aria-valuetext"))}function $r(e){if(!e.state.filesUploadProgress)return"";const t=e.state.filesUploadProgress,a=t.phase==="uploading",s=t.phase==="done"?"Upload finished":t.phase==="error"?"Upload failed":"Uploading…",n=En(e,t),i=n===null?"files-upload-progress-bar is-indeterminate":"files-upload-progress-bar",r=n!==null?` style="width:${n}%"`:"";let l="";if(a){const d=`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?"":"s"}${t.failedFiles?` · ${t.failedFiles} failed`:""}${n!==null?` (${n}%)`:""} · ${Z(t.elapsedSec)}`,m=t.bytesTotal>0?`${bt(t.bytesSent)} / ${bt(t.bytesTotal)}`:"";l=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${c(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
        ${m?` · <span class="muted">${c(m)}</span>`:""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${n!==null?`aria-valuenow="${n}"`:'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${i}"${r}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${c(d)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${c(t.currentName)}">${c(t.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(t.phase==="done")l=`
      ${se("success",t.resultMessage||"Upload completed.",{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">Took ${c(Z(t.elapsedSec))}</p>`;else{const d=t.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${t.errorSamples.slice(0,8).map(m=>`<li>${c(m)}</li>`).join("")}${t.errorSamples.length>8?`<li>…and ${t.errorSamples.length-8} more</li>`:""}</ul>`:"";l=`
      ${se("error",t.resultMessage||"Upload failed.",{className:"import-result",style:"margin:0 0 1rem"})}
      ${d}
      <p class="muted small" style="margin:0.75rem 0 0">After ${c(Z(t.elapsedSec))}</p>`}const o=a?'<p class="muted small" style="margin:0">Please wait…</p>':ea([{label:"Close",action:"close-files-upload-progress",variant:"primary"}]);return _({title:s,titleId:"files-upload-progress-title",closeAction:"close-files-upload-progress",size:"sm",className:"import-progress-modal files-upload-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-files-upload-progress",hideClose:a,lockBackdrop:a,body:l,footer:o})}async function _a(e,t,a,s){const n=a.replace(/\\/g,"/").split("/").map(r=>r.trim()).filter(Boolean);let i=t;for(const r of n){const l=yn(i,r);if(s.has(l)){i=l;continue}try{await D.filesMkdir(i,r),$.event("files.mkdir",{path:i,name:r,via:"upload-folder"})}catch(o){if(!(o instanceof q&&o.status===409))throw o}s.add(l),i=l}}function hr(e,t){var s;const a=t==="files"?'input[type="file"][data-action="files-upload-pick-files"]':'input[type="file"][data-action="files-upload-pick-folder"]';(s=e.root.querySelector(a))==null||s.click()}async function Ra(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,ce(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,Q(e),e.state.filesMkdirOpen=!1,j(e),O(e);const a=t==="files"?Ws:Ys;try{const s=await a();if(s.kind==="cancel"){e.render();return}if(s.kind==="items"){if(s.items.length===0){e.setFlash("info",t==="folder"?"Folder is empty":"No files selected"),e.render();return}await ua(e,s.items);return}e.render(),requestAnimationFrame(()=>{hr(e,t)})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Could not open picker"),e.render()}}function Ct(e,t){return`${e}\0${t}`}function wr(e,t){return t.map(a=>{const s=a.file,n=(a.relativePath||s.name).replace(/\\/g,"/"),i=n.split("/").filter(Boolean),r=i.pop()||s.name,l=i.join("/"),o=yn(e,l);return{item:a,file:s,fileName:r,parentPath:o,displayName:n||r,relDir:l}})}function kr(e){const t=new Set,a=[];for(const s of e){const n=Ct(s.parentPath,s.fileName);t.has(n)||(t.add(n),a.push(s))}return a}async function Sr(e,t){if(t.length===0)return[];const a=new Map;for(const n of t){const i=a.get(n.parentPath)??[];i.push(n),a.set(n.parentPath,i)}const s=[];for(const[n,i]of a){let r=new Map;try{const l=await D.filesList(n);r=new Map;for(const o of l.entries)(o.type==="file"||o.type==="dir")&&r.set(o.name,o.type)}catch{r=new Map}for(const l of i)r.has(l.fileName)&&s.push(l)}return s.sort((n,i)=>n.displayName.localeCompare(i.displayName)),s}const ca=new WeakMap;function Lt(e){e&&(ca.delete(e.state),e.state.filesUploadConflict=null)}function dt(e,t){var m;const a=ca.get(e.state),s=e.state.filesUploadConflict;if(t==="cancel"){Lt(e),e.setFlash("info","Upload cancelled"),e.render();return}if(!a){e.state.filesUploadConflict=null,e.setFlash("error","Upload session expired — drop or choose the files again"),e.render();return}const n=new Set(((m=s==null?void 0:s.conflictKeys)!=null&&m.length?s.conflictKeys:a.conflictKeys)??[]);let i=a.planned,r=new Set,l=0;if(t==="overwrite")r=new Set(n);else{const u=[];for(const b of a.planned){const p=Ct(b.parentPath,b.fileName);n.has(p)?l+=1:u.push(b)}if(i=u,$.event("files.upload.skip_existing",{skipped:l,remaining:i.length,total:a.planned.length,conflictKeys:n.size}),i.length===0&&a.emptyDirs.length===0){Lt(e),e.setFlash("info",l===1?"Nothing to upload — the selected file already exists":`Nothing to upload — all ${l} selected files already exist`),e.render();return}}const o=a.destBase,d=a.emptyDirs;Lt(e),Tn(e,i,d,o,r)}async function ua(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,ce(e),e.state.filesUploadDropActive=!1,j(e),O(e);const a=t.filter(r=>r.file&&!r.isEmptyDir),s=t.filter(r=>r.isEmptyDir&&r.relativePath),n=e.state.filesPath,i=kr(wr(n,a));if($.event("files.upload.plan",{destBase:n||"/",files:i.length,emptyDirs:s.length,sample:i.slice(0,5).map(r=>({display:r.displayName,parent:r.parentPath||"/",name:r.fileName}))}),i.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{const r=await Sr(n,i);if(r.length>0){const l=r.map(o=>Ct(o.parentPath,o.fileName));ca.set(e.state,{planned:i,emptyDirs:s,destBase:n,conflictKeys:l}),e.state.filesUploadConflict={names:r.map(o=>o.displayName),totalFiles:i.length,conflictCount:r.length,conflictKeys:l},$.event("files.upload.conflicts",{total:i.length,conflicts:r.length,names:r.slice(0,12).map(o=>o.displayName)}),e.state.busy=!1,e.render();return}}catch(r){e.state.busy=!1,e.setFlash("error",r instanceof Error?r.message:"Could not check existing files"),e.render();return}}await Tn(e,i,s,n,new Set)}async function Tn(e,t,a,s,n){var p,g;const i=t.reduce((f,v)=>f+(v.file.size||0),0),r=Date.now(),l=t.length+a.length;e.state.filesUploadProgress={phase:"uploading",totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:((p=t[0])==null?void 0:p.displayName)||((g=a[0])==null?void 0:g.relativePath)||"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),vr(e),e.render();let o=0;const d=[],m=new Set;let u=0,b=0;try{for(const S of a){const h=S.relativePath.replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");if(h){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:h+"/",elapsedSec:Math.floor((Date.now()-r)/1e3)},Ce(e,e.state.filesUploadProgress));try{await _a(e,s,h,m)}catch(E){d.push(`${h}/: ${E instanceof Error?E.message:"failed"}`)}}}for(const S of t){const{file:h,fileName:E,parentPath:y,displayName:w,relDir:F}=S;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:w,bytesSent:u,elapsedSec:Math.floor((Date.now()-r)/1e3)},Ce(e,e.state.filesUploadProgress));try{F&&await _a(e,s,F,m);const L=n.has(Ct(y,E));await D.filesUpload(y,h,{replace:L,onProgress:(B,N)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!=="uploading")return;const k=N>0?N:h.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:w,bytesSent:u+Math.min(B,k||B),elapsedSec:Math.floor((Date.now()-r)/1e3)},Ce(e,e.state.filesUploadProgress)}}),$.event("files.upload",{path:y,name:E,size:h.size,relativePath:w,replace:L}),o+=1,L&&(b+=1),u+=h.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:d.length,bytesSent:u},Ce(e,e.state.filesUploadProgress))}catch(L){const B=`${w}: ${L instanceof Error?L.message:"failed"}`;d.push(B),u+=h.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:o,failedFiles:d.length,bytesSent:u,errorSamples:d.slice(0,12)},Ce(e,e.state.filesUploadProgress))}}await ne(e),Ae(e);const f=Math.floor((Date.now()-r)/1e3),v=t.length;if(o>0&&d.length===0){let S=o===1?"Uploaded 1 file":`Uploaded ${o} files`;b>0&&(S+=b===1?" (1 overwritten)":` (${b} overwritten)`),e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(v,1),completedFiles:o,failedFiles:0,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:f,resultMessage:S,errorSamples:[]},e.setFlash("success",S)}else if(o>0){const S=`Uploaded ${o}; ${d.length} failed. ${d[0]}`;e.state.filesUploadProgress={phase:"done",totalFiles:Math.max(v,1),completedFiles:o,failedFiles:d.length,currentName:"",bytesTotal:i,bytesSent:i,startedAt:r,elapsedSec:f,resultMessage:S,errorSamples:d.slice(0,12)},e.setFlash("info",S)}else if(l>0&&d.length===0&&a.length>0){const S=a.length===1?"Created 1 empty folder":`Created ${a.length} empty folders`;e.state.filesUploadProgress={phase:"done",totalFiles:1,completedFiles:0,failedFiles:0,currentName:"",bytesTotal:0,bytesSent:0,startedAt:r,elapsedSec:f,resultMessage:S,errorSamples:[]},e.setFlash("success",S)}else{const S=d[0]||"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(v,1),completedFiles:0,failedFiles:d.length,currentName:"",bytesTotal:i,bytesSent:0,startedAt:r,elapsedSec:f,resultMessage:S,errorSamples:d.slice(0,12)},e.setFlash("error",S)}}catch(f){Ae(e);const v=f instanceof Error?f.message:"Upload failed";e.state.filesUploadProgress={phase:"error",totalFiles:Math.max(t.length,1),completedFiles:o,failedFiles:Math.max(d.length,1),currentName:"",bytesTotal:i,bytesSent:u,startedAt:r,elapsedSec:Math.floor((Date.now()-r)/1e3),resultMessage:v,errorSamples:d.length?d.slice(0,12):[v]},e.setFlash("error",v)}finally{e.state.busy=!1,e.render()}}function qa(e,t,a){const s=t.files;if(!s||s.length===0)return;const n=$n(s,a);t.value="",ua(e,n)}const Dr={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other AngaraDAV users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.","Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Check one or more to view events in the month grid.","Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another AngaraDAV user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},files:{title:"Files",paragraphs:["Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.","Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.","Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).","Click a file name or View to preview it: images, PDF, text, audio, and video open in a dialog. Other types offer a download instead. Download, create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.","Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.","Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.","Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]},administration:{title:"Administration",paragraphs:["Server administration for AngaraDAV, available to portal users with the Admin role.","Overview, users, system settings, and database management for operators with the Admin role.","Admin API calls use your portal DAV session and require the Admin role server-side."]},"admin-overview":{title:"Overview",paragraphs:["Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.","Version and release links help you compare installs. Counts refresh from the dashboard API."]},"admin-users":{title:"Users",paragraphs:["List, create, edit, and delete DAV users from the portal. Password digests are never returned.","Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.","Manage users, system settings, and database from these Administration tabs."]},"admin-settings":{title:"System settings",paragraphs:["Edit DAV services, files, push, session timeout, portal admin role list, and admin password.","Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies."]},"admin-database":{title:"Database",paragraphs:["Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.","Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline."]}};function H(e,t,a="h2"){const s=a;return`<div class="section-title-row">
    <${s}>${c(e)}</${s}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(t)}"
      aria-label="About ${c(e)}" title="About ${c(e)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Cr(){return`
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
    </div>`}const Er=new Set(["zip","tar","gz","tgz","bz2","7z","rar","xz"]),Tr=[{value:"all",label:"All types"},{value:"folder",label:"Folders"},{value:"file",label:"Files"},{value:"image",label:"Images"},{value:"document",label:"Documents"},{value:"audio",label:"Audio"},{value:"video",label:"Video"},{value:"archive",label:"Archives"},{value:"other",label:"Other"}];function Pr(e){if(e.type==="dir")return"folder";const t=Sn(e.name);return t==="image"?"image":t==="pdf"||t==="office"||t==="text"?"document":t==="audio"?"audio":t==="video"?"video":Er.has(da(e.name))?"archive":"other"}function Fr(e,t){return t==="all"?!0:t==="file"?e.type==="file":Pr(e)===t}function Pn(e,t){const a=t.search.trim().toLowerCase();let s=e.filter(i=>!(!Fr(i,t.type)||a&&!i.name.toLowerCase().includes(a)));const n=t.order==="desc"?-1:1;return s=s.slice().sort((i,r)=>t.sort==="name"?i.type!==r.type?i.type==="dir"?-1:1:n*i.name.localeCompare(r.name,void 0,{sensitivity:"base"}):t.sort==="size"?i.type!==r.type?i.type==="dir"?1:-1:i.size!==r.size?n*(i.size-r.size):i.name.localeCompare(r.name,void 0,{sensitivity:"base"}):i.mtime!==r.mtime?n*(i.mtime-r.mtime):i.name.localeCompare(r.name,void 0,{sensitivity:"base"})),s}function Ar(e,t){const a=t?t.split("/").filter(Boolean):[];let s="";const n=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${e.state.busy?"disabled":""}>Home</button>`];for(const i of a){s=s?`${s}/${i}`:i;const r=s;n.push('<span class="files-crumb-sep" aria-hidden="true">/</span>'),n.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${c(r)}" ${e.state.busy?"disabled":""}>${c(i)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${n.join("")}</nav>`}function Ur(e){const t=e.state.filesStatus;if(!t)return`<div class="card"><p class="muted">${e.state.filesLoading||e.state.busy?"Loading…":"Unable to load file storage status."}</p></div>`;if(!t.enabled)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${H("Files","files","h1")}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;if(!t.ready)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${H("Files","files","h1")}
        <p class="flash flash-error" style="margin-top:0.75rem">${c(t.error||"File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${c(t.davPath)}</span></p>
      </section>
    </div>`;const a=t.quotaBytes>0?`${X(t.usedBytes)} used · ${X(t.availableBytes)} free of ${X(t.quotaBytes)}`:`${X(t.usedBytes)} used · ${X(t.availableBytes)} free (no app quota)`,s=t.quotaBytes>0?Math.min(100,Math.round(100*t.usedBytes/t.quotaBytes)):0,n=Pn(e.state.filesEntries,{search:e.state.filesSearch,type:e.state.filesTypeFilter,sort:e.state.filesSort,order:e.state.filesOrder}),i=e.state.checkedFilePaths.length,r=(()=>{if(i===0)return null;const k=new Set(e.state.checkedFilePaths);let P=0,A=0;for(const M of e.state.filesEntries)!k.has(M.path)||M.type!=="file"||(P+=M.size,A+=1);return A>0?P:null})(),l=n.length>0&&n.every(k=>e.state.checkedFilePaths.includes(k.path)),o=i>0,d=e.state.filesEntries.filter(k=>k.type==="dir").length,m=e.state.filesEntries.length-d,u=sa(e.state.filesEntries,e.state.checkedFilePaths),b=n.length!==e.state.filesEntries.length,p=(()=>{if(e.state.filesLoading&&e.state.filesEntries.length===0)return"Loading…";if(e.state.filesEntries.length===0)return"0 items";const k=[];d>0&&k.push(`${d} folder${d===1?"":"s"}`),m>0&&k.push(`${m} file${m===1?"":"s"}`);const P=`${e.state.filesEntries.length} item${e.state.filesEntries.length===1?"":"s"}`;return k.length===2?`${P} · ${k.join(", ")}`:k[0]??P})(),g=e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">This folder is empty.</td></tr>':n.length===0?'<tr><td colspan="5" class="muted">No items match this search or filter.</td></tr>':n.map(k=>{var V,z;const P=e.state.checkedFilePaths.includes(k.path),A=k.type==="dir"?"📁":"📄",M=k.type==="dir"?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${c(k.path)}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${A}</span>${c(k.name)}
                  </button>`:`<button type="button" class="files-name-btn" data-action="files-preview-open" data-path="${c(k.path)}" title="View ${c(k.name)}" aria-expanded="${((V=e.state.filesPreview)==null?void 0:V.path)===k.path?"true":"false"}" ${e.state.busy?"disabled":""}>
                    <span class="files-icon" aria-hidden="true">${A}</span>${c(k.name)}
                  </button>`,K=k.type==="dir"?"—":X(k.size),x=((z=e.state.filesItemMenu)==null?void 0:z.path)===k.path;return`<tr class="files-row${P?" is-checked":""}${x?" is-menu-open":""}" data-path="${c(k.path)}" data-type="${k.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${c(k.path)}"
                  ${P?"checked":""} ${e.state.busy?"disabled":""}
                  aria-label="Select ${c(k.name)}" />
              </td>
              <td class="files-col-name">${M}</td>
              <td class="files-col-size mono">${K}</td>
              <td class="files-col-mtime hide-sm">${c(Qs(k.mtime))}</td>
              <td class="files-col-actions">
                <button type="button" class="files-row-menu-btn" data-action="files-item-menu-toggle"
                  data-path="${c(k.path)}"
                  aria-haspopup="menu"
                  aria-expanded="${x?"true":"false"}"
                  ${x?'aria-controls="files-item-menu"':""}
                  aria-label="Actions for ${c(k.name)}"
                  title="Actions"
                  ${e.state.busy?"disabled":""}>
                  <span aria-hidden="true">⋮</span>
                </button>
              </td>
            </tr>`}).join(""),f=e.state.filesRenamePath!==null?(()=>{const k=e.state.filesEntries.find(A=>A.path===e.state.filesRenamePath),P=(k==null?void 0:k.name)??"";return _({id:"files-rename-modal",title:"Rename",titleId:"files-rename-title",closeAction:"files-rename-close",size:"sm",form:!0,formAttrs:'data-form="files-rename" id="files-rename-form"',body:`
                  <input type="hidden" name="path" value="${c(e.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${c(P)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:"Cancel",action:"files-rename-close",variant:"ghost"},{label:"Rename",type:"submit",variant:"primary",disabled:e.state.busy}]})})():"",v=e.state.filesDeletePaths!==null&&e.state.filesDeletePaths.length>0?(()=>{const k=e.state.filesDeletePaths,P=k.length>1,A=e.state.filesEntries.find(x=>x.path===k[0]),M=P?`Delete ${k.length} items`:`Delete ${(A==null?void 0:A.type)==="dir"?"folder":"file"}`,K=P?`<p style="margin:0 0 0.75rem">Delete <strong>${k.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${k.slice(0,12).map(x=>{const V=e.state.filesEntries.find(z=>z.path===x);return`<li><span class="mono">${c((V==null?void 0:V.name)??x)}</span></li>`}).join("")}
                 ${k.length>12?`<li>…and ${k.length-12} more</li>`:""}
               </ul>`:`<p style="margin:0">Delete <strong>${c((A==null?void 0:A.name)??k[0])}</strong>?${(A==null?void 0:A.type)==="dir"?" This removes the folder and everything inside it.":""}</p>`;return _({id:"files-delete-modal",title:M,titleId:"files-delete-title",closeAction:"files-delete-close",size:"sm",body:K,footer:[{label:"Cancel",action:"files-delete-close",variant:"ghost"},{label:"Delete",action:"files-delete-confirm",variant:"danger",disabled:e.state.busy}]})})():"",S=e.state.filesTransfer!==null&&e.state.filesTransfer.paths.length>0?(()=>{const k=e.state.filesTransfer.op,P=e.state.filesTransfer.paths,A=P.length>1,M=e.state.filesEntries.find(Ut=>Ut.path===P[0]),K=(M==null?void 0:M.name)??We(P[0]),x=A?`${k==="copy"?"Copy":"Move"} ${P.length} items`:`${k==="copy"?"Copy":"Move"} ${(M==null?void 0:M.type)==="dir"?"folder":"file"}`,V=e.state.filesTransferDest===""?"Home":e.state.filesTransferDest,z=Dt(e,e.state.filesTransferDest,P);return _({id:"files-transfer-modal",title:x,titleId:"files-transfer-title",closeAction:"files-transfer-close",size:"md",form:!0,formAttrs:'data-form="files-transfer"',body:`
                  ${A?`<p class="muted small" style="margin:0 0 0.75rem">${P.length} items will be ${k==="copy"?"copied":"moved"} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${c(K)}</span></p>`}
                  <input type="hidden" name="toPath" value="${c(e.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${c(V)}">${c(V)}</span>
                    </div>
                    ${Hs(e)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${A?"":`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${c(K)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${k==="copy"?"Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.":"Leave as-is to keep the current name."}
                        </p>`}`,footer:[{label:"Cancel",action:"files-transfer-close",variant:"ghost"},{label:k==="copy"?"Copy":"Move",type:"submit",variant:"primary",disabled:e.state.busy||z}]})})():"",h=e.state.filesMkdirOpen?_({id:"files-mkdir-modal",title:"New folder",titleId:"files-mkdir-title",closeAction:"files-mkdir-close",size:"sm",form:!0,formAttrs:'data-form="files-mkdir"',body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${c(e.state.filesPath===""?"Home":e.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:"Cancel",action:"files-mkdir-close",variant:"ghost"},{label:"Create",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",E=e.state.filesUploadConflict?(()=>{const k=e.state.filesUploadConflict,P=k.conflictCount,A=Math.max(0,k.totalFiles-P),M=P===1?"1 file already exists in the destination.":`${P} of ${k.totalFiles} files already exist in the destination.`,K=A>0?A===1?" Skip existing keeps the other 1 new file.":` Skip existing keeps the other ${A} new files.`:" Skip existing cancels the upload (nothing new to send).",x=k.names.slice(0,12).map(z=>`<li><span class="mono">${c(z)}</span></li>`).join(""),V=k.names.length>12?`<li class="muted">…and ${k.names.length-12} more</li>`:"";return _({id:"files-upload-conflict-modal",title:P===1?"File already exists":"Files already exist",titleId:"files-upload-conflict-title",closeAction:"files-upload-conflict-cancel",size:"sm",body:`
              <p style="margin:0 0 0.75rem">${c(M)}${c(K)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${x}
                ${V}
              </ul>
              <p class="muted small" style="margin:0">
                Replace the existing files, skip only those listed above, or cancel the whole upload.
              </p>`,footer:[{label:"Cancel",action:"files-upload-conflict-cancel",variant:"ghost"},{label:"Skip existing",action:"files-upload-conflict-skip",variant:"ghost"},{label:P===1?"Overwrite":"Overwrite all",action:"files-upload-conflict-overwrite",variant:"primary"}]})})():"",y=e.state.filesPath===""?"Home":e.state.filesPath,w=`<div class="files-upload-menu${e.state.filesUploadMenuOpen?" is-open":""}">
          <button type="button" class="btn btn-primary btn-small files-upload-menu-trigger"
            data-action="files-upload-menu-toggle"
            ${e.state.busy?"disabled":""}
            aria-haspopup="menu"
            aria-expanded="${e.state.filesUploadMenuOpen?"true":"false"}"
            aria-controls="files-upload-menu-list"
            title="Upload files or a folder into this directory">
            Upload
            <span class="files-upload-menu-caret" aria-hidden="true">▾</span>
          </button>
          <div id="files-upload-menu-list" class="files-upload-menu-dropdown" role="menu"
            ${e.state.filesUploadMenuOpen?"":"hidden"}>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-files" ${e.state.busy?"disabled":""}>
              Files…
            </button>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-folder" ${e.state.busy?"disabled":""}>
              Folder…
            </button>
          </div>
        </div>`,F=`<input type="file" data-action="files-upload-pick-files" ${e.state.busy?"disabled":""} multiple hidden />
        <input type="file" data-action="files-upload-pick-folder" ${e.state.busy?"disabled":""}
          multiple webkitdirectory directory hidden />`,L=Tr.map(k=>`<option value="${c(k.value)}" ${e.state.filesTypeFilter===k.value?"selected":""}>${c(k.label)}</option>`).join(""),B=`<div class="files-filter-bar">
          <input type="search" class="files-search" data-action="files-search" placeholder="Search this folder…"
            value="${c(e.state.filesSearch)}" aria-label="Search files in this folder" ${e.state.busy?"disabled":""} />
          <label class="files-type-filter">
            <span class="visually-hidden">Type</span>
            <select data-action="files-type-filter" aria-label="Filter by type" ${e.state.busy?"disabled":""}>
              ${L}
            </select>
          </label>
        </div>`,N=i>0?`<div class="files-toolbar-actions" role="toolbar" aria-label="Selected files">
            <span class="files-selection-count">${i} selected</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-clear-selection" ${e.state.busy?"disabled":""}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-download"
              ${e.state.busy||!u.showDownload?"disabled":""}
              title="${u.showDownload?"Download selected files":"No files in the selection"}">Download</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-copy" ${e.state.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-move" ${e.state.busy?"disabled":""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${e.state.busy?"disabled":""}>Delete</button>
          </div>`:`<div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${e.state.busy||e.state.filesLoading?"disabled":""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${e.state.busy?"disabled":""}>New folder</button>
            ${w}
          </div>`;return`<div class="portal-grid portal-grid-files">
    <section class="card files-panel${e.state.filesUploadDropActive?" is-dragover":""}" data-files-drop-target>
      <div class="files-drop-overlay" aria-hidden="true">
        <div class="files-drop-overlay-inner">
          <p class="files-drop-overlay-title">Drop to upload</p>
          <p class="muted small mono">${c(y)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${H("Files","files","h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${s}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${s}%"></div>
          </div>
          <span>${c(a)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${Ar(e,e.state.filesPath)}
        ${N}
      </div>
      ${F}
      ${B}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${l?"checked":""}
                  ${o&&!l?"data-indeterminate=1":""}
                  ${e.state.busy||n.length===0?"disabled":""}
                  aria-label="Select all visible in this folder" />
              </th>
              ${Y("Name","name",e.state.filesSort,e.state.filesOrder,"file","files-col-name")}
              ${Y("Size","size",e.state.filesSort,e.state.filesOrder,"file","files-col-size")}
              ${Y("Modified","mtime",e.state.filesSort,e.state.filesOrder,"file","files-col-mtime hide-sm")}
              <th class="files-col-actions" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            ${e.state.filesLoading&&e.state.filesEntries.length===0?'<tr><td colspan="5" class="muted">Loading…</td></tr>':g}
          </tbody>
        </table>
      </div>
      ${qs(e)}
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${i>0?`${i} of ${e.state.filesEntries.length} selected${r!==null?` · ${c(X(r))}`:""}`:b?`${n.length} shown of ${e.state.filesEntries.length}`:c(p)}
      </div>
    </section>
    ${f}
    ${v}
    ${S}
    ${h}
    ${E}
  </div>`}async function Ir(e,t){const a=new FormData(t),s=String(a.get("path")??""),n=String(a.get("newName")??"").trim();if(!s||!n){e.setFlash("error","Name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await D.filesRename(s,n),$.event("files.rename",{path:s,newName:n}),e.state.filesRenamePath=null,await ne(e),e.setFlash("success",`Renamed to “${n}”`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Rename failed")}finally{e.state.busy=!1,e.render()}}async function Mr(e,t){const a=new FormData(t),s=String(a.get("name")??"").trim();if(!s){e.setFlash("error","Folder name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await D.filesMkdir(e.state.filesPath,s),$.event("files.mkdir",{path:e.state.filesPath,name:s}),e.state.filesMkdirOpen=!1,await ne(e),e.setFlash("success",`Created folder “${s}”`)}catch(n){e.setFlash("error",n instanceof Error?n.message:"Could not create folder")}finally{e.state.busy=!1,e.render()}}async function Or(e,t,a,s){var i;const{state:n}=e;if(t==="files-upload-menu-toggle")return n.busy||n.filesUploadProgress||(n.filesUploadMenuOpen=!n.filesUploadMenuOpen,n.filesUploadMenuOpen&&(n.filesRenamePath=null,n.filesDeletePaths=null,Q(e),n.filesMkdirOpen=!1,O(e)),e.render()),!0;if(t==="files-item-menu-toggle"){s.stopPropagation();const r=a.dataset.path??"";if(!r||ra(n))return!0;if(((i=n.filesItemMenu)==null?void 0:i.path)===r)return O(e),e.render(),!0;const l=a.getBoundingClientRect();return ia(e,r,{x:l.right,y:l.bottom+4,origin:"button"}),!0}if(t==="sort-file"){const r=a.dataset.sort||"";return r!=="name"&&r!=="size"&&r!=="mtime"||(n.filesSort===r?n.filesOrder=n.filesOrder==="asc"?"desc":"asc":(n.filesSort=r,n.filesOrder=r==="name"?"asc":"desc"),e.render()),!0}if(t==="files-type-filter"){const r=a.value;return n.filesTypeFilter=r==="folder"||r==="file"||r==="image"||r==="document"||r==="audio"||r==="video"||r==="archive"||r==="other"?r:"all",e.render(),!0}if(t==="files-clear-selection")return n.checkedFilePaths=[],O(e),e.render(),!0;if(t==="files-upload-files")return Ra(e,"files"),!0;if(t==="files-upload-folder")return Ra(e,"folder"),!0;if(t==="files-nav"){const r=a.dataset.path??"";n.filesPath=r,n.filesRenamePath=null,n.filesDeletePaths=null,n.filesTransfer=null,n.filesMkdirOpen=!1,j(e),O(e),n.checkedFilePaths=[],n.busy=!0,e.clearFlash(),e.render();try{await ne(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to open folder")}finally{n.busy=!1,e.render()}return!0}if(t==="files-toggle"){s.stopPropagation();const r=a.dataset.path??"";return r&&(a.checked?n.checkedFilePaths.includes(r)||(n.checkedFilePaths=[...n.checkedFilePaths,r]):n.checkedFilePaths=n.checkedFilePaths.filter(o=>o!==r),n.filesItemMenu&&!n.checkedFilePaths.includes(n.filesItemMenu.path)&&O(e),e.render()),!0}if(t==="files-select-all"){s.stopPropagation();const r=a.checked,l=Pn(n.filesEntries,{search:n.filesSearch,type:n.filesTypeFilter,sort:n.filesSort,order:n.filesOrder});return n.checkedFilePaths=r?l.map(o=>o.path):[],n.filesItemMenu&&!n.checkedFilePaths.includes(n.filesItemMenu.path)&&O(e),e.render(),!0}if(t==="files-copy"){const r=a.dataset.path??"";return r&&(j(e),O(e),at(e,"copy",[r])),!0}if(t==="files-move"){const r=a.dataset.path??"";return r&&(j(e),O(e),at(e,"move",[r])),!0}if(t==="files-bulk-copy")return n.checkedFilePaths.length===0||(j(e),O(e),at(e,"copy",[...n.checkedFilePaths])),!0;if(t==="files-bulk-move")return n.checkedFilePaths.length===0||(j(e),O(e),at(e,"move",[...n.checkedFilePaths])),!0;if(t==="files-bulk-download"){const r=sa(n.filesEntries,n.checkedFilePaths);return r.downloadItems.length===0||(O(e),Bs(r.downloadItems),e.render()),!0}if(t==="files-tree-select"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const r=a.dataset.path??"";return Dt(e,r,n.filesTransfer.paths)||(n.filesTransferDest=r,e.render()),!0}if(t==="files-tree-toggle"||t==="files-tree-retry"){if(s.preventDefault(),s.stopPropagation(),!n.filesTransfer)return!0;const r=a.dataset.path??"";if(t==="files-tree-retry"){const o={...n.filesTreeChildren};return delete o[r],n.filesTreeChildren=o,n.filesTreeExpanded.includes(r)||(n.filesTreeExpanded=[...n.filesTreeExpanded,r]),Wt(e,r),!0}return n.filesTreeExpanded.includes(r)?(n.filesTreeExpanded=n.filesTreeExpanded.filter(o=>o!==r),e.render()):(n.filesTreeExpanded=[...n.filesTreeExpanded,r],Wt(e,r)),!0}if(t==="files-transfer-close")return Q(e),e.render(),!0;if(t==="files-bulk-delete")return n.checkedFilePaths.length===0||(n.filesDeletePaths=[...n.checkedFilePaths],n.filesRenamePath=null,Q(e),j(e),O(e),e.render()),!0;if(t==="files-refresh"){O(e),n.busy=!0,e.clearFlash(),e.render();try{await ne(e),e.setFlash("success","Refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{n.busy=!1,e.render()}return!0}if(t==="files-mkdir")return n.filesMkdirOpen=!0,n.filesUploadMenuOpen=!1,ce(e),n.filesUploadDropActive=!1,n.filesRenamePath=null,n.filesDeletePaths=null,Q(e),j(e),O(e),e.clearFlash(),e.render(),!0;if(t==="files-mkdir-close")return n.filesMkdirOpen=!1,e.render(),!0;if(t==="files-rename-open"){const r=a.dataset.path||(n.checkedFilePaths.length===1?n.checkedFilePaths[0]:"");return r&&(n.filesRenamePath=r,n.filesDeletePaths=null,Q(e),n.filesUploadMenuOpen=!1,ce(e),j(e),O(e),e.render()),!0}if(t==="files-rename-close")return n.filesRenamePath=null,e.render(),!0;if(t==="files-delete-open"){const r=a.dataset.path??"";return n.filesDeletePaths=r?[r]:null,n.filesRenamePath=null,Q(e),n.filesUploadMenuOpen=!1,ce(e),j(e),O(e),e.render(),!0}if(t==="files-delete-close")return n.filesDeletePaths=null,e.render(),!0;if(t==="files-delete-confirm"){const r=n.filesDeletePaths?[...n.filesDeletePaths]:[];if(r.length===0)return!0;n.busy=!0,e.clearFlash(),e.render();try{if(r.length===1)await D.filesDelete(r[0]),$.event("files.delete",{path:r[0]}),e.setFlash("success","Deleted");else{const l=await D.filesBulk("delete",r);$.event("files.bulk-delete",{ok:l.ok,failed:l.failed}),l.failed===0?e.setFlash("success",l.ok===1?"Deleted 1 item":`Deleted ${l.ok} items`):l.ok>0?e.setFlash("info",`Deleted ${l.ok}; ${l.failed} failed. ${l.errors[0]||""}`):e.setFlash("error",l.errors[0]||"Delete failed")}n.filesDeletePaths=null,n.checkedFilePaths=[],await ne(e)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{n.busy=!1,e.render()}return!0}if(t==="files-download")return $.event("files.download",{path:a.getAttribute("href")??""}),!0;if(t==="files-preview-open"){const r=a.dataset.path??"";return r&&br(e,r),!0}if(t==="files-preview-close")return j(e),e.render(),!0;if(t==="files-preview-download"){const r=n.filesPreview;if(!r)return!0;const l=document.createElement("a");return l.href=D.filesDownloadUrl(r.path),l.download=r.name,l.rel="noopener",document.body.appendChild(l),l.click(),l.remove(),$.event("files.download",{path:r.path,via:"preview"}),!0}return t==="close-files-upload-progress"?(n.filesUploadProgress&&(n.filesUploadProgress.phase==="done"||n.filesUploadProgress.phase==="error")&&Cn(e),!0):t==="files-upload-conflict-cancel"?(dt(e,"cancel"),!0):t==="files-upload-conflict-skip"?(dt(e,"skip"),!0):t==="files-upload-conflict-overwrite"?(dt(e,"overwrite"),!0):!1}function Fn(e){const{root:t}=e;t.querySelectorAll('input[data-action="files-select-all"][data-indeterminate="1"]').forEach(a=>{a.indeterminate=!0}),la(e),e.state.filesItemMenu&&(t.querySelector("#files-item-menu")?(_s(e),Rs(e)):e.state.filesItemMenu=null)}function Nr(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function fe(e,t){var s;const a=(s=e.state.adminCapabilities)==null?void 0:s.pages;return a?a.find(n=>n.id===t)??null:null}function Me(e,t){switch(t){case"full":return"Full";case"read-only":return"Read-only";case"coming-soon":return"Coming soon";case"deferred":return"Unavailable";default:return t}}function Ze(e,t){return t==="full"||t==="read-only"?"badge-ok":t==="deferred"?"badge-off":"badge-soon"}function xr(e){var i;const t=["overview","settings","users","database"],a={overview:"Overview",settings:"System settings",users:"Users",database:"Database"},s=(i=e.state.adminCapabilities)==null?void 0:i.pages,n=new Map;if(s)for(const r of s)Nr(r.id)&&n.set(r.id,r);return t.map(r=>{const l=n.get(r),o=(l==null?void 0:l.label)||a[r],d=(l==null?void 0:l.status)??(r==="overview"?"read-only":"full"),m=(l==null?void 0:l.available)===!1;return`<button type="button" role="tab" class="tab-btn${e.state.adminPage===r?" is-active":""}${m?" is-gated":""}"
          data-action="admin-page" data-admin-page="${r}"
          aria-selected="${e.state.adminPage===r}"
          title="${c(o)}${m?" — "+Me(e,d):""}">
          ${c(o)}
        </button>`}).join("")}function Et(e,t){const a=fe(e,t),s=(a==null?void 0:a.status)??"coming-soon",n=(a==null?void 0:a.label)??t,i=(a==null?void 0:a.summary)||"This area is not available in portal Administration yet.",r=Me(e,s);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Ze(e,s)}">${c(r)}</span>
      <h2 class="admin-coming-soon-title">${c(n)}</h2>
    </div>
    <p class="muted">${c(i)}</p>
  </section>`}function xe(e,t,a,s){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${c(String(a))}</div>
    <div class="admin-stat-label">${c(t)}</div>
    ${s?`<div class="admin-stat-hint muted small">${c(s)}</div>`:""}
  </div>`}function ge(e,t,a){return`<span class="badge ${t?"badge-ok":"badge-off"}">${c(a)}: ${t?"On":"Off"}</span>`}function ye(e,t){return`<span class="badge ${t?"badge-ok":"badge-off"}">${t?"On":"Off"}</span>`}async function Gt(e){var t;e.state.adminCapabilitiesError=null;try{const a=await D.adminCapabilities();e.state.adminCapabilities=a.data,$.debug("admin.capabilities",{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:((t=e.state.adminCapabilities.pages)==null?void 0:t.length)??0})}catch(a){e.state.adminCapabilitiesError=a instanceof Error?a.message:"Failed to load capabilities",e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:"/portal/#admin",pages:[{id:"overview",label:"Overview",status:"full",available:!0,portalUrl:"/portal/#admin",portalLabel:"Overview",summary:"Live counts and service flags."},{id:"settings",label:"System settings",status:"full",available:!0,portalUrl:"/portal/#admin/settings",portalLabel:"System settings",summary:"Edit system flags and admin password in the portal."},{id:"users",label:"Users",status:"full",available:!0,portalUrl:"/portal/#admin/users",portalLabel:"Users",summary:"Full DAV user CRUD plus calendars and address books."},{id:"database",label:"Database",status:"full",available:!0,portalUrl:"/portal/#admin/database",portalLabel:"Database",summary:"Connection settings; saves require typing CONFIRM."}]},$.warn("admin.capabilities fallback",e.state.adminCapabilitiesError)}}async function gt(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{const t=await D.adminDashboard();e.state.adminDashboard=t.data,$.debug("admin.dashboard",{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:"Failed to load dashboard",t}finally{e.state.adminDashboardLoading=!1}}async function we(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{const t=await D.adminUsers();e.state.adminUsers=t.users??[],$.debug("admin.users",{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:"Failed to load users",t}finally{e.state.adminUsersLoading=!1}}async function ae(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{const a=await D.adminUser(t);e.state.adminUserDetail=a.user,e.state.adminSelectedUsername=a.user.username,$.debug("admin.user",{username:a.user.username})}catch(a){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=a instanceof Error?a.message:"Failed to load user",a}finally{e.state.adminUserDetailLoading=!1}}async function ke(e,t){e.state.adminUserResourcesLoading=!0;try{const[a,s]=await Promise.all([D.adminUserCalendars(t),D.adminUserAddressBooks(t)]);e.state.adminUserCalendars=a.calendars??[],e.state.adminUserAddressBooks=s.addressbooks??[]}catch(a){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],a}finally{e.state.adminUserResourcesLoading=!1}}async function yt(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{const t=await D.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:"Failed to load settings",t}finally{e.state.adminSystemSettingsLoading=!1}}async function vt(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{const t=await D.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;const a=(t.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=a==="pgsql"?"pgsql":"sqlite"}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:"Failed to load database settings",t}finally{e.state.adminDatabaseSettingsLoading=!1}}function Lr(e){var i;const t=fe(e,"overview");if(t&&t.available===!1)return Et(e,"overview");const a=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${c(((i=e.state.user)==null?void 0:i.username)??"")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;let s="",n="";if(e.state.adminDashboardLoading&&!e.state.adminDashboard)n='<section class="card"><p class="muted">Loading overview…</p></section>';else if(e.state.adminDashboardError&&!e.state.adminDashboard)n=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${c(e.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy?"disabled":""}>Retry</button>
    </section>`;else if(e.state.adminDashboard){const r=e.state.adminDashboard,l=r.services,o=r.links??{},d=t?`<span class="badge ${Ze(e,t.status)}">${c(Me(e,t.status))}</span>`:"",m=r.version?c(r.version):"—",u=r.git?c(r.git):"";s=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${H("About this system","admin-overview")}
          <div class="section-actions">
            ${d}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${e.state.busy||e.state.adminDashboardLoading?"disabled":""}>Refresh</button>
          </div>
        </div>
        <div class="admin-about-grid">
          <div>
            <h3 class="admin-subsection-title">Version</h3>
            <p>
              AngaraDAV <span class="badge badge-admin">v${m}</span>
              ${u?`<span class="mono muted small"> (${u})</span>`:""}
            </p>
            <p class="muted small admin-link-row">
              ${o.releases?`<a href="${c(o.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:""}
              ${o.docs?`${o.releases?'<span class="footer-sep">·</span>':""}<a href="${c(o.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:""}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${ye(e,l.administration!==!1&&l.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${ye(e,!!l.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${ye(e,!!l.carddav)}</td></tr>
                  <tr><td>Files</td><td>${ye(e,!!l.files)}</td></tr>
                  <tr><td>Tasks</td><td>${ye(e,!!l.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${ye(e,!!l.notes)}</td></tr>
                  <tr><td>Push</td><td>${ye(e,!!l.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${a}
      </section>`;const b=r.nbusers??r.users,p=r.nbcalendars??r.calendars,g=r.nbevents??r.events,f=r.nbbooks??r.addressBooks,v=r.nbcontacts??r.contacts;n=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${xe(e,"Registered users",b,"Users")}
          ${xe(e,"Calendars",p,"CalDAV")}
          ${xe(e,"Events",g,"CalDAV")}
          ${xe(e,"Address books",f,"CardDAV")}
          ${xe(e,"Contacts",v,"CardDAV")}
        </div>
        <div class="admin-service-row">
          ${ge(e,l.administration!==!1&&l.webAdmin!==!1,"Administration")}
          ${ge(e,!!l.caldav,"CalDAV")}
          ${ge(e,!!l.carddav,"CardDAV")}
          ${ge(e,!!l.files,"Files")}
          ${ge(e,!!l.tasks,"Tasks")}
          ${ge(e,!!l.notes,"Notes")}
          ${ge(e,!!l.push,"Push")}
        </div>
      </section>`}else n=`<section class="card">
      ${H("System snapshot","admin-overview")}
      ${a}
    </section>`;return`${s}
    ${n}`}function _r(e){const t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(a=>a.username.toLowerCase().includes(t)||(a.displayname||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)):e.state.adminUsers}function Rr(e){return e.state.adminUserCreateOpen?_({id:"admin-user-create-modal",title:"Add user",titleId:"admin-user-create-title",closeAction:"admin-user-create-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-create"',body:`
        <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
          <label>Username
            <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${e.state.busy?"disabled":""} />
          </label>
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="password" required autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm password
            <input type="password" name="passwordConfirm" required autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-create-close",variant:"ghost",disabled:e.state.busy},{label:"Create user",type:"submit",variant:"primary",disabled:e.state.busy}]}):""}function qr(e){if(!e.state.adminUserEditOpen||!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail;return _({id:"admin-user-edit-modal",title:"Edit user",titleId:"admin-user-edit-title",closeAction:"admin-user-edit-close",size:"sm",form:!0,formAttrs:'data-form="admin-user-edit"',body:`
        <p class="muted small">Username <span class="mono">${c(t.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${c(t.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${c(t.displayname)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${c(t.email)}" autocomplete="off" ${e.state.busy?"disabled":""} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${e.state.busy?"disabled":""} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${e.state.busy?"disabled":""} />
          </label>`,footer:[{label:"Cancel",action:"admin-user-edit-close",variant:"ghost",disabled:e.state.busy},{label:"Save changes",type:"submit",variant:"primary",disabled:e.state.busy}]})}function Br(e){if(!e.state.adminUserDeleteUsername)return"";const t=e.state.adminUserDeleteUsername,a=e.state.adminUserDetail&&e.state.adminUserDetail.username.toLowerCase()===t.toLowerCase()?e.state.adminUserDetail:e.state.adminUsers.find(n=>n.username.toLowerCase()===t.toLowerCase())??null,s=a?`${a.displayname||a.username} (${a.username})`:t;return _({id:"admin-user-delete-modal",title:"Delete user",titleId:"admin-user-delete-title",closeAction:"admin-user-delete-close",size:"sm",body:`
        <p>You are about to permanently delete <strong>${c(s)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${wt({action:"admin-user-delete-toggle",label:"I understand and want to delete this user",checked:e.state.adminUserDeleteConfirmChecked,disabled:e.state.busy,style:"admin"})}`,footer:[{label:"Cancel",action:"admin-user-delete-close",variant:"ghost",disabled:e.state.busy},{label:"Delete permanently",action:"admin-user-delete-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminUserDeleteConfirmChecked,attrs:`data-username="${c(t)}"`}]})}function Hr(e){if(!e.state.adminSelectedUsername)return"";if(e.state.adminUserDetailLoading&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${c(e.state.adminSelectedUsername)}</span>…</p>
    </section>`;if(e.state.adminUserDetailError&&!e.state.adminUserDetail)return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${c(e.state.adminUserDetailError)}</p>
    </section>`;if(!e.state.adminUserDetail)return"";const t=e.state.adminUserDetail,a=e.state.adminUserResourcesLoading&&e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">Loading calendars…</td></tr>':e.state.adminUserCalendars.length===0?'<tr><td colspan="5" class="muted">No calendars.</td></tr>':e.state.adminUserCalendars.map(d=>`<tr>
        <td class="mono">${c(d.uri)}</td>
        <td>${c(d.displayname)}</td>
        <td class="hide-sm">${c(String(d.eventCount))}${d.todos?' <span class="badge badge-admin">tasks</span>':""}${d.notes?' <span class="badge badge-admin">notes</span>':""}</td>
        <td class="hide-sm mono small">${c(d.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${d.instanceId}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${d.instanceId}" data-label="${c(d.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),s=e.state.adminUserResourcesLoading&&e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">Loading address books…</td></tr>':e.state.adminUserAddressBooks.length===0?'<tr><td colspan="4" class="muted">No address books.</td></tr>':e.state.adminUserAddressBooks.map(d=>`<tr>
        <td class="mono">${c(d.uri)}</td>
        <td>${c(d.displayname)}</td>
        <td class="hide-sm">${c(String(d.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${d.id}" ${e.state.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${d.id}" data-label="${c(d.displayname)}" ${e.state.busy?"disabled":""}>Delete</button>
        </td>
      </tr>`).join(""),n=e.state.adminCalEditId!==null?e.state.adminUserCalendars.find(d=>d.instanceId===e.state.adminCalEditId)??null:null,i=e.state.adminAbEditId!==null?e.state.adminUserAddressBooks.find(d=>d.id===e.state.adminAbEditId)??null:null,r=e.state.adminCalModal==="create"||e.state.adminCalModal==="edit"&&n?_({title:e.state.adminCalModal==="create"?"Add calendar":"Edit calendar",closeAction:"admin-cal-close",size:"sm",form:!0,formAttrs:'data-form="admin-cal"',body:`
          <input type="hidden" name="instanceId" value="${n?n.instanceId:""}" />
          ${e.state.adminCalModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${e.state.busy?"disabled":""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${c(n.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${c((n==null?void 0:n.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${c((n==null?void 0:n.description)??"")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${c((n==null?void 0:n.calendarcolor)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${n!=null&&n.todos||e.state.adminCalModal==="create"?"checked":""} ${e.state.busy?"disabled":""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${n!=null&&n.notes?"checked":""} ${e.state.busy?"disabled":""} /> Notes (VJOURNAL)</label>`,footer:[{label:"Cancel",action:"admin-cal-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",l=e.state.adminAbModal==="create"||e.state.adminAbModal==="edit"&&i?_({title:e.state.adminAbModal==="create"?"Add address book":"Edit address book",closeAction:"admin-ab-close",size:"sm",form:!0,formAttrs:'data-form="admin-ab"',body:`
          <input type="hidden" name="id" value="${i?i.id:""}" />
          ${e.state.adminAbModal==="create"?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${e.state.busy?"disabled":""} />
          </label>`:`<p class="muted small">URI <span class="mono">${c(i.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${c((i==null?void 0:i.displayname)??"")}" ${e.state.busy?"disabled":""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${e.state.busy?"disabled":""}>${c((i==null?void 0:i.description)??"")}</textarea>
          </label>`,footer:[{label:"Cancel",action:"admin-ab-close",variant:"ghost",disabled:e.state.busy},{label:"Save",type:"submit",variant:"primary",disabled:e.state.busy}]}):"",o=e.state.adminResourceDelete?_({title:`Delete ${e.state.adminResourceDelete.kind==="calendar"?"calendar":"address book"}`,closeAction:"admin-resource-delete-close",size:"sm",body:`
        <p>Delete <strong>${c(e.state.adminResourceDelete.label)}</strong> for <span class="mono">${c(t.username)}</span>?</p>
        ${e.state.adminResourceDelete.kind==="addressbook"?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${e.state.adminResourceDelete.force?"checked":""} /> Force delete even if contacts exist</label>`:'<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>'}`,footer:[{label:"Cancel",action:"admin-resource-delete-close",variant:"ghost"},{label:"Delete",action:"admin-resource-delete-confirm",variant:"danger",disabled:e.state.busy}]}):"";return`<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${c(t.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${c(t.username)}" ${e.state.busy?"disabled":""}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${c(t.username)}" ${e.state.busy?"disabled":""}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${c(t.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${c(t.username)}</dd></div>
      <div><dt>Display name</dt><dd>${c(t.displayname||"—")}</dd></div>
      <div><dt>Email</dt><dd>${t.email?`<a href="mailto:${c(t.email)}">${c(t.email)}</a>`:"—"}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${c(t.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${c(String(t.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${c(String(t.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${c(String(t.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${c(String(t.contactCount))}</dd></div>
    </dl>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Calendars</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${e.state.busy?"disabled":""}>Add calendar</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Address books</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${e.state.busy?"disabled":""}>Add address book</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
        <tbody>${s}</tbody>
      </table>
    </div>
  </section>
  ${r}${l}${o}`}function Vr(e){const t=fe(e,"users");if(t&&t.available===!1)return Et(e,"users");const a=_r(e),s=e.state.adminUsersLoading&&e.state.adminUsers.length===0?'<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>':a.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${e.state.adminUsersError?c(e.state.adminUsersError):e.state.adminUsersQuery.trim()?"No users match this filter.":"No users found."}</td></tr>`:a.map(n=>`<tr class="contact-table-row${e.state.adminSelectedUsername&&e.state.adminSelectedUsername.toLowerCase()===n.username.toLowerCase()?" is-selected":""}" data-action="admin-user-view" data-username="${c(n.username)}" tabindex="0" role="button">
                <td class="mono">${c(n.username)}</td>
                <td class="hide-sm">${c(n.displayname||"—")}</td>
                <td class="hide-sm">${c(n.email||"—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${c(n.username)}" ${e.state.busy?"disabled":""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${c(n.username)}" ${e.state.busy?"disabled":""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${c(n.username)}" ${e.state.busy?"disabled":""}>Delete</button>
                </td>
              </tr>`).join("");return`
    <section class="card">
      <div class="section-header">
        ${H("Users","admin-users")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ze(e,t.status)}">${c(Me(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${e.state.busy||e.state.adminUsersLoading?"disabled":""}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${e.state.busy?"disabled":""}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${c(e.state.adminUsersQuery)}" aria-label="Filter users" ${e.state.busy?"disabled":""} />
        <span class="muted small">${c(String(a.length))}${e.state.adminUsersQuery.trim()?` / ${e.state.adminUsers.length}`:""} user${a.length===1?"":"s"}</span>
      </div>
      ${e.state.adminUsersError&&e.state.adminUsers.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${c(e.state.adminUsersError)}</p>`:""}
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
          <tbody>${s}</tbody>
        </table>
      </div>
    </section>
    ${Hr(e)}
    ${Rr(e)}
    ${qr(e)}
    ${Br(e)}`}async function Kr(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!s||!n||!i||!r){e.setFlash("error","Username, display name, email, and password are required"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const o=await D.adminCreateUser({username:s,displayname:n,email:i,password:r,passwordConfirm:l});$.event("admin.user.create",{username:o.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=o.user.username,e.state.adminUserDetail=o.user,e.persistTab("admin","users",o.user.username),await we(e),e.setFlash("success",`Created user “${o.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Create failed")}finally{e.state.busy=!1,e.render()}}async function jr(e,t){const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("displayname")??"").trim(),i=String(a.get("email")??"").trim(),r=String(a.get("password")??""),l=String(a.get("passwordConfirm")??"");if(!s){e.setFlash("error","Username is required"),e.render();return}if(!n||!i){e.setFlash("error","Display name and email are required"),e.render();return}if(r!==""||l!==""){if(r===""||l===""){e.setFlash("error","Password and confirmation are required to change password"),e.render();return}if(r!==l){e.setFlash("error","Password confirmation does not match"),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{const o={displayname:n,email:i};r!==""&&(o.password=r,o.passwordConfirm=l);const d=await D.adminUpdateUser(s,o);$.event("admin.user.update",{username:d.user.username,passwordChanged:r!==""}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=d.user,e.state.adminSelectedUsername=d.user.username,await we(e),e.setFlash("success",r!==""?`Updated “${d.user.username}” (password changed)`:`Updated “${d.user.username}”`)}catch(o){e.setFlash("error",o instanceof Error?o.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function zr(e,t){var d,m;if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),i=String(s.get("description")??"").trim(),r=String(s.get("calendarcolor")??"").trim(),l=((d=t.querySelector('input[name="todos"]'))==null?void 0:d.checked)??!1,o=((m=t.querySelector('input[name="notes"]'))==null?void 0:m.checked)??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal==="create"){const u=String(s.get("uri")??"").trim().toLowerCase();await D.adminCreateUserCalendar(a,{uri:u,displayname:n,description:i,calendarcolor:r||void 0,todos:l,notes:o}),e.setFlash("success",`Created calendar “${n}”`)}else{const u=Number(s.get("instanceId"));await D.adminUpdateUserCalendar(a,u,{displayname:n,description:i,calendarcolor:r,todos:l,notes:o}),e.setFlash("success",`Updated calendar “${n}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await ke(e,a),await ae(e,a)}catch(u){e.setFlash("error",u instanceof Error?u.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Wr(e,t){if(!e.state.adminSelectedUsername)return;const a=e.state.adminSelectedUsername,s=new FormData(t),n=String(s.get("displayname")??"").trim(),i=String(s.get("description")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal==="create"){const r=String(s.get("uri")??"").trim().toLowerCase();await D.adminCreateUserAddressBook(a,{uri:r,displayname:n,description:i}),e.setFlash("success",`Created address book “${n}”`)}else{const r=Number(s.get("id"));await D.adminUpdateUserAddressBook(a,r,{displayname:n,description:i}),e.setFlash("success",`Updated address book “${n}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await ke(e,a),await ae(e,a)}catch(r){e.setFlash("error",r instanceof Error?r.message:"Save failed")}finally{e.state.busy=!1,e.render()}}const Yr=["UTC","Africa/Cairo","Africa/Johannesburg","America/Anchorage","America/Argentina/Buenos_Aires","America/Chicago","America/Denver","America/Edmonton","America/Halifax","America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver","Asia/Dubai","Asia/Hong_Kong","Asia/Jerusalem","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Australia/Melbourne","Australia/Sydney","Europe/Amsterdam","Europe/Berlin","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Warsaw","Pacific/Auckland","Pacific/Honolulu"];let De=null;function Jr(){if(De)return De;try{const e=Intl;if(typeof e.supportedValuesOf=="function"){const t=e.supportedValuesOf("timeZone");if(Array.isArray(t)&&t.length>0)return De=[...t].sort((a,s)=>a.localeCompare(s)),De}}catch{}return De=[...Yr],De}function An(e){const t=e||"UTC",a=Jr(),s=a.includes(t),n=a.map(i=>`<option value="${Ba(i)}" ${i===t?"selected":""}>${Ha(i)}</option>`);return!s&&t&&n.unshift(`<option value="${Ba(t)}" selected>${Ha(t)}</option>`),n.join("")}function Ba(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function Ha(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Gr(e){const t=fe(e,"settings");if(t&&t.available===!1)return Et(e,"settings");if(e.state.adminSystemSettingsLoading&&!e.state.adminSystemSettings)return'<section class="card"><p class="muted">Loading system settings…</p></section>';if(e.state.adminSystemSettingsError&&!e.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${c(e.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;const a=e.state.adminSystemSettings;if(!a)return'<section class="card"><p class="muted">No settings loaded.</p></section>';const s=(i,r,l)=>`<label class="check-row"><input type="checkbox" name="${c(i)}" ${r?"checked":""} ${e.state.busy||a.writable===!1?"disabled":""} /> ${c(l)}</label>`,n=(i,r,l,o="")=>`<label>${c(l)}
      <input type="number" name="${c(i)}" value="${c(String(r??0))}" ${e.state.busy||a.writable===!1?"disabled":""} />
      ${o?`<span class="muted small">${c(o)}</span>`:""}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${H("System settings","admin-settings")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ze(e,t.status)}">${c(Me(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${e.state.busy?"disabled":""}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
        <strong>session timeout</strong> affects portal idle sessions.
        ${a.writable===!1?'<span class="flash flash-error">Config is not writable by PHP.</span>':""}
      </p>
      <form class="stack admin-settings-form" data-form="admin-settings">
        <h3 class="admin-subsection-title">DAV services</h3>
        ${s("cal_enabled",!!a.cal_enabled,"Enable CalDAV")}
        ${s("card_enabled",!!a.card_enabled,"Enable CardDAV")}
        ${s("tasks_enabled",!!a.tasks_enabled,"Enable Tasks (VTODO)")}
        ${s("notes_enabled",!!a.notes_enabled,"Enable Notes (VJOURNAL)")}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["Digest","Basic","Apache"].map(i=>`<option value="${i}" ${a.dav_auth_type===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${e.state.busy||a.writable===!1?"disabled":""}>
            ${An(a.timezone||"UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${c(a.invite_from||"")}" placeholder="noreply@example.com" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${s("files_enabled",!!a.files_enabled,"Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${c(a.files_storage_path||"")}" placeholder="empty = Specific/files" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        ${n("files_max_upload_mb",a.files_max_upload_mb,"Max file size (MB)")}
        ${n("files_quota_mb",a.files_quota_mb,"Quota per user (MB)","0 = unlimited")}
        ${n("files_quarantine_days",a.files_quarantine_days,"Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${n("session_max_age_minutes",a.session_max_age_minutes,"Session idle timeout (minutes)","Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(a.portal_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        ${s("portal_admin_ui_enabled",a.portal_admin_ui_enabled!==!1,"Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${c(Array.isArray(a.portal_admin_users)?a.portal_admin_users.join(", "):String(a.portal_admin_users||""))}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${s("push_enabled",!!a.push_enabled,"Enable WebDAV-Push")}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${c(a.push_external_url||"")}" placeholder="https://dav.example.com/dav.php/" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${e.state.busy||a.writable===!1?"disabled":""}>
            ${["off","error","warn","info","debug"].map(i=>`<option value="${i}" ${(a.push_log_level||"off")===i?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">baikal.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${a.hasAdminPassword?"Leave blank to keep the current server admin password.":"No server admin password set yet."}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${e.state.busy||a.writable===!1?"disabled":""} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${e.state.busy||a.writable===!1?"disabled":""}>Save settings</button>
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
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${e.state.busy||a.writable===!1?"disabled":""}>
          Reset to Default
        </button>
      </div>
    </section>
    ${Xr(e)}`}function Xr(e){return e.state.adminResetModalOpen?_({id:"admin-reset-modal",title:"Reset to Default",titleId:"admin-reset-title",closeAction:"admin-reset-close",size:"sm",body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${wt({action:"admin-reset-toggle",label:"I understand all data will be deleted and the installer will open",checked:e.state.adminResetConfirmChecked,disabled:e.state.busy,style:"admin"})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${c(e.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-reset-close",variant:"ghost",disabled:e.state.busy},{label:"Reset and open installer",action:"admin-reset-confirm",variant:"danger",disabled:e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""}]}):""}async function Qr(e,t){const a=new FormData(t),s=l=>{var o;return!!((o=t.querySelector(`input[name="${l}"]`))!=null&&o.checked)},n={cal_enabled:s("cal_enabled"),card_enabled:s("card_enabled"),tasks_enabled:s("tasks_enabled"),notes_enabled:s("notes_enabled"),files_enabled:s("files_enabled"),push_enabled:s("push_enabled"),portal_admin_ui_enabled:s("portal_admin_ui_enabled"),timezone:String(a.get("timezone")??"").trim(),invite_from:String(a.get("invite_from")??"").trim(),dav_auth_type:String(a.get("dav_auth_type")??"Digest"),files_storage_path:String(a.get("files_storage_path")??"").trim(),files_max_upload_mb:Number(a.get("files_max_upload_mb")??0),files_quota_mb:Number(a.get("files_quota_mb")??0),files_quarantine_days:Number(a.get("files_quarantine_days")??0),session_max_age_minutes:Number(a.get("session_max_age_minutes")??15),portal_log_level:String(a.get("portal_log_level")??"off"),portal_admin_users:String(a.get("portal_admin_users")??"").trim(),push_external_url:String(a.get("push_external_url")??"").trim(),push_log_level:String(a.get("push_log_level")??"off")},i=String(a.get("admin_password")??""),r=String(a.get("admin_password_confirm")??"");(i!==""||r!=="")&&(n.admin_password=i,n.admin_password_confirm=r),e.state.busy=!0,e.clearFlash(),e.render();try{const l=await D.adminUpdateSystemSettings(n);e.state.adminSystemSettings=l.data;const o=l.data;e.state.portalUi={...e.state.portalUi,services:{caldav:!!o.cal_enabled,carddav:!!o.card_enabled,tasks:!!o.tasks_enabled,notes:!!o.notes_enabled,files:!!o.files_enabled}},$.event("admin.settings.save"),e.setFlash("success","System settings saved")}catch(l){e.setFlash("error",l instanceof Error?l.message:"Save failed")}finally{e.state.busy=!1,e.render()}}function Un(e,t){const a=new FormData(t),s=String(a.get("backend")??e.state.adminDbFormBackend).toLowerCase()==="pgsql"?"pgsql":"sqlite",n={backend:s};return s==="sqlite"?n.sqlite_file=String(a.get("sqlite_file")??"").trim():(n.pgsql_host=String(a.get("pgsql_host")??"").trim(),n.pgsql_dbname=String(a.get("pgsql_dbname")??"").trim(),n.pgsql_username=String(a.get("pgsql_username")??"").trim(),n.pgsql_password=String(a.get("pgsql_password")??"")),n}function Zr(e,t){e.state.adminDbPendingBody=Un(e,t),e.state.adminDbConfirmText="",e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function ei(e,t){if(t||(t=e.root.querySelector('[data-form="admin-database"]')),!t){e.setFlash("error","Database form not found"),e.render();return}const a=Un(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{const s=await D.adminTestDatabaseConnection(a);e.setFlash("success",s.message||"Connection successful"),$.event("admin.database.test",{backend:s.backend})}catch(s){e.setFlash("error",s instanceof Error?s.message:"Connection test failed")}finally{e.state.busy=!1,e.render()}}function ti(e){const t=fe(e,"database");if(t&&t.available===!1)return Et(e,"database");if(e.state.adminDatabaseSettingsLoading&&!e.state.adminDatabaseSettings)return'<section class="card"><p class="muted">Loading database settings…</p></section>';if(e.state.adminDatabaseSettingsError&&!e.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${c(e.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;const a=e.state.adminDatabaseSettings;if(!a)return'<section class="card"><p class="muted">No database settings loaded.</p></section>';const s=e.state.adminDbFormBackend,n=a.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${H("Database","admin-database")}
        <div class="section-actions">
          ${t?`<span class="badge ${Ze(e,t.status)}">${c(Me(e,t.status))}</span>`:""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${e.state.busy?"disabled":""}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${c(a.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${c((a.backend||"—").toUpperCase())}</span></dd>
        </div>
        ${a.backend==="sqlite"||a.sqlite_file?`<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${c(a.sqlite_file||"—")}</dd>
        </div>`:""}
        ${a.backend==="pgsql"||a.pgsql_host?`<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${c(a.pgsql_host||"—")} / ${c(a.pgsql_dbname||"—")} · ${c(a.pgsql_username||"—")}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>${a.hasPassword?'<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>`:""}
        <div>
          <dt>Encryption key</dt>
          <dd>${a.hasEncryptionKey?'<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>':'<span class="badge badge-off">Not set</span>'}</dd>
        </div>
      </dl>

      <h3 class="admin-subsection-title">Edit connection</h3>
      ${n?'<p class="flash flash-error">Config is not writable by PHP.</p>':""}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${e.state.busy||n?"disabled":""}>
            <option value="sqlite" ${s==="sqlite"?"selected":""}>SQLite</option>
            <option value="pgsql" ${s==="pgsql"?"selected":""}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${s==="sqlite"?"":"display:none"}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${c(a.sqlite_file||"")}" ${e.state.busy||n?"disabled":""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${s==="pgsql"?"":"display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${c(a.pgsql_host||"")}" placeholder="localhost:5432" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${c(a.pgsql_dbname||"")}" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${c(a.pgsql_username||"")}" autocomplete="off" ${e.state.busy||n?"disabled":""} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${a.hasPassword?"Leave blank to keep current":""}" ${e.state.busy||n?"disabled":""} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${e.state.busy||n?"disabled":""}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${e.state.busy||n?"disabled":""}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${ai(e)}`}function ai(e){if(!e.state.adminDbConfirmOpen)return"";const t=e.state.adminDbConfirmText.trim()==="CONFIRM";return _({id:"admin-db-confirm-modal",title:"Confirm database change",titleId:"admin-db-confirm-title",closeAction:"admin-db-confirm-close",size:"sm",body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${c(e.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${e.state.busy?"disabled":""} />
        </label>`,footer:[{label:"Cancel",action:"admin-db-confirm-close",variant:"ghost",disabled:e.state.busy},{label:"Save database settings",action:"admin-db-confirm-save",variant:"danger",disabled:e.state.busy||!t}]})}async function In(e,t,a={}){if(!e.userIsAdmin()){await e.activateTab("calendars",a);return}e.state.activeTab="admin",e.state.adminPage=t,t!=="users"?(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null):a.username!==void 0&&(e.state.adminSelectedUsername=a.username,a.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)),e.state.userMenuOpen=!1,e.persistTab("admin",t,e.state.adminSelectedUsername),$.event("tab",{tab:"admin",adminPage:t,user:e.state.adminSelectedUsername}),a.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await Gt(e),!e.adminUiEnabled()){e.state.activeTab="calendars",e.persistTab("calendars"),e.setFlash("info","Portal Administration UI is disabled.");return}const s=fe(e,t);t==="overview"&&(s==null?void 0:s.available)!==!1?await gt(e):t==="users"&&(s==null?void 0:s.available)!==!1?(await we(e),e.state.adminSelectedUsername&&(await ae(e,e.state.adminSelectedUsername),await ke(e,e.state.adminSelectedUsername))):t==="settings"&&(s==null?void 0:s.available)!==!1?await yt(e):t==="database"&&(s==null?void 0:s.available)!==!1&&await vt(e)}catch(s){$.warn("admin page load failed",s instanceof Error?s.message:s),e.setFlash("error",s instanceof Error?s.message:"Failed to load")}finally{e.state.busy=!1,e.render()}}function ni(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage==="users"?Vr(e):e.state.adminPage==="settings"?Gr(e):e.state.adminPage==="database"?ti(e):Lr(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:'<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>'}function si(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}async function ri(e,t,a,s){var n,i;if(!t.startsWith("admin-"))return!1;if(t==="admin-page"){const r=si(a.dataset.adminPage);return r&&await In(e,r),!0}if(t==="admin-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await gt(e),e.setFlash("success","Overview refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-users-refresh"){if(!e.userIsAdmin()||e.state.activeTab!=="admin")return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await we(e),e.state.adminSelectedUsername&&await ae(e,e.state.adminSelectedUsername),e.setFlash("success","Users refreshed")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Refresh failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-view"){const r=a.dataset.username??"";if(!r||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{await ae(e,r),await ke(e,r)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-close")return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab("admin","users",null),e.render(),!0;if(t==="admin-user-create-open")return e.userIsAdmin()&&(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render()),!0;if(t==="admin-user-create-close")return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t==="admin-user-edit-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";if(!r)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=r,e.state.adminPage="users",e.persistTab("admin","users",r),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==r.toLowerCase())&&await ae(e,r),e.state.adminUserEditOpen=!0}catch(l){e.setFlash("error",l instanceof Error?l.message:"Failed to load user")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-user-edit-close")return e.state.adminUserEditOpen=!1,e.render(),!0;if(t==="admin-user-delete-open"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminSelectedUsername??"";return r&&(e.state.adminUserDeleteUsername=r,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render()),!0}if(t==="admin-user-delete-close")return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t==="admin-user-delete-toggle"){const r=a;return e.state.adminUserDeleteConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-user-delete-confirm"){if(!e.userIsAdmin())return!0;const r=a.dataset.username??e.state.adminUserDeleteUsername??"";if(!r||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await D.adminDeleteUser(r,!0),$.event("admin.user.delete",{username:r}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,((n=e.state.adminSelectedUsername)==null?void 0:n.toLowerCase())===r.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab("admin","users",null)),await we(e),e.setFlash("success",`Deleted user “${r}”`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-cal-create")return e.state.adminCalModal="create",e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-edit")return e.state.adminCalModal="edit",e.state.adminCalEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-cal-close")return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t==="admin-cal-delete")return e.state.adminResourceDelete={kind:"calendar",id:Number(a.dataset.id),label:a.dataset.label??"calendar"},e.render(),!0;if(t==="admin-ab-create")return e.state.adminAbModal="create",e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-edit")return e.state.adminAbModal="edit",e.state.adminAbEditId=Number(a.dataset.id),e.render(),!0;if(t==="admin-ab-close")return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t==="admin-ab-delete")return e.state.adminResourceDelete={kind:"addressbook",id:Number(a.dataset.id),label:a.dataset.label??"address book",force:!1},e.render(),!0;if(t==="admin-ab-force-toggle")return((i=e.state.adminResourceDelete)==null?void 0:i.kind)==="addressbook"&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!a.checked},e.render()),!0;if(t==="admin-resource-delete-close")return e.state.adminResourceDelete=null,e.render(),!0;if(t==="admin-resource-delete-confirm"){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;const r=e.state.adminSelectedUsername,l=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{l.kind==="calendar"?await D.adminDeleteUserCalendar(r,l.id,!0):await D.adminDeleteUserAddressBook(r,l.id,!0,!!l.force),e.state.adminResourceDelete=null,await ke(e,r),await ae(e,r),e.setFlash("success","Deleted")}catch(o){e.setFlash("error",o instanceof Error?o.message:"Delete failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-settings-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await yt(e),e.setFlash("success","Settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-reset-open")return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.clearFlash(),e.render(),!0;if(t==="admin-reset-close")return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="",e.render(),!0;if(t==="admin-reset-toggle"){const r=a;return e.state.adminResetConfirmChecked=!!r.checked,e.render(),!0}if(t==="admin-reset-password"){e.state.adminResetPassword=a.value;const r=e.root.querySelector('[data-action="admin-reset-confirm"]');return r&&(r.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===""),!0}if(t==="admin-reset-confirm"){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()==="")return e.setFlash("error","Re-enter your password to confirm Reset to Default"),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r=await D.adminResetToDefault(!0,e.state.adminResetPassword);$.event("admin.settings.reset-to-default"),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword="";const l=r.redirectUrl&&r.redirectUrl.startsWith("/")?r.redirectUrl:"/portal/install/";return window.location.assign(l),!0}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reset failed"),e.state.busy=!1,e.render()}return!0}if(t==="admin-database-refresh"){e.state.busy=!0,e.clearFlash(),e.render();try{await vt(e),e.setFlash("success","Database settings reloaded")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Reload failed")}finally{e.state.busy=!1,e.render()}return!0}if(t==="admin-db-backend"){const r=a;return e.state.adminDbFormBackend=r.value==="pgsql"?"pgsql":"sqlite",e.render(),!0}if(t==="admin-db-test"){const r=a.closest("form");return ei(e,r),!0}if(t==="admin-db-confirm-close")return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null,e.render(),!0;if(t==="admin-db-confirm-input"){const r=a;e.state.adminDbConfirmText=r.value,e.render();const l=e.root.querySelector('[data-action="admin-db-confirm-input"]');if(l){l.focus();const o=l.value.length;l.setSelectionRange(o,o)}return!0}if(t==="admin-db-confirm-save"){if(e.state.adminDbConfirmText.trim()!=="CONFIRM"||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{const r={...e.state.adminDbPendingBody,confirm:"CONFIRM"},l=await D.adminUpdateDatabaseSettings(r);e.state.adminDatabaseSettings=l.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText="",e.state.adminDbPendingBody=null;const o=(l.data.backend||"sqlite").toLowerCase();e.state.adminDbFormBackend=o==="pgsql"?"pgsql":"sqlite",$.event("admin.database.save",{backend:l.data.backend}),e.setFlash("success","Database settings saved")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Database save failed")}finally{e.state.busy=!1,e.render()}return!0}return!1}function U(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${s}`}function $t(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return null;const a=new Date(Number(t[1]),Number(t[2])-1,Number(t[3]));return Number.isNaN(a.getTime())?null:a}function Xe(e,t){return new Date(e.getFullYear(),e.getMonth(),e.getDate()+t)}function ii(e){const t=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate())),a=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-a);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t.getTime()-s.getTime())/864e5+1)/7)}function li(e,t){const a=(4-t+7)%7;return ii(Xe(e,a))}function ma(e,t){const a=(e.getDay()-t+7)%7,s=Xe(e,-a),n=[];for(let i=0;i<7;i++)n.push(Xe(s,i));return{from:U(n[0]),to:U(n[6]),days:n}}function Va(e,t){const a=e.getFullYear()===t.getFullYear();if(a&&e.getMonth()===t.getMonth())return`${e.toLocaleString(void 0,{month:"short"})} ${e.getDate()}–${t.getDate()}, ${e.getFullYear()}`;const n=e.toLocaleString(void 0,{month:"short",day:"numeric",year:a?void 0:"numeric"}),i=t.toLocaleString(void 0,{month:"short",day:"numeric",year:"numeric"});return`${n} – ${i}`}function Xt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,s,n]=e.split("-").map(Number);return new Date(a,s-1,n)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,s,n]=e.slice(0,10).split("-").map(Number);return new Date(a,(s||1)-1,n||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function fa(e){const t=Xt(e.start);if(!e.end)return[U(t)];let a=Xt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const l=new Date(e.end);!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getSeconds()===0&&l.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[U(t)];const s=[],n=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(a.getFullYear(),a.getMonth(),a.getDate());let r=0;for(;n<=i&&r++<370;)s.push(U(n)),n.setDate(n.getDate()+1);return s.length?s:[U(t)]}function Te(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):U(t)}function oi(e){if(e==="24h")return!1;if(e==="12h")return!0;try{const a=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(a.hourCycle==="h23"||a.hourCycle==="h24")return!1;if(a.hourCycle==="h11"||a.hourCycle==="h12")return!0;if(typeof a.hour12=="boolean")return a.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function pa(e){return oi(e)?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function ba(e){var s;if(e==="monday")return 1;if(e==="sunday")return 0;const t=[...(s=navigator.languages)!=null&&s.length?navigator.languages:[],navigator.language].filter(Boolean);for(const n of t)try{const i=new Intl.Locale(n),r=typeof i.getWeekInfo=="function"?i.getWeekInfo():i.weekInfo,l=r==null?void 0:r.firstDay;if(typeof l=="number")return l===7?0:l}catch{}const a=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(a)?0:1}function Mn(e){const t=ba(e),a=new Date(2024,0,7+t),s=[];for(let n=0;n<7;n++){const i=new Date(a);i.setDate(a.getDate()+n),s.push(i.toLocaleDateString(void 0,{weekday:"short"}))}return s}function On(e,t=15){const a=t*60*1e3,s=e.getTime();return s%a===0?new Date(s):new Date(Math.ceil(s/a)*a)}function ee(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function di(e,t,a){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const n=e.slice(0,10),[i,r,l]=n.split("-").map(Number);return new Date(i,r-1,l).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const s=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(s.getTime())?e:s.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...pa(a)})}function Ee(e){if(!e){const a=On(new Date);return{date:U(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:U(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Ke(e){const t=new Date,a=U(t);if(e&&e!==a){const[i,r,l]=e.split("-").map(Number),o=new Date(i,r-1,l,9,0,0,0),d=new Date(i,r-1,l,10,0,0,0);return{start:ee(o),end:ee(d)}}const s=On(t,15),n=new Date(s.getTime()+3600*1e3);return{start:ee(s),end:ee(n)}}function ci(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function ga(e,t){const a=e.slice(0,10),s=(t||a).slice(0,10);if(a===s){const b=Ke(a);return{start:b.start,end:b.end}}const[n,i,r]=a.split("-").map(Number),[l,o,d]=s.split("-").map(Number),m=ee(new Date(n,i-1,r,9,0,0,0)),u=ee(new Date(l,o-1,d,17,0,0,0));return{start:m,end:u}}function ui(e,t){const a=Te(e);let s=t?Te(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const n=new Date(t);if(!Number.isNaN(n.getTime())&&n.getHours()===0&&n.getMinutes()===0&&n.getTime()>new Date(e).getTime()){const i=Xt(t);i.setDate(i.getDate()-1),s=U(i)}}return{start:a,end:s}}function Ue(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function mi(e){const{field:t,value:a,dateOnly:s,allowClear:n,viewY:i,viewM:r,weekStart:l,timeFormat:o}=e,d=Ee(a),m=ba(l),u=Mn(l),p=(new Date(i,r,1).getDay()-m+7)%7,g=new Date(i,r+1,0).getDate(),f=new Date(i,r,0).getDate(),v=d.date,S=d.hm,h=[],E=Math.ceil((p+g)/7)*7;for(let k=0;k<E;k++){let P,A,M=!1;k<p?(P=f-p+k+1,A=new Date(i,r-1,P),M=!0):k>=p+g?(P=k-(p+g)+1,A=new Date(i,r+1,P),M=!0):(P=k-p+1,A=new Date(i,r,P));const K=U(A),x=K===v,V=K===U(new Date);h.push(`<button type="button" class="dt-day${M?" is-outside":""}${x?" is-selected":""}${V?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${c(K)}">${P}</button>`)}const y=new Date().getFullYear(),w=Math.min(1900,i),F=Math.max(y+30,i),L=Array.from({length:12},(k,P)=>{const A=new Date(2e3,P,1).toLocaleString(void 0,{month:"short"});return`<option value="${P}" ${P===r?"selected":""}>${c(A)}</option>`}).join(""),B=[];for(let k=w;k<=F;k++)B.push(`<option value="${k}" ${k===i?"selected":""}>${k}</option>`);const N=s?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${ci().map(k=>{const P=(()=>{const[A,M]=k.split(":").map(Number);return new Date(2e3,0,1,A,M).toLocaleTimeString(void 0,pa(o))})();return`<button type="button" class="dt-time${k===S?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${k}" role="option" aria-selected="${k===S}">${c(P)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${s?"":" and time"}">
      <div class="dt-popover-inner${s?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${c(t)}" aria-label="Month">${L}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${c(t)}" aria-label="Year">${B.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${u.map(k=>`<span class="dt-dow">${c(k)}</span>`).join("")}</div>
          <div class="dt-days">${h.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(t)}" ${n?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${N}
      </div>
    </div>`}function fi(e=document){e.querySelectorAll(".dt-field.is-open").forEach(t=>{const a=t.querySelector(".dt-trigger"),s=t.querySelector(".dt-popover");if(!a||!s)return;const n=a.getBoundingClientRect(),i=8;s.style.position="fixed",s.style.visibility="hidden",s.style.top="0",s.style.left="0";const r=s.offsetWidth||320,l=s.offsetHeight||300;let o=n.bottom+6;o+l>window.innerHeight-i&&(o=Math.max(i,n.top-l-6));let d=n.left;d+r>window.innerWidth-i&&(d=Math.max(i,window.innerWidth-r-i)),d<i&&(d=i),s.style.top=`${Math.round(o)}px`,s.style.left=`${Math.round(d)}px`,s.style.right="auto",s.style.visibility="visible",s.style.zIndex="200"})}function ya(e,t){const a=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return a;const s=new Date(t.start);return Number.isNaN(s.getTime())?a:`${s.toLocaleTimeString(void 0,e.timeFormatOpts())} ${a}`}function pi(e,t,a){return new Date(t,a,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Tt(e){return $t(e.state.calFocusDay)??new Date}function va(e){const t=e.state.eventSearch.trim().toLowerCase();return t?e.state.monthEvents.filter(a=>(a.summary||"").toLowerCase().includes(t)):e.state.monthEvents}function bi(e){const t=e.localeWeekStart(),a=Tt(e);if(e.state.calView==="week"){const l=ma(a,t);return{from:l.from,to:l.to}}if(e.state.calView==="agenda"){const l=Xe(a,34);return{from:U(a),to:U(l)}}const s=e.state.monthCursor.y,n=e.state.monthCursor.m,i=new Date(s,n,1),r=new Date(s,n+1,0);return{from:U(i),to:U(r)}}function gi(e){return e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start)?$t(e.start.slice(0,10))??new Date(NaN):new Date(e.start)}function _t(e){return e.getHours()*60+e.getMinutes()}function Nn(e){return e==="month"||e==="week"||e==="agenda"?e:null}function xn(e){return`${hs}:${e}`}function yi(e){if(!e)return null;try{const t=localStorage.getItem(xn(e));if(t==null||t==="")return null;const a=JSON.parse(t);if(!a||typeof a!="object")return null;const s=a;let n=[];Array.isArray(s.ids)&&(n=s.ids.map(l=>Number(l)).filter(l=>Number.isFinite(l)&&l>0).map(l=>Math.floor(l)));let i=null;if(s.selectedId===null||s.selectedId===void 0)i=null;else{const l=Number(s.selectedId);i=Number.isFinite(l)&&l>0?Math.floor(l):null}const r=Nn(s.view)??void 0;return{ids:n,selectedId:i,view:r}}catch{return null}}function Ye(e){var a;const t=(a=e.user)==null?void 0:a.username;if(t)try{const s={ids:e.selectedIds.slice(),selectedId:e.selectedId,view:Nn(e.calView)??"month"};localStorage.setItem(xn(t),JSON.stringify(s))}catch{}}async function $a(e,t){const a=await D.shares(t);e.state.shares=a.shares}function vi(e){const t=e.state.calendars.filter(s=>s.canShare);if(t.length===0)return null;const a=s=>{const n=s.uri.toLowerCase(),i=s.displayname.toLowerCase();return n==="default"||i==="default"||i==="default calendar"};return t.find(a)??t[0]??null}async function Pt(e){const t=e.state.selectedIds.filter(n=>e.state.calendars.some(i=>i.id===n));if(t.length===0){e.state.monthEvents=[];return}const{from:a,to:s}=bi(e);e.state.monthEventsLoading=!0,$.debug("loadMonthEvents",{selectedIds:t,from:a,to:s});try{const i=(await Promise.all(t.map(async r=>(await D.calendarEvents(r,a,s)).events.map(o=>({...o,instanceId:r}))))).flat();i.sort((r,l)=>{const o=r.start||"",d=l.start||"";return o!==d?o<d?-1:1:(r.summary||"").localeCompare(l.summary||"")}),e.state.monthEvents=i,$.event("monthEvents.loaded",{calendarIds:t,count:e.state.monthEvents.length,from:a,to:s})}catch(n){e.state.monthEvents=[],$.warn("loadMonthEvents failed",n instanceof Error?n.message:n)}finally{e.state.monthEventsLoading=!1}}function ha(e,t){const a=e.state.calendars.find(s=>s.id===t);return a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6"}function $i(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(a=>a!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t),Ye(e.state)}function wa(e){const t=e.state.calendars.filter(p=>e.state.selectedIds.includes(p.id)),a=t.length===0?"No calendar selected":t.length===1?t[0].displayname:`${t.length} calendars`,s=t.slice(0,6).map(p=>{const g=p.color&&p.color.length>=7?p.color.slice(0,7):p.color||"#3B82F6";return`<span class="cal-swatch" style="background:${c(g)};margin-top:0" title="${c(p.displayname)}"></span>`}).join(""),n=t.length===0?e.state.calendars.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':"":e.state.monthEventsLoading?'<p class="muted small month-empty-hint">Loading events…</p>':"",i=e.state.calView,r=Tt(e);let l,o,d;if(i==="week"){const p=ma(r,e.localeWeekStart());l=Va(p.days[0],p.days[6]),o="Previous week",d="Next week"}else i==="agenda"?(l=`Agenda · ${Va(r,new Date(r.getFullYear(),r.getMonth(),r.getDate()+34))}`,o="Previous period",d="Next period"):(l=pi(e,e.state.monthCursor.y,e.state.monthCursor.m),o="Previous month",d="Next month");const u=[{id:"month",label:"Month"},{id:"week",label:"Week"},{id:"agenda",label:"Agenda"}].map(p=>`<button type="button" class="btn btn-ghost btn-small cal-view-btn${i===p.id?" is-active":""}" data-action="cal-view" data-view="${p.id}" ${e.state.busy?"disabled":""}>${p.label}</button>`).join(""),b=`<div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${e.state.busy?"disabled":""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="${c(o)}" ${e.state.busy?"disabled":""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="${c(d)}" ${e.state.busy?"disabled":""}>›</button>
      </div>
      <h2 class="month-cal-title">${c(l)}</h2>
      <div class="cal-view-toggle" role="group" aria-label="Calendar view">${u}</div>
      <input type="search" class="cal-event-search" data-action="event-search" placeholder="Search events…"
        value="${c(e.state.eventSearch)}" aria-label="Search events" ${e.state.busy?"disabled":""} />
      <span class="month-cal-name muted small" title="${c(a)}">
        ${s}
        ${c(a)}
      </span>
    </div>`;return{calName:a,swatches:s,emptyHint:n,toolbar:b}}function hi(e){const t=wa(e),a=Tt(e),s=va(e),n=new Map;for(const o of s)for(const d of fa(o)){const m=n.get(d)??[];m.push(o),n.set(d,m)}const i=U(new Date),r=[];for(let o=0;o<35;o++){const d=Xe(a,o),m=U(d),u=n.get(m)??[];if(u.length===0)continue;const b=d.toLocaleString(void 0,{weekday:"long",month:"long",day:"numeric",year:"numeric"}),p=u.map(g=>{var y;const f=g.instanceId,v=ya(e,g),S=ha(e,f),h=((y=e.state.calendars.find(w=>w.id===f))==null?void 0:y.displayname)||"",E=h?`${v} · ${h}`:v;return`<button type="button" class="agenda-event" title="${c(E)}" style="--ev-color:${c(S)}"
            data-action="open-event" data-instance="${f}" data-uri="${c(g.uri)}" ${e.state.busy?"disabled":""}>${c(v)}</button>`}).join("");r.push(`<section class="agenda-day${m===i?" is-today":""}">
      <h3 class="agenda-day-title">${c(b)}</h3>
      <div class="agenda-list">${p}</div>
    </section>`)}const l=r.length>0?r.join(""):`<p class="muted" style="margin:0.5rem 0 0">${e.state.eventSearch.trim()?"No events match this search in the current range.":"No events in this period."}</p>`;return`<section class="card month-cal-card agenda-cal-card">
    ${t.toolbar}
    ${t.emptyHint}
    <div class="agenda-wrap">${l}</div>
  </section>`}const Pe=40;function Ka(e,t,a){var u;const s=t.instanceId,n=ya(e,t),i=ha(e,s),r=((u=e.state.calendars.find(b=>b.id===s))==null?void 0:u.displayname)||"",l=r?`${n} · ${r}`:n;let o=0,d=Pe;if(!t.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(t.start)){const b=gi(t);U(b)===a&&(o=_t(b)/60*Pe);const p=t.end&&!/^\d{4}-\d{2}-\d{2}$/.test(t.end)?new Date(t.end):null;if(p&&!Number.isNaN(p.getTime())){const g=U(b)===a?_t(b):0,f=U(p)===a?_t(p):1440;d=Math.max(18,(f-g)/60*Pe)}}const m=t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start)?`--ev-color:${c(i)}`:`--ev-color:${c(i)};top:${o}px;height:${d}px`;return`<button type="button" class="week-event${t.allDay?"":" is-timed"}" title="${c(l)}"
      style="${m}"
      data-action="open-event" data-instance="${s}" data-uri="${c(t.uri)}" ${e.state.busy?"disabled":""}>${c(n)}</button>`}function wi(e){const t=wa(e),a=Tt(e),{days:s}=ma(a,e.localeWeekStart()),n=U(new Date),i=va(e),r=new Map;for(const g of i)for(const f of fa(g)){const v=r.get(f)??[];v.push(g),r.set(f,v)}const l=e.state.userSettings.dayStartHour,o=e.state.userSettings.dayEndHour,d=Array.from({length:24},(g,f)=>{const S=new Date(2024,0,1,f).toLocaleTimeString(void 0,e.timeFormatOpts());return`<div class="week-hour-label${f>=l&&f<o?" is-workhour":""}" style="height:${Pe}px">${c(S)}</div>`}).join(""),m=(()=>{const g=e.state.selectedId!==null?e.state.calendars.find(f=>f.id===e.state.selectedId)??null:null;return!!(g&&!g.readOnly&&(g.canShare||g.access==="readwrite"))})(),u=[],b=[],p=[];for(const g of s){const f=U(g),v=f===n,S=r.get(f)??[],h=S.filter(N=>N.allDay||/^\d{4}-\d{2}-\d{2}$/.test(N.start)),E=S.filter(N=>!N.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(N.start)),y=h.map(N=>Ka(e,N,f)).join(""),w=E.map(N=>Ka(e,N,f)).join(""),F=g.toLocaleString(void 0,{weekday:"short",month:"short",day:"numeric"});u.push(`<div class="week-day-head${v?" is-today":""}"${m?` data-action="new-event-day" data-day="${c(f)}" role="button" tabindex="0" title="Add event on ${c(f)}"`:""}>${c(F)}</div>`),b.push(`<div class="week-allday${v?" is-today":""}">${y||'<span class="week-allday-empty"></span>'}</div>`);const L=m?`<div class="week-slots">${Array.from({length:24},(N,k)=>{const P=String(k).padStart(2,"0");return`<button type="button" class="week-slot" data-action="new-event-slot" data-day="${c(f)}" data-hour="${k}" title="Add event at ${c(f)} ${P}:00" ${e.state.busy?"disabled":""}></button>`}).join("")}</div>`:"",B=o>l?'<div class="week-workday" aria-hidden="true"></div>':"";p.push(`<div class="week-timed${v?" is-today":""}${m?" is-clickable":""}" style="height:${24*Pe}px">${B}${L}${w}</div>`)}return`<section class="card month-cal-card week-cal-card">
    ${t.toolbar}
    ${t.emptyHint}
    <div class="week-wrap" style="--week-hour:${Pe}px;--day-start-h:${l};--day-end-h:${o}">
      <div class="week-frozen">
        <div class="week-grid-row week-head-row">
          <div class="week-gutter-head"></div>
          ${u.join("")}
        </div>
        <div class="week-grid-row week-allday-row">
          <div class="week-gutter-allday muted small">All day</div>
          ${b.join("")}
        </div>
      </div>
      <div class="week-grid-row week-timed-row">
        <div class="week-hours">${d}</div>
        ${p.join("")}
      </div>
    </div>
  </section>`}function ki(e){return e.state.calView==="week"?wi(e):e.state.calView==="agenda"?hi(e):Di(e)}function Si(e){return ki(e)}function Di(e){const t=e.state.monthCursor.y,a=e.state.monthCursor.m,s=new Date(t,a,1),n=e.localeWeekStart(),i=(s.getDay()-n+7)%7,r=new Date(t,a+1,0).getDate(),l=new Date(t,a,0).getDate(),d=U(new Date),m=e.localeDowLabels(),u=new Map;for(const v of va(e))for(const S of fa(v)){const h=u.get(S)??[];h.push(v),u.set(S,h)}const b=e.state.userSettings.showWeekNumbers,p=[],g=Math.ceil((i+r)/7)*7;for(let v=0;v<g;v++){let S,h=!0,E;v<i?(S=l-i+v+1,h=!1,E=new Date(t,a-1,S)):v>=i+r?(S=v-(i+r)+1,h=!1,E=new Date(t,a+1,S)):(S=v-i+1,E=new Date(t,a,S));const y=U(E),w=y===d,F=h?u.get(y)??[]:[],L=e.state.monthExpandDay===y?50:3,B=F.slice(0,L),N=F.length-B.length,k=B.map(x=>{var Pa;const V=x.instanceId,z=ya(e,x),Ut=ha(e,V),Ta=((Pa=e.state.calendars.find(Xn=>Xn.id===V))==null?void 0:Pa.displayname)||"",Gn=Ta?`${z} · ${Ta}`:z;return`<button type="button" class="month-event${x.allDay?"":" is-timed"}" title="${c(Gn)}" style="--ev-color:${c(Ut)}"
          data-action="open-event" data-instance="${V}" data-uri="${c(x.uri)}" ${e.state.busy?"disabled":""}>${c(z)}</button>`}).join(""),P=N>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(y)}" title="Show all events this day" ${e.state.busy?"disabled":""}>+${N} more</button>`:"",A=!h&&(S===1||v===i+r)?E.toLocaleString(void 0,{month:"short",day:"numeric"}):String(S),M=e.state.selectedId!==null?e.state.calendars.find(x=>x.id===e.state.selectedId)??null:null,K=!!(M&&!M.readOnly&&(M.canShare||M.access==="readwrite"));if(b&&v%7===0){const x=li(E,n);p.push(`<div class="month-weeknum" title="ISO week ${x}"><span>${x}</span></div>`)}p.push(`<div class="month-cell${h?"":" is-outside"}${w?" is-today":""}${K?" is-clickable":""}"${K?` data-action="new-event-day" data-day="${c(y)}" role="button" tabindex="0" title="Add event on ${c(y)}"`:""}>
      <div class="month-daynum${w?" is-today-num":""}">${c(A)}</div>
      <div class="month-events">${k}${P}</div>
    </div>`)}const f=wa(e);return`<section class="card month-cal-card">
    ${f.toolbar}
    ${f.emptyHint}
    <div class="month-grid-wrap${b?" has-weeknums":""}" role="grid" aria-label="Month calendar">
      <div class="month-dow-row${b?" has-weeknums":""}" role="row">
        ${b?'<div class="month-weeknum-hd" title="ISO week">Wk</div>':""}
        ${m.map(v=>`<div class="month-dow">${c(v)}</div>`).join("")}
      </div>
      <div class="month-grid${b?" has-weeknums":""}" role="rowgroup">
        ${p.join("")}
      </div>
    </div>
  </section>`}function ka(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Ci(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function Qe(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),s=String(e.get("repeatEndMode")??"never"),n=s==="until"||s==="count"?s:"never";let i=null,r=null;if(n==="until"){const o=String(e.get("repeatUntil")??"").trim();i=o?o.slice(0,10):null}else if(n==="count"){const o=Number(e.get("repeatCount")??0);r=Number.isFinite(o)&&o>0?Math.min(999,Math.round(o)):10}const l=e.getAll("repeatByDay").map(o=>String(o).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:i,count:r,byDay:l,endMode:n}}function Ei(e){if(!e.state.eventModalOpen||!e.state.editingEvent)return"";const t=e.state.editingEvent,a=t.repeat??ka(),s=(a.freq||"").toUpperCase(),n=e.state.calendars.filter(g=>g.canShare||g.access==="readwrite"),i=e.state.calendars.filter(g=>g.id===t.instanceId?!0:g.readOnly?!1:g.canShare||g.access==="readwrite").map(g=>`<option value="${g.id}" ${g.id===t.instanceId?"selected":""}>${c(g.displayname)}</option>`).join(""),r=t.readOnly||!t.canWrite;let l,o;if(t.allDay)l=Te(t.start),o=Te(t.end);else{const g=t.start||"",f=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(g)){const v=ga(g,f||null);l=v.start,o=v.end||""}else l=Ue(t.start),o=Ue(t.end)}const d=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],m=new Set((a.byDay||[]).map(g=>g.toUpperCase())),u=Ci(a),b=!!s&&u==="until",p=a.until||(u==="until"?Te(t.start)||U(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${e.state.creatingEvent?"New event":"Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${e.renderFlashBanner()}
        ${!e.state.creatingEvent&&(t.hasRrule||s)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
        ${r?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${r||n.length===0?"disabled":""}>
              ${i||`<option value="${t.instanceId}">${c(t.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${r?"readonly":""} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${c(t.location)}" ${r?"readonly":""} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${r?"readonly":""}>${c(t.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${r?"disabled":""} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${e.renderPortalDateTimeField({field:"start",name:"start",label:"Start",value:l,dateOnly:t.allDay,required:!0,disabled:r,allowClear:!1})}
            ${e.renderPortalDateTimeField({field:"end",name:"end",label:"End",value:o,dateOnly:t.allDay,disabled:r||b,allowClear:!b})}
          </div>
          <fieldset class="event-repeat" ${r?"disabled":""}>
            <legend class="event-repeat-legend">Repeat</legend>
            <div class="form-grid form-grid-2">
              <label>Frequency
                <select name="repeatFreq" data-action="event-repeat-freq">
                  <option value="" ${s?"":"selected"}>Does not repeat</option>
                  <option value="DAILY" ${s==="DAILY"?"selected":""}>Daily</option>
                  <option value="WEEKLY" ${s==="WEEKLY"?"selected":""}>Weekly</option>
                  <option value="MONTHLY" ${s==="MONTHLY"?"selected":""}>Monthly</option>
                  <option value="YEARLY" ${s==="YEARLY"?"selected":""}>Yearly</option>
                </select>
              </label>
              <label>Every
                <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(a.interval||1))}" ${s?"":"disabled"} />
              </label>
            </div>
            ${s==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${d.map(g=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${g.code}" ${m.has(g.code)?"checked":""} />
                            ${g.label}
                          </label>`).join("")}
                  </div>`:""}
            ${s?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${u==="never"?"selected":""}>Never</option>
                        <option value="until" ${u==="until"?"selected":""}>On date</option>
                        <option value="count" ${u==="count"?"selected":""}>After count</option>
                      </select>
                    </label>
                    ${u==="until"?e.renderPortalDateTimeField({field:"until",name:"repeatUntil",label:"Until",value:p,dateOnly:!0,disabled:r,allowClear:!0}):u==="count"?`<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${c(String(a.count||10))}" />
                            </label>`:"<span></span>"}
                  </div>`:""}
          </fieldset>
          <div class="form-actions-row" style="margin-top:0.5rem">
            ${r?"":`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingEvent?"Create event":"Save event"}</button>
                   ${e.state.creatingEvent?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${e.state.busy?"disabled":""}>Delete</button>`}`}
            <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`}function Ln(e,t){const a=e.state.calendars.find(s=>s.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",hasRrule:!1,repeat:ka(),readOnly:!1,canWrite:!0}}function Ti(e,t,a){return{...Ln(e,a),start:t,end:t,allDay:!0}}function Pi(e,t,a,s){const[n,i,r]=t.split("-").map(Number),l=Math.max(0,Math.min(23,Math.floor(a))),o=new Date(n,i-1,r,l,0,0,0),d=new Date(o.getTime()+3600*1e3);return{...Ln(e,s),start:ee(o),end:ee(d),allDay:!1}}function Fi(e,t){if(!e.state.editingEvent)return;const a=new FormData(t),s=t.querySelector('input[name="allDay"]');e.state.editingEvent={...e.state.editingEvent,summary:String(a.get("summary")??e.state.editingEvent.summary),description:String(a.get("description")??e.state.editingEvent.description),location:String(a.get("location")??e.state.editingEvent.location),instanceId:Number(a.get("instanceId"))||e.state.editingEvent.instanceId,allDay:(s==null?void 0:s.checked)??e.state.editingEvent.allDay,start:String(a.get("start")??e.state.editingEvent.start??""),end:String(a.get("end")??e.state.editingEvent.end??"")||null,repeat:Qe(a),hasRrule:!!String(a.get("repeatFreq")??"").trim()}}function ue(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function _n(e){ue(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"){ue(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase==="processing"&&qn(e,e.state.importProgress)},1e3)}function je(e,t,a={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...a},e.render())}function Ai(e){ue(e),e.state.importProgress=null,e.render()}function Rn(e,t){!e.state.importProgress||e.state.importProgress.phase==="done"||e.state.importProgress.phase==="error"||(e.state.importProgress={...e.state.importProgress,phase:"processing",processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},qn(e,e.state.importProgress))}function qn(e,t){const a=e.root.querySelector("[data-import-status-line]"),s=e.root.querySelector(".import-progress-bar"),n=e.root.querySelector(".import-progress-track"),i=e.root.querySelector("[data-import-counts]"),r=t.kind==="calendar"?"items":"contacts";let l;if(t.phase==="processing"&&t.processTotal>0)l=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${r} (${t.processPercent??0}%) · ${Z(t.elapsedSec)}`;else if(t.phase==="processing")l=`Importing on server… ${Z(t.elapsedSec)}`;else return;a&&(a.textContent=l),i&&(i.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}`),s&&t.processPercent!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),n&&t.processPercent!==null&&(n.setAttribute("aria-valuenow",String(t.processPercent)),n.removeAttribute("aria-valuetext"))}function Ui(e){if(!e.state.importProgress)return"";const t=e.state.importProgress,a=t.phase!=="done"&&t.phase!=="error",s=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",n=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",i=(()=>{const o=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],m={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return o.map((u,b)=>{let p="pending";return t.phase==="done"||b<m?p="done":b===m&&(p=(t.phase==="error","active")),`<li class="import-step import-step-${p}"><span class="import-step-icon" aria-hidden="true">${p==="done"?"✓":p==="active"?"●":"○"}</span> ${c(u.label)}</li>`}).join("")})();let r="";if(a){let o=null;t.phase==="reading"&&t.readPercent!==null?o=Math.min(100,Math.max(0,t.readPercent)):t.phase==="processing"&&t.processPercent!==null&&(o=Math.min(100,Math.max(0,t.processPercent)));const d=o===null?"import-progress-bar is-indeterminate":"import-progress-bar",m=o!==null?` style="width:${o}%"`:"",u=t.kind==="calendar"?"items":"contacts";let b;t.phase==="reading"?b=t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?b="Uploading to server…":t.processTotal>0?b=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${u} (${t.processPercent??0}%) · ${Z(t.elapsedSec)}`:b=`Importing on server… ${Z(t.elapsedSec)}`;const p=t.phase==="processing"&&t.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';r=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${c(s)}</strong> from
        <span class="mono">${c(t.fileName)}</span>
        ${t.fileSizeLabel?` <span class="muted">(${c(t.fileSizeLabel)})</span>`:""}
      </p>
      <ul class="import-steps">${i}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${o!==null?`aria-valuenow="${o}"`:'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${d}"${m}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${c(b)}</p>
      ${p}
      <p class="muted small">Keep this tab open until the import finishes.
        ${t.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
      </p>`}else t.phase==="done"?r=`
      ${se("success",`Success. ${t.resultMessage||"Import completed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${c(t.fileName)}</span>
        · Took ${c(Z(t.elapsedSec))}
      </p>`:r=`
      ${se("error",`Failed. ${t.resultMessage||"Import failed."}`,{className:"import-result",style:"margin:0 0 1rem"})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${c(t.fileName)}</span>
        · After ${c(Z(t.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const l=a?'<p class="muted small" style="margin:0">Please wait…</p>':ea([{label:"Close",action:"close-import-progress",variant:"primary"}]);return _({title:n,titleId:"import-progress-title",closeAction:"close-import-progress",size:"sm",className:"import-progress-modal",cardClassName:"import-progress-card",rootAttrs:"data-import-progress",hideClose:a,lockBackdrop:a,body:r,footer:l})}function Bn(e,t,a){return new Promise((s,n)=>{const i=new FileReader;i.onprogress=r=>{r.lengthComputable&&r.total>0?a(Math.min(100,Math.round(r.loaded/r.total*100))):a(null)},i.onload=()=>s(String(i.result??"")),i.onerror=()=>n(i.error??new Error("Failed to read file")),i.readAsText(t)})}async function Ii(e,t){var s;if(e.state.selectedId===null)return;const a=(s=t.files)==null?void 0:s[0];t.value="",a&&(e.state.calModalOpen=!0,await Hn(e,e.state.selectedId,a,{keepEditModalOpen:!0}))}async function Mi(e,t){var m;const a=(m=t.files)==null?void 0:m[0];if(t.value="",!a)return;const s=e.root.querySelector('[data-form="create-cal"]'),n=s?new FormData(s):new FormData,i=n.get("holidays")==="on",r=n.get("readOnly")==="on";if(i){e.setFlash("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),e.state.createCalModalOpen=!0,e.render();return}if(r){e.setFlash("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),e.state.createCalModalOpen=!0,e.render();return}let l=String(n.get("displayname")??"").trim();l||(l=a.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const o=String(n.get("description")??""),d=String(n.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{const u=await D.createCalendar({displayname:l,description:o,color:d,readOnly:!1});e.state.selectedId=u.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash("success",`Created “${u.calendar.displayname}” — importing…`),await Hn(e,u.calendar.id,a,{keepEditModalOpen:!1,successPrefix:`Calendar “${u.calendar.displayname}” created. `})}catch(u){const b=u instanceof Error?u.message:"Create or import failed";e.state.createCalModalOpen=!0,e.setFlash("error",b),e.state.busy=!1,e.render()}}async function Hn(e,t,a,s={}){e.state.busy=!0,e.clearFlash(),ue(e),e.state.importProgress={kind:"calendar",fileName:a.name,fileSizeLabel:bt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},_n(e),e.render();try{const n=await Bn(e,a,l=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:l};const o=e.root.querySelector(".import-progress-bar"),d=e.root.querySelector("[data-import-status-line]");o&&l!==null&&(o.classList.remove("is-indeterminate"),o.style.width=`${l}%`),d&&l!==null&&(d.textContent=`Reading file… ${l}%`)});je(e,"uploading",{readPercent:100}),je(e,"processing",{processPercent:0}),$.event("import.calendar.start",{file:a.name,bytes:a.size,calId:t});const i=await D.importCalendar(t,n,l=>{Rn(e,l)}),r=e.formatImportResult(i);e.state.selectedId===t&&await Pt(e),ue(e),je(e,"done",{ok:!0,resultMessage:`${r} (from “${a.name}”)`}),e.setFlash("success",`${s.successPrefix||""}Import finished for “${a.name}”: ${r}.`)}catch(n){const i=n instanceof Error?n.message:"Import failed";ue(e),je(e,"error",{ok:!1,resultMessage:i}),e.setFlash("error",i)}finally{s.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function Oi(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("username")??"").trim(),n=String(a.get("access")??"read");if(!s){e.setFlash("error","Select a user to share with"),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await D.share(e.state.selectedId,s,n),await $a(e,e.state.selectedId),e.setFlash("success",`Shared with ${s}`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Share failed")}finally{e.state.busy=!1,e.render()}}async function Ni(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),i=String(a.get("location")??"").trim(),r=a.get("allDay")==="on",l=String(a.get("start")??"").trim(),o=String(a.get("end")??"").trim(),d=Number(a.get("instanceId"))||e.state.editingEvent.instanceId,m=Qe(a);if(!s){e.setFlash("error","Title is required"),e.render();return}if(!l){e.setFlash("error","Start is required"),e.render();return}let u,b;if(r)u=l.slice(0,10),b=o?o.slice(0,10):u;else if(/^\d{4}-\d{2}-\d{2}$/.test(l)){const v=ga(l,o||null);u=new Date(v.start).toISOString(),b=v.end?new Date(v.end).toISOString():null}else u=new Date(l).toISOString(),b=o?new Date(o).toISOString():null;const p=e.state.editingEvent.instanceId,g=e.state.editingEvent.uri,f=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),$.event(f?"event.create":"event.update",{instanceId:d,uri:f?null:g,allDay:r,summary:s});try{const v={summary:s,description:n,location:i,allDay:r,start:u,end:b,instanceId:d,repeat:m},S=f?await D.createEvent(d,v):await D.updateEvent(p,g,v);(e.state.selectedId===null||S.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=S.event.instanceId),await Pt(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,$.event(f?"event.created":"event.saved",{uri:S.event.uri,instanceId:S.event.instanceId}),e.setFlash("success",me("Event",S.event.summary||s,f?"created":"saved"))}catch(v){$.warn("event.save failed",v instanceof Error?v.message:v),e.setFlash("error",v instanceof Error?v.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function xi(e,t){if(e.state.selectedId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),i=String(a.get("color")??"").trim();e.state.busy=!0,e.clearFlash(),e.render();try{const r=await D.updateCalendar(e.state.selectedId,{displayname:s,description:n,color:i});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=r.calendar.id,await $a(e,e.state.selectedId),await Pt(e),e.setFlash("success","Calendar updated")}catch(r){e.setFlash("error",r instanceof Error?r.message:"Update failed")}finally{e.state.busy=!1,e.render()}}async function Li(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??""),i=String(a.get("color")??"").trim(),r=a.get("holidays")==="on",l=String(a.get("holidayCountry")??"").trim(),o=a.get("readOnly")==="on";if(e.state.createCalModalOpen=!0,r&&!l){e.setFlash("error","Select a country for the holidays calendar"),e.render();return}if(!r&&!s){e.setFlash("error","Display name is required"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const d=await D.createCalendar({displayname:s,description:n,color:i,holidays:r,holidayCountry:r?l:void 0,readOnly:o});e.state.selectedId=d.calendar.id,e.state.selectedIds.includes(d.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,d.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let m=`Created “${d.calendar.displayname}”`;const u=d.holidayImport??d.calendar.holidayImport;u&&(m+=`. Holidays imported: ${e.formatImportResult(u)}.`),o&&(m+=" Calendar is read-only."),e.setFlash("success",m)}catch(d){e.state.createCalModalOpen=!0,e.setFlash("error",d instanceof Error?d.message:"Create failed")}finally{e.state.busy=!1,e.render()}}function Vn(e){const t=e.root.querySelector('[data-form="create-cal"]');if(!t)return;const a=t.querySelector('input[name="holidays"]'),s=t.querySelector("#holidays-country-wrap"),n=t.querySelector('input[name="displayname"]'),i=t.querySelector('input[name="readOnly"]');if(!a||!s)return;const r=a.checked;s.hidden=!r,n&&(n.required=!r,r&&!n.value.trim()?n.placeholder="Auto: Holidays (XX)":r||(n.placeholder="Work")),r&&i&&(i.checked=!0)}function _i(e){Vn(e)}function ja(e){const{state:t}=e,a=t.calendars.filter(f=>f.canShare),s=t.calendars.filter(f=>!f.canShare),n=t.calendars.find(f=>f.id===t.selectedId)??null,i=a.map(f=>{const v=t.selectedIds.includes(f.id),S=v?" is-selected":"",h=f.id===t.selectedId?" is-primary":"",E=f.color?`<span class="cal-swatch" style="background:${c(f.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',y=e.accessBadge(f.access)+(f.readOnly?'<span class="badge">read-only</span>':"")+(f.holidaysCountry?`<span class="badge badge-admin">holidays ${c(f.holidaysCountry)}</span>`:"");return`<div class="cal-row${S}${h}" data-action="select-cal" data-id="${f.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${f.id}" ${v?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${E}
        <span class="cal-row-text">
          <span class="cal-row-title">${c(f.displayname)}</span>
          <span class="cal-row-badges">${y}</span>
          <span class="muted small mono cal-row-uri">${c(f.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${f.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${f.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${f.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`}).join(""),r=s.map(f=>{const v=t.selectedIds.includes(f.id),S=v?" is-selected":"",h=f.id===t.selectedId?" is-primary":"",E=f.color?`<span class="cal-swatch" style="background:${c(f.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',y=f.access==="readwrite"?"Shared with you · full access — check to show events; click to set as primary for new events":"Shared with you · read-only — check to show events";return`<div class="cal-row${S}${h}" data-action="select-cal" data-id="${f.id}" role="button" tabindex="0" title="${c(y)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${f.id}" ${v?"checked":""} ${t.busy?"disabled":""} />
        </label>
        ${E}
        <span class="cal-row-text">
          <span class="cal-row-title">${c(f.displayname)}</span>
          <span class="cal-row-badges">${e.accessBadge(f.access)}</span>
          <span class="muted small">${f.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${f.id}" ${t.busy?"disabled":""} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(""),l=t.directory.map(f=>`<option value="${c(f.username)}">${c(f.displayname)} (${c(f.username)})</option>`).join(""),o=t.shares.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':t.shares.map(f=>`<tr>
              <td>
                <strong>${c(f.displayname||f.username||f.href)}</strong>
                <div class="muted small mono">${c(f.username||f.href)}</div>
              </td>
              <td>${e.accessBadge(f.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${c(f.href)}" ${t.busy?"disabled":""}>Revoke</button>
              </td>
            </tr>`).join(""),d=n!=null&&n.color&&n.color.length>=7?n.color.slice(0,7):"#3B82F6",m=!!(n&&n.readOnly),u=t.calModalOpen&&n&&n.canShare?_({id:"cal-edit-modal",title:"Calendar details",titleId:"cal-modal-title",closeAction:"close-cal-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${c(n.uri)}
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
                      value="${c(n.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${c(d)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${c(n.color||d)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${c(n.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${c(n.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${H(`Share “${n.displayname}”`,"share")}
                ${m?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                <form class="form-grid" data-form="share" style="margin-top:1rem">
                  <label>
                    User
                    <select name="username" required ${t.directory.length===0?"disabled":""}>
                      <option value="">${t.directory.length?"Select user…":"No other users"}</option>
                      ${l}
                    </select>
                  </label>
                  <label>
                    Access
                    <select name="access" ${m?"disabled":""}>
                      <option value="read" selected>Read only</option>
                      ${m?"":'<option value="readwrite">Full access</option>'}
                    </select>
                    ${m?'<input type="hidden" name="access" value="read" />':""}
                  </label>
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" ${t.busy||t.directory.length===0?"disabled":""}>Share</button>
                  </div>
                </form>
                <div class="table-wrap" style="margin-top:1.25rem">
                  <table>
                    <thead>
                      <tr><th>Shared with</th><th>Access</th><th></th></tr>
                    </thead>
                    <tbody>${o}</tbody>
                  </table>
                </div>
              </section>
              <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${H("Import / export","import-export")}
                ${n.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${t.busy?"disabled":""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${t.busy||n.readOnly?"aria-disabled=true":""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${t.busy||n.readOnly?"disabled":""} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:"Close",action:"close-cal-modal",variant:"ghost"}]}):"",b=t.deleteConfirmId!==null?t.calendars.find(f=>f.id===t.deleteConfirmId&&f.canShare)??null:null,p=b?_({id:"cal-delete-modal",title:"Delete calendar",titleId:"cal-delete-title",closeAction:"cancel-delete-cal",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${c(b.displayname)}</strong>
              <span class="muted small mono">(${c(b.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${wt({action:"toggle-delete-confirm",label:"I understand and want to permanently delete this calendar",id:"delete-cal-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-cal",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-cal",variant:"danger",disabled:!0,id:"delete-cal-submit",attrs:`data-id="${b.id}"`}]}):"",g=t.createCalModalOpen?_({id:"cal-create-modal",title:"Add calendar",titleId:"cal-create-title",closeAction:"close-create-cal-modal",body:`
            ${e.renderFlashBanner()}
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
                  ${t.holidayCountries.map(f=>`<option value="${c(f.code)}">${c(f.name)} (${c(f.code)})</option>`).join("")}
                </select>
              </label>
              <label class="checkbox">
                <input type="checkbox" name="readOnly" />
                Read-only (for everyone)
              </label>
              <div class="form-actions-row form-actions-wrap">
                <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Create calendar</button>
                <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${t.busy?"disabled":""} hidden />
                </label>
                <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${t.busy?"disabled":""}>Cancel</button>
              </div>
              <p class="muted small" style="margin:0.5rem 0 0">
                <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
              </p>
            </form>`}):"";return`
    <div class="portal-grid portal-grid-calendars">
      <aside class="calendars-sidebar">
        <section class="card calendars-sidebar-card">
          <div class="calendars-sidebar-head">
            ${H("Owned","owned")}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${i||'<p class="muted">No calendars yet. Create one below.</p>'}
            ${s.length?`<div class="calendars-shared-block">
                     ${H("Shared with me","shared-with-me")}
                     <div class="cal-list" style="margin-top:0.75rem">${r}</div>
                   </div>`:""}
          </div>
          <div class="calendars-sidebar-create">
            <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${t.busy?"disabled":""}>Create calendar</button>
          </div>
        </section>
      </aside>
      ${e.renderMonthGrid()}
    </div>
    ${g}
    ${u}
    ${p}
    ${e.renderEventModal()}`}function ze(e){if(!e.state.editingContact)return;const t=e.root.querySelector('[data-form="contact"]');if(!t)return;const a=new FormData(t);e.state.editingContact.firstname=String(a.get("firstname")??""),e.state.editingContact.lastname=String(a.get("lastname")??""),e.state.editingContact.fullname=String(a.get("fullname")??""),e.state.editingContact.org=String(a.get("org")??""),e.state.editingContact.title=String(a.get("title")??""),e.state.editingContact.url=String(a.get("url")??""),e.state.editingContact.note=String(a.get("note")??"");const s=String(a.get("birthday")??"").trim();e.state.editingContact.birthday=s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null,e.state.editingContact.address={street:String(a.get("street")??""),city:String(a.get("city")??""),region:String(a.get("region")??""),postal:String(a.get("postal")??""),country:String(a.get("country")??"")};const n=[];let i=0;for(;a.has(`email_${i}`);)n.push(String(a.get(`email_${i}`)??"")),i++;n.length&&(e.state.editingContact.emails=n);const r=[];for(i=0;a.has(`phone_value_${i}`);)r.push({type:String(a.get(`phone_type_${i}`)??"other"),value:String(a.get(`phone_value_${i}`)??"")}),i++;r.length&&(e.state.editingContact.phones=r);const l=[];for(i=0;a.has(`custom_label_${i}`)||a.has(`custom_value_${i}`);)l.push({label:String(a.get(`custom_label_${i}`)??""),value:String(a.get(`custom_value_${i}`)??"")}),i++;e.state.editingContact.custom=l}function Ri(e,t){const a=new FormData(t),s=[];let n=0;for(;a.has(`email_${n}`);){const o=String(a.get(`email_${n}`)??"").trim();o&&s.push(o),n++}const i=[];for(n=0;a.has(`phone_value_${n}`);){const o=String(a.get(`phone_value_${n}`)??"").trim();o&&i.push({type:String(a.get(`phone_type_${n}`)??"other"),value:o}),n++}const r=[];for(n=0;a.has(`custom_label_${n}`)||a.has(`custom_value_${n}`);){const o=String(a.get(`custom_label_${n}`)??"").trim(),d=String(a.get(`custom_value_${n}`)??"").trim();(o||d)&&r.push({label:o,value:d}),n++}const l={firstname:String(a.get("firstname")??"").trim(),lastname:String(a.get("lastname")??"").trim(),fullname:String(a.get("fullname")??"").trim(),org:String(a.get("org")??"").trim(),title:String(a.get("title")??"").trim(),emails:s,phones:i,address:{street:String(a.get("street")??"").trim(),city:String(a.get("city")??"").trim(),region:String(a.get("region")??"").trim(),postal:String(a.get("postal")??"").trim(),country:String(a.get("country")??"").trim()},url:String(a.get("url")??"").trim(),note:String(a.get("note")??"").trim(),birthday:(()=>{const o=String(a.get("birthday")??"").trim();return o&&/^\d{4}-\d{2}-\d{2}/.test(o)?o.slice(0,10):null})(),custom:r};return e.state.removePhotoPending?l.removePhoto=!0:e.state.photoBase64Pending&&(l.photoBase64=e.state.photoBase64Pending),l}function ie(e){const{state:t,root:a}=e,s=a.querySelector('[data-form="edit-event"]');s&&t.editingEvent&&e.syncEditingEventFromForm(s);const n=a.querySelector('[data-form="task"]');n&&t.editingTask&&e.syncEditingTaskFromForm(n);const i=a.querySelector('[data-form="note"]');i&&t.editingNote&&e.syncEditingNoteFromForm(i),t.editingContact&&ze(e.contactsHost)}async function qi(e,t,a,s){var d,m,u,b;const{state:n,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="toggle-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p))return!0;s.stopPropagation(),e.toggleCalendarSelected(p),n.calendarSelectionSeeded=!0,n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(g){l("error",g instanceof Error?g.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="select-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p))return!0;n.selectedIds.includes(p)||(n.selectedIds=[...n.selectedIds,p]),n.selectedId=p,n.calendarSelectionSeeded=!0,Ye(n),n.busy=!0,o(),r();try{await e.loadMonthEvents()}catch(g){l("error",g instanceof Error?g.message:"Failed to load calendar")}finally{n.busy=!1,r()}return!0}if(t==="edit-cal"){const p=Number(a.dataset.id);if(!Number.isFinite(p)||!n.calendars.find(f=>f.id===p&&f.canShare))return!0;n.selectedId=p,n.selectedIds.includes(p)||(n.selectedIds=[...n.selectedIds,p]),Ye(n),n.calModalOpen=!0,n.deleteConfirmId=null,n.busy=!0,o(),r();try{await e.loadShares(p),await e.loadMonthEvents()}catch(f){l("error",f instanceof Error?f.message:"Failed to open calendar")}finally{n.busy=!1,r()}return!0}if(t==="close-cal-modal")return n.calModalOpen=!1,r(),!0;if(t==="open-create-cal-modal")return n.createCalModalOpen=!0,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0;if(t==="close-create-cal-modal")return n.createCalModalOpen=!1,o(),r(),!0;if(t==="delete-cal"){const p=Number(a.dataset.id);return!Number.isFinite(p)||!n.calendars.find(f=>f.id===p&&f.canShare)||(n.deleteConfirmId=p,n.calModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-cal")return n.deleteConfirmId=null,r(),!0;if(t==="confirm-delete-cal"){const p=Number(a.dataset.id),g=i.querySelector("#delete-cal-confirm");if(!Number.isFinite(p)||!(g!=null&&g.checked))return!0;n.busy=!0,o(),r();try{if(await D.deleteCalendar(p),n.selectedId===p&&(n.selectedId=null),n.selectedIds=n.selectedIds.filter(f=>f!==p),n.deleteConfirmId=null,n.calModalOpen=!1,n.shares=[],n.monthEvents=[],await e.loadHome(),n.selectedId===null){const f=e.pickDefaultCalendar();f?(n.selectedId=f.id,n.selectedIds.includes(f.id)||(n.selectedIds=[...n.selectedIds,f.id]),await e.loadMonthEvents()):n.selectedIds.length>0&&(n.selectedId=n.selectedIds[0],await e.loadMonthEvents())}l("success","Calendar deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="cal-view"){const p=a.dataset.view;if(p!=="month"&&p!=="week"&&p!=="agenda")return!0;n.calView=p,Ye(n),n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="month-today"){const p=new Date;n.monthCursor={y:p.getFullYear(),m:p.getMonth()},n.calFocusDay=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`,n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="month-prev"||t==="month-next"){const p=t==="month-prev"?-1:1,g=n.calView;if(g==="week"){const f=$t(n.calFocusDay)??new Date;f.setDate(f.getDate()+p*7),n.calFocusDay=U(f),n.monthCursor={y:f.getFullYear(),m:f.getMonth()}}else if(g==="agenda"){const f=$t(n.calFocusDay)??new Date;f.setDate(f.getDate()+p*7),n.calFocusDay=U(f),n.monthCursor={y:f.getFullYear(),m:f.getMonth()}}else{const f=new Date(n.monthCursor.y,n.monthCursor.m+p,1);n.monthCursor={y:f.getFullYear(),m:f.getMonth()},n.calFocusDay=U(f)}n.monthExpandDay=null,n.busy=!0,r();try{await e.loadMonthEvents()}finally{n.busy=!1,r()}return!0}if(t==="open-event"){s.stopPropagation();const p=Number(a.dataset.instance),g=a.dataset.uri??"";if(!Number.isFinite(p)||!g)return!0;n.busy=!0,o(),r();try{const f=await D.getEvent(p,g);n.editingEvent={...f.event,repeat:f.event.repeat??e.defaultRepeat()},n.creatingEvent=!1,n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null}catch(f){l("error",f instanceof Error?f.message:"Failed to open event")}finally{n.busy=!1,r()}return!0}if(t==="open-event-day"){s.stopPropagation();const p=a.dataset.day??"";return n.monthExpandDay=n.monthExpandDay===p?null:p,r(),!0}if(t==="new-event-day"){const p=s.target;if((d=p==null?void 0:p.closest)!=null&&d.call(p,".month-event, .month-event-more"))return!0;const g=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(g))return!0;if(n.selectedId===null)return l("error","Select a calendar first"),r(),!0;const f=n.calendars.find(v=>v.id===n.selectedId);return!f||f.readOnly||!(f.canShare||f.access==="readwrite")?(l("error","This calendar is read-only"),r(),!0):(n.creatingEvent=!0,n.editingEvent=e.blankEventForDay(g,n.selectedId),n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0)}if(t==="new-event-slot"){const p=s.target;if((m=p==null?void 0:p.closest)!=null&&m.call(p,".week-event"))return!0;const g=a.dataset.day??"",f=Number(a.dataset.hour);if(!/^\d{4}-\d{2}-\d{2}$/.test(g)||!Number.isInteger(f)||f<0||f>23)return!0;if(n.selectedId===null)return l("error","Select a calendar first"),r(),!0;const v=n.calendars.find(S=>S.id===n.selectedId);return!v||v.readOnly||!(v.canShare||v.access==="readwrite")?(l("error","This calendar is read-only"),r(),!0):(n.creatingEvent=!0,n.editingEvent=e.blankEventForSlot(g,f,n.selectedId),n.eventModalOpen=!0,n.eventDtPicker=null,n.calModalOpen=!1,n.deleteConfirmId=null,o(),r(),!0)}if(t==="close-event-modal")return n.eventModalOpen=!1,n.editingEvent=null,n.creatingEvent=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="dt-open"){const p=a.dataset.dtField||"";if(!p)return!0;if(ie(e),((u=n.eventDtPicker)==null?void 0:u.field)===p)n.eventDtPicker=null;else{const g=a.dataset.dtDateOnly==="1",f=a.dataset.dtClear!=="0",v=a.dataset.dtName||p;let S=e.getDtFieldCurrentValue(p);!S&&(p==="due"||p==="dtstart"||p==="bulk-due")&&(S=Ke().start);const h=Ee(S||U(new Date)),[E,y]=h.date.split("-").map(Number);n.eventDtPicker={field:p,viewY:E,viewM:(y||1)-1,dateOnly:g,allowClear:f,name:v}}return r(),!0}if(t==="dt-month-prev"||t==="dt-month-next"){if(!n.eventDtPicker)return!0;ie(e);const p=t==="dt-month-prev"?-1:1,g=new Date(n.eventDtPicker.viewY,n.eventDtPicker.viewM+p,1);return n.eventDtPicker={...n.eventDtPicker,viewY:g.getFullYear(),viewM:g.getMonth()},r(),!0}if(t==="dt-set-month"){if(!n.eventDtPicker)return!0;ie(e);const g=Number(a.value);return!Number.isFinite(g)||g<0||g>11||(n.eventDtPicker={...n.eventDtPicker,viewM:g},r()),!0}if(t==="dt-set-year"){if(!n.eventDtPicker)return!0;ie(e);const g=Number(a.value);return!Number.isFinite(g)||g<1||g>9999||(n.eventDtPicker={...n.eventDtPicker,viewY:g},r()),!0}if(t==="dt-pick-day"){if(!n.eventDtPicker)return!0;const p=n.eventDtPicker.field,g=a.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(g))return!0;ie(e);const f=n.eventDtPicker.dateOnly;if(f)e.setDtFieldValue(p,g),n.eventDtPicker=null;else{const v=e.getDtFieldCurrentValue(p),S=Ee(v||Ke(g).start).hm;e.setDtFieldValue(p,`${g}T${S}`),n.eventDtPicker={...n.eventDtPicker,viewY:Number(g.slice(0,4)),viewM:Number(g.slice(5,7))-1}}if(p==="start"&&n.editingEvent&&!f&&n.editingEvent.end){const v=new Date(String(n.editingEvent.start)),S=new Date(String(n.editingEvent.end));!Number.isNaN(v.getTime())&&!Number.isNaN(S.getTime())&&S<=v&&e.setDtFieldValue("end",ee(new Date(v.getTime()+3600*1e3)))}return r(),!0}if(t==="dt-pick-time"){if(!n.eventDtPicker||n.eventDtPicker.dateOnly)return!0;const p=n.eventDtPicker.field,g=a.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(g))return!0;ie(e);const f=e.getDtFieldCurrentValue(p)||Ke().start,S=`${Ee(f).date}T${g}`;if(e.setDtFieldValue(p,S),p==="start"&&n.editingEvent){n.editingEvent={...n.editingEvent,allDay:!1};const h=n.editingEvent.end?Ee(String(n.editingEvent.end)):null,E=new Date(S);(!h||new Date(`${h.date}T${h.hm}`)<=E)&&e.setDtFieldValue("end",ee(new Date(E.getTime()+3600*1e3)))}return n.eventDtPicker=null,r(),!0}if(t==="dt-today"){if(!n.eventDtPicker)return!0;const p=n.eventDtPicker.field;ie(e);const g=U(new Date);if(n.eventDtPicker.dateOnly)e.setDtFieldValue(p,g);else{const f=Ke(g);p==="start"?(e.setDtFieldValue("start",f.start),n.editingEvent&&!n.editingEvent.end&&e.setDtFieldValue("end",f.end)):p==="end"?e.setDtFieldValue("end",f.end):e.setDtFieldValue(p,f.start)}return n.eventDtPicker=null,r(),!0}if(t==="dt-clear"){if(!n.eventDtPicker||!n.eventDtPicker.allowClear)return!0;const p=n.eventDtPicker.field;return ie(e),e.setDtFieldValue(p,null),n.eventDtPicker=null,r(),!0}if(t==="event-allday-toggle"){if(!n.editingEvent)return!0;const p=i.querySelector('[data-form="edit-event"]'),g=a.checked;if(p){const f=new FormData(p),v=String(f.get("start")??n.editingEvent.start??""),S=String(f.get("end")??n.editingEvent.end??"")||null;let h=v,E=S;if(g){const y=ui(v,S);h=y.start,E=y.end}else{const y=v.slice(0,10),w=(S||v).slice(0,10),F=ga(y,w);h=F.start,E=F.end}n.editingEvent={...n.editingEvent,summary:String(f.get("summary")??n.editingEvent.summary),description:String(f.get("description")??n.editingEvent.description),location:String(f.get("location")??n.editingEvent.location),instanceId:Number(f.get("instanceId"))||n.editingEvent.instanceId,allDay:g,start:h,end:E,repeat:Qe(f)}}else n.editingEvent={...n.editingEvent,allDay:g};return n.eventDtPicker=null,r(),!0}if(t==="event-repeat-freq"||t==="event-repeat-end"){if(!n.editingEvent)return!0;const p=i.querySelector('[data-form="edit-event"]');if(!p)return!0;const g=new FormData(p),f=p.querySelector('input[name="allDay"]'),v=Qe(g);return n.editingEvent={...n.editingEvent,summary:String(g.get("summary")??n.editingEvent.summary),description:String(g.get("description")??n.editingEvent.description),location:String(g.get("location")??n.editingEvent.location),instanceId:Number(g.get("instanceId"))||n.editingEvent.instanceId,allDay:(f==null?void 0:f.checked)??n.editingEvent.allDay,start:String(g.get("start")??n.editingEvent.start??""),end:String(g.get("end")??n.editingEvent.end??"")||null,repeat:v,hasRrule:!!String(g.get("repeatFreq")??"").trim()},v.freq&&v.endMode==="until"&&((b=n.eventDtPicker)==null?void 0:b.field)==="end"&&(n.eventDtPicker=null),r(),!0}if(t==="delete-event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return!0;const p=String(n.editingEvent.summary||"this event").trim()||"this event";return n.confirmDelete={scope:"event",title:"Delete event",message:`Delete “${p}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="revoke"){const p=a.dataset.href??"";return!p||n.selectedId===null||(n.confirmDelete={scope:"revoke-share",title:"Revoke share",message:"Revoke access for this user?",detail:"They will lose this calendar until you share it again.",href:p},r()),!0}if(t==="export-cal"){s.stopPropagation();const p=a.dataset.id,g=p!==void 0&&p!==""?Number(p):n.selectedId;if(g===null||Number.isNaN(g))return!0;n.busy=!0,o(),r();try{const{blob:f,filename:v}=await D.exportCalendar(g),S=await e.saveBlobAsFile(f,v);S==="cancelled"?l("info","Export cancelled"):S==="saved"?l("success",`Saved ${v}`):l("success",`Download started: ${v}`)}catch(f){l("error",f instanceof Error?f.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}function R(e,t){return`${e}|${t}`}async function et(e){const t=await D.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars;const a=new Set(t.notes.map(s=>R(s.instanceId,s.uri)));e.state.checkedNoteKeys=e.state.checkedNoteKeys.filter(s=>a.has(s)),e.state.selectedNoteKey!==null&&!e.state.notes.some(s=>`${s.instanceId}|${s.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null))}function Sa(e){const t=e.extra?`<span class="muted small selection-count-extra">${e.extra}</span>`:"";return`<div class="selection-toolbar" role="toolbar" aria-label="Selected items">
    <span class="selection-count"><strong>${e.count}</strong> selected${t}</span>
    <button type="button" class="btn btn-ghost btn-small" data-action="${c(e.clearAction)}" ${e.busy?"disabled":""}>Clear</button>
    ${e.actionsHtml}
  </div>`}const Bi=new Set(["P","BR","STRONG","B","EM","I","U","UL","OL","LI","H2","H3","A","BLOCKQUOTE","DIV","SPAN"]);function Hi(e){return/<[a-z][\s\S]*>/i.test(e)}function Vi(e){return e.replace(/<\/(p|div|h2|h3|li|blockquote)>/gi,`
`).replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/\s+\n/g,`
`).replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).trim()}function Se(e){if(!e)return"";if(!Hi(e))return e;if(typeof DOMParser>"u")return e.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/on\w+\s*=/gi,"");const a=new DOMParser().parseFromString(`<div id="n">${e}</div>`,"text/html").getElementById("n");if(!a)return"";const s=n=>{var r;const i=[...n.childNodes];for(const l of i)if(l.nodeType===1){const o=l,d=o.tagName;if(!Bi.has(d)){const m=o.parentNode;if(m){for(;o.firstChild;)m.insertBefore(o.firstChild,o);m.removeChild(o)}continue}for(const m of[...o.attributes]){const u=m.name.toLowerCase();if(u.startsWith("on")||u==="style")o.removeAttribute(m.name);else if(d==="A"&&u==="href"){const b=m.value.trim();/^(https?:|mailto:|#)/i.test(b)||o.removeAttribute("href")}else d==="A"&&(u==="href"||u==="target"||u==="rel")||o.removeAttribute(m.name)}d==="A"&&(o.setAttribute("rel","noopener noreferrer"),o.setAttribute("target","_blank")),s(o)}else l.nodeType!==3&&((r=l.parentNode)==null||r.removeChild(l))};return s(a),a.innerHTML}function Ki(e,t){const a=Se(e);return`<div class="note-editor">
      ${t?"":`<div class="note-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h2" title="Heading">H</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="createLink" title="Link">Link</button>
      </div>`}
      <div class="note-editor-body" data-note-editor="1" ${t?'contenteditable="false"':'contenteditable="true" role="textbox" aria-label="Note body" aria-multiline="true"'}
        >${a}</div>
      <textarea name="description" hidden>${c(e)}</textarea>
    </div>`}function ji(e){const t=e.root.querySelector("[data-note-editor]"),a=e.root.querySelector('textarea[name="description"]');if(!t||!a)return;const s=()=>{a.value=Se(t.innerHTML)};t.addEventListener("input",s),t.addEventListener("blur",s);const n=e.root.querySelector(".note-editor-toolbar");n==null||n.addEventListener("mousedown",i=>{var r,l;(l=(r=i.target)==null?void 0:r.closest)!=null&&l.call(r,"[data-action='note-fmt']")&&i.preventDefault()})}function zi(e,t){const a=document.querySelector("[data-note-editor]");if(!a||a.getAttribute("contenteditable")!=="true")return;if(a.focus(),e==="createLink"){const n=window.prompt("Link URL","https://");if(!n)return;document.execCommand("createLink",!1,n)}else e==="formatBlock"?document.execCommand("formatBlock",!1,t||"h2"):document.execCommand(e,!1,t);const s=document.querySelector('textarea[name="description"]');s&&(s.value=Se(a.innerHTML))}function Wi(e){const t=e.state.notes.filter(u=>u.canWrite&&!u.readOnly).map(u=>R(u.instanceId,u.uri)),a=e.state.checkedNoteKeys.filter(u=>t.includes(u)).length,s=t.length>0&&t.every(u=>e.state.checkedNoteKeys.includes(u)),n=e.state.checkedNoteKeys.length>0&&!s,i=e.state.checkedNoteKeys.length-a,r=e.state.checkedNoteKeys.length>0?Sa({count:a,extra:i>0?`(${i} read-only skipped)`:void 0,busy:e.state.busy,clearAction:"note-clear-selection",actionsHtml:`
            <button type="button" class="btn btn-ghost btn-small" data-action="note-bulk-copy" ${e.state.busy||a===0?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-small btn-danger" data-action="note-bulk-delete" ${e.state.busy||a===0?"disabled":""}>Delete</button>`}):`<button type="button" class="btn btn-primary" data-action="new-note" ${e.state.busy||e.state.noteCalendars.length===0?"disabled":""}>Add note</button>`,l=e.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${e.state.noteSearch?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:e.state.notes.map(u=>{const b=R(u.instanceId,u.uri),p=!e.state.creatingNote&&b===e.state.selectedNoteKey?" is-selected":"",g=e.state.checkedNoteKeys.includes(b),f=u.canWrite&&!u.readOnly,v=Vi(u.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${p}${g?" is-checked":""}" data-action="select-note" data-instance="${u.instanceId}" data-uri="${c(u.uri)}" tabindex="0" role="button">
              <td class="contact-col-check" data-stop-row>
                <input type="checkbox" class="row-check" data-action="note-check" data-instance="${u.instanceId}" data-uri="${c(u.uri)}"
                  ${g?"checked":""} ${f?"":"disabled"} aria-label="Select ${c(u.summary||u.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-note-title">
                <span class="contact-name-primary">${c(u.summary||u.uri)}</span>
                ${v?`<span class="muted small contact-name-secondary">${c(v)}${u.description.length>80?"…":""}</span>`:""}
                ${u.readOnly?'<span class="badge">read-only</span>':""}
              </td>
              <td class="col-note-date muted small">${c(kn(u.dtstart))}</td>
              <td class="col-note-cal muted small">${c(u.calendarName)}</td>
            </tr>`}).join(""),o=e.state.editingNote,d=e.state.noteCalendars.map(u=>`<option value="${u.id}" ${o&&o.instanceId===u.id?"selected":""}>${c(u.displayname)}</option>`).join(""),m=o?`<div class="card">
          ${H(e.state.creatingNote?"New note":"Edit note","notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${e.state.creatingNote?`<label>Calendar
                    <select name="instanceId" required ${e.state.noteCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.noteCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${d}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${c(o.calendarName)}</strong>${o.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(o.summary)}" ${o.readOnly&&!e.state.creatingNote?"readonly":""} />
            </label>
            ${e.renderPortalDateTimeField({field:"dtstart",name:"dtstart",label:"Date",value:Ue(o.dtstart),dateOnly:!1,disabled:!!(o.readOnly&&!e.state.creatingNote),allowClear:!0})}
            <label>Body
              ${Ki(o.description,!!(o.readOnly&&!e.state.creatingNote))}
            </label>
            <div class="form-actions-row">
              ${e.state.creatingNote||o.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingNote?"Create note":"Save note"}</button>`:""}
              ${!e.state.creatingNote&&o.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingNote?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${H("Notes","notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(e.state.noteSearch)}" aria-label="Search notes" ${e.state.busy?"disabled":""} />
        ${r}
      </div>
      ${e.state.noteCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="contact-col-check">
                <input type="checkbox" data-action="note-select-all" aria-label="Select all writable notes"
                  ${s?"checked":""}
                  ${n?"data-indeterminate=1":""}
                  ${t.length===0||e.state.busy?"disabled":""} />
              </th>
              ${Y("Title","summary",e.state.noteSort,e.state.noteOrder,"note","col-note-title")}
              ${Y("Date","dtstart",e.state.noteSort,e.state.noteOrder,"note","col-note-date")}
              ${Y("Calendar","calendar",e.state.noteSort,e.state.noteOrder,"note","col-note-cal")}
            </tr>
          </thead>
          <tbody>${l}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${m}
    </section>
  </div>`}function Yi(e,t){if(!e.state.editingNote)return;const a=t.querySelector("[data-note-editor]"),s=t.querySelector('textarea[name="description"]');a&&s&&(s.value=Se(a.innerHTML));const n=new FormData(t),i=String(n.get("dtstart")??"").trim(),r=n.get("instanceId"),l=r!==null&&String(r)!==""?Number(r):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(l)&&l>0?l:e.state.editingNote.instanceId,summary:String(n.get("summary")??e.state.editingNote.summary),description:Se(String(n.get("description")??e.state.editingNote.description)),dtstart:i?new Date(i).toISOString():null}}async function Kn(e,t){const a=e.state.notes.filter(n=>n.canWrite&&!n.readOnly&&e.state.checkedNoteKeys.includes(R(n.instanceId,n.uri)));if(a.length===0){e.setFlash("error","No writable notes selected"),e.render();return}const s=a.map(n=>({instanceId:n.instanceId,uri:n.uri}));e.state.busy=!0,e.clearFlash(),e.render();try{const n=await D.bulkNotes({op:t,items:s}),i=new Set(a.map(r=>R(r.instanceId,r.uri)));t==="delete"&&(e.state.checkedNoteKeys=[],e.state.selectedNoteKey&&i.has(e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.editingNote=null,e.state.creatingNote=!1)),await et(e),n.failed>0?e.setFlash("error",`${t==="copy"?"Copied":"Deleted"} ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):e.setFlash("success",t==="copy"?`Copied ${n.ok} note${n.ok===1?"":"s"}`:`Deleted ${n.ok} note${n.ok===1?"":"s"}`)}catch(n){e.setFlash("error",n instanceof Error?n.message:"Bulk action failed")}finally{e.state.busy=!1,e.render()}}async function Ji(e,t){const a=t.querySelector("[data-note-editor]"),s=t.querySelector('textarea[name="description"]');a&&s&&(s.value=Se(a.innerHTML));const n=new FormData(t),i=String(n.get("summary")??"").trim(),r=Se(String(n.get("description")??"").trim()),l=String(n.get("dtstart")??"").trim(),o=l?new Date(l).toISOString():null;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){const d=Number(n.get("instanceId"));if(!Number.isFinite(d)||d<=0)throw new Error("Select a calendar");const m=await D.createNote({instanceId:d,summary:i,description:r,dtstart:o});e.state.creatingNote=!1,e.state.selectedNoteKey=R(m.note.instanceId,m.note.uri),e.state.editingNote=m.note,e.setFlash("success",me("Note",m.note.summary||i,"created"))}else if(e.state.editingNote){const d=await D.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:i,description:r,dtstart:o});e.state.editingNote=d.note,e.state.selectedNoteKey=R(d.note.instanceId,d.note.uri),e.setFlash("success",me("Note",d.note.summary||i,"saved"))}await et(e)}catch(d){e.setFlash("error",d instanceof Error?d.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function Gi(e,t,a,s){var o;const{state:n,render:i,setFlash:r,clearFlash:l}=e;if(t==="note-fmt")return s.preventDefault(),zi(a.dataset.cmd||"",a.dataset.value),!0;if(t==="sort-note"){const d=a.dataset.sort||"";if(!d)return!0;n.noteSort===d?n.noteOrder=n.noteOrder==="asc"?"desc":"asc":(n.noteSort=d,n.noteOrder="asc"),n.busy=!0,i();try{await e.loadNotes()}catch(m){r("error",m instanceof Error?m.message:"Sort failed")}finally{n.busy=!1,i()}return!0}if(t==="note-check"){s.preventDefault(),s.stopPropagation();const d=Number(a.dataset.instance),m=a.dataset.uri??"";if(!Number.isFinite(d)||!m)return!0;const u=e.itemKey(d,m),b=n.notes.find(p=>e.itemKey(p.instanceId,p.uri)===u);return!b||!b.canWrite||b.readOnly||(n.checkedNoteKeys.includes(u)?n.checkedNoteKeys=n.checkedNoteKeys.filter(p=>p!==u):n.checkedNoteKeys=[...n.checkedNoteKeys,u],i()),!0}if(t==="note-select-all"){s.preventDefault();const d=n.notes.filter(u=>u.canWrite&&!u.readOnly),m=d.length>0&&d.every(u=>n.checkedNoteKeys.includes(e.itemKey(u.instanceId,u.uri)));return n.checkedNoteKeys=m?[]:d.map(u=>e.itemKey(u.instanceId,u.uri)),i(),!0}if(t==="note-clear-selection")return n.checkedNoteKeys=[],i(),!0;if(t==="note-bulk-copy")return await Kn(e.notesHost,"copy"),!0;if(t==="note-bulk-delete"){const d=n.notes.filter(m=>m.canWrite&&!m.readOnly&&n.checkedNoteKeys.includes(e.itemKey(m.instanceId,m.uri))).length;return d===0?(r("error","No writable notes selected"),i(),!0):(n.confirmDelete={scope:"bulk-note",title:d===1?"Delete note":`Delete ${d} notes`,message:d===1?"Delete the selected note?":`Delete ${d} selected notes?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0)}if(t==="select-note"){if(s.target.closest("[data-stop-row], .row-check"))return!0;const d=Number(a.dataset.instance),m=a.dataset.uri??"";if(!Number.isFinite(d)||!m)return!0;const u=n.notes.find(b=>b.instanceId===d&&b.uri===m)??null;return n.creatingNote=!1,n.selectedNoteKey=e.itemKey(d,m),n.editingNote=u?{...u}:null,l(),i(),!0}if(t==="new-note")return n.creatingNote=!0,n.selectedNoteKey=null,n.editingNote={uri:"",instanceId:((o=n.noteCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="cancel-note")return n.creatingNote=!1,n.editingNote=null,n.selectedNoteKey=null,i(),!0;if(t==="delete-note"){if(!n.editingNote||n.creatingNote)return!0;const d=String(n.editingNote.summary||"this note").trim()||"this note";return n.confirmDelete={scope:"note",title:"Delete note",message:`Delete “${d}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function Ie(e){const t=await D.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;const a=new Set(e.state.tasks.map(s=>R(s.instanceId,s.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(s=>a.has(s)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(s=>`${s.instanceId}|${s.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null))}function Xi(e,t){const a=new Map;for(const m of t)m.uid&&a.set(m.uid,m);const s=new Map(t.map((m,u)=>[R(m.instanceId,m.uri),u])),n=new Map,i=[];for(const m of t){const u=m.parentUid;if(u&&a.has(u)&&u!==m.uid){const b=n.get(u)??[];b.push(m),n.set(u,b)}else i.push(m)}const r=(m,u)=>(s.get(R(m.instanceId,m.uri))??0)-(s.get(R(u.instanceId,u.uri))??0);i.sort(r);for(const[,m]of n)m.sort(r);const l=[],o=new Set,d=(m,u)=>{const b=m.uid||R(m.instanceId,m.uri);if(!o.has(b)){o.add(b),l.push({task:m,depth:Math.min(u,8)});for(const p of n.get(m.uid)??[])d(p,u+1);o.delete(b)}};for(const m of i)d(m,0);for(const m of t)l.some(u=>u.task===m)||l.push({task:m,depth:0});return l}function Qi(e,t){const a=new Set([t]);if(!t)return a;let s=!0;for(;s;){s=!1;for(const n of e.state.tasks)n.parentUid&&a.has(n.parentUid)&&n.uid&&!a.has(n.uid)&&(a.add(n.uid),s=!0)}return a}function Zi(e,t,a){const s=t.instanceId,n=a||!t.uid?new Set:Qi(e,t.uid),i=e.state.tasks.filter(o=>o.uid&&o.instanceId===s&&!n.has(o.uid)&&o.uid!==t.uid),r=t.parentUid||"",l=['<option value="">None (top-level)</option>',...i.map(o=>`<option value="${c(o.uid)}" ${o.uid===r?"selected":""}>${c(o.summary||o.uid)}</option>`)];if(r&&!i.some(o=>o.uid===r)){const o=e.state.tasks.find(d=>d.uid===r);l.push(`<option value="${c(r)}" selected>${c((o==null?void 0:o.summary)||r)} (current)</option>`)}return l.join("")}function jn(e){const t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(a=>t.has(R(a.instanceId,a.uri))&&a.canWrite&&!a.readOnly)}function el(e){const t=h=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[h]||h,a=Xi(e,e.state.tasks),s=e.state.tasks.filter(h=>h.canWrite&&!h.readOnly).map(h=>R(h.instanceId,h.uri)),n=s.length>0&&s.every(h=>e.state.checkedTaskKeys.includes(h)),i=e.state.checkedTaskKeys.length>0&&!n,l=jn(e).length,o=e.state.tasks.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${e.state.taskSearch?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:a.map(({task:h,depth:E})=>{const y=R(h.instanceId,h.uri),w=!e.state.creatingTask&&y===e.state.selectedTaskKey?" is-selected":"",F=e.state.checkedTaskKeys.includes(y),L=h.status==="COMPLETED"?"badge-ok":h.status==="CANCELLED"?"":"badge-admin",B=E>0?` style="--task-depth:${E}"`:"",N=E>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",k=h.canWrite&&!h.readOnly;return`<tr class="contact-table-row task-row${E>0?" is-subtask":""}${w}${F?" is-checked":""}" data-action="select-task" data-instance="${h.instanceId}" data-uri="${c(h.uri)}" tabindex="0" role="button"${B}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${h.instanceId}" data-uri="${c(h.uri)}"
                  ${F?"checked":""} ${k?"":"disabled"} aria-label="Select ${c(h.summary||h.uri)}" ${e.state.busy?"disabled":""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${N}<span class="contact-name-primary">${c(h.summary||h.uri)}</span></span>
                ${h.readOnly?'<span class="badge">read-only</span>':""}</td>
              <td class="col-task-status"><span class="badge ${L}">${c(t(h.status))}</span></td>
              <td class="col-task-due muted small">${c(kn(h.due))}</td>
              <td class="col-task-cal muted small">${c(h.calendarName)}</td>
              <td class="col-task-pct muted small">${h.percent?c(String(h.percent))+"%":"—"}</td>
            </tr>`}).join(""),d=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,m=(h,E)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${h}"
      title="${c(E)}" aria-label="${c(E)}" ${e.state.busy||l===0?"disabled":""}>${d}</button>`,u=e.state.checkedTaskKeys.length-l,b=e.state.checkedTaskKeys.length>0,p=b?Sa({count:l,extra:u>0?`(${u} read-only skipped)`:void 0,busy:e.state.busy,clearAction:"bulk-task-clear",actionsHtml:`<button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${e.state.busy||l===0?"disabled":""}>Delete</button>`}):`<button type="button" class="btn btn-primary" data-action="new-task" ${e.state.busy||e.state.taskCalendars.length===0?"disabled":""}>Add task</button>`,g=b?`<div class="task-bulk-fields" role="group" aria-label="Edit selected tasks">
        <div class="bulk-group">
          <label class="bulk-field">Status
            <select id="bulk-task-status" ${e.state.busy||l===0?"disabled":""}>
              <option value="">—</option>
              <option value="NEEDS-ACTION">To do</option>
              <option value="IN-PROCESS">In progress</option>
              <option value="COMPLETED">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          ${m("bulk-task-status","Apply status")}
        </div>
        <div class="bulk-group bulk-group-due">
          ${e.renderPortalDateTimeField({field:"bulk-due",name:"bulkDue",label:"Due",value:e.state.bulkDueValue,dateOnly:!1,disabled:e.state.busy||l===0,allowClear:!0})}
          ${m("bulk-task-due","Apply due")}
          <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${e.state.busy||l===0?"disabled":""} title="Clear due date">Clear due</button>
        </div>
        <div class="bulk-group">
          <label class="bulk-field bulk-field-pct">%
            <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${e.state.busy||l===0?"disabled":""} />
          </label>
          ${m("bulk-task-percent","Apply %")}
        </div>
      </div>`:"",f=e.state.editingTask,v=e.state.taskCalendars.map(h=>`<option value="${h.id}" ${f&&f.instanceId===h.id?"selected":""}>${c(h.displayname)}</option>`).join(""),S=f?`<div class="card">
          ${H(e.state.creatingTask?f.parentUid?"New subtask":"New task":"Edit task","tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${e.state.creatingTask?`<label>Calendar
                    <select name="instanceId" required ${e.state.taskCalendars.length===0?"disabled":""}>
                      <option value="">${e.state.taskCalendars.length?"Select calendar…":"No writable calendars"}</option>
                      ${v}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${c(f.calendarName)}</strong>${f.readOnly?" · read-only":""}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(f.summary)}" ${f.readOnly&&!e.state.creatingTask?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${f.readOnly&&!e.state.creatingTask?"readonly":""}>${c(f.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${f.readOnly&&!e.state.creatingTask?"disabled":""}>
                ${Zi(e,f,e.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${f.readOnly&&!e.state.creatingTask?"disabled":""}>
                  ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(h=>`<option value="${h}" ${f.status===h?"selected":""}>${c(t(h))}</option>`).join("")}
                </select>
              </label>
              ${e.renderPortalDateTimeField({field:"due",name:"due",label:"Due",value:Ue(f.due),dateOnly:!1,disabled:!!(f.readOnly&&!e.state.creatingTask),allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${c(String(f.priority||0))}" ${f.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${c(String(f.percent||0))}" ${f.readOnly&&!e.state.creatingTask?"readonly":""} />
              </label>
            </div>
            <div class="form-actions-row">
              ${e.state.creatingTask||f.canWrite?`<button type="submit" class="btn btn-primary" ${e.state.busy?"disabled":""}>${e.state.creatingTask?"Create task":"Save task"}</button>`:""}
              ${!e.state.creatingTask&&f.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${e.state.busy?"disabled":""}>Add subtask</button>
                     <button type="button" class="btn btn-danger" data-action="delete-task" ${e.state.busy?"disabled":""}>Delete</button>`:e.state.creatingTask?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
            </div>
          </form>
        </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${H("Tasks","tasks")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(e.state.taskSearch)}" aria-label="Search tasks" ${e.state.busy?"disabled":""} />
        ${p}
      </div>
      ${g}
      ${e.state.taskCalendars.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-task-check">
                <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                  ${n?"checked":""}
                  ${i?"data-indeterminate=1":""}
                  ${s.length===0||e.state.busy?"disabled":""} />
              </th>
              ${Y("Title","summary",e.state.taskSort,e.state.taskOrder,"task","col-task-title")}
              ${Y("Status","status",e.state.taskSort,e.state.taskOrder,"task","col-task-status")}
              ${Y("Due","due",e.state.taskSort,e.state.taskOrder,"task","col-task-due")}
              ${Y("Calendar","calendar",e.state.taskSort,e.state.taskOrder,"task","col-task-cal")}
              ${Y("%","percent",e.state.taskSort,e.state.taskOrder,"task","col-task-pct")}
            </tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${S}
    </section>
  </div>`}function tl(e,t){if(!e.state.editingTask)return;const a=new FormData(t),s=String(a.get("due")??"").trim(),n=a.get("instanceId"),i=n!==null&&String(n)!==""?Number(n):e.state.editingTask.instanceId,r=String(a.get("parentUid")??"").trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(i)&&i>0?i:e.state.editingTask.instanceId,summary:String(a.get("summary")??e.state.editingTask.summary),description:String(a.get("description")??e.state.editingTask.description),status:String(a.get("status")??e.state.editingTask.status),due:s?new Date(s).toISOString():null,priority:Number(a.get("priority")??e.state.editingTask.priority??0),percent:Number(a.get("percent")??e.state.editingTask.percent??0),parentUid:r===""?null:r}}async function al(e,t){var i,r;const a=jn(e);if(a.length===0){e.setFlash("error","No writable tasks selected"),e.render();return}const s=a.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(t==="bulk-task-delete"){e.state.busy=!0,e.clearFlash(),e.render();try{const l=await D.bulkTasks({op:"delete",items:s});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&a.some(o=>R(o.instanceId,o.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1),await Ie(e),l.failed>0?e.setFlash("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk delete failed")}finally{e.state.busy=!1,e.render()}return}let n={};if(t==="bulk-task-status"){const l=e.root.querySelector("#bulk-task-status"),o=((i=l==null?void 0:l.value)==null?void 0:i.trim())??"";if(!o){e.setFlash("error","Choose a status to apply"),e.render();return}n={status:o}}else if(t==="bulk-task-due"){const l=e.state.bulkDueValue.trim();if(!l){e.setFlash("error","Choose a due date to apply"),e.render();return}const o=/^\d{4}-\d{2}-\d{2}$/.test(l)?new Date(l+"T00:00:00"):new Date((l.length===16,l));if(Number.isNaN(o.getTime())){e.setFlash("error","Invalid due date"),e.render();return}n={due:o.toISOString()}}else if(t==="bulk-task-clear-due")n={due:null};else if(t==="bulk-task-percent"){const l=e.root.querySelector("#bulk-task-percent"),o=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(o===""){e.setFlash("error","Enter a percent complete (0–100)"),e.render();return}const d=Number(o);if(!Number.isFinite(d)||d<0||d>100){e.setFlash("error","Percent must be between 0 and 100"),e.render();return}n={percent:Math.round(d)}}e.state.busy=!0,e.clearFlash(),e.render();try{const l=await D.bulkTasks({op:"update",items:s,fields:n});if(await Ie(e),e.state.editingTask&&!e.state.creatingTask){const d=R(e.state.editingTask.instanceId,e.state.editingTask.uri),m=e.state.tasks.find(u=>R(u.instanceId,u.uri)===d);m&&(e.state.editingTask={...m})}const o=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";l.failed>0?e.setFlash("error",`Updated ${o} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):e.setFlash("success",`Updated ${o} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){e.setFlash("error",l instanceof Error?l.message:"Bulk update failed")}finally{e.state.busy=!1,e.render()}}async function nl(e,t){const a=new FormData(t),s=String(a.get("summary")??"").trim(),n=String(a.get("description")??"").trim(),i=String(a.get("status")??"NEEDS-ACTION"),r=String(a.get("due")??"").trim(),l=r?new Date(r).toISOString():null,o=Number(a.get("priority")??0),d=Number(a.get("percent")??0),m=String(a.get("parentUid")??"").trim(),u=m===""?null:m;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){const b=Number(a.get("instanceId"));if(!Number.isFinite(b)||b<=0)throw new Error("Select a calendar");const p=await D.createTask({instanceId:b,summary:s,description:n,status:i,due:l,priority:o,percent:d,parentUid:u});e.state.creatingTask=!1,e.state.selectedTaskKey=R(p.task.instanceId,p.task.uri),e.state.editingTask=p.task,e.setFlash("success",me(u?"Subtask":"Task",p.task.summary||s,"created"))}else if(e.state.editingTask){const b=await D.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:s,description:n,status:i,due:l,priority:o,percent:d,parentUid:u});e.state.editingTask=b.task,e.state.selectedTaskKey=R(b.task.instanceId,b.task.uri),e.setFlash("success",me("Task",b.task.summary||s,"saved"))}await Ie(e)}catch(b){e.setFlash("error",b instanceof Error?b.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function sl(e,t,a,s){var o;const{state:n,render:i,setFlash:r,clearFlash:l}=e;if(t==="sort-task"){const d=a.dataset.sort||"";if(!d)return!0;n.taskSort===d?n.taskOrder=n.taskOrder==="asc"?"desc":"asc":(n.taskSort=d,n.taskOrder=d==="due"||d==="summary"?"asc":"desc"),n.busy=!0,i();try{await e.loadTasks()}catch(m){r("error",m instanceof Error?m.message:"Sort failed")}finally{n.busy=!1,i()}return!0}if(t==="select-task"){if(s.target.closest("[data-stop-row], .task-check"))return!0;const d=Number(a.dataset.instance),m=a.dataset.uri??"";if(!Number.isFinite(d)||!m)return!0;const u=n.tasks.find(b=>b.instanceId===d&&b.uri===m)??null;return n.creatingTask=!1,n.selectedTaskKey=e.itemKey(d,m),n.editingTask=u?{...u}:null,l(),i(),!0}if(t==="task-check"){s.preventDefault(),s.stopPropagation();const d=Number(a.dataset.instance),m=a.dataset.uri??"";if(!Number.isFinite(d)||!m)return!0;const u=e.itemKey(d,m),b=n.tasks.find(p=>e.itemKey(p.instanceId,p.uri)===u);return!b||!b.canWrite||b.readOnly||(n.checkedTaskKeys.includes(u)?n.checkedTaskKeys=n.checkedTaskKeys.filter(p=>p!==u):n.checkedTaskKeys=[...n.checkedTaskKeys,u],i()),!0}if(t==="task-select-all"){s.preventDefault();const d=n.tasks.filter(u=>u.canWrite&&!u.readOnly);return d.length>0&&d.every(u=>n.checkedTaskKeys.includes(e.itemKey(u.instanceId,u.uri)))?n.checkedTaskKeys=[]:n.checkedTaskKeys=d.map(u=>e.itemKey(u.instanceId,u.uri)),i(),!0}if(t==="bulk-task-clear")return n.checkedTaskKeys=[],i(),!0;if(t==="bulk-task-status"||t==="bulk-task-due"||t==="bulk-task-clear-due"||t==="bulk-task-percent"||t==="bulk-task-delete"){if(t==="bulk-task-delete"){const d=n.checkedTaskKeys.length;return d===0?(r("error","No tasks selected"),i(),!0):(n.confirmDelete={scope:"bulk-task",title:d===1?"Delete task":`Delete ${d} tasks`,message:d===1?"Delete the selected task?":`Delete ${d} selected tasks?`,detail:"CalDAV clients will sync the removal. This cannot be undone.",count:d},i(),!0)}return e.runBulkTaskAction(t),!0}if(t==="new-task")return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:((o=n.taskCalendars[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0;if(t==="new-subtask"){if(!n.editingTask||n.creatingTask||!n.editingTask.uid||!n.editingTask.canWrite)return!0;const d=n.editingTask;return n.creatingTask=!0,n.selectedTaskKey=null,n.editingTask={uri:"",instanceId:d.instanceId,calendarId:d.calendarId,calendarName:d.calendarName,calendarUri:d.calendarUri,uid:"",parentUid:d.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},l(),i(),!0}if(t==="cancel-task")return n.creatingTask=!1,n.editingTask=null,n.selectedTaskKey=null,i(),!0;if(t==="delete-task"){if(!n.editingTask||n.creatingTask)return!0;const d=String(n.editingTask.summary||"this task").trim()||"this task";return n.confirmDelete={scope:"task",title:"Delete task",message:`Delete “${d}”?`,detail:"CalDAV clients will sync the removal. This cannot be undone."},i(),!0}return!1}async function Ft(e,t){const a=await D.contacts(t,e.state.contactSearch);e.state.contacts=a.contacts;const s=new Set(a.contacts.map(n=>n.uri));e.state.checkedContactUris=e.state.checkedContactUris.filter(n=>s.has(n)),e.state.selectedContactUri!==null&&!e.state.contacts.some(n=>n.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function rl(e,t){if(e.state.selectedAbId===null)return;const a=await D.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;const s=a.contact;e.state.editingContact={...s,emails:Array.isArray(s.emails)?s.emails:[],phones:Array.isArray(s.phones)?s.phones:[],custom:Array.isArray(s.custom)?s.custom:[],address:s.address??zn(),birthday:s.birthday??null},e.state.photoPreview=s.photoDataUri??(s.hasPhoto&&e.state.selectedAbId!==null?`${D.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function il(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function zn(e){return{street:"",city:"",region:"",postal:"",country:""}}function ll(e,t){return new Promise((a,s)=>{const n=new FileReader;n.onload=()=>{const i=String(n.result??""),r=i.indexOf(",");a(r>=0?i.slice(r+1):i)},n.onerror=()=>s(new Error("Failed to read photo file")),n.readAsDataURL(t)})}async function ol(e,t){var s;const a=(s=t.files)==null?void 0:s[0];if(t.value="",!!a){if(a.size>2.5*1024*1024){e.setFlash("error","Photo is too large (max ~2 MB)"),e.render();return}try{const n=await ll(e,a);e.state.photoBase64Pending=n,e.state.photoPreview=`data:${a.type||"image/jpeg"};base64,${n}`,e.state.removePhotoPending=!1,e.render()}catch(n){e.setFlash("error",n instanceof Error?n.message:"Failed to read photo"),e.render()}}}async function dl(e,t){var n;if(e.state.selectedAbId===null)return;const a=(n=t.files)==null?void 0:n[0];if(t.value="",!a)return;const s=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:"contacts",fileName:a.name,fileSizeLabel:bt(a.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{const i=await e.readFileTextWithProgress(a,o=>{if(!e.state.importProgress||e.state.importProgress.phase!=="reading")return;e.state.importProgress={...e.state.importProgress,readPercent:o};const d=e.root.querySelector(".import-progress-bar"),m=e.root.querySelector("[data-import-status-line]");d&&o!==null&&(d.classList.remove("is-indeterminate"),d.style.width=`${o}%`),m&&o!==null&&(m.textContent=`Reading file… ${o}%`)});e.setImportPhase("uploading",{readPercent:100}),e.setImportPhase("processing",{processPercent:0}),$.event("import.contacts.start",{file:a.name,bytes:a.size,abId:s});const r=await D.importAddressBook(s,i,o=>{e.applyServerImportProgress(o)}),l=e.formatImportResult(r);await e.loadHome(),e.state.selectedAbId===s&&await Ft(e,s),e.stopImportElapsedTimer(),e.setImportPhase("done",{ok:!0,resultMessage:`${l} (from “${a.name}”)`}),e.setFlash("success",`Import finished for “${a.name}”: ${l}.`)}catch(i){const r=i instanceof Error?i.message:"Import failed";e.stopImportElapsedTimer(),e.setImportPhase("error",{ok:!1,resultMessage:r}),e.setFlash("error",r)}finally{e.state.busy=!1,e.render()}}async function Wn(e,t){if(e.state.selectedAbId===null)return;const a=[...e.state.checkedContactUris];if(a.length===0){e.setFlash("error","No contacts selected"),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{const s=await D.bulkContacts(e.state.selectedAbId,{op:t,uris:a}),n=new Set(a);t==="delete"&&(e.state.checkedContactUris=[],e.state.selectedContactUri&&n.has(e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactModalOpen=!1)),await Ft(e,e.state.selectedAbId),await e.loadHome(),s.failed>0?e.setFlash("error",`${t==="copy"?"Copied":"Deleted"} ${s.ok}, failed ${s.failed}${s.errors[0]?`: ${s.errors[0]}`:""}`):e.setFlash("success",t==="copy"?`Copied ${s.ok} contact${s.ok===1?"":"s"}`:`Deleted ${s.ok} contact${s.ok===1?"":"s"}`)}catch(s){e.setFlash("error",s instanceof Error?s.message:"Bulk action failed")}finally{e.state.busy=!1,e.render()}}async function cl(e,t){if(e.state.selectedAbId===null)return;const a=Ri(e,t),s=xt(a);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){const n=await D.createContact(e.state.selectedAbId,a);e.state.creatingContact=!1,e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",me("Contact",xt(n.contact)||s,"created"))}else if(e.state.selectedContactUri){const n=await D.updateContact(e.state.selectedAbId,e.state.selectedContactUri,a);e.state.selectedContactUri=n.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash("success",me("Contact",xt(n.contact)||s,"saved"))}try{await e.loadHome()}catch(n){if(console.error(n),e.state.selectedAbId!==null)try{await Ft(e,e.state.selectedAbId)}catch{}}}catch(n){e.setFlash("error",n instanceof Error?n.message:"Save failed")}finally{e.state.busy=!1,e.render()}}async function ul(e,t){const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();if(s){e.state.busy=!0,e.clearFlash(),e.render();try{const i=await D.createAddressBook({displayname:s,description:n});e.state.selectedAbId=i.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch="",await e.loadHome(),e.setFlash("success",`Address book “${i.addressbook.displayname}” created`)}catch(i){e.setFlash("error",i instanceof Error?i.message:"Create failed")}finally{e.state.busy=!1,e.render()}}}async function ml(e,t){if(e.state.selectedAbId===null)return;const a=new FormData(t),s=String(a.get("displayname")??"").trim(),n=String(a.get("description")??"").trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await D.updateAddressBook(e.state.selectedAbId,{displayname:s,description:n}),await e.loadHome(),e.setFlash("success",me("Address book",s,"updated"))}catch(i){e.setFlash("error",i instanceof Error?i.message:"Update failed")}finally{e.state.busy=!1,e.render()}}function fl(e){const{state:t}=e,a=t.addressBooks.map(w=>`<div class="cal-row${w.id===t.selectedAbId?" is-selected":""}" data-action="select-ab" data-id="${w.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${c(w.displayname)}</span>
          <span class="muted small">${w.cardCount} contact${w.cardCount===1?"":"s"}</span>
          <span class="muted small mono cal-row-uri">${c(w.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${w.id}" ${t.busy?"disabled":""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${w.id}" ${t.busy?"disabled":""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${w.id}" ${t.busy?"disabled":""}>Delete</button>
        </span>
      </div>`).join(""),s=t.addressBooks.find(w=>w.id===t.selectedAbId)??null,n=t.checkedContactUris.length,i=t.contacts.length>0&&t.contacts.every(w=>t.checkedContactUris.includes(w.uri)),r=n>0&&!i,l=n>0?Sa({count:n,busy:t.busy,clearAction:"contact-clear-selection",actionsHtml:`
            <button type="button" class="btn btn-ghost btn-small" data-action="contact-bulk-copy" ${t.busy?"disabled":""}>Copy</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="contact-bulk-export" ${t.busy?"disabled":""}>Export</button>
            <button type="button" class="btn btn-small btn-danger" data-action="contact-bulk-delete" ${t.busy?"disabled":""}>Delete</button>`}):`<button type="button" class="btn btn-primary" data-action="new-contact" ${t.busy?"disabled":""}>Add contact</button>`,o=t.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="5" class="muted">${t.contactSearch?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:t.contacts.map(w=>{const F=!t.creatingContact&&w.uri===t.selectedContactUri?" is-selected":"",L=t.checkedContactUris.includes(w.uri),B=c((w.displayname||"?").slice(0,1).toUpperCase()),N=w.hasPhoto&&t.selectedAbId!==null?`<img class="contact-avatar" src="${c(D.contactPhotoUrl(t.selectedAbId,w.uri))}" alt="" loading="lazy" data-avatar-fallback="${B}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${B}</span>`;return`<tr class="contact-table-row${F}${L?" is-checked":""}" data-action="select-contact" data-uri="${c(w.uri)}" tabindex="0" role="button">
              <td class="contact-col-check" data-stop-row>
                <input type="checkbox" class="row-check" data-action="contact-check" data-uri="${c(w.uri)}"
                  ${L?"checked":""} aria-label="Select ${c(w.displayname||w.uri)}" ${t.busy?"disabled":""} />
              </td>
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${N}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${c(w.displayname)}</span>
                    ${w.org?`<span class="muted small contact-name-secondary">${c(w.org)}</span>`:""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${c(w.email||"—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${c(w.phone||"—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c(w.org||"—")}</span></td>
            </tr>`}).join(""),d=t.editingContact,m=Array.isArray(d==null?void 0:d.emails)&&d.emails.length>0?d.emails:[""],u=Array.isArray(d==null?void 0:d.phones)&&d.phones.length>0?d.phones:[{type:"cell",value:""}],b=(d==null?void 0:d.address)??e.emptyAddress(),p=m.map((w,F)=>`<div class="multi-row" data-multi="email" data-idx="${F}">
        <input type="email" name="email_${F}" value="${c(w??"")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${F}" ${m.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),g=u.map((w,F)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${F}">
        <select name="phone_type_${F}" aria-label="Phone type">
          ${["cell","work","home","other"].map(L=>`<option value="${L}" ${((w==null?void 0:w.type)??"other")===L?"selected":""}>${L}</option>`).join("")}
        </select>
        <input type="tel" name="phone_value_${F}" value="${c((w==null?void 0:w.value)??"")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${F}" ${u.length<=1?"disabled":""} title="Remove">×</button>
      </div>`).join(""),f=Array.isArray(d==null?void 0:d.custom)?d.custom:[],v=f.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':f.map((w,F)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${F}">
              <input type="text" name="custom_label_${F}" value="${c(w.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${F}" value="${c(w.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${F}" title="Remove">×</button>
            </div>`).join(""),S=t.contactModalOpen&&d&&s?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
          <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
          <div class="cal-modal-card cal-modal-card-wide">
            <header class="cal-modal-header">
              <h3 id="contact-modal-title">${t.creatingContact?"New contact":"Edit contact"}</h3>
              <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${e.renderFlashBanner()}
              <form class="stack" data-form="contact">
                <div class="contact-photo-row">
                  <div class="contact-photo-preview">
                    ${t.photoPreview?`<img src="${c(t.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((d.fullname||d.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      ${t.photoPreview?"Change photo":"Upload photo"}
                      <input type="file" accept="image/*" data-action="contact-photo" ${t.busy?"disabled":""} hidden />
                    </label>
                    ${t.photoPreview||d.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${t.busy?"disabled":""}>Remove photo</button>`:""}
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${c(d.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${c(d.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${c(d.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${c(d.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${c(d.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${p}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${m.length>=10?"disabled":""}>+ Email</button>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend>Phones</legend>
                    ${g}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${u.length>=10?"disabled":""}>+ Phone</button>
                  </fieldset>
                </div>
                <fieldset class="fieldset fieldset-address">
                  <legend>Address</legend>
                  <label>Street
                    <input type="text" name="street" value="${c(b.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${c(b.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${c(b.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${c(b.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${c(b.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${c(d.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${e.renderPortalDateTimeField({field:"birthday",name:"birthday",label:"Birthday",value:d.birthday||"",dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${v}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${f.length>=30?"disabled":""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${c(d.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>${t.creatingContact?"Create contact":"Save contact"}</button>
                  ${!t.creatingContact&&d.uri?`<button type="button" class="btn" data-action="export-contact" ${t.busy?"disabled":""}>Export .vcf</button>`:""}
                  ${t.creatingContact?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${t.busy?"disabled":""}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${t.busy?"disabled":""}>Cancel</button>
                  ${!t.creatingContact&&d.uri?`<span class="muted small mono">${c(d.uri)}</span>`:""}
                </div>
              </form>
            </div>
          </div>
        </div>`:"",h=t.abModalOpen&&s?_({id:"ab-edit-modal",title:"Address book details",titleId:"ab-modal-title",closeAction:"close-ab-modal",body:`
              ${e.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${c(s.uri)} · ${s.cardCount} contact${s.cardCount===1?"":"s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${c(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Save changes</button>
                    <span class="muted small mono">${c(s.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${H("Import / export","contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${t.busy?"disabled":""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${t.busy?"aria-disabled=true":""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${t.busy?"disabled":""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:"Close",action:"close-ab-modal",variant:"ghost"}]}):"",E=t.deleteAbConfirmId!==null?t.addressBooks.find(w=>w.id===t.deleteAbConfirmId)??null:null,y=E?_({id:"ab-delete-modal",title:"Delete address book",titleId:"ab-delete-title",closeAction:"cancel-delete-ab",size:"sm",body:`
            ${e.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${c(E.displayname)}</strong>
              <span class="muted small mono">(${c(E.uri)})</span>.</p>
            <p class="muted small">${(E.cardCount??0)>0?`All ${E.cardCount} contact${E.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
            ${wt({action:"toggle-delete-ab-confirm",label:"I understand and want to permanently delete this address book",id:"delete-ab-confirm",style:"checkbox"})}`,footer:[{label:"Cancel",action:"cancel-delete-ab",variant:"ghost",disabled:t.busy},{label:"Delete permanently",action:"confirm-delete-ab",variant:"danger",disabled:!0,id:"delete-ab-submit",attrs:`data-id="${E.id}"`}]}):"";return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${H("Address books","address-books")}
          </div>
          <div class="cal-list contacts-ab-list">
            ${a||'<p class="muted">No address books yet. Create one below.</p>'}
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
              <button type="submit" class="btn btn-primary" ${t.busy?"disabled":""}>Create</button>
            </form>
          </div>
        </section>
      </aside>
      <section class="contacts-main-col">
        ${s?`<div class="card contacts-main-card">
                <div class="contacts-main-head">
                  ${H("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${c(t.contactSearch)}" aria-label="Search contacts" ${t.busy?"disabled":""} />
                    ${l}
                  </div>
                </div>
                <div class="contacts-table-wrap contacts-table-wrap-tall">
                  <table class="contacts-table">
                    <thead>
                      <tr>
                        <th class="contact-col-check">
                          <input type="checkbox" data-action="contact-select-all" aria-label="Select all contacts"
                            ${i?"checked":""}
                            ${r?"data-indeterminate=1":""}
                            ${t.busy||t.contacts.length===0?"disabled":""} />
                        </th>
                        <th class="contact-col-name">Name</th>
                        <th class="contact-col-email">Email</th>
                        <th class="contact-col-phone">Phone</th>
                        <th class="contact-col-org hide-sm">Organization</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${o}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
      </section>
    </div>
    ${y}
    ${h}
    ${S}`}async function pl(e,t,a,s){var d,m;const{state:n,root:i,render:r,setFlash:l,clearFlash:o}=e;if(t==="select-ab"){const u=Number(a.dataset.id);if(!Number.isFinite(u))return!0;n.selectedAbId=u,n.abModalOpen=!1,n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.contactSearch="",n.contacts=[],n.checkedContactUris=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,o(),n.busy=!0,r();try{await e.loadContacts(u)}catch(b){l("error",b instanceof Error?b.message:"Failed to load contacts")}finally{n.busy=!1,r()}return!0}if(t==="edit-ab"){s.stopPropagation();const u=Number(a.dataset.id);if(!Number.isFinite(u)||!n.addressBooks.find(g=>g.id===u))return!0;const p=n.selectedAbId!==u;n.selectedAbId=u,n.abModalOpen=!0,n.contactModalOpen=!1,o(),p&&(n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactSearch="",n.contacts=[],n.checkedContactUris=[],n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1),n.busy=!0,r();try{p&&await e.loadContacts(u)}catch(g){l("error",g instanceof Error?g.message:"Failed to open address book")}finally{n.busy=!1,r()}return!0}if(t==="close-ab-modal")return n.abModalOpen=!1,r(),!0;if(t==="contact-check"){s.preventDefault(),s.stopPropagation();const u=a.dataset.uri??"";return u&&(n.checkedContactUris.includes(u)?n.checkedContactUris=n.checkedContactUris.filter(b=>b!==u):n.checkedContactUris=[...n.checkedContactUris,u],r()),!0}if(t==="contact-select-all"){s.preventDefault();const u=n.contacts.length>0&&n.contacts.every(b=>n.checkedContactUris.includes(b.uri));return n.checkedContactUris=u?[]:n.contacts.map(b=>b.uri),r(),!0}if(t==="contact-clear-selection")return n.checkedContactUris=[],r(),!0;if(t==="contact-bulk-copy")return await Wn(e.contactsHost,"copy"),!0;if(t==="contact-bulk-delete"){const u=n.checkedContactUris.length;return u===0?(l("error","No contacts selected"),r(),!0):(n.confirmDelete={scope:"bulk-contact",title:u===1?"Delete contact":`Delete ${u} contacts`,message:u===1?"Delete the selected contact?":`Delete ${u} selected contacts?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},r(),!0)}if(t==="contact-bulk-export"){const u=[...n.checkedContactUris];if(n.selectedAbId===null||u.length===0)return l("error","No contacts selected"),r(),!0;n.busy=!0,o(),r();try{const{blob:b,filename:p}=await D.exportContacts(n.selectedAbId,u),g=await e.saveBlobAsFile(b,p);g==="cancelled"?l("info","Export cancelled"):g==="saved"?l("success",`Saved ${p}`):l("success",`Download started: ${p}`)}catch(b){l("error",b instanceof Error?b.message:"Export failed")}finally{n.busy=!1,r()}return!0}if(t==="select-contact"){if(s.target.closest("[data-stop-row], .row-check"))return!0;const u=a.dataset.uri??"";if(!u)return!0;o();try{await e.openContact(u)}catch(b){l("error",b instanceof Error?b.message:"Failed to load contact")}return r(),!0}if(t==="new-contact")return n.selectedAbId===null||(e.startNewContact(),o(),r()),!0;if(t==="cancel-contact"||t==="close-contact-modal")return n.creatingContact=!1,n.contactModalOpen=!1,n.editingContact=null,n.selectedContactUri=null,n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,n.eventDtPicker=null,o(),r(),!0;if(t==="add-email"||t==="add-phone"||t==="add-custom")return n.editingContact&&(ze(e.contactsHost),Array.isArray(n.editingContact.emails)||(n.editingContact.emails=[""]),Array.isArray(n.editingContact.phones)||(n.editingContact.phones=[{type:"cell",value:""}]),Array.isArray(n.editingContact.custom)||(n.editingContact.custom=[]),t==="add-email"?n.editingContact.emails.length<10&&n.editingContact.emails.push(""):t==="add-phone"?n.editingContact.phones.length<10&&n.editingContact.phones.push({type:"other",value:""}):n.editingContact.custom.length<30&&n.editingContact.custom.push({label:"",value:""}),r()),!0;if(t==="remove-email"){if(!n.editingContact)return!0;ze(e.contactsHost);const u=Number(a.dataset.idx);if(!Number.isFinite(u))return!0;const b=Array.isArray(n.editingContact.emails)?n.editingContact.emails:[""];return n.editingContact.emails=b.filter((p,g)=>g!==u),n.editingContact.emails.length===0&&(n.editingContact.emails=[""]),r(),!0}if(t==="remove-phone"){if(!n.editingContact)return!0;ze(e.contactsHost);const u=Number(a.dataset.idx);if(!Number.isFinite(u))return!0;const b=Array.isArray(n.editingContact.phones)?n.editingContact.phones:[{type:"cell",value:""}];return n.editingContact.phones=b.filter((p,g)=>g!==u),n.editingContact.phones.length===0&&(n.editingContact.phones=[{type:"cell",value:""}]),r(),!0}if(t==="remove-custom"){if(!n.editingContact)return!0;ze(e.contactsHost);const u=Number(a.dataset.idx);return Number.isFinite(u)&&(n.editingContact.custom=(Array.isArray(n.editingContact.custom)?n.editingContact.custom:[]).filter((b,p)=>p!==u),r()),!0}if(t==="remove-photo")return n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!0,n.editingContact&&(n.editingContact.hasPhoto=!1),r(),!0;if(t==="delete-contact"){if(n.selectedAbId===null||!n.selectedContactUri)return!0;const u=String(((d=n.editingContact)==null?void 0:d.fullname)||((m=n.editingContact)==null?void 0:m.displayname)||"this contact").trim()||"this contact";return n.confirmDelete={scope:"contact",title:"Delete contact",message:`Delete “${u}”?`,detail:"CardDAV clients will sync the removal. This cannot be undone."},r(),!0}if(t==="delete-ab"){s.stopPropagation();const u=Number(a.dataset.id??n.selectedAbId);return!Number.isFinite(u)||!n.addressBooks.find(p=>p.id===u)||(n.deleteAbConfirmId=u,n.abModalOpen=!1,n.contactModalOpen=!1,o(),r()),!0}if(t==="cancel-delete-ab")return n.deleteAbConfirmId=null,r(),!0;if(t==="confirm-delete-ab"){const u=Number(a.dataset.id),b=i.querySelector("#delete-ab-confirm");if(!Number.isFinite(u)||!(b!=null&&b.checked))return!0;const p=n.addressBooks.find(f=>f.id===u);if(!p)return!0;const g=(p.cardCount??0)>0;n.busy=!0,o(),r();try{await D.deleteAddressBook(u,g),n.selectedAbId===u&&(n.selectedAbId=null,n.contacts=[],n.editingContact=null,n.selectedContactUri=null,n.creatingContact=!1),n.deleteAbConfirmId=null,n.abModalOpen=!1,n.contactModalOpen=!1,await e.loadHome(),n.selectedAbId===null&&n.addressBooks.length>0&&(n.selectedAbId=n.addressBooks[0].id,await e.loadContacts(n.selectedAbId)),l("success","Address book deleted")}catch(f){l("error",f instanceof Error?f.message:"Delete failed")}finally{n.busy=!1,r()}return!0}if(t==="export-ab"){s.stopPropagation();const u=a.dataset.id,b=u!==void 0&&u!==""?Number(u):n.selectedAbId;if(b===null||Number.isNaN(b))return!0;n.busy=!0,o(),r();try{const{blob:p,filename:g}=await D.exportAddressBook(b),f=await e.saveBlobAsFile(p,g);f==="cancelled"?l("info","Export cancelled"):f==="saved"?l("success",`Saved ${g}`):l("success",`Download started: ${g}`)}catch(p){l("error",p instanceof Error?p.message:"Export failed")}finally{n.busy=!1,r()}return!0}if(t==="export-contact"){if(n.selectedAbId===null||!n.selectedContactUri||n.creatingContact)return!0;n.contactModalOpen=!0,n.busy=!0,o(),r();try{const{blob:u,filename:b}=await D.exportContact(n.selectedAbId,n.selectedContactUri),p=await e.saveBlobAsFile(u,b);p==="cancelled"?l("info","Export cancelled"):p==="saved"?l("success",`Saved ${b}`):l("success",`Download started: ${b}`)}catch(u){l("error",u instanceof Error?u.message:"Export failed")}finally{n.busy=!1,r()}return!0}return!1}function Da(e){return e==="calendars"||e==="contacts"||e==="tasks"||e==="notes"||e==="files"||e==="admin"?e:null}function Yn(e){return e==="overview"||e==="users"||e==="settings"||e==="database"?e:null}function Ca(){const e=(typeof location<"u"?location.hash:"").replace(/^#/,"").split(/[?&]/)[0].replace(/^\/+/,"");if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e==="admin"||e.startsWith("admin/")){const t=e.split("/").filter(Boolean),a=t[1]??"overview",s=Yn(a)??"overview";let n=null;if(s==="users"&&t[2])try{n=decodeURIComponent(t[2])}catch{n=t[2]}return{tab:"admin",adminPage:s,adminUsername:n}}return{tab:Da(e),adminPage:null,adminUsername:null}}function bl(){const e=Ca().tab;if(e)return e;try{const t=Da(sessionStorage.getItem(mn));if(t)return t}catch{}return"calendars"}function gl(){const e=Ca().adminPage;if(e)return e;try{const t=Yn(sessionStorage.getItem(fn));if(t)return t}catch{}return"overview"}function yl(e,t=null){return e==="overview"?"#admin":e==="users"&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function Rt(e,t="overview",a=null){try{sessionStorage.setItem(mn,e),e==="admin"&&sessionStorage.setItem(fn,t)}catch{}if(typeof history>"u"||typeof location>"u")return;const s=e==="admin"?yl(t,a):`#${e}`;location.hash!==s&&history.replaceState(null,"",`${location.pathname}${location.search}${s}`)}function za(e){return e==="readwrite"?'<span class="badge badge-admin">full access</span>':e==="read"?'<span class="badge">read-only</span>':e==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(e)}</span>`}function qt(e){const t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(", ")}function vl(e){const t=e.confirmDelete;if(!t)return"";const a=t.detail?`<p class="muted small" style="margin:0.75rem 0 0">${c(t.detail)}</p>`:"";return _({id:"portal-confirm-delete-modal",title:t.title,titleId:"portal-confirm-delete-title",closeAction:"confirm-delete-cancel",size:"sm",body:`<p style="margin:0">${c(t.message)}</p>${a}`,footer:[{label:"Cancel",action:"confirm-delete-cancel",variant:"ghost",disabled:e.busy},{label:"Delete",action:"confirm-delete-ok",variant:"danger",disabled:e.busy}]})}function Wa(e){e.confirmDelete=null}const Ya="portal-page",Ja="portal-overlays";function $l(e){let t=e.querySelector(`#${Ya}`),a=e.querySelector(`#${Ja}`);return(!t||!a)&&(e.replaceChildren(),t=document.createElement("div"),t.id=Ya,a=document.createElement("div"),a.id=Ja,e.append(t,a)),{page:t,overlays:a}}function hl(e){const t=e.filesPreview,a=t?[t.path,t.status,t.kind,t.objectUrl??"",t.truncated?"1":"0",String((t.text??"").length),t.error??""].join("|"):"",s=e.filesUploadProgress,n=s?[s.phase,s.completedFiles,s.failedFiles,s.bytesSent,s.currentName].join("|"):"",i=e.importProgress,r=i?[i.phase,i.readPercent??"",i.processPercent??"",i.processCurrent,i.ok??""].join("|"):"",l=e.confirmDelete?e.confirmDelete.scope:"";return`p:${a};u:${n};i:${r};c:${l}`}function wl(e){return`${Cr()}
      ${vl(e.state)}
      ${Ui(e.calendarsHost)}
      ${$r(e.filesHost)}
      ${gr(e.filesHost)}`}function kl(e,t,a){e.dataset.overlayKey===a&&e.childElementCount>0||(e.dataset.overlayKey=a,e.innerHTML=t)}function Le(e,t,a){if(!te(e,t))return"";const s=e.activeTab===t;return`<button type="button" role="tab" class="tab-btn${s?" is-active":""}"
            data-action="tab" data-tab="${t}" aria-selected="${s}">
            ${a}
          </button>`}function Sl(e){const{state:t,root:a}=e;if(!t.user){e.renderLogin();return}let s;switch(t.activeTab){case"calendars":s=te(t,"calendars")?ja(e):_e("Calendar","CalDAV");break;case"contacts":s=te(t,"contacts")?fl(e):_e("Contacts","CardDAV");break;case"tasks":s=te(t,"tasks")?el(e.tasksHost):_e("Tasks","Tasks (VTODO)");break;case"notes":s=te(t,"notes")?Wi(e.notesHost):_e("Notes","Notes (VJOURNAL)");break;case"files":s=te(t,"files")?Ur(e.filesHost):_e("Files","WebDAV file storage");break;case"admin":s=ni(e.adminHost);break;default:s=ja(e)}const n=t.activeTab==="calendars"?"my-calendars":t.activeTab==="contacts"?"my-contacts":t.activeTab==="tasks"?"tasks":t.activeTab==="notes"?"notes":t.activeTab==="files"?"files":"administration",i=t.activeTab==="admin"?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage==="overview"?"admin-overview":t.adminPage==="users"?"admin-users":t.adminPage==="settings"?"admin-settings":"admin-database"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          ${Le(t,"calendars","Calendar")}
          ${Le(t,"contacts","Contacts")}
          ${Le(t,"tasks","Tasks")}
          ${Le(t,"notes","Notes")}
          ${Le(t,"files","Files")}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${n}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`,{page:r,overlays:l}=$l(a);r.innerHTML=e.shell(s,{tabs:i}),kl(l,wl(e),hl(t)),document.body.classList.toggle("cal-modal-open",t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesPreview!==null||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle("layout-contacts",t.activeTab==="contacts"),document.body.classList.toggle("layout-calendars",t.activeTab==="calendars"),document.body.classList.toggle("layout-tasks",t.activeTab==="tasks"||t.activeTab==="notes"),document.body.classList.toggle("layout-files",t.activeTab==="files"),document.body.classList.toggle("layout-admin",t.activeTab==="admin")}function _e(e,t){return`<div class="panel empty-panel">
    <h2>${e}</h2>
    <p class="muted">${e} is disabled in system settings (Enable ${t}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`}function Dl(e){const{state:t,render:a}=e;e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),pt(t),t.eventDtPicker&&xs(t,a),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),Fn(e.filesHost),e.root.querySelectorAll('input[data-indeterminate="1"]').forEach(s=>{s.indeterminate=!0}),ji(e.notesHost),e.bindHolidaysToggle(),Tl(e),El(e.root),Cl(e)}function Cl(e){const{state:t,root:a}=e,s=t.filesSearchFocus&&t.activeTab==="files"?'input[data-action="files-search"]':t.eventSearchFocus&&t.activeTab==="calendars"?'input[data-action="event-search"]':null;if(!s)return;const n=a.querySelector(s);if(!n)return;n.focus({preventScroll:!0});const i=n.value.length;try{n.setSelectionRange(i,i)}catch{}t.filesSearchFocus=!1,t.eventSearchFocus=!1}function El(e){const t=e.querySelector(".cal-modal[data-focus-trap]");if(!t)return;const a=document.activeElement;if(a&&t.contains(a))return;const s=e.querySelector("#portal-page");if(a&&(s!=null&&s.contains(a)))return;const n=t.querySelector("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");n==null||n.focus()}function Tl(e){var i;const{state:t,root:a}=e;if(!t.listKeyboardFocus||t.activeTab!=="contacts"&&t.activeTab!=="tasks"&&t.activeTab!=="notes")return;const s=document.activeElement;if(s&&a.contains(s)&&s.matches("input:not([type=checkbox]), textarea, select, [contenteditable='true']")&&!s.closest("tr.contact-table-row[data-action]")||(i=s==null?void 0:s.closest)!=null&&i.call(s,"tr.contact-table-row[data-action]"))return;let n=null;if(t.activeTab==="contacts"&&t.selectedContactUri)n=a.querySelector(`tr[data-action="select-contact"][data-uri="${CSS.escape(t.selectedContactUri)}"]`);else if(t.activeTab==="tasks"&&t.selectedTaskKey){const r=t.selectedTaskKey.indexOf("|");if(r>0){const l=t.selectedTaskKey.slice(0,r),o=t.selectedTaskKey.slice(r+1);n=a.querySelector(`tr[data-action="select-task"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}else if(t.activeTab==="notes"&&t.selectedNoteKey){const r=t.selectedNoteKey.indexOf("|");if(r>0){const l=t.selectedNoteKey.slice(0,r),o=t.selectedNoteKey.slice(r+1);n=a.querySelector(`tr[data-action="select-note"][data-instance="${CSS.escape(l)}"][data-uri="${CSS.escape(o)}"]`)}}if(!n){const r=t.activeTab==="contacts"?"select-contact":t.activeTab==="tasks"?"select-task":"select-note";n=a.querySelector(`tr.contact-table-row[data-action="${r}"]`)}n&&n.focus({preventScroll:!0})}async function Pl(e,t,a,s){const{state:n,render:i,clearFlash:r,setFlash:l}=e;if(t==="confirm-delete-cancel")return Wa(n),i(),!0;if(t==="confirm-delete-ok"){const o=n.confirmDelete;if(!o)return i(),!0;const d=o.scope;if(Wa(n),d==="event"){if(!n.editingEvent||!n.editingEvent.canWrite||n.creatingEvent)return i(),!0;const m=n.editingEvent.instanceId,u=n.editingEvent.uri;n.busy=!0,r(),i();try{await D.deleteEvent(m,u),n.eventModalOpen=!1,n.editingEvent=null,await e.loadMonthEvents(),l("success","Event deleted")}catch(b){l("error",b instanceof Error?b.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(d==="task"){if(!n.editingTask||n.creatingTask)return i(),!0;n.busy=!0,r(),i();try{await D.deleteTask(n.editingTask.instanceId,n.editingTask.uri),n.selectedTaskKey=null,n.editingTask=null,await e.loadTasks(),l("success","Task deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(d==="note"){if(!n.editingNote||n.creatingNote)return i(),!0;n.busy=!0,r(),i();try{await D.deleteNote(n.editingNote.instanceId,n.editingNote.uri),n.selectedNoteKey=null,n.editingNote=null,await e.loadNotes(),l("success","Note deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(d==="contact"){if(n.selectedAbId===null||!n.selectedContactUri)return i(),!0;n.busy=!0,r(),n.contactModalOpen=!0,i();try{await D.deleteContact(n.selectedAbId,n.selectedContactUri),n.selectedContactUri=null,n.editingContact=null,n.creatingContact=!1,n.contactModalOpen=!1,n.eventDtPicker=null,n.photoPreview=null,await e.loadHome(),l("success","Contact deleted")}catch(m){l("error",m instanceof Error?m.message:"Delete failed")}finally{n.busy=!1,i()}return!0}if(d==="bulk-task")return await e.runBulkTaskAction("bulk-task-delete"),!0;if(d==="bulk-note")return await Kn(e.notesHost,"delete"),!0;if(d==="bulk-contact")return await Wn(e.contactsHost,"delete"),!0;if(d==="revoke-share"){const m=o.href??"";if(!m||n.selectedId===null)return i(),!0;n.calModalOpen=!0,n.busy=!0,r(),i();try{await D.revoke(n.selectedId,m),await e.loadShares(n.selectedId),l("success","Share revoked")}catch(u){l("error",u instanceof Error?u.message:"Revoke failed")}finally{n.busy=!1,i()}return!0}return i(),!0}if(t==="close-import-progress")return n.importProgress&&(n.importProgress.phase==="done"||n.importProgress.phase==="error")&&e.closeImportProgress(),!0;if(t==="logout"){n.busy=!0,$.event("logout");try{await D.logout()}catch{}return e.clearPortalSessionState(),r(),i(),!0}if(t==="info"){const o=a.dataset.info??"";return e.openInfoModal(o),!0}if(t==="info-close")return e.closeInfoModal(),!0;if(t==="about-open")return s.preventDefault(),Ms(e.root),!0;if(t==="about-close")return s.preventDefault(),gn(e.root),!0;if(t==="flash-close")return r(),i(),!0;if(t==="user-settings-open")return n.userMenuOpen=!1,n.userSettingsOpen=!0,i(),!0;if(t==="user-settings-close")return on(n),i(),!0;if(t==="set-theme"){const o=$e(a.dataset.theme);if(o){if(kt(o),n.userSettingsOpen)return!0;i()}return!0}if(t==="user-menu-toggle")return s.stopPropagation(),n.userMenuOpen=!n.userMenuOpen,i(),!0;if(t==="user-menu-close")return n.userMenuOpen&&(n.userMenuOpen=!1,i()),!0;if(t==="tab"){const o=Da(a.dataset.tab);return o&&(o==="admin"&&(n.adminPage="overview"),await e.activateTab(o)),!0}return!1}async function Qt(e,t){const a=t.target.closest("[data-action]");if(!a)return;const s=a.dataset.action;s&&($.debug(`action:${s}`,{id:a.dataset.id,tab:a.dataset.tab,uri:a.dataset.uri}),!await Pl(e,s,a,t)&&(s.startsWith("admin-")&&await ri(e.adminHost,s,a)||(s.startsWith("files-")||s==="sort-file"||s==="close-files-upload-progress")&&await Or(e.filesHost,s,a,t)||await qi(e,s,a,t)||await sl(e,s,a,t)||await Gi(e,s,a,t)||await pl(e,s,a,t)))}const Ga=new WeakMap;function Fl(e){if(Ga.has(e.root)){$.debug("portalEvents: already bound for root");return}Ga.set(e.root,!0),e.state.portalEventsBound=!0,e.state.escapeBound=!0;const{root:t}=e;t.addEventListener("click",a=>Al(e,a)),t.addEventListener("contextmenu",a=>Ul(e,a)),t.addEventListener("submit",a=>Il(e,a)),t.addEventListener("change",a=>Ml(e,a)),t.addEventListener("input",a=>Ol(e,a)),t.addEventListener("keydown",a=>xl(e,a)),document.addEventListener("keydown",a=>Bl(e,a)),t.addEventListener("dragenter",a=>nt(e,"enter",a)),t.addEventListener("dragover",a=>nt(e,"over",a)),t.addEventListener("dragleave",a=>nt(e,"leave",a)),t.addEventListener("drop",a=>nt(e,"drop",a)),t.addEventListener("error",a=>_l(e,a),!0),$.event("portalEvents.registered")}function Al(e,t){var n,i;const a=(i=(n=t.target)==null?void 0:n.closest)==null?void 0:i.call(n,"[data-action]");if(!a||!e.root.contains(a))return;const s=a.dataset.action??"";(s==="info"||s==="info-close"||s==="about-open"||s==="about-close"||s==="user-settings-open"||s==="user-settings-close")&&(t.preventDefault(),t.stopPropagation()),(s==="dt-set-month"||s==="dt-set-year")&&t.stopPropagation(),(s==="select-contact"||s==="select-task"||s==="select-note")&&(e.state.listKeyboardFocus=!0),$.debug("portalEvents.click",{action:s}),Qt(e,t)}function Ul(e,t){const a=t.target;if(!a||!e.root.contains(a))return;if(a.closest("#files-item-menu")){t.preventDefault();return}const s=a.closest("tr.files-row");if(!s||!e.root.contains(s))return;const n=s.dataset.path??"";!n||ra(e.state)||(t.preventDefault(),ia(e.filesHost,n,{x:t.clientX,y:t.clientY,origin:"context"}))}function Il(e,t){var n,i,r;const a=(i=(n=t.target)==null?void 0:n.closest)==null?void 0:i.call(n,"form[data-form]");if(!a||!e.root.contains(a))return;const s=a.dataset.form??"";if(s)switch(t.preventDefault(),$.debug("portalEvents.submit",{form:s}),s){case"login":e.onLogin(a);return;case"share":e.onShare(a);return;case"edit-event":e.onSaveEvent(a);return;case"edit-cal":e.onEditCal(a);return;case"create-cal":e.onCreateCal(a);return;case"contact":e.onSaveContact(a);return;case"create-ab":e.onCreateAb(a);return;case"edit-ab":e.onEditAb(a);return;case"task":e.onSaveTask(a);return;case"note":e.onSaveNote(a);return;case"files-rename":Ir(e.filesHost,a);return;case"files-transfer":Vs(e.filesHost,a);return;case"files-mkdir":Mr(e.filesHost,a);return;case"admin-user-create":Kr(e.adminHost,a);return;case"admin-user-edit":jr(e.adminHost,a);return;case"admin-cal":zr(e.adminHost,a);return;case"admin-ab":Wr(e.adminHost,a);return;case"admin-settings":Qr(e.adminHost,a);return;case"admin-database":Zr(e.adminHost,a);return;case"user-settings":{const l=is(a);if("error"in l){e.setFlash("error",l.error),e.render();return}ss(l,((r=e.state.user)==null?void 0:r.username)??null),e.state.userSettings=l,e.state.userSettingsOpen=!1,kt(l.theme),e.clearFlash(),e.render();return}default:$.debug("portalEvents.submit.unknown",{form:s})}}function Ml(e,t){const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:i}=e,r=a.closest("[data-action]"),l=(r==null?void 0:r.dataset.action)??"";if(l==="dt-set-month"||l==="dt-set-year"){t.stopPropagation(),$.debug("portalEvents.change",{action:l}),Qt(e,t);return}if(l==="admin-db-backend"&&a instanceof HTMLSelectElement){s.adminDbFormBackend=a.value==="pgsql"?"pgsql":"sqlite",i();return}if(l==="files-upload-pick-files"&&a instanceof HTMLInputElement){qa(e.filesHost,a,!1);return}if(l==="files-upload-pick-folder"&&a instanceof HTMLInputElement){qa(e.filesHost,a,!0);return}if(l==="files-type-filter"){$.debug("portalEvents.change",{action:l}),Qt(e,t);return}if(l==="import-cal"&&a instanceof HTMLInputElement){Ii(e.calendarsHost,a);return}if(l==="import-create-cal"&&a instanceof HTMLInputElement){Mi(e.calendarsHost,a);return}if(l==="import-ab"&&a instanceof HTMLInputElement){e.calendarsHost.onImportContacts(a);return}if(l==="contact-photo"&&a instanceof HTMLInputElement){ol(e.contactsHost,a);return}if(a instanceof HTMLInputElement&&a.id==="delete-cal-confirm"){const o=n.querySelector("#delete-cal-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLInputElement&&a.id==="delete-ab-confirm"){const o=n.querySelector("#delete-ab-submit");o&&(o.disabled=!a.checked||s.busy);return}if(a instanceof HTMLSelectElement&&(a.name==="repeatFreq"||a.name==="repeatEndMode")){const o=a.closest('[data-form="edit-event"]');if(o&&s.editingEvent){const d=new FormData(o);s.editingEvent={...s.editingEvent,repeat:Qe(d),hasRrule:!!String(d.get("repeatFreq")??"").trim()},i()}return}if(a instanceof HTMLSelectElement&&a.name==="instanceId"){const o=a.closest('[data-form="task"]');if(o&&s.creatingTask&&s.editingTask){const m=Number(a.value);if(!Number.isFinite(m)||m<=0)return;e.syncEditingTaskFromForm(o);const u=s.editingTask.parentUid;s.editingTask={...s.editingTask,instanceId:m,parentUid:u&&s.tasks.some(b=>b.uid===u&&b.instanceId===m)?u:null},i();return}const d=a.closest('[data-form="note"]');if(d&&s.creatingNote&&s.editingNote){const m=Number(a.value);if(!Number.isFinite(m)||m<=0)return;e.syncEditingNoteFromForm(d),s.editingNote={...s.editingNote,instanceId:m},i();return}}if(a instanceof HTMLInputElement&&a.name==="holidays"&&a.closest('[data-form="create-cal"]')){Vn(e.calendarsHost);return}if(a instanceof HTMLInputElement&&a.name==="color"){const o=a.closest("form"),d=o==null?void 0:o.querySelector('input[name="color_picker"]');if(d){let m=a.value.trim();m&&!m.startsWith("#")&&(m=`#${m}`),/^#[0-9A-Fa-f]{6}/.test(m)&&(d.value=m.slice(0,7),a.value=m.toUpperCase())}return}}function Ol(e,t){var o;const a=t.target;if(!a||!e.root.contains(a))return;const{state:s,root:n,render:i,setFlash:r}=e;if(a instanceof HTMLInputElement&&a.name==="color_picker"){const d=a.closest("form"),m=d==null?void 0:d.querySelector('input[name="color"]');m&&(m.value=a.value.toUpperCase());return}const l=((o=a.closest("[data-action]"))==null?void 0:o.dataset.action)??"";if(l==="contact-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const d=a.value;s.searchTimer=setTimeout(()=>{s.contactSearch=d,(async()=>{try{s.selectedAbId!==null&&await e.loadContacts(s.selectedAbId),i()}catch(m){r("error",m instanceof Error?m.message:"Search failed"),i()}})()},250);return}if(l==="task-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const d=a.value;s.searchTimer=setTimeout(()=>{s.taskSearch=d,(async()=>{try{await e.loadTasks(),i()}catch(m){r("error",m instanceof Error?m.message:"Search failed"),i()}})()},250);return}if(l==="files-search"&&a instanceof HTMLInputElement){s.searchTimer&&clearTimeout(s.searchTimer);const d=a.value;s.searchTimer=setTimeout(()=>{s.filesSearch=d,s.filesSearchFocus=!0,i()},150);return}if(l==="event-search"&&a instanceof HTMLInputElement){s.searchTimer&&clearTimeout(s.searchTimer);const d=a.value;s.searchTimer=setTimeout(()=>{s.eventSearch=d,s.eventSearchFocus=!0,i()},150);return}if(l==="note-search"&&a instanceof HTMLInputElement){s.listKeyboardFocus=!1,s.searchTimer&&clearTimeout(s.searchTimer);const d=a.value;s.searchTimer=setTimeout(()=>{s.noteSearch=d,(async()=>{try{await e.loadNotes(),i()}catch(m){r("error",m instanceof Error?m.message:"Search failed"),i()}})()},250);return}if(l==="admin-db-confirm-input"&&a instanceof HTMLInputElement){s.adminDbConfirmText=a.value;const d=n.querySelector('[data-action="admin-db-confirm-save"]');d&&(d.disabled=s.busy||s.adminDbConfirmText.trim()!=="CONFIRM");return}if(l==="admin-reset-password"&&a instanceof HTMLInputElement){s.adminResetPassword=a.value;const d=n.querySelector('[data-action="admin-reset-confirm"]');d&&(d.disabled=s.busy||!s.adminResetConfirmChecked||s.adminResetPassword.trim()==="");return}}const Xa='tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]',Qa="tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]";function Nl(e){const{state:t,root:a}=e;let s="";if(t.activeTab==="contacts")s="select-contact";else if(t.activeTab==="tasks")s="select-task";else if(t.activeTab==="notes")s="select-note";else return[];return Array.from(a.querySelectorAll(`tr.contact-table-row[data-action="${s}"]`))}function Re(e){e.focus({preventScroll:!1}),e.scrollIntoView({block:"nearest"})}function xl(e,t){const a=t.target;if(!a||!e.root.contains(a))return;if((t.key==="ContextMenu"||t.key==="F10"&&t.shiftKey)&&e.state.activeTab==="files"){const l=a.closest("tr.files-row");if(l&&e.root.contains(l)){const o=l.dataset.path??"";if(o){t.preventDefault();const m=(l.querySelector(".files-row-menu-btn")??l).getBoundingClientRect();ia(e.filesHost,o,{x:m.right,y:m.bottom+4,origin:"button"});return}}}const s=e.state.activeTab,n=s==="contacts"||s==="tasks"||s==="notes",i=a instanceof HTMLInputElement&&(a.dataset.action==="contact-search"||a.dataset.action==="task-search"||a.dataset.action==="note-search");if(!i&&a.closest("button, a, input, select, textarea, [contenteditable=true]")&&!a.matches(Qa)&&!a.matches(Xa))return;if(n&&(t.key==="ArrowDown"||t.key==="ArrowUp"||t.key==="Home"||t.key==="End")){const l=Nl(e);if(l.length===0)return;const o=a.closest(Xa);if(e.state.listKeyboardFocus=!0,t.preventDefault(),!o||i){t.key==="ArrowDown"||t.key==="Home"?Re(l[0]):Re(l[l.length-1]);return}const d=l.indexOf(o);if(d<0)return;if(t.key==="Home"){Re(l[0]);return}if(t.key==="End"){Re(l[l.length-1]);return}const m=t.key==="ArrowDown"?l[d+1]:l[d-1];m&&Re(m);return}if(t.key!=="Enter"&&t.key!==" ")return;const r=a.closest(Qa);!r||!e.root.contains(r)||t.target!==r&&t.target.closest("button, a, input, select, textarea")||(t.preventDefault(),(r.dataset.action==="select-contact"||r.dataset.action==="select-task"||r.dataset.action==="select-note")&&(e.state.listKeyboardFocus=!0),$.debug("portalEvents.keydown.row",{action:r.dataset.action,key:t.key}),r.click())}function nt(e,t,a){var o,d,m;const{state:s,root:n}=e;if(s.activeTab!=="files"||s.busy||s.filesUploadProgress||!Xs(a.dataTransfer))return;const i=(d=(o=a.target)==null?void 0:o.closest)==null?void 0:d.call(o,"[data-files-drop-target]");if(!i||!n.contains(i)){if(t==="leave"&&s.filesDropDepth>0){const u=a.relatedTarget;u&&u instanceof Node&&((m=n.querySelector("[data-files-drop-target]"))==null?void 0:m.contains(u))||(s.filesDropDepth=0,Ll(e))}return}if(t==="enter"){a.preventDefault(),a.stopPropagation(),s.filesDropDepth+=1,st(e,i,!0);return}if(t==="over"){a.preventDefault(),a.stopPropagation(),a.dataTransfer&&(a.dataTransfer.dropEffect="copy"),st(e,i,!0);return}if(t==="leave"){a.preventDefault(),a.stopPropagation();const u=a.relatedTarget;if(u&&i.contains(u))return;s.filesDropDepth=Math.max(0,s.filesDropDepth-1),s.filesDropDepth===0&&st(e,i,!1);return}a.preventDefault(),a.stopPropagation(),s.filesDropDepth=0,st(e,i,!1);const r=a.dataTransfer;if(!r||s.busy||s.filesUploadProgress)return;s.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),O(e.filesHost);const l=Js(r);$.event("files.drop.snapshot",{handles:l.handlePromises.length,entries:l.entries.filter(Boolean).length,files:l.files.length}),(async()=>{try{const u=await Gs(l);if($.event("files.drop.items",{count:u.length,sample:u.slice(0,8).map(b=>b.relativePath)}),u.length===0){e.setFlash("info","Nothing to upload from that drop"),e.render();return}await ua(e.filesHost,u)}catch(u){e.setFlash("error",u instanceof Error?u.message:"Drop failed"),e.render()}})()}function st(e,t,a){if(e.state.filesUploadDropActive===a){t.classList.toggle("is-dragover",a);return}e.state.filesUploadDropActive=a,t.classList.toggle("is-dragover",a)}function Ll(e){e.state.filesUploadDropActive=!1,e.root.querySelectorAll("[data-files-drop-target].is-dragover").forEach(t=>{t.classList.remove("is-dragover")})}function _l(e,t){const a=t.target;if(!(a instanceof HTMLImageElement)||!a.classList.contains("contact-avatar")||!a.dataset.avatarFallback||!a.isConnected)return;const s=a.dataset.avatarFallback||"?",n=document.createElement("span");n.className="contact-avatar contact-avatar-fallback",n.setAttribute("aria-hidden","true"),n.textContent=s,a.replaceWith(n)}const Rl='a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';function ql(e,t){if(t.key!=="Tab")return;const a=e.querySelector(".cal-modal[data-focus-trap]");if(!a)return;const s=[...a.querySelectorAll(Rl)].filter(l=>l.offsetParent!==null||l===document.activeElement);if(s.length===0)return;const n=s[0],i=s[s.length-1],r=document.activeElement;!t.shiftKey&&r===i?(t.preventDefault(),n.focus()):t.shiftKey&&(r===n||!a.contains(r))&&(t.preventDefault(),i.focus())}function Bl(e,t){if(ql(e.root,t),t.key!=="Escape")return;const{state:a,render:s}=e;if(a.importProgress&&(a.importProgress.phase==="done"||a.importProgress.phase==="error")){e.closeImportProgress();return}if(a.importProgress)return;if(a.filesUploadProgress&&(a.filesUploadProgress.phase==="done"||a.filesUploadProgress.phase==="error")){e.closeFilesUploadProgress();return}if(a.filesUploadProgress)return;if(a.filesUploadMenuOpen){a.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),s();return}if(a.filesItemMenu){O(e.filesHost),s();return}if(a.userMenuOpen){a.userMenuOpen=!1,e.unbindUserMenuOutside(),s();return}if(a.filesUploadConflict!==null){dt(e.filesHost,"cancel");return}if(a.filesPreview!==null){j(e.filesHost),s();return}if(a.filesRenamePath!==null||a.filesDeletePaths!==null||a.filesTransfer!==null||a.filesMkdirOpen){a.filesRenamePath=null,a.filesDeletePaths=null,e.resetFilesTransferTree(),a.filesMkdirOpen=!1,s();return}if(a.confirmDelete){a.confirmDelete=null,s();return}if(a.userSettingsOpen){on(a),s();return}if(Os(e.root)){gn(e.root);return}const n=e.root.querySelector("#info-modal");if(n&&!n.hidden){e.closeInfoModal();return}if(a.eventDtPicker){a.eventDtPicker=null,pt(a),s();return}if(a.eventModalOpen){a.eventModalOpen=!1,a.editingEvent=null,a.creatingEvent=!1,a.eventDtPicker=null,s();return}if(a.contactModalOpen){a.contactModalOpen=!1,a.editingContact=null,a.creatingContact=!1,a.photoPreview=null,a.photoBase64Pending=null,a.removePhotoPending=!1,s();return}if(a.abModalOpen){a.abModalOpen=!1,s();return}if(a.calModalOpen||a.createCalModalOpen||a.deleteConfirmId!==null||a.deleteAbConfirmId!==null){a.calModalOpen=!1,a.createCalModalOpen=!1,a.deleteConfirmId=null,a.deleteAbConfirmId=null,s();return}if(a.adminUserCreateOpen||a.adminUserEditOpen||a.adminUserDeleteUsername!==null){a.adminUserCreateOpen=!1,a.adminUserEditOpen=!1,a.adminUserDeleteUsername=null,s();return}if(a.adminResetModalOpen){a.adminResetModalOpen=!1,s();return}if(a.adminDbConfirmOpen){a.adminDbConfirmOpen=!1,a.adminDbConfirmText="",a.adminDbPendingBody=null,s();return}(a.adminCalModal!==null||a.adminAbModal!==null||a.adminResourceDelete!==null)&&(a.adminCalModal=null,a.adminAbModal=null,a.adminResourceDelete=null,s())}function Bt(e){const{state:t}=e;if(t.activeTab==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())){t.activeTab=ft(t),t.adminPage="overview",e.persistTab(t.activeTab);return}t.activeTab!=="admin"&&!te(t,t.activeTab)&&(t.activeTab=ft(t),e.persistTab(t.activeTab))}async function Hl(e,t,a={}){return In(e.adminHost,t,a)}async function Za(e,t,a={}){const{state:s,render:n,setFlash:i,clearFlash:r}=e;if(t==="admin"&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&s.adminCapabilities&&!s.adminCapabilities.uiEnabled&&i("info","Portal Administration UI is disabled (portal_admin_ui_enabled)."),t=ft(s)),t!=="admin"&&!te(s,t)&&(i("info","That section is disabled in system settings."),t=ft(s)),t!=="files"&&O(e.filesHost),t==="admin"){await e.activateAdminPage(s.adminPage||"overview",{...a,username:s.adminPage==="users"?s.adminSelectedUsername:null});return}s.activeTab=t,s.userMenuOpen=!1,s.listKeyboardFocus=!1,e.persistTab(t),$.event("tab",{tab:t}),t!=="calendars"&&(s.calModalOpen=!1,s.deleteConfirmId=null),t!=="contacts"&&(s.deleteAbConfirmId=null),a.clearFlash!==!1&&r(),s.busy=!0,n();try{t==="contacts"&&s.selectedAbId!==null?await e.loadContacts(s.selectedAbId):t==="calendars"?await e.loadMonthEvents():t==="tasks"?await Ie(e.tasksHost):t==="notes"?await et(e.notesHost):t==="files"&&await ne(e.filesHost)}catch(l){$.warn("tab load failed",l instanceof Error?l.message:l),i("error",l instanceof Error?l.message:"Failed to load")}finally{s.busy=!1,n()}}async function qe(e){var i;const{state:t}=e;$.debug("loadHome");const[a,s,n]=await Promise.all([D.calendars(),D.directory().catch(()=>({users:[]})),D.addressbooks()]);if(t.calendars=a.calendars,t.directory=s.users,t.addressBooks=n.addressbooks,$.event("loadHome",{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{const r=await D.holidayCountries();t.holidayCountries=r.countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(r=>t.calendars.some(l=>l.id===r)),t.selectedId!==null&&!t.calendars.some(r=>r.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),!t.calendarSelectionSeeded&&t.selectedIds.length===0){const r=yi((i=t.user)==null?void 0:i.username);if(r){r.view&&(t.calView=r.view);const l=r.ids.filter(o=>t.calendars.some(d=>d.id===o));t.selectedIds=l,r.selectedId!==null&&t.calendars.some(o=>o.id===r.selectedId)?t.selectedId=r.selectedId:t.selectedId=l[0]??null,t.calendarSelectionSeeded=!0,$.debug("loadHome.calSelection.restored",{count:l.length,selectedId:t.selectedId,view:t.calView})}else{const l=e.pickDefaultCalendar();l?(t.selectedIds=[l.id],t.selectedId=l.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id),t.calendarSelectionSeeded=!0}}else t.selectedIds.length===0?t.selectedId=null:t.calendarSelectionSeeded=!0;t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),Ye(t),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab==="calendars"&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(r=>r.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(r=>r.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab==="contacts"&&await e.loadContacts(t.selectedAbId),t.activeTab==="tasks"&&await Ie(e.tasksHost),t.activeTab==="notes"&&await et(e.notesHost),t.activeTab==="files"&&await ne(e.filesHost)}function Vl(e){const{state:t}=e;return pa(t.portalUi.timeFormat)}function Kl(e){const{state:t}=e;return ba(t.portalUi.weekStart)}function jl(e){const{state:t}=e;return Mn(t.portalUi.weekStart)}function Jn(e,t,a){const{state:s}=e;return di(t,a,s.portalUi.timeFormat)}function zl(e,t,a,s,n){var d,m;const{state:i}=e,r=Ee(a),l=((d=i.eventDtPicker)==null?void 0:d.viewY)??Number(r.date.slice(0,4)),o=((m=i.eventDtPicker)==null?void 0:m.viewM)??Number(r.date.slice(5,7))-1;return mi({field:t,value:a,dateOnly:s,allowClear:n,viewY:l,viewM:o,weekStart:i.portalUi.weekStart,timeFormat:i.portalUi.timeFormat})}function Ht(e){fi(e.root)}function Be(e,t){var p;const{state:a}=e,{field:s,name:n,label:i,value:r,dateOnly:l=!1,required:o,disabled:d,allowClear:m=!0}=t,u=((p=a.eventDtPicker)==null?void 0:p.field)===s,b=Jn(e,r,l);return`<div class="dt-field${u?" is-open":""}" data-dt-id="${c(s)}">
    <span class="dt-field-label">${c(i)}</span>
    <input type="hidden" name="${c(n)}" value="${c(r)}" ${o?"required":""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(s)}"
      data-dt-name="${c(n)}" data-dt-date-only="${l?"1":"0"}" data-dt-clear="${m?"1":"0"}"
      ${d?"disabled":""} aria-expanded="${u}">
      <span class="dt-trigger-text">${c(b)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${u&&!d?zl(e,s,r,l,m):""}
  </div>`}function en(e,t){var s,n,i,r,l,o,d,m;const{state:a}=e;return t==="start"?String(((s=a.editingEvent)==null?void 0:s.start)||""):t==="end"?String(((n=a.editingEvent)==null?void 0:n.end)||""):t==="until"?((r=(i=a.editingEvent)==null?void 0:i.repeat)==null?void 0:r.until)||Te((l=a.editingEvent)==null?void 0:l.start)||U(new Date):t==="due"?Ue((o=a.editingTask)==null?void 0:o.due):t==="dtstart"?Ue((d=a.editingNote)==null?void 0:d.dtstart):t==="bulk-due"?a.bulkDueValue:t==="birthday"?String(((m=a.editingContact)==null?void 0:m.birthday)||""):""}function tn(e,t,a){const{state:s}=e;if(t==="start"&&s.editingEvent){s.editingEvent={...s.editingEvent,start:a||""};return}if(t==="end"&&s.editingEvent){s.editingEvent={...s.editingEvent,end:a};return}if(t==="until"&&s.editingEvent){s.editingEvent={...s.editingEvent,repeat:{...s.editingEvent.repeat??e.defaultRepeat(),until:a,endMode:"until"}};return}if(t==="due"&&s.editingTask){if(a===null||a==="")s.editingTask={...s.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingTask={...s.editingTask,due:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingTask={...s.editingTask,due:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="dtstart"&&s.editingNote){if(a===null||a==="")s.editingNote={...s.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(a))s.editingNote={...s.editingNote,dtstart:new Date(a+"T00:00:00").toISOString()};else{const n=new Date((a.length===16,a));s.editingNote={...s.editingNote,dtstart:Number.isNaN(n.getTime())?a:n.toISOString()}}return}if(t==="birthday"&&s.editingContact){s.editingContact={...s.editingContact,birthday:a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null};return}t==="bulk-due"&&(s.bulkDueValue=a||"")}function Wl(e,t){const{root:a}=e,s=Dr[t];if(!s)return;const n=a.querySelector("#info-modal"),i=a.querySelector("#info-modal-title"),r=a.querySelector("#info-modal-body");if(!n||!i||!r)return;i.textContent=s.title,r.innerHTML=s.paragraphs.map(o=>`<p>${c(o)}</p>`).join(""),n.hidden=!1,document.body.classList.add("info-modal-open");const l=n.querySelector(".info-modal-close");l==null||l.focus()}function Yl(e){const{root:t}=e,a=t.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Jl(e,t){const a=window;if(typeof a.showSaveFilePicker=="function")try{const r=await(await a.showSaveFilePicker({suggestedName:t})).createWritable();try{await r.write(e)}finally{await r.close()}return"saved"}catch(i){if(i instanceof DOMException&&i.name==="AbortError")return"cancelled"}const s=URL.createObjectURL(e),n=document.createElement("a");return n.href=s,n.download=t,n.rel="noopener",n.style.display="none",document.body.appendChild(n),n.click(),window.setTimeout(()=>{URL.revokeObjectURL(s),n.remove()},6e4),"started"}function Gl(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let s=a.value.trim();s&&!s.startsWith("#")&&(s=`#${s}`),/^#[0-9A-Fa-f]{6}/.test(s)&&(t.value=s.slice(0,7),a.value=s.toUpperCase())}))}function Xl(e){const t=Ss({activeTab:bl(),adminPage:gl(),adminSelectedUsername:Ca().adminUsername??null});let a,s,n,i,r,l,o;function d(y,w){pn(t,y,w)}function m(){Ds(t)}function u(){const y=Ia(e);t.user?Sl(o):Ua(e,t,(w,F)=>Nt(t,w,F)),Dl(o),Ma(e,y),requestAnimationFrame(()=>{var w;Ht(o),(w=e.querySelector(".dt-time.is-selected"))==null||w.scrollIntoView({block:"center"})})}function b(){ue(n)}function p(){Ae(a)}function g(){Q(a)}function f(){zt(t)}function v(){ce(a)}function S(){Cs(t,{stopImportElapsedTimer:b,stopFilesUploadElapsedTimer:p,resetFilesTransferTree:g,unbindUserMenuOutside:f,unbindFilesUploadMenuOutside:v})}function h(y){Es(t,{message:y,clearSession:S,render:u})}function E(){return{state:t,render:u,handleSessionExpired:h,clearPortalSessionState:S,normalizeActiveTab:()=>Bt(o),persistTab:Rt,loadHome:()=>qe(o),loadAdminCapabilities:()=>Gt(s),loadAdminDashboard:()=>gt(s),loadAdminUsers:()=>we(s),loadAdminUserDetail:y=>ae(s,y),loadAdminUserResources:y=>ke(s,y),loadAdminSystemSettings:()=>yt(s),loadAdminDatabaseSettings:()=>vt(s),adminPageMeta:y=>fe(s,y),setFlash:d,clearFlash:m}}a={state:t,root:e,render:u,setFlash:d,clearFlash:m},s={state:t,root:e,render:u,setFlash:d,clearFlash:m,userIsAdmin:()=>he(t),adminUiEnabled:()=>Ge(t),persistTab:Rt,activateTab:(y,w)=>Za(o,y,w),loadHome:()=>qe(o),normalizeActiveTab:()=>Bt(o)},n={state:t,root:e,render:u,setFlash:d,clearFlash:m,localeWeekStart:()=>Kl(o),localeDowLabels:()=>jl(o),formatDtDisplay:(y,w)=>Jn(o,y,w),timeFormatOpts:()=>Vl(o),renderPortalDateTimeField:y=>Be(o,y),getDtFieldCurrentValue:y=>en(o,y),setDtFieldValue:(y,w)=>tn(o,y,w),positionDtPopovers:()=>Ht(o),renderFlashBanner:()=>Kt(t),accessBadge:za,formatImportResult:qt,loadHome:()=>qe(o),onImportContacts:y=>dl(l,y)},i={state:t,root:e,render:u,setFlash:d,clearFlash:m,renderPortalDateTimeField:y=>Be(o,y)},r={state:t,root:e,render:u,setFlash:d,clearFlash:m,renderPortalDateTimeField:y=>Be(o,y)},l={state:t,root:e,render:u,setFlash:d,clearFlash:m,renderPortalDateTimeField:y=>Be(o,y),stopImportElapsedTimer:()=>ue(n),startImportElapsedTimer:()=>_n(n),setImportPhase:(y,w)=>je(n,y,w),applyServerImportProgress:y=>Rn(n,y),readFileTextWithProgress:(y,w)=>Bn(n,y,w),formatImportResult:qt,loadHome:()=>qe(o)},o={state:t,root:e,render:u,setFlash:d,clearFlash:m,filesHost:a,adminHost:s,calendarsHost:n,notesHost:i,tasksHost:r,contactsHost:l,clearPortalSessionState:S,userIsAdmin:()=>he(t),adminUiEnabled:()=>Ge(t),normalizeActiveTab:()=>Bt(o),persistTab:Rt,activateTab:(y,w)=>Za(o,y,w),activateAdminPage:(y,w)=>Hl(o,y,w),loadHome:()=>qe(o),handleSessionExpired:h,loadShares:y=>$a(n,y),loadMonthEvents:()=>Pt(n),loadContacts:y=>Ft(l,y),loadTasks:()=>Ie(r),loadNotes:()=>et(i),loadAdminCapabilities:()=>Gt(s),loadAdminDashboard:()=>gt(s),loadAdminUsers:()=>we(s),loadAdminUserDetail:y=>ae(s,y),loadAdminUserResources:y=>ke(s,y),loadAdminSystemSettings:()=>yt(s),loadAdminDatabaseSettings:()=>vt(s),adminPageMeta:y=>fe(s,y),pickDefaultCalendar:()=>vi(n),toggleCalendarSelected:y=>$i(n,y),blankEventForDay:(y,w)=>Ti(n,y,w),blankEventForSlot:(y,w,F)=>Pi(n,y,w,F),defaultRepeat:()=>ka(),itemKey:R,openContact:y=>rl(l,y),startNewContact:()=>il(l),emptyAddress:()=>zn(),syncEditingEventFromForm:y=>Fi(n,y),syncEditingTaskFromForm:y=>tl(r,y),syncEditingNoteFromForm:y=>Yi(i,y),runBulkTaskAction:y=>al(r,y),shell:(y,w)=>Nt(t,y,w),renderLogin:()=>Ua(e,t,(y,w)=>Nt(t,y,w)),renderFlashBanner:()=>Kt(t),renderMonthGrid:()=>Si(n),renderEventModal:()=>Ei(n),adminSubnavButtons:()=>xr(s),renderPortalDateTimeField:y=>Be(o,y),getDtFieldCurrentValue:y=>en(o,y),setDtFieldValue:(y,w)=>tn(o,y,w),positionDtPopovers:()=>Ht(o),accessBadge:za,formatImportResult:qt,closeImportProgress:()=>Ai(n),closeFilesUploadProgress:()=>Cn(a),resetFilesTransferTree:g,stopImportElapsedTimer:b,stopFilesUploadElapsedTimer:p,unbindUserMenuOutside:f,bindUserMenuOutside:()=>Ns(t,u),unbindFilesUploadMenuOutside:v,bindFilesUploadMenuOutside:()=>yr(a),onLogin:y=>As(y,E()),onShare:y=>Oi(n,y),onSaveEvent:y=>Ni(n,y),onEditCal:y=>xi(n,y),onCreateCal:y=>Li(n,y),onSaveContact:y=>cl(l,y),onCreateAb:y=>ul(l,y),onEditAb:y=>ml(l,y),onSaveTask:y=>nl(r,y),onSaveNote:y=>Ji(i,y),bindColorPair:Gl,bindImportInput:()=>void 0,bindHolidaysToggle:()=>_i(n),bindContactPhotoInput:()=>void 0,bindFilesDom:()=>Fn(a),bindAdminDom:()=>void 0,saveBlobAsFile:Jl,openInfoModal:y=>Wl(o,y),closeInfoModal:()=>Yl(o),captureScroll:()=>Ia(e),restoreScroll:y=>Ma(e,y)},Fl(o),Fs(E())}let pe="",T=null,I=!1,J=null,re=null,oe="sqlite",ht=!1;async function At(e,t={}){const a={Accept:"application/json",...t.headers};t.body&&(a["Content-Type"]="application/json"),pe&&t.method&&t.method!=="GET"&&(a["X-CSRF-Token"]=pe);const s=await fetch(`/api/install${e}`,{credentials:"same-origin",...t,headers:a});let n;try{n=await s.json()}catch{throw new Error(`Request failed (${s.status})`)}if(!s.ok)throw new Error(n.error||`Request failed (${s.status})`);return n&&typeof n=="object"&&"data"in n&&n.data!==void 0?n.data:n}async function Ea(){var e;T=await At("/status"),pe=T.csrfToken||pe,((e=T.defaults)==null?void 0:e.backend)==="pgsql"?oe="pgsql":oe="sqlite"}function He(e,t,a){return`<label class="check-row"><input type="checkbox" name="${c(e)}" ${t?"checked":""} ${I?"disabled":""} /> ${c(a)}</label>`}function Ql(){const e=T==null?void 0:T.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${c((e==null?void 0:e.configPath)||"—")} ${e!=null&&e.configWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${c((e==null?void 0:e.specificPath)||"—")} ${e!=null&&e.specificWritable?'<span class="badge badge-ok">writable</span>':'<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${se("error",(T==null?void 0:T.message)||"Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${I?"disabled":""}>Retry</button>
  </section>`}function Zl(){const e=T==null?void 0:T.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${I?"disabled":""}>
          ${An((e==null?void 0:e.timezone)||"UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${He("cal_enabled",(e==null?void 0:e.cal_enabled)!==!1,"Enable CalDAV")}
      ${He("card_enabled",(e==null?void 0:e.card_enabled)!==!1,"Enable CardDAV")}
      ${He("tasks_enabled",(e==null?void 0:e.tasks_enabled)!==!1,"Enable Tasks (VTODO)")}
      ${He("notes_enabled",!!(e!=null&&e.notes_enabled),"Enable Notes (VJOURNAL)")}
      ${He("files_enabled",!!(e!=null&&e.files_enabled),"Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${I?"disabled":""}>
          ${["Digest","Basic","Apache"].map(t=>`<option value="${t}" ${((e==null?void 0:e.dav_auth_type)||"Digest")===t?"selected":""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${c((e==null?void 0:e.invite_from)||"")}" ${I?"disabled":""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${c(String((e==null?void 0:e.session_max_age_minutes)??15))}" ${I?"disabled":""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${I?"disabled":""}>Save and continue</button>
      </div>
    </form>
  </section>`}function eo(){const e=T==null?void 0:T.defaults,t=(T==null?void 0:T.pdoDrivers)||[],a=t.includes("sqlite"),s=t.includes("pgsql");return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${I?"disabled":""}>
          ${a?`<option value="sqlite" ${oe==="sqlite"?"selected":""}>SQLite</option>`:""}
          ${s?`<option value="pgsql" ${oe==="pgsql"?"selected":""}>PostgreSQL</option>`:""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${oe==="sqlite"?"":"display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${c((e==null?void 0:e.sqlite_file)||"")}" class="mono" ${I?"disabled":""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${oe==="pgsql"?"":"display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${c((e==null?void 0:e.pgsql_host)||"")}" placeholder="localhost:5432" ${I?"disabled":""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${c((e==null?void 0:e.pgsql_dbname)||"")}" ${I?"disabled":""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${c((e==null?void 0:e.pgsql_username)||"")}" autocomplete="off" ${I?"disabled":""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${I?"disabled":""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${I?"disabled":""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${I?"disabled":""}>Create database and finish</button>
      </div>
    </form>
  </section>`}function to(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${c(String((T==null?void 0:T.configuredVersion)||"?"))}</strong>
      to <strong class="mono">${c((T==null?void 0:T.productVersion)||"?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${ht?"checked":""} ${I?"disabled":""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${I||!ht?"disabled":""}>Run upgrade</button>
    </div>
  </section>`}function ao(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${c((T==null?void 0:T.message)||"AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function no(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${se("error",(T==null?void 0:T.message)||"Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function G(){const e=document.getElementById("app");if(!e)return;const t=(T==null?void 0:T.step)||"permissions";let a="";T?t==="permissions"?a=Ql():t==="initialize"?a=Zl():t==="database"?a=eo():t==="upgrade"?a=to():t==="done"?a=ao():t==="locked"?a=no():a=`<section class="card"><p>Unknown step: ${c(t)}</p></section>`:a='<section class="card"><p class="muted">Loading installer…</p></section>',e.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${c((T==null?void 0:T.productVersion)||"…")}</span>
            ${T!=null&&T.configuredVersion?` · configured <span class="mono">${c(String(T.configuredVersion))}</span>`:""}
          </p>
        </div>
        ${T!=null&&T.step?`<span class="badge badge-admin">${c(T.step)}</span>`:""}
      </header>
      ${J?se("error",J,{dismissible:!1}):""}
      ${re?se("success",re,{dismissible:!1}):""}
      ${a}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,so()}function so(){var t,a,s,n,i,r;const e=document.getElementById("app");e&&((t=e.querySelector('[data-action="reload"]'))==null||t.addEventListener("click",()=>{ro()}),(a=e.querySelector('[data-action="backend-change"]'))==null||a.addEventListener("change",l=>{oe=l.target.value==="pgsql"?"pgsql":"sqlite",G()}),(s=e.querySelector('[data-action="upgrade-toggle"]'))==null||s.addEventListener("change",l=>{ht=!!l.target.checked,G()}),(n=e.querySelector('[data-action="upgrade-run"]'))==null||n.addEventListener("click",()=>{oo()}),(i=e.querySelector('[data-form="initialize"]'))==null||i.addEventListener("submit",l=>{l.preventDefault(),io(l.target)}),(r=e.querySelector('[data-form="database"]'))==null||r.addEventListener("submit",l=>{l.preventDefault(),lo(l.target)}))}async function ro(){I=!0,J=null,G();try{await Ea(),re=null}catch(e){J=e instanceof Error?e.message:"Failed to load installer status"}finally{I=!1,G()}}async function io(e){const t=new FormData(e),a=n=>{var i;return!!((i=e.querySelector(`input[name="${n}"]`))!=null&&i.checked)},s={timezone:String(t.get("timezone")??"").trim(),cal_enabled:a("cal_enabled"),card_enabled:a("card_enabled"),tasks_enabled:a("tasks_enabled"),notes_enabled:a("notes_enabled"),files_enabled:a("files_enabled"),dav_auth_type:String(t.get("dav_auth_type")??"Digest"),invite_from:String(t.get("invite_from")??"").trim(),session_max_age_minutes:Number(t.get("session_max_age_minutes")??15),admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};I=!0,J=null,re=null,G();try{T=await At("/initialize",{method:"POST",body:JSON.stringify(s)}),pe=T.csrfToken||pe,re="Server settings saved. Configure the database next.",$.event("install.initialize")}catch(n){J=n instanceof Error?n.message:"Initialize failed"}finally{I=!1,G()}}async function lo(e){const t=new FormData(e),a=String(t.get("backend")??oe),s={backend:a,admin_password:String(t.get("admin_password")??""),admin_password_confirm:String(t.get("admin_password_confirm")??"")};a==="sqlite"?s.sqlite_file=String(t.get("sqlite_file")??"").trim():(s.pgsql_host=String(t.get("pgsql_host")??"").trim(),s.pgsql_dbname=String(t.get("pgsql_dbname")??"").trim(),s.pgsql_username=String(t.get("pgsql_username")??"").trim(),s.pgsql_password=String(t.get("pgsql_password")??"")),I=!0,J=null,re=null,G();try{T=await At("/database",{method:"POST",body:JSON.stringify(s)}),pe=T.csrfToken||pe,re="Database configured. Installer is locked.",$.event("install.database"),T.completed||T.step}catch(n){J=n instanceof Error?n.message:"Database setup failed"}finally{I=!1,G()}}async function oo(){if(ht){I=!0,J=null,re=null,G();try{const e=await At("/upgrade",{method:"POST",body:JSON.stringify({confirm:!0})});re="Upgrade completed."+(e.messages&&e.messages.length?" "+e.messages.slice(0,3).join(" · "):""),$.event("install.upgrade"),await Ea()}catch(e){J=e instanceof Error?e.message:"Upgrade failed"}finally{I=!1,G()}}}async function co(e){document.title="AngaraDAV · Setup",document.body.classList.add("layout-install"),e.innerHTML='<section class="card"><p class="muted">Loading installer…</p></section>';try{await Ea()}catch(t){J=t instanceof Error?t.message:"Failed to load installer"}G()}aa();const Zt=document.getElementById("app");if(!Zt)throw new Error("#app missing");const an=window.location.pathname.replace(/\/+$/,"")||"/";an==="/portal/install"||an.endsWith("/portal/install")?co(Zt):Xl(Zt);
