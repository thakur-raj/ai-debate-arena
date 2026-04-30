// Injects browser-detection patches into page world BEFORE page scripts run
// DOM is shared between contextIsolation worlds — script tag runs in page context
// In sandboxed webviews, documentElement may not exist at preload time, so wait for it

const PATCH_CODE = `
// Full Chrome impersonation patches
Object.defineProperty(navigator, 'webdriver', { get: () => false });

// Chrome plugins array
const _p = [
  {name:'Chrome PDF Plugin',filename:'internal-pdf-viewer',description:'Portable Document Format'},
  {name:'Chrome PDF Viewer',filename:'mhjfbmdgcfjbbpaeojofohoefgiehjai',description:''},
  {name:'Native Client',filename:'internal-nacl-plugin',description:''}
].map(d=>({...d,length:0,item:()=>null,namedItem:()=>null,refresh:()=>{}}));
_p.length=3; _p.item=i=>_p[i]||null; _p.namedItem=n=>_p.find(p=>p.name===n)||null;
Object.defineProperty(navigator,'plugins',{get:()=>_p});
Object.defineProperty(navigator,'mimeTypes',{get:()=>({length:4,item:()=>null,namedItem:()=>null,refresh:()=>{}})});

// Permissions API
if(navigator.permissions){const q=navigator.permissions.query.bind(navigator.permissions);navigator.permissions.query=d=>{if(d.name==='clipboard-read'||d.name==='clipboard-write')return Promise.resolve({state:'granted',onchange:null});if(d.name==='notifications')return Promise.resolve({state:'denied',onchange:null});return q(d).catch(()=>({state:'prompt',onchange:null}));}}

// Device memory
Object.defineProperty(navigator,'deviceMemory',{get:()=>8});

// Chrome runtime object
const _c=window.chrome||{};Object.defineProperty(window,'chrome',{value:{runtime:{id:'nkeimhogjdpnpccoofpliimaahmaaome',connect:()=>({onMessage:{addListener:()=>{}},onDisconnect:{addListener:()=>{}},postMessage:()=>{}}),sendMessage:()=>{},onMessage:{addListener:()=>{}},onConnect:{addListener:()=>{}},lastError:void 0},app:{isInstalled:false,InstallState:{DISABLED:'disabled',INSTALLED:'installed',NOT_INSTALLED:'not_installed'},RunningState:{CANNOT_RUN:'cannot_run',READY_TO_RUN:'ready_to_run',RUNNING:'running'}},webstore:{onInstallStageChanged:{addListener:()=>{}},onDownloadProgress:{addListener:()=>{}}},csi:()=>{},loadTimes:()=>({requestTime:0,startLoadTime:0,commitLoadTime:0,finishDocumentLoadTime:0,finishLoadTime:0,firstPaintTime:0,firstPaintAfterLoadTime:0,navigationType:'Other',wasFetchedViaSpdy:true,wasNpnNegotiated:true,npnNegotiatedProtocol:'h2',wasAlternateProtocolAvailable:false,connectionInfo:'h2'}),..._c},writable:false,configurable:true});
`;

function injectPatch() {
  try {
    if (!document.documentElement) {
      // Sandboxed webview — documentElement not ready yet, retry
      requestAnimationFrame(injectPatch);
      return;
    }
    const script = document.createElement('script');
    script.textContent = PATCH_CODE;
    document.documentElement.appendChild(script);
    console.log('[preload] Patches injected successfully');
  } catch (e) {
    console.warn('[preload] Inject failed, trying again:', e.message);
    setTimeout(injectPatch, 10);
  }
}

injectPatch();
