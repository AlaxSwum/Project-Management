"use strict";exports.id=9008,exports.ids=[9008],exports.modules={7690:(e,a,i)=>{i.d(a,{Z:()=>f});var t=i(3854),r=i(4218),s=i(8041),l=i(7689),n=i(4358),d=i(4448),o=i(2432),c=i(9866),m=i(485),g=i(8998),p=i(4937);function f({onFileSelect:e,onFolderSelect:a,allowFileSelection:i=!0,allowFolderSelection:f=!0,showCreateFolder:h=!1,mode:u="browse"}){let[x,b]=(0,r.useState)([]),[v,j]=(0,r.useState)(!1),[y,k]=(0,r.useState)([]),[w,N]=(0,r.useState)(null),[C,F]=(0,r.useState)(""),[S,_]=(0,r.useState)(""),[E,Z]=(0,r.useState)(!1),[L,z]=(0,r.useState)(null),[T,D]=(0,r.useState)(!1),[B,R]=(0,r.useState)(""),[$,U]=(0,r.useState)(!1),[I,M]=(0,r.useState)([]),[A,W]=(0,r.useState)(!1),[O,H]=(0,r.useState)({uploaded:0,total:0,currentFile:""}),P=async(e=null)=>{j(!0),z(null);try{let a=await (0,p.D)(e);return b(a),a}catch(e){return console.error("Error fetching files:",e),z(e instanceof Error?e.message:"Failed to fetch files"),b([]),[]}finally{j(!1)}},Y=async(e=null)=>{let a=await P(e),i=a.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return i.map(a=>({id:a.id,name:a.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e||void 0}))},K=async e=>{let a=await P(e),i=a.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return i.map(a=>({id:a.id,name:a.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e}))},V=async e=>{let a=i=>i.map(i=>i.id===e?{...i,isExpanded:!i.isExpanded,children:i.isExpanded?i.children:[],isLoaded:!!i.isExpanded&&i.isLoaded}:{...i,children:a(i.children)});k(e=>a(e));let i=(e,a)=>{for(let t of e){if(t.id===a)return t;let e=i(t.children,a);if(e)return e}return null},t=i(y,e);if(t&&!t.isExpanded&&!t.isLoaded){let a=await K(e),i=t=>t.map(t=>t.id===e?{...t,children:a,isLoaded:!0,isExpanded:!0}:{...t,children:i(t.children)});k(e=>i(e))}},q=(e,i)=>{N(e),F(i),a&&a(e,i)},G=async e=>{if(!e.trim()){Z(!1);return}j(!0),Z(!0),z(null);try{let a=await (0,p._I)(e);b(a)}catch(e){console.error("Error searching files:",e),z(e instanceof Error?e.message:"Failed to search files"),b([])}finally{j(!1)}},J=async(e,a=null)=>{j(!0);try{let i=await (0,p.al)(e,a||w),t=await Y();return k(t),i}catch(e){console.error("Error creating folder:",e),z(e instanceof Error?e.message:"Failed to create folder")}finally{j(!1)}},Q=async(e,a)=>{W(!0),H({uploaded:0,total:e.length,currentFile:""});try{let i=await (0,p.z6)(e,a,(e,a,i)=>{H({uploaded:e,total:a,currentFile:i})});U(!1),M([]),H({uploaded:0,total:0,currentFile:""}),e.map(e=>e.name).join(", ");let t=1===e.length?`File "${e[0].name}" uploaded successfully to "${C}"`:`${e.length} files uploaded successfully to "${C}"`;return alert(t),w&&P(w),i}catch(e){console.error("Error uploading files:",e),z(e instanceof Error?e.message:"Failed to upload files")}finally{W(!1),H({uploaded:0,total:0,currentFile:""})}},X=async()=>{B.trim()&&(await J(B.trim()),D(!1),R(""))},ee=(e,a=0)=>(0,t.jsxs)("div",{style:{marginLeft:`${20*a}px`},children:[(0,t.jsxs)("div",{className:`folder-tree-item ${w===e.id?"selected":""}`,onClick:()=>q(e.id,e.name),children:[t.jsx("button",{className:"expand-button",onClick:a=>{a.stopPropagation(),V(e.id)},children:e.isExpanded?t.jsx(s.Z,{style:{width:"16px",height:"16px"}}):t.jsx(l.Z,{style:{width:"16px",height:"16px"}})}),t.jsx(n.Z,{className:"folder-icon"}),t.jsx("span",{className:"folder-name",children:e.name}),w===e.id&&t.jsx(d.Z,{className:"selected-icon"})]}),e.isExpanded&&e.children.map(e=>ee(e,a+1))]},e.id);return(0,r.useEffect)(()=>{let e=async()=>{let e=await Y();k(e)};e()},[]),(0,t.jsxs)("div",{className:"google-drive-explorer",children:[t.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          .google-drive-explorer {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid rgba(255, 179, 51, 0.3);
            border-radius: 16px;
            overflow: hidden;
            height: 100%;
            max-height: 500px;
            display: flex;
            flex-direction: column;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .drive-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 2px solid rgba(255, 179, 51, 0.2);
            background: linear-gradient(135deg, #FFB333, #F87239);
            flex-shrink: 0;
            color: #FFFFFF;
          }
          .drive-search {
            position: relative;
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          .drive-search input {
            width: 100%;
            max-width: 100%;
            padding: 0.875rem 0.875rem 0.875rem 2.75rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            font-size: 0.925rem;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            color: #374151;
            font-weight: 500;
          }
          .drive-search input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
            background: #FFFFFF;
          }
          .drive-search input::placeholder {
            color: #9CA3AF;
            font-weight: 500;
          }
          .drive-search-icon {
            position: absolute;
            left: 0.875rem;
            top: 50%;
            transform: translateY(-50%);
            color: #FFFFFF;
            width: 20px;
            height: 20px;
          }
          .drive-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            justify-content: space-between;
          }
          .drive-action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            color: #374151;
            backdrop-filter: blur(10px);
          }
          .drive-action-btn:hover {
            border-color: rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
            background: #FFFFFF;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          }
          .drive-action-btn.primary {
            background: rgba(255, 255, 255, 0.95);
            color: #F87239;
            border-color: rgba(255, 255, 255, 0.8);
            font-weight: 700;
          }
          .drive-action-btn.primary:hover {
            background: #FFFFFF;
            color: #DC2626;
          }
          .drive-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .selected-folder-info {
            background: #eff6ff;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #1e40af;
          }
          .drive-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            min-height: 0;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          }
          .folder-tree-panel {
            width: 50%;
            border-right: 2px solid rgba(255, 179, 51, 0.2);
            padding: 1rem;
            overflow-y: auto;
            max-height: 100%;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.5);
          }
          .folder-tree {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            max-height: 350px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 179, 51, 0.3) transparent;
          }
          .folder-tree::-webkit-scrollbar {
            width: 8px;
          }
          .folder-tree::-webkit-scrollbar-track {
            background: rgba(255, 179, 51, 0.1);
            border-radius: 4px;
          }
          .folder-tree::-webkit-scrollbar-thumb {
            background: rgba(255, 179, 51, 0.3);
            border-radius: 4px;
          }
          .folder-tree::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 179, 51, 0.5);
          }
          .files-panel {
            width: 50%;
            padding: 1rem;
            overflow-y: auto;
            max-height: 100%;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.3);
          }
          .drive-file-list {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            max-height: 550px;
            padding: 0;
          }
          .panel-title {
            font-weight: 700;
            color: #FFB333;
            margin-bottom: 1rem;
            font-size: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid rgba(255, 179, 51, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            letter-spacing: -0.025em;
          }
          .panel-title-text {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .new-folder-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.2s ease;
          }
          .new-folder-btn:hover {
            background: #374151;
            transform: translateY(-1px);
          }
          .folder-tree-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 0.25rem;
          }
          .folder-tree-item:hover {
            background: #f3f4f6;
          }
          .folder-tree-item.selected {
            background: #000000;
            color: #ffffff;
          }
          .expand-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            color: inherit;
          }
          .folder-icon {
            width: 18px;
            height: 18px;
            color: #3b82f6;
            flex-shrink: 0;
          }
          .folder-tree-item.selected .folder-icon {
            color: #ffffff;
          }
          .folder-name {
            flex: 1;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .selected-icon {
            width: 16px;
            height: 16px;
            color: #10b981;
          }
          .drive-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
            font-size: 0.9rem;
          }
          .drive-error {
            padding: 2rem;
            text-align: center;
            color: #dc2626;
            background: #fef2f2;
            border-bottom: 1px solid #fecaca;
          }

          .drive-file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .drive-file-item:hover {
            background: #f9fafb;
          }
          .drive-file-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .drive-file-icon.folder {
            color: #3b82f6;
          }
          .drive-file-icon.file {
            color: #6b7280;
          }
          .drive-file-info {
            flex: 1;
            min-width: 0;
          }
          .drive-file-name {
            font-weight: 500;
            color: #000000;
            margin-bottom: 0.25rem;
            word-break: break-word;
            font-size: 0.875rem;
          }
          .drive-file-meta {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .drive-empty {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #6b7280;
          }
          .drive-empty-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 1rem;
            color: #d1d5db;
          }
          .search-results {
            width: 100%;
            padding: 1rem;
          }
          .search-info {
            padding: 0.75rem;
            background: #eff6ff;
            border-bottom: 1px solid #bfdbfe;
            color: #1e40af;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
          }
          .dialog-content {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
          }
          .dialog-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #000000;
          }
          .dialog-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 1rem;
          }
          .dialog-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .file-input {
            margin-bottom: 1rem;
          }
          .file-input input {
            width: 100%;
            padding: 0.75rem;
            border: 2px dashed #e5e7eb;
            border-radius: 6px;
            font-size: 0.9rem;
          }
          .upload-info {
            background: #f0f9f0;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: #166534;
          }
          .dialog-actions {
            display: flex;
            gap: 1rem;
          }
          .dialog-btn {
            flex: 1;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid;
          }
          .dialog-btn-primary {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .dialog-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .dialog-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .dialog-btn-secondary {
            background: #ffffff;
            color: #000000;
            border-color: #e5e7eb;
          }
          .dialog-btn-secondary:hover {
            border-color: #000000;
          }
        `}}),(0,t.jsxs)("div",{className:"drive-header",children:[(0,t.jsxs)("div",{className:"drive-search",children:[t.jsx(o.Z,{className:"drive-search-icon"}),t.jsx("input",{type:"text",placeholder:"Search files and folders...",value:S,onChange:e=>{let a=e.target.value;if(_(a),a.trim()){let e=setTimeout(()=>G(a),300);return()=>clearTimeout(e)}Z(!1),b([])}})]}),w&&(0,t.jsxs)("div",{className:"selected-folder-info",children:[t.jsx(n.Z,{style:{width:"16px",height:"16px"}}),(0,t.jsxs)("span",{children:["Selected: ",t.jsx("strong",{children:C})]})]}),t.jsx("div",{className:"drive-actions",children:w&&(0,t.jsxs)("button",{onClick:()=>U(!0),className:"drive-action-btn primary",children:[t.jsx(c.Z,{style:{width:"16px",height:"16px"}}),"Upload to ",C]})})]}),(0,t.jsxs)("div",{className:"drive-content",children:[L&&t.jsx("div",{className:"drive-error",children:(0,t.jsxs)("p",{children:["Error: ",L]})}),E?(0,t.jsxs)("div",{className:"search-results",children:[(0,t.jsxs)("div",{className:"search-info",children:['Showing search results for "',S,'"']}),v?t.jsx("div",{className:"drive-loading",children:t.jsx("div",{children:"Searching..."})}):0===x.length?(0,t.jsxs)("div",{className:"drive-empty",children:[t.jsx(m.Z,{className:"drive-empty-icon"}),t.jsx("p",{children:"No files found"})]}):t.jsx("div",{className:"drive-file-list",children:x.map(a=>(0,t.jsxs)("div",{className:"drive-file-item",onClick:()=>{"application/vnd.google-apps.folder"===a.mimeType?q(a.id,a.name):e&&e(a)},children:[t.jsx("div",{className:`drive-file-icon ${"application/vnd.google-apps.folder"===a.mimeType?"folder":"file"}`,children:"application/vnd.google-apps.folder"===a.mimeType?t.jsx(n.Z,{}):t.jsx(m.Z,{})}),(0,t.jsxs)("div",{className:"drive-file-info",children:[t.jsx("div",{className:"drive-file-name",children:a.name}),t.jsx("div",{className:"drive-file-meta",children:"application/vnd.google-apps.folder"===a.mimeType?"Folder":"File"})]})]},a.id))})]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("div",{className:"folder-tree-panel",children:[(0,t.jsxs)("h3",{className:"panel-title",children:[t.jsx("span",{className:"panel-title-text",children:"\uD83D\uDCC1 Folder Structure"}),h&&(0,t.jsxs)("button",{onClick:()=>D(!0),className:"new-folder-btn",children:[t.jsx(g.Z,{style:{width:"14px",height:"14px"}}),"New Folder"]})]}),v?t.jsx("div",{className:"drive-loading",children:t.jsx("div",{children:"Loading folders..."})}):0===y.length?(0,t.jsxs)("div",{className:"drive-empty",children:[t.jsx(n.Z,{className:"drive-empty-icon"}),t.jsx("p",{children:"No folders found"})]}):t.jsx("div",{className:"folder-tree",children:y.map(e=>ee(e))})]}),(0,t.jsxs)("div",{className:"files-panel",children:[(0,t.jsxs)("h3",{className:"panel-title",children:["\uD83D\uDCC4 Files ",C&&`in "${C}"`]}),w?t.jsx("div",{children:t.jsx("div",{className:"drive-file-list",children:x.filter(e=>"application/vnd.google-apps.folder"!==e.mimeType).map(a=>(0,t.jsxs)("div",{className:"drive-file-item",onClick:()=>e&&e(a),children:[t.jsx(m.Z,{className:"drive-file-icon file"}),(0,t.jsxs)("div",{className:"drive-file-info",children:[t.jsx("div",{className:"drive-file-name",children:a.name}),t.jsx("div",{className:"drive-file-meta",children:a.size?`${Math.round(parseInt(a.size)/1024)} KB`:"File"})]})]},a.id))})}):(0,t.jsxs)("div",{className:"drive-empty",children:[t.jsx(m.Z,{className:"drive-empty-icon"}),t.jsx("p",{children:"Select a folder to view its files"})]})]})]})]}),T&&t.jsx("div",{className:"dialog-overlay",onClick:()=>D(!1),children:(0,t.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[t.jsx("h3",{className:"dialog-title",children:"Create New Folder"}),t.jsx("input",{type:"text",className:"dialog-input",placeholder:"Folder name",value:B,onChange:e=>R(e.target.value),onKeyPress:e=>{"Enter"===e.key&&X()},autoFocus:!0}),(0,t.jsxs)("div",{className:"dialog-actions",children:[t.jsx("button",{onClick:()=>D(!1),className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),t.jsx("button",{onClick:X,className:"dialog-btn dialog-btn-primary",disabled:!B.trim(),children:"Create"})]})]})}),$&&t.jsx("div",{className:"dialog-overlay",onClick:()=>U(!1),children:(0,t.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[t.jsx("h3",{className:"dialog-title",children:"Upload File"}),(0,t.jsxs)("div",{className:"upload-info",children:[t.jsx("strong",{children:"Upload to:"})," ",C]}),t.jsx("div",{className:"file-input",children:t.jsx("input",{type:"file",multiple:!0,onChange:e=>{let a=e.target.files;a&&M(Array.from(a))},accept:"*/*"})}),I.length>0&&(0,t.jsxs)("div",{style:{marginBottom:"1rem",fontSize:"0.875rem",color:"#6b7280"},children:[t.jsx("div",{style:{marginBottom:"0.5rem"},children:(0,t.jsxs)("strong",{children:["Selected ",I.length," file",1===I.length?"":"s",":"]})}),t.jsx("div",{style:{maxHeight:"150px",overflowY:"auto",background:"#f9fafb",padding:"0.5rem",borderRadius:"4px",border:"1px solid #e5e7eb"},children:I.map((e,a)=>(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.25rem 0",borderBottom:a<I.length-1?"1px solid #e5e7eb":"none"},children:[t.jsx("span",{style:{flex:1,marginRight:"0.5rem",fontSize:"0.8rem"},children:e.name}),(0,t.jsxs)("span",{style:{fontSize:"0.75rem",color:"#6b7280"},children:["(",Math.round(e.size/1024)," KB)"]}),t.jsx("button",{onClick:()=>{let e=I.filter((e,i)=>i!==a);M(e)},style:{marginLeft:"0.5rem",background:"#ef4444",color:"#ffffff",border:"none",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.7rem",cursor:"pointer"},children:"Remove"})]},a))}),(0,t.jsxs)("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#6b7280"},children:["Total size: ",(0,t.jsxs)("strong",{children:[Math.round(I.reduce((e,a)=>e+a.size,0)/1024)," KB"]})]})]}),A&&O.total>0&&(0,t.jsxs)("div",{style:{marginBottom:"1rem",padding:"0.75rem",background:"#f0f9ff",border:"1px solid #3b82f6",borderRadius:"6px"},children:[(0,t.jsxs)("div",{style:{marginBottom:"0.5rem",fontSize:"0.85rem",fontWeight:"600",color:"#1e40af"},children:["Upload Progress: ",O.uploaded," of ",O.total," files"]}),t.jsx("div",{style:{width:"100%",height:"8px",background:"#e5e7eb",borderRadius:"4px",overflow:"hidden",marginBottom:"0.5rem"},children:t.jsx("div",{style:{width:`${O.uploaded/O.total*100}%`,height:"100%",background:"#3b82f6",transition:"width 0.3s ease"}})}),O.currentFile&&"Complete"!==O.currentFile&&(0,t.jsxs)("div",{style:{fontSize:"0.8rem",color:"#6b7280"},children:["Currently uploading: ",t.jsx("strong",{children:O.currentFile})]})]}),(0,t.jsxs)("div",{className:"dialog-actions",children:[t.jsx("button",{onClick:()=>{U(!1),M([])},className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),t.jsx("button",{onClick:()=>{I.length>0&&w&&Q(I,w)},className:"dialog-btn dialog-btn-primary",disabled:0===I.length||A,children:A?O.total>1?`Uploading ${O.uploaded}/${O.total} files...`:"Uploading...":`Upload ${I.length} file${1===I.length?"":"s"}`})]})]})})]})}},3578:(e,a,i)=>{i.d(a,{Z:()=>x});var t=i(3854),r=i(4218);i(3638);var s=i(199),l=i(8604),n=i(2150),d=i(856),o=i(1888),c=i(6835),m=i(9072),g=i(4063),p=i(4791),f=i(9402);i(6837),i(4937),i(485),i(9866),i(4358),i(8930),i(7690);let h=[{value:"low",label:"Low",icon:"",color:"#10b981"},{value:"medium",label:"Medium",icon:"",color:"#f59e0b"},{value:"high",label:"High",icon:"",color:"#ef4444"},{value:"urgent",label:"Urgent",icon:"",color:"#dc2626"}],u=[{value:"todo",label:"To Do",icon:"",color:"#e5e7eb"},{value:"in_progress",label:"In Progress",icon:"",color:"#dbeafe"},{value:"review",label:"Review",icon:"",color:"#fef3c7"},{value:"done",label:"Done",icon:"",color:"#d1fae5"}];function x({task:e,users:a,onClose:i,onSave:x,onStatusChange:b,onDelete:v}){var j,y,k;let[w,N]=(0,r.useState)(!1),[C,F]=(0,r.useState)(!1),[S,_]=(0,r.useState)("task"),E=(0,r.useCallback)(e=>{if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let a=new Date(e);return isNaN(a.getTime())?"":a.toISOString().split("T")[0]},[]),[Z,L]=(0,r.useState)({name:e.name,description:e.description,priority:e.priority,due_date:E(e.due_date),start_date:E(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")});(0,r.useEffect)(()=>{L({name:e.name,description:e.description,priority:e.priority,due_date:E(e.due_date),start_date:E(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")})},[e,E]);let z=e=>e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"Not set",T=e=>new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),D=async()=>{try{let e=e=>{if(!e)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let a=new Date(e);return isNaN(a.getTime())?null:a.toISOString().split("T")[0]},a={...Z,tags:Z.tags,assignee_ids:Z.assignee_ids&&Z.assignee_ids.length>0?Z.assignee_ids:[],due_date:e(Z.due_date),start_date:e(Z.start_date)};console.log("Saving task with assignee_ids:",a.assignee_ids),console.log("Saving task with formatted dates:",{due_date:a.due_date,start_date:a.start_date}),await x(a),N(!1)}catch(e){console.error("Failed to save task:",e)}},B=async a=>{b&&await b(e.id,a)},R=(j=e.priority,h.find(e=>e.value===j)||h[1]),$=(y=e.status,u.find(e=>e.value===y)||u[0]),U=!!(k=e.due_date)&&new Date(k)<new Date,I=[{id:"task",label:"Task",icon:t.jsx(s.Z,{style:{width:"16px",height:"16px"}})},{id:"comments",label:"Comments & Files",icon:t.jsx(l.Z,{style:{width:"16px",height:"16px"}})}];return w?t.jsx("input",{type:"text",value:Z.name,onChange:e=>L({...Z,name:e.target.value}),className:"form-input",style:{fontSize:"1.5rem",fontWeight:"bold",marginBottom:"1rem"}}):t.jsx("h2",{className:"task-title",children:e.name}),R.icon,R.label,$.icon,$.label,U&&n.Z,d.Z,v&&(()=>F(!0),o.Z),c.Z,I.map(e=>(0,t.jsxs)("button",{onClick:()=>_(e.id),className:`tab-button ${S===e.id?"active":""}`,children:[e.icon,t.jsx("span",{children:e.label})]},e.id)),"task"===S&&(t.Fragment,w?(0,t.jsxs)("div",{className:"edit-form",children:[(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Description"}),t.jsx("textarea",{value:Z.description,onChange:e=>L({...Z,description:e.target.value}),className:"form-textarea",placeholder:"Describe what needs to be done..."})]}),(0,t.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(200px, 100%), 1fr))",gap:"1rem"},children:[(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Priority"}),t.jsx("select",{value:Z.priority,onChange:e=>L({...Z,priority:e.target.value}),className:"form-select",children:h.map(e=>(0,t.jsxs)("option",{value:e.value,children:[e.icon," ",e.label]},e.value))})]}),(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Assignees"}),t.jsx("div",{style:{border:"2px solid #e5e7eb",borderRadius:"8px",padding:"0.75rem",background:"#ffffff",minHeight:"100px",maxHeight:"150px",overflowY:"auto"},children:0===a.length?t.jsx("div",{style:{color:"#6b7280",fontStyle:"italic",textAlign:"center",padding:"1rem"},children:"No team members available"}):a.map(e=>(0,t.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem",cursor:"pointer",borderRadius:"4px",transition:"background-color 0.2s ease",marginBottom:"0.2rem"},onMouseOver:e=>e.currentTarget.style.backgroundColor="#f3f4f6",onMouseOut:e=>e.currentTarget.style.backgroundColor="transparent",children:[t.jsx("input",{type:"checkbox",checked:Z.assignee_ids.includes(e.id),onChange:a=>{a.target.checked?L({...Z,assignee_ids:[...Z.assignee_ids,e.id]}):L({...Z,assignee_ids:Z.assignee_ids.filter(a=>a!==e.id)})},style:{marginRight:"0.5rem",accentColor:"#000000"}}),t.jsx("div",{style:{width:"28px",height:"28px",borderRadius:"50%",background:Z.assignee_ids.includes(e.id)?"#000000":"#f3f4f6",color:Z.assignee_ids.includes(e.id)?"#ffffff":"#000000",border:"2px solid #000000",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:"600"},children:e.name.charAt(0).toUpperCase()}),t.jsx("span",{style:{fontSize:"0.85rem",fontWeight:"500",color:Z.assignee_ids.includes(e.id)?"#000000":"#374151"},children:e.name})]},e.id))}),Z.assignee_ids.length>0&&t.jsx("div",{style:{marginTop:"0.5rem",padding:"0.4rem",background:"#f0f9ff",border:"1px solid #3b82f6",borderRadius:"4px",fontSize:"0.8rem",color:"#1e40af"},children:(0,t.jsxs)("strong",{children:[Z.assignee_ids.length," assignee",1===Z.assignee_ids.length?"":"s"," selected"]})})]}),(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Created by"}),t.jsx("input",{type:"text",value:e.created_by?.name||"Unknown User",className:"form-input",disabled:!0,style:{backgroundColor:"#f9fafb",color:"#6b7280",cursor:"not-allowed"}})]})]}),(0,t.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(250px, 100%), 1fr))",gap:"1rem"},children:[(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Start Date"}),t.jsx("input",{type:"date",value:Z.start_date,onChange:e=>L({...Z,start_date:e.target.value}),className:"form-input"})]}),(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Due Date"}),t.jsx("input",{type:"date",value:Z.due_date,onChange:e=>L({...Z,due_date:e.target.value}),className:"form-input"})]})]}),(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Tags"}),t.jsx("input",{type:"text",value:Z.tags,onChange:e=>L({...Z,tags:e.target.value}),className:"form-input",placeholder:"frontend, urgent, bug (comma-separated)"})]}),(0,t.jsxs)("div",{className:"form-actions",children:[t.jsx("button",{onClick:()=>N(!1),className:"btn btn-secondary",children:"Cancel"}),t.jsx("button",{onClick:D,className:"btn btn-primary",children:"Save Changes"})]})]}):(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{className:`task-description ${e.description?"":"empty"}`,children:e.description||"No description provided."}),(0,t.jsxs)("div",{className:"task-details-grid",children:[(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:e.assignees&&e.assignees.length>1?"Assignees":"Assignee"}),t.jsx("div",{className:"task-detail-value",children:e.assignees&&e.assignees.length>0?t.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"},children:e.assignees.map((a,i)=>(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[t.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#000000",color:"#ffffff",border:"2px solid #ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:"600",marginLeft:i>0?"-8px":"0",zIndex:e.assignees.length-i,position:"relative"},children:a.name.charAt(0).toUpperCase()}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"500"},children:a.name}),i<e.assignees.length-1&&e.assignees.length>1&&t.jsx("span",{style:{color:"#6b7280"},children:","})]},a.id))}):e.assignee?e.assignee.name:"Unassigned"})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Due Date"}),t.jsx("div",{className:"task-detail-value",children:z(e.due_date)})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(p.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Start Date"}),t.jsx("div",{className:"task-detail-value",children:z(e.start_date)})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(p.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Estimated Hours"}),t.jsx("div",{className:"task-detail-value",children:e.estimated_hours?`${e.estimated_hours}h`:"Not set"})]})]}),e.tags_list&&e.tags_list.length>0&&(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(f.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Tags"}),t.jsx("div",{className:"task-detail-value",children:e.tags_list.join(", ")})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Created by"}),t.jsx("div",{className:"task-detail-value",children:e.created_by?.name||"Unknown User"})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Created"}),t.jsx("div",{className:"task-detail-value",children:T(e.created_at)})]})]}),(0,t.jsxs)("div",{className:"task-detail-item",children:[t.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,t.jsxs)("div",{className:"task-detail-content",children:[t.jsx("div",{className:"task-detail-label",children:"Last Updated"}),t.jsx("div",{className:"task-detail-value",children:T(e.updated_at)})]})]})]}),!w&&b&&(0,t.jsxs)("div",{className:"task-status-actions-inline",children:[t.jsx("div",{className:"status-actions-title",children:"Change Status"}),t.jsx("div",{className:"status-buttons",children:u.map(a=>(0,t.jsxs)("button",{onClick:()=>B(a.value),className:`status-btn ${a.value===e.status?"current":""}`,disabled:a.value===e.status,children:[t.jsx("span",{children:a.icon}),t.jsx("span",{children:a.label})]},a.value))})]})]})),C&&(()=>F(!1),e.name),null}},3881:(e,a,i)=>{i.r(a),i.d(a,{default:()=>r});var t=i(8531);let r=e=>{let a=(0,t.fillMetadataSegment)(".",e.params,"favicon.ico");return[{type:"image/x-icon",sizes:"16x16",url:a+""}]}},4448:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m4.5 12.75 6 6 9-13.5"}))}),s=r},789:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"}))}),s=r},7689:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m8.25 4.5 7.5 7.5-7.5 7.5"}))}),s=r},9866:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"}))}),s=r},485:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"}))}),s=r},2150:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))}),s=r},2432:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"}))}),s=r},8930:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"}))}),s=r},856:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"}))}),s=r},9402:(e,a,i)=>{i.d(a,{Z:()=>s});var t=i(4218);let r=t.forwardRef(function({title:e,titleId:a,...i},r){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},i),e?t.createElement("title",{id:a},e):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"}),t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 6h.008v.008H6V6Z"}))}),s=r}};