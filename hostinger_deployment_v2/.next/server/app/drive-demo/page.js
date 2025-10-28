(()=>{var e={};e.id=7905,e.ids=[7905],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1017:e=>{"use strict";e.exports=require("path")},5477:e=>{"use strict";e.exports=require("punycode")},2781:e=>{"use strict";e.exports=require("stream")},7310:e=>{"use strict";e.exports=require("url")},9796:e=>{"use strict";e.exports=require("zlib")},5618:(e,l,s)=>{"use strict";s.r(l),s.d(l,{GlobalError:()=>a.a,__next_app__:()=>f,originalPathname:()=>u,pages:()=>c,routeModule:()=>p,tree:()=>d});var r=s(7096),i=s(6132),t=s(7284),a=s.n(t),n=s(2564),o={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);s.d(l,o);let d=["",{children:["drive-demo",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2656)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/drive-demo/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,2540)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/drive-demo/page.tsx"],u="/drive-demo/page",f={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/drive-demo/page",pathname:"/drive-demo",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},1765:(e,l,s)=>{Promise.resolve().then(s.bind(s,9905))},8465:(e,l,s)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"default",{enumerable:!0,get:function(){return a}});let r=s(143);s(4218);let i=r._(s(3641));function t(e){return{default:(null==e?void 0:e.default)||e}}function a(e,l){let s=i.default,r={loading:e=>{let{error:l,isLoading:s,pastDelay:r}=e;return null}};"function"==typeof e&&(r.loader=e),Object.assign(r,l);let a=r.loader;return s({...r,loader:()=>null!=a?a().then(t):Promise.resolve(t(()=>null))})}("function"==typeof l.default||"object"==typeof l.default&&null!==l.default)&&void 0===l.default.__esModule&&(Object.defineProperty(l.default,"__esModule",{value:!0}),Object.assign(l.default,l),e.exports=l.default)},9480:(e,l,s)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"NoSSR",{enumerable:!0,get:function(){return i}});let r=s(5158);function i(e){let{children:l}=e;return(0,r.throwWithNoSSR)(),l}},3641:(e,l,s)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"default",{enumerable:!0,get:function(){return a}});let r=s(143),i=r._(s(4218)),t=s(9480),a=function(e){let l=Object.assign({loader:null,loading:null,ssr:!0},e);function s(e){let s=l.loading,r=i.default.createElement(s,{isLoading:!0,pastDelay:!0,error:null}),a=l.ssr?i.default.Fragment:t.NoSSR,n=l.lazy;return i.default.createElement(i.default.Suspense,{fallback:r},i.default.createElement(a,null,i.default.createElement(n,e)))}return l.lazy=i.default.lazy(l.loader),s.displayName="LoadableComponent",s}},9905:(e,l,s)=>{"use strict";s.r(l),s.d(l,{default:()=>o});var r=s(3854),i=s(4218),t=s(8465),a=s.n(t);let n=a()(async()=>{},{loadableGenerated:{modules:["../app/drive-demo/page.tsx -> ../../components/GoogleDriveExplorer"]},ssr:!1,loading:()=>r.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"400px",background:"#f9fafb",border:"2px solid #e5e7eb",borderRadius:"12px",color:"#6b7280"},children:"Loading Google Drive Explorer..."})});function o(){let[e,l]=(0,i.useState)(null),[s,t]=(0,i.useState)(""),[a,o]=(0,i.useState)("");return(0,r.jsxs)("div",{style:{padding:"2rem",maxWidth:"1200px",margin:"0 auto"},children:[r.jsx("style",{dangerouslySetInnerHTML:{__html:`
          .demo-header {
            margin-bottom: 2rem;
            text-align: center;
          }
          .demo-title {
            font-size: 2rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 1rem;
          }
          .demo-description {
            color: #6b7280;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .demo-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            align-items: start;
          }
          .demo-explorer {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .demo-sidebar {
            background: #f9fafb;
            padding: 1.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            height: fit-content;
          }
          .sidebar-section {
            margin-bottom: 1.5rem;
          }
          .sidebar-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.75rem;
          }
          .sidebar-content {
            color: #374151;
            font-size: 0.9rem;
            line-height: 1.5;
          }
          .file-info {
            background: #ffffff;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            word-break: break-all;
          }
          .file-info-item {
            margin-bottom: 0.5rem;
          }
          .file-info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .file-info-value {
            color: #000000;
          }
          .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .features-list li:last-child {
            border-bottom: none;
          }
          .feature-icon {
            width: 16px;
            height: 16px;
            color: #10b981;
          }
          .folder-info {
            background: #eff6ff;
            padding: 1rem;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            color: #1e40af;
          }
          @media (max-width: 768px) {
            .demo-layout {
              grid-template-columns: 1fr;
            }
          }
        `}}),(0,r.jsxs)("div",{className:"demo-header",children:[r.jsx("h1",{className:"demo-title",children:"\uD83D\uDDC2️ Hierarchical Google Drive Explorer"}),r.jsx("p",{className:"demo-description",children:"Browse your Google Drive folders in a hierarchical tree structure. Select a folder to see its files, then upload directly to that specific folder."})]}),(0,r.jsxs)("div",{className:"demo-layout",children:[r.jsx("div",{className:"demo-explorer",children:r.jsx(n,{onFileSelect:e=>{l(e),console.log("Selected file:",e)},onFolderSelect:(e,l)=>{t(e),o(l),console.log("Selected folder:",{folderId:e,folderName:l})},allowFileSelection:!0,allowFolderSelection:!0,showCreateFolder:!0,mode:"select"})}),(0,r.jsxs)("div",{className:"demo-sidebar",children:[(0,r.jsxs)("div",{className:"sidebar-section",children:[r.jsx("h3",{className:"sidebar-title",children:"✨ New Features"}),(0,r.jsxs)("ul",{className:"features-list",children:[(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Hierarchical folder tree structure"})]}),(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Expand/collapse folder navigation"})]}),(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Folder selection with visual feedback"})]}),(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Upload to specific selected folders"})]}),(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Two-panel layout (folders + files)"})]}),(0,r.jsxs)("li",{children:[r.jsx("svg",{className:"feature-icon",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})}),r.jsx("span",{children:"Parent-child relationship visualization"})]})]})]}),s&&(0,r.jsxs)("div",{className:"sidebar-section",children:[r.jsx("h3",{className:"sidebar-title",children:"\uD83D\uDCC1 Selected Folder"}),(0,r.jsxs)("div",{className:"folder-info",children:[(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"Name: "}),r.jsx("span",{className:"file-info-value",children:r.jsx("strong",{children:a})})]}),(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"ID: "}),r.jsx("span",{className:"file-info-value",children:s})]}),r.jsx("div",{style:{marginTop:"0.75rem",fontSize:"0.875rem"},children:"✅ Ready to upload files to this folder"})]})]}),e&&(0,r.jsxs)("div",{className:"sidebar-section",children:[r.jsx("h3",{className:"sidebar-title",children:"\uD83D\uDCC4 Selected File"}),(0,r.jsxs)("div",{className:"file-info",children:[(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"Name: "}),r.jsx("span",{className:"file-info-value",children:e.name})]}),(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"Type: "}),r.jsx("span",{className:"file-info-value",children:"application/vnd.google-apps.folder"===e.mimeType?"Folder":"File"})]}),(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"ID: "}),r.jsx("span",{className:"file-info-value",children:e.id})]}),e.size&&(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"Size: "}),(0,r.jsxs)("span",{className:"file-info-value",children:[Math.round(parseInt(e.size)/1024)," KB"]})]}),(0,r.jsxs)("div",{className:"file-info-item",children:[r.jsx("span",{className:"file-info-label",children:"Modified: "}),r.jsx("span",{className:"file-info-value",children:new Date(e.modifiedTime).toLocaleDateString()})]}),e.webViewLink&&r.jsx("div",{className:"file-info-item",children:r.jsx("a",{href:e.webViewLink,target:"_blank",rel:"noopener noreferrer",style:{color:"#3b82f6",textDecoration:"underline",wordBreak:"break-all"},children:"View in Google Drive →"})})]})]}),(0,r.jsxs)("div",{className:"sidebar-section",children:[r.jsx("h3",{className:"sidebar-title",children:"\uD83C\uDFAF How to Use"}),(0,r.jsxs)("div",{className:"sidebar-content",children:[(0,r.jsxs)("p",{children:[r.jsx("strong",{children:"1. Navigate folders:"})," Click the ▶ arrows to expand/collapse folders and see their children"]}),(0,r.jsxs)("p",{children:[r.jsx("strong",{children:"2. Select a folder:"})," Click on any folder name to select it (highlighted in black)"]}),(0,r.jsxs)("p",{children:[r.jsx("strong",{children:"3. Upload files:"}),' Once a folder is selected, click "Upload to [folder name]" button']}),(0,r.jsxs)("p",{children:[r.jsx("strong",{children:"4. View files:"})," Selected folder's files appear in the right panel"]}),(0,r.jsxs)("p",{children:[r.jsx("strong",{children:"5. Search:"})," Use search bar to find files across all folders"]})]})]}),(0,r.jsxs)("div",{className:"sidebar-section",children:[r.jsx("h3",{className:"sidebar-title",children:"\uD83D\uDCA1 Key Improvements"}),(0,r.jsxs)("div",{className:"sidebar-content",children:[(0,r.jsxs)("p",{children:["• ",r.jsx("strong",{children:"No more white space"})," in task edit mode - form now fills the full height"]}),(0,r.jsxs)("p",{children:["• ",r.jsx("strong",{children:"Hierarchical structure"})," makes it easy to understand folder relationships"]}),(0,r.jsxs)("p",{children:["• ",r.jsx("strong",{children:"Targeted uploads"})," - select exactly where you want to upload"]}),(0,r.jsxs)("p",{children:["• ",r.jsx("strong",{children:"Visual feedback"})," shows which folder is currently selected"]}),(0,r.jsxs)("p",{children:["• ",r.jsx("strong",{children:"Two-panel layout"})," for better organization and workflow"]})]})]})]})]})]})}},2656:(e,l,s)=>{"use strict";s.r(l),s.d(l,{$$typeof:()=>a,__esModule:()=>t,default:()=>o});var r=s(5153);let i=(0,r.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/drive-demo/page.tsx`),{__esModule:t,$$typeof:a}=i,n=i.default,o=n},3881:(e,l,s)=>{"use strict";s.r(l),s.d(l,{default:()=>i});var r=s(8531);let i=e=>{let l=(0,r.fillMetadataSegment)(".",e.params,"favicon.ico");return[{type:"image/x-icon",sizes:"16x16",url:l+""}]}}};var l=require("../../webpack-runtime.js");l.C(e);var s=e=>l(l.s=e),r=l.X(0,[3271,9101,1323,4598],()=>s(5618));module.exports=r})();