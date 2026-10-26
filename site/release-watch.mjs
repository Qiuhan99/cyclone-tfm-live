// Detect stale HTML and back-forward-cache restores using an uncached release record.
export function releaseDecision(current,remote,href,lastAttempt){
 if(!remote||!/^[-a-zA-Z0-9.]{1,80}$/.test(remote.version??'')||current===remote.version)return {action:'current'};
 const a=/^(\d{8})-verify(\d+)$/.exec(current??''),b=/^(\d{8})-verify(\d+)$/.exec(remote.version);
 if(a&&b&&(a[1]>b[1]||a[1]===b[1]&&Number(a[2])>=Number(b[2])))return {action:'current'};
 const url=new URL(href);url.searchParams.set('v',remote.version);
 const attempted=lastAttempt===remote.version||url.searchParams.get('_release_attempt')===remote.version;
 url.searchParams.set('_release_attempt',remote.version);
 return {action:attempted?'notice':'reload',url:url.href,version:remote.version};
}
export async function watchRelease(win,doc,fetcher){
 const key='cyclone-release:'+win.location.pathname;
 async function check(){
  try{
   const response=await fetcher('assets/site-release.json',{cache:'no-store'});if(!response.ok)return;
   const remote=await response.json();let last;try{last=win.sessionStorage.getItem(key);}catch{}
   const d=releaseDecision(doc.documentElement.dataset.siteVersion,remote,win.location.href,last);
   if(d.action==='current')return;
   if(d.action==='reload'){try{win.sessionStorage.setItem(key,d.version);}catch{}win.location.replace(d.url);return;}
   const box=doc.getElementById('site-update-notice');if(box){box.hidden=false;box.textContent='A newer website release is available. ';const a=doc.createElement('a');a.href=d.url;a.textContent='Load the current research method →';box.append(a);}
  }catch{/* A release check never blocks observations or maps. */}
 }
 win.addEventListener('pageshow',check);win.setInterval(check,60000);await check();
}
if(globalThis.window?.location&&globalThis.document?.documentElement)watchRelease(window,document,fetch);
