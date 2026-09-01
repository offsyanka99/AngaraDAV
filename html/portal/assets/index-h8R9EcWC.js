(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function t(t,n,r={}){if(!n)return``;let i=r.dismissible===void 0?r.dismissAction!==void 0:r.dismissible,a=r.dismissAction??`flash-close`,o=r.role??`status`,s=r.className?` ${r.className}`:``,c=r.style?` style="${e(r.style)}"`:``,l=i?`<button type="button" class="flash-close" data-action="${e(a)}" aria-label="Dismiss message" title="Dismiss">×</button>`:``;return`<div class="flash flash-${e(t)}${s}" role="${e(o)}"${c}>
      <span class="flash-text">${e(n)}</span>
      ${l}
    </div>`}function n(e){return e===`sm`?` cal-modal-card-sm`:e===`wide`?` cal-modal-card-wide`:``}function r(e){return e===`danger`?`btn btn-danger`:e===`ghost`?`btn btn-ghost`:`btn btn-primary`}function i(t){return t.map(t=>{let n=t.type??`button`,i=r(t.variant),a=t.disabled?` disabled`:``,o=t.id?` id="${e(t.id)}"`:``;return`<button type="${n}" class="${i}"${t.action?` data-action="${e(t.action)}"`:``}${o}${t.attrs?` ${t.attrs}`:``}${a}>${e(t.label)}</button>`}).join(`
`)}function a(t){let r=t.titleId||(t.id?`${t.id}-title`:`modal-title-${Math.random().toString(36).slice(2,9)}`),a=t.id?` id="${e(t.id)}"`:``,o=t.className?` ${t.className}`:``,s=t.rootAttrs?` ${t.rootAttrs}`:``,c=`${n(t.size)}${t.cardClassName?` ${t.cardClassName}`:``}`,l=t.closeAction,u=t.lockBackdrop?``:` data-action="${e(l)}"`,d=t.hideClose?``:`<button type="button" class="modal-close info-modal-close" data-action="${e(l)}" aria-label="Close">×</button>`,f=``;t.footer!==void 0&&(f=typeof t.footer==`string`?t.footer:i(t.footer));let p=f?`<footer class="cal-modal-footer">${f}</footer>`:``,m=`<div class="cal-modal-body">${t.body}</div>`,h;return h=t.form?`<form class="stack"${t.formAttrs?` ${t.formAttrs}`:``}>
        ${m}
        ${p}
      </form>`:`${m}
      ${p}`,`<div class="cal-modal${o}"${a}${s} role="dialog" aria-modal="true" aria-labelledby="${e(r)}" data-focus-trap="1">
      <div class="cal-modal-backdrop"${u}></div>
      <div class="cal-modal-card${c}">
        <header class="cal-modal-header">
          <h3 id="${e(r)}">${e(t.title)}</h3>
          ${d}
        </header>
        ${h}
      </div>
    </div>`}function o(t){let n=t.style===`checkbox`?`checkbox`:`admin-delete-confirm`,r=t.style===`checkbox`?` style="margin-top:1rem"`:``,i=t.id?` id="${e(t.id)}"`:``,a=t.checked?` checked`:``,o=t.disabled?` disabled`:``;return`<label class="${n}"${r}>
            <input type="checkbox"${i} data-action="${e(t.action)}"${a}${o} />
            ${e(t.label)}
          </label>`}var s=`angaradav-portal-theme`;function c(e){return e===`dark`||e===`light`?e:null}function l(e){return`${s}:${e}`}function u(e){try{if(e){let t=c(localStorage.getItem(l(e)));if(t)return t}return c(localStorage.getItem(`angaradav-portal-theme`))??`dark`}catch{return`dark`}}function d(e,t){try{localStorage.setItem(s,e),t&&localStorage.setItem(l(t),e)}catch{}}function f(e){let t=document.documentElement;t.setAttribute(`data-theme`,e),t.style.colorScheme=e;let n=document.querySelector(`meta[name="color-scheme"]`);n&&n.setAttribute(`content`,e)}var p=`angaradav-portal-user-settings`,m={theme:`dark`,dayStartHour:8,dayEndHour:18,showWeekNumbers:!1};function h(e){let t=typeof e==`number`?e:Number(e);return!Number.isInteger(t)||t<0||t>23?null:t}function g(e){return{theme:c(e?.theme)??m.theme,dayStartHour:h(e?.dayStartHour)??m.dayStartHour,dayEndHour:h(e?.dayEndHour)??m.dayEndHour,showWeekNumbers:!!e?.showWeekNumbers}}function _(e){return`${p}:${e}`}function v(e){try{let t=localStorage.getItem(e);if(!t)return null;let n=JSON.parse(t);return!n||typeof n!=`object`?null:n}catch{return null}}function y(e){let t={...(e?v(_(e))??v(`angaradav-portal-user-settings`):v(`angaradav-portal-user-settings`))??{}};return c(t.theme)||(t.theme=u(e)),g(t)}function ee(e,t){let n=g(e);try{let e=JSON.stringify(n);localStorage.setItem(p,e),t&&localStorage.setItem(_(t),e)}catch{}d(n.theme,t)}function b(e){let t=y(e);return f(t.theme),t}function x(e){let t=[];for(let n=0;n<24;n++){let r=`${String(n).padStart(2,`0`)}:00`;t.push(`<option value="${n}" ${n===e?`selected`:``}>${r}</option>`)}return t.join(``)}function te(e){if(!e.userSettingsOpen||!e.user)return``;let n=e.userSettings,r=c(document.documentElement.getAttribute(`data-theme`))??n.theme;return a({id:`user-settings-modal`,title:`User settings`,closeAction:`user-settings-close`,form:!0,formAttrs:`data-form="user-settings"`,size:`sm`,body:`
    ${e.userSettingsError?t(`error`,e.userSettingsError,{role:`alert`,className:`user-settings-error`}):``}
    <div class="stack user-settings-form">
      <fieldset class="user-settings-fieldset">
        <legend>Theme</legend>
        <label class="check-row" data-action="set-theme" data-theme="dark">
          <input type="radio" name="theme" value="dark" ${r===`dark`?`checked`:``} />
          Dark
        </label>
        <label class="check-row" data-action="set-theme" data-theme="light">
          <input type="radio" name="theme" value="light" ${r===`light`?`checked`:``} />
          Light
        </label>
      </fieldset>
      <fieldset class="user-settings-fieldset">
        <legend>Calendar</legend>
        <label>Day starts at
          <select name="dayStartHour">${x(n.dayStartHour)}</select>
        </label>
        <label>Day ends at
          <select name="dayEndHour">${x(n.dayEndHour)}</select>
        </label>
        <label class="check-row">
          <input type="checkbox" name="showWeekNumbers" ${n.showWeekNumbers?`checked`:``} />
          Show week numbers
        </label>
      </fieldset>
    </div>`,footer:[{label:`Cancel`,action:`user-settings-close`,variant:`ghost`},{label:`Save`,type:`submit`}]})}function ne(e){let t=new FormData(e),n=c(String(t.get(`theme`)??``))??`dark`,r=h(t.get(`dayStartHour`)),i=h(t.get(`dayEndHour`));return r===null||i===null?{error:`Choose a start and end hour`}:i<=r?{error:`Day end must be after day start`}:{theme:n,dayStartHour:r,dayEndHour:i,showWeekNumbers:t.get(`showWeekNumbers`)===`on`}}function re(e){e.userSettingsOpen=!1,e.userSettingsError=null,f(e.userSettings.theme)}var ie={off:0,error:1,warn:2,info:3,debug:4},ae=`off`,oe=`[angaradav-portal]`;function se(e){let t=(e||`off`).toLowerCase().trim();return t===`error`||t===`warn`||t===`info`||t===`debug`||t===`off`?t:`off`}function ce(e){return ae=se(e),ae!==`off`&&console.info(oe,`log level = ${ae}`),ae}function le(e){return ie[ae]>=ie[e]}function ue(e,t,n,r){if(!le(e))return;let i=[oe,n];r!==void 0&&i.push(r),console[t](...i)}function de(e,t){le(`info`)&&(t&&Object.keys(t).length>0?console.info(oe,`event:${e}`,t):console.info(oe,`event:${e}`))}var S={error(e,t){ue(`error`,`error`,e,t)},warn(e,t){ue(`warn`,`warn`,e,t)},info(e,t){ue(`info`,`info`,e,t)},debug(e,t){ue(`debug`,`debug`,e,t)},event:de},C=class extends Error{status;payload;constructor(e,t,n={}){super(e),this.status=t,this.payload=n}},fe=``,pe=null,me=null;function he(e){fe=e&&typeof e==`string`?e:``}function ge(){return fe}function _e(e){pe=e}function ve(e){me=e}function ye(e){if(!be(e))try{me?.()}catch{}}function be(e){return e===`/login`||e===`/ui`||e===`/logout`||e===`/install/status`||e.startsWith(`/install/`)}function xe(e,t){if(!be(e)){he(``);try{pe?.(t||`Session timed out. Please sign in again.`)}catch{}}}async function Se(e){let t=typeof performance<`u`?performance.now():Date.now();S.debug(`api → GET ${e}`);let n=await fetch(`/api${e}`,{credentials:`same-origin`}),r=Math.round((typeof performance<`u`?performance.now():Date.now())-t);if(!n.ok){let t=`Request failed (${n.status})`,i={};try{let e=await n.json();i={...e},typeof e.error==`string`&&(t=e.error)}catch{}throw n.status>=500?S.error(`api ← GET ${e} ${n.status} (${r}ms)`,t):n.status===401?(S.debug(`api ← GET ${e} 401 (${r}ms)`),xe(e,t)):S.warn(`api ← GET ${e} ${n.status} (${r}ms)`,t),new C(t,n.status,i)}S.info(`api ← GET ${e} ${n.status} (${r}ms)`),ye(e);let i=n.headers.get(`Content-Type`)||`application/octet-stream`;return{blob:await n.blob(),contentType:i}}async function w(e,t={}){let n=new Headers(t.headers);t.body&&!n.has(`Content-Type`)&&n.set(`Content-Type`,`application/json`);let r=(t.method||`GET`).toUpperCase();r!==`GET`&&r!==`HEAD`&&r!==`OPTIONS`&&fe&&n.set(`X-CSRF-Token`,fe);let i=typeof performance<`u`?performance.now():Date.now();S.debug(`api → ${r} ${e}`);let a=await fetch(`/api${e}`,{...t,headers:n,credentials:`same-origin`}),o=null,s=await a.text();if(s)try{o=JSON.parse(s)}catch{o={error:s}}let c=Math.round((typeof performance<`u`?performance.now():Date.now())-i);if(!a.ok){let t=`Request failed (${a.status})`,n={};if(o&&typeof o==`object`&&o){let e=o;n={...e},typeof e.error==`string`&&(t=e.error)}else(a.status===500||a.status===504)&&(t=`Server error during import (often a timeout on large calendars). Try again — already imported events update faster.`);throw a.status>=500?S.error(`api ← ${r} ${e} ${a.status} (${c}ms)`,t):a.status===401?(S.debug(`api ← ${r} ${e} 401 (${c}ms)`),xe(e,t)):S.warn(`api ← ${r} ${e} ${a.status} (${c}ms)`,t),new C(t,a.status,n)}return S.info(`api ← ${r} ${e} ${a.status} (${c}ms)`),ye(e),o}function T(e){return encodeURIComponent(e)}async function Ce(e,t,n,r){let i=new Headers({"Content-Type":n,Accept:`application/x-ndjson, application/json;q=0.9`});fe&&i.set(`X-CSRF-Token`,fe);let a=typeof performance<`u`?performance.now():Date.now();S.debug(`api → POST ${e} (stream, ${n}, ${t.length} bytes)`);let o;try{o=await fetch(`/api${e}`,{method:`POST`,headers:i,credentials:`same-origin`,body:t})}catch(t){let n=t instanceof Error?t.message:`Network error`;throw S.error(`api ← POST ${e} network fail`,n),new C(`Import request failed to start (${n}). Check connectivity and container logs.`,0)}let s=(o.headers.get(`Content-Type`)||``).toLowerCase(),c=s.includes(`ndjson`)||s.includes(`x-ndjson`);if(!o.ok&&!c){let t=`Request failed (${o.status})`;try{let e=await o.json();e.error&&(t=e.error)}catch{}throw(o.status===504||o.status===502)&&(t=`Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes.`),o.status===401?(S.debug(`api ← POST ${e} 401`,t),xe(e,t)):S.warn(`api ← POST ${e} ${o.status}`,t),new C(t,o.status)}if(!c&&o.ok){try{let t=await o.json();if(t&&typeof t.error==`string`)throw new C(t.error,o.status||500);if(t&&typeof t.imported==`number`&&typeof t.updated==`number`)return S.info(`api ← POST ${e} json done`),t}catch(e){if(e instanceof C)throw e}throw new C(`Unexpected import response from server`,500)}if(!o.body)throw new C(`Import stream unavailable`,500);let l=o.body.getReader(),u=new TextDecoder,d=``,f={final:null,error:null,sawProgress:!1},p=e=>{let t;try{t=JSON.parse(e)}catch{S.debug(`import stream non-JSON line`,e.slice(0,80));return}if(t.type===`progress`){f.sawProgress=!0;let e=Number(t.total)||0,n=Number(t.current)||0,i=typeof t.percent==`number`?t.percent:e>0?Math.round(100*n/e):0;r?.({percent:i,current:n,total:e,imported:Number(t.imported)||0,updated:Number(t.updated)||0,skipped:Number(t.skipped)||0})}else t.type===`done`&&t.result?f.final=t.result:t.type===`error`&&(f.error={message:t.error||`Import failed`,status:t.status||500})};for(;;){let{done:e,value:t}=await l.read();if(e)break;d+=u.decode(t,{stream:!0});let n=d.split(`
`);d=n.pop()??``;for(let e of n){let t=e.trim();t&&p(t)}}d.trim()&&p(d.trim());let m=Math.round((typeof performance<`u`?performance.now():Date.now())-a);if(f.error)throw f.error.status===401?(S.debug(`api ← POST ${e} stream 401 (${m}ms)`,f.error.message),xe(e,f.error.message)):S.warn(`api ← POST ${e} stream error (${m}ms)`,f.error.message),new C(f.error.message,f.error.status);if(!f.final)throw S.error(`api ← POST ${e} stream incomplete (${m}ms)`,{sawProgress:f.sawProgress}),new C(f.sawProgress?`Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.`:`Import failed to start on the server. Check container logs and that you are on the latest image.`,500);return S.info(`api ← POST ${e} stream done (${m}ms)`),ye(e),f.final}var we={adminPing:()=>w(`/admin/ping`),adminDashboard:()=>w(`/admin/dashboard`),adminCapabilities:()=>w(`/admin/capabilities`),adminUsers:()=>w(`/admin/users`),adminUser:e=>w(`/admin/users/${encodeURIComponent(e)}`),adminCreateUser:e=>w(`/admin/users`,{method:`POST`,body:JSON.stringify(e)}),adminUpdateUser:(e,t)=>w(`/admin/users/${encodeURIComponent(e)}`,{method:`PATCH`,body:JSON.stringify(t)}),adminDeleteUser:(e,t=!0)=>w(`/admin/users/${encodeURIComponent(e)}`,{method:`DELETE`,body:JSON.stringify({confirm:t})}),adminUserCalendars:e=>w(`/admin/users/${encodeURIComponent(e)}/calendars`),adminCreateUserCalendar:(e,t)=>w(`/admin/users/${encodeURIComponent(e)}/calendars`,{method:`POST`,body:JSON.stringify(t)}),adminUpdateUserCalendar:(e,t,n)=>w(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:`PATCH`,body:JSON.stringify(n)}),adminDeleteUserCalendar:(e,t,n=!0)=>w(`/admin/users/${encodeURIComponent(e)}/calendars/${t}`,{method:`DELETE`,body:JSON.stringify({confirm:n})}),adminUserAddressBooks:e=>w(`/admin/users/${encodeURIComponent(e)}/addressbooks`),adminCreateUserAddressBook:(e,t)=>w(`/admin/users/${encodeURIComponent(e)}/addressbooks`,{method:`POST`,body:JSON.stringify(t)}),adminUpdateUserAddressBook:(e,t,n)=>w(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:`PATCH`,body:JSON.stringify(n)}),adminDeleteUserAddressBook:(e,t,n=!0,r=!1)=>w(`/admin/users/${encodeURIComponent(e)}/addressbooks/${t}`,{method:`DELETE`,body:JSON.stringify({confirm:n,force:r})}),adminSystemSettings:()=>w(`/admin/settings/system`),adminUpdateSystemSettings:e=>w(`/admin/settings/system`,{method:`PATCH`,body:JSON.stringify(e)}),adminSettingsBackup:()=>w(`/admin/settings/backup`),adminRestoreSettings:(e,t={})=>w(`/admin/settings/restore`,{method:`POST`,body:JSON.stringify({backup:e,dryRun:!!t.dryRun,confirm:!!t.confirm})}),adminResetToDefault:(e=!0,t=``)=>w(`/admin/settings/reset-to-default`,{method:`POST`,body:JSON.stringify({confirm:e,password:t})}),adminDatabaseSettings:()=>w(`/admin/settings/database`),adminTestDatabaseConnection:e=>w(`/admin/settings/database/test`,{method:`POST`,body:JSON.stringify(e)}),adminUpdateDatabaseSettings:e=>w(`/admin/settings/database`,{method:`PATCH`,body:JSON.stringify(e)}),me:async()=>{let e=await w(`/me`);return he(e.csrfToken||e.user?.csrfToken||``),e},login:async(e,t)=>{let n=await w(`/login`,{method:`POST`,body:JSON.stringify({username:e,password:t})});return he(n.user?.csrfToken),n},logout:async()=>{try{return await w(`/logout`,{method:`POST`})}finally{he(``)}}},Te={calendars:()=>w(`/calendars`),createCalendar:e=>w(`/calendars`,{method:`POST`,body:JSON.stringify(e)}),holidayCountries:()=>w(`/holidays/countries`),updateCalendar:(e,t)=>w(`/calendars/${e}`,{method:`PATCH`,body:JSON.stringify(t)}),deleteCalendar:e=>w(`/calendars/${e}`,{method:`DELETE`}),calendarEvents:(e,t,n)=>w(`/calendars/${e}/events?${new URLSearchParams({from:t,to:n}).toString()}`),getEvent:(e,t)=>w(`/calendars/${e}/events/${T(t)}`),createEvent:(e,t)=>w(`/calendars/${e}/events`,{method:`POST`,body:JSON.stringify(t)}),updateEvent:(e,t,n)=>w(`/calendars/${e}/events/${T(t)}`,{method:`PATCH`,body:JSON.stringify(n)}),deleteEvent:(e,t)=>w(`/calendars/${e}/events/${T(t)}`,{method:`DELETE`}),exportCalendar:async e=>{let t=await fetch(`/api/calendars/${e}/export`,{credentials:`same-origin`});if(!t.ok){let e=`Export failed (${t.status})`;try{let n=await t.json();n.error&&(e=n.error)}catch{}throw new C(e,t.status)}let n=t.headers.get(`Content-Disposition`)||``,r=/filename="([^"]+)"/i.exec(n)?.[1]||`calendar-${e}.ics`;return{blob:await t.blob(),filename:r}},importCalendar:(e,t,n)=>Ce(`/calendars/${e}/import`,t,`text/calendar; charset=utf-8`,n),directory:()=>w(`/directory`),shares:e=>w(`/calendars/${e}/shares`),share:(e,t,n)=>w(`/calendars/${e}/shares`,{method:`POST`,body:JSON.stringify({username:t,access:n})}),revoke:(e,t)=>w(`/calendars/${e}/shares`,{method:`DELETE`,body:JSON.stringify({href:t})})},Ee={addressbooks:()=>w(`/addressbooks`),createAddressBook:e=>w(`/addressbooks`,{method:`POST`,body:JSON.stringify(e)}),updateAddressBook:(e,t)=>w(`/addressbooks/${e}`,{method:`PATCH`,body:JSON.stringify(t)}),deleteAddressBook:(e,t=!1)=>w(`/addressbooks/${e}`,{method:`DELETE`,body:JSON.stringify({force:t})}),exportAddressBook:async e=>{let t=await fetch(`/api/addressbooks/${e}/export`,{credentials:`same-origin`});if(!t.ok){let e=`Export failed (${t.status})`;try{let n=await t.json();n.error&&(e=n.error)}catch{}throw new C(e,t.status)}let n=t.headers.get(`Content-Disposition`)||``,r=/filename="([^"]+)"/i.exec(n)?.[1]||`contacts-${e}.vcf`;return{blob:await t.blob(),filename:r}},importAddressBook:(e,t,n)=>Ce(`/addressbooks/${e}/import`,t,`text/vcard; charset=utf-8`,n),contacts:(e,t=``)=>w(`/addressbooks/${e}/contacts${t.trim()?`?q=${encodeURIComponent(t.trim())}`:``}`),getContact:(e,t)=>w(`/addressbooks/${e}/contacts/${T(t)}`),createContact:(e,t)=>w(`/addressbooks/${e}/contacts`,{method:`POST`,body:JSON.stringify(t)}),updateContact:(e,t,n)=>w(`/addressbooks/${e}/contacts/${T(t)}`,{method:`PATCH`,body:JSON.stringify(n)}),deleteContact:(e,t)=>w(`/addressbooks/${e}/contacts/${T(t)}`,{method:`DELETE`}),exportContact:async(e,t)=>{let n=await fetch(`/api/addressbooks/${e}/contacts/${T(t)}/export`,{credentials:`same-origin`});if(!n.ok){let e=`Export failed (${n.status})`;try{let t=await n.json();t.error&&(e=t.error)}catch{}throw new C(e,n.status)}let r=n.headers.get(`Content-Disposition`)||``,i=/filename="([^"]+)"/i.exec(r)?.[1]||`contact.vcf`;return{blob:await n.blob(),filename:i}},contactPhotoUrl:(e,t)=>`/api/addressbooks/${e}/contacts/${T(t)}/photo`,bulkContacts:(e,t)=>w(`/addressbooks/${e}/contacts/bulk`,{method:`POST`,body:JSON.stringify(t)}),exportContacts:async(e,t)=>{let n=await w(`/addressbooks/${e}/contacts/export`,{method:`POST`,body:JSON.stringify({uris:t})});return{blob:new Blob([n.vcf],{type:`text/vcard;charset=utf-8`}),filename:n.filename||`contacts.vcf`}}},De={filesStatus:()=>w(`/files`),filesList:(e=``)=>{let t=new URLSearchParams;return e&&t.set(`path`,e),w(`/files/entries${t.toString()?`?${t}`:``}`)},filesMkdir:(e,t)=>w(`/files/mkdir`,{method:`POST`,body:JSON.stringify({path:e,name:t})}),filesUpload:(e,t,n={})=>{let r=new URLSearchParams;e&&r.set(`path`,e),r.set(`name`,t.name),n.replace&&r.set(`replace`,`1`);let i=new FormData;i.append(`file`,t,t.name),e&&i.append(`path`,e);let a=typeof performance<`u`?performance.now():Date.now();return S.debug(`api → POST /files/upload path=${e||`/`} name=${t.name} size=${t.size}`),new Promise((e,o)=>{let s=new XMLHttpRequest;s.open(`POST`,`/api/files/upload?${r}`),s.withCredentials=!0;let c=ge();c&&s.setRequestHeader(`X-CSRF-Token`,c),n.onProgress&&(s.upload.onprogress=e=>{e.lengthComputable?n.onProgress?.(e.loaded,e.total):n.onProgress?.(e.loaded,t.size||e.loaded)}),s.onload=()=>{let t=Math.round((typeof performance<`u`?performance.now():Date.now())-a),n=null,r=s.responseText||``;if(r)try{n=JSON.parse(r)}catch{n={error:r}}let i=s.status;if(i<200||i>=300){let e=`Upload failed (${i||0})`;n&&typeof n==`object`&&n&&`error`in n&&typeof n.error==`string`&&(e=n.error),i===401?(S.debug(`api ← POST /files/upload 401 (${t}ms)`,e),xe(`/files/upload`,e)):i>=500?S.error(`api ← POST /files/upload ${i} (${t}ms)`,e):S.warn(`api ← POST /files/upload ${i} (${t}ms)`,e),o(new C(e,i||0));return}S.info(`api ← POST /files/upload 200 (${t}ms)`),ye(`/files/upload`),e(n)},s.onerror=()=>{let e=Math.round((typeof performance<`u`?performance.now():Date.now())-a);S.error(`api ← POST /files/upload network error (${e}ms)`),o(new C(`Upload failed (network error)`,0))},s.onabort=()=>{o(new C(`Upload cancelled`,0))},s.send(i)})},filesDownloadUrl:(e,t)=>{let n=new URLSearchParams;return n.set(`path`,e),t?.inline&&n.set(`inline`,`1`),`/api/files/download?${n}`},filesGetBlob:(e,t)=>{let n=new URLSearchParams;return n.set(`path`,e),t?.inline&&n.set(`inline`,`1`),Se(`/files/download?${n}`)},filesDelete:e=>w(`/files/entry`,{method:`DELETE`,body:JSON.stringify({path:e})}),filesRename:(e,t)=>w(`/files/rename`,{method:`POST`,body:JSON.stringify({path:e,newName:t})}),filesMove:(e,t,n)=>w(`/files/move`,{method:`POST`,body:JSON.stringify({from:e,to:t,newName:n})}),filesCopy:(e,t={})=>w(`/files/copy`,{method:`POST`,body:JSON.stringify({path:e,to:t.to,newName:t.newName})}),filesBulk:(e,t)=>w(`/files/bulk`,{method:`POST`,body:JSON.stringify({op:e,paths:t})})},Oe={tasks:(e={})=>{let t=new URLSearchParams;return e.q&&t.set(`q`,e.q),e.sort&&t.set(`sort`,e.sort),e.order&&t.set(`order`,e.order),w(`/tasks${t.toString()?`?${t}`:``}`)},createTask:e=>w(`/tasks`,{method:`POST`,body:JSON.stringify(e)}),updateTask:(e,t,n)=>w(`/tasks/${e}/${T(t)}`,{method:`PATCH`,body:JSON.stringify(n)}),deleteTask:(e,t,n)=>w(`/tasks/${e}/${T(t)}${n?.cascade?`?cascade=1`:``}`,{method:`DELETE`}),bulkTasks:e=>w(`/tasks/bulk`,{method:`POST`,body:JSON.stringify(e)}),notes:(e={})=>{let t=new URLSearchParams;return e.q&&t.set(`q`,e.q),e.sort&&t.set(`sort`,e.sort),e.order&&t.set(`order`,e.order),w(`/notes${t.toString()?`?${t}`:``}`)},createNote:e=>w(`/notes`,{method:`POST`,body:JSON.stringify(e)}),updateNote:(e,t,n)=>w(`/notes/${e}/${T(t)}`,{method:`PATCH`,body:JSON.stringify(n)}),deleteNote:(e,t)=>w(`/notes/${e}/${T(t)}`,{method:`DELETE`}),bulkNotes:e=>w(`/notes/bulk`,{method:`POST`,body:JSON.stringify(e)})},E={ui:()=>w(`/ui`),installStatus:async()=>{let e=await w(`/install/status`);return e&&typeof e==`object`&&`data`in e&&e.data?e.data:e},...we,...Te,...Ee,...Oe,...De},ke=`angaradav-portal-tab`,Ae=`angaradav-portal-admin-page`,je=`angaradav-portal-cal-selection`,Me=`2.5.0`;function Ne(e){let t=(e||`2.5.0`).trim(),n=t.indexOf(`+`);return n<=0?{version:t||`2.5.0`,build:``}:{version:t.slice(0,n),build:t.slice(n+1)}}var Pe=`https://github.com/offsyanka99/AngaraDAV/tree/main/docs`,Fe={status:`open`,due:``,calendar:``,percent:``},Ie=new Set([``,`open`,`NEEDS-ACTION`,`IN-PROCESS`,`COMPLETED`,`CANCELLED`]),Le=new Set([``,`overdue`,`today`,`upcoming`,`none`]),Re=new Set([``,`0`,`partial`,`100`]);function ze(e){let t=String(e?.status??Fe.status),n=String(e?.due??``),r=String(e?.calendar??``),i=String(e?.percent??``);return{status:Ie.has(t)?t:Fe.status,due:Le.has(n)?n:``,calendar:r,percent:Re.has(i)?i:``}}function Be(e){return new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime()}function Ve(e,t=new Date){if(!e)return`none`;let n=new Date(e);if(Number.isNaN(n.getTime()))return`none`;let r=Be(n),i=Be(t);return r<i?`overdue`:r===i?`today`:`upcoming`}function He(e){let t=e.toUpperCase();return t!==`COMPLETED`&&t!==`CANCELLED`}function Ue(e,t,n=new Date){if(t.status===`open`){if(e.status===`COMPLETED`)return!1}else if(t.status&&e.status!==t.status)return!1;if(t.due&&Ve(e.due,n)!==t.due||t.calendar&&e.calendarName!==t.calendar)return!1;if(t.percent===`0`){if((e.percent||0)!==0)return!1}else if(t.percent===`100`){if(e.percent!==100)return!1}else if(t.percent===`partial`){let t=e.percent||0;if(t<=0||t>=100)return!1}return!0}function We(e,t,n=new Date){return e.filter(e=>Ue(e,t,n))}function Ge(e){let t=new Date;return{user:null,flash:null,activeTab:e.activeTab,adminPage:e.adminPage,adminDashboard:null,adminDashboardLoading:!1,adminDashboardError:null,adminCapabilities:null,adminCapabilitiesError:null,adminUsers:[],adminUsersLoading:!1,adminUsersError:null,adminUsersQuery:``,adminSelectedUsername:e.adminSelectedUsername,adminUserDetail:null,adminUserDetailLoading:!1,adminUserDetailError:null,adminUserCreateOpen:!1,adminUserEditOpen:!1,adminUserDeleteUsername:null,adminUserDeleteConfirmChecked:!1,adminUserCalendars:[],adminUserAddressBooks:[],adminUserResourcesLoading:!1,adminCalModal:null,adminCalEditId:null,adminAbModal:null,adminAbEditId:null,adminResourceDelete:null,adminSystemSettings:null,adminSystemSettingsLoading:!1,adminSystemSettingsError:null,adminResetModalOpen:!1,adminResetConfirmChecked:!1,adminResetPassword:``,adminBackupBusy:!1,adminBackupError:null,adminRestoreFileName:null,adminRestoreDoc:null,adminRestorePreview:null,adminRestoreError:null,adminRestoreApplying:!1,adminDatabaseSettings:null,adminDatabaseSettingsLoading:!1,adminDatabaseSettingsError:null,adminDbFormBackend:`sqlite`,adminDbConfirmOpen:!1,adminDbConfirmText:``,adminDbPendingBody:null,userMenuOpen:!1,userMenuDocClick:null,userSettings:y(),userSettingsOpen:!1,userSettingsError:null,calendars:[],directory:[],holidayCountries:[],selectedId:null,selectedIds:[],calendarSelectionSeeded:!1,listKeyboardFocus:!1,shares:[],installGate:null,calModalOpen:!1,createCalModalOpen:!1,deleteConfirmId:null,deleteAbConfirmId:null,monthCursor:{y:t.getFullYear(),m:t.getMonth()},calView:`month`,weekScrollToDayStart:!1,weekWrapScrollTop:null,calFocusDay:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`,eventSearch:``,eventSearchFocus:!1,monthEvents:[],monthEventsLoading:!1,calendarEventsReady:!1,eventModalOpen:!1,editingEvent:null,creatingEvent:!1,eventDtPicker:null,bulkDueValue:``,monthExpandDay:null,addressBooks:[],selectedAbId:null,contacts:[],contactSearch:``,selectedContactUri:null,editingContact:null,creatingContact:!1,contactModalOpen:!1,abModalOpen:!1,photoPreview:null,photoBase64Pending:null,removePhotoPending:!1,busy:!1,importProgress:null,importElapsedTimer:null,filesUploadProgress:null,filesUploadElapsedTimer:null,filesUploadMenuOpen:!1,filesUploadMenuDocClick:null,filesUploadDropActive:!1,filesDropDepth:0,escapeBound:!1,portalEventsBound:!1,portalUi:{timeFormat:`auto`,weekStart:`auto`,logLevel:`off`,services:null},searchTimer:null,sessionIdleSeconds:900,sessionIdleTimer:null,appVersion:Me,handlingSessionExpiry:!1,tasks:[],notes:[],taskCalendars:[],noteCalendars:[],taskFilters:{...Fe},taskSearch:``,noteSearch:``,taskSort:`due`,taskOrder:`asc`,noteSort:`dtstart`,noteOrder:`desc`,selectedTaskKey:null,selectedNoteKey:null,editingTask:null,editingNote:null,creatingTask:!1,creatingNote:!1,taskModalOpen:!1,noteModalOpen:!1,checkedTaskKeys:[],checkedNoteKeys:[],checkedContactUris:[],filesStatus:null,filesPath:``,filesEntries:[],filesLoading:!1,filesRenamePath:null,filesDeletePaths:null,filesTransfer:null,filesTransferDest:``,filesTreeChildren:{},filesTreeExpanded:[],filesMkdirOpen:!1,filesSearch:``,filesSearchFocus:!1,filesSort:`name`,filesOrder:`asc`,filesTypeFilter:`all`,checkedFilePaths:[],filesItemMenu:null,filesItemMenuDocClick:null,filesItemMenuWinClose:null,filesPreview:null,filesPreviewSeq:0,filesUploadConflict:null,confirmDelete:null,dtPickerDocClick:null}}var Ke=4,qe=200,Je=5e3,Ye=1e4,Xe=350,Ze=12e3,D=null,Qe=null,$e=null,et=0,tt=!1,nt=!1,O=[];function rt(e,t,n){if(e===`error`)return null;if(n)return Ze;let r=t.trim().split(/\s+/).length;return Math.min(Ye,Math.max(Je,r*Xe))}function it(e){let t=document.createElement(`div`);return t.className=`sr-only`,t.setAttribute(`aria-live`,e),t.setAttribute(`aria-atomic`,`true`),t}function at(){D&&D.isConnected||(D=document.createElement(`div`),D.className=`toasts`,D.setAttribute(`role`,`region`),D.setAttribute(`aria-label`,`Notifications`),Qe=it(`polite`),$e=it(`assertive`),document.body.append(D,Qe,$e),D.addEventListener(`click`,ct),D.addEventListener(`mouseenter`,dt),D.addEventListener(`mouseleave`,ft),D.addEventListener(`focusin`,dt),D.addEventListener(`focusout`,ft),document.addEventListener(`visibilitychange`,()=>{document.hidden?dt():ft()}))}function ot(){return(!D||!D.isConnected)&&at(),D}function st(e,t){let n=e===`error`?$e:Qe;n&&(n.textContent=``,setTimeout(()=>{n.textContent=t},50))}function ct(e){let t=e.target?.closest(`.toast-close, .toast-action`);if(!t)return;let n=Number(t.closest(`.toast`)?.dataset.toastId??``);if(!Number.isFinite(n))return;e.preventDefault();let r=t.classList.contains(`toast-action`)?O.find(e=>e.id===n)?.action?.onClick:void 0;gt(n),r?.()}function lt(e){e.duration===null||tt||e.leaving||(e.startedAt=Date.now(),e.timer=setTimeout(()=>gt(e.id),e.remaining))}function ut(e){e.timer!==null&&(clearTimeout(e.timer),e.timer=null,e.remaining=Math.max(600,e.remaining-(Date.now()-e.startedAt)))}function dt(){if(!tt){tt=!0;for(let e of O)ut(e)}}function ft(){if(tt){tt=!1;for(let e of O)lt(e)}}function pt(e){let t=e.el;t.className=`toast toast-${e.type}`,t.dataset.toastId=String(e.id);let n=document.createElement(`span`);n.className=`toast-text`,n.textContent=e.message,e.countEl.className=`toast-count`,e.countEl.hidden=!0;let r=document.createElement(`button`);if(r.type=`button`,r.className=`toast-close`,r.setAttribute(`aria-label`,`Dismiss message`),r.title=`Dismiss`,r.textContent=`×`,t.append(n,e.countEl),e.action){let n=document.createElement(`button`);n.type=`button`,n.className=`toast-action`,n.textContent=e.action.label,t.append(n)}t.append(r)}function mt(){let e=O.filter(e=>!e.leaving);for(let t=0;t<e.length-Ke;t+=1)gt(e[t].id)}function ht(e,t,n={}){let r=t.trim();if(!r||e===`error`&&nt)return-1;e!==`error`&&(nt=!1);let i=O.find(t=>!t.leaving&&t.type===e&&t.message===r&&!t.action);if(i)return i.count+=1,i.countEl.textContent=`×${i.count}`,i.countEl.hidden=!1,ut(i),i.remaining=i.duration??0,lt(i),st(e,r),i.id;et+=1;let a=n.duration===void 0?rt(e,r,!!n.action):n.duration,o={id:et,type:e,message:r,el:document.createElement(`div`),countEl:document.createElement(`span`),count:1,duration:a,remaining:a??0,startedAt:Date.now(),timer:null,leaving:!1,action:n.action};return pt(o),O.push(o),ot().appendChild(o.el),requestAnimationFrame(()=>o.el.classList.add(`is-shown`)),mt(),lt(o),st(e,r),o.id}function gt(e){let t=O.findIndex(t=>t.id===e);if(t<0)return;let n=O[t];n.leaving||(ut(n),n.leaving=!0,n.el.classList.add(`is-leaving`),n.el.classList.remove(`is-shown`),setTimeout(()=>{n.el.remove();let e=O.indexOf(n);e>=0&&O.splice(e,1)},qe))}function _t(){for(let e of[...O])gt(e.id)}function vt(e){nt=e}var yt={show:ht,success:(e,t)=>ht(`success`,e,t),info:(e,t)=>ht(`info`,e,t),error:(e,t)=>ht(`error`,e,t),dismiss:gt,dismissAll:_t,setErrorsSuppressed:vt};function bt(e,t){yt.show(e,t)}function xt(e){e.flash=null,yt.setErrorsSuppressed(!1),yt.dismissAll()}function St(e){return e.flash?t(e.flash.type,e.flash.message,{dismissible:!0}):``}function Ct(e){return!!(e.user?.isAdmin||e.user?.role===`Admin`)}function wt(e){return Ct(e)?e.adminCapabilities===null||e.adminCapabilities.uiEnabled!==!1:!1}function Tt(e,t){if(!t)return;let n=(t.timeFormat||`auto`).toLowerCase(),r=(t.weekStart||`auto`).toLowerCase(),i=e.portalUi.services,a=i;if(t.services&&typeof t.services==`object`){let e=i??{caldav:!0,carddav:!0,tasks:!0,notes:!0,files:!0},n=t.services;a={caldav:typeof n.caldav==`boolean`?n.caldav:e.caldav,carddav:typeof n.carddav==`boolean`?n.carddav:e.carddav,tasks:typeof n.tasks==`boolean`?n.tasks:e.tasks,notes:typeof n.notes==`boolean`?n.notes:e.notes,files:typeof n.files==`boolean`?n.files:e.files}}e.portalUi={timeFormat:n===`12h`||n===`24h`?n:`auto`,weekStart:r===`monday`||r===`sunday`?r:`auto`,logLevel:t.logLevel||`off`,services:a},ce(e.portalUi.logLevel),typeof t.sessionIdleSeconds==`number`&&Number.isFinite(t.sessionIdleSeconds)&&t.sessionIdleSeconds>0&&(e.sessionIdleSeconds=Math.floor(t.sessionIdleSeconds)),typeof t.version==`string`&&t.version.trim()!==``&&(e.appVersion=t.version.trim())}function k(e,t){if(t===`admin`)return!0;let n=e.portalUi.services;if(!n)return!0;switch(t){case`calendars`:return n.caldav;case`contacts`:return n.carddav;case`tasks`:return n.tasks;case`notes`:return n.notes;case`files`:return n.files;default:return!0}}function Et(e){for(let t of[`calendars`,`contacts`,`tasks`,`notes`,`files`])if(k(e,t))return t;return`calendars`}function Dt(e){e.sessionIdleTimer!==null&&(clearTimeout(e.sessionIdleTimer),e.sessionIdleTimer=null)}function Ot(e,t){if(Dt(e),!e.user)return;let n=Math.max(30,e.sessionIdleSeconds)*1e3;e.sessionIdleTimer=setTimeout(()=>{e.sessionIdleTimer=null,t(`Your session timed out. Please sign in again.`)},n)}function kt(e,t){Dt(e),t.stopImportElapsedTimer(),e.importProgress=null,e.filesUploadProgress=null,t.stopFilesUploadElapsedTimer(),e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.user=null,e.calendars=[],e.shares=[],e.selectedId=null,e.selectedIds=[],e.calendarSelectionSeeded=!1,e.listKeyboardFocus=!1,e.directory=[],e.addressBooks=[],e.selectedAbId=null,e.contacts=[],e.selectedContactUri=null,e.editingContact=null,e.creatingContact=!1,e.contactModalOpen=!1,e.abModalOpen=!1,e.createCalModalOpen=!1,e.calModalOpen=!1,e.deleteConfirmId=null,e.deleteAbConfirmId=null,e.eventModalOpen=!1,e.userSettingsOpen=!1,e.userSettingsError=null,e.editingEvent=null,e.creatingEvent=!1,e.monthEvents=[],e.monthEventsLoading=!1,e.calendarEventsReady=!1,e.calView=`month`,e.weekScrollToDayStart=!1,e.weekWrapScrollTop=null,e.eventSearch=``,e.eventSearchFocus=!1;{let t=new Date;e.calFocusDay=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`,e.monthCursor={y:t.getFullYear(),m:t.getMonth()}}if(e.tasks=[],e.notes=[],e.taskCalendars=[],e.noteCalendars=[],e.selectedTaskKey=null,e.selectedNoteKey=null,e.editingTask=null,e.editingNote=null,e.taskFilters={status:`open`,due:``,calendar:``,percent:``},e.creatingTask=!1,e.creatingNote=!1,e.taskModalOpen=!1,e.noteModalOpen=!1,e.checkedTaskKeys=[],e.checkedNoteKeys=[],e.checkedContactUris=[],e.filesStatus=null,e.filesPath=``,e.filesEntries=[],e.filesLoading=!1,e.filesRenamePath=null,e.filesDeletePaths=null,t.resetFilesTransferTree(),e.filesMkdirOpen=!1,e.filesSearch=``,e.filesSearchFocus=!1,e.filesSort=`name`,e.filesOrder=`asc`,e.filesTypeFilter=`all`,e.filesItemMenu=null,e.filesItemMenuDocClick&&=(document.removeEventListener(`click`,e.filesItemMenuDocClick,!0),null),e.filesItemMenuWinClose&&=(window.removeEventListener(`resize`,e.filesItemMenuWinClose),null),e.filesPreview?.objectUrl)try{URL.revokeObjectURL(e.filesPreview.objectUrl)}catch{}e.filesPreview=null,e.filesPreviewSeq+=1,e.filesUploadMenuOpen=!1,t.unbindFilesUploadMenuOutside(),e.filesUploadDropActive=!1,e.filesUploadConflict=null,e.confirmDelete=null,e.dtPickerDocClick=null,e.checkedFilePaths=[],e.photoPreview=null,e.photoBase64Pending=null,e.removePhotoPending=!1,e.busy=!1,e.userMenuOpen=!1,e.adminDashboard=null,e.adminDashboardLoading=!1,e.adminDashboardError=null,e.adminCapabilities=null,e.adminCapabilitiesError=null,e.adminUsers=[],e.adminUsersLoading=!1,e.adminUsersError=null,e.adminUsersQuery=``,e.adminSelectedUsername=null,e.adminUserDetail=null,e.adminUserDetailLoading=!1,e.adminUserDetailError=null,e.adminUserCreateOpen=!1,e.adminUserEditOpen=!1,e.adminUserDeleteUsername=null,e.adminUserDeleteConfirmChecked=!1,e.adminUserCalendars=[],e.adminUserAddressBooks=[],e.adminUserResourcesLoading=!1,e.adminCalModal=null,e.adminCalEditId=null,e.adminAbModal=null,e.adminAbEditId=null,e.adminResourceDelete=null,e.adminSystemSettings=null,e.adminSystemSettingsLoading=!1,e.adminSystemSettingsError=null,e.adminResetModalOpen=!1,e.adminResetConfirmChecked=!1,e.adminResetPassword=``,e.adminDatabaseSettings=null,e.adminDatabaseSettingsLoading=!1,e.adminDatabaseSettingsError=null,e.adminDbFormBackend=`sqlite`,e.adminDbConfirmOpen=!1,e.adminDbConfirmText=``,e.adminDbPendingBody=null,t.unbindUserMenuOutside()}function At(e,t){if(!e.handlingSessionExpiry){if(!e.user){Dt(e);return}e.handlingSessionExpiry=!0;try{S.event(`session.expired`),t.clearSession(),yt.dismissAll(),yt.setErrorsSuppressed(!0),e.flash={type:`info`,message:t.message&&t.message.trim()?t.message:`Your session timed out. Please sign in again.`},t.render()}finally{e.handlingSessionExpiry=!1}}}function jt(e,t){let n=String(t.step||``);n===`upgrade`||n===`initialize`||n===`permissions`||n===`database`?(e.installGate={step:n,message:t.message||(n===`upgrade`?`Complete the upgrade wizard before signing in.`:`Complete setup before signing in.`),installUrl:t.installUrl||`/portal/install/`,productVersion:t.productVersion,configuredVersion:t.configuredVersion??null},typeof t.productVersion==`string`&&t.productVersion.trim()!==``&&(e.appVersion=t.productVersion.trim())):e.installGate=null}function Mt(e,t){if(!(t instanceof C)||t.status!==503)return!1;let n=typeof t.payload.code==`string`?t.payload.code:``;return n!==`upgrade_required`&&n!==`not_configured`&&n!==`admin_password_missing`?!1:(e.installGate={step:n===`upgrade_required`?`upgrade`:`initialize`,message:t.message,installUrl:typeof t.payload.installUrl==`string`?t.payload.installUrl:`/portal/install/`,productVersion:typeof t.payload.productVersion==`string`?t.payload.productVersion:void 0,configuredVersion:typeof t.payload.configuredVersion==`string`?t.payload.configuredVersion:null},e.installGate.productVersion&&(e.appVersion=e.installGate.productVersion),!0)}async function Nt(e){let{state:t}=e;if(t.activeTab===`admin`&&Ct(t)&&wt(t))try{t.adminPage===`overview`&&e.adminPageMeta(`overview`)?.available!==!1?await e.loadAdminDashboard():t.adminPage===`users`&&e.adminPageMeta(`users`)?.available!==!1?(await e.loadAdminUsers(),t.adminSelectedUsername&&(await e.loadAdminUserDetail(t.adminSelectedUsername),await e.loadAdminUserResources(t.adminSelectedUsername))):t.adminPage===`settings`&&e.adminPageMeta(`settings`)?.available!==!1?await e.loadAdminSystemSettings():t.adminPage===`database`&&e.adminPageMeta(`database`)?.available!==!1&&await e.loadAdminDatabaseSettings()}catch(e){S.warn(`admin page load`,e instanceof Error?e.message:e)}}async function Pt(e){let{state:t}=e;S.event(`bootstrap.start`),_e(t=>{e.handleSessionExpired(/timed\s*out|session expired/i.test(t)?t:`Your session timed out. Please sign in again.`)}),ve(()=>{Ot(t,t=>e.handleSessionExpired(t))});try{jt(t,await E.installStatus())}catch(e){S.debug(`bootstrap: /api/install/status failed`,e instanceof Error?e.message:e)}try{let e=await E.ui();Tt(t,e.ui),typeof e.version==`string`&&e.version.trim()!==``?t.appVersion=e.version.trim():e.ui&&typeof e.ui.version==`string`&&e.ui.version.trim()!==``&&(t.appVersion=e.ui.version.trim())}catch(e){S.debug(`bootstrap: /api/ui failed`,e instanceof Error?e.message:e),Mt(t,e)}if(t.installGate&&t.installGate.step!==`done`&&t.installGate.step!==`locked`){e.clearPortalSessionState(),S.event(`bootstrap.installGate`,{step:t.installGate.step}),e.render();return}try{let n=await E.me();if(!n.user)e.clearPortalSessionState(),Tt(t,n.ui),typeof n.version==`string`&&n.version.trim()!==``&&(t.appVersion=n.version.trim()),S.event(`bootstrap.anonymous`);else{if(t.user=n.user,t.userSettings=b(t.user.username),Tt(t,n.ui),typeof n.version==`string`&&n.version.trim()!==``&&(t.appVersion=n.version.trim()),S.event(`bootstrap.session`,{username:t.user?.username??null}),Ot(t,t=>e.handleSessionExpired(t)),Ct(t))try{await e.loadAdminCapabilities()}catch(e){S.warn(`admin.capabilities bootstrap`,e instanceof Error?e.message:e)}e.normalizeActiveTab(),e.persistTab(t.activeTab,t.adminPage),await e.loadHome(),await Nt(e)}}catch(t){t instanceof C&&t.status===401?(e.clearPortalSessionState(),S.event(`bootstrap.anonymous`)):(S.error(`bootstrap failed`,t instanceof Error?t.message:t),bt(`error`,t instanceof Error?t.message:`Failed to load`))}e.render()}async function Ft(e,t){let{state:n}=t,r=new FormData(e),i=String(r.get(`username`)??``),a=String(r.get(`password`)??``);n.busy=!0,t.clearFlash(),t.render(),S.event(`login.attempt`,{username:i});try{let e=await E.login(i,a);if(n.user=e.user,n.userSettings=b(n.user?.username??i),Tt(n,e.ui),S.event(`login.ok`,{username:n.user?.username??i}),Ot(n,e=>t.handleSessionExpired(e)),Ct(n))try{await t.loadAdminCapabilities()}catch(e){S.warn(`admin.capabilities login`,e instanceof Error?e.message:e)}t.normalizeActiveTab(),t.persistTab(n.activeTab,n.adminPage),await t.loadHome(),await Nt(t),t.setFlash(`success`,`Signed in`)}catch(e){S.warn(`login.failed`,e instanceof Error?e.message:e),t.setFlash(`error`,e instanceof Error?e.message:`Login failed`)}finally{n.busy=!1,t.render()}}function It(t,n,r){let i=n.installGate,a=i&&(i.step===`upgrade`||i.step===`initialize`||i.step===`permissions`||i.step===`database`),o=i?.installUrl||`/portal/install/`,s=``;if(a&&i){let t=i.step===`upgrade`?`Server upgrade required`:`Setup incomplete`,n=i.step===`upgrade`&&(i.configuredVersion||i.productVersion)?`<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${e(String(i.configuredVersion||`—`))}</span>
              → product <span class="mono">${e(String(i.productVersion||`—`))}</span></p>`:``;s=`
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${e(t)}.</strong>
            ${e(i.message||`Complete the installer before signing in.`)}
            ${n}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${e(o)}">Open installer</a>
        </p>`}let c=n.busy||!!a;t.innerHTML=r(`<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${s}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials.</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${c?`disabled`:``} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${c?`disabled`:``} />
            </label>
            <button type="submit" class="btn btn-primary" ${c?`disabled`:``}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            This portal is for calendars, contacts, tasks/notes and files.
          </p>
        </div>
      </div>`,{auth:!0})}function Lt(e){let t=e.querySelector(`.contacts-table-wrap`),n=e.querySelector(`.contacts-ab-list`),r=e.querySelector(`.calendars-owned-list`),i=e.querySelector(`.files-table-wrap`),a=e.querySelector(`.week-wrap`);return{windowX:window.scrollX,windowY:window.scrollY,tableTop:t?.scrollTop??null,abListTop:n?.scrollTop??null,calListTop:r?.scrollTop??null,filesTableTop:i?.scrollTop??null,weekWrapTop:a?.scrollTop??null}}function Rt(e,t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){let n=e.querySelector(`.contacts-table-wrap`);n&&(n.scrollTop=t.tableTop)}if(t.abListTop!==null){let n=e.querySelector(`.contacts-ab-list`);n&&(n.scrollTop=t.abListTop)}if(t.calListTop!==null){let n=e.querySelector(`.calendars-owned-list`);n&&(n.scrollTop=t.calListTop)}if(t.filesTableTop!==null){let n=e.querySelector(`.files-table-wrap`);n&&(n.scrollTop=t.filesTableTop)}let n=e.querySelector(`.week-wrap`);if(n){let e=n.dataset.alignHour;if(e!==void 0&&e!==``){let t=parseFloat(getComputedStyle(n).getPropertyValue(`--week-hour`))||40,r=Number(e);Number.isFinite(r)&&(n.scrollTop=r*t)}else t.weekWrapTop!==null&&(n.scrollTop=t.weekWrapTop)}})})}var zt=`hummersoft@mailbox.org`,Bt=`AngaraDAV`,Vt=`https://github.com/offsyanka99/AngaraDAV`;function Ht(t){let{version:n,build:r}=Ne(t.appVersion),i=r||`—`;return`
    <div class="info-modal" id="about-modal" hidden role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div class="info-modal-backdrop" data-action="about-close"></div>
      <div class="info-modal-card about-modal-card">
        <header class="info-modal-header">
          <h3 id="about-modal-title">About</h3>
          <button type="button" class="modal-close info-modal-close" data-action="about-close" aria-label="Close">×</button>
        </header>
        <div class="about-modal-body">
          <img class="about-logo" src="/logo.png" width="72" height="72" alt="" />
          <p class="about-name">${e(Bt)}</p>
          <dl class="about-meta">
            <div><dt>Version</dt><dd class="mono">${e(n)}</dd></div>
            <div><dt>Build</dt><dd class="mono">${e(i)}</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:${e(zt)}">${e(zt)}</a></dd></div>
            <div><dt>GitHub</dt><dd><a href="${e(Vt)}" target="_blank" rel="noopener noreferrer">${e(Vt.replace(/^https:\/\//,``))}</a></dd></div>
          </dl>
        </div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="about-close">Close</button>
        </footer>
      </div>
    </div>`}function Ut(e){let t=e.querySelector(`#about-modal`);t&&(t.hidden=!1,document.body.classList.add(`info-modal-open`),t.querySelector(`.info-modal-close`)?.focus())}function Wt(e){let t=e.querySelector(`#about-modal`);if(!t)return;t.hidden=!0;let n=e.querySelector(`#info-modal`);(!n||n.hidden)&&document.body.classList.remove(`info-modal-open`)}function Gt(e){let t=e.querySelector(`#about-modal`);return!!t&&!t.hidden}function Kt(t,n,r={}){let i=!!t.user&&t.activeTab===`admin`&&Ct(t)&&wt(t),a=`
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${i?`brand-portal brand-portal-admin`:`brand-portal brand-portal-user`}">${e(i?`Administration Portal`:`User Portal`)}</span></span>`,o=t.user?e(t.user.displayname||t.user.username):``,s=wt(t)?`<button type="button" class="user-menu-item${t.activeTab===`admin`?` is-active`:``}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`:``,c=i?`<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`:``,l=t.user?`<div class="user-menu${t.userMenuOpen?` is-open`:``}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${t.userMenuOpen?`true`:`false`}"
              title="${o}">
              <span class="user-menu-name">${o}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${t.userMenuOpen?``:`hidden`}>
              ${c}
              ${s}
              <button type="button" class="user-menu-item" role="menuitem" data-action="user-settings-open">
                User settings
              </button>
              <div class="user-menu-sep" role="separator"></div>
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`:``,u=t.user?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            ${l}
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,d=r.auth?St(t):``,f=r.tabs&&r.tabs.trim()!==``?`<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${r.tabs}
        </div>
      </div>`:``,p=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal</span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="footer-link" data-action="about-open">About</button>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${e(Pe)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>
      ${Ht(t)}
      ${te(t)}`;return r.auth?document.body.className=`layout-auth`:document.body.classList.remove(`layout-auth`),`<div class="app-chrome">
      ${u}
      ${f}
    </div>
      <main class="container">
        ${d}
        ${n}
      </main>
      ${p}`}function qt(e){e.userMenuDocClick&&=(document.removeEventListener(`click`,e.userMenuDocClick,!0),null)}function Jt(e,t){qt(e),e.userMenuDocClick=n=>{n.target?.closest?.(`.user-menu`)||(e.userMenuOpen=!1,qt(e),t())};let n=e.userMenuDocClick;setTimeout(()=>{e.userMenuOpen&&e.userMenuDocClick===n&&document.addEventListener(`click`,n,!0)},0)}function Yt(e){e.dtPickerDocClick&&=(document.removeEventListener(`click`,e.dtPickerDocClick,!0),null)}function Xt(e,t){if(Yt(e),!e.eventDtPicker)return;e.dtPickerDocClick=n=>{let r=n.target;r?.closest?.(`.dt-field.is-open, .dt-popover, [data-dt-popover]`)||r?.closest?.(`[data-action="dt-open"]`)||(e.eventDtPicker=null,Yt(e),t())};let n=e.dtPickerDocClick;setTimeout(()=>{e.eventDtPicker&&e.dtPickerDocClick===n&&document.addEventListener(`click`,n,!0)},0)}function Zt(e,t){return!t||e.includes(t)?e:[t]}function Qt(e,t){let n=new Map(e.map(e=>[e.path,e])),r=[];for(let e of t){let t=n.get(e);t&&r.push(t)}let i=r.filter(e=>e.type===`file`),a=r.length;return{count:a,heading:a>1?`${a} items`:null,showDownload:i.length>0,downloadItems:i.map(e=>({path:e.path,name:e.name})),renameEnabled:a===1,renamePath:a===1?r[0].path:null,renameName:a===1?r[0].name:null}}function $t(e){return!!(e.busy||e.filesRenamePath||e.filesDeletePaths||e.filesTransfer||e.filesMkdirOpen||e.filesPreview||e.filesUploadConflict||e.filesUploadProgress)}function A(e){tn(e),e.state.filesItemMenu=null}function en(e,t,n){!t||$t(e.state)||e.state.filesEntries.some(e=>e.path===t)&&(e.state.checkedFilePaths=Zt(e.state.checkedFilePaths,t),e.state.filesItemMenu={path:t,x:n.x,y:n.y,origin:n.origin},e.state.filesUploadMenuOpen=!1,e.render())}function tn(e){e.state.filesItemMenuDocClick&&(document.removeEventListener(`click`,e.state.filesItemMenuDocClick,!0),e.state.filesItemMenuDocClick=null),e.state.filesItemMenuWinClose&&(window.removeEventListener(`resize`,e.state.filesItemMenuWinClose),e.state.filesItemMenuWinClose=null)}function nn(e){tn(e),e.state.filesItemMenuDocClick=t=>{let n=t.target;n?.closest?.(`#files-item-menu`)||n?.closest?.(`[data-action="files-item-menu-toggle"]`)||(A(e),e.render())};let t=e.state.filesItemMenuDocClick;setTimeout(()=>{e.state.filesItemMenu&&e.state.filesItemMenuDocClick===t&&document.addEventListener(`click`,t,!0)},0),e.state.filesItemMenuWinClose=()=>{e.state.filesItemMenu&&(A(e),e.render())},window.addEventListener(`resize`,e.state.filesItemMenuWinClose)}function rn(e){let t=e.root.querySelector(`#files-item-menu`);if(!t||!e.state.filesItemMenu)return;an(e),requestAnimationFrame(()=>an(e));let n=e.root.querySelector(`.files-table-wrap`),r=e.state.filesItemMenuWinClose;n&&r&&n.addEventListener(`scroll`,r,{passive:!0});let i=[...t.querySelectorAll(`[role="menuitem"]:not([disabled])`)];e.state.filesItemMenu.origin===`button`&&i.length>0&&!t.contains(document.activeElement)&&i[0].focus(),t.addEventListener(`keydown`,e=>{if(e.key!==`ArrowDown`&&e.key!==`ArrowUp`&&e.key!==`Home`&&e.key!==`End`)return;let n=[...t.querySelectorAll(`[role="menuitem"]:not([disabled])`)];if(n.length===0)return;e.preventDefault();let r=document.activeElement,i=r?n.indexOf(r):-1,a=0;e.key===`ArrowDown`?a=i<0?0:(i+1)%n.length:e.key===`ArrowUp`?a=i<0?n.length-1:(i-1+n.length)%n.length:e.key===`End`&&(a=n.length-1),n[a]?.focus()})}function an(e){let t=e.root.querySelector(`#files-item-menu`),n=e.state.filesItemMenu;if(!t||!n)return;let r=n.x,i=n.y;if(n.origin===`button`){let t=e.root.querySelector(`.files-row-menu-btn[data-path="${CSS.escape(n.path)}"]`);if(t){let e=t.getBoundingClientRect();r=e.right,i=e.bottom+4}}t.style.left=`${r}px`,t.style.top=`${i}px`;let a=t.getBoundingClientRect(),o=n.origin===`button`?r-a.width:r,s=i;o+a.width>window.innerWidth-8&&(o=window.innerWidth-8-a.width),o<8&&(o=8),s+a.height>window.innerHeight-8&&(s=i-a.height-(n.origin===`button`?8:0)),s<8&&(s=8),t.style.left=`${Math.round(o)}px`,t.style.top=`${Math.round(s)}px`}function on(t){let n=t.state.filesItemMenu;if(!n)return``;let r=Qt(t.state.filesEntries,t.state.checkedFilePaths);if(r.count===0)return``;let i=t.state.busy?`disabled`:``,a=r.showDownload?`<button type="button" class="files-item-menu-item" role="menuitem"
          data-action="files-bulk-download" ${i}>Download</button>
       <div class="files-item-menu-sep" role="separator"></div>`:``,o=t.state.busy||!r.renameEnabled,s=r.renamePath??``,c=r.renameName??``,l=r.heading?`<div class="files-item-menu-heading" id="files-item-menu-label">${e(r.heading)}</div>`:``;return`<div id="files-item-menu" class="files-item-menu" role="menu"${r.heading?` aria-labelledby="files-item-menu-label"`:``}
            style="left:${n.x}px;top:${n.y}px">
    ${l}
    ${a}
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-copy" ${i}>Copy</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-move" ${i}>Move</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-rename-open" data-path="${e(s)}" data-name="${e(c)}"
      ${o?`disabled`:``}
      title="${r.renameEnabled?`Rename`:`Select a single item to rename`}">Rename</button>
    <div class="files-item-menu-sep" role="separator"></div>
    <button type="button" class="files-item-menu-item is-danger" role="menuitem"
      data-action="files-bulk-delete" ${i}>Delete</button>
  </div>`}function sn(e){e.forEach((e,t)=>{window.setTimeout(()=>{let t=document.createElement(`a`);t.href=E.filesDownloadUrl(e.path),t.download=e.name,t.rel=`noopener`,document.body.appendChild(t),t.click(),t.remove(),S.event(`files.download`,{path:e.path,via:`selection`})},t*100)})}async function j(e){e.state.filesLoading=!0;try{S.debug(`loadFiles`,{path:e.state.filesPath});let[t,n]=await Promise.all([E.filesStatus(),E.filesList(e.state.filesPath).catch(t=>{if(t instanceof C&&(t.status===503||t.status===404))return{path:e.state.filesPath,entries:[]};throw t})]);if(e.state.filesStatus=t,t.ready){e.state.filesPath=n.path,e.state.filesEntries=n.entries;let t=new Set(e.state.filesEntries.map(e=>e.path));e.state.checkedFilePaths=e.state.checkedFilePaths.filter(e=>t.has(e)),e.state.filesItemMenu&&!t.has(e.state.filesItemMenu.path)&&A(e)}else e.state.filesEntries=[],e.state.checkedFilePaths=[],A(e);S.event(`loadFiles`,{path:e.state.filesPath,count:e.state.filesEntries.length,enabled:t.enabled,ready:t.ready})}finally{e.state.filesLoading=!1}}function cn(...e){return e.map(e=>e.replace(/\\/g,`/`).replace(/^\/+|\/+$/g,``)).filter(Boolean).join(`/`)}function ln(e){let t=e.replace(/\\/g,`/`).split(`/`).filter(Boolean);return t[t.length-1]||e}function un(e,t,n){for(let e of n)if(e&&(t===e||t.startsWith(`${e}/`)))return!0;return!1}function M(e){e.state.filesTransfer=null,e.state.filesTransferDest=``,e.state.filesTreeChildren={},e.state.filesTreeExpanded=[]}async function dn(e,t,n){if(n.length===0)return;e.state.filesTransfer={op:t,paths:[...n]},e.state.filesTransferDest=e.state.filesPath,e.state.filesTreeChildren={};let r=new Set([``]);if(e.state.filesPath){let t=e.state.filesPath.split(`/`).filter(Boolean),n=``;for(let e of t)n=n?`${n}/${e}`:e,r.add(n)}e.state.filesTreeExpanded=[...r],e.state.filesRenamePath=null,e.state.filesDeletePaths=null,e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,e.state.filesUploadMenuDocClick&&(document.removeEventListener(`click`,e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null),A(e),e.clearFlash(),e.render(),await Promise.all([...r].map(t=>fn(e,t)))}async function fn(e,t){let n=e.state.filesTreeChildren[t];if(!(n&&n!==`error`)){e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:`loading`},e.render();try{let n=(await E.filesList(t)).entries.filter(e=>e.type===`dir`).slice().sort((e,t)=>e.name.localeCompare(t.name,void 0,{sensitivity:`base`}));if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:n}}catch(n){if(!e.state.filesTransfer)return;e.state.filesTreeChildren={...e.state.filesTreeChildren,[t]:`error`},S.warn(`files.tree`,{path:t||`/`,error:n instanceof Error?n.message:String(n)})}e.render()}}function pn(t){if(!t.state.filesTransfer)return``;let n=t.state.filesTransfer.paths,r=[],i=(a,o)=>{let s=t.state.filesTransferDest===a,c=un(t,a,n),l=t.state.filesTreeExpanded.includes(a),u=t.state.filesTreeChildren[a],d=Array.isArray(u),f=a===``||u===`loading`||u===`error`||!d||u.length>0,p=a===``?`Home`:ln(a),m=c?`Cannot use a selected item (or a folder inside it) as the destination`:a===``?`File home host.root`:a,h=l?`▾`:`▸`;if(r.push(`<div class="files-tree-row${s?` is-selected`:``}${c?` is-blocked`:``}" style="--depth:${o}" role="treeitem" aria-selected="${s}" aria-expanded="${l}" aria-disabled="${c}">
      ${f?`<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${e(a)}"
              aria-label="${l?`Collapse`:`Expand`} ${e(p)}" ${t.state.busy?`disabled`:``}>${h}</button>`:`<span class="files-tree-toggle-spacer" aria-hidden="true"></span>`}
      <button type="button" class="files-tree-select${s?` is-selected`:``}" data-action="files-tree-select" data-path="${e(a)}"
        title="${e(m)}" ${t.state.busy||c?`disabled`:``}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${e(p)}</span>
      </button>
    </div>`),l){if(u===`loading`){r.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Loading…</div>`);return}if(u===`error`){r.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${e(a)}" ${t.state.busy?`disabled`:``}>Retry</button>
        </div>`);return}if(d){for(let e of u)i(e.path,o+1);u.length===0&&a===``&&r.push(`<div class="files-tree-status muted small" style="--depth:${o+1}">No subfolders yet — destination will be Home.</div>`)}}};return i(``,0),`<div class="files-folder-tree" role="tree" aria-label="Destination folder">${r.join(``)}</div>`}async function mn(e,t){if(!e.state.filesTransfer||e.state.filesTransfer.paths.length===0)return;let n=new FormData(t),r=(e.state.filesTransferDest||String(n.get(`toPath`)??``)).trim().replace(/^\/+|\/+$/g,``),i=String(n.get(`newName`)??``).trim(),a=e.state.filesTransfer.op,o=[...e.state.filesTransfer.paths],s=o.length>1;if(un(e,r,o)){e.setFlash(`error`,`Choose a different destination folder`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();let c=0,l=[];try{for(let e of o)try{if(a===`copy`){let t=ln(e),n=s||!i||i===t?void 0:i,a=await E.filesCopy(e,{to:r,newName:n});S.event(`files.copy`,{path:e,to:a.entry.path})}else{let t=ln(e),n=s||!i||i===t?void 0:i;await E.filesMove(e,r,n),S.event(`files.move`,{path:e,to:r})}c+=1}catch(t){l.push(`${ln(e)}: ${t instanceof Error?t.message:`failed`}`)}M(e),e.state.checkedFilePaths=[],await j(e);let t=a===`copy`?`Copied`:`Moved`;c>0&&l.length===0?e.setFlash(`success`,c===1?`${t} 1 item`:`${t} ${c} items`):c>0?e.setFlash(`info`,`${t} ${c}; ${l.length} failed. ${l[0]}`):e.setFlash(`error`,l[0]||`${a===`copy`?`Copy`:`Move`} failed`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Operation failed`)}finally{e.state.busy=!1,e.render()}}function hn(...e){return e.map(e=>e.replace(/\\/g,`/`).replace(/^\/+|\/+$/g,``)).filter(Boolean).join(`/`)}function gn(e){if(!e||typeof e!=`object`)return!1;let t=e.name;return t===`AbortError`||t===`NotAllowedError`}function _n(e,t=!0){return Array.from(e).map(e=>({file:e,relativePath:(e.webkitRelativePath||``).replace(/\\/g,`/`).replace(/^\/+/,``)||e.name||e.name}))}function vn(e){return new Promise((t,n)=>{let r=[],i=()=>{e.readEntries(e=>{if(!e.length){t(r);return}r.push(...e),i()},e=>n(e))};i()})}function yn(e){return new Promise((t,n)=>{e.file(t,n)})}async function bn(e,t){let n=hn(t,e.name);if(e.isFile)return[{file:await yn(e),relativePath:n||e.name}];if(e.isDirectory){let t=await vn(e.createReader());if(t.length===0)return[{file:null,relativePath:n,isEmptyDir:!0}];let r=[];for(let e of t)r.push(...await bn(e,n));return r}return[]}async function*xn(e){let t=e;if(typeof t.values==`function`){for await(let e of t.values())yield e;return}if(typeof t.entries==`function`)for await(let[,e]of t.entries())yield e}async function Sn(e,t){let n=hn(t,e.name),r=[],i=0;for await(let t of xn(e))if(i+=1,t.kind===`file`){let e=await t.getFile();r.push({file:e,relativePath:hn(n,t.name)||e.name})}else t.kind===`directory`&&r.push(...await Sn(t,n));return i===0&&r.push({file:null,relativePath:n,isEmptyDir:!0}),r}async function Cn(){let e=window;if(typeof e.showOpenFilePicker!=`function`)return{kind:`fallback`};try{let t=await e.showOpenFilePicker({multiple:!0});if(!t||t.length===0)return{kind:`cancel`};let n=[];for(let e of t){let t=await e.getFile();n.push({file:t,relativePath:t.name})}return{kind:`items`,items:n}}catch(e){return gn(e)?{kind:`cancel`}:{kind:`fallback`}}}async function wn(){let e=window;if(typeof e.showDirectoryPicker!=`function`)return{kind:`fallback`};try{let t=await Sn(await e.showDirectoryPicker({mode:`read`}),``);return t.length===0?{kind:`cancel`}:{kind:`items`,items:t}}catch(e){return gn(e)?{kind:`cancel`}:{kind:`fallback`}}}function Tn(e){return e.replace(/\\/g,`/`).replace(/^\/+/,``).replace(/\/+$/,``)}function En(e){let t=e.files?Array.from(e.files):[],n=[],r=[],i=e.items?Array.from(e.items):[];for(let e of i){if(e.kind!==`file`)continue;let t=e;typeof t.getAsFileSystemHandle==`function`?n.push(t.getAsFileSystemHandle().catch(()=>null)):n.push(Promise.resolve(null));let i=null;if(typeof t.webkitGetAsEntry==`function`)try{i=t.webkitGetAsEntry()}catch{i=null}r.push(i)}return{handlePromises:n,entries:r,files:t}}async function Dn(e){let t=[],n=await Promise.all(e.handlePromises);for(let r=0;r<Math.max(n.length,e.entries.length);r++){let i=n[r]??null;if(i)try{if(i.kind===`file`){let e=await i.getFile();t.push({file:e,relativePath:e.name})}else i.kind===`directory`&&t.push(...await Sn(i,``));continue}catch{}let a=e.entries[r];if(a)try{t.push(...await bn(a,``))}catch{}}let r=_n(e.files,!0),i=new Map;for(let e of r){let t=Tn(e.relativePath||e.file?.name||``);t&&i.set(t,e)}for(let e of t){let t=Tn(e.relativePath||e.file?.name||``);t&&i.set(t,e)}return Array.from(i.values())}function On(e){if(!e)return!1;if(e.types&&typeof e.types.includes==`function`)return e.types.includes(`Files`);try{for(let t=0;t<e.types.length;t++)if(e.types[t]===`Files`)return!0}catch{}return!1}function kn(e,t=80){let n=String(e??``).replace(/\s+/g,` `).trim();return n?n.length>t?`${n.slice(0,t-1)}…`:n:``}function An(e,t,n){let r=kn(t);return r?`${e} “${r}” ${n}`:`${e} ${n}`}function jn(e){return kn(e.displayname||e.fullname)||[e.firstname,e.lastname].map(e=>String(e??``).trim()).filter(Boolean).join(` `)||`Unnamed contact`}function Mn(e){if(!e)return`—`;try{let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:`numeric`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})}catch{return e}}function Nn(e){return!Number.isFinite(e)||e<0?``:e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(1)} MB`}function N(e){let t=Math.max(0,Math.floor(e)),n=Math.floor(t/60),r=t%60;return n>0?`${n}m ${r}s`:`${r}s`}function P(e){return!Number.isFinite(e)||e<0?`—`:e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:e<1073741824?`${(e/1048576).toFixed(1)} MB`:`${(e/1073741824).toFixed(2)} GB`}function Pn(e){if(!e)return`—`;try{return new Date(e*1e3).toLocaleString()}catch{return`—`}}function F(t,n,r,i,a,o=``){let s=r===n,c=s?i===`asc`?` ▲`:` ▼`:``;return`<th class="${`sortable-th${s?` is-sorted`:``}${o?` `+o:``}`}" data-action="sort-${a}" data-sort="${e(n)}" role="columnheader" tabindex="0">${e(t)}${c}</th>`}var Fn=new Set([`docx`,`xlsx`,`pptx`,`odt`,`ods`,`odp`,`doc`,`xls`,`ppt`]),In=new Set([`jpg`,`jpeg`,`jfif`,`png`,`gif`,`webp`,`bmp`,`avif`,`ico`,`heic`,`heif`]),Ln=new Set([`mp3`,`wav`,`ogg`,`oga`,`flac`,`aac`,`m4a`,`opus`,`weba`]),Rn=new Set([`mp4`,`m4v`,`webm`,`ogv`,`mov`]),zn=new Set(`txt.md.markdown.rst.csv.tsv.json.jsonc.xml.yml.yaml.html.htm.xhtml.js.mjs.cjs.ts.tsx.jsx.css.scss.less.php.py.rb.go.rs.java.c.h.cpp.hpp.cs.sh.bash.zsh.sql.log.ini.conf.cfg.env.toml.diff.patch.vue.svelte.svg.rss.atom.ics.vcf.eml.nfo.rtf.tex.lua.kt.swift.pl.pm`.split(`.`));function Bn(e){let t=e.split(/[/\\]/).pop()||e,n=t.lastIndexOf(`.`);return n<=0?``:t.slice(n+1).toLowerCase()}function Vn(e){let t=Bn(e);return In.has(t)?`image`:t===`pdf`?`pdf`:Ln.has(t)?`audio`:Rn.has(t)?`video`:Fn.has(t)?`office`:zn.has(t)?`text`:`unsupported`}function Hn(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function Un(e){return e.replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&apos;/g,`'`).replace(/&#(\d+);/g,(e,t)=>String.fromCharCode(Number(t))).replace(/&#x([0-9a-fA-F]+);/g,(e,t)=>String.fromCharCode(parseInt(t,16)))}function Wn(e,t){let n=[],r=new RegExp(t.source,t.flags.includes(`g`)?t.flags:`${t.flags}g`),i;for(;i=r.exec(e);)n.push(i[1]??i[0]);return n}function I(e,t){let n=RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${t}>`,`gi`);return e.match(n)??[]}function L(e,t){return Wn(e,RegExp(`<(?:[\\w.-]+:)?${t}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${t}>`,`gi`)).map(e=>Un(e.replace(/<[^>]+>/g,``)))}function Gn(e){let t=I(e,`p`);if(t.length===0){let t=L(e,`t`).join(` `).trim();return t?`<p>${Hn(t)}</p>`:``}let n=[];for(let e of t){let t=I(e,`r`),r=[],i=t.length?t:[e];for(let e of i){let t=L(e,`t`).join(``);if(!t)continue;let n=Hn(t);(/<(?:[\w.-]+:)?b\b/i.test(e)||/w:val="true"[^>]*w:b|w:b\s*\/>/i.test(e))&&(n=`<strong>${n}</strong>`),/<(?:[\w.-]+:)?i\b/i.test(e)&&(n=`<em>${n}</em>`),r.push(n)}n.push(`<p>${r.join(``)||`&nbsp;`}</p>`)}let r=I(e,`tbl`);for(let e of r){let t=I(e,`tr`).map(e=>`<tr>${I(e,`tc`).map(e=>`<td>${Hn(L(e,`t`).join(` `))}</td>`).join(``)}</tr>`).join(``);t&&n.push(`<table class="files-preview-sheet">${t}</table>`)}return n.join(``)}function Kn(e,t){let n=e?L(e,`t`):[],r=I(t,`row`);return r.length===0?``:`<table class="files-preview-sheet">${r.map(e=>`<tr>${I(e,`c`).map(e=>{let t=/\bt="s"/.test(e),r=(L(e,`v`)[0]??L(e,`t`)[0]??``).trim(),i=r;if(t){let e=Number(r);i=Number.isFinite(e)&&n[e]!==void 0?n[e]:r}return`<td>${Hn(i)}</td>`}).join(``)}</tr>`).join(``)}</table>`}function qn(e){return e.map((e,t)=>{let n=L(e,`t`).map(e=>e.trim()).filter(Boolean).map(e=>`<p>${Hn(e)}</p>`).join(``)||`<p class="muted">(empty slide)</p>`;return`<section class="files-preview-slide"><h3>Slide ${t+1}</h3>${n}</section>`}).join(``)}function Jn(e){let t=I(e,`p`);return t.length===0?L(e,`p`).map(e=>`<p>${Hn(e)}</p>`).join(``):t.map(e=>`<p>${Hn(Un(e.replace(/<[^>]+>/g,` `)).replace(/\s+/g,` `).trim())||`&nbsp;`}</p>`).join(``)}function Yn(e,t){return e.getUint16(t,!0)}function Xn(e,t){return e.getUint32(t,!0)}async function Zn(e){if(typeof DecompressionStream>`u`)throw Error(`Deflate is not available in this browser`);let t=new DecompressionStream(`deflate-raw`),n=new Blob([e]).stream().pipeThrough(t),r=await new Response(n).arrayBuffer();return new Uint8Array(r)}async function Qn(e){let t=new Uint8Array(e),n=new DataView(e),r=-1,i=Math.max(0,t.length-22-65535);for(let e=t.length-22;e>=i;e--)if(Xn(n,e)===101010256){r=e;break}if(r<0)throw Error(`Not a ZIP file`);let a=Yn(n,r+10),o=Xn(n,r+16),s=new Map,c=new TextDecoder(`utf-8`);for(let e=0;e<a;e++){if(Xn(n,o)!==33639248)throw Error(`Bad ZIP directory`);let e=Yn(n,o+10),r=Xn(n,o+20),i=Yn(n,o+28),a=Yn(n,o+30),l=Yn(n,o+32),u=Xn(n,o+42),d=c.decode(t.subarray(o+46,o+46+i)).replace(/\\/g,`/`);if(o+=46+i+a+l,!d||d.endsWith(`/`))continue;let f=Yn(n,u+26),p=Yn(n,u+28),m=u+30+f+p,h=t.subarray(m,m+r);e===0?s.set(d,h.slice()):e===8&&s.set(d,await Zn(h))}return s}function $n(e,t){let n=e.get(t);return n?new TextDecoder(`utf-8`).decode(n):null}var er=20971520;async function tr(e,t){let n=Bn(e);if(n===`doc`||n===`xls`||n===`ppt`)throw Error(`Older binary Office files (.doc / .xls / .ppt) cannot be previewed. Download to open them.`);if(t.size>er)throw Error(`This document is too large to preview. Download it instead.`);let r=await Qn(await t.arrayBuffer());if(n===`docx`){let e=$n(r,`word/document.xml`);if(!e)throw Error(`This Word file has no document.xml`);let t=Gn(e);if(!t)throw Error(`No readable text in this Word file`);return t}if(n===`xlsx`){let e=[...r.keys()].filter(e=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(e)).sort((e,t)=>e.localeCompare(t,void 0,{numeric:!0}))[0],t=e?$n(r,e):null;if(!t)throw Error(`This spreadsheet has no worksheet`);let n=Kn($n(r,`xl/sharedStrings.xml`),t);if(!n)throw Error(`No readable cells in this spreadsheet`);return n}if(n===`pptx`){let e=[...r.keys()].filter(e=>/^ppt\/slides\/slide\d+\.xml$/i.test(e)).sort((e,t)=>e.localeCompare(t,void 0,{numeric:!0})).map(e=>$n(r,e)).filter(e=>!!e);if(e.length===0)throw Error(`This presentation has no slides`);return qn(e)}if(n===`odt`||n===`ods`||n===`odp`){let e=$n(r,`content.xml`);if(!e)throw Error(`This OpenDocument file has no content.xml`);let t=Jn(e);if(!t)throw Error(`No readable text in this document`);return t}throw Error(`This Office file type cannot be previewed`)}var nr=2097152,rr=52428800;function ir(e){let t=e.filesPreview;if(t?.objectUrl)try{URL.revokeObjectURL(t.objectUrl)}catch{}e.filesPreviewSeq+=1,e.filesPreview=null}function R(e){ir(e.state)}async function ar(e,t){let n=e.state.filesEntries.find(e=>e.path===t);if(!n||n.type!==`file`)return;R(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,M(e),e.state.filesMkdirOpen=!1,e.state.filesUploadMenuOpen=!1,A(e);let r=Vn(n.name),i=e.state.filesPreviewSeq+1;e.state.filesPreviewSeq=i;let a={path:n.path,name:n.name,size:n.size,kind:r,status:`loading`,objectUrl:null,text:null,html:null,truncated:!1,error:null};if(r!==`text`&&r!==`pdf`&&r!==`office`){e.state.filesPreview={...a,status:`ready`},S.event(`files.preview`,{path:n.path,kind:r}),e.render();return}e.state.filesPreview=a,e.render();try{if(r===`pdf`&&n.size>rr){if(e.state.filesPreviewSeq!==i)return;e.state.filesPreview={...a,status:`error`,error:`This PDF is too large to preview (${P(n.size)}). Download it instead.`},e.render();return}let{blob:t}=await E.filesGetBlob(n.path,{inline:!0});if(e.state.filesPreviewSeq!==i)return;if(r===`office`){let r=await tr(n.name,t);if(e.state.filesPreviewSeq!==i)return;e.state.filesPreview={...a,status:`ready`,html:r}}else if(r===`pdf`){let n=t.type&&t.type.toLowerCase().includes(`pdf`)?t:new Blob([t],{type:`application/pdf`});e.state.filesPreview={...a,status:`ready`,objectUrl:URL.createObjectURL(n)}}else{let n=t.size>nr,r=await(n?t.slice(0,nr):t).text();if(e.state.filesPreviewSeq!==i)return;e.state.filesPreview={...a,status:`ready`,text:r,truncated:n}}S.event(`files.preview`,{path:n.path,kind:r})}catch(t){if(e.state.filesPreviewSeq!==i)return;e.state.filesPreview={...a,status:`error`,error:t instanceof Error?t.message:`Could not open file`}}e.render()}function or(t){let n=t.state.filesPreview;if(!n)return``;let r;return r=n.status===`loading`?`<p class="muted" style="margin:0">Loading preview…</p>`:n.status===`error`?`<p class="flash flash-error" style="margin:0">${e(n.error||`Could not open file`)}</p>`:n.kind===`image`?`<div class="files-preview-media">
      <img class="files-preview-img" src="${e(E.filesDownloadUrl(n.path,{inline:!0}))}" alt="${e(n.name)}" decoding="async" />
    </div>`:n.kind===`pdf`&&n.objectUrl?`<iframe class="files-preview-frame" title="${e(n.name)}" src="${e(n.objectUrl)}" type="application/pdf"></iframe>`:n.kind===`audio`?`<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${e(E.filesDownloadUrl(n.path,{inline:!0}))}"></audio>
    </div>`:n.kind===`video`?`<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${e(E.filesDownloadUrl(n.path,{inline:!0}))}"></video>
    </div>`:n.kind===`office`&&n.html?`<div class="files-preview-office">${n.html}</div>`:n.kind===`text`?`${n.truncated?`<p class="muted small files-preview-truncated">Showing the first ${e(P(nr))} of this file.</p>`:``}<pre class="files-preview-text">${e(n.text||``)}</pre>`:`<p style="margin:0">This file type cannot be previewed in the browser. Download it to open with another app.</p>
      <p class="muted small" style="margin:0.75rem 0 0">${e(n.name)} · ${e(P(n.size))}</p>`,a({id:`files-preview-modal`,title:n.name,titleId:`files-preview-title`,closeAction:`files-preview-close`,size:`wide`,cardClassName:`files-preview-card`,className:`files-preview-modal`,body:r,footer:[{label:`Download`,action:`files-preview-download`,variant:`ghost`},{label:`Close`,action:`files-preview-close`,variant:`primary`}]})}function z(e){e.state.filesUploadMenuDocClick&&(document.removeEventListener(`click`,e.state.filesUploadMenuDocClick,!0),e.state.filesUploadMenuDocClick=null)}function sr(e){z(e),e.state.filesUploadMenuDocClick=t=>{t.target?.closest?.(`.files-upload-menu`)||(e.state.filesUploadMenuOpen=!1,z(e),e.render())};let t=e.state.filesUploadMenuDocClick;setTimeout(()=>{e.state.filesUploadMenuOpen&&e.state.filesUploadMenuDocClick===t&&document.addEventListener(`click`,t,!0)},0)}function cr(e){e.state.filesUploadElapsedTimer!==null&&(clearInterval(e.state.filesUploadElapsedTimer),e.state.filesUploadElapsedTimer=null)}function lr(e){cr(e),e.state.filesUploadElapsedTimer=setInterval(()=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase===`done`||e.state.filesUploadProgress.phase===`error`){cr(e);return}e.state.filesUploadProgress={...e.state.filesUploadProgress,elapsedSec:Math.floor((Date.now()-e.state.filesUploadProgress.startedAt)/1e3)},fr(e,e.state.filesUploadProgress)},1e3)}function ur(e){cr(e),e.state.filesUploadProgress=null,e.render()}function dr(e,t){return t.bytesTotal>0?Math.min(100,Math.max(0,Math.round(100*t.bytesSent/t.bytesTotal))):t.totalFiles>0?Math.min(100,Math.max(0,Math.round(100*t.completedFiles/t.totalFiles))):null}function fr(e,t){if(!e.root.querySelector(`[data-files-upload-progress]`))return;let n=e.root.querySelector(`.files-upload-progress-bar`),r=e.root.querySelector(`.files-upload-progress-track`),i=e.root.querySelector(`[data-files-upload-status]`),a=e.root.querySelector(`[data-files-upload-current]`),o=dr(e,t),s=t.phase===`uploading`?`Uploading ${t.completedFiles.toLocaleString()} / ${t.totalFiles.toLocaleString()} file${t.totalFiles===1?``:`s`}${t.failedFiles?` · ${t.failedFiles} failed`:``}${o===null?``:` (${o}%)`} · ${N(t.elapsedSec)}`:i?.textContent||``;i&&t.phase===`uploading`&&(i.textContent=s),a&&t.phase===`uploading`&&(a.textContent=t.currentName||``,a.title=t.currentName||``),n&&o!==null&&(n.classList.remove(`is-indeterminate`),n.style.width=`${o}%`),r&&o!==null&&(r.setAttribute(`aria-valuenow`,String(o)),r.removeAttribute(`aria-valuetext`))}function pr(n){if(!n.state.filesUploadProgress)return``;let r=n.state.filesUploadProgress,o=r.phase===`uploading`,s=r.phase===`done`?`Upload finished`:r.phase===`error`?`Upload failed`:`Uploading…`,c=dr(n,r),l=c===null?`files-upload-progress-bar is-indeterminate`:`files-upload-progress-bar`,u=c===null?``:` style="width:${c}%"`,d=``;if(o){let t=`Uploading ${r.completedFiles.toLocaleString()} / ${r.totalFiles.toLocaleString()} file${r.totalFiles===1?``:`s`}${r.failedFiles?` · ${r.failedFiles} failed`:``}${c===null?``:` (${c}%)`} · ${N(r.elapsedSec)}`,i=r.bytesTotal>0?`${Nn(r.bytesSent)} / ${Nn(r.bytesTotal)}`:``;d=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${e(n.state.filesPath===``?`Home`:n.state.filesPath)}</span>
        ${i?` · <span class="muted">${e(i)}</span>`:``}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${c===null?`aria-valuetext="In progress"`:`aria-valuenow="${c}"`}
        aria-label="Upload progress">
        <div class="${l}"${u}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${e(t)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${e(r.currentName)}">${e(r.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`}else if(r.phase===`done`)d=`
      ${t(`success`,r.resultMessage||`Upload completed.`,{className:`import-result`,style:`margin:0 0 1rem`})}
      <p class="muted small" style="margin:0">Took ${e(N(r.elapsedSec))}</p>`;else{let n=r.errorSamples.length>0?`<ul class="files-upload-error-list muted small">${r.errorSamples.slice(0,8).map(t=>`<li>${e(t)}</li>`).join(``)}${r.errorSamples.length>8?`<li>…and ${r.errorSamples.length-8} more</li>`:``}</ul>`:``;d=`
      ${t(`error`,r.resultMessage||`Upload failed.`,{className:`import-result`,style:`margin:0 0 1rem`})}
      ${n}
      <p class="muted small" style="margin:0.75rem 0 0">After ${e(N(r.elapsedSec))}</p>`}let f=o?`<p class="muted small" style="margin:0">Please wait…</p>`:i([{label:`Close`,action:`close-files-upload-progress`,variant:`primary`}]);return a({title:s,titleId:`files-upload-progress-title`,closeAction:`close-files-upload-progress`,size:`sm`,className:`import-progress-modal files-upload-progress-modal`,cardClassName:`import-progress-card`,rootAttrs:`data-files-upload-progress`,hideClose:o,lockBackdrop:o,body:d,footer:f})}async function mr(e,t,n,r){let i=n.replace(/\\/g,`/`).split(`/`).map(e=>e.trim()).filter(Boolean),a=t;for(let e of i){let t=cn(a,e);if(r.has(t)){a=t;continue}try{await E.filesMkdir(a,e),S.event(`files.mkdir`,{path:a,name:e,via:`upload-folder`})}catch(e){if(!(e instanceof C&&e.status===409))throw e}r.add(t),a=t}}function hr(e,t){let n=t===`files`?`input[type="file"][data-action="files-upload-pick-files"]`:`input[type="file"][data-action="files-upload-pick-folder"]`;e.root.querySelector(n)?.click()}async function gr(e,t){if(e.state.busy||e.state.filesUploadProgress)return;e.state.filesUploadMenuOpen=!1,z(e),e.state.filesRenamePath=null,e.state.filesDeletePaths=null,M(e),e.state.filesMkdirOpen=!1,R(e),A(e);let n=t===`files`?Cn:wn;try{let r=await n();if(r.kind===`cancel`){e.render();return}if(r.kind===`items`){if(r.items.length===0){e.setFlash(`info`,t===`folder`?`Folder is empty`:`No files selected`),e.render();return}await wr(e,r.items);return}e.render(),requestAnimationFrame(()=>{hr(e,t)})}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Could not open picker`),e.render()}}function _r(e,t){return`${e}\0${t}`}function vr(e,t){return t.map(t=>{let n=t.file,r=(t.relativePath||n.name).replace(/\\/g,`/`),i=r.split(`/`).filter(Boolean),a=i.pop()||n.name,o=i.join(`/`);return{item:t,file:n,fileName:a,parentPath:cn(e,o),displayName:r||a,relDir:o}})}function yr(e){let t=new Set,n=[];for(let r of e){let e=_r(r.parentPath,r.fileName);t.has(e)||(t.add(e),n.push(r))}return n}async function br(e,t){if(t.length===0)return[];let n=new Map;for(let e of t){let t=n.get(e.parentPath)??[];t.push(e),n.set(e.parentPath,t)}let r=[];for(let[e,t]of n){let n=new Map;try{let t=await E.filesList(e);n=new Map;for(let e of t.entries)(e.type===`file`||e.type===`dir`)&&n.set(e.name,e.type)}catch{n=new Map}for(let e of t)n.has(e.fileName)&&r.push(e)}return r.sort((e,t)=>e.displayName.localeCompare(t.displayName)),r}var xr=new WeakMap;function Sr(e){e&&(xr.delete(e.state),e.state.filesUploadConflict=null)}function Cr(e,t){let n=xr.get(e.state),r=e.state.filesUploadConflict;if(t===`cancel`){Sr(e),e.setFlash(`info`,`Upload cancelled`),e.render();return}if(!n){e.state.filesUploadConflict=null,e.setFlash(`error`,`Upload session expired — drop or choose the files again`),e.render();return}let i=new Set((r?.conflictKeys?.length?r.conflictKeys:n.conflictKeys)??[]),a=n.planned,o=new Set,s=0;if(t===`overwrite`)o=new Set(i);else{let t=[];for(let e of n.planned){let n=_r(e.parentPath,e.fileName);i.has(n)?s+=1:t.push(e)}if(a=t,S.event(`files.upload.skip_existing`,{skipped:s,remaining:a.length,total:n.planned.length,conflictKeys:i.size}),a.length===0&&n.emptyDirs.length===0){Sr(e),e.setFlash(`info`,s===1?`Nothing to upload — the selected file already exists`:`Nothing to upload — all ${s} selected files already exist`),e.render();return}}let c=n.destBase,l=n.emptyDirs;Sr(e),Tr(e,a,l,c,o)}async function wr(e,t){if(t.length===0||e.state.filesUploadProgress||e.state.filesUploadConflict)return;e.state.filesUploadMenuOpen=!1,z(e),e.state.filesUploadDropActive=!1,R(e),A(e);let n=t.filter(e=>e.file&&!e.isEmptyDir),r=t.filter(e=>e.isEmptyDir&&e.relativePath),i=e.state.filesPath,a=yr(vr(i,n));if(S.event(`files.upload.plan`,{destBase:i||`/`,files:a.length,emptyDirs:r.length,sample:a.slice(0,5).map(e=>({display:e.displayName,parent:e.parentPath||`/`,name:e.fileName}))}),a.length>0){e.state.busy=!0,e.clearFlash(),e.render();try{let t=await br(i,a);if(t.length>0){let n=t.map(e=>_r(e.parentPath,e.fileName));xr.set(e.state,{planned:a,emptyDirs:r,destBase:i,conflictKeys:n}),e.state.filesUploadConflict={names:t.map(e=>e.displayName),totalFiles:a.length,conflictCount:t.length,conflictKeys:n},S.event(`files.upload.conflicts`,{total:a.length,conflicts:t.length,names:t.slice(0,12).map(e=>e.displayName)}),e.state.busy=!1,e.render();return}}catch(t){e.state.busy=!1,e.setFlash(`error`,t instanceof Error?t.message:`Could not check existing files`),e.render();return}}await Tr(e,a,r,i,new Set)}async function Tr(e,t,n,r,i){let a=t.reduce((e,t)=>e+(t.file.size||0),0),o=Date.now(),s=t.length+n.length;e.state.filesUploadProgress={phase:`uploading`,totalFiles:Math.max(t.length,1),completedFiles:0,failedFiles:0,currentName:t[0]?.displayName||n[0]?.relativePath||``,bytesTotal:a,bytesSent:0,startedAt:o,elapsedSec:0,resultMessage:null,errorSamples:[]},e.state.busy=!0,e.clearFlash(),lr(e),e.render();let c=0,l=[],u=new Set,d=0,f=0;try{for(let t of n){let n=t.relativePath.replace(/\\/g,`/`).replace(/^\/+|\/+$/g,``);if(n){e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:n+`/`,elapsedSec:Math.floor((Date.now()-o)/1e3)},fr(e,e.state.filesUploadProgress));try{await mr(e,r,n,u)}catch(e){l.push(`${n}/: ${e instanceof Error?e.message:`failed`}`)}}}for(let n of t){let{file:t,fileName:a,parentPath:s,displayName:p,relDir:m}=n;e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:p,bytesSent:d,elapsedSec:Math.floor((Date.now()-o)/1e3)},fr(e,e.state.filesUploadProgress));try{m&&await mr(e,r,m,u);let n=i.has(_r(s,a));await E.filesUpload(s,t,{replace:n,onProgress:(n,r)=>{if(!e.state.filesUploadProgress||e.state.filesUploadProgress.phase!==`uploading`)return;let i=r>0?r:t.size;e.state.filesUploadProgress={...e.state.filesUploadProgress,currentName:p,bytesSent:d+Math.min(n,i||n),elapsedSec:Math.floor((Date.now()-o)/1e3)},fr(e,e.state.filesUploadProgress)}}),S.event(`files.upload`,{path:s,name:a,size:t.size,relativePath:p,replace:n}),c+=1,n&&(f+=1),d+=t.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:c,failedFiles:l.length,bytesSent:d},fr(e,e.state.filesUploadProgress))}catch(n){let r=`${p}: ${n instanceof Error?n.message:`failed`}`;l.push(r),d+=t.size||0,e.state.filesUploadProgress&&(e.state.filesUploadProgress={...e.state.filesUploadProgress,completedFiles:c,failedFiles:l.length,bytesSent:d,errorSamples:l.slice(0,12)},fr(e,e.state.filesUploadProgress))}}await j(e),cr(e);let p=Math.floor((Date.now()-o)/1e3),m=t.length;if(c>0&&l.length===0){let t=c===1?`Uploaded 1 file`:`Uploaded ${c} files`;f>0&&(t+=f===1?` (1 overwritten)`:` (${f} overwritten)`),e.state.filesUploadProgress={phase:`done`,totalFiles:Math.max(m,1),completedFiles:c,failedFiles:0,currentName:``,bytesTotal:a,bytesSent:a,startedAt:o,elapsedSec:p,resultMessage:t,errorSamples:[]},e.setFlash(`success`,t)}else if(c>0){let t=`Uploaded ${c}; ${l.length} failed. ${l[0]}`;e.state.filesUploadProgress={phase:`done`,totalFiles:Math.max(m,1),completedFiles:c,failedFiles:l.length,currentName:``,bytesTotal:a,bytesSent:a,startedAt:o,elapsedSec:p,resultMessage:t,errorSamples:l.slice(0,12)},e.setFlash(`info`,t)}else if(s>0&&l.length===0&&n.length>0){let t=n.length===1?`Created 1 empty folder`:`Created ${n.length} empty folders`;e.state.filesUploadProgress={phase:`done`,totalFiles:1,completedFiles:0,failedFiles:0,currentName:``,bytesTotal:0,bytesSent:0,startedAt:o,elapsedSec:p,resultMessage:t,errorSamples:[]},e.setFlash(`success`,t)}else{let t=l[0]||`Upload failed`;e.state.filesUploadProgress={phase:`error`,totalFiles:Math.max(m,1),completedFiles:0,failedFiles:l.length,currentName:``,bytesTotal:a,bytesSent:0,startedAt:o,elapsedSec:p,resultMessage:t,errorSamples:l.slice(0,12)},e.setFlash(`error`,t)}}catch(n){cr(e);let r=n instanceof Error?n.message:`Upload failed`;e.state.filesUploadProgress={phase:`error`,totalFiles:Math.max(t.length,1),completedFiles:c,failedFiles:Math.max(l.length,1),currentName:``,bytesTotal:a,bytesSent:d,startedAt:o,elapsedSec:Math.floor((Date.now()-o)/1e3),resultMessage:r,errorSamples:l.length?l.slice(0,12):[r]},e.setFlash(`error`,r)}finally{e.state.busy=!1,e.render()}}function Er(e,t,n){let r=t.files;if(!r||r.length===0)return;let i=_n(r,n);t.value=``,wr(e,i)}var Dr={"my-calendars":{title:`Calendar`,paragraphs:[`Create and edit calendars, then share them with other AngaraDAV users.`,`CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only.`]},owned:{title:`Owned`,paragraphs:[`Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.`,`Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.`,`Badges show ownership, read-only mode, and holiday calendars.`]},"add-calendar":{title:`Add calendar`,paragraphs:[`Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).`,`Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.`,`Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant.`]},"shared-with-me":{title:`Shared with me`,paragraphs:[`Calendars other users shared with you. Check one or more to view events in the month grid.`,`Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing).`]},"calendar-details":{title:`Calendar details`,paragraphs:[`Display name, color, and description are stored on the calendar and are visible to CalDAV clients.`,`The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name.`]},"import-export":{title:`Import / export`,paragraphs:[`Export downloads a standard .ics file of the whole calendar.`,`Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.`,`Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.`,`Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact.`]},share:{title:`Share`,paragraphs:[`Share this calendar with another AngaraDAV user. Choose read-only or full access.`,`This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.`,`If the calendar is marked read-only, shares are always read-only for everyone.`]},"my-contacts":{title:`Contacts`,paragraphs:[`Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.`,`Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files.`]},tasks:{title:`Tasks`,paragraphs:[`Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.`,`Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent keeps subtasks as top-level tasks (RELATED-TO is removed) unless you confirm Delete with subtasks.`,`Click a column header to sort. Create tasks on any writable calendar that allows VTODO components.`]},notes:{title:`Notes`,paragraphs:[`Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.`,"Click a column header to sort. Add or edit a note in the dialog. The body supports headings (H1–H3), bold/italic/underline/strikethrough, lists, checkboxes, quotes, links, and inline code (like `shell.ts`).",`Formatting is stored as Markdown in DESCRIPTION so jtx Board can render it.`]},files:{title:`Files`,paragraphs:[`Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.`,`Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.`,`Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).`,`Click a file name or View to preview it: images, PDF, text, audio, and video open in a dialog. Other types offer a download instead. Download, create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.`,`Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.`,`Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.`,`Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage.`]},"address-books":{title:`Address books`,paragraphs:[`Address books you own. Select one to manage its contacts.`,`Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation.`]},contacts:{title:`Contacts`,paragraphs:[`Search filters by name, email, phone, org, notes, and custom fields.`,`Add or select a contact to edit fields. Multiple emails and phones are supported.`,`Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.`,`Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them.`]},"contact-import-export":{title:`Import / export contacts`,paragraphs:[`Export downloads a multi-vCard .vcf file of every contact in the address book.`,`Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.`,`Large imports show a progress dialog with elapsed time — keep the tab open until the result appears.`]},administration:{title:`Administration`,paragraphs:[`Server administration for AngaraDAV, available to portal users with the Admin role.`,`Overview, users, system settings, and database management for operators with the Admin role.`,`Admin API calls use your portal DAV session and require the Admin role server-side.`]},"admin-overview":{title:`Overview`,paragraphs:[`Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.`,`Version and release links help you compare installs. Counts refresh from the dashboard API.`]},"admin-users":{title:`Users`,paragraphs:[`List, create, edit, and delete DAV users from the portal. Password digests are never returned.`,`Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.`,`Manage users, system settings, and database from these Administration tabs.`]},"admin-settings":{title:`System settings`,paragraphs:[`Edit DAV services, files, push, session timeout, time format, week start, portal admin role list, and admin password.`,`Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies. Time format and week start apply to every portal user (not stored events or phone apps).`]},"admin-database":{title:`Database`,paragraphs:[`Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.`,`Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline.`]},"admin-configuration":{title:`Configuration`,paragraphs:[`Download a JSON backup of the editable system settings, or restore one after reviewing a diff. No passwords, secrets, or user/DAV data are ever included.`,`Reset to Default (below) wipes this instance entirely — config, database, and WebDAV files — and reopens the installer.`]}};function B(t,n,r=`h2`){let i=r;return`<div class="section-title-row">
    <${i}>${e(t)}</${i}>
    <button type="button" class="info-btn" data-action="info" data-info="${e(n)}"
      aria-label="About ${e(t)}" title="About ${e(t)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Or(){return`
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
    </div>`}var kr=new Set([`zip`,`tar`,`gz`,`tgz`,`bz2`,`7z`,`rar`,`xz`]),Ar=[{value:`all`,label:`All types`},{value:`folder`,label:`Folders`},{value:`file`,label:`Files`},{value:`image`,label:`Images`},{value:`document`,label:`Documents`},{value:`audio`,label:`Audio`},{value:`video`,label:`Video`},{value:`archive`,label:`Archives`},{value:`other`,label:`Other`}];function jr(e){if(e.type===`dir`)return`folder`;let t=Vn(e.name);return t===`image`?`image`:t===`pdf`||t===`office`||t===`text`?`document`:t===`audio`?`audio`:t===`video`?`video`:kr.has(Bn(e.name))?`archive`:`other`}function Mr(e,t){return t===`all`?!0:t===`file`?e.type===`file`:jr(e)===t}function Nr(e,t){let n=t.search.trim().toLowerCase(),r=e.filter(e=>!(!Mr(e,t.type)||n&&!e.name.toLowerCase().includes(n))),i=t.order===`desc`?-1:1;return r=r.slice().sort((e,n)=>t.sort===`name`?e.type===n.type?i*e.name.localeCompare(n.name,void 0,{sensitivity:`base`}):e.type===`dir`?-1:1:t.sort===`size`?e.type===n.type?e.size===n.size?e.name.localeCompare(n.name,void 0,{sensitivity:`base`}):i*(e.size-n.size):e.type===`dir`?1:-1:e.mtime===n.mtime?e.name.localeCompare(n.name,void 0,{sensitivity:`base`}):i*(e.mtime-n.mtime)),r}function Pr(t,n){let r=n?n.split(`/`).filter(Boolean):[],i=``,a=[`<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${t.state.busy?`disabled`:``}>Home</button>`];for(let n of r){i=i?`${i}/${n}`:n;let r=i;a.push(`<span class="files-crumb-sep" aria-hidden="true">/</span>`),a.push(`<button type="button" class="files-crumb" data-action="files-nav" data-path="${e(r)}" ${t.state.busy?`disabled`:``}>${e(n)}</button>`)}return`<nav class="files-breadcrumb" aria-label="Folder path">${a.join(``)}</nav>`}function Fr(t){let n=t.state.filesStatus;if(!n)return`<div class="card"><p class="muted">${t.state.filesLoading||t.state.busy?`Loading…`:`Unable to load file storage status.`}</p></div>`;if(!n.enabled)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${B(`Files`,`files`,`h1`)}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;if(!n.ready)return`<div class="portal-grid portal-grid-files">
      <section class="card">
        ${B(`Files`,`files`,`h1`)}
        <p class="flash flash-error" style="margin-top:0.75rem">${e(n.error||`File storage is not available.`)}</p>
        <p class="muted small">DAV path: <span class="mono">${e(n.davPath)}</span></p>
      </section>
    </div>`;let r=n.quotaBytes>0?`${P(n.usedBytes)} used · ${P(n.availableBytes)} free of ${P(n.quotaBytes)}`:`${P(n.usedBytes)} used · ${P(n.availableBytes)} free (no app quota)`,i=n.quotaBytes>0?Math.min(100,Math.round(100*n.usedBytes/n.quotaBytes)):0,o=Nr(t.state.filesEntries,{search:t.state.filesSearch,type:t.state.filesTypeFilter,sort:t.state.filesSort,order:t.state.filesOrder}),s=t.state.checkedFilePaths.length,c=(()=>{if(s===0)return null;let e=new Set(t.state.checkedFilePaths),n=0,r=0;for(let i of t.state.filesEntries)!e.has(i.path)||i.type!==`file`||(n+=i.size,r+=1);return r>0?n:null})(),l=o.length>0&&o.every(e=>t.state.checkedFilePaths.includes(e.path)),u=s>0,d=t.state.filesEntries.filter(e=>e.type===`dir`).length,f=t.state.filesEntries.length-d,p=Qt(t.state.filesEntries,t.state.checkedFilePaths),m=o.length!==t.state.filesEntries.length,h=(()=>{if(t.state.filesLoading&&t.state.filesEntries.length===0)return`Loading…`;if(t.state.filesEntries.length===0)return`0 items`;let e=[];d>0&&e.push(`${d} folder${d===1?``:`s`}`),f>0&&e.push(`${f} file${f===1?``:`s`}`);let n=`${t.state.filesEntries.length} item${t.state.filesEntries.length===1?``:`s`}`;return e.length===2?`${n} · ${e.join(`, `)}`:e[0]??n})(),g=t.state.filesEntries.length===0?`<tr><td colspan="5" class="muted">This folder is empty.</td></tr>`:o.length===0?`<tr><td colspan="5" class="muted">No items match this search or filter.</td></tr>`:o.map(n=>{let r=t.state.checkedFilePaths.includes(n.path),i=n.type===`dir`?`📁`:`📄`,a=n.type===`dir`?`<button type="button" class="files-name-btn" data-action="files-nav" data-path="${e(n.path)}" ${t.state.busy?`disabled`:``}>
                    <span class="files-icon" aria-hidden="true">${i}</span>${e(n.name)}
                  </button>`:`<button type="button" class="files-name-btn" data-action="files-preview-open" data-path="${e(n.path)}" title="View ${e(n.name)}" aria-expanded="${t.state.filesPreview?.path===n.path?`true`:`false`}" ${t.state.busy?`disabled`:``}>
                    <span class="files-icon" aria-hidden="true">${i}</span>${e(n.name)}
                  </button>`,o=n.type===`dir`?`—`:P(n.size),s=t.state.filesItemMenu?.path===n.path;return`<tr class="files-row${r?` is-checked`:``}${s?` is-menu-open`:``}" data-path="${e(n.path)}" data-type="${n.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${e(n.path)}"
                  ${r?`checked`:``} ${t.state.busy?`disabled`:``}
                  aria-label="Select ${e(n.name)}" />
              </td>
              <td class="files-col-name">${a}</td>
              <td class="files-col-size mono">${o}</td>
              <td class="files-col-mtime hide-sm">${e(Pn(n.mtime))}</td>
              <td class="files-col-actions">
                <button type="button" class="files-row-menu-btn" data-action="files-item-menu-toggle"
                  data-path="${e(n.path)}"
                  aria-haspopup="menu"
                  aria-expanded="${s?`true`:`false`}"
                  ${s?`aria-controls="files-item-menu"`:``}
                  aria-label="Actions for ${e(n.name)}"
                  title="Actions"
                  ${t.state.busy?`disabled`:``}>
                  <span aria-hidden="true">⋮</span>
                </button>
              </td>
            </tr>`}).join(``),_=t.state.filesRenamePath===null?``:(()=>{let n=t.state.filesEntries.find(e=>e.path===t.state.filesRenamePath)?.name??``;return a({id:`files-rename-modal`,title:`Rename`,titleId:`files-rename-title`,closeAction:`files-rename-close`,size:`sm`,form:!0,formAttrs:`data-form="files-rename" id="files-rename-form"`,body:`
                  <input type="hidden" name="path" value="${e(t.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${e(n)}" required maxlength="255" autocomplete="off" />
                  </label>`,footer:[{label:`Cancel`,action:`files-rename-close`,variant:`ghost`},{label:`Rename`,type:`submit`,variant:`primary`,disabled:t.state.busy}]})})(),v=t.state.filesDeletePaths!==null&&t.state.filesDeletePaths.length>0?(()=>{let n=t.state.filesDeletePaths,r=n.length>1,i=t.state.filesEntries.find(e=>e.path===n[0]);return a({id:`files-delete-modal`,title:r?`Delete ${n.length} items`:`Delete ${i?.type===`dir`?`folder`:`file`}`,titleId:`files-delete-title`,closeAction:`files-delete-close`,size:`sm`,body:r?`<p style="margin:0 0 0.75rem">Delete <strong>${n.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${n.slice(0,12).map(n=>`<li><span class="mono">${e(t.state.filesEntries.find(e=>e.path===n)?.name??n)}</span></li>`).join(``)}
                 ${n.length>12?`<li>…and ${n.length-12} more</li>`:``}
               </ul>`:`<p style="margin:0">Delete <strong>${e(i?.name??n[0])}</strong>?${i?.type===`dir`?` This removes the folder and everything inside it.`:``}</p>`,footer:[{label:`Cancel`,action:`files-delete-close`,variant:`ghost`},{label:`Delete`,action:`files-delete-confirm`,variant:`danger`,disabled:t.state.busy}]})})():``,y=t.state.filesTransfer!==null&&t.state.filesTransfer.paths.length>0?(()=>{let n=t.state.filesTransfer.op,r=t.state.filesTransfer.paths,i=r.length>1,o=t.state.filesEntries.find(e=>e.path===r[0]),s=o?.name??ln(r[0]),c=i?`${n===`copy`?`Copy`:`Move`} ${r.length} items`:`${n===`copy`?`Copy`:`Move`} ${o?.type===`dir`?`folder`:`file`}`,l=t.state.filesTransferDest===``?`Home`:t.state.filesTransferDest,u=un(t,t.state.filesTransferDest,r);return a({id:`files-transfer-modal`,title:c,titleId:`files-transfer-title`,closeAction:`files-transfer-close`,size:`md`,form:!0,formAttrs:`data-form="files-transfer"`,body:`
                  ${i?`<p class="muted small" style="margin:0 0 0.75rem">${r.length} items will be ${n===`copy`?`copied`:`moved`} into the destination folder (original names kept).</p>`:`<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${e(s)}</span></p>`}
                  <input type="hidden" name="toPath" value="${e(t.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${e(l)}">${e(l)}</span>
                    </div>
                    ${pn(t)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${i?``:`<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${e(s)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${n===`copy`?`Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination.`:`Leave as-is to keep the current name.`}
                        </p>`}`,footer:[{label:`Cancel`,action:`files-transfer-close`,variant:`ghost`},{label:n===`copy`?`Copy`:`Move`,type:`submit`,variant:`primary`,disabled:t.state.busy||u}]})})():``,ee=t.state.filesMkdirOpen?a({id:`files-mkdir-modal`,title:`New folder`,titleId:`files-mkdir-title`,closeAction:`files-mkdir-close`,size:`sm`,form:!0,formAttrs:`data-form="files-mkdir"`,body:`
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${e(t.state.filesPath===``?`Home`:t.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,footer:[{label:`Cancel`,action:`files-mkdir-close`,variant:`ghost`},{label:`Create`,type:`submit`,variant:`primary`,disabled:t.state.busy}]}):``,b=t.state.filesUploadConflict?(()=>{let n=t.state.filesUploadConflict,r=n.conflictCount,i=Math.max(0,n.totalFiles-r),o=r===1?`1 file already exists in the destination.`:`${r} of ${n.totalFiles} files already exist in the destination.`,s=i>0?i===1?` Skip existing keeps the other 1 new file.`:` Skip existing keeps the other ${i} new files.`:` Skip existing cancels the upload (nothing new to send).`,c=n.names.slice(0,12).map(t=>`<li><span class="mono">${e(t)}</span></li>`).join(``),l=n.names.length>12?`<li class="muted">…and ${n.names.length-12} more</li>`:``;return a({id:`files-upload-conflict-modal`,title:r===1?`File already exists`:`Files already exist`,titleId:`files-upload-conflict-title`,closeAction:`files-upload-conflict-cancel`,size:`sm`,body:`
              <p style="margin:0 0 0.75rem">${e(o)}${e(s)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${c}
                ${l}
              </ul>
              <p class="muted small" style="margin:0">
                Replace the existing files, skip only those listed above, or cancel the whole upload.
              </p>`,footer:[{label:`Cancel`,action:`files-upload-conflict-cancel`,variant:`ghost`},{label:`Skip existing`,action:`files-upload-conflict-skip`,variant:`ghost`},{label:r===1?`Overwrite`:`Overwrite all`,action:`files-upload-conflict-overwrite`,variant:`primary`}]})})():``,x=t.state.filesPath===``?`Home`:t.state.filesPath,te=`<div class="files-upload-menu${t.state.filesUploadMenuOpen?` is-open`:``}">
          <button type="button" class="btn btn-primary btn-small files-upload-menu-trigger"
            data-action="files-upload-menu-toggle"
            ${t.state.busy?`disabled`:``}
            aria-haspopup="menu"
            aria-expanded="${t.state.filesUploadMenuOpen?`true`:`false`}"
            aria-controls="files-upload-menu-list"
            title="Upload files or a folder into this directory">
            Upload
            <span class="files-upload-menu-caret" aria-hidden="true">▾</span>
          </button>
          <div id="files-upload-menu-list" class="files-upload-menu-dropdown" role="menu"
            ${t.state.filesUploadMenuOpen?``:`hidden`}>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-files" ${t.state.busy?`disabled`:``}>
              Files…
            </button>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-folder" ${t.state.busy?`disabled`:``}>
              Folder…
            </button>
          </div>
        </div>`,ne=`<input type="file" data-action="files-upload-pick-files" ${t.state.busy?`disabled`:``} multiple hidden />
        <input type="file" data-action="files-upload-pick-folder" ${t.state.busy?`disabled`:``}
          multiple webkitdirectory directory hidden />`,re=Ar.map(n=>`<option value="${e(n.value)}" ${t.state.filesTypeFilter===n.value?`selected`:``}>${e(n.label)}</option>`).join(``),ie=`<div class="files-filter-bar">
          <input type="search" class="files-search" data-action="files-search" placeholder="Search this folder…"
            value="${e(t.state.filesSearch)}" aria-label="Search files in this folder" ${t.state.busy?`disabled`:``} />
          <label class="files-type-filter">
            <span class="visually-hidden">Type</span>
            <select data-action="files-type-filter" aria-label="Filter by type" ${t.state.busy?`disabled`:``}>
              ${re}
            </select>
          </label>
        </div>`,ae=s>0?`<div class="files-toolbar-actions" role="toolbar" aria-label="Selected files">
            <span class="files-selection-count">${s} selected</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-clear-selection" ${t.state.busy?`disabled`:``}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-download"
              ${t.state.busy||!p.showDownload?`disabled`:``}
              title="${p.showDownload?`Download selected files`:`No files in the selection`}">Download</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-copy" ${t.state.busy?`disabled`:``}>Copy</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-bulk-move" ${t.state.busy?`disabled`:``}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${t.state.busy?`disabled`:``}>Delete</button>
          </div>`:`<div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${t.state.busy||t.state.filesLoading?`disabled`:``}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${t.state.busy?`disabled`:``}>New folder</button>
            ${te}
          </div>`;return`<div class="portal-grid portal-grid-files">
    <section class="card files-panel${t.state.filesUploadDropActive?` is-dragover`:``}" data-files-drop-target>
      <div class="files-drop-overlay" aria-hidden="true">
        <div class="files-drop-overlay-inner">
          <p class="files-drop-overlay-title">Drop to upload</p>
          <p class="muted small mono">${e(x)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${B(`Files`,`files`,`h1`)}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${i}%"></div>
          </div>
          <span>${e(r)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${Pr(t,t.state.filesPath)}
        ${ae}
      </div>
      ${ne}
      ${ie}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${l?`checked`:``}
                  ${u&&!l?`data-indeterminate=1`:``}
                  ${t.state.busy||o.length===0?`disabled`:``}
                  aria-label="Select all visible in this folder" />
              </th>
              ${F(`Name`,`name`,t.state.filesSort,t.state.filesOrder,`file`,`files-col-name`)}
              ${F(`Size`,`size`,t.state.filesSort,t.state.filesOrder,`file`,`files-col-size`)}
              ${F(`Modified`,`mtime`,t.state.filesSort,t.state.filesOrder,`file`,`files-col-mtime hide-sm`)}
              <th class="files-col-actions" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            ${t.state.filesLoading&&t.state.filesEntries.length===0?`<tr><td colspan="5" class="muted">Loading…</td></tr>`:g}
          </tbody>
        </table>
      </div>
      ${on(t)}
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${s>0?`${s} of ${t.state.filesEntries.length} selected${c===null?``:` · ${e(P(c))}`}`:m?`${o.length} shown of ${t.state.filesEntries.length}`:e(h)}
      </div>
    </section>
    ${_}
    ${v}
    ${y}
    ${ee}
    ${b}
  </div>`}async function Ir(e,t){let n=new FormData(t),r=String(n.get(`path`)??``),i=String(n.get(`newName`)??``).trim();if(!r||!i){e.setFlash(`error`,`Name is required`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await E.filesRename(r,i),S.event(`files.rename`,{path:r,newName:i}),e.state.filesRenamePath=null,await j(e),e.setFlash(`success`,`Renamed to “${i}”`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Rename failed`)}finally{e.state.busy=!1,e.render()}}async function Lr(e,t){let n=new FormData(t),r=String(n.get(`name`)??``).trim();if(!r){e.setFlash(`error`,`Folder name is required`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{await E.filesMkdir(e.state.filesPath,r),S.event(`files.mkdir`,{path:e.state.filesPath,name:r}),e.state.filesMkdirOpen=!1,await j(e),e.setFlash(`success`,`Created folder “${r}”`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Could not create folder`)}finally{e.state.busy=!1,e.render()}}async function Rr(e,t,n,r){let{state:i}=e;if(t===`files-upload-menu-toggle`)return i.busy||i.filesUploadProgress?!0:(i.filesUploadMenuOpen=!i.filesUploadMenuOpen,i.filesUploadMenuOpen&&(i.filesRenamePath=null,i.filesDeletePaths=null,M(e),i.filesMkdirOpen=!1,A(e)),e.render(),!0);if(t===`files-item-menu-toggle`){r.stopPropagation();let t=n.dataset.path??``;if(!t||$t(i))return!0;if(i.filesItemMenu?.path===t)return A(e),e.render(),!0;let a=n.getBoundingClientRect();return en(e,t,{x:a.right,y:a.bottom+4,origin:`button`}),!0}if(t===`sort-file`){let t=n.dataset.sort||``;return t!==`name`&&t!==`size`&&t!==`mtime`||(i.filesSort===t?i.filesOrder=i.filesOrder===`asc`?`desc`:`asc`:(i.filesSort=t,i.filesOrder=t===`name`?`asc`:`desc`),e.render(),!0)}if(t===`files-type-filter`){let t=n.value;return i.filesTypeFilter=t===`folder`||t===`file`||t===`image`||t===`document`||t===`audio`||t===`video`||t===`archive`||t===`other`?t:`all`,e.render(),!0}if(t===`files-clear-selection`)return i.checkedFilePaths=[],A(e),e.render(),!0;if(t===`files-upload-files`)return gr(e,`files`),!0;if(t===`files-upload-folder`)return gr(e,`folder`),!0;if(t===`files-nav`){i.filesPath=n.dataset.path??``,i.filesRenamePath=null,i.filesDeletePaths=null,i.filesTransfer=null,i.filesMkdirOpen=!1,R(e),A(e),i.checkedFilePaths=[],i.busy=!0,e.clearFlash(),e.render();try{await j(e)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Failed to open folder`)}finally{i.busy=!1,e.render()}return!0}if(t===`files-toggle`){r.stopPropagation();let t=n.dataset.path??``;return!t||(n.checked?i.checkedFilePaths.includes(t)||(i.checkedFilePaths=[...i.checkedFilePaths,t]):i.checkedFilePaths=i.checkedFilePaths.filter(e=>e!==t),i.filesItemMenu&&!i.checkedFilePaths.includes(i.filesItemMenu.path)&&A(e),e.render(),!0)}if(t===`files-select-all`){r.stopPropagation();let t=n.checked,a=Nr(i.filesEntries,{search:i.filesSearch,type:i.filesTypeFilter,sort:i.filesSort,order:i.filesOrder});return i.checkedFilePaths=t?a.map(e=>e.path):[],i.filesItemMenu&&!i.checkedFilePaths.includes(i.filesItemMenu.path)&&A(e),e.render(),!0}if(t===`files-copy`){let t=n.dataset.path??``;return!t||(R(e),A(e),dn(e,`copy`,[t]),!0)}if(t===`files-move`){let t=n.dataset.path??``;return!t||(R(e),A(e),dn(e,`move`,[t]),!0)}if(t===`files-bulk-copy`)return i.checkedFilePaths.length===0||(R(e),A(e),dn(e,`copy`,[...i.checkedFilePaths]),!0);if(t===`files-bulk-move`)return i.checkedFilePaths.length===0||(R(e),A(e),dn(e,`move`,[...i.checkedFilePaths]),!0);if(t===`files-bulk-download`){let t=Qt(i.filesEntries,i.checkedFilePaths);return t.downloadItems.length===0||(A(e),sn(t.downloadItems),e.render(),!0)}if(t===`files-tree-select`){if(r.preventDefault(),r.stopPropagation(),!i.filesTransfer)return!0;let t=n.dataset.path??``;return un(e,t,i.filesTransfer.paths)?!0:(i.filesTransferDest=t,e.render(),!0)}if(t===`files-tree-toggle`||t===`files-tree-retry`){if(r.preventDefault(),r.stopPropagation(),!i.filesTransfer)return!0;let a=n.dataset.path??``;if(t===`files-tree-retry`){let t={...i.filesTreeChildren};return delete t[a],i.filesTreeChildren=t,i.filesTreeExpanded.includes(a)||(i.filesTreeExpanded=[...i.filesTreeExpanded,a]),fn(e,a),!0}return i.filesTreeExpanded.includes(a)?(i.filesTreeExpanded=i.filesTreeExpanded.filter(e=>e!==a),e.render()):(i.filesTreeExpanded=[...i.filesTreeExpanded,a],fn(e,a)),!0}if(t===`files-transfer-close`)return M(e),e.render(),!0;if(t===`files-bulk-delete`)return i.checkedFilePaths.length===0||(i.filesDeletePaths=[...i.checkedFilePaths],i.filesRenamePath=null,M(e),R(e),A(e),e.render(),!0);if(t===`files-refresh`){A(e),i.busy=!0,e.clearFlash(),e.render();try{await j(e),e.setFlash(`success`,`Refreshed`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Refresh failed`)}finally{i.busy=!1,e.render()}return!0}if(t===`files-mkdir`)return i.filesMkdirOpen=!0,i.filesUploadMenuOpen=!1,z(e),i.filesUploadDropActive=!1,i.filesRenamePath=null,i.filesDeletePaths=null,M(e),R(e),A(e),e.clearFlash(),e.render(),!0;if(t===`files-mkdir-close`)return i.filesMkdirOpen=!1,e.render(),!0;if(t===`files-rename-open`){let t=n.dataset.path||(i.checkedFilePaths.length===1?i.checkedFilePaths[0]:``);return!t||(i.filesRenamePath=t,i.filesDeletePaths=null,M(e),i.filesUploadMenuOpen=!1,z(e),R(e),A(e),e.render(),!0)}if(t===`files-rename-close`)return i.filesRenamePath=null,e.render(),!0;if(t===`files-delete-open`){let t=n.dataset.path??``;return i.filesDeletePaths=t?[t]:null,i.filesRenamePath=null,M(e),i.filesUploadMenuOpen=!1,z(e),R(e),A(e),e.render(),!0}if(t===`files-delete-close`)return i.filesDeletePaths=null,e.render(),!0;if(t===`files-delete-confirm`){let t=i.filesDeletePaths?[...i.filesDeletePaths]:[];if(t.length===0)return!0;i.busy=!0,e.clearFlash(),e.render();try{if(t.length===1)await E.filesDelete(t[0]),S.event(`files.delete`,{path:t[0]}),e.setFlash(`success`,`Deleted`);else{let n=await E.filesBulk(`delete`,t);S.event(`files.bulk-delete`,{ok:n.ok,failed:n.failed}),n.failed===0?e.setFlash(`success`,n.ok===1?`Deleted 1 item`:`Deleted ${n.ok} items`):n.ok>0?e.setFlash(`info`,`Deleted ${n.ok}; ${n.failed} failed. ${n.errors[0]||``}`):e.setFlash(`error`,n.errors[0]||`Delete failed`)}i.filesDeletePaths=null,i.checkedFilePaths=[],await j(e)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Delete failed`)}finally{i.busy=!1,e.render()}return!0}if(t===`files-download`)return S.event(`files.download`,{path:n.getAttribute(`href`)??``}),!0;if(t===`files-preview-open`){let t=n.dataset.path??``;return t&&ar(e,t),!0}if(t===`files-preview-close`)return R(e),e.render(),!0;if(t===`files-preview-download`){let e=i.filesPreview;if(!e)return!0;let t=document.createElement(`a`);return t.href=E.filesDownloadUrl(e.path),t.download=e.name,t.rel=`noopener`,document.body.appendChild(t),t.click(),t.remove(),S.event(`files.download`,{path:e.path,via:`preview`}),!0}return t===`close-files-upload-progress`?(i.filesUploadProgress&&(i.filesUploadProgress.phase===`done`||i.filesUploadProgress.phase===`error`)&&ur(e),!0):t===`files-upload-conflict-cancel`?(Cr(e,`cancel`),!0):t===`files-upload-conflict-skip`?(Cr(e,`skip`),!0):t===`files-upload-conflict-overwrite`&&(Cr(e,`overwrite`),!0)}function zr(e){let{root:t}=e;t.querySelectorAll(`input[data-action="files-select-all"][data-indeterminate="1"]`).forEach(e=>{e.indeterminate=!0}),tn(e),e.state.filesItemMenu&&(t.querySelector(`#files-item-menu`)?(nn(e),rn(e)):e.state.filesItemMenu=null)}function Br(e){return e===`overview`||e===`users`||e===`settings`||e===`database`||e===`configuration`?e:null}function V(e,t){let n=e.state.adminCapabilities?.pages;return n?n.find(e=>e.id===t)??null:null}function Vr(e,t){switch(t){case`full`:return`Full`;case`read-only`:return`Read-only`;case`coming-soon`:return`Coming soon`;case`deferred`:return`Unavailable`;default:return t}}function Hr(e,t){return t===`full`||t===`read-only`?`badge-ok`:t===`deferred`?`badge-off`:`badge-soon`}function Ur(t){let n=[`overview`,`settings`,`users`,`database`,`configuration`],r={overview:`Overview`,settings:`System settings`,users:`Users`,database:`Database`,configuration:`Configuration`},i=t.state.adminCapabilities?.pages,a=new Map;if(i)for(let e of i)Br(e.id)&&a.set(e.id,e);return n.map(n=>{let i=a.get(n),o=i?.label||r[n],s=i?.status??(n===`overview`?`read-only`:`full`),c=i?.available===!1;return`<button type="button" role="tab" class="tab-btn${t.state.adminPage===n?` is-active`:``}${c?` is-gated`:``}"
          data-action="admin-page" data-admin-page="${n}"
          aria-selected="${t.state.adminPage===n}"
          title="${e(o)}${c?` — `+Vr(t,s):``}">
          ${e(o)}
        </button>`}).join(``)}function Wr(t,n){let r=V(t,n),i=r?.status??`coming-soon`,a=r?.label??n,o=r?.summary||`This area is not available in portal Administration yet.`,s=Vr(t,i);return`<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${Hr(t,i)}">${e(s)}</span>
      <h2 class="admin-coming-soon-title">${e(a)}</h2>
    </div>
    <p class="muted">${e(o)}</p>
  </section>`}function Gr(t,n,r,i){return`<div class="admin-stat-card">
    <div class="admin-stat-value mono">${e(String(r))}</div>
    <div class="admin-stat-label">${e(n)}</div>
    ${i?`<div class="admin-stat-hint muted small">${e(i)}</div>`:``}
  </div>`}function Kr(t,n,r){return`<span class="badge ${n?`badge-ok`:`badge-off`}">${e(r)}: ${n?`On`:`Off`}</span>`}function qr(e,t){return`<span class="badge ${t?`badge-ok`:`badge-off`}">${t?`On`:`Off`}</span>`}async function Jr(e){e.state.adminCapabilitiesError=null;try{let t=await E.adminCapabilities();e.state.adminCapabilities=t.data,S.debug(`admin.capabilities`,{uiEnabled:e.state.adminCapabilities.uiEnabled,pages:e.state.adminCapabilities.pages?.length??0})}catch(t){e.state.adminCapabilitiesError=t instanceof Error?t.message:`Failed to load capabilities`,e.state.adminCapabilities={uiEnabled:!0,portalAdminUrl:`/portal/#admin`,pages:[{id:`overview`,label:`Overview`,status:`full`,available:!0,portalUrl:`/portal/#admin`,portalLabel:`Overview`,summary:`Live counts and service flags.`},{id:`settings`,label:`System settings`,status:`full`,available:!0,portalUrl:`/portal/#admin/settings`,portalLabel:`System settings`,summary:`Edit system flags and admin password in the portal.`},{id:`users`,label:`Users`,status:`full`,available:!0,portalUrl:`/portal/#admin/users`,portalLabel:`Users`,summary:`Full DAV user CRUD plus calendars and address books.`},{id:`database`,label:`Database`,status:`full`,available:!0,portalUrl:`/portal/#admin/database`,portalLabel:`Database`,summary:`Connection settings; saves require typing CONFIRM.`}]},S.warn(`admin.capabilities fallback`,e.state.adminCapabilitiesError)}}async function Yr(e){e.state.adminDashboardLoading=!0,e.state.adminDashboardError=null;try{let t=await E.adminDashboard();e.state.adminDashboard=t.data,S.debug(`admin.dashboard`,{users:e.state.adminDashboard.users,calendars:e.state.adminDashboard.calendars})}catch(t){throw e.state.adminDashboard=null,e.state.adminDashboardError=t instanceof Error?t.message:`Failed to load dashboard`,t}finally{e.state.adminDashboardLoading=!1}}async function Xr(e){e.state.adminUsersLoading=!0,e.state.adminUsersError=null;try{let t=await E.adminUsers();e.state.adminUsers=t.users??[],S.debug(`admin.users`,{count:e.state.adminUsers.length})}catch(t){throw e.state.adminUsers=[],e.state.adminUsersError=t instanceof Error?t.message:`Failed to load users`,t}finally{e.state.adminUsersLoading=!1}}async function H(e,t){e.state.adminUserDetailLoading=!0,e.state.adminUserDetailError=null;try{let n=await E.adminUser(t);e.state.adminUserDetail=n.user,e.state.adminSelectedUsername=n.user.username,S.debug(`admin.user`,{username:n.user.username})}catch(t){throw e.state.adminUserDetail=null,e.state.adminUserDetailError=t instanceof Error?t.message:`Failed to load user`,t}finally{e.state.adminUserDetailLoading=!1}}async function Zr(e,t){e.state.adminUserResourcesLoading=!0;try{let[n,r]=await Promise.all([E.adminUserCalendars(t),E.adminUserAddressBooks(t)]);e.state.adminUserCalendars=n.calendars??[],e.state.adminUserAddressBooks=r.addressbooks??[]}catch(t){throw e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],t}finally{e.state.adminUserResourcesLoading=!1}}async function Qr(e){e.state.adminSystemSettingsLoading=!0,e.state.adminSystemSettingsError=null;try{let t=await E.adminSystemSettings();e.state.adminSystemSettings=t.data}catch(t){throw e.state.adminSystemSettings=null,e.state.adminSystemSettingsError=t instanceof Error?t.message:`Failed to load settings`,t}finally{e.state.adminSystemSettingsLoading=!1}}async function $r(e){e.state.adminDatabaseSettingsLoading=!0,e.state.adminDatabaseSettingsError=null;try{let t=await E.adminDatabaseSettings();e.state.adminDatabaseSettings=t.data;let n=(t.data.backend||`sqlite`).toLowerCase();e.state.adminDbFormBackend=n===`pgsql`?`pgsql`:`sqlite`}catch(t){throw e.state.adminDatabaseSettings=null,e.state.adminDatabaseSettingsError=t instanceof Error?t.message:`Failed to load database settings`,t}finally{e.state.adminDatabaseSettingsLoading=!1}}function ei(t){let n=V(t,`overview`);if(n&&n.available===!1)return Wr(t,`overview`);let r=`<p class="muted small admin-session-line">
    Signed in as <span class="mono">${e(t.state.user?.username??``)}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`,i=``,a=``;if(t.state.adminDashboardLoading&&!t.state.adminDashboard)a=`<section class="card"><p class="muted">Loading overview…</p></section>`;else if(t.state.adminDashboardError&&!t.state.adminDashboard)a=`<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${e(t.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${t.state.busy?`disabled`:``}>Retry</button>
    </section>`;else if(t.state.adminDashboard){let o=t.state.adminDashboard,s=o.services,c=o.links??{},l=n?`<span class="badge ${Hr(t,n.status)}">${e(Vr(t,n.status))}</span>`:``,u=o.version?e(o.version):`—`,d=o.git?e(o.git):``;i=`
      <section class="card admin-about-card">
        <div class="section-header">
          ${B(`About this system`,`admin-overview`)}
          <div class="section-actions">
            ${l}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${t.state.busy||t.state.adminDashboardLoading?`disabled`:``}>Refresh</button>
          </div>
        </div>
        <div class="admin-about-grid">
          <div>
            <h3 class="admin-subsection-title">Version</h3>
            <p>
              AngaraDAV <span class="badge badge-admin">v${u}</span>
              ${d?`<span class="mono muted small"> (${d})</span>`:``}
            </p>
            <p class="muted small admin-link-row">
              ${c.releases?`<a href="${e(c.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>`:``}
              ${c.docs?`${c.releases?`<span class="footer-sep">·</span>`:``}<a href="${e(c.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>`:``}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${qr(t,s.administration!==!1&&s.webAdmin!==!1)}</td></tr>
                  <tr><td>CalDAV</td><td>${qr(t,!!s.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${qr(t,!!s.carddav)}</td></tr>
                  <tr><td>Files</td><td>${qr(t,!!s.files)}</td></tr>
                  <tr><td>Tasks</td><td>${qr(t,!!s.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${qr(t,!!s.notes)}</td></tr>
                  <tr><td>Push</td><td>${qr(t,!!s.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${r}
      </section>`;let f=o.nbusers??o.users,p=o.nbcalendars??o.calendars,m=o.nbevents??o.events,h=o.nbbooks??o.addressBooks,g=o.nbcontacts??o.contacts;a=`
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${Gr(t,`Registered users`,f,`Users`)}
          ${Gr(t,`Calendars`,p,`CalDAV`)}
          ${Gr(t,`Events`,m,`CalDAV`)}
          ${Gr(t,`Address books`,h,`CardDAV`)}
          ${Gr(t,`Contacts`,g,`CardDAV`)}
        </div>
        <div class="admin-service-row">
          ${Kr(t,s.administration!==!1&&s.webAdmin!==!1,`Administration`)}
          ${Kr(t,!!s.caldav,`CalDAV`)}
          ${Kr(t,!!s.carddav,`CardDAV`)}
          ${Kr(t,!!s.files,`Files`)}
          ${Kr(t,!!s.tasks,`Tasks`)}
          ${Kr(t,!!s.notes,`Notes`)}
          ${Kr(t,!!s.push,`Push`)}
        </div>
      </section>`}else a=`<section class="card">
      ${B(`System snapshot`,`admin-overview`)}
      ${r}
    </section>`;return`${i}
    ${a}`}function ti(e){let t=e.state.adminUsersQuery.trim().toLowerCase();return t?e.state.adminUsers.filter(e=>e.username.toLowerCase().includes(t)||(e.displayname||``).toLowerCase().includes(t)||(e.email||``).toLowerCase().includes(t)):e.state.adminUsers}function ni(e){return e.state.adminUserCreateOpen?a({id:`admin-user-create-modal`,title:`Add user`,titleId:`admin-user-create-title`,closeAction:`admin-user-create-close`,size:`sm`,form:!0,formAttrs:`data-form="admin-user-create"`,body:`
        <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
          <label>Username
            <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${e.state.busy?`disabled`:``} />
          </label>
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${e.state.busy?`disabled`:``} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" autocomplete="off" ${e.state.busy?`disabled`:``} />
          </label>
          <label>Password
            <input type="password" name="password" required autocomplete="new-password" ${e.state.busy?`disabled`:``} />
          </label>
          <label>Confirm password
            <input type="password" name="passwordConfirm" required autocomplete="new-password" ${e.state.busy?`disabled`:``} />
          </label>`,footer:[{label:`Cancel`,action:`admin-user-create-close`,variant:`ghost`,disabled:e.state.busy},{label:`Create user`,type:`submit`,variant:`primary`,disabled:e.state.busy}]}):``}function ri(t){if(!t.state.adminUserEditOpen||!t.state.adminUserDetail)return``;let n=t.state.adminUserDetail;return a({id:`admin-user-edit-modal`,title:`Edit user`,titleId:`admin-user-edit-title`,closeAction:`admin-user-edit-close`,size:`sm`,form:!0,formAttrs:`data-form="admin-user-edit"`,body:`
        <p class="muted small">Username <span class="mono">${e(n.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${e(n.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${e(n.displayname)}" autocomplete="off" ${t.state.busy?`disabled`:``} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${e(n.email)}" autocomplete="off" ${t.state.busy?`disabled`:``} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${t.state.busy?`disabled`:``} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${t.state.busy?`disabled`:``} />
          </label>`,footer:[{label:`Cancel`,action:`admin-user-edit-close`,variant:`ghost`,disabled:t.state.busy},{label:`Save changes`,type:`submit`,variant:`primary`,disabled:t.state.busy}]})}function ii(t){if(!t.state.adminUserDeleteUsername)return``;let n=t.state.adminUserDeleteUsername,r=t.state.adminUserDetail&&t.state.adminUserDetail.username.toLowerCase()===n.toLowerCase()?t.state.adminUserDetail:t.state.adminUsers.find(e=>e.username.toLowerCase()===n.toLowerCase())??null;return a({id:`admin-user-delete-modal`,title:`Delete user`,titleId:`admin-user-delete-title`,closeAction:`admin-user-delete-close`,size:`sm`,body:`
        <p>You are about to permanently delete <strong>${e(r?`${r.displayname||r.username} (${r.username})`:n)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${o({action:`admin-user-delete-toggle`,label:`I understand and want to delete this user`,checked:t.state.adminUserDeleteConfirmChecked,disabled:t.state.busy,style:`admin`})}`,footer:[{label:`Cancel`,action:`admin-user-delete-close`,variant:`ghost`,disabled:t.state.busy},{label:`Delete permanently`,action:`admin-user-delete-confirm`,variant:`danger`,disabled:t.state.busy||!t.state.adminUserDeleteConfirmChecked,attrs:`data-username="${e(n)}"`}]})}function ai(t){if(!t.state.adminSelectedUsername)return``;if(t.state.adminUserDetailLoading&&!t.state.adminUserDetail)return`<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${e(t.state.adminSelectedUsername)}</span>…</p>
    </section>`;if(t.state.adminUserDetailError&&!t.state.adminUserDetail)return`<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${e(t.state.adminUserDetailError)}</p>
    </section>`;if(!t.state.adminUserDetail)return``;let n=t.state.adminUserDetail,r=t.state.adminUserResourcesLoading&&t.state.adminUserCalendars.length===0?`<tr><td colspan="5" class="muted">Loading calendars…</td></tr>`:t.state.adminUserCalendars.length===0?`<tr><td colspan="5" class="muted">No calendars.</td></tr>`:t.state.adminUserCalendars.map(n=>`<tr>
        <td class="mono">${e(n.uri)}</td>
        <td>${e(n.displayname)}</td>
        <td class="hide-sm">${e(String(n.eventCount))}${n.todos?` <span class="badge badge-admin">tasks</span>`:``}${n.notes?` <span class="badge badge-admin">notes</span>`:``}</td>
        <td class="hide-sm mono small">${e(n.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${n.instanceId}" ${t.state.busy?`disabled`:``}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${n.instanceId}" data-label="${e(n.displayname)}" ${t.state.busy?`disabled`:``}>Delete</button>
        </td>
      </tr>`).join(``),i=t.state.adminUserResourcesLoading&&t.state.adminUserAddressBooks.length===0?`<tr><td colspan="4" class="muted">Loading address books…</td></tr>`:t.state.adminUserAddressBooks.length===0?`<tr><td colspan="4" class="muted">No address books.</td></tr>`:t.state.adminUserAddressBooks.map(n=>`<tr>
        <td class="mono">${e(n.uri)}</td>
        <td>${e(n.displayname)}</td>
        <td class="hide-sm">${e(String(n.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${n.id}" ${t.state.busy?`disabled`:``}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${n.id}" data-label="${e(n.displayname)}" ${t.state.busy?`disabled`:``}>Delete</button>
        </td>
      </tr>`).join(``),o=t.state.adminCalEditId===null?null:t.state.adminUserCalendars.find(e=>e.instanceId===t.state.adminCalEditId)??null,s=t.state.adminAbEditId===null?null:t.state.adminUserAddressBooks.find(e=>e.id===t.state.adminAbEditId)??null,c=t.state.adminCalModal===`create`||t.state.adminCalModal===`edit`&&o?a({title:t.state.adminCalModal===`create`?`Add calendar`:`Edit calendar`,closeAction:`admin-cal-close`,size:`sm`,form:!0,formAttrs:`data-form="admin-cal"`,body:`
          <input type="hidden" name="instanceId" value="${o?o.instanceId:``}" />
          ${t.state.adminCalModal===`create`?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${t.state.busy?`disabled`:``} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`:`<p class="muted small">URI <span class="mono">${e(o.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${e(o?.displayname??``)}" ${t.state.busy?`disabled`:``} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${t.state.busy?`disabled`:``}>${e(o?.description??``)}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${e(o?.calendarcolor??``)}" ${t.state.busy?`disabled`:``} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${o?.todos||t.state.adminCalModal===`create`?`checked`:``} ${t.state.busy?`disabled`:``} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${o?.notes?`checked`:``} ${t.state.busy?`disabled`:``} /> Notes (VJOURNAL)</label>`,footer:[{label:`Cancel`,action:`admin-cal-close`,variant:`ghost`,disabled:t.state.busy},{label:`Save`,type:`submit`,variant:`primary`,disabled:t.state.busy}]}):``,l=t.state.adminAbModal===`create`||t.state.adminAbModal===`edit`&&s?a({title:t.state.adminAbModal===`create`?`Add address book`:`Edit address book`,closeAction:`admin-ab-close`,size:`sm`,form:!0,formAttrs:`data-form="admin-ab"`,body:`
          <input type="hidden" name="id" value="${s?s.id:``}" />
          ${t.state.adminAbModal===`create`?`<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${t.state.busy?`disabled`:``} />
          </label>`:`<p class="muted small">URI <span class="mono">${e(s.uri)}</span> (read-only)</p>`}
          <label>Display name
            <input type="text" name="displayname" required value="${e(s?.displayname??``)}" ${t.state.busy?`disabled`:``} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${t.state.busy?`disabled`:``}>${e(s?.description??``)}</textarea>
          </label>`,footer:[{label:`Cancel`,action:`admin-ab-close`,variant:`ghost`,disabled:t.state.busy},{label:`Save`,type:`submit`,variant:`primary`,disabled:t.state.busy}]}):``,u=t.state.adminResourceDelete?a({title:`Delete ${t.state.adminResourceDelete.kind===`calendar`?`calendar`:`address book`}`,closeAction:`admin-resource-delete-close`,size:`sm`,body:`
        <p>Delete <strong>${e(t.state.adminResourceDelete.label)}</strong> for <span class="mono">${e(n.username)}</span>?</p>
        ${t.state.adminResourceDelete.kind===`addressbook`?`<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${t.state.adminResourceDelete.force?`checked`:``} /> Force delete even if contacts exist</label>`:`<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>`}`,footer:[{label:`Cancel`,action:`admin-resource-delete-close`,variant:`ghost`},{label:`Delete`,action:`admin-resource-delete-confirm`,variant:`danger`,disabled:t.state.busy}]}):``;return`<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${e(n.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${e(n.username)}" ${t.state.busy?`disabled`:``}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${e(n.username)}" ${t.state.busy?`disabled`:``}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${e(n.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${e(n.username)}</dd></div>
      <div><dt>Display name</dt><dd>${e(n.displayname||`—`)}</dd></div>
      <div><dt>Email</dt><dd>${n.email?`<a href="mailto:${e(n.email)}">${e(n.email)}</a>`:`—`}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${e(n.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${e(String(n.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${e(String(n.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${e(String(n.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${e(String(n.contactCount))}</dd></div>
    </dl>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Calendars</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${t.state.busy?`disabled`:``}>Add calendar</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
        <tbody>${r}</tbody>
      </table>
    </div>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Address books</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${t.state.busy?`disabled`:``}>Add address book</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
        <tbody>${i}</tbody>
      </table>
    </div>
  </section>
  ${c}${l}${u}`}function oi(t){let n=V(t,`users`);if(n&&n.available===!1)return Wr(t,`users`);let r=ti(t),i=t.state.adminUsersLoading&&t.state.adminUsers.length===0?`<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>`:r.length===0?`<tr><td colspan="4" class="muted admin-table-empty">${t.state.adminUsersError?e(t.state.adminUsersError):t.state.adminUsersQuery.trim()?`No users match this filter.`:`No users found.`}</td></tr>`:r.map(n=>`<tr class="contact-table-row${t.state.adminSelectedUsername&&t.state.adminSelectedUsername.toLowerCase()===n.username.toLowerCase()?` is-selected`:``}" data-action="admin-user-view" data-username="${e(n.username)}" tabindex="0" role="button">
                <td class="mono">${e(n.username)}</td>
                <td class="hide-sm">${e(n.displayname||`—`)}</td>
                <td class="hide-sm">${e(n.email||`—`)}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${e(n.username)}" ${t.state.busy?`disabled`:``}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${e(n.username)}" ${t.state.busy?`disabled`:``}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${e(n.username)}" ${t.state.busy?`disabled`:``}>Delete</button>
                </td>
              </tr>`).join(``);return`
    <section class="card">
      <div class="section-header">
        ${B(`Users`,`admin-users`)}
        <div class="section-actions">
          ${n?`<span class="badge ${Hr(t,n.status)}">${e(Vr(t,n.status))}</span>`:``}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${t.state.busy||t.state.adminUsersLoading?`disabled`:``}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${t.state.busy?`disabled`:``}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${e(t.state.adminUsersQuery)}" aria-label="Filter users" ${t.state.busy?`disabled`:``} />
        <span class="muted small">${e(String(r.length))}${t.state.adminUsersQuery.trim()?` / ${t.state.adminUsers.length}`:``} user${r.length===1?``:`s`}</span>
      </div>
      ${t.state.adminUsersError&&t.state.adminUsers.length>0?`<p class="flash flash-error" style="margin:0.75rem 0">${e(t.state.adminUsersError)}</p>`:``}
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
          <tbody>${i}</tbody>
        </table>
      </div>
    </section>
    ${ai(t)}
    ${ni(t)}
    ${ri(t)}
    ${ii(t)}`}async function si(e,t){let n=new FormData(t),r=String(n.get(`username`)??``).trim(),i=String(n.get(`displayname`)??``).trim(),a=String(n.get(`email`)??``).trim(),o=String(n.get(`password`)??``),s=String(n.get(`passwordConfirm`)??``);if(!r||!i||!a||!o){e.setFlash(`error`,`Username, display name, email, and password are required`),e.render();return}if(o!==s){e.setFlash(`error`,`Password confirmation does not match`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.adminCreateUser({username:r,displayname:i,email:a,password:o,passwordConfirm:s});S.event(`admin.user.create`,{username:t.user.username}),e.state.adminUserCreateOpen=!1,e.state.adminSelectedUsername=t.user.username,e.state.adminUserDetail=t.user,e.persistTab(`admin`,`users`,t.user.username),await Xr(e),e.setFlash(`success`,`Created user “${t.user.username}”`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Create failed`)}finally{e.state.busy=!1,e.render()}}async function ci(e,t){let n=new FormData(t),r=String(n.get(`username`)??``).trim(),i=String(n.get(`displayname`)??``).trim(),a=String(n.get(`email`)??``).trim(),o=String(n.get(`password`)??``),s=String(n.get(`passwordConfirm`)??``);if(!r){e.setFlash(`error`,`Username is required`),e.render();return}if(!i||!a){e.setFlash(`error`,`Display name and email are required`),e.render();return}if(o!==``||s!==``){if(o===``||s===``){e.setFlash(`error`,`Password and confirmation are required to change password`),e.render();return}if(o!==s){e.setFlash(`error`,`Password confirmation does not match`),e.render();return}}e.state.busy=!0,e.clearFlash(),e.render();try{let t={displayname:i,email:a};o!==``&&(t.password=o,t.passwordConfirm=s);let n=await E.adminUpdateUser(r,t);S.event(`admin.user.update`,{username:n.user.username,passwordChanged:o!==``}),e.state.adminUserEditOpen=!1,e.state.adminUserDetail=n.user,e.state.adminSelectedUsername=n.user.username,await Xr(e),e.setFlash(`success`,o===``?`Updated “${n.user.username}”`:`Updated “${n.user.username}” (password changed)`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Update failed`)}finally{e.state.busy=!1,e.render()}}async function li(e,t){if(!e.state.adminSelectedUsername)return;let n=e.state.adminSelectedUsername,r=new FormData(t),i=String(r.get(`displayname`)??``).trim(),a=String(r.get(`description`)??``).trim(),o=String(r.get(`calendarcolor`)??``).trim(),s=t.querySelector(`input[name="todos"]`)?.checked??!1,c=t.querySelector(`input[name="notes"]`)?.checked??!1;e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminCalModal===`create`){let t=String(r.get(`uri`)??``).trim().toLowerCase();await E.adminCreateUserCalendar(n,{uri:t,displayname:i,description:a,calendarcolor:o||void 0,todos:s,notes:c}),e.setFlash(`success`,`Created calendar “${i}”`)}else{let t=Number(r.get(`instanceId`));await E.adminUpdateUserCalendar(n,t,{displayname:i,description:a,calendarcolor:o,todos:s,notes:c}),e.setFlash(`success`,`Updated calendar “${i}”`)}e.state.adminCalModal=null,e.state.adminCalEditId=null,await Zr(e,n),await H(e,n)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function ui(e,t){if(!e.state.adminSelectedUsername)return;let n=e.state.adminSelectedUsername,r=new FormData(t),i=String(r.get(`displayname`)??``).trim(),a=String(r.get(`description`)??``).trim();e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.adminAbModal===`create`){let t=String(r.get(`uri`)??``).trim().toLowerCase();await E.adminCreateUserAddressBook(n,{uri:t,displayname:i,description:a}),e.setFlash(`success`,`Created address book “${i}”`)}else{let t=Number(r.get(`id`));await E.adminUpdateUserAddressBook(n,t,{displayname:i,description:a}),e.setFlash(`success`,`Updated address book “${i}”`)}e.state.adminAbModal=null,e.state.adminAbEditId=null,await Zr(e,n),await H(e,n)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}var di=`UTC.Africa/Cairo.Africa/Johannesburg.America/Anchorage.America/Argentina/Buenos_Aires.America/Chicago.America/Denver.America/Edmonton.America/Halifax.America/Los_Angeles.America/Mexico_City.America/New_York.America/Sao_Paulo.America/Toronto.America/Vancouver.Asia/Dubai.Asia/Hong_Kong.Asia/Jerusalem.Asia/Kolkata.Asia/Seoul.Asia/Shanghai.Asia/Singapore.Asia/Tokyo.Australia/Melbourne.Australia/Sydney.Europe/Amsterdam.Europe/Berlin.Europe/London.Europe/Madrid.Europe/Moscow.Europe/Paris.Europe/Rome.Europe/Warsaw.Pacific/Auckland.Pacific/Honolulu`.split(`.`),fi=null;function pi(){if(fi)return fi;try{let e=Intl;if(typeof e.supportedValuesOf==`function`){let t=e.supportedValuesOf(`timeZone`);if(Array.isArray(t)&&t.length>0)return fi=[...t].sort((e,t)=>e.localeCompare(t)),fi}}catch{}return fi=[...di],fi}function mi(e){let t=e||`UTC`,n=pi(),r=n.includes(t),i=n.map(e=>`<option value="${hi(e)}" ${e===t?`selected`:``}>${gi(e)}</option>`);return!r&&t&&i.unshift(`<option value="${hi(t)}" selected>${gi(t)}</option>`),i.join(``)}function hi(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`)}function gi(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function _i(t){let n=V(t,`settings`);if(n&&n.available===!1)return Wr(t,`settings`);if(t.state.adminSystemSettingsLoading&&!t.state.adminSystemSettings)return`<section class="card"><p class="muted">Loading system settings…</p></section>`;if(t.state.adminSystemSettingsError&&!t.state.adminSystemSettings)return`<section class="card">
      <p class="flash flash-error">${e(t.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;let r=t.state.adminSystemSettings;if(!r)return`<section class="card"><p class="muted">No settings loaded.</p></section>`;let i=(n,i,a)=>`<label class="check-row"><input type="checkbox" name="${e(n)}" ${i?`checked`:``} ${t.state.busy||r.writable===!1?`disabled`:``} /> ${e(a)}</label>`,a=(n,i,a,o=``)=>`<label>${e(a)}
      <input type="number" name="${e(n)}" value="${e(String(i??0))}" ${t.state.busy||r.writable===!1?`disabled`:``} />
      ${o?`<span class="muted small">${e(o)}</span>`:``}
    </label>`;return`
    <section class="card">
      <div class="section-header">
        ${B(`System settings`,`admin-settings`)}
        <div class="section-actions">
          ${n?`<span class="badge ${Hr(t,n.status)}">${e(Vr(t,n.status))}</span>`:``}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${t.state.busy?`disabled`:``}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
        <strong>session timeout</strong> affects portal idle sessions.
        ${r.writable===!1?`<span class="flash flash-error">Config is not writable by PHP.</span>`:``}
      </p>
      <form class="stack admin-settings-form" data-form="admin-settings">
        <h3 class="admin-subsection-title">DAV services</h3>
        ${i(`cal_enabled`,!!r.cal_enabled,`Enable CalDAV`)}
        ${i(`card_enabled`,!!r.card_enabled,`Enable CardDAV`)}
        ${i(`tasks_enabled`,!!r.tasks_enabled,`Enable Tasks (VTODO)`)}
        ${i(`notes_enabled`,!!r.notes_enabled,`Enable Notes (VJOURNAL)`)}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${[`Digest`,`Basic`,`Apache`].map(e=>`<option value="${e}" ${r.dav_auth_type===e?`selected`:``}>${e}</option>`).join(``)}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${mi(r.timezone||`UTC`)}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${e(r.invite_from||``)}" placeholder="noreply@example.com" ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${i(`files_enabled`,!!r.files_enabled,`Enable WebDAV file storage`)}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${e(r.files_storage_path||``)}" placeholder="empty = Specific/files" ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>
        ${a(`files_max_upload_mb`,r.files_max_upload_mb,`Max file size (MB)`)}
        ${a(`files_quota_mb`,r.files_quota_mb,`Quota per user (MB)`,`0 = unlimited`)}
        ${a(`files_quarantine_days`,r.files_quarantine_days,`Deleted user file retention (days)`)}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${a(`session_max_age_minutes`,r.session_max_age_minutes,`Session idle timeout (minutes)`,`Portal session`)}
        <label>Portal log level
          <select name="portal_log_level" ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${[`off`,`error`,`warn`,`info`,`debug`].map(e=>`<option value="${e}" ${(r.portal_log_level||`off`)===e?`selected`:``}>${e}</option>`).join(``)}
          </select>
        </label>
        <label>Time format
          <select name="portal_time_format" ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${[[`auto`,`Auto (browser)`],[`12h`,`12-hour`],[`24h`,`24-hour`]].map(([e,t])=>`<option value="${e}" ${(r.portal_time_format||`auto`)===e?`selected`:``}>${t}</option>`).join(``)}
          </select>
          <span class="muted small">Every portal user. Does not change stored events or phone apps.</span>
        </label>
        <label>Week starts on
          <select name="portal_week_start" ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${[[`auto`,`Auto (browser)`],[`monday`,`Monday`],[`sunday`,`Sunday`]].map(([e,t])=>`<option value="${e}" ${(r.portal_week_start||`auto`)===e?`selected`:``}>${t}</option>`).join(``)}
          </select>
          <span class="muted small">Calendar grid and date picker. ISO week numbers stay Monday-based.</span>
        </label>
        ${i(`portal_admin_ui_enabled`,r.portal_admin_ui_enabled!==!1,`Portal Administration UI enabled`)}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${e(Array.isArray(r.portal_admin_users)?r.portal_admin_users.join(`, `):String(r.portal_admin_users||``))}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${i(`push_enabled`,!!r.push_enabled,`Enable WebDAV-Push`)}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${e(r.push_external_url||``)}" placeholder="https://dav.example.com/dav.php/" ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${t.state.busy||r.writable===!1?`disabled`:``}>
            ${[`off`,`error`,`warn`,`info`,`debug`].map(e=>`<option value="${e}" ${(r.push_log_level||`off`)===e?`selected`:``}>${e}</option>`).join(``)}
          </select>
        </label>

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">baikal.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${r.hasAdminPassword?`Leave blank to keep the current server admin password.`:`No server admin password set yet.`}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${t.state.busy||r.writable===!1?`disabled`:``} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${t.state.busy||r.writable===!1?`disabled`:``}>Save settings</button>
        </div>
      </form>
    </section>`}async function vi(e,t){let n=new FormData(t),r=e=>!!t.querySelector(`input[name="${e}"]`)?.checked,i={cal_enabled:r(`cal_enabled`),card_enabled:r(`card_enabled`),tasks_enabled:r(`tasks_enabled`),notes_enabled:r(`notes_enabled`),files_enabled:r(`files_enabled`),push_enabled:r(`push_enabled`),portal_admin_ui_enabled:r(`portal_admin_ui_enabled`),timezone:String(n.get(`timezone`)??``).trim(),invite_from:String(n.get(`invite_from`)??``).trim(),dav_auth_type:String(n.get(`dav_auth_type`)??`Digest`),files_storage_path:String(n.get(`files_storage_path`)??``).trim(),files_max_upload_mb:Number(n.get(`files_max_upload_mb`)??0),files_quota_mb:Number(n.get(`files_quota_mb`)??0),files_quarantine_days:Number(n.get(`files_quarantine_days`)??0),session_max_age_minutes:Number(n.get(`session_max_age_minutes`)??15),portal_log_level:String(n.get(`portal_log_level`)??`off`),portal_time_format:String(n.get(`portal_time_format`)??`auto`),portal_week_start:String(n.get(`portal_week_start`)??`auto`),portal_admin_users:String(n.get(`portal_admin_users`)??``).trim(),push_external_url:String(n.get(`push_external_url`)??``).trim(),push_log_level:String(n.get(`push_log_level`)??`off`)},a=String(n.get(`admin_password`)??``),o=String(n.get(`admin_password_confirm`)??``);(a!==``||o!==``)&&(i.admin_password=a,i.admin_password_confirm=o),e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.adminUpdateSystemSettings(i);e.state.adminSystemSettings=t.data;let n=t.data,r=String(n.portal_time_format??`auto`).toLowerCase(),a=String(n.portal_week_start??`auto`).toLowerCase();e.state.portalUi={...e.state.portalUi,timeFormat:r===`12h`||r===`24h`?r:`auto`,weekStart:a===`monday`||a===`sunday`?a:`auto`,services:{caldav:!!n.cal_enabled,carddav:!!n.card_enabled,tasks:!!n.tasks_enabled,notes:!!n.notes_enabled,files:!!n.files_enabled}},S.event(`admin.settings.save`),e.setFlash(`success`,`System settings saved`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function yi(e,t){let n=window;if(typeof n.showSaveFilePicker==`function`)try{let r=await(await n.showSaveFilePicker({suggestedName:t})).createWritable();try{await r.write(e)}finally{await r.close()}return`saved`}catch(e){if(e instanceof DOMException&&e.name===`AbortError`)return`cancelled`}let r=URL.createObjectURL(e),i=document.createElement(`a`);return i.href=r,i.download=t,i.rel=`noopener`,i.style.display=`none`,document.body.appendChild(i),i.click(),window.setTimeout(()=>{URL.revokeObjectURL(r),i.remove()},6e4),`started`}function bi(e){let t=(e.createdAt||new Date().toISOString()).replace(/[:.]/g,`-`);return`angaradav-settings-backup${e.productVersion?`-${e.productVersion}`:``}-${t}.json`}function xi(t){let n=V(t,`configuration`);return n&&n.available===!1?Wr(t,`configuration`):`
    <section class="card">
      <div class="section-header">
        ${B(`Backup`,`admin-configuration`)}
        ${n?`<span class="badge ${Hr(t,n.status)}">${e(Vr(t,n.status))}</span>`:``}
      </div>
      <p class="muted small">
        Download a JSON snapshot of the current system settings (<span class="mono">config/baikal.yaml</span>).
        It never contains passwords, secrets, or user/DAV data — only the settings shown on
        the System settings page.
      </p>
      ${t.state.adminBackupError?`<p class="flash flash-error">${e(t.state.adminBackupError)}</p>`:``}
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-primary" data-action="admin-backup-download" ${t.state.adminBackupBusy?`disabled`:``}>
          ${t.state.adminBackupBusy?`Preparing…`:`Download backup`}
        </button>
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h2>Restore</h2>
      </div>
      <p class="muted small">
        Pick a backup file to preview the changes it would make. Nothing is written until you
        review the diff and confirm.
      </p>
      <div class="form-actions-row" style="margin-top:0.75rem">
        <label class="btn btn-ghost btn-small" style="cursor:pointer">
          Choose backup file…
          <input type="file" accept="application/json,.json" data-action="admin-restore-file"
            style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden" ${t.state.adminRestoreApplying?`disabled`:``} />
        </label>
        ${t.state.adminRestoreFileName?`<span class="muted small">${e(t.state.adminRestoreFileName)}</span>`:``}
        ${t.state.adminRestoreDoc?`<button type="button" class="btn btn-ghost btn-small" data-action="admin-restore-discard" ${t.state.adminRestoreApplying?`disabled`:``}>Discard</button>`:``}
      </div>
      ${t.state.adminRestoreError?`<p class="flash flash-error">${e(t.state.adminRestoreError)}</p>`:``}
      ${Si(t)}
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
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${t.state.busy?`disabled`:``}>
          Reset to Default
        </button>
      </div>
    </section>
    ${Ci(t)}`}function Si(t){let n=t.state.adminRestorePreview;if(!n)return``;let r=Object.keys(n.changed),i=r.map(t=>{let r=n.changed[t];return`<tr>
        <td class="mono">${e(t)}</td>
        <td class="mono">${e(String(r.from??`—`))}</td>
        <td class="mono">${e(String(r.to??`—`))}</td>
      </tr>`}).join(``);return`
    <div class="stack" style="margin-top:1rem">
      ${n.versionMismatch?`<p class="flash flash-info">Backup was exported from a different AngaraDAV version (${e(n.productVersion||`unknown`)}). Values will still be validated before applying.</p>`:``}
      ${r.length?`<div class="contacts-table-wrap admin-table-placeholder">
              <table class="contacts-table">
                <thead><tr><th>Setting</th><th>Current</th><th>New</th></tr></thead>
                <tbody>${i}</tbody>
              </table>
            </div>`:`<p class="muted small">No changes — this backup matches the current settings.</p>`}
      ${n.unknown.length?`<p class="muted small">Ignored (unknown keys): ${e(n.unknown.join(`, `))}</p>`:``}
      ${n.invalid.length?`<p class="flash flash-error">Rejected (invalid values): ${e(n.invalid.map(e=>`${e.key} (${e.reason})`).join(`; `))}</p>`:``}
      <div class="form-actions-row">
        <button type="button" class="btn btn-primary" data-action="admin-restore-apply"
          ${t.state.adminRestoreApplying||r.length===0?`disabled`:``}>
          ${t.state.adminRestoreApplying?`Applying…`:`Apply changes`}
        </button>
      </div>
    </div>`}function Ci(t){return t.state.adminResetModalOpen?a({id:`admin-reset-modal`,title:`Reset to Default`,titleId:`admin-reset-title`,closeAction:`admin-reset-close`,size:`sm`,body:`
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${o({action:`admin-reset-toggle`,label:`I understand all data will be deleted and the installer will open`,checked:t.state.adminResetConfirmChecked,disabled:t.state.busy,style:`admin`})}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${e(t.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${t.state.busy?`disabled`:``} />
        </label>`,footer:[{label:`Cancel`,action:`admin-reset-close`,variant:`ghost`,disabled:t.state.busy},{label:`Reset and open installer`,action:`admin-reset-confirm`,variant:`danger`,disabled:t.state.busy||!t.state.adminResetConfirmChecked||t.state.adminResetPassword.trim()===``}]}):``}async function wi(e){e.state.adminBackupBusy=!0,e.state.adminBackupError=null,e.render();try{let t=(await E.adminSettingsBackup()).data;await yi(new Blob([JSON.stringify(t,null,2)],{type:`application/json`}),bi(t)),S.event(`admin.settings.backup-download`),e.setFlash(`success`,`Backup downloaded`)}catch(t){e.state.adminBackupError=t instanceof Error?t.message:`Backup failed`}finally{e.state.adminBackupBusy=!1,e.render()}}async function Ti(e,t){e.state.adminRestoreFileName=t.name,e.state.adminRestoreDoc=null,e.state.adminRestorePreview=null,e.state.adminRestoreError=null,e.render();let n;try{let e=await t.text();n=JSON.parse(e)}catch{e.state.adminRestoreError=`That file is not valid JSON.`,e.render();return}if(typeof n!=`object`||!n||Array.isArray(n)){e.state.adminRestoreError=`That file is not a settings backup.`,e.render();return}let r=n;e.state.adminRestoreDoc=r,e.render();try{let t=await E.adminRestoreSettings(r,{dryRun:!0});e.state.adminRestorePreview=t.data,S.event(`admin.settings.restore-preview`)}catch(t){e.state.adminRestoreError=t instanceof Error?t.message:`Could not read that backup`}finally{e.render()}}function Ei(e){e.state.adminRestoreFileName=null,e.state.adminRestoreDoc=null,e.state.adminRestorePreview=null,e.state.adminRestoreError=null,e.render()}async function Di(e){let t=e.state.adminRestoreDoc;if(t){e.state.adminRestoreApplying=!0,e.state.adminRestoreError=null,e.render();try{let n=await E.adminRestoreSettings(t,{dryRun:!1,confirm:!0});e.state.adminRestoreFileName=null,e.state.adminRestoreDoc=null,e.state.adminRestorePreview=null,S.event(`admin.settings.restore-apply`),e.setFlash(`success`,n.data.applied.length?`Restored ${n.data.applied.length} setting(s)`:`Nothing to apply`),e.state.adminSystemSettings=null}catch(t){e.state.adminRestoreError=t instanceof Error?t.message:`Restore failed`}finally{e.state.adminRestoreApplying=!1,e.render()}}}function Oi(e,t){let n=new FormData(t),r=String(n.get(`backend`)??e.state.adminDbFormBackend).toLowerCase()===`pgsql`?`pgsql`:`sqlite`,i={backend:r};return r===`sqlite`?i.sqlite_file=String(n.get(`sqlite_file`)??``).trim():(i.pgsql_host=String(n.get(`pgsql_host`)??``).trim(),i.pgsql_dbname=String(n.get(`pgsql_dbname`)??``).trim(),i.pgsql_username=String(n.get(`pgsql_username`)??``).trim(),i.pgsql_password=String(n.get(`pgsql_password`)??``)),i}function ki(e,t){e.state.adminDbPendingBody=Oi(e,t),e.state.adminDbConfirmText=``,e.state.adminDbConfirmOpen=!0,e.clearFlash(),e.render()}async function Ai(e,t){if(t||=e.root.querySelector(`[data-form="admin-database"]`),!t){e.setFlash(`error`,`Database form not found`),e.render();return}let n=Oi(e,t);e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.adminTestDatabaseConnection(n);e.setFlash(`success`,t.message||`Connection successful`),S.event(`admin.database.test`,{backend:t.backend})}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Connection test failed`)}finally{e.state.busy=!1,e.render()}}function ji(t){let n=V(t,`database`);if(n&&n.available===!1)return Wr(t,`database`);if(t.state.adminDatabaseSettingsLoading&&!t.state.adminDatabaseSettings)return`<section class="card"><p class="muted">Loading database settings…</p></section>`;if(t.state.adminDatabaseSettingsError&&!t.state.adminDatabaseSettings)return`<section class="card">
      <p class="flash flash-error">${e(t.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;let r=t.state.adminDatabaseSettings;if(!r)return`<section class="card"><p class="muted">No database settings loaded.</p></section>`;let i=t.state.adminDbFormBackend,a=r.writable===!1;return`
    <section class="card">
      <div class="section-header">
        ${B(`Database`,`admin-database`)}
        <div class="section-actions">
          ${n?`<span class="badge ${Hr(t,n.status)}">${e(Vr(t,n.status))}</span>`:``}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${t.state.busy?`disabled`:``}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${e(r.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${e((r.backend||`—`).toUpperCase())}</span></dd>
        </div>
        ${r.backend===`sqlite`||r.sqlite_file?`<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${e(r.sqlite_file||`—`)}</dd>
        </div>`:``}
        ${r.backend===`pgsql`||r.pgsql_host?`<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${e(r.pgsql_host||`—`)} / ${e(r.pgsql_dbname||`—`)} · ${e(r.pgsql_username||`—`)}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>${r.hasPassword?`<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>`:`<span class="badge badge-off">Not set</span>`}</dd>
        </div>`:``}
        <div>
          <dt>Encryption key</dt>
          <dd>${r.hasEncryptionKey?`<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>`:`<span class="badge badge-off">Not set</span>`}</dd>
        </div>
      </dl>

      <h3 class="admin-subsection-title">Edit connection</h3>
      ${a?`<p class="flash flash-error">Config is not writable by PHP.</p>`:``}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${t.state.busy||a?`disabled`:``}>
            <option value="sqlite" ${i===`sqlite`?`selected`:``}>SQLite</option>
            <option value="pgsql" ${i===`pgsql`?`selected`:``}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${i===`sqlite`?``:`display:none`}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${e(r.sqlite_file||``)}" ${t.state.busy||a?`disabled`:``} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${i===`pgsql`?``:`display:none`}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${e(r.pgsql_host||``)}" placeholder="localhost:5432" ${t.state.busy||a?`disabled`:``} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${e(r.pgsql_dbname||``)}" ${t.state.busy||a?`disabled`:``} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${e(r.pgsql_username||``)}" autocomplete="off" ${t.state.busy||a?`disabled`:``} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${r.hasPassword?`Leave blank to keep current`:``}" ${t.state.busy||a?`disabled`:``} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${t.state.busy||a?`disabled`:``}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${t.state.busy||a?`disabled`:``}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${Mi(t)}`}function Mi(t){if(!t.state.adminDbConfirmOpen)return``;let n=t.state.adminDbConfirmText.trim()===`CONFIRM`;return a({id:`admin-db-confirm-modal`,title:`Confirm database change`,titleId:`admin-db-confirm-title`,closeAction:`admin-db-confirm-close`,size:`sm`,body:`
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${e(t.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${t.state.busy?`disabled`:``} />
        </label>`,footer:[{label:`Cancel`,action:`admin-db-confirm-close`,variant:`ghost`,disabled:t.state.busy},{label:`Save database settings`,action:`admin-db-confirm-save`,variant:`danger`,disabled:t.state.busy||!n}]})}async function Ni(e,t,n={}){if(!e.userIsAdmin()){await e.activateTab(`calendars`,n);return}e.state.activeTab=`admin`,e.state.adminPage=t,t===`users`?n.username!==void 0&&(e.state.adminSelectedUsername=n.username,n.username||(e.state.adminUserDetail=null,e.state.adminUserDetailError=null)):(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null),e.state.userMenuOpen=!1,e.persistTab(`admin`,t,e.state.adminSelectedUsername),S.event(`tab`,{tab:`admin`,adminPage:t,user:e.state.adminSelectedUsername}),n.clearFlash!==!1&&e.clearFlash(),e.state.busy=!0,e.render();try{if(await Jr(e),!e.adminUiEnabled()){e.state.activeTab=`calendars`,e.persistTab(`calendars`),e.setFlash(`info`,`Portal Administration UI is disabled.`);return}let n=V(e,t);t===`overview`&&n?.available!==!1?await Yr(e):t===`users`&&n?.available!==!1?(await Xr(e),e.state.adminSelectedUsername&&(await H(e,e.state.adminSelectedUsername),await Zr(e,e.state.adminSelectedUsername))):t===`settings`&&n?.available!==!1?await Qr(e):t===`database`&&n?.available!==!1&&await $r(e)}catch(t){S.warn(`admin page load failed`,t instanceof Error?t.message:t),e.setFlash(`error`,t instanceof Error?t.message:`Failed to load`)}finally{e.state.busy=!1,e.render()}}function Pi(e){return e.userIsAdmin()?e.adminUiEnabled()?e.state.adminPage===`users`?oi(e):e.state.adminPage===`settings`?_i(e):e.state.adminPage===`database`?ji(e):e.state.adminPage===`configuration`?xi(e):ei(e):`<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`:`<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>`}function Fi(e){return e===`overview`||e===`users`||e===`settings`||e===`database`||e===`configuration`?e:null}async function Ii(e,t,n,r){if(!t.startsWith(`admin-`))return!1;if(t===`admin-page`){let t=Fi(n.dataset.adminPage);return t&&await Ni(e,t),!0}if(t===`admin-refresh`){if(!e.userIsAdmin()||e.state.activeTab!==`admin`)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await Yr(e),e.setFlash(`success`,`Overview refreshed`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Refresh failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-users-refresh`){if(!e.userIsAdmin()||e.state.activeTab!==`admin`)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await Xr(e),e.state.adminSelectedUsername&&await H(e,e.state.adminSelectedUsername),e.setFlash(`success`,`Users refreshed`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Refresh failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-user-view`){let t=n.dataset.username??``;if(!t||!e.userIsAdmin())return!0;e.state.busy=!0,e.clearFlash(),e.state.adminSelectedUsername=t,e.state.adminPage=`users`,e.persistTab(`admin`,`users`,t),e.render();try{await H(e,t),await Zr(e,t)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Failed to load user`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-user-close`)return e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserDetailError=null,e.state.adminUserEditOpen=!1,e.persistTab(`admin`,`users`,null),e.render(),!0;if(t===`admin-user-create-open`)return!e.userIsAdmin()||(e.state.adminUserCreateOpen=!0,e.state.adminUserEditOpen=!1,e.state.adminUserDeleteUsername=null,e.clearFlash(),e.render(),!0);if(t===`admin-user-create-close`)return e.state.adminUserCreateOpen=!1,e.render(),!0;if(t===`admin-user-edit-open`){if(!e.userIsAdmin())return!0;let t=n.dataset.username??e.state.adminSelectedUsername??``;if(!t)return!0;e.state.busy=!0,e.clearFlash(),e.state.adminUserCreateOpen=!1,e.state.adminUserDeleteUsername=null,e.state.adminSelectedUsername=t,e.state.adminPage=`users`,e.persistTab(`admin`,`users`,t),e.render();try{(!e.state.adminUserDetail||e.state.adminUserDetail.username.toLowerCase()!==t.toLowerCase())&&await H(e,t),e.state.adminUserEditOpen=!0}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Failed to load user`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-user-edit-close`)return e.state.adminUserEditOpen=!1,e.render(),!0;if(t===`admin-user-delete-open`){if(!e.userIsAdmin())return!0;let t=n.dataset.username??e.state.adminSelectedUsername??``;return!t||(e.state.adminUserDeleteUsername=t,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserCreateOpen=!1,e.state.adminUserEditOpen=!1,e.clearFlash(),e.render(),!0)}if(t===`admin-user-delete-close`)return e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.render(),!0;if(t===`admin-user-delete-toggle`){let t=n;return e.state.adminUserDeleteConfirmChecked=!!t.checked,e.render(),!0}if(t===`admin-user-delete-confirm`){if(!e.userIsAdmin())return!0;let t=n.dataset.username??e.state.adminUserDeleteUsername??``;if(!t||!e.state.adminUserDeleteConfirmChecked)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{await E.adminDeleteUser(t,!0),S.event(`admin.user.delete`,{username:t}),e.state.adminUserDeleteUsername=null,e.state.adminUserDeleteConfirmChecked=!1,e.state.adminUserEditOpen=!1,e.state.adminSelectedUsername?.toLowerCase()===t.toLowerCase()&&(e.state.adminSelectedUsername=null,e.state.adminUserDetail=null,e.state.adminUserCalendars=[],e.state.adminUserAddressBooks=[],e.persistTab(`admin`,`users`,null)),await Xr(e),e.setFlash(`success`,`Deleted user “${t}”`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Delete failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-cal-create`)return e.state.adminCalModal=`create`,e.state.adminCalEditId=null,e.render(),!0;if(t===`admin-cal-edit`)return e.state.adminCalModal=`edit`,e.state.adminCalEditId=Number(n.dataset.id),e.render(),!0;if(t===`admin-cal-close`)return e.state.adminCalModal=null,e.state.adminCalEditId=null,e.render(),!0;if(t===`admin-cal-delete`)return e.state.adminResourceDelete={kind:`calendar`,id:Number(n.dataset.id),label:n.dataset.label??`calendar`},e.render(),!0;if(t===`admin-ab-create`)return e.state.adminAbModal=`create`,e.state.adminAbEditId=null,e.render(),!0;if(t===`admin-ab-edit`)return e.state.adminAbModal=`edit`,e.state.adminAbEditId=Number(n.dataset.id),e.render(),!0;if(t===`admin-ab-close`)return e.state.adminAbModal=null,e.state.adminAbEditId=null,e.render(),!0;if(t===`admin-ab-delete`)return e.state.adminResourceDelete={kind:`addressbook`,id:Number(n.dataset.id),label:n.dataset.label??`address book`,force:!1},e.render(),!0;if(t===`admin-ab-force-toggle`)return e.state.adminResourceDelete?.kind===`addressbook`&&(e.state.adminResourceDelete={...e.state.adminResourceDelete,force:!!n.checked},e.render()),!0;if(t===`admin-resource-delete-close`)return e.state.adminResourceDelete=null,e.render(),!0;if(t===`admin-resource-delete-confirm`){if(!e.state.adminSelectedUsername||!e.state.adminResourceDelete)return!0;let t=e.state.adminSelectedUsername,n=e.state.adminResourceDelete;e.state.busy=!0,e.clearFlash(),e.render();try{n.kind===`calendar`?await E.adminDeleteUserCalendar(t,n.id,!0):await E.adminDeleteUserAddressBook(t,n.id,!0,!!n.force),e.state.adminResourceDelete=null,await Zr(e,t),await H(e,t),e.setFlash(`success`,`Deleted`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Delete failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-settings-refresh`){e.state.busy=!0,e.clearFlash(),e.render();try{await Qr(e),e.setFlash(`success`,`Settings reloaded`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Reload failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-reset-open`)return e.state.adminResetModalOpen=!0,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword=``,e.clearFlash(),e.render(),!0;if(t===`admin-reset-close`)return e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword=``,e.render(),!0;if(t===`admin-reset-toggle`){let t=n;return e.state.adminResetConfirmChecked=!!t.checked,e.render(),!0}if(t===`admin-reset-password`){e.state.adminResetPassword=n.value;let t=e.root.querySelector(`[data-action="admin-reset-confirm"]`);return t&&(t.disabled=e.state.busy||!e.state.adminResetConfirmChecked||e.state.adminResetPassword.trim()===``),!0}if(t===`admin-reset-confirm`){if(!e.state.adminResetConfirmChecked)return!0;if(e.state.adminResetPassword.trim()===``)return e.setFlash(`error`,`Re-enter your password to confirm Reset to Default`),e.render(),!0;e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.adminResetToDefault(!0,e.state.adminResetPassword);S.event(`admin.settings.reset-to-default`),e.state.adminResetModalOpen=!1,e.state.adminResetConfirmChecked=!1,e.state.adminResetPassword=``;let n=t.redirectUrl&&t.redirectUrl.startsWith(`/`)?t.redirectUrl:`/portal/install/`;return window.location.assign(n),!0}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Reset failed`),e.state.busy=!1,e.render()}return!0}if(t===`admin-backup-download`)return await wi(e),!0;if(t===`admin-restore-discard`)return Ei(e),!0;if(t===`admin-restore-apply`)return await Di(e),!0;if(t===`admin-database-refresh`){e.state.busy=!0,e.clearFlash(),e.render();try{await $r(e),e.setFlash(`success`,`Database settings reloaded`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Reload failed`)}finally{e.state.busy=!1,e.render()}return!0}if(t===`admin-db-backend`){let t=n;return e.state.adminDbFormBackend=t.value===`pgsql`?`pgsql`:`sqlite`,e.render(),!0}if(t===`admin-db-test`)return Ai(e,n.closest(`form`)),!0;if(t===`admin-db-confirm-close`)return e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText=``,e.state.adminDbPendingBody=null,e.render(),!0;if(t===`admin-db-confirm-input`){let t=n;e.state.adminDbConfirmText=t.value,e.render();let r=e.root.querySelector(`[data-action="admin-db-confirm-input"]`);if(r){r.focus();let e=r.value.length;r.setSelectionRange(e,e)}return!0}if(t===`admin-db-confirm-save`){if(e.state.adminDbConfirmText.trim()!==`CONFIRM`||!e.state.adminDbPendingBody)return!0;e.state.busy=!0,e.clearFlash(),e.render();try{let t={...e.state.adminDbPendingBody,confirm:`CONFIRM`},n=await E.adminUpdateDatabaseSettings(t);e.state.adminDatabaseSettings=n.data,e.state.adminDbConfirmOpen=!1,e.state.adminDbConfirmText=``,e.state.adminDbPendingBody=null;let r=(n.data.backend||`sqlite`).toLowerCase();e.state.adminDbFormBackend=r===`pgsql`?`pgsql`:`sqlite`,S.event(`admin.database.save`,{backend:n.data.backend}),e.setFlash(`success`,`Database settings saved`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Database save failed`)}finally{e.state.busy=!1,e.render()}return!0}return!1}function U(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function Li(e){let t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return null;let n=new Date(Number(t[1]),Number(t[2])-1,Number(t[3]));return Number.isNaN(n.getTime())?null:n}function Ri(e,t){return new Date(e.getFullYear(),e.getMonth(),e.getDate()+t)}function zi(e){let t=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);let r=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t.getTime()-r.getTime())/864e5+1)/7)}function Bi(e,t){return zi(Ri(e,(4-t+7)%7))}function Vi(e,t){let n=Ri(e,-((e.getDay()-t+7)%7)),r=[];for(let e=0;e<7;e++)r.push(Ri(n,e));return{from:U(r[0]),to:U(r[6]),days:r}}function Hi(e,t){let n=e.getFullYear()===t.getFullYear();return n&&e.getMonth()===t.getMonth()?`${e.toLocaleString(void 0,{month:`short`})} ${e.getDate()}–${t.getDate()}, ${e.getFullYear()}`:`${e.toLocaleString(void 0,{month:`short`,day:`numeric`,year:n?void 0:`numeric`})} – ${t.toLocaleString(void 0,{month:`short`,day:`numeric`,year:`numeric`})}`}function Ui(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){let[t,n,r]=e.split(`-`).map(Number);return new Date(t,n-1,r)}let t=new Date(e);if(Number.isNaN(t.getTime())){let[t,n,r]=e.slice(0,10).split(`-`).map(Number);return new Date(t,(n||1)-1,r||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Wi(e){let t=Ui(e.start);if(!e.end)return[U(t)];let n=Ui(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){let t=new Date(e.end);!Number.isNaN(t.getTime())&&t.getHours()===0&&t.getMinutes()===0&&t.getSeconds()===0&&t.getTime()>new Date(e.start).getTime()&&(n=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1))}if(n<t)return[U(t)];let r=[],i=new Date(t.getFullYear(),t.getMonth(),t.getDate()),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()),o=0;for(;i<=a&&o++<370;)r.push(U(i)),i.setDate(i.getDate()+1);return r.length?r:[U(t)]}function Gi(e){if(!e)return``;if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;let t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):U(t)}function Ki(e){if(e===`24h`)return!1;if(e===`12h`)return!0;try{let e=new Intl.DateTimeFormat(void 0,{hour:`numeric`}).resolvedOptions();if(e.hourCycle===`h23`||e.hourCycle===`h24`)return!1;if(e.hourCycle===`h11`||e.hourCycle===`h12`)return!0;if(typeof e.hour12==`boolean`)return e.hour12}catch{}let t=(navigator.language||``).toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function qi(e){return Ki(e)?{hour:`numeric`,minute:`2-digit`,hour12:!0}:{hour:`2-digit`,minute:`2-digit`,hour12:!1}}function Ji(e){if(e===`monday`)return 1;if(e===`sunday`)return 0;let t=[...navigator.languages?.length?navigator.languages:[],navigator.language].filter(Boolean);for(let e of t)try{let t=new Intl.Locale(e),n=(typeof t.getWeekInfo==`function`?t.getWeekInfo():t.weekInfo)?.firstDay;if(typeof n==`number`)return n===7?0:n}catch{}let n=(navigator.language||`en`).toLowerCase();return+!/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(n)}function Yi(e){let t=Ji(e),n=new Date(2024,0,7+t),r=[];for(let e=0;e<7;e++){let t=new Date(n);t.setDate(n.getDate()+e),r.push(t.toLocaleDateString(void 0,{weekday:`short`}))}return r}function Xi(e,t=15){let n=t*60*1e3,r=e.getTime();return r%n===0?new Date(r):new Date(Math.ceil(r/n)*n)}function W(e){let t=e=>String(e).padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Zi(e,t,n){if(!e)return`Select…`;if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){let[t,n,r]=e.slice(0,10).split(`-`).map(Number);return new Date(t,n-1,r).toLocaleDateString(void 0,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`})}let r=new Date((e.includes(`T`)&&e.length,e));return Number.isNaN(r.getTime())?e:r.toLocaleString(void 0,{weekday:`short`,year:`numeric`,month:`short`,day:`numeric`,...qi(n)})}function Qi(e){if(!e){let e=Xi(new Date);return{date:U(e),hm:`${String(e.getHours()).padStart(2,`0`)}:${String(e.getMinutes()).padStart(2,`0`)}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:`09:00`};let t=new Date((e.length,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:`09:00`}:{date:U(t),hm:`${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}}function $i(e){let t=new Date,n=U(t);if(e&&e!==n){let[t,n,r]=e.split(`-`).map(Number),i=new Date(t,n-1,r,9,0,0,0),a=new Date(t,n-1,r,10,0,0,0);return{start:W(i),end:W(a)}}let r=Xi(t,15),i=new Date(r.getTime()+36e5);return{start:W(r),end:W(i)}}function ea(){let e=[];for(let t=0;t<24;t++)for(let n=0;n<60;n+=15)e.push(`${String(t).padStart(2,`0`)}:${String(n).padStart(2,`0`)}`);return e}function ta(e,t){let n=e.slice(0,10),r=(t||n).slice(0,10);if(n===r){let e=$i(n);return{start:e.start,end:e.end}}let[i,a,o]=n.split(`-`).map(Number),[s,c,l]=r.split(`-`).map(Number);return{start:W(new Date(i,a-1,o,9,0,0,0)),end:W(new Date(s,c-1,l,17,0,0,0))}}function na(e,t){let n=Gi(e),r=t?Gi(t):n;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){let n=new Date(t);if(!Number.isNaN(n.getTime())&&n.getHours()===0&&n.getMinutes()===0&&n.getTime()>new Date(e).getTime()){let e=Ui(t);e.setDate(e.getDate()-1),r=U(e)}}return{start:n,end:r}}function ra(e){if(!e)return``;try{let t=new Date(e);if(Number.isNaN(t.getTime()))return``;let n=e=>String(e).padStart(2,`0`);return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}`}catch{return``}}function ia(t){let{field:n,value:r,dateOnly:i,allowClear:a,viewY:o,viewM:s,weekStart:c,timeFormat:l}=t,u=Qi(r),d=Ji(c),f=Yi(c),p=(new Date(o,s,1).getDay()-d+7)%7,m=new Date(o,s+1,0).getDate(),h=new Date(o,s,0).getDate(),g=u.date,_=u.hm,v=[],y=Math.ceil((p+m)/7)*7;for(let t=0;t<y;t++){let r,i,a=!1;t<p?(r=h-p+t+1,i=new Date(o,s-1,r),a=!0):t>=p+m?(r=t-(p+m)+1,i=new Date(o,s+1,r),a=!0):(r=t-p+1,i=new Date(o,s,r));let c=U(i),l=c===g,u=c===U(new Date);v.push(`<button type="button" class="dt-day${a?` is-outside`:``}${l?` is-selected`:``}${u?` is-today`:``}" data-action="dt-pick-day" data-dt-field="${n}" data-day="${e(c)}">${r}</button>`)}let ee=new Date().getFullYear(),b=Math.min(1900,o),x=Math.max(ee+30,o),te=Array.from({length:12},(t,n)=>{let r=new Date(2e3,n,1).toLocaleString(void 0,{month:`short`});return`<option value="${n}" ${n===s?`selected`:``}>${e(r)}</option>`}).join(``),ne=[];for(let e=b;e<=x;e++)ne.push(`<option value="${e}" ${e===o?`selected`:``}>${e}</option>`);let re=i?``:`<div class="dt-times" role="listbox" aria-label="Time">
          ${ea().map(t=>{let r=(()=>{let[e,n]=t.split(`:`).map(Number);return new Date(2e3,0,1,e,n).toLocaleTimeString(void 0,qi(l))})();return`<button type="button" class="dt-time${t===_?` is-selected`:``}" data-action="dt-pick-time" data-dt-field="${n}" data-hm="${t}" role="option" aria-selected="${t===_}">${e(r)}</button>`}).join(``)}
        </div>`;return`<div class="dt-popover" data-dt-popover="${n}" role="dialog" aria-label="Choose date${i?``:` and time`}">
      <div class="dt-popover-inner${i?` is-date-only`:``}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${n}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${e(n)}" aria-label="Month">${te}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${e(n)}" aria-label="Year">${ne.join(``)}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${n}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${f.map(t=>`<span class="dt-dow">${e(t)}</span>`).join(``)}</div>
          <div class="dt-days">${v.join(``)}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${e(n)}" ${a?``:`disabled`}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${n}">Today</button>
          </div>
        </div>
        ${re}
      </div>
    </div>`}function aa(e=document){e.querySelectorAll(`.dt-field.is-open`).forEach(e=>{let t=e.querySelector(`.dt-trigger`),n=e.querySelector(`.dt-popover`);if(!t||!n)return;let r=t.getBoundingClientRect();n.style.position=`fixed`,n.style.visibility=`hidden`,n.style.top=`0`,n.style.left=`0`;let i=n.offsetWidth||320,a=n.offsetHeight||300,o=r.bottom+6;o+a>window.innerHeight-8&&(o=Math.max(8,r.top-a-6));let s=r.left;s+i>window.innerWidth-8&&(s=Math.max(8,window.innerWidth-i-8)),s<8&&(s=8),n.style.top=`${Math.round(o)}px`,n.style.left=`${Math.round(s)}px`,n.style.right=`auto`,n.style.visibility=`visible`,n.style.zIndex=`200`})}function oa(e,t){let n=t.summary||`(No title)`;if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return n;let r=new Date(t.start);return Number.isNaN(r.getTime())?n:`${r.toLocaleTimeString(void 0,e.timeFormatOpts())} ${n}`}function sa(e,t,n){return new Date(t,n,1).toLocaleString(void 0,{month:`long`,year:`numeric`})}function ca(e){return Li(e.state.calFocusDay)??new Date}function la(e){let t=e.state.eventSearch.trim().toLowerCase();return t?e.state.monthEvents.filter(e=>(e.summary||``).toLowerCase().includes(t)):e.state.monthEvents}function ua(e){let t=e.localeWeekStart(),n=ca(e);if(e.state.calView===`week`){let e=Vi(n,t);return{from:e.from,to:e.to}}if(e.state.calView===`agenda`){let e=Ri(n,34);return{from:U(n),to:U(e)}}let r=e.state.monthCursor.y,i=e.state.monthCursor.m,a=new Date(r,i,1),o=new Date(r,i+1,0);return{from:U(a),to:U(o)}}function da(e){return e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start)?Li(e.start.slice(0,10))??new Date(NaN):new Date(e.start)}function fa(e){return e.getHours()*60+e.getMinutes()}function pa(e){return e===`month`||e===`week`||e===`agenda`?e:null}function ma(e){return`${je}:${e}`}function ha(e){if(!e)return null;try{let t=localStorage.getItem(ma(e));if(t==null||t===``)return null;let n=JSON.parse(t);if(!n||typeof n!=`object`)return null;let r=n,i=[];Array.isArray(r.ids)&&(i=r.ids.map(e=>Number(e)).filter(e=>Number.isFinite(e)&&e>0).map(e=>Math.floor(e)));let a=null;if(r.selectedId===null||r.selectedId===void 0)a=null;else{let e=Number(r.selectedId);a=Number.isFinite(e)&&e>0?Math.floor(e):null}let o=pa(r.view)??void 0;return{ids:i,selectedId:a,view:o}}catch{return null}}function ga(e){let t=e.user?.username;if(t)try{let n={ids:e.selectedIds.slice(),selectedId:e.selectedId,view:pa(e.calView)??`month`};localStorage.setItem(ma(t),JSON.stringify(n))}catch{}}function _a(e){return e.map(e=>[e.instanceId??``,e.uri,e.start,e.end??``,e.summary??``,e.allDay?`1`:`0`].join(`	`)).join(`
`)}async function va(e,t){let n=await E.shares(t);e.state.shares=n.shares}function ya(e){let t=e.state.calendars.filter(e=>e.canShare);return t.length===0?null:t.find(e=>{let t=e.uri.toLowerCase(),n=e.displayname.toLowerCase();return t==="default"||n==="default"||n===`default calendar`})??t[0]??null}async function ba(e){let t=e.state.selectedIds.filter(t=>e.state.calendars.some(e=>e.id===t));if(t.length===0){e.state.monthEvents=[],e.state.calendarEventsReady=!0;return}let{from:n,to:r}=ua(e);e.state.monthEventsLoading=!0,S.debug(`loadMonthEvents`,{selectedIds:t,from:n,to:r});try{let i=(await Promise.all(t.map(async e=>(await E.calendarEvents(e,n,r)).events.map(t=>({...t,instanceId:e}))))).flat();i.sort((e,t)=>{let n=e.start||``,r=t.start||``;return n===r?(e.summary||``).localeCompare(t.summary||``):n<r?-1:1}),e.state.monthEvents=i,e.state.calendarEventsReady=!0,S.event(`monthEvents.loaded`,{calendarIds:t,count:e.state.monthEvents.length,from:n,to:r})}catch(t){e.state.monthEvents=[],e.state.calendarEventsReady=!0,S.warn(`loadMonthEvents failed`,t instanceof Error?t.message:t)}finally{e.state.monthEventsLoading=!1}}function xa(e,t){let n=e.state.calendars.find(e=>e.id===t);return n?.color?n.color.length>=7?n.color.slice(0,7):n.color:`#3B82F6`}function Sa(e,t){e.state.selectedIds.includes(t)?(e.state.selectedIds=e.state.selectedIds.filter(e=>e!==t),e.state.selectedId===t&&(e.state.selectedId=e.state.selectedIds[0]??null)):(e.state.selectedIds=[...e.state.selectedIds,t],e.state.selectedId=t),ga(e.state)}function Ca(t){let n=t.state.calendars.filter(e=>t.state.selectedIds.includes(e.id)),r=n.length===0?`No calendar selected`:n.length===1?n[0].displayname:`${n.length} calendars`,i=n.slice(0,6).map(t=>`<span class="cal-swatch" style="background:${e(t.color&&t.color.length>=7?t.color.slice(0,7):t.color||`#3B82F6`)};margin-top:0" title="${e(t.displayname)}"></span>`).join(``),a=n.length===0?t.state.calendars.length===0?`<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>`:``:t.state.monthEventsLoading?`<p class="muted small month-empty-hint">Loading events…</p>`:``,o=t.state.calView,s=ca(t),c,l,u;if(o===`week`){let e=Vi(s,t.localeWeekStart());c=Hi(e.days[0],e.days[6]),l=`Previous week`,u=`Next week`}else o===`agenda`?(c=`Agenda · ${Hi(s,new Date(s.getFullYear(),s.getMonth(),s.getDate()+34))}`,l=`Previous period`,u=`Next period`):(c=sa(t,t.state.monthCursor.y,t.state.monthCursor.m),l=`Previous month`,u=`Next month`);let d=[{id:`month`,label:`Month`},{id:`week`,label:`Week`},{id:`agenda`,label:`Agenda`}].map(e=>`<button type="button" class="btn btn-ghost btn-small cal-view-btn${o===e.id?` is-active`:``}" data-action="cal-view" data-view="${e.id}" ${t.state.busy?`disabled`:``}>${e.label}</button>`).join(``);return{calName:r,swatches:i,emptyHint:a,toolbar:`<div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${t.state.busy?`disabled`:``}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="${e(l)}" ${t.state.busy?`disabled`:``}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="${e(u)}" ${t.state.busy?`disabled`:``}>›</button>
      </div>
      <h2 class="month-cal-title">${e(c)}</h2>
      <div class="cal-view-toggle" role="group" aria-label="Calendar view">${d}</div>
      <input type="search" class="cal-event-search" data-action="event-search" placeholder="Search events…"
        value="${e(t.state.eventSearch)}" aria-label="Search events" ${t.state.busy?`disabled`:``} />
      <span class="month-cal-name muted small" title="${e(r)}">
        ${i}
        ${e(r)}
      </span>
    </div>`}}function wa(t){let n=Ca(t),r=ca(t),i=la(t),a=new Map;for(let e of i)for(let t of Wi(e)){let n=a.get(t)??[];n.push(e),a.set(t,n)}let o=U(new Date),s=[];for(let n=0;n<35;n++){let i=Ri(r,n),c=U(i),l=a.get(c)??[];if(l.length===0)continue;let u=i.toLocaleString(void 0,{weekday:`long`,month:`long`,day:`numeric`,year:`numeric`}),d=l.map(n=>{let r=n.instanceId,i=oa(t,n),a=xa(t,r),o=t.state.calendars.find(e=>e.id===r)?.displayname||``;return`<button type="button" class="agenda-event" title="${e(o?`${i} · ${o}`:i)}" style="--ev-color:${e(a)}"
            data-action="open-event" data-instance="${r}" data-uri="${e(n.uri)}" ${t.state.busy?`disabled`:``}>${e(i)}</button>`}).join(``);s.push(`<section class="agenda-day${c===o?` is-today`:``}">
      <h3 class="agenda-day-title">${e(u)}</h3>
      <div class="agenda-list">${d}</div>
    </section>`)}let c=s.length>0?s.join(``):`<p class="muted" style="margin:0.5rem 0 0">${t.state.eventSearch.trim()?`No events match this search in the current range.`:`No events in this period.`}</p>`;return`<section class="card month-cal-card agenda-cal-card">
    ${n.toolbar}
    ${n.emptyHint}
    <div class="agenda-wrap">${c}</div>
  </section>`}function Ta(e){return Math.min(23,Math.max(0,e-1))*40}var Ea=40;function Da(e,t){let n=e.querySelector(`.week-wrap`);return n?(n.scrollTop=Ta(t),!0):!1}function Oa(t,n,r){let i=n.instanceId,a=oa(t,n),o=xa(t,i),s=t.state.calendars.find(e=>e.id===i)?.displayname||``,c=s?`${a} · ${s}`:a,l=0,u=Ea;if(!n.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(n.start)){let e=da(n);U(e)===r&&(l=fa(e)/60*Ea);let t=n.end&&!/^\d{4}-\d{2}-\d{2}$/.test(n.end)?new Date(n.end):null;if(t&&!Number.isNaN(t.getTime())){let n=U(e)===r?fa(e):0,i=U(t)===r?fa(t):1440;u=Math.max(18,(i-n)/60*Ea)}}let d=n.allDay||/^\d{4}-\d{2}-\d{2}$/.test(n.start)?`--ev-color:${e(o)}`:`--ev-color:${e(o)};top:${l}px;height:${u}px`;return`<button type="button" class="week-event${n.allDay?``:` is-timed`}" title="${e(c)}"
      style="${d}"
      data-action="open-event" data-instance="${i}" data-uri="${e(n.uri)}" ${t.state.busy?`disabled`:``}>${e(a)}</button>`}function ka(t){let n=Ca(t),{days:r}=Vi(ca(t),t.localeWeekStart()),i=U(new Date),a=la(t),o=new Map;for(let e of a)for(let t of Wi(e)){let n=o.get(t)??[];n.push(e),o.set(t,n)}let s=t.state.userSettings.dayStartHour,c=t.state.userSettings.dayEndHour,l=Array.from({length:24},(n,r)=>{let i=new Date(2024,0,1,r).toLocaleTimeString(void 0,t.timeFormatOpts());return`<div class="week-hour-label${r>=s&&r<c?` is-workhour`:``}" style="height:${Ea}px">${e(i)}</div>`}).join(``),u=(()=>{let e=t.state.selectedId===null?null:t.state.calendars.find(e=>e.id===t.state.selectedId)??null;return!!(e&&!e.readOnly&&(e.canShare||e.access===`readwrite`))})(),d=[],f=[],p=[];for(let n of r){let r=U(n),a=r===i,l=o.get(r)??[],m=l.filter(e=>e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start)),h=l.filter(e=>!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.start)),g=m.map(e=>Oa(t,e,r)).join(``),_=h.map(e=>Oa(t,e,r)).join(``),v=n.toLocaleString(void 0,{weekday:`short`,month:`short`,day:`numeric`});d.push(`<div class="week-day-head${a?` is-today`:``}"${u?` data-action="new-event-day" data-day="${e(r)}" role="button" tabindex="0" title="Add event on ${e(r)}"`:``}>${e(v)}</div>`),f.push(`<div class="week-allday${a?` is-today`:``}">${g||`<span class="week-allday-empty"></span>`}</div>`);let y=u?`<div class="week-slots">${Array.from({length:24},(n,i)=>{let a=String(i).padStart(2,`0`);return`<button type="button" class="week-slot" data-action="new-event-slot" data-day="${e(r)}" data-hour="${i}" title="Add event at ${e(r)} ${a}:00" ${t.state.busy?`disabled`:``}></button>`}).join(``)}</div>`:``,ee=c>s?`<div class="week-workday" aria-hidden="true"></div>`:``;p.push(`<div class="week-timed${a?` is-today`:``}${u?` is-clickable`:``}" style="height:${24*Ea}px">${ee}${y}${_}</div>`)}return`<section class="card month-cal-card week-cal-card">
    ${n.toolbar}
    ${n.emptyHint}
    <div class="week-wrap" style="--week-hour:${Ea}px;--day-start-h:${s};--day-end-h:${c}"${t.state.weekScrollToDayStart?` data-align-hour="${Math.min(23,Math.max(0,s-1))}"`:``}>
      <div class="week-frozen">
        <div class="week-grid-row week-head-row">
          <div class="week-gutter-head"></div>
          ${d.join(``)}
        </div>
        <div class="week-grid-row week-allday-row">
          <div class="week-gutter-allday muted small">All day</div>
          ${f.join(``)}
        </div>
      </div>
      <div class="week-grid-row week-timed-row">
        <div class="week-hours">${l}</div>
        ${p.join(``)}
      </div>
    </div>
  </section>`}function Aa(e){return e.state.calView===`week`?ka(e):e.state.calView===`agenda`?wa(e):Ma(e)}function ja(e){return Aa(e)}function Ma(t){let n=t.state.monthCursor.y,r=t.state.monthCursor.m,i=new Date(n,r,1),a=t.localeWeekStart(),o=(i.getDay()-a+7)%7,s=new Date(n,r+1,0).getDate(),c=new Date(n,r,0).getDate(),l=U(new Date),u=t.localeDowLabels(),d=new Map;for(let e of la(t))for(let t of Wi(e)){let n=d.get(t)??[];n.push(e),d.set(t,n)}let f=t.state.userSettings.showWeekNumbers,p=[],m=Math.ceil((o+s)/7)*7;for(let i=0;i<m;i++){let u,m=!0,h;i<o?(u=c-o+i+1,m=!1,h=new Date(n,r-1,u)):i>=o+s?(u=i-(o+s)+1,m=!1,h=new Date(n,r+1,u)):(u=i-o+1,h=new Date(n,r,u));let g=U(h),_=g===l,v=m?d.get(g)??[]:[],y=t.state.monthExpandDay===g?50:3,ee=v.slice(0,y),b=v.length-ee.length,x=ee.map(n=>{let r=n.instanceId,i=oa(t,n),a=xa(t,r),o=t.state.calendars.find(e=>e.id===r)?.displayname||``,s=o?`${i} · ${o}`:i;return`<button type="button" class="month-event${n.allDay?``:` is-timed`}" title="${e(s)}" style="--ev-color:${e(a)}"
          data-action="open-event" data-instance="${r}" data-uri="${e(n.uri)}" ${t.state.busy?`disabled`:``}>${e(i)}</button>`}).join(``),te=b>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${e(g)}" title="Show all events this day" ${t.state.busy?`disabled`:``}>+${b} more</button>`:``,ne=!m&&(u===1||i===o+s)?h.toLocaleString(void 0,{month:`short`,day:`numeric`}):String(u),re=t.state.selectedId===null?null:t.state.calendars.find(e=>e.id===t.state.selectedId)??null,ie=!!(re&&!re.readOnly&&(re.canShare||re.access===`readwrite`));if(f&&i%7==0){let e=Bi(h,a);p.push(`<div class="month-weeknum" title="ISO week ${e}"><span>${e}</span></div>`)}p.push(`<div class="month-cell${m?``:` is-outside`}${_?` is-today`:``}${ie?` is-clickable`:``}"${ie?` data-action="new-event-day" data-day="${e(g)}" role="button" tabindex="0" title="Add event on ${e(g)}"`:``}>
      <div class="month-daynum${_?` is-today-num`:``}">${e(ne)}</div>
      <div class="month-events">${x}${te}</div>
    </div>`)}let h=Ca(t);return`<section class="card month-cal-card">
    ${h.toolbar}
    ${h.emptyHint}
    <div class="month-grid-wrap${f?` has-weeknums`:``}" role="grid" aria-label="Month calendar">
      <div class="month-dow-row${f?` has-weeknums`:``}" role="row">
        ${f?`<div class="month-weeknum-hd" title="ISO week">Wk</div>`:``}
        ${u.map(t=>`<div class="month-dow">${e(t)}</div>`).join(``)}
      </div>
      <div class="month-grid${f?` has-weeknums`:``}" role="rowgroup">
        ${p.join(``)}
      </div>
    </div>
  </section>`}function Na(){return{freq:``,interval:1,until:null,count:null,byDay:[],endMode:`never`}}function Pa(e){return e.endMode===`until`||e.endMode===`count`||e.endMode===`never`?e.endMode:e.until?`until`:e.count?`count`:`never`}function Fa(e){let t=String(e.get(`repeatFreq`)??``).trim().toUpperCase();if(!t)return{freq:``,interval:1,until:null,count:null,byDay:[],endMode:`never`};let n=Math.max(1,Math.min(99,Number(e.get(`repeatInterval`)??1)||1)),r=String(e.get(`repeatEndMode`)??`never`),i=r===`until`||r===`count`?r:`never`,a=null,o=null;if(i===`until`){let t=String(e.get(`repeatUntil`)??``).trim();a=t?t.slice(0,10):null}else if(i===`count`){let t=Number(e.get(`repeatCount`)??0);o=Number.isFinite(t)&&t>0?Math.min(999,Math.round(t)):10}let s=e.getAll(`repeatByDay`).map(e=>String(e).toUpperCase()).filter(Boolean);return{freq:t,interval:n,until:a,count:o,byDay:s,endMode:i}}function Ia(t){if(!t.state.eventModalOpen||!t.state.editingEvent)return``;let n=t.state.editingEvent,r=n.repeat??Na(),i=(r.freq||``).toUpperCase(),a=t.state.calendars.filter(e=>e.canShare||e.access===`readwrite`),o=t.state.calendars.filter(e=>e.id===n.instanceId?!0:e.readOnly?!1:e.canShare||e.access===`readwrite`).map(t=>`<option value="${t.id}" ${t.id===n.instanceId?`selected`:``}>${e(t.displayname)}</option>`).join(``),s=n.readOnly||!n.canWrite,c,l;if(n.allDay)c=Gi(n.start),l=Gi(n.end);else{let e=n.start||``,t=n.end||``;if(/^\d{4}-\d{2}-\d{2}$/.test(e)){let n=ta(e,t||null);c=n.start,l=n.end||``}else c=ra(n.start),l=ra(n.end)}let u=[{code:`MO`,label:`Mon`},{code:`TU`,label:`Tue`},{code:`WE`,label:`Wed`},{code:`TH`,label:`Thu`},{code:`FR`,label:`Fri`},{code:`SA`,label:`Sat`},{code:`SU`,label:`Sun`}],d=new Set((r.byDay||[]).map(e=>e.toUpperCase())),f=Pa(r),p=!!i&&f===`until`,m=r.until||(f===`until`?Gi(n.start)||U(new Date):``);return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${t.state.creatingEvent?`New event`:`Edit event`}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${!t.state.creatingEvent&&(n.hasRrule||i)?`<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>`:``}
        ${s?`<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>`:``}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${s||a.length===0?`disabled`:``}>
              ${o||`<option value="${n.instanceId}">${e(n.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${e(n.summary)}" ${s?`readonly`:``} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${e(n.location)}" ${s?`readonly`:``} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${s?`readonly`:``}>${e(n.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${n.allDay?`checked`:``} ${s?`disabled`:``} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${t.renderPortalDateTimeField({field:`start`,name:`start`,label:`Start`,value:c,dateOnly:n.allDay,required:!0,disabled:s,allowClear:!1})}
            ${t.renderPortalDateTimeField({field:`end`,name:`end`,label:`End`,value:l,dateOnly:n.allDay,disabled:s||p,allowClear:!p})}
          </div>
          <fieldset class="event-repeat" ${s?`disabled`:``}>
            <legend class="event-repeat-legend">Repeat</legend>
            <div class="form-grid form-grid-2">
              <label>Frequency
                <select name="repeatFreq" data-action="event-repeat-freq">
                  <option value="" ${i?``:`selected`}>Does not repeat</option>
                  <option value="DAILY" ${i===`DAILY`?`selected`:``}>Daily</option>
                  <option value="WEEKLY" ${i===`WEEKLY`?`selected`:``}>Weekly</option>
                  <option value="MONTHLY" ${i===`MONTHLY`?`selected`:``}>Monthly</option>
                  <option value="YEARLY" ${i===`YEARLY`?`selected`:``}>Yearly</option>
                </select>
              </label>
              <label>Every
                <input type="number" name="repeatInterval" min="1" max="99" value="${e(String(r.interval||1))}" ${i?``:`disabled`} />
              </label>
            </div>
            ${i===`WEEKLY`?`<div class="event-byday" role="group" aria-label="Days of week">
                    ${u.map(e=>`<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${e.code}" ${d.has(e.code)?`checked`:``} />
                            ${e.label}
                          </label>`).join(``)}
                  </div>`:``}
            ${i?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${f===`never`?`selected`:``}>Never</option>
                        <option value="until" ${f===`until`?`selected`:``}>On date</option>
                        <option value="count" ${f===`count`?`selected`:``}>After count</option>
                      </select>
                    </label>
                    ${f===`until`?t.renderPortalDateTimeField({field:`until`,name:`repeatUntil`,label:`Until`,value:m,dateOnly:!0,disabled:s,allowClear:!0}):f===`count`?`<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${e(String(r.count||10))}" />
                            </label>`:`<span></span>`}
                  </div>`:``}
          </fieldset>
          <div class="form-actions-row" style="margin-top:0.5rem">
            ${s?``:`<button type="submit" class="btn btn-primary" ${t.state.busy?`disabled`:``}>${t.state.creatingEvent?`Create event`:`Save event`}</button>
                   ${t.state.creatingEvent?``:`<button type="button" class="btn btn-danger" data-action="delete-event" ${t.state.busy?`disabled`:``}>Delete</button>`}`}
            <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`}function La(e,t){let n=e.state.calendars.find(e=>e.id===t);return{uri:``,instanceId:t,calendarId:n?.calendarId??0,calendarName:n?.displayname??`Calendar`,calendarUri:n?.uri??``,uid:``,summary:``,description:``,location:``,hasRrule:!1,repeat:Na(),readOnly:!1,canWrite:!0}}function Ra(e,t,n){return{...La(e,n),start:t,end:t,allDay:!0}}function za(e,t,n,r){let[i,a,o]=t.split(`-`).map(Number),s=Math.max(0,Math.min(23,Math.floor(n))),c=new Date(i,a-1,o,s,0,0,0),l=new Date(c.getTime()+36e5);return{...La(e,r),start:W(c),end:W(l),allDay:!1}}function Ba(e,t){if(!e.state.editingEvent)return;let n=new FormData(t),r=t.querySelector(`input[name="allDay"]`);e.state.editingEvent={...e.state.editingEvent,summary:String(n.get(`summary`)??e.state.editingEvent.summary),description:String(n.get(`description`)??e.state.editingEvent.description),location:String(n.get(`location`)??e.state.editingEvent.location),instanceId:Number(n.get(`instanceId`))||e.state.editingEvent.instanceId,allDay:r?.checked??e.state.editingEvent.allDay,start:String(n.get(`start`)??e.state.editingEvent.start??``),end:String(n.get(`end`)??e.state.editingEvent.end??``)||null,repeat:Fa(n),hasRrule:!!String(n.get(`repeatFreq`)??``).trim()}}function G(e){e.state.importElapsedTimer!==null&&(clearInterval(e.state.importElapsedTimer),e.state.importElapsedTimer=null)}function Va(e){G(e),e.state.importElapsedTimer=setInterval(()=>{if(!e.state.importProgress||e.state.importProgress.phase===`done`||e.state.importProgress.phase===`error`){G(e);return}e.state.importProgress={...e.state.importProgress,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},e.state.importProgress.phase===`processing`&&Ga(e,e.state.importProgress)},1e3)}function Ha(e,t,n={}){e.state.importProgress&&(e.state.importProgress={...e.state.importProgress,phase:t,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3),...n},e.render())}function Ua(e){G(e),e.state.importProgress=null,e.render()}function Wa(e,t){!e.state.importProgress||e.state.importProgress.phase===`done`||e.state.importProgress.phase===`error`||(e.state.importProgress={...e.state.importProgress,phase:`processing`,processPercent:t.percent,processCurrent:t.current,processTotal:t.total,processImported:t.imported,processUpdated:t.updated,processSkipped:t.skipped,elapsedSec:Math.floor((Date.now()-e.state.importProgress.startedAt)/1e3)},Ga(e,e.state.importProgress))}function Ga(e,t){let n=e.root.querySelector(`[data-import-status-line]`),r=e.root.querySelector(`.import-progress-bar`),i=e.root.querySelector(`.import-progress-track`),a=e.root.querySelector(`[data-import-counts]`),o=t.kind===`calendar`?`items`:`contacts`,s;if(t.phase===`processing`&&t.processTotal>0)s=`Importing ${t.processCurrent.toLocaleString()} / ${t.processTotal.toLocaleString()} ${o} (${t.processPercent??0}%) · ${N(t.elapsedSec)}`;else if(t.phase===`processing`)s=`Importing on server… ${N(t.elapsedSec)}`;else return;n&&(n.textContent=s),a&&(a.textContent=`${t.processImported} new · ${t.processUpdated} updated${t.processSkipped?` · ${t.processSkipped} skipped`:``}`),r&&t.processPercent!==null&&(r.classList.remove(`is-indeterminate`),r.style.width=`${Math.min(100,Math.max(0,t.processPercent))}%`),i&&t.processPercent!==null&&(i.setAttribute(`aria-valuenow`,String(t.processPercent)),i.removeAttribute(`aria-valuetext`))}function Ka(n){if(!n.state.importProgress)return``;let r=n.state.importProgress,o=r.phase!==`done`&&r.phase!==`error`,s=r.kind===`calendar`?`calendar (.ics)`:`contacts (.vcf)`,c=r.phase===`done`?`Import finished`:r.phase===`error`?`Import failed`:`Importing…`,l=(()=>{let t=[{id:`reading`,label:`Reading file`},{id:`uploading`,label:`Uploading to server`},{id:`processing`,label:`Importing on server`}],n={reading:0,uploading:1,processing:2,done:3,error:2}[r.phase]??0;return t.map((t,i)=>{let a=`pending`;return r.phase===`done`||i<n?a=`done`:i===n&&(a=(r.phase,`active`)),`<li class="import-step import-step-${a}"><span class="import-step-icon" aria-hidden="true">${a===`done`?`✓`:a===`active`?`●`:`○`}</span> ${e(t.label)}</li>`}).join(``)})(),u=``;if(o){let t=null;r.phase===`reading`&&r.readPercent!==null?t=Math.min(100,Math.max(0,r.readPercent)):r.phase===`processing`&&r.processPercent!==null&&(t=Math.min(100,Math.max(0,r.processPercent)));let n=t===null?`import-progress-bar is-indeterminate`:`import-progress-bar`,i=t===null?``:` style="width:${t}%"`,a=r.kind===`calendar`?`items`:`contacts`,o;o=r.phase===`reading`?r.readPercent===null?`Reading file…`:`Reading file… ${r.readPercent}%`:r.phase===`uploading`?`Uploading to server…`:r.processTotal>0?`Importing ${r.processCurrent.toLocaleString()} / ${r.processTotal.toLocaleString()} ${a} (${r.processPercent??0}%) · ${N(r.elapsedSec)}`:`Importing on server… ${N(r.elapsedSec)}`;let c=r.phase===`processing`&&r.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${r.processImported} new · ${r.processUpdated} updated${r.processSkipped?` · ${r.processSkipped} skipped`:``}</p>`:`<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>`;u=`
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${e(s)}</strong> from
        <span class="mono">${e(r.fileName)}</span>
        ${r.fileSizeLabel?` <span class="muted">(${e(r.fileSizeLabel)})</span>`:``}
      </p>
      <ul class="import-steps">${l}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${t===null?`aria-valuetext="In progress"`:`aria-valuenow="${t}"`}
        aria-label="Import progress">
        <div class="${n}"${i}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${e(o)}</p>
      ${c}
      <p class="muted small">Keep this tab open until the import finishes.
        ${r.kind===`calendar`?`Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.`:``}
      </p>`}else u=r.phase===`done`?`
      ${t(`success`,`Success. ${r.resultMessage||`Import completed.`}`,{className:`import-result`,style:`margin:0 0 1rem`})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${e(r.fileName)}</span>
        · Took ${e(N(r.elapsedSec))}
      </p>`:`
      ${t(`error`,`Failed. ${r.resultMessage||`Import failed.`}`,{className:`import-result`,style:`margin:0 0 1rem`})}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${e(r.fileName)}</span>
        · After ${e(N(r.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;let d=o?`<p class="muted small" style="margin:0">Please wait…</p>`:i([{label:`Close`,action:`close-import-progress`,variant:`primary`}]);return a({title:c,titleId:`import-progress-title`,closeAction:`close-import-progress`,size:`sm`,className:`import-progress-modal`,cardClassName:`import-progress-card`,rootAttrs:`data-import-progress`,hideClose:o,lockBackdrop:o,body:u,footer:d})}function qa(e,t,n){return new Promise((e,r)=>{let i=new FileReader;i.onprogress=e=>{e.lengthComputable&&e.total>0?n(Math.min(100,Math.round(e.loaded/e.total*100))):n(null)},i.onload=()=>e(String(i.result??``)),i.onerror=()=>r(i.error??Error(`Failed to read file`)),i.readAsText(t)})}async function Ja(e,t){if(e.state.selectedId===null)return;let n=t.files?.[0];t.value=``,n&&(e.state.calModalOpen=!0,await Xa(e,e.state.selectedId,n,{keepEditModalOpen:!0}))}async function Ya(e,t){let n=t.files?.[0];if(t.value=``,!n)return;let r=e.root.querySelector(`[data-form="create-cal"]`),i=r?new FormData(r):new FormData,a=i.get(`holidays`)===`on`,o=i.get(`readOnly`)===`on`;if(a){e.setFlash(`error`,`Turn off “Holidays calendar” to import a .ics file into a new calendar.`),e.state.createCalModalOpen=!0,e.render();return}if(o){e.setFlash(`error`,`Turn off “Read-only” before importing — import cannot write to a read-only calendar.`),e.state.createCalModalOpen=!0,e.render();return}let s=String(i.get(`displayname`)??``).trim();s||=n.name.replace(/\.ics$/i,``).trim()||`Imported calendar`;let c=String(i.get(`description`)??``),l=String(i.get(`color`)??``).trim();e.state.busy=!0,e.clearFlash(),e.state.createCalModalOpen=!0,e.render();try{let t=await E.createCalendar({displayname:s,description:c,color:l,readOnly:!1});e.state.selectedId=t.calendar.id,e.state.createCalModalOpen=!1,await e.loadHome(),e.setFlash(`success`,`Created “${t.calendar.displayname}” — importing…`),await Xa(e,t.calendar.id,n,{keepEditModalOpen:!1,successPrefix:`Calendar “${t.calendar.displayname}” created. `})}catch(t){let n=t instanceof Error?t.message:`Create or import failed`;e.state.createCalModalOpen=!0,e.setFlash(`error`,n),e.state.busy=!1,e.render()}}async function Xa(e,t,n,r={}){e.state.busy=!0,e.clearFlash(),G(e),e.state.importProgress={kind:`calendar`,fileName:n.name,fileSizeLabel:Nn(n.size),phase:`reading`,readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Va(e),e.render();try{let i=await qa(e,n,t=>{if(!e.state.importProgress||e.state.importProgress.phase!==`reading`)return;e.state.importProgress={...e.state.importProgress,readPercent:t};let n=e.root.querySelector(`.import-progress-bar`),r=e.root.querySelector(`[data-import-status-line]`);n&&t!==null&&(n.classList.remove(`is-indeterminate`),n.style.width=`${t}%`),r&&t!==null&&(r.textContent=`Reading file… ${t}%`)});Ha(e,`uploading`,{readPercent:100}),Ha(e,`processing`,{processPercent:0}),S.event(`import.calendar.start`,{file:n.name,bytes:n.size,calId:t});let a=await E.importCalendar(t,i,t=>{Wa(e,t)}),o=e.formatImportResult(a);e.state.selectedId===t&&await ba(e),G(e),Ha(e,`done`,{ok:!0,resultMessage:`${o} (from “${n.name}”)`}),e.setFlash(`success`,`${r.successPrefix||``}Import finished for “${n.name}”: ${o}.`)}catch(t){let n=t instanceof Error?t.message:`Import failed`;G(e),Ha(e,`error`,{ok:!1,resultMessage:n}),e.setFlash(`error`,n)}finally{r.keepEditModalOpen&&(e.state.calModalOpen=!0),e.state.busy=!1,e.render()}}async function Za(e,t){if(e.state.selectedId===null)return;let n=new FormData(t),r=String(n.get(`username`)??``).trim(),i=String(n.get(`access`)??`read`);if(!r){e.setFlash(`error`,`Select a user to share with`),e.render();return}e.state.calModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await E.share(e.state.selectedId,r,i),await va(e,e.state.selectedId),e.setFlash(`success`,`Shared with ${r}`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Share failed`)}finally{e.state.busy=!1,e.render()}}async function Qa(e,t){if(!e.state.editingEvent||!e.state.editingEvent.canWrite)return;let n=new FormData(t),r=String(n.get(`summary`)??``).trim(),i=String(n.get(`description`)??``).trim(),a=String(n.get(`location`)??``).trim(),o=n.get(`allDay`)===`on`,s=String(n.get(`start`)??``).trim(),c=String(n.get(`end`)??``).trim(),l=Number(n.get(`instanceId`))||e.state.editingEvent.instanceId,u=Fa(n);if(!r){e.setFlash(`error`,`Title is required`),e.render();return}if(!s){e.setFlash(`error`,`Start is required`),e.render();return}let d,f;if(o)d=s.slice(0,10),f=c?c.slice(0,10):d;else if(/^\d{4}-\d{2}-\d{2}$/.test(s)){let e=ta(s,c||null);d=new Date(e.start).toISOString(),f=e.end?new Date(e.end).toISOString():null}else d=new Date(s).toISOString(),f=c?new Date(c).toISOString():null;let p=e.state.editingEvent.instanceId,m=e.state.editingEvent.uri,h=e.state.creatingEvent;e.state.busy=!0,e.clearFlash(),e.state.eventModalOpen=!0,e.render(),S.event(h?`event.create`:`event.update`,{instanceId:l,uri:h?null:m,allDay:o,summary:r});try{let t={summary:r,description:i,location:a,allDay:o,start:d,end:f,instanceId:l,repeat:u},n=h?await E.createEvent(l,t):await E.updateEvent(p,m,t);(e.state.selectedId===null||n.event.instanceId!==e.state.selectedId)&&(e.state.selectedId=n.event.instanceId),await ba(e),e.state.eventModalOpen=!1,e.state.editingEvent=null,e.state.creatingEvent=!1,e.state.eventDtPicker=null,S.event(h?`event.created`:`event.saved`,{uri:n.event.uri,instanceId:n.event.instanceId}),e.setFlash(`success`,An(`Event`,n.event.summary||r,h?`created`:`saved`))}catch(t){S.warn(`event.save failed`,t instanceof Error?t.message:t),e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function $a(e,t){if(e.state.selectedId===null)return;let n=new FormData(t),r=String(n.get(`displayname`)??``).trim(),i=String(n.get(`description`)??``),a=String(n.get(`color`)??``).trim();e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.updateCalendar(e.state.selectedId,{displayname:r,description:i,color:a});e.state.calModalOpen=!0,await e.loadHome(),e.state.selectedId=t.calendar.id,await va(e,e.state.selectedId),await ba(e),e.setFlash(`success`,`Calendar updated`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Update failed`)}finally{e.state.busy=!1,e.render()}}async function eo(e,t){let n=new FormData(t),r=String(n.get(`displayname`)??``).trim(),i=String(n.get(`description`)??``),a=String(n.get(`color`)??``).trim(),o=n.get(`holidays`)===`on`,s=String(n.get(`holidayCountry`)??``).trim(),c=n.get(`readOnly`)===`on`;if(e.state.createCalModalOpen=!0,o&&!s){e.setFlash(`error`,`Select a country for the holidays calendar`),e.render();return}if(!o&&!r){e.setFlash(`error`,`Display name is required`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.createCalendar({displayname:r,description:i,color:a,holidays:o,holidayCountry:o?s:void 0,readOnly:c});e.state.selectedId=t.calendar.id,e.state.selectedIds.includes(t.calendar.id)||(e.state.selectedIds=[...e.state.selectedIds,t.calendar.id]),e.state.createCalModalOpen=!1,await e.loadHome();let n=`Created “${t.calendar.displayname}”`,l=t.holidayImport??t.calendar.holidayImport;l&&(n+=`. Holidays imported: ${e.formatImportResult(l)}.`),c&&(n+=` Calendar is read-only.`),e.setFlash(`success`,n)}catch(t){e.state.createCalModalOpen=!0,e.setFlash(`error`,t instanceof Error?t.message:`Create failed`)}finally{e.state.busy=!1,e.render()}}function to(e){let t=e.root.querySelector(`[data-form="create-cal"]`);if(!t)return;let n=t.querySelector(`input[name="holidays"]`),r=t.querySelector(`#holidays-country-wrap`),i=t.querySelector(`input[name="displayname"]`),a=t.querySelector(`input[name="readOnly"]`);if(!n||!r)return;let o=n.checked;r.hidden=!o,i&&(i.required=!o,o&&!i.value.trim()?i.placeholder=`Auto: Holidays (XX)`:o||(i.placeholder=`Work`)),o&&a&&(a.checked=!0)}function no(e){to(e)}function ro(t){let{state:n}=t,r=n.calendars.filter(e=>e.canShare),i=n.calendars.filter(e=>!e.canShare),s=n.calendars.find(e=>e.id===n.selectedId)??null,c=r.map(r=>{let i=n.selectedIds.includes(r.id),a=i?` is-selected`:``,o=r.id===n.selectedId?` is-primary`:``,s=r.color?`<span class="cal-swatch" style="background:${e(r.color)}"></span>`:`<span class="cal-swatch cal-swatch-empty"></span>`,c=t.accessBadge(r.access)+(r.readOnly?`<span class="badge">read-only</span>`:``)+(r.holidaysCountry?`<span class="badge badge-admin">holidays ${e(r.holidaysCountry)}</span>`:``);return`<div class="cal-row${a}${o}" data-action="select-cal" data-id="${r.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${r.id}" ${i?`checked`:``} ${n.busy?`disabled`:``} />
        </label>
        ${s}
        <span class="cal-row-text">
          <span class="cal-row-title">${e(r.displayname)}</span>
          <span class="cal-row-badges">${c}</span>
          <span class="muted small mono cal-row-uri">${e(r.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${r.id}" ${n.busy?`disabled`:``} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${r.id}" ${n.busy?`disabled`:``}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${r.id}" ${n.busy?`disabled`:``}>Delete</button>
        </span>
      </div>`}).join(``),l=i.map(r=>{let i=n.selectedIds.includes(r.id),a=i?` is-selected`:``,o=r.id===n.selectedId?` is-primary`:``,s=r.color?`<span class="cal-swatch" style="background:${e(r.color)}"></span>`:`<span class="cal-swatch cal-swatch-empty"></span>`,c=r.access===`readwrite`?`Shared with you · full access — check to show events; click to set as primary for new events`:`Shared with you · read-only — check to show events`;return`<div class="cal-row${a}${o}" data-action="select-cal" data-id="${r.id}" role="button" tabindex="0" title="${e(c)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${r.id}" ${i?`checked`:``} ${n.busy?`disabled`:``} />
        </label>
        ${s}
        <span class="cal-row-text">
          <span class="cal-row-title">${e(r.displayname)}</span>
          <span class="cal-row-badges">${t.accessBadge(r.access)}</span>
          <span class="muted small">${r.access===`readwrite`?`Shared · full access`:`Shared · read-only`}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${r.id}" ${n.busy?`disabled`:``} title="Export as .ics">Export</button>
        </span>
      </div>`}).join(``),u=n.directory.map(t=>`<option value="${e(t.username)}">${e(t.displayname)} (${e(t.username)})</option>`).join(``),d=n.shares.length===0?`<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>`:n.shares.map(r=>`<tr>
              <td>
                <strong>${e(r.displayname||r.username||r.href)}</strong>
                <div class="muted small mono">${e(r.username||r.href)}</div>
              </td>
              <td>${t.accessBadge(r.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${e(r.href)}" ${n.busy?`disabled`:``}>Revoke</button>
              </td>
            </tr>`).join(``),f=s?.color&&s.color.length>=7?s.color.slice(0,7):`#3B82F6`,p=!!(s&&s.readOnly),m=n.calModalOpen&&s&&s.canShare?a({id:`cal-edit-modal`,title:`Calendar details`,titleId:`cal-modal-title`,closeAction:`close-cal-modal`,body:`
              <section>
                <p class="muted small mono" style="margin:0">
                  ${e(s.uri)}
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
                      value="${e(s.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${e(f)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${e(s.color||f)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${e(s.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${n.busy?`disabled`:``}>Save changes</button>
                    <span class="muted small mono">${e(s.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${B(`Share “${s.displayname}”`,`share`)}
                ${p?`<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>`:``}
                <form class="form-grid" data-form="share" style="margin-top:1rem">
                  <label>
                    User
                    <select name="username" required ${n.directory.length===0?`disabled`:``}>
                      <option value="">${n.directory.length?`Select user…`:`No other users`}</option>
                      ${u}
                    </select>
                  </label>
                  <label>
                    Access
                    <select name="access" ${p?`disabled`:``}>
                      <option value="read" selected>Read only</option>
                      ${p?``:`<option value="readwrite">Full access</option>`}
                    </select>
                    ${p?`<input type="hidden" name="access" value="read" />`:``}
                  </label>
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" ${n.busy||n.directory.length===0?`disabled`:``}>Share</button>
                  </div>
                </form>
                <div class="table-wrap" style="margin-top:1.25rem">
                  <table>
                    <thead>
                      <tr><th>Shared with</th><th>Access</th><th></th></tr>
                    </thead>
                    <tbody>${d}</tbody>
                  </table>
                </div>
              </section>
              <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${B(`Import / export`,`import-export`)}
                ${s.readOnly?`<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>`:``}
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${n.busy?`disabled`:``}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${n.busy||s.readOnly?`aria-disabled=true`:``}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${n.busy||s.readOnly?`disabled`:``} hidden />
                  </label>
                </div>
              </section>`,footer:[{label:`Close`,action:`close-cal-modal`,variant:`ghost`}]}):``,h=n.deleteConfirmId===null?null:n.calendars.find(e=>e.id===n.deleteConfirmId&&e.canShare)??null,g=h?a({id:`cal-delete-modal`,title:`Delete calendar`,titleId:`cal-delete-title`,closeAction:`cancel-delete-cal`,size:`sm`,body:`
            <p>You are about to permanently delete <strong>${e(h.displayname)}</strong>
              <span class="muted small mono">(${e(h.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${o({action:`toggle-delete-confirm`,label:`I understand and want to permanently delete this calendar`,id:`delete-cal-confirm`,style:`checkbox`})}`,footer:[{label:`Cancel`,action:`cancel-delete-cal`,variant:`ghost`,disabled:n.busy},{label:`Delete permanently`,action:`confirm-delete-cal`,variant:`danger`,disabled:!0,id:`delete-cal-submit`,attrs:`data-id="${h.id}"`}]}):``,_=n.createCalModalOpen?a({id:`cal-create-modal`,title:`Add calendar`,titleId:`cal-create-title`,closeAction:`close-create-cal-modal`,body:`
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
                  ${n.holidayCountries.map(t=>`<option value="${e(t.code)}">${e(t.name)} (${e(t.code)})</option>`).join(``)}
                </select>
              </label>
              <label class="checkbox">
                <input type="checkbox" name="readOnly" />
                Read-only (for everyone)
              </label>
              <div class="form-actions-row form-actions-wrap">
                <button type="submit" class="btn btn-primary" ${n.busy?`disabled`:``}>Create calendar</button>
                <label class="btn btn-ghost file-btn" ${n.busy?`aria-disabled=true`:``} title="Create a calendar and import a .ics file">
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${n.busy?`disabled`:``} hidden />
                </label>
                <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${n.busy?`disabled`:``}>Cancel</button>
              </div>
              <p class="muted small" style="margin:0.5rem 0 0">
                <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
              </p>
            </form>`}):``;return`
    <div class="portal-grid portal-grid-calendars">
      <aside class="calendars-sidebar">
        <section class="card calendars-sidebar-card">
          <div class="calendars-sidebar-head">
            ${B(`Owned`,`owned`)}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${c||`<p class="muted">No calendars yet. Create one below.</p>`}
            ${i.length?`<div class="calendars-shared-block">
                     ${B(`Shared with me`,`shared-with-me`)}
                     <div class="cal-list" style="margin-top:0.75rem">${l}</div>
                   </div>`:``}
          </div>
          <div class="calendars-sidebar-create">
            <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${n.busy?`disabled`:``}>Create calendar</button>
          </div>
        </section>
      </aside>
      ${t.renderMonthGrid()}
    </div>
    ${_}
    ${m}
    ${g}
    ${t.renderEventModal()}`}function io(e){if(!e.state.editingContact)return;let t=e.root.querySelector(`[data-form="contact"]`);if(!t)return;let n=new FormData(t);e.state.editingContact.firstname=String(n.get(`firstname`)??``),e.state.editingContact.lastname=String(n.get(`lastname`)??``),e.state.editingContact.fullname=String(n.get(`fullname`)??``),e.state.editingContact.org=String(n.get(`org`)??``),e.state.editingContact.title=String(n.get(`title`)??``),e.state.editingContact.url=String(n.get(`url`)??``),e.state.editingContact.note=String(n.get(`note`)??``);let r=String(n.get(`birthday`)??``).trim();e.state.editingContact.birthday=r&&/^\d{4}-\d{2}-\d{2}/.test(r)?r.slice(0,10):null,e.state.editingContact.address={street:String(n.get(`street`)??``),city:String(n.get(`city`)??``),region:String(n.get(`region`)??``),postal:String(n.get(`postal`)??``),country:String(n.get(`country`)??``)};let i=[],a=0;for(;n.has(`email_${a}`);)i.push(String(n.get(`email_${a}`)??``)),a++;i.length&&(e.state.editingContact.emails=i);let o=[];for(a=0;n.has(`phone_value_${a}`);)o.push({type:String(n.get(`phone_type_${a}`)??`other`),value:String(n.get(`phone_value_${a}`)??``)}),a++;o.length&&(e.state.editingContact.phones=o);let s=[];for(a=0;n.has(`custom_label_${a}`)||n.has(`custom_value_${a}`);)s.push({label:String(n.get(`custom_label_${a}`)??``),value:String(n.get(`custom_value_${a}`)??``)}),a++;e.state.editingContact.custom=s}function ao(e,t){let n=new FormData(t),r=[],i=0;for(;n.has(`email_${i}`);){let e=String(n.get(`email_${i}`)??``).trim();e&&r.push(e),i++}let a=[];for(i=0;n.has(`phone_value_${i}`);){let e=String(n.get(`phone_value_${i}`)??``).trim();e&&a.push({type:String(n.get(`phone_type_${i}`)??`other`),value:e}),i++}let o=[];for(i=0;n.has(`custom_label_${i}`)||n.has(`custom_value_${i}`);){let e=String(n.get(`custom_label_${i}`)??``).trim(),t=String(n.get(`custom_value_${i}`)??``).trim();(e||t)&&o.push({label:e,value:t}),i++}let s={firstname:String(n.get(`firstname`)??``).trim(),lastname:String(n.get(`lastname`)??``).trim(),fullname:String(n.get(`fullname`)??``).trim(),org:String(n.get(`org`)??``).trim(),title:String(n.get(`title`)??``).trim(),emails:r,phones:a,address:{street:String(n.get(`street`)??``).trim(),city:String(n.get(`city`)??``).trim(),region:String(n.get(`region`)??``).trim(),postal:String(n.get(`postal`)??``).trim(),country:String(n.get(`country`)??``).trim()},url:String(n.get(`url`)??``).trim(),note:String(n.get(`note`)??``).trim(),birthday:(()=>{let e=String(n.get(`birthday`)??``).trim();return e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null})(),custom:o};return e.state.removePhotoPending?s.removePhoto=!0:e.state.photoBase64Pending&&(s.photoBase64=e.state.photoBase64Pending),s}function K(e){let{state:t,root:n}=e,r=n.querySelector(`[data-form="edit-event"]`);r&&t.editingEvent&&e.syncEditingEventFromForm(r);let i=n.querySelector(`[data-form="task"]`);i&&t.editingTask&&e.syncEditingTaskFromForm(i);let a=n.querySelector(`[data-form="note"]`);a&&t.editingNote&&e.syncEditingNoteFromForm(a),t.editingContact&&io(e.contactsHost)}async function oo(e,t,n,r){let{state:i,root:a,render:o,setFlash:s,clearFlash:c}=e;if(t===`toggle-cal`){let t=Number(n.dataset.id);if(!Number.isFinite(t))return!0;r.stopPropagation(),e.toggleCalendarSelected(t),i.calendarSelectionSeeded=!0,i.busy=!0,c(),o();try{await e.loadMonthEvents()}catch(e){s(`error`,e instanceof Error?e.message:`Failed to load calendar`)}finally{i.busy=!1,o()}return!0}if(t===`select-cal`){let t=Number(n.dataset.id);if(!Number.isFinite(t))return!0;i.selectedIds.includes(t)||(i.selectedIds=[...i.selectedIds,t]),i.selectedId=t,i.calendarSelectionSeeded=!0,ga(i),i.busy=!0,c(),o();try{await e.loadMonthEvents()}catch(e){s(`error`,e instanceof Error?e.message:`Failed to load calendar`)}finally{i.busy=!1,o()}return!0}if(t===`edit-cal`){let t=Number(n.dataset.id);if(!Number.isFinite(t)||!i.calendars.find(e=>e.id===t&&e.canShare))return!0;i.selectedId=t,i.selectedIds.includes(t)||(i.selectedIds=[...i.selectedIds,t]),ga(i),i.calModalOpen=!0,i.deleteConfirmId=null,i.busy=!0,c(),o();try{await e.loadShares(t),await e.loadMonthEvents()}catch(e){s(`error`,e instanceof Error?e.message:`Failed to open calendar`)}finally{i.busy=!1,o()}return!0}if(t===`close-cal-modal`)return i.calModalOpen=!1,o(),!0;if(t===`open-create-cal-modal`)return i.createCalModalOpen=!0,i.calModalOpen=!1,i.deleteConfirmId=null,c(),o(),!0;if(t===`close-create-cal-modal`)return i.createCalModalOpen=!1,c(),o(),!0;if(t===`delete-cal`){let e=Number(n.dataset.id);return!Number.isFinite(e)||!i.calendars.find(t=>t.id===e&&t.canShare)||(i.deleteConfirmId=e,i.calModalOpen=!1,c(),o(),!0)}if(t===`cancel-delete-cal`)return i.deleteConfirmId=null,o(),!0;if(t===`confirm-delete-cal`){let t=Number(n.dataset.id),r=a.querySelector(`#delete-cal-confirm`);if(!Number.isFinite(t)||!r?.checked)return!0;i.busy=!0,c(),o();try{if(await E.deleteCalendar(t),i.selectedId===t&&(i.selectedId=null),i.selectedIds=i.selectedIds.filter(e=>e!==t),i.deleteConfirmId=null,i.calModalOpen=!1,i.shares=[],i.monthEvents=[],await e.loadHome(),i.selectedId===null){let t=e.pickDefaultCalendar();t?(i.selectedId=t.id,i.selectedIds.includes(t.id)||(i.selectedIds=[...i.selectedIds,t.id]),await e.loadMonthEvents()):i.selectedIds.length>0&&(i.selectedId=i.selectedIds[0],await e.loadMonthEvents())}s(`success`,`Calendar deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,o()}return!0}if(t===`cal-view`){let t=n.dataset.view;if(t!==`month`&&t!==`week`&&t!==`agenda`)return!0;i.calView=t,t===`week`&&(i.weekScrollToDayStart=!0),ga(i),i.monthExpandDay=null,i.busy=!0,o();try{await e.loadMonthEvents()}finally{i.busy=!1,o()}return!0}if(t===`month-today`){let t=new Date;i.monthCursor={y:t.getFullYear(),m:t.getMonth()},i.calFocusDay=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`,i.monthExpandDay=null,i.busy=!0,o();try{await e.loadMonthEvents()}finally{i.busy=!1,o()}return!0}if(t===`month-prev`||t===`month-next`){let n=t===`month-prev`?-1:1,r=i.calView;if(r===`week`){let e=Li(i.calFocusDay)??new Date;e.setDate(e.getDate()+n*7),i.calFocusDay=U(e),i.monthCursor={y:e.getFullYear(),m:e.getMonth()}}else if(r===`agenda`){let e=Li(i.calFocusDay)??new Date;e.setDate(e.getDate()+n*7),i.calFocusDay=U(e),i.monthCursor={y:e.getFullYear(),m:e.getMonth()}}else{let e=new Date(i.monthCursor.y,i.monthCursor.m+n,1);i.monthCursor={y:e.getFullYear(),m:e.getMonth()},i.calFocusDay=U(e)}i.monthExpandDay=null,i.busy=!0,o();try{await e.loadMonthEvents()}finally{i.busy=!1,o()}return!0}if(t===`open-event`){r.stopPropagation();let t=Number(n.dataset.instance),a=n.dataset.uri??``;if(!Number.isFinite(t)||!a)return!0;i.busy=!0,c(),o();try{let n=await E.getEvent(t,a);i.editingEvent={...n.event,repeat:n.event.repeat??e.defaultRepeat()},i.creatingEvent=!1,i.eventModalOpen=!0,i.eventDtPicker=null,i.calModalOpen=!1,i.deleteConfirmId=null}catch(e){s(`error`,e instanceof Error?e.message:`Failed to open event`)}finally{i.busy=!1,o()}return!0}if(t===`open-event-day`){r.stopPropagation();let e=n.dataset.day??``;return i.monthExpandDay=i.monthExpandDay===e?null:e,o(),!0}if(t===`new-event-day`){if(r.target?.closest?.(`.month-event, .month-event-more`))return!0;let t=n.dataset.day??``;if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return!0;if(i.selectedId===null)return s(`error`,`Select a calendar first`),o(),!0;let a=i.calendars.find(e=>e.id===i.selectedId);return!a||a.readOnly||!(a.canShare||a.access===`readwrite`)?(s(`error`,`This calendar is read-only`),o(),!0):(i.creatingEvent=!0,i.editingEvent=e.blankEventForDay(t,i.selectedId),i.eventModalOpen=!0,i.eventDtPicker=null,i.calModalOpen=!1,i.deleteConfirmId=null,c(),o(),!0)}if(t===`new-event-slot`){if(r.target?.closest?.(`.week-event`))return!0;let t=n.dataset.day??``,a=Number(n.dataset.hour);if(!/^\d{4}-\d{2}-\d{2}$/.test(t)||!Number.isInteger(a)||a<0||a>23)return!0;if(i.selectedId===null)return s(`error`,`Select a calendar first`),o(),!0;let l=i.calendars.find(e=>e.id===i.selectedId);return!l||l.readOnly||!(l.canShare||l.access===`readwrite`)?(s(`error`,`This calendar is read-only`),o(),!0):(i.creatingEvent=!0,i.editingEvent=e.blankEventForSlot(t,a,i.selectedId),i.eventModalOpen=!0,i.eventDtPicker=null,i.calModalOpen=!1,i.deleteConfirmId=null,c(),o(),!0)}if(t===`close-event-modal`)return i.eventModalOpen=!1,i.editingEvent=null,i.creatingEvent=!1,i.eventDtPicker=null,c(),o(),!0;if(t===`dt-open`){let t=n.dataset.dtField||``;if(!t)return!0;if(K(e),i.eventDtPicker?.field===t)i.eventDtPicker=null;else{let r=n.dataset.dtDateOnly===`1`,a=n.dataset.dtClear!==`0`,o=n.dataset.dtName||t,s=e.getDtFieldCurrentValue(t);!s&&(t===`due`||t===`dtstart`||t===`bulk-due`)&&(s=$i().start);let[c,l]=Qi(s||U(new Date)).date.split(`-`).map(Number);i.eventDtPicker={field:t,viewY:c,viewM:(l||1)-1,dateOnly:r,allowClear:a,name:o}}return o(),!0}if(t===`dt-month-prev`||t===`dt-month-next`){if(!i.eventDtPicker)return!0;K(e);let n=t===`dt-month-prev`?-1:1,r=new Date(i.eventDtPicker.viewY,i.eventDtPicker.viewM+n,1);return i.eventDtPicker={...i.eventDtPicker,viewY:r.getFullYear(),viewM:r.getMonth()},o(),!0}if(t===`dt-set-month`){if(!i.eventDtPicker)return!0;K(e);let t=Number(n.value);return!Number.isFinite(t)||t<0||t>11||(i.eventDtPicker={...i.eventDtPicker,viewM:t},o(),!0)}if(t===`dt-set-year`){if(!i.eventDtPicker)return!0;K(e);let t=Number(n.value);return!Number.isFinite(t)||t<1||t>9999||(i.eventDtPicker={...i.eventDtPicker,viewY:t},o(),!0)}if(t===`dt-pick-day`){if(!i.eventDtPicker)return!0;let t=i.eventDtPicker.field,r=n.dataset.day??``;if(!/^\d{4}-\d{2}-\d{2}$/.test(r))return!0;K(e);let a=i.eventDtPicker.dateOnly;if(a)e.setDtFieldValue(t,r),i.eventDtPicker=null;else{let n=Qi(e.getDtFieldCurrentValue(t)||$i(r).start).hm;e.setDtFieldValue(t,`${r}T${n}`),i.eventDtPicker={...i.eventDtPicker,viewY:Number(r.slice(0,4)),viewM:Number(r.slice(5,7))-1}}if(t===`start`&&i.editingEvent&&!a&&i.editingEvent.end){let t=new Date(String(i.editingEvent.start)),n=new Date(String(i.editingEvent.end));!Number.isNaN(t.getTime())&&!Number.isNaN(n.getTime())&&n<=t&&e.setDtFieldValue(`end`,W(new Date(t.getTime()+36e5)))}return o(),!0}if(t===`dt-pick-time`){if(!i.eventDtPicker||i.eventDtPicker.dateOnly)return!0;let t=i.eventDtPicker.field,r=n.dataset.hm??``;if(!/^\d{2}:\d{2}$/.test(r))return!0;K(e);let a=`${Qi(e.getDtFieldCurrentValue(t)||$i().start).date}T${r}`;if(e.setDtFieldValue(t,a),t===`start`&&i.editingEvent){i.editingEvent={...i.editingEvent,allDay:!1};let t=i.editingEvent.end?Qi(String(i.editingEvent.end)):null,n=new Date(a);(!t||new Date(`${t.date}T${t.hm}`)<=n)&&e.setDtFieldValue(`end`,W(new Date(n.getTime()+36e5)))}return i.eventDtPicker=null,o(),!0}if(t===`dt-today`){if(!i.eventDtPicker)return!0;let t=i.eventDtPicker.field;K(e);let n=U(new Date);if(i.eventDtPicker.dateOnly)e.setDtFieldValue(t,n);else{let r=$i(n);t===`start`?(e.setDtFieldValue(`start`,r.start),i.editingEvent&&!i.editingEvent.end&&e.setDtFieldValue(`end`,r.end)):t===`end`?e.setDtFieldValue(`end`,r.end):e.setDtFieldValue(t,r.start)}return i.eventDtPicker=null,o(),!0}if(t===`dt-clear`){if(!i.eventDtPicker||!i.eventDtPicker.allowClear)return!0;let t=i.eventDtPicker.field;return K(e),e.setDtFieldValue(t,null),i.eventDtPicker=null,o(),!0}if(t===`event-allday-toggle`){if(!i.editingEvent)return!0;let e=a.querySelector(`[data-form="edit-event"]`),t=n.checked;if(e){let n=new FormData(e),r=String(n.get(`start`)??i.editingEvent.start??``),a=String(n.get(`end`)??i.editingEvent.end??``)||null,o=r,s=a;if(t){let e=na(r,a);o=e.start,s=e.end}else{let e=ta(r.slice(0,10),(a||r).slice(0,10));o=e.start,s=e.end}i.editingEvent={...i.editingEvent,summary:String(n.get(`summary`)??i.editingEvent.summary),description:String(n.get(`description`)??i.editingEvent.description),location:String(n.get(`location`)??i.editingEvent.location),instanceId:Number(n.get(`instanceId`))||i.editingEvent.instanceId,allDay:t,start:o,end:s,repeat:Fa(n)}}else i.editingEvent={...i.editingEvent,allDay:t};return i.eventDtPicker=null,o(),!0}if(t===`event-repeat-freq`||t===`event-repeat-end`){if(!i.editingEvent)return!0;let e=a.querySelector(`[data-form="edit-event"]`);if(!e)return!0;let t=new FormData(e),n=e.querySelector(`input[name="allDay"]`),r=Fa(t);return i.editingEvent={...i.editingEvent,summary:String(t.get(`summary`)??i.editingEvent.summary),description:String(t.get(`description`)??i.editingEvent.description),location:String(t.get(`location`)??i.editingEvent.location),instanceId:Number(t.get(`instanceId`))||i.editingEvent.instanceId,allDay:n?.checked??i.editingEvent.allDay,start:String(t.get(`start`)??i.editingEvent.start??``),end:String(t.get(`end`)??i.editingEvent.end??``)||null,repeat:r,hasRrule:!!String(t.get(`repeatFreq`)??``).trim()},r.freq&&r.endMode===`until`&&i.eventDtPicker?.field===`end`&&(i.eventDtPicker=null),o(),!0}if(t===`delete-event`)return!i.editingEvent||!i.editingEvent.canWrite||i.creatingEvent?!0:(i.confirmDelete={scope:`event`,title:`Delete event`,message:`Delete “${String(i.editingEvent.summary||`this event`).trim()||`this event`}”?`,detail:`CalDAV clients will sync the removal. This cannot be undone.`},o(),!0);if(t===`revoke`){let e=n.dataset.href??``;return!e||i.selectedId===null||(i.confirmDelete={scope:`revoke-share`,title:`Revoke share`,message:`Revoke access for this user?`,detail:`They will lose this calendar until you share it again.`,href:e},o(),!0)}if(t===`export-cal`){r.stopPropagation();let t=n.dataset.id,a=t!==void 0&&t!==``?Number(t):i.selectedId;if(a===null||Number.isNaN(a))return!0;i.busy=!0,c(),o();try{let{blob:t,filename:n}=await E.exportCalendar(a),r=await e.saveBlobAsFile(t,n);r===`cancelled`?s(`info`,`Export cancelled`):r===`saved`?s(`success`,`Saved ${n}`):s(`success`,`Download started: ${n}`)}catch(e){s(`error`,e instanceof Error?e.message:`Export failed`)}finally{i.busy=!1,o()}return!0}return!1}function q(e,t){return`${e}|${t}`}async function so(e){let t=await E.notes({q:e.state.noteSearch,sort:e.state.noteSort,order:e.state.noteOrder});e.state.notes=t.notes,e.state.noteCalendars=t.calendars;let n=new Set(t.notes.map(e=>q(e.instanceId,e.uri)));e.state.checkedNoteKeys=e.state.checkedNoteKeys.filter(e=>n.has(e)),e.state.selectedNoteKey!==null&&!e.state.notes.some(t=>`${t.instanceId}|${t.uri}`===e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.creatingNote||(e.state.editingNote=null,e.state.noteModalOpen=!1))}function co(t){let n=t.extra?`<span class="muted small selection-count-extra">${t.extra}</span>`:``;return`<div class="selection-toolbar files-toolbar-actions" role="toolbar" aria-label="Selected items">
    <span class="selection-count files-selection-count"><strong>${t.count}</strong> selected${n}</span>
    <button type="button" class="btn btn-ghost btn-small" data-action="${e(t.clearAction)}" ${t.busy?`disabled`:``}>Clear</button>
    ${t.actionsHtml}
  </div>`}function lo(t){let n=t.selection===null?`<div class="files-toolbar-actions">
          <button type="button" class="btn btn-primary" data-action="${e(t.addAction)}" ${t.busy||t.addDisabled?`disabled`:``}>${e(t.addLabel)}</button>
        </div>`:co({count:t.selection.count,extra:t.selection.extra,busy:t.busy,clearAction:t.selection.clearAction,actionsHtml:t.selection.actionsHtml});return`<div class="files-toolbar">
    <input type="search" class="files-search" data-action="${e(t.searchAction)}" placeholder="${e(t.searchPlaceholder)}" value="${e(t.searchValue)}" aria-label="${e(t.searchAria)}" ${t.busy?`disabled`:``} />
    ${n}
  </div>`}var uo=new Set([`P`,`BR`,`STRONG`,`B`,`EM`,`I`,`U`,`UL`,`OL`,`LI`,`H1`,`H2`,`H3`,`A`,`BLOCKQUOTE`,`DIV`,`SPAN`,`HR`,`INPUT`,`DEL`,`S`,`STRIKE`,`CODE`]);function fo(e){return/<[a-z][\s\S]*>/i.test(e)}function po(e){return e.replace(/<\/(p|div|h1|h2|h3|li|blockquote)>/gi,`
`).replace(/<br\s*\/?>/gi,`
`).replace(/<hr\s*\/?>/gi,`
`).replace(/<[^>]+>/g,` `).replace(/&nbsp;/g,` `).replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/\s+\n/g,`
`).replace(/[ \t]+/g,` `).replace(/\n{3,}/g,`

`).trim()}function mo(e){if(!e)return``;if(!fo(e))return e;if(typeof DOMParser>`u`)return e.replace(/<script[\s\S]*?<\/script>/gi,``).replace(/on\w+\s*=/gi,``);let t=new DOMParser().parseFromString(`<div id="n">${e}</div>`,`text/html`).getElementById(`n`);if(!t)return``;let n=e=>{let t=[...e.childNodes];for(let e of t)if(e.nodeType===1){let t=e,r=t.tagName;if(r===`INPUT`&&t.getAttribute(`type`)?.toLowerCase()!==`checkbox`){t.parentNode?.removeChild(t);continue}if(!uo.has(r)){let e=t.parentNode;if(e){for(;t.firstChild;)e.insertBefore(t.firstChild,t);e.removeChild(t)}continue}for(let e of[...t.attributes]){let n=e.name.toLowerCase();if(n.startsWith(`on`)||n===`style`)t.removeAttribute(e.name);else if(r===`A`&&n===`href`){let n=e.value.trim();/^(https?:|mailto:|#)/i.test(n)||t.removeAttribute(`href`)}else if(r===`INPUT`&&(n===`type`||n===`checked`))continue;else(r!==`A`||n!==`href`&&n!==`target`&&n!==`rel`)&&t.removeAttribute(e.name)}r===`A`&&(t.setAttribute(`rel`,`noopener noreferrer`),t.setAttribute(`target`,`_blank`)),r===`INPUT`&&t.setAttribute(`type`,`checkbox`),n(t)}else e.nodeType!==3&&e.parentNode?.removeChild(e)};return n(t),t.innerHTML}var ho=null;function go(t,n){let r=mo(t);return`<div class="note-editor">
      ${n?``:`<div class="note-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h1" title="Heading 1">H1</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h2" title="Heading 2">H2</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h3" title="Heading 3">H3</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="blockquote" title="Blockquote">“</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertHorizontalRule" title="Horizontal line">―</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertCheckbox" title="Checkbox">☐</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="createLink" title="Link">Link</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertCode" title="Inline code">&lt;/&gt;</button>
      </div>`}
      <div class="note-editor-body" data-note-editor="1" ${n?`contenteditable="false"`:`contenteditable="true" role="textbox" aria-label="Note body" aria-multiline="true"`}
        >${r}</div>
      <textarea name="description" hidden>${e(t)}</textarea>
    </div>`}function _o(e){ho?.abort(),ho=null;let t=e.root.querySelector(`[data-note-editor]`),n=e.root.querySelector(`textarea[name="description"]`);if(!t||!n)return;let r=()=>{n.value=mo(t.innerHTML),Oo(t)};ho=new AbortController;let{signal:i}=ho;t.addEventListener(`input`,r,{signal:i}),t.addEventListener(`blur`,r,{signal:i}),t.addEventListener(`keyup`,()=>Oo(t),{signal:i}),t.addEventListener(`mouseup`,()=>Oo(t),{signal:i}),document.addEventListener(`selectionchange`,()=>{if(!t.isConnected)return;let e=window.getSelection();!e||e.rangeCount===0||t.contains(e.anchorNode)&&Oo(t)},{signal:i}),e.root.querySelector(`.note-editor-toolbar`)?.addEventListener(`mousedown`,e=>{e.target?.closest?.(`[data-action='note-fmt']`)&&e.preventDefault()},{signal:i}),Oo(t)}function vo(e){let t=window.getSelection();if(!t||t.rangeCount===0)return null;let n=t.anchorNode;return!n||!e.contains(n)?null:n}function yo(e,t,n){let r=t;for(;r&&r!==e;){if(r instanceof HTMLElement&&n(r))return r;r=r.parentNode}return null}function bo(e){return yo(e,vo(e),e=>/^(H1|H2|H3|BLOCKQUOTE|P|DIV)$/.test(e.tagName))}function xo(e){let t=bo(e)?.tagName.toLowerCase()??``;return t===`div`?``:t}function So(e){let t=document.createRange();t.selectNodeContents(e),t.collapse(!1);let n=window.getSelection();n?.removeAllRanges(),n?.addRange(t)}function Co(e){for(let t of[e,`<${e}>`])try{if(document.execCommand(`formatBlock`,!1,t))return!0}catch{}return!1}function wo(e,t){let n=bo(e);if(n){let e=n.tagName.toLowerCase()===t?`p`:t,r=document.createElement(e);for(;n.firstChild;)r.appendChild(n.firstChild);r.childNodes.length||r.appendChild(document.createElement(`br`)),n.replaceWith(r),So(r);return}Co(t)||document.execCommand(`insertHTML`,!1,`<${t}><br></${t}>`)}function To(e){let t=yo(e,vo(e),e=>e.tagName===`LI`&&!!e.querySelector(`input[type="checkbox"]`))?.parentElement;return t instanceof HTMLUListElement||t instanceof HTMLOListElement?t:null}function Eo(e){let t=e.parentNode;if(t){for(;e.firstChild;)t.insertBefore(e.firstChild,e);t.removeChild(e)}}function Do(e){let t=e.parentNode;if(!t)return;let n=[...e.children].filter(e=>e instanceof HTMLLIElement);for(let r of n){r.querySelectorAll(`input[type="checkbox"]`).forEach(e=>e.remove());let n=document.createElement(`p`);n.innerHTML=r.innerHTML.trim()?r.innerHTML:`<br>`,t.insertBefore(n,e)}t.removeChild(e)}function Oo(e){let t=e.parentElement?.querySelector(`.note-editor-toolbar`);if(!t)return;let n=xo(e),r=!!yo(e,vo(e),e=>e.tagName===`CODE`),i=!!yo(e,vo(e),e=>e.tagName===`A`),a=!!To(e);t.querySelectorAll(`.note-fmt-btn`).forEach(e=>{let t=e.dataset.cmd||``,o=(e.dataset.value||``).toLowerCase(),s=!1;if(t===`formatBlock`&&o)s=n===o;else if(t===`insertCheckbox`)s=a;else if(t===`insertCode`)s=r;else if(t===`createLink`)s=i;else if(t===`insertHorizontalRule`)s=!1;else try{s=document.queryCommandState(t)}catch{s=!1}e.classList.toggle(`is-active`,s),e.setAttribute(`aria-pressed`,s?`true`:`false`)})}function ko(e,t){let n=document.querySelector(`[data-note-editor]`);if(!n||n.getAttribute(`contenteditable`)!==`true`)return;if(n.focus(),e===`createLink`){if(yo(n,vo(n),e=>e.tagName===`A`))document.execCommand(`unlink`,!1);else{let e=window.prompt(`Link URL`,`https://`);if(!e)return;document.execCommand(`createLink`,!1,e)}}else if(e===`formatBlock`)wo(n,(t||`h2`).toLowerCase());else if(e===`insertHorizontalRule`)document.execCommand(`insertHorizontalRule`,!1);else if(e===`insertCheckbox`){let e=To(n);e?Do(e):document.execCommand(`insertHTML`,!1,`<ul><li><input type="checkbox"> </li></ul>`)}else if(e===`insertCode`){let e=yo(n,vo(n),e=>e.tagName===`CODE`);if(e)Eo(e);else{let e=window.getSelection(),t=(e&&e.rangeCount>0?e.toString():``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);document.execCommand(`insertHTML`,!1,`<code>${t||`​`}</code>`)}}else document.execCommand(e,!1,t);let r=document.querySelector(`textarea[name="description"]`);r&&(r.value=mo(n.innerHTML)),Oo(n)}function Ao(t){if(!t.state.noteModalOpen||!t.state.editingNote)return``;let n=t.state.editingNote,r=t.state.creatingNote,i=!!(n.readOnly&&!r),o=r||n.canWrite,s=t.state.noteCalendars.map(t=>`<option value="${t.id}" ${n.instanceId===t.id?`selected`:``}>${e(t.displayname)}</option>`).join(``),c=[...!r&&n.canWrite?[{label:`Delete`,action:`delete-note`,variant:`danger`,disabled:t.state.busy}]:[],{label:r?`Cancel`:`Close`,action:`cancel-note`,variant:`ghost`},...o?[{label:r?`Create note`:`Save note`,type:`submit`,variant:`primary`,disabled:t.state.busy}]:[]];return a({id:`note-edit-modal`,title:r?`New note`:`Edit note`,titleId:`note-modal-title`,closeAction:`cancel-note`,size:`wide`,cardClassName:`note-edit-modal-card`,form:!0,formAttrs:`data-form="note"`,body:`${r?`<label>Calendar
                    <select name="instanceId" required ${t.state.noteCalendars.length===0?`disabled`:``}>
                      <option value="">${t.state.noteCalendars.length?`Select calendar…`:`No writable calendars`}</option>
                      ${s}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${e(n.calendarName)}</strong>${n.readOnly?` · read-only`:``}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${e(n.summary)}" ${i?`readonly`:``} />
            </label>
            ${t.renderPortalDateTimeField({field:`dtstart`,name:`dtstart`,label:`Date`,value:ra(n.dtstart),dateOnly:!1,disabled:i,allowClear:!0})}
            <div class="field">
              <span>Body</span>
              ${go(n.description,i)}
            </div>`,footer:c})}function jo(t){let n=t.state.notes.filter(e=>e.canWrite&&!e.readOnly).map(e=>q(e.instanceId,e.uri)),r=t.state.checkedNoteKeys.filter(e=>n.includes(e)).length,i=n.length>0&&n.every(e=>t.state.checkedNoteKeys.includes(e)),a=t.state.checkedNoteKeys.length>0&&!i,o=t.state.checkedNoteKeys.length-r,s=lo({searchAction:`note-search`,searchPlaceholder:`Search notes…`,searchValue:t.state.noteSearch,searchAria:`Search notes`,busy:t.state.busy,addAction:`new-note`,addLabel:`Add note`,addDisabled:t.state.noteCalendars.length===0,selection:t.state.checkedNoteKeys.length>0?{count:r,extra:o>0?`(${o} read-only skipped)`:void 0,clearAction:`note-clear-selection`,actionsHtml:`
            <button type="button" class="btn btn-ghost btn-small" data-action="note-bulk-copy" ${t.state.busy||r===0?`disabled`:``}>Copy</button>
            <button type="button" class="btn btn-small btn-danger" data-action="note-bulk-delete" ${t.state.busy||r===0?`disabled`:``}>Delete</button>`}:null}),c=t.state.notes.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${t.state.noteSearch?`No notes match your search.`:`No notes yet. Use Add note.`}</td></tr>`:t.state.notes.map(n=>{let r=q(n.instanceId,n.uri),i=!t.state.creatingNote&&r===t.state.selectedNoteKey?` is-selected`:``,a=t.state.checkedNoteKeys.includes(r),o=n.canWrite&&!n.readOnly,s=po(n.description||``).replace(/\s+/g,` `).slice(0,80);return`<tr class="contact-table-row${i}${a?` is-checked`:``}" data-action="select-note" data-instance="${n.instanceId}" data-uri="${e(n.uri)}" tabindex="0" role="button">
              <td class="contact-col-check" data-stop-row>
                <input type="checkbox" class="row-check" data-action="note-check" data-instance="${n.instanceId}" data-uri="${e(n.uri)}"
                  ${a?`checked`:``} ${o?``:`disabled`} aria-label="Select ${e(n.summary||n.uri)}" ${t.state.busy?`disabled`:``} />
              </td>
              <td class="col-note-title">
                <span class="contact-name-primary">${e(n.summary||n.uri)}</span>
                ${s?`<span class="muted small contact-name-secondary">${e(s)}${n.description.length>80?`…`:``}</span>`:``}
                ${n.readOnly?`<span class="badge">read-only</span>`:``}
              </td>
              <td class="col-note-date muted small">${e(Mn(n.dtstart))}</td>
              <td class="col-note-cal muted small">${e(n.calendarName)}</td>
            </tr>`}).join(``);return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      <div class="files-head">
        ${B(`Notes`,`notes`,`h1`)}
      </div>
      ${s}
      ${t.state.noteCalendars.length===0?`<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>`:``}
      <div class="contacts-table-wrap contacts-table-wrap-tall items-table-wrap">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="contact-col-check">
                <input type="checkbox" data-action="note-select-all" aria-label="Select all writable notes"
                  ${i?`checked`:``}
                  ${a?`data-indeterminate=1`:``}
                  ${t.state.notes.length===0||t.state.busy?`disabled`:``} />
              </th>
              ${F(`Title`,`summary`,t.state.noteSort,t.state.noteOrder,`note`,`col-note-title`)}
              ${F(`Date`,`dtstart`,t.state.noteSort,t.state.noteOrder,`note`,`col-note-date`)}
              ${F(`Calendar`,`calendar`,t.state.noteSort,t.state.noteOrder,`note`,`col-note-cal`)}
            </tr>
          </thead>
          <tbody>${c}</tbody>
        </table>
      </div>
      <p class="muted small contacts-main-hint">Select a note to edit, or use <strong>Add note</strong>.</p>
    </section>
    ${Ao(t)}
  </div>`}function Mo(e,t){if(!e.state.editingNote)return;let n=t.querySelector(`[data-note-editor]`),r=t.querySelector(`textarea[name="description"]`);n&&r&&(r.value=mo(n.innerHTML));let i=new FormData(t),a=String(i.get(`dtstart`)??``).trim(),o=i.get(`instanceId`),s=o!==null&&String(o)!==``?Number(o):e.state.editingNote.instanceId;e.state.editingNote={...e.state.editingNote,instanceId:Number.isFinite(s)&&s>0?s:e.state.editingNote.instanceId,summary:String(i.get(`summary`)??e.state.editingNote.summary),description:mo(String(i.get(`description`)??e.state.editingNote.description)),dtstart:a?new Date(a).toISOString():null}}async function No(e,t){let n=e.state.notes.filter(t=>t.canWrite&&!t.readOnly&&e.state.checkedNoteKeys.includes(q(t.instanceId,t.uri)));if(n.length===0){e.setFlash(`error`,`No writable notes selected`),e.render();return}let r=n.map(e=>({instanceId:e.instanceId,uri:e.uri}));e.state.busy=!0,e.clearFlash(),e.render();try{let i=await E.bulkNotes({op:t,items:r}),a=new Set(n.map(e=>q(e.instanceId,e.uri)));t===`delete`&&(e.state.checkedNoteKeys=[],e.state.selectedNoteKey&&a.has(e.state.selectedNoteKey)&&(e.state.selectedNoteKey=null,e.state.editingNote=null,e.state.creatingNote=!1,e.state.noteModalOpen=!1)),await so(e),i.failed>0?e.setFlash(`error`,`${t===`copy`?`Copied`:`Deleted`} ${i.ok}, failed ${i.failed}${i.errors[0]?`: ${i.errors[0]}`:``}`):e.setFlash(`success`,t===`copy`?`Copied ${i.ok} note${i.ok===1?``:`s`}`:`Deleted ${i.ok} note${i.ok===1?``:`s`}`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Bulk action failed`)}finally{e.state.busy=!1,e.render()}}async function Po(e,t){let n=t.querySelector(`[data-note-editor]`),r=t.querySelector(`textarea[name="description"]`);n&&r&&(r.value=mo(n.innerHTML));let i=new FormData(t),a=String(i.get(`summary`)??``).trim(),o=mo(String(i.get(`description`)??``).trim()),s=String(i.get(`dtstart`)??``).trim(),c=s?new Date(s).toISOString():null;e.state.editingNote&&(e.state.editingNote={...e.state.editingNote,summary:a,description:o,dtstart:c}),e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingNote){let t=Number(i.get(`instanceId`));if(!Number.isFinite(t)||t<=0)throw Error(`Select a calendar`);let n=await E.createNote({instanceId:t,summary:a,description:o,dtstart:c});e.state.creatingNote=!1,e.state.selectedNoteKey=q(n.note.instanceId,n.note.uri),e.state.editingNote=null,e.state.noteModalOpen=!1,e.setFlash(`success`,An(`Note`,n.note.summary||a,`created`))}else if(e.state.editingNote){let t=await E.updateNote(e.state.editingNote.instanceId,e.state.editingNote.uri,{summary:a,description:o,dtstart:c});e.state.editingNote=null,e.state.noteModalOpen=!1,e.state.selectedNoteKey=q(t.note.instanceId,t.note.uri),e.setFlash(`success`,An(`Note`,t.note.summary||a,`saved`))}await so(e)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function Fo(e,t,n,r){let{state:i,render:a,setFlash:o,clearFlash:s}=e;if(t===`note-fmt`)return r.preventDefault(),ko(n.dataset.cmd||``,n.dataset.value),!0;if(t===`sort-note`){let t=n.dataset.sort||``;if(!t)return!0;i.noteSort===t?i.noteOrder=i.noteOrder===`asc`?`desc`:`asc`:(i.noteSort=t,i.noteOrder=`asc`),i.busy=!0,a();try{await e.loadNotes()}catch(e){o(`error`,e instanceof Error?e.message:`Sort failed`)}finally{i.busy=!1,a()}return!0}if(t===`note-check`){r.stopPropagation();let t=Number(n.dataset.instance),o=n.dataset.uri??``;if(!Number.isFinite(t)||!o)return!0;let s=e.itemKey(t,o),c=i.notes.find(t=>e.itemKey(t.instanceId,t.uri)===s);return!c||c.readOnly||c.canWrite===!1?!0:((n instanceof HTMLInputElement?n.checked:!i.checkedNoteKeys.includes(s))?i.checkedNoteKeys.includes(s)||(i.checkedNoteKeys=[...i.checkedNoteKeys,s]):i.checkedNoteKeys=i.checkedNoteKeys.filter(e=>e!==s),a(),!0)}if(t===`note-select-all`){r.stopPropagation();let t=i.notes.filter(e=>!e.readOnly&&e.canWrite!==!1);return i.checkedNoteKeys=(n instanceof HTMLInputElement?n.checked:t.length>0&&t.length!==i.checkedNoteKeys.length)?t.map(t=>e.itemKey(t.instanceId,t.uri)):[],a(),!0}if(t===`note-clear-selection`)return i.checkedNoteKeys=[],a(),!0;if(t===`note-bulk-copy`)return await No(e.notesHost,`copy`),!0;if(t===`note-bulk-delete`){let t=i.notes.filter(t=>t.canWrite&&!t.readOnly&&i.checkedNoteKeys.includes(e.itemKey(t.instanceId,t.uri))).length;return t===0?(o(`error`,`No writable notes selected`),a(),!0):(i.confirmDelete={scope:`bulk-note`,title:t===1?`Delete note`:`Delete ${t} notes`,message:t===1?`Delete the selected note?`:`Delete ${t} selected notes?`,detail:`CalDAV clients will sync the removal. This cannot be undone.`},a(),!0)}if(t===`select-note`){if(r.target.closest(`[data-stop-row], .row-check`))return!0;let t=Number(n.dataset.instance),o=n.dataset.uri??``;if(!Number.isFinite(t)||!o)return!0;let c=i.notes.find(e=>e.instanceId===t&&e.uri===o)??null;return i.creatingNote=!1,i.selectedNoteKey=e.itemKey(t,o),i.editingNote=c?{...c}:null,i.noteModalOpen=!!c,s(),a(),!0}return t===`new-note`?(i.creatingNote=!0,i.selectedNoteKey=null,i.noteModalOpen=!0,i.editingNote={uri:``,instanceId:i.noteCalendars[0]?.id??0,calendarId:0,calendarName:``,calendarUri:``,summary:``,description:``,dtstart:null,lastmodified:0,readOnly:!1,canWrite:!0},s(),a(),!0):t===`cancel-note`?(i.creatingNote=!1,i.editingNote=null,i.noteModalOpen=!1,a(),!0):t===`delete-note`?!i.editingNote||i.creatingNote?!0:(i.confirmDelete={scope:`note`,title:`Delete note`,message:`Delete “${String(i.editingNote.summary||`this note`).trim()||`this note`}”?`,detail:`CalDAV clients will sync the removal. This cannot be undone.`},a(),!0):!1}async function Io(e){let t=await E.tasks({q:e.state.taskSearch,sort:e.state.taskSort,order:e.state.taskOrder});e.state.tasks=t.tasks,e.state.taskCalendars=t.calendars;let n=new Set(e.state.tasks.map(e=>q(e.instanceId,e.uri)));e.state.checkedTaskKeys=e.state.checkedTaskKeys.filter(e=>n.has(e)),e.state.selectedTaskKey!==null&&!e.state.tasks.some(t=>`${t.instanceId}|${t.uri}`===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.creatingTask||(e.state.editingTask=null,e.state.taskModalOpen=!1))}function Lo(e,t){let n=new Map;for(let e of t)e.uid&&n.set(e.uid,e);let r=new Map(t.map((e,t)=>[q(e.instanceId,e.uri),t])),i=new Map,a=[];for(let e of t){let t=e.parentUid;if(t&&n.has(t)&&t!==e.uid){let n=i.get(t)??[];n.push(e),i.set(t,n)}else a.push(e)}let o=(e,t)=>(r.get(q(e.instanceId,e.uri))??0)-(r.get(q(t.instanceId,t.uri))??0);a.sort(o);for(let[,e]of i)e.sort(o);let s=[],c=new Set,l=(e,t)=>{let n=e.uid||q(e.instanceId,e.uri);if(!c.has(n)){c.add(n),s.push({task:e,depth:Math.min(t,8)});for(let n of i.get(e.uid)??[])l(n,t+1);c.delete(n)}};for(let e of a)l(e,0);for(let e of t)s.some(t=>t.task===e)||s.push({task:e,depth:0});return s}function Ro(e,t){let n=new Set([t]);if(!t)return n;let r=!0;for(;r;){r=!1;for(let t of e.state.tasks)t.parentUid&&n.has(t.parentUid)&&t.uid&&!n.has(t.uid)&&(n.add(t.uid),r=!0)}return n}function zo(e,t){return t?Math.max(0,Ro(e,t).size-1):0}function Bo(t,n,r){let i=n.instanceId,a=r||!n.uid?new Set:Ro(t,n.uid),o=t.state.tasks.filter(e=>e.uid&&e.instanceId===i&&!a.has(e.uid)&&e.uid!==n.uid&&He(e.status)),s=n.parentUid||``,c=[`<option value="">None (top-level)</option>`,...o.map(t=>`<option value="${e(t.uid)}" ${t.uid===s?`selected`:``}>${e(t.summary||t.uid)}</option>`)];if(s&&!o.some(e=>e.uid===s)){let n=t.state.tasks.find(e=>e.uid===s);c.push(`<option value="${e(s)}" selected>${e(n?.summary||s)} (current)</option>`)}return c.join(``)}function Vo(e){let t=new Set(e.state.checkedTaskKeys);return e.state.tasks.filter(e=>t.has(q(e.instanceId,e.uri))&&e.canWrite&&!e.readOnly)}function Ho(t,n,r,i){let a=r.map(([t,r])=>`<option value="${e(t)}" ${t===n?`selected`:``}>${e(r)}</option>`).join(``);return`<select class="task-col-filter" data-action="task-filter" data-col="${t}" aria-label="Filter by ${t}" ${i?`disabled`:``}>${a}</select>`}function Uo(t){let n=e=>({"NEEDS-ACTION":`To do`,"IN-PROCESS":`In progress`,COMPLETED:`Done`,CANCELLED:`Cancelled`})[e]||e,r=ze(t.state.taskFilters),i=We(t.state.tasks,r),a=Lo(t,i),o=i.filter(e=>e.canWrite&&!e.readOnly).map(e=>q(e.instanceId,e.uri)),s=o.length>0&&o.every(e=>t.state.checkedTaskKeys.includes(e)),c=t.state.checkedTaskKeys.length>0&&!s,l=Vo(t).length,u=i.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${t.state.taskSearch?`No tasks match your search.`:t.state.tasks.length>0?`No tasks match these column filters.`:`No tasks yet. Use Add task.`}</td></tr>`:a.map(({task:r,depth:i})=>{let a=q(r.instanceId,r.uri),o=!t.state.creatingTask&&a===t.state.selectedTaskKey?` is-selected`:``,s=t.state.checkedTaskKeys.includes(a),c=r.status===`COMPLETED`?`badge-ok`:r.status===`CANCELLED`?``:`badge-admin`,l=i>0?` style="--task-depth:${i}"`:``,u=i>0?`<span class="task-subtask-marker" aria-hidden="true">↳</span>`:``,d=r.canWrite&&!r.readOnly;return`<tr class="contact-table-row task-row${i>0?` is-subtask`:``}${o}${s?` is-checked`:``}" data-action="select-task" data-instance="${r.instanceId}" data-uri="${e(r.uri)}" tabindex="0" role="button"${l}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${r.instanceId}" data-uri="${e(r.uri)}"
                  ${s?`checked`:``} ${d?``:`disabled`} aria-label="Select ${e(r.summary||r.uri)}" ${t.state.busy?`disabled`:``} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${u}<span class="contact-name-primary">${e(r.summary||r.uri)}</span></span>
                ${r.readOnly?`<span class="badge">read-only</span>`:``}</td>
              <td class="col-task-status"><span class="badge ${c}">${e(n(r.status))}</span></td>
              <td class="col-task-due muted small">${e(Mn(r.due))}</td>
              <td class="col-task-cal muted small">${e(r.calendarName)}</td>
              <td class="col-task-pct muted small">${r.percent?e(String(r.percent))+`%`:`—`}</td>
            </tr>`}).join(``),d=(n,r)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${n}"
      title="${e(r)}" aria-label="${e(r)}" ${t.state.busy||l===0?`disabled`:``}><svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></button>`,f=t.state.checkedTaskKeys.length-l,p=t.state.checkedTaskKeys.length>0,m=lo({searchAction:`task-search`,searchPlaceholder:`Search tasks…`,searchValue:t.state.taskSearch,searchAria:`Search tasks`,busy:t.state.busy,addAction:`new-task`,addLabel:`Add task`,addDisabled:t.state.taskCalendars.length===0,selection:p?{count:l,extra:f>0?`(${f} read-only skipped)`:void 0,clearAction:`bulk-task-clear`,actionsHtml:`<button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${t.state.busy||l===0?`disabled`:``}>Delete</button>`}:null}),h=p?`<div class="task-bulk-fields" role="group" aria-label="Edit selected tasks">
        <div class="bulk-group">
          <label class="bulk-field">Status
            <select id="bulk-task-status" ${t.state.busy||l===0?`disabled`:``}>
              <option value="">—</option>
              <option value="NEEDS-ACTION">To do</option>
              <option value="IN-PROCESS">In progress</option>
              <option value="COMPLETED">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          ${d(`bulk-task-status`,`Apply status`)}
        </div>
        <div class="bulk-group bulk-group-due">
          ${t.renderPortalDateTimeField({field:`bulk-due`,name:`bulkDue`,label:`Due`,value:t.state.bulkDueValue,dateOnly:!1,disabled:t.state.busy||l===0,allowClear:!0})}
          ${d(`bulk-task-due`,`Apply due`)}
          <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${t.state.busy||l===0?`disabled`:``} title="Clear due date">Clear due</button>
        </div>
        <div class="bulk-group">
          <label class="bulk-field bulk-field-pct">%
            <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${t.state.busy||l===0?`disabled`:``} />
          </label>
          ${d(`bulk-task-percent`,`Apply %`)}
        </div>
      </div>`:``,g=Wo(t,n);return`<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      <div class="files-head">
        ${B(`Tasks`,`tasks`,`h1`)}
      </div>
      ${m}
      ${h}
      ${t.state.taskCalendars.length===0?`<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>`:``}
      <div class="contacts-table-wrap contacts-table-wrap-tall items-table-wrap">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-task-check">
                <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                  ${s?`checked`:``}
                  ${c?`data-indeterminate=1`:``}
                  ${i.length===0||t.state.busy?`disabled`:``} />
              </th>
              ${F(`Title`,`summary`,t.state.taskSort,t.state.taskOrder,`task`,`col-task-title`)}
              ${F(`Status`,`status`,t.state.taskSort,t.state.taskOrder,`task`,`col-task-status`)}
              ${F(`Due`,`due`,t.state.taskSort,t.state.taskOrder,`task`,`col-task-due`)}
              ${F(`Calendar`,`calendar`,t.state.taskSort,t.state.taskOrder,`task`,`col-task-cal`)}
              ${F(`%`,`percent`,t.state.taskSort,t.state.taskOrder,`task`,`col-task-pct`)}
            </tr>
            <tr class="task-filter-row">
              <th class="col-task-check"></th>
              <th class="col-task-title"></th>
              <th class="col-task-status">${Ho(`status`,r.status,[[`open`,`Open`],[``,`All`],[`NEEDS-ACTION`,`To do`],[`IN-PROCESS`,`In progress`],[`COMPLETED`,`Done`],[`CANCELLED`,`Cancelled`]],t.state.busy)}</th>
              <th class="col-task-due">${Ho(`due`,r.due,[[``,`All`],[`overdue`,`Overdue`],[`today`,`Today`],[`upcoming`,`Upcoming`],[`none`,`No date`]],t.state.busy)}</th>
              <th class="col-task-cal">${Ho(`calendar`,r.calendar,[[``,`All`],...[...new Set(t.state.tasks.map(e=>e.calendarName).filter(Boolean))].sort((e,t)=>e.localeCompare(t)).map(e=>[e,e])],t.state.busy)}</th>
              <th class="col-task-pct">${Ho(`percent`,r.percent,[[``,`All`],[`0`,`0%`],[`partial`,`1–99%`],[`100`,`100%`]],t.state.busy)}</th>
            </tr>
          </thead>
          <tbody>${u}</tbody>
        </table>
      </div>
      <p class="muted small contacts-main-hint">Select a task to edit, or use <strong>Add task</strong>.</p>
    </section>
    ${g}
  </div>`}function Wo(t,n){if(!t.state.taskModalOpen||!t.state.editingTask)return``;let r=t.state.editingTask,i=t.state.creatingTask,o=!!(r.readOnly&&!i),s=i||r.canWrite,c=t.state.taskCalendars.map(t=>`<option value="${t.id}" ${r.instanceId===t.id?`selected`:``}>${e(t.displayname)}</option>`).join(``),l=i?r.parentUid?`New subtask`:`New task`:`Edit task`,u=[...!i&&r.canWrite?[{label:`Delete`,action:`delete-task`,variant:`danger`,disabled:t.state.busy},{label:`Add subtask`,action:`new-subtask`,variant:`ghost`,disabled:t.state.busy}]:[],{label:i?`Cancel`:`Close`,action:`cancel-task`,variant:`ghost`},...s?[{label:i?`Create task`:`Save task`,type:`submit`,variant:`primary`,disabled:t.state.busy}]:[]];return a({id:`task-edit-modal`,title:l,titleId:`task-modal-title`,closeAction:`cancel-task`,size:`wide`,form:!0,formAttrs:`data-form="task"`,body:`${i?`<label>Calendar
                    <select name="instanceId" required ${t.state.taskCalendars.length===0?`disabled`:``}>
                      <option value="">${t.state.taskCalendars.length?`Select calendar…`:`No writable calendars`}</option>
                      ${c}
                    </select>
                  </label>`:`<p class="muted small">Calendar: <strong>${e(r.calendarName)}</strong>${r.readOnly?` · read-only`:``}</p>`}
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${e(r.summary)}" ${o?`readonly`:``} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${o?`readonly`:``}>${e(r.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${o?`disabled`:``}>
                ${Bo(t,r,i)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${o?`disabled`:``}>
                  ${[`NEEDS-ACTION`,`IN-PROCESS`,`COMPLETED`,`CANCELLED`].map(t=>`<option value="${t}" ${r.status===t?`selected`:``}>${e(n(t))}</option>`).join(``)}
                </select>
              </label>
              ${t.renderPortalDateTimeField({field:`due`,name:`due`,label:`Due`,value:ra(r.due),dateOnly:!1,disabled:o,allowClear:!0})}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${e(String(r.priority||0))}" ${o?`readonly`:``} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${e(String(r.percent||0))}" ${o?`readonly`:``} />
              </label>
            </div>`,footer:u})}function Go(e,t){if(!e.state.editingTask)return;let n=new FormData(t),r=String(n.get(`due`)??``).trim(),i=n.get(`instanceId`),a=i!==null&&String(i)!==``?Number(i):e.state.editingTask.instanceId,o=String(n.get(`parentUid`)??``).trim();e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(a)&&a>0?a:e.state.editingTask.instanceId,summary:String(n.get(`summary`)??e.state.editingTask.summary),description:String(n.get(`description`)??e.state.editingTask.description),status:String(n.get(`status`)??e.state.editingTask.status),due:r?new Date(r).toISOString():null,priority:Number(n.get(`priority`)??e.state.editingTask.priority??0),percent:Number(n.get(`percent`)??e.state.editingTask.percent??0),parentUid:o===``?null:o}}async function Ko(e,t){let n=Vo(e);if(n.length===0){e.setFlash(`error`,`No writable tasks selected`),e.render();return}let r=n.map(e=>({instanceId:e.instanceId,uri:e.uri}));if(t===`bulk-task-delete`){e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.bulkTasks({op:`delete`,items:r});e.state.checkedTaskKeys=[],e.state.selectedTaskKey&&n.some(t=>q(t.instanceId,t.uri)===e.state.selectedTaskKey)&&(e.state.selectedTaskKey=null,e.state.editingTask=null,e.state.creatingTask=!1,e.state.taskModalOpen=!1),await Io(e),t.failed>0?e.setFlash(`error`,`Deleted ${t.ok}, failed ${t.failed}${t.errors[0]?`: ${t.errors[0]}`:``}`):e.setFlash(`success`,`Deleted ${t.ok} task${t.ok===1?``:`s`}`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Bulk delete failed`)}finally{e.state.busy=!1,e.render()}return}let i={};if(t===`bulk-task-status`){let t=e.root.querySelector(`#bulk-task-status`)?.value?.trim()??``;if(!t){e.setFlash(`error`,`Choose a status to apply`),e.render();return}i={status:t}}else if(t===`bulk-task-due`){let t=e.state.bulkDueValue.trim();if(!t){e.setFlash(`error`,`Choose a due date to apply`),e.render();return}let n=/^\d{4}-\d{2}-\d{2}$/.test(t)?new Date(t+`T00:00:00`):new Date((t.length,t));if(Number.isNaN(n.getTime())){e.setFlash(`error`,`Invalid due date`),e.render();return}i={due:n.toISOString()}}else if(t===`bulk-task-clear-due`)i={due:null};else if(t===`bulk-task-percent`){let t=e.root.querySelector(`#bulk-task-percent`)?.value?.trim()??``;if(t===``){e.setFlash(`error`,`Enter a percent complete (0–100)`),e.render();return}let n=Number(t);if(!Number.isFinite(n)||n<0||n>100){e.setFlash(`error`,`Percent must be between 0 and 100`),e.render();return}i={percent:Math.round(n)}}e.state.busy=!0,e.clearFlash(),e.render();try{let n=await E.bulkTasks({op:`update`,items:r,fields:i});if(await Io(e),e.state.editingTask&&!e.state.creatingTask){let t=q(e.state.editingTask.instanceId,e.state.editingTask.uri),n=e.state.tasks.find(e=>q(e.instanceId,e.uri)===t);n&&(e.state.editingTask={...n})}let a=t===`bulk-task-status`?`status`:t===`bulk-task-due`||t===`bulk-task-clear-due`?`due date`:`percent`;n.failed>0?e.setFlash(`error`,`Updated ${a} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:``}`):e.setFlash(`success`,`Updated ${a} on ${n.ok} task${n.ok===1?``:`s`}`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Bulk update failed`)}finally{e.state.busy=!1,e.render()}}async function qo(e,t){let n=new FormData(t),r=String(n.get(`summary`)??``).trim(),i=String(n.get(`description`)??``).trim(),a=String(n.get(`status`)??`NEEDS-ACTION`),o=String(n.get(`due`)??``).trim(),s=o?new Date(o).toISOString():null,c=Number(n.get(`priority`)??0),l=Number(n.get(`percent`)??0),u=String(n.get(`parentUid`)??``).trim(),d=u===``?null:u;if(e.state.editingTask){let t=n.get(`instanceId`),o=t!==null&&String(t)!==``?Number(t):e.state.editingTask.instanceId;e.state.editingTask={...e.state.editingTask,instanceId:Number.isFinite(o)&&o>0?o:e.state.editingTask.instanceId,summary:r,description:i,status:a,due:s,priority:c,percent:l,parentUid:d}}e.state.busy=!0,e.clearFlash(),e.render();try{if(e.state.creatingTask){let t=Number(n.get(`instanceId`));if(!Number.isFinite(t)||t<=0)throw Error(`Select a calendar`);let o=await E.createTask({instanceId:t,summary:r,description:i,status:a,due:s,priority:c,percent:l,parentUid:d});e.state.creatingTask=!1,e.state.selectedTaskKey=q(o.task.instanceId,o.task.uri),e.state.editingTask=null,e.state.taskModalOpen=!1,e.setFlash(`success`,An(d?`Subtask`:`Task`,o.task.summary||r,`created`))}else if(e.state.editingTask){let t=await E.updateTask(e.state.editingTask.instanceId,e.state.editingTask.uri,{summary:r,description:i,status:a,due:s,priority:c,percent:l,parentUid:d});e.state.editingTask=null,e.state.taskModalOpen=!1,e.state.selectedTaskKey=q(t.task.instanceId,t.task.uri),e.setFlash(`success`,An(`Task`,t.task.summary||r,`saved`))}await Io(e)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function Jo(e,t,n,r){let{state:i,render:a,setFlash:o,clearFlash:s}=e;if(t===`sort-task`){let t=n.dataset.sort||``;if(!t)return!0;i.taskSort===t?i.taskOrder=i.taskOrder===`asc`?`desc`:`asc`:(i.taskSort=t,i.taskOrder=t===`due`||t===`summary`?`asc`:`desc`),i.busy=!0,a();try{await e.loadTasks()}catch(e){o(`error`,e instanceof Error?e.message:`Sort failed`)}finally{i.busy=!1,a()}return!0}if(t===`select-task`){if(r.target.closest(`[data-stop-row], .task-check`))return!0;let t=Number(n.dataset.instance),o=n.dataset.uri??``;if(!Number.isFinite(t)||!o)return!0;let c=i.tasks.find(e=>e.instanceId===t&&e.uri===o)??null;return i.creatingTask=!1,i.selectedTaskKey=e.itemKey(t,o),i.editingTask=c?{...c}:null,i.taskModalOpen=!!c,s(),a(),!0}if(t===`task-check`){r.stopPropagation();let t=Number(n.dataset.instance),o=n.dataset.uri??``;if(!Number.isFinite(t)||!o)return!0;let s=e.itemKey(t,o),c=i.tasks.find(t=>e.itemKey(t.instanceId,t.uri)===s);return!c||c.readOnly||c.canWrite===!1?!0:((n instanceof HTMLInputElement?n.checked:!i.checkedTaskKeys.includes(s))?i.checkedTaskKeys.includes(s)||(i.checkedTaskKeys=[...i.checkedTaskKeys,s]):i.checkedTaskKeys=i.checkedTaskKeys.filter(e=>e!==s),a(),!0)}if(t===`task-filter`){if(r.type!==`change`)return!0;let t=n.dataset.col??``,o=n instanceof HTMLSelectElement?n.value:``;if(t===`status`||t===`due`||t===`calendar`||t===`percent`){i.taskFilters={...i.taskFilters,[t]:o};let n=We(i.tasks,i.taskFilters),r=new Set(n.map(t=>e.itemKey(t.instanceId,t.uri)));i.checkedTaskKeys=i.checkedTaskKeys.filter(e=>r.has(e))}return a(),!0}if(t===`task-select-all`){r.stopPropagation();let t=We(i.tasks,i.taskFilters).filter(e=>!e.readOnly&&e.canWrite!==!1);return i.checkedTaskKeys=(n instanceof HTMLInputElement?n.checked:t.length>0&&t.length!==i.checkedTaskKeys.length)?t.map(t=>e.itemKey(t.instanceId,t.uri)):[],a(),!0}if(t===`bulk-task-clear`)return i.checkedTaskKeys=[],a(),!0;if(t===`bulk-task-status`||t===`bulk-task-due`||t===`bulk-task-clear-due`||t===`bulk-task-percent`||t===`bulk-task-delete`){if(t===`bulk-task-delete`){let e=i.checkedTaskKeys.length;return e===0?(o(`error`,`No tasks selected`),a(),!0):(i.confirmDelete={scope:`bulk-task`,title:e===1?`Delete task`:`Delete ${e} tasks`,message:e===1?`Delete the selected task?`:`Delete ${e} selected tasks?`,detail:`CalDAV clients will sync the removal. Subtasks of a selected parent that you did not select stay as top-level tasks. This cannot be undone.`,count:e},a(),!0)}return e.runBulkTaskAction(t),!0}if(t===`new-task`)return i.creatingTask=!0,i.selectedTaskKey=null,i.taskModalOpen=!0,i.editingTask={uri:``,instanceId:i.taskCalendars[0]?.id??0,calendarId:0,calendarName:``,calendarUri:``,uid:``,parentUid:null,summary:``,description:``,status:`NEEDS-ACTION`,due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},s(),a(),!0;if(t===`new-subtask`){if(!i.editingTask||i.creatingTask||!i.editingTask.uid||!i.editingTask.canWrite)return!0;let e=i.editingTask;return i.creatingTask=!0,i.selectedTaskKey=null,i.taskModalOpen=!0,i.editingTask={uri:``,instanceId:e.instanceId,calendarId:e.calendarId,calendarName:e.calendarName,calendarUri:e.calendarUri,uid:``,parentUid:e.uid,summary:``,description:``,status:`NEEDS-ACTION`,due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},s(),a(),!0}if(t===`cancel-task`)return i.creatingTask=!1,i.editingTask=null,i.taskModalOpen=!1,a(),!0;if(t===`delete-task`){if(!i.editingTask||i.creatingTask)return!0;let t=String(i.editingTask.summary||`this task`).trim()||`this task`,n=i.editingTask.uid?zo(e.tasksHost,i.editingTask.uid):0;return i.confirmDelete={scope:`task`,title:`Delete task`,message:`Delete “${t}”?`,detail:n>0?`This task has ${n} subtask${n===1?``:`s`}. “Delete task” keeps them as top-level tasks (RELATED-TO is removed). “Delete with subtasks” removes this task and every nested subtask. This cannot be undone.`:`CalDAV clients will sync the removal. This cannot be undone.`,taskDescendantCount:n},a(),!0}return!1}async function Yo(e,t){let n=await E.contacts(t,e.state.contactSearch);e.state.contacts=n.contacts;let r=new Set(n.contacts.map(e=>e.uri));e.state.checkedContactUris=e.state.checkedContactUris.filter(e=>r.has(e)),e.state.selectedContactUri!==null&&!e.state.contacts.some(t=>t.uri===e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.creatingContact||(e.state.editingContact=null,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1))}async function Xo(e,t){if(e.state.selectedAbId===null)return;let n=await E.getContact(e.state.selectedAbId,t);e.state.selectedContactUri=t,e.state.creatingContact=!1;let r=n.contact;e.state.editingContact={...r,emails:Array.isArray(r.emails)?r.emails:[],phones:Array.isArray(r.phones)?r.phones:[],custom:Array.isArray(r.custom)?r.custom:[],address:r.address??Qo(e),birthday:r.birthday??null},e.state.photoPreview=r.photoDataUri??(r.hasPhoto&&e.state.selectedAbId!==null?`${E.contactPhotoUrl(e.state.selectedAbId,t)}?t=${Date.now()}`:null),e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.contactModalOpen=!0}function Zo(e){e.state.creatingContact=!0,e.state.selectedContactUri=null,e.state.contactModalOpen=!0,e.state.editingContact={uri:``,displayname:``,firstname:``,lastname:``,fullname:``,org:``,title:``,emails:[``],phones:[{type:`cell`,value:``}],address:{street:``,city:``,region:``,postal:``,country:``},birthday:null,url:``,note:``,custom:[],hasPhoto:!1,photoDataUri:null},e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1}function Qo(e){return{street:``,city:``,region:``,postal:``,country:``}}function $o(e,t){return new Promise((e,n)=>{let r=new FileReader;r.onload=()=>{let t=String(r.result??``),n=t.indexOf(`,`);e(n>=0?t.slice(n+1):t)},r.onerror=()=>n(Error(`Failed to read photo file`)),r.readAsDataURL(t)})}async function es(e,t){let n=t.files?.[0];if(t.value=``,n){if(n.size>2621440){e.setFlash(`error`,`Photo is too large (max ~2 MB)`),e.render();return}try{let t=await $o(e,n);e.state.photoBase64Pending=t,e.state.photoPreview=`data:${n.type||`image/jpeg`};base64,${t}`,e.state.removePhotoPending=!1,e.render()}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Failed to read photo`),e.render()}}}async function ts(e,t){if(e.state.selectedAbId===null)return;let n=t.files?.[0];if(t.value=``,!n)return;let r=e.state.selectedAbId;e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.stopImportElapsedTimer(),e.state.importProgress={kind:`contacts`,fileName:n.name,fileSizeLabel:Nn(n.size),phase:`reading`,readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},e.startImportElapsedTimer(),e.render();try{let t=await e.readFileTextWithProgress(n,t=>{if(!e.state.importProgress||e.state.importProgress.phase!==`reading`)return;e.state.importProgress={...e.state.importProgress,readPercent:t};let n=e.root.querySelector(`.import-progress-bar`),r=e.root.querySelector(`[data-import-status-line]`);n&&t!==null&&(n.classList.remove(`is-indeterminate`),n.style.width=`${t}%`),r&&t!==null&&(r.textContent=`Reading file… ${t}%`)});e.setImportPhase(`uploading`,{readPercent:100}),e.setImportPhase(`processing`,{processPercent:0}),S.event(`import.contacts.start`,{file:n.name,bytes:n.size,abId:r});let i=await E.importAddressBook(r,t,t=>{e.applyServerImportProgress(t)}),a=e.formatImportResult(i);await e.loadHome(),e.state.selectedAbId===r&&await Yo(e,r),e.stopImportElapsedTimer(),e.setImportPhase(`done`,{ok:!0,resultMessage:`${a} (from “${n.name}”)`}),e.setFlash(`success`,`Import finished for “${n.name}”: ${a}.`)}catch(t){let n=t instanceof Error?t.message:`Import failed`;e.stopImportElapsedTimer(),e.setImportPhase(`error`,{ok:!1,resultMessage:n}),e.setFlash(`error`,n)}finally{e.state.busy=!1,e.render()}}async function ns(e,t){if(e.state.selectedAbId===null)return;let n=[...e.state.checkedContactUris];if(n.length===0){e.setFlash(`error`,`No contacts selected`),e.render();return}e.state.busy=!0,e.clearFlash(),e.render();try{let r=await E.bulkContacts(e.state.selectedAbId,{op:t,uris:n}),i=new Set(n);t===`delete`&&(e.state.checkedContactUris=[],e.state.selectedContactUri&&i.has(e.state.selectedContactUri)&&(e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactModalOpen=!1)),await Yo(e,e.state.selectedAbId),await e.loadHome(),r.failed>0?e.setFlash(`error`,`${t===`copy`?`Copied`:`Deleted`} ${r.ok}, failed ${r.failed}${r.errors[0]?`: ${r.errors[0]}`:``}`):e.setFlash(`success`,t===`copy`?`Copied ${r.ok} contact${r.ok===1?``:`s`}`:`Deleted ${r.ok} contact${r.ok===1?``:`s`}`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Bulk action failed`)}finally{e.state.busy=!1,e.render()}}async function rs(e,t){if(e.state.selectedAbId===null)return;let n=ao(e,t),r=jn(n);e.state.busy=!0,e.clearFlash(),e.state.contactModalOpen=!0,e.render();try{if(e.state.creatingContact){let t=await E.createContact(e.state.selectedAbId,n);e.state.creatingContact=!1,e.state.selectedContactUri=t.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash(`success`,An(`Contact`,jn(t.contact)||r,`created`))}else if(e.state.selectedContactUri){let t=await E.updateContact(e.state.selectedAbId,e.state.selectedContactUri,n);e.state.selectedContactUri=t.contact.uri,e.state.editingContact=null,e.state.contactModalOpen=!1,e.state.photoPreview=null,e.state.photoBase64Pending=null,e.state.removePhotoPending=!1,e.state.eventDtPicker=null,e.setFlash(`success`,An(`Contact`,jn(t.contact)||r,`saved`))}try{await e.loadHome()}catch(t){if(console.error(t),e.state.selectedAbId!==null)try{await Yo(e,e.state.selectedAbId)}catch{}}}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Save failed`)}finally{e.state.busy=!1,e.render()}}async function is(e,t){let n=new FormData(t),r=String(n.get(`displayname`)??``).trim(),i=String(n.get(`description`)??``).trim();if(r){e.state.busy=!0,e.clearFlash(),e.render();try{let t=await E.createAddressBook({displayname:r,description:i});e.state.selectedAbId=t.addressbook.id,e.state.selectedContactUri=null,e.state.editingContact=null,e.state.creatingContact=!1,e.state.contactSearch=``,await e.loadHome(),e.setFlash(`success`,`Address book “${t.addressbook.displayname}” created`)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Create failed`)}finally{e.state.busy=!1,e.render()}}}async function as(e,t){if(e.state.selectedAbId===null)return;let n=new FormData(t),r=String(n.get(`displayname`)??``).trim(),i=String(n.get(`description`)??``).trim();e.state.abModalOpen=!0,e.state.busy=!0,e.clearFlash(),e.render();try{await E.updateAddressBook(e.state.selectedAbId,{displayname:r,description:i}),await e.loadHome(),e.setFlash(`success`,An(`Address book`,r,`updated`))}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Update failed`)}finally{e.state.busy=!1,e.render()}}function os(t){let{state:n}=t,r=n.addressBooks.map(t=>`<div class="cal-row${t.id===n.selectedAbId?` is-selected`:``}" data-action="select-ab" data-id="${t.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${e(t.displayname)}</span>
          <span class="muted small">${t.cardCount} contact${t.cardCount===1?``:`s`}</span>
          <span class="muted small mono cal-row-uri">${e(t.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${t.id}" ${n.busy?`disabled`:``} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${t.id}" ${n.busy?`disabled`:``}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${t.id}" ${n.busy?`disabled`:``}>Delete</button>
        </span>
      </div>`).join(``),i=n.addressBooks.find(e=>e.id===n.selectedAbId)??null,s=n.checkedContactUris.length,c=n.contacts.length>0&&n.contacts.every(e=>n.checkedContactUris.includes(e.uri)),l=s>0&&!c,u=s>0?co({count:s,busy:n.busy,clearAction:`contact-clear-selection`,actionsHtml:`
            <button type="button" class="btn btn-ghost btn-small" data-action="contact-bulk-copy" ${n.busy?`disabled`:``}>Copy</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="contact-bulk-export" ${n.busy?`disabled`:``}>Export</button>
            <button type="button" class="btn btn-small btn-danger" data-action="contact-bulk-delete" ${n.busy?`disabled`:``}>Delete</button>`}):`<button type="button" class="btn btn-primary" data-action="new-contact" ${n.busy?`disabled`:``}>Add contact</button>`,d=n.contacts.length===0?`<tr class="contacts-empty-row"><td colspan="5" class="muted">${n.contactSearch?`No contacts match your search.`:`No contacts yet. Add one or import a .vcf file.`}</td></tr>`:n.contacts.map(t=>{let r=!n.creatingContact&&t.uri===n.selectedContactUri?` is-selected`:``,i=n.checkedContactUris.includes(t.uri),a=e((t.displayname||`?`).slice(0,1).toUpperCase()),o=t.hasPhoto&&n.selectedAbId!==null?`<img class="contact-avatar" src="${e(E.contactPhotoUrl(n.selectedAbId,t.uri))}" alt="" loading="lazy" data-avatar-fallback="${a}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${a}</span>`;return`<tr class="contact-table-row${r}${i?` is-checked`:``}" data-action="select-contact" data-uri="${e(t.uri)}" tabindex="0" role="button">
              <td class="contact-col-check" data-stop-row>
                <input type="checkbox" class="row-check" data-action="contact-check" data-uri="${e(t.uri)}"
                  ${i?`checked`:``} aria-label="Select ${e(t.displayname||t.uri)}" ${n.busy?`disabled`:``} />
              </td>
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${o}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${e(t.displayname)}</span>
                    ${t.org?`<span class="muted small contact-name-secondary">${e(t.org)}</span>`:``}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${e(t.email||`—`)}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${e(t.phone||`—`)}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${e(t.org||`—`)}</span></td>
            </tr>`}).join(``),f=n.editingContact,p=Array.isArray(f?.emails)&&f.emails.length>0?f.emails:[``],m=Array.isArray(f?.phones)&&f.phones.length>0?f.phones:[{type:`cell`,value:``}],h=f?.address??t.emptyAddress(),g=p.map((t,n)=>`<div class="multi-row" data-multi="email" data-idx="${n}">
        <input type="email" name="email_${n}" value="${e(t??``)}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${n}" ${p.length<=1?`disabled`:``} title="Remove">×</button>
      </div>`).join(``),_=m.map((t,n)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${n}">
        <select name="phone_type_${n}" aria-label="Phone type">
          ${[`cell`,`work`,`home`,`other`].map(e=>`<option value="${e}" ${(t?.type??`other`)===e?`selected`:``}>${e}</option>`).join(``)}
        </select>
        <input type="tel" name="phone_value_${n}" value="${e(t?.value??``)}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${n}" ${m.length<=1?`disabled`:``} title="Remove">×</button>
      </div>`).join(``),v=Array.isArray(f?.custom)?f.custom:[],y=v.length===0?`<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>`:v.map((t,n)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${n}">
              <input type="text" name="custom_label_${n}" value="${e(t.label||``)}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${n}" value="${e(t.value||``)}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${n}" title="Remove">×</button>
            </div>`).join(``),ee=n.contactModalOpen&&f&&i?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
          <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
          <div class="cal-modal-card cal-modal-card-wide">
            <header class="cal-modal-header">
              <h3 id="contact-modal-title">${n.creatingContact?`New contact`:`Edit contact`}</h3>
              <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              <form class="stack" data-form="contact">
                <div class="contact-photo-row">
                  <div class="contact-photo-preview">
                    ${n.photoPreview?`<img src="${e(n.photoPreview)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${e((f.fullname||f.firstname||`?`).slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${n.busy?`aria-disabled=true`:``}>
                      ${n.photoPreview?`Change photo`:`Upload photo`}
                      <input type="file" accept="image/*" data-action="contact-photo" ${n.busy?`disabled`:``} hidden />
                    </label>
                    ${n.photoPreview||f.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${n.busy?`disabled`:``}>Remove photo</button>`:``}
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${e(f.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${e(f.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${e(f.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${e(f.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${e(f.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${g}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${p.length>=10?`disabled`:``}>+ Email</button>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend>Phones</legend>
                    ${_}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${m.length>=10?`disabled`:``}>+ Phone</button>
                  </fieldset>
                </div>
                <fieldset class="fieldset fieldset-address">
                  <legend>Address</legend>
                  <label>Street
                    <input type="text" name="street" value="${e(h.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${e(h.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${e(h.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${e(h.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${e(h.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${e(f.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${t.renderPortalDateTimeField({field:`birthday`,name:`birthday`,label:`Birthday`,value:f.birthday||``,dateOnly:!0,allowClear:!0})}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${y}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${v.length>=30?`disabled`:``}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${e(f.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${n.busy?`disabled`:``}>${n.creatingContact?`Create contact`:`Save contact`}</button>
                  ${!n.creatingContact&&f.uri?`<button type="button" class="btn" data-action="export-contact" ${n.busy?`disabled`:``}>Export .vcf</button>`:``}
                  ${n.creatingContact?``:`<button type="button" class="btn btn-danger" data-action="delete-contact" ${n.busy?`disabled`:``}>Delete</button>`}
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${n.busy?`disabled`:``}>Cancel</button>
                  ${!n.creatingContact&&f.uri?`<span class="muted small mono">${e(f.uri)}</span>`:``}
                </div>
              </form>
            </div>
          </div>
        </div>`:``,b=n.abModalOpen&&i?a({id:`ab-edit-modal`,title:`Address book details`,titleId:`ab-modal-title`,closeAction:`close-ab-modal`,body:`
              <section>
                <p class="muted small mono" style="margin:0">
                  ${e(i.uri)} · ${i.cardCount} contact${i.cardCount===1?``:`s`}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${e(i.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${e(i.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${n.busy?`disabled`:``}>Save changes</button>
                    <span class="muted small mono">${e(i.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${B(`Import / export`,`contact-import-export`)}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${n.busy?`disabled`:``}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${n.busy?`aria-disabled=true`:``}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${n.busy?`disabled`:``} hidden />
                    </label>
                  </div>
                </div>
              </section>`,footer:[{label:`Close`,action:`close-ab-modal`,variant:`ghost`}]}):``,x=n.deleteAbConfirmId===null?null:n.addressBooks.find(e=>e.id===n.deleteAbConfirmId)??null,te=x?a({id:`ab-delete-modal`,title:`Delete address book`,titleId:`ab-delete-title`,closeAction:`cancel-delete-ab`,size:`sm`,body:`
            <p>You are about to permanently delete <strong>${e(x.displayname)}</strong>
              <span class="muted small mono">(${e(x.uri)})</span>.</p>
            <p class="muted small">${(x.cardCount??0)>0?`All ${x.cardCount} contact${x.cardCount===1?``:`s`} in this address book will be removed. This cannot be undone.`:`This address book is empty. This cannot be undone.`}</p>
            ${o({action:`toggle-delete-ab-confirm`,label:`I understand and want to permanently delete this address book`,id:`delete-ab-confirm`,style:`checkbox`})}`,footer:[{label:`Cancel`,action:`cancel-delete-ab`,variant:`ghost`,disabled:n.busy},{label:`Delete permanently`,action:`confirm-delete-ab`,variant:`danger`,disabled:!0,id:`delete-ab-submit`,attrs:`data-id="${x.id}"`}]}):``;return`
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${B(`Address books`,`address-books`)}
          </div>
          <div class="cal-list contacts-ab-list">
            ${r||`<p class="muted">No address books yet. Create one below.</p>`}
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
              <button type="submit" class="btn btn-primary" ${n.busy?`disabled`:``}>Create</button>
            </form>
          </div>
        </section>
      </aside>
      <section class="contacts-main-col">
        ${i?`<div class="card contacts-main-card">
                <div class="contacts-main-head">
                  ${B(`Contacts`,`contacts`)}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${e(n.contactSearch)}" aria-label="Search contacts" ${n.busy?`disabled`:``} />
                    ${u}
                  </div>
                </div>
                <div class="contacts-table-wrap contacts-table-wrap-tall">
                  <table class="contacts-table">
                    <thead>
                      <tr>
                        <th class="contact-col-check">
                          <input type="checkbox" data-action="contact-select-all" aria-label="Select all contacts"
                            ${c?`checked`:``}
                            ${l?`data-indeterminate=1`:``}
                            ${n.busy||n.contacts.length===0?`disabled`:``} />
                        </th>
                        <th class="contact-col-name">Name</th>
                        <th class="contact-col-email">Email</th>
                        <th class="contact-col-phone">Phone</th>
                        <th class="contact-col-org hide-sm">Organization</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${d}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`:`<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>`}
      </section>
    </div>
    ${te}
    ${b}
    ${ee}`}async function ss(e,t,n,r){let{state:i,root:a,render:o,setFlash:s,clearFlash:c}=e;if(t===`select-ab`){let t=Number(n.dataset.id);if(!Number.isFinite(t))return!0;i.selectedAbId=t,i.abModalOpen=!1,i.selectedContactUri=null,i.editingContact=null,i.creatingContact=!1,i.contactModalOpen=!1,i.contactSearch=``,i.contacts=[],i.checkedContactUris=[],i.photoPreview=null,i.photoBase64Pending=null,i.removePhotoPending=!1,c(),i.busy=!0,o();try{await e.loadContacts(t)}catch(e){s(`error`,e instanceof Error?e.message:`Failed to load contacts`)}finally{i.busy=!1,o()}return!0}if(t===`edit-ab`){r.stopPropagation();let t=Number(n.dataset.id);if(!Number.isFinite(t)||!i.addressBooks.find(e=>e.id===t))return!0;let a=i.selectedAbId!==t;i.selectedAbId=t,i.abModalOpen=!0,i.contactModalOpen=!1,c(),a&&(i.selectedContactUri=null,i.editingContact=null,i.creatingContact=!1,i.contactSearch=``,i.contacts=[],i.checkedContactUris=[],i.photoPreview=null,i.photoBase64Pending=null,i.removePhotoPending=!1),i.busy=!0,o();try{a&&await e.loadContacts(t)}catch(e){s(`error`,e instanceof Error?e.message:`Failed to open address book`)}finally{i.busy=!1,o()}return!0}if(t===`close-ab-modal`)return i.abModalOpen=!1,o(),!0;if(t===`contact-check`){r.preventDefault(),r.stopPropagation();let e=n.dataset.uri??``;return!e||(i.checkedContactUris=i.checkedContactUris.includes(e)?i.checkedContactUris.filter(t=>t!==e):[...i.checkedContactUris,e],o(),!0)}if(t===`contact-select-all`)return r.preventDefault(),i.checkedContactUris=i.contacts.length>0&&i.contacts.every(e=>i.checkedContactUris.includes(e.uri))?[]:i.contacts.map(e=>e.uri),o(),!0;if(t===`contact-clear-selection`)return i.checkedContactUris=[],o(),!0;if(t===`contact-bulk-copy`)return await ns(e.contactsHost,`copy`),!0;if(t===`contact-bulk-delete`){let e=i.checkedContactUris.length;return e===0?(s(`error`,`No contacts selected`),o(),!0):(i.confirmDelete={scope:`bulk-contact`,title:e===1?`Delete contact`:`Delete ${e} contacts`,message:e===1?`Delete the selected contact?`:`Delete ${e} selected contacts?`,detail:`CardDAV clients will sync the removal. This cannot be undone.`},o(),!0)}if(t===`contact-bulk-export`){let t=[...i.checkedContactUris];if(i.selectedAbId===null||t.length===0)return s(`error`,`No contacts selected`),o(),!0;i.busy=!0,c(),o();try{let{blob:n,filename:r}=await E.exportContacts(i.selectedAbId,t),a=await e.saveBlobAsFile(n,r);a===`cancelled`?s(`info`,`Export cancelled`):a===`saved`?s(`success`,`Saved ${r}`):s(`success`,`Download started: ${r}`)}catch(e){s(`error`,e instanceof Error?e.message:`Export failed`)}finally{i.busy=!1,o()}return!0}if(t===`select-contact`){if(r.target.closest(`[data-stop-row], .row-check`))return!0;let t=n.dataset.uri??``;if(!t)return!0;c();try{await e.openContact(t)}catch(e){s(`error`,e instanceof Error?e.message:`Failed to load contact`)}return o(),!0}if(t===`new-contact`)return i.selectedAbId===null||(e.startNewContact(),c(),o(),!0);if(t===`cancel-contact`||t===`close-contact-modal`)return i.creatingContact=!1,i.contactModalOpen=!1,i.editingContact=null,i.selectedContactUri=null,i.photoPreview=null,i.photoBase64Pending=null,i.removePhotoPending=!1,i.eventDtPicker=null,c(),o(),!0;if(t===`add-email`||t===`add-phone`||t===`add-custom`)return!i.editingContact||(io(e.contactsHost),Array.isArray(i.editingContact.emails)||(i.editingContact.emails=[``]),Array.isArray(i.editingContact.phones)||(i.editingContact.phones=[{type:`cell`,value:``}]),Array.isArray(i.editingContact.custom)||(i.editingContact.custom=[]),t===`add-email`?i.editingContact.emails.length<10&&i.editingContact.emails.push(``):t===`add-phone`?i.editingContact.phones.length<10&&i.editingContact.phones.push({type:`other`,value:``}):i.editingContact.custom.length<30&&i.editingContact.custom.push({label:``,value:``}),o(),!0);if(t===`remove-email`){if(!i.editingContact)return!0;io(e.contactsHost);let t=Number(n.dataset.idx);if(!Number.isFinite(t))return!0;let r=Array.isArray(i.editingContact.emails)?i.editingContact.emails:[``];return i.editingContact.emails=r.filter((e,n)=>n!==t),i.editingContact.emails.length===0&&(i.editingContact.emails=[``]),o(),!0}if(t===`remove-phone`){if(!i.editingContact)return!0;io(e.contactsHost);let t=Number(n.dataset.idx);if(!Number.isFinite(t))return!0;let r=Array.isArray(i.editingContact.phones)?i.editingContact.phones:[{type:`cell`,value:``}];return i.editingContact.phones=r.filter((e,n)=>n!==t),i.editingContact.phones.length===0&&(i.editingContact.phones=[{type:`cell`,value:``}]),o(),!0}if(t===`remove-custom`){if(!i.editingContact)return!0;io(e.contactsHost);let t=Number(n.dataset.idx);return!Number.isFinite(t)||(i.editingContact.custom=(Array.isArray(i.editingContact.custom)?i.editingContact.custom:[]).filter((e,n)=>n!==t),o(),!0)}if(t===`remove-photo`)return i.photoPreview=null,i.photoBase64Pending=null,i.removePhotoPending=!0,i.editingContact&&(i.editingContact.hasPhoto=!1),o(),!0;if(t===`delete-contact`)return i.selectedAbId===null||!i.selectedContactUri||(i.confirmDelete={scope:`contact`,title:`Delete contact`,message:`Delete “${String(i.editingContact?.fullname||i.editingContact?.displayname||`this contact`).trim()||`this contact`}”?`,detail:`CardDAV clients will sync the removal. This cannot be undone.`},o(),!0);if(t===`delete-ab`){r.stopPropagation();let e=Number(n.dataset.id??i.selectedAbId);return!Number.isFinite(e)||!i.addressBooks.find(t=>t.id===e)||(i.deleteAbConfirmId=e,i.abModalOpen=!1,i.contactModalOpen=!1,c(),o(),!0)}if(t===`cancel-delete-ab`)return i.deleteAbConfirmId=null,o(),!0;if(t===`confirm-delete-ab`){let t=Number(n.dataset.id),r=a.querySelector(`#delete-ab-confirm`);if(!Number.isFinite(t)||!r?.checked)return!0;let l=i.addressBooks.find(e=>e.id===t);if(!l)return!0;let u=(l.cardCount??0)>0;i.busy=!0,c(),o();try{await E.deleteAddressBook(t,u),i.selectedAbId===t&&(i.selectedAbId=null,i.contacts=[],i.editingContact=null,i.selectedContactUri=null,i.creatingContact=!1),i.deleteAbConfirmId=null,i.abModalOpen=!1,i.contactModalOpen=!1,await e.loadHome(),i.selectedAbId===null&&i.addressBooks.length>0&&(i.selectedAbId=i.addressBooks[0].id,await e.loadContacts(i.selectedAbId)),s(`success`,`Address book deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,o()}return!0}if(t===`export-ab`){r.stopPropagation();let t=n.dataset.id,a=t!==void 0&&t!==``?Number(t):i.selectedAbId;if(a===null||Number.isNaN(a))return!0;i.busy=!0,c(),o();try{let{blob:t,filename:n}=await E.exportAddressBook(a),r=await e.saveBlobAsFile(t,n);r===`cancelled`?s(`info`,`Export cancelled`):r===`saved`?s(`success`,`Saved ${n}`):s(`success`,`Download started: ${n}`)}catch(e){s(`error`,e instanceof Error?e.message:`Export failed`)}finally{i.busy=!1,o()}return!0}if(t===`export-contact`){if(i.selectedAbId===null||!i.selectedContactUri||i.creatingContact)return!0;i.contactModalOpen=!0,i.busy=!0,c(),o();try{let{blob:t,filename:n}=await E.exportContact(i.selectedAbId,i.selectedContactUri),r=await e.saveBlobAsFile(t,n);r===`cancelled`?s(`info`,`Export cancelled`):r===`saved`?s(`success`,`Saved ${n}`):s(`success`,`Download started: ${n}`)}catch(e){s(`error`,e instanceof Error?e.message:`Export failed`)}finally{i.busy=!1,o()}return!0}return!1}function cs(e){return e===`calendars`||e===`contacts`||e===`tasks`||e===`notes`||e===`files`||e===`admin`?e:null}function ls(e){return e===`overview`||e===`users`||e===`settings`||e===`database`||e===`configuration`?e:null}function us(){let e=(typeof location<`u`?location.hash:``).replace(/^#/,``).split(/[?&]/)[0].replace(/^\/+/,``);if(!e)return{tab:null,adminPage:null,adminUsername:null};if(e===`admin`||e.startsWith(`admin/`)){let t=e.split(`/`).filter(Boolean),n=ls(t[1]??`overview`)??`overview`,r=null;if(n===`users`&&t[2])try{r=decodeURIComponent(t[2])}catch{r=t[2]}return{tab:`admin`,adminPage:n,adminUsername:r}}return{tab:cs(e),adminPage:null,adminUsername:null}}function ds(){let e=us().tab;if(e)return e;try{let e=cs(sessionStorage.getItem(ke));if(e)return e}catch{}return`calendars`}function fs(){let e=us().adminPage;if(e)return e;try{let e=ls(sessionStorage.getItem(Ae));if(e)return e}catch{}return`overview`}function ps(e,t=null){return e===`overview`?`#admin`:e===`users`&&t?`#admin/users/${encodeURIComponent(t)}`:`#admin/${e}`}function ms(e,t=`overview`,n=null){try{sessionStorage.setItem(ke,e),e===`admin`&&sessionStorage.setItem(Ae,t)}catch{}if(typeof history>`u`||typeof location>`u`)return;let r=e===`admin`?ps(t,n):`#${e}`;location.hash!==r&&history.replaceState(null,``,`${location.pathname}${location.search}${r}`)}function hs(t){return t===`readwrite`?`<span class="badge badge-admin">full access</span>`:t===`read`?`<span class="badge">read-only</span>`:t===`owner`?`<span class="badge badge-ok">owner</span>`:`<span class="badge">${e(t)}</span>`}function gs(e){let t=[`${e.imported} new`,`${e.updated} updated`];return e.skipped>0&&t.push(`${e.skipped} skipped`),t.join(`, `)}function _s(t){let n=t.confirmDelete;if(!n)return``;let r=n.detail?`<p class="muted small" style="margin:0.75rem 0 0">${e(n.detail)}</p>`:``,i=(n.taskDescendantCount??0)>0?[{label:`Cancel`,action:`confirm-delete-cancel`,variant:`ghost`,disabled:t.busy},{label:`Delete task`,action:`confirm-delete-ok`,variant:`danger`,disabled:t.busy},{label:`Delete with subtasks`,action:`confirm-delete-cascade`,variant:`danger`,disabled:t.busy}]:[{label:`Cancel`,action:`confirm-delete-cancel`,variant:`ghost`,disabled:t.busy},{label:`Delete`,action:`confirm-delete-ok`,variant:`danger`,disabled:t.busy}];return a({id:`portal-confirm-delete-modal`,title:n.title,titleId:`portal-confirm-delete-title`,closeAction:`confirm-delete-cancel`,size:`sm`,body:`<p style="margin:0">${e(n.message)}</p>${r}`,footer:i})}function vs(e){e.confirmDelete=null}var ys=`portal-page`,bs=`portal-overlays`;function xs(e){let t=e.querySelector(`#${ys}`),n=e.querySelector(`#${bs}`);return(!t||!n)&&(e.replaceChildren(),t=document.createElement(`div`),t.id=ys,n=document.createElement(`div`),n.id=bs,e.append(t,n)),{page:t,overlays:n}}function Ss(e){let t=e.filesPreview,n=t?[t.path,t.status,t.kind,t.objectUrl??``,t.truncated?`1`:`0`,String((t.text??``).length),t.error??``].join(`|`):``,r=e.filesUploadProgress,i=r?[r.phase,r.completedFiles,r.failedFiles,r.bytesSent,r.currentName].join(`|`):``,a=e.importProgress;return`p:${n};u:${i};i:${a?[a.phase,a.readPercent??``,a.processPercent??``,a.processCurrent,a.ok??``].join(`|`):``};c:${e.confirmDelete?e.confirmDelete.scope:``}`}function Cs(e){return`${Or()}
      ${_s(e.state)}
      ${Ka(e.calendarsHost)}
      ${pr(e.filesHost)}
      ${or(e.filesHost)}`}function ws(e,t,n){e.dataset.overlayKey===n&&e.childElementCount>0||(e.dataset.overlayKey=n,e.innerHTML=t)}function Ts(e,t,n){if(!k(e,t))return``;let r=e.activeTab===t;return`<button type="button" role="tab" class="tab-btn${r?` is-active`:``}"
            data-action="tab" data-tab="${t}" aria-selected="${r}">
            ${n}
          </button>`}function Es(e){let{state:t,root:n}=e;if(!t.user){e.renderLogin();return}let r;switch(t.activeTab){case`calendars`:r=k(t,`calendars`)?ro(e):Ds(`Calendar`,`CalDAV`);break;case`contacts`:r=k(t,`contacts`)?os(e):Ds(`Contacts`,`CardDAV`);break;case`tasks`:r=k(t,`tasks`)?Uo(e.tasksHost):Ds(`Tasks`,`Tasks (VTODO)`);break;case`notes`:r=k(t,`notes`)?jo(e.notesHost):Ds(`Notes`,`Notes (VJOURNAL)`);break;case`files`:r=k(t,`files`)?Fr(e.filesHost):Ds(`Files`,`WebDAV file storage`);break;case`admin`:r=Pi(e.adminHost);break;default:r=ro(e)}let i=t.activeTab===`calendars`?`my-calendars`:t.activeTab===`contacts`?`my-contacts`:t.activeTab===`tasks`?`tasks`:t.activeTab===`notes`?`notes`:t.activeTab===`files`?`files`:`administration`,a=t.activeTab===`admin`?`<div class="tabs" role="tablist" aria-label="Administration sections">
          ${e.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${t.adminPage===`overview`?`admin-overview`:t.adminPage===`users`?`admin-users`:t.adminPage===`settings`?`admin-settings`:`admin-database`}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`:`<div class="tabs" role="tablist" aria-label="Portal sections">
          ${Ts(t,`calendars`,`Calendar`)}
          ${Ts(t,`contacts`,`Contacts`)}
          ${Ts(t,`tasks`,`Tasks`)}
          ${Ts(t,`notes`,`Notes`)}
          ${Ts(t,`files`,`Files`)}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${i}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`,{page:o,overlays:s}=xs(n);o.innerHTML=e.shell(r,{tabs:a}),ws(s,Cs(e),Ss(t)),document.body.classList.toggle(`cal-modal-open`,t.calModalOpen||t.createCalModalOpen||t.deleteConfirmId!==null||t.deleteAbConfirmId!==null||t.eventModalOpen||t.contactModalOpen||t.noteModalOpen||t.taskModalOpen||t.abModalOpen||t.importProgress!==null||t.filesUploadProgress!==null||t.filesRenamePath!==null||t.filesDeletePaths!==null||t.filesTransfer!==null||t.filesMkdirOpen||t.filesPreview!==null||t.filesUploadConflict!==null||t.confirmDelete!==null||t.adminUserCreateOpen||t.adminUserEditOpen||t.adminUserDeleteUsername!==null||t.adminResetModalOpen||t.adminDbConfirmOpen||t.adminCalModal!==null||t.adminAbModal!==null||t.adminResourceDelete!==null),document.body.classList.toggle(`layout-contacts`,t.activeTab===`contacts`),document.body.classList.toggle(`layout-calendars`,t.activeTab===`calendars`),document.body.classList.toggle(`layout-tasks`,t.activeTab===`tasks`||t.activeTab===`notes`),document.body.classList.toggle(`layout-files`,t.activeTab===`files`),document.body.classList.toggle(`layout-admin`,t.activeTab===`admin`)}function Ds(e,t){return`<div class="panel empty-panel">
    <h2>${e}</h2>
    <p class="muted">${e} is disabled in system settings (Enable ${t}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`}function Os(e){let{state:t,render:n}=e;e.unbindUserMenuOutside(),t.userMenuOpen&&e.bindUserMenuOutside(),Yt(t),t.eventDtPicker&&Xt(t,n),e.unbindFilesUploadMenuOutside(),t.filesUploadMenuOpen&&e.bindFilesUploadMenuOutside(),zr(e.filesHost),e.root.querySelectorAll(`input[data-indeterminate="1"]`).forEach(e=>{e.indeterminate=!0}),_o(e.notesHost),e.bindHolidaysToggle(),Ps(e),Ns(e.root),Ms(e),ks(e),As(e),js(e)}function ks(e){if(!e.state.weekScrollToDayStart||e.state.calView!==`week`||!Da(e.root,e.state.userSettings.dayStartHour))return;let t=e.root.querySelector(`.week-wrap`);t&&(e.state.weekWrapScrollTop=t.scrollTop),e.state.busy||(e.state.weekScrollToDayStart=!1)}function As(e){if(e.state.weekScrollToDayStart||e.state.calView!==`week`)return;let t=e.root.querySelector(`.week-wrap`);!t||e.state.weekWrapScrollTop===null||(t.scrollTop=e.state.weekWrapScrollTop)}function js(e){let t=e.root.querySelector(`.week-wrap`);t&&t.addEventListener(`scroll`,()=>{e.state.weekWrapScrollTop=t.scrollTop},{passive:!0})}function Ms(e){let{state:t,root:n}=e,r=t.filesSearchFocus&&t.activeTab===`files`?`input[data-action="files-search"]`:t.eventSearchFocus&&t.activeTab===`calendars`?`input[data-action="event-search"]`:null;if(!r)return;let i=n.querySelector(r);if(!i)return;i.focus({preventScroll:!0});let a=i.value.length;try{i.setSelectionRange(a,a)}catch{}t.filesSearchFocus=!1,t.eventSearchFocus=!1}function Ns(e){let t=e.querySelector(`.cal-modal[data-focus-trap]`);if(!t)return;let n=document.activeElement;if(n&&t.contains(n))return;let r=e.querySelector(`#portal-page`);n&&r?.contains(n)||t.querySelector(`button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])`)?.focus()}function Ps(e){let{state:t,root:n}=e;if(!t.listKeyboardFocus||t.contactModalOpen||t.noteModalOpen||t.taskModalOpen||t.activeTab!==`contacts`&&t.activeTab!==`tasks`&&t.activeTab!==`notes`)return;let r=document.activeElement;if(r&&n.contains(r)&&r.matches(`input:not([type=checkbox]), textarea, select, [contenteditable='true']`)&&!r.closest(`tr.contact-table-row[data-action]`)||r?.closest?.(`tr.contact-table-row[data-action]`))return;let i=null;if(t.activeTab===`contacts`&&t.selectedContactUri)i=n.querySelector(`tr[data-action="select-contact"][data-uri="${CSS.escape(t.selectedContactUri)}"]`);else if(t.activeTab===`tasks`&&t.selectedTaskKey){let e=t.selectedTaskKey.indexOf(`|`);if(e>0){let r=t.selectedTaskKey.slice(0,e),a=t.selectedTaskKey.slice(e+1);i=n.querySelector(`tr[data-action="select-task"][data-instance="${CSS.escape(r)}"][data-uri="${CSS.escape(a)}"]`)}}else if(t.activeTab===`notes`&&t.selectedNoteKey){let e=t.selectedNoteKey.indexOf(`|`);if(e>0){let r=t.selectedNoteKey.slice(0,e),a=t.selectedNoteKey.slice(e+1);i=n.querySelector(`tr[data-action="select-note"][data-instance="${CSS.escape(r)}"][data-uri="${CSS.escape(a)}"]`)}}if(!i){let e=t.activeTab===`contacts`?`select-contact`:t.activeTab===`tasks`?`select-task`:`select-note`;i=n.querySelector(`tr.contact-table-row[data-action="${e}"]`)}i&&i.focus({preventScroll:!0})}async function Fs(e,t,n,r){let{state:i,render:a,clearFlash:o,setFlash:s}=e;if(t===`confirm-delete-cancel`)return vs(i),a(),!0;if(t===`confirm-delete-ok`||t===`confirm-delete-cascade`){let n=i.confirmDelete;if(!n)return a(),!0;let r=n.scope,c=t===`confirm-delete-cascade`;if(vs(i),r===`event`){if(!i.editingEvent||!i.editingEvent.canWrite||i.creatingEvent)return a(),!0;let t=i.editingEvent.instanceId,n=i.editingEvent.uri;i.busy=!0,o(),a();try{await E.deleteEvent(t,n),i.eventModalOpen=!1,i.editingEvent=null,await e.loadMonthEvents(),s(`success`,`Event deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,a()}return!0}if(r===`task`){if(!i.editingTask||i.creatingTask)return a(),!0;i.busy=!0,o(),a();try{await E.deleteTask(i.editingTask.instanceId,i.editingTask.uri,{cascade:c}),i.selectedTaskKey=null,i.editingTask=null,i.creatingTask=!1,i.taskModalOpen=!1,await e.loadTasks(),s(`success`,c?`Task and subtasks deleted`:`Task deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,a()}return!0}if(r===`note`){if(!i.editingNote||i.creatingNote)return a(),!0;i.busy=!0,o(),a();try{await E.deleteNote(i.editingNote.instanceId,i.editingNote.uri),i.selectedNoteKey=null,i.editingNote=null,i.creatingNote=!1,i.noteModalOpen=!1,await e.loadNotes(),s(`success`,`Note deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,a()}return!0}if(r===`contact`){if(i.selectedAbId===null||!i.selectedContactUri)return a(),!0;i.busy=!0,o(),i.contactModalOpen=!0,a();try{await E.deleteContact(i.selectedAbId,i.selectedContactUri),i.selectedContactUri=null,i.editingContact=null,i.creatingContact=!1,i.contactModalOpen=!1,i.eventDtPicker=null,i.photoPreview=null,await e.loadHome(),s(`success`,`Contact deleted`)}catch(e){s(`error`,e instanceof Error?e.message:`Delete failed`)}finally{i.busy=!1,a()}return!0}if(r===`bulk-task`)return await e.runBulkTaskAction(`bulk-task-delete`),!0;if(r===`bulk-note`)return await No(e.notesHost,`delete`),!0;if(r===`bulk-contact`)return await ns(e.contactsHost,`delete`),!0;if(r===`revoke-share`){let t=n.href??``;if(!t||i.selectedId===null)return a(),!0;i.calModalOpen=!0,i.busy=!0,o(),a();try{await E.revoke(i.selectedId,t),await e.loadShares(i.selectedId),s(`success`,`Share revoked`)}catch(e){s(`error`,e instanceof Error?e.message:`Revoke failed`)}finally{i.busy=!1,a()}return!0}return a(),!0}if(t===`close-import-progress`)return i.importProgress&&(i.importProgress.phase===`done`||i.importProgress.phase===`error`)&&e.closeImportProgress(),!0;if(t===`logout`){i.busy=!0,S.event(`logout`);try{await E.logout()}catch{}return e.clearPortalSessionState(),o(),a(),!0}if(t===`info`){let t=n.dataset.info??``;return e.openInfoModal(t),!0}if(t===`info-close`)return e.closeInfoModal(),!0;if(t===`about-open`)return r.preventDefault(),Ut(e.root),!0;if(t===`about-close`)return r.preventDefault(),Wt(e.root),!0;if(t===`flash-close`)return o(),a(),!0;if(t===`user-settings-open`)return i.userMenuOpen=!1,i.userSettingsOpen=!0,i.userSettingsError=null,a(),!0;if(t===`user-settings-close`)return re(i),a(),!0;if(t===`set-theme`){let e=c(n.dataset.theme);if(e){if(f(e),i.userSettingsOpen)return!0;a()}return!0}if(t===`user-menu-toggle`)return r.stopPropagation(),i.userMenuOpen=!i.userMenuOpen,a(),!0;if(t===`user-menu-close`)return i.userMenuOpen&&(i.userMenuOpen=!1,a()),!0;if(t===`tab`){let t=cs(n.dataset.tab);return t&&(t===`admin`&&(i.adminPage=`overview`),await e.activateTab(t)),!0}return!1}async function Is(e,t){let n=t.target.closest(`[data-action]`);if(!n)return;let r=n.dataset.action;r&&(S.debug(`action:${r}`,{id:n.dataset.id,tab:n.dataset.tab,uri:n.dataset.uri}),!await Fs(e,r,n,t)&&(r.startsWith(`admin-`)&&await Ii(e.adminHost,r,n,t)||(r.startsWith(`files-`)||r===`sort-file`||r===`close-files-upload-progress`)&&await Rr(e.filesHost,r,n,t)||await oo(e,r,n,t)||await Jo(e,r,n,t)||await Fo(e,r,n,t)||await ss(e,r,n,t)))}var Ls=new WeakMap;function Rs(e){if(Ls.has(e.root)){S.debug(`portalEvents: already bound for root`);return}Ls.set(e.root,!0),e.state.portalEventsBound=!0,e.state.escapeBound=!0;let{root:t}=e;t.addEventListener(`click`,t=>zs(e,t)),t.addEventListener(`contextmenu`,t=>Bs(e,t)),t.addEventListener(`submit`,t=>Vs(e,t)),t.addEventListener(`change`,t=>Hs(e,t)),t.addEventListener(`input`,t=>Us(e,t)),t.addEventListener(`keydown`,t=>Js(e,t)),document.addEventListener(`keydown`,t=>tc(e,t)),t.addEventListener(`dragenter`,t=>Ys(e,`enter`,t)),t.addEventListener(`dragover`,t=>Ys(e,`over`,t)),t.addEventListener(`dragleave`,t=>Ys(e,`leave`,t)),t.addEventListener(`drop`,t=>Ys(e,`drop`,t)),t.addEventListener(`error`,t=>Qs(e,t),!0),S.event(`portalEvents.registered`)}function zs(e,t){let n=t.target?.closest?.(`[data-action]`);if(!n||!e.root.contains(n))return;let r=n.dataset.action??``;(r===`info`||r===`info-close`||r===`about-open`||r===`about-close`||r===`user-settings-open`||r===`user-settings-close`)&&(t.preventDefault(),t.stopPropagation()),(r===`dt-set-month`||r===`dt-set-year`)&&t.stopPropagation(),(r===`select-contact`||r===`select-task`||r===`select-note`)&&(e.state.listKeyboardFocus=!0),S.debug(`portalEvents.click`,{action:r}),Is(e,t)}function Bs(e,t){let n=t.target;if(!n||!e.root.contains(n))return;if(n.closest(`#files-item-menu`)){t.preventDefault();return}let r=n.closest(`tr.files-row`);if(!r||!e.root.contains(r))return;let i=r.dataset.path??``;!i||$t(e.state)||(t.preventDefault(),en(e.filesHost,i,{x:t.clientX,y:t.clientY,origin:`context`}))}function Vs(e,t){let n=t.target?.closest?.(`form[data-form]`);if(!n||!e.root.contains(n))return;let r=n.dataset.form??``;if(r)switch(t.preventDefault(),S.debug(`portalEvents.submit`,{form:r}),r){case`login`:e.onLogin(n);return;case`share`:e.onShare(n);return;case`edit-event`:e.onSaveEvent(n);return;case`edit-cal`:e.onEditCal(n);return;case`create-cal`:e.onCreateCal(n);return;case`contact`:e.onSaveContact(n);return;case`create-ab`:e.onCreateAb(n);return;case`edit-ab`:e.onEditAb(n);return;case`task`:e.onSaveTask(n);return;case`note`:e.onSaveNote(n);return;case`files-rename`:Ir(e.filesHost,n);return;case`files-transfer`:mn(e.filesHost,n);return;case`files-mkdir`:Lr(e.filesHost,n);return;case`admin-user-create`:si(e.adminHost,n);return;case`admin-user-edit`:ci(e.adminHost,n);return;case`admin-cal`:li(e.adminHost,n);return;case`admin-ab`:ui(e.adminHost,n);return;case`admin-settings`:vi(e.adminHost,n);return;case`admin-database`:ki(e.adminHost,n);return;case`user-settings`:{let t=ne(n);if(`error`in t){e.state.userSettingsError=t.error,e.render();return}ee(t,e.state.user?.username??null),e.state.userSettings=t,e.state.userSettingsOpen=!1,e.state.userSettingsError=null,e.state.calView===`week`&&(e.state.weekScrollToDayStart=!0),f(t.theme),e.clearFlash(),e.render();return}default:S.debug(`portalEvents.submit.unknown`,{form:r})}}function Hs(e,t){let n=t.target;if(!n||!e.root.contains(n))return;let{state:r,root:i,render:a}=e,o=n.closest(`[data-action]`)?.dataset.action??``;if(o===`dt-set-month`||o===`dt-set-year`){t.stopPropagation(),S.debug(`portalEvents.change`,{action:o}),Is(e,t);return}if(o===`admin-db-backend`&&n instanceof HTMLSelectElement){r.adminDbFormBackend=n.value===`pgsql`?`pgsql`:`sqlite`,a();return}if(o===`admin-restore-file`&&n instanceof HTMLInputElement){let t=n.files?.[0]??null;n.value=``,t&&Ti(e.adminHost,t);return}if(o===`files-upload-pick-files`&&n instanceof HTMLInputElement){Er(e.filesHost,n,!1);return}if(o===`files-upload-pick-folder`&&n instanceof HTMLInputElement){Er(e.filesHost,n,!0);return}if(o===`files-type-filter`){S.debug(`portalEvents.change`,{action:o}),Is(e,t);return}if(o===`task-filter`){t.stopPropagation(),S.debug(`portalEvents.change`,{action:o}),Is(e,t);return}if(o===`import-cal`&&n instanceof HTMLInputElement){Ja(e.calendarsHost,n);return}if(o===`import-create-cal`&&n instanceof HTMLInputElement){Ya(e.calendarsHost,n);return}if(o===`import-ab`&&n instanceof HTMLInputElement){e.calendarsHost.onImportContacts(n);return}if(o===`contact-photo`&&n instanceof HTMLInputElement){es(e.contactsHost,n);return}if(n instanceof HTMLInputElement&&n.id===`delete-cal-confirm`){let e=i.querySelector(`#delete-cal-submit`);e&&(e.disabled=!n.checked||r.busy);return}if(n instanceof HTMLInputElement&&n.id===`delete-ab-confirm`){let e=i.querySelector(`#delete-ab-submit`);e&&(e.disabled=!n.checked||r.busy);return}if(n instanceof HTMLSelectElement&&(n.name===`repeatFreq`||n.name===`repeatEndMode`)){let e=n.closest(`[data-form="edit-event"]`);if(e&&r.editingEvent){let t=new FormData(e);r.editingEvent={...r.editingEvent,repeat:Fa(t),hasRrule:!!String(t.get(`repeatFreq`)??``).trim()},a()}return}if(n instanceof HTMLSelectElement&&n.name===`instanceId`){let t=n.closest(`[data-form="task"]`);if(t&&r.creatingTask&&r.editingTask){let i=Number(n.value);if(!Number.isFinite(i)||i<=0)return;e.syncEditingTaskFromForm(t);let o=r.editingTask.parentUid;r.editingTask={...r.editingTask,instanceId:i,parentUid:o&&r.tasks.some(e=>e.uid===o&&e.instanceId===i)?o:null},a();return}let i=n.closest(`[data-form="note"]`);if(i&&r.creatingNote&&r.editingNote){let t=Number(n.value);if(!Number.isFinite(t)||t<=0)return;e.syncEditingNoteFromForm(i),r.editingNote={...r.editingNote,instanceId:t},a();return}}if(n instanceof HTMLInputElement&&n.name===`holidays`&&n.closest(`[data-form="create-cal"]`)){to(e.calendarsHost);return}if(n instanceof HTMLInputElement&&n.name===`color`){let e=n.closest(`form`)?.querySelector(`input[name="color_picker"]`);if(e){let t=n.value.trim();t&&!t.startsWith(`#`)&&(t=`#${t}`),/^#[0-9A-Fa-f]{6}/.test(t)&&(e.value=t.slice(0,7),n.value=t.toUpperCase())}return}}function Us(e,t){let n=t.target;if(!n||!e.root.contains(n))return;let{state:r,root:i,render:a,setFlash:o}=e;if(n instanceof HTMLInputElement&&n.name===`color_picker`){let e=n.closest(`form`)?.querySelector(`input[name="color"]`);e&&(e.value=n.value.toUpperCase());return}let s=n.closest(`[data-action]`)?.dataset.action??``;if(s===`contact-search`&&n instanceof HTMLInputElement){r.listKeyboardFocus=!1,r.searchTimer&&clearTimeout(r.searchTimer);let t=n.value;r.searchTimer=setTimeout(()=>{r.contactSearch=t,(async()=>{try{r.selectedAbId!==null&&await e.loadContacts(r.selectedAbId),a()}catch(e){o(`error`,e instanceof Error?e.message:`Search failed`),a()}})()},250);return}if(s===`task-search`&&n instanceof HTMLInputElement){r.listKeyboardFocus=!1,r.searchTimer&&clearTimeout(r.searchTimer);let t=n.value;r.searchTimer=setTimeout(()=>{r.taskSearch=t,(async()=>{try{await e.loadTasks(),a()}catch(e){o(`error`,e instanceof Error?e.message:`Search failed`),a()}})()},250);return}if(s===`files-search`&&n instanceof HTMLInputElement){r.searchTimer&&clearTimeout(r.searchTimer);let e=n.value;r.searchTimer=setTimeout(()=>{r.filesSearch=e,r.filesSearchFocus=!0,a()},150);return}if(s===`event-search`&&n instanceof HTMLInputElement){r.searchTimer&&clearTimeout(r.searchTimer);let e=n.value;r.searchTimer=setTimeout(()=>{r.eventSearch=e,r.eventSearchFocus=!0,a()},150);return}if(s===`note-search`&&n instanceof HTMLInputElement){r.listKeyboardFocus=!1,r.searchTimer&&clearTimeout(r.searchTimer);let t=n.value;r.searchTimer=setTimeout(()=>{r.noteSearch=t,(async()=>{try{await e.loadNotes(),a()}catch(e){o(`error`,e instanceof Error?e.message:`Search failed`),a()}})()},250);return}if(s===`admin-db-confirm-input`&&n instanceof HTMLInputElement){r.adminDbConfirmText=n.value;let e=i.querySelector(`[data-action="admin-db-confirm-save"]`);e&&(e.disabled=r.busy||r.adminDbConfirmText.trim()!==`CONFIRM`);return}if(s===`admin-reset-password`&&n instanceof HTMLInputElement){r.adminResetPassword=n.value;let e=i.querySelector(`[data-action="admin-reset-confirm"]`);e&&(e.disabled=r.busy||!r.adminResetConfirmChecked||r.adminResetPassword.trim()===``);return}}var Ws=`tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]`,Gs=`tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]`;function Ks(e){let{state:t,root:n}=e,r=``;if(t.activeTab===`contacts`)r=`select-contact`;else if(t.activeTab===`tasks`)r=`select-task`;else if(t.activeTab===`notes`)r=`select-note`;else return[];return Array.from(n.querySelectorAll(`tr.contact-table-row[data-action="${r}"]`))}function qs(e){e.focus({preventScroll:!1}),e.scrollIntoView({block:`nearest`})}function Js(e,t){let n=t.target;if(!n||!e.root.contains(n))return;if((t.key===`ContextMenu`||t.key===`F10`&&t.shiftKey)&&e.state.activeTab===`files`){let r=n.closest(`tr.files-row`);if(r&&e.root.contains(r)){let n=r.dataset.path??``;if(n){t.preventDefault();let i=(r.querySelector(`.files-row-menu-btn`)??r).getBoundingClientRect();en(e.filesHost,n,{x:i.right,y:i.bottom+4,origin:`button`});return}}}let r=e.state.activeTab,i=!(e.state.contactModalOpen||e.state.noteModalOpen||e.state.taskModalOpen||e.state.eventModalOpen)&&(r===`contacts`||r===`tasks`||r===`notes`),a=n instanceof HTMLInputElement&&(n.dataset.action===`contact-search`||n.dataset.action===`task-search`||n.dataset.action===`note-search`);if(!a&&n.closest(`button, a, input, select, textarea, [contenteditable=true]`)&&!n.matches(Gs)&&!n.matches(Ws))return;if(i&&(t.key===`ArrowDown`||t.key===`ArrowUp`||t.key===`Home`||t.key===`End`)){let r=Ks(e);if(r.length===0)return;let i=n.closest(Ws);if(e.state.listKeyboardFocus=!0,t.preventDefault(),!i||a){t.key===`ArrowDown`||t.key===`Home`?qs(r[0]):qs(r[r.length-1]);return}let o=r.indexOf(i);if(o<0)return;if(t.key===`Home`){qs(r[0]);return}if(t.key===`End`){qs(r[r.length-1]);return}let s=t.key===`ArrowDown`?r[o+1]:r[o-1];s&&qs(s);return}if(t.key!==`Enter`&&t.key!==` `)return;let o=n.closest(Gs);!o||!e.root.contains(o)||t.target!==o&&t.target.closest(`button, a, input, select, textarea`)||(t.preventDefault(),(o.dataset.action===`select-contact`||o.dataset.action===`select-task`||o.dataset.action===`select-note`)&&(e.state.listKeyboardFocus=!0),S.debug(`portalEvents.keydown.row`,{action:o.dataset.action,key:t.key}),o.click())}function Ys(e,t,n){let{state:r,root:i}=e;if(r.activeTab!==`files`||r.busy||r.filesUploadProgress||!On(n.dataTransfer))return;let a=n.target?.closest?.(`[data-files-drop-target]`);if(!a||!i.contains(a)){if(t===`leave`&&r.filesDropDepth>0){let t=n.relatedTarget;t&&t instanceof Node&&i.querySelector(`[data-files-drop-target]`)?.contains(t)||(r.filesDropDepth=0,Zs(e))}return}if(t===`enter`){n.preventDefault(),n.stopPropagation(),r.filesDropDepth+=1,Xs(e,a,!0);return}if(t===`over`){n.preventDefault(),n.stopPropagation(),n.dataTransfer&&(n.dataTransfer.dropEffect=`copy`),Xs(e,a,!0);return}if(t===`leave`){n.preventDefault(),n.stopPropagation();let t=n.relatedTarget;if(t&&a.contains(t))return;r.filesDropDepth=Math.max(0,r.filesDropDepth-1),r.filesDropDepth===0&&Xs(e,a,!1);return}n.preventDefault(),n.stopPropagation(),r.filesDropDepth=0,Xs(e,a,!1);let o=n.dataTransfer;if(!o||r.busy||r.filesUploadProgress)return;r.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),A(e.filesHost);let s=En(o);S.event(`files.drop.snapshot`,{handles:s.handlePromises.length,entries:s.entries.filter(Boolean).length,files:s.files.length}),(async()=>{try{let t=await Dn(s);if(S.event(`files.drop.items`,{count:t.length,sample:t.slice(0,8).map(e=>e.relativePath)}),t.length===0){e.setFlash(`info`,`Nothing to upload from that drop`),e.render();return}await wr(e.filesHost,t)}catch(t){e.setFlash(`error`,t instanceof Error?t.message:`Drop failed`),e.render()}})()}function Xs(e,t,n){if(e.state.filesUploadDropActive===n){t.classList.toggle(`is-dragover`,n);return}e.state.filesUploadDropActive=n,t.classList.toggle(`is-dragover`,n)}function Zs(e){e.state.filesUploadDropActive=!1,e.root.querySelectorAll(`[data-files-drop-target].is-dragover`).forEach(e=>{e.classList.remove(`is-dragover`)})}function Qs(e,t){let n=t.target;if(!(n instanceof HTMLImageElement)||!n.classList.contains(`contact-avatar`)||!n.dataset.avatarFallback||!n.isConnected)return;let r=n.dataset.avatarFallback||`?`,i=document.createElement(`span`);i.className=`contact-avatar contact-avatar-fallback`,i.setAttribute(`aria-hidden`,`true`),i.textContent=r,n.replaceWith(i)}var $s=`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`;function ec(e,t){if(t.key!==`Tab`)return;let n=e.querySelector(`.cal-modal[data-focus-trap]`);if(!n)return;let r=[...n.querySelectorAll($s)].filter(e=>e.offsetParent!==null||e===document.activeElement);if(r.length===0)return;let i=r[0],a=r[r.length-1],o=document.activeElement;!t.shiftKey&&o===a?(t.preventDefault(),i.focus()):t.shiftKey&&(o===i||!n.contains(o))&&(t.preventDefault(),a.focus())}function tc(e,t){if(ec(e.root,t),t.key!==`Escape`)return;let{state:n,render:r}=e;if(n.importProgress&&(n.importProgress.phase===`done`||n.importProgress.phase===`error`)){e.closeImportProgress();return}if(n.importProgress)return;if(n.filesUploadProgress&&(n.filesUploadProgress.phase===`done`||n.filesUploadProgress.phase===`error`)){e.closeFilesUploadProgress();return}if(n.filesUploadProgress)return;if(n.filesUploadMenuOpen){n.filesUploadMenuOpen=!1,e.unbindFilesUploadMenuOutside(),r();return}if(n.filesItemMenu){A(e.filesHost),r();return}if(n.userMenuOpen){n.userMenuOpen=!1,e.unbindUserMenuOutside(),r();return}if(n.filesUploadConflict!==null){Cr(e.filesHost,`cancel`);return}if(n.filesPreview!==null){R(e.filesHost),r();return}if(n.filesRenamePath!==null||n.filesDeletePaths!==null||n.filesTransfer!==null||n.filesMkdirOpen){n.filesRenamePath=null,n.filesDeletePaths=null,e.resetFilesTransferTree(),n.filesMkdirOpen=!1,r();return}if(n.confirmDelete){n.confirmDelete=null,r();return}if(n.userSettingsOpen){re(n),r();return}if(Gt(e.root)){Wt(e.root);return}let i=e.root.querySelector(`#info-modal`);if(i&&!i.hidden){e.closeInfoModal();return}if(n.eventDtPicker){n.eventDtPicker=null,Yt(n),r();return}if(n.eventModalOpen){n.eventModalOpen=!1,n.editingEvent=null,n.creatingEvent=!1,n.eventDtPicker=null,r();return}if(n.contactModalOpen){n.contactModalOpen=!1,n.editingContact=null,n.creatingContact=!1,n.photoPreview=null,n.photoBase64Pending=null,n.removePhotoPending=!1,r();return}if(n.noteModalOpen){n.noteModalOpen=!1,n.creatingNote=!1,n.editingNote=null,r();return}if(n.taskModalOpen){n.taskModalOpen=!1,n.creatingTask=!1,n.editingTask=null,r();return}if(n.abModalOpen){n.abModalOpen=!1,r();return}if(n.calModalOpen||n.createCalModalOpen||n.deleteConfirmId!==null||n.deleteAbConfirmId!==null){n.calModalOpen=!1,n.createCalModalOpen=!1,n.deleteConfirmId=null,n.deleteAbConfirmId=null,r();return}if(n.adminUserCreateOpen||n.adminUserEditOpen||n.adminUserDeleteUsername!==null){n.adminUserCreateOpen=!1,n.adminUserEditOpen=!1,n.adminUserDeleteUsername=null,r();return}if(n.adminResetModalOpen){n.adminResetModalOpen=!1,r();return}if(n.adminDbConfirmOpen){n.adminDbConfirmOpen=!1,n.adminDbConfirmText=``,n.adminDbPendingBody=null,r();return}(n.adminCalModal!==null||n.adminAbModal!==null||n.adminResourceDelete!==null)&&(n.adminCalModal=null,n.adminAbModal=null,n.adminResourceDelete=null,r())}function nc(e){let{state:t}=e;if(t.activeTab===`admin`&&(!e.userIsAdmin()||!e.adminUiEnabled())){t.activeTab=Et(t),t.adminPage=`overview`,e.persistTab(t.activeTab);return}t.activeTab!==`admin`&&!k(t,t.activeTab)&&(t.activeTab=Et(t),e.persistTab(t.activeTab))}async function rc(e,t,n={}){return Ni(e.adminHost,t,n)}async function ic(e,t,n={}){let{state:r,render:i,setFlash:a,clearFlash:o}=e;if(t===`admin`&&(!e.userIsAdmin()||!e.adminUiEnabled())&&(e.userIsAdmin()&&r.adminCapabilities&&!r.adminCapabilities.uiEnabled&&a(`info`,`Portal Administration UI is disabled (portal_admin_ui_enabled).`),t=Et(r)),t!==`admin`&&!k(r,t)&&(a(`info`,`That section is disabled in system settings.`),t=Et(r)),t!==`files`&&A(e.filesHost),t===`admin`){await e.activateAdminPage(r.adminPage||`overview`,{...n,username:r.adminPage===`users`?r.adminSelectedUsername:null});return}r.activeTab=t,r.userMenuOpen=!1,r.listKeyboardFocus=!1,e.persistTab(t),S.event(`tab`,{tab:t}),t!==`calendars`&&(r.calModalOpen=!1,r.deleteConfirmId=null),t!==`contacts`&&(r.deleteAbConfirmId=null),t!==`notes`&&(r.noteModalOpen=!1,r.creatingNote=!1,r.editingNote=null),t!==`tasks`&&(r.taskModalOpen=!1,r.creatingTask=!1,r.editingTask=null),n.clearFlash!==!1&&o();let s=t===`calendars`&&r.calendarEventsReady&&!r.monthEventsLoading,c=!1;s||(r.busy=!0),i();try{if(t===`contacts`&&r.selectedAbId!==null)await e.loadContacts(r.selectedAbId);else if(t===`calendars`){if(s){let t=_a(r.monthEvents);await e.loadMonthEvents(),c=_a(r.monthEvents)===t}else await e.loadMonthEvents()}else t===`tasks`?await Io(e.tasksHost):t===`notes`?await so(e.notesHost):t===`files`&&await j(e.filesHost)}catch(e){S.warn(`tab load failed`,e instanceof Error?e.message:e),a(`error`,e instanceof Error?e.message:`Failed to load`)}finally{r.busy=!1,c||i()}}async function ac(e){let{state:t}=e;S.debug(`loadHome`);let[n,r,i]=await Promise.all([E.calendars(),E.directory().catch(()=>({users:[]})),E.addressbooks()]);if(t.calendars=n.calendars,t.directory=r.users,t.addressBooks=i.addressbooks,S.event(`loadHome`,{calendars:t.calendars.length,addressBooks:t.addressBooks.length,directory:t.directory.length}),t.holidayCountries.length===0)try{t.holidayCountries=(await E.holidayCountries()).countries}catch{t.holidayCountries=[]}if(t.selectedIds=t.selectedIds.filter(e=>t.calendars.some(t=>t.id===e)),t.selectedId!==null&&!t.calendars.some(e=>e.id===t.selectedId)&&(t.selectedId=null,t.shares=[],t.calModalOpen=!1,t.deleteConfirmId=null),!t.calendarSelectionSeeded&&t.selectedIds.length===0){let n=ha(t.user?.username);if(n){n.view&&(t.calView=n.view),t.calView===`week`&&(t.weekScrollToDayStart=!0);let e=n.ids.filter(e=>t.calendars.some(t=>t.id===e));t.selectedIds=e,t.selectedId=n.selectedId!==null&&t.calendars.some(e=>e.id===n.selectedId)?n.selectedId:e[0]??null,t.calendarSelectionSeeded=!0,S.debug(`loadHome.calSelection.restored`,{count:e.length,selectedId:t.selectedId,view:t.calView})}else{let n=e.pickDefaultCalendar();n?(t.selectedIds=[n.id],t.selectedId=n.id):t.calendars.length>0&&(t.selectedIds=[t.calendars[0].id],t.selectedId=t.calendars[0].id),t.calendarSelectionSeeded=!0}}else t.selectedIds.length===0?t.selectedId=null:t.calendarSelectionSeeded=!0;t.selectedId===null&&t.selectedIds.length>0&&(t.selectedId=t.selectedIds[0]),ga(t),t.selectedId!==null&&t.calModalOpen?await e.loadShares(t.selectedId):t.selectedId!==null&&(t.shares=[]),t.activeTab===`calendars`&&await e.loadMonthEvents(),t.selectedAbId!==null&&!t.addressBooks.some(e=>e.id===t.selectedAbId)&&(t.selectedAbId=null,t.contacts=[],t.selectedContactUri=null,t.editingContact=null,t.creatingContact=!1),t.deleteAbConfirmId!==null&&!t.addressBooks.some(e=>e.id===t.deleteAbConfirmId)&&(t.deleteAbConfirmId=null),t.selectedAbId===null&&t.addressBooks.length>0&&(t.selectedAbId=t.addressBooks[0].id),t.selectedAbId!==null&&t.activeTab===`contacts`&&await e.loadContacts(t.selectedAbId),t.activeTab===`tasks`&&await Io(e.tasksHost),t.activeTab===`notes`&&await so(e.notesHost),t.activeTab===`files`&&await j(e.filesHost)}function oc(e){let{state:t}=e;return qi(t.portalUi.timeFormat)}function sc(e){let{state:t}=e;return Ji(t.portalUi.weekStart)}function cc(e){let{state:t}=e;return Yi(t.portalUi.weekStart)}function lc(e,t,n){let{state:r}=e;return Zi(t,n,r.portalUi.timeFormat)}function uc(e,t,n,r,i){let{state:a}=e,o=Qi(n);return ia({field:t,value:n,dateOnly:r,allowClear:i,viewY:a.eventDtPicker?.viewY??Number(o.date.slice(0,4)),viewM:a.eventDtPicker?.viewM??Number(o.date.slice(5,7))-1,weekStart:a.portalUi.weekStart,timeFormat:a.portalUi.timeFormat})}function dc(e){aa(e.root)}function fc(t,n){let{state:r}=t,{field:i,name:a,label:o,value:s,dateOnly:c=!1,required:l,disabled:u,allowClear:d=!0}=n,f=r.eventDtPicker?.field===i,p=lc(t,s,c);return`<div class="dt-field${f?` is-open`:``}" data-dt-id="${e(i)}">
    <span class="dt-field-label">${e(o)}</span>
    <input type="hidden" name="${e(a)}" value="${e(s)}" ${l?`required`:``} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${e(i)}"
      data-dt-name="${e(a)}" data-dt-date-only="${c?`1`:`0`}" data-dt-clear="${d?`1`:`0`}"
      ${u?`disabled`:``} aria-expanded="${f}">
      <span class="dt-trigger-text">${e(p)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${f&&!u?uc(t,i,s,c,d):``}
  </div>`}function pc(e,t){let{state:n}=e;return t===`start`?String(n.editingEvent?.start||``):t===`end`?String(n.editingEvent?.end||``):t===`until`?n.editingEvent?.repeat?.until||Gi(n.editingEvent?.start)||U(new Date):t===`due`?ra(n.editingTask?.due):t===`dtstart`?ra(n.editingNote?.dtstart):t===`bulk-due`?n.bulkDueValue:t===`birthday`?String(n.editingContact?.birthday||``):``}function mc(e,t,n){let{state:r}=e;if(t===`start`&&r.editingEvent){r.editingEvent={...r.editingEvent,start:n||``};return}if(t===`end`&&r.editingEvent){r.editingEvent={...r.editingEvent,end:n};return}if(t===`until`&&r.editingEvent){r.editingEvent={...r.editingEvent,repeat:{...r.editingEvent.repeat??e.defaultRepeat(),until:n,endMode:`until`}};return}if(t===`due`&&r.editingTask){if(n===null||n===``)r.editingTask={...r.editingTask,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(n))r.editingTask={...r.editingTask,due:new Date(n+`T00:00:00`).toISOString()};else{let e=new Date((n.length,n));r.editingTask={...r.editingTask,due:Number.isNaN(e.getTime())?n:e.toISOString()}}return}if(t===`dtstart`&&r.editingNote){if(n===null||n===``)r.editingNote={...r.editingNote,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(n))r.editingNote={...r.editingNote,dtstart:new Date(n+`T00:00:00`).toISOString()};else{let e=new Date((n.length,n));r.editingNote={...r.editingNote,dtstart:Number.isNaN(e.getTime())?n:e.toISOString()}}return}if(t===`birthday`&&r.editingContact){r.editingContact={...r.editingContact,birthday:n&&/^\d{4}-\d{2}-\d{2}/.test(n)?n.slice(0,10):null};return}t===`bulk-due`&&(r.bulkDueValue=n||``)}function hc(t,n){let{root:r}=t,i=Dr[n];if(!i)return;let a=r.querySelector(`#info-modal`),o=r.querySelector(`#info-modal-title`),s=r.querySelector(`#info-modal-body`);!a||!o||!s||(o.textContent=i.title,s.innerHTML=i.paragraphs.map(t=>`<p>${e(t)}</p>`).join(``),a.hidden=!1,document.body.classList.add(`info-modal-open`),a.querySelector(`.info-modal-close`)?.focus())}function gc(e){let{root:t}=e,n=t.querySelector(`#info-modal`);n&&(n.hidden=!0,document.body.classList.remove(`info-modal-open`))}function _c(e){let t=e.querySelector(`input[name="color_picker"]`),n=e.querySelector(`input[name="color"]`);!t||!n||(t.addEventListener(`input`,()=>{n.value=t.value.toUpperCase()}),n.addEventListener(`change`,()=>{let e=n.value.trim();e&&!e.startsWith(`#`)&&(e=`#${e}`),/^#[0-9A-Fa-f]{6}/.test(e)&&(t.value=e.slice(0,7),n.value=e.toUpperCase())}))}function vc(e){let t=Ge({activeTab:ds(),adminPage:fs(),adminSelectedUsername:us().adminUsername??null}),n,r,i,a,o,s,c;function l(e,t){bt(e,t)}function u(){xt(t)}function d(){let n=Lt(e);t.user?Es(c):It(e,t,(e,n)=>Kt(t,e,n)),Os(c),Rt(e,{...n,weekWrapTop:t.weekWrapScrollTop}),requestAnimationFrame(()=>{dc(c),e.querySelector(`.dt-time.is-selected`)?.scrollIntoView({block:`center`})})}function f(){G(i)}function p(){cr(n)}function m(){M(n)}function h(){qt(t)}function g(){z(n)}function _(){kt(t,{stopImportElapsedTimer:f,stopFilesUploadElapsedTimer:p,resetFilesTransferTree:m,unbindUserMenuOutside:h,unbindFilesUploadMenuOutside:g})}function v(e){At(t,{message:e,clearSession:_,render:d})}function y(){return{state:t,render:d,handleSessionExpired:v,clearPortalSessionState:_,normalizeActiveTab:()=>nc(c),persistTab:ms,loadHome:()=>ac(c),loadAdminCapabilities:()=>Jr(r),loadAdminDashboard:()=>Yr(r),loadAdminUsers:()=>Xr(r),loadAdminUserDetail:e=>H(r,e),loadAdminUserResources:e=>Zr(r,e),loadAdminSystemSettings:()=>Qr(r),loadAdminDatabaseSettings:()=>$r(r),adminPageMeta:e=>V(r,e),setFlash:l,clearFlash:u}}n={state:t,root:e,render:d,setFlash:l,clearFlash:u},r={state:t,root:e,render:d,setFlash:l,clearFlash:u,userIsAdmin:()=>Ct(t),adminUiEnabled:()=>wt(t),persistTab:ms,activateTab:(e,t)=>ic(c,e,t),loadHome:()=>ac(c),normalizeActiveTab:()=>nc(c)},i={state:t,root:e,render:d,setFlash:l,clearFlash:u,localeWeekStart:()=>sc(c),localeDowLabels:()=>cc(c),formatDtDisplay:(e,t)=>lc(c,e,t),timeFormatOpts:()=>oc(c),renderPortalDateTimeField:e=>fc(c,e),getDtFieldCurrentValue:e=>pc(c,e),setDtFieldValue:(e,t)=>mc(c,e,t),positionDtPopovers:()=>dc(c),accessBadge:hs,formatImportResult:gs,loadHome:()=>ac(c),onImportContacts:e=>ts(s,e)},a={state:t,root:e,render:d,setFlash:l,clearFlash:u,renderPortalDateTimeField:e=>fc(c,e)},o={state:t,root:e,render:d,setFlash:l,clearFlash:u,renderPortalDateTimeField:e=>fc(c,e)},s={state:t,root:e,render:d,setFlash:l,clearFlash:u,renderPortalDateTimeField:e=>fc(c,e),stopImportElapsedTimer:()=>G(i),startImportElapsedTimer:()=>Va(i),setImportPhase:(e,t)=>Ha(i,e,t),applyServerImportProgress:e=>Wa(i,e),readFileTextWithProgress:(e,t)=>qa(i,e,t),formatImportResult:gs,loadHome:()=>ac(c)},c={state:t,root:e,render:d,setFlash:l,clearFlash:u,filesHost:n,adminHost:r,calendarsHost:i,notesHost:a,tasksHost:o,contactsHost:s,clearPortalSessionState:_,userIsAdmin:()=>Ct(t),adminUiEnabled:()=>wt(t),normalizeActiveTab:()=>nc(c),persistTab:ms,activateTab:(e,t)=>ic(c,e,t),activateAdminPage:(e,t)=>rc(c,e,t),loadHome:()=>ac(c),handleSessionExpired:v,loadShares:e=>va(i,e),loadMonthEvents:()=>ba(i),loadContacts:e=>Yo(s,e),loadTasks:()=>Io(o),loadNotes:()=>so(a),loadAdminCapabilities:()=>Jr(r),loadAdminDashboard:()=>Yr(r),loadAdminUsers:()=>Xr(r),loadAdminUserDetail:e=>H(r,e),loadAdminUserResources:e=>Zr(r,e),loadAdminSystemSettings:()=>Qr(r),loadAdminDatabaseSettings:()=>$r(r),adminPageMeta:e=>V(r,e),pickDefaultCalendar:()=>ya(i),toggleCalendarSelected:e=>Sa(i,e),blankEventForDay:(e,t)=>Ra(i,e,t),blankEventForSlot:(e,t,n)=>za(i,e,t,n),defaultRepeat:()=>Na(),itemKey:q,openContact:e=>Xo(s,e),startNewContact:()=>Zo(s),emptyAddress:()=>Qo(s),syncEditingEventFromForm:e=>Ba(i,e),syncEditingTaskFromForm:e=>Go(o,e),syncEditingNoteFromForm:e=>Mo(a,e),runBulkTaskAction:e=>Ko(o,e),shell:(e,n)=>Kt(t,e,n),renderLogin:()=>It(e,t,(e,n)=>Kt(t,e,n)),renderMonthGrid:()=>ja(i),renderEventModal:()=>Ia(i),adminSubnavButtons:()=>Ur(r),renderPortalDateTimeField:e=>fc(c,e),getDtFieldCurrentValue:e=>pc(c,e),setDtFieldValue:(e,t)=>mc(c,e,t),positionDtPopovers:()=>dc(c),accessBadge:hs,formatImportResult:gs,closeImportProgress:()=>Ua(i),closeFilesUploadProgress:()=>ur(n),resetFilesTransferTree:m,stopImportElapsedTimer:f,stopFilesUploadElapsedTimer:p,unbindUserMenuOutside:h,bindUserMenuOutside:()=>Jt(t,d),unbindFilesUploadMenuOutside:g,bindFilesUploadMenuOutside:()=>sr(n),onLogin:e=>Ft(e,y()),onShare:e=>Za(i,e),onSaveEvent:e=>Qa(i,e),onEditCal:e=>$a(i,e),onCreateCal:e=>eo(i,e),onSaveContact:e=>rs(s,e),onCreateAb:e=>is(s,e),onEditAb:e=>as(s,e),onSaveTask:e=>qo(o,e),onSaveNote:e=>Po(a,e),bindColorPair:_c,bindImportInput:()=>void 0,bindHolidaysToggle:()=>no(i),bindContactPhotoInput:()=>void 0,bindFilesDom:()=>zr(n),bindAdminDom:()=>void 0,saveBlobAsFile:yi,openInfoModal:e=>hc(c,e),closeInfoModal:()=>gc(c),captureScroll:()=>Lt(e),restoreScroll:t=>Rt(e,t)},at(),Rs(c),Pt(y())}var J=``,Y=null,X=!1,Z=null,Q=null,yc=`sqlite`,bc=!1;async function xc(e,t={}){let n={Accept:`application/json`,...t.headers};t.body&&(n[`Content-Type`]=`application/json`),J&&t.method&&t.method!==`GET`&&(n[`X-CSRF-Token`]=J);let r=await fetch(`/api/install${e}`,{credentials:`same-origin`,...t,headers:n}),i;try{i=await r.json()}catch{throw Error(`Request failed (${r.status})`)}if(!r.ok)throw Error(i.error||`Request failed (${r.status})`);return i&&typeof i==`object`&&`data`in i&&i.data!==void 0?i.data:i}async function Sc(){Y=await xc(`/status`),J=Y.csrfToken||J,yc=Y.defaults?.backend===`pgsql`?`pgsql`:`sqlite`}function Cc(t,n,r){return`<label class="check-row"><input type="checkbox" name="${e(t)}" ${n?`checked`:``} ${X?`disabled`:``} /> ${e(r)}</label>`}function wc(){let n=Y?.permissions;return`<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${e(n?.configPath||`—`)} ${n?.configWritable?`<span class="badge badge-ok">writable</span>`:`<span class="badge badge-off">not writable</span>`}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${e(n?.specificPath||`—`)} ${n?.specificWritable?`<span class="badge badge-ok">writable</span>`:`<span class="badge badge-off">not writable</span>`}</dd></div>
    </dl>
    ${t(`error`,Y?.message||`Fix directory permissions, then reload.`)}
    <button type="button" class="btn btn-primary" data-action="reload" ${X?`disabled`:``}>Retry</button>
  </section>`}function Tc(){let t=Y?.defaults;return`<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${X?`disabled`:``}>
          ${mi(t?.timezone||`UTC`)}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${Cc(`cal_enabled`,t?.cal_enabled!==!1,`Enable CalDAV`)}
      ${Cc(`card_enabled`,t?.card_enabled!==!1,`Enable CardDAV`)}
      ${Cc(`tasks_enabled`,t?.tasks_enabled!==!1,`Enable Tasks (VTODO)`)}
      ${Cc(`notes_enabled`,!!t?.notes_enabled,`Enable Notes (VJOURNAL)`)}
      ${Cc(`files_enabled`,!!t?.files_enabled,`Enable WebDAV file storage`)}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${X?`disabled`:``}>
          ${[`Digest`,`Basic`,`Apache`].map(e=>`<option value="${e}" ${(t?.dav_auth_type||`Digest`)===e?`selected`:``}>${e}</option>`).join(``)}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${e(t?.invite_from||``)}" ${X?`disabled`:``} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${e(String(t?.session_max_age_minutes??15))}" ${X?`disabled`:``} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${X?`disabled`:``} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${X?`disabled`:``} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${X?`disabled`:``}>Save and continue</button>
      </div>
    </form>
  </section>`}function Ec(){let t=Y?.defaults,n=Y?.pdoDrivers||[],r=n.includes(`sqlite`),i=n.includes(`pgsql`);return`<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${X?`disabled`:``}>
          ${r?`<option value="sqlite" ${yc===`sqlite`?`selected`:``}>SQLite</option>`:``}
          ${i?`<option value="pgsql" ${yc===`pgsql`?`selected`:``}>PostgreSQL</option>`:``}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${yc===`sqlite`?``:`display:none`}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${e(t?.sqlite_file||``)}" class="mono" ${X?`disabled`:``} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${yc===`pgsql`?``:`display:none`}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${e(t?.pgsql_host||``)}" placeholder="localhost:5432" ${X?`disabled`:``} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${e(t?.pgsql_dbname||``)}" ${X?`disabled`:``} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${e(t?.pgsql_username||``)}" autocomplete="off" ${X?`disabled`:``} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${X?`disabled`:``} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${X?`disabled`:``} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${X?`disabled`:``} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${X?`disabled`:``}>Create database and finish</button>
      </div>
    </form>
  </section>`}function Dc(){return`<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${e(String(Y?.configuredVersion||`?`))}</strong>
      to <strong class="mono">${e(Y?.productVersion||`?`)}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${bc?`checked`:``} ${X?`disabled`:``} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${X||!bc?`disabled`:``}>Run upgrade</button>
    </div>
  </section>`}function Oc(){return`<section class="card">
    <h2>Installation complete</h2>
    <p>${e(Y?.message||`AngaraDAV is configured.`)}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`}function kc(){return`<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${t(`error`,Y?.message||`Installer is locked.`)}
    <p class="muted small">Production hard-lock: <span class="mono">ANGARA_LOCK_INSTALL=1</span>.
      Set <span class="mono">ANGARA_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`}function $(){let n=document.getElementById(`app`);if(!n)return;let r=Y?.step||`permissions`,i=``;i=Y?r===`permissions`?wc():r===`initialize`?Tc():r===`database`?Ec():r===`upgrade`?Dc():r===`done`?Oc():r===`locked`?kc():`<section class="card"><p>Unknown step: ${e(r)}</p></section>`:`<section class="card"><p class="muted">Loading installer…</p></section>`,n.innerHTML=`
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${e(Y?.productVersion||`…`)}</span>
            ${Y?.configuredVersion?` · configured <span class="mono">${e(String(Y.configuredVersion))}</span>`:``}
          </p>
        </div>
        ${Y?.step?`<span class="badge badge-admin">${e(Y.step)}</span>`:``}
      </header>
      ${Z?t(`error`,Z,{dismissible:!1}):``}
      ${Q?t(`success`,Q,{dismissible:!1}):``}
      ${i}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `,Ac()}function Ac(){let e=document.getElementById(`app`);e&&(e.querySelector(`[data-action="reload"]`)?.addEventListener(`click`,()=>{jc()}),e.querySelector(`[data-action="backend-change"]`)?.addEventListener(`change`,e=>{yc=e.target.value===`pgsql`?`pgsql`:`sqlite`,$()}),e.querySelector(`[data-action="upgrade-toggle"]`)?.addEventListener(`change`,e=>{bc=!!e.target.checked,$()}),e.querySelector(`[data-action="upgrade-run"]`)?.addEventListener(`click`,()=>{Pc()}),e.querySelector(`[data-form="initialize"]`)?.addEventListener(`submit`,e=>{e.preventDefault(),Mc(e.target)}),e.querySelector(`[data-form="database"]`)?.addEventListener(`submit`,e=>{e.preventDefault(),Nc(e.target)}))}async function jc(){X=!0,Z=null,$();try{await Sc(),Q=null}catch(e){Z=e instanceof Error?e.message:`Failed to load installer status`}finally{X=!1,$()}}async function Mc(e){let t=new FormData(e),n=t=>!!e.querySelector(`input[name="${t}"]`)?.checked,r={timezone:String(t.get(`timezone`)??``).trim(),cal_enabled:n(`cal_enabled`),card_enabled:n(`card_enabled`),tasks_enabled:n(`tasks_enabled`),notes_enabled:n(`notes_enabled`),files_enabled:n(`files_enabled`),dav_auth_type:String(t.get(`dav_auth_type`)??`Digest`),invite_from:String(t.get(`invite_from`)??``).trim(),session_max_age_minutes:Number(t.get(`session_max_age_minutes`)??15),admin_password:String(t.get(`admin_password`)??``),admin_password_confirm:String(t.get(`admin_password_confirm`)??``)};X=!0,Z=null,Q=null,$();try{Y=await xc(`/initialize`,{method:`POST`,body:JSON.stringify(r)}),J=Y.csrfToken||J,Q=`Server settings saved. Configure the database next.`,S.event(`install.initialize`)}catch(e){Z=e instanceof Error?e.message:`Initialize failed`}finally{X=!1,$()}}async function Nc(e){let t=new FormData(e),n=String(t.get(`backend`)??yc),r={backend:n,admin_password:String(t.get(`admin_password`)??``),admin_password_confirm:String(t.get(`admin_password_confirm`)??``)};n===`sqlite`?r.sqlite_file=String(t.get(`sqlite_file`)??``).trim():(r.pgsql_host=String(t.get(`pgsql_host`)??``).trim(),r.pgsql_dbname=String(t.get(`pgsql_dbname`)??``).trim(),r.pgsql_username=String(t.get(`pgsql_username`)??``).trim(),r.pgsql_password=String(t.get(`pgsql_password`)??``)),X=!0,Z=null,Q=null,$();try{Y=await xc(`/database`,{method:`POST`,body:JSON.stringify(r)}),J=Y.csrfToken||J,Q=`Database configured. Installer is locked.`,S.event(`install.database`),Y.completed||Y.step}catch(e){Z=e instanceof Error?e.message:`Database setup failed`}finally{X=!1,$()}}async function Pc(){if(bc){X=!0,Z=null,Q=null,$();try{let e=await xc(`/upgrade`,{method:`POST`,body:JSON.stringify({confirm:!0})});Q=`Upgrade completed.`+(e.messages&&e.messages.length?` `+e.messages.slice(0,3).join(` · `):``),S.event(`install.upgrade`),await Sc()}catch(e){Z=e instanceof Error?e.message:`Upgrade failed`}finally{X=!1,$()}}}async function Fc(e){document.title=`AngaraDAV · Setup`,document.body.classList.add(`layout-install`),e.innerHTML=`<section class="card"><p class="muted">Loading installer…</p></section>`;try{await Sc()}catch(e){Z=e instanceof Error?e.message:`Failed to load installer`}$()}b();var Ic=document.getElementById(`app`);if(!Ic)throw Error(`#app missing`);var Lc=window.location.pathname.replace(/\/+$/,``)||`/`;Lc===`/portal/install`||Lc.endsWith(`/portal/install`)?Fc(Ic):vc(Ic);